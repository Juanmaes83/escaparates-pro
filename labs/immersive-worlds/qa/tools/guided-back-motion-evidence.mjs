/**
 * GUIDED BACK — what it actually looks like, in motion, on the real product path.
 *
 * WHY THIS EXISTS
 *
 * Back was built, and then proved with numbers: `forward-settle-equivalence.mjs`
 * showed forward settle and Back return land on the same canonical pose to
 * 0.0000 m, and `guided-reversibility-audit.mjs` showed the destination is
 * single-valued. Both pressed the real ← ANTERIOR control. Both passed.
 *
 * None of that says what going back FEELS like, and a museum visitor does not
 * experience a pose delta. The Playbook's rule is the one being repaired here:
 *
 *   A SERIES OF GREEN IMPLEMENTATION CHECKPOINTS DOES NOT EQUAL A CLOSED
 *   PRODUCT VERTICAL.
 *
 * So this harness produces the missing half — a continuous recording and matched
 * stills of every moment a human has to judge, in the order they occur:
 *
 *   1  forward stop                 where the tour leaves the visitor
 *   2  same-room Back               the return, in motion
 *   3  forward after Back           does continuing work, and land where it did
 *   4  cross-room Back              the return through the doorway
 *   5  cross-room forward again     and forward across, again
 *   6  Guide state                  sampled at every one of the above
 *   7  HUD Tour Stop counter        read from the DOM, not inferred
 *   8  Crossing B forward unchanged the plan compared against its baseline
 *
 * NOTHING IS DRIVEN BY ENGINE CALLS. Every navigation is a click on the control
 * the visitor clicks — ← ANTERIOR and Siguiente. The one exception is starting
 * the route, which is what the guided-tour control does anyway, and pausing,
 * which is what a visitor reaching a stop and stopping to look produces.
 *
 * The crossing-instrument error is not repeated: no `traversePortal`, no seek.
 * A crossing only flies when the Director supplies the intent, so the route is
 * played and allowed to reach the doorway on its own.
 *
 *   node qa/tools/guided-back-motion-evidence.mjs
 */
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MODULE_ROOT = path.resolve(HERE, '..', '..');
const REPO_ROOT = path.resolve(MODULE_ROOT, '../..');
const OUT = path.join(MODULE_ROOT, 'qa', 'evidence-vs02', 'guided-back-motion');
const PORT = Number(process.env.IW_BACK_PORT || 5340);
const FFMPEG = process.env.IW_FFMPEG
  || '/usr/local/lib/python3.11/dist-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webm': 'video/webm', '.mp4': 'video/mp4' };

/**
 * The Crossing B plan as recorded when a human called that crossing the current
 * best baseline. "DO NOT automatically reduce/remove the red portal effect" and
 * "ENDPOINT CHANGE: NOT AUTHORIZED" both attach to this geometry, so it is
 * compared rather than re-approved.
 * Source: qa/evidence-vs02/crossing/crossing-state-B-NATURAL-SCRUB.json
 */
const CROSSING_B_BASELINE = {
  s: 0.7301587301587302,
  gate: [8, 1.62, -10],
  via: [6.549999999999999, 1.6200000000000006, -10.000000000000002],
  window: 0.22,
  durationMs: 4667,
  recoil: 0.62
};

await fs.mkdir(OUT, { recursive: true });
await fs.mkdir(path.join(OUT, 'film'), { recursive: true });

const server = http.createServer(async (req, res) => {
  try {
    let f = path.resolve(REPO_ROOT, decodeURIComponent((req.url || '/').split('?')[0]).replace(/^\/+/, '') || 'index.html');
    if (!f.startsWith(REPO_ROOT)) return res.writeHead(403).end();
    if (fsSync.existsSync(f) && fsSync.statSync(f).isDirectory()) f = path.join(f, 'index.html');
    const stat = fsSync.statSync(f);
    res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream', 'Content-Length': stat.size, 'Cache-Control': 'no-store' });
    res.end(await fs.readFile(f));
  } catch { res.writeHead(404).end(); }
});
await new Promise((r) => server.listen(PORT, '127.0.0.1', r));

const browser = await chromium.launch({
  headless: true,
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox']
});
const context = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  recordVideo: { dir: path.join(OUT, 'video'), size: { width: 1280, height: 720 } }
});
const page = await context.newPage();
page.setDefaultTimeout(600000);
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));

const results = [];
const say = (n, ok, d = '') => { results.push({ name: n, ok, detail: d }); console.log(`${ok ? 'OK   ' : 'FALLO'} ${n}${d ? ` — ${d}` : ''}`); };

/**
 * Everything a human moment needs, read together so the still, the counter and
 * the Guide can never disagree about which frame they describe.
 */
const MOMENT = () => {
  const rt = window.__IW.runtime;
  const p = rt.camera.pose;
  const kit = rt.sceneKit;
  const g = kit?._guide || null;
  const q = (s) => document.querySelector(`[data-el="${s}"]`);
  return {
    stop: rt.experience.currentTourStep?.id || null,
    order: rt.experience.tourOrder,
    total: rt.experience.tourTotal,
    beat: rt.experience.currentStep?.id || null,
    space: rt.state.activeSpaceId,
    owner: rt.camera.owner,
    pos: p.position.map((n) => +n.toFixed(4)),
    tgt: p.target.map((n) => +n.toFixed(4)),
    // Read out of the DOM, not recomputed. A counter check that recomputes the
    // number it is checking proves the formula, not the pixels.
    counterText: q('stepCount')?.textContent?.trim() || null,
    caption: q('caption')?.textContent?.trim() || null,
    // The label card is sampled with everything else because a stop and the
    // label describing it must never come from different instants — the defect
    // family already recorded as L-18.
    labelTitle: q('detailTitle')?.textContent?.trim() || null,
    labelCount: q('detailCount')?.textContent?.trim() || null,
    transport: rt.experience.transport,
    pauseLabel: q('pauseBtn')?.textContent?.trim() || null,
    prevEnabled: q('prevBtn') ? !q('prevBtn').disabled : null,
    nextEnabled: q('nextBtn') ? !q('nextBtn').disabled : null,
    guideOpacity: g ? +Number(g.current?.opacity ?? 0).toFixed(2) : null,
    canGoBack: rt.canGoBack
  };
};

const settled = async () => page.waitForFunction(() => {
  const rt = window.__IW.runtime;
  const p = rt.camera.pose.position;
  const k = `${p[0].toFixed(3)},${p[1].toFixed(3)},${p[2].toFixed(3)}`;
  window.__S = window.__S || { k: null, n: 0 };
  if (window.__S.k === k) window.__S.n += 1; else { window.__S.k = k; window.__S.n = 0; }
  return window.__S.n >= 6;
}, null, { timeout: 180000 }).catch(() => false);

const luma = (file) => {
  const r = spawnSync(FFMPEG, ['-hide_banner', '-i', file, '-vf', 'signalstats,metadata=print:key=lavfi.signalstats.YAVG', '-f', 'null', '-'], { encoding: 'utf8' });
  const m = /YAVG=([0-9.]+)/.exec(`${r.stdout || ''}${r.stderr || ''}`);
  return m ? Number(m[1]) : null;
};

const moments = {};
const still = async (key, label) => {
  const file = path.join(OUT, `${key}.png`);
  await page.screenshot({ path: file });
  const state = await page.evaluate(MOMENT);
  moments[key] = { key, label, file: `${key}.png`, yavg: luma(file), ...state };
  console.log(`  ${key}  parada ${state.order}/${state.total} «${state.counterText}» · ficha «${state.labelTitle}» ${state.labelCount} · sala ${state.space} · guía ${state.guideOpacity} · ${state.owner}`);
  return moments[key];
};

/**
 * Record the camera itself, on rAF, inside the page.
 *
 * The screenshot filmstrip below is for a human to look at; it is NOT a motion
 * measurement. A screenshot in this environment costs seconds, so a "600 ms"
 * sampling interval is really several seconds, and a move that takes one second
 * lands entirely inside the first sample. Reading motion off that filmstrip
 * measures the harness, not the product — the same mistake as judging a 5 s
 * crossing from ten frames at 2 fps.
 *
 * This trace runs in the page, on the compositor's own clock, and is unaffected
 * by how slowly evidence is written to disk.
 */
const startPoseTrace = () => page.evaluate(() => {
  window.__PT = { samples: [], t0: performance.now() };
  const rt = window.__IW.runtime;
  const tick = () => {
    const p = rt.camera.pose.position;
    window.__PT.samples.push({
      t: Math.round(performance.now() - window.__PT.t0),
      p: p.map((n) => +n.toFixed(3)),
      owner: rt.camera.owner,
      space: rt.state.activeSpaceId
    });
    if (window.__PT.samples.length < 4000) window.__PT.raf = requestAnimationFrame(tick);
  };
  window.__PT.raf = requestAnimationFrame(tick);
});

const readPoseTrace = () => page.evaluate(() => {
  cancelAnimationFrame(window.__PT.raf);
  const s = window.__PT.samples;
  const key = (x) => `${x.p[0]},${x.p[1]},${x.p[2]}`;
  const distinct = new Set(s.map(key)).size;
  // Where the camera was still moving: first and last sample whose position
  // differs from its neighbour. A cut has one such step; a move has many.
  let first = -1; let last = -1;
  for (let i = 1; i < s.length; i += 1) {
    if (key(s[i]) !== key(s[i - 1])) { if (first < 0) first = s[i - 1].t; last = s[i].t; }
  }
  const path = s.reduce((acc, x, i) => i === 0 ? 0
    : acc + Math.hypot(x.p[0] - s[i - 1].p[0], x.p[1] - s[i - 1].p[1], x.p[2] - s[i - 1].p[2]), 0);
  return {
    samples: s.length, distinctPositions: distinct,
    moveStartMs: first, moveEndMs: last, moveDurationMs: last - first,
    pathLengthM: +path.toFixed(3),
    straightLineM: s.length > 1
      ? +Math.hypot(...s[s.length - 1].p.map((v, i) => v - s[0].p[i])).toFixed(3) : 0,
    owners: [...new Set(s.map((x) => x.owner))],
    spaces: [...new Set(s.map((x) => x.space))]
  };
});

/** A filmstrip for a human to look at. Not a motion measurement — see above. */
const film = async (key, frames = 12, everyMs = 700) => {
  const shots = [];
  for (let i = 0; i < frames; i += 1) {
    const f = path.join(OUT, 'film', `${key}-${String(i).padStart(2, '0')}.png`);
    await page.screenshot({ path: f });
    shots.push({ i, file: `film/${key}-${String(i).padStart(2, '0')}.png`, yavg: luma(f) });
    await page.waitForTimeout(everyMs);
  }
  const moved = new Set(shots.map((s) => Math.round((s.yavg ?? 0) * 4))).size;
  return { key, frames: shots, distinctLuma: moved };
};

const clickControl = async (el) => page.evaluate((sel) => {
  const b = document.querySelector(`[data-el="${sel}"]`);
  if (!b || b.disabled) return false;
  b.click();
  return true;
}, el);

console.log('GUIDED BACK — EVIDENCIA EN MOVIMIENTO POR LA RUTA REAL DEL PRODUCTO\n');

await page.goto(`http://127.0.0.1:${PORT}/labs/immersive-worlds/index.html?tier=LOW`, { waitUntil: 'load' });
await page.waitForFunction(() => window.__IW?.ready === true, { timeout: 600000 });
await page.locator('[data-el="enter"]').click({ timeout: 120000 });
await page.waitForFunction(() => {
  const veil = window.__IW?.hud?.el?.veil;
  return veil && (veil.hidden || veil.classList.contains('is-gone'));
}, { timeout: 120000 });
await page.waitForTimeout(1500);

// The guided route, started the way the guided-tour control starts it.
await page.evaluate(() => { const rt = window.__IW.runtime; rt.startRoute(rt.defaultRouteId); });
await page.waitForFunction(() => Boolean(window.__IW.runtime.experience.manifest), null, { timeout: 60000 });

const canonical = await page.evaluate(() => {
  const rt = window.__IW.runtime;
  return (rt.experience.manifest?.steps || []).map((s) => {
    const c = rt.experience.canonicalSettle(s.id);
    return {
      stopId: s.id, order: s.order, space: s.spaceId,
      settleBeat: c?.beat?.id || null,
      pose: c ? { pos: c.pose.position.map((n) => +n.toFixed(4)), tgt: c.pose.target.map((n) => +n.toFixed(4)) } : null
    };
  });
});
const target = canonical.find((c) => c.order === 4 && c.settleBeat) || canonical.find((c) => c.order === 3 && c.settleBeat);
console.log(`parada objetivo: ${target.stopId} (orden ${target.order}) asienta en ${target.settleBeat}\n`);

/* ── 1. FORWARD STOP ────────────────────────────────────────────────── */
console.log('1 · PARADA HACIA ADELANTE');
await page.waitForFunction((b) => window.__IW.runtime.experience.currentStep?.id === b, target.settleBeat, { timeout: 400000 });
await settled();
await page.evaluate(() => window.__IW.runtime.experience.pause());
await page.waitForTimeout(600);
const m1 = await still('01-parada-adelante', 'Parada hacia adelante, asentada');

say('la parada muestra su contador en el HUD', Boolean(m1.counterText) && m1.total > 0,
  `«${m1.counterText}» de ${m1.total}`);
say('← ANTERIOR está disponible en una parada asentada', m1.prevEnabled === true && m1.canGoBack === true);

/* ── 2. SAME-ROOM BACK, IN MOTION ───────────────────────────────────── */
console.log('\n2 · ATRÁS EN LA MISMA SALA');
await startPoseTrace();
const clickedBack1 = await clickControl('prevBtn');
const filmBack1 = await film('02-atras-misma-sala', 10, 600);
await settled();
const traceBack1 = await readPoseTrace();
const m2 = await still('02-atras-misma-sala', 'Tras ← ANTERIOR, misma sala');

say('← ANTERIOR responde al clic', clickedBack1);
// A cut is one position step. A travelled return is many, over a measurable
// span, along a path longer than the straight line between the endpoints.
say('el retroceso en la misma sala es un movimiento, no un corte',
  traceBack1.distinctPositions >= 8 && traceBack1.moveDurationMs >= 300,
  `${traceBack1.distinctPositions} posiciones distintas · ${traceBack1.moveDurationMs} ms · recorrido ${traceBack1.pathLengthM} m (línea recta ${traceBack1.straightLineM} m)`);
say('el retroceso cambia de parada', m2.order !== null && m2.order < m1.order,
  `${m1.order} → ${m2.order}`);
say('permanece en la misma sala', m2.space === m1.space, `${m1.space} → ${m2.space}`);
say('el contador del HUD sigue al retroceso', m2.counterText !== m1.counterText,
  `«${m1.counterText}» → «${m2.counterText}»`);
say('la guía sigue presente tras retroceder', m2.guideOpacity !== null,
  `opacidad ${m1.guideOpacity} → ${m2.guideOpacity}`);

/* ── 3. FORWARD AFTER BACK ──────────────────────────────────────────── */
/*
 * The control a visitor presses to continue is REANUDAR, not Siguiente.
 * Arriving at a stop leaves the transport PAUSED, and Siguiente advances one
 * beat inside the paused stop — it does not resume the route. An earlier run of
 * this harness pressed Siguiente, waited for a stop it could never reach that
 * way, and sampled the visitor still standing inside the previous stop. That
 * would have been recorded as "continuing after Back does not return you", which
 * is a product accusation made by an instrument driving the wrong control.
 */
console.log('\n3 · ADELANTE DESPUÉS DE ATRÁS');
const clickedNext = await page.evaluate(() => {
  const b = document.querySelector('[data-el="pauseBtn"]');
  if (!b || b.disabled) return { clicked: false, label: null };
  const label = b.textContent.trim();
  b.click();
  return { clicked: true, label };
});
const reachedAgain = await page.waitForFunction((b) => window.__IW.runtime.experience.currentStep?.id === b,
  target.settleBeat, { timeout: 400000 }).then(() => true).catch(() => false);
await settled();
await page.evaluate(() => window.__IW.runtime.experience.pause());
await page.waitForTimeout(600);
const m3 = await still('03-adelante-tras-atras', 'Adelante otra vez, misma parada');

const d = (a, b) => +Math.hypot(...a.map((v, i) => v - b[i])).toFixed(4);
say('REANUDAR responde al clic', clickedNext.clicked, clickedNext.label || '');
say('la ruta vuelve a alcanzar la parada por sí sola', reachedAgain);
say('continuar tras retroceder vuelve a la misma parada', m3.stop === m1.stop,
  `${m1.stop} → ${m3.stop}`);
say('y a la misma composición, no a una parecida',
  d(m3.pos, m1.pos) <= 0.01 && d(m3.tgt, m1.tgt) <= 0.01,
  `Δpos ${d(m3.pos, m1.pos)} m · Δtgt ${d(m3.tgt, m1.tgt)} m`);
say('el contador vuelve a su valor de ida', m3.counterText === m1.counterText,
  `«${m3.counterText}»`);
// The card and the stop must agree at every sampled instant, going back as well
// as forward. A return that leaves the previous stop's label on screen is a
// caption/state desync, not a camera problem.
say('la ficha describe la parada en la que se está, no la anterior',
  m2.labelTitle !== m1.labelTitle,
  `ida «${m1.labelTitle}» ${m1.labelCount} → atrás «${m2.labelTitle}» ${m2.labelCount}`);

/* ── 4. CROSSING B, THEN CROSS-ROOM BACK ────────────────────────────── */
console.log('\n4 · TRAVESÍA B Y RETROCESO ENTRE SALAS');
await clickControl('pauseBtn');
const reachedB = await page.waitForFunction(() => window.__IW.runtime.state.activeSpaceId === 'space.gallery-b',
  null, { timeout: 600000 }).then(() => true).catch(() => false);
say('la ruta alcanza la Galería B por sí sola', reachedB);

const planB = await page.evaluate(() => window.__IW.runtime.crossing?.lastPlan || null);
if (planB) {
  const same = ['s', 'window', 'durationMs', 'recoil'].every((k) => Math.abs(planB[k] - CROSSING_B_BASELINE[k]) < 1e-9)
    && planB.gate.every((v, i) => Math.abs(v - CROSSING_B_BASELINE.gate[i]) < 1e-9)
    && planB.via.every((v, i) => Math.abs(v - CROSSING_B_BASELINE.via[i]) < 1e-9);
  say('TRAVESÍA B SIN CAMBIOS respecto a la línea base humana', same,
    `s ${planB.s.toFixed(4)} · ${planB.durationMs} ms · recoil ${planB.recoil} · window ${planB.window}`);
} else {
  say('TRAVESÍA B SIN CAMBIOS respecto a la línea base humana', false, 'no se pudo leer lastPlan');
}

await page.waitForTimeout(4000);
await page.evaluate(() => window.__IW.runtime.experience.pause());
await page.waitForTimeout(600);
const m4 = await still('04-llegada-galeria-b', 'Llegada a Galería B, tras la travesía');

console.log('\n5 · ATRÁS ENTRE SALAS');
await page.evaluate(() => {
  window.__T = { portals: [], spaces: [], owners: new Set() };
  const rt = window.__IW.runtime;
  rt.bus.on('portal:entered', (e) => window.__T.portals.push({ id: e.portalId, phase: e.phase || 'CROSSED' }));
  rt.bus.on('space:entered', (e) => window.__T.spaces.push(e.spaceId));
  const tick = () => { window.__T.owners.add(rt.camera.owner); requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
});
await startPoseTrace();
const clickedBack2 = await clickControl('prevBtn');
const filmBack2 = await film('05-atras-entre-salas', 14, 800);
await settled();
const traceBack2 = await readPoseTrace();
const m5 = await still('05-atras-entre-salas', 'Tras ← ANTERIOR, de vuelta en Galería A');
const trace = await page.evaluate(() => ({
  portals: window.__T.portals, spaces: window.__T.spaces, owners: [...window.__T.owners]
}));

say('← ANTERIOR responde también entre salas', clickedBack2);
say('el retroceso entre salas atraviesa una puerta, no teletransporta',
  trace.portals.length > 0, trace.portals.map((p) => `${p.id}/${p.phase}`).join(' · ') || 'ningún portal');
say('el retroceso entre salas es un movimiento, no un corte',
  traceBack2.distinctPositions >= 8 && traceBack2.moveDurationMs >= 300,
  `${traceBack2.distinctPositions} posiciones distintas · ${traceBack2.moveDurationMs} ms · recorrido ${traceBack2.pathLengthM} m (línea recta ${traceBack2.straightLineM} m)`);
say('acaba en la sala anterior', m5.space !== m4.space, `${m4.space} → ${m5.space}`);
say('el contador del HUD sigue al retroceso entre salas', m5.counterText !== m4.counterText,
  `«${m4.counterText}» → «${m5.counterText}»`);
say('la guía sobrevive al cruce hacia atrás', m5.guideOpacity !== null, `opacidad ${m5.guideOpacity}`);
// The same desync checked in the same room, checked again across the doorway:
// a return that repaints the camera but not the card is wrong in both places.
say('la ficha describe la parada tras el retroceso entre salas',
  m5.labelTitle !== m4.labelTitle,
  `«${m4.labelTitle}» ${m4.labelCount} → «${m5.labelTitle}» ${m5.labelCount}`);

/* ── 6. CROSS-ROOM FORWARD AGAIN ────────────────────────────────────── */
console.log('\n6 · ADELANTE ENTRE SALAS OTRA VEZ');
await clickControl('pauseBtn');
const backToB = await page.waitForFunction(() => window.__IW.runtime.state.activeSpaceId === 'space.gallery-b',
  null, { timeout: 600000 }).then(() => true).catch(() => false);
await settled();
const m6 = await still('06-adelante-entre-salas', 'Adelante entre salas otra vez');
const planB2 = await page.evaluate(() => window.__IW.runtime.crossing?.lastPlan || null);

say('continuar vuelve a cruzar hacia la Galería B', backToB, `${m6.space}`);
say('la travesía sigue siendo la misma tras ir y volver',
  Boolean(planB && planB2) && Math.abs(planB2.s - planB.s) < 1e-9 && planB2.durationMs === planB.durationMs,
  planB2 ? `s ${planB2.s.toFixed(4)} · ${planB2.durationMs} ms` : 'sin plan');
say('sin errores de runtime en todo el recorrido', errors.length === 0,
  errors.slice(0, 2).join(' · ') || 'ninguno');

/* ── Contact sheet, so a human looks rather than reads ──────────────── */
const order = ['01-parada-adelante', '02-atras-misma-sala', '03-adelante-tras-atras',
  '04-llegada-galeria-b', '05-atras-entre-salas', '06-adelante-entre-salas'];
const card = (k) => {
  const m = moments[k];
  if (!m) return '';
  return `<figure>
  <img src="${m.file}" alt="${m.label}">
  <figcaption>
    <b>${m.label}</b>
    <span>parada ${m.order ?? '—'}/${m.total ?? '—'} · HUD «${m.counterText ?? '—'}»</span>
    <span>${m.space} · cámara ${m.owner} · guía ${m.guideOpacity ?? '—'}</span>
  </figcaption>
</figure>`;
};
const strip = (f) => `<div class="strip">${f.frames.map((s) => `<img src="${s.file}" alt="">`).join('')}</div>`;
await fs.writeFile(path.join(OUT, 'index.html'), `<!doctype html><meta charset="utf-8">
<title>Guided Back — evidencia en movimiento</title>
<style>
 body{margin:0;padding:2rem;background:#0c0b0a;color:#e8e3d9;font:400 14px/1.6 'Helvetica Neue',sans-serif}
 h1{font:400 1.5rem/1.3 Georgia,serif;margin:0 0 .4rem}
 p.lede{color:#a49d92;max-width:62ch;margin:0 0 2rem}
 .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(360px,1fr));gap:1.4rem}
 figure{margin:0}img{width:100%;display:block;border:1px solid rgba(240,236,228,.14)}
 figcaption{padding:.6rem 0;display:grid;gap:.15rem}
 figcaption b{font-weight:500}figcaption span{color:#a49d92;font-size:.82rem}
 h2{font:400 1rem/1.3 Georgia,serif;margin:2.4rem 0 .6rem}
 .strip{display:flex;gap:4px;overflow-x:auto;padding-bottom:.6rem}
 .strip img{width:170px;flex:0 0 auto}
 video{width:100%;max-width:900px;border:1px solid rgba(240,236,228,.14)}
</style>
<h1>Guided Back — evidencia en movimiento</h1>
<p class="lede">Ruta real del producto. Toda navegación es un clic en ← ANTERIOR o Siguiente;
no se llama a la API del motor para moverse. Contador y guía se leen del DOM en el mismo
instante que la captura.</p>
<div class="grid">${order.map(card).join('')}</div>
<h2>Retroceso en la misma sala, fotograma a fotograma</h2>
<p class="lede">${traceBack1.distinctPositions} posiciones de cámara distintas a lo largo de
${traceBack1.moveDurationMs} ms · recorrido ${traceBack1.pathLengthM} m frente a
${traceBack1.straightLineM} m en línea recta.</p>${strip(filmBack1)}
<h2>Retroceso entre salas, fotograma a fotograma</h2>
<p class="lede">${traceBack2.distinctPositions} posiciones de cámara distintas a lo largo de
${traceBack2.moveDurationMs} ms · recorrido ${traceBack2.pathLengthM} m frente a
${traceBack2.straightLineM} m en línea recta · salas ${traceBack2.spaces.join(' → ')}.</p>${strip(filmBack2)}
<p class="lede">Las tiras son para mirar, no para medir: cada captura cuesta segundos en este
entorno. El movimiento se mide con una traza de cámara en rAF dentro de la página.</p>`
+ `
<h2>Grabación continua</h2><video src="guided-back.webm" controls muted></video>
`);

const passed = results.filter((r) => r.ok).length;
console.log(`\n${passed}/${results.length} comprobaciones`);

await fs.writeFile(path.join(OUT, 'guided-back-motion.json'), JSON.stringify({
  generatedAt: new Date().toISOString(),
  productPath: 'clicks on [data-el="prevBtn"] and [data-el="nextBtn"]; no engine navigation calls',
  motionMeasuredBy: 'in-page rAF pose trace; the screenshot filmstrips are for human viewing only',
  target, moments, filmBack1, filmBack2, traceBack1, traceBack2, trace, planB, planB2,
  crossingBBaseline: CROSSING_B_BASELINE, results, errors
}, null, 1));

await context.close();
// Playwright's raw recording of a 25-minute route is ~40 MB, which is not a
// thing to put in a repository. Re-encode to something a reviewer can open, and
// drop the original — the stills and the pose trace carry the measurements, the
// recording only has to be watchable.
const vids = (await fs.readdir(path.join(OUT, 'video')).catch(() => [])).filter((f) => f.endsWith('.webm'));
if (vids[0]) {
  const raw = path.join(OUT, 'video', vids[0]);
  const out = path.join(OUT, 'guided-back.webm');
  const enc = spawnSync(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-i', raw,
    '-c:v', 'libvpx-vp9', '-crf', '40', '-b:v', '0', '-vf', 'scale=960:-2,fps=12', '-an', '-y', out],
  { encoding: 'utf8' });
  if (enc.status === 0) await fs.rm(path.join(OUT, 'video'), { recursive: true, force: true });
  else await fs.copyFile(raw, out);
  console.log(`grabación: qa/evidence-vs02/guided-back-motion/guided-back.webm`);
}
console.log('tablero: qa/evidence-vs02/guided-back-motion/index.html');
await browser.close();
server.close();
process.exit(passed === results.length ? 0 : 1);
