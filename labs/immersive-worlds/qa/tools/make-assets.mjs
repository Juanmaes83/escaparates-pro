/**
 * Generates the Fundación Arenas collection as real image files, using the
 * module's own plate generator. The output is ours: no third-party asset is
 * involved at any point.
 */
import { chromium } from 'playwright';
import fs from 'node:fs/promises';

import path from 'node:path';
import { fileURLToPath } from 'node:url';
const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../assets/collection');
await fs.mkdir(OUT, { recursive: true });

const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
page.on('pageerror', (e) => console.log('ERR', e.message));
await page.goto('http://127.0.0.1:4180/labs/immersive-worlds/index.html?reducedMotion=1&state=museum:lobby-entry');
await page.waitForFunction(() => window.__IW?.ready === true, { timeout: 40000 });

const PLATES = [
  { file: 'horizonte-interrumpido', composition: 'horizon-bands', palette: 'umber', aspect: 2.2 / 1.5 },
  { file: 'campo-de-ceniza', composition: 'field', palette: 'slate', aspect: 1.6 / 1.95 },
  { file: 'division-tercera', composition: 'hard-edge', palette: 'oxblood', aspect: 1.95 / 1.4 },
  { file: 'estudio-de-figura', composition: 'graphite-study', palette: 'umber', aspect: 0.92 / 1.18 },
  { file: 'noche-de-invierno', composition: 'photogravure', palette: 'prussian', aspect: 1.8 / 1.22 },
  { file: 'marea-baja', composition: 'field', palette: 'verdigris', aspect: 1 }
];

for (const plate of PLATES) {
  const dataUrl = await page.evaluate(async (spec) => {
    const { artworkTexture } = await import('/labs/immersive-worlds/scene-kits/museum/textures.js');
    const { DeterministicRNG } = await import('/labs/immersive-worlds/engine/core/rng.js');
    const texture = artworkTexture(new DeterministicRNG(`arenas:${spec.file}`), {
      composition: spec.composition, palette: spec.palette, aspect: spec.aspect, resolution: 1500
    });
    return texture.image.toDataURL('image/jpeg', 0.86);
  }, plate);
  const buffer = Buffer.from(dataUrl.split(',')[1], 'base64');
  await fs.writeFile(`${OUT}/${plate.file}.jpg`, buffer);
  console.log(`${plate.file}.jpg  ${(buffer.length / 1024).toFixed(0)} KB`);
}

// A short single-channel loop, recorded from the module's own generator.
const videoBase64 = await page.evaluate(async () => {
  const { createGeneratedVideoTexture } = await import('/labs/immersive-worlds/scene-kits/museum/textures.js');
  const { DeterministicRNG } = await import('/labs/immersive-worlds/engine/core/rng.js');
  const generated = createGeneratedVideoTexture(new DeterministicRNG('arenas:cuaderno-de-luz'), { size: 960 });
  const canvas = generated.texture.image;
  if (!canvas.captureStream) return null;

  const stream = canvas.captureStream(25);
  const chunks = [];
  const mime = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']
    .find((type) => window.MediaRecorder?.isTypeSupported(type));
  if (!mime) return null;

  const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 1_200_000 });
  recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };

  const done = new Promise((resolve) => { recorder.onstop = resolve; });
  recorder.start();
  const start = performance.now();
  await new Promise((resolve) => {
    const tick = () => {
      const elapsed = (performance.now() - start) / 1000;
      generated.update(elapsed * 2.2);
      if (elapsed >= 8) return resolve();
      return requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  recorder.stop();
  await done;

  const blob = new Blob(chunks, { type: mime });
  const reader = new FileReader();
  return new Promise((resolve) => {
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
});

if (videoBase64) {
  const buffer = Buffer.from(String(videoBase64).split(',')[1], 'base64');
  await fs.writeFile(`${OUT}/cuaderno-de-luz.webm`, buffer);
  console.log(`cuaderno-de-luz.webm  ${(buffer.length / 1024).toFixed(0)} KB`);
} else {
  console.log('video: MediaRecorder unavailable, keeping the runtime generator');
}

await browser.close();
