/**
 * Immersive Worlds — Media loader
 *
 * Resolves declared image/video media into Three.js textures. Broken media falls
 * back instead of leaving a hole in the room, and cached resources are
 * reference-counted across Spaces.
 */

import { THREE } from './render-host.js';

const DEFAULT_TIMEOUT_MS = 12000;

export class MediaLoader {
  constructor({ bus, baseUrl = '', timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
    this.bus = bus;
    this.baseUrl = baseUrl;
    this.timeoutMs = timeoutMs;
    this._cache = new Map();
    this._inflight = new Map();
    this.log = [];
    this._disposed = false;

    // Studio preview rebuilds create another loader on the same page. Any
    // leftover loader from the previous preview must release VideoTextures and
    // HTMLVideoElements before the new one starts decoding media.
    if (typeof window !== 'undefined') {
      const previous = window.__IW_ACTIVE_MEDIA_LOADER;
      if (previous && previous !== this) {
        try { previous.disposeAll(); } catch { /* already released */ }
      }
      window.__IW_ACTIVE_MEDIA_LOADER = this;
    }
  }

  _resolve(src) {
    if (!src) return src;
    if (/^(https?:)?\/\//.test(src) || src.startsWith('data:') || src.startsWith('blob:')) return src;
    return this.baseUrl ? new URL(src, this.baseUrl).href : src;
  }

  _record(entry) {
    this.log.push(entry);
    if (this.log.length > 200) this.log.shift();
  }

  async load(media, context = {}) {
    if (this._disposed) throw new Error('media loader disposed');
    if (!media || media.kind === 'GENERATED' || !media.src) {
      return { texture: null, aspect: media?.aspect ?? null, kind: 'GENERATED', fallback: false };
    }

    const url = this._resolve(media.src);
    const cached = this._cache.get(url);
    if (cached) {
      cached.refs += 1;
      return {
        texture: cached.texture,
        aspect: cached.aspect,
        kind: media.kind,
        fallback: false,
        video: cached.video
      };
    }

    if (this._inflight.has(url)) return this._inflight.get(url);

    const started = performance.now();
    const promise = (media.kind === 'VIDEO' ? this._loadVideo(url, media, context) : this._loadImage(url))
      .then((result) => {
        if (this._disposed) {
          releaseVideo(result.video);
          result.texture?.dispose?.();
          throw new Error('media loader disposed during load');
        }
        this._cache.set(url, { ...result, refs: 1 });
        this._record({
          entityId: context.entityId ?? null, url, kind: media.kind,
          ok: true, ms: Math.round(performance.now() - started)
        });
        this.bus?.emit('asset:ready', { entityId: context.entityId, url, kind: media.kind });
        return { ...result, kind: media.kind, fallback: false };
      })
      .catch((error) => {
        this._record({
          entityId: context.entityId ?? null, url, kind: media.kind,
          ok: false, ms: Math.round(performance.now() - started), error: String(error?.message || error)
        });
        this.bus?.emit('asset:error', {
          entityId: context.entityId, url, kind: media.kind,
          message: String(error?.message || error)
        });
        return { texture: null, aspect: media.aspect ?? null, kind: 'GENERATED', fallback: true };
      })
      .finally(() => this._inflight.delete(url));

    this._inflight.set(url, promise);
    return promise;
  }

  _loadImage(url) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.crossOrigin = 'anonymous';
      const timer = setTimeout(() => {
        image.src = '';
        reject(new Error(`timeout after ${this.timeoutMs} ms`));
      }, this.timeoutMs);

      image.onload = () => {
        clearTimeout(timer);
        const texture = new THREE.Texture(image);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = 8;
        texture.generateMipmaps = true;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.needsUpdate = true;
        resolve({ texture, aspect: image.naturalWidth / image.naturalHeight });
      };
      image.onerror = () => {
        clearTimeout(timer);
        reject(new Error('image failed to load'));
      };
      image.src = url;
    });
  }

  _loadVideo(url, media, context = {}) {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.loop = media.loop !== false;
      video.muted = media.muted !== false;
      video.playsInline = true;
      video.preload = 'auto';
      if (media.poster) video.poster = this._resolve(media.poster);

      const timer = setTimeout(() => reject(new Error(`timeout after ${this.timeoutMs} ms`)), this.timeoutMs);

      const ready = () => {
        clearTimeout(timer);
        const texture = new THREE.VideoTexture(video);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.generateMipmaps = false;
        video.play().then(
          () => { texture.userData.playing = true; },
          (error) => {
            texture.userData.playing = false;
            texture.userData.playError = error?.name || String(error);
            this._record({ entityId: context.entityId ?? null, url, kind: media.kind,
              ok: true, ms: 0, error: `autoplay refused: ${error?.name || error}` });
            this._retryOnGesture(video, texture);
          }
        );
        resolve({ texture, aspect: video.videoWidth / video.videoHeight || media.aspect || 16 / 9, video });
      };

      video.addEventListener('loadeddata', ready, { once: true });
      video.addEventListener('error', () => {
        clearTimeout(timer);
        reject(new Error('video failed to load'));
      }, { once: true });
      video.src = url;
    });
  }

  _retryOnGesture(video, texture) {
    const events = ['pointerdown', 'keydown', 'touchstart'];
    const attempt = () => {
      video.play().then(
        () => {
          texture.userData.playing = true;
          texture.userData.playError = null;
          for (const type of events) window.removeEventListener(type, attempt);
        },
        () => { /* next gesture tries again */ }
      );
    };
    for (const type of events) window.addEventListener(type, attempt, { passive: true });
  }

  release(src) {
    const url = this._resolve(src);
    const entry = this._cache.get(url);
    if (!entry) return;
    entry.refs -= 1;
    if (entry.refs > 0) return;
    releaseVideo(entry.video);
    entry.texture.dispose();
    this._cache.delete(url);
  }

  report() {
    const attempts = this.log.length;
    const failures = this.log.filter((entry) => !entry.ok);
    return {
      attempts,
      loaded: attempts - failures.length,
      failed: failures.length,
      cached: this._cache.size,
      slowestMs: this.log.reduce((max, entry) => Math.max(max, entry.ms || 0), 0),
      failures: failures.slice(-5)
    };
  }

  disposeAll() {
    if (this._disposed) return;
    this._disposed = true;
    for (const [, entry] of this._cache) {
      releaseVideo(entry.video);
      entry.texture.dispose();
    }
    this._cache.clear();
    this._inflight.clear();
    if (typeof window !== 'undefined' && window.__IW_ACTIVE_MEDIA_LOADER === this) {
      window.__IW_ACTIVE_MEDIA_LOADER = null;
    }
  }
}

function releaseVideo(video) {
  if (!video) return;
  try {
    video.pause();
    video.removeAttribute('src');
    video.load();
  } catch { /* already released */ }
}
