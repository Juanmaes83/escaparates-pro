import { randomUUID } from 'node:crypto'
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { env } from '../config/env.js'
import { getPool } from '../db/index.js'
import { buildEntitlements } from '../lib/entitlements.js'
import { buildErrorResponse } from '../lib/errors.js'
import { canEditProject, projectExistsInWorkspace,