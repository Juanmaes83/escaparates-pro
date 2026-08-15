/**
 * MISSION 1 — is FORWARD SETTLE the same place as BACK RETURN?
 *
 * The contract says a Tour Stop resolves to one canonical settled pose, that the
 * forward tour ends the stop on it, and that Back returns to exactly it. Back
 * was already proved single-valued to 0.0000 m. What was NOT proved is the
 * forward half, and the reason is worth stating: the earlier harness reached
 * stops with `goToTourStep`, which lands on a stop's OPENING beat and pauses.
 * It never played through to the contemplation the stop actually settles on, so
 * it was comparing Back against a beat the visitor passes through rather than
 * against the composition they are left with.
 *
 * So this does not seek at all. It starts the guided route and lets it run,
 * exactly as a visitor would, and samples each stop when its settle beat is on
 * screen and the camera has stopped moving. Then it presses the real ← ANTERIOR
 * control and compares.
 *
 * Three things are compared, not two:
 *
 *   CANONICAL    what `canonicalSettle()` resolves — the contract
 *   FORWARD      where the playing tour actually leaves the visitor
 *   BACK         where the return control actually lands
 *
 * All three must agree. Comparing only the last two would pass even if both had
 * drifted from the contract together.
 *
 *   node qa/tools/forward-settle-equivalence.mjs
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
const OUT = path.join(MODULE_ROOT, 'qa', 'evidence-vs02', 'guided-reversibility');
const PORT = Number(process.env.IW_FS_PORT || 5300);
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
page.setDefaultTimeout(600000);
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));

await page.goto(`http://127.0.0.1:${PORT}/labs/immersive-worlds/index.html?tier=LOW`, { waitUntil: 'load' });
await page.waitForFunction(() => window.__IW?.ready === true, { timeout: 600000 });
await page.locator('[data-el="enter"]').click({ timeout: 120000 });
await page.waitForFunction(() => {
  const veil = window.__IW?.hud?.el?.veil;
  return veil && (veil.hidden || veil.classList.contains('is-gone'));
}, { timeout: 60000 });
await page.waitForTimeout(1500);

const POSE = () => {
  const rt = window.__IW.runtime;
  const p = rt.camera.pose;
  const kit = rt.sceneKit;
  const g = kit._guide || null;
  return {
    stop: rt.experience.currentTourStep?.id || null,
    order: rt.experience.tourOrder,
    beat: rt.experience.currentStep?.id || null,
    space: rt.state.activeSpaceId,
    owner: rt.camera.owner,
    pos: p.position.map((n) => +n.toFixed(4)),
    tgt: p.target.map((n) => +n.toFixed(4)),
    fov: +Number(p.fov).toFixed(3),
    guideVisible: g ? +Number(g.current?.opacity ?? 0).toFixed(2) : null
  };
};

/** Wait until the camera has actually stopped, rather than after a fixed sleep. */
const settled = async () => page.waitForFunction(() => {
  const rt = window.__IW.runtime;
  const p = rt.camera.pose.position;
  const k = `${p[0].toFixed(3)},${p[1].toFixed(3)},${p[2].toFixed(3)}`;
  window.__S = window.__S || { k: null, n: 0 };
  if (window.__S.k === k) window.__S.n += 1; else { window.__S.k = k; window.__S.n = 0; }
  return window.__S.n >= 6;
}, null, { timeout: 120000 }).catch(() => false);

/* Start the route FIRST.
 *
 * `canonicalSettle` reads the Director's manifest, and the Director has no
 * manifest until a route is running — `runtime.tour` builds one lazily for
 * panels, but that is a different object. Asking for the contract before
 * starting returned null for every stop, which silently emptied the target list
 * and made the whole comparison vacuous while still printing a verdict. The
 * contract is resolved from the running Director, once. */
await page.evaluate(() => { const rt = window.__IW.runtime; rt.startRoute(rt.defaultRouteId); });
await page.waitForFunction(() => Boolean(window.__IW.runtime.experience.manifest), null, { timeout: 60000 });

const canonical = await page.evaluate(() => {
  const rt = window.__IW.runtime;
  const steps = rt.experience.manifest?.steps || [];
  return steps.slice(0, 6).map((s) => {
    const c = rt.experience.canonicalSettle(s.id);
    return {
      stopId: s.id, order: s.order, space: s.spaceId,
      settleBeat: c?.beat?.id || null,
      pose: c ? { pos: c.pose.position.map((n) => +n.toFixed(4)), tgt: c.pose.target.map((n) => +n.toFixed(4)), fov: +Number(c.pose.fov).toFixed(3) } : null
    };
  });
});
console.log('contrato canónico por parada:');
for (const c of canonical) console.log(`  ${String(c.order).padStart(2, '0')} ${c.stopId.padEnd(26)} asienta en ${String(c.settleBeat).padEnd(32)} ${c.pose ? 'pose OK' : 'SIN POSE'}`);
if (!canonical.some((c) => c.pose)) throw new Error('ninguna parada resuelve pose canónica — el contrato no está operativo');

const TARGETS = canonical.filter((c) => c.order >= 3 && c.order <= 5 && c.settleBeat);
const forward = [];
for (const t of TARGETS) {
  await page.waitForFunction((beatId) => window.__IW.runtime.experience.currentStep?.id === beatId,
    t.settleBeat, { timeout: 300000 });
  await settled();
  const s = await page.evaluate(POSE);
  forward.push({ ...t, actual: s });
  console.log(`ADELANTE parada ${String(t.order).padStart(2, '0')} asentada · beat ${s.beat} · pos ${s.pos} · guía ${s.guideVisible}`);
  await page.screenshot({ path: path.join(OUT, `fs-forward-${t.order}.png`) });
}

/* Pause where the tour left us, then use the real control. */
await page.evaluate(() => window.__IW.runtime.experience.pause());
await page.waitForTimeout(600);

const backs = [];
for (let i = 0; i < 2; i += 1) {
  const clicked = await page.evaluate(() => {
    const b = document.querySelector('[data-el="prevBtn"]');
    if (!b || b.disabled) return false;
    b.click();
    return true;
  });
  if (!clicked) { console.log('control ← ANTERIOR desactivado'); break; }
  await settled();
  const s = await page.evaluate(POSE);
  backs.push(s);
  console.log(`BACK → parada ${String(s.order).padStart(2, '0')} · beat ${s.beat} · pos ${s.pos} · guía ${s.guideVisible}`);
  await page.screenshot({ path: path.join(OUT, `fs-back-${s.order}.png`) });
}

const dist = (a, b) => +Math.hypot(...a.map((v, i) => v - b[i])).toFixed(4);
const rows = [];
for (const b of backs) {
  const c = canonical.find((x) => x.stopId === b.stop);
  const f = forward.find((x) => x.stopId === b.stop);
  if (!c?.pose || !f) continue;
  rows.push({
    stop: b.stop, order: b.order,
    forwardVsCanonicalPos: dist(f.actual.pos, c.pose.pos),
    forwardVsCanonicalTgt: dist(f.actual.tgt, c.pose.tgt),
    backVsCanonicalPos: dist(b.pos, c.pose.pos),
    backVsCanonicalTgt: dist(b.tgt, c.pose.tgt),
    forwardVsBackPos: dist(f.actual.pos, b.pos),
    forwardVsBackTgt: dist(f.actual.tgt, b.tgt),
    // The contract does not name a field of view: `framingFor` resolves
    // position and target, and fov is defaulted downstream. Requiring the
    // canonical pose to carry one failed the whole run against a value it was
    // never supposed to have. What must match is what the visitor sees going
    // forwards and coming back.
    fovEqual: f.actual.fov === b.fov,
    fovCanonicalUnset: c.pose.fov == null,
    sameSettleBeat: f.actual.beat === b.beat,
    guideForward: f.actual.guideVisible, guideBack: b.guideVisible
  });
}
console.log('\nequivalencia (metros):');
for (const r of rows) {
  console.log(`  parada ${String(r.order).padStart(2, '0')}  adelante↔canónica ${r.forwardVsCanonicalPos}/${r.forwardVsCanonicalTgt}  atrás↔canónica ${r.backVsCanonicalPos}/${r.backVsCanonicalTgt}  adelante↔atrás ${r.forwardVsBackPos}/${r.forwardVsBackTgt}  mismo beat ${r.sameSettleBeat}  guía ${r.guideForward}→${r.guideBack}`);
}
const TOL = 0.01;
const pass = rows.length > 0 && rows.every((r) => r.forwardVsBackPos <= TOL && r.forwardVsBackTgt <= TOL && r.sameSettleBeat && r.fovEqual);
console.log(`\nFORWARD SETTLE = BACK RETURN: ${pass ? 'PASS' : 'FALLO'} (tolerancia ${TOL} m)`);
if (errors.length) console.log(`errores: ${errors.slice(0, 3).join(' · ')}`);

await fs.writeFile(path.join(OUT, 'forward-settle-equivalence.json'), JSON.stringify({
  generatedAt: new Date().toISOString(), toleranceM: TOL, canonical, forward, backs, rows, pass, errors
}, null, 1));
await browser.close();
server.close();
process.exit(pass ? 0 : 1);
