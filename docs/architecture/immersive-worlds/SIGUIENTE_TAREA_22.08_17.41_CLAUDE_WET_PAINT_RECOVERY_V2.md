# SIGUIENTE TAREA 22.08 17:41 — CLAUDE WET PAINT RECOVERY V2

**Estado:** CANÓNICO / VÁLIDO PARA EJECUCIÓN

## DECISIÓN DE DIRECCIÓN

ChatGPT deja de implementar esta integración. A partir de este punto Claude debe asumir la recuperación técnica.

No continuar con cambios exploratorios a ciegas. No merge. No tocar main/master. No tocar la base Museum protegida.

## OBJETIVO DE PRODUCTO

Conseguir el flujo real, visible y verificable:

`01 ORIGINAL (imagen subida por el usuario)`
→ `wet-paint-flow REAL`
→ `misma imagen procesada por su pipeline real`
→ `02 PAINTERLY`
→ crecimiento/movimiento real
→ Human Review en GPU real.

El donor real que Juanma ya validó visualmente es:

- Repo: `Juanmaes83/wet-paint-flow`
- SHA fijado: `0b9ba9a5be665f3a2a8b2450945ec5006e61e2de`
- Three dependency del donor: `^0.185.1`

No sustituir este motor por una reinterpretación simplificada si no existe una razón técnica demostrada y aprobada.

## RECEPTOR SEGURO

Repo: `Juanmaes83/escaparates-pro`

Receiver aprobado / Human-confirmed media lab:

- branch: `chatgpt/museum-itinerant-media-visible-v3`
- SHA: `b9389f05af3eab1db4a7dc39cc88a2390eb63e3d`

Esta rama tiene el Museum itinerante con cinco superficies y la visualización central de imagen/vídeo confirmada por Juanma.

## RAMA EXPERIMENTAL DE CHATGPT — REFERENCIA, NO BASE DE CONFIANZA

- branch: `chatgpt/museum-wet-paint-donor-graft-v1`
- HEAD antes de este documento: `4f632ecf8598f4f88103906e2f1c2368ad8ddfb6`
- diff vs receiver: 19 commits ahead / 0 behind
- archivos tocados respecto al receiver:
  - `.github/workflows/wet-paint-donor-graft-qa.yml` — añadido
  - `labs/immersive-worlds/authoring/wet-paint-donor-bridge.js` — añadido
  - `labs/immersive-worlds/capabilities/wet-paint-flow/host.html` — añadido
  - `labs/immersive-worlds/tests/wet-paint-donor-graft.spec.js` — añadido
  - `labs/immersive-worlds/tests/wet-paint-donor-host.spec.js` — añadido
  - `labs/immersive-worlds/wet-paint-studio.html` — modificación pequeña

IMPORTANTE: no asumir que estos 19 commits son la solución. Son evidencia de intentos y diagnósticos. Claude debe auditarlos y decidir qué piezas reutilizar, reescribir o descartar.

**Opción de seguridad preferida:** crear una nueva child branch desde el receiver seguro `b9389f05...` y portar únicamente las piezas que Claude pueda justificar técnicamente. No apilar parches indiscriminadamente sobre la rama experimental.

## EVIDENCIA CONFIRMADA

### Lo que sí funciona

1. Museum itinerante carga y se navega.
2. `01 ORIGINAL` puede recibir imagen real mediante el Studio existente.
3. La visualización central de imagen/vídeo del lab fue confirmada por Juanma.
4. El donor `wet-paint-flow` funciona visualmente en el entorno real de Juanma/GPU real fuera de esta integración.
5. La dependencia Three del donor coincide con r185 (`^0.185.1`).
6. No se ha hecho merge a main/master ni a la base Museum protegida.

### Lo que NO está resuelto

El graft no alcanza un estado confiable:

`upload real → donor READY → fuente exacta confirmada → canvas real → 02 PAINTERLY`.

El síntoma visible más reciente para Juanma fue:

`OREJA · RUBIK SOTA · CARGANDO…`

## PRUEBA DECISIVA YA REALIZADA

GitHub Actions run:

- run id: `32581843611`
- job id: `97052291356`
- conclusión: FAILURE

Se añadió un test para abrir **el host Wet Paint aislado, SIN Museum**:

`tests/wet-paint-donor-host.spec.js`

Resultado:

- `Prove donor host standalone` = FAILURE
- `Run integrated Playwright visual QA` = SKIPPED
- `window.__OREJA_WET_PAINT?.ready` no llegó a `true` en 45 s
- timeout total 60 s

Esto significa que el bloqueo observado en GitHub Actions/Chromium software ocurre incluso sin Museum. Por tanto NO está demostrado que Museum sea la causa del bloqueo.

No optimizar ni mutilar el donor únicamente para hacer feliz a SwiftShader/CI sin demostrar antes que esa misma corrección es necesaria en GPU real.

## INTENTOS YA HECHOS QUE NO DEBEN REPETIRSE A CIEGAS

Se probaron, sin resolver el READY en CI:

- lazy boot del donor;
- impedir conexión de `02 PAINTERLY` hasta confirmar el nombre exacto de la fuente;
- posponer parte del arranque demo del donor;
- suprimir trabajo standalone/demo durante boot;
- pausar temporalmente el loop de Museum con `runtime.stopLoop()` / reanudar con `runtime.startLoop()` durante procesamiento;
- prueba host-alone sin Museum.

Estos intentos no prueban que las ideas sean incorrectas; prueban que seguir podando top-level init sin perfilado es inseguro.

## MISIÓN DE CLAUDE — PRIMERA FASE: DIAGNÓSTICO, NO PARCHE

Antes de cambiar arquitectura:

1. Fetch de todos los refs indicados.
2. Leer este documento completo.
3. Auditar el donor original fijado en `0b9ba9a5...` y reproducir su funcionamiento standalone con el método de ejecución que el repo espera (Vite/build si corresponde), no sólo mediante import dinámico improvisado.
4. Comparar ese método con el host experimental de Museum.
5. Determinar exactamente por qué nuestro `host.html` no llega a READY:
   - import dinámico desde Blob;
   - resolución de módulos/import map;
   - top-level initialization;
   - WebGL/software renderer;
   - Vite assumptions/build transforms;
   - asset paths;
   - CSP/origin/blob semantics;
   - otra causa demostrada.
6. No tocar el donor algorithm/painterly pipeline hasta tener causa reproducible.
7. Probar si el donor original, ejecutado de la forma canónica del repo, arranca en el mismo entorno donde falla nuestro host.

### Regla de decisión

- Si donor canónico también falla sólo en SwiftShader/CI pero funciona en GPU real: adaptar QA; NO degradar el motor por CI.
- Si donor canónico funciona en CI pero nuestro host falla: arreglar la costura/packaging, no el algoritmo.
- Si existe un bloqueo real en GPU/Museum: aislarlo con perfil/console/network y corregir la mínima costura.

## SEGUNDA FASE — INTEGRACIÓN

Sólo después del diagnóstico:

`Museum authored media`
→ adapter
→ donor real
→ output canvas/render target
→ `02 PAINTERLY`.

Reutilizar Museum existente para upload/media. No reconstruir MediaVault, MediaLoader, Studio ni RenderHost.

`01 ORIGINAL` debe permanecer intacto.

Nunca aceptar fallback visual como prueba del producto.

## QA OBLIGATORIO

### Technical QA

Usar el flujo REAL:

1. abrir `wet-paint-studio.html`;
2. seleccionar `01 ORIGINAL`;
3. subir JPG mediante el input real del Studio;
4. comprobar que `01 ORIGINAL` contiene ese archivo;
5. comprobar que Wet Paint procesa ESA MISMA fuente;
6. comprobar que `02 PAINTERLY` cambia y está conectado al output real;
7. demostrar crecimiento/movimiento con evidencia temporal;
8. consola y network sin errores relevantes.

### Human Review

Playwright PASS no sustituye Human Review.

Al terminar entregar:

- repo;
- branch exacta;
- HEAD SHA;
- comandos de reproducción;
- URL real local/review;
- Human Review Map:
  - OPEN
  - GO TO
  - DO
  - LOOK FOR
  - MUST NOT CHANGE
  - KNOWN LIMITATION
  - KEEP / ADJUST / REJECT

No declarar calidad visual PASS en SwiftShader si la prueba de calidad depende de GPU real.

## SEGURIDAD / NO TOCAR

- `main` / `master`;
- `integration/museum-full-studio-three-room-v1`;
- Breeze;
- Full Studio global;
- Museum runtime/core salvo necesidad demostrada y aprobación;
- MediaVault / MediaLoader / RenderHost salvo necesidad demostrada y aprobación;
- funcionalidades Human-confirmed del receiver;
- ningún merge.

## CHECKPOINT QUE CLAUDE DEBE PUBLICAR ANTES DE IMPLEMENTAR

```
REPO ACTIVO
RAMA NUEVA
BASE SHA
DONOR SHA
CAUSA REPRODUCIDA
DÓNDE FALLA EXACTAMENTE
QUÉ ARCHIVO/SEAM PROPONE CAMBIAR
POR QUÉ ESE CAMBIO ES MÍNIMO
QUÉ NO VA A TOCAR
PLAN DE ROLLBACK
```

Después de ese checkpoint puede ejecutar la corrección técnica si la causa está demostrada.

## CRITERIO DE ÉXITO

No es “CI verde”.

Es:

`imagen real de Juanma → ORIGINAL intacto → Wet Paint real → PAINTERLY reconocible y vivo → URL reproducible → Juanma lo ve → KEEP/ADJUST/REJECT`.
