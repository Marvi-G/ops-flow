<script setup lang="ts">
import { useTeams } from '~/composables/useTeams'

definePageMeta({ layout: 'default' })

const { teams, loading, error, fetch: fetchTeams } = useTeams()
const search = ref('')

const filteredTeams = computed(() => {
  if (!search.value) return teams.value
  const q = search.value.toLowerCase()
  return teams.value.filter(t => t.name.toLowerCase().includes(q))
})

onMounted(() => fetchTeams())
</script>

<template>
  <div>
    <SharedPageHeader title="Teams" description="Manage your organization's teams">
      <template #actions>
        <UButton color="primary" size="sm" icon="i-lucide-plus" label="Create team" />
      </template>
    </SharedPageHeader>

    <!-- Search -->
    <div class="mb-4">
      <div class="relative max-w-xs">
        <UIcon name="i-lucide-search" class="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
        <input
          v-model="search"
          type="text"
          placeholder="Search teams..."
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

    <div v-else-if="filteredTeams.length === 0">
      <div class="rounded-lg border border-neutral-200 bg-white dark:border-neutral-300 dark:bg-neutral-100">
        <SharedEmptyState icon="i-lucide-users" title="No teams found" description="Try adjusting your search or create a new team." />
      </div>
    </div>

    <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <NuxtLink
        v-for="team in filteredTeams"
        :key="team.id"
        :to="`/teams/${team.id}`"
        class="rounded-lg border border-neutral-200 bg-white p-4 transition-colors hover:border-neutral-300 hover:shadow-sm dark:border-neutral-300 dark:bg-neutral-100 dark:hover:border-neutral-400"
      >
        <div class="mb-3 flex items-start justify-between">
          <h3 class="text-[14px] font-semibold text-neutral-900 dark:text-neutral-800">{{ team.name }}</h3>
          <span
            :class="[
              'flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium',
              team.onCallStatus === 'active'
                ? 'bg-success-50 text-success-500 dark:bg-success-50/20 dark:text-success-700'
                : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-200 dark:text-neutral-500'
            ]"
          >
            <span :class="['h-1.5 w-1.5 rounded-full', team.onCallStatus === 'active' ? 'bg-success-500' : 'bg-neutral-400']" />
            {{ team.onCallStatus === 'active' ? 'On call' : 'Off call' }}
          </span>
        </div>
        <p class="mb-3 text-[12px] text-neutral-500">{{ team.description }}</p>

        <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-neutral-500">
          <span class="flex items-center gap-1">
            <UIcon name="i-lucide-users" class="h-3 w-3" />
            {{ team.memberCount }} members
          </span>
          <span class="flex items-center gap-1">
            <UIcon name="i-lucide-folder-kanban" class="h-3 w-3" />
            {{ team.projectCount }} projects
          </span>
          <span v-if="team.activeIncidentCount > 0" class="flex items-center gap-1 text-warning-500">
            <UIcon name="i-lucide-alert-triangle" class="h-3 w-3" />
            {{ team.activeIncidentCount }}
          </span>
        </div>

        <!-- Member avatars -->
        <div class="mt-3 flex -space-x-1.5">
          <div
            v-for="member in team.members.slice(0, 5)"
            :key="member.id"
            class="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-neutral-200 text-[9px] font-semibold text-neutral-600 dark:border-neutral-100 dark:bg-neutral-300 dark:text-neutral-500"
            :title="member.user.name"
          >
            {{ member.user.name.split(' ').map(n => n[0]).join('') }}
          </div>
          <div
            v-if="team.members.length > 5"
            class="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-neutral-100 text-[9px] font-medium text-neutral-500 dark:border-neutral-100 dark:bg-neutral-200"
          >
            +{{ team.members.length - 5 }}
          </div>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>
