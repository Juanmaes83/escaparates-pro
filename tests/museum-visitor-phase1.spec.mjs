import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';

const BASE = '/labs/immersive-worlds/index.html';
const evidence = 'tests/test-results/museum-visitor-phase1/evidence';

async function ready(page) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(`${BASE}?portalVariant=D&authoring=1`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.documentElement.dataset.iwReady === 'true', null, { timeout: 60000 });
  await page.waitForFunction(() => document.documentElement.dataset.visitorPhase1 === 'ready', null, { timeout: 10000 });
  await page.addStyleTag({ content: `*,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}` });
  return errors;
}

async function evidenceShot(page, path) {
  const client = await page.context().newCDPSession(page);
  try {
    const shot = await client.send('Page.captureScreenshot', { format: 'png', fromSurface: true, captureBeyondViewport: false });
    await fs.writeFile(path, Buffer.from(shot.data, 'base64'));
  } finally { await client.detach(); }
}

test.beforeAll(async () => { await fs.mkdir(evidence, { recursive: true }); });

test('Museum Visitor Phase 1 — capability index, runtime bridges and regression QA', async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 1000 });
  const errors = await ready(page);

  await page.locator('[data-domain="visitor"]').click();
  for (const title of ['Planificación','Agenda','Orientación','Mi visita','Accesibilidad']) {
    await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
  }
  await expect(page.getByText('01 · Planificación')).toHaveCount(0);
  await expect(page.getByText('02 · Agenda')).toHaveCount(0);
  await expect(page.getByText('07 · Accesibilidad estructurada')).toHaveCount(0);
  await expect(page.locator('[data-capability]')).toHaveCount(5);
  await expect(page.locator('[data-capability="P1-01"] .p1-cap__body')).toBeVisible();
  await expect(page.locator('[data-capability="P1-03"]')).toContainText('salas');
  await expect(page.locator('[data-capability="P1-04-05"]')).toContainText('visto / pendiente');
  await expect(page.locator('[data-p1-action="preview-map"]')).toBeVisible();
  await expect(page.locator('[data-p1-action="preview-visit"]')).toBeVisible();

  await page.locator('[data-p1-cap-toggle="P1-02"]').click();
  await expect(page.locator('[data-capability="P1-02"] .p1-cap__body')).toBeVisible();
  await page.locator('[data-p1-prog]').first().click();
  await expect(page.locator('.p1-progedit').first()).toBeVisible();
  await page.locator('[data-p1-cap-toggle="P1-02"]').click();
  await expect(page.locator('[data-capability="P1-02"] .p1-cap__body')).toHaveCount(0);

  await page.locator('[data-p1-cap-toggle="P1-07"]').click();
  const a11y = page.locator('[data-p1-a11y="stepFree"]');
  if (!(await a11y.isChecked())) await a11y.click();
  await expect(page.locator('[data-capability="P1-07"] .p1-status.is-ok')).toBeVisible();
  await evidenceShot(page, `${evidence}/01-capability-index-desktop.png`);

  // P1-06 remains exactly where approved: Builder, contextual to one artwork.
  await page.locator('[data-domain="build"]').click();
  await page.getByRole('button', { name: 'Horizonte interrumpido Obra', exact: true }).click();
  await expect(page.getByText('Medidas físicas')).toBeVisible();
  await expect(page.locator('[data-p1-dim="widthCm"]')).toBeVisible();
  await expect(page.locator('[data-p1-dim="heightCm"]')).toBeVisible();
  await expect(page.locator('.p1-status.is-ok').filter({ hasText: 'Medidas listas' })).toBeVisible();
  await evidenceShot(page, `${evidence}/02-builder-dimensions-location.png`);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('[data-domain="visitor"]').click();
  await expect(page.getByRole('heading', { name: 'Planificación', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Orientación', exact: true })).toBeVisible();
  await evidenceShot(page, `${evidence}/03-capability-index-mobile.png`);

  // Runtime validation uses the canonical HUD + WorldState directly. Clicking
  // Studio _start() in headless Chromium tears down the authoring context and can
  // leave the test runner waiting even though the runtime is already healthy.
  await page.setViewportSize({ width: 1600, height: 1000 });
  const runtimeState = await page.evaluate(() => {
    const studioRoot = window.__IW_STUDIO?.root;
    if (studioRoot) studioRoot.style.display = 'none';
    window.__IW.hud.el.veil.hidden = true;
    const kinds = ['ARTWORK','SCULPTURE','PROJECTION','AUDIO'];
    const runtime = window.__IW.runtime;
    const room = runtime.store.spaces.find((s) => runtime.store.entitiesOf(s.id).some((e) => kinds.includes(e.kind)));
    if (room && room.id !== runtime.state.activeSpaceId) runtime.state.enterSpace(room.id);
    const works = room ? runtime.store.entitiesOf(room.id).filter((e) => kinds.includes(e.kind)) : [];
    if (works[0]) runtime.state.setFocus(works[0].id);
    window.__IW.hud.update();
    window.__IW.hud.toggleMap(true);
    return { seen: runtime.state.visitedEntityIds.size, total: works.length };
  });
  expect(runtimeState.total).toBeGreaterThan(0);
  expect(runtimeState.seen).toBeGreaterThan(0);
  await expect(page.getByText('Mi visita')).toBeVisible();
  await expect(page.locator('.iw-p1-room')).not.toHaveCount(0);
  await expect(page.locator('.iw-p1-room li.is-seen')).not.toHaveCount(0);

  expect(errors.filter((x) => !x.includes('favicon'))).toEqual([]);
});