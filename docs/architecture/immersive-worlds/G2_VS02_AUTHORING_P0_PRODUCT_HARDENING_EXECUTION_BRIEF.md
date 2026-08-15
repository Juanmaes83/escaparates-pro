# G2 — MUSEUM STUDIO / AUTHORING
## P0 PRODUCT HARDENING — HUMAN QA #3 FOLLOW-UP

**Execution authority:** implementation authorized only inside the bounded P0 mission below.

**Canonical product surface:** VS02 / Full Museum Studio.

**Preserve:** `author.html` as Advanced / Technical Authoring. Keep VS01 as fallback/reference for now.

**Core rule:** PRESERVE PROVEN CAPABILITY. FIX THE PRODUCT SURFACE. REUSE BEFORE INVENTION.

This brief MUST be executed under the repository's current Museum Autonomous Visual Engineering Playbook and its operative Human QA Runtime Protocol. The Playbook governs sequencing, evidence, fresh critic, Human Gate, scope control, Global Outcome Stability, instrument trust, learning capture, and no merge/promotion without Juanma's explicit approval.

---

## 0. GLOBAL FREEZE / MISSION BOUNDARY

G1 TRANSITION remains frozen at Human Gate.

DO NOT TOUCH:
- Transition / Crossing A;
- Transition / Crossing B;
- PortalSurface;
- shader treatment;
- destination endpoints;
- T1–T6;
- camera route semantics;
- Visitor movement;
- Guide;
- Sculpture;
- Cloth;
- Breeze;
- unrelated Scene Kit systems;
- master;
- merge/promotion.

Crossing B remains:

**HUMAN-PREFERRED BASELINE.**

This mission is G2 AUTHORING ONLY.

---

## 1. HUMAN QA RESULT

Juanma has manually tested the REAL VS02 Museum Studio.

Overall verdict:
- FULL MUSEUM STUDIO VS02 = KEEP
- PRODUCT ARCHITECTURE = KEEP
- VISUAL DIRECTION = KEEP / REFINE
- SEMANTIC AUTHORING = KEEP
- LIVE 3D PREVIEW = KEEP
- MEDIA UPLOAD PIPELINE = KEEP

Human QA found three P0 issues that currently prevent Authoring from reaching the required product-quality bar:

1. **P0.1 — VISITOR AUTHORING LAYOUT IS BROKEN**
2. **P0.2 — MEDIA ASSETS ARE NOT PERSISTENT PROJECT ASSETS**
3. **P0.3 — AUTHORING → PUBLISHED VISITA PROPAGATION IS NOT YET PROVEN**

These are the only implementation priorities for this mission.

Do NOT expand scope into secondary features before these are solved.

---

## 2. P0.1 — VISITOR AUTHORING UX / LAYOUT

Human QA directly observed that the VISITANTE workspace becomes unusable.

Symptoms:
- content rendered in an extremely narrow column;
- words split across multiple lines;
- text fields truncated;
- inputs too narrow to understand or edit;
- excessive vertical scrolling;
- horizontal compression;
- reservation URLs difficult to read/edit;
- hierarchy collapses;
- Preview loses useful space without the editor gaining enough room;
- the experience feels broken rather than merely dense.

Classification:

**FUNCTIONAL UX DEFECT + RESPONSIVE / LAYOUT DEFECT**

NOT a data-model rejection.

The Visitor information concept itself is valid.

Do NOT solve this by simply adding a few pixels to the current narrow column.

The layout model must adapt to the editing task.

Principle:

**CONSISTENT SYSTEM ≠ IDENTICAL LAYOUT FOR EVERY AUTHORING TASK**

When a domain contains form-heavy editorial content, it must receive enough space to be actually usable.

---

## 3. TARGET VISITOR WORKSPACE

Preserve the overall VS02 visual system.

But make VISITANTE behave as a proper editorial workspace.

Target information hierarchy:

VISITANTE
- INFORMACIÓN
- ACCIONES
- PROGRAMACIÓN
- ACCESIBILIDAD
- IDIOMAS / GUÍA where already supported

Candidate UX:

`[ INFORMACIÓN ] [ ACCIONES ] [ PROGRAMACIÓN ] [ ACCESIBILIDAD ]`

with a real-width form editor + live preview.

Do not blindly adopt tabs if another existing VS02 pattern is stronger.

What matters:
- readable fields;
- usable forms;
- clear hierarchy;
- no cut text;
- no microscopic controls;
- no unnecessary horizontal scroll;
- Preview remains materially visible;
- contextual editing remains obvious.

Use progressive disclosure where appropriate.

---

## 4. VISITOR INFORMATION DATA

Audit the existing data model before changing it.

The product needs to be able to represent, at minimum where authority already supports it:
- opening hours;
- address;
- accessibility;
- admission / price;
- ticket information;
- reservations;
- guided visits;
- events;
- contact;
- transport;
- parking;
- programme.

Do NOT convert structured existing records back into free text.

Where a field is currently only a string but clearly requires structure, classify it explicitly before changing the model.

---

## 5. OPENING HOURS

Human QA shows that a single compressed text input is not a strong long-term product model.

Audit whether structured opening hours already exist elsewhere in Escaparates Pro or Museum.

Preferred semantic direction if compatible with existing authority:
- weekday;
- open / closed;
- opening time;
- closing time;
- optional notes;
- optional exceptional dates / special hours.

Do NOT overbuild a scheduling platform in this mission.

If the current data contract cannot safely evolve without broader implications:
- prepare the structured model;
- document the migration;
- stop at the appropriate Human Gate.

Do not silently break existing Visitor content.

---

## 6. ACTION AUTHORING — RESERVATIONS / TICKETS / CONTACT

Current Human QA suggests some actions are effectively raw URL fields.

That is not enough as the final product abstraction.

Audit the existing ACTION semantics.

Target concept:

**ACTION ≠ BUTTON STYLE ≠ RAW URL**

An authored action should be able to represent where applicable:
- enabled / disabled;
- label;
- action type;
- destination / URL;
- priority;
- target behaviour.

Relevant actions:
- RESERVAR VISITA
- COMPRAR ENTRADA
- VER PROGRAMACIÓN
- CÓMO LLEGAR
- CONTACTAR
- AÑADIR AL CALENDARIO

where supported.

Do NOT build arbitrary workflow automation.

Create or evolve only the minimum semantic model required for Museum.

---

## 7. PROGRAMME

Programme currently exists conceptually but is visually buried.

Audit its current model and current VS02 UI.

It must become clearly understandable as an editorial area.

Programme concepts may include, where currently supported or already planned by authority:
- current exhibition;
- upcoming exhibitions;
- guided visits;
- talks;
- workshops;
- performances;
- events;
- archive.

Do NOT build unsupported categories merely to fill a menu.

Immediate goal:

**PROGRAMME MUST BE FINDABLE, READABLE AND EDITABLE.**

---

## 8. ACCESSIBILITY

Keep existing accessibility authoring.

Improve its usability only where needed for the Visitor workspace.

Do not expand into an enormous accessibility platform during this P0.

If the current model already supports items such as:
- wheelchair access;
- accessible entrance;
- subtitles;
- transcripts;
- audio description;
- easy read;
- assistance;
- contact;

surface them coherently.

If not, record them as future schema candidates rather than silently expanding scope.

---

## 9. ADAPTIVE STUDIO LAYOUT

Audit VS02 layout architecture before implementation.

Potential product behaviours to evaluate:
- collapsible Experience Tree;
- collapsible Project Readiness;
- collapsible Collection strip;
- wider contextual editor;
- Focus Editor mode;
- Focus Preview mode;
- Split View.

Do NOT implement every candidate merely because it is listed.

Use the minimum layout change that solves the demonstrated Human QA defect and improves scalability.

Hard requirement:

**THE USER MUST NEVER AGAIN SEE VISITOR FIELDS COMPRESSED INTO AN UNUSABLE SLIVER.**

Test at realistic widths, not only Juanma's very wide monitor.

At minimum test:
- 1920×1080
- 1440×900
- 1366×768

If the Studio explicitly supports smaller/tablet widths, test those too.

Do not claim mobile support unless product authority requires it.

---

## 10. READINESS / WARNINGS

KEEP Readiness.

It is a valuable product feature.

But Human QA found that it consumes permanent space and warnings become visually noisy.

Evaluate whether Readiness should be:
- collapsible;
- contextually minimized;
- expandable on demand.

Warnings should become actionable summaries rather than walls of text.

Target pattern:

`AVISOS · 6`

Each item:
- problem;
- `[VER]`.

Expanded:
- issue;
- impact;
- recommended correction.

Do not delete diagnostics. Reduce visual noise.

---

## 11. COLLECTION STRIP

KEEP the artwork / collection strip.

But it does not need to consume permanent vertical space during every authoring task.

Especially in VISITANTE it adds little value.

Evaluate:

**COLLECTION STRIP → COLLAPSIBLE / CONTEXTUAL**

Do not remove it globally.

---

## 12. P0.2 — PERSISTENT MEDIA / PROJECT ASSET LIBRARY

This is the second major P0.

Current known state:
- CONFIG RECORDS can persist.
- MEDIA VAULT uses browser object URLs.

Therefore:

**MEDIA FILE ≠ PERSISTENT PROJECT ASSET**

A file uploaded into Museum must not disappear when the browser session ends.

This is a product trust requirement.

Do NOT solve this with:
- fake localStorage references;
- base64 blobs shoved into config;
- permanent object URLs;
- misleading `GUARDADO` labels.

Before writing new storage infrastructure:

**SEARCH THE EXISTING ESCAPARATES PRO CAPABILITY BASE.**

Specifically audit existing first-party systems related to:
- Project Cloud;
- media upload;
- asset upload sessions;
- object storage;
- R2;
- project assets;
- versioning;
- optimistic concurrency;
- publish/unpublish;
- media catalogue;
- persistent project storage.

**OWNED PROVEN PATTERNS SHOULD BE REUSED BEFORE NEW ONES ARE INVENTED.**

---

## 13. ASSET PERSISTENCE ARCHAEOLOGY

Before implementation, produce a short technical decision record identifying:
- existing storage capability;
- current canonical implementation;
- reusable API/client pieces;
- ownership/licensing constraints;
- compatibility with Museum;
- required adaptation;
- why reuse is safer than building a second storage stack.

We already know Escaparates Pro contains Project Cloud / upload infrastructure.

Prove what is reusable. Do not assume.

---

## 14. TARGET ASSET LIFECYCLE

The Museum product needs a truthful asset lifecycle.

Conceptual target:

`SELECTED → UPLOADING → PROCESSING / DECODING → READY → SAVED → AVAILABLE IN PROJECT → ASSIGNED / IN USE`

Error state:

`ERROR`

Important:

**READY ≠ SAVED**

SAVED must mean the actual asset survives the session and belongs to the project.

If persistence cannot be completed safely in this slice, do NOT display SAVED. Use truthful language.

---

## 15. GLOBAL MEDIA LIBRARY

VS02 already contains media catalogue capabilities.

Evolve/reuse them into a clearly accessible project-level Media Library where possible.

The author should be able to see:
- thumbnail / poster;
- filename;
- type;
- dimensions;
- duration;
- file size;
- status;
- where the asset is used;
- replace;
- remove;
- assign / reuse.

Do not rebuild the existing catalogue if it already provides this data. Expose it correctly.

Important:

**UPLOAD INSIDE AN ARTWORK** and **GLOBAL PROJECT MEDIA LIBRARY** should use the SAME underlying asset system.

No duplicate asset truths.

---

## 16. ASSET REUSE

A project asset should be assignable in more than one valid location without requiring re-upload.

Conceptual flow:

`UPLOAD ONCE → PROJECT ASSET → ASSIGN TO artwork / projection / logo / other supported media slots`

Respect slot/media compatibility.

Do not allow unsupported media silently.

---

## 17. SAVE SEMANTICS

Human QA exposed a trust problem around the word `GUARDAR`.

The Studio must distinguish:

**CONFIG CHANGES** from **MEDIA UPLOAD / PERSISTENCE**.

Recommended state vocabulary:
- CAMBIOS SIN GUARDAR
- GUARDANDO…
- GUARDADO · <time>
- MEDIA SUBIENDO
- MEDIA PENDIENTE
- ERROR AL GUARDAR

Do not claim `TODO GUARDADO` while actual asset bytes are still session-only or upload is incomplete.

This is a Product Trust issue.

---

## 18. P0.3 — AUTHORING → PUBLISHED VISITA CONNECTION

Third P0:

We must prove that Authoring drives the Visitor experience.

Intended contract:

`STUDIO → AUTHORITATIVE CONFIG / DATA → PUBLISHED / PREVIEW EXPERIENCE → VISITA`

No duplicated hard-coded Visitor truth.

Audit every current Visitor-facing field.

At minimum verify:
- institution identity;
- opening hours;
- address;
- admission;
- reservation CTA;
- ticket CTA if present;
- accessibility;
- programme;
- contact / how to get there where supported.

For each one classify:
- CONNECTED
- PARTIALLY CONNECTED
- HARDCODED
- NOT REPRESENTED

---

## 19. TRACEABILITY MATRIX

Create a concrete traceability matrix:

`AUTHORING FIELD → CONFIG PATH → RUNTIME CONSUMER → VISITOR SURFACE → STATUS`

Example only:

`Opening hours → visitor.openingHours → visitor-panel renderer → VISITA / Horarios → CONNECTED`

Do not invent paths. Use actual code.

This matrix becomes permanent project documentation if useful.

---

## 20. REAL ROUND-TRIP QA

After implementation, do not test merely that controls exist.

Perform a real author round trip using a clearly recognizable QA configuration:
- change institution name;
- change opening hours;
- change address;
- configure reservation CTA;
- change at least one accessibility field;
- create/change one Programme item if supported;
- upload a real image;
- upload a real video;
- save;
- reload;
- reopen Studio;
- confirm config survived;
- confirm actual media survived;
- reuse an existing media asset;
- preview;
- enter Visitor / Published experience;
- open VISITA;
- verify authored information appears correctly.

If any cannot be truthfully demonstrated, do not report PASS.

---

## 21. PERSISTENCE QA

Persistent asset QA must include:

SESSION A
1. upload image
2. upload video
3. save
4. record asset identifiers
5. close/reload environment

SESSION B
6. reopen project
7. assets still exist
8. thumbnails/posters still exist
9. assignments still exist
10. Visitor/runtime still resolves them

Replacement QA:
11. replace an asset
12. old assignment updates correctly
13. no orphan/leak if architecture supports cleanup

Failure QA:
14. unsupported media
15. failed upload
16. network/storage failure where testable
17. truthful state shown

---

## 22. VISITOR UX QA

For the redesigned VISITANTE workspace, Human QA acceptance requires:
- no cut words;
- no unusably narrow inputs;
- no accidental horizontal scrolling;
- labels readable;
- URLs editable;
- controls reachable;
- Preview visible;
- Save state visible;
- errors readable;
- sections clearly separated;
- Programme findable;
- Actions findable;
- Accessibility findable.

Use screenshots at each required viewport.

**PIXELS WIN.**

---

## 23. VISUAL EVIDENCE

Produce a compact evidence set:
- BEFORE — current broken Visitor layout;
- AFTER — corrected Visitor layout;
- Media Library with real uploaded image + video;
- Persistence proof after reload;
- Authoring → Visitor matched evidence: Studio value vs VISITA published result;
- 1920×1080;
- 1440×900;
- 1366×768.

Do not flood evidence with redundant screenshots.

---

## 24. FRESH AMNESIAC CRITIC

After implementation and deterministic QA, run a FRESH process-amnesiac, standards-rich critic.

Critic sees:
- current Human QA screenshot / BEFORE;
- new Studio;
- relevant original Authoring Board / Blueprint;
- Media workflow;
- Visitor round trip;
- responsive evidence.

Critic must judge:
1. Is VISITANTE now genuinely usable?
2. Is the information architecture understandable to a museum professional?
3. Does the Preview remain the product?
4. Is media upload discoverable?
5. Is asset persistence truthful?
6. Is save state truthful?
7. Does Visitor output match authored data?
8. Did implementation preserve VS02's premium visual language?
9. Did technical complexity leak into primary UX?
10. Did any previous working capability regress?

Return KEEP / ADJUST / REJECT.

**AGENT KEEP ≠ HUMAN APPROVAL.**

---

## 25. ORIGINAL BOARD / BLUEPRINT

Use the existing Museum Authoring Board / Blueprint as visual/product authority.

Do not redesign from imagination.

Compare:

`ORIGINAL BOARD vs CURRENT VS02 vs HUMAN QA FINDINGS vs NEW IMPLEMENTATION`

Where current product intentionally evolved beyond Board, document why.

Do not force literal imitation if it would regress working product.

---

## 26. P1 ITEMS — AUDIT ONLY, DO NOT EXPAND YET

During this mission you may identify, but DO NOT broadly implement unless required by a P0 dependency:
- deeper Exhibition model;
- richer Programme model;
- advanced Accessibility model;
- search;
- Undo / Redo;
- History / Versions;
- roles / permissions;
- Publish / Output Center;
- advanced responsive/mobile Studio;
- collaboration;
- workflow approvals.

Record these as P1 / FUTURE.

Do not let them derail P0.

---

## 27. AUTHOR.HTML / ADVANCED

DO NOT delete or visually merge `author.html` into VS02.

Keep:

`ENGINE WORLD EDITOR = ADVANCED / TECHNICAL TOOL`

Later the canonical Studio may expose an explicit Advanced entry, but only if it can be added without role confusion.

Visitor must never see it.

---

## 28. VS01

Do not delete VS01 during this mission.

Mark/document it as FALLBACK / LEGACY AUTHORING SURFACE unless evidence proves another role.

No need to enhance it.

All product investment goes to VS02.

---

## 29. DOCUMENTATION / LEARNING

Update the appropriate Museum project memory with verified findings.

Important durable lessons likely include:
- PRODUCT SURFACE DISCOVERABILITY — capability is not Human-QA-ready if correct surface cannot be found;
- CONFIG PERSISTENCE ≠ ASSET PERSISTENCE;
- READY ≠ SAVED;
- CONSISTENT SYSTEM ≠ IDENTICAL LAYOUT FOR EVERY TASK;
- AUTHORING FIELD MUST HAVE A TRACEABLE RUNTIME CONSUMER;
- REUSE FIRST-PARTY STORAGE BEFORE CREATING PARALLEL STORAGE.

Only promote to the Playbook if generalizable and validated.

Do NOT modify the global Playbook automatically unless existing authority permits it.

---

## 30. IMPLEMENTATION STRATEGY

Preferred order:

### PHASE A — RECONCILE
- read authority;
- inspect current VS02;
- inspect Board;
- inspect current Visitor model;
- inspect existing Project Cloud / asset infrastructure;
- write gap/root-cause map.

### PHASE B — VISITOR UX
- solve broken layout;
- preserve design language;
- responsive QA.

### PHASE C — PERSISTENT ASSETS
- reuse proven storage;
- connect Media Library;
- truthful asset lifecycle.

### PHASE D — AUTHORING → VISITOR
- remove duplicated truth where possible;
- wire authored data to VISITA;
- traceability matrix.

### PHASE E — INTEGRATION QA
- real uploads;
- reload/persistence;
- preview;
- Visitor;
- responsive;
- fresh critic.

### PHASE F — HUMAN GATE
- navigable VS02 URL;
- precise commit;
- evidence;
- stop.

If any phase reveals global architectural risk, do NOT bulldoze through it. Use PREPARATION ONLY or HUMAN GATE.

---

## 31. NO DESTRUCTIVE SHORTCUTS

PROHIBITED:
- rewriting VS02 from scratch;
- deleting author.html;
- deleting VS01;
- changing Transition;
- changing route endpoints;
- moving approved camera beats;
- replacing the semantic content model with ad-hoc form state;
- duplicating Visitor data;
- creating a second media storage stack without proving no reusable one exists;
- calling object URLs `saved`;
- hiding errors;
- changing master;
- merging without Juanma approval.

---

## 32. REQUIRED FINAL DELIVERY

Deliver:

A — ROOT CAUSE REPORT
- Visitor layout
- Media persistence
- Authoring→Visitor

B — EXISTING CAPABILITY REUSE
- exact first-party systems reused

C — FILES CHANGED
- every product file and why

D — VISITOR UX BEFORE/AFTER

E — MEDIA ASSET LIFECYCLE

F — PERSISTENCE PROOF
- Session A → Session B

G — MEDIA LIBRARY PROOF

H — AUTHORING→VISITA TRACEABILITY MATRIX

I — ROUND-TRIP TEST
- Studio → Save → Reload → Preview → Visitor

J — RESPONSIVE QA
- 1920×1080
- 1440×900
- 1366×768

K — REGRESSION QA
- Content
- Experience
- Build
- Media
- Readiness
- Preview
- second museum dataset
- author.html still boots
- VS01 still boots
- Visitor still boots

L — FRESH CRITIC
- KEEP / ADJUST / REJECT

M — OPEN P1 ITEMS
- without implementing them

N — HUMAN QA ACCESS
- exact FULL VS02 Studio URL
- commit-pinned or branch alias clearly stated
- branch
- commit
- reproduction instructions

O — BRANCH / HEAD / TREE

---

## 33. HUMAN QA PACKAGE

The next Human QA must be easy for Juanma.

Give him a short test path:
1. TEST 1 — VISITOR AUTHORING
2. TEST 2 — RESERVATION / CTA
3. TEST 3 — PROGRAMME
4. TEST 4 — IMAGE UPLOAD
5. TEST 5 — VIDEO UPLOAD
6. TEST 6 — SAVE
7. TEST 7 — RELOAD
8. TEST 8 — REUSE ASSET
9. TEST 9 — PREVIEW
10. TEST 10 — PUBLISHED VISITA

Do not make Juanma discover routes or parameters again.

**PREVIEW ACCESS IS PART OF THE DELIVERABLE.**

---

## FINAL STATUS FORMAT

End exactly with:

```text
G1 TRANSITION: FROZEN AT HUMAN GATE — UNTOUCHED
CROSSING B: HUMAN-PREFERRED BASELINE — UNTOUCHED

G2 VS02 CANONICAL STUDIO: <KEEP / ADJUST / REJECT>

VISITOR AUTHORING UX:
<PASS / ADJUST / FAIL>

VISITOR RESPONSIVE LAYOUT:
<PASS / ADJUST / FAIL>

MEDIA UPLOAD:
<PASS / ADJUST / FAIL>

PERSISTENT PROJECT ASSET LIBRARY:
<PASS / PARTIAL / FAIL>

ASSET REUSE:
<PASS / PARTIAL / FAIL>

SAVE STATE TRUTHFULNESS:
<PASS / ADJUST / FAIL>

AUTHORING → PUBLISHED VISITA:
<PASS / PARTIAL / FAIL>

RESERVATION / CTA:
<PASS / PARTIAL / FAIL>

PROGRAMME:
<PASS / PARTIAL / FAIL>

ACCESSIBILITY:
<PASS / PARTIAL / FAIL>

AUTHOR.HTML ENGINE EDITOR:
PRESERVED

VS01:
PRESERVED

FRESH CRITIC:
<KEEP / ADJUST / REJECT>

HUMAN QA:
PENDING

PRODUCT APPROVAL:
PENDING

MASTER:
UNTOUCHED
```
