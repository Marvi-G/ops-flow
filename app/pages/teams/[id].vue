<script setup lang="ts">
import { useTeams } from '~/composables/useTeams'
import { incidentRepository, projectRepository } from '~/services/repository'
import { formatRelativeTime } from '~/utils'
import type { Incident, Project, Team } from '~/types'

definePageMeta({ layout: 'default' })

const route = useRoute()
const teamId = route.params.id as string
const { fetchById } = useTeams()
const team = ref<Team | null>(null)
const teamProjects = ref<Project[]>([])
const teamIncidents = ref<Incident[]>([])
const teamIncidentTotal = ref(0)
const loaded = ref(false)
const loadError = ref('')
const activeTab = ref('members')

onMounted(async () => {
  try {
    team.value = (await fetchById(teamId)) ?? null
    if (team.value) {
      const [allProjects, incidentResult] = await Promise.all([
        projectRepository.list(),
        incidentRepository.list({ teamId: [teamId] }, { pageSize: 20 })
      ])
      teamProjects.value = allProjects.filter(p => p.teamId === teamId)
      teamIncidents.value = incidentResult.data
      teamIncidentTotal.value = incidentResult.total
    }
  } catch (err) {
    loadError.value = err instanceof Error ? err.message : 'Failed to load the team'
  } finally {
    loaded.value = true
  }
})

const tabs = ['members', 'projects', 'incidents', 'activity']
</script>

<template>
  <div>
    <div v-if="!loaded" class="space-y-4">
      <SharedLoadingSkeleton :rows="3" :columns="3" />
    </div>

    <div v-else-if="loadError || !team" class="rounded-lg border border-neutral-200 bg-white dark:border-neutral-300 dark:bg-neutral-100">
      <SharedEmptyState
        icon="i-lucide-users"
        :title="loadError ? 'Couldn\'t load the team' : 'Team not found'"
        :description="loadError || 'The team you\'re looking for doesn\'t exist.'"
      />
    </div>

    <div v-else>
      <SharedPageHeader :title="team.name" :description="team.description" />

      <!-- Tabs -->
      <div class="mb-6 flex gap-1 border-b border-neutral-200 dark:border-neutral-300">
        <button
          v-for="tab in tabs"
          :key="tab"
          :class="[
            'border-b-2 px-3 py-2 text-[13px] font-medium capitalize transition-colors',
            activeTab === tab
              ? 'border-primary-500 text-primary-600 dark:border-primary-400 dark:text-primary-400'
              : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-600'
          ]"
          @click="activeTab = tab"
        >
          {{ tab }}
          <span v-if="tab === 'members'" class="ml-1 text-[11px] text-neutral-400">({{ team.members.length }})</span>
          <span v-if="tab === 'projects'" class="ml-1 text-[11px] text-neutral-400">({{ teamProjects.length }})</span>
          <span v-if="tab === 'incidents'" class="ml-1 text-[11px] text-neutral-400">({{ teamIncidentTotal }})</span>
        </button>
      </div>

      <!-- Members tab -->
      <div v-if="activeTab === 'members'" class="rounded-lg border border-neutral-200 bg-white dark:border-neutral-300 dark:bg-neutral-100">
        <div class="divide-y divide-neutral-200 dark:divide-neutral-300">
          <div
            v-for="member in team.members"
            :key="member.id"
            class="flex items-center justify-between px-4 py-3"
          >
            <div class="flex items-center gap-3">
              <div class="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-200 text-[11px] font-semibold text-neutral-600 dark:bg-neutral-300 dark:text-neutral-500">
                {{ member.user.name.split(' ').map(n => n[0]).join('') }}
              </div>
              <div>
                <p class="text-[13px] font-medium text-neutral-900 dark:text-neutral-800">{{ member.user.name }}</p>
                <p class="text-[12px] text-neutral-500">{{ member.user.email }}</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span
                :class="[
                  'rounded-md px-2 py-0.5 text-[11px] font-medium',
                  member.role === 'lead'
                    ? 'bg-primary-50 text-primary-600 dark:bg-primary-50 dark:text-primary-400'
                    : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-200 dark:text-neutral-500'
                ]"
              >
                {{ member.role === 'lead' ? 'Team Lead' : 'Member' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Projects tab -->
      <div v-if="activeTab === 'projects'" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <NuxtLink
          v-for="proj in teamProjects"
          :key="proj.id"
          :to="`/projects/${proj.id}`"
          class="rounded-lg border border-neutral-200 bg-white p-4 transition-colors hover:border-neutral-300 dark:border-neutral-300 dark:bg-neutral-100 dark:hover:border-neutral-400"
        >
          <h3 class="text-[14px] font-semibold text-neutral-900 dark:text-neutral-800">{{ proj.name }}</h3>
          <p class="mt-1 text-[12px] text-neutral-500">{{ proj.description }}</p>
          <div class="mt-3 flex items-center gap-3 text-[12px] text-neutral-500">
            <span>{{ proj.serviceCount }} services</span>
            <span>{{ proj.activeIncidentCount }} active incidents</span>
          </div>
        </NuxtLink>
      </div>

      <!-- Incidents tab -->
      <div v-if="activeTab === 'incidents'" class="rounded-lg border border-neutral-200 bg-white dark:border-neutral-300 dark:bg-neutral-100">
        <div v-if="teamIncidents.length === 0" class="p-8 text-center text-[13px] text-neutral-400">
          No incidents for this team
        </div>
        <div v-else class="divide-y divide-neutral-200 dark:divide-neutral-300">
          <NuxtLink
            v-for="inc in teamIncidents"
            :key="inc.id"
            :to="`/incidents/${inc.id}`"
            class="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-200/50"
          >
            <SharedSeverityBadge :severity="inc.severity" />
            <span class="flex-1 text-[13px] font-medium text-neutral-900 dark:text-neutral-800">INC-{{ inc.number }} {{ inc.title }}</span>
            <IncidentsIncidentStatusBadge :status="inc.status" />
            <span class="text-[12px] text-neutral-400">{{ formatRelativeTime(inc.createdAt) }}</span>
          </NuxtLink>
        </div>
      </div>

      <!-- Activity tab -->
      <div v-if="activeTab === 'activity'" class="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-300 dark:bg-neutral-100">
        <p class="text-[13px] text-neutral-500">Team activity feed coming soon.</p>
      </div>
    </div>
  </div>
</template>
