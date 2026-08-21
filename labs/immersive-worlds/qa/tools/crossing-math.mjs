/**
 * Crossing mechanism — properties that must hold before anything is rendered.
 *
 * Read-only, no browser, no scene. Every claim here is about the curve itself:
 * that it ends where it was told to, that it goes through the hole rather than
 * near it, and that no shaping term survives to the endpoint. A render can show
 * that a crossing looks right; only this can show it cannot land wrong.
 *
 *   node qa/tools/crossing-math.mjs
 */

import { CrossingController } from '../../engine/camera/controllers/crossing-controller.js';

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? '  ok  ' : ' FAIL '} ${name}${detail ? `  — ${detail}` : ''}`);
};

/** Drive a crossing to completion at a fixed step, collecting every pose. */
function fly(controller, endPose, options, { fps = 60, startPose } = {}) {
  controller.onGain(startPose);
  const plan = controller.playCrossing(endPose, options);
  const samples = [];
  let pose = startPose;
  let guard = 0;
  const dt = 1 / fps;
  while (controller.isCrossing && guard < 6000) {
    controller.update(dt, (p) => { pose = { position: [...p.position], target: [...p.target], fov: p.fov }; }, pose);
    samples.push(pose);
    guard += 1;
  }
  // One more frame after completion: this is the pose the next beat inherits.
  controller.update(dt, (p) => { pose = { position: [...p.position], target: [...p.target], fov: p.fov }; }, pose);
  samples.push(pose);
  return { plan, samples, final: pose };
}

// The real Galería A → Galería B geometry, read from the world file.
const START = { position: [4.42, 1.62, -10], target: [8.2, 1.55, -10], fov: 50 };
const END = { position: [9.7, 1.62, -10], target: [13.7, 1.5, -10], fov: 50 };
const GATE = [8, 1.62, -10];
const AXIS = [1, 0, 0];
const APERTURE = { width: 2.6, height: 3.0 };
const SHAPE = {
  gate: GATE, axis: AXIS, travelMs: 3900,
  flat: 0.62, lead: 0.42, holdHeight: true, apertureFov: 2.5, pin: 0.55
};

/* -- 1. the endpoint is not negotiable ------------------------------------- */
{
  const { final } = fly(new CrossingController(), END, SHAPE, { startPose: START });
  const dp = Math.max(...final.position.map((v, i) => Math.abs(v - END.position[i])));
  const dt = Math.max(...final.target.map((v, i) => Math.abs(v - END.target[i])));
  check('endpoint position exact', dp === 0, `worst axis ${dp}`);
  check('endpoint target exact', dt === 0, `worst axis ${dt}`);
  check('endpoint fov exact', final.fov === END.fov, `${final.fov} vs ${END.fov}`);
}

/* -- 2. the path goes through the opening ---------------------------------- */
{
  const { samples } = fly(new CrossingController(), END, SHAPE, { startPose: START });
  // Every sample within half a metre of the wall must be inside the aperture.
  const near = samples.filter((s) => Math.abs(s.position[0] - GATE[0]) < 0.5);
  const halfW = APERTURE.width / 2;
  const outside = near.filter((s) =>
    Math.abs(s.position[2] - GATE[2]) > halfW - 0.15 ||
    s.position[1] < 0.2 || s.position[1] > APERTURE.height - 0.2);
  check('path stays inside the aperture', outside.length === 0,
    `${near.length} samples at the wall, ${outside.length} outside`);

  const closest = Math.min(...samples.map((s) =>
    Math.hypot(s.position[0] - GATE[0], s.position[1] - GATE[1], s.position[2] - GATE[2])));
  check('path passes through the gate point', closest < 0.02, `closest approach ${closest.toFixed(4)} m`);
}

/* -- 3. no shaping term survives the move ---------------------------------- */
{
  const { samples } = fly(new CrossingController(), END, SHAPE, { startPose: START });
  const maxFov = Math.max(...samples.map((s) => s.fov));
  check('fov breathes at the aperture', maxFov > 50.5 && maxFov <= 53,
    `peak ${maxFov.toFixed(2)}°`);
  check('fov returns to the authored value', samples[samples.length - 1].fov === 50);

  // Monotonic along the axis of travel: a crossing never backs out of the door.
  let regressions = 0;
  for (let i = 1; i < samples.length; i += 1) {
    if (samples[i].position[0] < samples[i - 1].position[0] - 1e-9) regressions += 1;
  }
  check('travel is monotonic along the crossing axis', regressions === 0,
    `${regressions} reversals`);

  // The look must not whip round at the threshold.
  let maxTurn = 0;
  for (let i = 1; i < samples.length; i += 1) {
    const a = samples[i - 1]; const b = samples[i];
    const va = [a.target[0] - a.position[0], a.target[2] - a.position[2]];
    const vb = [b.target[0] - b.position[0], b.target[2] - b.position[2]];
    const angle = Math.abs(Math.atan2(va[1], va[0]) - Math.atan2(vb[1], vb[0])) * 180 / Math.PI;
    maxTurn = Math.max(maxTurn, Math.min(angle, 360 - angle));
  }
  check('look never whips', maxTurn < 3.5, `max ${maxTurn.toFixed(2)} °/frame`);
}

/* -- 3b. the same, departing off-axis -------------------------------------- */
{
  // The straight-on case above cannot exercise the aperture pin at all: every
  // target sits on z = -10, so the yaw is constant and "never whips" is true for
  // free. A real lead beat leaves the camera off to one side, looking across the
  // opening rather than down it — which is the case the pin exists for.
  const oblique = { position: [4.1, 1.62, -12.4], target: [7.6, 1.55, -10.6], fov: 50 };
  const { samples, final } = fly(new CrossingController(), END, SHAPE, { startPose: oblique });

  const near = samples.filter((s) => Math.abs(s.position[0] - GATE[0]) < 0.5);
  const outside = near.filter((s) => Math.abs(s.position[2] - GATE[2]) > APERTURE.width / 2 - 0.15);
  check('oblique departure still threads the aperture', outside.length === 0,
    `${outside.length} of ${near.length} wall samples outside`);

  let maxTurn = 0;
  let atGate = 0;
  for (let i = 1; i < samples.length; i += 1) {
    const a = samples[i - 1]; const b = samples[i];
    const ya = Math.atan2(a.target[2] - a.position[2], a.target[0] - a.position[0]);
    const yb = Math.atan2(b.target[2] - b.position[2], b.target[0] - b.position[0]);
    let d = Math.abs(ya - yb) * 180 / Math.PI;
    if (d > 180) d = 360 - d;
    maxTurn = Math.max(maxTurn, d);
    if (Math.abs(b.position[0] - GATE[0]) < 0.35) atGate = Math.max(atGate, d);
  }
  check('oblique crossing does not whip the look', maxTurn < 3.5, `max ${maxTurn.toFixed(2)} °/frame`);
  check('the look is calmest inside the opening', atGate < maxTurn,
    `${atGate.toFixed(2)} at the gate vs ${maxTurn.toFixed(2)} overall`);
  check('oblique departure lands exactly',
    Math.max(...final.position.map((v, i) => Math.abs(v - END.position[i]))) === 0);
}

/* -- 4. the handoff fires once, at the threshold --------------------------- */
{
  const controller = new CrossingController();
  let crossings = 0;
  let poseAtCross = null;
  let pose = START;
  controller.onGain(START);
  controller.playCrossing(END, {
    ...SHAPE,
    onCrossPlane: () => { crossings += 1; poseAtCross = pose; }
  });
  let guard = 0;
  while (controller.isCrossing && guard < 6000) {
    controller.update(1 / 60, (p) => { pose = { position: [...p.position], target: [...p.target], fov: p.fov }; }, pose);
    guard += 1;
  }
  check('room handoff fires exactly once', crossings === 1, `${crossings} times`);
  const atWall = Math.abs(poseAtCross.position[0] - GATE[0]);
  check('handoff happens at the threshold', atWall < 0.12, `${atWall.toFixed(3)} m from the wall plane`);
}

/* -- 5. reduced motion is shorter, not a teleport -------------------------- */
{
  const normal = fly(new CrossingController(), END, SHAPE, { startPose: START });
  const reduced = new CrossingController();
  reduced.setReducedMotion(true);
  const calm = fly(reduced, END, SHAPE, { startPose: START });

  const pathLength = (samples) => samples.reduce((sum, s, i) =>
    i === 0 ? 0 : sum + Math.hypot(
      s.position[0] - samples[i - 1].position[0],
      s.position[2] - samples[i - 1].position[2]), 0);

  const full = pathLength(normal.samples);
  const short = pathLength(calm.samples);
  check('reduced motion is shorter in time',
    calm.plan.durationMs < normal.plan.durationMs,
    `${calm.plan.durationMs} ms vs ${normal.plan.durationMs} ms`);
  check('reduced motion travels the same ground', Math.abs(full - short) < 0.05,
    `${short.toFixed(2)} m vs ${full.toFixed(2)} m`);
  check('reduced motion is not a cut', calm.samples.length > 20,
    `${calm.samples.length} frames`);
  const dp = Math.max(...calm.final.position.map((v, i) => Math.abs(v - END.position[i])));
  check('reduced motion lands on the same pose', dp === 0, `worst axis ${dp}`);
  check('reduced motion drops the fov breath',
    Math.max(...calm.samples.map((s) => s.fov)) === 50);
}

/* -- 6. degenerate geometry falls back rather than flying through a wall ---- */
{
  // Departure already past the threshold: the solved control point would be wild.
  const controller = new CrossingController();
  const { final, plan } = fly(controller, END, { ...SHAPE }, {
    startPose: { position: [7.98, 1.62, -10], target: [9, 1.55, -10], fov: 50 }
  });
  check('near-threshold departure still lands exactly',
    Math.max(...final.position.map((v, i) => Math.abs(v - END.position[i]))) === 0,
    `s=${plan.s.toFixed(3)}, via=${plan.via ? 'solved' : 'dropped'}`);
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} properties hold`);
process.exit(failed.length ? 1 : 0);
