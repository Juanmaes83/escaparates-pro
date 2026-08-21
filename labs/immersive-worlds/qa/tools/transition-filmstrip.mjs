/**
 * Filmstrips for the transitions that carry the argument.
 *
 * Still frames cannot show movement. Each strip samples one transition at even
 * points through departure, travel and arrival, so a reviewer can see the shape of
 * the move rather than only where it stopped.
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
const OUT = path.join(MODULE_ROOT, 'qa', 'evidence-transitions', 'filmstrips');
const PORT = Number(process.env.IW_FILM_PORT || 4620);
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webm': 'video/webm', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };

const server = http.createServer(async (q, r) => {
  try {
    const d = decodeURIComponent((q.url || '/').split('?')[0]).replace(/^\/+/, '');
    let f = path.resolve(REPO_ROOT, d || 'index.html');
    if (fsSync.existsSync(f) && fsSync.statSync(f).isDirectory()) f = path.join(f, 'index.html');
    r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
    r.end(await fs.readFile(f));
  } catch { r.writeHead(404).end(); }
});
await new Promise((r) => server.listen(PORT, '127.0.0.1', r));
await fs.mkdir(OUT, { recursive: true });

// One per family, chosen for what each has to prove.
const STRIPS = [
  { to: 'step.03b-campo', tag: 'T1_micro_campo-A-B' },
  { to: 'step.03-lleva-horizonte', tag: 'T3_traverse_campo-horizonte' },
  { to: 'step.06h-lleva-vasija', tag: 'T3_traverse_estudio-vasija' },
  { to: 'step.06k-vasija-detalle', tag: 'T4_orbit_vasija-C-D' },
  { to: 'step.07-lleva-umbral', tag: 'T5_threshold_vasija-umbral' },
  { to: 'step.06d-lleva-estudio', tag: 'T2_local_division-estudio' }
];
const FRAMES = 6;

const browser = await chromium.launch({ headless: true, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.setDefaultTimeout(600000);
await page.goto(`http://127.0.0.1:${PORT}/labs/immersive-worlds/index.html?tier=HIGH`, { waitUntil: 'load' });
await page.waitForFunction(() => window.__IW?.ready === true, { timeout: 600000 });
await page.evaluate(() => { window.__IW.hud.el.veil.hidden = true; });

const manifest = [];
for (const strip of STRIPS) {
  const info = await page.evaluate(async ({ to }) => {
    const rt = window.__IW.runtime; const d = rt.experience;
    rt.startRoute(rt.defaultRouteId); d.pause();
    let g = 0;
    while (d.steps[d.index + 1] && d.steps[d.index + 1].id !== to && g++ < 40) {
      d._advance();
      if (d._pendingStep) { try { await d._pendingStep; } catch { /* elsewhere */ } }
      for (let i = 0; i < 240; i += 1) { rt.clock.tick?.(1 / 60); rt.camera.update(1 / 60); rt.sceneKit.update?.(1 / 60, i / 60); }
    }
    d._advance();
    if (d._pendingStep) { try { await d._pendingStep; } catch { /* elsewhere */ } }
    // How long the move will run, so the samples can be evenly spaced across it.
    let total = 0;
    const probe = [];
    for (let i = 0; i < 900; i += 1) { probe.push(1); if (!rt.directed.isTravelling && i > 2) break; total = i; }
    return { family: d._lastTransition, totalFramesGuess: total, caption: d.currentStep?.caption ?? '' };
  }, { to: strip.to });

  // Re-run the same move, this time stopping to photograph.
  const shots = [];
  for (let f = 0; f < FRAMES; f += 1) {
    const at = await page.evaluate(async ({ to, index, frames }) => {
      const rt = window.__IW.runtime; const d = rt.experience;
      rt.startRoute(rt.defaultRouteId); d.pause();
      let g = 0;
      while (d.steps[d.index + 1] && d.steps[d.index + 1].id !== to && g++ < 40) {
        d._advance();
        if (d._pendingStep) { try { await d._pendingStep; } catch { /* elsewhere */ } }
        for (let i = 0; i < 240; i += 1) { rt.clock.tick?.(1 / 60); rt.camera.update(1 / 60); rt.sceneKit.update?.(1 / 60, i / 60); }
      }
      d._advance();
      if (d._pendingStep) { try { await d._pendingStep; } catch { /* elsewhere */ } }
      // Run the clock to the requested fraction of the move and stop there.
      let ran = 0;
      const cap = 900;
      const marks = [];
      for (let i = 0; i < cap; i += 1) {
        rt.clock.tick?.(1 / 60); rt.camera.update(1 / 60); rt.sceneKit.update?.(1 / 60, i / 60);
        marks.push(rt.directed.isTravelling);
        ran = i;
        if (!rt.directed.isTravelling && i > 2) break;
      }
      const target = Math.round((index / (frames - 1)) * ran);
      // Replay to exactly that frame.
      rt.startRoute(rt.defaultRouteId); d.pause();
      let h = 0;
      while (d.steps[d.index + 1] && d.steps[d.index + 1].id !== to && h++ < 40) {
        d._advance();
        if (d._pendingStep) { try { await d._pendingStep; } catch { /* elsewhere */ } }
        for (let i = 0; i < 240; i += 1) { rt.clock.tick?.(1 / 60); rt.camera.update(1 / 60); rt.sceneKit.update?.(1 / 60, i / 60); }
      }
      d._advance();
      if (d._pendingStep) { try { await d._pendingStep; } catch { /* elsewhere */ } }
      for (let i = 0; i <= target; i += 1) { rt.clock.tick?.(1 / 60); rt.camera.update(1 / 60); rt.sceneKit.update?.(1 / 60, i / 60); }
      return { frame: target, of: ran, pose: rt.camera.pose.position.map((n) => +n.toFixed(2)) };
    }, { to: strip.to, index: f, frames: FRAMES });

    const file = `${strip.tag}_${String(f).padStart(2, '0')}.png`;
    await page.screenshot({ path: path.join(OUT, file) });
    shots.push({ ...at, file });
  }
  manifest.push({ ...strip, family: info.family, caption: info.caption, shots });
  console.log(`  ok ${strip.tag.padEnd(34)} ${String(info.family).padEnd(22)} ${shots.length} fotogramas`);
}

await fs.writeFile(path.join(OUT, 'filmstrips.json'), JSON.stringify({ generatedAt: new Date().toISOString(), manifest }, null, 1));
await browser.close();
server.close();
