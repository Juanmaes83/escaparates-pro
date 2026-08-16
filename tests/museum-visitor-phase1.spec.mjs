import { test, expect } from '@playwright/test';
import fs from 'node:fs/promises';

const BASE = '/labs/immersive-worlds/index.html';
const evidence = 'tests/test-results/museum-visitor-phase1/evidence';

async function ready(page, authoring = false) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(`${BASE}?portalVariant=D${authoring ? '&authoring=1' : ''}`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.documentElement.dataset.iwReady === 'true', null, { timeout: 60000 });
  await page.waitForFunction(() => document.documentElement.dataset.visitorPhase1 === 'ready', null, { timeout: 10000 });
  return errors;
}

test.beforeAll(async () => { await fs.mkdir(evidence, { recursive: true }); });

test('Studio desktop — calendar, programme, green validation and structured accessibility', async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 1000 });
  const errors = await ready(page, true);
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

  const edit = page.locator('[data-p1-prog]').first();
  await edit.click();
  await expect(page.locator('.p1-progedit').first()).toBeVisible();

  const a11y = page.locator('[data-p1-a11y="stepFree"]');
  if (!(await a11y.isChecked())) await a11y.check();
  await expect(page.getByText(/servicio/).first()).toBeVisible();

  await page.screenshot({ path: `${evidence}/01-studio-desktop.png`, fullPage: true });
  expect(errors.filter((x) => !x.includes('favicon'))).toEqual([]);
});

test('Visitor — Interior Map v2 + artwork progress + seen / not seen', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const errors = await ready(page, false);
  await page.evaluate(() => {
    window.__IW.hud.el.veil.hidden = true;
    const works = window.__IW.runtime.focusableInSpace();
    if (works[0]) window.__IW.runtime.focusEntity(works[0].id, {}, { source: 'PLAYWRIGHT' });
    window.__IW.hud.toggleMap(true);
  });
  await expect(page.getByText('Mi visita')).toBeVisible();
  await expect(page.locator('.iw-p1-progress__head b')).toContainText('/');
  await expect(page.locator('.iw-p1-room')).not.toHaveCount(0);
  await expect(page.locator('.iw-p1-room li.is-seen')).not.toHaveCount(0);
  await page.screenshot({ path: `${evidence}/02-visitor-map-progress.png`, fullPage: true });
  expect(errors.filter((x) => !x.includes('favicon'))).toEqual([]);
});

test('Full Studio — dimensions recovered in canonical entity editor', async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 1000 });
  await ready(page, true);
  await page.locator('[data-domain="build"]').click();
  const entity = page.locator('.st-node--entity [data-node]').first();
  await entity.click();
  await expect(page.getByText('Medidas físicas')).toBeVisible();
  const width = page.locator('[data-p1-dim="widthCm"]');
  const height = page.locator('[data-p1-dim="heightCm"]');
  await expect(width).toBeVisible();
  await expect(height).toBeVisible();
  await width.fill('90');
  await height.fill('240');
  await expect(page.getByText(/90 × 240 cm/)).toBeVisible();
});

test('Studio mobile — approved system remains usable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const errors = await ready(page, true);
  await page.locator('[data-domain="visitor"]').click();
  await expect(page.getByText('01 · Planificación')).toBeVisible();
  await page.screenshot({ path: `${evidence}/03-studio-mobile.png`, fullPage: true });
  expect(errors.filter((x) => !x.includes('favicon'))).toEqual([]);
});
