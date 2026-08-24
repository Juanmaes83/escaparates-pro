/**
 * Breeze Studio PRO V4.1 — full-room nested guest.
 *
 * Phase 1 recovery gate: Museum owns WorldGraph/lifecycle, while the specialised
 * room runs the exact frozen Breeze Studio PRO donor from c86cd3e. No Museum
 * bridge, state synchronisation, skin injection or authoring interception is
 * installed here. The only purpose of this guest is to mount/unmount the donor
 * intact so its original controls can be human-tested inside Museum.
 */

export const BREEZE_STUDIO_PRO_V41_URL =
  '/labs/website-modules-source/breeze-studio-pro/index.html';

export class BreezeStudioProGuest {
  constructor() {
    this.iframe = null;
    this.canvas = null;
    this.lastPose = null;
    this.loaded = false;
    this.error = null;
  }

  async prepare({ canvas }) {
    this.canvas = canvas;
    const stage = canvas?.parentElement;
    if (!stage) throw new Error('Breeze Studio PRO guest requires a Museum stage');
    canvas.style.display = 'none';

    const iframe = document.createElement('iframe');
    iframe.dataset.nestedRoomStudio = 'room.breeze';
    iframe.title = 'Sala Breeze — Breeze Studio PRO V4.1 original';
    iframe.src = BREEZE_STUDIO_PRO_V41_URL;
    iframe.allow = 'autoplay; fullscreen';
    iframe.setAttribute('allowfullscreen', '');
    Object.assign(iframe.style, {
      position: 'absolute', inset: '0', width: '100%', height: '100%', border: '0',
      display: 'block', zIndex: '5', background: '#000', pointerEvents: 'auto'
    });
    stage.appendChild(iframe);
    this.iframe = iframe;

    await new Promise((resolve) => {
      let done = false;
      const finish = (ok, error = null) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        this.loaded = ok;
        this.error = error ? String(error?.message || error) : null;
        resolve();
      };
      iframe.addEventListener('load', () => finish(true), { once: true });
      iframe.addEventListener('error', () => finish(false, new Error('Breeze Studio PRO iframe failed to load')), { once: true });
      const timer = setTimeout(() => finish(true), 12000);
    });
  }

  async activate() { return true; }

  setCameraPose(pose) {
    this.lastPose = pose ? { position: [...pose.position], target: [...pose.target], fov: pose.fov } : null;
  }

  update() {}
  suspend() {}
  restore() {}

  report() {
    return {
      backend: 'webgpu-studio-pro-v4.1-original',
      loaded: this.loaded,
      error: this.error,
      donorCommit: 'c86cd3e20d6f981c75f1e39d395c794ad104d802',
      donorUrl: BREEZE_STUDIO_PRO_V41_URL,
      bridge: false,
      hasIframe: Boolean(this.iframe?.isConnected),
      hasMuseumPose: Boolean(this.lastPose)
    };
  }

  async dispose() {
    if (this.iframe?.parentNode) this.iframe.parentNode.removeChild(this.iframe);
    this.iframe = null;
    if (this.canvas) this.canvas.style.display = '';
    this.canvas = null;
    this.loaded = false;
    this.lastPose = null;
  }
}
