# Museum crossing — cinematic fidelity against the canonical source

**Verdict: NOT PASS.** Essential source beats are absent. This document is
evidence for a decision, not a decision. **PRODUCT APPROVAL: PENDING.**

Scope: `portal.lobby-gallery-a`, guided beat `step.02-paso-galeria-a`,
`portalVariant: 'D'` (IW_ENGINE), pace NATURAL, reduced motion off.

## How this was measured

The crossing only exists on one path. `runtime.traversePortal` flies a crossing
when the caller supplies a `crossing` intent, and the only producer of that
intent in the engine is the Director, at a guided beat whose `shotIntent` is
`PORTAL`. A bare `traversePortal` is the cut path by design. Every reading below
comes from playing the route to that beat.

Two instruments were replaced before any of it could be trusted — see
DECISION_LOG L-17 through L-20. The environment renders the Museum at roughly
two frames per second and about six times slower again past the threshold, so an
authored 5000 ms crossing is drawn about ten times end to end. The beats here
were therefore captured by scrubbing: `_duration` set enormous and progress
written directly, which changes tempo and nothing else — path, gate, split `s`,
aperture window and recoil are all solved before a duration is consulted.

## What the Museum does perform

| | |
|---|---|
| plan | `s=0.8`, `gate=[0,1.62,-4.5]`, `via=[0,1.62,-2.66]`, `recoil=0.62`, `durationMs=5000` |
| portal surface | visible across approach and exit |
| `effectIntensity` | 1 → 0 on Power4.easeIn — the distortion *resolves* as the opening is reached, as the donor does |
| plane crossing | k ≈ 0.75, room handoff on that frame |
| reverse-facing exit | fires — at k=0.83 the camera stands 0.78 m past the gate with its target pulled back onto it |

Beats 01–07 answer the source's beats 01–07.

## Defect 1 — the reverse of the threshold renders near-black

Source beat 08 is the signature of the whole transition: you land in World B
**facing the portal, and the portal shows World A through it**, large because
you are still close to it.

The Museum reaches that pose and renders almost nothing. Mean luminance of the
twelve captured beats, measured on the PNGs:

| beat | 01 | 02 | 03 | 04 | 05 | 06 | 07 | **08** | 09 | 10 | 11 | 12 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| YAVG | 181 | 182 | 186 | 187 | 182 | 175 | 176 | **36** | 178 | 178 | 178 | 149 |

A five-fold drop, isolated to the single frame in which the camera faces back at
the opening.

One contributing cause is confirmed in source. `PortalSurface.renderDestination`
(`scene-kits/museum/portal-surface.js:237`) unconditionally hides the origin
group and renders the destination group into the portal texture. It has no
notion of which side of the plane the visitor is on, so once the threshold is
crossed the doorway cannot show the room just left — which is precisely what the
source shows. The donor swaps the rendered world at the crossing; variant D
never does.

Whether that alone accounts for the black frame, or whether the gallery-side
face of the threshold wall is also unlit, is **not established** and needs a
targeted look.

## Defect 2 — beats 09 to 11 are absent

The source spends three of its twelve beats on the reverse portal shrinking
while the destination reveals around it. Recoil, reveal and spatial continuity
are one move there.

Measured in the Museum, the camera faces the threshold for **k 0.83 → 0.86: 3.0%
of the crossing, about 150 ms at the authored tempo.** Beats 09, 10 and 11 all
read `facing = -1` — already turned into Gallery A.

The choreography is not at fault; the room it has to play in is. The exit leg is
**1.4 m of an 8.8 m move**, because the authored PORTAL destination for
`space.gallery-a` stands just past the doorway. Note the `s` clamp is not the
constraint: true `s` is 7.7 / 9.1 = 0.85, clamped to 0.8, which *lengthens* the
exit slightly.

## What this means for the frozen contract

> Transitions may change HOW the camera travels, never WHERE an approved beat
> ends.

Lengthening the recession means moving where beat `step.02-paso-galeria-a`
comes to rest. That is an authoring decision about a frozen endpoint and is
**not** the transition layer's to take. The three candidate directions, for
Juanma:

1. **Move the authored PORTAL destination deeper into Gallery A.** Restores the
   source's proportions. Changes an approved endpoint — his call alone.
2. **Swap the portal's rendered world at the plane** (Defect 1). Does not touch
   the endpoint or the path. Addresses the black frame but not the 150 ms.
3. **Raise `recoil` past 0.62.** Buys a longer look-back within the existing
   1.4 m, at the cost of arriving more abruptly. Cheapest, weakest.

Transition work stops here, as mandated, with the evidence produced and the
decision left where it belongs.
