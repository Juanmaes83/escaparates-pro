/**
 * Museum — Authored media vault
 *
 * Holds author supplied media during the session and persists the bytes in
 * IndexedDB so a saved Museum project can really restore its image/video files
 * after reload. Config JSON stores durable `authored:<id>` references; this
 * vault owns the Blob/ObjectURL lifecycle behind those references.
 */

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const VIDEO_TYPES = ['video/mp4', 'video/webm'];
const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];
const VIDEO_EXTENSIONS = ['mp4', 'webm', 'm4v'];
const PROBE_TIMEOUT_MS = 20000;
const THUMB_W = 200;

const DB_NAME = 'iw-museum-authored-media';
const DB_VERSION = 1;
const DB_STORE = 'assets';
let dbPromise = null;

function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(DB_STORE)) {
        const store = db.createObjectStore(DB_STORE, { keyPath: 'key' });
        store.createIndex('scope', 'scope');
        store.createIndex('updatedAt', 'updatedAt');
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('No se pudo abrir IndexedDB.'));
  });
  return dbPromise;
}

async function idbGet(key) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, 'readonly');
    const request = tx.objectStore(DB_STORE).get(key);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

async function idbPut(record) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, 'readwrite');
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error || new Error('No se pudo guardar el medio.'));
    tx.objectStore(DB_STORE).put(record);
  });
}

async function idbDelete(key) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, 'readwrite');
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error || new Error('No se pudo retirar el medio guardado.'));
    tx.objectStore(DB_STORE).delete(key);
  });
}

function collectAssetIds(value, out = new Set()) {
  if (!value || typeof value !== 'object') return out;
  if (typeof value.assetId === 'string' && value.assetId) out.add(value.assetId);
  if (Array.isArray(value)) {
    for (const item of value) collectAssetIds(item, out);
  } else {
    for (const item of Object.values(value)) collectAssetIds(item, out);
  }
  return out;
}

function posterFrom(video) {
  try {
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) return null;
    const canvas = document.createElement('canvas');
    canvas.width = THUMB_W;
    canvas.height = Math.max(1, Math.round((THUMB_W * h) / w));
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.72);
  } catch {
    return null;
  }
}

function looksLike(file, kind) {
  const types = kind === 'video' ? VIDEO_TYPES : IMAGE_TYPES;
  const extensions = kind === 'video' ? VIDEO_EXTENSIONS : IMAGE_EXTENSIONS;
  const type = String(file?.type || '').toLowerCase();
  if (types.includes(type)) return true;
  if (type.startsWith(`${kind}/`)) return true;
  if (type) return false;
  const extension = String(file?.name || '').split('.').pop().toLowerCase();
  return extensions.includes(extension);
}

const COPY = {
  image: {
    SELECTED: 'Seleccionada', LOADING: 'Cargando…', DECODED: 'Decodificando…',
    READY: 'Lista', APPLIED: 'En la sala', ERROR: 'No se pudo usar', RELEASED: 'Retirada'
  },
  video: {
    SELECTED: 'Seleccionado', LOADING: 'Cargando…', DECODED: 'Decodificado',
    READY: 'Listo', APPLIED: 'En la sala', ERROR: 'No se pudo usar', RELEASED: 'Retirado'
  }
};

export const ASSET_CHAIN = Object.freeze({
  image: ['SELECTED', 'LOADING', 'READY'],
  video: ['SELECTED', 'LOADING', 'DECODED', 'READY']
});

export function describeAsset(asset, media = null) {
  if (!asset && media?.src) {
    const chain = ASSET_CHAIN[media.kind] || ASSET_CHAIN.image;
    const facts = [];
    if (media.width && media.height) facts.push(`${media.width}×${media.height}`);
    return {
      state: 'READY', label: 'En el proyecto', name: media.name,
      detail: facts.join(' · '), chain, index: chain.length - 1
    };
  }
  if (!asset) return { label: 'Sin archivo', detail: '', state: null, chain: [], index: -1 };
  const copy = COPY[asset.kind] || COPY.image;
  const chain = ASSET_CHAIN[asset.kind] || ASSET_CHAIN.image;
  const facts = [];
  if (asset.width && asset.height) facts.push(`${asset.width}×${asset.height}`);
  if (asset.duration) facts.push(`${asset.duration.toFixed(1)} s`);
  if (asset.bytes) facts.push(`${(asset.bytes / 1024).toFixed(0)} kB`);
  if (asset.persisted) facts.push('guardado localmente');
  if (asset.persistenceError) facts.push('no persistente');
  return {
    state: asset.state,
    label: copy[asset.state] || asset.state,
    name: asset.name,
    detail: asset.state === 'ERROR' ? asset.error : facts.join(' · '),
    chain,
    index: chain.indexOf(asset.state)
  };
}

export class MediaVault {
  constructor({ onChange, scope = 'default' } = {}) {
    this.assets = new Map();
    this.onChange = onChange || (() => {});
    this._n = 0;
    this.scope = this._safeScope(scope);
  }

  _safeScope(value) {
    return String(value || 'default').trim().replace(/[^a-z0-9._-]+/gi, '-') || 'default';
  }

  setScope(value) {
    this.scope = this._safeScope(value);
    return this.scope;
  }

  _storageKey(id) { return `${this.scope}:${id}`; }

  resolve(reference) {
    if (typeof reference !== 'string' || !reference.startsWith('authored:')) return null;
    const asset = this.assets.get(reference.slice(9));
    return asset && asset.state === 'READY' ? asset.url : null;
  }

  get(id) { return this.assets.get(id) || null; }

  async accept(file, { kind = 'image' } = {}) {
    const id = `a${(this._n += 1)}_${Date.now().toString(36)}`;
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
      duration: 0,
      thumb: null,
      persisted: false,
      persistenceError: null
    };
    this.assets.set(id, asset);
    this.onChange(asset);

    if (!file) return this._fail(asset, 'No se ha seleccionado ningún archivo.');
    if (!looksLike(file, kind)) {
      const wanted = kind === 'video' ? 'un vídeo MP4 o WebM' : 'una imagen JPG, PNG o WebP';
      return this._fail(asset, `Ese archivo no es ${wanted}. Elige otro y vuelve a intentarlo.`);
    }

    asset.state = 'LOADING';
    this.onChange(asset);
    const url = URL.createObjectURL(file);

    try {
      if (kind === 'video') {
        const meta = await this._probeVideo(url, () => {
          asset.state = 'DECODED';
          this.onChange(asset);
        });
        asset.width = meta.width;
        asset.height = meta.height;
        asset.duration = meta.duration;
        asset.thumb = meta.thumb || null;
      } else {
        const meta = await this._probeImage(url);
        asset.width = meta.width;
        asset.height = meta.height;
        asset.thumb = url;
      }
    } catch (error) {
      URL.revokeObjectURL(url);
      return this._fail(asset, String(error?.message || error));
    }

    asset.url = url;
    asset.state = 'READY';
    this.onChange(asset);

    // Persist as soon as the file is proven decodable. "Guardar" then only has
    // to persist the lightweight config reference; the bytes are already durable.
    try {
      await this._persistAsset(asset, file);
      asset.persisted = true;
      asset.persistenceError = null;
    } catch (error) {
      asset.persisted = false;
      asset.persistenceError = String(error?.message || error);
      console.warn('[IW MediaVault] media remains usable in this tab but could not be persisted', error);
    }
    this.onChange(asset);
    return asset;
  }

  async _persistAsset(asset, blob) {
    await idbPut({
      key: this._storageKey(asset.id),
      scope: this.scope,
      id: asset.id,
      kind: asset.kind,
      name: asset.name,
      mimeType: asset.mimeType,
      bytes: asset.bytes,
      width: asset.width,
      height: asset.height,
      duration: asset.duration,
      thumb: asset.thumb && asset.kind === 'video' ? asset.thumb : null,
      blob,
      updatedAt: new Date().toISOString()
    });
  }

  /** Restore all authored refs present in a saved config before Museum boot. */
  async hydrateConfig(config) {
    const ids = [...collectAssetIds(config)];
    const restored = [];
    for (const id of ids) {
      if (this.assets.get(id)?.state === 'READY') continue;
      try {
        const record = await idbGet(this._storageKey(id));
        if (!record?.blob) continue;
        const url = URL.createObjectURL(record.blob);
        const asset = {
          id: record.id,
          reference: `authored:${record.id}`,
          kind: record.kind || 'image',
          name: record.name || 'medio guardado',
          mimeType: record.mimeType || record.blob.type || '',
          bytes: record.bytes || record.blob.size || 0,
          state: 'READY',
          url,
          error: null,
          width: record.width || 0,
          height: record.height || 0,
          duration: record.duration || 0,
          thumb: record.thumb || (record.kind === 'image' ? url : null),
          persisted: true,
          persistenceError: null
        };
        this.assets.set(id, asset);
        restored.push(id);
        this.onChange(asset);
      } catch (error) {
        console.warn(`[IW MediaVault] could not restore ${id}`, error);
      }
    }
    return restored;
  }

  _probeImage(url) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
      image.onerror = () => reject(new Error('La imagen no se pudo decodificar.'));
      image.src = url;
    });
  }

  _probeVideo(url, onDecoded = () => {}) {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'auto';
      video.muted = true;
      video.playsInline = true;
      video.onloadedmetadata = () => onDecoded();
      let settled = false;
      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        teardown();
        reject(new Error('El vídeo tardó demasiado en abrirse. Puede que el códec no sea compatible.'));
      }, PROBE_TIMEOUT_MS);
      const teardown = () => {
        clearTimeout(timer);
        try { video.pause(); video.removeAttribute('src'); video.load(); } catch { /* already gone */ }
      };
      const done = () => {
        if (settled) return;
        settled = true;
        if (!video.videoWidth) {
          teardown();
          reject(new Error('El vídeo no tiene pista de imagen legible.'));
          return;
        }
        const meta = {
          width: video.videoWidth,
          height: video.videoHeight,
          duration: video.duration || 0,
          thumb: posterFrom(video)
        };
        teardown();
        resolve(meta);
      };
      video.oncanplaythrough = done;
      video.onloadeddata = () => { if (video.readyState >= 2) done(); };
      video.onerror = () => {
        if (settled) return;
        settled = true;
        teardown();
        reject(new Error('El vídeo no se pudo decodificar. Prueba con un MP4 (H.264) o un WebM.'));
      };
      video.src = url;
    });
  }

  _fail(asset, message) {
    asset.state = 'ERROR';
    asset.error = message;
    this.onChange(asset);
    return asset;
  }

  release(id) {
    const asset = this.assets.get(id);
    if (!asset) return false;
    if (asset.url) URL.revokeObjectURL(asset.url);
    asset.url = null;
    asset.state = 'RELEASED';
    this.assets.delete(id);
    idbDelete(this._storageKey(id)).catch(() => {});
    this.onChange(asset);
    return true;
  }

  releaseAll({ forgetPersisted = false } = {}) {
    for (const id of [...this.assets.keys()]) {
      const asset = this.assets.get(id);
      if (asset?.url) URL.revokeObjectURL(asset.url);
      if (asset) {
        asset.url = null;
        asset.state = 'RELEASED';
        this.onChange(asset);
      }
      this.assets.delete(id);
      if (forgetPersisted) idbDelete(this._storageKey(id)).catch(() => {});
    }
  }

  report() {
    return [...this.assets.values()].map((a) => ({
      id: a.id, kind: a.kind, name: a.name, state: a.state,
      width: a.width, height: a.height, duration: a.duration,
      persisted: !!a.persisted, persistenceError: a.persistenceError || null,
      error: a.error
    }));
  }
}
