/**
 * Immersive Worlds — Published experience shell
 *
 * This is the *visitor* application: it boots the engine, hands it a Museum
 * Scene Kit, wires input and UI, and renders. There is no editing affordance
 * anywhere in it — Author Mode is a different entry point with a different
 * camera authority (author.html).
 *
 * The shell is thin on purpose. Almost everything it does is either DOM wiring
 * or forwarding a semantic Action to the runtime, which is the shape you want
 * when a second front end (embed, kiosk, export) has to exist later.
 */

import { Runtime } from '../engine/core/runtime.js';
import { ACTION, CAMERA_AUTHORITY } from '../engine/schema/types.js';
import { EVENTS } from '../engine/core/event-bus.js';
import { EXPERIENCE_MODE } from '../engine/world/world-state.js';
import { RenderHost } from '../render/render-host.js';
import { MuseumSceneKit } from '../scene-kits/museum/museum-scene-kit.js';
import { MediaLoader } from '../render/media-loader.js';
import { detectTier, isMobileEnv, policyForTier } from '../engine/core/device-tier.js';
import { AudioDirector } from './audio-director.js';
import { ExperienceHUD } from './ui/hud.js';
import { InputSystem } from './ui/input.js';
import { DETERMINISTIC_STATES, STATE_NAMES } from '../qa/deterministic-states.js';

const params = new URLSearchParams(location.search);
const WORLD_URL = params.get('world') || './worlds/museum-v1.world.json';

export async function boot() {
  const canvas = document.getElementById('iw-canvas');
  const uiRoot = document.getElementById('iw-ui');

  const reducedMotion =
    params.get('reducedMotion') === '1' ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const env = {
    userAgent: navigator.userAgent,
    deviceMemory: navigator.deviceMemory,
    hardwareConcurrency: navigator.hardwareConcurrency,
    maxTouchPoints: navigator.maxTouchPoints,
    screenWidth: window.screen?.width,
    devicePixelRatio: window.devicePixelRatio
  };
  const tier = params.get('tier')?.toUpperCase() || detectTier(env);
  const seed = params.get('seed') || 'fundacion-arenas-v1';

  const world = await fetch(WORLD_URL, { cache: 'no-store' }).then((response) => {
    if (!response.ok) throw new Error(`No se pudo cargar el mundo (${response.status})`);
    return response.json();
  });

  const renderHost = new RenderHost({ canvas, quality: policyForTier(tier, { mobile: isMobileEnv(env) }) });
  // Media paths in a world file are relative to that file, so an institution can
  // keep its collection next to its world definition.
  const mediaLoader = new MediaLoader({ bus: null, baseUrl: new URL(WORLD_URL, location.href).href });
  const sceneKit = new MuseumSceneKit({ renderHost, mediaLoader });

  const runtime = new Runtime({
    world,
    sceneKit,
    // The wall label sits low in the frame on desktop and becomes a sheet on a
    // phone. Framing composes the work into what is left, so the label never
    // covers the thing it describes.
    viewport: () => ({
      ...renderHost.viewport(),
      insetRight: 0,
      insetBottom: window.innerWidth >= 900 ? 0.16 : 0.34
    }),
    seed,
    tier,
    env,
    reducedMotion,
    mode: 'EXPERIENCE'
  });

  // The loader could not have the bus at construction time; give it one now so
  // asset failures reach the same event vocabulary as everything else.
  mediaLoader.bus = runtime.bus;

  const audio = new AudioDirector();
  const hud = new ExperienceHUD({ root: uiRoot, runtime, audio });

  // Loading evidence comes from the lifecycle itself, not from a fake timer.
  let readySpaces = 0;
  runtime.bus.on(EVENTS.SPACE_PRELOAD_REQUESTED, ({ spaceId }) => {
    hud.setLoadingProgress(0.25, `Construyendo ${runtime.store.require(spaceId).title.toLowerCase()}…`);
  });
  runtime.bus.on(EVENTS.SPACE_READY, () => {
    readySpaces += 1;
    hud.setLoadingProgress(Math.min(0.35 + readySpaces * 0.3, 0.95), 'Compilando materiales…');
  });

  const input = new InputSystem({
    element: canvas,
    explore: runtime.explore,
    focus: runtime.focus,
    onActivate: () => {
      if (runtime.state.mode === EXPERIENCE_MODE.GUIDED) return;
      if (runtime.state.focusedEntityId) runtime.releaseFocus();
      else runtime.activateNearest();
    },
    onEscape: () => {
      if (hud.mapOpen) return hud.toggleMap(false);
      if (!hud.el.a11y.hidden) return hud.toggleAccessibility(false);
      if (runtime.state.mode === EXPERIENCE_MODE.GUIDED) return runtime.exitRoute();
      if (runtime.state.focusedEntityId) return runtime.releaseFocus();
      if (document.pointerLockElement) document.exitPointerLock();
      return undefined;
    },
    onToggleMap: () => hud.toggleMap(),
    onStartRoute: () => {
      const route = runtime.store.routes[0];
      if (route && runtime.state.mode !== EXPERIENCE_MODE.GUIDED) runtime.startRoute(route.id);
    },
    // These two only mean something while a work is being inspected, and they
    // report back whether they consumed the event so the room keeps its own
    // meaning for the same keys.
    onZoom: (delta) => {
      if (!runtime.state.focusedEntityId || runtime.state.mode === EXPERIENCE_MODE.GUIDED) return false;
      hud.setZoom(hud.zoom + delta);
      return true;
    },
    onStepWork: (delta) => {
      if (!runtime.state.focusedEntityId || runtime.state.mode === EXPERIENCE_MODE.GUIDED) return false;
      return Boolean(runtime.focusNeighbour(delta));
    }
  });

  // Input belongs to the visitor only while the visitor owns the camera.
  runtime.bus.on(EVENTS.CAMERA_AUTHORITY_CHANGED, ({ to }) => {
    input.setEnabled(to === CAMERA_AUTHORITY.EXPLORE);
    if (to !== CAMERA_AUTHORITY.EXPLORE && document.pointerLockElement) document.exitPointerLock();
  });

  runtime.onFrame = (pose, dt) => {
    input.update(dt);
    renderHost.applyPose(pose);
    // Variant D's destination pass sits exactly where the owned Infinite Worlds
    // render loop puts it: after the visitor camera is placed, before the frame
    // is drawn. A no-op for every other variant.
    sceneKit.renderPortalPass?.(renderHost);
    renderHost.render(sceneKit.scene);
  };

  window.addEventListener('resize', () => renderHost.resize(), { passive: true });

  await runtime.start();
  hud.setLoadingProgress(1, 'La sala está preparada');
  runtime.startLoop();

  // Portal treatment variant, for the Block 2B visual comparison. Default is the
  // approved architectural crossing; the others exist to be looked at, and
  // nothing about them survives a page load that does not ask for one.
  const portalVariant = (params.get('portalVariant') || 'A').toUpperCase();
  sceneKit.setThresholdTreatment?.({ A: 'NONE', B: 'ADAPTED', C: 'SUBTLE', D: 'IW_ENGINE' }[portalVariant] || 'NONE');

  const requestedState = params.get('state');
  installProbe({ runtime, renderHost, sceneKit, hud, audio, input, mediaLoader, tier, seed, reducedMotion });

  if (requestedState && DETERMINISTIC_STATES[requestedState]) {
    // A QA run enters directly, without the human "enter" gesture.
    input.setEnabled(false);
    hud.el.veil.hidden = true;
    await DETERMINISTIC_STATES[requestedState].apply(runtime);
    window.__IW.state = requestedState;
  } else {
    hud.showEnter(() => {
      audio.resume().then(() => {
        audio.setAmbience(runtime.store.require(runtime.state.activeSpaceId).ambience);
      });
      canvas.focus?.();
    });
  }

  window.__IW.ready = true;
  document.documentElement.dataset.iwReady = 'true';
  return runtime;
}

/**
 * The QA/console surface. Everything a reviewer or a Playwright spec needs to
 * inspect the engine — including the assertions that the architecture's
 * invariants actually held during the run.
 */
function installProbe(context) {
  const { runtime, renderHost, hud, audio, input, mediaLoader, tier, seed, reducedMotion } = context;

  window.__IW = {
    ready: false,
    state: null,
    version: 'IW-2',
    tier,
    seed,
    reducedMotion,
    runtime,
    renderHost,
    hud,
    audio,
    mediaLoader,
    input,

    /** Full runtime report — the object the QA suite writes into its evidence. */
    report: () => ({ ...runtime.report(), media: mediaLoader.report() }),

    /** Apply a named deterministic state at runtime. */
    async applyState(name) {
      const state = DETERMINISTIC_STATES[name];
      if (!state) throw new Error(`Unknown state "${name}". Known: ${STATE_NAMES.join(', ')}`);
      input.setEnabled(false);
      await state.apply(runtime);
      window.__IW.state = name;
      return runtime.report();
    },

    states: STATE_NAMES,

    /** Wait for N rendered frames — how a spec settles the image before a capture. */
    frames(count = 8) {
      return new Promise((resolve) => {
        let remaining = count;
        const tick = () => (remaining-- <= 0 ? resolve(true) : requestAnimationFrame(tick));
        requestAnimationFrame(tick);
      });
    },

    dispatch: (action, ctx = { source: 'QA' }) => runtime.actions.dispatch(action, ctx),

    /**
     * The architectural assertions, executable.
     *
     * These are the claims IW-1 makes about itself. If one of them returns
     * false, the milestone is not what it says it is.
     */
    assertInvariants() {
      const store = runtime.store;
      const state = runtime.state;
      const results = [];
      const check = (id, claim, pass, detail = '') => results.push({ id, claim, pass: !!pass, detail });

      const identity = store.auditCanonicalIdentity();
      check('INV-CANONICAL', 'Cada id resuelve a exactamente un registro canónico',
        identity.ok, `${identity.total} registros; ${identity.violations.length} violaciones`);

      const sameObject = store.entitiesOf(state.activeSpaceId)
        .every((entity) => store.get(entity.id) === entity);
      check('INV-BY-REFERENCE', 'Las Spaces referencian entidades, no copias', sameObject);

      let noCamera = true;
      let cameraDetail = '';
      try { state.assertNoCameraState(); } catch (error) { noCamera = false; cameraDetail = String(error.message); }
      check('INV-WORLD-NOT-CAMERA', 'World State no contiene estado de cámara', noCamera, cameraDetail);

      check('INV-ONE-CAMERA-WRITER', 'Un único controlador de cámara autoritativo por frame',
        runtime.camera.violations.length === 0,
        `${runtime.camera.report().frame} frames, ${runtime.camera.violations.length} violaciones`);

      const hotspotFields = store.hotspots.every((hotspot) =>
        !('fromSpaceId' in hotspot) && !('toSpaceId' in hotspot) && !('transitionBehaviour' in hotspot));
      const portalFields = store.portals.every((portal) =>
        !('action' in portal) && !('triggerDistance' in portal) && !('interactionVolume' in portal));
      check('INV-HOTSPOT-NOT-PORTAL', 'Hotspot dispara, Portal conecta: sin solape de responsabilidad',
        hotspotFields && portalFields);

      const renderFree = [...store.entities, ...store.spaces, ...store.portals]
        .every((record) => !JSON.stringify(record).match(/"(mesh|material|geometry|shader|object3d)"/i));
      check('INV-SEMANTIC-NOT-VISUAL', 'Ningún registro semántico contiene implementación de render', renderFree);

      // Both interaction paths must speak the declared Action vocabulary, and
      // every action the world references must have a handler. This holds from
      // the first frame, before anything has been dispatched.
      const declared = new Set(Object.keys(ACTION));
      const hotspotActions = store.hotspots.map((hotspot) => hotspot.action?.type);
      const stepActions = store.storySteps.map((step) => step.action?.type).filter(Boolean);
      const used = [...new Set([...hotspotActions, ...stepActions])];
      const undeclared = used.filter((type) => !declared.has(type));
      const unhandled = used.filter((type) => !runtime.actions._handlers.has(type));
      check('INV-SHARED-ACTIONS', 'Hotspots y pasos guiados usan el mismo vocabulario declarado de Action',
        undeclared.length === 0 && unhandled.length === 0,
        `${used.length} acciones en uso: ${used.join(', ')}`);

      check('INV-SCENEKIT-CONTRACT', 'El motor sólo habla con el Scene Kit por contrato',
        runtime.sceneKit.name === 'museum' && typeof runtime.sceneKit.framingForEntity === 'function');

      const unreachable = runtime.graph.unreachableFrom(store.startSpaceId);
      check('INV-GRAPH-CONNECTED', 'Todas las salas son alcanzables desde el inicio',
        unreachable.length === 0, unreachable.join(', '));

      return { ok: results.every((r) => r.pass), results };
    }
  };
}
