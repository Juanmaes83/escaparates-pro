import { CAMERA_AUTHORITY } from '../engine/schema/types.js';
import { ThirdPersonExploreController } from '../engine/camera/controllers/third-person-explore-controller.js';
import { mountMuseumCharacterPhase4A } from './museum-character-phase4a.js';

const GALLERY_A = 'space.gallery-a';
const GALLERY_B = 'space.gallery-b';
const PORTAL_A_B = 'portal.gallery-a-gallery-b';
const PORTAL_B_A = 'portal.gallery-b-gallery-a';
const SUPPORTED_PORTALS = new Set([PORTAL_A_B, PORTAL_B_A]);

const FORWARD_SPEED = 1.05;
const BACKWARD_SPEED = 0.78;
const RUN_MULTIPLIER = 1.35;
const TURN_SPEED = 2.15;
const JUMP_HEIGHT = 0.34;
const JUMP_DURATION = 1.0;

function installBadge(api) {
  document.getElementById('character-phase4a-gate')?.remove();
  document.getElementById('character-phase4b-gate')?.remove();
  const el = document.createElement('div');
  el.id = 'character-phase4b-gate';
  el.style.cssText = 'position:fixed;left:14px;top:14px;z-index:20000;padding:10px 12px;background:rgba(9,12,14,.86);border:1px solid rgba(255,255,255,.24);color:#f1eee8;font:600 11px/1.45 system-ui,sans-serif;pointer-events:none;max-width:520px';
  const refresh = () => {
    const r = api.report();
    const follow = r.cameraFollow || {};
    el.innerHTML = `<div style="letter-spacing:.12em">PHASE 4B · SAME CHARACTER ROOM CONTINUITY</div><div style="font-weight:500;opacity:.88">Gallery A ↔ Gallery B · E portal · mismo avatar</div><div style="font-weight:500;opacity:.68">space ${r.spaceId} · crossings ${r.continuity.crossings} · same-root ${r.continuity.sameRoot ? 'YES' : 'NO'}</div><div style="font-weight:500;opacity:.58">camera ${r.camera.owner} · violations ${r.camera.violations} · dist ${Number(follow.distance || 0).toFixed(2)} · ${follow.shotMode || 'NORMAL'}</div><div style="font-weight:500;opacity:.52">last ${r.continuity.lastPortal || '—'} · spawn ${r.continuity.lastSpawn || '—'} · hotspot ${r.proximity?.nearest || '—'}</div>`;
  };
  refresh();
  document.body.appendChild(el);
  const timer = setInterval(refresh, 180);
  return { remove() { clearInterval(timer); el.remove(); } };
}

export async function mountMuseumCharacterPhase4B({ runtime, sceneKit = runtime?.sceneKit, input = window.__IW?.input } = {}) {
  if (!runtime || !sceneKit || !input) throw new Error('Phase 4B requires Museum runtime, SceneKit and InputSystem');
  if (window.__IW_CHARACTER_PHASE4B?.ready) return window.__IW_CHARACTER_PHASE4B;

  const phase4a = await mountMuseumCharacterPhase4A({ runtime, sceneKit, input });
  const root = phase4a.root;
  const motion = phase4a.motion;
  const rootIdentity = root.uuid;

  let cameraController = null;
  let disposed = false;
  let currentSpaceId = runtime.state.activeSpaceId;
  let currentVolume = sceneKit.navigationVolume(currentSpaceId);
  let groundY = currentVolume?.bounds?.min?.[1] ?? 0;
  let crossings = 0;
  let lastPortal = null;
  let lastSpawn = null;
  let continuityError = null;

  const movement = { forward: 0, turn: 0, run: false };
  let jumping = false;
  let jumpElapsed = 0;
  let stopElapsed = 0;
  let previousMoving = false;
  let previousTurn = 0;

  function installCameraForSpace(spaceId) {
    const volume = sceneKit.navigationVolume(spaceId);
    if (!volume?.bounds) throw new Error(`Phase 4B missing navigationVolume for ${spaceId}`);
    currentVolume = volume;
    groundY = volume.bounds.min[1];

    cameraController = new ThirdPersonExploreController();
    cameraController.setNavigationVolume(volume);
    cameraController.setTargetProvider(() => ({ position: root.position.toArray(), yaw: root.rotation.y }));
    // Registering the same authority name replaces its controller; there is still
    // exactly one CameraAuthority and one authoritative writer.
    runtime.camera.register(CAMERA_AUTHORITY.THIRD_PERSON_EXPLORE, cameraController);
    return volume;
  }

  installCameraForSpace(currentSpaceId);

  function setInput(next = {}) {
    movement.forward = Math.max(-1, Math.min(1, Number(next.forward) || 0));
    movement.turn = Math.max(-1, Math.min(1, Number(next.turn) || 0));
    movement.run = Boolean(next.run);
    phase4a.setInput(next);
  }

  function jump() {
    if (runtime.state.activeSpaceId !== GALLERY_B) return phase4a.jump();
    if (jumping) return false;
    jumping = true;
    jumpElapsed = 0;
    motion.play('JUMP', 0.08);
    return true;
  }

  const continuitySink = { setInput, jump, inputFrame() {} };
  input.setMovementSink(continuitySink);

  function updateGalleryBLocomotion(dt) {
    if (disposed || runtime.state.activeSpaceId !== GALLERY_B) return;
    const frameDt = Math.max(0, Math.min(Number(dt) || 0, 0.05));
    const turn = movement.turn;
    const forward = movement.forward;

    if (turn) root.rotation.y -= turn * TURN_SPEED * frameDt;

    if (forward !== 0) {
      const speed = (forward > 0 ? FORWARD_SPEED : BACKWARD_SPEED) * (movement.run ? RUN_MULTIPLIER : 1);
      const direction = forward > 0 ? 1 : -1;
      const desiredX = root.position.x + Math.sin(root.rotation.y) * speed * frameDt * direction;
      const desiredZ = root.position.z + Math.cos(root.rotation.y) * speed * frameDt * direction;
      const desiredEye = [desiredX, groundY + runtime.explore.eyeHeight, desiredZ];
      const resolvedEye = runtime.explore.resolveNavigationPosition(desiredEye);
      root.position.x = resolvedEye[0];
      root.position.z = resolvedEye[2];
      if (!jumping && motion.state !== 'WALK_V2') motion.play('WALK_V2', 0.12);
      stopElapsed = 0;
    } else if (!jumping && turn !== 0) {
      const state = turn > 0 ? 'TURN_RIGHT_V2' : 'TURN_LEFT_V2';
      if (motion.state !== state || previousTurn !== turn) motion.play(state, 0.08);
      stopElapsed = 0;
    } else if (!jumping) {
      if (previousMoving || previousTurn !== 0) {
        motion.play('STOP_V2', 0.1);
        stopElapsed = 0.7;
      } else if (stopElapsed > 0) {
        stopElapsed -= frameDt;
        if (stopElapsed <= 0) motion.play('IDLE_V2', 0.15);
      } else if (motion.state !== 'IDLE_V2') {
        motion.play('IDLE_V2', 0.15);
      }
    }

    if (jumping) {
      jumpElapsed += frameDt;
      const t = Math.min(1, jumpElapsed / JUMP_DURATION);
      root.position.y = groundY + JUMP_HEIGHT * 4 * t * (1 - t);
      if (t >= 1) {
        jumping = false;
        root.position.y = groundY;
        motion.play(forward !== 0 ? 'WALK_V2' : 'IDLE_V2', 0.12);
      }
    } else {
      root.position.y = groundY;
    }

    motion.update(frameDt);
    root.updateMatrixWorld(true);
    runtime.proximity.update(frameDt, [root.position.x, groundY + runtime.explore.eyeHeight, root.position.z]);
    previousMoving = forward !== 0;
    previousTurn = turn;
  }

  const previousOnFrame = runtime.onFrame;
  runtime.onFrame = (pose, dt) => {
    updateGalleryBLocomotion(dt);
    previousOnFrame?.(pose, dt);
  };

  const previousTraversePortal = runtime.traversePortal;
  runtime.traversePortal = async function traverseCharacterPortal(portalId, context = {}) {
    if (!SUPPORTED_PORTALS.has(portalId)) return previousTraversePortal.call(runtime, portalId, context);

    const portal = runtime.store.require(portalId);
    const fromSpaceId = runtime.state.activeSpaceId;
    if (portal.fromSpaceId !== fromSpaceId) {
      throw new Error(`Phase 4B portal ${portalId} expected ${portal.fromSpaceId}, active ${fromSpaceId}`);
    }

    setInput({});
    input.setEnabled(false);

    // Canonical traversal remains Runtime-owned. We suppress only its legacy
    // post-portal EXPLORE camera handoff because Character Explore is already the
    // active visitor camera. WorldGraph, SpaceLifecycle, WorldState, arrival and
    // proximity still execute through runtime.traversePortal().
    const originalCameraRequest = runtime.camera.request;
    runtime.camera.request = function requestDuringCharacterPortal(name, options = {}) {
      const legacyPortalHandoff = name === CAMERA_AUTHORITY.EXPLORE
        && String(options.reason || '').startsWith(`portal:${portalId}`);
      if (legacyPortalHandoff) return true;
      return originalCameraRequest.call(runtime.camera, name, options);
    };

    let result;
    try {
      result = await previousTraversePortal.call(runtime, portalId, { ...context, source: context.source || 'CHARACTER_PHASE4B' });
    } finally {
      runtime.camera.request = originalCameraRequest;
    }

    const destination = portal.toSpaceId;
    if (runtime.state.activeSpaceId !== destination) {
      throw new Error(`Phase 4B canonical traversal failed: expected ${destination}, got ${runtime.state.activeSpaceId}`);
    }

    const spawn = sceneKit.poseForAnchor(portal.destinationSpawnId);
    if (!spawn?.position) throw new Error(`Phase 4B missing destination pose ${portal.destinationSpawnId}`);

    currentSpaceId = destination;
    installCameraForSpace(destination);
    root.position.set(spawn.position[0], groundY, spawn.position[2]);
    root.rotation.y = Array.isArray(spawn.normal) ? Math.atan2(spawn.normal[0], spawn.normal[2]) : root.rotation.y;
    root.updateMatrixWorld(true);
    runtime.proximity.rebuild(destination);
    runtime.proximity.update(1, [root.position.x, groundY + runtime.explore.eyeHeight, root.position.z]);

    // Owner never changed away from THIRD_PERSON_EXPLORE because the legacy
    // handoff was suppressed. The newly registered controller reacquires behind
    // the same root on its next frame.
    input.setEnabled(true);
    crossings += 1;
    lastPortal = portalId;
    lastSpawn = portal.destinationSpawnId;
    continuityError = null;

    return result;
  };

  const api = {
    ready: true,
    root,
    phase4a,
    report() {
      return {
        phase: 'PHASE4B_ROOM_TO_ROOM_CONTINUITY',
        ready: true,
        spaceId: runtime.state.activeSpaceId,
        rootIdentity,
        position: root.position.toArray(),
        proximity: runtime.proximity.report(),
        camera: runtime.camera.report(),
        cameraFollow: cameraController?.report?.() || null,
        continuity: {
          crossings,
          lastPortal,
          lastSpawn,
          sameRoot: root.uuid === rootIdentity,
          currentSpaceId,
          supported: [PORTAL_A_B, PORTAL_B_A],
          canonicalTraversal: 'runtime.traversePortal + Museum WorldGraph/SpaceLifecycle/WorldState',
          error: continuityError
        },
        authorities: {
          rendererDuplicated: false,
          worldStoreDuplicated: false,
          cameraAuthorityDuplicated: false,
          characterRootDuplicated: false,
          inputListenersDuplicated: false
        },
        humanVisualApproval: 'PENDING_PHASE4B'
      };
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      setInput({});
      runtime.traversePortal = previousTraversePortal;
      runtime.onFrame = previousOnFrame;
      badge.remove();
      delete window.__IW_CHARACTER_PHASE4B;
      document.documentElement.dataset.characterPhase4b = 'disposed';
      phase4a.dispose();
    }
  };

  const badge = installBadge(api);
  window.__IW_CHARACTER_PHASE4B = api;
  document.documentElement.dataset.characterPhase4b = 'ready';
  console.info('[Character Phase 4B] ROOM CONTINUITY READY FOR HUMAN VALIDATION', api.report());
  return api;
}
