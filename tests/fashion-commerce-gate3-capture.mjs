import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'tests', 'phase-gate3-evidence');
fs.mkdirSync(outDir, { recursive: true });

const viewports = [
  { name: '1440x900', width: 1440, height: 900 },
  { name: '1280x800', width: 1280, height: 800 },
  { name: '834x1112', width: 834, height: 1112 },
  { name: '390x844', width: 390, height: 844 }
];

function load(p, context) { vm.runInContext(fs.readFileSync(p, 'utf8'), context, { filename: p }); }
function buildPristineHtml() {
  const context = vm.createContext({
    window: {}, console, URL, URLSearchParams, setTimeout, clearTimeout,
    requestAnimationFrame: () => 0, cancelAnimationFrame: () => undefined,
    matchMedia: () => ({ matches: false })
  });
  context.window = context;
  context.EP = {};
  load(path.join(root, 'js/studio/template-registry.js'), context);
  load(path.join(root, 'js/sector-blueprints.js'), context);
  load(path.join(root, 'js/sector-blueprints/fashion-commerce-pro.js'), context);
  const definition = context.EP.StudioTemplateRegistry.get('fashion-commerce-pro');
  return context.EP.SectorBlueprints.build('fashion-commerce-pro', [], definition.defaults);
}
function startServer(port) {
  return spawn(process.execPath, [path.join(root, 'tests', 'static-server.mjs'), String(port), root], { stdio: 'ignore' });
}

async function run() {
  const port = 4230;
  const server = startServer(port);
  await new Promise((resolve) => setTimeout(resolve, 600));
  const html = buildPristineHtml();
  fs.writeFileSync(path.join(outDir, 'builder-exported.html'), html);

  const browser = await chromium.launch();
  const results = [];

  for (const vp of viewports) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await ctx.newPage();
    await page.goto(`http://127.0.0.1:${port}/tests/phase-gate3-evidence/builder-exported.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => /ready|skipped/.test(document.querySelector('.rs-page')?.dataset.state || ''), { timeout: 20000 });

    await page.evaluate(() => {
      const el = document.getElementById('section2');
      window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY);
    });
    await page.waitForFunction(() => {
      const el = document.getElementById('section2');
      const rect = el.getBoundingClientRect();
      return Math.abs(rect.top) < 5;
    }, { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(300);
    const lookbookEditorial = path.join(outDir, `builder-lookbook-editorial-${vp.name}.png`);
    await page.screenshot({ path: lookbookEditorial });
    results.push(lookbookEditorial);

    const firstLookId = await page.evaluate(() => document.querySelector('.rs-look').getAttribute('data-look-id'));
    await page.click(`[data-toggle-shop="${firstLookId}"]`);
    await page.waitForTimeout(200);
    const lookbookShop = path.join(outDir, `builder-lookbook-shopview-${vp.name}.png`);
    await page.screenshot({ path: lookbookShop });
    results.push(lookbookShop);

    await page.click('[data-open-product="0"]');
    await page.waitForTimeout(150);
    await page.click('#rsReserve');
    await page.waitForTimeout(200);
    const reservationShot = path.join(outDir, `builder-reservation-${vp.name}.png`);
    await page.screenshot({ path: reservationShot });
    results.push(reservationShot);

    await ctx.close();
  }

  await browser.close();
  server.kill();
  console.log('Captured:\n' + results.join('\n'));
}

run().catch((err) => { console.error(err); process.exit(1); });
