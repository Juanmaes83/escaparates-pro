# PREMIUM EXPERIENCES VAULT — additive rescue family

## Purpose

Create one easy-to-find family inside Escaparates Pro for complete premium websites, immersive experiences, scroll journeys and important source projects that must never become hard to find again.

## Non-destructive policy

1. ADD FIRST, CLEAN LATER.
2. Never delete, move, replace or hide an existing module while building the Vault.
3. Duplicates are explicitly allowed. If a capability already lives in Blueprints, Scroll Sections, Source Labs or RUBIK SOTA, it may also appear in the Vault.
4. Preserve V1, V2, Source Faithful, Custom PRO and other meaningful evolutions when each version has distinct value.
5. Private technical engines may be registered as dependencies, but must not expose private repository URLs or source code in the public UI.
6. Any future deduplication/removal requires a separate audit and explicit approval.

## Panel quality rule

A rescued project is not considered fully integrated merely because it has a link.

Each customer-facing web/experience receives one status:

- `CONNECTED` — meaningful Escaparates Pro customization panel is wired to the experience.
- `PARTIAL` — some configuration exists but not enough to treat it as a reusable premium template.
- `PENDING` — source is preserved and visible, but a customization adapter/panel still needs to be built.
- `NATIVE AUTHORING` — source has its own authoring system; Escaparates integration may still need a side-panel bridge.
- `ENGINE` — technical dependency, not a customer-facing website/template.

A premium customization panel should normally expose, where relevant: brand/logo, typography/text, hero, section copy, CTA/URLs, color system, media slots, motion/scroll controls, products/properties/items, contact/commercial data, responsive behavior and export-safe settings.

## Vault inventory — current rescue set

| Experience / source | Existing Escaparates integration | Panel state | Preserve separately? |
|---|---|---|---|
| Breeze Museum Authoring Studio (`labs/immersive-worlds/breeze-integration-studio.html?authoring=1&world=./worlds/museum-v1.world.json`) | Immersive Worlds | NATIVE AUTHORING / bridge pending | YES |
| `Juanmaes83/ELORIA-New-Luxury-Fragrance` | `Luxury Beauty Product PRO` / ELORIA Signature | CONNECTED | YES — source + adapted template |
| `Juanmaes83/immersive-brand-landing-rubik-sota` | Source reference only | PENDING | YES |
| `Juanmaes83/immersive-brand-landing-engine-rubik-sota` | Technical dependency | ENGINE (private) | YES — dependency only |
| `Juanmaes83/AURUM_PROPERTIES_BOUTIQUE` | No complete Escaparates adapter located | PENDING | YES |
| `Juanmaes83/IMMERSPHERE-PRO-INMOBILIARIAS` | No complete Escaparates adapter located | PENDING | YES |
| `Juanmaes83/INMOBILIARIA-PREMIUM_IMMERSPHERE-` | No complete Escaparates adapter located | PENDING | YES — do not absorb into previous version |
| `Juanmaes83/Rubik-Sota-Inmobiliaria-Premium` | `Luxury Real Estate — Source Faithful PRO` + `Luxury Real Estate — Custom Blueprint PRO` | PARTIAL source-faithful / CONNECTED custom | YES — preserve all versions |
| `Juanmaes83/INMOBILIARIA-STORYTELLING-SCROOL-PREMIUM` | `Real Estate Storytelling — Source Faithful` + `Real Estate Storytelling — Custom PRO` + bidirectional story lineage | PARTIAL source-faithful / CONNECTED custom | YES — preserve all versions |
| Luxury Real Estate — Source Faithful PRO | Sector Website Blueprints | PARTIAL | YES |
| Luxury Real Estate — Custom Blueprint PRO | Sector Website Blueprints | CONNECTED | YES |
| Real Estate Storytelling — Source Faithful | Scroll Sections | PARTIAL | YES |
| Real Estate Storytelling — Custom PRO | Scroll Sections | CONNECTED | YES |
| Real Estate Bidirectional Story PRO | Premium storytelling lineage | CONNECTED/PRESERVED — verify current panel parity before any cleanup | YES |
| Product Scroll Storytelling PRO | Premium storytelling lineage | PRESERVED — verify panel depth | YES |

## Priority panel adapters to build

### P0 — protect and expose

- Make the Vault visible and easy to access inside Escaparates Pro.
- Show panel state on every card.
- Keep links/relationships to original source repositories and existing adapted modules.

### P1 — build real panel adapters

1. Rubik SOTA Immersive Brand Landing
   - brand/logo
   - headline/subheadline/CTA
   - Spline/3D scene or object source configuration when technically safe
   - scroll journey positions/scales
   - section copy
   - palette
   - media
   - motion smoothing/reduced motion

2. AURUM Properties Boutique
   - agency identity
   - hero
   - property catalogue
   - property cards/details/prices/locations
   - CTAs/contact
   - media slots
   - palette/typography
   - motion

3. IMMERSPHERE PRO Inmobiliarias
   - preserve current complete experience first
   - audit its unique immersive controls before defining shared schema
   - expose real-estate content and immersive navigation without flattening its identity

4. Inmobiliaria Premium IMMERSPHERE
   - keep as separate evolution
   - compare controls against IMMERSPHERE PRO
   - reuse only panel infrastructure, not the visual/runtime implementation

5. Breeze Museum Authoring Studio bridge
   - retain native authoring
   - add Escaparates-level quick controls/presets only where they do not duplicate or break native authoring

## Rule for future versions

If V2 is a clear improvement but V1 still has a different valuable behavior, both remain in the Vault. The card metadata must make the relationship explicit (`V1`, `V2`, `Source Faithful`, `Custom`, `Engine`, `Evolution of ...`).
