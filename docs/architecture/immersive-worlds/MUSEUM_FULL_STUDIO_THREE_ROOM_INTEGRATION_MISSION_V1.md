# MUSEUM — FULL STUDIO → THREE-ROOM RUNTIME INTEGRATION MISSION V1

> **Status:** AUTHORIZED IMPLEMENTATION MISSION / HUMAN MERGE GATE REQUIRED  
> **Repository:** `Juanmaes83/escaparates-pro`  
> **Integration branch:** `integration/museum-full-studio-three-room-v1`  
> **Branch base / protected Museum runtime:** `6e6d6ca5ae896eb1f8363203004284b5e06208e2`  
> **Advanced Full Museum Studio source:** `chatgpt/museum-phase2-capability-expansion` @ `6b0de03930c20d3b1323a73fa1eb21246e6424a8`  
> **Product / Visual / Final / Merge Authority:** Juanma

---

## 0. MISSION

Unify the Advanced Full Museum Studio with the existing human-approved three-room Museum without rebuilding the visitor experience.

Target product path:

```text
FULL MUSEUM STUDIO
        ↓
CANONICAL MUSEUM CONFIG / SCHEMA 3
        ↓
ROOM 1 + ROOM 2 — EXISTING SEMANTICS PRESERVED
        ↓
ROOM 3 — MUSEUM-NATIVE BREEZE INSTALLATION AUTHORING
        ↓
EXISTING `breeze-guest.js` / OPTION E1 HOST
        ↓
EXISTING BREEZE CORE
        ↓
CURRENT THREE-ROOM VISITOR RUNTIME
```

The integration changes **authoring/control**, not the accepted experience logic.

---

## 1. REQUIRED SOURCE MEMORY — READ BEFORE IMPLEMENTATION

Read the current Museum Playbook and operative addenda from the documentation branch:

`docs/autonomous-visual-engineering-playbook-museum-v1`

Required documents include:

- `docs/architecture/immersive-worlds/AUTONOMOUS_VISUAL_ENGINEERING_PLAYBOOK_MUSEUM_V1.md`
- `docs/architecture/immersive-worlds/AUTONOMOUS_VISUAL_ENGINEERING_PLAYBOOK_MUSEUM_V1_BROWSER_AUTOMATION_QA_PROTOCOL.md`
- `docs/architecture/immersive-worlds/AUTONOMOUS_VISUAL_ENGINEERING_PLAYBOOK_MUSEUM_V1_CONTINUOUS_EXECUTION_HANDOFF_PROTOCOL.md`
- `docs/architecture/immersive-worlds/AUTONOMOUS_VISUAL_ENGINEERING_PLAYBOOK_MUSEUM_V1_HUMAN_QA_RUNTIME_PROTOCOL.md`
- `docs/architecture/immersive-worlds/AUTONOMOUS_VISUAL_ENGINEERING_PLAYBOOK_MUSEUM_V1_HUMAN_REVIEW_DELIVERY_CONTRACT.md`

Read the integration design memory from:

`docs/museum-studio-breeze-bounded-integration-v1`

Required documents:

- `docs/architecture/immersive-worlds/MUSEUM_STUDIO_BREEZE_INTEGRATION_CAPABILITY_MATRIX_V1.md`
- `docs/architecture/immersive-worlds/MUSEUM_STUDIO_BREEZE_BASELINE_PIN_AND_INTEGRATION_GATE_V1.md`

The prompt defines the mission. The Playbook defines how to work.

---

## 2. PROTECTED BASELINES

Do not alter opportunistically:

- current three-room Museum visitor journey;
- Room 1 behaviour;
- Room 2 behaviour;
- Room 3 / Breeze experience behaviour;
- Venus / cloth / wind / BVH / WebGPU Breeze runtime;
- Museum CameraAuthority;
- Guide;
- Forward / Back;
- room transitions;
- exit / re-entry;
- Crossing B;
- current route semantics;
- current WorldGraph;
- current persistence truth.

Known camera/POV/pacing/transition polish is deferred and is not part of this mission unless the integration creates a regression.

---

## 3. PANEL CUTOVER RULE

The Advanced Full Museum Studio is the intended single product authoring surface.

However:

```text
CONNECT
→ PROVE PARITY
→ PROVE THREE-ROOM END-TO-END
→ MAKE NEW STUDIO NORMAL ENTRY
→ KEEP OLD PANEL ROLLBACK-ONLY
→ JUANMA HUMAN KEEP
→ REMOVE OLD PANEL IN A LATER SEPARATELY AUDITABLE CHANGE
```

Do not delete the old panel first.

---

## 4. ROOM 3 / BREEZE RULE

Room 3 already exists in the Museum and is Human-approved for continuation.

Do not integrate Breeze *into* Museum again.

Integrate the **new Studio authoring controls** with the existing Room-3 Breeze capability.

Authoring model:

```text
ROOM 3
  ↓
INSTALLATION
  ↓
BREEZE
  ↓
BOUNDED SEMANTIC ADAPTER
  ↓
EXISTING `labs/immersive-worlds/app/nested/breeze/breeze-guest.js`
  ↓
EXISTING BREEZE CORE
```

Port capability, not the old Breeze panel/app shell.

Do not expose raw WebGPU, Verlet, BVH, shaders or compute internals as ordinary Museum controls.

---

## 5. FIRST REQUIRED INTEGRATION VERTICAL

Prove the whole backbone with the minimum safe change set:

```text
FULL MUSEUM STUDIO
→ select Room 1
→ change one already-proven authored value
→ select Room 2
→ change one already-proven authored value
→ select Room 3 / Breeze
→ change one bounded Breeze-specific semantic value
→ SAVE
→ PREVIEW
→ ENTER VISITOR
→ Room 1 reflects authored value
→ Room 2 reflects authored value
→ Room 3 reflects Breeze authored value
→ current three-room journey remains coherent
→ EXIT / BACK / FORWARD / RE-ENTER remain correct where relevant
→ RETURN TO STUDIO
→ authored values and Studio context remain preserved
```

Do not expand Breeze depth before this backbone passes.

---

## 6. MANDATORY QA / EVIDENCE LOOP

Material implementation must follow the Museum visual engineering process:

```text
BUILD
→ AUTOMATED TESTS
→ REAL BROWSER RUNTIME
→ PLAYWRIGHT QA
→ PHOTOGRAPHER / DESIGNER AGENT
→ REPRESENTATIVE SCREENSHOTS + TEMPORAL EVIDENCE
→ DEMO STORYBOARD
→ FRESH AMNESIAC CRITIC
→ KEEP / ADJUST / REJECT
→ if ADJUST: FIX + REPEAT AFFECTED QA
→ EVIDENCE PACKAGE
→ HUMAN REVIEW MAP
→ JUANMA KEEP / ADJUST / REJECT
```

Playwright is an automation/evidence instrument, not the final visual product judge.

A screenshot cannot prove motion. Transition, Breeze motion, camera lifecycle and re-entry claims require appropriate temporal evidence.

The fresh critic must not receive builder justifications or implementation excuses.

---

## 7. REQUIRED STORYBOARD

The evidence storyboard must visually prove the integration lifecycle, not merely show attractive screenshots.

Minimum beats:

1. Full Museum Studio open;
2. Room 1 authoring change;
3. Room 2 authoring change;
4. Room 3 selected as a Museum room;
5. Breeze installation controls visible in the unified Studio;
6. bounded Breeze value changed;
7. Save / persisted configured state;
8. Preview transition;
9. visitor Room 1 reflecting authored state;
10. visitor Room 2 reflecting authored state;
11. transition toward Room 3;
12. Room 3 / Breeze entry;
13. Venus + cloth visible;
14. temporal Breeze behaviour evidenced;
15. Guide / camera authority coherent;
16. exit / Back / Forward / re-entry as applicable;
17. Return to Studio;
18. Studio context + authored values preserved.

Before/after comparison should use equivalent state/camera/input where meaningful.

---

## 8. EVIDENCE PACKAGE

Use an organized mission evidence package containing, as applicable:

- implementation record;
- evidence manifest;
- Playwright/browser results;
- diagnostics;
- screenshots;
- temporal/video evidence;
- before/after evidence;
- storyboard + contact sheet;
- Photographer/Designer observations;
- Fresh Amnesiac Critic input/verdict;
- issue/fix loop records;
- Human Review map;
- exact final immutable SHA;
- exact preview/review URLs.

No fake or empty evidence.

---

## 9. HUMAN QA DELIVERY

Human QA is not complete with a URL alone.

Every handoff must provide:

```text
BUILD
OPEN
CHANGE
GO TO
DO
LOOK FOR
MUST NOT CHANGE
KNOWN LIMITATION
RETURN: KEEP / ADJUST / REJECT
```

Review both:

- **PASS A:** targeted integration change;
- **PASS B:** short containing-product regression review.

No visually meaningful vertical is CLOSED before Juanma's Human verdict.

---

## 10. HARD PROHIBITIONS

During this mission:

- no `main` / `master` mutation;
- no merge of PR #58;
- no merge of the current Museum branch merely to simplify work;
- no modification of `Juanmaes83/breeze`;
- no Breeze physics rebuild;
- no second Museum WorldGraph;
- no second CameraAuthority;
- no iframe/second Breeze authoring app as final architecture;
- no destructive old-panel deletion before parity and Human KEEP;
- no opportunistic camera/POV polish;
- no broad scope expansion into Phase 3+ capabilities.

If one dependency is blocked, continue all independent authorized safe work according to the Continuous Execution protocol.

---

## 11. GATE

Implementation may proceed only on this isolated integration branch or a child branch derived from it.

The mission ends at the real Human Gate:

```text
TECHNICALLY PROVEN
+
VISUALLY / TEMPORALLY EVIDENCED
+
FRESH CRITIC KEEP
+
HUMAN REVIEW PACKAGE READY
```

Then STOP for Juanma's verdict.

No merge is authorized by this mission document.
