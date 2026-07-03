# Motion Detection Camera PRO - Fuente

Gist usado como fuente: `Juanmaes83/3a4c34db59ff75c3bd78fd4d4137dcd6`

Implementacion:

- Se replica el nucleo del `script.js` original de Jason Mayes:

```js
output = 0.5 * (255 - current) + 0.5 * previous
```

- Igual que el original:
  - hay un canvas fuente oculto.
  - hay un canvas final visible.
  - se alternan frames anteriores.
  - los pixeles quietos tienden a gris neutro.
  - los movimientos aparecen claros/oscuros segun diferencia.

Adaptacion tecnica declarada:

- Se usa `navigator.mediaDevices.getUserMedia` moderno en lugar de `navigator.getUserMedia`.
- Se anaden imagen/video como fuente para probar sin webcam.
- Se anade diagnostico movil y descarga PNG.
- La opcion `Persistencia visual` es mejora opcional; con valor 0 conserva el nucleo original.
