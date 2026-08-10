/**
 * Keyframe extractor. No ffmpeg here, but Chromium decodes VP9, so the browser
 * is the decoder: load, seek, draw to a canvas, save. Served over a
 * Range-capable server, which Chromium's media stack requires.
 */
import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const [, , url, outDir, countArg] = process.argv;
const count = Number(countArg || 16);
await fs.mkdir(outDir, { recursive: true });

const browser = await chromium.launch({
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required']
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on('pageerror', (e) => console.log('ERR', e.message));

// Same origin as the media, so the canvas stays untainted and toDataURL works.
await page.goto('http://127.0.0.1:4190/', { waitUntil: 'domcontentloaded' }).catch(() => {});
const meta = await page.evaluate((src) => new Promise((resolve, reject) => {
  const v = document.createElement('video');
  v.id = 'v';
  v.muted = true;
  v.preload = 'auto';
  v.onloadedmetadata = () => resolve({ duration: v.duration, w: v.videoWidth, h: v.videoHeight });
  v.onerror = () => reject(new Error(`decode failed: ${v.error?.code} ${v.error?.message}`));
  v.src = src;
  document.body.appendChild(v);
  setTimeout(() => reject(new Error('metadata timeout')), 60000);
}), url);
console.log('META', JSON.stringify(meta));

for (let i = 0; i < count; i += 1) {
  const t = (meta.duration * (i + 0.5)) / count;
  const dataUrl = await page.evaluate(async (time) => {
    const v = document.getElementById('v');
    await new Promise((resolve) => {
      const done = () => { v.removeEventListener('seeked', done); resolve(); };
      v.addEventListener('seeked', done);
      v.currentTime = time;
    });
    const c = document.createElement('canvas');
    const scale = Math.min(1, 1000 / v.videoWidth);
    c.width = Math.round(v.videoWidth * scale);
    c.height = Math.round(v.videoHeight * scale);
    c.getContext('2d').drawImage(v, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', 0.8);
  }, t);
  await fs.writeFile(`${outDir}/f${String(i).padStart(2, '0')}_${t.toFixed(1)}s.jpg`,
    Buffer.from(dataUrl.split(',')[1], 'base64'));
}
console.log('wrote', count, 'frames to', outDir);
await browser.close();
