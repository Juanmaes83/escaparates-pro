# Luxury Real Estate — Immersive Audit & Studio Contract

## Estado de este documento

Fase 1. Documento de comprensión antes de construir panel.

No es implementación. No cambia runtime. No marca el módulo como COMPLETE_VAULT.

## Fuente analizada

Repo fuente: `Juanmaes83/Rubik-Sota-Inmobiliaria-Premium`
Archivo base: `index.html`

La pieza original es una web inmobiliaria premium inmersiva construida como HTML único con React, Tailwind, GSAP, ScrollTrigger y ScrollToPlugin desde CDNs.

## Qué muestra

La experiencia presenta una inmobiliaria premium bajo la marca Rubik Sota. No es una ficha de propiedad aislada; es una landing completa de marca inmobiliaria aspiracional.

Bloques visibles principales:

1. Vídeo inmersivo de fondo.
2. Navegación superior: Inicio, Nosotros, Servicios, Contacto.
3. Cambio de idioma ES/EN.
4. Hero tipográfico con el mensaje `Vive Sin / Límites`.
5. Panel glassmorphism de presentación de marca / About.
6. Grid de propiedades exclusivas.
7. Bloque de servicios premium.
8. Bloque de contacto.
9. Footer de marca.

## Qué hace especial a la web

La pieza no funciona por acumulación de secciones, sino por una sensación cinematográfica continua:

- vídeo de fondo fijo y envolvente;
- tipografía hero muy grande;
- texto que desaparece con el scroll;
- panel glass con movimiento/parallax;
- estética oscura/dorada;
- tarjetas inmobiliarias sobrias;
- navegación premium sin sobrecargar;
- sensación de lujo, profundidad y marca boutique.

## Uso específico del vídeo

El vídeo no es un simple background autoplay. La pieza tiene un componente `ScrollVideo` que usa el progreso de scroll para mover el `currentTime` del vídeo.

Comportamiento relevante:

- `VIDEO_SRC` apunta a un vídeo CloudFront.
- El vídeo se renderiza fixed/inset como atmósfera global.
- El progreso se calcula a partir de `window.scrollY` y altura de documento.
- `currentTime` se suaviza con interpolación.
- El contenedor del vídeo también responde al movimiento de ratón con GSAP, generando parallax inmersivo.

Esto es ADN. No debe ser eliminado al crear el Studio.

## Estructura dramática

La web tiene una dramaturgia de marca, no de producto único:

1. Impacto inicial: video + statement `Vive Sin / Límites`.
2. Profundización: panel glass explica la marca.
3. Prueba comercial: propiedades exclusivas.
4. Servicio: capacidades de la agencia.
5. Conversión: contacto.

## Intocables visuales

No deben romperse:

- vídeo como atmósfera principal;
- scroll-scrub del vídeo;
- gran titular dividido en dos líneas;
- glass panel con profundidad;
- estética oscuro/dorado;
- propiedades como cards premium;
- suavidad GSAP/ScrollTrigger;
- idioma ES/EN.

## Riesgos detectados

1. Dependencia fuerte de vídeo remoto externo.
2. React + Babel in-browser: rápido para demo, frágil como producto escalable.
3. Contenido mezclado dentro del HTML/React, no separado de motor.
4. Propiedades hardcodeadas dentro del componente.
5. No hay Studio propio en la fuente original.
6. No hay persistencia de proyecto.
7. No hay import/export JSON.
8. No hay fallback visual fuerte si falla el vídeo.
9. Dentro de Vault, reconstruirlo como `srcdoc` puede apagar o degradar la experiencia.

## Qué debe editar el Studio

### 01 · Marca

- Nombre de agencia.
- Logo / wordmark.
- Idioma por defecto.
- Paleta: fondo, acento dorado, texto, glass.
- Créditos / footer.

### 02 · Hero / Vídeo

- Vídeo principal.
- Poster / fallback.
- Imagen fallback obligatoria.
- Línea 1 del hero.
- Línea 2 del hero.
- Intensidad de escala del vídeo.
- Suavizado del scrub.
- Intensidad del parallax mouse.
- Overlay/vignette.

### 03 · About Glass

- Título.
- Texto.
- Opacidad del glass.
- Blur.
- Movimiento/parallax.
- Posición/tamaño del panel dentro de límites seguros.

### 04 · Propiedades

- Añadir propiedad.
- Duplicar propiedad.
- Ocultar/mostrar.
- Reordenar.
- Título.
- Ubicación.
- Precio.
- Imagen o vídeo de propiedad.
- CTA.
- URL / contacto.

### 05 · Servicios

- Título.
- Lista de servicios.
- Orden.
- Icono/número.

### 06 · Contacto

- Título.
- Texto.
- Email.
- Teléfono.
- WhatsApp.
- CTA.
- Formulario demo.

### 07 · Motion

- Scrub strength.
- Scroll text reveal.
- Card reveal.
- Glass parallax on/off.
- Mouse parallax intensity.
- Reduced motion.

### 08 · Proyecto

- Autosave.
- Undo/Redo.
- Import JSON.
- Export JSON.
- Reset.
- Preview desktop/tablet/mobile.

## Arquitectura recomendada

Crear una versión autosuficiente, no seguir con todo en un `index.html` monolítico.

```text
labs/premium-vault/luxury-real-estate-studio-pro/
  index.html
  realestate-config.js
  realestate-store.js
  realestate-app.js
  realestate-motion.js
  realestate.css
  realestate-studio.css
  presets/
    RUBIK-SOTA.json
    COASTAL-BOUTIQUE.json
```

Regla central heredada de Restaurante:

```text
ENGINE != CONTENT != MEDIA
```

## Contrato de media slots

- `heroVideo` — vídeo atmosférico principal.
- `heroPoster` — imagen fallback/poster.
- `brandLogo` — logo/wordmark.
- `aboutMedia` — opcional, si se añade profundidad a About.
- `propertyMedia[]` — imagen/vídeo por propiedad.
- `contactMedia` — opcional para cierre.

## Criterio para considerarlo COMPLETE_VAULT

Sólo puede marcarse COMPLETE_VAULT cuando:

1. Abre como web completa desde Vault.
2. El vídeo se ve o existe fallback visible si falla.
3. El Studio propio abre y cierra.
4. Marca, hero, about, propiedades, servicios y contacto editan en runtime.
5. Media acepta imagen/vídeo donde corresponde.
6. Los cambios persisten tras reload.
7. Import/export JSON transforma la web sin tocar código.
8. Reduced Motion mantiene contenido visible.
9. No hay errores de consola relevantes.
10. Vault no reconstruye la experiencia como `srcdoc` frágil, sino que abre la web autosuficiente.

## Veredicto de Fase 1

Luxury Real Estate debe convertirse en `Luxury Real Estate Studio PRO`, una web completa premium con Studio propio. Debe heredar el patrón arquitectónico de Restaurante, no el patrón reducido de builder interno de ELORIA.

El panel debe proteger el ADN: vídeo inmersivo, scroll-scrub, tipografía hero, glassmorphism y propiedades premium.
