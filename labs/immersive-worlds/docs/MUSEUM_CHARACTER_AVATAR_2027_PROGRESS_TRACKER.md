# MUSEUM — CHARACTER / AVATAR 2027 PROGRESS TRACKER

**Status:** ACTIVE  
**Branch:** `chatgpt/museum-character-2027-integration-v1`  
**Protected Museum baseline:** `4fbca5997beaf058543ee65d682f0adae89252e2`  
**Companion roadmap:** `MUSEUM_CHARACTER_AVATAR_2027_SURGERY_ROADMAP.md`  
**Frozen donor manifest:** `labs/immersive-worlds/donors-frozen/character-2027/MANIFEST`

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
| Character runtime activation | **NOT STARTED** | donor freeze only; no Museum runtime imports |
| Character visible in Museum | **NO** | Phase 3 has not started |
| Anatomy/compatibility | PENDING | Phase 2 |
| Character presence / IDLE | PENDING | Phase 3 |
| Free mobility / collision | PENDING | Phase 4 |
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
| `MuseumCharacterRuntimeAdapter.js` | PASS | NOT ACTIVE / first surgery candidate |
| `PropertyRoomCharacterCapabilityBatches.js` | PASS | NOT ACTIVE / advanced |
| `PropertyRoomCharacterCinematicCamera.js` | PASS | NOT ACTIVE / advanced |
| `PropertyRoomCharacterFreeMobility.js` | PASS | NOT ACTIVE / second surgery candidate |
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

| Authority / seam | Status | Required decision |
|---|---|---|
| Character body/action ownership | PENDING | map frozen Character runtime |
| Museum WorldStore | PENDING | must remain unique |
| Museum SceneKit | PENDING | must remain host authority |
| Museum ExploreController | PENDING | must remain navigation/collision authority |
| `navigationVolume` | PENDING | reuse existing Museum truth |
| CameraAuthority | PENDING | exactly one authority |
| Renderer ownership | PENDING | no accidental second renderer |
| Asset lifecycle | PENDING | load / enter / leave / dispose |
| Room lifecycle | PENDING | safe room transitions |
| Input ownership | PENDING | no conflict with Museum/Wet Paint/Breeze |

Gate:
- [ ] dependency closure mapped into current Museum
- [ ] no authority duplication
- [ ] minimal seam designed
- [ ] rollback path documented

**PHASE 2 = PENDING**

---

# PHASE 3 — CHARACTER PRESENCE / IDLE

- [ ] Character asset loads
- [ ] Character visible in target Museum room
- [ ] Rig valid
- [ ] Scale correct
- [ ] Grounding correct
- [ ] IDLE stable
- [ ] no duplicate renderer
- [ ] no duplicate WorldStore
- [ ] no duplicate CameraAuthority
- [ ] Gallery A/B/Wet Paint/Breeze regression PASS

**PHASE 3 = PENDING**

---

# PHASE 4 — FREE MOBILITY / COLLISION

- [ ] WALK
- [ ] BACKWARD
- [ ] TURN LEFT / RIGHT
- [ ] STOP
- [ ] JUMP
- [ ] room bounds
- [ ] wall collision
- [ ] relevant furniture collision
- [ ] grounding during movement
- [ ] Museum ExploreController remains collision/navigation authority
- [ ] Museum CameraAuthority remains unique
- [ ] four-room regression PASS

**PHASE 4 = PENDING**

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

# GLOBAL ACTIVATION ORDER

1. `MuseumCharacterRuntimeAdapter`
2. Character Runtime
3. Asset + Rig + Grounding + IDLE
4. `PropertyRoomCharacterFreeMobility`
5. WALK / BACK / TURN / STOP / JUMP
6. Collision / `navigationVolume`
7. Avatar Profile
8. Avatar Studio
9. Capability Batches
10. Semantic Authoring
11. Tour Bridge
12. Cinematic Camera
13. Exterior Pilot
14. Full World C2

---

# CURRENT NEXT ACTION

**NEXT ONLY AFTER JUANMA APPROVAL:** Phase 2 — anatomy / compatibility audit of the frozen stones against the current Museum authorities.

Do **not** add a runtime import and do **not** make the avatar visible before Phase 2 is understood and the minimal surgical seam is approved.

---

# RECOVERY RULE

If we get lost:

1. find the last `PASS / CLOSED` phase;
2. compare the branch with this tracker and the donor manifest;
3. resume at the first `PENDING` gate;
4. never redesign from memory;
5. never edit frozen donor stones in place;
6. never activate a later stone to solve an earlier gate;
7. re-run the four-room regression after every future runtime surgery gate.
