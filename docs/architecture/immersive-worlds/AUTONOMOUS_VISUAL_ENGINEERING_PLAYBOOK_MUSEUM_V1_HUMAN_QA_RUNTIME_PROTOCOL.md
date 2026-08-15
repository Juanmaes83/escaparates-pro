# AUTONOMOUS VISUAL ENGINEERING PLAYBOOK — MUSEUM V1
## HUMAN QA NAVIGABLE RUNTIME PROTOCOL

> **Status:** MANDATORY OPERATIVE ADDENDUM TO MUSEUM V1 WHILE THE PLAYBOOK IS UNDER VALIDATION  
> **Repository:** `Juanmaes83/escaparates-pro`  
> **Authority:** Juanma — Product Owner / Visual Authority / Final Decision / Merge Authority  
> **Purpose:** make Human QA reproducible on the real implementation, not only on static evidence.  
> **Authority note:** the Museum V1 Playbook is operative for Museum work by latest explicit Juanma instruction even while its final frozen/approved status remains pending. `OPERATIVE` and `FINAL-FROZEN` are different states.

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

Preferred preview hierarchy when technically compatible with the project:

```text
1. COMMIT-PINNED STATIC PREVIEW
   e.g. a commit-addressable static renderer such as raw.githack.com
   Use when the project can run faithfully as static repository files.

2. STABLE GITHUB PAGES / EQUIVALENT STATIC PUBLISH
   Use for an intentionally maintained persistent approved/demo surface.

3. COMMIT-IDENTIFIABLE VERCEL / HOSTED PREVIEW
   Prefer when build steps, routing, server functions, environment variables,
   framework behaviour or deployment-only conditions matter.

4. REVIEWER-LOCAL RUNTIME
   Exact branch + commit + command + URL on Juanma's own machine.

5. HUMAN QA ACCESS NOT READY
```

This is a **fitness-for-purpose hierarchy**, not a rule that static hosting is always superior. The preview method must reproduce the real product correctly.

A GitHub `blob/...` file URL, evidence board, raw source file, screenshot folder or Claude-container localhost is not a navigable product preview.

> **PREFER COMMIT-PINNED REVIEW ACCESS OVER MOVING BRANCH ALIASES WHEN PRACTICAL.**

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
2. Observe loading/readiness before entering.
3. Enter the real visitor experience.
4. Navigate freely enough to establish spatial orientation.
5. Open Visitor / institutional information.
6. Inspect desktop and mobile/responsive behaviour when relevant.
7. Follow the real Guided route or production interaction that triggers the portal crossing.
8. Cross from the source room to the destination room.
9. Observe approach, takeover, crossing, reverse-facing exit, recoil, reveal and settle.
10. Repeat if needed while recording an independent verification video.
```

The instructions must use the real product path, not a QA-only shadow path.

Where possible, Juanma should perform a first uncoached pass before reading a detailed builder diagnosis of the expected defect. This preserves an independent Human First-Glance signal. Detailed defect reproduction can follow afterward.

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

Three different facts must never be collapsed into one:

```text
DEPLOYMENT EXISTS
≠ AGENT CAN ACCESS / VERIFY DEPLOYMENT
≠ HUMAN REVIEWER CAN ACCESS / EXPERIENCE DEPLOYMENT
```

For Human QA, the third fact is decisive. If Claude's environment cannot reach the preview but Juanma can, Claude must state the network limitation rather than pretending verification or rejecting a valid human-accessible preview.

---

# 6. PREVIEW ACCESS VALIDATION

Before handing over a preview URL or local launch procedure, Claude must verify the path as far as its environment allows and state what was actually verified.

For an external preview:

```text
[ ] URL / deployment exists
[ ] exact branch/build/commit relationship known
[ ] actual Museum runtime expected at the route
[ ] relevant feature reachable if the agent can access it
[ ] no obvious blocking console/runtime failure if the agent can access it
[ ] human reviewer access separately confirmed when Human QA begins
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

If environment policy blocks external verification, use an explicit state such as:

```text
DEPLOYMENT FOUND: YES
CLAUDE NETWORK VERIFICATION: BLOCKED BY ENVIRONMENT
HUMAN ACCESS VERIFICATION: PENDING
```

Do not bypass network policy merely to turn an unknown into a PASS.

---

# 7. IMMUTABLE REVIEW TARGET / BRANCH-ALIAS DRIFT

A Human Gate should point to an immutable or clearly pinned review target whenever practical.

> **A MOVING BRANCH ALIAS IS NOT, BY ITSELF, IMMUTABLE HUMAN-GATE EVIDENCE.**

A branch-based preview URL may move when a new successful deployment is produced. Therefore before Human QA:

```text
[ ] record branch
[ ] record HEAD / commit SHA
[ ] record deployment/build identity when available
[ ] state whether the URL is commit-pinned or branch-moving
[ ] avoid pushes that silently retarget the review URL while the gate is open
```

If only a branch alias exists and it is the active Human QA target, hold unnecessary pushes until review is complete, or provide another immutable/pinned access path.

If a push must occur, the previous Human Gate remains attached to its prior commit/evidence set. Do not silently ask the human to continue reviewing a different build under the same gate label.

---

# 8. ONE INDEPENDENT GATE → ONE PINNED EVIDENCE IDENTITY

When two independent product decisions can receive different Human verdicts, they should have independently identifiable evidence whenever practical.

> **ONE INDEPENDENT HUMAN DECISION SHOULD HAVE ONE UNAMBIGUOUS PINNED REVIEW IDENTITY.**

This does not require wasteful duplicate commits for every screenshot. It requires enough separation that the project can represent:

```text
GATE A = APPROVED
GATE B = REJECTED
```

without making it unclear which commit, artifact, video, board or runtime each verdict refers to.

Acceptable strategies include:

```text
separate pinned commits
separate immutable deployment IDs
separate evidence manifests tied to the same commit
separate gate folders / run IDs with explicit commit SHA
```

If multiple gates intentionally share one commit, document that fact and preserve separate gate manifests/evidence identities.

---

# 9. EVIDENCE + RUNTIME ARE COMPLEMENTARY

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
AGENT VIDEO WHEN MOTION MATTERS
+
STORYBOARD / COMPARISON BOARD WHEN REFERENCE FIDELITY MATTERS
+
FRESH AMNESIAC CRITIC VERDICT
+
SHORT HUMAN REPRODUCTION PATH
+
HUMAN-GENERATED VERIFICATION EVIDENCE WHEN PRODUCED
```

Runtime proves what the reviewer can actually experience.

Evidence makes the review comparable, repeatable and auditable.

Neither should silently replace the other.

---

# 10. HUMAN-GENERATED VERIFICATION EVIDENCE

Juanma may create his own screenshots or screen recording while navigating the real project. For interaction, motion, discoverability, spatial continuity and experiential QA, this is first-class Human evidence.

> **HUMAN-GENERATED RUNTIME VIDEO IS VALID PROJECT EVIDENCE, NOT AN INFORMAL COMMENT.**

When Human QA produces independent evidence:

```text
HUMAN CAPTURE
→ preserve the original when useful
→ label branch / commit / build / preview identity if known
→ record viewport/device/browser when materially relevant
→ record whether the pass was spontaneous or defect-directed
→ compare against agent evidence when they disagree
→ classify the discrepancy before changing product code
→ preserve the Human verdict separately from Builder/Critic verdicts
```

For motion-critical or interaction-critical gates, a human-recorded runtime video is strongly preferred when feasible because it proves:

```text
REAL HUMAN ENTRY
REAL NAVIGATION
REAL DISCOVERABILITY
REAL TIMING PERCEPTION
REAL INTERACTION PATH
REAL TRANSITION EXPERIENCE
REAL FAILURE / SUCCESS AS EXPERIENCED
```

The Human video does **not** eliminate the need for deterministic agent evidence. The two answer different questions:

```text
DETERMINISTIC / INSTRUMENTED EVIDENCE
= what happened at precisely controlled states

HUMAN RUNTIME VIDEO
= what the experience actually felt/read like during real use
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

# 11. HUMAN FIRST-GLANCE + DIRECTED REPRODUCTION

When practical, Human QA has two passes:

```text
PASS 1 — INDEPENDENT EXPERIENCE
Juanma enters and navigates with only the minimum route needed to reach the feature.
Goal: discover what reads naturally, what is confusing, what is missed and what feels wrong without being coached toward the builder diagnosis.

PASS 2 — DIRECTED REPRODUCTION
Use the known defect/acceptance description to intentionally reproduce and inspect the disputed behaviour.
```

This avoids turning Human QA into confirmation of the builder's narrative.

A Human finding that appears during Pass 1 can be more valuable than the defect the agent expected Juanma to inspect.

---

# 12. READINESS / ENTRY SEMANTICS ARE PART OF HUMAN QA

If the entry surface exposes both a readiness/loading state and an Enter/Start control, their semantics must be coherent.

Human QA should observe:

```text
WHAT STATE IS CLAIMED?
IS ENTRY ENABLED?
WHAT HAPPENS IF THE HUMAN ENTERS NOW?
IS THE RUNTIME ACTUALLY READY FOR THE EXPERIENCE PROMISED?
DOES THE UI CHANGE STATE CONSISTENTLY?
```

A screenshot that shows an active entry control while still claiming work such as `Compilando materiales...` is not automatically a bug; it is a **readiness-semantic question** that the running experience must resolve.

Do not infer the answer from one static frame when a short runtime observation can prove it.

---

# 13. INCIDENTAL HUMAN FINDINGS MUST NOT SILENTLY EXPAND THE ACTIVE GATE

Real Human navigation may expose adjacent visual or product debt outside the active mission: HUD hierarchy, identity scale, Scene Kit polish, lighting/material quality, architecture, clipping, unrelated controls, etc.

Record such findings, but classify them:

```text
AFFECTS CURRENT GATE ACCEPTANCE
→ include in current verdict

ADJACENT DEFECT / DEBT
→ log for later mission; do not silently expand the current implementation scope

GLOBAL CONTRACT RISK
→ stop / escalate under the Playbook
```

> **SEEING A DEFECT DOES NOT AUTOMATICALLY AUTHORIZE FIXING IT.**

This preserves Human visual intelligence without allowing uncontrolled mission growth.

---

# 14. HUMAN GATE TEMPLATE — UPDATED

For interactive/visual Museum work, a trustworthy handoff must now state:

```text
BRANCH
HEAD / COMMIT
MISSION / QUESTION
GATE IDENTITY / RUN ID
WHAT CHANGED
WHAT DID NOT CHANGE
TARGETED QA RESULTS
KNOWN LIMITATIONS / DEBT

NAVIGABLE REVIEW ACCESS
- commit-pinned static preview; OR
- hosted preview + deployment/build identity; OR
- exact reviewer-local launch instructions

PREVIEW MUTABILITY
- COMMIT-PINNED / IMMUTABLE; OR
- BRANCH-MOVING — push freeze / replacement plan stated

AGENT ACCESS VERIFICATION
HUMAN ACCESS VERIFICATION

HUMAN REPRODUCTION PATH
...

HUMAN FIRST-GLANCE PASS
HUMAN DIRECTED REPRODUCTION PASS when needed

VIDEOS / SCREENSHOTS / BOARDS
HUMAN-GENERATED VIDEO / SCREENSHOTS when produced
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

# 15. STANDARD MISSION LIFECYCLE — RUNTIME-AWARE

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
→ PIN / IDENTIFY REVIEW BUILD
→ VERIFY REVIEW ACCESS AS FAR AS ENVIRONMENT ALLOWS
→ UPDATE IMPLEMENTATION + LEARNING MEMORY
→ HUMAN GATE
→ HUMAN FIRST-GLANCE NAVIGATION
→ HUMAN-GENERATED VIDEO / SCREENSHOTS WHEN USEFUL
→ DIRECTED REPRODUCTION WHEN NEEDED
→ CLASSIFY INCIDENTAL FINDINGS WITHOUT SCOPE CREEP
→ DECISION
```

Canonical rule:

> **A HUMAN CANNOT APPROVE AN INTERACTIVE EXPERIENCE HE CANNOT ACTUALLY EXPERIENCE.**

---

# 16. ANTI-PATTERNS

Do not:

- send a GitHub `blob/...html` link and call it the product preview;
- send a screenshot board as a substitute for the runtime;
- send Claude-container `localhost`/`127.0.0.1` to Juanma;
- require Juanma to infer branch, command, directory or port;
- treat `deployment exists` as proof that the agent or human can access it;
- claim external preview verification when the agent network policy blocked it;
- bypass environment/network policy merely to manufacture a PASS;
- use a moving branch preview as if it were immutable evidence without saying so;
- push a branch during an open Human Gate when that push silently retargets the only review URL;
- combine independent Human Gates so tightly that approve/reject outcomes cannot be traced separately;
- request transition approval when the human cannot trigger the transition himself;
- request Visitor approval when the human cannot open and navigate Visitor in the real app;
- coach the Human with the builder diagnosis before an independent first-glance pass when such independence is practical;
- treat Human-recorded runtime video as anecdotal or secondary merely because automated evidence exists;
- infer a readiness defect from one static frame when the runtime can resolve the question;
- silently expand the active mission because Human navigation exposed unrelated visual debt;
- treat generated evidence as more authoritative than contradictory real Human runtime behaviour without investigation;
- change product code before classifying a Human-vs-instrument discrepancy;
- call the Human Gate ready when runtime access is not ready.

---

# 17. FINAL RULES

```text
PREVIEW ACCESS IS PART OF THE DELIVERABLE, NOT AN AFTERTHOUGHT.

HUMAN QA REQUIRES A NAVIGABLE RUNTIME.

STATIC EVIDENCE SUPPORTS HUMAN QA; IT DOES NOT REPLACE THE RUNTIME.

PREFER COMMIT-PINNED REVIEW ACCESS OVER MOVING BRANCH ALIASES WHEN PRACTICAL.

DEPLOYMENT EXISTS ≠ AGENT ACCESS ≠ HUMAN ACCESS.

ONE INDEPENDENT HUMAN DECISION SHOULD HAVE ONE UNAMBIGUOUS PINNED REVIEW IDENTITY.

REAL PRODUCT PATH BEFORE HARNESS SHORTCUT.

NEVER CONFUSE CLAUDE LOCALHOST WITH JUANMA LOCALHOST.

THE HUMAN MUST BE ABLE TO REPRODUCE THE RELEVANT INTERACTION.

HUMAN-GENERATED RUNTIME VIDEO IS VALID PROJECT EVIDENCE.

DETERMINISTIC EVIDENCE AND HUMAN EXPERIENCE EVIDENCE ARE COMPLEMENTARY.

PRESERVE AN INDEPENDENT HUMAN FIRST-GLANCE SIGNAL WHEN PRACTICAL.

READINESS SEMANTICS MUST BE VERIFIED IN THE RUNNING EXPERIENCE.

SEEING A DEFECT DOES NOT AUTOMATICALLY AUTHORIZE FIXING IT.

EVIDENCE READY / HUMAN QA ACCESS NOT READY ≠ HUMAN GATE COMPLETE.

A HUMAN CANNOT APPROVE AN INTERACTIVE EXPERIENCE HE CANNOT ACTUALLY EXPERIENCE.
```

---

This protocol is an operative mandatory part of the Museum V1 Playbook while Museum V1 is under validation. Its rules must be folded into the consolidated Museum V1 document before the standard is declared finally approved/frozen.