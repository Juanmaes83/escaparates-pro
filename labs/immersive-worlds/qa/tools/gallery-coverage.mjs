/**
 * Main Gallery coverage capture (read-only).
 *
 * Photographs every focusable piece physically present in Galería A — including
 * the ones the guided tour never visits — so the coverage map is judged from the
 * room as it actually is, not from the tour's subset of it.
 *
 * Uses the existing Focus path in Explore. Nothing is authored or mutated.
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
const OUT = path.join(MODULE_ROOT, 'qa', 'evidence-gallery-a');
const PORT = Number(process.env.IW_COVERAGE_PORT || 4320);
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.webm': 'video/webm', '.jpg': 'image/jpeg' };

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

const browser = await chromium.launch({ headless: true, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.setDefaultTimeout(600000);
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

await page.goto(`http://127.0.0.1:${PORT}/labs/immersive-worlds/index.html?reducedMotion=1&tier=HIGH`, { waitUntil: 'load' });
await page.waitForFunction(() => window.__IW?.ready === true, { timeout: 600000 });
await page.evaluate(() => { window.__IW.hud.el.veil.hidden = true; });

// Into the main gallery, on foot, as a visitor would arrive.
const inventory = await page.evaluate(async () => {
  const rt = window.__IW.runtime;
  await rt.traversePortal('portal.lobby-gallery-a', { source: 'QA' });
  const works = rt.focusableInSpace('space.gallery-a');
  return {
    focusable: works.map((w) => w.id),
    all: rt.store.entitiesOf('space.gallery-a').map((e) => ({
      id: e.id, kind: e.kind, title: e.content?.title || null,
      focusable: Boolean(e.interaction?.focusable), size: e.size
    }))
  };
});
console.log('focusables en la sala:', inventory.focusable.length);
for (const e of inventory.all) console.log(`   ${e.focusable ? 'F' : '-'} ${e.kind.padEnd(10)} ${e.id}`);

// Two room views first: the room as arrived at, and obliquely.
for (const [tag, pose] of [
  ['room_axis', { position: [-0.9, 1.62, -8.6], yaw: Math.PI, pitch: -0.02 }],
  ['room_oblique', { position: [-5.2, 1.62, -6.4], yaw: Math.PI - 0.62, pitch: -0.03 }]
]) {
  await page.evaluate((p) => { window.__IW.runtime.explore.setPose(p); }, pose);
  await page.evaluate(() => window.__IW.frames(24));
  await page.screenshot({ path: path.join(OUT, `${tag}.png`) });
  console.log(`  ok ${tag}`);
}

const shots = [];
for (const id of inventory.focusable) {
  const info = await page.evaluate(async (entityId) => {
    const rt = window.__IW.runtime;
    if (rt.state.focusedEntityId) rt.releaseFocus();
    await window.__IW.frames(6);
    rt.actions.dispatch({ type: 'FOCUS_ENTITY', target: entityId }, { source: 'QA', sourceId: 'coverage' });
    // Settle: the focus camera must stop moving before the frame is worth keeping.
    let previous = null; let settled = false;
    for (let i = 0; i < 24 && !settled; i += 1) {
      await window.__IW.frames(10);
      const now = [...rt.camera.pose.position, ...rt.camera.pose.target];
      if (previous) settled = now.every((n, k) => Math.abs(n - previous[k]) < 1e-3);
      previous = now;
    }
    const e = rt.store.require(entityId);
    return {
      id: entityId, kind: e.kind, settled,
      title: e.content?.title || null, creator: e.content?.creator || null,
      year: e.content?.year || null, medium: e.content?.medium || null,
      size: e.size, authority: rt.camera.owner,
      pose: rt.camera.pose.position.map((n) => +n.toFixed(2))
    };
  }, id);
  const tag = `piece_${id.split('.').pop()}`;
  if (info.settled) await page.screenshot({ path: path.join(OUT, `${tag}.png`) });
  shots.push({ ...info, file: info.settled ? `${tag}.png` : null });
  console.log(`  ${info.settled ? 'ok' : '!!'} ${tag.padEnd(30)} ${info.kind.padEnd(10)} ${info.authority}`);
}

await fs.writeFile(path.join(OUT, 'coverage.json'), JSON.stringify({
  generatedAt: new Date().toISOString(), space: 'space.gallery-a', inventory, shots, errors
}, null, 1));
console.log('errores:', errors.length || 'ninguno');
await browser.close();
server.close();
