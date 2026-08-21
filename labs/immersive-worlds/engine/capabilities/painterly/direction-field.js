/**
 * Direction Field Analyzer — Museum Living Art Capability
 *
 * Sculpted from: Juanmaes83/wet-paint-flow (WPF-1)
 * License: MIT
 *
 * Computes a per-pixel brush-direction field from an image using structure
 * tensor analysis (Sobel gradients → tensor accumulation → eigenvalue
 * decomposition via integral-image box filtering).
 *
 * Content-agnostic: takes RGBA pixel data, returns angle + confidence arrays.
 * No Three.js dependency — pure CPU math suitable for any image source.
 */

/**
 * @typedef {Object} DirectionFieldResult
 * @property {Float32Array} angle      Per-pixel brush angle in radians
 * @property {Float32Array} confidence Per-pixel direction confidence [0,1]
 * @property {Float32Array} luminance  Per-pixel luminance [0,1]
 */

/**
 * @typedef {Object} DirectionFieldOptions
 * @property {number}  [tensorRadius=2]  Box-filter radius for tensor smoothing
 * @property {number}  [structureWeight=0.5]  Weight for image structure contribution
 * @property {number}  [geometryWeight=0.5]   Weight for depth/normal geometry contribution
 * @property {Uint8Array} [normalDepthData]  RGBA normal+depth buffer (optional, for 3D scenes)
 */

/**
 * Build a direction field from RGBA color pixel data.
 *
 * @param {Uint8Array} colorData  RGBA pixels, length = width * height * 4
 * @param {number} width          Image width
 * @param {number} height         Image height
 * @param {DirectionFieldOptions} [options]
 * @returns {DirectionFieldResult}
 */
export function buildDirectionField(colorData, width, height, options = {}) {
  const {
    tensorRadius = 2,
    structureWeight = 0.5,
    geometryWeight = 0.0,
    normalDepthData = null,
  } = options;

  const count = width * height;
  const luminance = new Float32Array(count);
  const gx = new Float32Array(count);
  const gy = new Float32Array(count);
  const angle = new Float32Array(count);
  const confidence = new Float32Array(count);

  // Step 1: Extract luminance (BT.709).
  for (let i = 0; i < count; i++) {
    const offset = i * 4;
    luminance[i] = (
      colorData[offset] * 0.2126
      + colorData[offset + 1] * 0.7152
      + colorData[offset + 2] * 0.0722
    ) / 255;
  }

  const sample = (array, x, y) => array[
    Math.max(0, Math.min(height - 1, y)) * width
    + Math.max(0, Math.min(width - 1, x))
  ];

  // Step 2: Sobel gradients.
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      gx[i] = sample(luminance, x + 1, y) - sample(luminance, x - 1, y);
      gy[i] = sample(luminance, x, y + 1) - sample(luminance, x, y - 1);
    }
  }

  // Step 3: Structure tensor components.
  const tensorXX = new Float32Array(count);
  const tensorYY = new Float32Array(count);
  const tensorXY = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    tensorXX[i] = gx[i] * gx[i];
    tensorYY[i] = gy[i] * gy[i];
    tensorXY[i] = gx[i] * gy[i];
  }

  // Step 4: Integral images for box-filtered tensor smoothing.
  const integralStride = width + 1;

  const buildIntegral = (source) => {
    const integral = new Float32Array((width + 1) * (height + 1));
    for (let y = 0; y < height; y++) {
      let rowSum = 0;
      for (let x = 0; x < width; x++) {
        rowSum += source[y * width + x];
        integral[(y + 1) * integralStride + x + 1] =
          integral[y * integralStride + x + 1] + rowSum;
      }
    }
    return integral;
  };

  const integralXX = buildIntegral(tensorXX);
  const integralYY = buildIntegral(tensorYY);
  const integralXY = buildIntegral(tensorXY);

  const boxSum = (integral, x0, y0, x1, y1) => (
    integral[y1 * integralStride + x1]
    - integral[y0 * integralStride + x1]
    - integral[y1 * integralStride + x0]
    + integral[y0 * integralStride + x0]
  );

  // Optional: depth gradients from normal+depth buffer.
  let depthGx, depthGy;
  if (normalDepthData) {
    const depthArr = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      depthArr[i] = normalDepthData[i * 4 + 3] / 255;
    }
    depthGx = new Float32Array(count);
    depthGy = new Float32Array(count);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = y * width + x;
        depthGx[i] = sample(depthArr, x + 1, y) - sample(depthArr, x - 1, y);
        depthGy[i] = sample(depthArr, x, y + 1) - sample(depthArr, x, y - 1);
      }
    }
  }

  // Step 5: Eigenvalue decomposition → angle + confidence.
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const x0 = Math.max(0, x - tensorRadius);
      const y0 = Math.max(0, y - tensorRadius);
      const x1 = Math.min(width, x + tensorRadius + 1);
      const y1 = Math.min(height, y + tensorRadius + 1);

      const jxx = boxSum(integralXX, x0, y0, x1, y1);
      const jyy = boxSum(integralYY, x0, y0, x1, y1);
      const jxy = boxSum(integralXY, x0, y0, x1, y1);

      const trace = jxx + jyy;
      const discriminant = Math.sqrt(Math.max(0, (jxx - jyy) ** 2 + 4 * jxy * jxy));
      const imageConfidence = Math.min(1, discriminant / (trace + 0.0008));
      const imageAngle = 0.5 * Math.atan2(2 * jxy, jxx - jyy) + Math.PI * 0.5;

      if (normalDepthData && geometryWeight > 0) {
        const normalX = normalDepthData[i * 4] / 127.5 - 1;
        const normalY = normalDepthData[i * 4 + 1] / 127.5 - 1;
        const normalAngle = Math.atan2(normalX, -normalY);
        const depthAngle = Math.atan2(depthGx[i], -depthGy[i]);
        const geometryAngle = lineBlend(
          normalAngle, 0.55,
          depthAngle, Math.min(0.9, Math.hypot(depthGx[i], depthGy[i]) * 80),
        );
        angle[i] = lineBlend(
          imageAngle, structureWeight * (0.18 + imageConfidence * 0.82),
          geometryAngle, geometryWeight,
        );
        confidence[i] = Math.min(1, 0.24 + imageConfidence * 0.52
          + Math.hypot(depthGx[i], depthGy[i]) * 12);
      } else {
        angle[i] = imageAngle;
        confidence[i] = Math.min(1, 0.18 + imageConfidence * 0.72);
      }
    }
  }

  return { angle, confidence, luminance };
}

/**
 * Blend two angular values (line-symmetric, not circular).
 * Uses double-angle trick to handle π-periodicity of undirected lines.
 */
function lineBlend(angleA, weightA, angleB, weightB) {
  const x = Math.cos(angleA * 2) * weightA + Math.cos(angleB * 2) * weightB;
  const y = Math.sin(angleA * 2) * weightA + Math.sin(angleB * 2) * weightB;
  return Math.atan2(y, x) * 0.5;
}

/**
 * Sample the direction field at a given pixel coordinate.
 * @param {DirectionFieldResult} field
 * @param {number} width
 * @param {number} height
 * @param {number} x
 * @param {number} y
 * @returns {{angle: number, confidence: number}}
 */
export function sampleField(field, width, height, x, y) {
  const ix = Math.max(0, Math.min(width - 1, Math.round(x)));
  const iy = Math.max(0, Math.min(height - 1, Math.round(y)));
  const i = iy * width + ix;
  return { angle: field.angle[i], confidence: field.confidence[i] };
}
