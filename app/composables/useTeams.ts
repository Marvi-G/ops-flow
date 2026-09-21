import { ref } from 'vue'
import type { Team } from '~/types'
import { teamRepository } from '~/services/repository'

export function useTeams() {
  const teams = ref<Team[]>([])
  const loading = ref(false)

  async function fetch() {
    loading.value = true
    try {
      teams.value = await teamRepository.list()
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

  return { teams, loading, fetch, fetchById }
}
