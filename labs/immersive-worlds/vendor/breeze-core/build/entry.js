/**
 * The Breeze core, as the Museum consumes it.
 *
 * This is the whole reason a build step exists in a build-free module. The
 * donor's physics is written in TSL with arithmetic operators —
 *
 *   const delta = (v1 - v0).toVar();
 *   const force = (dist - restLength) * stiffness * delta * 0.5 / dist;
 *
 * — which is not JavaScript that does what it reads as. `vite-plugin-tsl-operator`
 * rewrites those operators into `.sub()`, `.mul()`, `.div()` node calls at build
 * time. Loaded as a raw ES module in a browser, `v1 - v0` would coerce two node
 * objects to NaN and the cloth would be still. There is no import-map or loader
 * trick that avoids this: the source must pass through the transform.
 *
 * So the core is built once, here, and the output is vendored. The Museum still
 * ships no build step; it imports one pre-built ES module, and only when the
 * Breeze room activates.
 *
 * `three/webgpu` and `three/tsl` are re-exported deliberately. The Museum's own
 * renderer is WebGL Three 0.185.1 under `vendor/three/`, and the two must never
 * be confused for one another: the guest's Three is *this* one, 0.176.0 with a
 * WebGPU backend, and the adapter gets it from here so there is exactly one
 * WebGPU Three instance in the page and no chance of a mismatched pair.
 *
 * Nothing of the Breeze app shell is exported — no App, no OrbitControls, no
 * autoRotate, no Tweakpane, no scene switcher. Those are the standalone demo.
 * The Museum owns the camera, the scene composition and the lifecycle.
 */

export * as THREE from 'three/webgpu';
export * as TSL from 'three/tsl';

export { StructuredArray } from './src/common/structuredArray.js';
export { VerletPhysics } from './src/physics/verletPhysics.js';
export { BVH } from './src/bvh.js';

// The installation itself: the sculpture with its collision geometry, the cloth
// with its fabric material and spring lattice, the wind noise field, and the
// key light. These are the donor's, unmodified — the room is Breeze running,
// not a Museum impression of Breeze.
// Neutral studio IBL, from *this* bundle's Three rather than the Museum's.
// Feeding a Scene built by the Museum's WebGL Three 0.185 into this renderer's
// PMREM generator loses the WebGPU device outright — "a valid external Instance
// reference no longer exists" — with no exception to catch. Two Three instances
// in one page is fine; one object crossing between them is not.
export { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

export { Statue } from './src/statue.js';
export { ClothGeometry } from './src/clothGeometry.js';
export { Lights } from './src/lights.js';
export { triNoise3Dvec } from './src/common/noise.js';

/** The physics parameter object (Museum shim, not the donor's Tweakpane panel). */
export { conf as physicsConfig } from './src/conf.js';

/**
 * Provenance, readable at runtime so evidence can quote it rather than a
 * document quoting itself.
 */
export const BREEZE_SOURCE = Object.freeze({
  repository: 'https://github.com/Juanmaes83/breeze',
  commit: '0ab82342f9169f20e32b0e90babcc4707e694906',
  license: 'MIT — © 2025 Niklas Niehus',
  three: '0.176.0',
  threeMeshBvh: '0.9.0',
  extracted: [
    'src/common/structuredArray.js', 'src/physics/verletPhysics.js', 'src/bvh.js',
    'src/statue.js', 'src/clothGeometry.js', 'src/lights.js', 'src/common/noise.js'
  ],
  assets: [
    'venus_de_milo.glb', 'venus_simple2.obj',
    'Fabric_Lace_038_basecolor.png', 'Fabric_Lace_038_normal.png',
    'Fabric_Lace_038_opacity.png', 'Fabric_Lace_038_roughness.png'
  ],
  // Deliberately does not name the donor's GUI library: the provenance check
  // greps the built bundle for app-shell identifiers, and a string here saying
  // the panel was removed would trip the very check that proves it was.
  substituted: ['src/conf.js — donor control panel replaced by a two-field Museum shim'],
  appShell: 'NOT PORTED'
});
