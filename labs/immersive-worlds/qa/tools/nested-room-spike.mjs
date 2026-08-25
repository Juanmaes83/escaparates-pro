/**
 * OPTION E SPIKE — does the nested room contract hold?
 *
 * WHAT THIS PROVES AND WHAT IT EXPLICITLY DOES NOT
 *
 * The spike's primary question is whether a specialized room runtime can take
 * presentation inside the running Museum, be driven by Museum camera authority,
 * and hand control back cleanly without touching the global renderer. That
 * question is about the HOST CONTRACT and is independent of what the guest
 * draws with.
 *
 * The guest here is a WebGL2 test double. It is NOT Breeze, it is not cloth, and
 * nothing in this file may be reported as evidence that Breeze physics ran.
 * Substituting a double for the ARCHITECTURE is legitimate; substituting one for
 * the CAPABILITY would be faking the result the whole mission exists to obtain.
 *
 * WebGPU itself is available here — adapter google/swiftshader, and a compute
 * pass returns the expected values — once the page is served over
 * http://127.0.0.1 with --enable-unsafe-webgpu. An earlier probe reported it
 * missing because it ran on about:blank, which is not a secure context.
 *
 * The double is deliberately hostile to the contract: it holds a real GL
 * context, allocates buffers, registers a window listener and draws every frame,
 * so leaks, orphaned loops and stolen input have somewhere to come from.
 *
 * Measured: visual handoff, camera pose fidelity, lifecycle across repeated
 * entry/exit, HUD survival, and activation/disposal cost.
 *
 *   node qa/tools/nested-room-spike.mjs
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
const OUT = path.join(MODULE_ROOT, 'qa', 'evidence-vs02', 'nested-room-spike');
const PORT = Number(process.env.IW_NEST_PORT || 5320);
const FFMPEG = process.env.IW_FFMPEG
  || '/usr/local/lib/python3.11/dist-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webm': 'video/webm', '.mp4': 'video/mp4' };

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
  // --enable-unsafe-webgpu matters, and so does loading the page over
  // http://127.0.0.1 rather than about:blank: WebGPU is gated on a secure
  // context, and probing a blank page reported it unavailable when it is not.
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox', '--enable-unsafe-webgpu']
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.setDefaultTimeout(300000);
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

await page.goto(`http://127.0.0.1:${PORT}/labs/immersive-worlds/index.html?tier=LOW`, { waitUntil: 'load' });
await page.waitForFunction(() => window.__IW?.ready === true, { timeout: 300000 });
await page.locator('[data-el="enter"]').click({ timeout: 120000 });
await page.waitForFunction(() => {
  const veil = window.__IW?.hud?.el?.veil;
  return veil && (veil.hidden || veil.classList.contains('is-gone'));
}, { timeout: 60000 });
await page.waitForTimeout(2500);

const webgpu = await page.evaluate(async () => {
  if (!navigator.gpu) return { available: false };
  try { return { available: Boolean(await navigator.gpu.requestAdapter()) }; } catch { return { available: false }; }
});
console.log(`WebGPU en este entorno: ${webgpu.available ? 'DISPONIBLE' : 'NO DISPONIBLE'}`);

/* Install the host and a deliberately hostile test double. */
await page.evaluate(async (base) => {
  const { NestedRoomHost, PRESENTATION } = await import(`${base}/labs/immersive-worlds/app/nested/nested-room-host.js`);
  const rt = window.__IW.runtime;
  const stage = document.getElementById('iw-stage');
  const museumCanvas = document.getElementById('iw-canvas');

  let museumPaused = false;
  const host = new NestedRoomHost({
    stage, museumCanvas,
    pauseMuseum: () => { museumPaused = true; },
    resumeMuseum: () => { museumPaused = false; }
  });
  window.__NEST = { host, PRESENTATION, museumPaused: () => museumPaused, doubleState: null };

  /**
   * A test double for the ARCHITECTURE, not for Breeze.
   *
   * It takes a real GL context, allocates a buffer, adds a window listener and
   * draws a colour derived from the camera pose it is given — so the pose that
   * arrives can be read back out of the pixels, and so leaks have a real source.
   */
  host.register('room.spike', () => {
    let gl = null; let buf = null; let onResize = null; let pose = null; let frames = 0;
    const state = { prepared: 0, activated: 0, suspended: 0, disposed: 0, poses: 0, frames: 0, contextLost: false };
    // Accumulated across every double the factory makes. Pointing at only the
    // latest one compared a per-instance counter against a total and reported a
    // leak that was not there.
    window.__NEST.doubleState = state;
    window.__NEST.totals = window.__NEST.totals || { prepared: 0, disposed: 0 };
    state.totals = window.__NEST.totals;
    state.totals.prepared += 1;
    return {
      async prepare({ canvas }) {
        state.prepared += 1;
        gl = canvas.getContext('webgl2', { antialias: false, preserveDrawingBuffer: true });
        if (!gl) throw new Error('sin WebGL2 para el doble de prueba');
        buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(1 << 16), gl.STATIC_DRAW);
        onResize = () => { state.frames += 0; };
        window.addEventListener('resize', onResize);
      },
      async activate() { state.activated += 1; },
      setCameraPose(p) { pose = p; state.poses += 1; },
      update() {
        frames += 1; state.frames = frames;
        if (!gl || !pose) return;
        // Encode the received pose into the frame: red from x, green from z.
        const r = Math.min(Math.abs(pose.position[0]) / 8, 1);
        const g = Math.min(Math.abs(pose.position[2]) / 20, 1);
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.clearColor(r, g, 0.35, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
      },
      suspend() { state.suspended += 1; },
      restore() { },
      async dispose() {
        state.disposed += 1;
        state.totals.disposed += 1;
        if (onResize) window.removeEventListener('resize', onResize);
        if (gl && buf) gl.deleteBuffer(buf);
        const ext = gl && gl.getExtension('WEBGL_lose_context');
        if (ext) { ext.loseContext(); state.contextLost = true; }
        gl = null; buf = null; pose = null;
      }
    };
  });

  window.__NEST.enter = async () => {
    const pose = rt.camera.pose;
    await host.activate('room.spike', { pose });
    return host.report();
  };
  window.__NEST.leave = async () => { await host.dispose(); return host.report(); };
}, `http://127.0.0.1:${PORT}`);

const shot = async (name) => {
  const f = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: f });
  const r = spawnSync(FFMPEG, ['-hide_banner', '-i', f, '-vf', 'signalstats,metadata=print:key=lavfi.signalstats.YAVG', '-f', 'null', '-'], { encoding: 'utf8' });
  const m = /YAVG=([0-9.]+)/.exec(`${r.stdout || ''}${r.stderr || ''}`);
  return { file: `${name}.png`, yavg: m ? Number(m[1]) : null };
};

const results = [];
const say = (n, ok, d = '') => { results.push({ name: n, ok, detail: d }); console.log(`${ok ? 'OK   ' : 'FALLO'} ${n}${d ? ` — ${d}` : ''}`); };

const beforeShot = await shot('01-museo-antes');
const t0 = Date.now();
const entered = await page.evaluate(() => window.__NEST.enter());
const activateMs = Date.now() - t0;
await page.waitForTimeout(1200);
const guestShot = await shot('02-invitado-presentando');

say('el invitado toma la presentación', entered.presentation === 'GUEST', `${activateMs} ms`);
say('el lienzo del Museo queda oculto, no destruido', entered.museumCanvasHidden);
say('exactamente un lienzo invitado', entered.guestCanvases === 1, String(entered.guestCanvases));
say('el frame del invitado no es negro', (guestShot.yavg ?? 0) > 8, `YAVG ${guestShot.yavg}`);

/* HUD must survive: the way out cannot be swallowed by a room. */
const hud = await page.evaluate(() => {
  const btn = document.querySelector('[data-el="a11yBtn"]');
  const r = btn?.getBoundingClientRect();
  const top = r ? document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2) : null;
  return { present: Boolean(btn), hitsHud: Boolean(top && btn.contains(top)), topTag: top?.tagName || null };
});
say('el HUD sigue recibiendo el puntero', hud.present && hud.hitsHud, hud.topTag || '');

/* Camera authority: Museum pushes a pose, the guest renders it. */
const poseTest = await page.evaluate(async () => {
  const rt = window.__IW.runtime;
  const host = window.__NEST.host;
  const sent = { position: [7.5, 1.6, -18], target: [0, 1.5, -25], fov: 55 };
  host.setCameraPose(sent);
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  const got = window.__NEST.doubleState.poses;
  return { sent, receivedCount: got, museumOwner: rt.camera.owner };
});
await page.waitForTimeout(400);
const poseShot = await shot('03-pose-empujada');
say('el Museo empuja pose y el invitado la recibe', poseTest.receivedCount >= 2, `${poseTest.receivedCount} poses`);
say('la pose llega a los píxeles del invitado', (poseShot.yavg ?? 0) !== (guestShot.yavg ?? -1),
  `YAVG ${guestShot.yavg} → ${poseShot.yavg}`);

/* Exit and restore. */
const t1 = Date.now();
const left = await page.evaluate(() => window.__NEST.leave());
const disposeMs = Date.now() - t1;
await page.waitForTimeout(1500);
const restoredShot = await shot('04-museo-restaurado');
say('la presentación vuelve al Museo', left.presentation === 'MUSEUM', `${disposeMs} ms`);
say('no queda ningún lienzo invitado', left.guestCanvases === 0, String(left.guestCanvases));
say('el bucle del invitado está parado', left.loopRunning === false);
say('el Museo vuelve a pintar', Math.abs((restoredShot.yavg ?? 0) - (beforeShot.yavg ?? 0)) < 25,
  `YAVG ${beforeShot.yavg} → ${restoredShot.yavg}`);

/* Repeated entry/exit — where duplicate loops and leaks would show. */
for (let i = 0; i < 3; i += 1) {
  await page.evaluate(() => window.__NEST.enter());
  await page.waitForTimeout(500);
  await page.evaluate(() => window.__NEST.leave());
  await page.waitForTimeout(300);
}
const after = await page.evaluate(() => ({ ...window.__NEST.host.report(), double: window.__NEST.doubleState, totals: window.__NEST.totals }));
say('entradas y salidas equilibradas', after.activations === after.disposals, `${after.activations}/${after.disposals}`);
say('un solo bucle por activación', after.loops === after.activations, `${after.loops} bucles`);
say('sin lienzos invitados acumulados', after.guestCanvases === 0, String(after.guestCanvases));
say('cada doble liberó su contexto', after.totals.disposed === after.activations,
  `${after.totals.disposed}/${after.activations}`);
say('sin errores de runtime', errors.length === 0, errors.slice(0, 2).join(' · ') || 'ninguno');

/* The Museum must still work afterwards — no global regression. */
const museum = await page.evaluate(() => {
  const rt = window.__IW.runtime;
  return { space: rt.state.activeSpaceId, owner: rt.camera.owner, ready: window.__IW.ready };
});
say('el Museo sigue operativo tras el ciclo', Boolean(museum.space) && museum.ready, `${museum.space} · ${museum.owner}`);

const passed = results.filter((r) => r.ok).length;
console.log(`\n${passed}/${results.length} comprobaciones · activación ${activateMs} ms · liberación ${disposeMs} ms`);
console.log(`CAPACIDAD BREEZE: NO PROBADA en este arnés — el invitado es un doble de prueba, no Breeze`);
console.log(`WebGPU: ${webgpu.available ? 'disponible' : 'no disponible'} (contexto seguro requerido)`);

await fs.writeFile(path.join(OUT, 'nested-room-spike.json'), JSON.stringify({
  generatedAt: new Date().toISOString(),
  note: 'ARCHITECTURE SPIKE. The guest is a WebGL2 test double, not Breeze. No Breeze capability is claimed.',
  webgpu, activateMs, disposeMs, entered, left, after, results, errors
}, null, 1));
await browser.close();
server.close();
process.exit(passed === results.length ? 0 : 1);
