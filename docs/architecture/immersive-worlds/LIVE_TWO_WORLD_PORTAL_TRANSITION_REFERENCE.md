# Immersive Worlds — Museum / Institutional
## LIVE TWO-WORLD PORTAL TRANSITION — SOURCE REFERENCE & GRAFT INTENT

> **Status:** PRODUCT-DIRECTION REFERENCE. NOT YET IMPLEMENTED.
> **Purpose:** preserve the source mechanism, product interpretation and integration intent so a future implementation agent does not have to rediscover it from chat.

## 1. Product intent

This capability is intended primarily as a **spectacular Museum transition between Spaces / Worlds**.

It is not being introduced as a standalone effect demo.

Target Museum use:

```text
WORLD / SPACE A
   ↓
GUIDE + VISITOR ARRIVE AT AUTHORED TRANSITION POINT
   ↓
LIVE VIEW OF DESTINATION WORLD / SPACE B
   ↓
PERSPECTIVE-CORRECT PORTAL
   ↓
TEMPORARY TWO-CAMERA TRANSITION CHOREOGRAPHY
   ↓
CROSSING
   ↓
WORLD / SPACE B BECOMES ACTIVE
   ↓
NORMAL VISITOR CAMERA AUTHORITY RESUMES
```

Preferred first proof after Projection review:

```text
Gallery A
→ LIVE TWO-WORLD TRANSITION
→ Gallery B / Projection Experience
```

The point is not simply to hide a loading boundary. The transition should create anticipation, continuity and spectacle: the visitor can see the next environment before entering it.

## 2. Source material

Reference shared by Juanma:

`Infinite Portals`

Gist:

`https://gist.github.com/Juanmaes83/9c9ae4d788b12be6de8613eaf6a1beff`

Important: the gist page contains external credits and CodePen-hosted assets. Direct code/asset reuse rights must be verified before production copying. Until that verification, treat this as a high-value technical reference whose mechanics may be studied and adapted within applicable rights.

## 3. Source architecture

The source uses three principal responsibilities:

```text
App
World
Portal
```

`App` coordinates the experience.
`World` represents each complete 3D environment.
`Portal` turns a surface in the current world into a perspective-correct live view of the other world.

Core flow:

```text
WORLD A
   │
   │ looks through portal
   ▼
CAMERA FOR WORLD B
   │
   │ renders WORLD B
   ▼
WebGLRenderTarget
   │
   │ becomes texture
   ▼
PORTAL PLANE IN WORLD A
```

The destination is therefore not a prerecorded video. It is another 3D world rendered live.

## 4. Core render mechanism

The source render cycle performs an offscreen destination render followed by the current-world render using the same renderer:

```js
this.renderer.setRenderTarget(this.currentWorld.portal.renderTarget);
this.renderer.render(this.otherWorld.scene, this.otherWorld.camera);
this.renderer.setRenderTarget(currentRenderTarget);
this.renderer.render(this.currentWorld.scene, this.currentWorld.camera);
```

This is important for Immersive Worlds because it demonstrates:

```text
ONE WEBGL RENDERER / CONTEXT
+
MULTIPLE RENDER PASSES
```

rather than two independent WebGL applications.

## 5. Perspective-correct portal view

The source calculates the portal-plane corners in world space and frames the destination camera against those corners:

```js
CameraUtils.frameCorners(
  this.otherWorld.camera,
  bottomLeft,
  bottomRight,
  topLeft,
  false
);
```

Conceptually:

```text
VISITOR CAMERA
   ↓
PORTAL GEOMETRY
   ↓
PORTAL CORNERS IN WORLD SPACE
   ↓
FRAME CORNERS
   ↓
DESTINATION / TRANSITION CAMERA
   ↓
CORRECT DESTINATION FRUSTUM
```

This is a major capability: the destination view changes correctly with the portal geometry and viewer relationship instead of reading as a flat video pasted onto a plane.

## 6. Camera synchronization

The source keeps the second-world camera synchronized to the current camera:

```js
this.otherWorld.camera.position.copy(this.currentWorld.camera.position);
this.otherWorld.camera.quaternion.copy(this.currentWorld.camera.quaternion);
```

For IW this should be interpreted carefully.

Existing invariant remains:

> **Exactly one authoritative visitor-camera controller per frame.**

The second camera is acceptable when it acts only as a **temporary optical/rendering instrument during TRANSITION**, not as a second autonomous navigation authority.

Conceptual IW distinction:

```text
VISITOR CAMERA
= authoritative camera

TRANSITION CAMERA
= temporary destination/offscreen rendering camera
```

## 7. Transition choreography in the source

The source transition is explicitly three-stage:

```text
1. CAMERA APPROACHES PORTAL
2. VIRTUAL / DESTINATION WORLD TRANSFORMS TO FIT TRANSITION
3. CURRENT WORLD AND OTHER WORLD SWAP
4. NEW ACTIVE WORLD / CAMERA SETTLE BACK TO NORMAL
```

The source uses `switchWorlds()` to exchange `currentWorld` and `otherWorld` references.

For IW, the **transition concept is valuable**, but `currentWorld/otherWorld` must not automatically become a second canonical World State model.

Preserve capability, not accidental demo ownership.

## 8. Shader / portal membrane

The source Portal uses a custom shader with:

- radial coordinates;
- animated noise;
- waves;
- radial displacement;
- highlights;
- edge grayscale;
- edge coloration;
- hover intensity.

This visual layer is useful and should not be rejected merely because it is spectacular.

Juanma's current preference for this phase is:

```text
SPECTACULAR
+ COHERENT
+ CONTROLLED
```

The original membrane/shader may therefore be worth testing as part of the graft, provided it strengthens the transition and remains compatible with the Museum world.

Capability and representation must still remain separable.

## 9. Interaction in source

The source uses a `Raycaster` against the portal plane.

Hover increases portal effect intensity.
Click starts `moveCameraToPortal()` when no transition is active.

IW does not need to preserve raw source event ownership. Existing semantic contracts remain:

```text
HOTSPOT = trigger
PORTAL = connection / transition
ACTION = what happens
ANCHOR = where
```

A future IW-native activation could be direct, Guided, Hotspot-triggered or authored by route/Experience Director.

## 10. Authored Transition Points

This source aligns strongly with the already planned concept of authored spatial points for Guide / visitor / camera staging.

Do not create a duplicate point system.
Reuse `Anchor = WHERE` and allow authored intent.

Potential transition intentions:

```text
TRANSITION_ENTRY
PORTAL_VIEWPOINT
GUIDE_ENTRY_POSITION
VISITOR_ENTRY_POSITION
DESTINATION_VIEW / TARGET
DESTINATION_ARRIVAL
GUIDE_DESTINATION
```

A Guided sequence can therefore become:

```text
GUIDE LEADS
→ ARRIVES AT TRANSITION POINT
→ VISITOR ORIENTS TO PORTAL
→ WORLD B BECOMES LIVE / VISIBLE
→ TRANSITION MODE
→ GUIDE / VISITOR CROSS
→ DESTINATION SETTLES
→ NORMAL CAMERA AUTHORITY RETURNS
→ GUIDE CONTINUES
```

## 11. What appears highly reusable conceptually

```text
KEEP / ADAPT CANDIDATES
- two-world transition concept
- one renderer + offscreen RenderTarget
- perspective-correct destination view
- CameraUtils.frameCorners mechanism
- portal-corner computation
- temporary second transition camera
- camera synchronization concept
- transition phases
- world-transform choreography
- portal shader / membrane as optional spectacular representation
- raycast activation idea
```

## 12. What must not silently overwrite IW architecture

```text
DO NOT BLINDLY IMPORT
- World-owned visitor camera architecture
- OrbitControls ownership
- a second canonical World State
- currentWorld/otherWorld as universal source of truth
- source-specific GLTF node assumptions
- external demo assets without rights verification
- a second Portal semantic system
```

## 13. Important source coupling

The demo loads two GLTF worlds and expects named nodes such as:

```text
holder
portal
portalWorldStart
portalWorldEnd
```

That is demo-specific coupling.

The reusable product idea is authored spatial relationships, not mandatory GLTF node names.

## 14. Performance characteristics

The mechanism does not inherently require a second WebGL context, but it does require additional rendering.

With one active live portal, the frame typically includes at least:

```text
RENDER DESTINATION TO TARGET
+
RENDER ACTIVE WORLD
```

Potential future controls may include visibility gating, adaptive render-target resolution, update cadence and lifecycle, but these should be driven by measured evidence rather than premature optimization.

The source uses a high-resolution `WebGLRenderTarget(2048, 2048)` with `HalfFloatType`; this is a quality choice, not an IW requirement.

## 15. Relationship to Projection and Flexible Media

Do not merge the technologies.

```text
PROJECTION
media becomes architectural light

FLEXIBLE MEDIA
media becomes moving/deformable material

LIVE TWO-WORLD PORTAL
another world becomes a live spatial transition surface
```

They can compose in one Museum journey:

```text
GALLERY A
→ LIVE TWO-WORLD PORTAL
→ GLIMPSE DESTINATION
→ CROSSING
→ GALLERY B
→ PROJECTION EXPERIENCE
```

## 16. First future proof target

When explicitly authorized after GRAFT 01 review, the recommended proof is not a generic portal laboratory.

It is a real Museum journey improvement:

```text
Gallery A → Gallery B
```

Success should be judged by:

- destination visible before crossing;
- perspective feels spatial rather than video-like;
- Guide / visitor staging is coherent;
- two-camera mechanism exists only during transition;
- one authoritative visitor camera remains true;
- one WebGL context remains true;
- transition is spectacular rather than merely functional;
- Gallery B Projection strengthens anticipation;
- no second World State / Portal system appears;
- current Guided journey continues coherently after arrival.

## 17. Stop rule

This document is reference and product intent only.

It does **not** authorize implementation by itself.

Implementation requires explicit Juanma authorization after the current material pass is reviewed.
