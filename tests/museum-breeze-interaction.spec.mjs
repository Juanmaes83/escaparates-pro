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
      id: el.id || null,
      visible: Boolean(el.offsetWidth || el.offsetHeight || el.getClientRects().length),
      value: el.value,
      options: [...el.options].map((o) => o.textContent?.trim())
    })),
    buttons: [...document.querySelectorAll('button')].map((el) => el.textContent?.trim()).filter(Boolean),
    ranges: [...document.querySelectorAll('input[type="range"]')].map((el) => ({
      value: el.value, min: el.min, max: el.max, step: el.step,
      label: el.getAttribute('aria-label') || el.name || el.id || null
    })),
    fileInputs: [...document.querySelectorAll('input[type="file"]')].map((el) => ({
      id: el.id || null,
      accept: el.accept || null,
      parentText: el.parentElement?.innerText?.trim()?.slice(0, 180) || null
    })),
    canvases: document.querySelectorAll('canvas').length,
    scripts: [...document.scripts].map((s) => s.src).filter(Boolean)
  }));
}

test('Museum Breeze native PRO controls own input and react', async ({ page }) => {
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
      hitTag: hit?.tagName || null,
      hitIsIframe: hit === iframe
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
  expect(diagnostics.hitIsIframe).toBe(true);
  expect(controlsBefore.navigatorGpu, 'Breeze V4.1 requires navigator.gpu in the guest').toBe(true);

  // 1) EXPERIENCE — target the visible Breeze Studio PRO selector, not Tweakpane's hidden select.
  const experience = frame.locator('select').filter({ hasText: 'Product Reveal' });
  await expect(experience).toHaveCount(1);
  await expect(experience).toBeVisible({ timeout: 20_000 });
  const beforeExperience = await experience.inputValue();
  const values = await experience.locator('option').evaluateAll((opts) => opts.map((o) => o.value));
  const nextExperience = values.find((v) => v !== beforeExperience);
  expect(nextExperience, 'Experience selector must provide another preset').toBeTruthy();
  await experience.selectOption(nextExperience);
  await frame.waitForTimeout(1_250);
  const afterExperience = await experience.inputValue();
  console.log('BREEZE_EXPERIENCE', JSON.stringify({ beforeExperience, nextExperience, afterExperience }));
  expect(afterExperience).toBe(nextExperience);

  // 2) GRADING — target the exact native Breeze PRO controls discovered in the V4.1 DOM.
  const brightness = frame.locator('#bsBrightness');
  const saturation = frame.locator('#bsSaturation');
  await expect(brightness).toBeVisible({ timeout: 20_000 });
  await expect(saturation).toBeVisible({ timeout: 20_000 });
  const beforeBrightness = await brightness.inputValue();
  const beforeSaturation = await saturation.inputValue();
  await brightness.evaluate((el) => {
    el.value = '1.35';
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await saturation.evaluate((el) => {
    el.value = '0.65';
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await frame.waitForTimeout(750);
  const afterBrightness = await brightness.inputValue();
  const afterSaturation = await saturation.inputValue();
  console.log('BREEZE_GRADING', JSON.stringify({ beforeBrightness, afterBrightness, beforeSaturation, afterSaturation }));
  expect(afterBrightness).toBe('1.35');
  expect(afterSaturation).toBe('0.65');

  // 3) UPLOAD — click the actual visible Breeze PRO upload affordance and require a native file chooser.
  const uploadTexts = frame.getByText('SUBIR imagen / vídeo', { exact: true });
  const uploadCount = await uploadTexts.count();
  console.log('BREEZE_UPLOAD_AFFORDANCES', uploadCount);
  expect(uploadCount, 'Breeze must expose background + cloth upload affordances').toBeGreaterThanOrEqual(2);
  const upload = uploadTexts.first();
  await expect(upload).toBeVisible({ timeout: 20_000 });
  const chooserPromise = page.waitForEvent('filechooser', { timeout: 10_000 });
  await upload.click();
  const chooser = await chooserPromise;
  console.log('BREEZE_FILECHOOSER', JSON.stringify({ emitted: true, multiple: chooser.isMultiple() }));

  await bestEffortScreenshot(page, '02-museum-breeze-after-controls.png');
  const controlsAfter = await logControls(frame);
  console.log('BREEZE_CONTROLS_AFTER', JSON.stringify(controlsAfter));
  console.log('BREEZE_CONSOLE_ERRORS', JSON.stringify(consoleErrors));

  // GPU/runtime stability: a device-lost error after interaction is a hard failure for this gate.
  const fatalGpuErrors = consoleErrors.filter((e) => /WebGPU Device Lost|Device was destroyed/i.test(e));
  expect(fatalGpuErrors, `Breeze GPU must remain alive: ${JSON.stringify(fatalGpuErrors)}`).toHaveLength(0);
});
