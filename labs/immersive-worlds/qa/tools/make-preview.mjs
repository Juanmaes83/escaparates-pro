/**
 * Builds a single self-contained HTML file of the Museum experience.
 *
 * Why this exists: implementation runs in an ephemeral container, so a
 * `127.0.0.1` URL reaches nobody. A reviewer needs to *walk the room*, not read
 * a screenshot. This produces one file with the module, its styles, the world
 * record and the whole collection embedded, which can be opened from anywhere
 * with no server, no network and no integration into the product.
 *
 * It is a packaging step only. It does not modify the module: the same
 * `app/experience-app.js` that `index.html` boots is what runs here.
 *
 *   node labs/immersive-worlds/qa/tools/make-preview.mjs
 */
import { build } from 'esbuild';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = path.join(ROOT, 'preview', 'museum-preview.html');

const MIME = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webm': 'video/webm', '.mp4': 'video/mp4' };

const dataUri = async (file) => {
  const buffer = await fs.readFile(file);
  return `data:${MIME[path.extname(file)] || 'application/octet-stream'};base64,${buffer.toString('base64')}`;
};

// -- module ------------------------------------------------------------------
// One inline module. The published page runs under a strict CSP that blocks
// every external request, so nothing may remain as a separate file.
const bundled = await build({
  entryPoints: [path.join(ROOT, 'app', 'experience-app.js')],
  bundle: true,
  format: 'iife',
  globalName: 'IWPreview',
  minify: true,
  legalComments: 'none',
  write: false,
  target: ['chrome110', 'firefox110', 'safari16']
});
const script = bundled.outputFiles[0].text;

const styles = await fs.readFile(path.join(ROOT, 'app', 'ui', 'styles.css'), 'utf8');
const world = JSON.parse(await fs.readFile(path.join(ROOT, 'worlds', 'museum-v1.world.json'), 'utf8'));

// -- collection --------------------------------------------------------------
// Keyed by the path a world file refers to, so the lookup below can work from
// whatever absolute URL the loader resolves against the hosting page.
const collectionDir = path.join(ROOT, 'assets', 'collection');
const media = {};
for (const name of (await fs.readdir(collectionDir)).filter((f) => MIME[path.extname(f)])) {
  media[`assets/collection/${name}`] = await dataUri(path.join(collectionDir, name));
}

// QA / camera-review states only.
//
// The numbered tour is NOT listed here. It is derived at runtime from
// runtime.tour, which is grouped from the one authoritative order in the world
// file. A hand-written sequence beside that order is exactly what drifted for
// eleven checkpoints before the Tour Control Pass — see
// TOUR_ORDER_AUDIT_BEFORE.md.
const QA_STATES = [
  ['museum:lobby-entry', 'Vestíbulo'],
  ['museum:gallery-a-overview', 'Galería A — eje'],
  ['museum:gallery-a-oblique', 'Galería A — diagonal'],
  ['museum:artwork-horizonte-focus', 'Foco: Horizonte interrumpido'],
  ['museum:sculpture-detail', 'Foco: Vasija de arenas'],
  ['museum:portal-a-b-before', 'Umbral A → B'],
  ['museum:portal-a-b-after', 'Galería B — cámara oscura'],
  ['museum:archive-teleport', 'Archivo — sala de escucha'],
  ['museum:guide-released', 'Cesión: visitante solo con la obra'],
  ['museum:guide-turnaround', 'GUÍA — vuelta de personaje']
];

const html = `<title>Immersive Worlds — Fundación Arenas (IW-3 visual checkpoint)</title>
<style>
${styles}

/* Preview scaffolding only. Not part of the experience, and not a proposal for
   one: it exists so a reviewer can reach a named state without a query string,
   and it gets out of the way with the same key that dismisses it. */
#iw-preview {
  position: fixed; left: 0; bottom: 0; z-index: 9000;
  font: 400 11px/1.5 'Helvetica Neue', Helvetica, Arial, sans-serif;
  color: #cfc9be; background: rgba(10, 9, 8, .88);
  border-top: 1px solid rgba(240, 236, 228, .14); border-right: 1px solid rgba(240, 236, 228, .14);
  padding: 8px 10px 10px; max-width: min(94vw, 640px);
  backdrop-filter: blur(6px);
}
#iw-preview[hidden] { display: none !important; }
/* Focus is the state whose whole point is that nothing competes with the work,
   and the wall label sits exactly here. Scaffolding stands down; Esc brings the
   room, and this panel, back. */
body[data-focused="true"] #iw-preview { display: none; }
#iw-preview h2 { font: 400 9px/1 inherit; letter-spacing: .34em; text-transform: uppercase; color: #8d8579; margin: 0 0 8px; }
#iw-preview button {
  font: inherit; color: #e8e3d9; background: transparent; cursor: pointer;
  border: 1px solid rgba(240, 236, 228, .2); padding: 4px 8px; margin: 0 4px 4px 0;
}
#iw-preview button:hover { border-color: rgba(240, 236, 228, .55); }
#iw-preview p { margin: 6px 0 0; color: #8d8579; }

/* The numbered tour and the QA states are different kinds of thing, so they are
   not allowed to look like the same kind of thing. Tour chips carry a number
   and a progress state; QA chips are quieter, unnumbered and set apart under
   their own heading. Before this pass they were one undifferentiated wall of
   twenty-one identical buttons. */
#iw-tour { display: flex; flex-wrap: wrap; gap: 4px; }
#iw-tour button {
  display: inline-flex; align-items: baseline; gap: 7px; margin: 0;
  border-color: rgba(240, 236, 228, .16); color: #9d968a;
}
#iw-tour button .n {
  font-variant-numeric: tabular-nums; letter-spacing: .08em;
  font-size: 10px; color: #6f6961;
}
#iw-tour button[data-progress="COMPLETED"] { color: #cfc9be; border-color: rgba(240, 236, 228, .26); }
#iw-tour button[data-progress="COMPLETED"] .n::after { content: ' ✓'; color: #8d8579; }
#iw-tour button[data-progress="NEXT"] { color: #e8e3d9; border-color: rgba(240, 236, 228, .42); }
#iw-tour button[data-progress="CURRENT"] {
  color: #14110d; background: #e8e3d9; border-color: #e8e3d9; font-weight: 600;
  box-shadow: 0 0 0 2px rgba(232, 227, 217, .28);
}
#iw-tour button[data-progress="CURRENT"] .n { color: #14110d; }
#iw-tour-transport { display: flex; align-items: center; gap: 6px; margin-top: 8px; flex-wrap: wrap; }
#iw-tour-transport button[disabled] { opacity: .34; cursor: default; }
#iw-tour-transport button[disabled]:hover { border-color: rgba(240, 236, 228, .2); }
#iw-tour-where { color: #8d8579; margin-left: 2px; }
#iw-preview h2.iw-qa-heading { margin-top: 12px; padding-top: 9px; border-top: 1px solid rgba(240, 236, 228, .12); }
#iw-preview-states button { color: #9d968a; border-style: dashed; }
</style>

<main id="iw-stage">
  <canvas id="iw-canvas" tabindex="0" aria-label="Vista tridimensional de la sala. El contenido completo está disponible en texto desde el botón «Contenido en texto»."></canvas>
</main>
<div id="iw-ui"></div>

<aside id="iw-preview" hidden>
  <h2>Visita guiada</h2>
  <div id="iw-tour"></div>
  <div id="iw-tour-transport">
    <button id="iw-tour-prev" type="button">&#8592; Anterior</button>
    <button id="iw-tour-play" type="button">Reproducir desde aqu&iacute;</button>
    <button id="iw-tour-next" type="button">Siguiente &#8594;</button>
    <button id="iw-tour-exit" type="button">Salir del recorrido</button>
    <span id="iw-tour-where"></span>
  </div>
  <h2 class="iw-qa-heading">Estados de revisi&oacute;n / QA &middot; fuera del recorrido</h2>
  <div id="iw-preview-states"></div>
  <p>Andar: <b>W A S D</b> · mirar: ratón (clic para capturar) o <b>←/→</b> · obra: <b>E</b> · salir: <b>Esc</b> · plano: <b>M</b> · recorrido: <b>G</b> · zoom en detalle: rueda · obra siguiente en detalle: <b>←/→</b> · ocultar este panel: <b>P</b></p>
</aside>

<script type="module">
// -------------------------------------------------------------------------
// Offline shim. The module fetches its world file and loads the collection by
// URL, exactly as it does when served. Nothing is served here, so both are
// answered from what this file already carries. The module itself is unchanged.
// -------------------------------------------------------------------------
const WORLD = ${JSON.stringify(world)};
const MEDIA = ${JSON.stringify(media)};

const localFor = (value) => {
  const key = Object.keys(MEDIA).find((suffix) => String(value).includes(suffix));
  return key ? MEDIA[key] : null;
};

const realFetch = window.fetch.bind(window);
window.fetch = (input, init) => {
  const url = String(input?.url || input);
  if (url.includes('.world.json')) {
    return Promise.resolve(new Response(JSON.stringify(WORLD), {
      status: 200, headers: { 'content-type': 'application/json' }
    }));
  }
  const local = localFor(url);
  if (local) return realFetch(local, init);
  return realFetch(input, init);
};

// Images and video are assigned by \`src\`, not fetched, so the translation has
// to happen at the property.
for (const proto of [HTMLImageElement.prototype, HTMLMediaElement.prototype]) {
  const descriptor = Object.getOwnPropertyDescriptor(proto, 'src');
  Object.defineProperty(proto, 'src', {
    ...descriptor,
    set(value) { descriptor.set.call(this, localFor(value) || value); }
  });
}

${script}

const panel = document.getElementById('iw-preview');

/* == the numbered tour ======================================================
 * Drawn from runtime.tour, which is grouped from route.chapterRefs ->
 * chapter.stepRefs in the world file. This panel holds no sequence of its own,
 * so it cannot disagree with the tour: reordering the world reorders this, and
 * a step added to the route appears here without anyone editing this file.
 * ========================================================================= */
function buildTourPanel() {
  const rt = window.__IW.runtime;
  const tour = rt.tour;
  const list = document.getElementById('iw-tour');
  const where = document.getElementById('iw-tour-where');
  const prevBtn = document.getElementById('iw-tour-prev');
  const nextBtn = document.getElementById('iw-tour-next');
  const playBtn = document.getElementById('iw-tour-play');
  const exitBtn = document.getElementById('iw-tour-exit');
  if (!tour) return;

  const chips = new Map();
  for (const step of tour.steps) {
    const button = document.createElement('button');
    button.type = 'button';
    // Visible number is presentation. Identity is the step id, and it is what
    // every handler and every test uses, so re-titling a step never moves it.
    button.innerHTML = '<span class="n">' + String(step.order).padStart(2, '0') + '</span><span>' + step.title + '</span>';
    button.title = step.title + ' — ' + step.beatIds.length + ' beat(s): ' + step.beatIds.join(', ');
    button.onclick = () => go(() => rt.goToTourStep(step.id));
    list.appendChild(button);
    chips.set(step.id, button);
  }

  /** Progress is read from the Director, never from which button was clicked. */
  function render() {
    const current = rt.experience.currentTourStep;
    const order = current ? current.order : 0;
    for (const step of tour.steps) {
      const chip = chips.get(step.id);
      chip.dataset.progress = !order ? 'UNVISITED'
        : step.order < order ? 'COMPLETED'
        : step.order === order ? 'CURRENT'
        : step.order === order + 1 ? 'NEXT'
        : 'UNVISITED';
      chip.setAttribute('aria-current', step.order === order ? 'step' : 'false');
    }
    const running = Boolean(current);
    prevBtn.disabled = !running || !current.previousId;
    nextBtn.disabled = !running || !current.nextId;
    playBtn.textContent = rt.experience.transport === 'PLAYING' ? 'Pausar' : 'Reproducir desde aquí';
    exitBtn.disabled = !running;
    where.textContent = running
      ? 'Parada ' + String(current.order).padStart(2, '0') + ' de ' + String(tour.steps.length).padStart(2, '0')
        + ' · beat ' + (rt.experience.index + 1) + '/' + rt.experience.steps.length
      : 'Recorrido detenido';
  }

  /** One door for every tour control, so none of them can drift from the rest. */
  let busy = false;
  async function go(action) {
    if (busy) return;
    busy = true;
    window.__IW.hud.el.veil.hidden = true;
    const director = rt.experience;
    const authored = director.reducedMotion;
    director.reducedMotion = true;
    try {
      await action();
    } finally {
      director.reducedMotion = authored;
      busy = false;
    }
    await settleCamera();
    render();
    window.__IW.input.setEnabled(true);
    window.__IW.audio.resume?.().then(() => {
      const space = rt.store.require(rt.state.activeSpaceId);
      window.__IW.audio.setAmbience(space.ambience);
    }).catch(() => {});
    document.getElementById('iw-canvas').focus();
  }

  prevBtn.onclick = () => go(() => rt.experience.previousTourStep());
  nextBtn.onclick = () => go(() => rt.experience.nextTourStep());
  exitBtn.onclick = () => { rt.exitRoute(); render(); };
  playBtn.onclick = () => {
    const director = rt.experience;
    if (director.transport === 'PLAYING') director.pause();
    else if (director.transport === 'PAUSED') director.resume();
    else rt.startRoute(rt.defaultRouteId);
    render();
  };

  // Every path into a step ends in a ROUTE_STEP event — the automatic tour, the
  // keyboard, these buttons — so subscribing here is what keeps the panel
  // honest instead of it tracking its own idea of what is selected.
  rt.bus.on('route:step', render);
  rt.bus.on('experience:completed', render);
  rt.bus.on('experience:paused', render);
  rt.bus.on('experience:resumed', render);
  rt.bus.on('route:started', render);
  render();
}

/* == QA / review states ===================================================== */
const list = document.getElementById('iw-preview-states');
for (const [id, label] of ${JSON.stringify(QA_STATES)}) {
  const button = document.createElement('button');
  button.textContent = label;
  button.onclick = async () => {
    // applyState is a QA entry point: it parks the input and leaves the entry
    // veil up, because a capture never had to walk out of the state. A reviewer
    // does, so the veil comes down and movement goes back to them. The click is
    // a user gesture, which is also what the audio context needs.
    window.__IW.hud.el.veil.hidden = true;
    const rt = window.__IW.runtime;
    if (rt.state.mode === 'GUIDED') rt.exitRoute();
    if (rt.state.focusedEntityId) rt.releaseFocus();
    const director = rt.experience;
    const authoredMotion = director.reducedMotion;
    director.reducedMotion = true;
    try {
      await window.__IW.applyState(id);
    } finally {
      director.reducedMotion = authoredMotion;
    }
    await settleCamera();
    window.__IW.input.setEnabled(true);
    window.__IW.audio.resume?.().then(() => {
      const space = rt.store.require(rt.state.activeSpaceId);
      window.__IW.audio.setAmbience(space.ambience);
    }).catch(() => {});
    document.getElementById('iw-canvas').focus();
  };
  list.appendChild(button);
}

/** Resolve once the camera has stopped moving and authority has settled. */
async function settleCamera() {
  const camera = window.__IW.renderHost.camera;
  let last = camera.position.clone();
  for (let i = 0; i < 120; i += 1) {
    await new Promise((resolve) => requestAnimationFrame(resolve));
    const moved = camera.position.distanceTo(last);
    last = camera.position.clone();
    if (i > 4 && moved < 0.0008 && window.__IW.runtime.camera.owner !== 'TRANSITION') return;
  }
}

/**
 * Candidate selector — review scaffolding only. The visitor never sees this and
 * nothing semantic knows it exists; it swaps the Scene Kit's guide geometry so
 * three design languages can be judged under identical light and staging.
 *
 * Built after boot, never before. window.__IW is created *inside* boot(), so
 * reading it at module scope throws before a single frame is drawn and the whole
 * page renders blank — which is exactly what it did.
 */
function buildDesignSelector() {
  const designs = document.createElement('div');
  designs.style.cssText = 'margin-top:8px;padding-top:8px;border-top:1px solid rgba(240,236,228,.14)';
  designs.innerHTML = '<h2>Diseño del guía</h2>';
  for (const d of window.__IW.runtime.sceneKit.guideDesigns()) {
    const button = document.createElement('button');
    button.textContent = d.id + ' · ' + d.label + ' · ' + Math.round(d.height * 100) + ' cm';
    if (d.id === 'B') button.style.borderColor = 'rgba(240,236,228,.75)';
    button.onclick = () => {
      window.__IW.runtime.sceneKit.setGuideDesign(d.id);
      for (const other of designs.querySelectorAll('button')) other.style.borderColor = 'rgba(240,236,228,.2)';
      button.style.borderColor = 'rgba(240,236,228,.75)';
    };
    designs.appendChild(button);
  }
  panel.appendChild(designs);
}

addEventListener('keydown', (event) => {
  if (event.code === 'KeyP') panel.hidden = !panel.hidden;
});

IWPreview.boot()
  .then(() => { buildTourPanel(); buildDesignSelector(); panel.hidden = false; })
  .catch((error) => {
    console.error('[IW] boot failed', error);
    document.getElementById('iw-ui').innerHTML =
      '<div style="position:absolute;inset:0;display:grid;place-items:center;padding:2rem;background:#0a0908">' +
      '<div style="max-width:34rem"><p style="font:400 .7rem/1 sans-serif;letter-spacing:.4em;text-transform:uppercase;color:#a49d92">Fundación Arenas</p>' +
      '<h1 style="font:400 1.4rem/1.3 Georgia,serif;margin:1.4rem 0">No se pudo iniciar la sala</h1>' +
      '<p style="font:400 .86rem/1.7 sans-serif;color:#cfc9be">Este prototipo requiere WebGL2.</p>' +
      '<pre style="margin-top:1.4rem;padding:1rem;border:1px solid rgba(240,236,228,.16);font-size:.74rem;color:#a49d92;white-space:pre-wrap">' +
      String(error?.message || error) + '</pre></div></div>';
  });
</script>
`;

await fs.mkdir(path.dirname(OUT), { recursive: true });
await fs.writeFile(OUT, html);
console.log(`${path.relative(process.cwd(), OUT)}  ${(Buffer.byteLength(html) / 1024 / 1024).toFixed(2)} MB`);
