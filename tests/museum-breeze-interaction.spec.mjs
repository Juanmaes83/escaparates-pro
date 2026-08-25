import { test, expect } from '@playwright/test';

test.use({
  launchOptions: {
    args: ['--enable-unsafe-webgpu', '--use-angle=swiftshader', '--disable-gpu-sandbox']
  }
});

const URL = process.env.BREEZE_MUSEUM_URL ||
  'https://escaparates-pro-git-chatgpt-mu-5bfce9-juanma-espinosas-projects.vercel.app/labs/immersive-worlds/breeze-integration-studio.html?authoring=1&world=.%2Fworlds%2Fmuseum-v1.world.json';

async function getBreezeFrame(page) {
  const iframe = page.locator('iframe[data-nested-room-studio="room.breeze"]');
  await expect(iframe).toBeVisible({ timeout: 35_000 });
  const handle = await iframe.elementHandle();
  const frame = await handle.contentFrame();
  expect(frame).toBeTruthy();
  await frame.waitForLoadState('domcontentloaded');
  await expect(frame.locator('#bsScene')).toBeVisible({ timeout: 30_000 });
  await expect(frame.locator('#bsMuseumSave')).toBeVisible({ timeout: 65_000 });
  return { iframe, frame };
}

async function traverseAndWait(page, portalId, destination) {
  await page.evaluate(async ({ portalId }) => {
    await window.__IW.runtime.traversePortal(portalId, { source: 'BREEZE_HUMAN_SAVE_QA' });
  }, { portalId });
  await expect.poll(async () => page.evaluate(() => window.__IW.runtime.state.activeSpaceId), {
    timeout: 25_000
  }).toBe(destination);
}

async function enterBreezeCanonically(page) {
  await page.waitForFunction(() => window.__IW?.ready && window.__IW?.runtime, null, { timeout: 35_000 });
  await traverseAndWait(page, 'portal.lobby-gallery-a', 'space.gallery-a');
  await traverseAndWait(page, 'portal.gallery-a-gallery-b', 'space.gallery-b');
  await traverseAndWait(page, 'portal.gallery-b-breeze', 'space.breeze');
}

test('visible Breeze save button keeps the authored snapshot after leaving the room', async ({ page }) => {
  test.setTimeout(240_000);
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await enterBreezeCanonically(page);

  const { iframe, frame } = await getBreezeFrame(page);

  await frame.locator('#bsScene').selectOption('autumn');
  await frame.locator('#bsBrightness').evaluate((el) => { el.value = '1.35'; el.dispatchEvent(new Event('input', { bubbles: true })); });
  await frame.locator('#bsSaturation').evaluate((el) => { el.value = '0.65'; el.dispatchEvent(new Event('input', { bubbles: true })); });

  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZQmcAAAAASUVORK5CYII=', 'base64');
  const backgroundInput = frame.locator('#bsBackground');
  await backgroundInput.setInputFiles({ name: 'museum-breeze-proof.png', mimeType: 'image/png', buffer: png });
  const section = backgroundInput.locator('xpath=ancestor::*[contains(@class,"section")][1]');
  await section.getByRole('button', { name: 'START' }).click();
  await expect.poll(async () => frame.evaluate(() => Boolean(window.__BREEZE_STUDIO_PRO__?.app?.appliedBackgroundFile)), { timeout: 20_000 }).toBe(true);

  const saveButton = frame.locator('#bsMuseumSave');
  await saveButton.click();
  await expect.poll(async () => page.evaluate(() => window.__IW_BREEZE_PERSISTENCE?.status || null), { timeout: 30_000 }).toBe('SAVED');
  await expect(saveButton).toHaveText('GUARDADO ✓', { timeout: 20_000 });
  await expect(frame.locator('#bsMuseumSaveStatus')).toContainText('Puedes salir de la sala');

  const saved = await page.evaluate(() => ({
    experience: window.__IW_BREEZE_SAVED_STATE?.experience,
    brightness: window.__IW_BREEZE_SAVED_STATE?.cloth?.brightness,
    saturation: window.__IW_BREEZE_SAVED_STATE?.cloth?.saturation,
    backgroundName: window.__IW_BREEZE_SAVED_STATE?.background?.file?.name,
    hasBackgroundFile: window.__IW_BREEZE_PERSISTENCE?.hasBackgroundFile
  }));
  console.log('BREEZE_HUMAN_SAVE_RESULT', JSON.stringify(saved));
  expect(saved).toEqual({
    experience: 'autumn',
    brightness: 1.35,
    saturation: 0.65,
    backgroundName: 'museum-breeze-proof.png',
    hasBackgroundFile: true
  });

  await traverseAndWait(page, 'portal.breeze-gallery-b', 'space.gallery-b');
  await expect(iframe).toBeHidden({ timeout: 25_000 });

  const afterExit = await page.evaluate(() => ({
    activeSpaceId: window.__IW.runtime.state.activeSpaceId,
    savedStatePresent: Boolean(window.__IW_BREEZE_PERSISTENCE_ADAPTER?.savedState),
    experience: window.__IW_BREEZE_PERSISTENCE_ADAPTER?.savedState?.experience,
    backgroundName: window.__IW_BREEZE_PERSISTENCE_ADAPTER?.savedState?.background?.file?.name,
    brightness: window.__IW_BREEZE_PERSISTENCE_ADAPTER?.savedState?.cloth?.brightness,
    saturation: window.__IW_BREEZE_PERSISTENCE_ADAPTER?.savedState?.cloth?.saturation
  }));
  console.log('BREEZE_AFTER_ROOM_EXIT', JSON.stringify(afterExit));
  expect(afterExit).toEqual({
    activeSpaceId: 'space.gallery-b',
    savedStatePresent: true,
    experience: 'autumn',
    backgroundName: 'museum-breeze-proof.png',
    brightness: 1.35,
    saturation: 0.65
  });
});
