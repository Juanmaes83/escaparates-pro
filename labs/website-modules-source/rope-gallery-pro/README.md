# Rope Gallery PRO V1.5

Modulo standalone de Escaparates Pro para crear una galeria 3D interactiva de tarjetas colgadas sobre una cuerda fisica, con personalizacion completa de identidad, imagen/video y contenido ampliado.

## Identidad

- Module ID: `rope-gallery-pro`
- Version aprobada: `V1.5 · Clean Media + Focus`
- Superficie: `Website Modules Lab`
- HTML canonico: `labs/website-modules-source/rope-gallery-pro/index.html`
- Copia de preservacion: `labs/website-modules-source/rope-gallery-pro/source.v1.5.html.gz`
- Registro: `js/website-modules-rope-gallery-pro.js`
- SHA-256 del HTML aprobado: `e7599acf4ab58a73eaaeabf9740e9a96dbb4efb2d26c063a0d724a9d517ca2b7`
- Fuente de referencia: `Juanmaes83/rope-gallery`

El `index.html` es la version standalone V1.5 aprobada visual y funcionalmente. Se conserva como fuente canonica y no se reimplementa dentro del motor generico de Website Modules.

## Experiencia

La pieza conserva la identidad del proyecto Rope Gallery:

- cuerda fisica 3D con deformacion y respuesta al peso;
- tarjetas colgantes con pinzas verdes;
- drag, lanzamiento con inercia, rueda/trackpad y teclado;
- oscilacion tipo pendulo, rebote y repelencia entre tarjetas;
- parallax de camara y adaptacion de resolucion por rendimiento;
- ocho contenidos logicos reutilizados de forma estable sobre las tarjetas fisicas;
- Focus independiente del canvas al seleccionar una ficha, con media completa a la izquierda e informacion ampliada a la derecha;
- cierre del Focus mediante X, Escape o click exterior.

## Personalizacion Escaparates Pro

### Identidad y hero

- logo y nombre de marca;
- badge;
- titular, palabra destacada y segunda linea;
- subtitulo;
- CTA principal y URL;
- navegacion y CTA de cabecera;
- colores principales;
- fondo por color, imagen o video.

### Ocho fichas

Cada ficha permite personalizar de forma independiente:

- titulo;
- subtitulo;
- descripcion ampliada;
- texto CTA;
- URL CTA;
- imagen o video.

El pipeline multimedia replica el patron ya validado en otros modulos de Escaparates Pro: configuracion ligera en `localStorage`, Blob en IndexedDB, ObjectURL para video durante la edicion y resolucion segura de imagen/video para el viewer y las exportaciones. No se guardan videos pesados en `localStorage`.

## Entregables

La V1.5 incorpora su propio pipeline de salida:

- HTML final cerrado;
- ZIP cliente + assets + manifest;
- iframe/embed;
- preview local;
- captura PNG;
- PNG sequence ZIP;
- grabacion de video final MP4/WebM segun soporte;
- grabacion de revision cliente.

El viewer final mantiene cuerda, imagen/video, Focus y CTA, pero no expone el panel de personalizacion.

## Integracion con Website Modules Lab

Website Modules Lab carga directamente el `index.html` aprobado dentro de su iframe. Los botones globales HTML, ZIP y Embed delegan en los botones internos de la pieza:

- HTML -> `downloadFinalHtmlBtn`
- ZIP -> `downloadClientZipBtn`
- Embed -> `copyEmbedBtn`

Esto evita duplicar el exportador, recrear la experiencia o simplificar la fisica al incorporarla a Escaparates Pro.

## QA

Antes de modificar esta pieza:

1. Preservar el HTML canonico aprobado y comprobar su SHA-256.
2. Reutilizar el pipeline multimedia validado: Blob/IndexedDB + ObjectURL/DataURL solo donde corresponda.
3. Probar varias imagenes y varios videos simultaneamente.
4. Verificar que el contenido logico se mantiene asociado correctamente cuando las tarjetas fisicas se reciclan.
5. Probar Focus, X, Escape y click exterior sin recortes del canvas.
6. Probar HTML final, ZIP y Embed con imagen y video.
7. Confirmar que el viewer final no muestra el editor.
8. Revisar desktop y movil antes de dar una nueva version por aprobada.
