import { ref } from 'vue'
import type { ActivityEvent } from '~/types'
import { activityRepository } from '~/services/repository'

export function useActivity() {
  const events = ref<ActivityEvent[]>([])
  const loading = ref(false)

  async function fetch() {
    loading.value = true
    try {
      events.value = await activityRepository.list()
    } finally {
      loading.value = false
    }
  }

  return { events, loading, fetch }
}
