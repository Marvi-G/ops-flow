<script setup lang="ts">
import { useSessionStore } from '~/stores/session'
import { getInitials } from '~/utils'

const sessionStore = useSessionStore()
const router = useRouter()

const items = [
  [
    {
      label: sessionStore.user.name,
      slot: 'account',
      disabled: true
    }
  ],
  [
    { label: 'Profile', icon: 'i-lucide-user', onSelect: () => {} },
    { label: 'Settings', icon: 'i-lucide-settings', onSelect: () => router.push('/settings') }
  ],
  [
    {
      label: 'Sign out',
      icon: 'i-lucide-log-out',
      onSelect: () => sessionStore.logout()
    }
  ]
]
</script>

<template>
  <UDropdownMenu :items="items" :content="{ align: 'end' }">
    <button
      class="flex h-7 w-7 items-center justify-center rounded-full bg-primary-500 text-[11px] font-semibold text-white transition-opacity hover:opacity-90"
      :aria-label="`User menu for ${sessionStore.user.name}`"
    >
      {{ getInitials(sessionStore.user.name) }}
    </button>

    <template #account-item>
      <div class="px-1 py-1">
        <p class="text-[13px] font-medium text-neutral-900 dark:text-neutral-800">{{ sessionStore.user.name }}</p>
        <p class="text-[12px] text-neutral-500">{{ sessionStore.user.email }}</p>
      </div>
    </template>
  </UDropdownMenu>
</template>
