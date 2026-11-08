<script setup lang="ts">
import { incidentRepository } from '~/services/repository'
import type { Incident, IncidentStatus, TimelineEvent, Comment } from '~/types'
import { formatDateTime, formatTime, formatRelativeTime } from '~/utils'

definePageMeta({ layout: 'default' })

const route = useRoute()
const incidentId = route.params.id as string

const incident = ref<Incident | null>(null)
const timeline = ref<TimelineEvent[]>([])
const incidentComments = ref<Comment[]>([])
const relatedIncidents = ref<Awaited<ReturnType<typeof incidentRepository.getRelated>>>([])
const loading = ref(true)
const loadError = ref('')
const activeTab = ref<'timeline' | 'comments' | 'activity'>('timeline')
const newComment = ref('')
const transitioning = ref(false)

onMounted(async () => {
  try {
    // One request behind the scenes; the repository shares it between these calls
    const [inc, tl, cmts, related] = await Promise.all([
      incidentRepository.getById(incidentId),
      incidentRepository.getTimeline(incidentId),
      incidentRepository.getComments(incidentId),
      incidentRepository.getRelated(incidentId)
    ])
    incident.value = inc || null
    timeline.value = tl
    incidentComments.value = cmts
    relatedIncidents.value = related
  } catch (err) {
    loadError.value = err instanceof Error ? err.message : 'Failed to load the incident'
  } finally {
    loading.value = false
  }
})

const timelineIcon: Record<string, string> = {
  created: 'i-lucide-plus-circle',
  assigned: 'i-lucide-user-plus',
  status_change: 'i-lucide-refresh-cw',
  severity_change: 'i-lucide-alert-triangle',
  comment: 'i-lucide-message-circle',
  note: 'i-lucide-file-text',
  resolved: 'i-lucide-check-circle'
}

// State transitions
const statusFlow: Record<IncidentStatus, IncidentStatus | null> = {
  investigating: 'identified',
  identified: 'monitoring',
  monitoring: 'resolved',
  resolved: null,
  postmortem: null
}

const nextStatus = computed(() => {
  if (!incident.value) return null
  return statusFlow[incident.value.status]
})

const previousStatus = computed(() => {
  if (!incident.value) return null
  const entries = Object.entries(statusFlow) as [IncidentStatus, IncidentStatus | null][]
  const found = entries.find(([, next]) => next === incident.value!.status)
  return found ? found[0] : null
})

async function transitionTo(status: IncidentStatus) {
  if (!incident.value || transitioning.value) return
  transitioning.value = true

  // Add timeline event
  const newEvent: TimelineEvent = {
    id: `tl-new-${Date.now()}`,
    incidentId: incident.value.id,
    type: 'status_change',
    title: `Status changed to ${status.charAt(0).toUpperCase() + status.slice(1)}`,
    userId: 'user-1',
    user: { id: 'user-1', name: 'Mark Chen', email: 'mark@northstarlabs.io', role: 'admin', organizationId: 'org-1' },
    createdAt: new Date().toISOString()
  }

  // Update incident
  incident.value.status = status
  incident.value.updatedAt = new Date().toISOString()
  if (status === 'resolved') {
    incident.value.resolvedAt = new Date().toISOString()
  }

  // Add to timeline
  timeline.value.push(newEvent)

  await new Promise(r => setTimeout(r, 300))
  transitioning.value = false
}
</script>

<template>
  <div>
    <div v-if="loading" class="space-y-4">
      <SharedLoadingSkeleton :rows="3" :columns="3" />
    </div>

    <div v-else-if="loadError" class="rounded-lg border border-neutral-200 bg-white dark:border-neutral-300 dark:bg-neutral-100">
      <SharedEmptyState icon="i-lucide-alert-triangle" title="Couldn't load the incident" :description="loadError" />
    </div>

    <div v-else-if="!incident" class="rounded-lg border border-neutral-200 bg-white dark:border-neutral-300 dark:bg-neutral-100">
      <SharedEmptyState icon="i-lucide-alert-triangle" title="Incident not found" description="The incident you're looking for doesn't exist." />
    </div>

    <div v-else>
      <!-- Header -->
      <div class="mb-6">
        <div class="mb-2 flex items-center gap-2">
          <NuxtLink to="/incidents" class="text-[12px] text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-500">
            Incidents
          </NuxtLink>
          <span class="text-neutral-300 dark:text-neutral-400">/</span>
          <span class="text-[12px] font-medium text-neutral-600 dark:text-neutral-500">INC-{{ incident.number }}</span>
        </div>

        <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 class="text-lg font-semibold text-neutral-900 dark:text-neutral-800">
              INC-{{ incident.number }} {{ incident.title }}
            </h1>
            <p class="mt-1 text-[13px] text-neutral-500">{{ incident.description }}</p>
          </div>
          <div class="flex shrink-0 flex-wrap items-center gap-2">
            <SharedSeverityBadge :severity="incident.severity" />
            <IncidentsIncidentStatusBadge :status="incident.status" />
          </div>
        </div>

        <!-- State transition buttons -->
        <div v-if="nextStatus || previousStatus" class="mt-4 flex flex-wrap items-center gap-2">
          <span class="text-[12px] text-neutral-500">Move to:</span>
          <button
            v-if="previousStatus"
            class="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-[12px] font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-300 dark:bg-neutral-100 dark:text-neutral-600 dark:hover:bg-neutral-200"
            :disabled="transitioning"
            @click="transitionTo(previousStatus!)"
          >
            <UIcon name="i-lucide-arrow-left" class="mr-1 inline h-3 w-3" />
            {{ previousStatus.charAt(0).toUpperCase() + previousStatus.slice(1) }}
          </button>
          <button
            v-if="nextStatus"
            :class="[
              'rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors disabled:opacity-50',
              nextStatus === 'resolved'
                ? 'bg-success-500 text-white hover:bg-success-600'
                : 'bg-primary-500 text-white hover:bg-primary-600'
            ]"
            :disabled="transitioning"
            @click="transitionTo(nextStatus!)"
          >
            {{ nextStatus.charAt(0).toUpperCase() + nextStatus.slice(1) }}
            <UIcon name="i-lucide-arrow-right" class="ml-1 inline h-3 w-3" />
          </button>
        </div>
      </div>

      <div class="grid gap-6 lg:grid-cols-3">
        <!-- Main content -->
        <div class="lg:col-span-2">
          <!-- Tabs -->
          <div class="mb-4 flex gap-1 border-b border-neutral-200 dark:border-neutral-300">
            <button
              :class="[
                'border-b-2 px-3 py-2 text-[13px] font-medium transition-colors',
                activeTab === 'timeline'
                  ? 'border-primary-500 text-primary-600 dark:border-primary-400 dark:text-primary-400'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-600'
              ]"
              @click="activeTab = 'timeline'"
            >
              Timeline
            </button>
            <button
              :class="[
                'border-b-2 px-3 py-2 text-[13px] font-medium transition-colors',
                activeTab === 'comments'
                  ? 'border-primary-500 text-primary-600 dark:border-primary-400 dark:text-primary-400'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-600'
              ]"
              @click="activeTab = 'comments'"
            >
              Comments ({{ incidentComments.length }})
            </button>
            <button
              :class="[
                'border-b-2 px-3 py-2 text-[13px] font-medium transition-colors',
                activeTab === 'activity'
                  ? 'border-primary-500 text-primary-600 dark:border-primary-400 dark:text-primary-400'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-600'
              ]"
              @click="activeTab = 'activity'"
            >
              Activity
            </button>
          </div>

          <!-- Timeline tab -->
          <div v-if="activeTab === 'timeline'" class="space-y-0">
            <div
              v-for="event in timeline"
              :key="event.id"
              class="relative flex gap-3 pb-6"
            >
              <!-- Line -->
              <div class="flex flex-col items-center">
                <div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-white dark:border-neutral-300 dark:bg-neutral-100">
                  <UIcon :name="timelineIcon[event.type] || 'i-lucide-circle'" class="h-3.5 w-3.5 text-neutral-400" />
                </div>
                <div class="w-px flex-1 bg-neutral-200 dark:bg-neutral-300" />
              </div>

              <!-- Content -->
              <div class="min-w-0 flex-1 pt-0.5">
                <p class="text-[13px] text-neutral-700 dark:text-neutral-600">
                  <span class="font-medium text-neutral-900 dark:text-neutral-800">{{ event.title }}</span>
                </p>
                <p v-if="event.description" class="mt-1 text-[13px] text-neutral-500">{{ event.description }}</p>
                <p class="mt-1 text-[12px] text-neutral-400">
                  {{ formatTime(event.createdAt) }} &middot; {{ event.user?.name }}
                </p>
              </div>
            </div>
          </div>

          <!-- Comments tab -->
          <div v-if="activeTab === 'comments'">
            <div class="space-y-4">
              <div
                v-for="comment in incidentComments"
                :key="comment.id"
                class="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-300 dark:bg-neutral-100"
              >
                <div class="mb-2 flex items-center gap-2">
                  <div class="flex h-6 w-6 items-center justify-center rounded-full bg-primary-500 text-[10px] font-semibold text-white">
                    {{ comment.user?.name.split(' ').map(n => n[0]).join('') }}
                  </div>
                  <span class="text-[13px] font-medium text-neutral-900 dark:text-neutral-800">{{ comment.user?.name }}</span>
                  <span class="text-[12px] text-neutral-400">{{ formatRelativeTime(comment.createdAt) }}</span>
                </div>
                <p class="text-[13px] text-neutral-700 dark:text-neutral-600">{{ comment.body }}</p>
              </div>
            </div>

            <!-- Add comment -->
            <div class="mt-4 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-300 dark:bg-neutral-100">
              <textarea
                v-model="newComment"
                rows="3"
                placeholder="Add a comment..."
                class="w-full resize-none rounded-md border border-neutral-200 bg-transparent px-3 py-2 text-[13px] text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-neutral-300 dark:text-neutral-800"
              />
              <div class="mt-2 flex justify-end">
                <UButton color="primary" size="sm" label="Comment" :disabled="!newComment.trim()" />
              </div>
            </div>
          </div>

          <!-- Activity tab -->
          <div v-if="activeTab === 'activity'" class="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-300 dark:bg-neutral-100">
            <p class="text-[13px] text-neutral-500">Detailed activity log for this incident will appear here.</p>
          </div>

          <!-- Related incidents -->
          <div v-if="relatedIncidents.length > 0" class="mt-6">
            <h3 class="mb-3 text-[14px] font-semibold text-neutral-900 dark:text-neutral-800">Related incidents</h3>
            <div class="rounded-lg border border-neutral-200 bg-white dark:border-neutral-300 dark:bg-neutral-100">
              <div class="divide-y divide-neutral-200 dark:divide-neutral-300">
                <NuxtLink
                  v-for="related in relatedIncidents"
                  :key="related.id"
                  :to="`/incidents/${related.id}`"
                  class="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-200/50"
                >
                  <SharedSeverityBadge :severity="related.severity" />
                  <span class="flex-1 truncate text-[13px] font-medium text-neutral-900 dark:text-neutral-800">
                    INC-{{ related.number }} {{ related.title }}
                  </span>
                  <IncidentsIncidentStatusBadge :status="related.status" />
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="space-y-4">
          <div class="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-300 dark:bg-neutral-100">
            <h3 class="mb-3 text-[12px] font-medium uppercase tracking-wider text-neutral-400">Details</h3>
            <dl class="space-y-3">
              <div>
                <dt class="text-[12px] text-neutral-500">Severity</dt>
                <dd class="mt-0.5"><SharedSeverityBadge :severity="incident.severity" /></dd>
              </div>
              <div>
                <dt class="text-[12px] text-neutral-500">Status</dt>
                <dd class="mt-0.5"><IncidentsIncidentStatusBadge :status="incident.status" /></dd>
              </div>
              <div>
                <dt class="text-[12px] text-neutral-500">Assignee</dt>
                <dd class="mt-0.5 text-[13px] font-medium text-neutral-900 dark:text-neutral-800">{{ incident.assignee?.name || 'Unassigned' }}</dd>
              </div>
              <div>
                <dt class="text-[12px] text-neutral-500">Team</dt>
                <dd class="mt-0.5 text-[13px] text-neutral-700 dark:text-neutral-600">{{ incident.team?.name || '-' }}</dd>
              </div>
              <div>
                <dt class="text-[12px] text-neutral-500">Services</dt>
                <dd class="mt-0.5">
                  <span v-for="svc in incident.services" :key="svc.id" class="text-[13px] text-neutral-700 dark:text-neutral-600">
                    {{ svc.name }}
                  </span>
                  <span v-if="!incident.services?.length" class="text-[13px] text-neutral-400">None</span>
                </dd>
              </div>
              <div>
                <dt class="text-[12px] text-neutral-500">Created</dt>
                <dd class="mt-0.5 text-[13px] text-neutral-700 dark:text-neutral-600">{{ formatDateTime(incident.createdAt) }}</dd>
              </div>
              <div>
                <dt class="text-[12px] text-neutral-500">Updated</dt>
                <dd class="mt-0.5 text-[13px] text-neutral-700 dark:text-neutral-600">{{ formatDateTime(incident.updatedAt) }}</dd>
              </div>
              <div v-if="incident.resolvedAt">
                <dt class="text-[12px] text-neutral-500">Resolved</dt>
                <dd class="mt-0.5 text-[13px] text-success-500">{{ formatDateTime(incident.resolvedAt) }}</dd>
              </div>
            </dl>
          </div>

          <!-- Created by -->
          <div class="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-300 dark:bg-neutral-100">
            <h3 class="mb-3 text-[12px] font-medium uppercase tracking-wider text-neutral-400">Created by</h3>
            <div class="flex items-center gap-2">
              <div class="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-200 text-[10px] font-semibold text-neutral-600 dark:bg-neutral-300 dark:text-neutral-500">
                {{ incident.createdBy?.name.split(' ').map(n => n[0]).join('') }}
              </div>
              <div>
                <p class="text-[13px] font-medium text-neutral-900 dark:text-neutral-800">{{ incident.createdBy?.name }}</p>
                <p class="text-[12px] text-neutral-400">{{ incident.createdBy?.email }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
