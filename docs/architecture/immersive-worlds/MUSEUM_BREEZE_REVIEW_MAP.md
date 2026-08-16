# Breeze — Human QA Review Map

> **Branch:** `claude/immersive-worlds-module-c0d3f7`
> **Status:** PRODUCT APPROVAL: PENDING
> **Harness:** 28/28 PASS · exit code 0

---

## OPEN

```bash
# from the repository root, on branch claude/immersive-worlds-module-c0d3f7
node tests/static-server.mjs 4180 .
```

Then open in a **WebGPU-capable browser** (Chrome 113+ or Edge 113+ on desktop):

```
http://127.0.0.1:4180/labs/immersive-worlds/index.html
```

WebGPU is required. Safari has partial WebGPU support; Firefox requires a flag. The installation will not fall back to WebGL.

---

## GO TO

1. Press **G** to start the guided tour ("Recorrido comentado").
2. Click **SIGUIENTE** (or press →) to advance through the gallery stops.
3. **Stop 11 of 12** enters the Sala Breeze ("Viento sobre mármol").

The Breeze room is the final chapter. Stops 11 and 12 are both inside it.

---

## DO

1. **Watch the arrival.** The camera transitions into the Breeze room and frames Venus.
2. **Watch the guide.** She introduces the sculpture, then steps aside during the hero moment.
3. **Watch the cloth.** After the guide steps aside, a cloth launches from the left, carried by wind toward Venus. It contacts the sculpture, deforms around it, and continues. This repeats every 16 seconds.
4. **Watch the camera.** During the hero moment the camera is at visitor position — no controls, no orbit. The camera belongs to the Museum.
5. **Let the hero moment play.** Steps 16–17 ("tela-aproxima" and "colisión") are the core visual experience: wind, cloth, contact, deformation, release.
6. **Press SIGUIENTE to exit.** Step 18 returns to the Galería B (Museum presentation restored).
7. **Press ← ANTERIOR to re-enter.** The Breeze room should reactivate cleanly. Then exit again.

---

## LOOK FOR

1. **Venus visible and recognizable** — a five-metre digital Venus de Milo, standing on a dark floor with a contact shadow.
2. **Cloth visible in motion** — a fabric sheet launched from the left (-X), carried rightward by wind, visibly approaching Venus.
3. **Visible contact and deformation** — when the cloth reaches Venus, it folds around the shoulder/torso. The deformation is computed by real-time GPU physics (6,561 vertices, 51,040 springs), not pre-animated.
4. **Guide intro → absence during hero → return** — the guide narrates at stops 14–15 (opacity 1), then disappears at stops 16–17 (opacity 0), then returns at stop 18 (opacity ~0.93).
5. **Room reads as a museum installation** — dark floor, three walls, neutral environment lighting. Not an asset viewer, not an outdoor scene.
6. **Label card** — "Viento sobre mármol / Niklas Niehus, 2025 / Simulación física en tiempo real · WebGPU · 800 × 700 cm" visible at the sculpture close-up step.
7. **Exit / re-entry lifecycle** — pressing SIGUIENTE at stop 18 exits Breeze, Museum canvas restores, HUD controls remain functional. Pressing ANTERIOR re-enters Breeze cleanly (second activation).

---

## MUST NOT CHANGE

These are the human-approved Museum baselines. Breeze must not regress them:

- Full Museum Studio layout and UI
- Crossing B (the crossing between Gallery A and Gallery B)
- Forward navigation through all gallery stops
- Same-room Back and cross-room Back
- Back → Forward round-trip
- Gallery lighting, wall labels, artwork framing
- HUD controls (SALAS, SONIDO, VISITA, CONTENIDO EN TEXTO, transport bar)
- Visitor UI, Panel, Calendar, Programme, Map, Seen/Not Seen

---

## KNOWN LIMITATIONS

1. **Headless screenshots do not capture cloth motion.** SwiftShader's compositor caches the WebGPU canvas texture. The automated harness proves the physics simulation advances (steps 19 → 97) but pixel-level screenshots may show identical frames during the hero moment. This is a QA instrument limitation, not a product defect. Real browser, real GPU → real cloth.
2. **Entry screenshot shows Venus at far right.** The automated screenshot captures the camera mid-transition from the Gallery B portal to the LEAD framing position. The final framing centers Venus; the transition is visible only as a brief animation in real-time.
3. **P0.2 (durable cloud persistence) remains an external blocker.** Project Cloud / R2 byte persistence is not cross-session proven. This does not affect Breeze's visual/product behavior.
4. **No pre-simulation.** The cloth starts from its spawn position at activation, not from a pre-computed mid-flight state. On SwiftShader, this would take ~400 seconds of wall-clock time. On a real GPU, the first launch completes in real-time (~2–3 seconds).

---

## RETURN

After reviewing the Breeze room in a real browser:

**KEEP** — the installation works as intended, move to the next vertical.

**ADJUST** — describe what to change (camera, timing, cloth behavior, room geometry, guide, lighting, etc.).

**REJECT** — describe what fails and why.
