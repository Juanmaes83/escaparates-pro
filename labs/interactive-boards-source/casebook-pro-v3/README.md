# Casebook PRO V3 — Spatial Worlds

Casebook PRO V3 convierte el sistema de **Spatial Storytelling** de V2 en un sistema de **mundos visuales navegables**. La evolución es estrictamente aditiva: V1.1 y V2 permanecen intactas y V3 vive en su propia carpeta, registro y rama.

> **Visión de producto:** un sistema para construir mundos visuales, conectarlos, narrarlos, explorarlos y convertirlos en experiencias audiovisuales.

```text
CASEBOOK V1
CONNECTED BOARD
       │
       ▼
CASEBOOK V2
SPATIAL STORYTELLING
Board → Story → Presentation → Recording
       │
       ▼
CASEBOOK V3
SPATIAL WORLDS
World → Chapters → Hotspots → World Map / Navigator
      → Guided Tour → Story → Presentation → Recording
```

## Estado

**CANDIDATO FUNCIONAL V3 / PENDIENTE DE VALIDACIÓN VISUAL Y FUNCIONAL DEL USUARIO.**

No debe mergearse a `master` hasta aprobación final expresa.

## Regla de seguridad

- Casebook PRO V1.1 no se modifica.
- Casebook PRO V2 no se modifica.
- `js/interactive-boards.js` y `js/interactive-boards-ui.js` no se modifican.
- CSS global de Escaparates Pro no se modifica.
- Todo el runtime nuevo vive en `casebook-pro-v3`.
- El desarrollo se realiza en `feat/interactive-boards-casebook-pro-v3-clone`.
- No habrá merge a `master` sin aprobación final.

## Arquitectura técnica

V3 mantiene íntegro el motor clonado de V2 y carga una extensión independiente:

```text
casebook-pro-v3/
├── index.html                 ← clon V2 + un loader V3
├── v3-spatial-worlds.js       ← runtime Spatial Worlds
└── README.md
```

La capa V3 utiliza las APIs públicas que ya expone Casebook dentro del iframe interno (`exportState`, `importState`, Story V2, etc.). Así cada Chapter puede conservar un estado Casebook independiente sin reescribir el motor anterior.

## 1. World

Un **World** es el contenedor superior. Puede representar una vivienda, museo, exposición, mapa, campaña, estrategia, universo narrativo o cualquier experiencia formada por varios espacios.

El World conserva:

- nombre;
- Chapters;
- Chapter activo;
- hotspots por Chapter;
- World Map;
- orden del Guided Tour;
- estado de navegación.

## 2. Multi-board / Chapters

Cada **Chapter** es un Casebook independiente dentro del mismo World.

Al abandonar un Chapter, V3 captura su estado mediante `CasebookPro.exportState()`. Al entrar en otro, restaura el estado correspondiente con `CasebookPro.importState()`.

Esto permite tener, por ejemplo:

```text
WORLD · MUSEUM
├── Chapter 01 · Entrance
├── Chapter 02 · Main Gallery
├── Chapter 03 · Artist Room
└── Chapter 04 · Screening Room
```

Se puede crear un Chapter vacío o duplicar uno existente. Cada Chapter dispone también de posición X/Y en el World Map.

## 3. Hotspots — dos formas de colocación

Los hotspots pueden posicionarse de dos maneras:

### A. Colocación visual

1. Pulsa `ADD HOTSPOT`.
2. El escenario entra en modo de colocación.
3. Haz click exactamente sobre el punto de la imagen/escena.
4. V3 captura X/Y automáticamente.
5. Completa tipo, contenido, destino y transición.

### B. Coordenadas X/Y

El editor permite introducir X e Y manualmente con precisión decimal.

Las coordenadas se almacenan de forma **normalizada en porcentaje**, no como píxeles absolutos. Esto hace que el hotspot conserve su posición relativa cuando cambia la resolución del viewport.

## 4. INFO Hotspot

Un hotspot `INFO` no abandona la estancia. Abre una ficha contextual sobre el mismo espacio.

Puede utilizarse para:

- texto explicativo;
- ficha de una obra;
- información de producto;
- contexto de una vivienda;
- documentación;
- información narrativa.

Conceptualmente permite **explorar información dentro de un espacio**.

## 5. PORTAL Hotspot

Un hotspot `PORTAL` transporta a otro Chapter.

Ejemplos de anclaje:

- puerta;
- pomo;
- ventana;
- pantalla;
- cuadro;
- fotografía;
- mapa;
- objeto;
- edificio;
- cualquier punto de la escena.

Conceptualmente permite **navegar por el mundo**.

### Transiciones espaciales actuales

- Zoom In;
- Zoom Out;
- Doorway / Object Enter;
- Pan Left;
- Pan Right;
- Whip Pan;
- Blur;
- Crossfade.

El punto del hotspot puede utilizarse como origen visual del zoom para reforzar la sensación de entrar en el objeto o estancia.

## 6. World Map / Navigator

El Navigator es una vista global obligatoria del Spatial World.

Puede funcionar sobre:

- un canvas abstracto;
- plano arquitectónico;
- floor plan;
- blueprint;
- mapa geográfico;
- layout de exposición;
- cualquier imagen cargada por el usuario.

Cada Chapter dispone de coordenadas X/Y propias sobre el mapa. Los nodos se conectan siguiendo el recorrido y permiten navegar directamente a una estancia.

```text
[01 Entrance] ─────→ [02 Gallery]
                         │
                         ▼
                   [03 Archive]
                         │
                         ▼
                   [04 Screening]
```

El objetivo es poder entender **de un vistazo** qué espacios existen, cómo están conectados y cuál es el recorrido.

## 7. Guided Tour

El Guided Tour convierte el World en un recorrido ordenado.

El usuario puede:

- reordenar Chapters;
- excluir Chapters del tour;
- iniciar el recorrido;
- avanzar `NEXT`;
- volver `PREV`;
- detener el tour;
- lanzar el Story Path del Chapter actual.

Durante el tour aparece un HUD con posición y Chapter activo.

La separación conceptual es:

```text
WORLD NODE / CHAPTER = lugar o espacio
HOTSPOT              = punto interactivo dentro del lugar
GUIDED TOUR STEP      = posición narrativa del recorrido
```

## 8. Story, Presentation y Recording

V3 no sustituye las capacidades V2. Cada Chapter conserva:

- Zones;
- Story Path;
- Camera & Reveal;
- Media-aware timing;
- Smart Connections;
- Focus Network;
- Presentation Preflight;
- Present Exact / Live;
- Record Exact / Live.

Por tanto, V3 añade una capa de navegación mundial **encima** del storytelling ya aprobado.

```text
WORLD
  ↓
CHAPTER
  ↓
HOTSPOT / NAVIGATION
  ↓
STORY
  ↓
PRESENTATION
  ↓
RECORDING
```

## 9. Quick Start — guía didáctica dentro de la herramienta

V3 incorpora un botón `? GUIDE` que explica el flujo de trabajo en seis pasos:

1. **WORLD** — define el universo.
2. **CHAPTERS** — crea los espacios independientes.
3. **HOTSPOTS** — conecta o amplía información.
4. **WORLD MAP** — construye el plano global.
5. **GUIDED TOUR** — define el recorrido.
6. **STORY → PRESENTATION → RECORDING** — utiliza el motor audiovisual.

Esta guía es el primer paso del sistema de aprendizaje que debe extenderse también a V1 y V2 para reducir la curva de entrada de nuevos usuarios.

## 10. Persistencia

El World se guarda localmente durante el desarrollo. Los estados de cada Chapter se capturan de forma independiente. Los blobs multimedia continúan siendo gestionados por el sistema de persistencia de Casebook.

## QA ejecutado

Se ha ejecutado un workflow temporal de QA que después se elimina automáticamente. Verificaciones realizadas:

- sintaxis JavaScript del runtime V3;
- loader `v3-spatial-worlds.js` presente exactamente una vez;
- APIs `CasebookPro.exportState` / `importState` disponibles en el clon;
- presencia de World Map / Navigator;
- presencia de Guided Tour;
- tipos PORTAL e INFO;
- coordenadas X/Y;
- ausencia de cambios en V1.1;
- ausencia de cambios en V2;
- ausencia de cambios en controladores Interactive Boards compartidos;
- ausencia de cambios en CSS global;
- scope de rama limitado a V3 y su registro/loader.

## Próximas validaciones antes de considerar V3 cerrada

1. Validación visual integrada en Escaparates Pro.
2. Crear varios Chapters y comprobar aislamiento real de estados.
3. Probar hotspots por click y por X/Y.
4. Probar Portal entre Chapters con todas las transiciones.
5. Probar INFO sin abandonar estancia.
6. Cargar un plano real y colocar Chapters.
7. Revisar el orden visual del World Map.
8. Ejecutar Guided Tour completo.
9. Probar Story/Presentation/Recording dentro de distintos Chapters.
10. Revisión UX de la guía didáctica.

Solo después de estas validaciones y de la aprobación final debe prepararse el merge.