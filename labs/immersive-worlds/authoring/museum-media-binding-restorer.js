import { EVENTS } from '../engine/core/event-bus.js';
import { ProjectAssetStore } from './project-asset-store.js';
import { showFileOnArtwork } from './museum-visible-media.js';
import { showFileOnVideoScreen } from './museum-video-entity-media.js';

function authoredMedia(config, entityId) {
  const authored = config?.entities?.[entityId] || null;
  if (!authored) return null;
  return authored.video?.assetId ? authored.video : authored.image?.assetId ? authored.image : null;
}

async function durableFile(assetId) {
  const row = await ProjectAssetStore.get(assetId);
  if (!row?.blob) return null;
  if (row.blob instanceof File && row.blob.name) return row.blob;
  return new File([row.blob], row.name || 'asset', { type: row.mimeType || row.blob.type || '' });
}

async function applyBinding(runtime, config, entity) {
  const media = authoredMedia(config, entity.id);
  if (!media?.assetId) return { skipped: true, entityId: entity.id };
  const file = await durableFile(media.assetId);
  if (!file) return { ok: false, entityId: entity.id, reason: 'Asset durable no encontrado.' };

  try {
    if (entity.kind === 'VIDEO') {
      await showFileOnVideoScreen(entity.id, file);
      return { ok: true, entityId: entity.id, kind: 'VIDEO' };
    }
    if (entity.kind === 'ARTWORK') {
      await showFileOnArtwork(entity.id, file);
      return { ok: true, entityId: entity.id, kind: 'ARTWORK' };
    }
    return { skipped: true, entityId: entity.id, reason: `Sin adapter durable para ${entity.kind}.` };
  } catch (error) {
    return { ok: false, entityId: entity.id, reason: String(error?.message || error) };
  }
}

export function installMuseumMediaBindingRestorer({ runtime, getConfig }) {
  if (!runtime?.bus) return () => {};
  if (runtime.__museumMediaBindingRestorerOff) runtime.__museumMediaBindingRestorerOff();

  let generation = 0;
  const restoreSpace = async (spaceId) => {
    const run = ++generation;
    // SPACE_READY fires after SceneKit.buildSpace populated _entityIndex.
    const config = getConfig?.() || window.__IW_CONFIG || null;
    if (!config) return [];
    const entities = (runtime.store?.world?.entities || runtime.store?.entities || [])
      .filter?.((entity) => entity.spaceId === spaceId) || [];
    const results = [];
    for (const entity of entities) {
      const result = await applyBinding(runtime, config, entity);
      results.push(result);
    }
    if (run === generation) {
      window.__IW_MEDIA_RESTORE_REPORT = { spaceId, at: new Date().toISOString(), results };
    }
    return results;
  };

  const offReady = runtime.bus.on(EVENTS.SPACE_READY, ({ spaceId }) => { restoreSpace(spaceId); });
  const offEntered = runtime.bus.on(EVENTS.SPACE_ENTERED, ({ spaceId }) => { restoreSpace(spaceId); });
  const off = () => { offReady?.(); offEntered?.(); };
  runtime.__museumMediaBindingRestorerOff = off;

  // Restore the currently active room too; on initial boot SPACE_READY may have
  // fired before this extension was installed.
  const active = runtime.state?.activeSpaceId;
  if (active) restoreSpace(active);

  return off;
}

export { applyBinding, authoredMedia };
