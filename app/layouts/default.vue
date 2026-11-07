<script setup lang="ts">
import { useAppStore } from '~/stores/app'

const appStore = useAppStore()
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-neutral-50 dark:bg-neutral-50">
    <!-- Mobile overlay -->
    <div
      v-if="appStore.sidebarMobileOpen"
      class="fixed inset-0 z-40 bg-black/40 lg:hidden"
      @click="appStore.closeMobileSidebar()"
    />

    <!-- Sidebar -->
    <AppSidebar />

    <!-- Main area -->
    <div class="flex flex-1 flex-col overflow-hidden">
      <AppHeader />

      <main class="flex-1 overflow-y-auto">
        <div class="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
          <slot />
        </div>
      </main>
    </div>

    <!-- Command Palette -->
    <AppCommandPalette />
  </div>
</template>
