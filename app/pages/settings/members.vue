<script setup lang="ts">
import { userRepository } from '~/services/repository'
import type { User } from '~/types'

definePageMeta({ layout: 'default' })

const users = ref<User[]>([])
const loading = ref(true)
const loadError = ref('')

onMounted(async () => {
  try {
    users.value = await userRepository.list()
  } catch (err) {
    loadError.value = err instanceof Error ? err.message : 'Failed to load members'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <SettingsLayout>
    <div>
      <div class="mb-4 flex items-center justify-between">
        <p class="text-[13px] text-neutral-500">{{ loading ? 'Loading members...' : `${users.length} members` }}</p>
        <UButton color="primary" size="sm" icon="i-lucide-user-plus" label="Invite member" />
      </div>

      <div v-if="loading">
        <SharedLoadingSkeleton :rows="4" :columns="3" />
      </div>

      <div v-else-if="loadError" class="rounded-md bg-danger-50 p-3 text-[13px] text-danger-500 dark:bg-danger-50/20">
        {{ loadError }}
      </div>

      <div v-else class="rounded-lg border border-neutral-200 bg-white dark:border-neutral-300 dark:bg-neutral-100">
        <div class="divide-y divide-neutral-200 dark:divide-neutral-300">
          <div
            v-for="user in users"
            :key="user.id"
            class="flex items-center justify-between gap-3 px-4 py-3"
          >
            <div class="flex min-w-0 items-center gap-3">
              <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-[11px] font-semibold text-neutral-600 dark:bg-neutral-300 dark:text-neutral-500">
                {{ user.name.split(' ').map(n => n[0]).join('') }}
              </div>
              <div class="min-w-0">
                <p class="truncate text-[13px] font-medium text-neutral-900 dark:text-neutral-800">{{ user.name }}</p>
                <p class="truncate text-[12px] text-neutral-500">{{ user.email }}</p>
              </div>
            </div>
            <span
              :class="[
                'shrink-0 rounded-md px-2 py-0.5 text-[11px] font-medium capitalize',
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
  </SettingsLayout>
</template>
