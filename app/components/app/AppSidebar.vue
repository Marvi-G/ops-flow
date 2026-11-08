<script setup lang="ts">
import { useAppStore } from '~/stores/app'

const appStore = useAppStore()
const route = useRoute()

const navItems = [
  { label: 'Overview', to: '/dashboard', icon: 'i-lucide-layout-dashboard' },
  { label: 'Incidents', to: '/incidents', icon: 'i-lucide-alert-triangle' },
  { label: 'Projects', to: '/projects', icon: 'i-lucide-folder-kanban' },
  { label: 'Services', to: '/services', icon: 'i-lucide-server' },
  { label: 'Teams', to: '/teams', icon: 'i-lucide-users' },
  { label: 'Activity', to: '/activity', icon: 'i-lucide-activity' }
]

const bottomItems = [
  { label: 'Settings', to: '/settings', icon: 'i-lucide-settings' }
]

function isActive(path: string): boolean {
  if (path === '/dashboard') {
    return route.path === '/dashboard' || route.path === '/'
  }
  return route.path.startsWith(path)
}
</script>

<template>
  <aside
    :class="[
      'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-neutral-200 bg-white transition-all duration-200 dark:border-neutral-300 dark:bg-neutral-100',
      appStore.sidebarCollapsed ? 'w-16' : 'w-60',
      appStore.sidebarMobileOpen ? 'translate-x-0' : '-translate-x-full',
      'lg:translate-x-0 lg:static lg:z-auto'
    ]"
  >
    <!-- Logo / Org switcher -->
    <div class="flex h-14 items-center border-b border-neutral-200 px-3 dark:border-neutral-300">
      <AppOrganizationSwitcher />
    </div>

    <!-- Navigation -->
    <nav class="flex-1 overflow-y-auto px-2 py-3" aria-label="Main navigation">
      <ul class="space-y-0.5">
        <li v-for="item in navItems" :key="item.to">
          <NuxtLink
            :to="item.to"
            :class="[
              'group flex items-center gap-3 rounded-md px-2.5 py-2 text-[13px] font-medium transition-colors',
              isActive(item.to)
                ? 'bg-primary-50 text-primary-600 dark:bg-primary-50 dark:text-primary-400'
                : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-500 dark:hover:bg-neutral-200 dark:hover:text-neutral-800'
            ]"
            @click="appStore.closeMobileSidebar()"
          >
            <UIcon :name="item.icon" class="h-4 w-4 shrink-0" />
            <span v-if="!appStore.sidebarCollapsed" class="truncate">{{ item.label }}</span>
            <span
              v-else
              class="invisible absolute left-full ml-2 rounded bg-neutral-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:visible group-hover:opacity-100 dark:bg-neutral-700"
              role="tooltip"
            >
              {{ item.label }}
            </span>
          </NuxtLink>
        </li>
      </ul>
    </nav>

    <!-- Bottom section -->
    <div class="border-t border-neutral-200 px-2 py-3 dark:border-neutral-300">
      <ul class="space-y-0.5">
        <li v-for="item in bottomItems" :key="item.to">
          <NuxtLink
            :to="item.to"
            :class="[
              'group flex items-center gap-3 rounded-md px-2.5 py-2 text-[13px] font-medium transition-colors',
              isActive(item.to)
                ? 'bg-primary-50 text-primary-600 dark:bg-primary-50 dark:text-primary-400'
                : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-500 dark:hover:bg-neutral-200 dark:hover:text-neutral-800'
            ]"
            @click="appStore.closeMobileSidebar()"
          >
            <UIcon :name="item.icon" class="h-4 w-4 shrink-0" />
            <span v-if="!appStore.sidebarCollapsed" class="truncate">{{ item.label }}</span>
            <span
              v-else
              class="invisible absolute left-full ml-2 rounded bg-neutral-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:visible group-hover:opacity-100 dark:bg-neutral-700"
              role="tooltip"
            >
              {{ item.label }}
            </span>
          </NuxtLink>
        </li>
      </ul>

      <!-- Collapse toggle (desktop only) -->
      <button
        class="mt-2 hidden w-full items-center gap-3 rounded-md px-2.5 py-2 text-[13px] font-medium text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700 lg:flex dark:text-neutral-500 dark:hover:bg-neutral-200 dark:hover:text-neutral-700"
        @click="appStore.toggleSidebar()"
        :aria-label="appStore.sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
      >
        <UIcon
          :name="appStore.sidebarCollapsed ? 'i-lucide-panel-left-open' : 'i-lucide-panel-left-close'"
          class="h-4 w-4 shrink-0"
        />
        <span v-if="!appStore.sidebarCollapsed">Collapse</span>
      </button>
    </div>
  </aside>
</template>
