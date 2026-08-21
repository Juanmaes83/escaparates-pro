# Museum — P0 registry

> **Status:** CURRENT SINGLE SOURCE OF TRUTH for P0 state.
> **Branch:** `claude/immersive-worlds-module-c0d3f7` · **Master:** UNTOUCHED
> **Updated against implementation HEAD:** `4839c36cc37cc8e11b411140b78b20189730ed69`
> **Human authority update:** Juanma has reviewed and approved the current Full Museum Studio / Visitor base, forward/back behaviour and current transitions for continuation. Refinement may continue later without reopening the original P0 unless regression appears.

States:

| State | Meaning |
|---|---|
| **CLOSED** | Required technical work is complete and a Human verdict exists |
| **TECHNICALLY CLOSED / HUMAN QA PENDING** | Agent evidence exists but Human verdict is still missing |
| **OPEN** | Work remains that can be completed in-repo |
| **EXTERNAL BLOCKER** | Cannot be closed without required external capability/configuration |
| **REGRESSED** | Previously accepted behaviour has broken |

---

# Current registry

| # | P0 | State | Current truth |
|---|---|---|---|
| P0.1 | Visitor authoring — editorial measure | **CLOSED** | Human reviewed the Full Museum Studio / Visitor base and approved it for continuation (approx. 8/10; future refinement explicitly deferred) |
| P0.2 | Persistent assets — real durable bytes | **EXTERNAL BLOCKER** | Session-level select/apply/save-config/preview is Human-proven, but durable cross-session byte persistence through Project Cloud/R2 is still not proven |
| P0.3 | Authoring → VISITA | **CLOSED** | 12/12 technical traceability plus Human review of the current Visitor/VISITA base; later expansion is a new capability track, not reopening this P0 |
| P0.4 | Guided Back — same room | **CLOSED** | Human approved Back behaviour; canonical direct return remains technically proven |
| P0.5 | Guided Back — cross room | **CLOSED** | Human approved cross-room Back; return crosses the doorway rather than teleporting |
| P0.6 | Canonical settled pose per Tour Stop | **CLOSED** | Forward settle / canonical / Back return contract technically agrees; current behaviour Human accepted |
| P0.7 | HUD Tour Stop counter | **CLOSED** | Counts visitor Tour Stops rather than internal beats; Human-reviewed current route accepted |
| P0.8 | Crossing B — regression protection | **CLOSED** | Current Crossing B remains the Human-preferred baseline; later polish may occur without reopening the accepted baseline |
| P0.9 | Label card semantic state after Back / crossing | **CLOSED** | Fixed at semantic/world-state level; same-room Back restores the correct subject and room crossing no longer leaks stale focus |

**Current P0 conclusion:** all currently actionable in-repository P0 work is closed. **P0.2 remains the only unresolved P0 and is external-blocked.**

---

# P0.2 — exact boundary

Juanma has Human-proven the current product flow:

`SELECT → LOAD → APPLY → SAVE CONFIG → PREVIEW → PIECE VISIBLE`

That is accepted product behaviour, but it is not the same contract as durable asset persistence.

P0.2 can only become CLOSED when this is proven:

`SESSION A → upload real bytes → save project → end session → SESSION B → reopen project → same asset reference resolves → same bytes are retrieved from durable storage`

Current technical distinction:

| Layer | Current meaning |
|---|---|
| `MediaVault` / `authored:<id>` | session-scoped browser/object-URL media path |
| `ProjectCloudAssets` / `asset:<id>` | prepared durable Project Cloud/R2 path |

Do not create a parallel persistence backend. Do not embed a long-lived bearer token in a static client.

External prerequisites remain the API/runtime/project/storage environment required by the accepted Project Cloud architecture.

---

# Current Breeze relation (not P0)

Breeze is now an active P1/new-room vertical, not a frozen Phase 1A spike.

As of implementation HEAD `4839c36`:

- Option E1 nested specialized room runtime: implemented and technically passing.
- Real WebGPU presentation: PASS in agent QA configuration.
- Real donor physics: PASS — 6,561 vertices / 51,040 springs.
- Real Venus, cloth, wind and BVH path: integrated.
- Spatial grounding: floor, walls and contact-shadow layer added.
- Museum → Breeze → Museum lifecycle and re-entry: PASS in the current 28/28 harness.
- Camera authority remains Museum-owned.
- Guide steps aside for the hero moment.
- Crossing B remains preserved.
- **Product approval remains PENDING HUMAN VISUAL QA.**

The next gate for Breeze is not another P0 gate; it is the visual Human QA of the new room.
