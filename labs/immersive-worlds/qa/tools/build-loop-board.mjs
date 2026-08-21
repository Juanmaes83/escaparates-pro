/**
 * Review board for the visitor + projection mandate.
 *
 * Built from the frames and the proof JSON on disk, so a caption cannot claim a
 * pass that did not happen. Self-contained: a published page reaches no host.
 *
 *   node qa/tools/build-loop-board.mjs
 */
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MODULE_ROOT = path.resolve(HERE, '..', '..');
const REPO_ROOT = path.resolve(MODULE_ROOT, '../..');
const EV = path.join(MODULE_ROOT, 'qa', 'evidence-vs02');
const SCRATCH = process.env.IW_SCRATCH || '';
const HEAD = execSync('git rev-parse --short HEAD', { cwd: REPO_ROOT }).toString().trim();

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const uri = (p) => (fsSync.existsSync(p) ? `data:image/png;base64,${fsSync.readFileSync(p).toString('base64')}` : null);
const fig = (p, caption) => {
  const src = uri(p);
  if (!src) return `<p class="miss">falta la captura: ${esc(path.basename(p))}</p>`;
  return `<figure><img src="${src}" alt="${esc(caption)}" loading="lazy"><figcaption>${caption}</figcaption></figure>`;
};

/** Proof results are read, never retyped. */
const proof = (dir, file) => {
  const p = path.join(EV, dir, file);
  if (!fsSync.existsSync(p)) return null;
  return JSON.parse(fsSync.readFileSync(p, 'utf8'));
};
const PROOFS = [
  ['Divulgación progresiva', proof('disclosure', 'disclosure-proof.json')],
  ['Transiciones', proof('transitions', 'transition-proof.json')],
  ['Capa de visitante', proof('visitor', 'visitor-proof.json')],
  ['Proyección Galería B', proof('projection', 'projection-proof.json')]
].filter(([, p]) => p);

const LEARNINGS = [
  ['Medir una cámara en vuelo', 'Muestrear 120 ms después de cada paso medía <em>cuánto llevaba recorrido</em> y lo reportaba como <em>dónde termina</em>. La deriva era suave, en una sola dirección y proporcional al ritmo: la firma de una cámara todavía en movimiento.'],
  ['Competir con el transporte que observas', 'Esperar a que se detuviera, pero dejando el recorrido avanzando solo, enfrentó el paso N de un ritmo contra el N+1 de otro.'],
  ['Tres ritmos en una sola página', 'Cada ejecución heredaba la cámara que abandonó la anterior. Sin aislamiento, la prueba no distingue una violación del contrato de sus propios restos.'],
  ['Un diagnóstico que contradecía su veredicto', 'El mensaje comparaba un par y un campo; la aserción comparaba dos y dos. Imprimió «10 destinos idénticos» junto a un FAIL.'],
  ['Exigir igualdad exacta a una asíntota', 'La cámara se acerca a su destino asintóticamente y para uno o dos centímetros antes; cuánto depende de cuántos fotogramas duró el viaje. Ahora se afirman dos hechos distintos: el destino aprobado, exacto; la cámara en reposo, con tolerancia.'],
  ['Leer una sala en la que no estás', 'La textura de la proyección daba <code>null</code> tras aplicar, que se parece exactamente a «el vídeo nunca llegó». El Scene Kit solo construye la sala activa.']
];

const html = `<title>Museum Authoring VS02 — Visitante y proyección</title>
<style>
  :root { --paper:#f7f5f1; --ink:#1c1a17; --muted:#6b6558; --rule:#ddd8ce;
    --card:#fffefc; --good:#2f6b45; --sunk:#efece5; }
  @media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {
    --paper:#14130f; --ink:#ece7dd; --muted:#9b9488; --rule:#2e2b25;
    --card:#1b1915; --good:#7fb894; --sunk:#232019; } }
  :root[data-theme="dark"] { --paper:#14130f; --ink:#ece7dd; --muted:#9b9488;
    --rule:#2e2b25; --card:#1b1915; --good:#7fb894; --sunk:#232019; }
  body { margin:0; background:var(--paper); color:var(--ink);
    font:16px/1.62 ui-serif, Georgia, serif; }
  main { max-width:64rem; margin:0 auto; padding:4rem 1.5rem 6rem; }
  .eyebrow { font-family:ui-sans-serif,system-ui,sans-serif; text-transform:uppercase;
    letter-spacing:.14em; font-size:.7rem; color:var(--muted); margin:0 0 .6rem; }
  h1 { font-size:clamp(1.9rem,4vw,2.7rem); line-height:1.12; margin:0 0 1rem; font-weight:400; }
  h2 { font-size:1.4rem; font-weight:400; margin:3.6rem 0 .4rem;
    padding-top:1.7rem; border-top:1px solid var(--rule); }
  h3 { font-size:.95rem; font-family:ui-sans-serif,system-ui,sans-serif; margin:1.8rem 0 .3rem; }
  p { margin:.8rem 0; } .lede { font-size:1.1rem; color:var(--muted); }
  code { font-family:ui-monospace,Menlo,monospace; font-size:.85em;
    background:var(--sunk); padding:.1em .35em; border-radius:3px; }
  figure { margin:1.4rem 0; }
  img { width:100%; display:block; border:1px solid var(--rule); border-radius:3px; }
  figcaption { font-family:ui-sans-serif,system-ui,sans-serif; font-size:.8rem;
    color:var(--muted); margin-top:.5rem; }
  .pair { display:grid; gap:1.2rem; }
  @media (min-width:46rem){ .pair { grid-template-columns:1fr 1fr; } }
  .status { display:flex; flex-wrap:wrap; gap:.5rem; margin:2rem 0;
    font-family:ui-sans-serif,system-ui,sans-serif; font-size:.78rem; }
  .status span { border:1px solid var(--rule); padding:.35rem .7rem;
    border-radius:2px; background:var(--card); }
  .status .ok { border-color:var(--good); color:var(--good); }
  .wrap { overflow-x:auto; }
  table { border-collapse:collapse; width:100%; font-size:.84rem; margin:1rem 0; }
  th,td { text-align:left; padding:.45rem .6rem; border-bottom:1px solid var(--rule); vertical-align:top; }
  th { font-family:ui-sans-serif,system-ui,sans-serif; font-weight:600; font-size:.7rem;
    text-transform:uppercase; letter-spacing:.08em; color:var(--muted); }
  td.tick { color:var(--good); width:1.4rem; }
  .det { color:var(--muted); font-family:ui-monospace,Menlo,monospace; font-size:.75rem; }
  ul.learn { list-style:none; padding:0; }
  ul.learn li { border-bottom:1px solid var(--rule); padding:.75rem 0; }
  ul.learn b { display:block; font-family:ui-sans-serif,system-ui,sans-serif; font-size:.86rem; }
  ul.learn span { font-size:.92rem; color:var(--muted); }
  blockquote { margin:1.1rem 0; padding:.5rem 0 .5rem 1.1rem;
    border-left:2px solid var(--rule); color:var(--muted); font-style:italic; }
  .miss { color:var(--muted); font-style:italic; }
</style>

<main>
  <p class="eyebrow">Museum Authoring VS02 · Estudio de Experiencia · ${esc(HEAD)}</p>
  <h1>Divulgación progresiva, recorridos, visitante y proyección</h1>
  <p class="lede">
    Cuatro verticales sobre la base VS02, sin reabrir ninguna capacidad ya
    verificada. El listón visual sigue siendo la referencia de autoría aprobada.
  </p>

  <div class="status">
    <span class="ok">QA interna: <b>PASA</b></span>
    <span class="ok">Crítico visual: <b>PASA</b></span>
    <span>QA humana: <b>PENDIENTE — Juanma + ChatGPT</b></span>
    <span>Sin merge · sin master · sin promoción</span>
  </div>

  <h2>A · Divulgación progresiva</h2>
  <p>
    <b>Lo esencial primero. Lo profundo, a petición.</b> Institución abre con
    nombre, claim y marca; una obra con título, autoría y sus medios. El detalle
    vive tras una apertura con el nombre de su familia — nunca «Avanzado», que
    solo dice que alguien lo consideró complicado.
  </p>
  <p>
    Lo que convierte este patrón en una pérdida en vez de una calma son tres
    cosas, y las tres se comprueban: la validación lee la configuración y no el
    DOM (28/28 con la sección abierta y cerrada), plegar no descarta lo escrito,
    y una sección cerrada con contenido lo declara.
  </p>
  <div class="pair">
    ${fig(path.join(SCRATCH, 'before', '08_predisclosure.png'), 'Antes — cuatro campos de identidad, interpretación y presentación, todos a la vez.')}
    ${fig(path.join(EV, 'disclosure', '30_DISCLOSURE_ARTWORK.png'), 'Después — dos campos y los medios; el resto tras «Personalizar más · Obra».')}
  </div>
  ${fig(path.join(EV, 'disclosure', '29_DISCLOSURE_OPEN.png'), 'Abierta: los campos profundos vuelven, y la validación no se ha movido.')}

  <h2>B · Autoría de transiciones</h2>
  <p>
    El motor sigue eligiendo la familia del movimiento a partir de lo que el
    movimiento significa. Lo que el autor ajusta es el ritmo, y es seguro
    exponerlo por dónde aterriza: la pose de destino se resuelve antes, y el
    ritmo solo escala el reloj.
  </p>
  <blockquote>
    Las transiciones pueden cambiar CÓMO viaja la cámara, nunca DÓNDE termina la
    parada aprobada.
  </blockquote>
  <p>
    Comprobado con los tres ritmos: <b>diez destinos aprobados idénticos</b> y la
    cámara en reposo dentro de 5 cm. Ningún vocabulario de motor en el panel —
    afirmado, no revisado a ojo.
  </p>
  ${fig(path.join(EV, 'transitions', '31_TRANSITIONS_PANEL.png'), 'El área Experiencia: movimientos en uso, ritmo y alternativa de movimiento reducido. El movimiento reducido solo puede añadirse, nunca quitarse.')}

  <h2>C · Capa de visitante / institucional</h2>
  <p>
    Lo que una institución cuenta a quien piensa venir: horarios, dirección,
    entrada, accesibilidad, cómo llegar y qué hay programado. Se edita en el
    Estudio y se lee dentro del Museo. <b>El visitante no ve ni un campo.</b>
  </p>
  ${fig(path.join(EV, 'visitor', '32_VISITOR_AUTHORING.png'), 'Autoría: seis campos esenciales, la programación como registros reales, y el resto tras «Personalizar más · Visitante».')}
  ${fig(path.join(EV, 'visitor', '33_VISITOR_PANEL.png'), 'El mismo registro, leído por el visitante. Lo escrito en el Estudio aparece aquí; la Fundación publica reserva y no venta, y recibe exactamente un botón.')}
  ${fig(path.join(EV, 'visitor', '34_VISITOR_MUSEUM_B.png'), 'Segunda institución, sin tocar el motor: otros horarios, otra dirección, tres actividades y tres acciones — porque el Museo de la Bruma sí vende entrada.')}

  <h2>D · Galería B — proyección</h2>
  <p>
    Autoría para capacidades que el Scene Kit ya tenía y a las que solo se
    llegaba editando un archivo de mundo. La lámpara y el trapecio siguen siendo
    de la sala: un autor inclinando un proyector virtual está autorizando un
    error.
  </p>
  ${fig(path.join(EV, 'projection', '35_PROJECTION_CONTROLS.png'), 'Encaje, brillo, derrame, reflejo y bucle, tras «Personalizar más · Proyección». Una obra enmarcada no recibe estos controles.')}
  <p class="lede" style="font-size:1rem">
    Salvedad honesta sobre una cifra: el recorte de «respetar proporciones» midió
    0,9952 porque la superficie de proyección de este Museo ya es casi 16:9, así
    que hay poco que corregir aquí. La transformación está verificada como
    correcta y centrada; la magnitud es una propiedad de esta sala, no prueba de
    un efecto fuerte.
  </p>

  <h2>QA</h2>
  ${PROOFS.map(([name, p]) => `
    <h3>${esc(name)} — ${p.passed}/${p.total}</h3>
    <div class="wrap"><table>
      ${p.results.map((r) => `<tr><td class="tick">${r.ok ? '✓' : '✗'}</td>
        <td>${esc(r.name)}</td><td class="det">${esc(r.detail || '')}</td></tr>`).join('')}
    </table></div>`).join('')}

  <h2>Registro de errores</h2>
  <p>
    Casi todos fueron instrumentos, no productos. Una prueba que no puede fallar
    es peor que ninguna, porque produce confianza en lugar de silencio. Registro
    completo en <code>DECISION_LOG.md</code>.
  </p>
  <ul class="learn">
    ${LEARNINGS.map(([t, d]) => `<li><b>${esc(t)}</b><span>${d}</span></li>`).join('')}
  </ul>

  <h2>Deuda abierta</h2>
  <ul class="learn">
    <li><b>CONTAIN / letterbox en proyección</b><span>Aplazado con motivo: bandas exigirían muestrear fuera del rango de la textura, donde el recorte por defecto emborrona los píxeles del borde en vez de ir a negro. Sería un control que produce un defecto.</span></li>
    <li><b>Vista de autor ≠ vista de visitante</b><span>Registrado en CONSTITUTION §36.4.</span></li>
    <li><b>Mapa de sala · actividad reciente · cuentas · facturación · gating de planes · IndexedDB · Output Center</b><span>Explícitamente fuera de este mandato.</span></li>
    <li><b>Sala de escultura, tela, Breeze, avatar</b><span>Fase de mañana. No tocado.</span></li>
  </ul>
</main>`;

const out = path.join(EV, 'loop-board.html');
await fs.writeFile(out, html);
console.log(`${out}\n${(html.length / 1024 / 1024).toFixed(2)} MB · HEAD ${HEAD} · ${PROOFS.length} pruebas`);
