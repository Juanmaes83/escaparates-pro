/**
 * Does what the Studio authors actually reach the person in the room?
 *
 * That is the whole claim of this layer — `AUTHORING DATA → MUST REACH VISITOR
 * EXPERIENCE` — and it is the one that a panel full of inputs can fake
 * completely. So the test types into the Studio, applies, and then reads the
 * *visitor's* surface for the words that were typed.
 *
 * It also checks the two lies this layer could tell: showing a button for a
 * link that does not exist, and showing an author control to a visitor.
 *
 *   node qa/tools/visitor-proof.mjs
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
const OUT = path.join(MODULE_ROOT, 'qa', 'evidence-vs02', 'visitor');
const PORT = Number(process.env.IW_VIS_PORT || 5050);
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
      'Content-Length': stat.size, 'Cache-Control': 'no-store'
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
const boot = async () => {
  await page.goto(`http://127.0.0.1:${PORT}/labs/immersive-worlds/index.html?tier=HIGH&authoring=1`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__IW?.ready === true, { timeout: 300000 });
  await page.evaluate(() => { window.__IW.hud.el.veil.hidden = true; });
  await page.waitForTimeout(1200);
};
await boot();

/* -- 1. authoring surface -------------------------------------------------- */

await page.click('[data-domain="visitor"]');
await page.waitForTimeout(600);
const panel = await page.evaluate(() => {
  const root = document.querySelector('.st-lib');
  if (!root) return null;
  return {
    essential: [...root.querySelectorAll('.st-shelf')].slice(0, 2)
      .flatMap((sec) => [...sec.querySelectorAll('[data-bind]')].map((i) => i.dataset.bind)),
    more: root.querySelector('.st-morebtn span')?.textContent.replace(/\s+/g, ' ').trim() || null,
    hidden: root.querySelectorAll('.st-morebody [data-bind]').length,
    programme: root.querySelectorAll('.st-prog').length,
    addBtn: Boolean(root.querySelector('[data-act="progAdd"]'))
  };
});
say('el área Visitante abre su panel', Boolean(panel), panel ? 'sí' : 'no');
say('la vista esencial se queda en lo esencial', panel.essential.length === 6,
  panel.essential.map((b) => b.split('.')[1]).join(', '));
say('el resto vive tras Personalizar más · Visitante',
  /Personalizar más · Visitante/.test(panel.more || '') && panel.hidden === 0,
  `${panel.more} · ${panel.hidden} campos visibles cerrados`);
say('la programación son registros, no campos numerados', panel.programme >= 2 && panel.addBtn,
  `${panel.programme} actividades`);
await page.screenshot({ path: path.join(OUT, '32_VISITOR_AUTHORING.png') });

/* -- 2. it reaches the visitor -------------------------------------------- */

const TYPED = 'Jueves de 11:00 a 21:00, entrada libre desde las 19:00';
await page.fill('[data-bind="visitor.hours"]', TYPED);
await page.waitForTimeout(300);
await page.evaluate(() => { window.__IW.ready = false; });
await page.click('[data-act="apply"]');
await page.waitForFunction(() => window.__IW?.ready === true, { timeout: 300000 });
await page.evaluate(() => { window.__IW.hud.el.veil.hidden = true; });
await page.waitForTimeout(1500);

const reached = await page.evaluate((typed) => {
  const hud = window.__IW.hud;
  hud.toggleVisit(true);
  const body = hud.el.visitBody.textContent.replace(/\s+/g, ' ');
  return {
    open: hud.el.visit.hidden === false,
    hasTyped: body.includes(typed),
    title: hud.el.visitTitle.textContent,
    programme: hud.el.visitBody.querySelectorAll('.iw-visit__prog li').length,
    ctas: [...hud.el.visitBody.querySelectorAll('.iw-visit__cta a')].map((a) => a.textContent.trim()),
    body
  };
}, TYPED);
say('el visitante puede abrir la información de visita', reached.open);
say('lo escrito en el Estudio llega al visitante', reached.hasTyped, TYPED);
say('el panel lleva el nombre de la institución', /Fundación Arenas/.test(reached.title), reached.title);
say('la programación llega como actividades', reached.programme >= 2, `${reached.programme} actividades`);

// The one lie this layer must not tell: a button for a link nobody supplied.
// Fundación Arenas publishes a booking link and no ticket link.
say('sin enlace no hay botón',
  reached.ctas.includes('Reservar visita') && !reached.ctas.includes('Comprar entrada'),
  reached.ctas.join(' · ') || 'ninguno');
await page.screenshot({ path: path.join(OUT, '33_VISITOR_PANEL.png') });

/* -- 3. the visitor never sees the Studio --------------------------------- */

const leak = await page.evaluate(() => {
  const panelEl = window.__IW.hud.el.visit;
  return {
    inputs: panelEl.querySelectorAll('input, textarea, select, [data-bind]').length,
    studioControls: panelEl.querySelectorAll('[data-act], [data-media], [data-more]').length
  };
});
say('la superficie del visitante no tiene ni un control de autoría',
  leak.inputs === 0 && leak.studioControls === 0,
  `${leak.inputs} campos · ${leak.studioControls} acciones`);

/* -- 4. a second institution, no engine change ----------------------------- */

await boot();
await page.click('[data-act="museumB"]');
await page.waitForFunction(() => window.__IW?.ready === true, { timeout: 300000 });
await page.evaluate(() => { window.__IW.hud.el.veil.hidden = true; });
await page.waitForTimeout(2000);
const second = await page.evaluate(() => {
  const hud = window.__IW.hud;
  hud.toggleVisit(true);
  const body = hud.el.visitBody.textContent.replace(/\s+/g, ' ');
  return {
    title: hud.el.visitTitle.textContent,
    body,
    programme: hud.el.visitBody.querySelectorAll('.iw-visit__prog li').length,
    ctas: [...hud.el.visitBody.querySelectorAll('.iw-visit__cta a')].map((a) => a.textContent.trim())
  };
});
say('la segunda institución trae sus propios horarios', /10:00 – 19:00/.test(second.body),
  second.body.slice(0, 60));
say('su propia dirección', /Muelle de Poniente/.test(second.body));
say('su propia programación', second.programme === 3, `${second.programme} actividades`);
// Museum B sells tickets; Fundación Arenas does not. Same code, different answer.
say('sus propias acciones — vende entrada donde la otra no',
  second.ctas.includes('Comprar entrada') && second.ctas.includes('Cómo llegar'),
  second.ctas.join(' · '));
await page.screenshot({ path: path.join(OUT, '34_VISITOR_MUSEUM_B.png') });

say('sin errores de consola', errors.length === 0, errors.slice(0, 2).join(' | ') || 'ninguno');

const passed = results.filter((r) => r.ok).length;
await fs.writeFile(path.join(OUT, 'visitor-proof.json'),
  JSON.stringify({ generatedAt: new Date().toISOString(), passed, total: results.length, results }, null, 1));
console.log(`\n${passed}/${results.length}`);
await browser.close();
server.close();
