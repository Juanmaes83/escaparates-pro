/**
 * G2 AUDIT — which authoring surfaces exist, and which of them actually run.
 *
 * Read-only. Nothing here modifies the product; it opens each entrypoint the way
 * a person would and reports what mounts, so the reconciliation rests on a
 * running surface rather than on reading source.
 *
 * The three surfaces found in the tree:
 *
 *   author.html                        app/author-app.js       engine world editor
 *   index.html?authoring=1&shell=vs01  authoring-panel.js      VS01 thin panel
 *   index.html?authoring=1             studio/studio-shell.js  VS02 full Studio
 *
 * Only the first has its own HTML file. The other two are query parameters on
 * the visitor entrypoint, which is the whole reason Human QA reached the engine
 * editor and concluded the Studio was missing.
 *
 *   node qa/tools/authoring-surface-audit.mjs
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
const OUT = path.join(MODULE_ROOT, 'qa', 'evidence-vs02', 'authoring-audit');
const PORT = Number(process.env.IW_AUD_PORT || 5240);
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webm': 'video/webm', '.mp4': 'video/mp4' };

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

const SURFACES = [
  { id: 'engine-editor', label: 'author.html — editor de mundo', url: 'labs/immersive-worlds/author.html' },
  { id: 'vs01', label: 'VS01 — panel fino', url: 'labs/immersive-worlds/index.html?tier=LOW&authoring=1&shell=vs01' },
  { id: 'vs02', label: 'VS02 — Museum Studio', url: 'labs/immersive-worlds/index.html?tier=LOW&authoring=1' }
];

const browser = await chromium.launch({ headless: true, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox'] });
const report = { generatedAt: new Date().toISOString(), surfaces: [] };

for (const s of SURFACES) {
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
  page.setDefaultTimeout(240000);
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  const row = { ...s, mounted: null, errors: [] };
  try {
    await page.goto(`http://127.0.0.1:${PORT}/${s.url}`, { waitUntil: 'load' });
    await page.waitForFunction(() => window.__IW?.ready === true || document.querySelector('.iw-au, .au-panel, .st-shell'), { timeout: 240000 });
    // The visitor entrypoint gates behind Entrar; the engine editor does not.
    const enter = page.locator('[data-el="enter"]');
    if (await enter.isVisible().catch(() => false)) await enter.click({ timeout: 120000 });
    await page.waitForTimeout(4000);

    row.mounted = await page.evaluate(() => {
      const q = (sel) => Boolean(document.querySelector(sel));
      const txt = (sel) => (document.querySelector(sel)?.textContent || '').replace(/\s+/g, ' ').trim();
      return {
        engineEditor: q('.iw-au'),
        vs01Panel: q('.au-panel, .au-s'),
        vs02Shell: q('.st-shell, [class^="st-"]'),
        // What the top level of each surface actually offers.
        railLabels: [...document.querySelectorAll('.st-rail button, .st-rail li, .au-s > h2, .iw-au__group')]
          .map((n) => n.textContent.replace(/\s+/g, ' ').trim()).filter(Boolean).slice(0, 24),
        hasFileInput: document.querySelectorAll('input[type="file"]').length,
        bodyAttr: document.body.getAttribute('data-studio') || document.body.className || '',
        firstText: txt('body').slice(0, 140)
      };
    });
    await page.screenshot({ path: path.join(OUT, `${s.id}.png`), fullPage: false });
  } catch (e) {
    row.error = String(e?.message || e).split('\n')[0];
  }
  row.errors = errors.slice(0, 5);
  report.surfaces.push(row);
  const m = row.mounted || {};
  console.log(`${s.label}`);
  console.log(`   engine-editor=${m.engineEditor} vs01=${m.vs01Panel} vs02=${m.vs02Shell} file-inputs=${m.hasFileInput}`);
  if (m.railLabels?.length) console.log(`   nivel superior: ${m.railLabels.join(' · ')}`);
  if (row.error) console.log(`   ERROR: ${row.error}`);
  if (row.errors.length) console.log(`   consola: ${row.errors[0]}`);
  await page.close();
}

await fs.writeFile(path.join(OUT, 'authoring-surface-audit.json'), JSON.stringify(report, null, 1));
await browser.close();
server.close();
