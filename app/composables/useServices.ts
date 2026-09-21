import { ref } from 'vue'
import type { Service } from '~/types'
import { serviceRepository } from '~/services/repository'

export function useServices() {
  const services = ref<Service[]>([])
  const loading = ref(false)

  async function fetch() {
    loading.value = true
    try {
      services.value = await serviceRepository.list()
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

  return { services, loading, fetch, fetchById }
}
