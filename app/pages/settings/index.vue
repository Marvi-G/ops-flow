<script setup lang="ts">
definePageMeta({ layout: 'default' })
</script>

<template>
  <SettingsSettingsLayout>
    <div class="max-w-xl">
      <div class="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-300 dark:bg-neutral-100">
        <h2 class="mb-4 text-[14px] font-semibold text-neutral-900 dark:text-neutral-800">General settings</h2>
        <div class="space-y-4">
          <div>
            <label class="mb-1.5 block text-[13px] font-medium text-neutral-700 dark:text-neutral-600">Organization ID</label>
            <p class="text-[13px] font-mono text-neutral-500">org-1</p>
          </div>
          <div>
            <label class="mb-1.5 block text-[13px] font-medium text-neutral-700 dark:text-neutral-600">Created</label>
            <p class="text-[13px] text-neutral-700 dark:text-neutral-600">January 15, 2024</p>
          </div>
          <div>
            <label class="mb-1.5 block text-[13px] font-medium text-neutral-700 dark:text-neutral-600">Timezone</label>
            <p class="text-[13px] text-neutral-700 dark:text-neutral-600">UTC-5 (Eastern Time)</p>
          </div>
        </div>
      </div>
    </div>
  </SettingsSettingsLayout>
</template>
