import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, Organization, Notification } from '~/types'
import { notifications as mockNotifications } from '~/services/mock-data'
import { api, ApiError } from '~/services/api'
import { mapSession, type ApiMe } from '~/services/mappers'

// Components read user/organization without null checks. The auth middleware keeps
// protected pages from rendering until fetchMe() has filled these in.
const emptyUser = (): User => ({ id: '', name: '', email: '', role: 'viewer', organizationId: '' })
const emptyOrganization = (): Organization => ({
  id: '', name: '', slug: '', plan: 'free', memberCount: 0, createdAt: ''
})

export const useSessionStore = defineStore('session', () => {
  const user = ref<User>(emptyUser())
  const organization = ref<Organization>(emptyOrganization())
  const allOrganizations = ref<Organization[]>([])
  // Notifications stay on mock data until the notifications module exists (Phase 9)
  const notificationsList = ref<Notification[]>([...mockNotifications])

  const isAuthenticated = ref(false)
  // True once fetchMe() has run, so the middleware only checks the session once per load
  const initialized = ref(false)

  const unreadCount = computed(() =>
    notificationsList.value.filter(n => !n.read).length
  )

  function reset() {
    user.value = emptyUser()
    organization.value = emptyOrganization()
    allOrganizations.value = []
    isAuthenticated.value = false
  }

  /** Loads the current session from the API. Returns false when not signed in. */
  async function fetchMe(): Promise<boolean> {
    try {
      const me = await api.get<ApiMe>('/auth/me')
      const session = mapSession(me)
      user.value = session.user
      organization.value = session.organization
      allOrganizations.value = session.allOrganizations
      isAuthenticated.value = true
      return true
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        reset()
        return false
      }
      throw err
    } finally {
      initialized.value = true
    }
  }

  async function expireSession() {
    reset()
    const route = useRoute()
    if (route.path !== '/login') {
      await navigateTo({ path: '/login', query: { redirect: route.fullPath } })
    }
  }

  async function login(email: string, password: string) {
    await api.post('/auth/login', { email, password })
    await fetchMe()
  }

  async function logout() {
    try {
      await api.post('/auth/logout')
    } finally {
      reset()
      await navigateTo('/login')
    }
  }

  async function switchOrganization(orgId: string) {
    await api.post('/auth/switch-organization', { organizationId: orgId })
    await fetchMe()
  }

  function markAllRead() {
    notificationsList.value.forEach(n => { n.read = true })
  }

  return {
    user,
    organization,
    allOrganizations,
    notificationsList,
    isAuthenticated,
    initialized,
    unreadCount,
    fetchMe,
    expireSession,
    login,
    logout,
    switchOrganization,
    markAllRead
  }
})
