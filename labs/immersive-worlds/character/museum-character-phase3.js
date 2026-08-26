import { THREE } from '../render/render-host.js';

const PHASE3_SPACE_ID = 'space.gallery-a';
const PHASE3_ANCHOR_CANDIDATES = [
  'anchor.gallery-a.guide-horizonte',
  'anchor.gallery-a.guide-division',
  'anchor.gallery-a.arrive-from-lobby'
];
const TARGET_HEIGHT_M = 1.66;
const EXPECTED_THREE_REVISION = '185';
const GLTF_LOADER_URL = 'https://cdn.jsdelivr.net/npm/three@0.185.1/examples/jsm/loaders/GLTFLoader.js';

export const PHASE3_APPROVED_AVATAR = Object.freeze({
  assetId: 'character-primary-v1',
  source: 'VECINIA S3-A1R approved Character 2027 asset',
  sourceCommit: '45e454febe2deb3b88bf5e5b527c4a5f86fe8eb1',
  characterStudioCommit: 'f5a93a48ed0e3904fce58f08f7fbe08b5411b289',
  url: 'https://pub-0f344e596c324724a0b7300e3bc1d129.r2.dev/Avatar%201/Avatar_1.glb',
  expectedByteLength: 30306028,
  expectedSha256: '103f0fdbc556566b12412d09f758e13fa171fcec90cb285b8f824adac2c7b0e3'
});

const REQUIRED_HUMANOID_BONES = Object.freeze([
  'hips', 'spine', 'chest', 'neck', 'head',
  'leftUpperArm', 'leftLowerArm', 'leftHand',
  'rightUpperArm', 'rightLowerArm', 'rightHand',
  'leftUpperLeg', 'leftLowerLeg', 'leftFoot',
  'rightUpperLeg', 'rightLowerLeg', 'rightFoot'
]);

// Exact IDLE_V2 pose family recovered from the frozen CharacterStudio donor.
// Phase 3 intentionally keeps every other action dormant.
const IDLE_NEUTRAL = Object.freeze({
  leftUpperArm: [0, 0, 1.18],
  rightUpperArm: [0, 0, -1.18],
  leftLowerArm: [0.08, 0, -0.18],
  rightLowerArm: [0.08, 0, 0.18],
  chest: [0.01, 0, 0],
  head: [0, 0, 0],
  hips: [0, 0, 0]
});

const IDLE_FRAMES = Object.freeze([
  { t: 0, bones: { ...IDLE_NEUTRAL, chest: [0.01, 0, 0], head: [0, 0, 0], hips: [0, 0, 0] } },
  { t: 0.5, bones: { ...IDLE_NEUTRAL, chest: [0.025, -0.018, 0], head: [-0.015, 0.025, 0], hips: [0, 0.015, 0] } },
  { t: 1, bones: { ...IDLE_NEUTRAL, chest: [0.01, 0, 0], head: [0, 0, 0], hips: [0, 0, 0] } }
]);
const IDLE_DURATION_S = 2.8;

async function sha256Hex(bytes) {
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function disposeObject(root) {
  root?.traverse?.((node) => {
    if (node.geometry?.dispose) node.geometry.dispose();
    if (Array.isArray(node.material)) {
      for (const material of node.material) material?.dispose?.();
    } else {
      node.material?.dispose?.();
    }
  });
}

function inspectHumanoid(root) {
  const boneNames = new Set();
  const bonesByName = new Map();
  let skinnedMeshCount = 0;

  root.traverse((node) => {
    if (node.isBone) {
      boneNames.add(node.name);
      if (!bonesByName.has(node.name)) bonesByName.set(node.name, node);
    }
    if (node.isSkinnedMesh) {
      skinnedMeshCount += 1;
      node.skeleton?.bones?.forEach((bone) => {
        boneNames.add(bone.name);
        if (!bonesByName.has(bone.name)) bonesByName.set(bone.name, bone);
      });
    }
  });

  const missing = REQUIRED_HUMANOID_BONES.filter((name) => !boneNames.has(name));
  return {
    pass: skinnedMeshCount > 0 && missing.length === 0,
    boneCount: boneNames.size,
    skinnedMeshCount,
    missing,
    bonesByName
  };
}

function normalizeAvatarToHeight(visual, targetHeight) {
  visual.traverse((node) => {
    if (node.isMesh) {
      node.castShadow = true;
      node.receiveShadow = true;
    }
  });

  visual.updateMatrixWorld(true);
  const sourceBox = new THREE.Box3().setFromObject(visual);
  const sourceSize = sourceBox.getSize(new THREE.Vector3());
  const scaleFactor = targetHeight / Math.max(sourceSize.y, 0.0001);
  visual.scale.multiplyScalar(scaleFactor);
  visual.updateMatrixWorld(true);

  const scaledBox = new THREE.Box3().setFromObject(visual);
  const centre = scaledBox.getCenter(new THREE.Vector3());
  visual.position.x -= centre.x;
  visual.position.z -= centre.z;
  visual.position.y -= scaledBox.min.y;
  visual.updateMatrixWorld(true);

  const finalBox = new THREE.Box3().setFromObject(visual);
  return {
    sourceHeight: sourceSize.y,
    scaleFactor,
    targetHeight,
    finalHeight: finalBox.getSize(new THREE.Vector3()).y,
    groundedVisualMinY: finalBox.min.y,
    localVisualOffset: visual.position.toArray()
  };
}

function resolveAnchor(runtime) {
  for (const id of PHASE3_ANCHOR_CANDIDATES) {
    if (!runtime.store?.has?.(id)) continue;
    const anchor = runtime.store.require(id);
    if (anchor.spaceId === PHASE3_SPACE_ID && Array.isArray(anchor.position)) return anchor;
  }
  throw new Error('Phase 3 could not resolve a safe Gallery A anchor');
}

function yawFromNormal(normal) {
  if (!Array.isArray(normal) || Math.hypot(normal[0] || 0, normal[2] || 0) < 0.001) return 0;
  return Math.atan2(normal[0], normal[2]);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function sampleIdleFrame(cycle) {
  const first = cycle <= 0.5 ? IDLE_FRAMES[0] : IDLE_FRAMES[1];
  const second = cycle <= 0.5 ? IDLE_FRAMES[1] : IDLE_FRAMES[2];
  const span = Math.max(0.0001, second.t - first.t);
  const alpha = (cycle - first.t) / span;
  const result = {};
  const names = new Set([...Object.keys(first.bones), ...Object.keys(second.bones)]);
  for (const name of names) {
    const a = first.bones[name] || [0, 0, 0];
    const b = second.bones[name] || a;
    result[name] = [lerp(a[0], b[0], alpha), lerp(a[1], b[1], alpha), lerp(a[2], b[2], alpha)];
  }
  return result;
}

function createIdleDriver(rig) {
  const base = new Map();
  const euler = new THREE.Euler(0, 0, 0, 'XYZ');
  const offset = new THREE.Quaternion();
  let elapsed = 0;

  for (const name of Object.keys(IDLE_NEUTRAL)) {
    const bone = rig.bonesByName.get(name);
    if (bone) base.set(name, bone.quaternion.clone());
  }

  function update(dt) {
    elapsed = (elapsed + Math.max(0, Math.min(dt || 0, 0.05))) % IDLE_DURATION_S;
    const pose = sampleIdleFrame(elapsed / IDLE_DURATION_S);
    for (const [name, xyz] of Object.entries(pose)) {
      const bone = rig.bonesByName.get(name);
      const rest = base.get(name);
      if (!bone || !rest) continue;
      euler.set(xyz[0], xyz[1], xyz[2], 'XYZ');
      offset.setFromEuler(euler);
      bone.quaternion.copy(rest).multiply(offset);
    }
  }

  function dispose() {
    for (const [name, rest] of base) rig.bonesByName.get(name)?.quaternion.copy(rest);
  }

  return { state: 'IDLE_V2', duration: IDLE_DURATION_S, update, dispose };
}

async function loadApprovedAvatar() {
  if (String(THREE.REVISION) !== EXPECTED_THREE_REVISION) {
    throw new Error(`Character 2027 requires Museum THREE r${EXPECTED_THREE_REVISION}, got r${THREE.REVISION}`);
  }

  const [{ GLTFLoader }, response] = await Promise.all([
    import(GLTF_LOADER_URL),
    fetch(PHASE3_APPROVED_AVATAR.url, { method: 'GET', mode: 'cors', cache: 'no-store' })
  ]);
  if (!response.ok) throw new Error(`Approved Character fetch failed: HTTP ${response.status}`);

  const bytes = await response.arrayBuffer();
  const sha256 = await sha256Hex(bytes);
  const exact = bytes.byteLength === PHASE3_APPROVED_AVATAR.expectedByteLength
    && sha256 === PHASE3_APPROVED_AVATAR.expectedSha256;
  if (!exact) {
    throw new Error(`Approved Character provenance mismatch: bytes=${bytes.byteLength} sha=${sha256}`);
  }

  const gltf = await new Promise((resolve, reject) => {
    const resourcePath = new URL('.', PHASE3_APPROVED_AVATAR.url).href;
    new GLTFLoader().parse(bytes, resourcePath, resolve, reject);
  });

  const visual = gltf.scene;
  if (!visual?.isObject3D) throw new Error('GLTFLoader did not return a Museum-compatible Object3D');
  const normalization = normalizeAvatarToHeight(visual, TARGET_HEIGHT_M);
  const rig = inspectHumanoid(visual);
  if (!rig.pass) throw new Error(`Character humanoid rig failed: ${rig.missing.join(', ')}`);

  const root = new THREE.Group();
  root.name = 'CHARACTER_2027_PHASE3_ROOT';
  root.add(visual);
  root.updateMatrixWorld(true);

  // ABI guard: everything attached to the Museum scene must expose the same
  // Matrix4 extension used by the pinned r185 renderer.
  const abiOffenders = [];
  root.traverse((node) => {
    if (node.matrixWorld && typeof node.matrixWorld.determinantAffine !== 'function') {
      abiOffenders.push(node.name || node.type || '(unnamed)');
    }
  });
  if (abiOffenders.length) throw new Error(`Mixed Three ABI rejected: ${abiOffenders.slice(0, 8).join(', ')}`);

  return {
    root,
    visual,
    rig,
    normalization,
    provenance: {
      byteLength: bytes.byteLength,
      sha256,
      exactApprovedAssetMatch: exact,
      sourceUrl: PHASE3_APPROVED_AVATAR.url
    }
  };
}

function installGateBadge(report) {
  document.getElementById('character-phase3-gate')?.remove();
  const el = document.createElement('div');
  el.id = 'character-phase3-gate';
  el.style.cssText = 'position:fixed;left:14px;top:14px;z-index:20000;padding:10px 12px;background:rgba(9,12,14,.82);border:1px solid rgba(255,255,255,.22);backdrop-filter:blur(10px);color:#f1eee8;font:600 11px/1.45 system-ui,sans-serif;pointer-events:none;max-width:310px';
  el.innerHTML = `<div style="letter-spacing:.12em">PHASE 3 · CHARACTER 2027</div><div style="font-weight:500;opacity:.82">IDLE_V2 · ${report.normalization.finalHeight.toFixed(3)} m · rig ${report.rig.boneCount} bones · SHA OK</div>`;
  document.body.appendChild(el);
  return el;
}

/**
 * Phase 3 gate only: presence / rig / scale / grounding / IDLE_V2 in Gallery A.
 * No locomotion, no Character input, no camera authority change and no portal work.
 */
export async function mountMuseumCharacterPhase3({ runtime, sceneKit = runtime?.sceneKit } = {}) {
  if (!runtime || !sceneKit?.scene) throw new Error('Phase 3 requires the existing Museum runtime and SceneKit');
  if (window.__IW_CHARACTER_PHASE3?.ready) return window.__IW_CHARACTER_PHASE3;

  const loaded = await loadApprovedAvatar();
  const anchor = resolveAnchor(runtime);
  const root = loaded.root;
  root.position.set(anchor.position[0], anchor.position[1], anchor.position[2]);
  root.rotation.y = yawFromNormal(anchor.normal);
  root.visible = runtime.state.activeSpaceId === PHASE3_SPACE_ID;
  root.updateMatrixWorld(true);
  sceneKit.scene.add(root);

  const idle = createIdleDriver(loaded.rig);
  const previousOnFrame = runtime.onFrame;
  let updateError = null;
  let disposed = false;

  runtime.onFrame = (pose, dt) => {
    if (!disposed) {
      try {
        root.visible = runtime.state.activeSpaceId === PHASE3_SPACE_ID;
        if (root.visible) idle.update(dt);
      } catch (error) {
        updateError = String(error?.stack || error);
        console.error('[Character Phase 3]', error);
      }
    }
    previousOnFrame?.(pose, dt);
  };

  const report = {
    phase: 'PHASE3_PRESENCE_IDLE_HUMAN_GATE',
    ready: true,
    spaceId: PHASE3_SPACE_ID,
    anchorId: anchor.id,
    state: 'IDLE_V2',
    threeRevision: String(THREE.REVISION),
    expectedThreeRevision: EXPECTED_THREE_REVISION,
    loader: { source: GLTF_LOADER_URL, pinnedVersion: '0.185.1' },
    provenance: loaded.provenance,
    rig: {
      pass: loaded.rig.pass,
      boneCount: loaded.rig.boneCount,
      skinnedMeshCount: loaded.rig.skinnedMeshCount,
      missing: loaded.rig.missing
    },
    normalization: loaded.normalization,
    grounding: {
      anchorY: anchor.position[1],
      visualMinYAfterNormalization: loaded.normalization.groundedVisualMinY,
      pass: Math.abs(loaded.normalization.groundedVisualMinY) < 0.01
    },
    authorities: {
      worldStoreDuplicated: false,
      sceneKitDuplicated: false,
      cameraAuthorityTouched: false,
      rendererCreated: false,
      characterInputInstalled: false
    },
    humanVisualApproval: 'PENDING'
  };

  const badge = installGateBadge(report);
  const api = {
    ready: true,
    root,
    report: () => ({ ...report, visible: root.visible, updateError }),
    dispose() {
      if (disposed) return;
      disposed = true;
      runtime.onFrame = previousOnFrame;
      idle.dispose();
      sceneKit.scene.remove(root);
      disposeObject(root);
      badge.remove();
      delete window.__IW_CHARACTER_PHASE3;
      document.documentElement.dataset.characterPhase3 = 'disposed';
    }
  };

  window.__IW_CHARACTER_PHASE3 = api;
  document.documentElement.dataset.characterPhase3 = 'ready';
  console.info('[Character Phase 3] READY', api.report());
  return api;
}
