/**
 * G1B — can the guided experience go back, and at what cost?
 *
 * Human QA reports that a visitor at artwork 4 has no way back to artwork 3.
 * Source reading says the capability exists: `seekToTourStep()` accepts any
 * canonical stop and, when the target is behind the current position, restarts
 * the route and replays forward to it. Reading is not evidence, and "it works"
 * is not the only question worth asking — HOW it works decides whether it is
 * usable as a Back control.
 *
 * So this drives the real Director through the real route and measures three
 * things about going back one stop:
 *
 *   does it land          — is the destination stop actually reached
 *   does it match         — is the framing identical to the first visit
 *   what does it cost     — wall time, and whether portals are re-traversed
 *
 * The third is the one that decides the product answer. A Back control that
 * silently replays the tour from its beginning is destination-correct and
 * experience-wrong, and that difference is invisible to any assertion that only
 * checks where the camera ended up.
 *
 *   node qa/tools/guided-reversibility-audit.mjs
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
const PORT = Number(process.env.IW_REV_PORT || 5280);
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
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));

await page.goto(`http://127.0.0.1:${PORT}/labs/immersive-worlds/index.html?tier=LOW`, { waitUntil: 'load' });
await page.waitForFunction(() => window.__IW?.ready === true, { timeout: 300000 });
await page.locator('[data-el="enter"]').click({ timeout: 120000 });
await page.waitForFunction(() => {
  const veil = window.__IW?.hud?.el?.veil;
  return veil && (veil.hidden || veil.classList.contains('is-gone'));
}, { timeout: 60000 });
await page.waitForTimeout(1500);

/* Count portal traversals across the whole run: the cost signal. */
await page.evaluate(() => {
  window.__REV = { portals: [], spaces: [] };
  const rt = window.__IW.runtime;
  rt.bus.on('portal:entered', (e) => {
    if (e.phase !== 'LANDED') window.__REV.portals.push({ t: Math.round(performance.now()), portalId: e.portalId, spaceId: e.spaceId });
  });
  rt.bus.on('space:entered', (e) => window.__REV.spaces.push({ t: Math.round(performance.now()), spaceId: e.spaceId }));
});

/** The canonical stops, as the visitor would count them. */
// `runtime.tour` is the manifest, not an array — its `.steps` are the canonical
// stops. And the door is `goToTourStep`, described in the runtime as "one door
// for all three navigation intents, so the panel, the keyboard and a test
// cannot reach the tour by three different paths". A harness that used
// `seekToTourStep` directly would be taking the fourth path.
const tour = await page.evaluate(() => (window.__IW.runtime.tour?.steps || [])
  .map((s) => ({ id: s.id, order: s.order, title: s.title || s.caption || '' })));
console.log(`paradas canónicas: ${tour.length}`);
for (const s of tour.slice(0, 8)) console.log(`  ${String(s.order).padStart(2, '0')} ${s.id}  ${s.title}`);

const STATE = () => {
  const rt = window.__IW.runtime;
  const pose = rt.camera.pose;
  return {
    stop: rt.experience.currentTourStep?.id || null,
    order: rt.experience.tourOrder,
    beat: rt.experience.currentStep?.id || null,
    space: rt.state.activeSpaceId,
    owner: rt.camera.owner,
    transport: rt.experience.transport,
    pos: pose.position.map((n) => +n.toFixed(3)),
    tgt: pose.target.map((n) => +n.toFixed(3)),
    portals: window.__REV.portals.length
  };
};

/** Reach a stop through the runtime's own canonical entry point. */
const goTo = async (stopId) => {
  const t0 = Date.now();
  const ok = await page.evaluate((id) => window.__IW.runtime.goToTourStep(id), stopId);
  await page.waitForTimeout(1200);
  return { ok, ms: Date.now() - t0, state: await page.evaluate(STATE) };
};

await page.evaluate(() => { const rt = window.__IW.runtime; rt.startRoute(rt.defaultRouteId); });
await page.waitForTimeout(2500);

const log = [];
const say = (label, r) => {
  log.push({ label, ...r });
  const s = r.state;
  console.log(`${label.padEnd(30)} parada ${String(s.order).padStart(2, '0')} ${String(s.stop).padEnd(26)} sala ${String(s.space).padEnd(16)} portales ${s.portals} · ${r.ms} ms`);
};

// Same-room pair: stops 3 and 4 are both artworks inside Gallery A.
const s3 = tour[2]; const s4 = tour[3]; const s5 = tour[4];
const first3 = await goTo(s3.id); say(`ida · parada ${s3.order}`, first3);
const first4 = await goTo(s4.id); say(`ida · parada ${s4.order}`, first4);
const back3 = await goTo(s3.id); say(`ATRÁS · parada ${s3.order}`, back3);

// Multi-stop: forward to 5, then back twice.
const first5 = await goTo(s5.id); say(`ida · parada ${s5.order}`, first5);
const back4b = await goTo(s4.id); say(`ATRÁS · parada ${s4.order}`, back4b);
const back3b = await goTo(s3.id); say(`ATRÁS · parada ${s3.order}`, back3b);

// Forward again after going back — state corruption check.
const fwd4 = await goTo(s4.id); say(`adelante otra vez · ${s4.order}`, fwd4);

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const findings = {
  landsOnTarget: back3.state.stop === s3.id && back3.ok,
  framingIdentical: same(first3.state.pos, back3.state.pos) && same(first3.state.tgt, back3.state.tgt),
  multiBackWorks: back4b.state.stop === s4.id && back3b.state.stop === s3.id,
  forwardAfterBackWorks: fwd4.state.stop === s4.id,
  cameraOwnerAfterBack: back3.state.owner,
  transportAfterBack: back3.state.transport,
  // The cost. A back step that re-crosses portals is replaying the route.
  portalsBeforeBack: first4.state.portals,
  portalsAfterBack: back3.state.portals,
  portalsReTraversedByOneBackStep: back3.state.portals - first4.state.portals,
  backStepMs: back3.ms,
  forwardStepMs: first4.ms
};
console.log(`\n${JSON.stringify(findings, null, 1)}`);
if (errors.length) console.log(`errores: ${errors.slice(0, 3).join(' · ')}`);

await fs.writeFile(path.join(OUT, 'guided-reversibility.json'), JSON.stringify({
  generatedAt: new Date().toISOString(), tour, log, findings, errors
}, null, 1));
await browser.close();
server.close();
