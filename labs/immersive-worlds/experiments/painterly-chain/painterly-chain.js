/**
 * Painterly Chain — Full Causal Pipeline (Stone 4)
 *
 * Proves the complete chain: ARTWORK → DIRECTION FIELD → POISSON SEEDS →
 * VISIBLE ORIENTED STROKES (Bézier ribbons) → PAINTERLY MATERIAL (impasto).
 *
 * Cross-capability coupling: DIRECTION FIELD → BOID FLOCK FLOW — living
 * marks drift across the painted surface, oriented by the field.
 *
 * All six extracted capabilities wired in one experiment:
 *  1. Direction Field (WPF-1)
 *  2. Poisson Seeds (WPF-2)
 *  3. Bézier Ribbon Strokes (WPF-3)
 *  4. Impasto Material (WPF-4)
 *  5. GPGPU Boids (VGC-1/2)
 *  6. Gradient-Map Recoloring (VGC-4)
 *
 * Procedurally generated test artwork — no donor assets, legally clean.
 */

import * as THREE from '../../vendor/three/three.module.min.js';
import { GPUComputationRenderer } from '../../vendor/three/addons/misc/GPUComputationRenderer.js';
import { buildDirectionField } from '../../engine/capabilities/painterly/direction-field.js';
import { generatePoissonSeeds } from '../../engine/capabilities/painterly/poisson-seeds.js';
import {
  STROKE_VERTEX_SHADER, STROKE_FRAGMENT_SHADER, HEIGHT_FRAGMENT_SHADER,
  buildStrokesFromField,
} from '../../engine/capabilities/painterly/bezier-strokes.js';
import {
  IMPASTO_COMPOSITE_VERTEX, IMPASTO_COMPOSITE_FRAGMENT,
} from '../../engine/capabilities/painterly/impasto-material.glsl.js';
import { BoidsSimulation } from '../../engine/capabilities/gpgpu-boids/boids-simulation.js';
import {
  GRADIENT_MAP_UNIFORM_DECLARATIONS, GRADIENT_MAP_FUNCTION,
} from '../../engine/capabilities/painterly/gradient-map.glsl.js';

const ART_SIZE = 256;
const RT_SIZE = 1024;
const SEED_COUNT = 3000;
const BOID_GRID = 14;
const BOID_ACTIVE = 160;
const BOID_BOUNDS = 400;

const canvas = document.getElementById('canvas');
const status = document.getElementById('status');

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.autoClear = false;

let compositeScene, compositeCamera, compositeMat;
let boidScene, boidCamera, boidMarkMesh;
let boids = null;
let pointerNorm = new THREE.Vector2(999, 999);
let animating = true;
let elapsed = 0;

function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h);
  if (boidCamera) {
    const a = w / h;
    boidCamera.left = -a;
    boidCamera.right = a;
    boidCamera.top = 1;
    boidCamera.bottom = -1;
    boidCamera.updateProjectionMatrix();
  }
}
window.addEventListener('resize', resize);

// ── 1. Procedural Test Artwork ──────────────────────────────

function generateProceduralArtwork(w, h) {
  const pixels = new Uint8Array(w * h * 4);
  const centers = [
    { cx: 0.42, cy: 0.48, twist: 11, sigma: 0.38, r: 0.82, g: 0.58, b: 0.28 },
    { cx: 0.72, cy: 0.32, twist: -8, sigma: 0.25, r: 0.65, g: 0.35, b: 0.15 },
    { cx: 0.28, cy: 0.72, twist: 6,  sigma: 0.30, r: 0.90, g: 0.75, b: 0.50 },
    { cx: 0.55, cy: 0.20, twist: -5, sigma: 0.20, r: 0.50, g: 0.28, b: 0.12 },
  ];

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const u = x / w, v = y / h;
      let rr = 0, gg = 0, bb = 0, totalW = 0;

      for (const c of centers) {
        const dx = u - c.cx, dy = v - c.cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) + dist * c.twist;
        const weight = Math.exp(-dist * dist / (2 * c.sigma * c.sigma));
        const wave = 0.5 + 0.35 * Math.sin(angle * 3.5);
        rr += wave * c.r * weight;
        gg += wave * c.g * weight;
        bb += wave * c.b * weight;
        totalW += weight;
      }

      if (totalW > 0.001) { rr /= totalW; gg /= totalW; bb /= totalW; }

      const band = Math.sin(u * 8 + v * 5) * 0.06;
      rr = Math.min(1, Math.max(0, rr + band + 0.08));
      gg = Math.min(1, Math.max(0, gg + band * 0.7 + 0.04));
      bb = Math.min(1, Math.max(0, bb + band * 0.3 + 0.02));

      const off = (y * w + x) * 4;
      pixels[off]     = Math.round(rr * 255);
      pixels[off + 1] = Math.round(gg * 255);
      pixels[off + 2] = Math.round(bb * 255);
      pixels[off + 3] = 255;
    }
  }
  return pixels;
}

// ── Build instanced stroke geometry ─────────────────────────

function buildStrokeGeometry(strokeData) {
  const segments = 8;
  const positions = [];
  const indices = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    positions.push(t, -1, 0, t, 1, 0);
  }
  for (let i = 0; i < segments; i++) {
    const a = i * 2, b = i * 2 + 1, c = (i + 1) * 2, d = (i + 1) * 2 + 1;
    indices.push(a, c, b, b, c, d);
  }

  const geo = new THREE.InstancedBufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.instanceCount = strokeData.count;

  geo.setAttribute('aP0', new THREE.InstancedBufferAttribute(strokeData.p0, 2));
  geo.setAttribute('aP1', new THREE.InstancedBufferAttribute(strokeData.p1, 2));
  geo.setAttribute('aP2', new THREE.InstancedBufferAttribute(strokeData.p2, 2));
  geo.setAttribute('aP3', new THREE.InstancedBufferAttribute(strokeData.p3, 2));
  geo.setAttribute('aColor', new THREE.InstancedBufferAttribute(strokeData.colors, 3));
  geo.setAttribute('aWidth', new THREE.InstancedBufferAttribute(strokeData.widths, 1));
  geo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(strokeData.randoms, 1));
  geo.setAttribute('aBrushLayer', new THREE.InstancedBufferAttribute(strokeData.brushLayers, 1));

  return geo;
}

function makeStrokeUniforms() {
  return {
    uResolution: { value: new THREE.Vector2(RT_SIZE, RT_SIZE) },
    uStrokeScale: { value: 1.0 },
    uBrushSize: { value: 1.0 },
    uBrushLayerVisibility: { value: new THREE.Vector3(1, 1, 1) },
    uCoverage: { value: 0.92 },
    uViscosity: { value: 0.55 },
    uBristleDetail: { value: 0.72 },
  };
}

// ── Boid mark shaders (cross-capability: field → flock) ─────

const boidMarkVS = /* glsl */`
uniform sampler2D texturePosition;
uniform sampler2D textureVelocity;
uniform sampler2D dirFieldTex;
uniform sampler2D artworkTex;
uniform float bounds;
uniform float markScale;

attribute vec2 reference;

varying vec3 vColor;
varying float vAlpha;
varying vec2 vLocalUV;

void main() {
  vec4 posData = texture2D(texturePosition, reference);
  vec4 velData = texture2D(textureVelocity, reference);
  vec3 boidPos = posData.xyz;
  float speed = length(velData.xyz);

  vec2 artUV = clamp(boidPos.xy / (bounds * 2.0) + 0.5, 0.0, 1.0);

  vec4 fieldData = texture2D(dirFieldTex, artUV);
  float angle = fieldData.r * 6.28318 - 3.14159;
  float confidence = fieldData.g;

  vec3 artColor = texture2D(artworkTex, artUV).rgb;

  float c = cos(angle), s = sin(angle);
  vec2 corner = position.xy;
  vec2 rotated = vec2(corner.x * c - corner.y * s,
                      corner.x * s + corner.y * c);
  rotated.x *= 2.2;

  vec2 screenPos = boidPos.xy / bounds;
  screenPos += rotated * markScale / bounds;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(screenPos, 0.0, 1.0);

  // Wet-paint temperature shift: subtly cooler than dry impasto strokes
  vec3 wetTint = vec3(artColor.r * 0.92, artColor.g * 1.0, artColor.b * 1.3 + 0.08);
  vColor = wetTint * 1.15;
  vAlpha = (0.20 + confidence * 0.32) * mix(1.0, 0.35, clamp(speed / 5.0, 0.0, 1.0));
  vLocalUV = corner;
}
`;

const boidMarkFS = /* glsl */`
${GRADIENT_MAP_UNIFORM_DECLARATIONS}
${GRADIENT_MAP_FUNCTION}

varying vec3 vColor;
varying float vAlpha;
varying vec2 vLocalUV;

void main() {
  float dist = length(vLocalUV);
  if (dist > 1.0) discard;

  float coreFalloff = smoothstep(1.0, 0.15, dist);
  float grain = fract(sin(dot(vLocalUV * 7.0, vec2(12.9898, 78.233))) * 43758.5453);

  // Dark contour ring — each mark reads as an individual brushmark
  float ring = smoothstep(0.92, 0.72, dist) * smoothstep(0.52, 0.72, dist);

  // Wet-paint specular highlight at center
  float wetHighlight = smoothstep(0.40, 0.0, dist) * 0.30;

  float alpha = vAlpha * coreFalloff * (0.92 + grain * 0.08);

  float luma = dot(vColor, vec3(0.299, 0.587, 0.114));
  vec3 recolored = gradientMapRecolor(luma);
  vec3 color = mix(vColor, recolored, gradientMapStrength * 0.4);

  // Wet center brightness + dark contour edge
  color = color * (1.0 + wetHighlight);
  color = mix(color, vec3(0.08, 0.05, 0.02), ring * 0.65);

  gl_FragColor = vec4(color, alpha);
}
`;

// ── Initialization ──────────────────────────────────────────

async function init() {
  resize();

  // Step 1: Procedural artwork
  status.textContent = 'Generating procedural artwork…';
  const artPixels = generateProceduralArtwork(ART_SIZE, ART_SIZE);

  const artworkTex = new THREE.DataTexture(
    artPixels, ART_SIZE, ART_SIZE, THREE.RGBAFormat
  );
  artworkTex.minFilter = THREE.LinearFilter;
  artworkTex.magFilter = THREE.LinearFilter;
  artworkTex.needsUpdate = true;

  // Step 2: Direction field analysis
  status.textContent = 'Analyzing direction field…';
  const field = buildDirectionField(artPixels, ART_SIZE, ART_SIZE);

  const fieldTexData = new Float32Array(ART_SIZE * ART_SIZE * 4);
  for (let i = 0; i < ART_SIZE * ART_SIZE; i++) {
    fieldTexData[i * 4]     = (field.angle[i] + Math.PI) / (2 * Math.PI);
    fieldTexData[i * 4 + 1] = field.confidence[i];
    fieldTexData[i * 4 + 2] = field.luminance[i];
    fieldTexData[i * 4 + 3] = 1;
  }
  const fieldTex = new THREE.DataTexture(
    fieldTexData, ART_SIZE, ART_SIZE, THREE.RGBAFormat, THREE.FloatType
  );
  fieldTex.minFilter = THREE.LinearFilter;
  fieldTex.magFilter = THREE.LinearFilter;
  fieldTex.needsUpdate = true;

  // Step 3: Poisson seed distribution
  status.textContent = 'Generating Poisson seed distribution…';
  const seeds = generatePoissonSeeds(ART_SIZE, ART_SIZE, field.confidence, {
    totalCount: SEED_COUNT, generation: 0,
  });

  // Step 4: Bézier stroke geometry from seeds + field
  status.textContent = `Building ${seeds.length} Bézier strokes…`;
  const strokeData = buildStrokesFromField(
    seeds, field, ART_SIZE, ART_SIZE, artPixels,
    { lengthScale: 1.1, layerWidths: [13, 6.5, 3.2], layerLengths: [26, 15, 7.5] }
  );

  const strokeGeo = buildStrokeGeometry(strokeData);

  // Step 5: Three-pass impasto pipeline — render to targets

  status.textContent = 'Rendering stroke pigment buffer…';

  const strokeRT = new THREE.WebGLRenderTarget(RT_SIZE, RT_SIZE, {
    minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter,
    type: THREE.HalfFloatType,
  });
  const heightRT = new THREE.WebGLRenderTarget(RT_SIZE, RT_SIZE, {
    minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter,
    type: THREE.HalfFloatType,
  });

  const strokeScene = new THREE.Scene();
  const rtCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 10);
  rtCamera.position.z = 5;

  // Pass 1: Stroke pigment
  const pigmentMat = new THREE.ShaderMaterial({
    vertexShader: STROKE_VERTEX_SHADER,
    fragmentShader: STROKE_FRAGMENT_SHADER,
    uniforms: makeStrokeUniforms(),
    transparent: true, depthWrite: false, depthTest: false,
    side: THREE.DoubleSide,
  });

  const pigmentMesh = new THREE.Mesh(strokeGeo, pigmentMat);
  strokeScene.add(pigmentMesh);

  renderer.setRenderTarget(strokeRT);
  renderer.setClearColor(0x000000, 0);
  renderer.clear();
  renderer.render(strokeScene, rtCamera);

  // Pass 2: Height buffer
  status.textContent = 'Rendering paint height buffer…';
  strokeScene.remove(pigmentMesh);

  const heightMat = new THREE.ShaderMaterial({
    vertexShader: STROKE_VERTEX_SHADER,
    fragmentShader: HEIGHT_FRAGMENT_SHADER,
    uniforms: makeStrokeUniforms(),
    transparent: true, depthWrite: false, depthTest: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });

  const heightMesh = new THREE.Mesh(strokeGeo, heightMat);
  strokeScene.add(heightMesh);

  renderer.setRenderTarget(heightRT);
  renderer.clear();
  renderer.render(strokeScene, rtCamera);

  renderer.setRenderTarget(null);
  strokeScene.remove(heightMesh);
  pigmentMat.dispose();
  heightMat.dispose();

  // Pass 3: Impasto composite (rendered each frame for light animation)
  status.textContent = 'Setting up impasto composite…';

  compositeScene = new THREE.Scene();
  compositeCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 10);
  compositeCamera.position.z = 5;

  compositeMat = new THREE.ShaderMaterial({
    vertexShader: IMPASTO_COMPOSITE_VERTEX,
    fragmentShader: IMPASTO_COMPOSITE_FRAGMENT,
    uniforms: {
      uBase:       { value: artworkTex },
      uStroke:     { value: strokeRT.texture },
      uHeight:     { value: heightRT.texture },
      uTexel:      { value: new THREE.Vector2(1 / RT_SIZE, 1 / RT_SIZE) },
      uImpasto:    { value: 0.06 },
      uWetness:    { value: 0.38 },
      uLightAngle: { value: 0.8 },
      uTime:       { value: 0 },
    },
    depthWrite: false, depthTest: false,
  });

  const compositeQuad = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    compositeMat,
  );
  compositeScene.add(compositeQuad);

  // Step 6: GPGPU Boids (cross-capability coupling layer)
  status.textContent = 'Initializing boid flock simulation…';

  boids = new BoidsSimulation(renderer, GPUComputationRenderer, {
    gridWidth: BOID_GRID,
    activeCount: BOID_ACTIVE,
    bounds: BOID_BOUNDS,
    separationDistance: 28,
    alignmentDistance: 22,
    cohesionDistance: 14,
  });

  // Step 7: Boid marks — direction-field-coupled instanced quads
  boidScene = new THREE.Scene();
  boidCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 10);
  boidCamera.position.z = 5;
  resize();

  const markGeo = new THREE.InstancedBufferGeometry();
  const markPositions = [-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0];
  const markIndices = [0, 1, 2, 0, 2, 3];
  markGeo.setAttribute('position', new THREE.Float32BufferAttribute(markPositions, 3));
  markGeo.setIndex(markIndices);
  markGeo.instanceCount = BOID_ACTIVE;

  const markRefs = new Float32Array(BOID_ACTIVE * 2);
  for (let i = 0; i < BOID_ACTIVE; i++) {
    markRefs[i * 2]     = (i % BOID_GRID + 0.5) / BOID_GRID;
    markRefs[i * 2 + 1] = (Math.floor(i / BOID_GRID) + 0.5) / BOID_GRID;
  }
  markGeo.setAttribute('reference', new THREE.InstancedBufferAttribute(markRefs, 2));

  const markMat = new THREE.ShaderMaterial({
    vertexShader: boidMarkVS,
    fragmentShader: boidMarkFS,
    uniforms: {
      texturePosition: { value: null },
      textureVelocity: { value: null },
      dirFieldTex:     { value: fieldTex },
      artworkTex:      { value: artworkTex },
      bounds:          { value: BOID_BOUNDS },
      markScale:       { value: 36 },
      gradientMapShadowColor:      { value: new THREE.Color(0x3d200a) },
      gradientMapMidtoneColor:     { value: new THREE.Color(0xc98b3e) },
      gradientMapHighlightColor:   { value: new THREE.Color(0xfff0c8) },
      gradientMapShadowPosition:   { value: 0.18 },
      gradientMapMidpoint:         { value: 0.48 },
      gradientMapHighlightPosition:{ value: 0.82 },
      gradientMapReverse:          { value: 0.0 },
      gradientMapStrength:         { value: 0.85 },
    },
    transparent: true, depthWrite: false, depthTest: false,
  });

  boidMarkMesh = new THREE.Mesh(markGeo, markMat);
  boidScene.add(boidMarkMesh);

  // Proof state for QA
  status.textContent =
    `Chain active — ${seeds.length} strokes, ${BOID_ACTIVE} living marks`;
  status.classList.add('ready');

  window.__painterlyChainProof = {
    artworkSize: [ART_SIZE, ART_SIZE],
    directionFieldSize: [ART_SIZE, ART_SIZE],
    poissonSeeds: seeds.length,
    bezierStrokes: strokeData.count,
    strokeRTSize: [RT_SIZE, RT_SIZE],
    heightRTSize: [RT_SIZE, RT_SIZE],
    impastoActive: true,
    boidsActive: BOID_ACTIVE,
    crossCoupling: 'direction-field → boid-mark-orientation',
    capabilities: [
      'direction-field', 'poisson-seeds', 'bezier-strokes',
      'impasto-material', 'gpgpu-boids', 'gradient-map',
    ],
    causalChain: [
      'procedural-artwork',
      'direction-field-analysis',
      'poisson-seed-distribution',
      'bezier-stroke-geometry',
      'impasto-three-pass-composite',
      'direction-field-coupled-boid-marks',
    ],
  };
}

// ── Pointer tracking ────────────────────────────────────────

canvas.addEventListener('pointermove', (e) => {
  const rect = canvas.getBoundingClientRect();
  pointerNorm.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  pointerNorm.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
});
canvas.addEventListener('pointerleave', () => pointerNorm.set(999, 999));
document.addEventListener('visibilitychange', () => { animating = !document.hidden; });

// ── Animation loop ──────────────────────────────────────────

let lastTime = 0;

function animate(time) {
  requestAnimationFrame(animate);
  if (!animating || !boids) return;

  const dt = Math.min((time - lastTime) / 1000, 0.05);
  lastTime = time;
  if (dt <= 0) return;
  elapsed += dt;

  boids.setPredator(pointerNorm.x * 0.5, pointerNorm.y * 0.5, 0);
  boids.compute(dt);

  compositeMat.uniforms.uLightAngle.value = 0.8 + Math.sin(elapsed * 0.12) * 0.35;
  compositeMat.uniforms.uTime.value = elapsed;

  boidMarkMesh.material.uniforms.texturePosition.value = boids.positionTexture;
  boidMarkMesh.material.uniforms.textureVelocity.value = boids.velocityTexture;

  renderer.setClearColor(0x0a0908, 1);
  renderer.clear();
  renderer.render(compositeScene, compositeCamera);
  renderer.render(boidScene, boidCamera);
}

init().then(() => {
  requestAnimationFrame(animate);
}).catch((err) => {
  status.textContent = `Error: ${err.message}`;
  console.error(err);
});
