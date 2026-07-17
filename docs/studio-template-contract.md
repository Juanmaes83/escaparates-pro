# Studio Template Contract

## Objetivo

La Fase 0 convierte el Studio en una plataforma extensible para plantillas editables. Las plantillas Source Faithful siguen siendo referencias protegidas y no forman parte del registro editable.

## Arquitectura

El contrato canonico vive en `js/studio/template-registry.js`.

Capas consumidoras:

- `studio.html` carga el registro antes del editor, persistencia, Project Cloud y exportacion.
- `review/phase1-studio-v2.js` consume el registro para tabs, schema, defaults, media slots y viewports.
- `js/customization/project-store-local.js` normaliza proyectos mediante el contrato.
- `js/projects/studio-route.js` resuelve `?template=` y `?project=` contra el registro.
- `js/projects/project-library-page.js` muestra nombres de plantilla desde el registro.
- `js/projects/product-integration.js` deriva enlaces de Studio desde el registro.
- `js/export/export-validator.js` valida capacidades Custom PRO desde el registro.

## TemplateDefinition

Cada definicion contiene:

- `id`, `familyId`, `version`, `title`, `shortTitle`, `description`
- `category`, `sector`, `templateType`, `status`
- `templateKind` y `builder`
- `defaults`, `schema`, `mediaSlots`, `presets`
- `capabilities`, `responsiveDefaults`, `exportSupport`
- `projectMigration`, `sourceFaithfulReference`, `tags`, `thumbnail`

El builder no se duplica. El registro declara como resolverlo:

```js
{
  id: 'product-storytelling-custom-pro',
  familyId: 'product-storytelling',
  version: 1,
  templateKind: 'scroll',
  builder: { kind: 'scroll', id: 'product-storytelling-custom-pro' }
}
```

## Schema

El schema declara campos con `key`, `label`, `type`, `default`, validaciones y orden. Los tipos soportados cubren texto, textarea, numero/range, boolean, select, color, URL, email, telefono, CTA, grupos, responsive y movimiento.

El Studio renderiza controles desde ese schema. Solo deben anadirse componentes especializados cuando una plantilla demuestre una necesidad real no cubierta por el contrato.

## Media Slots

Cada plantilla declara sus slots propios con `id`, `label`, `type`, `accepts`, fallback demo, aspecto recomendado, dimensiones, tamano orientativo, uso semantico, validacion y comportamiento al eliminar.

Reglas:

- no usar `EP.Media.getAll()` en Studio;
- no compartir media entre plantillas;
- al cambiar de plantilla o proyecto se limpian referencias temporales;
- los assets locales se marcan como temporales;
- publicacion/exportacion debe bloquear URLs `blob:` o recursos locales no persistentes.

## Presets

Toda plantilla tiene un preset `default`. Un preset puede sobreescribir defaults y media demo sin duplicar builder. Para crear presets visibles en el futuro, declararlos en `presets` y probar que solo tocan campos existentes.

## Proyecto Versionado

El modelo normalizado incluye:

- `projectId`, `projectName`, `templateId`, `templateVersion`, `schemaVersion`
- `presetId`, `config`, `media`
- `createdAt`, `updatedAt`, `source`, `persistenceMode`
- `cloudId` y metadata de publicacion cuando existan

`EP.StudioTemplateRegistry.normalizeProject(project)` migra proyectos antiguos sin `schemaVersion`, conserva config conocida y rellena defaults faltantes.

## Preview Lifecycle

La interfaz actual es compatible con:

- `mount`: construir `srcdoc`
- `update`: reconstruir con config/media actuales
- `resize`: aplicar viewport canonico
- `destroy`: limpiar `onload`, `srcdoc` y ObjectURLs locales

Builders antiguos sin `destroy` se tratan mediante adaptador seguro en el Studio.

## Persistencia Y Cloud

La persistencia local es obligatoria y funciona sin sesion. Project Cloud es progresivo:

- sin sesion: modo local, cloud y versiones desactivadas;
- sin conexion real: estado `Sin conexion`;
- API caida: estado `API no disponible`;
- abrir plantilla local no debe exigir llamadas cloud.

## Exportacion

`exportSupport` declara JSON, HTML, ZIP, embed y publicacion. El validador consulta el registro y bloquea plantillas no Custom PRO, URLs temporales, enlaces invalidos y assets no listos.

## Tests

Ejecutar:

```bash
node tests/studio-template-contract.spec.mjs
node tests/phase2-contract.spec.mjs
```

La QA visual debe usar una preview del HEAD actual. Si no hay preview disponible, no declarar QA visual aprobada.

## Como Anadir Una Custom PRO

1. Crear o conectar el builder en Scroll Sections o Sector Blueprints.
2. Registrar una `TemplateDefinition` en `js/studio/template-registry.js`.
3. Declarar `defaults`, `schema`, `mediaSlots`, `presets` y `exportSupport`.
4. Confirmar `sourceFaithfulReference` si existe, sin modificar Source Faithful.
5. Anadir test contractual del nuevo ID.
6. Probar `studio.html?template=<id>`.
7. Probar edicion, reset, autosave, export JSON y preview en desktop/tablet/mobile.
8. Abrir PR Draft sin merge.

## Checklist Luxury Beauty Product PRO

- `familyId`: `luxury-beauty-product`
- `templateType`: `custom-pro`
- builder unico reutilizable
- media slots: hero video, poster, packshot, texture/detail, before-after opcional, logo
- schema: marca, producto, claim, ingredientes/beneficios, CTA, colores, movimiento
- presets: `default` inicialmente oculto o neutro
- exportSupport real, sin prometer publicacion si no esta validada
- test de registro, builder, slots, defaults y preview
