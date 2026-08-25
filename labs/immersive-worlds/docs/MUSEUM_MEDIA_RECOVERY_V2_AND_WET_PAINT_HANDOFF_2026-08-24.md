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

## 3. WET PAINT ITINERANT ROOM — HUMAN PASS

The Human-validated standalone/isolated Museum receiver remains the canonical donor/reference:

```text
labs/immersive-worlds/wet-paint-studio.html
```

Canonical isolated World:

```text
labs/immersive-worlds/worlds/itinerant-wet-paint-lab.world.json
```

On 2026-08-24 Juanma validated the same Wet Paint capability connected inside the real Museum V2 runtime at commit:

```text
723b9df432b0af6e8cd6d0bc48ea66f03ec0211b
```

Validated behavior inside the integrated Museum:

- Gallery A remains functional;
- Gallery B remains functional;
- navigation reaches `space.itinerant-wet-paint` through the Museum WorldGraph/portal flow;
- Wet Paint native Studio controls appear on itinerant artworks;
- image source can be selected/uploaded;
- painterly transformation/effects are visible in the real central 3D room;
- effects and controls function as previously demonstrated in the standalone HUMAN-PASS donor;
- the Wet Paint engine is hosted by the Museum lifecycle rather than a second visible application shell;
- `SPACE_READY` / `SPACE_ENTERED` are used to restore Wet Paint only when the itinerant room actually exists.

Current integrated milestone:

```text
GALLERY A        ✅ HUMAN PASS
GALLERY B        ✅ HUMAN PASS
WET PAINT ROOM   ✅ HUMAN PASS
```

### Known non-blocking bug — THUMBNAIL SYNC

Observed in the final Wet Paint HUMAN-PASS browser validation:

- the central 3D artwork correctly shows the newly uploaded/authored image;
- the small artwork thumbnails / filmstrip below the central viewport can continue showing the previous/default image instead of the current authored media.

Classification:

```text
BUG: WET-PAINT-THUMBNAIL-SYNC-01
SEVERITY: LOW / NON-BLOCKING
RUNTIME: PASS
AUTHORING CENTRAL PREVIEW: PASS
FILMSTRIP THUMBNAIL REPRESENTATION: STALE
```

Do not reopen the Wet Paint integration to fix this while Breeze/Avatar remain unconnected. Fix later by making the filmstrip thumbnail renderer consume the same current authored/canonical media binding used by the central artwork instead of a stale/base media reference.

## 4. INTEGRATION RULES THAT ARE NOW FROZEN

1. Museum remains authority for WorldGraph, room lifecycle, camera, navigation and route.
2. Wet Paint remains authority for painterly transformation/effect behavior.
3. No second WorldGraph, second camera authority or visible donor application shell.
4. Preserve the standalone `wet-paint-studio.html` as the HUMAN-PASS reference lab.
5. Preserve the V2 canonical media path for Gallery A/B.
6. Do not replace this working three-room integration with historical persistence experiments.

## 5. ORDER AFTER THREE-ROOM HUMAN PASS

The approved order is now:

```text
GALLERY A
✅ HUMAN PASS
        ↓
GALLERY B
✅ HUMAN PASS
        ↓
WET PAINT ITINERANT ROOM
✅ HUMAN PASS
        ↓
BREEZE ROOM
← NEXT
        ↓
CHARACTER 2027 / AVATAR
```

### Breeze

Use the existing Breeze room/runtime and the documented bounded integration contract. Do not rebuild Breeze.

Product authority remains:

```text
BREEZE STUDIO PRO V4 = PRODUCT AUTHORITY
Juanmaes83/breeze = ENGINE DONOR
Museum = EXPERIENCE / CAMERA / GUIDE / ROUTE / LIFECYCLE AUTHORITY
```

First mission: identify the exact Human-reviewed Breeze stone and graft only the required nested-room/runtime seams into the now stable Museum line.

### Avatar

Recover from the already identified donor lineage:

```text
Juanmaes83/CharacterStudio
+ Character 2027 frozen/action API lineage
+ Juanmaes83/VECINIA-WORLDS integration seams
```

Do not rebuild the avatar system from scratch.

## 6. OPERATING RULE FOR NEXT WORK

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

No next-room expansion beyond the currently approved order: Breeze, then Avatar.
