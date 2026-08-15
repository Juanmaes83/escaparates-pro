/**
 * G1B — what a backward step actually costs, and whether the destination
 * contract survives it.
 *
 * The previous audit established that backward destination selection exists and
 * that it is implemented by restarting the route and replaying forward. Landing
 * correctly was never in doubt after that. The open question is whether the
 * replay is an implementation detail a visitor would never notice, or a visible
 * defect — and that is not answerable by asserting the endpoint, because the
 * endpoint is correct either way.
 *
 * So every navigation here is measured for what the visitor would live through:
 *
 *   beats replayed        each one is a shot the visitor already saw
 *   portals traversed     each one is a doorway crossed again
 *   rooms entered         re-entering the room you stand in is the tell
 *   guide stagings        the guide walking the same walk twice
 *   camera travel         metres actually flown
 *   elapsed               wall time the visitor waits
 *
 * ENDPOINT CORRECT and EXPERIENCE CORRECT are reported as two separate verdicts,
 * because this mission exists precisely because the first does not imply the
 * second.
 *
 * The static-framing comparison samples both arrivals after an identical settle,
 * so a LEAD beat whose framing tracks a walking guide is compared at the same
 * point in its choreography rather than at two different animation phases — the
 * earlier 6 cm delta was that, not a contract breach, and this is what tells the
 * two apart.
 *
 *   node qa/tools/guided-replay-cost.mjs
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
const PORT = Number(process.env.IW_COST_PORT || 5290);
const SETTLE = 3200;
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

/* Counters for everything a visitor would live through, plus camera distance
   accumulated on the frame loop rather than inferred from endpoints. */
await page.evaluate(() => {
  const rt = window.__IW.runtime;
  const C = { beats: [], portals: [], spaces: [], guides: 0, travel: 0 };
  window.__C = C;
  rt.bus.on('route:step', (e) => C.beats.push(e.stepId));
  rt.bus.on('portal:entered', (e) => { if (e.phase !== 'LANDED') C.portals.push(e.portalId); });
  rt.bus.on('space:entered', (e) => C.spaces.push(e.spaceId));
  const stage = rt.stageGuide.bind(rt);
  rt.stageGuide = (s) => { if (s) C.guides += 1; return stage(s); };
  let last = null;
  const tick = () => {
    const p = rt.camera.pose.position;
    if (last) C.travel += Math.hypot(p[0] - last[0], p[1] - last[1], p[2] - last[2]);
    last = [...p];
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  C.reset = () => { C.beats = []; C.portals = []; C.spaces = []; C.guides = 0; C.travel = 0; };
});

const tour = await page.evaluate(() => (window.__IW.runtime.tour?.steps || [])
  .map((s) => ({ id: s.id, order: s.order, title: s.title || s.caption || '', space: s.spaceId || null })));
console.log('paradas canónicas:');
for (const s of tour) console.log(`  ${String(s.order).padStart(2, '0')} ${s.id.padEnd(26)} ${s.space || ''}  ${s.title}`);

const SNAP = () => {
  const rt = window.__IW.runtime;
  const pose = rt.camera.pose;
  const kit = rt.sceneKit;
  const g = kit._guide || null;
  return {
    stop: rt.experience.currentTourStep?.id || null,
    order: rt.experience.tourOrder,
    space: rt.state.activeSpaceId,
    owner: rt.camera.owner,
    transport: rt.experience.transport,
    pos: pose.position.map((n) => +n.toFixed(3)),
    tgt: pose.target.map((n) => +n.toFixed(3)),
    fov: +Number(pose.fov).toFixed(2),
    guide: g ? {
      visible: +Number(g.current?.opacity ?? 0).toFixed(2),
      at: (g.current?.position || g.target?.position || []).map((n) => +Number(n).toFixed(2))
    } : null,
    counters: {
      beats: window.__C.beats.length, portals: window.__C.portals.length,
      rooms: window.__C.spaces.length, guides: window.__C.guides,
      travel: +window.__C.travel.toFixed(1)
    }
  };
};

/** The visitor's own Back control, measured with the same counters. */
const back = async (label) => {
  await page.evaluate(() => window.__C.reset());
  const t0 = Date.now();
  const performed = await page.evaluate(() => {
    const btn = document.querySelector('[data-el="prevBtn"]');
    if (!btn || btn.disabled) return { clicked: false, disabled: Boolean(btn?.disabled) };
    btn.click();
    return { clicked: true, disabled: false };
  });
  await page.waitForTimeout(SETTLE);
  const s = await page.evaluate(SNAP);
  const row = { label, via: 'prevBtn', ...performed, ms: Date.now() - t0, ...s };
  console.log(`${label.padEnd(34)} → ${String(s.order).padStart(2, '0')} ${String(s.space).padEnd(16)} beats ${String(s.counters.beats).padStart(2)} · portales ${s.counters.portals} · salas ${s.counters.rooms} · guía ${s.counters.guides} · ${s.counters.travel} m · ${row.ms} ms${performed.clicked ? '' : ' · CONTROL DESACTIVADO'}`);
  return row;
};

/** Navigate through the runtime's one door, measuring what it costs. */
const nav = async (stopId, label) => {
  await page.evaluate(() => window.__C.reset());
  const t0 = Date.now();
  await page.evaluate((id) => window.__IW.runtime.goToTourStep(id), stopId);
  await page.waitForTimeout(SETTLE);
  const s = await page.evaluate(SNAP);
  const row = { label, stopId, ms: Date.now() - t0, ...s };
  console.log(`${label.padEnd(34)} → ${String(s.order).padStart(2, '0')} ${String(s.space).padEnd(16)} beats ${String(s.counters.beats).padStart(2)} · portales ${s.counters.portals} · salas ${s.counters.rooms} · guía ${s.counters.guides} · ${s.counters.travel} m · ${row.ms} ms`);
  return row;
};

await page.evaluate(() => { const rt = window.__IW.runtime; rt.startRoute(rt.defaultRouteId); });
await page.waitForTimeout(2500);

const rows = [];
const S = (n) => tour[n - 1];

/* The visitor's Back, against the same forward reference as before. */
rows.push(await nav(S(3).id, 'preparar · parada 3'));
rows.push(await nav(S(4).id, 'ADELANTE 3→4 (referencia)'));
rows.push(await back('BACK 4→3 (control real)'));
rows.push(await nav(S(4).id, 'ADELANTE otra vez 3→4'));
rows.push(await nav(S(5).id, 'ADELANTE 4→5'));
rows.push(await back('BACK 5→4 (control real)'));
rows.push(await back('BACK 4→3 (segunda vez)'));
rows.push(await nav(S(4).id, 'ADELANTE tras dos BACK'));
/* First stop: the control must refuse rather than replay. */
rows.push(await nav(S(1).id, 'preparar · parada 1'));
rows.push(await back('BACK en la primera parada'));
/* Cross-room: the control must refuse, not silently replay the tour. */
rows.push(await nav(S(8).id, 'preparar · parada 8 (otra sala)'));
rows.push(await back('BACK entre salas'));

/* Static framing: same stop, reached forwards and backwards, both sampled after
   an identical settle so the guide's walk is finished in both. */
const fwdArrival = await nav(S(5).id, 'marco · llegada ADELANTE p5');
await nav(S(7).id, 'marco · avanzar a p7');
const backArrival = await nav(S(5).id, 'marco · llegada ATRÁS p5');

const d = (a, b) => a.map((v, i) => +(v - b[i]).toFixed(3));
const mag = (v) => +Math.hypot(...v).toFixed(3);
const framing = {
  stop: S(5).id,
  forward: { pos: fwdArrival.pos, tgt: fwdArrival.tgt, fov: fwdArrival.fov },
  backward: { pos: backArrival.pos, tgt: backArrival.tgt, fov: backArrival.fov },
  deltaPosM: mag(d(backArrival.pos, fwdArrival.pos)),
  deltaTgtM: mag(d(backArrival.tgt, fwdArrival.tgt)),
  fovEqual: fwdArrival.fov === backArrival.fov,
  sameSpace: fwdArrival.space === backArrival.space
};

const ref = rows.find((r) => r.label.startsWith('ADELANTE 3→4 (ref'));
const b1 = rows.find((r) => r.label.startsWith('BACK 4→3 (control'));
const b2 = rows.find((r) => r.label.startsWith('BACK 5→4'));
const b3 = rows.find((r) => r.label.startsWith('BACK 4→3 (segunda'));
const firstStop = rows.find((r) => r.label.startsWith('BACK en la primera'));
const crossRoom = rows.find((r) => r.label.startsWith('BACK entre salas'));
const verdicts = {
  backLandsOnPreviousStop: b1.order === 3 && b2.order === 4 && b3.order === 3,
  // The whole point: a same-room Back must cost no doorway and no room entry.
  backPortals: [b1, b2, b3].map((r) => r.counters.portals),
  backRoomEntries: [b1, b2, b3].map((r) => r.counters.rooms),
  backBeats: [b1, b2, b3].map((r) => r.counters.beats),
  forwardReferencePortals: ref.counters.portals,
  forwardReferenceBeats: ref.counters.beats,
  repeatedBackWorks: b2.clicked && b3.clicked && b3.order === 3,
  forwardAfterBackWorks: rows.some((r) => r.label.startsWith('ADELANTE tras dos BACK') && r.order === 4),
  firstStopControlDisabled: firstStop.clicked === false && firstStop.disabled === true,
  crossRoomControlDisabled: crossRoom.clicked === false && crossRoom.disabled === true,
  framing
};
console.log(`\n${JSON.stringify(verdicts, null, 1)}`);
if (errors.length) console.log(`errores: ${errors.slice(0, 3).join(' · ')}`);

await fs.writeFile(path.join(OUT, 'guided-replay-cost.json'), JSON.stringify({
  generatedAt: new Date().toISOString(), settleMs: SETTLE, tour, rows, verdicts, errors
}, null, 1));
await browser.close();
server.close();
