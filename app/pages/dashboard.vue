<script setup lang="ts">
import { dashboardRepository } from '~/services/repository'
import { incidents, activityEvents, services } from '~/services/mock-data'
import { formatRelativeTime } from '~/utils'
import type { DashboardStats } from '~/types'

definePageMeta({ layout: 'default' })

const stats = ref<DashboardStats>({ activeIncidents: 0, criticalIncidents: 0, servicesAffected: 0, uptime: 0 })
const loading = ref(true)

const activeIncidents = computed(() =>
  incidents.filter(i => i.status !== 'resolved' && i.status !== 'postmortem').slice(0, 5)
)

const recentActivity = computed(() => activityEvents.slice(0, 6))

const healthyServices = computed(() => services.filter(s => s.status === 'operational').length)
const totalServices = computed(() => services.length)

onMounted(async () => {
  stats.value = await dashboardRepository.getStats()
  loading.value = false
})

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-xl font-semibold text-neutral-900 dark:text-neutral-800">
        {{ getGreeting() }}, Mark
      </h1>
      <p class="mt-1 text-[13px] text-neutral-500">
        Here's what's happening across your organization.
      </p>
    </div>

    <!-- Stats -->
    <div v-if="loading" class="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
      <div v-for="i in 4" :key="i" class="h-20 animate-pulse rounded-lg bg-neutral-200 dark:bg-neutral-300" />
    </div>
    <div v-else class="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
      <div class="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-300 dark:bg-neutral-100">
        <p class="text-[12px] font-medium text-neutral-500">Active incidents</p>
        <p class="mt-1 text-2xl font-semibold text-neutral-900 dark:text-neutral-800">{{ stats.activeIncidents }}</p>
      </div>
      <div class="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-300 dark:bg-neutral-100">
        <p class="text-[12px] font-medium text-neutral-500">Critical incidents</p>
        <p class="mt-1 text-2xl font-semibold text-danger-500">{{ stats.criticalIncidents }}</p>
      </div>
      <div class="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-300 dark:bg-neutral-100">
        <p class="text-[12px] font-medium text-neutral-500">Services affected</p>
        <p class="mt-1 text-2xl font-semibold text-neutral-900 dark:text-neutral-800">{{ stats.servicesAffected }}</p>
      </div>
      <div class="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-300 dark:bg-neutral-100">
        <p class="text-[12px] font-medium text-neutral-500">Current uptime</p>
        <p class="mt-1 text-2xl font-semibold text-success-500">{{ stats.uptime }}%</p>
      </div>
    </div>

    <div class="grid gap-6 lg:grid-cols-3">
      <!-- Active incidents -->
      <div class="lg:col-span-2">
        <div class="rounded-lg border border-neutral-200 bg-white dark:border-neutral-300 dark:bg-neutral-100">
          <div class="flex items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-300">
            <h2 class="text-[14px] font-semibold text-neutral-900 dark:text-neutral-800">Active incidents</h2>
            <NuxtLink to="/incidents" class="text-[12px] font-medium text-primary-500 hover:text-primary-600">
              View all
            </NuxtLink>
          </div>
          <div class="divide-y divide-neutral-200 dark:divide-neutral-300">
            <NuxtLink
              v-for="incident in activeIncidents"
              :key="incident.id"
              :to="`/incidents/${incident.id}`"
              class="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-200/50"
            >
              <SeverityBadge :severity="incident.severity" />
              <div class="min-w-0 flex-1">
                <p class="truncate text-[13px] font-medium text-neutral-900 dark:text-neutral-800">
                  INC-{{ incident.number }} {{ incident.title }}
                </p>
                <p class="mt-0.5 text-[12px] text-neutral-500">
                  {{ incident.team?.name }} &middot; {{ formatRelativeTime(incident.createdAt) }}
                </p>
              </div>
              <IncidentStatusBadge :status="incident.status" />
            </NuxtLink>
            <div v-if="activeIncidents.length === 0" class="px-4 py-8 text-center text-[13px] text-neutral-400">
              No active incidents
            </div>
          </div>
        </div>
      </div>

      <!-- Right column -->
      <div class="space-y-6">
        <!-- Service health -->
        <div class="rounded-lg border border-neutral-200 bg-white dark:border-neutral-300 dark:bg-neutral-100">
          <div class="flex items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-300">
            <h2 class="text-[14px] font-semibold text-neutral-900 dark:text-neutral-800">Service health</h2>
            <NuxtLink to="/services" class="text-[12px] font-medium text-primary-500 hover:text-primary-600">
              View all
            </NuxtLink>
          </div>
          <div class="px-4 py-3">
            <div class="mb-3 flex items-center justify-between text-[12px]">
              <span class="text-neutral-500">{{ healthyServices }}/{{ totalServices }} operational</span>
              <span class="font-medium text-success-500">{{ Math.round((healthyServices / totalServices) * 100) }}%</span>
            </div>
            <div class="h-2 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-300">
              <div
                class="h-full rounded-full bg-success-500 transition-all"
                :style="{ width: `${(healthyServices / totalServices) * 100}%` }"
              />
            </div>
          </div>
        </div>

        <!-- Quick actions -->
        <div class="rounded-lg border border-neutral-200 bg-white dark:border-neutral-300 dark:bg-neutral-100">
          <div class="border-b border-neutral-200 px-4 py-3 dark:border-neutral-300">
            <h2 class="text-[14px] font-semibold text-neutral-900 dark:text-neutral-800">Quick actions</h2>
          </div>
          <div class="p-2">
            <NuxtLink
              to="/incidents/new"
              class="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] text-neutral-700 transition-colors hover:bg-neutral-50 dark:text-neutral-600 dark:hover:bg-neutral-200/50"
            >
              <UIcon name="i-lucide-alert-triangle" class="h-4 w-4 text-neutral-400" />
              Create incident
            </NuxtLink>
            <NuxtLink
              to="/projects"
              class="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] text-neutral-700 transition-colors hover:bg-neutral-50 dark:text-neutral-600 dark:hover:bg-neutral-200/50"
            >
              <UIcon name="i-lucide-folder-kanban" class="h-4 w-4 text-neutral-400" />
              Create project
            </NuxtLink>
            <NuxtLink
              to="/services"
              class="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] text-neutral-700 transition-colors hover:bg-neutral-50 dark:text-neutral-600 dark:hover:bg-neutral-200/50"
            >
              <UIcon name="i-lucide-server" class="h-4 w-4 text-neutral-400" />
              Add service
            </NuxtLink>
            <NuxtLink
              to="/settings/members"
              class="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] text-neutral-700 transition-colors hover:bg-neutral-50 dark:text-neutral-600 dark:hover:bg-neutral-200/50"
            >
              <UIcon name="i-lucide-user-plus" class="h-4 w-4 text-neutral-400" />
              Invite member
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent activity -->
    <div class="mt-6">
      <div class="rounded-lg border border-neutral-200 bg-white dark:border-neutral-300 dark:bg-neutral-100">
        <div class="flex items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-300">
          <h2 class="text-[14px] font-semibold text-neutral-900 dark:text-neutral-800">Recent activity</h2>
          <NuxtLink to="/activity" class="text-[12px] font-medium text-primary-500 hover:text-primary-600">
            View all
          </NuxtLink>
        </div>
        <div class="divide-y divide-neutral-200 dark:divide-neutral-300">
          <div
            v-for="event in recentActivity"
            :key="event.id"
            class="flex items-start gap-3 px-4 py-3"
          >
            <div class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-[10px] font-semibold text-neutral-600 dark:bg-neutral-200 dark:text-neutral-500">
              {{ event.user?.name.split(' ').map(n => n[0]).join('') }}
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-[13px] text-neutral-700 dark:text-neutral-600">
                <span class="font-medium text-neutral-900 dark:text-neutral-800">{{ event.user?.name }}</span>
                {{ event.action }}
                <span class="font-medium text-neutral-900 dark:text-neutral-800">{{ event.resourceLabel }}</span>
                <span v-if="event.details" class="text-neutral-500"> {{ event.details }}</span>
              </p>
              <p class="mt-0.5 text-[12px] text-neutral-400">{{ formatRelativeTime(event.createdAt) }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
