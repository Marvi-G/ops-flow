import { useSessionStore } from '~/stores/session'

export default defineNuxtRouteMiddleware(async (to) => {
  const session = useSessionStore()

  if (!session.initialized) {
    await session.fetchMe()
  }

  if (to.path === '/login') {
    return session.isAuthenticated ? navigateTo('/dashboard') : undefined
  }

  if (!session.isAuthenticated) {
    return navigateTo({ path: '/login', query: { redirect: to.fullPath } })
  }
})
