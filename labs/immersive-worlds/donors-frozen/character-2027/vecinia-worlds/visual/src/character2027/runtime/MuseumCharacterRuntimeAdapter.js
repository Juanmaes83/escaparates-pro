// Proven integration stone extracted from the accepted S3-B0R pattern.
// Purpose: add Character 2027 to an EXISTING Museum/Property Room runtime
// without rebuilding the world, renderer, camera authority or spatial memory.
//
// This module deliberately preserves the B0R contracts:
// - renderable Character root is THREE r185 (same ABI as Museum renderer)
// - approved SHA-pinned Character asset
// - Museum canonical human height (1.66 m through HumanSpatialContract)
// - CharacterActionAPI + MotionController + MotionFoundationV2 + LookAt
// - inherited Human Spatial routePlan / 1.05 m/s / 0.12 m settle discipline
// - B0R human-follow composition, but written through the EXISTING CameraAuthority
//
// It does NOT own a canvas, renderer, SceneKit, WorldState or CameraAuthority.

import * as THREE from 'three185';
import { GLTFLoader } from 'three185/addons/loaders/GLTFLoader.js';
import { CAMERA_AUTHORITY } from '../../../../property-room-v1/engine/schema/types.js';
import { CharacterActionAPI } from '../api/CharacterActionAPI.js';
import { MotionController } from '../animation/MotionController.js';
import { registerMotionFoundationV2 } from '../animation/MotionFoundationV2.js';
import { LookAtController } from '../interaction/LookAtController.js';
import { inspectHumanoid, unifyCompatibleSkeletons } from '../rig/BoneMap.js';
import { APPROVED_AVATAR } from '../probe/s3a0-compatibility-probe.js';
import { HumanSpatialContract, MUSEUM_HUMAN_PROFILE } from '../spatial/HumanSpatialContract.js';

const EXPECTED_MUSEUM_THREE_REVISION = '185';
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitUntil(test, timeoutMs = 10000, stepMs = 25) {
  const started = performance.now();
  while (performance.now() - started < timeoutMs) {
    const value = test();
    if (value) return value;
    await wait(stepMs);
  }
  return null;
}

async function sha256Hex(bytes) {
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function parseGLB(bytes, url) {
  return new Promise((resolve, reject) => {
    new GLTFLoader().parse(bytes, new URL('.', new URL(url, window.location.href)).href, resolve, reject);
  });
}

function normalizeAvatarToHeight(root, targetHeight) {
  root.traverse((node) => {
    if (node.isMesh) {
      node.castShadow = true;
      node.receiveShadow = true;
    }
  });
  const sourceBox = new THREE.Box3().setFromObject(root);
  const sourceSize = sourceBox.getSize(new THREE.Vector3());
  root.scale.multiplyScalar(targetHeight / Math.max(sourceSize.y, 0.0001));
  root.updateMatrixWorld(true);
  const scaledBox = new THREE.Box3().setFromObject(root);
  const center = scaledBox.getCenter(new THREE.Vector3());
  root.position.x -= center.x;
  root.position.z -= center.z;
  root.position.y -= scaledBox.min.y;
  root.updateMatrixWorld(true);
  const finalBox = new THREE.Box3().setFromObject(root);
  return {
    sourceHeight: sourceSize.y,
    targetHeight,
    finalHeight: finalBox.getSize(new THREE.Vector3()).y,
    localVisualOffset: root.position.toArray(),
  };
}

async function loadApprovedAvatar(targetHeight) {
  const response = await fetch(APPROVED_AVATAR.url, { method: 'GET', mode: 'cors', cache: 'no-store' });
  if (!response.ok) throw new Error(`R2 avatar fetch failed: HTTP ${response.status}`);
  const bytes = await response.arrayBuffer();
  const sha256 = await sha256Hex(bytes);
  const exact = bytes.byteLength === APPROVED_AVATAR.expectedByteLength && sha256 === APPROVED_AVATAR.expectedSha256;
  if (!exact) throw new Error(`Approved avatar provenance mismatch: bytes=${bytes.byteLength}, sha=${sha256}`);

  const gltf = await parseGLB(bytes, APPROVED_AVATAR.url);
  const visual = gltf.scene;
  const normalization = normalizeAvatarToHeight(visual, targetHeight);
  const root = new THREE.Group();
  root.name = 'CHARACTER_2027_MUSEUM_RUNTIME_ROOT';
  root.add(visual);
  root.updateMatrixWorld(true);

  const skeletonNormalization = unifyCompatibleSkeletons(root);
  const rig = inspectHumanoid(root);
  if (!rig.pass) throw new Error(`Approved avatar rig failed: ${rig.missing.join(', ')}`);

  return {
    root,
    visual,
    normalization,
    skeletonNormalization,
    rig,
    provenance: {
      byteLength: bytes.byteLength,
      sha256,
      exactApprovedAssetMatch: exact,
    },
  };
}

function assertMuseumRuntime(runtime, renderHost) {
  if (!runtime) throw new Error('MuseumCharacterRuntimeAdapter requires Runtime');
  const sceneKit = runtime.sceneKit;
  if (!sceneKit?.scene) throw new Error('Museum runtime has no sceneKit.scene');
  if (!renderHost?.camera || !renderHost?.renderer) throw new Error('Museum runtime has no RenderHost camera/renderer');
  if (!runtime.store || !runtime.camera || !runtime.directed) throw new Error('Museum runtime missing store/camera/directed authority');
  if (String(THREE.REVISION) !== EXPECTED_MUSEUM_THREE_REVISION || typeof new THREE.Matrix4().determinantAffine !== 'function') {
    throw new Error(`Museum Character render ABI requires THREE r185, got r${THREE.REVISION}`);
  }
  return sceneKit;
}

function auditRenderableMatrixAuthority(scene) {
  const offenders = [];
  scene.updateMatrixWorld(true);
  scene.traverse((node) => {
    if (!node?.matrixWorld) return;
    if (typeof node.matrixWorld.determinantAffine !== 'function') {
      offenders.push({ name: node.name || '(unnamed)', type: node.type || node.constructor?.name || 'unknown' });
    }
  });
  return {
    expectedRevision: EXPECTED_MUSEUM_THREE_REVISION,
    actualRevision: String(THREE.REVISION),
    offenderCount: offenders.length,
    offenders: offenders.slice(0, 20),
    pass: String(THREE.REVISION) === EXPECTED_MUSEUM_THREE_REVISION && offenders.length === 0,
  };
}

function setYaw(root, yaw) {
  root.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
}

export async function createMuseumCharacterRuntimeAdapter({
  runtime,
  renderHost,
  spaceId = 'space.gallery-a',
  characterRadius = 0.34,
  rootName = 'CHARACTER_2027_MUSEUM_RUNTIME_ROOT',
  suppressLegacyGuide = false,
} = {}) {
  const sceneKit = assertMuseumRuntime(runtime, renderHost);
  const contract = new HumanSpatialContract({ sceneKit, store: runtime.store, spaceId, characterRadius });
  const canonicalHeight = contract.canonicalHeight();
  const loaded = await loadApprovedAvatar(canonicalHeight);
  const root = loaded.root;
  root.name = rootName;
  sceneKit.scene.add(root);
  root.updateMatrixWorld(true);

  const matrixAuthority = auditRenderableMatrixAuthority(sceneKit.scene);
  if (!matrixAuthority.pass) {
    sceneKit.scene.remove(root);
    throw new Error(`Mixed Three renderables rejected: ${JSON.stringify(matrixAuthority)}`);
  }

  const controller = new MotionController(root);
  registerMotionFoundationV2(controller, root);
  const lookAt = new LookAtController(root);
  const states = [];
  const statuses = [];
  const character = new CharacterActionAPI({
    root,
    controller,
    lookAt,
    onStateChange: (state) => states.push(state),
    onStatus: (status) => statuses.push(status),
  });
  controller.transitionTo('IDLE_V2', 0);

  let active = false;
  let followState = null;
  let updateError = null;
  let legacyGuideObject = null;
  let legacyGuidePreviousVisible = null;
  const previousOnFrame = runtime.onFrame;

  function enforceSingleBody() {
    if (!suppressLegacyGuide) return;
    const object = sceneKit?._guide?.object || null;
    if (!object) return;
    if (!legacyGuideObject) {
      legacyGuideObject = object;
      legacyGuidePreviousVisible = object.visible;
    }
    object.visible = false;
  }

  function restoreLegacyGuide() {
    if (legacyGuideObject && legacyGuidePreviousVisible !== null) {
      legacyGuideObject.visible = legacyGuidePreviousVisible;
    }
  }

  function placeAt(target) {
    if (!target?.position) throw new Error('placeAt requires Human Spatial target');
    root.position.set(...target.position);
    setYaw(root, target.yaw ?? 0);
    root.updateMatrixWorld(true);
  }

  function museumLeadPose(target) {
    if (!target?.subjectRef || !target?.anchorId) return null;
    return sceneKit.framingForEntity(target.subjectRef, {
      aspect: renderHost.camera.aspect,
      vfov: renderHost.camera.fov,
      intent: 'LEAD',
      guideAnchorId: target.anchorId,
      insetRight: 0,
      insetBottom: 0,
    });
  }

  function beginHumanFollow(destination) {
    const cameraPosition = renderHost.camera.position.clone();
    const humanPosition = root.position.clone();
    let offset = cameraPosition.sub(humanPosition);
    if (offset.length() < 2.2 || offset.length() > 8.5) offset = new THREE.Vector3(-3.1, 2.05, 4.1);
    followState = {
      destination,
      offset,
      targetHeight: Math.min(canonicalHeight * .62, 1.12),
      fov: renderHost.camera.fov,
    };
    active = true;
  }

  function updateHumanFollow() {
    if (!active || !followState) return;
    const human = root.position.clone();
    const lookAtPoint = followState.destination?.lookAt || [human.x, human.y + followState.targetHeight, human.z + 1];
    const subject = new THREE.Vector3(...lookAtPoint);
    const head = human.clone().add(new THREE.Vector3(0, followState.targetHeight, 0));
    const blendedTarget = head.lerp(subject, .24);
    const cameraPosition = human.clone().add(followState.offset);
    runtime.directed.snapTo({
      position: cameraPosition.toArray(),
      target: blendedTarget.toArray(),
      fov: followState.fov,
    });
  }

  runtime.onFrame = (pose, dt) => {
    try {
      enforceSingleBody();
      controller.update(dt);
      lookAt.update(dt);
      updateHumanFollow();
    } catch (error) {
      updateError = String(error?.stack || error);
      console.error('[MuseumCharacterRuntimeAdapter]', error);
    }
    previousOnFrame?.(pose, dt);
  };

  enforceSingleBody();

  function requestDirected(reason = 'Character 2027 Museum runtime') {
    runtime.camera.request(CAMERA_AUTHORITY.DIRECTED, { reason, durationMs: 0 });
  }

  function settleMuseumLead(target) {
    const pose = museumLeadPose(target);
    if (pose) runtime.directed.snapTo(pose);
    followState = null;
    return pose;
  }

  async function moveToTarget(target, { label = 'Museum human target', settleLead = true } = {}) {
    updateError = null;
    const plan = contract.routePlan(root.position.toArray(), target, { subjectRef: target?.subjectRef });
    if (!plan.points.length) return { arrived: false, plan, targetDistance: Infinity, reason: plan.source };

    beginHumanFollow(target);
    for (const point of plan.points) {
      character.moveTo(point, {
        label,
        walkSpeed: MUSEUM_HUMAN_PROFILE.guideWalkSpeed,
        stopDistance: 0.08,
      });
      const stopped = await waitUntil(() => controller.navigation.mode === 'IDLE' || updateError, 10000);
      if (!stopped || updateError) {
        return { arrived: false, plan, targetDistance: Infinity, updateError };
      }
    }

    const destination = new THREE.Vector3(...target.position);
    const targetDistance = root.position.distanceTo(destination);
    if (settleLead && target?.anchorId && target?.subjectRef) settleMuseumLead(target);
    return {
      arrived: targetDistance <= MUSEUM_HUMAN_PROFILE.settleTolerance,
      plan,
      targetDistance,
      updateError,
    };
  }

  function restoreExplore() {
    active = false;
    followState = null;
    runtime.camera.request(CAMERA_AUTHORITY.EXPLORE, {
      reason: 'Character 2027 controlled sequence complete',
      durationMs: 300,
      restore: 'ADOPT_INCOMING',
    });
  }

  return {
    runtime,
    renderHost,
    sceneKit,
    contract,
    canonicalHeight,
    root,
    controller,
    lookAt,
    character,
    states,
    statuses,
    loaded,
    placeAt,
    requestDirected,
    beginHumanFollow,
    settleMuseumLead,
    moveToTarget,
    restoreExplore,
    enforceSingleBody,
    get updateError() { return updateError; },
    audit: () => ({
      matrixAuthority: auditRenderableMatrixAuthority(sceneKit.scene),
      camera: runtime.camera.report(),
      provenance: loaded.provenance,
      rig: loaded.rig,
      normalization: loaded.normalization,
      canonicalHeight,
      singleBody: !suppressLegacyGuide || !sceneKit?._guide?.object || sceneKit._guide.object.visible === false,
    }),
    dispose() {
      active = false;
      followState = null;
      runtime.onFrame = previousOnFrame;
      restoreLegacyGuide();
      character.dispose();
      controller.dispose();
      sceneKit.scene.remove(root);
    },
  };
}
