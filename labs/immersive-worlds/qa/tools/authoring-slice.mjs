/**
 * Vertical Slice 01 — does authoring actually author?
 *
 * The product test this exists to answer is not "does the panel open". It is:
 * can a second institution use this without an engine change, and does one
 * semantic record still drive every representation of it?
 *
 *   node qa/tools/authoring-slice.mjs
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
const OUT = path.join(MODULE_ROOT, 'qa', 'evidence-authoring');
const PORT = Number(process.env.IW_AU_PORT || 4680);
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webm': 'video/webm' };

const server = http.createServer(async (req, res) => {
  try {
    const d = decodeURIComponent((req.url || '/').split('?')[0]).replace(/^\/+/, '');
    let f = path.resolve(REPO_ROOT, d || 'index.html');
    if (!f.startsWith(REPO_ROOT)) return res.writeHead(403).end();
    if (fsSync.existsSync(f) && fsSync.statSync(f).isDirectory()) f = path.join(f, 'index.html');
    res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(await fs.readFile(f));
  } catch { res.writeHead(404).end(); }
});
await new Promise((r) => server.listen(PORT, '127.0.0.1', r));
await fs.mkdir(OUT, { recursive: true });
const BASE = `http://127.0.0.1:${PORT}/labs/immersive-worlds`;

const browser = await chromium.launch({ headless: true, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.setDefaultTimeout(300000);
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));

const checks = [];
const check = (name, ok, detail = '') => {
  checks.push({ name, ok, detail });
  console.log(`${ok ? '  ok  ' : ' FAIL '} ${name}${detail ? `  — ${detail}` : ''}`);
};
const shots = [];
const shoot = async (id, caption) => {
  const file = `${id}.png`;
  await page.screenshot({ path: path.join(OUT, file), timeout: 180000 });
  shots.push({ id, file, caption });
};

await page.goto(`${BASE}/index.html?tier=HIGH&authoring=1`, { waitUntil: 'load' });
await page.waitForFunction(() => window.__IW?.ready === true, { timeout: 300000 });
await page.evaluate(() => { window.__IW.hud.el.veil.hidden = true; });

const original = await page.evaluate(() => ({
  institution: window.__IW.runtime.store.title,
  artwork: window.__IW.runtime.store.entities.find((e) => e.id === 'entity.artwork.horizonte-interrumpido')?.content
}));
check('el Museo original arranca con authoring activo', Boolean(original.artwork?.title),
  `${original.institution} · ${original.artwork?.title}`);
await shoot('01_original', `original — ${original.institution}`);

check('el panel de edición está montado', await page.evaluate(() => Boolean(document.getElementById('au'))));
await shoot('02_panel', 'panel de edición abierto');

/* -- the second museum, with no engine change ------------------------------ */
const museumB = JSON.parse(await fs.readFile(path.join(MODULE_ROOT, 'authoring', 'museum-b.config.json'), 'utf8'));
await page.evaluate(async (config) => {
  await window.__IW_PANEL.onApply(config);
}, museumB);
await page.waitForFunction(() => window.__IW?.ready === true, { timeout: 300000 });
await page.evaluate(() => { window.__IW.hud.el.veil.hidden = true; });

const afterB = await page.evaluate(() => {
  const rt = window.__IW.runtime;
  const e = rt.store.entities.find((x) => x.id === 'entity.artwork.horizonte-interrumpido');
  return {
    institution: rt.store.title,
    metaInstitution: rt.store.metadata?.institution,
    title: e?.content?.title, creator: e?.content?.creator,
    year: e?.content?.year, medium: e?.content?.medium,
    second: rt.store.entities.find((x) => x.id === 'entity.artwork.division-tercera')?.content?.title,
    // Collection Browse and Focus read the same record — this is the single
    // semantic record property, checked rather than assumed.
    focusable: rt.focusableInSpace('space.gallery-a').map((x) => x.content?.title)
  };
});

check('la identidad institucional cambia', afterB.metaInstitution === 'Museo de la Bruma', afterB.metaInstitution);
check('el título de la exposición cambia', afterB.institution?.includes('Bruma'), afterB.institution);
check('los metadatos de la obra cambian', afterB.title === 'Marea de septiembre' && afterB.creator === 'Olga Vilariño',
  `${afterB.title} · ${afterB.creator} · ${afterB.year} · ${afterB.medium}`);
check('una segunda obra también responde', afterB.second === 'Cuaderno de niebla', String(afterB.second));
check('un registro alimenta todas las representaciones',
  afterB.focusable.includes('Marea de septiembre'),
  `Collection Browse: ${afterB.focusable.filter(Boolean).slice(0, 3).join(' · ')}`);
await shoot('03_museum_b', `Museo B — ${afterB.metaInstitution}`);

/* -- media lifecycle ------------------------------------------------------- */
const media = await page.evaluate(async () => {
  const vault = window.__IW_VAULT;
  const bad = await vault.accept(new File(['x'], 'nota.txt', { type: 'text/plain' }), { kind: 'image' });

  // A real 2×2 PNG, so the loader has something it can genuinely decode.
  const png = Uint8Array.from(atob(
    'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVR4nGP8z8Dwn4GBgYGJAQkAAB0BAglHM8gAAAAASUVORK5CYII='
  ), (c) => c.charCodeAt(0));
  const good = await vault.accept(new File([png], 'obra.png', { type: 'image/png' }), { kind: 'image' });
  const resolved = vault.resolve(good.reference);
  // Read the state before releasing: the asset object is live, and release()
  // sets it to RELEASED, so building the result afterwards reported the state
  // the test had just caused rather than the one it meant to check.
  const goodState = good.state;
  const goodSize = `${good.width}×${good.height}`;
  const before = vault.report().length;
  vault.release(good.id);
  return {
    badState: bad.state, badError: bad.error,
    goodState, goodSize,
    resolved: Boolean(resolved), releasedFrom: before, releasedTo: vault.report().length
  };
});
check('un formato no admitido falla con motivo', media.badState === 'ERROR' && Boolean(media.badError), media.badError);
check('una imagen válida llega a READY', media.goodState === 'READY', media.goodSize);
check('la referencia autorizada resuelve a un URL vivo', media.resolved);
check('liberar revoca y olvida el asset', media.releasedTo === media.releasedFrom - 1,
  `${media.releasedFrom} → ${media.releasedTo}`);

/* -- save / restore -------------------------------------------------------- */
const persistence = await page.evaluate(async () => {
  const { ConfigStore } = await import('./authoring/config-store.js');
  ConfigStore.save(window.__IW_CONFIG);
  const raw = localStorage.getItem('iw.museum.authoring.v1');
  const restored = ConfigStore.load();
  return {
    bytes: raw?.length || 0,
    version: restored?.schemaVersion,
    institution: restored?.institution?.name,
    artworkTitle: restored?.artworks?.['entity.artwork.horizonte-interrumpido']?.title,
    hasEngineRefs: /\[object |__three|Mesh|WebGL/.test(raw || '')
  };
});
check('la configuración se serializa', persistence.bytes > 200, `${persistence.bytes} bytes · esquema v${persistence.version}`);
check('la configuración se restaura íntegra',
  persistence.institution === 'Museo de la Bruma' && persistence.artworkTitle === 'Marea de septiembre',
  `${persistence.institution} · ${persistence.artworkTitle}`);
check('la configuración no contiene objetos del motor', persistence.hasEngineRefs === false);

/* -- the original still works --------------------------------------------- */
await page.evaluate(async () => {
  const { baseConfigFromWorld } = await import('./authoring/experience-config.js');
  const world = await fetch('./worlds/museum-v1.world.json').then((r) => r.json());
  await window.__IW_PANEL.onApply(baseConfigFromWorld(world));
});
await page.waitForFunction(() => window.__IW?.ready === true, { timeout: 300000 });
const restored = await page.evaluate(() => ({
  institution: window.__IW.runtime.store.metadata?.institution,
  title: window.__IW.runtime.store.entities.find((e) => e.id === 'entity.artwork.horizonte-interrumpido')?.content?.title,
  guided: Boolean(window.__IW.runtime.defaultRouteId),
  violations: window.__IW.runtime.camera.report().violations
}));
check('Fundación Arenas vuelve intacta', restored.title === 'Horizonte interrumpido',
  `${restored.institution} · ${restored.title}`);
check('el recorrido guiado sigue disponible', restored.guided);
check('sin violaciones de autoridad de cámara', restored.violations === 0);
check('sin errores de consola', errors.length === 0, errors.slice(0, 2).join(' | ') || 'ninguno');
await shoot('04_restored', 'Fundación Arenas restaurada');

const failed = checks.filter((c) => !c.ok).length;
await fs.writeFile(path.join(OUT, 'authoring.json'), JSON.stringify({
  generatedAt: new Date().toISOString(), original, afterB, media, persistence, restored, checks, shots, errors
}, null, 1));
console.log(`\n${checks.length - failed}/${checks.length} comprobaciones`);
await browser.close();
server.close();
process.exit(failed ? 1 : 0);
