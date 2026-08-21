/**
 * Bezier Ribbon Stroke Geometry — Museum Living Art Capability
 *
 * Sculpted from: Juanmaes83/wet-paint-flow (WPF-3)
 * Upstream: Original work by Juanmaes83
 * License: MIT (code only)
 *
 * Instanced cubic Bezier ribbon strips. Each stroke is defined by four
 * control points (P0..P3) in normalized [0,1] UV space, a width, and a
 * per-stroke random seed. The vertex shader evaluates the cubic Bezier
 * on the GPU with a variable-width pressure profile and bristle wobble.
 *
 * Content-agnostic — no scene-specific colors, palettes, or semantic
 * zones. Color is set per-stroke from the consumer's pipeline.
 */

const STROKE_VERTEX_SHADER = /* glsl */`
  attribute vec2 aP0;
  attribute vec2 aP1;
  attribute vec2 aP2;
  attribute vec2 aP3;
  attribute vec3 aColor;
  attribute float aWidth;
  attribute float aSeed;
  attribute float aBrushLayer;

  uniform vec2 uResolution;
  uniform float uStrokeScale;
  uniform float uBrushSize;
  uniform vec3 uBrushLayerVisibility;

  varying vec3 vColor;
  varying float vSide;
  varying float vT;
  varying float vSeed;
  varying float vBrushLayerVisible;
  varying vec2 vTangent;

  vec2 bezier(float t) {
    float s = 1.0 - t;
    return s*s*s*aP0 + 3.0*s*s*t*aP1 + 3.0*s*t*t*aP2 + t*t*t*aP3;
  }

  void main() {
    float t = position.x;
    float side = position.y;
    vec2 center = bezier(t);
    vec2 before = bezier(max(0.0, t - 0.012));
    vec2 after  = bezier(min(1.0, t + 0.012));
    vec2 tangentPx = normalize((after - before) * uResolution);
    vec2 normalPx  = vec2(-tangentPx.y, tangentPx.x);
    float pressure = 0.44 + 0.56 * pow(max(0.0, sin(t * 3.14159265)), 0.42);
    float wobble = sin(t * 15.0 + aSeed * 43.0) * 0.032
                 + sin(t * 38.0 + aSeed * 19.0) * 0.012;
    vec2 uv = center + normalPx * aWidth * uStrokeScale * uBrushSize
              * (side * pressure + wobble) / uResolution;
    gl_Position = vec4(uv * 2.0 - 1.0, 0.0, 1.0);
    vColor = aColor;
    vTangent = tangentPx;
    vSide = side;
    vT = t;
    vSeed = aSeed;
    vBrushLayerVisible = aBrushLayer < 0.5
      ? uBrushLayerVisibility.x
      : (aBrushLayer < 1.5 ? uBrushLayerVisibility.y : uBrushLayerVisibility.z);
  }
`;

const STROKE_FRAGMENT_SHADER = /* glsl */`
  uniform float uCoverage;
  uniform float uViscosity;
  uniform float uBristleDetail;
  varying vec3 vColor;
  varying float vSide;
  varying float vT;
  varying float vSeed;
  varying float vBrushLayerVisible;

  float noise(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  void main() {
    if (vBrushLayerVisible < 0.5) discard;
    if (fract(vSeed * 17.713) > uCoverage) discard;
    float edge = 1.0 - smoothstep(0.76, 1.0, abs(vSide));
    float tips = smoothstep(0.0, 0.025, vT) * (1.0 - smoothstep(0.95, 1.0, vT));
    float fibers = 0.5 + 0.5 * sin(
      vSide * (20.0 + uBristleDetail * 9.0) +
      sin(vT * 24.0 + vSeed * 17.0) * 1.7 +
      vSeed * 67.0
    );
    float microFibers = 0.5 + 0.5 * sin(vSide * 61.0 - vT * 9.0 + vSeed * 101.0);
    float splitFibers = smoothstep(0.18, 0.84, fibers);
    float bristle = mix(1.0, 0.86 + splitFibers * 0.12 + microFibers * 0.035, uBristleDetail);
    float pigmentBreak = mix(
      0.955, 1.0,
      noise(vec2(floor(vT * 72.0) + vSeed * 11.0, floor(vSide * 17.0)))
    );
    float edgePool = pow(1.0 - abs(vSide), 0.52);
    float cohesion = mix(0.84 + splitFibers * 0.16, 1.0, uViscosity);
    float alpha = edge * tips * bristle * pigmentBreak * cohesion;
    vec3 pigment = vColor * (0.91 + splitFibers * 0.095 + microFibers * 0.025);
    pigment *= mix(0.94, mix(1.045, 1.12, uViscosity), edgePool);
    gl_FragColor = vec4(pigment, alpha);
  }
`;

const HEIGHT_FRAGMENT_SHADER = /* glsl */`
  uniform float uCoverage;
  uniform float uViscosity;
  uniform float uBristleDetail;
  varying float vSide;
  varying float vT;
  varying float vSeed;
  varying float vBrushLayerVisible;

  void main() {
    if (vBrushLayerVisible < 0.5) discard;
    if (fract(vSeed * 17.713) > uCoverage) discard;
    float edge = 1.0 - smoothstep(0.72, 1.0, abs(vSide));
    float tips = smoothstep(0.0, 0.025, vT) * (1.0 - smoothstep(0.95, 1.0, vT));
    float ridgeWave = 0.5 + 0.5 * sin(
      vSide * (20.0 + uBristleDetail * 9.0)
      + sin(vT * 23.0 + vSeed * 23.0) * 1.7
      + vSeed * 67.0
    );
    float microRidge = 0.5 + 0.5 * sin(vSide * 61.0 - vT * 9.0 + vSeed * 101.0);
    float ridges = mix(0.74, 0.52 + pow(ridgeWave, 2.1) * 0.42 + microRidge * 0.08, uBristleDetail);
    float centralLoad = 0.7 + 0.3 * pow(max(0.0, 1.0 - abs(vSide)), 0.48);
    float body = edge * tips;
    float height = body * ridges * centralLoad * mix(0.062, 0.108, uViscosity);
    float wet = body * (0.62) * (0.038 + ridgeWave * 0.022);
    float furrow = body * (0.018 + ridgeWave * 0.052 + microRidge * 0.012);
    gl_FragColor = vec4(height, wet, furrow, 1.0);
  }
`;

/**
 * Direction-field tracing — integrates a seed point through the field
 * to produce trace points that become Bezier control points.
 *
 * @param {Object} field  - Direction field from buildDirectionField()
 * @param {number} width  - Field width
 * @param {number} height - Field height
 * @param {number} x      - Start X in field space
 * @param {number} y      - Start Y in field space
 * @param {number} sign   - Trace direction (+1 forward, -1 backward)
 * @param {number} distance - Total trace length in field pixels
 * @param {number} steps  - Number of integration steps
 * @returns {{count: number, points: Float32Array}} Traced points
 */
function traceDirectionField(field, width, height, x, y, sign, distance, steps) {
  const points = new Float32Array(steps * 2);
  let px = x, py = y;
  let prevDx = 0, prevDy = 0;
  let count = 0;
  const stepLength = distance / steps;

  for (let step = 0; step < steps; step++) {
    const idx = (Math.round(Math.max(0, Math.min(height - 1, py))) * width
               + Math.round(Math.max(0, Math.min(width - 1, px))));
    let angle = field.angle[idx];
    let dx = Math.cos(angle) * sign;
    let dy = Math.sin(angle) * sign;
    if (step > 0 && dx * prevDx + dy * prevDy < 0) { dx *= -1; dy *= -1; }

    const mx = px + dx * stepLength * 0.5;
    const my = py + dy * stepLength * 0.5;
    const midIdx = (Math.round(Math.max(0, Math.min(height - 1, my))) * width
                   + Math.round(Math.max(0, Math.min(width - 1, mx))));
    let ndx = Math.cos(field.angle[midIdx]) * sign;
    let ndy = Math.sin(field.angle[midIdx]) * sign;
    if (ndx * dx + ndy * dy < 0) { ndx *= -1; ndy *= -1; }

    const nx = px + ndx * stepLength;
    const ny = py + ndy * stepLength;
    if (nx < 1 || ny < 1 || nx >= width - 1 || ny >= height - 1) break;
    px = nx; py = ny;
    prevDx = ndx; prevDy = ndy;
    points[count * 2] = px;
    points[count * 2 + 1] = py;
    count++;
  }
  return { count, points };
}

const TRACE_STEPS = 10;

/**
 * Build Bezier control points for a set of seed points using
 * direction-field tracing.
 *
 * @param {Array} seeds        - Array of {x, y, layer, random} from generatePoissonSeeds()
 * @param {Object} field       - Direction field from buildDirectionField()
 * @param {number} fieldWidth  - Field width
 * @param {number} fieldHeight - Field height
 * @param {Uint8Array} colorData - RGBA pixel data for color sampling
 * @param {Object} [options]
 * @param {number} [options.lengthScale=1]  - Stroke length multiplier
 * @param {number[]} [options.layerWidths=[11.5, 6.0, 3.15]] - Width per layer
 * @param {number[]} [options.layerLengths=[25, 14, 7.4]] - Base trace length per layer
 * @returns {Object} Stroke data ready for GPU upload
 */
function buildStrokesFromField(seeds, field, fieldWidth, fieldHeight, colorData, options = {}) {
  const {
    lengthScale = 1,
    layerWidths = [11.5, 6.0, 3.15],
    layerLengths = [25, 14, 7.4],
  } = options;

  const count = seeds.length;
  const p0 = new Float32Array(count * 2);
  const p1 = new Float32Array(count * 2);
  const p2 = new Float32Array(count * 2);
  const p3 = new Float32Array(count * 2);
  const colors = new Float32Array(count * 3);
  const widths = new Float32Array(count);
  const randoms = new Float32Array(count);
  const brushLayers = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const seed = seeds[i];
    const x = seed.x;
    const y = seed.y;
    const layer = seed.layer || 0;
    const rng = seed.random || Math.random();

    const baseLength = (layerLengths[layer] || 14) * lengthScale * (0.82 + rng * 0.36);
    const back = traceDirectionField(field, fieldWidth, fieldHeight, x, y, -1, baseLength * 0.5, TRACE_STEPS);
    const fwd  = traceDirectionField(field, fieldWidth, fieldHeight, x, y,  1, baseLength * 0.5, TRACE_STEPS);

    const bEnd = Math.max(0, back.count - 1) * 2;
    const bMid = Math.floor(back.count * 0.48) * 2;
    const fMid = Math.floor(fwd.count * 0.48) * 2;
    const fEnd = Math.max(0, fwd.count - 1) * 2;

    const off = i * 2;
    p0[off]     = (back.count ? back.points[bEnd]     : x) / fieldWidth;
    p0[off + 1] = (back.count ? back.points[bEnd + 1] : y) / fieldHeight;
    p1[off]     = (back.count ? back.points[bMid]     : x) / fieldWidth;
    p1[off + 1] = (back.count ? back.points[bMid + 1] : y) / fieldHeight;
    p2[off]     = (fwd.count  ? fwd.points[fMid]      : x) / fieldWidth;
    p2[off + 1] = (fwd.count  ? fwd.points[fMid + 1]  : y) / fieldHeight;
    p3[off]     = (fwd.count  ? fwd.points[fEnd]      : x) / fieldWidth;
    p3[off + 1] = (fwd.count  ? fwd.points[fEnd + 1]  : y) / fieldHeight;

    if (colorData) {
      const px = Math.max(0, Math.min(fieldWidth - 1, Math.round(x)));
      const py = Math.max(0, Math.min(fieldHeight - 1, Math.round(y)));
      const cOff = (py * fieldWidth + px) * 4;
      colors[i * 3]     = colorData[cOff] / 255;
      colors[i * 3 + 1] = colorData[cOff + 1] / 255;
      colors[i * 3 + 2] = colorData[cOff + 2] / 255;
    }

    widths[i] = (layerWidths[layer] || 6) * (0.82 + rng * 0.36);
    randoms[i] = rng + i * 0.00013;
    brushLayers[i] = layer;
  }

  return { count, p0, p1, p2, p3, colors, widths, randoms, brushLayers };
}

export {
  STROKE_VERTEX_SHADER,
  STROKE_FRAGMENT_SHADER,
  HEIGHT_FRAGMENT_SHADER,
  traceDirectionField,
  buildStrokesFromField,
};
