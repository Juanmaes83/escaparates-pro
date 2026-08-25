// S3-B2A.2 — FREE CHARACTER IN REAL PROPERTY ROOM
//
// Frozen product foundation: Character 2027 free locomotion inside the real
// Property Room. Room owns collision; Character owns body/actions; CameraAuthority
// remains unique. Legacy semantic points are optional authoring hints, not rails.

import * as THREE from 'three185';
import { CAMERA_AUTHORITY } from '../../../../property-room-v1/engine/schema/types.js';
import { ExploreController } from '../../../../property-room-v1/engine/camera/controllers/explore-controller.js';
import { createMuseumCharacterRuntimeAdapter } from './MuseumCharacterRuntimeAdapter.js';

const CHARACTER_RADIUS = 0.34;
const FREE_SPEED = 1.05;
const BACKWARD_SPEED = 0.78;
const COLLISION_EPS = 0.002;
const CAMERA_CLEARANCE = 0.24;
const CAMERA_TARGET_HEIGHT_FACTOR = 0.62;
const CAMERA_LERP_RATE = 7.2;
const CAMERA_MIN_COMFORT_DISTANCE = 2.65;
const CAMERA_POSITION_DEAD_ZONE = 0.18;
const CAMERA_TARGET_DEAD_ZONE = 0.08;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const COLLIDABLE_PROPERTY_OBJECTS = Object.freeze([
  'property-room:fixture:SARAH_SOFA',
  'property-room:fixture:SARAH_SIDE_TABLE',
  'property-room:fixture:DIGITAL_DESK_FURNITURE',
  'property-room:fixture:LIGHT_FIXTURE',
  'property-room:fixture:COAT_RACK',
  'property-room:activator:VIDEO_PORTAL',
]);

const SEMANTIC_DESTINATIONS = Object.freeze([
  { id: 'horizonte', label: 'Cuadro · Horizonte', anchorId: 'anchor.gallery-a.guide-horizonte', subjectRef: 'entity.artwork.horizonte-interrumpido' },
  { id: 'campo', label: 'Context Window', anchorId: 'anchor.gallery-a.guide-campo', subjectRef: 'entity.artwork.campo-de-ceniza' },
  { id: 'division', label: 'Foto · División', anchorId: 'anchor.gallery-a.guide-division', subjectRef: 'entity.artwork.division-tercera' },
  { id: 'estudio', label: 'Puerta / vídeo', anchorId: 'anchor.gallery-a.guide-estudio', subjectRef: 'entity.artwork.estudio-de-figura' },
  { id: 'vasija', label: 'Vasija', anchorId: 'anchor.gallery-a.guide-vasija', subjectRef: 'entity.sculpture.vasija-de-arenas' },
  { id: 'sarah', label: 'Zona sofá', anchorId: 'anchor.gallery-a.guide-sarah', subjectRef: 'space.gallery-a' },
]);

function nodeIsVisible(node) {
  let cursor = node;
  while (cursor) {
    if (cursor.visible === false) return false;
    cursor = cursor.parent;
  }
  return true;
}

function boxBlockerFor(object) {
  if (!object || !nodeIsVisible(object)) return null;
  object.updateWorldMatrix(true, true);
  const box = new THREE.Box3().setFromObject(object);
  if (box.isEmpty()) return null;
  const size = box.getSize(new THREE.Vector3());
  if (size.y < 0.18 || (size.x < 0.08 && size.z < 0.08)) return null;
  return {
    min: [box.min.x, box.min.y, box.min.z],
    max: [box.max.x, box.max.y, box.max.z],
    source: object.name,
    dynamicPropertyFixture: true,
  };
}

function collectFurnitureBlockers(scene) {
  const blockers = [];
  for (const name of COLLIDABLE_PROPERTY_OBJECTS) {
    const blocker = boxBlockerFor(scene.getObjectByName(name));
    if (blocker) blockers.push(blocker);
  }
  return blockers;
}

function pointOutsideInflatedBounds(point, bounds, radius) {
  return point.x < bounds.min[0] + radius || point.x > bounds.max[0] - radius
    || point.z < bounds.min[2] + radius || point.z > bounds.max[2] - radius;
}

function pointInsideBlocker(point, blocker, padding = 0) {
  if (!blocker?.min || !blocker?.max) return false;
  const minY = Number.isFinite(blocker.min[1]) ? blocker.min[1] - padding : -Infinity;
  const maxY = Number.isFinite(blocker.max[1]) ? blocker.max[1] + padding : Infinity;
  return point.x >= blocker.min[0] - padding && point.x <= blocker.max[0] + padding
    && point.y >= minY && point.y <= maxY
    && point.z >= blocker.min[2] - padding && point.z <= blocker.max[2] + padding;
}

function cameraPointInsideBounds(point, bounds, margin = CAMERA_CLEARANCE) {
  return point.x >= bounds.min[0] + margin && point.x <= bounds.max[0] - margin
    && point.z >= bounds.min[2] + margin && point.z <= bounds.max[2] - margin;
}

function segmentClear(from, to, bounds, blockers) {
  const probe = new THREE.Vector3();
  for (let i = 3; i <= 16; i += 1) {
    probe.lerpVectors(from, to, i / 16);
    if (!cameraPointInsideBounds(probe, bounds)) return false;
    if (blockers.some((blocker) => pointInsideBlocker(probe, blocker, CAMERA_CLEARANCE))) return false;
  }
  return true;
}

function installControls(api) {
  document.getElementById('s3b2a-free-controls')?.remove();
  const root = document.createElement('div');
  root.id = 's3b2a-free-controls';
  root.style.cssText = 'position:fixed;left:14px;bottom:14px;z-index:12000;width:min(620px,calc(100vw - 28px));padding:10px 11px;background:rgba(22,18,14,.84);border:1px solid rgba(255,255,255,.2);backdrop-filter:blur(10px);color:#f5eee3;font:600 11px/1.35 system-ui,sans-serif';
  root.innerHTML = `
    <div style="display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:7px">
      <strong>S3-B2A.2 · FREE CHARACTER IN ROOM</strong>
      <span data-role="status" style="font-weight:500;opacity:.82">READY</span>
    </div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:7px" data-role="actions"></div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:7px" data-role="targets"></div>
    <div style="font-weight:500;opacity:.8">W avanzar · S retroceder · A/D girar · X/Esc STOP · Espacio JUMP · C click-to-move. Cámara comfort vía CameraAuthority.</div>
    <div data-role="diag" style="margin-top:6px;font:500 10px/1.35 ui-monospace,SFMono-Regular,Consolas,monospace;opacity:.82"></div>
  `;
  document.body.appendChild(root);

  const status = root.querySelector('[data-role="status"]');
  const diag = root.querySelector('[data-role="diag"]');
  const actions = root.querySelector('[data-role="actions"]');
  const targets = root.querySelector('[data-role="targets"]');
  const button = (label, fn) => {
    const b = document.createElement('button');
    b.textContent = label;
    b.style.cssText = 'border:1px solid rgba(255,255,255,.22);background:#eee4d4;color:#211a14;padding:7px 9px;font:700 10px system-ui;cursor:pointer';
    b.onclick = fn;
    return b;
  };

  actions.append(
    button('WALK_V2 · forward', () => api.startForward()),
    button('BACKWARD', () => api.startBackward()),
    button('STOP_V2', () => api.stop()),
    button('TURN_LEFT_V2', () => api.turnLeft()),
    button('TURN_RIGHT_V2', () => api.turnRight()),
    button('JUMP', () => api.jump()),
    button('Click-to-move', () => api.setClickToMove(!api.clickToMove)),
  );
  for (const target of api.destinations) targets.append(button(target.label, () => api.goToSemantic(target.id)));

  const timer = setInterval(() => {
    const r = api.report();
    status.textContent = r.lastStatus;
    diag.textContent = `state=${r.character.state} dir=${r.character.manualDirection} events=${r.collision.events} corrections=${r.collision.corrections} camera=${r.camera.follow?.slot || '—'} dist=${(r.camera.follow?.distance || 0).toFixed(2)} holds=${r.camera.follow?.comfortHolds || 0}`;
  }, 120);

  return { dispose() { clearInterval(timer); root.remove(); } };
}

export async function installPropertyRoomCharacterFreeMobility(runtime = window.__IW?.runtime) {
  if (!runtime || !window.__IW?.ready) throw new Error('S3-B2A requires READY Property Room runtime');
  if (!runtime.sceneKit?.scene) throw new Error('S3-B2A requires runtime.sceneKit.scene');
  if (!window.__IW?.renderHost) throw new Error('S3-B2A requires existing RenderHost');
  if (typeof runtime.explore?._resolveCollision !== 'function') throw new Error('S3-B2A requires proven ExploreController collision solver');
  if (window.__IW_CHARACTER_FREE?.ready) return window.__IW_CHARACTER_FREE;

  if (runtime.experience?.transport !== 'IDLE') runtime.exitRoute();
  window.__IW?.input?.setEnabled?.(false);

  const adapter = await createMuseumCharacterRuntimeAdapter({
    runtime,
    renderHost: window.__IW.renderHost,
    spaceId: runtime.state.activeSpaceId,
    rootName: 'S3B2A_FREE_CHARACTER_2027_ROOT',
    suppressLegacyGuide: true,
  });

  const scene = runtime.sceneKit.scene;
  const spaceId = runtime.state.activeSpaceId;
  const volume = runtime.sceneKit.navigationVolume(spaceId);
  if (!volume?.bounds) throw new Error(`No navigation volume for ${spaceId}`);

  const furnitureBlockers = collectFurnitureBlockers(scene);
  const allBlockers = [...(volume.blockers || []), ...furnitureBlockers];
  const collisionOracle = new ExploreController({ radius: CHARACTER_RADIUS, eyeHeight: runtime.explore.eyeHeight });
  collisionOracle.setNavigationVolume({ bounds: volume.bounds, blockers: allBlockers });

  const collision = {
    total: 0, wall: 0, blocker: 0, corrections: 0, events: 0,
    wallEvents: 0, blockerEvents: 0, last: null, active: null, history: [],
  };
  const groundY = volume.bounds.min[1];

  function registerCollision(kind, desired, resolved) {
    collision.total += 1;
    collision.corrections += 1;
    if (kind === 'WALL') collision.wall += 1; else collision.blocker += 1;
    collision.last = kind;
    if (collision.active !== kind) {
      collision.active = kind;
      collision.events += 1;
      if (kind === 'WALL') collision.wallEvents += 1; else collision.blockerEvents += 1;
      collision.history.push({ t: Math.round(performance.now()), type: 'CONTACT_START', kind, desired: desired.toArray(), resolved: resolved.toArray() });
      if (collision.history.length > 80) collision.history.shift();
    }
  }

  function resolvePosition(proposed) {
    const desired = new THREE.Vector3(proposed.x, groundY, proposed.z);
    const resolvedEye = collisionOracle._resolveCollision([desired.x, groundY + collisionOracle.eyeHeight, desired.z]);
    const resolved = new THREE.Vector3(resolvedEye[0], groundY, resolvedEye[2]);
    if (Math.hypot(resolved.x - desired.x, resolved.z - desired.z) > COLLISION_EPS) {
      registerCollision(pointOutsideInflatedBounds(desired, volume.bounds, CHARACTER_RADIUS) ? 'WALL' : 'BLOCKER', desired, resolved);
    } else collision.active = null;
    return resolved;
  }
  adapter.controller.setNavigationResolver(resolvePosition);

  const startCandidates = ['anchor.gallery-a.guide-horizonte', 'anchor.gallery-a.guide-division'];
  let startTarget = null;
  for (const anchorId of startCandidates) {
    if (!runtime.store.has(anchorId)) continue;
    try {
      startTarget = adapter.contract.resolve({ anchorId, subjectRef: anchorId.includes('horizonte') ? 'entity.artwork.horizonte-interrumpido' : null });
      if (adapter.contract.validatePoint(startTarget.position).safe) break;
    } catch { startTarget = null; }
  }
  if (!startTarget) throw new Error('S3-B2A could not resolve a safe Character start target');
  adapter.placeAt(startTarget);
  adapter.root.visible = true;
  adapter.enforceSingleBody();
  adapter.requestDirected('S3-B2A.2 free Character mobility');

  const cameraTarget = new THREE.Vector3();
  const desiredCamera = new THREE.Vector3();
  const smoothedCamera = window.__IW.renderHost.camera.position.clone();
  const smoothedTarget = new THREE.Vector3(adapter.root.position.x, adapter.root.position.y + 1.02, adapter.root.position.z);
  const forward = new THREE.Vector3();
  const right = new THREE.Vector3();
  const cameraProbeFrom = new THREE.Vector3();
  const cameraState = { slot: 'INIT', distance: 0, occlusionFallbacks: 0, comfortHolds: 0, minComfortDistance: CAMERA_MIN_COMFORT_DISTANCE };
  let lastSafeCamera = smoothedCamera.clone();
  let clickToMove = false;
  let manualDirection = 0;
  let manualMoving = false;
  let busy = false;
  let disposed = false;
  let lastStatus = 'READY · FREE MOBILITY';
  const keys = new Set();
  const movementLog = [];

  function setStatus(text) { lastStatus = text; }
  function ensureWalkAnimation(direction = 1) {
    if (adapter.controller.currentState !== 'WALK_V2' && adapter.controller.has('WALK_V2')) {
      adapter.character.perform('WALK_V2', { status: direction > 0 ? 'FREE WALK · Room collision active' : 'BACKWARD · Room collision active' });
    }
  }
  function stopManual() {
    manualDirection = 0;
    if (manualMoving) adapter.character.stop();
    manualMoving = false;
    setStatus('STOP_V2 · STOPPED');
  }
  function startManual(direction) {
    if (busy) return;
    adapter.controller.navigation.mode = 'IDLE';
    manualDirection = direction >= 0 ? 1 : -1;
    manualMoving = true;
    ensureWalkAnimation(manualDirection);
    setStatus(manualDirection > 0 ? 'WALK_V2 · FORWARD' : 'BACKWARD · WALK_V2 body cycle');
  }
  const startForward = () => startManual(1);
  const startBackward = () => startManual(-1);
  function turnLeft() { if (!busy) { stopManual(); adapter.controller.turnBy(Math.PI / 2); setStatus('TURN_LEFT_V2'); } }
  function turnRight() { if (!busy) { stopManual(); adapter.controller.turnBy(-Math.PI / 2); setStatus('TURN_RIGHT_V2'); } }
  function jump() {
    if (busy) return;
    stopManual();
    if (!adapter.controller.has('JUMP')) { setStatus('JUMP unavailable'); return; }
    adapter.character.perform('JUMP', { status: 'JUMP · body action / grounded world root' });
    setStatus('JUMP');
  }

  async function waitNavigationIdle(timeoutMs = 12000) {
    const started = performance.now();
    while (performance.now() - started < timeoutMs) {
      if (adapter.updateError) throw new Error(adapter.updateError);
      if (adapter.controller.navigation.mode === 'IDLE') return true;
      await wait(25);
    }
    return false;
  }

  async function goToPoint(point, label = 'clicked floor') {
    if (busy || disposed) return false;
    const target = resolvePosition(new THREE.Vector3(point[0], groundY, point[2])).toArray();
    if (!adapter.contract.validatePoint(target).inside) { setStatus('TARGET REJECTED · fuera de Room'); return false; }
    const plan = adapter.contract.routePlan(adapter.root.position.toArray(), target);
    if (!plan.points.length) { setStatus('TARGET BLOCKED · usa movimiento libre para bordear'); return false; }
    busy = true;
    stopManual();
    const started = adapter.root.position.clone();
    try {
      for (const p of plan.points) {
        adapter.character.moveTo(p, { label, walkSpeed: FREE_SPEED, stopDistance: 0.08 });
        if (!(await waitNavigationIdle())) throw new Error(`Character did not settle for ${label}`);
      }
      movementLog.push({ type: 'POINT', label, from: started.toArray(), to: adapter.root.position.toArray(), route: plan.source, collisionEvents: collision.events, collisionCorrections: collision.corrections });
      setStatus(`ARRIVED · ${label}`);
      return true;
    } finally { busy = false; }
  }

  async function goToSemantic(id) {
    const entry = SEMANTIC_DESTINATIONS.find((x) => x.id === id);
    if (!entry || !runtime.store.has(entry.anchorId)) { setStatus(`SEMANTIC TARGET unavailable · ${id}`); return false; }
    const target = adapter.contract.resolve({ anchorId: entry.anchorId, subjectRef: runtime.store.has(entry.subjectRef) ? entry.subjectRef : null });
    const ok = await goToPoint(target.position, entry.label);
    if (ok && target.lookAt) {
      adapter.character.turnTo(target.lookAt, { turnSpeed: 6, status: `Facing ${entry.label}` });
      adapter.character.lookAt(target.lookAt, { weight: 1, status: `LookAt ${entry.label}` });
    }
    return ok;
  }

  function setClickToMove(value) { clickToMove = Boolean(value); setStatus(`CLICK-TO-MOVE ${clickToMove ? 'ON' : 'OFF'}`); }

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -groundY);
  const hitPoint = new THREE.Vector3();
  function onCanvasClick(event) {
    if (!clickToMove || busy) return;
    const canvas = window.__IW.renderHost.canvas || document.getElementById('iw-canvas');
    const rect = canvas.getBoundingClientRect();
    mouse.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -(((event.clientY - rect.top) / rect.height) * 2 - 1));
    raycaster.setFromCamera(mouse, window.__IW.renderHost.camera);
    if (!raycaster.ray.intersectPlane(floorPlane, hitPoint)) return;
    event.preventDefault(); event.stopPropagation(); void goToPoint(hitPoint.toArray(), 'click-to-move');
  }

  function onKeyDown(event) {
    if (event.target?.matches?.('input,textarea,select,[contenteditable="true"]')) return;
    const key = event.key.toLowerCase();
    if (key === 'w') { keys.add('w'); startForward(); event.preventDefault(); }
    else if (key === 's') { keys.add('s'); startBackward(); event.preventDefault(); }
    else if (key === 'x' || event.key === 'Escape') { keys.clear(); stopManual(); event.preventDefault(); }
    else if (key === 'a' && !event.repeat) { turnLeft(); event.preventDefault(); }
    else if (key === 'd' && !event.repeat) { turnRight(); event.preventDefault(); }
    else if (event.code === 'Space' && !event.repeat) { jump(); event.preventDefault(); }
    else if (key === 'c' && !event.repeat) { setClickToMove(!clickToMove); event.preventDefault(); }
  }
  function onKeyUp(event) {
    const key = event.key.toLowerCase();
    if (key === 'w') keys.delete('w');
    if (key === 's') keys.delete('s');
    if ((key === 'w' && manualDirection > 0) || (key === 's' && manualDirection < 0)) stopManual();
  }

  const canvas = window.__IW.renderHost.canvas || document.getElementById('iw-canvas');
  canvas.addEventListener('click', onCanvasClick, true);
  window.addEventListener('keydown', onKeyDown, true);
  window.addEventListener('keyup', onKeyUp, true);

  function cameraCandidateIsComfortable(candidate) {
    return cameraPointInsideBounds(candidate, volume.bounds)
      && !allBlockers.some((blocker) => pointInsideBlocker(candidate, blocker, CAMERA_CLEARANCE))
      && candidate.distanceTo(cameraTarget) >= CAMERA_MIN_COMFORT_DISTANCE
      && segmentClear(cameraProbeFrom, candidate, volume.bounds, allBlockers);
  }

  function chooseCameraPosition() {
    const human = adapter.root.position;
    forward.set(0, 0, 1).applyQuaternion(adapter.root.quaternion).setY(0);
    if (forward.lengthSq() < 1e-6) forward.set(0, 0, 1); else forward.normalize();
    right.set(forward.z, 0, -forward.x).normalize();
    cameraTarget.set(human.x, human.y + Math.min(adapter.canonicalHeight * CAMERA_TARGET_HEIGHT_FACTOR, 1.08), human.z);
    cameraProbeFrom.copy(cameraTarget);

    const distances = [4.2, 3.65, 3.15, 2.75];
    const laterals = [0, 1.05, -1.05, 1.65, -1.65, 2.1, -2.1];
    const heights = [2.15, 2.4, 1.95];
    let chosen = null;
    let chosenSlot = 'HOLD_LAST_SAFE';

    outer:
    for (const distance of distances) {
      for (const lateral of laterals) {
        for (const height of heights) {
          desiredCamera.copy(human).addScaledVector(forward, -distance).addScaledVector(right, lateral);
          desiredCamera.y = human.y + height;
          if (!cameraCandidateIsComfortable(desiredCamera)) continue;
          chosen = desiredCamera.clone();
          chosenSlot = `D${distance.toFixed(2)} L${lateral.toFixed(2)} H${height.toFixed(2)}`;
          break outer;
        }
      }
    }

    if (!chosen) {
      cameraState.occlusionFallbacks += 1;
      if (cameraCandidateIsComfortable(lastSafeCamera)) {
        chosen = lastSafeCamera.clone();
        cameraState.comfortHolds += 1;
      } else {
        // Emergency high shoulder: still refuses a close-up. It is clamped to the
        // Room, and if the result remains uncomfortable we keep the previous pose.
        desiredCamera.copy(human).addScaledVector(forward, -2.8).addScaledVector(right, 1.25);
        desiredCamera.y = human.y + 2.55;
        desiredCamera.x = THREE.MathUtils.clamp(desiredCamera.x, volume.bounds.min[0] + CAMERA_CLEARANCE, volume.bounds.max[0] - CAMERA_CLEARANCE);
        desiredCamera.z = THREE.MathUtils.clamp(desiredCamera.z, volume.bounds.min[2] + CAMERA_CLEARANCE, volume.bounds.max[2] - CAMERA_CLEARANCE);
        if (cameraCandidateIsComfortable(desiredCamera)) {
          chosen = desiredCamera.clone(); chosenSlot = 'EMERGENCY_HIGH_SHOULDER';
        } else {
          chosen = smoothedCamera.clone(); cameraState.comfortHolds += 1;
        }
      }
    }

    if (chosen.distanceTo(cameraTarget) >= CAMERA_MIN_COMFORT_DISTANCE) lastSafeCamera.copy(chosen);
    cameraState.slot = chosenSlot;
    cameraState.distance = chosen.distanceTo(cameraTarget);
    return chosen;
  }

  const adapterFrame = runtime.onFrame;
  runtime.onFrame = (pose, dt) => {
    if (!disposed && manualDirection !== 0 && !busy && adapter.controller.navigation.mode === 'IDLE') {
      ensureWalkAnimation(manualDirection);
      forward.set(0, 0, 1).applyQuaternion(adapter.root.quaternion).setY(0).normalize();
      const speed = manualDirection > 0 ? FREE_SPEED : BACKWARD_SPEED;
      const desired = adapter.root.position.clone().addScaledVector(forward, speed * dt * manualDirection);
      const before = adapter.root.position.clone();
      adapter.root.position.copy(resolvePosition(desired));
      if (adapter.root.position.distanceTo(before) < 0.0005) setStatus(`CONTACT · ${collision.last || 'BLOCKED'}`);
      manualMoving = true;
    }

    const chosenCamera = chooseCameraPosition();
    const alpha = 1 - Math.exp(-CAMERA_LERP_RATE * Math.max(0.001, dt));
    if (chosenCamera.distanceTo(smoothedCamera) > CAMERA_POSITION_DEAD_ZONE) smoothedCamera.lerp(chosenCamera, alpha);
    if (cameraTarget.distanceTo(smoothedTarget) > CAMERA_TARGET_DEAD_ZONE) smoothedTarget.lerp(cameraTarget, Math.min(1, alpha * 1.15));
    runtime.directed.snapTo({ position: smoothedCamera.toArray(), target: smoothedTarget.toArray(), fov: 52 });
    adapterFrame?.(pose, dt);
  };

  const destinations = SEMANTIC_DESTINATIONS.filter((x) => runtime.store.has(x.anchorId));
  const preflight = {
    pass: true,
    environment: 'ACTUAL_PROPERTY_ROOM_VISITOR_RUNTIME',
    spaceId,
    collisionAuthority: 'MUSEUM_EXPLORE_CONTROLLER_EXACT_SOLVER',
    staticBlockers: (volume.blockers || []).length,
    dynamicFurnitureBlockers: furnitureBlockers.map((b) => b.source),
    bounds: volume.bounds,
    characterRadius: CHARACTER_RADIUS,
    canonicalHeight: adapter.canonicalHeight,
    provenance: adapter.loaded.provenance,
    matrixAuthority: adapter.audit().matrixAuthority,
    destinations: destinations.map((x) => x.id),
    freeMovement: { forward: true, backward: true, stop: true, turnLeft: true, turnRight: true, jump: adapter.controller.has('JUMP'), adaptiveCamera: true, cameraComfortGuard: true },
  };
  if (!preflight.provenance.exactApprovedAssetMatch || !preflight.matrixAuthority.pass || Math.abs(preflight.canonicalHeight - 1.66) > .001) {
    throw new Error(`S3-B2A preflight failed: ${JSON.stringify(preflight)}`);
  }

  let controls = null;
  const api = {
    ready: true, runtime, adapter, preflight, collision, movementLog, destinations,
    startForward, startBackward, stop: stopManual, turnLeft, turnRight, jump,
    goToPoint, goToSemantic, setClickToMove,
    get clickToMove() { return clickToMove; },
    get lastStatus() { return lastStatus; },
    report() {
      const diagnostics = adapter.controller.getDiagnostics();
      return {
        phase: 'S3-B2A2_CAMERA_COMFORT_POLISH',
        environment: preflight.environment,
        preflight,
        clickToMove,
        lastStatus,
        character: { position: adapter.root.position.toArray(), state: adapter.controller.currentState, navigationMode: diagnostics.navigationMode, constrained: diagnostics.constrained, manualDirection, updateError: adapter.updateError },
        collision: { ...collision, history: [...collision.history] },
        movementLog: [...movementLog],
        camera: { ...runtime.camera.report(), follow: { ...cameraState, position: smoothedCamera.toArray(), target: smoothedTarget.toArray() } },
        runtimeInvariants: window.__IW?.assertInvariants?.() || [],
      };
    },
    dispose() {
      disposed = true;
      controls?.dispose();
      canvas.removeEventListener('click', onCanvasClick, true);
      window.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('keyup', onKeyUp, true);
      runtime.onFrame = adapterFrame;
      adapter.controller.setNavigationResolver(null);
      adapter.dispose();
      window.__IW?.input?.setEnabled?.(true);
      runtime.camera.request(CAMERA_AUTHORITY.EXPLORE, { reason: 'S3-B2A.2 dispose', durationMs: 250, restore: 'ADOPT_INCOMING' });
      delete window.__IW_CHARACTER_FREE;
    },
  };

  controls = installControls(api);
  window.__IW_CHARACTER_FREE = api;
  document.documentElement.dataset.characterFreeMobility = 'ready';
  return api;
}
