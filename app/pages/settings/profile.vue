<script setup lang="ts">
import { userRepository } from '~/services/repository'
import { fieldErrors } from '~/services/api'
import { useSessionStore } from '~/stores/session'

definePageMeta({ layout: 'default' })

const session = useSessionStore()

// --- Name ---
const name = ref(session.user.name)
const nameErrors = ref<Record<string, string>>({})
const nameError = ref('')
const nameSaving = ref(false)
const nameSaved = ref(false)

const nameChanged = computed(() => name.value.trim() !== session.user.name)

watch(name, () => {
  nameSaved.value = false
  nameErrors.value = {}
  nameError.value = ''
})

async function saveName() {
  if (nameSaving.value) return

  const value = name.value.trim()
  if (!value) {
    nameErrors.value = { name: 'Name is required' }
    return
  }

  nameSaving.value = true
  nameError.value = ''
  nameSaved.value = false

  try {
    const updated = await userRepository.updateName(value)
    session.setUserName(updated.name)
    name.value = updated.name
    nameSaved.value = true
  } catch (err) {
    nameErrors.value = fieldErrors(err)
    nameError.value = err instanceof Error ? err.message : 'Failed to save your name'
  } finally {
    nameSaving.value = false
  }
}

// --- Password ---
const password = reactive({ current: '', next: '', confirm: '' })
const passwordErrors = ref<Record<string, string>>({})
const passwordError = ref('')
const passwordSaving = ref(false)
const passwordSaved = ref(false)

for (const field of ['current', 'next', 'confirm'] as const) {
  watch(() => password[field], () => {
    passwordSaved.value = false
    passwordError.value = ''
    if (Object.keys(passwordErrors.value).length) passwordErrors.value = {}
  })
}

async function savePassword() {
  if (passwordSaving.value) return

  const found: Record<string, string> = {}
  if (!password.current) found.current = 'Enter your current password'
  if (password.next.length < 8) found.next = 'Use at least 8 characters'
  else if (password.next.length > 72) found.next = 'Use at most 72 characters'
  else if (password.next === password.current) found.next = 'Choose a password that is different from the current one'
  if (password.confirm !== password.next) found.confirm = 'The two passwords do not match'
  if (Object.keys(found).length) {
    passwordErrors.value = found
    return
  }

  passwordSaving.value = true
  passwordError.value = ''
  passwordSaved.value = false

  try {
    await userRepository.changePassword(password.current, password.next)
    password.current = ''
    password.next = ''
    password.confirm = ''
    // The watchers above clear the flags when the fields are emptied, so set it afterwards
    await nextTick()
    passwordSaved.value = true
  } catch (err) {
    // The API names its fields currentPassword / newPassword
    const fields = fieldErrors(err)
    passwordErrors.value = {
      ...(fields.currentPassword ? { current: fields.currentPassword } : {}),
      ...(fields.newPassword ? { next: fields.newPassword } : {})
    }
    passwordError.value = err instanceof Error ? err.message : 'Failed to change the password'
  } finally {
    passwordSaving.value = false
  }
}

const inputClass = (error?: string) => [
  'h-9 w-full rounded-md border bg-transparent px-3 text-[13px] text-neutral-900 focus:outline-none focus:ring-1 disabled:cursor-not-allowed disabled:opacity-60 dark:text-neutral-800',
  error
    ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500'
    : 'border-neutral-200 focus:border-primary-500 focus:ring-primary-500 dark:border-neutral-300'
]
</script>

<template>
  <SettingsLayout>
    <div class="max-w-xl space-y-6">
      <!-- Account -->
      <form class="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-300 dark:bg-neutral-100" @submit.prevent="saveName">
        <h2 class="mb-4 text-[14px] font-semibold text-neutral-900 dark:text-neutral-800">Your profile</h2>

        <p v-if="nameError && !Object.keys(nameErrors).length" class="mb-4 rounded-md bg-danger-50 p-3 text-[13px] text-danger-500 dark:bg-danger-50/20">
          {{ nameError }}
        </p>

        <div class="space-y-4">
          <div>
            <label for="profile-name" class="mb-1.5 block text-[13px] font-medium text-neutral-700 dark:text-neutral-600">Name</label>
            <input id="profile-name" v-model="name" type="text" maxlength="100" autocomplete="name" :class="inputClass(nameErrors.name)">
            <p v-if="nameErrors.name" class="mt-1 text-[12px] text-danger-500">{{ nameErrors.name }}</p>
          </div>
          <div>
            <label for="profile-email" class="mb-1.5 block text-[13px] font-medium text-neutral-700 dark:text-neutral-600">Email</label>
            <input id="profile-email" :value="session.user.email" type="email" disabled :class="inputClass()">
          </div>
          <div>
            <label class="mb-1.5 block text-[13px] font-medium text-neutral-700 dark:text-neutral-600">Role in {{ session.organization.name }}</label>
            <p class="text-[13px] capitalize text-neutral-700 dark:text-neutral-600">{{ session.user.role }}</p>
          </div>
        </div>

        <div class="mt-6 flex items-center justify-end gap-3">
          <span v-if="nameSaved" class="flex items-center gap-1 text-[12px] text-success-500">
            <UIcon name="i-lucide-check" class="h-3.5 w-3.5" />
            Saved
          </span>
          <UButton type="submit" color="primary" size="sm" label="Save changes" :loading="nameSaving" :disabled="!nameChanged" />
        </div>
      </form>

      <!-- Password -->
      <form class="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-300 dark:bg-neutral-100" @submit.prevent="savePassword">
        <h2 class="mb-1 text-[14px] font-semibold text-neutral-900 dark:text-neutral-800">Change password</h2>
        <p class="mb-4 text-[12px] text-neutral-500">You stay signed in here. Any other device or browser is signed out.</p>

        <p v-if="passwordError && !Object.keys(passwordErrors).length" class="mb-4 rounded-md bg-danger-50 p-3 text-[13px] text-danger-500 dark:bg-danger-50/20">
          {{ passwordError }}
        </p>

        <div class="space-y-4">
          <div>
            <label for="current-password" class="mb-1.5 block text-[13px] font-medium text-neutral-700 dark:text-neutral-600">Current password</label>
            <input id="current-password" v-model="password.current" type="password" autocomplete="current-password" :class="inputClass(passwordErrors.current)">
            <p v-if="passwordErrors.current" class="mt-1 text-[12px] text-danger-500">{{ passwordErrors.current }}</p>
          </div>
          <div>
            <label for="new-password" class="mb-1.5 block text-[13px] font-medium text-neutral-700 dark:text-neutral-600">New password</label>
            <input id="new-password" v-model="password.next" type="password" autocomplete="new-password" :class="inputClass(passwordErrors.next)">
            <p v-if="passwordErrors.next" class="mt-1 text-[12px] text-danger-500">{{ passwordErrors.next }}</p>
            <p v-else class="mt-1 text-[12px] text-neutral-400">At least 8 characters</p>
          </div>
          <div>
            <label for="confirm-password" class="mb-1.5 block text-[13px] font-medium text-neutral-700 dark:text-neutral-600">Confirm new password</label>
            <input id="confirm-password" v-model="password.confirm" type="password" autocomplete="new-password" :class="inputClass(passwordErrors.confirm)">
            <p v-if="passwordErrors.confirm" class="mt-1 text-[12px] text-danger-500">{{ passwordErrors.confirm }}</p>
          </div>
        </div>

        <div class="mt-6 flex items-center justify-end gap-3">
          <span v-if="passwordSaved" class="flex items-center gap-1 text-[12px] text-success-500">
            <UIcon name="i-lucide-check" class="h-3.5 w-3.5" />
            Password changed
          </span>
          <UButton
            type="submit"
            color="primary"
            size="sm"
            label="Change password"
            :loading="passwordSaving"
            :disabled="!password.current || !password.next || !password.confirm"
          />
        </div>
      </form>
    </div>
  </SettingsLayout>
</template>
