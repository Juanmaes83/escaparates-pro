# Immersive Worlds — Sculpting & Grafting Method

> **Status:** PRODUCT / WORKING METHOD — EXPLICIT JUANMA DECISION  
> **Applies now to:** Museum / Institutional.  
> **Related method:** Place / Destination may use a different, more purely subtractive sculpting method when its starting product is already visually coherent.  
> **Purpose:** direct future phase design, Claude Code / Fable execution, reference use, visual review and evidence.  
> **Important:** this method does not authorize merge, global navigation integration, protected-baseline changes or uncontrolled core refactors.

---

## 1. Strategic change

Museum / Institutional is no longer developed by asking:

> **WHAT FEATURE IS NEXT?**

The governing question becomes:

> **WHAT IS THE BIGGEST GAP BETWEEN THE CURRENT EXPERIENCE AND THE TARGET EXPERIENCE?**

Then:

```text
CAN WE SCULPT IT?
↓
IF NOT:
WHAT CAPABILITY MUST BE GRAFTED?
```

Museum is not a feature collection. It is an experience to be revealed.

The success direction is:

```text
LESS SYSTEM IS VISIBLE
+
MORE EXPERIENCE IS FELT
```

The governing Museum quality doctrine remains:

> **The visitor should not feel that they are using a 3D application. They should feel that they have entered an exhibition.**

---

## 2. Two methods

### 2.1 PURE SCULPTING

Use when the starting product is already strong, coherent and capability-rich, and the main task is removing specificity without destroying what makes it work.

```text
WORKING PRODUCT
→ REMOVE SPECIFICITY
→ PRESERVE CAPABILITY
→ GENERALISE
→ CONFIGURE
→ NEW VERTICAL
```

### 2.2 SCULPT + GRAFT

This is the primary method for Museum / Institutional.

```text
OUR WORKING MUSEUM
↓
IDENTIFY PROTOTYPE / GENERIC / NOISY LAYERS
↓
SCULPT AWAY WHAT DOES NOT SERVE THE EXPERIENCE
↓
IDENTIFY A CAPABILITY GAP
↓
SEARCH THE REFERENCE LIBRARY
↓
CHECK LEGAL + ARCHITECTURAL + QUALITY FIT
↓
REUSE / PORT / ADAPT / COMPOSE / REIMPLEMENT AS APPROPRIATE
↓
GRAFT THE BETTER CAPABILITY INTO IW CONTRACTS
↓
RUN IN BROWSER
↓
VISUAL CHECKPOINT
↓
COMPARE BEFORE / AFTER
↓
DECIDE NEXT CUT
```

The intent is not to add features.

It is to:

```text
REMOVE WHAT WEAKENS THE EXPERIENCE
+
PRESERVE WHAT ALREADY WORKS
+
GRAFT BETTER CAPABILITIES WHERE THEY EXIST
```

---

## 3. The current Museum is the stone

The working Museum built through IW-1 / IW-2 / IW-3 is the current block of marble.

Do not restart from another repository.

Do not clone another museum and replace ours.

Protect capabilities already proven, including as applicable:

- canonical World Store;
- World Graph;
- Spaces;
- Entities;
- Anchors;
- Actions;
- Hotspots;
- Portals;
- Camera Authority;
- Explore;
- Focus;
- Guided Experience;
- configurable content;
- image / video / audio;
- rights metadata;
- second-world configurability;
- thin authoring;
- deterministic QA;
- Experience Language foundation;
- Scene Kit separation.

The purpose of Sculpt + Graft is to improve the experience without casually discarding these capabilities.

---

## 4. Layer audit

Every meaningful Museum pass begins by auditing the real current implementation rather than guessing from documentation.

At minimum inspect:

- WORLD / ENGINE;
- SCENE KIT;
- SPATIAL COMPOSITION;
- ARCHITECTURE;
- ARTWORK PLACEMENT;
- FOCUS;
- CAMERA;
- NAVIGATION;
- PORTALS;
- GUIDED EXPERIENCE;
- INFORMATION;
- SIGNAGE;
- HUD / UI;
- TYPOGRAPHY;
- LIGHTING;
- MATERIALS;
- POSTPROCESSING;
- SOUND;
- MOTION;
- MOBILE;
- ACCESSIBILITY;
- AUTHORING;
- CONTENT MODEL;
- QUALITY / QA.

For each layer classify with evidence:

```text
KEEP
SCULPT
GENERALISE
OPTIONALISE
REPLACE
GRAFT
REMOVE
```

Do not clean code merely for cleanliness. Sculpt the experience.

---

## 5. Capability versus representation

Never confuse a capability with its current visual representation.

Examples:

```text
NAVIGATION CAPABILITY
≠
VISIBLE HUD

ARTWORK INFORMATION
≠
LARGE CARD

GUIDED EXPERIENCE
≠
SLIDESHOW CONTROLS

FOCUS CAPABILITY
≠
MODAL UI

CONTENT METADATA
≠
SOFTWARE PANEL

ROOM FUNCTION
≠
UNIFORM BOX GEOMETRY

LIGHTING CAPABILITY
≠
MORE LIGHTS

MUSEUM PRESENCE
≠
MORE OBJECTS
```

### Removal safety rule

> **NEVER REMOVE A REPRESENTATION UNTIL ITS UNDERLYING CAPABILITY HAS ANOTHER VALID HOME OR A VERIFIED REASON TO DISAPPEAR.**

A visually weak HUD may still carry route state, discoverability, accessibility or control semantics. Remove the noise, not the capability by accident.

If it is unclear whether something is NOISE or CAPABILITY:

1. inspect behaviour and dependencies;
2. test removal or reduction reversibly;
3. verify accessibility and control paths;
4. if still ambiguous and product/capability loss is possible, ask Juanma.

---

## 6. Focus sculpting

Do not ask:

> WHAT CAN WE ADD TO FOCUS?

Ask:

> **WHAT CAN WE REMOVE UNTIL THE ARTWORK DOMINATES?**

Conceptual sculpt direction:

```text
CURRENT FOCUS
↓
REMOVE SECONDARY UI
↓
REMOVE DUPLICATED INFORMATION
↓
REMOVE CHROME
↓
REMOVE VISUAL COMPETITION
↓
RECOMPOSE CAMERA
↓
RECOMPOSE LIGHT
↓
MINIMAL CONTEXT
↓
ARTWORK AS EXPERIENCE
```

Quality question:

> **AM I CONTEMPLATING THE ARTWORK OR OPERATING AN INTERFACE?**

Preserve Camera Authority, focus-return lifecycle, accessibility and deterministic QA while changing presentation.

---

## 7. Spatial composition sculpting

More architecture does not automatically mean better architecture.

Audit geometry that exists because it was:

- easy to generate procedurally;
- convenient during prototyping;
- filling space;
- repeating a pattern;
- not carrying deliberate experience value.

Candidates to remove or transform include:

- repetitive spacing;
- generic walls;
- repetitive barriers;
- repetitive pedestals;
- uniform artwork rhythm;
- flat sightlines;
- filler geometry;
- dead zones.

Preserve or improve:

- orientation;
- scale;
- navigation;
- presence;
- focus;
- accessibility;
- coherence.

Every subtraction must answer:

> **DID WE REMOVE NOISE OR DID WE REMOVE QUALITY?**

---

## 8. UI / information / signage sculpting

Audit UI, HUD, information and signage as one experience layer.

Core test:

> **IF WE REMOVE 50% OF THE UI, DOES THE WORLD STILL EXPLAIN ITSELF?**

Desired direction:

```text
SOFTWARE UI
→
MUSEOGRAPHIC LANGUAGE
```

Possible expressions include:

- wall labels;
- spatial typography;
- integrated signage;
- minimal focus context;
- narration;
- audio;
- environmental cues;
- architectural wayfinding.

Do not reduce this to a CSS restyle.

---

## 9. What GRAFT means

A graft begins only after a **specific capability gap** has been demonstrated.

Do not search the library merely to find something new to import.

Correct sequence:

```text
PROBLEM
→ DEFINE CAPABILITY GAP
→ FIND BEST REFERENCE
→ STUDY REAL IMPLEMENTATION / BEHAVIOUR
→ LEGAL CHECK
→ ARCHITECTURAL FIT
→ QUALITY FIT
→ REUSE / PORT / ADAPT / COMPOSE / CLEAN REIMPLEMENT
→ FIT INTO IW CONTRACTS
→ TEST
```

Ask:

> **WHO HAS ALREADY SOLVED THIS BETTER?**

The reference library is an engineering accelerator, not a moodboard.

### Graft acceptance rule

A graft is accepted only if it:

1. materially improves a demonstrated capability gap **or** reduces total system complexity;
2. fits existing IW contracts or justifies an explicit reviewed contract change;
3. does not introduce a second competing ownership/state/camera/navigation/focus model;
4. preserves or improves deterministic QA and accessibility;
5. has acceptable licensing/provenance.

Never allow two competing Focus systems, camera lifecycles, state models, navigation grammars or ownership models merely because two references are useful.

---

## 10. Reuse ambition

The default attitude is ambitious but evidence-based:

```text
IF LEGAL + BETTER:
REUSE IT.

IF LEGAL + ADAPTABLE:
PORT IT.

IF LEGAL + COMPOSABLE:
INTEGRATE THE STRONGEST MECHANISM THAT FITS IW CONTRACTS.

IF DIRECT SOURCE REUSE IS BLOCKED:
EXTRACT THE KNOWLEDGE,
UNDERSTAND THE MECHANISM,
DERIVE THE REQUIREMENTS,
AND IMPLEMENT AN IW-NATIVE SOLUTION INDEPENDENTLY.

DO NOT REINVENT A WEAKER SOLUTION.
```

At the same time:

```text
REUSE ≠ BLIND COPY
PORT ≠ IMPORT ANOTHER PROJECT'S ARCHITECTURE
REFERENCE ≠ AUTHORITY OVER IW CONTRACTS
```

Choose using:

```text
QUALITY
+
LEGAL COMPATIBILITY
+
ARCHITECTURAL FIT
+
MAINTAINABILITY
+
PERFORMANCE
+
PROVENANCE
```

---

## 11. Legal method

Be smart. Be ambitious. Be legal.

```text
NO LICENSE FOUND
≠
INCOMPATIBLE

NO LICENSE FOUND / LICENCE UNCLEAR
=
DIRECT REUSE PENDING VERIFICATION
```

Absence of verified permission is not permission to copy.

Until primary evidence is established:

- study;
- compare;
- analyse;
- understand general mechanisms;
- extract requirements/patterns;
- reimplement independently where appropriate.

If a licence is compatible:

- reuse / port / adapt when it is the stronger solution;
- comply with attribution and obligations.

If a licence is incompatible:

- no direct source reuse;
- do not discard the knowledge.

### Clean reimplementation is not a loophole

Do not perform line-by-line translation, renamed cloning, mechanical restructuring or disguised source reproduction.

Correct process:

```text
UNDERSTAND GENERAL MECHANISM
→ DERIVE REQUIREMENT
→ DESIGN IW-NATIVE SOLUTION
→ IMPLEMENT INDEPENDENTLY
→ TEST BEHAVIOUR
```

Reopen earlier licence conclusions when they are not backed by reproducible primary evidence.

---

## 12. Reference roles for current Museum sculpting

Use `REFERENCE_LEDGER.md` and `REFERENCE_REUSE_REGISTER.md` as the detailed authority. Examples of current problem-to-reference roles include:

### Focus / artwork inspection

- `artwork-3D-museum` — world position, artwork normal, focus framing, responsive camera, enter/focus/return behaviour; direct source use only according to verified licence status.
- TheVertMenthe — experience/interaction quality bar: presence, focus, minimal interface; never a visual template to copy.
- Galerium, when available and relevant — collection organisation, artwork inspect, zoom/pan/pinch/double-tap, desktop/mobile/content structure; direct reuse pending verified rights where unresolved.

### Gallery / architecture

- `3D-art-gallery-threejs` — study evolution from empty room toward gallery, construction order, artwork/sculpture integration and what makes space stop reading as blockout; reopen unsupported licensing conclusions before direct reuse.

### Performance / lifecycle

- `portfolio-itom-and-advanced-WebGL` — strong donor where its verified MIT licensing and exact provenance permit reuse/adaptation: warmup, shader compilation, device tiers, DPR, lifecycle, resource management, hybrid DOM/WebGL performance patterns.

### QA

- Claude-of-Duty;
- threejs-game-skills;
- Gauntlet;
- Unslop.

Do not re-solve mature QA problems without checking the reference library first.

---

## 13. Cross-vertical capability transfer

Immersive Worlds should develop a culture of **capability transfer**, not forced engine unification.

Place / Destination may teach Museum capabilities such as:

- runtime signage;
- Canvas-generated graphics;
- procedural textures;
- Experience Language thinking;
- lighting grammar;
- palette systems;
- environmental richness;
- world/representation separation.

Museum may teach Place capabilities such as:

- semantic content;
- metadata;
- Focus;
- Guided Experience;
- content configurability;
- rights model;
- authoring patterns;
- canonical state.

Do not copy Sakura's Japanese identity into Museum. Extract capability.

Do not automatically fuse Museum and Place.

```text
VERTICAL-SPECIFIC EXCELLENCE FIRST
↓
IDENTIFY GENUINELY SHARED CAPABILITIES
↓
PROVE TRANSFER VALUE
↓
ONLY THEN CONSIDER SHARED IW ABSTRACTION
```

A capability discovered in one vertical is not promoted to shared core merely because it is reusable in theory. It must either:

- prove value in another vertical context; or
- be clearly domain-independent by contract and evidence.

No `UniversalEverythingManager`.

---

## 14. One material transformation at a time

Every material Sculpt/Graft change follows:

```text
HYPOTHESIS
↓
WHAT WE THINK IS WRONG
↓
WHAT CAPABILITY MUST REMAIN
↓
WHAT WE PLAN TO REMOVE / GRAFT
↓
LEGAL / REFERENCE CHECK
↓
CLAUDE IMPLEMENTATION
↓
RUN IN BROWSER
↓
AGENT VISUAL INSPECTION
↓
QA
↓
BEFORE / AFTER
↓
FRESH CRITIC / GAUNTLET WHEN MATERIAL
↓
JUANMA REVIEW WHEN REQUIRED
↓
DECISION
```

Do not make five major perceptual changes and test only at the end.

Use reversible increments so the cause of improvement/regression remains visible.

---

## 15. Mandatory visual evidence and supervision

No perceptually significant phase is considered reviewable without **navigable evidence and saved visual evidence**.

### Every Sculpt Pass must provide

1. **a navigable preview / local URL** that Juanma can open to supervise the actual experience;
2. exact route(s) / query parameters needed to reach the changed state;
3. deterministic screenshot(s) of the relevant state(s), saved in the project evidence area;
4. **BEFORE / AFTER** images for perceptually significant changes;
5. named state / reproduction instructions;
6. browser QA and console status;
7. relevant performance/QA evidence;
8. a concise statement of what was sculpted, what capability was preserved, what was grafted and what remains unresolved.

A screenshot is evidence, not a substitute for the navigable preview.

A preview is not approval.

### Save images, do not merely display them transiently

For every material visual pass, preserve representative captures in the project's QA/evidence structure or the documented equivalent used by the current branch.

Do not overwrite history in a way that prevents useful before/after comparison. Preserve enough evidence to understand the visual evolution of the pass.

Use deterministic named states wherever possible.

---

## 16. Agent visual review

Before asking Juanma to review a material pass, the implementation/critic workflow should inspect real captures/browser states for:

- generic 3D-app feel;
- UI dominance;
- artwork competition;
- weak composition;
- dead space;
- repetitive geometry;
- flat lighting;
- signage inconsistency;
- Focus weakness;
- spatial incoherence;
- accessibility regressions;
- performance regressions.

Do not trust tests alone for experience quality.

---

## 17. Juanma visual checkpoints

Juanma review is required when a pass materially changes:

- Focus experience;
- Hero Gallery / primary spatial composition;
- removal or transformation of a major UI layer;
- lighting/material direction;
- Experience Language;
- a major visual graft;
- a pass proposed as approved/completed;
- any change that could remove a capability or alter product/visual identity.

Do not block routine execution for:

- small visual tuning;
- bug fixes;
- QA additions;
- internal reversible implementation changes;
- local performance fixes.

Rule:

```text
TECHNICAL + LOCAL + REVERSIBLE
→ DECIDE AND CONTINUE

PRODUCT / VISUAL IDENTITY / ARCHITECTURE / CAPABILITY LOSS
→ ASK JUANMA
```

---

## 18. Unslop as adversarial sculptor

Ask:

> **WHAT LOOKS GENERATED / GENERIC / DEFAULT / UNAUTHORED?**

Especially inspect:

- repetitive barriers;
- generic luxury;
- uniform spacing;
- flat PBR;
- random accents;
- floating UI;
- default WebGL museum grammar;
- decorative geometry;
- generic dark-room styling;
- generic SaaS/card language;
- meaningless spectacle.

Remove slop. Do not replace it with a different generic style.

---

## 19. Gauntlet after material Sculpt Passes

Use a fresh critic after material passes.

Reference roles include:

- TheVertMenthe — presence / exploration / minimal interface;
- Cartier — composition / restraint / hierarchy / scenography;
- artwork-focused references — Focus behaviour;
- ITom — lifecycle / performance;
- relevant Place/Sakura outputs — authored Experience Language / world richness, without transferring vertical-specific identity.

Gauntlet must answer:

```text
OURS LOSES / OURS WINS / OURS MATCHES
WHY
WHAT SPECIFICALLY CREATES THE GAP
WHAT SHOULD BE REMOVED
WHAT CAPABILITY IS MISSING
WHICH REFERENCE HAS SOLVED IT BETTER
WHAT IS THE NEXT DELTA
```

Do not use empty numeric scores as the primary quality decision.

---

## 20. First audit before the next Museum code pass

Before designing the next Claude implementation prompt under this methodology, produce an evidence-based audit of the current Museum containing:

### A. CURRENT MUSEUM LAYER MAP
What layers actually exist now.

### B. CAPABILITY MAP
What works and must be protected.

### C. PROTOTYPE NOISE MAP
What exists mainly because of provisional implementation convenience.

### D. SCULPT MAP
What can be removed, reduced, generalized or optionalized.

### E. GRAFT MAP
Which demonstrated capability gaps may benefit from the reference library.

### F. REFERENCE ASSIGNMENT
For each relevant problem:

```text
PRIMARY REFERENCE
SECONDARY REFERENCE
LEGAL STATUS
PROPOSED USE MODE
```

### G. COUPLING / RISK MAP
Potential impact on:

- Camera Authority;
- World State;
- Focus;
- Scene Kit;
- Explore;
- Guided Experience;
- authoring;
- deterministic QA;
- accessibility;
- performance.

### H. VISUAL CHECKPOINT PLAN
Where Claude may continue automatically and where Juanma visual review is required.

### I. FIRST SCULPT PASS
Choose the highest-value first block and justify why it should be first.

Do not assume a fixed sequence before auditing the current IW state.

A possible hypothesis is:

```text
SCULPT-MUSEUM-01 — UI DISAPPEARANCE
SCULPT-MUSEUM-02 — ARTWORK DOMINANCE / FOCUS
SCULPT-MUSEUM-03 — SPATIAL COMPOSITION
SCULPT-MUSEUM-04 — LIGHT / MATERIAL EXPERIENCE LANGUAGE
SCULPT-MUSEUM-05 — INFORMATION / SIGNAGE LANGUAGE
SCULPT-MUSEUM-06 — MOTION / SOUND / TRANSITION COHERENCE
```

But the current evidence decides the order.

---

## 21. Roles

### Juanma

```text
PRODUCT OWNER
+
VISUAL AUTHORITY
+
FINAL DECISION MAKER
+
MERGE AUTHORITY
```

### ChatGPT

```text
PRODUCT ARCHITECT
+
SCULPTING DIRECTOR
+
REFERENCE STRATEGIST
+
QUALITY CRITIC
+
CLAUDE PROMPT DESIGNER
```

ChatGPT designs phases/prompts from the current evidence rather than defaulting to a feature roadmap.

### Claude Code / Fable

```text
IMPLEMENTATION LEAD
```

Claude receives clear goal, boundaries, references, legal policy, quality bar and stop conditions, while retaining technical implementation autonomy.

Prompts should be goal-driven rather than micromanaged.

Good example:

> Make Focus feel like contemplation rather than software while preserving Camera Authority, return lifecycle, accessibility and deterministic QA. Study the assigned references, reuse legally where useful, and stop at the required visual checkpoint with navigable preview plus before/after evidence.

---

## 22. Core protection

Before modifying the World Engine/core to solve a Museum quality problem, try in this order:

```text
SCENE KIT
→ SPATIAL COMPOSITION
→ LIGHTING
→ MATERIALS
→ FOCUS STAGING
→ SIGNAGE
→ UI
→ MOTION
→ SOUND
→ EXPERIENCE LANGUAGE
```

Only when evidence shows the current engine contract blocks the result should an engine change be proposed.

Do not modify core merely because a Scene Kit solution requires more design work.

---

## 23. Protected baselines and merge gate

Still mandatory:

- local-first;
- verified checkout;
- isolated branch;
- protected Boards / Casebook;
- no direct development on `master`;
- no opportunistic shared/global refactor;
- no global navigation integration without approval;
- reversible work;
- diff evidence;
- browser QA;
- deterministic/saved visual evidence;
- navigable preview for each material phase;
- Juanma visual approval where required;
- no merge without Juanma's explicit authorization.

Successful QA, a commit, screenshots or a preview never imply merge approval.

---

## 24. Final philosophy

```text
MUSEUM IS NOT A FEATURE COLLECTION.
IT IS AN EXPERIENCE TO BE REVEALED.

DO NOT KEEP ADDING MARBLE.
REMOVE WHAT HIDES THE EXPERIENCE.

WHEN SOMETHING IMPORTANT IS MISSING,
DO NOT REINVENT BLINDLY.

SEARCH THE REFERENCE LIBRARY.
GRAFT THE STRONGEST LEGAL CAPABILITY.
PRESERVE OUR CONTRACTS.
LOOK AT THE RESULT.
COMPARE.
ASK JUANMA WHEN PRODUCT OR VISUAL IDENTITY IS AT STAKE.
THEN CUT AGAIN.
```

The method is:

```text
SCULPT
+
GRAFT
+
LOOK
+
COMPARE
+
DECIDE
```
