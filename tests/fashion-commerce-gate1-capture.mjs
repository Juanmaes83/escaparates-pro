import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'tests', 'phase-gate1-evidence');
fs.mkdirSync(outDir, { recursive: true });

const viewports = [
  { name: '1440x900', width: 1440, height: 900 },
  { name: '1280x800', width: 1280, height: 800 },
  { name: '834x1112', width: 834, height: 1112 },
  { name: '390x844', width: 390, height: 844 }
];

function load(p, context) {
  vm.runInContext(fs.readFileSync(p, 'utf8'), context, { filename: p });
}

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
  const port = 4177;
  const server = startServer(port);
  await new Promise((resolve) => setTimeout(resolve, 600));

  const html = buildPristineHtml();
  const exportedPath = path.join(outDir, 'builder-exported.html');
  fs.writeFileSync(exportedPath, html);

  const browser = await chromium.launch();
  const results = [];

  for (const vp of viewports) {
    const builderContext = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const builderPage = await builderContext.newPage();
    await builderPage.goto(`http://127.0.0.1:${port}/tests/phase-gate1-evidence/builder-exported.html`, { waitUntil: 'domcontentloaded' });
    await builderPage.waitForFunction(() => /ready|skipped/.test(document.querySelector('.rs-page')?.dataset.state || ''), { timeout: 20000 });
    await builderPage.waitForTimeout(400);
    const builderShot = path.join(outDir, `builder-${vp.name}.png`);
    await builderPage.screenshot({ path: builderShot });
    results.push(builderShot);
    await builderContext.close();

    const sourceContext = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const sourcePage = await sourceContext.newPage();
    try {
      await sourcePage.goto('https://juanmaes83.github.io/WEB-PREMIUM-MODA-CON-CLAUDE/', { waitUntil: 'domcontentloaded', timeout: 20000 });
      await sourcePage.waitForFunction(() => document.getElementById('preloader')?.classList.contains('hidden'), { timeout: 20000 }).catch(() => {});
      await sourcePage.waitForTimeout(900);
      const sourceShot = path.join(outDir, `source-${vp.name}.png`);
      await sourcePage.screenshot({ path: sourceShot });
      results.push(sourceShot);
    } catch (err) {
      console.error(`Source capture failed for ${vp.name}:`, err.message);
    }
    await sourceContext.close();
  }

  await browser.close();
  server.kill();
  console.log('Captured:\n' + results.join('\n'));
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
