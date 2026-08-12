/**
 * Immersive Worlds — Experience Director
 *
 * Guided Experience: chapters, story steps, shots and cues.
 *
 * Two contracts matter more than any feature here:
 *
 *   1. The Director *orchestrates*; it does not own subsystem internals
 *      (IW-ADR-007). It never writes the camera, never builds a Space, never
 *      touches a material. It asks, through the ports below.
 *
 *   2. Explore and Guided drive the SAME World State (IW-ADR-003). There is no
 *      "guided copy" of the world: a work focused during the tour is in the
 *      visitor's visited set afterwards, and a portal traversed by the tour is
 *      the same traversal the visitor could have made on foot.
 *
 * Transport is deliberately thin — play, pause, resume, skip, exit. A seekable
 * authored timeline is SHOULD LATER (Constitution §16) and is not built here.
 *
 * No Three.js. No DOM.
 */

import { EVENTS } from '../core/event-bus.js';
import { ACTION, CAMERA_AUTHORITY, SHOT_INTENT } from '../schema/types.js';
import { EXPERIENCE_MODE } from '../world/world-state.js';
import { buildTourManifest } from './tour-manifest.js';

/**
 * @typedef {Object} ExperiencePorts
 * @property {(subjectRef:string, intent:string)=>{position:number[],target:number[],fov?:number}} framingFor
 * @property {(pose:object, options:{travelMs:number})=>void} playShot
 * @property {(pose:object)=>void} snapTo
 * @property {(authority:string, options:object)=>void} requestAuthority
 * @property {(action:object, context:object)=>any} dispatch
 * @property {()=>{aspect:number, vfov:number}} viewport
 */

export const TRANSPORT = Object.freeze({
  IDLE: 'IDLE',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  COMPLETED: 'COMPLETED'
});

export class ExperienceDirector {
  /**
   * @param {{
   *   store: import('../world/world-store.js').WorldStore,
   *   state: import('../world/world-state.js').WorldState,
   *   bus: import('../core/event-bus.js').EventBus,
   *   ports: ExperiencePorts,
   *   reducedMotion?: boolean
   * }} deps
   */
  constructor({ store, state, bus, ports, reducedMotion = false }) {
    this.store = store;
    this.state = state;
    this.bus = bus;
    this.ports = ports;
    this.reducedMotion = reducedMotion;

    this.transport = TRANSPORT.IDLE;
    this.routeId = null;
    /** @type {import('../schema/types.js').StoryStep[]} */
    this.steps = [];
    this.index = -1;
    this.stepElapsed = 0;
    /** Pose the visitor was left in before the tour started, when we choose to restore it. */
    this._returnPose = null;
    /** The Space that pose was measured in. Outside it, the pose means nothing. */
    this._returnSpaceId = null;
    /** Canonical numbered tour, grouped from the same step array. */
    this.manifest = null;
    /** Set while a seek is replaying beats, so `update` does not race it. */
    this._seeking = false;
  }

  get currentStep() {
    return this.steps[this.index] || null;
  }

  /* == canonical tour ======================================================= */

  /**
   * The numbered Tour Step the current beat belongs to.
   *
   * "Where am I" is answered at the granularity the visitor perceives, not at
   * the granularity the Director executes. A lead, an accompanied shot and a
   * yield are three beats of one moment, and reporting them as three positions
   * is what turns a guided visit into a slide deck.
   */
  get currentTourStep() {
    const beatId = this.currentStep?.id;
    if (!beatId || !this.manifest) return null;
    const ownerId = this.manifest.beatOwner.get(beatId);
    return this.manifest.steps.find((step) => step.id === ownerId) || null;
  }

  /** 1-based canonical position, or 0 when no route is running. */
  get tourOrder() {
    return this.currentTourStep?.order || 0;
  }

  get tourTotal() {
    return this.manifest?.steps.length || 0;
  }

  /**
   * Go to a canonical Tour Step by its id.
   *
   * Truthful about what it is: **reconstruction, not seek.** The route is an
   * authored forward timeline (Constitution §16 keeps a seekable one as SHOULD
   * LATER), so reaching step 05 means executing beats 1..n with their dwell
   * removed — portals really are traversed, spaces really are built, the guide
   * really walks. Going backwards restarts and replays.
   *
   * It awaits each beat's own pending work rather than sleeping a fixed
   * interval, so it is as fast as the world can actually be rebuilt and it
   * cannot land a shot against geometry that does not exist yet.
   *
   * @param {string} tourStepId
   * @returns {Promise<boolean>} whether the step was reached
   */
  async seekToTourStep(tourStepId) {
    if (!this.manifest) return false;
    const target = this.manifest.steps.find((step) => step.id === tourStepId);
    if (!target) return false;

    const alreadyAhead = this.transport === TRANSPORT.IDLE
      || this.transport === TRANSPORT.COMPLETED
      || this.index > target.firstBeatIndex;
    if (alreadyAhead) {
      this.start(this.routeId || this._lastRouteId, { returnPose: this._returnPose });
    }

    this._seeking = true;
    this.pause();
    try {
      // Bounded by the route's own length: a beat that refuses to advance must
      // not spin here forever.
      for (let guard = 0; guard <= this.steps.length; guard += 1) {
        if (this.index >= target.firstBeatIndex) break;
        await this._advanceAndSettle();
      }
    } finally {
      this._seeking = false;
    }
    this.stepElapsed = 0;
    return this.index === target.firstBeatIndex;
  }

  /**
   * Re-apply the current beat's shot, guide staging and camera authority.
   *
   * Used when something borrowed the camera from inside a beat — Collection
   * Browse — and has to give it back to exactly the composition the visitor
   * left, rather than to a generic explore pose.
   */
  reapplyCurrentShot() {
    const step = this.currentStep;
    if (!step) return false;
    this.ports.requestAuthority(CAMERA_AUTHORITY.DIRECTED, { reason: `route:${this.routeId}:resume` });
    this._applyShot(step);
    return true;
  }

  /**
   * Which transition family carries us from the previous beat to this one.
   *
   * Semantics first. Only the last case consults geometry, and only to separate a
   * neighbouring encounter from a cross-zone one — a distinction the world does not
   * currently declare, so distance stands in as evidence for it until it does.
   */
  _transitionFamily(previous, step) {
    if (!previous) return null;

    // A threshold destination is a threshold approach, whatever the distance.
    if (!step.subjectRef || this.store.kindOf(step.subjectRef) === 'SPACE') {
      return TRANSITION.THRESHOLD;
    }

    const sameSubject = previous.subjectRef === step.subjectRef;
    if (sameSubject) {
      // Inspecting a free-standing piece is the one same-subject move that is
      // about turning the object rather than reframing it.
      const kind = this.store.kindOf(step.subjectRef);
      const inspecting = kind === 'SCULPTURE'
        && (step.shotIntent === SHOT_INTENT.DETAIL || step.shotIntent === SHOT_INTENT.CONTEMPLATION);
      return inspecting ? TRANSITION.ORBIT : TRANSITION.MICRO;
    }

    // Different subject: neighbouring encounter, or a crossing of the room.
    const from = this.ports.subjectPoint?.(previous.subjectRef);
    const to = this.ports.subjectPoint?.(step.subjectRef);
    if (!from || !to) return TRANSITION.LOCAL;
    const apart = Math.hypot(to[0] - from[0], to[2] - from[2]);
    return apart > 5 ? TRANSITION.TRAVERSE : TRANSITION.LOCAL;
  }

  /** Next canonical Tour Step. Cheap: it is forward, so it just replays beats. */
  async nextTourStep() {
    const next = this.currentTourStep?.nextId;
    return next ? this.seekToTourStep(next) : false;
  }

  /** Previous canonical Tour Step. Restarts and replays — see `seekToTourStep`. */
  async previousTourStep() {
    const previous = this.currentTourStep?.previousId;
    return previous ? this.seekToTourStep(previous) : false;
  }

  /**
   * Advance one beat and wait for whatever that beat had to build.
   *
   * `_advance` fires an Action that may be a Portal traversal; its promise is
   * the only honest signal that the next shot can be framed. Waiting on it is
   * what lets a seek run at machine speed without the fixed sleeps the QA
   * states had to use from outside.
   */
  async _advanceAndSettle() {
    const before = this.index;
    this._advance();
    if (this._pendingStep) {
      try { await this._pendingStep; } catch { /* already reported as ASSET_ERROR */ }
    }
    // Yield once so a shot queued in a microtask has landed.
    await new Promise((resolve) => setTimeout(resolve, 0));
    return this.index !== before;
  }

  get progress() {
    if (!this.steps.length || this.index < 0) return 0;
    return (this.index + Math.min(this.stepElapsed / Math.max(this.currentStep?.duration || 1, 0.001), 1)) / this.steps.length;
  }

  /**
   * @param {string} routeId
   * @param {{returnPose?:object}} [options]
   */
  start(routeId, options = {}) {
    const route = this.store.require(routeId);
    this.routeId = routeId;
    this._lastRouteId = routeId;
    this.steps = this.store.routeSteps(routeId);
    if (!this.steps.length) throw new Error(`[IW] route "${routeId}" has no story steps`);
    // Grouped from the very array above, so the numbered tour and the executed
    // timeline cannot be two different sequences.
    this.manifest = buildTourManifest(this.store, routeId);

    this._returnPose = options.returnPose || null;
    // A pose is only meaningful in the Space it was measured in. Remember which
    // one, so exiting can tell "put the visitor back where they were standing"
    // apart from "put the visitor at coordinates that belong to another room".
    this._returnSpaceId = this.state.activeSpaceId;
    this.index = -1;
    this.stepElapsed = 0;
    this.transport = TRANSPORT.PLAYING;

    this.state.setMode(EXPERIENCE_MODE.GUIDED);
    this.state.setRoute(routeId, null);
    this.ports.requestAuthority(CAMERA_AUTHORITY.DIRECTED, { reason: `route:${routeId}` });

    this.bus.emit(EVENTS.ROUTE_STARTED, { routeId, title: route.title, steps: this.steps.length });
    this.bus.emit(EVENTS.EXPERIENCE_STARTED, { routeId });
    this._advance();
    return this;
  }

  pause() {
    if (this.transport !== TRANSPORT.PLAYING) return;
    this.transport = TRANSPORT.PAUSED;
    this.bus.emit(EVENTS.EXPERIENCE_PAUSED, { routeId: this.routeId, stepId: this.currentStep?.id });
  }

  resume() {
    if (this.transport !== TRANSPORT.PAUSED) return;
    this.transport = TRANSPORT.PLAYING;
    this.bus.emit(EVENTS.EXPERIENCE_RESUMED, { routeId: this.routeId, stepId: this.currentStep?.id });
  }

  next() {
    if (this.transport === TRANSPORT.IDLE || this.transport === TRANSPORT.COMPLETED) return;
    this._advance();
  }

  /**
   * Leave guided mode and give the camera back to the visitor.
   *
   * Constitution §14 rule 4: a directed sequence may not corrupt the Explore
   * pose *unless the experience explicitly chooses a new one*. Exiting early
   * restores where the visitor was standing; finishing the tour deliberately
   * leaves them where the tour ended.
   *
   * That restore is only valid while the visitor is still in the room the pose
   * was taken in. A route that walks them from the lobby into a gallery and is
   * then left — by pressing Escape, or by the handoff at the end of an
   * accompanied beat — was placing them at lobby coordinates inside Gallery A,
   * which put the camera in the middle of a wall and rendered black. Crossing a
   * Portal invalidates the return pose, and the right place to leave someone is
   * then exactly where the last shot left them: looking at the thing they were
   * being shown. That is the handoff, not a fallback.
   */
  exit({ restorePose = true, reason = 'exit' } = {}) {
    if (this.transport === TRANSPORT.IDLE) return;
    const completed = this.transport === TRANSPORT.COMPLETED;
    this.transport = TRANSPORT.IDLE;

    this.state.setMode(EXPERIENCE_MODE.EXPLORE);
    this.state.setRoute(null, null);
    this.state.setFocus(null);
    // The guide belongs to the guided experience. Leaving one standing in a
    // room the visitor is now exploring alone would be a bystander, not a host.
    this.ports.stageGuide?.(null);

    const returnPoseIsHere = this._returnSpaceId === this.state.activeSpaceId;
    if (restorePose && this._returnPose && returnPoseIsHere) {
      this.ports.requestAuthority(CAMERA_AUTHORITY.EXPLORE, {
        reason: `route:${reason}`,
        durationMs: this.reducedMotion ? 0 : 900,
        endPose: this._returnPose,
        restore: 'ADOPT_INCOMING'
      });
    } else {
      this.ports.requestAuthority(CAMERA_AUTHORITY.EXPLORE, {
        reason: `route:${reason}`,
        restore: 'ADOPT_INCOMING'
      });
    }

    this.bus.emit(EVENTS.EXPERIENCE_COMPLETED, { routeId: this.routeId, completed });
    this.routeId = null;
    this.steps = [];
    this.index = -1;
    this._returnPose = null;
    this._returnSpaceId = null;
  }

  /**
   * @param {number} dt seconds
   *
   * A lead ends when the guide arrives, not when a number runs out.
   *
   * Its authored duration is a floor, because the walk it covers depends on how
   * far the next stop is — and the composition that follows assumes she is
   * standing at it. Advancing on the clock alone started the accompanied shot
   * while she was still crossing the room, so the visitor was shown a
   * "someone is presenting this to you" framing with nobody in it, and then a
   * yield framing with her head still crossing the artwork. Waiting for the
   * arrival is what makes the grammar repeatable rather than lucky.
   *
   * The wait is bounded: if a guide can never arrive — no representation, an
   * unreachable anchor — the route must not stall, so past twice the authored
   * duration the step advances regardless.
   */
  update(dt) {
    if (this._seeking) return;
    if (this.transport !== TRANSPORT.PLAYING) return;
    const step = this.currentStep;
    if (!step) return;
    this.stepElapsed += dt;
    if (this.stepElapsed < step.duration) return;

    if (this._waitsForGuide(step) && this.stepElapsed < step.duration * 2) {
      if (this.ports.guideSettled && !this.ports.guideSettled()) return;
    }
    this._advance();
  }

  /** A step whose next composition depends on the guide having got there. */
  _waitsForGuide(step) {
    return step.shotIntent === SHOT_INTENT.LEAD && Boolean(step.guide);
  }

  _advance() {
    const previous = this.currentStep;
    if (previous) this.bus.emit(EVENTS.SHOT_COMPLETED, { stepId: previous.id });

    this.index += 1;
    this.stepElapsed = 0;

    if (this.index >= this.steps.length) {
      this.transport = TRANSPORT.COMPLETED;
      this.bus.emit(EVENTS.ROUTE_COMPLETED, { routeId: this.routeId });
      // Finishing is an explicit choice to leave the visitor where the tour ended.
      this.exit({ restorePose: false, reason: 'completed' });
      return;
    }

    const step = this.steps[this.index];
    this.state.setRoute(this.routeId, step.id);
    this.bus.emit(EVENTS.ROUTE_STEP, {
      routeId: this.routeId,
      stepId: step.id,
      index: this.index,
      total: this.steps.length,
      caption: step.caption
    });

    // A step may change the world — enter a space, focus a work — and it does so
    // through the same Action vocabulary an Explore hotspot would use.
    let pending = null;
    if (step.action) {
      pending = this.ports.dispatch(step.action, { source: 'EXPERIENCE', sourceId: step.id });
    } else if (step.subjectRef && this.store.kindOf(step.subjectRef) === 'ENTITY') {
      // A shot about a work is also a focus of that work: Guided and Explore
      // leave the same trace in World State.
      this.ports.dispatch(
        { type: ACTION.FOCUS_ENTITY, target: step.subjectRef, params: { camera: false } },
        { source: 'EXPERIENCE', sourceId: step.id }
      );
    }

    // Entering a Space is asynchronous — it may have to build and warm. The shot
    // cannot be framed against geometry that does not exist yet, so a step whose
    // action returns a promise waits for it.
    if (pending && typeof pending.then === 'function') {
      // Kept on the instance so a seek can await exactly this beat's work instead
      // of guessing at it with a timer.
      this._pendingStep = pending.then(() => this._applyShot(step)).catch((error) => {
        this.bus.emit(EVENTS.ASSET_ERROR, { stepId: step.id, message: String(error?.message || error) });
      });
    } else {
      this._pendingStep = null;
      this._applyShot(step);
    }
  }

  _applyShot(step) {
    // The visitor may have skipped or exited while a Space was loading.
    if (this.currentStep?.id !== step.id) return;

    // A step may be accompanied. The guide is staged before the shot is
    // measured, because the composition is derived from where the guide stands
    // — and dismissed on any step that does not ask for one, so a guide never
    // lingers into a beat that was authored without them.
    this.ports.stageGuide?.(step.guide ? { ...step.guide, subjectRef: step.guide.subjectRef || step.subjectRef } : null);
    // The visitor figure is authored exactly like the guide and dismissed on any
    // beat that does not ask for one — which is what keeps Beat D empty of people
    // without a special case for it.
    this.ports.stageVisitor?.(step.visitor ? { ...step.visitor, subjectRef: step.visitor.subjectRef || step.subjectRef } : null);

    const pose = step.subjectRef
      ? this.ports.framingFor(step.subjectRef, step.shotIntent, {
        guideAnchorId: step.guide?.anchorId,
        visitorAnchorId: step.visitor?.anchorId
      })
      : null;
    if (pose) {
      // WHY: the family comes from what this move means. HOW: its shape. WHERE:
      // the Scene Kit says whether the straight line is walkable and, if not,
      // hands back a point to bend it through. It is never asked what the move is.
      const family = this._transitionFamily(this.steps[this.index - 1] || null, step);
      const shape = family ? TRANSITION_SHAPE[family] : null;
      const previousPose = this.ports.currentPose?.();

      let travelMs = travelForIntent(step.shotIntent, step.duration);
      if (shape && previousPose) {
        // Distance sets duration; the family sets the character. A lead is the
        // exception: its travel is the guide's walk, and the two must still arrive
        // together.
        if (shape.speed && step.shotIntent !== SHOT_INTENT.LEAD) {
          const d = Math.hypot(
            pose.position[0] - previousPose.position[0],
            pose.position[2] - previousPose.position[2]
          );
          travelMs = Math.min(Math.max((d / shape.speed) * 1000, shape.min), shape.max);
        } else if (!shape.speed) {
          travelMs = Math.min(Math.max(travelMs, shape.min), shape.max);
        }
      }

      let via = null;
      if (shape?.waypoint && previousPose) {
        via = this.ports.pathWaypoint?.(previousPose.position, pose.position, {
          family, subjectRef: step.subjectRef
        }) || null;
      }

      this.bus.emit(EVENTS.SHOT_STARTED, { stepId: step.id, intent: step.shotIntent, transition: family });
      if (step.shotIntent === SHOT_INTENT.PORTAL || travelMs === 0) this.ports.snapTo(pose);
      else {
        this.ports.playShot(pose, {
          travelMs,
          flat: shape?.flat ?? 0,
          lead: shape?.lead ?? 0,
          holdHeight: shape?.holdHeight ?? false,
          via
        });
      }
      this._lastTransition = family;
    }

    if (step.narrationCue) {
      this.bus.emit(EVENTS.NARRATION_CUE, { cue: step.narrationCue, caption: step.caption, stepId: step.id });
    }
    if (step.audioCue) {
      this.bus.emit(EVENTS.AUDIO_CUE, { cue: step.audioCue, stepId: step.id });
    }
  }

  report() {
    return {
      transport: this.transport,
      routeId: this.routeId,
      stepId: this.currentStep?.id || null,
      index: this.index,
      total: this.steps.length,
      progress: Number(this.progress.toFixed(3)),
      tourStepId: this.currentTourStep?.id || null,
      tourOrder: this.tourOrder,
      tourTotal: this.tourTotal
    };
  }
}

/**
 * Travel time in milliseconds, derived from the shot's intent and the step's own
 * duration — a detail shot arrives quickly and dwells, an overview drifts.
 * The camera never spends the whole step travelling.
 */
/**
 * Transition families.
 *
 * The family expresses what the move *means*, so it is chosen from the relationship
 * between two beats — same subject, an inspection of a free-standing piece, a
 * destination threshold — and not from how far apart they happen to be. Geometry
 * then decides how that intent is executed: duration, curve, waypoint.
 *
 * Distance is evidence and tie-breaker, never the meaning. A short hop between two
 * zones is still a traverse.
 */
export const TRANSITION = Object.freeze({
  MICRO: 'T1_MICRO_REFRAMING',
  LOCAL: 'T2_LOCAL_WALK',
  TRAVERSE: 'T3_GALLERY_TRAVERSE',
  ORBIT: 'T4_OBJECT_ORBIT',
  THRESHOLD: 'T5_THRESHOLD_APPROACH'
});

/** Shaping per family. Distance scales duration; these set the character. */
const TRANSITION_SHAPE = {
  [TRANSITION.MICRO]: { flat: 0.0, lead: 0.0, holdHeight: false, waypoint: false, speed: null, min: 420, max: 1400 },
  [TRANSITION.LOCAL]: { flat: 0.45, lead: 0.18, holdHeight: false, waypoint: true, speed: 1.4, min: 900, max: 3200 },
  [TRANSITION.TRAVERSE]: { flat: 0.7, lead: 0.4, holdHeight: true, waypoint: true, speed: 1.6, min: 1600, max: 5200 },
  [TRANSITION.ORBIT]: { flat: 0.35, lead: 0.0, holdHeight: false, waypoint: true, speed: 1.1, min: 1100, max: 3000 },
  [TRANSITION.THRESHOLD]: { flat: 0.55, lead: 0.5, holdHeight: true, waypoint: true, speed: 1.4, min: 1400, max: 4200 }
};

function travelForIntent(intent, duration) {
  const seconds = Math.max(duration || 4, 1);
  switch (intent) {
    case SHOT_INTENT.PORTAL: return 0;
    case SHOT_INTENT.DETAIL: return Math.min(seconds * 450, 1800);
    case SHOT_INTENT.FOCUS: return Math.min(seconds * 550, 2600);
    // Slower than a focus move and never hurried: this shot is the moment the
    // visitor is walked up to something, and it should feel like being walked.
    case SHOT_INTENT.ACCOMPANIED: return Math.min(seconds * 700, 3400);
    // A lead is a walk. Its duration is the walk's duration, so the camera and
    // the guide arrive together instead of one waiting for the other.
    case SHOT_INTENT.LEAD: return Math.min(seconds * 950, 7000);
    // Contemplation should arrive slowly and then hold still.
    case SHOT_INTENT.CONTEMPLATION: return Math.min(seconds * 620, 3000);
    case SHOT_INTENT.ENTRY:
    case SHOT_INTENT.OVERVIEW: return Math.min(seconds * 600, 3200);
    default: return Math.min(seconds * 500, 2400);
  }
}
