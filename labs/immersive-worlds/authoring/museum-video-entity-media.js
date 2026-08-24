import { StudioShell } from './studio/studio-shell.js';
import { showFileOnArtwork } from './museum-visible-media.js';

/**
 * Gallery B gate — VIDEO entity media adapter.
 *
 * The canonical Museum world contains `entity.video.cuaderno-de-luz` as
 * `kind: VIDEO`, while Full Studio currently exposes replaceable media only for
 * ARTWORK and PROJECTION. This adapter proves the missing contract without
 * changing Studio's global schema yet: VIDEO receives the same image/video
 * MediaVault flow and the same live surface replacement already Human-PASS in
 * Gallery A.
 */

const IMAGE_SLOT = 'ARTWORK_IMAGE';
const VIDEO_SLOT = 'ARTWORK_VIDEO';

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
      <p class="st-note">Esta pantalla admite una imagen fija o un vídeo. El archivo se muestra inmediatamente en la sala, sin reconstruir el Museo.</p>
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
    const result = await showFileOnArtwork(entity.id, file);
    this._say(result.isVideo
      ? 'Vídeo visible y reproduciéndose en la pantalla de Galería B.'
      : 'Imagen visible en la pantalla de Galería B.');
  } catch (error) {
    console.error('[Museum VIDEO entity media]', error);
    this._say(`El archivo se cargó pero no pudo mostrarse en la pantalla: ${String(error?.message || error)}`, true);
  }
};

window.__MUSEUM_VIDEO_ENTITY_MEDIA = { installVideoControls };

export { installVideoControls };
