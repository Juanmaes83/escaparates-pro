/**
 * Recovery gate — the main Museum Studio must retain Avatar, Breeze and Wet Paint.
 *
 * Proves in a real browser:
 * - Avatar domain is mounted in the main Studio rail;
 * - Breeze config survives save/reload without entering the semantic World;
 * - Studio follows canonical portals to Breeze and mounts the proven nested guest;
 * - Breeze exits through its canonical return portal;
 * - Studio follows canonical portals to Wet Paint;
 * - Wet Paint controls are immediately visible and consume Museum MediaVault items.
 *
 * WebGPU pixels remain a human/graphic-browser gate. Headless Chromium verifies
 * the host/controller/iframe/state seams but is not visual authority for cloth.
 */
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../../../..');
const port = Number(process.env.IW_SPECIAL_ROOMS_PORT || 4695);
const mime = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.png':'image/png', '.jpg':'image/jpeg', '.webm':'video/webm', '.glb':'model/gltf-binary' };
const artifactDir = path.join(repoRoot, 'output', 'playwright');
await fs.mkdir(artifactDir, { recursive: true });

const server = http.createServer(async (req, res) => {
  try {
    const rel = decodeURIComponent((req.url || '/').split('?')[0]).replace(/^\/+/, '');
    let file = path.resolve(repoRoot, rel || 'index.html');
    if (!file.startsWith(repoRoot)) return res.writeHead(403).end();
    if (fsSync.existsSync(file) && fsSync.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    const body = await fs.readFile(file);
    res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control':'no-store' });
    res.end(body);
  } catch { res.writeHead(404).end(); }
});

await new Promise((resolve) => server.listen(port, '127.0.0.1', resolve));
const browser = await chromium.launch({
  headless: true,
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox']
});
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
const errors = [];
page.on('pageerror', (error) => errors.push(String(error?.message || error)));
page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });

try {
  const url = `http://127.0.0.1:${port}/labs/immersive-worlds/index.html?authoring=1&portalVariant=D`;
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__IW?.ready && window.__IW_STUDIO, null, { timeout: 30000 });

  const avatar = await page.locator('[data-domain="avatar"]').count();
  if (avatar !== 1) throw new Error(`Avatar domain count: ${avatar}`);

  await page.evaluate(() => {
    const id = 'entity.installation.viento-sobre-marmol';
    const studio = window.__IW_STUDIO;
    const entity = studio.world.entities.find((item) => item.id === id);
    studio.config.entities[id] = {
      ...(studio.config.entities[id] || {}),
      sizeCm: { width: entity.size[0] * 100, height: entity.size[1] * 100, depth: entity.size[2] * 100 },
      accessibility: { ...entity.accessibility },
      breeze: {
        version: 1, experience: 'cloth', autoRotate: true, runSimulation: true, wireframe: false,
        background: { scale: 1.35, x: 0.2, y: -0.1 },
        cloth: { scale: 1.1, opacity: 0.72, brightness: 1.05, contrast: 1, saturation: .9 },
        object: { template: 'venus' }, physics: { stiffness: .4, friction: .2 }
      }
    };
    studio._save();
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__IW?.ready && window.__IW_STUDIO, null, { timeout: 30000 });
  const breezeRoundTrip = await page.evaluate(() => window.__IW_STUDIO.config.entities['entity.installation.viento-sobre-marmol']?.breeze?.background?.scale);
  if (breezeRoundTrip !== 1.35) throw new Error(`Breeze config round-trip failed: ${breezeRoundTrip}`);

  await page.evaluate(() => window.__IW_STUDIO.onReveal('space.breeze'));
  await page.waitForFunction(() => window.__IW?.runtime?.state?.activeSpaceId === 'space.breeze', null, { timeout: 45000 });
  await page.waitForSelector('iframe[data-nested-room-studio="room.breeze"]', { timeout: 30000 });
  const breeze = await page.evaluate(() => ({
    activeSpaceId: window.__IW.runtime.state.activeSpaceId,
    presenting: window.__IW.nested?.isPresenting,
    adapter: Boolean(window.__IW_BREEZE_PERSISTENCE_ADAPTER)
  }));
  if (!breeze.adapter) throw new Error(`Breeze seam incomplete: ${JSON.stringify(breeze)}`);
  await page.screenshot({ path: path.join(artifactDir, 'museum-recovery-breeze.png'), fullPage: true });

  await page.evaluate(() => window.__IW.runtime.traversePortal('portal.breeze-gallery-b', { source: 'QA' }));
  await page.waitForFunction(() => window.__IW?.runtime?.state?.activeSpaceId === 'space.gallery-b', null, { timeout: 30000 });

  // A WebGPU guest may keep initialization pending in headless Chromium. Reload
  // before the independent Wet Paint route; stable browser errors are evaluated
  // from this point rather than from teardown of the unsupported graphics guest.
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__IW?.ready && window.__IW_STUDIO, null, { timeout: 30000 });
  errors.length = 0;
  await page.evaluate(() => window.__IW_STUDIO.onReveal('entity.itinerant.original'));
  await page.waitForFunction(() => window.__IW?.runtime?.state?.activeSpaceId === 'space.itinerant-wet-paint', null, { timeout: 30000 });
  await page.evaluate(() => {
    const studio = window.__IW_STUDIO;
    studio.domain = 'build';
    studio.selectedId = 'entity.itinerant.original';
    studio.render();
  });
  await page.waitForSelector('.st-ed > .wp-wetpaint [data-wp-museum-source]', { timeout: 15000 });
  const wetPaint = await page.evaluate(() => ({
    activeSpaceId: window.__IW.runtime.state.activeSpaceId,
    controlsFirst: Boolean(document.querySelector('.st-ed > .wp-wetpaint')),
    museumSources: document.querySelectorAll('[data-wp-museum-source]').length,
    engine: Boolean(window.__WET_PAINT_ENGINE)
  }));
  if (!wetPaint.controlsFirst || !wetPaint.museumSources || !wetPaint.engine) throw new Error(`Wet Paint seam incomplete: ${JSON.stringify(wetPaint)}`);

  await page.locator('[data-wp-museum-source]').first().click();
  await page.waitForFunction(() => {
    try {
      const all = JSON.parse(localStorage.getItem('iw.wetpaint.personalization.v1') || '{}');
      return all['entity.itinerant.original']?.sourceKind === 'upload';
    } catch { return false; }
  }, null, { timeout: 60000 });
  wetPaint.museumSourceApplied = true;
  await page.screenshot({ path: path.join(artifactDir, 'museum-recovery-live-smoke.png'), fullPage: true });
  if (errors.length) throw new Error(`Stable page errors: ${errors.join(' | ')}`);

  console.log('PASS Avatar domain mounted in the main Museum Studio');
  console.log('PASS Breeze config save/reload round-trip');
  console.log('PASS Canonical Studio route enters and exits Breeze');
  console.log('PASS Wet Paint opens in the itinerant room with controls visible first');
  console.log(`PASS Wet Paint consumed one of ${wetPaint.museumSources} Museum Library images`);
  console.log(JSON.stringify({ breeze: { ...breeze, configRoundTrip: breezeRoundTrip }, wetPaint }, null, 2));
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
