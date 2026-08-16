# Breeze room — current execution status and next Human Gate

> **Branch:** `claude/immersive-worlds-module-c0d3f7` · **Master:** UNTOUCHED
> **Implementation reference:** `4839c36cc37cc8e11b411140b78b20189730ed69`
> **Product approval:** PENDING HUMAN VISUAL QA
> **Status:** the room is technically integrated and the current automated harness passes **28/28**. The next required gate is Human visual/product review, not another architecture decision.

---

# 0. One-line truth

The Breeze room has moved beyond the earlier 25/27 state. The current implementation includes the real specialized WebGPU room runtime, real donor physics, Venus, cloth, wind, BVH collision path, spatial grounding, Museum-owned camera semantics, Guide step-aside behaviour, exit and re-entry. The current automated product-path harness passes 28/28.

This does **not** equal Product approval. The remaining mission is to confirm, in a real Human-reachable build, that the hero moment is visually legible and worthy of KEEP / ADJUST / REJECT.

---

# 1. What is currently implemented / proven technically

| Capability | Current state |
|---|---|
| Museum guided route reaches Breeze | PASS |
| Option E1 specialized nested-room host | PASS |
| WebGPU presentation | PASS in agent QA configuration |
| Real donor Breeze physics | PASS — 6,561 vertices / 51,040 springs |
| Real Venus | integrated |
| Real cloth | integrated |
| Real donor wind | integrated |
| Venus / BVH collision path | integrated |
| Museum camera authority → Breeze guest | PASS |
| Guide steps aside during hero moment | PASS in current harness |
| Spatial grounding | implemented: dark floor, walls, contact-shadow layer |
| Label card semantic state | CLOSED / PASS |
| Exit restores Museum | PASS |
| Re-entry reactivates Breeze | PASS |
| Orphan loops / runtime errors | none in current 28/28 harness |
| Crossing B | preserved |
| Current automated evidence harness | **28/28, exit code 0** |

Current implementation changes at `4839c36` include:

- corrected Breeze cloth spawn (`[-6, 5.5, 0]`);
- deterministic relaunch every 16 seconds;
- corrected Venus anchor semantics from wall-oriented to floor-oriented;
- CONTEMPLATION framing for floor anchors at visitor-eye-height / subject-centre orientation;
- spatial grounding (floor, bounding walls, contact-shadow element);
- QA timing adjusted so SwiftShader slowness does not drive product timing;
- evidence logic no longer treats headless WebGPU screenshot-byte stability as authoritative physics evidence.

---

# 2. Important evidence limitation — do not reopen product architecture because of it

The agent environment exposed a WebGPU/headless capture limitation:

- physics step counts advance;
- render counts advance;
- WebGPU presentation runs;
- `drawImage()`/canvas readback is not a trustworthy representation of the WebGPU presentation in this mode;
- compositor-cached screenshots can remain byte-stable while the underlying simulation advances.

Therefore:

`HEADLESS SCREENSHOT BYTE IDENTITY ≠ PROOF THAT BREEZE IS STATIC.`

The current harness uses calibrated simulation/step evidence rather than pretending that this capture limitation is a product defect.

Do **not** tune production Breeze timing to SwiftShader wall-clock performance.

`PRODUCT SIMULATION TIME ≠ SOFTWARE QA ADAPTER WALL-CLOCK TIME.`

---

# 3. Label-card defect — CLOSED

The previous label-card defect is no longer an open Breeze/P0 blocker.

Two semantic issues were corrected:

1. Back return re-establishes the correct subject for the active Tour Stop.
2. Focus no longer leaks across a room/space transition.

Result:

- same-room Back restores the correct label;
- cross-room transition does not keep a stale card from the previous room;
- the fix lives at the semantic/world-state layer rather than as a stop-specific patch.

This item is CLOSED unless regression appears.

---

# 4. Human authority / parallel work boundary

Juanma has approved the current Museum base for continuation, including:

- Full Museum Studio current base;
- Visitor current base;
- forward navigation;
- same-room Back;
- cross-room Back;
- Back → Forward;
- current transitions;
- Crossing B as the current Human-preferred baseline.

These are regression boundaries for the Breeze mission.

**Panel / Visitor / Studio personalization is being developed in a separate parallel workstream. Claude must not touch that work as part of the remaining Breeze mission.**

No Breeze authoring/personalization UI should be added in this mission. If future Breeze authoring requirements emerge, document the semantic contract only.

---

# 5. What remains before Breeze can be Human-approved

The current technical pass is a checkpoint, not the final gate.

Remaining product work / proof:

1. Verify the final hero composition visually in the latest build.
2. Confirm the visitor can clearly perceive:
   - Venus as the central anchor;
   - cloth entering the frame;
   - wind affecting the cloth;
   - visible contact/deformation against Venus;
   - release/pass;
   - settled contemplation.
3. Confirm room grounding reads as a Museum installation rather than an asset viewer.
4. Confirm Guide intro → step-aside/absence → return reads coherently.
5. Run a fresh amnesiac critic on the **latest** visual/motion evidence.
6. Apply only bounded corrections if the critic finds a real visual defect.
7. Prepare a Human-reachable review build/path.
8. Deliver the Human Review Map:
   - OPEN
   - GO TO
   - DO
   - LOOK FOR
   - MUST NOT CHANGE
   - KNOWN LIMITATIONS
   - RETURN KEEP / ADJUST / REJECT.

---

# 6. Hosted review constraint

The earlier agent container reported proxy 403 for several hosted origins. That is an **agent-network validation limitation**, not proof that Juanma's browser cannot access those origins.

If the build is correctly addressable but the agent proxy cannot validate it, the final handoff may truthfully state:

`AGENT NETWORK VALIDATION: BLOCKED BY CONTAINER PROXY`

and provide a:

`HUMAN-REACHABLE CANDIDATE: <exact URL>`

without claiming hosted PASS.

Juanma has already demonstrated that RawGitHack can be reachable from his own browser for Museum review surfaces. This does not by itself prove WebGPU presentation on the new Breeze build; that remains part of Human QA.

---

# 7. P0.2 is separate and must not block Breeze

Durable Project Cloud/R2 asset persistence remains an external-blocked P0 until a real cross-session byte lifecycle is proven.

Juanma has already Human-verified the current session/product flow:

`SELECT → LOAD → APPLY → SAVE CONFIG → PREVIEW → PIECE VISIBLE`

Do not confuse that with durable cross-session bytes, but do not block Breeze on P0.2.

---

# 8. Next intended Human Gate

The next valid handoff is:

`JUANMA OPENS THE REAL MUSEUM → REACHES BREEZE → SEES VENUS → SEES CLOTH + WIND → SEES CONTACT/DEFORMATION → JUDGES CAMERA + ROOM → EXPERIENCES GUIDE INTRO/ABSENCE/RETURN → EXITS → GOES BACK / RE-ENTERS → RETURNS KEEP / ADJUST / REJECT.`

A further architecture report, another WebGPU availability probe, or another 28/28 functional run is **not** the target unless required by a new bounded regression.

---

# 9. Current status table

| Item | State |
|---|---|
| P0 label card | **CLOSED / PASS** |
| P0.2 durable asset persistence | **EXTERNAL BLOCKER** |
| Breeze core / donor physics | **PASS** |
| WebGPU presentation | **PASS in agent QA configuration** |
| Real Venus | **PASS technically** |
| Real cloth | **PASS technically** |
| Real wind | **PASS technically** |
| BVH collision path | **PASS technically** |
| Option E1 host | **PASS** |
| Museum camera authority | **PASS** |
| Room grounding | **IMPLEMENTED — HUMAN VISUAL VERDICT PENDING** |
| Guide V1 | **TECHNICALLY PASS — HUMAN VISUAL VERDICT PENDING** |
| Forward / Back / re-entry | **PASS** |
| Crossing B | **PRESERVED** |
| Automated Breeze harness | **28/28 PASS** |
| Fresh critic on latest build | **PENDING** |
| Human QA | **PENDING** |
| Product approval | **PENDING JUANMA** |

---

# 10. Execution rule

Continue from this checkpoint. Do not restart solved work. Do not touch Panel / Visitor / personalization. A local evidence/hosting blocker does not end the mission while other authorized Breeze work remains.
