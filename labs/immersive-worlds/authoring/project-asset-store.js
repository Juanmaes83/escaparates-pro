/**
 * Museum — durable authored asset store.
 *
 * MediaVault owns live object URLs; ProjectAssetStore owns the bytes that must
 * survive room disposal, reloads and browser restarts. Config keeps stable
 * `authored:<id>` references while IndexedDB keeps the Blob/File behind each id.
 */

const DB_NAME = 'iw.museum.project-assets.v1';
const DB_VERSION = 1;
const STORE = 'assets';

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('No se pudo abrir IndexedDB.'));
  });
}

function requestPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Operación IndexedDB fallida.'));
  });
}

export const ProjectAssetStore = {
  async put(asset, file) {
    if (!asset?.id || !file) throw new Error('Asset o archivo inválido para persistencia.');
    const db = await openDb();
    try {
      const tx = db.transaction(STORE, 'readwrite');
      const row = {
        id: asset.id,
        reference: asset.reference || `authored:${asset.id}`,
        kind: asset.kind,
        name: asset.name,
        mimeType: asset.mimeType || file.type || '',
        bytes: asset.bytes || file.size || 0,
        width: asset.width || 0,
        height: asset.height || 0,
        duration: asset.duration || 0,
        thumb: asset.thumb || null,
        blob: file,
        savedAt: new Date().toISOString()
      };
      await requestPromise(tx.objectStore(STORE).put(row));
      await new Promise((resolve, reject) => {
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error || new Error('No se pudo confirmar el asset durable.'));
        tx.onabort = () => reject(tx.error || new Error('Persistencia de asset abortada.'));
      });
      return row;
    } finally {
      db.close();
    }
  },

  async get(id) {
    const db = await openDb();
    try {
      const tx = db.transaction(STORE, 'readonly');
      return await requestPromise(tx.objectStore(STORE).get(id));
    } finally {
      db.close();
    }
  },

  async has(id) {
    return Boolean(await this.get(id));
  },

  async all() {
    const db = await openDb();
    try {
      const tx = db.transaction(STORE, 'readonly');
      return (await requestPromise(tx.objectStore(STORE).getAll())) || [];
    } finally {
      db.close();
    }
  },

  async delete(id) {
    const db = await openDb();
    try {
      const tx = db.transaction(STORE, 'readwrite');
      await requestPromise(tx.objectStore(STORE).delete(id));
      await new Promise((resolve, reject) => {
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error || new Error('No se pudo eliminar el asset durable.'));
      });
      return true;
    } finally {
      db.close();
    }
  },

  async clear() {
    const db = await openDb();
    try {
      const tx = db.transaction(STORE, 'readwrite');
      await requestPromise(tx.objectStore(STORE).clear());
      await new Promise((resolve, reject) => {
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error || new Error('No se pudo limpiar el almacén durable.'));
      });
    } finally {
      db.close();
    }
  }
};
