# SIGUIENTE TAREA — 22.08 · 13:03

## CLAUDE — MUSEUM LIVING ART GRAFT V1

**Estado:** CANÓNICO / VÁLIDO PARA EJECUCIÓN

**Regla de antigüedad:** este documento sustituye cualquier prompt o misión anterior que contradiga su estado operativo. La marca temporal permite distinguir qué instrucción es posterior.

---

## 0. CONTRATO DE TRABAJO

Juanma = Director / Product Owner / autoridad visual final / autoridad de merge.

ChatGPT = arquitectura, documentación persistente en GitHub, auditoría y QA con Juanma.

Claude Code = ingeniero de implementación. Su misión es construir, ejecutar, corregir y demostrar visualmente.

Claude NO debe gastar tokens rehaciendo arqueología general, documentación que ya existe o decisiones de arquitectura ya fijadas salvo que aparezca un bloqueo concreto demostrable.

**No merge. No main/master. No modificar la rama estable del Museum.**

---

## 1. ESTADO REMOTO QUE CLAUDE YA AUDITÓ

Claude ya realizó una auditoría completa del estado remoto antes de este documento.

### Master

`master` @ `d6f55fa4f76d93f30acd8c6d30d182955b3b3bc3`

No contiene `labs/immersive-worlds/` ni Living Art.

### Museum baseline protegido

`integration/museum-full-studio-three-room-v1`

SHA conocido:

`338f588ee5e8b0fa6755120735d0ad7ea6dd3176`

Contiene Museum, Full Studio, rooms, Breeze guest, nested runtime, world JSON y colección real.

**NO MODIFICAR DIRECTAMENTE. NO MERGEAR.**

### Rama histórica contaminada

`claude/immersive-worlds-module-c0d3f7`

Referencia histórica solamente. Mezcla EP + Museum + trabajo ajeno y tiene scope masivo.

**NUNCA usarla como receiving branch.**

### Ramas Living Art históricas

- `claude/escaparates-living-art-current-v1`
- `claude/museum-living-art-product-v1`
- `claude/museum-living-art-v1`

Son material de recuperación / comparación, no base automática para el nuevo graft.

---

## 2. NUEVO ESTADO DESDE QUE CLAUDE SE DETUVO

ChatGPT + Juanma han construido y probado humanamente un receptor Museum específico para Wet Paint / Living Art.

### Receptor inicial

`chatgpt/museum-itinerant-wet-paint-room-v1`

Partió de:

`integration/museum-full-studio-three-room-v1 @ 338f588...`

Initial receiver HEAD:

`eaf729f4c7c4f86211ebc947eb156c52daf86e33`

### Receptor de medios actualmente válido

`chatgpt/museum-itinerant-media-visible-v3`

Claude debe auditar su HEAD remoto exacto antes de crear su rama hija.

### Sala itinerante

Cinco destinos visuales:

1. `ORIGINAL`
2. `PAINTERLY`
3. `LIVING`
4. `COMBINED`
5. `EXPERIMENTAL`

### Human QA ya confirmado por Juanma

El módulo permite:

- cargar imágenes;
- cargar vídeos;
- verlos de forma visible en el Studio/visor central;
- seleccionar medios y comprobarlos;
- usar esta sala como superficie receptora visual.

El Museum estable/original NO ha sido mergeado ni modificado en main/master.

---

## 3. LO QUE CLAUDE NO DEBE RECONSTRUIR

No reconstruir ni sustituir:

- upload de medios;
- MediaVault por capricho;
- catálogo de medios;
- reproducción básica de vídeo;
- Studio shell;
- navegación del Museum;
- authoring architecture;
- RenderHost;
- MediaLoader;
- MuseumSceneKit;
- Breeze;
- Full Studio global.

Sólo extender una pieza estable cuando un defecto concreto y reproducible demuestre que hace falta una costura mínima.

**Museum es el host. Los engines son invitados.**

---

## 4. DONANTES / CAPACIDADES A INJERTAR

### DONOR A — `wet-paint-flow`

Recuperar capacidad real, no una aproximación de juguete:

- structural/direction-field analysis;
- painterly reconstruction;
- stroke generation;
- Bézier ribbons cuando aporten valor;
- impasto / wet-paint appearance;
- growth/reveal si es viable sin degradar la estabilidad;
- calidad escalable.

### DONOR B — `van-gogh-crows`

Extraer la capacidad genérica reutilizable:

- GPGPU flock / swarm;
- procedural agent motion;
- avoidance;
- attractors;
- respuesta al visitante / interacción cuando sea segura;
- sprite/atlas pipeline sólo como capacidad técnica.

**No copiar identidad visual específica de Van Gogh ni assets de cuervos sin derechos claros. Extraer capacidad, no imitar estilo.**

---

## 5. DESTINATION CONTRACT

### 01 — ORIGINAL

Fuente intacta. Control.

### 02 — PAINTERLY

La misma fuente transformada por `PainterlyEngine`.

### 03 — LIVING

La fuente se convierte en una experiencia procedural viva mediante `LivingEngine`.

### 04 — COMBINED

Síntesis painterly + living procedural.

### 05 — EXPERIMENTAL

Sandbox opcional. No dedicar tiempo aquí hasta que 02–04 sean Human-PASS.

---

## 6. COSTURA ARQUITECTÓNICA ESPERADA

Conceptualmente:

```text
MUSEUM AUTHORED MEDIA
        ↓
CAPABILITY ADAPTER
        ↓
PainterlyEngine / LivingEngine
        ↓
CanvasTexture / VideoTexture / RenderTarget / salida equivalente segura
        ↓
TARGET ARTWORK SURFACE
```

No convertir Museum en el donor app.

No portar donor UIs completas.

No portar page shells.

No crear un segundo sistema de authoring.

No duplicar la infraestructura de media que ya funciona.

---

## 7. PRIMERA ACCIÓN OBLIGATORIA DE CLAUDE

Antes de escribir código:

1. `git fetch --all --prune`.
2. Auditar HEAD remoto exacto de `chatgpt/museum-itinerant-media-visible-v3`.
3. Compararlo contra:
   - `chatgpt/museum-itinerant-wet-paint-room-v1`
   - `integration/museum-full-studio-three-room-v1`
4. Reportar:
   - HEAD SHA;
   - ahead/behind;
   - merge base;
   - changed files;
   - confirmación explícita de que Museum estable no ha sido modificado accidentalmente.
5. Crear rama hija propia desde el HEAD actual aprobado del receptor.

Nombre sugerido:

`claude/museum-itinerant-living-art-graft-v1`

No trabajar directamente sobre la rama de ChatGPT.

---

## 8. ORDEN DE EJECUCIÓN

### PHASE 1 — RECEIVER AUDIT

Sólo la auditoría exacta y creación de child branch.

Después CONTINUAR, no detenerse innecesariamente.

### PHASE 2 — PAINTERLY ENGINE

Objetivo: `02 PAINTERLY` transforma visiblemente la fuente real cargada por el usuario.

Debe existir movimiento/growth si forma parte del slice elegido, pero la prioridad es una transformación pictórica claramente visible y de calidad.

### PHASE 3 — LIVING ENGINE

Objetivo: `03 LIVING` muestra movimiento procedural real y estable, derivado de la fuente.

### PHASE 4 — COMBINED

Objetivo: `04 COMBINED` combina Painterly + Living sin destruir ninguna de las dos capacidades.

### PHASE 5 — POLISH / PERFORMANCE / PRESETS

Sólo después de Human-PASS en 02–04.

---

## 9. PLAYWRIGHT VISUAL QA — OBLIGATORIO

Claude NO puede entregar una fase sólo porque el código compile o porque internamente crea que funciona.

En cada fase visual relevante debe:

1. levantar el runtime real;
2. abrir la URL real con Playwright/browser automation;
3. ejecutar el flujo de uso real;
4. comprobar consola y network;
5. verificar que la obra objetivo se ve;
6. verificar que el source original sigue intacto;
7. verificar que la navegación/Studio no se ha roto;
8. capturar screenshots útiles;
9. para movimiento, obtener evidencia temporal real: varias capturas separadas, vídeo o trace que demuestre cambio en el tiempo;
10. corregir los defectos encontrados;
11. repetir hasta obtener su propio VISUAL QA PASS.

**Un screenshot estático NO demuestra motion.**

**Un test verde NO equivale a visual PASS.**

---

## 10. HUMAN REVIEW CONTRACT — OBLIGATORIO

Claude NO debe dar por terminada una fase sin entregar a Juanma una URL realmente navegable.

**NO URL = NO PASS.**

Cada entrega visual debe incluir exactamente:

### CURRENT STATE

Qué fase está terminada.

### BRANCH

Rama actual exacta.

### HEAD SHA

SHA remoto exacto.

### WHAT WORKS

Sólo hechos probados.

### WHAT DOES NOT

Limitaciones / pendientes reales.

### PLAYWRIGHT QA

- URL probada;
- flujo ejecutado;
- screenshots/trace/video relevantes;
- console/network result;
- PASS/FAIL de Claude.

### HUMAN REVIEW MAP

- **OPEN:** URL exacta para Juanma.
- **GO TO:** dónde navegar.
- **DO:** qué interacción hacer.
- **LOOK FOR:** qué resultado debe verse.
- **MUST NOT CHANGE:** qué elementos deben permanecer intactos.
- **KNOWN LIMITATION:** limitación conocida si existe.
- **DECISION:** `KEEP / ADJUST / REJECT` queda en manos de Juanma.

No entregar sólo `localhost` de un contenedor inaccesible. La URL debe ser reproducible en la máquina de Juanma con instrucciones concretas o mediante preview realmente accesible.

---

## 11. CONTINUOUS EXECUTION

`DEFAULT STATE = CONTINUE EXECUTION`.

Un checkpoint técnico no es automáticamente un handoff.

Claude debe continuar corrigiendo errores normales de ingeniería sin pedir permiso por cada detalle.

Sólo detenerse ante:

- decisión de producto de Juanma;
- riesgo de tocar estable/protegido;
- bloqueo externo real;
- Human Review obligatorio al final de una fase visual relevante.

---

## 12. TOKEN DISCIPLINE

ChatGPT + Juanma ya hicieron la arquitectura y gran parte de la arqueología.

Claude debe gastar tokens en:

- coding;
- running;
- debugging;
- visual QA;
- integration;
- performance cuando llegue su fase;
- evidence.

No gastar tokens en repetir búsquedas generales de repositorios ya estudiados.

---

## 13. PROHIBICIONES

- NO `main`.
- NO `master`.
- NO merge.
- NO modificar directamente `integration/museum-full-studio-three-room-v1`.
- NO trabajar sobre la rama contaminada como base.
- NO sobrescribir el receptor actual de ChatGPT.
- NO reconstruir Full Studio.
- NO reconstruir upload/video/media catalogue.
- NO dar por válido un resultado sin verlo con Playwright.
- NO entregar fase visual sin URL para Juanma.
- NO sustituir movimiento real por una captura estática.

---

## 14. DEFINITION OF DONE DEL PRIMER GRAN HITO

El primer gran hito no está terminado hasta que:

- `01 ORIGINAL` sigue mostrando la fuente original;
- `02 PAINTERLY` muestra una transformación painterly real;
- Claude la ha visto y validado en runtime con Playwright;
- console/network no contienen fallos críticos introducidos por el graft;
- existe rama y SHA remotos;
- Juanma recibe URL + Human Review Map;
- Juanma puede reproducir el resultado;
- no se ha tocado Museum estable;
- no hay merge.

Después de Human Review, Juanma decidirá `KEEP / ADJUST / REJECT` y se continuará con `03 LIVING`.

---

## 15. PRIMER MENSAJE DE CLAUDE

El primer mensaje debe ser el **receiver audit** del estado remoto actual y la confirmación de la rama hija creada.

Después debe continuar ejecución hacia Phase 2 sin repetir arqueología general.
