import { ref } from 'vue'
import type { Service } from '~/types'
import { serviceRepository } from '~/services/repository'

export function useServices() {
  const services = ref<Service[]>([])
  const loading = ref(false)
  const error = ref('')

  async function fetch() {
    loading.value = true
    error.value = ''
    try {
      services.value = await serviceRepository.list()
    } catch (err) {
      services.value = []
      error.value = err instanceof Error ? err.message : 'Failed to load services'
    } finally {
      loading.value = false
    }
  }

  async function fetchById(id: string) {
    loading.value = true
    try {
      return await serviceRepository.getById(id)
    } finally {
      loading.value = false
    }
  }

  return { services, loading, error, fetch, fetchById }
}
