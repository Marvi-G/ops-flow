<script setup lang="ts">
import { incidentRepository, projectRepository, serviceRepository, teamRepository, userRepository } from '~/services/repository'
import { fieldErrors } from '~/services/api'
import type { IncidentSeverity, Project, Service, Team, User } from '~/types'

definePageMeta({ layout: 'default' })

const router = useRouter()
const { can } = usePermissions()

// Options for the dropdowns
const teams = ref<Team[]>([])
const services = ref<Service[]>([])
const projects = ref<Project[]>([])
const users = ref<User[]>([])
const optionsError = ref('')

onMounted(async () => {
  // Each list loads on its own, so one failing (e.g. no permission to list members)
  // doesn't empty the others
  const results = await Promise.allSettled([
    teamRepository.list(),
    serviceRepository.list(),
    projectRepository.list(),
    userRepository.list()
  ])
  const [teamList, serviceList, projectList, userList] = results
  if (teamList.status === 'fulfilled') teams.value = teamList.value
  if (serviceList.status === 'fulfilled') services.value = serviceList.value
  if (projectList.status === 'fulfilled') projects.value = projectList.value
  if (userList.status === 'fulfilled') users.value = userList.value
  if (results.some(r => r.status === 'rejected')) {
    optionsError.value = 'Some options could not be loaded.'
  }
})

const form = reactive({
  title: '',
  description: '',
  severity: '' as IncidentSeverity | '',
  projectId: '',
  serviceId: '',
  teamId: '',
  assigneeId: ''
})

const errors = ref<Record<string, string>>({})
const submitting = ref(false)
const submitted = ref(false)
const submitError = ref('')
const dirty = ref(false)
const showUnsavedDialog = ref(false)

watch(form, () => { dirty.value = true }, { deep: true })

// An error goes away as soon as its field is edited, not only on the next submit
for (const field of ['title', 'description', 'severity', 'teamId'] as const) {
  watch(() => form[field], () => {
    if (errors.value[field]) {
      const { [field]: _cleared, ...rest } = errors.value
      errors.value = rest
    }
  })
}

// An incident belongs to a project through its services, so the project only narrows the list
const serviceOptions = computed(() =>
  form.projectId ? services.value.filter(s => s.projectId === form.projectId) : services.value
)

watch(() => form.projectId, () => {
  if (form.serviceId && !serviceOptions.value.some(s => s.id === form.serviceId)) form.serviceId = ''
})

// Unsaved changes warning
function onBeforeUnload(e: BeforeUnloadEvent) {
  if (dirty.value && !submitted.value) {
    e.preventDefault()
    e.returnValue = ''
  }
}

onMounted(() => {
  window.addEventListener('beforeunload', onBeforeUnload)
})

onUnmounted(() => {
  window.removeEventListener('beforeunload', onBeforeUnload)
})

// Intercept navigation
function handleCancel() {
  if (dirty.value) {
    showUnsavedDialog.value = true
  } else {
    router.push('/incidents')
  }
}

function confirmLeave() {
  dirty.value = false
  showUnsavedDialog.value = false
  router.push('/incidents')
}

function stayOnPage() {
  showUnsavedDialog.value = false
}

function validate(): boolean {
  const e: Record<string, string> = {}
  if (!form.title.trim()) e.title = 'Title is required'
  if (!form.description.trim()) e.description = 'Description is required'
  if (!form.severity) e.severity = 'Severity is required'
  if (!form.teamId) e.teamId = 'Team is required'
  errors.value = e
  return Object.keys(e).length === 0
}

async function handleSubmit() {
  if (submitting.value || !validate()) return
  submitting.value = true
  submitError.value = ''

  try {
    const incident = await incidentRepository.create({
      title: form.title.trim(),
      description: form.description.trim(),
      severity: form.severity as IncidentSeverity,
      teamId: form.teamId,
      assigneeId: form.assigneeId || undefined,
      serviceIds: form.serviceId ? [form.serviceId] : undefined
    })
    submitted.value = true
    dirty.value = false
    setTimeout(() => {
      router.push(`/incidents/${incident.id}`)
    }, 1000)
  } catch (err) {
    // Messages the API attached to specific fields show next to those fields
    const fields = fieldErrors(err)
    if (Object.keys(fields).length > 0) errors.value = fields
    submitError.value = err instanceof Error ? err.message : 'Failed to create incident. Please try again.'
  } finally {
    submitting.value = false
  }
}

const severityOptions: { label: string, value: IncidentSeverity }[] = [
  { label: 'Critical', value: 'critical' },
  { label: 'High', value: 'high' },
  { label: 'Medium', value: 'medium' },
  { label: 'Low', value: 'low' }
]
</script>

<template>
  <div class="mx-auto max-w-2xl">
    <SharedPageHeader title="Create Incident" description="Report a new operational incident" />

    <!-- Success state -->
    <div v-if="submitted" class="rounded-lg border border-success-500/20 bg-success-50 p-6 text-center dark:bg-success-50/10">
      <UIcon name="i-lucide-check-circle" class="mx-auto mb-3 h-8 w-8 text-success-500" />
      <h3 class="text-[14px] font-semibold text-neutral-900 dark:text-neutral-800">Incident created</h3>
      <p class="mt-1 text-[13px] text-neutral-500">Opening the incident...</p>
    </div>

    <!-- Form -->
    <form v-else class="space-y-5" @submit.prevent="handleSubmit">
      <p v-if="optionsError" class="text-[12px] text-warning-500">{{ optionsError }}</p>
      <p v-if="!can('incidents.create')" class="rounded-md bg-warning-50 p-3 text-[13px] text-warning-500 dark:bg-warning-50/20">
        Your role is read-only, so you can't create incidents.
      </p>

      <!-- Error state -->
      <div v-if="submitError" class="rounded-lg border border-danger-500/20 bg-danger-50 p-4 dark:bg-danger-50/10">
        <div class="flex items-start gap-3">
          <UIcon name="i-lucide-alert-circle" class="mt-0.5 h-5 w-5 shrink-0 text-danger-500" />
          <div>
            <h3 class="text-[13px] font-medium text-danger-500">Failed to create incident</h3>
            <p class="mt-0.5 text-[12px] text-danger-500/80">{{ submitError }}</p>
          </div>
          <button
            class="ml-auto text-danger-500 hover:text-danger-600"
            @click="submitError = ''"
          >
            <UIcon name="i-lucide-x" class="h-4 w-4" />
          </button>
        </div>
      </div>

      <div class="rounded-lg border border-neutral-200 bg-white p-6 dark:border-neutral-300 dark:bg-neutral-100">
        <div class="space-y-5">
          <!-- Title -->
          <div>
            <label for="title" class="mb-1.5 block text-[13px] font-medium text-neutral-700 dark:text-neutral-600">
              Title <span class="text-danger-500">*</span>
            </label>
            <input
              id="title"
              v-model="form.title"
              type="text"
              placeholder="Brief description of the incident"
              :class="[
                'h-9 w-full rounded-md border bg-transparent px-3 text-[13px] text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-1 dark:text-neutral-800',
                errors.title ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500' : 'border-neutral-200 focus:border-primary-500 focus:ring-primary-500 dark:border-neutral-300'
              ]"
            />
            <p v-if="errors.title" class="mt-1 text-[12px] text-danger-500">{{ errors.title }}</p>
          </div>

          <!-- Description -->
          <div>
            <label for="description" class="mb-1.5 block text-[13px] font-medium text-neutral-700 dark:text-neutral-600">
              Description <span class="text-danger-500">*</span>
            </label>
            <textarea
              id="description"
              v-model="form.description"
              rows="4"
              placeholder="Detailed description of the incident, impact, and any initial observations..."
              :class="[
                'w-full rounded-md border bg-transparent px-3 py-2 text-[13px] text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-1 dark:text-neutral-800',
                errors.description ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500' : 'border-neutral-200 focus:border-primary-500 focus:ring-primary-500 dark:border-neutral-300'
              ]"
            />
            <p v-if="errors.description" class="mt-1 text-[12px] text-danger-500">{{ errors.description }}</p>
          </div>

          <!-- Severity -->
          <div>
            <label class="mb-1.5 block text-[13px] font-medium text-neutral-700 dark:text-neutral-600">
              Severity <span class="text-danger-500">*</span>
            </label>
            <div class="flex gap-2">
              <button
                v-for="opt in severityOptions"
                :key="opt.value"
                type="button"
                :class="[
                  'rounded-md border px-3 py-1.5 text-[13px] font-medium transition-colors',
                  form.severity === opt.value
                    ? 'border-primary-500 bg-primary-50 text-primary-600 dark:border-primary-400 dark:bg-primary-50 dark:text-primary-400'
                    : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50 dark:border-neutral-300 dark:text-neutral-500 dark:hover:bg-neutral-200'
                ]"
                @click="form.severity = opt.value"
              >
                {{ opt.label }}
              </button>
            </div>
            <p v-if="errors.severity" class="mt-1 text-[12px] text-danger-500">{{ errors.severity }}</p>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <!-- Project -->
            <div>
              <label for="project" class="mb-1.5 block text-[13px] font-medium text-neutral-700 dark:text-neutral-600">Project</label>
              <select
                id="project"
                v-model="form.projectId"
                class="h-9 w-full rounded-md border border-neutral-200 bg-transparent px-3 text-[13px] text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-neutral-300 dark:text-neutral-800"
              >
                <option value="">Select project</option>
                <option v-for="proj in projects" :key="proj.id" :value="proj.id">{{ proj.name }}</option>
              </select>
            </div>

            <!-- Service -->
            <div>
              <label for="service" class="mb-1.5 block text-[13px] font-medium text-neutral-700 dark:text-neutral-600">Service</label>
              <select
                id="service"
                v-model="form.serviceId"
                class="h-9 w-full rounded-md border border-neutral-200 bg-transparent px-3 text-[13px] text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-neutral-300 dark:text-neutral-800"
              >
                <option value="">Select service</option>
                <option v-for="svc in serviceOptions" :key="svc.id" :value="svc.id">{{ svc.name }}</option>
              </select>
            </div>

            <!-- Team -->
            <div>
              <label for="team" class="mb-1.5 block text-[13px] font-medium text-neutral-700 dark:text-neutral-600">
                Team <span class="text-danger-500">*</span>
              </label>
              <select
                id="team"
                v-model="form.teamId"
                :class="[
                  'h-9 w-full rounded-md border bg-transparent px-3 text-[13px] focus:outline-none focus:ring-1',
                  errors.teamId ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500' : 'border-neutral-200 focus:border-primary-500 focus:ring-primary-500 dark:border-neutral-300'
                ]"
              >
                <option value="">Select team</option>
                <option v-for="team in teams" :key="team.id" :value="team.id">{{ team.name }}</option>
              </select>
              <p v-if="errors.teamId" class="mt-1 text-[12px] text-danger-500">{{ errors.teamId }}</p>
            </div>

            <!-- Assignee -->
            <div>
              <label for="assignee" class="mb-1.5 block text-[13px] font-medium text-neutral-700 dark:text-neutral-600">Assignee</label>
              <select
                id="assignee"
                v-model="form.assigneeId"
                class="h-9 w-full rounded-md border border-neutral-200 bg-transparent px-3 text-[13px] text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-neutral-300 dark:text-neutral-800"
              >
                <option value="">Select assignee</option>
                <option v-for="user in users" :key="user.id" :value="user.id">{{ user.name }}</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center justify-end gap-3">
        <button
          type="button"
          class="rounded-md px-3 py-1.5 text-[13px] font-medium text-neutral-600 hover:bg-neutral-100 dark:text-neutral-500 dark:hover:bg-neutral-200"
          @click="handleCancel"
        >
          Cancel
        </button>
        <UButton
          type="submit"
          color="primary"
          size="sm"
          label="Create incident"
          :loading="submitting"
          :disabled="!can('incidents.create')"
        />
      </div>
    </form>

    <!-- Unsaved changes dialog -->
    <UModal
      v-model:open="showUnsavedDialog"
      title="Unsaved changes"
      description="You have unsaved changes. Are you sure you want to leave?"
      :ui="{ content: 'rounded-xl' }"
    >
      <!-- The default slot is the modal's trigger; the body goes in #content -->
      <template #content>
      <div class="p-6">
        <div class="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-warning-50 dark:bg-warning-50/20">
          <UIcon name="i-lucide-alert-triangle" class="h-5 w-5 text-warning-500" />
        </div>
        <h3 class="mb-1 text-[14px] font-semibold text-neutral-900 dark:text-neutral-800">Unsaved changes</h3>
        <p class="text-[13px] text-neutral-500">You have unsaved changes. Are you sure you want to leave? Your changes will be lost.</p>
        <div class="mt-6 flex justify-end gap-2">
          <button
            class="rounded-md border border-neutral-200 px-3 py-1.5 text-[13px] font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-300 dark:text-neutral-600 dark:hover:bg-neutral-200"
            @click="stayOnPage"
          >
            Keep editing
          </button>
          <button
            class="rounded-md bg-danger-500 px-3 py-1.5 text-[13px] font-medium text-white hover:bg-danger-600"
            @click="confirmLeave"
          >
            Discard changes
          </button>
        </div>
      </div>
      </template>
    </UModal>
  </div>
</template>
