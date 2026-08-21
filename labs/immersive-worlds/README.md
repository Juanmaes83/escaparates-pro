# Immersive Worlds — IW-2 (prototipo aislado)

> **Estado:** prototipo para revisión. **No aprobado, no integrado, no mergeado.**
> Este módulo es aditivo y está aislado: no modifica ni depende de ningún otro
> módulo de Escaparates Pro, y no aparece en la navegación.

Immersive Worlds es un módulo nuevo de primer nivel dentro de Escaparates Pro:
un sistema para **construir, explorar, conectar, dirigir, narrar y publicar
mundos interactivos en web**. No es Casebook V5 y no se construye sobre Boards.

IW-1 demostró que la arquitectura aprobada en IW-0 funciona. **IW-2** lleva el
vertical Museum a contenido configurable, arquitectura de galería con lucernarios
y un modo detalle de nivel producto, usando como prueba una institución ficticia:
la **Fundación Arenas**.

---

## Cómo verlo

```bash
# desde la raíz del repositorio
node tests/static-server.mjs 4180 .
```

| Superficie | URL |
|---|---|
| Experiencia publicada (visitante) | `http://127.0.0.1:4180/labs/immersive-worlds/index.html` |
| Segundo mundo, mismo motor | `…/index.html?world=./worlds/institutional-demo.world.json` |
| Capa de autoría (autor) | `http://127.0.0.1:4180/labs/immersive-worlds/author.html` |

Parámetros útiles: `?tier=LOW|MEDIUM|HIGH`, `?reducedMotion=1`, `?seed=…`,
`?state=<estado determinista>`, `?world=<ruta a otro .world.json>`.

**Controles:** `W A S D` / flechas para moverse, ratón (o flechas ←→) para mirar,
`E` o `Enter` para activar lo que tienes cerca, `Esc` para salir del detalle o del
recorrido, `M` para el mapa de salas, `G` para el recorrido comentado.
**En modo detalle:** `←` `→` cambian de obra y la rueda del ratón acerca.
En móvil: mitad izquierda de la pantalla para caminar, mitad derecha para mirar.

---

## Contenido configurable

Cada obra declara de qué está hecha en el propio archivo del mundo:

```json
"media": {
  "kind": "IMAGE",
  "src": "../assets/collection/horizonte-interrumpido.jpg",
  "aspect": 1.46,
  "credit": "Fundación Arenas — colección ficticia (imagen propia)",
  "rights": "Obra propia. Uso libre dentro del producto."
}
```

- `IMAGE`, `VIDEO`, `AUDIO` o `GENERATED`.
- Las rutas son relativas al archivo del mundo, así que una institución guarda su
  colección junto a su definición.
- **Si un archivo falla, la sala no se rompe:** se muestra la lámina generada y se
  emite `asset:error`.
- **El validador rechaza un medio sin `rights`.** Quien cuelga un archivo en una
  pared tiene que poder decir de quién es.

Para cambiar la exposición basta con cambiar los archivos y el JSON. El segundo
mundo (`worlds/institutional-demo.world.json`) existe justamente para demostrarlo:
otra institución, otra arquitectura, mismo motor y mismo Scene Kit.

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
render/      Host de Three.js: renderer, cámara y carga de medios. Genérico, sin semántica.
scene-kits/  museum/ — el único lugar donde la semántica se hace museo
worlds/      museum-v1.world.json + institutional-demo.world.json — datos, no código
assets/      colección propia (imágenes y vídeo) con su registro de derechos
app/         shells DOM, UI, entrada, audio
qa/          estados deterministas + runner de evidencia
vendor/      three.js r0.185.1 (MIT), con su licencia y su registro
```

---

## Contenido y derechos

**Todo el contenido es ficticio y propio.** La Fundación Arenas, sus obras, sus
cinco autores y todos los textos de sala son invención nuestra.

Los archivos de `assets/collection/` los generó este mismo módulo con su propio
generador de láminas y una semilla fija (`qa/tools/make-assets.mjs`); su registro
de derechos está en `assets/collection/RIGHTS.md`. Texturas de pared, suelo,
cartelas y ambiente sonoro se siguen sintetizando en el navegador.

**No se ha copiado código ni assets de ningún repositorio de referencia.** La
auditoría de licencias de la biblioteca está en
`docs/architecture/immersive-worlds/REFERENCE_REUSE_REGISTER.md`: tres de los
repos museísticos de referencia son NonCommercial o GPL y quedan bloqueados para
reutilización directa en un producto comercial. La única dependencia externa es
three.js (MIT), registrada en `vendor/three/VENDOR.md`.

---

## Límites conocidos

Sigue **sin ejecutarse el Gauntlet Loop** contra una barra nombrada, sin revisión
Unslop independiente y sin auditoría de accesibilidad: el paso visual de IW-2 lo
dio quien construye, que es justo lo que la Constitución dice que no basta.
La lista completa y honesta está en
`docs/architecture/immersive-worlds/IW-2_IMPLEMENTATION_RECORD.md` §5.

---

## Documentación

- `docs/architecture/IMMERSIVE_WORLDS_MODULE_CONTEXT.md` — contexto del módulo
- `docs/architecture/immersive-worlds/CONSTITUTION.md` — IW-0, contratos
- `docs/architecture/immersive-worlds/REFERENCE_LEDGER.md` — referencias y licencias
- `docs/architecture/immersive-worlds/DECISION_LOG.md` — decisiones y ADRs
- `docs/architecture/immersive-worlds/GLOSSARY.md` — vocabulario
- `docs/architecture/immersive-worlds/REFERENCE_REUSE_ACCELERATION_POLICY.md` — doctrina de reutilización
- `docs/architecture/immersive-worlds/REFERENCE_REUSE_REGISTER.md` — auditoría de licencias y qué se reutilizó
- `docs/architecture/immersive-worlds/IW-1_IMPLEMENTATION_RECORD.md` — hito anterior
- `docs/architecture/immersive-worlds/IW-2_IMPLEMENTATION_RECORD.md` — **este hito**
