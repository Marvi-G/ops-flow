<script setup lang="ts">
import { useProjects } from '~/composables/useProjects'
import { services, incidents } from '~/services/mock-data'
import { formatRelativeTime } from '~/utils'

definePageMeta({ layout: 'default' })

const route = useRoute()
const projectId = route.params.id as string
const { fetchById, loading } = useProjects()
const project = ref<any>(null)
const activeTab = ref('overview')

const projectServices = computed(() => services.filter(s => s.projectId === projectId))
const projectIncidents = computed(() => incidents.filter(i => i.serviceIds.some(sid => projectServices.value.some(s => s.id === sid))))

onMounted(async () => {
  project.value = await fetchById(projectId)
})

const tabs = ['overview', 'services', 'incidents', 'activity']
</script>

<template>
  <div>
    <div v-if="loading || !project" class="space-y-4">
      <SharedLoadingSkeleton :rows="3" :columns="3" />
    </div>

    <div v-else>
      <SharedPageHeader :title="project.name" :description="project.description">
        <template #actions>
          <UButton color="primary" size="sm" icon="i-lucide-settings" label="Settings" variant="ghost" />
        </template>
      </SharedPageHeader>

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
        </button>
      </div>

      <!-- Overview tab -->
      <div v-if="activeTab === 'overview'" class="grid gap-6 lg:grid-cols-3">
        <div class="lg:col-span-2 space-y-4">
          <div class="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-300 dark:bg-neutral-100">
            <h3 class="mb-3 text-[14px] font-semibold text-neutral-900 dark:text-neutral-800">Services</h3>
            <div class="space-y-2">
              <div
                v-for="svc in projectServices"
                :key="svc.id"
                class="flex items-center justify-between rounded-md px-3 py-2 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-200/50"
              >
                <div class="flex items-center gap-2">
                  <SharedServiceStatusBadge :status="svc.status" />
                  <NuxtLink :to="`/services/${svc.id}`" class="text-[13px] font-medium text-neutral-900 hover:text-primary-500 dark:text-neutral-800 dark:hover:text-primary-400">
                    {{ svc.name }}
                  </NuxtLink>
                </div>
                <span class="text-[12px] text-neutral-400">{{ svc.uptime }}% uptime</span>
              </div>
            </div>
          </div>
        </div>

        <div class="space-y-4">
          <div class="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-300 dark:bg-neutral-100">
            <h3 class="mb-3 text-[12px] font-medium uppercase tracking-wider text-neutral-400">Details</h3>
            <dl class="space-y-3">
              <div>
                <dt class="text-[12px] text-neutral-500">Status</dt>
                <dd class="mt-0.5 text-[13px] font-medium capitalize text-neutral-900 dark:text-neutral-800">{{ project.status }}</dd>
              </div>
              <div>
                <dt class="text-[12px] text-neutral-500">Team</dt>
                <dd class="mt-0.5 text-[13px] text-neutral-700 dark:text-neutral-600">{{ project.team?.name }}</dd>
              </div>
              <div>
                <dt class="text-[12px] text-neutral-500">Services</dt>
                <dd class="mt-0.5 text-[13px] text-neutral-700 dark:text-neutral-600">{{ project.serviceCount }}</dd>
              </div>
              <div>
                <dt class="text-[12px] text-neutral-500">Active incidents</dt>
                <dd class="mt-0.5 text-[13px] text-neutral-700 dark:text-neutral-600">{{ project.activeIncidentCount }}</dd>
              </div>
              <div>
                <dt class="text-[12px] text-neutral-500">Last activity</dt>
                <dd class="mt-0.5 text-[13px] text-neutral-700 dark:text-neutral-600">{{ formatRelativeTime(project.lastActivity) }}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      <!-- Services tab -->
      <div v-if="activeTab === 'services'" class="rounded-lg border border-neutral-200 bg-white dark:border-neutral-300 dark:bg-neutral-100">
        <div class="divide-y divide-neutral-200 dark:divide-neutral-300">
          <NuxtLink
            v-for="svc in projectServices"
            :key="svc.id"
            :to="`/services/${svc.id}`"
            class="flex items-center justify-between px-4 py-3 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-200/50"
          >
            <div class="flex items-center gap-3">
              <SharedServiceStatusBadge :status="svc.status" />
              <div>
                <p class="text-[13px] font-medium text-neutral-900 dark:text-neutral-800">{{ svc.name }}</p>
                <p class="text-[12px] text-neutral-500">{{ svc.description }}</p>
              </div>
            </div>
            <div class="text-right">
              <p class="text-[13px] text-neutral-700 dark:text-neutral-600">{{ svc.latency }}ms</p>
              <p class="text-[12px] text-neutral-400">{{ svc.uptime }}% uptime</p>
            </div>
          </NuxtLink>
        </div>
      </div>

      <!-- Incidents tab -->
      <div v-if="activeTab === 'incidents'" class="rounded-lg border border-neutral-200 bg-white dark:border-neutral-300 dark:bg-neutral-100">
        <div v-if="projectIncidents.length === 0" class="p-8 text-center text-[13px] text-neutral-400">
          No incidents for this project
        </div>
        <div v-else class="divide-y divide-neutral-200 dark:divide-neutral-300">
          <NuxtLink
            v-for="inc in projectIncidents"
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
        <p class="text-[13px] text-neutral-500">Activity feed coming soon.</p>
      </div>
    </div>
  </div>
</template>
