# MUSEUM STUDIO + BREEZE — BASELINE PIN & INTEGRATION GATE V1

> **Status:** PINNED PRE-IMPLEMENTATION GATE — DOCUMENTATION ONLY  
> **Repository:** `Juanmaes83/escaparates-pro`  
> **Workstream:** Immersive Worlds / Museum  
> **Product / Visual / Final / Merge Authority:** Juanma  
> **Companion contract:** `MUSEUM_STUDIO_BREEZE_INTEGRATION_CAPABILITY_MATRIX_V1.md`  
> **Rule:** no runtime mutation, no PR #58 mutation, no Breeze donor mutation, no main/master mutation in this gate.

---

# 0. GATE RESULT

The exact heads required before implementation are now pinned.

```text
CURRENT HUMAN-REVIEWED MUSEUM + THREE-ROOM / BREEZE BRANCH
branch: claude/immersive-worlds-module-c0d3f7
HEAD:   6e6d6ca5ae896eb1f8363203004284b5e06208e2

BREEZE IMPLEMENTATION REFERENCE NAMED BY CURRENT HUMAN GATE
e88c2926d36de6432fa1a6c662e0c2eb725b6b7e

MATERIAL BREEZE ROOM OPTION-E1 PRODUCT IMPLEMENTATION COMMIT
4839c36cc37cc8e11b411140b78b20189730ed69

ADVANCED FULL MUSEUM STUDIO
PR:     #58 — Museum Phase 2 — capability systems expansion
branch: chatgpt/museum-phase2-capability-expansion
HEAD:   6b0de03930c20d3b1323a73fa1eb21246e6424a8
state:  OPEN / DRAFT / NOT MERGED
```

The current Breeze human gate explicitly records:

```text
KEEP FOR CONTINUATION / READY FOR BOUNDED INTEGRATION
```

This is permission to proceed with the bounded cross-stream integration design/implementation mission. It is **not** permission to merge branches, rewrite the renderer, rebuild Breeze, delete the old panel first, or promote anything to main/master.

---

# 1. PROTECTED CURRENT RUNTIME BASELINE

For the next integration mission, the protected current visitor-runtime baseline is the immutable current branch head:

```text
6e6d6ca5ae896eb1f8363203004284b5e06208e2
```

The current status document identifies `e88c2926d36de6432fa1a6c662e0c2eb725b6b7e` as the implementation reference for the human-reviewed Breeze room. The branch has subsequently advanced to `6e6d6ca5...`; therefore implementation must start by comparing against the full current head and must not silently treat an older historical SHA as the whole protected product state.

Protected outcome at this gate includes:

- coherent three-room visitor journey;
- current transition baseline;
- Breeze room as accepted continuation baseline;
- Museum-owned camera semantics;
- Guide integration;
- Forward / Back;
- exit / re-entry;
- Crossing B baseline;
- bounded Option E1 Breeze host;
- real WebGPU Breeze presentation and real donor physics path;
- Venus, cloth, wind and BVH collision path;
- 28/28 Breeze automated product-path harness;
- current Human verdict `KEEP FOR CONTINUATION`.

Known deferred polish — camera/POV, pacing, transition/Guide polish and later art-direction refinements — is **not** a reason to reopen solved Breeze architecture during Studio integration.

---

# 2. ADVANCED FULL MUSEUM STUDIO BASELINE

The integration source for the new Studio is pinned independently:

```text
PR #58
Museum Phase 2 — capability systems expansion
branch: chatgpt/museum-phase2-capability-expansion
HEAD: 6b0de03930c20d3b1323a73fa1eb21246e6424a8
base: chatgpt/museum-visitor-phase1
state: OPEN / DRAFT / NOT MERGED
```

PR #58 already represents the advanced Studio workstream. The integration mission must connect to it; it must not rebuild that Studio inside the Breeze/runtime branch merely to avoid a bounded cross-stream integration.

PR #58 remains untouched until an explicit implementation strategy/branch is authorized.

---

# 3. ROOM 3 / BREEZE — CURRENT RUNTIME INVENTORY

The following files/directories are part of the verified current Room-3/Breeze implementation surface at the protected runtime head.

## 3.1 Museum-side bounded guest

```text
labs/immersive-worlds/app/nested/breeze/breeze-guest.js
```

Role:

- bounded Museum-side Breeze guest / Option E1 host;
- loads the vendored Breeze core;
- owns the specialized guest presentation lifecycle beneath Museum orchestration;
- current material room implementation includes spatial grounding and deterministic cloth relaunch behavior.

This is the primary adapter/runtime seam for the next Studio integration. Do not replace it with an iframe, a second visitor app, or a second authoring shell.

## 3.2 Vendored proven Breeze core

```text
labs/immersive-worlds/vendor/breeze-core/
  LICENSE
  VENDOR.md
  breeze-core.js
  assets/
  build/
```

Verified current core bundle:

```text
labs/immersive-worlds/vendor/breeze-core/breeze-core.js
```

This is runtime capability, not ordinary Museum authoring UI.

## 3.3 Verified Breeze assets

```text
labs/immersive-worlds/vendor/breeze-core/assets/
  Fabric_Lace_038_basecolor-BEhX27r6.png
  Fabric_Lace_038_normal-BxUKKu68.png
  Fabric_Lace_038_opacity-fns7ctB5.png
  Fabric_Lace_038_roughness-Bvc6Sdju.png
  venus_de_milo-Dbz0F30M.glb
  venus_simple2-CmFmRQbP.obj
```

These assets prove the existing Venus/cloth product path and are not a new asset-authoring architecture.

## 3.4 Museum semantic/world integration surfaces

```text
labs/immersive-worlds/worlds/museum-v1.world.json
labs/immersive-worlds/scene-kits/museum/museum-scene-kit.js
```

The material Breeze implementation commit `4839c36cc37cc8e11b411140b78b20189730ed69` touches both, together with `breeze-guest.js`, because Room 3 is a Museum room with Museum semantic anchors/camera framing rather than a detached Breeze application.

These files are **protected integration surfaces**. The next mission may change them only when the bounded semantic contract genuinely requires it and only with regression evidence against the pinned baseline.

## 3.5 Breeze evidence / QA surfaces

Current material implementation/evidence paths include:

```text
labs/immersive-worlds/qa/tools/author-breeze-room.mjs
labs/immersive-worlds/qa/tools/breeze-room-evidence.mjs
labs/immersive-worlds/qa/evidence-vs02/breeze-room/
```

They are evidence/authoring-test infrastructure, not product runtime truth. Existing valid evidence must be preserved and reused according to impact scope rather than discarded automatically.

---

# 4. AUTHORITY SPLIT — FROZEN FOR THE FIRST INTEGRATION VERTICAL

```text
FULL MUSEUM STUDIO
  owns: author-facing Museum configuration

MUSEUM
  owns: world / room lifecycle
        visitor camera authority
        Guide
        route
        Forward / Back
        transitions
        exit / re-entry
        publication surface

BOUNDED BREEZE ADAPTER / OPTION E1 HOST
  owns: translation of supported semantic Breeze installation values
        lifecycle bridge into the proven Breeze guest

BREEZE CORE
  owns: cloth physics
        wind / compute
        BVH collision mechanics
        proven specialized runtime internals
```

No ordinary Studio control may expose WebGPU, Verlet, raw BVH, shader/compute internals or create a second camera/world/persistence truth.

---

# 5. SAFE PANEL CUTOVER — FROZEN ORDER

The old panel is **not deleted at the start**.

```text
1. protect 6e6d6ca5... runtime baseline
2. protect PR #58 / 6b0de039... Studio baseline
3. create isolated integration branch from an explicitly chosen base
4. connect Full Museum Studio to existing canonical Museum data
5. connect Room 3 through bounded Breeze installation adapter
6. prove Rooms 1 + 2 + 3 end to end
7. prove Save → Preview → Visitor Runtime → Return
8. prove current route/camera/Guide/Back/crossing/re-entry remain stable
9. make Full Museum Studio the normal authoring entry point
10. retain previous panel temporarily as rollback-only
11. Juanma human acceptance
12. only then remove the old panel/entry point in a separately auditable change
```

`RETIRE OLD PANEL` therefore means safe replacement after parity, not destructive deletion before proof.

---

# 6. NEXT IMPLEMENTATION MISSION BOUNDARY

The first integration vertical may now be prepared because the required product heads are pinned and the Breeze room already has the Human continuation verdict.

The mission should be bounded to:

```text
ADVANCED FULL MUSEUM STUDIO
        ↓
CURRENT CANONICAL MUSEUM CONFIG
        ↓
ROOM 1 / ROOM 2 unchanged semantics
        ↓
ROOM 3 — BREEZE INSTALLATION semantic config
        ↓
EXISTING OPTION E1 / breeze-guest.js
        ↓
EXISTING BREEZE CORE
        ↓
CURRENT VISITOR RUNTIME
```

The first vertical must not:

- merge PR #58;
- merge the current Museum branch;
- touch main/master;
- modify `Juanmaes83/breeze`;
- rebuild Breeze physics;
- globally replace Museum WebGL with WebGPU;
- create a second panel as the final architecture;
- delete the old panel before parity + rollback proof;
- opportunistically polish deferred camera/POV issues;
- change existing experience logic merely because authoring is being unified.

---

# 7. ROLLBACK / AUDIT ANCHORS

```text
PROTECTED MUSEUM / ROOM-3 CURRENT HEAD
6e6d6ca5ae896eb1f8363203004284b5e06208e2

BREEZE HUMAN-GATE IMPLEMENTATION REFERENCE
e88c2926d36de6432fa1a6c662e0c2eb725b6b7e

MATERIAL BREEZE ROOM IMPLEMENTATION
4839c36cc37cc8e11b411140b78b20189730ed69

ADVANCED STUDIO HEAD
6b0de03930c20d3b1323a73fa1eb21246e6424a8
```

These four SHAs are the audit/rollback landmarks for the next cross-stream mission. They do not authorize a merge between them.

---

# 8. GATE VERDICT

```text
BASELINES PINNED                PASS
CURRENT THREE-ROOM HEAD         PINNED
BREEZE HUMAN GATE               KEEP FOR CONTINUATION
ROOM-3 RUNTIME SEAM             IDENTIFIED
BREEZE CORE / ASSETS            IDENTIFIED
ADVANCED STUDIO HEAD            PINNED
PR #58                          UNTOUCHED
BREEZE DONOR REPO               UNTOUCHED
MAIN / MASTER                   UNTOUCHED
RUNTIME CODE                    UNTOUCHED BY THIS GATE
OLD PANEL                       NOT DELETED

NEXT:
BOUNDED STUDIO ↔ CURRENT MUSEUM ↔ ROOM-3/BREEZE INTEGRATION VERTICAL
```
