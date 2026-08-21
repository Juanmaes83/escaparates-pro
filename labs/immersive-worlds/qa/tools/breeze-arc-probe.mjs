/**
 * What does the Breeze installation actually do, and when?
 *
 * Before a Tour Stop can be authored, the room's dramaturgy has to be observed
 * rather than assumed: the cloth is released at −X, the wind carries it toward
 * Venus, it contacts, deforms and passes. The beats a visitor is brought to must
 * land on those moments, and the only way to know when they occur is to watch.
 *
 * So this renders the real guest at a fixed camera and samples the frame on a
 * simulated-time grid, writing a contact sheet. It is a design instrument, not
 * an acceptance test — the acceptance evidence runs through the Museum route.
 *
 *   IW_ARC_SECONDS=40 node qa/tools/breeze-arc-probe.mjs
 */
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { WEBGPU_ARGS } from './lib/webgpu-launch.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MODULE_ROOT = path.resolve(HERE, '..', '..');
const REPO_ROOT = path.resolve(MODULE_ROOT, '../..');
const OUT = path.join(MODULE_ROOT, 'qa', 'evidence-vs02', 'breeze-arc');
const PORT = Number(process.env.IW_ARC_PORT || 5352);
const SECONDS = Number(process.env.IW_ARC_SECONDS || 40);
const EVERY = Number(process.env.IW_ARC_EVERY || 2);
const FFMPEG = process.env.IW_FFMPEG
  || '/usr/local/lib/python3.11/dist-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.glb': 'model/gltf-binary', '.obj': 'text/plain' };

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
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.setDefaultTimeout(900000);
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

await page.goto(`http://127.0.0.1:${PORT}/labs/immersive-worlds/index.html?tier=LOW`, { waitUntil: 'load' });

const POSE = {
  position: [-13, 2.5, -11.5],
  target: [0, 5.3, 0],
  fov: 40
};

const boot = await page.evaluate(async ({ base, pose, wind, seg }) => {
  const M = `${base}/labs/immersive-worlds`;
  const { BreezeGuest } = await import(`${M}/app/nested/breeze/breeze-guest.js`);
  const canvas = document.createElement('canvas');
  Object.assign(canvas.style, { position: 'fixed', inset: '0', width: '100%', height: '100%', zIndex: '9999' });
  document.body.appendChild(canvas);
  canvas.width = 1280; canvas.height = 720;

  const t0 = performance.now();
  const g = new BreezeGuest({ clothSegments: seg, wind });
  await g.prepare({ canvas });
  await g.activate({});
  g.setCameraPose(pose);
  window.__ARC = { guest: g, canvas };
  return { ...g.report(), bootMs: Math.round(performance.now() - t0) };
}, { base: `http://127.0.0.1:${PORT}`, pose: POSE, wind: process.env.IW_ARC_WIND || 'BREEZE', seg: Number(process.env.IW_ARC_SEGMENTS || 80) });

console.log(`BREEZE — SONDA DEL ARCO\n`);
console.log(`backend ${boot.backend} · ${boot.vertexCount} vértices · ${boot.springCount} muelles · arranque ${boot.bootMs} ms`);
if (boot.lastError) console.log(`error interno: ${boot.lastError}`);

const luma = (file) => {
  const r = spawnSync(FFMPEG, ['-hide_banner', '-i', file, '-vf', 'signalstats,metadata=print:key=lavfi.signalstats.YAVG', '-f', 'null', '-'], { encoding: 'utf8' });
  const m = /YAVG=([0-9.]+)/.exec(`${r.stdout || ''}${r.stderr || ''}`);
  return m ? Number(m[1]) : null;
};

const frames = [];
for (let t = 0; t <= SECONDS; t += EVERY) {
  // Simulated seconds, not wall-clock: the environment runs at a few frames a
  // second and a timed sleep would sample the harness rather than the arc.
  // eslint-disable-next-line no-await-in-loop
  const state = await page.evaluate(async (steps) => {
    const g = window.__ARC.guest;
    for (let i = 0; i < steps; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await g.physics.update(1 / 60, (g._elapsed += 1 / 60));
    }
    g._sinceLaunch += steps / 60;
    await g.renderer.renderAsync(g.scene, g.camera);
    return { sinceLaunch: +g.sinceLaunch.toFixed(2) };
  }, t === 0 ? 0 : EVERY * 60);
  const name = `arc-${String(t).padStart(3, '0')}s.png`;
  // eslint-disable-next-line no-await-in-loop
  await page.screenshot({ path: path.join(OUT, name) });
  const y = luma(path.join(OUT, name));
  frames.push({ t, file: name, yavg: y, ...state });
  console.log(`  t=${String(t).padStart(3)}s  YAVG ${y}`);
}

await fs.writeFile(path.join(OUT, 'breeze-arc.json'), JSON.stringify({
  generatedAt: new Date().toISOString(), pose: POSE, seconds: SECONDS, every: EVERY,
  wind: process.env.IW_ARC_WIND || 'BREEZE', boot, frames, errors
}, null, 1));

await fs.writeFile(path.join(OUT, 'index.html'), `<!doctype html><meta charset="utf-8">
<title>Breeze — arco de la instalación</title>
<style>body{margin:0;padding:2rem;background:#0c0b0a;color:#e8e3d9;font:400 13px/1.6 'Helvetica Neue',sans-serif}
h1{font:400 1.4rem Georgia,serif}.g{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:1rem}
figure{margin:0}img{width:100%;border:1px solid rgba(240,236,228,.14);display:block}
figcaption{padding:.4rem 0;color:#a49d92}</style>
<h1>Breeze — arco de la instalación</h1>
<p>Cámara fija en ${JSON.stringify(POSE.position)} → ${JSON.stringify(POSE.target)} · viento ${process.env.IW_ARC_WIND || 'BREEZE'} · tiempo simulado.</p>
<div class="g">${frames.map((f) => `<figure><img src="${f.file}"><figcaption>t = ${f.t} s</figcaption></figure>`).join('')}</div>`);

console.log(`\ntablero: qa/evidence-vs02/breeze-arc/index.html`);
if (errors.length) console.log(`errores: ${errors.slice(0, 3).join(' · ')}`);
await browser.close();
server.close();
