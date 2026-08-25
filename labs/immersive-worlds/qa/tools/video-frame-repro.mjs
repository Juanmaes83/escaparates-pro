/**
 * Reproduce the video failure under the conditions Juanma's browser imposes.
 *
 * The top-level trace could not reproduce it: the authored video reaches the
 * projection and plays. So the difference is not in our chain — it is in the
 * frame the app is running inside. The published review artifact runs in a
 * sandboxed iframe, and two of that frame's properties can stop a video dead
 * while every one of our own states still reports success:
 *
 *   - no `allow="autoplay"` → `video.play()` rejects, and the media loader
 *     swallows that rejection on purpose, so the projection freezes silently;
 *   - an opaque origin → `video.crossOrigin = 'anonymous'` turns a same-origin
 *     blob into a CORS request that cannot be satisfied, and the load fails.
 *
 * This puts the real app inside frames with those properties and measures what
 * actually happens, one variable at a time.
 *
 *   node qa/tools/video-frame-repro.mjs
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
const PORT = Number(process.env.IW_FRAME_PORT || 4712);
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webm': 'video/webm' };

/** Frames to try, from "just like a normal page" to "just like the artifact". */
const CASES = [
  { id: 'top', label: 'documento normal (referencia)', sandbox: null, allow: null },
  { id: 'frame-allow', label: 'iframe con allow="autoplay"', sandbox: 'allow-scripts allow-same-origin', allow: 'autoplay' },
  { id: 'frame-noallow', label: 'iframe SIN allow="autoplay"', sandbox: 'allow-scripts allow-same-origin', allow: '' },
  { id: 'frame-opaque', label: 'iframe sin allow-same-origin (origen opaco)', sandbox: 'allow-scripts', allow: 'autoplay' }
];

const server = http.createServer(async (req, res) => {
  try {
    const url = (req.url || '/').split('?')[0];
    if (url === '/__host') {
      const c = CASES.find((x) => x.id === (new URL(req.url, 'http://x').searchParams.get('case')));
      const attrs = [
        c.sandbox === null ? '' : `sandbox="${c.sandbox}"`,
        c.allow === null ? '' : `allow="${c.allow}"`
      ].filter(Boolean).join(' ');
      res.writeHead(200, { 'Content-Type': 'text/html' });
      return res.end(`<!doctype html><meta charset=utf8><style>html,body{margin:0;height:100%}iframe{border:0;width:100vw;height:100vh}</style>
        <iframe id="f" ${attrs} src="/labs/immersive-worlds/index.html?tier=HIGH&authoring=1"></iframe>`);
    }
    const d = decodeURIComponent(url).replace(/^\/+/, '');
    let f = path.resolve(REPO_ROOT, d || 'index.html');
    if (!f.startsWith(REPO_ROOT)) return res.writeHead(403).end();
    if (fsSync.existsSync(f) && fsSync.statSync(f).isDirectory()) f = path.join(f, 'index.html');
    const stat = fsSync.statSync(f);
    const range = req.headers.range;
    const type = MIME[path.extname(f)] || 'application/octet-stream';
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
const BASE = `http://127.0.0.1:${PORT}`;

// The browser's own policy, not ours. The earlier trace overrode it and could
// therefore never see the failure it was written to find.
const browser = await chromium.launch({
  headless: true,
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox']
});

const results = [];
for (const c of CASES) {
  const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
  page.setDefaultTimeout(300000);
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));

  const target = c.id === 'top'
    ? `${BASE}/labs/immersive-worlds/index.html?tier=HIGH&authoring=1`
    : `${BASE}/__host?case=${c.id}`;
  await page.goto(target, { waitUntil: 'load' });

  const ctx = c.id === 'top' ? page : page.frameLocator('#f');
  const win = c.id === 'top' ? page : page.frames().find((f) => f.url().includes('immersive-worlds'));

  let outcome;
  try {
    await win.waitForFunction(() => window.__IW?.ready === true, { timeout: 240000 });

    // The plain question, asked of the video the Museum already ships with: can
    // this frame play a video at all? No authoring involved yet.
    outcome = await win.evaluate(async () => {
      const probe = document.createElement('video');
      probe.muted = true; probe.playsInline = true; probe.loop = true;
      // A one-frame webm is not needed: the Museum's own projection file is here.
      probe.src = './assets/collection/cuaderno-de-luz.webm';
      const loaded = await new Promise((r) => {
        probe.addEventListener('loadeddata', () => r('loadeddata'), { once: true });
        probe.addEventListener('error', () => r(`error ${probe.error?.code}`), { once: true });
        setTimeout(() => r('timeout'), 20000);
      });
      const play = await probe.play().then(() => 'resolved').catch((e) => `rejected: ${e.name}`);
      const t0 = probe.currentTime;
      await new Promise((r) => setTimeout(r, 1000));
      const advanced = +(probe.currentTime - t0).toFixed(3);

      // And the same question with crossOrigin set, which is what the product does.
      const cors = document.createElement('video');
      cors.crossOrigin = 'anonymous'; cors.muted = true; cors.playsInline = true;
      const blob = await fetch('./assets/collection/cuaderno-de-luz.webm').then((r) => r.blob());
      cors.src = URL.createObjectURL(blob);
      const corsLoaded = await new Promise((r) => {
        cors.addEventListener('loadeddata', () => r('loadeddata'), { once: true });
        cors.addEventListener('error', () => r(`error ${cors.error?.code}`), { once: true });
        setTimeout(() => r('timeout'), 20000);
      });
      const corsPlay = await cors.play().then(() => 'resolved').catch((e) => `rejected: ${e.name}`);

      // What the vault does with a file whose type the OS did not fill in. On
      // Windows a .mp4 or .webm with no registry association arrives as ''.
      const blank = new File([new Uint8Array([1, 2, 3])], 'entrevista-curador.mp4', { type: '' });
      const vaultOnBlankType = window.__IW_VAULT
        ? await window.__IW_VAULT.accept(blank, { kind: 'video' }).then((a) => ({ state: a.state, error: a.error }))
        : null;

      return {
        origin: location.origin,
        vaultOnBlankType,
        opaqueOrigin: location.origin === 'null',
        plainVideo: { loaded, play, advanced },
        blobWithCrossOrigin: { loaded: corsLoaded, play: corsPlay }
      };
    });
  } catch (error) {
    outcome = { failed: String(error.message).slice(0, 140) };
  }

  results.push({ case: c.id, label: c.label, sandbox: c.sandbox, allow: c.allow, ...outcome, errors: errors.slice(0, 3) });
  console.log(`\n── ${c.label}\n${JSON.stringify(results[results.length - 1], null, 1)}`);
  await page.close();
  void ctx;
}

await fs.writeFile(path.join(MODULE_ROOT, 'qa', 'evidence-vs02', 'video-frame-repro.json'),
  JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 1));

await browser.close();
server.close();
