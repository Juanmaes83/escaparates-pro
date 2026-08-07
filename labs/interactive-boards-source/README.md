# Interactive Boards — Registry

Familia de primer nivel de **Escaparates Pro** para workspaces visuales conectados, presentaciones espaciales y sistemas interactivos de organización y narrativa. Los Interactive Boards se ejecutan aislados del motor general de Efectos y de Website Modules para preservar su runtime, estado y pipeline de exportación.

## Módulos validados

| # | Módulo | Versión | Estado | Ruta | SHA-256 |
| ---: | --- | --- | --- | --- | --- |
| 1 | **Casebook PRO — Creative Campaign Board** | V1.1 | **VALIDADO EN PLATAFORMA** | `casebook-pro-v1-1/` | `96d5da228695c4b0d669e45251469608d4f8676e4c27a462654f6724fd780e63` |

## Casebook PRO V1.1

Primer board de la categoría. Incluye cinco demos completas — Detective / Investigation, Campaign 360, Fashion Campaign, Project / Tasks y Strategy / Presentation —, tarjetas multimedia, board/background multimedia, conexiones, timeline, Graph View, lasso, minimapa, JSON Import/Export y entregables HTML, ZIP, Embed, Preview, PNG y Review Recording.

- Module ID: `casebook-pro-v1-1`
- Registry JS: `js/interactive-boards-casebook-pro-v1-1.js`
- UI family controller: `js/interactive-boards-ui.js`
- Fuente canónica: `casebook-pro-v1-1/index.html`
- Preservación: `casebook-pro-v1-1/source.v1.1.html.gz`
- PR de integración: `#33`
- Merge commit: `89dc455271cf1cc4f537114f31ed73cf80d19ec0`
- Deploy GitHub Pages: validado
- Deploy Vercel: validado
- Validación visual/funcional integrada: confirmada tras el deploy

## Regla de registro

Cuando un Interactive Board o una versión nueva haya superado la validación standalone y la validación integrada en Escaparates Pro, debe registrarse en tres niveles:

1. `README.md` raíz — inventario y estado global.
2. `labs/interactive-boards-source/README.md` — catálogo oficial de la familia.
3. README del módulo — arquitectura, capacidades, fuente canónica, hash, PR/commit y estado de validación.

No se considera cerrada una entrega si el módulo está desplegado pero falta alguno de estos registros.

## Evolución

Las versiones aprobadas son inmutables: una ampliación avanzada entra como versión nueva y no modifica silenciosamente el HTML canónico anterior. Casebook PRO V1.1 queda congelado como baseline validado para futuras V2/V3.
