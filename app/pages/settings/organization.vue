<script setup lang="ts">
import { organizationRepository } from '~/services/repository'
import { ApiError, fieldErrors } from '~/services/api'
import { useSessionStore } from '~/stores/session'

definePageMeta({ layout: 'default' })

const sessionStore = useSessionStore()
const { can } = usePermissions()
const canEdit = computed(() => can('settings.manage'))

const form = reactive({
  name: sessionStore.organization.name,
  slug: sessionStore.organization.slug
})

const errors = ref<Record<string, string>>({})
const saving = ref(false)
const saveError = ref('')
const saved = ref(false)

const dirty = computed(() =>
  form.name.trim() !== sessionStore.organization.name || form.slug.trim() !== sessionStore.organization.slug
)

// An error (or the "Saved" note) goes away as soon as the fields are edited
for (const field of ['name', 'slug'] as const) {
  watch(() => form[field], () => {
    saved.value = false
    if (errors.value[field]) {
      const { [field]: _cleared, ...rest } = errors.value
      errors.value = rest
    }
  })
}

async function save() {
  if (saving.value || !canEdit.value) return

  const name = form.name.trim()
  const slug = form.slug.trim()
  const found: Record<string, string> = {}
  if (!name) found.name = 'Name is required'
  if (!slug) found.slug = 'Slug is required'
  if (Object.keys(found).length) {
    errors.value = found
    return
  }

  saving.value = true
  saveError.value = ''
  saved.value = false

  try {
    const updated = await organizationRepository.update({ name, slug })
    sessionStore.setOrganization(updated)
    form.name = updated.name
    form.slug = updated.slug
    saved.value = true
  } catch (err) {
    const fields = fieldErrors(err)
    if (err instanceof ApiError && err.code === 'DUPLICATE_SLUG') fields.slug = err.message
    errors.value = fields
    saveError.value = err instanceof Error ? err.message : 'Failed to save the organization'
  } finally {
    saving.value = false
  }
}

const inputClass = (field: string) => [
  'h-9 w-full rounded-md border bg-transparent px-3 text-[13px] text-neutral-900 focus:outline-none focus:ring-1 disabled:cursor-not-allowed disabled:opacity-60 dark:text-neutral-800',
  errors.value[field]
    ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500'
    : 'border-neutral-200 focus:border-primary-500 focus:ring-primary-500 dark:border-neutral-300'
]
</script>

<template>
  <SettingsLayout>
    <div class="max-w-xl">
      <form class="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-300 dark:bg-neutral-100" @submit.prevent="save">
        <h2 class="mb-4 text-[14px] font-semibold text-neutral-900 dark:text-neutral-800">Organization details</h2>

        <p v-if="!canEdit" class="mb-4 rounded-md bg-warning-50 p-3 text-[13px] text-warning-500 dark:bg-warning-50/20">
          Only admins and owners can change these settings.
        </p>
        <p v-if="saveError && !Object.keys(errors).length" class="mb-4 rounded-md bg-danger-50 p-3 text-[13px] text-danger-500 dark:bg-danger-50/20">
          {{ saveError }}
        </p>

        <div class="space-y-4">
          <div>
            <label for="org-name" class="mb-1.5 block text-[13px] font-medium text-neutral-700 dark:text-neutral-600">Organization name</label>
            <input
              id="org-name"
              v-model="form.name"
              type="text"
              maxlength="100"
              :disabled="!canEdit"
              :class="inputClass('name')"
            >
            <p v-if="errors.name" class="mt-1 text-[12px] text-danger-500">{{ errors.name }}</p>
          </div>
          <div>
            <label for="org-slug" class="mb-1.5 block text-[13px] font-medium text-neutral-700 dark:text-neutral-600">Slug</label>
            <input
              id="org-slug"
              v-model="form.slug"
              type="text"
              maxlength="50"
              :disabled="!canEdit"
              :class="inputClass('slug')"
            >
            <p v-if="errors.slug" class="mt-1 text-[12px] text-danger-500">{{ errors.slug }}</p>
            <p v-else class="mt-1 text-[12px] text-neutral-400">Lowercase letters, numbers and hyphens, e.g. northstar-labs</p>
          </div>
          <div>
            <label class="mb-1.5 block text-[13px] font-medium text-neutral-700 dark:text-neutral-600">Plan</label>
            <p class="text-[13px] capitalize text-neutral-700 dark:text-neutral-600">{{ sessionStore.organization.plan }}</p>
          </div>
        </div>

        <div v-if="canEdit" class="mt-6 flex items-center justify-end gap-3">
          <span v-if="saved" class="flex items-center gap-1 text-[12px] text-success-500">
            <UIcon name="i-lucide-check" class="h-3.5 w-3.5" />
            Saved
          </span>
          <UButton type="submit" color="primary" size="sm" label="Save changes" :loading="saving" :disabled="!dirty" />
        </div>
      </form>
    </div>
  </SettingsLayout>
</template>
