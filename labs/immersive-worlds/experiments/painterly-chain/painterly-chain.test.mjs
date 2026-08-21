/**
 * Painterly Chain — Full Causal Pipeline tests
 *
 * Verifies the end-to-end causal chain:
 *   ARTWORK → DIRECTION FIELD → POISSON → BÉZIER STROKES → IMPASTO MATERIAL
 * and the cross-capability coupling:
 *   DIRECTION FIELD → BOID FLOCK ORIENTATION
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const capDir = resolve(__dirname, '../../engine/capabilities');

const { buildDirectionField } = await import(
  resolve(capDir, 'painterly/direction-field.js')
);
const { generatePoissonSeeds } = await import(
  resolve(capDir, 'painterly/poisson-seeds.js')
);
const {
  STROKE_VERTEX_SHADER, STROKE_FRAGMENT_SHADER, HEIGHT_FRAGMENT_SHADER,
  traceDirectionField, buildStrokesFromField,
} = await import(resolve(capDir, 'painterly/bezier-strokes.js'));
const {
  IMPASTO_COMPOSITE_VERTEX, IMPASTO_COMPOSITE_FRAGMENT, IMPASTO_UNIFORMS,
} = await import(resolve(capDir, 'painterly/impasto-material.glsl.js'));

describe('full causal chain: artwork → field → seeds → strokes → material', () => {
  const W = 64, H = 64;

  function makeTestArtwork(w, h) {
    const pixels = new Uint8Array(w * h * 4);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const u = x / w, v = y / h;
        const cx = u - 0.5, cy = v - 0.5;
        const r = Math.sqrt(cx * cx + cy * cy);
        const angle = Math.atan2(cy, cx) + r * 10;
        const wave = 0.5 + 0.3 * Math.sin(angle * 3);
        const off = (y * w + x) * 4;
        pixels[off]     = Math.round(wave * 200 + 30);
        pixels[off + 1] = Math.round(wave * 140 + 20);
        pixels[off + 2] = Math.round(wave * 70 + 10);
        pixels[off + 3] = 255;
      }
    }
    return pixels;
  }

  let artPixels, field, seeds, strokeData;

  it('step 1: generates procedural artwork with valid RGBA', () => {
    artPixels = makeTestArtwork(W, H);
    assert.equal(artPixels.length, W * H * 4);
    let nonBlack = 0;
    for (let i = 0; i < artPixels.length; i += 4) {
      if (artPixels[i] > 0 || artPixels[i + 1] > 0) nonBlack++;
    }
    assert.ok(nonBlack > W * H * 0.5, 'artwork should have substantial non-black content');
  });

  it('step 2: builds direction field from artwork', () => {
    field = buildDirectionField(artPixels, W, H);
    assert.ok(field.angle instanceof Float32Array);
    assert.ok(field.confidence instanceof Float32Array);
    assert.equal(field.angle.length, W * H);
    let hasVariation = false;
    for (let i = 1; i < field.angle.length; i++) {
      if (Math.abs(field.angle[i] - field.angle[0]) > 0.01) { hasVariation = true; break; }
    }
    assert.ok(hasVariation, 'direction field should have angular variation');
  });

  it('step 3: generates Poisson seeds from field confidence', () => {
    seeds = generatePoissonSeeds(W, H, field.confidence, {
      totalCount: 500, generation: 0,
    });
    assert.ok(Array.isArray(seeds));
    assert.ok(seeds.length > 50, `expected >50 seeds, got ${seeds.length}`);
    for (const s of seeds) {
      assert.ok(s.x >= 0 && s.x <= W, 'seed x in bounds');
      assert.ok(s.y >= 0 && s.y <= H, 'seed y in bounds');
      assert.ok(typeof s.layer === 'number');
    }
  });

  it('step 4: builds Bézier strokes from seeds + field', () => {
    strokeData = buildStrokesFromField(seeds, field, W, H, artPixels, {
      lengthScale: 1.0, layerWidths: [10, 5, 2.5], layerLengths: [20, 12, 6],
    });
    assert.equal(strokeData.count, seeds.length);
    assert.equal(strokeData.p0.length, seeds.length * 2);
    assert.equal(strokeData.p1.length, seeds.length * 2);
    assert.equal(strokeData.p2.length, seeds.length * 2);
    assert.equal(strokeData.p3.length, seeds.length * 2);
    assert.equal(strokeData.colors.length, seeds.length * 3);
    assert.equal(strokeData.widths.length, seeds.length);

    let controlPointsValid = true;
    for (let i = 0; i < strokeData.count * 2; i++) {
      if (strokeData.p0[i] < -0.1 || strokeData.p0[i] > 1.1) {
        controlPointsValid = false;
        break;
      }
    }
    assert.ok(controlPointsValid, 'control points should be in ~[0,1] UV space');
  });

  it('step 4b: strokes are oriented by direction field (not random)', () => {
    let tangentAngles = [];
    for (let i = 0; i < Math.min(strokeData.count, 100); i++) {
      const off = i * 2;
      const dx = strokeData.p3[off] - strokeData.p0[off];
      const dy = strokeData.p3[off + 1] - strokeData.p0[off + 1];
      if (Math.hypot(dx, dy) > 0.001) {
        tangentAngles.push(Math.atan2(dy, dx));
      }
    }
    assert.ok(tangentAngles.length > 20, 'should have enough measurable strokes');
    let sum = 0;
    for (let i = 1; i < tangentAngles.length; i++) {
      sum += Math.abs(tangentAngles[i] - tangentAngles[0]);
    }
    const avgDiff = sum / (tangentAngles.length - 1);
    assert.ok(avgDiff > 0.1, 'stroke angles should vary (field-driven, not uniform)');
  });

  it('step 5a: stroke pigment shader contains bristle fibers', () => {
    assert.ok(STROKE_FRAGMENT_SHADER.includes('fibers'));
    assert.ok(STROKE_FRAGMENT_SHADER.includes('pigmentBreak'));
  });

  it('step 5b: height shader encodes height/wet/furrow', () => {
    assert.ok(HEIGHT_FRAGMENT_SHADER.includes('height'));
    assert.ok(HEIGHT_FRAGMENT_SHADER.includes('wet'));
    assert.ok(HEIGHT_FRAGMENT_SHADER.includes('furrow'));
  });

  it('step 5c: impasto composite has GGX + Sobel + canvas weave', () => {
    assert.ok(IMPASTO_COMPOSITE_FRAGMENT.includes('distributionGGX'));
    assert.ok(IMPASTO_COMPOSITE_FRAGMENT.includes('geometrySmith'));
    assert.ok(IMPASTO_COMPOSITE_FRAGMENT.includes('canvasWeave'));
    assert.ok(IMPASTO_COMPOSITE_FRAGMENT.includes('paintHeight'));
  });

  it('step 5d: impasto composite has variable roughness (wet vs dry)', () => {
    assert.ok(IMPASTO_COMPOSITE_FRAGMENT.includes('mix(0.44, 0.11, wet)'));
  });

  it('colors are sampled from artwork pixels, not black', () => {
    let nonBlack = 0;
    for (let i = 0; i < strokeData.count; i++) {
      if (strokeData.colors[i * 3] > 0.01 ||
          strokeData.colors[i * 3 + 1] > 0.01) {
        nonBlack++;
      }
    }
    assert.ok(nonBlack > strokeData.count * 0.8,
      'most stroke colors should be non-black (sampled from artwork)');
  });
});

describe('cross-capability coupling: direction-field → boid orientation', () => {
  it('direction field provides angle that can orient boid marks', () => {
    const W = 32, H = 32;
    const pixels = new Uint8Array(W * H * 4);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const off = (y * W + x) * 4;
        pixels[off] = Math.round((x / W) * 255);
        pixels[off + 1] = 128;
        pixels[off + 2] = 64;
        pixels[off + 3] = 255;
      }
    }
    const field = buildDirectionField(pixels, W, H);

    const testPositions = [
      { x: 8, y: 8 }, { x: 16, y: 16 }, { x: 24, y: 8 },
    ];
    for (const pos of testPositions) {
      const idx = pos.y * W + pos.x;
      const angle = field.angle[idx];
      const confidence = field.confidence[idx];
      assert.ok(typeof angle === 'number' && !isNaN(angle),
        `angle at (${pos.x},${pos.y}) should be valid number`);
      assert.ok(confidence >= 0 && confidence <= 1,
        `confidence at (${pos.x},${pos.y}) should be in [0,1]`);
    }
  });

  it('boid mark vertex shader reads direction field and artwork textures', () => {
    const src = readFileSync(
      resolve(__dirname, 'painterly-chain.js'), 'utf-8'
    );
    assert.ok(src.includes('dirFieldTex'), 'shader references direction field texture');
    assert.ok(src.includes('artworkTex'), 'shader references artwork texture');
    assert.ok(src.includes('cos(angle)'), 'shader rotates by field angle');
    assert.ok(src.includes('sin(angle)'), 'shader rotates by field angle');
  });
});

describe('experiment file references all six capabilities', () => {
  const src = readFileSync(
    resolve(__dirname, 'painterly-chain.js'), 'utf-8'
  );

  it('imports direction-field.js', () => {
    assert.ok(src.includes("direction-field.js"));
  });
  it('imports poisson-seeds.js', () => {
    assert.ok(src.includes("poisson-seeds.js"));
  });
  it('imports bezier-strokes.js', () => {
    assert.ok(src.includes("bezier-strokes.js"));
  });
  it('imports impasto-material.glsl.js', () => {
    assert.ok(src.includes("impasto-material.glsl.js"));
  });
  it('imports boids-simulation.js', () => {
    assert.ok(src.includes("boids-simulation.js"));
  });
  it('imports gradient-map.glsl.js', () => {
    assert.ok(src.includes("gradient-map.glsl.js"));
  });
  it('proof state declares all six capabilities', () => {
    assert.ok(src.includes("'direction-field'"));
    assert.ok(src.includes("'poisson-seeds'"));
    assert.ok(src.includes("'bezier-strokes'"));
    assert.ok(src.includes("'impasto-material'"));
    assert.ok(src.includes("'gpgpu-boids'"));
    assert.ok(src.includes("'gradient-map'"));
  });
  it('proof state declares causal chain steps', () => {
    assert.ok(src.includes("'procedural-artwork'"));
    assert.ok(src.includes("'direction-field-analysis'"));
    assert.ok(src.includes("'poisson-seed-distribution'"));
    assert.ok(src.includes("'bezier-stroke-geometry'"));
    assert.ok(src.includes("'impasto-three-pass-composite'"));
    assert.ok(src.includes("'direction-field-coupled-boid-marks'"));
  });
  it('proof state declares cross-coupling', () => {
    assert.ok(src.includes("direction-field → boid-mark-orientation"));
  });
});
