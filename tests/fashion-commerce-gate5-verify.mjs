import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

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
  const port = 4260;
  const server = startServer(port);
  await new Promise((resolve) => setTimeout(resolve, 600));
  const outDir = path.join(root, 'tests', 'phase-gate5-evidence');
  fs.mkdirSync(outDir, { recursive: true });
  const html = buildPristineHtml();
  fs.writeFileSync(path.join(outDir, 'verify-exported.html'), html);

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.setDefaultTimeout(8000);
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) console.log('CONSOLE', m.type(), m.text()); });
  page.on('pageerror', (e) => console.log('PAGEERROR', e.message));

  await page.goto(`http://127.0.0.1:${port}/tests/phase-gate5-evidence/verify-exported.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => /ready|skipped/.test(document.querySelector('.rs-page')?.dataset.state || ''), { timeout: 20000 });
  console.log('ready');

  await page.evaluate(() => document.getElementById('section5').scrollIntoView());
  console.log('scrolled to newsletter');

  await page.locator('#rsNewsletterSubscribe').click();
  console.log('clicked subscribe (empty)');
  console.log('error visible:', await page.locator('#rsNewsletterError').isVisible());

  await page.locator('#rsNewsletterEmail').fill('not-an-email');
  await page.locator('#rsNewsletterSubscribe').click();
  console.log('clicked subscribe (invalid)');
  console.log('error visible:', await page.locator('#rsNewsletterError').isVisible());

  await page.locator('#rsNewsletterEmail').fill('qa@example.com');
  await page.locator('#rsNewsletterSubscribe').click();
  console.log('clicked subscribe (valid)');
  console.log('error visible:', await page.locator('#rsNewsletterError').isVisible());
  console.log('code visible:', await page.locator('.rs-newsletter-code').isVisible());

  await page.locator('.rs-newsletter-reset').click();
  console.log('clicked reset');
  console.log('code count after reset:', await page.locator('.rs-newsletter-code').count());

  await page.locator('.rs-pill[data-interest="mujer"]').click();
  console.log('pill mujer pressed:', await page.locator('.rs-pill[data-interest="mujer"]').getAttribute('aria-pressed'));

  await page.evaluate(() => document.getElementById('section6').scrollIntoView());
  console.log('scrolled to footer');
  await page.waitForTimeout(300);
  console.log('liveViewers text:', await page.locator('#rsLiveViewers').textContent());
  console.log('certFill width:', await page.locator('#rsCertificateFill').evaluate(el => el.style.width));

  console.log('backToTop has show class:', await page.locator('#rsBackToTop').evaluate(el => el.classList.contains('show')));
  console.log('hero video muted (before audio click):', await page.evaluate(() => document.querySelector('.rs-hero-video')?.muted));
  await page.locator('#rsAudio').click();
  console.log('clicked rsAudio');
  console.log('hero video muted (after audio click):', await page.evaluate(() => document.querySelector('.rs-hero-video')?.muted));
  console.log('rsAudio aria-pressed:', await page.locator('#rsAudio').getAttribute('aria-pressed'));

  await page.locator('#rsBackToTop').click();
  console.log('clicked back to top');
  await page.waitForFunction(() => document.getElementById('section0').getBoundingClientRect().top < 200, { timeout: 5000 });
  console.log('scrolled to top OK');
  console.log('backToTop has show class after top:', await page.locator('#rsBackToTop').evaluate(el => el.classList.contains('show')));

  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => document.getElementById('section3').scrollIntoView());
  const overlap = await page.evaluate(() => {
    const a = document.getElementById('rsFloating')?.getBoundingClientRect();
    const b = document.querySelector('.rs-floating-utilities')?.getBoundingClientRect();
    if (!a || !b) return null;
    return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
  });
  console.log('mobile overlap:', overlap);

  await browser.close();
  server.kill();
  console.log('DONE');
}

run().catch((err) => { console.error('FAILED', err); process.exit(1); });
