# Real Estate Storytelling — Immersive Audit & Studio Contract

## Estado de este documento

Fase 1. Documento de comprensión antes de construir panel.

No es implementación. No cambia runtime. No marca el módulo como COMPLETE_VAULT.

## Fuente analizada

Repo fuente: `Juanmaes83/INMOBILIARIA-STORYTELLING-SCROOL-PREMIUM`
Archivo base: `index.html`

La pieza original es una experiencia inmersiva de storytelling inmobiliario construida como HTML único con React, Framer Motion, Tailwind y Babel in-browser.

## Qué muestra

Esta pieza no es una web inmobiliaria completa. Es una microexperiencia narrativa basada en un vídeo de fondo y cuatro fases emocionales sincronizadas con scroll.

Elementos visibles principales:

1. Vídeo fullscreen sticky.
2. Marca `RUBIK SOTA`.
3. Selector ES/EN.
4. Cuatro fases narrativas.
5. Dots de progreso.
6. Flecha de dirección.
7. Footer/créditos.

Fases en español:

1. `¿Deseas ver tu hogar más de cerca?`
2. `Desciende y entra.`
3. `Genial ¿no?`
4. `Llámanos, te la enseñamos.`

## Qué hace especial a la experiencia

La pieza transforma un único vídeo en un recorrido emocional.

No vende mediante catálogo. Vende mediante sensación:

- aproximación;
- descenso;
- entrada;
- sorpresa;
- llamada final.

El usuario no navega secciones normales. Recorre una coreografía de vídeo y texto.

## Uso específico del vídeo

El vídeo es el centro de la experiencia.

Comportamiento relevante:

- La página mide `600vh`.
- El vídeo ocupa una pantalla sticky de `100vh`.
- `useScroll` obtiene el progreso global.
- El progreso se divide en cuatro fases.
- De 0 a 0.5 el vídeo avanza.
- De 0.5 a 1 el vídeo retrocede.
- El `currentTime` se suaviza con interpolación.
- El vídeo permanece muted, playsInline y preload auto.

Esto es ADN. No debe convertirse en una landing normal con un vídeo decorativo.

## Estructura dramática

La estructura base es:

1. Hook emocional: ver el hogar más de cerca.
2. Movimiento físico: descender y entrar.
3. Recompensa: descubrir que es genial.
4. Conversión: llamada/visita.

El panel debe editar esta dramaturgia sin romperla.

## Intocables visuales

No deben romperse:

- fullscreen sticky;
- vídeo como capa principal;
- cuatro fases por defecto;
- sincronía scroll/fase/vídeo;
- avance-retroceso del vídeo;
- minimalismo visual;
- dots de progreso;
- flecha de dirección;
- cambio ES/EN;
- sensación de microfilm interactivo.

## Riesgos detectados

1. Dependencia de vídeo externo remoto.
2. Framer Motion desde CDN y Babel in-browser: válido para demo, menos sólido como producto.
3. Sin Studio propio.
4. Sin persistencia.
5. Sin import/export JSON.
6. Sin fallback visual fuerte si falla vídeo.
7. Si el vídeo no entrega metadata, el scrub queda debilitado.
8. Dentro de Vault, reconstruirlo como `srcdoc` puede romper scroll, metadata o timing.
9. Si se le añade un panel genérico de web completa, se destruye su ADN narrativo.

## Qué debe editar el Studio

### 01 · Marca

- Nombre/logo.
- Idioma por defecto.
- Footer/créditos.
- Color texto/acento.
- Mostrar/ocultar selector de idioma.

### 02 · Vídeo

- Vídeo principal.
- Poster obligatorio.
- Imagen fallback obligatoria.
- Escala/crop.
- Overlay oscuro.
- Preload strategy.
- Estado de validación del vídeo.

### 03 · Fases narrativas

Por fase:

- Texto principal.
- Subtítulo.
- Timing de entrada.
- Mostrar/ocultar subtítulo.
- CTA opcional sólo en última fase.

El número de fases puede ser configurable en el futuro, pero V1 debe preservar 4 fases por defecto para no romper la coreografía original.

### 04 · Scroll & Motion

- Longitud de scroll en vh.
- Modo vídeo:
  - `forward-reverse` por defecto;
  - `forward`;
  - `loop`.
- Suavizado de currentTime.
- Duración de transición textual.
- Distancia de entrada/salida.
- Mostrar/ocultar dots.
- Mostrar/ocultar flecha.
- Reduced Motion.

### 05 · CTA final

- Texto CTA.
- Teléfono.
- WhatsApp.
- Email.
- URL.
- Mostrar CTA en fase 4.

### 06 · Proyecto

- Autosave.
- Undo/Redo.
- Import JSON.
- Export JSON.
- Reset.
- Preview desktop/tablet/mobile.
- Validación de vídeo.

## Arquitectura recomendada

Crear una versión autosuficiente, no seguir con todo en un `index.html` monolítico.

```text
labs/premium-vault/real-estate-storytelling-studio-pro/
  index.html
  story-config.js
  story-store.js
  story-app.js
  story-motion.js
  story.css
  story-studio.css
  presets/
    RUBIK-SOTA-STORY.json
    COASTAL-VILLA-STORY.json
```

Regla central heredada de Restaurante:

```text
ENGINE != CONTENT != MEDIA
```

## Contrato de media slots

- `storyVideo` — vídeo principal scrubbed.
- `storyPoster` — poster para carga/metadata.
- `storyFallbackImage` — imagen si el vídeo falla.
- `brandLogo` — logo/wordmark opcional.

## Reglas de seguridad visual

1. Nunca dejar pantalla negra si falla vídeo.
2. Si no hay metadata, mantener primera fase visible con fallback.
3. Si Reduced Motion está activo, mostrar contenido estático navegable.
4. No forzar reproducción con sonido.
5. No esconder textos mientras el vídeo carga.
6. No convertir la pieza en catálogo inmobiliario.

## Criterio para considerarlo COMPLETE_VAULT

Sólo puede marcarse COMPLETE_VAULT cuando:

1. Abre como experiencia completa desde Vault.
2. El vídeo se ve o existe fallback visible si falla.
3. El Studio propio abre y cierra.
4. Marca, vídeo, fases, CTA y motion editan en runtime.
5. Los cambios persisten tras reload.
6. Import/export JSON transforma la experiencia sin tocar código.
7. Reduced Motion mantiene contenido visible.
8. No hay errores de consola relevantes.
9. El scroll-scrub funciona dentro de la web autosuficiente.
10. Vault no reconstruye la experiencia como `srcdoc` frágil.

## Veredicto de Fase 1

Real Estate Storytelling debe convertirse en `Real Estate Storytelling Studio PRO`, no en una web builder completa.

Debe heredar de Restaurante la arquitectura de Studio, persistencia, media slots, validación y Motion, pero su panel debe ser narrativo y cinematográfico.

El panel debe proteger el ADN: un vídeo, cuatro fases, scroll-scrub, avance-retroceso y CTA final.
