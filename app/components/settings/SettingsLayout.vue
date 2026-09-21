<script setup lang="ts">
const route = useRoute()

const settingsNav = [
  { label: 'General', to: '/settings' },
  { label: 'Organization', to: '/settings/organization' },
  { label: 'Members', to: '/settings/members' },
  { label: 'Roles & Permissions', to: '/settings/roles' },
  { label: 'Notifications', to: '/settings/notifications' },
  { label: 'API Keys', to: '/settings/api-keys' },
  { label: 'Appearance', to: '/settings/appearance' }
]

function isActive(path: string): boolean {
  return route.path === path
}
</script>

<template>
  <div>
    <SharedPageHeader title="Settings" description="Manage your organization settings" />

    <div class="flex flex-col gap-6 lg:flex-row">
      <nav class="w-full shrink-0 lg:w-48">
        <ul class="flex gap-1 overflow-x-auto lg:flex-col">
          <li v-for="item in settingsNav" :key="item.to">
            <NuxtLink
              :to="item.to"
              :class="[
                'block whitespace-nowrap rounded-md px-3 py-2 text-[13px] font-medium transition-colors',
                isActive(item.to)
                  ? 'bg-primary-50 text-primary-600 dark:bg-primary-50 dark:text-primary-400'
                  : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-500 dark:hover:bg-neutral-200 dark:hover:text-neutral-800'
              ]"
            >
              {{ item.label }}
            </NuxtLink>
          </li>
        </ul>
      </nav>

      <div class="min-w-0 flex-1">
        <slot />
      </div>
    </div>
  </div>
</template>
