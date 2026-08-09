# Immersive Worlds — IW-1 (prototipo aislado)

> **Estado:** prototipo para revisión. **No aprobado, no integrado, no mergeado.**
> Este módulo es aditivo y está aislado: no modifica ni depende de ningún otro
> módulo de Escaparates Pro, y no aparece en la navegación.

Immersive Worlds es un módulo nuevo de primer nivel dentro de Escaparates Pro:
un sistema para **construir, explorar, conectar, dirigir, narrar y publicar
mundos interactivos en web**. No es Casebook V5 y no se construye sobre Boards.

Este primer hito (IW-1) demuestra que la arquitectura aprobada en IW-0 funciona,
usando como prueba una institución ficticia: la **Fundación Arenas**.

---

## Cómo verlo

```bash
# desde la raíz del repositorio
node tests/static-server.mjs 4180 .
```

| Superficie | URL |
|---|---|
| Experiencia publicada (visitante) | `http://127.0.0.1:4180/labs/immersive-worlds/index.html` |
| Capa de autoría (autor) | `http://127.0.0.1:4180/labs/immersive-worlds/author.html` |

Parámetros útiles: `?tier=LOW|MEDIUM|HIGH`, `?reducedMotion=1`, `?seed=…`,
`?state=<estado determinista>`, `?world=<ruta a otro .world.json>`.

**Controles:** `W A S D` / flechas para moverse, ratón (o flechas ←→) para mirar,
`E` o `Enter` para activar lo que tienes cerca, `Esc` para salir del detalle o del
recorrido, `M` para el mapa de salas, `G` para el recorrido comentado.
En móvil: mitad izquierda de la pantalla para caminar, mitad derecha para mirar.

---

## Qué demuestra

| Afirmación | Dónde vive |
|---|---|
| Los datos semánticos no son la representación visual | `engine/` no importa Three.js; `scene-kits/museum/` es el único lugar donde algo se convierte en geometría |
| Un objeto semántico, un registro canónico | `engine/world/world-store.js` |
| El mundo no es la cámara | `engine/world/world-state.js` no contiene ninguna pose |
| Una sola autoridad de cámara por frame | `engine/camera/camera-authority.js` — con token de escritura, no por convención |
| Hotspot dispara, Portal conecta | `engine/schema/validate.js` rechaza que uno asuma el papel del otro |
| Explore y Guided comparten un World State | `engine/experience/experience-director.js` orquesta el mismo store |
| Scene Kit ≠ World Engine | `engine/scenekit/scene-kit.js` es todo el contrato |
| Autoría ≠ experiencia publicada | `author.html` e `index.html`, con autoridades de cámara distintas |

Ejecutable desde la consola del navegador:

```js
await window.__IW.assertInvariants()   // las afirmaciones anteriores, comprobadas
window.__IW.report()                   // informe completo del runtime
window.__IW.states                     // estados deterministas disponibles
await window.__IW.applyState('museum:gallery-a-overview')
```

---

## QA

```bash
node labs/immersive-worlds/qa/run-qa.mjs          # requiere que `playwright` sea resoluble
node labs/immersive-worlds/qa/run-qa.mjs --headed # para verlo trabajar
```

Arranca un navegador real, recorre el prototipo, comprueba las invariantes,
captura todos los estados nombrados y escribe `qa/evidence/report.json`.

Las cifras de rendimiento del bundle se midieron con **SwiftShader (render por
software, sin GPU)**. Sirven como señal relativa — draw calls, triángulos,
conjunto de trabajo, tiempos de warmup — y **no** como rendimiento de dispositivo.
Los presupuestos numéricos que exige la Constitución §20 aún no están fijados.

---

## Estructura

```text
engine/      Motor semántico. Sin Three.js, sin DOM. Comprobado por QA.
  core/        runtime, reloj, bus de eventos, RNG determinista, tiers de dispositivo
  schema/      tipos + validador (las invariantes, aplicadas)
  world/       world store, world graph, world state, ciclo de vida de Spaces
  camera/      autoridad de cámara + explore / focus / directed / author
  interaction/ proximidad, despacho de Actions
  experience/  director de experiencia
  scenekit/    el contrato motor ↔ representación
render/      Host de Three.js: renderer y objeto cámara. Genérico, sin semántica.
scene-kits/  museum/ — el único lugar donde la semántica se hace museo
worlds/      museum-v1.world.json — datos, no código
app/         shells DOM, UI, entrada, audio
qa/          estados deterministas + runner de evidencia
vendor/      three.js r0.185.1 (MIT), con su licencia y su registro
```

---

## Contenido y derechos

**Todo el contenido es ficticio y se genera en tiempo de ejecución.** La Fundación
Arenas, sus once obras, sus cinco autores y todos los textos de sala son
invención propia. No hay ninguna imagen, modelo, vídeo ni audio en el módulo: las
pinturas, las texturas, las cartelas, el vídeo y el ambiente sonoro se sintetizan
en el navegador a partir de una semilla determinista.

No se ha copiado código ni assets de ningún repositorio de referencia. La única
dependencia externa es three.js (MIT), registrada en `vendor/three/VENDOR.md`.

---

## Límites conocidos

La calidad visual está a nivel de **blockout con pase de materiales y luz**, no
final. No se ha ejecutado todavía el Gauntlet Loop contra una barra nombrada, ni
una revisión Unslop independiente, ni una auditoría de accesibilidad. La lista
completa y honesta está en
`docs/architecture/immersive-worlds/IW-1_IMPLEMENTATION_RECORD.md` §6.

---

## Documentación

- `docs/architecture/IMMERSIVE_WORLDS_MODULE_CONTEXT.md` — contexto del módulo
- `docs/architecture/immersive-worlds/CONSTITUTION.md` — IW-0, contratos
- `docs/architecture/immersive-worlds/REFERENCE_LEDGER.md` — referencias y licencias
- `docs/architecture/immersive-worlds/DECISION_LOG.md` — decisiones y ADRs
- `docs/architecture/immersive-worlds/GLOSSARY.md` — vocabulario
- `docs/architecture/immersive-worlds/IW-1_IMPLEMENTATION_RECORD.md` — **este hito**
