#!/usr/bin/env node
/**
 * The vendored Breeze core is the real thing, or this fails.
 *
 * Phase 1's whole premise is that the Museum runs Breeze's physics rather than
 * a Museum lookalike of it. That premise decays quietly: someone patches a line
 * to fix a build, someone inlines the `conf` import, someone "just tidies" a
 * kernel — and the room still runs, still looks like cloth, and is no longer
 * Breeze. Nothing about the running product would tell you.
 *
 * So the claim is pinned to hashes. The three extracted files must be
 * byte-identical to the donor at 0ab8234, the substitution must be exactly the
 * one that is declared, the committed bundle must match its recorded hash, and
 * the app shell must be absent. If a donor checkout is available the hashes are
 * re-derived from it; otherwise they are checked against the register, which
 * still catches every edit made on this side.
 *
 *   node qa/tools/breeze-core-provenance.mjs [--donor <path>]
 */

import { createHash } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const MODULE = resolve(HERE, '../..');
const CORE = join(MODULE, 'vendor/breeze-core');

const PINNED_COMMIT = '0ab82342f9169f20e32b0e90babcc4707e694906';

/** The extraction, as declared in VENDOR.md. */
const EXTRACTED = {
  'src/common/structuredArray.js': 'aa5e402a1caea5d1d8335308f33fd793684a61d13cd0b9578125655a7e45fe53',
  'src/physics/verletPhysics.js': '272c6890528695f1658cd6814a4c1401ea1241eb229ba0040eaef4847c5bd816',
  'src/bvh.js': '3045651e8acb44d58c959c8d2d0231088b89ccc421d8f12d3d27074b5c837771'
};

const BUNDLE_SHA = '6e3916cbe8f533e0c3526d8a00b3243ba33932cba30700374eec2781f0a37479';

/**
 * Identifiers from the standalone demo. If any of these reached the bundle the
 * app shell came with it, which the mandate forbids in as many words:
 * "DO NOT PORT THE BREEZE APP SHELL (no OrbitControls, autoRotate, standalone GUI)".
 */
const SHELL_MARKERS = ['OrbitControls', 'autoRotate', 'tweakpane', 'Tweakpane', 'fpsgraph'];

const args = process.argv.slice(2);
const donorArg = args.indexOf('--donor');
const donor = donorArg >= 0 ? args[donorArg + 1] : '/workspace/juanmaes83/breeze';

const sha = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
};

console.log('BREEZE CORE — PROVENANCE\n');

// 1. The extracted files are byte-identical to what the register declares.
for (const [rel, expected] of Object.entries(EXTRACTED)) {
  const p = join(CORE, 'build', rel);
  if (!existsSync(p)) { check(`extraído: ${rel}`, false, 'no existe'); continue; }
  const actual = sha(p);
  check(`extraído sin modificar: ${rel}`, actual === expected,
    actual === expected ? actual.slice(0, 12) : `esperado ${expected.slice(0, 12)}, obtenido ${actual.slice(0, 12)}`);
}

// 2. If the donor is on disk, the register's hashes are the donor's hashes.
//    Without this the check only proves internal consistency, not fidelity.
if (existsSync(join(donor, '.git'))) {
  let head = '';
  try {
    head = readFileSync(join(donor, '.git/HEAD'), 'utf8').trim();
    if (head.startsWith('ref:')) head = readFileSync(join(donor, '.git', head.slice(5).trim()), 'utf8').trim();
  } catch { /* detached or packed; the hash comparison below still runs */ }
  check('donante en el commit fijado', head === PINNED_COMMIT, head || 'HEAD ilegible');

  for (const [rel, expected] of Object.entries(EXTRACTED)) {
    const p = join(donor, rel);
    if (!existsSync(p)) { check(`donante: ${rel}`, false, 'no existe en el donante'); continue; }
    check(`coincide con el donante: ${rel}`, sha(p) === expected);
  }
} else {
  console.log(`INFO  donante no disponible en ${donor}; se verifica sólo contra el registro`);
}

// 3. The substitution is the declared one and carries no GUI.
const confPath = join(CORE, 'build/src/conf.js');
const conf = existsSync(confPath) ? readFileSync(confPath, 'utf8') : '';
check('sustitución conf.js presente', conf.length > 0);
// Comments are stripped first. The shim documents which panel it replaced, and
// a scan that read prose would fail on the sentence explaining the removal.
const confCode = conf.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
check('conf.js no arrastra GUI',
  !/tweakpane|Pane\(|addBinding|fpsgraph|is-mobile/i.test(confCode));
check('conf.js expone stiffness y friction',
  /stiffness\s*=\s*0\.25/.test(conf) && /friction\s*=\s*0\.5/.test(conf));

// 4. verletPhysics still imports conf rather than having been patched.
const vp = readFileSync(join(CORE, 'build/src/physics/verletPhysics.js'), 'utf8');
check('verletPhysics conserva el import de conf', /import\s*\{\s*conf\s*\}\s*from\s*"\.\.\/conf\.js"/.test(vp));

// 5. The committed bundle is the one the register names.
const bundlePath = join(CORE, 'breeze-core.js');
if (!existsSync(bundlePath)) {
  check('bundle presente', false, 'falta breeze-core.js');
} else {
  const actual = sha(bundlePath);
  check('bundle coincide con el registro', actual === BUNDLE_SHA,
    actual === BUNDLE_SHA ? actual.slice(0, 12) : `registro dice ${BUNDLE_SHA.slice(0, 12)}, hay ${actual.slice(0, 12)}`);

  const bundle = readFileSync(bundlePath, 'utf8');

  // 6. The TSL operator transform ran. This is the failure that would not
  //    announce itself: untransformed operators coerce nodes to NaN and the
  //    cloth simply never moves.
  //    Minified, the kernel reads `f.sub(l).mul(u).mul(p).mul(0.5).div(f)`;
  //    unminified, `dist.sub(restLength).mul(stiffness).mul(delta).mul(0.5).div(dist)`.
  //    Either shape proves the rewrite; the raw `(dist - restLength) * ...` does not.
  const springKernel = /\.sub\([\w$]+\)\.mul\([\w$]+\)\.mul\([\w$]+\)\.mul\(0?\.5\)\.div\([\w$]+\)/;
  check('transformación TSL aplicada (kernel de muelles)',
    springKernel.test(bundle), 'operadores reescritos a llamadas de nodo');

  // 7. No app shell.
  const leaked = SHELL_MARKERS.filter((m) => bundle.includes(m));
  check('sin app shell de Breeze', leaked.length === 0, leaked.length ? `filtrado: ${leaked.join(', ')}` : 'ninguno');

  // 8. The provenance record travels inside the artefact, not only beside it.
  check('procedencia embebida en el artefacto', bundle.includes(PINNED_COMMIT));
}

// 9. The licence travels with the code.
check('LICENSE junto al artefacto',
  existsSync(join(CORE, 'LICENSE')) && readFileSync(join(CORE, 'LICENSE'), 'utf8').includes('Niklas Niehus'));

const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length}`);
if (failed.length) {
  console.log('\nPROCEDENCIA BREEZE: FALLA');
  process.exit(1);
}
console.log('\nPROCEDENCIA BREEZE: EL NÚCLEO VENDORIZADO ES EL DE 0ab8234, SIN APP SHELL');
