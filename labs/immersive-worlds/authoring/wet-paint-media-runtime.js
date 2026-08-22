import { MuseumSceneKit } from '../scene-kits/museum/museum-scene-kit.js';
import { StudioShell } from './studio/studio-shell.js';
import { applyConfigToWorld } from './experience-config.js';

/**
 * Wet Paint itinerant receiver — live media seam.
 *
 * Museum already knows how to decode image/video and turn them into Three.js
 * textures. The missing seam was replacing an already-built ARTWORK plate with
 * that texture. Rebooting the whole Museum for a file change is unnecessary and
 * was the source of the unreliable authoring preview.
 *
 * This adapter is intentionally scoped to the itinerant lab. It does not change
 * Museum's stable MediaLoader, RenderHost or world contract.
 */

function artworkPlate(record) {
  const entityGroup = record?.object;
  const framedWork = entityGroup?.children?.[0];
  if (!framedWork) return null;
  return framedWork.children?.find((child) =>
    child?.isMesh && child.geometry?.type === 'PlaneGeometry' && child.material?.map
  ) || null;
}

MuseumSceneKit.prototype.replaceArtworkMedia = async function replaceArtworkMedia(entityId, media) {
  if (!media?.src) throw new Error(`No media source for ${entityId}`);
  const record = this._entityIndex?.get(entityId);
  if (!record) throw new Error(`Artwork is not built: ${entityId}`);
  const plate = artworkPlate(record);
  if (!plate) throw new Error(`Artwork plate not found: ${entityId}`);
  if (!this.mediaLoader) throw new Error('Museum MediaLoader is not available');

  // Load first. The current picture remains visible until the replacement is
  // proven decodable, so a bad upload can never blank the wall.
  const loaded = await this.mediaLoader.load(media, { entityId });
  if (!loaded?.texture || loaded.fallback) {
    throw new Error(`Museum could not decode media for ${entityId}`);
  }

  const previousSrc = this._mediaRefs?.get(entityId) || null;
  plate.material.map = loaded.texture;
  plate.material.needsUpdate = true;
  this._mediaRefs?.set(entityId, media.src);

  // Release the old loader reference only after the new texture is on the wall.
  if (previousSrc && previousSrc !== media.src) this.mediaLoader.release(previousSrc);

  return {
    entityId,
    kind: media.kind,
    src: media.src,
    aspect: loaded.aspect || null,
    playing: loaded.video ? loaded.video.paused === false : null
  };
};

async function hotApplySelectedMedia(studio) {
  const entityId = studio.selectedId;
  const sourceEntity = (studio.world.entities || []).find((entity) => entity.id === entityId);
  if (!sourceEntity || sourceEntity.kind !== 'ARTWORK') return null;

  // Reuse Museum's canonical config→world adapter. This prevents this lab from
  // inventing a second media schema or second precedence rule for image/video.
  const authoredWorld = applyConfigToWorld(
    studio.world,
    studio.config,
    (reference) => studio.vault.resolve(reference)
  );
  const authoredEntity = authoredWorld.entities.find((entity) => entity.id === entityId);
  const media = authoredEntity?.content?.media;
  if (!media?.src) return null;

  const sceneKit = window.__IW?.runtime?.sceneKit;
  if (!sceneKit?.replaceArtworkMedia) throw new Error('Live Museum media seam is unavailable');
  return sceneKit.replaceArtworkMedia(entityId, media);
}

const originalTakeFile = StudioShell.prototype._takeFile;
StudioShell.prototype._takeFile = async function wetPaintTakeFile(slot, file) {
  await originalTakeFile.call(this, slot, file);

  // Failed decoder states remain visible in the ordinary Studio slot; do not
  // turn them into a second error from the live seam.
  const selected = this.config.entities?.[this.selectedId];
  const authored = selected?.video || selected?.image;
  const asset = authored?.assetId ? this.vault.get(authored.assetId) : null;
  if (!asset || asset.state !== 'READY') return;

  try {
    const result = await hotApplySelectedMedia(this);
    if (!result) return;
    const detail = result.kind === 'VIDEO'
      ? (result.playing ? 'Vídeo reproduciéndose en la obra.' : 'Vídeo visible; el primer gesto puede iniciar la reproducción.')
      : 'Imagen visible en la obra.';
    this._say(`${detail} Cambio aplicado directamente, sin reconstruir el museo.`);
  } catch (error) {
    console.error('[Wet Paint live media]', error);
    this._say(`El archivo se cargó, pero no llegó a la obra: ${String(error?.message || error)}`, true);
  }
};

export { hotApplySelectedMedia };
