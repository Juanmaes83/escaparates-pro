import type { FastifyRequest } from 'fastify'
import { getPool } from '../db/index.js'
import { findAuthContextByBearerToken } from './auth-context.js'
import { findPrimaryWorkspace } from './workspace-defaults.js'

export type ProjectAccessContext = {
  userId: string
  workspaceId: string
  role: string
  plan: string
  billingStatus: string
}

export async function resolveProjectAccess(
  request: FastifyRequest,
): Promise<ProjectAccessContext | null> {
  const auth = await findAuthContextByBearerToken(request)
  if (!auth) return null

  const workspace = await findPrimaryWorkspace(auth.user.id)
  if (!workspace) return null

  const membership = await getPool().query<{ role: string }>(
    `SELECT role
       FROM workspace_members
      WHERE workspace_id = $1 AND user_id = $2
      LIMIT 1`,
    [workspace.id, auth.user.id],
  )

  const role = membership.rows[0]?.role
  if (!role) return null

  return {
    userId: auth.user.id,
    workspaceId: workspace.id,
    role,
    plan: workspace.plan,
    billingStatus: workspace.billingStatus,
  }
}

export function canEditProject(role: string): boolean {
  return role === 'owner' || role === 'admin' || role === 'editor'
}

export async function projectExistsInWorkspace(
  projectId: string,
  workspaceId: string,
): Promise<boolean> {
  const result = await getPool().query(
    `SELECT 1 FROM projects
      WHERE id = $1 AND workspace_id = $2 AND deleted_at IS NULL
      LIMIT 1`,
    [projectId, workspaceId],
  )
  return result.rowCount === 1
}
