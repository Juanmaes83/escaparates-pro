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

const STATES = [
  ['museum:gallery-a-overview', 'Galería A — eje'],
  ['museum:gallery-a-oblique', 'Galería A — diagonal'],
  ['museum:artwork-horizonte-focus', 'Foco: Horizonte interrumpido'],
  ['museum:sculpture-detail', 'Foco: Vasija de arenas'],
  ['museum:portal-a-b-before', 'Umbral A → B'],
  ['museum:portal-a-b-after', 'Galería B — cámara oscura'],
  ['museum:archive-teleport', 'Archivo — sala de escucha'],
  ['museum:guide-accompanied', 'GUÍA — acompañado (sobre el hombro)'],
  ['museum:guide-handoff', 'GUÍA — cesión'],
  ['museum:guide-released', 'GUÍA — visitante solo'],
  ['museum:guided-step-04', 'Recorrido comentado — parada 4'],
  ['museum:lobby-entry', 'Vestíbulo']
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
</style>

<main id="iw-stage">
  <canvas id="iw-canvas" tabindex="0" aria-label="Vista tridimensional de la sala. El contenido completo está disponible en texto desde el botón «Contenido en texto»."></canvas>
</main>
<div id="iw-ui"></div>

<aside id="iw-preview" hidden>
  <h2>Checkpoint IW-3 · saltos de estado</h2>
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
const list = document.getElementById('iw-preview-states');
for (const [id, label] of ${JSON.stringify(STATES)}) {
  const button = document.createElement('button');
  button.textContent = label;
  button.onclick = async () => {
    // applyState is a QA entry point: it parks the input and leaves the entry
    // veil up, because a capture never had to walk out of the state. A reviewer
    // does, so the veil comes down and movement goes back to them. The click is
    // a user gesture, which is also what the audio context needs.
    window.__IW.hud.el.veil.hidden = true;
    await window.__IW.applyState(id);
    window.__IW.input.setEnabled(true);
    window.__IW.audio.resume?.().then(() => {
      const space = window.__IW.runtime.store.require(window.__IW.runtime.state.activeSpaceId);
      window.__IW.audio.setAmbience(space.ambience);
    }).catch(() => {});
    document.getElementById('iw-canvas').focus();
  };
  list.appendChild(button);
}
addEventListener('keydown', (event) => {
  if (event.code === 'KeyP') panel.hidden = !panel.hidden;
});

IWPreview.boot()
  .then(() => { panel.hidden = false; })
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
