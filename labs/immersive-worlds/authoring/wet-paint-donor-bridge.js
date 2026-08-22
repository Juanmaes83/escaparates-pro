import { THREE } from '../render/render-host.js';
import { StudioShell } from './studio/studio-shell.js';
import { findArtworkPlate } from './wet-paint-visible-media.js';

const ORIGINAL_ID = 'entity.itinerant.original';
const PAINTERLY_ID = 'entity.itinerant.painterly';
const HOST_URL = './capabilities/wet-paint-flow/host.html';

let iframe = null;
let overlay = null;
let toggle = null;
let donorReady = false;
let outputTexture = null;
let outputCanvas = null;
let raf = 0;
let lastFileName = '';

function ensureUi() {
  if (iframe) return iframe;

  iframe = document.createElement('iframe');
  iframe.id = 'oreja-wet-paint-runtime';
  iframe.src = HOST_URL;
  iframe.title = 'OREJA · RUBIK SOTA — Wet Paint';
  Object.assign(iframe.style, {
    width: 'min(1440px, 94vw)', height: 'min(900px, 88vh)', border: '0',
    background: '#d9d9d4', display: 'block'
  });

  overlay = document.createElement('div');
  overlay.id = 'oreja-wet-paint-overlay';
  Object.assign(overlay.style, {
    position: 'fixed', inset: '0', zIndex: '2147483000', display: 'none',
    placeItems: 'center', background: 'rgba(13,13,13,.72)', backdropFilter: 'blur(8px)',
    padding: '3vh 3vw'
  });

  const shell = document.createElement('div');
  Object.assign(shell.style, {
    position: 'relative', width: 'min(1440px,94vw)', height: 'min(900px,88vh)',
    background: '#d9d9d4', boxShadow: '0 32px 90px rgba(0,0,0,.42)', overflow: 'hidden'
  });

  const close = document.createElement('button');
  close.type = 'button';
  close.textContent = 'Cerrar';
  close.setAttribute('aria-label', 'Cerrar controles Wet Paint');
  Object.assign(close.style, {
    position: 'absolute', right: '12px', top: '12px', zIndex: '5', border: '1px solid rgba(0,0,0,.22)',
    borderRadius: '999px', background: 'rgba(242,242,239,.94)', color: '#171717', padding: '9px 14px',
    cursor: 'pointer', font: '600 12px/1 system-ui,sans-serif'
  });
  close.addEventListener('click', () => { overlay.style.display = 'none'; });

  shell.append(iframe, close);
  overlay.append(shell);
  document.body.append(overlay);

  toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.id = 'oreja-wet-paint-controls';
  toggle.textContent = 'OREJA · RUBIK SOTA · WET PAINT';
  Object.assign(toggle.style, {
    position: 'fixed', left: '18px', bottom: '18px', zIndex: '2147482000',
    border: '1px solid rgba(255,255,255,.28)', borderRadius: '999px', background: 'rgba(20,20,20,.88)',
    color: '#f1f1ed', padding: '10px 14px', cursor: 'pointer', letterSpacing: '.08em',
    font: '600 10px/1 system-ui,sans-serif', backdropFilter: 'blur(10px)'
  });
  toggle.addEventListener('click', () => { overlay.style.display = 'grid'; });
  document.body.append(toggle);

  window.addEventListener('message', (event) => {
    if (event.origin !== location.origin || event.source !== iframe.contentWindow) return;
    if (event.data?.type === 'OREJA_WET_PAINT_READY') {
      donorReady = true;
      toggle.dataset.ready = 'true';
      toggle.textContent = 'OREJA · RUBIK SOTA · WET PAINT ✓';
      console.log('[Wet Paint donor bridge] donor ready');
    }
    if (event.data?.type === 'OREJA_WET_PAINT_ERROR') {
      donorReady = false;
      toggle.dataset.error = 'true';
      toggle.textContent = 'WET PAINT · ERROR';
      console.error('[Wet Paint donor bridge]', event.data.message);
    }
  });

  return iframe;
}

async function waitForDonor(timeoutMs = 15000) {
  ensureUi();
  const started = performance.now();
  while (performance.now() - started < timeoutMs) {
    const api = iframe?.contentWindow?.__OREJA_WET_PAINT;
    if (donorReady && api?.ready) return api;
    await new Promise((resolve) => setTimeout(resolve, 80));
  }
  throw new Error('Wet Paint donor no estuvo listo dentro del tiempo esperado');
}

function painterlyPlate() {
  const sceneKit = window.__IW?.runtime?.sceneKit;
  if (!sceneKit) throw new Error('MuseumSceneKit no disponible');
  return findArtworkPlate(sceneKit, PAINTERLY_ID);
}

function bindCanvasToPainterly(canvas) {
  if (!canvas) throw new Error('El donor no expone canvas de salida');
  if (outputCanvas === canvas && outputTexture) return outputTexture;

  outputTexture?.dispose?.();
  outputCanvas = canvas;
  outputTexture = new THREE.CanvasTexture(canvas);
  outputTexture.colorSpace = THREE.SRGBColorSpace;
  outputTexture.minFilter = THREE.LinearFilter;
  outputTexture.magFilter = THREE.LinearFilter;
  outputTexture.generateMipmaps = false;

  const plate = painterlyPlate();
  plate.material.map = outputTexture;
  plate.material.needsUpdate = true;
  plate.userData.orejaWetPaintDonor = { donor: 'Juanmaes83/wet-paint-flow', canvas };
  return outputTexture;
}

function startTexturePump() {
  if (raf) return;
  const tick = () => {
    raf = requestAnimationFrame(tick);
    if (!outputTexture || !outputCanvas) return;
    outputTexture.needsUpdate = true;
    try {
      const plate = painterlyPlate();
      if (plate.material.map !== outputTexture) {
        plate.material.map = outputTexture;
        plate.material.needsUpdate = true;
      }
    } catch { /* Museum may be rebuilding; next frame retries. */ }
  };
  raf = requestAnimationFrame(tick);
}

async function processOriginalFile(file) {
  if (!file || !String(file.type || '').startsWith('image/')) return false;
  const api = await waitForDonor();
  await api.loadFile(file);

  // Donor decodes asynchronously. Wait until its real output canvas exists and is sized.
  const started = performance.now();
  let canvas = null;
  while (performance.now() - started < 12000) {
    canvas = api.getCanvas?.();
    if (canvas && canvas.width > 1 && canvas.height > 1) break;
    await new Promise((resolve) => setTimeout(resolve, 80));
  }
  if (!canvas || canvas.width < 2) throw new Error('Wet Paint donor no produjo canvas');

  bindCanvasToPainterly(canvas);
  startTexturePump();
  lastFileName = file.name || 'imagen';
  api.replay?.();
  console.log(`[Wet Paint donor bridge] ${lastFileName} → donor real → 02 PAINTERLY`);
  return true;
}

ensureUi();

// Chain AFTER wet-paint-visible-media.js: Museum keeps its normal upload/catalogue/01 ORIGINAL behavior,
// then this seam forwards only ORIGINAL images to the real pinned donor.
const previousTakeFile = StudioShell.prototype._takeFile;
StudioShell.prototype._takeFile = async function wetPaintDonorTakeFile(slot, file) {
  await previousTakeFile.call(this, slot, file);
  if (!file || this.selectedId !== ORIGINAL_ID) return;
  if (!String(file.type || '').startsWith('image/')) return;

  try {
    this._say('Original listo. Procesando con la piedra Wet Paint real…');
    await processOriginalFile(file);
    this._say('02 Painterly conectado al Wet Paint Flow real.');
  } catch (error) {
    console.error('[Wet Paint donor bridge]', error);
    this._say(`Original cargado, pero Wet Paint no pudo procesarlo: ${String(error?.message || error)}`, true);
  }
};

window.__OREJA_WET_PAINT_BRIDGE = {
  processOriginalFile,
  openControls() { ensureUi(); overlay.style.display = 'grid'; },
  closeControls() { if (overlay) overlay.style.display = 'none'; },
  replay() { iframe?.contentWindow?.__OREJA_WET_PAINT?.replay?.(); },
  get donorReady() { return donorReady; },
  get lastFileName() { return lastFileName; },
  get outputCanvas() { return outputCanvas; }
};

console.log('[Wet Paint donor bridge] installed — stone-first / pinned donor');
