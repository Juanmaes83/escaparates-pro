/**
 * Do the Gallery B projection controls actually change the projection?
 *
 * These are capabilities the Scene Kit already had and only a world file could
 * reach. The claim is that an author can now reach them, and that what they set
 * arrives on the wall — not that a slider moves.
 *
 * The aspect fit is the one worth measuring rather than reading: a film is
 * rarely the shape of the wall, and "respect the proportions" either crops the
 * texture or it does not.
 *
 *   node qa/tools/projection-proof.mjs
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
const FIXTURES = path.join(MODULE_ROOT, 'qa', 'fixtures');
const OUT = path.join(MODULE_ROOT, 'qa', 'evidence-vs02', 'projection');
const PORT = Number(process.env.IW_PROJ_PORT || 5070);
const PROJECTION = 'entity.video.cuaderno-de-luz';
const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.webm': 'video/webm', '.mp4': 'video/mp4'
};

await fs.mkdir(OUT, { recursive: true });

const server = http.createServer(async (req, res) => {
  try {
    let f = path.resolve(REPO_ROOT, decodeURIComponent((req.url || '/').split('?')[0]).replace(/^\/+/, '') || 'index.html');
    if (!f.startsWith(REPO_ROOT)) return res.writeHead(403).end();
    if (fsSync.existsSync(f) && fsSync.statSync(f).isDirectory()) f = path.join(f, 'index.html');
    const stat = fsSync.statSync(f);
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(f)] || 'application/octet-stream',
      'Accept-Ranges': 'bytes', 'Content-Length': stat.size, 'Cache-Control': 'no-store'
    });
    res.end(await fs.readFile(f));
  } catch { res.writeHead(404).end(); }
});
await new Promise((r) => server.listen(PORT, '127.0.0.1', r));

const results = [];
const say = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
};

const browser = await chromium.launch({
  headless: true,
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox']
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.setDefaultTimeout(300000);
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto(`http://127.0.0.1:${PORT}/labs/immersive-worlds/index.html?tier=HIGH&authoring=1`, { waitUntil: 'load' });
await page.waitForFunction(() => window.__IW?.ready === true, { timeout: 300000 });
await page.evaluate(() => { window.__IW.hud.el.veil.hidden = true; });
await page.waitForTimeout(1200);

/* -- the controls exist, on the kind that has them ------------------------- */

await page.click(`[data-node="${PROJECTION}"]`);
await page.waitForTimeout(2200);
await page.click('[data-more="more:projection"]');
await page.waitForTimeout(400);

const controls = await page.evaluate(() => {
  const ed = document.querySelector('.st-ed');
  return {
    fits: [...ed.querySelectorAll('[data-setpath$=".fit"]')].map((b) => b.querySelector('b').textContent),
    ranges: [...ed.querySelectorAll('input[type="range"]')].map((r) => r.dataset.bind.split('.').pop()),
    loop: Boolean(ed.querySelector('input[type="checkbox"][data-bool]')),
    slots: ed.querySelectorAll('.st-slot').length
  };
});
say('la proyección ofrece encaje, brillo, derrame, reflejo y bucle',
  controls.fits.length === 2 && controls.ranges.length === 3 && controls.loop,
  `${controls.fits.join(' / ')} · ${controls.ranges.join(', ')} · bucle=${controls.loop}`);
say('sigue ofreciendo sus dos medios', controls.slots === 2, `${controls.slots} ranuras`);
// The projector's own tilt and lamp colour belong to the room, not the author.
const noLamp = await page.evaluate(() =>
  !document.querySelector('.st-ed').textContent.match(/keystone|tint|trapecio/i));
say('no expone la lámpara ni el trapecio', noLamp);

// An artwork must not sprout projection controls.
const artwork = await page.evaluate(() =>
  (window.__IW_STUDIO.world.entities || []).find((e) => e.kind === 'ARTWORK')?.id);
await page.click(`[data-node="${artwork}"]`);
await page.waitForTimeout(1800);
const onArtwork = await page.evaluate(() =>
  document.querySelectorAll('[data-more="more:projection"]').length);
say('una obra enmarcada no recibe controles de proyección', onArtwork === 0, `${onArtwork} paneles`);
await page.click(`[data-node="${PROJECTION}"]`);
await page.waitForTimeout(2000);
await page.screenshot({ path: path.join(OUT, '35_PROJECTION_CONTROLS.png') });

/* -- the fit actually crops ------------------------------------------------ */

// A 640×360 file (1.78) on a projection surface of a different shape: whether
// the texture is cropped or stretched is a measurable fact, not an opinion.
const bytes = [...await fs.readFile(path.join(FIXTURES, 'qa-motion.mp4'))];
await page.evaluate(async (b) => {
  const dt = new DataTransfer();
  dt.items.add(new File([new Uint8Array(b)], 'qa-motion.mp4', { type: '' }));
  const input = document.querySelector('[data-media="PROJECTION_VIDEO"]');
  input.files = dt.files;
  input.dispatchEvent(new Event('change', { bubbles: true }));
}, bytes);
await page.waitForFunction(
  () => /Listo|no se pudo/.test(document.querySelector('[data-slot="PROJECTION_VIDEO"] .st-slotstate')?.textContent || ''),
  { timeout: 120000 }
);

/**
 * Walk to the room the projection is in.
 *
 * The Scene Kit builds the active space, so an entity in another room has no
 * object and no texture — reading one from the lobby returns null and looks
 * exactly like "the video never arrived". Being in the room is a precondition
 * of the measurement, not part of what is measured.
 */
const reachProjection = async () => page.evaluate(async (id) => {
  const rt = window.__IW.runtime;
  const here = () => Boolean(rt.sceneKit._entityIndex?.get(id));
  for (const portal of ['portal.lobby-gallery-a', 'portal.gallery-a-gallery-b']) {
    if (here()) break;
    try { await rt.traversePortal(portal, { source: 'QA' }); } catch { /* not from here */ }
  }
  return here();
}, PROJECTION);

const readTexture = async () => page.evaluate((id) => {
  const rt = window.__IW.runtime;
  const record = rt.sceneKit._entityIndex?.get(id);
  let tex = null;
  record?.object?.traverse?.((o) => { if (!tex && o.material?.map?.image?.tagName === 'VIDEO') tex = o.material.map; });
  if (!tex) return null;
  return {
    repeat: [+tex.repeat.x.toFixed(4), +tex.repeat.y.toFixed(4)],
    offset: [+tex.offset.x.toFixed(4), +tex.offset.y.toFixed(4)],
    loop: tex.image.loop
  };
}, PROJECTION);

const apply = async () => {
  await page.evaluate(() => { window.__IW.ready = false; });
  await page.click('[data-act="apply"]');
  await page.waitForFunction(() => window.__IW?.ready === true, { timeout: 300000 });
  await page.evaluate(() => { window.__IW.hud.el.veil.hidden = true; });
  await page.waitForTimeout(1800);
  await reachProjection();
  await page.waitForTimeout(1400);
};

await apply();
const cover = await readTexture();
say('la proyección lleva el vídeo del autor', Boolean(cover), JSON.stringify(cover));
// COVER on a mismatched surface must crop one axis: a repeat of exactly 1,1
// would mean nothing was corrected.
say('«respetar proporciones» recorta en lugar de deformar',
  cover && (cover.repeat[0] < 0.999 || cover.repeat[1] < 0.999),
  `repeat=${cover?.repeat} offset=${cover?.offset}`);
say('el recorte está centrado',
  cover && Math.abs(cover.offset[0] - (1 - cover.repeat[0]) / 2) < 0.001
    && Math.abs(cover.offset[1] - (1 - cover.repeat[1]) / 2) < 0.001,
  `offset=${cover?.offset}`);
await page.screenshot({ path: path.join(OUT, '36_PROJECTION_COVER.png') });

// STRETCH is the identity transform, and must be exactly that.
await page.click('[data-node="' + PROJECTION + '"]');
await page.waitForTimeout(1500);
await page.click('[data-more="more:projection"]').catch(() => {});
await page.waitForTimeout(300);
await page.evaluate((id) => {
  window.__IW_STUDIO._write(`entities.${id}.projection.fit`, 'STRETCH');
  window.__IW_STUDIO._markDirty();
}, PROJECTION);
await apply();
const stretch = await readTexture();
say('«ajustar a la superficie» es la transformación identidad',
  stretch && stretch.repeat[0] === 1 && stretch.repeat[1] === 1
    && stretch.offset[0] === 0 && stretch.offset[1] === 0,
  `repeat=${stretch?.repeat} offset=${stretch?.offset}`);
await page.screenshot({ path: path.join(OUT, '37_PROJECTION_STRETCH.png') });

/* -- the lamp settings reach the wall -------------------------------------- */

await page.evaluate((id) => {
  const s = window.__IW_STUDIO;
  s._write(`entities.${id}.projection.intensity`, 0.35);
  s._write(`entities.${id}.projection.reflection`, 0);
  s._write(`entities.${id}.projection.loop`, false);
  s._markDirty();
}, PROJECTION);
await apply();
const dimmed = await page.evaluate((id) => {
  const w = window.__IW.runtime.store.entities.find((e) => e.id === id);
  return { intensity: w?.content?.projection?.intensity, loop: w?.content?.media?.loop };
}, PROJECTION);
say('el brillo autorizado llega al registro del mundo', dimmed.intensity === 0.35, String(dimmed.intensity));
say('el bucle es una propiedad del medio, y viaja con él', dimmed.loop === false, String(dimmed.loop));
const noLoop = await readTexture();
say('el elemento de vídeo deja de repetirse', noLoop && noLoop.loop === false, String(noLoop?.loop));
await page.screenshot({ path: path.join(OUT, '38_PROJECTION_DIMMED.png') });

say('sin errores de consola', errors.length === 0, errors.slice(0, 2).join(' | ') || 'ninguno');

const passed = results.filter((r) => r.ok).length;
await fs.writeFile(path.join(OUT, 'projection-proof.json'),
  JSON.stringify({ generatedAt: new Date().toISOString(), passed, total: results.length, results }, null, 1));
console.log(`\n${passed}/${results.length}`);
await browser.close();
server.close();
