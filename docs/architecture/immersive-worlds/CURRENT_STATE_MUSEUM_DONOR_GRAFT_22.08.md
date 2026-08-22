# CURRENT STATE — MUSEUM DONOR / STANDALONE EXPERIENCE — 22.08.2026

**Estado:** CANÓNICO / FUENTE DE VERDAD PARA REANUDAR EL TRABAJO
**Decisión vigente:** `STANDALONE PRESERVATION + MUSEUM SHELL/BRIDGE`
**Contrato arquitectónico:** `docs/architecture/immersive-worlds/MUSEUM_STANDALONE_EXPERIENCE_ARCHITECTURE_V1.md`

---

## OBJETIVO FINAL

Integrar en Museum y en la sala itinerante cinco estados/experiencias:

- `01 ORIGINAL`
- `02 WET PAINT`
- `03 LIVING`
- `04 COMBINED`
- `05 EXPERIMENTAL`

Donors principales:

1. `Juanmaes83/wet-paint-flow`
2. `Juanmaes83/van-gogh-crows`

Museum es el host, la sala, la navegación y la presentación. Los donors se preservan como experiencias/runtimes autónomos y se conectan mediante una costura mínima.

---

## CAMBIO DE ESTRATEGIA APROBADO

### Estrategia anterior — RECHAZADA COMO PRIMARIA

```text
DONOR
→ extraer pipeline
→ adaptarlo al renderer Museum
→ reconstruir engine interno
→ intentar recuperar comportamiento/visual
```

El intento demostró que una integración técnicamente activa puede seguir siendo una mala solución de producto y alejarse del donor validado.

No seguir invirtiendo en absorber Wet Paint dentro del renderer Museum como arquitectura principal.

### Estrategia vigente — APROBADA

```text
DONOR STANDALONE VALIDADO
→ PRESERVARLO
→ EJECUTARLO AISLADO
→ CONECTARLO A MUSEUM CON BRIDGE PEQUEÑO
→ VERLO FUNCIONAR
→ DESPUÉS ESCULPIR SHELL / PRESENTACIÓN
```

Regla:

> **Museum no reescribe el cerebro del donor. Museum lo aloja, lo conecta y lo presenta.**

Arquitectura completa:

`docs/architecture/immersive-worlds/MUSEUM_STANDALONE_EXPERIENCE_ARCHITECTURE_V1.md`

---

## PRECEDENTES INTERNOS OBLIGATORIOS

Claude no debe leer todo Escaparates Pro. Sólo estudiar estos patrones:

### Casebook PRO

- `labs/interactive-boards-source/casebook-pro-v1-1/README.md`
- `js/interactive-boards-ui.js` sólo si necesita confirmar el mecanismo de hosting.

Patrón validado:

- standalone canónico;
- iframe aislado;
- runtime propio preservado;
- plataforma registra/aloja en vez de reimplementar.

### Rope Gallery PRO

- `labs/website-modules-source/rope-gallery-pro/README.md`
- `labs/website-modules-source/rope-gallery-pro/index.html` sólo si hace falta comprobar ejecución.

Patrón validado:

- standalone aprobado como fuente canónica;
- Website Modules Lab lo carga directamente;
- funciones globales delegan en la pieza;
- no se recrea/simplifica la física al integrarla.

---

## BASE MUSEUM SEGURA

Repositorio:

`Juanmaes83/escaparates-pro`

Rama de documentación/rollback:

`chatgpt/museum-itinerant-media-visible-v3`

Checkpoint funcional de producto:

`b9389f05af3eab1db4a7dc39cc88a2390eb63e3d`

En esa base quedaron humanamente confirmados:

- sala itinerante;
- cinco slots de obra;
- upload imagen;
- upload vídeo;
- visor central;
- navegación Museum;
- aislamiento respecto a `main/master`.

El HEAD de la rama puede avanzar por documentación. El SHA anterior sigue siendo el rollback funcional de producto.

---

## ESTADO CLAUDE ACTUAL

Rama:

`claude/museum-itinerant-living-art-graft-v1`

Commit verificado:

`c12b04a64f52a9ae1b9fe564fb1c066448ce2508`

Ese commit corrigió la costura temporal Growth entre `01 ORIGINAL` y `02 PAINTERLY` y aportó evidencia automatizada A→B.

**Pero no cambia la decisión de producto:** el enfoque de pipeline Wet Paint absorbido dentro de Museum queda retirado como arquitectura principal.

Mantener la rama como evidencia/experimento hasta decidir limpieza. No continuar extendiendo `wet-paint-pipeline.js` ni `painterly-engine.js` como destino arquitectónico.

---

## DONOR 01 — WET PAINT FLOW

Repositorio:

`Juanmaes83/wet-paint-flow`

Commit canónico:

`0b9ba9a5be665f3a2a8b2450945ec5006e61e2de`

Runtime humano validado:

`http://127.0.0.1:4186/`

Estado:

**DONOR REAL FUNCIONA. NO RECONSTRUIRLO.**

Objetivo de fase:

```text
01 ORIGINAL
→ bridge mínimo
→ Wet Paint standalone real
→ 02 WET PAINT
```

El usuario debe poder abrir/ver la experiencia Wet Paint real desde el contexto Museum.

---

## DONOR 02 — VAN GOGH CROWS

Repositorio:

`Juanmaes83/van-gogh-crows`

Commit canónico:

`1240c1feb2983c945c81671aa594498ea0fbdfce`

No implementar todavía.

Sólo garantizar que el registry/bridge que se diseñe para Wet Paint no quede acoplado a un único donor.

Cuando llegue la fase `03 LIVING`, preservar el runtime real GPGPU/flock. No crear un `LivingEngine` genérico inspirado en él.

---

## MUSEUM EXPERIENCE BRIDGE

La nueva costura puede gestionar únicamente:

Museum → donor:

- source/media de `01 ORIGINAL`;
- play/replay/reset;
- parámetros explícitamente expuestos en fases posteriores.

Donor → Museum:

- READY;
- PROCESSING;
- RESULT_READY;
- resultado visual compatible;
- errores.

El bridge NO contiene shaders, GBuffer, seeds, stroke geometry, impasto, flock ni física donor.

---

## MISION INMEDIATA

### GATE 0 — SIN CODIGO

Claude debe estudiar únicamente:

1. `MUSEUM_STANDALONE_EXPERIENCE_ARCHITECTURE_V1.md`;
2. README de Casebook PRO;
3. README de Rope Gallery PRO;
4. sólo archivos mínimos de registro/hosting si son necesarios;
5. `wet-paint-flow @ 0b9ba9a...` sólo para localizar seams de entrada/salida;
6. conocer `van-gogh-crows @ 1240c1f...` como siguiente donor, sin implementarlo.

Debe responder y STOP con:

A. patrón Casebook reutilizado;
B. patrón Rope reutilizado;
C. preservación Wet Paint;
D. input bridge;
E. output bridge;
F. archivos a tocar;
G. archivos protegidos;
H. estrategia de preservación A/B y justificación;
I. generalidad mínima para VGC.

Sólo después de `KEEP — IMPLEMENTA` puede escribir código.

---

## DEFINITION OF DONE — 02 WET PAINT

1. Museum abre.
2. Sala itinerante abre.
3. `01 ORIGINAL` acepta fuente real A.
4. `02 WET PAINT` recibe A.
5. Desde Museum se abre/visualiza el Wet Paint standalone real.
6. El comportamiento observado corresponde al donor real validado.
7. A→B funciona sin reload.
8. `02` cambia a transformación de B.
9. `03/04/05` permanecen intactos.
10. runtime local reproducible entregado.
11. Juanma hace Human Review y decide `KEEP / ADJUST / REJECT`.

No existe PASS sólo porque Playwright, strokes, píxeles o consola den verde.

---

## NO HACER

- NO leer todo Escaparates Pro.
- NO arqueología general.
- NO reimplementar donors funcionales.
- NO engines genéricos nuevos.
- NO seguir perfeccionando `painterly-engine.js`.
- NO seguir haciendo de `wet-paint-pipeline.js` la arquitectura principal.
- NO Living todavía.
- NO Combined todavía.
- NO refactor general.
- NO tocar `main`.
- NO tocar `master`.
- NO merge sin aprobación explícita de Juanma.
- NO tocar Breeze.
- NO tocar Full Studio global.
- NO modificar RenderHost / MediaLoader / MuseumSceneKit salvo causa demostrada + aprobación explícita.
- NO confundir QA técnica con Human Review.

---

## CONTRATO DE VALIDACION

```text
ARQUITECTURA
→ GATE 0
→ CHATGPT AUDITA
→ KEEP / ADJUST / STOP
→ IMPLEMENTACION MINIMA
→ EJECUCION
→ QA TECNICA
→ RUNTIME REAL
→ JUANMA VE
→ CHATGPT AUDITA
→ CORREGIR
→ NUEVO RUNTIME
→ JUANMA APRUEBA
```

Movimiento requiere evidencia temporal.
Una captura no valida Growth, interacción o flock.

---

## CHECKPOINT DE REANUDACION

```text
REPO:
Juanmaes83/escaparates-pro

ARQUITECTURA VIGENTE:
MUSEUM_STANDALONE_EXPERIENCE_ARCHITECTURE_V1.md

BASE MUSEUM / ROLLBACK FUNCIONAL:
chatgpt/museum-itinerant-media-visible-v3
b9389f05af3eab1db4a7dc39cc88a2390eb63e3d

RAMA CLAUDE EXPERIMENTAL ACTUAL:
claude/museum-itinerant-living-art-graft-v1
c12b04a64f52a9ae1b9fe564fb1c066448ce2508

DONOR WET PAINT:
Juanmaes83/wet-paint-flow
0b9ba9a5be665f3a2a8b2450945ec5006e61e2de
HUMAN VALIDATED: http://127.0.0.1:4186/

DONOR LIVING SIGUIENTE:
Juanmaes83/van-gogh-crows
1240c1feb2983c945c81671aa594498ea0fbdfce

ESTRATEGIA RETIRADA:
internal donor graft / reimplementation as Museum engine

ESTRATEGIA ACTIVA:
standalone preservation + Museum shell/bridge

MISION AHORA:
GATE 0 de Wet Paint standalone.
NO código hasta auditoría KEEP.
NO Living.
NO Combined.
NO main/master.
NO merge.
```

---

**Este documento y `MUSEUM_STANDALONE_EXPERIENCE_ARCHITECTURE_V1.md` son la fuente de verdad vigente. Si una memoria de conversación entra en conflicto con ellos, prevalece esta decisión hasta una nueva aprobación explícita de Juanma.**
