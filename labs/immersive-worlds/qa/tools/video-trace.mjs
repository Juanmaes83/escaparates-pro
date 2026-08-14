/**
 * Where does an authored video stop?
 *
 * Juanma reports that images and text reach the Museum and video does not. The
 * code reads correctly at every stage, which is exactly the situation where
 * reading more code is the wrong move. This walks the real chain in the real
 * runtime and reports the actual state at each link:
 *
 *   file → slot → vault → config → apply → world record → media loader →
 *   scene kit → material → texture → video element → playback
 *
 * It asserts nothing and fixes nothing. It only says where the chain is intact
 * and where it is not.
 *
 *   node qa/tools/video-trace.mjs
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
const FIXTURES = path.join(MODULE_ROOT, 'qa', 'fixtures');
const PORT = Number(process.env.IW_TRACE_PORT || 4710);
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webm': 'video/webm' };

const server = http.createServer(async (req, res) => {
  try {
    const d = decodeURIComponent((req.url || '/').split('?')[0]).replace(/^\/+/, '');
    let f = path.resolve(REPO_ROOT, d || 'index.html');
    if (!f.startsWith(REPO_ROOT)) return res.writeHead(403).end();
    if (fsSync.existsSync(f) && fsSync.statSync(f).isDirectory()) f = path.join(f, 'index.html');
    const stat = fsSync.statSync(f);
    // Chromium's media stack asks for ranges. A 200 with the whole body makes a
    // webm load anyway, but not the way the product will be served, and the
    // point of this trace is to be the real path.
    const range = req.headers.range;
    const type = MIME[path.extname(f)] || 'application/octet-stream';
    if (range && /^bytes=/.test(range)) {
      const [, s, e] = /bytes=(\d*)-(\d*)/.exec(range);
      const start = s ? Number(s) : 0;
      const end = e ? Number(e) : stat.size - 1;
      res.writeHead(206, {
        'Content-Type': type, 'Accept-Ranges': 'bytes',
        'Content-Range': `bytes ${start}-${end}/${stat.size}`, 'Content-Length': end - start + 1
      });
      return fsSync.createReadStream(f, { start, end }).pipe(res);
    }
    res.writeHead(200, { 'Content-Type': type, 'Accept-Ranges': 'bytes', 'Content-Length': stat.size, 'Cache-Control': 'no-store' });
    res.end(await fs.readFile(f));
  } catch { res.writeHead(404).end(); }
});
await new Promise((r) => server.listen(PORT, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${PORT}/labs/immersive-worlds`;

// The first run of this trace passed `--autoplay-policy=no-user-gesture-required`
// and reported the video playing perfectly. That flag removes the exact browser
// behaviour most likely to be breaking it for a real user, so the trace could not
// have failed. `--autoplay=allow` restores the old behaviour deliberately; the
// default is what Juanma's browser does.
const ALLOW_AUTOPLAY = process.argv.includes('--autoplay=allow');
const browser = await chromium.launch({
  headless: true,
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox',
    ...(ALLOW_AUTOPLAY ? ['--autoplay-policy=no-user-gesture-required'] : [])]
});
console.log(`  política de autoplay: ${ALLOW_AUTOPLAY ? 'permitida (irreal)' : 'la del navegador (real)'}`);
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.setDefaultTimeout(300000);
const log = [];
page.on('pageerror', (e) => log.push(`pageerror: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') log.push(`${m.type()}: ${m.text()}`); });

const step = (name, value) => console.log(`\n── ${name}\n${JSON.stringify(value, null, 1)}`);

await page.goto(`${BASE}/index.html?tier=HIGH&authoring=1`, { waitUntil: 'load' });
await page.waitForFunction(() => window.__IW?.ready === true, { timeout: 300000 });
await page.evaluate(() => { window.__IW.hud.el.veil.hidden = true; });
await page.waitForTimeout(1200);

/* -- 0. what the Museum ships with ---------------------------------------- */
step('0 · el vídeo original del mundo, antes de tocar nada', await page.evaluate(() => {
  const rt = window.__IW.runtime;
  const e = rt.store.entities.find((x) => x.kind === 'PROJECTION');
  const kit = rt.sceneKit;
  const built = [...(kit._spaces?.values?.() || [])]
    .flatMap((s) => [...(s.entities?.entries?.() || [])])
    .find(([id]) => id === e.id);
  return {
    entity: e.id,
    media: e.content.media,
    mediaLoader: window.__IW.mediaLoader.report(),
    builtObject: Boolean(built),
    animatedSources: kit._animated?.length ?? null
  };
}));

/* -- 1. the author picks a video ------------------------------------------ */
await page.evaluate(() => {
  window.__TRACE = [];
  const vault = window.__IW_VAULT;
  const inner = vault.onChange;
  vault.onChange = (a) => {
    window.__TRACE.push({ at: Date.now(), state: a.state, name: a.name, kind: a.kind, error: a.error });
    return inner(a);
  };
});
await page.click('[data-node="entity.video.cuaderno-de-luz"]');
await page.waitForTimeout(2600);
await page.setInputFiles('[data-media="PROJECTION_MEDIA"]', path.join(FIXTURES, 'qa-video.webm'));
await page.waitForFunction(
  () => /Listo|no se pudo/.test(document.querySelector('[data-slot="PROJECTION_MEDIA"] .st-slotstate')?.textContent || ''),
  { timeout: 180000 }
);

step('1 · ranura → almacén de medios', await page.evaluate(() => {
  const s = window.__IW_STUDIO;
  const ref = s.config.entities['entity.video.cuaderno-de-luz']?.video;
  const asset = ref?.assetId ? window.__IW_VAULT.get(ref.assetId) : null;
  return {
    slotState: document.querySelector('[data-slot="PROJECTION_MEDIA"] .st-slotstate')?.textContent?.trim(),
    configRef: ref && { kind: ref.kind, src: ref.src, name: ref.name, w: ref.width, h: ref.height, ms: ref.durationMs },
    vaultAsset: asset && { state: asset.state, url: String(asset.url).slice(0, 24), w: asset.width, h: asset.height, dur: asset.duration },
    resolves: Boolean(window.__IW_VAULT.resolve(ref?.src)),
    transitions: window.__TRACE.map((t) => t.state)
  };
}));

/* -- 2. save, then apply --------------------------------------------------- */
await page.click('[data-act="save"]');
await page.waitForTimeout(500);
const saved = await page.evaluate(() => {
  const raw = localStorage.getItem('iw.museum.authoring.v1');
  const parsed = raw ? JSON.parse(raw) : null;
  return {
    savedLabel: document.querySelector('[data-role=saved]')?.textContent?.trim(),
    storedVideo: parsed?.entities?.['entity.video.cuaderno-de-luz']?.video || null
  };
});
step('2 · guardado', saved);

await page.evaluate(() => { window.__IW.ready = false; });
await page.click('[data-act="apply"]');
await page.waitForFunction(() => window.__IW?.ready === true, { timeout: 300000 });
await page.evaluate(() => { window.__IW.hud.el.veil.hidden = true; });
await page.waitForTimeout(2500);

step('3 · el registro del mundo tras aplicar', await page.evaluate(() => {
  const rt = window.__IW.runtime;
  const e = rt.store.entities.find((x) => x.kind === 'PROJECTION');
  return { entity: e.id, media: e.content.media, loaderReport: window.__IW.mediaLoader.report() };
}));

/* -- 3. walk into the room that has the projection ------------------------- */
await page.evaluate(async () => {
  const rt = window.__IW.runtime;
  for (const id of ['portal.lobby-gallery-a', 'portal.gallery-a-gallery-b']) {
    if (rt.state.activeSpaceId === 'space.gallery-b') break;
    try { await rt.traversePortal(id, { source: 'TRACE' }); } catch (e) { /* */ }
  }
  rt.explore.setPose({ position: [0, 1.62, -3.2], yaw: Math.PI, pitch: 0 });
});
await page.waitForTimeout(3000);

/* -- 4. the last links: loader → scene kit → material → element ------------ */
const downstream = await page.evaluate(async () => {
  const rt = window.__IW.runtime;
  const kit = rt.sceneKit;
  const e = rt.store.entities.find((x) => x.kind === 'PROJECTION');

  // Ask the loader directly what it holds for this src.
  const report = window.__IW.mediaLoader.report();

  // Find the built object for the projection and read its material chain.
  let materialMaps = [];
  let found = null;
  kit.scene.traverse((o) => {
    if (o.material && o.material.map) {
      const map = o.material.map;
      materialMaps.push({
        node: o.name || o.type,
        mapType: map.constructor?.name,
        hasImage: Boolean(map.image),
        imageTag: map.image?.tagName || null,
        w: map.image?.videoWidth || map.image?.width || null,
        h: map.image?.videoHeight || map.image?.height || null
      });
      if (map.image?.tagName === 'VIDEO') found = map.image;
    }
  });

  // Every <video> in the document, whoever made it.
  const videos = [...document.querySelectorAll('video')].map((v) => ({
    src: String(v.src).slice(0, 34),
    readyState: v.readyState, paused: v.paused, muted: v.muted,
    w: v.videoWidth, h: v.videoHeight, dur: Number(v.duration?.toFixed?.(2)), t0: v.currentTime
  }));

  const playAttempt = found ? await found.play().then(() => 'resolved').catch((e) => `rejected: ${e.name}`) : 'no video element';
  const t0 = found?.currentTime ?? null;
  await new Promise((r) => setTimeout(r, 1200));
  const t1 = found?.currentTime ?? null;

  return {
    entityMedia: e.content.media?.kind,
    loaderReport: report,
    videoTextureFoundInScene: Boolean(found),
    materialsWithVideoMap: materialMaps.filter((m) => m.imageTag === 'VIDEO'),
    totalMappedMaterials: materialMaps.length,
    documentVideos: videos,
    playAttempt,
    playback: { t0, t1, advanced: t0 !== null && t1 !== null ? +(t1 - t0).toFixed(3) : null },
    paused: found?.paused ?? null,
    animated: kit._animated?.length ?? null
  };
});
step('4 · cargador → scene kit → material → elemento → reproducción', downstream);

await fs.writeFile(path.join(MODULE_ROOT, 'qa', 'evidence-vs02', 'video-trace.json'),
  JSON.stringify({ generatedAt: new Date().toISOString(), saved, downstream, log }, null, 1));
console.log(`\n── consola\n${log.length ? log.slice(0, 8).join('\n') : 'limpia'}`);

await browser.close();
server.close();
