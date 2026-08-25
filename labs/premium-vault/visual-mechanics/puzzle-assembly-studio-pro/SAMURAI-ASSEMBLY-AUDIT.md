# Samurai Katana — Puzzle Assembly Audit

Estado: `NEEDS_REBUILD / HIGH_VALUE`

Fuente revisada:

- Repo: `Juanmaes83/samurai-katana-alicante-landing`
- Web: `https://juanmaes83.github.io/samurai-katana-alicante-landing/`
- Assets reales: `assets/images/`

## 1. Inventario de piezas

Piezas localizadas en la fuente:

- `samurai1.png` — base inicial.
- `samurai2.png` — referencia final / upgraded.
- `helmet.png` — casco.
- `body.png` — cuerpo.
- `left_arm.png` — brazo usado en cards estáticas.
- `left_arm2.png` — brazo usado en física principal.
- `right_arm.png` — brazo derecho.
- `shoulders.png` — hombros.

## 2. Problema de composición final

La fuente actual no usa una plantilla final exacta por coordenadas comunes. Usa offsets manuales en JS:

- casco: `targetY = -80`, `scale = 0.85`.
- cuerpo: `targetY = 330`, `scale = 1.25`.
- hombros: `targetY = 80`, `scale = 0.95`.
- brazo derecho: `targetX = -100`, `targetY = 360`.
- brazo izquierdo: `targetX = 150`, `targetY = 280`.

Esto explica que el ensamblaje se sienta aproximado y no perfectamente encajado.

## 3. Trayectorias actuales

Las piezas entran desde posiciones agresivas:

- casco desde arriba.
- cuerpo desde abajo.
- hombros desde arriba.
- brazos desde laterales.

La fuente interpola con easing, opacidad y rotación hacia cero, pero no tiene:

- snap final real;
- anclas por pieza;
- blueprint/ghost final;
- tolerancia de encaje;
- panel de calibración.

## 4. Relación con scroll

El hero ocupa una altura larga y el progreso de scroll mueve las piezas. La transición a `samurai2.png` se usa como cierre visual, pero puede ocultar que las piezas no encajan exactamente.

## 5. Diagnóstico visual

Problema central:

```text
Las piezas no ensamblan desde un sistema común de coordenadas.
```

La solución no es copiar el módulo original tal cual. La solución es crear un laboratorio de ensamblaje con:

- ghost final;
- pieza base;
- posiciones finales editables;
- escala final por pieza;
- rotación final;
- z-index;
- entrada por scroll;
- snap strength;
- stop-motion intensity;
- export/import JSON.

## Decisión técnica

Crear `Puzzle Assembly Studio PRO` como reconstrucción visual controlada.

No marcar como `COMPLETE` hasta validar:

1. web real;
2. panel real;
3. ghost/reference visible;
4. piezas encajando bien;
5. persistencia/export/import;
6. revisión visual de Juanma.
