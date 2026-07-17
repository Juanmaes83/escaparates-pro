import fs from 'node:fs';
import assert from 'node:assert/strict';

const integration = fs.readFileSync('js/projects/product-integration.js', 'utf8');
const route = fs.readFileSync('js/projects/studio-route.js', 'utf8');
const studio = fs.readFileSync('studio.html', 'utf8');
const registry = fs.readFileSync('js/studio/template-registry.js', 'utf8');
const engine = fs.readFileSync('review/phase1-studio-v2.js', 'utf8');
const cloud = fs.readFileSync('review/phase2-studio-extension.js', 'utf8');
const cloudCss = fs.readFileSync('review/phase2-studio-extension.css', 'utf8');
const library = fs.readFileSync('js/projects/project-library-page.js', 'utf8');
const index = fs.readFileSync('index.html', 'utf8');

const customTemplates = [
  'real-estate-storytelling-custom-pro',
  'product-storytelling-custom-pro',
  'luxury-real-estate-custom-pro'
];

for (const id of customTemplates) {
  assert.match(integration, new RegExp(id), `Missing Studio card integration for ${id}`);
  assert.match(registry, new RegExp(id), `Missing Studio registry definition for ${id}`);
  assert.match(studio, new RegExp(id), `Studio does not load ${id}`);
}

assert.doesNotMatch(integration, /source-faithful/, 'Source Faithful must not receive Studio controls');
assert.doesNotMatch(route, /source-faithful/, 'Source Faithful must not be routable in Studio');
assert.match(route, /StudioTemplateRegistry/, 'Studio route must resolve templates through the registry');
assert.match(route, /get\(id\)/, 'Studio route must read canonical template definitions');
assert.match(route, /dataset\.templateId/, 'Studio route must use canonical tab template ids');
assert.match(route, /StudioRuntime\.openProject/, 'Studio route must open projects through the protected runtime');

assert.match(integration, /href='studio\.html'/, 'Main Studio product link is missing');
assert.match(integration, /studio\.html\?template=/, 'Direct template Studio link is missing');
assert.match(integration, /pc-studio-top/, 'Studio needs its own persistent responsive class');
assert.doesNotMatch(integration, /max-width:1180px\)\{\.pc-studio-top\{display:none/, 'Studio must never disappear at the old breakpoint');

assert.match(route, /href='index\.html'/, 'Studio return-to-catalog link is missing');
assert.doesNotMatch(route, /studioProjectLibrary|textContent='Biblioteca'/, 'Studio toolbar must not duplicate project navigation');
assert.match(studio, /Abrir biblioteca completa/, 'Project modal must expose the full library');

assert.match(studio, /ESCAPARATES PRO · STUDIO/, 'Studio product naming is not unified');
assert.match(studio, /Studio de personalización/, 'Spanish Studio title is missing');
assert.match(studio, /VISTA PREVIA EN DIRECTO/, 'Spanish preview label is missing');
assert.match(studio, /id="preview"/, 'Studio preview iframe is missing');
assert.match(studio, /phase1-studio-v2\.js/, 'Canonical Studio engine is missing');
assert.match(studio, /studio-route\.js/, 'Studio route module is missing');
assert.match(studio, /template-registry\.js/, 'Studio registry must load before route modules');

assert.match(engine, /enterUnsupported/, 'Unsupported projects need an explicit protected state');
assert.match(engine, /studio-read-only/, 'Unsupported state needs an explicit UI marker');
assert.match(engine, /Exportar JSON original/, 'Unsupported projects must preserve original JSON export');
assert.doesNotMatch(engine, /\|\|defs\[0\]/, 'Unsupported projects must never fall back to the first template');

assert.match(cloud, /Modo local · sesión no iniciada/, 'Local mode must be explicit');
assert.match(cloud, /Proyecto guardado localmente ✓/, 'Local save confirmation is missing');
assert.match(cloud, /save\.disabled=readOnly\|\|!session\|\|!online/, 'Cloud save must be disabled for read-only, no-session and offline states');
assert.match(cloud, /versions\.disabled=readOnly\|\|!session\|\|!online/, 'Cloud versions must be disabled for read-only, no-session and offline states');
assert.match(cloud, /exportButton\.disabled=readOnly/, 'Transformed export and publication must be disabled in read-only mode');
assert.match(cloud, /navigator\.onLine\?'api-error':'offline'/, 'API errors and offline state must be distinct');
assert.match(cloudCss, /data-state="local"/, 'Local mode needs a neutral visual state');
assert.match(cloudCss, /\.phase2-bar \.btn:disabled/, 'Disabled cloud controls need a visible state');
assert.doesNotMatch(cloudCss, /position:sticky;bottom:0/, 'Cloud footer must not overlap mobile fields');

assert.match(library, /Todavía no tienes proyectos/, 'True empty-library message is missing');
assert.match(library, /No hay proyectos que coincidan con la búsqueda o los filtros/, 'Filtered-empty message is missing');
assert.match(library, /ProjectStoreLocal\.fork/, 'Library duplicate action must use canonical local fork');

assert.doesNotMatch(index, /<iframe[^>]+studio\.html/i, 'Studio must not be embedded in index.html');
assert.doesNotMatch(index, /review\/premium-storytelling-phase1-studio\.html/, 'Product must use studio.html, not the review page');

console.log('Product Studio module contract OK');
