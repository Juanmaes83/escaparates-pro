import { eq } from 'drizzle-orm'
import { getDb } from '../db/index.js'
import { workspaceMembers, workspaces } from '../db/schema.js'

type UserForWorkspace = {
  id: string
  email: string
  name: string | null
}

function buildWorkspaceName(user: UserForWorkspace): string {
  return user.name?.trim() || user.email
}

function buildWorkspaceSlug(user: UserForWorkspace): string {
  return `personal-${user.id.slice(0, 8)}`
}

export async function findPrimaryWorkspace(userId: string) {
  const rows = await getDb()
    .select()
    .from(workspaces)
    .where(eq(workspaces.ownerUserId, userId))
    .limit(1)

  return rows[0] ?? null
}

export async function ensureDefaultWorkspace(user: UserForWorkspace) {
  const existing = await findPrimaryWorkspace(user.id)
  if (existing) {
    return existing
  }

  const [workspace] = await getDb()
    .insert(workspaces)
    .values({
      name: buildWorkspaceName(user),
      slug: buildWorkspaceSlug(user),
      ownerUserId: user.id,
      plan: 'free',
      billingStatus: 'free',
    })
    .returning()

  if (!workspace) {
    throw new Error('Workspace could not be created')
  }

  await getDb()
    .insert(workspaceMembers)
    .values({
      workspaceId: workspace.id,
      userId: user.id,
      role: 'owner',
    })
    .onConflictDoNothing()

  return workspace
}
