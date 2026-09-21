<script setup lang="ts">
import { useAppStore } from '~/stores/app'
import { useColorMode } from '#imports'
import { incidents, projects, services } from '~/services/mock-data'

const appStore = useAppStore()
const router = useRouter()
const colorMode = useColorMode()

const search = ref('')
const selectedIndex = ref(0)

interface PaletteItem {
  id: string
  label: string
  description?: string
  icon: string
  category: string
  action: () => void
}

const staticItems: PaletteItem[] = [
  { id: 'nav-dashboard', label: 'Go to Dashboard', icon: 'i-lucide-layout-dashboard', category: 'Navigation', action: () => navigate('/dashboard') },
  { id: 'nav-incidents', label: 'Go to Incidents', icon: 'i-lucide-alert-triangle', category: 'Navigation', action: () => navigate('/incidents') },
  { id: 'nav-projects', label: 'Go to Projects', icon: 'i-lucide-folder-kanban', category: 'Navigation', action: () => navigate('/projects') },
  { id: 'nav-services', label: 'Go to Services', icon: 'i-lucide-server', category: 'Navigation', action: () => navigate('/services') },
  { id: 'nav-teams', label: 'Go to Teams', icon: 'i-lucide-users', category: 'Navigation', action: () => navigate('/teams') },
  { id: 'nav-activity', label: 'Go to Activity', icon: 'i-lucide-activity', category: 'Navigation', action: () => navigate('/activity') },
  { id: 'nav-settings', label: 'Go to Settings', icon: 'i-lucide-settings', category: 'Navigation', action: () => navigate('/settings') },
  { id: 'action-incident', label: 'Create Incident', icon: 'i-lucide-plus', category: 'Actions', action: () => navigate('/incidents/new') },
  { id: 'action-project', label: 'Create Project', icon: 'i-lucide-plus', category: 'Actions', action: () => navigate('/projects') },
  { id: 'action-service', label: 'Add Service', icon: 'i-lucide-plus', category: 'Actions', action: () => navigate('/services') },
  { id: 'action-member', label: 'Invite Member', icon: 'i-lucide-user-plus', category: 'Actions', action: () => navigate('/settings/members') },
  { id: 'theme-toggle', label: 'Toggle Dark Mode', icon: 'i-lucide-moon', category: 'Actions', action: () => toggleTheme() }
]

// Entity search items
const incidentItems = computed<PaletteItem[]>(() =>
  incidents.slice(0, 5).map(inc => ({
    id: `incident-${inc.id}`,
    label: `INC-${inc.number} ${inc.title}`,
    description: `${inc.severity} · ${inc.status}`,
    icon: 'i-lucide-alert-triangle',
    category: 'Incidents',
    action: () => navigate(`/incidents/${inc.id}`)
  }))
)

const projectItems = computed<PaletteItem[]>(() =>
  projects.slice(0, 5).map(proj => ({
    id: `project-${proj.id}`,
    label: proj.name,
    description: proj.description,
    icon: 'i-lucide-folder-kanban',
    category: 'Projects',
    action: () => navigate(`/projects/${proj.id}`)
  }))
)

const serviceItems = computed<PaletteItem[]>(() =>
  services.slice(0, 5).map(svc => ({
    id: `service-${svc.id}`,
    label: svc.name,
    description: `${svc.status} · ${svc.uptime}% uptime`,
    icon: 'i-lucide-server',
    category: 'Services',
    action: () => navigate(`/services/${svc.id}`)
  }))
)

const filteredItems = computed(() => {
  if (!search.value) return staticItems

  const q = search.value.toLowerCase()

  // Search across all categories
  const results: PaletteItem[] = []

  // Static items
  for (const item of staticItems) {
    if (item.label.toLowerCase().includes(q) || item.category.toLowerCase().includes(q)) {
      results.push(item)
    }
  }

  // Incidents
  for (const inc of incidents) {
    if (
      inc.title.toLowerCase().includes(q) ||
      `inc-${inc.number}`.toLowerCase().includes(q) ||
      inc.severity.toLowerCase().includes(q) ||
      inc.status.toLowerCase().includes(q)
    ) {
      results.push({
        id: `incident-${inc.id}`,
        label: `INC-${inc.number} ${inc.title}`,
        description: `${inc.severity} · ${inc.status}`,
        icon: 'i-lucide-alert-triangle',
        category: 'Incidents',
        action: () => navigate(`/incidents/${inc.id}`)
      })
    }
  }

  // Projects
  for (const proj of projects) {
    if (proj.name.toLowerCase().includes(q) || proj.description.toLowerCase().includes(q)) {
      results.push({
        id: `project-${proj.id}`,
        label: proj.name,
        description: proj.description,
        icon: 'i-lucide-folder-kanban',
        category: 'Projects',
        action: () => navigate(`/projects/${proj.id}`)
      })
    }
  }

  // Services
  for (const svc of services) {
    if (svc.name.toLowerCase().includes(q) || svc.description.toLowerCase().includes(q)) {
      results.push({
        id: `service-${svc.id}`,
        label: svc.name,
        description: `${svc.status} · ${svc.uptime}% uptime`,
        icon: 'i-lucide-server',
        category: 'Services',
        action: () => navigate(`/services/${svc.id}`)
      })
    }
  }

  return results.slice(0, 20) // Limit results
})

const groupedItems = computed(() => {
  const groups: Record<string, PaletteItem[]> = {}
  for (const item of filteredItems.value) {
    if (!groups[item.category]) groups[item.category] = []
    groups[item.category].push(item)
  }
  return groups
})

const flatItems = computed(() => filteredItems.value)

function navigate(path: string) {
  appStore.closeCommandPalette()
  router.push(path)
}

function toggleTheme() {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
  appStore.closeCommandPalette()
}

function selectItem(item: PaletteItem) {
  item.action()
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    selectedIndex.value = Math.min(selectedIndex.value + 1, flatItems.value.length - 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    selectedIndex.value = Math.max(selectedIndex.value - 1, 0)
  } else if (e.key === 'Enter' && flatItems.value[selectedIndex.value]) {
    e.preventDefault()
    selectItem(flatItems.value[selectedIndex.value])
  }
}

// Keyboard shortcut
function onGlobalKeydown(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault()
    appStore.openCommandPalette()
  }
}

onMounted(() => {
  document.addEventListener('keydown', onGlobalKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', onGlobalKeydown)
})

watch(() => appStore.commandPaletteOpen, (open) => {
  if (open) {
    search.value = ''
    selectedIndex.value = 0
  }
})

// Reset selection when search changes
watch(search, () => {
  selectedIndex.value = 0
})
</script>

<template>
  <UModal v-model:open="appStore.commandPaletteOpen" :ui="{ content: 'rounded-xl overflow-hidden' }">
    <div class="flex flex-col" @keydown="onKeydown">
      <!-- Search input -->
      <div class="flex items-center gap-3 border-b border-neutral-200 px-4 dark:border-neutral-300">
        <UIcon name="i-lucide-search" class="h-4 w-4 shrink-0 text-neutral-400" />
        <input
          v-model="search"
          type="text"
          :placeholder="search ? 'Search...' : 'Type a command or search...'"
          class="h-12 w-full bg-transparent text-[14px] text-neutral-900 placeholder:text-neutral-400 focus:outline-none dark:text-neutral-800"
          autofocus
        />
        <kbd class="rounded border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 text-[10px] font-medium text-neutral-400 dark:border-neutral-400 dark:bg-neutral-200">
          ESC
        </kbd>
      </div>

      <!-- Results -->
      <div class="max-h-96 overflow-y-auto p-2">
        <div v-if="flatItems.length === 0" class="px-3 py-8 text-center text-[13px] text-neutral-400">
          <UIcon name="i-lucide-search-x" class="mx-auto mb-2 h-6 w-6" />
          No results found for "{{ search }}"
        </div>

        <template v-else>
          <template v-for="(items, category) in groupedItems" :key="category">
            <p class="px-2.5 py-1.5 text-[11px] font-medium uppercase tracking-wider text-neutral-400">
              {{ category }}
            </p>
            <button
              v-for="item in items"
              :key="item.id"
              :class="[
                'flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left transition-colors',
                flatItems.indexOf(item) === selectedIndex
                  ? 'bg-neutral-100 dark:bg-neutral-200'
                  : 'hover:bg-neutral-50 dark:hover:bg-neutral-200/50'
              ]"
              @click="selectItem(item)"
              @mouseenter="selectedIndex = flatItems.indexOf(item)"
            >
              <UIcon :name="item.icon" class="h-4 w-4 shrink-0 text-neutral-400" />
              <div class="min-w-0 flex-1">
                <span class="block truncate text-[13px] text-neutral-900 dark:text-neutral-800">{{ item.label }}</span>
                <span v-if="item.description" class="block truncate text-[11px] text-neutral-500">{{ item.description }}</span>
              </div>
            </button>
          </template>
        </template>
      </div>

      <!-- Footer -->
      <div class="flex items-center justify-between border-t border-neutral-200 px-4 py-2 dark:border-neutral-300">
        <div class="flex items-center gap-3 text-[11px] text-neutral-400">
          <span class="flex items-center gap-1">
            <kbd class="rounded border border-neutral-200 bg-neutral-50 px-1 py-0.5 dark:border-neutral-400 dark:bg-neutral-200">↑↓</kbd>
            Navigate
          </span>
          <span class="flex items-center gap-1">
            <kbd class="rounded border border-neutral-200 bg-neutral-50 px-1 py-0.5 dark:border-neutral-400 dark:bg-neutral-200">↵</kbd>
            Select
          </span>
          <span class="flex items-center gap-1">
            <kbd class="rounded border border-neutral-200 bg-neutral-50 px-1 py-0.5 dark:border-neutral-400 dark:bg-neutral-200">esc</kbd>
            Close
          </span>
        </div>
      </div>
    </div>
  </UModal>
</template>
