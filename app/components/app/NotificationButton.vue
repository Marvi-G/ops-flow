<script setup lang="ts">
import { useSessionStore } from '~/stores/session'
import { formatRelativeTime } from '~/utils'

const sessionStore = useSessionStore()
const router = useRouter()
const isOpen = ref(false)

const typeIcons: Record<string, string> = {
  incident: 'i-lucide-alert-triangle',
  assignment: 'i-lucide-user-plus',
  mention: 'i-lucide-at-sign',
  system: 'i-lucide-bell'
}
</script>

<template>
  <UPopover v-model:open="isOpen">
    <button
      class="relative rounded-md p-1.5 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-500 dark:hover:bg-neutral-200"
      aria-label="Notifications"
    >
      <UIcon name="i-lucide-bell" class="h-4.5 w-4.5" />
      <span
        v-if="sessionStore.unreadCount > 0"
        class="absolute right-0.5 top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-danger-500 text-[9px] font-bold text-white"
      >
        {{ sessionStore.unreadCount }}
      </span>
    </button>

    <template #content>
      <div class="w-80">
        <div class="flex items-center justify-between border-b border-neutral-200 px-3 py-2.5 dark:border-neutral-300">
          <h3 class="text-[13px] font-semibold text-neutral-900 dark:text-neutral-800">Notifications</h3>
          <button
            v-if="sessionStore.unreadCount > 0"
            class="text-[12px] text-primary-500 hover:text-primary-600"
            @click="sessionStore.markAllRead()"
          >
            Mark all read
          </button>
        </div>
        <div class="max-h-80 overflow-y-auto">
          <button
            v-for="notif in sessionStore.notificationsList"
            :key="notif.id"
            :class="[
              'flex w-full gap-3 px-3 py-2.5 text-left transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-200',
              !notif.read ? 'bg-primary-50/40 dark:bg-primary-50/10' : ''
            ]"
            @click="router.push(notif.link || '/'); isOpen = false"
          >
            <UIcon
              :name="typeIcons[notif.type] || 'i-lucide-bell'"
              class="mt-0.5 h-4 w-4 shrink-0 text-neutral-400"
            />
            <div class="min-w-0 flex-1">
              <p :class="['text-[13px]', !notif.read ? 'font-medium text-neutral-900 dark:text-neutral-800' : 'text-neutral-700 dark:text-neutral-600']">
                {{ notif.title }}
              </p>
              <p class="truncate text-[12px] text-neutral-500">{{ notif.description }}</p>
              <p class="mt-0.5 text-[11px] text-neutral-400">{{ formatRelativeTime(notif.createdAt) }}</p>
            </div>
            <span v-if="!notif.read" class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-500" />
          </button>
          <div
            v-if="sessionStore.notificationsList.length === 0"
            class="px-3 py-8 text-center text-[13px] text-neutral-400"
          >
            No notifications
          </div>
        </div>
      </div>
    </template>
  </UPopover>
</template>
