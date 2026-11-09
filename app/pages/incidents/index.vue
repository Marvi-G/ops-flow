<script setup lang="ts">
import { useIncidentFilters } from '~/composables/useIncidentFilters'
import { incidentRepository, serviceRepository, teamRepository } from '~/services/repository'
import { formatRelativeTime } from '~/utils'
import type { Incident, IncidentSeverity, IncidentStatus, Service, Team } from '~/types'

definePageMeta({ layout: 'default' })

const { filters, updateFilter, toggleArrayFilter, resetFilters, hasActiveFilters } = useIncidentFilters()

const incidents = ref<Incident[]>([])
const loading = ref(true)
const loadError = ref('')

// Options for the team and service filter dropdowns
const teams = ref<Team[]>([])
const services = ref<Service[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = 20

const showFilters = ref(false)
const showColumnMenu = ref(false)

// Sort state
const sortField = ref<'created' | 'updated' | 'severity'>('created')
const sortDir = ref<'asc' | 'desc'>('desc')

// The sort dropdown holds "field-dir" (e.g. "severity-desc")
const sortValue = computed({
  get: () => `${sortField.value}-${sortDir.value}`,
  set: (value: string) => {
    const [field, dir] = value.split('-')
    const option = sortOptions.find(o => o.field === field && o.dir === dir)
    if (option) {
      sortField.value = option.field
      sortDir.value = option.dir
    }
  }
})

// Selection state
const selectedIds = ref<Set<string>>(new Set())

// Column visibility
const visibleColumns = ref({
  id: true,
  title: true,
  severity: true,
  status: true,
  service: true,
  team: true,
  assignee: true,
  created: true,
  updated: false
})

const columnOptions = [
  { key: 'id', label: 'ID' },
  { key: 'title', label: 'Title' },
  { key: 'severity', label: 'Severity' },
  { key: 'status', label: 'Status' },
  { key: 'service', label: 'Service' },
  { key: 'team', label: 'Team' },
  { key: 'assignee', label: 'Assignee' },
  { key: 'created', label: 'Created' },
  { key: 'updated', label: 'Updated' }
]

const severityOptions: { label: string, value: IncidentSeverity }[] = [
  { label: 'Critical', value: 'critical' },
  { label: 'High', value: 'high' },
  { label: 'Medium', value: 'medium' },
  { label: 'Low', value: 'low' }
]

const statusOptions: { label: string, value: IncidentStatus }[] = [
  { label: 'Investigating', value: 'investigating' },
  { label: 'Identified', value: 'identified' },
  { label: 'Monitoring', value: 'monitoring' },
  { label: 'Resolved', value: 'resolved' },
  { label: 'Post-mortem', value: 'postmortem' }
]

const sortOptions: { label: string, field: 'created' | 'updated' | 'severity', dir: 'asc' | 'desc' }[] = [
  { label: 'Newest first', field: 'created', dir: 'desc' },
  { label: 'Oldest first', field: 'created', dir: 'asc' },
  { label: 'Recently updated', field: 'updated', dir: 'desc' },
  { label: 'Severity (high to low)', field: 'severity', dir: 'desc' }
]

// Fetch incidents
async function fetchIncidents() {
  loading.value = true
  loadError.value = ''
  try {
    // Sorting happens on the server so it applies across all pages, not just this one
    const result = await incidentRepository.list(
      filters.value,
      { page: page.value, pageSize },
      { field: sortField.value, dir: sortDir.value }
    )
    incidents.value = result.data
    total.value = result.total
  } catch (err) {
    incidents.value = []
    total.value = 0
    loadError.value = err instanceof Error ? err.message : 'Failed to load incidents'
  } finally {
    loading.value = false
  }
}

// Watch for filter/sort changes
watch([filters, sortField, sortDir], () => {
  page.value = 1
  fetchIncidents()
}, { deep: true })

watch(page, () => {
  fetchIncidents()
})

onMounted(async () => {
  fetchIncidents()
  try {
    ;[teams.value, services.value] = await Promise.all([teamRepository.list(), serviceRepository.list()])
  } catch {
    // The dropdowns just stay empty; the incident list reports its own errors
  }
})

// Selection
const allSelected = computed(() =>
  incidents.value.length > 0 && incidents.value.every(i => selectedIds.value.has(i.id))
)

function toggleSelectAll() {
  if (allSelected.value) {
    selectedIds.value.clear()
  } else {
    incidents.value.forEach(i => selectedIds.value.add(i.id))
  }
  // Trigger reactivity
  selectedIds.value = new Set(selectedIds.value)
}

function toggleSelect(id: string) {
  if (selectedIds.value.has(id)) {
    selectedIds.value.delete(id)
  } else {
    selectedIds.value.add(id)
  }
  selectedIds.value = new Set(selectedIds.value)
}

const selectedCount = computed(() => selectedIds.value.size)

// Bulk actions
function handleBulkAction(action: string) {
  if (selectedIds.value.size === 0) return
  // Mock bulk action - in real app would call API
  console.log(`Bulk ${action} on ${selectedIds.value.size} incidents`)
  selectedIds.value.clear()
  selectedIds.value = new Set(selectedIds.value)
}

// Active filter count
const activeFilterCount = computed(() => {
  let count = 0
  if (filters.value.severity.length) count++
  if (filters.value.status.length) count++
  if (filters.value.serviceId.length) count++
  if (filters.value.teamId.length) count++
  if (filters.value.dateFrom || filters.value.dateTo) count++
  return count
})
</script>

<template>
  <div>
    <SharedPageHeader title="Incidents" description="Track and manage operational incidents">
      <template #actions>
        <UButton to="/incidents/new" color="primary" size="sm" icon="i-lucide-plus" label="New incident" />
      </template>
    </SharedPageHeader>

    <div v-if="loadError" class="mb-4 rounded-md bg-danger-50 p-3 text-[13px] text-danger-500 dark:bg-danger-50/20">
      {{ loadError }}
    </div>

    <!-- Controls -->
    <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex flex-1 flex-wrap items-center gap-2">
        <div class="relative min-w-[10rem] max-w-xs flex-1">
          <UIcon name="i-lucide-search" class="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
          <input
            :value="filters.search"
            type="text"
            placeholder="Search incidents..."
            class="h-8 w-full rounded-md border border-neutral-200 bg-white pl-8 pr-3 text-[13px] text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-neutral-300 dark:bg-neutral-100 dark:text-neutral-800"
            @input="updateFilter('search', ($event.target as HTMLInputElement).value)"
          />
        </div>
        <button
          :class="[
            'flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-[13px] transition-colors',
            showFilters || hasActiveFilters
              ? 'border-primary-500 bg-primary-50 text-primary-600 dark:border-primary-400 dark:bg-primary-50 dark:text-primary-400'
              : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50 dark:border-neutral-300 dark:text-neutral-500 dark:hover:bg-neutral-200'
          ]"
          @click="showFilters = !showFilters"
        >
          <UIcon name="i-lucide-filter" class="h-3.5 w-3.5" />
          Filters
          <span v-if="activeFilterCount" class="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary-500 px-1 text-[10px] font-medium text-white">
            {{ activeFilterCount }}
          </span>
        </button>
        <UPopover v-model:open="showColumnMenu">
          <button class="hidden h-8 items-center gap-1.5 rounded-md border border-neutral-200 px-2.5 md:flex text-[13px] text-neutral-600 transition-colors hover:bg-neutral-50 dark:border-neutral-300 dark:text-neutral-500 dark:hover:bg-neutral-200">
            <UIcon name="i-lucide-columns" class="h-3.5 w-3.5" />
            Columns
          </button>
          <template #content>
            <div class="w-48 p-2">
              <p class="mb-2 px-2 text-[11px] font-medium uppercase tracking-wider text-neutral-400">Visible columns</p>
              <label
                v-for="col in columnOptions"
                :key="col.key"
                class="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-[13px] text-neutral-700 hover:bg-neutral-50 dark:text-neutral-600 dark:hover:bg-neutral-200"
              >
                <input
                  type="checkbox"
                  :checked="(visibleColumns as any)[col.key]"
                  class="rounded border-neutral-300 text-primary-500 focus:ring-primary-500"
                  @change="(visibleColumns as any)[col.key] = ($event.target as HTMLInputElement).checked"
                />
                {{ col.label }}
              </label>
            </div>
          </template>
        </UPopover>
      </div>
      <div class="flex items-center gap-2">
        <select
          :value="sortValue"
          class="h-8 w-full rounded-md border border-neutral-200 bg-white px-2.5 text-[13px] text-neutral-700 focus:border-primary-500 sm:w-auto focus:outline-none dark:border-neutral-300 dark:bg-neutral-100 dark:text-neutral-600"
          @change="sortValue = ($event.target as HTMLSelectElement).value"
        >
          <option v-for="opt in sortOptions" :key="`${opt.field}-${opt.dir}`" :value="`${opt.field}-${opt.dir}`">{{ opt.label }}</option>
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
                filters.severity.includes(opt.value)
                  ? 'bg-primary-50 text-primary-600 dark:bg-primary-50 dark:text-primary-400'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-200 dark:text-neutral-500'
              ]"
              @click="toggleArrayFilter('severity', opt.value)"
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
                filters.status.includes(opt.value)
                  ? 'bg-primary-50 text-primary-600 dark:bg-primary-50 dark:text-primary-400'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-200 dark:text-neutral-500'
              ]"
              @click="toggleArrayFilter('status', opt.value)"
            >
              {{ opt.label }}
            </button>
          </div>
        </div>
        <div>
          <label class="mb-1.5 block text-[12px] font-medium text-neutral-600 dark:text-neutral-500">Team</label>
          <select
            :value="filters.teamId[0] || ''"
            class="h-8 w-full rounded-md border border-neutral-200 bg-white px-2.5 text-[13px] dark:border-neutral-300 dark:bg-neutral-100 dark:text-neutral-600"
            @change="updateFilter('teamId', ($event.target as HTMLSelectElement).value ? [($event.target as HTMLSelectElement).value] : [])"
          >
            <option value="">All teams</option>
            <option v-for="team in teams" :key="team.id" :value="team.id">{{ team.name }}</option>
          </select>
        </div>
        <div>
          <label class="mb-1.5 block text-[12px] font-medium text-neutral-600 dark:text-neutral-500">Service</label>
          <select
            :value="filters.serviceId[0] || ''"
            class="h-8 w-full rounded-md border border-neutral-200 bg-white px-2.5 text-[13px] dark:border-neutral-300 dark:bg-neutral-100 dark:text-neutral-600"
            @change="updateFilter('serviceId', ($event.target as HTMLSelectElement).value ? [($event.target as HTMLSelectElement).value] : [])"
          >
            <option value="">All services</option>
            <option v-for="svc in services" :key="svc.id" :value="svc.id">{{ svc.name }}</option>
          </select>
        </div>
        <div>
          <label class="mb-1.5 block text-[12px] font-medium text-neutral-600 dark:text-neutral-500">Date from</label>
          <input
            type="date"
            :value="filters.dateFrom"
            class="h-8 w-full rounded-md border border-neutral-200 bg-white px-2.5 text-[13px] dark:border-neutral-300 dark:bg-neutral-100 dark:text-neutral-600"
            @change="updateFilter('dateFrom', ($event.target as HTMLInputElement).value)"
          />
        </div>
        <div>
          <label class="mb-1.5 block text-[12px] font-medium text-neutral-600 dark:text-neutral-500">Date to</label>
          <input
            type="date"
            :value="filters.dateTo"
            class="h-8 w-full rounded-md border border-neutral-200 bg-white px-2.5 text-[13px] dark:border-neutral-300 dark:bg-neutral-100 dark:text-neutral-600"
            @change="updateFilter('dateTo', ($event.target as HTMLInputElement).value)"
          />
        </div>
      </div>
      <div v-if="hasActiveFilters" class="mt-4 flex justify-end">
        <button
          class="text-[12px] font-medium text-neutral-500 hover:text-neutral-700 dark:text-neutral-500 dark:hover:text-neutral-400"
          @click="resetFilters"
        >
          Clear all filters
        </button>
      </div>
    </div>

    <!-- Bulk actions bar -->
    <div v-if="selectedCount > 0" class="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-primary-500/20 bg-primary-50 px-4 py-2.5 dark:border-primary-400/20 dark:bg-primary-50/10">
      <span class="text-[13px] font-medium text-primary-600 dark:text-primary-400">
        {{ selectedCount }} selected
      </span>
      <div class="flex items-center gap-2">
        <button
          class="rounded-md bg-white px-2.5 py-1 text-[12px] font-medium text-neutral-700 shadow-sm hover:bg-neutral-50 dark:bg-neutral-100 dark:text-neutral-600 dark:hover:bg-neutral-200"
          @click="handleBulkAction('assign')"
        >
          Assign
        </button>
        <button
          class="rounded-md bg-white px-2.5 py-1 text-[12px] font-medium text-neutral-700 shadow-sm hover:bg-neutral-50 dark:bg-neutral-100 dark:text-neutral-600 dark:hover:bg-neutral-200"
          @click="handleBulkAction('update-status')"
        >
          Update status
        </button>
        <button
          class="rounded-md bg-danger-50 px-2.5 py-1 text-[12px] font-medium text-danger-500 hover:bg-danger-50/80 dark:bg-danger-50/20 dark:text-danger-700"
          @click="handleBulkAction('close')"
        >
          Close
        </button>
      </div>
      <button
        class="ml-auto text-[12px] text-neutral-500 hover:text-neutral-700 dark:text-neutral-500 dark:hover:text-neutral-400"
        @click="selectedIds.clear(); selectedIds = new Set(selectedIds)"
      >
        Clear selection
      </button>
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
      >
        <template #actions>
          <button
            v-if="hasActiveFilters"
            class="rounded-md bg-primary-500 px-3 py-1.5 text-[13px] font-medium text-white hover:bg-primary-600"
            @click="resetFilters"
          >
            Clear filters
          </button>
        </template>
      </SharedEmptyState>
    </div>

    <div v-else class="rounded-lg border border-neutral-200 bg-white dark:border-neutral-300 dark:bg-neutral-100">
      <!-- Phones: one card per incident instead of a wide table -->
      <div class="divide-y divide-neutral-200 md:hidden dark:divide-neutral-300">
        <IncidentsIncidentRow
          v-for="incident in incidents"
          :key="incident.id"
          :incident="incident"
          show-time
          :subtitle="[incident.services?.[0]?.name, incident.team?.name].filter(Boolean).join(' · ')"
        />
      </div>

      <div class="hidden overflow-x-auto md:block">
      <table class="w-full">
        <thead>
          <tr class="border-b border-neutral-200 dark:border-neutral-300">
            <th class="w-10 px-4 py-2.5">
              <input
                type="checkbox"
                :checked="allSelected"
                class="rounded border-neutral-300 text-primary-500 focus:ring-primary-500"
                @change="toggleSelectAll"
              />
            </th>
            <th v-if="visibleColumns.id" class="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-neutral-400">ID</th>
            <th v-if="visibleColumns.title" class="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-neutral-400">Title</th>
            <th v-if="visibleColumns.severity" class="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-neutral-400">Severity</th>
            <th v-if="visibleColumns.status" class="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-neutral-400">Status</th>
            <th v-if="visibleColumns.service" class="hidden px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-neutral-400 md:table-cell">Service</th>
            <th v-if="visibleColumns.team" class="hidden px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-neutral-400 lg:table-cell">Team</th>
            <th v-if="visibleColumns.assignee" class="hidden px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-neutral-400 xl:table-cell">Assignee</th>
            <th v-if="visibleColumns.created" class="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-neutral-400">Created</th>
            <th v-if="visibleColumns.updated" class="hidden px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-neutral-400 xl:table-cell">Updated</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-neutral-200 dark:divide-neutral-300">
          <tr
            v-for="incident in incidents"
            :key="incident.id"
            :class="[
              'transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-200/50',
              selectedIds.has(incident.id) ? 'bg-primary-50/50 dark:bg-primary-50/10' : ''
            ]"
          >
            <td class="w-10 px-4 py-3">
              <input
                type="checkbox"
                :checked="selectedIds.has(incident.id)"
                class="rounded border-neutral-300 text-primary-500 focus:ring-primary-500"
                @change="toggleSelect(incident.id)"
              />
            </td>
            <td v-if="visibleColumns.id" class="whitespace-nowrap px-4 py-3 text-[13px] font-medium text-neutral-500">
              INC-{{ incident.number }}
            </td>
            <td v-if="visibleColumns.title" class="px-4 py-3">
              <NuxtLink :to="`/incidents/${incident.id}`" class="text-[13px] font-medium text-neutral-900 hover:text-primary-500 dark:text-neutral-800 dark:hover:text-primary-400">
                {{ incident.title }}
              </NuxtLink>
            </td>
            <td v-if="visibleColumns.severity" class="px-4 py-3">
              <SharedSeverityBadge :severity="incident.severity" />
            </td>
            <td v-if="visibleColumns.status" class="px-4 py-3">
              <IncidentsIncidentStatusBadge :status="incident.status" />
            </td>
            <td v-if="visibleColumns.service" class="hidden px-4 py-3 text-[13px] text-neutral-600 md:table-cell dark:text-neutral-500">
              {{ incident.services?.[0]?.name || '-' }}
            </td>
            <td v-if="visibleColumns.team" class="hidden px-4 py-3 text-[13px] text-neutral-600 lg:table-cell dark:text-neutral-500">
              {{ incident.team?.name || '-' }}
            </td>
            <td v-if="visibleColumns.assignee" class="hidden px-4 py-3 text-[13px] text-neutral-600 xl:table-cell dark:text-neutral-500">
              {{ incident.assignee?.name || 'Unassigned' }}
            </td>
            <td v-if="visibleColumns.created" class="whitespace-nowrap px-4 py-3 text-[12px] text-neutral-400">
              {{ formatRelativeTime(incident.createdAt) }}
            </td>
            <td v-if="visibleColumns.updated" class="hidden whitespace-nowrap px-4 py-3 text-[12px] text-neutral-400 xl:table-cell">
              {{ formatRelativeTime(incident.updatedAt) }}
            </td>
          </tr>
        </tbody>
      </table>
      </div>

      <!-- Pagination -->
      <div class="flex flex-col items-center gap-2 border-t border-neutral-200 px-4 py-3 sm:flex-row sm:justify-between dark:border-neutral-300">
        <p class="text-[12px] text-neutral-500">
          Showing {{ incidents.length }} of {{ total }} incidents
        </p>
        <div class="flex items-center gap-1">
          <button
            class="rounded-md px-2.5 py-1 text-[12px] font-medium text-neutral-500 hover:bg-neutral-100 disabled:opacity-50 dark:text-neutral-500 dark:hover:bg-neutral-200"
            :disabled="page <= 1"
            @click="page--"
          >
            Previous
          </button>
          <span class="px-2 text-[12px] text-neutral-500">
            Page {{ page }} of {{ Math.ceil(total / pageSize) || 1 }}
          </span>
          <button
            class="rounded-md px-2.5 py-1 text-[12px] font-medium text-neutral-500 hover:bg-neutral-100 disabled:opacity-50 dark:text-neutral-500 dark:hover:bg-neutral-200"
            :disabled="page * pageSize >= total"
            @click="page++"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
