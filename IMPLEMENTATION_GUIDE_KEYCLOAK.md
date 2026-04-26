# Implementation Guide — Simplified KeyCloak (Track A)

## 1) Overview

This implementation delivers the mandatory IAM scope from `Doc/KeyCloak.docx`:

- Login
- Dashboard
- User Management
- User Invitation
- Organization Management
- Global Authentication Settings
- Global MFA Settings

Delivered scope is intentionally demo-first and reviewer-runnable from a clean clone with SQLite.
Track B (Wazuh SOC) is deferred.
Track A implementation decisions are explicit: database = SQLite, authentication = JWT.

### Delivered vs deferred

Delivered:
- Full Track A API and UI flows for the listed modules
- Idempotent migrations and seeds
- Role-based admin controls for administrative endpoints
- Step-by-step validation evidence in `STEP_LOG.md`

Deferred:
- Track B modules
- Production hardening items (detailed in section 6)

---

## 2) Architecture

### Backend architecture

Layering:
- `routes` -> `controller` -> `service` -> `db`

Request pipeline order (`backend/src/app.ts`):
1. `cors`
2. `requestLogger`
3. `express.json`
4. route mount (`routes/index.ts`)
5. `notFound`
6. `errorHandler`

Core backend details:
- Knex + SQLite (`better-sqlite3`)
- Runtime and migration connections both enable `PRAGMA foreign_keys = ON`
- JWT auth with validated `JWT_SECRET` and parsed/validated `JWT_EXPIRES_IN`
- Admin-only modules are enforced server-side with `authenticate + requireRole('admin')`

### Frontend architecture

Layering:
- `router` -> `ProtectedRoute` -> `AppLayout` -> module page -> feature API client -> shared `services/api.ts`

Core frontend details:
- Route protection is token-based via auth context
- API calls use Axios wrapper from `frontend/src/services/api.ts`
- Vite dev proxy maps `/api/*` to backend `/*` (rewrite removes `/api` prefix)

---

## 3) Setup

## Prerequisites

- Node.js 20+
- npm 10+

### Backend setup

```bash
cd backend
npm install
cp .env.example .env
npm run migrate
npm run seed
npm run dev
```

Required env vars (`backend/.env.example`):
- `PORT` (default `4000`)
- `NODE_ENV` (default `development`)
- `JWT_SECRET` (local placeholder value works for dev; replace for non-local environments)
- `JWT_EXPIRES_IN` (for example `8h`, validated at startup)
- `DB_PATH` (default `./data/dev.sqlite`)
- `SEED_ADMIN_PASSWORD` (default `ChangeMe123!`)

Startup validation note:
- `JWT_EXPIRES_IN` is parsed and validated at startup; invalid values fail fast.

### Frontend setup

```bash
cd frontend
npm install
cp .env.example .env
npm run dev -- --host 127.0.0.1 --port 5173
```

Env behavior (`frontend/.env.example`):
- `VITE_API_BASE_URL=` empty in dev, so frontend uses `/api/*`
- Vite proxy forwards `/api/*` to `http://localhost:4000/*`
- API client behavior is `import.meta.env.VITE_API_BASE_URL || '/api'` (`frontend/src/services/api.ts`)

### Reset utility

For repeated local verification runs:

```bash
cd backend
npm run reset:test-data
npm run seed
```

Reset note:
- `reset:test-data` is destructive and clears invitations/org assignments/organizations, removes non-system users except seed admin, and restores settings baseline (`passkeys=false`, `password=true`, all MFA toggles `false`).
- On a fresh checkout, initialize schema/data first with `npm run migrate` and `npm run seed` before using reset.

---

## 4) Module Explanation

## Auth

Backend routes:
- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/me`
- `GET /auth-check` (admin-only probe)

Key behaviors:
- Identifier normalization (`NFKC + trim + lowercase`) for email/username matching
- Unknown-user timing equalizer via dummy bcrypt compare
- Inactive user auth collapses to same `401 Invalid credentials` bucket
- Token payload includes user id/email/role with validated expiry

Frontend routes/UI:
- `/login`
- Login form posts to `/api/auth/login` and persists JWT in auth context

## Users

Backend routes (admin-only):
- `GET /users`
- `GET /users/:id`
- `POST /users`
- `PATCH /users/:id`
- `DELETE /users/:id`
- `POST /users/:id/activate`
- `POST /users/:id/deactivate`
- `POST /users/:id/reset-password`

Key behaviors:
- Write-side normalization for `email` and `username`
- `username` policy: `[A-Za-z0-9._-]+`
- Idempotent and explicit phone clear semantics (`null` clears)
- Guardrails: self-delete/deactivate/demotion blocked; self reset blocked
- System users (`is_system=true`) protected from sensitive mutation/deletion
- At least one active admin must remain

Frontend routes/UI:
- `/users` (list + create)
- `/users/:id` (detail/edit/activate/deactivate/delete/reset-password)

## Invitations

Backend routes (admin-only):
- `GET /invitations`
- `POST /invitations`
- `POST /invitations/:id/revoke`

Key behaviors:
- Batch create accepts multiple emails
- Per-item result status: `created | duplicate | invalid`
- `400` reserved for all-invalid batch
- Duplicate-safe behavior with request dedupe + DB partial unique index
- List query rejects array query params

Frontend routes/UI:
- `/invite` with batch input, organization selection, results, and recent list filters

## Organizations

Backend routes (admin-only):
- `GET /organizations`
- `POST /organizations`
- `DELETE /organizations/:id`
- `GET /organizations/:id/users`
- `POST /organizations/:id/users`
- `DELETE /organizations/:id/users/:userId`

Key behaviors:
- Slug derivation from normalized name
- Slug collisions return `409` with clear message
- Delete guard reasons: `organization_has_users`, `organization_has_invitations`, `organization_has_children`, `organization_referenced`
- Assign endpoint idempotent (`201` first, `200` existing)
- Unassign endpoint idempotent (`204` including already-missing assignment/entity cases)

Frontend routes/UI:
- `/organizations` with search, create modal, delete, and assign/unassign users

## Settings

Backend routes (admin-only):
- `GET /settings`
- `PATCH /settings/auth`
- `PATCH /settings/mfa`

Key behaviors:
- Singleton row semantics (`id=1`)
- Strict patch validation (unknown keys rejected)
- Auth lockout guardrail prevents disabling all primary auth methods
- `delete_password_on_passkey` is coerced to `false` when `passkeys=false`
- Compare-and-swap update strategy with bounded retries
- Concurrent update conflict returns `409` with `details.reason=settings_conflict`

Frontend routes/UI:
- `/settings/auth`
- `/settings/mfa`

## Dashboard

Frontend route:
- `/`

Behavior:
- Navigation hub for module routes
- Search shell in A4 later wired to users query in A5

## Login UI

Frontend route:
- `/login`

Behavior:
- Username/email + password form
- Error mapping by HTTP status
- Placeholder sign-up and Google actions kept non-functional

## User Management UI

Frontend routes:
- `/users`
- `/users/:id`

Behavior:
- List/search/create on main page
- Details page with edit and lifecycle actions
- Organization assignment section integrated in user details

## Invite UI

Frontend route:
- `/invite`

Behavior:
- Multi-email textarea parser (comma/newline/semicolon/whitespace)
- Summary + per-email result list
- Recent invitations with filters

## Organizations UI

Frontend route:
- `/organizations`

Behavior:
- Search/list/selection
- Create modal with optional parent
- User assignment and unassignment controls

## Global Settings UI

Frontend routes:
- `/settings/auth`
- `/settings/mfa`

Behavior:
- Toggle cards with optimistic updates + refetch
- Conflict and validation errors surfaced with localized messages

---

## 5) Assumptions and Limitations

- Flat-org-first approach; optional parent support exists, hierarchy UX is minimal.
- Password reset is simulated and returns temporary password directly.
- Global settings policy is persisted but not enforced in `/auth/login` yet.
- Admin-only policy is applied broadly across management APIs.
- Demo users are role `user`; admin management APIs/pages are intentionally unavailable to them.
- No real email delivery for invitations or reset flows.
- CORS policy remains dev-friendly for local execution.
- German labels follow screenshot language; some source screenshot typos are intentionally preserved.
- A2 deferred branding item was closed in A9 by setting frontend shell metadata (`frontend/index.html`: `lang=\"de\"`, title `Belzir IAM`).

---

## 6) Future Improvements

- Tight production CORS allowlist
- Rate limiting and brute-force protections on `/auth/login`
- Tokenized password-reset and invitation redemption flows
- Expanded role/permission matrix beyond `admin|user`
- Rich organization hierarchy management UI
- Per-user MFA enrollment and policy enforcement
- Soft-delete strategy for user/org lifecycle
- Refresh-token/session rotation strategy
- Track B integration and unified reviewer runbook
- Additional UI fidelity polish where currently deferred

---

## 7) Validation Summary

Consolidated status from A1-A8 (details in `STEP_LOG.md`):

| Area | Result |
| --- | --- |
| Backend `npm run check` | Pass |
| Backend `npm run build` | Pass |
| Backend migrations/seeds | Pass (idempotent re-runs validated) |
| Frontend `npm run lint` | Pass |
| Frontend `npm run type-check` | Pass |
| Frontend `npm run build` | Pass |
| Automated tests (`npm test`) | Not available (no test scripts in current scope) |
| Required module routes | Implemented and validated through step smokes |
| Required API families | Implemented and validated through step smokes |

A8-specific deep checks also passed, including:
- lockout guardrail (`auth_methods_lockout`) returning `409` when all primary auth methods are disabled,
- concurrent settings write conflict behavior yielding one `200` and one `409` with safe persisted state.

---

## 8) Submission Checklist Mapping

| Required item (`Doc/KeyCloak.docx`) | Artifact |
| --- | --- |
| Source code | `backend/` + `frontend/` in this repo |
| README | `README.md` (repo root) |
| Implementation guide | `IMPLEMENTATION_GUIDE_KEYCLOAK.md` |
| Setup instructions | `README.md` quick start + setup sections in this guide |
| Seed data | `backend/src/db/seeds/*.ts` + commands in README |
| Screenshots/demo proof | `docs/screenshots/` + `docs/screenshots/README.md` |
