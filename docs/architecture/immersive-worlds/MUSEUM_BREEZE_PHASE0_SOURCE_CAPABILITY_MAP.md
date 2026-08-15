# Museum Breeze room — Phase 0 reconciliation and source/capability map

Spec: `MUSEUM_BREEZE_SCULPTURE_CLOTH_ROOM_IMPLEMENTATION_SPEC_V1.md`, read in full.
Authority: Breeze Studio PRO V4 @ `3a58e9b`. Engine donor: `Juanmaes83/breeze` @ `0ab8234`.

## What is actually present, verified rather than assumed

| Thing | Finding |
|---|---|
| V4 authority commit `3a58e9b` | **Reachable** from this clone |
| V4 module at HEAD of this branch | **Absent** — `labs/website-modules-source/` has rope-gallery-pro and six others, no breeze-studio-pro |
| V4 module at `3a58e9b` | **Present** — 19 files |
| V4 form | **A built Vite bundle**, not source: `assets/index-D7hPybyr.js`, 1.6 MB, plus `index.html`, Venus GLB/OBJ, Khronos GLB objects, fabric textures, HDRIs |
| `.github/workflows/build-breeze-studio-pro.yml` | **Absent at HEAD** (§30 assumes it exists) |
| Branches carrying breeze-studio-pro | `origin/feature/breeze-studio-pro` and five others |

## §9 — the mandatory renderer reconciliation

| | Museum | Breeze V4 |
|---|---|---|
| Renderer class | `THREE.WebGLRenderer` (`render/render-host.js:30`) | `WebGPURenderer` — 29 refs in the bundle |
| three build | vendored `three.module.min.js` **0.185.1**, pinned | `three/webgpu` |
| WebGPU in the vendored build | **0 references** in either vendored file | `navigator.gpu` ×3, `createComputePipeline` ×7, `WebGPUBackend` ×8 |
| Compute | none — Museum draws, it does not compute | `StorageBufferAttribute` ×12, `computeAsync` ×9 |

Answers to the spec's own questions:

- **A. Can Breeze physics run under the Museum renderer?** No. The Verlet solver is
  GPU compute. `WebGLRenderer` has no compute path, and three's WebGL backend does
  not implement compute shaders — this is not a flag, it is a different renderer.
- **B. Compatible renderer already?** No. Museum's vendored 0.185.1 build contains
  no WebGPU code at all.
- **C. Mount Breeze content as a room group?** Not into the current scene graph:
  the two renderers cannot share one.
- **D. Renderer-wide change required?** Yes, to run it natively.
- **E. Separate physics from rendering?** Only by adding a second WebGPU device
  and reading results back — a per-frame GPU→CPU→GPU round trip for the full
  vertex set, which is the cost the donor exists to avoid.
- **F. Bounded offscreen subsystem?** Possible in principle, and the only route
  that does not touch the global renderer.
- **G. Two camera/presentation authorities?** A second renderer with its own
  canvas is a second presentation authority, which `NO SECOND RENDERING TRUTH`
  forbids without an explicit decision.

**Classification: GLOBAL CONTRACT CHANGE.** Per §9 and §37 this is
`PREPARATION ONLY → EVIDENCE → HUMAN DECISION`. Changing Museum's renderer would
affect every existing world, every approved visual baseline including the
human-preferred Crossing B, and every captured QA artefact.

## §40 source map

| Capability | Product authority | Engine donor | Museum owner | Action | Status |
|---|---|---|---|---|---|
| Cloth product behaviour | V4 | Breeze | Breeze Room Adapter | REUSE/ADAPT | **blocked on renderer** |
| Verlet physics | V4 | Breeze | Breeze Core | REUSE | **blocked — GPU compute** |
| Wind | V4 | Breeze | Breeze Core | REUSE/CONFIGURE | blocked with solver |
| Collision / BVH | V4 | Breeze BVH | Breeze Core | REUSE | blocked with solver |
| Sculpture replacement | V4 | loaders/BVH | Museum Authoring | RECONNECT | assets present at `3a58e9b` |
| Background image/video | V4 | V4 | Museum media | RECONNECT | needs P0.2 |
| Cloth image/video | V4 | V4 | Museum media | RECONNECT | needs P0.2 |
| Grading | V4 | V4 | Museum Authoring | REUSE | independent of renderer |
| Camera / Guide / Route | Museum | none | Director | MUSEUM AUTHORITY | available |
| Back | Museum G1B | none | Director | EXTEND/RECONCILE | **available now** — same-room and cross-room both land on canonical poses |
| Assets/persistence | Project Cloud | none | Museum | RECONNECT | external blocker |

## Risk map

1. **Renderer split** — the whole room depends on it. Human decision.
2. **V4 is a bundle, not source.** Adapting a 1.6 MB minified build is not
   "porting the capability"; the donor repo `Juanmaes83/breeze` is the real
   source and is a separate repository not attached to this session.
3. **Media depends on P0.2**, which is externally blocked. Cloth and background
   media would otherwise reintroduce session-only object URLs — explicitly
   forbidden by §15.
4. **Physics determinism vs guided dramaturgy** (§19) is unresolved and is a
   product question, not an implementation one.

## What can proceed without the decision

Room blockout (§18) as pure Museum geometry, route/stop insertion design, Guide
choreography grammar (§20), camera beat grammar (§21), and the authoring field
model (§16) — none of which touch the renderer. All are PREPARATION ONLY until
the room can actually render.
