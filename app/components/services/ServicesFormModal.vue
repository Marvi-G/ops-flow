<script setup lang="ts">
import { projectRepository, serviceRepository } from '~/services/repository'
import { ApiError, fieldErrors } from '~/services/api'
import type { Project, Service, ServiceStatus } from '~/types'

const props = defineProps<{
  /** The service being edited. Leave out to create a new one. */
  service?: Service | null
}>()

const emit = defineEmits<{ saved: [service: Service] }>()

const open = defineModel<boolean>('open', { default: false })

const isEdit = computed(() => !!props.service)

const form = reactive({
  name: '',
  description: '',
  projectId: '',
  status: 'operational' as ServiceStatus
})

const projects = ref<Project[]>([])
const errors = ref<Record<string, string>>({})
const submitting = ref(false)
const submitError = ref('')

const statusOptions: { label: string, value: ServiceStatus }[] = [
  { label: 'Operational', value: 'operational' },
  { label: 'Degraded', value: 'degraded' },
  { label: 'Partial outage', value: 'partial_outage' },
  { label: 'Major outage', value: 'major_outage' },
  { label: 'Unknown', value: 'unknown' }
]

// Every time the dialog opens it starts from the service (or empty), never from a half-typed leftover
watch(open, async (isOpen) => {
  if (!isOpen) return
  form.name = props.service?.name ?? ''
  form.description = props.service?.description ?? ''
  form.projectId = props.service?.projectId ?? ''
  form.status = props.service?.status ?? 'operational'
  errors.value = {}
  submitError.value = ''

  if (!projects.value.length) {
    try {
      projects.value = await projectRepository.list()
    } catch {
      // The project is optional, so the form still works without the list
    }
  }
})

// An error goes away as soon as its field is edited
for (const field of ['name', 'description', 'projectId'] as const) {
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
    const saved = props.service
      ? await serviceRepository.update(props.service.id, {
        name: form.name.trim(),
        description,
        status: form.status,
        projectId: form.projectId || null
      })
      : await serviceRepository.create({
        name: form.name.trim(),
        description: description || undefined,
        status: form.status,
        projectId: form.projectId || undefined
      })

    open.value = false
    emit('saved', saved)
  } catch (err) {
    const fields = fieldErrors(err)
    if (err instanceof ApiError && err.code === 'DUPLICATE_NAME') fields.name = err.message
    errors.value = fields
    submitError.value = err instanceof Error ? err.message : 'Failed to save the service'
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
    :title="isEdit ? 'Edit service' : 'Add service'"
    :description="isEdit ? 'Change the details of this service' : 'Add a service to monitor'"
    :dismissible="!submitting"
    :ui="{ content: 'rounded-xl' }"
  >
    <!-- The default slot is the modal's trigger; the body goes in #content -->
    <template #content>
      <form class="p-6" @submit.prevent="submit">
        <h3 class="mb-4 text-[14px] font-semibold text-neutral-900 dark:text-neutral-800">
          {{ isEdit ? 'Edit service' : 'Add service' }}
        </h3>

        <p v-if="submitError && !Object.keys(errors).length" class="mb-4 rounded-md bg-danger-50 p-3 text-[13px] text-danger-500 dark:bg-danger-50/20">
          {{ submitError }}
        </p>

        <div class="space-y-4">
          <div>
            <label for="service-name" class="mb-1.5 block text-[13px] font-medium text-neutral-700 dark:text-neutral-600">
              Name <span class="text-danger-500">*</span>
            </label>
            <input
              id="service-name"
              v-model="form.name"
              type="text"
              maxlength="100"
              placeholder="e.g. Checkout API"
              :class="[inputClass('name'), 'h-9']"
            >
            <p v-if="errors.name" class="mt-1 text-[12px] text-danger-500">{{ errors.name }}</p>
          </div>

          <div>
            <label for="service-description" class="mb-1.5 block text-[13px] font-medium text-neutral-700 dark:text-neutral-600">Description</label>
            <textarea
              id="service-description"
              v-model="form.description"
              rows="3"
              maxlength="500"
              placeholder="What does this service do?"
              :class="[inputClass('description'), 'py-2']"
            />
            <p v-if="errors.description" class="mt-1 text-[12px] text-danger-500">{{ errors.description }}</p>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <label for="service-project" class="mb-1.5 block text-[13px] font-medium text-neutral-700 dark:text-neutral-600">Project</label>
              <select id="service-project" v-model="form.projectId" :class="[inputClass('projectId'), 'h-9']">
                <option value="">No project</option>
                <option v-for="project in projects" :key="project.id" :value="project.id">{{ project.name }}</option>
              </select>
              <p v-if="errors.projectId" class="mt-1 text-[12px] text-danger-500">{{ errors.projectId }}</p>
            </div>

            <div>
              <label for="service-status" class="mb-1.5 block text-[13px] font-medium text-neutral-700 dark:text-neutral-600">Status</label>
              <select id="service-status" v-model="form.status" :class="[inputClass('status'), 'h-9']">
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
            :label="isEdit ? 'Save changes' : 'Add service'"
            :loading="submitting"
          />
        </div>
      </form>
    </template>
  </UModal>
</template>
