/**
 * Mission C — is the guide out of the doorway, and did the camera stay put?
 *
 * Two defects to close at `step.07-lleva-umbral`: the guide stands in the middle
 * of the 2.6 m opening she is telling the visitor to look through, and the
 * crossing then flies through her while she fades.
 *
 * The constraint that shapes the fix: for a LEAD toward a Space, `_leadFraming`
 * derives the camera *entirely* from the guide anchor —
 * `position = anchor − heading × 2.9`. Moving the anchor moves the approved
 * camera endpoint one for one, which the mandate forbids. So the figure has to
 * move without the anchor moving, which is exactly what the authored `aside`
 * flag already does on every cesión beat: it shifts the staged figure and leaves
 * the framing reading the raw anchor.
 *
 * This measures both halves — where she stands, and whether the endpoint moved —
 * plus the clearance between her and the path the crossing actually flies.
 *
 *   node qa/tools/guide-threshold.mjs before
 *   node qa/tools/guide-threshold.mjs after
 */
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const LABEL = process.argv[2] || 'before';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const MODULE_ROOT = path.resolve(HERE, '..', '..');
const REPO_ROOT = path.resolve(MODULE_ROOT, '../..');
const OUT = path.join(MODULE_ROOT, 'qa', 'evidence-guide');
const PORT = Number(process.env.IW_GUIDE_PORT || 4590);
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
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.setDefaultTimeout(600000);
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(`${BASE}/index.html?tier=HIGH`, { waitUntil: 'load' });
await page.waitForFunction(() => window.__IW?.ready === true, { timeout: 600000 });
await page.evaluate(() => { window.__IW.hud.el.veil.hidden = true; });

/* -- contextual runway ------------------------------------------------------
 * Not a full route replay, and not a jump to the threshold either. The guide
 * walks between stops, so her staging at the threshold depends on where she
 * came from — arriving there cold would measure a pose the visitor never sees.
 * Re-enter at the sculpture stop, play the real beats through to the threshold,
 * and measure the beat in the sequence it actually occurs in.
 */
const measured = await page.evaluate(async () => {
  const rt = window.__IW.runtime;
  const d = rt.experience;
  rt.stopLoop();

  const stops = rt.tour.steps.map((s) => s.id);
  // The route has to be running before it can be sought within: at a fresh boot
  // there is no routeId and no last route, so the seek silently had nothing to
  // seek inside and reported a null beat at the lobby spawn.
  rt.startRoute(rt.defaultRouteId);
  d.pause();
  // stops[5] is the sculpture stop — two meaningful stops before the threshold.
  const sought = await d.seekToTourStep(stops[5]);
  if (!sought) throw new Error(`[QA] seek to ${stops[5]} failed`);

  // Simulate without rendering. rt.step() draws through onFrame, and a frame on
  // this software rasteriser costs about two seconds, so a 240-frame settle is
  // eight minutes of drawing nobody looks at — the same trap the crossing slice
  // hit. Only the final frame needs to be on screen, and it is drawn explicitly
  // before the capture.
  let clock = 0;
  const spin = (n) => {
    for (let i = 0; i < n; i += 1) {
      clock += 1 / 60;
      rt.experience.update(1 / 60);
      const pose = rt.camera.update(1 / 60);
      rt.proximity.update(1 / 60, pose.position);
      rt.sceneKit.update(1 / 60, clock);
    }
  };
  window.__DRAW = () => {
    window.__IW.renderHost.applyPose(rt.camera.pose);
    window.__IW.renderHost.render(rt.sceneKit.scene);
  };
  spin(240);

  // Walk the real beats from there to the threshold, playing the choreography.
  const trail = [];
  for (let guard = 0; guard < 12; guard += 1) {
    if (d.currentStep?.id === 'step.07-lleva-umbral') break;
    d._advance();
    if (d._pendingStep) { try { await d._pendingStep; } catch { /* */ } }
    spin(150);
    trail.push(d.currentStep?.id ?? null);
  }
  // Let her finish walking to the threshold staging.
  for (let a = 0; a < 30 && !rt.sceneKit.guideSettled(); a += 1) spin(60);
  spin(180);

  // Galería B has to be standing and lit, or the opening photographs black and
  // the evidence cannot show the thing it exists to show — whether the guide is
  // blocking the view into the next room. The prefetch is asynchronous and real,
  // and spin() advances simulated time only, so this waits in wall-clock time
  // for the same work a visitor's minute in Galería A pays for.
  const prefetchStart = performance.now();
  while (rt.spaces.stateOf('space.gallery-b') !== 'READY' && performance.now() - prefetchStart < 90000) {
    spin(6);
    await new Promise((r) => setTimeout(r, 25));
  }
  rt.spaces.reconcilePresence?.();
  spin(60);

  const g = rt.sceneKit._guide;
  const threshold = rt.sceneKit.thresholdFor('portal.gallery-a-gallery-b', { eyeHeight: rt.explore.eyeHeight });
  const round = (n) => Math.round(n * 1000) / 1000;
  return {
    trail,
    step: d.currentStep?.id ?? null,
    cameraPosition: rt.camera.pose.position.map(round),
    cameraTarget: rt.camera.pose.target.map(round),
    guidePosition: g ? g.current.position.map(round) : null,
    guideYaw: g ? round(g.current.yaw) : null,
    guideOpacity: g ? round(g.current.opacity) : null,
    guideAnchor: rt.sceneKit._anchorPoses.get('anchor.gallery-a.guide-umbral')?.position.map(round) ?? null,
    threshold: threshold ? { gate: threshold.gate.map(round), width: threshold.width, axis: threshold.axis } : null,
    settled: rt.sceneKit.guideSettled(),
    destinationState: rt.spaces.stateOf('space.gallery-b'),
    destinationVisible: rt.sceneKit._spaces.get('space.gallery-b')?.group.visible ?? null
  };
});

await page.evaluate(() => window.__DRAW());
await page.screenshot({ path: path.join(OUT, `threshold_${LABEL}.png`) });

// Clearance: how close does the crossing path pass to where she is standing?
// The path runs from the camera's threshold pose through the gate to the arrival
// pose, so the nearest approach on that segment is what would intersect her.
const g = measured.guidePosition;
const gate = measured.threshold?.gate;
let clearance = null;
if (g && gate) {
  const a = measured.cameraPosition;
  const b = [gate[0] + 1.7, gate[1], gate[2]];
  const abx = b[0] - a[0]; const abz = b[2] - a[2];
  const t = Math.max(0, Math.min(1, ((g[0] - a[0]) * abx + (g[2] - a[2]) * abz) / (abx * abx + abz * abz)));
  clearance = Math.round(Math.hypot(a[0] + abx * t - g[0], a[2] + abz * t - g[2]) * 1000) / 1000;
}

// Does she block the view through the opening?
//
// "Is her centre within the opening's half-width" was the first metric and it is
// too crude to answer that: at 0.92 m off-axis it still reported YES while the
// picture plainly showed a clear doorway with her at its edge. What matters is
// whether her body overlaps the middle of the aperture — the part a visitor
// actually looks through when told to look at the next room.
const halfWidth = (measured.threshold?.width ?? 2.6) / 2;
const lateralFromAxis = g && gate ? Math.round(Math.abs(g[2] - gate[2]) * 1000) / 1000 : null;
const SHOULDER = 0.5;
const centralHalf = halfWidth / 3;
const occludesCentre = lateralFromAxis !== null && (lateralFromAxis - SHOULDER / 2) < centralHalf;
const insideOpening = lateralFromAxis !== null && lateralFromAxis < halfWidth;

const report = { label: LABEL, generatedAt: new Date().toISOString(), ...measured, clearance, lateralFromAxis, insideOpening, occludesCentre, centralHalf, halfWidth, errors };
await fs.writeFile(path.join(OUT, `threshold-${LABEL}.json`), JSON.stringify(report, null, 1));

console.log(`  runway: ${measured.trail.filter(Boolean).join(' → ')}`);
console.log(`  beat            ${measured.step}`);
console.log(`  camera          [${measured.cameraPosition.join(', ')}] → [${measured.cameraTarget.join(', ')}]`);
console.log(`  guide anchor    [${measured.guideAnchor?.join(', ')}]`);
console.log(`  guide staged    [${measured.guidePosition?.join(', ')}]  yaw ${measured.guideYaw}  opacity ${measured.guideOpacity}`);
console.log(`  gate            [${measured.threshold?.gate.join(', ')}]  opening ${measured.threshold?.width} m`);
console.log(`  destination     ${measured.destinationState}, visible=${measured.destinationVisible}`);
console.log(`  lateral off axis ${lateralFromAxis} m · within aperture span: ${insideOpening ? 'yes' : 'no'} · blocks the centre: ${occludesCentre ? 'YES' : 'no'}`);
console.log(`  crossing clearance to the guide: ${clearance} m`);
console.log(`  console errors: ${errors.length || 'none'}`);
console.log(`\n  evidence: qa/evidence-guide/threshold-${LABEL}.json + threshold_${LABEL}.png`);

await browser.close();
server.close();
