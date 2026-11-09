<script setup lang="ts">
import type { IncidentSeverity } from '~/types'

const props = defineProps<{
  severity: IncidentSeverity
}>()

const config: Record<IncidentSeverity, { label: string; class: string }> = {
  critical: { label: 'Critical', class: 'bg-danger-50 text-danger-500 dark:bg-danger-50/20 dark:text-danger-700' },
  high: { label: 'High', class: 'bg-warning-50 text-warning-500 dark:bg-warning-50/20 dark:text-warning-700' },
  medium: { label: 'Medium', class: 'bg-info-50 text-info-500 dark:bg-info-50/20 dark:text-info-700' },
  low: { label: 'Low', class: 'bg-neutral-100 text-neutral-500 dark:bg-neutral-200 dark:text-neutral-500' }
}

const current = computed(() => config[props.severity])
</script>

<template>
  <span :class="['inline-flex shrink-0 items-center whitespace-nowrap rounded-md px-2 py-0.5 text-[11px] font-medium', current.class]">
    {{ current.label }}
  </span>
</template>
