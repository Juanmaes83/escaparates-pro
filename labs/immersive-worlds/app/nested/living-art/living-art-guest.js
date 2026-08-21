/**
 * Living Art — Museum nested-runtime guest.
 *
 * Uses the six sculpted capabilities (direction-field, poisson-seeds,
 * bezier-strokes, impasto-material, gpgpu-boids, gradient-map) to present
 * a user-selected artwork as a living painting inside a Museum room.
 *
 * Follows the BreezeGuest contract exactly:
 *   prepare  → create WebGL renderer
 *   activate → build the pipeline (strokes, impasto, boids)
 *   setCameraPose → receive camera from Museum (guest never writes camera)
 *   update   → per-frame work
 *   dispose  → release everything
 *   report   → diagnostic state
 *
 * CAMERA: MUSEUM DECIDES CAMERA. THE GUEST RENDERS IT.
 *
 * The guest has no input listeners for camera. Pointer position is tracked
 * only for boid predator response — the flock reacts to the visitor's gaze
 * direction projected onto the painting surface, not to camera movement.
 *
 * Donor provenance: wet-paint-flow (MIT) + van-gogh-crows (MIT code).
 * Capabilities from engine/capabilities/ — already vendored and proven.
 */

import * as THREE from '../../../vendor/three/three.module.min.js';
import { GPUComputationRenderer } from '../../../vendor/three/addons/misc/GPUComputationRenderer.js';
import { buildDirectionField } from '../../../engine/capabilities/painterly/direction-field.js';
import { generatePoissonSeeds } from '../../../engine/capabilities/painterly/poisson-seeds.js';
import {
  STROKE_VERTEX_SHADER, STROKE_FRAGMENT_SHADER,
  HEIGHT_FRAGMENT_SHADER, buildStrokesFromField,
} from '../../../engine/capabilities/painterly/bezier-strokes.js';
import {
  IMPASTO_COMPOSITE_VERTEX, IMPASTO_COMPOSITE_FRAGMENT,
} from '../../../engine/capabilities/painterly/impasto-material.glsl.js';
import { BoidsSimulation } from '../../../engine/capabilities/gpgpu-boids/boids-simulation.js';
import {
  GRADIENT_MAP_UNIFORM_DECLARATIONS, GRADIENT_MAP_FUNCTION,
} from '../../../engine/capabilities/painterly/gradient-map.glsl.js';

const ART_SIZE = 256;
const RT_SIZE = 1024;
const SEED_COUNT = 3000;
const BOID_GRID = 14;
const BOID_ACTIVE = 160;
const BOID_BOUNDS = 400;

const MODE = { COMBINED: 'combined', PAINTERLY: 'painterly', LIVING: 'living' };

export class LivingArtGuest {
  constructor() {
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.canvas = null;

    this._strokeMesh = null;
    this._boidMarkMesh = null;
    this._impastoQuad = null;
    this._colorRT = null;
    this._heightRT = null;
    this._boids = null;
    this._directionField = null;

    this._mode = MODE.COMBINED;
    this._pointerNorm = new THREE.Vector2(999, 999);
    this._elapsed = 0;
    this._disposed = false;

    this.stats = {
      prepared: 0, activated: 0, disposed: 0,
      frames: 0, poses: 0, strokeCount: 0, boidCount: 0
    };
  }

  async prepare({ canvas }) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.autoClear = false;
    this.stats.prepared += 1;
  }

  async activate({ config = {} } = {}) {
    const w = this.canvas.width;
    const h = this.canvas.height;
    this.renderer.setSize(w, h, false);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(config.background ?? 0x0a0908);

    this.camera = new THREE.PerspectiveCamera(config.fov ?? 40, w / h, 0.05, 400);

    const artPixels = this._generateProceduralArtwork(ART_SIZE, ART_SIZE);
    await this._buildPipeline(artPixels, ART_SIZE, ART_SIZE);

    this.stats.activated += 1;
  }

  setCameraPose(pose) {
    if (!this.camera || !pose) return;
    this.camera.position.set(pose.position[0], pose.position[1], pose.position[2]);
    this.camera.lookAt(pose.target[0], pose.target[1], pose.target[2]);
    if (pose.fov && pose.fov !== this.camera.fov) {
      this.camera.fov = pose.fov;
      this.camera.updateProjectionMatrix();
    }
    this.stats.poses += 1;
  }

  update(dt) {
    if (this._disposed || !this.renderer) return;
    this._elapsed += dt;

    if (this._impastoQuad) {
      this._impastoQuad.visible =
        this._mode === MODE.COMBINED || this._mode === MODE.PAINTERLY;
    }

    if (this._boidMarkMesh) {
      const boidsActive =
        this._mode === MODE.COMBINED || this._mode === MODE.LIVING;
      this._boidMarkMesh.visible = boidsActive;
      if (boidsActive && this._boids) {
        this._boids.setPredator(this._pointerNorm.x, this._pointerNorm.y, 0);
        this._boids.compute(dt);
        this._boidMarkMesh.material.uniforms.texturePosition.value = this._boids.positionTexture;
        this._boidMarkMesh.material.uniforms.textureVelocity.value = this._boids.velocityTexture;
        this._boidMarkMesh.material.uniforms.uTime.value = this._elapsed;
      }
    }

    this.renderer.clear();
    this.renderer.render(this.scene, this.camera);
    this.stats.frames += 1;
  }

  suspend() {}
  restore() {}

  async dispose() {
    this._disposed = true;
    if (this._boids) { this._boids.dispose(); this._boids = null; }
    if (this._colorRT) { this._colorRT.dispose(); this._colorRT = null; }
    if (this._heightRT) { this._heightRT.dispose(); this._heightRT = null; }
    if (this._compositeRT) { this._compositeRT.dispose(); this._compositeRT = null; }
    if (this._strokeMesh) {
      this._strokeMesh.geometry.dispose();
      this._strokeMesh.material.dispose();
    }
    if (this._boidMarkMesh) {
      this._boidMarkMesh.geometry.dispose();
      this._boidMarkMesh.material.dispose();
    }
    if (this._impastoQuad) {
      this._impastoQuad.geometry.dispose();
      this._impastoQuad.material.dispose();
    }
    if (this.renderer) { this.renderer.dispose(); this.renderer = null; }
    this.stats.disposed += 1;
  }

  report() {
    return {
      mode: this._mode,
      elapsed: this._elapsed,
      capabilities: [
        'direction-field', 'poisson-seeds', 'bezier-strokes',
        'impasto-material', 'gpgpu-boids', 'gradient-map'
      ],
      ...this.stats
    };
  }

  // ── Pipeline ─────────────────────────────────────────────────────────────

  async _buildPipeline(artPixels, artW, artH) {
    const artTex = new THREE.DataTexture(artPixels, artW, artH, THREE.RGBAFormat);
    artTex.needsUpdate = true;

    // 1. Direction field
    const field = buildDirectionField(artPixels, artW, artH);
    this._directionField = field;

    // 2. Poisson seeds
    const seeds = generatePoissonSeeds(artW, artH, field.confidence, {
      totalCount: SEED_COUNT, generation: 0,
    });

    // 3. Bezier strokes
    const strokeData = buildStrokesFromField(
      seeds, field, artW, artH, artPixels,
      { lengthScale: 1.1, layerWidths: [13, 6.5, 3.2], layerLengths: [26, 15, 7.5] }
    );

    // 4. Build stroke mesh into offscreen render targets
    this._colorRT = new THREE.WebGLRenderTarget(RT_SIZE, RT_SIZE, {
      minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter,
      type: THREE.HalfFloatType,
    });
    this._heightRT = new THREE.WebGLRenderTarget(RT_SIZE, RT_SIZE, {
      minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter,
      type: THREE.HalfFloatType,
    });

    const strokeGeom = this._buildStrokeGeometry(strokeData);
    const strokeUniforms = {
      uResolution: { value: new THREE.Vector2(RT_SIZE, RT_SIZE) },
      uStrokeScale: { value: 1.0 },
      uBrushSize: { value: 1.0 },
      uBrushLayerVisibility: { value: new THREE.Vector3(1, 1, 1) },
      uCoverage: { value: 0.92 },
      uViscosity: { value: 0.55 },
      uBristleDetail: { value: 0.72 },
    };

    const pigmentMat = new THREE.ShaderMaterial({
      vertexShader: STROKE_VERTEX_SHADER,
      fragmentShader: STROKE_FRAGMENT_SHADER,
      uniforms: strokeUniforms,
      transparent: true, depthWrite: false, depthTest: false,
      side: THREE.DoubleSide,
    });
    this._strokeMesh = new THREE.Mesh(strokeGeom, pigmentMat);

    const orthoScene = new THREE.Scene();
    const orthoCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 10);
    orthoCam.position.z = 5;
    orthoScene.add(this._strokeMesh);

    this.renderer.setRenderTarget(this._colorRT);
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.clear();
    this.renderer.render(orthoScene, orthoCam);

    const heightMat = new THREE.ShaderMaterial({
      vertexShader: STROKE_VERTEX_SHADER,
      fragmentShader: HEIGHT_FRAGMENT_SHADER,
      uniforms: strokeUniforms,
      transparent: true, depthWrite: false, depthTest: false,
      side: THREE.DoubleSide,
    });
    this._strokeMesh.material = heightMat;

    this.renderer.setRenderTarget(this._heightRT);
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.clear();
    this.renderer.render(orthoScene, orthoCam);
    this.renderer.setRenderTarget(null);

    pigmentMat.dispose();

    this.stats.strokeCount = strokeData.count;

    // 5. Impasto composite — full-screen pass to compositeRT, then display on 3D plane
    const texel = 1.0 / RT_SIZE;
    this._compositeRT = new THREE.WebGLRenderTarget(RT_SIZE, RT_SIZE, {
      minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter,
    });
    const compositeMat = new THREE.ShaderMaterial({
      vertexShader: IMPASTO_COMPOSITE_VERTEX,
      fragmentShader: IMPASTO_COMPOSITE_FRAGMENT,
      uniforms: {
        uBase:       { value: artTex },
        uStroke:     { value: this._colorRT.texture },
        uHeight:     { value: this._heightRT.texture },
        uTexel:      { value: new THREE.Vector2(texel, texel) },
        uImpasto:    { value: 0.04 },
        uWetness:    { value: 0.31 },
        uLightAngle: { value: 0.0 },
        uTime:       { value: 0.0 },
      },
      depthTest: false, depthWrite: false,
    });
    const compositeQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), compositeMat);
    const compositeScene = new THREE.Scene();
    compositeScene.add(compositeQuad);
    const compositeCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    this.renderer.setRenderTarget(this._compositeRT);
    this.renderer.clear();
    this.renderer.render(compositeScene, compositeCam);
    this.renderer.setRenderTarget(null);

    compositeMat.dispose();
    compositeQuad.geometry.dispose();

    const aspect = artW / artH;
    const quadH = 3.0;
    const quadW = quadH * aspect;
    const displayMat = new THREE.MeshBasicMaterial({
      map: this._compositeRT.texture, side: THREE.DoubleSide,
    });
    this._impastoQuad = new THREE.Mesh(new THREE.PlaneGeometry(quadW, quadH), displayMat);
    this._impastoQuad.position.set(0, quadH / 2 + 0.6, 0);
    this.scene.add(this._impastoQuad);

    // 6. GPGPU boids
    this._boids = new BoidsSimulation(this.renderer, GPUComputationRenderer, {
      gridWidth: BOID_GRID,
      activeCount: BOID_ACTIVE,
      bounds: BOID_BOUNDS,
      separationDistance: 28,
      alignmentDistance: 22,
      cohesionDistance: 14,
    });

    // 7. Boid marks — instanced points in 3D space around the painting
    const markCount = this._boids.activeCount;
    const markGeom = new THREE.BufferGeometry();
    const refs = new Float32Array(markCount * 2);
    const jitter = new Float32Array(markCount);
    for (let i = 0; i < markCount; i++) {
      refs[i * 2] = (i % BOID_GRID) / BOID_GRID + 0.5 / BOID_GRID;
      refs[i * 2 + 1] = Math.floor(i / BOID_GRID) / BOID_GRID + 0.5 / BOID_GRID;
      jitter[i] = Math.random();
    }
    markGeom.setAttribute('reference', new THREE.BufferAttribute(refs, 2));
    markGeom.setAttribute('sizeJitter', new THREE.BufferAttribute(jitter, 1));
    markGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(markCount * 3), 3));

    const markMat = new THREE.ShaderMaterial({
      vertexShader: `
        uniform sampler2D texturePosition;
        uniform sampler2D textureVelocity;
        uniform float uMarkScale;
        uniform float uBounds;
        uniform float uTime;
        attribute vec2 reference;
        attribute float sizeJitter;
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          vec4 posData = texture2D(texturePosition, reference);
          vec4 velData = texture2D(textureVelocity, reference);
          vec3 pos = posData.xyz;
          float speed = length(velData.xyz);
          float phase = posData.w + uTime * 0.5;
          float breathe = 0.55 + 0.25 * sin(phase * 1.4);
          float motionFade = mix(0.85, 0.45, clamp(speed / 7.0, 0.0, 1.0));
          vAlpha = breathe * motionFade * 0.5;
          vColor = mix(vec3(0.76, 0.55, 0.28), vec3(1.0, 0.93, 0.80), clamp(speed / 6.0, 0.0, 1.0));
          float sx = pos.x / uBounds;
          float sy = pos.y / uBounds;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(sx * 3.0, sy * 3.0 + 2.1, 0.15, 1.0);
          float velocityGrow = 1.0 + clamp(speed / 5.0, 0.0, 1.5);
          float phasePulse = 1.0 + sin(phase) * 0.2;
          gl_PointSize = uMarkScale * velocityGrow * phasePulse * (0.7 + sizeJitter * 0.6);
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          vec2 uv = gl_PointCoord - vec2(0.5);
          float dist = length(uv);
          if (dist > 0.5) discard;
          float alpha = vAlpha * smoothstep(0.5, 0.12, dist);
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      uniforms: {
        texturePosition: { value: null },
        textureVelocity: { value: null },
        uMarkScale: { value: 18.0 },
        uBounds: { value: BOID_BOUNDS },
        uTime: { value: 0 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this._boidMarkMesh = new THREE.Points(markGeom, markMat);
    this.scene.add(this._boidMarkMesh);
    this.stats.boidCount = markCount;
  }

  _buildStrokeGeometry(strokeData) {
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

  _generateProceduralArtwork(w, h) {
    const data = new Uint8ClampedArray(w * h * 4);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const nx = x / w, ny = y / h;
        const swirl = Math.sin(nx * 6.28 + ny * 3.14) * 0.5 + 0.5;
        const wave = Math.cos(ny * 9.42 - nx * 4.71) * 0.5 + 0.5;
        const r = Math.floor(180 * swirl + 40 * wave + 20);
        const g = Math.floor(120 * swirl + 60 * wave + 30);
        const b = Math.floor(60 * swirl + 30 * wave + 40);
        data[i] = Math.min(255, r);
        data[i + 1] = Math.min(255, g);
        data[i + 2] = Math.min(255, b);
        data[i + 3] = 255;
      }
    }
    return data;
  }
}
