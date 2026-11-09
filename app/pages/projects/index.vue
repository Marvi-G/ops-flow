<script setup lang="ts">
import { useProjects } from '~/composables/useProjects'
import { formatRelativeTime } from '~/utils'
import type { Project } from '~/types'

definePageMeta({ layout: 'default' })

const { projects, loading, error, fetch: fetchProjects } = useProjects()
const search = ref('')
const { can } = usePermissions()
const showForm = ref(false)

function onCreated(project: Project) {
  navigateTo(`/projects/${project.id}`)
}

const filteredProjects = computed(() => {
  if (!search.value) return projects.value
  const q = search.value.toLowerCase()
  return projects.value.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.description.toLowerCase().includes(q)
  )
})

onMounted(() => fetchProjects())
</script>

<template>
  <div>
    <SharedPageHeader title="Projects" description="Manage your organization's projects">
      <template #actions>
        <UButton v-if="can('projects.create')" color="primary" size="sm" icon="i-lucide-plus" label="New project" @click="showForm = true" />
      </template>
    </SharedPageHeader>

    <ProjectsFormModal v-model:open="showForm" @saved="onCreated" />

    <!-- Search -->
    <div class="mb-4">
      <div class="relative max-w-xs">
        <UIcon name="i-lucide-search" class="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
        <input
          v-model="search"
          type="text"
          placeholder="Search projects..."
          class="h-8 w-full rounded-md border border-neutral-200 bg-white pl-8 pr-3 text-[13px] text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-neutral-300 dark:bg-neutral-100 dark:text-neutral-800"
        />
      </div>
    </div>

    <div v-if="loading">
      <SharedLoadingSkeleton :rows="4" :columns="3" />
    </div>

    <div v-else-if="error" class="rounded-md bg-danger-50 p-3 text-[13px] text-danger-500 dark:bg-danger-50/20">
      {{ error }}
    </div>

    <div v-else-if="filteredProjects.length === 0">
      <div class="rounded-lg border border-neutral-200 bg-white dark:border-neutral-300 dark:bg-neutral-100">
        <SharedEmptyState icon="i-lucide-folder-kanban" title="No projects found" description="Try adjusting your search or create a new project." />
      </div>
    </div>

    <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <NuxtLink
        v-for="project in filteredProjects"
        :key="project.id"
        :to="`/projects/${project.id}`"
        class="rounded-lg border border-neutral-200 bg-white p-4 transition-colors hover:border-neutral-300 hover:shadow-sm dark:border-neutral-300 dark:bg-neutral-100 dark:hover:border-neutral-400"
      >
        <div class="mb-3 flex items-start justify-between">
          <div>
            <h3 class="text-[14px] font-semibold text-neutral-900 dark:text-neutral-800">{{ project.name }}</h3>
            <p class="mt-0.5 text-[12px] text-neutral-500 line-clamp-2">{{ project.description }}</p>
          </div>
          <span
            :class="[
              'shrink-0 rounded-md px-2 py-0.5 text-[11px] font-medium',
              project.status === 'active' ? 'bg-success-50 text-success-500 dark:bg-success-50/20 dark:text-success-700' :
              project.status === 'maintenance' ? 'bg-warning-50 text-warning-500 dark:bg-warning-50/20 dark:text-warning-700' :
              'bg-neutral-100 text-neutral-500 dark:bg-neutral-200 dark:text-neutral-500'
            ]"
          >
            {{ project.status === 'active' ? 'Active' : project.status === 'maintenance' ? 'Maintenance' : 'Archived' }}
          </span>
        </div>

        <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-neutral-500">
          <span class="flex items-center gap-1">
            <UIcon name="i-lucide-server" class="h-3 w-3" />
            {{ project.serviceCount }} services
          </span>
          <span class="flex items-center gap-1">
            <UIcon name="i-lucide-alert-triangle" class="h-3 w-3" />
            {{ project.activeIncidentCount }} active
          </span>
        </div>

        <div class="mt-3 flex items-center justify-between text-[12px] text-neutral-400">
          <span>{{ project.team?.name }}</span>
          <span>{{ formatRelativeTime(project.lastActivity) }}</span>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>
