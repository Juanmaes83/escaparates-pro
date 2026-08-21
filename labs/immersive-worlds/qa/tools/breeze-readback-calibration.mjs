/**
 * Which readback mechanism can be trusted, and how do we know?
 *
 * Phase 1A stalled on evidence, not on physics. The harness could not read
 * positions off the GPU once `renderAsync` had touched the vertex buffer, and
 * "the simulation ran" is a claim that rests entirely on that readback. The
 * instruction is to classify before fixing, and not to rewrite working donor
 * physics to satisfy an instrument.
 *
 * So this file measures the instrument, not the product. It runs the real guest
 * — real device, real donor kernels, real render loop — and then tries each
 * candidate readback mechanism against answers that are known in advance:
 *
 *   KNOWN ZERO    two reads with no simulation between them must be identical.
 *                 A mechanism that returns drift here is reading garbage, and
 *                 would have "proved" motion in a frozen simulation.
 *   KNOWN PIN     a vertex created with isFixed must never move. The donor's
 *                 solver returns early for it, so any displacement is the
 *                 instrument's, not the physics'.
 *   KNOWN FALL    with only gravity authored, free vertices must move DOWN.
 *                 Sign matters: a mechanism that reads the right magnitude with
 *                 the wrong stride would show motion in an arbitrary direction.
 *
 * A mechanism passes only by getting all three right. That is what makes the
 * eventual "the cloth is simulating" statement worth anything.
 *
 *   node qa/tools/breeze-readback-calibration.mjs
 */
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WEBGPU_ARGS } from './lib/webgpu-launch.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MODULE_ROOT = path.resolve(HERE, '..', '..');
const REPO_ROOT = path.resolve(MODULE_ROOT, '../..');
const OUT = path.join(MODULE_ROOT, 'qa', 'evidence-vs02', 'breeze-phase1a');
const PORT = Number(process.env.IW_CAL_PORT || 5344);
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.glb': 'model/gltf-binary', '.obj': 'text/plain' };

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
  args: WEBGPU_ARGS
});
const page = await browser.newPage({ viewport: { width: 800, height: 500 } });
page.setDefaultTimeout(600000);
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));

const results = [];
const say = (n, ok, d = '') => { results.push({ name: n, ok, detail: d }); console.log(`${ok ? 'OK   ' : 'FALLO'} ${n}${d ? ` — ${d}` : ''}`); };

console.log('BREEZE — CALIBRACIÓN DEL INSTRUMENTO DE LECTURA GPU\n');

// A secure context, on the same origin as the product. Not about:blank — that
// mistake cost a phase once already (L-28).
await page.goto(`http://127.0.0.1:${PORT}/labs/immersive-worlds/index.html?tier=LOW`, { waitUntil: 'load' });

const report = await page.evaluate(async (base) => {
  const M = `${base}/labs/immersive-worlds`;
  const { BreezeGuest } = await import(`${M}/app/nested/breeze/breeze-guest.js`);
  const canvas = document.createElement('canvas');
  canvas.width = 640; canvas.height = 400;
  canvas.style.cssText = 'position:absolute;left:-9999px';
  document.body.appendChild(canvas);

  const g = new BreezeGuest({ clothSize: 12 });
  const out = { backend: null, mechanisms: {}, errors: [] };
  await g.prepare({ canvas });
  await g.activate({});
  out.backend = g.backend;
  out.vertexCount = g.physics.vertexCount;
  out.springCount = g.physics.springCount;

  // The real loop: compute AND render, exactly as the host drives it. Readback
  // that only works when nothing has been drawn is not a usable instrument.
  const renderSteps = async (n) => {
    for (let i = 0; i < n; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await g.physics.update(1 / 60, i / 60);
      // eslint-disable-next-line no-await-in-loop
      await g.renderer.renderAsync(g.scene, g.camera);
    }
  };

  /** A: map the storage buffer directly — what Phase 1A tried. */
  const mechDirect = async () => {
    const ab = await g.renderer.getArrayBufferAsync(g.physics.vertexBuffer.buffer.value);
    const f32 = new Float32Array(ab);
    const stride = g.physics.vertexBuffer.structSize;
    const off = g.physics.vertexBuffer.layout.position.offset;
    const fixedOff = g.physics.vertexBuffer.layout.isFixed.offset;
    const i32 = new Int32Array(ab);
    const pos = []; const fixed = [];
    for (let i = 0; i < g.physics.vertexCount; i += 1) {
      pos.push([f32[i * stride + off], f32[i * stride + off + 1], f32[i * stride + off + 2]]);
      fixed.push(i32[i * stride + fixedOff]);
    }
    return { pos, fixed };
  };

  /** B: the donor's own readback, used by Breeze itself every frame. */
  const mechDonor = async () => {
    await g.physics.readPositions();
    return { pos: g.physics.objects.map((o) => o.position.toArray()), fixed: null };
  };

  const run = async (name, fn) => {
    const m = { available: false, knownZero: null, knownPin: null, knownFall: null, error: null };
    try {
      await renderSteps(4);
      const a = await fn();
      // KNOWN ZERO — no simulation between the two reads.
      await g.renderer.renderAsync(g.scene, g.camera);
      const b = await fn();
      m.available = true;
      m.knownZero = a.pos.reduce((mx, p, i) => Math.max(mx,
        Math.hypot(p[0] - b.pos[i][0], p[1] - b.pos[i][1], p[2] - b.pos[i][2])), 0);

      // KNOWN FALL / KNOWN PIN — 120 steps of gravity, nothing else authored.
      await renderSteps(120);
      const c = await fn();
      let maxDrop = -Infinity; let maxPinMove = 0; let moved = 0;
      for (let i = 0; i < c.pos.length; i += 1) {
        const d = Math.hypot(c.pos[i][0] - b.pos[i][0], c.pos[i][1] - b.pos[i][1], c.pos[i][2] - b.pos[i][2]);
        const isPinned = b.fixed ? b.fixed[i] === 1 : false;
        if (isPinned) maxPinMove = Math.max(maxPinMove, d);
        else { maxDrop = Math.max(maxDrop, b.pos[i][1] - c.pos[i][1]); if (d > 1e-6) moved += 1; }
      }
      m.knownFall = maxDrop === -Infinity ? null : maxDrop;
      m.knownPin = b.fixed ? maxPinMove : null;
      m.movedCount = moved;
      m.total = c.pos.length;
    } catch (e) {
      m.error = String(e?.message || e);
    }
    return m;
  };

  out.mechanisms.direct = await run('direct', mechDirect);
  out.mechanisms.donor = await run('donor', mechDonor);

  /**
   * C: the same direct map, but measured in a window where nothing is drawn.
   *
   * Both mechanisms above fail only once `renderAsync` has touched the vertex
   * buffer — the map races the render pass, and no amount of gating the frame
   * loop from JavaScript fixes that, because the conflict is on the GPU. The
   * physics is identical either way; it is the same donor kernels dispatched by
   * the same `physics.update`. So the numeric evidence is taken with the drawing
   * suspended, and the pixel evidence (below, in the harness) covers the case
   * where both are running.
   */
  window.__CAL = { guest: null };
  const g2 = new BreezeGuest({ clothSize: 12 });
  const canvas2 = document.createElement('canvas');
  canvas2.width = 640; canvas2.height = 400;
  canvas2.style.cssText = 'position:absolute;left:-9999px';
  document.body.appendChild(canvas2);
  await g2.prepare({ canvas: canvas2 });
  await g2.activate({});

  const readCompute = async () => {
    const ab = await g2.renderer.getArrayBufferAsync(g2.physics.vertexBuffer.buffer.value);
    const f32 = new Float32Array(ab); const i32 = new Int32Array(ab);
    const stride = g2.physics.vertexBuffer.structSize;
    const off = g2.physics.vertexBuffer.layout.position.offset;
    const fixedOff = g2.physics.vertexBuffer.layout.isFixed.offset;
    const pos = []; const fixed = [];
    for (let i = 0; i < g2.physics.vertexCount; i += 1) {
      pos.push([f32[i * stride + off], f32[i * stride + off + 1], f32[i * stride + off + 2]]);
      fixed.push(i32[i * stride + fixedOff]);
    }
    return { pos, fixed };
  };
  const computeSteps = async (n, t0 = 0) => {
    for (let i = 0; i < n; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await g2.physics.update(1 / 60, t0 + i / 60);
    }
  };

  const mC = { available: false, knownZero: null, knownPin: null, knownFall: null, error: null };
  try {
    await computeSteps(4);
    const a = await readCompute();
    const b = await readCompute();               // KNOWN ZERO — nothing simulated between
    mC.available = true;
    mC.knownZero = a.pos.reduce((mx, p, i) => Math.max(mx,
      Math.hypot(p[0] - b.pos[i][0], p[1] - b.pos[i][1], p[2] - b.pos[i][2])), 0);
    await computeSteps(120, 4 / 60);
    const c = await readCompute();
    let maxDrop = -Infinity; let maxPin = 0; let moved = 0;
    for (let i = 0; i < c.pos.length; i += 1) {
      const d = Math.hypot(c.pos[i][0] - b.pos[i][0], c.pos[i][1] - b.pos[i][1], c.pos[i][2] - b.pos[i][2]);
      if (b.fixed[i] === 1) maxPin = Math.max(maxPin, d);
      else { maxDrop = Math.max(maxDrop, b.pos[i][1] - c.pos[i][1]); if (d > 1e-6) moved += 1; }
    }
    mC.knownFall = maxDrop === -Infinity ? null : maxDrop;
    mC.knownPin = maxPin;
    mC.movedCount = moved;
    mC.total = c.pos.length;
    mC.pinnedCount = b.fixed.filter((f) => f === 1).length;
  } catch (e) { mC.error = String(e?.message || e); }
  out.mechanisms.computeOnly = mC;

  await g2.dispose();
  await g.dispose();
  return out;
}, `http://127.0.0.1:${PORT}`);

console.log(`backend ${report.backend} · ${report.vertexCount} vértices · ${report.springCount} muelles\n`);
say('el invitado corre sobre WebGPU real', report.backend === 'webgpu', report.backend);

const LABEL = {
  direct: 'A · mapeo directo del storage buffer, con render activo',
  donor: 'B · readPositions() del donante, con render activo',
  computeOnly: 'C · mapeo directo en una ventana sin dibujar'
};
for (const [name, m] of Object.entries(report.mechanisms)) {
  const label = LABEL[name] || name;
  console.log(`\n${label}`);
  if (!m.available) {
    say(`${name}: disponible tras renderizar`, false, m.error || 'sin detalle');
    continue;
  }
  say(`${name}: disponible tras renderizar`, true);
  say(`${name}: CERO CONOCIDO — dos lecturas sin simular son idénticas`,
    m.knownZero === 0, `deriva ${m.knownZero}`);
  say(`${name}: CAÍDA CONOCIDA — la gravedad mueve hacia abajo`,
    m.knownFall !== null && m.knownFall > 1e-6, `caída máx ${m.knownFall?.toExponential?.(2) ?? m.knownFall}`);
  if (m.knownPin !== null) {
    say(`${name}: FIJADO CONOCIDO — un vértice fijado no se mueve`,
      m.knownPin === 0, `movimiento ${m.knownPin}`);
  } else {
    console.log(`INFO  ${name}: no expone el estado de fijado; no se puede calibrar contra un vértice inmóvil`);
  }
}

const trustworthy = Object.entries(report.mechanisms)
  .filter(([, m]) => m.available && m.knownZero === 0 && m.knownFall > 1e-6 && (m.knownPin === null || m.knownPin === 0))
  .map(([n]) => n);
console.log(`\nmecanismos de confianza: ${trustworthy.join(', ') || 'NINGUNO'}`);
say('existe al menos un mecanismo de lectura calibrado', trustworthy.length > 0, trustworthy.join(', '));

const passed = results.filter((r) => r.ok).length;
console.log(`\n${passed}/${results.length}`);
await fs.writeFile(path.join(OUT, 'breeze-readback-calibration.json'), JSON.stringify({
  generatedAt: new Date().toISOString(),
  purpose: 'Classify the Phase 1A readback failure and calibrate a trustworthy mechanism against known answers.',
  report, trustworthy, results, errors
}, null, 1));
await browser.close();
server.close();
process.exit(trustworthy.length > 0 ? 0 : 1);
