/**
 * Breeze Studio PRO V4.1 — full-room nested guest.
 *
 * Phase 1 recovery gate: Museum owns WorldGraph/lifecycle, while the specialised
 * room runs the exact frozen Breeze Studio PRO donor from c86cd3e. No Museum
 * bridge, state synchronisation, skin injection or authoring interception is
 * installed here. The only purpose of this guest is to mount/unmount the donor
 * intact so its original controls can be human-tested inside Museum.
 *
 * IMPORTANT — INTERACTION OWNERSHIP
 * The generic NestedRoomHost was originally designed for pointer-transparent
 * render guests. Breeze Studio PRO is different during this Phase 1 gate: it is
 * a complete interactive authoring application. While the Breeze room is
 * presenting, its iframe must therefore sit above the Museum UI interception
 * plane (#iw-ui is z-index:10) inside the stage and own pointer/focus events.
 * This does NOT create a state bridge; it only restores the donor's native DOM
 * event path so its original controls can actually be exercised.
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
    this.pointerEvents = 0;
    this.focusEvents = 0;
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
    iframe.tabIndex = 0;
    Object.assign(iframe.style, {
      position: 'absolute', inset: '0', width: '100%', height: '100%', border: '0',
      display: 'block',
      // Museum #iw-ui lives at z-index:10 and its direct children are
      // pointer-active. z=12 gives the active Breeze Studio the interaction
      // plane inside the stage without modifying the donor or installing a
      // Museum↔Breeze state bridge.
      zIndex: '12',
      background: '#000',
      pointerEvents: 'auto',
      touchAction: 'auto'
    });

    // Focus the real Breeze browsing context on first interaction. This is
    // deliberately native DOM ownership, not synthetic click forwarding.
    iframe.addEventListener('pointerdown', () => {
      this.pointerEvents += 1;
      try { iframe.focus({ preventScroll: true }); } catch { iframe.focus(); }
    }, true);
    iframe.addEventListener('focus', () => { this.focusEvents += 1; });

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

  async activate() {
    if (this.iframe) {
      this.iframe.style.pointerEvents = 'auto';
      this.iframe.style.zIndex = '12';
    }
    return true;
  }

  setCameraPose(pose) {
    this.lastPose = pose ? { position: [...pose.position], target: [...pose.target], fov: pose.fov } : null;
  }

  update() {}

  suspend() {
    if (this.iframe) this.iframe.style.pointerEvents = 'none';
  }

  restore() {
    if (this.iframe) {
      this.iframe.style.pointerEvents = 'auto';
      this.iframe.style.zIndex = '12';
    }
  }

  report() {
    return {
      backend: 'webgpu-studio-pro-v4.1-original',
      loaded: this.loaded,
      error: this.error,
      donorCommit: 'c86cd3e20d6f981c75f1e39d395c794ad104d802',
      donorUrl: BREEZE_STUDIO_PRO_V41_URL,
      bridge: false,
      interactionMode: 'native-iframe-pointer-focus',
      pointerEvents: this.pointerEvents,
      focusEvents: this.focusEvents,
      iframeZIndex: this.iframe?.style?.zIndex || null,
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
    this.pointerEvents = 0;
    this.focusEvents = 0;
  }
}
