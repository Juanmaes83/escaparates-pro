# CURRENT STATE — MUSEUM DONOR GRAFT — 22.08.2026

**Estado:** CANÓNICO / FUENTE DE VERDAD PARA REANUDAR EL TRABAJO
**Objetivo:** evitar reconstrucciones de contexto, arqueología repetida y nuevas reimplementaciones.

---

## OBJETIVO FINAL

Integrar en el Museum y en la sala itinerante ya creada y funcional los dos donors reales:

1. `Juanmaes83/wet-paint-flow`
2. `Juanmaes83/van-gogh-crows`

Destino visual de la sala:

- `01 ORIGINAL`
- `02 WET PAINT`
- `03 LIVING`
- `04 COMBINED`
- `05 EXPERIMENTAL`

La meta NO es reconstruir estos motores. La meta es **portarlos al Museum, verlos funcionar allí y después esculpirlos/personalizarlos**.

---

## BASE MUSEUM QUE FUNCIONA

Repositorio:

`Juanmaes83/escaparates-pro`

Rama receptora segura:

`chatgpt/museum-itinerant-media-visible-v3`

SHA:

`b9389f05af3eab1db4a7dc39cc88a2390eb63e3d`

Estado humano confirmado en esta base:

- nueva sala itinerante funcionando;
- cinco slots de obra;
- upload de imagen funcionando;
- upload de vídeo funcionando;
- visor central funcionando;
- Museum navegable;
- base aislada, sin merge a `main/master`.

Esta rama es el **rollback seguro**.

---

## ESTADO CLAUDE

Rama de trabajo actual:

`claude/museum-itinerant-living-art-graft-v1`

GitHub confirma que esta rama está **7 commits por delante y 0 por detrás** de `chatgpt/museum-itinerant-media-visible-v3`.

Último SHA funcional confirmado antes del WIP visual posterior:

`72267d760226f937531245b4c6e1ea0099562401`

En ese punto quedó confirmada técnicamente la costura:

`upload → 01 ORIGINAL → detección de cambio → reprocess → destino PAINTERLY`.

Después Claude hizo un commit WIP adicional con iteraciones visuales del `PainterlyEngine` reescrito. El conector actual no expone el SHA exacto de ese HEAD posterior, por lo que **NO se inventa** aquí.

Antes de cualquier nueva modificación Claude debe ejecutar y registrar:

```bash
git rev-parse HEAD
```

Ese valor sustituirá esta nota como `CURRENT CLAUDE HEAD`.

### Qué conservar de Claude

Conservar, salvo que una prueba concreta demuestre lo contrario:

- `painterly-adapter.js` como concepto/costura Museum;
- conexión con el media real de `01 ORIGINAL`;
- detección de cambio de fuente después del upload;
- reprocess al cambiar ORIGINAL;
- conexión hacia la superficie `02 PAINTERLY`;
- workflow de prueba/QA que sea reutilizable sin falsear el resultado.

### Qué descartar de Claude

NO utilizar como motor final:

`labs/immersive-worlds/engines/painterly-engine.js`

Claude auditó su propio trabajo y confirmó:

- donor real: `main.js` de ~3.603 líneas;
- `painterly-engine.js`: ~844 líneas;
- port literal aproximado: `0%`;
- reimplementación/inspiración aproximada: `100%`.

Por tanto el `PainterlyEngine` nuevo queda **RETIRADO COMO ESTRATEGIA**. No seguir corrigiéndolo visualmente.

Claude identificó además módulos donor ya extraídos anteriormente en `claude/museum-living-art-v1`:

- `direction-field.js` — WPF-1
- `poisson-seeds.js` — WPF-2
- `bezier-strokes.js` — WPF-3
- `impasto-material.glsl.js` — WPF-4

Estos módulos pueden ser útiles, pero **no se debe asumir automáticamente que representan toda la piedra**. Deben compararse con el donor completo antes de decidir si bastan. Si son una extracción parcial o con pérdida de comportamiento, se debe portar un bloque mayor del donor real.

---

## DONOR 1 — WET PAINT FLOW

Repositorio:

`Juanmaes83/wet-paint-flow`

SHA canónico validado:

`0b9ba9a5be665f3a2a8b2450945ec5006e61e2de`

### Validación humana ya realizada

Runtime local validado por Juanma:

`http://127.0.0.1:4186/`

Arranque usado:

```bash
npm ci
npm run dev -- --port 4186
```

Resultado:

**DONOR FUNCIONAL Y VISUALMENTE VALIDADO.**

No volver a investigar si Wet Paint “funciona”. Funciona.

La misión es integrarlo en Museum conservando su ADN visual y su pipeline real.

Capacidades que deben conservarse al máximo posible:

- lectura estructural/direction field;
- seeds/Poisson;
- strokes Bézier coarse / medium / fine;
- composición Wet Paint / impasto;
- Growth / replay;
- modos Brushes / Original / Blend / Flow Sketch;
- controles visuales útiles del donor.

---

## DONOR 2 — VAN GOGH CROWS

Repositorio:

`Juanmaes83/van-gogh-crows`

SHA canónico:

`1240c1feb2983c945c81671aa594498ea0fbdfce`

Capacidad principal que interesa portar:

- sistema real GPGPU / flock / swarm;
- movimiento de agentes;
- avoidance / attractor / interacción reutilizable;
- single-draw-call / sistema de bandada cuando aplique.

NO crear un `LivingEngine` genérico inspirado en el donor.

Primero portar/graft el sistema real; después eliminar identidad/asset de cuervo o elementos no deseados y esculpirlo para Museum.

Los assets artísticos específicos del donor no deben asumirse reutilizables sin revisar procedencia/derechos.

---

## QUÉ DESCARTAMOS DE CHATGPT

Rama experimental:

`chatgpt/museum-wet-paint-donor-graft-v1`

**NO USAR COMO BASE DE IMPLEMENTACIÓN.**

No mergear.
No cherry-pick automático.
No continuar parcheándola.

El trabajo realizado allí puede consultarse únicamente como **evidencia diagnóstica / tests / ideas descartadas**.

No se considera avance de producto.

La rama receptora segura continúa siendo:

`chatgpt/museum-itinerant-media-visible-v3 @ b9389f05af3eab1db4a7dc39cc88a2390eb63e3d`

---

## METODOLOGÍA OBLIGATORIA

# PORT FIRST → SEE → SCULPT

También expresado como:

# TRAER LA PIEDRA → VERLA FUNCIONAR → ESCULPIR

Orden obligatorio para donors que ya funcionan:

```text
DONOR FUNCIONANDO
↓
TRAER EL BLOQUE COHERENTE MÁS GRANDE POSIBLE
↓
HACERLO FUNCIONAR CASI TAL CUAL EN EL RECEPTOR
↓
VERLO
↓
RECORTAR UI / SHELL / DEPENDENCIAS QUE SOBRAN
↓
ADAPTAR COSTURAS
↓
PERSONALIZAR / ESCULPIR
```

NO:

```text
DONOR
↓
ENTENDER IDEAS
↓
REESCRIBIR MOTOR
↓
DEBUG
↓
INTENTAR RECUPERAR EL ASPECTO DEL DONOR
```

---

## MISIÓN INMEDIATA

### 02 WET PAINT REAL DENTRO DE MUSEUM

Objetivo único inmediato:

```text
01 ORIGINAL
    ↓
imagen real subida en Museum
    ↓
WET PAINT FLOW REAL
    ↓
02 WET PAINT / PAINTERLY
```

Definition of Done mínima:

1. abrir la sala Museum real;
2. cargar una imagen en `01 ORIGINAL` con el flujo real de authoring;
3. `01 ORIGINAL` conserva esa imagen;
4. `02 WET PAINT` muestra transformación producida por el donor real, no por un engine reescrito;
5. si Growth forma parte del output, la evolución se puede observar;
6. Playwright valida el flujo técnico que pueda validar sin falsear GPU/visual;
7. URL/runtime reproducible para Human Review;
8. Juanma decide `KEEP / ADJUST / REJECT`;
9. no avanzar a Living antes de esta revisión.

No buscar perfección visual en esta fase. Primero demostrar el injerto real.

---

## DESPUÉS — 03 LIVING

Sólo después de validar `02 WET PAINT`:

```text
VAN GOGH CROWS REAL
↓
PORT GPGPU / FLOCK
↓
QUITAR IDENTIDAD / ASSETS QUE SOBRAN
↓
ADAPTAR A OBRA / MUSEUM
↓
03 LIVING
```

No nuevo `LivingEngine` inspirado en boids.

---

## DESPUÉS — 04 COMBINED

Sólo después de que `02 WET PAINT` y `03 LIVING` funcionen por separado:

```text
WET PAINT REAL
+
LIVING REAL
↓
04 COMBINED
```

El Combined se construye por composición de capacidades ya verificadas, no por un tercer engine reescrito desde cero.

---

## NO HACER

- NO arqueología general nueva.
- NO revisar cientos de repositorios.
- NO engines nuevos que reimplementen donors funcionales.
- NO refactors generales antes de ver el injerto.
- NO perfeccionar el `PainterlyEngine` reescrito.
- NO construir `LivingEngine` genérico inspirado en Van Gogh Crows.
- NO tocar `main`.
- NO tocar `master`.
- NO merge sin aprobación explícita de Juanma.
- NO tocar Breeze.
- NO tocar Full Studio global.
- NO modificar RenderHost / MediaLoader / MuseumSceneKit salvo que una causa demostrada lo haga imprescindible y Juanma lo apruebe.
- NO presentar `compila` o `Playwright PASS` como equivalente a Human Review.
- NO entregar fase visual sin URL/runtime reproducible.

---

## CONTRATO DE VALIDACIÓN

```text
CONSTRUIR
→ EJECUTAR
→ PLAYWRIGHT / QA TÉCNICO
→ URL / RUNTIME REAL
→ JUANMA VE
→ CHATGPT AUDITA
→ CORREGIR
→ URL NUEVA
→ JUANMA APRUEBA
```

Movimiento requiere evidencia temporal. Una captura estática no basta para validar Growth, flock o animación.

Human Review es autoridad final de la fase visual.

---

## CHECKPOINT DE REANUDACIÓN

```text
REPO ACTIVO:
Juanmaes83/escaparates-pro

BASE MUSEUM SEGURA:
chatgpt/museum-itinerant-media-visible-v3
b9389f05af3eab1db4a7dc39cc88a2390eb63e3d

RAMA CLAUDE ACTUAL:
claude/museum-itinerant-living-art-graft-v1

ÚLTIMO SHA FUNCIONAL CONFIRMADO DE LA COSTURA:
72267d760226f937531245b4c6e1ea0099562401

CURRENT CLAUDE HEAD:
Claude debe registrar `git rev-parse HEAD` antes de cualquier nueva modificación; existe al menos un WIP posterior al SHA anterior.

DONOR WET PAINT:
Juanmaes83/wet-paint-flow
0b9ba9a5be665f3a2a8b2450945ec5006e61e2de
HUMAN VALIDATED LOCAL: http://127.0.0.1:4186/ ✅

DONOR LIVING:
Juanmaes83/van-gogh-crows
1240c1feb2983c945c81671aa594498ea0fbdfce

MISIÓN ACTUAL:
02 WET PAINT REAL DENTRO DEL MUSEUM

MÉTODO:
PORT FIRST → SEE → SCULPT

DESCARTAR COMO BASE:
chatgpt/museum-wet-paint-donor-graft-v1
PainterlyEngine reescrito

NO FASE 03 hasta Human Review de 02.
NO main/master.
NO merge sin Juanma.
```

---

**Este documento sustituye reconstrucciones de memoria de conversación cuando entren en conflicto con este estado. Si una rama o SHA avanza, actualizar este mismo checkpoint antes de iniciar otra sesión o conversación.**
