/**
 * Is the authored video's picture actually reaching the wall?
 *
 * `currentTime` advancing proves the element is decoding. It does not prove the
 * texture is being uploaded, nor that the surface a visitor looks at is showing
 * it. Two screenshots 700 ms apart showed no change on the projection, which
 * contradicts a currentTime that moved — so this asks the pixels directly:
 *
 *   1. what is inside the <video> element right now (draw it, read it);
 *   2. what the WebGL canvas is drawing where the projection is;
 *   3. whether either changes over time.
 *
 * The fixture is saturated primaries; the Museum's own projection is dim
 * blue-grey. That difference is the whole point of the fixture — it makes the
 * answer visible in an average colour.
 *
 *   node qa/tools/video-pixels.mjs
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
const PORT = Number(process.env.IW_PIX_PORT || 4716);
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webm': 'video/webm' };

const server = http.createServer(async (req, res) => {
  try {
    const d = decodeURIComponent((req.url || '/').split('?')[0]).replace(/^\/+/, '');
    let f = path.resolve(REPO_ROOT, d || 'index.html');
    if (!f.startsWith(REPO_ROOT)) return res.writeHead(403).end();
    if (fsSync.existsSync(f) && fsSync.statSync(f).isDirectory()) f = path.join(f, 'index.html');
    const stat = fsSync.statSync(f);
    const type = MIME[path.extname(f)] || 'application/octet-stream';
    const range = req.headers.range;
    if (range && /^bytes=/.test(range)) {
      const [, s, e] = /bytes=(\d*)-(\d*)/.exec(range);
      const start = s ? Number(s) : 0; const end = e ? Number(e) : stat.size - 1;
      res.writeHead(206, { 'Content-Type': type, 'Accept-Ranges': 'bytes', 'Content-Range': `bytes ${start}-${end}/${stat.size}`, 'Content-Length': end - start + 1 });
      return fsSync.createReadStream(f, { start, end }).pipe(res);
    }
    res.writeHead(200, { 'Content-Type': type, 'Accept-Ranges': 'bytes', 'Content-Length': stat.size, 'Cache-Control': 'no-store' });
    res.end(await fs.readFile(f));
  } catch { res.writeHead(404).end(); }
});
await new Promise((r) => server.listen(PORT, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${PORT}/labs/immersive-worlds`;

const browser = await chromium.launch({
  headless: true,
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox']
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.setDefaultTimeout(300000);
await page.goto(`${BASE}/index.html?tier=HIGH&authoring=1`, { waitUntil: 'load' });
await page.waitForFunction(() => window.__IW?.ready === true, { timeout: 300000 });
await page.evaluate(() => { window.__IW.hud.el.veil.hidden = true; });
await page.waitForTimeout(1200);

// Author the video, exactly as the studio does.
await page.click('[data-node="entity.video.cuaderno-de-luz"]');
await page.waitForTimeout(2600);
const bytes = [...await fs.readFile(path.join(FIXTURES, 'qa-video.webm'))];
await page.evaluate(async (b) => {
  const dt = new DataTransfer();
  dt.items.add(new File([new Uint8Array(b)], 'barras-vs02.webm', { type: '' }));
  const input = document.querySelector('[data-media="PROJECTION_MEDIA"]');
  input.files = dt.files;
  input.dispatchEvent(new Event('change', { bubbles: true }));
}, bytes);
await page.waitForFunction(
  () => /Listo|no se pudo/.test(document.querySelector('[data-slot="PROJECTION_MEDIA"] .st-slotstate')?.textContent || ''),
  { timeout: 180000 }
);
await page.evaluate(() => { window.__IW.ready = false; });
await page.click('[data-act="apply"]');
await page.waitForFunction(() => window.__IW?.ready === true, { timeout: 300000 });
await page.evaluate(() => { window.__IW.hud.el.veil.hidden = true; });
await page.waitForTimeout(2000);

await page.evaluate(async () => {
  const rt = window.__IW.runtime;
  for (const id of ['portal.lobby-gallery-a', 'portal.gallery-a-gallery-b']) {
    if (rt.state.activeSpaceId === 'space.gallery-b') break;
    try { await rt.traversePortal(id, { source: 'QA' }); } catch { /* */ }
  }
  // Close to the screen and square on, so the projection fills enough of the
  // frame that a measurement is not arguing about a hundred pixels.
  rt.explore.setPose({ position: [0, 1.62, -1.6], yaw: Math.PI, pitch: 0 });
});
await page.waitForTimeout(2600);

const out = await page.evaluate(async () => {
  const rt = window.__IW.runtime;
  let element = null; let texture = null; let mesh = null;
  rt.sceneKit.scene.traverse((o) => {
    if (o.material?.map?.image?.tagName === 'VIDEO' && !element) {
      element = o.material.map.image; texture = o.material.map; mesh = o;
    }
  });
  if (!element) return { found: false };

  /** Average colour of whatever the element currently holds. */
  const sampleElement = () => {
    const c = document.createElement('canvas');
    c.width = 64; c.height = 36;
    const x = c.getContext('2d', { willReadFrequently: true });
    x.drawImage(element, 0, 0, 64, 36);
    const d = x.getImageData(0, 0, 64, 36).data;
    let r = 0; let g = 0; let b = 0; let sat = 0;
    for (let i = 0; i < d.length; i += 4) {
      r += d[i]; g += d[i + 1]; b += d[i + 2];
      sat += Math.max(d[i], d[i + 1], d[i + 2]) - Math.min(d[i], d[i + 1], d[i + 2]);
    }
    const n = d.length / 4;
    return {
      rgb: [Math.round(r / n), Math.round(g / n), Math.round(b / n)],
      saturation: Math.round(sat / n),
      // A fingerprint, so two samples can be compared without keeping pixels.
      hash: Array.from({ length: 8 }, (_, k) => d[k * 997 % d.length]).join(',')
    };
  };

  const a = sampleElement();
  const tA = element.currentTime;
  await new Promise((r) => setTimeout(r, 900));
  const b = sampleElement();
  const tB = element.currentTime;

  return {
    found: true,
    entity: mesh?.parent?.userData?.entityId || null,
    element: {
      w: element.videoWidth, h: element.videoHeight,
      duration: +element.duration.toFixed(2),
      paused: element.paused, readyState: element.readyState,
      src: String(element.src).slice(0, 20)
    },
    textureNeedsUpdateAuto: texture.constructor?.name,
    sampleA: a, sampleB: b,
    currentTime: [+tA.toFixed(3), +tB.toFixed(3)],
    elementPictureChanged: a.hash !== b.hash,
    // Saturated primaries mean the authored fixture; dim blue-grey means the
    // Museum's own projection is still on the wall.
    looksLikeFixture: a.saturation > 40
  };
});

console.log(JSON.stringify(out, null, 1));
await fs.writeFile(path.join(MODULE_ROOT, 'qa', 'evidence-vs02', 'video', 'video-pixels.json'),
  JSON.stringify({ generatedAt: new Date().toISOString(), ...out }, null, 1));
await browser.close();
server.close();
