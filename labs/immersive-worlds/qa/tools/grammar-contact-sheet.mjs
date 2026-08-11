/**
 * Museum — Artwork Grammar visual audit (PASS A, read-only)
 *
 * Captures the canonical beats of the running tour and reports what is actually
 * on screen, so the grammar can be judged by eye rather than by state variables.
 *
 * Two rules govern this file:
 *
 *   1. It mutates nothing. It drives the prototype and writes to qa/ only.
 *   2. It refuses to capture an unsettled frame. A screenshot taken mid-flight is
 *      worse than no screenshot: it looks like evidence and it lies. If a beat
 *      will not settle, the capture is recorded as FAILED and the run continues.
 *
 * The perceptual hash is read from the WebGL canvas, not from the page, so the
 * DOM HUD cannot dominate the similarity comparison — two different beats sharing
 * the same caption bar must still be told apart by their render.
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
const OUT = path.join(MODULE_ROOT, 'qa', 'evidence-grammar', 'current');
const PORT = Number(process.env.IW_AUDIT_PORT || 4310);

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.png': 'image/png',
  '.svg': 'image/svg+xml', '.webm': 'video/webm', '.jpg': 'image/jpeg'
};

function startServer() {
  const server = http.createServer(async (req, res) => {
    try {
      const decoded = decodeURIComponent((req.url || '/').split('?')[0]).replace(/^\/+/, '');
      let file = path.resolve(REPO_ROOT, decoded || 'index.html');
      if (!file.startsWith(REPO_ROOT)) return res.writeHead(403).end('Forbidden');
      if (fsSync.existsSync(file) && fsSync.statSync(file).isDirectory()) file = path.join(file, 'index.html');
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      res.end(await fs.readFile(file));
    } catch { res.writeHead(404).end('Not found'); }
  });
  return new Promise((resolve) => server.listen(PORT, '127.0.0.1', () => resolve(server)));
}

/** Grammar role, derived from the authored intent rather than from the beat's name. */
const ROLE = {
  ENTRY: 'A', LEAD: 'A', ACCOMPANIED: 'B', CONTEMPLATION: 'C', FOCUS: 'D',
  PORTAL: 'TRANSITION', EXIT: 'CLOSE'
};

async function main() {
  await fs.mkdir(OUT, { recursive: true });
  const server = await startServer();
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-gpu-sandbox']
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.setDefaultTimeout(600000);
  const consoleErrors = [];
  page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });

  await page.goto(`http://127.0.0.1:${PORT}/labs/immersive-worlds/index.html?reducedMotion=1&tier=HIGH`, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__IW?.ready === true, { timeout: 600000 });
  await page.evaluate(() => { window.__IW.hud.el.veil.hidden = true; });

  await page.evaluate(() => {
    const rt = window.__IW.runtime;
    rt.experience.reducedMotion = true;
    rt.startRoute(rt.defaultRouteId);
    rt.experience.pause();
  });

  const beats = [];
  for (let guard = 0; guard < 40; guard += 1) {
    const probe = await page.evaluate(async () => {
      const rt = window.__IW.runtime;
      const d = rt.experience;
      if (d.transport === 'IDLE' || !d.currentStep) return null;
      const step = d.currentStep;

      /* -- settle ---------------------------------------------------------- */
      // Drive the kit until nothing is moving any more, then prove it is still.
      const sample = () => {
        const g = rt.sceneKit._guide;
        const v = rt.sceneKit._visitor;
        return {
          pose: [...rt.camera.pose.position, ...rt.camera.pose.target],
          guide: g ? g.current.opacity : -1,
          visitor: v ? v.current.opacity : -1,
          guidePos: g ? [...g.current.position] : [],
          owner: rt.camera.owner
        };
      };
      const spin = (n) => { for (let i = 0; i < n; i += 1) rt.sceneKit.update?.(1 / 60, i / 60); };

      spin(1200);
      let settled = false;
      let previous = sample();
      for (let attempt = 0; attempt < 12 && !settled; attempt += 1) {
        spin(120);
        const now = sample();
        const drift = Math.max(
          ...now.pose.map((n, i) => Math.abs(n - previous.pose[i])),
          Math.abs(now.guide - previous.guide),
          Math.abs(now.visitor - previous.visitor),
          ...now.guidePos.map((n, i) => Math.abs(n - previous.guidePos[i]))
        );
        settled = drift < 1e-3 && now.owner === previous.owner && now.owner !== 'TRANSITION';
        previous = now;
      }

      /* -- what is actually on screen -------------------------------------- */
      const expectedRef = step.subjectRef || null;
      const expected = expectedRef ? rt.store.entities.find((e) => e.id === expectedRef) : null;
      const anchorPose = expected ? rt.sceneKit._anchorPoses.get(expected.anchorId) : null;
      const target = rt.camera.pose.target;
      // Distance from where the camera is aimed to where the beat's own subject
      // actually hangs. A large drift means the shot is framing something else.
      const targetDrift = anchorPose
        ? Math.hypot(target[0] - anchorPose.position[0], target[1] - anchorPose.position[1], target[2] - anchorPose.position[2])
        : null;

      // Perceptual fingerprint from the render surface only: the HUD is DOM and
      // never reaches this canvas, so captions cannot mask a duplicate shot.
      const canvas = document.querySelector('canvas');
      const small = document.createElement('canvas');
      small.width = 32; small.height = 32;
      const ctx = small.getContext('2d');
      ctx.drawImage(canvas, 0, 0, 32, 32);
      const px = ctx.getImageData(0, 0, 32, 32).data;
      const hash = [];
      for (let i = 0; i < px.length; i += 4) {
        hash.push(Math.round(0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]));
      }

      const vis = (fig) => (fig?.object?.visible && fig.current.opacity > 0.5 ? 'presente' : 'ausente');
      return {
        settled,
        beatId: step.id,
        intent: step.shotIntent,
        caption: step.caption || '',
        duration: step.duration,
        tourStepId: d.currentTourStep?.id ?? null,
        tourOrder: d.currentTourStep?.order ?? 0,
        tourTitle: d.currentTourStep?.title ?? '',
        beatIndex: d.index,
        expectedRef,
        expectedTitle: expected?.content?.title || expected?.title || expectedRef || '—',
        spaceId: rt.state.activeSpaceId,
        guide: vis(rt.sceneKit._guide),
        visitor: vis(rt.sceneKit._visitor),
        authority: rt.camera.owner,
        position: rt.camera.pose.position.map((n) => +n.toFixed(2)),
        target: target.map((n) => +n.toFixed(2)),
        targetDrift: targetDrift === null ? null : +targetDrift.toFixed(2),
        hash
      };
    });
    if (!probe) break;

    const role = ROLE[probe.intent] || '?';
    const slug = probe.tourOrder
      ? `stop${String(probe.tourOrder).padStart(2, '0')}_${role}_${probe.intent.toLowerCase()}_${probe.beatId.replace(/^step\./, '')}`
      : `beat_${probe.beatId.replace(/^step\./, '')}`;
    const file = `${slug}.png`;

    if (probe.settled) {
      await page.screenshot({ path: path.join(OUT, file) });
    } else {
      // Refuse to produce a misleading frame.
      console.log(`  !! NO ASENTADO  ${probe.beatId} — no se captura`);
    }
    beats.push({ ...probe, role, file: probe.settled ? file : null, captureType: 'CURRENT_CANONICAL' });
    console.log(
      `  ${probe.settled ? 'ok' : '!!'}  ${String(probe.tourOrder).padStart(2, '0')} ${role.padEnd(10)} ` +
      `${probe.beatId.padEnd(36)} obra=${probe.expectedTitle.slice(0, 24).padEnd(24)} ` +
      `guía=${probe.guide.padEnd(8)} visitante=${probe.visitor.padEnd(8)} deriva=${probe.targetDrift ?? '—'}`
    );

    const advanced = await page.evaluate(async () => {
      const d = window.__IW.runtime.experience;
      if (d.transport === 'IDLE') return false;
      await d._advanceAndSettle();
      return true;
    });
    if (!advanced) break;
  }

  /* -- pairwise similarity, as a pointer for the eye, never as a verdict ---- */
  const suspects = [];
  for (let i = 0; i < beats.length; i += 1) {
    for (let j = i + 1; j < beats.length; j += 1) {
      const a = beats[i]; const b = beats[j];
      if (!a.hash || !b.hash) continue;
      let sum = 0;
      for (let k = 0; k < a.hash.length; k += 1) sum += Math.abs(a.hash[k] - b.hash[k]);
      const mad = sum / a.hash.length;
      if (mad < 6) suspects.push({ a: a.beatId, b: b.beatId, mad: +mad.toFixed(2), aRole: a.role, bRole: b.role });
    }
  }
  suspects.sort((x, y) => x.mad - y.mad);

  const report = {
    generatedAt: new Date().toISOString(),
    captureType: 'CURRENT_CANONICAL',
    viewport: '1440x900',
    consoleErrors,
    beats: beats.map(({ hash, ...rest }) => rest),
    suspects,
    unsettled: beats.filter((b) => !b.settled).map((b) => b.beatId)
  };
  await fs.writeFile(path.join(OUT, 'audit.json'), JSON.stringify(report, null, 1));

  console.log(`\n  beats: ${beats.length} · no asentados: ${report.unsettled.length} · pares sospechosos: ${suspects.length}`);
  for (const s of suspects.slice(0, 12)) console.log(`    ~ ${s.mad}  ${s.aRole}/${s.a}  vs  ${s.bRole}/${s.b}`);
  console.log(`  errores de consola: ${consoleErrors.length || 'ninguno'}`);

  await browser.close();
  server.close();
}

main().catch((error) => { console.error(error); process.exit(1); });
