# Immersive Worlds — Reference reuse register & licence audit

> **Status:** EVIDENCE. Produced during IW-2 by inspecting the actual repositories,
> not their READMEs.
> **Required by:** `REFERENCE_REUSE_ACCELERATION_POLICY.md` §7 and IW-DEC-016.
> **Date:** 2026-08-09

The policy says: *reuse boldly when legal.* Acting on that means first
establishing what "legal" is for each source. This is that audit, plus what was
actually taken.

---

## 1. Licence audit — Museum / Institutional references

Each repository was cloned at the SHA below and its licence file read directly.

| Repository | SHA | Licence | Copyright | Direct reuse in a commercial product? |
|---|---|---|---|---|
| `Juanmaes83/artwork-3D-museum` | `8dff71e` | **CC BY-NC 4.0** | © 2025 **TomPast** | ❌ **No** — NonCommercial |
| `Juanmaes83/3D-art-gallery-threejs` | `8be5add` | **CC BY-NC-SA 4.0** | © **Emilian Kasemi** | ❌ **No** — NonCommercial *and* ShareAlike |
| `Juanmaes83/3DArtMuseum` | `7ea04e3` | **GPL-3.0** | third party | ❌ **No** — strong copyleft |
| `Juanmaes83/portfolio-itom-and-advanced-WebGL` | `298c4fd` | **MIT** | © 2026 **Tomasz Szmajda** | ✅ **Yes**, with attribution |

### What this means, plainly

The three repositories the Reference Ledger names as *primary* for the Museum
vertical — camera focus, gallery construction, data-driven placement — **cannot
have their code copied or adapted into Escaparates Pro**, which is a commercial
product with billing, plans and paying customers.

- NonCommercial licences forbid the use outright.
- ShareAlike would additionally force our derived work under the same licence.
- GPL-3.0 would force Escaparates Pro itself to be GPL.

They are also **forks**: the copyright holders are TomPast, Emilian Kasemi and a
third party, not Juanma. `REFERENCE_REUSE_ACCELERATION_POLICY.md` §10 names this
exact trap — *"we own a fork, therefore everything is ours"* — and rejects it.

So for these three, `PATTERN / KNOWLEDGE ONLY` (§3.4) is not timidity. It is the
only lawful mode, and the Reference Ledger's existing `PATTERNS ONLY` default
turns out to have been right for a reason nobody had verified until now.

**This does not reduce their value.** Reading `artwork-3D-museum`'s camera code
and `3D-art-gallery-threejs`'s construction order is legitimate and useful; what
cannot happen is copying the files.

### Recommendation for the Reference Ledger

`REFERENCE_LEDGER.md` currently marks these `LICENSE CHECK REQUIRED BEFORE REUSE`.
That check is now done. The entries should be promoted to
**`BLOCKED — INCOMPATIBLE LICENCE (patterns only)`** so no future agent spends
time re-investigating, and so nobody adapts them by accident.

---

## 2. What was actually reused — `portfolio-itom-and-advanced-WebGL` (MIT)

The one repository that is legally reusable turned out to also be the one that
found a **real bug** in our code. This is the doctrine working as intended.

| Field | Value |
|---|---|
| Source | `https://github.com/Juanmaes83/portfolio-itom-and-advanced-WebGL` |
| SHA | `298c4fd4fa5127bdd551ea852fc8397d3792b3cd` |
| Licence | MIT — © 2026 Tomasz Szmajda |
| Files studied | `src/components/canvas/corridor/RoomWarmup.jsx`, `src/context/PerformanceContext.jsx` |
| Mode | **ADAPT / PORT** of mechanisms (§3.2). No source line was copied — the target is plain ES modules with no React, so a copy would not have compiled. |
| Target | `scene-kits/museum/museum-scene-kit.js` (`warmSpace`), `engine/core/device-tier.js` |
| Attribution | Named in the code comment at the adaptation site and here. |

### Mechanism 1 — warmup must compile *visible* geometry (**bug found**)

`RoomWarmup.jsx` mounts its rooms off-screen and lets them render for a few
frames *before* calling `gl.compileAsync`. That detail exposed our defect:

> IW-1 built each Space with `group.visible = false` and then called
> `renderer.compileAsync(scene, camera)`. Three.js compiles what
> `traverseVisible` reaches — **so our warmup was compiling nothing.** The whole
> shader cost still landed on the first frame the visitor saw, which is precisely
> the stutter the WARMING state exists to remove.

QA had not caught it because it only asserted that warm time was greater than
zero. The fix makes the group visible for the compile and hides it again
immediately, and `WARMUP-COMPILES` now asserts a real program count.

### Mechanism 2 — skip warmup on LOW

Their `isLowTier` path bypasses `compileAsync` entirely to avoid WebGL context
loss on weak devices. Adopted as `warmupSpaces: false` in the LOW policy.

### Mechanism 3 — shadows off on mobile regardless of tier

Their MEDIUM profile disables shadows because the binding constraint on a phone
is fill rate, not tier. Adopted via `policyForTier(tier, { mobile })`.

### Mechanism 4 — render below native resolution on LOW

Their LOW tier uses a DPR range of `[0.8, 1]` — deliberately sub-native. Adopted
as `dprCap: 0.85` on LOW.

---

## 3. Vendored dependencies

| Package | Version | Licence | Record |
|---|---|---|---|
| `three` | 0.185.1 | MIT | `labs/immersive-worlds/vendor/three/VENDOR.md` |

No other third-party code is present in the module.

---

## 4. Assets

Every image, video and texture in `labs/immersive-worlds/assets/` is generated by
this module's own code from a fixed seed. There is no third-party asset of any
kind. See `labs/immersive-worlds/assets/collection/RIGHTS.md`.

Asset rights were assessed **separately** from code licences, as
`REFERENCE_REUSE_ACCELERATION_POLICY.md` §6 requires. Since nothing was taken
from anywhere, the question resolves trivially — which is the point of generating
rather than sourcing at this stage.

---

## 5. Still unexamined

These were not audited in IW-2 because no subsystem in this milestone needed
them. They should be audited before they are relied on, not before they are read:

`Claude-of-Duty` · `threejs-game-skills` · `kage` · `a-long-expected-party` ·
`gsap-threejs-codrops` · `webGLImageTransitions` · `vortex-gallery` ·
`camera-3D-showroom` · `threejs-procedural-dungeon` · `-threejs-evidence-graph` ·
`threejs-journey` · `unslop` · `gauntlet-loop`

The likely next candidates are `gauntlet-loop` and `unslop`, whose value is
methodology and tooling rather than runtime code, and `Claude-of-Duty` for its
capture and image-diff harness — where a permissive licence would let us replace
our hand-rolled QA runner with something more mature.
