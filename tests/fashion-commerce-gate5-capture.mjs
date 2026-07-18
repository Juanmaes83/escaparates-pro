import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'tests', 'phase-gate5-evidence');
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
async function scrollToSection(page, id) {
  await page.evaluate((sectionId) => {
    const el = document.getElementById(sectionId);
    window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY);
  }, id);
  await page.waitForFunction((sectionId) => Math.abs(document.getElementById(sectionId).getBoundingClientRect().top) < 5, id, { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(400);
}

const sourceSections = [
  { name: 'newsletter', id: 'section5' },
  { name: 'footer', id: 'section6' }
];

async function run() {
  const port = 4251;
  const server = startServer(port);
  await new Promise((resolve) => setTimeout(resolve, 600));
  const html = buildPristineHtml();
  fs.writeFileSync(path.join(outDir, 'builder-exported.html'), html);

  const browser = await chromium.launch();
  const results = [];

  for (const vp of viewports) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await ctx.newPage();
    await page.goto(`http://127.0.0.1:${port}/tests/phase-gate5-evidence/builder-exported.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => /ready|skipped/.test(document.querySelector('.rs-page')?.dataset.state || ''), { timeout: 20000 });

    for (const section of sourceSections) {
      await scrollToSection(page, section.id);
      const shot = path.join(outDir, `builder-${section.name}-${vp.name}.png`);
      await page.screenshot({ path: shot });
      results.push(shot);
    }

    // Floating utilities cluster (audio/back-to-top vs floating CTA) — scroll deep so both are visible/active.
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(400);
    const utilShot = path.join(outDir, `builder-floating-utilities-${vp.name}.png`);
    await page.screenshot({ path: utilShot });
    results.push(utilShot);
    await ctx.close();

    const sctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const spage = await sctx.newPage();
    try {
      await spage.goto('https://juanmaes83.github.io/WEB-PREMIUM-MODA-CON-CLAUDE/', { waitUntil: 'domcontentloaded', timeout: 20000 });
      await spage.waitForFunction(() => document.getElementById('preloader')?.classList.contains('hidden'), { timeout: 20000 }).catch(() => {});
      await spage.waitForTimeout(900);
      for (const section of sourceSections) {
        await scrollToSection(spage, section.id);
        const shot = path.join(outDir, `source-${section.name}-${vp.name}.png`);
        await spage.screenshot({ path: shot });
        results.push(shot);
      }
      await spage.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      await spage.waitForTimeout(400);
      const sUtilShot = path.join(outDir, `source-floating-utilities-${vp.name}.png`);
      await spage.screenshot({ path: sUtilShot });
      results.push(sUtilShot);
    } catch (err) {
      console.error(`Source capture failed for ${vp.name}:`, err.message);
    }
    await sctx.close();
  }

  await browser.close();
  server.kill();
  console.log('Captured ' + results.length + ' screenshots');
}

run().catch((err) => { console.error(err); process.exit(1); });
