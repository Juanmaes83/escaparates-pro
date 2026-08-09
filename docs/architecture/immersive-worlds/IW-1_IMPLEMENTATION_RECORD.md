# IW-1 — Isolated Technical Skeleton: implementation record

> **Status:** DELIVERED FOR REVIEW — NOT APPROVED, NOT MERGED, NOT INTEGRATED.
> **Repository:** `Juanmaes83/escaparates-pro`
> **Branch:** `claude/immersive-worlds-module-c0d3f7`
> **Base:** `master` at `bdf4cd77c9a1861447f4edd563a733925203506e`
> **Module path:** `labs/immersive-worlds/` (new, self-contained)
> **Date:** 2026-08-09

This document records what IW-1 built, which decisions were taken during
implementation, and what remains open. It is additive: it does **not** modify
`CONSTITUTION.md`, `REFERENCE_LEDGER.md`, `DECISION_LOG.md` or `GLOSSARY.md`,
which are still under review in PR #38. If IW-1 is approved, the ADRs proposed
below should be folded into `DECISION_LOG.md` at that point.

---

## 0. A note on the sources of truth

The IW-0 documents named in the brief were **not on `master`**. They exist only
on the open PR #38 branch `docs/immersive-worlds-module-context-2026-08-09`.
Rather than guess, that branch was fetched and merged into this implementation
branch, so the code and its constitution travel together. The merge is
documentation-only and modifies no existing file.

Authority was resolved as follows. IW-0 states that IW-1 requires explicit
approval before implementation (`CONSTITUTION.md` §31, IW-DEC-015). The current
explicit instruction from Juanma is to begin the isolated implementation and
choose the first milestone. Under the authority order in §32 — *Juanma's explicit
current decision* outranks *proposed working documents* — that instruction is the
authorisation. Everything else in IW-0 was treated as binding.

---

## 1. Milestone chosen, and why

IW-0 defines IW-1 as an "isolated technical skeleton" and IW-2 as the "museum
blockout". A pure skeleton would have proved nothing visually, and the brief is
explicit that a demo which does not exercise the architecture is not wanted.

**IW-1 as delivered is the skeleton plus the thinnest vertical slice through
every layer it has to support**: four Spaces, eleven content entities, real
portals, focus, one guided route, thin authoring, and deterministic QA. Every
subsystem is present in the smallest form that still exercises its contract, and
nothing is present that only exists to look impressive.

The test applied to each candidate feature was: *does its absence leave one of
the §18 success criteria unproven?* If not, it was deferred.

---

## 2. What was built

```text
labs/immersive-worlds/
├── index.html              Published experience (visitor)
├── author.html             Thin authoring surface (author)
├── engine/                 SEMANTIC — contains no Three.js, no DOM
│   ├── core/               runtime, clock, event bus, deterministic RNG, device tiers
│   ├── schema/             types + validator (the invariants, enforced)
│   ├── world/              world store, world graph, world state, space lifecycle
│   ├── camera/             camera authority + explore / focus / directed / author
│   ├── interaction/        proximity, action dispatch
│   ├── experience/         experience director
│   └── scenekit/           the engine↔representation contract
├── render/                 Three.js renderer host (generic, kit-agnostic)
├── scene-kits/museum/      THE ONLY place Three.js becomes a museum
├── worlds/                 museum-v1.world.json — semantic data, no code
├── app/                    DOM shells, UI, input, audio
├── qa/                     named deterministic states + evidence runner
└── vendor/three/           three.js r0.185.1, MIT, vendored
```

The world is the fictitious **Fundación Arenas**: Vestíbulo → Galería A →
Galería B, with an Archivo branching off Galería A. Eleven entities — six
artworks, one sculpture, one video, one audio listening point, two text panels —
matching the fixture in `CONSTITUTION.md` §29.3. Six portals, sixteen hotspots,
one eight-step guided route.

---

## 3. How each §18 success criterion is proven

Each row is checked mechanically by `qa/run-qa.mjs`, not asserted in prose.

| Criterion | How it is enforced | Check |
|---|---|---|
| semantic data ≠ visual representation | `engine/` is scanned for any Three.js import or DOM access; the validator rejects any semantic record carrying `mesh`/`material`/`geometry`/`shader`/`object3d` at any depth | `ENGINE-PURITY`, `INV-SEMANTIC-NOT-VISUAL` |
| one object = one canonical record | `WorldStore` throws on duplicate IDs; `auditCanonicalIdentity()` proves each ID maps to one object; Spaces hold ID references and resolve to the *same object identity* | `INV-CANONICAL`, `INV-BY-REFERENCE` |
| World ≠ Camera | `WorldState.assertNoCameraState()` rejects any camera key on World State; camera pose lives only in `CameraAuthority` | `INV-WORLD-NOT-CAMERA` |
| exactly one camera writer per frame | `CameraAuthority` mints a one-shot write token per frame; stale, foreign, duplicate or post-handoff writes throw | `INV-ONE-CAMERA-WRITER`, `CAMERA-NO-VIOLATIONS` |
| Hotspot ≠ Portal | the validator rejects connectivity fields on a Hotspot and trigger fields on a Portal; traversal is `Hotspot → ACTIVATE_PORTAL → Portal` | `INV-HOTSPOT-NOT-PORTAL` |
| Explore and Guided share one World State | the guided route is driven through the same store instance and the same Action vocabulary; works focused during the tour appear in the visitor's visited set afterwards | `SHARED-WORLD-STATE`, `SHARED-ACTION-PATH` |
| Scene Kit ≠ World Engine | the engine only calls the contract in `engine/scenekit/scene-kit.js`; a kit missing a method fails at startup | `INV-SCENEKIT-CONTRACT` |
| Authoring ≠ Published Experience | two entry points, two camera authorities; the authoring surface contains none of the visitor UI | `AUTHOR-SEPARATE-CAMERA`, `AUTHOR-NOT-EXPERIENCE` |
| isolation from Escaparates Pro | everything lives under `labs/immersive-worlds/`; no existing file is modified; no registry or navigation entry added | `PROTECTED-PATHS` + the diff |

---

## 4. Implementation decisions taken

These resolve open questions from `DECISION_LOG.md`. They are **proposed**, and
are recorded here rather than in the Decision Log so that PR #38 stays untouched.

### IW-1-ADR-001 — Physical topology: an isolated static module (resolves IW-OPEN-001)

`labs/immersive-worlds/` as a self-contained directory of ES modules.

*Why:* Escaparates Pro is a static site with no build step at the root and no
root `package.json`. Introducing a bundler, a workspace or a package boundary
would be exactly the "shared/global change for the new module's convenience"
that IW-DEC-004 forbids. `labs/` already hosts self-contained prototypes
(`labs/interactive-boards-source/`, `labs/website-modules-source/`), so this
follows a convention the repository already has.

*Consequence:* zero build tooling; the module opens from any static server, and
from GitHub Pages / Vercel as they are configured today. If a build step is ever
needed, the boundary is a directory, which is the cheapest thing to move.

### IW-1-ADR-002 — Raw Three.js ES modules, not React Three Fiber (resolves IW-OPEN-002)

*Why:* the World Engine must be reusable, and reuse is damaged by binding the
core to a UI framework. In this design the engine does not import a renderer at
all, which is only cheap to achieve without a component tree owning the scene
graph. R3F would also require npm, a bundler and JSX transforms in a repository
that currently has none of those at the root.

*Consequence:* the engine is framework-agnostic and unit-testable in Node. A
future React host can wrap `RenderHost` without the engine noticing. Reference
repositories that use R3F (`artwork-3D-museum`) were read for their camera and
room concepts, not for their component structure — consistent with IW-REF-003.

### IW-1-ADR-003 — Three.js is vendored, not loaded from a CDN

`vendor/three/three.module.min.js` + `three.core.min.js` + `LICENSE`, pinned to
**r0.185.1**, MIT.

*Why:* other labs in this repository load Three from jsDelivr. That makes a
deterministic QA state depend on a third-party network, and it silently breaks
in restricted environments — the CDN is in fact unreachable from this build
environment. Vendoring makes captures reproducible and the module offline-capable.

*Licensing:* three.js is MIT. The `LICENSE` file is vendored alongside the build,
unmodified. See `vendor/three/VENDOR.md` for the reuse register entry required by
IW-DEC-016. This is a dependency, not reuse of a reference repository's code:
**no code or asset was copied from any reference repo.**

### IW-1-ADR-004 — Anchors are the only place coordinates live (implements IW-DEC-023)

Entities, hotspots, portals, spawn points and camera framing all reference an
`Anchor` by ID. The validator rejects inline `position`/`transform` on an Entity.

*Consequence:* moving a work is a one-line data change, and the authoring layer
can offer "which anchor?" as a dropdown rather than three coordinate fields.
Anchors are authored in world coordinates in this kit; the Scene Kit resolves
them, so a kit that lays rooms out differently can do so without changing data.

### IW-1-ADR-005 — Camera authority is enforced by token, not by convention

The authority mints a per-frame write token; `commit(token, pose)` validates it
and throws otherwise. During a transition the authority itself owns the camera
and neither controller writes.

*Why:* IW-DEC-026 is the lesson of Casebook V4. A rule that is only written down
gets violated during the fourth feature. This one fails loudly in the frame where
the mistake is made.

*Consequence:* the two legitimate return behaviours of `CONSTITUTION.md` §14
became an explicit parameter: `PRESERVE_OWN` (leaving Focus returns the visitor
exactly where they stood) versus `ADOPT_INCOMING` (a directed sequence
deliberately leaves them somewhere new).

### IW-1-ADR-006 — Space presence is a graph decision, not a render decision

The lifecycle tells the Scene Kit whether each loaded Space is `ACTIVE`,
`ADJACENT` or `HIDDEN`. A Space one **CONTINUOUS** portal away is ADJACENT and
visible through the doorway; a Space reachable only by **TELEPORT** is not.

*Why:* it is the cleanest demonstration that `transitionBehaviour` is semantic.
The same doorway geometry behaves differently because the Portal record says so.

### IW-1-ADR-007 — All content is generated at runtime from a deterministic seed

Every artwork plate, wall texture, label, the video and the ambience are
synthesised in the browser. There is no image, model or audio file in the module.

*Why:* it satisfies IW-DEC-006 (controlled/fictitious content) and removes asset
rights from the milestone entirely. It also makes captures byte-stable, which is
what deterministic visual comparison needs.

*Honest limitation:* these are **placeholder plates at blockout fidelity**,
art-directed to read as a plausible modernist collection. They are not a claim of
final visual quality, and they are the first thing that should be replaced by
authored or licensed assets.

### IW-1-ADR-008 — Proximity observes the visitor position; it does not read the camera

`ProximitySystem.update(dt, position)` takes the position as an argument. The
runtime passes the current camera position. Reading is one-directional and
explicit; nothing in the interaction layer can write the camera.

### IW-1-ADR-009 — Collision is bounds clamping plus authored blockers (partially resolves IW-OPEN-003)

Enough that a visitor cannot walk through a gallery wall or a plinth. No physics
engine, no navmesh. The blockout did not need more; when it does, the decision is
still open and the navigation controller is the only file affected.

---

## 5. Evidence

`node labs/immersive-worlds/qa/run-qa.mjs` boots a real browser, drives the
prototype and writes `qa/evidence/report.json` plus captures of every named
state. It requires `playwright` to be resolvable; it needs no test framework.

Named states (`?state=` on the URL, or `window.__IW.applyState(name)`):

```text
museum:lobby-entry              museum:portal-a-b-before
museum:lobby-welcome            museum:portal-a-b-after
museum:gallery-a-overview       museum:archive-teleport
museum:artwork-horizonte-focus  museum:guided-step-04
museum:sculpture-detail         museum:guided-completed
```

Console surface for review: `window.__IW.report()` (full runtime report),
`window.__IW.assertInvariants()` (the architectural claims, executable),
`window.__IW.applyState(name)`, `window.__IW.dispatch(action)`.

Performance figures in the evidence bundle were measured under **SwiftShader
software rendering**, with no GPU. They are useful as relative signal — draw
calls, triangles, working set, warm timings — and must not be read as device
performance. `CONSTITUTION.md` §20 requires numeric pass/fail budgets to be set
from representative-device measurement before visual scale-up; that measurement
has not been made, so no budgets are claimed.

---

## 6. Known problems and honest limitations

1. **Visual quality is at BLOCKOUT/MATERIAL fidelity, not final.** Following the
   img2threejs pass order (IW-REF-008), this milestone completed
   SPEC → BLOCKOUT → STRUCTURE → FORM → MATERIAL → LIGHTING → INTERACTION at a
   first pass. The Gauntlet comparison against a named bar (TheVertMenthe,
   Cartier) has **not** been run, and no claim of premium quality is made.
2. **No Unslop adversarial review by an independent critic.** The §24 reject list
   was applied by the builder while building, which IW-0 explicitly says is not
   sufficient. Rejections applied: no floating cards, no glassmorphism, no
   cyan/purple gradients, no neon, no particles, no primitives as final assets,
   no uniform lighting, no repeated pedestal grid, no fake HUD. Independent
   verification is still owed.
3. **Narration is captions plus optional browser speech synthesis.** There is no
   recorded voice track. Captions and transcripts are the accessible source of
   truth, not a fallback.
4. **Audio requires a user gesture** (browser autoplay policy). Sound is off
   until the visitor enables it; QA runs with audio off.
5. **Shadow quality is modest.** `PCFSoftShadowMap` is deprecated in r185, so
   `PCFShadowMap` is in use with a small number of casters bounded by the tier.
6. **Accessibility has not been reviewed by an independent pass.** The content
   outline, keyboard paths, reduced-motion handling and focus states exist; a
   real audit does not.
7. **The `?state=` QA hook is present in the shipped page.** It is inert without
   the parameter, but if this ever becomes public it should move behind a build
   flag.
8. **`qa/run-qa.mjs` requires `playwright` to be resolvable** and is not wired
   into any GitHub Actions workflow — wiring CI would touch shared repository
   configuration, which needs authorisation.

---

## 7. Protected baselines

No file outside `labs/immersive-worlds/` and `docs/architecture/` was created,
modified or deleted. Boards, Casebook V1–V4, Effects, Scroll Sections, Website
Modules, Blueprints, Source Labs, `index.html`, the shared `js/` registry and the
API app are untouched. Immersive Worlds does **not** appear in any navigation or
registry, by design (IW-DEC-008).

---

## 8. Proposed next milestone

**IW-2 — Quality gate on the Museum Scene Kit**, before any new capability.

1. Run the Gauntlet Loop for real: a fresh critic, direct comparison against
   TheVertMenthe for exploration and Cartier for scenography, iterate on what
   loses.
2. Run Unslop as an independent pass on the captured states.
3. Measure on a representative phone and a mid-range laptop, then set the numeric
   budgets `CONSTITUTION.md` §20 requires — before the scene grows.
4. Second lighting/material pass driven by those comparisons.

Deliberately **not** next: more Scene Kits, richer authoring, a timeline editor,
avatars, navigation integration. The engine's shape should be confirmed against a
real quality bar before anything is built on top of it.

---

## 9. What this milestone does not authorise

No merge to `master`. No navigation or registry integration. No modification of
any protected baseline. No claim that the visual result is approved. The next
step is Juanma's visual review.
