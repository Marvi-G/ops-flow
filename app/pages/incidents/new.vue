<script setup lang="ts">
import { teams, services, users } from '~/services/mock-data'
import { projects } from '~/services/mock-data'

definePageMeta({ layout: 'default' })

const router = useRouter()

const form = reactive({
  title: '',
  description: '',
  severity: '' as string,
  projectId: '',
  serviceId: '',
  teamId: '',
  assigneeId: ''
})

const errors = reactive<Record<string, string>>({})
const submitting = ref(false)
const submitted = ref(false)
const dirty = ref(false)

watch(form, () => { dirty.value = true }, { deep: true })

function validate(): boolean {
  const e: Record<string, string> = {}
  if (!form.title.trim()) e.title = 'Title is required'
  if (!form.description.trim()) e.description = 'Description is required'
  if (!form.severity) e.severity = 'Severity is required'
  if (!form.teamId) e.teamId = 'Team is required'
  Object.keys(errors).forEach(k => delete errors[k])
  Object.assign(errors, e)
  return Object.keys(e).length === 0
}

async function handleSubmit() {
  if (!validate()) return
  submitting.value = true
  await new Promise(r => setTimeout(r, 800))
  submitting.value = false
  submitted.value = true
  dirty.value = false
  setTimeout(() => {
    router.push('/incidents')
  }, 1500)
}

const severityOptions = [
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
      <p class="mt-1 text-[13px] text-neutral-500">Redirecting to incidents list...</p>
    </div>

    <!-- Form -->
    <form v-else class="space-y-5" @submit.prevent="handleSubmit">
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
                <option v-for="svc in services" :key="svc.id" :value="svc.id">{{ svc.name }}</option>
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
        <UButton
          to="/incidents"
          color="neutral"
          variant="ghost"
          size="sm"
          label="Cancel"
        />
        <UButton
          type="submit"
          color="primary"
          size="sm"
          label="Create incident"
          :loading="submitting"
        />
      </div>
    </form>
  </div>
</template>
