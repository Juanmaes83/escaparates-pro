# Museum — Current execution status · 2026-08-16

> **Purpose:** short operational source of truth for agents resuming the Museum mission without rereading stale milestone reports.
> **Branch:** `claude/immersive-worlds-module-c0d3f7`
> **Master:** UNTOUCHED
> **Latest product implementation checkpoint referenced:** `4839c36cc37cc8e11b411140b78b20189730ed69`
> **Documentation sync commits:** `ea080dbf...` + `288d55a6...`

---

# 1. Human-approved current Museum baseline

Juanma has reviewed and approved the current product base for continuation:

- Full Museum Studio current base: KEEP / approx. 8/10; refinement deferred.
- Visitor current base: KEEP for continuation; expansion is being developed separately.
- Forward navigation: approved.
- Same-room Back: approved.
- Cross-room Back: approved.
- Back → Forward: approved.
- Current transitions: approved as current baseline; further polish deferred.
- Crossing B: remains Human-preferred baseline and regression boundary.
- Current content loading / save-config / preview / visible-piece flow: Human-proven.

Do not reopen these items during Breeze unless a regression is found.

---

# 2. Parallel-work boundary — mandatory

Panel / Visitor / Full Museum Studio personalization is being developed by Juanma in a separate parallel workstream.

Claude's current Breeze mission must **NOT** modify or redesign:

- Full Museum Studio UI/layout;
- Visitor UI/personalization;
- calendar;
- programme editor;
- map UI;
- Seen / Not Seen UI;
- artwork-progress UI;
- artwork-dimensions UI;
- accessibility UI;
- artist profiles;
- QR/documents/shop UI;
- other Visitor Phase 1 expansion.

If Breeze needs future authoring semantics, document the contract only; do not implement the parallel Panel surface now.

---

# 3. P0 current truth

Authoritative details live in `MUSEUM_P0_REGISTRY.md`.

Current outcome:

- P0.1 CLOSED
- P0.2 EXTERNAL BLOCKER — durable Project Cloud/R2 bytes not cross-session proven
- P0.3 CLOSED
- P0.4 CLOSED
- P0.5 CLOSED
- P0.6 CLOSED
- P0.7 CLOSED
- P0.8 CLOSED
- P0.9 label-card semantic state CLOSED

No currently actionable in-repository P0 work should displace Breeze.

P0.2 must remain honest but must not block Breeze.

---

# 4. Breeze current technical checkpoint

The latest implementation checkpoint has:

- Option E1 specialized nested-room architecture implemented.
- real WebGPU presentation in agent QA configuration.
- real donor Breeze physics.
- 6,561 vertices / 51,040 springs.
- real Venus.
- real cloth.
- real donor wind.
- real BVH/collision path.
- Museum-owned camera semantics.
- corrected floor-anchor / CONTEMPLATION framing.
- cloth spawn adjusted to `[-6, 5.5, 0]`.
- deterministic relaunch every 16 seconds.
- minimum spatial grounding: floor, walls, contact shadow.
- Guide step-aside during hero moment.
- Museum → Breeze → Museum exit/re-entry lifecycle.
- Crossing B preserved.
- current automated Breeze product-path harness: **28/28 PASS, exit code 0**.

This is a technical checkpoint, not Human Product approval.

---

# 5. Known QA/evidence constraint

Headless WebGPU capture under the software adapter is not a fully trustworthy motion observer.

Observed:

- physics steps advance;
- render steps advance;
- presentation works;
- canvas `drawImage()` / pixel readback can return black/zero;
- compositor screenshots can remain byte-stable while simulation advances.

Therefore do not spend large runs trying to force production code to satisfy a suspect capture instrument.

`PRODUCT RUNTIME ≠ QA CAPTURE INSTRUMENT.`

`PRODUCT SIMULATION TIME ≠ SWIFTSHADER WALL-CLOCK TIME.`

Use automated evidence to prove state/lifecycle where trustworthy; use Human visual QA for the final Breeze perceptual verdict.

---

# 6. Remaining Breeze work only

The remaining mission is deliberately narrow:

1. Verify final latest hero composition visually.
2. Ensure the visitor can clearly perceive Venus + cloth + wind + contact/deformation + release/settled state.
3. Confirm the room reads as a Museum installation, not an asset viewer.
4. Confirm Guide intro / absence during hero / return.
5. Confirm forward / exit / Back / re-entry remain coherent.
6. Produce the minimum valid latest visual/motion evidence without overspending on broken headless capture.
7. Run a fresh amnesiac critic on the **latest** Breeze version.
8. Apply only bounded visual corrections if necessary.
9. Prepare a Human-reachable review path.
10. Deliver a concise Review Map.

Do not restart architecture, physics provenance, label-card work or P0 reconciliation.

---

# 7. Human QA delivery contract

The next intended gate must let Juanma do this:

`OPEN REAL MUSEUM → REACH BREEZE → SEE ROOM → SEE VENUS → SEE CLOTH → SEE WIND → SEE VISIBLE CONTACT/DEFORMATION → JUDGE CAMERA → SEE GUIDE INTRO/ABSENCE/RETURN → EXIT → BACK/RE-ENTER → KEEP / ADJUST / REJECT.`

Required final delivery fields:

- OPEN — exact Human-reachable URL/path
- GO TO — exact route to Breeze
- DO — minimal actions
- LOOK FOR — 3–7 concrete visual/product checks
- MUST NOT CHANGE — approved Museum baselines
- KNOWN LIMITATIONS — only real unresolved limitations
- RETURN — KEEP / ADJUST / REJECT

A URL without this Review Map is incomplete.

---

# 8. Continuous execution rule

Do not stop for a local evidence or hosting problem while independent authorized Breeze work remains.

`CHECKPOINT ≠ HANDOFF.`

`A HUMAN GATE MAY BLOCK A DECISION WITHOUT BLOCKING THE AGENT.`

Only return before Human QA Ready if a genuine decision/external/global-stability blocker prevents the next safe meaningful action **and no authorized independent Breeze work remains**.

---

# 9. Agent resumption instruction

An agent resuming from this file should:

1. fetch/reconcile the actual branch HEAD;
2. read this status file;
3. read `MUSEUM_BREEZE_ROOM_STATUS_AND_GATE.md` only for the detailed current Breeze state;
4. read the approved Breeze implementation spec as needed;
5. continue only the remaining Breeze Human-QA vertical;
6. not reread/re-litigate stale historical status statements as current truth;
7. not touch Panel / Visitor / personalization.
