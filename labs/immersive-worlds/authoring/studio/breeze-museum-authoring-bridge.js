import { StudioShell } from './studio-shell.js';
import { ConfigStore } from '../config-store.js';

const BRIDGE = 'BREEZE_MUSEUM_BRIDGE';
const ENTITY_ID = 'entity.installation.viento-sobre-marmol';
const LEDGER_KEY = 'iw.museum.validation.v1';
const FLOW_VERSION = 1;
const pending = new Map();
let seq = 0;
let bridgeReady = false;
let readyWindow = null;
let liveState = null;
let savedState = null;

function iframe() { return document.querySelector('iframe[data-nested-room-studio="room.breeze"]'); }
function sleep(ms) { return new Promise((resolve) => setTimeout(resolve, ms)); }
async function waitReady(timeout = 16000) {
  const start = performance.now();
  while (performance.now() - start < timeout) {
    const frame = iframe();
    if (bridgeReady && frame?.contentWindow && frame.contentWindow === readyWindow) return true;
    await sleep(80);
  }
  return false;
}
function request(type, payload = {}, timeout = 18000) {
  return new Promise(async (resolve, reject) => {
    if (!(await waitReady())) return reject(new Error('Breeze Studio no está listo.'));
    const frame = iframe();
    if (!frame?.contentWindow) return reject(new Error('Breeze Studio no está montado.'));
    const requestId = `breeze-${Date.now()}-${++seq}`;
    const timer = setTimeout(() => { pending.delete(requestId); reject(new Error(`Breeze no respondió a ${type}.`)); }, timeout);
    pending.set(requestId, { resolve, reject, timer });
    frame.contentWindow.postMessage({ bridge: BRIDGE, type, requestId, ...payload }, '*');
  });
}
function cleanState(state) {
  if (!state) return null;
  return {
    experience: state.experience || 'cloth', autoRotate: Boolean(state.autoRotate),
    runSimulation: state.runSimulation !== false, wireframe: Boolean(state.wireframe),
    background: { ...(state.background || {}), file: undefined },
    cloth: { ...(state.cloth || {}), file: undefined },
    object: { ...(state.object || {}), uploadedFile: undefined },
    physics: { ...(state.physics || {}) }, panelOpen: state.panelOpen !== false
  };
}
function syncConfig(studio, state, dirty = true) {
  if (!studio?.config || !state) return;
  studio.config.entities ||= {};
  studio.config.entities[ENTITY_ID] ||= {};
  studio.config.entities[ENTITY_ID].breeze = cleanState(state);
  if (dirty) studio.dirty = true;
}
function loadLedger() {
  try { const raw = JSON.parse(localStorage.getItem(LEDGER_KEY) || 'null'); if (raw?.version === FLOW_VERSION) return raw; } catch { /* */ }
  return { version: FLOW_VERSION, pieces: {}, route: {} };
}
function saveLedger(ledger) { localStorage.setItem(LEDGER_KEY, JSON.stringify(ledger)); }
function hashString(value) { let h = 2166136261; const s = String(value || ''); for (let i=0;i<s.length;i+=1){h^=s.charCodeAt(i);h=Math.imul(h,16777619);} return (h>>>0).toString(36); }
function stable(value) { if (Array.isArray(value)) return value.map(stable); if (!value || typeof value !== 'object') return value; return Object.fromEntries(Object.keys(value).filter((k)=>value[k]!==undefined).sort().map((k)=>[k,stable(value[k])])); }
function pieceHash(studio) {
  const entity = (studio.world.entities || []).find((item) => item.id === ENTITY_ID) || null;
  const authored = studio.config.entities?.[ENTITY_ID] || null;
  return hashString(JSON.stringify(stable({ id: ENTITY_ID, kind: entity?.kind || null, baseMedia: entity?.content?.media || null, authored })));
}
function evidence(studio) { const ledger=loadLedger(); const row=ledger.pieces?.[ENTITY_ID]||{}; const hash=pieceHash(studio); return { hash, preview:row.previewHash===hash, saved:row.savedHash===hash, validated:row.validatedHash===hash }; }
function writeEvidence(studio, level) {
  const ledger=loadLedger(); const hash=pieceHash(studio); const now=new Date().toISOString(); const row={...(ledger.pieces?.[ENTITY_ID]||{})};
  row.previewHash=hash; row.previewAt ||= now;
  if(level==='saved'||level==='validated'){row.savedHash=hash;row.savedAt=now;}
  if(level==='validated'){row.validatedHash=hash;row.validatedAt=now;}
  ledger.pieces ||= {}; ledger.pieces[ENTITY_ID]=row; ledger.route={}; saveLedger(ledger);
}
function invalidate(studio) { const ledger=loadLedger(); if(ledger.pieces) delete ledger.pieces[ENTITY_ID]; ledger.route={}; saveLedger(ledger); studio.dirty=true; }

window.addEventListener('message', (event) => {
  const msg=event.data; if(!msg||msg.bridge!==BRIDGE) return;
  if(msg.type==='BREEZE_BRIDGE_READY'){
    bridgeReady=true; readyWindow=event.source; liveState=msg.state||liveState;
    const studio=window.__IW_STUDIO; if(studio&&liveState) syncConfig(studio,liveState,false);
    if(savedState && event.source) event.source.postMessage({bridge:BRIDGE,type:'BREEZE_APPLY_STATE',requestId:`restore-${Date.now()}`,state:savedState},'*');
  }
  if(msg.type==='BREEZE_STATE_CHANGED'){
    liveState={...(liveState||{}),...(msg.state||{})}; const studio=window.__IW_STUDIO;
    if(studio&&studio.selectedId===ENTITY_ID){syncConfig(studio,liveState);invalidate(studio);}
  }
  if(msg.requestId&&pending.has(msg.requestId)){
    const p=pending.get(msg.requestId); pending.delete(msg.requestId); clearTimeout(p.timer);
    if(msg.type==='BREEZE_BRIDGE_ERROR') p.reject(new Error(msg.error||'Breeze bridge error')); else p.resolve(msg);
  }
});

const originalPreview=StudioShell.prototype._validationPreviewPiece;
StudioShell.prototype._validationPreviewPiece=async function breezePreview(){
  if(this.selectedId!==ENTITY_ID) return originalPreview.call(this);
  this.busy='preview'; this.render();
  try{
    await this.onReveal(ENTITY_ID); await sleep(180);
    if(!(await waitReady())) throw new Error('Breeze Studio no terminó de abrir.');
    const stateMsg=await request('BREEZE_GET_STATE'); liveState=stateMsg.state; syncConfig(this,liveState);
    const check=await request('BREEZE_VALIDATE'); if(!check.result?.ok) throw new Error('La sala Breeze no confirma todos sus subsistemas.');
    writeEvidence(this,'preview'); this._say('PREVIEW OK · Breeze Studio visible y operativo. Fondo, pañuelo, escultura y efectos se leen desde la sala.');
  }catch(error){this._say(`PREVIEW CON ERROR · ${String(error?.message||error)}`,true);}finally{this.busy=null;this.render();}
};

const originalSave=StudioShell.prototype._validationSavePiece;
StudioShell.prototype._validationSavePiece=async function breezeSave(){
  if(this.selectedId!==ENTITY_ID) return originalSave.call(this);
  if(!evidence(this).preview) return this._say('Primero previsualiza esta versión de Breeze.',true);
  try{
    const stateMsg=await request('BREEZE_GET_STATE'); liveState=stateMsg.state; savedState=stateMsg.state; syncConfig(this,savedState,false);
    ConfigStore.save(this.config); this.dirty=false; this.savedAt=new Date(); writeEvidence(this,'saved'); window.__IW_BREEZE_SAVED_STATE=savedState;
    this._say('BREEZE GUARDADO · experiencia, fondo, pañuelo, escultura y física quedan guardados para esta sesión. Falta VALIDAR PIEZA.'); this.render();
  }catch(error){this._say(`NO SE PUDO GUARDAR BREEZE · ${String(error?.message||error)}`,true);}
};

const originalValidate=StudioShell.prototype._validationValidatePiece;
StudioShell.prototype._validationValidatePiece=async function breezeValidate(){
  if(this.selectedId!==ENTITY_ID) return originalValidate.call(this);
  if(!evidence(this).saved||!savedState) return this._say('Primero guarda esta versión de Breeze.',true);
  try{
    await request('BREEZE_APPLY_STATE',{state:savedState},26000); const check=await request('BREEZE_VALIDATE');
    if(!check.result?.ok) throw new Error('Breeze no pudo restaurar/confirmar todos sus subsistemas.');
    syncConfig(this,savedState,false); writeEvidence(this,'validated'); const ok=Object.entries(check.result.checks||{}).filter(([,v])=>v).map(([k])=>k).join(', ');
    this._say(`BREEZE VALIDADO · restauración funcional confirmada (${ok}).`); this.render();
  }catch(error){this._say(`VALIDACIÓN BREEZE FALLIDA · ${String(error?.message||error)}`,true);}
};

window.__IW_BREEZE_AUTHORING_BRIDGE={entityId:ENTITY_ID,get liveState(){return liveState;},get savedState(){return savedState;},request,evidence:()=>window.__IW_STUDIO?evidence(window.__IW_STUDIO):null};
