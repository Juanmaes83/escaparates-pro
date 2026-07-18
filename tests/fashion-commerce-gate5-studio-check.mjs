import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import path from 'node:path';

const root = process.cwd();

function preview(page, fn, arg) {
  return page.locator('#preview').evaluate((frame, payload) => {
    const run = new Function('win', 'doc', 'arg', `return (${payload.source})(win, doc, arg);`);
    return run(frame.contentWindow, frame.contentDocument, payload.arg);
  }, { source: fn.toString(), arg });
}

async function run() {
  const port = 4270;
  const server = spawn(process.execPath, [path.join(root, 'tests', 'static-server.mjs'), String(port), root], { stdio: 'ignore' });
  await new Promise((r) => setTimeout(r, 600));
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) console.log('CONSOLE', m.type(), m.text()); });
  page.on('pageerror', (e) => console.log('PAGEERROR', e.message));

  console.log('t0', Date.now());
  await page.goto(`http://127.0.0.1:${port}/studio.html?template=fashion-commerce-pro`, { waitUntil: 'domcontentloaded' });
  await page.locator('#previewLoading').waitFor({ state: 'hidden', timeout: 30000 });
  await page.waitForFunction(() => Boolean(document.querySelector('#preview')?.contentDocument?.querySelector('.rs-page')), { timeout: 20000 });
  console.log('t1 ready', Date.now());

  await preview(page, (win, doc) => doc.getElementById('section5')?.scrollIntoView());
  console.log('t2 scrolled to newsletter', Date.now());
  await page.locator('#preview').contentFrame().locator('#rsNewsletterSubscribe').click({ timeout: 8000 });
  console.log('t3 clicked subscribe empty', Date.now());
  console.log('error visible', await page.locator('#preview').contentFrame().locator('#rsNewsletterError').isVisible());

  await page.locator('#preview').contentFrame().locator('#rsNewsletterEmail').fill('qa@example.com');
  await page.locator('#preview').contentFrame().locator('#rsNewsletterSubscribe').click({ timeout: 8000 });
  console.log('t4 clicked subscribe valid', Date.now());
  console.log('code visible', await page.locator('#preview').contentFrame().locator('.rs-newsletter-code').isVisible());

  await preview(page, (win, doc) => doc.getElementById('section6')?.scrollIntoView());
  console.log('t5 scrolled to footer', Date.now());
  console.log('liveViewers', await page.locator('#preview').contentFrame().locator('#rsLiveViewers').textContent());

  console.log('backToTop show class', await preview(page, (win, doc) => doc.getElementById('rsBackToTop')?.classList.contains('show')));
  console.log('hero muted before', await preview(page, (win, doc) => doc.querySelector('.rs-hero-video')?.muted));
  await page.locator('#preview').contentFrame().locator('#rsBackToTop').click({ timeout: 8000 });
  console.log('t6 clicked back to top', Date.now());
  await page.waitForFunction(() => document.querySelector('#preview')?.contentDocument?.getElementById('section0')?.getBoundingClientRect().top < 200, { timeout: 8000 });
  console.log('t7 scrolled to top', Date.now());

  await browser.close();
  server.kill();
  console.log('DONE');
}

run().catch((err) => { console.error('FAILED', err); process.exit(1); });
