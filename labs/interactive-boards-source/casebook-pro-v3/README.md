# Casebook PRO V3 — Clone Baseline

Baseline de trabajo aislado para la futura **Casebook PRO V3 — Spatial Worlds**.

## Estado

**CLONACIÓN DE V2 / PENDIENTE DE APROBACIÓN VISUAL.**

En esta fase no se ha desarrollado ninguna funcionalidad V3. El objetivo es disponer de una copia independiente y verificable de la V2 aprobada antes de comenzar cualquier evolución.

## Regla de seguridad

- Casebook PRO V1.1 no se modifica.
- Casebook PRO V2 no se modifica.
- `master` no se utiliza como área de desarrollo.
- Todo el trabajo V3 se realizará sobre `casebook-pro-v3` y su rama específica.
- No habrá merge a `master` hasta aprobación final expresa.

## Identidad de la clonación

| Campo | Valor |
| --- | --- |
| Fuente | `labs/interactive-boards-source/casebook-pro-v2/index.html` |
| Clon | `labs/interactive-boards-source/casebook-pro-v3/index.html` |
| Git blob V2 | `abe3674c2bc29f0acdb4866c7a76a0714039a058` |
| Git blob V3 clone | `abe3674c2bc29f0acdb4866c7a76a0714039a058` |
| SHA-256 | `6e4ba33fea2a6d2b5b4fb3b226ae561c07680dc30b882d67c6945c8cde77b04d` |

El standalone V3 de esta fase es **byte-exacto respecto a V2**. Por tanto, cualquier diferencia visual antes de comenzar el desarrollo V3 sería un error de integración y no una evolución deliberada.

## Objetivo posterior, todavía NO implementado

Tras la aprobación visual de esta clonación, la evolución V3 prevista se trabajará de forma incremental alrededor de:

`World → Chapters → Hotspots → World Map / Navigator → Guided Tour → Story → Presentation → Recording`

Concepto de producto aprobado para la fase de diseño:

> Un sistema para construir mundos visuales, conectarlos, narrarlos, explorarlos y convertirlos en experiencias audiovisuales.

Entre las líneas aprobadas para brainstorming y diseño posterior están Multi-board / Chapters, hotspots informativos y portales espaciales posicionables por click o coordenadas X/Y, transiciones audiovisuales entre espacios, Guided Tour, World Map / Navigator y una UX de aprendizaje más clara. Nada de ello forma parte todavía de esta clonación.
