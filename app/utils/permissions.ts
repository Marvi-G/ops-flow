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
