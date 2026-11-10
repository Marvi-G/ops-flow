import type {
  Incident,
  Project,
  Service,
  Team,
  TeamMember,
  ActivityEvent,
  Notification,
  TimelineEvent,
  Comment,
  User,
  Organization,
  IncidentFilters,
  IncidentStatus,
  ServiceStatus,
  PaginationState,
  DashboardStats
} from '~/types'

import {
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

/** Body of POST/PATCH /incidents. Optional ids are left out (create) or null (clear). */
export interface IncidentInput {
  title: string
  description?: string
  severity: Incident['severity']
  status?: IncidentStatus
  teamId?: string | null
  assigneeId?: string | null
  serviceIds?: string[]
}

/** Body of POST/PATCH /projects. */
export interface ProjectInput {
  name: string
  description?: string
  status?: Project['status']
  teamId?: string | null
}

/** Body of POST/PATCH /services. */
export interface ServiceInput {
  name: string
  description?: string
  status?: ServiceStatus
  projectId?: string | null
}

/** Body of POST/PATCH /teams. */
export interface TeamInput {
  name: string
  description?: string
  onCallStatus?: Team['onCallStatus']
}

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

  async create(input: IncidentInput): Promise<Incident> {
    return mapIncident(await api.post<ApiIncident>('/incidents', { ...input }))
  },

  /** Partial update. A null teamId/assigneeId clears it. */
  async update(id: string, patch: Partial<IncidentInput>): Promise<Incident> {
    return mapIncident(await api.patch<ApiIncident>(`/incidents/${id}`, { ...patch }))
  },

  async addComment(incidentId: string, body: string): Promise<Comment> {
    return mapComment(await api.post<Parameters<typeof mapComment>[0]>(`/incidents/${incidentId}/comments`, { body }))
  }
}

export const projectRepository = {
  async list(): Promise<Project[]> {
    return (await api.get<ApiProject[]>('/projects')).map(mapProject)
  },

  async getById(id: string): Promise<Project | undefined> {
    const project = await orUndefined(api.get<ApiProject>(`/projects/${id}`))
    return project ? mapProject(project) : undefined
  },

  async create(input: ProjectInput): Promise<Project> {
    return mapProject(await api.post<ApiProject>('/projects', { ...input }))
  },

  /** Partial update. A null teamId removes the team. */
  async update(id: string, patch: Partial<ProjectInput>): Promise<Project> {
    return mapProject(await api.patch<ApiProject>(`/projects/${id}`, { ...patch }))
  },

  /** Refused (409) while the project still has services. */
  async delete(id: string): Promise<void> {
    await api.delete(`/projects/${id}`)
  }
}

export const serviceRepository = {
  async list(): Promise<Service[]> {
    return (await api.get<ApiService[]>('/services')).map(mapService)
  },

  async getById(id: string): Promise<Service | undefined> {
    const service = await orUndefined(api.get<ApiService>(`/services/${id}`))
    return service ? mapService(service) : undefined
  },

  async create(input: ServiceInput): Promise<Service> {
    return mapService(await api.post<ApiService>('/services', { ...input }))
  },

  /** Partial update. A null projectId takes the service out of its project. */
  async update(id: string, patch: Partial<ServiceInput>): Promise<Service> {
    return mapService(await api.patch<ApiService>(`/services/${id}`, { ...patch }))
  },

  /** Refused (409) while any incident is linked to the service. */
  async delete(id: string): Promise<void> {
    await api.delete(`/services/${id}`)
  }
}

export const teamRepository = {
  async list(): Promise<Team[]> {
    return (await api.get<ApiTeam[]>('/teams')).map(mapTeam)
  },

  async getById(id: string): Promise<Team | undefined> {
    const team = await orUndefined(api.get<ApiTeam>(`/teams/${id}`))
    return team ? mapTeam(team) : undefined
  },

  async create(input: TeamInput): Promise<Team> {
    return mapTeam(await api.post<ApiTeam>('/teams', { ...input }))
  },

  async update(id: string, patch: Partial<TeamInput>): Promise<Team> {
    return mapTeam(await api.patch<ApiTeam>(`/teams/${id}`, { ...patch }))
  },

  /** Refused (409) while the team owns projects or has been on incidents. */
  async delete(id: string): Promise<void> {
    await api.delete(`/teams/${id}`)
  },

  /** The member operations all return the updated team. */
  async addMember(teamId: string, userId: string, role?: TeamMember['role']): Promise<Team> {
    return mapTeam(await api.post<ApiTeam>(`/teams/${teamId}/members`, { userId, role }))
  },

  async setMemberRole(teamId: string, userId: string, role: TeamMember['role']): Promise<Team> {
    return mapTeam(await api.patch<ApiTeam>(`/teams/${teamId}/members/${userId}`, { role }))
  },

  async removeMember(teamId: string, userId: string): Promise<void> {
    await api.delete(`/teams/${teamId}/members/${userId}`)
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
