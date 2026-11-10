<script setup lang="ts">
import { useServices } from '~/composables/useServices'
import { incidentRepository, serviceRepository } from '~/services/repository'
import { formatDateTime } from '~/utils'
import type { Incident, Service } from '~/types'

definePageMeta({ layout: 'default' })

const route = useRoute()
const serviceId = route.params.id as string
const { fetchById } = useServices()
const service = ref<Service | null>(null)
const serviceIncidents = ref<Incident[]>([])
const loaded = ref(false)
const loadError = ref('')
const { can } = usePermissions()

const showEdit = ref(false)
const showDelete = ref(false)
const deleting = ref(false)
const deleteError = ref('')

function onSaved(updated: Service) {
  service.value = updated
}

async function confirmDelete() {
  if (deleting.value) return
  deleting.value = true
  deleteError.value = ''
  try {
    await serviceRepository.delete(serviceId)
    showDelete.value = false
    await navigateTo('/services')
  } catch (err) {
    // Typically "linked to incidents": the dialog stays open and explains why
    deleteError.value = err instanceof Error ? err.message : 'Failed to delete the service'
  } finally {
    deleting.value = false
  }
}

onMounted(async () => {
  try {
    service.value = (await fetchById(serviceId)) ?? null
    if (service.value) {
      const result = await incidentRepository.list({ serviceId: [serviceId] }, { pageSize: 5 })
      serviceIncidents.value = result.data
    }
  } catch (err) {
    loadError.value = err instanceof Error ? err.message : 'Failed to load the service'
  } finally {
    loaded.value = true
  }
})

// Mock uptime data for chart
const uptimeData = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  value: 99.5 + Math.random() * 0.5
}))
</script>

<template>
  <div>
    <div v-if="!loaded" class="space-y-4">
      <SharedLoadingSkeleton :rows="3" :columns="3" />
    </div>

    <div v-else-if="loadError || !service" class="rounded-lg border border-neutral-200 bg-white dark:border-neutral-300 dark:bg-neutral-100">
      <SharedEmptyState
        icon="i-lucide-server"
        :title="loadError ? 'Couldn\'t load the service' : 'Service not found'"
        :description="loadError || 'The service you\'re looking for doesn\'t exist.'"
      />
    </div>

    <div v-else>
      <SharedPageHeader :title="service.name" :description="service.description">
        <template #actions>
          <SharedServiceStatusBadge :status="service.status" />
          <UButton v-if="can('services.manage')" color="neutral" size="sm" icon="i-lucide-pencil" label="Edit" variant="outline" @click="showEdit = true" />
          <UButton v-if="can('services.manage')" color="error" size="sm" icon="i-lucide-trash-2" label="Delete" variant="ghost" @click="deleteError = ''; showDelete = true" />
        </template>
      </SharedPageHeader>

      <ServicesFormModal v-model:open="showEdit" :service="service" @saved="onSaved" />
      <SharedConfirmDialog
        v-model:open="showDelete"
        title="Delete this service?"
        :description="`${service.name} will be removed permanently. This can't be undone.`"
        confirm-label="Delete service"
        danger
        :loading="deleting"
        :error="deleteError"
        @confirm="confirmDelete"
      />

      <div class="grid gap-6 lg:grid-cols-3">
        <div class="lg:col-span-2 space-y-6">
          <!-- Uptime chart (mock) -->
          <div class="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-300 dark:bg-neutral-100">
            <h3 class="mb-4 text-[14px] font-semibold text-neutral-900 dark:text-neutral-800">Uptime (30 days)</h3>
            <div class="flex items-end gap-0.5 h-16">
              <div
                v-for="d in uptimeData"
                :key="d.day"
                :class="[
                  'flex-1 rounded-t transition-colors',
                  d.value >= 99.9 ? 'bg-success-500' :
                  d.value >= 99.5 ? 'bg-warning-500' : 'bg-danger-500'
                ]"
                :style="{ height: `${Math.max(((d.value - 99) / 1) * 100, 10)}%` }"
                :title="`Day ${d.day}: ${d.value.toFixed(2)}%`"
              />
            </div>
            <div class="mt-2 flex justify-between text-[11px] text-neutral-400">
              <span>30 days ago</span>
              <span>Today</span>
            </div>
          </div>

          <!-- Incidents -->
          <div class="rounded-lg border border-neutral-200 bg-white dark:border-neutral-300 dark:bg-neutral-100">
            <div class="border-b border-neutral-200 px-4 py-3 dark:border-neutral-300">
              <h3 class="text-[14px] font-semibold text-neutral-900 dark:text-neutral-800">Recent incidents</h3>
            </div>
            <div v-if="serviceIncidents.length === 0" class="p-8 text-center text-[13px] text-neutral-400">
              No incidents for this service
            </div>
            <div v-else class="divide-y divide-neutral-200 dark:divide-neutral-300">
              <IncidentsIncidentRow v-for="inc in serviceIncidents" :key="inc.id" :incident="inc" show-time />
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="space-y-4">
          <div class="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-300 dark:bg-neutral-100">
            <h3 class="mb-3 text-[12px] font-medium uppercase tracking-wider text-neutral-400">Service details</h3>
            <dl class="space-y-3">
              <div>
                <dt class="text-[12px] text-neutral-500">Status</dt>
                <dd class="mt-0.5"><SharedServiceStatusBadge :status="service.status" /></dd>
              </div>
              <div>
                <dt class="text-[12px] text-neutral-500">Project</dt>
                <dd class="mt-0.5">
                  <NuxtLink v-if="service.project" :to="`/projects/${service.projectId}`" class="text-[13px] font-medium text-primary-500 hover:text-primary-600">
                    {{ service.project.name }}
                  </NuxtLink>
                </dd>
              </div>
              <div>
                <dt class="text-[12px] text-neutral-500">Uptime</dt>
                <dd class="mt-0.5 text-[13px] font-medium text-neutral-900 dark:text-neutral-800">{{ service.uptime > 0 ? `${service.uptime}%` : 'Unknown' }}</dd>
              </div>
              <div>
                <dt class="text-[12px] text-neutral-500">Latency</dt>
                <dd class="mt-0.5 text-[13px] text-neutral-700 dark:text-neutral-600">{{ service.latency > 0 ? `${service.latency}ms` : '-' }}</dd>
              </div>
              <div>
                <dt class="text-[12px] text-neutral-500">Open incidents</dt>
                <dd class="mt-0.5 text-[13px] text-neutral-700 dark:text-neutral-600">{{ service.openIncidentCount }}</dd>
              </div>
              <div>
                <dt class="text-[12px] text-neutral-500">Last deployment</dt>
                <dd class="mt-0.5 text-[13px] text-neutral-700 dark:text-neutral-600">{{ formatDateTime(service.lastDeployment) }}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
