import { StudioShell } from './studio/studio-shell.js';
import { findProjectionSurface, cleanAuthoredProjection } from './museum-projection-authored-clean.js';

/**
 * Gallery B projection adapter — V2 closeout.
 *
 * `Cuaderno de luz` is a canonical PROJECTION entity. MediaVault owns its object
 * URL; Museum MediaLoader owns decode/cache/playback; this adapter only targets
 * the real wall field and removes the synthetic overlay treatment while authored
 * media is active. No second File decode and no second object URL are created.
 */

function mediaSpecFromAsset(asset) {
  const isVideo = asset?.kind === 'video';
  return {
    kind: isVideo ? 'VIDEO' : 'IMAGE',
    src: asset.url,
    aspect: asset.width && asset.height ? asset.width / asset.height : undefined,
    loop: isVideo,
    muted: isVideo
  };
}

function releaseLiveReference(sceneKit, entityId, surface) {
  const previousSrc = surface.userData?.museumProjectionSrc;
  if (!previousSrc) return;
  sceneKit.mediaLoader?.release?.(previousSrc);
  if (sceneKit._mediaRefs?.get?.(entityId) === previousSrc) sceneKit._mediaRefs.delete(entityId);
  delete surface.userData.museumProjectionSrc;
}

async function showAssetOnProjection(entityId, asset) {
  const sceneKit = window.__IW?.runtime?.sceneKit;
  if (!sceneKit?.mediaLoader) throw new Error('Museum MediaLoader no está disponible.');
  if (!asset?.url || asset.state !== 'READY') throw new Error('El asset todavía no está READY.');

  const surface = findProjectionSurface(sceneKit, entityId);
  const result = await sceneKit.mediaLoader.load(mediaSpecFromAsset(asset), { entityId });
  if (!result?.texture || result.fallback) throw new Error('MediaLoader no pudo producir una textura válida para la proyección.');

  releaseLiveReference(sceneKit, entityId, surface);
  surface.material.map = result.texture;
  surface.material.needsUpdate = true;
  surface.userData.museumProjectionSrc = asset.url;
  sceneKit._mediaRefs?.set?.(entityId, asset.url);

  const record = sceneKit?._entityIndex?.get(entityId);
  cleanAuthoredProjection(record?.object, record?.size || null);

  return {
    entityId,
    isVideo: asset.kind === 'video',
    surface,
    playing: result.video ? !result.video.paused : null
  };
}

const previousTakeFile = StudioShell.prototype._takeFile;
StudioShell.prototype._takeFile = async function museumProjectionTakeFile(slot, file) {
  await previousTakeFile.call(this, slot, file);
  if (!file) return;

  const entity = (this.world.entities || []).find((item) => item.id === this.selectedId);
  if (entity?.kind !== 'PROJECTION') return;

  const authored = this.config?.entities?.[entity.id] || {};
  const media = authored.video?.assetId ? authored.video : authored.image?.assetId ? authored.image : null;
  const asset = media?.assetId ? this.vault?.get?.(media.assetId) : null;

  try {
    if (!asset) throw new Error('El archivo no está disponible en MediaVault.');
    const result = await showAssetOnProjection(entity.id, asset);
    this._say(result.isVideo
      ? 'Vídeo visible y reproduciéndose con claridad en la proyección de Galería B.'
      : 'Imagen visible con claridad en la proyección de Galería B.');
  } catch (error) {
    console.error('[Museum projection media]', error);
    this._say(`El archivo se cargó pero no pudo mostrarse en la proyección: ${String(error?.message || error)}`, true);
  }
};

window.__MUSEUM_VIDEO_ENTITY_MEDIA = { findProjectionSurface, showAssetOnProjection };

export { findProjectionSurface, showAssetOnProjection };
