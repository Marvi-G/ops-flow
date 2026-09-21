import { ref } from 'vue'
import type { Project } from '~/types'
import { projectRepository } from '~/services/repository'

export function useProjects() {
  const projects = ref<Project[]>([])
  const loading = ref(false)

  async function fetch() {
    loading.value = true
    try {
      projects.value = await projectRepository.list()
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

  return { projects, loading, fetch, fetchById }
}
