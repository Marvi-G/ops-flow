<script setup lang="ts">
import type { IncidentStatus } from '~/types'

const props = defineProps<{
  status: IncidentStatus
}>()

const config: Record<IncidentStatus, { label: string; class: string }> = {
  investigating: { label: 'Investigating', class: 'bg-warning-50 text-warning-500 dark:bg-warning-50/20 dark:text-warning-700' },
  identified: { label: 'Identified', class: 'bg-info-50 text-info-500 dark:bg-info-50/20 dark:text-info-700' },
  monitoring: { label: 'Monitoring', class: 'bg-info-50 text-info-500 dark:bg-info-50/20 dark:text-info-700' },
  resolved: { label: 'Resolved', class: 'bg-success-50 text-success-500 dark:bg-success-50/20 dark:text-success-700' },
  postmortem: { label: 'Post-mortem', class: 'bg-neutral-100 text-neutral-500 dark:bg-neutral-200 dark:text-neutral-500' }
}

const current = computed(() => config[props.status])
</script>

<template>
  <span :class="['inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium', current.class]">
    {{ current.label }}
  </span>
</template>
