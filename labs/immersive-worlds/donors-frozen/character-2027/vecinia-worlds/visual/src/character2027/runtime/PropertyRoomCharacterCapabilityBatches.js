// S3 — Character capability batches A–E on the accepted Property Room foundation.
// Reuses the already-registered MotionFoundationV2 vocabulary. No duplicate
// controller, navigator, SceneKit, WorldStore or CameraAuthority is created.

import * as THREE from 'three185';
import { PROPERTY_ROOM_SOFA, resolveSarahSofaCharacterTarget } from '../../../../property-room-v1/app/property-room-sofa.js';

const BATCHES = Object.freeze({
  A: Object.freeze({ label: 'A · SOCIAL / NON-CONTACT', actions: ['WAVE','GOODBYE','POINT','NOD','LOOK_AT','WELCOME','AFTER_YOU'] }),
  B: Object.freeze({ label: 'B · BODY / VERTICAL', actions: ['JUMP','CROUCH','STEP_UP','STEP_DOWN','STAIRS_UP','STAIRS_DOWN','LADDER_UP','LADDER_DOWN'] }),
  C: Object.freeze({ label: 'C · 1-HAND CONTACT', actions: ['PRESS_DOORBELL','KNOCK_DOOR','PICK_UP_CUP','OPEN_DOOR'] }),
  D: Object.freeze({ label: 'D · 2-HAND / SUPPORTED OBJECT', actions: ['PICK_UP_PHONE','PICK_UP_MAGAZINE'] }),
  E: Object.freeze({ label: 'E · SURFACE / BODY CONTACT', actions: ['SIT_SOFA','LEAN_WALL'] }),
});

const TERRAIN_BOUND = new Set(['STEP_UP','STEP_DOWN','STAIRS_UP','STAIRS_DOWN','LADDER_UP','LADDER_DOWN']);
const CONTACT_ACTIONS = new Set([...BATCHES.C.actions, ...BATCHES.D.actions, ...BATCHES.E.actions]);

function visible(node) {
  let n = node;
  while (n) { if (n.visible === false) return false; n = n.parent; }
  return Boolean(node);
}

function worldBox(object) {
  if (!object || !visible(object)) return null;
  object.updateWorldMatrix(true, true);
  const box = new THREE.Box3().setFromObject(object);
  return box.isEmpty() ? null : box;
}

function worldCenter(object) {
  const box = worldBox(object);
  return box ? box.getCenter(new THREE.Vector3()) : null;
}

function horizontalOutward(from, centre) {
  const v = new THREE.Vector3().subVectors(from, centre); v.y = 0;
  if (v.lengthSq() < 1e-8) v.set(0, 0, 1);
  return v.normalize();
}

function approachForObject(object, characterRoot, extra = 0.62) {
  const box = worldBox(object); if (!box) return null;
  const centre = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const outward = horizontalOutward(characterRoot.position, centre);
  const radius = Math.max(size.x, size.z) * .5 + extra;
  const point = centre.clone().addScaledVector(outward, radius);
  point.y = characterRoot.position.y;
  return { point, centre, size, outward, box };
}

function pickObject(scene, names) {
  for (const name of names) {
    const object = scene.getObjectByName(name);
    if (object && visible(object)) return object;
  }
  return null;
}

function pointFromBox(box, fx, fy, fz) {
  return new THREE.Vector3(
    THREE.MathUtils.lerp(box.min.x, box.max.x, fx),
    THREE.MathUtils.lerp(box.min.y, box.max.y, fy),
    THREE.MathUtils.lerp(box.min.z, box.max.z, fz),
  );
}

function objectDescriptor(action, object, root, options = {}) {
  const approach = approachForObject(object, root, options.extra ?? .64);
  if (!approach) return null;
  const { point: approachPoint, centre, size, box } = approach;
  const lookAt = centre.clone();
  const descriptor = { action, object, approachPoint, lookAt, semanticRole: options.semanticRole || 'OBJECT', type: options.type || 'contact' };

  if (action === 'PICK_UP_CUP') {
    descriptor.contactPoint = centre.clone();
    descriptor.gripPoint = centre.clone().add(new THREE.Vector3(Math.min(size.x * .34, .045), 0, 0));
    descriptor.hand = 'right'; descriptor.type = 'small-one-hand';
  }
  if (action === 'PICK_UP_PHONE') {
    descriptor.contactPoint = centre.clone(); descriptor.gripPoint = centre.clone();
    descriptor.secondaryGripPoint = centre.clone().add(new THREE.Vector3(-Math.min(size.x * .28, .06), 0, 0));
    descriptor.hand = 'right'; descriptor.secondaryHand = 'left'; descriptor.type = 'phone-grip';
  }
  if (action === 'PICK_UP_MAGAZINE') {
    const lateral = Math.max(.08, Math.min(size.x * .30, .18));
    descriptor.contactPoint = centre.clone();
    descriptor.gripPoint = centre.clone().add(new THREE.Vector3(lateral, 0, 0));
    descriptor.secondaryGripPoint = centre.clone().add(new THREE.Vector3(-lateral, 0, 0));
    descriptor.hand = 'right'; descriptor.secondaryHand = 'left'; descriptor.type = 'two-hand-flat-object';
  }
  if (action === 'KNOCK_DOOR') {
    descriptor.contactPoint = pointFromBox(box, .50, .62, .50);
    descriptor.type = 'repeated-contact'; descriptor.hand = 'right';
  }
  if (action === 'PRESS_DOORBELL') {
    descriptor.contactPoint = options.contactPoint?.clone?.() || pointFromBox(box, .88, .58, .50);
    descriptor.type = 'precise-contact'; descriptor.hand = 'right';
  }
  return descriptor;
}

function nearestWallDescriptor(freeApi) {
  const volume = freeApi.runtime.sceneKit.navigationVolume(freeApi.runtime.state.activeSpaceId);
  const bounds = volume?.bounds; if (!bounds) return null;
  const p = freeApi.adapter.root.position;
  const candidates = [
    { d: Math.abs(p.x - bounds.min[0]), normal: new THREE.Vector3(1,0,0), point: new THREE.Vector3(bounds.min[0], p.y, p.z) },
    { d: Math.abs(bounds.max[0] - p.x), normal: new THREE.Vector3(-1,0,0), point: new THREE.Vector3(bounds.max[0], p.y, p.z) },
    { d: Math.abs(p.z - bounds.min[2]), normal: new THREE.Vector3(0,0,1), point: new THREE.Vector3(p.x, p.y, bounds.min[2]) },
    { d: Math.abs(bounds.max[2] - p.z), normal: new THREE.Vector3(0,0,-1), point: new THREE.Vector3(p.x, p.y, bounds.max[2]) },
  ].sort((a,b)=>a.d-b.d);
  const wall = candidates[0];
  const approachPoint = wall.point.clone().addScaledVector(wall.normal, .46); approachPoint.y = p.y;
  const lookAt = wall.point.clone(); lookAt.y = p.y + 1.0;
  const pelvisContact = wall.point.clone().addScaledVector(wall.normal, .04); pelvisContact.y = p.y + .82;
  const shoulderContact = wall.point.clone().addScaledVector(wall.normal, .04); shoulderContact.y = p.y + 1.28;
  return { action:'LEAN_WALL', semanticRole:'SURFACE', type:'surface-contact-pose', approachPoint, lookAt, contactPoint: pelvisContact.clone(), pelvisContact, shoulderContact, surfaceNormal: wall.normal.clone() };
}

function resolveTargets(freeApi) {
  const scene = freeApi.runtime.sceneKit.scene;
  const root = freeApi.adapter.root;
  const targets = new Map();
  const notes = new Map();

  const cup = pickObject(scene, ['CUP_1','CUP_2']);
  if (cup) targets.set('PICK_UP_CUP', objectDescriptor('PICK_UP_CUP', cup, root, { semanticRole:'DRINKABLE' }));
  else notes.set('PICK_UP_CUP', 'NO REAL CUP');

  const phone = pickObject(scene, ['property-room:fixture:SARAH_CONTACT_COMPOSED','property-room:fixture:SARAH_CONTACT']);
  if (phone) targets.set('PICK_UP_PHONE', objectDescriptor('PICK_UP_PHONE', phone, root, { semanticRole:'PHONE' }));
  else notes.set('PICK_UP_PHONE', 'NO REAL PHONE');

  // Motion name is historical. Product semantic is a two-hand flat/readable object.
  const readable = pickObject(scene, ['SARAH_NOTEBOOK','property-room:fixture:PROPERTY_DOSSIER']);
  if (readable) {
    const d = objectDescriptor('PICK_UP_MAGAZINE', readable, root, { semanticRole:'FLAT_READABLE_2H' });
    if (d) { d.productSemantic = 'FLAT_READABLE_2H'; d.sourceObjectName = readable.name; targets.set('PICK_UP_MAGAZINE', d); }
  } else notes.set('PICK_UP_MAGAZINE', 'NO REAL FLAT READABLE OBJECT');

  const door = pickObject(scene, ['property-room:activator:VIDEO_PORTAL']);
  if (door) {
    targets.set('KNOCK_DOOR', objectDescriptor('KNOCK_DOOR', door, root, { semanticRole:'DOOR' }));
    // Doorbell and OPEN_DOOR stay capability-visible but require authored product semantics.
    notes.set('PRESS_DOORBELL', 'REAL DOOR PRESENT · DOORBELL POINT NOT AUTHORED');
    notes.set('OPEN_DOOR', 'REAL DOOR PRESENT · HANDLE/HINGE AFFORDANCE NOT AUTHORED');
  } else {
    notes.set('KNOCK_DOOR', 'NO REAL DOOR'); notes.set('PRESS_DOORBELL', 'NO REAL DOOR'); notes.set('OPEN_DOOR', 'NO REAL DOOR');
  }

  const sofa = scene.getObjectByName(PROPERTY_ROOM_SOFA.objectName);
  if (sofa && visible(sofa)) {
    try { targets.set('SIT_SOFA', resolveSarahSofaCharacterTarget(THREE, sofa)); }
    catch (error) { notes.set('SIT_SOFA', `SOFA TARGET ERROR: ${error.message}`); }
  } else notes.set('SIT_SOFA', 'NO REAL SOFA');

  const wall = nearestWallDescriptor(freeApi);
  if (wall) targets.set('LEAN_WALL', wall); else notes.set('LEAN_WALL', 'NO ROOM BOUNDS');

  return { targets, notes };
}

function classify(action, controller, targetState) {
  if (!controller.has(action)) return { state:'MISSING', reason:'clip not registered' };
  if (TERRAIN_BOUND.has(action)) return { state:'CONTEXT_REQUIRED', reason:'requires real step/stairs/ladder semantic geometry' };
  if (CONTACT_ACTIONS.has(action) && !targetState.targets.has(action)) return { state:'CONTEXT_REQUIRED', reason:targetState.notes.get(action) || 'interaction affordance not authored' };
  return { state:'READY', reason:'registered and product-safe in current Room' };
}

function previewToolbarGutter() {
  // Vercel Preview injects its own toolbar over the right edge. These are QA/dev
  // panels, so keep them out of that reserved strip without changing production UI.
  return location.hostname.endsWith('.vercel.app') && window.innerWidth >= 1200 ? 310 : 14;
}

function installPanel(api) {
  document.getElementById('s3-character-capability-batches')?.remove();
  const root = document.createElement('div');
  root.id = 's3-character-capability-batches';
  const right = previewToolbarGutter();
  root.dataset.previewToolbarGutter = String(right);
  root.style.cssText = `position:fixed;right:${right}px;top:52px;z-index:12500;width:min(410px,calc(100vw - ${right + 28}px));max-height:calc(100vh - 255px);overflow:auto;padding:10px;background:rgba(19,16,13,.90);border:1px solid rgba(255,255,255,.18);backdrop-filter:blur(8px);color:#f5eee3;font:600 10px/1.35 system-ui,sans-serif;box-shadow:0 8px 28px rgba(0,0,0,.18)`;
  const title = document.createElement('div'); title.innerHTML = '<strong>CHARACTER 2027 · CAPABILITY BATCHES A–E</strong><div style="opacity:.7;margin-top:3px">READY = real Room execution · CONTEXT = capability kept, affordance not faked</div>'; root.append(title);
  for (const [key,batch] of Object.entries(BATCHES)) {
    const section=document.createElement('section'); section.style.cssText='margin-top:10px;padding-top:8px;border-top:1px solid rgba(255,255,255,.12)';
    const h=document.createElement('div'); h.textContent=batch.label; h.style.cssText='margin-bottom:6px;letter-spacing:.04em'; section.append(h);
    const row=document.createElement('div'); row.style.cssText='display:flex;gap:5px;flex-wrap:wrap';
    for (const action of batch.actions) {
      const cap=api.matrix[action]; const b=document.createElement('button'); b.textContent=`${action} · ${cap.state==='READY'?'READY':'CONTEXT'}`;
      b.disabled=cap.state!=='READY'; b.title=cap.reason;
      b.style.cssText=`border:1px solid rgba(255,255,255,.2);padding:6px 7px;font:700 9px system-ui;cursor:${b.disabled?'not-allowed':'pointer'};opacity:${b.disabled?'.48':'1'};background:${b.disabled?'#5c554e':'#eee4d4'};color:${b.disabled?'#eee4d4':'#211a14'}`;
      b.onclick=()=>api.execute(action); row.append(b);
    }
    section.append(row); root.append(section);
  }
  const status=document.createElement('div'); status.dataset.role='status'; status.style.cssText='margin-top:9px;padding-top:7px;border-top:1px solid rgba(255,255,255,.12);font:500 9px/1.4 ui-monospace,monospace;opacity:.82'; status.textContent='READY'; root.append(status);
  document.body.append(root);
  const timer=setInterval(()=>{status.textContent=api.lastStatus;},120);
  return { dispose(){clearInterval(timer);root.remove();} };
}

export function installPropertyRoomCharacterCapabilityBatches(runtime = window.__IW?.runtime, freeApi = window.__IW_CHARACTER_FREE) {
  if (!runtime || !freeApi?.ready || !freeApi.adapter?.character) throw new Error('Capability batches require READY B2A free Character');
  if (window.__IW_CHARACTER_CAPABILITY_BATCHES?.ready) return window.__IW_CHARACTER_CAPABILITY_BATCHES;

  const controller=freeApi.adapter.controller;
  const character=freeApi.adapter.character;
  let targetState=resolveTargets(freeApi);
  const matrix={};
  for (const batch of Object.values(BATCHES)) for (const action of batch.actions) matrix[action]=classify(action, controller, targetState);
  let lastStatus='READY · BATCHES A–E';
  let busy=false;

  async function execute(action) {
    const cap=matrix[action]; if (!cap || cap.state!=='READY' || busy) { lastStatus=`${action} · ${cap?.reason || 'unavailable'}`; return false; }
    busy=true;
    try {
      if (CONTACT_ACTIONS.has(action)) {
        targetState=resolveTargets(freeApi);
        const target=targetState.targets.get(action);
        if (!target) throw new Error(targetState.notes.get(action) || 'interaction target unavailable');
        character.interact(action,target,{walkSpeed:.68,stopDistance:.12,alignDelayMs:300});
        lastStatus=`${action} · approach → align → contact`;
      } else {
        freeApi.stop();
        character.perform(action,{status:`${action} · Property Room`});
        lastStatus=`${action} · BODY/SOCIAL ACTION`;
      }
      return true;
    } catch(error) {
      lastStatus=`${action} · ERROR · ${error.message}`; console.error('[CharacterCapabilityBatches]',error); return false;
    } finally {
      // Interactions continue asynchronously through CharacterActionAPI; this is an input lock, not an animation lock.
      setTimeout(()=>{busy=false;}, CONTACT_ACTIONS.has(action)?450:180);
    }
  }

  const api={
    ready:true,BATCHES,matrix,execute,
    refresh(){targetState=resolveTargets(freeApi);for(const batch of Object.values(BATCHES))for(const action of batch.actions)matrix[action]=classify(action,controller,targetState);return matrix;},
    audit(){
      const all=Object.values(BATCHES).flatMap(b=>b.actions);
      const ready=all.filter(a=>matrix[a]?.state==='READY');
      const contextRequired=all.filter(a=>matrix[a]?.state==='CONTEXT_REQUIRED');
      const missing=all.filter(a=>matrix[a]?.state==='MISSING');
      return {source:'REGISTERED_MOTION_FOUNDATION_V2',all,ready,contextRequired,missing,registeredCapabilities:character.capabilities(),targets:[...targetState.targets.keys()],notes:Object.fromEntries(targetState.notes),pass:missing.length===0};
    },
    get lastStatus(){return lastStatus;},
    dispose(){panel?.dispose();delete window.__IW_CHARACTER_CAPABILITY_BATCHES;}
  };
  let panel=installPanel(api);
  window.__IW_CHARACTER_CAPABILITY_BATCHES=api;
  document.documentElement.dataset.characterCapabilityBatches='ready';
  return api;
}