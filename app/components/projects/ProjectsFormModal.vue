<script setup lang="ts">
import { projectRepository, teamRepository } from '~/services/repository'
import { ApiError, fieldErrors } from '~/services/api'
import type { Project, Team } from '~/types'

const props = defineProps<{
  /** The project being edited. Leave out to create a new one. */
  project?: Project | null
}>()

const emit = defineEmits<{ saved: [project: Project] }>()

const open = defineModel<boolean>('open', { default: false })

const isEdit = computed(() => !!props.project)

const form = reactive({
  name: '',
  description: '',
  teamId: '',
  status: 'active' as Project['status']
})

const teams = ref<Team[]>([])
const errors = ref<Record<string, string>>({})
const submitting = ref(false)
const submitError = ref('')

const statusOptions: { label: string, value: Project['status'] }[] = [
  { label: 'Active', value: 'active' },
  { label: 'Maintenance', value: 'maintenance' },
  { label: 'Archived', value: 'archived' }
]

// Every time the dialog opens it starts from the project (or empty), never from a half-typed leftover
watch(open, async (isOpen) => {
  if (!isOpen) return
  form.name = props.project?.name ?? ''
  form.description = props.project?.description ?? ''
  form.teamId = props.project?.teamId ?? ''
  form.status = props.project?.status ?? 'active'
  errors.value = {}
  submitError.value = ''

  if (!teams.value.length) {
    try {
      teams.value = await teamRepository.list()
    } catch {
      // The team is optional, so the form still works without the list
    }
  }
})

// An error goes away as soon as its field is edited
for (const field of ['name', 'description', 'teamId'] as const) {
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
    const saved = props.project
      ? await projectRepository.update(props.project.id, {
        name: form.name.trim(),
        description,
        status: form.status,
        teamId: form.teamId || null
      })
      : await projectRepository.create({
        name: form.name.trim(),
        description: description || undefined,
        teamId: form.teamId || undefined
      })

    open.value = false
    emit('saved', saved)
  } catch (err) {
    const fields = fieldErrors(err)
    if (err instanceof ApiError && err.code === 'DUPLICATE_NAME') fields.name = err.message
    errors.value = fields
    submitError.value = err instanceof Error ? err.message : 'Failed to save the project'
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
    :title="isEdit ? 'Edit project' : 'New project'"
    :description="isEdit ? 'Change the details of this project' : 'Group related services under a project'"
    :dismissible="!submitting"
    :ui="{ content: 'rounded-xl' }"
  >
    <!-- The default slot is the modal's trigger; the body goes in #content -->
    <template #content>
      <form class="p-6" @submit.prevent="submit">
        <h3 class="mb-4 text-[14px] font-semibold text-neutral-900 dark:text-neutral-800">
          {{ isEdit ? 'Edit project' : 'New project' }}
        </h3>

        <p v-if="submitError && !Object.keys(errors).length" class="mb-4 rounded-md bg-danger-50 p-3 text-[13px] text-danger-500 dark:bg-danger-50/20">
          {{ submitError }}
        </p>

        <div class="space-y-4">
          <div>
            <label for="project-name" class="mb-1.5 block text-[13px] font-medium text-neutral-700 dark:text-neutral-600">
              Name <span class="text-danger-500">*</span>
            </label>
            <input
              id="project-name"
              v-model="form.name"
              type="text"
              maxlength="100"
              placeholder="e.g. Payments platform"
              :class="[inputClass('name'), 'h-9']"
            >
            <p v-if="errors.name" class="mt-1 text-[12px] text-danger-500">{{ errors.name }}</p>
          </div>

          <div>
            <label for="project-description" class="mb-1.5 block text-[13px] font-medium text-neutral-700 dark:text-neutral-600">Description</label>
            <textarea
              id="project-description"
              v-model="form.description"
              rows="3"
              maxlength="500"
              placeholder="What does this project cover?"
              :class="[inputClass('description'), 'py-2']"
            />
            <p v-if="errors.description" class="mt-1 text-[12px] text-danger-500">{{ errors.description }}</p>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label for="project-team" class="mb-1.5 block text-[13px] font-medium text-neutral-700 dark:text-neutral-600">Team</label>
              <select id="project-team" v-model="form.teamId" :class="[inputClass('teamId'), 'h-9']">
                <option value="">No team</option>
                <option v-for="team in teams" :key="team.id" :value="team.id">{{ team.name }}</option>
              </select>
              <p v-if="errors.teamId" class="mt-1 text-[12px] text-danger-500">{{ errors.teamId }}</p>
            </div>

            <div v-if="isEdit">
              <label for="project-status" class="mb-1.5 block text-[13px] font-medium text-neutral-700 dark:text-neutral-600">Status</label>
              <select id="project-status" v-model="form.status" :class="[inputClass('status'), 'h-9']">
                <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </select>
            </div>
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
            :label="isEdit ? 'Save changes' : 'Create project'"
            :loading="submitting"
          />
        </div>
      </form>
    </template>
  </UModal>
</template>
