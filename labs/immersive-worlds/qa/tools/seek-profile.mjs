/**
 * Where does a seek actually spend its time?
 *
 * Both reconstruction and playback reach a late tour stop in around a hundred
 * seconds, so the cost is in neither harness's waiting strategy. This times each
 * beat of a seek individually and separates the three things a beat can pay for:
 *
 *   BUILD      a Space being constructed and its shaders warmed
 *   CHOREO     a crossing flying in real time that nobody is watching
 *   FRAME      the render loop, at software-rasteriser speed, between awaits
 *
 * Guessing between those three has already produced two wrong theories, so this
 * measures all three per beat instead.
 *
 *   node qa/tools/seek-profile.mjs
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
const PORT = Number(process.env.IW_PROFILE_PORT || 4570);
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
const BASE = `http://127.0.0.1:${PORT}/labs/immersive-worlds`;

const browser = await chromium.launch({ headless: true, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.setDefaultTimeout(600000);
await page.goto(`${BASE}/index.html?reducedMotion=1&tier=HIGH`, { waitUntil: 'load' });
await page.waitForFunction(() => window.__IW?.ready === true, { timeout: 600000 });

const report = await page.evaluate(async () => {
  const rt = window.__IW.runtime;
  const d = rt.experience;

  // Count render frames so a beat's wall time can be attributed to the loop.
  let frames = 0;
  const previousOnFrame = rt.onFrame;
  rt.onFrame = (pose, dt) => { frames += 1; previousOnFrame?.(pose, dt); };

  // Instrument the lifecycle so build/warm cost is attributed rather than inferred.
  const builds = [];
  const originalPrepare = rt.spaces.prepare.bind(rt.spaces);
  rt.spaces.prepare = async (spaceId) => {
    const wasReady = rt.spaces.stateOf(spaceId);
    const t = performance.now();
    const out = await originalPrepare(spaceId);
    const ms = performance.now() - t;
    if (ms > 1) builds.push({ spaceId, ms: Math.round(ms), from: wasReady });
    return out;
  };

  d.exit({ restorePose: false, reason: 'profile-reset' });
  const target = rt.tour.steps[8];
  const beats = [];

  d.start(d.routeId || d._lastRouteId || 'route.comentado');
  d.pause();
  d._seeking = true;
  const t0 = performance.now();
  for (let guard = 0; guard <= d.steps.length; guard += 1) {
    if (d.index >= target.firstBeatIndex) break;
    const beatStart = performance.now();
    const framesBefore = frames;
    const buildsBefore = builds.length;

    d._advance();
    const afterAdvance = performance.now();
    if (d._pendingStep) { try { await d._pendingStep; } catch { /* reported elsewhere */ } }
    const afterPending = performance.now();
    await new Promise((r) => setTimeout(r, 0));
    const beatEnd = performance.now();

    beats.push({
      id: d.currentStep?.id ?? null,
      intent: d.currentStep?.shotIntent ?? null,
      totalMs: Math.round(beatEnd - beatStart),
      advanceMs: Math.round(afterAdvance - beatStart),
      pendingMs: Math.round(afterPending - afterAdvance),
      yieldMs: Math.round(beatEnd - afterPending),
      frames: frames - framesBefore,
      builds: builds.slice(buildsBefore),
      crossingActive: rt.crossing.isCrossing
    });
  }
  d._seeking = false;
  const totalMs = Math.round(performance.now() - t0);
  rt.onFrame = previousOnFrame;

  return {
    totalMs, beats, builds,
    target: target.id,
    frameStats: rt.frameStats()
  };
});

console.log(`  seek to ${report.target}: ${report.totalMs} ms over ${report.beats.length} beats\n`);
console.log(`  ${'beat'.padEnd(30)} ${'intent'.padEnd(14)} ${'total'.padStart(7)} ${'adv'.padStart(6)} ${'pend'.padStart(7)} ${'yield'.padStart(6)} ${'frames'.padStart(7)}  builds`);
for (const b of report.beats) {
  const builds = b.builds.map((x) => `${x.spaceId.replace('space.', '')} ${x.ms}ms`).join(', ');
  console.log(`  ${String(b.id).replace('step.', '').padEnd(30)} ${String(b.intent).padEnd(14)} ` +
    `${String(b.totalMs).padStart(7)} ${String(b.advanceMs).padStart(6)} ${String(b.pendingMs).padStart(7)} ` +
    `${String(b.yieldMs).padStart(6)} ${String(b.frames).padStart(7)}  ${builds}`);
}

const sum = (f) => report.beats.reduce((a, b) => a + f(b), 0);
const buildTotal = report.builds.reduce((a, b) => a + b.ms, 0);
console.log('');
console.log(`  advance ${sum((b) => b.advanceMs)} ms · pending ${sum((b) => b.pendingMs)} ms · yield ${sum((b) => b.yieldMs)} ms`);
console.log(`  space build/warm total ${buildTotal} ms across ${report.builds.length} prepares`);
console.log(`  render frames during seek: ${sum((b) => b.frames)} · frame p50 ${report.frameStats.p50Ms} ms · p95 ${report.frameStats.p95Ms} ms`);
console.log(`  estimated frame cost: ${Math.round(sum((b) => b.frames) * (report.frameStats.p50Ms || 0))} ms`);

await browser.close();
server.close();
