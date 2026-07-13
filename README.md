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

## Website Modules Lab

Website Modules Lab es un modo independiente para probar, personalizar y exportar secciones web cinematograficas. No usa el motor Three.js de efectos, no toca Scroll Sections y no carga los 30 modulos de golpe en `index.html`.

La version actual incluye 25 modulos premium. Veintitres estan adaptados desde `cinematic-site-components`; Image Cloud Canvas PRO y RGB Motion Triptych PRO son implementaciones independientes inspiradas en interacciones publicas analizadas:

- Text Mask Reveal.
- Sticky Stack Narrative.
- Layered Zoom Parallax.
- Horizontal Scroll Hijack.
- Cursor Reactive CTA.
- Cursor Reveal Showcase.
- Accordion Story Slider.
- Split Scroll Narrative.
- Image Trail Campaign.
- Flip Cards Product Grid.
- Coverflow Carousel PRO.
- Sticky Card Stack PRO.
- Kinetic Marquee PRO.
- Text Scramble Decode PRO.
- View Transition Morph PRO.
- Curtain Reveal Campaign PRO.
- Magnetic Grid Showcase PRO.
- Mesh Gradient Atmosphere PRO.
- Glitch Campaign System PRO.
- Particle CTA Celebration PRO.
- Image Cloud Canvas PRO.
- Drag Pan Editorial Gallery PRO.
- Chromatic Brand Universe PRO.
- Brand Line Manifesto PRO.
- RGB Motion Triptych PRO.

Cada modulo se renderiza en un iframe aislado, con controles de headline, subtitle, CTA, URL, colores, fuente, branding textual, velocidad, intensidad, scroll length y media de fondo desde los slots de la plataforma.

El segundo bloque suma comparadores before/after, spotlight reveal, acordeones horizontales/verticales, split scroll de columnas opuestas, estelas de imagen/video por cursor y cartas 3D con anverso/reverso. Todos deben exportarse como viewer final cerrado, con fallback movil y sin paneles de edicion.

El tercer bloque suma carrusel coverflow 3D, cards sticky apiladas por scroll, bandas kinetic marquee reactivas, decode de texto con contadores y morph de cards de producto a detalle. Mantiene el mismo contrato: iframe aislado, personalizacion desde panel, media imagen/video y export final cerrado.

El cuarto bloque convierte cinco interacciones visuales en piezas de campana: una apertura de cortina con replay, una galeria magnetica con fallback tactil, una atmosfera mesh de canvas ligera, un sistema glitch controlado y una CTA que recompensa cada accion con particulas. Todas aceptan branding, colores, texto y media imagen/video del panel.

El quinto bloque suma navegacion espacial, narrativa cromatica y manifiestos de marca: nube 3D con inercia y zoom, canvas editorial de arrastre, cinco capitulos de color por scroll y una linea SVG que dibuja el recorrido de una marca. Los cuatro son viewers aislados, con media imagen/video y salida final sin editor.

RGB Motion Triptych PRO convierte uno o tres assets de imagen/video en capas RGB sincronizadas que se separan con cursor o gesto tactil. Es una implementacion independiente del patron de interaccion, no exporta ni depende de los videos de la referencia.

Exporta resultado final como HTML standalone, ZIP basico y embed iframe. Los modulos adaptados desde `cinematic-site-components` conservan su atribucion MIT; los modulos independientes identifican su referencia sin exportar assets ajenos.

## Sector Website Blueprints

Sector Website Blueprints es un modo separado para construir webs completas de campana o ecommerce dentro de un iframe aislado. El panel conserva los controles comunes de marca, titular, narrativa, CTA, URL, color y media; el resultado exportado es una web final cerrada, sin paneles de Escaparates Pro.

Plantillas aprobadas en esta tanda:

- **Retail Product Launch PRO**: lanzamiento de producto con hero, coleccion, filtros, fichas, bolsa lateral e historia de marca.
- **Fashion Lookbook PRO**: lookbook editorial con cambio de looks, menu, busqueda, filtros, wishlist, vista rapida, tallas, bolsa, manifiesto y newsletter.

Los assets de los slots se reutilizan en hero, galeria y fichas; cuando el slot contiene video, el viewer usa video en lugar de una imagen. El catalogo tambien contiene tres conceptos piloto (turismo, inmobiliaria y eventos) que no deben promocionarse como plantillas premium terminadas hasta su adaptacion completa y su revision visual.

## Nuevas Piezas Aprobadas

- **Captured Panels Narrative PRO** en Scroll Sections: composicion narrativa de cinco paneles con imagen o video, navegacion por indice, lectura sticky en escritorio y secuencia accesible en movil.
- **Ping Pong Feedback PRO**: shader con buffers de feedback reales, fuente de imagen/video, refraccion hexagonal, deriva y separacion cromatica.
- **Reflective City PRO**: ciudad procedural raymarched con edificios, calles, profundidad y reflejos; no utiliza media porque el motivo es generativo.

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
- Cyberspace Portal. [FASE C]
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
- Parametric Surface. [FASE C]
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
- Reverse Columns. [FASE C]
- Ring Carousel 3D.
- Swaying Gallery. [FASE C]
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
- Blob Reveal.
- Burn Transition.
- Camera Shutter.
- Chroma Grid. [FASE C]
- Ciclo 3D Metamorfosis.
- Ciclo 3D Metamorfosis PRO.
- Cinematic Zoom. [FASE C]
- Curtain Reveal.
- Diagonal Wipe.
- Double Dissolve.
- Galeria con Mascara Radial.
- Glitch Transition.
- Ink Burst.
- Liquid Displacement.
- Liquid Morph.
- Morph Gallery.
- Neon Accordion.
- Portal Transition.
- Reveal Mosaic.
- Split Compare. [FASE C]
- Split Reveal.
- Split Screen Wipe.
- Stripe Reveal.
- Theater Curtain.
- Virtual Tour.
- Zoom Blur Bokeh.

### Glassmorphism

Efectos de cristal, refraccion, neon, holografia y brillo premium.

Usar cuando se busca una estetica moderna, tecnologica, lujo visual o presentacion de marca.

Efectos disponibles:

- Chromatic Prism Split.
- Glass Shader Pro.
- Glass Showcase.
- Glassmorphism Cards.
- Holographic Card.
- Liquid Glass Text. [FASE C]
- Neon Glow Carousel.
- Stained Glass. [FASE C]

### Parallax

Efectos de profundidad por capas, muros, stories, skybox y recorridos tipo galeria.

Usar cuando se quiere sensacion espacial sin que el usuario necesite entender una escena 3D compleja.

Efectos disponibles:

- Gallery Walk.
- Parallax Card Stack.
- Parallax Depth Layers.
- Parallax Multicapa. [FASE C]
- Parallax Scroll Story.
- Parallax Skybox.
- Parallax Wall.

### Motion

Efectos de particulas, fisica, dither, deformacion, agua, arena, viento, ASCII, EQ, hexagonos y filtros animados.

Usar cuando se busca una pieza experimental, viral, organica, tecnologica o muy expresiva.

Efectos disponibles:

- Audio EQ Visualizer. [FASE C]
- Before/After Stream.
- Cloth Wind.
- Dithering Filter.
- Dots Pattern. [FASE C]
- Floating Cloud.
- Gravity Fall Cards.
- Gravity Well.
- Halftone Effect.
- Hex Video Grid. [FASE C]
- Image Warp Pro.
- Jelly Physics.
- Media Blinds PRO.
- Particle Dissolve.
- Particle Swarm Formation.
- Particles Brightness Gamma.
- Photo Particles Flow.
- RGB Dancer. [FASE C]
- Sand Dissolve.
- Shattered Glass.
- Spiral Vortex.
- Squiggle Deformer.
- SVG Filter Animation.
- Video ASCII Art. [FASE C]
- Video Dither ASCII Pro.
- Water Distortion.

### Text FX

Efectos de texto con neón, glitch, tipografia cinetica, temporizadores circulares y orbitas de caracteres.

Usar cuando el texto es el protagonista o se quiere combinar imagen con tipografia animada de alto impacto.

Efectos disponibles:

- Circular Timer. [FASE C]
- Flip Title 3D.
- Glitch Title.
- Kinetic Text.
- Neon Glow Text.
- Neon Pulse Glow. [FASE C]
- Polar Spiral Text. [FASE C]
- Scramble Text.
- Split Word Reveal.
- Text Morph.
- Type Writer.

### Gravity

Efectos de fisica gravitacional: confeti, pendulos, olas y objetos en gravedad cero.

Efectos disponibles:

- Confetti 3D. [FASE C]
- Gravity Wave.
- Pendulum Swing.
- Wrecking Ball.
- Zero Gravity. [FASE C]

### Field

Efectos de campo visual: arco electrico, campo magnetico y ruido en capas.

Efectos disponibles:

- Electric Arc.
- Force Field.
- Layered Noise. [FASE C]
- Magnetic Poles.

### Flicker

Efectos de parpadeo, glitch de canal, VHS, cine noir y neon intermitente.

Efectos disponibles:

- Film Noir.
- Glitch RGB. [FASE C]
- Glitch Storm.
- Neon Flicker.
- Old TV.

### Orbit

Efectos de sistema solar, icosaedros con luces, anillos planetarios y satelites en orbita.

Efectos disponibles:

- Comet Trail.
- Icosahedron Lights. [FASE C]
- Planetary Rings.
- Satellite Spin.
- Solar System. [FASE C]

### Proximity

Efectos reactivos al cursor: bloom de proximidad, ripple tactil y spotlight seguidor.

Efectos disponibles:

- Proximity Bloom.
- Ripple Touch.
- Spotlight Follow.

### Shader Premium

Efectos basados en GLSL con mecanicas procedurales avanzadas.

Usar para piezas de marca premium, fondo de hero de alto impacto o composiciones inmersivas sin media.

Efectos disponibles:

- Candy Stacker PRO.
- Creative Studio V2 PRO.
- Crystal Computers PRO.
- Deco Tile PRO.
- Everything Is Fine PRO.
- Fiesta Truchets PRO.
- Glass Wooden Pegs PRO.
- Infinite Falling PRO.
- Infinity Machine PRO.
- Infinity Truchets PRO.
- Infinity Zoom PRO.
- Mutating Field PRO.
- Particulate Shatter PRO.
- Ping Pong Feedback PRO.
- Quadtree Eyes PRO.
- Reflective City PRO.
- Shader Clock PRO.
- Shader Doodle Gradient PRO.
- Shader Ghosts PRO.
- Space Flame Orb PRO.
- Video Dither Glyph PRO.
- Zen Hexagon Tiles PRO.

### Camera FX Premium

Efectos que usan la webcam del dispositivo o media como fuente de captura en tiempo real.

Los exports de esta familia requieren iframe con permiso `allow="camera; autoplay; fullscreen"`, ya incluido en el pipeline de exportacion.

Efectos disponibles:

- Webcam Dither Glyph PRO.

## Efectos Similares Y Como Elegir

### Carrusel, Flow Y Marquee

Usar Carousel Flow cuando se quiera un carrusel claro y comercial.

Usar Ticker Loop cuando se quiera movimiento continuo tipo cinta publicitaria.

Usar Mechanical Impact Cards PRO cuando se quiera un movimiento mas divertido, mecanico y con choque entre tarjetas.

Usar Swaying Gallery cuando se quieran fotos colgantes con movimiento pendulo suave.

Usar Reverse Columns para columnas con scroll alternado en direcciones opuestas.

Usar Ring Carousel 3D o Cylinder Carousel cuando el cliente quiera profundidad y rotacion 3D.

### Tuneles Y Profundidad

Usar Infinite Depth Tunnel, Delphi Infinite Tunnel o Digital Tokamak Tunnel cuando se quiera una experiencia inmersiva de entrada.

Usar Cyberspace Portal cuando se quiera un tunel de particulas tipo codigo con estetica cyber.

Usar Infinite Zoom Tunnel o Zoom Immersion cuando el efecto principal deba ser avanzar hacia dentro.

Usar Marquee Tunnel o Data Tunnel cuando se quiera un tono mas digital, tecnologico o de datos.

### Grids Y Moodboards

Usar Grid Reveal cuando se quiera algo simple y limpio.

Usar Infinite Moodboard cuando haya muchas imagenes y se busque una sensacion infinita.

Usar Hex Video Grid cuando se quiera una reticula hexagonal donde cada celda reacciona a la luminancia de la imagen.

Usar Fashion Grid cuando se quiera una experiencia editorial con zoom y exploracion.

Usar Concave Gallery cuando se quiera un mosaico con lente o distorsion visual.

### Reveals Y Transiciones

Usar Diagonal Wipe, Stripe Reveal o Split Reveal para transiciones limpias.

Usar Liquid Morph, Liquid Displacement o Morph Gallery para transiciones organicas.

Usar Glitch Transition para una estetica digital.

Usar Chroma Grid cuando se quieran triangulos con aberracion cromatica RGB por celda.

Usar Split Compare para comparador antes/despues con divisor interactivo.

Usar Camera Shutter o Theater Curtain para una entrada cinematica.

Usar Cinematic Zoom para reveal tipo trailer con barras letterbox y zoom lento.

### Texto Y Tipografia

Usar Neon Glow Text o Neon Pulse Glow para texto neon. La diferencia es que Neon Flicker oscila como una lampara real; Neon Pulse Glow tiene un pulso sinusoidal suave y continuo.

Usar Circular Timer para contar regresiva o progreso en formato arco circular.

Usar Polar Spiral Text para letras orbitando en espiral logaritmica.

### Particulas Y Shaders

Usar Particles Brightness Gamma cuando se quiera brillo y particulas alrededor de una imagen.

Usar Particle Dissolve, Sand Dissolve o Particle Swarm Formation cuando se quiera construir o destruir la imagen.

Usar Image Warp Pro, Water Distortion o Squiggle Deformer cuando se quiera deformacion fluida.

Usar Video Dither ASCII Pro o Dithering Filter cuando se quiera estetica retro, tecnica o experimental.

Usar Video ASCII Art para conversion de imagen en arte ASCII en tiempo real con cuatro charsets.

Usar RGB Dancer para separacion de canales RGB tipo aberracion cromatica dinamica.

### Orbita Y Gravedad

Usar Solar System para planetas texturizados con imagenes orbitando una estrella.

Usar Icosahedron Lights para clusters de geometria 3D con PointLights adjuntas.

Usar Zero Gravity para objetos flotando en espacio sin gravedad con fisica spring.

Usar Confetti 3D para celebraciones con piezas de color cayendo en 3D.

### Shader Premium Y Camera FX

Usar Creative Studio V2 PRO para impregnar capas animadas tipo Matrix sobre imagen o video con texto personalizable.

Usar Space Flame Orb PRO para fondo premium de orbe/llama espacial.

Usar Webcam Dither Glyph PRO para convertir webcam o media en glifos dither con estilos Glitch, Hash, Hearts y ASCII.

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

El iframe incluye los permisos `allow="camera; autoplay; fullscreen"` para soportar efectos con webcam y autoplay de video.

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
- Los efectos con webcam, como Webcam Dither Glyph PRO, requieren HTTPS o localhost y permiso explicito del navegador. El embed final ya incluye `allow="camera; autoplay; fullscreen"`.
- Glitch RGB y Video ASCII Art hacen un loop de pixels por frame (O(W x H)); en dispositivos moviles con GPU limitada pueden bajar de 30fps. Reducir resolucion del canvas si se detecta caida de rendimiento.
- ctx.filter (blur en Canvas2D) no esta soportado en Safari anterior a 15.4 ni en algunos WebViews. Liquid Glass Text cae a shadowBlur como alternativa visual.

## Notas Tecnicas Para Claude

Estas notas son para el agente que continue el desarrollo. No son documentacion de producto.

### Contratos de efecto

Cada efecto ES un objeto `EP.EffectBase` con:
- `build(mediaList)`: construye y devuelve un `THREE.Group`. Guarda referencias en `this._*`.
- `update(time, dt, loopDuration)`: animacion por frame. `dt` = delta en segundos.
- `dispose()`: limpia texturas, listeners y referencias. Llamar `.dispose()` en `THREE.Texture`, `THREE.BufferGeometry` y `THREE.Material` creados en `build`.

### Reglas criticas de arquitectura

- ES5 estricto. No usar `let`, `const`, arrow functions, template literals ni spread.
- Patron IIFE: `(function() { ... })();`
- El cliente NUNCA recibe el editor. Solo el viewer final. No exponer paneles ni controles en la salida.
- Modular: solo sumar efectos. Nunca eliminar ni modificar un efecto existente sin aprobacion explicita.
- Mouse tracking: usar `document.querySelector('canvas')` es fragil si hay multiples canvas. Obtener referencia al renderer canvas cuando sea posible.
- Texturas Canvas: siempre `this._tex.needsUpdate = true` al final de `update`.
- Materiales con `transparent: true` creados despues de `EP.Media.createMaterial`: llamar `mat.needsUpdate = true` tras cambiar `transparent` o `opacity`.

### Familias y categorias registradas

Las 16 categorias registradas en `registry.js`:
`3d-perspective`, `carousel-flow`, `grid`, `stack-scatter`, `spotlight-focus`,
`reveal-wipe`, `glassmorphism`, `parallax`, `motion`, `text`, `gravity`, `field`,
`flicker`, `orbit`, `proximity`, `camera-fx-premium`, `shader-premium`

### Shader Premium

- Familia con efectos GLSL. Mantener imagen o video del usuario como fuente cuando el efecto lo permita.
- No oscurecer medios por defecto. Bloom, tintes y dramatizacion son opcionales.
- Crystal Computers PRO y Candy Stacker PRO: imagen/video como contenido personalizable, no textura decorativa fija.
- Mutating Field PRO: evolucionara hacia deformacion basada en imagen en fase futura.

### Creative Studio V2 PRO

- No es un compositor generico. Impregna capas animadas sobre la imagen o video del usuario.
- Controles clave: `Element Size`, `Element Count`, `Density`, `Frases / Letras`.
- `Frases / Letras` alimenta lluvia de caracteres y simbolos personalizados.
- `Element Size` hace visibles los elementos sin depender solo de densidad.

### Webcam Dither Glyph PRO

- Requiere permiso de camara. Si falla, debe caer a media subida o fallback visual sin romper el editor.
- Exports HTML/JS con webcam necesitan iframe con `allow="camera; autoplay; fullscreen"`.
- Ya integrado en `js/export.js`.

### Bugs conocidos pendientes (no corregidos aun)

Los siguientes issues fueron identificados en auditoria 2026-07-03 y son warnings, no bloqueantes:

1. `confetti-3d`, `stained-glass`, `swaying-gallery`: `dispose()` no libera `THREE.Geometry` ni `THREE.Material` de sus meshes. Leak de VRAM en sesiones largas.
2. `neon-pulse-glow`: overlay negro fijo al 82% oscurece la imagen de fondo. Sin control de usuario para esa opacidad. Candidato a agregar slider `overlayOpacity`.
3. `cyberspace-portal`: `this.group.position.z` desplaza tambien el plano de fondo solido. El fondo deberia ser un grupo separado no desplazado.
4. `glitch-rgb` y `video-ascii`: bucle de pixels O(W x H) por frame. Candidatos a optimizacion de resolucion en dispositivos lentos.
5. `parallax-multicapa`: smoothing=1 congela virtualmente la capa. Rango util real es 5-20.
6. `dots-pattern`: `shadowBlur` por punto en cada frame. Costoso en grids grandes.

## Actualizacion 2026-07-03

### Fase C completada: 24 efectos nuevos desde gists

Efectos incorporados en tres niveles de dificultad:

**FACIL (8 efectos):**
- Swaying Gallery: fotos colgantes con pendulo.
- Reverse Columns: columnas con scroll alternado.
- Confetti 3D: confeti cayendo en 3D.
- Split Compare: comparador antes/despues.
- Cinematic Zoom: reveal cinematografico con letterbox.
- Glitch RGB: aberracion de canal RGB.
- Circular Timer: temporizador circular con arco Canvas2D.
- Neon Pulse Glow: neon con pulso sinusoidal suave.

**MEDIO (11 efectos):**
- Video ASCII Art: imagen a ASCII en tiempo real.
- Polar Spiral Text: tipografia en espiral logaritmica.
- Layered Noise: ruido en capas apiladas.
- Audio EQ Visualizer: espectro de audio con 32 bandas, modo demo + mic.
- Stained Glass: vitral con paneles orbitantes y PointLights.
- Parametric Surface: superficies 3D (toro, esfera, caracola, Klein).
- Icosahedron Lights: clusters de icosaedros con luces adjuntas.
- Parallax Multicapa: paralaje de profundidad Z por cursor.
- RGB Dancer: triple capa con separacion de canal por cursor.
- Solar System: sistema solar con planetas texturizados.
- Dots Pattern: puntos con patrones expand/wave/spiral/grid.

**DIFICIL (5 efectos):**
- Chroma Grid: grid triangular con aberracion cromatica por celda.
- Hex Video Grid: hexagonos reactivos a luminancia de imagen.
- Zero Gravity: objetos flotando con fisica spring en espacio estelar.
- Liquid Glass Text: texto con distorsion liquida y aberracion cromatica.
- Cyberspace Portal: tunel CatmullRom con particulas de codigo y anillo pulsante.

### Bugs corregidos en auditoria 2026-07-03

- `circular-timer`: modo progreso mostraba segundos como porcentaje. Corregido a `Math.floor(phase * 100)`.
- `audio-eq`: direccion del suavizado estaba invertida. Corregido: smoothing alto = mas suavidad.
- `audio-eq`: AudioContext del microfono no se cerraba en dispose. Corregido: `this._ac.close()`.
- `zero-gravity`: material de foto no llamaba `needsUpdate` tras cambiar `transparent`. Corregido.
- `solar-system`: material huerfano sin dispose al reasignar a MeshPhongMaterial. Corregido.
- `icosahedron-lights`: rotacion del satelite no era dt-independiente. Corregido.
- `hex-video-grid`: canvas de muestreo se redimensionaba cada frame aunque el tamano no cambiara. Corregido con cache.
- `chroma-grid`: array `_cells` declarado pero nunca usado. Eliminado.

### Tanda anterior: Shaders Premium + Camera FX

Efectos ya subidos:

- 19 Shaders Premium (ver lista en seccion Shader Premium).
- Space Flame Orb PRO.
- Creative Studio V2 PRO.
- Webcam Dither Glyph PRO (familia Camera FX Premium).

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
    camera-fx-premium/
    shader-premium/
    3d-perspective/
    carousel-flow/
    field/
    flicker/
    glassmorphism/
    gravity/
    grid/
    motion/
    orbit/
    parallax/
    proximity/
    reveal-wipe/
    spotlight-focus/
    stack-scatter/
    text/
assets/
outputs/
```

## Principio De Producto

Escaparates Pro no vende el panel de generacion. Vende el resultado final.

La experiencia interna puede ser flexible, editable y potente. La entrega al cliente debe ser clara, cerrada, limpia y lista para publicar.
