/**
 * Living Painting — Visual Evidence Capture
 *
 * Photographer role: captures representative screenshots at meaningful states,
 * temporal sequences proving motion, and pointer-response evidence.
 *
 * This is NOT a test — it produces auditable visual evidence for human review.
 *
 * Run: node labs/immersive-worlds/qa/evidence-living-art-v1/capture-evidence.mjs
 */

import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MODULE_ROOT = path.resolve(HERE, '../..');
const REPO_ROOT = path.resolve(MODULE_ROOT, '../..');
const EVIDENCE = HERE;
const PORT = 4200;

async function main() {
  console.log('Living Painting — Visual Evidence Capture\n');

  const server = http.createServer((req, res) => {
    const safePath = path.normalize(req.url).replace(/^(\.\.[/\\])+/, '');
    const filePath = path.join(REPO_ROOT, safePath);
    if (!filePath.startsWith(REPO_ROOT)) { res.writeHead(403); res.end(); return; }
    const ext = path.extname(filePath);
    const types = {
      '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
      '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp',
    };
    fs.readFile(filePath, (err, data) => {
      if (err) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
      res.end(data);
    });
  });
  server.listen(PORT);
  await new Promise(resolve => server.on('listening', resolve));

  const browser = await chromium.launch({
    headless: true,
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--no-sandbox', '--disable-gpu-sandbox'],
  });

  try {
    // Use a Museum-like viewport (16:9 landscape, institutional display).
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

    const errors = [];
    page.on('pageerror', err => errors.push(err.message));

    const BASE = `http://127.0.0.1:${PORT}/labs/immersive-worlds/experiments/living-painting`;
    await page.goto(`${BASE}/index.html`, { waitUntil: 'domcontentloaded' });

    // Wait for capabilities to initialize.
    await page.evaluate(() => new Promise((resolve, reject) => {
      const deadline = Date.now() + 15000;
      const check = () => {
        if (window.__livingPaintingProof) return resolve();
        if (Date.now() > deadline) return reject(new Error('timeout'));
        requestAnimationFrame(check);
      };
      check();
    }));

    console.log('  Capabilities initialized. Beginning evidence capture.\n');

    // ─────────────────────────────────────────────────────────────────────
    // SCENE 1: FIRST IMPRESSION — what the visitor sees on arrival
    // ─────────────────────────────────────────────────────────────────────
    // Let boids settle into natural formation (2 seconds of simulation).
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(EVIDENCE, 'S1_first-impression.png') });
    console.log('  S1  First impression captured');

    // ─────────────────────────────────────────────────────────────────────
    // SCENE 2: TEMPORAL SEQUENCE — proving the painting is alive
    // Capture 5 frames at 400ms intervals to show flock movement.
    // ─────────────────────────────────────────────────────────────────────
    for (let frame = 0; frame < 5; frame++) {
      await page.waitForTimeout(400);
      await page.screenshot({
        path: path.join(EVIDENCE, `S2_temporal-${String(frame).padStart(2, '0')}.png`),
      });
    }
    console.log('  S2  Temporal sequence captured (5 frames, 400ms apart)');

    // ─────────────────────────────────────────────────────────────────────
    // SCENE 3: POINTER RESPONSE — visitor proximity causes flock avoidance
    // Move pointer to center (where the obstacle is), then capture.
    // ─────────────────────────────────────────────────────────────────────
    await page.mouse.move(640, 360); // center
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(EVIDENCE, 'S3_pointer-center.png') });
    console.log('  S3  Pointer at center — flock avoidance captured');

    // Move pointer to top-left corner, let flock redistribute.
    await page.mouse.move(100, 100);
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(EVIDENCE, 'S3_pointer-corner.png') });
    console.log('  S3  Pointer at corner — flock redistribution captured');

    // Move pointer away entirely (flock relaxes).
    await page.mouse.move(1280, 720); // far edge
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(EVIDENCE, 'S3_pointer-away.png') });
    console.log('  S3  Pointer away — flock relaxation captured');

    // ─────────────────────────────────────────────────────────────────────
    // SCENE 4: SCALE — close look at particle density and distribution
    // ─────────────────────────────────────────────────────────────────────
    await page.waitForTimeout(500);
    // Capture at a moment of natural spreading.
    await page.screenshot({ path: path.join(EVIDENCE, 'S4_particle-density.png') });
    console.log('  S4  Particle density and distribution captured');

    // ─────────────────────────────────────────────────────────────────────
    // SCENE 5: STATUS — the technical state readout
    // ─────────────────────────────────────────────────────────────────────
    const statusText = await page.textContent('#status');
    const proofState = await page.evaluate(() => window.__livingPaintingProof);
    await page.screenshot({ path: path.join(EVIDENCE, 'S5_status-readout.png') });
    console.log('  S5  Status readout captured');

    // ─────────────────────────────────────────────────────────────────────
    // Write evidence manifest
    // ─────────────────────────────────────────────────────────────────────
    const manifest = {
      captured: new Date().toISOString(),
      viewport: { width: 1280, height: 720 },
      branch: 'claude/museum-living-art-v1',
      experiment: 'labs/immersive-worlds/experiments/living-painting',
      proofState,
      statusText,
      runtimeErrors: errors,
      scenes: [
        { id: 'S1', file: 'S1_first-impression.png', description: 'What the visitor sees on arrival — boids settled into natural formation after 2s' },
        { id: 'S2', files: Array.from({ length: 5 }, (_, i) => `S2_temporal-${String(i).padStart(2, '0')}.png`), description: 'Temporal sequence — 5 frames at 400ms intervals proving particle motion' },
        { id: 'S3', files: ['S3_pointer-center.png', 'S3_pointer-corner.png', 'S3_pointer-away.png'], description: 'Pointer/visitor response — flock avoids center pointer, redistributes when pointer moves, relaxes when pointer leaves' },
        { id: 'S4', file: 'S4_particle-density.png', description: 'Particle density and spatial distribution at rest' },
        { id: 'S5', file: 'S5_status-readout.png', description: 'Technical status readout — capability state summary' },
      ],
    };
    fs.writeFileSync(path.join(EVIDENCE, 'manifest.json'), JSON.stringify(manifest, null, 2));
    console.log('\n  Manifest written.');

    console.log(`\n  Evidence folder: ${EVIDENCE}`);
    console.log(`  Total captures: ${5 + 5 + 1} images + manifest`);
    console.log(`  Runtime errors: ${errors.length}`);

  } finally {
    await browser.close();
    server.close();
  }
}

main().catch(err => {
  console.error('Evidence capture failed:', err);
  process.exit(1);
});
