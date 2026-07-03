# Glitch Camera PRO

Fuentes reales usadas:

- Gist: `Juanmaes83/a4096cb4a91b8a2b6ff71c8a7dc6c904`
- Descripcion original: `Glitch Camera`
- Pen original citado en el gist: `https://codepen.io/abergin/pen/LVGjWm`
- Repositorio fuente citado por el gist: `https://github.com/alexbergin/glitch-camera`

El `script.js` del gist disponible por API/raw queda incompleto en 32 KB y termina dentro del cargador RequireJS. Por eso se uso el repositorio fuente enlazado por el propio gist para leer la logica completa.

Logica original conservada:

- Captura de webcam en un canvas worker cuadrado de 512px.
- Conversion de cada frame a `image/jpeg`.
- Glitch por corrupcion controlada del string base64: intercambia caracteres aleatorios del payload, sin tocar el prefijo `data:image/jpeg`.
- Nivel de glitch equivalente a `glitchLevel * 20` iteraciones.
- Si un frame queda corrupto, se descarta y se mantiene el ultimo frame valido.
- Mantener pulsado para grabar hasta 3 segundos.
- Frames muestreados a baja frecuencia para construir un GIF.
- Estados de grabacion/procesado/resultado.

Adaptaciones Escaparates Pro:

- Pagina aislada dentro de `labs/camera-fx-cum-laude`.
- `navigator.mediaDevices.getUserMedia` moderno.
- Selector frontal/trasera.
- Descarga PNG adicional.
- Diagnostico visible para pruebas en movil.
- `gifshot` se carga bajo demanda al construir el GIF.
- No se mezcla con el index principal ni con otros efectos.
