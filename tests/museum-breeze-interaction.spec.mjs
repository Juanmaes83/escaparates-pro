import { test, expect } from '@playwright/test';

test.use({
  launchOptions: {
    args: ['--enable-unsafe-webgpu', '--use-angle=swiftshader', '--disable-gpu-sandbox']
  }
});

const URL = process.env.BREEZE_MUSEUM_URL ||
  'https://escaparates-pro-git-chatgpt-mu-5bfce9-juanma-espinosas-projects.vercel.app/labs/immersive-worlds/breeze-integration-studio.html?authoring=1&world=.%2Fworlds%2Fmuseum-v1.world.json';

const ENTITY_ID = 'entity.installation.viento-sobre-marmol';

async function getBreezeFrame(page) {
  const iframe = page.locator('iframe[data-nested-room-studio="room.breeze"]');
  await expect(iframe).toBeVisible({ timeout: 35_000 });
  const handle = await iframe.elementHandle();
  const frame = await handle.contentFrame();
  expect(frame).toBeTruthy();
  await frame.waitForLoadState('domcontentloaded');
  await expect(frame.locator('#bsScene')).toBeVisible({ timeout: 20_000 });
  return { iframe, frame };
}

async function persistenceStatus(page, wanted, timeout = 50_000) {
  await expect.poll(async () => page.evaluate(() => window.__IW_BREEZE_PERSISTENCE?.status || null), {
    timeout,
    message: `Expected Breeze persistence status ${wanted}`
  }).toBe(wanted);
}

test('Breeze saves real customisation and restores after canonical room re-entry', async ({ page }) => {
  test.setTimeout(150_000);
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.waitForTimeout(4_000);

  let { iframe, frame } = await getBreezeFrame(page);

  // The specialised guest must own the centre interaction plane.
  const hit = await page.evaluate(() => {
    const iframe = document.querySelector('iframe[data-nested-room-studio="room.breeze"]');
    const body = document.querySelector('.st-body');
    const r = iframe.getBoundingClientRect();
    return {
      owner: document.body.dataset.breezeInputOwner || null,
      bodyPointer: body ? getComputedStyle(body).pointerEvents : null,
      iframePointer: getComputedStyle(iframe).pointerEvents,
      hit: document.elementFromPoint(r.left + r.width * 0.68, r.top + r.height * 0.42) === iframe
    };
  });
  expect(hit).toEqual({ owner: 'guest', bodyPointer: 'none', iframePointer: 'auto', hit: true });

  // Real Breeze customisation.
  await frame.locator('#bsScene').selectOption('autumn');
  await expect(frame.locator('#bsScene')).toHaveValue('autumn');
  await frame.locator('#bsBrightness').evaluate((el) => { el.value = '1.35'; el.dispatchEvent(new Event('input', { bubbles: true })); });
  await frame.locator('#bsSaturation').evaluate((el) => { el.value = '0.65'; el.dispatchEvent(new Event('input', { bubbles: true })); });
  await expect(frame.locator('#bsBrightness')).toHaveValue('1.35');
  await expect(frame.locator('#bsSaturation')).toHaveValue('0.65');

  // Load and apply a real PNG background so re-entry proves binary File survival,
  // not just scalar settings.
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZQmcAAAAASUVORK5CYII=', 'base64');
  const backgroundInput = frame.locator('#bsBackground');
  await backgroundInput.setInputFiles({ name: 'museum-breeze-proof.png', mimeType: 'image/png', buffer: png });
  const backgroundSection = backgroundInput.locator('xpath=ancestor::*[contains(@class,"section")][1]');
  await backgroundSection.getByRole('button', { name: 'START' }).click();
  await expect.poll(async () => frame.evaluate(() => Boolean(window.__BREEZE_STUDIO_PRO__?.app?.appliedBackgroundFile)), { timeout: 20_000 }).toBe(true);

  // Museum SAVE — use the actual Studio method behind GUARDAR PIEZA.
  await page.evaluate(async (entityId) => {
    const studio = window.__IW_STUDIO;
    if (!studio) throw new Error('Museum Studio not mounted');
    studio.selectedId = entityId;
    studio.render();
    await studio._validationSavePiece();
  }, ENTITY_ID);
  await persistenceStatus(page, 'SAVED');

  const saved = await page.evaluate(() => ({
    status: window.__IW_BREEZE_PERSISTENCE?.status,
    hasBackgroundFile: window.__IW_BREEZE_PERSISTENCE?.hasBackgroundFile,
    experience: window.__IW_BREEZE_SAVED_STATE?.experience,
    brightness: window.__IW_BREEZE_SAVED_STATE?.cloth?.brightness,
    saturation: window.__IW_BREEZE_SAVED_STATE?.cloth?.saturation,
    backgroundName: window.__IW_BREEZE_SAVED_STATE?.background?.file?.name
  }));
  expect(saved).toEqual({
    status: 'SAVED',
    hasBackgroundFile: true,
    experience: 'autumn',
    brightness: 1.35,
    saturation: 0.65,
    backgroundName: 'museum-breeze-proof.png'
  });

  // Canonical exit to Gallery B destroys the specialised guest.
  await page.locator('[data-breeze-museum-exit="true"]').click();
  await expect(iframe).toBeHidden({ timeout: 25_000 });
  await expect.poll(async () => page.evaluate(() => window.__IW?.runtime?.state?.activeSpaceId || null), { timeout: 25_000 }).toBe('space.gallery-b');

  // Canonical Gallery B -> Breeze portal creates a fresh guest. The persistence
  // adapter must automatically APPLY the saved snapshot when the child says READY.
  await page.evaluate(async () => {
    await window.__IW.runtime.traversePortal('portal.gallery-b-breeze', { crossing: true, source: 'BREEZE_PERSISTENCE_QA' });
  });
  ({ iframe, frame } = await getBreezeFrame(page));
  await persistenceStatus(page, 'RESTORED');

  await expect(frame.locator('#bsScene')).toHaveValue('autumn');
  await expect(frame.locator('#bsBrightness')).toHaveValue('1.35');
  await expect(frame.locator('#bsSaturation')).toHaveValue('0.65');

  const restored = await page.evaluate(async () => {
    const adapter = window.__IW_BREEZE_PERSISTENCE_ADAPTER;
    const response = await adapter.request('GET_STATE');
    return {
      activeSpaceId: window.__IW.runtime.state.activeSpaceId,
      status: window.__IW_BREEZE_PERSISTENCE?.status,
      experience: response.state?.experience,
      brightness: response.state?.cloth?.brightness,
      saturation: response.state?.cloth?.saturation,
      backgroundApplied: response.state?.background?.applied,
      backgroundName: response.state?.background?.file?.name || response.state?.background?.meta?.name || null
    };
  });

  console.log('BREEZE_SAVE_REENTRY_RESULT', JSON.stringify(restored));
  expect(restored).toEqual({
    activeSpaceId: 'space.breeze',
    status: 'RESTORED',
    experience: 'autumn',
    brightness: 1.35,
    saturation: 0.65,
    backgroundApplied: true,
    backgroundName: 'museum-breeze-proof.png'
  });
});
