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
    const shot = await client.send('Page.captureScreenshot', {
      format: 'png',
      fromSurface: true,
      captureBeyondViewport: false
    });
    await fs.writeFile(path, Buffer.from(shot.data, 'base64'));
  } finally {
    await client.detach();
  }
}

test.beforeAll(async () => { await fs.mkdir(evidence, { recursive: true }); });

test('Museum Visitor Phase 1 — complete visual and functional QA', async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 1000 });
  const errors = await ready(page);

  // 01 + 02 + 07 — Visual Calendar, Programme Editor, structured accessibility.
  await page.locator('[data-domain="visitor"]').click();
  await expect(page.getByText('01 · Planificación')).toBeVisible();
  await expect(page.getByText('02 · Agenda')).toBeVisible();
  await expect(page.getByText('07 · Accesibilidad estructurada')).toBeVisible();
  await expect(page.locator('[data-p1-day]')).toHaveCount(7);
  await expect(page.locator('.p1-status.is-ok').first()).toBeVisible();

  await page.locator('[data-p1-day="2"]').click();
  await page.locator('[data-p1-open="0"]').click();
  await expect(page.locator('[data-p1-day="2"]')).toHaveClass(/is-closed/);
  await page.locator('[data-p1-open="1"]').click();
  await expect(page.locator('[data-p1-day="2"]')).toHaveClass(/is-open/);
  await page.locator('[data-p1-prog]').first().click();
  await expect(page.locator('.p1-progedit').first()).toBeVisible();

  const a11y = page.locator('[data-p1-a11y="stepFree"]');
  if (!(await a11y.isChecked())) await a11y.click();
  await expect(page.locator('.p1-a11ygrid input:checked')).not.toHaveCount(0);
  await evidenceShot(page, `${evidence}/01-studio-desktop.png`);

  // 03 + 04 + 05 — Interior Map v2, artwork progress, seen / not seen.
  const state = await page.evaluate(() => {
    const studioRoot = window.__IW_STUDIO?.root;
    if (studioRoot) studioRoot.style.display = 'none';
    window.__IW.hud.el.veil.hidden = true;
    const kinds = ['ARTWORK','SCULPTURE','PROJECTION','AUDIO'];
    const room = window.__IW.runtime.store.spaces.find((s) => window.__IW.runtime.store.entitiesOf(s.id).some((e) => kinds.includes(e.kind)));
    if (room && room.id !== window.__IW.runtime.state.activeSpaceId) window.__IW.runtime.state.enterSpace(room.id);
    const works = room ? window.__IW.runtime.store.entitiesOf(room.id).filter((e) => kinds.includes(e.kind)) : [];
    if (works[0]) window.__IW.runtime.state.setFocus(works[0].id);
    window.__IW.hud.update();
    window.__IW.hud.toggleMap(true);
    return { seen: window.__IW.runtime.state.visitedEntityIds.size, total: works.length };
  });
  expect(state.total).toBeGreaterThan(0);
  expect(state.seen).toBeGreaterThan(0);
  await expect(page.getByText('Mi visita')).toBeVisible();
  await expect(page.locator('.iw-p1-progress__head b')).toContainText('/');
  await expect(page.locator('.iw-p1-room')).not.toHaveCount(0);
  await expect(page.locator('.iw-p1-room li.is-seen')).not.toHaveCount(0);
  await evidenceShot(page, `${evidence}/02-visitor-map-progress.png`);

  // Return to Full Studio for 06 — canonical artwork dimensions.
  await page.evaluate(() => {
    window.__IW.hud.toggleMap(false);
    const studioRoot = window.__IW_STUDIO?.root;
    if (studioRoot) studioRoot.style.display = '';
  });
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.locator('[data-domain="build"]').click();
  await page.getByRole('button', { name: /Horizonte interrumpido Obra/ }).click();
  await expect(page.getByText('Medidas físicas')).toBeVisible();
  const width = page.locator('[data-p1-dim="widthCm"]');
  const height = page.locator('[data-p1-dim="heightCm"]');
  await width.fill('90');
  await height.fill('240');
  await page.evaluate(() => window.__IW_STUDIO.render());
  await expect(page.getByText(/90 × 240 cm/)).toBeVisible();
  await expect(page.locator('.p1-status.is-ok').filter({ hasText: 'Medidas listas' })).toBeVisible();
  await evidenceShot(page, `${evidence}/03-dimensions-editor.png`);

  // Responsive visual check using the same authored state/session.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('[data-domain="visitor"]').click();
  await expect(page.getByText('01 · Planificación')).toBeVisible();
  await evidenceShot(page, `${evidence}/04-studio-mobile.png`);

  expect(errors.filter((x) => !x.includes('favicon'))).toEqual([]);
});
