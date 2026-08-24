import { MediaVault } from './media-vault.js';
import { ProjectAssetStore } from './project-asset-store.js';

/**
 * Durable persistence extension for MediaVault.
 *
 * - accept(): after decoder READY, persist the original File/Blob in IndexedDB.
 * - hydrate(): restore durable rows into live object URLs before Museum boot.
 * - release(): becomes non-destructive by default. A config can reuse one asset
 *   on several works, so one slot replacement must not revoke another wall.
 */

const originalAccept = MediaVault.prototype.accept;
const originalRelease = MediaVault.prototype.release;

if (!MediaVault.prototype.__durablePersistenceInstalled) {
  MediaVault.prototype.__durablePersistenceInstalled = true;

  MediaVault.prototype.accept = async function durableAccept(file, options = {}) {
    const asset = await originalAccept.call(this, file, options);
    if (asset?.state === 'READY' && file) {
      try {
        await ProjectAssetStore.put(asset, file);
        asset.durable = true;
        asset.durableAt = new Date().toISOString();
        this.onChange(asset);
      } catch (error) {
        asset.durable = false;
        asset.persistenceError = String(error?.message || error);
        this.onChange(asset);
      }
    }
    return asset;
  };

  MediaVault.prototype.hydrateDurable = async function hydrateDurable(rows = null) {
    const stored = rows || await ProjectAssetStore.all();
    let restored = 0;
    for (const row of stored) {
      if (!row?.id || !row.blob || this.assets.has(row.id)) continue;
      const url = URL.createObjectURL(row.blob);
      const kind = row.kind || 'image';
      const asset = {
        id: row.id,
        reference: row.reference || `authored:${row.id}`,
        kind,
        name: row.name || 'asset',
        mimeType: row.mimeType || row.blob.type || '',
        bytes: row.bytes || row.blob.size || 0,
        state: 'READY',
        url,
        error: null,
        width: row.width || 0,
        height: row.height || 0,
        duration: row.duration || 0,
        // Every hydrated image gets the new live object URL. A video poster may
        // use its durable data URL captured during the original decode.
        thumb: kind === 'image' ? url : (row.thumb || null),
        durable: true,
        durableAt: row.savedAt || null
      };
      this.assets.set(row.id, asset);
      restored += 1;
      this.onChange(asset);
    }
    return restored;
  };

  MediaVault.prototype.isDurable = async function isDurable(id) {
    return Boolean(id && await ProjectAssetStore.has(id));
  };

  // Never revoke on a single slot replacement. The same asset can be bound to
  // several entities. Cleanup is explicit and reference-aware via collect().
  MediaVault.prototype.release = function durableSafeRelease(id) {
    const asset = this.assets.get(id);
    if (!asset) return false;
    asset.pendingRelease = true;
    this.onChange(asset);
    return true;
  };

  MediaVault.prototype.collect = async function collect(referencedIds = []) {
    const keep = new Set(referencedIds.filter(Boolean));
    let released = 0;
    for (const [id] of [...this.assets]) {
      if (keep.has(id)) continue;
      originalRelease.call(this, id);
      await ProjectAssetStore.delete(id).catch(() => {});
      released += 1;
    }
    return released;
  };
}

export async function hydrateProjectVault(vault) {
  if (!vault?.hydrateDurable) return 0;
  return vault.hydrateDurable();
}

export { ProjectAssetStore };
