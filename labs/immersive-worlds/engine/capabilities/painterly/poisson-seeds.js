/**
 * Poisson-Disk Persistent Seeding — Museum Living Art Capability
 *
 * Sculpted from: Juanmaes83/wet-paint-flow (WPF-2)
 * License: MIT
 *
 * Generates blue-noise-distributed stroke seed points using quasi-random
 * Halton sequences and grid-based collision detection. Frame-coherent:
 * a generation counter produces repeatable but distinct seed sets across
 * reseeds.
 *
 * Content-agnostic: produces {x, y, layer, random} points. No Three.js
 * dependency — pure CPU math.
 */

/**
 * @typedef {Object} SeedPoint
 * @property {number} x          Pixel X coordinate
 * @property {number} y          Pixel Y coordinate
 * @property {number} layer      Which density layer (0=coarse, 1=medium, 2=fine)
 * @property {number} random     Deterministic random value [0,1] for this seed
 * @property {number} confidence Direction field confidence at this point
 */

/**
 * @typedef {Object} PoissonSeedOptions
 * @property {number}  [totalCount=14000]  Desired total seed count
 * @property {number}  [coarseRatio=0.06]  Fraction of seeds in coarse layer
 * @property {number}  [mediumRatio=0.225] Fraction of seeds in medium layer
 * @property {number}  [generation=0]      Generation counter for seed variation
 * @property {(x: number, y: number) => boolean} [mask]  Optional mask function — return false to reject a point
 */

/**
 * Generate Poisson-disk-distributed seed points across an image.
 *
 * @param {number} width   Image width in pixels
 * @param {number} height  Image height in pixels
 * @param {Float32Array} confidenceField  Per-pixel confidence [0,1], length = width*height
 * @param {PoissonSeedOptions} [options]
 * @returns {SeedPoint[]}
 */
export function generatePoissonSeeds(width, height, confidenceField, options = {}) {
  const {
    totalCount = 14000,
    coarseRatio = 0.06,
    mediumRatio = 0.225,
    generation = 0,
    mask,
  } = options;

  const desiredCount = Math.max(100, Math.min(50000, Math.round(totalCount)));
  const coarseCount = Math.round(desiredCount * coarseRatio);
  const mediumCount = Math.round(desiredCount * mediumRatio);
  const fineCount = desiredCount - coarseCount - mediumCount;

  const analysisScale = Math.sqrt((width * height) / (312 * 460));
  const densityScale = Math.sqrt(14000 / desiredCount);
  const distanceScale = analysisScale * densityScale;

  const seeds = [];
  const layerPlan = [
    [0, coarseCount, 5.8 * distanceScale],
    [1, mediumCount, 2.75 * distanceScale],
    [2, fineCount, 1.2 * distanceScale],
  ];

  for (const [layer, target, minDistance] of layerPlan) {
    poissonLayer(width, height, confidenceField, layer, target, minDistance, generation, mask, seeds);
  }

  return seeds;
}

function poissonLayer(width, height, confidenceField, layer, target, minDistance, generation, mask, accepted) {
  const cellSize = minDistance / Math.SQRT2;
  const cols = Math.ceil(width / cellSize);
  const rows = Math.ceil(height / cellSize);
  const grid = new Int32Array(cols * rows).fill(-1);
  const local = [];
  const maxAttempts = target * 34;
  const generationOffset = generation * 104729 + layer * 9176;

  for (let attempt = 0; attempt < maxAttempts && local.length < target; attempt++) {
    const index = attempt + generationOffset + 1;
    const x = fract(0.5 + index * 0.754877666) * width;
    const y = fract(0.5 + index * 0.569840296) * height;

    if (mask && !mask(x, y)) continue;

    const fieldIndex = Math.min(
      confidenceField.length - 1,
      Math.floor(y) * width + Math.floor(x)
    );
    const confidence = confidenceField[fieldIndex];
    if (hash(index * 2.13) > 0.64 + confidence * 0.36) continue;

    const gx = Math.floor(x / cellSize);
    const gy = Math.floor(y / cellSize);
    let valid = true;
    for (let oy = -2; oy <= 2 && valid; oy++) {
      for (let ox = -2; ox <= 2; ox++) {
        const cx = gx + ox;
        const cy = gy + oy;
        if (cx < 0 || cy < 0 || cx >= cols || cy >= rows) continue;
        const neighborIndex = grid[cy * cols + cx];
        if (neighborIndex < 0) continue;
        const neighbor = local[neighborIndex];
        if (Math.hypot(neighbor.x - x, neighbor.y - y) < minDistance) {
          valid = false;
          break;
        }
      }
    }
    if (!valid) continue;

    const seed = {
      x,
      y,
      layer,
      random: hash(index * 7.31 + layer * 13.7),
      confidence,
    };
    grid[gy * cols + gx] = local.length;
    local.push(seed);
    accepted.push(seed);
  }
}

function fract(value) {
  return value - Math.floor(value);
}

function hash(value) {
  return fract(Math.sin(value * 91.173 + 17.371) * 43758.5453);
}
