import { StudioShell } from './studio/studio-shell.js';

/**
 * Museum Media Contract — live ARTWORK visibility seam.
 *
 * V2 rule: MediaVault owns the object URL and MediaLoader owns decoding/cache.
 * This seam never creates a second object URL and never owns/disposes a loader
 * texture. The same src is also written into WorldStore by the canonical binding
 * module, so a room rebuilt by SpaceLifecycle sees the same media declaration.
 */

function findArtworkPlate(sceneKit, entityId) {
  const record = sceneKit?._entityIndex?.get(entityId);
  const root = record?.object;
  if (!root) throw new Error(`No existe la obra renderizada: ${entityId}`);

  let best = null;
  let bestArea = 0;
  root.traverse?.((node) => {
    if (!node?.isMesh || node.geometry?.type !== 'PlaneGeometry' || !node.material) return;
    const p = node.geometry.parameters || {};
    const area = Number(p.width || 0) * Number(p.height || 0);
    if (area > bestArea) {
      best = node;
      bestArea = area;
    }
  });

  if (!best || bestArea < 0.25) throw new Error(`No se encontró la superficie visual de ${entityId}`);
  return best;
}

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
  const previousSrc = surface.userData?.museumLiveMediaSrc;
  if (!previousSrc) return;
  sceneKit.mediaLoader?.release?.(previousSrc);
  if (sceneKit._mediaRefs?.get?.(entityId) === previousSrc) sceneKit._mediaRefs.delete(entityId);
  delete surface.userData.museumLiveMediaSrc;
}

async function showAssetOnArtwork(entityId, asset) {
  const sceneKit = window.__IW?.runtime?.sceneKit;
  if (!sceneKit?.mediaLoader) throw new Error('Museum MediaLoader no está disponible.');
  if (!asset?.url || asset.state !== 'READY') throw new Error('El asset todavía no está READY.');

  const plate = findArtworkPlate(sceneKit, entityId);
  const result = await sceneKit.mediaLoader.load(mediaSpecFromAsset(asset), { entityId });
  if (!result?.texture || result.fallback) throw new Error('MediaLoader no pudo producir una textura válida.');

  releaseLiveReference(sceneKit, entityId, plate);
  plate.material.map = result.texture;
  plate.material.needsUpdate = true;
  plate.userData.museumLiveMediaSrc = asset.url;
  // SceneKit disposal already understands this map and releases the reference.
  sceneKit._mediaRefs?.set?.(entityId, asset.url);

  return {
    entityId,
    isVideo: asset.kind === 'video',
    plateArea: plate.geometry.parameters.width * plate.geometry.parameters.height,
    playing: result.video ? !result.video.paused : null
  };
}

/** Compatibility seam for older callers; the V2 Studio uses showAssetOnArtwork. */
async function showFileOnArtwork(entityId, file) {
  const url = URL.createObjectURL(file);
  const asset = {
    state: 'READY', url,
    kind: String(file?.type || '').startsWith('video/') || /\.(mp4|m4v|webm)$/i.test(file?.name || '') ? 'video' : 'image',
    width: 0, height: 0
  };
  try {
    return await showAssetOnArtwork(entityId, asset);
  } finally {
    // MediaLoader may still own the URL through its cache; do not revoke here.
  }
}

const originalTakeFile = StudioShell.prototype._takeFile;
StudioShell.prototype._takeFile = async function museumVisibilityTakeFile(slot, file) {
  await originalTakeFile.call(this, slot, file);
  if (!file) return;

  const entityId = this.selectedId;
  const entity = (this.world.entities || []).find((item) => item.id === entityId);
  if (entity?.kind !== 'ARTWORK') return;

  const authored = this.config?.entities?.[entityId] || {};
  const media = authored.video?.assetId ? authored.video : authored.image?.assetId ? authored.image : null;
  const asset = media?.assetId ? this.vault?.get?.(media.assetId) : null;

  try {
    if (!asset) throw new Error('El archivo no está disponible en MediaVault.');
    const result = await showAssetOnArtwork(entityId, asset);
    this._say(result.isVideo
      ? 'Vídeo visible en la obra y enlazado al runtime actual.'
      : 'Imagen visible en la obra y enlazada al runtime actual.');
  } catch (error) {
    console.error('[Museum visible media]', error);
    this._say(`El archivo se cargó pero no pudo dibujarse en la obra: ${String(error?.message || error)}`, true);
  }
};

window.__MUSEUM_VISIBLE_MEDIA = { showAssetOnArtwork, showFileOnArtwork, findArtworkPlate };

export { showAssetOnArtwork, showFileOnArtwork, findArtworkPlate };
