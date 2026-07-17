import fs from 'node:fs';
import assert from 'node:assert/strict';

const integration = fs.readFileSync('js/projects/product-integration.js', 'utf8');
const route = fs.readFileSync('js/projects/studio-route.js', 'utf8');
const studio = fs.readFileSync('studio.html', 'utf8');
const index = fs.readFileSync('index.html', 'utf8');

const customTemplates = [
  'real-estate-storytelling-custom-pro',
  'product-storytelling-custom-pro',
  'luxury-real-estate-custom-pro',
];

for (const id of customTemplates) {
  assert.match(integration, new RegExp(id), `Missing Studio card integration for ${id}`);
  assert.match(route, new RegExp(id), `Missing Studio route for ${id}`);
  assert.match(studio, new RegExp(id), `Studio does not load ${id}`);
}

assert.doesNotMatch(integration, /source-faithful/, 'Source Faithful must not receive Studio controls');
assert.doesNotMatch(route, /source-faithful/, 'Source Faithful must not be routable in Studio');

assert.match(integration, /href='studio\.html'/, 'Main Studio product link is missing');
assert.match(integration, /studio\.html\?template=/, 'Direct template Studio link is missing');
assert.match(route, /href='index\.html'/, 'Studio return-to-catalog link is missing');
assert.match(route, /href='projects\.html'/, 'Studio project library link is missing');

assert.match(studio, /id="preview"/, 'Studio preview iframe is missing');
assert.match(studio, /phase1-studio-v2\.js/, 'Canonical Studio engine is missing');
assert.match(studio, /studio-route\.js/, 'Studio route module is missing');

assert.doesNotMatch(index, /<iframe[^>]+studio\.html/i, 'Studio must not be embedded in index.html');
assert.doesNotMatch(index, /review\/premium-storytelling-phase1-studio\.html/, 'Product must use studio.html, not the review page');

console.log('Product Studio module contract OK');
