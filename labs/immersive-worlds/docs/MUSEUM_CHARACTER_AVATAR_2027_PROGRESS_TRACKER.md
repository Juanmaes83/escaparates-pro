# MUSEUM — CHARACTER / AVATAR 2027 PROGRESS TRACKER

**Status:** ACTIVE  
**Branch:** `chatgpt/museum-character-2027-integration-v1`  
**Companion roadmap:** `MUSEUM_CHARACTER_AVATAR_2027_SURGERY_ROADMAP.md`

Use this file as the living comparison between **what is already done** and **what is still missing**.

Legend:

- `PASS` = proven and frozen
- `IN PROGRESS` = active work
- `PENDING` = not started
- `BLOCKED` = dependency/error prevents progress
- `CONTEXT_REQUIRED` = capability exists but physical/semantic context is missing

---

## CURRENT EXECUTIVE STATUS

| Area | Status | Evidence / Notes |
|---|---|---|
| Museum four-room freeze | PASS | Gallery A + Gallery B + Wet Paint + Breeze integrated before Character branch |
| Character surgery branch | PASS | `chatgpt/museum-character-2027-integration-v1` created from Museum integration line |
| Roadmap saved | PASS | `MUSEUM_CHARACTER_AVATAR_2027_SURGERY_ROADMAP.md` |
| Progress tracker saved | PASS | this file |
| CharacterStudio donor provenance | PASS | PRIMARY `agent/character-2027-terrain-semantic-01`, frozen reference `f5a93a48ed0e3904fce58f08f7fbe08b5411b289` |
| VECINIA donor provenance | PASS | PRIMARY `feat/sculpture-navigation-character-v1`, frozen reference `45e454febe2deb3b88bf5e5b527c4a5f86fe8eb1` |
| WORLD-COSTA-BLANCA deep audit | PASS | secondary donor; no stronger hidden Character runtime found than VECINIA |
| Donor stones copied into Museum | PASS | complete under `labs/immersive-worlds/donors-frozen/character-2027/**` |
| Donor manifest/checksums | PASS | `labs/immersive-worlds/donors-frozen/character-2027/MANIFEST` |
| Phase 1 scope diff | PASS | base `4fbca5997beaf058543ee65d682f0adae89252e2` → branch; only donor-freeze + docs |
| Character runtime activation | NOT STARTED | no runtime imports; frozen donors only |
| Anatomy/compatibility map | PENDING | Phase 2 |
| Character visible in Museum | PENDING | Phase 3 |
| IDLE / rig / grounding | PENDING | Phase 3 |
| Free mobility | PENDING | Phase 4 |
| Collision with Museum room | PENDING | Phase 4 |
| Avatar Profile | PENDING | Phase 5 |
| Museum Avatar Studio | PENDING | Phase 5 |
| Semantic actions | PENDING | Phase 6 |
| Tour bridge | PENDING | Phase 6 |
| Cinematic camera | PENDING | Phase 6 |
| Exterior / full-world Character | PENDING | Phase 6 |

---

# PHASE 0 — FREEZE & PROVENANCE

| Task | Status | Notes |
|---|---|---|
| Preserve Gallery A | PASS | frozen baseline |
| Preserve Gallery B | PASS | frozen baseline |
| Preserve Wet Paint | PASS | HUMAN PASS |
| Preserve Breeze PRO | PASS | HUMAN PASS + Museum save/re-entry/route |
| Create Character surgery branch | PASS | `chatgpt/museum-character-2027-integration-v1` |
| Record CharacterStudio source | PASS | `f5a93a48...` |
| Record VECINIA source | PASS | `45e454f...` / `feat/sculpture-navigation-character-v1` |
| Re-audit WORLD-COSTA-BLANCA | PASS | no superior hidden Avatar runtime found |
| Create roadmap | PASS | saved in GitHub |
| Create progress tracker | PASS | saved in GitHub |

**Phase 0 status: PASS / CLOSED**

---

# PHASE 1 — BRING THE STONES WHOLE

## CharacterStudio stone set

| Stone / capability | Import status | Activation status |
|---|---|---|
| CharacterActionAPI | PASS | NOT ACTIVE |
| MotionController | PASS | NOT ACTIVE |
| MotionFoundationV2 | PASS | NOT ACTIVE |
| MotionFoundationV2Extra | PASS | NOT ACTIVE |
| SocialMotionFoundationV3 | PASS | NOT ACTIVE |
| BoneMap | PASS | NOT ACTIVE |
| Retargeter | PASS | NOT ACTIVE |
| LookAtController | PASS | NOT ACTIVE |
| ContactIKController | PASS | NOT ACTIVE |
| DonorTwoBoneIK | PASS | NOT ACTIVE |
| HumanoidIKController | PASS | NOT ACTIVE |
| LadderIKExtension | PASS | NOT ACTIVE |
| TerrainSemanticIK | PASS | NOT ACTIVE |
| Create.jsx knowledge donor | PASS | NOT RUNTIME |
| Appearance.jsx knowledge donor | PASS | NOT RUNTIME |
| MotionLab.jsx knowledge donor | PASS | NOT VISITOR RUNTIME |

## VECINIA runtime family — copied WHOLE

| File | Import status | Activation status |
|---|---|---|
| `ExteriorCharacterPilot.js` | PASS | NOT ACTIVE / late |
| `MuseumCharacterRuntimeAdapter.js` | PASS | NOT ACTIVE / first surgery stone |
| `PropertyRoomCharacterCapabilityBatches.js` | PASS | NOT ACTIVE / advanced |
| `PropertyRoomCharacterCinematicCamera.js` | PASS | NOT ACTIVE / advanced |
| `PropertyRoomCharacterFreeMobility.js` | PASS | NOT ACTIVE / second surgery stone |
| `PropertyRoomCharacterTourBridge.js` | PASS | NOT ACTIVE / advanced |
| `PropertyRoomSemanticAuthoring.js` | PASS | NOT ACTIVE / advanced |
| `PropertyRoomSemanticAuthoringBridge.js` | PASS | NOT ACTIVE / advanced |
| `exterior-pilot-skeleton.js` | PASS | NOT ACTIVE / late |
| `full-world-c2-skeleton.js` | PASS | NOT ACTIVE / last |

## Phase 1 provenance / integrity evidence

- CharacterStudio frozen commit: `f5a93a48ed0e3904fce58f08f7fbe08b5411b289`
- VECINIA frozen commit: `45e454febe2deb3b88bf5e5b527c4a5f86fe8eb1`
- Museum Phase 1 comparison base: `4fbca5997beaf058543ee65d682f0adae89252e2`
- All donor files live only under `labs/immersive-worlds/donors-frozen/character-2027/**`
- Manifest: `labs/immersive-worlds/donors-frozen/character-2027/MANIFEST`
- VECINIA transport was verified byte-for-byte by matching Git blob SHAs in source and destination.
- CharacterStudio donor paths and Git blob SHAs are recorded in the manifest.

## Phase 1 final isolation diff

The final base → branch diff was audited with GitHub compare and PR changed-filename enumeration.

Explicit result:

```text
0 runtime imports
0 WorldStore changes
0 SceneKit changes
0 Gallery A changes
0 Gallery B changes
0 Wet Paint changes
0 Breeze changes
```

The only changed path families are:

```text
labs/immersive-worlds/donors-frozen/character-2027/**
labs/immersive-worlds/docs/MUSEUM_CHARACTER_AVATAR_2027_SURGERY_ROADMAP.md
labs/immersive-worlds/docs/MUSEUM_CHARACTER_AVATAR_2027_PROGRESS_TRACKER.md
```

Character is **not activated**. `master` is **not touched**.

## Phase 1 gate

- [x] all approved CharacterStudio stones copied
- [x] complete CharacterStudio IK family copied, not reduced to one file
- [x] all ten VECINIA runtime files copied
- [x] original paths recorded
- [x] source branch/SHA recorded
- [x] checksum/manifest created
- [x] no donor stone edited during transport
- [x] no product runtime file changed
- [x] no four-room file changed
- [x] Character remains inactive

**PHASE 1 — DONOR FREEZE = PASS / CLOSED**

---

# PHASE 2 — ANATOMY / COMPATIBILITY

| Authority / seam | Status | Decision required |
|---|---|---|
| Character body/action ownership | PENDING | map to Character 2027 runtime |
| Museum WorldStore | PENDING | must remain unique |
| Museum SceneKit | PENDING | must remain host authority |
| Museum ExploreController | PENDING | must remain navigation/collision authority |
| navigationVolume | PENDING | reuse existing room truth |
| CameraAuthority | PENDING | exactly one authority |
| renderer ownership | PENDING | no accidental second renderer |
| asset lifecycle | PENDING | load / enter / leave / dispose |
| room lifecycle | PENDING | Character survives expected transitions safely |
| controls/input ownership | PENDING | no competition with Museum/Breeze/Wet Paint |

## Phase 2 gate

- [ ] dependency closure understood
- [ ] no unidentified authority duplication
- [ ] minimal Museum seam designed
- [ ] rollback path documented

**Phase 2 status: PENDING**

---

# PHASE 3 — CHARACTER PRESENCE / IDLE

| Capability | Status |
|---|---|
| Character asset loads | PENDING |
| Character visible in target Museum room | PENDING |
| Rig valid | PENDING |
| Scale correct | PENDING |
| Grounding correct | PENDING |
| IDLE stable | PENDING |
| No duplicate renderer | PENDING |
| No duplicate WorldStore | PENDING |
| No duplicate CameraAuthority | PENDING |
| A/B/Wet Paint/Breeze regression test | PENDING |

**Phase 3 status: PENDING**

---

# PHASE 4 — FREE MOBILITY / COLLISION

| Capability | Status |
|---|---|
| WALK | PENDING |
| BACKWARD | PENDING |
| TURN LEFT | PENDING |
| TURN RIGHT | PENDING |
| STOP | PENDING |
| JUMP | PENDING |
| Room bounds respected | PENDING |
| Wall collision | PENDING |
| Relevant furniture collision | PENDING |
| Grounding during movement | PENDING |
| Museum ExploreController remains authority | PENDING |
| Museum CameraAuthority remains unique | PENDING |
| Four-room regression | PENDING |

**Phase 4 status: PENDING**

---

# PHASE 5 — AVATAR PROFILE + MUSEUM STUDIO

## Canonical profile

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

| Studio capability | Status |
|---|---|
| SUBIR / SELECCIONAR | PENDING |
| PREVIEW | PENDING |
| RIG | PENDING |
| ESCALA | PENDING |
| GROUNDING | PENDING |
| MOTION | PENDING |
| IK / LOOKAT | PENDING |
| ACCIONES | PENDING |
| LAB | PENDING |
| VALIDAR | PENDING |
| Save/apply profile | PENDING |
| Re-entry persistence | PENDING |

**Phase 5 status: PENDING**

---

# PHASE 6 — ADVANCED CAPABILITIES

| Stone / capability | Status |
|---|---|
| Capability Batches | PENDING |
| Semantic Authoring | PENDING |
| Semantic Authoring Bridge | PENDING |
| Tour Bridge | PENDING |
| Cinematic Camera | PENDING |
| ExteriorCharacterPilot | PENDING |
| exterior-pilot-skeleton | PENDING |
| full-world-c2-skeleton | PENDING |

Candidate semantic actions must be tracked individually as `PASS`, `PENDING` or `CONTEXT_REQUIRED` rather than assumed globally ready.

**Phase 6 status: PENDING**

---

# GLOBAL ACTIVATION ORDER

```text
1. MuseumCharacterRuntimeAdapter
2. Character Runtime
3. Asset + Rig + Grounding + IDLE
4. PropertyRoomCharacterFreeMobility
5. WALK / BACK / TURN / STOP / JUMP
6. Collision / navigationVolume
7. Avatar Profile
8. Avatar Studio
9. Capability Batches
10. Semantic Authoring
11. Tour Bridge
12. Cinematic Camera
13. Exterior Pilot
14. Full World C2
```

---

# CURRENT NEXT ACTION

**NEXT:** Phase 2 — anatomy / compatibility map. Audit the frozen stones against the current Museum authorities before adding any runtime import.

Do not begin runtime surgery before Phase 2 is understood and the minimal seam is designed.

---

# RECOVERY RULE

If progress becomes unclear:

1. identify the last `PASS` phase in this file;
2. compare actual branch contents against the tables above;
3. resume at the first `PENDING` gate;
4. do not redesign from memory;
5. do not activate a later stone to solve an earlier gate;
6. re-run the four-room regression baseline after every major surgery gate.
