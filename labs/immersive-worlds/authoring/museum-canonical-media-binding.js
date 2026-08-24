import { StudioShell } from './studio/studio-shell.js';

/**
 * Museum Media Recovery V2 — canonical session binding.
 *
 * The live preview is not the source of truth. SpaceLifecycle rebuilds rooms
 * from WorldStore, so every successful authored media change must update the
 * canonical entity in the running Runtime as well as Studio config.
 *
 * This deliberately does NOT install lifecycle listeners or patch Runtime.start.
 * Once the canonical record is correct, the existing SceneKit/MediaLoader path
 * rebuilds the room correctly by design.
 */

function selectedAuthoredMedia(studio, entityId = studio.selectedId) {
  const authored = studio.config?.entities?.[entityId] || null;
  if (!authored) return null;
  if (authored.video?.assetId) return authored.video;
  if (authored.image?.assetId) return authored.image;
  return null;
}

function mediaRecord(asset, authored, previous = null) {
  const isVideo = asset?.kind === 'video' || authored?.kind === 'video';
  return {
    ...(previous || {}),
    kind: isVideo ? 'VIDEO' : 'IMAGE',
    src: asset.url,
    aspect: asset.width && asset.height ? asset.width / asset.height : previous?.aspect,
    loop: isVideo ? previous?.loop !== false : undefined,
    muted: isVideo ? previous?.muted !== false : undefined,
    credit: previous?.credit || 'Medio aportado en el Estudio del Museo',
    rights: previous?.rights || 'Medio aportado por la institución autora.'
  };
}

export function bindSelectedMediaToCanonicalWorld(studio, entityId = studio.selectedId) {
  const runtime = window.__IW?.runtime;
  if (!runtime?.store || !entityId) return { ok: false, reason: 'Runtime no disponible.' };

  const authored = selectedAuthoredMedia(studio, entityId);
  if (!authored?.assetId) return { ok: false, reason: 'La pieza no tiene un asset authored.' };

  const asset = studio.vault?.get?.(authored.assetId);
  if (!asset || asset.state !== 'READY' || !asset.url) {
    return { ok: false, reason: 'El asset todavía no está READY en MediaVault.' };
  }

  const entity = runtime.store.get(entityId);
  if (!entity) return { ok: false, reason: `No existe la entidad canónica ${entityId}.` };

  runtime.store.edit(entityId, (record) => {
    record.content = { ...(record.content || {}) };
    record.content.media = mediaRecord(asset, authored, record.content.media || null);
  });

  return { ok: true, entityId, assetId: asset.id, src: asset.url, kind: asset.kind };
}

const previousTakeFile = StudioShell.prototype._takeFile;
StudioShell.prototype._takeFile = async function canonicalMediaTakeFile(slot, file) {
  await previousTakeFile.call(this, slot, file);
  if (!file || !this.selectedEntity) return;

  const result = bindSelectedMediaToCanonicalWorld(this, this.selectedId);
  if (!result.ok) {
    console.warn('[Museum canonical media]', result.reason);
    return;
  }

  window.__IW_MEDIA_BINDING = {
    entityId: result.entityId,
    assetId: result.assetId,
    kind: result.kind,
    revision: window.__IW?.runtime?.store?.revision || 0,
    at: new Date().toISOString()
  };
};

window.__MUSEUM_CANONICAL_MEDIA = { bindSelectedMediaToCanonicalWorld };
