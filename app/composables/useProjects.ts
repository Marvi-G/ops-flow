import { ref } from 'vue'
import type { Project } from '~/types'
import { projectRepository } from '~/services/repository'

export function useProjects() {
  const projects = ref<Project[]>([])
  const loading = ref(false)
  const error = ref('')

  async function fetch() {
    loading.value = true
    error.value = ''
    try {
      projects.value = await projectRepository.list()
    } catch (err) {
      projects.value = []
      error.value = err instanceof Error ? err.message : 'Failed to load projects'
    } finally {
      loading.value = false
    }
  }

  async function fetchById(id: string) {
    loading.value = true
    try {
      return await projectRepository.getById(id)
    } finally {
      loading.value = false
    }
  }

  return { projects, loading, error, fetch, fetchById }
}
