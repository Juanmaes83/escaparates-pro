/**
 * Character 2027 — third-person Explore camera.
 *
 * One CameraController inside the existing Museum CameraAuthority. This owns no
 * renderer/camera/world state. It observes a plain-number Character target and
 * chooses a comfortable camera pose that stays behind the body, inside the
 * active navigation volume and clear of authored blockers.
 *
 * Camera-comfort behaviour is recovered from the frozen
 * PropertyRoomCharacterFreeMobility donor, adapted to Museum-side contracts.
 */

const DEFAULT_DISTANCE = 3.65;
const DEFAULT_HEIGHT = 2.15;
const DEFAULT_TARGET_HEIGHT = 1.02;
const DEFAULT_FOV = 52;
const CAMERA_MARGIN = 0.28;
const CAMERA_CLEARANCE = 0.24;
const CAMERA_MIN_COMFORT_DISTANCE = 2.65;
const CAMERA_POSITION_DEAD_ZONE = 0.18;
const CAMERA_TARGET_DEAD_ZONE = 0.08;
const CAMERA_LERP_RATE = 7.2;
const MIN_BEHIND_PROJECTION = 0.35;

const DISTANCES = Object.freeze([4.2, 3.65, 3.15, 2.75]);
const LATERALS = Object.freeze([0, 1.05, -1.05, 1.65, -1.65, 2.1, -2.1]);
const HEIGHTS = Object.freeze([2.15, 2.4, 1.95]);

export class ThirdPersonExploreController {
  constructor({ distance = DEFAULT_DISTANCE, height = DEFAULT_HEIGHT, targetHeight = DEFAULT_TARGET_HEIGHT, fov = DEFAULT_FOV } = {}) {
    this.distance = distance;
    this.height = height;
    this.targetHeight = targetHeight;
    this.fov = fov;
    this._provider = null;
    this._volume = null;
    this._position = null;
    this._target = null;
    this._lastSafe = null;
    this._diag = {
      slot: 'INIT',
      distance: 0,
      occlusionFallbacks: 0,
      comfortHolds: 0,
      behindGuardSnaps: 0
    };
  }

  setTargetProvider(provider) {
    this._provider = typeof provider === 'function' ? provider : null;
  }

  setNavigationVolume(volume) {
    this._volume = volume || null;
    this._lastSafe = null;
  }

  onGain(pose) {
    this._position = pose?.position ? [...pose.position] : null;
    this._target = pose?.target ? [...pose.target] : null;
  }

  onLose() {}

  update(dt, commit, incomingPose) {
    const target = this._provider?.();
    if (!target?.position) {
      commit(incomingPose);
      return;
    }

    const human = target.position;
    const yaw = Number(target.yaw) || 0;
    const forward = [Math.sin(yaw), 0, Math.cos(yaw)];
    const right = [forward[2], 0, -forward[0]];
    const desiredTarget = [human[0], human[1] + this.targetHeight, human[2]];
    const chosen = this._chooseCameraPosition(human, desiredTarget, forward, right);

    if (!this._position) this._position = [...chosen];
    if (!this._target) this._target = [...desiredTarget];

    const frameDt = Math.max(0.001, Number(dt) || 0.001);
    const alpha = 1 - Math.exp(-frameDt * CAMERA_LERP_RATE);

    if (distance3(this._position, chosen) > CAMERA_POSITION_DEAD_ZONE) {
      lerp3InPlace(this._position, chosen, alpha);
    }
    if (distance3(this._target, desiredTarget) > CAMERA_TARGET_DEAD_ZONE) {
      lerp3InPlace(this._target, desiredTarget, Math.min(1, alpha * 1.15));
    }

    // A straight interpolation between two valid rear positions can cut across
    // the body's front during a fast 180-degree turn. Never allow that transient:
    // if the smoothed pose reaches the front hemisphere, snap to the selected
    // safe rear candidate instead of showing the Character's face while walking.
    if (!isBehind(this._position, desiredTarget, forward, MIN_BEHIND_PROJECTION)) {
      this._position = [...chosen];
      this._diag.behindGuardSnaps += 1;
    }

    this._diag.distance = distance3(this._position, desiredTarget);
    commit({ position: [...this._position], target: [...this._target], fov: this.fov });
  }

  report() {
    return {
      ...this._diag,
      position: this._position ? [...this._position] : null,
      target: this._target ? [...this._target] : null,
      minComfortDistance: CAMERA_MIN_COMFORT_DISTANCE
    };
  }

  _chooseCameraPosition(human, cameraTarget, forward, right) {
    const distances = uniqueFirst(this.distance, DISTANCES);
    const heights = uniqueFirst(this.height, HEIGHTS);

    for (const distance of distances) {
      for (const lateral of LATERALS) {
        for (const height of heights) {
          const candidate = [
            human[0] - forward[0] * distance + right[0] * lateral,
            human[1] + height,
            human[2] - forward[2] * distance + right[2] * lateral
          ];
          this._clampToRoom(candidate);
          if (!this._candidateComfortable(candidate, cameraTarget, forward)) continue;
          this._lastSafe = [...candidate];
          this._diag.slot = `D${distance.toFixed(2)} L${lateral.toFixed(2)} H${height.toFixed(2)}`;
          return candidate;
        }
      }
    }

    this._diag.occlusionFallbacks += 1;
    if (this._lastSafe && this._candidateComfortable(this._lastSafe, cameraTarget, forward)) {
      this._diag.comfortHolds += 1;
      this._diag.slot = 'HOLD_LAST_SAFE';
      return [...this._lastSafe];
    }

    // Emergency high shoulder. It remains behind the body and is still tested
    // against Museum bounds/blockers before use.
    const emergency = [
      human[0] - forward[0] * 2.8 + right[0] * 1.25,
      human[1] + 2.55,
      human[2] - forward[2] * 2.8 + right[2] * 1.25
    ];
    this._clampToRoom(emergency);
    if (this._candidateComfortable(emergency, cameraTarget, forward)) {
      this._lastSafe = [...emergency];
      this._diag.slot = 'EMERGENCY_HIGH_SHOULDER';
      return emergency;
    }

    // Last resort: never jump through the body. Keep the previous camera pose if
    // available; otherwise use a clamped rear point.
    this._diag.comfortHolds += 1;
    this._diag.slot = 'HOLD_PREVIOUS';
    if (this._position) return [...this._position];
    const fallback = [
      human[0] - forward[0] * this.distance,
      human[1] + this.height,
      human[2] - forward[2] * this.distance
    ];
    this._clampToRoom(fallback);
    return fallback;
  }

  _candidateComfortable(candidate, target, forward) {
    if (!this._insideBounds(candidate)) return false;
    if (!isBehind(candidate, target, forward, MIN_BEHIND_PROJECTION)) return false;
    if (distance3(candidate, target) < CAMERA_MIN_COMFORT_DISTANCE) return false;
    if (this._pointInsideAnyBlocker(candidate, CAMERA_CLEARANCE)) return false;
    return this._segmentClear(target, candidate);
  }

  _segmentClear(from, to) {
    for (let i = 3; i <= 16; i += 1) {
      const t = i / 16;
      const probe = [
        from[0] + (to[0] - from[0]) * t,
        from[1] + (to[1] - from[1]) * t,
        from[2] + (to[2] - from[2]) * t
      ];
      if (!this._insideBounds(probe)) return false;
      if (this._pointInsideAnyBlocker(probe, CAMERA_CLEARANCE)) return false;
    }
    return true;
  }

  _pointInsideAnyBlocker(point, padding = 0) {
    return (this._volume?.blockers || []).some((blocker) => pointInsideBlocker(point, blocker, padding));
  }

  _insideBounds(point) {
    const bounds = this._volume?.bounds;
    if (!bounds?.min || !bounds?.max) return true;
    return point[0] >= bounds.min[0] + CAMERA_MARGIN
      && point[0] <= bounds.max[0] - CAMERA_MARGIN
      && point[2] >= bounds.min[2] + CAMERA_MARGIN
      && point[2] <= bounds.max[2] - CAMERA_MARGIN
      && point[1] >= bounds.min[1] + 1.25
      && point[1] <= bounds.max[1] - 0.2;
  }

  _clampToRoom(point) {
    const bounds = this._volume?.bounds;
    if (!bounds?.min || !bounds?.max) return;
    point[0] = clamp(point[0], bounds.min[0] + CAMERA_MARGIN, bounds.max[0] - CAMERA_MARGIN);
    point[2] = clamp(point[2], bounds.min[2] + CAMERA_MARGIN, bounds.max[2] - CAMERA_MARGIN);
    point[1] = clamp(point[1], bounds.min[1] + 1.25, bounds.max[1] - 0.2);
  }
}

function pointInsideBlocker(point, blocker, padding = 0) {
  if (!blocker?.min || !blocker?.max) return false;
  const minY = Number.isFinite(blocker.min[1]) ? blocker.min[1] - padding : -Infinity;
  const maxY = Number.isFinite(blocker.max[1]) ? blocker.max[1] + padding : Infinity;
  return point[0] >= blocker.min[0] - padding && point[0] <= blocker.max[0] + padding
    && point[1] >= minY && point[1] <= maxY
    && point[2] >= blocker.min[2] - padding && point[2] <= blocker.max[2] + padding;
}

function isBehind(camera, target, forward, minProjection) {
  const rx = camera[0] - target[0];
  const rz = camera[2] - target[2];
  return rx * forward[0] + rz * forward[2] <= -minProjection;
}

function uniqueFirst(primary, values) {
  const out = [primary];
  for (const value of values) if (!out.some((x) => Math.abs(x - value) < 0.001)) out.push(value);
  return out;
}

function lerp3InPlace(current, target, alpha) {
  for (let i = 0; i < 3; i += 1) current[i] += (target[i] - current[i]) * alpha;
}

function distance3(a, b) {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
