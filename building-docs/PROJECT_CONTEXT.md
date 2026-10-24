# OpsFlow - Complete Project Context

## Project Overview

**OpsFlow** is a production-grade incident management and operations platform built as a modern B2B SaaS application. The project demonstrates senior-level full-stack engineering with a focus on clean architecture, type safety, security, and scalability.

**Current Status:** Phase 3 Complete (Backend API fully implemented)

---

## Technology Stack

### Frontend (Phase 1-2)
- **Framework:** Nuxt 4 (Vue 3)
- **Language:** TypeScript
- **UI Library:** Nuxt UI v4
- **Styling:** Tailwind CSS v4
- **State Management:** Pinia
- **Icons:** Lucide
- **Package Manager:** npm

### Backend (Phase 3)
- **Runtime:** Node.js 20+
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** PostgreSQL (Neon)
- **ORM:** Prisma v6
- **Validation:** Zod
- **Authentication:** Session-based (HTTP-only cookies)
- **Authorization:** Role-based access control (RBAC)
- **Logging:** Pino
- **Testing:** Vitest + Supertest

### Deployment
- **Backend Hosting:** Render (https://render.com)
- **Database:** Neon PostgreSQL (https://neon.tech)
- **Frontend Hosting:** Netlify (https://netlify.com)
- **Region:** All services in same region for low latency

---

## Architecture

### Monorepo Structure
```
opsflow/
├── app/                    # Frontend (Nuxt 4)
│   ├── assets/            # CSS, images
│   ├── components/        # Vue components
│   ├── composables/       # Vue composables
│   ├── layouts/           # Page layouts
│   ├── middleware/        # Route middleware
│   ├── pages/             # File-based routing
│   ├── plugins/           # Nuxt plugins
│   ├── services/          # API client & mock data
│   ├── stores/            # Pinia stores
│   ├── types/             # TypeScript types
│   └── utils/             # Utility functions
│
└── apps/
    └── api/               # Backend (Express)
        ├── prisma/        # Database schema & migrations
        ├── src/
        │   ├── config/           # Environment config
        │   ├── infrastructure/   # Database, logger, errors
        │   ├── middleware/       # Auth, validation, etc.
        │   └── modules/          # Domain modules
        │       ├── auth/
        │       ├── organizations/
        │       ├── users/
        │       ├── teams/
        │       ├── projects/
        │       ├── services/
        │       ├── incidents/
        │       ├── notifications/ (stub)
        │       └── audit/        (stub)
        └── tests/         # Integration tests
```

### Backend Architecture: Modular Monolith

Each module follows a consistent pattern:
```
modules/{module}/
├── routes.ts         # Express routes
├── controller.ts     # Request handlers
├── service.ts        # Business logic
├── repository.ts     # Database queries
├── schemas.ts        # Zod validation schemas
└── types.ts          # TypeScript interfaces
```

### Request Flow
```
HTTP Request
    ↓
Request ID Middleware (adds X-Request-ID)
    ↓
Authentication Middleware (validates session)
    ↓
Authorization Middleware (checks permissions)
    ↓
Validation Middleware (Zod schemas)
    ↓
Controller (orchestrates request)
    ↓
Service (business logic)
    ↓
Repository (database queries via Prisma)
    ↓
PostgreSQL Database
```

---

## Design System

### Color Palette
**Primary:** Teal/Green (#147D64)
- Light: #E4F2EE
- Dark: #153A31

**Neutrals:** Warm Gray
- Light background: #F7F7F5
- Dark background: #101312

**Semantic Colors:**
- Success: #27845A
- Warning: #B7791F
- Danger: #C2413B
- Info: #3B6EA8

### Typography
- **Font:** Inter (via Google Fonts)
- **Base Size:** 14px
- **Scale:** 12px, 13px, 14px, 16px, 20px, 24px

### Border Radius
- Small: 6px (buttons, inputs)
- Medium: 8px (cards)
- Large: 12px (modals)

---

## Database Schema

### Core Entities (14 tables)

#### Organizations & Users
- `organizations` - Multi-tenant organizations
- `users` - Platform users
- `organization_members` - User-org memberships with roles
- `sessions` - Authentication sessions

#### Teams & Projects
- `teams` - Teams within organizations
- `team_members` - User-team memberships
- `projects` - Projects within organizations

#### Services & Incidents
- `services` - Monitored services
- `incidents` - Incident records
- `incident_services` - Many-to-many relationship
- `incident_comments` - Comments on incidents
- `incident_events` - Timeline events

#### Supporting
- `notifications` - User notifications
- `audit_logs` - Audit trail
- `api_keys` - API authentication (schema only)

### Key Design Decisions
- UUIDs for all primary keys
- Consistent timestamps (created_at, updated_at)
- Organization isolation enforced at repository level
- Cascade deletes for referential integrity
- Indexes on foreign keys and common query patterns

---

## Authentication & Authorization

### Authentication
- **Method:** Session-based with HTTP-only secure cookies
- **Storage:** PostgreSQL sessions table
- **Duration:** 7 days
- **Password Hashing:** bcrypt (12 rounds)
- **Cookie:** `session` (HTTP-only, secure in production, sameSite: lax)

### Authorization (RBAC)

**Roles:**
1. **Owner** - Full access, billing management
2. **Admin** - Most operations except billing
3. **Member** - Create/update incidents, projects, services
4. **Viewer** - Read-only access

**Permissions (16 total):**
```
incidents.read, incidents.create, incidents.update, incidents.delete
projects.read, projects.create, projects.update, projects.delete
services.read, services.manage
members.read, members.invite, members.manage
settings.manage
```

### Tenant Isolation
- Organization ID derived from session (never trusted from client)
- All queries scoped to organization
- Repository methods require organizationId parameter
- Cascade deletes ensure data integrity

---

## API Endpoints (34 total)

### Authentication (6)
```
POST   /api/auth/login
POST   /api/auth/register
POST   /api/auth/logout
POST   /api/auth/refresh
GET    /api/auth/me
POST   /api/auth/switch-organization
```

### Organizations (4)
```
GET    /api/organizations/current
GET    /api/organizations
PATCH  /api/organizations/current
GET    /api/organizations/current/members
```

### Users (4)
```
GET    /api/users/current
PATCH  /api/users/current
POST   /api/users/current/password
GET    /api/users
```

### Teams (7)
```
GET    /api/teams
POST   /api/teams
GET    /api/teams/:id
PATCH  /api/teams/:id
DELETE /api/teams/:id
POST   /api/teams/:id/members
DELETE /api/teams/:id/members/:userId
```

### Projects (4)
```
GET    /api/projects
POST   /api/projects
GET    /api/projects/:id
PATCH  /api/projects/:id
```

### Services (4)
```
GET    /api/services
POST   /api/services
GET    /api/services/:id
PATCH  /api/services/:id
```

### Incidents (5)
```
GET    /api/incidents          # Supports filtering, pagination, sorting
POST   /api/incidents
GET    /api/incidents/:id
PATCH  /api/incidents/:id
POST   /api/incidents/:id/comments
```

### Incident Query Parameters
```
?page=1                    # Page number
&pageSize=20               # Items per page (max 100)
&search=text               # Search title/description
&severity=critical,high    # Filter by severity
&status=investigating      # Filter by status
&teamId=uuid               # Filter by team
&serviceId=uuid            # Filter by service
&assigneeId=uuid           # Filter by assignee
&dateFrom=ISO              # Date range start
&dateTo=ISO                # Date range end
&sortBy=createdAt          # Sort field
&sortOrder=desc            # Sort direction
```

---

## Frontend Pages

### Public
- `/login` - Authentication

### Dashboard
- `/dashboard` - Operational overview

### Incidents
- `/incidents` - List with filters, search, pagination
- `/incidents/new` - Create incident form
- `/incidents/[id]` - Incident detail with timeline, comments

### Projects
- `/projects` - Project list
- `/projects/[id]` - Project detail

### Services
- `/services` - Service monitoring list
- `/services/[id]` - Service detail with uptime chart

### Teams
- `/teams` - Team list
- `/teams/[id]` - Team detail

### Activity
- `/activity` - Audit log

### Settings
- `/settings` - General settings
- `/settings/organization` - Organization details
- `/settings/members` - Member management
- `/settings/roles` - Role & permissions
- `/settings/notifications` - Notification preferences
- `/settings/api-keys` - API key management
- `/settings/appearance` - Theme settings

---

## Key Features Implemented

### Phase 1: Foundation
- ✅ Nuxt 4 project setup
- ✅ Design system (colors, typography, components)
- ✅ Application shell (sidebar, header, layout)
- ✅ Command palette (Cmd/Ctrl+K)
- ✅ Dark mode support
- ✅ Responsive design
- ✅ Mock data layer
- ✅ All page routes

### Phase 2: Enhanced Features
- ✅ URL-persisted filters (incident list)
- ✅ Row selection & bulk actions
- ✅ Column visibility toggle
- ✅ Date range filtering
- ✅ Incident state transitions
- ✅ Related incidents
- ✅ Unsaved changes handling
- ✅ Enhanced command palette with entity search
- ✅ Dashboard activity chart

### Phase 3: Backend API
- ✅ Express server with TypeScript
- ✅ PostgreSQL database with Prisma
- ✅ Session-based authentication
- ✅ Role-based authorization
- ✅ 34 REST endpoints
- ✅ Input validation (Zod)
- ✅ Error handling
- ✅ Audit logging middleware
- ✅ Rate limiting
- ✅ Security headers (Helmet)
- ✅ CORS configuration
- ✅ Integration tests
- ✅ Seed data

---

## Seed Data

### Organization
- **Name:** Northstar Labs
- **Plan:** Pro

### Users (8)
All with password: `password123`
1. Mark Chen (mark@northstarlabs.io) - Admin
2. Sarah Kim (sarah@northstarlabs.io) - Admin
3. Alex Rivera (alex@northstarlabs.io) - Member
4. Jordan Patel (jordan@northstarlabs.io) - Member
5. Maria Santos (maria@northstarlabs.io) - Member
6. John Okafor (john@northstarlabs.io) - Owner
7. Emily Zhang (emily@northstarlabs.io) - Member
8. David Park (david@northstarlabs.io) - Viewer

### Teams (4)
1. Platform Engineering (6 members, on-call: active)
2. Backend Services (5 members, on-call: active)
3. Frontend (4 members, on-call: inactive)
4. Data Engineering (3 members, on-call: inactive)

### Projects (6)
1. Payments Platform
2. Customer Identity
3. Analytics Platform
4. Customer Portal
5. Notification Service
6. Infrastructure Core

### Services (12)
- Payment API (degraded, 99.87% uptime)
- Billing Service (operational, 99.99% uptime)
- Authentication API (degraded, 99.72% uptime)
- User Service (operational, 99.98% uptime)
- Analytics Engine (operational, 99.95% uptime)
- Dashboard API (operational, 99.91% uptime)
- Customer Portal Web (operational, 99.99% uptime)
- Notification Worker (partial_outage, 98.50% uptime)
- Email Gateway (operational, 99.96% uptime)
- CI/CD Pipeline (operational, 99.80% uptime)
- Session Store (operational, 99.99% uptime)
- Report Generator (unknown, 0% uptime)

### Incidents (4)
- INC-104: Payment API elevated latency (high, monitoring)
- INC-103: Authentication service intermittent failures (critical, investigating)
- INC-102: Notification worker queue backlog (medium, identified)
- INC-101: Dashboard API timeout errors (medium, resolved)

---

## How to Run

### Prerequisites
- Node.js 20+
- PostgreSQL 14+
- npm

### Frontend Setup
```bash
cd /path/to/opsflow
npm install
npm run dev
# Opens at http://localhost:3000
```

### Backend Setup
```bash
cd apps/api
npm install

# Create .env file
cp .env.example .env
# Edit DATABASE_URL with your PostgreSQL credentials

# Generate Prisma client
npm run db:generate

# Create database schema
npm run db:push

# Seed database
npm run db:seed

# Start development server
npm run dev
# API runs at http://localhost:4000
```

### Environment Variables

**Frontend (.env):**
```
# No environment variables required for Phase 1-2
```

**Backend (apps/api/.env):**
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/opsflow"
PORT=4000
NODE_ENV=development
SESSION_SECRET="your-super-secret-session-key-change-in-production"
CORS_ORIGIN="http://localhost:3000"
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
```

### Testing
```bash
# Backend tests
cd apps/api
npm test

# Type checking
npm run typecheck

# Linting
npm run lint
```

---

## Known Issues & Limitations

### Current State
1. **No migrations directory** - Schema created via `db:push`, no migration files
2. **Empty modules** - `notifications/` and `audit/` directories exist but not implemented
3. **No activity API** - Audit logs written but no endpoint to retrieve them
4. **Frontend uses mock data** - Not yet connected to backend API
5. **No WebSocket support** - Real-time updates not implemented
6. **No email integration** - Notifications not sent
7. **No password reset flow** - Only change password when logged in
8. **No email verification** - Users can register with any email

### Technical Debt
- `pino-http` type casting with `as any` in index.ts
- Session token stored in both cookie and express-session (redundant)
- No API rate limiting per user (only global)
- No request deduplication
- No caching layer (Redis not integrated)

---

## Next Steps (Phase 4+)

### Immediate Priorities
1. **Connect frontend to backend API**
   - Replace mock data services with API calls
   - Implement API client with proper error handling
   - Add loading states and error boundaries

2. **Implement notifications module**
   - Create notification API endpoints
   - Add notification UI components
   - Implement real-time updates (WebSocket or polling)

3. **Implement audit/activity API**
   - Create endpoints to retrieve audit logs
   - Build activity feed UI
   - Add filtering and search

4. **Add database migrations**
   - Run `npm run db:migrate` to create migration files
   - Document migration strategy

### Future Enhancements
5. **Real-time features**
   - WebSocket for live incident updates
   - Real-time notifications
   - Live service status updates

6. **Email integration**
   - SendGrid/AWS SES for transactional emails
   - Email notifications for incidents
   - Password reset emails

7. **Advanced features**
   - On-call scheduling
   - Escalation policies
   - SLA tracking
   - Custom dashboards
   - Advanced reporting

8. **Infrastructure**
   - Redis for caching and sessions
   - BullMQ for background jobs
   - File storage (S3) for attachments
   - Search indexing (Elasticsearch)

9. **Security enhancements**
   - Two-factor authentication
   - API key authentication
   - SSO/SAML integration
   - Audit log viewer

10. **Performance**
    - Database query optimization
    - Caching strategies
    - CDN for static assets
    - API response compression

---

## Key Files Reference

### Frontend
```
app/
├── app.vue                          # Root component
├── app.config.ts                    # Nuxt UI configuration
├── assets/css/main.css              # Global styles & design tokens
├── components/
│   ├── app/
│   │   ├── AppSidebar.vue           # Main navigation
│   │   ├── AppHeader.vue            # Top bar
│   │   ├── CommandPalette.vue       # Cmd+K search
│   │   ├── OrganizationSwitcher.vue # Org selector
│   │   ├── UserMenu.vue             # User dropdown
│   │   └── NotificationButton.vue   # Notification bell
│   ├── shared/                      # Reusable components
│   │   ├── SeverityBadge.vue
│   │   ├── StatusBadge.vue
│   │   ├── ServiceStatusBadge.vue
│   │   ├── PageHeader.vue
│   │   ├── EmptyState.vue
│   │   └── LoadingSkeleton.vue
│   └── incidents/
│       └── IncidentStatusBadge.vue
├── composables/
│   ├── useIncidents.ts              # Incident list logic
│   ├── useIncidentFilters.ts        # URL-synced filters
│   ├── useProjects.ts
│   ├── useServices.ts
│   ├── useTeams.ts
│   └── useActivity.ts
├── layouts/
│   └── default.vue                  # Main layout with sidebar
├── pages/
│   ├── login.vue
│   ├── dashboard.vue
│   ├── incidents/
│   │   ├── index.vue                # List with filters
│   │   ├── new.vue                  # Create form
│   │   └── [id].vue                 # Detail view
│   ├── projects/
│   │   ├── index.vue
│   │   └── [id].vue
│   ├── services/
│   │   ├── index.vue
│   │   └── [id].vue
│   ├── teams/
│   │   ├── index.vue
│   │   └── [id].vue
│   ├── activity.vue
│   └── settings/
│       ├── index.vue
│       ├── organization.vue
│       ├── members.vue
│       ├── roles.vue
│       ├── notifications.vue
│       ├── api-keys.vue
│       └── appearance.vue
├── services/
│   ├── mock-data.ts                 # Mock data for all entities
│   └── repository.ts                # Data access layer
├── stores/
│   ├── app.ts                       # App state (sidebar, palette)
│   └── session.ts                   # User & organization state
├── types/
│   └── index.ts                     # All TypeScript interfaces
└── utils/
    └── index.ts                     # Utility functions
```

### Backend
```
apps/api/
├── prisma/
│   ├── schema.prisma                # Database schema (14 models)
│   └── seed.ts                      # Seed data script
├── src/
│   ├── index.ts                     # Express app setup
│   ├── config/
│   │   └── index.ts                 # Environment validation
│   ├── infrastructure/
│   │   ├── database/
│   │   │   └── index.ts             # Prisma client
│   │   ├── logger/
│   │   │   └── index.ts             # Pino logger
│   │   ├── errors.ts                # Custom error classes
│   │   └── response.ts              # Response helpers
│   ├── middleware/
│   │   ├── authenticate.ts          # Session validation
│   │   ├── authorize.ts             # Permission checks
│   │   ├── validation.ts            # Zod validation
│   │   ├── audit.ts                 # Audit logging
│   │   ├── errorHandler.ts          # Global error handler
│   │   └── requestId.ts             # Request ID generation
│   └── modules/
│       ├── auth/                    # Authentication module
│       │   ├── routes.ts
│       │   ├── controller.ts
│       │   ├── service.ts
│       │   ├── schemas.ts
│       │   └── types.ts
│       ├── organizations/           # Organization module
│       ├── users/                   # User module
│       ├── teams/                   # Team module
│       ├── projects/                # Project module
│       ├── services/                # Service module
│       ├── incidents/               # Incident module
│       │   ├── routes.ts
│       │   ├── controller.ts
│       │   ├── service.ts
│       │   ├── repository.ts        # Complex queries
│       │   └── schemas.ts
│       ├── notifications/           # (empty - stub)
│       └── audit/                   # (empty - stub)
├── tests/
│   ├── auth.test.ts                 # Auth integration tests
│   └── incidents.test.ts            # Incident integration tests
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── .env.example
```

---

## Architecture Decisions

### Why Nuxt 4?
- File-based routing
- Built-in SSR/SSG capabilities
- Excellent TypeScript support
- Nuxt UI component library
- Future-proof for SSR when needed

### Why Express over Fastify/NestJS?
- Simplicity and flexibility
- Large ecosystem
- Easy to understand for new developers
- Modular monolith pattern works well

### Why Prisma over Drizzle/TypeORM?
- Type-safe queries
- Excellent TypeScript integration
- Schema-first approach
- Great migration system
- Active development

### Why Session-based over JWT?
- Can invalidate sessions server-side
- No token storage on client
- Simpler refresh logic
- Better security for web apps

### Why Modular Monolith over Microservices?
- Easier to develop and deploy
- No network overhead
- Simpler testing
- Can extract services later if needed
- Right-sized for current scale

### Why PostgreSQL?
- Robust and reliable
- Excellent JSON support
- Great for complex queries
- Strong consistency
- Good fit for multi-tenant apps

---

## Security Measures

### Implemented
- ✅ HTTP-only secure cookies for sessions
- ✅ Password hashing (bcrypt, 12 rounds)
- ✅ CORS configuration
- ✅ Security headers (Helmet)
- ✅ Rate limiting (100 req/15min)
- ✅ Input validation (Zod)
- ✅ SQL injection prevention (Prisma)
- ✅ XSS prevention
- ✅ CSRF protection (same-site cookies)
- ✅ Organization isolation
- ✅ Role-based access control
- ✅ Request ID tracking
- ✅ Audit logging

### Not Yet Implemented
- ❌ Two-factor authentication
- ❌ API key authentication
- ❌ Email verification
- ❌ Password reset flow
- ❌ Account lockout
- ❌ IP-based rate limiting
- ❌ Request signature verification

---

## Performance Considerations

### Current Optimizations
- Database indexes on foreign keys
- Pagination on list endpoints
- Selective field loading (Prisma select)
- Eager loading for related data
- Request ID for tracing

### Future Optimizations
- Redis caching for frequent queries
- Database connection pooling
- API response compression
- CDN for static assets
- Lazy loading for frontend routes
- Virtual scrolling for large lists
- Debounced search inputs

---

## Testing Strategy

### Current Tests
- Integration tests for authentication flow
- Integration tests for incident CRUD
- Tenant isolation tests
- TypeScript type checking
- ESLint for code quality

### Future Tests
- Unit tests for services
- Unit tests for repositories
- E2E tests with Playwright
- Load testing
- Security audit

---

## Deployment Architecture

### Infrastructure Providers

#### Backend: Render (https://render.com)
- **Service Type:** Web Service
- **Runtime:** Node 20
- **Root Directory:** `apps/api`
- **Build Command:** `npm install && npx prisma generate && npm run build`
- **Start Command:** `npm start`
- **Health Check Path:** `/health`
- **Auto-Deploy:** Enabled on main branch push

#### Database: Neon PostgreSQL (https://neon.tech)
- **Type:** Serverless PostgreSQL
- **Connection:** Requires SSL (`?sslmode=require`)
- **Features:** Branching, point-in-time recovery
- **Free Tier:** 0.5 GB storage (sufficient for seed data)

#### Frontend: Netlify (https://netlify.com)
- **Build Command:** `npm run build`
- **Publish Directory:** `.output/public`
- **Environment Variables:** Set via Netlify dashboard

### Environment Variables

#### Backend (Render Dashboard)
```bash
DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require
NODE_ENV=production
PORT=10000
SESSION_SECRET=<64-char-random-string>
CORS_ORIGIN=https://opsflow.netlify.app,http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
```

#### Frontend (Netlify Dashboard)
```bash
NUXT_PUBLIC_API_URL=https://opsflow-api.onrender.com
```

### Deployment Steps

#### 1. Database Setup (Neon)
```bash
# Create project at neon.tech
# Copy connection string
cd apps/api
cp .env.example .env
# Update DATABASE_URL with Neon connection string
npm install
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts
```

#### 2. Backend Deployment (Render)
```bash
# Push code to GitHub
# Create Web Service in Render dashboard
# Set root directory: apps/api
# Set environment variables (see above)
# Deploy - Render will run build and start commands
```

#### 3. Frontend Deployment (Netlify)
```bash
# Connect GitHub repository to Netlify
# Set root directory: . (monorepo root)
# Set build command: npm run build
# Set publish directory: .output/public
# Add environment variables (see above)
# Deploy
```

### CORS Configuration

The backend accepts multiple origins via comma-separated `CORS_ORIGIN` env var:
```typescript
// apps/api/src/index.ts
cors({
  origin: config.CORS_ORIGIN.split(','),
  credentials: true
})
```

### Important Notes

1. **Render Free Tier:**
   - Service spins down after 15 min inactivity
   - First request after spin-down takes ~30 seconds
   - 750 hours/month free

2. **Neon SSL:**
   - Connection string must include `?sslmode=require`
   - Prisma handles SSL automatically

3. **Session Persistence:**
   - Sessions stored in PostgreSQL (not filesystem)
   - Survives Render service restarts

4. **Database Migrations:**
   - Use `prisma db push` for development
   - For production, generate migration files: `npx prisma migrate dev`

### Verification After Deploy

```bash
# Health check
curl https://opsflow-api.onrender.com/health

# Login test
curl -X POST https://opsflow-api.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"mark@northstarlabs.io","password":"password123"}' \
  -c cookies.txt
```

---

## Summary

OpsFlow is a production-ready incident management platform with:
- ✅ Modern, type-safe frontend (Nuxt 4 + TypeScript)
- ✅ Complete backend API (Express + PostgreSQL)
- ✅ Robust authentication and authorization
- ✅ Multi-tenant architecture
- ✅ Clean, maintainable codebase
- ✅ Comprehensive seed data
- ✅ Integration tests

**Next phase:** Connect frontend to backend API and implement missing features (notifications, activity feed, real-time updates).
