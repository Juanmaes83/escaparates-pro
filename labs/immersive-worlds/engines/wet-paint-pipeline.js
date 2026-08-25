/**
 * wet-paint-pipeline.js — LITERAL PORT of Juanmaes83/wet-paint-flow main.js @ 0b9ba9a
 *
 * ~1,560 lines ported verbatim from the donor.
 * Only changes: import/export, UI DOM removal, Museum renderer seam,
 * renderComposite destination (null → outputTarget), processImage entry.
 *
 * PORT FIRST → SEE → SCULPT.
 */

import * as THREE from '../vendor/three/three.module.min.js';

// ── DONOR CONSTANTS (verbatim from main.js lines 345–398) ──────────

const SEMANTIC = Object.freeze({
  SKY: 1,
  MOUNTAIN: 2,
  GROUND: 3,
  VEGETATION: 4,
  BUILDING: 5,
  IMAGE: 6,
});

const palettes = {
  [SEMANTIC.SKY]: ['#17377f', '#2356ac', '#3477c2', '#69a1d2', '#e6b84d', '#f5d879'],
  [SEMANTIC.MOUNTAIN]: ['#294875', '#3c668c', '#568796', '#86a08a', '#d6ad4f', '#ead080'],
  [SEMANTIC.GROUND]: ['#7b3e18', '#a85a1e', '#cd7b24', '#e4a334', '#f1c551', '#7e7d36'],
  [SEMANTIC.VEGETATION]: ['#123c38', '#1d5947', '#39734e', '#6b873f', '#c89b34', '#e2ba55'],
  [SEMANTIC.BUILDING]: ['#673a29', '#a2603c', '#c28b57', '#d9b979', '#ead49b', '#f3e3b7'],
};

const QUALITY_PROFILES = Object.freeze({
  balanced: Object.freeze({ renderScale: 0.7, smallScale: 0.88, analysisEdge: 340, samples: 0 }),
  high: Object.freeze({ renderScale: 1, smallScale: 1, analysisEdge: 460, samples: 4 }),
  ultra: Object.freeze({ renderScale: 1.25, smallScale: 1.18, analysisEdge: 580, samples: 4 }),
});

const STROKE_TRACE_STEPS = 10;
const GROWTH_DURATION = 5;
const IMAGE_MATTE_SCALE = 0.982;

const params = {
  structure: 0.34,
  geometry: 0.28,
  semantic: 0.72,
  length: 1.48,
  strokeSize: 1,
  strokeCountK: 14,
  coverage: 0.99,
  impasto: 0.04,
  dryness: 0.69,
  viscosity: 0.58,
  bristleDetail: 0.82,
  qualityMode: 'high',
  viewMode: 5,
  brushLayers: [true, true, true],
  cameraDrift: false,
  growthPlayback: true,
  movingLight: true,
  modelLightAngle: -52,
  liveModelAnalysis: false,
  showBase: false,
  paused: false,
};

// ── DONOR UTILITY FUNCTIONS (verbatim from main.js) ────────────────

function paintWetness() {
  return THREE.MathUtils.clamp(1 - params.dryness, 0, 1);
}

function hash(value) {
  return fract(Math.sin(value * 91.173 + 17.371) * 43758.5453);
}

function fract(value) {
  return value - Math.floor(value);
}

function lineBlend3(angleA, weightA, angleB, weightB, angleC, weightC) {
  const x = Math.cos(angleA * 2) * weightA
    + Math.cos(angleB * 2) * weightB
    + Math.cos(angleC * 2) * weightC;
  const y = Math.sin(angleA * 2) * weightA
    + Math.sin(angleB * 2) * weightB
    + Math.sin(angleC * 2) * weightC;
  return Math.atan2(y, x) * 0.5;
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

// ── DONOR SHADERS (verbatim from main.js lines 809–1251) ───────────

const strokeVertexShader = `
  attribute vec2 aP0;
  attribute vec2 aP1;
  attribute vec2 aP2;
  attribute vec2 aP3;
  attribute vec3 aColor;
  attribute float aWidth;
  attribute float aSeed;
  attribute vec4 aPrevP01;
  attribute vec4 aPrevP23;
  attribute float aBirth;
  attribute float aDuration;
  attribute float aBrushLayer;
  uniform vec2 uResolution;
  uniform float uStrokeScale;
  uniform float uBrushSize;
  uniform float uGrowthTime;
  uniform float uGrowthEnabled;
  uniform float uSceneMorph;
  uniform vec3 uBrushLayerVisibility;
  varying vec3 vColor;
  varying float vSide;
  varying float vT;
  varying float vSeed;
  varying float vGrowth;
  varying float vFreshness;
  varying float vBrushLayerVisible;
  varying vec2 vTangent;

  vec2 bezier(float t) {
    float s = 1.0 - t;
    vec2 p0 = mix(aPrevP01.xy, aP0, uSceneMorph);
    vec2 p1 = mix(aPrevP01.zw, aP1, uSceneMorph);
    vec2 p2 = mix(aPrevP23.xy, aP2, uSceneMorph);
    vec2 p3 = mix(aPrevP23.zw, aP3, uSceneMorph);
    return s*s*s*p0 + 3.0*s*s*t*p1 + 3.0*s*t*t*p2 + t*t*t*p3;
  }

  void main() {
    float t = position.x;
    float side = position.y;
    vec2 center = bezier(t);
    vec2 before = bezier(max(0.0, t - 0.012));
    vec2 after = bezier(min(1.0, t + 0.012));
    vec2 tangentPx = normalize((after - before) * uResolution);
    vec2 normalPx = vec2(-tangentPx.y, tangentPx.x);
    float pressure = 0.44 + 0.56 * pow(max(0.0, sin(t * 3.14159265)), 0.42);
    float wobble = sin(t * 15.0 + aSeed * 43.0) * 0.032
      + sin(t * 38.0 + aSeed * 19.0) * 0.012;
    vec2 uv = center + normalPx * aWidth * uStrokeScale * uBrushSize * (side * pressure + wobble) / uResolution;
    gl_Position = vec4(uv * 2.0 - 1.0, 0.0, 1.0);
    vColor = aColor;
    vTangent = tangentPx;
    vSide = side;
    vT = t;
    vSeed = aSeed;
    vGrowth = uGrowthEnabled > 0.5
      ? clamp((uGrowthTime - aBirth) / max(0.05, aDuration), 0.0, 1.0)
      : 1.0;
    vBrushLayerVisible = aBrushLayer < 0.5
      ? uBrushLayerVisibility.x
      : (aBrushLayer < 1.5 ? uBrushLayerVisibility.y : uBrushLayerVisibility.z);
    float wetAge = max(0.0, uGrowthTime - aBirth);
    vFreshness = exp(-wetAge * 0.12);
  }
`;

const strokeFragmentShader = `
  uniform float uCoverage;
  uniform float uWetness;
  uniform float uViscosity;
  uniform float uBristleDetail;
  varying vec3 vColor;
  varying float vSide;
  varying float vT;
  varying float vSeed;
  varying float vGrowth;
  varying float vFreshness;
  varying float vBrushLayerVisible;

  float noise(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  void main() {
    if (vBrushLayerVisible < 0.5) discard;
    if (fract(vSeed * 17.713) > uCoverage) discard;
    if (vT > vGrowth) discard;
    float edge = 1.0 - smoothstep(0.76, 1.0, abs(vSide));
    float tips = smoothstep(0.0, 0.025, vT) * (1.0 - smoothstep(0.95, 1.0, vT));
    float liveTip = 1.0 - smoothstep(max(0.0, vGrowth - 0.08), max(0.001, vGrowth), vT);
    float fibers = 0.5 + 0.5 * sin(
      vSide * (20.0 + uBristleDetail * 9.0) +
      sin(vT * 24.0 + vSeed * 17.0) * 1.7 +
      vSeed * 67.0
    );
    float microFibers = 0.5 + 0.5 * sin(vSide * 61.0 - vT * 9.0 + vSeed * 101.0);
    float splitFibers = smoothstep(0.18, 0.84, fibers);
    float bristle = mix(1.0, 0.86 + splitFibers * 0.12 + microFibers * 0.035, uBristleDetail);
    float pigmentBreak = mix(
      0.955,
      1.0,
      noise(vec2(floor(vT * 72.0) + vSeed * 11.0, floor(vSide * 17.0)))
    );
    float edgePool = pow(1.0 - abs(vSide), 0.52);
    float cohesion = mix(0.84 + splitFibers * 0.16, 1.0, uViscosity);
    float alpha = edge * tips * liveTip * bristle * pigmentBreak * cohesion;
    vec3 pigment = vColor * (0.91 + splitFibers * 0.095 + microFibers * 0.025);
    pigment *= mix(0.94, mix(1.045, 1.12, uViscosity), edgePool);
    pigment += vec3(1.0, 0.82, 0.53) * vFreshness * uWetness * (0.018 + splitFibers * 0.012);
    gl_FragColor = vec4(pigment, alpha);
  }
`;

const heightFragmentShader = `
  uniform float uCoverage;
  uniform float uWetness;
  uniform float uViscosity;
  uniform float uBristleDetail;
  varying vec3 vColor;
  varying float vSide;
  varying float vT;
  varying float vSeed;
  varying float vGrowth;
  varying float vFreshness;
  varying float vBrushLayerVisible;
  void main() {
    if (vBrushLayerVisible < 0.5) discard;
    if (fract(vSeed * 17.713) > uCoverage) discard;
    if (vT > vGrowth) discard;
    float edge = 1.0 - smoothstep(0.72, 1.0, abs(vSide));
    float tips = smoothstep(0.0, 0.025, vT) * (1.0 - smoothstep(0.95, 1.0, vT));
    float liveTip = 1.0 - smoothstep(max(0.0, vGrowth - 0.08), max(0.001, vGrowth), vT);
    float ridgeWave = 0.5 + 0.5 * sin(
      vSide * (20.0 + uBristleDetail * 9.0) + sin(vT * 23.0 + vSeed * 23.0) * 1.7 + vSeed * 67.0
    );
    float microRidge = 0.5 + 0.5 * sin(vSide * 61.0 - vT * 9.0 + vSeed * 101.0);
    float ridges = mix(0.74, 0.52 + pow(ridgeWave, 2.1) * 0.42 + microRidge * 0.08, uBristleDetail);
    float centralLoad = 0.7 + 0.3 * pow(max(0.0, 1.0 - abs(vSide)), 0.48);
    float body = edge * tips * liveTip;
    float height = body * ridges * centralLoad * mix(0.062, 0.108, uViscosity);
    float wet = body * uWetness * (0.62 + vFreshness * 0.38) * (0.038 + ridgeWave * 0.022);
    float furrow = body * (0.018 + ridgeWave * 0.052 + microRidge * 0.012);
    gl_FragColor = vec4(height, wet, furrow, 1.0);
  }
`;

const pencilFragmentShader = `
  uniform float uCoverage;
  varying vec3 vColor;
  varying float vSide;
  varying float vT;
  varying float vSeed;
  varying float vGrowth;
  varying float vBrushLayerVisible;

  float graphiteNoise(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  void main() {
    if (vBrushLayerVisible < 0.5) discard;
    if (fract(vSeed * 17.713) > uCoverage) discard;
    if (vT > vGrowth) discard;
    float leadWobble = sin(vT * 31.0 + vSeed * 83.0) * 0.11
      + sin(vT * 73.0 + vSeed * 29.0) * 0.035;
    float leadDistance = abs(vSide - leadWobble);
    float core = 1.0 - smoothstep(0.19, 0.54, leadDistance);
    float ghost = (1.0 - smoothstep(0.1, 0.3, abs(vSide + leadWobble * 0.45 - 0.38))) * 0.18;
    float tips = smoothstep(0.0, 0.018, vT) * (1.0 - smoothstep(0.975, 1.0, vT));
    float liveTip = 1.0 - smoothstep(max(0.0, vGrowth - 0.07), max(0.001, vGrowth), vT);
    float grain = graphiteNoise(vec2(floor(vT * 170.0) + vSeed * 31.0, floor(vSide * 23.0)));
    float pressure = 0.58 + 0.42 * pow(max(0.0, sin(vT * 3.14159265)), 0.38);
    float alpha = (core + ghost) * tips * liveTip * pressure * (0.18 + grain * 0.28);
    vec3 graphite = vec3(0.105, 0.098, 0.087) * mix(0.76, 1.13, grain);
    gl_FragColor = vec4(graphite, alpha);
  }
`;

// ── COMPOSITE SHADER (verbatim from main.js lines 1067–1250) ───────

const compositeVertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position.xy, 0.0, 1.0);
    }
`;

const compositeFragmentShader = `
    varying vec2 vUv;
    uniform sampler2D uScene;
    uniform sampler2D uStroke;
    uniform sampler2D uHeight;
    uniform sampler2D uSemantic;
    uniform vec2 uTexel;
    uniform int uMode;
    uniform float uImpasto;
    uniform float uWetness;
    uniform float uLightAngle;
    uniform float uTime;

    float hash(vec2 p) {
      return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
    }

    const float PI = 3.14159265359;

    float saturatePaint(float value) {
      return clamp(value, 0.0, 1.0);
    }

    float distributionGGX(float nDotH, float roughness) {
      float alpha = roughness * roughness;
      float alpha2 = alpha * alpha;
      float denominator = nDotH * nDotH * (alpha2 - 1.0) + 1.0;
      return alpha2 / max(PI * denominator * denominator, 0.0001);
    }

    float geometrySmith(float nDotV, float nDotL, float roughness) {
      float r = roughness + 1.0;
      float k = (r * r) * 0.125;
      float ggxV = nDotV / max(nDotV * (1.0 - k) + k, 0.0001);
      float ggxL = nDotL / max(nDotL * (1.0 - k) + k, 0.0001);
      return ggxV * ggxL;
    }

    float wetSpecular(vec3 normal, vec3 lightDirection, float roughness) {
      vec3 viewDirection = vec3(0.0, 0.0, 1.0);
      vec3 halfVector = normalize(lightDirection + viewDirection);
      float nDotV = saturatePaint(dot(normal, viewDirection));
      float nDotL = saturatePaint(dot(normal, lightDirection));
      float nDotH = saturatePaint(dot(normal, halfVector));
      float vDotH = saturatePaint(dot(viewDirection, halfVector));
      float fresnel = 0.045 + (1.0 - 0.045) * pow(1.0 - vDotH, 5.0);
      float specular = distributionGGX(nDotH, roughness) *
        geometrySmith(nDotV, nDotL, roughness) * fresnel;
      return min(3.0, specular / max(4.0 * nDotV * nDotL, 0.001));
    }

    float paintHeight(vec2 uv) {
      return texture2D(uHeight, uv).r;
    }

    vec3 semanticColor(float id) {
      if (id < 0.5) return vec3(0.035, 0.045, 0.065);
      if (id < 1.5) return vec3(0.21, 0.38, 0.68);
      if (id < 2.5) return vec3(0.31, 0.48, 0.42);
      if (id < 3.5) return vec3(0.82, 0.55, 0.19);
      if (id < 4.5) return vec3(0.10, 0.34, 0.25);
      if (id < 5.5) return vec3(0.74, 0.55, 0.34);
      return vec3(0.78, 0.42, 0.23);
    }

    float pencilLuma(vec3 color) {
      return dot(color, vec3(0.2126, 0.7152, 0.0722));
    }

    float pencilNoise(vec2 pixel) {
      float coarse = hash(floor(pixel * 0.47));
      float fine = hash(floor(pixel * 1.31) + 23.7);
      return coarse * 0.58 + fine * 0.42;
    }

    void main() {
      vec3 base = texture2D(uScene, vUv).rgb;
      vec4 stroke = texture2D(uStroke, vUv);
      vec4 paintState = texture2D(uHeight, vUv);
      float height = paintState.r;
      float wet = saturatePaint(paintState.g * 5.0) * saturatePaint(uWetness);
      float furrow = saturatePaint(paintState.b * 11.0);

      if (uMode == 1) {
        vec2 pixel = vUv / uTexel;
        float centerLuma = pencilLuma(base);
        float leftLuma = pencilLuma(texture2D(uScene, vUv - vec2(uTexel.x * 1.6, 0.0)).rgb);
        float rightLuma = pencilLuma(texture2D(uScene, vUv + vec2(uTexel.x * 1.6, 0.0)).rgb);
        float topLuma = pencilLuma(texture2D(uScene, vUv + vec2(0.0, uTexel.y * 1.6)).rgb);
        float bottomLuma = pencilLuma(texture2D(uScene, vUv - vec2(0.0, uTexel.y * 1.6)).rgb);
        float contour = smoothstep(0.018, 0.15, length(vec2(rightLuma - leftLuma, topLuma - bottomLuma)));
        float tone = pow(max(0.0, 1.0 - centerLuma), 1.28);
        float paperGrain = pencilNoise(pixel * 0.58);
        float paperFiber = sin(pixel.x * 0.41 + sin(pixel.y * 0.017) * 2.1)
          * sin(pixel.y * 0.37 + sin(pixel.x * 0.021) * 1.7);
        vec3 paper = vec3(0.925, 0.902, 0.838)
          * (0.972 + paperGrain * 0.034 + paperFiber * 0.008);
        vec3 pencil = stroke.rgb / max(stroke.a, 0.025);
        float pencilAlpha = smoothstep(0.006, 0.62, stroke.a);
        float underdrawing = contour * 0.2 + tone * (0.018 + paperGrain * 0.025);
        vec3 sketch = mix(paper, pencil, clamp(pencilAlpha, 0.0, 0.88));
        sketch = mix(sketch, vec3(0.13, 0.12, 0.105), clamp(underdrawing, 0.0, 0.16));
        gl_FragColor = vec4(sketch, 1.0);
        #include <colorspace_fragment>
        return;
      }
      if (uMode == 2) {
        float id = floor(texture2D(uSemantic, vUv).r * 255.0 + 0.5);
        gl_FragColor = vec4(semanticColor(id), 1.0);
        #include <colorspace_fragment>
        return;
      }
      if (uMode == 3) {
        gl_FragColor = vec4(base, 1.0);
        #include <colorspace_fragment>
        return;
      }
      if (uMode == 4) {
        gl_FragColor = vec4(vec3(pow(height, 0.42)), 1.0);
        return;
      }
      vec2 pixel = vUv / uTexel;
      float canvasGrain = hash(floor(pixel * 0.46));
      float fineGrain = hash(floor(pixel * 1.17) + 17.0);
      float warpFiber = sin(pixel.y * 1.33 + sin(pixel.x * 0.021) * 1.8);
      float weftFiber = sin(pixel.x * 1.21 + sin(pixel.y * 0.018) * 1.6);
      float canvasWeave = warpFiber * weftFiber;
      vec3 canvasBeige = vec3(0.835, 0.775, 0.665);
      canvasBeige *= 0.968 + canvasGrain * 0.028 + fineGrain * 0.014 + canvasWeave * 0.009;
      if (uMode == 5) base = canvasBeige;

      float hTL = paintHeight(vUv + vec2(-uTexel.x, uTexel.y));
      float hT = paintHeight(vUv + vec2(0.0, uTexel.y));
      float hTR = paintHeight(vUv + vec2(uTexel.x, uTexel.y));
      float hL = paintHeight(vUv - vec2(uTexel.x, 0.0));
      float hR = paintHeight(vUv + vec2(uTexel.x, 0.0));
      float hBL = paintHeight(vUv + vec2(-uTexel.x, -uTexel.y));
      float hB = paintHeight(vUv - vec2(0.0, uTexel.y));
      float hBR = paintHeight(vUv + vec2(uTexel.x, -uTexel.y));
      vec2 gradient = vec2(
        hTL + 2.0 * hL + hBL - hTR - 2.0 * hR - hBR,
        hBL + 2.0 * hB + hBR - hTL - 2.0 * hT - hTR
      );
      vec3 paintNormal = normalize(vec3(
        gradient * (4.0 + uImpasto * 6.0),
        mix(1.08, 0.72, saturatePaint(uImpasto))
      ));
      vec3 lightDir = normalize(vec3(cos(uLightAngle), sin(uLightAngle), 0.72));
      float nDotL = saturatePaint(dot(paintNormal, lightDir));
      float diffuse = mix(0.78, 1.16, nDotL);
      float roughness = mix(0.44, 0.11, wet);
      float specular = wetSpecular(paintNormal, lightDir, roughness);
      vec3 halfDir = normalize(lightDir + vec3(0.0, 0.0, 1.0));
      float clearcoat = pow(saturatePaint(dot(paintNormal, halfDir)), mix(5.0, 13.0, wet));

      vec3 pigment = stroke.rgb / max(stroke.a, 0.065);
      pigment = clamp(pigment, vec3(0.0), vec3(1.45));
      float localPeak = max(max(max(hL, hR), max(hT, hB)), height);
      float pooledEdge = saturatePaint((localPeak - height) * 3.8);
      float ridgeCatch = saturatePaint(length(gradient) * 13.0 + pooledEdge * 0.7 + furrow * 0.3);
      pigment *= mix(0.91, 1.13, furrow);
      pigment *= 1.0 - pooledEdge * wet * 0.11;

      float layerOpacity = uMode == 0 ? 0.62 : 1.0;
      vec3 color = mix(base, pigment * diffuse, smoothstep(0.015, 0.78, stroke.a * 1.18) * layerOpacity);
      float paintMask = smoothstep(0.003, 0.055, height + stroke.a * 0.12);
      float grazingSheen = pow(1.0 - saturatePaint(paintNormal.z), 2.0) * wet;
      color += vec3(1.0, 0.9, 0.7) * (
        specular * 0.78 + clearcoat * wet * (0.18 + ridgeCatch * 0.82) + grazingSheen * 0.075
      ) * paintMask * (0.34 + uImpasto * 0.32) * layerOpacity;
      color += vec3(0.58, 0.34, 0.12) * pooledEdge * wet * stroke.a * 0.075 * layerOpacity;
      color -= vec3(0.065, 0.05, 0.032) * saturatePaint(-dot(paintNormal.xy, lightDir.xy)) * height * uImpasto * layerOpacity;
      color *= 0.987 + canvasGrain * 0.017 + fineGrain * 0.008;
      gl_FragColor = vec4(color, 1.0);
      #include <colorspace_fragment>
    }
`;

// ── UPLOADED IMAGE MATERIAL (verbatim from main.js lines 436–475) ──

const uploadedMaterialVertexShader = `
    varying vec2 vUv;
    uniform vec2 uScale;
    void main() {
      vUv = uv;
      gl_Position = vec4(position.xy * uScale, 0.0, 1.0);
    }
`;

const uploadedMaterialFragmentShader = `
    varying vec2 vUv;
    uniform sampler2D uImage;
    uniform int uPass;
    void main() {
      vec4 source = texture2D(uImage, vUv);
      if (source.a < 0.035) discard;
      if (uPass == 1) {
        gl_FragColor = vec4(${SEMANTIC.IMAGE.toFixed(1)} / 255.0, 0.0, 0.0, 1.0);
        return;
      }
      if (uPass == 2) {
        gl_FragColor = vec4(0.5, 0.5, 1.0, 0.5);
        return;
      }
      gl_FragColor = vec4(source.rgb, 1.0);
    }
`;


// ══════════════════════════════════════════════════════════════════════
// PIPELINE FACTORY — wraps donor state + functions, minimal seam
// ══════════════════════════════════════════════════════════════════════

export function createWetPaintPipeline(renderer) {

  // ── DONOR STATE (verbatim from main.js lines 436–478, 804–807, 1256–1310) ──

  const uploadedScene = new THREE.Scene();
  const uploadedCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const uploadedMaterial = new THREE.ShaderMaterial({
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
    uniforms: {
      uImage: { value: null },
      uPass: { value: 0 },
      uScale: { value: new THREE.Vector2(1, 1) },
    },
    vertexShader: uploadedMaterialVertexShader,
    fragmentShader: uploadedMaterialFragmentShader,
  });
  const uploadedQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), uploadedMaterial);
  uploadedScene.add(uploadedQuad);
  let uploadedImage = null;
  let uploadedTexture = null;

  const overlayScene = new THREE.Scene();
  const overlayCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const screenScene = new THREE.Scene();
  const screenCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  // ── MATERIALS (verbatim from main.js lines 956–1254) ──

  const strokeMaterial = new THREE.ShaderMaterial({
    transparent: true,
    depthTest: false,
    depthWrite: false,
    side: THREE.DoubleSide,
    vertexShader: strokeVertexShader,
    fragmentShader: strokeFragmentShader,
    uniforms: {
      uResolution: { value: new THREE.Vector2(1, 1) },
      uStrokeScale: { value: 1 },
      uBrushSize: { value: params.strokeSize },
      uCoverage: { value: params.coverage },
      uWetness: { value: paintWetness() },
      uViscosity: { value: params.viscosity },
      uBristleDetail: { value: params.bristleDetail },
      uGrowthTime: { value: 0 },
      uGrowthEnabled: { value: 1 },
      uSceneMorph: { value: 1 },
      uBrushLayerVisibility: { value: new THREE.Vector3(1, 1, 1) },
    },
  });

  const pencilStrokeMaterial = new THREE.ShaderMaterial({
    transparent: true,
    depthTest: false,
    depthWrite: false,
    side: THREE.DoubleSide,
    vertexShader: strokeVertexShader,
    fragmentShader: pencilFragmentShader,
    uniforms: {
      uResolution: { value: new THREE.Vector2(1, 1) },
      uStrokeScale: { value: 0.34 },
      uBrushSize: { value: params.strokeSize },
      uCoverage: { value: params.coverage },
      uGrowthTime: { value: 0 },
      uGrowthEnabled: { value: 1 },
      uSceneMorph: { value: 1 },
      uBrushLayerVisibility: { value: new THREE.Vector3(1, 1, 1) },
    },
  });

  const heightMaterial = new THREE.ShaderMaterial({
    transparent: true,
    depthTest: false,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    vertexShader: strokeVertexShader,
    fragmentShader: heightFragmentShader,
    uniforms: {
      uResolution: { value: new THREE.Vector2(1, 1) },
      uStrokeScale: { value: 1 },
      uBrushSize: { value: params.strokeSize },
      uCoverage: { value: params.coverage },
      uWetness: { value: paintWetness() },
      uViscosity: { value: params.viscosity },
      uBristleDetail: { value: params.bristleDetail },
      uGrowthTime: { value: 0 },
      uGrowthEnabled: { value: 1 },
      uSceneMorph: { value: 1 },
      uBrushLayerVisibility: { value: new THREE.Vector3(1, 1, 1) },
    },
  });

  const compositeMaterial = new THREE.ShaderMaterial({
    depthTest: false,
    depthWrite: false,
    uniforms: {
      uScene: { value: null },
      uStroke: { value: null },
      uHeight: { value: null },
      uSemantic: { value: null },
      uTexel: { value: new THREE.Vector2(1, 1) },
      uMode: { value: 0 },
      uImpasto: { value: params.impasto },
      uWetness: { value: paintWetness() },
      uLightAngle: { value: 0 },
      uTime: { value: 0 },
    },
    vertexShader: compositeVertexShader,
    fragmentShader: compositeFragmentShader,
  });

  const screenQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), compositeMaterial);
  screenScene.add(screenQuad);

  // ── PIPELINE STATE (verbatim from main.js lines 1256–1310) ──

  let sceneTarget;
  let colorTarget;
  let normalTarget;
  let semanticTarget;
  let strokeTarget;
  let heightTarget;
  let outputTarget; // SEAM: replaces renderer.setRenderTarget(null) destination
  let strokeMesh;
  let strokeGeometry;
  let analysis = null;
  let seeds = [];
  let outputWidth = 0;
  let outputHeight = 0;
  let renderWidth = 0;
  let renderHeight = 0;
  let analysisWidth = 0;
  let analysisHeight = 0;
  let buffers = null;
  let fieldDirty = true;
  let strokeGeometryDirty = false;
  let resizeDirty = true;
  let sceneTargetDirty = true;
  let seedGeneration = 0;
  let growthTimeline = 0;
  let growthStartTimeline = 0;
  let strokeTargetsDirty = true;
  let compositeDirty = true;
  let growthWasActive = false;
  const backwardTraceScratch = new Float32Array(STROKE_TRACE_STEPS * 2);
  const forwardTraceScratch = new Float32Array(STROKE_TRACE_STEPS * 2);

  // ── makeTarget (verbatim from main.js lines 1324–1336) ──

  function makeTarget(width, height, options = {}) {
    const target = new THREE.WebGLRenderTarget(width, height, {
      minFilter: options.nearest ? THREE.NearestFilter : THREE.LinearFilter,
      magFilter: options.nearest ? THREE.NearestFilter : THREE.LinearFilter,
      format: THREE.RGBAFormat,
      type: THREE.UnsignedByteType,
      depthBuffer: options.depth !== false,
      stencilBuffer: false,
    });
    target.samples = renderer.capabilities.isWebGL2 ? (options.samples || 0) : 0;
    target.texture.colorSpace = THREE.NoColorSpace;
    return target;
  }

  // ── disposeTargets (verbatim from main.js line 1338–1340) ──

  function disposeTargets() {
    [sceneTarget, colorTarget, normalTarget, semanticTarget, strokeTarget, heightTarget, outputTarget].forEach((target) => target?.dispose());
  }

  // ── resize (adapted from main.js lines 1377–1456) ──
  // SEAM: no DOM mount/fitCanvasFrameToSource; receives explicit width/height

  function resize(width, height) {
    const aspect = width / height;
    const quality = QUALITY_PROFILES[params.qualityMode] || QUALITY_PROFILES.high;
    const renderScale = width * height > 420000 ? quality.renderScale : quality.smallScale;
    const nextRenderWidth = Math.max(2, Math.round(width * renderScale));
    const nextRenderHeight = Math.max(2, Math.round(height * renderScale));
    let nextAnalysisWidth;
    let nextAnalysisHeight;
    if (aspect >= 1) {
      nextAnalysisWidth = Math.min(quality.analysisEdge, Math.max(300, Math.round(width * 0.46)));
      nextAnalysisHeight = Math.max(144, Math.round(nextAnalysisWidth / aspect));
    } else {
      nextAnalysisHeight = Math.min(quality.analysisEdge, Math.max(300, Math.round(height * 0.4)));
      nextAnalysisWidth = Math.max(144, Math.round(nextAnalysisHeight * aspect));
    }
    const targetSamples = renderer.capabilities.isWebGL2 ? quality.samples : 0;
    const dimensionsUnchanged = Boolean(
      sceneTarget
      && outputWidth === width
      && outputHeight === height
      && renderWidth === nextRenderWidth
      && renderHeight === nextRenderHeight
      && analysisWidth === nextAnalysisWidth
      && analysisHeight === nextAnalysisHeight
      && sceneTarget.samples === targetSamples
      && strokeTarget?.samples === targetSamples
      && heightTarget?.samples === targetSamples,
    );
    if (dimensionsUnchanged) return false;

    outputWidth = width;
    outputHeight = height;
    renderWidth = nextRenderWidth;
    renderHeight = nextRenderHeight;
    analysisWidth = nextAnalysisWidth;
    analysisHeight = nextAnalysisHeight;
    disposeTargets();

    sceneTarget = makeTarget(renderWidth, renderHeight, { samples: quality.samples });
    colorTarget = makeTarget(analysisWidth, analysisHeight);
    normalTarget = makeTarget(analysisWidth, analysisHeight, { nearest: true });
    semanticTarget = makeTarget(analysisWidth, analysisHeight, { nearest: true });
    strokeTarget = makeTarget(renderWidth, renderHeight, { depth: false, samples: quality.samples });
    heightTarget = makeTarget(renderWidth, renderHeight, { depth: false, samples: quality.samples });
    outputTarget = makeTarget(renderWidth, renderHeight, { depth: false });
    buffers = {
      color: new Uint8Array(analysisWidth * analysisHeight * 4),
      normalDepth: new Uint8Array(analysisWidth * analysisHeight * 4),
      semantic: new Uint8Array(analysisWidth * analysisHeight * 4),
    };

    compositeMaterial.uniforms.uScene.value = sceneTarget.texture;
    compositeMaterial.uniforms.uStroke.value = strokeTarget.texture;
    compositeMaterial.uniforms.uHeight.value = heightTarget.texture;
    compositeMaterial.uniforms.uSemantic.value = semanticTarget.texture;
    compositeMaterial.uniforms.uTexel.value.set(1 / renderWidth, 1 / renderHeight);
    strokeMaterial.uniforms.uResolution.value.set(renderWidth, renderHeight);
    strokeMaterial.uniforms.uStrokeScale.value = (renderWidth / outputWidth) * 1.12;
    pencilStrokeMaterial.uniforms.uResolution.value.set(renderWidth, renderHeight);
    pencilStrokeMaterial.uniforms.uStrokeScale.value = (renderWidth / outputWidth) * 0.34;
    heightMaterial.uniforms.uResolution.value.set(renderWidth, renderHeight);
    heightMaterial.uniforms.uStrokeScale.value = (renderWidth / outputWidth) * 1.12;
    fieldDirty = true;
    sceneTargetDirty = true;
    seeds = [];
    return true;
  }

  // ── fitUploadedQuad (verbatim from main.js lines 1458–1467) ──

  function fitUploadedQuad(target, image) {
    const targetAspect = target.width / Math.max(1, target.height);
    const imageAspect = image.width / Math.max(1, image.height);
    if (imageAspect >= targetAspect) {
      uploadedMaterial.uniforms.uScale.value.set(1, targetAspect / imageAspect);
    } else {
      uploadedMaterial.uniforms.uScale.value.set(imageAspect / targetAspect, 1);
    }
    uploadedMaterial.uniforms.uScale.value.multiplyScalar(IMAGE_MATTE_SCALE);
  }

  // ── renderUploadedTo (verbatim from main.js lines 1469–1480) ──

  function renderUploadedTo(target, pass, image, texture) {
    fitUploadedQuad(target, image);
    uploadedMaterial.uniforms.uImage.value = texture;
    uploadedMaterial.uniforms.uPass.value = pass;
    renderer.setRenderTarget(target);
    renderer.setViewport(0, 0, target.width, target.height);
    if (pass === 1) renderer.setClearColor(0x000000, 1);
    else if (pass === 2) renderer.setClearColor(0x8080ff, 1);
    else renderer.setClearColor(0xe5dac5, 1);
    renderer.clear(true, true, true);
    renderer.render(uploadedScene, uploadedCamera);
  }

  // ── renderSceneTo — uploaded image branch (verbatim from main.js lines 1482–1491) ──

  function renderSceneTo(target) {
    renderUploadedTo(target, 0, uploadedImage, uploadedTexture);
  }

  // ── captureGBuffer — uploaded image branch (verbatim from main.js lines 1506–1526) ──

  function captureGBuffer() {
    renderUploadedTo(colorTarget, 0, uploadedImage, uploadedTexture);
    renderUploadedTo(normalTarget, 2, uploadedImage, uploadedTexture);
    renderUploadedTo(semanticTarget, 1, uploadedImage, uploadedTexture);
    renderer.readRenderTargetPixels(colorTarget, 0, 0, analysisWidth, analysisHeight, buffers.color);
    renderer.readRenderTargetPixels(normalTarget, 0, 0, analysisWidth, analysisHeight, buffers.normalDepth);
    renderer.readRenderTargetPixels(semanticTarget, 0, 0, analysisWidth, analysisHeight, buffers.semantic);
  }

  // ── semanticAt (verbatim from main.js lines 1528–1532) ──

  function semanticAt(x, y) {
    const ix = Math.max(0, Math.min(analysisWidth - 1, Math.round(x)));
    const iy = Math.max(0, Math.min(analysisHeight - 1, Math.round(y)));
    return Math.round(buffers.semantic[(iy * analysisWidth + ix) * 4] || 0);
  }

  // ── depthAt (verbatim from main.js lines 1534–1538) ──

  function depthAt(x, y) {
    const ix = Math.max(0, Math.min(analysisWidth - 1, Math.round(x)));
    const iy = Math.max(0, Math.min(analysisHeight - 1, Math.round(y)));
    return buffers.normalDepth[(iy * analysisWidth + ix) * 4 + 3] / 255;
  }

  // ── buildDirectionField (verbatim from main.js lines 1562–1716) ──

  function buildDirectionField() {
    const count = analysisWidth * analysisHeight;
    const luminance = new Float32Array(count);
    const gx = new Float32Array(count);
    const gy = new Float32Array(count);
    const depthGx = new Float32Array(count);
    const depthGy = new Float32Array(count);
    const angle = new Float32Array(count);
    const confidence = new Float32Array(count);
    const imageMode = Boolean(uploadedImage);

    for (let y = 0; y < analysisHeight; y += 1) {
      for (let x = 0; x < analysisWidth; x += 1) {
        const index = y * analysisWidth + x;
        const offset = index * 4;
        luminance[index] = (
          buffers.color[offset] * 0.2126
          + buffers.color[offset + 1] * 0.7152
          + buffers.color[offset + 2] * 0.0722
        ) / 255;
      }
    }

    for (let y = 1; y < analysisHeight - 1; y += 1) {
      for (let x = 1; x < analysisWidth - 1; x += 1) {
        const index = y * analysisWidth + x;
        gx[index] = (
          -luminance[index - analysisWidth - 1]
          + luminance[index - analysisWidth + 1]
          - 2 * luminance[index - 1]
          + 2 * luminance[index + 1]
          - luminance[index + analysisWidth - 1]
          + luminance[index + analysisWidth + 1]
        );
        gy[index] = (
          -luminance[index - analysisWidth - 1]
          - 2 * luminance[index - analysisWidth]
          - luminance[index - analysisWidth + 1]
          + luminance[index + analysisWidth - 1]
          + 2 * luminance[index + analysisWidth]
          + luminance[index + analysisWidth + 1]
        );
        if (!imageMode) {
          const nOffset = index * 4;
          const nx = (buffers.normalDepth[nOffset] / 255) * 2 - 1;
          const ny = (buffers.normalDepth[nOffset + 1] / 255) * 2 - 1;
          const depth = buffers.normalDepth[nOffset + 3] / 255;
          const prevDepth = buffers.normalDepth[(index - 1) * 4 + 3] / 255;
          const nextDepth = buffers.normalDepth[(index + 1) * 4 + 3] / 255;
          const belowDepth = buffers.normalDepth[(index + analysisWidth) * 4 + 3] / 255;
          const aboveDepth = buffers.normalDepth[(index - analysisWidth) * 4 + 3] / 255;
          depthGx[index] = (nextDepth - prevDepth) * 4;
          depthGy[index] = (belowDepth - aboveDepth) * 4;
        }
      }
    }

    const satJxx = new Float64Array(count);
    const satJxy = new Float64Array(count);
    const satJyy = new Float64Array(count);
    for (let y = 0; y < analysisHeight; y += 1) {
      let rowSumXX = 0;
      let rowSumXY = 0;
      let rowSumYY = 0;
      for (let x = 0; x < analysisWidth; x += 1) {
        const index = y * analysisWidth + x;
        const totalGx = gx[index] + depthGx[index] * params.geometry;
        const totalGy = gy[index] + depthGy[index] * params.geometry;
        rowSumXX += totalGx * totalGx;
        rowSumXY += totalGx * totalGy;
        rowSumYY += totalGy * totalGy;
        const above = y > 0 ? (y - 1) * analysisWidth + x : -1;
        satJxx[index] = rowSumXX + (above >= 0 ? satJxx[above] : 0);
        satJxy[index] = rowSumXY + (above >= 0 ? satJxy[above] : 0);
        satJyy[index] = rowSumYY + (above >= 0 ? satJyy[above] : 0);
      }
    }

    function satSum(sat, x0, y0, x1, y1) {
      x0 = Math.max(0, x0);
      y0 = Math.max(0, y0);
      x1 = Math.min(analysisWidth - 1, x1);
      y1 = Math.min(analysisHeight - 1, y1);
      const d = sat[y1 * analysisWidth + x1];
      const a = x0 > 0 && y0 > 0 ? sat[(y0 - 1) * analysisWidth + (x0 - 1)] : 0;
      const b = y0 > 0 ? sat[(y0 - 1) * analysisWidth + x1] : 0;
      const c = x0 > 0 ? sat[y1 * analysisWidth + (x0 - 1)] : 0;
      return d - b - c + a;
    }

    const structureRadius = Math.max(2, Math.round(6 * (1 + params.structure * 2)));
    for (let y = 0; y < analysisHeight; y += 1) {
      for (let x = 0; x < analysisWidth; x += 1) {
        const index = y * analysisWidth + x;
        const x0 = x - structureRadius;
        const y0 = y - structureRadius;
        const x1 = x + structureRadius;
        const y1 = y + structureRadius;
        const area = (Math.min(x1, analysisWidth - 1) - Math.max(0, x0) + 1)
          * (Math.min(y1, analysisHeight - 1) - Math.max(0, y0) + 1);
        const jxx = satSum(satJxx, x0, y0, x1, y1) / area;
        const jxy = satSum(satJxy, x0, y0, x1, y1) / area;
        const jyy = satSum(satJyy, x0, y0, x1, y1) / area;

        const trace = jxx + jyy;
        const det = jxx * jyy - jxy * jxy;
        const disc = Math.sqrt(Math.max(0, trace * trace * 0.25 - det));
        const lambda1 = trace * 0.5 + disc;
        const lambda2 = trace * 0.5 - disc;
        const anisotropy = lambda1 > 0.0001 ? 1 - lambda2 / lambda1 : 0;
        const structureAngle = Math.atan2(2 * jxy, jxx - jyy) * 0.5;
        const dominantAngle = structureAngle + Math.PI * 0.5;

        if (!imageMode) {
          const nOff = index * 4;
          const nx = (buffers.normalDepth[nOff] / 255) * 2 - 1;
          const ny = (buffers.normalDepth[nOff + 1] / 255) * 2 - 1;
          const normalAngle = Math.atan2(ny, nx) + Math.PI * 0.5;
          const depth = buffers.normalDepth[nOff + 3] / 255;
          const depthWeight = (1 - depth) * 0.62;
          const normalWeight = Math.sqrt(nx * nx + ny * ny);
          const sem = semanticAt(x, y);
          const semanticAngle = sem === SEMANTIC.SKY
            ? 0
            : sem === SEMANTIC.GROUND ? Math.PI * 0.5 : dominantAngle;
          const semanticWeight = sem === SEMANTIC.SKY ? 0.42 : sem === SEMANTIC.GROUND ? 0.38 : 0;

          angle[index] = lineBlend3(
            dominantAngle, anisotropy * params.structure + 0.01,
            normalAngle, normalWeight * params.geometry * depthWeight,
            semanticAngle, semanticWeight * params.semantic,
          );
          confidence[index] = clamp01(
            anisotropy * 0.7 + normalWeight * 0.2 + semanticWeight * 0.1,
          );
        } else {
          angle[index] = dominantAngle;
          confidence[index] = clamp01(anisotropy);
        }
      }
    }

    analysis = { angle, confidence };
    fieldDirty = false;
  }

  // ── sampleAngle (verbatim from main.js lines 1807–1811) ──

  function sampleAngle(x, y) {
    const ix = Math.max(0, Math.min(analysisWidth - 1, Math.round(x)));
    const iy = Math.max(0, Math.min(analysisHeight - 1, Math.round(y)));
    return analysis.angle[iy * analysisWidth + ix];
  }

  // ── colorPixelOffset (verbatim from main.js lines 1863–1867) ──

  function colorPixelOffset(x, y) {
    const px = Math.max(0, Math.min(analysisWidth - 1, Math.round(x)));
    const py = Math.max(0, Math.min(analysisHeight - 1, Math.round(y)));
    return (py * analysisWidth + px) * 4;
  }

  // ── referenceColorDistance (verbatim from main.js lines 1813–1820) ──

  function referenceColorDistance(x0, y0, x1, y1) {
    const first = colorPixelOffset(x0, y0);
    const second = colorPixelOffset(x1, y1);
    const dr = (buffers.color[first] - buffers.color[second]) / 255;
    const dg = (buffers.color[first + 1] - buffers.color[second + 1]) / 255;
    const db = (buffers.color[first + 2] - buffers.color[second + 2]) / 255;
    return Math.sqrt(dr * dr * 0.24 + dg * dg * 0.56 + db * db * 0.2);
  }

  // ── traceInto (verbatim from main.js lines 1822–1861) ──

  function traceInto(seed, x, y, sign, distance, steps, target) {
    const startDepth = depthAt(x, y);
    let px = x;
    let py = y;
    let previousX = 0;
    let previousY = 0;
    let count = 0;
    const stepLength = distance / steps;
    for (let step = 0; step < steps; step += 1) {
      let direction = sampleAngle(px, py);
      let dx = Math.cos(direction) * sign;
      let dy = Math.sin(direction) * sign;
      if (step > 0 && dx * previousX + dy * previousY < 0) {
        dx *= -1;
        dy *= -1;
      }
      const mx = px + dx * stepLength * 0.5;
      const my = py + dy * stepLength * 0.5;
      direction = sampleAngle(mx, my);
      let ndx = Math.cos(direction) * sign;
      let ndy = Math.sin(direction) * sign;
      if (ndx * dx + ndy * dy < 0) {
        ndx *= -1;
        ndy *= -1;
      }
      const nx = px + ndx * stepLength;
      const ny = py + ndy * stepLength;
      if (nx < 1 || ny < 1 || nx >= analysisWidth - 1 || ny >= analysisHeight - 1) break;
      if (semanticAt(nx, ny) !== seed.semantic || Math.abs(depthAt(nx, ny) - startDepth) > 0.075) break;
      if (referenceColorDistance(x, y, nx, ny) > 0.31) break;
      px = nx;
      py = ny;
      previousX = ndx;
      previousY = ndy;
      target[count * 2] = px;
      target[count * 2 + 1] = py;
      count += 1;
    }
    return count;
  }

  // ── paletteColor (verbatim from main.js lines 1869–1902) ──

  function paletteColor(seed, x, y) {
    const offset = colorPixelOffset(x, y);
    if (uploadedImage) {
      const radius = [3.2, 1.45, 0.45][seed.layer];
      const leftOffset = colorPixelOffset(x - radius, y);
      const rightOffset = colorPixelOffset(x + radius, y);
      const bottomOffset = colorPixelOffset(x, y - radius);
      const topOffset = colorPixelOffset(x, y + radius);
      const red = (
        buffers.color[offset] + buffers.color[leftOffset] + buffers.color[rightOffset]
        + buffers.color[bottomOffset] + buffers.color[topOffset]
      ) / 1275;
      const green = (
        buffers.color[offset + 1] + buffers.color[leftOffset + 1] + buffers.color[rightOffset + 1]
        + buffers.color[bottomOffset + 1] + buffers.color[topOffset + 1]
      ) / 1275;
      const blue = (
        buffers.color[offset + 2] + buffers.color[leftOffset + 2] + buffers.color[rightOffset + 2]
        + buffers.color[bottomOffset + 2] + buffers.color[topOffset + 2]
      ) / 1275;
      const color = new THREE.Color(red, green, blue);
      color.offsetHSL((seed.random - 0.5) * 0.018, 0.035 + seed.layer * 0.018, (seed.random - 0.5) * 0.055);
      return color;
    }

    const palette = palettes[seed.semantic] || palettes[SEMANTIC.SKY];
    const luma = (
      buffers.color[offset] * 0.2126
      + buffers.color[offset + 1] * 0.7152
      + buffers.color[offset + 2] * 0.0722
    ) / 255;
    const choice = Math.max(0, Math.min(palette.length - 1, Math.floor(luma * palette.length + (seed.random - 0.5) * 1.5)));
    return new THREE.Color(palette[choice]);
  }

  // ── createStrokeBaseGeometry (verbatim from main.js lines 1904–1920) ──

  function createStrokeBaseGeometry() {
    const segments = 8;
    const vertices = [];
    const indices = [];
    for (let i = 0; i <= segments; i += 1) {
      const t = i / segments;
      vertices.push(t, -1, 0, t, 1, 0);
    }
    for (let i = 0; i < segments; i += 1) {
      const a = i * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
    const geometry = new THREE.InstancedBufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    return geometry;
  }

  // ── ensureStrokeGeometry (verbatim from main.js lines 1922–1949) ──

  function ensureStrokeGeometry(count) {
    if (strokeGeometry?.userData.capacity === count) return;
    strokeGeometry?.dispose();
    if (strokeMesh) overlayScene.remove(strokeMesh);
    strokeGeometry = createStrokeBaseGeometry();
    strokeGeometry.userData.capacity = count;
    const dynamic = (length, size) => {
      const attribute = new THREE.InstancedBufferAttribute(new Float32Array(length), size);
      attribute.setUsage(THREE.DynamicDrawUsage);
      return attribute;
    };
    strokeGeometry.setAttribute('aP0', dynamic(count * 2, 2));
    strokeGeometry.setAttribute('aP1', dynamic(count * 2, 2));
    strokeGeometry.setAttribute('aP2', dynamic(count * 2, 2));
    strokeGeometry.setAttribute('aP3', dynamic(count * 2, 2));
    strokeGeometry.setAttribute('aColor', dynamic(count * 3, 3));
    strokeGeometry.setAttribute('aWidth', dynamic(count, 1));
    strokeGeometry.setAttribute('aSeed', dynamic(count, 1));
    strokeGeometry.setAttribute('aPrevP01', dynamic(count * 4, 4));
    strokeGeometry.setAttribute('aPrevP23', dynamic(count * 4, 4));
    strokeGeometry.setAttribute('aBirth', dynamic(count, 1));
    strokeGeometry.setAttribute('aDuration', dynamic(count, 1));
    strokeGeometry.setAttribute('aBrushLayer', dynamic(count, 1));
    strokeGeometry.instanceCount = count;
    strokeMesh = new THREE.Mesh(strokeGeometry, strokeMaterial);
    strokeMesh.frustumCulled = false;
    overlayScene.add(strokeMesh);
  }

  // ── poissonLayer (verbatim from main.js lines 1718–1776) ──
  // SEAM: removed camera.unproject (no 3D projection needed for uploaded image)

  function poissonLayer(layer, target, minDistance, accepted) {
    const cellSize = minDistance / Math.SQRT2;
    const cols = Math.ceil(analysisWidth / cellSize);
    const rows = Math.ceil(analysisHeight / cellSize);
    const grid = new Int32Array(cols * rows).fill(-1);
    const local = [];
    const maxAttempts = target * 34;
    const generationOffset = seedGeneration * 104729 + layer * 9176;

    for (let attempt = 0; attempt < maxAttempts && local.length < target; attempt += 1) {
      const index = attempt + generationOffset + 1;
      const x = fract(0.5 + index * 0.754877666) * analysisWidth;
      const y = fract(0.5 + index * 0.569840296) * analysisHeight;
      const semantic = semanticAt(x, y);
      if (!semantic || depthAt(x, y) >= 0.999) continue;
      const fieldIndex = Math.min(analysis.angle.length - 1, Math.floor(y) * analysisWidth + Math.floor(x));
      const confidence = analysis.confidence[fieldIndex];
      const semanticDensity = semantic === SEMANTIC.VEGETATION ? 1 : semantic === SEMANTIC.BUILDING ? 0.72 : 0.88;
      if (hash(index * 2.13) > semanticDensity * (0.64 + confidence * 0.36)) continue;

      const gx = Math.floor(x / cellSize);
      const gy = Math.floor(y / cellSize);
      let valid = true;
      for (let oy = -2; oy <= 2 && valid; oy += 1) {
        for (let ox = -2; ox <= 2; ox += 1) {
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

      const depth = depthAt(x, y);
      const seed = {
        x,
        y,
        world: null,
        semantic,
        layer,
        depth,
        random: hash(index * 7.31 + layer * 13.7),
      };
      grid[gy * cols + gx] = local.length;
      local.push(seed);
      accepted.push(seed);
    }
  }

  // ── generatePersistentSeeds (verbatim from main.js lines 1778–1805) ──

  function generatePersistentSeeds() {
    const nextSeeds = [];
    const desiredCount = Math.max(3000, Math.min(24000, Math.round(params.strokeCountK * 1000)));
    const coarseCount = Math.round(desiredCount * 0.06);
    const mediumCount = Math.round(desiredCount * 0.225);
    const fineCount = desiredCount - coarseCount - mediumCount;
    const analysisScale = Math.sqrt((analysisWidth * analysisHeight) / (312 * 460));
    const densityScale = Math.sqrt(14000 / desiredCount);
    const distanceScale = analysisScale * densityScale;
    const layerPlan = [
      [0, coarseCount, 5.8 * distanceScale],
      [1, mediumCount, 2.75 * distanceScale],
      [2, fineCount, 1.2 * distanceScale],
    ];
    layerPlan.forEach(([layer, target, distance]) => {
      poissonLayer(layer, target, distance, nextSeeds);
    });
    seeds = nextSeeds;
    seeds.forEach((seed) => { seed.color = paletteColor(seed, seed.x, seed.y); });
    seedGeneration += 1;
    growthStartTimeline = growthTimeline;
    strokeTargetsDirty = true;
  }

  // ── rebuildStrokeGeometry (verbatim from main.js lines 2040–2113) ──

  function rebuildStrokeGeometry() {
    const count = seeds.length;
    ensureStrokeGeometry(count);
    const p0 = strokeGeometry.getAttribute('aP0').array;
    const p1 = strokeGeometry.getAttribute('aP1').array;
    const p2 = strokeGeometry.getAttribute('aP2').array;
    const p3 = strokeGeometry.getAttribute('aP3').array;
    const colors = strokeGeometry.getAttribute('aColor').array;
    const widths = strokeGeometry.getAttribute('aWidth').array;
    const randoms = strokeGeometry.getAttribute('aSeed').array;
    const births = strokeGeometry.getAttribute('aBirth').array;
    const durations = strokeGeometry.getAttribute('aDuration').array;
    const brushLayers = strokeGeometry.getAttribute('aBrushLayer').array;
    let visible = 0;

    for (let index = 0; index < count; index += 1) {
      const seed = seeds[index];
      const x = seed.x;
      const y = seed.y;
      const currentlyVisible = true;
      const distance = [18.5, 10.2, 4.8][seed.layer] * params.length;
      const backwardCount = traceInto(seed, x, y, -1, distance, STROKE_TRACE_STEPS, backwardTraceScratch);
      const forwardCount = traceInto(seed, x, y, 1, distance, STROKE_TRACE_STEPS, forwardTraceScratch);
      const backwardMidOffset = Math.max(0, Math.floor(backwardCount * 0.45)) * 2;
      const backwardEndOffset = Math.max(0, backwardCount - 1) * 2;
      const forwardMidOffset = Math.max(0, Math.floor(forwardCount * 0.45)) * 2;
      const forwardEndOffset = Math.max(0, forwardCount - 1) * 2;

      const pointOffset = index * 2;
      p0[pointOffset] = (backwardCount ? backwardTraceScratch[backwardEndOffset] : x) / analysisWidth;
      p0[pointOffset + 1] = (backwardCount ? backwardTraceScratch[backwardEndOffset + 1] : y) / analysisHeight;
      p1[pointOffset] = (backwardCount ? backwardTraceScratch[backwardMidOffset] : x) / analysisWidth;
      p1[pointOffset + 1] = (backwardCount ? backwardTraceScratch[backwardMidOffset + 1] : y) / analysisHeight;
      p2[pointOffset] = (forwardCount ? forwardTraceScratch[forwardMidOffset] : x) / analysisWidth;
      p2[pointOffset + 1] = (forwardCount ? forwardTraceScratch[forwardMidOffset + 1] : y) / analysisHeight;
      p3[pointOffset] = (forwardCount ? forwardTraceScratch[forwardEndOffset] : x) / analysisWidth;
      p3[pointOffset + 1] = (forwardCount ? forwardTraceScratch[forwardEndOffset + 1] : y) / analysisHeight;
      const color = seed.color || paletteColor(seed, x, y);
      colors[index * 3] = color.r;
      colors[index * 3 + 1] = color.g;
      colors[index * 3 + 2] = color.b;
      widths[index] = currentlyVisible
        ? [11.5, 6.0, 3.15][seed.layer] * (0.82 + seed.random * 0.36)
        : 0;
      randoms[index] = seed.random + index * 0.00013;
      brushLayers[index] = seed.layer;
      if (seed.layer === 2) {
        const fineBirthRandom = hash(seed.x * 0.137 + seed.y * 0.193 + seed.random * 17.1);
        births[index] = 0.72 + fineBirthRandom * 1.85;
        durations[index] = 0.22 + seed.random * 0.18;
      } else {
        births[index] = [0, 0.72][seed.layer] + seed.random * [0.7, 1.2][seed.layer];
        durations[index] = [1.2, 0.9][seed.layer] * (0.82 + seed.random * 0.36);
      }
      if (currentlyVisible) visible += 1;
    }

    ['aP0', 'aP1', 'aP2', 'aP3', 'aColor', 'aWidth', 'aSeed', 'aBirth', 'aDuration', 'aBrushLayer']
      .forEach((name) => { strokeGeometry.getAttribute(name).needsUpdate = true; });
    strokeTargetsDirty = true;
    strokeGeometryDirty = false;
  }

  // ── currentGrowthTime (verbatim from main.js lines 2200–2204) ──

  function currentGrowthTime() {
    return params.growthPlayback
      ? Math.max(0, Math.min(GROWTH_DURATION, (growthTimeline - growthStartTimeline) / 1000))
      : GROWTH_DURATION;
  }

  // ── renderStrokeLayers (verbatim from main.js lines 2230–2285) ──

  function renderStrokeLayers() {
    if (!strokeMesh) return false;
    const growthTime = currentGrowthTime();
    const growthActive = params.growthPlayback && growthTime < GROWTH_DURATION;
    if (growthWasActive && !growthActive) strokeTargetsDirty = true;
    growthWasActive = growthActive;
    if (!strokeTargetsDirty && (!growthActive || params.paused)) return false;
    const growthRatio = params.growthPlayback ? Math.min(1, growthTime / GROWTH_DURATION) : 1;
    strokeMaterial.uniforms.uCoverage.value = params.coverage;
    pencilStrokeMaterial.uniforms.uCoverage.value = params.coverage;
    heightMaterial.uniforms.uCoverage.value = params.coverage;
    strokeMaterial.uniforms.uBrushSize.value = params.strokeSize;
    pencilStrokeMaterial.uniforms.uBrushSize.value = params.strokeSize;
    heightMaterial.uniforms.uBrushSize.value = params.strokeSize;
    strokeMaterial.uniforms.uWetness.value = paintWetness();
    heightMaterial.uniforms.uWetness.value = paintWetness();
    strokeMaterial.uniforms.uViscosity.value = params.viscosity;
    heightMaterial.uniforms.uViscosity.value = params.viscosity;
    strokeMaterial.uniforms.uBristleDetail.value = params.bristleDetail;
    heightMaterial.uniforms.uBristleDetail.value = params.bristleDetail;
    strokeMaterial.uniforms.uGrowthTime.value = growthTime;
    pencilStrokeMaterial.uniforms.uGrowthTime.value = growthTime;
    heightMaterial.uniforms.uGrowthTime.value = growthTime;
    strokeMaterial.uniforms.uGrowthEnabled.value = params.growthPlayback ? 1 : 0;
    pencilStrokeMaterial.uniforms.uGrowthEnabled.value = params.growthPlayback ? 1 : 0;
    heightMaterial.uniforms.uGrowthEnabled.value = params.growthPlayback ? 1 : 0;

    const sketchActive = params.viewMode === 1;
    strokeMesh.material = sketchActive ? pencilStrokeMaterial : strokeMaterial;
    renderer.setRenderTarget(strokeTarget);
    renderer.setViewport(0, 0, strokeTarget.width, strokeTarget.height);
    renderer.setClearColor(0x000000, 0);
    renderer.clear(true, true, true);
    renderer.render(overlayScene, overlayCamera);

    if (!sketchActive) {
      strokeMesh.material = heightMaterial;
      renderer.setRenderTarget(heightTarget);
      renderer.setViewport(0, 0, heightTarget.width, heightTarget.height);
      renderer.setClearColor(0x000000, 0);
      renderer.clear(true, true, true);
      renderer.render(overlayScene, overlayCamera);
    }
    strokeMesh.material = sketchActive ? pencilStrokeMaterial : strokeMaterial;
    strokeTargetsDirty = false;
    return true;
  }

  // ── renderComposite (verbatim from main.js lines 2287–2301) ──
  // SEAM: setRenderTarget(null) → setRenderTarget(outputTarget)

  function renderComposite(time) {
    compositeMaterial.uniforms.uMode.value = params.showBase ? 3 : params.viewMode;
    compositeMaterial.uniforms.uImpasto.value = params.impasto;
    compositeMaterial.uniforms.uWetness.value = paintWetness();
    compositeMaterial.uniforms.uLightAngle.value = params.movingLight ? time * 0.00022 : -0.8;
    compositeMaterial.uniforms.uTime.value = time * 0.001;
    renderer.setRenderTarget(outputTarget);
    renderer.setViewport(0, 0, renderWidth, renderHeight);
    renderer.setClearColor(0x0b1322, 1);
    renderer.clear(true, true, true);
    renderer.render(screenScene, screenCamera);
    compositeDirty = false;
  }

  // ── updateAnalysis (adapted from main.js lines 2115–2134) ──

  function updateAnalysis(reseed) {
    captureGBuffer();
    buildDirectionField();
    if (reseed || seeds.length === 0) {
      generatePersistentSeeds();
    }
    rebuildStrokeGeometry();
    fieldDirty = false;
  }

  // ══════════════════════════════════════════════════════════════════
  // MUSEUM SEAM — processImage / update / getOutputTexture / dispose
  // ══════════════════════════════════════════════════════════════════

  function processImage(image) {
    uploadedImage = image;
    if (uploadedTexture) uploadedTexture.dispose();
    uploadedTexture = new THREE.Texture(image);
    uploadedTexture.needsUpdate = true;
    uploadedTexture.colorSpace = THREE.SRGBColorSpace;

    resize(image.width, image.height);
    renderSceneTo(sceneTarget);
    // SEAM (lifecycle): the donor drives growth from a single free-running
    // monotonic clock (`growthTimeline += rawDelta` in its animate loop) and
    // captures `growthStartTimeline = growthTimeline` inside generatePersistentSeeds.
    // Feed that same clock here so the reseed about to happen anchors growth to
    // performance.now(); update() then advances it on the identical time base.
    growthTimeline = performance.now();
    updateAnalysis(true);
    renderStrokeLayers();
    renderComposite(growthTimeline);

    return seeds.length;
  }

  // SEAM (lifecycle): `nowMs` is the shared monotonic clock (performance.now()),
  // the same one processImage anchors growthStartTimeline to. The donor's animate
  // loop accumulated growthTimeline from frame deltas; the adapter drives it from
  // the Museum frame loop instead, but the single-clock invariant is preserved:
  // growthTimeline and growthStartTimeline always live on the same time base, so
  // currentGrowthTime = (nowMs - startTimeline)/1000 is correct after every reseed.
  function update(nowMs) {
    growthTimeline = nowMs;
    const growthTime = currentGrowthTime();
    if (growthTime >= GROWTH_DURATION && !strokeTargetsDirty) {
      return false;
    }
    strokeTargetsDirty = true;
    compositeDirty = true;
    renderStrokeLayers();
    renderComposite(growthTimeline);
    return growthTime < GROWTH_DURATION;
  }

  function replay() {
    // Re-anchor the growth origin to now on the shared monotonic clock, so the
    // reveal restarts from 0 exactly as a fresh reseed would.
    growthTimeline = performance.now();
    growthStartTimeline = growthTimeline;
    growthWasActive = false;
    params.growthPlayback = true;
    strokeTargetsDirty = true;
    compositeDirty = true;
  }

  function getOutputTexture() {
    return outputTarget?.texture || null;
  }

  function dispose() {
    disposeTargets();
    if (strokeGeometry) strokeGeometry.dispose();
    if (strokeMesh) overlayScene.remove(strokeMesh);
    strokeMesh = null;
    strokeGeometry = null;
    [strokeMaterial, pencilStrokeMaterial, heightMaterial, compositeMaterial, uploadedMaterial].forEach(m => m.dispose());
    if (uploadedTexture) uploadedTexture.dispose();
    uploadedImage = null;
    uploadedTexture = null;
    analysis = null;
    seeds = [];
    buffers = null;
  }

  return {
    processImage,
    update,
    replay,
    getOutputTexture,
    dispose,
  };
}
