# Museum / Institutional — Current State

> **Status:** CANONICAL CURRENT WORKING STATE
>
> **Updated:** 2026-08-12
>
> **Scope:** Escaparates Pro → Immersive Worlds → Museum / Institutional
>
> **Purpose:** provide one concise, authoritative entry point for the current Museum state so implementation agents do not depend on stale chat context or documentation stranded on parallel branches.

---

# 1. Authority

Read this document together with the repository-wide Safe Autonomous Engineering governance and the Immersive Worlds architecture index.

Authority order remains:

```text
1. JUANMA — explicit current decision
2. APPROVED / CANONICAL GITHUB PRODUCT MEMORY
3. VERIFIED CURRENT BRANCH + CODE
4. WORKING / PROPOSED DOCUMENTS
5. CHAT / AGENT HYPOTHESES
```

If this current-state file becomes stale, update it as part of the next approved human gate before starting a materially different block.

---

# 2. Current branch and integrated product memory

Current Museum working branch:

```text
claude/immersive-worlds-module-c0d3f7
```

The following previously parallel documentation is now integrated into this working branch and must no longer require agents to inspect a side branch merely to understand the current mandate:

- `MUSEUM_CAPABILITY_SOURCE_INFINITE_WORLDS.md`;
- `MUSEUM_PRODUCT_ROADMAP_BLOCKS.md`;
- Museum premium personalization / authoring product vision;
- Museum premium authoring implementation brief;
- the two approved authoring visual references.

The goal is one coherent GitHub memory, not permanent dependence on detached PR context.

---

# 3. Completed and approved state

## Block 1 — Main Gallery / Galería A

Status:

```text
COMPLETE
CANONICAL ROOM BASELINE
```

Approved frozen baseline:

```text
a0ada1212477c9b134aac577d2dbac40a916be7e
```

Protected outcomes include:

- canonical Galería A composition;
- approved Guided sequence and endpoints;
- Artwork Grammar;
- Sculpture Grammar;
- Focus;
- Collection Browse;
- exact return semantics;
- one authoritative camera contract;
- deterministic state coverage.

---

# 4. Block 2A — Intra-room Transition Language

Status:

```text
TECHNICALLY COMPLETE
HUMAN REVIEW = KEEP
```

Juanma reviewed the final preview and approved Block 2A for forward progress. Two minor visual improvements are backlog items and do **not** block Block 2B.

Final implementation / closure state before later documentation merges:

```text
HEAD: 7211e3feca28aec158b58bdbbd5dcf43ed9bc0e5
```

Canonical transition families:

```text
T1 — MICRO REFRAMING
T2 — LOCAL WALK
T3 — GALLERY TRAVERSE
T4 — OBJECT ORBIT
T5 — THRESHOLD APPROACH
```

Measured closure:

- 30 measured transitions;
- 0 transition failures;
- exact endpoint lock, floating-point worst case approximately `4.4e-16`;
- 0 sampled room exits;
- final corrected route maximum turn: `3.10°/frame`;
- all five families represented;
- reduced motion moves through space rather than defaulting to a hard teleport;
- 68 QA contracts covered with 0 failures using preserved valid evidence plus resumed tail execution.

Important correction:

```text
3.10°/frame
```

is the final canonical maximum-turn figure for the completed Block 2A route. Earlier `2.3°/frame` reporting was an aggregation mistake and is superseded.

Block 2A documentation:

- `BLOCK_2A_TRANSITION_LANGUAGE.md`;
- transition filmstrips and review evidence in the Museum QA evidence structure.

The two room-to-room portal beats remained deliberate cuts and were explicitly outside Block 2A.

---

# 5. Current authorized block — Block 2B

Status:

```text
CURRENT AUTHORIZED IMPLEMENTATION BLOCK
```

Mandate identity:

```text
MUSEUM-BLOCK-2B-WORLD-TRANSITION
```

Objective:

```text
GALERÍA A / SALA 1
→ T5 THRESHOLD APPROACH
→ TRANSITION ANCHOR A
→ LIVE DESTINATION PRESENCE
→ PROVEN FIRST-PARTY CROSSING
→ ROOM / WORLD HANDOFF
→ TRANSITION ANCHOR B
→ GALERÍA B / SALA 2
→ NORMAL MUSEUM AUTHORITY RESUMES
```

The room-to-room transition should target:

```text
SPECTACULAR
+
COHERENT
+
CONTROLLED
```

A simple fade/teleport is not the intended primary solution when the proven first-party crossing engine can be reused.

## 5b. Block 2B implementation status

```text
IMPLEMENTATION COMPLETE
AWAITING HUMAN GATE (KEEP / ADJUST / REJECT)
```

Written by the implementing agent at the point of handing off to the gate, per §14. It records what was built and what is open. **It does not record approval, which only Juanma gives.**

Implementation record:

```text
docs/architecture/immersive-worlds/BLOCK_2B_ROOM_CROSSING.md
```

Canonical family added:

```text
T6 — ROOM CROSSING
```

Evidence:

```text
labs/immersive-worlds/qa/evidence-crossing/crossing-review.html
labs/immersive-worlds/qa/evidence-crossing/crossing.json
```

Measured closure:

- 19/19 crossing checks; one camera authority throughout, 0 violations;
- 21/21 curve properties proved without a browser;
- 7/7 abandoned-crossing hold/leak checks;
- handoff `0.022 m` from the wall plane, mid-flight at frame 192 of 281;
- endpoint lock and join to the next beat both exactly `0.0`;
- 0 path frames outside the aperture;
- reduced motion `1100 ms` over the same `5.28 m` path, not a teleport;
- **68 QA contracts covered, 0 failures**, across three resumed runs whose union is exact and was computed against the runner's declared check ids rather than by summing green summaries.

The QA resume gate is now `boot | tour | grammar | detail`. It was split twice during this block because three runs that each reported clean still left nine contracts uncovered between stage boundaries.

First-party inspection outcome — the source was read in full before any code, and §6's authorisation was **partially declined on evidence**: the `WebGLRenderTarget` / `frameCorners` / synced-camera machinery exists to see one scene from another at the same coordinates, and Museum's rooms genuinely share a wall with a real opening in it. Reused instead: crossing choreography, warmup/readiness discipline, and plane-accurate room handoff. Recorded as `IW-DEC-030`.

## 5c. Block 2B final product closure pass

```text
TECHNICALLY_CLOSED
FINAL VISUAL REVIEW AVAILABLE
PRODUCT_APPROVAL_PENDING
```

Review surface: `labs/immersive-worlds/qa/evidence-closure/block-2b-closure.html`.

Guided seek / state reconstruction — reconstruction now reaches early / mid / late stops in `1656 / 3227 / 19740 ms` against `5906 / 38319 / 124607 ms`, with **zero differences across 23 compared state fields at every stop**, re-measured after the change. Two product defects were the cause and are fixed: seek latency was coupled to frame time through a macrotask yield that queues behind rendering, and a reconstruction was flying full crossing choreography at every portal beat for nobody. The `~100 s` figure that motivated the mission was a software-rasteriser artefact rather than a product cost; the residual `19.7 s` is genuine room building.

Guide threshold composition — corrected without moving any approved camera endpoint. For a LEAD toward a Space the camera is derived *from* the guide anchor, so the standing recommendation to move that anchor would have dragged the endpoint with it. The fix is `aside: true`, the authored grammar every cesión beat already uses: two lines of world data, no code. Crossing clearance `0 m → 0.92 m`; the guide no longer blocks the centre of the opening; camera identical before and after.

Lobby → Galería A — **decided: keep the crossing family.** Same semantics as the gallery crossing, and no inappropriate spectacle is introduced, which is measurable rather than a matter of taste: lobby and Galería A share the white-cube profile so the atmosphere blend is provably inert (`0.95 → 0.95`, worst step `0`).

```text
T6 APPLIES TO ANY PORTAL BEAT WHOSE PORTAL IS CONTINUOUS
TELEPORT PORTALS REMAIN CUTS
```

`representationHint` (DOOR 1.5 m vs OPENING 2.6 m) remains available as a future profiling axis; nothing measured so far demands a split.

Infinite Worlds comparison — **partial.** The owned V1.2.3 snapshot was made to run locally with the exact dependency versions it pins, because `esm.sh` is blocked here. It shows how the reference presents a destination before you reach it: the other world rendered live into a framed portal surface with a distortion and edge treatment. It does **not** show the completed world swap, and the portal's noise texture is a local stand-in. Recorded so the comparison is not read as more complete than it is.

Portal treatment — Variant A (architectural only) built and measured; Variants B and C **not built**. Recommendation is A, stated as a recommendation.

---

Open for the human gate:

- two guide-composition defects at the threshold, reported and deliberately not fixed because both would move a frozen Room 1 endpoint;
- whether the source's portal appearance shader belongs on an institutional doorway (recommended against);
- the lobby → Galería A entry became a crossing as a consequence of T6 following beat intent — correct grammar, outside the authorised slice, not yet visually reviewed.

---

# 6. Mandatory first-party source for Block 2B

Block 2B is **not an unsolved portal problem**.

Canonical source document:

```text
docs/architecture/immersive-worlds/MUSEUM_CAPABILITY_SOURCE_INFINITE_WORLDS.md
```

First-party owned source:

```text
Infinite Worlds V1.2.3 — Visual Closure
branch: feat/infinite-worlds-v1-2-2-visual-closure
commit: 453ed40008f838d6187a7e85d93872f7866ad5cb
path: labs/infinite-worlds-brand-expression-v1-2/
```

Operational rule:

```text
DO NOT REIMPLEMENT A PROVEN CAPABILITY
BEFORE INSPECTING THE FIRST-PARTY SOURCE.
```

Authorized direct reuse/adaptation includes, where useful:

- `WebGLRenderTarget` live destination rendering;
- `CameraUtils.frameCorners(...)`;
- source/destination camera synchronisation;
- crossing choreography;
- GSAP mechanisms where appropriate;
- room/world handoff;
- first-cross warmup and render-target priming;
- portal appearance/shader mechanisms;
- readiness logic;
- spatial/environmental audio mechanisms.

Do not transplant City/Nature identity, coordinates or product-specific art direction by default.

```text
SOURCE PROJECT ≠ TARGET PRODUCT
```

---

# 7. Block 2B camera / transition authority

Protected invariant:

```text
ONE AUTHORITATIVE VISITOR CAMERA / CONTROLLER PER FRAME
```

Normal Museum runtime:

```text
Museum visitor camera/controller owns authority.
```

During crossing:

```text
TRANSITION owns choreography.
```

A destination camera may temporarily exist as an optical instrument for live destination rendering. It is not an independent visitor-navigation authority.

After handoff:

```text
normal destination-room Museum authority resumes.
```

Prefer a stable anchor/spatial-adapter integration for the first canonical Museum crossing before generalising the source engine around arbitrary Museum geometry.

---

# 8. Block 2B visual acceptance

Block 2B must be reviewed as movement, not only endpoints.

Required review evidence must make the following visible:

```text
SALA 1
→ THRESHOLD
→ DESTINATION VISIBLE
→ CROSSING ACTIVE
→ MID-CROSSING
→ HANDOFF
→ SALA 2 ARRIVAL
→ CONTINUATION
```

Use appropriate evidence such as:

- navigable preview;
- short review recording when practical;
- filmstrip/contact sheet;
- deterministic captures;
- first-cross vs later-cross comparison.

Human gate:

```text
JUANMA + CHATGPT
→ KEEP / ADJUST / REJECT
```

Technical success alone does not authorize Block 3.

---

# 9. Block 2B QA direction

Validate according to change impact, preserving valid Block 2A evidence.

Block 2B should cover, at minimum where applicable:

- source endpoint preserved;
- destination entry correct;
- crossing/path containment;
- camera-authority handoff;
- destination readiness;
- first crossing vs later crossings;
- room/world state handoff;
- Guided continuity;
- Explore continuity where applicable;
- reduced motion;
- browser/runtime errors;
- relevant media continuity;
- Block 2A dependencies actually touched by 2B.

Do not automatically restart all 68 Block 2A checks from zero.

```text
PRESERVE VERIFIED EVIDENCE
→ MAP CHANGE IMPACT
→ TARGETED VALIDATION
→ DEPENDENCY-AWARE REGRESSION
→ APPROPRIATE CLOSURE QA
```

---

# 10. Safe Autonomous Engineering status

Repository-wide Safe Autonomous Engineering governs HOW this work is executed.

Required principles include:

- checkpoint ≠ human gate;
- continue through authorized internal checkpoints;
- preserve verified evidence;
- failure invalidates only evidence it can reasonably affect;
- validation scope follows impact scope;
- liveness before stall;
- RUN_ID + provenance;
- do not mutate active measurements;
- cheap validation before expensive closure QA;
- visual truth is mandatory;
- technical closure ≠ product approval;
- no merge/promotion without explicit Juanma authority.

The successful Block 2A tail-resume mechanism is a concrete precedent: valid partial QA should be mechanically resumable instead of being discarded under pressure.

---

# 11. Parallel premium authoring / personalization track

The premium Museum authoring/product vision is now integrated into the current Museum branch as product memory.

It remains **future context**, not part of the current Block 2B implementation scope.

Key files include:

- `docs/architecture/MUSEUM_PREMIUM_PERSONALIZATION_PLATFORM.md`;
- `docs/architecture/MUSEUM_PREMIUM_AUTHORING_IMPLEMENTATION_BRIEF.md`;
- `docs/visuals/museum-authoring/museum-authoring-system-blueprint-v1.png`;
- `docs/visuals/museum-authoring/museum-authoring-ui-reference-v1.png`.

These establish the future principle:

```text
PERSONALIZABLE ≠ GENERIC
```

and the second-museum test:

> Can a second museum use the capability without changing the engine?

Do not begin Authoring, AI Guide or premium-personalization implementation during Block 2B unless Juanma explicitly changes scope.

## 11b. Scope change — Authoring Vertical Slice 01 (authorized)

Juanma changed that scope with `MUSEUM-PREMIUM-AUTHORING-PERSONALIZATION-VERTICAL-SLICE-01`. Authoring
is now implemented as an additive, opt-in layer (`?authoring=1`) and the second-museum test is run on
every pass:

- `labs/immersive-worlds/authoring/` — experience config, media vault, config store, panel;
- `labs/immersive-worlds/authoring/museum-b.config.json` — the second institution, Museo de la Bruma;
- `qa/tools/authoring-slice.mjs` — functional contract;
- `qa/tools/authoring-visual.mjs` + `qa/tools/build-authoring-board.mjs` — visual contract.

The layer edits **data**, and the Museum is built from that data. Nothing in `engine/` knows an
authoring layer exists, which is the whole reason a second institution needs no engine change.

## 11b-2. Authoring Vertical Slice 02 — the Studio (implemented, product approval pending)

Mandate `MUSEUM_AUTHORING_VS02_GAUNTLET_LOOP_V2` (`docs/prompts/`). VS01 remains runnable at
`?authoring=1&shell=vs01` as the comparison baseline; `?authoring=1` now opens the Studio.

```text
authoring/
  experience-config.js      schema 2 — entities (not artworks), named media slots, rooms; v1 migrates
  media-vault.js            SELECTED → LOADING → (DECODED) → READY → APPLIED | ERROR → RELEASED
  config-store.js           unchanged
  authoring-panel.js        VS01, kept runnable on the v2 model
  studio/
    experience-tree.js      Institución → Exposición → Salas → Piezas, derived from the world record
    readiness.js            required vs optional, blocking vs warning, grouped by domain
    studio-shell.js         docked workspace: tree · letterboxed preview · editor · project column
    studio.css              house art direction; no gold, state colours only
```

Contracts VS02 introduced, and the reasons they exist:

- **A media slot names what a file is FOR** (`INSTITUTION_LOGO`, `ARTWORK_IMAGE`, `PROJECTION_MEDIA`),
  and the entity's own kind decides which slots it may use. A common vault is fine; a common slot is
  not — VS01 proved it by discarding an image when a video was chosen.
- **`SLOTS_FOR_KIND` must describe what the Scene Kit can actually render.** A sculpture is built,
  not photographed: giving it an image slot would be a control that does nothing, and requiring one
  reported the shipped Museum as incomplete.
- **ASSET READY ≠ CONFIG SAVED ≠ PROJECT READY.** "Saved" compares the stored project to what is on
  screen, never "this shell has no pending edits" — applying a preview rebuilds the shell.
- **Preview ≠ Start.** Preview rebuilds the docked Museum and the author stays; Start checks
  readiness, dismisses the studio, returns the canvas to the window, restores the visitor's own
  navigation and drops `authoring` from the URL.
- **Institutional signage carries the mark.** The entry cartela already speaks for the institution,
  so the logo prints on it. No floating plane invented to have somewhere to put a logo.
- **The docked preview needed no engine change.** `RenderHost.resize()` already measured its own
  canvas element; the studio sets one attribute on `<body>` and the renderer follows.

Two Scene Kit lines changed: `labelTexture` accepts an optional mark, and the TEXT/wall-panel profile
passes the one the media loader had already resolved. Nothing else in `scene-kits/` or `engine/` moved.

Evidence: `qa/evidence-vs02/` (board, gauntlet page, three capture waves, manifests with HEAD and
run id per frame). VS01 evidence in `qa/evidence-authoring/` is untouched.

Lessons this wave paid for, worth carrying:

- **A partial redraw must not rebind the whole surface.** Rebinding everything after replacing one
  column doubled the listeners on every control that survived, so one upload ran six times: six
  decodes, six object URLs, five leaked. Found in a state-transition log, not in a screenshot —
  which is the argument for keeping the log.
- **Measure after the stylesheet lands.** The shell measured its column to letterbox the preview and
  got an unstyled div, pinning the canvas to its minimum height.
- **Setting a pose is not entering a room.** A frame captioned "the entry wall" was standing in
  another gallery. Frame with the engine's own semantic framing, which cannot drift.

## 11c. Visual review contract (process, binding)

Added by the addendum `MUSEUM AUTHORING VISUAL QA + REVIEW CONTRACT`, after a pass that reported
18/18 functional checks green while the room still showed the previous institution's name on the wall
and the author's image never reached the world at all.

```text
IMPLEMENTATION
→ REAL BROWSER EXECUTION
→ AUTOMATED VISUAL CAPTURE
→ VISUAL SELF-REVIEW
→ HUMAN REVIEW SURFACE
→ JUANMA + CHATGPT GATE
```

```text
TECHNICAL GREEN DOES NOT OVERRULE VISUAL TRUTH
```

Rules that follow from it, and that cost real defects to learn:

- a pass is not finished until the captures have been **looked at**, defect by defect, and the
  findings written down with severity, frame and proposed correction;
- a world that fails validation **logs and carries on**, so a test that listens only for exceptions
  will report green while the authored entity is silently discarded — QA listens to the console;
- a wait that can return before the thing it waits for has started is not a wait: after a re-boot,
  lower the readiness flag first, or the evidence photographs the loading screen on a slow machine;
- an evidence frame that does not show what its caption claims is a defect in the instrument, and is
  reported alongside the product defects rather than quietly re-shot.

---

# 12. Current explicit scope boundary

Authorized now:

```text
BLOCK 2B
Sala 1 → Sala 2
portal / world crossing
first-party reuse
adapter / anchors
warmup / readiness
handoff
QA
visual evidence
documentation
```

Not authorized by this current state:

- Block 3;
- new rooms beyond what Block 2B needs to prove the crossing;
- premium personalization beyond Vertical Slice 01 (see §11b — VS01 itself is authorized);
- AI Guide implementation;
- replacing Projection;
- rewriting Block 2A;
- master merge;
- canonical stable promotion.

---

# 13. Required read order for the current Block 2B agent

Before material implementation:

1. repository-wide Safe Autonomous Engineering skill / AGENTS / CLAUDE / governance;
2. `README.md` in this architecture directory;
3. this `MUSEUM_CURRENT_STATE.md`;
4. `MUSEUM_PRODUCT_ROADMAP_BLOCKS.md`;
5. `MUSEUM_CAPABILITY_SOURCE_INFINITE_WORLDS.md`;
6. `BLOCK_2A_TRANSITION_LANGUAGE.md`;
7. camera / Director / Scene Kit / Guided contracts relevant to the crossing;
8. inspect the **complete** Infinite Worlds V1.2.3 canonical source snapshot;
9. implement only the current authorized mandate.

No implementation agent should need to discover a critical current contract from an unmerged side branch after this update.

---

# 14. Update discipline

At every major human gate:

```text
VERIFY CURRENT PRODUCT DECISION
→ UPDATE CURRENT STATE
→ INTEGRATE APPROVED PRODUCT MEMORY
→ THEN START NEXT MAJOR BLOCK
```

Do not allow major approved contracts to remain indefinitely isolated in parallel documentation branches.

GitHub is the shared project memory. Keep the current working branch coherent enough that the next agent can reconstruct the mandate from the repository rather than from chat archaeology.
