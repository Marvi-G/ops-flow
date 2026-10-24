# OpsFlow - New Chat Session Prompt

Use this prompt when starting a new chat to continue working on OpsFlow:

---

## Quick Start Prompt

```
I'm continuing work on OpsFlow, an incident management SaaS platform. 

PROJECT STATUS: Phase 3 complete (backend API fully implemented)

TECH STACK:
- Frontend: Nuxt 4, Vue 3, TypeScript, Nuxt UI, Tailwind CSS, Pinia
- Backend: Node.js, Express, TypeScript, PostgreSQL, Prisma, Zod
- Auth: Session-based with RBAC (4 roles, 16 permissions)

DEPLOYMENT:
- Backend: Render (https://render.com)
- Database: Neon PostgreSQL (https://neon.tech)
- Frontend: Netlify (https://netlify.com)

ARCHITECTURE:
- Monorepo with frontend in /app and backend in /apps/api
- Backend uses modular monolith pattern
- 14 database tables, 34 REST endpoints
- Multi-tenant with organization isolation

CURRENT STATE:
✅ Frontend: Complete UI with mock data (not yet connected to API)
✅ Backend: Full API with auth, RBAC, validation, tests
✅ Database: Prisma schema with seed data
❌ Integration: Frontend not yet connected to backend

NEXT PHASE PRIORITIES:
1. Connect frontend to backend API (replace mock data)
2. Implement notifications module
3. Implement audit/activity API endpoints
4. Add real-time features (WebSocket)

KEY FILES:
- PROJECT_CONTEXT.md - Complete architecture documentation
- app/ - Frontend code
- apps/api/ - Backend code
- apps/api/prisma/schema.prisma - Database schema
- apps/api/.env.example - Backend environment variables

TO RUN LOCALLY:
Frontend: npm install && npm run dev (port 3000)
Backend: cd apps/api && npm install && npm run db:push && npm run db:seed && npm run dev (port 4000)

TEST CREDENTIALS:
Email: mark@northstarlabs.io
Password: password123

What would you like to work on?
```

---

## Detailed Context Prompt

If you need more detailed context, use this:

```
I'm continuing development on OpsFlow, a production-grade incident management and operations platform built as a modern B2B SaaS application.

## Completed Phases

### Phase 1: Frontend Foundation ✅
- Nuxt 4 project with TypeScript
- Complete design system (teal/green primary color, warm gray neutrals)
- Application shell (sidebar, header, command palette)
- All page routes (dashboard, incidents, projects, services, teams, activity, settings)
- Dark mode support
- Responsive design
- Mock data layer

### Phase 2: Enhanced Frontend Features ✅
- URL-persisted filters for incidents
- Row selection and bulk actions
- Column visibility toggle
- Date range filtering
- Incident state transitions (investigating → identified → monitoring → resolved)
- Related incidents display
- Unsaved changes handling
- Enhanced command palette with entity search
- Dashboard activity chart

### Phase 3: Backend API ✅
- Express server with TypeScript
- PostgreSQL database with Prisma ORM
- Session-based authentication (HTTP-only cookies)
- Role-based authorization (owner, admin, member, viewer)
- 34 REST endpoints across 7 modules
- Input validation with Zod
- Comprehensive error handling
- Audit logging middleware
- Rate limiting and security headers
- Integration tests
- Seed data (8 users, 4 teams, 6 projects, 12 services, 4 incidents)

## Deployment Architecture

### Infrastructure
- **Backend:** Render (https://render.com) - Node.js web service
- **Database:** Neon PostgreSQL (https://neon.tech) - Serverless Postgres
- **Frontend:** Netlify (https://netlify.com) - Static/Jamstack hosting

### Environment Variables (Backend on Render)
```
DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require
NODE_ENV=production
PORT=10000
SESSION_SECRET=<64-char-random-string>
CORS_ORIGIN=https://opsflow.netlify.app,http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
```

### Environment Variables (Frontend on Netlify)
```
NUXT_PUBLIC_API_URL=https://opsflow-api.onrender.com
```

## Architecture

### Frontend Structure
```
app/
├── components/     # Vue components (app/, shared/, incidents/)
├── composables/    # Vue composables (useIncidents, useProjects, etc.)
├── layouts/        # Page layouts (default.vue)
├── pages/          # File-based routing
├── services/       # API client & mock data
├── stores/         # Pinia stores (app, session)
├── types/          # TypeScript interfaces
└── utils/          # Utility functions
```

### Backend Structure
```
apps/api/
├── prisma/
│   ├── schema.prisma    # 14 database models
│   └── seed.ts          # Realistic seed data
└── src/
    ├── config/          # Environment validation
    ├── infrastructure/  # Database, logger, errors
    ├── middleware/       # Auth, validation, audit
    └── modules/         # Domain modules
        ├── auth/
        ├── organizations/
        ├── users/
        ├── teams/
        ├── projects/
        ├── services/
        └── incidents/
```

## Database Schema (14 tables)

Core entities:
- organizations, users, organization_members, sessions
- teams, team_members
- projects, services
- incidents, incident_services, incident_comments, incident_events
- notifications, audit_logs, api_keys

Key features:
- UUIDs for all primary keys
- Organization isolation enforced at repository level
- Cascade deletes for referential integrity
- Comprehensive indexes

## API Endpoints (34 total)

Authentication (6): login, register, logout, refresh, me, switch-organization
Organizations (4): CRUD + members
Users (4): CRUD + password change
Teams (7): CRUD + member management
Projects (4): CRUD
Services (4): CRUD
Incidents (5): CRUD + comments (with filtering, pagination, sorting)

## Security

Implemented:
- HTTP-only secure cookies
- Password hashing (bcrypt, 12 rounds)
- CORS, Helmet, rate limiting
- Input validation (Zod)
- SQL injection prevention (Prisma)
- Organization isolation
- RBAC with 16 permissions

## Current State

Frontend: Complete UI with mock data, not yet connected to backend API
Backend: Fully functional API with tests
Database: Schema defined, seed data ready

## What's Missing

1. Frontend-backend integration (replace mock data with API calls)
2. Notifications module (schema exists, no implementation)
3. Audit/activity API endpoints (logs written but not exposed)
4. Real-time features (WebSocket)
5. Email integration
6. Password reset flow
7. Database migrations (using db:push instead)

## Next Steps

Priority 1: Connect frontend to backend
- Create API client service
- Replace mock data calls with API calls
- Add loading states and error handling
- Implement proper authentication flow

Priority 2: Complete missing modules
- Notifications (API + UI)
- Activity feed (API + UI)
- Real-time updates

Priority 3: Production readiness
- Email integration
- Password reset
- Database migrations
- Performance optimization

## How to Run

Frontend:
```bash
npm install
npm run dev
# http://localhost:3000
```

Backend:
```bash
cd apps/api
npm install
cp .env.example .env
# Edit DATABASE_URL
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
# http://localhost:4000
```

Test credentials: mark@northstarlabs.io / password123

## Documentation

Full architecture documentation: PROJECT_CONTEXT.md

What would you like to work on?
```

---

## Minimal Context Prompt

For quick context when you just need to continue a specific task:

```
Working on OpsFlow (incident management SaaS).

Stack: Nuxt 4 frontend + Express/PostgreSQL backend
Status: Phase 3 complete (backend done, frontend needs API integration)
Docs: See PROJECT_CONTEXT.md for full details

[Describe your specific task here]
```

---

## Tips for New Sessions

1. **Always reference PROJECT_CONTEXT.md** - It has complete architecture details

2. **Start with the current state** - Explain what's done and what's next

3. **Be specific about the task** - "Connect incidents page to API" is better than "continue work"

4. **Mention constraints** - "Don't modify the design" or "Keep backward compatibility"

5. **Ask for verification** - "Check if this approach aligns with the existing architecture"

6. **Request summaries** - "Summarize what we've done and what's left"

---

## Example Conversation Starters

**For API Integration:**
```
Let's connect the frontend incidents page to the backend API. 
The page is at app/pages/incidents/index.vue and uses mock data from app/services/mock-data.ts.
The backend endpoint is GET /api/incidents with filtering support.
```

**For New Features:**
```
Let's implement the notifications module. 
The database schema exists in prisma/schema.prisma.
We need: API endpoints, service logic, and frontend UI components.
```

**For Bug Fixes:**
```
There's an issue with [specific problem].
The relevant code is in [file path].
Expected behavior: [what should happen]
Actual behavior: [what's happening]
```

**For Refactoring:**
```
Let's refactor [specific area] to improve [maintainability/performance/testability].
Current approach: [how it works now]
Desired approach: [how it should work]
Constraints: [what we can't change]
```
