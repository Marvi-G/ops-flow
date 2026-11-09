<script setup lang="ts">
import type { Incident } from '~/types'
import { formatRelativeTime } from '~/utils'

defineProps<{
  incident: Pick<Incident, 'id' | 'number' | 'title' | 'severity' | 'status' | 'createdAt'>
  /** A second line under the title, e.g. the team. */
  subtitle?: string
  /** Show how long ago it was created, on the right. */
  showTime?: boolean
}>()
</script>

<template>
  <!--
    Phones: the badges sit on the first line and the title gets the full width below them.
    From sm up everything is on one line, with the title taking the leftover space.
  -->
  <NuxtLink
    :to="`/incidents/${incident.id}`"
    class="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-3 transition-colors hover:bg-neutral-50 sm:flex-nowrap dark:hover:bg-neutral-200/50"
  >
    <SharedSeverityBadge :severity="incident.severity" class="order-1" />
    <IncidentsIncidentStatusBadge :status="incident.status" class="order-2 sm:order-3" />

    <div class="order-3 min-w-0 basis-full sm:order-2 sm:flex-1 sm:basis-0">
      <p class="line-clamp-2 break-words text-[13px] font-medium text-neutral-900 sm:line-clamp-1 dark:text-neutral-800">
        INC-{{ incident.number }} {{ incident.title }}
      </p>
      <p v-if="subtitle" class="mt-0.5 truncate text-[12px] text-neutral-500">{{ subtitle }}</p>
    </div>

    <span v-if="showTime" class="order-2 ml-auto whitespace-nowrap text-[12px] text-neutral-400 sm:order-4 sm:ml-0">
      {{ formatRelativeTime(incident.createdAt) }}
    </span>
  </NuxtLink>
</template>
