# Museum — Owned Capability Source: Infinite Worlds V1.2.3

> **Status:** CANONICAL PRODUCT MEMORY — FIRST-PARTY OWNED SOURCE
>
> **Target:** Escaparates Pro → Immersive Worlds → Museum / Institutional
>
> **Source project:** Infinite Worlds V1.2.3 — Visual Closure
>
> **Purpose:** tell implementation agents exactly what proven first-party capabilities already exist, where to inspect the complete source, what Museum may reuse directly, and what product boundaries remain distinct.

---

## 1. Product relationship

Infinite Worlds and Museum are **different products**.

Infinite Worlds V1.2.3 is an existing first-party project built around two authored worlds connected by a live spatial portal, with its own City/Nature identity, Brand Expression system and authoring panel.

Museum / Institutional is a separate product with different content, semantics, art direction, experience goals and room structure.

The relationship is therefore:

```text
SOURCE PROJECT ≠ TARGET PRODUCT

INFINITE WORLDS V1.2.3
→ extract / copy / adapt proven capabilities
→ MUSEUM / INSTITUTIONAL
```

Museum is **not** a continuation of Infinite Worlds and should not inherit its City/Nature identity.

Reuse the capability, not the original product concept.

---

## 2. Ownership and reuse authority

Infinite Worlds V1.2.3 is treated here as **FIRST-PARTY OWNED IMPLEMENTATION**.

This is not a `PATTERNS ONLY` source and is not an external reference.

For Museum work, Claude/Fable may directly inspect and reuse the source implementation, including copying, extracting, porting, adapting, splitting, composing or refactoring code when useful.

No clean-room reimplementation is required.

Operational rule:

> **DO NOT REIMPLEMENT A PROVEN CAPABILITY BEFORE INSPECTING THE FIRST-PARTY SOURCE.**

Museum product goals remain authoritative over the source project's original identity.

---

## 3. Exact canonical source baseline

Repository:

```text
Juanmaes83/escaparates-pro
```

Source branch:

```text
feat/infinite-worlds-v1-2-2-visual-closure
```

Approved source baseline:

```text
Infinite Worlds V1.2.3 — Visual Closure
```

Canonical commit:

```text
453ed40008f838d6187a7e85d93872f7866ad5cb
```

Source project path:

```text
labs/infinite-worlds-brand-expression-v1-2/
```

Important source files include:

```text
index.html
app.js
enhancements.js
brand-expression-v1-2.js
brand-expression-production-v1-2-1.js
art-direction-first-cross-v1-2-2.js
visual-closure-v1-2-3.js
README.md
PRODUCTION_PASS_V1_2_1.md
ART_DIRECTION_V1_2_2.md
```

Claude/Fable should inspect the complete snapshot rather than relying on this summary when adapting a capability.

---

## 4. Proven capability map

### A. Live two-world portal / spatial crossing

The source already proves:

- `App → World → Portal` architecture;
- live destination rendering through `WebGLRenderTarget`;
- perspective mapping with `CameraUtils.frameCorners(...)`;
- camera synchronisation between current and destination views;
- raycast portal activation;
- GSAP crossing choreography;
- world swap / handoff;
- bidirectional / recursive traversal;
- portal shader / appearance layer;
- environmental and spatial audio integration.

Protected source mechanisms include:

```text
moveCameraToPortal()
moveWorldToEnd()
switchWorlds()
moveWorldAndCameraToOrigin()
CameraUtils.frameCorners()
camera sync
WebGLRenderTarget portal architecture
recursive traversal
```

Museum target use:

```text
ROOM A
→ THRESHOLD
→ LIVE DESTINATION ROOM VIEW
→ TRANSITION
→ CROSSING
→ ROOM B ACTIVE
```

This capability is the primary owned implementation source for the future Museum **Space → Space / World Transition** block.

---

### B. First-cross warmup / readiness

The source already solved the problem where the first traversal can be less ready than later traversals.

Its preflight sequence includes:

```text
renderer ready
→ update world/camera matrices
→ ensure active VideoTextures are playing
→ compile City and Nature materials where supported
→ render both scenes offscreen
→ prime both portal render targets
→ wait additional frames
→ EXPERIENCE READY
```

Museum should inspect and adapt this before inventing a new room-transition warmup.

This maps naturally onto the Immersive Worlds lifecycle:

```text
PRELOADING
→ WARMING
→ READY
→ ACTIVE
```

---

### C. Media authoring pipeline

Infinite Worlds already proves a usable first-party authoring flow for:

```text
IMAGE
VIDEO
LOGO
TEXT
```

The project contains real loading, state and application behaviour rather than a visual mockup.

The existing UX/state model includes concepts such as:

```text
EMPTY
→ LOADED
→ SAVED
→ APPLIED
or ERROR
```

plus:

```text
SAVE
APPLY EXPERIENCE
START EXPERIENCE
EDIT EXPERIENCE
```

Museum may reuse or adapt any useful part of this pipeline.

Do **not** assume the City/Nature UI or schema is the final Museum authoring model.

Museum target use includes:

```text
IMAGE
→ artwork / institutional graphic / panel

VIDEO
→ video artwork / projection / time-based media

LOGO
→ institution / exhibition identity

TEXT
→ ficha / curatorial text / room title / interpretation panel
```

---

### D. Video readiness contract

The source does not treat file selection as successful video application.

The proven readiness path requires, in substance:

```text
object URL
→ loadedmetadata
→ loadeddata / decoded-frame readiness
→ muted play succeeds
→ first frame observed when supported
→ VideoTexture attached
→ READY / APPLIED
```

Museum should preserve this behavioural principle for video artworks, projections and other time-based media.

A black or not-yet-decoded video must not be reported as ready.

---

### E. Adaptive support / aspect handling

The source already establishes that uploaded media should determine visible support proportions rather than being stretched into arbitrary rectangles.

Proven principles include:

- source aspect ratio is respected;
- video fits inside an authored hero envelope;
- campaign image preserves its intended proportions;
- logo support contracts around the actual fitted identity;
- text remains spatial typography rather than becoming a generic media card.

Museum target use:

```text
SOURCE MEDIA
→ SOURCE ASPECT / DIMENSIONS
→ SUPPORT FIT
→ FRAME / DISPLAY / PROJECTION / PANEL
```

This is directly relevant to artworks, video artworks, institutional signage, room titles, projection and future flexible media.

---

### F. Same content, different spatial expression

Infinite Worlds proves another product-level idea:

```text
SAME SOURCE CONTENT
+
DIFFERENT WORLD / EXPERIENCE EXPRESSION
```

The same brand assets can appear differently in City and Nature while remaining the same semantic source content.

Museum can reuse this concept later for **Experience Languages**:

```text
SAME COLLECTION / CONTENT
+
WHITE CUBE / HERITAGE / EDITORIAL / DARK EXHIBITION / CUSTOM BRAND DNA
→ DIFFERENT SPATIAL EXPRESSION
```

This is a product principle, not permission to transplant City/Nature art direction.

---

### G. Spatial audio / leakage / transition atmosphere

Infinite Worlds also contains first-party spatial/environmental audio behaviour associated with worlds and portal presence.

Museum may inspect and adapt this later for:

- room soundscape;
- threshold sound;
- destination leakage / anticipation;
- transition atmosphere;
- authored listening zones.

This is secondary to the current transition/camera work but should not be forgotten.

---

## 5. Museum-specific transition adaptation target

The first Museum use should reduce uncertainty by preserving the proven crossing mechanism and adapting Museum entry/exit geometry around it.

Conceptual target:

```text
GALERÍA A GUIDED ROUTE
→ FINAL AUTHORED POSITION
→ MUSEUM TRANSITION ANCHOR A
→ align / transform into proven crossing entry space
→ LIVE CROSSING
→ proven crossing destination space
→ MUSEUM TRANSITION ANCHOR B
→ GALERÍA B ENTRY
→ normal Museum authority resumes
```

This does **not** require the final system to expose Infinite Worlds' original coordinates.

It means the first adaptation should favour a stable spatial adapter / anchor mapping over rewriting a proven transition engine around arbitrary Museum geometry.

Generalisation can follow after one successful canonical room-to-room transition.

---

## 6. Camera authority reconciliation

Museum maintains the invariant:

```text
ONE AUTHORITATIVE VISITOR CAMERA / CONTROLLER PER FRAME
```

During normal experience, the Museum visitor camera is authoritative.

During a room transition:

```text
TRANSITION
```

owns the choreography.

A temporary destination camera may render the next room into a portal / render target as an **optical instrument**. It is not a competing visitor-navigation authority.

After the handoff, normal destination-room visitor authority resumes.

This permits reuse of Infinite Worlds' two-camera live portal technique without creating two independent visitor controllers.

---

## 7. What Museum may reuse directly

Claude/Fable may inspect and reuse, where useful:

- portal render-target architecture;
- `CameraUtils.frameCorners(...)` usage;
- source/destination camera synchronisation;
- crossing choreography;
- world / room handoff mechanisms;
- first-cross warmup;
- portal shader / appearance logic;
- media loading pipelines;
- image texture handling;
- video texture handling and readiness;
- logo handling;
- CanvasTexture / text pipeline;
- adaptive media fitting;
- authoring state concepts;
- spatial audio mechanisms;
- any other first-party implementation detail discovered in the canonical snapshot that materially improves Museum.

The implementation agent is not required to preserve file boundaries or source-project architecture when a cleaner Museum adaptation is stronger.

---

## 8. What should not be transplanted by default

Do not treat the following as Museum requirements:

- `THE GREY CITY` identity;
- `THE LIVING VALLEY` identity;
- city cars / road / smog;
- nature trees / flowers / procedural landscape;
- brand-campaign narrative;
- City/Nature placement coordinates;
- City/Nature visual art direction;
- original brand-role labels;
- any source-specific geometry that does not solve a Museum requirement.

Preserve Infinite Worlds itself as a complete first-party project.

Museum borrows capabilities from it; Museum does not replace it.

---

## 9. Block sequencing for Museum

Current sequence:

```text
BLOCK 1 — GALERÍA A CANONICAL ROOM
→ close and freeze approved endpoints

BLOCK 2A — INTRA-ROOM TRANSITION LANGUAGE
→ MICRO REFRAMING
→ LOCAL WALK
→ GALLERY TRAVERSE
→ OBJECT ORBIT
→ THRESHOLD APPROACH

BLOCK 2B — ROOM-TO-ROOM / WORLD TRANSITION
→ inspect and adapt Infinite Worlds V1.2.3 owned capabilities

LATER AUTHORING WORK
→ inspect and adapt Infinite Worlds media / authoring capabilities
```

Do not mix Block 2A with the spectacular room-to-room portal implementation before the intra-room transition language is proven.

---

## 10. Block 2A endpoint contract

The approved Museum beat framing is now protected.

From this point forward:

> **Transitions may change how the camera travels, but never where the approved beat ends.**

Required invariants:

### Endpoint lock

Final camera:

```text
position
+ target
+ FOV
```

must resolve exactly to the approved destination beat.

A changed settled capture means transition work has invaded framing.

### Path containment

The full trajectory must remain in valid navigable / view space.

Checking only the destination point is insufficient.

### No target flip / no corner cutting

Camera orientation should anticipate the destination coherently rather than sweeping arbitrarily across the room.

When a straight segment intersects architecture, plinths, balaustrades or other protected geometry, use an appropriate safe path / authored waypoint strategy rather than clipping through it.

### Existing behaviours to preserve

- one camera authority per frame;
- LEAD camera/guide arrival synchronisation;
- explicit cut as a separate verb where intentionally used;
- Collection Browse and exact return-to-origin semantics;
- reduced-motion support, but without defaulting spatial continuity to teleport when a calmer movement is possible.

---

## 11. Block 2A recommended acceptance slice

Before scaling the transition language to the whole room, validate at least three representative cases:

```text
1. MICRO REFRAMING
   → one simple same-subject beat transition

2. GALLERY TRAVERSE
   → Campo de ceniza → Horizonte

3. GALLERY TRAVERSE
   → Estudio de figura → Vasija de arenas
```

The two traverses are deliberately difficult because the existing straight-line system cuts geometry in these cases.

Success means the path improves while the destination endpoint remains exactly unchanged.

---

## 12. QA / evidence requirements for capability reuse

For Block 2A and future Block 2B:

- deterministic settled endpoints;
- endpoint delta against approved baseline;
- sampled path containment, not only endpoint containment;
- no roll;
- no target discontinuity / flip above the accepted threshold;
- guide/camera LEAD synchronisation preserved;
- Collection Browse unaffected;
- before/after transition evidence;
- sequence/storyboard review for perceptual motion;
- navigable preview;
- browser/console QA;
- explicit human review by Juanma + ChatGPT before advancing.

For Block 2B specifically, also verify:

- first crossing quality vs later crossings;
- destination visibility through the threshold / portal;
- camera handoff authority;
- destination world/room readiness;
- media continuity where present;
- repeated bidirectional traversal when the product requires it.

---

## 13. Implementation-agent operating rule

Before implementing Museum room-to-room World Transition or Museum media-authoring capability:

```text
READ THIS DOCUMENT
→ INSPECT EXACT INFINITE WORLDS V1.2.3 SOURCE SNAPSHOT
→ IDENTIFY THE PROVEN OWNED MECHANISM
→ MAP IT TO THE MUSEUM PRODUCT REQUIREMENT
→ REUSE / COPY / EXTRACT / ADAPT AS APPROPRIATE
→ PRESERVE MUSEUM APPROVED CONTRACTS
→ TEST
→ LOOK
→ COMPARE
→ STOP FOR HUMAN REVIEW
```

Do not treat Infinite Worlds as inspiration-only.

Do not recreate a weaker approximation merely to keep Museum code stylistically separate.

Use the strongest first-party mechanism we already own when it serves the Museum target.

---

## 14. Final principle

```text
OUR PROJECT A
→ PROVEN CAPABILITY
→ OUR PROJECT B
```

Infinite Worlds remains its own complete first-party product.

Museum remains its own distinct product.

The value is that the second product does not need to rediscover capabilities the first one has already solved.