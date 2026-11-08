<script setup lang="ts">
import { useSessionStore } from '~/stores/session'

definePageMeta({ layout: 'default' })

const sessionStore = useSessionStore()

const form = reactive({
  name: sessionStore.organization.name,
  slug: sessionStore.organization.slug
})
</script>

<template>
  <SettingsLayout>
    <div class="max-w-xl">
      <div class="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-300 dark:bg-neutral-100">
        <h2 class="mb-4 text-[14px] font-semibold text-neutral-900 dark:text-neutral-800">Organization details</h2>
        <div class="space-y-4">
          <div>
            <label for="org-name" class="mb-1.5 block text-[13px] font-medium text-neutral-700 dark:text-neutral-600">Organization name</label>
            <input
              id="org-name"
              v-model="form.name"
              type="text"
              class="h-9 w-full rounded-md border border-neutral-200 bg-transparent px-3 text-[13px] text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-neutral-300 dark:text-neutral-800"
            />
          </div>
          <div>
            <label for="org-slug" class="mb-1.5 block text-[13px] font-medium text-neutral-700 dark:text-neutral-600">Slug</label>
            <input
              id="org-slug"
              v-model="form.slug"
              type="text"
              class="h-9 w-full rounded-md border border-neutral-200 bg-transparent px-3 text-[13px] text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-neutral-300 dark:text-neutral-800"
            />
          </div>
          <div>
            <label class="mb-1.5 block text-[13px] font-medium text-neutral-700 dark:text-neutral-600">Plan</label>
            <p class="text-[13px] capitalize text-neutral-700 dark:text-neutral-600">{{ sessionStore.organization.plan }}</p>
          </div>
        </div>
        <div class="mt-6 flex justify-end">
          <UButton color="primary" size="sm" label="Save changes" />
        </div>
      </div>
    </div>
  </SettingsLayout>
</template>
