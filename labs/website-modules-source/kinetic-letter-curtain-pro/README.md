# Kinetic Letter Curtain PRO V1.1

Modulo standalone de Escaparates Pro basado en el concepto open-source `world-cup-letter-flags`, convertido en una herramienta general de tipografia fisica para marcas, campanas, productos, eventos y experiencias editoriales.

## Identidad

- Module ID: `kinetic-letter-curtain-pro`
- Version integrada: `V1.1`
- Superficie: `Website Modules Lab`
- HTML canonico: `labs/website-modules-source/kinetic-letter-curtain-pro/index.html`
- Registro: `js/website-modules-kinetic-letter-curtain-pro.js`
- SHA-256 del HTML integrado: `96710430513f24770af8c29904d8f74cd0ea941ee4642707b73c0a12db0ec19b`
- Fuente conceptual: `Juanmaes83/world-cup-letter-flags`
- Licencia de la referencia: MIT

El HTML V1.1 se conserva como fuente canonica del modulo. Website Modules Lab lo carga dentro de un iframe aislado y delega HTML, ZIP y Embed al pipeline propio del standalone.

## Experiencia preservada

La adaptacion conserva el nucleo interactivo de la referencia:

- cortina construida por caracteres y palabras;
- hebras fisicas con gravedad, damping y restricciones tipo Verlet;
- brush con cursor o tactil que transmite impulso a las letras;
- navegacion entre cuatro escenas;
- modo Scene / Plaster;
- composicion por capas con fondo, pared, canopy y canvas tipografico;
- responsive y viewer final sin editor.

La V1.1 alarga la cortina sin escalar artificialmente el canvas: el anclaje se mantiene y aumenta el numero de nodos/hebras verticales hasta situar el final aproximadamente en el 77% de la altura util en escritorio y 80% en movil.

## Personalizacion global

- logo de cabecera;
- nombre de marca;
- subtitulo;
- eyebrow;
- hint de interaccion;
- colores globales;
- texto del boton Scene;
- texto del boton Plaster;
- texto del boton Content;
- labels Code / Items / Scene;
- eyebrow del panel de contenido.

Todos los textos visibles superiores de la experiencia quedan parametrizados en V1.1.

## Cuatro escenas independientes

Cada escena permite editar:

- nombre;
- codigo;
- descripcion;
- lista libre de palabras, nombres, productos o claims;
- color A / B / C;
- ink y wash;
- patron horizontal, vertical, cruz o solido.

La lista de contenido alimenta directamente el stream de glifos de la cortina y el contador `Items`.

## Entorno multimedia

Cada escena tiene cuatro capas configurables:

1. Sky / fondo: imagen o video.
2. Wall: imagen o video.
3. Plaster: imagen o video.
4. Canopy: imagen o video.

Los archivos pesados se guardan como Blob en IndexedDB y se resuelven mediante ObjectURL durante la edicion. No se guardan videos grandes en localStorage.

## Imagen como mapa de color

El modo `Imagen como mapa de color` convierte una imagen cargada en un sampler de 256 x 256. Cada letra obtiene su color segun su posicion normalizada dentro de la cortina, permitiendo reconstruir fotografias, posters, degradados o sistemas visuales mientras las hebras siguen moviendose fisicamente.

## Logo integrado en la cortina

Una imagen con transparencia puede convertirse en mascara dentro de la cortina. El panel controla:

- modo de color original;
- color unico;
- highlight;
- escala;
- posicion X;
- posicion Y.

El logo no se superpone como una capa DOM: modifica el color de las letras que caen dentro de su mascara, por lo que el simbolo forma parte de la materia tipografica movil.

## Persistencia y medios

- Configuracion ligera: `localStorage`, clave V1.1 propia.
- Media pesada: IndexedDB, base V1.1 propia.
- Preview: ObjectURL / DataURL segun el tipo de activo.
- Viewer exportado: assets embebidos durante la exportacion.

## Entregables

El editor standalone incluye:

- HTML final cerrado;
- ZIP cliente;
- preview final;
- embed iframe;
- PNG de escena;
- grabacion de revision mediante MediaRecorder / display capture cuando el navegador lo permite.

El viewer final conserva la interaccion, navegacion, Scene/Plaster, panel de contenido y fisica, pero elimina el panel de personalizacion.

## QA de V1.1

Antes de integrar se verifico:

- sintaxis JavaScript con `node --check`;
- balance de llaves CSS;
- referencias de IDs usadas desde JavaScript;
- presencia de los nuevos campos de interfaz;
- state/IndexedDB separados para V1.1;
- calculo de longitud de cortina con target vertical ampliado;
- acciones standalone para HTML, ZIP y Embed.

La validacion visual final integrada corresponde al usuario en navegador despues del deploy de GitHub Pages.
