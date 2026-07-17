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
  clearTimeout
});
context.window = context;
context.EP = {};

load('js/studio/template-registry.js', context);
load('js/scroll-sections.js', context);
load('js/scroll-sections/real-estate-storytelling-custom-pro.js', context);
load('js/scroll-sections/product-storytelling-custom-pro.js', context);
load('js/sector-blueprints.js', context);
load('js/sector-blueprints/luxury-real-estate-custom-pro.js', context);
load('js/customization/project-store-local.js', context);

const registry = context.EP.StudioTemplateRegistry;
const ids = registry.listCustomPro().map((definition) => definition.id);

assert.equal(JSON.stringify(ids), JSON.stringify([
  'real-estate-storytelling-custom-pro',
  'product-storytelling-custom-pro',
  'luxury-real-estate-custom-pro'
]));
assert.equal(new Set(ids).size, ids.length, 'template ids must be unique');
assert.equal(registry.validateRegistry().ok, true, registry.validateRegistry().errors.join('\n'));
assert.equal(JSON.stringify(registry.validateBuilders().map((item) => item.builderExists)), JSON.stringify([true, true, true]));

for (const definition of registry.listCustomPro()) {
  assert.ok(definition.defaults, `${definition.id} defaults`);
  assert.ok(definition.schema.length > 0, `${definition.id} schema`);
  assert.ok(definition.mediaSlots.length > 0, `${definition.id} media slots`);
  assert.ok(definition.presets.some((preset) => preset.id === 'default'), `${definition.id} default preset`);
  assert.equal(definition.capabilities.localEditing, true, `${definition.id} local editing`);
  assert.equal(definition.exportSupport.json, true, `${definition.id} json export`);
}

for (const definition of registry.listCustomPro()) {
  const builderSchema = definition.templateKind === 'scroll'
    ? context.EP.ScrollSections.get(definition.id).schema
    : context.EP.SectorBlueprints.getSchema(definition.id);
  const pickSchema = (schema) => schema.map((field) => ({
    key: field.key,
    type: field.type,
    label: field.label,
    default: field.default,
    required: field.required || false,
    options: field.options,
    min: field.min,
    max: field.max,
    step: field.step,
    group: field.group || 'Contenido'
  }));
  assert.equal(JSON.stringify(pickSchema(definition.schema)), JSON.stringify(pickSchema(builderSchema)), `${definition.id} schema parity`);
  assert.equal(JSON.stringify(definition.defaults), JSON.stringify(registry.defaultsFromSchema(builderSchema)), `${definition.id} defaults parity`);
}

const legacy = registry.normalizeProject({
  id: 'legacy-1',
  name: 'Legacy Project',
  templateId: 'product-storytelling-custom-pro',
  config: { brand: 'Legacy Brand' },
  media: [{ type: 'image', url: 'data:image/png;base64,x', name: 'local.png' }]
});
assert.equal(legacy.schemaVersion, registry.PROJECT_SCHEMA_VERSION);
assert.equal(legacy.projectId, 'legacy-1');
assert.equal(legacy.config.brand, 'Legacy Brand');
assert.equal(legacy.config.productName, 'AURA X');
assert.equal(legacy.media[0].slot, 'heroVideo');
assert.equal(legacy.media[0].temporary, true);

const original = context.EP.ProjectStoreLocal.normalize({
  id: 'project-a',
  projectId: 'project-a',
  name: 'Project A',
  templateId: 'product-storytelling-custom-pro',
  config: { brand: 'A' },
  media: [{ url: 'https://cdn.example.com/a.png', slot: 'heroVideo' }],
  cloudId: 'cloud-a',
  revision: 7,
  published: { url: 'https://example.com/p/a' },
  publishedAt: '2026-01-01T00:00:00.000Z'
});
const fork = context.EP.ProjectStoreLocal.fork(original);
assert.notEqual(original.id, fork.id);
assert.notEqual(original.projectId, fork.projectId);
assert.equal(fork.cloudId, null);
assert.equal(fork.revision, null);
assert.equal(fork.published, null);
assert.equal(original.cloudId, 'cloud-a');
assert.equal(original.id, 'project-a');

const unknown = registry.normalizeProject({
  id: 'unknown-1',
  templateId: 'future-template-custom-pro',
  templateVersion: 99,
  schemaVersion: 1,
  config: { unknown: { value: true } },
  media: [{ slot: 'a' }, { slot: 'b' }, { slot: 'c' }, { slot: 'd' }]
});
assert.equal(unknown.templateId, 'future-template-custom-pro');
assert.equal(unknown.templateVersion, 99);
assert.equal(unknown.config.unknown.value, true);
assert.equal(unknown.media.length, 4);
assert.equal(unknown.readOnly, true);
assert.match(unknown.unsupported.reason, /Template desconocida/);

const future = registry.normalizeProject({
  id: 'future-1',
  templateId: 'product-storytelling-custom-pro',
  schemaVersion: registry.PROJECT_SCHEMA_VERSION + 10,
  config: { brand: 'Future' },
  media: [{ slot: 'heroVideo' }, { slot: 'extra' }]
});
assert.equal(future.templateId, 'product-storytelling-custom-pro');
assert.equal(future.config.brand, 'Future');
assert.equal(future.media.length, 2);
assert.equal(future.readOnly, true);

registry.register({
  id: 'qa-hidden-contract-template',
  familyId: 'qa-hidden-contract',
  version: 1,
  title: 'QA Hidden Contract',
  shortTitle: 'QA Hidden',
  description: 'Hidden contract test template.',
  category: 'QA',
  sector: 'QA',
  templateType: 'custom-pro',
  templateKind: 'scroll',
  status: 'test',
  visible: false,
  builder: { kind: 'scroll', id: 'qa-hidden-contract-template' },
  schema: [
    { key: 'headline', type: 'text', label: 'Headline', default: 'Original' },
    { key: 'theme.colors.primary', type: 'color', label: 'Primary', default: '#111111' },
    { key: 'responsive.mobile.alignment', type: 'alignment', label: 'Mobile alignment', default: 'left' },
    { key: 'motion.intensity', type: 'motion', label: 'Motion', default: { amount: 0.2 } },
    { key: 'items', type: 'repeater', label: 'Items', default: [{ title: 'A' }] }
  ],
  mediaSlots: [{ id: 'hero', label: 'Hero', accepts: ['image/*'], fallback: '/demo-a.jpg' }],
  presets: [
    { id: 'default', label: 'Default', visible: true, defaults: {}, media: {} },
    { id: 'qa-hidden', label: 'QA hidden', visible: false, defaults: { headline: 'Preset headline', 'theme.colors.primary': '#ff00aa', 'motion.intensity': { amount: 0.8 } }, media: { hero: '/demo-b.jpg' } }
  ]
});
assert.equal(registry.listCustomPro().some((definition) => definition.id === 'qa-hidden-contract-template'), false);
const qa = registry.get('qa-hidden-contract-template');
const beforeDefaults = JSON.stringify(qa.defaults);
const preset = registry.applyPreset(qa, 'qa-hidden', {});
assert.equal(preset.headline, 'Preset headline');
assert.equal(preset.theme.colors.primary, '#ff00aa');
assert.equal(preset.motion.intensity.amount, 0.8);
assert.equal(JSON.stringify(qa.defaults), beforeDefaults, 'preset must not mutate defaults');
const nested = {};
registry.setPath(nested, 'theme.colors.primary', '#123456');
registry.setPath(nested, 'responsive.mobile.alignment', 'center');
registry.setPath(nested, 'motion.intensity', 0.6);
assert.equal(nested.theme.colors.primary, '#123456');
assert.equal(nested.responsive.mobile.alignment, 'center');
assert.equal(nested.motion.intensity, 0.6);
assert.equal(Object.prototype.hasOwnProperty.call(nested, 'theme.colors.primary'), false);

const a = registry.normalizeProject({ templateId: 'real-estate-storytelling-custom-pro', media: [{ url: 'blob:a' }] });
const b = registry.normalizeProject({ templateId: 'luxury-real-estate-custom-pro', media: [] });
assert.equal(a.media[0].slot, 'heroVideo');
assert.equal(b.media.length, 0);
assert.notEqual(a.templateId, b.templateId);

const studio = fs.readFileSync('review/phase1-studio-v2.js', 'utf8');
assert.doesNotMatch(studio, /EP\.Media\.getAll\(/, 'Studio must not read global catalog media slots');
assert.match(studio, /f\.type==='url'\?'url'/, 'URL fields must render URL inputs');
assert.match(studio, /:'text'\}if\(f\.type!==/, 'CTA labels must fall through to text inputs');
assert.match(studio, /function makeRepeater/, 'Repeater fields need usable controls');
assert.match(studio, /function makeTypography/, 'Typography fields need usable controls');
assert.match(studio, /function makeResponsive/, 'Responsive fields need usable controls');
assert.match(studio, /function makeMotion/, 'Motion fields need usable controls');
assert.doesNotMatch(fs.readFileSync('index.html', 'utf8'), /Customization Studio|PREVIEW EN DIRECTO/, 'index.html must not embed Studio UI');

for (const file of [
  'labs/source-experiences/real-estate-storytelling-source-faithful/index.html',
  'labs/source-experiences/product-storytelling-source-faithful/index.html',
  'labs/source-experiences/luxury-real-estate-source-faithful/index.html'
]) {
  assert.equal(fs.existsSync(file), true, `${file} missing`);
}

console.log('Studio template contract OK');
