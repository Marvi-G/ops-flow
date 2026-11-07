import type { Incident, IncidentFilters, IncidentSeverity, IncidentStatus, Organization, PaginationState, User } from '~/types'

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

export function mapIncident(api: ApiIncident): Incident {
  return {
    id: api.id,
    number: api.number,
    title: api.title,
    description: api.description ?? '',
    severity: api.severity,
    status: api.status,
    serviceIds: api.services.map(s => s.id),
    teamId: api.teamId ?? '',
    assigneeId: api.assigneeId ?? undefined,
    createdById: api.createdById,
    createdAt: api.createdAt,
    updatedAt: api.updatedAt,
    resolvedAt: api.resolvedAt ?? undefined
  }
}

/**
 * Frontend filters hold arrays; the API takes comma-separated severity/status
 * and a single UUID for team/service (multi-value support comes in Phase 6).
 */
export function serializeIncidentFilters(
  filters: Partial<IncidentFilters> = {},
  pagination: Partial<PaginationState> = {}
): Record<string, string | number> {
  const query: Record<string, string | number> = {
    page: pagination.page ?? 1,
    pageSize: pagination.pageSize ?? 20
  }

  if (filters.search) query.search = filters.search
  if (filters.severity?.length) query.severity = filters.severity.join(',')
  if (filters.status?.length) query.status = filters.status.join(',')
  if (filters.serviceId?.length) query.serviceId = filters.serviceId[0]!
  if (filters.teamId?.length) query.teamId = filters.teamId[0]!
  // The API validates ISO datetimes; the date picker yields plain dates.
  if (filters.dateFrom) query.dateFrom = new Date(filters.dateFrom).toISOString()
  if (filters.dateTo) query.dateTo = new Date(filters.dateTo).toISOString()

  return query
}
