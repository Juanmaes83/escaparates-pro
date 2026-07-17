import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

function load(path, context) {
  vm.runInContext(fs.readFileSync(path, 'utf8'), context, { filename: path });
}

function loadFashion() {
  const context = vm.createContext({
    window: {},
    console,
    URL,
    URLSearchParams,
    setTimeout,
    clearTimeout,
    requestAnimationFrame: () => 0,
    cancelAnimationFrame: () => undefined,
    matchMedia: () => ({ matches: false })
  });
  context.window = context;
  context.EP = {};

  load('js/studio/template-registry.js', context);
  load('js/sector-blueprints.js', context);
  load('js/sector-blueprints/fashion-commerce-pro.js', context);

  return context;
}

const context = loadFashion();
const registry = context.EP.StudioTemplateRegistry;
const definition = registry.get('fashion-commerce-pro');
const builder = context.EP.SectorBlueprints.get('fashion-commerce-pro');

assert.equal(definition.id, 'fashion-commerce-pro');
assert.equal(definition.familyId, 'fashion-commerce');
assert.equal(definition.templateKind, 'blueprint');
assert.equal(definition.templateType, 'custom-pro');
assert.equal(definition.category, 'Sector Blueprints');
assert.equal(definition.sector, 'Fashion & Apparel');
assert.equal(definition.status, 'beta');
assert.deepEqual(definition.tags.includes('source-faithful'), false);
assert.equal(definition.builder.id, 'fashion-commerce-pro');
assert.equal(builder.name, 'Fashion Commerce - Custom PRO');
assert.equal(definition.presets.some((preset) => preset.id === 'rubik-sota-disruption' && preset.label === 'RUBIK SOTA — DISRUPCIÓN'), true);

const schema = context.EP.SectorBlueprints.getSchema('fashion-commerce-pro');
assert.ok(schema.length >= 40, 'builder schema must expose the first functional block controls');
assert.equal(schema.find((field) => field.key === 'heroCtaLabel').type, 'text', 'CTA label must be text');
assert.equal(schema.find((field) => field.key === 'heroCtaUrl').type, 'url', 'CTA URL must be url');
assert.equal(schema.find((field) => field.key === 'products').type, 'repeater', 'products must be a repeater');
assert.equal(schema.find((field) => field.key === 'products').minItems, 4);
assert.equal(schema.find((field) => field.key === 'products').maxItems, 10);
assert.equal(schema.find((field) => field.key === 'headlineTypography').type, 'typography');
assert.equal(schema.find((field) => field.key === 'bodyTypography').type, 'typography');
assert.equal(schema.find((field) => field.key === 'responsiveHero').type, 'responsive');
assert.equal(schema.find((field) => field.key === 'motionProfile').type, 'motion');

const mediaSlots = definition.mediaSlots.map((slot) => slot.id);
for (const required of [
  'heroVideo',
  'heroPoster',
  'product1Primary',
  'product2Primary',
  'product3Primary',
  'product4Primary',
  'product5Primary',
  'product6Primary',
  'product7Primary',
  'product8Primary',
  'product9Primary',
  'product10Primary',
  'campaignVideo1',
  'campaignVideo4',
  'logo'
]) {
  assert.ok(mediaSlots.includes(required), `${required} media slot missing`);
}

for (const slot of definition.mediaSlots.filter((item) => /Video/.test(item.id) || item.id === 'heroVideo')) {
  assert.equal(slot.usageStatus, 'approved-by-owner', `${slot.id} must be approved-by-owner`);
}

assert.equal(definition.defaults.products.length, 10);
assert.deepEqual(Array.from(definition.defaults.products, (product) => product.id), [
  'jacket-industrial',
  'pantalon-cargo',
  'camiseta-oversized',
  'sudadera',
  'abrigo-largo',
  'jeans-rotos',
  'chaleco-tecnico',
  'camisa-blanca',
  'parka-urbana',
  'bermuda-cargo'
]);

const html = context.EP.SectorBlueprints.build('fashion-commerce-pro', [], definition.defaults);
const embeddedScripts = Array.from(html.matchAll(/<script(?:[^>]*)>([\s\S]*?)<\/script>/g), match => match[1]);
assert.ok(embeddedScripts.length >= 2, 'exported HTML must include data and runtime scripts');
assert.doesNotThrow(() => new vm.Script(embeddedScripts.at(-1)), 'embedded runtime script must be valid JavaScript');
assert.match(html, /data-template="fashion-commerce-pro"/);
assert.match(html, /RUBIK SOTA/);
assert.match(html, /DISRUPCIÓN/);
assert.match(html, /class="rs-teaser"/);
assert.match(html, /class="rs-preloader"/);
assert.match(html, /class="rs-hero-video"/);
assert.match(html, /MODO PASARELA/);
assert.match(html, /rs-track/);
assert.match(html, /CHAQUETA INDUSTRIAL/);
assert.match(html, /PANTALÓN CARGO/);
assert.match(html, /PARKA URBANA/);
assert.match(html, /BERMUDA CARGO/);
assert.match(html, /hf_20260403_050628/);
assert.match(html, /data-state="boot"/);
assert.match(html, /state\(['"]teaser['"]\)/);
assert.match(html, /state\(['"]preloader['"]\)/);
assert.match(html, /state\(['"]ready['"]\)/);
assert.match(html, /state\(['"]skipped['"]\)/);
assert.match(html, /id="rsMenu"/);
assert.match(html, /id="rsNavPanel"/);
assert.match(html, /data-i18n="heroCtaLabel"/);
assert.match(html, /ep:fashion-commerce:language/);
assert.match(html, /data-hero-mobile-min="86"/);
assert.match(html, /class="rs-grain"/);
assert.match(html, /class="rs-scanner"/);
assert.match(html, /class="rs-film-burn"/);
assert.match(html, /id="rsCursor"/);
assert.match(html, /id="rsAudio"/);
assert.match(html, /id="rsWishlistOpen"/);
assert.match(html, /id="rsCartOpen"/);
assert.match(html, /id="rsWishlistCount"/);
assert.match(html, /id="rsCartCount"/);
assert.match(html, /id="rsCommercePanel"/);
assert.match(html, /id="rsTrackPrev"/);
assert.match(html, /id="rsTrackNext"/);
assert.match(html, /id="rsRunwayProgress"/);
assert.match(html, /tabindex="0"/);
assert.match(html, /scroll-snap-type:x mandatory/);
assert.match(html, /rsGlitch/);
assert.match(html, /pointermove/);
assert.match(html, /pointerdown/);
assert.match(html, /ArrowRight/);
assert.match(html, /setPointerCapture/);
assert.match(html, /runway-on/);
assert.match(html, /--runway-progress/);
assert.match(html, /ep:fashion-commerce:/, 'commerce storage must be scoped by template/preset');
assert.match(html, /cartKey=storageScope\+"cart"/);
assert.match(html, /wishlistKey=storageScope\+"wishlist"/);
assert.match(html, /data-cart-inc/);
assert.match(html, /data-remove-cart/);
assert.match(html, /data-remove-wishlist/);
assert.match(html, /setupMagnet/);
assert.match(html, /removeEventListener\(['"]pointermove['"],moveCursor\)/);
assert.doesNotMatch(html, /randomuser\.me/);
assert.doesNotMatch(html, /ReactDOM|Babel|tailwind/i);

const embeddedData = JSON.parse((html.match(/<script type="application\/json" id="rsData">([\s\S]*?)<\/script>/) || [])[1]);
assert.ok(Object.keys(embeddedData.i18n.es).length >= 20, 'Spanish dictionary must cover interface text');
assert.ok(Object.keys(embeddedData.i18n.en).length >= 20, 'English dictionary must cover interface text');
assert.equal(embeddedData.i18n.en.heroTitle, 'DISRUPTION');
assert.equal(embeddedData.i18n.en.navGallery, 'GALLERY');

const customized = context.EP.SectorBlueprints.build('fashion-commerce-pro', [], {
  heroTitle: 'COLECCIÓN',
  heroCtaLabel: 'Solicitar visita',
  heroCtaUrl: '#section1',
  season: 'VERANO QA',
  language: 'en',
  headlineTypography: { family: 'Inter', weight: '900', size: 88 },
  bodyTypography: { family: 'Arial', weight: '700', size: 18 },
  responsiveHero: {
    desktop: { minHeight: 98, contentAlign: 'center', titleScale: 0.9, videoPosition: '50% 40%', overlayStrength: 70 },
    tablet: { minHeight: 90, contentAlign: 'center', titleScale: 0.74, videoPosition: 'center center', overlayStrength: 80 },
    mobile: { minHeight: 82, contentAlign: 'end', titleScale: 0.52, videoPosition: '50% 30%', overlayStrength: 92, navigationMode: 'overlay' }
  },
  motionProfile: { intensity: 20, duration: 1200, reducedMotion: true },
  products: [
    { id: 'qa', name: 'PIEZA QA', category: 'QA', eyebrow: 'TEST', description: 'Editable', price: 12.5, ctaLabel: 'Descubrir producto' }
  ]
});
assert.match(customized, /COLECCIÓN/);
assert.match(customized, /Solicitar visita/);
assert.match(customized, /Descubrir producto/);
assert.match(customized, /VERANO QA/);
assert.match(customized, /lang="en"/);
assert.match(customized, /data-hero-mobile-min="82"/);
assert.match(customized, /data-mobile-navigation="overlay"/);
assert.match(customized, /--hero-min:98vh/);
assert.match(customized, /--hero-title-scale:0\.9/);
assert.match(customized, /--headline-family:"Inter"/);
assert.match(customized, /--headline-size:88px/);
assert.match(customized, /--body-family:"Arial"/);
assert.match(customized, /--dur:1200ms/);
assert.match(customized, /motion-reduced/);
assert.match(customized, /PIEZA QA/);
assert.match(customized, /12,50/);

const uploaded = [
  { slot: 'campaignVideo1', type: 'video', url: 'https://cdn.test/campaign-1.mp4' },
  { slot: 'product2Primary', type: 'image', url: 'https://cdn.test/product-2.png' },
  { slot: 'heroVideo', type: 'video', url: 'https://cdn.test/hero.webm' },
  { slot: 'product1Primary', type: 'image', url: 'https://cdn.test/product-1.png' },
  { slot: 'heroPoster', type: 'image', url: 'https://cdn.test/poster.png' },
  { slot: 'product10Primary', type: 'image', url: 'https://cdn.test/product-10.png' }
];
const isolated = context.EP.SectorBlueprints.build('fashion-commerce-pro', uploaded, definition.defaults);
assert.match(isolated, /https:\/\/cdn\.test\/hero\.webm/, 'heroVideo must use exact hero slot');
assert.match(isolated, /https:\/\/cdn\.test\/poster\.png/, 'hero poster must use exact poster slot');
assert.match(isolated, /https:\/\/cdn\.test\/product-1\.png/, 'product 1 must use exact product slot');
assert.match(isolated, /https:\/\/cdn\.test\/product-2\.png/, 'product 2 must use exact product slot');
assert.match(isolated, /https:\/\/cdn\.test\/product-10\.png/, 'product 10 must use exact product slot');
assert.match(isolated, /https:\/\/cdn\.test\/campaign-1\.mp4/, 'campaign video must use exact campaign slot');

const productOneCard = isolated.match(/data-product-index="0"[\s\S]*?<\/article>/)?.[0] || '';
const productTwoCard = isolated.match(/data-product-index="1"[\s\S]*?<\/article>/)?.[0] || '';
assert.match(productOneCard, /product-1\.png/);
assert.doesNotMatch(productOneCard, /product-2\.png|hero\.webm|campaign-1\.mp4/);
assert.match(productTwoCard, /product-2\.png/);
assert.doesNotMatch(productTwoCard, /product-1\.png|hero\.webm|campaign-1\.mp4/);

const changedOrder = context.EP.SectorBlueprints.build('fashion-commerce-pro', [...uploaded].reverse(), definition.defaults);
assert.match(changedOrder.match(/data-product-index="0"[\s\S]*?<\/article>/)?.[0] || '', /product-1\.png/);
assert.match(changedOrder.match(/data-product-index="1"[\s\S]*?<\/article>/)?.[0] || '', /product-2\.png/);

const removedProductTwo = context.EP.SectorBlueprints.build('fashion-commerce-pro', uploaded.filter((item) => item.slot !== 'product2Primary'), definition.defaults);
assert.doesNotMatch(removedProductTwo.match(/data-product-index="1"[\s\S]*?<\/article>/)?.[0] || '', /product-1\.png|product-10\.png|hero\.webm|campaign-1\.mp4/);
assert.match(removedProductTwo.match(/data-product-index="1"[\s\S]*?<\/article>/)?.[0] || '', /1556906781-9a412961c28c/);

const source = fs.readFileSync('js/sector-blueprints/fashion-commerce-pro.js', 'utf8');
assert.doesNotMatch(source, /media\s*\[[^\]]+\]/, 'media resolution must not fall back by upload order');

const manifest = JSON.parse(fs.readFileSync('assets/templates/fashion-commerce/rubik-sota/asset-manifest.json', 'utf8'));
assert.equal(manifest.templateId, 'fashion-commerce-pro');
assert.equal(manifest.presetId, 'rubik-sota-disruption');
assert.equal(manifest.assets.some((asset) => asset.usageStatus === 'approved-by-owner'), true);
assert.equal(manifest.assets.some((asset) => asset.usageStatus === 'replacement-authorized'), true);

assert.match(fs.readFileSync('studio.html', 'utf8'), /fashion-commerce-pro\.js/, 'Studio must load the builder');
assert.match(fs.readFileSync('index.html', 'utf8'), /fashion-commerce-pro\.js/, 'catalog must load the builder');
assert.match(fs.readFileSync('js/projects/product-integration.js', 'utf8'), /fashion-commerce-pro/, 'catalog Studio links must include Fashion Commerce');

const mojibakePattern = new RegExp('[\\u00c3\\u00c2]|\\u00e2\\u20ac|\\u00e2\\u0153');
for (const file of [
  'js/sector-blueprints/fashion-commerce-pro.js',
  'tests/fashion-commerce-pro.spec.mjs',
  'docs/fashion-commerce-asset-manifest.md',
  'assets/templates/fashion-commerce/rubik-sota/asset-manifest.json'
]) {
  const text = fs.readFileSync(file, 'utf8');
  assert.doesNotMatch(text, mojibakePattern, `${file} contains mojibake`);
}

console.log('Fashion Commerce PRO contract OK');
