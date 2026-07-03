# Red Light Green Light Camera PRO

Fuente real usada como referencia:

- Gist: `Juanmaes83/dde6ea5e8fb2232e641b1078f03abebf`
- Descripcion original: `Red Light, Green Light - Squid Game`
- Pen original citado dentro del gist: `https://codepen.io/Mamboleoo/pen/abydvaG`

Lo que se conserva del codigo original:

- Deteccion de cara con `pico.js`.
- Cascade `facefinder` de Nenad Markus.
- Reglas centrales del juego:
  - En verde, el movimiento de la cabeza suma distancia.
  - En rojo, el movimiento de la cabeza llena el contador de peligro.
  - Victoria al llegar a 100 metros.
  - Derrota por exceso de movimiento o timeout.
- Constantes principales: `MAX_TIME = 60`, `FINISH_DISTANCE = 100`, `IN_GAME_MAX_DISTANCE = 4000`, `MAX_MOVEMENT = 180`.
- Modelo, fondo y audios externos del gist como assets remotos originales.

Adaptaciones hechas para Escaparates Pro:

- Pagina aislada dentro de `labs/camera-fx-cum-laude`.
- Arranque compatible con HTTPS/GitHub Pages usando `navigator.mediaDevices.getUserMedia`.
- Diagnostico visible para movil.
- Descarga PNG del resultado.
- Fallback visual si el modelo GLTF externo no carga.
- Sensibilidad roja configurable sin alterar la mecanica principal.
