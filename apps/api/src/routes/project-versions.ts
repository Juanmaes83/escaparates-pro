import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { getPool } from '../db/index.js'
import { buildErrorResponse } from '../lib/errors.js'
import { canEditProject, resolveProjectAccess } from '../lib/project-access.js'

const paramsSchema = z.object({ projectId: z.string().uuid() })
const versionParamsSchema = z.object({
  projectId: z.string().uuid(),
  versionId: z.string().uuid(),
})
const createVersionSchema = z.object({
  label: z.string().trim().min(1).max(120).optional(),
  reason: z.string().trim().min(1).max(80).optional(),
  snapshot: z.record(z.unknown()).optional(),
})

type VersionRow = {
  id: string
  project_id: string
  version_number: number
  snapshot: Record<string, unknown>
  created_by: string
  created_at: Date
}

function toVersion(row: VersionRow) {
  const metadata = (row.snapshot?.__version ?? {}) as Record<string, unknown>
  return {
    id: row.id,
    projectId: row.project_id,
    versionNumber: row.version_number,
    label: typeof metadata.label === 'string' ? metadata.label : `Versión ${row.version_number}`,
    reason: typeof metadata.reason === 'string' ? metadata.reason : 'manual',
    snapshot: row.snapshot,
    createdBy: row.created_by,
    createdAt: row.created_at.toISOString(),
  }
}

export async function projectVersionsRoutes(app: FastifyInstance): Promise<void> {
  app.get('/v1/projects/:projectId/versions', async (request, reply) => {
    const access = await resolveProjectAccess(request)
    if (!access) return reply.status(401).send(buildErrorResponse('UNAUTHORIZED', 'Authentication required', request.requestId))
    const params = paramsSchema.safeParse(request.params)
    if (!params.success) return reply.status(400).send(buildErrorResponse('VALIDATION_ERROR', 'Invalid project id', request.requestId))

    const result = await getPool().query<VersionRow>(
      `SELECT v.id, v.project_id, v.version_number, v.snapshot, v.created_by, v.created_at
         FROM project_versions v
         JOIN projects p ON p.id = v.project_id
        WHERE v.project_id = $1 AND p.workspace_id = $2 AND p.deleted_at IS NULL
        ORDER BY v.version_number DESC`,
      [params.data.projectId, access.workspaceId],
    )
    return reply.status(200).send({ versions: result.rows.map(toVersion), requestId: request.requestId })
  })

  app.post('/v1/projects/:projectId/versions', async (request, reply) => {
    const access = await resolveProjectAccess(request)
    if (!access) return reply.status(401).send(buildErrorResponse('UNAUTHORIZED', 'Authentication required', request.requestId))
    if (!canEditProject(access.role)) return reply.status(403).send(buildErrorResponse('FORBIDDEN', 'Editor access required', request.requestId))
    const params = paramsSchema.safeParse(request.params)
    const body = createVersionSchema.safeParse(request.body ?? {})
    if (!params.success || !body.success) return reply.status(400).send(buildErrorResponse('VALIDATION_ERROR', 'Invalid version request', request.requestId))

    const client = await getPool().connect()
    try {
      await client.query('BEGIN')
      const project = await client.query<{ config: Record<string, unknown> }>(
        `SELECT config FROM projects
          WHERE id = $1 AND workspace_id = $2 AND deleted_at IS NULL
          FOR UPDATE`,
        [params.data.projectId, access.workspaceId],
      )
      if (!project.rows[0]) {
        await client.query('ROLLBACK')
        return reply.status(404).send(buildErrorResponse('PROJECT_NOT_FOUND', 'Project not found', request.requestId))
      }
      const numberResult = await client.query<{ next: number }>(
        `SELECT COALESCE(MAX(version_number), 0) + 1 AS next
           FROM project_versions WHERE project_id = $1`,
        [params.data.projectId],
      )
      const next = Number(numberResult.rows[0]?.next ?? 1)
      const snapshot = {
        ...(body.data.snapshot ?? project.rows[0].config),
        __version: {
          label: body.data.label ?? `Versión ${next}`,
          reason: body.data.reason ?? 'manual',
        },
      }
      const inserted = await client.query<VersionRow>(
        `INSERT INTO project_versions (project_id, version_number, snapshot, created_by)
         VALUES ($1, $2, $3::jsonb, $4)
         RETURNING id, project_id, version_number, snapshot, created_by, created_at`,
        [params.data.projectId, next, JSON.stringify(snapshot), access.userId],
      )
      await client.query('COMMIT')
      return reply.status(201).send({ version: toVersion(inserted.rows[0]!), requestId: request.requestId })
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  })

  app.post('/v1/projects/:projectId/versions/:versionId/restore', async (request, reply) => {
    const access = await resolveProjectAccess(request)
    if (!access) return reply.status(401).send(buildErrorResponse('UNAUTHORIZED', 'Authentication required', request.requestId))
    if (!canEditProject(access.role)) return reply.status(403).send(buildErrorResponse('FORBIDDEN', 'Editor access required', request.requestId))
    const params = versionParamsSchema.safeParse(request.params)
    if (!params.success) return reply.status(400).send(buildErrorResponse('VALIDATION_ERROR', 'Invalid version id', request.requestId))

    const client = await getPool().connect()
    try {
      await client.query('BEGIN')
      const version = await client.query<VersionRow>(
        `SELECT v.id, v.project_id, v.version_number, v.snapshot, v.created_by, v.created_at
           FROM project_versions v
           JOIN projects p ON p.id = v.project_id
          WHERE v.id = $1 AND v.project_id = $2 AND p.workspace_id = $3 AND p.deleted_at IS NULL
          FOR UPDATE`,
        [params.data.versionId, params.data.projectId, access.workspaceId],
      )
      const row = version.rows[0]
      if (!row) {
        await client.query('ROLLBACK')
        return reply.status(404).send(buildErrorResponse('VERSION_NOT_FOUND', 'Version not found', request.requestId))
      }
      const restored = { ...row.snapshot }
      delete restored.__version
      const restoredName = typeof restored.name === 'string' ? restored.name : 'Proyecto restaurado'
      await client.query(
        `UPDATE projects SET name = $3, config = $4::jsonb, updated_at = now()
          WHERE id = $1 AND workspace_id = $2`,
        [params.data.projectId, access.workspaceId, restoredName, JSON.stringify(restored)],
      )
      const metadata = await client.query<{ revision: number }>(
        `UPDATE project_cloud_metadata
            SET revision = revision + 1, status = 'draft', published_at = NULL, updated_at = now()
          WHERE project_id = $1
          RETURNING revision`,
        [params.data.projectId],
      )
      await client.query('COMMIT')
      return reply.status(200).send({
        project: { ...restored, cloudId: params.data.projectId, revision: metadata.rows[0]?.revision },
        restoredVersion: toVersion(row),
        requestId: request.requestId,
      })
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  })
}
