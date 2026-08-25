/**
 * How long does each deterministic state take to become ready?
 *
 * The suite reloads the page once per named state and waits for `__IW.ready`.
 * That loop is where two runs have now died, and the question it cannot answer
 * on its own is whether some state got slower or whether the browser simply ran
 * out of road after twenty-odd full scene rebuilds. This times each one and keeps
 * going past a failure, so the shape of the answer is visible either way.
 *
 *   node qa/tools/states-timing.mjs
 */
import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, '../../../..');
const PORT = Number(process.env.IW_STATES_PORT || 4540);
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.webm': 'video/webm', '.jpg': 'image/jpeg' };

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
const BASE = `http://127.0.0.1:${PORT}/labs/immersive-worlds`;

const browser = await chromium.launch({ headless: true, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.setDefaultTimeout(120000);

await page.goto(`${BASE}/index.html?reducedMotion=1&tier=HIGH`, { waitUntil: 'load' });
await page.waitForFunction(() => window.__IW?.ready === true, { timeout: 120000 });
const stateNames = await page.evaluate(() => window.__IW.states);
console.log(`  ${stateNames.length} deterministic states\n`);

const rows = [];
for (const name of stateNames) {
  const startedAt = Date.now();
  let ok = true;
  let detail = '';
  try {
    await page.goto(`${BASE}/index.html?reducedMotion=1&tier=HIGH&state=${encodeURIComponent(name)}`, { waitUntil: 'load' });
    await page.waitForFunction(() => window.__IW?.ready === true, { timeout: 45000 });
    detail = await page.evaluate(() => {
      const rt = window.__IW.runtime;
      return `${String(rt.state.activeSpaceId).replace('space.', '')} · ${rt.camera.owner}`;
    });
  } catch (error) {
    ok = false;
    detail = String(error?.message || error).split('\n')[0];
  }
  const ms = Date.now() - startedAt;
  rows.push({ name, ms, ok, detail });
  console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${String(ms).padStart(6)} ms  ${name.padEnd(34)} ${detail}`);
}

const failed = rows.filter((r) => !r.ok);
const times = rows.filter((r) => r.ok).map((r) => r.ms);
const firstHalf = times.slice(0, Math.floor(times.length / 2));
const secondHalf = times.slice(Math.floor(times.length / 2));
const mean = (xs) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : 0);

console.log('');
console.log(`  ready in: min ${Math.min(...times)} ms · max ${Math.max(...times)} ms · mean ${mean(times)} ms`);
// If the browser is running out of road rather than one state being slow, the
// later half of the loop is systematically slower than the earlier half.
console.log(`  first half mean ${mean(firstHalf)} ms · second half mean ${mean(secondHalf)} ms`);
console.log(`  ${rows.length - failed.length}/${rows.length} states became ready`);
if (failed.length) console.log(`  failed: ${failed.map((r) => r.name).join(', ')}`);

await browser.close();
server.close();
process.exit(failed.length ? 1 : 0);
