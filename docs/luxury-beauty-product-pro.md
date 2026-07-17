# Luxury Beauty Product PRO

Phase 1 introduces `luxury-beauty-product-pro`, a Custom PRO sector blueprint for premium beauty and fragrance storytelling.

## Identity

- Template ID: `luxury-beauty-product-pro`
- Family ID: `luxury-beauty-product`
- Builder: `js/sector-blueprints/luxury-beauty-product-pro.js`
- Template kind: `blueprint`
- Category: `Sector Blueprints`
- Sector: `Beauty & Fragrance`
- Status: `production`

## Presets

- `plum-signature`: ELORIA-inspired deep plum direction, large editorial type, atmospheric overlay, stronger packshot travel.
- `botanical-editorial`: Wild Daisy-inspired ivory, beige, gold and black direction, gentler motion, natural editorial tone.

Both presets use the same builder and only patch fields or media slots declared by the template definition.

## Media Slots

`heroMedia`, `heroPoster`, `packshot`, `decorativeOverlay`, `ingredient1`, `ingredient2`, `ingredient3`, `ingredient4`, `ingredient5`, `storyMedia`, `logo`.

Slots are isolated to this template. Removing custom media restores the builder fallback. The builder does not call `EP.Media.getAll()` and does not upload anything to R2.

## Runtime Notes

- CTA label fields are text-like `cta`; URL fields are `url`.
- Purchase mode supports `modal-demo` and `external-url`.
- The modal states clearly that no real purchase is processed.
- Packshot movement uses scroll-driven transforms with reduced-motion fallback.
- Drawer and modal close through explicit close buttons and Escape.
- The generated HTML is standalone vanilla HTML/CSS/JS. It does not load React, ReactDOM, Babel or Tailwind.

## QA Evidence

Local screenshots were generated under `artifacts/luxury-beauty/` for desktop, tablet and mobile in both presets.

Contract tests:

- `node tests/luxury-beauty-product-pro.spec.mjs`
- `node tests/studio-template-contract.spec.mjs`
- `node tests/product-studio-module.spec.mjs`

## Rollback

Revert the commits that add `js/sector-blueprints/luxury-beauty-product-pro.js`, remove the script references from `studio.html` and `index.html`, and remove the catalog entry plus tests/workflow additions.
