/**
 * Decode the canonical transition video and lay its frames out to be looked at.
 *
 * There is no ffmpeg here, so the browser's own decoder does the work — the
 * same decoder that will play it for a human. Two outputs:
 *
 *   contact-sheet-NN.png   dense grids, for choosing beats by eye
 *   frame-<ms>.png         full-size frames, for the storyboard itself
 *
 * Frames are sampled densely and uniformly on purpose. Beats get chosen *after*
 * looking, because picking timestamps first and calling them beats is how you
 * end up with a storyboard that describes the sampling interval rather than the
 * film.
 *
 *   node qa/tools/source-frames.mjs [--every 0.2] [--at 1.4,2.0,...]
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
const VIDEO = 'docs/visuals/museum-transitions/source-reference/SOURCE_TRANSITION_CANONICAL_GITHUB.mp4';
const OUT = path.join(MODULE_ROOT, 'qa', 'evidence-vs02', 'source-transition');
const PORT = Number(process.env.IW_SRC_PORT || 5090);

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};
const EVERY = Number(arg('every', 0.2));
const AT = arg('at', '');

await fs.mkdir(OUT, { recursive: true });

// Range requests matter: a 16 MB MP4 that cannot be seeked can only be played.
const server = http.createServer(async (req, res) => {
  try {
    const f = path.resolve(REPO_ROOT, decodeURIComponent((req.url || '/').split('?')[0]).replace(/^\/+/, ''));
    if (!f.startsWith(REPO_ROOT)) return res.writeHead(403).end();
    const stat = fsSync.statSync(f);
    const range = req.headers.range;
    if (range && /^bytes=/.test(range)) {
      const [, s, e] = /bytes=(\d*)-(\d*)/.exec(range);
      const start = s ? Number(s) : 0;
      const end = e ? Number(e) : stat.size - 1;
      res.writeHead(206, {
        'Content-Type': 'video/mp4', 'Accept-Ranges': 'bytes',
        'Content-Range': `bytes ${start}-${end}/${stat.size}`, 'Content-Length': end - start + 1
      });
      return fsSync.createReadStream(f, { start, end }).pipe(res);
    }
    res.writeHead(200, { 'Content-Type': 'video/mp4', 'Accept-Ranges': 'bytes', 'Content-Length': stat.size });
    res.end(await fs.readFile(f));
  } catch { res.writeHead(404).end(); }
});
await new Promise((r) => server.listen(PORT, '127.0.0.1', r));

const browser = await chromium.launch({ headless: true, args: ['--disable-gpu-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.setDefaultTimeout(180000);
await page.setContent('<body style="margin:0;background:#000"><video id="v" muted playsinline></video></body>');
await page.evaluate(async (src) => {
  const v = document.getElementById('v');
  v.src = src;
  await new Promise((res, rej) => {
    v.onloadedmetadata = res;
    v.onerror = () => rej(new Error('el vídeo no decodifica'));
  });
}, `http://127.0.0.1:${PORT}/${VIDEO}`);

const meta = await page.evaluate(() => {
  const v = document.getElementById('v');
  return { duration: v.duration, width: v.videoWidth, height: v.videoHeight };
});
console.log(`vídeo: ${meta.width}×${meta.height} · ${meta.duration.toFixed(2)} s`);

/** Seek to an exact time and hand back a PNG of that frame. */
const grab = async (t) => page.evaluate(async (time) => {
  const v = document.getElementById('v');
  await new Promise((res) => {
    // `seeked` fires when the frame is actually decoded and presented, which is
    // the difference between photographing the frame you asked for and the one
    // that happened to be on screen.
    const done = () => { v.removeEventListener('seeked', done); res(); };
    v.addEventListener('seeked', done);
    v.currentTime = time;
  });
  const c = document.createElement('canvas');
  c.width = v.videoWidth; c.height = v.videoHeight;
  c.getContext('2d').drawImage(v, 0, 0);
  return c.toDataURL('image/png');
}, t);

const times = AT
  ? AT.split(',').map(Number)
  : Array.from({ length: Math.floor(meta.duration / EVERY) + 1 }, (_, i) => +(i * EVERY).toFixed(3))
    .filter((t) => t < meta.duration);

const frames = [];
for (const t of times) {
  const dataUrl = await grab(t);
  const ms = Math.round(t * 1000);
  const file = path.join(OUT, `frame-${String(ms).padStart(6, '0')}.png`);
  await fs.writeFile(file, Buffer.from(dataUrl.split(',')[1], 'base64'));
  frames.push({ t, ms, file, dataUrl });
}
console.log(`${frames.length} fotogramas extraídos cada ${EVERY} s`);

/* Contact sheets, so a person can choose beats by looking rather than by index. */
const PER_SHEET = 24;
for (let s = 0; s * PER_SHEET < frames.length; s += 1) {
  const slice = frames.slice(s * PER_SHEET, (s + 1) * PER_SHEET);
  const sheet = await page.evaluate(async ({ items, cols }) => {
    const W = 320;
    const load = (src) => new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.src = src; });
    const imgs = await Promise.all(items.map((i) => load(i.dataUrl)));
    const H = Math.round(W * (imgs[0].naturalHeight / imgs[0].naturalWidth));
    const rows = Math.ceil(imgs.length / cols);
    const c = document.createElement('canvas');
    c.width = cols * W; c.height = rows * (H + 22);
    const x = c.getContext('2d');
    x.fillStyle = '#0c0b0a'; x.fillRect(0, 0, c.width, c.height);
    imgs.forEach((img, i) => {
      const cx = (i % cols) * W; const cy = Math.floor(i / cols) * (H + 22);
      x.drawImage(img, cx, cy + 22, W, H);
      x.fillStyle = '#e8e2d6'; x.font = '13px monospace';
      x.fillText(`${(items[i].t).toFixed(2)}s`, cx + 6, cy + 15);
    });
    return c.toDataURL('image/png');
  }, { items: slice.map(({ t, dataUrl }) => ({ t, dataUrl })), cols: 4 });
  const file = path.join(OUT, `contact-sheet-${String(s + 1).padStart(2, '0')}.png`);
  await fs.writeFile(file, Buffer.from(sheet.split(',')[1], 'base64'));
  console.log(`hoja de contactos: ${path.basename(file)} (${slice.length} fotogramas)`);
}

await fs.writeFile(path.join(OUT, 'source-meta.json'), JSON.stringify({
  video: VIDEO, ...meta, sampledEvery: EVERY, frames: frames.map(({ t, ms }) => ({ t, ms }))
}, null, 1));
await browser.close();
server.close();
