import { test, expect } from '@playwright/test';

const URL = process.env.BREEZE_MUSEUM_URL ||
  'https://escaparates-cfegbk7jv-juanma-espinosas-projects.vercel.app/labs/immersive-worlds/breeze-integration-studio.html?authoring=1&world=.%2Fworlds%2Fmuseum-v1.world.json';

const artifact = (name) => test.info().outputPath(name);

async function bestEffortScreenshot(page, name) {
  try {
    await page.screenshot({ path: artifact(name), fullPage: true, timeout: 10_000 });
    console.log('BREEZE_SCREENSHOT', JSON.stringify({ name, captured: true }));
  } catch (error) {
    console.log('BREEZE_SCREENSHOT', JSON.stringify({ name, captured: false, error: String(error?.message || error) }));
  }
}

async function enterBreezeRoom(page) {
  const room = page.getByRole('button', { name: /Sala Breeze\s+—\s+Viento sobre mármol/i }).first();
  await expect(room).toBeVisible({ timeout: 20_000 });
  await room.click();
  await page.waitForTimeout(2_000);
}

async function getBreezeFrame(page) {
  const iframe = page.locator('iframe[data-nested-room-studio="room.breeze"]');
  await expect(iframe).toBeVisible({ timeout: 30_000 });
  const handle = await iframe.elementHandle();
  const frame = await handle.contentFrame();
  expect(frame, 'Breeze iframe must expose a same-origin browsing context').toBeTruthy();
  return { iframe, frame };
}

async function logControls(frame) {
  return frame.evaluate(() => ({
    title: document.title,
    bodyText: document.body?.innerText?.slice(0, 2500) || '',
    navigatorGpu: Boolean(navigator.gpu),
    selects: [...document.querySelectorAll('select')].map((el) => ({
      value: el.value,
      options: [...el.options].map((o) => o.textContent?.trim())
    })),
    buttons: [...document.querySelectorAll('button')].map((el) => el.textContent?.trim()).filter(Boolean),
    ranges: [...document.querySelectorAll('input[type="range"]')].map((el) => ({
      value: el.value, min: el.min, max: el.max, step: el.step,
      label: el.getAttribute('aria-label') || el.name || el.id || null
    })),
    fileInputs: document.querySelectorAll('input[type="file"]').length,
    canvases: document.querySelectorAll('canvas').length,
    scripts: [...document.scripts].map((s) => s.src).filter(Boolean)
  }));
}

test('Museum Breeze native controls own input and react', async ({ page }) => {
  test.setTimeout(120_000);
  const consoleErrors = [];
  const allConsole = [];
  page.on('console', (msg) => {
    allConsole.push(`${msg.type()}: ${msg.text()}`);
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => consoleErrors.push(`pageerror: ${err.message}`));

  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.waitForTimeout(5_000);
  await enterBreezeRoom(page);

  const { frame } = await getBreezeFrame(page);
  await frame.waitForLoadState('domcontentloaded');
  await frame.waitForTimeout(7_000);
  await bestEffortScreenshot(page, '01-museum-breeze-loaded.png');

  const diagnostics = await page.evaluate(() => {
    const guest = window.__IW?.nestedRoomHost?.guest || window.__IW_BREEZE_PHASE1?.runtime?.nestedRoomHost?.guest || null;
    const iframe = document.querySelector('iframe[data-nested-room-studio="room.breeze"]');
    const body = document.querySelector('.st-body');
    if (!iframe) return { error: 'iframe-not-found' };
    const r = iframe.getBoundingClientRect();
    const sample = { x: r.left + r.width * 0.68, y: r.top + r.height * 0.42 };
    const hit = document.elementFromPoint(sample.x, sample.y);
    return {
      inputOwner: document.body.dataset.breezeInputOwner || null,
      studioBodyPointerEvents: body ? getComputedStyle(body).pointerEvents : null,
      iframePointerEvents: getComputedStyle(iframe).pointerEvents,
      iframeRect: { left: r.left, top: r.top, width: r.width, height: r.height },
      sample,
      hitTag: hit?.tagName || null,
      hitClass: hit?.className || null,
      hitIsIframe: hit === iframe,
      guestReport: typeof guest?.report === 'function' ? guest.report() : null
    };
  });

  const controlsBefore = await logControls(frame);
  console.log('BREEZE_HIT_TEST', JSON.stringify(diagnostics));
  console.log('BREEZE_RUNTIME_BEFORE_ASSERT', JSON.stringify(controlsBefore));
  console.log('BREEZE_CONSOLE_BEFORE_ASSERT', JSON.stringify(allConsole));
  console.log('BREEZE_ERRORS_BEFORE_ASSERT', JSON.stringify(consoleErrors));

  expect(diagnostics.inputOwner).toBe('guest');
  expect(diagnostics.studioBodyPointerEvents).toBe('none');
  expect(diagnostics.iframePointerEvents).toBe('auto');
  expect(diagnostics.hitIsIframe, `Expected iframe to win hit-test, got ${JSON.stringify(diagnostics)}`).toBe(true);
  expect(controlsBefore.navigatorGpu, 'Breeze V4.1 requires navigator.gpu in the guest').toBe(true);
  expect(controlsBefore.selects.length, 'Breeze must expose Experience select').toBeGreaterThan(0);
  expect(controlsBefore.ranges.length, 'Breeze must expose grading/scene range controls').toBeGreaterThan(0);

  const experience = frame.locator('select').first();
  await expect(experience).toBeVisible();
  const beforeExperience = await experience.inputValue();
  await experience.click();
  await experience.press('ArrowDown');
  await experience.press('Enter');
  await frame.waitForTimeout(750);
  const afterExperience = await experience.inputValue();
  console.log('BREEZE_EXPERIENCE', JSON.stringify({ beforeExperience, afterExperience }));
  expect(afterExperience, 'Experience must change after native keyboard interaction').not.toBe(beforeExperience);

  const ranges = frame.locator('input[type="range"]:visible');
  const rangeCount = await ranges.count();
  expect(rangeCount).toBeGreaterThan(0);
  const grading = ranges.nth(rangeCount - 1);
  const beforeGrade = await grading.inputValue();
  await grading.click();
  await grading.press('Home');
  await grading.press('ArrowRight');
  await frame.waitForTimeout(500);
  const afterGrade = await grading.inputValue();
  console.log('BREEZE_GRADING', JSON.stringify({ beforeGrade, afterGrade, rangeCount }));
  expect(afterGrade, 'A native Breeze slider must change value').not.toBe(beforeGrade);

  const uploadButtons = frame.getByRole('button', { name: /SUBIR\s+imagen\s*\/\s*vídeo/i });
  const uploadCount = await uploadButtons.count();
  console.log('BREEZE_UPLOAD_BUTTONS', uploadCount);
  expect(uploadCount, 'Breeze must expose at least one upload button').toBeGreaterThan(0);
  const chooserPromise = page.waitForEvent('filechooser', { timeout: 10_000 });
  await uploadButtons.first().click();
  const chooser = await chooserPromise;
  console.log('BREEZE_FILECHOOSER', JSON.stringify({ emitted: true, multiple: chooser.isMultiple() }));

  await bestEffortScreenshot(page, '02-museum-breeze-after-controls.png');
  const controlsAfter = await logControls(frame);
  console.log('BREEZE_CONTROLS_AFTER', JSON.stringify(controlsAfter));
  console.log('BREEZE_CONSOLE_ERRORS', JSON.stringify(consoleErrors));
});
