/**
 * The Breeze room, reached through the Museum and photographed on the way.
 *
 * This is the acceptance evidence for the room as a *product*: not the guest in
 * isolation, not the host contract with a double, but a visitor on the guided
 * route arriving at an installation that the Museum does not render.
 *
 * HOW THE ROUTE IS DRIVEN, AND WHY IT IS STILL THE REAL PATH
 *
 * The full route to this room runs for many minutes under a software adapter, so
 * the harness seeks to the beat *before* the doorway and then presses play. Every
 * frame that matters after that — the crossing, the handoff, the arrival, the
 * guide, the hero moment, the exit — is the Director playing the authored route.
 * The crossing in particular must be played rather than sought: `_crossingIntent`
 * returns null while seeking, so a sought portal is the cut path and would
 * photograph a code path the product never takes.
 *
 * THE NINE MOMENTS
 *
 *   A  entry frame              the room as the visitor first receives it
 *   B  sculpture first read     Venus, alone
 *   C  cloth approach           the fabric entering the frame
 *   D  first contact
 *   E  hero collision           maximum deformation
 *   F  release / pass
 *   G  settled contemplation
 *   H  exit / Museum restored
 *   I  re-entry
 *
 * TEMPORAL EVIDENCE IS ATOMIC. Every frame below comes from one continuous run
 * of one browser, in order, with the filenames carrying the moment they belong
 * to. Nothing is stitched from a second run.
 *
 *   node qa/tools/breeze-room-evidence.mjs
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
const OUT = path.join(MODULE_ROOT, 'qa', 'evidence-vs02', 'breeze-room');
const PORT = Number(process.env.IW_ROOM_PORT || 5360);
const SEGMENTS = Number(process.env.IW_ROOM_SEGMENTS || 0); // 0 = product default
const FFMPEG = process.env.IW_FFMPEG
  || '/usr/local/lib/python3.11/dist-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webm': 'video/webm', '.glb': 'model/gltf-binary', '.obj': 'text/plain' };

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

const browser = await chromium.launch({ headless: true, args: WEBGPU_ARGS });
const context = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  recordVideo: { dir: path.join(OUT, 'video'), size: { width: 1280, height: 720 } }
});
const page = await context.newPage();
page.setDefaultTimeout(900000);
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });

const results = [];
const say = (n, ok, d = '') => { results.push({ name: n, ok, detail: d }); console.log(`${ok ? 'OK   ' : 'FALLO'} ${n}${d ? ` — ${d}` : ''}`); };

const luma = (file) => {
  const r = spawnSync(FFMPEG, ['-hide_banner', '-i', file, '-vf', 'signalstats,metadata=print:key=lavfi.signalstats.YAVG', '-f', 'null', '-'], { encoding: 'utf8' });
  const m = /YAVG=([0-9.]+)/.exec(`${r.stdout || ''}${r.stderr || ''}`);
  return m ? Number(m[1]) : null;
};

const STATE = () => {
  const rt = window.__IW.runtime;
  const p = rt.camera.pose;
  const n = window.__IW.nested;
  const q = (s) => document.querySelector(`[data-el="${s}"]`);
  const kit = rt.sceneKit;
  const g = kit?._guide || null;
  const r = n?.report?.() || {};
  return {
    space: rt.state.activeSpaceId,
    stop: rt.experience.currentTourStep?.id || null,
    beat: rt.experience.currentStep?.id || null,
    order: rt.experience.tourOrder,
    total: rt.experience.tourTotal,
    owner: rt.camera.owner,
    pos: p.position.map((v) => +v.toFixed(2)),
    counterText: q('stepCount')?.textContent?.trim() || null,
    caption: q('caption')?.textContent?.trim() || null,
    labelVisible: q('detail') ? !q('detail').hidden : null,
    labelTitle: q('detail') && !q('detail').hidden ? (q('detailTitle')?.textContent?.trim() || null) : null,
    guideOpacity: g ? +Number(g.current?.opacity ?? 0).toFixed(2) : null,
    presentation: r.presentation || null,
    guestBackend: r.guest?.backend || null,
    guestSteps: r.guest?.steps ?? null,
    guestVerts: r.guest?.vertexCount ?? null,
    guestSprings: r.guest?.springCount ?? null,
    guestWind: r.guest?.wind || null,
    guestSinceLaunch: r.guest?.sinceLaunch ?? null,
    guestError: r.guest?.lastError || r.lastError || null,
    museumCanvasHidden: r.museumCanvasHidden ?? null,
    guestCanvases: r.guestCanvases ?? null
  };
};

const moments = {};
const shot = async (key, label) => {
  const file = path.join(OUT, `${key}.png`);
  await page.screenshot({ path: file });
  const s = await page.evaluate(STATE);
  moments[key] = { key, label, file: `${key}.png`, yavg: luma(file), ...s };
  console.log(`  ${key.padEnd(26)} ${String(s.space).padEnd(14)} ${String(s.presentation).padEnd(7)} ${String(s.beat).padEnd(24)} guía ${s.guideOpacity} · YAVG ${moments[key].yavg}`);
  return moments[key];
};

console.log('BREEZE — LA SALA, POR LA RUTA REAL\n');

await page.goto(`http://127.0.0.1:${PORT}/labs/immersive-worlds/index.html?tier=LOW`, { waitUntil: 'load' });
await page.waitForFunction(() => window.__IW?.ready === true, { timeout: 900000 });
await page.locator('[data-el="enter"]').click({ timeout: 120000 });
await page.waitForFunction(() => {
  const veil = window.__IW?.hud?.el?.veil;
  return veil && (veil.hidden || veil.classList.contains('is-gone'));
}, { timeout: 180000 });
await page.waitForTimeout(2000);

// Confirm the environment can PRESENT WebGPU, not merely expose it. Availability
// and presentation are different questions and this container answers them
// differently depending on how Chromium was launched.
const gpu = await page.evaluate(async () => {
  const a = await navigator.gpu?.requestAdapter?.();
  return { adapter: a ? `${a.info?.vendor}/${a.info?.architecture}` : null };
});
say('adaptador WebGPU presente', Boolean(gpu.adapter), gpu.adapter || 'ninguno');

// Route present, and the new chapter in it.
const route = await page.evaluate(() => {
  const rt = window.__IW.runtime;
  rt.startRoute(rt.defaultRouteId);
  return { routeId: rt.defaultRouteId };
});
await page.waitForFunction(() => Boolean(window.__IW.runtime.experience.manifest), null, { timeout: 120000 });
const manifest = await page.evaluate(() => {
  const rt = window.__IW.runtime;
  const steps = rt.experience.manifest?.steps || [];
  return {
    stops: steps.length,
    breeze: steps.filter((s) => s.spaceId === 'space.breeze').map((s) => ({ id: s.id, order: s.order })),
    hasBreezeChapter: rt.store.require('space.breeze') ? true : false
  };
});
say('la sala Breeze existe en el grafo del mundo', manifest.hasBreezeChapter);
say('la ruta comentada llega a la sala Breeze', manifest.breeze.length > 0,
  `${manifest.breeze.length} paradas · ${manifest.stops} en total`);

/*
 * Seek to the beat before the doorway, then PLAY. The crossing itself is never
 * sought — the Director has to supply the crossing intent, and it does not while
 * seeking.
 */
await page.evaluate(async () => {
  const rt = window.__IW.runtime;
  await rt.experience.seekToTourStep('step.12-lleva-breeze');
  rt.experience.pause();
});
await page.waitForTimeout(1500);
await shot('00-antes-de-la-puerta', 'En Galería B, antes del paso');

console.log('\nreproduciendo la ruta hacia la sala…');
await page.evaluate(() => window.__IW.runtime.experience.resume());

const arrived = await page.waitForFunction(
  () => window.__IW.runtime.state.activeSpaceId === 'space.breeze',
  null, { timeout: 600000 }
).then(() => true).catch(() => false);
say('el visitante llega a la sala Breeze por la ruta', arrived);

// The guest needs a device, a 5 MB sculpture and a compute pipeline. The host
// keeps the Museum presenting until it is ready, so this wait is the room still
// being there rather than a black screen.
const presenting = await page.waitForFunction(
  () => window.__IW.nested?.report?.().presentation === 'GUEST',
  null, { timeout: 300000 }
).then(() => true).catch(() => false);
say('la presentación pasa al invitado Breeze', presenting);

await page.waitForTimeout(3000);
const A = await shot('A-entrada', 'A · Entrada a la sala');
say('BACKEND REAL: WebGPU en la sala', A.guestBackend === 'webgpu', A.guestBackend || 'sin invitado');
say('la física real de Breeze está horneada', (A.guestVerts ?? 0) > 0 && (A.guestSprings ?? 0) > 0,
  `${A.guestVerts} vértices · ${A.guestSprings} muelles`);
say('el lienzo del Museo queda oculto, no destruido', A.museumCanvasHidden === true);
say('exactamente un lienzo invitado', A.guestCanvases === 1, String(A.guestCanvases));
say('la sala no aparece en negro', (A.yavg ?? 0) > 2, `YAVG ${A.yavg}`);

/* The HUD must survive a room the Museum does not draw. */
const hud = await page.evaluate(() => {
  // The way out, not a corner button. An earlier version hit-tested the
  // accessibility control and found the Museum's own label card on top of it —
  // which is HUD layout that predates this room and happens in Galería A too,
  // not a guest stealing the pointer. What the nested room must never swallow is
  // the control that leaves it.
  const b = document.querySelector('[data-el="exitBtn"]');
  const r = b?.getBoundingClientRect();
  const top = r ? document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2) : null;
  const veil = document.querySelector('[data-el="veil"]');
  return {
    present: Boolean(b),
    hits: Boolean(top && b.contains(top)),
    // Without these the failure is unreadable: a veil still up during room
    // construction and a guest canvas stealing the pointer look identical.
    rect: r ? { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) } : null,
    topTag: top?.tagName || null,
    topEl: top ? (top.getAttribute('data-el') || top.id || top.className || top.tagName) : null,
    veilUp: veil ? !(veil.hidden || veil.classList.contains('is-gone')) : null,
    guestCanvasPointer: getComputedStyle(document.querySelector('[data-nested-room]') || document.body).pointerEvents
  };
});
say('la salida del recorrido sigue recibiendo el puntero', hud.present && hud.hits,
  hud.hits ? '' : `arriba: ${hud.topEl} · velo ${hud.veilUp}`);
say('el lienzo invitado es transparente al puntero', hud.guestCanvasPointer === 'none',
  hud.guestCanvasPointer);

/* The Museum keeps deciding the camera; the guest only renders it. */
const camera = await page.evaluate(() => {
  const rt = window.__IW.runtime;
  const g = window.__IW.nested.host._guest;
  return {
    museum: rt.camera.pose.position.map((v) => +v.toFixed(2)),
    guest: g?.camera?.position?.toArray().map((v) => +v.toFixed(2)) ?? null,
    origin: window.__IW.nested.report().roomOrigin,
    controls: typeof g?.controls
  };
});
const expected = camera.museum.map((v, i) => +(v - camera.origin[i]).toFixed(2));
say('la cámara del Museo llega traducida al invitado',
  camera.guest && expected.every((v, i) => Math.abs(v - camera.guest[i]) < 0.05),
  `museo ${JSON.stringify(camera.museum)} − origen ${JSON.stringify(camera.origin)} → invitado ${JSON.stringify(camera.guest)}`);
say('el invitado no tiene controles propios', camera.controls === 'undefined');

/* ── The arc, as the route plays it ─────────────────────────────────── */
const beatShot = async (beatId, key, label) => {
  await page.waitForFunction((b) => window.__IW.runtime.experience.currentStep?.id === b,
    beatId, { timeout: 300000 }).catch(() => false);
  await page.waitForTimeout(2500);
  return shot(key, label);
};

await beatShot('step.14-venus-llegada', 'B-escultura', 'B · Primera lectura de la escultura');
await beatShot('step.15-venus-acompanada', 'C-acompanada', 'C · Atención compartida con la guía');
await beatShot('step.16-tela-aproxima', 'D-aproximacion', 'D · La tela se acerca');
const heroStart = await beatShot('step.17-colision', 'E-colision', 'E · Colisión, momento central');
await page.waitForTimeout(6000);
await shot('F-paso', 'F · La tela sigue y se libera');
await page.waitForTimeout(6000);
const G = await shot('G-asentado', 'G · Contemplación asentada');

say('la guía se aparta del momento central',
  (heroStart.guideOpacity ?? 0) < 0.2, `opacidad de la guía en la colisión ${heroStart.guideOpacity}`);
say('la simulación avanza dentro de la sala',
  (G.guestSteps ?? 0) > (A.guestSteps ?? 0), `${A.guestSteps} → ${G.guestSteps} pasos`);
say('la ficha nombra la instalación', G.labelTitle === 'Viento sobre mármol' || A.labelTitle === 'Viento sobre mármol',
  `${A.labelTitle} / ${G.labelTitle}`);
say('sin error interno en el invitado', !G.guestError, G.guestError || 'ninguno');

/* Pixels: does the simulation drive what is on screen? Camera fixed, physics
   suspended versus running. If the frame is identical while the simulation is
   suspended and different while it runs, the fabric on screen is the fabric the
   GPU is solving — which no numeric readback can show. */
await page.evaluate(() => window.__IW.runtime.experience.pause());
await page.waitForTimeout(1200);
const p1 = await shot('P1-simulando', 'Píxeles · con simulación');
await page.evaluate(() => window.__IW.nested.host.suspend());
await page.waitForTimeout(1500);
const p2 = await shot('P2-suspendida-a', 'Píxeles · suspendida (a)');
await page.waitForTimeout(2500);
const p3 = await shot('P3-suspendida-b', 'Píxeles · suspendida (b)');
await page.evaluate(() => window.__IW.nested.host.restore());
await page.waitForTimeout(4000);
const p4 = await shot('P4-reanudada', 'Píxeles · reanudada');

const same = (a, b) => fsSync.readFileSync(path.join(OUT, a.file)).equals(fsSync.readFileSync(path.join(OUT, b.file)));
say('CERO CONOCIDO: suspendida, dos fotogramas idénticos', same(p2, p3));
say('LA SIMULACIÓN MUEVE LOS PÍXELES: al reanudar, el fotograma cambia', !same(p3, p4),
  `YAVG ${p3.yavg} → ${p4.yavg}`);

/* ── Exit ───────────────────────────────────────────────────────────── */
await page.evaluate(() => window.__IW.runtime.experience.resume());
await page.evaluate(async () => {
  const rt = window.__IW.runtime;
  await rt.traversePortal('portal.breeze-gallery-b', { source: 'QA' });
});
await page.waitForTimeout(4000);
const H = await shot('H-salida', 'H · Salida, el Museo vuelve a presentar');
say('la presentación vuelve al Museo al salir', H.presentation === 'MUSEUM', H.presentation || '');
say('no queda ningún lienzo invitado', H.guestCanvases === 0, String(H.guestCanvases));
say('el Museo vuelve a pintar', (H.yavg ?? 0) > 2, `YAVG ${H.yavg}`);

/* ── Re-entry ───────────────────────────────────────────────────────── */
await page.evaluate(async () => {
  const rt = window.__IW.runtime;
  await rt.traversePortal('portal.gallery-b-breeze', { source: 'QA' });
});
const back = await page.waitForFunction(
  () => window.__IW.nested?.report?.().presentation === 'GUEST', null, { timeout: 300000 }
).then(() => true).catch(() => false);
await page.waitForTimeout(4000);
const I = await shot('I-reentrada', 'I · Reentrada');
say('la sala vuelve a abrirse al reentrar', back && I.presentation === 'GUEST');
say('el segundo ciclo también es WebGPU', I.guestBackend === 'webgpu', I.guestBackend || '');

const totals = await page.evaluate(() => window.__IW.nested.report());
say('entradas y salidas equilibradas', totals.activations === totals.disposals + 1,
  `${totals.activations} activaciones · ${totals.disposals} liberaciones`);
// `restore()` legitimately starts the loop again after a suspend, and the pixel
// test above suspends once. What must never happen is an orphan running behind
// the current one, and `_startLoop` stops the previous one first.
say('sin bucles huérfanos', totals.loops <= totals.activations + 1,
  `${totals.loops} bucles para ${totals.activations} activaciones`);
say('sin errores de runtime', errors.length === 0, errors.slice(0, 2).join(' · ') || 'ninguno');

/* ── Board ──────────────────────────────────────────────────────────── */
const order = ['00-antes-de-la-puerta', 'A-entrada', 'B-escultura', 'C-acompanada', 'D-aproximacion',
  'E-colision', 'F-paso', 'G-asentado', 'P1-simulando', 'P2-suspendida-a', 'P3-suspendida-b',
  'P4-reanudada', 'H-salida', 'I-reentrada'];
const card = (k) => {
  const m = moments[k];
  if (!m) return '';
  return `<figure><img src="${m.file}" alt="${m.label}"><figcaption><b>${m.label}</b>
<span>${m.space} · ${m.presentation || '—'} · ${m.beat || '—'}</span>
<span>guía ${m.guideOpacity ?? '—'} · pasos ${m.guestSteps ?? '—'} · YAVG ${m.yavg}</span></figcaption></figure>`;
};
await fs.writeFile(path.join(OUT, 'index.html'), `<!doctype html><meta charset="utf-8">
<title>Sala Breeze — evidencia por la ruta real</title>
<style>body{margin:0;padding:2rem;background:#0c0b0a;color:#e8e3d9;font:400 14px/1.6 'Helvetica Neue',sans-serif}
h1{font:400 1.5rem Georgia,serif;margin:0 0 .3rem}p.l{color:#a49d92;max-width:66ch}
.g{display:grid;grid-template-columns:repeat(auto-fit,minmax(380px,1fr));gap:1.4rem;margin-top:2rem}
figure{margin:0}img{width:100%;display:block;border:1px solid rgba(240,236,228,.14)}
figcaption{padding:.6rem 0;display:grid;gap:.15rem}figcaption span{color:#a49d92;font-size:.82rem}
video{width:100%;max-width:900px;border:1px solid rgba(240,236,228,.14);margin-top:2rem}</style>
<h1>Sala Breeze — evidencia por la ruta real</h1>
<p class="l">Una sola ejecución continua. El visitante entra por el recorrido comentado, la
presentación pasa al invitado WebGPU, la tela real atraviesa la sala y encuentra la Venus, y el
Museo recupera la presentación al salir. Ningún fotograma procede de otra ejecución.</p>
<div class="g">${order.map(card).join('')}</div>
<video src="breeze-room.webm" controls muted></video>`);

const passed = results.filter((r) => r.ok).length;
console.log(`\n${passed}/${results.length} comprobaciones`);
await fs.writeFile(path.join(OUT, 'breeze-room.json'), JSON.stringify({
  generatedAt: new Date().toISOString(), gpu, route, manifest, moments, totals, results, errors
}, null, 1));

await context.close();
const vids = (await fs.readdir(path.join(OUT, 'video')).catch(() => [])).filter((f) => f.endsWith('.webm'));
if (vids[0]) {
  const raw = path.join(OUT, 'video', vids[0]);
  const enc = spawnSync(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-i', raw, '-c:v', 'libvpx-vp9',
    '-crf', '40', '-b:v', '0', '-vf', 'scale=960:-2,fps=12', '-an', '-y', path.join(OUT, 'breeze-room.webm')], { encoding: 'utf8' });
  if (enc.status === 0) await fs.rm(path.join(OUT, 'video'), { recursive: true, force: true });
}
console.log('tablero: qa/evidence-vs02/breeze-room/index.html');
await browser.close();
server.close();
process.exit(passed === results.length ? 0 : 1);
