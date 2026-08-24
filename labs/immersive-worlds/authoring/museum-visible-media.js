import { THREE } from '../render/render-host.js';
import { StudioShell } from './studio/studio-shell.js';

/**
 * Museum Media Contract — live ARTWORK visibility seam.
 *
 * Donor lineage: the Human-PASS Wet Paint Studio receiver. This module removes
 * the Wet Paint ownership from the capability: any Museum ARTWORK selected in
 * Full Studio can receive an image or video immediately without rebuilding the
 * Museum. The durable MediaVault/config pipeline remains owned by Studio.
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

function waitForImage(file) {
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

function waitForVideo(file) {
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

function releasePrevious(plate) {
  const previous = plate.userData?.museumLiveMedia;
  if (!previous) return;
  try { previous.video?.pause?.(); } catch { /* noop */ }
  try { previous.texture?.dispose?.(); } catch { /* noop */ }
  if (previous.url) URL.revokeObjectURL(previous.url);
  delete plate.userData.museumLiveMedia;
}

async function showFileOnArtwork(entityId, file) {
  const sceneKit = window.__IW?.runtime?.sceneKit;
  if (!sceneKit) throw new Error('MuseumSceneKit no está disponible.');
  const plate = findArtworkPlate(sceneKit, entityId);

  let resource;
  let texture;
  let video = null;
  const isVideo = String(file?.type || '').startsWith('video/') || /\.(mp4|m4v|webm)$/i.test(file?.name || '');

  if (isVideo) {
    resource = await waitForVideo(file);
    video = resource.video;
    texture = new THREE.VideoTexture(video);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
  } else {
    resource = await waitForImage(file);
    texture = new THREE.Texture(resource.image);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    texture.needsUpdate = true;
  }

  releasePrevious(plate);
  plate.material.map = texture;
  plate.material.needsUpdate = true;
  plate.userData.museumLiveMedia = { texture, url: resource.url, video };

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

  return { entityId, isVideo, plateArea: plate.geometry.parameters.width * plate.geometry.parameters.height };
}

const originalTakeFile = StudioShell.prototype._takeFile;
StudioShell.prototype._takeFile = async function museumVisibilityTakeFile(slot, file) {
  await originalTakeFile.call(this, slot, file);
  if (!file) return;

  const entityId = this.selectedId;
  const entity = (this.world.entities || []).find((item) => item.id === entityId);
  if (entity?.kind !== 'ARTWORK') return;

  try {
    const result = await showFileOnArtwork(entityId, file);
    this._say(result.isVideo
      ? 'Vídeo visible en la obra. No se ha reconstruido el museo.'
      : 'Imagen visible en la obra. No se ha reconstruido el museo.');
  } catch (error) {
    console.error('[Museum visible media]', error);
    this._say(`El archivo se cargó pero no pudo dibujarse en la obra: ${String(error?.message || error)}`, true);
  }
};

window.__MUSEUM_VISIBLE_MEDIA = { showFileOnArtwork, findArtworkPlate };

export { showFileOnArtwork, findArtworkPlate };
