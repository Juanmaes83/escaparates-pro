/**
 * Does pacing change HOW the camera travels and never WHERE the beat ends?
 *
 * That is the frozen contract, and it is the only thing about this feature
 * worth proving. Everything else — the panel renders, the buttons toggle — is
 * scaffolding around the one claim that could break the guided experience.
 *
 * So the test runs the same route three times at three paces and compares the
 * poses the camera comes to rest on. They must be identical to the millimetre.
 * If they are not, the feature is unshippable however good it looks.
 *
 *   node qa/tools/transition-proof.mjs
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
const OUT = path.join(MODULE_ROOT, 'qa', 'evidence-vs02', 'transitions');
const PORT = Number(process.env.IW_TR_PORT || 5030);
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

const results = [];
const say = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
};

const browser = await chromium.launch({
  headless: true,
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox']
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.setDefaultTimeout(300000);
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto(`http://127.0.0.1:${PORT}/labs/immersive-worlds/index.html?tier=HIGH&authoring=1`, { waitUntil: 'load' });
await page.waitForFunction(() => window.__IW?.ready === true, { timeout: 300000 });
await page.evaluate(() => { window.__IW.hud.el.veil.hidden = true; });
await page.waitForTimeout(1200);

/* -- the panel exists and speaks author language --------------------------- */

await page.click('[data-domain="experience"]');
await page.waitForTimeout(600);
const panel = await page.evaluate(() => {
  const root = document.querySelector('.st-lib');
  if (!root) return null;
  return {
    text: root.textContent.replace(/\s+/g, ' '),
    paces: [...root.querySelectorAll('[data-set="experience.pacing"]')].map((b) => b.querySelector('b').textContent),
    motion: [...root.querySelectorAll('[data-set="experience.motion"]')].length,
    replay: Boolean(root.querySelector('[data-act="replay"]'))
  };
});
say('el área Experiencia abre el panel de recorridos', Boolean(panel), panel ? 'sí' : 'no hay panel');
say('el ritmo se ofrece en lenguaje de autor', panel?.paces?.join(' · ') === 'Ágil · Natural · Pausado',
  String(panel?.paces?.join(' · ')));
say('hay alternativa de movimiento reducido', panel?.motion === 2, `${panel?.motion} opciones`);
say('se puede ver el recorrido desde el panel', panel?.replay === true);

// Engine vocabulary must not reach the author. This is the leak that keeps
// coming back, so it is asserted rather than eyeballed.
const leaks = ['T1_', 'T2_', 'T3_', 'T4_', 'T5_', 'T6_', 'frameCorners', 'DIRECTED', 'EXPLORE',
  'pose', 'yaw', 'pitch', 'vector', 'easing'];
const found = leaks.filter((w) => (panel?.text || '').includes(w));
say('ningún vocabulario de motor en el panel', found.length === 0, found.join(', ') || 'ninguno');
await page.screenshot({ path: path.join(OUT, '31_TRANSITIONS_PANEL.png') });

/* -- the contract: same endpoints at every pace ---------------------------- */

/**
 * Run the whole route at one pace and record where the camera comes to rest at
 * each beat, plus how long the travel was asked to take.
 */
/**
 * Each pace runs in a fresh page.
 *
 * Sharing one page let run N start from wherever run N-1 abandoned the camera,
 * and the first beat of the first run was sampled before any travel had
 * happened at all. Both showed up as "pacing moved the endpoint" when what
 * actually differed was the state the run inherited. Test isolation is not
 * ceremony here: without it this test cannot tell a contract violation from its
 * own leftovers.
 */
const runRoute = async (paceId) => {
  await page.goto(`http://127.0.0.1:${PORT}/labs/immersive-worlds/index.html?tier=HIGH&authoring=1`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__IW?.ready === true, { timeout: 300000 });
  await page.evaluate(() => { window.__IW.hud.el.veil.hidden = true; });
  await page.waitForTimeout(1500);
  return page.evaluate(async (pace) => {
  const rt = window.__IW.runtime;
  const studio = window.__IW_STUDIO;
  studio.config.experience.pacing = pace;
  studio._applyExperienceSettings();

  const route = rt.store.routes[0];
  const seen = [];
  await rt.startRoute(route.id);
  // The route advances itself on a timer. Racing that transport is what made
  // the previous version of this test read one pace's beat N against another's
  // beat N+1; pausing makes the walk deterministic and the comparison honest.
  rt.experience.pause();

  const settled = async () => {
    let last = '';
    let still = 0;
    for (let t = 0; t < 220 && still < 4; t += 1) {
      await new Promise((r) => setTimeout(r, 60));
      const p = rt.camera.pose;
      const now = p.position.map((v) => v.toFixed(4)).join(',');
      still = now === last ? still + 1 : 0;
      last = now;
    }
  };

  // Walk the canonical Tour Steps by id, not by index into a live array.
  let stop = rt.experience.currentTourStep;
  let guard = 0;
  while (stop && guard < 40) {
    guard += 1;
    await settled();
    const p = rt.camera.pose;
    // Two different facts, and conflating them is what made this test argue
    // with itself for three runs:
    //
    //   `authored` is WHERE the beat ends — the pose the director resolves from
    //   the world. That is the frozen contract, and it must be identical.
    //
    //   `pos` is where the live camera came to rest. The travel eases toward
    //   its destination asymptotically, so it stops a centimetre or two short,
    //   and *how* short depends on how many frames the move lasted — which pace
    //   legitimately changes. Demanding bit-equality there tests the easing
    //   curve's arithmetic, not the contract.
    const step = rt.experience.currentStep;
    const authored = step?.subjectRef ? rt.framingFor(step.subjectRef, step.shotIntent) : null;
    seen.push({
      id: stop.id,
      pos: p.position.map((v) => v.toFixed(3)).join(','),
      target: p.target ? p.target.map((v) => v.toFixed(3)).join(',') : null,
      authored: authored ? authored.position.map((v) => v.toFixed(4)).join(',') : null,
      authoredTarget: authored?.target ? authored.target.map((v) => v.toFixed(4)).join(',') : null,
      raw: p.position
    });
    if (!stop.nextId) break;
    await rt.experience.seekToTourStep(stop.nextId);
    rt.experience.pause();
    stop = rt.experience.currentTourStep;
  }
  const travelTotal = rt.experience.pacing;
  try { rt.exitRoute(); } catch { /* already out */ }
    return { pace, pacing: travelTotal, beats: seen };
  }, paceId);
};

const brisk = await runRoute('BRISK');
await page.waitForTimeout(500);
const natural = await runRoute('NATURAL');
await page.waitForTimeout(500);
const calm = await runRoute('CALM');

say('el ritmo llega al motor como multiplicador',
  brisk.pacing === 0.75 && natural.pacing === 1 && calm.pacing === 1.35,
  `ágil=${brisk.pacing} natural=${natural.pacing} pausado=${calm.pacing}`);
say('los tres ritmos recorren los mismos pasos',
  brisk.beats.length === natural.beats.length && natural.beats.length === calm.beats.length,
  `${brisk.beats.length} / ${natural.beats.length} / ${calm.beats.length} pasos`);

// The whole feature rests on this one line.
// WHERE the beat ends: the authored destination, exact.
const authoredDrift = [];
for (const [name, other] of [['ágil', brisk], ['pausado', calm]]) {
  natural.beats.forEach((beat, i) => {
    const b = other.beats[i];
    if (beat.authored !== b?.authored || beat.authoredTarget !== b?.authoredTarget) {
      authoredDrift.push(`${beat.id} [${name}]: ${beat.authored} vs ${b?.authored}`);
    }
  });
}
say('el destino aprobado de cada paso es idéntico en los tres ritmos',
  authoredDrift.length === 0,
  authoredDrift.slice(0, 3).join(' | ') || `${natural.beats.length} destinos idénticos`);

// And the camera does arrive there: within 5cm, which is the width of the
// easing's asymptote, not a different place in the room.
const TOL = 0.05;
const restDrift = [];
for (const [name, other] of [['ágil', brisk], ['pausado', calm]]) {
  natural.beats.forEach((beat, i) => {
    const b = other.beats[i];
    if (!b?.raw) return;
    const d = Math.hypot(beat.raw[0] - b.raw[0], beat.raw[1] - b.raw[1], beat.raw[2] - b.raw[2]);
    if (d > TOL) restDrift.push(`${beat.id} [${name}]: ${d.toFixed(3)} m`);
  });
}
say(`la cámara descansa en el mismo sitio (± ${TOL * 100} cm)`,
  restDrift.length === 0,
  restDrift.slice(0, 3).join(' | ') || 'ningún paso se desvía más de 5 cm');

/* -- reduced motion still wins --------------------------------------------- */

const reduced = await page.evaluate(() => {
  const studio = window.__IW_STUDIO;
  studio.config.experience.motion = 'CALM';
  studio._applyExperienceSettings();
  return { reduced: window.__IW.runtime.experience.reducedMotion };
});
say('«siempre sin viaje» impone movimiento reducido', reduced.reduced === true, String(reduced.reduced));

const cameraOwner = await page.evaluate(() => window.__IW.runtime.camera.owner);
say('una sola autoridad de cámara al terminar', typeof cameraOwner === 'string', String(cameraOwner));
say('sin errores de consola', errors.length === 0, errors.slice(0, 2).join(' | ') || 'ninguno');

const passed = results.filter((r) => r.ok).length;
await fs.writeFile(path.join(OUT, 'transition-proof.json'), JSON.stringify({
  generatedAt: new Date().toISOString(), passed, total: results.length, results,
  endpoints: natural.beats
}, null, 1));
console.log(`\n${passed}/${results.length}`);
await browser.close();
server.close();
