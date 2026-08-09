/**
 * Immersive Worlds — Runtime
 *
 * The composition root of the World Engine. It owns subsystem construction,
 * update order and disposal, and it is the only place where subsystems learn
 * about each other — through explicit ports, never by reaching into internals.
 *
 * What the Runtime is NOT: it is not a renderer, not a Scene Kit, not an app.
 * It never imports a graphics library. Everything visual arrives as an injected
 * Scene Kit that satisfies the contract in engine/scenekit/scene-kit.js.
 *
 * Update order is deliberate and stable:
 *
 *   clock → experience → camera authority → proximity → scene kit → render
 *
 *   • the experience decides what should be happening;
 *   • the camera authority resolves who owns the camera and writes it once;
 *   • proximity observes the resulting visitor position;
 *   • the Scene Kit reacts to semantics it was told about;
 *   • the host renders.
 *
 * Per-frame state deliberately does not travel through the event bus
 * (Constitution §8, last rule).
 */

import { Clock } from './clock.js';
import { EVENTS, EventBus } from './event-bus.js';
import { DeterministicRNG } from './rng.js';
import { QualityManager } from './device-tier.js';
import { WorldStore } from '../world/world-store.js';
import { WorldGraph } from '../world/world-graph.js';
import { WorldState, EXPERIENCE_MODE } from '../world/world-state.js';
import { SpaceLifecycle } from '../world/space-lifecycle.js';
import { CameraAuthority, clonePose } from '../camera/camera-authority.js';
import { ExploreController } from '../camera/controllers/explore-controller.js';
import { FocusController } from '../camera/controllers/focus-controller.js';
import { DirectedController } from '../camera/controllers/directed-controller.js';
import { AuthorController } from '../camera/controllers/author-controller.js';
import { ProximitySystem } from '../interaction/proximity.js';
import { ActionDispatch } from '../interaction/action-dispatch.js';
import { ExperienceDirector } from '../experience/experience-director.js';
import { assertSceneKitContract } from '../scenekit/scene-kit.js';
import { ACTION, CAMERA_AUTHORITY, HOTSPOT_STATE, TRANSITION_BEHAVIOUR } from '../schema/types.js';

export class Runtime {
  /**
   * @param {{
   *   world: import('../schema/types.js').World,
   *   sceneKit: import('../scenekit/scene-kit.js').SceneKit,
   *   viewport: () => {aspect:number, vfov:number},
   *   seed?: number|string,
   *   tier?: string,
   *   env?: object,
   *   reducedMotion?: boolean,
   *   mode?: 'EXPERIENCE'|'AUTHOR'
   * }} options
   */
  constructor(options) {
    const {
      world, sceneKit, viewport,
      seed = 'immersive-worlds-v1', tier, env,
      reducedMotion = false, mode = 'EXPERIENCE'
    } = options;

    assertSceneKitContract(sceneKit);

    this.hostMode = mode;
    this.reducedMotion = reducedMotion;
    this.viewport = viewport;

    this.bus = new EventBus({ recordHistory: true });
    this.clock = new Clock();
    this.rng = new DeterministicRNG(seed);
    this.quality = new QualityManager({ bus: this.bus, tier, env });

    this.store = new WorldStore(world);
    this.graph = new WorldGraph(this.store);
    this.state = new WorldState({ store: this.store, bus: this.bus });
    this.state.assertNoCameraState();

    this.sceneKit = sceneKit;
    this.sceneKitContext = {
      store: this.store,
      quality: this.quality.policy,
      rng: this.rng,
      bus: this.bus,
      hasBudget: (used) => used < this.quality.policy.warmupBudgetMs
    };

    this.spaces = new SpaceLifecycle({
      store: this.store,
      graph: this.graph,
      bus: this.bus,
      sceneKit: this.sceneKit,
      context: this.sceneKitContext
    });

    // -- camera ---------------------------------------------------------------
    this.explore = new ExploreController();
    this.focus = new FocusController();
    this.directed = new DirectedController();
    this.author = new AuthorController();
    this.focus.setReducedMotion(reducedMotion);
    this.directed.setReducedMotion(reducedMotion);

    this.camera = new CameraAuthority({ bus: this.bus, reducedMotion });
    this.camera
      .register(CAMERA_AUTHORITY.EXPLORE, this.explore)
      .register(CAMERA_AUTHORITY.FOCUS, this.focus)
      .register(CAMERA_AUTHORITY.DIRECTED, this.directed)
      .register(CAMERA_AUTHORITY.AUTHOR, this.author);
    this.camera._owner = mode === 'AUTHOR' ? CAMERA_AUTHORITY.AUTHOR : CAMERA_AUTHORITY.EXPLORE;

    // -- interaction ----------------------------------------------------------
    this.actions = new ActionDispatch({ bus: this.bus });
    this.proximity = new ProximitySystem({
      store: this.store,
      state: this.state,
      bus: this.bus,
      sceneKit: this.sceneKit
    });
    this._registerActions();

    // -- experience -----------------------------------------------------------
    this.experience = new ExperienceDirector({
      store: this.store,
      state: this.state,
      bus: this.bus,
      reducedMotion,
      ports: {
        framingFor: (subjectRef, intent) => this.framingFor(subjectRef, intent),
        playShot: (pose, opts) => this.directed.playShot(pose, opts),
        snapTo: (pose) => this.directed.snapTo(pose),
        requestAuthority: (authority, opts) => this.camera.request(authority, opts),
        dispatch: (action, context) => this.actions.dispatch(action, context),
        viewport: () => this.viewport()
      }
    });

    /** Pose the visitor stood at before Focus or a guided route took over. */
    this._exploreReturnPose = null;
    this._running = false;
    this._rafHandle = null;
    this._frameTimes = [];
    this.onFrame = null;

    this.bus.on(EVENTS.QUALITY_TIER_CHANGED, ({ policy }) => {
      this.sceneKitContext.quality = policy;
      this.sceneKit.applyQuality(policy);
    });
  }

  /* == actions =============================================================== */

  _registerActions() {
    this.actions
      .register(ACTION.FOCUS_ENTITY, (action, context) => this.focusEntity(action.target, action.params, context))
      .register(ACTION.RELEASE_FOCUS, () => this.releaseFocus())
      .register(ACTION.OPEN_INFO, (action) => {
        this.state.setFocus(action.target);
        return { info: this.store.require(action.target).content };
      })
      .register(ACTION.PLAY_MEDIA, (action) => {
        this.bus.emit(EVENTS.AUDIO_CUE, { cue: 'entity-media', entityId: action.target });
        return this.focusEntity(action.target, action.params);
      })
      .register(ACTION.ACTIVATE_PORTAL, (action, context) => this.traversePortal(action.target, context))
      .register(ACTION.START_ROUTE, (action) => this.startRoute(action.target))
      .register(ACTION.TRIGGER_STORY, (action) => {
        const step = this.store.require(action.target);
        return this.startRoute(this._routeContaining(step.chapterId));
      })
      .register(ACTION.SET_STATE, (action) => {
        const { hotspotId, state } = action.params || {};
        if (hotspotId && state) this.state.setHotspotState(hotspotId, state);
        return true;
      });
  }

  _routeContaining(chapterId) {
    const route = this.store.routes.find((candidate) => (candidate.chapterRefs || []).includes(chapterId));
    if (!route) throw new Error(`[IW] no route contains chapter "${chapterId}"`);
    return route.id;
  }

  /* == lifecycle ============================================================= */

  /** Build the start Space, place the visitor and announce readiness. */
  async start() {
    await this.spaces.activate(this.store.startSpaceId);
    this._onSpaceActivated(this.store.startSpaceId, this.state.arrivalAnchorId);

    if (this.hostMode === 'AUTHOR') {
      const bounds = this.store.require(this.store.startSpaceId).bounds;
      this.author.framePoint([bounds.origin[0], bounds.origin[1] + 1.4, bounds.origin[2]], Math.max(...bounds.size));
    }

    this.bus.emit(EVENTS.WORLD_READY, {
      worldId: this.store.id,
      spaceId: this.store.startSpaceId,
      tier: this.quality.tier
    });
    return this;
  }

  _onSpaceActivated(spaceId, arrivalAnchorId) {
    const space = this.store.require(spaceId);
    const anchorId = arrivalAnchorId || space.defaultSpawnAnchorId;
    const spawn = this.sceneKit.poseForAnchor(anchorId);

    this.explore.setNavigationVolume(this.sceneKit.navigationVolume(spaceId));
    if (spawn) this.explore.placeAt(spawn.position, spawn.normal);
    this.proximity.rebuild(spaceId);
  }

  /* == semantic operations =================================================== */

  /**
   * Focus an entity. This is the single path used by an Explore hotspot, by a
   * guided story step and by the QA harness — one behaviour, three callers.
   */
  focusEntity(entityId, params = {}, context = {}) {
    const entity = this.store.require(entityId);
    this.state.setFocus(entityId);
    this.sceneKit.setEntityFocused(entityId, true);

    for (const hotspotId of entity.interaction?.hotspotRefs || []) {
      this.state.setHotspotState(hotspotId, HOTSPOT_STATE.VISITED);
    }

    // A guided shot focuses the *world*, but the camera stays with the Director.
    if (params.camera === false || this.state.mode === EXPERIENCE_MODE.GUIDED) {
      return { entityId, camera: this.camera.owner };
    }

    const pose = this.framingFor(entityId, 'FOCUS');
    this._exploreReturnPose = clonePose(this.camera.pose);
    this.focus.setSubject(pose);
    this.camera.request(CAMERA_AUTHORITY.FOCUS, {
      reason: `focus:${entityId}`,
      durationMs: this.reducedMotion ? 0 : 900,
      endPose: pose,
      restore: 'ADOPT_INCOMING'
    });
    this.bus.emit(EVENTS.HOTSPOT_ACTIVATED, { hotspotId: context.sourceId || null, entityId });
    return { entityId, camera: CAMERA_AUTHORITY.FOCUS };
  }

  /**
   * Leave focus. The visitor returns to exactly where they were standing —
   * PRESERVE_OWN means the Explore controller reinstates its own kept pose
   * rather than adopting wherever the focus camera happened to end up.
   */
  releaseFocus() {
    if (!this.state.focusedEntityId) return false;
    const entityId = this.state.focusedEntityId;
    this.sceneKit.setEntityFocused(entityId, false);
    this.state.setFocus(null);

    this.camera.request(CAMERA_AUTHORITY.EXPLORE, {
      reason: 'focus:release',
      durationMs: this.reducedMotion ? 0 : 700,
      endPose: this._exploreReturnPose || undefined,
      restore: 'PRESERVE_OWN'
    });
    this._exploreReturnPose = null;
    return true;
  }

  /**
   * Traverse a Portal. The Portal owns the connection and the semantic
   * transition behaviour; it owns no trigger — getting here was somebody else's
   * job (a Hotspot action, or a guided step).
   */
  async traversePortal(portalId, context = {}) {
    const portal = this.store.require(portalId);
    this.bus.emit(EVENTS.PORTAL_REQUESTED, { portalId, from: portal.fromSpaceId, to: portal.toSpaceId });

    if (this.state.focusedEntityId) this.releaseFocus();

    const activation = await this.spaces.activate(portal.toSpaceId);
    this.state.enterSpace(portal.toSpaceId, portal.destinationSpawnId);
    this.state.markPortalTraversed(portalId);
    this._onSpaceActivated(portal.toSpaceId, portal.destinationSpawnId);

    const spawn = this.sceneKit.poseForAnchor(portal.destinationSpawnId);
    const arrivalPose = spawn
      ? {
          position: [spawn.position[0], spawn.position[1] + this.explore.eyeHeight, spawn.position[2]],
          target: [
            spawn.position[0] + spawn.normal[0],
            spawn.position[1] + this.explore.eyeHeight,
            spawn.position[2] + spawn.normal[2]
          ],
          fov: this.explore.fov
        }
      : null;

    if (this.state.mode === EXPERIENCE_MODE.GUIDED) {
      // The Director keeps the camera; a portal inside a tour is a cut it owns.
      if (arrivalPose) this.directed.snapTo(arrivalPose);
    } else if (arrivalPose) {
      const instant =
        this.reducedMotion || portal.transitionBehaviour === TRANSITION_BEHAVIOUR.CUT;
      this.camera.request(CAMERA_AUTHORITY.EXPLORE, {
        reason: `portal:${portalId}`,
        durationMs: instant ? 0 : 650,
        endPose: arrivalPose,
        restore: 'ADOPT_INCOMING'
      });
    }

    this.bus.emit(EVENTS.PORTAL_ENTERED, {
      portalId,
      spaceId: portal.toSpaceId,
      behaviour: portal.transitionBehaviour,
      preparedOnDemand: activation.prepared,
      waitedMs: activation.waitedMs,
      source: context.source || null
    });
    return { spaceId: portal.toSpaceId, waitedMs: activation.waitedMs };
  }

  /**
   * The works in the active Space a visitor can inspect, in the order they are
   * authored. This is what "next work" means — it is a property of the World,
   * not of the UI.
   */
  focusableInSpace(spaceId = this.state.activeSpaceId) {
    return this.store.entitiesOf(spaceId).filter((entity) => entity.interaction?.focusable);
  }

  /**
   * Move focus to the next or previous work without walking back into the room.
   *
   * It goes through the ordinary FOCUS_ENTITY action, so stepping through a
   * gallery in detail view leaves exactly the same trace in World State as
   * walking up to each work would.
   *
   * @param {number} delta +1 next, -1 previous
   */
  focusNeighbour(delta = 1) {
    const works = this.focusableInSpace();
    if (!works.length) return null;
    const current = works.findIndex((entity) => entity.id === this.state.focusedEntityId);
    const next = works[(current + delta + works.length) % works.length];
    if (!next || next.id === this.state.focusedEntityId) return null;

    // Keep the pose the visitor will return to: stepping through five works
    // must still put them back where they entered the first one.
    const keepReturn = this._exploreReturnPose;
    this.sceneKit.setEntityFocused(this.state.focusedEntityId, false);
    this.actions.dispatch(
      { type: ACTION.FOCUS_ENTITY, target: next.id },
      { source: 'HOTSPOT', sourceId: 'detail-navigation' }
    );
    this._exploreReturnPose = keepReturn || this._exploreReturnPose;
    return next.id;
  }

  /**
   * How close the detail view is pushed in, 0 = authored framing, 1 = as close
   * as the work allows. The camera authority is untouched: this only changes
   * what the FOCUS controller asks for.
   */
  setDetailZoom(zoom) {
    this.focus.setZoom(zoom);
    return this.focus.zoom;
  }

  /** Activate whichever hotspot the visitor is standing next to. */
  activateNearest() {
    const hotspot = this.proximity.nearestHotspot;
    if (!hotspot) return null;
    this.state.setHotspotState(hotspot.id, HOTSPOT_STATE.ACTIVE);
    this.sceneKit.setHotspotState(hotspot.id, HOTSPOT_STATE.ACTIVE);
    const action = { ...hotspot.action, target: hotspot.action.target ?? hotspot.entityId };
    return this.actions.dispatch(action, { source: 'HOTSPOT', sourceId: hotspot.id });
  }

  startRoute(routeId) {
    this._exploreReturnPose = clonePose(this.camera.pose);
    this.experience.start(routeId, { returnPose: this._exploreReturnPose });
    return routeId;
  }

  exitRoute() {
    this.experience.exit({ restorePose: true, reason: 'visitor-exit' });
  }

  /** Ask the Scene Kit to measure a framing for a subject and intent. */
  framingFor(subjectRef, intent) {
    const viewport = this.viewport();
    const kind = this.store.kindOf(subjectRef);
    if (kind === 'SPACE') return this.sceneKit.framingForSpace(subjectRef, { ...viewport, intent });
    return this.sceneKit.framingForEntity(subjectRef, { ...viewport, intent });
  }

  /* == frame ================================================================= */

  /** @param {number} dt seconds */
  step(dt) {
    this.experience.update(dt);
    const pose = this.camera.update(dt);
    this.proximity.update(dt, pose.position);
    this.sceneKit.update(dt, this.clock.elapsed);
    this.onFrame?.(pose, dt);
    return pose;
  }

  startLoop() {
    if (this._running) return;
    this._running = true;
    const tick = (now) => {
      if (!this._running) return;
      const frameStart = performance.now();
      const dt = this.clock.tick(now);
      this.step(dt);
      this._frameTimes.push(performance.now() - frameStart);
      if (this._frameTimes.length > 240) this._frameTimes.shift();
      this._rafHandle = requestAnimationFrame(tick);
    };
    this._rafHandle = requestAnimationFrame(tick);
  }

  stopLoop() {
    this._running = false;
    if (this._rafHandle) cancelAnimationFrame(this._rafHandle);
    this._rafHandle = null;
  }

  dispose() {
    this.stopLoop();
    this.spaces.disposeAll();
    this.bus.clear();
  }

  /* == evidence ============================================================== */

  frameStats() {
    if (!this._frameTimes.length) return { samples: 0 };
    const sorted = [...this._frameTimes].sort((a, b) => a - b);
    const mean = sorted.reduce((sum, value) => sum + value, 0) / sorted.length;
    return {
      samples: sorted.length,
      meanMs: Number(mean.toFixed(2)),
      p50Ms: Number(sorted[Math.floor(sorted.length * 0.5)].toFixed(2)),
      p95Ms: Number(sorted[Math.floor(sorted.length * 0.95)].toFixed(2)),
      maxMs: Number(sorted[sorted.length - 1].toFixed(2))
    };
  }

  report() {
    return {
      world: { id: this.store.id, title: this.store.title, schemaVersion: this.store.schemaVersion },
      mode: this.hostMode,
      quality: { tier: this.quality.tier, policy: this.quality.policy },
      state: this.state.snapshot(),
      camera: this.camera.report(),
      spaces: this.spaces.report(),
      proximity: this.proximity.report(),
      experience: this.experience.report(),
      actions: this.actions.summary(),
      render: this.sceneKit.renderStats(),
      frame: this.frameStats()
    };
  }
}

export { EXPERIENCE_MODE };
