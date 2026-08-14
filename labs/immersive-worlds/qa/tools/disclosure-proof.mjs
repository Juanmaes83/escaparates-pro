/**
 * Does progressive disclosure calm the panel without hiding anything?
 *
 * The risk in this pattern is not that it fails to hide — it is that hiding
 * turns into losing. Three things must stay true, and each has bitten a real
 * product somewhere:
 *
 *   1. a folded field is still counted by validation — hidden ≠ ignored;
 *   2. folding never discards what was typed;
 *   3. a closed section that already holds authored values says so, so nothing
 *      an author wrote can vanish from view without a trace.
 *
 *   node qa/tools/disclosure-proof.mjs
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
const OUT = path.join(MODULE_ROOT, 'qa', 'evidence-vs02', 'disclosure');
const PORT = Number(process.env.IW_DISC_PORT || 5010);
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
await page.goto(`http://127.0.0.1:${PORT}/labs/immersive-worlds/index.html?tier=HIGH&authoring=1`, { waitUntil: 'load' });
await page.waitForFunction(() => window.__IW?.ready === true, { timeout: 300000 });
await page.evaluate(() => { window.__IW.hud.el.veil.hidden = true; });
await page.waitForTimeout(1200);

/* -- the first view is calmer than it was --------------------------------- */

const first = await page.evaluate(() => ({
  fields: document.querySelectorAll('.st-ed [data-bind]').length,
  more: [...document.querySelectorAll('.st-morebtn span')].map((s) => s.textContent.replace(/\s+/g, ' ').trim()),
  label: document.querySelector('.st-morebtn b')?.textContent || null
}));
say('la primera vista de Institución muestra lo esencial', first.fields === 2,
  `${first.fields} campos visibles`);
say('la apertura lleva el nombre de su familia', /Personalizar más · Institución/.test(first.more[0] || ''),
  first.more.join(' | '));
// "Advanced" would have told an author only that somebody judged it complicated.
say('ninguna apertura se llama Avanzado / Más / Ajustes',
  !first.more.some((t) => /avanzado|ajustes|^más$|settings|advanced/i.test(t)), first.more.join(' | '));
await page.screenshot({ path: path.join(OUT, '28_DISCLOSURE_CLOSED.png') });

/* -- hidden ≠ ignored ------------------------------------------------------ */

const closedReadiness = await page.evaluate(() => {
  const r = window.__IW_STUDIO.readiness;
  return { total: r.requiredTotal, ready: r.requiredReady, state: r.state };
});
await page.click('[data-more="more:institution"]');
await page.waitForTimeout(400);
const openReadiness = await page.evaluate(() => {
  const r = window.__IW_STUDIO.readiness;
  return {
    total: r.requiredTotal, ready: r.requiredReady, state: r.state,
    fields: document.querySelectorAll('.st-ed [data-bind]').length
  };
});
say('abrir la sección revela los campos profundos', openReadiness.fields > first.fields,
  `${first.fields} → ${openReadiness.fields}`);
// The validation column reads the config, not the DOM. If folding a field
// changed the score, the panel would be grading itself on what it happens to
// be showing.
say('plegar no cambia la validación — oculto ≠ ignorado',
  closedReadiness.total === openReadiness.total && closedReadiness.ready === openReadiness.ready,
  `cerrado ${closedReadiness.ready}/${closedReadiness.total} · abierto ${openReadiness.ready}/${openReadiness.total}`);
await page.screenshot({ path: path.join(OUT, '29_DISCLOSURE_OPEN.png') });

/* -- folding never discards ------------------------------------------------ */

const typed = 'Colección reunida entre 1958 y 1994.';
await page.fill('[data-bind="institution.introduction"]', typed);
await page.waitForTimeout(300);
await page.click('[data-more="more:institution"]');   // fold it away
await page.waitForTimeout(400);
const afterFold = await page.evaluate(() => ({
  present: Boolean(document.querySelector('[data-bind="institution.introduction"]')),
  config: window.__IW_STUDIO.config.institution.introduction,
  badge: document.querySelector('.st-morebtn em')?.textContent?.trim() || null
}));
say('el campo se pliega de la vista', afterFold.present === false, `en el DOM: ${afterFold.present}`);
say('plegar no descarta lo escrito', afterFold.config === typed, JSON.stringify(afterFold.config));
// Otherwise an author folds a section and has no way to know it holds their work.
say('la sección cerrada declara que tiene contenido', Boolean(afterFold.badge), String(afterFold.badge));

await page.click('[data-more="more:institution"]');
await page.waitForTimeout(400);
const reopened = await page.evaluate(() =>
  document.querySelector('[data-bind="institution.introduction"]')?.value || null);
say('al reabrir, el texto sigue ahí', reopened === typed, String(reopened));

/* -- the same pattern on the artwork family -------------------------------- */

const artwork = await page.evaluate(() =>
  (window.__IW_STUDIO.world.entities || []).find((e) => e.kind === 'ARTWORK')?.id);
await page.click(`[data-node="${artwork}"]`);
await page.waitForTimeout(2000);
const art = await page.evaluate(() => ({
  fields: document.querySelectorAll('.st-ed [data-bind]').length,
  more: document.querySelector('.st-morebtn span')?.textContent.replace(/\s+/g, ' ').trim() || null,
  slots: document.querySelectorAll('.st-ed .st-slot').length
}));
say('la obra muestra identidad y medios, no la ficha entera', art.fields === 2 && art.slots === 2,
  `${art.fields} campos · ${art.slots} ranuras`);
say('la apertura de la obra se llama por su familia', /Personalizar más · Obra/.test(art.more || ''), String(art.more));
await page.screenshot({ path: path.join(OUT, '30_DISCLOSURE_ARTWORK.png') });

say('sin errores de consola', errors.length === 0, errors.slice(0, 2).join(' | ') || 'ninguno');

const passed = results.filter((r) => r.ok).length;
await fs.writeFile(path.join(OUT, 'disclosure-proof.json'),
  JSON.stringify({ generatedAt: new Date().toISOString(), passed, total: results.length, results }, null, 1));
console.log(`\n${passed}/${results.length}`);
await browser.close();
server.close();
