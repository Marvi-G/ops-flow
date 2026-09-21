<script setup lang="ts">
import type { ServiceStatus } from '~/types'

const props = defineProps<{
  status: ServiceStatus
}>()

const config: Record<ServiceStatus, { label: string; dot: string; text: string }> = {
  operational: { label: 'Operational', dot: 'bg-success-500', text: 'text-success-500' },
  degraded: { label: 'Degraded', dot: 'bg-warning-500', text: 'text-warning-500' },
  partial_outage: { label: 'Partial Outage', dot: 'bg-warning-500', text: 'text-warning-500' },
  major_outage: { label: 'Major Outage', dot: 'bg-danger-500', text: 'text-danger-500' },
  unknown: { label: 'Unknown', dot: 'bg-neutral-400', text: 'text-neutral-400' }
}

const current = computed(() => config[props.status])
</script>

<template>
  <span :class="['inline-flex items-center gap-1.5 text-[12px] font-medium', current.text]">
    <span :class="['h-1.5 w-1.5 rounded-full', current.dot]" />
    {{ current.label }}
  </span>
</template>
