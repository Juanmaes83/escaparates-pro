/**
 * Authoring VS01 — human review surface.
 *
 * The functional slice can only say the data moved. This page exists so a person
 * can look at what an author actually sees, in order, and disagree with it. It
 * carries the defects found by looking rather than by asserting, each one tied
 * to the frame it was found in, so a reviewer can check the claim instead of
 * taking it.
 *
 *   node qa/tools/build-authoring-board.mjs
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MODULE_ROOT = path.resolve(HERE, '..', '..');
const DIR = path.join(MODULE_ROOT, 'qa', 'evidence-authoring');

const visual = JSON.parse(await fs.readFile(path.join(DIR, 'visual.json'), 'utf8'));

/**
 * Found by looking at the captures, not by running an assertion. Severity is
 * about the product, not about the effort: a blocker is something that makes
 * the promise false, whatever it costs to fix.
 */
const DEFECTS = [
  {
    id: 'V1', severity: 'BLOQUEANTE', status: 'CORREGIDO',
    shot: '08_applied_museum',
    title: 'El archivo del autor nunca llegaba a la sala',
    found: 'La sala seguía mostrando la obra original después de aplicar. En consola: ' +
      '`unknown media kind "video"`.',
    cause: 'La configuración nombra los medios en minúscula (`image` / `video`); el mundo exige ' +
      '`IMAGE` / `VIDEO`. La entidad no validaba y se quedaba con su medio anterior. ' +
      'Ninguna de las 18 comprobaciones lo vio porque el mundo no lanza: registra y sigue.',
    fix: 'Traducción en la única frontera que se cruza (`applyConfigToWorld`), y el tester ' +
      'escucha ahora la consola además de las excepciones.'
  },
  {
    id: 'V2', severity: 'BLOQUEANTE', status: 'CORREGIDO',
    shot: '07_video_ready',
    title: 'El vídeo borraba la imagen recién subida',
    found: 'Al elegir vídeo, la imagen cargada un momento antes desaparecía sin avisar.',
    cause: 'Los dos selectores escribían en la misma ranura de la obra seleccionada. Además el ' +
      'vídeo aterrizaba sobre un lienzo enmarcado, cuando la propia etiqueta prometía ' +
      '«se aplica a la proyección».',
    fix: 'Cada medio va a la entidad que puede mostrarlo: la imagen a la obra en edición, el ' +
      'vídeo a la proyección de la sala, descubierta del registro y nombrada en la etiqueta.'
  },
  {
    id: 'V3', severity: 'ALTA', status: 'CORREGIDO',
    shot: '11_museum_b',
    title: 'La cabecera decía «Museo de la Bruma» y la pared seguía diciendo «Fundación Arenas»',
    found: 'En la prueba de segunda institución, el panel de bienvenida del vestíbulo —lo primero ' +
      'que lee un visitante— conservaba el nombre, la datación y el texto de la institución anterior.',
    cause: 'La configuración sólo escribía metadatos del mundo. La cartela institucional es una ' +
      'entidad con su propio contenido y nadie la tocaba. Del mismo defecto venía otro más ' +
      'silencioso: el campo INTRODUCCIÓN se escribía en un metadato que no lee nadie, así que ' +
      'el texto que un autor redactaba no aparecía en ninguna parte del museo.',
    fix: 'La señalética institucional (TEXT / wall-panel) se firma con la institución; la cartela ' +
      'del espacio de entrada toma además el claim como título, las fechas como datación y la ' +
      'introducción como texto —que es donde ese texto debía estar desde el principio. Se añade ' +
      'un campo FECHAS DE LA COLECCIÓN, porque sin él una segunda institución heredaba la ' +
      'datación de la anterior o la perdía sin poder declararla. La configuración base se lee ' +
      'ahora de la propia cartela, de modo que el Museo por defecto vuelve palabra por palabra ' +
      '—comprobado, no supuesto.'
  },
  {
    id: 'V14', severity: 'BLOQUEANTE', status: 'CORREGIDO',
    shot: '08_applied_museum',
    title: 'Cada «aplicar» dejaba otro editor apilado sobre el anterior',
    found: 'El editor no se cerraba después de aplicar. Se pedía cerrarlo, la orden se ejecutaba, ' +
      'y el panel seguía ahí.',
    cause: 'Aplicar re-arranca la experiencia, y el re-arranque volvía a montar el panel sin ' +
      'retirar el anterior: dos nodos con el mismo `id="au"`. `getElementById` devolvía el viejo, ' +
      'de modo que se ocultaba el panel de debajo mientras el visible se quedaba. Cada aplicación ' +
      'añadía uno más, con su propio botón EDITAR.',
    fix: 'El montaje retira el anterior. La herramienta de captura, además, cuenta los paneles del ' +
      'documento y lo registra como error si hay más de uno: el defecto se escondía precisamente ' +
      'en que la comprobación miraba un solo elemento.'
  },
  {
    id: 'V11', severity: 'ALTA', status: 'CORREGIDO',
    shot: '04_artwork_edit',
    title: 'El selector de obra ofrecía una pared como primera «obra»',
    found: 'OBRA EN EDICIÓN aparecía con «Colección permanente» seleccionada de entrada: la cartela ' +
      'de bienvenida del vestíbulo, no una obra. Un autor que escribiera un título sin cambiar el ' +
      'selector estaba reescribiendo la señalética institucional desde la sección equivocada.',
    cause: 'La lista se construía con «toda entidad que tenga título», y la señalética tiene título.',
    fix: 'La lista es de obras: ARTWORK, SCULPTURE, PROJECTION y AUDIO. La señalética se edita ' +
      'donde le corresponde, en INSTITUCIÓN.'
  },
  {
    id: 'V12', severity: 'INSTRUMENTO', status: 'CORREGIDO',
    shot: '08_applied_museum',
    title: 'Bajo carga, las capturas de «aplicado» fotografiaban la pantalla de carga',
    found: 'Con dos navegadores compitiendo por la CPU, seis capturas salieron negras con ' +
      '«Compilando materiales…» en lugar de la sala.',
    cause: 'Tras aplicar se esperaba a `__IW.ready`, que seguía valiendo `true` del arranque ' +
      'anterior: la espera volvía en el acto. En una máquina rápida colaba; en una lenta, no. ' +
      'Una espera que sólo funciona cuando no hace falta esperar.',
    fix: 'Se baja la bandera antes de aplicar, de modo que la espera sea de flanco. Este defecto ' +
      'no se vio en la primera tanda: apareció al mirar la segunda.'
  },
  {
    id: 'V13', severity: 'INSTRUMENTO', status: 'CORREGIDO',
    shot: '10b_projection_updated',
    title: 'La captura de la proyección no podía demostrar nada',
    found: 'El fixture de vídeo es el mismo archivo que la sala ya proyectaba, así que la imagen ' +
      'sale idéntica se haya aplicado o no.',
    cause: 'Se eligió un fixture del propio repositorio por honestidad —probar una subida con un ' +
      'archivo que ya está en el producto— sin advertir que eso hacía la foto indistinguible.',
    fix: 'Se mide dónde aterrizó la referencia autorizada y se publica junto al fotograma. ' +
      'Las dos obras enfocadas se capturan ahora con el editor cerrado, para que la obra se vea entera.'
  },
  {
    id: 'V15', severity: 'ALTA', status: 'ABIERTO — NO RESUELTO',
    shot: '10b_projection_updated',
    title: 'La proyección autorizada no se parece a la proyección original, y no sé por qué',
    found: 'Sin autoría (12b) la pantalla de Galería B es ancha, con marco claro e imagen azulada. ' +
      'Con el vídeo autorizado (10b) es un cuadrado verde sin marco. El verde es el de ' +
      '«marea-baja.jpg», que es la imagen, no el vídeo.',
    cause: 'NO DETERMINADA. El registro es correcto —medido tras aplicar: ' +
      '`entity.video.cuaderno-de-luz · PROJECTION · VIDEO` con un blob vivo—, así que el dato llega ' +
      'donde debe. Lo que no sé es qué dibuja el Scene Kit con él. Las dos capturas además no son ' +
      'comparables: pese a fijar la misma pose, la de referencia acabó en otro sitio de la sala, ' +
      'seguramente porque la cámara todavía pertenecía a la llegada del portal.',
    fix: 'NO SE TOCA. Hace falta (a) una comparación de verdad, misma pose y misma sala, esperando ' +
      'a que la cámara vuelva a EXPLORE, y (b) leer qué textura acaba en la superficie de ' +
      'proyección. Corregir esto a ojo sería inventar una causa. Es la primera pregunta pendiente ' +
      'del paquete y no debería aprobarse la vertical sin respuesta.'
  },
  {
    id: 'V4', severity: 'MEDIA', status: 'APLAZADO',
    shot: '06_media_ready',
    title: 'La cabecera fija tapa el campo que hay debajo al hacer scroll',
    found: 'El campo NOMBRE aparece cortado por la mitad bajo la cabecera «Edición».',
    cause: 'Comportamiento normal de `position:sticky` sin margen de desplazamiento.',
    fix: 'PROPUESTA: `scroll-margin-top` en los campos, o cabecera más baja al hacer scroll. ' +
      'No se toca ahora: es legibilidad, no una promesa rota, y cambia la proporción del panel.'
  },
  {
    id: 'V5', severity: 'MEDIA', status: 'APLAZADO',
    shot: '03_institution_edit',
    title: 'El título del panel no sigue lo que el autor escribe',
    found: 'Se teclea «Colección Marés» en NOMBRE y el panel sigue titulándose ' +
      '«Fundación Arenas — Colección permanente».',
    cause: 'El título muestra `config.label`, que es el nombre del documento, no el de la institución.',
    fix: 'PROPUESTA: titular con el nombre de la institución en vivo y bajar el label a subtítulo. ' +
      'Es una decisión de qué está editando el autor —un museo o un documento— y la toma Juanma.'
  },
  {
    id: 'V6', severity: 'MEDIA', status: 'APLAZADO',
    shot: '02_editor_open',
    title: 'Los selectores de archivo hablan inglés dentro de una herramienta en español',
    found: '«CHOOSE FILE / No file chosen» en las tres secciones con medios.',
    cause: 'Texto del navegador; `::file-selector-button` da estilo pero no contenido.',
    fix: 'PROPUESTA: input oculto tras un `<label>` propio («Elegir archivo»), con el estado real ' +
      'ya escrito debajo por el panel. Diez líneas, ninguna consecuencia funcional.'
  },
  {
    id: 'V7', severity: 'BAJA', status: 'APLAZADO',
    shot: '08_applied_museum',
    title: 'El panel no llega al fondo de la ventana',
    found: 'Franja oscura sin tratar bajo la última sección.',
    cause: 'El `padding-bottom` del panel no cubre el alto completo cuando el contenido no llega.',
    fix: 'PROPUESTA: fondo del panel en `min-height:100%`.'
  },
  {
    id: 'V8', severity: 'BAJA', status: 'APLAZADO',
    shot: '02_editor_open',
    title: 'El editor tapa la navegación de la sala',
    found: '«RECORRIDO COMENTADO» queda cortado por el borde del panel.',
    cause: 'El panel se superpone; la sala no se estrecha.',
    fix: 'PROPUESTA: desplazar el HUD cuando el editor está abierto, o estrechar el lienzo. ' +
      'Afecta a la composición de la sala y no debería decidirse sin verlo.'
  },
  {
    id: 'V9', severity: 'INSTRUMENTO', status: 'CORREGIDO',
    shot: '08_applied_museum',
    title: 'Las tres capturas «sala aplicada» fotografiaban el panel saliendo',
    found: 'Se pedía ocultar el editor y se disparaba la foto en el mismo instante; el panel tarda ' +
      '0,32 s en salir. Las tres pruebas de «cómo queda la sala» mostraban el editor encima.',
    cause: 'La herramienta no esperaba a la transición.',
    fix: 'Un `dismissEditor()` que espera. La evidencia de esta tanda ya es la buena.'
  },
  {
    id: 'V10', severity: 'INSTRUMENTO', status: 'CORREGIDO',
    shot: '09_focus_updated',
    title: 'La captura de Focus no mostraba ningún Focus',
    found: '09 y 10 eran idénticas byte a byte. Se enfocaba desde el vestíbulo una obra que está ' +
      'en Galería A, con la sala todavía sin construir: el HUD se iba, la cámara no se movía.',
    cause: 'La herramienta pedía el foco sin llevar antes al visitante donde está la obra.',
    fix: 'Cruzar el portal y situarse, como hace el estado determinista que ya existía para esto. ' +
      'Se añade además una captura de la proyección de Galería B, porque el vídeo ahora aterriza allí.'
  }
];

const SEV_ORDER = { BLOQUEANTE: 0, ALTA: 1, MEDIA: 2, BAJA: 3, INSTRUMENTO: 4 };
// Unresolved first within its severity: an open question is the one thing a
// reviewer must not scroll past.
DEFECTS.sort((a, b) => SEV_ORDER[a.severity] - SEV_ORDER[b.severity]
  || (a.status.startsWith('ABIERTO') ? -1 : 0) - (b.status.startsWith('ABIERTO') ? -1 : 0));

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const md = (s) => esc(s).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/«([^»]+)»/g, '«<em>$1</em>»');

const counts = DEFECTS.reduce((acc, d) => { acc[d.status] = (acc[d.status] || 0) + 1; return acc; }, {});

/**
 * The board is written twice from one source: once against the files on disk,
 * for the local server, and once with every image inlined, so the same page can
 * be published somewhere Juanma can open it without this machine running. A
 * second, differently-worded page would be a second truth.
 */
const inlined = Object.fromEntries(await Promise.all(visual.shots.map(async (s) => [
  s.file,
  `data:image/png;base64,${(await fs.readFile(path.join(DIR, s.file))).toString('base64')}`
])));

// `full` writes a complete document for the local server; without it the page is
// body-only, which is what a hosted artifact wraps.
const page = (src, full = true) => `${full ? `<!doctype html>
<html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">` : ''}
<title>Museum · Authoring VS01 — revisión visual</title>
<style>
:root{color-scheme:dark}
*{box-sizing:border-box}
body{margin:0;background:#111010;color:#e6e0d5;
  font:400 15px/1.6 'Helvetica Neue',Helvetica,Arial,sans-serif}
.wrap{max-width:1180px;margin:0 auto;padding:56px 28px 96px}
h1{font:400 34px/1.2 Georgia,'Times New Roman',serif;color:#f2ede3;margin:0 0 6px}
.eyebrow{font-size:10px;letter-spacing:.34em;text-transform:uppercase;color:#8d867c;margin:0 0 14px}
.lede{max-width:70ch;color:#b8b0a4;margin:0 0 8px}
h2{font:400 12px/1.3 'Helvetica Neue',sans-serif;letter-spacing:.22em;text-transform:uppercase;
  color:#c9bfa8;margin:56px 0 4px;padding-top:22px;border-top:1px solid rgba(190,180,165,.16)}
h2+p{color:#8d867c;font-size:13px;max-width:70ch;margin:0 0 26px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(330px,1fr));gap:22px}
figure{margin:0;background:#191817;border:1px solid rgba(190,180,165,.14);border-radius:5px;overflow:hidden}
figure img{display:block;width:100%;height:auto;background:#0b0a0a}
figcaption{padding:11px 14px 14px;font-size:12.5px;color:#b8b0a4}
figcaption b{display:block;color:#8d867c;font-size:10px;letter-spacing:.18em;
  text-transform:uppercase;margin-bottom:4px;font-weight:400}
.d{border:1px solid rgba(190,180,165,.16);border-radius:5px;padding:20px 22px;margin-bottom:14px;background:#171615}
.d h3{margin:0 0 10px;font:400 17px/1.35 Georgia,serif;color:#f0ebe1}
.d dl{display:grid;grid-template-columns:96px 1fr;gap:6px 16px;margin:0;font-size:13.5px}
.d dt{color:#8d867c;font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;padding-top:3px}
.d dd{margin:0;color:#cdc5b8}
.tags{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:9px}
.t{font-size:10px;letter-spacing:.14em;text-transform:uppercase;padding:3px 9px;border-radius:999px;
  border:1px solid rgba(190,180,165,.3);color:#c9bfa8}
.t--BLOQUEANTE{background:#4a1f1c;border-color:#8a4038;color:#ffcdc6}
.t--ALTA{background:#4a3a18;border-color:#8a6c2e;color:#f5dfa8}
.t--MEDIA{background:#28313a;border-color:#4b5c6b;color:#cfe0ec}
.t--BAJA,.t--INSTRUMENTO{background:#22211f}
.t--CORREGIDO{background:#20351f;border-color:#456b41;color:#c4e6bd}
.t--APLAZADO{background:#22211f;color:#a49d92}
.t--abierto{background:#4a1f1c;border-color:#a8524a;color:#ffd4cd}
code{font:12.5px/1.5 ui-monospace,Menlo,Consolas,monospace;background:rgba(255,252,246,.07);
  padding:1px 5px;border-radius:3px;color:#e3dccd}
.sum{display:flex;gap:26px;flex-wrap:wrap;margin:22px 0 0;padding:16px 20px;
  background:#171615;border:1px solid rgba(190,180,165,.16);border-radius:5px}
.sum div{font-size:12px;color:#8d867c}
.sum b{display:block;font:400 26px/1.1 Georgia,serif;color:#f0ebe1;margin-bottom:3px}
.gate{margin-top:56px;padding:22px 24px;border:1px solid rgba(190,180,165,.28);border-radius:5px}
.gate p{margin:0 0 8px;color:#cdc5b8}
.gate p:last-child{margin:0}
a{color:#d8cdb5}
@media(max-width:620px){.wrap{padding:34px 16px 64px}.d dl{grid-template-columns:1fr;gap:2px 0}
.d dt{padding-top:9px}}
body{background:#111010}
</style>${full ? '</head><body>' : ''}<div class="wrap">

<p class="eyebrow">Escaparates Pro · Immersive Worlds · Museum</p>
<h1>Authoring VS01 — revisión visual</h1>
<p class="lede">Lo que ve un autor mientras personaliza el museo, en el orden en que lo ve, capturado
en un navegador real a 1440×900 y a 420×860. Debajo, los defectos encontrados <em>mirando</em>
estas imágenes, no ejecutando aserciones.</p>
<p class="lede">Superficie de revisión humana. No es una aprobación: el producto lo aprueba Juanma.</p>

<div class="sum">
  <div><b>${visual.shots.length}</b>capturas</div>
  <div><b>${DEFECTS.length}</b>defectos vistos</div>
  <div><b>${counts.CORREGIDO || 0}</b>corregidos</div>
  <div><b>${counts.APLAZADO || 0}</b>aplazados a criterio</div>
  <div><b>${DEFECTS.filter((d) => d.status.startsWith('ABIERTO')).length}</b>sin resolver</div>
  <div><b>${visual.horizontalOverflowAt420 ? 'sí' : 'no'}</b>desbordamiento a 420 px</div>
</div>

<h2>Defectos encontrados por Claude</h2>
<p>Ordenados por severidad de producto. Sólo se han corregido los bloqueantes y lo que impedía que
la evidencia dijera la verdad; el resto se deja visible y sin tocar, con la corrección propuesta.</p>
${DEFECTS.map((d) => `<article class="d">
  <div class="tags"><span class="t t--${d.severity}">${d.severity}</span>
    <span class="t t--${d.status.startsWith('ABIERTO') ? 'abierto' : d.status}">${esc(d.status)}</span>
    <span class="t">${d.id}</span>
    <span class="t"><a href="#${esc(d.shot)}">${esc(d.shot)}</a></span></div>
  <h3>${md(d.title)}</h3>
  <dl>
    <dt>Se ve</dt><dd>${md(d.found)}</dd>
    <dt>Por qué</dt><dd>${md(d.cause)}</dd>
    <dt>${d.status === 'CORREGIDO' ? 'Corrección' : d.status.startsWith('ABIERTO') ? 'Qué falta' : 'Propuesta'}</dt><dd>${md(d.fix)}</dd>
  </dl>
</article>`).join('\n')}

<h2>Recorrido del autor</h2>
<p>Museo por defecto · editar institución · editar obra · subir imagen y vídeo · aplicar ·
ver el resultado en la sala · segunda institución · volver al original.</p>
<div class="grid">
${visual.shots.map((s) => `<figure id="${esc(s.id)}">
  <img src="${src(s.file)}" alt="${esc(s.caption)}" loading="lazy">
  <figcaption><b>${esc(s.id)}</b>${esc(s.caption)}</figcaption>
</figure>`).join('\n')}
</div>

<h2>Condiciones de la captura</h2>
<p>Navegador real (Chromium, rasterizado por software), ficheros reales del propio repositorio.
Generado ${esc(visual.generatedAt)} · fixtures ${visual.fixtures.map(esc).join(' · ')} ·
estado del vídeo: ${esc(visual.videoState)} ·
consola: ${visual.errors.length ? `${visual.errors.length} entrada(s)` : 'limpia'}.</p>
<p>Medios autorizados presentes en el mundo tras aplicar —dónde aterrizó cada archivo, medido, no
fotografiado: ${(visual.videoRouting || []).length
  ? `<code>${visual.videoRouting.map(esc).join('</code> · <code>')}</code>`
  : 'ninguno'}.</p>
${visual.errors.length ? `<pre style="white-space:pre-wrap;font-size:12px;color:#e0a89f">${esc(visual.errors.join('\n'))}</pre>` : ''}

<div class="gate">
  <p><b>Puerta.</b> Esto queda a la espera de revisión de Juanma y de ChatGPT. Nada se ha promovido,
  nada se ha fusionado, y la rama sigue siendo <code>claude/immersive-worlds-module-c0d3f7</code>.</p>
  <p>Lo aplazado está aplazado a propósito: son decisiones de producto, no deuda escondida.</p>
</div>

</div>${full ? '</body></html>' : ''}
`;

await fs.writeFile(path.join(DIR, 'index.html'), page(esc));
const standalone = page((file) => inlined[file], false);
await fs.writeFile(path.join(DIR, 'board-inline.html'), standalone);

console.log('  tablero:    qa/evidence-authoring/index.html');
console.log(`  publicable: qa/evidence-authoring/board-inline.html (${(standalone.length / 1e6).toFixed(1)} MB)`);
console.log(`  ${visual.shots.length} capturas · ${DEFECTS.length} defectos ` +
  `(${counts.CORREGIDO || 0} corregidos, ${counts.APLAZADO || 0} aplazados)`);
