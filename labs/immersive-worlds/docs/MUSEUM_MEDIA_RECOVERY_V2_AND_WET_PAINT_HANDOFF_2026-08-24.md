# MUSEUM — MEDIA RECOVERY V2 + WET PAINT HANDOFF

Date: 2026-08-24  
Repository: `Juanmaes83/escaparates-pro`  
Module: `labs/immersive-worlds/`  
Working branch: `chatgpt/museum-media-recovery-v2`  
Human authority: Juanma = Product Owner / Visual Authority / Final Human PASS

## 1. HUMAN-PASS MILESTONE — GALLERY A + GALLERY B

Juanma has completed browser validation on the V2 recovery branch and confirms that the first two Museum galleries are now connected and working as one authoring/runtime flow.

### Gallery A — HUMAN PASS

Validated behavior:

- upload image;
- upload video;
- image visible on the real 3D artwork surface;
- video visible and playing on the real 3D artwork surface;
- PREVISUALIZAR;
- GUARDAR PIEZA;
- VALIDAR PIEZA;
- move away to other rooms and return;
- previously authored media remains visible after SpaceLifecycle rebuild;
- selecting an artwork returns to the correct room/artwork instead of losing the authored result.

### Gallery B — HUMAN PASS

Validated behavior:

- `Noche de invierno` image/video authoring;
- `Marea baja` image/video authoring;
- full PREVISUALIZAR → GUARDAR PIEZA → VALIDAR PIEZA flow;
- authored media survives room exit/re-entry;
- `Cuaderno de luz` is handled as the canonical `PROJECTION` entity;
- authored projection media is visible without the synthetic additive/glow layers obscuring it;
- projection fallback remains available when no authored media is supplied.

### V2 architecture that must be preserved

The accepted recovery path is deliberately simple:

```text
MediaVault READY asset
        ↓
shared Museum MediaLoader
        ↓
live surface update
        ↓
canonical WorldStore entity content.media update
        ↓
SpaceLifecycle may dispose the room
        ↓
MuseumSceneKit rebuilds from canonical WorldStore
        ↓
authored media returns naturally
```

Do NOT reintroduce the failed experimental architecture based on:

- Runtime.start monkey-patches;
- external lifecycle restorers depending on stale `window.__IW.runtime`;
- forced navigation round-trips to validate persistence;
- duplicate media decode/object-URL pipelines;
- room-specific parallel media stores.

Permanent rule from this milestone:

> The live mesh is not the source of truth. The canonical WorldStore binding is the source of truth for session durability.

## 2. CURRENT VALIDATION UI CONTRACT

The accepted Studio sequence remains:

```text
1. PREVISUALIZAR
2. GUARDAR PIEZA
3. VALIDAR PIEZA
4. PROBAR RECORRIDO
5. APROBAR RECORRIDO
```

A green state must mean functional evidence, not only that a file has decoded or a field has been filled.

Keep the distinction between:

- `% PERSONALIZADO`;
- `% VALIDADO`;
- `RECORRIDO APROBADO`.

Any later modification to a piece must invalidate its validation and any route approval that depended on it.

## 3. NEXT CANONICAL DONOR — WET PAINT ITINERANT ROOM

Do NOT search for another Wet Paint implementation.

The Human-validated standalone/isolated Museum receiver is already present on the current branch:

```text
labs/immersive-worlds/wet-paint-studio.html
```

Canonical local/browser reference previously validated by Juanma:

```text
http://localhost:8765/wet-paint-studio.html?authoring=1&world=.%2Fworlds%2Fitinerant-wet-paint-lab.world.json
```

Canonical isolated World:

```text
labs/immersive-worlds/worlds/itinerant-wet-paint-lab.world.json
```

This receiver is HUMAN-PASS evidence for:

- image upload;
- video upload/playback;
- GLB/media-library capability already present in the Studio stack;
- central media preview/inspection;
- immediate visible 3D media replacement;
- Wet Paint painterly engine;
- native Wet Paint Studio controls;
- painterly presets/effects previously visually validated by Juanma.

The receiver explicitly installs:

```text
wet-paint-media-inspector.js
wet-paint-visible-media.js
experience-app.js
visitor-phase1.js
museum-phase2.js
museum-phase2-layout-fix.js
museum-phase2-hardening.js
experiences/wet-paint-adapter.js
authoring/studio/wet-paint-studio-controls.js
```

The isolated World contains:

```text
01 — Original
02 — Painterly
03 — Living
04 — Combined
05 — Experimental
```

Current product priority is NOT to expand all five surfaces. The immediate integration proof is to connect the already validated Wet Paint room into the recovered Museum without rebuilding its engine.

## 4. WET PAINT CONNECTION OBJECTIVE

Target:

```text
GALLERY A — HUMAN PASS
        ↓
GALLERY B — HUMAN PASS
        ↓
PORTAL / ROOM ENTRY
        ↓
ITINERANT WET PAINT ROOM
        ↓
01 ORIGINAL receives authored media
        ↓
02 PAINTERLY consumes ORIGINAL
        ↓
existing Wet Paint controls/effects work
        ↓
leave room
        ↓
return
        ↓
media + Wet Paint state remain coherent
```

Integration rules:

1. Reuse the validated `wet-paint-studio.html` capability seams; do not rebuild Wet Paint.
2. Reuse the V2 canonical media path where appropriate.
3. Museum remains authority for WorldGraph, room lifecycle, camera, navigation and route.
4. Wet Paint remains authority for painterly transformation/effect behavior.
5. No iframe, no duplicate app shell, no second WorldGraph, no second camera authority.
6. First gate is `01 ORIGINAL → 02 PAINTERLY`; Living/Combined/Experimental remain secondary unless needed for regression preservation.
7. The isolated `wet-paint-studio.html` must remain available as the donor/reference lab and must not be broken by integration work.

## 5. ORDER AFTER WET PAINT

The approved order is now:

```text
A + B MEDIA RECOVERY
✅ HUMAN PASS
        ↓
WET PAINT ITINERANT ROOM
← NEXT
        ↓
BREEZE ROOM
        ↓
CHARACTER 2027 / AVATAR
```

### Breeze

Use the existing Breeze room/runtime and the documented bounded integration contract. Do not rebuild Breeze.

### Avatar

Recover from the already identified donor lineage:

```text
Juanmaes83/CharacterStudio
+ Character 2027 frozen/action API lineage
+ Juanmaes83/VECINIA-WORLDS integration seams
```

Do not attempt Avatar before Wet Paint and Breeze are connected and stable.

## 6. OPERATING RULE FOR NEXT WORK

We spent too long recovering media because multiple historical implementations and experimental persistence layers were mixed together.

From this point:

```text
FIND HUMAN-PASS STONE
        ↓
FREEZE IT
        ↓
EXTRACT SMALLEST PROVEN SEAM
        ↓
CONNECT TO CURRENT CANONICAL RUNTIME
        ↓
VERCEL HUMAN GATE
        ↓
ONLY THEN CONTINUE
```

No broad archaeology when a Human-PASS donor is already known.

No rebuilding a capability already demonstrated working.

No next-room work until the current room passes the agreed human gate.
