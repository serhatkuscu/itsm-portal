# ITSM Portal

A production-grade **IT Service Management** platform built with **ASP.NET Core 9** + **Next.js 16**, following Clean Architecture principles. Covers ticket lifecycle management, SLA tracking, role-based access, audit logging, and background job monitoring.

> Built as a portfolio project demonstrating enterprise-level full-stack architecture.

---

## Screenshots

> _Screenshots are taken from local development. No live demo deployed yet._

| Login | Dashboard |
|---|---|
| ![Login page](docs/screenshots/login.png) | ![Dashboard](docs/screenshots/dashboard.png) |

| Ticket List | Ticket Detail |
|---|---|
| ![Ticket list](docs/screenshots/ticket-list.png) | ![Ticket detail](docs/screenshots/ticket-detail.png) |

---

## Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| ASP.NET Core 9 Web API | REST API framework |
| Entity Framework Core 9 | ORM (code-first migrations, no Repository Pattern) |
| PostgreSQL 16 | Primary database |
| JWT Bearer | Authentication + refresh tokens |
| Hangfire | Background jobs / SLA monitoring (every 5 min) |
| FluentValidation | Input validation via MediatR pipeline |
| MediatR 12 | CQRS mediator |
| Serilog | Structured logging |
| BCrypt.Net | Password hashing |

### Frontend
| Technology | Purpose |
|---|---|
| Next.js 16 (App Router) | React framework with Turbopack |
| TypeScript | Type safety |
| Tailwind CSS v4 | Utility-first styling |
| Fetch API | HTTP client with JWT auth |

### Infrastructure
| Technology | Purpose |
|---|---|
| Docker + Docker Compose | Containerization |
| Nginx | Reverse proxy / SSL termination |
| PostgreSQL 16-alpine | Production database |

---

## Architecture

```
ItsmPortal/
├── src/
│   ├── Itsm.Domain/          # Entities, enums, domain logic (no dependencies)
│   ├── Itsm.Application/     # CQRS commands/queries, Result pattern, abstractions
│   ├── Itsm.Infrastructure/  # EF Core, JWT, Hangfire, PostgreSQL
│   └── Itsm.Api/             # Controllers, middleware, Program.cs
├── frontend/                 # Next.js 16 App Router
│   └── src/
│       ├── app/              # Route pages (login, dashboard, tickets)
│       ├── components/       # Shared UI components
│       ├── lib/              # API client, auth utilities
│       └── types/            # TypeScript interfaces
├── docker-compose.yml
└── Itsm.sln
```

### Key Design Decisions

- **Clean Architecture** — strict dependency rule (outer layers depend on inner, never reverse)
- **CQRS with MediatR** — commands and queries fully separated; each handler tested in isolation
- **Result Pattern** — no exception-based control flow; every handler returns `Result<T>`
- **No Repository Pattern** — EF Core `DbContext` accessed directly via `IAppDbContext` interface
- **Domain encapsulation** — entity state changed only via domain methods (`private set`)
- **Validation pipeline** — FluentValidation runs automatically via `IPipelineBehavior<TRequest, TResponse>`
- **Global exception middleware** — all unhandled exceptions return RFC 7807 `ProblemDetails`

---

## Features

### Backend
- **Authentication** — Register, Login, JWT access token + refresh token, BCrypt password hashing
- **Role-based access** — Admin, Agent, Requester (enforced at controller + handler level)
- **Ticket lifecycle** — Create → InProgress → WaitingCustomer → Resolved → Closed / Cancelled
- **SLA tracking** — Due dates calculated at ticket creation based on priority (see matrix below)
- **SLA monitoring** — Hangfire job every 5 minutes detects breaches and approaching deadlines
- **Duplicate SLA warning prevention** — `SlaWarningSent` flag ensures one warning notification per ticket
- **Notifications** — Automatic notifications on SLA events; mark-as-read endpoint
- **Audit log** — Every ticket field/state change recorded with old/new values
- **Comments** — Internal (agent-only) and external comment support
- **Dashboard** — Role-scoped metrics: Admin sees all, Agent sees assigned, Requester sees own
- **Agent management** — Admin can list active agents and assign tickets

### Frontend
- **Login page** — JWT stored in `localStorage`; auto-redirect when unauthenticated
- **Dashboard** — 10 metrics (total, open, in-progress, resolved, closed, SLA breached, SLA warning sent, by-priority breakdown, by-agent counts, recent tickets); role-scoped
- **Ticket list** — Paginated, filterable by status; SLA color indicators (red = breached, orange = <1h)
- **Ticket detail** — Full metadata, comments panel, audit log panel
- **New ticket form** — Validation with field-level error display; SLA hints per priority
- **Role-based actions** — Admin: assign agent + status transitions; Agent: status transitions; Requester: close own ticket
- **Success/error feedback** — Auto-dismiss success toast (3s); backend error messages displayed inline

### SLA Matrix
| Priority | Response Time |
|---|---|
| Critical | 2 hours |
| High | 8 hours |
| Medium | 24 hours |
| Low | 72 hours |

---

## Getting Started

### Prerequisites
- [.NET 9 SDK](https://dotnet.microsoft.com/download)
- [Node.js 20+](https://nodejs.org/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop)

### 1. Start PostgreSQL

```bash
docker run -d --name itsm_postgres_dev \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=itsmportal_dev \
  -p 5433:5432 \
  postgres:16-alpine
```

### 2. Run the API

```bash
dotnet run --project src/Itsm.Api
```

Migrations run automatically on startup. API available at:
```
http://localhost:5157
http://localhost:5157/swagger
http://localhost:5157/hangfire
```

### 3. Run the Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Frontend available at `http://localhost:3000`

---

## Test Users

There is no database seed. Create users via the API:

```bash
# Admin
curl -X POST http://localhost:5157/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Admin","lastName":"User","email":"admin@itsm.local","password":"Admin1234!","role":1}'

# Agent
curl -X POST http://localhost:5157/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Support","lastName":"Agent","email":"agent@itsm.local","password":"Agent1234!","role":2}'

# Requester
curl -X POST http://localhost:5157/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Jane","lastName":"Doe","email":"jane@itsm.local","password":"User1234!","role":3}'
```

> `role`: `1` = Admin, `2` = Agent, `3` = Requester

Then login at `http://localhost:3000/login` with any of the above credentials.

---

## API Reference

### Authentication

**Register**
```http
POST /api/auth/register
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "SecurePass1!",
  "role": 3
}
```

**Login**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass1!"
}
```
```json
{
  "accessToken": "eyJhbGci...",
  "refreshToken": "base64string",
  "expiresIn": 3600
}
```

---

### Tickets

**Create** _(any authenticated user)_
```http
POST /api/tickets
Authorization: Bearer <accessToken>

{ "title": "VPN issue", "description": "...", "priority": 3 }
```
> `priority`: `1` Low · `2` Medium · `3` High · `4` Critical

**List** _(paginated, role-scoped)_
```http
GET /api/tickets?status=1&priority=3&page=1&pageSize=20
Authorization: Bearer <accessToken>
```

**Detail**
```http
GET /api/tickets/{id}
Authorization: Bearer <accessToken>
```

**Assign** _(Admin/Agent)_
```http
POST /api/tickets/{id}/assign
Authorization: Bearer <accessToken>

{ "agentId": "agent-user-guid" }
```

**Change Status** _(Admin/Agent — non-terminal statuses only)_
```http
POST /api/tickets/{id}/status
Authorization: Bearer <accessToken>

{ "status": 2 }
```
> `status`: `2` InProgress · `3` WaitingCustomer · `4` Resolved

**Close / Cancel** _(Admin/Agent/Requester — Requester: own ticket only)_
```http
POST /api/tickets/{id}/close
Authorization: Bearer <accessToken>

{ "status": 5 }
```
> `status`: `5` Closed · `6` Cancelled

---

### Users

**List Agents** _(Admin only)_
```http
GET /api/users/agents
Authorization: Bearer <accessToken>
```

---

### Dashboard

**Get Metrics** _(all authenticated roles — response is role-scoped)_
```http
GET /api/dashboard
Authorization: Bearer <accessToken>
```

---

### Notifications

```http
GET  /api/notifications          # List unread notifications
POST /api/notifications/{id}/read  # Mark as read
```

---

## Docker (Production)

**1. Copy and fill environment file**
```bash
cp .env.example .env
# Edit .env with production values
```

**2. Start all services**
```bash
docker compose up -d
```

Services:
- `itsm_api` — ASP.NET Core 9 API
- `itsm_postgres` — PostgreSQL 16
- `itsm_redis` — Redis 7
- `itsm_nginx` — Nginx reverse proxy (ports 80/443)

---

## Security Notes

| File | Status | Why |
|---|---|---|
| `appsettings.json` | ✅ Safe to commit | Dev defaults only; JWT key is a placeholder |
| `appsettings.Development.json` | ✅ Safe to commit | Local dev PostgreSQL credentials |
| `appsettings.Production.json` | 🚫 Git-ignored | Never committed |
| `.env` | 🚫 Git-ignored | Production secrets (DB password, JWT key) |
| `frontend/.env.local` | 🚫 Git-ignored | Local frontend config |

> Production secrets are passed via environment variables in `docker-compose.yml` using `${VAR}` substitution from `.env`. The `.env` file is in `.gitignore`.

---

## Project Structure

```
src/
├── Itsm.Domain/
│   ├── Common/           # BaseEntity (Id, CreatedAt, UpdatedAt)
│   ├── Entities/         # User, Ticket, TicketComment, Notification, AuditLog, RefreshToken
│   └── Enums/            # TicketStatus, TicketPriority, UserRole

├── Itsm.Application/
│   ├── Abstractions/     # IAppDbContext, IJwtService, ICurrentUser, IPasswordHasher
│   ├── Common/           # Result<T>, Error, ValidationBehavior
│   └── Features/
│       ├── Auth/         # Register, Login (Command + Handler + Validator)
│       ├── Tickets/      # CreateTicket, AssignTicket, ChangeStatus, CloseTicket, GetTickets, GetTicketById
│       ├── Dashboard/    # GetDashboard (role-scoped)
│       └── Notifications/# GetNotifications, MarkNotificationRead

├── Itsm.Infrastructure/
│   ├── Persistence/      # AppDbContext, Migrations, EF Configurations
│   ├── Services/         # JwtService, PasswordHasher, CurrentUserService
│   ├── Jobs/             # SlaMonitoringJob (Hangfire, every 5 min)
│   └── DependencyInjection.cs

└── Itsm.Api/
    ├── Controllers/      # Auth, Tickets, Users, Dashboard, Notifications
    ├── Middleware/        # GlobalExceptionMiddleware (ProblemDetails)
    └── Program.cs

frontend/src/
├── app/
│   ├── login/            # Login page
│   ├── dashboard/        # Dashboard with metric cards
│   └── tickets/
│       ├── page.tsx      # Paginated ticket list
│       ├── new/          # New ticket form
│       └── [id]/         # Ticket detail + role-based actions
├── components/
│   └── Badge.tsx         # StatusBadge, PriorityBadge
├── lib/
│   ├── api-client.ts     # Fetch wrapper with JWT; ApiError class
│   └── auth.ts           # Token storage, JWT decode, getUserInfo()
└── types/index.ts        # All TypeScript interfaces
```

---

## Roadmap

### Done
- [x] Clean Architecture backend (Domain / Application / Infrastructure / Api)
- [x] JWT authentication + refresh tokens
- [x] Role-based access (Admin, Agent, Requester)
- [x] Full ticket lifecycle (Open → InProgress → WaitingCustomer → Resolved → Closed)
- [x] SLA tracking + Hangfire monitoring job
- [x] Duplicate SLA warning prevention (`SlaWarningSent` flag)
- [x] Notifications system
- [x] Audit log (every field/state change)
- [x] Role-scoped dashboard (10 metrics)
- [x] Next.js 16 frontend (login, dashboard, ticket list, ticket detail, new ticket)
- [x] Role-based action buttons on ticket detail

### Planned
- [ ] Refresh token rotation endpoint (`POST /api/auth/refresh`)
- [ ] Comments POST endpoint (`POST /api/tickets/{id}/comments`)
- [ ] File attachment support
- [ ] Email notifications via SMTP
- [ ] Ticket categories and tags
- [ ] SLA policy management (configurable per category)
- [ ] Report export (PDF / CSV)
- [ ] Health check endpoints (`/health`, `/health/ready`)
- [ ] Rate limiting
- [ ] Real-time notifications via SignalR

---

## License

MIT
