<script setup lang="ts">
const route = useRoute()

interface Crumb {
  label: string
  to?: string
}

const crumbs = computed<Crumb[]>(() => {
  const path = route.path
  const items: Crumb[] = [{ label: 'Overview', to: '/dashboard' }]

  if (path === '/dashboard' || path === '/') return items

  const segments = path.split('/').filter(Boolean)
  let currentPath = ''

  const labels: Record<string, string> = {
    incidents: 'Incidents',
    projects: 'Projects',
    services: 'Services',
    teams: 'Teams',
    activity: 'Activity',
    settings: 'Settings',
    new: 'New',
    organization: 'Organization',
    members: 'Members',
    roles: 'Roles & Permissions',
    notifications: 'Notifications',
    'api-keys': 'API Keys',
    appearance: 'Appearance'
  }

  for (const seg of segments) {
    currentPath += `/${seg}`
    if (seg === 'dashboard') continue
    const label = labels[seg]
    if (label) {
      items.push({ label, to: currentPath })
    } else if (/^(inc|proj|svc|team)-/.test(seg)) {
      // Dynamic IDs - show a generic label, actual name would come from data
      items.push({ label: 'Details' })
    }
  }

  return items
})
</script>

<template>
  <nav aria-label="Breadcrumb" class="hidden sm:block">
    <ol class="flex items-center gap-1.5 text-[13px]">
      <li v-for="(crumb, index) in crumbs" :key="crumb.label" class="flex items-center gap-1.5">
        <span v-if="index > 0" class="text-neutral-300 dark:text-neutral-400">/</span>
        <NuxtLink
          v-if="crumb.to && index < crumbs.length - 1"
          :to="crumb.to"
          class="text-neutral-500 transition-colors hover:text-neutral-700 dark:text-neutral-500 dark:hover:text-neutral-700"
        >
          {{ crumb.label }}
        </NuxtLink>
        <span
          v-else
          class="font-medium text-neutral-900 dark:text-neutral-800"
          :aria-current="index === crumbs.length - 1 ? 'page' : undefined"
        >
          {{ crumb.label }}
        </span>
      </li>
    </ol>
  </nav>
</template>
