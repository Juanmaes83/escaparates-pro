/**
 * Capture and measure any portal beat's crossing.
 *
 * The Block 2B slice proves one canonical crossing in depth. This one is
 * parameterised, so a second doorway — or a variant treatment of the same one —
 * can be looked at and measured on the same terms rather than argued about.
 *
 *   node qa/tools/crossing-capture.mjs --beat step.02-paso-galeria-a --label lobby
 *   node qa/tools/crossing-capture.mjs --beat step.08-paso-galeria-b --label gallery --frames 9
 */
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const arg = (name, fallback = null) => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};
const BEAT = arg('beat', 'step.08-paso-galeria-b');
const LABEL = arg('label', 'crossing');
const FRAMES = Number(arg('frames', '7'));
const VARIANT = arg('variant', 'A');

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MODULE_ROOT = path.resolve(HERE, '..', '..');
const REPO_ROOT = path.resolve(MODULE_ROOT, '../..');
const OUT = path.join(MODULE_ROOT, 'qa', 'evidence-compare');
const PORT = Number(process.env.IW_CAPTURE_PORT || 4600);
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
page.setDefaultTimeout(900000);
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(`${BASE}/index.html?tier=HIGH&portalVariant=${VARIANT}`, { waitUntil: 'load' });
await page.waitForFunction(() => window.__IW?.ready === true, { timeout: 900000 });
await page.evaluate(() => { window.__IW.hud.el.veil.hidden = true; });

await page.evaluate(() => {
  const rt = window.__IW.runtime;
  rt.stopLoop();
  let clock = 0;
  window.__CAP = {
    // Simulated, not rendered: a frame costs ~2 s on this rasteriser and only the
    // captured ones need to exist on screen.
    step: (n) => {
      for (let i = 0; i < n; i += 1) {
        clock += 1 / 60;
        rt.experience.update(1 / 60);
        const pose = rt.camera.update(1 / 60);
        rt.proximity.update(1 / 60, pose.position);
        rt.sceneKit.update(1 / 60, clock);
      }
    },
    draw: () => {
      window.__IW.renderHost.applyPose(rt.camera.pose);
      window.__IW.renderHost.render(rt.sceneKit.scene);
    }
  };
});

// Walk the route to the beat before the target, so the crossing starts from the
// pose the visitor really departs from.
const arrival = await page.evaluate(async (beatId) => {
  const rt = window.__IW.runtime;
  const d = rt.experience;
  rt.startRoute(rt.defaultRouteId);
  d.pause();
  for (let n = 0; n < 40; n += 1) {
    const next = d.steps[d.index + 1];
    if (!next || next.id === beatId) break;
    d._advance();
    if (d._pendingStep) { try { await d._pendingStep; } catch { /* */ } }
    window.__CAP.step(60);
  }
  for (let a = 0; a < 30 && !rt.sceneKit.guideSettled(); a += 1) window.__CAP.step(60);
  window.__CAP.step(120);

  // The destination has to be standing and lit before the move, or the opening
  // photographs black and the capture cannot show the thing it exists to show.
  const portalId = d.steps[d.index + 1]?.action?.target;
  const portal = portalId ? rt.store.require(portalId) : null;
  if (portal) {
    const startedAt = performance.now();
    while (rt.spaces.stateOf(portal.toSpaceId) !== 'READY' && performance.now() - startedAt < 90000) {
      window.__CAP.step(6);
      await new Promise((r) => setTimeout(r, 25));
    }
  }
  return {
    parkedAt: d.currentStep?.id ?? null,
    nextBeat: d.steps[d.index + 1]?.id ?? null,
    portalId,
    hint: portal?.representationHint ?? null,
    behaviour: portal?.transitionBehaviour ?? null,
    fromSpace: portal?.fromSpaceId ?? null,
    toSpace: portal?.toSpaceId ?? null,
    destinationState: portal ? rt.spaces.stateOf(portal.toSpaceId) : null
  };
}, BEAT);

console.log(`  ${LABEL}: ${arrival.parkedAt} → ${arrival.nextBeat}`);
console.log(`  portal ${arrival.portalId} · ${arrival.hint}/${arrival.behaviour} · ${arrival.fromSpace} → ${arrival.toSpace} · destination ${arrival.destinationState}`);

const shots = [];
const capture = async (id, caption) => {
  await page.evaluate(() => window.__CAP.draw());
  const file = `${LABEL}_${id}.png`;
  await page.screenshot({ path: path.join(OUT, file) });
  shots.push({ id, file, caption });
  console.log(`  📸 ${file} — ${caption}`);
};

await capture('00_before', 'before the crossing — departure pose');

// Start the crossing, then step it, capturing evenly across the flight.
await page.evaluate(async () => {
  const d = window.__IW.runtime.experience;
  d.resume();
  d._advance();
  if (d._pendingStep) { try { await d._pendingStep; } catch { /* */ } }
});

// Capture points are decided by where the camera is, not by a frame number, so
// the same fractions mean the same moments on doorways of different lengths.
const marks = Array.from({ length: FRAMES }, (_, i) => (i + 1) / (FRAMES + 1));
const trace = [];
let frame = 0;
let flying = true;
let taken = 0;
while (flying && frame < 900) {
  const t = await page.evaluate(() => {
    const rt = window.__IW.runtime;
    window.__CAP.step(1);
    const fog = rt.sceneKit.scene.fog;
    return {
      position: [...rt.camera.pose.position], fov: rt.camera.pose.fov,
      owner: rt.camera.owner, space: rt.state.activeSpaceId,
      exposure: +rt.sceneKit.renderHost.renderer.toneMappingExposure.toFixed(4),
      fogFar: fog ? +fog.far.toFixed(1) : null,
      crossing: rt.crossing.isCrossing
    };
  });
  trace.push(t);
  frame += 1;
  flying = t.crossing;
  // Progress along the crossing axis, which is what "half way through the
  // doorway" actually means.
  if (t.crossing && taken < marks.length) {
    const plan = await page.evaluate(() => window.__IW.runtime.crossing.lastPlan);
    const total = plan?.durationMs ? plan.durationMs / (1000 / 60) : 300;
    if (frame / total >= marks[taken]) {
      await capture(`${String(taken + 1).padStart(2, '0')}_flight`,
        `${Math.round(marks[taken] * 100)}% through the crossing`);
      taken += 1;
    }
  }
}
await page.evaluate(() => window.__IW.runtime.experience.pause());

await capture('99_after', 'after the crossing — arrival pose');

const crossingFrames = trace.filter((t) => t.crossing);
const exposures = crossingFrames.map((t) => t.exposure);
let worstExposureJump = 0;
for (let i = 1; i < exposures.length; i += 1) {
  worstExposureJump = Math.max(worstExposureJump, Math.abs(exposures[i] - exposures[i - 1]));
}
const owners = [...new Set(crossingFrames.map((t) => t.owner))];
const handoffIndex = trace.findIndex((t) => t.space === arrival.toSpace);

const report = {
  label: LABEL, variant: VARIANT, beat: BEAT, generatedAt: new Date().toISOString(), ...arrival,
  frames: crossingFrames.length,
  owners,
  handoffIndex,
  exposureFrom: exposures[0] ?? null,
  exposureTo: exposures[exposures.length - 1] ?? null,
  worstExposureJump: +worstExposureJump.toFixed(6),
  shots, trace, errors
};
await fs.writeFile(path.join(OUT, `${LABEL}.json`), JSON.stringify(report, null, 1));

console.log(`  frames ${crossingFrames.length} · authority ${owners.join(',')} · handoff at frame ${handoffIndex}`);
console.log(`  exposure ${report.exposureFrom} → ${report.exposureTo} · worst single-frame step ${report.worstExposureJump}`);
console.log(`  errors: ${errors.length || 'none'}`);
console.log(`\n  evidence: qa/evidence-compare/${LABEL}.json`);

await browser.close();
server.close();
