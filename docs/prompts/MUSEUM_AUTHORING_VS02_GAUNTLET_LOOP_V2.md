# MUSEUM AUTHORING VS02 — GAUNTLET LOOP V2

**MANDATE_ID:** `MUSEUM_AUTHORING_VS02_GAUNTLET_LOOP_V2`  
**MODE:** PRODUCT IMPLEMENTATION + VISUAL GAUNTLET  
**BRANCH POLICY:** ISOLATED DEVELOPMENT ONLY  
**MERGE:** FORBIDDEN  
**PROMOTION:** FORBIDDEN  
**MASTER/MAIN:** DO NOT TOUCH  
**HUMAN PRODUCT AUTHORITY:** JUANMA  
**TECHNICAL / IMPLEMENTATION AGENT:** CLAUDE CODE  
**VISUAL PRODUCT APPROVAL:** PENDING UNTIL JUANMA

---

## A. PRODUCT CONTRACT

### A1. WHAT WE ARE BUILDING

We are NOT building a one-off virtual museum demo.

We are building a:

**PREMIUM IMMERSIVE AUTHORING PLATFORM**

for:

- museums;
- galleries;
- foundations;
- exhibitions;
- cultural institutions;
- installations;
- art fairs;
- premium cultural experiences.

The same engine must be able to power many institution-specific experiences without rebuilding the engine for each client.

**CORE PRODUCT TEST:**

> CAN A SECOND MUSEUM CREATE A DISTINCT PREMIUM EXPERIENCE WITHOUT CHANGING THE ENGINE?

If NO, the abstraction is not complete enough.

Canonical principles:

```text
ONE ENGINE
→ MANY PREMIUM EXPERIENCES
```

```text
PERSONALIZABLE
≠
GENERIC
```

```text
EVERY EXPERIENCE MAY BE PERSONALIZED.
THE QUALITY BAR IS NOT CONFIGURABLE.
```

```text
AUTHORING SHOULD EXPAND EXPRESSION,
NOT EXPOSE ENGINE COMPLEXITY.
```

```text
THE EXPERIENCE IS THE INTERFACE.
```

### A2. CURRENT PRODUCT STATE

The existing Museum product already contains valuable working systems.

DO NOT rebuild them from zero.

Expected existing capabilities include:

- Immersive Worlds engine;
- Museum Scene Kit;
- world data;
- rooms / spaces;
- artworks / entities;
- Guided experience;
- Explore;
- Focus;
- Collection Browse;
- guide;
- camera grammar;
- transition system;
- media loader;
- current authoring VS01;
- config model;
- MediaVault;
- ConfigStore;
- second-museum config;
- current QA / deterministic states;
- current visual evidence system.

Before coding, VERIFY current reality in the repository.

Do not trust this mandate over actual repository state if HEAD has moved.

### A3. FROZEN / KEEP CONTRACTS

The following are KEEP unless a proven blocking defect requires a targeted fix:

1. `ONE SEMANTIC RECORD → MULTIPLE REPRESENTATIONS`;
2. authoring edits semantic/config data, not independent UI copies;
3. versioned serializable config;
4. stable IDs;
5. MediaVault lifecycle;
6. ConfigStore concept;
7. second-museum configuration model;
8. Focus / Collection Browse deriving from shared records;
9. current approved camera endpoints;
10. route semantics;
11. guide behavior;
12. current transition contracts;
13. reduced motion behavior;
14. current Museum Scene Kit architecture;
15. current runtime architecture unless authoring genuinely requires a minimal adapter.

DO NOT perform opportunistic refactors merely because code could be cleaner.

DO NOT reopen portal / Block 2B work in this mandate unless authoring causes a real regression.

If a frozen capability must change, REPORT FIRST:

- what contract is affected;
- why the change is necessary;
- the smallest change possible;
- rollback path;
- targeted validation.

### A4. WHAT MUST EXIST AT THE END OF VS02

VS02 must visibly and functionally prove:

1. a stronger premium authoring shell;
2. an Experience Tree / domain-oriented navigation;
3. authoring across the CURRENT Museum content, not only one artwork;
4. explicit upload/readiness states;
5. clear distinction between:
   - draft/edit;
   - asset loaded;
   - config saved;
   - preview applied;
   - project ready;
   - start experience;
6. Project Readiness;
7. Preview ≠ Start;
8. second museum proof;
9. image upload;
10. video upload;
11. logo upload;
12. text editing;
13. all relevant semantic representations stay synchronized;
14. real browser review URLs;
15. Playwright/browser visual QA;
16. screenshot evidence;
17. comparison board;
18. visual critic loop;
19. clear known defects;
20. human review gate.

VS02 is NOT product-approved until Juanma says so.

### A5. OUT OF SCOPE

Do NOT expand this mandate into:

- Statue + cloth physics;
- Breeze Studio integration;
- reactive sculpture implementation;
- advanced projection editor beyond what current VS02 needs;
- AI guide implementation;
- multilingual implementation;
- publishing backend;
- cloud persistence;
- user accounts;
- CRM;
- analytics platform;
- payments;
- full accessibility suite;
- global Museum redesign;
- new transition research;
- Block 3;
- arbitrary additional rooms;
- full final polish of the entire Museum.

These will come later.

---

## B. SOURCE OF TRUTH

### B1. MANDATORY DOCUMENTS

Before implementation, read the COMPLETE relevant canonical documents.

At minimum:

- `docs/architecture/MUSEUM_PREMIUM_PERSONALIZATION_PLATFORM.md`
- `docs/architecture/MUSEUM_PREMIUM_AUTHORING_IMPLEMENTATION_BRIEF.md`
- `docs/architecture/immersive-worlds/MUSEUM_CURRENT_STATE.md`

plus current Immersive Worlds module contracts relevant to authoring.

Do not skim only snippets.

Required preflight output:

**DOCS READ:**
- exact files;
- current relevant sections;
- non-negotiable product rules extracted;
- conflicts found, if any.

If docs conflict with current explicit Juanma mandate:

**Juanma’s current mandate wins.**

### B2. APPROVED VISUAL REFERENCES — MANDATORY

These two images are required visual implementation context:

- `docs/visuals/museum-authoring/museum-authoring-system-blueprint-v1.png`
- `docs/visuals/museum-authoring/museum-authoring-ui-reference-v1.png`

You must OPEN and inspect both.

Do not merely acknowledge their filenames.

In preflight, explicitly report:

```text
VISUAL REFERENCES OPENED:
YES / NO
```

Extract from them:

- hierarchy;
- workspace model;
- information density;
- preview prominence;
- editor relationships;
- media relationship;
- validation relationship;
- premium clarity;
- authoring feel;
- domain language.

IMPORTANT:

They are NOT pixel-perfect implementation specs.

Do NOT blindly copy:

- exact spacing;
- exact colors;
- exact fictional content;
- exact geometry;
- exact component dimensions;
- decorative details.

Preserve:

- product logic;
- hierarchy;
- quality bar;
- clarity;
- premium feel;
- relationship between editor and experience.

### B3. VS01 — REQUIRED BASELINE

VS01 is the baseline to improve, not something to erase.

Inspect:

- current authoring code;
- VS01 review board;
- VS01 screenshots;
- current defect log;
- current fixed defects;
- deferred defects;
- open projection defect.

Required: create a concise baseline summary before changes:

```text
VS01 KEEP
VS01 ADJUST
VS01 OPEN DEFECTS
VS01 DEFERRED
```

Do not discard existing valid work.

### B4. CURRENT MUSEUM

The real current Museum runtime is the product preview surface.

Do not create a divergent fake preview renderer.

Authoring must inspect and drive the real Museum runtime or a faithful authoring-safe path derived from it.

```text
NO SECOND RENDERING TRUTH.
```

### B5. EXTERNAL INSPIRATION BAR

Use:

`https://thevertmenthe.dault-lafon.fr/`

as an EXTERNAL QUALITY BENCHMARK.

It is NOT a template.  
It is NOT a brand source.  
It is NOT to be cloned.

Inspect it in a real browser where possible.

Capture useful visual reference states.

Extract qualities such as:

- restraint;
- composition;
- spacing;
- visual rhythm;
- typography discipline;
- art-first presentation;
- premium atmosphere;
- editorial clarity;
- use of space.

Do not import its identity.

```text
SOURCE PROJECT ≠ TARGET PRODUCT.
```

### B6. REFERENCE PRIORITY

If references compete, use this hierarchy:

1. JUANMA CURRENT MANDATE
2. PRODUCT CONTRACT / IMPLEMENTATION BRIEF
3. CURRENT WORKING MUSEUM
4. APPROVED REAL AUTHORING UI REFERENCE
5. SYSTEM BLUEPRINT
6. VS01 VALIDATED BEHAVIOR
7. EXTERNAL INSPIRATION WEBSITE

External inspiration NEVER overrides product architecture.

---

## C. ACCEPTANCE CONTRACT

### C1. EXPERIENCE TREE

VS02 must introduce a clear domain-oriented Experience Tree / navigation model.

Do NOT expose raw engine scene graph.

At minimum, current Museum content should be navigable conceptually as:

- INSTITUTION
- EXHIBITION / EXPERIENCE
- ROOMS / SPACES
- ARTWORKS
- PROJECTION
- INSTALLATIONS / SPECIAL ENTITIES where already present
- COLLECTION / MEDIA where appropriate

The exact UI is yours to derive from the approved references and current architecture.

But a user must be able to understand:

- WHAT am I editing?
- WHERE does it live?
- WHAT will change?

All CURRENT artworks should be navigable.

It is acceptable if not every entity type has every future control in VS02.

But navigation must no longer feel like “one arbitrary selected artwork”.

### C2. UPLOAD / MEDIA WORKFLOW — PRODUCT CONTRACT

This workflow is mandatory:

```text
SELECT / UPLOAD
→ LOADING
→ LOADED
→ SAVED
→ READY
→ START
```

Do not collapse these states into one vague “file chosen”.

Each asset must expose clear human-readable state.

Example:

```text
IMAGE
Selected
Loading…
Loaded
Saved
Ready
```

```text
VIDEO
Selected
Loading…
Decoded
Loaded
Saved
Ready
```

```text
ERROR
Clear reason
Clear recovery action
```

DO NOT use internal enum names as primary user-facing copy.

### C3. ASSET READY ≠ CONFIG SAVED ≠ PROJECT READY

These are separate concepts.

**ASSET READY** = the media can be decoded/rendered.  
**CONFIG SAVED** = the project configuration contains the intended reference/state.  
**PROJECT READY** = all REQUIRED authoring requirements are satisfied.

Do not conflate them.

### C4. PROJECT READINESS

Introduce first-class Project Readiness.

Conceptual states:

```text
INCOMPLETE
LOADING
READY
STARTED
```

Required vs optional content must be explicit.

Project readiness should support something like:

```text
11 / 12 required items ready
1 video loading
```

or:

```text
ALL REQUIRED CONTENT READY

[ START EXPERIENCE ]
```

Do not block START because an optional field is empty.

Do not enable START if a true blocking requirement is incomplete.

Use:

- required;
- optional;
- warning;
- blocking error;

as conceptual severity categories.

### C5. PREVIEW ≠ SAVE ≠ APPLY ≠ START

These actions must have distinct meanings.

**EDIT / DRAFT** = author changes project content  
**SAVE** = persist current config state  
**APPLY / PREVIEW** = show current authored state in Museum preview  
**VALIDATE** = determine readiness / blocking issues  
**START EXPERIENCE** = exit authoring context and enter clean visitor experience

START must NOT merely be another alias of Apply.

When START runs:

- authoring UI closes or cleanly leaves visitor view;
- required readiness is checked;
- current valid config is used;
- visitor experience begins;
- no authoring clutter remains.

### C6. CURRENT ARTWORKS

VS02 must allow navigation across ALL CURRENT artworks.

At minimum each artwork should expose relevant existing fields:

- title;
- creator;
- year;
- medium;
- description / interpretation where supported;
- image;
- video only where semantically valid;
- current presentation information where appropriate.

Do not create duplicate canonical records.

```text
ONE SEMANTIC RECORD
→ MANY REPRESENTATIONS
```

### C7. MEDIA SEMANTICS

Do not repeat the VS01 error where media destination became ambiguous.

Separate conceptual media slots.

At minimum distinguish:

- `INSTITUTION_LOGO`
- `ARTWORK_IMAGE`
- `ARTWORK_VIDEO` if the entity/runtime genuinely supports artwork video
- `PROJECTION_MEDIA`

Do not label something “artwork video” if it actually routes to Projection.

A common MediaVault is acceptable.

A common semantic slot is NOT.

### C8. LOGO

Logo authoring must be real.

Required flow:

```text
SELECT LOGO
→ LOADING
→ LOADED
→ SAVED
→ READY
→ APPLIED
```

The logo must appear in a legitimate institutional support.

Do NOT create a floating arbitrary 3D logo merely to satisfy the requirement.

Use or design a coherent institutional placement based on:

- entrance identity;
- welcome wall;
- institutional UI;
- approved Museum identity surface.

### C9. SECOND MUSEUM

The second-museum test remains mandatory.

Provide a clearly distinct Museum B / second institution config.

It must visibly differ in at least:

- institution name;
- logo;
- claim;
- one artwork image;
- one artwork title/creator or metadata;
- one media item.

NO ENGINE CODE CHANGES between Museum A and Museum B.

If engine code changes are required just to swap client identity/content:

```text
SECOND-MUSEUM TEST = FAIL
```

### C10. REAL USER TASKS — ACCEPTANCE

A real user must be able to complete:

1. Open Authoring and understand current project/room/entity.
2. Edit institution identity.
3. Upload logo and see state progression.
4. Navigate to an artwork and edit metadata.
5. Upload artwork image and see state progression.
6. Upload a valid video to the correct semantic target.
7. Save project.
8. Preview/apply project.
9. See Project Readiness.
10. Start clean visitor experience.
11. Load Museum B.
12. Return to original Museum.

If these tasks are not understandable without engineering knowledge, VS02 is not ready.

### C11. ERROR RECOVERY

Capture and validate at least one bad-media flow:

```text
INVALID FILE
→ CLEAR ERROR
→ RETRY
→ VALID FILE
→ READY
```

No silent failure.

### C12. UX LANGUAGE

Current product-facing UI should use consistent Spanish unless a defined brand term intentionally remains English.

Do not ship visible native browser text like:

```text
CHOOSE FILE
NO FILE CHOSEN
```

as the primary experience.

Wrap native file inputs in proper product UI.

### C13. AUTHORING LAYOUT

The editor must coexist with the Museum intelligently.

Do not assume overlay is correct.

Evaluate practical layout strategies using real evidence, for example:

- docked workspace;
- responsive preview resize;
- overlay;
- split view.

Choose based on:

- preview visibility;
- authoring clarity;
- museum obstruction;
- narrow viewport behavior;
- visual quality.

Do not decide this in prose alone.

Capture alternatives if needed.

### C14. MOBILE / NARROW

Authoring does not necessarily need full professional mobile parity now.

But it MUST NOT break catastrophically.

Minimum visual sanity viewports:

**DESKTOP PRIMARY** — e.g. 1440×900 or current review desktop  
**NARROW** — 420×860

No:

- horizontal explosion;
- inaccessible close button;
- hidden required controls;
- impossible scrolling;
- unreadable layout.

### C15. PREMIUM QUALITY DEFINITION

Do not interpret “AAA” as “game HUD”.

Target:

```text
AAA CRAFT QUALITY
+
MUSEUM-GRADE RESTRAINT
+
PROFESSIONAL AUTHORING CLARITY
```

Critic rubric must include:

- hierarchy;
- legibility;
- spacing;
- alignment;
- density;
- preview prominence;
- state clarity;
- feedback clarity;
- navigation clarity;
- typography;
- visual restraint;
- museum appropriateness;
- brand coherence;
- error clarity;
- consistency;
- perceived product maturity.

---

## D. GAUNTLET EXECUTION

### D1. LEAD AGENT

The lead agent owns:

- planning;
- decomposition;
- coordination;
- integration;
- evidence;
- stopping at human gate.

The lead should decide the smallest meaningful pieces that can be improved and judged independently.

Do NOT follow a rigid decomposition if the actual product suggests a better one.

### D2. BUILDER / CRITIC SEPARATION

For important visual/product workstreams:

```text
BUILDER
≠
CRITIC
```

The builder must NOT be the only judge of its own work.

Spawn fresh critics where tooling allows.

Critic context should contain:

- goal;
- product rules;
- visual bar;
- current artifact;
- reference screenshots / approved images;
- acceptance criteria.

Do NOT give the critic the builder’s history or justification unless required.

The critic judges what exists.

Not why the builder thinks it is reasonable.

### D3. REAL OUTPUT ONLY

Critics must inspect:

- real browser output;
- fresh screenshots;
- real task flow;
- real UI states.

Do not grade:

- summaries;
- architecture prose;
- builder claims.

If the pixels contradict the explanation:

```text
PIXELS WIN.
```

### D4. BLIND / SIDE-BY-SIDE A/B

Where useful, perform A/B comparison.

At minimum compare:

```text
VS01 BASELINE
vs
VS02 CANDIDATE
```

Use same:

- task;
- viewport;
- state;
- comparable content.

Where feasible, give a fresh critic:

```text
A
B
```

without implementation history.

Critic must choose:

- A BETTER
- B BETTER
- TIE

and state 1–3 biggest meaningful gaps.

Do not manufacture “blindness” theatrically.

The goal is independent judgment.

### D5. REFERENCE COMPARISON

Compare VS02 candidate against:

- approved UI reference;
- blueprint principles;
- external inspiration screenshots where useful.

Do not ask:

> Are they identical?

Ask:

> Which demonstrates better hierarchy, clarity, premium restraint, and authoring maturity?

### D6. LARGEST-GAP-FIRST LOOP

Each loop:

1. inspect current real output;
2. identify the single largest meaningful gap;
3. fix one coherent gap;
4. run;
5. capture;
6. critic review;
7. repeat.

Avoid giant multi-change batches that make it impossible to know what improved.

### D7. FAN-OUT

Fan out only where work is meaningfully separable.

Possible workstreams may include:

- information architecture / Experience Tree;
- media/readiness workflow;
- project readiness / Save/Preview/Start;
- visual shell / hierarchy;
- narrow viewport;
- QA evidence;
- final integration critic.

Do NOT spawn agents merely to increase agent count.

Use the minimum fan-out that increases quality and speed.

### D8. INTEGRATION CRITIC

After major parallel work:

spawn a fresh integration critic.

Its job:

- inspect the whole product;
- detect inconsistent spacing;
- detect inconsistent language;
- detect mismatched patterns;
- detect workstream collisions;
- detect visual fragmentation;
- verify it feels like ONE PRODUCT.

Do not redesign everything during integration.

Smooth conflicts.

### D9. LOOP STOP CONDITION

Do NOT run an infinite cosmetic loop.

Continue while:

- BLOCKER defects exist;
- HIGH defects exist;
- critical user tasks fail;
- critic clearly prefers VS01 over VS02;
- approved visual bar is materially unmet;
- media/readiness states are unclear;
- second museum proof fails.

Stop and go to HUMAN REVIEW when:

- no known blocker remains;
- no known high defect remains unless explicitly documented and accepted as open;
- core user tasks pass;
- VS02 clearly improves on VS01;
- remaining defects are medium/low or marginal polish;
- review evidence is complete.

Do not spend hours chasing 1–2 px improvements before human review.

---

## E. EFFICIENCY CONTRACT

### E1. IMPACT-MATCHED QA

```text
TEST WHAT THE CHANGE CAN BREAK.
```

Do NOT rerun all historic Museum QA from zero after every change.

Examples:

```text
media change
→ media/readiness tests
```

```text
layout change
→ browser visual + responsive tests
```

```text
Experience Tree change
→ navigation/selection tests
```

```text
config change
→ save/restore/second museum tests
```

Do not waste time on unrelated transition QA if untouched.

### E2. PRESERVE VERIFIED EVIDENCE

```text
PRESERVE VERIFIED EVIDENCE.
```

A new failure invalidates only evidence it can reasonably affect.

Do not throw away valid results unnecessarily.

### E3. CONTEXTUAL BACKTRACK

If a late-stage check fails:

```text
DO NOT restart from zero.
DO NOT resume blindly at only the failed line.
```

Re-enter through a bounded trusted validation runway.

Typical heuristic:
revalidate 2–4 meaningful predecessors where appropriate.

### E4. NO UNLIMITED POLISH

The purpose of VS02 is product advancement.

Do not create another time sink.

Prioritize:

1. product structure;
2. user workflow;
3. correctness;
4. visual hierarchy;
5. readiness clarity;
6. strong polish;
7. human review.

Do not chase local perfection while major platform capabilities remain unbuilt.

### E5. CHECKPOINTS

Before coding report:

```text
BASELINE_BRANCH
BASELINE_HEAD
TREE_STATUS
```

Use coherent commits / checkpoints by major wave.

Suggested logical checkpoints:

- Experience Tree / structure;
- media/readiness;
- Save/Preview/Start;
- visual shell;
- QA/evidence.

Exact decomposition may vary.

Rollback must remain clear.

### E6. DO NOT OVERWRITE OLD EVIDENCE

Preserve old:

- artifacts;
- review boards;
- screenshots;
- evidence packages.

Create a new traceable VS02 review surface.

Do not replace VS01 evidence.

### E7. OPEN PROJECTION DEFECT

Current known defect:

authorized projection does not visually match original / cause unresolved.

Keep it documented.

Do not spend the entire VS02 mandate solving it unless:

- VS02 directly touches Projection;
- it blocks a required acceptance task;
- or evidence proves it is caused by current authoring work.

Otherwise:

```text
OPEN KNOWN DEFECT
→ DEFERRED WITH TRACEABILITY
```

### E8. PERSISTENCE

Do not build cloud persistence in VS02.

Config persistence may remain local.

Media persistence may remain session-only if that is the safest efficient path, but the UI must not misrepresent it as durable cloud storage.

If implementing IndexedDB is small, isolated, and directly useful: propose it.

Do not silently expand scope.

---

## F. VISUAL EVIDENCE CONTRACT

### F1. REAL BROWSER

Use Playwright or equivalent real browser automation.

Visual evidence must come from the actual product.

No fake HTML-only representation unless explicitly labeled as a board.

### F2. REAL FIXTURES

Use visually discriminable QA fixtures.

Avoid:

- same image as baseline;
- same video as baseline;
- ambiguous replacements.

Fixtures should make success obvious.

Example:

- artwork image clearly different;
- video clearly different;
- logo clearly visible;
- test text clearly recognizable.

### F3. MANDATORY VIEWPORTS

At minimum capture:

- DESKTOP PRIMARY
- NARROW 420×860

If layout changes materially at another important breakpoint: capture it too.

### F4. REQUIRED SCREENSHOT STORYBOARD

Create concise visual evidence.

Suggested sequence:

1. `01_VS01_BASELINE`
2. `02_VS02_DEFAULT`
3. `03_EXPERIENCE_TREE`
4. `04_INSTITUTION_EDIT`
5. `05_LOGO_SELECTED`
6. `06_LOGO_LOADING`
7. `07_LOGO_READY`
8. `08_ARTWORK_SELECTED`
9. `09_ARTWORK_EDIT`
10. `10_IMAGE_SELECTED`
11. `11_IMAGE_LOADING`
12. `12_IMAGE_READY`
13. `13_VIDEO_SELECTED`
14. `14_VIDEO_READY`
15. `15_CONFIG_SAVED`
16. `16_PROJECT_READY`
17. `17_PREVIEW_APPLIED`
18. `18_VISITOR_START`
19. `19_FOCUS_UPDATED`
20. `20_BROWSE_UPDATED`
21. `21_MUSEUM_B`
22. `22_RESTORED_ORIGINAL`
23. `23_INVALID_MEDIA_ERROR`
24. `24_RECOVERY`
25. `25_NARROW_VIEW`

Reduce if some frames are redundant.

Do not produce hundreds of screenshots.

### F5. SCREENSHOT METADATA

Each captured state must be traceable.

Record:

- HEAD SHA;
- CAPTURE RUN ID;
- TIMESTAMP;
- VIEWPORT;
- CONFIG / MUSEUM;
- STATE;
- ACTION;
- EXPECTED;
- OBSERVED.

### F6. REVIEW BOARD

Build a new VS02 visual review board.

Each item should show:

- STATE;
- ACTION;
- EXPECTED;
- OBSERVED;
- STATUS.

Where useful:

- before;
- after;
- reference;
- candidate.

Include VS01 vs VS02 comparisons.

### F7. LIVE PROGRESS PAGE

Maintain a simple live progress / gauntlet page during the work.

It should show:

- current wave;
- current HEAD;
- builder status;
- critic verdict;
- biggest remaining gap;
- latest screenshots;
- fixed defects;
- open defects;
- review links.

Do not require Juanma to interrupt the run for status.

### F8. VISUAL SELF-REVIEW

Claude must LOOK at the screenshots.

Do not merely generate them.

For each wave, report:

**VISUAL DEFECTS FOUND**

with:

- severity;
- evidence;
- cause if known;
- correction;
- fixed / deferred.

### F9. CONSOLE / RUNTIME SIGNALS

Visual review should also record concise runtime status:

- console errors;
- media state;
- current config version;
- current project readiness;
- duplicate authoring panel count;
- obvious resource leak signals where relevant.

Do not turn the visual board into a debug console.

Just enough to prove the pixels are trustworthy.

### F10. REVIEW URLS — MANDATORY

At final handoff provide:

- LOCAL EXPERIENCE URL;
- LOCAL AUTHORING URL;
- LOCAL REVIEW BOARD URL;
- LIVE GAUNTLET PROGRESS URL;
- CLAUDE ARTIFACT URL if available.

Do not give only repo paths.

Juanma must be able to CLICK AND LOOK.

### F11. NEW ARTIFACT

Do not overwrite previous artifact.

Create a new traceable review artifact for VS02.

---

## G. HUMAN AUTHORITY

Claude may:

- implement;
- test;
- critique;
- recommend;
- compare;
- flag defects.

Claude may NOT:

- declare final product approval;
- merge to master/main;
- promote canonical status;
- delete prior working variants/evidence;
- decide final visual winner on behalf of Juanma;
- reopen unrelated product blocks without instruction.

Canonical distinction:

```text
TECHNICALLY CLOSED
≠
VISUALLY APPROVED
≠
PRODUCT APPROVED
```

Juanma is the final visual/product authority.

### G2. PRODUCT REVIEW STATES

Use these states:

- `TECHNICALLY_READY`
- `VISUALLY_REVIEWABLE`
- `PRODUCT_APPROVAL_PENDING`
- `PRODUCT_APPROVED` only after explicit Juanma approval

### G3. HUMAN GATE

At the end:

STOP.

Do not continue into:

- Statue + Cloth;
- AI Guide;
- advanced Projection;
- Block 3;
- final Museum polish;
- merge.

Wait for Juanma + ChatGPT review.

---

## PREFLIGHT — REQUIRED BEFORE CODING

Report:

```text
BRANCH:
HEAD:
TREE STATUS:

DOCS READ:
VISUAL REFERENCES OPENED:
VS01 BASELINE REVIEWED:
CURRENT OPEN DEFECTS:
FROZEN CONTRACTS:

PROPOSED MINIMAL VS02 PLAN:

GAUNTLET WORKSTREAMS:
BUILDER/CRITIC PLAN:

BASELINE REVIEW URLS:
CURRENT LOCAL URL:
```

Then implement.

---

## FINAL DEFINITION OF DONE

VS02 may enter human review only if:

- [ ] Experience Tree is usable
- [ ] all current artworks are navigable
- [ ] image workflow is explicit
- [ ] video workflow is explicit
- [ ] logo workflow is explicit
- [ ] `SELECT → LOADING → LOADED → SAVED → READY` is visible
- [ ] Project Readiness exists
- [ ] required vs optional is defined
- [ ] Preview ≠ Start
- [ ] Start enters clean visitor mode
- [ ] semantic records remain single-source
- [ ] second museum works without engine changes
- [ ] bad media recovery works
- [ ] Spanish product language is coherent
- [ ] desktop works
- [ ] narrow viewport does not break
- [ ] VS02 visually beats VS01
- [ ] fresh critic has reviewed real output
- [ ] integration critic has reviewed complete product
- [ ] visual evidence board exists
- [ ] live progress page exists
- [ ] review URLs exist
- [ ] HEAD/run IDs are documented
- [ ] no blocker remains
- [ ] no unexplained high defect remains
- [ ] old evidence is preserved
- [ ] no merge occurred

---

## FINAL HANDOFF FORMAT

```text
BRANCH:
FINAL HEAD:
TREE STATUS:

VS02 PRODUCT SUMMARY:

WHAT REMAINED FROZEN:

WHAT CHANGED:

EXPERIENCE TREE:

MEDIA WORKFLOW:

PROJECT READINESS:

SAVE / PREVIEW / START:

SECOND MUSEUM TEST:

GAUNTLET:
- workstreams
- builders
- critics
- number of meaningful loops
- biggest gaps found
- biggest improvements made

FUNCTIONAL QA:

VISUAL QA:

VS01 vs VS02 RESULT:

CRITIC VERDICT:

INTEGRATION CRITIC VERDICT:

OPEN DEFECTS:

DEFERRED:

LOCAL EXPERIENCE URL:

LOCAL AUTHORING URL:

VISUAL REVIEW BOARD URL:

LIVE GAUNTLET PAGE URL:

ARTIFACT URL:

CAN A SECOND MUSEUM USE THIS VS02 WITHOUT ENGINE CHANGES?
YES / NO

PRODUCT APPROVAL:
PENDING

NO MERGE
```

Required final line:

```text
MUSEUM AUTHORING VS02 — GAUNTLET VISUAL REVIEW READY FOR JUANMA + CHATGPT
```
