<script setup lang="ts">
import { users } from '~/services/mock-data'

definePageMeta({ layout: 'default' })
</script>

<template>
  <SettingsSettingsLayout>
    <div>
      <div class="mb-4 flex items-center justify-between">
        <p class="text-[13px] text-neutral-500">{{ users.length }} members</p>
        <UButton color="primary" size="sm" icon="i-lucide-user-plus" label="Invite member" />
      </div>

      <div class="rounded-lg border border-neutral-200 bg-white dark:border-neutral-300 dark:bg-neutral-100">
        <div class="divide-y divide-neutral-200 dark:divide-neutral-300">
          <div
            v-for="user in users"
            :key="user.id"
            class="flex items-center justify-between px-4 py-3"
          >
            <div class="flex items-center gap-3">
              <div class="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-200 text-[11px] font-semibold text-neutral-600 dark:bg-neutral-300 dark:text-neutral-500">
                {{ user.name.split(' ').map(n => n[0]).join('') }}
              </div>
              <div>
                <p class="text-[13px] font-medium text-neutral-900 dark:text-neutral-800">{{ user.name }}</p>
                <p class="text-[12px] text-neutral-500">{{ user.email }}</p>
              </div>
            </div>
            <span
              :class="[
                'rounded-md px-2 py-0.5 text-[11px] font-medium capitalize',
                user.role === 'owner' ? 'bg-primary-50 text-primary-600 dark:bg-primary-50 dark:text-primary-400' :
                user.role === 'admin' ? 'bg-info-50 text-info-500 dark:bg-info-50/20 dark:text-info-700' :
                'bg-neutral-100 text-neutral-500 dark:bg-neutral-200 dark:text-neutral-500'
              ]"
            >
              {{ user.role }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </SettingsSettingsLayout>
</template>
