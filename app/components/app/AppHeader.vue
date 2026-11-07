<script setup lang="ts">
import { useAppStore } from '~/stores/app'

const appStore = useAppStore()
</script>

<template>
  <header class="flex h-14 shrink-0 items-center justify-between border-b border-neutral-200 bg-white px-4 dark:border-neutral-300 dark:bg-neutral-100">
    <!-- Left: mobile menu button + breadcrumbs -->
    <div class="flex items-center gap-3">
      <button
        class="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 lg:hidden dark:text-neutral-500 dark:hover:bg-neutral-200"
        @click="appStore.toggleMobileSidebar()"
        aria-label="Toggle sidebar"
      >
        <UIcon name="i-lucide-menu" class="h-5 w-5" />
      </button>
      <AppBreadcrumbs />
    </div>

    <!-- Right: search, notifications, user -->
    <div class="flex items-center gap-1.5">
      <!-- Search / Command palette trigger -->
      <button
        class="flex items-center gap-2 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-[13px] text-neutral-400 transition-colors hover:border-neutral-300 hover:text-neutral-500 dark:border-neutral-300 dark:bg-neutral-200 dark:text-neutral-500 dark:hover:border-neutral-400"
        @click="appStore.openCommandPalette()"
        aria-label="Open command palette"
      >
        <UIcon name="i-lucide-search" class="h-3.5 w-3.5" />
        <span class="hidden sm:inline">Search...</span>
        <kbd class="hidden rounded border border-neutral-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-neutral-400 sm:inline dark:border-neutral-400 dark:bg-neutral-300">
          ⌘K
        </kbd>
      </button>

      <!-- Color mode -->
      <UColorModeButton />

      <!-- Notifications -->
      <AppNotificationButton />

      <!-- User menu -->
      <AppUserMenu />
    </div>
  </header>
</template>
