import type {
  Organization,
  User,
  Team,
  Project,
  Service,
  Incident,
  TimelineEvent,
  Comment,
  ActivityEvent,
  Notification
} from '~/types'

export const currentOrganization: Organization = {
  id: 'org-1',
  name: 'Northstar Labs',
  slug: 'northstar-labs',
  plan: 'pro',
  memberCount: 24,
  createdAt: '2024-01-15T00:00:00Z'
}

export const organizations: Organization[] = [
  currentOrganization,
  {
    id: 'org-2',
    name: 'Vertex Systems',
    slug: 'vertex-systems',
    plan: 'enterprise',
    memberCount: 67,
    createdAt: '2023-08-22T00:00:00Z'
  },
  {
    id: 'org-3',
    name: 'Acme Cloud',
    slug: 'acme-cloud',
    plan: 'free',
    memberCount: 8,
    createdAt: '2025-03-10T00:00:00Z'
  }
]

export const currentUser: User = {
  id: 'user-1',
  name: 'Mark Chen',
  email: 'mark@northstarlabs.io',
  role: 'admin',
  organizationId: 'org-1'
}

export const users: User[] = [
  currentUser,
  {
    id: 'user-2',
    name: 'Sarah Kim',
    email: 'sarah@northstarlabs.io',
    role: 'admin',
    organizationId: 'org-1'
  },
  {
    id: 'user-3',
    name: 'Alex Rivera',
    email: 'alex@northstarlabs.io',
    role: 'member',
    organizationId: 'org-1'
  },
  {
    id: 'user-4',
    name: 'Jordan Patel',
    email: 'jordan@northstarlabs.io',
    role: 'member',
    organizationId: 'org-1'
  },
  {
    id: 'user-5',
    name: 'Maria Santos',
    email: 'maria@northstarlabs.io',
    role: 'member',
    organizationId: 'org-1'
  },
  {
    id: 'user-6',
    name: 'John Okafor',
    email: 'john@northstarlabs.io',
    role: 'owner',
    organizationId: 'org-1'
  },
  {
    id: 'user-7',
    name: 'Emily Zhang',
    email: 'emily@northstarlabs.io',
    role: 'member',
    organizationId: 'org-1'
  },
  {
    id: 'user-8',
    name: 'David Park',
    email: 'david@northstarlabs.io',
    role: 'viewer',
    organizationId: 'org-1'
  }
]

export const teams: Team[] = [
  {
    id: 'team-1',
    name: 'Platform Engineering',
    description: 'Core infrastructure and platform services',
    memberCount: 6,
    projectCount: 3,
    activeIncidentCount: 1,
    onCallStatus: 'active',
    members: [
      { id: 'tm-1', userId: 'user-6', user: users[5], role: 'lead', joinedAt: '2024-01-15T00:00:00Z' },
      { id: 'tm-2', userId: 'user-1', user: users[0], role: 'member', joinedAt: '2024-02-01T00:00:00Z' },
      { id: 'tm-3', userId: 'user-3', user: users[2], role: 'member', joinedAt: '2024-03-10T00:00:00Z' },
      { id: 'tm-4', userId: 'user-4', user: users[3], role: 'member', joinedAt: '2024-04-15T00:00:00Z' },
      { id: 'tm-5', userId: 'user-7', user: users[6], role: 'member', joinedAt: '2024-05-20T00:00:00Z' },
      { id: 'tm-6', userId: 'user-8', user: users[7], role: 'member', joinedAt: '2024-06-01T00:00:00Z' }
    ],
    createdAt: '2024-01-15T00:00:00Z'
  },
  {
    id: 'team-2',
    name: 'Backend Services',
    description: 'API and backend microservices',
    memberCount: 5,
    projectCount: 2,
    activeIncidentCount: 1,
    onCallStatus: 'active',
    members: [
      { id: 'tm-7', userId: 'user-2', user: users[1], role: 'lead', joinedAt: '2024-01-20T00:00:00Z' },
      { id: 'tm-8', userId: 'user-5', user: users[4], role: 'member', joinedAt: '2024-02-15T00:00:00Z' },
      { id: 'tm-9', userId: 'user-3', user: users[2], role: 'member', joinedAt: '2024-03-20T00:00:00Z' },
      { id: 'tm-10', userId: 'user-1', user: users[0], role: 'member', joinedAt: '2024-04-01T00:00:00Z' },
      { id: 'tm-11', userId: 'user-7', user: users[6], role: 'member', joinedAt: '2024-05-10T00:00:00Z' }
    ],
    createdAt: '2024-01-20T00:00:00Z'
  },
  {
    id: 'team-3',
    name: 'Frontend',
    description: 'Web and mobile client applications',
    memberCount: 4,
    projectCount: 2,
    activeIncidentCount: 0,
    onCallStatus: 'inactive',
    members: [
      { id: 'tm-12', userId: 'user-4', user: users[3], role: 'lead', joinedAt: '2024-02-01T00:00:00Z' },
      { id: 'tm-13', userId: 'user-5', user: users[4], role: 'member', joinedAt: '2024-02-15T00:00:00Z' },
      { id: 'tm-14', userId: 'user-7', user: users[6], role: 'member', joinedAt: '2024-03-01T00:00:00Z' },
      { id: 'tm-15', userId: 'user-8', user: users[7], role: 'member', joinedAt: '2024-04-10T00:00:00Z' }
    ],
    createdAt: '2024-02-01T00:00:00Z'
  },
  {
    id: 'team-4',
    name: 'Data Engineering',
    description: 'Data pipelines, analytics, and ML infrastructure',
    memberCount: 3,
    projectCount: 1,
    activeIncidentCount: 0,
    onCallStatus: 'inactive',
    members: [
      { id: 'tm-16', userId: 'user-2', user: users[1], role: 'lead', joinedAt: '2024-03-01T00:00:00Z' },
      { id: 'tm-17', userId: 'user-5', user: users[4], role: 'member', joinedAt: '2024-03-15T00:00:00Z' },
      { id: 'tm-18', userId: 'user-1', user: users[0], role: 'member', joinedAt: '2024-04-01T00:00:00Z' }
    ],
    createdAt: '2024-03-01T00:00:00Z'
  }
]

export const projects: Project[] = [
  {
    id: 'proj-1',
    name: 'Payments Platform',
    description: 'Payment processing, billing, and subscription management',
    status: 'active',
    serviceCount: 4,
    activeIncidentCount: 1,
    teamId: 'team-2',
    team: teams[1],
    lastActivity: '2026-09-20T08:31:00Z',
    createdAt: '2024-03-15T00:00:00Z'
  },
  {
    id: 'proj-2',
    name: 'Customer Identity',
    description: 'Authentication, authorization, and user management',
    status: 'active',
    serviceCount: 3,
    activeIncidentCount: 1,
    teamId: 'team-1',
    team: teams[0],
    lastActivity: '2026-09-20T09:15:00Z',
    createdAt: '2024-04-01T00:00:00Z'
  },
  {
    id: 'proj-3',
    name: 'Analytics Platform',
    description: 'Real-time analytics, dashboards, and reporting',
    status: 'active',
    serviceCount: 3,
    activeIncidentCount: 0,
    teamId: 'team-4',
    team: teams[3],
    lastActivity: '2026-09-19T16:42:00Z',
    createdAt: '2024-05-10T00:00:00Z'
  },
  {
    id: 'proj-4',
    name: 'Customer Portal',
    description: 'Self-service portal for customer account management',
    status: 'active',
    serviceCount: 2,
    activeIncidentCount: 0,
    teamId: 'team-3',
    team: teams[2],
    lastActivity: '2026-09-19T14:20:00Z',
    createdAt: '2024-06-20T00:00:00Z'
  },
  {
    id: 'proj-5',
    name: 'Notification Service',
    description: 'Multi-channel notification delivery system',
    status: 'active',
    serviceCount: 2,
    activeIncidentCount: 0,
    teamId: 'team-2',
    team: teams[1],
    lastActivity: '2026-09-18T11:30:00Z',
    createdAt: '2024-07-15T00:00:00Z'
  },
  {
    id: 'proj-6',
    name: 'Infrastructure Core',
    description: 'Core infrastructure services and deployment pipelines',
    status: 'maintenance',
    serviceCount: 5,
    activeIncidentCount: 0,
    teamId: 'team-1',
    team: teams[0],
    lastActivity: '2026-09-17T09:00:00Z',
    createdAt: '2024-01-20T00:00:00Z'
  }
]

export const services: Service[] = [
  {
    id: 'svc-1',
    name: 'Payment API',
    description: 'Core payment processing endpoint',
    projectId: 'proj-1',
    project: projects[0],
    status: 'degraded',
    uptime: 99.87,
    latency: 342,
    openIncidentCount: 1,
    lastDeployment: '2026-09-20T06:15:00Z',
    createdAt: '2024-03-15T00:00:00Z'
  },
  {
    id: 'svc-2',
    name: 'Billing Service',
    description: 'Subscription and billing management',
    projectId: 'proj-1',
    project: projects[0],
    status: 'operational',
    uptime: 99.99,
    latency: 89,
    openIncidentCount: 0,
    lastDeployment: '2026-09-18T14:30:00Z',
    createdAt: '2024-03-20T00:00:00Z'
  },
  {
    id: 'svc-3',
    name: 'Authentication API',
    description: 'OAuth2 and session management',
    projectId: 'proj-2',
    project: projects[1],
    status: 'degraded',
    uptime: 99.72,
    latency: 156,
    openIncidentCount: 1,
    lastDeployment: '2026-09-19T22:00:00Z',
    createdAt: '2024-04-01T00:00:00Z'
  },
  {
    id: 'svc-4',
    name: 'User Service',
    description: 'User profile and account management',
    projectId: 'proj-2',
    project: projects[1],
    status: 'operational',
    uptime: 99.98,
    latency: 45,
    openIncidentCount: 0,
    lastDeployment: '2026-09-17T10:45:00Z',
    createdAt: '2024-04-05T00:00:00Z'
  },
  {
    id: 'svc-5',
    name: 'Analytics Engine',
    description: 'Real-time data processing pipeline',
    projectId: 'proj-3',
    project: projects[2],
    status: 'operational',
    uptime: 99.95,
    latency: 210,
    openIncidentCount: 0,
    lastDeployment: '2026-09-19T08:00:00Z',
    createdAt: '2024-05-10T00:00:00Z'
  },
  {
    id: 'svc-6',
    name: 'Dashboard API',
    description: 'Dashboard data aggregation service',
    projectId: 'proj-3',
    project: projects[2],
    status: 'operational',
    uptime: 99.91,
    latency: 125,
    openIncidentCount: 0,
    lastDeployment: '2026-09-18T16:20:00Z',
    createdAt: '2024-05-15T00:00:00Z'
  },
  {
    id: 'svc-7',
    name: 'Customer Portal Web',
    description: 'Frontend web application',
    projectId: 'proj-4',
    project: projects[3],
    status: 'operational',
    uptime: 99.99,
    latency: 67,
    openIncidentCount: 0,
    lastDeployment: '2026-09-19T14:00:00Z',
    createdAt: '2024-06-20T00:00:00Z'
  },
  {
    id: 'svc-8',
    name: 'Notification Worker',
    description: 'Background notification processing',
    projectId: 'proj-5',
    project: projects[4],
    status: 'partial_outage',
    uptime: 98.50,
    latency: 890,
    openIncidentCount: 0,
    lastDeployment: '2026-09-16T20:00:00Z',
    createdAt: '2024-07-15T00:00:00Z'
  },
  {
    id: 'svc-9',
    name: 'Email Gateway',
    description: 'Transactional email delivery',
    projectId: 'proj-5',
    project: projects[4],
    status: 'operational',
    uptime: 99.96,
    latency: 230,
    openIncidentCount: 0,
    lastDeployment: '2026-09-15T12:00:00Z',
    createdAt: '2024-07-20T00:00:00Z'
  },
  {
    id: 'svc-10',
    name: 'CI/CD Pipeline',
    description: 'Build and deployment automation',
    projectId: 'proj-6',
    project: projects[5],
    status: 'operational',
    uptime: 99.80,
    latency: 0,
    openIncidentCount: 0,
    lastDeployment: '2026-09-17T09:00:00Z',
    createdAt: '2024-01-20T00:00:00Z'
  },
  {
    id: 'svc-11',
    name: 'Session Store',
    description: 'Redis-backed session management',
    projectId: 'proj-2',
    project: projects[1],
    status: 'operational',
    uptime: 99.99,
    latency: 12,
    openIncidentCount: 0,
    lastDeployment: '2026-09-10T08:00:00Z',
    createdAt: '2024-04-10T00:00:00Z'
  },
  {
    id: 'svc-12',
    name: 'Report Generator',
    description: 'Scheduled report generation and export',
    projectId: 'proj-3',
    project: projects[2],
    status: 'unknown',
    uptime: 0,
    latency: 0,
    openIncidentCount: 0,
    lastDeployment: '2026-09-12T18:00:00Z',
    createdAt: '2024-08-01T00:00:00Z'
  }
]

export const incidents: Incident[] = [
  {
    id: 'inc-1',
    number: 104,
    title: 'Payment API elevated latency',
    description: 'Payment processing endpoints are experiencing latency above acceptable thresholds. P95 response times have increased from ~120ms to ~340ms. Customers reporting slow checkout flows.',
    severity: 'high',
    status: 'monitoring',
    serviceIds: ['svc-1'],
    services: [services[0]],
    teamId: 'team-2',
    team: teams[1],
    assigneeId: 'user-3',
    assignee: users[2],
    createdById: 'user-2',
    createdBy: users[1],
    createdAt: '2026-09-20T09:31:00Z',
    updatedAt: '2026-09-20T10:05:00Z',
    resolvedAt: undefined
  },
  {
    id: 'inc-2',
    number: 103,
    title: 'Authentication service intermittent failures',
    description: 'Users experiencing intermittent 401 errors during login. The issue appears related to session validation timeouts. Approximately 3% of login attempts are failing.',
    severity: 'critical',
    status: 'investigating',
    serviceIds: ['svc-3'],
    services: [services[2]],
    teamId: 'team-1',
    team: teams[0],
    assigneeId: 'user-1',
    assignee: users[0],
    createdById: 'user-6',
    createdBy: users[5],
    createdAt: '2026-09-20T08:45:00Z',
    updatedAt: '2026-09-20T09:20:00Z',
    resolvedAt: undefined
  },
  {
    id: 'inc-3',
    number: 102,
    title: 'Notification worker queue backlog',
    description: 'Email notification delivery delayed by 15-20 minutes. Queue depth has grown to 12,000 messages. Worker processes are consuming excessive memory.',
    severity: 'medium',
    status: 'identified',
    serviceIds: ['svc-8'],
    services: [services[7]],
    teamId: 'team-2',
    team: teams[1],
    assigneeId: 'user-5',
    assignee: users[4],
    createdById: 'user-1',
    createdBy: users[0],
    createdAt: '2026-09-19T14:22:00Z',
    updatedAt: '2026-09-19T16:45:00Z',
    resolvedAt: undefined
  },
  {
    id: 'inc-4',
    number: 101,
    title: 'Dashboard API timeout errors',
    description: 'Dashboard data aggregation endpoints returning 504 errors for large accounts. The issue is related to unoptimized queries on accounts with >10k events.',
    severity: 'medium',
    status: 'resolved',
    serviceIds: ['svc-6'],
    services: [services[5]],
    teamId: 'team-4',
    team: teams[3],
    assigneeId: 'user-2',
    assignee: users[1],
    createdById: 'user-4',
    createdBy: users[3],
    createdAt: '2026-09-18T10:15:00Z',
    updatedAt: '2026-09-18T14:30:00Z',
    resolvedAt: '2026-09-18T14:30:00Z'
  },
  {
    id: 'inc-5',
    number: 100,
    title: 'Payment webhook delivery failures',
    description: 'Outbound webhooks for payment events failing with connection timeouts. Affected partners: Stripe, Adyen. Root cause identified as DNS resolution failure.',
    severity: 'high',
    status: 'postmortem',
    serviceIds: ['svc-1', 'svc-2'],
    services: [services[0], services[1]],
    teamId: 'team-2',
    team: teams[1],
    assigneeId: 'user-3',
    assignee: users[2],
    createdById: 'user-2',
    createdBy: users[1],
    createdAt: '2026-09-15T07:30:00Z',
    updatedAt: '2026-09-16T11:00:00Z',
    resolvedAt: '2026-09-15T09:45:00Z'
  },
  {
    id: 'inc-6',
    number: 99,
    title: 'Customer portal SSO configuration error',
    description: 'SAML SSO integration misconfigured after certificate rotation. Enterprise customers unable to authenticate via their identity providers.',
    severity: 'critical',
    status: 'resolved',
    serviceIds: ['svc-3', 'svc-7'],
    services: [services[2], services[6]],
    teamId: 'team-1',
    team: teams[0],
    assigneeId: 'user-6',
    assignee: users[5],
    createdById: 'user-4',
    createdBy: users[3],
    createdAt: '2026-09-12T16:00:00Z',
    updatedAt: '2026-09-12T18:30:00Z',
    resolvedAt: '2026-09-12T18:30:00Z'
  },
  {
    id: 'inc-7',
    number: 98,
    title: 'Analytics pipeline data duplication',
    description: 'Event deduplication logic failed after schema migration. Metrics showing inflated numbers by approximately 15%.',
    severity: 'low',
    status: 'resolved',
    serviceIds: ['svc-5'],
    services: [services[4]],
    teamId: 'team-4',
    team: teams[3],
    assigneeId: 'user-2',
    assignee: users[1],
    createdById: 'user-5',
    createdBy: users[4],
    createdAt: '2026-09-10T11:20:00Z',
    updatedAt: '2026-09-11T09:00:00Z',
    resolvedAt: '2026-09-11T09:00:00Z'
  },
  {
    id: 'inc-8',
    number: 97,
    title: 'Session store memory pressure',
    description: 'Redis session store approaching memory limits during peak traffic. Eviction rate increasing, causing unexpected logouts.',
    severity: 'high',
    status: 'resolved',
    serviceIds: ['svc-11'],
    services: [services[10]],
    teamId: 'team-1',
    team: teams[0],
    assigneeId: 'user-1',
    assignee: users[0],
    createdById: 'user-6',
    createdBy: users[5],
    createdAt: '2026-09-08T20:15:00Z',
    updatedAt: '2026-09-09T02:30:00Z',
    resolvedAt: '2026-09-09T02:30:00Z'
  }
]

export const timelineEvents: TimelineEvent[] = [
  {
    id: 'tl-1',
    incidentId: 'inc-1',
    type: 'created',
    title: 'Incident created',
    description: 'Payment API latency exceeded threshold',
    userId: 'user-2',
    user: users[1],
    createdAt: '2026-09-20T09:31:00Z'
  },
  {
    id: 'tl-2',
    incidentId: 'inc-1',
    type: 'assigned',
    title: 'Alex assigned as responder',
    userId: 'user-2',
    user: users[1],
    createdAt: '2026-09-20T09:34:00Z'
  },
  {
    id: 'tl-3',
    incidentId: 'inc-1',
    type: 'note',
    title: 'Payment API latency increased',
    description: 'P95 latency at 342ms, up from baseline of 120ms. Investigating recent deployment changes.',
    userId: 'user-3',
    user: users[2],
    createdAt: '2026-09-20T09:38:00Z'
  },
  {
    id: 'tl-4',
    incidentId: 'inc-1',
    type: 'status_change',
    title: 'Status changed to Investigating',
    userId: 'user-3',
    user: users[2],
    createdAt: '2026-09-20T09:42:00Z'
  },
  {
    id: 'tl-5',
    incidentId: 'inc-1',
    type: 'note',
    title: 'Root cause identified',
    description: 'Database connection pool exhaustion due to new query pattern introduced in v2.14.3 deployment.',
    userId: 'user-3',
    user: users[2],
    createdAt: '2026-09-20T09:50:00Z'
  },
  {
    id: 'tl-6',
    incidentId: 'inc-1',
    type: 'note',
    title: 'Mitigation deployed',
    description: 'Increased connection pool size and added query timeout. Rolling back problematic deployment.',
    userId: 'user-5',
    user: users[4],
    createdAt: '2026-09-20T09:57:00Z'
  },
  {
    id: 'tl-7',
    incidentId: 'inc-1',
    type: 'status_change',
    title: 'Status changed to Monitoring',
    description: 'Latency returning to baseline. Monitoring for recurrence.',
    userId: 'user-3',
    user: users[2],
    createdAt: '2026-09-20T10:05:00Z'
  }
]

export const comments: Comment[] = [
  {
    id: 'cmt-1',
    incidentId: 'inc-1',
    body: 'Seeing elevated error rates on the checkout flow. Customers are reporting timeouts. This looks related to the v2.14.3 deployment from 06:15.',
    userId: 'user-2',
    user: users[1],
    createdAt: '2026-09-20T09:33:00Z',
    updatedAt: '2026-09-20T09:33:00Z'
  },
  {
    id: 'cmt-2',
    incidentId: 'inc-1',
    body: 'Confirmed. The new batch query in the payment validation step is holding connections open too long. I\'m increasing the pool size as a short-term fix and will roll back the deployment.',
    userId: 'user-3',
    user: users[2],
    createdAt: '2026-09-20T09:48:00Z',
    updatedAt: '2026-09-20T09:48:00Z'
  },
  {
    id: 'cmt-3',
    incidentId: 'inc-1',
    body: 'Rollback complete. Latency is trending down. P95 now at 180ms and falling. Will keep monitoring for the next 30 minutes.',
    userId: 'user-5',
    user: users[4],
    createdAt: '2026-09-20T09:57:00Z',
    updatedAt: '2026-09-20T09:57:00Z'
  },
  {
    id: 'cmt-4',
    incidentId: 'inc-2',
    body: 'We\'re seeing a spike in 401s from the auth service. About 3% of login attempts are failing. Investigating session validation logic.',
    userId: 'user-6',
    user: users[5],
    createdAt: '2026-09-20T08:47:00Z',
    updatedAt: '2026-09-20T08:47:00Z'
  },
  {
    id: 'cmt-5',
    incidentId: 'inc-2',
    body: 'The session store is under memory pressure. Redis eviction rate has increased 4x in the last hour. This is causing session lookups to fail intermittently.',
    userId: 'user-1',
    user: users[0],
    createdAt: '2026-09-20T09:05:00Z',
    updatedAt: '2026-09-20T09:05:00Z'
  }
]

export const activityEvents: ActivityEvent[] = [
  {
    id: 'act-1',
    action: 'changed severity',
    resourceType: 'incident',
    resourceId: 'inc-2',
    resourceLabel: 'INC-103',
    userId: 'user-2',
    user: users[1],
    details: 'from Medium to Critical',
    createdAt: '2026-09-20T09:15:00Z'
  },
  {
    id: 'act-2',
    action: 'assigned',
    resourceType: 'incident',
    resourceId: 'inc-2',
    resourceLabel: 'INC-102',
    userId: 'user-1',
    user: users[0],
    details: 'to Alex Rivera',
    createdAt: '2026-09-20T09:10:00Z'
  },
  {
    id: 'act-3',
    action: 'created',
    resourceType: 'incident',
    resourceId: 'inc-1',
    resourceLabel: 'INC-104',
    userId: 'user-2',
    user: users[1],
    createdAt: '2026-09-20T09:31:00Z'
  },
  {
    id: 'act-4',
    action: 'deployed',
    resourceType: 'service',
    resourceId: 'svc-1',
    resourceLabel: 'Payment API',
    userId: 'user-3',
    user: users[2],
    details: 'v2.14.3 to production',
    createdAt: '2026-09-20T06:15:00Z'
  },
  {
    id: 'act-5',
    action: 'added',
    resourceType: 'service',
    resourceId: 'svc-12',
    resourceLabel: 'Report Generator',
    userId: 'user-2',
    user: users[1],
    details: 'to Analytics Platform',
    createdAt: '2026-09-19T16:42:00Z'
  },
  {
    id: 'act-6',
    action: 'invited',
    resourceType: 'user',
    resourceId: 'user-8',
    resourceLabel: 'David Park',
    userId: 'user-6',
    user: users[5],
    details: 'to the organization',
    createdAt: '2026-09-19T11:00:00Z'
  },
  {
    id: 'act-7',
    action: 'resolved',
    resourceType: 'incident',
    resourceId: 'inc-4',
    resourceLabel: 'INC-101',
    userId: 'user-2',
    user: users[1],
    createdAt: '2026-09-18T14:30:00Z'
  },
  {
    id: 'act-8',
    action: 'updated',
    resourceType: 'project',
    resourceId: 'proj-6',
    resourceLabel: 'Infrastructure Core',
    userId: 'user-6',
    user: users[5],
    details: 'status to maintenance',
    createdAt: '2026-09-17T09:00:00Z'
  },
  {
    id: 'act-9',
    action: 'created',
    resourceType: 'team',
    resourceId: 'team-4',
    resourceLabel: 'Data Engineering',
    userId: 'user-6',
    user: users[5],
    createdAt: '2026-09-15T10:00:00Z'
  },
  {
    id: 'act-10',
    action: 'resolved',
    resourceType: 'incident',
    resourceId: 'inc-5',
    resourceLabel: 'INC-100',
    userId: 'user-3',
    user: users[2],
    createdAt: '2026-09-15T09:45:00Z'
  },
  {
    id: 'act-11',
    action: 'changed status',
    resourceType: 'incident',
    resourceId: 'inc-5',
    resourceLabel: 'INC-100',
    userId: 'user-3',
    user: users[2],
    details: 'to Post-mortem',
    createdAt: '2026-09-16T11:00:00Z'
  },
  {
    id: 'act-12',
    action: 'deployed',
    resourceType: 'service',
    resourceId: 'svc-3',
    resourceLabel: 'Authentication API',
    userId: 'user-1',
    user: users[0],
    details: 'v3.8.1 to production',
    createdAt: '2026-09-19T22:00:00Z'
  }
]

export const notifications: Notification[] = [
  {
    id: 'notif-1',
    title: 'INC-104 created',
    description: 'Payment API elevated latency',
    type: 'incident',
    read: false,
    link: '/incidents/inc-1',
    createdAt: '2026-09-20T09:31:00Z'
  },
  {
    id: 'notif-2',
    title: 'Assigned to INC-103',
    description: 'Authentication service intermittent failures',
    type: 'assignment',
    read: false,
    link: '/incidents/inc-2',
    createdAt: '2026-09-20T08:50:00Z'
  },
  {
    id: 'notif-3',
    title: 'INC-102 status update',
    description: 'Status changed to Identified',
    type: 'incident',
    read: true,
    link: '/incidents/inc-3',
    createdAt: '2026-09-19T16:45:00Z'
  },
  {
    id: 'notif-4',
    title: 'Service alert: Notification Worker',
    description: 'Partial outage detected',
    type: 'system',
    read: true,
    link: '/services/svc-8',
    createdAt: '2026-09-19T14:00:00Z'
  },
  {
    id: 'notif-5',
    title: 'INC-101 resolved',
    description: 'Dashboard API timeout errors',
    type: 'incident',
    read: true,
    link: '/incidents/inc-4',
    createdAt: '2026-09-18T14:30:00Z'
  }
]
