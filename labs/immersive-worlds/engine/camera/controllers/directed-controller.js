/**
 * Immersive Worlds — Directed camera controller
 *
 * The camera while a Guided Experience is running. The Experience Director
 * issues *shots* — a semantic subject plus a framing intent — and this
 * controller moves the camera between them.
 *
 * The Director never touches the camera itself (IW-ADR-007): it asks for a
 * shot, this controller executes it, and the authority still guarantees that
 * only this controller writes while DIRECTED is the owner.
 */

import { easeInOutCubic, vec3 } from '../framing.js';

export class DirectedController {
  constructor(options = {}) {
    this.defaultTravelMs = options.defaultTravelMs ?? 2200;
    this._from = null;
    this._to = null;
    this._elapsed = 0;
    this._duration = 0;
    this._holdPose = null;
    this._reducedMotion = false;
    this.onShotComplete = null;
    this._completed = true;
  }

  setReducedMotion(reduced) {
    this._reducedMotion = reduced;
  }

  onGain(pose) {
    this._holdPose = { position: [...pose.position], target: [...pose.target], fov: pose.fov };
  }

  /**
   * @param {{position:number[], target:number[], fov?:number}} pose
   * @param {{travelMs?:number}} [options]
   */
  playShot(pose, options = {}) {
    const current = this._holdPose || { position: [...pose.position], target: [...pose.target], fov: pose.fov ?? 50 };
    this._from = { position: [...current.position], target: [...current.target], fov: current.fov };
    this._to = { position: [...pose.position], target: [...pose.target], fov: pose.fov ?? current.fov };
    this._duration = (this._reducedMotion ? 0 : (options.travelMs ?? this.defaultTravelMs)) / 1000;
    this._elapsed = 0;
    this._completed = false;
  }

  /** Cut without travel — used for CUT portal behaviour inside a guided sequence. */
  snapTo(pose) {
    this._holdPose = { position: [...pose.position], target: [...pose.target], fov: pose.fov ?? this._holdPose?.fov ?? 50 };
    this._from = null;
    this._to = null;
    this._completed = true;
  }

  get isTravelling() {
    return this._to !== null && !this._completed;
  }

  update(dt, commit, pose) {
    if (!this._holdPose) this._holdPose = { position: [...pose.position], target: [...pose.target], fov: pose.fov };

    if (this._to) {
      this._elapsed += dt;
      const k = this._duration <= 0 ? 1 : Math.min(this._elapsed / this._duration, 1);
      const e = easeInOutCubic(k);
      this._holdPose = {
        position: vec3.lerp(this._from.position, this._to.position, e),
        target: vec3.lerp(this._from.target, this._to.target, e),
        fov: this._from.fov + (this._to.fov - this._from.fov) * e
      };
      if (k >= 1 && !this._completed) {
        this._completed = true;
        this._to = null;
        this._from = null;
        this.onShotComplete?.();
      }
    }

    commit(this._holdPose);
  }

  onLose() {
    this._from = null;
    this._to = null;
  }
}
