/**
 * P0.1 — the VISITANTE authoring workspace, measured at real widths.
 *
 * Human QA reports the Visitor workspace becomes unusable: words split across
 * lines, fields truncated, inputs too narrow to edit, hierarchy collapsed. The
 * brief is explicit that this is a layout defect and not a rejection of the data
 * model, and equally explicit that it must not be "solved" by adding a few
 * pixels to the same narrow column.
 *
 * So this measures the thing that decides usability: how wide the editable
 * controls actually are, at the widths a real reviewer uses. A URL field at
 * 196 px is not a styling opinion, it is a number.
 *
 *   IW_LABEL=before node qa/tools/visitor-workspace-audit.mjs
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
const LABEL = process.env.IW_LABEL || 'before';
const OUT = path.join(MODULE_ROOT, 'qa', 'evidence-vs02', 'visitor-workspace', LABEL);
const PORT = Number(process.env.IW_VW_PORT || 5250);
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webm': 'video/webm', '.mp4': 'video/mp4' };

/** The widths the brief names. Not a phone: the Studio does not claim mobile. */
const VIEWPORTS = [
  { id: '1920', w: 1920, h: 1080 },
  { id: '1440', w: 1440, h: 900 },
  { id: '1366', w: 1366, h: 768 }
];

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

/**
 * What the author can actually see and type into.
 *
 * `narrowInputs` is the acceptance number: a text control under 240 px cannot
 * hold a reservation URL legibly, and the brief's hard requirement is that
 * Visitor fields are never again compressed into a sliver. `overflowingLabels`
 * catches the reported word-splitting — a label whose scroll width exceeds its
 * box is a label being broken across lines or clipped.
 */
const MEASURE = () => {
  const panel = document.querySelector('.st-tree, .st-editorial');
  if (!panel) return { present: false };
  const box = panel.getBoundingClientRect();
  const controls = [...panel.querySelectorAll('input[type="text"], input[type="url"], input:not([type]), textarea')];
  const widths = controls.map((c) => Math.round(c.getBoundingClientRect().width));
  const labels = [...panel.querySelectorAll('label, h3, .st-f__label')];
  const overflowing = labels.filter((l) => l.scrollWidth > l.clientWidth + 1).length;
  const root = getComputedStyle(document.documentElement);
  return {
    present: true,
    column: { width: Math.round(box.width), height: Math.round(box.height) },
    tokens: {
      rail: root.getPropertyValue('--st-rail').trim(),
      left: root.getPropertyValue('--st-left').trim(),
      editor: root.getPropertyValue('--st-editor').trim(),
      val: root.getPropertyValue('--st-val').trim()
    },
    controls: controls.length,
    controlWidths: widths,
    narrowestControl: widths.length ? Math.min(...widths) : null,
    medianControl: widths.length ? widths.slice().sort((a, b) => a - b)[Math.floor(widths.length / 2)] : null,
    narrowInputs: widths.filter((w) => w < 240).length,
    overflowingLabels: overflowing,
    scrollHeight: panel.scrollHeight,
    clientHeight: panel.clientHeight,
    verticalOverflowPx: Math.max(0, panel.scrollHeight - panel.clientHeight),
    documentHorizontalOverflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
    // The preview must stay materially visible — it is the product.
    //
    // Measured on the stage slot, not on #iw-canvas. The canvas is inset:0
    // inside a fixed #iw-stage, so its bounding box reports the docked width
    // whatever the shell does around it: it read an identical 600px before and
    // after a change that visibly halved the preview. The stage slot is the
    // element whose width actually is the preview.
    previewWidth: Math.round(document.getElementById('st-stage-slot')?.getBoundingClientRect().width || 0)
  };
};

const browser = await chromium.launch({ headless: true, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox'] });
const report = { generatedAt: new Date().toISOString(), label: LABEL, viewports: [] };

for (const vp of VIEWPORTS) {
  const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } });
  page.setDefaultTimeout(240000);
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`http://127.0.0.1:${PORT}/labs/immersive-worlds/index.html?tier=LOW&authoring=1`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__IW?.ready === true, { timeout: 240000 });
  const enter = page.locator('[data-el="enter"]');
  if (await enter.isVisible().catch(() => false)) await enter.click({ timeout: 120000 });
  await page.waitForTimeout(3000);

  // Open VISITANTE the way an author does — the rail button.
  await page.click('[data-domain="visitor"]');
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(OUT, `visitante-${vp.id}.png`) });
  const m = await page.evaluate(MEASURE);
  report.viewports.push({ ...vp, ...m, errors });
  console.log(`${vp.w}×${vp.h}  columna ${m.column?.width}px · controles ${m.controls} · más estrecho ${m.narrowestControl}px · <240px: ${m.narrowInputs} · etiquetas partidas ${m.overflowingLabels} · scroll vertical ${m.verticalOverflowPx}px · preview ${m.previewWidth}px`);
  await page.close();
}

await fs.writeFile(path.join(OUT, 'visitor-workspace.json'), JSON.stringify(report, null, 1));
console.log(`\n${path.relative(REPO_ROOT, OUT)}`);
await browser.close();
server.close();
