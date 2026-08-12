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

// Every consecutive pair on the route, so the map is measured rather than asserted.
const routeBeats = await page.evaluate(() => {
  const rt = window.__IW.runtime;
  rt.startRoute(rt.defaultRouteId);
  const ids = rt.experience.steps.map((s) => s.id);
  rt.exitRoute();
  return ids;
});
const cases = CASES || routeBeats.slice(1).map((id, i) => ({
  id: `${String(i + 2).padStart(2, '0')}_${id.replace(/^step\./, '')}`,
  to: id,
  label: `${routeBeats[i]} → ${id}`
}));

const results = [];
for (const c of cases) {
  const r = await page.evaluate(async ({ to }) => {
    const rt = window.__IW.runtime;
    const d = rt.experience;
    // Reconstruct to the beat *before* the one under test, with motion off so the
    // approach is deterministic, then re-enable motion for the transition itself.
    d.reducedMotion = true;
    rt.directed.setReducedMotion(true);
    rt.startRoute(rt.defaultRouteId);
    d.pause();
    let guard = 0;
    while (d.steps[d.index + 1] && d.steps[d.index + 1].id !== to && guard++ < 60) {
      await d._advanceAndSettle();
    }
    const fromBeat = d.currentStep?.id ?? null;
    for (let i = 0; i < 600; i += 1) rt.sceneKit.update?.(1 / 60, i / 60);

    d.reducedMotion = false;
    rt.directed.setReducedMotion(false);
    d._advance();
    // The pose the Director actually asked for. Comparing the landing against this
    // is the real endpoint-lock question; the stored baseline is rounded to
    // centimetres and cannot resolve better than 5 mm.
    const requested = rt.directed._to
      ? { position: [...rt.directed._to.position], target: [...rt.directed._to.target] }
      : null;
    if (d._pendingStep) { try { await d._pendingStep; } catch { /* reported elsewhere */ } }

    // Step the clock through the move, sampling as we go.
    const samples = [];
    let settledAt = -1;
    for (let i = 0; i < 1200; i += 1) {
      rt.clock.tick?.(1 / 60);
      rt.camera.update(1 / 60);
      rt.sceneKit.update?.(1 / 60, i / 60);
      samples.push({
        position: [...rt.camera.pose.position],
        target: [...rt.camera.pose.target],
        travelling: rt.directed.isTravelling
      });
      // Keep going a little past completion: a residual must not be the harness
      // stopping the clock before the move lands.
      if (!rt.directed.isTravelling && i > 3) {
        if (settledAt < 0) settledAt = i;
        if (i - settledAt > 8) break;
      }
    }
    return {
      fromBeat, toBeat: d.currentStep?.id ?? null, family: d._lastTransition ?? null,
      space: rt.state.activeSpaceId,
      samples, settledAt, completed: !rt.directed.isTravelling, requested,
      directedHold: rt.directed._holdPose ? [...rt.directed._holdPose.position] : null,
      final: { position: [...rt.camera.pose.position], target: [...rt.camera.pose.target] }
    };
  }, { to: c.to });

  // --- endpoint lock ---------------------------------------------------------
  const base = BASE.get(c.to);
  const dPos = base ? Math.max(...r.final.position.map((v, i) => Math.abs(v - base.position[i]))) : null;
  const dTgt = base ? Math.max(...r.final.target.map((v, i) => Math.abs(v - base.target[i]))) : null;
  // Exactness against what was requested — full precision, no rounding floor.
  const lockPos = r.requested ? Math.max(...r.final.position.map((v, i) => Math.abs(v - r.requested.position[i]))) : null;
  const lockTgt = r.requested ? Math.max(...r.final.target.map((v, i) => Math.abs(v - r.requested.target[i]))) : null;

  // --- path containment ------------------------------------------------------
  const bounds = SPACES.get(r.space);
  let outside = 0;
  if (bounds) {
    const [bw, bh, bd] = bounds.size; const [ox, oy, oz] = bounds.origin;
    for (const s of r.samples) {
      const [x, y, z] = s.position;
      if (x < ox - bw / 2 - 1 || x > ox + bw / 2 + 1
        || z < oz - bd / 2 - 1 || z > oz + bd / 2 + 1
        || y < oy - 0.2 || y > oy + bh + 0.5) outside += 1;
    }
  }

  // --- orientation -----------------------------------------------------------
  let maxTurn = 0;
  for (let i = 1; i < r.samples.length; i += 1) {
    const a = r.samples[i - 1]; const b = r.samples[i];
    const da = Math.atan2(a.target[0] - a.position[0], a.target[2] - a.position[2]);
    const db = Math.atan2(b.target[0] - b.position[0], b.target[2] - b.position[2]);
    let turn = Math.abs(db - da);
    if (turn > Math.PI) turn = 2 * Math.PI - turn;
    maxTurn = Math.max(maxTurn, turn);
  }

  results.push({
    ...c, family: r.family, fromBeat: r.fromBeat, toBeat: r.toBeat,
    frames: r.samples.length, settledAt: r.settledAt, completed: r.completed,
    directedVsBaseline: base && r.directedHold
      ? +Math.max(...r.directedHold.map((v, i) => Math.abs(v - base.position[i]))).toFixed(5) : null,
    endpointDeltaPosition: dPos, endpointDeltaTarget: dTgt,
    lockPosition: lockPos, lockTarget: lockTgt,
    withinBaselineRounding: dPos !== null && dPos <= 0.005 && dTgt <= 0.005,
    pathSamplesOutside: outside,
    maxTurnPerFrameDeg: +(maxTurn * 180 / Math.PI).toFixed(2),
    path: r.samples.map((s) => s.position.map((n) => +n.toFixed(3)))
  });
  const exact = lockPos !== null && lockPos < 1e-9 && lockTgt < 1e-9;
  const withinBase = dPos !== null && dPos <= 0.005 && dTgt <= 0.005;
  console.log(`  ${exact && withinBase && outside === 0 ? 'ok' : '!!'} ${c.id.padEnd(16)} ${String(r.family).padEnd(22)} ` +
    `lock=${lockPos?.toExponential(1)}/${lockTgt?.toExponential(1)} · vs baseline(1cm) Δ=${dPos?.toFixed(4)} ${withinBase ? 'dentro' : 'FUERA'} · fuera de sala=${outside} · giro máx=${(maxTurn * 180 / Math.PI).toFixed(1)}°`);
}

await fs.writeFile(path.join(OUT, 'slice.json'), JSON.stringify({ generatedAt: new Date().toISOString(), results, errors }, null, 1));
console.log('errores de consola:', errors.length ? errors.slice(0, 3) : 'ninguno');
await browser.close();
server.close();
