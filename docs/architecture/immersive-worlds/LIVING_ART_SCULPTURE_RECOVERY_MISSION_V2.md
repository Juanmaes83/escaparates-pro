# LIVING ART — SCULPTURE RECOVERY MISSION V2

**Status:** CANONICAL EXECUTION MISSION — NO MERGE

## Objective

Human QA of `claude/escaparates-living-art-current-v1` failed. Do not merely patch the broken imports. Re-open the original working donor systems, understand the full capability stone, compare them against the current ports and against the current receiving products, then bring the largest coherent useful stone, sculpt it, graft it safely, and prove it visually from a clean clone.

The mission covers both donor repos:

- `Juanmaes83/wet-paint-flow`
- `Juanmaes83/van-gogh-crows`

and both receiving products inside `Juanmaes83/escaparates-pro`:

- Escaparates Pro
- Museum / Immersive Worlds

No `master` merge. No donor mutation. No destructive rewrites of stable product code.

---

## 0. Canonical method

Do not start from the broken port. Start from the strongest working source.

```text
WORKING SOURCE
→ FREEZE / PIN
→ RUN IT
→ UNDERSTAND THE WHOLE CAPABILITY
→ IDENTIFY CAPABILITY VS VISUAL REPRESENTATION
→ IDENTIFY PRODUCT GAP
→ BRING THE LARGEST USEFUL STONE
→ SCULPT AWAY DONOR-SPECIFIC REPRESENTATION
→ PRESERVE CAPABILITY
→ GRAFT INTO PRODUCT CONTRACTS
→ RUN
→ SEE
→ JUDGE
→ CORRECT
→ LOCK
```

The reference repo is not a bag of functions. It is a working capability system. Understand why it works before extracting pieces.

Read first:

- `docs/architecture/immersive-worlds/SCULPTING_AND_GRAFTING_METHOD.md`
- relevant Living Art archaeology/task docs
- Autonomous Visual Engineering Playbook
- Browser Automation QA Protocol
- Human QA Runtime / Human Review Delivery Contract

---

## 1. Re-open both original donors

Use clean clones if existing worktrees may be stale or dirty. Do not modify donors.

For each donor:

1. confirm branch and exact SHA;
2. confirm clean working tree;
3. run the original donor;
4. run tests where available;
5. open it visually;
6. inspect architecture and runtime;
7. identify media inputs;
8. identify controls;
9. identify animation/time model;
10. identify rendering pipeline;
11. identify persistence/export capabilities;
12. identify interaction model;
13. identify performance assumptions;
14. identify exact dependencies;
15. identify asset/license boundaries.

Do not infer capability from filenames. Run the original systems.

---

## 2. Build the full donor capability maps

### Wet Paint Flow

Do not reduce it prematurely to direction-field + Poisson + Bézier + impasto. Determine whether the working source contains meaningful:

- image acquisition;
- image analysis;
- structural flow;
- stroke hierarchy;
- coarse / medium / fine passes;
- stroke growth;
- replay / timeline;
- progressive reveal;
- wet-paint behaviour;
- material behaviour;
- display modes;
- quality tiers;
- resolution handling;
- export / video output;
- deterministic reproduction;
- performance controls;
- other working capabilities discovered in runtime/code.

Classify each as:

`CORE CAPABILITY | SUPPORTING CAPABILITY | DONOR-SPECIFIC REPRESENTATION | PRODUCT-SPECIFIC UI | OPTIONAL | NOT REUSABLE`

### Van Gogh Crows

Do not reduce it prematurely to `BoidsSimulation`. Determine the full transferable system:

- GPGPU simulation;
- flock rules;
- sprite/atlas rendering;
- orientation;
- motion character;
- attractor / avoidance;
- draggable interaction;
- presets;
- undo;
- responsive behaviour;
- atmosphere;
- painterly integration;
- density / scale / behavioural variation;
- timing/state system;
- performance characteristics;
- any other capability discovered.

Separate generic capability from crow / Van Gogh representation and from rights-sensitive assets.

---

## 3. Compare donors against the current ports

Audit:

- `claude/escaparates-living-art-current-v1`
- `claude/museum-living-art-product-v1`

Build the matrix:

`DONOR CAPABILITY → ORIGINAL? → CURRENT PORT? → FULL/PARTIAL/LOST/BROKEN → WHY → RECOVER? → EP VALUE → MUSEUM VALUE`

Known failure to verify independently:

- EP clean clone imports `../../immersive-worlds/...` dependencies that do not exist on that clean branch;
- prior QA could therefore have passed only because dirty/untracked workspace files satisfied imports;
- image-only input was implemented;
- video was not implemented;
- persistence was absent;
- export actions were declared without proven implementation;
- several controls only changed config/UI and did not rebuild the actual output;
- reset did not necessarily reset the actual rendered pipeline;
- fixed 256×256 crop/aspect handling was weak;
- Human Runtime failed.

Do not stop at these known issues. Discover deeper capability loss.

Ask explicitly:

- Did the port preserve the real Wet Paint Flow hierarchy or only isolated algorithms?
- Did growth/reveal/timeline survive?
- Did material quality survive?
- Did quality tiers survive?
- Did useful donor media/export capabilities survive?
- Did useful Van Gogh interaction/preset/responsive behaviours survive?
- Did we turn rich donor systems into a weak demo?

---

## 4. Study CURRENT Escaparates Pro

Use current remote `master` as the product reference, without modifying it.

Run and inspect current architecture for:

- Web Modules;
- EP.Media / current media contracts;
- image input;
- video input/playback;
- media normalization;
- iframe/standalone modules;
- authoring panels;
- persistence / ProjectStore;
- save / restore;
- HTML / ZIP / embed export;
- video texture modules;
- existing modules already proving image + video + controls + save/restore + export + real preview.

Find the strongest existing patterns. Reuse them rather than creating parallel systems.

Produce:

`CURRENT EP CAPABILITY MAP: REUSE | ADAPT | PORT | DO NOT TOUCH`

---

## 5. Study CURRENT Museum / Immersive Worlds

Study the current intended Museum receiving state independently of the historical baseline. Run it.

Inspect:

- Media Vault / Catalogue;
- artwork entities;
- video architecture;
- Full Studio;
- room authoring;
- nested runtime;
- Breeze;
- CameraAuthority;
- SceneKit;
- world graph;
- persistence;
- visitor/runtime separation;
- current own-image / own-video / artwork-selection contracts.

Do not create a second Museum media system.

Produce:

`CURRENT MUSEUM CAPABILITY MAP: REUSE | ADAPT | PORT | DO NOT TOUCH`

---

## 6. Root-cause audit

Classify all discovered failures:

- branch / topology;
- dependency;
- archaeology;
- sculpture;
- product integration;
- QA;
- Human Runtime;
- documentation / claim;
- UX;
- capability loss.

The purpose is not blame. The purpose is to prevent the same class of error from recurring.

---

## 7. Choose the largest useful stone

Only after the archaeology and product comparison, decide the correct capability boundary.

Do not automatically choose the smallest extraction.

Possible hypotheses to test, not assumptions:

- a coherent `Painterly Reconstruction Engine` instead of isolated painterly utility files;
- a coherent `Procedural Living Agent Engine` instead of only a boids class.

For every proposed stone answer:

- What exactly is the stone?
- Why is this the correct boundary?
- Which capability does it preserve?
- Which donor representation is sculpted away?
- Which product contracts receive it?
- What leverage does the larger stone provide?
- What complexity does it add?
- What would be lost by sculpting smaller?

Bring the largest coherent useful stone first. Then sculpt.

---

## 8. Architecture checkpoint

Before implementation, create/update a `SCULPTURE RECOVERY AUDIT` containing:

1. WPF full capability map;
2. VGC full capability map;
3. current EP capability map;
4. current Museum capability map;
5. donor → current-port loss matrix;
6. root-cause matrix;
7. largest-useful-stone recommendation;
8. preserve / sculpt-away / graft boundaries;
9. do-not-touch contracts;
10. proposed EP receiving architecture;
11. proposed Museum receiving architecture;
12. video strategy;
13. persistence strategy;
14. export strategy;
15. clean-clone strategy;
16. Human Runtime strategy.

This is an execution checkpoint, not a reason to stop. Continue automatically if the safe architecture is clear. Stop only if there is a genuine architectural ambiguity, rights issue, destructive requirement, or receiving-product contradiction that requires Juanma's decision.

---

## 9. Sculpt and graft Escaparates Pro

Use a fresh isolated branch based on current product state. Never modify `master` directly.

Required product truth:

- fresh clone works with no hidden/untracked dependency;
- full current EP catalogue remains intact;
- own image works visibly;
- own video works where technically meaningful;
- use current EP media/video contracts rather than inventing a parallel library;
- sensible aspect-ratio handling;
- Combined works and is visibly distinct;
- Painterly works and is visibly distinct;
- Living works and is visibly meaningful, not an almost-empty black surface;
- every control changes the actual visible output;
- controls are explicitly classified `LIVE` or `REBUILD REQUIRED`;
- rebuild-required controls actually rebuild/apply;
- reset resets actual scene/state, not merely UI values;
- save/restore reuses existing product persistence where available;
- video play/pause/loop and frame-driven visual behaviour are proven if video is supported by the chosen effect;
- export actions are either genuinely implemented/proven or not declared;
- no current module is broken or removed.

Do not fake unsupported capabilities in metadata.

---

## 10. Sculpt and graft Museum separately

Museum receives the shared/core capabilities through Museum-native adapters/contracts.

Expected shape:

`Museum media/artwork selection → selected image/video/artwork → Living Art capability → Museum-native runtime`

Preserve and do not bypass:

- CameraAuthority;
- WorldGraph;
- SceneKit;
- Breeze;
- existing rooms;
- visitor navigation;
- Full Studio contracts;
- current Museum media architecture.

Do not make Museum depend on an EP-specific adapter. Core capability may be shared; product adapters remain separate.

---

## 11. Visual engineering loop — mandatory

For every meaningful increment:

```text
BUILD → SEE → JUDGE → CORRECT → LOCK
```

Do not accept compilation as visual proof. Do not accept Playwright PASS as sufficient proof. Do not accept a screenshot as proof of motion.

Use browser automation to inspect:

- page/route;
- controls/buttons;
- canvas/DOM;
- console;
- network;
- responsive behaviour;
- screenshots;
- traces;
- video/motion evidence where relevant.

Open and observe the actual result. Motion must be judged in motion.

If the visual result is weak, broken, visually indistinguishable, or not representative of the donor capability, correct it and re-run. Do not call it done.

---

## 12. Clean-clone rule — absolute

For every candidate delivery, validate from a BRAND-NEW clone from remote.

No reused implementation workspace. No untracked donor folders. No local files satisfying imports accidentally.

Then:

1. checkout exact SHA;
2. start the same runtime command that will be given to Juanma;
3. open the exact Human Review URL;
4. inspect console and network;
5. load own image;
6. load own video where supported;
7. test all modes;
8. test all controls;
9. test reset;
10. test save/restore;
11. test playback;
12. test truthful export status;
13. capture screenshots and motion/video evidence.

If a clean clone fails, the delivery is FAIL.

---

## 13. Human Runtime is part of Done

For each product deliver:

- repo;
- branch;
- exact SHA;
- clean-clone commands;
- Windows PowerShell commands;
- server command;
- port;
- exact URL;
- console status;
- network status;
- image proof;
- video proof where applicable;
- Combined proof;
- Painterly proof;
- Living proof;
- controls proof;
- save/restore truth;
- export truth;
- known limitations.

Human Review map:

`CHANGE | OPEN | GO TO | DO | LOOK FOR | MUST NOT CHANGE | KNOWN LIMITATION | KEEP / ADJUST / REJECT`

The exact URL must have been tested before it is handed to Juanma.

---

## 14. Product goal

We are not building a painterly demo plus a boids demo.

We are building reusable capability families for Escaparates Pro and Museum / Immersive Worlds.

Potential composition, if supported by the architecture:

```text
IMAGE / VIDEO
→ STRUCTURAL ANALYSIS
→ PAINTERLY RECONSTRUCTION
→ WET / IMPASTO MATERIAL
→ PROGRESSIVE REVEAL
→ LIVING MARKS / AGENTS
→ PROCEDURAL MOTION
→ VISITOR INTERACTION
→ REUSABLE AUTHORING
→ OUTPUT
```

Do not force all capabilities into one monolith, but do not amputate useful working donor behaviour prematurely.

**BRING THE LARGE STONE FIRST. THEN SCULPT.**

---

## 15. Continuation rule

Default state is **CONTINUE EXECUTION**.

Do not stop merely because:

- archaeology is complete;
- a document was written;
- code compiles;
- tests pass;
- Playwright passes;
- screenshots exist;
- an intermediate phase is complete.

Continue through implementation, clean-clone verification, browser validation, visual correction, and Human Review delivery.

If a test fails, diagnose → correct → re-run. If visual quality is inadequate, correct → re-run. If clean clone fails, correct → re-run.

Stop only for a genuine decision blocker such as:

- donor behaviour cannot be reproduced;
- rights are ambiguous for required assets;
- current product architecture contradicts the graft and multiple materially different architectural choices remain;
- a destructive change would be required;
- safe graft boundary cannot be determined.

Otherwise continue until the candidate is genuinely reviewable by Juanma.

---

## 16. Current truth

- EP Living Art Human QA at `740366c` = **FAIL**.
- EP Living Art concept = **PRESERVE / RECOVER**.
- Museum Living Art branch = **EXPERIMENTAL / HUMAN QA PENDING**.
- No merge is authorized.

The final state of this mission is not “code written”.

The final state is:

**SCULPTED CAPABILITY + SAFE PRODUCT GRAFT + CLEAN-CLONE PASS + REAL VISUAL PROOF + EXACT HUMAN REVIEW RUNTIME.**
