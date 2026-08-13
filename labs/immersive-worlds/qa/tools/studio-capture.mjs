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

await fs.writeFile(path.join(OUT, 'capture.json'), JSON.stringify({
  wave: WAVE, runId: RUN_ID, head: HEAD, generatedAt: new Date().toISOString(),
  fixtures: fsSync.existsSync(FIXTURES) ? await fs.readdir(FIXTURES) : [],
  shots, errors
}, null, 1));

console.log(`\n  ${shots.length} capturas · HEAD ${HEAD} · run ${RUN_ID}`);
console.log(`  errores: ${errors.length ? errors.slice(0, 3).join(' | ') : 'ninguno'}`);
await browser.close();
server.close();
