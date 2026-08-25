/**
 * Do two frames differ, and where?
 *
 * A still cannot prove a video is playing. Two stills can, if something actually
 * changes in the region the video occupies and nothing changes in a region that
 * should be static — the control is what makes the measurement trustworthy.
 *
 * Decoding is done by the browser rather than by hand. A hand-rolled PNG reader
 * reported 0% difference everywhere, including the control, on two files whose
 * hashes differ — a diff that cannot detect change is not evidence.
 *
 *   node qa/tools/frame-diff.mjs a.png b.png x0 y0 x1 y1 [cx0 cy0 cx1 cy1]
 */
import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const [, , aPath, bPath, ...nums] = process.argv;
const [x0, y0, x1, y1, cx0, cy0, cx1, cy1] = nums.map(Number);

const toDataUri = async (p) =>
  `data:image/png;base64,${(await fs.readFile(p)).toString('base64')}`;

const browser = await chromium.launch({ headless: true, args: ['--disable-gpu-sandbox'] });
const page = await browser.newPage();
const result = await page.evaluate(async ({ a, b, box, control }) => {
  const load = (src) => new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => rej(new Error('decode failed'));
    img.src = src;
  });
  const [ia, ib] = await Promise.all([load(a), load(b)]);
  const read = (img) => {
    const c = document.createElement('canvas');
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    const x = c.getContext('2d', { willReadFrequently: true });
    x.drawImage(img, 0, 0);
    return { data: x.getImageData(0, 0, c.width, c.height).data, w: c.width, h: c.height };
  };
  const A = read(ia); const B = read(ib);
  if (A.w !== B.w || A.h !== B.h) return { error: `distinto tamaño: ${A.w}×${A.h} vs ${B.w}×${B.h}` };

  const measure = (r) => {
    if (!r) return null;
    let changed = 0; let total = 0; let max = 0; let sum = 0;
    // Where the change is, not only how much: a percentage cannot tell you that
    // the moving pixels are in a different place than you were looking.
    let bbox = null;
    for (let y = r[1]; y < r[3]; y += 1) {
      for (let x = r[0]; x < r[2]; x += 1) {
        const i = (y * A.w + x) * 4;
        const d = Math.abs(A.data[i] - B.data[i])
          + Math.abs(A.data[i + 1] - B.data[i + 1])
          + Math.abs(A.data[i + 2] - B.data[i + 2]);
        total += 1; sum += d;
        if (d > 12) {
          changed += 1;
          bbox = bbox
            ? [Math.min(bbox[0], x), Math.min(bbox[1], y), Math.max(bbox[2], x), Math.max(bbox[3], y)]
            : [x, y, x, y];
        }
        if (d > max) max = d;
      }
    }
    return { changed, total, pct: +(100 * changed / total).toFixed(2), maxDelta: max, meanDelta: +(sum / total).toFixed(2), bbox };
  };

  return { size: `${A.w}×${A.h}`, region: measure(box), control: measure(control) };
}, {
  a: await toDataUri(aPath),
  b: await toDataUri(bPath),
  box: [x0, y0, x1, y1],
  control: Number.isFinite(cx0) ? [cx0, cy0, cx1, cy1] : null
});

console.log(JSON.stringify({ a: path.basename(aPath), b: path.basename(bPath), ...result }, null, 1));
await browser.close();
