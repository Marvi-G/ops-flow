<script setup lang="ts">
import { useServices } from '~/composables/useServices'
import { formatRelativeTime } from '~/utils'
import type { Service } from '~/types'

definePageMeta({ layout: 'default' })

const { services, loading, error, fetch: fetchServices } = useServices()
const search = ref('')
const { can } = usePermissions()
const showForm = ref(false)

function onCreated(service: Service) {
  navigateTo(`/services/${service.id}`)
}

const filteredServices = computed(() => {
  if (!search.value) return services.value
  const q = search.value.toLowerCase()
  return services.value.filter(s =>
    s.name.toLowerCase().includes(q) ||
    s.project?.name.toLowerCase().includes(q)
  )
})

onMounted(() => fetchServices())
</script>

<template>
  <div>
    <SharedPageHeader title="Services" description="Monitor service health and performance">
      <template #actions>
        <UButton v-if="can('services.manage')" color="primary" size="sm" icon="i-lucide-plus" label="Add service" @click="showForm = true" />
      </template>
    </SharedPageHeader>

    <ServicesFormModal v-model:open="showForm" @saved="onCreated" />

    <!-- Search -->
    <div class="mb-4">
      <div class="relative max-w-xs">
        <UIcon name="i-lucide-search" class="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
        <input
          v-model="search"
          type="text"
          placeholder="Search services..."
          class="h-8 w-full rounded-md border border-neutral-200 bg-white pl-8 pr-3 text-[13px] text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-neutral-300 dark:bg-neutral-100 dark:text-neutral-800"
        />
      </div>
    </div>

    <div v-if="loading">
      <SharedLoadingSkeleton :rows="6" :columns="4" />
    </div>

    <div v-else-if="error" class="rounded-md bg-danger-50 p-3 text-[13px] text-danger-500 dark:bg-danger-50/20">
      {{ error }}
    </div>

    <div v-else-if="filteredServices.length === 0">
      <div class="rounded-lg border border-neutral-200 bg-white dark:border-neutral-300 dark:bg-neutral-100">
        <SharedEmptyState icon="i-lucide-server" title="No services found" description="Try adjusting your search or add a new service." />
      </div>
    </div>

    <div v-else class="overflow-x-auto rounded-lg border border-neutral-200 bg-white dark:border-neutral-300 dark:bg-neutral-100">
      <table class="w-full">
        <thead>
          <tr class="border-b border-neutral-200 dark:border-neutral-300">
            <th class="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-neutral-400">Service</th>
            <th class="hidden px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-neutral-400 sm:table-cell">Project</th>
            <th class="px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-neutral-400">Status</th>
            <th class="hidden px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-neutral-400 md:table-cell">Uptime</th>
            <th class="hidden px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-neutral-400 lg:table-cell">Latency</th>
            <th class="hidden px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-neutral-400 xl:table-cell">Open incidents</th>
            <th class="hidden px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-neutral-400 xl:table-cell">Last deployment</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-neutral-200 dark:divide-neutral-300">
          <tr
            v-for="svc in filteredServices"
            :key="svc.id"
            class="transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-200/50"
          >
            <td class="px-4 py-3">
              <NuxtLink :to="`/services/${svc.id}`" class="text-[13px] font-medium text-neutral-900 hover:text-primary-500 dark:text-neutral-800 dark:hover:text-primary-400">
                {{ svc.name }}
              </NuxtLink>
            </td>
            <td class="hidden px-4 py-3 text-[13px] text-neutral-600 sm:table-cell dark:text-neutral-500">
              {{ svc.project?.name || '-' }}
            </td>
            <td class="px-4 py-3">
              <SharedServiceStatusBadge :status="svc.status" />
            </td>
            <td class="hidden px-4 py-3 text-[13px] text-neutral-600 md:table-cell dark:text-neutral-500">
              {{ svc.uptime > 0 ? `${svc.uptime}%` : '-' }}
            </td>
            <td class="hidden px-4 py-3 text-[13px] text-neutral-600 lg:table-cell dark:text-neutral-500">
              {{ svc.latency > 0 ? `${svc.latency}ms` : '-' }}
            </td>
            <td class="hidden px-4 py-3 text-[13px] text-neutral-600 xl:table-cell dark:text-neutral-500">
              {{ svc.openIncidentCount }}
            </td>
            <td class="hidden px-4 py-3 text-[12px] text-neutral-400 xl:table-cell">
              {{ formatRelativeTime(svc.lastDeployment) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
