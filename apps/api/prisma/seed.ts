import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const SALT_ROUNDS = 12;

async function main() {
  console.log('🌱 Starting seed...');

  // Clear existing data
  await prisma.$transaction([
    prisma.auditLog.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.incidentEvent.deleteMany(),
    prisma.incidentComment.deleteMany(),
    prisma.incidentService.deleteMany(),
    prisma.incident.deleteMany(),
    prisma.service.deleteMany(),
    prisma.project.deleteMany(),
    prisma.teamMember.deleteMany(),
    prisma.team.deleteMany(),
    prisma.organizationMember.deleteMany(),
    prisma.session.deleteMany(),
    prisma.user.deleteMany(),
    prisma.organization.deleteMany(),
  ]);

  console.log('🗑️  Cleared existing data');

  // Create organization
  const organization = await prisma.organization.create({
    data: {
      name: 'Northstar Labs',
      slug: 'northstar-labs',
      plan: 'pro',
    },
  });

  console.log('✅ Created organization: Northstar Labs');

  // Create users
  const passwordHash = await bcrypt.hash('password123', SALT_ROUNDS);
  // Demo account shown on the login page: admin@northstarlabs.io / admin
  const adminPasswordHash = await bcrypt.hash('admin', SALT_ROUNDS);

  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'admin@northstarlabs.io',
        passwordHash: adminPasswordHash,
        name: 'Mark Chen',
      },
    }),
    prisma.user.create({
      data: {
        email: 'sarah@northstarlabs.io',
        passwordHash,
        name: 'Sarah Kim',
      },
    }),
    prisma.user.create({
      data: {
        email: 'alex@northstarlabs.io',
        passwordHash,
        name: 'Alex Rivera',
      },
    }),
    prisma.user.create({
      data: {
        email: 'jordan@northstarlabs.io',
        passwordHash,
        name: 'Jordan Patel',
      },
    }),
    prisma.user.create({
      data: {
        email: 'maria@northstarlabs.io',
        passwordHash,
        name: 'Maria Santos',
      },
    }),
    prisma.user.create({
      data: {
        email: 'john@northstarlabs.io',
        passwordHash,
        name: 'John Okafor',
      },
    }),
    prisma.user.create({
      data: {
        email: 'emily@northstarlabs.io',
        passwordHash,
        name: 'Emily Zhang',
      },
    }),
    prisma.user.create({
      data: {
        email: 'david@northstarlabs.io',
        passwordHash,
        name: 'David Park',
      },
    }),
  ]);

  console.log(`✅ Created ${users.length} users`);

  // Create organization memberships
  const [mark, sarah, alex, jordan, maria, john, emily, david] = users;

  await prisma.organizationMember.createMany({
    data: [
      { organizationId: organization.id, userId: john.id, role: 'owner' },
      { organizationId: organization.id, userId: mark.id, role: 'admin' },
      { organizationId: organization.id, userId: sarah.id, role: 'admin' },
      { organizationId: organization.id, userId: alex.id, role: 'member' },
      { organizationId: organization.id, userId: jordan.id, role: 'member' },
      { organizationId: organization.id, userId: maria.id, role: 'member' },
      { organizationId: organization.id, userId: emily.id, role: 'member' },
      { organizationId: organization.id, userId: david.id, role: 'viewer' },
    ],
  });

  console.log('✅ Created organization memberships');

  // Create teams
  const teams = await Promise.all([
    prisma.team.create({
      data: {
        organizationId: organization.id,
        name: 'Platform Engineering',
        description: 'Core infrastructure and platform services',
        onCallStatus: 'active',
      },
    }),
    prisma.team.create({
      data: {
        organizationId: organization.id,
        name: 'Backend Services',
        description: 'API and backend microservices',
        onCallStatus: 'active',
      },
    }),
    prisma.team.create({
      data: {
        organizationId: organization.id,
        name: 'Frontend',
        description: 'Web and mobile client applications',
        onCallStatus: 'inactive',
      },
    }),
    prisma.team.create({
      data: {
        organizationId: organization.id,
        name: 'Data Engineering',
        description: 'Data pipelines, analytics, and ML infrastructure',
        onCallStatus: 'inactive',
      },
    }),
  ]);

  console.log(`✅ Created ${teams.length} teams`);

  const [platformTeam, backendTeam, frontendTeam, dataTeam] = teams;

  // Create team members
  await prisma.teamMember.createMany({
    data: [
      // Platform Engineering
      { teamId: platformTeam.id, userId: john.id, role: 'lead' },
      { teamId: platformTeam.id, userId: mark.id, role: 'member' },
      { teamId: platformTeam.id, userId: alex.id, role: 'member' },
      { teamId: platformTeam.id, userId: jordan.id, role: 'member' },
      { teamId: platformTeam.id, userId: emily.id, role: 'member' },
      { teamId: platformTeam.id, userId: david.id, role: 'member' },
      // Backend Services
      { teamId: backendTeam.id, userId: sarah.id, role: 'lead' },
      { teamId: backendTeam.id, userId: maria.id, role: 'member' },
      { teamId: backendTeam.id, userId: alex.id, role: 'member' },
      { teamId: backendTeam.id, userId: mark.id, role: 'member' },
      { teamId: backendTeam.id, userId: emily.id, role: 'member' },
      // Frontend
      { teamId: frontendTeam.id, userId: jordan.id, role: 'lead' },
      { teamId: frontendTeam.id, userId: maria.id, role: 'member' },
      { teamId: frontendTeam.id, userId: emily.id, role: 'member' },
      { teamId: frontendTeam.id, userId: david.id, role: 'member' },
      // Data Engineering
      { teamId: dataTeam.id, userId: sarah.id, role: 'lead' },
      { teamId: dataTeam.id, userId: maria.id, role: 'member' },
      { teamId: dataTeam.id, userId: mark.id, role: 'member' },
    ],
  });

  console.log('✅ Created team memberships');

  // Create projects
  const projects = await Promise.all([
    prisma.project.create({
      data: {
        organizationId: organization.id,
        teamId: backendTeam.id,
        name: 'Payments Platform',
        description: 'Payment processing, billing, and subscription management',
        status: 'active',
      },
    }),
    prisma.project.create({
      data: {
        organizationId: organization.id,
        teamId: platformTeam.id,
        name: 'Customer Identity',
        description: 'Authentication, authorization, and user management',
        status: 'active',
      },
    }),
    prisma.project.create({
      data: {
        organizationId: organization.id,
        teamId: dataTeam.id,
        name: 'Analytics Platform',
        description: 'Real-time analytics, dashboards, and reporting',
        status: 'active',
      },
    }),
    prisma.project.create({
      data: {
        organizationId: organization.id,
        teamId: frontendTeam.id,
        name: 'Customer Portal',
        description: 'Self-service portal for customer account management',
        status: 'active',
      },
    }),
    prisma.project.create({
      data: {
        organizationId: organization.id,
        teamId: backendTeam.id,
        name: 'Notification Service',
        description: 'Multi-channel notification delivery system',
        status: 'active',
      },
    }),
    prisma.project.create({
      data: {
        organizationId: organization.id,
        teamId: platformTeam.id,
        name: 'Infrastructure Core',
        description: 'Core infrastructure services and deployment pipelines',
        status: 'maintenance',
      },
    }),
  ]);

  console.log(`✅ Created ${projects.length} projects`);

  const [paymentsProject, identityProject, analyticsProject, portalProject, notificationProject, infraProject] = projects;

  // Create services
  const services = await Promise.all([
    prisma.service.create({
      data: {
        organizationId: organization.id,
        projectId: paymentsProject.id,
        name: 'Payment API',
        description: 'Core payment processing endpoint',
        status: 'degraded',
        uptime: 99.87,
        latency: 342,
        lastDeployment: new Date('2026-09-20T06:15:00Z'),
      },
    }),
    prisma.service.create({
      data: {
        organizationId: organization.id,
        projectId: paymentsProject.id,
        name: 'Billing Service',
        description: 'Subscription and billing management',
        status: 'operational',
        uptime: 99.99,
        latency: 89,
        lastDeployment: new Date('2026-09-18T14:30:00Z'),
      },
    }),
    prisma.service.create({
      data: {
        organizationId: organization.id,
        projectId: identityProject.id,
        name: 'Authentication API',
        description: 'OAuth2 and session management',
        status: 'degraded',
        uptime: 99.72,
        latency: 156,
        lastDeployment: new Date('2026-09-19T22:00:00Z'),
      },
    }),
    prisma.service.create({
      data: {
        organizationId: organization.id,
        projectId: identityProject.id,
        name: 'User Service',
        description: 'User profile and account management',
        status: 'operational',
        uptime: 99.98,
        latency: 45,
        lastDeployment: new Date('2026-09-17T10:45:00Z'),
      },
    }),
    prisma.service.create({
      data: {
        organizationId: organization.id,
        projectId: analyticsProject.id,
        name: 'Analytics Engine',
        description: 'Real-time data processing pipeline',
        status: 'operational',
        uptime: 99.95,
        latency: 210,
        lastDeployment: new Date('2026-09-19T08:00:00Z'),
      },
    }),
    prisma.service.create({
      data: {
        organizationId: organization.id,
        projectId: analyticsProject.id,
        name: 'Dashboard API',
        description: 'Dashboard data aggregation service',
        status: 'operational',
        uptime: 99.91,
        latency: 125,
        lastDeployment: new Date('2026-09-18T16:20:00Z'),
      },
    }),
    prisma.service.create({
      data: {
        organizationId: organization.id,
        projectId: portalProject.id,
        name: 'Customer Portal Web',
        description: 'Frontend web application',
        status: 'operational',
        uptime: 99.99,
        latency: 67,
        lastDeployment: new Date('2026-09-19T14:00:00Z'),
      },
    }),
    prisma.service.create({
      data: {
        organizationId: organization.id,
        projectId: notificationProject.id,
        name: 'Notification Worker',
        description: 'Background notification processing',
        status: 'partial_outage',
        uptime: 98.50,
        latency: 890,
        lastDeployment: new Date('2026-09-16T20:00:00Z'),
      },
    }),
    prisma.service.create({
      data: {
        organizationId: organization.id,
        projectId: notificationProject.id,
        name: 'Email Gateway',
        description: 'Transactional email delivery',
        status: 'operational',
        uptime: 99.96,
        latency: 230,
        lastDeployment: new Date('2026-09-15T12:00:00Z'),
      },
    }),
    prisma.service.create({
      data: {
        organizationId: organization.id,
        projectId: infraProject.id,
        name: 'CI/CD Pipeline',
        description: 'Build and deployment automation',
        status: 'operational',
        uptime: 99.80,
        latency: 0,
        lastDeployment: new Date('2026-09-17T09:00:00Z'),
      },
    }),
    prisma.service.create({
      data: {
        organizationId: organization.id,
        projectId: identityProject.id,
        name: 'Session Store',
        description: 'Redis-backed session management',
        status: 'operational',
        uptime: 99.99,
        latency: 12,
        lastDeployment: new Date('2026-09-10T08:00:00Z'),
      },
    }),
    prisma.service.create({
      data: {
        organizationId: organization.id,
        projectId: analyticsProject.id,
        name: 'Report Generator',
        description: 'Scheduled report generation and export',
        status: 'unknown',
        uptime: 0,
        latency: 0,
        lastDeployment: new Date('2026-09-12T18:00:00Z'),
      },
    }),
  ]);

  console.log(`✅ Created ${services.length} services`);

  const [paymentApi, , authApi, , , dashboardApi, , notificationWorker] = services;

  // Create incidents
  const incidents = await Promise.all([
    prisma.incident.create({
      data: {
        organizationId: organization.id,
        number: 104,
        title: 'Payment API elevated latency',
        description: 'Payment processing endpoints are experiencing latency above acceptable thresholds. P95 response times have increased from ~120ms to ~340ms.',
        severity: 'high',
        status: 'monitoring',
        teamId: backendTeam.id,
        assigneeId: alex.id,
        createdById: sarah.id,
      },
    }),
    prisma.incident.create({
      data: {
        organizationId: organization.id,
        number: 103,
        title: 'Authentication service intermittent failures',
        description: 'Users experiencing intermittent 401 errors during login. Approximately 3% of login attempts are failing.',
        severity: 'critical',
        status: 'investigating',
        teamId: platformTeam.id,
        assigneeId: mark.id,
        createdById: john.id,
      },
    }),
    prisma.incident.create({
      data: {
        organizationId: organization.id,
        number: 102,
        title: 'Notification worker queue backlog',
        description: 'Email notification delivery delayed by 15-20 minutes. Queue depth has grown to 12,000 messages.',
        severity: 'medium',
        status: 'identified',
        teamId: backendTeam.id,
        assigneeId: maria.id,
        createdById: mark.id,
      },
    }),
    prisma.incident.create({
      data: {
        organizationId: organization.id,
        number: 101,
        title: 'Dashboard API timeout errors',
        description: 'Dashboard data aggregation endpoints returning 504 errors for large accounts.',
        severity: 'medium',
        status: 'resolved',
        teamId: dataTeam.id,
        assigneeId: sarah.id,
        createdById: jordan.id,
        resolvedAt: new Date('2026-09-18T14:30:00Z'),
      },
    }),
  ]);

  console.log(`✅ Created ${incidents.length} incidents`);

  const [inc104, inc103] = incidents;

  // Link incidents to services
  await prisma.incidentService.createMany({
    data: [
      { incidentId: inc104.id, serviceId: paymentApi.id },
      { incidentId: inc103.id, serviceId: authApi.id },
    ],
  });

  console.log('✅ Linked incidents to services');

  // Create incident events
  await prisma.incidentEvent.createMany({
    data: [
      {
        incidentId: inc104.id,
        userId: sarah.id,
        type: 'created',
        title: 'Incident created',
        description: 'Payment API latency exceeded threshold',
      },
      {
        incidentId: inc104.id,
        userId: sarah.id,
        type: 'assigned',
        title: 'Alex assigned as responder',
      },
      {
        incidentId: inc104.id,
        userId: alex.id,
        type: 'note',
        title: 'Payment API latency increased',
        description: 'P95 latency at 342ms, up from baseline of 120ms.',
      },
      {
        incidentId: inc104.id,
        userId: alex.id,
        type: 'status_change',
        title: 'Status changed to Investigating',
      },
      {
        incidentId: inc103.id,
        userId: john.id,
        type: 'created',
        title: 'Incident created',
        description: 'Authentication failures detected',
      },
      {
        incidentId: inc103.id,
        userId: john.id,
        type: 'assigned',
        title: 'Mark assigned as responder',
      },
    ],
  });

  console.log('✅ Created incident events');

  // Create incident comments
  await prisma.incidentComment.createMany({
    data: [
      {
        incidentId: inc104.id,
        userId: sarah.id,
        body: 'Seeing elevated error rates on the checkout flow. Customers are reporting timeouts.',
      },
      {
        incidentId: inc104.id,
        userId: alex.id,
        body: 'Confirmed. The new batch query in the payment validation step is holding connections open too long.',
      },
      {
        incidentId: inc103.id,
        userId: john.id,
        body: "We're seeing a spike in 401s from the auth service. About 3% of login attempts are failing.",
      },
    ],
  });

  console.log('✅ Created incident comments');

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📋 Test credentials:');
  console.log('   Email: admin@northstarlabs.io');
  console.log('   Password: admin');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
