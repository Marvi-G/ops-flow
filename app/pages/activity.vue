<script setup lang="ts">
import { useActivity } from '~/composables/useActivity'
import { users } from '~/services/mock-data'
import { formatRelativeTime } from '~/utils'

definePageMeta({ layout: 'default' })

const { events, loading, fetch: fetchActivity } = useActivity()
const search = ref('')
const filterUser = ref('')
const filterResource = ref('')

const filteredEvents = computed(() => {
  let result = events.value
  if (search.value) {
    const q = search.value.toLowerCase()
    result = result.filter(e =>
      e.action.toLowerCase().includes(q) ||
      e.resourceLabel.toLowerCase().includes(q) ||
      e.user?.name.toLowerCase().includes(q)
    )
  }
  if (filterUser.value) {
    result = result.filter(e => e.userId === filterUser.value)
  }
  if (filterResource.value) {
    result = result.filter(e => e.resourceType === filterResource.value)
  }
  return result
})

onMounted(() => fetchActivity())
</script>

<template>
  <div>
    <SharedPageHeader title="Activity" description="Audit log of all organization activity" />

    <!-- Filters -->
    <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
      <div class="relative max-w-xs flex-1">
        <UIcon name="i-lucide-search" class="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
        <input
          v-model="search"
          type="text"
          placeholder="Search activity..."
          class="h-8 w-full rounded-md border border-neutral-200 bg-white pl-8 pr-3 text-[13px] text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-neutral-300 dark:bg-neutral-100 dark:text-neutral-800"
        />
      </div>
      <select
        v-model="filterUser"
        class="h-8 rounded-md border border-neutral-200 bg-white px-2.5 text-[13px] text-neutral-700 dark:border-neutral-300 dark:bg-neutral-100 dark:text-neutral-600"
      >
        <option value="">All users</option>
        <option v-for="user in users" :key="user.id" :value="user.id">{{ user.name }}</option>
      </select>
      <select
        v-model="filterResource"
        class="h-8 rounded-md border border-neutral-200 bg-white px-2.5 text-[13px] text-neutral-700 dark:border-neutral-300 dark:bg-neutral-100 dark:text-neutral-600"
      >
        <option value="">All resources</option>
        <option value="incident">Incidents</option>
        <option value="project">Projects</option>
        <option value="service">Services</option>
        <option value="team">Teams</option>
        <option value="user">Users</option>
      </select>
    </div>

    <div v-if="loading">
      <SharedLoadingSkeleton :rows="8" :columns="3" />
    </div>

    <div v-else-if="filteredEvents.length === 0" class="rounded-lg border border-neutral-200 bg-white dark:border-neutral-300 dark:bg-neutral-100">
      <SharedEmptyState icon="i-lucide-activity" title="No activity found" description="Try adjusting your filters." />
    </div>

    <div v-else class="rounded-lg border border-neutral-200 bg-white dark:border-neutral-300 dark:bg-neutral-100">
      <div class="divide-y divide-neutral-200 dark:divide-neutral-300">
        <div
          v-for="event in filteredEvents"
          :key="event.id"
          class="flex items-start gap-3 px-4 py-3"
        >
          <div class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-[10px] font-semibold text-neutral-600 dark:bg-neutral-200 dark:text-neutral-500">
            {{ event.user?.name.split(' ').map(n => n[0]).join('') }}
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-[13px] text-neutral-700 dark:text-neutral-600">
              <span class="font-medium text-neutral-900 dark:text-neutral-800">{{ event.user?.name }}</span>
              {{ event.action }}
              <NuxtLink
                :to="`/${event.resourceType}s/${event.resourceId}`"
                class="font-medium text-neutral-900 hover:text-primary-500 dark:text-neutral-800 dark:hover:text-primary-400"
              >
                {{ event.resourceLabel }}
              </NuxtLink>
              <span v-if="event.details" class="text-neutral-500"> {{ event.details }}</span>
            </p>
            <p class="mt-0.5 text-[12px] text-neutral-400">{{ formatRelativeTime(event.createdAt) }}</p>
          </div>
          <span class="shrink-0 rounded-md bg-neutral-100 px-2 py-0.5 text-[11px] font-medium capitalize text-neutral-500 dark:bg-neutral-200 dark:text-neutral-500">
            {{ event.resourceType }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
