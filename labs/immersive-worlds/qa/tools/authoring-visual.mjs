/**
 * Authoring VS01 — visual QA.
 *
 * Functional checks say the data moved. They cannot say whether the panel is
 * legible, whether an author can tell that a file is ready, or whether the
 * editor covers the room it is editing. This drives the real workflow in a real
 * browser and photographs what a real author sees, so those questions can be
 * answered by looking.
 *
 * Fixtures come from the repository's own collection: proving an upload with a
 * file already in the product is stronger than inventing one.
 *
 *   node qa/tools/authoring-visual.mjs
 */
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MODULE_ROOT = path.resolve(HERE, '..', '..');
const REPO_ROOT = path.resolve(MODULE_ROOT, '../..');
const OUT = path.join(MODULE_ROOT, 'qa', 'evidence-authoring');
const PORT = Number(process.env.IW_AUV_PORT || 4690);
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webm': 'video/webm' };

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

const FIXTURE_IMAGE = path.join(MODULE_ROOT, 'assets/collection/marea-baja.jpg');
const FIXTURE_VIDEO = path.join(MODULE_ROOT, 'assets/collection/cuaderno-de-luz.webm');

const browser = await chromium.launch({ headless: true, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox'] });
const shots = [];
const errors = [];

async function session(viewport, label) {
  const page = await browser.newPage({ viewport });
  page.setDefaultTimeout(300000);
  page.on('pageerror', (e) => errors.push(`${label}: ${e.message}`));
  // A world that fails validation still boots — it only logs. Reading the log is
  // the difference between "the room rendered" and "the room rendered what the
  // author asked for".
  page.on('console', (m) => {
    const text = m.text();
    if (m.type() === 'error' || /failed validation|INV-\d/.test(text)) errors.push(`${label}: ${text}`);
  });
  await page.goto(`${BASE}/index.html?tier=HIGH&authoring=1`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__IW?.ready === true, { timeout: 300000 });
  await page.evaluate(() => { window.__IW.hud.el.veil.hidden = true; });
  return page;
}

/**
 * Dismissing the editor is animated (.32 s). Photographing the room the instant
 * the class is added photographs the panel still sliding out — the first pass of
 * this tool did exactly that, and the three frames that were supposed to show
 * the applied room showed the editor covering it instead.
 */
const dismissEditor = async (page) => {
  // Every panel in the document, not just the first: when a re-boot was leaking
  // editors, `getElementById` hid the stale one underneath while the visible one
  // stayed put, and six frames of "the applied room" were the editor instead.
  const panels = await page.evaluate(() => {
    const all = document.querySelectorAll('#au, aside[aria-label="Edición de la experiencia"]');
    all.forEach((el) => el.classList.add('au--hidden'));
    return all.length;
  });
  if (panels !== 1) errors.push(`dismissEditor: ${panels} paneles de edición en el documento`);
  await page.waitForTimeout(600);
};

/**
 * Applying re-boots the experience, and `__IW.ready` is still true from the boot
 * before it. Waiting on that flag returns instantly and photographs whatever the
 * screen happens to be showing — under load, the loading veil. Lowering the flag
 * first makes the wait edge-triggered, which is what it always meant.
 */
const applyAndWait = async (page, run, ...args) => {
  await page.evaluate(() => { if (window.__IW) window.__IW.ready = false; });
  await page.evaluate(run, ...args);
  await page.waitForFunction(() => window.__IW?.ready === true, { timeout: 300000 });
  await page.evaluate(() => { window.__IW.hud.el.veil.hidden = true; });
  await page.waitForTimeout(1500);
};

const shoot = async (page, id, caption) => {
  const file = `${id}.png`;
  await page.screenshot({ path: path.join(OUT, file), timeout: 180000 });
  shots.push({ id, file, caption });
  console.log(`  ${file} — ${caption}`);
};

const page = await session({ width: 1440, height: 900 }, 'desktop');

await dismissEditor(page);
await shoot(page, '01_museum_default', 'Museo por defecto — Fundación Arenas, editor cerrado');

await page.click('#au-open');
await page.waitForTimeout(600);
await shoot(page, '02_editor_open', 'Editor abierto sobre la sala');

await page.fill('[data-bind="institution.name"]', 'Colección Marés');
await page.fill('[data-bind="institution.claim"]', 'Obra sobre papel, 1949 — 1972');
await shoot(page, '03_institution_edit', 'Institución editada, cambios sin aplicar');

await page.selectOption('[data-act=pick]', 'entity.artwork.horizonte-interrumpido');
await page.fill('[data-bind="artwork.title"]', 'Marea baja');
await page.fill('[data-bind="artwork.creator"]', 'Nuria Sendra');
await page.fill('[data-bind="artwork.year"]', '1968');
await page.fill('[data-bind="artwork.medium"]', 'aguada sobre papel');
await shoot(page, '04_artwork_edit', 'Obra editada — un solo registro semántico');

await page.setInputFiles('[data-media="artworkImage"]', FIXTURE_IMAGE);
await shoot(page, '05_media_selected', 'Imagen seleccionada — estado en el panel');
await page.waitForFunction(
  () => document.querySelector('[data-state=artworkImage]')?.textContent?.startsWith('Lista'),
  { timeout: 120000 }
);
await shoot(page, '06_media_ready', 'Imagen lista, con nombre y dimensiones reales');

await page.setInputFiles('[data-media="artworkVideo"]', FIXTURE_VIDEO);
await page.waitForFunction(
  () => /Listo|no se pudo|no admitido/.test(document.querySelector('[data-state=artworkVideo]')?.textContent || ''),
  { timeout: 180000 }
);
const videoState = await page.textContent('[data-state=artworkVideo]');
await shoot(page, '07_video_ready', `Vídeo: ${videoState}`);

await applyAndWait(page, () => document.querySelector('[data-act=apply]').click());
await dismissEditor(page);
await shoot(page, '08_applied_museum', 'Aplicado — el vestíbulo con la institución autorizada');

// Focus has to happen where the work stands. Dispatching it from the lobby, as
// the first pass did, focused an entity in a room that was not built yet: the
// HUD went away, the camera did not move, and the frame proved nothing.
await page.evaluate(async () => {
  const rt = window.__IW.runtime;
  await rt.traversePortal('portal.lobby-gallery-a', { source: 'QA' });
  rt.explore.setPose({ position: [-4.8, 1.62, -12.4], yaw: Math.PI, pitch: 0 });
  rt.actions.dispatch(
    { type: 'FOCUS_ENTITY', target: 'entity.artwork.horizonte-interrumpido' },
    { source: 'QA' }
  );
});
await page.waitForTimeout(2500);
await dismissEditor(page);
await shoot(page, '09_focus_updated', 'Focus sobre la obra autorizada — imagen y cartela del autor');

await page.evaluate(() => window.__IW.runtime.focusNeighbour(1));
await page.waitForTimeout(2000);
await shoot(page, '10_browse_updated', 'Collection Browse tras la obra autorizada');

await page.evaluate(() => window.__IW.runtime.releaseFocus());
await page.waitForTimeout(1200);

// The video went to the projection, which lives in the next room. Photographing
// the claim is the only way to know the file arrived where the label promised.
await page.evaluate(async () => {
  const rt = window.__IW.runtime;
  await rt.traversePortal('portal.gallery-a-gallery-b', { source: 'QA' });
  rt.explore.setPose({ position: [0, 1.62, -3.2], yaw: Math.PI, pitch: 0 });
});
await page.waitForTimeout(2500);
await shoot(page, '10b_projection_updated', 'Proyección de Galería B con el vídeo autorizado');

// The fixture is the file the world already used, so this frame cannot tell an
// applied video from an unchanged one by looking. Where the reference landed can
// be read, and a measured fact beats a photograph that proves nothing.
const videoRouting = await page.evaluate(() => {
  const carriers = window.__IW.runtime.store.entities
    .filter((e) => String(e.content?.media?.src || '').startsWith('blob:'))
    .map((e) => `${e.id} · ${e.kind} · ${e.content.media.kind}`);
  return carriers;
});
console.log(`  medios autorizados en el mundo: ${videoRouting.join(' | ') || 'ninguno'}`);

await applyAndWait(page, async () => {
  const config = await fetch('./authoring/museum-b.config.json').then((r) => r.json());
  await window.__IW_PANEL.onApply(config);
});
await dismissEditor(page);
await shoot(page, '11_museum_b', 'Museo de la Bruma — segunda institución, mismo motor');

await applyAndWait(page, async () => {
  const { baseConfigFromWorld } = await import('./authoring/experience-config.js');
  const world = await fetch('./worlds/museum-v1.world.json').then((r) => r.json());
  await window.__IW_PANEL.onApply(baseConfigFromWorld(world));
});
await dismissEditor(page);
await shoot(page, '12_restored_original', 'Fundación Arenas restaurada');

// The same screen, same pose, without a single authored file — the only way to
// say whether the authored projection looks right is to have something to put it
// next to. A capture with no baseline is an impression.
await page.evaluate(async () => {
  const rt = window.__IW.runtime;
  await rt.traversePortal('portal.lobby-gallery-a', { source: 'QA' });
  await rt.traversePortal('portal.gallery-a-gallery-b', { source: 'QA' });
  rt.explore.setPose({ position: [0, 1.62, -3.2], yaw: Math.PI, pitch: 0 });
});
await page.waitForTimeout(2500);
await shoot(page, '12b_projection_original', 'La misma proyección sin autoría — referencia de comparación');
await page.close();

const mobile = await session({ width: 420, height: 860 }, 'mobile');
await mobile.waitForTimeout(800);
await shoot(mobile, '13_mobile_editor', 'Editor a 420 px — comprobación de anchura');
const overflow = await mobile.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
await mobile.close();

await fs.writeFile(path.join(OUT, 'visual.json'), JSON.stringify({
  generatedAt: new Date().toISOString(),
  viewports: ['1440x900', '420x860'],
  fixtures: [path.basename(FIXTURE_IMAGE), path.basename(FIXTURE_VIDEO)],
  videoState, videoRouting, horizontalOverflowAt420: overflow, shots, errors
}, null, 1));

console.log(`\n  ${shots.length} capturas - desbordamiento a 420px: ${overflow}`);
console.log(`  errores: ${errors.length ? errors.slice(0, 3) : 'ninguno'}`);
await browser.close();
server.close();
