import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { getPool } from '../db/index.js'
import { buildErrorResponse } from '../lib/errors.js'
import { canEditProject, resolveProjectAccess } from '../lib/project-access.js'

const CUSTOM_TEMPLATES = new Set([
  'real-estate-storytelling-custom-pro',
  'product-storytelling-custom-pro',
  'luxury-real-estate-custom-pro',
])

const projectDocumentSchema = z
  .object({
    name: z.string().trim().min(1).max(160),
    templateId: z.string().refine((value) => CUSTOM_TEMPLATES.has(value), {
      message: 'Only Custom PRO templates can be saved as cloud projects',
    }),
    templateVersion: z.string().trim().min(1).max(40).default('1.0.0'),
    thumbnailUrl: z.string().url().nullable().optional(),
    config: z.record(z.unknown()).default({}),
    media: z.array(z.unknown()).default([]),
    responsive: z.record(z.unknown()).default({}),
    seo: z.record(z.unknown()).default({}),
    status: z.enum(['draft', 'ready', 'published', 'archived']).default('draft'),
    lastEditedDevice: z.string().trim().max(160).nullable().optional(),
  })
  .passthrough()

const updateProjectSchema = projectDocumentSchema.partial().extend({
  archived: z.boolean().optional(),
})

const listSchema = z.object({
  search: z.string().trim().max(120).optional(),
  status: z.enum(['draft', 'ready', 'published', 'archived']).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(30),
  offset: z.coerce.number().int().min(0).default(0),
})

type ProjectRow = {
  id: string
  name: string
  thumbnail_url: string | null
  config: Record<string, unknown>
  created_at: Date
  updated_at: Date
  template_id: string
  template_version: string
  status: string
  revision: number
  archived_at: Date | null
  last_edited_device: string | null
  published_at: Date | null
}

function toProject(row: ProjectRow) {
  const document = row.config && typeof row.config === 'object' ? row.config : {}
  return {
    ...document,
    id: row.id,
    cloudId: row.id,
    name: row.name,
    thumbnailUrl: row.thumbnail_url,
    templateId: row.template_id,
    templateVersion: row.template_version,
    status: row.status,
    revision: row.revision,
    archivedAt: row.archived_at?.toISOString() ?? null,
    lastEditedDevice: row.last_edited_device,
    publishedAt: row.published_at?.toISOString() ?? null,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  }
}

const projectSelect = `
  SELECT p.id, p.name, p.thumbnail_url, p.config, p.created_at, p.updated_at,
         m.template_id, m.template_version, m.status, m.revision,
         m.archived_at, m.last_edited_device, m.published_at
    FROM projects p
    JOIN project_cloud_metadata m ON m.project_id = p.id
`

export async function projectsRoutes(app: FastifyInstance): Promise<void> {
  app.get('/v1/projects', async (request, reply) => {
    const access = await resolveProjectAccess(request)
    if (!access) {
      return reply.status(401).send(
        buildErrorResponse('UNAUTHORIZED', 'Authentication required', request.requestId),
      )
    }

    const parsed = listSchema.safeParse(request.query)
    if (!parsed.success) {
      return reply.status(400).send(
        buildErrorResponse('VALIDATION_ERROR', 'Invalid project filters', request.requestId),
      )
    }

    const values: unknown[] = [access.workspaceId]
    const filters = ['p.workspace_id = $1', 'p.deleted_at IS NULL']
    if (parsed.data.search) {
      values.push(`%${parsed.data.search}%`)
      filters.push(`p.name ILIKE $${values.length}`)
    }
    if (parsed.data.status) {
      values.push(parsed.data.status)
      filters.push(`m.status = $${values.length}`)
    }
    values.push(parsed.data.limit, parsed.data.offset)

    const result = await getPool().query<ProjectRow>(
      `${projectSelect}
        WHERE ${filters.join(' AND ')}
        ORDER BY p.updated_at DESC
        LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values,
    )

    return reply.status(200).send({
      projects: result.rows.map(toProject),
      pagination: { limit: parsed.data.limit, offset: parsed.data.offset },
      requestId: request.requestId,
    })
  })

  app.post('/v1/projects', async (request, reply) => {
    const access = await resolveProjectAccess(request)
    if (!access) {
      return reply.status(401).send(
        buildErrorResponse('UNAUTHORIZED', 'Authentication required', request.requestId),
      )
    }
    if (!canEditProject(access.role)) {
      return reply.status(403).send(
        buildErrorResponse('FORBIDDEN', 'Editor access required', request.requestId),
      )
    }

    const parsed = projectDocumentSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send(
        buildErrorResponse('VALIDATION_ERROR', parsed.error.issues[0]?.message ?? 'Invalid project', request.requestId),
      )
    }

    const client = await getPool().connect()
    try {
      await client.query('BEGIN')
      const projectResult = await client.query<{ id: string }>(
        `INSERT INTO projects (workspace_id, name, thumbnail_url, config, created_by)
         VALUES ($1, $2, $3, $4::jsonb, $5)
         RETURNING id`,
        [access.workspaceId, parsed.data.name, parsed.data.thumbnailUrl ?? null, JSON.stringify(parsed.data), access.userId],
      )
      const projectId = projectResult.rows[0]?.id
      if (!projectId) throw new Error('Project could not be created')

      await client.query(
        `INSERT INTO project_cloud_metadata
          (project_id, template_id, template_version, status, last_edited_device)
         VALUES ($1, $2, $3, $4, $5)`,
        [projectId, parsed.data.templateId, parsed.data.templateVersion, parsed.data.status, parsed.data.lastEditedDevice ?? null],
      )
      await client.query('COMMIT')

      const created = await getPool().query<ProjectRow>(
        `${projectSelect} WHERE p.id = $1 AND p.workspace_id = $2`,
        [projectId, access.workspaceId],
      )
      return reply.status(201).send({ project: toProject(created.rows[0]!), requestId: request.requestId })
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  })

  app.get('/v1/projects/:projectId', async (request, reply) => {
    const access = await resolveProjectAccess(request)
    if (!access) {
      return reply.status(401).send(buildErrorResponse('UNAUTHORIZED', 'Authentication required', request.requestId))
    }
    const projectId = z.string().uuid().safeParse((request.params as { projectId?: string }).projectId)
    if (!projectId.success) {
      return reply.status(400).send(buildErrorResponse('VALIDATION_ERROR', 'Invalid project id', request.requestId))
    }

    const result = await getPool().query<ProjectRow>(
      `${projectSelect} WHERE p.id = $1 AND p.workspace_id = $2 AND p.deleted_at IS NULL`,
      [projectId.data, access.workspaceId],
    )
    if (!result.rows[0]) {
      return reply.status(404).send(buildErrorResponse('PROJECT_NOT_FOUND', 'Project not found', request.requestId))
    }
    return reply.status(200).send({ project: toProject(result.rows[0]), requestId: request.requestId })
  })

  app.patch('/v1/projects/:projectId', async (request, reply) => {
    const access = await resolveProjectAccess(request)
    if (!access) {
      return reply.status(401).send(buildErrorResponse('UNAUTHORIZED', 'Authentication required', request.requestId))
    }
    if (!canEditProject(access.role)) {
      return reply.status(403).send(buildErrorResponse('FORBIDDEN', 'Editor access required', request.requestId))
    }
    const projectId = z.string().uuid().safeParse((request.params as { projectId?: string }).projectId)
    const parsed = updateProjectSchema.safeParse(request.body)
    if (!projectId.success || !parsed.success) {
      return reply.status(400).send(buildErrorResponse('VALIDATION_ERROR', 'Invalid project update', request.requestId))
    }

    const expectedHeader = request.headers['if-match']
    const expectedRevision = expectedHeader === undefined ? null : Number(expectedHeader)
    if (expectedRevision !== null && (!Number.isInteger(expectedRevision) || expectedRevision < 1)) {
      return reply.status(400).send(buildErrorResponse('VALIDATION_ERROR', 'Invalid If-Match revision', request.requestId))
    }

    const client = await getPool().connect()
    try {
      await client.query('BEGIN')
      const currentResult = await client.query<ProjectRow>(
        `${projectSelect} WHERE p.id = $1 AND p.workspace_id = $2 AND p.deleted_at IS NULL FOR UPDATE`,
        [projectId.data, access.workspaceId],
      )
      const current = currentResult.rows[0]
      if (!current) {
        await client.query('ROLLBACK')
        return reply.status(404).send(buildErrorResponse('PROJECT_NOT_FOUND', 'Project not found', request.requestId))
      }
      if (expectedRevision !== null && current.revision !== expectedRevision) {
        await client.query('ROLLBACK')
        return reply.status(409).send(buildErrorResponse('PROJECT_CONFLICT', 'Project was modified on another device', request.requestId))
      }

      const nextDocument = { ...(current.config ?? {}), ...parsed.data }
      delete (nextDocument as Record<string, unknown>).archived
      const nextStatus = parsed.data.archived === true ? 'archived' : parsed.data.archived === false && current.status === 'archived' ? 'draft' : parsed.data.status ?? current.status
      const archivedAt = parsed.data.archived === true ? new Date() : parsed.data.archived === false ? null : current.archived_at

      await client.query(
        `UPDATE projects
            SET name = $3, thumbnail_url = $4, config = $5::jsonb, updated_at = now()
          WHERE id = $1 AND workspace_id = $2`,
        [projectId.data, access.workspaceId, parsed.data.name ?? current.name, parsed.data.thumbnailUrl === undefined ? current.thumbnail_url : parsed.data.thumbnailUrl, JSON.stringify(nextDocument)],
      )
      await client.query(
        `UPDATE project_cloud_metadata
            SET template_id = $2, template_version = $3, status = $4,
                archived_at = $5, last_edited_device = $6,
                revision = revision + 1, updated_at = now()
          WHERE project_id = $1`,
        [projectId.data, parsed.data.templateId ?? current.template_id, parsed.data.templateVersion ?? current.template_version, nextStatus, archivedAt, parsed.data.lastEditedDevice === undefined ? current.last_edited_device : parsed.data.lastEditedDevice],
      )
      await client.query('COMMIT')

      const updated = await getPool().query<ProjectRow>(
        `${projectSelect} WHERE p.id = $1 AND p.workspace_id = $2`,
        [projectId.data, access.workspaceId],
      )
      return reply.status(200).send({ project: toProject(updated.rows[0]!), requestId: request.requestId })
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  })

  app.delete('/v1/projects/:projectId', async (request, reply) => {
    const access = await resolveProjectAccess(request)
    if (!access) return reply.status(401).send(buildErrorResponse('UNAUTHORIZED', 'Authentication required', request.requestId))
    if (!canEditProject(access.role)) return reply.status(403).send(buildErrorResponse('FORBIDDEN', 'Editor access required', request.requestId))
    const projectId = z.string().uuid().safeParse((request.params as { projectId?: string }).projectId)
    if (!projectId.success) return reply.status(400).send(buildErrorResponse('VALIDATION_ERROR', 'Invalid project id', request.requestId))

    const result = await getPool().query(
      `UPDATE projects SET deleted_at = now(), updated_at = now()
        WHERE id = $1 AND workspace_id = $2 AND deleted_at IS NULL`,
      [projectId.data, access.workspaceId],
    )
    if (result.rowCount !== 1) return reply.status(404).send(buildErrorResponse('PROJECT_NOT_FOUND', 'Project not found', request.requestId))
    return reply.status(200).send({ status: 'deleted', requestId: request.requestId })
  })

  app.post('/v1/projects/:projectId/duplicate', async (request, reply) => {
    const access = await resolveProjectAccess(request)
    if (!access) return reply.status(401).send(buildErrorResponse('UNAUTHORIZED', 'Authentication required', request.requestId))
    if (!canEditProject(access.role)) return reply.status(403).send(buildErrorResponse('FORBIDDEN', 'Editor access required', request.requestId))
    const projectId = z.string().uuid().safeParse((request.params as { projectId?: string }).projectId)
    const body = z.object({ name: z.string().trim().min(1).max(160).optional() }).safeParse(request.body ?? {})
    if (!projectId.success || !body.success) return reply.status(400).send(buildErrorResponse('VALIDATION_ERROR', 'Invalid duplicate request', request.requestId))

    const source = await getPool().query<ProjectRow>(
      `${projectSelect} WHERE p.id = $1 AND p.workspace_id = $2 AND p.deleted_at IS NULL`,
      [projectId.data, access.workspaceId],
    )
    const row = source.rows[0]
    if (!row) return reply.status(404).send(buildErrorResponse('PROJECT_NOT_FOUND', 'Project not found', request.requestId))

    const document = { ...(row.config ?? {}), name: body.data.name ?? `${row.name} — copia`, status: 'draft' }
    const client = await getPool().connect()
    try {
      await client.query('BEGIN')
      const inserted = await client.query<{ id: string }>(
        `INSERT INTO projects (workspace_id, name, thumbnail_url, config, created_by)
         VALUES ($1, $2, $3, $4::jsonb, $5) RETURNING id`,
        [access.workspaceId, document.name, row.thumbnail_url, JSON.stringify(document), access.userId],
      )
      const duplicateId = inserted.rows[0]!.id
      await client.query(
        `INSERT INTO project_cloud_metadata (project_id, template_id, template_version, status, last_edited_device)
         VALUES ($1, $2, $3, 'draft', $4)`,
        [duplicateId, row.template_id, row.template_version, row.last_edited_device],
      )
      await client.query('COMMIT')
      const duplicate = await getPool().query<ProjectRow>(`${projectSelect} WHERE p.id = $1`, [duplicateId])
      return reply.status(201).send({ project: toProject(duplicate.rows[0]!), requestId: request.requestId })
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  })
}
