/**
 * Mission E — is a reconstructed state the same state, and how long does it cost?
 *
 * Two ways to arrive at a late tour stop exist today:
 *
 *   PLAYBACK        the visitor watches every beat happen
 *   RECONSTRUCTION  a QA state, an authoring preview or a direct jump wants the
 *                   end state and is not watching the journey
 *
 * The QA harness reconstructs by replaying playback with a real-time wait per
 * beat, which is why a late stop costs ~100 s. The engine already has a semantic
 * seek that does not wait. This measures both, at early / mid / late stops, and
 * compares the resulting state field by field — because a faster path that lands
 * somewhere subtly different is not a faster path, it is a bug.
 *
 * Speed is the cheap half of the question. Equivalence is the half that decides.
 *
 *   node qa/tools/seek-equivalence.mjs
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
const OUT = path.join(MODULE_ROOT, 'qa', 'evidence-seek');
const PORT = Number(process.env.IW_SEEK_PORT || 4560);
const RUN_ID = `seek-${new Date().toISOString().replace(/[:.]/g, '-')}`;
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
const BASE = `http://127.0.0.1:${PORT}/labs/immersive-worlds`;

const browser = await chromium.launch({ headless: true, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.setDefaultTimeout(600000);
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));

await page.goto(`${BASE}/index.html?reducedMotion=1&tier=HIGH`, { waitUntil: 'load' });
await page.waitForFunction(() => window.__IW?.ready === true, { timeout: 600000 });

// Everything a reconstructed state has to get right. Read once, compared twice.
await page.evaluate(() => {
  window.__SEEK = {
    snapshot: () => {
      const rt = window.__IW.runtime;
      const g = rt.sceneKit._guide;
      const v = rt.sceneKit._visitor;
      const round = (n) => Math.round(n * 1000) / 1000;
      return {
        step: rt.experience.currentStep?.id ?? null,
        tourStep: rt.experience.currentTourStep?.id ?? null,
        tourOrder: rt.experience.tourOrder,
        index: rt.experience.index,
        transport: rt.experience.transport,
        mode: rt.state.mode,
        activeSpace: rt.state.activeSpaceId,
        routeId: rt.state.routeId ?? null,
        focus: rt.state.focusedEntityId ?? null,
        cameraOwner: rt.camera.owner,
        cameraViolations: rt.camera.violations.length,
        pose: [...rt.camera.pose.position, ...rt.camera.pose.target].map(round),
        fov: round(rt.camera.pose.fov),
        guideStaged: Boolean(g),
        guideOpacity: g ? Math.round(g.current.opacity * 100) / 100 : null,
        guidePos: g ? g.current.position.map(round) : null,
        visitorStaged: Boolean(v),
        visitorOpacity: v ? Math.round(v.current.opacity * 100) / 100 : null,
        // Holds a crossing must not leave behind.
        crossingActive: rt.crossing.isCrossing,
        crossingHolds: Boolean(rt._crossingHolds),
        atmosphereLocked: Boolean(rt.sceneKit._atmosphereLock),
        pendingWorkingSet: Boolean(rt.spaces._pendingWorkingSet),
        exposure: round(rt.sceneKit.renderHost.renderer.toneMappingExposure),
        fogFar: rt.sceneKit.scene.fog ? round(rt.sceneKit.scene.fog.far) : null,
        workingSet: rt.spaces.workingSet.map((s) => `${s.spaceId.replace('space.', '')}:${s.state}`).sort().join(' '),
        visited: rt.state.visitedEntityIds ? [...rt.state.visitedEntityIds].sort().join(',') : null,
        portalsTraversed: rt.state.traversedPortalIds ? [...rt.state.traversedPortalIds].sort().join(',') : null
      };
    },
    // The current QA reconstruction: replay playback with a real-time wait per
    // beat. This is the ~100 s path.
    playback: async (stepId) => {
      const rt = window.__IW.runtime;
      rt.startRoute('route.comentado');
      rt.experience.pause();
      for (let i = 0; i < 40; i += 1) {
        if (rt.experience.currentStep?.id === stepId) break;
        rt.experience.next();
        const isPortal = rt.experience.currentStep?.shotIntent === 'PORTAL';
        await new Promise((r) => setTimeout(r, isPortal ? 2500 : 320));
      }
      rt.experience.pause();
      for (let i = 0; i < 900; i += 1) rt.sceneKit.update?.(1 / 60, i / 60);
      await new Promise((r) => setTimeout(r, 0));
    },
    // The engine's own semantic seek, which waits on real work rather than on a
    // clock.
    seek: async (tourStepId) => {
      const rt = window.__IW.runtime;
      await rt.experience.seekToTourStep(tourStepId);
      for (let i = 0; i < 900; i += 1) rt.sceneKit.update?.(1 / 60, i / 60);
      await new Promise((r) => setTimeout(r, 0));
    },
    reset: () => {
      const rt = window.__IW.runtime;
      rt.experience.exit({ restorePose: false, reason: 'qa-reset' });
    },
    tourStops: () => window.__IW.runtime.tour.steps.map((s) => ({ id: s.id, first: s.firstBeatIndex }))
  };
});

const stops = await page.evaluate(() => window.__SEEK.tourStops());
// Early, mid and late — the mandate's three sample points.
const cases = [
  { label: 'early', tourStepId: stops[2].id },
  { label: 'mid', tourStepId: stops[5].id },
  { label: 'late', tourStepId: stops[8].id }
];

const rows = [];
for (const c of cases) {
  // Playback first, from a clean route.
  await page.evaluate(() => window.__SEEK.reset());
  const t0 = Date.now();
  await page.evaluate((id) => window.__SEEK.playback(id), c.tourStepId);
  const playbackMs = Date.now() - t0;
  const playback = await page.evaluate(() => window.__SEEK.snapshot());

  // Then reconstruction, from a clean route.
  await page.evaluate(() => window.__SEEK.reset());
  const t1 = Date.now();
  await page.evaluate((id) => window.__SEEK.seek(id), c.tourStepId);
  const seekMs = Date.now() - t1;
  const seek = await page.evaluate(() => window.__SEEK.snapshot());

  const keys = [...new Set([...Object.keys(playback), ...Object.keys(seek)])];
  const diffs = keys.filter((k) => JSON.stringify(playback[k]) !== JSON.stringify(seek[k]));
  rows.push({ ...c, playbackMs, seekMs, playback, seek, diffs });

  console.log(`\n  ${c.label.toUpperCase()} — ${c.tourStepId}`);
  console.log(`    playback      ${String(playbackMs).padStart(7)} ms → ${playback.step} · ${playback.activeSpace} · ${playback.cameraOwner}`);
  console.log(`    reconstruction${String(seekMs).padStart(7)} ms → ${seek.step} · ${seek.activeSpace} · ${seek.cameraOwner}`);
  console.log(`    speedup ${(playbackMs / Math.max(seekMs, 1)).toFixed(1)}× · differing fields: ${diffs.length ? diffs.join(', ') : 'none'}`);
  for (const k of diffs) {
    console.log(`        ${k}: playback=${JSON.stringify(playback[k])}  seek=${JSON.stringify(seek[k])}`);
  }
}

const equivalent = rows.every((r) => r.diffs.length === 0);
const worstSeek = Math.max(...rows.map((r) => r.seekMs));
console.log('');
console.log(`  worst reconstruction: ${worstSeek} ms · equivalent at every stop: ${equivalent ? 'YES' : 'NO'}`);
console.log(`  console errors: ${errors.length ? errors.slice(0, 2).join(' | ') : 'none'}`);

await fs.writeFile(path.join(OUT, 'seek-equivalence.json'), JSON.stringify({
  runId: RUN_ID, generatedAt: new Date().toISOString(), stops, rows, errors
}, null, 1));
console.log(`\n  evidence: qa/evidence-seek/seek-equivalence.json · RUN_ID ${RUN_ID}`);

await browser.close();
server.close();
process.exit(equivalent ? 0 : 1);
