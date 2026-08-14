/**
 * VS02 — visual capture of the Studio.
 *
 * Drives the real authoring workflow in a real browser and photographs what an
 * author sees. Every frame records what it expected and what it observed, so a
 * reviewer can disagree with the claim and not only with the picture.
 *
 * Runs one wave at a time (`--wave w1`) so the gauntlet can look, fix, and look
 * again without re-shooting everything each round.
 *
 *   node qa/tools/studio-capture.mjs --wave w1
 *   node qa/tools/studio-capture.mjs --wave full
 */
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

let transitions = [];
let routing = [];
const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};
const WAVE = arg('wave', 'w1');

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MODULE_ROOT = path.resolve(HERE, '..', '..');
const REPO_ROOT = path.resolve(MODULE_ROOT, '../..');
const OUT = path.join(MODULE_ROOT, 'qa', 'evidence-vs02', WAVE);
const PORT = Number(process.env.IW_VS02_PORT || 4700);
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webm': 'video/webm' };

const HEAD = execSync('git rev-parse --short HEAD', { cwd: REPO_ROOT }).toString().trim();
const RUN_ID = `vs02_${WAVE}_${Date.now().toString(36)}`;

const server = http.createServer(async (req, res) => {
  try {
    const d = decodeURIComponent((req.url || '/').split('?')[0]).replace(/^\/+/, '');
    let f = path.resolve(REPO_ROOT, d || 'index.html');
    if (!f.startsWith(REPO_ROOT)) return res.writeHead(403).end();
    if (fsSync.existsSync(f) && fsSync.statSync(f).isDirectory()) f = path.join(f, 'index.html');
    res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(await fs.readFile(f));
  } catch { res.writeHead(404).end(); }
});
await new Promise((r) => server.listen(PORT, '127.0.0.1', r));
await fs.mkdir(OUT, { recursive: true });
const BASE = `http://127.0.0.1:${PORT}/labs/immersive-worlds`;

const FIXTURES = path.join(MODULE_ROOT, 'qa', 'fixtures');
const browser = await chromium.launch({ headless: true, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox'] });
const shots = [];
const errors = [];

async function open(viewport, query) {
  const page = await browser.newPage({ viewport });
  page.setDefaultTimeout(300000);
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    const t = m.text();
    if (m.type() === 'error' || /failed validation|INV-\d/.test(t)) errors.push(t);
  });
  await page.goto(`${BASE}/index.html?${query}`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__IW?.ready === true, { timeout: 300000 });
  await page.evaluate(() => { if (window.__IW?.hud?.el?.veil) window.__IW.hud.el.veil.hidden = true; });
  await page.waitForTimeout(1200);
  return page;
}

const shoot = async (page, id, { state, action, expected, observed, viewport = '1440×900', museum = 'Fundación Arenas' }) => {
  const file = `${id}.png`;
  await page.screenshot({ path: path.join(OUT, file), timeout: 180000 });
  shots.push({ id, file, state, action, expected, observed, viewport, museum, head: HEAD, runId: RUN_ID, at: new Date().toISOString() });
  console.log(`  ${file} — ${state}`);
};

/** What the studio itself says is true, so a caption can be checked. */
const probe = (page) => page.evaluate(() => {
  const s = window.__IW_STUDIO;
  const canvas = document.getElementById('iw-canvas').getBoundingClientRect();
  return {
    selected: s?.selectedId,
    dirty: s?.dirty,
    readiness: s ? { state: s.readiness.state, ready: s.readiness.requiredReady, total: s.readiness.requiredTotal, headline: s.readiness.headline } : null,
    canvas: `${Math.round(canvas.width)}×${Math.round(canvas.height)}`,
    panels: document.querySelectorAll('#st').length,
    institution: window.__IW?.runtime?.store?.metadata?.institution
  };
});

/* == W1 — structure and hierarchy ========================================== */

if (WAVE === 'w1' || WAVE === 'full') {
  const page = await open({ width: 1440, height: 900 }, 'tier=HIGH&authoring=1');
  let p = await probe(page);
  await shoot(page, '02_VS02_DEFAULT', {
    state: 'Estudio recién abierto sobre el Museo por defecto',
    action: 'Abrir ?authoring=1',
    expected: 'La sala ocupa el centro a su propio tamaño; el editor no la tapa',
    observed: `lienzo ${p.canvas} · ${p.readiness.headline} · un solo estudio (${p.panels})`
  });

  await page.click('[data-node="space.gallery-a"]');
  await page.waitForTimeout(2600);
  p = await probe(page);
  await shoot(page, '03_EXPERIENCE_TREE', {
    state: 'Galería A seleccionada en el árbol',
    action: 'Clic en la sala «Galería A — Horizontes»',
    expected: 'El árbol muestra Institución → Exposición → Salas → Piezas y la vista previa camina hasta la sala',
    observed: `seleccionado ${p.selected} · lienzo ${p.canvas}`
  });

  await page.click('[data-node="entity.artwork.division-tercera"]');
  await page.waitForTimeout(1800);
  p = await probe(page);
  await shoot(page, '08_ARTWORK_SELECTED', {
    state: 'Una obra concreta seleccionada',
    action: 'Clic en «División tercera» dentro de Galería A',
    expected: 'El editor cambia a esa obra y dice de qué sala y soporte se trata',
    observed: `seleccionado ${p.selected}`
  });

  await page.click('[data-node="institution"]');
  await page.waitForTimeout(600);
  await page.fill('[data-bind="institution.name"]', 'Colección Marés');
  await page.fill('[data-bind="institution.claim"]', 'Obra sobre papel, 1949 — 1972');
  await page.waitForTimeout(400);
  p = await probe(page);
  await shoot(page, '04_INSTITUTION_EDIT', {
    state: 'Identidad institucional editada, sin aplicar',
    action: 'Escribir nombre y claim',
    expected: 'El encabezado y el árbol siguen al autor; el proyecto se marca sin guardar',
    observed: `sin guardar: ${p.dirty} · ${p.readiness.headline}`
  });

  const narrow = await open({ width: 420, height: 860 }, 'tier=HIGH&authoring=1');
  const np = await probe(narrow);
  const overflow = await narrow.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  await shoot(narrow, '25_NARROW_VIEW', {
    state: 'Estudio a 420 px',
    action: 'Abrir el estudio en viewport estrecho',
    expected: 'Sin desbordamiento horizontal; la sala sigue visible; los controles siguen alcanzables',
    observed: `lienzo ${np.canvas} · desbordamiento ${overflow}`,
    viewport: '420×860'
  });
  await narrow.close();

  // The baseline, at the same task and viewport, so the comparison is fair.
  const vs01 = await open({ width: 1440, height: 900 }, 'tier=HIGH&authoring=1&shell=vs01');
  await vs01.click('#au-open').catch(() => {});
  await vs01.waitForTimeout(900);
  await shoot(vs01, '01_VS01_BASELINE', {
    state: 'VS01 — el panel anterior, misma tarea y mismo viewport',
    action: 'Abrir ?authoring=1&shell=vs01 y abrir el editor',
    expected: 'Referencia de comparación, no un objetivo',
    observed: 'editor superpuesto sobre la sala'
  });
  await vs01.close();
  await page.close();
}

/* == W2 — media workflow, states, error and recovery ======================= */

if (WAVE === 'w2' || WAVE === 'full') {
  const page = await open({ width: 1440, height: 900 }, 'tier=HIGH&authoring=1');

  // Record every state the vault passes through. A frame can miss a fast
  // transition; the log cannot, and evidence that only shows the happy end of a
  // chain is evidence that the chain was never checked.
  await page.evaluate(() => {
    window.__STATES = [];
    const vault = window.__IW_VAULT;
    const inner = vault.onChange;
    vault.onChange = (asset) => {
      window.__STATES.push({ id: asset.id, kind: asset.kind, name: asset.name, state: asset.state, at: Date.now() });
      return inner(asset);
    };
  });

  /* -- the institution's mark ------------------------------------------------ */
  await page.click('[data-node="institution"]');
  await page.waitForTimeout(1500);

  const logoInput = '[data-media="INSTITUTION_LOGO"]';
  await page.setInputFiles(logoInput, path.join(FIXTURES, 'qa-logo.png'));
  await shoot(page, '05_LOGO_SELECTED', {
    state: 'Logotipo recién elegido — el fotograma inmediatamente posterior',
    action: 'Elegir qa-logo.png en la ranura del logotipo',
    expected: 'La ranura nombra el archivo y dibuja la cadena. Un PNG de 9 kB decodifica ' +
      'antes de que se pueda fotografiar: la cadena SELECCIONADO → CARGANDO → LISTO queda ' +
      'registrada en transitions[], no simulada aquí',
    observed: await page.textContent('[data-slot="INSTITUTION_LOGO"] .st-slotstate').catch(() => '—')
  });
  await page.waitForFunction(
    () => /Lista|no se pudo/.test(document.querySelector('[data-slot="INSTITUTION_LOGO"] .st-slotstate')?.textContent || ''),
    { timeout: 120000 }
  );
  await shoot(page, '07_LOGO_READY', {
    state: 'Logotipo listo',
    action: 'Esperar a que el archivo se decodifique',
    expected: 'Estado «Lista» con dimensiones reales; el paso «Guardado» sigue pendiente',
    observed: await page.textContent('[data-slot="INSTITUTION_LOGO"] .st-slotstate')
  });

  /* -- an artwork's image ---------------------------------------------------- */
  await page.click('[data-node="entity.artwork.horizonte-interrumpido"]');
  await page.waitForTimeout(2600);
  await page.fill('[data-bind="entities.entity.artwork.horizonte-interrumpido.title"]', 'Prueba de marea');
  await page.fill('[data-bind="entities.entity.artwork.horizonte-interrumpido.creator"]', 'Nuria Sendra');
  await shoot(page, '09_ARTWORK_EDIT', {
    state: 'Obra con metadatos del autor',
    action: 'Escribir título y autoría sobre los valores del registro',
    expected: 'Los campos pasan de «del registro» a valor propio; el árbol y la tira siguen el cambio',
    observed: (await probe(page)).selected
  });

  await page.setInputFiles('[data-media="ARTWORK_IMAGE"]', path.join(FIXTURES, 'qa-artwork.jpg'));
  await shoot(page, '10_IMAGE_SELECTED', {
    state: 'Imagen recién elegida — el fotograma inmediatamente posterior',
    action: 'Elegir qa-artwork.jpg',
    expected: 'La cadena real está en transitions[]; a 37 kB la decodificación no dura lo ' +
      'que tarda una captura',
    observed: await page.textContent('[data-slot="ARTWORK_IMAGE"] .st-slotstate').catch(() => '—')
  });
  await page.waitForFunction(
    () => /Lista|no se pudo/.test(document.querySelector('[data-slot="ARTWORK_IMAGE"] .st-slotstate')?.textContent || ''),
    { timeout: 120000 }
  );
  await shoot(page, '12_IMAGE_READY', {
    state: 'Imagen lista',
    action: 'Esperar la decodificación',
    expected: 'Dimensiones reales del archivo del autor',
    observed: await page.textContent('[data-slot="ARTWORK_IMAGE"] .st-slotstate')
  });

  /* -- the projection's video ------------------------------------------------ */
  await page.click('[data-node="entity.video.cuaderno-de-luz"]');
  await page.waitForTimeout(2600);
  await page.setInputFiles('[data-media="PROJECTION_MEDIA"]', path.join(FIXTURES, 'qa-video.webm'));
  // A video is the one medium slow enough to photograph mid-chain.
  await page.waitForTimeout(250);
  await shoot(page, '13_VIDEO_SELECTED', {
    state: 'Vídeo recién elegido en la proyección',
    action: 'Elegir qa-video.webm en la pieza «Cuaderno de luz»',
    expected: 'La ranura pertenece a la proyección, no a un lienzo enmarcado',
    observed: await page.textContent('[data-slot="PROJECTION_MEDIA"] .st-slotstate').catch(() => '—')
  });
  await page.waitForFunction(
    () => /Listo|no se pudo/.test(document.querySelector('[data-slot="PROJECTION_MEDIA"] .st-slotstate')?.textContent || ''),
    { timeout: 180000 }
  );
  await shoot(page, '14_VIDEO_READY', {
    state: 'Vídeo listo',
    action: 'Esperar a decodificar y poder dibujar un fotograma',
    expected: 'Cadena con paso DECODIFICADO propio del vídeo, y duración real',
    observed: await page.textContent('[data-slot="PROJECTION_MEDIA"] .st-slotstate')
  });

  /* -- the error path, and the way out --------------------------------------- */
  await page.click('[data-node="entity.artwork.campo-de-ceniza"]');
  await page.waitForTimeout(2000);
  await page.setInputFiles('[data-media="ARTWORK_IMAGE"]', path.join(FIXTURES, 'qa-not-media.txt'));
  await page.waitForFunction(
    () => /no se pudo|admitido/i.test(document.querySelector('[data-slot="ARTWORK_IMAGE"] .st-slotstate')?.textContent || ''),
    { timeout: 60000 }
  );
  await shoot(page, '23_INVALID_MEDIA_ERROR', {
    state: 'Archivo no admitido',
    action: 'Elegir qa-not-media.txt como imagen de la obra',
    expected: 'Motivo legible y una salida ofrecida, sin fallo silencioso',
    observed: await page.textContent('[data-slot="ARTWORK_IMAGE"] .st-slotstate')
  });

  await page.setInputFiles('[data-media="ARTWORK_IMAGE"]', path.join(FIXTURES, 'qa-artwork.jpg'));
  await page.waitForFunction(
    () => /Lista/.test(document.querySelector('[data-slot="ARTWORK_IMAGE"] .st-slotstate')?.textContent || ''),
    { timeout: 120000 }
  );
  await shoot(page, '24_RECOVERY', {
    state: 'Recuperado con un archivo válido',
    action: 'Volver a elegir, esta vez qa-artwork.jpg',
    expected: 'El error desaparece y la pieza queda lista',
    observed: await page.textContent('[data-slot="ARTWORK_IMAGE"] .st-slotstate')
  });

  transitions = await page.evaluate(() => window.__STATES);
  await page.close();
}

/* == W3 + W4 — save, preview, start, and the second institution ============ */

if (WAVE === 'w3' || WAVE === 'full') {
  const page = await open({ width: 1440, height: 900 }, 'tier=HIGH&authoring=1');

  // Author a complete institution: identity, mark, one artwork, one projection.
  await page.click('[data-node="institution"]');
  await page.waitForTimeout(1400);
  await page.fill('[data-bind="institution.name"]', 'Colección Marés');
  await page.fill('[data-bind="institution.claim"]', 'Obra sobre papel, 1949 — 1972');
  await page.fill('[data-bind="institution.dates"]', '1949 — 1972');
  await page.setInputFiles('[data-media="INSTITUTION_LOGO"]', path.join(FIXTURES, 'qa-logo.png'));
  await page.waitForFunction(() => /Lista/.test(document.querySelector('[data-slot="INSTITUTION_LOGO"] .st-slotstate')?.textContent || ''), { timeout: 120000 });

  await page.click('[data-node="entity.artwork.horizonte-interrumpido"]');
  await page.waitForTimeout(2600);
  await page.fill('[data-bind="entities.entity.artwork.horizonte-interrumpido.title"]', 'Prueba de marea');
  await page.fill('[data-bind="entities.entity.artwork.horizonte-interrumpido.creator"]', 'Nuria Sendra');
  await page.setInputFiles('[data-media="ARTWORK_IMAGE"]', path.join(FIXTURES, 'qa-artwork.jpg'));
  await page.waitForFunction(() => /Lista/.test(document.querySelector('[data-slot="ARTWORK_IMAGE"] .st-slotstate')?.textContent || ''), { timeout: 120000 });

  await page.click('[data-node="entity.video.cuaderno-de-luz"]');
  await page.waitForTimeout(2600);
  await page.setInputFiles('[data-media="PROJECTION_MEDIA"]', path.join(FIXTURES, 'qa-video.webm'));
  await page.waitForFunction(() => /Listo/.test(document.querySelector('[data-slot="PROJECTION_MEDIA"] .st-slotstate')?.textContent || ''), { timeout: 180000 });

  await page.click('[data-act="save"]');
  await page.waitForTimeout(700);
  await shoot(page, '15_CONFIG_SAVED', {
    state: 'Proyecto guardado',
    action: 'Pulsar GUARDAR',
    expected: 'La cabecera pasa de «Cambios sin guardar» a una hora de guardado; ' +
      'GUARDADO se completa en la cadena del archivo — guardar el proyecto no es lo mismo que decodificar un archivo',
    observed: await page.textContent('[data-role=saved]')
  });

  await page.click('[data-act="validate"]');
  await page.waitForTimeout(600);
  let p = await probe(page);
  await shoot(page, '16_PROJECT_READY', {
    state: 'Validación del proyecto',
    action: 'Pulsar VALIDAR',
    expected: 'Recuento por dominios, obligatorio frente a opcional, y una sola frase de estado',
    observed: `${p.readiness.state} · ${p.readiness.headline}`
  });

  // APPLY: the authored project, shown in the docked Museum.
  await page.evaluate(() => { if (window.__IW) window.__IW.ready = false; });
  await page.click('[data-act="apply"]');
  await page.waitForFunction(() => window.__IW?.ready === true, { timeout: 300000 });
  await page.evaluate(() => { window.__IW.hud.el.veil.hidden = true; });
  await page.waitForTimeout(2200);
  await shoot(page, '17_PREVIEW_APPLIED', {
    state: 'Vista previa aplicada',
    action: 'Pulsar VISTA PREVIA',
    expected: 'La sala muestra el proyecto autorizado y el estudio sigue presente',
    observed: `institución en el mundo: ${(await probe(page)).institution}`
  });

  routing = await page.evaluate(() => window.__IW.runtime.store.entities
    .filter((e) => String(e.content?.media?.src || '').startsWith('blob:'))
    .map((e) => `${e.id} · ${e.kind} · ${e.content.media.kind}`));

  // The entry wall is where identity and mark actually land.
  // Setting a pose does not change rooms. The first version of this frame set the
  // vestíbulo's pose while the preview was standing in Galería B, and captioned
  // the result "the entry wall" — a caption the picture did not support.
  await page.evaluate(async () => {
    const rt = window.__IW.runtime;
    for (const id of ['portal.gallery-b-gallery-a', 'portal.gallery-a-lobby']) {
      if (rt.state.activeSpaceId === 'space.lobby') break;
      try { await rt.traversePortal(id, { source: 'QA' }); } catch { /* */ }
    }
    // The engine already knows how to frame its own records. Asking it beats
    // hand-authoring a pose that drifts the moment the viewport changes shape.
    try {
      const pose = rt.framingFor('entity.lobby.bienvenida', 'FOCUS');
      rt.camera.request('EXPLORE', { reason: 'qa:identity-wall', durationMs: 0, endPose: pose });
      rt.explore.setPose({ position: pose.position, yaw: Math.atan2(
        pose.target[0] - pose.position[0], pose.target[2] - pose.position[2]
      ), pitch: 0 });
    } catch {
      rt.explore.setPose({ position: [-0.9, 1.62, -8.6], yaw: Math.PI, pitch: -0.015 });
    }
  });
  await page.waitForTimeout(1600);
  await shoot(page, '17b_IDENTITY_ON_WALL', {
    state: 'La cartela de entrada, con la identidad autorizada',
    action: 'Mirar la pared del vestíbulo tras aplicar',
    expected: 'Claim, fechas, firma institucional y la marca impresa sobre el claim',
    observed: await page.evaluate(() => window.__IW.runtime.state.activeSpaceId)
  });

  // START: not another Apply. The studio leaves and the visitor's experience begins.
  await page.click('[data-act="start"]');
  await page.waitForTimeout(2400);
  const started = await page.evaluate(() => ({
    studio: document.querySelectorAll('#st').length,
    docked: document.body.dataset.studio || 'off',
    canvas: Math.round(document.getElementById('iw-canvas').getBoundingClientRect().width),
    topbar: !!document.querySelector('.iw-topbar'),
    url: location.search
  }));
  await shoot(page, '18_VISITOR_START', {
    state: 'Experiencia del visitante',
    action: 'Pulsar EMPEZAR EXPERIENCIA',
    expected: 'El estudio desaparece, el lienzo vuelve a la ventana completa y ' +
      'la navegación del visitante regresa. Sin restos de autoría',
    observed: `estudios ${started.studio} · acoplado ${started.docked} · lienzo ${started.canvas}px · ` +
      `barra del visitante ${started.topbar} · url ${started.url}`
  });
  await page.close();

  /* -- the second institution, on the same engine ---------------------------- */
  const b = await open({ width: 1440, height: 900 }, 'tier=HIGH&authoring=1');
  await b.evaluate(async () => {
    const config = await fetch('./authoring/museum-b.config.json').then((r) => r.json());
    if (window.__IW) window.__IW.ready = false;
    await window.__IW_STUDIO.onApply(config);
  });
  await b.waitForFunction(() => window.__IW?.ready === true, { timeout: 300000 });
  await b.evaluate(() => { window.__IW.hud.el.veil.hidden = true; });
  await b.waitForTimeout(2200);
  await shoot(b, '21_MUSEUM_B', {
    state: 'Museo de la Bruma — segunda institución',
    action: 'Abrir la configuración de la segunda institución',
    expected: 'Otra identidad, otras cartelas y otro árbol, sin tocar una línea del motor',
    observed: `institución en el mundo: ${(await probe(b)).institution}`,
    museum: 'Museo de la Bruma'
  });
  await b.close();

  const back = await open({ width: 1440, height: 900 }, 'tier=HIGH&authoring=1');
  await shoot(back, '22_RESTORED_ORIGINAL', {
    state: 'Fundación Arenas, intacta',
    action: 'Abrir el estudio sin configuración guardada',
    expected: 'El Museo que se envía vuelve palabra por palabra',
    observed: `institución en el mundo: ${(await probe(back)).institution}`
  });
  await back.close();
}

await fs.writeFile(path.join(OUT, 'capture.json'), JSON.stringify({
  wave: WAVE, runId: RUN_ID, head: HEAD, generatedAt: new Date().toISOString(),
  fixtures: fsSync.existsSync(FIXTURES) ? await fs.readdir(FIXTURES) : [],
  transitions, routing, shots, errors
}, null, 1));

console.log(`\n  ${shots.length} capturas · HEAD ${HEAD} · run ${RUN_ID}`);
console.log(`  errores: ${errors.length ? errors.slice(0, 3).join(' | ') : 'ninguno'}`);
await browser.close();
server.close();
