# A Personal Coding Challenge (Track A + Track B)

This repository contains both challenge tracks:
- Track A: Simplified KeyCloak IAM (`Doc/KeyCloak.docx`)
- Track B: Wazuh SOC (`Doc/Wazuh_SOC.pdf`)

## Track B (Wazuh SOC) — Scope and B5 Status

- Authoritative source: `Doc/Wazuh_SOC.pdf`
- Mandatory modules only: `Triage`, `Incidents`
- Optional module: `Detection` (deferred; execute only after mandatory Track B scope is complete and stable)
- Locked stack for Track B:
  - Backend: Node.js + TypeScript
  - Frontend: React + TypeScript + Vite
  - Database: SQLite via Knex
  - API: REST
  - Data mode: mock/seed data (inline TS seed objects or JSON files; no live Wazuh integration in mandatory scope)
- Isolation rule:
  - Track B will be implemented in `backend-soc/` and `frontend-soc/`
  - Track B will use a separate SQLite DB file
  - No shared models/routes/tables with Track A unless intentionally approved as platform code
- Localization default for Track B UI: English (revisit only if reviewer explicitly requests German)
- Implementation status:
  - B0 scope lock complete
  - B1 data layer complete in `backend-soc/`
  - B2 triage module complete (`backend-soc` API + `frontend-soc` UI)
  - B3 incidents module complete (`backend-soc` API + `frontend-soc` UI)
  - B5 documentation + validation gate complete

### Run Track B (B5 baseline)

```bash
cd backend-soc
npm install
cp .env.example .env
npm run migrate
npm run seed
npm run dev
```

Backend URL: `http://localhost:4100`

```bash
cd frontend-soc
npm install
cp .env.example .env
npm run dev -- --host 127.0.0.1 --port 5174
```

Frontend URL: `http://127.0.0.1:5174`

Optional baseline restore after mutation smoke:

```bash
cd backend-soc
npm run reset:test-data
```

Track B demo path:
- open `/triage`
- filter by severity/status, sort by timestamp or severity
- open one alert detail (`/triage/:id`)
- apply `true_positive`, `false_positive`, `ignore`, `escalate` decisions
- open `/incidents`
- create one incident, open incident detail (`/incidents/:id`)
- link a seeded alert and add a comment
- update incident title/severity/status and confirm timeline entries

Track B note: this is a demo-mode SOC slice without auth; triage/comment actor fields are client-provided.

Track B data/reset contracts are documented in `backend-soc/README.md`.
Track B implementation guide is documented in `IMPLEMENTATION_GUIDE_WAZUH.md`.
Track B screenshot artifacts are indexed in `docs/screenshots/README.md`.

## Architecture Summary

- Backend: Node.js + TypeScript + Express + Knex + SQLite (`better-sqlite3`)
- Frontend: React + TypeScript + Vite
- Auth: JWT bearer tokens
- API style: REST
- Dev proxy: frontend `/api/*` rewrites to backend `/*`
- Database choice (Track A): SQLite
- Auth choice (Track A): JWT

## Repository Layout

- `backend/`: backend app, migrations, seeds, API implementation
- `frontend/`: frontend app, routes, UI modules
- `Doc/`: challenge source files and reference screenshots
- `docs/screenshots/`: submission screenshot artifacts
- `STEP_LOG.md`: per-step execution and validation log
- `AGENT_EXECUTION_PLAN.md`: step checklist and acceptance criteria
- `IMPLEMENTATION_GUIDE_KEYCLOAK.md`: detailed implementation guide
- `IMPLEMENTATION_GUIDE_WAZUH.md`: detailed implementation guide

## Prerequisites

- Node.js 20+
- npm 10+

## Quick Start

### 1) Backend

```bash
cd backend
npm install
cp .env.example .env
npm run migrate
npm run seed
npm run dev
```

Backend URL: `http://localhost:4000`

### 2) Frontend (new terminal)

```bash
cd frontend
npm install
cp .env.example .env
npm run dev -- --host 127.0.0.1 --port 5173
```

Frontend URL: `http://127.0.0.1:5173`

Proxy behavior in development:
- frontend calls `/api/*`
- Vite rewrites `/api/*` to backend `/*`
- example: `/api/auth/login` -> `http://localhost:4000/auth/login`
- frontend API client base URL is `import.meta.env.VITE_API_BASE_URL || '/api'` (`frontend/src/services/api.ts`)
- because `frontend/.env.example` leaves `VITE_API_BASE_URL` empty, `/api` is used by default in dev

## Seed Credentials and Demo Data

### Admin (default)

- Email: `admin@example.com`
- Username: `admin`
- Password: value of `SEED_ADMIN_PASSWORD` in `backend/.env`
- Default password from `backend/.env.example`: `ChangeMe123!`

### Demo users

Seeded in `backend/src/db/seeds/02_demo_users.ts`:

- `max@example.com` / username `max` / password `DemoUser123!`
- `erika@example.com` / username `erika` / password `DemoUser123!`
- `hans@example.com` / username `hans` / password `DemoUser123!`

Demo organizations from `03_demo_orgs.ts`: `Kunden`, `Partner`, `Intern`

Important: demo users are seeded with role `user`. Admin-only APIs and screens (`/users`, `/invitations`, `/organizations`, `/settings`) require the admin account and return `403` for demo users.

## Security Note

- `backend/.env.example` uses `JWT_SECRET=replace_me_in_production` as a local-development placeholder.
- Replace `JWT_SECRET` with a strong random value for any shared, staging, or production environment.

## Scripts

### Backend (`backend/package.json`)

| Script | Purpose |
| --- | --- |
| `npm run dev` | Run backend in watch mode |
| `npm run check` | Type-check backend |
| `npm run build` | Compile backend |
| `npm run start` | Run compiled backend |
| `npm run migrate` | Apply migrations |
| `npm run seed` | Run idempotent seeds |
| `npm run reset:test-data` | Destructive local reset: clears org/invite assignments, removes non-system users (except seed admin), and restores auth/MFA settings defaults |

Reset sequencing note: on a fresh checkout, run `npm run migrate` and `npm run seed` first; use `npm run reset:test-data` only after schema initialization.

### Frontend (`frontend/package.json`)

| Script | Purpose |
| --- | --- |
| `npm run dev` | Run Vite dev server |
| `npm run lint` | Lint frontend |
| `npm run type-check` | Type-check frontend |
| `npm run build` | Build frontend |
| `npm run preview` | Preview built frontend |

## Validation Commands

Run these from a clean local setup:

```bash
cd backend
npm run check
npm run build
npm run migrate
npm run seed
npm run seed
```

```bash
cd frontend
npm run lint
npm run type-check
npm run build
```

### API smoke (backend running)

```bash
set -euo pipefail

login=$(curl -s -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"usernameOrEmail":"admin","password":"ChangeMe123!"}')

token=$(echo "$login" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{try{const j=JSON.parse(s);process.stdout.write(j.token||'');}catch{process.stdout.write('');}});")

if [ -z "$token" ]; then
  echo "Login failed: token missing from response"
  echo "$login"
  exit 1
fi

curl -s -o /dev/null -w "POST /auth/login -> %{http_code}\n" \
  -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"usernameOrEmail":"admin","password":"ChangeMe123!"}'

curl -s -o /dev/null -w "GET /auth/me -> %{http_code}\n" \
  -H "Authorization: Bearer $token" \
  http://localhost:4000/auth/me

curl -s -o /dev/null -w "GET /users -> %{http_code}\n" \
  -H "Authorization: Bearer $token" \
  http://localhost:4000/users

curl -s -o /dev/null -w "GET /organizations -> %{http_code}\n" \
  -H "Authorization: Bearer $token" \
  http://localhost:4000/organizations

curl -s -o /dev/null -w "GET /settings -> %{http_code}\n" \
  -H "Authorization: Bearer $token" \
  http://localhost:4000/settings
```

Expected status codes for the happy path are documented in `STEP_LOG.md` and in the implementation guide.

## Screenshots

Screenshot artifacts are indexed in `docs/screenshots/README.md`.

## Implementation Guide

Track A guide: `IMPLEMENTATION_GUIDE_KEYCLOAK.md`

- overview and scope
- architecture
- module-by-module behavior
- assumptions/limitations
- future improvements
- submission checklist mapping

Track B guide: `IMPLEMENTATION_GUIDE_WAZUH.md`

- overview and scope
- architecture
- setup
- module behavior (`Triage`, `Incidents`)
- sample data and seed contracts
- validation summary
- assumptions/limitations
- future improvements
- submission checklist mapping

## Known Limitations (Current Scope)

- Authentication settings are persisted but not yet enforced inside `/auth/login`.
- Password reset is simulated and returns a temporary password in API response.
- Most business APIs are admin-only; multi-role matrix is not implemented.
- Real email/SMS/passkey provider integrations are out of scope.
- Dev CORS policy is permissive by design for local development.

## Future Improvements

See the dedicated section in `IMPLEMENTATION_GUIDE_KEYCLOAK.md`.
