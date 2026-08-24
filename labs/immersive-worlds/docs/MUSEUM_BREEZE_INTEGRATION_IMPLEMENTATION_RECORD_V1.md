# MUSEUM — BREEZE INTEGRATION IMPLEMENTATION RECORD V1

Date: 2026-08-24  
Repository: `Juanmaes83/escaparates-pro`  
Working branch: `chatgpt/museum-breeze-integration-v1`  
Protected base: `652617aa6a4b5a2cb95fa426c9bfa61ab2f1fa73`  
Status: **BOUNDED BREEZE HUMAN GATE — NO MERGE APPROVAL YET**

## 1. Protected baseline

This branch is an exact clone of the Human-PASS Museum integration containing:

- Gallery A — HUMAN PASS;
- Gallery B — HUMAN PASS;
- Itinerant Wet Paint room — HUMAN PASS;
- canonical session media binding through `WorldStore`;
- known non-blocking issue `WET-PAINT-THUMBNAIL-SYNC-01`.

The protected integration branch and `master` must not be modified during the Breeze gate.

## 2. Donor stone

Human-reviewed Breeze lineage:

- donor branch: `claude/immersive-worlds-module-c0d3f7`;
- review checkpoint: `e88c2926d36de6432fa1a6c662e0c2eb725b6b7e`;
- 28/28 implementation checkpoint: `4839c36cc37cc8e11b411140b78b20189730ed69`.

The donor proves:

- Option E1 specialized nested-room architecture;
- WebGPU presentation;
- real Breeze donor physics;
- Venus sculpture + collider;
- 6,561 vertices / 51,040 springs;
- donor wind field;
- Museum-owned camera semantics;
- deterministic cloth relaunch;
- room grounding;
- exit / Back / re-entry lifecycle.

## 3. Audit result — critical finding

**Do not port or rebuild Breeze.**

The protected Museum base already contains the exact proven Breeze seams:

```text
app/nested/nested-room-host.js
app/nested/nested-room-controller.js
app/nested/breeze/breeze-guest.js
vendor/breeze-core/
```

It also already wires `NestedRoomController` inside `app/experience-app.js` and the canonical World already declares:

```json
space.breeze.metadata.nestedRuntime = "room.breeze"
space.breeze.metadata.roomOrigin = [60, 0, -10]
```

Therefore the safe Breeze mission is not a source-code port. It is a **Human gate of an already-present bounded capability** inside the newly frozen A+B+Wet Paint Museum.

## 4. Authority boundary — frozen

```text
MUSEUM
WorldGraph + route + Director + camera + Guide + HUD + lifecycle
        ↓
NestedRoomController
        ↓
NestedRoomHost
        ↓
BreezeGuest
WebGPU + Venus + cloth + wind + Verlet + BVH
```

Permanent rule:

> MUSEUM DECIDES CAMERA. THE GUEST RENDERS IT.

The guest must not gain a second route, HUD, WorldGraph, camera authority or authored persistence truth.

## 5. Safe integration method

Create a dedicated `breeze-integration-studio.html` receiver on this isolated branch.

It reuses the exact Human-PASS A+B+Wet Paint boot stack and adds **diagnostics only**. It does not change the protected `media-recovery-studio.html`, physics, scene kit, route or World.

The receiver is considered technically ready only when:

- Vercel builds the exact branch commit;
- receiver returns HTTP 200;
- Breeze host/controller/guest/vendor modules return HTTP 200;
- then Juanma performs real WebGPU visual QA.

## 6. Human gate

Test path:

```text
OPEN BREEZE INTEGRATION RECEIVER
→ preserve A+B+Wet Paint
→ navigate Gallery B → Sala Breeze
→ guest presentation becomes WebGPU
→ Venus visible
→ cloth visible and moving
→ contact/deformation visible
→ Museum camera remains authority
→ exit to Gallery B
→ re-enter Breeze
→ no orphan canvas/loop
```

Required Human result:

- `BREEZE — PASS`, or
- `BREEZE — ADJUST` with exact defect.

No merge from this branch until explicit Human approval.

## 7. Next after Breeze

Only after Breeze HUMAN PASS:

```text
A + B + Wet Paint + Breeze
        ↓
clone/freeze again if needed
        ↓
Character 2027 / Avatar graft
```
