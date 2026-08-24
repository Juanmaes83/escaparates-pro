import { StudioShell } from './studio/studio-shell.js';

/**
 * Gallery B VIDEO surface adapter — V2.
 *
 * `Cuaderno de luz` is a canonical VIDEO entity. MediaVault owns its object URL;
 * Museum MediaLoader owns decode/cache/playback; this adapter only targets the
 * real screen mesh. No second File decode and no second object URL are created.
 */

const IMAGE_SLOT = 'ARTWORK_IMAGE';
const VIDEO_SLOT = 'ARTWORK_VIDEO';

function findVideoScreen(sceneKit, entityId) {
  const record = sceneKit?._entityIndex?.get(entityId);
  const root = record?.object;
  if (!root) throw new Error(`No existe la pantalla renderizada: ${entityId}`);

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

  if (!best || bestArea < 0.25) throw new Error(`No se encontró la superficie de pantalla de ${entityId}`);
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

function releaseLiveReference(sceneKit, entityId, screen) {
  const previousSrc = screen.userData?.museumVideoScreenSrc;
  if (!previousSrc) return;
  sceneKit.mediaLoader?.release?.(previousSrc);
  if (sceneKit._mediaRefs?.get?.(entityId) === previousSrc) sceneKit._mediaRefs.delete(entityId);
  delete screen.userData.museumVideoScreenSrc;
}

async function showAssetOnVideoScreen(entityId, asset) {
  const sceneKit = window.__IW?.runtime?.sceneKit;
  if (!sceneKit?.mediaLoader) throw new Error('Museum MediaLoader no está disponible.');
  if (!asset?.url || asset.state !== 'READY') throw new Error('El asset todavía no está READY.');

  const screen = findVideoScreen(sceneKit, entityId);
  const result = await sceneKit.mediaLoader.load(mediaSpecFromAsset(asset), { entityId });
  if (!result?.texture || result.fallback) throw new Error('MediaLoader no pudo producir una textura válida para la pantalla.');

  releaseLiveReference(sceneKit, entityId, screen);
  screen.material.map = result.texture;
  screen.material.needsUpdate = true;
  screen.userData.museumVideoScreenSrc = asset.url;
  sceneKit._mediaRefs?.set?.(entityId, asset.url);

  return {
    entityId,
    isVideo: asset.kind === 'video',
    screen,
    playing: result.video ? !result.video.paused : null
  };
}

/** Compatibility seam for any historical caller; V2 Studio uses asset-based API. */
async function showFileOnVideoScreen(entityId, file) {
  const url = URL.createObjectURL(file);
  const asset = {
    state: 'READY', url,
    kind: String(file?.type || '').startsWith('video/') || /\.(mp4|m4v|webm)$/i.test(file?.name || '') ? 'video' : 'image',
    width: 0, height: 0
  };
  return showAssetOnVideoScreen(entityId, asset);
}

function installVideoControls(studio) {
  const entity = studio.selectedEntity;
  if (entity?.kind !== 'VIDEO') return;

  const editor = studio.root?.querySelector('.st-ed');
  if (!editor || editor.querySelector('[data-video-entity-media]')) return;

  const block = document.createElement('section');
  block.className = 'st-g';
  block.dataset.videoEntityMedia = '1';
  block.innerHTML = `
    <div class="st-gh" style="cursor:default"><span>Medios · pantalla</span></div>
    <div class="st-gb">
      <p class="st-note">Esta pantalla admite imagen o vídeo. El archivo se carga una vez en la biblioteca y se presenta en la pantalla real.</p>
      <div class="st-slot">
        <div class="st-slothead"><span class="st-l">Imagen de la pantalla</span><span class="st-h">JPG, PNG o WebP</span></div>
        <div class="st-slotrow"><label class="st-file"><input type="file" data-video-upload="${IMAGE_SLOT}" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"><span>Elegir archivo</span></label></div>
      </div>
      <div class="st-slot">
        <div class="st-slothead"><span class="st-l">Vídeo de la pantalla</span><span class="st-h">MP4 o WebM</span></div>
        <div class="st-slotrow"><label class="st-file"><input type="file" data-video-upload="${VIDEO_SLOT}" accept=".mp4,.m4v,.webm,video/mp4,video/webm"><span>Elegir archivo</span></label></div>
      </div>
    </div>`;

  for (const input of block.querySelectorAll('[data-video-upload]')) {
    input.addEventListener('change', async (event) => {
      const file = event.currentTarget.files?.[0];
      if (!file) return;
      await studio._takeFile(event.currentTarget.dataset.videoUpload, file);
    });
  }

  editor.appendChild(block);
}

const originalRender = StudioShell.prototype.render;
StudioShell.prototype.render = function museumVideoEntityRender(...args) {
  const result = originalRender.apply(this, args);
  installVideoControls(this);
  return result;
};

const previousTakeFile = StudioShell.prototype._takeFile;
StudioShell.prototype._takeFile = async function museumVideoEntityTakeFile(slot, file) {
  await previousTakeFile.call(this, slot, file);
  if (!file) return;

  const entity = (this.world.entities || []).find((item) => item.id === this.selectedId);
  if (entity?.kind !== 'VIDEO') return;

  const authored = this.config?.entities?.[entity.id] || {};
  const media = authored.video?.assetId ? authored.video : authored.image?.assetId ? authored.image : null;
  const asset = media?.assetId ? this.vault?.get?.(media.assetId) : null;

  try {
    if (!asset) throw new Error('El archivo no está disponible en MediaVault.');
    const result = await showAssetOnVideoScreen(entity.id, asset);
    this._say(result.isVideo
      ? 'Vídeo visible y reproduciéndose en la pantalla de Galería B.'
      : 'Imagen visible en la pantalla de Galería B.');
  } catch (error) {
    console.error('[Museum VIDEO screen media]', error);
    this._say(`El archivo se cargó pero no pudo mostrarse en la pantalla: ${String(error?.message || error)}`, true);
  }
};

window.__MUSEUM_VIDEO_ENTITY_MEDIA = { installVideoControls, findVideoScreen, showAssetOnVideoScreen, showFileOnVideoScreen };

export { installVideoControls, findVideoScreen, showAssetOnVideoScreen, showFileOnVideoScreen };
