import { test, expect } from '@playwright/test';

const URL = process.env.BREEZE_MUSEUM_URL ||
  'https://escaparates-cfegbk7jv-juanma-espinosas-projects.vercel.app/labs/immersive-worlds/breeze-integration-studio.html?authoring=1&world=.%2Fworlds%2Fmuseum-v1.world.json';

const artifact = (name) => test.info().outputPath(name);

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
    selects: [...document.querySelectorAll('select')].map((el) => ({
      value: el.value,
      options: [...el.options].map((o) => o.textContent?.trim())
    })),
    buttons: [...document.querySelectorAll('button')].map((el) => el.textContent?.trim()).filter(Boolean),
    ranges: [...document.querySelectorAll('input[type="range"]')].map((el) => ({
      value: el.value, min: el.min, max: el.max, step: el.step,
      label: el.getAttribute('aria-label') || el.name || el.id || null
    })),
    fileInputs: document.querySelectorAll('input[type="file"]').length
  }));
}

test('Museum Breeze native controls own input and react', async ({ page }) => {
  test.setTimeout(90_000);
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => consoleErrors.push(`pageerror: ${err.message}`));

  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.waitForTimeout(5_000);

  // The test entry is expected to open directly into the Breeze authoring room.
  // If Museum lifecycle needs a beat, wait for the specialised nested guest.
  const { iframe, frame } = await getBreezeFrame(page);

  await page.screenshot({ path: artifact('01-museum-breeze-loaded.png'), fullPage: true });
  await frame.waitForLoadState('domcontentloaded');
  await frame.waitForTimeout(2_000);

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

  console.log('BREEZE_HIT_TEST', JSON.stringify(diagnostics));
  expect(diagnostics.inputOwner).toBe('guest');
  expect(diagnostics.studioBodyPointerEvents).toBe('none');
  expect(diagnostics.iframePointerEvents).toBe('auto');
  expect(diagnostics.hitIsIframe, `Expected iframe to win hit-test, got ${JSON.stringify(diagnostics)}`).toBe(true);

  const controlsBefore = await logControls(frame);
  console.log('BREEZE_CONTROLS_BEFORE', JSON.stringify(controlsBefore));
  expect(controlsBefore.selects.length, 'Breeze must expose Experience select').toBeGreaterThan(0);
  expect(controlsBefore.ranges.length, 'Breeze must expose grading/scene range controls').toBeGreaterThan(0);

  // Gate 1 — Experience: use real focus + keyboard input, not DOM mutation.
  const experience = frame.locator('select').first();
  await expect(experience).toBeVisible();
  const beforeExperience = await experience.inputValue();
  await experience.click();
  await experience.press('ArrowDown');
  await experience.press('Enter');
  await frame.waitForTimeout(750);
  const afterExperience = await experience.inputValue();
  console.log('BREEZE_EXPERIENCE', { beforeExperience, afterExperience });
  expect(afterExperience, 'Experience must change after native keyboard interaction').not.toBe(beforeExperience);

  // Gate 2 — Grading/slider: choose the last visible range as a robust grading candidate.
  // Move it through native keyboard input and prove the live control state changes.
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
  console.log('BREEZE_GRADING', { beforeGrade, afterGrade, rangeCount });
  expect(afterGrade, 'A native Breeze slider must change value').not.toBe(beforeGrade);

  // Gate 3 — Upload: real browser file chooser event must be emitted by Breeze.
  const uploadButtons = frame.getByRole('button', { name: /SUBIR\s+imagen\s*\/\s*vídeo/i });
  const uploadCount = await uploadButtons.count();
  console.log('BREEZE_UPLOAD_BUTTONS', uploadCount);
  expect(uploadCount, 'Breeze must expose at least one upload button').toBeGreaterThan(0);
  const chooserPromise = page.waitForEvent('filechooser', { timeout: 10_000 });
  await uploadButtons.first().click();
  const chooser = await chooserPromise;
  expect(chooser.isMultiple()).toBeDefined();
  console.log('BREEZE_FILECHOOSER', { emitted: true, multiple: chooser.isMultiple() });

  await page.screenshot({ path: artifact('02-museum-breeze-after-controls.png'), fullPage: true });
  const controlsAfter = await logControls(frame);
  console.log('BREEZE_CONTROLS_AFTER', JSON.stringify(controlsAfter));
  console.log('BREEZE_CONSOLE_ERRORS', JSON.stringify(consoleErrors));
});
