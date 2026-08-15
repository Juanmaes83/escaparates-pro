# Rebuilding `breeze-core.js`

```
npm ci        # or: npm install
npm run build # writes dist/breeze-core.js and copies it to ../breeze-core.js
```

`npm run build:readable` produces an unminified `dist-readable/breeze-core.js`.
That is the copy to open when you want to check that the TSL operator transform
actually ran — see below.

Neither `node_modules/`, `dist/` nor `dist-readable/` is committed. The single
committed artefact is `../breeze-core.js`.

## Why this build exists at all

The Museum is a build-free static ES-module app. Everything else in
`labs/immersive-worlds/` is loaded by the browser exactly as it is written, and
that is a property worth keeping: no toolchain sits between the source under
review and the pixels a human approves.

The Breeze physics cannot be loaded that way. It is written in TSL with
arithmetic operators over node objects:

```js
const delta = (v1 - v0).toVar();
const force = (dist - restLength) * stiffness * delta * 0.5 / dist;
```

`v1 - v0` is not subtraction of vectors. `v1` and `v0` are TSL nodes; JavaScript
would coerce them through `valueOf`, get `NaN`, and the cloth would hang
motionless with no error in the console. `vite-plugin-tsl-operator` is a Babel
transform that rewrites those expressions into node method calls at build time.
The donor's `vite.config.js` installs it; without it the file is not runnable
JavaScript in any browser, with or without WebGPU.

So the choice is not "build step or no build step". It is "build the core once
and vendor the output" or "rewrite the donor physics by hand", and rewriting it
by hand would mean the Museum no longer runs the real Breeze physics — which is
the one thing Phase 1 exists to establish.

## Checking that the transform ran

```
npm run build:readable
grep -n "0.000001" dist-readable/breeze-core.js
```

The spring kernel should read:

```js
const delta = v1.sub(v0).toVar();
const dist = delta.length().max(0.000001).toVar();
const force = dist.sub(restLength).mul(stiffness).mul(delta).mul(0.5).div(dist);
```

If those lines still contain `-`, `*` and `/`, the plugin did not run and the
artefact is dead on arrival.

## What is in the bundle

| Module | Origin |
|---|---|
| `three/webgpu`, `three/tsl` | three 0.176.0, bundled and re-exported |
| `three-mesh-bvh` | 0.9.0, pulled in by `src/bvh.js` |
| `src/common/structuredArray.js` | Breeze, verbatim |
| `src/physics/verletPhysics.js` | Breeze, verbatim |
| `src/bvh.js` | Breeze, verbatim |
| `src/conf.js` | **Museum shim** — replaces the donor's Tweakpane panel |

The donor's app shell is not here: no `App`, no `OrbitControls`, no `autoRotate`,
no scene switcher, no Tweakpane, no FPS graph. Those belong to the standalone
demo. The Museum owns the camera, the composition and the lifecycle.

Three is bundled rather than left external because the Museum has no import map,
and because the guest's Three must be a distinct instance from the Museum's own
WebGL Three 0.185.1 under `vendor/three/`. Re-exporting it from here is what
guarantees the adapter and the physics share one WebGPU Three and cannot drift
into a mismatched pair.
