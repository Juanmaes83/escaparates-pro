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
 *
 * Phase 4A final polish adds a strict camera-distance envelope so the Character
 * cannot become visually tiny or fill/leave the frame, and expires stale safe
 * camera poses after meaningful Character translation/rotation.
 */

const DEFAULT_DISTANCE = 3.25;
const DEFAULT_HEIGHT = 2.05;
const DEFAULT_TARGET_HEIGHT = 1.02;
const DEFAULT_FOV = 52;
const CAMERA_MARGIN = 0.28;
const CAMERA_CLEARANCE = 0.24;
const CAMERA_MIN_DISTANCE = 2.75;
const CAMERA_MAX_DISTANCE = 3.72;
const CAMERA_TARGET_DISTANCE = 3.25;
const CAMERA_POSITION_DEAD_ZONE = 0.12;
const CAMERA_TARGET_DEAD_ZONE = 0.06;
const CAMERA_LERP_RATE = 8.0;
const MIN_BEHIND_PROJECTION = 0.35;
const LAST_SAFE_MAX_CHARACTER_TRAVEL = 1.15;
const LAST_SAFE_MAX_YAW_DELTA = Math.PI / 3;

const DISTANCES = Object.freeze([3.25, 3.5, 3.0, 2.82, 3.65]);
const LATERALS = Object.freeze([0, 0.72, -0.72, 1.05, -1.05, 1.35, -1.35]);
const HEIGHTS = Object.freeze([2.05, 2.22, 1.92]);

export class ThirdPersonExploreController {
  constructor({ distance = DEFAULT_DISTANCE, height = DEFAULT_HEIGHT, targetHeight = DEFAULT_TARGET_HEIGHT, fov = DEFAULT_FOV } = {}) {
    this.distance = clamp(distance, CAMERA_MIN_DISTANCE, CAMERA_MAX_DISTANCE);
    this.height = height;
    this.targetHeight = targetHeight;
    this.fov = fov;
    this._provider = null;
    this._volume = null;
    this._position = null;
    this._target = null;
    this._lastSafe = null;
    this._lastSafeCharacter = null;
    this._lastSafeYaw = null;
    this._diag = {
      slot: 'INIT',
      distance: 0,
      occlusionFallbacks: 0,
      comfortHolds: 0,
      behindGuardSnaps: 0,
      distanceGuardPullIns: 0,
      distanceGuardPushOuts: 0,
      staleSafeInvalidations: 0
    };
  }

  setTargetProvider(provider) {
    this._provider = typeof provider === 'function' ? provider : null;
  }

  setNavigationVolume(volume) {
    this._volume = volume || null;
    this._invalidateLastSafe();
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

    this._expireStaleLastSafe(human, yaw);
    const chosen = this._chooseCameraPosition(human, desiredTarget, forward, right, yaw);

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

    // Never interpolate through the Character's front hemisphere during a fast
    // direction change. This prevents the walking avatar from suddenly facing
    // the viewer because the camera crossed in front of the body.
    if (!isBehind(this._position, desiredTarget, forward, MIN_BEHIND_PROJECTION)) {
      this._position = [...chosen];
      this._diag.behindGuardSnaps += 1;
    }

    // Final visual-size guard. Candidate search already respects the envelope,
    // but smoothing/holds can transiently move outside it. Pull in if the avatar
    // becomes too small; push out if it becomes too large or risks clipping.
    this._enforceDistanceEnvelope(this._position, desiredTarget, forward, right);

    this._diag.distance = distance3(this._position, desiredTarget);
    commit({ position: [...this._position], target: [...this._target], fov: this.fov });
  }

  report() {
    return {
      ...this._diag,
      position: this._position ? [...this._position] : null,
      target: this._target ? [...this._target] : null,
      targetDistance: CAMERA_TARGET_DISTANCE,
      minDistance: CAMERA_MIN_DISTANCE,
      maxDistance: CAMERA_MAX_DISTANCE
    };
  }

  _chooseCameraPosition(human, cameraTarget, forward, right, yaw) {
    const distances = uniqueFirst(this.distance, DISTANCES)
      .map((d) => clamp(d, CAMERA_MIN_DISTANCE, CAMERA_MAX_DISTANCE));
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
          this._rememberLastSafe(candidate, human, yaw);
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

    // Emergency high shoulder, still constrained by the same min/max envelope.
    const emergency = [
      human[0] - forward[0] * 2.9 + right[0] * 0.9,
      human[1] + 2.35,
      human[2] - forward[2] * 2.9 + right[2] * 0.9
    ];
    this._clampToRoom(emergency);
    if (this._candidateComfortable(emergency, cameraTarget, forward)) {
      this._rememberLastSafe(emergency, human, yaw);
      this._diag.slot = 'EMERGENCY_HIGH_SHOULDER';
      return emergency;
    }

    // Last resort: construct a fresh rear pose around the current Character;
    // never keep an arbitrarily distant previous pose.
    this._diag.comfortHolds += 1;
    this._diag.slot = 'FRESH_REAR_FALLBACK';
    const fallback = [
      human[0] - forward[0] * CAMERA_TARGET_DISTANCE,
      human[1] + this.height,
      human[2] - forward[2] * CAMERA_TARGET_DISTANCE
    ];
    this._clampToRoom(fallback);
    return fallback;
  }

  _candidateComfortable(candidate, target, forward) {
    if (!this._insideBounds(candidate)) return false;
    if (!isBehind(candidate, target, forward, MIN_BEHIND_PROJECTION)) return false;
    const distance = distance3(candidate, target);
    if (distance < CAMERA_MIN_DISTANCE || distance > CAMERA_MAX_DISTANCE) return false;
    if (this._pointInsideAnyBlocker(candidate, CAMERA_CLEARANCE)) return false;
    return this._segmentClear(target, candidate);
  }

  _enforceDistanceEnvelope(point, target, forward, right) {
    const distance = distance3(point, target);
    if (distance >= CAMERA_MIN_DISTANCE && distance <= CAMERA_MAX_DISTANCE) return;

    const desiredDistance = distance > CAMERA_MAX_DISTANCE ? CAMERA_TARGET_DISTANCE : CAMERA_MIN_DISTANCE + 0.15;
    if (distance > CAMERA_MAX_DISTANCE) this._diag.distanceGuardPullIns += 1;
    else this._diag.distanceGuardPushOuts += 1;

    const lateralProjection = (point[0] - target[0]) * right[0] + (point[2] - target[2]) * right[2];
    const lateral = clamp(lateralProjection, -0.85, 0.85);
    const height = clamp(point[1] - target[1] + this.targetHeight, 1.9, 2.25);
    const corrected = [
      target[0] - forward[0] * desiredDistance + right[0] * lateral,
      target[1] - this.targetHeight + height,
      target[2] - forward[2] * desiredDistance + right[2] * lateral
    ];
    this._clampToRoom(corrected);

    // Only adopt the correction if it remains a valid rear/clear pose. Otherwise
    // use the current frame's selected safe candidate on the next update.
    if (this._candidateComfortable(corrected, target, forward)) {
      point[0] = corrected[0];
      point[1] = corrected[1];
      point[2] = corrected[2];
    }
  }

  _expireStaleLastSafe(human, yaw) {
    if (!this._lastSafe || !this._lastSafeCharacter || this._lastSafeYaw == null) return;
    const travel = horizontalDistance(this._lastSafeCharacter, human);
    const yawDelta = angleDelta(this._lastSafeYaw, yaw);
    if (travel > LAST_SAFE_MAX_CHARACTER_TRAVEL || yawDelta > LAST_SAFE_MAX_YAW_DELTA) {
      this._invalidateLastSafe();
      this._diag.staleSafeInvalidations += 1;
    }
  }

  _rememberLastSafe(candidate, human, yaw) {
    this._lastSafe = [...candidate];
    this._lastSafeCharacter = [...human];
    this._lastSafeYaw = yaw;
  }

  _invalidateLastSafe() {
    this._lastSafe = null;
    this._lastSafeCharacter = null;
    this._lastSafeYaw = null;
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

function horizontalDistance(a, b) {
  return Math.hypot(a[0] - b[0], a[2] - b[2]);
}

function angleDelta(a, b) {
  return Math.abs(Math.atan2(Math.sin(b - a), Math.cos(b - a)));
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
