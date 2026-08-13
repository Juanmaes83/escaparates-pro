/**
 * Museum — Authored media vault
 *
 * Holds the media an author supplies for the length of a session, and gives out
 * a durable reference (`authored:<id>`) that a config can store while the live
 * object URL stays here.
 *
 * REUSE NOTE. The lifecycle is `js/media-manager.js`'s, which this project has
 * already proven: create an object URL, load it through a real element, read the
 * dimensions or duration off that element as the readiness signal, and revoke on
 * replacement. Two of its decisions are worth naming because they are the ones
 * that stop leaks — the URL is revoked when a slot is *replaced*, not only when
 * it is removed; and a file that fails to decode revokes immediately rather than
 * lingering as a half-loaded slot.
 *
 * Adapted rather than imported for the same reason as the config model: that
 * file is an `EP.*` global outside this module's boundary.
 *
 * States, and none of them is skipped:
 *   SELECTED → LOADING → READY → APPLIED, or → ERROR
 *   any state → RELEASED, exactly once
 */

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const VIDEO_TYPES = ['video/mp4', 'video/webm'];

export class MediaVault {
  constructor({ onChange } = {}) {
    /** @type {Map<string, object>} */
    this.assets = new Map();
    this.onChange = onChange || (() => {});
    this._n = 0;
  }

  /** `authored:<id>` in a config resolves to the live object URL, or null. */
  resolve(reference) {
    if (typeof reference !== 'string' || !reference.startsWith('authored:')) return null;
    const asset = this.assets.get(reference.slice(9));
    return asset && asset.state === 'READY' ? asset.url : null;
  }

  get(id) { return this.assets.get(id) || null; }

  /**
   * Take a file from the author and drive it to READY.
   *
   * Rejects unsupported media loudly: silently accepting a `.mov` and rendering
   * nothing is the failure mode this exists to prevent.
   */
  async accept(file, { kind = 'image' } = {}) {
    const id = `a${(this._n += 1)}_${Date.now().toString(36)}`;
    const allowed = kind === 'video' ? VIDEO_TYPES : IMAGE_TYPES;
    const asset = {
      id,
      reference: `authored:${id}`,
      kind,
      name: file?.name || 'sin nombre',
      mimeType: file?.type || '',
      bytes: file?.size || 0,
      state: 'SELECTED',
      url: null,
      error: null,
      width: 0,
      height: 0,
      duration: 0
    };
    this.assets.set(id, asset);
    this.onChange(asset);

    if (!file) return this._fail(asset, 'No se ha seleccionado ningún archivo.');
    if (!allowed.includes(file.type)) {
      return this._fail(asset, `Formato no admitido: ${file.type || 'desconocido'}. Se admiten ${allowed.join(', ')}.`);
    }

    asset.state = 'LOADING';
    this.onChange(asset);
    const url = URL.createObjectURL(file);

    try {
      if (kind === 'video') {
        // Readiness is metadata plus enough buffered data to draw, not the file
        // handle existing. "Selected" is not "ready".
        const meta = await this._probeVideo(url);
        asset.width = meta.width; asset.height = meta.height; asset.duration = meta.duration;
      } else {
        const meta = await this._probeImage(url);
        asset.width = meta.width; asset.height = meta.height;
      }
    } catch (error) {
      URL.revokeObjectURL(url);
      return this._fail(asset, String(error?.message || error));
    }

    asset.url = url;
    asset.state = 'READY';
    this.onChange(asset);
    return asset;
  }

  _probeImage(url) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
      image.onerror = () => reject(new Error('La imagen no se pudo decodificar.'));
      image.src = url;
    });
  }

  _probeVideo(url) {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'auto';
      video.muted = true;
      video.playsInline = true;
      const done = () => {
        if (!video.videoWidth) { reject(new Error('El vídeo no tiene pista de imagen legible.')); return; }
        resolve({ width: video.videoWidth, height: video.videoHeight, duration: video.duration || 0 });
        video.src = '';
      };
      // canplaythrough, not loadedmetadata: metadata alone means the header
      // parsed, which is not the same as being able to show a frame.
      video.oncanplaythrough = done;
      video.onloadeddata = () => { if (video.readyState >= 2) done(); };
      video.onerror = () => reject(new Error('El vídeo no se pudo decodificar.'));
      video.src = url;
    });
  }

  _fail(asset, message) {
    asset.state = 'ERROR';
    asset.error = message;
    this.onChange(asset);
    return asset;
  }

  /** Revoke and forget. Called on replacement as well as on removal. */
  release(id) {
    const asset = this.assets.get(id);
    if (!asset) return false;
    if (asset.url) URL.revokeObjectURL(asset.url);
    asset.url = null;
    asset.state = 'RELEASED';
    this.assets.delete(id);
    this.onChange(asset);
    return true;
  }

  releaseAll() {
    for (const id of [...this.assets.keys()]) this.release(id);
  }

  report() {
    return [...this.assets.values()].map((a) => ({
      id: a.id, kind: a.kind, name: a.name, state: a.state,
      width: a.width, height: a.height, duration: a.duration, error: a.error
    }));
  }
}
