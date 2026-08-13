import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'tests', 'phase-gate2-evidence');
fs.mkdirSync(outDir, { recursive: true });

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

async function freshPage(browser, port) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`http://127.0.0.1:${port}/tests/phase-gate2-evidence/builder-exported.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => /ready|skipped/.test(document.querySelector('.rs-page')?.dataset.state || ''), { timeout: 20000 });
  await page.evaluate(() => document.getElementById('section1').scrollIntoView());
  await page.waitForTimeout(300);
  return { page, errors };
}

async function run() {
  const port = 4184;
  const server = startServer(port);
  await new Promise((resolve) => setTimeout(resolve, 600));
  const html = buildPristineHtml();
  fs.writeFileSync(path.join(outDir, 'builder-exported.html'), html);

  const browser = await chromium.launch();
  const report = {};

  // 1. Wheel-hijack, targeted at the actual trackShell box.
  {
    const { page } = await freshPage(browser, port);
    const box = await page.locator('#rsTrackShell').boundingBox();
    await page.mouse.move(box.x + box.width / 2, Math.min(box.y + box.height / 2, 850));
    const before = await page.evaluate(() => ({ scrollLeft: document.getElementById('rsTrackShell').scrollLeft, pageY: window.scrollY }));
    await page.mouse.wheel(0, 400);
    await page.waitForTimeout(200);
    const after = await page.evaluate(() => ({ scrollLeft: document.getElementById('rsTrackShell').scrollLeft, pageY: window.scrollY }));
    report.wheelHijack = { box, before, after, moved: after.scrollLeft > before.scrollLeft, pageStayedPut: after.pageY === before.pageY };
    await page.close();
  }

  // 2. Boundary release at scrollLeft=0 (page should be free to scroll on wheel-up).
  {
    const { page } = await freshPage(browser, port);
    const consumed = await page.evaluate(() => {
      const shell = document.getElementById('rsTrackShell');
      const ev = new WheelEvent('wheel', { deltaY: -100, bubbles: true, cancelable: true });
      shell.dispatchEvent(ev);
      return ev.defaultPrevented;
    });
    report.boundaryReleaseAtStart = { consumed, expected: false };
    await page.close();
  }

  // 3. Pointer drag. Uses direct PointerEvent dispatch: Playwright's mouse.move/down/up
  // loses subsequent pointermove delivery once the page calls setPointerCapture mid-gesture
  // (a CDP/synthetic-input limitation, confirmed separately against elementFromPoint hit-testing
  // and direct dispatch — not an app bug), so this exercises the real app logic directly.
  {
    const { page } = await freshPage(browser, port);
    const result = await page.evaluate(() => {
      const shell = document.getElementById('rsTrackShell');
      const rect = shell.getBoundingClientRect();
      const startX = rect.x + rect.width - 80;
      const y = Math.min(rect.y + 100, window.innerHeight - 50);
      function fire(type, x) {
        shell.dispatchEvent(new PointerEvent(type, { clientX: x, clientY: y, pointerId: 1, bubbles: true, cancelable: true, isPrimary: true }));
      }
      const before = shell.scrollLeft;
      fire('pointerdown', startX);
      fire('pointermove', startX - 40);
      const midDragging = shell.classList.contains('dragging');
      const midSnapSuspended = shell.style.scrollSnapType === 'none';
      fire('pointermove', startX - 250);
      const afterScrollLeft = shell.scrollLeft;
      fire('pointerup', startX - 250);
      const snapRestored = shell.style.scrollSnapType === '';
      return { before, midDragging, midSnapSuspended, afterScrollLeft, snapRestored };
    });
    report.pointerDrag = { ...result, moved: result.afterScrollLeft > result.before };
    await page.close();
  }

  // 4. Keyboard nav.
  {
    const { page } = await freshPage(browser, port);
    await page.evaluate(() => document.getElementById('rsTrackShell').focus());
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(500);
    const scrollLeft = await page.evaluate(() => document.getElementById('rsTrackShell').scrollLeft);
    report.keyboardNav = { scrollLeft, moved: scrollLeft > 0 };
    await page.close();
  }

  // 5. Runway mode.
  {
    const { page } = await freshPage(browser, port);
    await page.click('#rsRunway');
    await page.waitForTimeout(600);
    const mid = await page.evaluate(() => ({
      onClass: document.querySelector('.rs-page').classList.contains('runway-on'),
      progress: getComputedStyle(document.querySelector('.rs-page')).getPropertyValue('--runway-progress'),
      label: document.getElementById('rsRunway').textContent,
      activeCards: document.querySelectorAll('.rs-card.runway-active').length
    }));
    await page.waitForTimeout(2700);
    const advanced = await page.evaluate(() => getComputedStyle(document.querySelector('.rs-page')).getPropertyValue('--runway-progress'));
    await page.click('#rsRunway');
    await page.waitForTimeout(200);
    const stopped = await page.evaluate(() => ({
      onClass: document.querySelector('.rs-page').classList.contains('runway-on'),
      label: document.getElementById('rsRunway').textContent
    }));
    report.runway = { mid, advanced, stopped };
    await page.close();
  }

  // 6. Product modal.
  {
    const { page } = await freshPage(browser, port);
    const btn = page.locator('[data-open-product="0"]').first();
    await btn.waitFor({ state: 'visible', timeout: 5000 });
    await btn.click();
    await page.waitForTimeout(150);
    const opened = await page.evaluate(() => ({
      open: document.getElementById('rsModal').classList.contains('open'),
      meta: document.getElementById('rsModalMeta').textContent,
      focused: document.activeElement.id,
      colorPop: document.querySelectorAll('[data-product-index="0"] .color-pop').length
    }));
    await page.keyboard.press('Escape');
    await page.waitForTimeout(150);
    const closed = await page.evaluate(() => ({
      open: document.getElementById('rsModal').classList.contains('open'),
      colorPopRemaining: document.querySelectorAll('.color-pop').length
    }));
    report.modal = { opened, closed };
    await page.screenshot({ path: path.join(outDir, 'gate2-gallery-desktop.png') });
    await page.close();
  }

  console.log(JSON.stringify(report, null, 2));
  await browser.close();
  server.kill();
}

run().catch((err) => { console.error(err); process.exit(1); });
