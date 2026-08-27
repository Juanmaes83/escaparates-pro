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
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));

function motionHTML(controller) {
  const m = controller.__avatarMotionV2;
  const ready = Boolean(m?.motion && controller.previewRoot);
  const state = m?.motion?.state || 'NOT READY';
  const compat = m?.compatibility || (controller.profile?.rigStatus?.pass ? 'READY TO ACTIVATE' : 'RIG REQUIRED');
  const buttons = MOTION_ACTIONS.map(([action, label]) =>
    `<button class="st-b ${state === action ? 'is-active' : ''}" data-avatar-motion="${action}" ${ready ? '' : 'disabled'}>${label}</button>`
  ).join('');
  return `<section class="st-group st-avatar-motion-panel">
    <h3>Motion · Foundation V2</h3>
    <p class="st-note">Prueba el movimiento sobre este mismo avatar y este mismo preview. WALK no desplaza el avatar por la sala: aquí validamos biomecánica, no navegación.</p>
    <div class="st-avatar-motion-summary">
      <div><span>Foundation</span><strong>V2</strong></div>
      <div><span>Estado</span><strong>${esc(state)}</strong></div>
      <div><span>Compatibilidad</span><strong>${esc(compat)}</strong></div>
    </div>
    <div class="st-avatar-motion-actions">${buttons}</div>
    ${m?.error ? `<p class="st-msg is-bad">${esc(m.error)}</p>` : ''}
    <p class="st-note">Fuente: CharacterStudio MotionFoundationV2 · ${esc(MOTION_V2_PROVENANCE.sourceCommit.slice(0, 8))}… · sin renderer, Scene, CameraAuthority ni frame loop adicionales.</p>
  </section>`;
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
      if (state.remaining > 0) {
        state.remaining -= frameDt;
        if (state.remaining <= 0 && state.motion.state !== 'IDLE_V2') {
          state.motion.play('IDLE_V2', 0.12);
          state.remaining = 0;
          state.compatibility = 'PASS';
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
    state.compatibility = 'PENDING';
  }
}

function bindMotionToPreview(controller) {
  disposeMotion(controller);
  if (!controller.previewRoot) return false;
  const state = controller.__avatarMotionV2;
  try {
    state.motion = createCharacterMotionV2(controller.previewRoot);
    state.compatibility = 'PASS';
    state.error = null;
    state.remaining = 0;
    if (controller.profile?.motionSet) controller.profile.motionSet.foundation = 'V2';
    installFrameBridge(controller);
    return true;
  } catch (error) {
    state.motion = null;
    state.compatibility = 'REVIEW';
    state.error = String(error?.message || error);
    return false;
  }
}

function installControllerMotion(controller) {
  if (!controller || controller.__avatarMotionV2Installed) return;
  controller.__avatarMotionV2Installed = true;
  controller.__avatarMotionV2 = {
    motion: null,
    remaining: 0,
    compatibility: 'PENDING',
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
          state.remaining = NON_LOOPING.has(action) ? state.motion.duration(action) : 0;
          state.compatibility = 'PASS';
          state.error = null;
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
