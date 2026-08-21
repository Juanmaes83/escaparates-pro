/**
 * Evidence capture for Painterly Chain — Full Causal Pipeline.
 *
 * Captures screenshots at key moments to prove the causal chain is
 * visually wired: artwork → direction field → poisson → Bézier strokes →
 * impasto material + direction-field-coupled boid marks.
 */

import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const URL = 'http://localhost:4200/labs/immersive-worlds/experiments/painterly-chain/';

async function capture() {
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--no-sandbox', '--disable-gpu'],
  });

  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const shots = [];

  async function shot(name, label) {
    const path = resolve(__dirname, `${name}.png`);
    await page.screenshot({ path });
    shots.push({ name, label, path });
    console.log(`  captured: ${name} — ${label}`);
  }

  console.log('Scene 1: First impression');
  await page.goto(URL, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  await shot('S1_first-impression', 'Initial painterly surface with impasto composite');

  console.log('Scene 2: Temporal evidence (living marks in motion)');
  await page.waitForTimeout(2000);
  await shot('S2_temporal-00', 'Living marks frame 0');
  await page.waitForTimeout(1500);
  await shot('S2_temporal-01', 'Living marks frame 1');
  await page.waitForTimeout(1500);
  await shot('S2_temporal-02', 'Living marks frame 2');
  await page.waitForTimeout(1500);
  await shot('S2_temporal-03', 'Living marks frame 3');

  console.log('Scene 3: Pointer interaction — center');
  await page.mouse.move(640, 400);
  await page.waitForTimeout(2500);
  await shot('S3_pointer-center', 'Living marks scatter from center pointer');

  console.log('Scene 4: Pointer interaction — corner');
  await page.mouse.move(200, 150);
  await page.waitForTimeout(2500);
  await shot('S4_pointer-corner', 'Living marks scatter from corner pointer');

  console.log('Scene 5: Status readout + pointer away');
  await page.mouse.move(1300, 900);
  await page.waitForTimeout(3000);
  await shot('S5_relaxed', 'Marks returned to painting surface');

  console.log('Scene 6: Proof state');
  const proof = await page.evaluate(() => window.__painterlyChainProof);
  if (proof) {
    console.log('  proof state:', JSON.stringify(proof, null, 2));
  }
  await shot('S6_status-readout', 'Status bar with chain metrics');

  await browser.close();

  const manifest = {
    experiment: 'painterly-chain',
    capturedAt: new Date().toISOString(),
    url: URL,
    viewport: { width: 1280, height: 800 },
    screenshots: shots.map(s => ({ name: s.name, label: s.label })),
    proofState: proof || null,
  };
  writeFileSync(
    resolve(__dirname, 'manifest.json'),
    JSON.stringify(manifest, null, 2),
  );
  console.log(`\nDone: ${shots.length} screenshots captured.`);
}

capture().catch(err => {
  console.error('Capture failed:', err.message);
  process.exit(1);
});
