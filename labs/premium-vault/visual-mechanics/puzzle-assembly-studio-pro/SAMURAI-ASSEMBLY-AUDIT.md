# Samurai Katana — Puzzle Assembly Audit

Estado: `NEEDS_REBUILD / HIGH_VALUE`

Fuente revisada:

- Repo: `Juanmaes83/samurai-katana-alicante-landing`
- Repo adicional localizado: `Juanmaes83/SAMURAI-KATANA-ALICANTE.`
- Web fuente: `https://juanmaes83.github.io/samurai-katana-alicante-landing/`
- Assets reales: `assets/images/` / `public/`

## Decisión estratégica actual

La estrategia correcta no es empezar dispersando piezas.

La estrategia correcta es:

```text
1. Resolver primero el Estado B: samurái perfectamente ensamblado.
2. Usar `samurai2.png` como referencia visual final.
3. Colocar las piezas encima hasta comprobar si comparten canvas lógico.
4. Sólo después diseñar Estado A: desorden bello / piezas dispersas.
5. Finalmente invertir el viaje: A → B.
```

Frase de trabajo:

```text
Primero construimos el orden perfecto. Luego lo descomponemos. Luego invertimos el recorrido.
```

## 1. Inventario de piezas

Piezas localizadas en la fuente:

- `samurai1.png` — base inicial.
- `samurai2.png` — referencia final / upgraded. Es el Estado B candidato.
- `helmet.png` — casco.
- `body.png` — cuerpo.
- `left_arm.png` — brazo usado en cards estáticas.
- `left_arm2.png` — brazo usado en física principal.
- `right_arm.png` — brazo derecho.
- `shoulders.png` — hombros.

## 2. Hallazgo importante

`samurai2.png` aparece como imagen final en más de una fuente Samurai. Debe tratarse como la referencia maestra inicial para el Estado B.

La nueva calibración arranca con:

- modo `calibrate-final`;
- progreso fijo al `100%`;
- `samurai2.png` visible como referencia semitransparente;
- piezas reales colocadas encima;
- X/Y/scale/rotation finales editables.

## 3. Problema anterior de composición final

La fuente previa usaba offsets manuales en JS:

- casco: `targetY = -80`, `scale = 0.85`.
- cuerpo: `targetY = 330`, `scale = 1.25`.
- hombros: `targetY = 80`, `scale = 0.95`.
- brazo derecho: `targetX = -100`, `targetY = 360`.
- brazo izquierdo: `targetX = 150`, `targetY = 280`.

Eso explicaba que el ensamblaje se sintiera aproximado y no perfectamente encajado.

## 4. Nueva hipótesis técnica

Es probable que algunas piezas compartan canvas transparente con `samurai2.png`.

Por eso la nueva calibración prueba primero una hipótesis limpia:

```text
x = 0
y = 0
scale = 1
rotation = 0
```

para todas las piezas.

Si las piezas fueron exportadas desde el mismo canvas, deberían encajar mucho mejor que con offsets manuales.

## 5. Qué se considera validación de Estado B

Estado B sólo se considerará válido cuando:

1. las piezas coincidan visualmente con `samurai2.png`;
2. no haya doble figura evidente;
3. no haya brazos/casco/hombros flotando fuera;
4. el z-index respete la figura final;
5. el panel permita corregir pieza por pieza;
6. Juanma valide con vídeo/pantallazo.

## 6. Qué viene después

Cuando Estado B sea correcto:

```text
Estado B perfecto
↓
Crear Estado A disperso pero bello
↓
Interpolar A → B
↓
Añadir snap final
↓
Validar web real + panel real
↓
Sólo entonces conectar al Vault y valorar merge
```

## Decisión técnica

`Puzzle Assembly Studio PRO` sigue en `REVIEW / NEEDS_REBUILD`.

No marcar como `COMPLETE` hasta validar:

1. web real;
2. panel real;
3. Estado B perfecto;
4. Estado A diseñado;
5. transición A → B visualmente clara;
6. persistencia/export/import;
7. revisión visual de Juanma.
