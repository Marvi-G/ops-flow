<script setup lang="ts">
import { useSessionStore } from '~/stores/session'

const sessionStore = useSessionStore()
const isOpen = ref(false)

function selectOrg(orgId: string) {
  sessionStore.switchOrganization(orgId)
  isOpen.value = false
}
</script>

<template>
  <UPopover v-model:open="isOpen">
    <button
      class="flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-200"
      aria-label="Switch organization"
    >
      <div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary-500 text-[11px] font-semibold text-white">
        {{ sessionStore.organization.name[0] }}
      </div>
      <span class="truncate text-[13px] font-semibold text-neutral-900 dark:text-neutral-800">
        {{ sessionStore.organization.name }}
      </span>
      <UIcon name="i-lucide-chevron-down" class="ml-auto h-3.5 w-3.5 shrink-0 text-neutral-400" />
    </button>

    <template #content>
      <div class="w-64 p-1.5">
        <p class="px-2.5 py-1.5 text-[11px] font-medium uppercase tracking-wider text-neutral-400">
          Organizations
        </p>
        <button
          v-for="org in sessionStore.allOrganizations"
          :key="org.id"
          :class="[
            'flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] transition-colors',
            org.id === sessionStore.organization.id
              ? 'bg-primary-50 text-primary-600 dark:bg-primary-50 dark:text-primary-400'
              : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-600 dark:hover:bg-neutral-200'
          ]"
          @click="selectOrg(org.id)"
        >
          <div class="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-neutral-200 text-[10px] font-semibold text-neutral-600 dark:bg-neutral-300 dark:text-neutral-500">
            {{ org.name[0] }}
          </div>
          <span class="truncate">{{ org.name }}</span>
          <UIcon
            v-if="org.id === sessionStore.organization.id"
            name="i-lucide-check"
            class="ml-auto h-3.5 w-3.5"
          />
        </button>
      </div>
    </template>
  </UPopover>
</template>
