# AUTONOMOUS VISUAL ENGINEERING PLAYBOOK — MUSEUM V1
## HUMAN QA NAVIGABLE RUNTIME PROTOCOL

> **Status:** MANDATORY ADDENDUM TO MUSEUM V1 REVIEW CANDIDATE  
> **Repository:** `Juanmaes83/escaparates-pro`  
> **Authority:** Juanma — Product Owner / Visual Authority / Final Decision / Merge Authority  
> **Purpose:** make Human QA reproducible on the real implementation, not only on static evidence.

---

# 1. PRIME RULE

> **PREVIEW ACCESS IS PART OF THE DELIVERABLE, NOT AN AFTERTHOUGHT.**

A visual Human Gate is not properly deliverable unless the human reviewer can access and navigate the real implementation.

Screenshots, storyboards, boards, generated HTML evidence and recorded videos are supporting evidence. They do **not** replace access to the navigable runtime when the feature itself is interactive or experiential.

For Museum, Juanma must be able to enter the actual experience, navigate it, trigger the relevant states, inspect Visitor surfaces, move between spaces, provoke transitions and independently record verification video when desired.

---

# 2. REQUIRED REVIEW ACCESS

Before requesting Human QA, Claude must provide at least one valid review path:

```text
OPTION A — EXTERNAL PREVIEW
A real preview/deployment URL accessible from Juanma's browser.

OPTION B — REVIEWER-LOCAL RUNTIME
Exact branch/commit + exact command + exact local URL required to launch and access the project on Juanma's own machine.
```

Preference order:

```text
ACCESSIBLE PREVIEW URL
→ otherwise REVIEWER-LOCAL RUNTIME
→ otherwise HUMAN QA ACCESS NOT READY
```

A GitHub file URL, evidence board, raw HTML file, screenshot folder or Claude-container localhost is not a navigable product preview.

---

# 3. LOCALHOST / 127.0.0.1 SAFETY RULE

> **NEVER PROVIDE `localhost` OR `127.0.0.1` AS HUMAN REVIEW ACCESS UNLESS THAT SERVER IS ACTUALLY RUNNING ON THE HUMAN REVIEWER'S MACHINE.**

Claude's container/local environment is not Juanma's Windows machine.

If the runtime must be launched locally by Juanma, Claude must provide:

```text
REPOSITORY
BRANCH
COMMIT / EXPECTED HEAD
WORKING DIRECTORY
EXACT INSTALL COMMAND, only if genuinely required
EXACT START COMMAND
EXPECTED PORT
EXACT URL
EXPECTED SUCCESS SIGNAL
HOW TO STOP THE SERVER
```

Do not make Juanma reverse-engineer the launch procedure from package scripts.

---

# 4. HUMAN REPRODUCTION PATH

Every interactive Human Gate must include a short reproducible test path describing what Juanma should actually do in the running product.

Example for Museum:

```text
1. Open the Museum runtime.
2. Enter the real visitor experience.
3. Open Visitor / institutional information.
4. Inspect desktop and mobile/responsive behaviour when relevant.
5. Follow the real Guided route or production interaction that triggers the portal crossing.
6. Cross from the source room to the destination room.
7. Observe approach, takeover, crossing, reverse-facing exit, recoil, reveal and settle.
8. Repeat if needed while recording an independent verification video.
```

The instructions must use the real product path, not a QA-only shadow path.

---

# 5. HUMAN QA ACCESS GATE

Before Human QA handoff, classify runtime access:

```text
NAVIGABLE RUNTIME READY
= Juanma has a working external preview or a verified reviewer-local launch path.

EVIDENCE READY / HUMAN QA ACCESS NOT READY
= screenshots/videos/boards exist, but Juanma cannot yet navigate the real implementation.
```

The second state is **not** a completed Human QA handoff.

Claude must not describe a Human Gate as ready merely because visual evidence exists.

---

# 6. PREVIEW ACCESS VALIDATION

Before handing over a preview URL or local launch procedure, Claude must verify the path as far as its environment allows and state what was actually verified.

For an external preview:

```text
[ ] URL resolves
[ ] correct branch/build
[ ] actual Museum runtime loads
[ ] relevant feature reachable
[ ] no obvious blocking console/runtime failure
```

For reviewer-local launch:

```text
[ ] command corresponds to repository scripts/current architecture
[ ] required working directory stated
[ ] expected port stated
[ ] no container-only path presented as reviewer-local
[ ] branch/commit pinned
```

Never claim Juanma's machine is serving the project unless that fact is actually known.

---

# 7. EVIDENCE + RUNTIME ARE COMPLEMENTARY

The Human Gate package for an interactive visual vertical should be:

```text
REAL NAVIGABLE RUNTIME
+
PINNED COMMIT / BUILD
+
TARGETED QA RESULTS
+
SOURCE / BEFORE / AFTER EVIDENCE
+
VIDEO WHEN MOTION MATTERS
+
STORYBOARD / COMPARISON BOARD WHEN REFERENCE FIDELITY MATTERS
+
FRESH AMNESIAC CRITIC VERDICT
+
SHORT HUMAN REPRODUCTION PATH
```

Runtime proves what the reviewer can actually experience.

Evidence makes the review comparable, repeatable and auditable.

Neither should silently replace the other.

---

# 8. HUMAN-GENERATED VERIFICATION EVIDENCE

Juanma may create his own screenshots or screen recording while navigating the project.

When Human QA produces independent evidence:

```text
HUMAN CAPTURE
→ preserve it when useful
→ label branch/commit/build if known
→ compare against agent evidence when they disagree
→ pixels and actual runtime behaviour take priority over narrative explanation
```

If Human capture contradicts automated evidence, classify the cause before changing product code:

```text
PRODUCT BUG
INSTRUMENT BUG
EVIDENCE BUG
ENVIRONMENT / BUILD MISMATCH
PROCESS BUG
```

Do not dismiss Human runtime evidence because automated QA was green.

---

# 9. HUMAN GATE TEMPLATE — UPDATED

For interactive/visual Museum work, a trustworthy handoff must now state:

```text
BRANCH
HEAD / COMMIT
MISSION / QUESTION
WHAT CHANGED
WHAT DID NOT CHANGE
TARGETED QA RESULTS
KNOWN LIMITATIONS / DEBT

NAVIGABLE REVIEW ACCESS
- external preview URL; OR
- exact reviewer-local launch instructions

HUMAN REPRODUCTION PATH
...

VIDEOS / SCREENSHOTS / BOARDS
COMPARISON EVIDENCE
FRESH CRITIC VERDICT
IMPLEMENTATION RECORD UPDATE
ERROR / LEARNING LOG UPDATE OR NOT REQUIRED
PROVEN FLOW USED / ADAPTED / NOT APPLICABLE
INSTRUMENT TRUST GATE

HUMAN QA: PENDING
PRODUCT APPROVAL: PENDING
NO MERGE / MASTER UNTOUCHED
```

If navigable access is missing, declare exactly:

```text
EVIDENCE READY / HUMAN QA ACCESS NOT READY
```

---

# 10. STANDARD MISSION LIFECYCLE — RUNTIME-AWARE

For interactive visual work, use:

```text
CONTRACT / QUESTION
→ RECONCILE AUTHORITY
→ PROVEN CAPABILITY / FLOW CHECK
→ IMPLEMENT
→ TARGETED FUNCTIONAL QA
→ REAL PRODUCT-PATH QA
→ VISUAL / MOTION EVIDENCE
→ FRESH AMNESIAC CRITIC
→ PREPARE NAVIGABLE REVIEW RUNTIME
→ VERIFY REVIEW ACCESS
→ UPDATE IMPLEMENTATION + LEARNING MEMORY
→ HUMAN GATE
→ HUMAN NAVIGATION / OPTIONAL HUMAN RECORDING
→ DECISION
```

Canonical rule:

> **A HUMAN CANNOT APPROVE AN INTERACTIVE EXPERIENCE HE CANNOT ACTUALLY EXPERIENCE.**

---

# 11. ANTI-PATTERNS

Do not:

- send a GitHub `blob/...html` link and call it the product preview;
- send a screenshot board as a substitute for the runtime;
- send Claude-container `localhost`/`127.0.0.1` to Juanma;
- require Juanma to infer branch, command, directory or port;
- request transition approval when the human cannot trigger the transition himself;
- request Visitor approval when the human cannot open and navigate Visitor in the real app;
- treat generated evidence as more authoritative than contradictory real Human runtime behaviour without investigation;
- change product code before classifying a Human-vs-instrument discrepancy;
- call the Human Gate ready when runtime access is not ready.

---

# 12. FINAL RULES

```text
PREVIEW ACCESS IS PART OF THE DELIVERABLE, NOT AN AFTERTHOUGHT.

HUMAN QA REQUIRES A NAVIGABLE RUNTIME.

STATIC EVIDENCE SUPPORTS HUMAN QA; IT DOES NOT REPLACE THE RUNTIME.

REAL PRODUCT PATH BEFORE HARNESS SHORTCUT.

NEVER CONFUSE CLAUDE LOCALHOST WITH JUANMA LOCALHOST.

THE HUMAN MUST BE ABLE TO REPRODUCE THE RELEVANT INTERACTION.

HUMAN-GENERATED VERIFICATION EVIDENCE IS VALID PROJECT EVIDENCE.

EVIDENCE READY / HUMAN QA ACCESS NOT READY ≠ HUMAN GATE COMPLETE.

A HUMAN CANNOT APPROVE AN INTERACTIVE EXPERIENCE HE CANNOT ACTUALLY EXPERIENCE.
```

---

This protocol is part of the Museum V1 Playbook review candidate and must be folded into the consolidated Museum V1 document before the standard is declared finally approved/frozen.
