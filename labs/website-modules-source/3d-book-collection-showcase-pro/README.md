# 3D Book Collection Showcase PRO

Modulo standalone de Escaparates Pro para crear una coleccion editorial Three.js de tres libros totalmente personalizables.

## Identidad

- Module ID: `3d-book-collection-showcase-pro`
- Version aprobada: `V2.2`
- Superficie: `Website Modules Lab`
- Loader: `labs/website-modules-source/3d-book-collection-showcase-pro/index.html`
- Fuente canónica preservada: `labs/website-modules-source/3d-book-collection-showcase-pro/source.v2.2.html.gz`
- Registro: `js/website-modules-3d-book-collection-showcase-pro.js`
- SHA-256 del HTML V2.2 descomprimido: `1f8156e5d5d06bb54492151389167dd8e23d358d5b61f300bc3aa0608e3f7cb0`

La fuente aprobada no se reimplementa dentro del motor generico de Website Modules. Se conserva como bundle canónico y el loader comprueba su SHA-256 antes de ejecutarla. Esto evita que futuras integraciones reconstruyan o simplifiquen accidentalmente la pieza validada.

## Experiencia 3D

La pieza incluye tres libros Three.js independientes con:

- hover y seleccion;
- drag/orbita 3D;
- inercia al soltar;
- `Shift + drag` para mover el libro seleccionado;
- portada y contraportada fisicas;
- tres hojas fisicas por libro, con seis caras editoriales independientes;
- navegacion reversible por botones, rueda y teclado;
- recorrido completo `Portada -> interior -> Contraportada`;
- cierre final limpio, recogiendo/ocultando las hojas antes de presentar la contraportada.

## Personalizacion

### Marca y escena

- hero/claim principal;
- nombre de marca;
- logo;
- CTA superior y URL;
- paleta global;
- fondo por color, imagen o video.

### Cada libro

- portada por imagen o video;
- titulo, autor, ano, rating y descripcion;
- dos CTA con URL;
- color de lomo;
- color base de contraportada.

### Contraportada

Cada libro tiene una contraportada independiente con:

- imagen o video;
- composicion Editorial, Media full, Media + texto, Quote o CTA;
- titulo y texto editorial;
- CTA y URL;
- fondo, color de texto y acento.

### Interior editorial

Cada libro dispone de seis paginas independientes: tres hojas fisicas con anverso y reverso. Cada pagina admite:

- Editorial;
- Imagen/video full;
- Imagen/video + texto;
- Quote/claim;
- CTA final;
- titulo, cuerpo, CTA, URL y colores propios.

Los videos de portada se aplican mediante `THREE.VideoTexture`; el contenido de pagina y contraportada combina `CanvasTexture` con video cuando corresponde.

## Persistencia de assets

- Configuracion ligera: `localStorage`, clave `ep-books-pro-state-v1`.
- Binarios: IndexedDB `ep-books-pro-assets-v1`, store `assets`.
- Preview en sesion: Blob/ObjectURL.
- Los videos no se almacenan como DataURL en `localStorage`.

## Entregables

El editor interno de la V2.2 es la fuente de verdad para las entregas:

- HTML final cerrado;
- ZIP cliente + assets;
- iframe/embed;
- Preview local;
- PNG;
- PNG sequence ZIP;
- MP4 cuando `MediaRecorder` lo permite;
- WebM como fallback;
- grabacion de revision cliente mediante captura de pestana/pantalla.

El viewer final no incluye el panel de edicion. En ZIP, los videos se guardan como assets reales y se usa `STORE` para evitar recomprimir MP4/WebM.

## Integracion con Website Modules Lab

`js/website-modules-3d-book-collection-showcase-pro.js` registra la pieza en `EP.WebsiteModules`. `js/website-modules-ui.js` reconoce `standalonePath`, carga el editor V2.2 directamente en el iframe del Lab y delega los botones globales HTML, ZIP y Embed a los botones equivalentes del editor interno.

Los controles genericos de Website Modules no sustituyen el panel propio de esta pieza; toda la personalizacion avanzada se realiza dentro del modulo cargado.

## Dependencias

La fuente V2.2 usa:

- Three.js r128 desde CDNJS;
- JSZip 3.10.1 desde CDNJS;
- APIs de navegador: IndexedDB, Blob/ObjectURL, MediaRecorder, `getDisplayMedia` y WebGL.

El loader de repositorio usa `DecompressionStream('gzip')`, por lo que se recomienda Chrome/Edge actualizado y servir Escaparates Pro mediante HTTP/HTTPS en lugar de abrir esta carpeta directamente con `file://`.

## Regla de mantenimiento

No recrear esta herramienta desde cero al modificar Escaparates Pro. La fuente canónica V2.2 debe mantenerse preservada. Los cambios futuros deben partir de esta version, validarse visualmente y actualizar el SHA-256 si se aprueba una nueva version.
