/**
 * Where does a keystroke go wrong in the Institution panel?
 *
 * Typing "Museo Atlántico de Vigo" into the institution name produced
 * "Fundación AMueotlánticoeVigorenas (institución ficticia)" — characters
 * dropped, reordered, and inserted into the middle of the value they were meant
 * to replace. That is not a styling problem and not a focus problem: the field
 * kept focus throughout. Something is putting a stale value back.
 *
 * So this watches the field itself rather than the code: per keystroke, the
 * element's identity, its value, its caret, and whether the node was swapped out
 * from under the caret between one key and the next. An identity change is the
 * whole answer if it appears.
 *
 *   node qa/tools/typing-trace.mjs
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
const PORT = Number(process.env.IW_TYPE_PORT || 4737);
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webm': 'video/webm', '.mp4': 'video/mp4' };

const server = http.createServer(async (req, res) => {
  try {
    let f = path.resolve(REPO_ROOT, decodeURIComponent((req.url || '/').split('?')[0]).replace(/^\/+/, '') || 'index.html');
    if (!f.startsWith(REPO_ROOT)) return res.writeHead(403).end();
    if (fsSync.existsSync(f) && fsSync.statSync(f).isDirectory()) f = path.join(f, 'index.html');
    res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(await fs.readFile(f));
  } catch { res.writeHead(404).end(); }
});
await new Promise((r) => server.listen(PORT, '127.0.0.1', r));

const browser = await chromium.launch({ headless: true, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.setDefaultTimeout(300000);
await page.goto(`http://127.0.0.1:${PORT}/labs/immersive-worlds/index.html?tier=HIGH&authoring=1`, { waitUntil: 'load' });
await page.waitForFunction(() => window.__IW?.ready === true, { timeout: 300000 });
await page.evaluate(() => { window.__IW.hud.el.veil.hidden = true; });
await page.waitForTimeout(1200);

// Stamp the live element and count how often the studio redraws wholesale.
await page.evaluate(() => {
  window.__trace = { renders: 0, refreshes: 0, stamps: 0, events: [] };
  const studio = window.__IW_STUDIO;
  const render = studio.render.bind(studio);
  studio.render = function patched(...a) { window.__trace.renders += 1; return render(...a); };
  const refresh = studio._refreshLive.bind(studio);
  studio._refreshLive = function patched(...a) { window.__trace.refreshes += 1; return refresh(...a); };
  window.__stamp = () => {
    const el = document.querySelector('[data-bind="institution.name"]');
    if (el && !el.__id) { el.__id = `n${(window.__trace.stamps += 1)}`; }
    return el;
  };
  window.__stamp();
});

const selector = '[data-bind="institution.name"]';
await page.click(selector);
await page.keyboard.press('Control+a');

const typed = 'Museo Atlántico';
const log = [];
for (const ch of typed) {
  const before = await page.evaluate(() => {
    const el = window.__stamp();
    return { id: el.__id, value: el.value, caret: el.selectionStart, renders: window.__trace.renders, refreshes: window.__trace.refreshes };
  });
  await page.keyboard.type(ch, { delay: 30 });
  const after = await page.evaluate(() => {
    const el = window.__stamp();
    return {
      id: el.__id, value: el.value, caret: el.selectionStart,
      focused: document.activeElement === el,
      renders: window.__trace.renders, refreshes: window.__trace.refreshes,
      config: window.__IW_STUDIO.config.institution.name
    };
  });
  log.push({
    key: ch,
    nodeSwapped: before.id !== after.id,
    node: `${before.id}→${after.id}`,
    value: after.value,
    caret: `${before.caret}→${after.caret}`,
    focused: after.focused,
    renders: after.renders - before.renders,
    refreshes: after.refreshes - before.refreshes,
    config: after.config
  });
}

console.log(JSON.stringify(log, null, 1));
const swaps = log.filter((l) => l.nodeSwapped).length;
const rerenders = log.reduce((n, l) => n + l.renders, 0);
console.log(`\nnodos reemplazados durante la escritura: ${swaps}/${log.length}`);
console.log(`render() completos durante la escritura: ${rerenders}`);
console.log(`valor final: "${log[log.length - 1].value}"`);
console.log(`config final: "${log[log.length - 1].config}"`);

await browser.close();
server.close();
