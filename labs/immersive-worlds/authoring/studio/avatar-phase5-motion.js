import { createCharacterMotionV2, MOTION_V2_PROVENANCE } from '../../character/character-motion-v2.js';

const MOTION_ACTIONS = Object.freeze([
  ['IDLE_V2', 'IDLE'],
  ['WALK_V2', 'WALK'],
  ['STOP_V2', 'STOP'],
  ['TURN_LEFT_V2', 'TURN L'],
  ['TURN_RIGHT_V2', 'TURN R'],
  ['JUMP', 'JUMP']
]);

const NON_LOOPING = new Set(['STOP_V2', 'TURN_LEFT_V2', 'TURN_RIGHT_V2', 'JUMP']);
const SAMPLE_BONES = Object.freeze(['hips','chest','head','leftUpperArm','rightUpperArm','leftUpperLeg','rightUpperLeg','leftLowerLeg','rightLowerLeg']);
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));

// Exact Museum-side extraction of the preparation step used by the proven
// CharacterStudio MotionLab before it created its MotionController. Frozen donor:
// donors-frozen/.../rig/BoneMap.js @ 0c74181a...
function sameSkeletonLayout(a, b) {
  if (!a || !b || a.bones.length !== b.bones.length) return false;
  for (let i = 0; i < a.bones.length; i += 1) {
    if (a.bones[i].name !== b.bones[i].name) return false;
  }
  return true;
}

function unifyCompatibleSkeletons(root) {
  const meshes = [];
  root?.traverse?.((node) => {
    if (node.isSkinnedMesh && node.skeleton) meshes.push(node);
  });
  if (meshes.length < 2) {
    return { skinnedMeshes: meshes.length, unifiedMeshes: 0, canonicalBoneCount: meshes[0]?.skeleton?.bones?.length || 0 };
  }
  const canonical = meshes[0].skeleton;
  let unifiedMeshes = 0;
  for (let i = 1; i < meshes.length; i += 1) {
    const mesh = meshes[i];
    if (!sameSkeletonLayout(canonical, mesh.skeleton)) continue;
    mesh.skeleton = canonical;
    unifiedMeshes += 1;
  }
  canonical.pose();
  canonical.update();
  root.updateMatrixWorld?.(true);
  return { skinnedMeshes: meshes.length, unifiedMeshes, canonicalBoneCount: canonical.bones.length };
}

function findBone(root, name) {
  const direct = root?.getObjectByName?.(name);
  if (direct?.isBone) return direct;
  let found = null;
  root?.traverse?.((node) => { if (!found && node.isBone && node.name === name) found = node; });
  return found;
}

function snapshotPose(root) {
  const pose = new Map();
  for (const name of SAMPLE_BONES) {
    const bone = findBone(root, name);
    if (bone) pose.set(name, bone.quaternion.clone());
  }
  return pose;
}

function comparePose(before, root) {
  const changed = [];
  for (const [name, initial] of before.entries()) {
    const bone = findBone(root, name);
    if (!bone) continue;
    const angle = initial.angleTo(bone.quaternion);
    if (angle > 0.002) changed.push({ name, angle });
  }
  return changed;
}

function provePoseMotion(state, root) {
  const before = snapshotPose(root);
  state.motion.play('WALK_V2', 0);
  state.motion.update(0.22);
  root.updateMatrixWorld?.(true);
  const changed = comparePose(before, root);
  state.motion.play('IDLE_V2', 0);
  state.motion.update(0.001);
  root.updateMatrixWorld?.(true);
  return {
    sampledBones: before.size,
    changedBones: changed.length,
    changed: changed.map(({ name, angle }) => ({ name, radians: Number(angle.toFixed(5)) })),
    pass: before.size >= 4 && changed.length >= 2
  };
}

function motionHTML(controller) {
  const m = controller.__avatarMotionV2;
  const ready = Boolean(m?.motion && controller.previewRoot);
  const state = m?.motion?.state || 'NOT READY';
  const compat = m?.compatibility || (controller.profile?.rigStatus?.pass ? 'READY TO ACTIVATE' : 'RIG REQUIRED');
  const buttons = MOTION_ACTIONS.map(([action, label]) =>
    `<button class="st-b ${state === action ? 'is-active' : ''}" data-avatar-motion="${action}" ${ready ? '' : 'disabled'}>${label}</button>`
  ).join('');
  const sk = m?.skeleton || {};
  const proof = m?.poseProof || {};
  return `<section class="st-group st-avatar-motion-panel">
    <h3>Motion · Foundation V2</h3>
    <p class="st-note">Prueba el movimiento sobre este mismo avatar y este mismo preview. WALK no desplaza el avatar por la sala: aquí validamos biomecánica, no navegación.</p>
    <div class="st-avatar-motion-summary">
      <div><span>Foundation</span><strong>V2</strong></div>
      <div><span>Estado</span><strong>${esc(state)}</strong></div>
      <div><span>Compatibilidad</span><strong>${esc(compat)}</strong></div>
    </div>
    <div class="st-avatar-motion-diagnostics">
      <span>Skinned mesh <b>${Number(sk.skinnedMeshes || 0)}</b></span>
      <span>Skeletons unificados <b>${Number(sk.unifiedMeshes || 0)}</b></span>
      <span>Canonical bones <b>${Number(sk.canonicalBoneCount || 0)}</b></span>
      <span>Pose delta <b>${proof.pass ? `PASS · ${proof.changedBones}/${proof.sampledBones}` : proof.sampledBones ? `REVIEW · ${proof.changedBones}/${proof.sampledBones}` : '—'}</b></span>
    </div>
    <div class="st-avatar-motion-actions">${buttons}</div>
    ${m?.error ? `<p class="st-msg is-bad">${esc(m.error)}</p>` : ''}
    <p class="st-note">Fuente: CharacterStudio MotionFoundationV2 · ${esc(MOTION_V2_PROVENANCE.sourceCommit.slice(0, 8))}… · preparación de skeleton recuperada del MotionLab probado · sin renderer, Scene, CameraAuthority ni frame loop adicionales.</p>
  </section>`;
}

function applyPreviewRootMotion(controller, state, frameDt) {
  const root = controller.previewRoot;
  const visualState = state.visualAction;
  if (!root || !visualState) return;
  visualState.elapsed += frameDt;
  const duration = Math.max(0.001, visualState.duration || 1);
  const t = Math.min(1, visualState.elapsed / duration);
  const pulse = Math.sin(Math.PI * t);
  if (visualState.action === 'JUMP') {
    root.position.y = visualState.baseY + 0.34 * pulse;
  } else if (visualState.action === 'TURN_LEFT_V2') {
    root.rotation.y = visualState.baseYaw + (Math.PI / 2) * pulse;
  } else if (visualState.action === 'TURN_RIGHT_V2') {
    root.rotation.y = visualState.baseYaw - (Math.PI / 2) * pulse;
  }
  root.updateMatrixWorld?.(true);
  if (t >= 1) {
    root.position.y = visualState.baseY;
    root.rotation.y = visualState.baseYaw;
    root.updateMatrixWorld?.(true);
    state.visualAction = null;
  }
}

function installFrameBridge(controller) {
  const runtime = window.__IW?.runtime;
  if (!runtime || runtime.__avatarStudioMotionV2FrameBridge) return;
  runtime.__avatarStudioMotionV2FrameBridge = true;
  const previous = runtime.onFrame;
  runtime.onFrame = (pose, dt) => {
    const current = window.__IW_AVATAR_STUDIO_PHASE5?.controller;
    const state = current?.__avatarMotionV2;
    if (state?.motion && current?.previewRoot) {
      const frameDt = Math.max(0, Math.min(Number(dt) || 0, 0.05));
      state.motion.update(frameDt);
      applyPreviewRootMotion(current, state, frameDt);
      if (state.remaining > 0) {
        state.remaining -= frameDt;
        if (state.remaining <= 0 && state.motion.state !== 'IDLE_V2') {
          state.motion.play('IDLE_V2', 0.12);
          state.remaining = 0;
          state.visualAction = null;
          current.applyGrounding?.();
          current.studio?.render?.();
        }
      }
    }
    previous?.(pose, dt);
  };
}

function disposeMotion(controller) {
  const state = controller.__avatarMotionV2;
  state?.motion?.dispose?.();
  if (state) {
    state.motion = null;
    state.remaining = 0;
    state.visualAction = null;
    state.compatibility = 'PENDING';
    state.skeleton = null;
    state.poseProof = null;
  }
}

function bindMotionToPreview(controller) {
  disposeMotion(controller);
  if (!controller.previewRoot) return false;
  const state = controller.__avatarMotionV2;
  try {
    state.skeleton = unifyCompatibleSkeletons(controller.previewRoot);
    state.motion = createCharacterMotionV2(controller.previewRoot);
    state.error = null;
    state.remaining = 0;
    state.poseProof = provePoseMotion(state, controller.previewRoot);
    state.compatibility = state.poseProof.pass ? 'PASS' : 'REVIEW';
    if (!state.poseProof.pass) {
      state.error = `Motion V2 no produjo pose visible suficiente: ${state.poseProof.changedBones}/${state.poseProof.sampledBones} bones de muestra cambiaron.`;
    }
    if (controller.profile?.motionSet) controller.profile.motionSet.foundation = 'V2';
    installFrameBridge(controller);
    return state.poseProof.pass;
  } catch (error) {
    state.motion?.dispose?.();
    state.motion = null;
    state.compatibility = 'REVIEW';
    state.error = String(error?.message || error);
    return false;
  }
}

function beginVisualAction(controller, action, duration) {
  if (!controller.previewRoot || !['JUMP','TURN_LEFT_V2','TURN_RIGHT_V2'].includes(action)) return;
  controller.__avatarMotionV2.visualAction = {
    action,
    duration,
    elapsed: 0,
    baseY: controller.previewRoot.position.y,
    baseYaw: controller.previewRoot.rotation.y
  };
}

function installControllerMotion(controller) {
  if (!controller || controller.__avatarMotionV2Installed) return;
  controller.__avatarMotionV2Installed = true;
  controller.__avatarMotionV2 = {
    motion: null,
    remaining: 0,
    visualAction: null,
    compatibility: 'PENDING',
    skeleton: null,
    poseProof: null,
    error: null
  };

  const editor = controller.editor.bind(controller);
  controller.editor = function editorWithMotion() {
    const html = editor();
    const panel = motionHTML(this);
    const marker = '<section class="st-avatar-future">';
    const at = html.indexOf(marker);
    return at >= 0 ? `${html.slice(0, at)}${panel}${html.slice(at)}` : `${html}${panel}`;
  };

  const filmstrip = controller.filmstrip.bind(controller);
  controller.filmstrip = function filmstripWithMotion() {
    let html = filmstrip();
    const state = this.__avatarMotionV2?.motion?.state || 'MOTION —';
    html = html.replace('<span>1 RENDERER</span>', `<span>${esc(state)}</span><span>1 RENDERER</span>`);
    return html;
  };

  const bind = controller.bind.bind(controller);
  controller.bind = function bindWithMotion(scope) {
    bind(scope);
    scope.querySelectorAll?.('[data-avatar-motion]').forEach((button) => {
      button.addEventListener('click', () => {
        const action = button.dataset.avatarMotion;
        const state = this.__avatarMotionV2;
        if (!state?.motion || !this.previewRoot) return;
        try {
          state.motion.play(action, action === 'IDLE_V2' ? 0.15 : 0.08);
          const duration = state.motion.duration(action);
          state.remaining = NON_LOOPING.has(action) ? duration : 0;
          beginVisualAction(this, action, duration);
          state.error = state.poseProof?.pass ? null : state.error;
          this.studio.render();
        } catch (error) {
          state.compatibility = 'REVIEW';
          state.error = String(error?.message || error);
          this.studio.render();
        }
      });
    });
  };

  const accept = controller.acceptGltf.bind(controller);
  controller.acceptGltf = function acceptGltfWithMotion(gltf, asset) {
    const result = accept(gltf, asset);
    bindMotionToPreview(this);
    this.changed?.();
    return result;
  };

  const clear = controller.clearPreview.bind(controller);
  controller.clearPreview = function clearPreviewWithMotion() {
    disposeMotion(this);
    return clear();
  };

  controller.motionReport = () => ({
    ready: Boolean(controller.__avatarMotionV2?.motion),
    state: controller.__avatarMotionV2?.motion?.state || null,
    compatibility: controller.__avatarMotionV2?.compatibility || 'PENDING',
    skeleton: controller.__avatarMotionV2?.skeleton || null,
    poseProof: controller.__avatarMotionV2?.poseProof || null,
    actions: controller.__avatarMotionV2?.motion?.report?.().actions || [],
    provenance: MOTION_V2_PROVENANCE,
    extraRenderer: false,
    extraScene: false,
    extraCameraAuthority: false,
    extraAnimationFrameLoop: false
  });

  if (controller.previewRoot) bindMotionToPreview(controller);
}

export function installMuseumAvatarMotionPhase5() {
  const controller = window.__IW_AVATAR_STUDIO_PHASE5?.controller;
  const studio = window.__IW_STUDIO;
  if (!controller || !studio) return { mounted: false, reason: 'avatar-studio-not-mounted' };
  installControllerMotion(controller);
  window.__IW_AVATAR_MOTION_PHASE5 = {
    ready: true,
    controller,
    report: () => controller.motionReport()
  };
  studio.render();
  console.info('[Museum Avatar Studio] Motion Foundation V2 controls ready', controller.motionReport());
  return { mounted: true, controller, report: controller.motionReport };
}
