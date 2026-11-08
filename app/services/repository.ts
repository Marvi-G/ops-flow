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
  IncidentStatus,
  PaginationState,
  DashboardStats
} from '~/types'

import {
  incidents as mockIncidents,
  activityEvents as mockActivity,
  notifications as mockNotifications
} from './mock-data'
import { api, ApiError } from './api'
import {
  mapComment,
  mapIncident,
  mapOrganization,
  mapOrgUser,
  mapProject,
  mapRelatedIncident,
  mapService,
  mapSession,
  mapTeam,
  mapTimelineEvent,
  serializeIncidentFilters
} from './mappers'
import type {
  ApiIncident,
  ApiIncidentDetail,
  ApiMe,
  ApiOrganization,
  ApiOrgUser,
  ApiProject,
  ApiService,
  ApiTeam,
  IncidentSort
} from './mappers'

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
    return mapSession(await api.get<ApiMe>('/auth/me')).user
  },

  /** Members of the current organization (needs the members.read permission). */
  async list(): Promise<User[]> {
    return (await api.get<ApiOrgUser[]>('/users')).map(u => mapOrgUser(u))
  }
}

export const organizationRepository = {
  async getCurrent(): Promise<Organization> {
    return mapOrganization(await api.get<ApiOrganization>('/organizations/current'))
  },

  async list(): Promise<Organization[]> {
    return (await api.get<ApiOrganization[]>('/organizations')).map(mapOrganization)
  }
}

/** Incidents that still need attention (everything before resolved / post-mortem). */
export const ACTIVE_INCIDENT_STATUSES: IncidentStatus[] = ['investigating', 'identified', 'monitoring']

export const dashboardRepository = {
  /**
   * Built from the incident and service endpoints until a dedicated stats endpoint
   * exists (Phase 9). "Services affected" looks at the 100 most recent active incidents.
   */
  async getStats(): Promise<DashboardStats> {
    const status = ACTIVE_INCIDENT_STATUSES.join(',')
    const [active, critical, services] = await Promise.all([
      api.list<ApiIncident>('/incidents', { status, pageSize: 100 }),
      api.list<ApiIncident>('/incidents', { status, severity: 'critical', pageSize: 1 }),
      api.get<ApiService[]>('/services')
    ])

    // Services that were never measured report 0 and shouldn't drag the average down
    const measured = services.map(s => Number(s.uptime)).filter(uptime => uptime > 0)
    const uptime = measured.length
      ? Math.round((measured.reduce((sum, value) => sum + value, 0) / measured.length) * 100) / 100
      : 0

    return {
      activeIncidents: active.meta.total,
      criticalIncidents: critical.meta.total,
      servicesAffected: new Set(active.data.flatMap(incident => incident.services.map(s => s.id))).size,
      uptime
    }
  }
}
