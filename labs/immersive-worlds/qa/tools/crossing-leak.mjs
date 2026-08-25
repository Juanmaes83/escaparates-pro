/**
 * Does a crossing that is abandoned rather than completed leave anything held?
 *
 * The crossing takes two things it must give back: it locks the Scene Kit's
 * atmosphere so activation cannot stamp the destination mid-blend, and it defers
 * the lifecycle's working-set reconcile so no room is disposed under the camera.
 * Both are released on completion. The question here is what happens when a
 * crossing never completes — a seek, an exit, a visitor pressing Escape in a
 * doorway — which is exactly what the QA suite's tour and grammar sections do to
 * the route dozens of times.
 *
 *   node qa/tools/crossing-leak.mjs
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
const PORT = Number(process.env.IW_LEAK_PORT || 4530);
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

const browser = await chromium.launch({ headless: true, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox'] });
const page = await browser.newPage({ viewport: { width: 900, height: 600 } });
page.setDefaultTimeout(300000);
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(`http://127.0.0.1:${PORT}/labs/immersive-worlds/index.html?reducedMotion=1&tier=HIGH`, { waitUntil: 'load' });
await page.waitForFunction(() => window.__IW?.ready === true, { timeout: 300000 });

// Replay what the tour and grammar sections do: seek around the route repeatedly,
// which starts crossings and abandons them.
const report = await page.evaluate(async () => {
  const rt = window.__IW.runtime;
  const samples = [];
  const probe = (label) => samples.push({
    label,
    workingSet: rt.spaces.workingSet.length,
    states: rt.spaces.workingSet.map((s) => `${s.spaceId.replace('space.', '')}:${s.state}`).join(' '),
    atmosphereLocked: Boolean(rt.sceneKit._atmosphereLock),
    pendingWorkingSet: Boolean(rt.spaces._pendingWorkingSet),
    crossingHolds: Boolean(rt._crossingHolds),
    crossing: rt.crossing.isCrossing,
    activeSpace: rt.state.activeSpaceId
  });

  rt.stopLoop();
  rt.startRoute(rt.defaultRouteId);
  probe('route started');

  // Seek back and forth across the two portal beats — the abandonment case.
  //
  // The stop ids are read from the manifest rather than written here. The first
  // version of this file guessed them ('tour.04-umbral'), every seek threw, the
  // catch swallowed it, and six cycles of doing nothing at all reported clean.
  const stops = rt.tour.steps.map((s) => s.id);
  const circuit = [stops[6], stops[2], stops[7], stops[0]].filter(Boolean);
  const seekErrors = [];
  for (let cycle = 0; cycle < 2; cycle += 1) {
    for (const stop of circuit) {
      try { await rt.experience.seekToTourStep(stop); } catch (e) { seekErrors.push(String(e?.message || e)); }
      for (let i = 0; i < 20; i += 1) rt.step(1 / 60);
    }
    probe(`after seek cycle ${cycle + 1}`);
  }

  // And the honest version: a crossing interrupted by an explicit exit.
  await rt.experience.seekToTourStep(stops[6]).catch(() => {});
  rt.experience.next();
  if (rt.experience._pendingStep) { try { await rt.experience._pendingStep; } catch { /* */ } }
  probe('crossing in flight');
  rt.experience.exit({ restorePose: false, reason: 'qa-abandon' });
  probe('exited mid-crossing');
  for (let i = 0; i < 120; i += 1) rt.step(1 / 60);
  probe('120 frames after exit');

  return { samples, tourStops: stops, circuit, seekErrors };
});

console.log('  tour stops:', report.tourStops.join(', '));
console.log('  seek circuit:', report.circuit.join(' → '));
console.log('  seek errors:', report.seekErrors.length ? report.seekErrors.slice(0, 2).join(' | ') : 'none');
console.log('');
for (const s of report.samples) {
  console.log(`  ${s.label.padEnd(24)} spaces=${String(s.workingSet).padEnd(2)} ` +
    `atmLock=${String(s.atmosphereLocked).padEnd(5)} pendingWS=${String(s.pendingWorkingSet).padEnd(5)} ` +
    `holds=${String(s.crossingHolds).padEnd(5)} crossing=${String(s.crossing).padEnd(5)} · ${s.states}`);
}

const last = report.samples[report.samples.length - 1];
const peak = Math.max(...report.samples.map((s) => s.workingSet));
const checks = [
  // A seek that silently does nothing proves nothing. This is the guard on the
  // guard: if the circuit never ran, the leak results below are meaningless.
  ['the seek circuit actually ran', report.seekErrors.length === 0 && report.circuit.length === 4,
    `${report.circuit.length} stops, ${report.seekErrors.length} errors`],
  ['the crossing was reached and abandoned',
    report.samples.some((s) => s.crossing === true), 'a crossing was observed in flight'],
  ['the working set does not grow without bound', peak <= 4, `peak ${peak} spaces`],
  ['no atmosphere lock is left held', last.atmosphereLocked === false],
  ['no deferred working-set reconcile is left pending', last.pendingWorkingSet === false],
  ['no crossing hold is left set', last.crossingHolds === false],
  ['no page errors', errors.length === 0, errors.slice(0, 2).join(' | ') || 'none']
];
console.log('');
let failures = 0;
for (const [name, ok, detail] of checks) {
  if (!ok) failures += 1;
  console.log(`${ok ? '  ok  ' : ' FAIL '} ${name}${detail ? `  — ${detail}` : ''}`);
}
console.log(`\n${checks.length - failures}/${checks.length}`);

await browser.close();
server.close();
process.exit(failures ? 1 : 0);
