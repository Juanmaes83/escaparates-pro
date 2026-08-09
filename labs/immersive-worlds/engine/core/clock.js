/**
 * Immersive Worlds — Clock
 *
 * One time source for the whole runtime. Subsystems never read performance.now()
 * themselves, so a deterministic QA run can drive time by hand
 * (IW-0 Constitution §17 — "global experience time source").
 */

export class Clock {
  constructor({ maxDelta = 0.1 } = {}) {
    this.elapsed = 0;
    this.delta = 0;
    this.frame = 0;
    this.maxDelta = maxDelta; // guards against tab-switch time jumps
    this._last = null;
    this._manual = false;
  }

  /** Drive from wall clock. @param {number} now milliseconds */
  tick(now) {
    if (this._manual) return this.delta;
    if (this._last === null) this._last = now;
    const raw = (now - this._last) / 1000;
    this._last = now;
    this.delta = Math.min(Math.max(raw, 0), this.maxDelta);
    this.elapsed += this.delta;
    this.frame += 1;
    return this.delta;
  }

  /** Deterministic mode: QA advances time in fixed steps. */
  useManualTime(enabled = true) {
    this._manual = enabled;
  }

  /** @param {number} dt seconds */
  advance(dt) {
    this.delta = dt;
    this.elapsed += dt;
    this.frame += 1;
    return dt;
  }

  reset() {
    this.elapsed = 0;
    this.delta = 0;
    this.frame = 0;
    this._last = null;
  }
}
