# Tour Control Pass — resultado, en tres partes

Rama `claude/immersive-worlds-module-c0d3f7`. `master` intacto en `bdf4cd7`.

---

## PARTE 1 — Contrato y implementación · ✅ FUNCIONA

Commit `b9b6c37`, empujado.

**Qué estaba mal (medido, no supuesto).** El panel numeraba ①…⑪ sobre una lista
escrita a mano en `make-preview.mjs` que nadie derivaba del recorrido real. Esas
once insignias caían en las paradas **3, 4, 5, 6, 7, 9, 11, 12, 13, 15 y 16**. Las
paradas **1, 2, 8, 10, 14 y 17** no se podían alcanzar desde el panel. El recorrido
en sí nunca estuvo mal: **el diff del mundo son 21 líneas y no reordena nada**.

**Qué se hizo.** Una sola orden canónica —`route.chapterRefs → chapter.stepRefs`—
y todo lo demás derivado de ella: panel, numeración, siguiente/anterior, progreso y
los tests. Siete paradas canónicas sobre diecisiete beats.

| Prueba | Esperado | Observado | Resultado |
|---|---|---|---|
| Recorrido automático (G) | 01→02→03→04→05→06→07 | 01→02→03→04→05→06→07 | **PASA** |
| SIGUIENTE manual completo | 01→…→07 | 01→02→03→04→05→06→07 | **PASA** |
| ANTERIOR manual completo | 07→…→01 | 07→06→05→04→03→02→01 | **PASA** |
| 17 beats en orden | 17 | 17, sin huérfanos | **PASA** |
| Errores de consola | 0 | 0 | **PASA** |

Traza completa: `tour-trace.json`.

### Saltos directos — clasificación honesta

**Es RECONSTRUCCIÓN, no seek.** Medido:

| Salto | Dirección | Beats ejecutados | Llega |
|---|---|---|---|
| 02 → 07 | adelante | 15 | ✅ 07 |
| 07 → 03 | atrás | 6 (reinicia desde el beat 1) | ✅ 03 |
| 03 → 06 | adelante | 8 | ✅ 06 |
| 06 → 01 | atrás | 1 | ✅ 01 |
| 01 → 04 | adelante | 8 | ✅ 04 |

Hacia adelante ejecuta solo los beats intermedios. **Hacia atrás reinicia y repite
desde el principio** — ir de 07 a 03 cuesta lo mismo que llegar a 03 desde cero,
porque es literalmente lo que hace. Está dicho así en la UI y en el contrato; no se
disfraza de salto instantáneo.

---

## PARTE 2 — QA canónico · 🟡 EN CURSO, sin fallos

Base anterior: 48/48. Base nueva esperada: **60** (48 + 12 invariantes de recorrido).

En el momento de escribir esto: **43 comprobaciones, 43 verdes, 0 fallos**, incluidos
los doce nuevos:

```
ok  TOUR-ONE-START                            abre en el beat 0 (step.01-entrada)
ok  TOUR-ONE-END                              cierra en el beat 16 de 16
ok  TOUR-ORDER-UNIQUE                         7 pasos
ok  TOUR-ORDER-CONTIGUOUS                     1,2,3,4,5,6,7
ok  TOUR-IDS-UNIQUE                           7 identidades
ok  TOUR-NO-ORPHANS                           17 beats asignados
ok  TOUR-NEXT-PREV-CONSISTENT                 7 enlaces
ok  TOUR-NO-UNEXPECTED-CYCLES                 inicio.previous=—, fin.next=—
ok  TOUR-ALL-REACHABLE                        7/7 alcanzables desde el inicio
ok  TOUR-G-USES-CANONICAL-SEQUENCE            esperado 1→…→7 · observado 1→…→7
ok  TOUR-MANUAL-NEXT-USES-CANONICAL-SEQUENCE  observado 1→…→7
ok  TOUR-MANUAL-PREV-USES-CANONICAL-SEQUENCE  esperado 7→6→5→4 · observado 7→6→5→4
```

Faltan las fases finales (estados deterministas, rendimiento, móvil, segundo mundo,
autoría). Ninguna toca el recorrido y todas pasaban en la corrida anterior.

---

## PARTE 3 — QA visual del panel · 👉 PARA JUANMA

Esto lo haces tú más rápido que yo. Abre el preview y responde a diez preguntas.

### Lo que deberías ver

Panel abajo a la izquierda, en dos bloques separados por una línea:

```
VISITA GUIADA
[01 Bienvenida] [02 Horizonte interrumpido] [03 División tercera] [04 La cámara oscura]
[05 Noche de invierno] [06 Cuaderno de luz] [07 Cierre]
[← Anterior] [Reproducir desde aquí] [Siguiente →] [Salir del recorrido]  Parada 03 de 07 · beat 6/17

ESTADOS DE REVISIÓN / QA · FUERA DEL RECORRIDO
(chips con borde discontinuo, sin número)
```

### Las diez preguntas

1. ¿Se ve **al instante** cuál es la parada actual? (debe ir en blanco sólido invertido, no un hover sutil)
2. ¿Se entiende el orden sin leer código? (01…07, sin huecos)
3. ¿Están las paradas canónicas claramente numeradas?
4. ¿Se ve cuál es la siguiente? (borde más marcado)
5. ¿Se entiende lo ya completado? (✓ junto al número)
6. ¿Se distinguen las paradas futuras de las visitadas?
7. ¿Están los estados QA visualmente separados del recorrido?
8. ¿Se lee bien a tu tamaño de pantalla?
9. ¿Evita el desorden de los 21 chips iguales de antes?
10. ¿Da **más control** sin parecer una consola de desarrollador?

### Comprobaciones de comportamiento

- Pulsa **G**: debe recorrer 01→02→…→07 sin saltarse ninguna.
- Pulsa **Siguiente →** siete veces: mismo orden.
- Pulsa **← Anterior**: retrocede una parada. **Tarda unos segundos** — es la
  reconstrucción documentada, no un cuelgue.
- En la parada 01, **← Anterior** debe estar deshabilitado. En la 07, **Siguiente →**.
- El contador debe coincidir siempre con el chip resaltado.

### Si algo falla

Dime el número de pregunta y qué viste. No hace falta más.

---

## Limitación conocida, dicha en claro

Ir hacia atrás reconstruye desde el principio. Bajo renderizado por software son
segundos, no instantáneo. Es honesto —la UI dice reconstrucción, no salto— pero es
una limitación real, y arreglarla de verdad (una línea de tiempo con estado del mundo
guardado en cada beat) es trabajo mayor que la Constitución §16 ya aparca como
SHOULD LATER.
