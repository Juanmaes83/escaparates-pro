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

async function traverseAndWait(page, portalId, destination) {
  const before = await page.evaluate(() => window.__IW.runtime.state.activeSpaceId);
  await page.evaluate(async ({ portalId }) => {
    await window.__IW.runtime.traversePortal(portalId, { source: 'BREEZE_PERSISTENCE_QA' });
  }, { portalId });
  await expect.poll(async () => page.evaluate(() => window.__IW.runtime.state.activeSpaceId), {
    timeout: 25_000,
    message: `${portalId} must move Museum from ${before} to ${destination}`
  }).toBe(destination);
}

async function enterBreezeCanonically(page) {
  await page.waitForFunction(() => window.__IW?.ready && window.__IW?.runtime, null, { timeout: 35_000 });
  await traverseAndWait(page, 'portal.lobby-gallery-a', 'space.gallery-a');
  await traverseAndWait(page, 'portal.gallery-a-gallery-b', 'space.gallery-b');
  await traverseAndWait(page, 'portal.gallery-b-breeze', 'space.breeze');
}

async function assertRestoredBreeze(page) {
  const { iframe, frame } = await getBreezeFrame(page);
  await expect.poll(async () => page.evaluate(() => {
    const status = window.__IW_BREEZE_PERSISTENCE?.status;
    return status === 'RESTORED' || status === 'RESTORE_ERROR';
  }), { timeout: 50_000 }).toBe(true);

  const diagnostic = await page.evaluate(() => window.__IW_BREEZE_PERSISTENCE || null);
  console.log('BREEZE_RESTORE_DIAGNOSTIC', JSON.stringify(diagnostic));
  expect(diagnostic?.status, `Restore failed: ${diagnostic?.error || 'unknown error'}`).toBe('RESTORED');

  const restored = await page.evaluate(async () => {
    const response = await window.__IW_BREEZE_PERSISTENCE_ADAPTER.request('GET_STATE');
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
  expect(restored).toEqual({
    activeSpaceId: 'space.breeze',
    status: 'RESTORED',
    experience: 'autumn',
    brightness: 1.35,
    saturation: 0.65,
    backgroundApplied: true,
    backgroundName: 'museum-breeze-proof.png'
  });
  return { iframe, frame, restored };
}

test('Breeze saved state survives entry through the canonical full route', async ({ page }) => {
  test.setTimeout(300_000);
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.waitForTimeout(2_000);
  await enterBreezeCanonically(page);

  const { iframe, frame } = await getBreezeFrame(page);

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

  await frame.locator('#bsScene').selectOption('autumn');
  await expect(frame.locator('#bsScene')).toHaveValue('autumn');
  await frame.locator('#bsBrightness').evaluate((el) => { el.value = '1.35'; el.dispatchEvent(new Event('input', { bubbles: true })); });
  await frame.locator('#bsSaturation').evaluate((el) => { el.value = '0.65'; el.dispatchEvent(new Event('input', { bubbles: true })); });

  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZQmcAAAAASUVORK5CYII=', 'base64');
  const backgroundInput = frame.locator('#bsBackground');
  await backgroundInput.setInputFiles({ name: 'museum-breeze-proof.png', mimeType: 'image/png', buffer: png });
  const backgroundSection = backgroundInput.locator('xpath=ancestor::*[contains(@class,"section")][1]');
  await backgroundSection.getByRole('button', { name: 'START' }).click();
  await expect.poll(async () => frame.evaluate(() => Boolean(window.__BREEZE_STUDIO_PRO__?.app?.appliedBackgroundFile)), { timeout: 20_000 }).toBe(true);

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
  console.log('BREEZE_SAVE_RESULT', JSON.stringify(saved));
  expect(saved).toEqual({
    status: 'SAVED',
    hasBackgroundFile: true,
    experience: 'autumn',
    brightness: 1.35,
    saturation: 0.65,
    backgroundName: 'museum-breeze-proof.png'
  });

  // Ordinary re-entry is already proven by the prior dedicated gate. This gate
  // deliberately destroys Breeze once, returns to the authored start, then lets
  // the real Director recreate Breeze through the canonical route. Avoiding an
  // extra WebGL/WebGPU recreation keeps the headless test focused and stable.
  await traverseAndWait(page, 'portal.breeze-gallery-b', 'space.gallery-b');
  await expect(iframe).toBeHidden({ timeout: 25_000 });
  await traverseAndWait(page, 'portal.gallery-b-gallery-a', 'space.gallery-a');
  await traverseAndWait(page, 'portal.gallery-a-lobby', 'space.lobby');

  const routePlan = await page.evaluate(() => {
    const runtime = window.__IW.runtime;
    const route = runtime.store.routes.find((candidate) =>
      runtime.store.routeSteps(candidate.id).some((step) => JSON.stringify(step).includes('portal.gallery-b-breeze'))
    );
    if (!route) throw new Error('No canonical route contains portal.gallery-b-breeze');

    runtime.experience.start(route.id);
    const breezeBeat = runtime.experience.steps.find((step) => JSON.stringify(step).includes('portal.gallery-b-breeze'));
    if (!breezeBeat) throw new Error('Breeze portal beat missing after route start');
    const breezeTourStep = runtime.experience.manifest.steps.find((step) => step.beatIds.includes(breezeBeat.id));
    if (!breezeTourStep) throw new Error('Breeze portal beat has no canonical tour step');
    const finalTourStep = runtime.experience.manifest.steps[runtime.experience.manifest.steps.length - 1];
    return {
      routeId: route.id,
      breezeTourStepId: breezeTourStep.id,
      finalTourStepId: finalTourStep.id,
      tourTotal: runtime.experience.manifest.steps.length
    };
  });
  console.log('BREEZE_FULL_ROUTE_PLAN', JSON.stringify(routePlan));

  const reachedBreeze = await page.evaluate(async (tourStepId) =>
    window.__IW.runtime.experience.seekToTourStep(tourStepId), routePlan.breezeTourStepId);
  expect(reachedBreeze).toBe(true);
  await expect.poll(async () => page.evaluate(() => window.__IW.runtime.state.activeSpaceId), { timeout: 50_000 }).toBe('space.breeze');

  const routeRestore = await assertRestoredBreeze(page);
  console.log('BREEZE_FULL_ROUTE_RESTORE', JSON.stringify(routeRestore.restored));

  const reachedEnd = await page.evaluate(async (tourStepId) =>
    window.__IW.runtime.experience.seekToTourStep(tourStepId), routePlan.finalTourStepId);
  expect(reachedEnd).toBe(true);

  const fullRoute = await page.evaluate(() => ({
    routeId: window.__IW.runtime.experience.routeId,
    tourOrder: window.__IW.runtime.experience.tourOrder,
    tourTotal: window.__IW.runtime.experience.tourTotal,
    currentTourStepId: window.__IW.runtime.experience.currentTourStep?.id || null,
    activeSpaceId: window.__IW.runtime.state.activeSpaceId,
    persistenceStatus: window.__IW_BREEZE_PERSISTENCE?.status || null
  }));
  console.log('BREEZE_FULL_ROUTE_RESULT', JSON.stringify(fullRoute));
  expect(fullRoute.routeId).toBe(routePlan.routeId);
  expect(fullRoute.tourOrder).toBe(fullRoute.tourTotal);
  expect(fullRoute.tourTotal).toBe(routePlan.tourTotal);
  expect(fullRoute.currentTourStepId).toBe(routePlan.finalTourStepId);
});
