# Infinite Worlds — Cinematic & Brand V1.1

Status: **isolated candidate / visual-runtime approval pending**.

V1.1 is an additive evolution of `labs/infinite-worlds-fidelity-v1/`. The approved V1 folder and its preview branch remain untouched.

## Frozen core

The following V1 mechanics are deliberately preserved:

- `App → World → Portal` mental model.
- Two complete Three.js scenes and two cameras.
- `WebGLRenderTarget(2048 × 2048, HalfFloatType)`.
- `Portal.updateCorners()`.
- `CameraUtils.frameCorners(...)` off-axis perspective.
- Target-world render → portal texture → current-world render order.
- Camera position/quaternion synchronization.
- Raycaster hover and click activation.
- Original `Power4.easeIn` portal approach.
- `moveWorldToEnd()`.
- `switchWorlds()`.
- `Power4.easeOut` restoration.
- Infinite bidirectional traversal.

If a future enhancement requires changing one of those invariants, it must be treated as a separate experiment rather than silently changing V1.1.

## Seven approved V1.1 layers

### 1. Cinematic intro

- Hero Reveal default.
- Subtle Reveal.
- Off.
- Intro ends at the V1 camera baseline before control is handed to the user.
- Skip action is available.

### 2. Environmental audio + portal crossfade

Generated locally with Web Audio so V1.1 has no external audio-file dependency:

- City: traffic/noise bed + urban air + low industrial source.
- Nature: river/noise bed + leaves + bird source.
- During portal traversal the source world fades down while target-world ambience fades up.

Audio starts only after an explicit user action because browsers restrict autoplay audio.

### 3. Color grading presets

City:
- Industrial Blue.
- Polluted Noir.
- Cold Steel.
- Original V1.

Nature:
- Living Green.
- Golden Valley.
- Emerald Dream.
- Original V1.

Profiles alter exposure, fog, lighting and a cinematic overlay without changing portal geometry or camera mechanics.

### 4. Light spill

Each portal has an additive spill layer and local light. Intensity grows with camera proximity and hover. Nature leaks green/warm light into City; City leaks cold blue into Nature.

### 5. Brand Media Layer

Local browser-only customization slots:

- Image upload.
- Video upload via `THREE.VideoTexture`.
- Logo upload.
- Headline + subheadline rendered to a CanvasTexture.
- City billboard target.
- Nature installation target.
- Reset restores neutral authored placeholders.

Files use `URL.createObjectURL()` and are not uploaded to a server.

### 6. Portal appearance controls

The render target, corners, perspective and transition stay unchanged. Only shader appearance is parameterized.

Presets:
- Original.
- Clean Glass.
- Liquid.
- Energy.
- Dream.
- Organic.

Advanced live controls:
- Distortion.
- Glow.
- Speed.

### 7. Spatial audio

- Web Audio HRTF panners.
- City positional industrial source.
- Nature positional bird source.
- Portal acoustic leakage comes from the 3D portal position.
- Listener position/orientation follows the active camera.
- Spatial mode can be disabled independently.

## UI

`CUSTOMIZE` opens an authoring panel. `PREVIEW MODE` hides authoring/HUD so the experience can be reviewed cleanly.

## Reference

Portal mechanics remain derived from the supplied Infinite Portals reference by Karim Maaloul / Yakudoo:

- `https://codepen.io/Yakudoo/pen/PogJvGv`
- `https://gist.github.com/Juanmaes83/9c9ae4d788b12be6de8613eaf6a1beff`

## Approval gate

Do not merge to `master` until browser/runtime review confirms at minimum:

1. V1 portal perspective remains correct.
2. City → Nature traversal remains seamless.
3. Nature → City traversal remains seamless.
4. Repeat traversal works multiple times.
5. Intro ends at a valid controllable camera state.
6. Audio can be enabled/disabled without blocking interaction.
7. Environmental crossfade follows world transition.
8. Spatial portal leakage follows the portal direction.
9. All six portal presets keep the target world visible.
10. Image, logo, text and video slots render correctly.
11. Grade changes do not break exposure/fog after world switching.
12. Preview Mode returns a clean experience.
13. V1 folder and V1 preview remain unchanged.
