# Casebook PRO V2 — Spatial Storytelling System

Segundo gran paso de **Casebook PRO** dentro de la familia **Interactive Boards** de Escaparates Pro. V2 conserva el concepto de workspace visual conectado de V1.1 y añade una capa narrativa completa para convertir el mismo board en una historia espacial, una presentación guiada y una grabación final.

> **Idea central:** el board deja de ser únicamente un espacio que se explora. También puede convertirse en una secuencia narrativa controlada.

```text
BOARD  →  STORY  →  PRESENTATION  →  RECORDING
  │          │            │               │
organizar   ordenar      recorrer        capturar
conectar    temporizar   enfocar         compartir
explicar    revelar      presentar       entregar
```

## Identidad y estado

| Campo | Valor |
| --- | --- |
| Module ID | `casebook-pro-v2` |
| Familia | `Interactive Boards / Spatial Storytelling` |
| Versión | `V2` |
| Estado actual | **CANDIDATO / PENDIENTE DE VALIDACIÓN INTEGRADA** |
| Fuente canónica integrada | `index.html` |
| Git blob canónico | `abe3674c2bc29f0acdb4866c7a76a0714039a058` |
| SHA-256 canónico | `6e4ba33fea2a6d2b5b4fb3b226ae561c07680dc30b882d67c6945c8cde77b04d` |
| Proyecto origen | `Juanmaes83/CASEBOOK-PRO-V2-Spatial-Storytelling-System` |
| Registro Escaparates Pro | `js/interactive-boards-casebook-pro-v2.js` |
| Runtime | standalone aislado en iframe |

El HTML integrado es una copia **byte-exacta** del standalone del repositorio origen. La identidad se comprobó mediante su Git blob SHA antes de introducirlo en Escaparates Pro. No se ha reescrito, minificado ni adaptado internamente para la plataforma.

## Qué cambia respecto a V1.1

V1.1 es el baseline aprobado y permanece congelado. V2 no lo sustituye ni lo modifica: aparece como un módulo independiente.

```text
V1.1
Workspace visual conectado
        │
        ├─ cards + multimedia
        ├─ conexiones
        ├─ timeline / graph / minimap
        ├─ personalización
        └─ exportación

V2
Workspace visual conectado
        │
        └─ + Spatial Storytelling
              ├─ Zones
              ├─ Story Path
              ├─ Camera & Reveal
              ├─ Media-aware timing
              ├─ Smart Connections
              ├─ Focus Network
              ├─ Presentation Preflight
              ├─ Present Exact / Live
              └─ Record Exact / Live
```

La filosofía de evolución es **aditiva y reversible**: V1.1 sigue disponible como versión estable anterior y V2 evoluciona en su propia ruta.

## Arquitectura

Casebook PRO V2 se ejecuta dentro de `Interactive Boards` mediante un **iframe aislado**. Escaparates Pro no absorbe el motor del board dentro de su runtime principal.

```text
Escaparates Pro
│
├─ Interactive Boards registry
│    └─ casebook-pro-v2
│
├─ Interactive Boards UI
│    └─ abre el módulo
│
└─ iframe aislado
     └─ casebook-pro-v2/index.html
          ├─ Casebook engine
          ├─ V2 outer controller
          ├─ Spatial Storytelling engine
          ├─ media / persistence
          └─ export / recording
```

Esta separación reduce el riesgo de colisiones con Three.js, GSAP, estado global, estilos o módulos de otras familias de Escaparates Pro.

## 1. Board — construir el universo visual

El punto de partida sigue siendo un board espacial formado por tarjetas, conexiones, medios y contexto visual. El usuario puede construir un caso, campaña, proyecto, pitch o investigación y después decidir qué parte quiere convertir en historia.

V2 mantiene capacidades de edición y personalización heredadas del sistema Casebook: identidad de marca, nombre y código de proyecto, colores de interfaz, pins y conexiones, labels, board, background, tarjetas, multimedia, tags, notas, status, owner, fechas, metadata, timeline, Graph View, lasso, minimapa, Undo/Redo y estados exportables.

### Presets incluidos

- **Detective / Investigation** — investigación visual y relaciones entre evidencias.
- **Campaign Command Center** — campaña, piezas, canales y conexiones estratégicas.
- **Fashion Creative Room** — referencias, conceptos y desarrollo creativo de moda.
- **Project / Tasks** — organización visual de proyecto y trabajo.
- **Strategy / Presentation** — argumentos, decisiones y narrativa estratégica.
- **Agency Pitch Room** — estructura visual para propuestas y pitches.

Un preset es un punto de partida visual y funcional, no una limitación del modelo. Puede editarse posteriormente.

## 2. Zones / Areas — dar estructura espacial al board

Las **Board Zones** permiten dividir el espacio en áreas semánticas. Una zona puede representar, por ejemplo, `Research`, `Insight`, `Concept`, `Execution`, `Results` o cualquier estructura definida por el usuario.

Cada zona dispone de propiedades editables de posición y tamaño (`x`, `y`, `w`, `h`), título, subtítulo, color, opacidad, borde, textura e imagen asociada. De esta forma el board puede tener jerarquía visual antes incluso de empezar una presentación.

```text
┌──────────────────────── BOARD ────────────────────────┐
│                                                       │
│  ┌──── RESEARCH ────┐   ┌──── STRATEGY ──────────┐   │
│  │ cards / evidence │   │ insights / decisions   │   │
│  └──────────────────┘   └────────────────────────┘   │
│                                                       │
│  ┌──── CREATIVE ──────────────────────────────────┐   │
│  │ concepts → assets → outputs                    │   │
│  └────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────┘
```

Las imágenes de zona forman parte del estado portable de V2 cuando se exporta con media.

## 3. Story Path — transformar espacio en secuencia

Una tarjeta seleccionada puede añadirse al **Presentation Path**. El Story Path establece el orden en que se visitarán los elementos y convierte una composición libre en una secuencia narrativa.

Cada step puede reordenarse, editarse o eliminarse. El motor permite definir:

- cámara: `Cinematic Push`, `Direct`, `Slide`, `Pull Back`, `Overview → Detail` o `Connection Follow`;
- duración de cámara;
- timing `AUTO`, `FIXED`, `FULL MEDIA` o `MANUAL HOLD`;
- duración fija cuando corresponda;
- `Pre hold` y `Post hold`;
- puntos `Media IN` y `Media OUT`;
- Focus Network por step: Off, 1 hop, 2 hops o Full chain;
- reveal: `On arrival`, `Before camera` o sin acción de reveal.

### Media-aware timing

Una de las diferencias clave de V2 es que el tiempo de una presentación puede depender de la duración real del medio. En `AUTO` y `FULL MEDIA`, un vídeo corto y uno largo no reciben artificialmente el mismo tiempo: el motor tiene en cuenta la media real y espera a que cámara y contenido completen su exposición.

Los valores globales de duración estática y transición sirven como defaults y pueden personalizarse.

## 4. Reveal — controlar cuándo existe visualmente cada elemento

Las tarjetas pueden configurarse para:

- estar visibles desde el inicio;
- revelarse al llegar a un step;
- aparecer con su elemento padre;
- permanecer ocultas hasta ser seleccionadas.

Esto permite construir narrativas progresivas: una conclusión, evidencia, concepto o resultado puede permanecer fuera de escena hasta el momento adecuado.

## 5. Smart Connections — convertir líneas en relaciones con significado

V2 añade una capa semántica a las conexiones. Una conexión puede indicar relaciones como:

`depends on` · `targets` · `creates` · `uses` · `converts to` · `inspired by` · `produces` · `approved by` · `supports` · `leads to` · `custom`

También se puede personalizar su representación:

| Parámetro | Posibilidades |
| --- | --- |
| Style | Physical Thread, Directional Thread, Dashed, Glow, Animated Pulse, Flow, Minimal Line |
| Direction | A → B, A ← B, A ↔ B, None |
| Width | grosor configurable |
| Flow speed | velocidad configurable |
| Animated | activación de comportamiento animado |

El objetivo es que una conexión explique **qué relación existe**, no únicamente que dos tarjetas están conectadas.

## 6. Focus Network — aislar la red relevante

**Focus Network** reduce el ruido visual alrededor de una tarjeta y conserva el nodo seleccionado junto a las relaciones relevantes.

Se puede elegir profundidad `1 hop`, `2 hops` o `Full chain`, y dirección `Both`, `Incoming` u `Outgoing`.

Esta capacidad funciona tanto para exploración manual como dentro de un Presentation Step. Conceptualmente actúa como un spotlight de red: centra la atención en una parte del grafo sin destruir el contexto general.

## 7. Preflight — comprobar la presentación antes de empezar

Antes de presentar, V2 puede ejecutar **Presentation Preflight**. El preflight analiza el recorrido y muestra:

- número de steps;
- número de vídeos;
- steps manuales;
- duración conocida estimada;
- incidencias detectadas en targets o media.

Los `MANUAL HOLD` se comportan de forma diferente según el modo: en LIVE esperan la intervención del presentador; en EXACT utilizan el fallback configurado para mantener un recorrido determinista.

## 8. Presentation — dos formas de contar la historia

### Presentación exacta

El sistema reproduce automáticamente el Story Path respetando cámara, tiempos, reveal, focus y media. Es apropiado cuando se busca una presentación reproducible.

### Presentación live

El usuario mantiene control durante los steps que requieren intervención manual. Es apropiado para explicar un caso, hacer un pitch o reaccionar a una conversación en directo.

Durante la presentación el editor se repliega para priorizar el contenido y el HUD muestra el estado del recorrido.

## 9. Recording — convertir la presentación en entregable

V2 utiliza `getDisplayMedia` + `MediaRecorder` para capturar la presentación y generar WebM.

- **RECORD EXACT**: graba el tour automatizado.
- **RECORD LIVE PRESENTATION**: respeta `MANUAL HOLD` y espera `NEXT`.

Durante la grabación se ocultan paneles y HUD. La captura intenta utilizar `video/webm;codecs=vp9,opus` cuando el navegador lo soporta y cae a `video/webm` como alternativa. El audio depende de que el navegador y la selección de captura permitan compartirlo.

Controles operativos previstos durante el recorrido incluyen `SPACE`/flecha derecha para avanzar y `ESC` para detener.

## 10. Estado, media e importación portable

V2 puede exportar e importar el proyecto en JSON. La exportación portable puede incorporar media como Data URL para que tarjetas, configuración y zonas puedan reconstruirse en otra sesión.

Al importar, el controlador rehidrata medios de tarjetas, imágenes de zonas, logo, board y background y los vuelve a conectar con el estado del board.

La persistencia de medios utiliza almacenamiento del navegador y Object URLs, manteniendo separados los blobs pesados del estado lógico cuando corresponde.

## 11. Outputs

El sistema conserva las salidas de Casebook y añade las específicas de storytelling. Dependiendo del flujo utilizado puede producir o facilitar:

`JSON` · `HTML` · `ZIP` · `Embed` · `Preview` · `PNG` · `Viewer` · `WebM Exact` · `WebM Live`

El Viewer final permite separar una experiencia de consumo de la interfaz de edición.

## Personalización — qué puede adaptar un usuario

Casebook PRO V2 está pensado como sistema reutilizable. Entre los niveles de personalización disponibles se encuentran:

| Nivel | Ejemplos |
| --- | --- |
| Identidad | brand, logo, project name, project code |
| UI | background, panel, text, accent, pin colors |
| Nomenclatura | item, connections, strength, timeline, graph y share labels |
| Board | color, imagen o vídeo |
| Background | color, imagen o vídeo |
| Cards | texto, imagen/vídeo, tags, notas, owner, status, fecha, metadata |
| Zones | nombre, subtítulo, geometría, color, opacidad, borde, textura, imagen |
| Story | selección y orden de steps |
| Camera | tipo y duración por step |
| Timing | auto, fixed, full media, manual hold, IN/OUT, pre/post hold |
| Reveal | visibilidad inicial y momento de aparición |
| Network | semántica, estilo, dirección, grosor, velocidad, animación |
| Focus | profundidad y dirección de relaciones visibles |
| Presentation | exact/live, audio y defaults de timing |
| Delivery | estados portables, viewer y grabación WebM |

## Ejemplos de uso

**Caso de investigación:** organizar evidencias por zonas → conectar causas y consecuencias → crear Story Path → revelar pruebas progresivamente → usar Focus Network para explicar relaciones → grabar el recorrido.

**Campaña 360:** dividir Research / Strategy / Creative / Channels / Results → conectar insight con piezas y canales → configurar smart relationships → crear un pitch secuencial → presentar live al cliente.

**Proyecto:** zonas por fases → tarjetas de tareas y decisiones → conexiones de dependencia → story de status → presentación exacta para revisión o grabación de actualización.

**Portfolio / case study:** construir el caso completo en board → ordenar problema, idea, proceso y resultado → sincronizar vídeos → generar una presentación narrativa y un viewer final.

## Integración en Escaparates Pro

La integración sigue el mismo principio arquitectónico de V1.1:

```text
js/interactive-boards.js
        ↓ registro
js/interactive-boards-casebook-pro-v2.js
        ↓ path
labs/interactive-boards-source/casebook-pro-v2/index.html
        ↓ iframe
Casebook PRO V2
```

El controlador compartido `js/interactive-boards-ui.js` no necesita una implementación específica de V2: el standalone conserva su runtime y la plataforma actúa como launcher/host aislado.

## Seguridad de evolución

- **V1.1 permanece congelada y no se modifica.**
- V2 vive en una ruta, registro y Module ID propios.
- Una futura V2.x/V3 debe evolucionar como versión nueva o mediante un cambio explícitamente aprobado; no debe alterar silenciosamente V1.1.
- `Multi-board / Chapters` no forma parte del alcance de esta V2 y queda reservado para evolución posterior.
- Antes de considerar V2 cerrada debe superar validación integrada visual y funcional en Escaparates Pro.

## Checklist de validación integrada

- El catálogo de Boards muestra V1.1 y V2 como módulos independientes.
- Abrir V2 no altera V1.1 ni otro módulo de Escaparates Pro.
- El iframe carga sin errores críticos.
- Presets y edición base funcionan.
- Zones se crean/editan y persisten correctamente.
- Story Path permite añadir, reordenar, editar y eliminar steps.
- Preflight calcula el recorrido.
- Focus Network y Smart Connections funcionan sobre el board real.
- Presentación Exact y Live completan el recorrido.
- Recording solicita captura y genera WebM cuando el navegador lo permite.
- Export/Import JSON conserva estado y media portable.
- Volver a V1.1 mantiene intacta la experiencia aprobada.

## Estado documental

Este README describe la funcionalidad encontrada en el standalone canónico V2 y su integración prevista. El módulo **no debe marcarse como VALIDADO EN PLATAFORMA** hasta que el PR se despliegue y la validación integrada se confirme expresamente.
