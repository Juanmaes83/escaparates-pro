// S3-B2C — CHARACTER CINEMATIC CAMERA
// Thin intent layer over the EXISTING Museum CameraAuthority + DirectedController.
// It does not create a camera, renderer, controller authority or navigation system.
// B2A continues producing a safe follow pose; this layer decides when that pose
// should remain TRAVEL and when Museum's shot language should recompose it.

import * as THREE from 'three185';
import { distanceToFrame } from '../../../../property-room-v1/engine/camera/framing.js';

export const CHARACTER_CAMERA_INTENTS = Object.freeze({
  TRAVEL: 'TRAVEL',
  SETTLE: 'SETTLE',
  COMPANION: 'COMPANION',
  FOCUS: 'FOCUS',
  INTERACTION: 'INTERACTION',
  CROSSING: 'CROSSING',
});

const SOCIAL = new Set(['WAVE','GOODBYE','NOD','WELCOME','AFTER_YOU']);
const FOCUS = new Set(['POINT','LOOK_AT']);
const INTERACTION = new Set(['PRESS_DOORBELL','KNOCK_DOOR','PICK_UP_CUP','OPEN_DOOR','PICK_UP_PHONE','PICK_UP_MAGAZINE','SIT_SOFA','LEAN_WALL']);
const TRAVEL_STATES = new Set(['WALK_V2','WALK','TURN_LEFT_V2','TURN_RIGHT_V2','TURN_LEFT','TURN_RIGHT']);
const COLLIDABLE_PROPERTY_OBJECTS = Object.freeze([
  'property-room:fixture:SARAH_SOFA',
  'property-room:fixture:SARAH_SIDE_TABLE',
  'property-room:fixture:DIGITAL_DESK_FURNITURE',
  'property-room:fixture:LIGHT_FIXTURE',
  'property-room:fixture:COAT_RACK',
  'property-room:activator:VIDEO_PORTAL',
]);

const CAMERA_CLEARANCE = 0.22;
const SETTLE_DELAY_MS = 560;
const HEAD_FACTOR = 0.63;

function visible(node) {
  let cursor = node;
  while (cursor) { if (cursor.visible === false) return false; cursor = cursor.parent; }
  return Boolean(node);
}

function boxFor(object) {
  if (!object || !visible(object)) return null;
  object.updateWorldMatrix(true, true);
  const box = new THREE.Box3().setFromObject(object);
  return box.isEmpty() ? null : box;
}

function pointInsideBox(point, box, padding = 0) {
  return point.x >= box.min.x - padding && point.x <= box.max.x + padding
    && point.y >= box.min.y - padding && point.y <= box.max.y + padding
    && point.z >= box.min.z - padding && point.z <= box.max.z + padding;
}

function segmentClear(from, to, bounds, blockers) {
  const probe = new THREE.Vector3();
  for (let i = 2; i <= 18; i += 1) {
    probe.lerpVectors(from, to, i / 18);
    if (probe.x < bounds.min[0] + CAMERA_CLEARANCE || probe.x > bounds.max[0] - CAMERA_CLEARANCE
      || probe.z < bounds.min[2] + CAMERA_CLEARANCE || probe.z > bounds.max[2] - CAMERA_CLEARANCE) return false;
    if (blockers.some((box) => pointInsideBox(probe, box, CAMERA_CLEARANCE))) return false;
  }
  return true;
}

function asVec3(value) {
  if (!value) return null;
  if (value.isVector3) return value.clone();
  if (Array.isArray(value)) return new THREE.Vector3(value[0], value[1], value[2]);
  if (Number.isFinite(value.x)) return new THREE.Vector3(value.x, value.y, value.z);
  return null;
}

function poseArray(position, target, fov) {
  return { position: position.toArray(), target: target.toArray(), fov };
}

function installPanel(api) {
  document.getElementById('s3b2c-cinematic-camera')?.remove();
  const root = document.createElement('div');
  root.id = 's3b2c-cinematic-camera';
  root.style.cssText = 'position:fixed;left:14px;top:52px;z-index:12400;padding:8px 10px;min-width:245px;background:rgba(17,14,12,.78);border:1px solid rgba(255,255,255,.16);backdrop-filter:blur(10px);color:#f3eadf;font:600 9px/1.35 ui-monospace,monospace;pointer-events:none';
  root.innerHTML = '<strong>S3-B2C · CINEMATIC CAMERA</strong><div data-role="intent" style="margin-top:4px;opacity:.85">TRAVEL</div><div data-role="detail" style="margin-top:2px;opacity:.62"></div>';
  document.body.append(root);
  const intent = root.querySelector('[data-role="intent"]');
  const detail = root.querySelector('[data-role="detail"]');
  const timer = setInterval(() => {
    const r = api.report();
    intent.textContent = `${r.intent} · ${r.characterState || '—'}`;
    detail.textContent = `shots=${r.shots} fallbacks=${r.fallbacks} owner=${r.camera.owner}`;
  }, 120);
  return { dispose() { clearInterval(timer); root.remove(); } };
}

export function installPropertyRoomCharacterCinematicCamera(runtime = window.__IW?.runtime, freeApi = window.__IW_CHARACTER_FREE) {
  if (!runtime?.camera || !runtime?.directed) throw new Error('S3-B2C requires existing Museum CameraAuthority + DirectedController');
  if (!freeApi?.ready || !freeApi.adapter?.root) throw new Error('S3-B2C requires READY B2A free Character');
  if (window.__IW_CHARACTER_CINEMATIC_CAMERA?.ready) return window.__IW_CHARACTER_CINEMATIC_CAMERA;

  const root = freeApi.adapter.root;
  const controller = freeApi.adapter.controller;
  const lookAt = freeApi.adapter.lookAt;
  const renderHost = window.__IW?.renderHost;
  const spaceId = runtime.state.activeSpaceId;
  const volume = runtime.sceneKit.navigationVolume(spaceId);
  if (!volume?.bounds || !renderHost?.camera) throw new Error('S3-B2C requires Room bounds and existing render camera');

  const blockers = COLLIDABLE_PROPERTY_OBJECTS.map((name) => boxFor(runtime.sceneKit.scene.getObjectByName(name))).filter(Boolean);
  const originalSnapTo = runtime.directed.snapTo.bind(runtime.directed);
  const originalPlayShot = runtime.directed.playShot.bind(runtime.directed);
  const originalOnShotComplete = runtime.directed.onShotComplete;

  let disposed = false;
  let intent = CHARACTER_CAMERA_INTENTS.TRAVEL;
  let previousIntent = null;
  let previousState = null;
  let lastMovementAt = performance.now();
  let shots = 0;
  let fallbacks = 0;
  let lastBasePose = null;
  let lastShot = null;
  let panel = null;

  const characterForward = new THREE.Vector3();
  const characterRight = new THREE.Vector3();
  const head = new THREE.Vector3();

  function basis() {
    characterForward.set(0, 0, 1).applyQuaternion(root.quaternion).setY(0);
    if (characterForward.lengthSq() < 1e-8) characterForward.set(0, 0, 1); else characterForward.normalize();
    characterRight.set(characterForward.z, 0, -characterForward.x).normalize();
    head.copy(root.position).add(new THREE.Vector3(0, Math.min(freeApi.adapter.canonicalHeight * HEAD_FACTOR, 1.08), 0));
    return { forward: characterForward, right: characterRight, head };
  }

  function safe(position, target) {
    if (!position || !target) return false;
    const b = volume.bounds;
    if (position.x < b.min[0] + CAMERA_CLEARANCE || position.x > b.max[0] - CAMERA_CLEARANCE
      || position.z < b.min[2] + CAMERA_CLEARANCE || position.z > b.max[2] - CAMERA_CLEARANCE) return false;
    if (blockers.some((box) => pointInsideBox(position, box, CAMERA_CLEARANCE))) return false;
    if (position.distanceTo(target) < 1.9) return false;
    return segmentClear(target, position, b, blockers);
  }

  function subjectPoint() {
    const interaction = controller.postProcessor?.interaction;
    const direct = asVec3(interaction?.contactPoint || interaction?.seatPoint || interaction?.gripPoint || lookAt?.target);
    if (direct) return direct;
    const { forward } = basis();
    return head.clone().addScaledVector(forward, 2.0);
  }

  function interactionObjectCentre() {
    const object = controller.postProcessor?.interaction?.object;
    const box = boxFor(object);
    return box ? box.getCenter(new THREE.Vector3()) : subjectPoint();
  }

  function frontThreeQuarterPose(kind, basePose, targetOverride = null) {
    const { forward, right } = basis();
    const viewport = { aspect: renderHost.camera.aspect || 1.6, vfov: renderHost.camera.fov || 52 };
    const fill = kind === CHARACTER_CAMERA_INTENTS.COMPANION ? 0.66 : 0.58;
    const distance = THREE.MathUtils.clamp(distanceToFrame({ width: 0.92, height: freeApi.adapter.canonicalHeight }, viewport, fill), 2.45, 3.8);
    const target = targetOverride || head.clone().add(new THREE.Vector3(0, -0.12, 0));
    const directions = [
      forward.clone().multiplyScalar(0.48).addScaledVector(right, 1).normalize(),
      forward.clone().multiplyScalar(0.48).addScaledVector(right, -1).normalize(),
      forward.clone().multiplyScalar(0.72).addScaledVector(right, 0.75).normalize(),
      forward.clone().multiplyScalar(0.72).addScaledVector(right, -0.75).normalize(),
      forward.clone().addScaledVector(right, 0.35).normalize(),
      forward.clone().addScaledVector(right, -0.35).normalize(),
    ];
    for (const direction of directions) {
      const candidate = root.position.clone().addScaledVector(direction, distance);
      candidate.y = root.position.y + (kind === CHARACTER_CAMERA_INTENTS.COMPANION ? 1.62 : 1.82);
      if (safe(candidate, target)) return poseArray(candidate, target, kind === CHARACTER_CAMERA_INTENTS.COMPANION ? 46 : 49);
    }
    fallbacks += 1;
    return basePose;
  }

  function focusPose(basePose, interaction = false) {
    const { forward, right } = basis();
    const subject = interaction ? interactionObjectCentre() : subjectPoint();
    const characterPoint = head.clone().add(new THREE.Vector3(0, -0.18, 0));
    const target = characterPoint.clone().lerp(subject, interaction ? 0.58 : 0.62);
    const separation = Math.max(0.8, characterPoint.distanceTo(subject));
    const distance = THREE.MathUtils.clamp(2.7 + separation * 0.38, 2.7, 4.4);
    const directions = [
      forward.clone().multiplyScalar(-0.35).addScaledVector(right, 1).normalize(),
      forward.clone().multiplyScalar(-0.35).addScaledVector(right, -1).normalize(),
      forward.clone().multiplyScalar(0.25).addScaledVector(right, 1).normalize(),
      forward.clone().multiplyScalar(0.25).addScaledVector(right, -1).normalize(),
    ];
    for (const dir of directions) {
      const candidate = target.clone().addScaledVector(dir, distance);
      candidate.y = Math.max(root.position.y + 1.55, target.y + 0.55);
      if (safe(candidate, target)) return poseArray(candidate, target, interaction ? 44 : 42);
    }
    fallbacks += 1;
    return frontThreeQuarterPose(CHARACTER_CAMERA_INTENTS.SETTLE, basePose, target);
  }

  function classify(state) {
    const nav = controller.navigation?.mode || 'IDLE';
    const moving = TRAVEL_STATES.has(state) || nav === 'WALK_TO' || nav === 'PRE_TURN_WALK' || nav === 'TURN_TO' || nav === 'TURN_BY';
    if (moving) {
      lastMovementAt = performance.now();
      return CHARACTER_CAMERA_INTENTS.TRAVEL;
    }
    if (INTERACTION.has(state)) return CHARACTER_CAMERA_INTENTS.INTERACTION;
    if (FOCUS.has(state)) return CHARACTER_CAMERA_INTENTS.FOCUS;
    if (SOCIAL.has(state)) return CHARACTER_CAMERA_INTENTS.COMPANION;
    if (performance.now() - lastMovementAt < SETTLE_DELAY_MS) return CHARACTER_CAMERA_INTENTS.TRAVEL;
    return CHARACTER_CAMERA_INTENTS.SETTLE;
  }

  function issueShot(nextIntent, basePose) {
    let pose = basePose;
    let options = { travelMs: 820, flat: 0.05, lead: 0.12, holdHeight: false };
    if (nextIntent === CHARACTER_CAMERA_INTENTS.SETTLE) {
      pose = frontThreeQuarterPose(nextIntent, basePose);
      options = { travelMs: 1050, flat: 0.08, lead: 0.20, holdHeight: false };
    } else if (nextIntent === CHARACTER_CAMERA_INTENTS.COMPANION) {
      pose = frontThreeQuarterPose(nextIntent, basePose);
      options = { travelMs: 760, flat: 0.02, lead: 0.24, holdHeight: false };
    } else if (nextIntent === CHARACTER_CAMERA_INTENTS.FOCUS) {
      pose = focusPose(basePose, false);
      options = { travelMs: 880, flat: 0.06, lead: 0.30, holdHeight: false };
    } else if (nextIntent === CHARACTER_CAMERA_INTENTS.INTERACTION) {
      pose = focusPose(basePose, true);
      options = { travelMs: 720, flat: 0.04, lead: 0.26, holdHeight: false };
    }
    lastShot = { intent: nextIntent, pose, state: controller.currentState, t: Math.round(performance.now()) };
    shots += 1;
    originalPlayShot(pose, options);
  }

  function consumeFollowPose(basePose) {
    if (disposed) return originalSnapTo(basePose);
    lastBasePose = { position: [...basePose.position], target: [...basePose.target], fov: basePose.fov ?? 52 };
    const state = controller.currentState || 'IDLE_V2';
    const nextIntent = classify(state);
    const intentChanged = nextIntent !== intent || state !== previousState;
    previousIntent = intent;
    intent = nextIntent;

    if (intent === CHARACTER_CAMERA_INTENTS.TRAVEL) {
      // Dynamic safe B2A follow stays authoritative while travelling.
      originalSnapTo(lastBasePose);
    } else if (intentChanged || !lastShot) {
      issueShot(intent, lastBasePose);
    }

    previousState = state;
    return runtime.directed._holdPose;
  }

  runtime.directed.snapTo = consumeFollowPose;
  runtime.directed.onShotComplete = () => {
    originalOnShotComplete?.();
    // Hold the completed shot. B2A follow calls continue arriving but are swallowed
    // until intent changes back to TRAVEL or another cinematic shot is requested.
  };

  const api = {
    ready: true,
    intents: CHARACTER_CAMERA_INTENTS,
    get intent() { return intent; },
    requestCrossingPreview() { intent = CHARACTER_CAMERA_INTENTS.CROSSING; },
    report() {
      return {
        phase: 'S3-B2C_CHARACTER_CINEMATIC_CAMERA',
        intent,
        previousIntent,
        characterState: controller.currentState,
        navigationMode: controller.navigation?.mode,
        shots,
        fallbacks,
        lastShot,
        lastBasePose,
        camera: runtime.camera.report(),
        invariants: window.__IW?.assertInvariants?.() || [],
      };
    },
    dispose() {
      disposed = true;
      panel?.dispose();
      runtime.directed.snapTo = originalSnapTo;
      runtime.directed.onShotComplete = originalOnShotComplete;
      if (lastBasePose) originalSnapTo(lastBasePose);
      delete window.__IW_CHARACTER_CINEMATIC_CAMERA;
      delete document.documentElement.dataset.characterCinematicCamera;
    },
  };

  panel = installPanel(api);
  window.__IW_CHARACTER_CINEMATIC_CAMERA = api;
  document.documentElement.dataset.characterCinematicCamera = 'ready';
  return api;
}
