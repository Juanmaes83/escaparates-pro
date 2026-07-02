# Escaparates Pro

Escaparates Pro es una plataforma visual para crear piezas inmersivas a partir de imagenes y videos, ajustar su movimiento, formato, branding y timing, y entregar al cliente un resultado final listo para publicar.

La idea principal es sencilla: el usuario trabaja dentro del editor, pero el cliente recibe solo la pieza final. Nunca debe recibir la herramienta de generacion con sus paneles, controles internos o seleccion de efectos editable.

## Que Se Puede Crear

Escaparates Pro permite crear:

- Heroes visuales para webs.
- Secciones animadas para paginas de cliente.
- Banners inmersivos.
- Loops para pantallas digitales.
- Piezas verticales para stories, reels y signage.
- GIFs y videos cortos para redes sociales.
- Embeds HTML/JS para integrar en webs externas.

## Conceptos Clave

### Editor

Es la interfaz de trabajo de Escaparates Pro. Incluye:

- Biblioteca de efectos.
- Panel de imagenes y videos.
- Controles de tamano, movimiento, timing, direccion y estilo.
- Overlay de branding.
- Timeline.
- Opciones de exportacion.

El editor es solo para crear y ajustar.

### Viewer Final

Es el resultado cerrado que se entrega o publica. Incluye:

- Solo el canvas/render final.
- Imagenes y videos congelados en la configuracion elegida.
- Ajustes aplicados.
- Overlay opcional ya integrado.
- Timing, direccion y loop aplicados.
- Formato responsive segun el preset elegido.

No incluye paneles, biblioteca de efectos ni controles de generacion.

### Exportar

Descarga el resultado final como archivo. Puede ser:

- Video WebM/MP4.
- GIF.
- Widget HTML.
- Script JS embebible.

### Publicar

Genera una URL local temporal para revisar el viewer final sin editor. Para una URL publica estable, el HTML/JS final debe subirse a un hosting, por ejemplo Vercel, Netlify, un servidor propio o la web del cliente.

### Copiar Embed

Genera un iframe final para pegar en una web. El iframe contiene el resultado cerrado, no el editor.

## Flujo Recomendado

1. Elegir una familia de efectos.
2. Seleccionar el efecto que mejor encaje con el objetivo.
3. Subir imagenes o videos en los slots de media.
4. Elegir formato de salida.
5. Ajustar tamano, movimiento, velocidad, direccion y timing.
6. Activar branding si el cliente lo necesita.
7. Revisar visualmente el resultado en local.
8. Exportar, publicar o copiar embed.
9. Validar que la salida final no contiene paneles de edicion.
10. Entregar el archivo, embed o URL final al cliente.

## Formatos De Salida

La plataforma incluye presets pensados para distintos canales.

### Web

- Hero 16:9.
- Hero 21:9.
- Full-width.
- Seccion web.

Uso recomendado: cabeceras de paginas, bloques visuales premium, landings, secciones de producto, portfolios, experiencias de marca.

### Redes Sociales

- 9:16 para stories y reels.
- 1:1 para posts cuadrados.
- 4:5 para posts verticales.
- 3:4 para composiciones editoriales.

Uso recomendado: clips cortos, loops de marca, piezas promocionales, contenido de portfolio y anuncios visuales.

### Pantallas

- 16:9 horizontal.
- Vertical signage.
- Loop continuo.

Uso recomendado: escaparates fisicos, pantallas en tienda, recepcion, eventos, ferias, museos y espacios comerciales.

## Controles Globales

Los efectos comparten una base de controles para que el usuario no tenga que aprender cada efecto desde cero.

### Output Size

Controla el tamano final del objeto, cards, composicion o sistema visual. Permite ampliar hasta x8 cuando el efecto lo soporta visualmente.

En efectos planos, cards y grids, el escalado es directo. En efectos 3D, tuneles, esferas y particulas, la plataforma tambien compensa camara, encuadre o distancia para evitar recortes.

### Motion Enabled

Activa o desactiva el movimiento principal del efecto.

Cuando esta desactivado, la pieza se mantiene en un punto visual estable.

### Motion Speed

Controla la velocidad del movimiento.

Sirve para crear piezas mas calmadas, loops lentos para pantallas, o efectos mas rapidos para redes sociales.

### Motion Direction

Permite cambiar la direccion del movimiento cuando el efecto lo permite.

Opciones comunes:

- Auto / Original.
- Izquierda a derecha.
- Derecha a izquierda.
- Arriba a abajo.
- Abajo a arriba.
- Entrada radial.
- Salida radial.

En efectos no lineales, la direccion se interpreta segun la familia: camara, fase, flujo, orbita, radio o progresion temporal.

### Record Default Motion

Define si la exportacion debe grabar el movimiento por defecto o generar una salida estatica/controlada.

Es util cuando se quiere revisar una composicion fija, preparar un hero pausado o evitar que el movimiento sea obligatorio en determinados soportes.

### Timing

Controla la duracion del loop. Es importante para que una pieza encaje en:

- Stories cortas.
- Banners web.
- Loops de pantalla.
- Clips promocionales.

### Overlay Branding

Permite anadir:

- Headline.
- CTA.
- Color.
- Tamano de texto.
- Logo.
- Posicion del logo.

El overlay se aplica al resultado final exportado.

## Familias De Efectos

La biblioteca esta organizada por familias. Cada familia responde a una necesidad visual distinta.

### 3D & Perspective

Efectos con camara, profundidad, orbita, tuneles, cubos, cilindros, esferas, muros y recorridos espaciales.

Usar cuando se busca una pieza inmersiva, premium, con sensacion cinematica o 3D real.

Efectos disponibles:

- 3D Card Flip.
- 3D Globe Gallery.
- 3D Isometric Gallery.
- 3D Model Marquee Gallery.
- 3D Photo Cube.
- 3D Room Mapping.
- 3D Snow & Wind.
- 3D Spatial Gallery.
- A Horde of 25k Spaceships PRO.
- Card Totem.
- Cinematic Dolly Zoom.
- Contour Effect 3D Pro.
- Cylindrix Belt.
- Data Tunnel.
- Delphi Infinite Tunnel.
- Digital Tokamak Tunnel.
- Extruded Tube with Holes.
- Fan Carousel.
- Fibonacci Sphere.
- Film Strip.
- Flywheel Gallery.
- Glassy Cube.
- Immersive Layers Pro.
- Infinite Depth Tunnel.
- Infinite Drift.
- Infinite Scroll Circular Gallery PRO.
- Infinite Zoom Tunnel.
- Infinitor Tunnel.
- Kaleidoscope.
- Kinetic Grid.
- Libros 3D.
- Logos on a Skirt.
- Marquee Tunnel.
- Multiorbix Gallery.
- Ocean Scene.
- Onion Depth.
- Orbit Carousel.
- Orbix Ring.
- Page Reveal 3D.
- Parallax Wall.
- Peel Me Panel.
- Photo Cube V2.
- Pixel Forms 3D.
- Polygon Wall.
- Rotating Strips Panel.
- Showcase Stream.
- Sphere Gallery.
- Sphere Projection.
- Spiral Carousel.
- Stained Glass.
- Starfield.
- UMBRAL 3D Scene.
- Video in 3D Form.
- Video Visualizer 3D Pro.
- Visual Stream Pro.
- Year Cylinder Gallery PRO.
- Zoom Immersion.

### Carousel & Flow

Efectos de recorrido, flujo, carrusel, marquee y movimiento continuo de cards.

Usar cuando se quiere mostrar muchas imagenes de forma elegante, mantener ritmo comercial o crear una secuencia facil de entender.

Efectos disponibles:

- Carousel Flow.
- Column Drift.
- Cylinder Carousel.
- Infinite Scroll Gallery.
- Mechanical Impact Cards PRO.
- Photo Orbit.
- Ring Carousel 3D.
- Ticker Loop.
- Wheel Carousel.

### Grid

Efectos de mosaico, reticula, moodboard y composiciones multi-card.

Usar cuando el cliente tiene muchas imagenes y necesita comparacion, variedad o una sensacion editorial.

Efectos disponibles:

- 3D Rising Cell Grid.
- Concave Gallery.
- Fashion Grid.
- Flip Grid.
- Grid Reveal.
- Hex Prism Field PRO.
- Infinite Moodboard.
- Spotlight Zoom.

### Stack & Scatter

Efectos de apilado, dispersion, caida, estela y composiciones tipo cartas o polaroids.

Usar cuando se busca energia, gesto fisico, dinamismo o una presentacion menos rigida.

Efectos disponibles:

- Cascade Drop.
- Image Trail.
- Polaroid Scatter.
- Position Dance.
- Poster Burst.
- Stack Slide.

### Spotlight & Focus

Efectos que dan protagonismo a una imagen o grupo de imagenes cada vez.

Usar cuando el cliente quiere destacar producto, campaña, modelo, inmueble o servicio por turnos.

Efectos disponibles:

- Center Stage.
- Deck Peel.
- Focus Shift.
- Gooey Text.
- Zoom Parallax.

### Reveal & Wipe

Transiciones de revelado, cortina, mascara, glitch, morph, liquido, portal y disolucion.

Usar cuando la pieza debe contar una transformacion entre estados o mostrar antes/despues, colecciones, fases o cambios.

Efectos disponibles:

- 3D Image Tile Transition.
- Burn Transition.
- Camera Shutter.
- Ciclo 3D Metamorfosis.
- Ciclo 3D Metamorfosis PRO.
- Curtain Reveal.
- Diagonal Wipe.
- Double Dissolve.
- Galeria con Mascara Radial.
- Glitch Transition.
- Liquid Displacement.
- Liquid Morph.
- Morph Gallery.
- Neon Accordion.
- Portal Transition.
- Reveal Mosaic.
- Split Reveal.
- Split Screen Wipe.
- Stripe Reveal.
- Theater Curtain.

### Glassmorphism

Efectos de cristal, refraccion, neon, holografia y brillo premium.

Usar cuando se busca una estetica moderna, tecnologica, lujo visual o presentacion de marca.

Efectos disponibles:

- Chromatic Prism Split.
- Glass Shader Pro.
- Glass Showcase.
- Glassmorphism Cards.
- Holographic Card.
- Neon Glow Carousel.

### Parallax

Efectos de profundidad por capas, muros, stories, skybox y recorridos tipo galeria.

Usar cuando se quiere sensacion espacial sin que el usuario necesite entender una escena 3D compleja.

Efectos disponibles:

- Gallery Walk.
- Parallax Card Stack.
- Parallax Depth Layers.
- Parallax Scroll Story.
- Parallax Skybox.
- Parallax Wall.

### Motion

Efectos de particulas, fisica, dither, deformacion, agua, arena, viento, ASCII y filtros animados.

Usar cuando se busca una pieza experimental, viral, organica, tecnologica o muy expresiva.

Efectos disponibles:

- Before/After Stream.
- Cloth Wind.
- Dithering Filter.
- Floating Cloud.
- Gravity Fall Cards.
- Gravity Well.
- Halftone Effect.
- Image Warp Pro.
- Jelly Physics.
- Media Blinds PRO.
- Particle Dissolve.
- Particle Swarm Formation.
- Particles Brightness Gamma.
- Photo Particles Flow.
- Sand Dissolve.
- Shattered Glass.
- Spiral Vortex.
- Squiggle Deformer.
- SVG Filter Animation.
- Video Dither ASCII Pro.
- Water Distortion.

## Efectos Similares Y Como Elegir

### Carrusel, Flow Y Marquee

Usar Carousel Flow cuando se quiera un carrusel claro y comercial.

Usar Ticker Loop cuando se quiera movimiento continuo tipo cinta publicitaria.

Usar Mechanical Impact Cards PRO cuando se quiera un movimiento mas divertido, mecanico y con choque entre tarjetas.

Usar Ring Carousel 3D o Cylinder Carousel cuando el cliente quiera profundidad y rotacion 3D.

### Tuneles Y Profundidad

Usar Infinite Depth Tunnel, Delphi Infinite Tunnel o Digital Tokamak Tunnel cuando se quiera una experiencia inmersiva de entrada.

Usar Infinite Zoom Tunnel o Zoom Immersion cuando el efecto principal deba ser avanzar hacia dentro.

Usar Marquee Tunnel o Data Tunnel cuando se quiera un tono mas digital, tecnologico o de datos.

### Grids Y Moodboards

Usar Grid Reveal cuando se quiera algo simple y limpio.

Usar Infinite Moodboard cuando haya muchas imagenes y se busque una sensacion infinita.

Usar Fashion Grid cuando se quiera una experiencia editorial con zoom y exploracion.

Usar Concave Gallery cuando se quiera un mosaico con lente o distorsion visual.

### Reveals Y Transiciones

Usar Diagonal Wipe, Stripe Reveal o Split Reveal para transiciones limpias.

Usar Liquid Morph, Liquid Displacement o Morph Gallery para transiciones organicas.

Usar Glitch Transition para una estetica digital.

Usar Camera Shutter o Theater Curtain para una entrada cinematica.

### Particulas Y Shaders

Usar Particles Brightness Gamma cuando se quiera brillo y particulas alrededor de una imagen.

Usar Particle Dissolve, Sand Dissolve o Particle Swarm Formation cuando se quiera construir o destruir la imagen.

Usar Image Warp Pro, Water Distortion o Squiggle Deformer cuando se quiera deformacion fluida.

Usar Video Dither ASCII Pro o Dithering Filter cuando se quiera estetica retro, tecnica o experimental.

## Medios Soportados

La plataforma trabaja con slots de media para imagenes y videos.

Cada efecto puede decidir cuantos slots usa realmente, pero la herramienta ofrece hasta 15 slots para preparar composiciones amplias.

Recomendaciones:

- Usar imagenes con buena resolucion.
- Evitar imagenes demasiado oscuras si el efecto ya usa sombras o profundidad.
- Probar videos cortos y optimizados.
- Para redes sociales, preparar recursos verticales cuando el preset sea 9:16.
- Para heroes web, usar recursos horizontales o composiciones que toleren recorte lateral.

## Iluminacion, Bloom Y Oscurecimiento

Algunos efectos 3D y shaders pueden usar luces, bloom, vignette, materiales glass o blending. Si estos ajustes se aplican por defecto de forma agresiva, las imagenes pueden verse oscuras, quemadas o con bajo contraste.

Regla de producto:

- La imagen o video del cliente debe verse natural por defecto.
- Bloom, gamma, vignette, tintes y oscurecimiento deben ser opcionales.
- Ningun efecto debe oscurecer todas las imagenes por defecto.
- Si un efecto necesita ambiente dramatico, debe ofrecer control para ajustarlo.

## Exportacion Final

El cliente debe recibir un resultado final, no el editor.

### Video

Exporta un clip animado para redes, pantallas o presentaciones.

### GIF

Exporta una version ligera para previews, banners o mensajes rapidos.

### Widget HTML

Genera un archivo HTML autonomo con el efecto activo y los medios embebidos.

### Script JS

Genera un script que inserta un iframe final en la web del cliente.

### Copiar Embed

Copia un iframe final listo para pegar en una pagina.

### Publicar Resultado

Genera una URL local temporal para revisar el viewer final. Para publicar en internet, se debe subir la salida final a hosting.

## Como Insertar En Una Web De Cliente

Flujo recomendado:

1. Crear la pieza en Escaparates Pro.
2. Elegir formato web, por ejemplo Hero 16:9, Hero 21:9 o Full-width.
3. Revisar que el resultado se vea bien en desktop y movil.
4. Usar Copiar embed o descargar JS/HTML.
5. Insertar en la seccion correspondiente de la web.
6. Validar que no aparecen paneles del editor.
7. Comprobar performance y autoplay de video si aplica.

## Como Exportar Para RRSS

1. Elegir preset 9:16, 1:1, 4:5 o 3:4.
2. Ajustar Output Size para llenar bien el formato.
3. Ajustar Motion Speed y Loop duration.
4. Activar Record Default Motion si se quiere animacion.
5. Exportar Video o GIF.
6. Revisar el resultado antes de publicarlo.

## Como Exportar Para Pantallas

1. Elegir Pantalla 16:9, Vertical signage o Loop continuo.
2. Usar Motion Speed moderado.
3. Evitar textos pequenos.
4. Probar desde lejos si se usara en tienda o evento.
5. Exportar video o HTML segun el sistema de reproduccion.
6. Validar que el loop no tenga cortes bruscos.

## Checklist De QA Antes De Entregar

Antes de entregar una pieza a cliente, comprobar:

- El efecto correcto esta seleccionado.
- Las imagenes o videos son los definitivos.
- El formato de salida es el correcto.
- Output Size no recorta contenido importante.
- Motion Enabled y Motion Speed estan como quiere el cliente.
- Motion Direction tiene sentido para el efecto.
- Record Default Motion esta configurado segun la salida deseada.
- El overlay de branding no tapa contenido importante.
- El texto se lee en desktop, movil y pantalla.
- El export final no muestra paneles del editor.
- El HTML/JS final funciona fuera del editor.
- El video/GIF tiene la duracion correcta.
- La pieza no oscurece ni quema las imagenes.
- En loops, el reinicio no se nota demasiado.

## Limitaciones Conocidas

- Publicar resultado genera una URL local temporal para revision; una URL publica estable requiere hosting.
- Algunos efectos 3D muy complejos pueden necesitar ajuste fino de camara, radio o separacion cuando Output Size se acerca a x8.
- Los navegadores pueden limitar autoplay de video con sonido; los videos embebidos deben funcionar mejor en mute/loop.
- Las piezas con muchos videos o particulas pueden exigir mas GPU.
- Algunas salidas deben revisarse manualmente en el dispositivo final, especialmente pantallas verticales y escaparates fisicos.

## Desarrollo Local

Este proyecto es una aplicacion web estatica. Para probarla localmente se puede servir la carpeta del repositorio con un servidor estatico.

Ejemplo:

```bash
npx serve -l 8897 .
```

Despues abrir:

```text
http://127.0.0.1:8897/
```

## Estructura General

```text
index.html
css/
js/
  app.js
  core.js
  export.js
  media-manager.js
  output-presets.js
  overlay.js
  timeline.js
  ui.js
  effects/
    base.js
    registry.js
    3d-perspective/
    carousel-flow/
    grid/
    stack-scatter/
    spotlight-focus/
    reveal-wipe/
    glassmorphism/
    parallax/
    motion/
assets/
outputs/
```

## Principio De Producto

Escaparates Pro no vende el panel de generacion. Vende el resultado final.

La experiencia interna puede ser flexible, editable y potente. La entrega al cliente debe ser clara, cerrada, limpia y lista para publicar.
