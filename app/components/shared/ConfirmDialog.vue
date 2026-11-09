<script setup lang="ts">
withDefaults(defineProps<{
  title: string
  description: string
  confirmLabel?: string
  danger?: boolean
  loading?: boolean
  /** Shown inside the dialog when the action failed, so it stays open for another try. */
  error?: string
}>(), {
  confirmLabel: 'Confirm',
  danger: false,
  loading: false,
  error: ''
})

const open = defineModel<boolean>('open', { default: false })

defineEmits<{ confirm: [] }>()
</script>

<template>
  <UModal
    v-model:open="open"
    :title="title"
    :description="description"
    :dismissible="!loading"
    :ui="{ content: 'rounded-xl' }"
  >
    <!-- The default slot is the modal's trigger; the body goes in #content -->
    <template #content>
      <div class="p-6">
        <div
          :class="[
            'mb-4 flex h-10 w-10 items-center justify-center rounded-full',
            danger ? 'bg-danger-50 dark:bg-danger-50/20' : 'bg-warning-50 dark:bg-warning-50/20'
          ]"
        >
          <UIcon
            :name="danger ? 'i-lucide-trash-2' : 'i-lucide-alert-triangle'"
            :class="['h-5 w-5', danger ? 'text-danger-500' : 'text-warning-500']"
          />
        </div>
        <h3 class="mb-1 text-[14px] font-semibold text-neutral-900 dark:text-neutral-800">{{ title }}</h3>
        <p class="text-[13px] text-neutral-500">{{ description }}</p>

        <p v-if="error" class="mt-4 rounded-md bg-danger-50 p-3 text-[13px] text-danger-500 dark:bg-danger-50/20">
          {{ error }}
        </p>

        <div class="mt-6 flex justify-end gap-2">
          <button
            type="button"
            class="rounded-md border border-neutral-200 px-3 py-1.5 text-[13px] font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-300 dark:text-neutral-600 dark:hover:bg-neutral-200"
            :disabled="loading"
            @click="open = false"
          >
            Cancel
          </button>
          <UButton
            :color="danger ? 'error' : 'primary'"
            size="sm"
            :label="confirmLabel"
            :loading="loading"
            @click="$emit('confirm')"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>
