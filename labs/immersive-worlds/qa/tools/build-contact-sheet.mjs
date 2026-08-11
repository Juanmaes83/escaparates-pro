/**
 * Builds the human review page from qa/evidence-grammar/current/audit.json.
 *
 * Two views, because they answer different questions:
 *   MATRIX  — A/B/C/D down, Artwork Stops across. Is this one family?
 *   TOUR    — the real order, start to finish. Does it have rhythm?
 *
 * Images are embedded so the page is self-contained and can be published.
 */

import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CURRENT = path.resolve(HERE, '..', 'evidence-grammar', 'current');
const OUTFILE = path.resolve(HERE, '..', 'evidence-grammar', 'contact-sheet.html');

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// Full-resolution PNGs of 21 beats come to ~62 MB embedded, far past what a
// published page may weigh. They are downscaled through a headless canvas — no
// image tooling is installed here and none is worth adding for this.
const browser = await chromium.launch({ headless: true });
const shrinker = await browser.newPage();
await shrinker.setContent('<html><body></body></html>');

async function dataUri(file, width = 760, quality = 0.74, dir = CURRENT) {
  if (!file) return null;
  try {
    const buf = await fs.readFile(path.join(dir, file));
    return await shrinker.evaluate(async ({ b64, width, quality }) => {
      const img = new Image();
      img.src = `data:image/png;base64,${b64}`;
      await img.decode();
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = Math.round((img.height / img.width) * width);
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/jpeg', quality);
    }, { b64: buf.toString('base64'), width, quality });
  } catch { return null; }
}

const BEFORE = path.resolve(HERE, '..', 'evidence-grammar', 'before-passb');
const report = JSON.parse(await fs.readFile(path.join(CURRENT, 'audit.json'), 'utf8'));
let beforeReport = null;
try { beforeReport = JSON.parse(await fs.readFile(path.join(BEFORE, 'audit.json'), 'utf8')); } catch { /* first run */ }
const uris = new Map();
for (const beat of report.beats) uris.set(beat.beatId, await dataUri(beat.file));

// The five beats PASS B corrected, shown side by side with the state that proved
// them broken. Kept in their own section so no historical frame can be mistaken
// for the current canonical state.
const CORRECTED = ['step.03-lleva-horizonte', 'step.05-lleva-division', 'step.09-lleva-noche',
  'step.10c-lleva-cuaderno', 'step.10f-noche-contemplacion'];
const beforeUris = new Map();
if (beforeReport) {
  for (const id of CORRECTED) {
    const b = beforeReport.beats.find((x) => x.beatId === id);
    if (b?.file) beforeUris.set(id, await dataUri(b.file, 620, 0.74, BEFORE));
  }
}
await browser.close();

const ARTWORK_STOPS = [...new Set(report.beats.filter((b) => b.role === 'C' && b.visitor === 'presente').map((b) => b.tourOrder))]
  .sort((a, b) => a - b);
const ROLES = ['A', 'B', 'C', 'D'];
const ROLE_NAME = { A: 'A · CONTEXTO / LLEGADA', B: 'B · ATENCIÓN COMPARTIDA', C: 'C · CONTEMPLACIÓN HUMANA', D: 'D · POV PURO DE LA OBRA' };

// Stop 04 is a transition experience, not an artwork encounter. Calling its lead
// "A" in the ordered sheet would imply Artwork Grammar applies there; it does not.
// The Projection keeps A/B/C/D because its specialisation is documented.
const TRANSITION_STOPS = new Set([4]);
const orderedRole = (beat) => {
  if (beat.role === 'TRANSITION') return 'TRANSICIÓN DE ESPACIO';
  if (TRANSITION_STOPS.has(beat.tourOrder)) return 'APROXIMACIÓN / UMBRAL';
  if (beat.role === 'CLOSE') return 'CIERRE';
  return beat.role;
};

function cell(beat) {
  if (!beat) return '<td class="empty">—</td>';
  const uri = uris.get(beat.beatId);
  const drift = beat.targetDrift;
  const driftClass = drift === null ? '' : drift > 2.5 ? 'bad' : drift > 1.2 ? 'warn' : 'good';
  return `<td>
    ${uri ? `<a href="${uri}" target="_blank"><img src="${uri}" alt="${esc(beat.beatId)}" loading="lazy"></a>`
      : '<div class="missing">SIN CAPTURA — no asentado</div>'}
    <dl>
      <div><dt>obra esperada</dt><dd>${esc(beat.expectedTitle)}</dd></div>
      <div><dt>cámara apunta a</dt><dd class="${driftClass}">${beat.target.join(', ')}${drift === null ? '' : ` · deriva ${drift} m`}</dd></div>
      <div><dt>guía</dt><dd>${esc(beat.guide)}</dd></div>
      <div><dt>visitante</dt><dd>${esc(beat.visitor)}</dd></div>
      <div><dt>beat</dt><dd class="mono">${esc(beat.beatId)}</dd></div>
    </dl>
  </td>`;
}

const matrixRows = ROLES.map((role) => {
  const cells = ARTWORK_STOPS.map((order) =>
    cell(report.beats.find((b) => b.tourOrder === order && b.role === role))).join('\n');
  return `<tr><th class="role">${ROLE_NAME[role]}</th>\n${cells}</tr>`;
}).join('\n');

const stopHeads = ARTWORK_STOPS.map((order) => {
  const any = report.beats.find((b) => b.tourOrder === order);
  return `<th>PARADA ${String(order).padStart(2, '0')}<span>${esc(any?.tourTitle || '')}</span></th>`;
}).join('');

const tourCards = report.beats.map((beat) => {
  const uri = uris.get(beat.beatId);
  return `<figure class="shot role-${beat.role}">
    ${uri ? `<a href="${uri}" target="_blank"><img src="${uri}" alt="${esc(beat.beatId)}" loading="lazy"></a>`
      : '<div class="missing">SIN CAPTURA</div>'}
    <figcaption>
      <span class="tag">${beat.tourOrder ? `P${String(beat.tourOrder).padStart(2, '0')}` : '—'} · ${esc(orderedRole(beat))}</span>
      <strong>${esc(beat.tourTitle || beat.beatId)}</strong>
      <span class="mono">${esc(beat.beatId)}</span>
      <span class="cap">${esc(beat.caption)}</span>
    </figcaption>
  </figure>`;
}).join('\n');

const suspectRows = report.suspects.length
  ? report.suspects.map((s) => `<tr><td class="mono">${esc(s.aRole)} · ${esc(s.a)}</td><td class="mono">${esc(s.bRole)} · ${esc(s.b)}</td><td class="num">${s.mad}</td></tr>`).join('\n')
  : '<tr><td colspan="3">Ningún par por debajo del umbral.</td></tr>';

const html = `<title>Museo — Auditoría visual de la gramática de obra</title>
<style>
  :root {
    --bg: #f5f3ef; --panel: #fffefb; --ink: #1b1917; --muted: #6d675e;
    --line: #ddd7cc; --good: #2f6b45; --warn: #8a6410; --bad: #96331f; --accent: #1b1917;
  }
  :root:not([data-theme="light"]) { }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
      --bg: #141311; --panel: #1c1a17; --ink: #ece7de; --muted: #9a9287;
      --line: #35312b; --good: #7fbf98; --warn: #d6ab5c; --bad: #e08b74; --accent: #ece7de;
    }
  }
  :root[data-theme="dark"] {
    --bg: #141311; --panel: #1c1a17; --ink: #ece7de; --muted: #9a9287;
    --line: #35312b; --good: #7fbf98; --warn: #d6ab5c; --bad: #e08b74; --accent: #ece7de;
  }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--ink);
    font: 15px/1.55 ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; }
  .wrap { max-width: 1600px; margin: 0 auto; padding: 40px 24px 80px; }
  h1 { font-size: 26px; font-weight: 600; letter-spacing: -0.01em; margin: 0 0 6px; }
  h2 { font-size: 18px; font-weight: 600; margin: 48px 0 6px; padding-top: 20px; border-top: 1px solid var(--line); }
  p.lede { color: var(--muted); margin: 0 0 8px; max-width: 78ch; }
  .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11px; }
  .scroll { overflow-x: auto; }
  table.matrix { border-collapse: collapse; width: 100%; min-width: 1100px; }
  table.matrix th, table.matrix td { border: 1px solid var(--line); vertical-align: top; padding: 10px; background: var(--panel); }
  table.matrix thead th { position: sticky; top: 0; background: var(--bg); font-size: 12px;
    letter-spacing: 0.09em; text-transform: uppercase; text-align: left; z-index: 2; }
  table.matrix thead th span { display: block; text-transform: none; letter-spacing: 0; color: var(--muted); font-weight: 400; }
  th.role { width: 150px; font-size: 11px; letter-spacing: 0.09em; text-align: left; color: var(--muted); vertical-align: top; }
  table.matrix img { width: 100%; height: auto; display: block; border: 1px solid var(--line); }
  dl { margin: 8px 0 0; font-size: 11.5px; }
  dl div { display: flex; gap: 6px; padding: 1px 0; }
  dt { color: var(--muted); min-width: 88px; }
  dd { margin: 0; }
  dd.good { color: var(--good); } dd.warn { color: var(--warn); } dd.bad { color: var(--bad); font-weight: 600; }
  .missing { padding: 28px 10px; text-align: center; color: var(--bad); border: 1px dashed var(--bad); font-size: 12px; }
  .tour { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 14px; margin-top: 16px; }
  figure.shot { margin: 0; background: var(--panel); border: 1px solid var(--line); }
  figure.shot img { width: 100%; height: auto; display: block; }
  figcaption { padding: 8px 10px; display: flex; flex-direction: column; gap: 2px; font-size: 12px; }
  .tag { font-size: 10px; letter-spacing: 0.1em; color: var(--muted); }
  .cap { color: var(--muted); font-style: italic; }
  .role-C { outline: 2px solid var(--accent); outline-offset: -2px; }
  table.plain { border-collapse: collapse; width: 100%; margin-top: 12px; font-size: 13px; }
  table.plain th, table.plain td { border-bottom: 1px solid var(--line); padding: 7px 10px; text-align: left; }
  td.num { text-align: right; font-variant-numeric: tabular-nums; }
  .note { background: var(--panel); border-left: 3px solid var(--accent); padding: 12px 16px; margin: 16px 0; max-width: 90ch; }
</style>
<div class="wrap">
  <h1>Museo — auditoría visual de la gramática de obra</h1>
  <p class="lede">Capturas del recorrido en ejecución, todas del estado canónico actual.
  Ninguna imagen histórica se mezcla aquí. Generado ${esc(report.generatedAt)} · render ${esc(report.viewport)} · imágenes reescaladas para la web; los PNG a resolución completa están en <span class="mono">qa/evidence-grammar/current/</span>.</p>

  <div class="note"><strong>Cómo juzgar.</strong> El criterio no es «¿se parecen?» sino
  «¿es la instancia espacial correcta y legible de esta función para <em>esta</em> obra?».
  Las paradas 02 y 03 comparten sala y muro: parecerse es coherencia, no defecto.
  Defecto es ambigüedad, obra equivocada, instancia espacial equivocada o estado caduco.</div>

  <h2>1 · Matriz A/B/C/D — comparación horizontal</h2>
  <p class="lede">Filas: función. Columnas: obra. Cada celda es una imagen ampliable.</p>
  <div class="scroll">
    <table class="matrix">
      <thead><tr><th></th>${stopHeads}</tr></thead>
      <tbody>${matrixRows}</tbody>
    </table>
  </div>

  <h2>2 · Recorrido completo en orden — ritmo y continuidad</h2>
  <p class="lede">Los ${report.beats.length} beats tal y como se viven, de la bienvenida al cierre.
  Los beats C van recuadrados.</p>
  <div class="tour">${tourCards}</div>

  <h2>3 · Antes y después — los cinco beats corregidos</h2>
  <p class="lede">Izquierda: el estado que la auditoría demostró roto. Derecha: el estado actual.
  Las imágenes de la izquierda son <strong>históricas</strong> y no forman parte de la matriz de arriba.</p>
  <div class="tour">${CORRECTED.map((id) => {
    const beat = report.beats.find((b) => b.beatId === id);
    const before = beforeUris.get(id);
    const after = uris.get(id);
    const prev = beforeReport?.beats.find((b) => b.beatId === id);
    if (!beat) return '';
    return `<figure class="shot" style="grid-column:span 2">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">
        <div>${before ? `<a href="${before}" target="_blank"><img src="${before}"></a>` : '<div class="missing">—</div>'}
          <div class="tag" style="padding:4px 6px">ANTES · deriva ${prev?.targetDrift ?? '—'} m</div></div>
        <div>${after ? `<a href="${after}" target="_blank"><img src="${after}"></a>` : '<div class="missing">—</div>'}
          <div class="tag" style="padding:4px 6px">DESPUÉS · deriva ${beat.targetDrift ?? '—'} m</div></div>
      </div>
      <figcaption><strong>P${String(beat.tourOrder).padStart(2, '0')} · ${esc(beat.role)} — ${esc(beat.tourTitle)}</strong>
      <span class="mono">${esc(beat.beatId)}</span></figcaption>
    </figure>`;
  }).join('\n')}</div>

  <h2>4 · Pares perceptualmente próximos</h2>
  <p class="lede">Diferencia media por píxel sobre el render (sin HUD), 0 = idénticos.
  Esto <strong>señala dónde mirar</strong>; no dictamina nada.</p>
  <table class="plain">
    <thead><tr><th>beat A</th><th>beat B</th><th class="num">diferencia</th></tr></thead>
    <tbody>${suspectRows}</tbody>
  </table>

  <h2>5 · Capturas no asentadas</h2>
  <p class="lede">${report.unsettled.length
    ? `Rechazadas por no estabilizarse: <span class="mono">${report.unsettled.map(esc).join(', ')}</span>`
    : 'Ninguna. Todos los beats se estabilizaron antes de capturar.'}</p>
</div>`;

await fs.writeFile(OUTFILE, html);
console.log(`contact sheet → ${path.relative(process.cwd(), OUTFILE)}  (${(html.length / 1048576).toFixed(2)} MB)`);
console.log(`paradas de obra: ${ARTWORK_STOPS.join(', ')} · beats: ${report.beats.length} · sospechosos: ${report.suspects.length}`);
