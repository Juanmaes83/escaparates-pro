import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const URL = process.env.WET_PAINT_HOST_URL || 'http://127.0.0.1:8000/capabilities/wet-paint-flow/host.html';
const ARTIFACTS = path.resolve('qa-artifacts/wet-paint-donor-host');
fs.mkdirSync(ARTIFACTS, { recursive: true });

test.use({ launchOptions: { args: ['--enable-unsafe-swiftshader'] } });
test.setTimeout(60_000);

test('pinned donor host reaches READY without Museum', async ({ page }) => {
  const consoleLines = [];
  const failures = [];
  page.on('console', (msg) => consoleLines.push(`[${msg.type()}] ${msg.text()}`));
  page.on('pageerror', (error) => consoleLines.push(`[pageerror] ${error.message}`));
  page.on('requestfailed', (request) => failures.push(`${request.url()} :: ${request.failure()?.errorText || 'failed'}`));

  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 20_000 });
  try {
    await page.waitForFunction(() => window.__OREJA_WET_PAINT?.ready === true, null, { timeout: 45_000 });
  } catch (error) {
    await page.screenshot({ path: path.join(ARTIFACTS, 'host-not-ready.png'), fullPage: true }).catch(() => {});
    const state = await page.evaluate(() => ({
      boot: document.getElementById('boot')?.textContent || '',
      ready: window.__OREJA_WET_PAINT?.ready || false,
      renderer: document.getElementById('renderer-name')?.textContent || ''
    })).catch(() => ({}));
    fs.writeFileSync(path.join(ARTIFACTS, 'host-not-ready.txt'), [JSON.stringify(state, null, 2), ...consoleLines, ...failures].join('\n'));
    throw error;
  }

  expect(await page.evaluate(() => window.__OREJA_WET_PAINT.DONOR_SHA)).toBe('0b9ba9a5be665f3a2a8b2450945ec5006e61e2de');
  await page.screenshot({ path: path.join(ARTIFACTS, 'host-ready.png'), fullPage: true });
});
