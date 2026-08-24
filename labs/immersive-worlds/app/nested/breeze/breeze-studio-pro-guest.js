/**
 * Breeze Studio PRO V4.1 — full-room nested guest.
 *
 * The Museum owns the WorldGraph and room lifecycle. Breeze Studio PRO owns
 * everything inside the specialised room: WebGPU, cloth, backgrounds, object
 * replacement and experience effects. The approved V4.1 build is presented as
 * one bounded guest; it does not create a second Museum route or camera.
 *
 * Human-gate donor is pinned to the immutable Vercel deployment for the
 * approved feature/breeze-studio-pro commit c86cd3e20d6f981c75f1e39d395c794ad104d802.
 * After the integrated room receives HUMAN PASS we can vendor the exact build
 * into the Museum line without changing this contract.
 */

export const BREEZE_STUDIO_PRO_V41_URL =
  'https://escaparates-gm7k9nc5h-juanma-espinosas-projects.vercel.app/labs/website-modules-source/breeze-studio-pro/index.html';

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

    // NestedRoomHost creates a canvas for ordinary rendering guests. Studio PRO
    // is a complete bounded app, so the canvas becomes only a lifecycle token.
    canvas.style.display = 'none';

    const iframe = document.createElement('iframe');
    iframe.dataset.nestedRoomStudio = 'room.breeze';
    iframe.title = 'Sala Breeze — Breeze Studio PRO V4.1';
    iframe.src = BREEZE_STUDIO_PRO_V41_URL;
    iframe.allow = 'autoplay; fullscreen';
    iframe.setAttribute('allowfullscreen', '');
    Object.assign(iframe.style, {
      position: 'absolute',
      inset: '0',
      width: '100%',
      height: '100%',
      border: '0',
      display: 'block',
      zIndex: '5',
      background: '#000',
      pointerEvents: 'auto'
    });
    stage.appendChild(iframe);
    this.iframe = iframe;

    // Do not hang Museum activation forever if the guest is slow. The original
    // E1 contract keeps Museum visible until prepare resolves, then hands over.
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

  async activate() {
    return true;
  }

  setCameraPose(pose) {
    // Studio PRO V4.1 keeps its approved internal presentation. We retain the
    // incoming Museum pose as evidence for the later Character/Avatar seam, but
    // do not force a second camera authority into the guest during this gate.
    this.lastPose = pose ? {
      position: [...pose.position],
      target: [...pose.target],
      fov: pose.fov
    } : null;
  }

  update() {}
  suspend() {}
  restore() {}

  report() {
    return {
      backend: 'webgpu-studio-pro-v4.1',
      loaded: this.loaded,
      error: this.error,
      donorCommit: 'c86cd3e20d6f981c75f1e39d395c794ad104d802',
      donorUrl: BREEZE_STUDIO_PRO_V41_URL,
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
