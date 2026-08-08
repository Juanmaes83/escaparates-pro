// CASEBOOK PRO V3 — Spatial Worlds P0 hardening
// Additive runtime over the frozen V2 engine. V1/V2 are not modified.
(function(){
'use strict';

const LEGACY_KEY='casebook-pro-v3-world-v1';
const ACTIVE_KEY='casebook-pro-v3:active-world';
const WORLD_PREFIX='casebook-pro-v3:world:';
const DB_NAME='casebook-pro-v3-assets';
const DB_VERSION=1;
const STORE='assets';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const uid=p=>p+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,9);
const clone=v=>JSON.parse(JSON.stringify(v));
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const blobToDataURL=blob=>new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(blob)});
const dataURLToBlob=data=>{const [head,body]=String(data).split(',');const mime=(head.match(/data:([^;]+)/)||[])[1]||'application/octet-stream';const bin=atob(body||'');const bytes=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);return new Blob([bytes],{type:mime})};

let world=freshWorld();
let placingHotspot=false, placingMapNode=false, hotspotDraft=null, activeMapChapterId=null, transitionBusy=false;
let baseExport=null, baseImport=null, apiPatched=false, mapDataUrlCache=null, hotspotRaf=0;

function freshWorld(){
  return {version:'casebook-pro-v3',schemaVersion:2,projectId:uid('project'),worldId:uid('world'),name:'Untitled Spatial World',chapters:[],activeChapterId:null,route:[],map:{assetId:null,name:null,type:null},guide:{index:0,running:false}};
}
function qa(s,p=document){return Array.from(p.querySelectorAll(s))}
function q(s,p=document){return p.querySelector(s)}
function toast(msg,ms=2600){try{showStatus(msg,ms)}catch(_){console.log('[V3]',msg)}}
function stage(){return q('.stage')}
function preview(){return q('#preview')}
function boardApi(){try{return api()}catch(_){return null}}
function activeChapter(){return world.chapters.find(c=>c.id===world.activeChapterId)||null}

function openDb(){
  return new Promise((resolve,reject)=>{
    const req=indexedDB.open(DB_NAME,DB_VERSION);
    req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE)};
    req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
  });
}
async function assetPut(key,blob){const db=await openDb();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(blob,key);tx.oncomplete=()=>{db.close();resolve(true)};tx.onerror=()=>{db.close();reject(tx.error)}})}
async function assetGet(key){const db=await openDb();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readonly'),req=tx.objectStore(STORE).get(key);req.onsuccess=()=>{db.close();resolve(req.result||null)};req.onerror=()=>{db.close();reject(req.error)}})}
async function assetDelete(key){const db=await openDb();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).delete(key);tx.oncomplete=()=>{db.close();resolve(true)};tx.onerror=()=>{db.close();reject(tx.error)}})}

function normalizeHotspot(h){
  h.id=h.id||uid('hotspot');h.type=h.type||'portal';h.title=h.title||'Hotspot';h.body=h.body||'';
  h.x=clamp(Number(h.x??50),0,100);h.y=clamp(Number(h.y??50),0,100);h.transition=h.transition||'zoom-in';h.visible=h.visible!==false;
  if(!h.anchor)h.anchor={type:'scene',x:h.x/100,y:h.y/100};
  h.anchor.x=clamp(Number(h.anchor.x??h.x/100),0,1);h.anchor.y=clamp(Number(h.anchor.y??h.y/100),0,1);
  return h;
}
function normalizeWorld(w){
  if(!w||w.version!=='casebook-pro-v3')w=freshWorld();
  w.schemaVersion=2;w.projectId=w.projectId||uid('project');w.worldId=w.worldId||uid('world');w.name=w.name||'Untitled Spatial World';
  w.chapters=Array.isArray(w.chapters)?w.chapters:[];w.route=Array.isArray(w.route)?w.route:[];w.map=w.map||{assetId:null,name:null,type:null};w.guide=w.guide||{index:0,running:false};
  w.chapters.forEach((c,i)=>{c.id=c.id||uid('chapter');c.name=c.name||`Chapter ${i+1}`;c.hotspots=Array.isArray(c.hotspots)?c.hotspots.map(normalizeHotspot):[];c.mapX=clamp(Number(c.mapX??(18+i*18)),0,100);c.mapY=clamp(Number(c.mapY??55),0,100)});
  w.route=w.route.filter(id=>w.chapters.some(c=>c.id===id));for(const c of w.chapters)if(!w.route.includes(c.id))w.route.push(c.id);
  if(!w.activeChapterId||!w.chapters.some(c=>c.id===w.activeChapterId))w.activeChapterId=w.chapters[0]?.id||null;
  return w;
}
function metadataState(){
  const safe=clone(world);
  if(safe.map)delete safe.map.dataUrl;
  safe.chapters.forEach(c=>{if(c.state)(c.state.items||[]).forEach(it=>{if(it.pro?.media?.url?.startsWith('blob:'))delete it.pro.media.url})});
  return safe;
}
function saveWorld(){
  try{world=normalizeWorld(world);localStorage.setItem(ACTIVE_KEY,world.worldId);localStorage.setItem(WORLD_PREFIX+world.worldId,JSON.stringify(metadataState()))}catch(e){console.warn('V3 metadata persistence skipped',e)}
}
function loadWorld(){
  try{
    const active=localStorage.getItem(ACTIVE_KEY);
    if(active){const raw=localStorage.getItem(WORLD_PREFIX+active);if(raw){world=normalizeWorld(JSON.parse(raw));return}}
    const legacy=localStorage.getItem(LEGACY_KEY);
    if(legacy){world=normalizeWorld(JSON.parse(legacy));saveWorld();localStorage.removeItem(LEGACY_KEY);return}
  }catch(e){console.warn('V3 load failed',e)}
  world=normalizeWorld(world);
}
async function warmMapAsset(){
  mapDataUrlCache=null;
  if(world.map?.dataUrl){mapDataUrlCache=world.map.dataUrl;return}
  if(!world.map?.assetId)return;
  try{const blob=await assetGet(world.map.assetId);if(blob)mapDataUrlCache=await blobToDataURL(blob)}catch(e){console.warn('V3 map asset warm failed',e)}
}

function baseSnapshot(){try{return baseExport?clone(baseExport()):null}catch(e){console.warn('V3 snapshot failed',e);return null}}
async function baseRestore(st){
  if(!baseImport||!st)return false;
  const clean=clone(st);delete clean.v3World;
  const ok=baseImport(clean);try{v2RenderZones();v2RenderStory()}catch(_){}
  await sleep(120);return ok;
}
function persistCurrent(){
  const c=activeChapter();if(c){const s=baseSnapshot();if(s)c.state=s}
  world.name=q('#v3WorldName')?.value.trim()||world.name;saveWorld();
}
function exportWorldState(){
  persistCurrent();
  const out=clone(world);
  if(out.map&&mapDataUrlCache)out.map.dataUrl=mapDataUrlCache;
  return out;
}
async function importWorldState(input,{restoreActive=true}={}){
  if(!input||input.version!=='casebook-pro-v3')throw new Error('Invalid Spatial World state');
  world=normalizeWorld(clone(input));
  if(world.map?.dataUrl){
    const data=world.map.dataUrl;delete world.map.dataUrl;
    const key=world.map.assetId||`${world.worldId}:map`;world.map.assetId=key;
    await assetPut(key,dataURLToBlob(data));mapDataUrlCache=data;
  }else await warmMapAsset();
  saveWorld();q('#v3WorldName')&&(q('#v3WorldName').value=world.name);
  if(restoreActive&&activeChapter()?.state)await baseRestore(activeChapter().state);
  renderAll();return true;
}
function patchBaseApi(){
  if(apiPatched)return true;
  const a=boardApi();if(!a?.exportState||!a?.importState)return false;
  baseExport=a.exportState.bind(a);baseImport=a.importState.bind(a);
  a.exportState=function(){const s=clone(baseExport());s.v3World=exportWorldState();return s};
  a.importState=function(st){
    const has=st?.v3World;const clean=clone(st||{});delete clean.v3World;
    const ok=baseImport(clean);
    if(has)Promise.resolve(importWorldState(st.v3World,{restoreActive:true})).catch(e=>{console.error(e);toast('Error importando Spatial World')});
    return ok;
  };
  window.CasebookProV3={
    version:'3.0-p0',
    exportState:exportWorldState,
    importState:importWorldState,
    async exportPortableState(){return exportWorldState()},
    getWorld:()=>clone(world),
    getActiveChapter:()=>clone(activeChapter()),
    save:()=>{persistCurrent();return true}
  };
  apiPatched=true;return true;
}

function injectCss(){
const css=`
:root{--v3:#b6ff7d;--v3line:#355b40;--v3cyan:#82ddff}
.v3badge{display:inline-flex;gap:5px;align-items:center;padding:4px 7px;border:1px solid var(--v3line);background:#102016;color:#c9ffa4;border-radius:999px;font-size:8px;font-weight:900;letter-spacing:.07em}
.v3flow,.v3tabs{display:grid;grid-template-columns:repeat(4,1fr);gap:4px;margin:8px 0}.v3flow span{font-size:7.5px;text-align:center;padding:6px 2px;border-radius:6px;background:#101b14;border:1px solid #263b2b;color:#bce8c4}.v3tabs button{padding:7px 2px;font-size:8px}
.v3list{display:grid;gap:5px;margin-top:7px}.v3row{border:1px solid #2b3430;border-radius:8px;background:#0f1210;padding:7px;display:grid;grid-template-columns:1fr auto;gap:6px;align-items:center}.v3row.active{border-color:#477d55;background:#111d14}.v3row b{font-size:9.5px}.v3row small{display:block;color:#737e76;font-size:8px;margin-top:2px}.v3row .actions{display:flex;gap:4px}.v3row .actions button{padding:4px 6px;font-size:8px}.v3error{border-color:#8a3939;color:#ffb5b5}
.v3hotLayer{position:absolute;inset:0;z-index:26;pointer-events:none}.v3hotLayer.placing{pointer-events:auto;cursor:crosshair;background:rgba(130,221,255,.025)}
.v3hot{position:absolute;width:24px;height:24px;margin:-12px;border-radius:50%;border:1px solid rgba(255,255,255,.75);background:rgba(12,13,14,.82);box-shadow:0 0 0 4px rgba(130,221,255,.12),0 8px 24px rgba(0,0,0,.35);display:grid;place-items:center;color:white;font:900 8px ui-monospace,monospace;pointer-events:auto;cursor:pointer;transition:transform .18s}.v3hot:hover{transform:scale(1.18)}.v3hot.portal{border-color:#b6ff7d}.v3hot.info{border-color:#82ddff}.v3hot.media{border-color:#ffd07d}.v3hot.hiddenMarker{opacity:.15}.v3hotLabel{position:absolute;top:28px;left:50%;transform:translateX(-50%);white-space:nowrap;padding:3px 5px;border-radius:5px;background:rgba(0,0,0,.82);font-size:7px;color:#ddd;pointer-events:none}
.v3transition{position:absolute;inset:0;z-index:90;pointer-events:none;background:#090909;opacity:0;transition:opacity .35s ease}.v3transition.fade.on{opacity:1}.v3transition.blur.on{opacity:.8;backdrop-filter:blur(16px)}
.stage.v3zoom #preview{transition:transform .55s cubic-bezier(.2,.75,.2,1),filter .55s;transform:scale(2.15);filter:blur(1.5px)}.stage.v3zoomout #preview{transition:transform .55s cubic-bezier(.2,.75,.2,1),opacity .45s;transform:scale(.55);opacity:.25}.stage.v3panleft #preview{transition:transform .5s ease;transform:translateX(-32%)}.stage.v3panright #preview{transition:transform .5s ease;transform:translateX(32%)}.stage.v3whip #preview{transition:transform .28s cubic-bezier(.55,0,.9,.3),filter .28s;transform:translateX(-65%) scale(1.08);filter:blur(9px)}
.v3modalWrap{position:absolute;inset:0;z-index:88;background:rgba(3,4,4,.78);backdrop-filter:blur(12px);display:none;place-items:center}.v3modalWrap.open{display:grid}.v3modal{width:min(720px,calc(100% - 36px));max-height:84vh;overflow:auto;border:1px solid #354139;border-radius:16px;background:#101311;padding:16px;box-shadow:0 30px 100px rgba(0,0,0,.6)}.v3modal h2{margin:0 0 5px;font-size:17px}.v3modal p{font-size:10px;line-height:1.55;color:#939c96}.v3modal .close{float:right}
.v3worldmap{position:relative;height:min(64vh,620px);min-height:360px;border:1px solid #313a34;border-radius:14px;overflow:hidden;background:radial-gradient(circle at 20% 20%,#172019,#0c0f0d 70%)}.v3worldmap img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;opacity:.75}.v3mapSvg{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}.v3mapNode{position:absolute;transform:translate(-50%,-50%);width:36px;height:36px;border-radius:50%;border:2px solid #b6ff7d;background:#101710;color:#dfffc8;display:grid;place-items:center;font-size:10px;font-weight:900;cursor:pointer;z-index:3}.v3mapNode.active{background:#2a4a31}.v3mapNode span{position:absolute;top:40px;left:50%;transform:translateX(-50%);white-space:nowrap;background:rgba(8,9,8,.9);padding:3px 5px;border-radius:4px;font-size:8px;color:#ddd}.v3mapPlace{cursor:crosshair}.v3routeLegend{display:flex;gap:6px;overflow:auto;padding:8px 0}.v3routeLegend button{white-space:nowrap}
.v3guideHud{position:absolute;z-index:35;left:50%;bottom:18px;transform:translateX(-50%);display:none;align-items:center;gap:7px;padding:7px;border:1px solid #405644;border-radius:12px;background:rgba(9,14,10,.9);backdrop-filter:blur(14px)}.v3guideHud.open{display:flex}.v3guideHud .meta{min-width:150px}.v3guideHud b{display:block;font-size:9px}.v3guideHud small{color:#7f9183;font-size:8px}.v3guideHud button{padding:7px 9px;font-size:8px}
.v3coords{font:8px ui-monospace,monospace;color:#72937a}.v3split{display:grid;grid-template-columns:1fr 1fr;gap:6px}.v3hotForm{display:grid;gap:6px}.v3hotForm input,.v3hotForm select,.v3hotForm textarea{width:100%;border:1px solid #303a33;background:#0c0f0d;color:#eee;border-radius:7px;padding:7px;font-size:10px}.v3hotForm textarea{min-height:70px}.v3helpStep{border-left:2px solid #496d52;padding:8px 10px;margin:8px 0;background:#0d110e}.v3helpStep b{font-size:10px}.v3helpStep p{margin:3px 0 0}body.v3-guided .v2StoryRail{bottom:76px}
`;
const s=document.createElement('style');s.id='casebook-v3-css';s.textContent=css;document.head.appendChild(s);
}
function injectUi(){
  document.title='CASEBOOK PRO V3 — Spatial Worlds';
  const head=q('.headText');if(head){q('b',head)&&(q('b',head).textContent='CASEBOOK PRO V3');q('span',head)&&(q('span',head).textContent='Spatial Worlds · World → Chapters → Hotspots → Guided Tour')}
  const mark=q('.mark');if(mark)mark.textContent='V3';
  const scroll=q('.scroll'),first=scroll?.firstElementChild,sec=document.createElement('details');sec.className='sec';sec.open=true;sec.id='v3WorldSection';
  sec.innerHTML=`<summary>V3 · Spatial Worlds</summary><div class="body">
  <div class="v3flow"><span>WORLD</span><span>CHAPTERS</span><span>HOTSPOTS</span><span>TOUR</span></div>
  <div class="demoNote"><b>Spatial Worlds Engine</b><span>Convierte varios boards en un mundo navegable. Hotspots informan o transportan entre Chapters.</span></div>
  <div class="field"><label>World name</label><input id="v3WorldName" value="Untitled Spatial World"></div>
  <div class="v3tabs"><button class="btn" id="v3MapBtn">WORLD MAP</button><button class="btn" id="v3GuideBtn">GUIDED TOUR</button><button class="btn" id="v3HelpBtn">? GUIDE</button><button class="btn ghost" id="v3SaveBtn">SAVE</button></div>
  <div class="divider"></div><div class="row"><button class="btn primary" id="v3NewChapter">+ NEW CHAPTER</button><button class="btn" id="v3DuplicateChapter">DUPLICATE</button></div>
  <div class="v3list" id="v3ChapterList"></div><div class="divider"></div>
  <div class="demoNote"><b>Hotspots</b><span>Click visual o coordenadas X/Y. INFO abre ficha; PORTAL navega a otro Chapter.</span></div>
  <button class="btn full primary" id="v3AddHotspot">+ ADD HOTSPOT</button><div class="v3list" id="v3HotspotList"></div></div>`;
  if(first)scroll.insertBefore(sec,first);else scroll?.appendChild(sec);
  const st=stage();if(!st)return;
  const layer=document.createElement('div');layer.className='v3hotLayer';layer.id='v3HotLayer';st.appendChild(layer);
  const tr=document.createElement('div');tr.className='v3transition';tr.id='v3Transition';st.appendChild(tr);
  const mw=document.createElement('div');mw.className='v3modalWrap';mw.id='v3ModalWrap';mw.innerHTML='<div class="v3modal" id="v3Modal"></div>';st.appendChild(mw);
  const gh=document.createElement('div');gh.className='v3guideHud';gh.id='v3GuideHud';st.appendChild(gh);
}
async function waitApi(){for(let i=0;i<120;i++){const a=boardApi();if(a?.exportState&&a?.importState)return a;await sleep(100)}return null}

function blankFrom(st){
  const s=clone(st||baseSnapshot()||{});delete s.v3World;s.version='casebook-pro-v2';s.items=[];s.connections=[];s.camera={x:0,y:1,z:8};if(s.v2){s.v2.zones=[];s.v2.story={steps:[]}}return s;
}
async function ensureWorld(){
  loadWorld();const a=await waitApi();
  if(!a){renderChapterError('Editor V2 no disponible. Recarga el módulo.');toast('V3: editor no disponible');return false}
  patchBaseApi();
  if(!world.chapters.length){
    const id=uid('chapter');world.chapters=[{id,name:'Chapter 1',state:baseSnapshot(),hotspots:[],mapX:18,mapY:55}];world.activeChapterId=id;world.route=[id];saveWorld();
  }
  world=normalizeWorld(world);q('#v3WorldName').value=world.name;renderAll();
  await warmMapAsset();
  if(activeChapter()?.state)await baseRestore(activeChapter().state);
  renderAll();return true;
}
function renderChapterError(text){const el=q('#v3ChapterList');if(el)el.innerHTML=`<div class="v3row v3error"><div><b>V3 INITIALIZATION</b><small>${esc(text)}</small></div></div>`}

async function addChapter(duplicate=false){
  persistCurrent();const base=activeChapter(),id=uid('chapter'),n=world.chapters.length+1;
  const state=duplicate?clone(base?.state||baseSnapshot()):blankFrom(base?.state||baseSnapshot());
  const c={id,name:'Chapter '+n,state,hotspots:[],mapX:15+((n-1)%4)*23,mapY:25+Math.floor((n-1)/4)*35};
  world.chapters.push(c);world.route.push(id);world.activeChapterId=id;saveWorld();await baseRestore(state);renderAll();toast(duplicate?'Chapter duplicado':'Nuevo Chapter creado');
}
async function switchChapter(id,transition='fade',origin=null){
  if(transitionBusy||id===world.activeChapterId)return;
  const target=world.chapters.find(c=>c.id===id);if(!target)return;
  transitionBusy=true;
  try{
    persistCurrent();await playTransitionOut(transition,origin);world.activeChapterId=id;saveWorld();await baseRestore(target.state);renderAll();await playTransitionIn(transition);
  }catch(e){console.error('V3 chapter switch failed',e);toast('No se pudo abrir el Chapter');try{await playTransitionIn()}catch(_){}}
  finally{transitionBusy=false}
}
async function playTransitionOut(type,origin){
  const st=stage(),fr=preview(),ov=q('#v3Transition');if(origin&&fr)fr.style.transformOrigin=`${origin.x}% ${origin.y}%`;
  if(type==='zoom-in'||type==='doorway')st.classList.add('v3zoom');else if(type==='zoom-out')st.classList.add('v3zoomout');else if(type==='pan-left')st.classList.add('v3panleft');else if(type==='pan-right')st.classList.add('v3panright');else if(type==='whip')st.classList.add('v3whip');
  if(ov)ov.className=type==='blur'?'v3transition blur on':'v3transition fade on';await sleep(type==='whip'?300:560);
}
async function playTransitionIn(){
  const st=stage(),fr=preview(),ov=q('#v3Transition');st?.classList.remove('v3zoom','v3zoomout','v3panleft','v3panright','v3whip');if(fr){fr.style.transform='';fr.style.filter=''}await sleep(40);if(ov)ov.className='v3transition fade';await sleep(380);
}

function renderChapters(){
  const el=q('#v3ChapterList');if(!el)return;el.innerHTML='';
  if(!world.chapters.length){renderChapterError('No hay Chapters. Crea el primero.');return}
  world.chapters.forEach((c,i)=>{
    const r=document.createElement('div');r.className='v3row'+(c.id===world.activeChapterId?' active':'');
    r.innerHTML=`<div><b>${String(i+1).padStart(2,'0')} · ${esc(c.name)}</b><small>${c.hotspots.length} hotspots · map ${Math.round(c.mapX)}%, ${Math.round(c.mapY)}%</small></div><div class="actions"><button class="btn" data-open="${c.id}">OPEN</button><button class="btn ghost" data-edit="${c.id}">✎</button></div>`;el.appendChild(r);
  });
  qa('[data-open]',el).forEach(b=>b.onclick=()=>switchChapter(b.dataset.open,'fade'));qa('[data-edit]',el).forEach(b=>b.onclick=()=>editChapter(b.dataset.edit));
}
function editChapter(id){
  const c=world.chapters.find(x=>x.id===id);if(!c)return;
  openModal(`<button class="btn ghost close" data-v3close>✕</button><h2>Edit Chapter</h2><p>Un Chapter es un espacio o nodo independiente del World.</p><div class="v3hotForm"><label>Chapter name<input id="v3ChName" value="${esc(c.name)}"></label><div class="v3split"><label>Map X %<input id="v3ChX" type="number" min="0" max="100" step=".1" value="${c.mapX}"></label><label>Map Y %<input id="v3ChY" type="number" min="0" max="100" step=".1" value="${c.mapY}"></label></div><button class="btn" id="v3PlaceChapterMap">PLACE ON MAP VISUALLY</button><button class="btn primary" id="v3SaveChapter">SAVE CHAPTER</button></div>`);
  q('#v3SaveChapter').onclick=()=>{c.name=q('#v3ChName').value.trim()||c.name;c.mapX=clamp(Number(q('#v3ChX').value)||50,0,100);c.mapY=clamp(Number(q('#v3ChY').value)||50,0,100);saveWorld();closeModal();renderAll()};
  q('#v3PlaceChapterMap').onclick=()=>{c.name=q('#v3ChName').value.trim()||c.name;saveWorld();closeModal();activeMapChapterId=c.id;placingMapNode=true;showWorldMap(true)};
}

function innerDoc(){const fr=preview();try{return fr?.contentDocument||null}catch(_){return null}}
function findItemAnchorFromClient(clientX,clientY){
  const fr=preview();if(!fr)return null;const rr=fr.getBoundingClientRect();
  if(clientX<rr.left||clientX>rr.right||clientY<rr.top||clientY>rr.bottom)return null;
  const doc=innerDoc();if(!doc)return null;
  const x=clientX-rr.left,y=clientY-rr.top;let el=doc.elementFromPoint(x,y);if(!el)return null;
  const ids=new Set((baseSnapshot()?.items||[]).map(it=>String(it.id)));
  for(let n=el;n&&n!==doc.documentElement;n=n.parentElement){
    const candidates=[n.dataset?.id,n.dataset?.itemId,n.dataset?.cardId,n.getAttribute?.('data-key'),n.id].filter(Boolean).map(String);
    const itemId=candidates.find(v=>ids.has(v));
    if(itemId){
      const er=n.getBoundingClientRect();if(er.width&&er.height)return{type:'item',itemId,x:clamp((x-er.left)/er.width,0,1),y:clamp((y-er.top)/er.height,0,1)};
    }
  }
  return null;
}
function sceneAnchorFromClient(clientX,clientY){
  const fr=preview(),r=fr?.getBoundingClientRect();if(!r||!r.width||!r.height)return{type:'scene',x:.5,y:.5};
  return{type:'scene',x:clamp((clientX-r.left)/r.width,0,1),y:clamp((clientY-r.top)/r.height,0,1)};
}
function placementFromEvent(e){
  const fr=preview(),rr=fr?.getBoundingClientRect(),a=boardApi();
  if(rr&&a?.v3AnchorAt){
    try{
      const anchor=a.v3AnchorAt(e.clientX-rr.left,e.clientY-rr.top);
      if(anchor)return{x:clamp((e.clientX-rr.left)/rr.width*100,0,100),y:clamp((e.clientY-rr.top)/rr.height*100,0,100),anchor};
    }catch(err){console.warn('V3 3D anchor fallback',err)}
  }
  const anchor=findItemAnchorFromClient(e.clientX,e.clientY)||sceneAnchorFromClient(e.clientX,e.clientY);
  return{x:anchor.x*100,y:anchor.y*100,anchor};
}
function resolveItemElement(itemId){
  const doc=innerDoc();if(!doc||!itemId)return null;const all=Array.from(doc.querySelectorAll('[data-id],[data-item-id],[data-card-id],[data-key],[id]'));
  return all.find(n=>[n.dataset?.id,n.dataset?.itemId,n.dataset?.cardId,n.getAttribute('data-key'),n.id].some(v=>String(v||'')===String(itemId)))||null;
}
function projectAnchor(anchor){
  const st=stage(),sr=st?.getBoundingClientRect(),fr=preview(),rr=fr?.getBoundingClientRect();if(!sr||!rr||!anchor)return null;
  const a=boardApi();
  if(a?.v3ProjectAnchor&&(anchor.type==='item3d'||anchor.type==='world3d')){
    try{
      const p=a.v3ProjectAnchor(anchor);
      if(p&&Number.isFinite(p.x)&&Number.isFinite(p.y))return{x:clamp((rr.left+p.x-sr.left)/sr.width*100,0,100),y:clamp((rr.top+p.y-sr.top)/sr.height*100,0,100)};
    }catch(err){console.warn('V3 3D projection fallback',err)}
  }
  let cx,cy;
  if(anchor.type==='item'){
    const el=resolveItemElement(anchor.itemId);
    if(el){const er=el.getBoundingClientRect();cx=rr.left+er.left+er.width*anchor.x;cy=rr.top+er.top+er.height*anchor.y}
  }
  if(cx==null){cx=rr.left+rr.width*anchor.x;cy=rr.top+rr.height*anchor.y}
  return{x:clamp((cx-sr.left)/sr.width*100,0,100),y:clamp((cy-sr.top)/sr.height*100,0,100)};
}
function syncHotspotPositions(){
  const c=activeChapter(),layer=q('#v3HotLayer');if(c&&layer){
    c.hotspots.forEach(h=>{const el=layer.querySelector(`[data-hotspot-id="${CSS.escape(h.id)}"]`),p=projectAnchor(h.anchor||{type:'scene',x:h.x/100,y:h.y/100});if(el&&p){el.style.left=p.x+'%';el.style.top=p.y+'%'}});
  }
  hotspotRaf=requestAnimationFrame(syncHotspotPositions);
}
function startHotspotPlacement(){
  const c=activeChapter();if(!c)return;hotspotDraft={id:uid('hotspot'),type:'portal',title:'New hotspot',body:'',x:50,y:50,anchor:{type:'scene',x:.5,y:.5},targetChapterId:world.chapters.find(x=>x.id!==c.id)?.id||'',transition:'zoom-in',visible:true};
  placingHotspot=true;q('#v3HotLayer').classList.add('placing');toast('Haz click sobre el punto exacto de la escena');
}
function editHotspot(h,isNew=false){
  normalizeHotspot(h);const targets=world.chapters.filter(c=>c.id!==world.activeChapterId).map(c=>`<option value="${c.id}" ${h.targetChapterId===c.id?'selected':''}>${esc(c.name)}</option>`).join('');
  openModal(`<button class="btn ghost close" data-v3close>✕</button><h2>${isNew?'Create':'Edit'} Hotspot</h2><p>INFO abre una ficha. PORTAL transporta a otro Chapter. X/Y son coordenadas normalizadas dentro del ancla.</p><div class="v3hotForm">
  <div class="v3split"><label>Type<select id="v3HsType"><option value="portal" ${h.type==='portal'?'selected':''}>PORTAL · spatial navigation</option><option value="info" ${h.type==='info'?'selected':''}>INFO · content card</option><option value="media" ${h.type==='media'?'selected':''}>MEDIA · rich info</option></select></label><label>Transition<select id="v3HsTrans"><option value="zoom-in">Zoom In</option><option value="zoom-out">Zoom Out</option><option value="doorway">Doorway / Object Enter</option><option value="pan-left">Pan Left</option><option value="pan-right">Pan Right</option><option value="whip">Whip Pan</option><option value="blur">Blur</option><option value="fade">Crossfade</option></select></label></div>
  <label>Title<input id="v3HsTitle" value="${esc(h.title)}"></label><label>Information<textarea id="v3HsBody">${esc(h.body)}</textarea></label>
  <div class="v3split"><label>X %<input id="v3HsX" type="number" min="0" max="100" step=".1" value="${h.x.toFixed(2)}"></label><label>Y %<input id="v3HsY" type="number" min="0" max="100" step=".1" value="${h.y.toFixed(2)}"></label></div>
  <div class="v3coords">ANCHOR: ${esc(h.anchor?.type||'scene')}${h.anchor?.itemId?' · '+esc(h.anchor.itemId):''}</div>
  <label>Portal destination<select id="v3HsTarget"><option value="">— none —</option>${targets}</select></label><label><input id="v3HsVisible" type="checkbox" ${h.visible!==false?'checked':''}> Visible marker in Explore mode</label>
  <div class="row"><button class="btn" id="v3RepositionHs">PLACE VISUALLY</button><button class="btn primary" id="v3SaveHs">SAVE HOTSPOT</button></div></div>`);
  q('#v3HsTrans').value=h.transition||'zoom-in';
  const commit=()=>{h.type=q('#v3HsType').value;h.transition=q('#v3HsTrans').value;h.title=q('#v3HsTitle').value.trim()||'Hotspot';h.body=q('#v3HsBody').value;h.x=clamp(Number(q('#v3HsX').value)||0,0,100);h.y=clamp(Number(q('#v3HsY').value)||0,0,100);if(h.anchor?.type==='item3d'||h.anchor?.type==='world3d'){try{h.anchor=boardApi()?.v3AnchorFromScreenPercent?.(h.x,h.y)||h.anchor}catch(_){}}else{h.anchor=h.anchor||{type:'scene'};h.anchor.x=h.x/100;h.anchor.y=h.y/100;}h.targetChapterId=q('#v3HsTarget').value;h.visible=q('#v3HsVisible').checked};
  q('#v3SaveHs').onclick=()=>{commit();const c=activeChapter();if(isNew&&!c.hotspots.some(x=>x.id===h.id))c.hotspots.push(h);saveWorld();closeModal();renderAll();toast('Hotspot guardado')};
  q('#v3RepositionHs').onclick=()=>{commit();closeModal();hotspotDraft=h;placingHotspot=true;q('#v3HotLayer').classList.add('placing');toast('Reposiciona el hotspot haciendo click')};
}
function renderHotspots(){
  const c=activeChapter(),layer=q('#v3HotLayer'),list=q('#v3HotspotList');if(!layer||!list||!c)return;layer.innerHTML='';list.innerHTML='';
  c.hotspots.forEach((h,i)=>{normalizeHotspot(h);const m=document.createElement('button');m.dataset.hotspotId=h.id;m.className='v3hot '+h.type+(h.visible===false?' hiddenMarker':'');m.title=h.title;m.innerHTML=`${i+1}<span class="v3hotLabel">${esc(h.title)}</span>`;m.onclick=e=>{e.stopPropagation();activateHotspot(h)};layer.appendChild(m);
    const anchor=h.anchor?.type==='item3d'?`ITEM 3D · ${h.anchor.itemId}`:h.anchor?.type==='world3d'?'WORLD 3D':h.anchor?.type==='item'?`ITEM · ${h.anchor.itemId}`:'SCENE';const r=document.createElement('div');r.className='v3row';r.innerHTML=`<div><b>${i+1}. ${esc(h.title)}</b><small>${h.type.toUpperCase()} · ${anchor} · <span class="v3coords">X ${h.x.toFixed(1)} / Y ${h.y.toFixed(1)}</span></small></div><div class="actions"><button class="btn" data-hsedit="${h.id}">EDIT</button><button class="btn ghost" data-hsdel="${h.id}">×</button></div>`;list.appendChild(r);
  });
  qa('[data-hsedit]',list).forEach(b=>b.onclick=()=>{const h=c.hotspots.find(x=>x.id===b.dataset.hsedit);if(h)editHotspot(h,false)});qa('[data-hsdel]',list).forEach(b=>b.onclick=()=>{c.hotspots=c.hotspots.filter(x=>x.id!==b.dataset.hsdel);saveWorld();renderHotspots()});
}
async function activateHotspot(h){
  if(h.type==='portal'){if(!h.targetChapterId){toast('Este portal no tiene destino');return}const p=projectAnchor(h.anchor)||{x:h.x,y:h.y};await switchChapter(h.targetChapterId,h.transition||'zoom-in',p)}
  else openModal(`<button class="btn ghost close" data-v3close>✕</button><div class="v3badge">${h.type.toUpperCase()} HOTSPOT</div><h2 style="margin-top:10px">${esc(h.title)}</h2><p>${esc(h.body).replace(/\n/g,'<br>')||'Sin contenido adicional.'}</p><div class="v3coords">X ${h.x.toFixed(2)}% · Y ${h.y.toFixed(2)}%</div>`);
}

function renderRoute(){world.route=world.route.filter(id=>world.chapters.some(c=>c.id===id));if(!world.route.length)world.route=world.chapters.map(c=>c.id)}
async function setMapFile(file){const key=world.map?.assetId||`${world.worldId}:map`;await assetPut(key,file);world.map={assetId:key,name:file.name,type:file.type};mapDataUrlCache=await blobToDataURL(file);saveWorld()}
async function clearMap(){if(world.map?.assetId)try{await assetDelete(world.map.assetId)}catch(_){}world.map={assetId:null,name:null,type:null};mapDataUrlCache=null;saveWorld()}
function showWorldMap(placeMode=false){
  persistCurrent();renderRoute();const bg=mapDataUrlCache?`<img src="${mapDataUrlCache}">`:'';const routeIndex=new Map(world.route.map((id,i)=>[id,i+1]));
  const nodes=world.chapters.map(c=>`<button class="v3mapNode ${c.id===world.activeChapterId?'active':''}" data-mapnode="${c.id}" style="left:${c.mapX}%;top:${c.mapY}%">${routeIndex.get(c.id)||'·'}<span>${esc(c.name)}</span></button>`).join('');
  const legend=world.route.map((id,i)=>{const c=world.chapters.find(x=>x.id===id);return c?`<button class="btn ghost" data-routejump="${id}">${i+1}. ${esc(c.name)}</button>`:''}).join('');
  openModal(`<button class="btn ghost close" data-v3close>✕</button><h2>World Map / Navigator</h2><p>Plano global y recorrido. El número del nodo representa el orden del Tour, no el orden de creación.</p><div class="row"><button class="btn" id="v3MapUploadBtn">UPLOAD MAP / FLOOR PLAN</button><button class="btn ghost" id="v3MapClearBtn">CLEAR MAP</button></div><input id="v3MapFile" type="file" accept="image/*" style="display:none"><div class="v3routeLegend">${legend}</div><div class="v3worldmap ${placeMode?'v3mapPlace':''}" id="v3WorldMapCanvas">${bg}<svg class="v3mapSvg" id="v3MapSvg"></svg>${nodes}</div><p>${placeMode?'PLACE MODE: haz click donde debe quedar el Chapter.':'Haz click en un nodo para navegar.'}</p>`);
  drawMapLines();qa('[data-mapnode]').forEach(b=>b.onclick=()=>{if(placeMode)return;closeModal();switchChapter(b.dataset.mapnode,'zoom-in')});qa('[data-routejump]').forEach(b=>b.onclick=()=>{closeModal();switchChapter(b.dataset.routejump,'fade')});
  q('#v3MapUploadBtn').onclick=()=>q('#v3MapFile').click();q('#v3MapFile').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{await setMapFile(f);showWorldMap(placeMode)}catch(err){console.error(err);toast('No se pudo guardar el plano')}};
  q('#v3MapClearBtn').onclick=async()=>{await clearMap();showWorldMap(placeMode)};
  if(placeMode)q('#v3WorldMapCanvas').onclick=e=>{if(!placingMapNode||!activeMapChapterId)return;const r=e.currentTarget.getBoundingClientRect(),c=world.chapters.find(c=>c.id===activeMapChapterId);if(c){c.mapX=clamp((e.clientX-r.left)/r.width*100,0,100);c.mapY=clamp((e.clientY-r.top)/r.height*100,0,100);saveWorld()}placingMapNode=false;activeMapChapterId=null;showWorldMap(false);renderAll();toast('Chapter posicionado en World Map')};
}
function drawMapLines(){const svg=q('#v3MapSvg');if(!svg)return;renderRoute();let out='';for(let i=0;i<world.route.length-1;i++){const a=world.chapters.find(c=>c.id===world.route[i]),b=world.chapters.find(c=>c.id===world.route[i+1]);if(a&&b)out+=`<line x1="${a.mapX}%" y1="${a.mapY}%" x2="${b.mapX}%" y2="${b.mapY}%" stroke="rgba(182,255,125,.55)" stroke-width="2" stroke-dasharray="7 5"/><circle cx="${b.mapX}%" cy="${b.mapY}%" r="3" fill="#b6ff7d"/>`}svg.innerHTML=out}

function showGuideBuilder(){
  persistCurrent();renderRoute();const rows=world.route.map((id,i)=>{const c=world.chapters.find(x=>x.id===id);return c?`<div class="v3row"><div><b>${i+1}. ${esc(c.name)}</b><small>${c.hotspots.length} hotspots</small></div><div class="actions"><button class="btn" data-up="${i}">↑</button><button class="btn" data-down="${i}">↓</button><button class="btn ghost" data-rm="${i}">×</button></div></div>`:''}).join('');
  openModal(`<button class="btn ghost close" data-v3close>✕</button><h2>Guided Tour</h2><p>Define el recorrido. El Tour navega entre Chapters y mantiene el Story Path V2 de cada estancia.</p><div class="v3list">${rows}</div><div class="row" style="margin-top:10px"><button class="btn" id="v3RouteAll">RESET TO ALL CHAPTERS</button><button class="btn primary" id="v3StartGuide">▶ START GUIDED TOUR</button></div>`);
  qa('[data-up]').forEach(b=>b.onclick=()=>{const i=+b.dataset.up;if(i>0)[world.route[i-1],world.route[i]]=[world.route[i],world.route[i-1]];saveWorld();showGuideBuilder()});qa('[data-down]').forEach(b=>b.onclick=()=>{const i=+b.dataset.down;if(i<world.route.length-1)[world.route[i+1],world.route[i]]=[world.route[i],world.route[i+1]];saveWorld();showGuideBuilder()});qa('[data-rm]').forEach(b=>b.onclick=()=>{world.route.splice(+b.dataset.rm,1);saveWorld();showGuideBuilder()});
  q('#v3RouteAll').onclick=()=>{world.route=world.chapters.map(c=>c.id);saveWorld();showGuideBuilder()};q('#v3StartGuide').onclick=()=>{closeModal();startGuidedTour()};
}
async function startGuidedTour(){renderRoute();if(!world.route.length){toast('Guided Tour vacío');return}world.guide={index:0,running:true};document.body.classList.add('v3-guided');const first=world.route[0];if(first!==world.activeChapterId)await switchChapter(first,'fade');renderGuideHud();toast('Guided Tour iniciado')}
async function guideMove(delta){if(!world.guide?.running)return;const ni=world.guide.index+delta;if(ni<0||ni>=world.route.length)return;world.guide.index=ni;const id=world.route[ni];if(id!==world.activeChapterId)await switchChapter(id,delta>0?'zoom-in':'zoom-out');renderGuideHud()}
function renderGuideHud(){const h=q('#v3GuideHud');if(!h)return;if(!world.guide?.running){h.classList.remove('open');return}const c=world.chapters.find(c=>c.id===world.route[world.guide.index]);h.innerHTML=`<button class="btn ghost" id="v3GuidePrev">←</button><div class="meta"><b>${world.guide.index+1} / ${world.route.length} · ${esc(c?.name||'')}</b><small>Guided Tour · hotspots + Story available</small></div><button class="btn" id="v3GuideStory">PLAY STORY</button><button class="btn primary" id="v3GuideNext">NEXT →</button><button class="btn ghost" id="v3GuideStop">STOP</button>`;h.classList.add('open');q('#v3GuidePrev').onclick=()=>guideMove(-1);q('#v3GuideNext').onclick=()=>guideMove(1);q('#v3GuideStop').onclick=stopGuide;q('#v3GuideStory').onclick=()=>{try{v2StartPresentation(false)}catch(_){toast('Este Chapter no tiene Story Path')}}}
function stopGuide(){world.guide={index:0,running:false};document.body.classList.remove('v3-guided');renderGuideHud();toast('Guided Tour detenido')}

function showHelp(){openModal(`<button class="btn ghost close" data-v3close>✕</button><div class="v3badge">V3 QUICK START</div><h2 style="margin-top:10px">Cómo construir un Spatial World</h2><div class="v3helpStep"><b>1 · WORLD</b><p>Define el mundo.</p></div><div class="v3helpStep"><b>2 · CHAPTERS</b><p>Cada Chapter conserva un board independiente.</p></div><div class="v3helpStep"><b>3 · HOTSPOTS</b><p>Click visual o X/Y. Los hotspots quedan anclados a escena u objeto cuando es identificable.</p></div><div class="v3helpStep"><b>4 · WORLD MAP</b><p>El plano se guarda en IndexedDB, no en localStorage.</p></div><div class="v3helpStep"><b>5 · GUIDED TOUR</b><p>Ordena Chapters y recórrelos.</p></div><div class="v3helpStep"><b>6 · STORY → PRESENTATION → RECORDING</b><p>El motor V2 permanece disponible.</p></div>`)}
function openModal(html){const w=q('#v3ModalWrap'),m=q('#v3Modal');if(!w||!m)return;m.innerHTML=html;w.classList.add('open');qa('[data-v3close]',m).forEach(b=>b.onclick=closeModal)}
function closeModal(){q('#v3ModalWrap')?.classList.remove('open')}
function renderAll(){renderChapters();renderHotspots();renderGuideHud()}

function bind(){
  q('#v3WorldName').onchange=()=>{world.name=q('#v3WorldName').value.trim()||world.name;saveWorld()};
  q('#v3SaveBtn').onclick=()=>{persistCurrent();toast('Spatial World guardado')};q('#v3NewChapter').onclick=()=>addChapter(false);q('#v3DuplicateChapter').onclick=()=>addChapter(true);
  q('#v3AddHotspot').onclick=startHotspotPlacement;q('#v3MapBtn').onclick=()=>showWorldMap(false);q('#v3GuideBtn').onclick=showGuideBuilder;q('#v3HelpBtn').onclick=showHelp;
  q('#v3HotLayer').onclick=e=>{if(!placingHotspot)return;const p=placementFromEvent(e);placingHotspot=false;q('#v3HotLayer').classList.remove('placing');hotspotDraft.x=p.x;hotspotDraft.y=p.y;hotspotDraft.anchor=p.anchor;editHotspot(hotspotDraft,true)};
  window.addEventListener('beforeunload',persistCurrent);window.addEventListener('keydown',e=>{if(e.key==='Escape'&&placingHotspot){placingHotspot=false;q('#v3HotLayer').classList.remove('placing');toast('Colocación cancelada')}if(world.guide?.running&&e.key==='ArrowRight'){e.preventDefault();guideMove(1)}if(world.guide?.running&&e.key==='ArrowLeft'){e.preventDefault();guideMove(-1)}});
}
async function boot(){
  injectCss();injectUi();bind();const ok=await ensureWorld();if(!ok)return;
  cancelAnimationFrame(hotspotRaf);syncHotspotPositions();
  window.dispatchEvent(new CustomEvent('casebook-pro-v3-ready',{detail:{version:'3.0-p0',projectId:world.projectId,worldId:world.worldId}}));
  toast('CASEBOOK PRO V3 · P0 technical hardening ready',3500);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,60));else setTimeout(boot,60);
})();