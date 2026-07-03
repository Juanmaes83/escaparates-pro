# Webcam Pixelation PRO - Fuente

Gist usado como fuente: `Juanmaes83/287c0d20d162d4d1ba75448e6a675556`

Implementacion:

- Se replica la logica central del `script.js` original:
  - `settings` originales.
  - `width * 3 / 4`.
  - formula de `factor`, `width`, `height`, `xOffset`, `yOffset`.
  - conversion grayscale `0.299 / 0.587 / 0.114`.
  - cache `colorLookup`.
  - `createPixel` con brillo, contraste, alpha y radius.
  - pausa mediante `imageCache`.
  - descarga PNG.

Adaptacion tecnica declarada:

- No se usa RequireJS/Qoopido porque el objetivo de esta fase es que el efecto funcione como pagina aislada moderna en movil HTTPS.
- No se mezcla con otros efectos ni con el lab anterior.
- Se anade diagnostico visible para movil.
