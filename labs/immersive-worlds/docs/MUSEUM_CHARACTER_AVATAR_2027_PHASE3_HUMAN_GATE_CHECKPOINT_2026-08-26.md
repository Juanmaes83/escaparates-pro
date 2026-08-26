# MUSEUM — CHARACTER / AVATAR 2027 — PHASE 3 HUMAN GATE CHECKPOINT

**Date:** 2026-08-26  
**Branch:** `chatgpt/museum-character-2027-integration-v1`  
**Status:** `READY FOR HUMAN VALIDATION` — **NOT PASS YET**  
**Gate:** Gallery A → Museum intact → Character 2027 → rig → 1.66 m → grounding → proven `IDLE_V2`.

---

## PRODUCT RULE FOR THIS GATE

Phase 3 is not closed by compilation, CI or an automated browser result.

Required final validation sequence:

```text
TECHNICAL GATE READY
  ↓
NAVIGABLE PREVIEW URL
  ↓
JUANMA HUMAN VISUAL TEST
  ↓
JUANMA RECORDS VIDEO
  ↓
JUANMA + CHATGPT REVIEW VIDEO TOGETHER
  ↓
PASS / CORRECT / REPEAT
```

Until that sequence is completed, Phase 3 remains **HUMAN PASS PENDING**.

---

# WHAT WAS EXECUTED

## 1. Exact Three r185 loader closure was vendored locally

Phase 2 had identified that Museum already owns the exact Three `0.185.1` / r185 runtime but lacked `GLTFLoader` and the two utility modules imported by that loader.

We transported the official Three tag `r185` files into `escaparates-pro` using Git object APIs and exact Git blob SHA verification.

| Stone | Official source blob SHA | Destination blob SHA | Result |
|---|---|---|---|
| `GLTFLoader.js` | `91629ef9f7a39b11180acb7459701eccc6cd3aa0` | `91629ef9f7a39b11180acb7459701eccc6cd3aa0` | PASS |
| `BufferGeometryUtils.js` | `4e1221c238634f36110688a6b309d1686f1834b4` | `4e1221c238634f36110688a6b309d1686f1834b4` | PASS |
| `SkeletonUtils.js` | `836c2e2bf2be3c5c5fd6b65ed260f84b3d589258` | `836c2e2bf2be3c5c5fd6b65ed260f84b3d589258` | PASS |

Official Three r185 provenance:

- tag: `r185`
- commit: `2431a09f46f34c560bc8e44b33be0e567723d5b9`

Destination paths:

```text
labs/immersive-worlds/vendor/three/addons/loaders/GLTFLoader.js
labs/immersive-worlds/vendor/three/addons/utils/BufferGeometryUtils.js
labs/immersive-worlds/vendor/three/addons/utils/SkeletonUtils.js
```

Transport commit:

`5bd4f5a317350aca03aa0aa888dd80cca5bf93a3`

The official addons use the bare `three` import, which is mapped by Museum's import map to its existing local `vendor/three/three.module.min.js`. No second Three runtime is introduced.

---

## 2. Important failure caught by SHA gate

Before the automated object-level transport, one manual reconstruction attempt of `GLTFLoader.js` created destination blob:

`35507c5d11e7fbfb2c8d6d13ade9f4b1d9c9e02e`

The official source SHA was:

`91629ef9f7a39b11180acb7459701eccc6cd3aa0`

Therefore:

```text
SOURCE SHA != DESTINATION SHA
          ↓
         STOP
```

That failed blob was never added to a tree, commit or branch and has no runtime effect.

**Lesson reinforced:** never accept a manually reconstructed donor/dependency when an exact Git object can be transported. SHA equality is the acceptance gate.

---

## 3. Exact object-API transport mechanism

To avoid manual transcription, a one-purpose GitHub workflow executes the proven procedure entirely through GitHub Object API:

```text
GET source /git/blobs/{sha}
  ↓
POST destination /git/blobs
  ↓
SOURCE SHA == DESTINATION SHA ?
  ↓ YES only
POST destination /git/trees
  ↓
POST destination /git/commits
  ↓
PATCH destination branch ref
```

No Git clone is used as the transport mechanism. No source file is rewritten.

Workflow:

`.github/workflows/museum-character-phase3-vendor-r185.yml`

---

## 4. Provisional hand-built idle was removed

The first Phase 3 prototype had manually interpolated an approximation of the frozen `IDLE_V2` poses.

That approach was rejected after applying the project learning rule:

> If a proven solution already exists, recover and understand it before inventing a replacement.

The provisional `createIdleDriver()` / manual interpolation path has been removed from `museum-character-phase3.js`.

---

## 5. Proven `MotionFoundationV2 / IDLE_V2` is now the source of truth

Frozen source:

`labs/immersive-worlds/donors-frozen/character-2027/characterstudio/src/character2027/animation/MotionFoundationV2.js`

Frozen blob SHA:

`3ffa2617b107c1bdf885befce8bfcd4e0bda067c`

The Museum-side Phase 3 seam is:

`labs/immersive-worlds/character/motion-foundation-v2-idle.js`

It preserves the proven `IDLE_V2` definition and its clip-generation contract:

```text
rest bone quaternion
  ×
authored XYZ Euler offset
  ↓
QuaternionKeyframeTrack
  ↓
AnimationClip Character2027_V2_IDLE_V2
  ↓
THREE.AnimationMixer
```

Only the idle capability is activated in Phase 3. We deliberately do **not** activate locomotion, Character input, Contact IK, LookAt, portals or third-person camera in this gate.

Museum-side seam commit:

`ef6dc2ac363cf67f153dc2c368c54f1942e7f205`

Phase 3 bridge correction commit:

`c8d7f832311f5db33deb919502820f7db3d372e0`

---

# CHARACTER ASSET PROVENANCE STILL ENFORCED

Approved Character asset:

- expected bytes: `30306028`
- expected SHA-256: `103f0fdbc556566b12412d09f758e13fa171fcec90cb285b8f824adac2c7b0e3`

The browser must fetch the approved GLB and pass both byte-length and SHA-256 before it may be attached to Museum.

---

# PHASE 3 ARCHITECTURAL BOUNDARY

This gate still does **not**:

- create another renderer;
- create another SceneKit;
- create another WorldStore;
- modify CameraAuthority;
- install Character input;
- enable locomotion;
- enable portal traversal;
- integrate Wet Paint/Breeze;
- enable Avatar Studio.

`?character=1` remains the explicit reversible opt-in. The baseline URL without that flag remains the protected Museum path.

---

# DEPLOYMENT EVIDENCE

Vercel deployment for the corrected Phase 3 bridge:

- commit: `c8d7f832311f5db33deb919502820f7db3d372e0`
- deployment: `dpl_4b1v5pkPUgWxoLqCa2fwtuFpgo72`
- state observed: `READY`

HTTP checks confirmed that the deployment serves:

- the Museum `index.html` with the explicit `?character=1` opt-in;
- the corrected `museum-character-phase3.js`;
- the Museum-side `motion-foundation-v2-idle.js`;
- the local r185 addon closure.

This is a structural/deployment check only. It is **not** the human visual PASS.

---

# ISOLATION CHECK

Compare base:

`4815c180e6a590882ccdc8b37a393ab390f521e1`

through technical gate head:

`c8d7f832311f5db33deb919502820f7db3d372e0`

shows only:

- the one-purpose exact-blob transport workflow;
- Museum-side `IDLE_V2` seam;
- Phase 3 bridge correction;
- exact local Three r185 addon files.

**Zero files under `labs/immersive-worlds/donors-frozen/character-2027/` were modified.**

No `master` mutation was performed.

---

# HUMAN VALIDATION CHECKLIST

On the Character preview, verify visually:

1. Gallery A still looks/behaves like the protected Museum.
2. Exactly one Character 2027 is visible.
3. Character is not in T-pose or exploded rig state.
4. Scale feels human relative to room/artworks; technical target is 1.66 m.
5. Feet appear grounded; no obvious floating or sinking.
6. `IDLE_V2` is subtle, stable and continuous; no snapping/jitter.
7. Camera is not stolen by Character.
8. Existing Museum interaction/navigation is not unexpectedly disabled.
9. No obvious duplicate guide/body or rendering artifact appears.
10. Record enough video to show the full body, floor contact and several seconds of idle motion.

Then send the video for joint analysis before Phase 3 can be marked PASS.

---

# CURRENT DECISION

**PHASE 3 = READY FOR HUMAN VALIDATION / HUMAN PASS PENDING.**

Do not start Phase 4A until the visual gate is jointly approved.
