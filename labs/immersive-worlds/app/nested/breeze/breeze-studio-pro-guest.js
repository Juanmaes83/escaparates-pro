/**
 * Breeze Studio PRO V4.1 — full-room nested guest.
 *
 * Phase 1 recovery gate: Museum owns WorldGraph/lifecycle, while the specialised
 * room runs the frozen Breeze Studio PRO V4.1 build. No Museum state bridge is
 * installed in this phase: the purpose is to prove that the donor's own controls
 * remain fully interactive when embedded in the Museum authoring workspace.
 *
 * IMPORTANT — INTERACTION OWNERSHIP
 * The generic Studio shell is a fixed z-index:40 overlay. Its root is pointer
 * transparent, but `.st-body` is made pointer-active by `#st > *`, so an empty,
 * transparent centre cell still sits above a nested guest and intercepts input.
 * Raising an iframe inside #iw-stage cannot escape that higher stacking context.
 *
 * While Breeze presents we therefore release the Studio body's centre input
 * plane and explicitly keep only the actual Museum furniture (rail/tree/editor/
 * validation) interactive. This is the same architectural rule used elsewhere:
 * one visible authoring surface owns input at a time, without synthetic clicks.
 */

export const BREEZE_STUDIO_PRO_V41_URL =
  '/labs/website-modules-source/breeze-studio-pro/index.html';

const STUDIO_INTERACTIVE_SELECTORS = ['.st-rail', '.st-tree', '.st-ed', '.st-val'];

export class BreezeStudioProGuest {
  constructor() {
    this.iframe = null;
    this.canvas = null;
    this.lastPose = null;
    this.loaded = false;
    this.error = null;
    this.pointerEvents = 0;
    this.focusEvents = 0;
    this._studioBody = null;
    this._studioPointerSnapshot = null;
  }

  _releaseStudioCenterInput() {
    const body = document.querySelector('.st-body');
    if (!body) return false;

    if (!this._studioPointerSnapshot) {
      this._studioPointerSnapshot = {
        body,
        bodyPointerEvents: body.style.pointerEvents,
        children: STUDIO_INTERACTIVE_SELECTORS.map((selector) => {
          const el = document.querySelector(selector);
          return { selector, el, pointerEvents: el?.style?.pointerEvents || '' };
        })
      };
    }

    // The transparent workspace grid itself must not be a hit target over the
    // Breeze iframe. Only the concrete Museum furniture remains interactive.
    body.style.pointerEvents = 'none';
    for (const selector of STUDIO_INTERACTIVE_SELECTORS) {
      const el = document.querySelector(selector);
      if (el) el.style.pointerEvents = 'auto';
    }
    this._studioBody = body;
    document.body.dataset.breezeInputOwner = 'guest';
    return true;
  }

  _restoreStudioInput() {
    const snapshot = this._studioPointerSnapshot;
    if (snapshot) {
      snapshot.body.style.pointerEvents = snapshot.bodyPointerEvents;
      for (const item of snapshot.children) {
        if (item.el) item.el.style.pointerEvents = item.pointerEvents;
      }
    }
    this._studioPointerSnapshot = null;
    this._studioBody = null;
    delete document.body.dataset.breezeInputOwner;
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
      display: 'block', zIndex: '12', background: '#000',
      pointerEvents: 'auto', touchAction: 'auto'
    });

    iframe.addEventListener('pointerdown', () => {
      this.pointerEvents += 1;
      try { iframe.focus({ preventScroll: true }); } catch { iframe.focus(); }
    }, true);
    iframe.addEventListener('focus', () => { this.focusEvents += 1; });

    stage.appendChild(iframe);
    this.iframe = iframe;
    this._releaseStudioCenterInput();

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
    this._releaseStudioCenterInput();
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
    this._restoreStudioInput();
  }

  restore() {
    this._releaseStudioCenterInput();
    if (this.iframe) {
      this.iframe.style.pointerEvents = 'auto';
      this.iframe.style.zIndex = '12';
    }
  }

  report() {
    const studioBody = document.querySelector('.st-body');
    const iframeRect = this.iframe?.getBoundingClientRect?.();
    return {
      backend: 'webgpu-studio-pro-v4.1-original',
      loaded: this.loaded,
      error: this.error,
      donorCommit: 'c86cd3e20d6f981c75f1e39d395c794ad104d802',
      donorUrl: BREEZE_STUDIO_PRO_V41_URL,
      bridge: false,
      interactionMode: 'native-iframe-with-studio-center-pass-through',
      pointerEvents: this.pointerEvents,
      focusEvents: this.focusEvents,
      iframeZIndex: this.iframe?.style?.zIndex || null,
      iframePointerEvents: this.iframe?.style?.pointerEvents || null,
      studioBodyPointerEvents: studioBody ? getComputedStyle(studioBody).pointerEvents : null,
      inputOwner: document.body.dataset.breezeInputOwner || null,
      iframeRect: iframeRect ? {
        left: Math.round(iframeRect.left), top: Math.round(iframeRect.top),
        width: Math.round(iframeRect.width), height: Math.round(iframeRect.height)
      } : null,
      hasIframe: Boolean(this.iframe?.isConnected),
      hasMuseumPose: Boolean(this.lastPose)
    };
  }

  async dispose() {
    this._restoreStudioInput();
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
