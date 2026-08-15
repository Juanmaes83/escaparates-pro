/**
 * Record the Museum crossing the way a visitor actually receives it, and lay its
 * frames out to be looked at.
 *
 * THE INSTRUMENT ERROR THIS FILE EXISTS TO NOT REPEAT
 * ---------------------------------------------------
 * The previous version drove the doorway with
 *
 *     runtime.traversePortal('portal.lobby-gallery-a', { source: 'QA' })
 *
 * and reported a naked hard cut. That reading was worthless. `traversePortal`
 * only flies a crossing when the *caller* supplies a `crossing` intent
 * (runtime.js), and the sole producer of that intent in the whole engine is the
 * Director, at the moment a guided beat whose shotIntent is PORTAL comes up
 * (experience-director.js). A bare `traversePortal` is, by design, the cut path.
 * So the harness was photographing a code path the product never takes and
 * calling the result a product defect.
 *
 * The crossing therefore has exactly one honest trigger: PLAY the route and let
 * it reach `step.02-paso-galeria-a`. Not a seek either — `_crossingIntent`
 * returns null while `_seeking` is true, on purpose, because reconstruction is
 * not watching.
 *
 * WHAT IT PRODUCES
 *   crossing-<PACE>.webm        the recording, every frame
 *   crossing-state-<PACE>.json  per-frame state, sampled in-page on rAF
 *   mframe-<ms>.png             frames decoded out of that recording
 *   museum-sheet-NN.png         contact sheets, so beats are chosen by looking
 *
 * The last two are made with the same instrument used on the canonical source
 * video, which is the only way the two storyboards can be compared honestly.
 *
 *   IW_PACE=NATURAL node qa/tools/crossing-storyboard.mjs
 */
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MODULE_ROOT = path.resolve(HERE, '..', '..');
const REPO_ROOT = path.resolve(MODULE_ROOT, '../..');
const OUT = path.join(MODULE_ROOT, 'qa', 'evidence-vs02', 'crossing');
const PORT = Number(process.env.IW_CROSS_PORT || 5110);
const PACE = process.env.IW_PACE || 'NATURAL';
const REDUCED = process.env.IW_REDUCED === '1';
const PORTAL_STEP = process.env.IW_STEP || 'step.02-paso-galeria-a';
const FFMPEG = process.env.IW_FFMPEG
  || '/usr/local/lib/python3.11/dist-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2';
// Two passes, never mixed. Without IW_SCRUB the crossing plays at its authored
// tempo and is recorded — that is the tempo evidence. With it, the move is put
// under the instrument's control and photographed beat by beat — that is the
// choreography evidence.
const SCRUB = process.env.IW_SCRUB === '1';
const TAG = `${REDUCED ? `${PACE}-REDUCED` : PACE}${SCRUB ? '-SCRUB' : ''}`;
const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.webm': 'video/webm', '.mp4': 'video/mp4'
};

await fs.mkdir(OUT, { recursive: true });

const server = http.createServer(async (req, res) => {
  try {
    let f = path.resolve(REPO_ROOT, decodeURIComponent((req.url || '/').split('?')[0]).replace(/^\/+/, '') || 'index.html');
    if (!f.startsWith(REPO_ROOT)) return res.writeHead(403).end();
    if (fsSync.existsSync(f) && fsSync.statSync(f).isDirectory()) f = path.join(f, 'index.html');
    const stat = fsSync.statSync(f);
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(f)] || 'application/octet-stream',
      'Content-Length': stat.size, 'Cache-Control': 'no-store'
    });
    res.end(await fs.readFile(f));
  } catch { res.writeHead(404).end(); }
});
await new Promise((r) => server.listen(PORT, '127.0.0.1', r));

const browser = await chromium.launch({
  headless: true,
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox']
});
// The slow-motion pass is for stills. Recording it would produce a video of a
// tempo the product does not have, which is exactly the sort of artefact that
// later gets mistaken for evidence.
const page = await browser.newPage({
  viewport: { width: 1280, height: 720 },
  ...(SCRUB ? {} : { recordVideo: { dir: OUT, size: { width: 1280, height: 720 } } }),
  ...(REDUCED ? { reducedMotion: 'reduce' } : {})
});
page.setDefaultTimeout(300000);
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto(`http://127.0.0.1:${PORT}/labs/immersive-worlds/index.html?tier=HIGH`, { waitUntil: 'load' });
await page.waitForFunction(() => window.__IW?.ready === true, { timeout: 300000 });

/**
 * Enter the way a visitor enters.
 *
 * Twice this harness recorded the loading screen instead of the Museum: first
 * because hiding the veil is not the same as passing through it, then because a
 * synthetic `.click()` fired before `showEnter()` had attached its listener —
 * the button existed, so the call succeeded, and nothing happened. A real
 * Playwright click waits for the control to be visible and enabled, which is
 * both the visitor's path and the only version that cannot silently no-op.
 */
await page.locator('[data-el="enter"]').click({ timeout: 120000 });
await page.waitForFunction(() => {
  const veil = window.__IW?.hud?.el?.veil;
  return veil && (veil.hidden || veil.classList.contains('is-gone'));
}, { timeout: 60000 });
// The visitor's own chrome is not the subject of this board; the room is.
await page.evaluate(() => { document.getElementById('iw-ui').style.opacity = '0'; });
await page.waitForTimeout(2000);

/** A recording of a black canvas is not evidence of a crossing. */
const painting = await page.evaluate(() => {
  const canvas = document.getElementById('iw-canvas');
  return { hasCanvas: Boolean(canvas), w: canvas?.width || 0, h: canvas?.height || 0 };
});
if (!painting.hasCanvas || painting.w < 100) {
  throw new Error(`el lienzo no está listo: ${JSON.stringify(painting)}`);
}
console.log(`sala en pantalla: ${painting.w}×${painting.h}`);

/**
 * Sample in-page, on the frame loop.
 *
 * Round-tripping `page.evaluate` every 40 ms samples the harness's latency, not
 * the crossing: a three-second move read at whatever interval the CDP round trip
 * allows is how the first sample of the previous run already landed in the
 * destination. A rAF hook sees every frame the visitor sees, costs one read at
 * the end, and cannot perturb the move it is measuring.
 */
await page.evaluate(({ pace, portalStep }) => {
  const map = { BRISK: 0.75, NATURAL: 1, CALM: 1.35 };
  const rt = window.__IW.runtime;
  rt.experience.pacing = map[pace] || 1;

  const marks = [];
  rt.bus.on('portal:entered', (e) => marks.push({
    t: performance.now(), phase: e.phase || 'CROSSED', crossing: Boolean(e.crossing), spaceId: e.spaceId
  }));
  rt.bus.on('portal:requested', (e) => marks.push({ t: performance.now(), phase: 'REQUESTED', portalId: e.portalId }));

  const SB = { samples: [], marks, t0: performance.now(), portalStep, stopped: false };
  window.__SB = SB;

  const read = () => {
    const cam = rt.renderHost?.camera || window.__IW.renderHost?.camera;
    const kit = rt.sceneKit;
    const surface = kit._portalSurface || null;
    const th = surface?.threshold || null;
    const gate = th?.gate || th?.centre || null;
    const pose = rt.camera.pose;

    // Is the camera looking towards the opening, or back at it? This is the beat
    // condition the reverse-facing exit turns on, and it is a fact about the
    // pose, not about anything the harness decides.
    let facing = null;
    if (gate) {
      const look = [pose.target[0] - pose.position[0], pose.target[2] - pose.position[2]];
      const toGate = [gate[0] - pose.position[0], gate[2] - pose.position[2]];
      const ln = Math.hypot(...look) || 1;
      const gn = Math.hypot(...toGate) || 1;
      facing = +(((look[0] / ln) * (toGate[0] / gn)) + ((look[1] / ln) * (toGate[1] / gn))).toFixed(3);
    }

    return {
      ms: Math.round(performance.now() - SB.t0),
      space: rt.state.activeSpaceId,
      step: rt.experience.currentStep?.id || null,
      owner: rt.camera.owner,
      crossing: rt.crossing.isCrossing,
      e: +(rt.crossing._elapsed / Math.max(rt.crossing._duration, 1)).toFixed(4),
      effect: surface ? +Number(surface.effectIntensity ?? 0).toFixed(3) : null,
      surface: surface ? Boolean(surface.visible) : false,
      facing,
      distance: gate ? +Math.hypot(pose.position[0] - gate[0], pose.position[2] - gate[2]).toFixed(3) : null,
      pos: pose.position.map((n) => +n.toFixed(3)),
      tgt: pose.target.map((n) => +n.toFixed(3)),
      fov: +Number(pose.fov).toFixed(2)
    };
  };

  const tick = () => {
    if (SB.stopped) return;
    try { SB.samples.push(read()); } catch (err) { SB.error = String(err?.message || err); }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}, { pace: PACE, portalStep: PORTAL_STEP });

/**
 * Play the route. This — and only this — is what makes the doorway a crossing.
 */
await page.evaluate(() => {
  const rt = window.__IW.runtime;
  rt.startRoute(rt.defaultRouteId);
});

// Waiting on the *state* rather than on a clock is what lets the pace vary
// without the harness needing to be retuned.
//
// The budget has to suit the furthest portal beat on the route, not the nearest.
// The first crossing is beat 02 and arrives in about six seconds; the second is
// beat 08, roughly ten authored beats of six to nine seconds each, and a 90 s
// budget sized on the first one timed out before the route ever got there. That
// is what kept the Cámara Oscura crossing out of the acceptance board.
await page.waitForFunction((step) => {
  const rt = window.__IW.runtime;
  return rt.experience.currentStep?.id === step;
}, PORTAL_STEP, { timeout: 600000 });
console.log(`beat de portal en escena: ${PORTAL_STEP}`);

const flew = await page.waitForFunction(
  () => window.__IW.runtime.crossing.isCrossing === true, null, { timeout: 20000 }
).then(() => true).catch(() => false);
console.log(flew ? 'travesía en vuelo (TRANSITION posee la cámara)' : 'NO se planificó travesía alguna');

/**
 * SCRUB the crossing rather than chase it.
 *
 * Two instrument failures led here, and both are worth stating because both
 * produced confident, wrong readings.
 *
 * First: this environment draws the Museum at roughly two frames per second, and
 * about six times slower again once the plane is passed (the portal surface
 * renders the destination a second time, and both rooms are live). An authored
 * 5000 ms crossing is therefore drawn about ten times end to end. Asking that for
 * twelve stills returned six frames stamped k=1.
 *
 * Second, and worse: reading the state and then taking the screenshot are not the
 * same moment. A screenshot costs seconds here, so the move ran on underneath it
 * — beat 08 was captioned "facing +1, looking back at the threshold" over a
 * picture of the far wall of Gallery A, taken after the recoil had already
 * released. A board whose captions and pixels come from different instants is
 * the exact failure this board was built to make impossible.
 *
 * So the move is put under the instrument's control instead. `_duration` is set
 * enormous, which makes each rendered frame advance progress by about five parts
 * in a million — the crossing is effectively still — and progress is then set
 * directly, frame by frame, by writing `_elapsed`. Every capture is a genuine
 * frozen instant: the state read before the screenshot and the state read after
 * it are the same numbers, and that equality is asserted rather than assumed.
 *
 * This changes tempo and nothing else. The path, the gate, the split `s`, the
 * aperture window and the recoil are all solved inside `playCrossing` before a
 * duration is ever consulted, and the endpoint is the authored pose either way.
 * It is the same thing `source-frames.mjs` does to the reference video by seeking
 * it, applied to the Museum with the same discipline — and it is emphatically NOT
 * how a visitor receives the crossing. The real-time recording is the tempo
 * evidence; this is the choreography evidence. They never share an artefact.
 */
const SCRUB_DURATION = 100000;   // seconds
// Read before the tempo is touched, so the board can quote the duration the
// visitor actually gets rather than the one the instrument imposed.
const plan0 = flew ? await page.evaluate(() => window.__IW.runtime.crossing.lastPlan || null) : null;
if (flew) {
  await page.evaluate((d) => {
    const c = window.__IW.runtime.crossing;
    c._duration = d;
    c._elapsed = 0;
  }, SCRUB_DURATION);
  console.log('travesía bajo control del instrumento (scrub) — la coreografía es idéntica, sólo el tempo cambia');
}

/** Put the move at exactly `k`, let it draw, and read it there. */
const seek = async (k) => {
  await page.evaluate((target) => {
    const c = window.__IW.runtime.crossing;
    c._elapsed = target * c._duration;
  }, k);
  await page.evaluate(() => new Promise((resolve) => {
    let n = 2;
    const tick = () => (n-- <= 0 ? resolve(true) : requestAnimationFrame(tick));
    requestAnimationFrame(tick);
  }));
  return page.evaluate(READ);
};

/** The live values the beat conditions are written against. */
const READ = () => {
  const rt = window.__IW.runtime;
  const c = rt.crossing;
  const plan = c._plan;
  const pose = rt.camera.pose;
  const gate = plan?.gate || null;
  let facing = null; let alongAxis = null;
  if (gate && plan?.axis) {
    const look = [pose.target[0] - pose.position[0], pose.target[2] - pose.position[2]];
    const toGate = [gate[0] - pose.position[0], gate[2] - pose.position[2]];
    const ln = Math.hypot(...look) || 1; const gn = Math.hypot(...toGate) || 1;
    facing = +(((look[0] / ln) * (toGate[0] / gn)) + ((look[1] / ln) * (toGate[1] / gn))).toFixed(3);
    alongAxis = +(((pose.position[0] - gate[0]) * plan.axis[0]) + ((pose.position[2] - gate[2]) * plan.axis[2])).toFixed(3);
  }
  return {
    k: c.isCrossing ? +(c._elapsed / Math.max(c._duration, 1e-6)).toFixed(4) : 1,
    crossing: c.isCrossing,
    settled: !c.isCrossing,
    space: rt.state.activeSpaceId,
    owner: rt.camera.owner,
    step: rt.experience.currentStep?.id || null,
    facing,
    alongAxis,
    effect: rt.sceneKit._portalSurface ? +Number(rt.sceneKit._portalSurface.effectIntensity ?? 0).toFixed(3) : null,
    surface: Boolean(rt.sceneKit._portalSurface?.visible),
    pos: pose.position.map((n) => +n.toFixed(3)),
    tgt: pose.target.map((n) => +n.toFixed(3))
  };
};

const captured = [];

/**
 * Photograph the move where it currently stands, and prove it did not move.
 *
 * The state is read again after the shutter. If the two readings differ the
 * capture is marked `drifted`, because a caption that describes a different
 * instant from its picture is worse than a missing beat.
 */
const shoot = async (id, label, state, note = null) => {
  const file = `museum-${TAG}-${id}.png`;
  await page.screenshot({ path: path.join(OUT, file) });
  const after = await page.evaluate(READ);
  // Scrubbing pins progress but does not stop time: the engine still adds its
  // own `dt` each frame, which over a screenshot amounts to a few parts in a
  // hundred thousand of the move. Demanding exact equality flagged all twelve
  // beats as drifted, which is a false alarm — and a detector that always fires
  // is another instrument that cannot fail. The tolerance is set well below any
  // difference a viewer could see and well above the residue.
  const dk = Math.abs((after.k ?? 0) - (state.k ?? 0));
  const df = Math.abs((after.facing ?? 0) - (state.facing ?? 0));
  const drifted = dk > 0.002 || df > 0.05;
  captured.push({ id, label, file, state, after: { k: after.k, facing: after.facing }, note, drifted });
  console.log(`  beat ${id} · k=${state.k} · eje=${state.alongAxis} · facing=${state.facing}${drifted ? ` · ¡DERIVA! Δk=${dk.toFixed(4)} Δfacing=${df.toFixed(3)}` : ''} · ${label}`);
  return !drifted;
};

/** Walk forward until a condition holds, or report that it never did. */
const advanceUntil = async (from, test, { step = 0.02, limit = 1 } = {}) => {
  for (let k = from; k <= limit + 1e-9; k += step) {
    const s = await seek(Math.min(k, limit));
    if (test(s)) return { hit: true, k: Math.min(k, limit), state: s };
  }
  return { hit: false, k: limit, state: await seek(limit) };
};

/**
 * The twelve beats, in the SOURCE's order and by the SOURCE's cinematic
 * function — this board exists to be laid beside that one, so the Museum is
 * asked to answer the source's questions rather than its own.
 *
 * Beats 07 and 08 are conditions on the actual move and not proxies for it: 07
 * is where the camera's position crosses the threshold plane, 08 is the first
 * point past it at which the camera is genuinely facing back at the opening.
 * Neither can be satisfied by a move that does not perform them, which is the
 * point — an absent beat has to come out absent. Beats 09–11 are then spaced
 * across whatever exit leg actually exists, so a short exit reports as a short
 * exit instead of being padded out to look like the source's.
 */
await seek(0.02);
await shoot('01', 'Mundo A, umbral en su contexto', await seek(0.02));
await shoot('02', 'Adquisición: el umbral es el sujeto', await seek(0.10));
await shoot('03', 'Aproximación A', await seek(0.25));
await shoot('04', 'Aproximación B — compromiso', await seek(0.40));
await shoot('05', 'Aproximación C — toma del encuadre', await seek(0.55));
await shoot('06', 'Umbral a pantalla completa', await seek(0.68));

const plane = await advanceUntil(0.70, (s) => s.alongAxis !== null && s.alongAxis >= 0, { step: 0.01 });
if (plane.hit) await shoot('07', 'Cruce de la membrana — el cambio de mundo, oculto', plane.state);
else console.log('  beat 07 AUSENTE: la cámara nunca cruza el plano del umbral');

const back = await advanceUntil(plane.k, (s) => s.alongAxis > 0 && s.facing > 0.5, { step: 0.01 });
if (back.hit) await shoot('08', 'Mundo B — el reverso del umbral, de frente', back.state);
else console.log('  beat 08 AUSENTE: la cámara nunca se vuelve hacia el umbral tras cruzarlo');

/**
 * How long is the look-back, actually?
 *
 * The source spends beats 09–11 on the reverse of the threshold shrinking while
 * the destination reveals around it, so the honest question is not "does the
 * Museum turn round" — it does — but "for how much of the move". Scanning the
 * exit for the span where the camera is genuinely facing the opening turns that
 * into a number, and a number is what can be compared with the source.
 */
let lookBack = null;
if (back.hit) {
  let last = back.k;
  for (let k = back.k; k <= 1 + 1e-9; k += 0.01) {
    const s = await seek(Math.min(k, 1));
    if (s.facing !== null && s.facing > 0.5) last = Math.min(k, 1);
    else break;
  }
  const authoredMs = plan0?.durationMs ?? 5000;
  lookBack = {
    from: +back.k.toFixed(3), to: +last.toFixed(3),
    fractionOfMove: +(last - back.k).toFixed(3),
    approxMsAtAuthoredTempo: Math.round((last - back.k) * authoredMs)
  };
  console.log(`  mirada atrás: k ${lookBack.from} → ${lookBack.to} · ${(lookBack.fractionOfMove * 100).toFixed(1)}% del recorrido · ~${lookBack.approxMsAtAuthoredTempo} ms al tempo autorizado`);
}

// The recoil beats are spaced across what remains AFTER the look-back is
// established, not from the plane — anchoring them at the plane put beat 09
// (k=0.825) in front of beat 08 (k=0.83), so the board showed the camera turning
// back and then un-turning. Beats must run forwards.
const kp = back.hit ? back.k : (plane.hit ? plane.k : 0.8);
await shoot('09', 'Retroceso: el umbral todavía domina', await seek(kp + 0.25 * (1 - kp)));
await shoot('10', 'Retroceso medio: el destino empieza a aparecer', await seek(kp + 0.55 * (1 - kp)));
await shoot('11', 'Fin del retroceso: el entorno ya está establecido', await seek(kp + 0.85 * (1 - kp)));

// Beat 12 is the only one that must be taken at the authored tempo: it is the
// resting frame, and the contract is that the crossing leaves the camera exactly
// on the beat's approved pose. Hand the move back and let it land.
await page.evaluate(() => {
  const c = window.__IW.runtime.crossing;
  c._duration = 0.35;
  c._elapsed = 0.34;
});
await page.waitForFunction(() => window.__IW.runtime.crossing.isCrossing === false, null, { timeout: 120000 });
await page.waitForTimeout(2500);
await shoot('12', 'Asentamiento', await page.evaluate(READ), 'tempo real; la travesía ha aterrizado');

const sb = await page.evaluate(() => {
  window.__SB.stopped = true;
  const { samples, marks, error } = window.__SB;
  return { samples, marks: marks.map((m) => ({ ...m, ms: Math.round(m.t - window.__SB.t0) })), error };
});

const spaces = [...new Set(sb.samples.map((s) => s.space))];
const owners = [...new Set(sb.samples.map((s) => s.owner))];
const crossSamples = sb.samples.filter((s) => s.crossing);
console.log(`${sb.samples.length} muestras · espacios: ${spaces.join(' → ')} · cámara: ${owners.join(' → ')}`);
console.log(`muestras durante la travesía: ${crossSamples.length}`);
if (crossSamples.length) {
  const eff = crossSamples.map((s) => s.effect).filter((n) => n !== null);
  const fac = crossSamples.map((s) => s.facing).filter((n) => n !== null);
  console.log(`  superficie visible en ${crossSamples.filter((s) => s.surface).length} muestras`);
  if (eff.length) console.log(`  effectIntensity: ${Math.max(...eff)} → ${Math.min(...eff)}`);
  if (fac.length) console.log(`  facing: máx ${Math.max(...fac)} · mín ${Math.min(...fac)}`);
}

const plan = await page.evaluate(() => window.__IW.runtime.crossing.lastPlan || null);

await fs.writeFile(path.join(OUT, `crossing-state-${TAG}.json`), JSON.stringify({
  generatedAt: new Date().toISOString(),
  pace: PACE, reducedMotion: REDUCED, portalStep: PORTAL_STEP,
  flew, plan, plan0, lookBackWindow: lookBack, scrubbed: SCRUB, spaces, owners, beats: captured,
  marks: sb.marks, samples: sb.samples, sampleError: sb.error || null, errors
}, null, 1));

const rawVideo = SCRUB ? null : await page.video().path();
await page.close();          // flushes the recording
await browser.close();
server.close();

if (!rawVideo) {
  console.log(`${captured.length} beats capturados · sin vídeo (pasada de cámara lenta)`);
  process.exit(0);
}
const video = path.join(OUT, `crossing-${TAG}.webm`);
await fs.rename(rawVideo, video);
console.log(`vídeo: ${path.relative(REPO_ROOT, video)}`);

/* == frames, decoded from the recording ==================================== */
if (!fsSync.existsSync(FFMPEG)) {
  console.log(`sin ffmpeg en ${FFMPEG} — sólo queda el vídeo`);
  process.exit(0);
}
for (const f of await fs.readdir(OUT)) {
  if (/^mframe-|^museum-sheet-/.test(f)) await fs.rm(path.join(OUT, f));
}
execFileSync(FFMPEG, [
  '-y', '-i', video, '-vf', 'fps=12', '-start_number', '0',
  path.join(OUT, 'mframe-%04d.png')
], { stdio: 'pipe' });
const frames = (await fs.readdir(OUT)).filter((f) => /^mframe-\d+\.png$/.test(f)).sort();
console.log(`${frames.length} fotogramas extraídos a 12 fps`);

/* Contact sheets — the same way the source video was read. */
const sheetBrowser = await chromium.launch({ headless: true, args: ['--disable-gpu-sandbox'] });
const sheetPage = await sheetBrowser.newPage({ viewport: { width: 1400, height: 900 } });
await sheetPage.setContent('<body style="margin:0"></body>');
const PER_SHEET = 24;
for (let s = 0; s * PER_SHEET < frames.length; s += 1) {
  const slice = frames.slice(s * PER_SHEET, (s + 1) * PER_SHEET);
  const items = await Promise.all(slice.map(async (name, i) => ({
    label: `${(((s * PER_SHEET) + i) / 12).toFixed(2)}s`,
    dataUrl: `data:image/png;base64,${(await fs.readFile(path.join(OUT, name))).toString('base64')}`
  })));
  const sheet = await sheetPage.evaluate(async ({ list, cols }) => {
    const W = 320;
    const load = (src) => new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.src = src; });
    const imgs = await Promise.all(list.map((i) => load(i.dataUrl)));
    const H = Math.round(W * (imgs[0].naturalHeight / imgs[0].naturalWidth));
    const rows = Math.ceil(imgs.length / cols);
    const c = document.createElement('canvas');
    c.width = cols * W; c.height = rows * (H + 22);
    const x = c.getContext('2d');
    x.fillStyle = '#0c0b0a'; x.fillRect(0, 0, c.width, c.height);
    imgs.forEach((img, i) => {
      const cx = (i % cols) * W; const cy = Math.floor(i / cols) * (H + 22);
      x.drawImage(img, cx, cy + 22, W, H);
      x.fillStyle = '#e8e2d6'; x.font = '13px monospace';
      x.fillText(list[i].label, cx + 6, cy + 15);
    });
    return c.toDataURL('image/png');
  }, { list: items, cols: 4 });
  const file = path.join(OUT, `museum-sheet-${String(s + 1).padStart(2, '0')}.png`);
  await fs.writeFile(file, Buffer.from(sheet.split(',')[1], 'base64'));
  console.log(`hoja de contactos: ${path.basename(file)} (${slice.length} fotogramas)`);
}
await sheetBrowser.close();
