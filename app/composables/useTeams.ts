import { ref } from 'vue'
import type { Team } from '~/types'
import { teamRepository } from '~/services/repository'

export function useTeams() {
  const teams = ref<Team[]>([])
  const loading = ref(false)
  const error = ref('')

  async function fetch() {
    loading.value = true
    error.value = ''
    try {
      teams.value = await teamRepository.list()
    } catch (err) {
      teams.value = []
      error.value = err instanceof Error ? err.message : 'Failed to load teams'
    } finally {
      loading.value = false
    }
  }

  async function fetchById(id: string) {
    loading.value = true
    try {
      return await teamRepository.getById(id)
    } finally {
      loading.value = false
    }
  }

  return { teams, loading, error, fetch, fetchById }
}
