/**
 * Block 2B vertical slice — Galería A → Galería B, the whole crossing.
 *
 * The questions, in the order that would stop the block:
 *   1. is it still one camera authority, start to finish?
 *   2. does the room handoff happen while the camera is in the doorway?
 *   3. does it land exactly on the pose the beat was authored to end on?
 *   4. does the atmosphere resolve across the opening instead of cutting?
 *   5. is the first crossing worse than the second?
 *
 * The frames are captured by stepping the runtime by hand with the render loop
 * stopped, so a screenshot is a specific frame of a specific crossing rather
 * than whatever the browser happened to be showing.
 *
 *   node qa/tools/crossing-slice.mjs
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
const OUT = path.join(MODULE_ROOT, 'qa', 'evidence-crossing');
const PORT = Number(process.env.IW_CROSS_PORT || 4520);
const RUN_ID = `crossing-${new Date().toISOString().replace(/[:.]/g, '-')}`;
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

const browser = await chromium.launch({ headless: true, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.setDefaultTimeout(900000);
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto(`http://127.0.0.1:${PORT}/labs/immersive-worlds/index.html?tier=HIGH`, { waitUntil: 'load' });
await page.waitForFunction(() => window.__IW?.ready === true, { timeout: 900000 });
await page.evaluate(() => { window.__IW.hud.el.veil.hidden = true; });

const shots = [];
async function capture(id, caption) {
  // Draw the frame the trace is standing on, rather than trusting that the last
  // simulated frame happens to be the last rendered one.
  await page.evaluate(() => window.__CROSS.draw());
  const file = `${id}.png`;
  await page.screenshot({ path: path.join(OUT, file) });
  shots.push({ id, file, caption });
  console.log(`  📸 ${id} — ${caption}`);
}

/* == 1. drive the route up to the threshold beat ============================ */

// Hand control of the clock to this script: every frame from here is one we
// asked for, which is the only way a screenshot can name the frame it is.
await page.evaluate(() => {
  const rt = window.__IW.runtime;
  rt.stopLoop();
  rt.experience.reducedMotion = false;
  rt.directed.setReducedMotion(false);
  rt.crossing.setReducedMotion(false);
  rt.startRoute(rt.defaultRouteId);
  rt.experience.pause();
  // Simulation without rendering. `runtime.step` draws through `onFrame`, and a
  // software rasteriser at this viewport costs ~200 ms a frame — walking the
  // route to the threshold that way took longer than the whole rest of the run.
  // Nothing before a capture needs to be on screen, so nothing before a capture
  // is drawn.
  let clock = 0;
  const advance = (n) => {
    for (let i = 0; i < n; i += 1) {
      clock += 1 / 60;
      rt.experience.update(1 / 60);
      const pose = rt.camera.update(1 / 60);
      rt.proximity.update(1 / 60, pose.position);
      rt.sceneKit.update(1 / 60, clock);
    }
  };
  window.__CROSS = {
    step: advance,
    draw: () => {
      window.__IW.renderHost.applyPose(rt.camera.pose);
      window.__IW.renderHost.render(rt.sceneKit.scene);
    },
    settle: () => {
      for (let a = 0; a < 24; a += 1) {
        const before = [...rt.camera.pose.position, ...rt.camera.pose.target];
        advance(30);
        const after = [...rt.camera.pose.position, ...rt.camera.pose.target];
        if (Math.max(...after.map((v, i) => Math.abs(v - before[i]))) < 1e-4) return true;
      }
      return false;
    }
  };
});

// Walk the route beat by beat until the threshold approach.
const reached = await page.evaluate(async () => {
  const rt = window.__IW.runtime;
  const d = rt.experience;
  for (let n = 0; n < 40; n += 1) {
    if (d.currentStep?.id === 'step.07-lleva-umbral') return d.currentStep.id;
    if (!d.steps[d.index + 1]) break;
    d._advance();
    if (d._pendingStep) { try { await d._pendingStep; } catch { /* reported below */ } }
    // Portal beats earlier in the route are crossings too. Advancing past one
    // mid-flight leaves two controllers holding half a move and makes every
    // reading after it meaningless.
    let guard = 0;
    while (rt.crossing.isCrossing && guard < 600) { window.__CROSS.step(1); guard += 1; }
    window.__CROSS.step(90);
  }
  return d.currentStep?.id ?? null;
});
console.log(`  route parked at ${reached}`);

// 1 — departure. Galería A, the threshold approach just started.
await page.evaluate(() => window.__CROSS.step(24));
await capture('01_departure', 'Galería A — the threshold approach begins (T5)');

// 2/3 — the approach settles at the doorway, with Galería B live through it.
await page.evaluate(() => window.__CROSS.settle());
await capture('02_threshold', 'T5 settled at the threshold — Galería B visible through the opening');

// The prefetch of the next room is asynchronous and real: it builds and warms a
// Space. A visitor spends the better part of a minute in Galería A before they
// reach this doorway, so it has always landed by now. This harness fast-forwards
// that minute, so it has to wait for the same work in wall-clock time — otherwise
// it measures its own impatience and calls it a cold start.
const prefetchWaitedMs = await page.evaluate(async () => {
  const rt = window.__IW.runtime;
  const startedAt = performance.now();
  while (rt.spaces.stateOf('space.gallery-b') !== 'READY' && performance.now() - startedAt < 60000) {
    window.__CROSS.step(6);
    await new Promise((r) => setTimeout(r, 25));
  }
  return Math.round(performance.now() - startedAt);
});
console.log(`  waited ${prefetchWaitedMs} ms for the ON_APPROACH prefetch`);

const preCross = await page.evaluate(() => {
  const rt = window.__IW.runtime;
  return {
    pose: { position: [...rt.camera.pose.position], target: [...rt.camera.pose.target], fov: rt.camera.pose.fov },
    owner: rt.camera.owner,
    space: rt.state.activeSpaceId,
    destinationState: rt.spaces.stateOf('space.gallery-b'),
    destinationVisible: rt.sceneKit._spaces.get('space.gallery-b')?.group.visible ?? null,
    exposure: rt.sceneKit.renderHost.renderer.toneMappingExposure,
    threshold: rt.sceneKit.thresholdFor('portal.gallery-a-gallery-b', { eyeHeight: rt.explore.eyeHeight }),
    // Only meaningful once the room is built — before that the Scene Kit has no
    // Galería B to frame and hands back a placeholder. Comparing a landing
    // against that placeholder reported a 17 m endpoint error on a crossing that
    // had in fact landed exactly.
    arrivalPose: rt.spaces.stateOf('space.gallery-b') === 'READY'
      ? rt.framingFor('space.gallery-b', 'PORTAL', {})
      : null
  };
});
console.log(`  destination before the move: ${preCross.destinationState}, visible=${preCross.destinationVisible}`);

/* == 2. the crossing, frame by frame ======================================== */

// Start the crossing and stop the moment it is airborne, so the frames below are
// the crossing's own and nothing else's.
await page.evaluate(async () => {
  const rt = window.__IW.runtime;
  const d = rt.experience;
  d.resume();
  window.__TRACE = [];
  window.__EVENTS = [];
  rt.bus.on('portal:entered', (e) => window.__EVENTS.push({ at: window.__TRACE.length, ...e }));
  // Advance out of the lead beat into the portal beat.
  d._advance();
  if (d._pendingStep) { try { await d._pendingStep; } catch { /* reported below */ } }
});

// Step the crossing one frame at a time, recording everything that could differ
// between a continuous crossing and a cut.
const traceStep = async (frames) => page.evaluate((n) => {
  const rt = window.__IW.runtime;
  for (let i = 0; i < n; i += 1) {
    window.__CROSS.step(1);
    const fog = rt.sceneKit.scene.fog;
    window.__TRACE.push({
      position: [...rt.camera.pose.position],
      target: [...rt.camera.pose.target],
      fov: rt.camera.pose.fov,
      owner: rt.camera.owner,
      space: rt.state.activeSpaceId,
      step: rt.experience.currentStep?.id ?? null,
      exposure: +rt.sceneKit.renderHost.renderer.toneMappingExposure.toFixed(4),
      fogFar: fog ? +fog.far.toFixed(2) : null,
      crossing: rt.crossing.isCrossing
    });
  }
  return { last: window.__TRACE[window.__TRACE.length - 1], length: window.__TRACE.length };
}, frames);

// Frames chosen by where the camera is, not by a stopwatch.
const gateX = preCross.threshold.gate[0];
const captureAt = [
  { id: '04_portal_active', caption: 'Crossing under TRANSITION authority — the opening ahead', test: (t) => t.crossing && t.position[0] > preCross.pose.position[0] + 0.6 },
  { id: '05_middle', caption: 'Mid-crossing — inside the aperture', test: (t) => Math.abs(t.position[0] - gateX) < 0.25 },
  { id: '06_handoff', caption: 'Room handoff — the active Space changes while the camera is in the doorway', test: (t) => t.space === 'space.gallery-b' }
];
const pending = [...captureAt];

// One frame per round trip. Stepping in batches meant the loop noticed the
// landing up to five frames late, by which time the Director had already started
// the next beat and every "arrival" reading was really the beat after it.
let frames = 0;
let flying = true;
while (flying && frames < 900) {
  const tail = await traceStep(1);
  frames = tail.length;
  for (let i = pending.length - 1; i >= 0; i -= 1) {
    if (pending[i].test(tail.last)) {
      await capture(pending[i].id, pending[i].caption);
      pending.splice(i, 1);
    }
  }
  flying = tail.last.crossing;
}
// Freeze the tour on the frame the crossing landed. The Director has been left
// playing throughout, which is what proves the portal beat waited for the move
// rather than cutting it off — but one frame more and it moves on.
await page.evaluate(() => window.__IW.runtime.experience.pause());
const landing = await page.evaluate(() => {
  const rt = window.__IW.runtime;
  return {
    pose: { position: [...rt.camera.pose.position], target: [...rt.camera.pose.target], fov: rt.camera.pose.fov },
    owner: rt.camera.owner,
    space: rt.state.activeSpaceId,
    step: rt.experience.currentStep?.id ?? null,
    exposure: rt.sceneKit.renderHost.renderer.toneMappingExposure
  };
});
console.log(`  crossing flew for ${frames} frames, landed on ${landing.step}`);

// 7 — arrival, on the landing frame itself.
await capture('07_arrival', 'Arrival — Galería B, on the pose the beat was authored to end on');

const postCross = await page.evaluate(() => {
  const rt = window.__IW.runtime;
  return {
    pose: { position: [...rt.camera.pose.position], target: [...rt.camera.pose.target], fov: rt.camera.pose.fov },
    owner: rt.camera.owner,
    space: rt.state.activeSpaceId,
    exposure: rt.sceneKit.renderHost.renderer.toneMappingExposure,
    violations: rt.camera.report().violations,
    authorityHistory: rt.camera.report().history,
    events: window.__EVENTS,
    workingSet: rt.spaces.workingSet
  };
});

// 8 — continuation. Advance exactly one beat and stop there: letting the settle
// loop run free carried the tour two beats past the handoff, which photographs a
// fine frame of Galería B but proves nothing about the join.
const continuation = await page.evaluate(async () => {
  const rt = window.__IW.runtime;
  const d = rt.experience;
  const inherited = [...rt.camera.pose.position, ...rt.camera.pose.target];
  d._advance();
  if (d._pendingStep) { try { await d._pendingStep; } catch { /* reported below */ } }
  // The pose the next beat starts from. If the crossing and the Director disagree
  // about where the camera is, the join is a jump and this is where it shows.
  const startedFrom = [...rt.camera.pose.position, ...rt.camera.pose.target];
  window.__CROSS.settle();
  return {
    step: d.currentStep?.id ?? null,
    owner: rt.camera.owner,
    space: rt.state.activeSpaceId,
    joinDelta: Math.max(...startedFrom.map((v, i) => Math.abs(v - inherited[i])))
  };
});
await capture('08_continuation', 'Galería B — the next beat continues from where the crossing left the camera');

const trace = await page.evaluate(() => window.__TRACE);

/* == 3. second crossing, for the first-vs-later comparison ================== */

const repeat = await page.evaluate(async () => {
  const rt = window.__IW.runtime;
  const intent = {
    family: 'T6_ROOM_CROSSING', flat: 0.62, lead: 0.42, holdHeight: true,
    speed: 1.35, min: 2000, max: 5000, apertureFov: 2.5, pin: 0.55
  };
  const runs = [];
  rt.experience.exit({ restorePose: false, reason: 'qa-repeat' });
  // Back into Galería A, then across again — the same mechanism, warm.
  for (const portalId of ['portal.gallery-b-gallery-a', 'portal.gallery-a-gallery-b']) {
    const startedAt = performance.now();
    const result = await rt.traversePortal(portalId, { crossing: intent, source: 'QA' });
    const planned = performance.now() - startedAt;
    const frameTimes = [];
    let guard = 0;
    while (rt.crossing.isCrossing && guard < 900) {
      const t0 = performance.now();
      window.__CROSS.step(1);
      frameTimes.push(performance.now() - t0);
      guard += 1;
    }
    window.__CROSS.step(60);
    await new Promise((r) => setTimeout(r, 0));
    const sorted = [...frameTimes].sort((a, b) => a - b);
    runs.push({
      portalId,
      cameraHandled: Boolean(result?.cameraHandled),
      warmedMs: result?.waitedMs ?? null,
      planningMs: +planned.toFixed(1),
      travelMs: result?.crossing?.travelMs ?? null,
      frames: frameTimes.length,
      medianFrameMs: sorted.length ? +sorted[Math.floor(sorted.length / 2)].toFixed(2) : null,
      worstFrameMs: sorted.length ? +sorted[sorted.length - 1].toFixed(2) : null,
      landedAt: [...rt.camera.pose.position],
      arrival: rt.framingFor(rt.state.activeSpaceId, 'PORTAL', {}).position,
      space: rt.state.activeSpaceId
    });
  }
  return runs;
});

/* == 4. verdicts ============================================================ */

const crossingFrames = trace.filter((t) => t.crossing);
const handoffIndex = trace.findIndex((t) => t.space === 'space.gallery-b');
const handoffFrame = handoffIndex >= 0 ? trace[handoffIndex] : null;
const arrival = preCross.arrivalPose;

const owners = [...new Set(crossingFrames.map((t) => t.owner))];
// Measured on the frame the crossing ended, which is the only frame the endpoint
// lock is a claim about. Anything later is the next beat's pose.
const endpointDelta = arrival
  ? Math.max(...landing.pose.position.map((v, i) => Math.abs(v - arrival.position[i])))
  : null;
const endpointTargetDelta = arrival
  ? Math.max(...landing.pose.target.map((v, i) => Math.abs(v - arrival.target[i])))
  : null;

const halfWidth = preCross.threshold.width / 2;
const atWall = crossingFrames.filter((t) => Math.abs(t.position[0] - gateX) < 0.5);
const outsideAperture = atWall.filter((t) =>
  Math.abs(t.position[2] - preCross.threshold.gate[2]) > halfWidth - 0.15);

let maxTurn = 0;
for (let i = 1; i < crossingFrames.length; i += 1) {
  const a = crossingFrames[i - 1]; const b = crossingFrames[i];
  const ya = Math.atan2(a.target[2] - a.position[2], a.target[0] - a.position[0]);
  const yb = Math.atan2(b.target[2] - b.position[2], b.target[0] - b.position[0]);
  let d = Math.abs(ya - yb) * 180 / Math.PI;
  if (d > 180) d = 360 - d;
  maxTurn = Math.max(maxTurn, d);
}

// The atmosphere must move, and it must never move in one jump.
const exposures = crossingFrames.map((t) => t.exposure);
let worstExposureJump = 0;
for (let i = 1; i < exposures.length; i += 1) {
  worstExposureJump = Math.max(worstExposureJump, Math.abs(exposures[i] - exposures[i - 1]));
}

const checks = [
  ['one camera authority for the whole crossing', owners.length === 1 && owners[0] === 'TRANSITION', owners.join(',')],
  ['no camera authority violations', postCross.violations === 0, `${postCross.violations}`],
  ['the crossing is a move, not a cut', crossingFrames.length > 30, `${crossingFrames.length} frames`],
  ['handoff happens inside the doorway', handoffFrame ? Math.abs(handoffFrame.position[0] - gateX) < 0.3 : false,
    handoffFrame ? `${Math.abs(handoffFrame.position[0] - gateX).toFixed(3)} m from the wall plane` : 'never handed off'],
  ['handoff happens mid-flight, not before', handoffIndex > 5, `frame ${handoffIndex} of ${trace.length}`],
  ['destination built and visible before the camera moves', preCross.destinationState === 'READY' && preCross.destinationVisible === true,
    `${preCross.destinationState}, visible=${preCross.destinationVisible}, prefetch took ${prefetchWaitedMs} ms`],
  ['camera stays inside the aperture', outsideAperture.length === 0, `${outsideAperture.length} of ${atWall.length} wall frames outside`],
  ['lands on the authored arrival pose', endpointDelta !== null && endpointDelta < 1e-9,
    endpointDelta === null ? 'no arrival pose' : `Δ ${endpointDelta.toExponential(1)} m / ${endpointTargetDelta.toExponential(1)} m`],
  ['the look never whips', maxTurn < 3.5, `max ${maxTurn.toFixed(2)} °/frame`],
  ['atmosphere resolves gradually', worstExposureJump > 0 && worstExposureJump < 0.01,
    `largest single-frame exposure step ${worstExposureJump.toFixed(5)}`],
  ['atmosphere lands on the destination room', Math.abs(postCross.exposure - 1.05) < 1e-6,
    `exposure ${postCross.exposure}`],
  ['authority returns to the Director', postCross.owner === 'DIRECTED', postCross.owner],
  ['the crossing lands on the portal beat, not past it', landing.step === 'step.08-paso-galeria-b', String(landing.step)],
  ['the tour continues in Galería B', continuation.space === 'space.gallery-b' && continuation.step === 'step.09-lleva-noche',
    `${continuation.step} in ${continuation.space}`],
  ['the next beat starts from where the crossing landed', continuation.joinDelta === 0,
    `join Δ ${continuation.joinDelta}`],
  ['the beat waited for the crossing instead of cutting it off',
    trace.filter((t) => t.step === 'step.08-paso-galeria-b' && t.crossing).length > 30,
    `${trace.filter((t) => t.step === 'step.08-paso-galeria-b').length} frames on the portal beat`],
  ['a repeated crossing lands where its own room says it should',
    repeat.every((r) => Math.max(...r.landedAt.map((v, i) => Math.abs(v - r.arrival[i]))) < 1e-9),
    repeat.map((r) => r.space.replace('space.', '')).join(' · ')],
  ['a repeated crossing is not faster than the first',
    repeat.every((r) => r.cameraHandled) && repeat.every((r) => Math.abs(r.travelMs - (repeat[0].travelMs || 1)) < 2500),
    repeat.map((r) => `${r.travelMs}ms/${r.worstFrameMs}ms worst`).join(' · ')],
  ['no console errors', errors.length === 0, errors.slice(0, 2).join(' | ') || 'none']
];

console.log('');
let failures = 0;
for (const [name, ok, detail] of checks) {
  if (!ok) failures += 1;
  console.log(`${ok ? '  ok  ' : ' FAIL '} ${name}${detail ? `  — ${detail}` : ''}`);
}

const report = {
  runId: RUN_ID,
  prefetchWaitedMs,
  generatedAt: new Date().toISOString(),
  portal: 'portal.gallery-a-gallery-b',
  threshold: preCross.threshold,
  arrivalPose: arrival,
  before: preCross,
  landing,
  after: postCross,
  continuation,
  repeat,
  metrics: {
    crossingFrames: crossingFrames.length,
    handoffFrame: handoffIndex,
    handoffDistanceFromWall: handoffFrame ? +Math.abs(handoffFrame.position[0] - gateX).toFixed(4) : null,
    endpointDelta,
    endpointTargetDelta,
    maxTurnPerFrameDeg: +maxTurn.toFixed(3),
    worstExposureJump: +worstExposureJump.toFixed(6),
    exposureFrom: exposures[0] ?? null,
    exposureTo: exposures[exposures.length - 1] ?? null,
    apertureFramesOutside: outsideAperture.length
  },
  checks: checks.map(([name, ok, detail]) => ({ name, ok, detail })),
  shots,
  trace,
  errors
};
await fs.writeFile(path.join(OUT, 'crossing.json'), JSON.stringify(report, null, 1));

console.log(`\n${checks.length - failures}/${checks.length} checks pass · RUN_ID ${RUN_ID}`);
console.log(`evidence: qa/evidence-crossing/crossing.json + ${shots.length} frames`);

await browser.close();
server.close();
process.exit(failures ? 1 : 0);
