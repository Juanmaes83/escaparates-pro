/**
 * VS02 QA fixtures — files that make success obvious.
 *
 * VS01's visual pass proved a file had been applied by uploading the file the
 * world already used, so the "after" frame was indistinguishable from the
 * "before" one. These fixtures exist so that never happens again: nothing here
 * resembles the Fundación Arenas collection, which is muted umber, slate and
 * verdigris. A reviewer who cannot tell whether the upload worked is looking at
 * a broken test, not a broken product.
 *
 * Everything is generated here. No third-party asset is involved.
 *
 *   node qa/tools/make-vs02-fixtures.mjs
 */
import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(HERE, '..', 'fixtures');
await fs.mkdir(OUT, { recursive: true });

const browser = await chromium.launch({
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox',
    '--autoplay-policy=no-user-gesture-required']
});
const page = await browser.newPage({ viewport: { width: 900, height: 700 } });
page.on('pageerror', (e) => console.log('ERR', e.message));
await page.goto('about:blank');

const write = async (name, dataUrl) => {
  const base64 = dataUrl.split(',')[1];
  await fs.writeFile(path.join(OUT, name), Buffer.from(base64, 'base64'));
  const { size } = await fs.stat(path.join(OUT, name));
  console.log(`  ${name} — ${(size / 1024).toFixed(0)} kB`);
};

/* -- a logo that cannot be mistaken for anything in the collection --------- */
await write('qa-logo.png', await page.evaluate(() => {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 160;
  const x = c.getContext('2d');
  x.clearRect(0, 0, 512, 160);
  // Flat, high contrast, and wordmark-shaped, because a logo has to be legible
  // at signage size and a reviewer has to spot it across a room.
  x.fillStyle = '#101010';
  x.fillRect(0, 0, 512, 160);
  x.strokeStyle = '#ffffff'; x.lineWidth = 8;
  x.strokeRect(16, 16, 128, 128);
  x.fillStyle = '#ffffff';
  x.fillRect(44, 44, 72, 72);
  x.font = '600 54px Georgia, serif';
  x.fillText('MARÉS', 172, 82);
  x.font = '400 20px Helvetica, Arial, sans-serif';
  x.fillStyle = '#b9b2a6';
  x.fillText('COLECCIÓN', 174, 116);
  return c.toDataURL('image/png');
}));

/* -- an artwork that is obviously not from this collection ----------------- */
await write('qa-artwork.jpg', await page.evaluate(() => {
  const c = document.createElement('canvas');
  c.width = 1400; c.height = 960;
  const x = c.getContext('2d');
  // Saturated primaries on a hard grid: the Museum's own plates are soft,
  // atmospheric and desaturated, so this reads as "clearly replaced" from the
  // far side of the room.
  x.fillStyle = '#f2f0e6'; x.fillRect(0, 0, 1400, 960);
  const bands = ['#d8452f', '#1f5fa8', '#e8b52a', '#1d1d1b'];
  for (let i = 0; i < bands.length; i += 1) {
    x.fillStyle = bands[i];
    x.fillRect(120 + i * 300, 140, 220, 680);
  }
  x.strokeStyle = '#1d1d1b'; x.lineWidth = 10;
  x.strokeRect(70, 90, 1260, 780);
  x.fillStyle = '#1d1d1b';
  x.font = '600 40px Helvetica, Arial, sans-serif';
  x.fillText('PRUEBA VS02', 120, 900);
  return c.toDataURL('image/jpeg', 0.9);
}));

/* -- a video that is obviously not the Museum's projection ----------------- */
const videoData = await page.evaluate(() => new Promise((resolve, reject) => {
  const c = document.createElement('canvas');
  c.width = 960; c.height = 540;
  const x = c.getContext('2d');
  const stream = c.captureStream(25);
  const chunks = [];
  const rec = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp8' });
  rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
  rec.onerror = (e) => reject(new Error(String(e)));
  rec.onstop = () => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(new Blob(chunks, { type: 'video/webm' }));
  };

  let frame = 0;
  const draw = () => {
    // Moving colour bars with a frame counter: motion is visible in a still, and
    // the counter proves the file is playing rather than showing a poster.
    x.fillStyle = '#0b0b0b'; x.fillRect(0, 0, 960, 540);
    const hues = ['#e0483a', '#f0c53a', '#3aa0e0', '#54c07a'];
    for (let i = 0; i < 4; i += 1) {
      x.fillStyle = hues[i];
      const w = 150;
      x.fillRect(((frame * 6) + i * 240) % 1150 - 100, 90, w, 360);
    }
    x.fillStyle = '#ffffff';
    x.font = '600 56px Helvetica, Arial, sans-serif';
    x.fillText(`VS02 ${String(frame).padStart(3, '0')}`, 40, 500);
    frame += 1;
    if (frame < 120) requestAnimationFrame(draw); else rec.stop();
  };

  rec.start();
  requestAnimationFrame(draw);
}));
await write('qa-video.webm', videoData);

/* -- something that is not media at all, for the error path ---------------- */
await fs.writeFile(path.join(OUT, 'qa-not-media.txt'),
  'Este archivo existe para probar el rechazo de formatos no admitidos.\n');
console.log('  qa-not-media.txt — 1 kB');

await fs.writeFile(path.join(OUT, 'README.md'),
  '# Fixtures de QA — VS02\n\n' +
  'Generados por `qa/tools/make-vs02-fixtures.mjs`. Obra propia, sin terceros.\n\n' +
  'Existen para que un acierto se vea: nada de esto se parece a la colección de\n' +
  'la Fundación Arenas, así que una captura después de aplicar no puede\n' +
  'confundirse con la captura de antes.\n');

await browser.close();
console.log(`\n  fixtures en qa/fixtures/`);
