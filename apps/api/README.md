# OpsFlow API

Backend API for the OpsFlow incident management platform.

## Architecture

### Modular Monolith

The API follows a modular monolith architecture where each domain module owns its:
- Routes
- Controllers
- Services
- Repositories
- Schemas
- Types

### Directory Structure

```
apps/api/src/
├── modules/
│   ├── auth/           # Authentication & sessions
│   ├── organizations/  # Multi-tenant organization management
│   ├── users/          # User management
│   ├── teams/          # Team management
│   ├── projects/       # Project management
│   ├── services/       # Service monitoring
│   ├── incidents/      # Incident management
│   ├── notifications/  # Notification system (stub)
│   └── audit/          # Audit logging (stub)
├── infrastructure/
│   ├── database/       # Prisma client & connection
│   └── logger/         # Pino logger
├── middleware/
│   ├── authenticate.ts # Session-based auth
│   ├── authorize.ts    # RBAC permissions
│   ├── validation.ts   # Zod validation
│   ├── audit.ts        # Audit logging
│   └── errorHandler.ts # Global error handling
├── config/             # Environment configuration
└── index.ts           # Express app setup
```

### Request Flow

```
Request
  ↓
Request ID (middleware/requestId.ts)
  ↓
Authentication (middleware/authenticate.ts)
  ↓
Authorization (middleware/authorize.ts)
  ↓
Validation (middleware/validation.ts)
  ↓
Controller (modules/*/controller.ts)
  ↓
Service (modules/*/service.ts)
  ↓
Repository (modules/*/repository.ts)
  ↓
PostgreSQL (via Prisma)
```

## Technology Stack

- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Validation**: Zod
- **Authentication**: Session-based (HTTP-only cookies)
- **Authorization**: Role-based access control (RBAC)
- **Logging**: Pino

## Database Schema

### Core Entities

- **Organization**: Multi-tenant organization
- **User**: Platform users
- **OrganizationMember**: User-organization membership with roles
- **Team**: Teams within organizations
- **TeamMember**: User-team membership
- **Project**: Projects within organizations
- **Service**: Services within projects
- **Incident**: Incidents with severity and status
- **IncidentService**: Many-to-many relationship
- **IncidentComment**: Comments on incidents
- **IncidentEvent**: Timeline events for incidents
- **Session**: User sessions
- **AuditLog**: Audit trail
- **ApiKey**: API keys for integrations
- **Notification**: User notifications

### Key Design Decisions

- UUIDs for all primary keys
- Consistent timestamps (createdAt, updatedAt)
- Organization isolation enforced at repository level
- Soft deletes not implemented (hard deletes with cascades)
- Indexes on foreign keys and common query patterns

## Authentication

Session-based authentication using HTTP-only secure cookies.

### Flow

1. User logs in via `POST /api/auth/login`
2. Server creates session in database
3. Session token stored in HTTP-only cookie
4. Subsequent requests include cookie automatically
5. `authenticate` middleware validates session

### Session Management

- Sessions stored in PostgreSQL
- 7-day expiration
- Refresh endpoint to extend session
- Logout invalidates session

## Authorization

Role-based access control with the following roles:

### Roles

- **owner**: Full access to all resources
- **admin**: Can manage most resources except billing
- **member**: Can create and update incidents, projects, services
- **viewer**: Read-only access

### Permissions

```typescript
incidents.read, incidents.create, incidents.update, incidents.delete
projects.read, projects.create, projects.update, projects.delete
services.read, services.manage
members.read, members.invite, members.manage
settings.manage
```

### Implementation

- `authorize()` middleware checks permissions
- Organization ID derived from session (never trusted from client)
- All queries scoped to organization

## API Endpoints

### Authentication

- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh` - Refresh session
- `GET /api/auth/me` - Get current user

### Organizations

- `GET /api/organizations/current` - Get current organization
- `GET /api/organizations` - List user's organizations
- `PATCH /api/organizations/current` - Update organization
- `GET /api/organizations/current/members` - List members

### Users

- `GET /api/users/current` - Get current user
- `PATCH /api/users/current` - Update current user
- `POST /api/users/current/password` - Change password
- `GET /api/users` - List organization users

### Teams

- `GET /api/teams` - List teams
- `POST /api/teams` - Create team
- `GET /api/teams/:id` - Get team
- `PATCH /api/teams/:id` - Update team
- `DELETE /api/teams/:id` - Delete team
- `POST /api/teams/:id/members` - Add member
- `DELETE /api/teams/:id/members/:userId` - Remove member

### Projects

- `GET /api/projects` - List projects
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get project
- `PATCH /api/projects/:id` - Update project

### Services

- `GET /api/services` - List services
- `POST /api/services` - Create service
- `GET /api/services/:id` - Get service
- `PATCH /api/services/:id` - Update service

### Incidents

- `GET /api/incidents` - List incidents (with filters)
- `POST /api/incidents` - Create incident
- `GET /api/incidents/:id` - Get incident
- `PATCH /api/incidents/:id` - Update incident
- `POST /api/incidents/:id/comments` - Add comment

### Query Parameters (Incidents)

- `page` - Page number (default: 1)
- `pageSize` - Items per page (default: 20, max: 100)
- `search` - Search in title/description
- `severity` - Filter by severity (comma-separated)
- `status` - Filter by status (comma-separated)
- `teamId` - Filter by team
- `serviceId` - Filter by service
- `assigneeId` - Filter by assignee
- `dateFrom` - Filter by date range start
- `dateTo` - Filter by date range end
- `sortBy` - Sort field (createdAt, updatedAt, severity, status)
- `sortOrder` - Sort direction (asc, desc)

## Error Handling

All errors follow a consistent format:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "email": ["Invalid email address"]
    }
  }
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `204` - No content
- `400` - Bad request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not found
- `409` - Conflict
- `422` - Validation error
- `429` - Rate limit exceeded
- `500` - Internal server error

## Security

### Implemented

- HTTP-only secure cookies for sessions
- CORS configuration
- Helmet security headers
- Rate limiting
- Input validation with Zod
- Password hashing with bcrypt (12 rounds)
- Organization isolation
- SQL injection prevention (Prisma)
- XSS prevention
- CSRF protection (same-site cookies)

### Not Yet Implemented

- Redis for session storage
- API key authentication
- Two-factor authentication
- Audit log viewer
- WebSocket real-time updates

## Development

### Setup

```bash
cd apps/api
npm install
cp .env.example .env
# Edit .env with your database URL
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

### Testing

```bash
npm test
```

### Type Checking

```bash
npm run typecheck
```

### Linting

```bash
npm run lint
```

## Environment Variables

See `.env.example` for all required variables:

- `DATABASE_URL` - PostgreSQL connection string
- `PORT` - Server port (default: 4000)
- `NODE_ENV` - Environment (development/production/test)
- `SESSION_SECRET` - Session encryption secret
- `CORS_ORIGIN` - Allowed CORS origin
- `RATE_LIMIT_WINDOW_MS` - Rate limit window
- `RATE_LIMIT_MAX_REQUESTS` - Max requests per window
- `LOG_LEVEL` - Logging level

## Seed Data

The seed script creates:

- **Organization**: Northstar Labs
- **Users**: 8 realistic users (Mark Chen, Sarah Kim, Alex Rivera, etc.)
- **Teams**: 4 teams (Platform Engineering, Backend Services, Frontend, Data Engineering)
- **Projects**: 6 projects (Payments Platform, Customer Identity, etc.)
- **Services**: 12 services with realistic statuses
- **Incidents**: 4 incidents with comments and events

Default credentials:
- Email: `admin@northstarlabs.io` (Mark Chen)
- Password: `admin`

The other seeded users (`sarah@`, `alex@`, ... `@northstarlabs.io`) use `password123`.

## Future Enhancements

### Phase 4

- Redis for caching and session storage
- BullMQ for background jobs
- WebSocket for real-time updates
- Notification delivery (email, Slack, PagerDuty)
- API key authentication
- Audit log viewer UI

### Phase 5

- AI-powered incident analysis
- Automated incident detection
- Service dependency mapping
- SLA tracking
- Custom dashboards
- Advanced reporting

## License

Proprietary - OpsFlow
