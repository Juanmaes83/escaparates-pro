import { test, expect } from '@playwright/test';

test.use({
  launchOptions: {
    args: ['--enable-unsafe-webgpu', '--use-angle=swiftshader', '--disable-gpu-sandbox']
  }
});

const URL = process.env.BREEZE_MUSEUM_URL ||
  'http://127.0.0.1:4173/labs/immersive-worlds/breeze-integration-studio.html?authoring=1&world=.%2Fworlds%2Fmuseum-v1.world.json';

async function traverseAndWait(page, portalId, destination) {
  await page.evaluate(async (id) => {
    await window.__IW.runtime.traversePortal(id, { source: 'BREEZE_PANEL_QA' });
  }, portalId);
  await expect.poll(() => page.evaluate(() => window.__IW.runtime.state.activeSpaceId), {
    timeout: 25_000
  }).toBe(destination);
}

async function enterBreeze(page) {
  await page.waitForFunction(() => window.__IW?.ready && window.__IW?.runtime, null, { timeout: 35_000 });
  await traverseAndWait(page, 'portal.lobby-gallery-a', 'space.gallery-a');
  await traverseAndWait(page, 'portal.gallery-a-gallery-b', 'space.gallery-b');
  await traverseAndWait(page, 'portal.gallery-b-breeze', 'space.breeze');
  const iframe = page.locator('iframe[data-nested-room-studio="room.breeze"]');
  await expect(iframe).toBeVisible({ timeout: 35_000 });
  const handle = await iframe.elementHandle();
  const frame = await handle.contentFrame();
  expect(frame).toBeTruthy();
  await expect(frame.locator('#bsScene')).toBeVisible({ timeout: 60_000 });
  await expect(frame.locator('#bsMuseumPanelHide')).toBeVisible({ timeout: 60_000 });
  return { iframe, frame };
}

test('Breeze panel can hide/show without losing authored state or save capability', async ({ page }) => {
  test.setTimeout(180_000);
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  const { frame } = await enterBreeze(page);

  await frame.locator('#bsScene').selectOption('autumn');
  await frame.locator('#bsBrightness').evaluate((el) => {
    el.value = '1.35';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await frame.locator('#bsSaturation').evaluate((el) => {
    el.value = '0.65';
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });

  const before = await frame.evaluate(() => ({
    experience: document.getElementById('bsScene')?.value,
    brightness: Number(document.getElementById('bsBrightness')?.value),
    saturation: Number(document.getElementById('bsSaturation')?.value)
  }));
  expect(before).toEqual({ experience: 'autumn', brightness: 1.35, saturation: 0.65 });

  await frame.locator('#bsMuseumPanelHide').click();
  await expect(frame.locator('#breezeStudioPanel')).toHaveClass(/bs-museum-panel-hidden/);
  await expect(frame.locator('#bsMuseumPanelShow')).toBeVisible();
  await expect(frame.locator('#breezeStudioPanel')).toBeHidden();

  const hiddenState = await frame.evaluate(() => ({
    collapsed: window.__BREEZE_MUSEUM_PANEL?.collapsed,
    stored: sessionStorage.getItem('iw:breeze:panelCollapsed'),
    experience: document.getElementById('bsScene')?.value,
    brightness: Number(document.getElementById('bsBrightness')?.value),
    saturation: Number(document.getElementById('bsSaturation')?.value)
  }));
  expect(hiddenState).toEqual({
    collapsed: true,
    stored: '1',
    experience: 'autumn',
    brightness: 1.35,
    saturation: 0.65
  });

  await frame.locator('#bsMuseumPanelShow').click();
  await expect(frame.locator('#breezeStudioPanel')).toBeVisible();
  await expect(frame.locator('#bsMuseumPanelHide')).toBeVisible();

  const after = await frame.evaluate(() => ({
    collapsed: window.__BREEZE_MUSEUM_PANEL?.collapsed,
    stored: sessionStorage.getItem('iw:breeze:panelCollapsed'),
    experience: document.getElementById('bsScene')?.value,
    brightness: Number(document.getElementById('bsBrightness')?.value),
    saturation: Number(document.getElementById('bsSaturation')?.value)
  }));
  expect(after).toEqual({
    collapsed: false,
    stored: '0',
    experience: 'autumn',
    brightness: 1.35,
    saturation: 0.65
  });

  const save = frame.locator('#bsMuseumSave');
  await expect(save).toBeVisible({ timeout: 30_000 });
  await save.click();
  await expect.poll(() => page.evaluate(() => window.__IW_BREEZE_PERSISTENCE?.status || null), {
    timeout: 40_000
  }).toBe('SAVED');
  await expect(save).toHaveText('GUARDADO ✓');

  await traverseAndWait(page, 'portal.breeze-gallery-b', 'space.gallery-b');
  const snapshot = await page.evaluate(() => ({
    activeSpaceId: window.__IW.runtime.state.activeSpaceId,
    experience: window.__IW_BREEZE_SAVED_STATE?.experience,
    brightness: window.__IW_BREEZE_SAVED_STATE?.cloth?.brightness,
    saturation: window.__IW_BREEZE_SAVED_STATE?.cloth?.saturation
  }));
  console.log('BREEZE_PANEL_TOGGLE_RESULT', JSON.stringify(snapshot));
  expect(snapshot).toEqual({
    activeSpaceId: 'space.gallery-b',
    experience: 'autumn',
    brightness: 1.35,
    saturation: 0.65
  });
});
