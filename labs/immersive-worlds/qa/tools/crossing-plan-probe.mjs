/**
 * Answer two questions about the Museum crossing with measurements, not reading.
 *
 *   1. What plan did the crossing actually run? (`recoil`, `s`, `via`, duration)
 *   2. Does the camera turn back to the threshold after passing it?
 *
 * The full storyboard harness renders at well under one frame per second under
 * swiftshader, which left ten samples spread across the whole move and none of
 * them inside the recoil window. A verdict drawn from that is a verdict about
 * the sampling rate. So this runs small and without a recorder — no pixels, all
 * state — purely to get enough samples through the exit to say something true.
 *
 *   node qa/tools/crossing-plan-probe.mjs
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
const PORT = Number(process.env.IW_PROBE_PORT || 5140);
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.mp4': 'video/mp4', '.webm': 'video/webm' };

const server = http.createServer(async (req, res) => {
  try {
    let f = path.resolve(REPO_ROOT, decodeURIComponent((req.url || '/').split('?')[0]).replace(/^\/+/, '') || 'index.html');
    if (!f.startsWith(REPO_ROOT)) return res.writeHead(403).end();
    if (fsSync.existsSync(f) && fsSync.statSync(f).isDirectory()) f = path.join(f, 'index.html');
    const stat = fsSync.statSync(f);
    res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream', 'Content-Length': stat.size, 'Cache-Control': 'no-store' });
    res.end(await fs.readFile(f));
  } catch { res.writeHead(404).end(); }
});
await new Promise((r) => server.listen(PORT, '127.0.0.1', r));

const browser = await chromium.launch({ headless: true, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox'] });
const page = await browser.newPage({ viewport: { width: 640, height: 360 } });
page.setDefaultTimeout(300000);
await page.goto(`http://127.0.0.1:${PORT}/labs/immersive-worlds/index.html?tier=LOW`, { waitUntil: 'load' });
await page.waitForFunction(() => window.__IW?.ready === true, { timeout: 300000 });
await page.locator('[data-el="enter"]').click({ timeout: 120000 });
await page.waitForFunction(() => {
  const veil = window.__IW?.hud?.el?.veil;
  return veil && (veil.hidden || veil.classList.contains('is-gone'));
}, { timeout: 60000 });
await page.waitForTimeout(1200);

/** How fast is this actually rendering? A rate this instrument depends on. */
const fps = await page.evaluate(() => new Promise((resolve) => {
  let n = 0; const t0 = performance.now();
  const tick = () => { n += 1; if (performance.now() - t0 < 3000) requestAnimationFrame(tick); else resolve(+(n / ((performance.now() - t0) / 1000)).toFixed(2)); };
  requestAnimationFrame(tick);
}));
console.log(`velocidad de render: ${fps} fps`);

await page.evaluate(() => {
  const rt = window.__IW.runtime;
  const SB = { samples: [], plan: null, stopped: false, t0: performance.now() };
  window.__SB = SB;
  const tick = () => {
    if (SB.stopped) return;
    const c = rt.crossing;
    if (c.isCrossing) {
      if (!SB.plan) SB.plan = JSON.parse(JSON.stringify(c.lastPlan || {}));
      const plan = c._plan;
      const pose = rt.camera.pose;
      const gate = plan?.gate || null;
      let facing = null; let gateBehind = null;
      if (gate) {
        const look = [pose.target[0] - pose.position[0], pose.target[2] - pose.position[2]];
        const toGate = [gate[0] - pose.position[0], gate[2] - pose.position[2]];
        const ln = Math.hypot(...look) || 1; const gn = Math.hypot(...toGate) || 1;
        facing = +(((look[0] / ln) * (toGate[0] / gn)) + ((look[1] / ln) * (toGate[1] / gn))).toFixed(3);
        // Which side of the threshold plane the camera stands on, along the axis
        // that points into the destination. Negative = still in the origin room.
        const ax = plan.axis;
        gateBehind = +(((pose.position[0] - gate[0]) * ax[0]) + ((pose.position[2] - gate[2]) * ax[2])).toFixed(3);
      }
      SB.samples.push({
        ms: Math.round(performance.now() - SB.t0),
        k: +(c._elapsed / Math.max(c._duration, 1e-6)).toFixed(4),
        s: plan?.s ?? null,
        recoil: plan?.recoil ?? null,
        facing,
        alongAxis: gateBehind,
        space: rt.state.activeSpaceId,
        tgt: pose.target.map((n) => +n.toFixed(3)),
        gate: gate ? gate.map((n) => +n.toFixed(3)) : null
      });
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  rt.startRoute(rt.defaultRouteId);
});

await page.waitForFunction(() => window.__IW.runtime.crossing.isCrossing === true, null, { timeout: 90000 });
await page.waitForFunction(() => window.__IW.runtime.crossing.isCrossing === false, null, { timeout: 120000 });
const out = await page.evaluate(() => { window.__SB.stopped = true; return { plan: window.__SB.plan, samples: window.__SB.samples }; });

console.log(`plan: ${JSON.stringify(out.plan)}`);
console.log(`${out.samples.length} muestras dentro de la travesía`);
const after = out.samples.filter((x) => x.alongAxis !== null && x.alongAxis > 0);
console.log(`muestras pasada la puerta: ${after.length}`);
if (after.length) {
  console.log(`  facing tras el plano: ${Math.min(...after.map((a) => a.facing))} … ${Math.max(...after.map((a) => a.facing))}`);
  console.log('  k / alongAxis / facing:');
  for (const a of after.filter((_, i) => i % Math.max(1, Math.floor(after.length / 14)) === 0)) {
    console.log(`    k=${a.k.toFixed(3)} eje=${String(a.alongAxis).padStart(7)} facing=${String(a.facing).padStart(7)} sala=${a.space}`);
  }
}
await fs.mkdir(OUT, { recursive: true });
await fs.writeFile(path.join(OUT, 'crossing-plan-probe.json'), JSON.stringify({ generatedAt: new Date().toISOString(), fps, ...out }, null, 1));
await browser.close();
server.close();
