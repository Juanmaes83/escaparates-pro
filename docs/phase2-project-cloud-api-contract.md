# Escaparates Pro — Phase 2 Project Cloud API Contract

Base URL actual del frontend: `https://escaparates-pro-api-staging-staging.up.railway.app`

## Reglas obligatorias

- Todos los endpoints privados requieren `Authorization: Bearer <token>`.
- Todo proyecto, asset, versión y publicación se filtra por `ownerId` derivado del token; nunca desde el body.
- IDs ajenos responden `404` o `403` sin filtrar metadatos.
- `PATCH /v1/projects/:id` acepta `If-Match: <revision>` y responde `409/412` en conflicto.
- Ninguna respuesta devuelve tokens, claves de almacenamiento ni secretos.
- Uploads usan URL firmada y caducidad corta.

## Project

```json
{
  "id": "uuid",
  "ownerId": "uuid",
  "name": "Landing Villa Alicante",
  "templateId": "luxury-real-estate-custom-pro",
  "templateVersion": "2.2.0",
  "config": {},
  "mediaBindings": [],
  "responsive": {},
  "seo": {},
  "status": "draft",
  "archived": false,
  "revision": 1,
  "published": null,
  "createdAt": "ISO-8601",
  "updatedAt": "ISO-8601"
}
```

## Endpoints

- `POST /v1/projects`
- `GET /v1/projects?search=&status=&sort=&cursor=`
- `GET /v1/projects/:id`
- `PATCH /v1/projects/:id`
- `DELETE /v1/projects/:id`
- `POST /v1/projects/:id/duplicate`
- `GET /v1/projects/:id/versions`
- `POST /v1/projects/:id/versions`
- `POST /v1/projects/:id/versions/:versionId/restore`
- `POST /v1/projects/:id/assets`
- `POST /v1/projects/:id/assets/:assetId/complete`
- `DELETE /v1/projects/:id/assets/:assetId`
- `POST /v1/projects/:id/publish`
- `DELETE /v1/projects/:id/publish`

## Asset upload init

Request:

```json
{
  "filename": "hero.mp4",
  "mimeType": "video/mp4",
  "size": 42000000,
  "width": 3840,
  "height": 2160,
  "duration": 24
}
```

Response:

```json
{
  "asset": {"id":"uuid","status":"uploading"},
  "upload": {"url":"https://signed-upload-url","headers":{},"expiresAt":"ISO-8601"}
}
```

Completion response must expose a stable CDN URL:

```json
{
  "asset": {
    "id":"uuid",
    "status":"ready",
    "publicUrl":"https://cdn.example.com/...",
    "mimeType":"video/mp4",
    "size":42000000,
    "width":3840,
    "height":2160,
    "duration":24
  }
}
```

## Publish

Request:

```json
{"slug":"landing-villa-alicante","html":"<!doctype html>..."}
```

Response:

```json
{
  "publication": {
    "id":"uuid",
    "slug":"landing-villa-alicante",
    "url":"https://escaparates.pro/p/landing-villa-alicante",
    "versionId":"uuid",
    "publishedAt":"ISO-8601"
  }
}
```

La publicación es un snapshot inmutable. Editar el proyecto no modifica la URL pública hasta publicar de nuevo.

## Límites y seguridad

- MIME detectado por contenido, no sólo extensión.
- Límites de tamaño, duración y número de assets según entitlements.
- Sanitización de texto y URLs.
- Rate limiting.
- Limpieza de uploads incompletos y assets huérfanos sin referencias históricas.
- Las versiones publicadas conservan sus assets aunque el proyecto actual los elimine.
