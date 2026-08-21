/**
 * Wire the Option E1 host into the running Museum.
 *
 * The host knows how to hand presentation to a guest and take it back. The
 * guest knows how to run Breeze. Neither of them knows *when* — that is a
 * property of the world, and this is the only piece that reads it:
 *
 *   a Space whose `metadata.nestedRuntime` names a registered runtime is
 *   presented by that runtime while the visitor is inside it.
 *
 * Everything else follows from the Museum's own events. Entering the Space
 * activates the guest; leaving it disposes the guest; every frame in between,
 * the Museum's camera pose is pushed across. There is no second route, no
 * second Director, no second HUD, and nothing in the guest can call back into
 * any of them.
 *
 * WHY THE POSE IS TRANSLATED HERE
 *
 * The Museum authors the Breeze room at `metadata.roomOrigin`, and the
 * installation is built around its own origin — Venus at (0,0,0), the cloth
 * released at x = −10. Rather than re-authoring the artwork into Museum
 * coordinates, or asking the Director to know about a guest's axes, the
 * translation happens once, on the way in, in one function. A guest never sees
 * Museum coordinates and the Museum never sees the guest's.
 *
 * ACTIVATION IS SLOW AND THAT IS HANDLED, NOT HIDDEN
 *
 * Acquiring a WebGPU device, loading a 5 MB sculpture and compiling the compute
 * pipeline takes seconds. The host keeps the Museum presenting until the guest
 * is ready, so the wait looks like the room still being there rather than like a
 * black screen. If the guest cannot start at all — no WebGPU, a device refused —
 * the Museum simply keeps presenting and the visitor gets the room without the
 * installation, which is a poorer room but still a room.
 */

import { NestedRoomHost } from './nested-room-host.js';
import { BreezeGuest } from './breeze/breeze-guest.js';
import { LivingArtGuest } from './living-art/living-art-guest.js';

export class NestedRoomController {
  /**
   * @param {object} deps
   * @param {object} deps.runtime      the Museum runtime
   * @param {HTMLElement} deps.stage
   * @param {HTMLCanvasElement} deps.museumCanvas
   */
  constructor({ runtime, stage, museumCanvas }) {
    this.runtime = runtime;
    this.host = new NestedRoomHost({
      stage,
      museumCanvas,
      pauseMuseum: () => { this._museumPaused = true; },
      resumeMuseum: () => { this._museumPaused = false; }
    });
    this._museumPaused = false;
    this._roomOrigin = [0, 0, 0];
    this._activating = null;
    this.lastError = null;
    this.stats = { entered: 0, left: 0, failed: 0 };

    this.host.register('room.breeze', () => new BreezeGuest());
    this.host.register('room.living-art', () => new LivingArtGuest());
  }

  get isPresenting() { return this.host.isGuestActive; }

  /** The runtime for a Space, if the world says it has one. */
  _runtimeIdFor(spaceId) {
    try {
      return this.runtime.store.require(spaceId)?.metadata?.nestedRuntime || null;
    } catch { return null; }
  }

  _originFor(spaceId) {
    try {
      return this.runtime.store.require(spaceId)?.metadata?.roomOrigin || [0, 0, 0];
    } catch { return [0, 0, 0]; }
  }

  /** Museum-space pose → installation-space pose. The only conversion there is. */
  _translate(pose) {
    const [ox, oy, oz] = this._roomOrigin;
    return {
      position: [pose.position[0] - ox, pose.position[1] - oy, pose.position[2] - oz],
      target: [pose.target[0] - ox, pose.target[1] - oy, pose.target[2] - oz],
      fov: pose.fov
    };
  }

  /**
   * Follow the visitor between rooms.
   *
   * Bound to SPACE_ENTERED rather than to the route, so the room behaves the
   * same whether a Tour Stop brought the visitor in, a Back brought them in, or
   * they walked through the door themselves in Explore.
   */
  listen(bus, EVENTS) {
    bus.on(EVENTS.SPACE_ENTERED, ({ spaceId }) => {
      const runtimeId = this._runtimeIdFor(spaceId);
      if (runtimeId) this._enter(spaceId, runtimeId);
      else if (this.host.isGuestActive) this._leave();
    });
    return this;
  }

  async _enter(spaceId, runtimeId) {
    if (this.host.isGuestActive || this._activating) return false;
    this._roomOrigin = this._originFor(spaceId);
    const pose = this._translate(this.runtime.camera.pose);
    this._activating = this.host.activate(runtimeId, { pose })
      .then(() => { this.stats.entered += 1; })
      .catch((e) => {
        // A room that cannot start its runtime is still a room. The Museum keeps
        // presenting and the visitor loses the installation, not the museum.
        this.lastError = String(e?.message || e);
        this.stats.failed += 1;
        return this.host.dispose().catch(() => {});
      })
      .finally(() => { this._activating = null; });
    return this._activating;
  }

  async _leave() {
    await this._activating?.catch(() => {});
    await this.host.dispose();
    this.stats.left += 1;
    return true;
  }

  /**
   * One frame of the Museum's loop.
   *
   * Returns true when the guest is presenting, which is the caller's signal to
   * skip drawing the Museum — exactly one presentation is authoritative, and
   * this is where that is decided rather than hoped for.
   */
  frame(pose) {
    if (!this.host.isGuestActive) return false;
    this.host.setCameraPose(this._translate(pose));
    return true;
  }

  report() {
    return {
      ...this.host.report(),
      roomOrigin: this._roomOrigin,
      museumPaused: this._museumPaused,
      lastError: this.lastError,
      guest: this.host._guest?.report?.() ?? null,
      ...this.stats
    };
  }

  async dispose() {
    await this._leave().catch(() => {});
  }
}
