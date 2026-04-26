# Implementation Guide — Wazuh SOC (Track B)

## 1) Overview and Scope

This guide documents the Track B implementation for `Doc/Wazuh_SOC.pdf`.

Scope delivered in Track B:
- Mandatory module: `Triage`
- Mandatory module: `Incidents`

Optional scope status:
- `Detection` is intentionally deferred (post-B5 only) and not required for mandatory acceptance.

Track isolation:
- Track B backend: `backend-soc/`
- Track B frontend: `frontend-soc/`
- Track B DB: `backend-soc/data/soc.sqlite`
- No shared Track A/Track B models or route modules in mandatory delivery.

## 2) Architecture

Backend:
- Node.js + TypeScript + Express
- Knex + SQLite (`better-sqlite3`)
- Validation via Zod
- REST API with consistent response envelope

Frontend:
- React + TypeScript + Vite
- `react-router-dom` for route map
- `axios` API client via `/api` proxy in dev

Data mode:
- Seeded demo/mock data only
- No live Wazuh integration in mandatory scope

## 3) Setup

### Prerequisites

- Node.js 20+
- npm 10+

### Backend setup (`backend-soc`)

```bash
cd backend-soc
npm install
cp .env.example .env
npm run migrate
npm run seed
npm run dev
```

Default backend URL: `http://localhost:4100`

### Frontend setup (`frontend-soc`)

```bash
cd frontend-soc
npm install
cp .env.example .env
npm run dev -- --host 127.0.0.1 --port 5174
```

Default frontend URL: `http://127.0.0.1:5174`

### Reset utility

```bash
cd backend-soc
npm run reset:test-data
```

Use reset after runtime mutation smoke tests to restore deterministic baseline.

## 4) Module Behavior

### Triage

Required behaviors delivered:
- Alert list with required fields:
  - ID
  - timestamp
  - severity
  - rule
  - host
  - IP
  - status
- Filtering and sorting:
  - filters: severity, status
  - sort: `received_at|severity`
  - order: `asc|desc`
- Alert detail view with raw JSON payload
- Triage actions:
  - `true_positive`
  - `false_positive`
  - `ignore`
  - `escalate`

Backend triage API:
- `GET /alerts`
- `GET /alerts/:id`
- `POST /triage/alerts/:id/decisions`

Decision materialization contract:
- `triage_decisions` stores append-only history
- `alerts.status` is materialized current queue status
- decision-to-status mapping:
  - `true_positive` -> `triaged`
  - `false_positive` -> `triaged`
  - `ignore` -> `ignored`
  - `escalate` -> `escalated`

### Incidents

Required behaviors delivered:
- Incident list with required fields:
  - ID
  - title
  - severity
  - status
  - alert count
- Incident detail view with:
  - timeline
  - linked alerts
  - comments
- Incident create/update
- Link alert to incident
- Add incident comment

Backend incidents API:
- `GET /incidents`
- `GET /incidents/:id`
- `POST /incidents`
- `PATCH /incidents/:id`
- `POST /incidents/:id/alerts`
- `POST /incidents/:id/comments`

Timeline contract:
- event types:
  - `incident_created`
  - `incident_updated` (optional)
  - `alert_linked`
  - `comment_added`
- deterministic sort:
  - `timestamp` ascending
  - stable event id ascending (tie-break)

## 5) Sample Data and Seed Contracts

Database tables used for mandatory scope:
- `alerts`
- `triage_decisions`
- `incidents`
- `incident_alert_links`
- `incident_comments`

Seed characteristics:
- deterministic IDs for baseline fixtures (`alert-*`, `incident-*`, `link-*`, `comment-*`, `decision-*`)
- deterministic UTC timestamps for reproducible timeline order
- idempotent migrate/seed flow

Runtime ID strategy:
- runtime writes use UUID-based ids (`incident-${uuid}`, `link-${uuid}`, `comment-${uuid}`, `decision-${uuid}`)
- seed IDs remain deterministic for reviewer reproducibility

## 6) Validation Summary

B5 validation gate confirms:
- backend static:
  - `npm run check` pass
  - `npm run build` pass
  - `npm run verify` pass
- frontend static:
  - `npm run lint` pass
  - `npm run type-check` pass
  - `npm run build` pass
- runtime health and route reachability:
  - backend health + mandatory endpoint matrix pass
  - frontend mandatory routes reachable (`/`, `/triage`, `/triage/:id`, `/incidents`, `/incidents/:id`)
- happy paths:
  - one triage happy path pass
  - one incidents happy path pass
- baseline reset after mutation smoke:
  - `npm run reset:test-data` pass

Full command outputs and evidence are logged in `STEP_LOG.md` under `B5`.

## 7) Assumptions and Limitations

- Track B remains demo-mode without authentication.
- Analyst identity fields are client-provided (`x-analyst-id`, body identity fallback).
- Unknown query keys are rejected with `400` in list endpoints.
- No Detection module in mandatory baseline.
- No advanced analytics dashboards in mandatory baseline.

## 8) Future Improvements

- Implement optional `Detection` module (`B4`) after mandatory scope freeze.
- Add authenticated SOC analyst identity and authorization.
- Add automated API/integration test suite.
- Add richer incident workflow orchestration and assignment states.
- Add production hardening (rate limits, stricter CORS policies, auditing exports).

## 9) Submission Checklist Mapping (`Doc/Wazuh_SOC.pdf`)

| Required item | Artifact |
| --- | --- |
| Source code | `backend-soc/` + `frontend-soc/` |
| Setup/run instructions | `README.md`, `backend-soc/README.md`, `frontend-soc/README.md` |
| Implementation guide | `IMPLEMENTATION_GUIDE_WAZUH.md` |
| Sample/seed data | `backend-soc/src/db/seeds/*`, `backend-soc/scripts/reset-test-data.ts` |
| Triage module proof | API/UI in Track B apps + B5 validation in `STEP_LOG.md` |
| Incidents module proof | API/UI in Track B apps + B5 validation in `STEP_LOG.md` |
| Screenshots/demo proof | `docs/screenshots/10-soc-triage-list.png` to `13-soc-incident-detail.png` + screenshots index |
