# backend-soc (Track B B3)

Track B B3 delivers the SOC backend API for both mandatory modules:
- Triage
- Incidents

## Prerequisites

- Node.js 20+
- npm 10+

## Setup

```bash
cd backend-soc
npm install
cp .env.example .env
npm run migrate
npm run seed
npm run dev
```

Default API URL: `http://localhost:4100`

## Scripts

- `npm run dev`: run API in watch mode
- `npm run build`: compile TypeScript to `dist/`
- `npm run start`: run compiled API (`dist/src/server.js`)
- `npm run check`: TypeScript check
- `npm run migrate`: apply schema migrations
- `npm run seed`: run deterministic SOC seeds
- `npm run reset:test-data`: reset DB to deterministic seeded baseline
- `npm run verify`: migrate + seed + check

## Environment

- `SOC_PORT` defaults to `4100`
- `SOC_DB_PATH` defaults to `./data/soc.sqlite`

## API Endpoints

| Endpoint | Purpose |
| --- | --- |
| `GET /health` | health probe |
| `GET /alerts` | list alert queue with filter/sort/pagination |
| `GET /alerts/:id` | alert detail with parsed `raw_json` |
| `POST /triage/alerts/:id/decisions` | create triage decision and materialize alert status |
| `GET /incidents` | list incidents with alert counts |
| `GET /incidents/:id` | incident detail with timeline, linked alerts, comments |
| `POST /incidents` | create incident |
| `PATCH /incidents/:id` | update incident title/severity/status |
| `POST /incidents/:id/alerts` | link alert to incident |
| `POST /incidents/:id/comments` | add incident comment |

### `GET /alerts` query params

- `severity`: `low|medium|high|critical`
- `status`: `new|triaged|escalated|ignored`
- `sort`: `received_at|severity`
- `order`: `asc|desc`
- `limit`: integer `1..100` (default `25`)
- `offset`: integer `>= 0` (default `0`)
- unknown query keys are rejected (`400`)

Response shape:

```json
{
  "data": [],
  "pagination": {
    "total": 12,
    "limit": 25,
    "offset": 0
  }
}
```

### `POST /triage/alerts/:id/decisions` body

```json
{
  "decision": "true_positive",
  "note": "Optional analyst note",
  "decided_by": "Optional analyst identity"
}
```

`decided_by` resolution order:
1. `x-analyst-id` request header
2. body `decided_by`
3. fallback `analyst1`

### `GET /incidents` query params

- `severity`: `low|medium|high|critical`
- `status`: `open|investigating|closed`
- `sort`: `updated_at|created_at|severity`
- `order`: `asc|desc`
- `limit`: integer `1..100` (default `25`)
- `offset`: integer `>= 0` (default `0`)
- unknown query keys are rejected (`400`)

Response shape:

```json
{
  "data": [
    {
      "id": "incident-001",
      "title": "Credential Access Investigation",
      "severity": "high",
      "status": "investigating",
      "created_at": "2026-04-25T08:45:00Z",
      "updated_at": "2026-04-25T09:22:00Z",
      "alert_count": 2
    }
  ],
  "pagination": {
    "total": 2,
    "limit": 25,
    "offset": 0
  }
}
```

### `GET /incidents/:id` response shape

```json
{
  "data": {
    "incident": {},
    "alerts": [],
    "comments": [],
    "timeline": []
  }
}
```

Timeline events are deterministic and sorted by:
1. `timestamp` ascending
2. stable event id ascending (tie-break)

### `POST /incidents` body

```json
{
  "title": "Privilege Escalation Investigation",
  "severity": "high",
  "status": "open"
}
```

### `PATCH /incidents/:id` body

At least one of:
- `title`
- `severity`
- `status`

### `POST /incidents/:id/alerts` body

```json
{
  "alert_id": "alert-004"
}
```

Duplicate incident/alert links return `409`.

### `POST /incidents/:id/comments` body

```json
{
  "body": "Escalated for host isolation.",
  "author": "analyst2"
}
```

`author` resolution order:
1. `x-analyst-id` request header
2. body `author`
3. fallback `analyst1`

## Triage Data Contract

- `triage_decisions` is append-only audit history.
- `alerts.status` is materialized current queue state.
- Triage write path is atomic: decision insert + alert status/update timestamp in one transaction.
- Canonical decision-to-status mapping:
  - `true_positive` -> `triaged`
  - `false_positive` -> `triaged`
  - `escalate` -> `escalated`
  - `ignore` -> `ignored`
- `updated_at` is always set explicitly by mutation paths.
- Seed data uses deterministic numeric decision IDs (`decision-001...`); runtime writes use `decision-${uuid}`.

## Incidents Data Contract

- `incident_alert_links` is unique on `(incident_id, alert_id)`.
- link/comment/update mutation paths always update `incidents.updated_at` explicitly.
- Incident IDs use `incident-${uuid}` at runtime (seed IDs remain deterministic `incident-001...`).
- Link IDs use `link-${uuid}` at runtime (seed IDs remain deterministic `link-001...`).
- Comment IDs use `comment-${uuid}` at runtime (seed IDs remain deterministic `comment-001...`).

## Smoke Examples

```bash
curl -s http://localhost:4100/alerts | jq '.pagination, (.data | length)'
curl -s http://localhost:4100/alerts/alert-001 | jq '.data.id, (.data.raw_json | type)'
curl -s -X POST http://localhost:4100/triage/alerts/alert-004/decisions \
  -H 'content-type: application/json' \
  -d '{"decision":"true_positive","note":"manual smoke"}' | jq '.data.alert'

curl -s http://localhost:4100/incidents | jq '.pagination, (.data | length)'
curl -s http://localhost:4100/incidents/incident-001 | jq '.data.incident.id, (.data.timeline | length)'
curl -s -X POST http://localhost:4100/incidents \
  -H 'content-type: application/json' \
  -d '{"title":"Manual smoke incident","severity":"high","status":"open"}' | jq '.data.id'
```

## Known B3 Limitations

- Track B has no authentication; `decided_by`/`author`/`x-analyst-id` are demo inputs and not trustable identities.
- Concurrent triage submissions for the same alert are both recorded; materialized `alerts.status` is last-write-wins.
- B2 writes `triage_decisions` but does not expose a read endpoint yet (history is visible in DB only).
- No workflow automation/escalation engine is included in B3.
