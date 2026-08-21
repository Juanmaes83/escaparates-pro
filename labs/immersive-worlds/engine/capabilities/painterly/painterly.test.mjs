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

// -- Bezier Strokes tests (source-level + functional) -------------------------

describe('bezier-strokes module', () => {
  const src = readFileSync(join(HERE, 'bezier-strokes.js'), 'utf8');

  it('exports STROKE_VERTEX_SHADER and STROKE_FRAGMENT_SHADER', () => {
    assert.match(src, /export\s*\{[\s\S]*STROKE_VERTEX_SHADER/);
    assert.match(src, /export\s*\{[\s\S]*STROKE_FRAGMENT_SHADER/);
  });

  it('exports HEIGHT_FRAGMENT_SHADER', () => {
    assert.match(src, /export\s*\{[\s\S]*HEIGHT_FRAGMENT_SHADER/);
  });

  it('exports traceDirectionField and buildStrokesFromField', () => {
    assert.match(src, /export\s*\{[\s\S]*traceDirectionField/);
    assert.match(src, /export\s*\{[\s\S]*buildStrokesFromField/);
  });

  it('vertex shader contains cubic Bezier evaluation', () => {
    assert.match(src, /s\*s\*s\*aP0/);
    assert.match(src, /3\.0\*s\*s\*t\*aP1/);
  });

  it('vertex shader has variable-width pressure profile', () => {
    assert.match(src, /pressure/);
    assert.match(src, /wobble/);
  });

  it('fragment shader has bristle fiber simulation', () => {
    assert.match(src, /fibers/);
    assert.match(src, /microFibers/);
    assert.match(src, /bristle/);
    assert.match(src, /pigmentBreak/);
  });

  it('height shader encodes height, wet, and furrow channels', () => {
    assert.match(src, /ridgeWave/);
    assert.match(src, /microRidge/);
    assert.match(src, /centralLoad/);
    assert.match(src, /vec4\(height, wet, furrow/);
  });

  it('does not contain donor-specific content outside provenance header', () => {
    const body = src.replace(/^\/\*\*[\s\S]*?\*\//, '');
    assert.doesNotMatch(body, /van.gogh/i);
    assert.doesNotMatch(body, /crow/i);
    assert.doesNotMatch(body, /semantic/i);
    assert.doesNotMatch(body, /lil-gui/i);
    assert.doesNotMatch(body, /I18N/);
  });

  it('traceDirectionField traces through a uniform field', async () => {
    const { traceDirectionField } = await import('./bezier-strokes.js');
    const w = 32, h = 32;
    const field = {
      angle: new Float32Array(w * h).fill(0),
      confidence: new Float32Array(w * h).fill(1),
    };
    const result = traceDirectionField(field, w, h, 16, 16, 1, 10, 10);
    assert.ok(result.count > 0, 'should trace at least one point');
    assert.ok(result.points[0] > 16, 'trace should advance rightward (angle=0)');
  });

  it('traceDirectionField stops at field boundaries', async () => {
    const { traceDirectionField } = await import('./bezier-strokes.js');
    const w = 8, h = 8;
    const field = {
      angle: new Float32Array(w * h).fill(0),
      confidence: new Float32Array(w * h).fill(1),
    };
    const result = traceDirectionField(field, w, h, 6, 4, 1, 100, 50);
    for (let i = 0; i < result.count; i++) {
      assert.ok(result.points[i * 2] < w, `x should stay in bounds`);
    }
  });

  it('buildStrokesFromField produces correct array shapes', async () => {
    const { buildStrokesFromField } = await import('./bezier-strokes.js');
    const { buildDirectionField } = await import('./direction-field.js');
    const { generatePoissonSeeds } = await import('./poisson-seeds.js');
    const w = 32, h = 32;
    const pixels = new Uint8Array(w * h * 4);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const off = (y * w + x) * 4;
        pixels[off] = Math.round((x / w) * 255);
        pixels[off + 1] = Math.round((y / h) * 200);
        pixels[off + 2] = 100;
        pixels[off + 3] = 255;
      }
    }
    const field = buildDirectionField(pixels, w, h);
    const seeds = generatePoissonSeeds(w, h, field.confidence, { totalCount: 50 });
    const strokes = buildStrokesFromField(seeds, field, w, h, pixels);
    assert.equal(strokes.count, seeds.length);
    assert.equal(strokes.p0.length, seeds.length * 2);
    assert.equal(strokes.p1.length, seeds.length * 2);
    assert.equal(strokes.p2.length, seeds.length * 2);
    assert.equal(strokes.p3.length, seeds.length * 2);
    assert.equal(strokes.colors.length, seeds.length * 3);
    assert.equal(strokes.widths.length, seeds.length);
    assert.equal(strokes.randoms.length, seeds.length);
    assert.equal(strokes.brushLayers.length, seeds.length);
  });

  it('buildStrokesFromField samples color from pixel data', async () => {
    const { buildStrokesFromField } = await import('./bezier-strokes.js');
    const w = 8, h = 8;
    const field = {
      angle: new Float32Array(w * h).fill(Math.PI / 4),
      confidence: new Float32Array(w * h).fill(0.8),
    };
    const pixels = new Uint8Array(w * h * 4);
    for (let i = 0; i < w * h; i++) {
      pixels[i * 4] = 200;
      pixels[i * 4 + 1] = 100;
      pixels[i * 4 + 2] = 50;
      pixels[i * 4 + 3] = 255;
    }
    const seeds = [{ x: 4, y: 4, layer: 1, random: 0.5 }];
    const strokes = buildStrokesFromField(seeds, field, w, h, pixels);
    assert.ok(strokes.colors[0] > 0.7, `red channel should be ~0.78, got ${strokes.colors[0]}`);
    assert.ok(strokes.colors[1] > 0.3, `green channel should be ~0.39, got ${strokes.colors[1]}`);
  });
});

// -- Impasto Material tests (source-level) ------------------------------------

describe('impasto-material module', () => {
  const src = readFileSync(join(HERE, 'impasto-material.glsl.js'), 'utf8');

  it('exports IMPASTO_COMPOSITE_VERTEX and IMPASTO_COMPOSITE_FRAGMENT', () => {
    assert.match(src, /export\s*\{[\s\S]*IMPASTO_COMPOSITE_VERTEX/);
    assert.match(src, /export\s*\{[\s\S]*IMPASTO_COMPOSITE_FRAGMENT/);
  });

  it('exports IMPASTO_UNIFORMS', () => {
    assert.match(src, /export\s*\{[\s\S]*IMPASTO_UNIFORMS/);
  });

  it('composite shader has GGX microfacet distribution', () => {
    assert.match(src, /distributionGGX/);
    assert.match(src, /alpha2/);
  });

  it('composite shader has Smith geometry occlusion', () => {
    assert.match(src, /geometrySmith/);
  });

  it('composite shader derives normals from Sobel on height buffer', () => {
    assert.match(src, /hTL/);
    assert.match(src, /hBR/);
    assert.match(src, /paintNormal\s*=\s*normalize/);
    assert.match(src, /gradient/);
  });

  it('composite shader has clearcoat and grazing sheen', () => {
    assert.match(src, /clearcoat/);
    assert.match(src, /grazingSheen/);
  });

  it('composite shader has canvas weave texture', () => {
    assert.match(src, /canvasWeave/);
    assert.match(src, /warpFiber/);
    assert.match(src, /weftFiber/);
  });

  it('composite shader has variable roughness (wet vs dry)', () => {
    assert.match(src, /roughness\s*=\s*mix\(0\.44,\s*0\.11,\s*wet\)/);
  });

  it('does not contain donor-specific content outside provenance header', () => {
    const body = src.replace(/^\/\*\*[\s\S]*?\*\//, '');
    assert.doesNotMatch(body, /van.gogh/i);
    assert.doesNotMatch(body, /semantic/i);
    assert.doesNotMatch(body, /uMode/);
    assert.doesNotMatch(body, /pencil/i);
    assert.doesNotMatch(body, /I18N/);
  });
});
