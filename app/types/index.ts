// Organization
export interface Organization {
  id: string
  name: string
  slug: string
  plan: 'free' | 'pro' | 'enterprise'
  memberCount: number
  createdAt: string
}

// User
export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  role: 'owner' | 'admin' | 'member' | 'viewer'
  organizationId: string
}

// Team
export interface Team {
  id: string
  name: string
  description: string
  memberCount: number
  projectCount: number
  activeIncidentCount: number
  onCallStatus: 'active' | 'inactive'
  members: TeamMember[]
  createdAt: string
}

export interface TeamMember {
  id: string
  userId: string
  user: User
  role: 'lead' | 'member'
  joinedAt: string
}

// Project
export interface Project {
  id: string
  name: string
  description: string
  status: 'active' | 'archived' | 'maintenance'
  serviceCount: number
  activeIncidentCount: number
  teamId: string
  team?: Team
  lastActivity: string
  createdAt: string
}

// Service
export type ServiceStatus = 'operational' | 'degraded' | 'partial_outage' | 'major_outage' | 'unknown'

export interface Service {
  id: string
  name: string
  description: string
  projectId: string
  project?: Project
  status: ServiceStatus
  uptime: number
  latency: number
  openIncidentCount: number
  lastDeployment: string
  createdAt: string
}

// Incident
export type IncidentSeverity = 'critical' | 'high' | 'medium' | 'low'
export type IncidentStatus = 'investigating' | 'identified' | 'monitoring' | 'resolved' | 'postmortem'

export interface Incident {
  id: string
  number: number
  title: string
  description: string
  severity: IncidentSeverity
  status: IncidentStatus
  serviceIds: string[]
  services?: Service[]
  teamId: string
  team?: Team
  assigneeId?: string
  assignee?: User
  createdById: string
  createdBy?: User
  createdAt: string
  updatedAt: string
  resolvedAt?: string
}

// Timeline
export interface TimelineEvent {
  id: string
  incidentId: string
  type: 'created' | 'assigned' | 'status_change' | 'severity_change' | 'comment' | 'note' | 'resolved'
  title: string
  description?: string
  userId: string
  user?: User
  createdAt: string
}

// Comment
export interface Comment {
  id: string
  incidentId: string
  body: string
  userId: string
  user?: User
  createdAt: string
  updatedAt: string
}

// Activity
export interface ActivityEvent {
  id: string
  action: string
  resourceType: 'incident' | 'project' | 'service' | 'team' | 'user' | 'organization'
  resourceId: string
  resourceLabel: string
  userId: string
  user?: User
  details?: string
  createdAt: string
}

// Notification
export interface Notification {
  id: string
  title: string
  description: string
  type: 'incident' | 'assignment' | 'mention' | 'system'
  read: boolean
  link?: string
  createdAt: string
}

// Filter types
export interface IncidentFilters {
  search: string
  severity: IncidentSeverity[]
  status: IncidentStatus[]
  serviceId: string[]
  teamId: string[]
  dateFrom: string
  dateTo: string
}

export interface PaginationState {
  page: number
  pageSize: number
  total: number
}

export interface SortState {
  column: string
  direction: 'asc' | 'desc'
}

// Command palette
export interface CommandItem {
  id: string
  label: string
  description?: string
  icon?: string
  category: 'navigation' | 'action' | 'incident' | 'project' | 'service' | 'setting'
  action: () => void
}

// Dashboard stats
export interface DashboardStats {
  activeIncidents: number
  criticalIncidents: number
  servicesAffected: number
  uptime: number
}
