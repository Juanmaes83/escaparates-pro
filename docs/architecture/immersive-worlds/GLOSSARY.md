# IW-0 — Glossary

> **Status:** PROPOSED — REQUIRES JUANMA REVIEW.  
> This glossary exists to prevent different agents from using the same word for different concepts.

---

## Author Mode

Editing/configuration mode. The user/author controls setup, placement and experience definition. Author Mode is not the published visitor experience.

## Authoring Layer

The product surface that edits semantic World data. In V1 it is intentionally thin.

**MUST V1:** World, Space, Content, Hotspot, Portal, Route editing sufficient to prove the engine.  
**SHOULD LATER:** richer inspector, timeline, asset browser, advanced drag/drop.  
**R&D:** Unity-like universal spatial editor.

## Baseline, Protected

A validated/approved existing version or module that must not be modified, removed or refactored without explicit informed authorization.

Protected does not mean impossible to fix forever.

## Chapter

Narrative grouping used by Guided Experience. A Chapter may reference one or more Spaces. It is not necessarily identical to a Space.

## Content Entity

An Entity whose main role is to present content, such as Artwork, Image, Sculpture, Video, Audio, Text, Document or 3D Object.

## Cue

A timed or event-triggered instruction used by Experience Director, e.g. narration, audio, UI, transition or action cue.

## Device Tier

Runtime quality/performance class such as LOW / MEDIUM / HIGH. It controls actual expensive features, not just a label.

## Directed Camera

Camera under Experience Director control for a guided story step or transition.

## Entity

Any identifiable semantic object in a World. Entity identity is independent from its Three.js object or Scene Kit representation.

## Experience Director

Orchestration subsystem for Guided Experience. It coordinates Story Steps, camera intents, Space transitions and cues through contracts.

It does not own World, renderer, navigation or audio internals.

## Experience Mode

Published/visitor-facing mode. The world is the protagonist; editing controls are absent or minimal.

## Explore Mode

Visitor-controlled navigation/discovery over World State.

## Focus

Temporary inspection state for an Entity. It may change camera authority and presentation while guaranteeing a defined return path.

## Focus Camera

Camera behavior that frames a semantic subject for inspection using target position/orientation/bounds/intent rather than relying on a single universal hard-coded distance.

## Gauntlet Loop

Adversarial quality iteration method:

```text
NAMED REFERENCE
→ BUILD
→ SEPARATE CRITIC
→ COMPARE
→ ITERATE IF OURS LOSES
→ HUMAN REVIEW
```

## Guided Experience

Author-directed traversal/story over the same World State used by Explore Mode.

## Hotspot

Semantic interaction attached to an Entity, region or spatial position. A Hotspot does not imply a visible floating icon.

## Interaction Volume

Spatial region used to detect availability/proximity/activation for a Hotspot or other interaction.

## Immersive Worlds

First-level Escaparates Pro product family for building, exploring, connecting, directing, narrating and publishing interactive spatial worlds.

Not a Board and not Casebook V5.

## IW-0

Architecture/governance phase. Produces proposed Constitution, Reference Ledger, Decision Log and Glossary. No runtime implementation is authorized merely by producing IW-0.

## MUST V1

Capability required to prove Museum / Institutional V1 and the reusable engine thesis.

## Navigation Profile

A defined method of visitor camera/movement control, e.g. first-person, orbit, teleport or avatar-based navigation.

## Portal

Semantic transition/connection from one Space or state to another. A Portal may be represented visually as a door, screen, artwork, cut, teleport, image dive or other Scene Kit-specific realization.

## Quality Bar

Named external or internal reference used for direct comparison of a particular subsystem. A quality bar is not permission to copy code/assets.

## R&D

Exploratory future work that must not expand the V1 critical path without an explicit promotion decision.

## Reference Ledger

Document assigning primary/secondary references to specific subsystem problems and recording extract/adapt/do-not-copy/license/reuse constraints.

## Representation

Scene Kit-specific visual/spatial realization of a semantic Entity, Space, Portal or interaction.

## Route

Authored path through Spaces and/or Entities. A Route is not the same as the full World Graph.

## Scene Kit

Adapter/system that maps generic semantic World data into a vertical-specific visual and spatial language.

A Scene Kit may own representation, materials, lighting profiles, environment treatment and placement helpers, but not generic World State or global route semantics.

## SHOULD LATER

Important capability intentionally deferred until the Museum V1 proof is stable.

## Shot

Camera instruction defined by semantic target and framing intent, e.g. ENTRY, OVERVIEW, FOCUS, DETAIL, PORTAL, EXIT.

## Space

Loadable spatial context within a World: Lobby, Gallery, Archive, Showroom, Room, Exterior, etc.

## Space Lifecycle

Proposed runtime state sequence:

```text
UNLOADED
→ PRELOADING
→ WARMING
→ READY
→ ACTIVE
→ COOLING
→ DISPOSED
```

Exact cache policy is not defined by the glossary.

## Story Step

Unit of Guided Experience combining subject, shot intent, completion/duration, optional cues and transition/next-step information.

## Thin Authoring Layer

Minimum V1 editing surface needed to prove semantic authoring and runtime. Explicitly not a complete universal scene editor.

## Unslop

Visual anti-pattern quality layer used to reject generic AI/WebGL clichés. It identifies what to avoid and does not impose a single replacement art style.

## World

Top-level semantic container for Spaces, Entities, Portals, Routes, Chapters, experience settings and graph relationships.

## World Graph

Semantic graph describing Spaces and their connections. It is data, not merely the visual World Map.

## World Map

Visual/interactive representation of World Graph for understanding/navigating the world. It is distinct from a Guided Route.

## World State

Authoritative runtime semantic state of the World. It must remain independent from camera ownership and from any single Scene Kit representation.
