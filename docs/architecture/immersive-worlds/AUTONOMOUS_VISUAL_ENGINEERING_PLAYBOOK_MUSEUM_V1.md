# AUTONOMOUS VISUAL ENGINEERING PLAYBOOK — MUSEUM V1

> **Status:** MUSEUM V1 REVIEW CANDIDATE — REQUIRES EXPLICIT JUANMA APPROVAL  
> **Repository:** `Juanmaes83/escaparates-pro`  
> **Applies to:** Immersive Worlds / Museum / Institutional Experiences  
> **Purpose:** enable long, efficient autonomous implementation runs without sacrificing product safety, visual quality, evidence quality, traceability or human authority.  
> **Product Owner / Visual Authority / Final Decision / Merge Authority:** Juanma  
> **Implementation agent:** Claude Code  
> **Review partners:** ChatGPT + Juanma  
> **Core rule:** **efficiency never means putting the project at risk.**

---

# 0. PRIME DIRECTIVE

Autonomy exists to increase useful progress, reduce waiting, reduce repeated work and reduce human supervision cost. It never authorizes unnecessary project risk.

Canonical safety rules:

> **EFFICIENCY NEVER MEANS PUTTING THE PROJECT AT RISK.**

> **UNCERTAINTY ABOUT GLOBAL IMPACT = NO FULL CONTINUATION.**

> **LOCAL INDEPENDENCE IS NOT ENOUGH. CONTINUATION REQUIRES GLOBAL OUTCOME STABILITY.**

> **IF FULL STABILITY CANNOT BE DEMONSTRATED, DOWNGRADE TO PREPARATION ONLY OR STOP.**

> **A PAUSED MISSION MAY NOT BE SILENTLY MODIFIED WHILE AWAITING HUMAN QA.**

> **NEVER INVENT A NEW MISSION JUST TO AVOID WAITING.**

> **FUNCTIONAL PASS ≠ PRODUCT PASS. PIXELS WIN.**

> **AGENT KEEP ≠ HUMAN APPROVAL.**

---

# 1. WHY THIS PLAYBOOK EXISTS

Museum work has shown that Claude performs materially better when authority, references, mission instructions, evidence, QA rules and learned corrections live in the repository instead of only in transient chat.

The operating model is:

```text
CHAT
= immediate intent / decision / correction

REPOSITORY
= durable authority / contracts / references / evidence / learning
```

A short chat instruction should often be enough:

> Read the current mandate in the repository, reconcile it against the actual tree, and execute it.

Claude must not depend on remembering long conversation history correctly.

The repository is the persistent operational memory of the project.

---

# 2. AUTHORITY ORDER

When sources conflict, use this order unless Juanma explicitly changes it:

```text
1. Latest explicit Juanma decision
2. Frozen / approved project contracts
3. Current mission mandate in repository
4. Canonical source code / proven donor implementation
5. Canonical visual reference / video / storyboard
6. Existing architecture documentation
7. Current implementation
8. Agent inference
```

Agent inference never silently overrides a stronger source.

When visual interpretation and source code appear to disagree, inspect both, identify what each proves, and record the discrepancy.

---

# 3. OWNED LEARNING IS REUSABLE FIRST-PARTY CAPABILITY

Juanma works across multiple owned projects and repositories. Proven methods discovered in one owned project may be promoted into another when they improve quality or safety.

This is not external inspiration. It is first-party learning reuse.

Canonical principle:

> **OWNED PROVEN PATTERNS SHOULD BE REUSED BEFORE NEW ONES ARE INVENTED.**

A method may originate in Sarah Katerina, Museum, Escaparates Pro or another Juanma-owned project. If it proves general, it may be promoted into this playbook after adaptation to Museum constraints.

Museum V1 explicitly adopts the proven Sarah Katerina separation pattern represented by:

```text
sk-photographer-designer
sk-amnesiac-critic
```

The role names are Sarah-specific. The underlying mechanism is general and is adopted here as Builder / Fresh Amnesiac Critic separation.

---

# 4. REFERENCE AUTHORITY LABELS

Every important reference must be understood by authority level:

```text
CANONICAL
= target behaviour/result that acceptance is measured against

DONOR
= proven implementation/capability from which reuse/adaptation is expected

REFERENCE
= useful benchmark or comparison

INSPIRATION
= optional direction, not acceptance truth
```

Do not treat inspiration as canonical truth.

Whenever practical, canonical videos, images, screenshots, storyboards, donor notes and review boards should live in the repository so future runs can inspect the same evidence.

---

# 5. REFERENCE-FIRST IMPLEMENTATION

Before inventing a solution, determine whether the capability already exists in:

- current Museum code;
- another Immersive Worlds surface;
- first-party Scene Kits;
- Infinite Worlds;
- Breeze Studio Pro;
- Three.js examples already reused in first-party code;
- other Juanma-owned repositories.

If a proven first-party implementation exists, map it before rebuilding it.

Use:

```text
DIRECT REUSE
ADAPT
ALREADY PRESENT
MISSING
INCOMPATIBLE — documented reason required
```

Do not replace a proven capability merely because a generic reimplementation is easier to write.

---

# 6. STANDARD MISSION LIFECYCLE

A bounded Museum vertical normally follows:

```text
CONTRACT / QUESTION
→ RECONCILE CURRENT TREE
→ IDENTIFY REFERENCES / DONORS
→ DEFINE ACCEPTANCE EVIDENCE
→ IMPLEMENT
→ TARGETED FUNCTIONAL QA
→ REAL OUTPUT / BROWSER QA
→ VISUAL EVIDENCE
→ FRESH AMNESIAC VISUAL CRITIC
→ HUMAN GATE
→ DECISION
```

Canonical principle:

> **ONE QUESTION → ONE IMPLEMENTATION → TARGETED QA → VISUAL EVIDENCE → HUMAN DECISION.**

Avoid open-ended autonomous polishing loops.

---

# 7. EVIDENCE-FIRST VISUAL ENGINEERING

For motion, interaction, composition or visual behaviour with a reference:

```text
REFERENCE VIDEO / IMAGE / EXPERIENCE
        ↓
FRAME / STATE ANALYSIS
        ↓
CANONICAL STORYBOARD / COMPARISON SHEET
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
FRESH AMNESIAC CRITIC
        ↓
HUMAN QA
```

Frames are selected by **visual, interaction or narrative function**, not mechanically at equal time intervals.

Examples:

```text
PORTAL
acquire → approach → takeover → crossing → reverse exit → recoil → reveal → settle

REACTIVE CLOTH
idle → wind onset → lift → anchor tension → collision → maximum reaction → damping → settle

FREE VISITOR
enter → explore → discover viewpoint → approach → occupy viewpoint → composition resolves → optional content → leave freely
```

The storyboard is not decoration. It is a falsifiable acceptance instrument.

---

# 8. PIXELS WIN

Tests prove contracts. They do not automatically prove product quality.

A valid state can be:

```text
FUNCTIONAL QA       PASS
CONSOLE             CLEAN
SEMANTIC CONTRACT   PASS
VISUAL PRODUCT      FAIL
```

If Juanma rejects a surface visually, it is not product-approved even if every automated test passes.

Prefer evidence such as:

```text
SOURCE vs CURRENT
BEFORE vs AFTER
APPROVED SURFACE vs NEW SURFACE
DESKTOP vs MOBILE
MUSEUM A vs MUSEUM B
```

Never substitute prose for evidence when pixels can answer the question.

---

# 9. CREATOR–CRITIC ISOLATION PROTOCOL

This is a mandatory Museum quality-control pattern adapted from the proven first-party Sarah Katerina creator / amnesiac-critic system.

## 9.1 Builder and Critic are different roles

```text
BUILDER
= creates, implements, diagnoses technical causes and solves defects

CRITIC
= evaluates the result and diagnoses perceptual/product defects

HUMAN
= approves or rejects the product
```

The builder does not become the final critic of its own work.

The critic does not redesign or edit the implementation.

The critic diagnoses. The builder solves.

## 9.2 Fresh critic every serious review round

A serious visual review must use a **fresh critic context**.

Do not continue the builder session and ask it to become independent.

Do not reuse a critic whose prior-round knowledge could bias the next assessment when a clean review is required.

## 9.3 Process-amnesiac, standards-rich

The critic should know everything necessary to judge the result and nothing unnecessary about how the maker produced it.

Canonical principle:

> **A REVIEWER SHOULD KNOW EVERYTHING REQUIRED TO JUDGE THE RESULT, AND NOTHING THAT COULD BIAS IT TOWARD THE MAKER'S INTENT.**

The critic may receive:

- current approved standards;
- acceptance criteria;
- canonical reference;
- real artifact;
- source and implementation videos;
- matched boards;
- responsive screenshots;
- minimum brief necessary to judge the intended result.

The critic should not receive unless absolutely necessary:

- builder reasoning history;
- failed implementation attempts;
- tool frustrations;
- time/cost invested;
- preferred diagnosis from the builder;
- narrative explaining why a weak result should be accepted;
- previous critic verdicts when a genuinely fresh review is required.

## 9.4 First-glance test

Where meaningful, the critic evaluates the output **before reading the explanatory brief**.

Museum adaptation:

```text
WHAT I THINK THIS IS
WHAT I THINK IS IMPORTANT
WHERE MY ATTENTION GOES
WHAT I THINK I CAN DO
WHAT FEELS BROKEN / UNCLEAR / GENERIC
WHAT I EXPECT TO HAPPEN NEXT
```

For motion:

```text
WHAT MOTION I PERCEIVE
WHAT CAUSED IT
WHAT CHANGED
WHETHER CONTINUITY READS
WHETHER THE EFFECT NEEDS EXPLANATION TO WORK
```

If the artifact needs the builder's explanation to make perceptual sense, the artifact has not yet proved itself.

## 9.5 Critic write boundary

The critic is read-only with respect to product implementation and canonical authority.

It may not:

- edit runtime code;
- edit canonical architecture;
- change acceptance criteria to rescue the artifact;
- approve merge or publication;
- silently fix what it is reviewing.

The critic returns diagnosis only.

## 9.6 Verdict vocabulary

Recommended critic result:

```text
KEEP
ADJUST
REJECT
```

But:

> **AGENT KEEP ≠ HUMAN APPROVAL.**

Juanma / authorized human review remains final.

## 9.7 Feedback contract

For every material defect:

```text
PROBLEM
WHY IT MATTERS
EXPECTED IMPACT
REQUIRED CORRECTION
PRIORITY: P1 / P2 / P3
```

The critic should identify the defect precisely without prescribing an unnecessary redesign.

## 9.8 Isolation probe

Every serious fresh-critic report should end by checking for context leakage:

```text
Do I know how this was produced?
Do I know which implementation attempt this is?
Do I know previous versions or previous verdicts?
Do I know the builder's preferred explanation?
Do I know information that was unnecessary to judge the pixels?
```

If the critic can answer with production-history specifics that were not required for judgment, the review is contaminated.

Repeat fresh when the contamination is material.

---

# 10. RESPONSIVE + PLATFORM PROOF

For visually significant Museum UI, one desktop screenshot is insufficient.

Default evidence when relevant:

```text
DESKTOP
+ MOBILE
+ SECOND DATASET / SECOND MUSEUM
```

Recommended responsive viewports:

```text
1440×900
1280×800
390×844
360×800
```

Mobile is a distinct composition target, not desktop collapsed into one narrow column.

The second museum proves platform reuse instead of a hardcoded demonstration.

---

# 11. QA MUST MATCH CHANGE IMPACT

Do not restart all QA after every local failure.

Canonical rules:

> **A FAILURE INVALIDATES ONLY THE EVIDENCE IT CAN REASONABLY AFFECT.**

> **VALIDATION SCOPE SHOULD MATCH CHANGE IMPACT SCOPE.**

Use contextual backtrack:

```text
FAILURE
→ CLASSIFY IMPACT
→ IDENTIFY LAST TRUSTWORTHY CHECKPOINT
→ RE-ENTER SLIGHTLY BEFORE FAILURE
→ RE-RUN AFFECTED COVERAGE
→ CONTINUE
```

Do not blindly resume from the exact failed line if a small predecessor runway is required to recreate valid state.

Do not restart from zero merely to feel rigorous.

Rigour does not mean repetition.

---

# 12. PRODUCT BUG vs INSTRUMENT BUG vs EVIDENCE BUG vs PROCESS BUG

Before changing product code after a failed test, classify the failure:

```text
PRODUCT BUG
= real user-facing/runtime defect

INSTRUMENT BUG
= harness triggered or measured the wrong thing

EVIDENCE BUG
= output/capture/report is stale, misleading, incomplete or invalid

PROCESS BUG
= workflow rule or handoff allowed an avoidable failure mode
```

Known Museum examples include:

- camera sampled while still moving;
- auto-advance racing the test;
- state leaking between runs;
- diagnostic assertions disagreeing with messages;
- synthetic click before listener attachment;
- recording loading gate instead of experience;
- measurement stuck at zero;
- stale screenshots representing a previous build.

Never change product code merely to satisfy a broken instrument.

Instrumentation must exercise the actual production path where practical instead of duplicating an approximate shadow implementation.

---

# 13. ERROR / LEARNING LOG — MANDATORY

Fixing is not enough. Significant mistakes must become institutional memory.

Record:

```text
WHAT HAPPENED
ROOT CAUSE
CLASSIFICATION: PRODUCT / TOOL / EVIDENCE / PROCESS
WHAT CHANGED
RECURRENCE-PREVENTION RULE
LAST TRUSTWORTHY CHECKPOINT
WHICH EVIDENCE REMAINS TRUSTWORTHY
WHICH EVIDENCE IS STALE / INVALIDATED
```

If a temporary QA tool is misleading, remove or quarantine it instead of leaving a dangerous false-positive instrument in the repository.

Generalizable process discoveries should update this Playbook after review.

---

# 14. EVIDENCE PRESERVATION

Never silently overwrite approved or gate-bound evidence.

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

When a Human Gate opens, its evidence becomes **frozen review evidence**.

Later work must not make it ambiguous which build the human is being asked to review.

---

# 15. HUMAN GATES

Human Gates exist because some decisions cannot be delegated safely.

Typical triggers:

- visual acceptance;
- product default change;
- frozen camera/route semantics;
- destructive or high-impact refactor;
- global architecture contract;
- expensive/external dependency choice;
- final integration / merge.

A Human Gate must state:

```text
WHAT NEEDS REVIEW
WHY HUMAN REVIEW IS REQUIRED
WHERE TO REVIEW IT
ARTIFACT / URL / VIDEO / BOARD / SCREENSHOTS
WHAT COUNTS AS PASS / FAIL
WHAT REMAINS FROZEN
```

Do not write only “please review”.

---

# 16. AUTONOMOUS CONTINUATION AFTER A HUMAN GATE

Waiting for Human QA does not automatically require global idleness.

But continuation requires proven safety.

The model is not only:

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

A and B can be locally separate while sharing architecture, runtime assumptions, shell, navigation, semantics, persistence or QA process.

Therefore:

> **LOCAL INDEPENDENCE IS NOT ENOUGH. CONTINUATION REQUIRES GLOBAL OUTCOME STABILITY.**

---

# 17. PENDING-DECISION IMPACT ENVELOPE

When Mission A reaches a Human Gate, define what may still change depending on Human QA.

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

Shared runtime/components/files potentially affected:
...

Not expected to change:
...
```

The next mission is tested against this uncertainty envelope, not merely against the current A implementation.

> **INDEPENDENCE MUST BE PROVEN AGAINST PLAUSIBLE OUTCOMES OF THE PENDING HUMAN GATE, NOT ONLY AGAINST THE CURRENT IMPLEMENTATION.**

---

# 18. GLOBAL OUTCOME STABILITY CHECK

Before starting Mission B while A waits for Human QA:

```text
1. What exactly remains undecided in A?
2. What plausible outcomes exist?
3. What GLOBAL contracts could each outcome affect?
4. What GLOBAL workflow / QA rules could change?
5. What shared runtime/components/files could change?
6. What does B depend on?
7. Would B remain valid under every plausible A outcome?
8. Could B invalidate or contaminate A evidence?
9. Could B alter a shared contract while A is unresolved?
10. Would a future rejection of A force B product code to be undone?
```

Classify B:

```text
FULL CONTINUATION
PREPARATION ONLY
BLOCKED
```

---

# 19. CONTINUATION CLASSIFICATIONS

## FULL CONTINUATION

Allowed only when B remains valid under every plausible A outcome and cannot endanger A evidence or unresolved shared contracts.

## PREPARATION ONLY

Use when B implementation might later be invalidated but invariant work is safe.

Allowed examples:

- research;
- donor audit;
- canonical reference capture;
- storyboard extraction;
- requirements;
- capability map;
- test plan;
- fixtures;
- visual benchmarks;
- documentation that does not freeze a disputed contract.

No dependent product implementation.

## BLOCKED

Use when a plausible A decision can materially alter B architecture, semantics, implementation, global assumptions or acceptance process.

Stop and wait.

---

# 20. UNCERTAINTY RULE

This rule is intentionally conservative:

> **UNCERTAINTY ABOUT GLOBAL IMPACT = NO FULL CONTINUATION.**

Use:

```text
uncertain + bounded impact
→ PREPARATION ONLY

uncertain + high/global impact
→ BLOCKED
```

“Probably safe” is not enough.

Avoiding destructive rework is part of efficiency.

---

# 21. GLOBAL FREEZE

When A has unresolved global impact, B may proceed only inside explicitly safe local boundaries.

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

The freeze is a hard safety boundary unless the current mandate explicitly authorizes an exception.

---

# 22. EVIDENCE FREEZE DURING PARALLEL CONTINUATION

When A pauses for Human QA:

```text
A COMMIT      FROZEN
A ARTIFACT    FROZEN
A VIDEO       FROZEN
A STORYBOARD  FROZEN
A QA REPORT   FROZEN
```

If B later changes the combined application, A remains reviewable against its pinned evidence and commit.

A must not silently inherit B's newer artifact.

---

# 23. REQUIRED CONTINUATION NOTE BEFORE B STARTS

Claude must state what it will do **before** beginning B.

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

If the agent cannot write a convincing answer, it cannot classify the work as Full Continuation.

---

# 24. GATE TYPES

Gate labels communicate scope but never override the Global Outcome Stability Check.

```text
HARD
= downstream implementation stops until decision

LOCAL
= current mission freezes; proven outcome-stable work elsewhere may continue

CONDITIONAL
= only explicitly named work may continue
```

If uncertain, choose the safer gate.

---

# 25. LONG AUTONOMOUS RUNS / OVERNIGHT MODE

Long runs are allowed only when roadmap, authority and stop rules are clear.

Claude should send meaningful checkpoints, not narrate every small edit.

Recommended checkpoint:

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

Claude may continue ordinary bounded implementation decisions already authorized by the mandate.

Claude must stop or downgrade for:

- Human product decision;
- frozen contract conflict;
- destructive operation;
- uncertain global impact;
- unapproved spending/cost;
- merge/promotion decision;
- missing authority that changes product meaning.

If only one authorized mission exists and it blocks, stop. Do not invent Mission B.

---

# 26. CURRENT MUSEUM GLOBAL CONTRACT REGISTRY

Treat these as global/shared unless a stronger document narrows ownership:

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

A mission touching these requires explicit impact analysis.

---

# 27. MUSEUM-SPECIFIC VISUAL PROOF PATTERNS

## Authoring / Visitor UI

```text
CURRENT DESKTOP → CORRECTED DESKTOP
CURRENT MOBILE  → CORRECTED MOBILE
APPROVED MUSEUM SURFACE → NEW SURFACE
MUSEUM A → MUSEUM B
```

## Motion / Transition

```text
SOURCE VIDEO
→ SOURCE STORYBOARD
→ MUSEUM VIDEO
→ MATCHED MUSEUM STORYBOARD
→ SIDE-BY-SIDE
```

## Reactive Installation / Breeze

```text
BREEZE CANONICAL VIDEO
→ interaction-state storyboard
→ donor capability map
→ Museum implementation video
→ matched state storyboard
→ side-by-side critic
```

## Free Visitor / Viewpoints

```text
REFERENCE EXPERIENCE VIDEO
→ movement/discovery storyboard
→ semantic behaviour map
→ Museum walkthrough recording
→ matched behaviour board
```

## Character / Guide

```text
REFERENCE CHARACTER BEHAVIOUR
→ interaction storyboard
→ anchor / look / gesture / movement map
→ Museum character recording
→ matched behaviour board
```

---

# 28. PRODUCT CAPABILITIES ARE NOT USER OBLIGATIONS

Museum may contain many capabilities without forcing every visitor to consume them.

> **CAPABILITY AVAILABLE ≠ CAPABILITY ALWAYS ACTIVE.**

> **CONTENT AVAILABLE ≠ CONTENT MUST BE CONSUMED.**

> **THE AUTHOR DEFINES POSSIBILITIES. THE VISITOR CHOOSES DEPTH.**

This guides Viewpoints, Guide presence, Guided tours, AI Guide, reactive installations and institutional content.

---

# 29. MERGE / PROMOTION / PROTECTED BASELINES

No autonomous run authorizes merge merely because internal QA passes.

```text
WORKING BRANCH
→ IMPLEMENTATION COMPLETE
→ TARGETED QA
→ VISUAL EVIDENCE
→ FRESH CRITIC
→ HUMAN QA
→ FIX IF REQUIRED
→ INTEGRATION AUDIT
→ JUANMA EXPLICIT APPROVAL
→ MERGE / PROMOTION
```

Never touch protected `master` without explicit Juanma approval.

Before merge inspect:

- full diff;
- temporary QA junk;
- stale evidence;
- routes / entry points;
- module registration;
- shared contracts;
- regression surface;
- final artifact / production entry.

---

# 30. DEFINITION OF A TRUSTWORTHY HUMAN GATE

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
FRESH CRITIC VERDICT
HUMAN QA: PENDING
PRODUCT APPROVAL: PENDING
NO MERGE / MASTER UNTOUCHED
```

Do not bury the unresolved question inside a success report.

---

# 31. ANTI-PATTERNS

Do not:

- start from zero after every local failure;
- blindly resume from the exact failed line when a bounded predecessor runway is needed;
- rebuild proven first-party capability without donor audit;
- declare visual PASS from semantic tests;
- compare screenshots from different builds without labels;
- use stale artifacts as current evidence;
- modify product code to satisfy a broken instrument;
- continue B merely because it does not directly import A;
- modify global contracts while A's global outcome is unresolved;
- say “probably independent” and continue fully;
- invent tasks while waiting;
- silently modify a frozen mission after requesting Human QA;
- treat mobile as an afterthought;
- let builder history leak into a fresh critic unnecessarily;
- let the critic edit what it reviews;
- let critic KEEP become product approval;
- merge because autonomous QA is green.

---

# 32. PROCESS-LEARNING LOOP

The Playbook itself is a living Museum standard until explicitly frozen.

When a run discovers a process failure:

```text
PROCESS FAILURE
→ LOG IT
→ IDENTIFY ROOT CAUSE
→ DEFINE RECURRENCE RULE
→ TEST RULE IN NEXT RUN
→ IF GENERALIZABLE, UPDATE PLAYBOOK
```

Do not add rules merely because they sound prudent. Prefer rules grounded in observed failure modes or clear high-impact risk.

Do not remove safety rules merely because they slowed one run.

The goal is controlled improvement, not maximum rule count.

---

# 33. MUSEUM V1 ADOPTION / VALIDATION MATRIX

This Museum Playbook should be validated across materially different work classes:

```text
TRANSITION
= fast motion / donor fidelity / cinematic evidence

VISITOR
= UI composition / responsive proof / second dataset

REACTIVE SCULPTURE / BREEZE
= physics / interaction / long-form visual storyboard

FREE VISITOR / VIEWPOINTS / VISIT DEPTH
= navigation / optionality / behavioural reference

CHARACTER / GUIDE
= animation / anchors / shared attention / role behaviour
```

A process weakness found in any class must be evaluated for Playbook impact.

The general project-agnostic Playbook is deliberately deferred until Museum V1 is closed and proven.

---

# 34. SCOPE BOUNDARY AFTER MUSEUM V1

The intended sequence is:

```text
1. CLOSE MUSEUM PLAYBOOK V1
2. EXTRACT GENERAL REUSABLE PLAYBOOK
3. THEN PROMOTE REUSABLE PROCESS / CAPABILITY KNOWLEDGE INTO CAPABILITY REGISTRY
```

Do not collapse these three steps into one.

The general Playbook must be derived from a closed Museum standard, not written in parallel from assumptions.

The Capability Registry comes after the reusable method has been identified and separated from Museum-specific contracts.

---

# 35. FINAL PRINCIPLES

```text
REPOSITORY OVER MEMORY.

OWNED PROVEN PATTERNS BEFORE REINVENTION.

REFERENCE BEFORE INVENTION.

CONTRACTS BEFORE ENTHUSIASM.

PIXELS WIN.

FUNCTIONAL PASS ≠ PRODUCT PASS.

BUILDER ≠ CRITIC.

FRESH CRITIC, MINIMUM BIAS.

THE CRITIC DIAGNOSES. THE BUILDER SOLVES. THE HUMAN APPROVES.

AGENT KEEP ≠ HUMAN APPROVAL.

PRESERVE VERIFIED EVIDENCE.

BACKTRACK CONTEXTUALLY, NOT TO ZERO.

A FAILURE INVALIDATES ONLY WHAT IT CAN REASONABLY AFFECT.

VALIDATION SCOPE MATCHES CHANGE IMPACT.

LOCAL INDEPENDENCE IS NOT ENOUGH.
CONTINUATION REQUIRES GLOBAL OUTCOME STABILITY.

UNCERTAINTY ABOUT GLOBAL IMPACT = NO FULL CONTINUATION.

GLOBAL CONTRACTS STAY FROZEN UNLESS EXPLICITLY AUTHORIZED.

A PAUSED MISSION MAY NOT BE SILENTLY MODIFIED.

NEVER INVENT WORK TO AVOID WAITING.

THE AUTHOR DEFINES POSSIBILITIES.
THE VISITOR CHOOSES DEPTH.

HUMAN QA IS A REAL GATE.

EFFICIENCY NEVER MEANS PUTTING THE PROJECT AT RISK.
```
