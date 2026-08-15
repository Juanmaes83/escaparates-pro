/**
 * P0.3 — does authoring actually drive the published VISITA panel?
 *
 * The contract under test is
 *
 *   STUDIO → AUTHORITATIVE CONFIG → PREVIEW / PUBLISHED EXPERIENCE → VISITA
 *
 * and the failure it is written to catch is a Visitor surface that looks right
 * because it renders its own hard-coded copy of the same words. A field that
 * merely *appears* in VISITA proves nothing when the authored value and the
 * demo value are identical — which they are by default, because the demo config
 * is what ships.
 *
 * So every field is written with a value that could not have come from anywhere
 * else: a QA sentinel carrying a run-unique token. If the sentinel reaches
 * VISITA, the field is genuinely CONNECTED. If the old demo text survives, the
 * surface is HARDCODED. If neither appears, the field is NOT REPRESENTED.
 *
 * The config is applied through the same path the Studio's own apply uses, and
 * the panel is opened the way a visitor opens it.
 *
 *   node qa/tools/visita-traceability.mjs
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
const OUT = path.join(MODULE_ROOT, 'qa', 'evidence-vs02', 'visita-traceability');
const PORT = Number(process.env.IW_TRACE_PORT || 5270);
const TOKEN = `QA${Date.now().toString(36).toUpperCase()}`;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webm': 'video/webm', '.mp4': 'video/mp4' };

/**
 * AUTHORING FIELD → CONFIG PATH → EXPECTED VISITOR SURFACE.
 *
 * `demo` is the value that ships, so a surface still showing it after the config
 * changed is printing its own copy rather than reading the record.
 */
const FIELDS = [
  { label: 'Horarios', pathKey: 'hours', surface: 'VISITA · Horarios', sentinel: `Abierto ${TOKEN}`, demo: 'Miércoles a domingo' },
  { label: 'Dirección', pathKey: 'address', surface: 'VISITA · Dirección', sentinel: `Calle ${TOKEN}`, demo: 'Calle del Horno 14' },
  { label: 'Entrada', pathKey: 'admission', surface: 'VISITA · Entrada', sentinel: `Entrada ${TOKEN}`, demo: 'Entrada libre' },
  { label: 'Accesibilidad', pathKey: 'accessibility', surface: 'VISITA · Accesibilidad', sentinel: `Acceso ${TOKEN}`, demo: 'Itinerario accesible' },
  { label: 'Cómo llegar', pathKey: 'transport', surface: 'VISITA · Cómo llegar', sentinel: `Metro ${TOKEN}`, demo: 'Metro Antón Martín' },
  { label: 'Aparcamiento', pathKey: 'parking', surface: 'VISITA · Aparcamiento', sentinel: `Parking ${TOKEN}`, demo: '' },
  { label: 'Contacto', pathKey: 'contact', surface: 'VISITA · Contacto', sentinel: `correo${TOKEN}@example.org`, demo: 'visitas@fundacionarenas' },
  { label: 'Más información', pathKey: 'notes', surface: 'VISITA · Más información', sentinel: `Nota ${TOKEN}`, demo: '' },
  { label: 'Reservar visita', pathKey: 'bookingUrl', surface: 'VISITA · CTA Reservar', sentinel: `https://example.org/${TOKEN}/reserva`, demo: 'fundacion-arenas/visitas', attr: true },
  { label: 'Comprar entrada', pathKey: 'ticketUrl', surface: 'VISITA · CTA Comprar', sentinel: `https://example.org/${TOKEN}/entradas`, demo: '', attr: true },
  { label: 'Cómo llegar (enlace)', pathKey: 'directionsUrl', surface: 'VISITA · CTA Cómo llegar', sentinel: `https://example.org/${TOKEN}/mapa`, demo: '', attr: true }
];
const PROGRAMME_TITLE = `Programa ${TOKEN}`;

await fs.mkdir(OUT, { recursive: true });
const server = http.createServer(async (req, res) => {
  try {
    let f = path.resolve(REPO_ROOT, decodeURIComponent((req.url || '/').split('?')[0]).replace(/^\/+/, '') || 'index.html');
    if (!f.startsWith(REPO_ROOT)) return res.writeHead(403).end();
    if (fsSync.existsSync(f) && fsSync.statSync(f).isDirectory()) f = path.join(f, 'index.html');
    const stat = fsSync.statSync(f);
    res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream', 'Content-Length': stat.size, 'Cache-Control': 'no-store' });
    res.end(await fs.readFile(f));
  } catch { res.writeHead(404).end(); }
});
await new Promise((r) => server.listen(PORT, '127.0.0.1', r));

const browser = await chromium.launch({ headless: true, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.setDefaultTimeout(240000);
const consoleErrors = [];
page.on('pageerror', (e) => consoleErrors.push(e.message));

await page.goto(`http://127.0.0.1:${PORT}/labs/immersive-worlds/index.html?tier=LOW`, { waitUntil: 'load' });
await page.waitForFunction(() => window.__IW?.ready === true, { timeout: 240000 });

/* Author the sentinels through the config the runtime actually reads, then
   re-publish them to the HUD the way the boot does. */
await page.evaluate(({ fields, programmeTitle }) => {
  const rt = window.__IW.runtime;
  const cfg = window.__IW_CONFIG || {};
  cfg.visitor = cfg.visitor || {};
  for (const f of fields) cfg.visitor[f.pathKey] = f.sentinel;
  cfg.visitor.programme = [{
    id: 'prog_qa_01', title: programmeTitle, type: 'GUIDED',
    description: 'Elemento de programación escrito por el instrumento de trazabilidad.',
    start: 'Sábados 12:00', end: '', location: 'Vestíbulo', bookingUrl: '', accessibilityNote: ''
  }];
  window.__IW_CONFIG = cfg;
  window.__IW.hud.setVisitorInfo(cfg.visitor, cfg.institution?.name || '');
  return rt.state.activeSpaceId;
}, { fields: FIELDS.map(({ pathKey, sentinel }) => ({ pathKey, sentinel })), programmeTitle: PROGRAMME_TITLE });

await page.locator('[data-el="enter"]').click({ timeout: 120000 });
await page.waitForFunction(() => {
  const veil = window.__IW?.hud?.el?.veil;
  return veil && (veil.hidden || veil.classList.contains('is-gone'));
}, { timeout: 60000 });
await page.waitForTimeout(2000);

// Open VISITA the way a visitor does.
await page.locator('[data-el="visitBtn"]').click();
await page.waitForTimeout(700);
await page.screenshot({ path: path.join(OUT, 'visita-trazabilidad.png') });

const surface = await page.evaluate(() => {
  const body = document.querySelector('[data-el="visitBody"]');
  const foot = document.querySelector('[data-el="visitFoot"]');
  return {
    text: (body?.textContent || '').replace(/\s+/g, ' '),
    hrefs: [...(foot?.querySelectorAll('a') || []), ...(body?.querySelectorAll('a') || [])].map((a) => a.getAttribute('href') || '')
  };
});

const rows = FIELDS.map((f) => {
  const found = f.attr ? surface.hrefs.some((h) => h.includes(TOKEN)) : surface.text.includes(f.sentinel);
  const stale = Boolean(f.demo) && (f.attr ? surface.hrefs.some((h) => h.includes(f.demo)) : surface.text.includes(f.demo));
  const status = found ? 'CONNECTED' : stale ? 'HARDCODED' : 'NOT REPRESENTED';
  return { field: f.label, configPath: `visitor.${f.pathKey}`, consumer: 'hud.setVisitorInfo()', surface: f.surface, status };
});
rows.push({
  field: 'Programación', configPath: 'visitor.programme[]', consumer: 'hud.setVisitorInfo()',
  surface: 'VISITA · Programación',
  status: surface.text.includes(PROGRAMME_TITLE) ? 'CONNECTED'
    : surface.text.includes('Colección permanente') ? 'HARDCODED' : 'NOT REPRESENTED'
});

for (const r of rows) console.log(`${r.status.padEnd(16)} ${r.field.padEnd(22)} ${r.configPath}`);
const counts = rows.reduce((a, r) => ({ ...a, [r.status]: (a[r.status] || 0) + 1 }), {});
console.log(`\n${JSON.stringify(counts)}`);
if (consoleErrors.length) console.log(`errores: ${consoleErrors.slice(0, 3).join(' · ')}`);

await fs.writeFile(path.join(OUT, 'visita-traceability.json'), JSON.stringify({
  generatedAt: new Date().toISOString(), token: TOKEN, rows, counts, consoleErrors
}, null, 1));
await browser.close();
server.close();
