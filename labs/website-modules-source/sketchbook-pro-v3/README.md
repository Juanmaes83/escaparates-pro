# Sketchbook PRO V3

Modulo standalone de Escaparates Pro para crear un sketchbook editorial interactivo con paso de pagina fisico, lupa, parallax y personalizacion completa de marca y medios.

## Identidad

- Module ID: `sketchbook-pro-v3`
- Version aprobada: `V3 · descargas corregidas`
- Superficie: `Website Modules Lab`
- HTML canonico: `labs/website-modules-source/sketchbook-pro-v3/index.html`
- Copia de preservacion: `labs/website-modules-source/sketchbook-pro-v3/source.v3.html.gz`
- Registro: `js/website-modules-sketchbook-pro-v3.js`
- SHA-256 del HTML aprobado: `837fac4414bbd8b7eb2dbdac8514a5d40429e30e76647b942f7a477da8ed3ee6`
- Fuente de referencia: `Juanmaes83/A-page-flipping-sketchbook-of-Singapore.-One-static-HTML-file-`

El `index.html` es la version standalone V3 ya aprobada visual y funcionalmente. Se conserva como fuente canonica y no se reimplementa dentro del motor generico de Website Modules.

## Experiencia

La pieza mantiene el comportamiento editorial del sketchbook:

- nueve spreads/paginas personalizables;
- paso de pagina con curvatura por tiras, no una bisagra plana;
- drag y gesto de lanzamiento para avanzar o retroceder;
- lupa/brass magnifier arrastrable sobre el papel;
- parallax del libro respecto al puntero;
- apertura/riffle inicial y motion blur;
- sombras, gutter, textura de papel y atmosfera editorial;
- fallback tactil y respeto de `prefers-reduced-motion`.

## Personalizacion Escaparates Pro

### Identidad

- nombre/marca;
- subtitulo;
- logo;
- email y contenido About;
- paletas y color de acento.

### Contenido

- nueve slots independientes;
- cada slot acepta imagen o video;
- titulos de placas editables;
- preview de medios dentro del panel.

Los medios pesados se gestionan como Blob/ObjectURL y se persisten mediante IndexedDB; no se guardan videos grandes como DataURL en `localStorage`.

## Entregables

La V3 incorpora su propio pipeline de salida:

- HTML final cerrado;
- ZIP cliente + assets + manifest;
- iframe/embed;
- preview local;
- captura PNG;
- PNG sequence ZIP;
- grabacion WebM;
- grabacion de revision cliente.

El viewer final oculta los controles de personalizacion y descarga mediante `data-final-viewer`, de forma que el cliente recibe solo la pieza terminada.

## Integracion con Website Modules Lab

Website Modules Lab carga directamente el `index.html` aprobado dentro de su iframe. Los botones globales HTML, ZIP y Embed delegan en los botones internos de esta pieza:

- HTML -> `downloadFinalHtmlBtn`
- ZIP -> `downloadClientZipBtn`
- Embed -> `copyEmbedBtn`

Esto evita duplicar el exportador o simplificar el proyecto al incorporarlo a Escaparates Pro.

## Fuente y trazabilidad

La referencia externa parte del sketchbook open source de Singapore documentado en el repositorio fuente del usuario. La transformacion V3 de Escaparates Pro añade el panel de personalizacion, imagen/video por pagina, branding, persistencia robusta y entregables cerrados.

## QA

Antes de modificar esta pieza:

1. Preservar el HTML canonico aprobado.
2. No sustituir video por DataURL durante la edicion.
3. Verificar el paso de pagina, lupa y parallax.
4. Probar HTML final, ZIP y Embed con imagen y video.
5. Confirmar que el viewer final no muestra el editor.
6. Revisar desktop y movil antes de dar una nueva version por aprobada.
