/**
 * PHASE 1A — is the real Breeze compute core alive inside the E1 host?
 *
 * ┌──────────────────────────────────────────────────────────────────────────┐
 * │ FROZEN, INCOMPLETE. PHASE 1A IS **NOT** CLOSED.                          │
 * │                                                                          │
 * │ Breeze product expansion was frozen by human decision before this        │
 * │ harness passed. Its last recorded run reached 7 of its checks and then   │
 * │ aborted:                                                                 │
 * │                                                                          │
 * │   OK    WebGPU disponible en contexto seguro — google/swiftshader        │
 * │   OK    el núcleo cargado declara su procedencia — 0ab8234               │
 * │   OK    el invitado toma la presentación — 3447 ms                       │
 * │   OK    BACKEND REAL: WebGPU, sin caída a WebGL                          │
 * │   OK    la física de Breeze horneó sus kernels — 400 vértices ·          │
 * │         1482 muelles                                                     │
 * │   OK    el lienzo del Museo queda oculto, no destruido                   │
 * │   OK    exactamente un lienzo invitado                                   │
 * │   ABORT sampleVertices → "Failed to execute 'mapAsync' on 'GPUBuffer':   │
 * │         A valid external Instance reference no longer exists."           │
 * │                                                                          │
 * │ So what IS established: a real WebGPU device, the donor's kernels        │
 * │ compiling and baking (which includes the BVH traversal the vertex        │
 * │ kernel calls into), inside the E1 host, with the Museum standing down.   │
 * │                                                                          │
 * │ What is NOT established, and must not be reported as if it were: that    │
 * │ the simulation produced motion. That claim rests entirely on reading     │
 * │ positions back off the GPU, and the readback is the thing that fails.    │
 * │ A canvas that looks like cloth is not evidence a compute pass ran.       │
 * │                                                                          │
 * │ Narrowed before the freeze: `getArrayBufferAsync` on the vertex buffer   │
 * │ succeeds after `computeAsync` alone, and fails once `renderAsync` has    │
 * │ run against the same buffer — so the map is racing the render pass, not  │
 * │ the simulation. Gating the frame loop during readback was not enough.    │
 * │ That is where 1A resumes.                                                │
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 * The Option E1 spike answered a question about architecture using a WebGL test
 * double, and was explicit that it proved nothing about Breeze. This harness
 * answers the other question, and it is written so that it cannot pass with a
 * double:
 *
 *   · the renderer must report a WebGPU backend — a WebGL fallback is a FAIL,
 *     not a degraded pass
 *   · `VerletPhysics.bake()` must succeed, which means the donor's kernels
 *     compiled, including the BVH traversal the vertex kernel calls into
 *   · positions must be read back off the GPU and must have changed under
 *     gravity, with pinned vertices still pinned
 *
 * The last one is the load-bearing check. A canvas that looks like cloth proves
 * nothing about whether a compute pass ever dispatched; numbers that came out of
 * the vertex buffer do.
 *
 * The simulation is scrubbed deterministically rather than left to wall-clock
 * frames. Under a software adapter this environment runs at a few frames a
 * second, so a timed wait would measure swiftshader and not the physics — the
 * same mistake the crossing instrument made before it was fixed.
 *
 *   node qa/tools/breeze-phase1a-core.mjs
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
const OUT = path.join(MODULE_ROOT, 'qa', 'evidence-vs02', 'breeze-phase1a');
const PORT = Number(process.env.IW_BREEZE_PORT || 5322);
const FFMPEG = process.env.IW_FFMPEG
  || '/usr/local/lib/python3.11/dist-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg' };

await fs.mkdir(OUT, { recursive: true });
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
  // WebGPU is gated on a secure context. Served over http://127.0.0.1 with
  // --enable-unsafe-webgpu the adapter is google/swiftshader and compute works;
  // an earlier probe reported WebGPU missing only because it ran on about:blank.
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox', '--enable-unsafe-webgpu']
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.setDefaultTimeout(600000);
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

const results = [];
const say = (n, ok, d = '') => { results.push({ name: n, ok, detail: d }); console.log(`${ok ? 'OK   ' : 'FALLO'} ${n}${d ? ` — ${d}` : ''}`); };

const shot = async (name) => {
  const f = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: f });
  const r = spawnSync(FFMPEG, ['-hide_banner', '-i', f, '-vf', 'signalstats,metadata=print:key=lavfi.signalstats.YAVG', '-f', 'null', '-'], { encoding: 'utf8' });
  const m = /YAVG=([0-9.]+)/.exec(`${r.stdout || ''}${r.stderr || ''}`);
  return { file: `${name}.png`, yavg: m ? Number(m[1]) : null };
};

console.log('BREEZE — FASE 1A · NÚCLEO DE CÓMPUTO REAL EN EL HOST E1\n');

await page.goto(`http://127.0.0.1:${PORT}/labs/immersive-worlds/index.html?tier=LOW`, { waitUntil: 'load' });
await page.waitForFunction(() => window.__IW?.ready === true, { timeout: 600000 });
await page.locator('[data-el="enter"]').click({ timeout: 120000 });
await page.waitForFunction(() => {
  const veil = window.__IW?.hud?.el?.veil;
  return veil && (veil.hidden || veil.classList.contains('is-gone'));
}, { timeout: 120000 });
await page.waitForTimeout(2500);

const gpu = await page.evaluate(async () => {
  if (!navigator.gpu) return { available: false };
  try {
    const a = await navigator.gpu.requestAdapter();
    return { available: Boolean(a), info: a?.info ? { vendor: a.info.vendor, architecture: a.info.architecture } : null };
  } catch (e) { return { available: false, error: String(e?.message || e) }; }
});
say('WebGPU disponible en contexto seguro', gpu.available,
  gpu.info ? `${gpu.info.vendor}/${gpu.info.architecture}` : (gpu.error || ''));
if (!gpu.available) {
  console.log('\nSin adaptador WebGPU no hay nada que medir: se aborta antes de inventar un resultado.');
  await browser.close(); server.close(); process.exit(1);
}

/* Wire the real guest into the real host. Nothing here is a double. */
await page.evaluate(async (base) => {
  const M = `${base}/labs/immersive-worlds`;
  const { NestedRoomHost } = await import(`${M}/app/nested/nested-room-host.js`);
  const { BreezeGuest, BREEZE_CORE_URL, PHASE } = await import(`${M}/app/nested/breeze/breeze-guest.js`);
  const { BREEZE_SOURCE } = await import(BREEZE_CORE_URL);

  const stage = document.getElementById('iw-stage');
  const museumCanvas = document.getElementById('iw-canvas');
  let museumPaused = false;
  const host = new NestedRoomHost({
    stage, museumCanvas,
    pauseMuseum: () => { museumPaused = true; },
    resumeMuseum: () => { museumPaused = false; }
  });

  const guests = [];
  host.register('room.breeze', () => {
    const g = new BreezeGuest({ clothSize: 20 });
    guests.push(g);
    window.__BZ.guest = g;
    return g;
  });

  window.__BZ = {
    host, guests, phase: PHASE, source: BREEZE_SOURCE, guest: null,
    museumPaused: () => museumPaused,
    enter: async (pose) => { await host.activate('room.breeze', { pose }); return host.report(); },
    leave: async () => { await host.dispose(); return host.report(); },
    /**
     * Deterministic scrubbing: advance a fixed number of fixed-size frames and
     * wait for each compute step to land, instead of sleeping and hoping.
     */
    scrub: async (frames, dt = 1 / 60) => {
      const g = window.__BZ.guest;
      for (let i = 0; i < frames; i += 1) {
        g.update(dt);
        // eslint-disable-next-line no-await-in-loop
        await new Promise((resolve) => {
          const poll = () => (g.isStepping ? setTimeout(poll, 4) : resolve());
          poll();
        });
      }
      return g.report();
    }
  };
}, `http://127.0.0.1:${PORT}`);

const provenance = await page.evaluate(() => window.__BZ.source);
say('el núcleo cargado declara su procedencia',
  provenance?.commit === '0ab82342f9169f20e32b0e90babcc4707e694906' && provenance?.appShell === 'NOT PORTED',
  `${provenance?.commit?.slice(0, 7)} · three ${provenance?.three}`);

const beforeShot = await shot('01-museo-antes');

/* ── Initialize ────────────────────────────────────────────────────── */
const t0 = Date.now();
const entered = await page.evaluate(() => {
  const pose = window.__IW.runtime.camera.pose;
  return window.__BZ.enter({ position: [...pose.position], target: [...pose.target], fov: pose.fov ?? 45 });
});
const activateMs = Date.now() - t0;
const guestReport = await page.evaluate(() => window.__BZ.guest.report());

say('el invitado toma la presentación', entered.presentation === 'GUEST', `${activateMs} ms`);
say('BACKEND REAL: WebGPU, sin caída a WebGL', guestReport.backend === 'webgpu',
  `${guestReport.backend}${guestReport.adapter ? ` · ${guestReport.adapter.vendor}/${guestReport.adapter.architecture}` : ''}`);
say('la física de Breeze horneó sus kernels',
  guestReport.vertexCount > 0 && guestReport.springCount > 0,
  `${guestReport.vertexCount} vértices · ${guestReport.springCount} muelles`);
say('el lienzo del Museo queda oculto, no destruido', entered.museumCanvasHidden);
say('exactamente un lienzo invitado', entered.guestCanvases === 1, String(entered.guestCanvases));

/* ── One simulation ────────────────────────────────────────────────── */
const before = await page.evaluate(() => window.__BZ.guest.sampleVertices(400));
const scrubbed = await page.evaluate(() => window.__BZ.scrub(90));
const after = await page.evaluate(() => window.__BZ.guest.sampleVertices(400));
await page.waitForTimeout(600);
const guestShot = await shot('02-invitado-simulando');

const moved = (a, b) => {
  let maxD = 0; let maxDrop = 0; let n = 0;
  for (let i = 0; i < Math.min(a.sample.length, b.sample.length); i += 1) {
    const d = Math.hypot(b.sample[i][0] - a.sample[i][0], b.sample[i][1] - a.sample[i][1], b.sample[i][2] - a.sample[i][2]);
    if (d > 1e-7) n += 1;
    maxD = Math.max(maxD, d);
    maxDrop = Math.max(maxDrop, a.sample[i][1] - b.sample[i][1]);
  }
  return { moved: n, total: Math.min(a.sample.length, b.sample.length), maxD, maxDrop };
};
const delta = moved(before, after);

say('el cómputo se despachó de verdad', scrubbed.steps >= 90, `${scrubbed.steps} pasos`);
say('LA SIMULACIÓN CORRIÓ: las posiciones cambiaron en la GPU',
  delta.moved > 0 && delta.maxD > 1e-6,
  `${delta.moved}/${delta.total} vértices · desplazamiento máx ${delta.maxD.toExponential(2)}`);
say('la gravedad tira hacia abajo', delta.maxDrop > 0, `caída máx ${delta.maxDrop.toExponential(2)}`);
say('los vértices fijados siguen fijados', delta.moved < delta.total,
  `${delta.total - delta.moved} inmóviles`);
say('el frame del invitado no es negro', (guestShot.yavg ?? 0) > 3, `YAVG ${guestShot.yavg}`);
say('sin error interno en el invitado', !scrubbed.lastError, scrubbed.lastError || 'ninguno');

/* ── Camera authority ──────────────────────────────────────────────── */
const poseTest = await page.evaluate(async () => {
  const host = window.__BZ.host;
  const g = window.__BZ.guest;
  const posesBefore = g.report().poses;
  host.setCameraPose({ position: [0, 1.4, 3.2], target: [0, 1.0, 0], fov: 50 });
  await window.__BZ.scrub(4);
  return {
    posesBefore, posesAfter: g.report().poses,
    camera: { position: g.camera.position.toArray(), fov: g.camera.fov },
    museumOwner: window.__IW.runtime.camera.owner,
    listeners: typeof g.controls
  };
});
const poseShot = await shot('03-pose-del-museo');
say('el Museo empuja pose y el invitado la aplica',
  poseTest.posesAfter > poseTest.posesBefore
  && Math.abs(poseTest.camera.position[2] - 3.2) < 1e-6 && poseTest.camera.fov === 50,
  `fov ${poseTest.camera.fov} · z ${poseTest.camera.position[2]}`);
say('el invitado no tiene controles propios', poseTest.listeners === 'undefined');
say('la pose llega a los píxeles', (poseShot.yavg ?? 0) !== (guestShot.yavg ?? -1),
  `YAVG ${guestShot.yavg} → ${poseShot.yavg}`);

/* ── Suspend / restore ─────────────────────────────────────────────── */
const suspendTest = await page.evaluate(async () => {
  const host = window.__BZ.host;
  const g = window.__BZ.guest;
  host.suspend();
  const stepsAtSuspend = g.report().steps;
  await new Promise((r) => setTimeout(r, 700));
  const stepsWhileSuspended = g.report().steps;
  host.restore();
  await window.__BZ.scrub(6);
  return { stepsAtSuspend, stepsWhileSuspended, stepsAfterRestore: g.report().steps, report: g.report() };
});
say('suspender detiene la simulación',
  suspendTest.stepsWhileSuspended === suspendTest.stepsAtSuspend,
  `${suspendTest.stepsAtSuspend} → ${suspendTest.stepsWhileSuspended}`);
say('restaurar la reanuda', suspendTest.stepsAfterRestore > suspendTest.stepsWhileSuspended,
  `→ ${suspendTest.stepsAfterRestore}`);

/* ── The HUD is never swallowed ────────────────────────────────────── */
const hud = await page.evaluate(() => {
  const btn = document.querySelector('[data-el="a11yBtn"]');
  const r = btn?.getBoundingClientRect();
  const top = r ? document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2) : null;
  return { present: Boolean(btn), hitsHud: Boolean(top && btn.contains(top)) };
});
say('el HUD sigue recibiendo el puntero', hud.present && hud.hitsHud);

/* ── Dispose ───────────────────────────────────────────────────────── */
const t1 = Date.now();
const left = await page.evaluate(() => window.__BZ.leave());
const disposeMs = Date.now() - t1;
await page.waitForTimeout(1500);
const restoredShot = await shot('04-museo-restaurado');
say('la presentación vuelve al Museo', left.presentation === 'MUSEUM', `${disposeMs} ms`);
say('no queda ningún lienzo invitado', left.guestCanvases === 0, String(left.guestCanvases));
say('el bucle del invitado está parado', left.loopRunning === false);
say('el Museo vuelve a pintar', Math.abs((restoredShot.yavg ?? 0) - (beforeShot.yavg ?? 0)) < 25,
  `YAVG ${beforeShot.yavg} → ${restoredShot.yavg}`);

/* ── Reinitialize ──────────────────────────────────────────────────── */
const t2 = Date.now();
const reentered = await page.evaluate(() => {
  const pose = window.__IW.runtime.camera.pose;
  return window.__BZ.enter({ position: [...pose.position], target: [...pose.target], fov: pose.fov ?? 45 });
});
const reactivateMs = Date.now() - t2;
const second = await page.evaluate(() => window.__BZ.scrub(30));
say('el ciclo vuelve a arrancar con un dispositivo nuevo',
  reentered.presentation === 'GUEST' && second.backend === 'webgpu' && second.steps >= 30,
  `${reactivateMs} ms · ${second.steps} pasos`);
await page.evaluate(() => window.__BZ.leave());

/* ── Repeated lifecycle: where leaked devices would surface ────────── */
for (let i = 0; i < 2; i += 1) {
  // eslint-disable-next-line no-await-in-loop
  await page.evaluate(() => window.__BZ.enter({ position: [0, 1.5, 3], target: [0, 1, 0], fov: 45 }));
  // eslint-disable-next-line no-await-in-loop
  await page.evaluate(() => window.__BZ.scrub(8));
  // eslint-disable-next-line no-await-in-loop
  await page.evaluate(() => window.__BZ.leave());
}
const totals = await page.evaluate(() => ({
  ...window.__BZ.host.report(),
  guests: window.__BZ.guests.length,
  disposals: window.__BZ.guests.filter((g) => g.stats.disposed > 0).length,
  backends: window.__BZ.guests.map((g) => g.backend)
}));
say('entradas y salidas equilibradas', totals.activations === totals.disposals + 0
  && totals.activations === totals.guests, `${totals.activations} activaciones · ${totals.guests} invitados`);
say('cada invitado liberó su dispositivo', totals.disposals === totals.guests,
  `${totals.disposals}/${totals.guests}`);
say('un solo bucle por activación', totals.loops === totals.activations, `${totals.loops} bucles`);
say('todos los ciclos fueron WebGPU', totals.backends.every((b) => b === 'webgpu'), totals.backends.join(','));
say('sin lienzos invitados acumulados', totals.guestCanvases === 0, String(totals.guestCanvases));

const museum = await page.evaluate(() => ({
  space: window.__IW.runtime.state.activeSpaceId,
  owner: window.__IW.runtime.camera.owner,
  ready: window.__IW.ready
}));
say('el Museo sigue operativo tras el ciclo', Boolean(museum.space) && museum.ready,
  `${museum.space} · ${museum.owner}`);
say('sin errores de runtime', errors.length === 0, errors.slice(0, 2).join(' · ') || 'ninguno');

const passed = results.filter((r) => r.ok).length;
console.log(`\n${passed}/${results.length} comprobaciones`);
console.log(`activación ${activateMs} ms · reactivación ${reactivateMs} ms · liberación ${disposeMs} ms`);
console.log(passed === results.length
  ? '\nFASE 1A: EL NÚCLEO DE CÓMPUTO REAL DE BREEZE CORRE DENTRO DEL HOST E1'
  : '\nFASE 1A: NO CERRADA');
console.log('Contenido aún provisional: colisionador esfera (1B), tela como marcadores (1C), sin viento (1D).');

await fs.writeFile(path.join(OUT, 'breeze-phase1a.json'), JSON.stringify({
  generatedAt: new Date().toISOString(),
  claim: 'Real WebGPU device and real Breeze VerletPhysics/BVH/StructuredArray kernels, inside the E1 host.',
  notClaimed: 'Venus (1B), cloth geometry and material (1C), wind (1D), authored placement (1E).',
  provenance, gpu, activateMs, reactivateMs, disposeMs,
  guestReport, delta, scrubbed, suspendTest, totals, results, errors
}, null, 1));
await browser.close();
server.close();
process.exit(passed === results.length ? 0 : 1);
