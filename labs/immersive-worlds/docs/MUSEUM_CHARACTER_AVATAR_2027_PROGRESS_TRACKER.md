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
| Character runtime activation | **NOT STARTED** | Phase 2 did not add active runtime imports |
| Character visible in Museum | **NO** | Phase 3 has not started |
| Character presence / IDLE | PENDING | Phase 3 |
| Third-person free mobility / collision | PENDING | Phase 4A |
| Room-to-room continuity | PENDING | Phase 4B |
| Artwork Focus 3rd→1st→3rd | PENDING | Phase 4C |
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
| Third-person mode | PASS / DESIGNED | future distinct Explore controller/mode under current CameraAuthority |
| Renderer ownership | PASS | RenderHost remains sole renderer/camera object owner |
| Three.js ABI | PASS | Museum is pinned to `three 0.185.1`, matching donor r185 expectation |
| GLTF loading | PASS / BOUNDED DEP | Phase 3 must vendor GLTFLoader from exact Three 0.185.1, using same local Three instance |
| Asset lifecycle | PASS / DESIGNED | MuseumCharacterBridge + CharacterAssetLoader |
| Character runtime lifecycle | PASS / DESIGNED | visitor-level Character identity; deterministic dispose |
| Room transitions | PASS / DESIGNED | Museum portals / WorldGraph / SpaceLifecycle only |
| Input ownership | PASS / DESIGNED | integrate into Museum InputSystem; reject donor global key listeners as final architecture |
| Guided tour | PASS / PROTECTED | remains separate existing mode |
| Artwork Focus | PASS / DESIGNED | intentional viewing marker/action → Focus first-person → third-person restore |
| Wet Paint | PASS / POLICY | attempt visible body later if safe; park/suspend fallback |
| Breeze | PASS / POLICY | never steal guest input/runtime; visible body only if safe; park/suspend fallback |
| Rollback | PASS | bounded commits; frozen baseline preserved |

Gate:
- [x] dependency closure mapped into current Museum
- [x] no unidentified authority duplication
- [x] exact Museum-side minimal seam designed
- [x] Three ABI resolved
- [x] missing GLTFLoader dependency identified/bounded
- [x] room lifecycle strategy designed
- [x] input strategy designed
- [x] third-person camera strategy designed
- [x] artwork Focus strategy designed
- [x] specialized-room policy designed
- [x] rollback path documented
- [x] no donor frozen file edited
- [x] no runtime Character activation performed in Phase 2

**PHASE 2 = PASS / CLOSED**

---

# PHASE 3 — CHARACTER PRESENCE / IDLE

Target: Gallery A only, presence before locomotion.

- [ ] vendor exact `GLTFLoader.js` from Three 0.185.1 and register provenance
- [ ] MuseumCharacterBridge exists on Museum side
- [ ] CharacterAssetLoader uses Museum's one vendored Three instance
- [ ] Character asset loads
- [ ] Character visible in Gallery A
- [ ] Rig valid
- [ ] Scale correct
- [ ] Grounding correct
- [ ] `IDLE_V2` stable
- [ ] animation updates through existing Museum frame loop
- [ ] deterministic dispose/rollback
- [ ] no duplicate renderer
- [ ] no duplicate WorldStore
- [ ] no duplicate CameraAuthority
- [ ] no movement/input activation yet
- [ ] Gallery A/B/Wet Paint/Breeze regression PASS

**PHASE 3 = PENDING / NEXT AFTER JUANMA APPROVAL**

---

# PHASE 4A — THIRD-PERSON FREE MOBILITY / COLLISION

- [ ] Character Explore input routing through Museum InputSystem
- [ ] WALK
- [ ] BACKWARD
- [ ] TURN LEFT / RIGHT
- [ ] STOP
- [ ] JUMP
- [ ] room bounds
- [ ] wall collision
- [ ] relevant furniture collision
- [ ] grounding during movement
- [ ] Museum-owned navigation resolver reused/extracted cleanly
- [ ] no second ExploreController collision oracle
- [ ] distinct third-person Explore behavior under the same CameraAuthority
- [ ] four-room regression PASS

**PHASE 4A = PENDING**

---

# PHASE 4B — ROOM-TO-ROOM CHARACTER CONTINUITY

- [ ] Gallery A → Gallery B through canonical Museum portal
- [ ] same avatar identity/profile preserved
- [ ] safe arrival anchor/spawn
- [ ] body state preserved/restored appropriately
- [ ] CameraAuthority remains unique
- [ ] input ownership remains coherent
- [ ] no Character-owned room graph
- [ ] real browser/human continuity proof

**PHASE 4B = PENDING**

---

# PHASE 4C — INTENTIONAL ARTWORK FOCUS

Product decision: option B / intentional.

- [ ] authored approach/viewing position or visible floor marker/circle
- [ ] Character reaches valid contemplation position
- [ ] explicit VER / CONTEMPLAR action
- [ ] third-person Explore → Museum Focus
- [ ] first-person artwork view
- [ ] exit Focus
- [ ] restore third-person Character Explore
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

- [ ] Avatar Profile
- [ ] upload/select
- [ ] preview
- [ ] rig compatibility
- [ ] scale
- [ ] grounding
- [ ] motion set
- [ ] IK / LookAt
- [ ] semantic actions
- [ ] Lab
- [ ] validate/publish
- [ ] save/apply profile
- [ ] re-entry persistence
- [ ] recover/reuse existing avatar upload/customize/export capability where compatible rather than rebuilding it

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

Each semantic action must be classified independently as `PASS`, `PENDING` or `CONTEXT_REQUIRED`.

**PHASE 6 = PENDING**

---

# GLOBAL ACTIVATION ORDER — CURRENT

1. Phase 3 dependency closure: Museum Three 0.185.1 + matching GLTFLoader
2. MuseumCharacterBridge
3. Character Runtime closure
4. Asset + Rig + Scale + Grounding + IDLE
5. Phase 4A Character navigation adapter + Museum input routing
6. WALK / BACK / TURN / STOP / JUMP
7. Third-person Explore controller under existing CameraAuthority
8. collision / `navigationVolume`
9. Phase 4B room lifecycle + portal continuity
10. Phase 4C intentional artwork Focus handoff
11. Phase 4D Wet Paint / Breeze bounded integration
12. Avatar Profile
13. Avatar Studio
14. Capability Batches
15. Semantic Authoring
16. Tour Bridge
17. Cinematic Camera
18. Exterior Pilot
19. Full World C2

---

# CURRENT NEXT ACTION

**PHASE 2 IS CLOSED.**

**NEXT ONLY AFTER JUANMA APPROVAL:** Phase 3 — first bounded runtime surgery: Character presence / rig / scale / grounding / `IDLE_V2` in Gallery A.

Do not activate locomotion, third-person camera, portals or specialized-room Character behavior in the same first presence gate.

---

# RECOVERY RULE

If we get lost:

1. find the last `PASS / CLOSED` phase;
2. compare the branch with this tracker, Phase 2 execution record and donor manifest;
3. resume at the first `PENDING` gate;
4. never redesign from memory;
5. never edit frozen donor stones in place;
6. never activate a later stone to solve an earlier gate;
7. re-run the four-room regression after every future runtime surgery gate.
