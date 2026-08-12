/**
 * Block 2A vertical slice.
 *
 * Three questions, in order of what would stop the block:
 *   1. does every settled endpoint still match the frozen Room 1 baseline?
 *   2. does the camera stay inside legal space *along* the path, not only at its ends?
 *   3. does the look stop sweeping — no target flip, no roll?
 *
 * Samples the transition itself by stepping the clock, so the path is measured
 * rather than assumed.
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
const OUT = path.join(MODULE_ROOT, 'qa', 'evidence-transitions');
const PORT = Number(process.env.IW_SLICE_PORT || 4500);
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

const baseline = JSON.parse(await fs.readFile(
  path.join(MODULE_ROOT, 'qa', 'evidence-grammar', 'current', 'audit.json'), 'utf8'));
const BASE = new Map(baseline.beats.map((b) => [b.beatId, b]));
const world = JSON.parse(await fs.readFile(path.join(MODULE_ROOT, 'worlds', 'museum-v1.world.json'), 'utf8'));
const SPACES = new Map(world.spaces.map((s) => [s.id, s.bounds]));

const SLICE_ONLY = process.argv.includes('--slice');
const CASES = SLICE_ONLY ? [
  { id: 'CASE1_micro', to: 'step.03b-campo', label: 'T1 micro — Campo A→B' },
  { id: 'CASE2_traverse', to: 'step.03-lleva-horizonte', label: 'T3 traverse — Campo D→Horizonte A' },
  { id: 'CASE3_traverse', to: 'step.06h-lleva-vasija', label: 'T3 traverse — Estudio D→Vasija A' }
] : null;

const browser = await chromium.launch({ headless: true, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.setDefaultTimeout(600000);
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto(`http://127.0.0.1:${PORT}/labs/immersive-worlds/index.html?tier=HIGH`, { waitUntil: 'load' });
await page.waitForFunction(() => window.__IW?.ready === true, { timeout: 600000 });
await page.evaluate(() => { window.__IW.hud.el.veil.hidden = true; });

// One pass down the route, measuring each transition as it happens.
//
// The first version reconstructed from the start for every case, which is
// quadratic — forty minutes for thirty-three beats — and also less faithful: a
// transition in the real experience begins from wherever the previous beat left
// the camera, which is exactly what a single pass reproduces.
const results = [];
const raw = await page.evaluate(async () => {
  const rt = window.__IW.runtime;
  const d = rt.experience;
  const out = [];

  d.reducedMotion = false;
  rt.directed.setReducedMotion(false);
  rt.startRoute(rt.defaultRouteId);
  d.pause();

  for (let n = 0; n < 40; n += 1) {
    const fromBeat = d.currentStep?.id ?? null;
    const fromSpace = rt.state.activeSpaceId;
    if (!d.steps[d.index + 1]) break;

    d._advance();
    if (d._pendingStep) { try { await d._pendingStep; } catch { /* reported elsewhere */ } }
    const step = d.currentStep;
    const requested = rt.directed._to
      ? { position: [...rt.directed._to.position], target: [...rt.directed._to.target] }
      : null;

    const samples = [];
    let settledAt = -1;
    for (let i = 0; i < 900; i += 1) {
      rt.clock.tick?.(1 / 60);
      rt.camera.update(1 / 60);
      rt.sceneKit.update?.(1 / 60, i / 60);
      samples.push({ position: [...rt.camera.pose.position], target: [...rt.camera.pose.target] });
      if (!rt.directed.isTravelling && i > 3) {
        if (settledAt < 0) settledAt = i;
        if (i - settledAt > 8) break;
      }
    }
    // Let the figures finish arriving before the next beat is composed.
    for (let i = 0; i < 400; i += 1) rt.sceneKit.update?.(1 / 60, i / 60);

    out.push({
      fromBeat, toBeat: step?.id ?? null, intent: step?.shotIntent ?? null,
      family: d._lastTransition ?? null,
      crossedSpace: fromSpace !== rt.state.activeSpaceId,
      space: rt.state.activeSpaceId,
      requested, samples, settledAt,
      final: { position: [...rt.camera.pose.position], target: [...rt.camera.pose.target] }
    });
  }
  return out;
});

for (const r of raw) {
  const base = BASE.get(r.toBeat);
  // A portal is an authored cut across a space boundary. Measuring it as an
  // in-room move compares samples from two rooms against one room's bounds, which
  // is meaningless rather than failing. Block 2A ends at the threshold.
  const isCut = r.intent === 'PORTAL' || r.crossedSpace;

  const dPos = base ? Math.max(...r.final.position.map((v, i) => Math.abs(v - base.position[i]))) : null;
  const dTgt = base ? Math.max(...r.final.target.map((v, i) => Math.abs(v - base.target[i]))) : null;
  const lockPos = r.requested ? Math.max(...r.final.position.map((v, i) => Math.abs(v - r.requested.position[i]))) : null;
  const lockTgt = r.requested ? Math.max(...r.final.target.map((v, i) => Math.abs(v - r.requested.target[i]))) : null;

  let outside = 0;
  const bounds = SPACES.get(r.space);
  if (bounds && !isCut) {
    const [bw, bh, bd] = bounds.size; const [ox, oy, oz] = bounds.origin;
    for (const s of r.samples) {
      const [x, y, z] = s.position;
      if (x < ox - bw / 2 - 1 || x > ox + bw / 2 + 1
        || z < oz - bd / 2 - 1 || z > oz + bd / 2 + 1
        || y < oy - 0.2 || y > oy + bh + 0.5) outside += 1;
    }
  }

  let maxTurn = 0;
  if (!isCut) {
    for (let i = 1; i < r.samples.length; i += 1) {
      const a = r.samples[i - 1]; const b = r.samples[i];
      const da = Math.atan2(a.target[0] - a.position[0], a.target[2] - a.position[2]);
      const db = Math.atan2(b.target[0] - b.position[0], b.target[2] - b.position[2]);
      let t = Math.abs(db - da);
      if (t > Math.PI) t = 2 * Math.PI - t;
      maxTurn = Math.max(maxTurn, t);
    }
  }

  const exact = isCut || (lockPos !== null && lockPos < 1e-9 && lockTgt < 1e-9);
  const withinBase = isCut || (dPos !== null && dPos <= 0.005 && dTgt <= 0.005);
  const pass = exact && withinBase && outside === 0;
  results.push({
    beat: r.toBeat, from: r.fromBeat, intent: r.intent, family: r.family, cut: isCut,
    lockPosition: lockPos, lockTarget: lockTgt,
    baselineDeltaPosition: dPos, baselineDeltaTarget: dTgt, withinBaselineRounding: withinBase,
    pathSamplesOutside: outside, maxTurnPerFrameDeg: +(maxTurn * 180 / Math.PI).toFixed(2),
    frames: r.samples.length, pass,
    path: r.samples.map((s) => s.position.map((n) => +n.toFixed(3)))
  });
  console.log(`  ${isCut ? '··' : pass ? 'ok' : '!!'} ${String(r.toBeat).replace(/^step\./, '').padEnd(30)} ` +
    `${String(isCut ? 'CORTE (fuera de 2A)' : r.family).padEnd(22)} ` +
    (isCut ? 'portal — no medido' :
      `lock=${lockPos?.toExponential(1)} · baseline Δ=${dPos?.toFixed(4)} ${withinBase ? 'dentro' : 'FUERA'} · fuera=${outside} · giro=${(maxTurn * 180 / Math.PI).toFixed(1)}°`));
}

const measured = results.filter((r) => !r.cut);
const families = {};
for (const r of measured) families[r.family] = (families[r.family] || 0) + 1;
console.log('\n  medidas:', measured.length, '· cortes fuera de alcance:', results.length - measured.length,
  '· fallos:', measured.filter((r) => !r.pass).length);
console.log('  familias:', JSON.stringify(families));

await fs.writeFile(path.join(OUT, 'slice.json'), JSON.stringify({ generatedAt: new Date().toISOString(), results, errors }, null, 1));
console.log('errores de consola:', errors.length ? errors.slice(0, 3) : 'ninguno');
await browser.close();
server.close();
