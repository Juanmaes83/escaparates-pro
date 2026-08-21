# IW-0 — Glossary

> **Status:** PROPOSED — REQUIRES JUANMA REVIEW.  
> This glossary exists to prevent different agents from using the same word for different concepts.

---

## Action

A semantic effect requested by an interaction or experience step. An Action describes **what should happen**, not an arbitrary Scene Kit callback or implementation detail.

Conceptual examples include `FOCUS_ENTITY`, `PLAY_MEDIA`, `OPEN_INFO`, `ACTIVATE_PORTAL`, `START_ROUTE`, `TRIGGER_STORY` and `SET_STATE`.

The exact V1 taxonomy and execution mechanism remain open. The invariant is that Scene Kits must not invent incompatible callback semantics for equivalent product actions.

## Anchor

A generic semantic spatial reference used to express reusable positions, orientations, surfaces, regions or destinations without scattering hard-coded absolute coordinates through subsystems.

Anchors may be referenced by content placement, Hotspots, Portals, Focus Camera, labels, lights, spawn points and other spatial relationships.

The exact technical representation of an Anchor remains open.

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

## Camera Authority / Authoritative Camera Controller

The single subsystem or mode allowed to write authoritative camera state for a frame.

Conceptual camera authority states may include `AUTHOR`, `EXPLORE`, `FOCUS`, `DIRECTED` and `TRANSITION`, but **at any frame exactly one controller is authoritative**. Ownership changes must be explicit; two subsystems must never write the authoritative camera simultaneously.

## Canonical Record

The single authoritative semantic record for one World object/entity.

Invariant:

```text
ONE SEMANTIC OBJECT
ONE CANONICAL RECORD
MULTIPLE REFERENCES
```

World, Space, Route, Scene Kit and other systems may reference the same object by stable ID, but must not maintain divergent duplicate semantic records. IW-0 does not prescribe whether implementation uses Maps, arrays, normalized stores, ECS or another storage technique.

## Chapter

Narrative grouping used by Guided Experience. A Chapter may reference one or more Spaces. It is not necessarily identical to a Space.

## Content Entity

An Entity whose main role is to present content, such as Artwork, Image, Sculpture, Video, Audio, Text, Document or 3D Object.

## Cue

A timed or event-triggered instruction used by Experience Director, e.g. narration, audio, UI, transition or Action cue.

## Device Tier

Runtime quality/performance class such as LOW / MEDIUM / HIGH. It controls actual expensive features, not just a label.

## Directed Camera

Camera under Experience Director control for a guided story step or transition.

## Entity

Any identifiable semantic object in a World. Entity identity is independent from its Three.js object or Scene Kit representation.

Each semantic Entity has one canonical record. Spaces and other structures reference that record rather than owning duplicate Entity state.

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

Camera behavior that frames a semantic subject for inspection using target position/orientation/bounds/Anchor/intent rather than relying on a single universal hard-coded distance.

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

Semantic interaction/trigger attached to an Entity, Anchor, region or spatial position. A Hotspot does not imply a visible floating icon and does not itself own spatial connectivity.

A Hotspot may request an Action such as `ACTIVATE_PORTAL`, which targets a separate Portal.

## Interaction Volume

Spatial region used to detect availability/proximity/activation for a Hotspot or other interaction.

## Immersive Worlds

First-level Escaparates Pro product family for building, exploring, connecting, directing, narrating and publishing interactive spatial worlds.

Not a Board and not Casebook V5.

## IW-0

Architecture/governance phase. Produces proposed Constitution, Reference Ledger, Decision Log and Glossary. No runtime implementation is authorized merely by producing IW-0.

## MUST V1

Capability required to prove Museum / Institutional V1 and the reusable engine thesis.

For execution planning, MUST V1 may be grouped into Foundation, Experience and Quality work without changing architecture or adding scope.

## Navigation Profile

A defined method of visitor camera/movement control, e.g. first-person, orbit, teleport or avatar-based navigation.

## Portal

Semantic spatial connection/transition from one Space or spatial state to another.

A Portal owns connectivity and semantic transition behaviour; it does **not** own the interaction trigger that activates it and does not imply a door or any other specific visual object. A Hotspot or other semantic Action may activate a Portal.

Portal transition behaviour (for example continuous transfer, cut, teleport or cinematic handoff) is distinct from its Scene Kit representation hint (for example door, screen, artwork, window or no visible representation).

## Quality Bar

Named external or internal reference used for direct comparison of a particular subsystem. A quality bar is not permission to copy code/assets.

## R&D

Exploratory future work that must not expand the V1 critical path without an explicit promotion decision.

## Reference Ledger

Document assigning primary/secondary references to specific subsystem problems and recording extract/adapt/do-not-copy/license/reuse constraints.

Conflict hierarchy:

```text
APPROVED IW CONTRACT
→ PRIMARY REFERENCE
→ SECONDARY REFERENCES
```

A reference never silently overrides an approved IW contract. Important Ledger entries should state how conflicts are resolved when sources disagree.

## Representation

Scene Kit-owned visual/spatial realization of a semantic Entity, Space, Portal or interaction.

Semantic data may carry a presentation intent, representation hint or reference where useful, but that does **not** transfer ownership of meshes, materials, shaders, Three.js objects or Scene Kit implementation into the Entity/World record.

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

A Space references the canonical semantic records located/active in that spatial context; it does not own duplicate Entity records.

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

## Transition Behaviour

Semantic Portal/experience behaviour describing **how spatial state changes** independently from visual realization. Conceptual modes may include continuous transfer, cut, teleport or cinematic handoff. Exact enums remain open.

## Transition Representation Hint

Optional Scene Kit-facing presentation intent for how a transition may be represented visually, such as door, screen, artwork, window or none. It is not the Portal's semantic identity and does not define connectivity.

## Unslop

Visual anti-pattern quality layer used to reject generic AI/WebGL clichés. It identifies what to avoid and does not impose a single replacement art style.

## World

Top-level semantic container for Spaces, Entities, Portals, Routes, Chapters, experience settings and graph relationships.

The World may expose registries/references conceptually, but each semantic object has one canonical record.

## World Graph

Semantic graph describing Spaces and their connections. It is data, not merely the visual World Map.

## World Map

Visual/interactive representation of World Graph for understanding/navigating the world. It is distinct from a Guided Route.

## World State

Authoritative runtime semantic state of the World. It must remain independent from camera ownership and from any single Scene Kit representation.

World State must not duplicate the same semantic object into competing authoritative records across World, Space or subsystem state.
