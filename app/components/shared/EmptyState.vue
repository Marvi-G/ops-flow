<script setup lang="ts">
defineProps<{
  icon?: string
  title: string
  description?: string
}>()

defineSlots<{
  actions?: unknown
}>()
</script>

<template>
  <div class="flex flex-col items-center justify-center py-16 text-center">
    <div v-if="icon" class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-200">
      <UIcon :name="icon" class="h-5 w-5 text-neutral-400" />
    </div>
    <h3 class="text-[14px] font-medium text-neutral-900 dark:text-neutral-800">{{ title }}</h3>
    <p v-if="description" class="mt-1 max-w-sm text-[13px] text-neutral-500">{{ description }}</p>
    <div v-if="$slots.actions" class="mt-4">
      <slot name="actions" />
    </div>
  </div>
</template>
