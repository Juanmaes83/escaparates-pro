# Kinetic Letter Curtain PRO V2 — Video Projection

Modulo premium independiente de Escaparates Pro. Extiende Kinetic Letter Curtain PRO V1.1 con proyeccion de video en tiempo real dentro de la materia tipografica, sin sustituir ni modificar la V1.1.

## Identidad

- Module ID: `kinetic-letter-curtain-pro-v2-video-projection`
- Version integrada: `V2 — Video Projection`
- Superficie: `Website Modules Lab`
- HTML canonico: `labs/website-modules-source/kinetic-letter-curtain-pro-v2-video-projection/index.html`
- Registro: `js/website-modules-kinetic-letter-curtain-pro-v2-video-projection.js`
- SHA-256 aprobado: `4b96f27ccc328a4d5c9173872abf17410abceceb5ffea0f2e14facc3a435497c`
- Git blob SHA esperado: `53fcaca9d362a4f963364b9650da146812489265`
- Base conceptual: `Juanmaes83/world-cup-letter-flags`
- V1.1 permanece como modulo independiente en `kinetic-letter-curtain-pro`.

## Objetivo V2

Convertir la cortina de letras en una pantalla fisica viva. Cada letra funciona como una muestra visual del frame de video mientras las hebras siguen respondiendo a gravedad, restricciones e impulso de cursor/tactil.

## Modos de proyeccion

- `OFF`: colores y patrones normales.
- `Static image mapping`: imagen estatica como mapa de color.
- `Video mapping · balanced`: sampling y FPS moderados para priorizar fluidez.
- `Video mapping · high quality`: mayor densidad, resolucion y frecuencia de mapping en escritorio.

Cada una de las cuatro escenas puede tener su propio video de proyeccion.

## High Density Letter Matrix

La V2 desacopla la densidad visual de la malla fisica. Los nodos Verlet siguen siendo la estructura mecanica, mientras se interpolan glifos visuales adicionales entre nodos y hebras. Esto aumenta la resolucion aparente de la pantalla tipografica sin multiplicar en la misma proporcion el coste de la simulacion fisica.

Controles disponibles:

- densidad visual `1.0–2.0x`;
- escala de glifo `0.75–1.5x`;
- peso tipografico `600 / 700 / 800 / 900`;
- mapping FPS `8–30`;
- sample resolution `96 / 128 / 160 / 192`;
- video fit `cover / contain`;
- brightness;
- contrast;
- saturation.

## Perfiles efectivos y movil

Balanced y High Quality aplican limites automaticos en pantallas pequenas para proteger CPU, bateria y suavidad. El perfil efectivo reduce densidad, FPS de mapping, sample resolution y render FPS cuando corresponde, sin eliminar la interaccion fisica.

## Prioridad del logo

El logo integrado en la cortina se conserva. Cuando una letra cae dentro de la mascara del logo, el logo tiene prioridad visual sobre el video proyectado, permitiendo combinar marca legible y video en movimiento.

## Funciones heredadas de V1.1

- cuatro escenas independientes;
- cortina larga;
- sky/fondo imagen-video;
- wall/plaster imagen-video;
- canopy personalizado;
- contenido libre de palabras/nombres/productos/claims;
- colores y patrones;
- image color-map;
- logo integrado en las letras;
- todos los textos visibles personalizables;
- Scene / Plaster;
- navegacion, cursor/tactil y fisica de hebras;
- viewer final cerrado.

## Persistencia de media

La configuracion ligera usa claves V2 propias. La media pesada, incluido el video de proyeccion, se guarda como Blob en IndexedDB y se resuelve con ObjectURL durante la edicion. No se guarda video pesado en localStorage.

## Exportaciones

El standalone conserva:

- HTML final cerrado;
- ZIP cliente;
- preview;
- embed iframe;
- PNG;
- grabacion de revision cuando el navegador permite display capture / MediaRecorder.

HTML y ZIP incluyen el video de proyeccion cuando existe.

## QA de integracion

Antes del PR se verifica:

- reconstruccion byte a byte del HTML aprobado;
- SHA-256 exacto;
- Git blob SHA exacto;
- sintaxis JavaScript del standalone;
- sintaxis del bridge y Website Modules UI;
- presencia de los cuatro modos de proyeccion;
- controles de densidad, escala, peso, FPS y sampling;
- acciones HTML / ZIP / Embed;
- V1.1 sin cambios;
- diff final limitado a los archivos del nuevo modulo y los dos puntos de conexion/documentacion.

La validacion visual final integrada corresponde al usuario despues del deploy.
