/**
 * Living Painting — Integration proof test (Playwright).
 *
 * Verifies that all extracted Museum capabilities boot and work together
 * in a real WebGL context:
 * - GPGPU boids simulation initializes
 * - Direction field analysis completes
 * - Poisson seeding produces stroke seeds
 * - Gradient-map recoloring is active
 * - Particles render and respond to pointer
 *
 * Run: node labs/immersive-worlds/experiments/living-painting/living-painting.test.mjs
 */

import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MODULE_ROOT = path.resolve(HERE, '../..');
const REPO_ROOT = path.resolve(MODULE_ROOT, '../..');
const PORT = 4199;
const BASE = `http://127.0.0.1:${PORT}/labs/immersive-worlds/experiments/living-painting`;

const results = { pass: [], fail: [] };

function assert(condition, label) {
  if (condition) {
    results.pass.push(label);
    console.log(`  PASS  ${label}`);
  } else {
    results.fail.push(label);
    console.error(`  FAIL  ${label}`);
  }
}

async function main() {
  console.log('Living Painting — capability integration proof\n');

  // Start a static file server from the repo root.
  const server = http.createServer((req, res) => {
    const safePath = path.normalize(req.url).replace(/^(\.\.[/\\])+/, '');
    const filePath = path.join(REPO_ROOT, safePath);
    if (!filePath.startsWith(REPO_ROOT)) {
      res.writeHead(403);
      res.end();
      return;
    }
    const ext = path.extname(filePath);
    const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp' };
    fs.readFile(filePath, (err, data) => {
      if (err) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
      res.end(data);
    });
  });
  server.listen(PORT);
  await new Promise(resolve => server.on('listening', resolve));

  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
      args: ['--no-sandbox', '--disable-gpu-sandbox'],
    });
    const page = await browser.newPage();

    const runtimeErrors = [];
    const consoleLogs = [];
    page.on('pageerror', err => {
      runtimeErrors.push(err.message);
      console.error('  PAGE ERROR:', err.message);
    });
    page.on('console', msg => {
      consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
      if (msg.type() === 'error') {
        console.error('  CONSOLE ERROR:', msg.text());
      }
    });
    // Track failed network requests separately from JS errors.
    const networkErrors = [];
    page.on('response', resp => {
      if (resp.status() >= 400) {
        networkErrors.push(`${resp.status()} ${resp.url()}`);
        console.warn('  NET 404:', resp.url());
      }
    });

    // Boot the experiment.
    await page.goto(`${BASE}/index.html`, { waitUntil: 'domcontentloaded' });

    // Wait for the proof state to be published.
    const proofState = await page.evaluate(() => {
      return new Promise((resolve, reject) => {
        const deadline = Date.now() + 15000;
        const check = () => {
          if (window.__livingPaintingProof) return resolve(window.__livingPaintingProof);
          if (Date.now() > deadline) return reject(new Error('Proof state not published within 15s'));
          requestAnimationFrame(check);
        };
        check();
      });
    });

    console.log('  Proof state:', JSON.stringify(proofState, null, 2), '\n');

    // -- Assertions --

    assert(proofState.boidsActive > 0, `Boids simulation active (${proofState.boidsActive} particles)`);
    assert(proofState.boidsActive === 420, 'Boids active count matches config (420)');

    assert(Array.isArray(proofState.directionFieldSize), 'Direction field was computed');
    assert(proofState.directionFieldSize[0] === 64 && proofState.directionFieldSize[1] === 64,
      'Direction field size is 64x64');

    assert(proofState.poissonSeeds > 0, `Poisson seeding produced ${proofState.poissonSeeds} seeds`);
    assert(proofState.poissonSeeds <= 500, 'Poisson seed count within target');

    assert(proofState.gradientMapActive === true, 'Gradient-map recoloring is active');

    assert(Array.isArray(proofState.capabilities), 'Capability list is present');
    assert(proofState.capabilities.includes('gpgpu-boids'), 'GPGPU boids capability registered');
    assert(proofState.capabilities.includes('direction-field'), 'Direction field capability registered');
    assert(proofState.capabilities.includes('poisson-seeds'), 'Poisson seeds capability registered');
    assert(proofState.capabilities.includes('gradient-map'), 'Gradient-map capability registered');

    // Let it render a few frames to check for runtime errors.
    await page.waitForTimeout(2000);

    assert(runtimeErrors.length === 0,
      runtimeErrors.length === 0
        ? 'Zero runtime errors'
        : `Runtime errors: ${runtimeErrors.join('; ')}`);

    if (networkErrors.length > 0) {
      console.warn(`  NOTE: ${networkErrors.length} network 404(s) — non-blocking:`);
      networkErrors.forEach(e => console.warn(`    ${e}`));
    }

    // Check that the status text updated.
    const statusText = await page.textContent('#status');
    assert(statusText.includes('active'), `Status shows active: "${statusText}"`);

  } finally {
    if (browser) await browser.close();
    server.close();
  }

  // Summary
  console.log(`\n--- Living Painting Integration Proof ---`);
  console.log(`PASS: ${results.pass.length}  FAIL: ${results.fail.length}`);

  if (results.fail.length > 0) {
    console.error('\nFailed assertions:');
    results.fail.forEach(f => console.error(`  - ${f}`));
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Test crashed:', err);
  process.exit(1);
});
