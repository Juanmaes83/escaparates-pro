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

const a = registry.normalizeProject({ templateId: 'real-estate-storytelling-custom-pro', media: [{ url: 'blob:a' }] });
const b = registry.normalizeProject({ templateId: 'luxury-real-estate-custom-pro', media: [] });
assert.equal(a.media[0].slot, 'heroVideo');
assert.equal(b.media.length, 0);
assert.notEqual(a.templateId, b.templateId);

const studio = fs.readFileSync('review/phase1-studio-v2.js', 'utf8');
assert.doesNotMatch(studio, /EP\.Media\.getAll\(/, 'Studio must not read global catalog media slots');
assert.doesNotMatch(fs.readFileSync('index.html', 'utf8'), /Customization Studio|PREVIEW EN DIRECTO/, 'index.html must not embed Studio UI');

for (const file of [
  'labs/source-experiences/real-estate-storytelling-source-faithful/index.html',
  'labs/source-experiences/product-storytelling-source-faithful/index.html',
  'labs/source-experiences/luxury-real-estate-source-faithful/index.html'
]) {
  assert.equal(fs.existsSync(file), true, `${file} missing`);
}

console.log('Studio template contract OK');
