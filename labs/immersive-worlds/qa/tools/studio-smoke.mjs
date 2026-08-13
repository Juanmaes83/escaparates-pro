/**
 * Studio smoke — does it boot, dock, and know the Museum?
 *
 * Deliberately cheap. It answers the questions that make a screenshot worth
 * taking at all: the studio mounted once, the canvas kept a real size instead of
 * being covered, the tree found the world's own rooms and pieces, and nothing
 * threw. Anything more interesting than this belongs in the visual pass.
 *
 *   node qa/tools/studio-smoke.mjs
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
const PORT = Number(process.env.IW_SMOKE_PORT || 4695);
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
const BASE = `http://127.0.0.1:${PORT}/labs/immersive-worlds`;

const browser = await chromium.launch({ headless: true, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.setDefaultTimeout(300000);
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => {
  const t = m.text();
  if (m.type() === 'error' || /failed validation|INV-\d/.test(t)) errors.push(t);
});

await page.goto(`${BASE}/index.html?tier=HIGH&authoring=1`, { waitUntil: 'load' });
await page.waitForFunction(() => window.__IW?.ready === true, { timeout: 300000 });
await page.waitForTimeout(1200);

const facts = await page.evaluate(() => {
  const canvas = document.getElementById('iw-canvas').getBoundingClientRect();
  const studio = document.getElementById('st');
  const rows = [...document.querySelectorAll('[data-node]')].map((b) => b.dataset.node);
  return {
    studios: document.querySelectorAll('#st').length,
    vs01Panels: document.querySelectorAll('#au').length,
    docked: document.body.dataset.studio === 'on',
    canvas: { w: Math.round(canvas.width), h: Math.round(canvas.height), x: Math.round(canvas.left) },
    window: { w: window.innerWidth, h: window.innerHeight },
    renderer: { w: window.__IW.renderHost.width, h: window.__IW.renderHost.height },
    treeNodes: [...new Set(rows)],
    readiness: window.__IW_STUDIO.readiness,
    domains: [...document.querySelectorAll('[data-domain]')].map((b) => b.dataset.domain),
    startEnabled: !document.querySelector('[data-act=start]')?.disabled
  };
});

const checks = [];
const check = (name, ok, detail = '') => {
  checks.push({ name, ok });
  console.log(`${ok ? '  ok  ' : ' FAIL '} ${name}${detail ? `  — ${detail}` : ''}`);
};

check('el estudio se monta una sola vez', facts.studios === 1, `${facts.studios} nodos #st`);
check('el panel de VS01 no está montado a la vez', facts.vs01Panels === 0);
check('la sala queda acoplada, no tapada', facts.docked);
check('el lienzo conserva un tamaño real',
  facts.canvas.w > 400 && facts.canvas.h > 400,
  `${facts.canvas.w}×${facts.canvas.h} de ${facts.window.w}×${facts.window.h}`);
check('el motor se redimensiona al lienzo, no a la ventana',
  Math.abs(facts.renderer.w - facts.canvas.w) <= 2 && facts.renderer.w < facts.window.w,
  `motor ${facts.renderer.w}×${facts.renderer.h} · lienzo ${facts.canvas.w}×${facts.canvas.h}`);
check('el árbol contiene institución, exposición, 4 salas y 11 piezas',
  facts.treeNodes.length >= 17,
  `${facts.treeNodes.length} nodos`);
check('el árbol nombra las salas del mundo',
  ['space.lobby', 'space.gallery-a', 'space.gallery-b', 'space.archive'].every((id) => facts.treeNodes.includes(id)));
check('el árbol nombra todas las obras',
  ['entity.artwork.horizonte-interrumpido', 'entity.artwork.campo-de-ceniza', 'entity.artwork.division-tercera',
    'entity.artwork.estudio-de-figura', 'entity.sculpture.vasija-de-arenas', 'entity.artwork.noche-de-invierno',
    'entity.artwork.marea-baja', 'entity.video.cuaderno-de-luz'].every((id) => facts.treeNodes.includes(id)));
check('los cinco dominios están presentes', facts.domains.length === 5, facts.domains.join(', '));
check('el proyecto por defecto está listo para empezar',
  facts.readiness.canStart && facts.startEnabled,
  `${facts.readiness.requiredReady}/${facts.readiness.requiredTotal} · ${facts.readiness.state}`);
check('sin errores de consola', errors.length === 0, errors.slice(0, 2).join(' | ') || 'ninguno');

const failed = checks.filter((c) => !c.ok).length;
console.log(`\n${checks.length - failed}/${checks.length} comprobaciones`);
await browser.close();
server.close();
process.exit(failed ? 1 : 0);
