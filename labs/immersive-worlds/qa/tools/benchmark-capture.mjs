/**
 * External quality benchmark — capture, not clone.
 *
 * The VS02 mandate names one external site as a quality bar. It is not a
 * template and not a brand source: what is wanted from it is restraint,
 * composition, rhythm, typographic discipline and art-first presentation.
 * Looking at it in a real browser and keeping a few states means the bar can be
 * argued about with pictures instead of adjectives.
 *
 *   node qa/tools/benchmark-capture.mjs
 */
import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MODULE_ROOT = path.resolve(HERE, '..', '..');
const OUT = path.join(MODULE_ROOT, 'qa', 'evidence-vs02', 'benchmark');
const URL = process.env.IW_BENCHMARK_URL || 'https://thevertmenthe.dault-lafon.fr/';

await fs.mkdir(OUT, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox']
});
const notes = [];
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.setDefaultTimeout(90000);
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));

try {
  const response = await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
  notes.push(`HTTP ${response?.status()} · ${page.url()}`);
  await page.waitForTimeout(6000);

  const shoot = async (id, caption) => {
    await page.screenshot({ path: path.join(OUT, `${id}.png`) });
    notes.push(`${id}.png — ${caption}`);
    console.log(`  ${id}.png — ${caption}`);
  };

  await shoot('bm_01_entry', 'entrada — primera pantalla');
  // Typography and spacing read differently once the page has been scrolled into
  // its own rhythm, which is the quality actually being sampled.
  for (const [i, fraction] of [0.5, 1.2, 2.0].entries()) {
    await page.evaluate((f) => window.scrollTo({ top: window.innerHeight * f, behavior: 'instant' }), fraction);
    await page.waitForTimeout(2500);
    await shoot(`bm_0${i + 2}_scroll`, `desplazamiento ${fraction}× altura de ventana`);
  }

  const measured = await page.evaluate(() => {
    const body = getComputedStyle(document.body);
    const heads = [...document.querySelectorAll('h1,h2,h3')].slice(0, 6).map((h) => {
      const s = getComputedStyle(h);
      return `${h.tagName} ${s.fontFamily.split(',')[0]} ${s.fontSize}/${s.lineHeight} ls:${s.letterSpacing}`;
    });
    return {
      title: document.title,
      bodyFont: body.fontFamily,
      bodySize: body.fontSize,
      background: body.backgroundColor,
      color: body.color,
      headings: heads
    };
  });

  const narrow = await browser.newPage({ viewport: { width: 420, height: 860 } });
  await narrow.goto(URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await narrow.waitForTimeout(5000);
  await narrow.screenshot({ path: path.join(OUT, 'bm_05_narrow.png') });
  notes.push('bm_05_narrow.png — 420×860');
  await narrow.close();

  await fs.writeFile(path.join(OUT, 'benchmark.json'), JSON.stringify({
    url: URL, capturedAt: new Date().toISOString(), measured, notes, errors
  }, null, 1));
  console.log(`\n  ${JSON.stringify(measured, null, 1)}`);
} catch (error) {
  console.log(`  BENCHMARK UNREACHABLE: ${error.message}`);
  await fs.writeFile(path.join(OUT, 'benchmark.json'), JSON.stringify({
    url: URL, capturedAt: new Date().toISOString(), unreachable: String(error.message), notes, errors
  }, null, 1));
}

await browser.close();
