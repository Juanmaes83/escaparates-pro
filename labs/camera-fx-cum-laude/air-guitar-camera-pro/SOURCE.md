# Air Guitar Camera PRO

Fuente real usada:

- Gist: `Juanmaes83/7eb1cd2d4179a81e832da1236f5734dc`
- Descripcion original: `Webcam Air Guitar`
- Pen original citado: `https://codepen.io/kevinnewcombe/pen/QRZdYP`

Logica original conservada:

- TensorFlow + PoseNet.
- Deteccion de muneca/codo de rasgueo y muneca de traste.
- Dibujo de mastil virtual entre el cuerpo y la mano de traste.
- Deteccion de rasgueo por interseccion entre trayectoria de la pua y linea de cuerdas.
- Audio con Tone.js.
- Pitch controlado por posicion de la mano de traste.

Adaptaciones Escaparates Pro:

- Pagina aislada dentro de `labs/camera-fx-cum-laude`.
- Carga de librerias bajo demanda desde un boton del usuario.
- Arranque moderno con `navigator.mediaDevices.getUserMedia`.
- Audio desbloqueado desde gesto de usuario.
- Fallback sintetico si falla el sample remoto.
- Controles de sensibilidad, distorsion, volumen, espejo y camara frontal/trasera.
- Descarga PNG del resultado.
- Diagnostico visible para QA movil.
