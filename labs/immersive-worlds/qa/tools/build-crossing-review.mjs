/**
 * Turn the Block 2B crossing evidence into something a Product Owner can judge.
 *
 * The eight moments in order, the measured verdicts beside them, and the trace
 * plotted so the handoff can be seen happening in the middle of the move rather
 * than taken on trust.
 *
 *   node qa/tools/build-crossing-review.mjs
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(HERE, '..', 'evidence-crossing');
const report = JSON.parse(await fs.readFile(path.join(OUT, 'crossing.json'), 'utf8'));

const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const pass = report.checks.filter((c) => c.ok).length;

/* -- the trace, drawn ------------------------------------------------------- */
const trace = report.trace.filter((t) => t.crossing);
const gate = report.threshold.gate[0];
const xs = trace.map((t) => t.position[0]);
const minX = Math.min(...xs, gate) - 0.4;
const maxX = Math.max(...xs, gate) + 0.4;
const W = 900; const H = 190;
const px = (x) => ((x - minX) / (maxX - minX)) * W;

const exposures = trace.map((t) => t.exposure);
const eLo = Math.min(...exposures); const eHi = Math.max(...exposures);
const py = (e) => H - 30 - ((e - eLo) / Math.max(eHi - eLo, 1e-6)) * (H - 70);

const line = trace.map((t, i) => `${i ? 'L' : 'M'}${px(t.position[0]).toFixed(1)},${py(t.exposure).toFixed(1)}`).join(' ');
const handoffX = report.metrics.handoffFrame >= 0
  ? px(report.trace[report.metrics.handoffFrame].position[0]) : null;

const chart = `
<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Exposure against camera position through the crossing">
  <rect x="0" y="0" width="${W}" height="${H}" fill="none"/>
  <line x1="${px(gate).toFixed(1)}" y1="14" x2="${px(gate).toFixed(1)}" y2="${H - 26}" stroke="var(--edge)" stroke-width="2" stroke-dasharray="4 4"/>
  <text x="${(px(gate) + 8).toFixed(1)}" y="26" fill="var(--dim)" font-size="12">wall plane x=${gate}</text>
  ${handoffX !== null ? `<circle cx="${handoffX.toFixed(1)}" cy="${py(report.trace[report.metrics.handoffFrame].exposure).toFixed(1)}" r="5" fill="var(--hot)"/>
  <text x="${(handoffX + 10).toFixed(1)}" y="${(py(report.trace[report.metrics.handoffFrame].exposure) - 10).toFixed(1)}" fill="var(--hot)" font-size="12">room handoff</text>` : ''}
  <path d="${line}" fill="none" stroke="var(--ink)" stroke-width="2.5"/>
  <text x="4" y="${H - 8}" fill="var(--dim)" font-size="12">x=${minX.toFixed(1)} m (Galería A)</text>
  <text x="${W - 4}" y="${H - 8}" fill="var(--dim)" font-size="12" text-anchor="end">x=${maxX.toFixed(1)} m (Galería B)</text>
  <text x="4" y="26" fill="var(--dim)" font-size="12">exposure ${eLo.toFixed(2)} → ${eHi.toFixed(2)}</text>
</svg>`;

const html = `<!doctype html>
<html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Crossing — Galería A → Galería B</title>
<style>
  :root {
    --bg:#faf9f7; --panel:#fff; --ink:#1b1a18; --dim:#6f6a63; --edge:#d8d2c8;
    --ok:#2f6b3f; --bad:#9c2b21; --hot:#a8621a;
  }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
      --bg:#131211; --panel:#1c1b19; --ink:#efece6; --dim:#a09a91; --edge:#35322d;
      --ok:#7fbf8e; --bad:#e08a80; --hot:#e0a45c;
    }
  }
  :root[data-theme="dark"] {
    --bg:#131211; --panel:#1c1b19; --ink:#efece6; --dim:#a09a91; --edge:#35322d;
    --ok:#7fbf8e; --bad:#e08a80; --hot:#e0a45c;
  }
  * { box-sizing:border-box; }
  body { margin:0; background:var(--bg); color:var(--ink);
    font:16px/1.55 ui-serif,Georgia,"Times New Roman",serif; padding:40px 24px 80px; }
  main { max-width:1080px; margin:0 auto; }
  h1 { font-size:28px; margin:0 0 4px; letter-spacing:-0.01em; }
  .sub { color:var(--dim); margin:0 0 28px; font-size:14px;
    font-family:ui-monospace,SFMono-Regular,Menlo,monospace; }
  h2 { font-size:19px; margin:38px 0 14px; border-bottom:1px solid var(--edge); padding-bottom:7px; }
  .verdict { display:flex; flex-wrap:wrap; gap:10px; margin:0 0 8px; }
  .chip { border:1px solid var(--edge); border-radius:999px; padding:5px 13px; font-size:13px;
    background:var(--panel); font-family:ui-monospace,SFMono-Regular,Menlo,monospace; }
  .chip.ok { color:var(--ok); } .chip.bad { color:var(--bad); }
  table { border-collapse:collapse; width:100%; font-size:14px; }
  td,th { border-bottom:1px solid var(--edge); padding:8px 10px; text-align:left; vertical-align:top; }
  th { color:var(--dim); font-weight:400; font-size:13px; }
  td.n { font-family:ui-monospace,SFMono-Regular,Menlo,monospace; color:var(--dim); white-space:nowrap; }
  .ok { color:var(--ok); } .bad { color:var(--bad); }
  figure { margin:0 0 26px; background:var(--panel); border:1px solid var(--edge); border-radius:8px; overflow:hidden; }
  figure img { display:block; width:100%; height:auto; }
  figcaption { padding:11px 14px; font-size:14px; }
  figcaption b { font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-size:12px;
    color:var(--dim); font-weight:400; display:block; margin-bottom:2px; letter-spacing:0.04em; }
  .panel { background:var(--panel); border:1px solid var(--edge); border-radius:8px; padding:16px 18px; }
  .scroll { overflow-x:auto; }
  p { max-width:70ch; }
</style></head>
<body><main>

<h1>Crossing — Galería A → Galería B</h1>
<p class="sub">RUN_ID ${esc(report.runId)} · ${esc(report.generatedAt)} · ${esc(report.portal)}</p>

<p>The room-to-room transition, replacing the cut. Every frame below was captured by
stepping the runtime by hand with the render loop stopped, so each image is a named
frame of one crossing rather than whatever the browser was showing.</p>

<div class="verdict">
  <span class="chip ${pass === report.checks.length ? 'ok' : 'bad'}">${pass}/${report.checks.length} checks</span>
  <span class="chip">${report.metrics.crossingFrames} frames in flight</span>
  <span class="chip">handoff ${report.metrics.handoffDistanceFromWall} m from the wall</span>
  <span class="chip">endpoint Δ ${report.metrics.endpointDelta === 0 ? '0' : report.metrics.endpointDelta?.toExponential(1)} m</span>
  <span class="chip">max turn ${report.metrics.maxTurnPerFrameDeg} °/frame</span>
</div>

<h2>The eight moments</h2>
${report.shots.map((s) => `<figure>
  <img src="${esc(s.file)}" alt="${esc(s.caption)}" loading="lazy">
  <figcaption><b>${esc(s.id)}</b>${esc(s.caption)}</figcaption>
</figure>`).join('\n')}

<h2>Where the room changes</h2>
<p>Exposure against the camera's position along the crossing axis. Galería A is lit at
0.95 and the dark chamber at 1.05; the line shows the change resolving <em>across</em> the
opening rather than on one frame. The marked point is where the active Space actually
changes — inside the doorway, which is both the truthful moment and the invisible one.</p>
<div class="panel">${chart}</div>

<h2>Verdicts</h2>
<div class="scroll"><table>
<tr><th></th><th>check</th><th>measured</th></tr>
${report.checks.map((c) => `<tr>
  <td class="${c.ok ? 'ok' : 'bad'}">${c.ok ? '✓' : '✗'}</td>
  <td>${esc(c.name)}</td><td class="n">${esc(c.detail || '')}</td>
</tr>`).join('\n')}
</table></div>

<h2>First crossing against a repeated one</h2>
<p>The destination is built, warmed and already visible through the opening before the
camera commits to it, so the first crossing is not a cold path. These are the same
mechanism run again, warm, for comparison.</p>
<div class="scroll"><table>
<tr><th>portal</th><th>warm wait</th><th>travel</th><th>frames</th><th>median frame</th><th>worst frame</th></tr>
${report.repeat.map((r) => `<tr>
  <td>${esc(r.portalId.replace('portal.', ''))}</td>
  <td class="n">${r.warmedMs} ms</td><td class="n">${Math.round(r.travelMs)} ms</td>
  <td class="n">${r.frames}</td><td class="n">${r.medianFrameMs} ms</td><td class="n">${r.worstFrameMs} ms</td>
</tr>`).join('\n')}
</table></div>

<h2>Aperture and endpoint</h2>
<div class="scroll"><table>
<tr><td>opening</td><td class="n">${report.threshold.width} × ${report.threshold.height} m, ${esc(report.threshold.wall)} wall of ${esc(report.threshold.spaceId)}</td></tr>
<tr><td>gate point</td><td class="n">[${report.threshold.gate.map((n) => n.toFixed(2)).join(', ')}]</td></tr>
<tr><td>outward axis</td><td class="n">[${report.threshold.axis.join(', ')}]</td></tr>
<tr><td>arrival pose</td><td class="n">[${report.arrivalPose.position.map((n) => n.toFixed(3)).join(', ')}] → [${report.arrivalPose.target.map((n) => n.toFixed(3)).join(', ')}]</td></tr>
<tr><td>landed at</td><td class="n">[${report.after.pose.position.map((n) => n.toFixed(3)).join(', ')}] → [${report.after.pose.target.map((n) => n.toFixed(3)).join(', ')}]</td></tr>
<tr><td>frames outside the aperture</td><td class="n">${report.metrics.apertureFramesOutside}</td></tr>
<tr><td>camera authority violations</td><td class="n">${report.after.violations}</td></tr>
</table></div>

</main></body></html>`;

await fs.writeFile(path.join(OUT, 'crossing-review.html'), html);
console.log(`wrote qa/evidence-crossing/crossing-review.html — ${pass}/${report.checks.length} checks, ${report.shots.length} frames`);
