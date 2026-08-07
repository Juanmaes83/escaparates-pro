# Casebook PRO — Creative Campaign Board V1.1

Primer módulo de la familia **Interactive Boards** de Escaparates Pro.

## Identidad

- Module ID: `casebook-pro-v1-1`
- Familia: `Interactive Boards`
- Versión aprobada: `V1.1`
- Fuente canónica: `index.html`
- SHA-256 canónico: `96d5da228695c4b0d669e45251469608d4f8676e4c27a462654f6724fd780e63`
- Preservación: `source.v1.1.html.gz`
- Proyecto origen: `Juanmaes83/casebook`

## Arquitectura

Casebook PRO no se reimplementa dentro del motor general de Escaparates Pro. Se ejecuta en un **iframe aislado** dentro del modo de primer nivel `Interactive Boards`, manteniendo independiente su runtime Three.js, GSAP, física de cuerdas, estado, editor y pipeline de exportación.

El standalone aprobado es autosuficiente: incorpora Casebook, Three.js, GSAP y JSZip dentro del propio HTML. Esto evita conflictos con la versión global de Three.js utilizada por el modo Efectos.

## Presets visuales incluidos

- Detective / Investigation — Blackwood Dossier completo.
- Campaign 360.
- Fashion Campaign.
- Project / Tasks.
- Strategy / Presentation.

Cada preset carga una demostración visual completa con tarjetas, metadatos y conexiones, no únicamente un cambio de labels.

## Capacidades V1.1

- Identidad: logo, proyecto, código y branding.
- Colores de UI, pins y threads.
- Board: cork, color, imagen o vídeo.
- Background: color, imagen o vídeo.
- Tarjetas generalizadas con texto editable.
- Imagen y vídeo dentro de tarjetas.
- Tags, notas, status, fecha, owner y metadata.
- Conexiones con label, color y strength.
- Inspector configurable.
- Timeline, Graph View, lasso y minimap.
- Física original y Undo/Redo preservados.
- JSON Export + Import.
- HTML, ZIP, Embed, Preview, PNG y Review Recording.
- Viewer final cerrado sin panel de personalización.

## Media y persistencia

Los medios pesados utilizan IndexedDB/Blob/ObjectURL. Para apertura local mediante `file://`, V1.1 incluye fallback de memoria si IndexedDB o localStorage están restringidos por el navegador.

## Integración en Escaparates Pro

La plataforma registra Casebook mediante `js/interactive-boards-casebook-pro-v1-1.js` y lo abre desde `js/interactive-boards-ui.js` dentro de `#interactive-boards-stage`.

`Interactive Boards` es una categoría de primer nivel independiente de Efectos, Scroll Sections, Website Modules Lab, Sector Blueprints, Source Labs y RUBIK SOTA. Website Modules conserva sus 31 módulos actuales sin cambios.

## Regla de evolución

V1.1 queda congelada como fuente aprobada. Las ampliaciones posteriores deben entrar como versiones nuevas y no modificar silenciosamente este archivo canónico.
