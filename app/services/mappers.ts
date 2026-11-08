import type {
  Comment,
  Incident,
  IncidentFilters,
  IncidentSeverity,
  IncidentStatus,
  Organization,
  PaginationState,
  Project,
  Service,
  ServiceStatus,
  Team,
  TeamMember,
  TimelineEvent,
  User
} from '~/types'

/**
 * Shapes returned by apps/api. Only the fields the frontend consumes are listed.
 * Team/project/service/organization payloads are mapped in later phases once
 * their computed fields (counts, uptime, plan, ...) exist on the backend.
 */
interface ApiUserRef {
  id: string
  name: string
  email: string
}

type OrgRole = User['role']

/** Response of GET /api/auth/me */
export interface ApiMe {
  user: { id: string, email: string, name: string, avatar: string | null }
  organization: { id: string, name: string, slug: string, plan: string, role: OrgRole }
  organizations: { id: string, name: string, slug: string, role: OrgRole }[]
}

/**
 * Maps /auth/me onto the frontend session types. The API does not return
 * memberCount/createdAt yet (Phase 6), and only the current organization's plan.
 */
export function mapSession(me: ApiMe): { user: User, organization: Organization, allOrganizations: Organization[] } {
  const toOrganization = (o: { id: string, name: string, slug: string }, plan: string): Organization => ({
    id: o.id,
    name: o.name,
    slug: o.slug,
    plan: plan as Organization['plan'],
    memberCount: 0,
    createdAt: ''
  })

  return {
    user: {
      id: me.user.id,
      name: me.user.name,
      email: me.user.email,
      avatar: me.user.avatar ?? undefined,
      role: me.organization.role,
      organizationId: me.organization.id
    },
    organization: toOrganization(me.organization, me.organization.plan),
    allOrganizations: me.organizations.map(o =>
      toOrganization(o, o.id === me.organization.id ? me.organization.plan : 'free')
    )
  }
}

export interface ApiIncident {
  id: string
  number: number
  title: string
  description: string | null
  severity: IncidentSeverity
  status: IncidentStatus
  projectId?: string
  teamId: string | null
  team?: { id: string, name: string } | null
  assigneeId: string | null
  assignee?: ApiUserRef | null
  createdById: string
  createdBy?: ApiUserRef | null
  services: { id: string, name: string }[]
  createdAt: string
  updatedAt: string
  resolvedAt: string | null
}

/**
 * Incident payloads only carry {id, name} for related teams/services and
 * {id, name, email} for people, so the remaining fields get neutral defaults.
 * Use the dedicated team/service/user endpoints when the full data is needed.
 */
function toUserRef(u: ApiUserRef): User {
  return { id: u.id, name: u.name, email: u.email, role: 'member', organizationId: '' }
}

function toTeamRef(t: { id: string, name: string }): Team {
  return {
    id: t.id,
    name: t.name,
    description: '',
    memberCount: 0,
    projectCount: 0,
    activeIncidentCount: 0,
    onCallStatus: 'inactive',
    members: [],
    createdAt: ''
  }
}

function toServiceRef(s: { id: string, name: string }): Service {
  return {
    id: s.id,
    name: s.name,
    description: '',
    projectId: '',
    status: 'unknown',
    uptime: 0,
    latency: 0,
    openIncidentCount: 0,
    lastDeployment: '',
    createdAt: ''
  }
}

export function mapIncident(api: ApiIncident): Incident {
  return {
    id: api.id,
    number: api.number,
    title: api.title,
    description: api.description ?? '',
    severity: api.severity,
    status: api.status,
    serviceIds: api.services.map(s => s.id),
    services: api.services.map(toServiceRef),
    teamId: api.teamId ?? '',
    team: api.team ? toTeamRef(api.team) : undefined,
    assigneeId: api.assigneeId ?? undefined,
    assignee: api.assignee ? toUserRef(api.assignee) : undefined,
    createdById: api.createdById,
    createdBy: api.createdBy ? toUserRef(api.createdBy) : undefined,
    createdAt: api.createdAt,
    updatedAt: api.updatedAt,
    resolvedAt: api.resolvedAt ?? undefined
  }
}

interface ApiIncidentEvent {
  id: string
  incidentId: string
  type: TimelineEvent['type']
  title: string
  description: string | null
  userId: string | null
  user?: { id: string, name: string } | null
  createdAt: string
}

interface ApiIncidentComment {
  id: string
  incidentId: string
  body: string
  userId: string
  user?: ApiUserRef | null
  createdAt: string
  updatedAt: string
}

export interface ApiRelatedIncident {
  id: string
  number: number
  title: string
  severity: IncidentSeverity
  status: IncidentStatus
  createdAt: string
}

/** Response of GET /api/incidents/:id */
export interface ApiIncidentDetail extends ApiIncident {
  events: ApiIncidentEvent[]
  comments: ApiIncidentComment[]
  related: ApiRelatedIncident[]
}

export function mapTimelineEvent(e: ApiIncidentEvent): TimelineEvent {
  return {
    id: e.id,
    incidentId: e.incidentId,
    type: e.type,
    title: e.title,
    description: e.description ?? undefined,
    userId: e.userId ?? '',
    user: e.user ? { id: e.user.id, name: e.user.name, email: '', role: 'member', organizationId: '' } : undefined,
    createdAt: e.createdAt
  }
}

export function mapComment(c: ApiIncidentComment): Comment {
  return {
    id: c.id,
    incidentId: c.incidentId,
    body: c.body,
    userId: c.userId,
    user: c.user ? toUserRef(c.user) : undefined,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt
  }
}

/** Related incidents are summaries, so they map onto a partial Incident. */
export function mapRelatedIncident(r: ApiRelatedIncident): Pick<Incident, 'id' | 'number' | 'title' | 'severity' | 'status' | 'createdAt'> {
  return { id: r.id, number: r.number, title: r.title, severity: r.severity, status: r.status, createdAt: r.createdAt }
}

/** GET /api/teams and /api/teams/:id. `_count.incidents` is active incidents only. */
export interface ApiTeam {
  id: string
  name: string
  description: string | null
  onCallStatus: string
  createdAt: string
  _count: { members: number, projects: number, incidents: number }
  members: {
    id: string
    userId: string
    role: string
    joinedAt: string
    user: { id: string, name: string, email: string, avatar: string | null }
  }[]
}

export function mapTeam(t: ApiTeam): Team {
  const members: TeamMember[] = t.members.map(m => ({
    id: m.id,
    userId: m.userId,
    role: m.role === 'lead' ? 'lead' : 'member',
    joinedAt: m.joinedAt,
    user: {
      id: m.user.id,
      name: m.user.name,
      email: m.user.email,
      avatar: m.user.avatar ?? undefined,
      role: 'member',
      organizationId: ''
    }
  }))

  return {
    id: t.id,
    name: t.name,
    description: t.description ?? '',
    memberCount: t._count.members,
    projectCount: t._count.projects,
    activeIncidentCount: t._count.incidents,
    onCallStatus: t.onCallStatus === 'active' ? 'active' : 'inactive',
    members,
    createdAt: t.createdAt
  }
}

/** GET /api/services and /api/services/:id. `_count.incidents` is open incidents only. */
export interface ApiService {
  id: string
  name: string
  description: string | null
  projectId: string | null
  project?: { id: string, name: string } | null
  status: string
  // Prisma serialises Decimal as a string
  uptime: string | number
  latency: number
  lastDeployment: string | null
  createdAt: string
  _count: { incidents: number }
}

const SERVICE_STATUSES: ServiceStatus[] = ['operational', 'degraded', 'partial_outage', 'major_outage', 'unknown']

/** Services only carry {id, name} for their project; the rest gets neutral defaults. */
function toProjectRef(p: { id: string, name: string }, teamId = ''): Project {
  return {
    id: p.id,
    name: p.name,
    description: '',
    status: 'active',
    serviceCount: 0,
    activeIncidentCount: 0,
    teamId,
    lastActivity: '',
    createdAt: ''
  }
}

/** GET /api/projects and /api/projects/:id */
export interface ApiProject {
  id: string
  name: string
  description: string | null
  status: string
  teamId: string | null
  team?: { id: string, name: string } | null
  createdAt: string
  lastActivity: string
  activeIncidentCount: number
  _count: { services: number }
}

const PROJECT_STATUSES: Project['status'][] = ['active', 'archived', 'maintenance']

export function mapProject(p: ApiProject): Project {
  return {
    id: p.id,
    name: p.name,
    description: p.description ?? '',
    status: PROJECT_STATUSES.includes(p.status as Project['status']) ? p.status as Project['status'] : 'active',
    serviceCount: p._count.services,
    activeIncidentCount: p.activeIncidentCount,
    teamId: p.teamId ?? '',
    team: p.team ? toTeamRef(p.team) : undefined,
    lastActivity: p.lastActivity,
    createdAt: p.createdAt
  }
}

export function mapService(s: ApiService): Service {
  return {
    id: s.id,
    name: s.name,
    description: s.description ?? '',
    projectId: s.projectId ?? '',
    project: s.project ? toProjectRef(s.project) : undefined,
    status: SERVICE_STATUSES.includes(s.status as ServiceStatus) ? s.status as ServiceStatus : 'unknown',
    uptime: Number(s.uptime),
    latency: s.latency,
    openIncidentCount: s._count.incidents,
    lastDeployment: s.lastDeployment ?? '',
    createdAt: s.createdAt
  }
}

export type IncidentSort = { field: 'created' | 'updated' | 'severity', dir: 'asc' | 'desc' }

const SORT_FIELDS = { created: 'createdAt', updated: 'updatedAt', severity: 'severity' } as const

/**
 * Frontend filters hold arrays; the API takes comma-separated lists for
 * severity, status, team and service. For severity, 'desc' means most severe first.
 */
export function serializeIncidentFilters(
  filters: Partial<IncidentFilters> = {},
  pagination: Partial<PaginationState> = {},
  sort?: IncidentSort
): Record<string, string | number> {
  const query: Record<string, string | number> = {
    page: pagination.page ?? 1,
    pageSize: pagination.pageSize ?? 20
  }

  if (sort) {
    query.sortBy = SORT_FIELDS[sort.field]
    query.sortOrder = sort.dir
  }
  if (filters.search) query.search = filters.search
  if (filters.severity?.length) query.severity = filters.severity.join(',')
  if (filters.status?.length) query.status = filters.status.join(',')
  if (filters.serviceId?.length) query.serviceId = filters.serviceId.join(',')
  if (filters.teamId?.length) query.teamId = filters.teamId.join(',')
  // The API validates ISO datetimes; the date picker yields plain dates.
  if (filters.dateFrom) query.dateFrom = new Date(filters.dateFrom).toISOString()
  if (filters.dateTo) query.dateTo = new Date(filters.dateTo).toISOString()

  return query
}
