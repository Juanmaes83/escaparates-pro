/**
 * Real MP4 and WebM fixtures, recorded by a real browser.
 *
 * The mandate asks for user-representative files. A hand-assembled container is
 * not that: it tests my understanding of the spec, not the decoder's. So the
 * fixtures are recorded with MediaRecorder from a canvas — the same encoders a
 * visitor's own camera app or screen recorder would have produced, in the two
 * containers an author actually drops on us.
 *
 * The picture is deliberately loud: saturated primaries that move every frame.
 * The Museum's own generated projection is dim blue-grey, so "is the authored
 * file on the wall" becomes a question an average colour can answer, and "is it
 * playing" becomes a question two samples can answer.
 *
 *   node qa/tools/make-video-fixtures.mjs
 */
import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = path.resolve(HERE, '..', 'fixtures');

const browser = await chromium.launch({
  headless: true,
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox']
});
const page = await browser.newPage();

const recorded = await page.evaluate(async () => {
  const candidates = [
    ['mp4', 'video/mp4;codecs=avc1.42E01E'],
    ['mp4', 'video/mp4;codecs=h264'],
    ['mp4', 'video/mp4'],
    ['webm', 'video/webm;codecs=vp9'],
    ['webm', 'video/webm;codecs=vp8'],
    ['webm', 'video/webm']
  ];

  const canvas = document.createElement('canvas');
  canvas.width = 640; canvas.height = 360;
  const ctx = canvas.getContext('2d');

  const record = async (mime) => {
    const stream = canvas.captureStream(30);
    const chunks = [];
    const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 2_000_000 });
    rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
    const stopped = new Promise((r) => { rec.onstop = r; });
    rec.start();

    // Four seconds of unmistakable motion: full-frame primaries cycling, plus a
    // travelling bar so a single still can be told apart from its neighbour.
    const colours = ['#e01b24', '#1ba7e0', '#f6d32d', '#2ec27e'];
    const t0 = performance.now();
    await new Promise((done) => {
      const draw = () => {
        const t = performance.now() - t0;
        ctx.fillStyle = colours[Math.floor(t / 250) % colours.length];
        ctx.fillRect(0, 0, 640, 360);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(((t / 4) % 640), 0, 60, 360);
        if (t < 4000) requestAnimationFrame(draw); else done();
      };
      draw();
    });

    rec.stop();
    await stopped;
    stream.getTracks().forEach((tr) => tr.stop());
    const blob = new Blob(chunks, { type: mime });
    const bytes = [...new Uint8Array(await blob.arrayBuffer())];
    return { bytes, mime };
  };

  const out = {};
  for (const [container, mime] of candidates) {
    if (out[container]) continue;
    if (!MediaRecorder.isTypeSupported(mime)) continue;
    try { out[container] = await record(mime); } catch { /* try the next codec */ }
  }
  return out;
});

const written = [];
for (const [container, data] of Object.entries(recorded)) {
  const file = path.join(FIXTURES, `qa-motion.${container}`);
  await fs.writeFile(file, Buffer.from(data.bytes));
  written.push({ file: path.basename(file), mime: data.mime, bytes: data.bytes.length });
}

// A file the decoder must genuinely refuse, so the error path is exercised by
// something real rather than by a rename. The extension claims mp4; the bytes
// are not a container at all.
await fs.writeFile(path.join(FIXTURES, 'qa-broken.mp4'),
  Buffer.from('not a container, on purpose — the decoder must say so\n'.repeat(64)));
written.push({ file: 'qa-broken.mp4', mime: 'n/a', bytes: (await fs.stat(path.join(FIXTURES, 'qa-broken.mp4'))).size });

console.log(JSON.stringify(written, null, 1));
if (!recorded.mp4) console.log('AVISO: este Chromium no sabe grabar MP4; no hay fixture MP4 real.');
await browser.close();
