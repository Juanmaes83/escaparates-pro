# Premium Visual Mechanics — Roadmap

Fase 1 aprobada: crear un bloque separado dentro del Premium Vault para catalogar mecánicas visuales de alto valor sin multiplicar familias sueltas.

## Principio

Escaparates Pro no debe catalogar estas piezas por sector, sino por mecánica visual personalizable.

```
ENGINE != CONTENT != MEDIA
```

Cada entrada debe conservar su fuente, declarar su estado real y no marcarse como COMPLETE hasta tener web real + panel real + validación visual.

## Bloque Vault

Nombre del bloque:

```
PREMIUM VISUAL MECHANICS
```

## Mecánicas catalogadas

### 1. Cinematic Frame Sequence Studio PRO

Origen: `Juanmaes83/MCDONALDS`

Web de revisión fuente:

`https://raw.githack.com/Juanmaes83/MCDONALDS/main/index.html`

Mecánica:

```
scroll -> frames -> película interactiva
```

Estado inicial:

`SOURCE_READY`

Motivo: fuente localizada y mecánica clara. Pendiente Studio para controlar frames, poster, capítulos, velocidad, mobile y export/import.

### 2. Event Campaign Sequence Studio PRO

Origen: `Juanmaes83/WEBPEPSI`

Web de revisión fuente:

`https://juanmaes83.github.io/WEBPEPSI/`

Mecánica:

```
scroll -> evento/marca -> momentos de campaña
```

Estado inicial:

`SOURCE_READY`

Motivo: fuente localizada y navegable. Debe convertirse en motor de campaña/evento editable.

### 3. Enrollable Scroll Studio PRO

Origen: `Juanmaes83/Kaikaya-WEB`

Web de revisión fuente:

`https://juanmaes83.github.io/Kaikaya-WEB/`

Mecánica:

```
scroll -> desenrollar / revelar / desplegar
```

Estado inicial:

`PANEL_PENDING`

Motivo: efecto visual potente. Falta Studio para controlar tipo de rollo, textura, secciones, carta, reserva y CTA.

### 4. Puzzle Assembly Studio PRO

Origen: `Juanmaes83/samurai-katana-alicante-landing`

Web de revisión fuente:

`https://juanmaes83.github.io/samurai-katana-alicante-landing/`

Mecánica:

```
scroll -> piezas -> composición final
```

Estado inicial:

`NEEDS_REBUILD`

Motivo: la idea es muy potente, pero la ejecución debe mejorarse antes de declararla módulo final.

### 5. Editable Premium Portfolio Studio PRO

Origen: `Juanmaes83/PORTAFOLIOS-PREMIUM_RUBIK-SOTA`

Web de revisión fuente:

`https://juanmaes83.github.io/PORTAFOLIOS-PREMIUM_RUBIK-SOTA/`

Mecánica:

```
portfolio -> admin/panel -> showcase editable
```

Estado inicial:

`CLEANUP_PENDING`

Motivo: contiene patrón editable de portfolio, pero necesita limpieza, rebrand y revisión de dependencias externas.

## Orden de construcción recomendado

1. Cinematic Frame Sequence Studio PRO
2. Enrollable Scroll Studio PRO
3. Puzzle Assembly Studio PRO
4. Event Campaign Sequence Studio PRO
5. Editable Premium Portfolio Studio PRO

## Regla de avance

Cada mecánica debe avanzar de una en una:

1. Source Faithful
2. Studio PRO
3. Panel real
4. Vault REVIEW
5. Validación visual de Juanma
6. Merge
7. Sólo entonces valorar COMPLETE

## Restricciones

- No borrar entradas anteriores.
- No sustituir versiones originales.
- No marcar COMPLETE sin validación.
- No hacer merge sin aprobación explícita.
- No crear familias nuevas fuera del bloque si puede vivir dentro de Premium Visual Mechanics.
