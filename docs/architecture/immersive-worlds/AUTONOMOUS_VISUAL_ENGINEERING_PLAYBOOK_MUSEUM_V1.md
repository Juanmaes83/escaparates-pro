# AUTONOMOUS VISUAL ENGINEERING PLAYBOOK — MUSEUM V1

> **Status:** MUSEUM PILOT PROCESS STANDARD — REQUIRES JUANMA REVIEW BEFORE GENERALIZATION  
> **Repository:** `Juanmaes83/escaparates-pro`  
> **Applies to:** Immersive Worlds / Museum / Institutional Experiences  
> **Purpose:** enable long, efficient autonomous implementation runs without sacrificing product safety, visual quality, evidence quality, or human authority.  
> **Product Owner / Visual Authority / Merge Authority:** Juanma  
> **Implementation agent:** Claude Code  
> **Review partners:** ChatGPT + Juanma  
> **Core rule:** **efficiency never means putting the project at risk.**

---

# 0. PRIME DIRECTIVE

The project must never be placed at unnecessary risk in the name of autonomy, speed, token efficiency, convenience, or overnight progress.

Canonical safety rules:

> **UNCERTAINTY ABOUT GLOBAL IMPACT = NO FULL CONTINUATION.**

> **LOCAL INDEPENDENCE IS NOT ENOUGH. CONTINUATION REQUIRES GLOBAL OUTCOME STABILITY.**

> **IF FULL STABILITY CANNOT BE DEMONSTRATED, DOWNGRADE TO PREPARATION-ONLY OR STOP.**

> **A PAUSED MISSION MAY NOT BE SILENTLY MODIFIED WHILE AWAITING HUMAN QA.**

> **NEVER INVENT A NEW MISSION JUST TO AVOID WAITING.**

> **FUNCTIONAL PASS ≠ PRODUCT PASS. PIXELS WIN.**

---

# 1. WHY THIS PLAYBOOK EXISTS

The Museum project has demonstrated that Claude performs materially better when execution authority, references, evidence, learned rules and QA expectations live in the repository instead of only in transient chat.

The working model is:

```text
CHAT
= immediate intent / decision / correction

REPOSITORY
= durable authority / contracts / references / evidence / learning
```

The repository must become the persistent operational memory of the project.

A short chat instruction should often be enough:

> Read `docs/.../MANDATE.md`, reconcile it against the actual tree, and execute it.

Claude must not depend on remembering a long conversation correctly.

---

# 2. AUTHORITY ORDER

When instructions or evidence conflict, use this order unless Juanma explicitly changes it:

```text
1. Latest explicit Juanma decision
2. Frozen / approved project contracts
3. Current mission mandate in repository
4. Canonical source code / donor implementation
5. Canonical visual reference / video / storyboard
6. Existing architecture documentation
7. Current implementation
8. Agent inference
```

Agent inference must never override a stronger source silently.

If code and visual interpretation disagree, inspect the code and record the discrepancy.

---

# 3. REFERENCE AUTHORITY LABELS

Every important external or internal reference should be classified.

```text
CANONICAL
= target behaviour/result that acceptance is measured against

DONOR
= proven implementation/capability from which reuse/adaptation is expected

REFERENCE
= useful comparison or design benchmark

INSPIRATION
= optional directional material, not acceptance truth
```

Do not treat inspiration as canonical truth.

Whenever possible, canonical videos, images, source screenshots, storyboards and donor notes should be stored in the repository.

---

# 4. REFERENCE-FIRST IMPLEMENTATION

Before inventing a solution, determine whether the capability already exists in:

- current Museum code;
- another Immersive Worlds surface;
- first-party donor modules;
- Scene Kits;
- Breeze Studio Pro;
- Infinite Worlds;
- Three.js examples already reused in first-party code;
- other repositories owned by Juanma.

If a proven first-party implementation exists, create a capability map before rebuilding it.

Required labels:

```text
DIRECT REUSE
ADAPT
ALREADY PRESENT
MISSING
INCOMPATIBLE — with documented reason
```

Do not rewrite working capability merely because rebuilding appears easier.

---

# 5. STANDARD MISSION LIFECYCLE

Every bounded vertical follows:

```text
CONTRACT / QUESTION
→ RECONCILE CURRENT TREE
→ IDENTIFY REFERENCES / DONORS
→ IMPLEMENT
→ TARGETED FUNCTIONAL QA
→ REAL OUTPUT / BROWSER QA
→ VISUAL EVIDENCE
→ FRESH VISUAL CRITIC
→ HUMAN GATE
→ DECISION
```

The unit of work should remain small enough that causality is understandable.

Canonical principle:

> **ONE QUESTION → ONE IMPLEMENTATION → TARGETED QA → VISUAL EVIDENCE → HUMAN DECISION.**

Avoid open-ended autonomous polishing loops.

---

# 6. VISUAL ENGINEERING PIPELINE

When motion, interaction, composition or visual behaviour has a reference, use:

```text
REFERENCE VIDEO / IMAGE / EXPERIENCE
        ↓
FRAME / STATE ANALYSIS
        ↓
CANONICAL STORYBOARD OR COMPARISON SHEET
        ↓
CAPABILITY / SOURCE MAP
        ↓
IMPLEMENTATION
        ↓
REAL IMPLEMENTATION CAPTURE
        ↓
MATCHED STORYBOARD / BEFORE-AFTER
        ↓
SIDE-BY-SIDE COMPARISON
        ↓
FRESH VISUAL CRITIC
        ↓
HUMAN QA
```

Storyboard frames must be selected by **visual, interaction or narrative function**, not mechanically at equal time intervals.

Examples:

- portal transition: acquire → approach → takeover → crossing → reverse exit → recoil → reveal → settle;
- reactive cloth: idle → wind onset → lift → anchor tension → collision → maximum reaction → damping → settle;
- free visitor movement: enter → explore → discover viewpoint → approach → occupy viewpoint → composition resolves → optional content → leave freely.

---

# 7. PIXELS WIN

Tests prove contracts. They do not automatically prove product quality.

Possible state:

```text
FUNCTIONAL QA          PASS
CONSOLE                CLEAN
SEMANTIC CONTRACT      PASS
VISUAL PRODUCT         FAIL
```

This is valid and must be reported honestly.

If Juanma visually rejects a surface, it is not product-approved even if internal tests pass.

For important visual surfaces, prefer evidence such as:

```text
SOURCE vs CURRENT
BEFORE vs AFTER
APPROVED SURFACE vs NEW SURFACE
DESKTOP vs MOBILE
MUSEUM A vs MUSEUM B
```

Never substitute prose for evidence when visual comparison is possible.

---

# 8. BUILDER ≠ CRITIC

The implementation pass cannot be its own final authority.

Required separation:

```text
BUILDER
↓
FUNCTIONAL QA
↓
FRESH VISUAL CRITIC
↓
EVIDENCE PACKAGE
↓
JUANMA + CHATGPT
```

Claude may state:

```text
INTERNAL QA: PASS
CLAUDE VISUAL CRITIC: PASS
HUMAN QA: PENDING
```

Claude may not convert that into Product Approval.

---

# 9. RESPONSIVE + PLATFORM PROOF

For visually significant Museum surfaces, a single desktop screenshot is insufficient.

Default visual proof set when relevant:

```text
DESKTOP
+ MOBILE
+ SECOND DATASET / SECOND MUSEUM
```

Recommended viewport set for responsive UI work:

```text
1440×900
1280×800
390×844
360×800
```

The second museum proves platform reuse instead of a hardcoded demo.

Mobile is a distinct composition target, not merely desktop collapsed into a narrow column.

---

# 10. QA MUST MATCH CHANGE IMPACT

Do not restart every test from zero after every failure.

Canonical rule:

> **A FAILURE INVALIDATES ONLY THE EVIDENCE IT CAN REASONABLY AFFECT.**

Use contextual backtrack:

```text
FAILURE
→ CLASSIFY IMPACT
→ FIND LAST TRUSTWORTHY CHECKPOINT
→ RE-ENTER SLIGHTLY BEFORE FAILURE
→ RE-RUN AFFECTED COVERAGE
→ CONTINUE
```

Rigour does not mean repetition.

Full appropriate QA means testing the complete affected coverage set, not mechanically rerunning unrelated historical tests.

---

# 11. PRODUCT BUG vs INSTRUMENT BUG vs EVIDENCE BUG

Before changing product code after a failed test, classify the failure.

```text
PRODUCT BUG
= actual user-facing/runtime defect

INSTRUMENT BUG
= test/harness measured or triggered the wrong thing

EVIDENCE BUG
= output/capture/report is stale, misleading, incomplete or invalid
```

Examples already observed in Museum work:

- camera sampled while still moving;
- auto-advance racing the test;
- state leaking between runs;
- diagnostic message checking less than its assertion;
- synthetic click before listener attachment;
- recording the loading gate instead of the experience;
- a measurement stuck at zero;
- stale screenshots representing a previous build.

Do not modify product code until the evidence can distinguish product failure from measurement failure.

---

# 12. ERROR / LEARNING LOG — MANDATORY

Fixing is not enough. Meaningful mistakes must be converted into institutional memory.

Each significant entry should record:

```text
WHAT HAPPENED
ROOT CAUSE
CLASSIFICATION: PRODUCT / TOOL / EVIDENCE / PROCESS
WHAT CHANGED
RECURRENCE-PREVENTION RULE
WHICH EVIDENCE REMAINS TRUSTWORTHY
WHICH EVIDENCE IS STALE / INVALIDATED
```

If a temporary QA tool is proved misleading, remove or quarantine it rather than leaving a dangerous false-positive instrument in the repository.

---

# 13. EVIDENCE PRESERVATION

Never silently overwrite approved evidence.

Important evidence should preserve, where applicable:

- source;
- before;
- after;
- commit SHA;
- run ID;
- timestamp;
- viewport;
- dataset / museum;
- browser/build context;
- artifact URL;
- related QA result.

When a Human Gate is opened, its evidence becomes **frozen review evidence**.

Later work must not make it ambiguous which build is being reviewed.

---

# 14. HUMAN GATES

Human Gates exist because some decisions cannot be delegated safely.

Typical triggers:

- visual acceptance;
- product default change;
- frozen camera/route semantics;
- destructive or high-impact refactor;
- global architecture contract;
- expensive/external dependency choice;
- final integration / merge.

A Human Gate must state exactly:

```text
WHAT NEEDS REVIEW
WHY HUMAN REVIEW IS REQUIRED
WHERE TO REVIEW IT
ARTIFACT / URL / VIDEO / BOARD / SCREENSHOTS
WHAT COUNTS AS PASS / FAIL
WHAT REMAINS FROZEN
```

Do not say merely “please review”.

---

# 15. AUTONOMOUS CONTINUATION AFTER A HUMAN GATE

Waiting for Human QA does not automatically require global idleness.

However, continuation is allowed only under strict proof of safety.

The critical model is not merely:

```text
A ↔ B
```

It is:

```text
A
↓
GLOBAL
↓
B
```

A and B may be locally separate while still sharing global contracts, runtime assumptions, shell architecture, navigation, product semantics or QA process.

Therefore:

> **LOCAL INDEPENDENCE IS NOT ENOUGH. CONTINUATION REQUIRES GLOBAL OUTCOME STABILITY.**

---

# 16. PENDING-DECISION IMPACT ENVELOPE

When Mission A reaches a Human Gate, Claude must describe what could still change depending on Human QA.

Required structure:

```text
MISSION A

Pending decision:
...

Plausible outcomes:
- KEEP
- KEEP WITH CORRECTION
- PARTIAL REWORK
- CONTRACT CHANGE
(as applicable)

Potential consequences:
...

GLOBAL contracts potentially affected:
...

GLOBAL process / QA rules potentially affected:
...

Shared runtime/components potentially affected:
...

Not expected to change:
...
```

The next mission is tested against this uncertainty envelope — not merely against the current implementation of A.

Canonical rule:

> **INDEPENDENCE MUST BE PROVEN AGAINST PLAUSIBLE OUTCOMES OF THE PENDING HUMAN GATE, NOT ONLY AGAINST THE CURRENT IMPLEMENTATION.**

---

# 17. GLOBAL OUTCOME STABILITY CHECK

Before starting Mission B while A waits for Human QA, answer:

```text
1. What exactly remains undecided in A?
2. What are the plausible outcomes of that decision?
3. What GLOBAL contracts could each outcome affect?
4. What GLOBAL workflow / QA rules could change?
5. What shared runtime/components/files could change?
6. What does B depend on?
7. Would B remain valid under every plausible A outcome?
8. Could B invalidate or contaminate A evidence?
9. Could B change a shared contract while A is still undecided?
```

Then classify B:

```text
FULL CONTINUATION
PREPARATION ONLY
BLOCKED
```

---

# 18. CONTINUATION CLASSIFICATIONS

## FULL CONTINUATION

Allowed only when B remains valid under every plausible outcome of A and does not endanger A evidence or shared contracts.

## PREPARATION ONLY

Use when implementation could be invalidated but invariant preparatory work remains safe.

Allowed examples:

- research;
- donor audit;
- canonical references;
- video capture;
- storyboard extraction;
- requirements;
- capability map;
- test plan;
- fixtures;
- benchmark collection;
- documentation that does not freeze a disputed contract.

No dependent product implementation.

## BLOCKED

Use when a plausible Human decision in A could materially alter B architecture, semantics, implementation, global assumptions or acceptance process.

Claude waits.

---

# 19. UNCERTAINTY RULE

This rule is intentionally conservative:

> **UNCERTAINTY ABOUT GLOBAL IMPACT = NO FULL CONTINUATION.**

Use:

```text
uncertain, low/medium impact
→ PREPARATION ONLY

uncertain, high/global impact
→ BLOCKED
```

“Probably safe” is not enough for Full Continuation.

Efficiency includes avoiding rework and avoiding damage.

---

# 20. GLOBAL FREEZE

When A has unresolved global impact, B may be allowed to proceed locally but may not modify shared global contracts unless the mandate explicitly authorizes it.

Example:

```text
B MAY MODIFY
- Visitor-specific CSS
- Visitor-specific composition
- Visitor-specific evidence

B MAY NOT MODIFY
- World schema
- Experience Director
- camera ownership contract
- Scene Kit contract
- portal semantics
- transition semantics
- global Studio shell contract
- shared navigation semantics
- project/config schema
- preview contract
```

This is a safety boundary, not merely a recommendation.

---

# 21. EVIDENCE FREEZE DURING PARALLEL CONTINUATION

When A pauses for Human QA:

```text
A COMMIT      FROZEN
A ARTIFACT    FROZEN
A VIDEO       FROZEN
A STORYBOARD  FROZEN
A QA REPORT   FROZEN
```

If B later changes the combined application, A must remain reviewable at its pinned evidence/commit.

A must not silently inherit B's later artifact.

---

# 22. REQUIRED CONTINUATION NOTE BEFORE B STARTS

Claude must write what it is about to do before beginning B.

Template:

```text
MISSION A — PAUSED AT HUMAN GATE

Human review required:
...

Frozen evidence:
commit:
artifact:
video:
storyboard/board:

Pending A decision:
...

Plausible outcomes:
...

Potential GLOBAL impact:
...

NEXT CANDIDATE — MISSION B
...

B dependencies:
...

Global outcome stability result:
FULL CONTINUATION / PREPARATION ONLY / BLOCKED

Why B remains valid even if A changes:
...

What I will do in B:
...

What I will NOT touch:
...

Shared contracts under GLOBAL FREEZE:
...

Starting / Preparing / Stopping.
```

The line **“Why B remains valid even if A changes”** is mandatory for Full Continuation.

---

# 23. GATE TYPES

Human Gates may be classified to communicate scope, but classification never overrides the Global Outcome Stability Check.

```text
HARD
= downstream implementation must stop until decision

LOCAL
= current mission freezes; proven outcome-stable work elsewhere may continue

CONDITIONAL
= explicitly named work may continue; other work remains blocked
```

If uncertain which type applies, use the safer class.

---

# 24. LONG AUTONOMOUS RUNS / OVERNIGHT MODE

Long runs are allowed when the roadmap and guardrails are clear.

Claude should provide meaningful checkpoints, not narrate every trivial edit.

Useful checkpoint format:

```text
VERTICAL / MISSION
STATUS
WHAT CHANGED
TARGETED QA
VISUAL EVIDENCE
PROBLEM FOUND
ROOT CAUSE
DECISION NEEDED? YES / NO
COMMIT
NEXT ACTION
```

Claude should not stop for ordinary implementation choices already bounded by the mandate.

Claude must stop or downgrade when encountering:

- Human product decision;
- frozen contract conflict;
- destructive operation;
- uncertain global impact;
- unapproved cost/spend;
- merge/promotion decision;
- missing authoritative input that changes product meaning.

---

# 25. CURRENT MUSEUM GLOBAL CONTRACT REGISTRY

The following should be treated as shared/global authority unless a more specific contract says otherwise:

```text
World semantics
World Graph semantics
Camera ownership
Experience Director
Explore / Guided shared-world model
Portal semantics
Transition semantics
Transition behaviour vs visual representation
Scene Kit interface
Authoring vs Preview vs Visitor separation
Media contract
Asset lifecycle
Project/config schema
Readiness semantics
Preview contract
Visitor semantic model
Output / publish contract when introduced
```

A mission touching one of these requires explicit impact analysis.

---

# 26. MUSEUM-SPECIFIC VISUAL ACCEPTANCE PATTERNS

## Authoring / Visitor UI

Prefer:

```text
CURRENT DESKTOP → CORRECTED DESKTOP
CURRENT MOBILE  → CORRECTED MOBILE
APPROVED MUSEUM SURFACE → NEW SURFACE
MUSEUM A → MUSEUM B
```

## Motion / Transition

Prefer:

```text
SOURCE VIDEO
→ SOURCE STORYBOARD
→ MUSEUM VIDEO
→ MATCHED MUSEUM STORYBOARD
→ SIDE-BY-SIDE
```

## Reactive Installation

Prefer:

```text
BREEZE / SOURCE VIDEO
→ interaction-state storyboard
→ donor capability map
→ Museum implementation video
→ matched state storyboard
```

## Free Visitor / Viewpoints

Prefer:

```text
REFERENCE EXPERIENCE VIDEO
→ movement / discovery storyboard
→ semantic behaviour map
→ Museum walkthrough recording
→ matched behaviour board
```

---

# 27. PRODUCT CAPABILITIES ARE NOT USER OBLIGATIONS

Museum may contain many capabilities without forcing every visitor to consume them.

Canonical principles:

> **CAPABILITY AVAILABLE ≠ CAPABILITY ALWAYS ACTIVE.**

> **CONTENT AVAILABLE ≠ CONTENT MUST BE CONSUMED.**

> **THE AUTHOR DEFINES POSSIBILITIES. THE VISITOR CHOOSES DEPTH.**

This must guide future work on Viewpoints, Guide presence, Guided tours, AI Guide, reactive installations and institutional content.

---

# 28. MERGE / PROMOTION / PROTECTED BASELINES

No autonomous run authorizes merge merely because internal QA passes.

Required flow:

```text
WORKING BRANCH
→ IMPLEMENTATION COMPLETE
→ TARGETED QA
→ VISUAL EVIDENCE
→ HUMAN QA
→ FIX IF REQUIRED
→ INTEGRATION AUDIT
→ JUANMA EXPLICIT APPROVAL
→ MERGE / PROMOTION
```

Never touch protected `master` without explicit Juanma approval.

Before merge, inspect:

- full diff;
- temporary QA junk;
- stale evidence;
- routes/entry points;
- module registration;
- shared contracts;
- regression surface;
- final artifact / production entry.

---

# 29. DEFINITION OF A TRUSTWORTHY HUMAN GATE

A strong Human Gate contains:

```text
BRANCH
HEAD
TREE STATUS
MISSION / QUESTION
WHAT CHANGED
WHAT DID NOT CHANGE
TARGETED QA RESULTS
KNOWN LIMITATIONS
CURRENT DEBT
REAL ARTIFACT URL
VIDEOS / SCREENSHOTS / BOARDS
COMPARISON EVIDENCE
ERROR / LEARNING LOG UPDATE
CLAUDE INTERNAL QA
CLAUDE VISUAL CRITIC
HUMAN QA: PENDING
PRODUCT APPROVAL: PENDING
NO MERGE / MASTER UNTOUCHED
```

Do not bury the unresolved question inside a long success report.

---

# 30. ANTI-PATTERNS

Do not:

- start over from zero after every local failure;
- rebuild a proven first-party donor without audit;
- declare visual PASS from semantic tests;
- compare screenshots from different builds without labelling them;
- use stale artifacts as current evidence;
- continue B merely because B does not directly import A;
- modify global contracts while A's global outcome is unresolved;
- say “probably independent” and continue fully;
- invent extra tasks while waiting;
- silently fix a frozen mission after requesting Human QA;
- treat mobile as an afterthought;
- let the builder be the sole visual critic;
- merge because autonomous QA is green.

---

# 31. MUSEUM V1 ADOPTION PLAN

This document should first be tested as a **Museum process standard** on upcoming verticals such as:

1. remaining Transition fidelity correction;
2. Visitor visual/responsive correction;
3. Reactive Sculpture / Breeze integration;
4. Free Visitor / Viewpoints / Visit Depth;
5. Character / Guide foundation.

During those runs, every process defect discovered must be added to the Learning Log and used to revise this Playbook.

Only after Museum demonstrates that the method works across multiple different types of work — motion, UI, physics/interaction, navigation and characters — should a second document extract the project-agnostic standard.

Proposed later document:

`AUTONOMOUS_VISUAL_ENGINEERING_PLAYBOOK_GENERAL_V1.md`

The general version must remove Museum-specific architecture while preserving the proven safety, evidence, continuation and Human Gate rules.

---

# 32. FINAL PRINCIPLES

```text
REPOSITORY OVER MEMORY.

REFERENCE BEFORE INVENTION.

CONTRACTS BEFORE ENTHUSIASM.

PIXELS WIN.

FUNCTIONAL PASS ≠ PRODUCT PASS.

BUILDER ≠ CRITIC.

PRESERVE VERIFIED EVIDENCE.

BACKTRACK CONTEXTUALLY, NOT TO ZERO.

A FAILURE INVALIDATES ONLY WHAT IT CAN REASONABLY AFFECT.

LOCAL INDEPENDENCE IS NOT ENOUGH.
CONTINUATION REQUIRES GLOBAL OUTCOME STABILITY.

UNCERTAINTY ABOUT GLOBAL IMPACT = NO FULL CONTINUATION.

GLOBAL CONTRACTS STAY FROZEN UNLESS EXPLICITLY AUTHORIZED.

THE AUTHOR DEFINES POSSIBILITIES.
THE VISITOR CHOOSES DEPTH.

HUMAN QA IS A REAL GATE.

EFFICIENCY NEVER MEANS PUTTING THE PROJECT AT RISK.
```
