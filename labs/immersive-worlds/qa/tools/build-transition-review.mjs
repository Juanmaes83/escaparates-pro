/** Review page for Block 2A: filmstrips plus the measured numbers behind them. */
import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const EV = path.resolve(HERE, '..', 'evidence-transitions');
const STRIPS = path.join(EV, 'filmstrips');
const OUTFILE = path.join(EV, 'transition-review.html');
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const film = JSON.parse(await fs.readFile(path.join(STRIPS, 'filmstrips.json'), 'utf8'));
const slice = JSON.parse(await fs.readFile(path.join(EV, 'slice.json'), 'utf8'));
const byBeat = new Map(slice.results.map((r) => [r.beat, r]));

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
await page.setContent('<html><body></body></html>');
async function uri(file, width = 420) {
  try {
    const buf = await fs.readFile(path.join(STRIPS, file));
    return await page.evaluate(async ({ b64, width }) => {
      const img = new Image(); img.src = `data:image/png;base64,${b64}`; await img.decode();
      const c = document.createElement('canvas');
      c.width = width; c.height = Math.round((img.height / img.width) * width);
      const x = c.getContext('2d'); x.imageSmoothingQuality = 'high';
      x.drawImage(img, 0, 0, c.width, c.height);
      return c.toDataURL('image/jpeg', 0.7);
    }, { b64: buf.toString('base64'), width });
  } catch { return null; }
}
const shots = new Map();
for (const s of film.manifest) for (const f of s.shots) shots.set(f.file, await uri(f.file));
await browser.close();

const FAMILY_NOTE = {
  T1_MICRO_REFRAMING: 'Medio paso y un giro de cabeza. Si se nota que la cámara se movió, es demasiado.',
  T2_LOCAL_WALK: 'Unos pasos junto al mismo muro. El muro sigue siendo la referencia; la sala no gira.',
  T3_GALLERY_TRAVERSE: 'Cruce de la sala. La sala misma es el contenido del viaje.',
  T4_OBJECT_ORBIT: 'Arco alrededor de la pieza, radio constante. El objeto gira; la sala no.',
  T5_THRESHOLD_APPROACH: 'La cámara empieza a orientarse al destino antes de llegar. Termina mirando por el vano.'
};

const strips = film.manifest.map((s) => {
  const m = byBeat.get(s.to);
  const frames = s.shots.map((f, i) => {
    const u = shots.get(f.file);
    const pct = Math.round((i / (s.shots.length - 1)) * 100);
    const phase = pct === 0 ? 'salida' : pct === 100 ? 'llegada' : `${pct}%`;
    return `<figure>${u ? `<a href="${u}" target="_blank"><img src="${u}" alt=""></a>` : '<div class="miss">—</div>'}
      <figcaption><span class="pct">${phase}</span><span class="mono">${f.pose.join(', ')}</span></figcaption></figure>`;
  }).join('');
  return `<section>
    <h3>${esc(s.tag.replace(/_/g, ' '))}</h3>
    <p class="note">${esc(FAMILY_NOTE[s.family] || '')}</p>
    ${m ? `<p class="metrics">endpoint <strong>${m.lockPosition === 0 ? '0' : m.lockPosition?.toExponential(1)}</strong> ·
      fuera de sala <strong>${m.pathSamplesOutside}</strong> ·
      giro máx <strong>${m.maxTurnPerFrameDeg}°/frame</strong> ·
      ${m.frames} fotogramas</p>` : ''}
    <p class="cap">${esc(s.caption)}</p>
    <div class="strip">${frames}</div>
  </section>`;
}).join('\n');

const measured = slice.results.filter((r) => !r.cut);
const fams = {};
for (const r of measured) fams[r.family] = (fams[r.family] || 0) + 1;
const rows = slice.results.map((r) => `<tr class="${r.cut ? 'cut' : r.pass ? '' : 'bad'}">
  <td class="mono">${esc(r.beat.replace(/^step\./, ''))}</td>
  <td>${esc(r.cut ? 'CORTE — portal, fuera de 2A' : r.family)}</td>
  <td class="num">${r.cut ? '—' : (r.lockPosition === 0 ? '0' : r.lockPosition?.toExponential(1))}</td>
  <td class="num">${r.cut ? '—' : r.pathSamplesOutside}</td>
  <td class="num">${r.cut ? '—' : r.maxTurnPerFrameDeg + '°'}</td></tr>`).join('');

const html = `<title>Museo — lenguaje de transiciones</title>
<style>
  :root { --bg:#f5f3ef; --panel:#fffefb; --ink:#1b1917; --muted:#6d675e; --line:#ddd7cc; --ok:#2f6b45; --bad:#96331f; }
  @media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {
    --bg:#141311; --panel:#1c1a17; --ink:#ece7de; --muted:#9a9287; --line:#35312b; --ok:#7fbf98; --bad:#e08b74; } }
  :root[data-theme="dark"] { --bg:#141311; --panel:#1c1a17; --ink:#ece7de; --muted:#9a9287; --line:#35312b; --ok:#7fbf98; --bad:#e08b74; }
  *{box-sizing:border-box} body{margin:0;background:var(--bg);color:var(--ink);
    font:15px/1.55 ui-sans-serif,system-ui,-apple-system,sans-serif}
  .wrap{max-width:1500px;margin:0 auto;padding:40px 24px 80px}
  h1{font-size:26px;font-weight:600;margin:0 0 6px} h2{font-size:18px;margin:44px 0 8px;padding-top:18px;border-top:1px solid var(--line)}
  h3{font-size:14px;letter-spacing:.09em;text-transform:uppercase;color:var(--muted);margin:0 0 4px}
  p.lede{color:var(--muted);max-width:78ch;margin:0 0 10px}
  .mono{font-family:ui-monospace,Menlo,monospace;font-size:10.5px;color:var(--muted)}
  section{margin:26px 0;padding:16px;background:var(--panel);border:1px solid var(--line)}
  .note{margin:0 0 6px;color:var(--muted);font-style:italic}
  .metrics{margin:0 0 4px;font-size:12.5px} .metrics strong{color:var(--ok)}
  .cap{margin:0 0 12px;font-size:13px}
  .strip{display:grid;grid-template-columns:repeat(6,1fr);gap:8px}
  .strip figure{margin:0} .strip img{width:100%;display:block;border:1px solid var(--line)}
  figcaption{display:flex;flex-direction:column;gap:1px;padding:4px 2px}
  .pct{font-size:10px;letter-spacing:.08em;color:var(--muted)}
  .miss{padding:30px;text-align:center;color:var(--bad)}
  table{border-collapse:collapse;width:100%;margin-top:12px;font-size:12.5px}
  th,td{border-bottom:1px solid var(--line);padding:6px 9px;text-align:left}
  td.num{text-align:right;font-variant-numeric:tabular-nums}
  tr.cut{color:var(--muted)} tr.bad td{color:var(--bad);font-weight:600}
  .box{background:var(--panel);border-left:3px solid var(--ink);padding:12px 16px;margin:14px 0;max-width:92ch}
  @media (max-width:900px){ .strip{grid-template-columns:repeat(3,1fr)} }
</style>
<div class="wrap">
  <h1>Museo — lenguaje de transiciones (Block 2A)</h1>
  <p class="lede">Cómo viaja la cámara entre beats. Los destinos no cambian: cada transición
  aterriza exactamente en el pose congelado de Sala 1. Generado ${esc(slice.generatedAt)}.</p>

  <div class="box"><strong>Qué juzgar.</strong> Un fotograma fijo no muestra un movimiento, así que
  cada tira reparte seis capturas entre la salida, el viaje y la llegada. Lo que debe leerse:
  que se entiende de dónde se viene, hacia dónde se va, y que la sala no gira bajo los pies.</div>

  <h2>1 · Una tira por familia</h2>
  ${strips}

  <h2>2 · Las ${slice.results.length} transiciones de la ruta</h2>
  <p class="lede">Medidas: ${measured.length} · cortes fuera de alcance: ${slice.results.length - measured.length} ·
  fallos: ${measured.filter((r) => !r.pass).length} · familias ${esc(JSON.stringify(fams))}</p>
  <table><thead><tr><th>beat</th><th>familia</th><th class="num">endpoint</th><th class="num">fuera</th><th class="num">giro máx</th></tr></thead>
  <tbody>${rows}</tbody></table>
</div>`;

await fs.writeFile(OUTFILE, html);
console.log(`review → ${path.relative(process.cwd(), OUTFILE)} (${(html.length / 1048576).toFixed(2)} MB)`);
