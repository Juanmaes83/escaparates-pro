/**
 * The human review surface for the VS02 shell loops.
 *
 * Self-contained — a published page reaches no external host — and built from
 * the frames on disk rather than from prose, so a caption cannot describe a
 * screenshot that is not underneath it.
 *
 *   node qa/tools/build-shell-board.mjs
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

const fig = (p, caption, cls = '') => {
  const src = uri(p);
  if (!src) return `<p class="miss">falta la captura: ${esc(path.basename(p))}</p>`;
  return `<figure class="${cls}"><img src="${src}" alt="${esc(caption)}" loading="lazy">
    <figcaption>${caption}</figcaption></figure>`;
};

const GAPS = [
  {
    n: 1,
    title: 'El taller no enseñaba su propia estructura',
    ref: 'La referencia abre con las cinco áreas de autoría — Construir, Contenido, Experiencia, Visitante, Publicar — en el raíl izquierdo, con iconos, como lo primero que ve un autor. El blueprint del sistema está organizado alrededor de ellas.',
    was: 'VS02 tenía las cinco en el código y las ocultaba con <code>display: none</code>, degradadas a una tira de filtros dentro de la columna de validación. La arquitectura del propio producto era invisible en aquello con lo que se navega.',
    now: 'El raíl es ahora la primera columna: icono, área, qué vive dentro y —cuando está activa— sus subáreas. Tres dicen «Pronto» en lugar de fingir que existen.',
    done: true
  },
  {
    n: 2,
    title: 'El editor estaba compuesto como una pila de titulares',
    ref: 'La referencia pone «Título», «Artista», «Año» como palabras, cada una en una línea, junto a su campo.',
    was: 'Cada etiqueta iba en versales con 0,13em de tracking — un tratamiento de titular aplicado a un formulario. «Nombre de la institución» ocupaba tres líneas de una columna de 88px. Y la pista tomaba la primera fila de la columna del campo, así que cada control bajaba una fila mientras su etiqueta se quedaba: todo el formulario estaba desfasado respecto de lo que etiquetaba.',
    now: 'Etiquetas como palabras; las versales quedan para las cabeceras de grupo, que es el trabajo que hacen bien. Filas asignadas explícitamente: etiqueta y control comparten fila, la pista va debajo.',
    done: true
  },
  {
    n: 3,
    title: 'La validación era una frase, no un instrumento',
    ref: 'La referencia dibuja un anillo de calidad y marca cada línea de la lista con un punto de estado.',
    was: 'Un porcentaje en tipo grande y tres proporciones «3/3». Un número dice dónde estás; no dice cuánto falta sin hacer la cuenta.',
    now: 'Anillo con la cifra que la columna ya calculaba, y un punto de estado por dominio. El arco que falta es la parte de la respuesta que el número no da.',
    done: true
  }
];

const LOOPS = [
  ['Raíl de áreas', 'La columna de áreas, con iconos dibujados en línea y las subáreas del blueprint.'],
  ['Regresiones del raíl', '<code>#iw-stage</code> se posiciona contra la ventana, así que toda columna a su izquierda hay que nombrarla: añadir un raíl sin añadirlo al <code>left</code> metió la vista previa 178px por debajo del raíl. Y <code>.st-rail ul</code> gana a <code>.st-areas</code> por especificidad, así que las subáreas perdieron su sangría.'],
  ['Madurez del editor', 'Etiquetas como palabras, filas en registro, chip «Pronto» que ya no se corta contra el borde, cabecera de ranura en una línea.'],
  ['Validación', 'Anillo de progreso y puntos de estado por dominio.']
];

const DEBT = [
  ['Vista de autor ≠ vista de visitante', 'Enfocar la pieza usa la ruta de foco del runtime real, así que el autor ve la presentación del visitante: cartela, paginación, «volver a la sala». Hoy es deseable — es prueba en vivo de que los metadatos editados llegan a la pared — pero la distinción está pendiente. Registrado en CONSTITUTION §36.4.'],
  ['Sin miniaturas', 'La referencia muestra la imagen de cada obra en la tira y una miniatura en el grupo de medios. VS02 muestra nombres de archivo. Una herramienta de autoría visual que nunca enseña lo visual.'],
  ['Sin biblioteca de medios', 'La referencia tiene una segunda columna con los medios de la institución contados por tipo. VS02 no la tiene.'],
  ['Sin actividad reciente', 'Deliberado. La referencia lista personas y horas; detrás de VS02 no hay historial ni cuentas, así que cada fila sería inventada. Una consola de validación que se fabrica su propio registro de auditoría es peor que una que aún no lo tiene.'],
  ['Sin mapa de sala', 'La referencia superpone un plano en la vista previa.'],
  ['Techo en la vista de sala', 'A nivel de sala, la vista previa gasta cerca de un quinto de su altura en techo.'],
  ['Jerarquía de botones', 'La referencia tiene una acción primaria clara. VS02 tiene cuatro botones de peso parecido en la barra superior.']
];

const html = `<title>VS02 — La forma del taller</title>
<style>
  :root {
    --paper: #f7f5f1; --ink: #1c1a17; --muted: #6b6558; --rule: #ddd8ce;
    --card: #fffefc; --good: #2f6b45; --sunk: #efece5;
  }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
      --paper: #14130f; --ink: #ece7dd; --muted: #9b9488; --rule: #2e2b25;
      --card: #1b1915; --good: #7fb894; --sunk: #232019;
    }
  }
  :root[data-theme="dark"] {
    --paper: #14130f; --ink: #ece7dd; --muted: #9b9488; --rule: #2e2b25;
    --card: #1b1915; --good: #7fb894; --sunk: #232019;
  }
  body { margin: 0; background: var(--paper); color: var(--ink);
    font: 16px/1.62 ui-serif, Georgia, "Times New Roman", serif; }
  main { max-width: 64rem; margin: 0 auto; padding: 4rem 1.5rem 6rem; }
  .eyebrow { font-family: ui-sans-serif, system-ui, sans-serif; text-transform: uppercase;
    letter-spacing: .14em; font-size: .7rem; color: var(--muted); margin: 0 0 .6rem; }
  h1 { font-size: clamp(1.9rem, 4vw, 2.7rem); line-height: 1.12; margin: 0 0 1rem; font-weight: 400; }
  h2 { font-size: 1.4rem; font-weight: 400; margin: 3.6rem 0 .4rem;
    padding-top: 1.7rem; border-top: 1px solid var(--rule); }
  h3 { font-size: .95rem; font-family: ui-sans-serif, system-ui, sans-serif;
    margin: 1.8rem 0 .3rem; letter-spacing: .01em; }
  p { margin: .8rem 0; }
  .lede { font-size: 1.1rem; color: var(--muted); }
  code { font-family: ui-monospace, Menlo, monospace; font-size: .85em;
    background: var(--sunk); padding: .1em .35em; border-radius: 3px; }
  figure { margin: 1.4rem 0; }
  img { width: 100%; display: block; border: 1px solid var(--rule); border-radius: 3px; }
  figcaption { font-family: ui-sans-serif, system-ui, sans-serif; font-size: .8rem;
    color: var(--muted); margin-top: .5rem; }
  .pair { display: grid; gap: 1.2rem; }
  @media (min-width: 46rem) { .pair { grid-template-columns: 1fr 1fr; } }
  .gap { border: 1px solid var(--rule); border-radius: 4px; background: var(--card);
    padding: 1.1rem 1.3rem; margin: 1.2rem 0; }
  .gap h3 { margin-top: 0; }
  .gap dl { margin: .6rem 0 0; display: grid; grid-template-columns: auto 1fr; gap: .35rem .9rem; font-size: .92rem; }
  .gap dt { font-family: ui-sans-serif, system-ui, sans-serif; font-size: .68rem;
    text-transform: uppercase; letter-spacing: .1em; color: var(--muted); padding-top: .25rem; }
  .gap dd { margin: 0; }
  .status { display: flex; flex-wrap: wrap; gap: .5rem; margin: 2rem 0;
    font-family: ui-sans-serif, system-ui, sans-serif; font-size: .78rem; }
  .status span { border: 1px solid var(--rule); padding: .35rem .7rem;
    border-radius: 2px; background: var(--card); }
  .status .ok { border-color: var(--good); color: var(--good); }
  ul.debt { list-style: none; padding: 0; }
  ul.debt li { border-bottom: 1px solid var(--rule); padding: .7rem 0; }
  ul.debt b { font-family: ui-sans-serif, system-ui, sans-serif; font-size: .85rem; display: block; }
  ul.debt span { font-size: .92rem; color: var(--muted); }
  ol.loops { padding-left: 1.2rem; }
  ol.loops li { margin: .5rem 0; }
  ol.loops b { font-family: ui-sans-serif, system-ui, sans-serif; font-size: .88rem; }
  .miss { color: var(--muted); font-style: italic; }
  blockquote { margin: 1.1rem 0; padding: .5rem 0 .5rem 1.1rem;
    border-left: 2px solid var(--rule); color: var(--muted); font-style: italic; }
</style>

<main>
  <p class="eyebrow">Museo · Autoría premium · ${esc(HEAD)}</p>
  <h1>La forma del taller, medida contra la referencia aprobada</h1>
  <p class="lede">
    Tres bucles sobre la carcasa de VS02, comparando siempre con
    <code>museum-authoring-ui-reference-v1</code> y el blueprint del sistema —
    ya no contra VS01.
  </p>

  <div class="status">
    <span class="ok">Bloqueo de vídeo: <b>CERRADO</b> — verificado por Juanma</span>
    <span>Aprobación del producto: <b>PENDIENTE</b></span>
    <span>Sin merge · sin master · sin promoción</span>
  </div>

  <h2>Antes y después</h2>
  <div class="pair">
    ${fig(path.join(SCRATCH, 'before', '08_before.png'), 'Antes — al empezar este mandato. Una columna de árbol junto a un visor; sin iconos en toda la carcasa; etiquetas en versales que ocupan tres líneas; validación como frase.')}
    ${fig(path.join(EV, 'w1', '08_ARTWORK_SELECTED.png'), 'Después — la columna de áreas da la escala del producto, el editor se lee como una ficha, y la validación se lee sin leerla.')}
  </div>

  <h2>Los tres huecos globales</h2>
  ${GAPS.map((g) => `
    <div class="gap">
      <h3>${g.n}. ${esc(g.title)} ${g.done ? '· corregido' : ''}</h3>
      <dl>
        <dt>Referencia</dt><dd>${g.ref}</dd>
        <dt>Estaba</dt><dd>${g.was}</dd>
        <dt>Ahora</dt><dd>${g.now}</dd>
      </dl>
    </div>`).join('')}

  <h2>La referencia aprobada</h2>
  ${fig(path.join(REPO_ROOT, 'docs/visuals/museum-authoring/museum-authoring-ui-reference-v1.png'),
    'El listón. VS02 no adopta su oro: la dirección de arte de la casa da el único color saturado a la obra que cuelga en la pared, no a la carcasa que la enmarca. Es la divergencia deliberada.')}

  <h2>Bucles completados</h2>
  <ol class="loops">
    ${LOOPS.map(([t, d]) => `<li><b>${esc(t)}</b> — ${d}</li>`).join('')}
  </ol>

  <h2>Veredicto — VS02 frente a la referencia</h2>
  <p>
    <b>La referencia sigue leyéndose como el producto más caro.</b> El hueco ya
    no es de estructura: VS02 tiene ahora la columna de áreas, el árbol, la vista
    previa acoplada, el editor contextual y la validación, en la misma
    disposición de cinco columnas. Lo que le falta es <em>densidad de contenido
    real</em> — la referencia enseña miniaturas, una biblioteca de medios con
    recuentos, un plano de sala y un registro de actividad. Tres de esas cuatro
    son contenido que VS02 podría enseñar y no enseña; la cuarta no tiene datos
    detrás y no se va a inventar.
  </p>
  <blockquote>
    Dicho de otra forma: la carcasa ya no delata al producto, pero la referencia
    todavía enseña más de lo que hay dentro.
  </blockquote>

  <h2>Otras vistas</h2>
  ${fig(path.join(EV, 'w2', '14_VIDEO_READY.png'), 'Vídeo listo en una obra enmarcada — el caso que no se podía ni intentar antes de la corrección del modelo. Cadena de estado completa y la tira nombrando la obra por su nombre nuevo.')}
  ${fig(path.join(EV, 'w1', '02_VS02_DEFAULT.png'), 'Al abrir: las cinco áreas dan la escala del producto antes de tocar nada.')}
  ${fig(path.join(EV, 'w1', '25_NARROW_VIEW.png'), 'A 420px. El raíl se convierte en una tira que rueda de lado: un icono solo, arriba de un teléfono, es un acertijo y no una señal.')}

  <h2>Deuda visual abierta</h2>
  <ul class="debt">
    ${DEBT.map(([t, d]) => `<li><b>${esc(t)}</b><span>${d}</span></li>`).join('')}
  </ul>

  <h2>Documentación canónica</h2>
  <p>
    <code>CONSTITUTION §36</code> recoge el contexto de producto del que depende
    este trabajo: uso profesional interno del Studio, futuro autoservicio de pago
    con gating por capacidad, la separación Studio / Preview / Visitante, que el
    visitante nunca edita, la deuda Vista de autor ≠ Vista de visitante, y la
    capa futura de salida. Añadido al documento canónico, no como documento
    rival.
  </p>
</main>`;

const out = path.join(EV, 'shell-board.html');
await fs.writeFile(out, html);
console.log(`${out}\n${(html.length / 1024 / 1024).toFixed(2)} MB · HEAD ${HEAD}`);
