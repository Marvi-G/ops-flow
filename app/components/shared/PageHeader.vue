<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()

defineSlots<{
  actions?: unknown
}>()
</script>

<template>
  <div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
    <div class="min-w-0">
      <h1 class="break-words text-xl font-semibold text-neutral-900 dark:text-neutral-800">{{ title }}</h1>
      <p v-if="description" class="mt-1 text-[13px] text-neutral-500">{{ description }}</p>
    </div>
    <div v-if="$slots.actions" class="flex shrink-0 items-center gap-2">
      <slot name="actions" />
    </div>
  </div>
</template>
