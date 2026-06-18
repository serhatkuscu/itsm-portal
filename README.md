# ITSM Portal

A production-grade **IT Service Management** platform built with ASP.NET Core 9, following Clean Architecture principles. Designed for managing support tickets, SLA tracking, user roles, and audit logging.

> Built as a portfolio project demonstrating enterprise-level backend architecture.

---

## Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| ASP.NET Core 9 Web API | REST API framework |
| Entity Framework Core 9 | ORM (code-first, no Repository Pattern) |
| PostgreSQL 16 | Primary database |
| JWT Bearer | Authentication |
| Hangfire | Background jobs / SLA monitoring |
| FluentValidation | Input validation |
| MediatR 12 | CQRS mediator |
| Serilog | Structured logging |
| BCrypt.Net | Password hashing |
| StackExchange.Redis | Caching (optional) |

### DevOps
| Technology | Purpose |
|---|---|
| Docker + Docker Compose | Containerization |
| Nginx | Reverse proxy / SSL termination |
| Ubuntu Server | Production host |

---

## Architecture

```
ItsmPortal/
├── src/
│   ├── Itsm.Domain/          # Entities, enums, business rules (no dependencies)
│   ├── Itsm.Application/     # CQRS commands/queries, Result pattern, abstractions
│   ├── Itsm.Infrastructure/  # EF Core, JWT, Hangfire, PostgreSQL, Redis
│   └── Itsm.Api/             # Controllers, middleware, Program.cs
├── docker-compose.yml
├── nginx/nginx.conf
└── Itsm.sln
```

### Key Design Decisions

- **Clean Architecture** — strict dependency rule (outer layers depend on inner, never reverse)
- **CQRS with MediatR** — commands and queries are fully separated
- **Result Pattern** — no exception-based control flow; every handler returns `Result<T>`
- **No Repository Pattern** — EF Core `DbContext` is accessed directly via `IAppDbContext` interface
- **Domain encapsulation** — entity state can only be changed through domain methods (`private set`)
- **Validation pipeline** — FluentValidation runs automatically via MediatR `IPipelineBehavior`
- **Global exception middleware** — all unhandled exceptions return RFC 7807 `ProblemDetails`

---

## Features

### Phase 1 (Current)

- **Authentication** — Register, Login, JWT Access Token, Refresh Token
- **Role-based access** — Admin, Agent, Requester
- **Ticket management** — Create, list (paginated), detail, update, assign, close/cancel
- **SLA tracking** — Due dates calculated at ticket creation based on priority
- **SLA monitoring** — Hangfire job runs every 5 minutes, detects breaches and approaching deadlines
- **Notifications** — Automatic notifications on SLA events, mark as read
- **Audit log** — Every ticket state/field change is recorded
- **Dashboard** — Open/closed counts, SLA breach count, per-agent ticket count

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
- [Docker Desktop](https://www.docker.com/products/docker-desktop)

### Local Development (without Docker)

**1. Start PostgreSQL**
```bash
docker run -d --name itsm_postgres_dev \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=itsmportal_dev \
  -p 5433:5432 \
  postgres:16-alpine
```

**2. Configure `appsettings.Development.json`**

The file is pre-configured for the container above:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5433;Database=itsmportal_dev;Username=postgres;Password=postgres"
  }
}
```

**3. Run the API**
```bash
dotnet run --project src/Itsm.Api
```

The app auto-runs migrations on startup.

**4. Open Swagger**
```
http://localhost:5157/swagger
```

---

## Docker (Production)

**1. Copy and fill environment file**
```bash
cp .env.example .env
# Edit .env with your real values
```

**2. Start all services**
```bash
docker compose up -d
```

Services started:
- `itsm_api` — ASP.NET Core API (internal port 8080)
- `itsm_postgres` — PostgreSQL 16
- `itsm_redis` — Redis 7
- `itsm_nginx` — Nginx reverse proxy (ports 80/443)

**3. API is available at**
```
http://your-server/api/
http://your-server/hangfire  ← Job dashboard
```

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
> `role`: `1` = Admin, `2` = Agent, `3` = Requester

**Login**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass1!"
}
```
Response:
```json
{
  "accessToken": "eyJhbGci...",
  "refreshToken": "base64string",
  "email": "john@example.com",
  "fullName": "John Doe",
  "role": "Requester"
}
```

### Tickets

**Create Ticket** *(requires JWT)*
```http
POST /api/tickets
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "title": "VPN connection issue",
  "description": "Cannot connect to VPN since yesterday, error code 800.",
  "priority": 3
}
```
> `priority`: `1` = Low, `2` = Medium, `3` = High, `4` = Critical

Response:
```json
{
  "ticketId": "3fa85f64-...",
  "title": "VPN connection issue",
  "dueDate": "2026-06-19T14:00:00Z"
}
```

**List Tickets** *(paginated, filtered)*
```http
GET /api/tickets?status=1&priority=3&page=1&pageSize=20
Authorization: Bearer <accessToken>
```

**Assign Ticket** *(Admin/Agent only)*
```http
POST /api/tickets/{id}/assign
Authorization: Bearer <accessToken>

{ "agentId": "agent-user-guid" }
```

**Close Ticket**
```http
POST /api/tickets/{id}/close
Authorization: Bearer <accessToken>

{ "status": 5 }
```
> `status`: `5` = Closed, `6` = Cancelled

---

## Roadmap

### Phase 2 — Comments & Attachments
- [ ] `POST /api/tickets/{id}/comments` — Add comment (internal/external)
- [ ] File attachment support
- [ ] Email notifications via SMTP

### Phase 3 — Frontend
- [ ] Next.js 15 + TypeScript + Tailwind CSS
- [ ] Ticket kanban board
- [ ] Real-time notifications via SignalR
- [ ] Role-based dashboard views

### Phase 4 — Advanced
- [ ] Refresh token rotation endpoint (`POST /api/auth/refresh`)
- [ ] SLA policy management (configurable per category)
- [ ] Ticket categories and tags
- [ ] Report export (PDF/CSV)
- [ ] Admin panel — user management endpoints
- [ ] Rate limiting
- [ ] Health check endpoints (`/health`, `/health/ready`)

---

## Project Structure (detailed)

```
src/
├── Itsm.Domain/
│   ├── Common/BaseEntity.cs
│   ├── Entities/
│   │   ├── User.cs
│   │   ├── Ticket.cs          ← SLA calculation, status transitions
│   │   ├── TicketComment.cs
│   │   ├── Notification.cs
│   │   ├── AuditLog.cs
│   │   └── RefreshToken.cs
│   └── Enums/
│       ├── TicketStatus.cs    ← Open, InProgress, WaitingCustomer, Resolved, Closed, Cancelled
│       ├── TicketPriority.cs  ← Low, Medium, High, Critical
│       └── UserRole.cs        ← Admin, Agent, Requester

├── Itsm.Application/
│   ├── Abstractions/          ← IAppDbContext, IJwtService, ICurrentUser, IPasswordHasher
│   ├── Common/                ← Result<T>, Error, ValidationBehavior (MediatR pipeline)
│   └── Features/
│       ├── Auth/Commands/     ← Register, Login (Command + Handler + Validator)
│       ├── Tickets/Commands/  ← CreateTicket, UpdateTicket, AssignTicket, CloseTicket
│       ├── Tickets/Queries/   ← GetTickets (paged), GetTicketById
│       └── Dashboard/Queries/ ← GetDashboard

├── Itsm.Infrastructure/
│   ├── Persistence/
│   │   ├── AppDbContext.cs
│   │   ├── Configurations/    ← IEntityTypeConfiguration per entity
│   │   └── Migrations/
│   ├── Services/              ← JwtService, PasswordHasher, CurrentUserService
│   ├── Jobs/                  ← SlaMonitoringJob (Hangfire, every 5 min)
│   └── DependencyInjection.cs

└── Itsm.Api/
    ├── Controllers/           ← AuthController, TicketsController, DashboardController, NotificationsController
    ├── Middleware/            ← GlobalExceptionMiddleware (ProblemDetails)
    └── Program.cs
```

---

## License

MIT
