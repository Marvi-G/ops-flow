import { useSessionStore } from '~/stores/session'
import { roleCan, type Permission } from '~/utils/permissions'

/** `can('incidents.update')` for the signed-in user, reactive to role changes. */
export function usePermissions() {
  const session = useSessionStore()
  return {
    can: (permission: Permission) => roleCan(session.user.role, permission)
  }
}
