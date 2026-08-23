import { StudioShell } from './studio/studio-shell.js';

/**
 * Wet Paint itinerant lab — reliable central media inspector.
 *
 * Mission: prove the authoring contract the human reviewer actually needs:
 *   upload/select image or video -> see it immediately in the centre.
 *
 * This adapter is intentionally scoped to wet-paint-studio.html. It does not
 * modify Museum's renderer, scene kit, media loader or semantic World model.
 * MediaVault already owns a proven blob URL after READY; the inspector consumes
 * that URL directly instead of rebuilding the whole Museum just to inspect a
 * file.
 */

const STYLE_ID = 'wp-media-inspector-css';
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[c]));

function ensureStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .wp-media-inspector {
      position: absolute;
      inset: 0;
      z-index: 30;
      display: grid;
      grid-template-rows: auto minmax(0, 1fr);
      background: #090909;
      border: 1px solid rgba(236,231,221,.18);
      pointer-events: auto;
      overflow: hidden;
    }
    .wp-media-inspector__bar {
      min-height: 42px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 7px 10px 7px 12px;
      background: rgba(16,15,14,.96);
      border-bottom: 1px solid rgba(236,231,221,.14);
      color: #ece7dd;
      font: 400 11px/1.25 system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    .wp-media-inspector__bar span { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .wp-media-inspector__bar b { font-weight: 600; }
    .wp-media-inspector__bar i { margin-left: 8px; color: #9a9389; font-style: normal; }
    .wp-media-inspector__close,
    .wp-media-view-button {
      border: 1px solid rgba(236,231,221,.28);
      background: transparent;
      color: #ece7dd;
      border-radius: 999px;
      padding: 5px 10px;
      font: 500 10px/1 system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      letter-spacing: .08em;
      text-transform: uppercase;
      cursor: pointer;
      white-space: nowrap;
    }
    .wp-media-inspector__close:hover,
    .wp-media-view-button:hover { background: rgba(236,231,221,.1); }
    .wp-media-inspector__body {
      min-width: 0;
      min-height: 0;
      display: grid;
      place-items: center;
      background: #050505;
      overflow: hidden;
    }
    .wp-media-inspector__body img,
    .wp-media-inspector__body video {
      display: block;
      width: 100%;
      height: 100%;
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      background: #050505;
    }
    .wp-media-inspector__body video { outline: none; }
    .st-lib .st-mitem { cursor: pointer; }
    .st-lib .st-mitem .wp-media-view-button { margin-top: 7px; }
  `;
  document.head.appendChild(style);
}

function authoredDescriptor(studio, media) {
  if (!media) return null;
  const asset = media.assetId ? studio.vault.get(media.assetId) : null;
  if (asset) {
    if (asset.state !== 'READY' || !asset.url) return null;
    return {
      kind: asset.kind === 'video' ? 'video' : 'image',
      url: asset.url,
      name: asset.name || media.name || 'Medio',
      width: asset.width || media.width || 0,
      height: asset.height || media.height || 0,
      duration: asset.duration || ((media.durationMs || 0) / 1000)
    };
  }

  if (!media.src || String(media.src).startsWith('authored:')) return null;
  return {
    kind: String(media.kind || '').toLowerCase() === 'video' ? 'video' : 'image',
    url: studio._projectUrl(media.src),
    name: media.name || media.src.split('/').pop() || 'Medio',
    width: media.width || 0,
    height: media.height || 0,
    duration: (media.durationMs || 0) / 1000
  };
}

function descriptorForEntity(studio, entityId) {
  const entity = (studio.world.entities || []).find((item) => item.id === entityId);
  if (!entity) return null;

  const draft = studio.config.entities?.[entityId] || {};
  // Slots are mutually exclusive in Studio, but prefer video if an old config
  // happens to contain both: motion should never silently collapse to a still.
  const authored = authoredDescriptor(studio, draft.video) || authoredDescriptor(studio, draft.image);
  if (authored) return authored;

  const own = entity.content?.media;
  if (!own?.src) return null;
  return {
    kind: own.kind === 'VIDEO' ? 'video' : 'image',
    url: studio._projectUrl(own.src),
    name: own.name || entity.content?.title || own.src.split('/').pop() || 'Medio',
    width: own.width || 0,
    height: own.height || 0,
    duration: own.duration || 0
  };
}

function descriptorForCatalogueItem(studio, item) {
  if (!item) return null;
  if (String(item.reference || '').startsWith('authored:')) {
    const id = item.reference.slice(9);
    const asset = studio.vault.get(id);
    if (!asset || asset.state !== 'READY' || !asset.url) return null;
    return {
      kind: asset.kind === 'video' ? 'video' : 'image',
      url: asset.url,
      name: asset.name || item.name || 'Medio',
      width: asset.width || item.width || 0,
      height: asset.height || item.height || 0,
      duration: asset.duration || ((item.durationMs || 0) / 1000)
    };
  }

  if (!item.url) return null;
  return {
    kind: item.kind === 'video' ? 'video' : 'image',
    url: item.url,
    name: item.name || 'Medio',
    width: item.width || 0,
    height: item.height || 0,
    duration: (item.durationMs || 0) / 1000
  };
}

function setPreview(studio, descriptor) {
  studio.__wpMediaPreview = descriptor || null;
  mountInspector(studio);
}

function clearPreview(studio) {
  studio.__wpMediaPreview = null;
  studio.root?.querySelector('.wp-media-inspector')?.remove();
}

function mountInspector(studio) {
  // MUSEUM CHANGE: the 2D media-inspector overlay is retired. It covered the live
  // 3D room (hiding the Wet Paint result on the plates) and, being pointer-opaque,
  // swallowed clicks on the room's navigation arrows. The centre now always shows
  // the live 3D room; any existing overlay is removed and none is mounted.
  const stage = studio.root?.querySelector('.st-stage');
  stage?.querySelector('.wp-media-inspector')?.remove();
  return;
  /* eslint-disable no-unreachable */
  // eslint-disable-next-line no-constant-condition
  if (!stage) return;
  stage.querySelector('.wp-media-inspector')?.remove();

  const media = studio.__wpMediaPreview;
  if (!media?.url) return;

  const dims = media.width && media.height ? `${media.width}×${media.height}` : '';
  const duration = media.kind === 'video' && media.duration ? `${Number(media.duration).toFixed(1)} s` : '';
  const facts = [media.kind === 'video' ? 'VÍDEO' : 'IMAGEN', dims, duration].filter(Boolean).join(' · ');

  const viewer = document.createElement('section');
  viewer.className = 'wp-media-inspector';
  viewer.setAttribute('aria-label', `Vista previa de ${media.name}`);
  viewer.innerHTML = `
    <div class="wp-media-inspector__bar">
      <span><b>${esc(media.name)}</b><i>${esc(facts)}</i></span>
      <button type="button" class="wp-media-inspector__close">Volver a la sala</button>
    </div>
    <div class="wp-media-inspector__body">
      ${media.kind === 'video'
    ? `<video src="${esc(media.url)}" controls autoplay muted loop playsinline preload="auto"></video>`
    : `<img src="${esc(media.url)}" alt="${esc(media.name)}">`}
    </div>`;

  viewer.querySelector('.wp-media-inspector__close')?.addEventListener('click', () => clearPreview(studio));
  stage.appendChild(viewer);

  if (media.kind === 'video') {
    const video = viewer.querySelector('video');
    video?.play?.().catch(() => { /* controls remain available for a user gesture */ });
  }
}

function installEntityPreviewClicks(studio) {
  for (const button of studio.root?.querySelectorAll('[data-node]') || []) {
    if (button.dataset.wpPreviewBound === '1') continue;
    button.dataset.wpPreviewBound = '1';
    button.addEventListener('click', () => {
      // Studio's own listener updates selectedId and may re-render synchronously.
      // Run after that turn so the preview follows the actual selected record.
      setTimeout(() => {
        const descriptor = descriptorForEntity(studio, studio.selectedId);
        if (descriptor) setPreview(studio, descriptor);
        else clearPreview(studio);
      }, 0);
    });
  }
}

function installLibraryPreviewClicks(studio) {
  const cards = [...(studio.root?.querySelectorAll('.st-lib .st-mitem') || [])];
  if (!cards.length) return;
  const catalogue = studio.catalogue?.items || [];

  for (const card of cards) {
    if (card.dataset.wpPreviewBound === '1') continue;
    const name = card.querySelector('.st-mmeta > b')?.textContent?.trim();
    const item = catalogue.find((candidate) => candidate.name === name);
    if (!item) continue;
    card.dataset.wpPreviewBound = '1';

    const show = (event) => {
      if (event?.target?.closest?.('[data-reuse]')) return;
      const descriptor = descriptorForCatalogueItem(studio, item);
      if (descriptor) setPreview(studio, descriptor);
    };
    card.addEventListener('click', show);

    const meta = card.querySelector('.st-mmeta');
    if (meta && !meta.querySelector('.wp-media-view-button')) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'wp-media-view-button';
      button.textContent = 'Ver en centro';
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        show(event);
      });
      meta.appendChild(button);
    }
  }
}

const originalRender = StudioShell.prototype.render;
StudioShell.prototype.render = function wetPaintInspectorRender(...args) {
  const result = originalRender.apply(this, args);
  ensureStyle();
  mountInspector(this);
  installEntityPreviewClicks(this);
  installLibraryPreviewClicks(this);
  return result;
};

const originalTakeFile = StudioShell.prototype._takeFile;
StudioShell.prototype._takeFile = async function wetPaintInspectorTakeFile(slot, file) {
  await originalTakeFile.call(this, slot, file);
  if (!file) return;
  const descriptor = descriptorForEntity(this, this.selectedId);
  if (!descriptor) return;
  setPreview(this, descriptor);
  this.message = descriptor.kind === 'video'
    ? 'Vídeo cargado y visible en el centro.'
    : 'Imagen cargada y visible en el centro.';
  this.messageBad = false;
  this._refreshLive?.();
};

const originalReuse = StudioShell.prototype._reuse;
StudioShell.prototype._reuse = function wetPaintInspectorReuse(reference, slot) {
  const result = originalReuse.call(this, reference, slot);
  const item = this.catalogue?.items?.find((candidate) => candidate.reference === reference);
  const descriptor = descriptorForCatalogueItem(this, item);
  if (descriptor) setPreview(this, descriptor);
  return result;
};

// In this dedicated media lab, the historic full reboot behind "Vista previa"
// is deliberately disabled. Human QA proved that repeated reboots can leave the
// central canvas black. Media inspection is now immediate; rebuilding the whole
// application is neither necessary nor desirable for this mission.
StudioShell.prototype._apply = async function wetPaintInspectorApply() {
  this.busy = 'apply';
  this.render();
  const descriptor = descriptorForEntity(this, this.selectedId);
  if (descriptor) setPreview(this, descriptor);
  this.busy = null;
  this.message = descriptor
    ? 'Vista previa de medios actualizada sin reconstruir Museum.'
    : 'No hay un medio seleccionado para previsualizar.';
  this.messageBad = !descriptor;
  this.render();
};

window.__WET_PAINT_MEDIA_INSPECTOR = {
  descriptorForEntity,
  setPreview,
  clearPreview
};

export { descriptorForEntity, setPreview, clearPreview };
