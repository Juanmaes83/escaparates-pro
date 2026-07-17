# Luxury Beauty Product PRO

`luxury-beauty-product-pro` is now centered on `ELORIA Signature`, a source-aware Custom PRO fragrance experience derived from the ELORIA demo.

## Identity

- Template ID: `luxury-beauty-product-pro`
- Primary preset: `eloria-signature`
- Hidden legacy alias: `plum-signature`
- Builder: `js/sector-blueprints/luxury-beauty-product-pro.js`
- Source reference: `https://juanmaes83.github.io/ELORIA-New-Luxury-Fragrance/`
- Local assets: `assets/templates/luxury-beauty/eloria/`

## Star Product Journey Engine

The exported page renders a single DOM node, `#eloriaStarProduct`, for the bottle. Sections do not duplicate the product image.

Each scene declares a `data-product-anchor` with:

- scene id
- x/y viewport target
- scale
- rotation
- opacity
- z-index
- transform origin

The Journey Engine measures visible anchors, interpolates between current and next anchors on scroll, recalculates on resize/orientation changes, schedules updates with `requestAnimationFrame`, and cancels pending work on `pagehide`.

Scenes:

- hero
- ingredients
- collection
- ritual
- story
- final CTA
- footer

## Studio Controls

ELORIA exposes real controls for:

- `collectionProducts` repeater, with `collectionProduct1..6` media slots
- `ingredients`
- `ritualSteps`
- `brandFacts`
- journey enable/intensity/smoothing/duration/easing/reduced motion
- per-scene product x/y/scale/rotation controls
- show/hide toggles for collection, ritual, story and final CTA
- language repeaters for Spanish and English labels

`languageContent` remains an advanced object escape hatch for extra translated labels.

## Media Policy

ELORIA Signature uses local demo assets and does not depend on `cdn.jiro.build`:

- `Hero Image.png`
- `Perfume Bottle.png`
- `Top Cloud.png`
- `Icon 1.png` ... `Icon 5.png`

Deleting custom media restores these local originals through media slot fallbacks.

## QA

Relevant checks:

- `node tests/interface-utf8.spec.mjs`
- `node tests/product-studio-module.spec.mjs`
- `node tests/studio-template-contract.spec.mjs`
- `node tests/luxury-beauty-product-pro.spec.mjs`
- `npx playwright test --config=tests/phase1-playwright.config.mjs`

The Playwright suite includes a Journey test sampling `#eloriaStarProduct` at 0, 15, 30, 45, 60, 75, 90 and 100 percent scroll.

## Rollback

Revert the Luxury Beauty builder, local ELORIA assets, related tests, workflow additions, and script references from `studio.html` and `index.html`.
