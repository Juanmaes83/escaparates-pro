/**
 * Separate root cause from symptom at the look-back instant.
 *
 * Human QA reports a perceptual break across the crossing that could be produced
 * by any of four individually-valid subsystems, or by their interaction:
 *
 *   PORTAL SURFACE   the donor shader and what it renders into the aperture
 *   ROOM LIGHTING    two deliberately different curatorial profiles
 *   CAMERA           where the recoil points the look
 *   ROOM DESIGN      the geometry either side of the threshold
 *
 * Attributing it by reading code would be a guess, and the Playbook is explicit
 * that a correct subsystem must not be modified to compensate for an incorrect
 * one. So this holds the move at a fixed instant — deterministic scrub, so every
 * variant is the same camera, same pose, same room state — and toggles ONE
 * subsystem at a time, measuring the frame each time.
 *
 * Variants at the same frozen instant:
 *   as-is            everything on
 *   no-surface       portal plane hidden; isolates "is the plane covering it?"
 *   no-effect        plane visible, effectIntensity 0; isolates the shader
 *   no-fringe        plane visible, red fringe term off; isolates the red
 *
 * Luminance is measured from the captured PNG rather than the WebGL canvas: a
 * drawing buffer is cleared after compositing, and reading it directly returned
 * transparent black for every frame once already (DECISION_LOG L-20).
 *
 *   IW_STEP=step.02-paso-galeria-a node qa/tools/crossing-subsystem-isolation.mjs
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
const OUT = path.join(MODULE_ROOT, 'qa', 'evidence-vs02', 'crossing-isolation');
const PORT = Number(process.env.IW_ISO_PORT || 5210);
const STEP = process.env.IW_STEP || 'step.02-paso-galeria-a';
const TAG = STEP.includes('galeria-b') ? 'B' : 'A';
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

const browser = await chromium.launch({ headless: true, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.setDefaultTimeout(300000);
await page.goto(`http://127.0.0.1:${PORT}/labs/immersive-worlds/index.html?tier=HIGH`, { waitUntil: 'load' });
await page.waitForFunction(() => window.__IW?.ready === true, { timeout: 300000 });
await page.locator('[data-el="enter"]').click({ timeout: 120000 });
await page.waitForFunction(() => {
  const veil = window.__IW?.hud?.el?.veil;
  return veil && (veil.hidden || veil.classList.contains('is-gone'));
}, { timeout: 60000 });
await page.evaluate(() => { document.getElementById('iw-ui').style.opacity = '0'; });
await page.waitForTimeout(1500);

await page.evaluate(() => { const rt = window.__IW.runtime; rt.startRoute(rt.defaultRouteId); });
await page.waitForFunction((s) => window.__IW.runtime.experience.currentStep?.id === s, STEP, { timeout: 300000 });
await page.waitForFunction(() => window.__IW.runtime.crossing.isCrossing === true, null, { timeout: 60000 });
const plan0 = await page.evaluate(() => window.__IW.runtime.crossing.lastPlan);
console.log(`travesía ${STEP} · plan ${JSON.stringify(plan0)}`);
await page.evaluate(() => {
  const c = window.__IW.runtime.crossing;
  c._duration = 100000;
  c._elapsed = 0;
});

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
    k: +(c._elapsed / Math.max(c._duration, 1e-6)).toFixed(4),
    facing, alongAxis, space: rt.state.activeSpaceId,
    effect: rt.sceneKit._portalSurface ? +Number(rt.sceneKit._portalSurface.effectIntensity ?? 0).toFixed(3) : null,
    surface: Boolean(rt.sceneKit._portalSurface?.visible)
  };
};
const seek = async (k) => {
  await page.evaluate((t) => { const c = window.__IW.runtime.crossing; c._elapsed = t * c._duration; }, k);
  await page.evaluate(() => new Promise((r) => { let n = 2; const t = () => (n-- <= 0 ? r() : requestAnimationFrame(t)); requestAnimationFrame(t); }));
  return page.evaluate(READ);
};

/**
 * Walk forward to the first instant past the plane where the look has turned back.
 *
 * Seeded and bounded rather than scanned from 0.60 at 0.01. Past the threshold
 * the destination pass runs and both rooms are live, so the renderer drops to
 * roughly a sixth of a frame per second; a full scan costs about forty seeks of
 * two frames each and ran the whole harness past its own timeout without ever
 * reaching a measurement. The storyboard already located this instant at k≈0.83
 * for crossing A, so the search starts just before it and steps coarsely.
 */
const FROM = Number(process.env.IW_FROM || 0.78);
const STEP_K = Number(process.env.IW_STEP_K || 0.02);
let found = null;
for (let k = FROM; k <= 1.0001; k += STEP_K) {
  const s = await seek(Math.min(k, 1));
  if (s.alongAxis !== null && s.alongAxis > 0 && s.facing > 0.5) { found = { k: Math.min(k, 1), state: s }; break; }
}
if (!found) {
  console.log('no se alcanza ningún instante de mirada atrás — nada que aislar');
  await browser.close(); server.close(); process.exit(1);
}
console.log(`instante de mirada atrás: k=${found.k.toFixed(3)} eje=${found.state.alongAxis} facing=${found.state.facing} sala=${found.state.space}`);

/* One subsystem at a time, all at the same frozen instant. */
const VARIANTS = [
  ['as-is', () => {}],
  ['no-surface', () => { window.__IW.runtime.sceneKit._portalSurface.plane.visible = false; }],
  ['no-effect', () => {
    const s = window.__IW.runtime.sceneKit._portalSurface;
    s.plane.visible = true; s.material.uniforms.effectIntensity.value = 0;
  }],
  ['no-fringe', () => {
    const s = window.__IW.runtime.sceneKit._portalSurface;
    s.plane.visible = true;
    s.material.uniforms.effectIntensity.value = s._effectIntensity;
    s.material.uniforms.fringe.value = 0;
  }]
];
const restore = () => {
  const s = window.__IW.runtime.sceneKit._portalSurface;
  s.plane.visible = s.visible;
  s.material.uniforms.effectIntensity.value = s._effectIntensity;
  s.material.uniforms.fringe.value = 1;
};

const luma = (file) => {
  const out = execFileSync(FFMPEG, ['-hide_banner', '-i', file, '-vf', 'signalstats,metadata=print:key=lavfi.signalstats.YAVG', '-f', 'null', '-'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  const m = /YAVG=([0-9.]+)/.exec(out);
  return m ? Number(m[1]) : null;
};

const rows = [];
for (const [name, apply] of VARIANTS) {
  await page.evaluate(restore);
  await page.evaluate(apply);
  await page.evaluate(() => new Promise((r) => { let n = 2; const t = () => (n-- <= 0 ? r() : requestAnimationFrame(t)); requestAnimationFrame(t); }));
  const file = path.join(OUT, `lookback-${TAG}-${name}.png`);
  await page.screenshot({ path: file });
  const after = await page.evaluate(READ);
  const y = luma(file);
  rows.push({ variant: name, file: path.basename(file), yavg: y, state: after });
  console.log(`  ${name.padEnd(11)} YAVG=${String(y).padStart(7)}  (k=${after.k})`);
}
await page.evaluate(restore);

/* The same instant, but looking forward — the control for "is the room dark?" */
const forward = await seek(Math.min(found.k + 0.12, 0.999));
const fwdFile = path.join(OUT, `forward-${TAG}.png`);
await page.screenshot({ path: fwdFile });
const fwdY = luma(fwdFile);
console.log(`  ${'mirando-adelante'.padEnd(11)} YAVG=${String(fwdY).padStart(7)}  (k=${forward.k} facing=${forward.facing})`);

await fs.writeFile(path.join(OUT, `isolation-${TAG}.json`), JSON.stringify({
  generatedAt: new Date().toISOString(), step: STEP, plan: plan0,
  lookBackAt: found, variants: rows,
  forward: { file: path.basename(fwdFile), yavg: fwdY, state: forward }
}, null, 1));
await browser.close();
server.close();
