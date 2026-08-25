/**
 * VIDEO — the eleven things Juanma asked to see proven.
 *
 * The root cause was that a video whose MIME the operating system did not supply
 * was refused before it ever reached a decoder. Windows leaves `.webm` and
 * `.mp4` unregistered far more often than `.jpg`, which is exactly why images
 * worked and video did not. So the decisive fixture here is a real, playable
 * video handed over with `type: ''` — the file a Windows author actually picks.
 *
 * Nothing in this run overrides an autoplay policy. The previous trace did, and
 * therefore could not have found a playback failure of any kind.
 *
 *   node qa/tools/video-proof.mjs
 */
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MODULE_ROOT = path.resolve(HERE, '..', '..');
const REPO_ROOT = path.resolve(MODULE_ROOT, '../..');
const FIXTURES = path.join(MODULE_ROOT, 'qa', 'fixtures');
const OUT = path.join(MODULE_ROOT, 'qa', 'evidence-vs02', 'video');
const PORT = Number(process.env.IW_PROOF_PORT || 4714);
const HEAD = execSync('git rev-parse --short HEAD', { cwd: REPO_ROOT }).toString().trim();
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webm': 'video/webm' };

const server = http.createServer(async (req, res) => {
  try {
    const d = decodeURIComponent((req.url || '/').split('?')[0]).replace(/^\/+/, '');
    let f = path.resolve(REPO_ROOT, d || 'index.html');
    if (!f.startsWith(REPO_ROOT)) return res.writeHead(403).end();
    if (fsSync.existsSync(f) && fsSync.statSync(f).isDirectory()) f = path.join(f, 'index.html');
    const stat = fsSync.statSync(f);
    const type = MIME[path.extname(f)] || 'application/octet-stream';
    const range = req.headers.range;
    if (range && /^bytes=/.test(range)) {
      const [, s, e] = /bytes=(\d*)-(\d*)/.exec(range);
      const start = s ? Number(s) : 0;
      const end = e ? Number(e) : stat.size - 1;
      res.writeHead(206, { 'Content-Type': type, 'Accept-Ranges': 'bytes', 'Content-Range': `bytes ${start}-${end}/${stat.size}`, 'Content-Length': end - start + 1 });
      return fsSync.createReadStream(f, { start, end }).pipe(res);
    }
    res.writeHead(200, { 'Content-Type': type, 'Accept-Ranges': 'bytes', 'Content-Length': stat.size, 'Cache-Control': 'no-store' });
    res.end(await fs.readFile(f));
  } catch { res.writeHead(404).end(); }
});
await new Promise((r) => server.listen(PORT, '127.0.0.1', r));
await fs.mkdir(OUT, { recursive: true });
const BASE = `http://127.0.0.1:${PORT}/labs/immersive-worlds`;

const browser = await chromium.launch({
  headless: true,
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox']
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.setDefaultTimeout(300000);
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

const shots = [];
const shoot = async (id, caption) => {
  await page.screenshot({ path: path.join(OUT, `${id}.png`) });
  shots.push({ id, file: `${id}.png`, caption, head: HEAD });
  console.log(`  📸 ${id}`);
};
const checks = [];
const check = (name, ok, detail = '') => {
  checks.push({ name, ok, detail });
  console.log(`${ok ? '  ok  ' : ' FAIL '} ${name}${detail ? `  — ${detail}` : ''}`);
};

/** Hand the page a File with no MIME type, the way Windows does. */
const pickBlankTypeVideo = async (slot, fixture, name) => {
  const bytes = [...await fs.readFile(path.join(FIXTURES, fixture))];
  await page.evaluate(async ({ slot: s, bytes: b, name: n }) => {
    const file = new File([new Uint8Array(b)], n, { type: '' });   // no type: the whole point
    const dt = new DataTransfer();
    dt.items.add(file);
    const input = document.querySelector(`[data-media="${s}"]`);
    input.files = dt.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }, { slot, bytes, name });
};

await page.goto(`${BASE}/index.html?tier=HIGH&authoring=1`, { waitUntil: 'load' });
await page.waitForFunction(() => window.__IW?.ready === true, { timeout: 300000 });
await page.evaluate(() => { window.__IW.hud.el.veil.hidden = true; });
await page.waitForTimeout(1200);

await page.evaluate(() => {
  window.__STATES = [];
  const v = window.__IW_VAULT; const inner = v.onChange;
  v.onChange = (a) => { window.__STATES.push(a.state); return inner(a); };
});

/* -- 1..3 select → loading → ready ---------------------------------------- */
await page.click('[data-node="entity.video.cuaderno-de-luz"]');
await page.waitForTimeout(2600);
await pickBlankTypeVideo('PROJECTION_MEDIA', 'qa-video.webm', 'entrevista-curador.webm');
await shoot('V1_VIDEO_SELECTED', 'Vídeo elegido — el archivo llega sin tipo MIME, como en Windows');
await page.waitForFunction(
  () => /Listo|no se pudo/.test(document.querySelector('[data-slot="PROJECTION_MEDIA"] .st-slotstate')?.textContent || ''),
  { timeout: 180000 }
);
const readyState = await page.textContent('[data-slot="PROJECTION_MEDIA"] .st-slotstate');
await shoot('V3_VIDEO_READY', `Listo — ${readyState.trim()}`);

const seen = await page.evaluate(() => window.__STATES);
check('1 · un vídeo sin tipo MIME se acepta', !/ERROR/.test(seen.join(',')), `estados: ${seen.join(' → ')}`);
check('2 · pasa por CARGANDO', seen.includes('LOADING'));
check('3 · pasa por DECODIFICADO y llega a LISTO', seen.includes('DECODED') && seen.includes('READY'),
  readyState.trim());

/* -- 4 save ---------------------------------------------------------------- */
await page.click('[data-act="save"]');
await page.waitForTimeout(600);
const stored = await page.evaluate(() => {
  const p = JSON.parse(localStorage.getItem('iw.museum.authoring.v1') || '{}');
  return p?.entities?.['entity.video.cuaderno-de-luz']?.video || null;
});
check('4 · el proyecto guarda la referencia del vídeo', Boolean(stored?.src),
  stored ? `${stored.name} · ${stored.width}×${stored.height} · ${stored.durationMs} ms` : 'nada');
await shoot('V4_VIDEO_SAVED', 'Guardado — la cadena marca GUARDADO');

/* -- 5..6 apply, and where it landed --------------------------------------- */
await page.evaluate(() => { window.__IW.ready = false; });
await page.click('[data-act="apply"]');
await page.waitForFunction(() => window.__IW?.ready === true, { timeout: 300000 });
await page.evaluate(() => { window.__IW.hud.el.veil.hidden = true; });
await page.waitForTimeout(2000);
const landed = await page.evaluate(() => window.__IW.runtime.store.entities
  .filter((e) => String(e.content?.media?.src || '').startsWith('blob:'))
  .map((e) => `${e.id} · ${e.kind} · ${e.content.media.kind}`));
check('5 · aplicar no falla', true);
check('6 · el destino semántico correcto recibe VIDEO',
  landed.some((l) => l.includes('PROJECTION · VIDEO')), landed.join(' | ') || 'ninguno');
await shoot('V5_VIDEO_APPLIED', 'Aplicado al proyecto');

/* -- 7..8 the video is on the wall, and it is moving ----------------------- */
await page.evaluate(async () => {
  const rt = window.__IW.runtime;
  for (const id of ['portal.lobby-gallery-a', 'portal.gallery-a-gallery-b']) {
    if (rt.state.activeSpaceId === 'space.gallery-b') break;
    try { await rt.traversePortal(id, { source: 'QA' }); } catch { /* */ }
  }
  // Setting a pose while another authority owns the camera does nothing at all —
  // the arrival animation simply overwrites it on the next frame, and the
  // evidence comes back framed from wherever the portal left you. Wait for the
  // visitor to own the camera again, then stand where the screen is legible.
  const started = performance.now();
  while (rt.camera.owner !== 'EXPLORE' && performance.now() - started < 8000) {
    await new Promise((r) => setTimeout(r, 120));
  }
  // Hand-authored poses have now failed twice: the bright rectangle they framed
  // is an artwork, and the projection was a sliver at the edge of frame. The
  // engine already knows how to frame its own records — ask it.
  try {
    const pose = rt.framingFor('entity.video.cuaderno-de-luz', 'FOCUS');
    rt.explore.setPose({
      position: pose.position,
      yaw: Math.atan2(pose.target[0] - pose.position[0], pose.target[2] - pose.position[2]),
      pitch: 0
    });
  } catch {
    rt.explore.setPose({ position: [0, 1.62, -1.7], yaw: Math.PI, pitch: 0.02 });
  }
});
await page.waitForTimeout(2600);

const playing = await page.evaluate(async () => {
  let element = null; let texture = null;
  window.__IW.runtime.sceneKit.scene.traverse((o) => {
    if (o.material?.map?.image?.tagName === 'VIDEO') { element = o.material.map.image; texture = o.material.map; }
  });
  if (!element) return { found: false };
  const samples = [];
  for (let i = 0; i < 4; i += 1) {
    samples.push(+element.currentTime.toFixed(3));
    await new Promise((r) => setTimeout(r, 420));
  }
  const shot = () => {
    const c = document.createElement('canvas');
    c.width = 64; c.height = 36;
    const x = c.getContext('2d', { willReadFrequently: true });
    x.drawImage(element, 0, 0, 64, 36);
    const d = x.getImageData(0, 0, 64, 36).data;
    let sat = 0;
    for (let i = 0; i < d.length; i += 4) sat += Math.max(d[i], d[i + 1], d[i + 2]) - Math.min(d[i], d[i + 1], d[i + 2]);
    return { sat: Math.round(sat / (d.length / 4)), hash: Array.from({ length: 8 }, (_, k) => d[k * 997 % d.length]).join(',') };
  };
  const picA = shot();
  await new Promise((r) => setTimeout(r, 700));
  const picB = shot();

  return {
    found: true,
    picture: { a: picA, b: picB, changed: picA.hash !== picB.hash, saturated: picA.sat > 40 },
    w: element.videoWidth, h: element.videoHeight,
    duration: +element.duration.toFixed(2),
    paused: element.paused, muted: element.muted, loop: element.loop,
    readyState: element.readyState,
    samples,
    advancing: samples.some((t, i) => i > 0 && Math.abs(t - samples[i - 1]) > 0.01),
    playError: texture.userData?.playError || null
  };
});
check('7 · el vídeo está en la superficie de proyección', playing.found,
  playing.found ? `${playing.w}×${playing.h} · ${playing.duration} s` : 'no hay textura de vídeo en la escena');
check('8a · la imagen del vídeo cambia (no es un fotograma congelado)',
  Boolean(playing.picture?.changed), JSON.stringify(playing.picture || {}));
check('8b · lo que se ve es el archivo del autor, no el original',
  Boolean(playing.picture?.saturated), `saturación ${playing.picture?.a?.sat} (el original es gris azulado)`);
check('8 · el vídeo avanza (reproduciéndose de verdad)', playing.advancing,
  `currentTime: ${(playing.samples || []).join(' → ')}${playing.playError ? ` · play(): ${playing.playError}` : ''}`);
await shoot('V6_VIDEO_PLAYING_IN_MUSEUM', `Reproduciéndose en la sala — ${(playing.samples || []).join(' → ')} s`);
// Two consecutive frames: a single still cannot prove motion.
await page.waitForTimeout(700);
await shoot('V6b_VIDEO_PLAYING_NEXT_FRAME', 'El mismo plano, un instante después');

/* -- 9 replacement releases the previous resource -------------------------- */
const before = await page.evaluate(() => window.__IW_VAULT.report().length);
await page.click('[data-node="entity.video.cuaderno-de-luz"]');
await page.waitForTimeout(1400);
await pickBlankTypeVideo('PROJECTION_MEDIA', 'qa-video.webm', 'segunda-toma.webm');
await page.waitForFunction(
  () => /Listo|no se pudo/.test(document.querySelector('[data-slot="PROJECTION_MEDIA"] .st-slotstate')?.textContent || ''),
  { timeout: 180000 }
);
const after = await page.evaluate(() => ({
  count: window.__IW_VAULT.report().length,
  names: window.__IW_VAULT.report().map((a) => a.name)
}));
check('9 · sustituir libera el recurso anterior', after.count === before,
  `${before} → ${after.count} · ${after.names.join(', ')}`);
await shoot('V7_VIDEO_REPLACED', `Sustituido — ${after.names.join(', ')}`);

/* -- 10 a file that really is not a video ---------------------------------- */
await pickBlankTypeVideo('PROJECTION_MEDIA', 'qa-not-media.txt', 'notas-del-comisario.mp4');
await page.waitForFunction(
  () => /no se pudo/i.test(document.querySelector('[data-slot="PROJECTION_MEDIA"] .st-slotstate')?.textContent || ''),
  { timeout: 60000 }
);
const badMsg = (await page.textContent('[data-slot="PROJECTION_MEDIA"] .st-slotstate')).trim();
check('10 · un archivo que no es vídeo sigue fallando, con motivo', /no se pudo/i.test(badMsg), badMsg);
await shoot('V8_INVALID_VIDEO_RECOVERY', `Recuperación — ${badMsg}`);

/* -- 11 image and text still work ------------------------------------------ */
await page.click('[data-node="entity.artwork.horizonte-interrumpido"]');
await page.waitForTimeout(2400);
await page.fill('[data-bind="entities.entity.artwork.horizonte-interrumpido.title"]', 'Marea de septiembre');
await pickBlankTypeVideo('ARTWORK_IMAGE', 'qa-artwork.jpg', 'obra-sin-tipo.jpg');
await page.waitForFunction(
  () => /Lista|no se pudo/.test(document.querySelector('[data-slot="ARTWORK_IMAGE"] .st-slotstate')?.textContent || ''),
  { timeout: 120000 }
);
const imgState = (await page.textContent('[data-slot="ARTWORK_IMAGE"] .st-slotstate')).trim();
const textOk = await page.evaluate(() =>
  window.__IW_STUDIO.config.entities['entity.artwork.horizonte-interrumpido']?.title);
check('11a · la imagen sigue funcionando', /Lista/.test(imgState), imgState);
check('11b · el texto sigue funcionando', textOk === 'Marea de septiembre', String(textOk));
await shoot('V9_IMAGE_AND_TEXT_STILL_WORK', 'Imagen y texto tras el arreglo del vídeo');

check('sin errores de consola', errors.length === 0, errors.slice(0, 2).join(' | ') || 'ninguno');

const failed = checks.filter((c) => !c.ok).length;
await fs.writeFile(path.join(OUT, 'video-proof.json'), JSON.stringify({
  generatedAt: new Date().toISOString(), head: HEAD,
  playback: playing, landed, stored, checks, shots, errors
}, null, 1));
console.log(`\n${checks.length - failed}/${checks.length} comprobaciones`);
await browser.close();
server.close();
process.exit(failed ? 1 : 0);
