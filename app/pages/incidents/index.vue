<script setup lang="ts">
import { useIncidents } from '~/composables/useIncidents'
import { teams, services } from '~/services/mock-data'
import { formatRelativeTime } from '~/utils'

definePageMeta({ layout: 'default' })

const { incidents, loading, filters, pagination, fetch: fetchIncidents } = useIncidents()

const showFilters = ref(false)

const severityOptions = [
  { label: 'Critical', value: 'critical' },
  { label: 'High', value: 'high' },
  { label: 'Medium', value: 'medium' },
  { label: 'Low', value: 'low' }
]

const statusOptions = [
  { label: 'Investigating', value: 'investigating' },
  { label: 'Identified', value: 'identified' },
  { label: 'Monitoring', value: 'monitoring' },
  { label: 'Resolved', value: 'resolved' },
  { label: 'Post-mortem', value: 'postmortem' }
]

const sortOptions = [
  { label: 'Newest', value: 'created-desc' },
  { label: 'Oldest', value: 'created-asc' },
  { label: 'Severity', value: 'severity' },
  { label: 'Updated', value: 'updated' }
]

const currentSort = ref('created-desc')

onMounted(() => {
  fetchIncidents()
})

watch([filters, currentSort], () => {
  fetchIncidents()
}, { deep: true })
</script>

<template>
  <div>
    <SharedPageHeader title="Incidents" description="Track and manage operational incidents">
      <template #actions>
        <UButton to="/incidents/new" color="primary" size="sm" icon="i-lucide-plus" label="New incident" />
      </template>
    </SharedPageHeader>

    <!-- Controls -->
    <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex flex-1 items-center gap-2">
        <div class="relative max-w-xs flex-1">
          <UIcon name="i-lucide-search" class="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
          <input
            v-model="filters.search"
            type="text"
            placeholder="Search incidents..."
            class="h-8 w-full rounded-md border border-neutral-200 bg-white pl-8 pr-3 text-[13px] text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-neutral-300 dark:bg-neutral-100 dark:text-neutral-800"
          />
        </div>
        <button
          :class="[
            'flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-[13px] transition-colors',
            showFilters
              ? 'border-primary-500 bg-primary-50 text-primary-600 dark:border-primary-400 dark:bg-primary-50 dark:text-primary-400'
              : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50 dark:border-neutral-300 dark:text-neutral-500 dark:hover:bg-neutral-200'
          ]"
          @click="showFilters = !showFilters"
        >
          <UIcon name="i-lucide-filter" class="h-3.5 w-3.5" />
          Filters
        </button>
      </div>
      <div class="flex items-center gap-2">
        <select
          v-model="currentSort"
          class="h-8 rounded-md border border-neutral-200 bg-white px-2.5 text-[13px] text-neutral-700 focus:border-primary-500 focus:outline-none dark:border-neutral-300 dark:bg-neutral-100 dark:text-neutral-600"
        >
          <option v-for="opt in sortOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
        </select>
      </div>
    </div>

    <!-- Filter panel -->
    <div v-if="showFilters" class="mb-4 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-300 dark:bg-neutral-100">
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label class="mb-1.5 block text-[12px] font-medium text-neutral-600 dark:text-neutral-500">Severity</label>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="opt in severityOptions"
              :key="opt.value"
              :class="[
                'rounded-md px-2 py-1 text-[12px] font-medium transition-colors',
                filters.severity?.includes(opt.value as any)
                  ? 'bg-primary-50 text-primary-600 dark:bg-primary-50 dark:text-primary-400'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-200 dark:text-neutral-500'
              ]"
              @click="filters.severity = filters.severity?.includes(opt.value as any) ? filters.severity.filter(s => s !== opt.value) : [...(filters.severity || []), opt.value as any]"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>
        <div>
          <label class="mb-1.5 block text-[12px] font-medium text-neutral-600 dark:text-neutral-500">Status</label>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="opt in statusOptions"
              :key="opt.value"
              :class="[
                'rounded-md px-2 py-1 text-[12px] font-medium transition-colors',
                filters.status?.includes(opt.value as any)
                  ? 'bg-primary-50 text-primary-600 dark:bg-primary-50 dark:text-primary-400'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-200 dark:text-neutral-500'
              ]"
              @click="filters.status = filters.status?.includes(opt.value as any) ? filters.status.filter(s => s !== opt.value) : [...(filters.status || []), opt.value as any]"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>
        <div>
          <label class="mb-1.5 block text-[12px] font-medium text-neutral-600 dark:text-neutral-500">Team</label>
          <select
            class="h-8 w-full rounded-md border border-neutral-200 bg-white px-2.5 text-[13px] dark:border-neutral-300 dark:bg-neutral-100 dark:text-neutral-600"
            @change="filters.teamId = ($event.target as HTMLSelectElement).value ? [($event.target as HTMLSelectElement).value] : []"
          >
            <option value="">All teams</option>
            <option v-for="team in teams" :key="team.id" :value="team.id">{{ team.name }}</option>
          </select>
        </div>
        <div>
          <label class="mb-1.5 block text-[12px] font-medium text-neutral-600 dark:text-neutral-500">Service</label>
          <select
            class="h-8 w-full rounded-md border border-neutral-200 bg-white px-2.5 text-[13px] dark:border-neutral-300 dark:bg-neutral-100 dark:text-neutral-600"
            @change="filters.serviceId = ($event.target as HTMLSelectElement).value ? [($event.target as HTMLSelectElement).value] : []"
          >
            <option value="">All services</option>
            <option v-for="svc in services" :key="svc.id" :value="svc.id">{{ svc.name }}</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div v-if="loading" class="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-300 dark:bg-neutral-100">
      <SharedLoadingSkeleton :rows="6" :columns="5" />
    </div>

    <div v-else-if="incidents.length === 0" class="rounded-lg border border-neutral-200 bg-white dark:border-neutral-300 dark:bg-neutral-100">
      <SharedEmptyState
        icon="i-lucide-alert-triangle"
        title="No incidents found"
        description="Try adjusting your filters or search query."
      />
    </div>

    <div v-else class="overflow-x-auto rounded-lg border border-neutral-200 bg-white dark:border-neutral-300 dark:bg-neutral-100">
      <table class="w-full">
        <thead>
          <tr class="border-b border-neutral-200 dark:border-neutral-300">
            <th class="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-neutral-400">ID</th>
            <th class="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-neutral-400">Title</th>
            <th class="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-neutral-400">Severity</th>
            <th class="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-neutral-400">Status</th>
            <th class="hidden px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-neutral-400 md:table-cell">Service</th>
            <th class="hidden px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-neutral-400 lg:table-cell">Team</th>
            <th class="hidden px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-neutral-400 xl:table-cell">Assignee</th>
            <th class="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-neutral-400">Created</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-neutral-200 dark:divide-neutral-300">
          <tr
            v-for="incident in incidents"
            :key="incident.id"
            class="transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-200/50"
          >
            <td class="whitespace-nowrap px-4 py-3 text-[13px] font-medium text-neutral-500">
              INC-{{ incident.number }}
            </td>
            <td class="px-4 py-3">
              <NuxtLink :to="`/incidents/${incident.id}`" class="text-[13px] font-medium text-neutral-900 hover:text-primary-500 dark:text-neutral-800 dark:hover:text-primary-400">
                {{ incident.title }}
              </NuxtLink>
            </td>
            <td class="px-4 py-3">
              <SharedSeverityBadge :severity="incident.severity" />
            </td>
            <td class="px-4 py-3">
              <IncidentsIncidentStatusBadge :status="incident.status" />
            </td>
            <td class="hidden px-4 py-3 text-[13px] text-neutral-600 md:table-cell dark:text-neutral-500">
              {{ incident.services?.[0]?.name || '-' }}
            </td>
            <td class="hidden px-4 py-3 text-[13px] text-neutral-600 lg:table-cell dark:text-neutral-500">
              {{ incident.team?.name || '-' }}
            </td>
            <td class="hidden px-4 py-3 text-[13px] text-neutral-600 xl:table-cell dark:text-neutral-500">
              {{ incident.assignee?.name || 'Unassigned' }}
            </td>
            <td class="whitespace-nowrap px-4 py-3 text-[12px] text-neutral-400">
              {{ formatRelativeTime(incident.createdAt) }}
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Pagination -->
      <div class="flex items-center justify-between border-t border-neutral-200 px-4 py-3 dark:border-neutral-300">
        <p class="text-[12px] text-neutral-500">
          Showing {{ incidents.length }} of {{ pagination.total }} incidents
        </p>
        <div class="flex items-center gap-1">
          <button
            class="rounded-md px-2.5 py-1 text-[12px] font-medium text-neutral-500 hover:bg-neutral-100 disabled:opacity-50 dark:text-neutral-500 dark:hover:bg-neutral-200"
            :disabled="pagination.page <= 1"
            @click="pagination.page--"
          >
            Previous
          </button>
          <button
            class="rounded-md px-2.5 py-1 text-[12px] font-medium text-neutral-500 hover:bg-neutral-100 disabled:opacity-50 dark:text-neutral-500 dark:hover:bg-neutral-200"
            :disabled="incidents.length < pagination.pageSize"
            @click="pagination.page++"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
