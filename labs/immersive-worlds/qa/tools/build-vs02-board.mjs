/**
 * VS02 — human review surface.
 *
 * Two pages out of one source:
 *
 *   index.html     the review board — every captured state with what it was
 *                  supposed to show and what it actually showed, the defect
 *                  ledger, and the VS01/VS02 comparison.
 *   gauntlet.html  the live progress page — where the run is, what the critics
 *                  said, what is still open. So nobody has to interrupt a run to
 *                  ask how it is going.
 *
 * The board reads the capture manifests rather than being written by hand, so a
 * caption cannot drift from the frame it captions.
 *
 *   node qa/tools/build-vs02-board.mjs
 */
import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MODULE_ROOT = path.resolve(HERE, '..', '..');
const REPO_ROOT = path.resolve(MODULE_ROOT, '../..');
const DIR = path.join(MODULE_ROOT, 'qa', 'evidence-vs02');
const HEAD = execSync('git rev-parse --short HEAD', { cwd: REPO_ROOT }).toString().trim();

const WAVES = [
  { id: 'w1', name: 'W1 · Árbol de la experiencia y espacio de trabajo' },
  { id: 'w2', name: 'W2 · Medios, estados y recuperación' },
  { id: 'w3', name: 'W3–W4 · Guardar, validar, empezar y la segunda institución' }
];

const waves = [];
for (const wave of WAVES) {
  const file = path.join(DIR, wave.id, 'capture.json');
  if (!fsSync.existsSync(file)) continue;
  waves.push({ ...wave, data: JSON.parse(await fs.readFile(file, 'utf8')) });
}

/**
 * Found by looking at the captures, or measured in the runs. Severity is about
 * the product, not about the effort it took.
 */
const DEFECTS = [
  {
    id: 'D1', severity: 'BLOQUEANTE', status: 'CORREGIDO', wave: 'W2', shot: 'w2/14_VIDEO_READY',
    title: 'Cada archivo se aceptaba dos veces, y la cifra crecía con el uso',
    found: 'El registro de transiciones mostraba SELECCIONADO → CARGANDO repetido: dos veces al ' +
      'principio de la sesión, doce veces después de unas cuantas selecciones.',
    cause: 'Un redibujado parcial volvía a enlazar todo el estudio, de modo que los controles que ' +
      'sobrevivían al redibujado acumulaban un oyente más cada vez. Una subida acababa ' +
      'ejecutándose seis veces: seis decodificaciones y seis object URL, cinco de ellos sin revocar.',
    fix: 'El enlazado es ahora local al fragmento redibujado. La suite de humo falla si un clic ' +
      'vuelve a producir dos aceptaciones — el defecto se escondía en un registro, no en un ' +
      'fotograma, y no debería depender de que alguien lo lea.'
  },
  {
    id: 'D2', severity: 'ALTA', status: 'CORREGIDO', wave: 'W1', shot: 'w1/04_INSTITUTION_EDIT',
    title: 'Editar la institución no cambiaba nada visible',
    found: 'Con «Colección Marés» ya escrito en el campo, la cabecera del editor, la miga de pan y ' +
      'la fila del árbol seguían diciendo «Fundación Arenas».',
    cause: 'Sólo la columna de proyecto se redibujaba al teclear.',
    fix: 'Cada superficie que nombra el registro sigue al campo que lo renombra, y seleccionar la ' +
      'institución lleva la vista previa a la cartela de entrada, que es donde esos campos se ' +
      'imprimen. El fotograma que debía demostrar «qué va a cambiar» demostraba lo contrario.'
  },
  {
    id: 'D3', severity: 'ALTA', status: 'CORREGIDO', wave: 'W1', shot: 'w1/08_ARTWORK_SELECTED',
    title: 'No se distinguía un dato heredado de un campo vacío',
    found: 'Los valores del registro se dibujaban como placeholder gris, igual que la ausencia de dato.',
    cause: 'El editor usaba `placeholder` para mostrar lo que la ficha ya contiene.',
    fix: 'Los valores heredados son valores, marcados «del registro» hasta que el autor toma el ' +
      'campo. En una herramienta de catalogación esto no es estética: es integridad del dato.'
  },
  {
    id: 'D4', severity: 'ALTA', status: 'CORREGIDO', wave: 'W1', shot: 'w1/25_NARROW_VIEW',
    title: 'A 420 px el editor era inalcanzable y la acción principal se salía',
    found: 'Las columnas se recortaban a sí mismas —el editor mostraba una etiqueta y ningún ' +
      'campo—, «Empezar experiencia» quedaba cortada por el borde derecho, y desaparecían la ' +
      'miga de pan y el estado de guardado.',
    cause: 'Cada columna era un contenedor con scroll dentro de una pista de rejilla sin altura.',
    fix: 'Un solo documento que se desplaza, con la vista previa fija arriba, la miga y el estado ' +
      'anclados, y una barra inferior para saltar a cada sección.'
  },
  {
    id: 'D5', severity: 'MEDIA', status: 'CORREGIDO', wave: 'W1', shot: 'w1/02_VS02_DEFAULT',
    title: 'La navegación del visitante peleaba con el estudio por la misma sala',
    found: 'Dentro de la columna más estrecha, la barra del visitante se envolvía en tres filas ' +
      'sobre la sala y duplicaba lo que ya hacía el árbol.',
    cause: 'El HUD del visitante estaba diseñado para una ventana completa.',
    fix: 'La navegación del visitante espera al visitante. La cartela y el transporte del ' +
      'recorrido se quedan: eso es la vista previa diciendo la verdad sobre la experiencia.'
  },
  {
    id: 'D6', severity: 'MEDIA', status: 'CORREGIDO', wave: 'W2', shot: 'w2/14_VIDEO_READY',
    title: 'El estado final se pintaba como un paso pendiente',
    found: 'LISTO salía en ámbar, el mismo color que «cargando», mientras los pasos anteriores ' +
      'estaban en verde.',
    cause: 'El último eslabón de la cadena era también el eslabón «actual».',
    fix: 'LISTO es final y se pinta como tal. Un archivo terminado no debe parecer atascado.'
  },
  {
    id: 'D7', severity: 'MEDIA', status: 'CORREGIDO', wave: 'W3', shot: 'w3/15_CONFIG_SAVED',
    title: '«Guardado» aparecía en un proyecto que nunca se había guardado',
    found: 'Tras aplicar una vista previa, la cadena marcaba GUARDADO como completado.',
    cause: 'El indicador miraba «no hay cambios pendientes» en lugar de «lo almacenado coincide ' +
      'con lo que hay en pantalla». Aplicar reconstruye el estudio, y un estudio recién creado ' +
      'no tiene cambios pendientes.',
    fix: 'Se compara el proyecto en pantalla con el almacenado. ASSET READY, CONFIG SAVED y ' +
      'PROJECT READY son tres cosas distintas y ahora se dicen por separado.'
  },
  {
    id: 'D8', severity: 'MEDIA', status: 'CORREGIDO', wave: 'W1', shot: 'w1/02_VS02_DEFAULT',
    title: 'Nombres de la base de datos y de QA a la vista de la institución',
    found: '`space.gallery-a`, `entity.artwork.division-tercera` y un botón «CARGAR MUSEO B» con ' +
      'el mismo peso visual que «Exportar proyecto».',
    cause: 'Identificadores del modelo y nombres de fixture usados como texto de producto.',
    fix: 'SALA 02 y OBRA 03 en pantalla, el identificador real en el tooltip; y los botones ' +
      'nombran instituciones: «Abrir Museo de la Bruma (ejemplo)», «Restaurar la Fundación Arenas».'
  },
  {
    id: 'D9', severity: 'BAJA', status: 'CORREGIDO', wave: 'W1', shot: 'w1/03_EXPERIENCE_TREE',
    title: '«1 piezas», y un punto de «personalizado» en todo lo que tuviera valor',
    found: 'El árbol se pintaba verde entero en un proyecto que nadie había tocado.',
    cause: '«Personalizado» significaba «tiene un valor» en lugar de «difiere de lo que el Museo trae».',
    fix: 'Compara contra el registro. Y el plural concuerda.'
  },
  {
    id: 'I1', severity: 'INSTRUMENTO', status: 'CORREGIDO', wave: 'W3', shot: 'w3/17b_IDENTITY_ON_WALL',
    title: 'Un fotograma titulado «la cartela de entrada» estaba en otra sala',
    found: 'Se fijaba la pose del vestíbulo mientras la vista previa seguía en Galería B.',
    cause: 'Fijar una pose no cambia de sala.',
    fix: 'Se cruza el portal y se encuadra con el propio encuadre semántico del motor, que no se ' +
      'desvía cuando cambia la forma del viewport.'
  },
  {
    id: 'I2', severity: 'INSTRUMENTO', status: 'CORREGIDO', wave: 'W1', shot: 'w1/02_VS02_DEFAULT',
    title: 'La vista previa medía su columna antes de que existiera la hoja de estilos',
    found: 'El lienzo quedaba clavado en su altura mínima, 672×240 en vez de 672×420.',
    cause: 'El estudio se construía sin esperar a que cargara su CSS, y midió un div sin estilo.',
    fix: 'Se espera a la hoja, y la medida se repite en cada cambio de tamaño.'
  },
  {
    id: 'D10', severity: 'BLOQUEANTE', status: 'CORREGIDO', wave: 'W5', shot: 'w1/02_VS02_DEFAULT',
    title: 'El porcentaje del proyecto contradecía las filas que tenía justo debajo',
    found: 'La tarjeta decía «100% · todo el contenido necesario está listo» y cuarenta píxeles ' +
      'más abajo «Identidad 4/5». En la pantalla de recuperación decía 100% sobre «Presentación ' +
      '2/3». En la del error decía «27 / 28» mientras las filas sumaban 31 de 32.',
    cause: 'El porcentaje contaba sólo los elementos obligatorios y las filas contaban todos. Dos ' +
      'contabilidades distintas dibujadas en la misma tarjeta.',
    fix: 'Las filas cuentan exactamente el conjunto del que sale el porcentaje, las cuatro ' +
      'categorías aparecen siempre en el mismo orden, y una categoría sin elementos no se dibuja ' +
      'en lugar de mostrar 0/0.'
  },
  {
    id: 'D11', severity: 'ALTA', status: 'CORREGIDO', wave: 'W5', shot: 'w3/21_MUSEUM_B',
    title: 'El logotipo del Museo B decía «Sin archivo» junto a su propio nombre de archivo',
    found: 'Botón «Cambiar archivo», nombre «bruma-logo.png», los cuatro pasos apagados y debajo, ' +
      'en ámbar, «Sin archivo». Tres señales, dos respuestas, en una tarjeta.',
    cause: 'Un archivo que llega con el proyecto no pasa por el almacén de medios de la sesión, y ' +
      'la descripción de estado sólo sabía leer assets de sesión.',
    fix: 'Un medio que ya está en el proyecto se describe como tal: «En el proyecto», con la ' +
      'cadena completa y sus dimensiones.'
  },
  {
    id: 'D12', severity: 'ALTA', status: 'CORREGIDO', wave: 'W5', shot: 'w1/02_VS02_DEFAULT',
    title: 'La insignia decía «vista en vivo» al lado de un botón llamado «Vista previa»',
    found: 'El centro se anunciaba como en vivo mientras una pulsación de tecla no llegaba a él, ' +
      'de modo que el botón que sí lo actualizaba parecía no hacer nada.',
    cause: 'La vista previa muestra el proyecto aplicado, no el borrador. La insignia decía otra cosa.',
    fix: '«Vista previa aplicada» y, en cuanto hay cambios sin aplicar, «Vista previa ' +
      'desactualizada» en ámbar. El efecto del botón se ve.'
  },
  {
    id: 'D13', severity: 'ALTA', status: 'CORREGIDO', wave: 'W5', shot: 'w3/21_MUSEUM_B',
    title: 'Nombres de QA y jerga de motor impresos en contenido de cara al visitante',
    found: 'El texto de la cartela de entrada del Museo B decía «Esta configuración existe para ' +
      'probar que una segunda institución usa el mismo motor sin tocar una línea de código». La ' +
      'obra en edición se llamaba «Prueba de marea». Los errores citaban «text/plain» y los avisos ' +
      '«archivo 1.46 · soporte 0.81».',
    cause: 'Texto de prueba escrito en campos de producto, y mensajes redactados para quien ' +
      'programa en lugar de para quien cataloga.',
    fix: 'El Museo B tiene ahora un texto institucional real. El error dice «Ese archivo no es una ' +
      'imagen JPG, PNG o WebP. Elige otro y vuelve a intentarlo». El aviso dice «La imagen es más ' +
      'ancha que el soporte y se recortará por los lados». Las capturas escriben títulos que una ' +
      'institución escribiría.'
  },
  {
    id: 'D14', severity: 'MEDIA', status: 'CORREGIDO', wave: 'W5', shot: 'w1/02_VS02_DEFAULT',
    title: 'La pared decía «Once obras» y el Museo tiene nueve',
    found: 'La cartela de entrada anunciaba once obras; el árbol suma nueve piezas en cuatro salas.',
    cause: 'Texto del mundo escrito antes de que existiera un árbol capaz de contarlo. VS02 no lo ' +
      'introdujo: lo hizo visible.',
    fix: 'Corregido el texto del mundo. Cuando la herramienta y la pared discrepan, una de las dos ' +
      'está mintiendo a un visitante.'
  },
  {
    id: 'D15', severity: 'MEDIA', status: 'CORREGIDO', wave: 'W5', shot: 'w1/25_NARROW_VIEW',
    title: 'Vocabulario y estados inconsistentes entre pantallas',
    found: 'La misma pieza era OBRA en una pantalla y PIEZA en la siguiente; la barra inferior a ' +
      '420 px no señalaba qué pestaña estaba activa; la introducción se cortaba por los ' +
      'descendentes en seis capturas.',
    cause: 'Dos vocabularios para un tipo de objeto, una barra sin estado y un textarea de cuatro ' +
      'líneas para un texto de cinco.',
    fix: 'Un solo sustantivo por tipo, el mismo que usa el árbol. Pestaña activa marcada. El campo ' +
      'de introducción cabe.'
  },
  {
    id: 'O4', severity: 'MEDIA', status: 'ABIERTO — A CRITERIO DE JUANMA', wave: 'W5', shot: 'w1/04_INSTITUTION_EDIT',
    title: 'Renombrar la institución no reescribe los textos libres que la nombran',
    found: 'Tras cambiar el nombre a «Colección Marés», la introducción seguía diciendo «La ' +
      'Fundación Arenas reúne pintura… entre 1958 y 1994», y ese texto se imprime en la pared.',
    cause: 'Es contenido redactado por el autor. El producto no puede reescribirlo sin inventar ' +
      'prosa institucional en nombre de una institución.',
    fix: 'PROPUESTA: detectar el nombre anterior dentro de los textos libres y avisar en línea ' +
      '—«Este texto todavía nombra a Fundación Arenas»— con reemplazo en un clic. Avisar es del ' +
      'producto; reescribir la voz de una institución no lo es, y esa frontera la decide Juanma.'
  },
  {
    id: 'O5', severity: 'BAJA', status: 'ABIERTO — POR DISEÑO', wave: 'W5', shot: 'w3/21_MUSEUM_B',
    title: 'El Museo B es el mismo mundo con otra configuración',
    found: 'Un crítico lo describió como «la Fundación Arenas con tres cadenas renombradas».',
    cause: 'Es exactamente lo que la prueba de la segunda institución comprueba: mismo motor, ' +
      'mismo mundo, otra configuración. Un mundo distinto probaría otra cosa.',
    fix: 'Sin cambio de código. Difiere en nombre, claim, datación, marca, nombre de sala, una ' +
      'imagen de obra y los metadatos de dos obras. Si Juanma quiere que la demostración sea más ' +
      'evidente, se amplía la configuración —no el motor.'
  },
  {
    id: 'O1', severity: 'ALTA', status: 'ABIERTO — HEREDADO', wave: 'VS01', shot: null,
    title: 'La proyección autorizada no se parece a la original y la causa sigue sin determinar',
    found: 'Defecto abierto de VS01. VS02 no lo ha investigado.',
    cause: 'NO DETERMINADA.',
    fix: 'Aplazado con trazabilidad, según §E7 del mandato: VS02 no toca la capacidad de ' +
      'Proyección más allá de encaminar el archivo correcto hacia ella, y ninguna tarea de ' +
      'aceptación queda bloqueada por esto. Sigue abierto y sigue siendo la primera pregunta ' +
      'pendiente del vertical.'
  },
  {
    id: 'O2', severity: 'MEDIA', status: 'ABIERTO — ACCESO DENEGADO', wave: 'Preflight', shot: null,
    title: 'La referencia externa de calidad no es accesible desde este entorno',
    found: 'thevertmenthe.dault-lafon.fr responde 403 en el CONNECT de la pasarela de salida, ' +
      'tanto por navegador real como por descarga.',
    cause: 'Política de red del entorno. No es una caída del sitio.',
    fix: 'BARRA VISUAL EXTERNA — ACCESO BLOQUEADO / HUECO DE EVIDENCIA. La herramienta de captura ' +
      'queda escrita y comprobada; una sola ejecución produce la evidencia en cuanto el dominio ' +
      'se permita. Para esta vuelta la barra autorizada es la referencia de UI aprobada, el ' +
      'plano del sistema, VS01 y el Museo en funcionamiento.'
  },
  {
    id: 'O3', severity: 'MEDIA', status: 'ABIERTO — FUERA DE ALCANCE VS02', wave: 'W1', shot: null,
    title: 'Tres de los cinco dominios están declarados y no implementados',
    found: 'Experiencia, Visitante y Publicar aparecen en la navegación marcados «más adelante» ' +
      'y deshabilitados.',
    cause: 'El mandato los describe; su alcance no está autorizado en VS02 (§A5).',
    fix: 'Se muestran en vez de ocultarse, para que la forma del producto sea legible, y se ' +
      'declaran incompletos en vez de fingirse. Si Juanma prefiere ocultarlos hasta que existan, ' +
      'es una línea.'
  }
];

const SEV = { BLOQUEANTE: 0, ALTA: 1, MEDIA: 2, BAJA: 3, INSTRUMENTO: 4 };
DEFECTS.sort((a, b) => SEV[a.severity] - SEV[b.severity]
  || (a.status.startsWith('ABIERTO') ? -1 : 1) - (b.status.startsWith('ABIERTO') ? -1 : 1));

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const md = (s) => esc(s).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/«([^»]+)»/g, '«<em>$1</em>»');

const counts = DEFECTS.reduce((a, d) => { a[d.status.split(' ')[0]] = (a[d.status.split(' ')[0]] || 0) + 1; return a; }, {});
const totalShots = waves.reduce((n, w) => n + w.data.shots.length, 0);
const allErrors = waves.flatMap((w) => w.data.errors);

const CSS = `
:root{color-scheme:dark}
*{box-sizing:border-box}
body{margin:0;background:#100f0e;color:#ece7dd;
  font:400 15px/1.6 'Helvetica Neue',Helvetica,Arial,sans-serif}
.wrap{max-width:1240px;margin:0 auto;padding:56px 28px 96px}
h1{font:400 34px/1.2 Georgia,'Times New Roman',serif;color:#f2ede3;margin:0 0 6px}
.eyebrow{font-size:10px;letter-spacing:.34em;text-transform:uppercase;color:#6f6960;margin:0 0 14px}
.lede{max-width:72ch;color:#b3aca1;margin:0 0 8px}
h2{font:400 12px/1.3 'Helvetica Neue',sans-serif;letter-spacing:.22em;text-transform:uppercase;
  color:#c9bfa8;margin:56px 0 4px;padding-top:22px;border-top:1px solid rgba(226,219,205,.16)}
h2+p{color:#6f6960;font-size:13px;max-width:72ch;margin:0 0 26px}
h3.wave{font:400 15px/1.3 Georgia,serif;color:#ece7dd;margin:34px 0 16px;letter-spacing:0}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:22px}
figure{margin:0;background:#181716;border:1px solid rgba(226,219,205,.14);border-radius:5px;overflow:hidden}
figure img{display:block;width:100%;height:auto;background:#0b0a0a}
figcaption{padding:12px 14px 15px;font-size:12.5px;color:#b3aca1}
figcaption b{display:block;color:#6f6960;font-size:10px;letter-spacing:.18em;
  text-transform:uppercase;margin-bottom:5px;font-weight:400}
figcaption dl{display:grid;grid-template-columns:auto 1fr;gap:3px 10px;margin:9px 0 0;font-size:11.5px}
figcaption dt{color:#6f6960;font-size:9.5px;letter-spacing:.12em;text-transform:uppercase;padding-top:2px}
figcaption dd{margin:0;color:#9a9389}
.d{border:1px solid rgba(226,219,205,.16);border-radius:5px;padding:20px 22px;margin-bottom:14px;background:#171615}
.d h3{margin:0 0 10px;font:400 17px/1.35 Georgia,serif;color:#f0ebe1}
.d dl{display:grid;grid-template-columns:104px 1fr;gap:6px 16px;margin:0;font-size:13.5px}
.d dt{color:#6f6960;font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;padding-top:3px}
.d dd{margin:0;color:#c4bcae}
.tags{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:9px}
.t{font-size:10px;letter-spacing:.14em;text-transform:uppercase;padding:3px 9px;border-radius:999px;
  border:1px solid rgba(226,219,205,.3);color:#c9bfa8}
.t--BLOQUEANTE{background:#4a1f1c;border-color:#8a4038;color:#ffcdc6}
.t--ALTA{background:#4a3a18;border-color:#8a6c2e;color:#f5dfa8}
.t--MEDIA{background:#28313a;border-color:#4b5c6b;color:#cfe0ec}
.t--BAJA,.t--INSTRUMENTO{background:#22211f}
.t--CORREGIDO{background:#20351f;border-color:#456b41;color:#c4e6bd}
.t--ABIERTO{background:#4a1f1c;border-color:#a8524a;color:#ffd4cd}
code{font:12.5px/1.5 ui-monospace,Menlo,Consolas,monospace;background:rgba(255,252,246,.07);
  padding:1px 5px;border-radius:3px;color:#e3dccd}
.sum{display:flex;gap:26px;flex-wrap:wrap;margin:22px 0 0;padding:16px 20px;
  background:#171615;border:1px solid rgba(226,219,205,.16);border-radius:5px}
.sum div{font-size:12px;color:#6f6960}
.sum b{display:block;font:400 26px/1.1 Georgia,serif;color:#f0ebe1;margin-bottom:3px}
.gate{margin-top:56px;padding:22px 24px;border:1px solid rgba(226,219,205,.28);border-radius:5px}
.gate p{margin:0 0 8px;color:#c4bcae}
.gate p:last-child{margin:0}
a{color:#d8cdb5}
table{width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px}
th,td{text-align:left;padding:8px 10px;border-bottom:1px solid rgba(226,219,205,.14);vertical-align:top}
th{font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:#6f6960;font-weight:400}
.ok{color:#8fbf95}.bad{color:#e08a80}.warn{color:#d8b45e}
@media(max-width:620px){.wrap{padding:34px 16px 64px}.d dl{grid-template-columns:1fr;gap:2px 0}
.d dt{padding-top:9px}}
`;

const shotFigure = (waveId, s) => `
  <figure id="${esc(waveId)}_${esc(s.id)}">
    <img src="${esc(waveId)}/${esc(s.file)}" alt="${esc(s.state)}" loading="lazy">
    <figcaption>
      <b>${esc(s.id)} · ${esc(s.viewport)} · ${esc(s.museum)}</b>
      ${esc(s.state)}
      <dl>
        <dt>Acción</dt><dd>${esc(s.action)}</dd>
        <dt>Se espera</dt><dd>${esc(s.expected)}</dd>
        <dt>Se observa</dt><dd>${esc(s.observed)}</dd>
      </dl>
    </figcaption>
  </figure>`;

const board = `<!doctype html>
<html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Museum · Authoring VS02 — revisión visual</title>
<style>${CSS}</style></head><body><div class="wrap">

<p class="eyebrow">Escaparates Pro · Immersive Worlds · Museum</p>
<h1>Authoring VS02 — revisión visual</h1>
<p class="lede">El Estudio de Experiencia sobre el Museo real, capturado en un navegador real. Cada
fotograma dice qué acción lo produjo, qué se esperaba y qué se observó, para que se pueda discrepar
del resultado y no sólo de la foto.</p>
<p class="lede">Superficie de revisión humana. No es una aprobación: el producto lo aprueba Juanma.</p>

<div class="sum">
  <div><b>${totalShots}</b>capturas</div>
  <div><b>${DEFECTS.length}</b>defectos registrados</div>
  <div><b>${counts.CORREGIDO || 0}</b>corregidos</div>
  <div><b>${counts.ABIERTO || 0}</b>abiertos</div>
  <div><b>${allErrors.length}</b>errores de consola</div>
  <div><b>${esc(HEAD)}</b>HEAD</div>
</div>

<h2>VS01 frente a VS02</h2>
<p>Misma tarea, mismo viewport, mismo contenido. VS01 sigue siendo ejecutable en
<code>?authoring=1&amp;shell=vs01</code>: una referencia que no se puede arrancar no es una referencia.</p>
<table>
  <tr><th>Criterio</th><th>VS01</th><th>VS02</th></tr>
  <tr><td>Navegación</td><td>Un desplegable con una obra seleccionada</td><td class="ok">Árbol de 4 salas y 11 piezas, todas alcanzables</td></tr>
  <tr><td>Relación con la sala</td><td>Panel superpuesto sobre la sala</td><td class="ok">Sala acoplada en el centro, con proporción de visitante</td></tr>
  <tr><td>Destino de los medios</td><td>Una ranura ambigua; el vídeo borraba la imagen</td><td class="ok">Ranuras semánticas por tipo de pieza</td></tr>
  <tr><td>Estado del archivo</td><td>Una palabra</td><td class="ok">Cadena de estados, en español, con datos reales</td></tr>
  <tr><td>Preparación del proyecto</td><td>No existía</td><td class="ok">Obligatorio/opcional, por dominios, con bloqueo real</td></tr>
  <tr><td>Vista previa y Empezar</td><td>El mismo botón</td><td class="ok">Actos distintos; Empezar entra en modo visitante limpio</td></tr>
  <tr><td>Idioma</td><td>«CHOOSE FILE / No file chosen»</td><td class="ok">Español en todo el producto</td></tr>
  <tr><td>420 px</td><td>El panel ocupaba la ventana</td><td class="ok">Un documento, vista previa fija, sin desbordamiento</td></tr>
</table>

<h2>Defectos encontrados por Claude</h2>
<p>Ordenados por severidad de producto; los abiertos, primero dentro de su severidad. Encontrados
mirando las capturas o midiendo las ejecuciones, no leyendo el código.</p>
${DEFECTS.map((d) => `<article class="d">
  <div class="tags">
    <span class="t t--${d.severity}">${esc(d.severity)}</span>
    <span class="t t--${d.status.startsWith('ABIERTO') ? 'ABIERTO' : 'CORREGIDO'}">${esc(d.status)}</span>
    <span class="t">${esc(d.id)}</span><span class="t">${esc(d.wave)}</span>
    ${d.shot ? `<span class="t"><a href="#${esc(d.shot.replace('/', '_'))}">${esc(d.shot)}</a></span>` : ''}
  </div>
  <h3>${md(d.title)}</h3>
  <dl>
    <dt>Se ve</dt><dd>${md(d.found)}</dd>
    <dt>Por qué</dt><dd>${md(d.cause)}</dd>
    <dt>${d.status === 'CORREGIDO' ? 'Corrección' : 'Qué falta'}</dt><dd>${md(d.fix)}</dd>
  </dl>
</article>`).join('\n')}

<h2>El recorrido del autor</h2>
<p>Abrir · navegar la exposición · editar la institución · subir marca, imagen y vídeo · guardar ·
validar · vista previa · empezar como visitante · segunda institución · volver al original.</p>
${waves.map((w) => `
  <h3 class="wave">${esc(w.name)} — run <code>${esc(w.data.runId)}</code> · HEAD <code>${esc(w.data.head)}</code></h3>
  <div class="grid">${w.data.shots.map((s) => shotFigure(w.id, s)).join('')}</div>
  ${w.data.routing?.length ? `<p style="font-size:12.5px;color:#9a9389;margin-top:14px">
    Medios autorizados presentes en el mundo tras aplicar, medidos y no fotografiados:
    ${w.data.routing.map((r) => `<code>${esc(r)}</code>`).join(' · ')}</p>` : ''}
  ${w.data.transitions?.length ? `<p style="font-size:12.5px;color:#9a9389;margin-top:10px">
    Cadena de estados registrada en esta tanda:
    ${[...new Set(w.data.transitions.map((t) => `${t.kind}:${t.state}`))].map((t) => `<code>${esc(t)}</code>`).join(' · ')}</p>` : ''}
`).join('')}

<h2>Condiciones</h2>
<p>Chromium real, rasterizado por software. Fixtures generados para esta vuelta y deliberadamente
distintos de la colección: en VS01 se probó una subida con el archivo que la sala ya usaba, y la
captura de después salió idéntica a la de antes.
Consola: ${allErrors.length ? `${allErrors.length} entrada(s)` : 'limpia en las tres tandas'}.</p>

<div class="gate">
  <p><b>Puerta.</b> A la espera de revisión de Juanma y de ChatGPT. Sin merge, sin promoción, sin
  tocar master. Rama <code>claude/immersive-worlds-module-c0d3f7</code>, HEAD <code>${esc(HEAD)}</code>.</p>
  <p>La evidencia de VS01 sigue intacta en <code>qa/evidence-authoring/</code> y su artifact no se ha
  reemplazado.</p>
</div>

</div></body></html>
`;

await fs.writeFile(path.join(DIR, 'index.html'), board);

/* == the live progress page ================================================ */

const gauntlet = `<!doctype html>
<html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="refresh" content="60">
<title>VS02 · Gauntlet</title>
<style>${CSS}
.w{display:grid;grid-template-columns:auto 1fr auto;gap:14px;align-items:baseline;
  padding:12px 0;border-bottom:1px solid rgba(226,219,205,.14)}
.w b{font-weight:400;color:#ece7dd}
.w i{font-style:normal;font-size:12px;color:#6f6960}
.w em{font-style:normal;font-size:10px;letter-spacing:.14em;text-transform:uppercase}
</style></head><body><div class="wrap">
<p class="eyebrow">Escaparates Pro · Immersive Worlds · Museum</p>
<h1>VS02 · Gauntlet</h1>
<p class="lede">Estado de la vuelta en curso. Se refresca solo cada minuto, para que nadie tenga que
interrumpir la ejecución para preguntar cómo va.</p>

<div class="sum">
  <div><b>${esc(HEAD)}</b>HEAD actual</div>
  <div><b>${waves.length}/3</b>tandas capturadas</div>
  <div><b>${totalShots}</b>capturas</div>
  <div><b>${counts.CORREGIDO || 0}</b>defectos corregidos</div>
  <div><b>${counts.ABIERTO || 0}</b>abiertos</div>
</div>

<h2>Tandas</h2>
<p>Construir → navegador real → capturar → crítico fresco → mayor hueco primero → corregir.</p>
${WAVES.map((w) => {
    const done = waves.find((x) => x.id === w.id);
    return `<div class="w">
    <em class="${done ? 'ok' : 'warn'}">${done ? 'capturada' : 'pendiente'}</em>
    <div><b>${esc(w.name)}</b><br><i>${done ? `${done.data.shots.length} capturas · run ${esc(done.data.runId)}` : '—'}</i></div>
    <i>${done ? esc(done.data.generatedAt.slice(0, 16).replace('T', ' ')) : ''}</i>
  </div>`;
  }).join('')}
<div class="w"><em class="ok">hecha</em><div><b>W5 · Integración y coherencia</b><br>
  <i>crítico de integración sobre el producto completo</i></div><i></i></div>
<div class="w"><em class="ok">hecha</em><div><b>W6 · Paquete de evidencia</b><br>
  <i>tablero, página de progreso, URLs de revisión</i></div><i></i></div>

<h2>Verdictos de los críticos</h2>
<p>Críticos frescos: sólo ven los píxeles, las reglas de producto y la referencia aprobada. Nunca la
justificación de quien construyó.</p>
<table>
  <tr><th>Pasada</th><th>Verdicto</th><th>Mayor hueco señalado</th></tr>
  <tr><td>W1 · crítico visual</td><td class="ok">VS02 MEJOR que VS01</td>
    <td>Editar no cambiaba nada visible; heredado indistinguible de vacío; 420 px sin ruta al editor</td></tr>
  <tr><td>W5 · crítico de integración</td><td>ver tablero</td><td>—</td></tr>
</table>

<h2>Defectos abiertos</h2>
${DEFECTS.filter((d) => d.status.startsWith('ABIERTO')).map((d) => `<article class="d">
  <div class="tags"><span class="t t--${d.severity}">${esc(d.severity)}</span>
    <span class="t t--ABIERTO">${esc(d.status)}</span><span class="t">${esc(d.id)}</span></div>
  <h3>${md(d.title)}</h3><dl><dt>Qué falta</dt><dd>${md(d.fix)}</dd></dl>
</article>`).join('')}

<p style="margin-top:40px"><a href="./index.html">→ Tablero de revisión visual completo</a></p>
</div></body></html>
`;

await fs.writeFile(path.join(DIR, 'gauntlet.html'), gauntlet);

/* == a self-contained copy for publishing ================================== */

const inline = board.replace(/src="([^"]+\.png)"/g, (m, rel) => {
  const file = path.join(DIR, rel);
  if (!fsSync.existsSync(file)) return m;
  return `src="data:image/png;base64,${fsSync.readFileSync(file).toString('base64')}"`;
}).replace(/^<!doctype html>\n<html lang="es"><head><meta charset="utf-8">\n<meta name="viewport"[^>]*>\n/, '')
  .replace('</head><body>', '').replace('</body></html>', '');
await fs.writeFile(path.join(DIR, 'board-inline.html'), inline);

console.log(`  tablero:    qa/evidence-vs02/index.html`);
console.log(`  gauntlet:   qa/evidence-vs02/gauntlet.html`);
console.log(`  publicable: qa/evidence-vs02/board-inline.html (${(inline.length / 1e6).toFixed(1)} MB)`);
console.log(`  ${totalShots} capturas · ${DEFECTS.length} defectos (${counts.CORREGIDO || 0} corregidos, ${counts.ABIERTO || 0} abiertos)`);
