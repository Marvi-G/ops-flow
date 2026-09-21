<script setup lang="ts">
import { useAppStore } from '~/stores/app'
import { useColorMode } from '#imports'

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

const filteredItems = computed(() => {
  if (!search.value) return staticItems
  const q = search.value.toLowerCase()
  return staticItems.filter(item =>
    item.label.toLowerCase().includes(q) ||
    item.category.toLowerCase().includes(q)
  )
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
          placeholder="Type a command or search..."
          class="h-12 w-full bg-transparent text-[14px] text-neutral-900 placeholder:text-neutral-400 focus:outline-none dark:text-neutral-800"
          autofocus
        />
        <kbd class="rounded border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 text-[10px] font-medium text-neutral-400 dark:border-neutral-400 dark:bg-neutral-200">
          ESC
        </kbd>
      </div>

      <!-- Results -->
      <div class="max-h-80 overflow-y-auto p-2">
        <div v-if="flatItems.length === 0" class="px-3 py-8 text-center text-[13px] text-neutral-400">
          No results found
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
                'flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left text-[13px] transition-colors',
                flatItems.indexOf(item) === selectedIndex
                  ? 'bg-neutral-100 text-neutral-900 dark:bg-neutral-200 dark:text-neutral-800'
                  : 'text-neutral-700 hover:bg-neutral-50 dark:text-neutral-600 dark:hover:bg-neutral-200/50'
              ]"
              @click="selectItem(item)"
              @mouseenter="selectedIndex = flatItems.indexOf(item)"
            >
              <UIcon :name="item.icon" class="h-4 w-4 shrink-0 text-neutral-400" />
              <span class="flex-1 truncate">{{ item.label }}</span>
            </button>
          </template>
        </template>
      </div>
    </div>
  </UModal>
</template>
