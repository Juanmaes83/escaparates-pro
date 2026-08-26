/**
 * Character 2027 — third-person Explore camera.
 *
 * This is a CameraController, not a camera and not a CameraAuthority. It writes
 * only through the one-shot commit supplied by Museum CameraAuthority.
 * Character/body ownership lives elsewhere; this controller only observes a
 * plain-number target provider.
 */

const DEFAULT_DISTANCE = 3.6;
const DEFAULT_HEIGHT = 1.85;
const DEFAULT_TARGET_HEIGHT = 0.98;
const DEFAULT_FOV = 52;
const CAMERA_MARGIN = 0.28;

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
  }

  setTargetProvider(provider) {
    this._provider = typeof provider === 'function' ? provider : null;
  }

  setNavigationVolume(volume) {
    this._volume = volume || null;
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

    const position = target.position;
    const yaw = Number(target.yaw) || 0;
    const forwardX = Math.sin(yaw);
    const forwardZ = Math.cos(yaw);

    const desiredPosition = [
      position[0] - forwardX * this.distance,
      position[1] + this.height,
      position[2] - forwardZ * this.distance
    ];
    const desiredTarget = [position[0], position[1] + this.targetHeight, position[2]];

    this._clampToRoom(desiredPosition);

    if (!this._position) this._position = [...desiredPosition];
    if (!this._target) this._target = [...desiredTarget];
    const alpha = 1 - Math.exp(-Math.max(0.001, dt) * 7.2);
    for (let i = 0; i < 3; i += 1) {
      this._position[i] += (desiredPosition[i] - this._position[i]) * alpha;
      this._target[i] += (desiredTarget[i] - this._target[i]) * Math.min(1, alpha * 1.15);
    }

    commit({ position: [...this._position], target: [...this._target], fov: this.fov });
  }

  _clampToRoom(point) {
    const bounds = this._volume?.bounds;
    if (!bounds?.min || !bounds?.max) return;
    point[0] = clamp(point[0], bounds.min[0] + CAMERA_MARGIN, bounds.max[0] - CAMERA_MARGIN);
    point[2] = clamp(point[2], bounds.min[2] + CAMERA_MARGIN, bounds.max[2] - CAMERA_MARGIN);
    point[1] = Math.max(bounds.min[1] + 1.25, Math.min(point[1], bounds.max[1] - 0.2));
  }
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
