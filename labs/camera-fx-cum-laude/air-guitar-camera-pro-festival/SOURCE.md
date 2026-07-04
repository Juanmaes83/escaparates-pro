# Air Guitar Camera PRO Festival

Fuentes reales usadas como base:

- `Juanmaes83/7eb1cd2d4179a81e832da1236f5734dc` - Webcam Air Guitar original.
- `Jeffrey-Luszcz/videotheremin` - MediaPipe Hands + Web Audio API, MIT.

Decision tecnica:

- Se crea una carpeta nueva para no romper la version anterior.
- La deteccion pasa a MediaPipe Hands, siguiendo el patron de `videotheremin`.
- El audio usa Web Audio API local, sin depender de samples remotos.
- Se mantiene el objetivo Air Guitar: una mano controla mastil/acorde y la otra rasguea.
- Se anade capa comercial Escaparates Pro: semaforo, coach, juego de 30 segundos, combo, ranking, branding y descarga PNG.

No es copia byte a byte:

- Es una reconstruccion funcional apoyada en codigo real de referencia.
- Se adapta a experiencia de festival y a QA movil.
- La version anterior queda intacta para comparacion.
