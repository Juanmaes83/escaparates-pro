/**
 * CURRENT beside CORRECTED, at the four widths, with the measurements under
 * each pair.
 *
 * The numbers come out of the two audit runs rather than out of this file, so
 * the board cannot claim an improvement the audit did not record. Where the two
 * runs measured different things — the section count changed definition when the
 * markup regrouped — that is said on the board instead of being presented as a
 * gain.
 *
 *   node qa/tools/build-visitor-board.mjs
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MODULE_ROOT = path.resolve(HERE, '..', '..');
const REPO_ROOT = path.resolve(MODULE_ROOT, '../..');
const BASE = path.join(MODULE_ROOT, 'qa', 'evidence-vs02', 'visitor-design');
const OUT = path.join(BASE, 'visitor-board.html');

const load = async (label) => JSON.parse(await fs.readFile(path.join(BASE, label, 'visitor-audit.json'), 'utf8'));
const before = await load('current');
const after = await load('corrected');

const dataUri = async (label, file) => {
  const p = path.join(BASE, label, file);
  try { return `data:image/png;base64,${(await fs.readFile(p)).toString('base64')}`; } catch { return null; }
};

const find = (report, id) => report.viewports.find((v) => v.id === id) || {};

const SHOTS = [
  { key: '01-overview', name: 'Al abrir' },
  { key: '02-programme', name: 'Programación' },
  { key: '03-end', name: 'Final del panel' }
];

const rows = [];
for (const vp of before.viewports) {
  const a = find(after, vp.id);
  const shots = [];
  for (const s of SHOTS) {
    const [b4, af] = await Promise.all([
      dataUri('current', `${vp.id}-${s.key}.png`),
      dataUri('corrected', `${vp.id}-${s.key}.png`)
    ]);
    if (b4 || af) shots.push({ ...s, before: b4, after: af });
  }
  rows.push({ vp, before: vp, after: a, shots });
}

const num = (n) => (typeof n === 'number' ? n : '—');
const yn = (r) => (r ? (r.visible ? 'sí' : 'NO') : '—');

const html = `<title>Visitante — antes y después</title>
<style>
  :root {
    --ink: #1c1a17; --dim: #6f6960; --line: rgba(28,26,23,.14);
    --ground: #f6f3ed; --card: #fffdf9;
    --serif: Georgia, 'Times New Roman', serif;
    --sans: 'Helvetica Neue', Inter, system-ui, Arial, sans-serif;
  }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
      --ink: #ece7dd; --dim: #9a9389; --line: rgba(236,231,221,.16);
      --ground: #14120f; --card: #1b1815;
    }
  }
  :root[data-theme="dark"] {
    --ink: #ece7dd; --dim: #9a9389; --line: rgba(236,231,221,.16);
    --ground: #14120f; --card: #1b1815;
  }
  body { margin: 0; background: var(--ground); color: var(--ink); font-family: var(--sans); line-height: 1.6; }
  .wrap { max-width: 78rem; margin: 0 auto; padding: 3rem 1.5rem 6rem; }
  h1 { font: 400 2rem/1.2 var(--serif); margin: 0 0 .4rem; }
  .lede { color: var(--dim); max-width: 46rem; margin: 0 0 .8rem; }
  .note { border-left: 2px solid var(--line); padding: .2rem 0 .2rem 1rem; color: var(--dim); font-size: .9rem; max-width: 46rem; }
  h2 { font: 400 1.3rem/1.3 var(--serif); margin: 3.4rem 0 .3rem; padding-top: 1.6rem; border-top: 1px solid var(--line); }
  .dims { color: var(--dim); font-size: .82rem; letter-spacing: .04em; margin: 0 0 1.4rem; }
  table { border-collapse: collapse; width: 100%; margin: 0 0 1.8rem; font-size: .86rem; }
  th, td { text-align: left; padding: .5rem .7rem; border-bottom: 1px solid var(--line); }
  th { font-weight: 500; color: var(--dim); font-size: .72rem; letter-spacing: .1em; text-transform: uppercase; }
  td.n { font-variant-numeric: tabular-nums; }
  .pair { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem 1.4rem; margin: 0 0 2rem; }
  .cell { min-width: 0; }
  .cap { font-size: .72rem; letter-spacing: .1em; text-transform: uppercase; color: var(--dim); margin: 0 0 .5rem; }
  .shot { display: block; width: 100%; height: auto; border: 1px solid var(--line); background: var(--card); }
  .shot--tall { max-height: 44rem; object-fit: contain; object-position: top; }
  .scroller { overflow-x: auto; }
  .win { color: var(--ink); }
  .bad { color: #b3402f; }
  @media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) .bad { color: #e08a76; } }
  :root[data-theme="dark"] .bad { color: #e08a76; }
  @media (max-width: 700px) { .pair { grid-template-columns: 1fr; } }
</style>
<div class="wrap">
  <h1>Visitante — antes y después</h1>
  <p class="lede">La capa Visitante con el contenido real de la Fundación Arenas, fotografiada a los cuatro anchos del mandato antes y después de la corrección. La función no cambia: ni un campo retirado, ni un dato reorganizado en el modelo. Cambia la presentación.</p>
  <p class="note">Las cifras salen de las dos ejecuciones de <code>qa/tools/visitor-audit.mjs</code>, no de esta página. Una advertencia sobre una de ellas: el recuento de <em>secciones</em> no es comparable entre las dos columnas — antes contaba cada <code>&lt;section&gt;</code> apilada, y después cuenta cada campo, porque el marcado se reagrupó. Se muestra por transparencia, no como mejora.</p>
  <p class="note" style="margin-top:1rem">APROBACIÓN DE PRODUCTO: PENDIENTE. Esta es una propuesta a revisar, no un estado aprobado.</p>

${rows.map(({ vp, before: b, after: a, shots }) => `
  <h2>${vp.label}</h2>
  <p class="dims">${vp.width}×${vp.height}</p>
  <div class="scroller"><table>
    <tr><th>Medida</th><th>Antes</th><th>Después</th></tr>
    <tr><td>Ancho del panel</td><td class="n">${num(b.panel?.width)} px</td><td class="n">${num(a.panel?.width)} px</td></tr>
    <tr><td>Desbordamiento (px por debajo del pliegue)</td>
      <td class="n bad">${num(b.overflowPx)}</td>
      <td class="n ${(a.overflowPx ?? 1) < (b.overflowPx ?? 0) ? 'win' : ''}">${num(a.overflowPx)}</td></tr>
    <tr><td>Horarios visibles sin desplazar</td><td>${yn(b.reachable?.hours)}</td><td>${yn(a.reachable?.hours)}</td></tr>
    <tr><td>Dirección visible sin desplazar</td><td>${yn(b.reachable?.address)}</td><td>${yn(a.reachable?.address)}</td></tr>
    <tr><td>Acción principal visible sin desplazar</td><td>${yn(b.reachable?.primaryCta)}</td><td>${yn(a.reachable?.primaryCta)}</td></tr>
    <tr><td>Actividades de programación</td><td class="n">${num(b.programmeItems)}</td><td class="n">${num(a.programmeItems)}</td></tr>
    <tr><td>Campos mostrados <span style="color:var(--dim)">(recuento no comparable)</span></td><td class="n">${num(b.sections)}</td><td class="n">${num(a.sections)}</td></tr>
  </table></div>
${shots.map((s) => `
  <p class="cap">${s.name}</p>
  <div class="pair">
    <div class="cell"><p class="cap">Antes</p>${s.before ? `<img class="shot ${vp.width < 500 ? 'shot--tall' : ''}" alt="Antes — ${vp.label} — ${s.name}" src="${s.before}">` : '<p class="cap">sin captura</p>'}</div>
    <div class="cell"><p class="cap">Después</p>${s.after ? `<img class="shot ${vp.width < 500 ? 'shot--tall' : ''}" alt="Después — ${vp.label} — ${s.name}" src="${s.after}">` : '<p class="cap">sin captura</p>'}</div>
  </div>`).join('')}
`).join('')}
</div>`;

await fs.writeFile(OUT, html);
const bytes = (await fs.stat(OUT)).size;
console.log(`${path.relative(REPO_ROOT, OUT)} · ${(bytes / 1024 / 1024).toFixed(1)} MB`);
