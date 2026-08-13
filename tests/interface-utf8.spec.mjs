import fs from 'node:fs';
import assert from 'node:assert/strict';

const interfaceFiles = [
  'studio.html',
  'projects.html',
  'js/projects/project-library-page.js',
  'js/customization/project-store-local.js',
  'js/sector-blueprints/fashion-commerce-pro.js',
  'review/phase1-studio-v2.js',
  'review/phase2-studio-extension.js',
  'tests/product-studio-module.spec.mjs',
  'tests/fashion-commerce-pro.spec.mjs',
  'tests/phase2-vercel.spec.mjs'
];

// No current interface file is allowed to keep mojibake. Add a narrow path here
// only if a future fixture intentionally documents corrupt encoding.
const documentedExceptions = new Set([]);
const mojibake = new RegExp(['\\u00c3','\\u00c2','\\u00e2\\u20ac','\\u00e2\\u0153'].join('|'));

for (const file of interfaceFiles) {
  if (documentedExceptions.has(file)) continue;
  const text = fs.readFileSync(file, 'utf8');
  assert.doesNotMatch(text, mojibake, `${file} contains mojibake`);
}

console.log('Interface UTF-8 contract OK');
