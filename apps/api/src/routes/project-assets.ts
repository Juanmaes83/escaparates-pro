import { randomUUID } from 'node:crypto'
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { env } from '../config/env.js'
import { getPool } from '../db/index.js'
import { buildEntitlements } from '../lib/entitlements.js'
import { buildErrorResponse } from '../lib/errors.js'
import { canEditProject, projectExistsInWorkspace, resolveProjectAccess } from '../lib/project-access.js'
import { createPresignedDeleteUrl, createPresignedPutUrl, getR2Config, missingR2Settings, publicAssetUrl } from '../lib/r2-storage.js'

function storageUnavailable(requestId: string) {
  const body = buildErrorResponse('STORAGE_NOT_CONFIGURED', 'Persistent storage is not configured', requestId)
  if (env.NODE_ENV !== 'production') {
    ;(body.error as typeof body.error & { storage?: { missing: string[] } }).storage = { missing: missingR2Settings() }
  }
  return body
}

const projectParams = z.object({ projectId: z.string().uuid() })
const assetParams = projectParams.extend({ assetId: z.string().uuid() })
const initSchema = z.object({
  filename: z.string().trim().min(1).max(240),
  mimeType: z.string().trim().min(1).max(120),
  size: z.coerce.number().int().positive(),
  slot: z.string().trim().min(1).max(80).default('media'),
})
const completeSchema = z.object({
  etag: z.string().max(200).optional(),
  width: z.number().int().positive().nullable().optional(),
  height: z.number().int().positive().nullable().optional(),
  duration: z.number().nonnegative().nullable().optional(),
})

const MIME_KIND: Record<string, 'image' | 'video' | 'font'> = {
  'image/jpeg': 'image', 'image/png': 'image', 'image/webp': 'image', 'image/avif': 'image', 'image/gif': 'image', 'image/svg+xml': 'image',
  'video/mp4': 'video', 'video/webm': 'video', 'video/quicktime': 'video',
  'font/woff2': 'font', 'application/font-woff2': 'font',
}

function safeName(value: string): string {
  const parts = value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '')
  return (parts || 'asset').slice(-140)
}

function maxBytes(kind: 'image' | 'video' | 'font', planMb: number): number {
  const configured = kind === 'image' ? env.ASSET_MAX_IMAGE_BYTES : kind === 'video' ? env.ASSET_MAX_VIDEO_BYTES : env.ASSET_MAX_FONT_BYTES
  return Math.min(configured, Math.max(1, planMb) * 1024 * 1024)
}

type AssetRow = {
  id: string; project_id: string; slot: string; kind: string; mime_type: string; original_name: string; storage_key: string;
  public_url: string | null; size_bytes: string | number; width: number | null; height: number | null; duration_ms: number | null;
  checksum: string | null; status: string; created_at: Date; updated_at: Date
}

function assetDto(row: AssetRow) {
  return {
    id: row.id, projectId: row.project_id, slot: row.slot, type: row.kind, mimeType: row.mime_type,
    name: row.original_name, storageKey: row.storage_key, url: row.public_url, size: Number(row.size_bytes),
    width: row.width, height: row.height, duration: row.duration_ms == null ? null : row.duration_ms / 1000,
    etag: row.checksum, status: row.status, createdAt: row.created_at.toISOString(), updatedAt: row.updated_at.toISOString(),
  }
}

export async function projectAssetsRoutes(app: FastifyInstance): Promise<void> {
  app.post('/v1/projects/:projectId/assets', async (request, reply) => {
    const access = await resolveProjectAccess(request)
    if (!access) return reply.status(401).send(buildErrorResponse('UNAUTHORIZED', 'Authentication required', request.requestId))
    if (!canEditProject(access.role)) return reply.status(403).send(buildErrorResponse('FORBIDDEN', 'Editor access required', request.requestId))
    const params = projectParams.safeParse(request.params)
    const body = initSchema.safeParse(request.body)
    if (!params.success || !body.success) return reply.status(400).send(buildErrorResponse('VALIDATION_ERROR', 'Invalid asset upload request', request.requestId))
    if (!(await projectExistsInWorkspace(params.data.projectId, access.workspaceId))) return reply.status(404).send(buildErrorResponse('PROJECT_NOT_FOUND', 'Project not found', request.requestId))

    const kind = MIME_KIND[body.data.mimeType.toLowerCase()]
    if (!kind) return reply.status(415).send(buildErrorResponse('MIME_NOT_ALLOWED', 'File type is not allowed', request.requestId))
    const entitlement = buildEntitlements(access.plan, access.billingStatus)
    if (!entitlement.features.uploadAssets) return reply.status(403).send(buildErrorResponse('UPLOAD_NOT_ALLOWED', 'Your plan cannot upload assets', request.requestId))
    if (body.data.size > maxBytes(kind, entitlement.limits.assetMb)) return reply.status(413).send(buildErrorResponse('ASSET_TOO_LARGE', `Maximum file size is ${entitlement.limits.assetMb} MB`, request.requestId))

    const countResult = await getPool().query<{ count: string }>(
      `SELECT count(*)::text AS count FROM project_assets WHERE workspace_id = $1 AND deleted_at IS NULL AND status <> 'deleted'`,
      [access.workspaceId],
    )
    if (Number(countResult.rows[0]?.count ?? 0) >= entitlement.limits.userAssets) return reply.status(403).send(buildErrorResponse('ASSET_QUOTA_REACHED', 'Asset quota reached for this plan', request.requestId))

    const config = getR2Config()
    if (!config) return reply.status(503).send(storageUnavailable(request.requestId))
    const assetId = randomUUID()
    const storageKey = `${access.workspaceId}/${params.data.projectId}/${assetId}-${safeName(body.data.filename)}`
    const upload = createPresignedPutUrl(storageKey, body.data.mimeType, config)
    const url = publicAssetUrl(storageKey, config)
    if (!upload || !url) return reply.status(503).send(storageUnavailable(request.requestId))

    const result = await getPool().query<AssetRow>(
      `INSERT INTO project_assets
        (id, project_id, workspace_id, uploaded_by, slot, kind, mime_type, original_name, storage_key, public_url, size_bytes, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'uploading')
       RETURNING *`,
      [assetId, params.data.projectId, access.workspaceId, access.userId, body.data.slot, kind, body.data.mimeType, body.data.filename, storageKey, url, body.data.size],
    )
    return reply.status(201).send({ asset: assetDto(result.rows[0]!), upload, requestId: request.requestId })
  })

  app.post('/v1/projects/:projectId/assets/:assetId/complete', async (request, reply) => {
    const access = await resolveProjectAccess(request)
    if (!access) return reply.status(401).send(buildErrorResponse('UNAUTHORIZED', 'Authentication required', request.requestId))
    if (!canEditProject(access.role)) return reply.status(403).send(buildErrorResponse('FORBIDDEN', 'Editor access required', request.requestId))
    const params = assetParams.safeParse(request.params)
    const body = completeSchema.safeParse(request.body ?? {})
    if (!params.success || !body.success) return reply.status(400).send(buildErrorResponse('VALIDATION_ERROR', 'Invalid asset completion request', request.requestId))
    const durationMs = body.data.duration == null ? null : Math.round(body.data.duration * 1000)
    const result = await getPool().query<AssetRow>(
      `UPDATE project_assets SET status='ready', checksum=$4, width=$5, height=$6, duration_ms=$7, updated_at=now()
        WHERE id=$1 AND project_id=$2 AND workspace_id=$3 AND deleted_at IS NULL AND status IN ('pending','uploading','processing')
        RETURNING *`,
      [params.data.assetId, params.data.projectId, access.workspaceId, body.data.etag ?? null, body.data.width ?? null, body.data.height ?? null, durationMs],
    )
    if (!result.rows[0]) return reply.status(404).send(buildErrorResponse('ASSET_NOT_FOUND', 'Asset not found', request.requestId))
    return reply.status(200).send({ asset: assetDto(result.rows[0]), requestId: request.requestId })
  })

  app.delete('/v1/projects/:projectId/assets/:assetId', async (request, reply) => {
    const access = await resolveProjectAccess(request)
    if (!access) return reply.status(401).send(buildErrorResponse('UNAUTHORIZED', 'Authentication required', request.requestId))
    if (!canEditProject(access.role)) return reply.status(403).send(buildErrorResponse('FORBIDDEN', 'Editor access required', request.requestId))
    const params = assetParams.safeParse(request.params)
    if (!params.success) return reply.status(400).send(buildErrorResponse('VALIDATION_ERROR', 'Invalid asset id', request.requestId))
    const found = await getPool().query<AssetRow>(
      `SELECT * FROM project_assets WHERE id=$1 AND project_id=$2 AND workspace_id=$3 AND deleted_at IS NULL LIMIT 1`,
      [params.data.assetId, params.data.projectId, access.workspaceId],
    )
    const asset = found.rows[0]
    if (!asset) return reply.status(404).send(buildErrorResponse('ASSET_NOT_FOUND', 'Asset not found', request.requestId))
    const deletion = createPresignedDeleteUrl(asset.storage_key)
    if (deletion) {
      const response = await fetch(deletion.url, { method: 'DELETE', headers: deletion.headers })
      if (!response.ok && response.status !== 404) return reply.status(502).send(buildErrorResponse('STORAGE_DELETE_FAILED', 'Could not delete stored asset', request.requestId))
    }
    await getPool().query(`UPDATE project_assets SET status='deleted', deleted_at=now(), updated_at=now() WHERE id=$1`, [asset.id])
    return reply.status(200).send({ status: 'deleted', requestId: request.requestId })
  })
}
