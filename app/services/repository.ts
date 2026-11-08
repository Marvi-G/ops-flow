import type {
  Incident,
  Project,
  Service,
  Team,
  ActivityEvent,
  Notification,
  TimelineEvent,
  Comment,
  User,
  Organization,
  IncidentFilters,
  PaginationState,
  DashboardStats
} from '~/types'

import {
  incidents as mockIncidents,
  activityEvents as mockActivity,
  notifications as mockNotifications,
  users as mockUsers,
  currentUser as mockCurrentUser,
  currentOrganization as mockOrg,
  organizations as mockOrganizations
} from './mock-data'
import { api, ApiError } from './api'
import {
  mapComment,
  mapIncident,
  mapProject,
  mapRelatedIncident,
  mapService,
  mapTeam,
  mapTimelineEvent,
  serializeIncidentFilters
} from './mappers'
import type { ApiIncident, ApiIncidentDetail, ApiProject, ApiService, ApiTeam, IncidentSort } from './mappers'

function delay(ms = 200): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/** A missing record (404) or a malformed id (422) means "not found", not a failure. */
async function orUndefined<T>(request: Promise<T>): Promise<T | undefined> {
  try {
    return await request
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 422)) return undefined
    throw err
  }
}

// The detail page asks for the incident, its timeline and its comments at the same
// time, and one endpoint returns all three. Share a single in-flight request.
const detailRequests = new Map<string, Promise<ApiIncidentDetail>>()

function fetchIncidentDetail(id: string): Promise<ApiIncidentDetail> {
  let request = detailRequests.get(id)
  if (!request) {
    request = api.get<ApiIncidentDetail>(`/incidents/${id}`).finally(() => detailRequests.delete(id))
    detailRequests.set(id, request)
  }
  return request
}

export const incidentRepository = {
  async list(
    filters?: Partial<IncidentFilters>,
    pagination?: Partial<PaginationState>,
    sort?: IncidentSort
  ): Promise<{ data: Incident[]; total: number }> {
    const { data, meta } = await api.list<ApiIncident>('/incidents', serializeIncidentFilters(filters, pagination, sort))
    return { data: data.map(mapIncident), total: meta.total }
  },

  async getById(id: string): Promise<Incident | undefined> {
    const detail = await orUndefined(fetchIncidentDetail(id))
    return detail ? mapIncident(detail) : undefined
  },

  async getTimeline(incidentId: string): Promise<TimelineEvent[]> {
    const detail = await orUndefined(fetchIncidentDetail(incidentId))
    return detail ? detail.events.map(mapTimelineEvent) : []
  },

  async getComments(incidentId: string): Promise<Comment[]> {
    const detail = await orUndefined(fetchIncidentDetail(incidentId))
    return detail ? detail.comments.map(mapComment) : []
  },

  async getRelated(incidentId: string): Promise<ReturnType<typeof mapRelatedIncident>[]> {
    const detail = await orUndefined(fetchIncidentDetail(incidentId))
    return detail ? detail.related.map(mapRelatedIncident) : []
  },

  // Still mock until the write path (Phase 7)
  async create(_data: Partial<Incident>): Promise<Incident> {
    await delay(500)
    return mockIncidents[0]
  }
}

export const projectRepository = {
  async list(): Promise<Project[]> {
    return (await api.get<ApiProject[]>('/projects')).map(mapProject)
  },

  async getById(id: string): Promise<Project | undefined> {
    const project = await orUndefined(api.get<ApiProject>(`/projects/${id}`))
    return project ? mapProject(project) : undefined
  }
}

export const serviceRepository = {
  async list(): Promise<Service[]> {
    return (await api.get<ApiService[]>('/services')).map(mapService)
  },

  async getById(id: string): Promise<Service | undefined> {
    const service = await orUndefined(api.get<ApiService>(`/services/${id}`))
    return service ? mapService(service) : undefined
  }
}

export const teamRepository = {
  async list(): Promise<Team[]> {
    return (await api.get<ApiTeam[]>('/teams')).map(mapTeam)
  },

  async getById(id: string): Promise<Team | undefined> {
    const team = await orUndefined(api.get<ApiTeam>(`/teams/${id}`))
    return team ? mapTeam(team) : undefined
  }
}

export const activityRepository = {
  async list(): Promise<ActivityEvent[]> {
    await delay()
    return [...mockActivity]
  }
}

export const notificationRepository = {
  async list(): Promise<Notification[]> {
    await delay()
    return [...mockNotifications]
  }
}

export const userRepository = {
  async getCurrent(): Promise<User> {
    await delay(100)
    return { ...mockCurrentUser }
  },

  async list(): Promise<User[]> {
    await delay()
    return [...mockUsers]
  }
}

export const organizationRepository = {
  async getCurrent(): Promise<Organization> {
    await delay(100)
    return { ...mockOrg }
  },

  async list(): Promise<Organization[]> {
    await delay()
    return [...mockOrganizations]
  }
}

export const dashboardRepository = {
  async getStats(): Promise<DashboardStats> {
    await delay()
    const active = mockIncidents.filter(i => i.status !== 'resolved' && i.status !== 'postmortem')
    return {
      activeIncidents: active.length,
      criticalIncidents: active.filter(i => i.severity === 'critical').length,
      servicesAffected: new Set(active.flatMap(i => i.serviceIds)).size,
      uptime: 99.94
    }
  }
}
