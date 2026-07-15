import type { FastifyRequest } from 'fastify'
import { getPool } from '../db/index.js'
import { findAuthContextByBearerToken } from './auth-context.js'
import { buildErrorResponse } from './errors.js'
import { findPrimaryWorkspace } from './workspace-defaults.js'

export type ProjectAccessContext = {
  userId: string
  workspaceId: string
  role: string
  plan: string
  billingStatus: string
}

export async function requireProjectAccess(
