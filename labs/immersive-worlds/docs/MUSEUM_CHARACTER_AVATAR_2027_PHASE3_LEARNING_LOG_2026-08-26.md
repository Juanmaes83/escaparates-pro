# MUSEUM — CHARACTER / AVATAR 2027 — PHASE 3 LEARNING LOG

**Date:** 2026-08-26  
**Branch:** `chatgpt/museum-character-2027-integration-v1`  
**Purpose:** record what was attempted, what failed, what worked, and the reusable recovery rules so later Character phases do not repeat solved mistakes.  
**Status:** ACTIVE — Phase 3 not yet HUMAN PASS.  

---

# WHY THIS DOCUMENT EXISTS

This project must learn from itself.

When a new problem appears, the default response is **not** to invent a fresh solution immediately.

The required order is:

```text
PROBLEM
  ↓
SEARCH PREVIOUS PROVEN SOLUTION
  ↓
UNDERSTAND WHY IT WORKED
  ↓
CHECK COMPATIBILITY WITH CURRENT MUSEUM
  ↓
REPLICATE / ADAPT THE PROVEN PATTERN
  ↓
ONLY INVENT IF NO VALID PRECEDENT EXISTS
```

This is now a project rule.

---

# PHASE 3 TARGET

The gate currently being built is intentionally narrow:

```text
Gallery A
  ↓
Museum baseline remains intact
  ↓
Character 2027 loads
  ↓
rig valid
  ↓
scale correct
  ↓
grounding correct
  ↓
real IDLE_V2 stable
  ↓
HUMAN VISUAL VALIDATION
```

No locomotion, third-person free movement, portal continuity, Wet Paint/Breeze integration or Avatar Studio belongs to this gate.

Phase 3 is **not PASS** until Juanma opens the supplied URL, visually validates it, records a video, and ChatGPT + Juanma review that evidence together.

---

# WHAT WE DID IN THIS PHASE

## 1. Protected the Museum baseline

The Character presence experiment was isolated behind an opt-in query parameter:

```text
?character=1
```

The default Museum URL must remain free of Character runtime activation.

Reason: a failed Character graft must not alter the normal Museum experience while the gate is still experimental.

## 2. Kept Museum authorities untouched

The Phase 3 graft was deliberately bounded so it does not create or replace:

- `WorldStore`
- `WorldGraph`
- `SpaceLifecycle`
- `SceneKit`
- `CameraAuthority`
- renderer / camera object
- Museum input ownership

The Character must attach to the existing Museum scene and frame loop.

## 3. Confirmed the Three.js ABI

Museum uses a vendored, pinned Three version:

```text
three 0.185.1 / revision 185
```

This matches the frozen Character donor expectation.

Rule: Character must use the same Three ABI. Never introduce a second Three instance merely to load the Character.

## 4. Investigated GLTFLoader dependency

Museum did not already expose the required GLTF loader in its local vendor closure.

A provisional remote loader path was tested to diagnose the gate. The loader itself proved fast and did not generate the observed timeout.

This does **not** change the final architecture rule: the final dependency should be pinned / vendored from the exact compatible Three version, not left as a floating external dependency.

## 5. Tested the approved Character asset provenance

The proven donor architecture already defines the correct asset discipline:

```text
fetch approved asset
  ↓
read complete bytes
  ↓
verify byte length
  ↓
verify SHA-256
  ↓
parse GLB
  ↓
normalize / rig validation
  ↓
accept only if provenance is exact
```

This pattern remains correct.

## 6. Reviewed the frozen Character runtime stone instead of continuing from memory

The exact frozen donor:

`MuseumCharacterRuntimeAdapter.js`

already contains the proven Character presence architecture and explicitly preserves Museum ownership.

It also confirms that real `IDLE_V2` should be activated through the Character motion stack:

```text
MotionController
  ↓
registerMotionFoundationV2(...)
  ↓
transitionTo('IDLE_V2', 0)
```

Therefore a manually reconstructed approximation of `IDLE_V2` is not acceptable when the exact proven implementation already exists in the frozen donor set.

---

# PROBLEMS FOUND AND WHAT WE LEARNED

## PROBLEM 1 — Cross-repository Git blob reuse failed

### Attempt

An apparently elegant route was attempted: reference an existing donor blob SHA directly from a tree in `escaparates-pro`.

GitHub rejected it with the equivalent of:

```text
422 — tree.sha ... is not a valid blob
```

### Root cause

Git objects are repository-scoped for this operation. Knowing the donor SHA is not enough to reference that blob directly from another repository tree.

### Proven solution

The strategy that previously worked and must be reused is:

```text
DONOR EXACTO
VECINIA / CharacterStudio
        │
        │ commit SHA congelado
        ▼
GitHub fetch_blob
        │
        │ devuelve CONTENIDO COMPLETO
        ▼
GitHub create_blob
in escaparates-pro
        │
        ▼
¿SHA DESTINO == SHA DONOR?
        │
   ┌────┴────┐
   │         │
  NO        SÍ
   │         │
PARAR      PIEDRA OK
   │
rehacer
```

Only after every recreated blob returns the exact donor SHA:

```text
verified blobs
  ↓
create_tree
  ↓
create_commit
  ↓
update_ref
```

### Permanent rule

**Blob exacto → SHA idéntico → frozen donor / pinned dependency → sólo después cirugía.**

Never treat copied text, reconstructed content or same filename as proof of identity.

---

## PROBLEM 2 — Trying to use Git CLI as the primary transport path was rejected

### Considered route

```text
clone donor
  ↓
checkout donor commit
  ↓
copy files
  ↓
commit
  ↓
push
```

### Why we did not use it

The environment did not expose Git write credentials with enough confidence for a direct CLI push.

### Lesson

Do not weaken repository safety merely because Git CLI looks convenient.

When exact donor transport is needed, prefer the GitHub Object API process already proven in this project.

---

## PROBLEM 3 — A previous exact-copy verification already caught an incomplete donor copy

Historical example:

`PropertyRoomCharacterTourBridge.js`

First recreation produced the wrong SHA:

```text
009c950d...
```

Expected donor:

```text
27e851d...
```

The operation was stopped before committing.

After fetching the full original blob again, recreation produced:

```text
27e851d28fba4e5f00d099946bf47665e0e18919
```

Then and only then it was accepted.

### Lesson

The SHA check is not ceremony. It has already prevented a corrupted/incomplete donor from entering the frozen quarry.

If SHA differs: **STOP. Do not adapt, patch or commit the mismatch. Recover the exact source first.**

---

## PROBLEM 4 — Initial Phase 3 QA workflow failed before testing the product

### Failure

The first browser QA workflow used assumptions around npm cache / `npm ci` that were incompatible with the repository state because the required lockfile was not present.

### Root cause

The test harness itself was broken before Character or Museum were exercised.

### Resolution

The workflow setup was corrected before interpreting any result as a Character failure.

### Lesson

Always classify failure origin:

```text
HARNESS FAILURE
≠
PRODUCT FAILURE
```

Never patch Museum to solve a CI harness problem.

---

## PROBLEM 5 — Browser QA appeared to hang

### Initial symptom

The Phase 3 browser gate did not settle inside its timeout.

### Diagnostic evidence

Museum itself reached:

```text
iwReady = true
activeSpace = space.gallery-a
CameraAuthority owner = EXPLORE
CameraAuthority violations = 0
```

No browser console errors or HTTP >=400 responses were recorded.

The loader dependencies resolved quickly, while the approved GLB request from R2 was the long operation in the diagnostic run.

### Lesson

Do not conclude that Museum or Character architecture is broken merely because a remote asset + parser exceeds an arbitrary automation timeout.

More importantly, automated browser timing is not the final truth for this visual gate.

---

## PROBLEM 6 — Reconstructing `IDLE_V2` manually was the wrong direction

### What happened

A provisional Character presence implementation started to approximate the idle behavior instead of consuming the exact proven motion foundation.

### Why that is wrong

The repository already contains the exact frozen CharacterStudio motion stack and the VECINIA adapter already proves how to activate it.

### Correct resolution

Recover the established pattern:

```text
frozen MotionController
+
frozen MotionFoundationV2
  ↓
registerMotionFoundationV2
  ↓
IDLE_V2
```

with the necessary Museum-side adapter/wrapper, while leaving the frozen files untouched.

### Permanent rule

**RECOVER BEFORE INVENT.**

If a behavior already exists in a validated donor, never recreate an approximation from memory unless incompatibility is proven and documented.

---

# THE STRATEGY THAT WORKED — GIT OBJECT API

This is now an explicit reusable project playbook.

## Exact transport protocol

1. Pin the donor repository + donor commit SHA.
2. Resolve the source file blob SHA.
3. `fetch_blob` using the donor blob SHA.
4. Obtain the **complete** original content.
5. `create_blob` in `escaparates-pro` using that exact content.
6. Compare returned destination blob SHA against donor SHA.
7. If different: STOP. Nothing enters tree/commit.
8. Re-fetch complete donor content and investigate truncation/encoding/content loss.
9. Only an identical SHA is `PASS`.
10. After all required blobs pass, create tree / commit / ref update.
11. Store exact donor provenance in MANIFEST / learning documentation.
12. Frozen donors remain untouched after transport.

## Integrity invariant

```text
SOURCE BLOB SHA == DESTINATION BLOB SHA
```

means byte-for-byte identity.

That is the acceptance criterion.

---

# NEW PROJECT RECOVERY RULE

From 2026-08-26 onward, when a Character/Museum integration problem appears:

1. Identify the precise failing capability.
2. Search the Museum docs, frozen donor manifest and prior PASS experiments.
3. Ask: **Did we already solve this in VECINIA, CharacterStudio, Museum LAB, Wet Paint, Breeze or an earlier Character gate?**
4. Retrieve the exact previous implementation and evidence.
5. Understand the ownership model and why it worked.
6. Check whether the old assumptions are compatible with the current Museum authorities.
7. Replicate the proven pattern through a Museum-side adapter/wrapper.
8. Do not edit the frozen donor to make it fit.
9. Do not add a new authority if Museum already has one.
10. Invent a new solution only if the precedent is genuinely incompatible, and document why.

Shortcut version:

```text
PROBLEM
↓
¿YA LO RESOLVIMOS ANTES?
├── SÍ → RECUPERAR → ENTENDER → ADAPTAR → VALIDAR
└── NO → DISEÑAR NUEVO → GATE PEQUEÑO → VALIDAR
```

---

# VALIDATION POLICY FOR MAJOR GATES

Technical confidence alone is not sufficient for major visual Character phases.

The required validation chain is:

```text
CODE / STRUCTURAL CHECK
        ↓
INVARIANTS PASS
        ↓
DEPLOYED NAVIGABLE URL
        ↓
JUANMA HUMAN TEST
        ↓
JUANMA RECORDS VIDEO
        ↓
VIDEO SHARED WITH CHATGPT
        ↓
JOINT VISUAL ANALYSIS
        ↓
PASS / CORRECT / REPEAT
```

**No major visual gate is marked PASS before the joint human validation.**

For the current Phase 3 gate, the next deliverable must therefore include the navigable Gallery A URL with Character enabled.

---

# WHAT COUNTS AS PHASE 3 PASS

Phase 3 can only close when all of the following are true:

- Museum Gallery A baseline remains intact.
- Character asset provenance is exact/approved.
- Character attaches to the existing Museum scene.
- rig validation passes.
- Character human scale is correct.
- grounding is correct.
- real `IDLE_V2` from the proven Character motion system is running stably.
- no second renderer.
- no second `WorldStore`.
- no second `CameraAuthority`.
- no Character movement/input is activated yet.
- default Museum without the Character opt-in remains clean.
- navigable test URL is delivered to Juanma.
- Juanma performs human inspection and records video.
- ChatGPT + Juanma analyze that video together.
- explicit human approval is given.

Until then:

```text
PHASE 3 = IN PROGRESS / HUMAN PASS PENDING
```

---

# DO NOT REPEAT

- Do not reference another repository's blob SHA directly in a destination tree.
- Do not accept copied donor content without SHA identity.
- Do not modify a frozen donor to make integration easier.
- Do not invent motion that already exists in CharacterStudio.
- Do not create another Three instance.
- Do not interpret a test harness failure as a Museum failure.
- Do not use arbitrary automation timeout as visual truth.
- Do not move to Phase 4 because Phase 3 "looks probably correct".
- Do not mark a major visual gate PASS without the shared human validation.

---

# CURRENT NEXT ACTION

Continue the same Phase 3 gate only:

```text
replace provisional idle approximation
        ↓
recover exact proven MotionFoundationV2 / IDLE_V2 behavior
        ↓
keep frozen donors immutable
        ↓
connect through Museum-side seam
        ↓
produce navigable Gallery A Character URL
        ↓
JUANMA HUMAN VIDEO VALIDATION
```

Do not advance to Phase 4 until that loop is closed.
