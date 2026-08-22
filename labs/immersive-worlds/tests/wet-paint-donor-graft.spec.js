import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const URL = process.env.WET_PAINT_URL || 'http://127.0.0.1:8000/labs/immersive-worlds/wet-paint-studio.html?authoring=1&world=.%2Fworlds%2Fitinerant-wet-paint-lab.world.json&portalVariant=D';
const ARTIFACTS = path.resolve('qa-artifacts/wet-paint-donor-graft');

fs.mkdirSync(ARTIFACTS, { recursive: true });

test('01 ORIGINAL -> pinned donor -> 02 PAINTERLY, with real motion evidence', async ({ page }) => {
  const consoleErrors = [];
  const requestFailures = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('requestfailed', (request) => {
    requestFailures.push(`${request.method()} ${request.url()} :: ${request.failure()?.errorText || 'failed'}`);
  });

  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await page.waitForFunction(() => Boolean(window.__IW?.runtime), null, { timeout: 20_000 });
  await page.waitForFunction(() => Boolean(window.__OREJA_WET_PAINT_BRIDGE), null, { timeout: 20_000 });
  await page.waitForFunction(() => window.__OREJA_WET_PAINT_BRIDGE?.donorReady === true, null, { timeout: 25_000 });

  await page.screenshot({ path: path.join(ARTIFACTS, '01-boot.png'), fullPage: true });

  await page.locator('[data-node="entity.itinerant.original"]').first().click();
  const upload = page.locator('input[data-media="ARTWORK_IMAGE"]').first();
  await expect(upload).toBeAttached();

  const pngBase64 = await page.evaluate(() => {
    const c = document.createElement('canvas');
    c.width = 640;
    c.height = 400;
    const x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 640, 400);
    g.addColorStop(0, '#15294a');
    g.addColorStop(0.45, '#c73c58');
    g.addColorStop(1, '#e9c75d');
    x.fillStyle = g;
    x.fillRect(0, 0, 640, 400);
    x.fillStyle = '#5da66f';
    x.fillRect(90, 90, 210, 220);
    x.fillStyle = '#f2e8d0';
    x.beginPath();
    x.arc(460, 195, 92, 0, Math.PI * 2);
    x.fill();
    x.strokeStyle = '#171717';
    x.lineWidth = 14;
    x.beginPath();
    x.moveTo(55, 340);
    x.bezierCurveTo(190, 255, 345, 360, 585, 95);
    x.stroke();
    return c.toDataURL('image/png').split(',')[1];
  });

  await upload.setInputFiles({
    name: 'oreja-rubik-sota-qa.png',
    mimeType: 'image/png',
    buffer: Buffer.from(pngBase64, 'base64')
  });

  await page.waitForFunction(() => window.__OREJA_WET_PAINT_BRIDGE?.lastFileName === 'oreja-rubik-sota-qa.png', null, { timeout: 30_000 });
  await page.waitForFunction(() => {
    const bridge = window.__OREJA_WET_PAINT_BRIDGE;
    const sceneKit = window.__IW?.runtime?.sceneKit;
    const original = sceneKit?._entityIndex?.get('entity.itinerant.original')?.object;
    const painterly = sceneKit?._entityIndex?.get('entity.itinerant.painterly')?.object;
    const findPlate = (root) => {
      let best = null; let area = 0;
      root?.traverse?.((node) => {
        if (!node?.isMesh || node.geometry?.type !== 'PlaneGeometry' || !node.material) return;
        const p = node.geometry.parameters || {};
        const a = Number(p.width || 0) * Number(p.height || 0);
        if (a > area) { best = node; area = a; }
      });
      return best;
    };
    const o = findPlate(original);
    const p = findPlate(painterly);
    return Boolean(
      bridge?.outputCanvas && bridge.outputCanvas.width > 1 &&
      o?.material?.map && p?.material?.map &&
      p.userData?.orejaWetPaintDonor?.donor === 'Juanmaes83/wet-paint-flow' &&
      p.material.map !== o.material.map
    );
  }, null, { timeout: 20_000 });

  await page.screenshot({ path: path.join(ARTIFACTS, '02-upload-and-painterly.png'), fullPage: true });

  // Real temporal proof: replay the donor growth and prove the Museum canvas changes over time.
  await page.evaluate(() => window.__OREJA_WET_PAINT_BRIDGE.replay());
  await page.waitForTimeout(350);
  const frameA = await page.locator('#iw-canvas').screenshot({ path: path.join(ARTIFACTS, '03-growth-a.png') });
  await page.waitForTimeout(1400);
  const frameB = await page.locator('#iw-canvas').screenshot({ path: path.join(ARTIFACTS, '04-growth-b.png') });
  expect(frameA.equals(frameB)).toBeFalsy();

  const state = await page.evaluate(() => ({
    donorReady: window.__OREJA_WET_PAINT_BRIDGE?.donorReady,
    lastFileName: window.__OREJA_WET_PAINT_BRIDGE?.lastFileName,
    donorSha: document.getElementById('oreja-wet-paint-runtime')?.contentWindow?.__OREJA_WET_PAINT?.DONOR_SHA,
    painterlyCanvas: (() => {
      const c = window.__OREJA_WET_PAINT_BRIDGE?.outputCanvas;
      return c ? [c.width, c.height] : null;
    })()
  }));

  expect(state.donorReady).toBe(true);
  expect(state.lastFileName).toBe('oreja-rubik-sota-qa.png');
  expect(state.donorSha).toBe('0b9ba9a5be665f3a2a8b2450945ec5006e61e2de');
  expect(state.painterlyCanvas?.[0]).toBeGreaterThan(1);

  const fatalConsole = consoleErrors.filter((line) => !/favicon/i.test(line));
  const fatalNetwork = requestFailures.filter((line) => !/favicon/i.test(line));
  expect(fatalConsole, `Console errors:\n${fatalConsole.join('\n')}`).toEqual([]);
  expect(fatalNetwork, `Network failures:\n${fatalNetwork.join('\n')}`).toEqual([]);
});
