# MUSEUM — CHARACTER / AVATAR 2027
## OFFICIAL PHASE 4 CLOSURE → PHASE 5 START

**Date:** 2026-08-26  
**Roadmap authority:** `MUSEUM_CHARACTER_AVATAR_2027_SURGERY_ROADMAP.md`  
**Official roadmap phase now:** **PHASE 5 — AVATAR PROFILE + MUSEUM STUDIO**  
**Phase 5 branch:** `chatgpt/museum-character-2027-phase5-avatar-studio-v1`

---

## CORRECTION OF EXECUTION NOMENCLATURE

During implementation, Phase 4 was split operationally into internal human gates labelled `4A`, `4B` and camera/focus continuity checks. These labels were useful for surgery and validation but they are **not additional official roadmap phases**.

The approved roadmap defines:

- PHASE 3 — FIRST SURGERY: PRESENCE ONLY
- PHASE 4 — SECOND SURGERY: FREE MOBILITY
- PHASE 5 — AVATAR PROFILE + MUSEUM STUDIO
- PHASE 6 — ADVANCED CAPABILITIES

Therefore the project must not insert invented `4C` / `4D` phases between official Phase 4 and official Phase 5.

---

# OFFICIAL PHASE 4 — PASS / CLOSED

The human validation completed during the internal Phase 4 checkpoints proves the official Gate 4 and additional continuity behaviour:

- Character visible and stable in Museum
- WALK
- BACKWARD
- TURN LEFT / RIGHT
- STOP
- JUMP
- grounding
- room bounds
- Museum-owned wall/furniture/blocker collision
- one Museum CameraAuthority
- one InputSystem
- one Character root / motion loop
- third-person framing and recovery
- same Character continuity Gallery A ↔ Gallery B
- destination navigationVolume rebinding
- intentional artwork interaction through `E`
- third-person → Museum Focus / first-person artwork view
- Escape / release returns correctly to third-person Character
- no automatic camera theft from simple proximity
- human validation approved by Juanma on 2026-08-26

**OFFICIAL PHASE 4 = PASS / CLOSED — HUMAN APPROVED 2026-08-26**

Internal labels such as 4A/4B remain only as engineering evidence/history. They must not control roadmap sequencing.

---

# OFFICIAL NEXT PHASE

## PHASE 5 — AVATAR PROFILE + MUSEUM STUDIO

Roadmap goal:

> Make the Character configurable as Museum content.

Canonical initial contract:

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

Museum Studio target information architecture:

```text
AVATAR
├── SUBIR / SELECCIONAR
├── PREVIEW
├── RIG
├── ESCALA
├── GROUNDING
├── MOTION
├── IK / LOOKAT
├── ACCIONES
├── LAB
└── VALIDAR
```

Knowledge donors:

- `CharacterStudio/Create.jsx`
- `CharacterStudio/Appearance.jsx`
- `CharacterStudio/MotionLab.jsx`

Hard rule:

- CharacterStudio provides capability knowledge.
- Museum Studio owns the final UX.
- Do not mount CharacterStudio wholesale.
- Do not regress the validated Museum Character runtime while introducing authoring/profile capability.

Gate 5 from the approved roadmap:

- profile can be authored;
- configuration survives room lifecycle according to Museum persistence;
- validation differentiates valid/invalid rig and configuration.

---

# RECOVERY RULE

If future execution appears to introduce an extra phase between 4 and 5, stop and reread `MUSEUM_CHARACTER_AVATAR_2027_SURGERY_ROADMAP.md` before coding.

**NEXT ACTION: PHASE 5 — AVATAR PROFILE CONTRACT + MUSEUM STUDIO.**
