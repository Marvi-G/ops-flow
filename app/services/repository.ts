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
  projects as mockProjects,
  services as mockServices,
  teams as mockTeams,
  activityEvents as mockActivity,
  notifications as mockNotifications,
  timelineEvents as mockTimeline,
  comments as mockComments,
  users as mockUsers,
  currentUser as mockCurrentUser,
  currentOrganization as mockOrg,
  organizations as mockOrganizations
} from './mock-data'

function delay(ms = 200): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export const incidentRepository = {
  async list(filters?: Partial<IncidentFilters>, pagination?: Partial<PaginationState>): Promise<{ data: Incident[]; total: number }> {
    await delay()
    let result = [...mockIncidents]

    if (filters?.search) {
      const q = filters.search.toLowerCase()
      result = result.filter(i =>
        i.title.toLowerCase().includes(q) ||
        `INC-${i.number}`.toLowerCase().includes(q)
      )
    }
    if (filters?.severity?.length) {
      result = result.filter(i => filters.severity!.includes(i.severity))
    }
    if (filters?.status?.length) {
      result = result.filter(i => filters.status!.includes(i.status))
    }
    if (filters?.serviceId?.length) {
      result = result.filter(i => i.serviceIds.some(sid => filters.serviceId!.includes(sid)))
    }
    if (filters?.teamId?.length) {
      result = result.filter(i => filters.teamId!.includes(i.teamId))
    }

    const total = result.length
    const page = pagination?.page ?? 1
    const pageSize = pagination?.pageSize ?? 20
    const start = (page - 1) * pageSize
    result = result.slice(start, start + pageSize)

    return { data: result, total }
  },

  async getById(id: string): Promise<Incident | undefined> {
    await delay()
    return mockIncidents.find(i => i.id === id)
  },

  async getTimeline(incidentId: string): Promise<TimelineEvent[]> {
    await delay()
    return mockTimeline.filter(t => t.incidentId === incidentId)
  },

  async getComments(incidentId: string): Promise<Comment[]> {
    await delay()
    return mockComments.filter(c => c.incidentId === incidentId)
  },

  async create(_data: Partial<Incident>): Promise<Incident> {
    await delay(500)
    return mockIncidents[0]
  }
}

export const projectRepository = {
  async list(): Promise<Project[]> {
    await delay()
    return [...mockProjects]
  },

  async getById(id: string): Promise<Project | undefined> {
    await delay()
    return mockProjects.find(p => p.id === id)
  }
}

export const serviceRepository = {
  async list(): Promise<Service[]> {
    await delay()
    return [...mockServices]
  },

  async getById(id: string): Promise<Service | undefined> {
    await delay()
    return mockServices.find(s => s.id === id)
  }
}

export const teamRepository = {
  async list(): Promise<Team[]> {
    await delay()
    return [...mockTeams]
  },

  async getById(id: string): Promise<Team | undefined> {
    await delay()
    return mockTeams.find(t => t.id === id)
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
