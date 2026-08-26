import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { CharacterActionAPI } from '../api/CharacterActionAPI.js';
import { MotionController } from '../animation/MotionController.js';
import { registerMotionFoundationV2 } from '../animation/MotionFoundationV2.js';
import { LookAtController } from '../interaction/LookAtController.js';
import { inspectHumanoid, unifyCompatibleSkeletons } from '../rig/BoneMap.js';
import { APPROVED_AVATAR } from '../probe/s3a0-compatibility-probe.js';
import { EXTERIOR_PILOT_ROUTE } from './exterior-pilot-skeleton.js';

const HEIGHT = 1.66;
const RADIUS = 0.34;
const STEP = 0.38;
const WALK_SPEED = 1.7;
const BACKWARD_SPEED = 1.05;
const TURN_SPEED = 2.25;
const GRAVITY = 11.5;
const JUMP_VELOCITY = 4.0;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function sha256Hex(bytes) {
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function parseGlb(bytes) {
  const assetUrl = new URL(APPROVED_AVATAR.url, window.location.href);
  return new Promise((resolve, reject) => new GLTFLoader().parse(bytes, new URL('.', assetUrl).href, resolve, reject));
}

async function loadAcceptedCharacter() {
  const response = await fetch(APPROVED_AVATAR.url, { cache: 'force-cache', mode: 'cors' });
  if (!response.ok) throw new Error(`Approved Character fetch failed: HTTP ${response.status}`);
  const bytes = await response.arrayBuffer();
  const sha256 = await sha256Hex(bytes);
  if (bytes.byteLength !== APPROVED_AVATAR.expectedByteLength || sha256 !== APPROVED_AVATAR.expectedSha256) {
    throw new Error(`Approved Character provenance mismatch: ${bytes.byteLength} bytes / ${sha256}`);
  }
  const gltf = await parseGlb(bytes);
  const visual = gltf.scene;
  visual.traverse((object) => {
    if (!object.isMesh) return;
    object.castShadow = true;
    object.receiveShadow = true;
  });
  const source = new THREE.Box3().setFromObject(visual);
  visual.scale.multiplyScalar(HEIGHT / Math.max(source.getSize(new THREE.Vector3()).y, 0.0001));
  visual.updateMatrixWorld(true);
  const scaled = new THREE.Box3().setFromObject(visual);
  const center = scaled.getCenter(new THREE.Vector3());
  visual.position.set(-center.x, -scaled.min.y, -center.z);

  const root = new THREE.Group();
  root.name = 'CHARACTER_2027_EXTERIOR_PHYSICAL_ROOT';
  root.add(visual);
  root.updateMatrixWorld(true);
  const skeletonNormalization = unifyCompatibleSkeletons(root);
  const rig = inspectHumanoid(root);
  if (!rig.pass) throw new Error(`Approved Character rig failed: ${rig.missing.join(', ')}`);
  return { root, visual, rig, skeletonNormalization, provenance: { byteLength: bytes.byteLength, sha256, exactApprovedAssetMatch: true } };
}

function overlaps(collider, x, z, feetY) {
  if (collider.top <= feetY + STEP || collider.bottom > feetY + HEIGHT + 0.2) return false;
  return x > collider.x0 - RADIUS && x < collider.x1 + RADIUS && z > collider.z0 - RADIUS && z < collider.z1 + RADIUS;
}

function insideBounds(collision, x, z) {
  const bounds = collision.bounds;
  return x >= bounds.x0 + RADIUS && x <= bounds.x1 - RADIUS && z >= bounds.z0 + RADIUS && z <= bounds.z1 - RADIUS;
}

export async function createExteriorCharacterPilot({
  worldRoot,
  collision,
  authority,
  walker,
  cameraAuthorityName,
  phase = 'EXTERIOR_CHARACTER_EXPANDED_SKELETON_BC_PILOT'
}) {
  const cameraOccluders = [];
  worldRoot.traverse((object) => { if (object.isMesh) cameraOccluders.push(object); });
  const loaded = await loadAcceptedCharacter();
  const root = loaded.root;
  const ground = collision.heightAt(...EXTERIOR_PILOT_ROUTE.start);
  root.position.set(EXTERIOR_PILOT_ROUTE.start[0], ground, EXTERIOR_PILOT_ROUTE.start[1]);
  root.rotation.y = Math.PI / 2;
  root.visible = false;
  worldRoot.add(root);

  const controller = new MotionController(root);
  const registeredActions = registerMotionFoundationV2(controller, root);
  const lookAt = new LookAtController(root);
  const events = [];
  const character = new CharacterActionAPI({
    root,
    controller,
    lookAt,
    onStateChange: (action) => events.push({ type: 'ACTION', action, at: performance.now() }),
    onStatus: (status) => events.push({ type: 'STATUS', status, at: performance.now() })
  });
  controller.transitionTo('IDLE_V2', 0);

  const keys = new Set();
  const diagnostics = {
    active: false,
    presentation: 'THIRD_PERSON',
    physicalWriter: null,
    movementFrames: 0,
    blockedFrames: 0,
    maxGroundError: 0,
    stepUpCount: 0,
    stepDownCount: 0,
    jumpCount: 0,
    lastSurfaceId: null
  };
  let speed = 0;
  let verticalVelocity = 0;
  let airborne = false;
  let locomotion = 'IDLE';
  let terrainActionUntil = 0;
  let disposed = false;

  function supported(x, z, feetY) {
    return insideBounds(collision, x, z) && collision.isSupportedAt(x, z, feetY);
  }

  function resolve(proposed, current = root.position) {
    const next = current.clone();
    const feetY = current.y;
    const tryAxis = (axis) => {
      const value = proposed[axis];
      const x = axis === 'x' ? value : next.x;
      const z = axis === 'z' ? value : next.z;
      if (!supported(x, z, feetY)) return false;
      const targetGround = collision.heightAt(x, z, feetY);
      if (targetGround - feetY > STEP + 0.001) return false;
      if (collision.colliders.some((collider) => overlaps(collider, x, z, targetGround))) return false;
      next[axis] = value;
      return true;
    };
    const movedX = tryAxis('x');
    const movedZ = tryAxis('z');
    if (!movedX && !movedZ && proposed.distanceToSquared(current) > 1e-8) diagnostics.blockedFrames += 1;
    const targetGround = collision.heightAt(next.x, next.z, feetY);
    const delta = targetGround - feetY;
    if (!airborne && Math.abs(delta) >= 0.08 && Math.abs(delta) <= STEP + 0.001 && performance.now() >= terrainActionUntil) {
      const action = delta > 0 ? 'STEP_UP' : 'STEP_DOWN';
      character.perform(action, { status: `${action}: ${collision.walkableAt(next.x, next.z, feetY)?.walkable?.proposalId || 'surface'}` });
      diagnostics[delta > 0 ? 'stepUpCount' : 'stepDownCount'] += 1;
      events.push({ type: 'TERRAIN', action, delta, at: performance.now() });
      terrainActionUntil = performance.now() + 720;
    }
    next.y = targetGround;
    diagnostics.lastSurfaceId = collision.walkableAt(next.x, next.z, feetY)?.walkable?.proposalId || 'legacy-land';
    return next;
  }

  controller.setNavigationResolver((proposed, current) => resolve(proposed, current));

  function setLocomotion(next) {
    if (locomotion === next || performance.now() < terrainActionUntil) return;
    locomotion = next;
    if (next === 'WALK') character.perform('WALK_V2', { status: 'Exterior physical travel' });
    else if (next === 'TURN_LEFT') character.perform('TURN_LEFT_V2', { status: 'Exterior left turn' });
    else if (next === 'TURN_RIGHT') character.perform('TURN_RIGHT_V2', { status: 'Exterior right turn' });
    else character.stop();
  }

  function onKeyDown(event) {
    if (!diagnostics.active || event.repeat) return;
    if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space'].includes(event.code)) event.preventDefault();
    keys.add(event.code);
    if (event.code === 'Space' && !airborne) {
      airborne = true;
      verticalVelocity = JUMP_VELOCITY;
      diagnostics.jumpCount += 1;
      character.perform('JUMP', { status: 'Exterior physical jump' });
    }
  }

  function onKeyUp(event) { keys.delete(event.code); }
  window.addEventListener('keydown', onKeyDown, true);
  window.addEventListener('keyup', onKeyUp, true);

  function updatePhysical(dt) {
    if (!diagnostics.active || disposed) return;
    diagnostics.physicalWriter = 'CHARACTER_2027';
    diagnostics.movementFrames += 1;
    const turn = (keys.has('KeyA') ? 1 : 0) - (keys.has('KeyD') ? 1 : 0);
    const drive = (keys.has('KeyW') ? 1 : 0) - (keys.has('KeyS') ? 1 : 0);
    if (turn) root.rotation.y += turn * TURN_SPEED * dt;
    const targetSpeed = drive > 0 ? WALK_SPEED : drive < 0 ? -BACKWARD_SPEED : 0;
    const damping = drive ? 10 : 15;
    speed += (targetSpeed - speed) * (1 - Math.exp(-damping * dt));

    if (Math.abs(speed) > 0.025) {
      setLocomotion('WALK');
      const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(root.quaternion);
      const proposed = root.position.clone().addScaledVector(forward, speed * dt);
      const resolved = resolve(proposed, root.position);
      if (!airborne) root.position.copy(resolved);
      else { root.position.x = resolved.x; root.position.z = resolved.z; }
    } else if (turn > 0) setLocomotion('TURN_LEFT');
    else if (turn < 0) setLocomotion('TURN_RIGHT');
    else setLocomotion('IDLE');

    const groundY = collision.heightAt(root.position.x, root.position.z, root.position.y + STEP);
    if (airborne) {
      verticalVelocity -= GRAVITY * dt;
      root.position.y += verticalVelocity * dt;
      if (root.position.y <= groundY) {
        root.position.y = groundY;
        verticalVelocity = 0;
        airborne = false;
        terrainActionUntil = 0;
        setLocomotion(Math.abs(speed) > 0.025 ? 'WALK' : 'IDLE');
      }
    } else {
      diagnostics.maxGroundError = Math.max(diagnostics.maxGroundError, Math.abs(root.position.y - groundY));
      root.position.y = groundY;
    }
    controller.update(dt);
    lookAt.update(dt);
  }

  const cameraPosition = new THREE.Vector3();
  const cameraTarget = new THREE.Vector3();
  const lowerBodyTarget = new THREE.Vector3();
  const worldPosition = new THREE.Vector3();
  const worldQuaternion = new THREE.Quaternion();
  const forward = new THREE.Vector3();
  const right = new THREE.Vector3();
  const raycaster = new THREE.Raycaster();
  const rayDirection = new THREE.Vector3();
  const candidate = new THREE.Vector3();
  const CAMERA_CANDIDATES = [
    [2.8, -4.5, 3.0], [4.5, 1.5, 2.8], [4.0, -1.5, 2.9], [5.2, 2.8, 3.5], [4.6, -2.8, 3.6],
    [3.3, 3.5, 3.2], [3.3, -3.5, 3.2], [-3.8, 1.6, 2.9], [-3.8, -1.6, 2.9]
  ];
  let cameraInitialized = false;

  function cameraPathClear(from, to) {
    rayDirection.subVectors(to, from);
    const distance = rayDirection.length();
    if (distance < 0.8) return false;
    raycaster.set(from, rayDirection.normalize());
    raycaster.near = 0.35;
    raycaster.far = Math.max(0.35, distance - 0.42);
    return raycaster.intersectObjects(cameraOccluders, false).length === 0;
  }

  function cameraEndpointClear(point) {
    return !collision.colliders.some((collider) => point.x > collider.x0 - 0.28
      && point.x < collider.x1 + 0.28
      && point.z > collider.z0 - 0.28
      && point.z < collider.z1 + 0.28
      && point.y > collider.bottom - 0.2
      && point.y < collider.top + 0.35);
  }

  function chooseCameraPosition(target) {
    lowerBodyTarget.copy(worldPosition);
    lowerBodyTarget.y += .48;
    for (const [distance, lateral, height] of CAMERA_CANDIDATES) {
      candidate.copy(worldPosition).addScaledVector(forward, -distance).addScaledVector(right, lateral);
      candidate.y += height;
      if (cameraEndpointClear(candidate)
          && cameraPathClear(target, candidate)
          && cameraPathClear(lowerBodyTarget, candidate)) return candidate.clone();
    }
    candidate.copy(worldPosition).addScaledVector(forward, -2.8).addScaledVector(right, 3.6);
    candidate.y += 4.8;
    return candidate.clone();
  }

  const cameraController = {
    onGain() {
      diagnostics.active = true;
      diagnostics.physicalWriter = 'CHARACTER_2027';
      root.visible = true;
      walker.enabled = false;
      walker.keys.clear();
      cameraInitialized = false;
    },
    onLose() {
      diagnostics.active = false;
      diagnostics.physicalWriter = null;
      keys.clear();
      speed = 0;
      character.stop();
    },
    update(dt, commit) {
      updatePhysical(dt);
      root.getWorldPosition(worldPosition);
      root.getWorldQuaternion(worldQuaternion);
      forward.set(0, 0, 1).applyQuaternion(worldQuaternion).setY(0).normalize();
      right.set(forward.z, 0, -forward.x);
      const desiredTarget = worldPosition.clone().addScaledVector(forward, 1.05);
      desiredTarget.y += 1.02;
      const desiredPosition = chooseCameraPosition(desiredTarget);
      if (!cameraInitialized) {
        cameraPosition.copy(desiredPosition);
        cameraTarget.copy(desiredTarget);
        cameraInitialized = true;
      } else {
        const alpha = 1 - Math.exp(-6.5 * dt);
        cameraPosition.lerp(desiredPosition, alpha);
        cameraTarget.lerp(desiredTarget, Math.min(1, alpha * 1.15));
        // Candidate endpoints are raycast-safe, but smoothing between two safe
        // endpoints can temporarily pass behind street furniture. Never commit
        // an occluded intermediate pose: fall through to the already-proven
        // safe candidate for this frame instead of removing world geometry.
        if (!cameraPathClear(cameraTarget, cameraPosition)) cameraPosition.copy(desiredPosition);
      }
      commit({ position: cameraPosition.toArray(), target: cameraTarget.toArray(), fov: 48 });
    }
  };
  authority.register(cameraAuthorityName, cameraController);

  async function moveCharacterTo(point, label) {
    character.moveTo([point[0], collision.heightAt(point[0], point[1], root.position.y), point[1]], {
      label,
      walkSpeed: 5.1,
      stopDistance: 0.11
    });
    const started = performance.now();
    while (controller.navigation.mode !== 'IDLE' && performance.now() - started < 35000) await wait(25);
    return controller.navigation.mode === 'IDLE';
  }

  async function runRoute(route = EXTERIOR_PILOT_ROUTE, reason = 'qa-third-person-route') {
    setSpawnPoint(route.start, route.yaw ?? Math.PI / 2);
    authority.request(cameraAuthorityName, { reason, durationMs: 0 });
    const results = [];
    for (const [index, point] of route.waypoints.slice(1).entries()) {
      const arrived = await moveCharacterTo(point, `${route.id} waypoint ${index + 1}`);
      results.push({ point, arrived, position: root.position.toArray() });
      if (!arrived) break;
    }
    return {
      routeId: route.id,
      pass: results.length === route.waypoints.length - 1 && results.every((result) => result.arrived),
      results
    };
  }

  function runThirdPersonRoute() { return runRoute(EXTERIOR_PILOT_ROUTE, 'qa-third-person-pilot'); }

  function setSpawnPoint(point, yaw = Math.PI / 2) {
    root.position.set(point[0], collision.heightAt(point[0], point[1]), point[1]);
    root.rotation.y = yaw;
    controller.stop();
    speed = 0;
    airborne = false;
    cameraInitialized = false;
    return root.position.toArray();
  }

  function setSpawn(name = 'start') {
    const positions = {
      start: EXTERIOR_PILOT_ROUTE.start,
      urban: [-8, 9.8],
      promenade: [33.5, 10.2],
      stepLower: EXTERIOR_PILOT_ROUTE.step.lower,
      stepUpper: EXTERIOR_PILOT_ROUTE.step.upper,
      lighthouse: EXTERIOR_PILOT_ROUTE.destination
    };
    const point = positions[name] || positions.start;
    const rotations = { start: Math.PI / 2, urban: Math.PI / 2, promenade: Math.PI / 2, stepLower: -0.2, stepUpper: -0.2, lighthouse: -2.05 };
    return setSpawnPoint(point, rotations[name] ?? Math.PI / 2);
  }

  return {
    ready: true,
    root,
    character,
    controller,
    cameraController,
    route: EXTERIOR_PILOT_ROUTE,
    setSpawn,
    setSpawnPoint,
    runRoute,
    runThirdPersonRoute,
    setVisible: (visible) => { root.visible = visible; },
    report: () => {
      const groundedY = collision.heightAt(root.position.x, root.position.z, root.position.y + STEP);
      return {
      phase,
      authority: diagnostics.active ? 'CHARACTER_2027' : null,
      diagnostics: { ...diagnostics },
      position: root.position.toArray(),
      yaw: root.rotation.y,
      speed,
      groundedY,
      currentGroundError: Math.abs(root.position.y - groundedY),
      actions: Object.keys(registeredActions),
      events: events.slice(-80),
      provenance: loaded.provenance,
      rig: { pass: loaded.rig.pass, boneCount: loaded.rig.boneCount, skinnedMeshCount: loaded.rig.skinnedMeshCount },
      skeletonNormalization: loaded.skeletonNormalization
      };
    },
    dispose() {
      disposed = true;
      window.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('keyup', onKeyUp, true);
      character.dispose();
      controller.dispose();
      worldRoot.remove(root);
    }
  };
}
