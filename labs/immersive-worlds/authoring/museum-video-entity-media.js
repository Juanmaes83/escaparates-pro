import { THREE } from '../render/render-host.js';
import { StudioShell } from './studio/studio-shell.js';

/**
 * Gallery B VIDEO surface adapter.
 *
 * `Cuaderno de luz` is not an ARTWORK. MuseumSceneKit builds it as a bezel +
 * PlaneGeometry screen driven by a VideoTexture. The previous recovery adapter
 * reused the generic artwork-surface heuristic; that was enough to accept the
 * file but not reliable enough to target the screen itself. This adapter resolves
 * the canonical screen directly and swaps only its live texture.
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
    // The video panel is the large plane in the VIDEO entity. The neighbouring
    // label is also a plane but is much smaller.
    if (area > bestArea) {
      best = node;
      bestArea = area;
    }
  });

  if (!best || bestArea < 0.25) throw new Error(`No se encontró la superficie de pantalla de ${entityId}`);
  return best;
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => resolve({ url, image });
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('La imagen seleccionada no pudo abrirse.'));
    };
    image.src = url;
  });
}

function loadVideo(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.addEventListener('loadeddata', () => resolve({ url, video }), { once: true });
    video.addEventListener('error', () => {
      URL.revokeObjectURL(url);
      reject(new Error('El vídeo seleccionado no pudo abrirse. Usa MP4 H.264 o WebM.'));
    }, { once: true });
    video.src = url;
    video.load();
  });
}

function releasePrevious(screen) {
  const previous = screen.userData?.museumVideoScreenMedia;
  if (!previous) return;
  try { previous.video?.pause?.(); } catch { /* noop */ }
  try { previous.texture?.dispose?.(); } catch { /* noop */ }
  if (previous.url) URL.revokeObjectURL(previous.url);
  delete screen.userData.museumVideoScreenMedia;
}

async function showFileOnVideoScreen(entityId, file) {
  const sceneKit = window.__IW?.runtime?.sceneKit;
  if (!sceneKit) throw new Error('MuseumSceneKit no está disponible.');
  const screen = findVideoScreen(sceneKit, entityId);
  const isVideo = String(file?.type || '').startsWith('video/') || /\.(mp4|m4v|webm)$/i.test(file?.name || '');

  let resource;
  let texture;
  let video = null;
  if (isVideo) {
    resource = await loadVideo(file);
    video = resource.video;
    texture = new THREE.VideoTexture(video);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
  } else {
    resource = await loadImage(file);
    texture = new THREE.Texture(resource.image);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    texture.needsUpdate = true;
  }

  releasePrevious(screen);
  const generated = screen.material?.map;
  // The synthetic fallback texture is owned by the Scene Kit animation registry.
  // We only detach it from this screen; the room lifecycle remains responsible
  // for disposing its own generated resources.
  screen.material.map = texture;
  screen.material.needsUpdate = true;
  screen.userData.museumVideoScreenMedia = { texture, url: resource.url, video, replacedMap: generated };

  if (video) {
    try {
      await video.play();
    } catch {
      const start = () => {
        video.play().finally(() => {
          window.removeEventListener('pointerdown', start);
          window.removeEventListener('keydown', start);
        });
      };
      window.addEventListener('pointerdown', start, { once: true });
      window.addEventListener('keydown', start, { once: true });
    }
  }

  return { entityId, isVideo, screen };
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
      <p class="st-note">Esta pantalla admite una imagen fija o un vídeo. El archivo se muestra inmediatamente en la pantalla real de Galería B, sin reconstruir el Museo.</p>
      <div class="st-slot">
        <div class="st-slothead"><span class="st-l">Imagen de la pantalla</span><span class="st-h">JPG, PNG o WebP</span></div>
        <div class="st-slotrow">
          <label class="st-file"><input type="file" data-video-upload="${IMAGE_SLOT}" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"><span>Elegir archivo</span></label>
        </div>
      </div>
      <div class="st-slot">
        <div class="st-slothead"><span class="st-l">Vídeo de la pantalla</span><span class="st-h">MP4 o WebM</span></div>
        <div class="st-slotrow">
          <label class="st-file"><input type="file" data-video-upload="${VIDEO_SLOT}" accept=".mp4,.m4v,.webm,video/mp4,video/webm"><span>Elegir archivo</span></label>
        </div>
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

  try {
    const result = await showFileOnVideoScreen(entity.id, file);
    this._say(result.isVideo
      ? 'Vídeo visible y reproduciéndose en la pantalla de Galería B.'
      : 'Imagen visible en la pantalla de Galería B.');
  } catch (error) {
    console.error('[Museum VIDEO screen media]', error);
    this._say(`El archivo se cargó pero no pudo mostrarse en la pantalla: ${String(error?.message || error)}`, true);
  }
};

window.__MUSEUM_VIDEO_ENTITY_MEDIA = { installVideoControls, findVideoScreen, showFileOnVideoScreen };

export { installVideoControls, findVideoScreen, showFileOnVideoScreen };
