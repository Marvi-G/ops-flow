import type { User } from '~/types'

/**
 * Mirrors ROLE_PERMISSIONS in apps/api/src/middleware/authorize.ts.
 * This only decides what the UI shows. The API still enforces every permission,
 * so a mismatch here can hide a button but never grant access.
 */
export type Permission =
  | 'incidents.read' | 'incidents.create' | 'incidents.update' | 'incidents.delete'
  | 'projects.read' | 'projects.create' | 'projects.update' | 'projects.delete'
  | 'services.read' | 'services.manage'
  | 'members.read' | 'members.invite' | 'members.manage'
  | 'settings.manage'

const viewer: Permission[] = ['incidents.read', 'projects.read', 'services.read', 'members.read']

const member: Permission[] = [
  ...viewer,
  'incidents.create', 'incidents.update',
  'projects.create', 'projects.update',
  'services.manage'
]

const admin: Permission[] = [
  ...member,
  'incidents.delete', 'projects.delete',
  'members.invite', 'members.manage',
  'settings.manage'
]

const ROLE_PERMISSIONS: Record<User['role'], Permission[]> = {
  viewer,
  member,
  admin,
  owner: admin
}

export function roleCan(role: User['role'] | undefined, permission: Permission): boolean {
  return role ? ROLE_PERMISSIONS[role].includes(permission) : false
}

const ROLE_RANK: Record<User['role'], number> = { viewer: 0, member: 1, admin: 2, owner: 3 }

export const ALL_ROLES: User['role'][] = ['owner', 'admin', 'member', 'viewer']

/**
 * Mirrors the member rules in apps/api/src/modules/organizations/service.ts:
 * never yourself, owners can manage everyone, everyone else only people ranked below them.
 */
export function canManageMember(actor: Pick<User, 'id' | 'role'>, target: Pick<User, 'id' | 'role'>): boolean {
  if (!roleCan(actor.role, 'members.manage')) return false
  if (actor.id === target.id) return false
  if (actor.role === 'owner') return true
  return ROLE_RANK[target.role] < ROLE_RANK[actor.role]
}

/** The roles someone may hand out: owners any role, others only roles below their own. */
export function assignableRoles(actorRole: User['role']): User['role'][] {
  if (actorRole === 'owner') return ALL_ROLES
  return ALL_ROLES.filter(role => ROLE_RANK[role] < ROLE_RANK[actorRole])
}
