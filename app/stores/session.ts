import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, Organization, Notification } from '~/types'
import { currentUser, currentOrganization, organizations, notifications as mockNotifications } from '~/services/mock-data'

export const useSessionStore = defineStore('session', () => {
  const user = ref<User>({ ...currentUser })
  const organization = ref<Organization>({ ...currentOrganization })
  const allOrganizations = ref<Organization[]>([...organizations])
  const notificationsList = ref<Notification[]>([...mockNotifications])

  const unreadCount = computed(() =>
    notificationsList.value.filter(n => !n.read).length
  )

  function markAllRead() {
    notificationsList.value.forEach(n => { n.read = true })
  }

  function switchOrganization(orgId: string) {
    const org = allOrganizations.value.find(o => o.id === orgId)
    if (org) {
      organization.value = { ...org }
    }
  }

  return {
    user,
    organization,
    allOrganizations,
    notificationsList,
    unreadCount,
    markAllRead,
    switchOrganization
  }
})
