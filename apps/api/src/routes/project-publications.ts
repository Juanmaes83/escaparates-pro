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

const paramsSchema = z.object({ projectId: z.string().uuid() })
const publishSchema = z.object({
  slug: z.string().trim().min(3).max(90).optional(),
  snapshot: z.record(z.unknown()).optional(),
})

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90)
}

function containsTemporaryUrl(value: unknown): boolean {
  if (typeof value === 'string') {
    const normalized = value.toLowerCase()
    return normalized.includes('blob:') || normalized.includes('localhost') || normalized.includes('127.0.0.1')
  }
  if (Array.isArray(value)) return value.some(containsTemporaryUrl)
  if (value && typeof value === 'object') return Object.values(value as Record<string, unknown>).some(containsTemporaryUrl)
  return false
}

type PublishProjectRow = {
  id: string
  name: string
  config: Record<string, unknown>
  template_id: string
  template_version: string
  revision: number
}

export async function projectPublicationsRoutes(app: FastifyInstance): Promise<void> {
  app.post('/v1/projects/:projectId/publish', async (request, reply) => {
    const access = await resolveProjectAccess(request)
    if (!access) return reply.status(401).send(buildErrorResponse('UNAUTHORIZED', 'Authentication required', request.requestId))
    if (!canEditProject(access.role)) return reply.status(403).send(buildErrorResponse('FORBIDDEN', 'Editor access required', request.requestId))
    const params = paramsSchema.safeParse(request.params)
    const body = publishSchema.safeParse(request.body ?? {})
    if (!params.success || !body.success) return reply.status(400).send(buildErrorResponse('VALIDATION_ERROR', 'Invalid publish request', request.requestId))

    const client = await getPool().connect()
    try {
      await client.query('BEGIN')
      const projectResult = await client.query<PublishProjectRow>(
        `SELECT p.id, p.name, p.config, m.template_id, m.template_version, m.revision
           FROM projects p
           JOIN project_cloud_metadata m ON m.project_id = p.id
          WHERE p.id = $1 AND p.workspace_id = $2 AND p.deleted_at IS NULL
          FOR UPDATE`,
        [params.data.projectId, access.workspaceId],
      )
      const project = projectResult.rows[0]
      if (!project) {
        await client.query('ROLLBACK')
        return reply.status(404).send(buildErrorResponse('PROJECT_NOT_FOUND', 'Project not found', request.requestId))
      }
      if (!CUSTOM_TEMPLATES.has(project.template_id)) {
        await client.query('ROLLBACK')
        return reply.status(400).send(buildErrorResponse('SOURCE_FAITHFUL_PROTECTED', 'Source Faithful templates cannot be published as editable projects', request.requestId))
      }

      const snapshot = body.data.snapshot ?? project.config
      if (containsTemporaryUrl(snapshot)) {
        await client.query('ROLLBACK')
        return reply.status(422).send(buildErrorResponse('TEMPORARY_ASSET_URL', 'Project contains temporary or local asset URLs', request.requestId))
      }

      const versionResult = await client.query<{ next: number }>(
        `SELECT COALESCE(MAX(version_number), 0) + 1 AS next FROM project_versions WHERE project_id = $1`,
        [project.id],
      )
      const versionNumber = Number(versionResult.rows[0]?.next ?? 1)
      const versionSnapshot = {
        ...snapshot,
        __version: { label: `Publicación ${versionNumber}`, reason: 'publish' },
      }
      await client.query(
        `INSERT INTO project_versions (project_id, version_number, snapshot, created_by)
         VALUES ($1, $2, $3::jsonb, $4)`,
        [project.id, versionNumber, JSON.stringify(versionSnapshot), access.userId],
      )

      const requestedSlug = slugify(body.data.slug ?? project.name)
      const slug = requestedSlug || `proyecto-${project.id.slice(0, 8)}`
      const publicationResult = await client.query<{
        id: string
        slug: string
        status: string
        published_at: Date
        updated_at: Date
      }>(
        `INSERT INTO project_publications
          (project_id, workspace_id, slug, snapshot, version_number, status, published_by)
         VALUES ($1, $2, $3, $4::jsonb, $5, 'published', $6)
         ON CONFLICT (project_id) DO UPDATE
           SET slug = EXCLUDED.slug,
               snapshot = EXCLUDED.snapshot,
               version_number = EXCLUDED.version_number,
               status = 'published',
               published_by = EXCLUDED.published_by,
               updated_at = now(),
               unpublished_at = NULL
         RETURNING id, slug, status, published_at, updated_at`,
        [project.id, access.workspaceId, slug, JSON.stringify(snapshot), versionNumber, access.userId],
      )

      const metadata = await client.query<{ revision: number; published_at: Date }>(
        `UPDATE project_cloud_metadata
            SET status = 'published', published_at = now(), revision = revision + 1, updated_at = now()
          WHERE project_id = $1
          RETURNING revision, published_at`,
        [project.id],
      )
      await client.query('COMMIT')

      const publication = publicationResult.rows[0]!
      return reply.status(200).send({
        publication: {
          id: publication.id,
          slug: publication.slug,
          status: publication.status,
          url: `/p/${publication.slug}`,
          versionNumber,
          publishedAt: publication.published_at.toISOString(),
          updatedAt: publication.updated_at.toISOString(),
        },
        revision: metadata.rows[0]?.revision,
        requestId: request.requestId,
      })
    } catch (error) {
      await client.query('ROLLBACK')
      if ((error as { code?: string }).code === '23505') {
        return reply.status(409).send(buildErrorResponse('SLUG_ALREADY_EXISTS', 'This public slug is already in use', request.requestId))
      }
      throw error
    } finally {
      client.release()
    }
  })

  app.delete('/v1/projects/:projectId/publish', async (request, reply) => {
    const access = await resolveProjectAccess(request)
    if (!access) return reply.status(401).send(buildErrorResponse('UNAUTHORIZED', 'Authentication required', request.requestId))
    if (!canEditProject(access.role)) return reply.status(403).send(buildErrorResponse('FORBIDDEN', 'Editor access required', request.requestId))
    const params = paramsSchema.safeParse(request.params)
    if (!params.success) return reply.status(400).send(buildErrorResponse('VALIDATION_ERROR', 'Invalid project id', request.requestId))

    const client = await getPool().connect()
    try {
      await client.query('BEGIN')
      const result = await client.query(
        `UPDATE project_publications pub
            SET status = 'unpublished', unpublished_at = now(), updated_at = now()
           FROM projects p
          WHERE pub.project_id = p.id
            AND pub.project_id = $1
            AND p.workspace_id = $2
            AND p.deleted_at IS NULL`,
        [params.data.projectId, access.workspaceId],
      )
      if (result.rowCount !== 1) {
        await client.query('ROLLBACK')
        return reply.status(404).send(buildErrorResponse('PUBLICATION_NOT_FOUND', 'Publication not found', request.requestId))
      }
      await client.query(
        `UPDATE project_cloud_metadata
            SET status = 'draft', published_at = NULL, revision = revision + 1, updated_at = now()
          WHERE project_id = $1`,
        [params.data.projectId],
      )
      await client.query('COMMIT')
      return reply.status(200).send({ status: 'unpublished', requestId: request.requestId })
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  })

  app.get('/v1/publications/:slug', async (request, reply) => {
    const slug = z.string().min(3).max(90).safeParse((request.params as { slug?: string }).slug)
    if (!slug.success) return reply.status(400).send(buildErrorResponse('VALIDATION_ERROR', 'Invalid publication slug', request.requestId))

    const result = await getPool().query<{
      slug: string
      snapshot: Record<string, unknown>
      version_number: number
      published_at: Date
      updated_at: Date
    }>(
      `SELECT slug, snapshot, version_number, published_at, updated_at
         FROM project_publications
        WHERE slug = $1 AND status = 'published'
        LIMIT 1`,
      [slug.data],
    )
    const publication = result.rows[0]
    if (!publication) return reply.status(404).send(buildErrorResponse('PUBLICATION_NOT_FOUND', 'Publication not found', request.requestId))

    return reply.status(200).send({
      publication: {
        slug: publication.slug,
        snapshot: publication.snapshot,
        versionNumber: publication.version_number,
        publishedAt: publication.published_at.toISOString(),
        updatedAt: publication.updated_at.toISOString(),
      },
      requestId: request.requestId,
    })
  })
}
