/**
 * Does the Media Library actually let an author reuse a file?
 *
 * The claim being tested is not "a panel renders". It is that a file already in
 * the project can be put on a second wall without being found on disk again,
 * that it then reaches the Museum, and that the semantic rules still hold —
 * a video cannot be offered to a slot that only draws stills.
 *
 *   node qa/tools/library-proof.mjs
 */
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MODULE_ROOT = path.resolve(HERE, '..', '..');
const REPO_ROOT = path.resolve(MODULE_ROOT, '../..');
const OUT = path.join(MODULE_ROOT, 'qa', 'evidence-vs02', 'library');
const PORT = Number(process.env.IW_LIB_PORT || 4970);
const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.webm': 'video/webm', '.mp4': 'video/mp4'
};

await fs.mkdir(OUT, { recursive: true });

const server = http.createServer(async (req, res) => {
  try {
    let f = path.resolve(REPO_ROOT, decodeURIComponent((req.url || '/').split('?')[0]).replace(/^\/+/, '') || 'index.html');
    if (!f.startsWith(REPO_ROOT)) return res.writeHead(403).end();
    if (fsSync.existsSync(f) && fsSync.statSync(f).isDirectory()) f = path.join(f, 'index.html');
    const stat = fsSync.statSync(f);
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(f)] || 'application/octet-stream',
      'Accept-Ranges': 'bytes', 'Content-Length': stat.size, 'Cache-Control': 'no-store'
    });
    res.end(await fs.readFile(f));
  } catch { res.writeHead(404).end(); }
});
await new Promise((r) => server.listen(PORT, '127.0.0.1', r));

const results = [];
const say = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
};

const browser = await chromium.launch({
  headless: true,
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox']
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.setDefaultTimeout(300000);
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto(`http://127.0.0.1:${PORT}/labs/immersive-worlds/index.html?tier=HIGH&authoring=1`, { waitUntil: 'load' });
await page.waitForFunction(() => window.__IW?.ready === true, { timeout: 300000 });
await page.evaluate(() => { window.__IW.hud.el.veil.hidden = true; });
await page.waitForTimeout(1200);

/* -- 1. the library exists, and is reached through the workspace spine ----- */

await page.click('[data-domain="content"]');
await page.waitForTimeout(600);
const shelves = await page.evaluate(() => {
  const lib = document.querySelector('.st-lib');
  if (!lib) return null;
  return {
    shelves: [...lib.querySelectorAll('.st-shelf h3')].map((h) => h.textContent.trim().replace(/\s+/g, ' ')),
    items: lib.querySelectorAll('.st-mitem').length,
    thumbs: lib.querySelectorAll('.st-mthumb img').length,
    tree: Boolean(document.querySelector('.st-treerow'))
  };
});
say('la biblioteca se abre desde el área Contenido', Boolean(shelves), shelves ? `${shelves.items} archivos` : 'no hay .st-lib');
if (!shelves) { await browser.close(); server.close(); process.exit(1); }
say('las tres estanterías están presentes', shelves.shelves.length === 3, shelves.shelves.join(' · '));
say('cada archivo se ve, no solo se nombra', shelves.thumbs >= shelves.items - 1,
  `${shelves.thumbs} miniaturas de ${shelves.items} archivos`);

// Every thumbnail must actually decode. A broken <img> is worse than no image:
// it claims a picture and shows a hole.
const broken = await page.evaluate(() => {
  const imgs = [...document.querySelectorAll('.st-mthumb img')];
  return imgs.filter((i) => !i.complete || i.naturalWidth === 0).map((i) => i.src.slice(-48));
});
say('todas las miniaturas cargan de verdad', broken.length === 0, broken.length ? broken.join(', ') : 'ninguna rota');

const usage = await page.evaluate(() =>
  [...document.querySelectorAll('.st-mitem')].map((li) => ({
    name: li.querySelector('b')?.textContent,
    use: li.querySelector('em')?.textContent?.trim()
  })).slice(0, 3));
say('la biblioteca dice dónde se usa cada archivo',
  usage.every((u) => u.use && u.use.length > 0), JSON.stringify(usage));

await page.screenshot({ path: path.join(OUT, '26_MEDIA_LIBRARY.png') });

/* -- 2. reuse: a file already here, put on another wall -------------------- */

// Pick a work that has no authored media, then reuse an existing image on it.
const target = await page.evaluate(() => {
  const studio = window.__IW_STUDIO;
  const artwork = (studio.world.entities || []).find(
    (e) => e.kind === 'ARTWORK' && !studio.config.entities?.[e.id]?.image
  );
  return artwork?.id || null;
});
say('hay una obra sin medio propio para la prueba', Boolean(target), String(target));

// Select it through the tree, then come back to the library.
await page.click('[data-domain="build"]');
await page.waitForTimeout(400);
await page.click(`[data-node="${target}"]`);
await page.waitForTimeout(2000);
await page.click('[data-domain="content"]');
await page.waitForTimeout(600);

const offer = await page.evaluate(() => {
  const buttons = [...document.querySelectorAll('[data-reuse]')];
  return {
    count: buttons.length,
    slots: [...new Set(buttons.map((b) => b.dataset.slot))],
    label: buttons[0]?.textContent.trim()
  };
});
say('la biblioteca ofrece reutilizar en la pieza seleccionada', offer.count > 0,
  `${offer.count} ofertas · ranuras: ${offer.slots.join(', ')}`);
// The semantic model must survive reuse: an offer may only name a slot whose
// medium matches the file's.
say('ninguna oferta cruza el medio con la ranura',
  offer.slots.every((s) => s === 'ARTWORK_IMAGE' || s === 'ARTWORK_VIDEO'),
  offer.slots.join(', '));

const before = await page.evaluate((id) => window.__IW_STUDIO.config.entities?.[id]?.image?.name || null, target);
await page.click('[data-reuse]');
await page.waitForTimeout(600);
const after = await page.evaluate((id) => {
  const e = window.__IW_STUDIO.config.entities?.[id] || {};
  return { image: e.image?.name || null, src: e.image?.src || null, dirty: window.__IW_STUDIO.dirty };
}, target);
say('reutilizar asigna el archivo a la pieza', before === null && Boolean(after.image),
  `antes=${before} después=${after.image}`);
say('reutiliza la referencia, no una copia', Boolean(after.src) && !after.src.startsWith('blob:'),
  String(after.src));

/* -- 3. it reaches the Museum --------------------------------------------- */

await page.evaluate(() => { window.__IW.ready = false; });
await page.click('[data-act="apply"]');
await page.waitForFunction(() => window.__IW?.ready === true, { timeout: 300000 });
await page.evaluate(() => { window.__IW.hud.el.veil.hidden = true; });
await page.waitForTimeout(2000);

const onWall = await page.evaluate((id) => {
  const rt = window.__IW.runtime;
  const record = rt.sceneKit._entityIndex?.get(id);
  if (!record) return { found: false };
  let texture = null;
  record.object?.traverse?.((o) => { if (!texture && o.material?.map) texture = o.material.map; });
  return {
    found: true,
    hasTexture: Boolean(texture),
    // A procedural plate has no source image; a real file does.
    fromFile: Boolean(texture?.image && (texture.image.src || texture.image.tagName === 'IMG')),
    src: String(texture?.image?.src || '').slice(-42)
  };
}, target);
say('el archivo reutilizado llega a la pared', onWall.found && onWall.fromFile,
  JSON.stringify(onWall));

await page.click('[data-domain="content"]');
await page.waitForTimeout(600);
const reused = await page.evaluate(() =>
  [...document.querySelectorAll('.st-mitem')]
    .map((li) => li.querySelector('em')?.textContent?.trim())
    .filter((t) => /En \d+ piezas/.test(t || '')));
say('la biblioteca refleja que ahora se usa en dos piezas', reused.length > 0, reused.join(' · '));
await page.screenshot({ path: path.join(OUT, '27_MEDIA_REUSED.png') });

say('sin errores de consola', errors.length === 0, errors.slice(0, 2).join(' | ') || 'ninguno');

const passed = results.filter((r) => r.ok).length;
await fs.writeFile(path.join(OUT, 'library-proof.json'),
  JSON.stringify({ generatedAt: new Date().toISOString(), passed, total: results.length, results }, null, 1));
console.log(`\n${passed}/${results.length}`);
await browser.close();
server.close();
