<script setup lang="ts">
import { userRepository } from '~/services/repository'
import { useSessionStore } from '~/stores/session'
import { assignableRoles, canManageMember } from '~/utils/permissions'
import type { User } from '~/types'

definePageMeta({ layout: 'default' })

const session = useSessionStore()

const users = ref<User[]>([])
const loading = ref(true)
const loadError = ref('')
const actionError = ref('')
const busyId = ref('')

const toRemove = ref<User | null>(null)
const showRemove = ref(false)
const removing = ref(false)
const removeError = ref('')

const roleOptions = computed(() => assignableRoles(session.user.role))

async function load() {
  try {
    users.value = await userRepository.list()
  } catch (err) {
    loadError.value = err instanceof Error ? err.message : 'Failed to load members'
  } finally {
    loading.value = false
  }
}

onMounted(load)

function manageable(user: User): boolean {
  return canManageMember(session.user, user)
}

async function changeRole(user: User, event: Event) {
  const select = event.target as HTMLSelectElement
  const role = select.value as User['role']
  if (role === user.role || busyId.value) return

  busyId.value = user.id
  actionError.value = ''
  try {
    const updated = await userRepository.setRole(user.id, role)
    users.value = users.value.map(u => u.id === user.id ? { ...u, role: updated.role } : u)
  } catch (err) {
    // Put the dropdown back to what the server still has
    select.value = user.role
    actionError.value = err instanceof Error ? err.message : 'Failed to change the role'
  } finally {
    busyId.value = ''
  }
}

function askRemove(user: User) {
  toRemove.value = user
  removeError.value = ''
  showRemove.value = true
}

async function confirmRemove() {
  const user = toRemove.value
  if (!user || removing.value) return

  removing.value = true
  removeError.value = ''
  try {
    await userRepository.remove(user.id)
    users.value = users.value.filter(u => u.id !== user.id)
    session.setOrganization({ ...session.organization, memberCount: users.value.length })
    showRemove.value = false
  } catch (err) {
    removeError.value = err instanceof Error ? err.message : 'Failed to remove the member'
  } finally {
    removing.value = false
  }
}

const roleBadge = (role: User['role']) =>
  role === 'owner' ? 'bg-primary-50 text-primary-600 dark:bg-primary-50 dark:text-primary-400'
    : role === 'admin' ? 'bg-info-50 text-info-500 dark:bg-info-50/20 dark:text-info-700'
      : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-200 dark:text-neutral-500'
</script>

<template>
  <SettingsLayout>
    <div>
      <div class="mb-4 flex items-center justify-between">
        <p class="text-[13px] text-neutral-500">{{ loading ? 'Loading members...' : `${users.length} members` }}</p>
      </div>

      <p v-if="actionError" class="mb-4 rounded-md bg-danger-50 p-3 text-[13px] text-danger-500 dark:bg-danger-50/20">
        {{ actionError }}
      </p>

      <div v-if="loading">
        <SharedLoadingSkeleton :rows="4" :columns="3" />
      </div>

      <div v-else-if="loadError" class="rounded-md bg-danger-50 p-3 text-[13px] text-danger-500 dark:bg-danger-50/20">
        {{ loadError }}
      </div>

      <div v-else class="rounded-lg border border-neutral-200 bg-white dark:border-neutral-300 dark:bg-neutral-100">
        <div class="divide-y divide-neutral-200 dark:divide-neutral-300">
          <div
            v-for="user in users"
            :key="user.id"
            class="flex items-center justify-between gap-3 px-4 py-3"
          >
            <div class="flex min-w-0 items-center gap-3">
              <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-200 text-[11px] font-semibold text-neutral-600 dark:bg-neutral-300 dark:text-neutral-500">
                {{ user.name.split(' ').map(n => n[0]).join('') }}
              </div>
              <div class="min-w-0">
                <p class="truncate text-[13px] font-medium text-neutral-900 dark:text-neutral-800">
                  {{ user.name }}
                  <span v-if="user.id === session.user.id" class="ml-1 text-[11px] font-normal text-neutral-400">(you)</span>
                </p>
                <p class="truncate text-[12px] text-neutral-500">{{ user.email }}</p>
              </div>
            </div>

            <div class="flex shrink-0 items-center gap-2">
              <select
                v-if="manageable(user)"
                :value="user.role"
                :disabled="busyId === user.id"
                :aria-label="`Role of ${user.name}`"
                class="h-8 rounded-md border border-neutral-200 bg-white px-2 text-[12px] font-medium capitalize text-neutral-700 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-50 dark:border-neutral-300 dark:bg-neutral-100 dark:text-neutral-600"
                @change="changeRole(user, $event)"
              >
                <option v-for="role in roleOptions" :key="role" :value="role">{{ role }}</option>
              </select>
              <span
                v-else
                :class="['rounded-md px-2 py-0.5 text-[11px] font-medium capitalize', roleBadge(user.role)]"
              >
                {{ user.role }}
              </span>

              <button
                v-if="manageable(user)"
                class="rounded-md p-1.5 text-neutral-400 hover:bg-danger-50 hover:text-danger-500 disabled:opacity-50 dark:hover:bg-danger-50/20"
                :aria-label="`Remove ${user.name}`"
                :disabled="busyId === user.id"
                @click="askRemove(user)"
              >
                <UIcon name="i-lucide-user-minus" class="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <SharedConfirmDialog
        v-model:open="showRemove"
        title="Remove this member?"
        :description="`${toRemove?.name ?? 'This person'} will lose access to ${session.organization.name}, leave all its teams, and be unassigned from their incidents. Incidents they created stay.`"
        confirm-label="Remove member"
        danger
        :loading="removing"
        :error="removeError"
        @confirm="confirmRemove"
      />
    </div>
  </SettingsLayout>
</template>
