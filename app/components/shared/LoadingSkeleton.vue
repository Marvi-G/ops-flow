<script setup lang="ts">
defineProps<{
  rows?: number
  columns?: number
}>()
</script>

<template>
  <div class="animate-pulse space-y-3">
    <div v-for="row in (rows || 5)" :key="row" class="flex gap-4">
      <div
        v-for="col in (columns || 4)"
        :key="col"
        class="h-4 flex-1 rounded bg-neutral-200 dark:bg-neutral-300"
        :style="{ maxWidth: col === 1 ? '200px' : '120px' }"
      />
    </div>
  </div>
</template>
