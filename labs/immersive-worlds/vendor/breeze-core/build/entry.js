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
  extracted: ['src/common/structuredArray.js', 'src/physics/verletPhysics.js', 'src/bvh.js'],
  // Deliberately does not name the donor's GUI library: the provenance check
  // greps the built bundle for app-shell identifiers, and a string here saying
  // the panel was removed would trip the very check that proves it was.
  substituted: ['src/conf.js — donor control panel replaced by a two-field Museum shim'],
  appShell: 'NOT PORTED'
});
