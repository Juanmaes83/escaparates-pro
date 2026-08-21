/**
 * Boids Simulation — structural and API contract tests.
 *
 * These verify the module's exports, shader content, and API surface without
 * requiring WebGL. GPU-dependent behavior is tested via Playwright in the
 * QA evidence suite.
 *
 * Run: node --test labs/immersive-worlds/engine/capabilities/gpgpu-boids/boids-simulation.test.mjs
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(HERE, 'boids-simulation.js'), 'utf8');

describe('BoidsSimulation module structure', () => {
  it('exports the BoidsSimulation class', () => {
    assert.match(src, /export class BoidsSimulation/);
  });

  it('contains position and velocity GLSL shaders', () => {
    assert.match(src, /POSITION_SHADER/);
    assert.match(src, /VELOCITY_SHADER/);
    assert.match(src, /uniform float activeBirdCount/);
  });

  it('velocity shader implements separation, alignment, and cohesion', () => {
    assert.match(src, /separationThresh/);
    assert.match(src, /alignmentThresh/);
    assert.match(src, /Cohesion/i);
  });

  it('velocity shader supports obstacle avoidance via uniform array', () => {
    assert.match(src, /obstaclePositions/);
    assert.match(src, /obstacleRadii/);
    assert.match(src, /obstacleStrengths/);
    assert.match(src, /obstacleCount/);
  });

  it('position shader does Euler integration with phase tracking', () => {
    assert.match(src, /position \+ velocity \* delta \* 15\.0/);
    assert.match(src, /phase/);
  });

  it('does not contain donor-specific content in code or shaders', () => {
    // Strip the file header (provenance comment) before checking — the
    // provenance block legitimately names donor repos per §18.
    const codeBody = src.replace(/^\/\*\*[\s\S]*?\*\//, '');
    assert.doesNotMatch(codeBody, /crow/i);
    assert.doesNotMatch(codeBody, /atlas/i);
    assert.doesNotMatch(codeBody, /lil-gui/i);
    assert.doesNotMatch(codeBody, /van.gogh/i);
    assert.doesNotMatch(codeBody, /preset/i);
  });

  it('imports only from the vendored three.js (no other dependencies)', () => {
    const imports = src.match(/from\s+['"]([^'"]+)['"]/g) || [];
    for (const imp of imports) {
      const mod = imp.match(/from\s+['"]([^'"]+)['"]/)[1];
      assert.ok(
        mod.includes('three') || mod.includes('vendor'),
        `unexpected import: ${mod}`
      );
    }
  });
});

describe('BoidsSimulation API surface', () => {
  it('constructor accepts renderer, GPUComputationRendererClass, and config', () => {
    assert.match(src, /constructor\s*\(\s*renderer\s*,\s*GPUComputationRendererClass/);
  });

  it('exposes positionTexture and velocityTexture getters', () => {
    assert.match(src, /get positionTexture/);
    assert.match(src, /get velocityTexture/);
  });

  it('exposes compute(dt) method', () => {
    assert.match(src, /compute\s*\(\s*dt\s*\)/);
  });

  it('exposes setPredator and setObstacle methods', () => {
    assert.match(src, /setPredator\s*\(/);
    assert.match(src, /setObstacle\s*\(/);
  });

  it('exposes setForces for runtime tuning', () => {
    assert.match(src, /setForces\s*\(/);
  });

  it('exposes dispose method', () => {
    assert.match(src, /dispose\s*\(\s*\)/);
  });

  it('clamps delta to 0.05 in compute', () => {
    assert.match(src, /Math\.min\(\s*dt\s*,\s*0\.05\s*\)/);
  });

  it('activeAgentCount setter clamps to maxAgents', () => {
    assert.match(src, /Math\.min\(\s*n\s*,\s*this\.maxAgents\s*\)/);
  });
});
