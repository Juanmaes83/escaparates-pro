/**
 * Painterly capabilities — functional tests.
 *
 * These modules are pure CPU math with no WebGL dependency, so we can test
 * them fully in Node.js.
 *
 * Run: node --test labs/immersive-worlds/engine/capabilities/painterly/painterly.test.mjs
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));

// -- Direction Field tests (source-level + functional) -----------------------

describe('direction-field module', () => {
  const src = readFileSync(join(HERE, 'direction-field.js'), 'utf8');

  it('exports buildDirectionField and sampleField', () => {
    assert.match(src, /export function buildDirectionField/);
    assert.match(src, /export function sampleField/);
  });

  it('has no Three.js imports', () => {
    assert.doesNotMatch(src, /from\s+['"]three['"]/);
  });

  it('does not contain donor-specific content outside provenance header', () => {
    const body = src.replace(/^\/\*\*[\s\S]*?\*\//, '');
    assert.doesNotMatch(body, /van.gogh/i);
    assert.doesNotMatch(body, /crow/i);
    assert.doesNotMatch(body, /lil-gui/i);
    assert.doesNotMatch(body, /preset/i);
    assert.doesNotMatch(body, /SEMANTIC\.(SKY|MOUNTAIN|GROUND)/);
  });

  it('computes a direction field from synthetic gradient image', async () => {
    const { buildDirectionField } = await import('./direction-field.js');
    const w = 16, h = 16;
    const pixels = new Uint8Array(w * h * 4);
    // Horizontal gradient: brightness increases left to right.
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const v = Math.round((x / (w - 1)) * 255);
        const off = (y * w + x) * 4;
        pixels[off] = v;
        pixels[off + 1] = v;
        pixels[off + 2] = v;
        pixels[off + 3] = 255;
      }
    }
    const field = buildDirectionField(pixels, w, h);
    assert.equal(field.angle.length, w * h);
    assert.equal(field.confidence.length, w * h);
    assert.equal(field.luminance.length, w * h);
    // Interior pixels should have non-zero confidence for a clear gradient.
    const midConf = field.confidence[8 * w + 8];
    assert.ok(midConf > 0, `center confidence should be > 0, got ${midConf}`);
    // Luminance at left edge should be near 0, at right edge near 1.
    assert.ok(field.luminance[0] < 0.05, `left luminance too high: ${field.luminance[0]}`);
    assert.ok(field.luminance[w - 1] > 0.95, `right luminance too low: ${field.luminance[w - 1]}`);
  });

  it('sampleField returns angle and confidence at valid coordinates', async () => {
    const { buildDirectionField, sampleField } = await import('./direction-field.js');
    const w = 8, h = 8;
    const pixels = new Uint8Array(w * h * 4).fill(128);
    const field = buildDirectionField(pixels, w, h);
    const s = sampleField(field, w, h, 4, 4);
    assert.equal(typeof s.angle, 'number');
    assert.equal(typeof s.confidence, 'number');
  });

  it('sampleField clamps out-of-bounds coordinates', async () => {
    const { buildDirectionField, sampleField } = await import('./direction-field.js');
    const w = 4, h = 4;
    const pixels = new Uint8Array(w * h * 4).fill(200);
    const field = buildDirectionField(pixels, w, h);
    // Should not throw for negative or oversized coordinates.
    const s1 = sampleField(field, w, h, -5, -5);
    const s2 = sampleField(field, w, h, 100, 100);
    assert.equal(typeof s1.angle, 'number');
    assert.equal(typeof s2.angle, 'number');
  });
});

// -- Poisson Seeds tests (source-level + functional) -------------------------

describe('poisson-seeds module', () => {
  const src = readFileSync(join(HERE, 'poisson-seeds.js'), 'utf8');

  it('exports generatePoissonSeeds', () => {
    assert.match(src, /export function generatePoissonSeeds/);
  });

  it('has no Three.js imports', () => {
    assert.doesNotMatch(src, /from\s+['"]three['"]/);
  });

  it('does not contain donor-specific content outside provenance header', () => {
    const body = src.replace(/^\/\*\*[\s\S]*?\*\//, '');
    assert.doesNotMatch(body, /van.gogh/i);
    assert.doesNotMatch(body, /crow/i);
    assert.doesNotMatch(body, /stroke/i);
    assert.doesNotMatch(body, /SEMANTIC/);
  });

  it('generates seeds with expected properties', async () => {
    const { generatePoissonSeeds } = await import('./poisson-seeds.js');
    const w = 64, h = 64;
    const confidence = new Float32Array(w * h).fill(0.5);
    const seeds = generatePoissonSeeds(w, h, confidence, { totalCount: 200 });
    assert.ok(seeds.length > 0, 'should generate at least one seed');
    assert.ok(seeds.length <= 200, `should not exceed target, got ${seeds.length}`);
    const first = seeds[0];
    assert.equal(typeof first.x, 'number');
    assert.equal(typeof first.y, 'number');
    assert.equal(typeof first.layer, 'number');
    assert.equal(typeof first.random, 'number');
    assert.equal(typeof first.confidence, 'number');
    assert.ok(first.x >= 0 && first.x <= w);
    assert.ok(first.y >= 0 && first.y <= h);
    assert.ok(first.layer >= 0 && first.layer <= 2);
  });

  it('produces three distinct layers', async () => {
    const { generatePoissonSeeds } = await import('./poisson-seeds.js');
    const w = 128, h = 128;
    const confidence = new Float32Array(w * h).fill(0.7);
    const seeds = generatePoissonSeeds(w, h, confidence, { totalCount: 1000 });
    const layers = new Set(seeds.map(s => s.layer));
    assert.ok(layers.has(0), 'should have coarse layer');
    assert.ok(layers.has(1), 'should have medium layer');
    assert.ok(layers.has(2), 'should have fine layer');
  });

  it('respects mask function', async () => {
    const { generatePoissonSeeds } = await import('./poisson-seeds.js');
    const w = 64, h = 64;
    const confidence = new Float32Array(w * h).fill(0.5);
    // Mask: only allow left half.
    const seeds = generatePoissonSeeds(w, h, confidence, {
      totalCount: 500,
      mask: (x) => x < w / 2,
    });
    for (const s of seeds) {
      assert.ok(s.x < w / 2, `seed at x=${s.x} violates mask`);
    }
  });

  it('generation counter produces different seed sets', async () => {
    const { generatePoissonSeeds } = await import('./poisson-seeds.js');
    const w = 32, h = 32;
    const confidence = new Float32Array(w * h).fill(0.5);
    const gen0 = generatePoissonSeeds(w, h, confidence, { totalCount: 100, generation: 0 });
    const gen1 = generatePoissonSeeds(w, h, confidence, { totalCount: 100, generation: 1 });
    // Seeds should differ across generations (positions won't match exactly).
    const posKey = (s) => `${s.x.toFixed(3)},${s.y.toFixed(3)}`;
    const set0 = new Set(gen0.map(posKey));
    const shared = gen1.filter(s => set0.has(posKey(s)));
    assert.ok(shared.length < gen0.length * 0.5,
      'different generations should produce mostly different seeds');
  });

  it('seeds maintain minimum distance between points', async () => {
    const { generatePoissonSeeds } = await import('./poisson-seeds.js');
    const w = 64, h = 64;
    const confidence = new Float32Array(w * h).fill(0.8);
    const seeds = generatePoissonSeeds(w, h, confidence, { totalCount: 200 });
    // Within each layer, check that no two seeds are too close.
    for (let layer = 0; layer <= 2; layer++) {
      const layerSeeds = seeds.filter(s => s.layer === layer);
      for (let i = 0; i < layerSeeds.length; i++) {
        for (let j = i + 1; j < layerSeeds.length; j++) {
          const dist = Math.hypot(
            layerSeeds[i].x - layerSeeds[j].x,
            layerSeeds[i].y - layerSeeds[j].y,
          );
          assert.ok(dist > 0.5,
            `layer ${layer}: seeds ${i} and ${j} too close (${dist.toFixed(2)})`);
        }
      }
    }
  });
});
