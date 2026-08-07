# Vinyl Player PRO V1

Modulo standalone de Escaparates Pro para construir una experiencia de tocadiscos 3D personalizable con seis discos, portadas imagen/video, audio propio y entregables cerrados para cliente.

## Identidad

- Module ID: `vinyl-player-pro`
- Version aprobada: `V1`
- Superficie: `Website Modules Lab`
- HTML canonico: `labs/website-modules-source/vinyl-player-pro/index.html`
- Copia de preservacion: `labs/website-modules-source/vinyl-player-pro/source.v1.html.gz`
- Registro: `js/website-modules-vinyl-player-pro.js`
- SHA-256 del HTML aprobado: `d181506e15d17aa9d20d016a0797882c36866822342f531f279d6c5c3e862cb5`
- Fuente de referencia: `Juanmaes83/vinyl`

El `index.html` es la version standalone V1 aprobada visual y funcionalmente. Se conserva como fuente canonica y no se reimplementa dentro del motor generico de Website Modules.

## Experiencia

La pieza conserva la identidad y mecanica del proyecto Vinyl original:

- tocadiscos 3D Three.js con materiales PBR, iluminacion, sombras y particulas;
- drag para rotar la pieza y control de camara;
- plato giratorio con 33 1/3 y 45 RPM;
- brazo y capsula con coreografia mecanica de cue, reproduccion, parada y cambio de disco;
- controles propios de Play/Pause, anterior/siguiente, seek, volumen, Start/Stop y velocidad;
- carrusel de seis discos;
- motor Web Audio original con volumen, tone/EQ, compresion y crackle;
- soporte de audio real por disco sin eliminar el fallback procedural;
- modo Custom Library que impide que la carga de iTunes sobrescriba la personalizacion local.

## Personalizacion Escaparates Pro

### Identidad y escena

- logo;
- nombre y subtitulo de marca;
- eyebrow y dos lineas de hero;
- texto de estado/source;
- cuatro enlaces de navegacion;
- titulo y CTA de coleccion;
- paleta principal;
- fondo por color o media.

### Seis discos

Cada disco puede configurarse de forma independiente con:

- titulo;
- artista;
- color del label;
- color de tinta del label;
- portada por imagen o video;
- audio personalizado.

La portada configurada se reutiliza de forma coherente en carrusel, Now Playing y label visual del vinilo. El audio pesado no se guarda en `localStorage`.

## Pipeline Multimedia

La V1 replica el patron ya validado en Escaparates Pro:

- configuracion ligera en `localStorage`;
- Blob para media pesada en IndexedDB;
- ObjectURL durante la edicion cuando corresponde;
- DataURL solo al construir un HTML standalone autocontenido;
- ZIP con assets originales separados;
- video y audio se conservan como blobs y no se duplican innecesariamente en el estado.

Este patron debe mantenerse en futuras revisiones. No introducir un segundo subsistema de media si el actual sigue siendo valido.

## Modos De Biblioteca

- `Custom`: modo recomendado y por defecto. Respeta los seis discos configurados por el usuario.
- `Procedural`: conserva la biblioteca generativa original.
- `iTunes`: activa voluntariamente la resolucion online de previews y artwork.

La carga de iTunes no debe ejecutarse en modo Custom.

## Entregables

La V1 incorpora su propio pipeline de salida:

- HTML final cerrado;
- ZIP cliente con assets;
- iframe/embed;
- preview final;
- captura PNG;
- PNG sequence ZIP;
- grabacion de video final MP4/WebM segun soporte del navegador;
- grabacion de revision cliente.

El viewer final conserva todos los controles propios del tocadiscos, pero no expone el panel de personalizacion ni los controles internos de Escaparates Pro.

## Integracion Con Website Modules Lab

Website Modules Lab carga directamente el `index.html` aprobado dentro de su iframe. Los botones globales delegan en los botones internos del standalone:

- HTML -> `downloadHtmlBtn`
- ZIP -> `downloadZipBtn`
- Embed -> `copyEmbedBtn`

De esta manera no se reconstruye el tocadiscos, no se simplifica su motor Three.js y no se duplica el exportador.

## QA

Antes de modificar esta pieza:

1. Preservar el HTML canonico aprobado y comprobar su SHA-256.
2. Mantener el pipeline Blob/IndexedDB ya validado para imagen, video y audio.
3. Probar varias portadas y audios simultaneamente.
4. Confirmar que Custom Library no es sobrescrita por iTunes.
5. Probar cambio de disco, brazo, Play/Pause, seek, volumen, velocidad y drag.
6. Probar HTML final, ZIP y Embed con imagen, video y audio.
7. Confirmar que el viewer final no muestra el editor.
8. Revisar desktop y movil antes de dar una nueva version por aprobada.
