# MUSEUM STANDALONE EXPERIENCE ARCHITECTURE V1

**Estado:** APROBADO POR DIRECCIÓN / CONTRATO ARQUITECTÓNICO ACTIVO
**Fecha:** 22.08.2026
**Repo:** `Juanmaes83/escaparates-pro`
**Objetivo:** integrar experiencias visuales complejas dentro de Museum sin reescribir sus runtimes ni destruir el comportamiento ya validado de los donors.

---

## 1. DECISIÓN ARQUITECTÓNICA

Museum deja de intentar absorber Wet Paint como un motor interno reimplementado.

La estrategia aprobada es:

```text
MUSEUM = HOST / SALA / NAVEGACIÓN / PRESENTACIÓN

DONORS = EXPERIENCIAS STANDALONE AISLADAS

Museum
 ├─ 01 ORIGINAL
 ├─ 02 WET PAINT ─────► Wet Paint standalone real
 ├─ 03 LIVING ────────► Van Gogh Crows standalone real
 ├─ 04 COMBINED ──────► después
 └─ 05 EXPERIMENTAL ──► después
```

Regla principal:

> **NO portar el motor de Wet Paint al renderer del Museum. NO reescribirlo. NO reconstruir sus shaders/pipeline dentro de un engine Museum. Ejecutar el donor funcionando como standalone aislado y hacer que Museum dialogue con él mediante una costura mínima.**

El patrón es deliberadamente análogo a integraciones ya aprobadas en Escaparates Pro.

---

## 2. PRECEDENTE 1 — CASEBOOK PRO

Referencia obligatoria y suficiente:

- `labs/interactive-boards-source/casebook-pro-v1-1/README.md`
- `js/interactive-boards-ui.js` sólo para entender la apertura/hosting en plataforma si hace falta.

Casebook PRO está aprobado con esta regla:

- no se reimplementa dentro del motor general;
- se ejecuta en un `iframe` aislado;
- mantiene independiente su runtime Three.js, GSAP, física, estado, editor y exportación;
- el standalone aprobado actúa como fuente canónica;
- su integración en la plataforma es un shell/registro, no una reescritura del motor.

Esta es una referencia arquitectónica directa para Museum.

---

## 3. PRECEDENTE 2 — ROPE GALLERY PRO

Referencia obligatoria y suficiente:

- `labs/website-modules-source/rope-gallery-pro/README.md`
- `labs/website-modules-source/rope-gallery-pro/index.html` sólo si hace falta comprobar implementación.

Rope Gallery PRO establece otra regla clave:

- el standalone aprobado se conserva como fuente canónica;
- Website Modules Lab carga directamente ese standalone;
- la plataforma delega funciones globales a la pieza en vez de duplicar/recrear su lógica;
- se evita reimplementar la física al incorporarla a la plataforma.

Esta regla aplica directamente a Wet Paint y, después, a Van Gogh Crows.

---

## 4. ARQUITECTURA OBJETIVO — MUSEUM EXPERIENCE BRIDGE

El componente nuevo no será un engine visual. Será una costura/bridge.

```text
                  MUSEUM

        ┌─────────────────────┐
        │ sala itinerante     │
        └─────────┬───────────┘
                  │
         usuario carga imagen
                  │
                  ▼
           01 ORIGINAL
                  │
                  ▼
      MUSEUM EXPERIENCE BRIDGE
                  │
            mensaje / handoff
                  │
                  ▼
 ┌─────────────────────────────────┐
 │ WET PAINT STANDALONE            │
 │ donor real                      │
 │ su Three.js                     │
 │ sus shaders                     │
 │ sus controles                   │
 │ su animation loop               │
 │ su estado                       │
 │ su pipeline                     │
 └────────────────┬────────────────┘
                  │
             resultado/estado
                  │
                  ▼
            02 WET PAINT
```

### Responsabilidades permitidas del bridge

Museum → donor:

- entregar la fuente real de `01 ORIGINAL`;
- `play/replay` si el donor lo soporta;
- `reset`;
- parámetros/presets sólo cuando estén explícitamente expuestos y después de validar la integración base.

Donor → Museum:

- `READY`;
- `PROCESSING`;
- `RESULT_READY`;
- resultado visual/canvas/snapshot/output compatible con la superficie Museum;
- error de runtime.

### Responsabilidades prohibidas del bridge

El bridge NO debe contener ni reconstruir:

- shaders Wet Paint;
- Poisson/seeds;
- direction field;
- stroke geometry;
- GBuffer;
- impasto/composite;
- flock/GPGPU;
- física donor;
- loops visuales internos del donor.

Eso pertenece a cada donor y debe seguir allí.

---

## 5. EXPERIENCE REGISTRY

La arquitectura debe ser genérica desde el principio, sin construir aún todas las experiencias.

Forma conceptual:

```text
experiences/
  registry.js

  wet-paint/
    manifest.js
    bridge.js
    standalone/
      [donor preservado]

  van-gogh-crows/
    manifest.js
    bridge.js
    standalone/
      [fase posterior]

museum-experience-host.js
```

Los nombres exactos pueden ajustarse si la estructura existente del repo exige otro encaje, pero no se debe cambiar el principio:

**host/registry/bridge pequeños + donor standalone preservado.**

No crear una arquitectura mayor de la necesaria.

---

## 6. DONOR 01 — WET PAINT FLOW

Repositorio:

`Juanmaes83/wet-paint-flow`

Commit canónico validado:

`0b9ba9a5be665f3a2a8b2450945ec5006e61e2de`

Runtime humano ya validado:

`http://127.0.0.1:4186/`

La nueva integración debe conservar el donor como experiencia ejecutable real.

Regla de trabajo:

> Estudiar Wet Paint sólo para identificar puntos de entrada/salida y preservarlo funcionando. No estudiarlo para reconstruirlo dentro de Museum.

### Estrategia de preservación

Antes de implementar, Claude debe comprobar cuál de estas dos rutas es más segura:

A. preservar una copia standalone canonizada dentro de `escaparates-pro`, fijada al commit donor;

B. mantener el donor externo como fuente y generar/sincronizar el standalone.

**Preferencia inicial:** A, porque reproduce el patrón Casebook/Rope, congela una versión aprobada y reduce riesgo de rotura futura.

Si se usa A, registrar al menos:

- donor repo;
- donor commit;
- SHA-256 del standalone/copia canónica cuando aplique;
- ruta de preservación;
- versión aprobada.

No copiar/reorganizar el donor antes de cerrar GATE 0.

---

## 7. DONOR 02 — VAN GOGH CROWS

Repositorio:

`Juanmaes83/van-gogh-crows`

Commit canónico:

`1240c1feb2983c945c81671aa594498ea0fbdfce`

No se implementa en la misión actual.

Sólo debe ser tenido en cuenta para asegurar que el bridge/registry no quede acoplado específicamente a Wet Paint.

La fase posterior deberá preservar el runtime real GPGPU/flock, no crear un `LivingEngine` genérico inspirado en él.

---

## 8. RELACIÓN CON EL TRABAJO CLAUDE ANTERIOR

Rama actual conocida:

`claude/museum-itinerant-living-art-graft-v1`

Commit verificado en GitHub:

`c12b04a64f52a9ae1b9fe564fb1c066448ce2508`

Ese trabajo demostró una costura técnica y corrigió un problema de reloj de Growth, pero la estrategia de producto basada en absorber/reconstruir el pipeline Wet Paint dentro de Museum queda **RECHAZADA COMO ESTRATEGIA PRIMARIA**.

El código previo puede conservarse como evidencia/diagnóstico hasta decidir su retirada. No debe seguir evolucionando como arquitectura principal.

En particular:

- `wet-paint-pipeline.js` no es el destino arquitectónico;
- `painterly-engine.js` no es el destino arquitectónico;
- no seguir invirtiendo tiempo en hacer que Museum imite Wet Paint internamente.

---

## 9. BASE MUSEUM SEGURA

Rollback funcional:

`chatgpt/museum-itinerant-media-visible-v3`

Checkpoint funcional de producto:

`b9389f05af3eab1db4a7dc39cc88a2390eb63e3d`

Esta base ya tenía:

- sala itinerante;
- cinco slots;
- carga de imagen/vídeo;
- visor central;
- navegación Museum;
- aislamiento respecto a `main/master`.

No se toca `main/master`.
No se hace merge sin aprobación de Juanma.

---

## 10. MISIÓN 01 — PRUEBA MÍNIMA

Sólo construir:

```text
01 ORIGINAL
    ↓
fuente A
    ↓
Wet Paint standalone real
    ↓
02 WET PAINT
```

Después, en la misma sesión:

```text
fuente B
    ↓
01 ORIGINAL = B
    ↓
Wet Paint standalone recibe B
    ↓
02 WET PAINT = transformación de B
```

Además debe existir una forma clara de abrir/ver la experiencia Wet Paint real desde el contexto Museum (`OPEN EXPERIENCE`, click/focus equivalente o el mecanismo mínimo más coherente con la sala).

La pared puede mostrar el resultado; la experiencia completa puede abrirse en un host/overlay/iframe Museum sin destruir el donor.

---

## 11. DEFINITION OF DONE — HUMAN REVIEW

La fase 02 no está terminada hasta que Juanma la vea.

DoD:

1. Museum abre.
2. Sala itinerante abre.
3. `01 ORIGINAL` acepta una imagen real subida por Juanma.
4. `02 WET PAINT` recibe esa misma fuente.
5. Se puede abrir/ver el Wet Paint standalone real desde Museum.
6. El comportamiento visual observado corresponde al donor real validado, no a una imitación/reimplementación.
7. Cambio A → B sin reload.
8. Wet Paint recibe B y actualiza el resultado.
9. `03/04/05` no cambian por accidente.
10. Se entrega runtime/URL local reproducible para Human Review.
11. Juanma decide `KEEP / ADJUST / REJECT`.

Playwright/QA técnica puede verificar costuras, errores y estado, pero **no sustituye Human Review**.

No hay PASS porque existan strokes, píxeles diferentes, consola limpia o build verde.

---

## 12. GATE 0 — OBLIGATORIO ANTES DE IMPLEMENTAR

Claude no empieza construyendo.

Primero debe leer únicamente:

1. este documento;
2. `labs/interactive-boards-source/casebook-pro-v1-1/README.md`;
3. `labs/website-modules-source/rope-gallery-pro/README.md`;
4. sólo los archivos mínimos de registro/hosting de esas dos piezas que necesite para confirmar el patrón;
5. donor `Juanmaes83/wet-paint-flow @ 0b9ba9a...` sólo para localizar seam input/output;
6. conocer que `Juanmaes83/van-gogh-crows @ 1240c1f...` será el siguiente donor, sin implementarlo.

No leer todo Escaparates Pro.
No hacer arqueología general.

Debe responder y STOP con:

A. patrón exacto de Casebook que reutilizará conceptualmente;
B. patrón exacto de Rope Gallery que reutilizará conceptualmente;
C. cómo preservará Wet Paint standalone;
D. input bridge exacto;
E. output bridge exacto;
F. archivos que propone tocar;
G. archivos que garantiza no tocar;
H. estrategia A o B de preservación y justificación;
I. cómo hará que la arquitectura siga sirviendo para Van Gogh Crows sin implementarlo.

Sólo después de `KEEP — IMPLEMENTA` puede escribir código.

---

## 13. ARCHIVOS / SISTEMAS PROTEGIDOS

No tocar salvo causa demostrada + autorización explícita:

- `main` / `master`;
- `integration/museum-full-studio-three-room-v1`;
- Full Studio global;
- Breeze;
- RenderHost;
- MediaLoader;
- MuseumSceneKit;
- arquitectura general de authoring;
- catálogo global de media;
- módulos no relacionados de Escaparates Pro.

No refactor general.
No Living.
No Combined.
No nueva capa visual ajena a la misión.
No merge.

---

## 14. CONTRATO DE VALIDACIÓN

```text
ARQUITECTURA
→ GATE 0
→ KEEP / ADJUST / STOP
→ IMPLEMENTACIÓN MÍNIMA
→ EJECUCIÓN
→ QA TÉCNICA
→ RUNTIME REAL
→ JUANMA VE
→ CHATGPT AUDITA
→ CORREGIR SI HACE FALTA
→ NUEVO RUNTIME
→ JUANMA APRUEBA
```

Movimiento requiere evidencia temporal.
Una captura estática no valida Growth, interacción ni flock.

---

## 15. PRINCIPIO DE PRODUCTO

Los repositorios donors son capacidades/experiencias autónomas.

Museum aporta:

- espacio;
- narrativa;
- navegación;
- presentación;
- relación entre obras;
- acceso a la experiencia;
- identidad común.

Museum no debe absorber ni reescribir el cerebro de cada experiencia para poder mostrarla.

**PRESERVE THE EXPERIENCE. BRIDGE IT. THEN SCULPT THE SHELL.**
