# Immersive Worlds — Museum / Institutional
# NEXT PASSES ROADMAP — PRODUCT OWNER GATED

> **Status:** ACTIVE NEXT-STEPS PLAN — EXPLICIT JUANMA PRODUCT DECISION  
> **Working branch:** `claude/immersive-worlds-module-c0d3f7`  
> **Method:** `SCULPT + GRAFT + LOOK + COMPARE + DECIDE`  
> **Critical rule:** **ONE PASS AT A TIME. EVERY PASS ENDS IN STOP. JUANMA + CHATGPT REVIEW THE NAVIGABLE RESULT. ONLY EXPLICIT APPROVAL AUTHORIZES THE NEXT PASS.**

## 0. Mandatory pass gate

The implementation agent must not execute this roadmap continuously.

```text
PASS N
→ IMPLEMENT ONLY PASS N
→ QA + DETERMINISTIC EVIDENCE
→ SAVE BEFORE / AFTER
→ PROVIDE NAVIGABLE PREVIEW LINK
→ STOP
→ JUANMA + CHATGPT REVIEW
→ EXPLICIT APPROVAL?
   NO  → REVISE SAME PASS
   YES → PASS N+1 MAY START
```

No explicit approval = no next pass.

A green QA suite, commit, preview, PR, critic score or agent recommendation is **not** approval.

For every pass, Claude/Fable must deliver before STOP:

1. branch, base SHA and HEAD SHA;
2. exact files changed;
3. confirmation that `master`, Boards, Casebook and unrelated protected modules remain untouched;
4. QA/regression results;
5. deterministic evidence preserved without destroying prior baselines;
6. BEFORE / AFTER for material visual changes;
7. exact navigable preview URL and exact state/route to inspect;
8. concise `SCULPTED / PRESERVED / GRAFTED / OPEN` report.

Screenshots are evidence but never replace the navigable preview.

---

# 1. MANDATORY REFERENCE VIDEOS — READ/WATCH BEFORE VISUAL, GUIDE, CAMERA OR PORTAL PASSES

Two actual reference recordings are already stored in this branch and must be inspected before Pass 1 completion and again before any pass involving guide behaviour, locomotion, camera handoff, artwork approach, Focus/return, spatial anchors or Portal transitions:

1. `immersive-worlds-module/145be553-0736-4df6-b639-7f584f392a83.webm`
2. `immersive-worlds-module/video_2026-08-09_10-44-43.webm`

These are **primary behavioural/experience references**, not decorative attachments. Claude/Fable must access the actual files and study them rather than relying only on prior written descriptions.

If the current execution environment cannot directly play video, it must derive a reviewable keyframe sequence from the files and inspect that sequence. Inability to play the video is not permission to ignore the reference.

The reference package to derive from them is:

```text
RAW REFERENCE
+
KEYFRAMES
+
BEHAVIOURAL BREAKDOWN
+
DO COPY / DO NOT COPY
+
CAPABILITY EXTRACTION
```

Primary extraction targets:

- embodied presence;
- human scale cue;
- follow relationship;
- over-the-shoulder relationship;
- spatial anchors / floor-point behaviour;
- locomotion rhythm;
- artwork approach;
- Focus transition;
- return transition;
- room / Portal transition;
- guide continuity;
- subtle footprints / trajectory cue;
- minimal UI / experience-first navigation.

**DO NOT COPY:**

- character design;
- black/white visual identity;
- architecture;
- artwork;
- typography;
- exact control scheme;
- exact gallery geometry;
- proprietary code/assets/source expression.

Extract behaviour and capability principles. Build IW-native expression.

---

# 2. PASS 1 — CLOSE GUIDE HANDOFF

## Goal

Finish and validate the guide grammar before expanding it.

Current grammar:

```text
GUIDE PRESENCE
→ ACCOMPANIED / OVER-THE-SHOULDER
→ GUIDE YIELDS
→ VISITOR POV
```

## P0 defect

The current `GUÍA — visitante solo` review state can finish facing a wall / black background. This is not acceptable.

Fix the resulting visitor pose/orientation/return behaviour using existing camera/world contracts. Do not introduce a second camera model.

## Sculpt targets

- correct visitor-only final pose/orientation;
- improve guide silhouette enough to read immediately as human presence rather than pawn/totem/mannequin;
- preserve artwork dominance;
- preserve exactly one authoritative camera writer;
- validate reduced-motion behaviour;
- keep guide implementation deliberately minimal.

## Optional controlled experiment — footprints

The reference videos contain a useful trajectory detail: the character can leave subtle footsteps/traces while moving.

Test this only if it materially improves:

- spatial depth;
- route legibility;
- embodied presence;
- understanding of where the guide has moved.

The traces must be subtle, temporary, non-game-like and presentation-layer only. They must not become a second route/state system.

## Required checkpoint

- BEFORE / AFTER of broken visitor-only state;
- Guide Presence;
- Accompanied / over-the-shoulder;
- Yield moment;
- valid Visitor POV after handoff;
- mobile/reduced-motion evidence where relevant;
- QA + camera-authority result;
- navigable preview URL.

## STOP

**STOP after Pass 1. Do not begin Pass 2 until Juanma explicitly approves Pass 1.**

---

# 3. PASS 2 — PORTAL + GUIDE CONTINUITY BETWEEN ROOMS

> **DO NOT START UNTIL PASS 1 IS EXPLICITLY APPROVED.**

## Goal

Resolve the break in embodied continuity when moving from one Space to another.

Target feeling:

> the guide accompanies/leads me through a meaningful transition and the new room feels like the next place, not another loaded scene.

Preserve:

```text
HOTSPOT = trigger / interaction
PORTAL = spatial connection / transition
ANCHOR = where
ACTION = what happens
```

Use existing Portal + destination Anchor + Directed/Transition camera contracts first.

Do not build an NPC navigation system or second Portal system unless evidence proves a real architectural gap.

## Door / handle proof

A controlled representation may use a door, handle or authored door-zone:

```text
DOOR HANDLE / DOOR AREA
→ HOTSPOT
→ ACTIVATE_PORTAL
→ PORTAL TRANSITION
→ DESTINATION ANCHOR
→ GUIDE CONTINUITY
→ NEW SPACE
```

The two stored reference videos are mandatory study material for timing, continuity and transition grammar before implementation.

## Required checkpoint

- portal approach;
- interaction/activation;
- transition;
- guide crossing/continuity;
- destination arrival;
- valid camera handoff;
- reduced-motion alternative;
- BEFORE / AFTER;
- navigable preview URL.

## STOP

**STOP after Pass 2. Do not begin Pass 3 until Juanma explicitly approves Pass 2.**

---

# 4. PASS 3 — WORLD MAP + VISITED / UNSEEN / NEXT ROUTE

> **DO NOT START UNTIL PASS 2 IS EXPLICITLY APPROVED.**

## Goal

Upgrade the existing World Map / Route into useful spatial progress without creating a second truth model.

Reuse existing concepts where possible:

- World Graph;
- Route;
- current Space;
- visited semantic state;
- `VISITED` / `NEXT_ROUTE` concepts;
- Guided Experience.

Minimum useful grammar:

```text
CURRENT POSITION
VISITED
UNSEEN / NOT YET VISITED
NEXT GUIDED STOP
SPACE CONNECTIONS
```

The map must support Explore and Guided without becoming a game minimap.

## Required checkpoint

- map BEFORE / AFTER;
- current position;
- at least one visited Space;
- at least one unseen Space;
- next guided stop;
- state after moving Spaces;
- mobile/readability check;
- navigable preview URL.

## STOP

**STOP after Pass 3. Do not begin Pass 4 until Juanma explicitly approves Pass 3.**

---

# 5. PASS 4 — INSTITUTIONAL CREDIBILITY / MUSEUM FIXTURES SCULPT

> **DO NOT START UNTIL PASS 3 IS EXPLICITLY APPROVED.**

## Goal

Increase institutional credibility, function and human scale without prop spam.

Candidate elements:

- bench / chair / resting point;
- restrained institutional/safety signage;
- `NO TOCAR`, `NO FOTOS`, `NO GRABAR` where contextually justified;
- extinguisher / alarm / safety detail;
- security/reception desk or guard post where useful;
- WC / accessibility / exit wayfinding where useful;
- window / controlled natural daylight;
- functional room light switch.

A fixture is not added merely because real museums contain it. It must materially support one or more of:

```text
SCALE
WAYFINDING
FUNCTION
STORY
INSTITUTIONAL CREDIBILITY
INTERACTION
SPATIAL COMPOSITION
```

Where interaction adds value, reuse semantic Actions, e.g.:

```text
LIGHT SWITCH
→ HOTSPOT
→ SET_STATE
→ LIGHTING STATE
```

## Required checkpoint

- overview BEFORE / AFTER;
- purpose of every added fixture;
- list of rejected candidate props and why;
- Unslop check against generic prop dressing;
- performance delta if material;
- navigable preview URL.

## STOP

**STOP after Pass 4. Do not begin Pass 5 until Juanma explicitly approves Pass 4.**

---

# 6. PASS 5 — AUTHORING / PERSONALIZATION PANEL

> **DO NOT START UNTIL PASS 4 IS EXPLICITLY APPROVED.**

## Goal

Turn already-proven capabilities into a clearer product-facing authoring/personalization surface.

The panel remains deliberately deferred until the underlying experience grammar is approved.

Progressively expose authored configuration for capabilities such as:

- World / institution identity;
- Space;
- Experience Language;
- text;
- image;
- video;
- audio;
- artwork / sculpture / content;
- guide presence/profile;
- Experience Points / Anchors;
- guided stops;
- narration;
- Focus behaviour;
- Portal representation/transition intent;
- Route;
- sound / ambience;
- preview / publish.

Minimum product proof must make **text, image and video personalization** tangible and usable while preserving `Author Mode ≠ Experience Mode`.

Do not create duplicate semantic state inside UI components.

## Required checkpoint

- navigable Author preview;
- edit text → visitor result;
- replace image → visitor result;
- configure video → visitor result;
- validation/error behaviour;
- BEFORE / AFTER visitor preview;
- Author + Experience URLs.

## STOP

**STOP after Pass 5. Do not begin Pass 6 until Juanma explicitly approves Pass 5.**

---

# 7. PASS 6 — GUIDED RECORDING / OUTPUT PROOF

> **DO NOT START UNTIL PASS 5 IS EXPLICITLY APPROVED.**

## Status

Desired product capability, but not yet a completed Museum V1 contract.

Before implementation, classify/update scope if necessary.

## Goal

Explore the smallest useful proof that an authored Guided Experience can also become a reusable recorded/presentation output without contaminating World State or duplicating Experience Director.

```text
IMMERSIVE EXPERIENCE
+
GUIDED TOUR
+
RECORD / OUTPUT
```

Study Casebook presentation/recording lessons where useful, but do not make Museum depend on Boards/Casebook or modify those protected baselines.

## STOP

**STOP after Pass 6 for Product Owner review. No merge/integration is implied.**

---

# 8. CROSS-CUTTING PRODUCT REQUIREMENTS

These are not permission to skip pass gates.

## Guide presence

Current preferred hypothesis:

```text
EXPLORE
→ MEANINGFUL GUIDE MOMENT
→ ACCOMPANIED
→ HANDOFF
→ VISITOR ALONE
→ EXPLORE
```

Do not assume permanent guide presence is better.

## Experience Points / floor marks

Semantic point ≠ visible circle.

Reuse Anchor / Viewpoint / Hotspot / Action / Guided contracts.

Possible authored purposes:

1. guided stop;
2. listening point;
3. suggested focus;
4. soft reposition / authored viewpoint;
5. narration activation;
6. state change.

Representation may be visible, subtle, Experience-Language-specific or hidden.

## Onboarding credit

Keep the approved pending presentation requirement:

`IDEA BY RUBIK SOTA 629554870`

Treat it as restrained conceptual credit, not dominant branding.

## Quality gates

Gauntlet, Unslop, accessibility and performance are applied when relevant and before declaring a material pass approved.

---

# 9. NO MERGE / NO GLOBAL INTEGRATION

This roadmap authorizes isolated pass work only after each preceding approval.

It does **not** authorize:

- merge to `master`;
- global navigation;
- Boards changes;
- Casebook changes;
- broad shared refactors;
- automatic progression through passes.

Every pass ends with:

```text
IMPLEMENT
→ RUN
→ SAVE EVIDENCE
→ GIVE JUANMA THE LINK
→ STOP
→ HUMAN REVIEW
```
