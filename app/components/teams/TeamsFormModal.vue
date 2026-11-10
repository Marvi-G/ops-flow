<script setup lang="ts">
import { teamRepository } from '~/services/repository'
import { ApiError, fieldErrors } from '~/services/api'
import type { Team } from '~/types'

const props = defineProps<{
  /** The team being edited. Leave out to create a new one. */
  team?: Team | null
}>()

const emit = defineEmits<{ saved: [team: Team] }>()

const open = defineModel<boolean>('open', { default: false })

const isEdit = computed(() => !!props.team)

const form = reactive({
  name: '',
  description: '',
  onCallStatus: 'inactive' as Team['onCallStatus']
})

const errors = ref<Record<string, string>>({})
const submitting = ref(false)
const submitError = ref('')

// Every time the dialog opens it starts from the team (or empty), never from a half-typed leftover
watch(open, (isOpen) => {
  if (!isOpen) return
  form.name = props.team?.name ?? ''
  form.description = props.team?.description ?? ''
  form.onCallStatus = props.team?.onCallStatus ?? 'inactive'
  errors.value = {}
  submitError.value = ''
})

// An error goes away as soon as its field is edited
for (const field of ['name', 'description'] as const) {
  watch(() => form[field], () => {
    if (errors.value[field]) {
      const { [field]: _cleared, ...rest } = errors.value
      errors.value = rest
    }
  })
}

async function submit() {
  if (submitting.value) return

  if (!form.name.trim()) {
    errors.value = { name: 'Name is required' }
    return
  }

  submitting.value = true
  submitError.value = ''

  try {
    const description = form.description.trim()
    const saved = props.team
      ? await teamRepository.update(props.team.id, {
        name: form.name.trim(),
        description,
        onCallStatus: form.onCallStatus
      })
      : await teamRepository.create({
        name: form.name.trim(),
        description: description || undefined
      })

    open.value = false
    emit('saved', saved)
  } catch (err) {
    const fields = fieldErrors(err)
    if (err instanceof ApiError && err.code === 'DUPLICATE_NAME') fields.name = err.message
    errors.value = fields
    submitError.value = err instanceof Error ? err.message : 'Failed to save the team'
  } finally {
    submitting.value = false
  }
}

const inputClass = (field: string) => [
  'w-full rounded-md border bg-transparent px-3 text-[13px] text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-1 dark:text-neutral-800',
  errors.value[field]
    ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500'
    : 'border-neutral-200 focus:border-primary-500 focus:ring-primary-500 dark:border-neutral-300'
]
</script>

<template>
  <UModal
    v-model:open="open"
    :title="isEdit ? 'Edit team' : 'Create team'"
    :description="isEdit ? 'Change the details of this team' : 'Group people who work on incidents together'"
    :dismissible="!submitting"
    :ui="{ content: 'rounded-xl' }"
  >
    <!-- The default slot is the modal's trigger; the body goes in #content -->
    <template #content>
      <form class="p-6" @submit.prevent="submit">
        <h3 class="mb-4 text-[14px] font-semibold text-neutral-900 dark:text-neutral-800">
          {{ isEdit ? 'Edit team' : 'Create team' }}
        </h3>

        <p v-if="submitError && !Object.keys(errors).length" class="mb-4 rounded-md bg-danger-50 p-3 text-[13px] text-danger-500 dark:bg-danger-50/20">
          {{ submitError }}
        </p>

        <div class="space-y-4">
          <div>
            <label for="team-name" class="mb-1.5 block text-[13px] font-medium text-neutral-700 dark:text-neutral-600">
              Name <span class="text-danger-500">*</span>
            </label>
            <input
              id="team-name"
              v-model="form.name"
              type="text"
              maxlength="100"
              placeholder="e.g. Platform Engineering"
              :class="[inputClass('name'), 'h-9']"
            >
            <p v-if="errors.name" class="mt-1 text-[12px] text-danger-500">{{ errors.name }}</p>
          </div>

          <div>
            <label for="team-description" class="mb-1.5 block text-[13px] font-medium text-neutral-700 dark:text-neutral-600">Description</label>
            <textarea
              id="team-description"
              v-model="form.description"
              rows="3"
              maxlength="500"
              placeholder="What does this team look after?"
              :class="[inputClass('description'), 'py-2']"
            />
            <p v-if="errors.description" class="mt-1 text-[12px] text-danger-500">{{ errors.description }}</p>
          </div>

          <div v-if="isEdit">
            <label for="team-on-call" class="mb-1.5 block text-[13px] font-medium text-neutral-700 dark:text-neutral-600">On-call status</label>
            <select id="team-on-call" v-model="form.onCallStatus" :class="[inputClass('onCallStatus'), 'h-9']">
              <option value="active">On call</option>
              <option value="inactive">Off call</option>
            </select>
          </div>
        </div>

        <div class="mt-6 flex justify-end gap-2">
          <button
            type="button"
            class="rounded-md border border-neutral-200 px-3 py-1.5 text-[13px] font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-300 dark:text-neutral-600 dark:hover:bg-neutral-200"
            :disabled="submitting"
            @click="open = false"
          >
            Cancel
          </button>
          <UButton
            type="submit"
            color="primary"
            size="sm"
            :label="isEdit ? 'Save changes' : 'Create team'"
            :loading="submitting"
          />
        </div>
      </form>
    </template>
  </UModal>
</template>
