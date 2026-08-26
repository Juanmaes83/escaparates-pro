# MUSEUM — CHARACTER / AVATAR 2027 PROGRESS TRACKER

**Status:** ACTIVE  
**Branch:** `chatgpt/museum-character-2027-integration-v1`  
**Protected Museum baseline:** `4fbca5997beaf058543ee65d682f0adae89252e2`  
**Companion roadmap:** `MUSEUM_CHARACTER_AVATAR_2027_SURGERY_ROADMAP.md`  
**Frozen donor manifest:** `labs/immersive-worlds/donors-frozen/character-2027/MANIFEST`  
**Phase 2 execution record:** `MUSEUM_CHARACTER_AVATAR_2027_PHASE2_ANATOMY_COMPATIBILITY_EXECUTION_2026-08-26.md`

This is the living comparison between **what is already done** and **what is still missing**.

Legend: `PASS` = proven/frozen · `PENDING` = not started · `IN PROGRESS` = active work · `BLOCKED` = dependency/error · `CONTEXT_REQUIRED` = capability exists but real physical/semantic context is missing.

---

# CURRENT EXECUTIVE STATUS

| Area | Status | Evidence / Notes |
|---|---|---|
| Museum four-room freeze | PASS | Gallery A + Gallery B + Wet Paint + Breeze protected at `4fbca599...` |
| Character surgery branch | PASS | `chatgpt/museum-character-2027-integration-v1` |
| Roadmap | PASS | saved in GitHub |
| VECINIA provenance | PASS | `45e454febe2deb3b88bf5e5b527c4a5f86fe8eb1` |
| CharacterStudio provenance | PASS | `f5a93a48ed0e3904fce58f08f7fbe08b5411b289` |
| VECINIA donor freeze | PASS | 10/10 byte-identical files |
| CharacterStudio donor freeze | PASS | 18/18 byte-identical files |
| Complete CharacterStudio IK family | PASS | 5/5 files frozen |
| CharacterStudio dependency closure | PASS | `TerrainSemanticBenchmarks.js` + `VRMRigMapMixamo.js` frozen |
| Avatar Studio knowledge donors | PASS | `Create.jsx` + `Appearance.jsx` + `MotionLab.jsx` frozen |
| Donor manifest | PASS | 28/28 exact source/destination blob SHA inventory |
| Anatomy / compatibility | **PASS / CLOSED** | Phase 2 execution record 2026-08-26 |
| Museum Three ABI | **PASS** | vendored `three 0.185.1`, exact pinned |
| Character runtime activation | **PASS / ACTIVE** | Phase 3 presence + Phase 4A bounded runtime graft |
| Character visible in Museum | **PASS** | Juanma human visual validation 2026-08-26 in Gallery A |
| Character presence / IDLE | **PASS / CLOSED** | Phase 3 human gate completed 2026-08-26 |
| Third-person free mobility / collision | **PASS / CLOSED** | Human validation approved 2026-08-26 after focus-return + adaptive framing fixes |
| Room-to-room continuity | **NEXT / PHASE 4B** | same Character Gallery A → Gallery B |
| Artwork Focus 3rd→1st→3rd | PARTIAL FOUNDATION PASS | Focus return to THIRD_PERSON_EXPLORE fixed in 4A; full authored contemplation flow remains Phase 4C |
| Wet Paint / Breeze Character integration | PENDING | Phase 4D |
| Avatar Profile / Studio | PENDING | Phase 5 |
| Advanced capabilities | PENDING | Phase 6 |

---

# PHASE 0 — FREEZE & PROVENANCE

- [x] Preserve Gallery A
- [x] Preserve Gallery B
- [x] Preserve Wet Paint
- [x] Preserve Breeze PRO
- [x] Create Character surgery branch
- [x] Pin VECINIA donor SHA
- [x] Pin CharacterStudio donor SHA
- [x] Re-audit WORLD-COSTA-BLANCA
- [x] Save surgery roadmap
- [x] Create progress tracker

**PHASE 0 = PASS / CLOSED**

---

# PHASE 1 — BRING THE STONES WHOLE

## A. VECINIA runtime family — 10/10 PASS

| Stone | Import | Activation |
|---|---|---|
| `ExteriorCharacterPilot.js` | PASS | NOT ACTIVE / late |
| `MuseumCharacterRuntimeAdapter.js` | PASS | NOT ACTIVE / design donor for first surgery |
| `PropertyRoomCharacterCapabilityBatches.js` | PASS | NOT ACTIVE / advanced |
| `PropertyRoomCharacterCinematicCamera.js` | PASS | NOT ACTIVE / advanced |
| `PropertyRoomCharacterFreeMobility.js` | PASS | NOT ACTIVE / behavior donor, not literal production mount |
| `PropertyRoomCharacterTourBridge.js` | PASS | NOT ACTIVE / advanced |
| `PropertyRoomSemanticAuthoring.js` | PASS | NOT ACTIVE / advanced |
| `PropertyRoomSemanticAuthoringBridge.js` | PASS | NOT ACTIVE / advanced |
| `exterior-pilot-skeleton.js` | PASS | NOT ACTIVE / late |
| `full-world-c2-skeleton.js` | PASS | NOT ACTIVE / last |

## B. CharacterStudio core/runtime closure — 15/15 PASS

| Stone | Import | Activation |
|---|---|---|
| `CharacterActionAPI.js` | PASS | NOT ACTIVE |
| `MotionController.js` | PASS | NOT ACTIVE |
| `MotionFoundationV2.js` | PASS | NOT ACTIVE |
| `MotionFoundationV2Extra.js` | PASS | NOT ACTIVE |
| `SocialMotionFoundationV3.js` | PASS | NOT ACTIVE |
| `Retargeter.js` | PASS | NOT ACTIVE |
| `BoneMap.js` | PASS | NOT ACTIVE |
| `LookAtController.js` | PASS | NOT ACTIVE |
| `TerrainSemanticBenchmarks.js` | PASS | NOT ACTIVE / dependency closure |
| `ContactIKController.js` | PASS | NOT ACTIVE |
| `DonorTwoBoneIK.js` | PASS | NOT ACTIVE |
| `HumanoidIKController.js` | PASS | NOT ACTIVE |
| `LadderIKExtension.js` | PASS | NOT ACTIVE |
| `TerrainSemanticIK.js` | PASS | NOT ACTIVE |
| `VRMRigMapMixamo.js` | PASS | NOT ACTIVE / dependency closure |

## C. CharacterStudio Avatar/Studio knowledge donors — 3/3 PASS

| Stone | Import | Activation |
|---|---|---|
| `Create.jsx` | PASS | KNOWLEDGE ONLY |
| `Appearance.jsx` | PASS | KNOWLEDGE ONLY |
| `MotionLab.jsx` | PASS | KNOWLEDGE ONLY / never visitor runtime as-is |

## Phase 1 integrity

- [x] VECINIA 10/10 physically present
- [x] CharacterStudio 18/18 physically present
- [x] complete 5-file IK family preserved
- [x] dependency closure preserved
- [x] original source paths recorded
- [x] source branches/commits recorded
- [x] exact Git blob SHAs recorded
- [x] source blob SHA equals destination blob SHA for all 28 frozen files
- [x] no donor stone edited during transport
- [x] no donor frozen file imported by Museum runtime
- [x] Character remains inactive

**PHASE 1 — BRING THE STONES WHOLE = PASS / CLOSED**

---

# PHASE 2 — ANATOMY / COMPATIBILITY

Execution record:

`labs/immersive-worlds/docs/MUSEUM_CHARACTER_AVATAR_2027_PHASE2_ANATOMY_COMPATIBILITY_EXECUTION_2026-08-26.md`

| Authority / seam | Status | Closed decision |
|---|---|---|
| Character body/action ownership | PASS | Character owns body/root, rig, animation, CharacterActionAPI, LookAt/IK |
| Museum WorldStore | PASS | remains unique |
| Museum WorldGraph | PASS | remains unique room/portal graph |
| Museum SpaceLifecycle | PASS | remains unique room lifecycle |
| Museum SceneKit | PASS | remains host/presentation authority |
| Museum navigation/collision | PASS | `navigationVolume` + Museum-owned resolver remain truth |
| `PropertyRoomCharacterFreeMobility` collision oracle | PASS / REJECTED AS FINAL ARCH | do not create second ExploreController |
| CameraAuthority | PASS | exactly one authority |
| Third-person mode | PASS / DESIGNED | distinct Explore controller/mode under current CameraAuthority |
| Renderer ownership | PASS | RenderHost remains sole renderer/camera object owner |
| Three.js ABI | PASS | Museum is pinned to `three 0.185.1`, matching donor r185 expectation |
| GLTF loading | PASS / BOUNDED DEP | exact r185 loader vendored, same local Three instance |
| Asset lifecycle | PASS / DESIGNED | Museum-side Character graft |
| Character runtime lifecycle | PASS / DESIGNED | visitor-level Character identity; deterministic dispose |
| Room transitions | PASS / DESIGNED | Museum portals / WorldGraph / SpaceLifecycle only |
| Input ownership | PASS / DESIGNED | Museum InputSystem; no donor global key listeners |
| Guided tour | PASS / PROTECTED | remains separate existing mode |
| Artwork Focus | PASS / DESIGNED | intentional viewing marker/action → Focus first-person → third-person restore |
| Wet Paint | PASS / POLICY | attempt visible body later if safe; park/suspend fallback |
| Breeze | PASS / POLICY | never steal guest input/runtime; visible body only if safe; park/suspend fallback |
| Rollback | PASS | bounded commits; frozen baseline preserved |

**PHASE 2 = PASS / CLOSED**

---

# PHASE 3 — CHARACTER PRESENCE / IDLE

- [x] exact r185 GLTF loader dependency
- [x] Character asset loads
- [x] Character visible in Gallery A
- [x] Rig valid
- [x] Scale correct
- [x] Grounding correct
- [x] `IDLE_V2` stable
- [x] animation updates through existing Museum frame loop
- [x] deterministic dispose/rollback
- [x] no duplicate renderer / WorldStore / CameraAuthority

**PHASE 3 = PASS / CLOSED — human visual validation 2026-08-26**

---

# PHASE 4A — THIRD-PERSON FREE MOBILITY / COLLISION

- [x] Character Explore input routing through Museum InputSystem
- [x] WALK
- [x] BACKWARD
- [x] TURN LEFT / RIGHT
- [x] STOP
- [x] JUMP
- [x] room bounds
- [x] wall collision
- [x] relevant furniture collision
- [x] grounding during movement
- [x] Museum-owned navigation resolver reused cleanly
- [x] no second ExploreController collision oracle
- [x] distinct `THIRD_PERSON_EXPLORE` under the same CameraAuthority
- [x] canonical body forward / correct back-of-avatar framing
- [x] adaptive rear camera with blocker/occlusion handling
- [x] near/far framing recovery and adaptive FOV fallback
- [x] Focus return repaired: `THIRD_PERSON_EXPLORE → FOCUS → THIRD_PERSON_EXPLORE`
- [x] third-person reacquisition resets stale Focus pose / safe-camera history
- [x] Character position feeds Museum ProximitySystem
- [x] Gallery A final barrier passage opened without creating a second collision truth
- [x] CameraAuthority violations remain 0 in human validation
- [x] final human validation approved by Juanma on 2026-08-26

**PHASE 4A = PASS / CLOSED — HUMAN APPROVED 2026-08-26**

---

# PHASE 4B — ROOM-TO-ROOM CHARACTER CONTINUITY

- [ ] Gallery A → Gallery B through canonical Museum portal
- [ ] same avatar identity/profile preserved
- [ ] safe arrival anchor/spawn
- [ ] body state preserved/restored appropriately
- [ ] Gallery B navigationVolume becomes Character collision truth after crossing
- [ ] third-person camera reacquires same Character in Gallery B
- [ ] CameraAuthority remains unique
- [ ] input ownership remains coherent
- [ ] no Character-owned room graph
- [ ] real browser/human continuity proof

**PHASE 4B = NEXT / READY TO START**

---

# PHASE 4C — INTENTIONAL ARTWORK FOCUS

Product decision: option B / intentional.

- [ ] authored approach/viewing position or visible floor marker/circle
- [ ] Character reaches valid contemplation position
- [ ] explicit VER / CONTEMPLAR action
- [x] third-person Explore → Museum Focus → third-person authority return foundation proven in 4A
- [ ] first-person artwork view finalized as product interaction
- [ ] no automatic camera theft on simple proximity

**PHASE 4C = PENDING**

---

# PHASE 4D — SPECIALIZED ROOMS

## Wet Paint
- [ ] inspect exact guest/lifecycle seam
- [ ] attempt same visible Character if low-risk
- [ ] park/suspend fallback preserves identity
- [ ] no Wet Paint regression

## Breeze
- [ ] inspect exact guest/input/runtime seam
- [ ] do not steal controls
- [ ] do not destabilize specialized runtime/WebGPU path
- [ ] visible Character only if safe and bounded
- [ ] park/suspend fallback preserves identity
- [ ] no Breeze regression

**PHASE 4D = PENDING**

---

# PHASE 5 — AVATAR PROFILE + MUSEUM STUDIO

Canonical target contract:

```js
avatarProfile = {
  asset,
  scale,
  grounding,
  rigStatus,
  motionSet,
  lookAt,
  ik,
  semanticActions,
  validationStatus
}
```

Studio target:

`AVATAR → SUBIR/SELECCIONAR → PREVIEW → RIG → ESCALA → GROUNDING → MOTION → IK/LOOKAT → ACCIONES → LAB → VALIDAR`

**PHASE 5 = PENDING**

---

# PHASE 6 — ADVANCED CAPABILITIES

- [ ] Capability Batches
- [ ] Semantic Authoring
- [ ] Semantic Authoring Bridge
- [ ] Tour Bridge
- [ ] Cinematic Camera
- [ ] ExteriorCharacterPilot
- [ ] exterior-pilot-skeleton
- [ ] full-world-c2-skeleton

**PHASE 6 = PENDING**

---

# CURRENT NEXT ACTION

**PHASE 0 = PASS / CLOSED**  
**PHASE 1 = PASS / CLOSED**  
**PHASE 2 = PASS / CLOSED**  
**PHASE 3 = PASS / CLOSED**  
**PHASE 4A = PASS / CLOSED — HUMAN APPROVED 2026-08-26**

**NEXT:** PHASE 4B — preserve the same Character identity while traversing the canonical Gallery A → Gallery B portal, then switch navigation/collision/camera context to Gallery B without creating parallel authorities.

---

# RECOVERY RULE

If we get lost:

1. find the last `PASS / CLOSED` phase;
2. compare the branch with this tracker, Phase 2 execution record and donor manifest;
3. resume at the first `PENDING` gate;
4. never redesign from memory;
5. never edit frozen donor stones in place;
6. never activate a later stone to solve an earlier gate;
7. require human visual validation at every major visible gate.
