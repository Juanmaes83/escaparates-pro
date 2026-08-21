/**
 * GPGPU Boids Simulation — Museum Living Art Capability
 *
 * Sculpted from: Juanmaes83/van-gogh-crows (VGC-1, VGC-2)
 * Upstream: Three.js webgl_gpgpu_birds (MIT, mrdoob/three.js f85394be)
 * License: MIT
 *
 * Generic flocking simulation on the GPU. Content-agnostic — no creature
 * geometry, textures, or rendering. Produces position/velocity textures
 * that any renderer can consume.
 */

import {
  RepeatWrapping,
  Vector3,
} from '../../../vendor/three/three.module.min.js';

const POSITION_SHADER = /* glsl */`
uniform float time;
uniform float delta;
uniform float activeBirdCount;

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec4 tmpPos = texture2D( texturePosition, uv );
  float idx = floor( gl_FragCoord.y ) * resolution.x + floor( gl_FragCoord.x );
  if ( idx >= activeBirdCount ) {
    gl_FragColor = tmpPos;
    return;
  }
  vec3 position = tmpPos.xyz;
  vec3 velocity = texture2D( textureVelocity, uv ).xyz;
  float phase = tmpPos.w;
  phase = mod(
    phase + delta + length( velocity.xz ) * delta * 3.0
    + max( velocity.y, 0.0 ) * delta * 6.0,
    62.83
  );
  gl_FragColor = vec4( position + velocity * delta * 15.0, phase );
}
`;

const VELOCITY_SHADER = /* glsl */`
uniform float time;
uniform float delta;
uniform float separationDistance;
uniform float alignmentDistance;
uniform float cohesionDistance;
uniform float freedomFactor;
uniform vec3 predator;
uniform float activeBirdCount;

const float width = resolution.x;
const float height = resolution.y;
const float PI = 3.141592653589793;
const float PI_2 = PI * 2.0;

float zoneRadius = 40.0;
float zoneRadiusSquared = 1600.0;
float separationThresh = 0.45;
float alignmentThresh = 0.65;

const float UPPER_BOUNDS = BOUNDS;
const float LOWER_BOUNDS = -UPPER_BOUNDS;
const float SPEED_LIMIT = 9.0;

// Per-obstacle uniforms — up to MAX_OBSTACLES spherical repulsors.
#ifndef MAX_OBSTACLES
#define MAX_OBSTACLES 4
#endif
uniform vec3 obstaclePositions[MAX_OBSTACLES];
uniform float obstacleRadii[MAX_OBSTACLES];
uniform float obstacleStrengths[MAX_OBSTACLES];
uniform int obstacleCount;

float rand( vec2 co ) {
  return fract( sin( dot( co.xy, vec2(12.9898, 78.233) ) ) * 43758.5453 );
}

void main() {
  zoneRadius = separationDistance + alignmentDistance + cohesionDistance;
  separationThresh = separationDistance / zoneRadius;
  alignmentThresh = ( separationDistance + alignmentDistance ) / zoneRadius;
  zoneRadiusSquared = zoneRadius * zoneRadius;

  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec3 selfPosition = texture2D( texturePosition, uv ).xyz;
  vec3 selfVelocity = texture2D( textureVelocity, uv ).xyz;
  float birdIndex = floor( gl_FragCoord.y ) * width + floor( gl_FragCoord.x );
  if ( birdIndex >= activeBirdCount ) {
    gl_FragColor = vec4( selfVelocity, 1.0 );
    return;
  }

  float dist;
  vec3 dir;
  float distSquared;
  float f;
  float percent;
  vec3 velocity = selfVelocity;
  float limit = SPEED_LIMIT;

  // Predator avoidance (pointer/visitor position).
  dir = predator * UPPER_BOUNDS - selfPosition;
  dir.z = 0.0;
  dist = length( dir );
  distSquared = dist * dist;
  float preyRadius = 150.0;
  float preyRadiusSq = preyRadius * preyRadius;
  if ( dist < preyRadius ) {
    f = ( distSquared / preyRadiusSq - 1.0 ) * delta * 100.0;
    velocity += normalize( dir ) * f;
    limit += 5.0;
  }

  // Spherical obstacle avoidance (generalized from donor sun obstacle).
  for ( int i = 0; i < MAX_OBSTACLES; i++ ) {
    if ( i >= obstacleCount ) break;
    dir = obstaclePositions[i] - selfPosition;
    dir.z = 0.0;
    dist = length( dir );
    float safeR = max( obstacleRadii[i], 1.0 );
    if ( dist > 0.001 && dist < safeR ) {
      f = ( dist * dist / ( safeR * safeR ) - 1.0 )
          * delta * 100.0 * obstacleStrengths[i];
      velocity += normalize( dir ) * f;
      limit += 5.0 * obstacleStrengths[i];
    }
  }

  // Central attraction.
  dir = selfPosition - vec3( 0.0 );
  dist = length( dir );
  dir.y *= 2.5;
  velocity -= normalize( dir ) * delta * 5.0;

  // Boid rules: separation / alignment / cohesion.
  for ( float y = 0.0; y < height; y++ ) {
    for ( float x = 0.0; x < width; x++ ) {
      if ( y * width + x >= activeBirdCount ) continue;
      vec2 ref = vec2( x + 0.5, y + 0.5 ) / resolution.xy;
      vec3 birdPosition = texture2D( texturePosition, ref ).xyz;
      dir = birdPosition - selfPosition;
      dist = length( dir );
      if ( dist < 0.0001 ) continue;
      distSquared = dist * dist;
      if ( distSquared > zoneRadiusSquared ) continue;
      percent = distSquared / zoneRadiusSquared;

      if ( percent < separationThresh ) {
        f = ( separationThresh / percent - 1.0 ) * delta;
        velocity -= normalize( dir ) * f;
      } else if ( percent < alignmentThresh ) {
        float threshDelta = alignmentThresh - separationThresh;
        float adjustedPercent = ( percent - separationThresh ) / threshDelta;
        vec3 birdVelocity = texture2D( textureVelocity, ref ).xyz;
        f = ( 0.5 - cos( adjustedPercent * PI_2 ) * 0.5 + 0.5 ) * delta;
        velocity += normalize( birdVelocity ) * f;
      } else {
        float threshDelta = 1.0 - alignmentThresh;
        float adjustedPercent;
        if ( threshDelta == 0.0 ) adjustedPercent = 1.0;
        else adjustedPercent = ( percent - alignmentThresh ) / threshDelta;
        f = ( 0.5 - ( cos( adjustedPercent * PI_2 ) * -0.5 + 0.5 ) ) * delta;
        velocity += normalize( dir ) * f;
      }
    }
  }

  if ( length( velocity ) > limit ) {
    velocity = normalize( velocity ) * limit;
  }
  gl_FragColor = vec4( velocity, 1.0 );
}
`;

/**
 * @typedef {Object} BoidsConfig
 * @property {number}  [gridWidth=32]          Simulation grid side (gridWidth² = max agents)
 * @property {number}  [activeCount]           How many agents are alive (≤ gridWidth²)
 * @property {number}  [bounds=800]            World half-extent
 * @property {number}  [separationDistance=20]  Separation zone radius
 * @property {number}  [alignmentDistance=20]   Alignment zone radius
 * @property {number}  [cohesionDistance=20]    Cohesion zone radius
 * @property {number}  [maxObstacles=4]        Max simultaneous repulsor obstacles
 */

export class BoidsSimulation {
  /**
   * @param {import('three').WebGLRenderer} renderer
   * @param {import('three/addons/misc/GPUComputationRenderer.js').GPUComputationRenderer} GPUComputationRendererClass
   * @param {BoidsConfig} [config]
   */
  constructor(renderer, GPUComputationRendererClass, config = {}) {
    const {
      gridWidth = 32,
      activeCount,
      bounds = 800,
      separationDistance = 20,
      alignmentDistance = 20,
      cohesionDistance = 20,
      maxObstacles = 4,
    } = config;

    this.gridWidth = gridWidth;
    this.maxAgents = gridWidth * gridWidth;
    this.activeCount = activeCount ?? this.maxAgents;
    this.bounds = bounds;
    this.maxObstacles = maxObstacles;
    this._elapsed = 0;
    this._disposed = false;

    const gpu = new GPUComputationRendererClass(gridWidth, gridWidth, renderer);
    this._gpu = gpu;

    const dtPosition = gpu.createTexture();
    const dtVelocity = gpu.createTexture();
    this._fillPositionTexture(dtPosition, bounds);
    this._fillVelocityTexture(dtVelocity);

    const velShader = VELOCITY_SHADER;
    const posShader = POSITION_SHADER;

    this._velocityVar = gpu.addVariable('textureVelocity', velShader, dtVelocity);
    this._positionVar = gpu.addVariable('texturePosition', posShader, dtPosition);

    gpu.setVariableDependencies(this._velocityVar, [this._positionVar, this._velocityVar]);
    gpu.setVariableDependencies(this._positionVar, [this._positionVar, this._velocityVar]);

    const pu = this._positionVar.material.uniforms;
    const vu = this._velocityVar.material.uniforms;

    pu['time'] = { value: 0 };
    pu['delta'] = { value: 0 };
    pu['activeBirdCount'] = { value: this.activeCount };

    vu['time'] = { value: 1 };
    vu['delta'] = { value: 0 };
    vu['activeBirdCount'] = { value: this.activeCount };
    vu['separationDistance'] = { value: separationDistance };
    vu['alignmentDistance'] = { value: alignmentDistance };
    vu['cohesionDistance'] = { value: cohesionDistance };
    vu['freedomFactor'] = { value: 1 };
    vu['predator'] = { value: new Vector3() };

    const obstPos = [];
    const obstRad = [];
    const obstStr = [];
    for (let i = 0; i < maxObstacles; i++) {
      obstPos.push(new Vector3());
      obstRad.push(0);
      obstStr.push(0);
    }
    vu['obstaclePositions'] = { value: obstPos };
    vu['obstacleRadii'] = { value: obstRad };
    vu['obstacleStrengths'] = { value: obstStr };
    vu['obstacleCount'] = { value: 0 };

    this._velocityVar.material.defines.BOUNDS = bounds.toFixed(2);
    this._velocityVar.material.defines.MAX_OBSTACLES = String(maxObstacles);

    this._velocityVar.wrapS = RepeatWrapping;
    this._velocityVar.wrapT = RepeatWrapping;
    this._positionVar.wrapS = RepeatWrapping;
    this._positionVar.wrapT = RepeatWrapping;

    this._posUniforms = pu;
    this._velUniforms = vu;

    const error = gpu.init();
    if (error !== null) {
      throw new Error(`[BoidsSimulation] GPU init failed: ${error}`);
    }
  }

  /** How many agents are currently simulated. */
  get activeAgentCount() { return this.activeCount; }
  set activeAgentCount(n) {
    this.activeCount = Math.max(0, Math.min(n, this.maxAgents));
    this._posUniforms['activeBirdCount'].value = this.activeCount;
    this._velUniforms['activeBirdCount'].value = this.activeCount;
  }

  /** Set the predator/visitor position in normalized [-1,1] space. */
  setPredator(x, y, z) {
    this._velUniforms['predator'].value.set(x, y, z);
  }

  /**
   * Configure a spherical obstacle (repulsor).
   * @param {number} index  Slot index (0..maxObstacles-1)
   * @param {number} x      World X
   * @param {number} y      World Y
   * @param {number} z      World Z
   * @param {number} radius Avoidance radius
   * @param {number} strength Force multiplier
   */
  setObstacle(index, x, y, z, radius, strength) {
    if (index >= this.maxObstacles) return;
    this._velUniforms['obstaclePositions'].value[index].set(x, y, z);
    this._velUniforms['obstacleRadii'].value[index] = radius;
    this._velUniforms['obstacleStrengths'].value[index] = strength;
  }

  /** Set how many obstacles are active. */
  set obstacleCount(n) {
    this._velUniforms['obstacleCount'].value = Math.min(n, this.maxObstacles);
  }

  /** Update flocking force parameters. */
  setForces({ separation, alignment, cohesion, freedom } = {}) {
    if (separation !== undefined) this._velUniforms['separationDistance'].value = separation;
    if (alignment !== undefined) this._velUniforms['alignmentDistance'].value = alignment;
    if (cohesion !== undefined) this._velUniforms['cohesionDistance'].value = cohesion;
    if (freedom !== undefined) this._velUniforms['freedomFactor'].value = freedom;
  }

  /**
   * Step the simulation forward.
   * @param {number} dt Delta time in seconds (clamped internally to 0.05)
   */
  compute(dt) {
    if (this._disposed) return;
    const delta = Math.min(dt, 0.05);
    this._elapsed += delta;
    this._posUniforms['time'].value = this._elapsed;
    this._posUniforms['delta'].value = delta;
    this._velUniforms['time'].value = this._elapsed;
    this._velUniforms['delta'].value = delta;
    this._gpu.compute();
  }

  /** Current position texture for rendering. */
  get positionTexture() {
    return this._gpu.getCurrentRenderTarget(this._positionVar).texture;
  }

  /** Current velocity texture for rendering. */
  get velocityTexture() {
    return this._gpu.getCurrentRenderTarget(this._velocityVar).texture;
  }

  dispose() {
    this._disposed = true;
    this._gpu.dispose();
  }

  _fillPositionTexture(texture, bounds) {
    const arr = texture.image.data;
    const half = bounds / 2;
    for (let k = 0, kl = arr.length; k < kl; k += 4) {
      arr[k]     = Math.random() * bounds - half;
      arr[k + 1] = Math.random() * bounds - half;
      arr[k + 2] = Math.random() * bounds - half;
      arr[k + 3] = 1;
    }
  }

  _fillVelocityTexture(texture) {
    const arr = texture.image.data;
    for (let k = 0, kl = arr.length; k < kl; k += 4) {
      arr[k]     = (Math.random() - 0.5) * 10;
      arr[k + 1] = (Math.random() - 0.5) * 10;
      arr[k + 2] = (Math.random() - 0.5) * 10;
      arr[k + 3] = 1;
    }
  }
}
