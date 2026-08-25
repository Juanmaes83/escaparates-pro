# Samurai Katana — Armor Reveal Scroll Audit

Estado: `REVIEW / NEEDS_REBUILD / HIGH_VALUE`

## Fuente aprobada actual

Fuente revisada:

- Repo madre: `Juanmaes83/SAMURAI-KATANA-ALICANTE.`
- Carpeta fuente: `public/`
- Documento nuevo: `public/Prompts_SAMURAI.md`
- Código original: `_php_backup/main.original.js`, `_php_backup/style.original.css`, `_php_backup/index.php`

## Decisión estratégica corregida

El módulo no debe venderse como puzzle exacto.

El documento `Prompts_SAMURAI.md` define otra mecánica:

```text
0% - 15%     piezas fuera de pantalla + flotación
15% - 70%    atracción magnética hacia anchors visuales
70% - 85%    snap-to-grid / cierre visual
85% - 100%   crossfade de samurai1 + piezas hacia samurai2
100%         hold final
```

Por tanto, la dirección correcta es:

```text
Armor Reveal Scroll Studio PRO
```

No:

```text
Puzzle Assembly Studio PRO
```

## Por qué falló la versión anterior

La versión anterior intentaba comprobar si las piezas formaban matemáticamente `samurai2.png`.

Pero la fuente original no contiene coordenadas perfectas ni anclas precisas. Contiene offsets manuales y un crossfade final a `samurai2.png`.

El objetivo real no es encaje milimétrico. El objetivo real es:

```text
piezas dispersas → atracción visual → snap → revelado hero final
```

## Inventario de assets

Piezas principales:

- `samurai1.png` — base inicial.
- `samurai2.png` — revelado final / powered up.
- `helmet.png` — casco.
- `body.png` — cuerpo.
- `left_arm.png` — brazo usado en cards.
- `left_arm2.png` — brazo usado en física principal.
- `right_arm.png` — brazo derecho.
- `shoulders.png` — hombros.

## Reconstrucción aplicada

La pieza actual de la PR #74 ahora usa:

- repo madre como `baseUrl`: `https://raw.githubusercontent.com/Juanmaes83/SAMURAI-KATANA-ALICANTE./main/public/`;
- hero sticky 280vh, más cercano al prompt original de 250vh y lejos de los 500/620vh problemáticos;
- `samurai1.png` fijo como base;
- piezas con flotación inicial y atracción magnética;
- snap visual entre 70% y 85%;
- crossfade limpio a `samurai2.png` desde 85%;
- hold final para evitar sensación de vacío;
- panel real de Motion, Piezas, Marca y Proyecto;
- cards de armadura con `helmet`, `body`, `left_arm`, `shoulders`.

## Criterio de validación

No marcar `COMPLETE` hasta que Juanma valide en vídeo o pantalla:

1. que al inicio hay piezas separadas o energía de dispersión;
2. que la atracción se percibe durante el scroll;
3. que el snap no corta ni rompe la figura;
4. que el crossfade a `samurai2.png` es limpio;
5. que el samurái final no aparece cortado;
6. que no quedan tramos largos donde “no pasa nada”;
7. que el panel realmente permite ajustar motion y piezas.

## Estado

PR #74 sigue en `REVIEW / NEEDS_REBUILD`.

No conectar al Vault ni mergear hasta validación visual real.
