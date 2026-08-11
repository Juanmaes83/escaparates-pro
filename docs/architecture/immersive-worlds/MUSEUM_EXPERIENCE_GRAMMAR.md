# Museum / Institutional — Experience Grammar

> **Status:** PRODUCT DIRECTION — EXPLICIT / CANONICAL WORKING CONTRACT  
> **Owner:** Juanma — Product Owner / Visual Authority  
> **Scope:** Escaparates Pro → Immersive Worlds → Museum / Institutional  
> **Purpose:** define how the Museum Guided Experience is composed, navigated, reviewed and later authored without depending on chat memory or one prototype's incidental implementation.

---

# 1. Governing product idea

The Museum experience is not a flat list of checkpoints and it is not a slide deck.

The canonical product grammar is:

```text
TOUR
→ STOP
→ EXPERIENCE-SPECIFIC BEATS
→ TRANSITION
→ NEXT STOP
```

The visitor should not feel that they are operating a 3D application. They should feel that they are moving through a deliberately authored exhibition.

The experience therefore needs a repeatable grammar that is:

- spatial;
- cinematic without becoming passive cinema;
- reversible;
- inspectable;
- reusable across works;
- specialized by experience type;
- compatible with Guided and Explore;
- compatible with future authoring;
- independent from QA/debug checkpoints.

---

# 2. Canonical hierarchy

```text
MUSEUM GUIDED EXPERIENCE
│
├── TOUR
│
├── STOP 01
│     ├── BEAT A
│     ├── BEAT B
│     ├── BEAT C
│     └── BEAT D
│
├── TRANSITION 01 → 02
│
├── STOP 02
│     ├── BEAT A
│     ├── BEAT B
│     ├── BEAT C
│     └── BEAT D
│
├── TRANSITION 02 → 03
│
├── STOP 03
│     └── ...
│
└── END
```

Important distinctions:

```text
STOP ≠ BEAT
BEAT ≠ TRANSITION
TRANSITION ≠ PORTAL
FOCUS ≠ COLLECTION BROWSE
QA STATE ≠ TOUR STEP
```

A QA checkpoint may expose or verify any of these states, but QA does not define the experience grammar.

---

# 3. Tour

A **Tour** is the authored end-to-end guided experience.

It defines the canonical sequence of meaningful Stops and the Transitions that connect them.

The Tour is not allowed to become a second World State. Explore and Guided continue to operate over the same canonical world.

The Tour must support:

- automatic playback;
- manual advance;
- manual reverse;
- pause/resume where appropriate;
- exit to Explore;
- deterministic restoration of the experience state required for review.

The Tour's visible navigation and its automatic traversal must derive from one canonical ordering contract.

---

# 4. Stop

A **Stop** is a meaningful authored encounter in the exhibition.

Typical Stops include:

- an artwork;
- a sculpture;
- a projection/time-based work;
- an installation;
- an architectural or interpretive moment;
- another future museum experience type.

A Stop answers:

> What is the visitor encountering now?

A Stop does **not** equal one camera pose. A Stop may contain several Beats.

---

# 5. Beat

A **Beat** is an authored experiential moment inside a Stop.

A Beat can coordinate, as required by the experience:

- camera/viewpoint;
- Guide position;
- visitor/character staging;
- artwork/subject target;
- Focus state;
- caption/narration;
- timing;
- sound cue;
- metadata/ficha visibility;
- interaction availability.

The exact physical implementation remains subordinate to the semantic experience intent.

A future authoring layer should be able to configure Beats through semantic data and spatial Anchors/Viewpoints rather than requiring scene-specific code.

---

# 6. Strong 4-beat grammar — but specialized by Experience Type

The Museum adopts a **strong four-beat pattern** as a reusable authored grammar, but it is **not a rigid universal template**.

Different experience types specialize the meaning of A/B/C/D.

The rule is:

> **Four beats provide rhythm and predictability; Experience Type provides meaning.**

Do not mechanically force every Entity Kind into the same four camera shots.

---

# 7. ARTWORK grammar — canonical

For a conventional wall artwork / painting / photographic work, the canonical four-beat grammar is:

```text
A — CONTEXT / ARRIVAL
B — SHARED ATTENTION
C — HUMAN CONTEMPLATION
D — PURE ARTWORK POV
```

## Beat A — CONTEXT / ARRIVAL

Purpose: spatial orientation.

The visitor understands:

- which room they are in;
- where the work sits in the architecture;
- where the Guide is;
- where the encounter is beginning.

Typical visual language:

```text
WIDE / ENVIRONMENTAL VIEW
room + artwork + Guide
```

This is not a mandatory fixed shot. The invariant is the **contextual function**.

## Beat B — SHARED ATTENTION

Purpose: the Guide and visitor share attention on the work.

Typical language:

```text
OVER-THE-SHOULDER / REAR / LATERAL GUIDE VIEW
Guide + artwork
```

The Guide remains present but should not overpower the work.

## Beat C — HUMAN CONTEMPLATION

Purpose: establish the human relationship with the work and allow the Guide to yield narrative dominance.

Typical language:

```text
MEDIUM HUMAN VIEW
visitor/person contemplating artwork
```

The experience moves from:

```text
I AM BEING GUIDED
```

toward:

```text
I AM CONTEMPLATING
```

## Beat D — PURE ARTWORK POV

**This is explicit product direction.**

Beat D is the visitor's direct visual point of view toward the artwork.

```text
NO GUIDE
NO CHARACTER
NO AVATAR
NO OVER-THE-SHOULDER BODY
NO HUMAN FIGURE IN FRAME

ONLY:
VISITOR POV → ARTWORK
```

The artwork becomes the sole visual protagonist.

This is the natural home for:

- title / creator / year / medium;
- dimensions;
- restrained exhibition label;
- optional expandable ficha / curatorial text;
- accessibility content;
- controlled zoom/detail if appropriate;
- optional entry into Collection Browse.

The default information treatment must remain subordinate to the work. Metadata is available; it does not become a competing application panel.

---

# 8. PROJECTION / TIME-BASED WORK grammar

Projection is not a painting with moving pixels.

The strong four-beat rhythm specializes as:

```text
A — CONTEXT
B — SHARED ATTENTION
C — GUIDE YIELDS
D — TIME-BASED DWELL
```

## D — TIME-BASED DWELL

The room settles. The Guide is no longer the protagonist. The visitor is given time to experience change.

The final beat may therefore have a materially longer duration than a conventional artwork Focus.

The time-based work should not be forced into the same rapid focus/return timing as a static painting.

---

# 9. SCULPTURE grammar

A sculpture may specialize the four-beat rhythm as:

```text
A — CONTEXT
B — SHARED ATTENTION
C — HUMAN / SCALE RELATION
D — DETAIL / ORBIT FOCUS
```

The D beat may require spatial inspection rather than a flat frontal POV.

Its camera language may include controlled orbit/detail movement if that serves the work and preserves one authoritative camera controller.

---

# 10. Transition is a first-class relation between Stops

A Transition always sits **between** canonical Stops.

```text
STOP 01
A → B → C → D
      ↓
TRANSITION 01 → 02
      ↓
STOP 02
A → B → C → D
```

A Transition is **not Beat E**.

This separation is deliberate because the same Stop grammar may be connected by different transition languages.

A Transition answers:

> How do we leave the current authored encounter and arrive at the next one?

---

# 11. Two major transition families

## 11.1 ARTWORK → ARTWORK transition

Used between works in the same space or where no major world/space threshold exists.

Typical experiential intent:

```text
RELEASE / RETURN FROM FOCUS
→ REORIENT
→ GUIDE REGAINS PRESENCE
→ MOVE TOWARD NEXT WORK
→ ARRIVE AT NEXT STOP
```

This transition should usually be lighter, shorter and less spectacular than a room/world transition.

It must remain authored, not arbitrary teleportation unless that is explicitly the chosen language.

## 11.2 SPACE → SPACE transition

Used when the experience crosses a meaningful spatial threshold.

Typical experiential intent:

```text
LEAVE CURRENT SPACE
→ APPROACH THRESHOLD
→ ORIENT
→ CROSS / PORTAL / WORLD TRANSITION
→ ARRIVE IN DESTINATION SPACE
```

This is the family in which future **Live Two-World Portal Transition** work belongs.

Therefore:

```text
ARTWORK TRANSITION ≠ SPACE TRANSITION
```

They share the semantic concept `Transition`, but their choreography and visual language may differ substantially.

---

# 12. Bidirectional Tour navigation

The Guided Tour must support both forward and backward movement.

Conceptually:

```text
PREVIOUS BEAT ← CURRENT BEAT → NEXT BEAT
```

Example:

```text
STOP 02 / C
← STOP 02 / B
→ STOP 02 / D
```

From the final Beat of one Stop:

```text
STOP 02 / D
→ TRANSITION 02→03
→ STOP 03 / A
```

Reverse navigation from the start of a Stop must restore the previous authored state truthfully:

```text
STOP 03 / A
→ reverse/reconstruct transition semantics
→ STOP 02 / D
```

The exact technical mechanism may currently be reconstruction rather than true seek. The UI and documentation must describe actual behaviour truthfully.

Forward/backward controls must not operate over an independent hidden ordering system.

---

# 13. Focus

**Focus** is the authored state in which a work becomes the primary perceptual subject.

For conventional artworks, Beat D is the canonical entry point into pure-artwork Focus.

Focus may expose restrained metadata and optional detail controls, but the work remains dominant.

Focus is not a second tour and does not own World State.

---

# 14. Collection Browse

**Collection Browse is an optional navigation mode inside artwork Focus.**

It is explicitly **not**:

- another Tour;
- another World State;
- another World;
- another duplicate collection model.

Its purpose is to provide a fast, artwork-first way to browse the collection without replaying the full Guide choreography for every work.

Conceptually:

```text
GUIDED TOUR
   │
   │ STOP 03 / BEAT D
   ↓
PURE ARTWORK FOCUS
   │
   ├── CONTINUE GUIDED TOUR
   │
   └── ENTER COLLECTION BROWSE
            │
            ├── ← PREVIOUS ARTWORK
            ├── CURRENT ARTWORK
            ├── NEXT ARTWORK →
            └── EXIT COLLECTION BROWSE
```

Collection Browse may move:

```text
Artwork 03
→ Artwork 04
→ Artwork 05
→ Artwork 06
→ Artwork 07
```

or backward through the same ordered collection.

The Guide and visitor character remain absent from the pure artwork presentation unless a future explicitly approved experience language says otherwise.

---

# 15. Collection Browse return contract — explicit

Collection Browse **must remember the exact Guided Tour origin**.

Example:

```text
ENTER FROM:
STOP 03 / BEAT D

BROWSE:
Artwork 03
→ Artwork 04
→ Artwork 05
→ Artwork 06

EXIT COLLECTION BROWSE

RETURN TO:
STOP 03 / BEAT D
```

The currently browsed artwork does **not** silently rewrite the Guided Tour position.

The Guided Tour remains the canonical narrative state.

After returning to `STOP 03 / BEAT D`, the visitor may continue the normal Guided Experience from that exact authored point.

Future product work may explicitly introduce an alternative command such as "continue the tour from this work", but it is **not** part of the current contract.

---

# 16. Two navigation meanings must remain visually unambiguous

The system contains two different previous/next intents.

## In Guided Tour

```text
PREVIOUS / NEXT
=
previous or next authored Beat / Transition in the canonical Tour
```

## In Collection Browse

```text
PREVIOUS ARTWORK / NEXT ARTWORK
=
move laterally through the collection while staying in Focus language
```

The UI must make the active mode clear enough that the same arrow icon cannot create semantic ambiguity.

Mode/state may be visually restrained, but it must be legible.

---

# 17. Source-of-truth rule

The new grammar must not introduce duplicated narrative truth.

Conceptually:

```text
CANONICAL TOUR CONTRACT
        │
        ├── Stops
        │     └── Beats
        │
        ├── Transitions
        ├── automatic traversal
        ├── manual Previous / Next
        ├── progress UI
        └── QA integrity checks
```

Collection Browse references the canonical collection/entity records and stores only the navigation context required to return to the originating Tour state.

It must not own a duplicate collection.

---

# 18. Anchors / Experience Points and future authoring

This grammar is intended to become authorable later without turning V1 into a Unity clone.

A future authored Artwork Stop may conceptually bind:

```text
ARTWORK STOP
│
├── Beat A
│     camera/viewpoint → Context Anchor
│     guide → Arrival Anchor
│
├── Beat B
│     camera/viewpoint → Shared Attention Viewpoint
│     guide → Shared Attention Anchor
│
├── Beat C
│     camera/viewpoint → Human Contemplation Viewpoint
│     visitor/character staging → Viewing Anchor
│
└── Beat D
      camera/viewpoint → Pure Artwork Focus Viewpoint
      target → Artwork Entity
      metadata → Artwork canonical content
```

The exact schema is deliberately not frozen by this document.

The product principle is:

> **Reuse experience grammar; author different anchors, viewpoints, content and timing.**

This is how the Museum should gain repeatability without hardcoding every artwork encounter.

---

# 19. Experience grammar vs Scene Kit

The grammar is semantic/product behaviour.

Scene Kit owns visual realization.

Therefore:

```text
A — CONTEXT
```

means a contextual arrival function, not one immutable camera coordinate.

Different Experience Languages may eventually realize the same semantic Beat differently while preserving its purpose.

---

# 20. Guide responsibility

The Guide provides:

- scale;
- accompaniment;
- orientation;
- narrative presence;
- shared attention.

The Guide must not remain visually dominant through the complete encounter.

The artwork grammar intentionally moves toward disappearance of mediation:

```text
GUIDE PRESENT
→ SHARED ATTENTION
→ HUMAN CONTEMPLATION
→ GUIDE ABSENT
→ ARTWORK ONLY
```

Beat D is therefore not merely another camera shot. It is the perceptual culmination of the encounter.

---

# 21. Camera authority invariant

This grammar does not change the existing invariant:

> Exactly one authoritative visitor-camera controller per frame.

Guided Beat choreography, Focus, Explore and future Transition choreography require explicit camera-authority handoff.

Temporary auxiliary/offscreen cameras used by future Live Two-World Portal rendering remain optical instruments, not competing visitor-control authorities.

---

# 22. QA and verification requirements

Future implementation of this grammar should be demonstrably verifiable.

At minimum, QA should be able to prove:

- canonical Stop order;
- canonical Beat order within each Stop;
- every Stop-to-Stop Transition exists where required;
- forward traversal is complete;
- backward traversal is coherent;
- Beat D of Artwork contains no Guide/visitor character if that is the approved visual language;
- Collection Browse preserves Focus language;
- Collection Browse Previous/Next navigates artworks rather than Tour Beats;
- Collection Browse exit restores exact origin Stop/Beat;
- Tour state is not silently replaced by browsed artwork state;
- QA/debug states do not redefine the Tour grammar.

Deterministic evidence should make the hierarchy visible:

```text
TOUR
→ STOP
→ BEAT
→ TRANSITION
```

rather than exposing one undifferentiated flat list.

---

# 23. Current implementation relationship

This document defines product intent and the canonical working experience grammar.

The current Museum already contains many required capabilities, including Guide, Focus, story steps, artwork navigation, metadata/ficha, route traversal, Projection dwell, portals, Anchors and deterministic QA states.

The next implementation pass must therefore **audit and map before rebuilding anything**.

Required approach:

```text
READ CURRENT VERIFIED CODE
→ READ MUSEUM_GUIDED_TOUR_CONTRACT
→ MAP CURRENT STOPS / BEATS / TRANSITIONS
→ MAP EXISTING FOCUS / PREV-NEXT CAPABILITY
→ IDENTIFY WHAT ALREADY SATISFIES THIS GRAMMAR
→ IDENTIFY TRUE GAPS
→ SCULPT / COMPOSE EXISTING CAPABILITIES
→ GRAFT ONLY WHERE A REAL CAPABILITY GAP EXISTS
```

Do not discard working capability merely because the current internal names differ from A/B/C/D.

Do not implement a parallel tour system.

---

# 24. Explicit product decisions captured here

The following decisions are explicit from the Product Owner and should be treated as current product direction unless later superseded:

1. Museum experience hierarchy is `Tour → Stop → Beats → Transition → next Stop`.
2. A Transition exists between successive canonical Stops.
3. Transitions between artworks and transitions between spaces are different experiential families.
4. Artwork Stops use the strong four-beat grammar `Context → Shared Attention → Human Contemplation → Pure Artwork POV`.
5. Artwork Beat D contains no Guide and no visitor character; the work is the sole protagonist from the visitor's POV.
6. Beat D may expose restrained metadata and an expandable ficha.
7. Projection and Sculpture specialize the strong four-beat rhythm rather than copying the Artwork shots mechanically.
8. Guided navigation must support forward and backward traversal.
9. Collection Browse is a Focus navigation mode, not another Tour or World State.
10. Collection Browse supports previous/next artwork navigation.
11. Collection Browse remembers the exact originating Guided Stop/Beat.
12. Exiting Collection Browse returns exactly to that originating Stop/Beat and normal Guided Experience continues from there.
13. The currently browsed artwork does not silently change the Guided Tour's canonical position.
14. The grammar must be reusable later through authored Anchors/Viewpoints/content/timing rather than bespoke code per work.

---

# 25. Anti-patterns

Reject implementations that create any of the following:

- a flat checkpoint list pretending to be the experience model;
- one camera pose = one Stop;
- Transition implemented as accidental Beat E;
- identical A/B/C/D shots forced onto every Experience Type;
- Guide remaining onscreen during Artwork Beat D;
- Collection Browse implemented as a second Tour;
- browsing an artwork silently moving the Guided Tour position;
- separate Previous/Next ordering that disagrees with the canonical Tour;
- duplicated Entity/collection state for browsing;
- QA checkpoints becoming the source of truth for narrative order;
- hardcoded per-artwork choreography where semantic Anchors/Viewpoints can express the same grammar.

---

# 26. Product quality test

The grammar is successful when the visitor experiences a repeatable but non-mechanical rhythm:

```text
I ENTER THE ENCOUNTER
→ I UNDERSTAND THE SPACE
→ ATTENTION IS SHARED
→ MEDIATION WITHDRAWS
→ THE WORK BECOMES THE EXPERIENCE
→ I MAY EXPLORE THE COLLECTION DIRECTLY
→ I CAN RETURN EXACTLY TO MY GUIDED JOURNEY
→ I MOVE NATURALLY TO THE NEXT ENCOUNTER
```

The system should become more reusable as this grammar becomes clearer, while the visitor should perceive **less system**, not more.

---

# 27. Implementation gate

This document does **not** authorize an implementation agent to begin the next technology graft automatically.

For the next Museum refinement:

```text
READ CURRENT CODE + CURRENT DOCS
→ AUDIT EXISTING CAPABILITIES AGAINST THIS GRAMMAR
→ MAP CURRENT 17 INTERNAL BEATS / CURRENT CANONICAL STOPS
→ IDENTIFY MATCH / GAP / CONFLICT
→ PROPOSE MINIMAL STRONG CHANGE
→ IMPLEMENT ONLY APPROVED SCOPE
→ QA + EVIDENCE
→ JUANMA + CHATGPT REVIEW
→ STOP
```

Only after this grammar is working coherently should the project move confidently into the next major transition and room-technology grafts.
