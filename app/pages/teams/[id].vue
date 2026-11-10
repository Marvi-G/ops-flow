<script setup lang="ts">
import { useTeams } from '~/composables/useTeams'
import { incidentRepository, projectRepository, teamRepository, userRepository } from '~/services/repository'
import type { Incident, Project, Team, TeamMember, User } from '~/types'

definePageMeta({ layout: 'default' })

const route = useRoute()
const teamId = route.params.id as string
const { fetchById } = useTeams()
const team = ref<Team | null>(null)
const teamProjects = ref<Project[]>([])
const teamIncidents = ref<Incident[]>([])
const teamIncidentTotal = ref(0)
const loaded = ref(false)
const loadError = ref('')
const activeTab = ref('members')
const { can } = usePermissions()

const showEdit = ref(false)
const showDelete = ref(false)
const deleting = ref(false)
const deleteError = ref('')

function onSaved(updated: Team) {
  team.value = updated
}

async function confirmDelete() {
  if (deleting.value) return
  deleting.value = true
  deleteError.value = ''
  try {
    await teamRepository.delete(teamId)
    showDelete.value = false
    await navigateTo('/teams')
  } catch (err) {
    // Typically "still owns projects": the dialog stays open and explains why
    deleteError.value = err instanceof Error ? err.message : 'Failed to delete the team'
  } finally {
    deleting.value = false
  }
}

// Members
const orgUsers = ref<User[]>([])
const showAddMember = ref(false)
const addUserId = ref('')
const memberBusy = ref(false)
const memberError = ref('')
const memberToRemove = ref<TeamMember | null>(null)
const showRemove = ref(false)

const availableUsers = computed(() => {
  const inTeam = new Set(team.value?.members.map(m => m.userId))
  return orgUsers.value.filter(u => !inTeam.has(u.id))
})

async function openAddMember() {
  showAddMember.value = true
  memberError.value = ''
  if (!orgUsers.value.length) {
    try {
      orgUsers.value = await userRepository.list()
    } catch (err) {
      memberError.value = err instanceof Error ? err.message : 'Could not load the organization members'
    }
  }
}

/** Runs one member change, then shows the team the server returns. */
async function changeMembers(action: () => Promise<Team | undefined>) {
  if (memberBusy.value) return
  memberBusy.value = true
  memberError.value = ''
  try {
    const updated = await action()
    team.value = updated ?? (await teamRepository.getById(teamId)) ?? team.value
  } catch (err) {
    memberError.value = err instanceof Error ? err.message : 'Failed to update the team'
  } finally {
    memberBusy.value = false
  }
}

async function addMember() {
  if (!addUserId.value) return
  await changeMembers(() => teamRepository.addMember(teamId, addUserId.value))
  if (!memberError.value) {
    addUserId.value = ''
    showAddMember.value = false
  }
}

function toggleLead(member: TeamMember) {
  return changeMembers(() => teamRepository.setMemberRole(teamId, member.userId, member.role === 'lead' ? 'member' : 'lead'))
}

function askRemove(member: TeamMember) {
  memberToRemove.value = member
  memberError.value = ''
  showRemove.value = true
}

async function confirmRemove() {
  const member = memberToRemove.value
  if (!member) return
  // Removing returns nothing, so the team is read again afterwards
  await changeMembers(async () => {
    await teamRepository.removeMember(teamId, member.userId)
    return undefined
  })
  if (!memberError.value) showRemove.value = false
}

function memberMenu(member: TeamMember) {
  return [
    [{
      label: member.role === 'lead' ? 'Make regular member' : 'Make team lead',
      icon: 'i-lucide-star',
      onSelect: () => toggleLead(member)
    }],
    [{
      label: 'Remove from team',
      icon: 'i-lucide-user-minus',
      color: 'error' as const,
      onSelect: () => askRemove(member)
    }]
  ]
}

onMounted(async () => {
  try {
    team.value = (await fetchById(teamId)) ?? null
    if (team.value) {
      const [allProjects, incidentResult] = await Promise.all([
        projectRepository.list(),
        incidentRepository.list({ teamId: [teamId] }, { pageSize: 20 })
      ])
      teamProjects.value = allProjects.filter(p => p.teamId === teamId)
      teamIncidents.value = incidentResult.data
      teamIncidentTotal.value = incidentResult.total
    }
  } catch (err) {
    loadError.value = err instanceof Error ? err.message : 'Failed to load the team'
  } finally {
    loaded.value = true
  }
})

const tabs = ['members', 'projects', 'incidents', 'activity']
</script>

<template>
  <div>
    <div v-if="!loaded" class="space-y-4">
      <SharedLoadingSkeleton :rows="3" :columns="3" />
    </div>

    <div v-else-if="loadError || !team" class="rounded-lg border border-neutral-200 bg-white dark:border-neutral-300 dark:bg-neutral-100">
      <SharedEmptyState
        icon="i-lucide-users"
        :title="loadError ? 'Couldn\'t load the team' : 'Team not found'"
        :description="loadError || 'The team you\'re looking for doesn\'t exist.'"
      />
    </div>

    <div v-else>
      <SharedPageHeader :title="team.name" :description="team.description">
        <template #actions>
          <UButton v-if="can('members.manage')" color="neutral" size="sm" icon="i-lucide-pencil" label="Edit" variant="outline" @click="showEdit = true" />
          <UButton v-if="can('members.manage')" color="error" size="sm" icon="i-lucide-trash-2" label="Delete" variant="ghost" @click="deleteError = ''; showDelete = true" />
        </template>
      </SharedPageHeader>

      <TeamsFormModal v-model:open="showEdit" :team="team" @saved="onSaved" />
      <SharedConfirmDialog
        v-model:open="showDelete"
        title="Delete this team?"
        :description="`${team.name} will be removed permanently. This can't be undone.`"
        confirm-label="Delete team"
        danger
        :loading="deleting"
        :error="deleteError"
        @confirm="confirmDelete"
      />
      <SharedConfirmDialog
        v-model:open="showRemove"
        title="Remove from team?"
        :description="`${memberToRemove?.user.name ?? 'This person'} will no longer be a member of ${team.name}.`"
        confirm-label="Remove"
        danger
        :loading="memberBusy"
        :error="memberError"
        @confirm="confirmRemove"
      />

      <!-- Tabs -->
      <div class="mb-6 flex gap-1 overflow-x-auto border-b border-neutral-200 dark:border-neutral-300">
        <button
          v-for="tab in tabs"
          :key="tab"
          :class="[
            'shrink-0 whitespace-nowrap border-b-2 px-3 py-2 text-[13px] font-medium capitalize transition-colors',
            activeTab === tab
              ? 'border-primary-500 text-primary-600 dark:border-primary-400 dark:text-primary-400'
              : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-600'
          ]"
          @click="activeTab = tab"
        >
          {{ tab }}
          <span v-if="tab === 'members'" class="ml-1 text-[11px] text-neutral-400">({{ team.members.length }})</span>
          <span v-if="tab === 'projects'" class="ml-1 text-[11px] text-neutral-400">({{ teamProjects.length }})</span>
          <span v-if="tab === 'incidents'" class="ml-1 text-[11px] text-neutral-400">({{ teamIncidentTotal }})</span>
        </button>
      </div>

      <!-- Members tab -->
      <div v-if="activeTab === 'members'">
      <div v-if="can('members.manage')" class="mb-4">
        <UButton v-if="!showAddMember" color="primary" size="sm" icon="i-lucide-user-plus" label="Add member" @click="openAddMember" />
        <div v-else class="flex flex-col gap-2 rounded-lg border border-neutral-200 bg-white p-3 sm:flex-row sm:items-center dark:border-neutral-300 dark:bg-neutral-100">
          <select
            v-model="addUserId"
            aria-label="Person to add"
            class="h-9 w-full rounded-md border border-neutral-200 bg-transparent px-3 text-[13px] text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 sm:flex-1 dark:border-neutral-300 dark:text-neutral-800"
          >
            <option value="">{{ availableUsers.length ? 'Choose a person' : 'Everyone is already on this team' }}</option>
            <option v-for="user in availableUsers" :key="user.id" :value="user.id">{{ user.name }} ({{ user.email }})</option>
          </select>
          <div class="flex gap-2">
            <UButton color="primary" size="sm" label="Add" :loading="memberBusy" :disabled="!addUserId" @click="addMember" />
            <UButton color="neutral" variant="ghost" size="sm" label="Cancel" :disabled="memberBusy" @click="showAddMember = false" />
          </div>
        </div>
        <p v-if="memberError && !showRemove" class="mt-2 text-[12px] text-danger-500">{{ memberError }}</p>
      </div>

      <div class="rounded-lg border border-neutral-200 bg-white dark:border-neutral-300 dark:bg-neutral-100">
        <div v-if="team.members.length === 0" class="p-8 text-center text-[13px] text-neutral-400">
          This team has no members yet
        </div>
        <div class="divide-y divide-neutral-200 dark:divide-neutral-300">
          <div
            v-for="member in team.members"
            :key="member.id"
            class="flex items-center justify-between gap-3 px-4 py-3"
          >
            <div class="flex min-w-0 items-center gap-3">
              <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-[11px] font-semibold text-neutral-600 dark:bg-neutral-300 dark:text-neutral-500">
                {{ member.user.name.split(' ').map(n => n[0]).join('') }}
              </div>
              <div class="min-w-0">
                <p class="truncate text-[13px] font-medium text-neutral-900 dark:text-neutral-800">{{ member.user.name }}</p>
                <p class="truncate text-[12px] text-neutral-500">{{ member.user.email }}</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span
                :class="[
                  'shrink-0 whitespace-nowrap rounded-md px-2 py-0.5 text-[11px] font-medium',
                  member.role === 'lead'
                    ? 'bg-primary-50 text-primary-600 dark:bg-primary-50 dark:text-primary-400'
                    : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-200 dark:text-neutral-500'
                ]"
              >
                {{ member.role === 'lead' ? 'Team Lead' : 'Member' }}
              </span>
              <UDropdownMenu v-if="can('members.manage')" :items="memberMenu(member)" :content="{ align: 'end' }">
                <button
                  class="rounded-md p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 disabled:opacity-50 dark:hover:bg-neutral-200"
                  :aria-label="`Actions for ${member.user.name}`"
                  :disabled="memberBusy"
                >
                  <UIcon name="i-lucide-more-horizontal" class="h-4 w-4" />
                </button>
              </UDropdownMenu>
            </div>
          </div>
        </div>
      </div>
      </div>

      <!-- Projects tab -->
      <div v-if="activeTab === 'projects'" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <NuxtLink
          v-for="proj in teamProjects"
          :key="proj.id"
          :to="`/projects/${proj.id}`"
          class="rounded-lg border border-neutral-200 bg-white p-4 transition-colors hover:border-neutral-300 dark:border-neutral-300 dark:bg-neutral-100 dark:hover:border-neutral-400"
        >
          <h3 class="text-[14px] font-semibold text-neutral-900 dark:text-neutral-800">{{ proj.name }}</h3>
          <p class="mt-1 text-[12px] text-neutral-500">{{ proj.description }}</p>
          <div class="mt-3 flex items-center gap-3 text-[12px] text-neutral-500">
            <span>{{ proj.serviceCount }} services</span>
            <span>{{ proj.activeIncidentCount }} active incidents</span>
          </div>
        </NuxtLink>
      </div>

      <!-- Incidents tab -->
      <div v-if="activeTab === 'incidents'" class="rounded-lg border border-neutral-200 bg-white dark:border-neutral-300 dark:bg-neutral-100">
        <div v-if="teamIncidents.length === 0" class="p-8 text-center text-[13px] text-neutral-400">
          No incidents for this team
        </div>
        <div v-else class="divide-y divide-neutral-200 dark:divide-neutral-300">
          <IncidentsIncidentRow v-for="inc in teamIncidents" :key="inc.id" :incident="inc" show-time />
        </div>
      </div>

      <!-- Activity tab -->
      <div v-if="activeTab === 'activity'" class="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-300 dark:bg-neutral-100">
        <p class="text-[13px] text-neutral-500">Team activity feed coming soon.</p>
      </div>
    </div>
  </div>
</template>
