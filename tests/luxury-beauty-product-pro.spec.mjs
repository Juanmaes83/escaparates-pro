import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

function load(path, context) {
  vm.runInContext(fs.readFileSync(path, 'utf8'), context, { filename: path });
}

const context = vm.createContext({ window: {}, console, URL, URLSearchParams, setTimeout, clearTimeout });
context.window = context;
context.EP = {};

load('js/studio/template-registry.js', context);
load('js/scroll-sections.js', context);
load('js/scroll-sections/real-estate-storytelling-custom-pro.js', context);
load('js/scroll-sections/product-storytelling-custom-pro.js', context);
load('js/sector-blueprints.js', context);
load('js/sector-blueprints/luxury-real-estate-custom-pro.js', context);
load('js/sector-blueprints/luxury-beauty-product-pro.js', context);

const registry = context.EP.StudioTemplateRegistry;
const definition = registry.get('luxury-beauty-product-pro');
assert.ok(definition, 'Luxury Beauty Product PRO must be registered');
assert.equal(definition.id, 'luxury-beauty-product-pro');
assert.equal(definition.familyId, 'luxury-beauty-product');
assert.equal(definition.templateKind, 'blueprint');
assert.equal(definition.templateType, 'custom-pro');
assert.equal(definition.category, 'Sector Blueprints');
assert.equal(definition.sector, 'Beauty & Fragrance');
assert.equal(definition.status, 'production');
assert.equal(definition.builder.id, 'luxury-beauty-product-pro');
assert.equal(context.EP.SectorBlueprints.get('luxury-beauty-product-pro').name, 'Luxury Beauty Product - Custom PRO');
assert.ok(context.EP.SectorBlueprints.getSchema('luxury-beauty-product-pro').length >= 45, 'builder schema must be complete');
assert.equal(registry.builderExists(definition), true, 'builder must exist');

const requiredKeys = [
  'brand', 'productName', 'heroKicker', 'heroTitleLine1', 'heroTitleLine2',
  'heroSubtitle', 'price', 'currency', 'volume', 'footerText', 'primaryCtaLabel',
  'primaryCtaUrl', 'checkoutUrl', 'ingredientsTitle', 'ingredientsSubtitle',
  'ingredients', 'collectionProducts', 'ritualSteps', 'brandFacts',
  'storyEyebrow', 'storyTitle', 'storyText', 'modalTitle', 'modalSubtitle',
  'engravingMaxLength', 'primaryColor', 'secondaryColor', 'backgroundColor',
  'surfaceColor', 'textColor', 'mutedTextColor', 'headlineTypography',
  'bodyTypography', 'responsiveCopy', 'journeyEnabled', 'journeyIntensity',
  'journeySmoothing', 'journeyDuration', 'journeyEasing', 'journeyReducedMotion',
  'heroProductX', 'heroProductY', 'heroProductScale', 'heroProductRotation',
  'ingredientsProductX', 'ingredientsProductY', 'ingredientsProductScale',
  'ingredientsProductRotation', 'collectionProductX', 'collectionProductY',
  'collectionProductScale', 'collectionProductRotation', 'ritualProductX',
  'ritualProductY', 'ritualProductScale', 'ritualProductRotation',
  'storyProductX', 'storyProductY', 'storyProductScale', 'storyProductRotation',
  'finalProductX', 'finalProductY', 'finalProductScale', 'finalProductRotation'
];
for (const key of requiredKeys) {
  assert.ok(definition.schema.some((field) => field.key === key), `schema missing ${key}`);
  assert.notEqual(registry.getPath(definition.defaults, key), undefined, `default missing ${key}`);
}

assert.equal(definition.schema.find((field) => field.key === 'ingredients').type, 'repeater');
assert.equal(definition.schema.find((field) => field.key === 'collectionProducts').type, 'repeater');
assert.equal(definition.schema.find((field) => field.key === 'ritualSteps').type, 'repeater');
assert.equal(definition.schema.find((field) => field.key === 'brandFacts').type, 'repeater');
assert.equal(definition.schema.find((field) => field.key === 'headlineTypography').type, 'typography');
assert.equal(definition.schema.find((field) => field.key === 'responsiveCopy').type, 'responsive');
assert.equal(definition.schema.find((field) => field.key === 'journeyDuration').type, 'range');
assert.equal(definition.exportSupport.html, true);
assert.equal(definition.exportSupport.json, true);
assert.equal(definition.exportSupport.publish, true);

const slots = definition.mediaSlots.map((slot) => slot.id);
assert.equal(JSON.stringify(slots), JSON.stringify([
  'heroBackground', 'starProduct', 'topCloud', 'ingredientIcon1', 'ingredientIcon2',
  'ingredientIcon3', 'ingredientIcon4', 'ingredientIcon5', 'collectionProduct1',
  'collectionProduct2', 'collectionProduct3', 'collectionProduct4',
  'collectionProduct5', 'collectionProduct6', 'storyMedia', 'logo'
]));
assert.equal(new Set(slots).size, slots.length, 'media slots must be unique');
assert.doesNotMatch(fs.readFileSync('js/sector-blueprints/luxury-beauty-product-pro.js', 'utf8'), /EP\.Media\.getAll\(/, 'builder must not use global media');
assert.doesNotMatch(fs.readFileSync('js/sector-blueprints/luxury-beauty-product-pro.js', 'utf8'), /cdn\.jiro\.build/, 'ELORIA production assets must be local');

const presets = Object.fromEntries(definition.presets.map((preset) => [preset.id, preset]));
assert.ok(presets.default, 'default preset required for legacy contract');
assert.equal(presets.default.visible, false);
assert.equal(presets['eloria-signature'].label, 'ELORIA Signature');
assert.equal(presets['plum-signature'].visible, false);
assert.equal(presets['botanical-editorial'].label, 'Botanical Editorial');
assert.equal(definition.presets.filter((preset) => preset.visible !== false).length, 2);

const schemaKeys = new Set(definition.schema.map((field) => field.key));
const slotKeys = new Set(slots);
for (const preset of definition.presets) {
  for (const key of Object.keys(preset.defaults || {})) assert.ok(schemaKeys.has(key), `${preset.id} touches unknown field ${key}`);
  for (const key of Object.keys(preset.media || {})) assert.ok(slotKeys.has(key), `${preset.id} touches unknown slot ${key}`);
}

const beforeDefaults = JSON.stringify(definition.defaults);
const plum = registry.applyPreset(definition, 'eloria-signature', {});
const botanical = registry.applyPreset(definition, 'botanical-editorial', {});
assert.equal(plum.brand, 'ELORIA');
assert.equal(botanical.brand, 'WILD DAISY');
assert.notEqual(plum.primaryColor, botanical.primaryColor);
assert.notEqual(plum.journeyIntensity, botanical.journeyIntensity);
assert.equal(JSON.stringify(definition.defaults), beforeDefaults, 'presets must not mutate defaults');

const html = context.EP.SectorBlueprints.build('luxury-beauty-product-pro', [], plum);
assert.match(html, /data-template="luxury-beauty-product-pro"/);
assert.match(html, /id="eloriaStarProduct"/);
assert.match(html, /data-product-anchor/);
assert.match(html, /data-scene="hero"/);
assert.match(html, /data-scene="ingredients"/);
assert.match(html, /data-scene="collection"/);
assert.match(html, /data-scene="ritual"/);
assert.match(html, /data-scene="story"/);
assert.match(html, /data-scene="final"/);
assert.match(html, /Hero%20Image\.png/);
assert.match(html, /Perfume%20Bottle\.png/);
assert.match(html, /role="dialog"/);
assert.match(html, /Demo comercial/);
assert.doesNotMatch(html, /React|ReactDOM|Babel|tailwind/i);
assert.doesNotMatch(html, /cdn\.jiro\.build/i);

const studio = fs.readFileSync('studio.html', 'utf8');
assert.match(studio, /luxury-beauty-product-pro\.js/, 'Studio must load the builder');
assert.match(fs.readFileSync('js/projects/studio-route.js', 'utf8'), /query\.get\('preset'\)/, 'direct route must accept preset parameter');
assert.match(fs.readFileSync('index.html', 'utf8'), /luxury-beauty-product-pro\.js/, 'catalog must load builder');
assert.match(fs.readFileSync('js/projects/product-integration.js', 'utf8'), /StudioTemplateRegistry\.get\(explicit\)/, 'catalog Studio links must use registry ids');

for (const id of ['real-estate-storytelling-custom-pro', 'product-storytelling-custom-pro', 'luxury-real-estate-custom-pro']) {
  assert.ok(registry.get(id), `${id} must remain registered`);
}

for (const file of [
  'labs/source-experiences/real-estate-storytelling-source-faithful/index.html',
  'labs/source-experiences/product-storytelling-source-faithful/index.html',
  'labs/source-experiences/luxury-real-estate-source-faithful/index.html'
]) {
  assert.equal(fs.existsSync(file), true, `${file} missing`);
}

console.log('Luxury Beauty Product PRO contract OK');
