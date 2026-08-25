/**
 * Which phase loses the WebGPU device?
 *
 * The installation builds — real bake, real vertex and spring counts — and then
 * the canvas stays blank and Dawn reports the device lost. Guessing at that from
 * the outside is how an afternoon disappears, so this builds the room one piece
 * at a time and asks after each piece whether the device is still alive.
 *
 * `device.lost` is a promise that never rejects, so each check races it against
 * a short timer: if it settles, the device died during the phase just executed.
 *
 *   node qa/tools/breeze-device-isolation.mjs
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
const OUT = path.join(MODULE_ROOT, 'qa', 'evidence-vs02', 'breeze-arc');
const PORT = Number(process.env.IW_ISO_PORT || 5356);
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
const page = await browser.newPage({ viewport: { width: 900, height: 560 } });
page.setDefaultTimeout(900000);
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

await page.goto(`http://127.0.0.1:${PORT}/labs/immersive-worlds/index.html?tier=LOW`, { waitUntil: 'load' });

const out = await page.evaluate(async ({ base, segments }) => {
  const M = `${base}/labs/immersive-worlds`;
  const core = await import(`${M}/vendor/breeze-core/breeze-core.js`);
  const { THREE, TSL, VerletPhysics, Statue, ClothGeometry, Lights, RoomEnvironment, triNoise3Dvec } = core;
  const { vec3, smoothstep, uniform } = TSL;

  const canvas = document.createElement('canvas');
  Object.assign(canvas.style, { position: 'fixed', inset: '0', width: '100%', height: '100%', zIndex: '9999' });
  document.body.appendChild(canvas);
  canvas.width = 900; canvas.height = 560;

  const log = [];
  let device = null;
  let lost = false;
  const alive = async () => {
    if (!device) return 'sin device';
    const r = await Promise.race([
      device.lost.then((i) => `PERDIDO: ${i.reason} — ${i.message}`),
      new Promise((res) => setTimeout(() => res('vivo'), 250))
    ]);
    if (r !== 'vivo') lost = true;
    return r;
  };
  const phase = async (name, fn) => {
    if (lost) { log.push({ name, state: 'omitido — el device ya estaba perdido', ms: 0 }); return null; }
    const t0 = performance.now();
    let value = null; let error = null;
    try { value = await fn(); } catch (e) { error = String(e?.message || e); }
    const state = await alive();
    log.push({ name, ms: Math.round(performance.now() - t0), state, error });
    return value;
  };

  const renderer = new THREE.WebGPURenderer({ canvas, antialias: true });
  renderer.setPixelRatio(1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;

  await phase('init del renderer', async () => {
    await renderer.init();
    device = renderer.backend?.device || null;
    return renderer.backend?.isWebGPUBackend;
  });

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x14120f);
  const camera = new THREE.PerspectiveCamera(40, 900 / 560, 0.05, 400);
  camera.position.set(-13, 2.5, -11.5);
  camera.lookAt(0, 5.3, 0);

  await phase('render de escena vacía', () => renderer.renderAsync(scene, camera));

  await phase('RoomEnvironment + PMREM', () => {
    const p = new THREE.PMREMGenerator(renderer);
    const t = p.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = t.texture;
    scene.environmentIntensity = 0.55;
    return true;
  });
  await phase('render tras el entorno', () => renderer.renderAsync(scene, camera));

  const statue = await phase('Statue.init() — GLB + OBJ + BVH', async () => {
    const s = new Statue();
    await s.init();
    scene.add(s.object);
    return s;
  });
  await phase('render con Venus', () => renderer.renderAsync(scene, camera));

  await phase('Lights (foco con sombras)', () => {
    const l = new Lights();
    scene.add(l.object);
    return true;
  });
  await phase('render con luz, sin shadowMap', () => renderer.renderAsync(scene, camera));

  await phase('activar shadowMap', () => {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    return true;
  });
  await phase('render con sombras', () => renderer.renderAsync(scene, camera));

  const physics = await phase('VerletPhysics + fuerza + colisionador', () => {
    const p = new VerletPhysics(renderer);
    const wind = uniform(1);
    p.addForce((position, time) => {
      const force = vec3(0).toVar();
      force.y.subAssign(0.000001);
      const noise = triNoise3Dvec(position.mul(0.01), 0.2, time).sub(vec3(0.0, 0.285, 0.285));
      const chaos = smoothstep(-0.5, 1, position.x).mul(0.0001).toVar();
      force.addAssign(noise.mul(vec3(0.00005, chaos, chaos)).mul(5).mul(wind));
      return force;
    });
    if (statue) p.addCollider(statue.bvh);
    return p;
  });

  const clothGeo = await phase('ClothGeometry + bake del material', async () => {
    const cg = new ClothGeometry(physics, segments, segments);
    const inst = cg.addInstance();
    await cg.bake();
    scene.add(cg.object);
    return { cg, inst };
  });

  await phase('resetObject (lanzamiento)', async () => {
    if (!clothGeo) return null;
    await physics.resetObject(clothGeo.inst.id, new THREE.Vector3(-10, 5, 0), new THREE.Quaternion());
    return true;
  });

  await phase('physics.bake()', () => physics.bake());
  await phase('render con la tela', () => renderer.renderAsync(scene, camera));
  await phase('60 pasos de simulación', async () => {
    for (let i = 0; i < 60; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await physics.update(1 / 60, i / 60);
    }
    return true;
  });
  await phase('render tras simular', () => renderer.renderAsync(scene, camera));

  return { log, vertexCount: physics?.vertexCount ?? null, springCount: physics?.springCount ?? null };
}, { base: `http://127.0.0.1:${PORT}`, segments: Number(process.env.IW_ISO_SEGMENTS || 24) });

console.log('BREEZE — AISLAMIENTO DE LA PÉRDIDA DE DEVICE\n');
for (const r of out.log) {
  const mark = r.state === 'vivo' ? 'OK   ' : (r.state.startsWith('omitido') ? '     ' : 'MUERE');
  console.log(`${mark} ${r.name.padEnd(38)} ${String(r.ms).padStart(6)} ms  ${r.state}${r.error ? `  · error: ${r.error}` : ''}`);
}
console.log(`\n${out.vertexCount} vértices · ${out.springCount} muelles`);
const died = out.log.find((r) => r.state.startsWith('PERDIDO'));
console.log(died ? `\nPRIMER FALLO: ${died.name}` : '\nEl device sobrevive a todas las fases.');
await fs.writeFile(path.join(OUT, 'breeze-device-isolation.json'), JSON.stringify({
  generatedAt: new Date().toISOString(), segments: Number(process.env.IW_ISO_SEGMENTS || 24), ...out, errors
}, null, 1));
await browser.close();
server.close();
process.exit(died ? 1 : 0);
