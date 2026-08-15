# MUSEUM TRANSITION FIDELITY CORRECTION V1

Status: HUMAN QA CORRECTION MANDATE  
Owner: Juanma  
Execution agent: Claude Code  
Target branch: `claude/immersive-worlds-module-c0d3f7`  
Scope: TRANSITION REPRESENTATION ONLY  
Product approval: PENDING  
Merge: NO  
Promotion: NO  
Master: UNTOUCHED

---

# 1. HUMAN QA VERDICT

The current Museum transition is **functionally valid but visually rejected**.

This is NOT:

- an endpoint problem;
- a pacing problem;
- a semantic-transition problem.

It is a **REPRESENTATION / CAMERA-CHOREOGRAPHY GAP**.

The existing Authoring work for `Ágil / Natural / Pausado`, reduced motion, semantic transition families and destination preservation remains KEEP.

The missing layer is the cinematic visual representation.

Canonical architecture rule:

> TRANSITION BEHAVIOUR ≠ VISUAL REPRESENTATION

The behavior layer is KEEP. The representation layer must now be recovered from the first-party source donor.

---

# 2. CANONICAL MOTION REFERENCE — NOW STORED IN THE REPOSITORY

The canonical source recording is already stored in this repository on the target branch at:

`docs/visuals/museum-transitions/source-reference/SOURCE_TRANSITION_CANONICAL_GITHUB.mp4`

Treat this file as **CANONICAL MOTION EVIDENCE**.

It is not loose inspiration and it is not optional supporting material.

Claude must inspect this repository copy directly before implementing.

The corresponding implementation already belongs to Juanma and exists in the repository under the Infinite Worlds donor family.

Before implementing anything:

1. watch the repository video completely;
2. inspect it frame by frame;
3. extract the mandatory 12-beat SOURCE storyboard described below;
4. locate the exact first-party donor implementation responsible for the behavior visible in the video;
5. build the SOURCE → MUSEUM capability map;
6. reuse/adapt proven mechanisms before inventing replacements.

Do NOT recreate the effect from memory if the actual source implementation is available.

The transition correction has THREE simultaneous sources of truth:

1. **Repository video** = perceptual / motion truth;
2. **First-party donor code** = technical implementation truth;
3. **12-beat storyboard** = narrative / cinematic specification.

All three must agree before the transition can be considered visually faithful.

---

# 3. REQUIRED CINEMATIC MOTION GRAMMAR

The source transition is not simply:

`approach → shader → world swap`.

Its motion grammar is:

1. TARGET ACQUISITION / COMPOSITION LOCK
2. STAGED FORWARD APPROACH
3. PORTAL SCALE TAKEOVER
4. SHADER + LIGHT INTENSIFICATION
5. FULL-FRAME MEMBRANE CROSSING
6. WORLD SWAP WHILE VISUALLY OCCLUDED
7. DESTINATION-SIDE REORIENTATION
8. REVERSE-FACING EXIT
9. RECOIL / REVERSE DOLLY
10. DESTINATION WORLD REVEAL AROUND THE PORTAL
11. CLEAN SETTLE / HANDOFF

Every beat matters.

---

# 4. TARGET ACQUISITION / COMPOSITION LOCK

The portal becomes the visual subject before the crossing starts.

The camera aligns the portal close to the optical centre.

The portal becomes:

- the focal point;
- the vanishing point;
- the destination;
- the visual mask that will later hide world exchange.

Do not start the effect while the portal is merely somewhere in the frame.

Composition must first say:

> THIS IS WHERE WE ARE GOING.

---

# 5. STAGED FORWARD APPROACH

The source reads as a cinematic approach in phases, not one generic linear translation.

## PHASE A — ACQUIRE

The portal is still an architectural object inside World A.

The environment remains clearly readable around it.

## PHASE B — COMMIT

Forward motion increases the portal's dominance.

Peripheral architecture progressively loses importance.

The viewer feels committed to the crossing.

## PHASE C — TAKEOVER

The portal becomes nearly/full-frame.

It stops reading as an object attached to a wall and becomes the visual field itself.

Recover the donor's actual choreography where possible.

Do not substitute one generic tween simply because it reaches the same destination.

---

# 6. PORTAL TAKEOVER

As the camera approaches, the portal surface must progressively dominate the viewport.

The world exchange becomes visually safe only when recognizable World A geometry is sufficiently occluded by the portal/membrane.

This full-frame takeover hides topological discontinuity.

Do NOT hard-cut from a wide room view directly into World B.

The viewer must perceive:

`ROOM A → ENTER MEMBRANE → EMERGE ROOM B`

not:

`ROOM A → CUT → ROOM B`.

---

# 7. SHADER + LIGHT INTENSIFICATION

The optical effect ramps with proximity.

The surface evolves perceptually:

`SURFACE → MEMBRANE → DEPTH/TUNNEL → FULL VISUAL FIELD`

Recover the donor's real portal mechanisms where applicable, including:

- render target;
- destination camera synchronization;
- `frameCorners` / equivalent framing;
- portal shader;
- effect intensity ramp;
- render order;
- crossing logic;
- destination warmup/readiness;
- world swap timing;
- destination-side portal representation.

Do NOT replace the proven donor with a CSS fade, generic dissolve or unrelated shader.

The central dark region functions as a visual suction / absorption point and should preserve the same compositional role even if Museum styling later changes its colour or material language.

---

# 8. WORLD SWAP UNDER VISUAL OCCLUSION

The world switch must happen while the portal/membrane owns the frame.

The swap should be perceptually hidden by the full-frame transition representation.

Do not expose a naked scene switch.

---

# 9. DESTINATION-SIDE REORIENTATION — CRITICAL

After crossing, the source does NOT simply continue forward looking away from the portal.

The destination-side camera is composed so that the viewer sees the **reverse side of the portal just crossed**.

This is essential spatial storytelling.

The viewer should immediately understand:

> THAT IS THE THRESHOLD I JUST CROSSED.

Recover the donor behavior that produces this orientation.

Do not approximate it with an arbitrary 180° spin if the donor already contains the actual destination-camera/crossing solution.

---

# 10. RECOIL / REVERSE DOLLY — REQUIRED SIGNATURE

After emergence, the source performs a visible recoil.

The portal begins large in the destination frame and then reduces in apparent size while remaining approximately centred.

This reads as the camera moving backward away from the portal while continuing to look at it.

The perceptual grammar is:

`CROSS → EMERGE → GET EXPELLED / RECOIL → SETTLE`

This simulated inertia is one of the strongest cinematic signatures of the source transition.

It is REQUIRED for the fidelity pass.

Do not end the transition at the first valid frame in World B.

---

# 11. DESTINATION WORLD REVEAL

The recoil is also a reveal shot.

As the camera moves backward:

`portal huge → portal large → portal medium → destination environment appears around it`

The new world is revealed around the same threshold used for the crossing.

This creates spatial continuity and gives the transition a beginning, middle and end.

---

# 12. FINAL SETTLE

After recoil, the camera must settle cleanly into the approved destination / handoff state.

Human QA will inspect whether the current reported 1–3 cm asymptotic shortfall is perceptible.

Do not casually change approved destination semantics.

If a tiny final settle/snap is required to make the shot visibly finish, implement only the smallest contract-safe solution and prove it.

---

# 13. FIRST-PARTY DONOR AUDIT — MANDATORY

Before writing replacement code, locate the exact Infinite Worlds donor implementation responsible for the repository reference video.

Identify the concrete files/functions/classes responsible for:

- render target;
- destination camera;
- camera synchronization;
- portal framing;
- shader;
- effect intensity;
- crossing;
- world activation/swap;
- post-cross orientation;
- reverse-side portal visibility;
- recoil / exit choreography.

Build a SOURCE → MUSEUM map.

For every capability mark one of:

- DIRECT REUSE
- ADAPT
- ALREADY PRESENT
- MISSING

Do not reimplement first-party capability without a documented incompatibility.

---

# 14. STORYBOARD EXTRACTION FROM THE REPOSITORY VIDEO — MANDATORY

Before implementing the correction, extract a **12-frame canonical storyboard** from:

`docs/visuals/museum-transitions/source-reference/SOURCE_TRANSITION_CANONICAL_GITHUB.mp4`

Do not choose frames at equal time intervals.

Choose frames by **narrative beat**.

Required storyboard beats:

1. WORLD A / portal visible in architectural context
2. ACQUIRE / portal centred as subject
3. APPROACH PHASE A
4. APPROACH PHASE B / commitment
5. APPROACH PHASE C / takeover beginning
6. FULL-FRAME PORTAL / shader peak
7. MEMBRANE CROSSING / world swap hidden
8. WORLD B EMERGENCE / reverse side of portal visible
9. RECOIL START / portal still very large
10. RECOIL MID / destination world begins revealing
11. RECOIL END / destination environment clearly established
12. SETTLE / final destination composition

For each storyboard frame record:

- frame/beat number;
- source timestamp;
- camera relationship to portal;
- portal scale in frame;
- dominant visual effect;
- visible world state;
- intended cinematic function.

Save the storyboard/evidence inside the Museum QA evidence structure without overwriting existing evidence.

This storyboard becomes an additional implementation specification, not decoration.

---

# 15. MATCHED MUSEUM STORYBOARD — MANDATORY

After implementation, create a second 12-frame storyboard from the Museum transition using the SAME narrative beats.

Then create a side-by-side comparison:

`SOURCE FRAME 01 | MUSEUM FRAME 01`

through:

`SOURCE FRAME 12 | MUSEUM FRAME 12`.

Do not compare by equal timestamps.

Compare by cinematic function.

The board must make missing beats impossible to hide in prose.

PIXELS WIN.

---

# 16. FIDELITY BEFORE MUSEUM-NATIVE STYLING

## PASS 1 — MOTION FIDELITY

Replicate the donor's motion grammar faithfully.

Do not prematurely redesign it into a quieter Museum effect.

First prove:

`SOURCE MOTION ≈ MUSEUM MOTION`.

## PASS 2 — MUSEUM-NATIVE REPRESENTATION

Only after motion fidelity is proven may Museum styling tune:

- colour;
- material language;
- shader palette;
- light treatment;
- architectural integration.

But it must preserve:

`CENTER → APPROACH → TAKEOVER → MEMBRANE → CROSS → REVERSE PORTAL → RECOIL → DESTINATION REVEAL → SETTLE`.

---

# 17. KEEP EXISTING TRANSITION AUTHORING

Do not break:

- Ágil;
- Natural;
- Pausado;
- reduced-motion semantics;
- exact authored destination;
- T1–T5 semantic transition system.

Pacing should scale the full choreography intelligently.

It must not merely scale one camera tween.

The relative beats must remain perceptible across supported pacing levels:

- APPROACH
- CROSSING
- RECOIL
- SETTLE

---

# 18. HUMAN ACCEPTANCE TEST

Internal tests are not sufficient.

Juanma + ChatGPT will manually compare Museum against the repository source video.

Required visible behavior:

- [ ] portal/threshold intentionally centred;
- [ ] staged forward approach;
- [ ] progressive portal growth;
- [ ] increasing shader/light intensity;
- [ ] full-frame / adequate visual occlusion before world exchange;
- [ ] no naked hard cut;
- [ ] destination emergence;
- [ ] reverse side of crossed portal visible immediately after emergence;
- [ ] clear recoil / reverse dolly;
- [ ] portal shrinks while destination world reveals around it;
- [ ] clean settle;
- [ ] Ágil / Natural / Pausado preserve the same choreography;
- [ ] destination contract remains intact;
- [ ] reduced motion remains valid.

If any essential beat is absent, do NOT report transition fidelity PASS.

---

# 19. ERROR / LEARNING LOG

Record why the previous implementation passed technical QA while failing human visual QA.

Canonical lesson:

> SEMANTIC/PACING TESTS DO NOT VALIDATE CINEMATIC REPRESENTATION.

Recurrence-prevention rule:

A transition is not visually validated merely because:

- destination is correct;
- timing changes;
- route state is valid.

A cinematic transition requires visual evidence against its canonical motion reference.

Record all meaningful implementation, QA-instrument and evidence mistakes discovered during this correction.

---

# 20. SCOPE LOCK

Do NOT work on:

- Visitor correction;
- sculpture + cloth;
- Breeze;
- avatar;
- billing;
- accounts;
- unrelated Authoring expansion.

This mandate is **TRANSITION REPRESENTATION ONLY**.

Visitor will receive its own Human-QA correction separately.

---

# 21. FINAL GATE

Return with:

- BRANCH
- HEAD
- TREE STATUS
- SOURCE VIDEO PATH USED
- SOURCE DONOR FILES IDENTIFIED
- SOURCE → MUSEUM CAPABILITY MAP
- WHAT WAS DIRECTLY REUSED
- WHAT WAS ADAPTED
- WHY
- SOURCE 12-FRAME STORYBOARD
- MUSEUM 12-FRAME MATCHED STORYBOARD
- SIDE-BY-SIDE SOURCE vs MUSEUM BOARD
- INTERACTIVE MUSEUM ARTIFACT
- ÁGIL / NATURAL / PAUSADO VISUAL EVIDENCE
- ENDPOINT CONTRACT PROOF
- REDUCED MOTION PROOF
- ERROR / LEARNING LOG ENTRY
- CLAUDE INTERNAL QA
- CLAUDE VISUAL CRITIC
- HUMAN QA: PENDING

PRODUCT APPROVAL: PENDING

NO MERGE.
NO PROMOTION.
MASTER UNTOUCHED.

Then STOP.
