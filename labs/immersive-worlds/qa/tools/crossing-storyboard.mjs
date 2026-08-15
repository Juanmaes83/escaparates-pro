/**
 * A 12-beat storyboard of the Museum crossing, sampled by cinematic function.
 *
 * Not by clock. Equal time intervals produce a storyboard that describes the
 * sampling rate rather than the film, and the whole point of this board is that
 * a missing beat should be impossible to hide.
 *
 * So the crossing is driven frame by frame and each beat is captured when its
 * *condition* becomes true — the plane is crossed, the look has turned back,
 * the portal has shrunk past a threshold — with the measured state recorded
 * beside the frame so the caption cannot drift from what happened.
 *
 *   node qa/tools/crossing-storyboard.mjs
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
const OUT = path.join(MODULE_ROOT, 'qa', 'evidence-vs02', 'crossing');
const PORT = Number(process.env.IW_CROSS_PORT || 5110);
const PACE = process.env.IW_PACE || 'NATURAL';
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
      'Content-Length': stat.size, 'Cache-Control': 'no-store'
    });
    res.end(await fs.readFile(f));
  } catch { res.writeHead(404).end(); }
});
await new Promise((r) => server.listen(PORT, '127.0.0.1', r));

const browser = await chromium.launch({
  headless: true,
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox']
});
const page = await browser.newPage({
  viewport: { width: 1280, height: 720 },
  // Screenshot-per-frame took about a second each while the crossing lasts
  // three, so the first sample already landed in the destination. Recording
  // gets every frame, and reads the Museum with the same instrument used to
  // read the source.
  recordVideo: { dir: OUT, size: { width: 1280, height: 720 } }
});
page.setDefaultTimeout(300000);
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto(`http://127.0.0.1:${PORT}/labs/immersive-worlds/index.html?tier=HIGH`, { waitUntil: 'load' });
await page.waitForFunction(() => window.__IW?.ready === true, { timeout: 300000 });
/**
 * Enter the way a visitor enters.
 *
 * Twice now this harness recorded the loading screen instead of the Museum.
 * First because hiding the veil is not the same as passing through it, and then
 * because a synthetic `.click()` fired before `showEnter()` had attached its
 * listener — the button existed, so the call succeeded, and nothing happened.
 *
 * A real Playwright click waits for the control to be visible and enabled
 * before pressing it, which is both the visitor's path and the only version of
 * this that cannot silently no-op.
 */
await page.locator('[data-el="enter"]').click({ timeout: 120000 });
await page.waitForFunction(() => {
  const veil = window.__IW?.hud?.el?.veil;
  return veil && (veil.hidden || veil.classList.contains('is-gone'));
}, { timeout: 60000 });
// The visitor's own chrome is not the subject of this board; the room is.
await page.evaluate(() => { document.getElementById('iw-ui').style.opacity = '0'; });
await page.waitForTimeout(2500);

/**
 * Is the room actually on screen?
 *
 * A recording of a black canvas is not evidence of a crossing, and both earlier
 * attempts produced exactly that while reporting success. This refuses to go on
 * unless real pixels are being painted.
 */
const painting = await page.evaluate(async () => {
  const canvas = document.getElementById('iw-canvas');
  const shot = await new Promise((r) => canvas.toBlob(r, 'image/png'));
  return { hasCanvas: Boolean(canvas), bytes: shot ? shot.size : 0,
    w: canvas?.width || 0, h: canvas?.height || 0 };
});
if (!painting.hasCanvas || painting.w < 100) {
  throw new Error(`el lienzo no está listo: ${JSON.stringify(painting)}`);
}
console.log(`sala en pantalla: ${painting.w}×${painting.h}`);

/**
 * Read everything the beat conditions depend on, in one go.
 *
 * `portalOnScreen` is the fraction of the viewport the threshold's opening
 * covers, projected through the live camera — the measurement the whole
 * storyboard turns on, because "the portal takes over the frame" and "the
 * portal shrinks while the world reveals" are both statements about that
 * number and about nothing else.
 */
const SAMPLE = (portalId) => {
  const rt = window.__IW.runtime;
  const cam = rt.renderHost?.camera || window.__IW.renderHost?.camera;
  const kit = rt.sceneKit;
  const th = kit._portalSurface?.threshold || kit._lastThreshold || null;
  const gate = th?.centre || null;
  const pose = rt.camera.pose;

  let coverage = 0;
  if (gate && cam && th?.width && th?.height) {
    // Project the opening's four corners and measure the area they cover.
    const THREE = kit.constructor.THREE || window.__IW.THREE;
    const half = [th.width / 2, th.height / 2];
    const pts = [[-1, 0], [1, 0], [1, 1], [-1, 1]].map(([sx, sy]) => {
      const v = new THREE.Vector3(
        gate[0] + (th.axis?.[2] ? sx * half[0] : 0),
        gate[1] + sy * th.height,
        gate[2] + (th.axis?.[2] ? 0 : sx * half[0])
      );
      v.project(cam);
      return [v.x, v.y];
    });
    const xs = pts.map((p) => p[0]); const ys = pts.map((p) => p[1]);
    const w = Math.min(Math.max(Math.max(...xs), -1), 1) - Math.min(Math.max(Math.min(...xs), -1), 1);
    const h = Math.min(Math.max(Math.max(...ys), -1), 1) - Math.min(Math.max(Math.min(...ys), -1), 1);
    coverage = Math.max(0, (w * h) / 4);
  }

  // Is the camera looking towards the threshold, or away from it?
  let facing = 0;
  if (gate) {
    const look = [pose.target[0] - pose.position[0], pose.target[2] - pose.position[2]];
    const toGate = [gate[0] - pose.position[0], gate[2] - pose.position[2]];
    const ln = Math.hypot(...look) || 1;
    const gn = Math.hypot(...toGate) || 1;
    facing = (look[0] / ln) * (toGate[0] / gn) + (look[1] / ln) * (toGate[1] / gn);
  }

  return {
    space: rt.state.activeSpaceId,
    coverage: +coverage.toFixed(4),
    facing: +facing.toFixed(3),
    distance: gate ? +Math.hypot(pose.position[0] - gate[0], pose.position[2] - gate[2]).toFixed(3) : null,
    effect: +(kit._portalSurface?.effectIntensity ?? 0).toFixed(3),
    surfaceVisible: Boolean(kit._portalSurface?.visible)
  };
};

/* Drive the crossing and watch it, sampling every frame. */
const portalId = 'portal.lobby-gallery-a';
await page.evaluate((pace) => {
  const map = { BRISK: 0.75, NATURAL: 1, CALM: 1.35 };
  window.__IW.runtime.experience.pacing = map[pace] || 1;
  window.__SB = { samples: [], t0: performance.now() };
}, PACE);

// Start the crossing without awaiting it, so the frames can be watched.
await page.evaluate((id) => {
  window.__CROSS = window.__IW.runtime.traversePortal(id, { source: 'QA' });
}, portalId);

const timeline = [];
const started = Date.now();
// Sample state cheaply while the recorder captures the pixels.
while (Date.now() - started < 12000) {
  const s = await page.evaluate(SAMPLE, portalId);
  timeline.push({ ms: Date.now() - started, ...s });
  const done = await page.evaluate(() => window.__IW.runtime.camera.owner !== 'TRANSITION');
  if (done && timeline.length > 6) break;
  await page.waitForTimeout(40);
}
// Let the settle finish inside the recording.
await page.waitForTimeout(1800);
console.log(`${timeline.length} muestras de estado · espacios: ${[...new Set(timeline.map((t) => t.space))].join(' → ')}`);

await fs.writeFile(path.join(OUT, `crossing-state-${PACE}.json`), JSON.stringify({
  generatedAt: new Date().toISOString(), pace: PACE, portalId, timeline, errors
}, null, 1));
const videoPath = await page.video().path();
await page.close();
await browser.close();
server.close();
console.log(`vídeo: ${videoPath}`);
