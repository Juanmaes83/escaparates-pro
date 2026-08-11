/** Coverage board for Galería A — what is in the room vs what the tour visits. */
import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const GAL = path.resolve(HERE, '..', 'evidence-gallery-a');
const GRAM = path.resolve(HERE, '..', 'evidence-grammar', 'current');
const OUTFILE = path.join(GAL, 'coverage-board.html');
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const data = JSON.parse(await fs.readFile(path.join(GAL, 'coverage.json'), 'utf8'));

const STATUS = {
  'entity.artwork.horizonte-interrumpido': { s: 'IN_TOUR', type: 'ARTWORK', note: 'Parada 02 · A/B/C/D completo' },
  'entity.artwork.division-tercera': { s: 'IN_TOUR', type: 'ARTWORK', note: 'Parada 03 · A/B/C/D completo' },
  'entity.artwork.campo-de-ceniza': { s: 'PRESENT_BUT_NOT_IN_TOUR', type: 'ARTWORK', note: 'Focus y ficha listos · sin beats guiados' },
  'entity.artwork.estudio-de-figura': { s: 'PRESENT_BUT_NOT_IN_TOUR', type: 'ARTWORK', note: 'Focus y ficha listos · sin beats guiados' },
  'entity.sculpture.vasija-de-arenas': { s: 'PRESENT_BUT_NOT_IN_TOUR', type: 'SCULPTURE', note: 'Focus frontal · sin gramática de escultura' }
};

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setContent('<html><body></body></html>');
async function uri(dir, file, width = 720) {
  if (!file) return null;
  try {
    const buf = await fs.readFile(path.join(dir, file));
    return await page.evaluate(async ({ b64, width }) => {
      const img = new Image(); img.src = `data:image/png;base64,${b64}`; await img.decode();
      const c = document.createElement('canvas');
      c.width = width; c.height = Math.round((img.height / img.width) * width);
      const x = c.getContext('2d'); x.imageSmoothingQuality = 'high';
      x.drawImage(img, 0, 0, c.width, c.height);
      return c.toDataURL('image/jpeg', 0.74);
    }, { b64: buf.toString('base64'), width });
  } catch { return null; }
}

const roomAxis = await uri(GAL, 'room_axis.png', 1100);
const roomOblique = await uri(GAL, 'room_oblique.png', 1100);
const pieceUris = new Map();
for (const shot of data.shots) pieceUris.set(shot.id, await uri(GAL, shot.file));
const abcd = {};
for (const [k, f] of [['A', 'stop02_A_lead_03-lleva-horizonte.png'], ['B', 'stop02_B_accompanied_04-horizonte.png'],
  ['C', 'stop02_C_contemplation_04c-horizonte-contemplacion.png'], ['D', 'stop02_D_focus_04b-horizonte-cesion.png']]) {
  abcd[k] = await uri(GRAM, f, 520);
}
await browser.close();

const card = (shot) => {
  const meta = STATUS[shot.id] || { s: 'UNKNOWN_NEEDS_CONFIRMATION', type: 'OTHER', note: '' };
  const u = pieceUris.get(shot.id);
  return `<figure class="piece ${meta.s === 'IN_TOUR' ? 'in' : 'out'}">
    ${u ? `<a href="${u}" target="_blank"><img src="${u}" alt="${esc(shot.title)}"></a>` : '<div class="missing">sin captura</div>'}
    <figcaption>
      <span class="badge ${meta.s === 'IN_TOUR' ? 'ok' : 'no'}">${esc(meta.s)}</span>
      <strong>${esc(shot.title)}</strong>
      <span class="sub">${esc(shot.creator)}, ${esc(shot.year)} · ${esc(shot.medium)}</span>
      <span class="sub">${shot.size.map((n) => n.toFixed(2)).join(' × ')} m · ${esc(meta.type)}</span>
      <span class="note">${esc(meta.note)}</span>
      <span class="mono">${esc(shot.id)}</span>
    </figcaption>
  </figure>`;
};

const html = `<title>Galería A — mapa de cobertura</title>
<style>
  :root { --bg:#f5f3ef; --panel:#fffefb; --ink:#1b1917; --muted:#6d675e; --line:#ddd7cc; --ok:#2f6b45; --no:#96331f; }
  @media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {
    --bg:#141311; --panel:#1c1a17; --ink:#ece7de; --muted:#9a9287; --line:#35312b; --ok:#7fbf98; --no:#e08b74; } }
  :root[data-theme="dark"] { --bg:#141311; --panel:#1c1a17; --ink:#ece7de; --muted:#9a9287; --line:#35312b; --ok:#7fbf98; --no:#e08b74; }
  * { box-sizing:border-box; } body { margin:0; background:var(--bg); color:var(--ink);
    font:15px/1.55 ui-sans-serif, system-ui, -apple-system, sans-serif; }
  .wrap { max-width:1400px; margin:0 auto; padding:40px 24px 80px; }
  h1 { font-size:26px; font-weight:600; margin:0 0 6px; }
  h2 { font-size:18px; margin:44px 0 8px; padding-top:18px; border-top:1px solid var(--line); }
  p.lede { color:var(--muted); max-width:78ch; margin:0 0 12px; }
  .mono { font-family:ui-monospace,Menlo,monospace; font-size:10.5px; color:var(--muted); }
  .rooms { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
  .rooms img, figure.piece img { width:100%; height:auto; display:block; }
  .rooms figure { margin:0; background:var(--panel); border:1px solid var(--line); }
  .rooms figcaption { padding:8px 10px; font-size:12px; color:var(--muted); }
  .grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:14px; }
  figure.piece { margin:0; background:var(--panel); border:1px solid var(--line); }
  figure.piece.out { border-left:4px solid var(--no); }
  figure.piece.in { border-left:4px solid var(--ok); }
  figcaption { padding:10px 12px; display:flex; flex-direction:column; gap:3px; font-size:12.5px; }
  .badge { font-size:10px; letter-spacing:.09em; font-weight:600; }
  .badge.ok { color:var(--ok); } .badge.no { color:var(--no); }
  .sub, .note { color:var(--muted); } .note { font-style:italic; }
  .abcd { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; }
  .abcd figure { margin:0; background:var(--panel); border:1px solid var(--line); }
  .abcd img { width:100%; display:block; }
  .abcd figcaption { padding:6px 8px; font-size:11px; letter-spacing:.08em; color:var(--muted); }
  .missing { padding:40px; text-align:center; color:var(--no); }
</style>
<div class="wrap">
  <h1>Galería A — mapa de cobertura</h1>
  <p class="lede">Todo lo que existe físicamente en la sala principal, y qué parte de ello visita
  el recorrido guiado. Capturas del estado actual, ${esc(data.generatedAt)}.</p>

  <h2>1 · La sala</h2>
  <div class="rooms">
    <figure><a href="${roomAxis}" target="_blank"><img src="${roomAxis}" alt="eje"></a>
      <figcaption>Desde el eje de entrada, como llega el visitante.</figcaption></figure>
    <figure><a href="${roomOblique}" target="_blank"><img src="${roomOblique}" alt="diagonal"></a>
      <figcaption>En diagonal: ritmo lateral, escultura y banco.</figcaption></figure>
  </div>

  <h2>2 · Las cinco piezas · 2 en el recorrido, 3 fuera</h2>
  <p class="lede">Las cinco tienen Focus, ficha y navegación de colección funcionando.
  La diferencia entre unas y otras no es capacidad, es <strong>beats guiados authored</strong>.</p>
  <div class="grid">${data.shots.map(card).join('\n')}</div>

  <h2>3 · La gramática aprobada, como referencia</h2>
  <p class="lede">Parada 02 — el patrón que una pieza integrada debe cumplir.
  El beat A está marcado FAIL en la auditoría visual: encuadra pared vacía.</p>
  <div class="abcd">
    ${['A', 'B', 'C', 'D'].map((k) => `<figure><img src="${abcd[k]}" alt="${k}">
      <figcaption>${k}${k === 'A' ? ' · FAIL conocido' : ''}</figcaption></figure>`).join('')}
  </div>
</div>`;

await fs.writeFile(OUTFILE, html);
console.log(`board → ${path.relative(process.cwd(), OUTFILE)} (${(html.length / 1048576).toFixed(2)} MB)`);
