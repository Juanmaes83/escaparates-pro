# Vendored dependency register — Breeze core

Required by `docs/architecture/immersive-worlds/REFERENCE_LEDGER.md` §22 and
IW-DEC-016: anything copied into this repository is recorded before it is used.

This is the **first row the reuse register has ever carried.** Every reference
repository read for this module so far was read for concepts only — the standing
`PATTERNS ONLY / DIRECT REUSE NOT PLANNED` default. Breeze is different, and by
explicit human decision: the Breeze room is not a Museum reimplementation of a
cloth simulation, it is the Breeze simulation, running.

> No fake cloth. No prerecorded substitution. No test double presented as Breeze.

| Field | Value |
|---|---|
| Package | `breeze` (not published to any registry) |
| Source | `https://github.com/Juanmaes83/breeze` |
| Commit | `0ab82342f9169f20e32b0e90babcc4707e694906` — "Fix normal map" (pinned by the human mandate) |
| License | MIT — © 2025 Niklas Niehus. `LICENSE` in this directory, copied verbatim |
| Attribution obligation | MIT requires the notice and licence text to travel with the code. `LICENSE` must remain beside `breeze-core.js` in any export or distribution of this module |
| Files extracted | `src/common/structuredArray.js`, `src/physics/verletPhysics.js`, `src/bvh.js` — **byte-identical**, see hashes below |
| Files substituted | `src/conf.js` — the donor's Tweakpane control panel, replaced by a two-field Museum shim (`build/src/conf.js`) |
| Files **not** taken | `app.js`, `index.js`, `index.html`, `conf.js`, `info.js`, `lights.js`, `GroundedSkybox.js`, `statue.js`, `clothGeometry.js`, `leafGeometry.js`, `petalGeometry.js`, `physics/verletGeometry.js`, `physics/springVisualizer.js`, `common/noise.js`, `common/gainmap.js`, and every asset |
| Transitive deps bundled | `three` 0.176.0 (WebGPU build), `three-mesh-bvh` 0.9.0 |
| Build recipe | `build/` — Vite 6.3.5 + `vite-plugin-tsl-operator` 1.3.0 |
| Committed artefact | `breeze-core.js`, 2 010 506 bytes, sha256 `6e3916cbe8f533e0c3526d8a00b3243ba33932cba30700374eec2781f0a37479` |
| Used by | `app/nested/breeze/` (the guest adapter), loaded by dynamic `import()` only when the Breeze room activates |
| Not used by | `engine/**`, `render/**`, `scene-kits/**` — nothing in the Museum's own renderer touches it |

## Extraction integrity

The three donor files are unmodified. Their hashes match the donor working tree
at the pinned commit:

```
aa5e402a1caea5d1d8335308f33fd793684a61d13cd0b9578125655a7e45fe53  src/common/structuredArray.js
272c6890528695f1658cd6814a4c1401ea1241eb229ba0040eaef4847c5bd816  src/physics/verletPhysics.js
3045651e8acb44d58c959c8d2d0231088b89ccc421d8f12d3d27074b5c837771  src/bvh.js
```

`qa/tools/breeze-core-provenance.mjs` re-derives these from `build/src/` and
fails if any of them drifts. That check is what keeps "this is the real Breeze
physics" a fact rather than a claim in a document, and it is the reason the
`conf` dependency was substituted rather than patched out of `verletPhysics.js`
— an edit to that file would have made the diff non-empty and the claim
unverifiable.

## The one substitution, and why it is not a divergence

`verletPhysics.js` imports `conf` from `../conf.js`. In the donor that module
constructs a Tweakpane floating panel, an FPS graph, a scene dropdown and the
demo's sliders. Porting the app shell is explicitly forbidden by the mandate,
and a second free-floating control panel over a Tour Stop would not be a room —
it would be a debug build shown to a visitor.

Exactly two of that object's fields reach the physics, both plain numbers:

| Site | Read |
|---|---|
| `verletPhysics.js:106` | `uniform(conf.stiffness)` |
| `verletPhysics.js:107` | `uniform(conf.friction)` |
| `verletPhysics.js:298` | `const { stiffness, friction } = conf;` |

The shim supplies those two numbers at the donor's own defaults (`0.25`, `0.5`)
and nothing else. No GUI, no listeners, no globals.

## Why the donor repository is not a submodule

The mandate is read-only on `Juanmaes83/breeze` — do not modify, do not push.
A submodule would still have required a build step at the Museum's root and
would have coupled the Museum's checkout to a second repository's availability.
Extraction of three files plus a recorded hash check is smaller, auditable, and
leaves the donor untouched.

## Relationship to `vendor/three/`

Two different Three builds now live in this module, deliberately:

| | `vendor/three/` | `vendor/breeze-core/` |
|---|---|---|
| Version | 0.185.1 | 0.176.0 |
| Backend | WebGL2 | WebGPU |
| Owner | the Museum's own renderer | the Breeze guest runtime |
| Loaded | always | only while the Breeze room is presenting |

They never share objects. The Museum hands the guest a plain camera pose —
three numbers, three numbers and a field of view — and the guest renders it.
That is the whole interface, and it is what keeps `NO SECOND RENDERING TRUTH`
true with two renderers in the page: only one of them is presenting at a time,
and the Museum decides which.
