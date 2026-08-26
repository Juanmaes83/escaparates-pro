# MUSEUM — CHARACTER / AVATAR 2027 DONOR PROVENANCE MANIFEST

**Status:** FROZEN / NO RUNTIME ACTIVATION  
**Target branch:** `chatgpt/museum-character-2027-integration-v1`

This manifest proves the donor stones were copied into Museum without surgery. A matching Git blob SHA means the destination bytes are identical to the donor bytes.

## Donor A — VECINIA-WORLDS

- Repository: `Juanmaes83/VECINIA-WORLDS`
- Branch: `feat/sculpture-navigation-character-v1`
- Frozen commit: `45e454febe2deb3b88bf5e5b527c4a5f86fe8eb1`
- Destination root: `labs/immersive-worlds/donors-frozen/character-2027/vecinia-worlds/visual/src/character2027/runtime/`

| File | Git blob SHA | Status |
|---|---|---|
| `ExteriorCharacterPilot.js` | `8b5c10ec527a6b1f798fe5a1dc836ff429d43fdf` | EXACT |
| `MuseumCharacterRuntimeAdapter.js` | `9d538ff40a9325f706ba18720bc603a409a2a674` | EXACT |
| `PropertyRoomCharacterCapabilityBatches.js` | `5699ce87ef0286b9fb6581193da5b214428614d3` | EXACT |
| `PropertyRoomCharacterCinematicCamera.js` | `217e29413c6c3dd8c30978ba30b5e4364e0fe02b` | EXACT |
| `PropertyRoomCharacterFreeMobility.js` | `dc8126ad02b6c3170dabe871b1fec1ffe9f723d6` | EXACT |
| `PropertyRoomCharacterTourBridge.js` | `27e851d28fba4e5f00d099946bf47665e0e18919` | EXACT |
| `PropertyRoomSemanticAuthoring.js` | `aa7fc37ed294f3b40db335d285000af5d0ecdc6c` | EXACT |
| `PropertyRoomSemanticAuthoringBridge.js` | `450eac71ab6af7a81b90c411fa3e21589a11631e` | EXACT |
| `exterior-pilot-skeleton.js` | `b168632976f9b7e9b61c7de4c537bae084b26218` | EXACT |
| `full-world-c2-skeleton.js` | `49d69f7993e60c629ca946263e539741c0656e6c` | EXACT |

## Donor B — CharacterStudio

- Repository: `Juanmaes83/CharacterStudio`
- Primary branch: `agent/character-2027-terrain-semantic-01`
- Frozen commit: `f5a93a48ed0e3904fce58f08f7fbe08b5411b289`
- Destination root: `labs/immersive-worlds/donors-frozen/character-2027/characterstudio/`

### Runtime stones

| File | Git blob SHA | Status |
|---|---|---|
| `src/character2027/api/CharacterActionAPI.js` | `1107f6015dd16274105d16a71e950729b678f667` | EXACT |
| `src/character2027/animation/MotionController.js` | `35a9182bd8cf378df6389fdc27f9fbd02a9b662b` | EXACT |
| `src/character2027/animation/MotionFoundationV2.js` | `3ffa2617b107c1bdf885befce8bfcd4e0bda067c` | EXACT |
| `src/character2027/animation/MotionFoundationV2Extra.js` | `f59c9e54fc4e4347f8a145e8e2b3e2a7bb57d848` | EXACT |
| `src/character2027/animation/SocialMotionFoundationV3.js` | `2490cc4e36e1464d237000caca457d5b73dd79ec` | EXACT |
| `src/character2027/animation/Retargeter.js` | `a32c471eb67f4d3dd33b694e5317532b0ec753ef` | EXACT |
| `src/character2027/rig/BoneMap.js` | `0c74181afaaa64e34e3b8c03cfb042fb7fb27e12` | EXACT |
| `src/character2027/interaction/LookAtController.js` | `c5cb4f75694f31a04dadf7236cafece91e77acba` | EXACT |
| `src/character2027/ik/ContactIKController.js` | `c4b0c14288f30d7d8178bc1dadc11a7f3c7d76ce` | EXACT |
| `src/character2027/ik/DonorTwoBoneIK.js` | `ea0e507a072d949bab8018b4ad27e7cc31392d26` | EXACT |
| `src/character2027/ik/HumanoidIKController.js` | `c4e103dc3f2dddf341f2654d15e3e8909d676856` | EXACT |
| `src/character2027/ik/LadderIKExtension.js` | `242fb865fcd61fe573c85c1de8467778ea1a9c97` | EXACT |
| `src/character2027/ik/TerrainSemanticIK.js` | `870d24744baae178acf0751d28d7e9b7d70d3560` | EXACT |

### Avatar Studio knowledge donors

| File | Git blob SHA | Status |
|---|---|---|
| `src/pages/Create.jsx` | `e70cf09eddd8c9c3df5c7d5c27fada75ed1b5979` | EXACT |
| `src/pages/Appearance.jsx` | `d1ec659da9f5702ca4a83483f3850675c30df949` | EXACT |
| `src/pages/MotionLab.jsx` | `8e1fff64f882cfd2eff6837e19e93b4dbad70515` | EXACT |

## Freeze rules

1. Files under `donors-frozen/character-2027/` are quarry stones and must not be edited in place.
2. Museum runtime must not import directly from a modified donor copy.
3. Surgery happens through a separate integration/adapters layer.
4. `WorldStore`, `SceneKit`, `ExploreController`, `navigationVolume` and `CameraAuthority` remain Museum authorities unless a later gate explicitly proves otherwise.
5. No Avatar/Character runtime is considered active merely because these files exist in the repository.

## Phase 1 gate

- VECINIA runtime family: **10/10 EXACT**
- CharacterStudio runtime stone set: **13/13 EXACT**
- Avatar Studio knowledge donors: **3/3 EXACT**
- Runtime wiring performed: **NO**
- Museum four-room runtime modified by this freeze: **NO**

**PHASE 1 — BRING THE STONES WHOLE: PASS / CLOSED**

Next allowed phase: **Phase 2 — anatomy / compatibility map before runtime surgery.**
