import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

function load(path, context) {
  vm.runInContext(fs.readFileSync(path, 'utf8'), context, { filename: path });
}

const context = vm.createContext({
  window: {},
  console,
  URL,
  URLSearchParams,
  setTimeout,
  clearTimeout,
  requestAnimationFrame: () => 0,
  matchMedia: () => ({ matches: false })
});
context.window = context;
context.EP = {};

load('js/studio/template-registry.js', context);
load('js/sector-blueprints.js', context);
load('js/sector-blueprints/fashion-commerce-pro.js', context);

const registry = context.EP.StudioTemplateRegistry;
const definition = registry.get('fashion-commerce-pro');

assert.equal(definition.id, 'fashion-commerce-pro');
assert.equal(definition.familyId, 'fashion-commerce');
assert.equal(definition.templateKind, 'blueprint');
assert.equal(definition.templateType, 'custom-pro');
assert.equal(definition.category, 'Sector Blueprints');
assert.equal(definition.sector, 'Fashion & Apparel');
assert.equal(definition.builder.id, 'fashion-commerce-pro');
assert.equal(context.EP.SectorBlueprints.get('fashion-commerce-pro').name, 'Fashion Commerce - Custom PRO');
assert.equal(definition.presets.some((preset) => preset.id === 'rubik-sota-disruption' && preset.label === 'RUBIK SOTA — DISRUPCIÓN'), true);

const schema = context.EP.SectorBlueprints.getSchema('fashion-commerce-pro');
assert.ok(schema.length >= 40, 'builder schema must expose the first functional block controls');
assert.equal(schema.find((field) => field.key === 'heroCtaLabel').type, 'text', 'CTA label must be text');
assert.equal(schema.find((field) => field.key === 'heroCtaUrl').type, 'url', 'CTA URL must be url');
assert.equal(schema.find((field) => field.key === 'products').type, 'repeater', 'products must be a repeater');
assert.equal(schema.find((field) => field.key === 'headlineTypography').type, 'typography');
assert.equal(schema.find((field) => field.key === 'responsiveHero').type, 'responsive');
assert.equal(schema.find((field) => field.key === 'motionProfile').type, 'motion');

const mediaSlots = definition.mediaSlots.map((slot) => slot.id);
for (const required of [
  'heroVideo',
  'heroPoster',
  'product1Primary',
  'product8Primary',
  'campaignVideo1',
  'campaignVideo4'
]) {
  assert.ok(mediaSlots.includes(required), `${required} media slot missing`);
}

for (const slot of definition.mediaSlots.filter((item) => /Video/.test(item.id) || item.id === 'heroVideo')) {
  assert.equal(slot.usageStatus, 'approved-by-owner', `${slot.id} must be approved-by-owner`);
}

const html = context.EP.SectorBlueprints.build('fashion-commerce-pro', [], definition.defaults);
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
assert.match(html, /hf_20260403_050628/);
assert.doesNotMatch(html, /randomuser\.me/);
assert.doesNotMatch(html, /ReactDOM|Babel|tailwind/i);

const customized = context.EP.SectorBlueprints.build('fashion-commerce-pro', [], {
  heroTitle: 'COLECCIÓN',
  heroCtaLabel: 'Comprar drop',
  heroCtaUrl: '#section1',
  products: [
    { id: 'qa', name: 'PIEZA QA', category: 'QA', eyebrow: 'TEST', description: 'Editable', price: 12.5, ctaLabel: 'Ver QA' }
  ]
});
assert.match(customized, /COLECCIÓN/);
assert.match(customized, /Comprar drop/);
assert.match(customized, /PIEZA QA/);
assert.match(customized, /12,50/);

const manifest = JSON.parse(fs.readFileSync('assets/templates/fashion-commerce/rubik-sota/asset-manifest.json', 'utf8'));
assert.equal(manifest.templateId, 'fashion-commerce-pro');
assert.equal(manifest.presetId, 'rubik-sota-disruption');
assert.equal(manifest.assets.some((asset) => asset.usageStatus === 'approved-by-owner'), true);
assert.equal(manifest.assets.some((asset) => asset.usageStatus === 'replacement-authorized'), true);

assert.match(fs.readFileSync('studio.html', 'utf8'), /fashion-commerce-pro\.js/, 'Studio must load the builder');
assert.match(fs.readFileSync('index.html', 'utf8'), /fashion-commerce-pro\.js/, 'catalog must load the builder');
assert.match(fs.readFileSync('js/projects/product-integration.js', 'utf8'), /fashion-commerce-pro/, 'catalog Studio links must include Fashion Commerce');

for (const file of [
  'js/sector-blueprints/fashion-commerce-pro.js',
  'docs/fashion-commerce-asset-manifest.md',
  'assets/templates/fashion-commerce/rubik-sota/asset-manifest.json'
]) {
  const text = fs.readFileSync(file, 'utf8');
  assert.doesNotMatch(text, /Ã|Â|â€|âœ/, `${file} contains mojibake`);
}

console.log('Fashion Commerce PRO contract OK');
