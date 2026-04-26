# Agent Execution Plan and Checklist

## Purpose
This file is the operational plan for coordinating agents to complete the project work based on files in `Doc/`.
Use it as the single execution checklist and handoff reference.

## Source of truth
- `Doc/KeyCloak.docx` (IAM challenge)
- `Doc/Wazuh_SOC.pdf` (SOC workflow challenge)
- UI references:
  - `Doc/000--Login-Screen.png`
  - `Doc/010--Main-Dashboard-after-successful-login.png`
  - `Doc/021--Invite-User-Screen.png`
  - `Doc/030--Orgnization-Change.png`
  - `Doc/031--Create-New-Organization.png`
  - `Doc/040--User-Management-without-selected-user.png`
  - `Doc/042--Change-User-Setting.png`
  - `Doc/050--Global-Settings--User-Authentication.png`
  - `Doc/051--Global-Settings--User-MFA.png`

## Critical requirements captured from docs

### KeyCloak (mandatory)
- Timeline: defined by you; execute step-by-step with validation at each step.
- Stack:
  - Backend: Node.js (TypeScript preferred)
  - Frontend: React
  - Database: MongoDB or PostgreSQL or SQLite
  - API: REST
  - Authentication: Session or JWT
- Core modules:
  - Login
  - Dashboard
  - User Management
  - User Invitation
  - Organization Management
  - Global Authentication Settings
  - Global MFA Settings
- Backend APIs required:
  - Auth endpoints
  - User CRUD
  - Invitation endpoints
  - Organization endpoints
  - Settings endpoints
- Submission:
  - Source code
  - README
  - Implementation guide
  - Setup instructions
  - Seed data
  - Screenshots/demo proof

### Wazuh SOC (mandatory + optional)
- Timeline: defined by you; execute step-by-step with validation at each step.
- Stack:
  - Backend: Node.js + TypeScript (locked in B0)
  - Frontend: React + TypeScript + Vite (locked in B0)
  - Database: SQLite via Knex (locked in B0)
  - API: REST
  - Mock JSON data acceptable
- Mandatory modules:
  - Triage
  - Incidents
- Optional but preferred:
  - Detection
- Isolation rule:
  - Keep Track B code physically separate from Track A (`backend-soc/`, `frontend-soc/`, separate SQLite DB file).
- Submission:
  - Code repository
  - Implementation guide
  - Setup instructions
  - Sample/seed data
  - Optional: Docker, tests, screenshots

## Project control strategy
- Keep the two challenges separate.
- Recommended branch split:
  - `feature/keycloak-iam`
  - `feature/wazuh-soc`
- Do not mix data models or APIs across these tracks unless intentionally shared as platform code.

---

A9 reconciliation note: A0-A9 checklist items are finalized here based on implementation evidence in `STEP_LOG.md`.

## Track A plan: Simplified KeyCloak IAM

### Step A0 - Foundation and scope lock
Checklist:
- [x] Confirm this track follows `Doc/KeyCloak.docx`.
- [x] Confirm UI scope follows all KeyCloak screenshots in `Doc/*.png`.
- [x] Decide DB engine (PostgreSQL, SQLite, or MongoDB) and record decision in README.
- [x] Decide auth mode (JWT or session) and record decision in README.

Files to review:
- `Doc/KeyCloak.docx`
- `Doc/000--Login-Screen.png`
- `Doc/010--Main-Dashboard-after-successful-login.png`
- `Doc/021--Invite-User-Screen.png`
- `Doc/030--Orgnization-Change.png`
- `Doc/031--Create-New-Organization.png`
- `Doc/040--User-Management-without-selected-user.png`
- `Doc/042--Change-User-Setting.png`
- `Doc/050--Global-Settings--User-Authentication.png`
- `Doc/051--Global-Settings--User-MFA.png`

Risk checks:
- Scope drift into SOC requirements.
- Missing module due to screenshot-only assumptions.

Exit criteria:
- Module list and architecture direction documented.

### Step A1 - Backend skeleton
Checklist:
- [x] Create backend app scaffold.
- [x] Add env config and validation.
- [x] Add central error handler and logging.
- [x] Add auth middleware and role middleware stubs.
- [x] Add migration/seed mechanism.

Files to create/review:
- `backend/package.json`
- `backend/tsconfig.json`
- `backend/src/app.ts`
- `backend/src/server.ts`
- `backend/src/config/*`
- `backend/src/middleware/*`
- `backend/src/routes/index.ts`
- `backend/src/db/*`
- `backend/.env.example`

Risk checks:
- Missing seed pipeline blocks login and demos.
- No central validation leads to inconsistent API behavior.

Exit criteria:
- Backend boots, health route works, and seed command exists.

### Step A2 - Frontend skeleton
Checklist:
- [x] Create React app scaffold.
- [x] Set up route guards for protected pages.
- [x] Set up shared layout with left nav + header area.
- [x] Set up API client and auth session handling.

Files to create/review:
- `frontend/package.json`
- `frontend/src/main.*`
- `frontend/src/App.*`
- `frontend/src/router/*`
- `frontend/src/layout/*`
- `frontend/src/services/api.*`
- `frontend/src/store/*` or `frontend/src/context/*`

Risk checks:
- No shared layout causes inconsistent screens.
- No route guard exposes protected pages.

Exit criteria:
- Login route public, app routes protected.

### Step A3 - Login module
Checklist:
- [x] Implement username/email + password login API.
- [x] Seed admin account and verify login.
- [x] Implement logout.
- [x] Match visible elements from `000--Login-Screen.png`.

Files to create/review:
- `backend/src/modules/auth/*`
- `backend/src/routes/auth.*`
- `frontend/src/pages/Login.*`
- `frontend/src/features/auth/*`

Risk checks:
- Password hashing and compare bugs.
- Token/session expiration not handled in UI.

Exit criteria:
- Admin login works and redirects to dashboard.

### Cross-step handoff notes (post-A3)
- API base-path contract:
  - Frontend client base URL is `import.meta.env.VITE_API_BASE_URL || '/api'` in `frontend/src/services/api.ts`.
  - `frontend/.env.example` leaves `VITE_API_BASE_URL` empty, so `/api` is used by default in dev.
  - In dev, Vite proxy rewrites `/api/*` -> backend `/*` (`frontend/vite.config.ts`), so backend routes stay `/auth/*`, `/health`, etc.
  - In production, set `VITE_API_BASE_URL` to backend origin (for example `https://api.example.com`) unless an API gateway requires `/api` prefixing.
- Auth endpoint contract now available for all subsequent modules:
  - `POST /auth/login` -> `{ token, tokenType, expiresIn, user }`
  - `POST /auth/logout` -> `204` (stateless, client-authoritative logout)
  - `GET /auth/me` -> authenticated user probe (`401` if token missing/invalid/deactivated/deleted user)
  - `GET /auth-check` remains admin-only middleware regression probe.
- JWT config guardrails:
  - `JWT_EXPIRES_IN` is validated at startup; invalid values fail server boot.
  - Token `expiresIn` in login response is returned in seconds and uses the same validated value used for signing.
- Frontend auth behavior to preserve while building A4-A8:
  - Keep protected API calls on shared `services/api.ts` helpers to retain automatic Bearer injection + centralized 401 unauthorized handling.
  - Login page currently maps `400` to input error, `401/403` to invalid-credentials error, and token parse expiry to `TokenExpiredError`.
- Data normalization caveat for future steps:
  - Read-time identifier normalization uses Node `normalize('NFKC').toLowerCase()`, but DB write-time lowercase normalization is not enforced yet.
  - Implement write-time normalization + uniqueness hardening in A5 (users/invitations/org assignments) to avoid Unicode/case-collision edge cases.
- CORS note for future deployment work:
  - Current CORS config allows dynamic origins for dev velocity. Before production hardening, restrict allowed origins via env-configured allowlist.
- UI fidelity note:
  - Login screenshot typo (`Dont have an account?`) is intentionally preserved.
  - Password field is intentionally present despite screenshot showing one visible input, because `KeyCloak.docx` requires password auth.

### Step A4 - Dashboard module
Checklist:
- [x] Keep dashboard minimal and navigational only.
- [x] Render `Benutzer suchen` input shell (UI only, no backend search required in A4).
- [x] Render 4 actionable cards/buttons and route correctly:
  - Invite users
  - Organization management
  - User management
  - Global settings

Files to create/review:
- `frontend/src/pages/Dashboard.*`

Risk checks:
- Wrong navigation targets or broken route paths block all later module testing.

Exit criteria:
- Dashboard loads and each card navigates to the expected module route.
- No additional business logic added in A4.

### Step A5 - User management module
Checklist:
- [x] Implement required user management behaviors only:
  - list users
  - search users (simple query on name/email/username is enough)
  - create user
  - edit user
  - delete user
  - activate/deactivate user
  - view user details
  - reset password (simulated)
- [x] Implement create/edit fields:
  - first name, last name, username, email, phone
- [x] Keep permissions model minimal:
  - single `role` baseline from A1 is acceptable for this step
  - defer multi-role permission matrix unless required by reviewer feedback
- [x] Do not build advanced pagination/sorting unless needed for demo stability.

Files to create/review:
- `backend/src/routes/users.*` (or equivalent users module entrypoint)
- `backend/src/modules/users/*`
- `frontend/src/pages/UserManagement.*`
- `frontend/src/pages/UserDetails.*`

Risk checks:
- Unique constraints on username/email not enforced.
- Delete flow leaves orphaned references (future org/invite mappings).
- Overbuilding role/permission complexity before required scope is done.

Exit criteria:
- Required user management flows work end-to-end with seed/admin.
- User reset password endpoint exists and is explicitly simulated.

### Step A6 - Invite user module
Checklist:
- [x] Implement invite API accepting one or more emails.
- [x] Persist invitation records.
- [x] Support assigning target organization (single org assignment is sufficient).
- [x] Build minimal UI:
  - email input area (comma/newline separated is acceptable)
  - organization selector
  - invite submit action
- [x] No real email delivery required.

Files to create/review:
- `backend/src/modules/invitations/*`
- `backend/src/routes/invitations.*`
- `frontend/src/pages/InviteUsers.*`

Risk checks:
- No email normalization -> duplicate invite records.
- Missing organization validation on invite.
- Allowing malformed emails without clear validation feedback.

Exit criteria:
- Invite records are stored and visible.
- Invites can be created for one and multiple recipients.

### Step A7 - Organization management module
Checklist:
- [x] Implement required org features:
  - list organizations
  - search organizations
  - create organization
  - delete organization
  - assign users to organizations
- [x] Implement empty-state behavior.
- [x] Keep hierarchy support optional:
  - ship flat org model first
  - add parent/child only if time remains after core completion

Files to create/review:
- `backend/src/modules/organizations/*`
- `backend/src/routes/organizations.*`
- `frontend/src/pages/Organizations.*`

Risk checks:
- Deleting organizations with assigned users not handled clearly.
- Scope creep from optional hierarchy before mandatory items are complete.

Exit criteria:
- Org list/search/create/delete works.
- User-to-organization assignment works and persists.
- Optional hierarchy may remain unimplemented without blocking completion.

### Step A8 - Global settings module
Checklist:
- [x] Implement persistent global authentication settings:
  - passkeys
  - password
  - email passcodes
  - mobile passcodes
  - delete password on passkey (can remain UI-only if backend policy not yet enforced)
- [x] Implement persistent global MFA settings:
  - TOTP app
  - email passcodes
  - mobile/SMS
- [x] Display and persist toggle states in UI.
- [x] Add minimal guardrail: do not allow all primary auth methods to be disabled at once.

Files to create/review:
- `backend/src/modules/settings/*`
- `backend/src/routes/settings.*`
- `frontend/src/pages/GlobalSettingsAuth.*`
- `frontend/src/pages/GlobalSettingsMFA.*`

Risk checks:
- User lockout risk if all login methods can be disabled.
- Settings state mismatch between UI and persisted backend row.

Exit criteria:
- Both settings pages can load current values and save updates.
- Reload confirms persisted values.

### Step A9 - Documentation and submission artifacts
Checklist:
- [x] Create README with setup, run, seed, test steps.
- [x] Create implementation guide:
  - overview
  - architecture
  - setup
  - module explanation
  - assumptions/limitations
  - future improvements
- [x] Add screenshots/demo proof.
- [x] Ensure each completed step has matching `STEP_LOG.md` entry (what changed + validation).

Files to create/review:
- `README.md`
- `IMPLEMENTATION_GUIDE_KEYCLOAK.md`
- `docs/screenshots/*` or similar folder
- `STEP_LOG.md`

Risk checks:
- Working code but missing required docs.
- Docs diverge from actual commands/routes.

Exit criteria:
- Submission checklist from doc fully satisfied.
- A new engineer can run app from README without guesswork.

### Step A10 - Validation gate
Note: Unlike A1-A8, A10 checkboxes are intentionally ticked within A10 itself because no later reconciliation step exists.
Checklist:
- [x] Verify all KeyCloak required module routes are reachable.
- [x] Verify required API endpoints return expected status codes.
- [x] Verify seed admin login and one happy path per required module:
  - login
  - dashboard navigation
  - user management
  - invite user
  - organization management
  - global auth settings
  - global MFA settings
- [x] Run frontend/backend lint + type-check + build.
- [x] Record final smoke results in `STEP_LOG.md`.

Risk checks:
- Integration bugs between modules.
- Unclear setup instructions for reviewers.
- Hidden dependency on manual DB edits or undocumented env values.

Exit criteria:
- Ready-to-submit state for KeyCloak track.
- All mandatory requirements from `Doc/KeyCloak.docx` are demonstrably satisfied.

### Deferred (only if time remains after A10)
- Multi-role/checkbox permission model matching full screenshot fidelity.
- Organization hierarchy/tree UX.
- Pixel-perfect styling parity with screenshots.
- Extra UX polish (pagination, advanced sorting/filtering, animations).

---

## Track B plan: Wazuh SOC

### Step B0 - Scope lock
Checklist:
- [x] Confirm this track follows `Doc/Wazuh_SOC.pdf`.
- [x] Confirm mandatory modules only: Triage + Incidents.
- [x] Mark Detection as optional and defer unless core is complete.

Files to review:
- `Doc/Wazuh_SOC.pdf`

Risk checks:
- Scope drift into optional features before mandatory delivery.

Exit criteria:
- Minimal scope decisions documented for all agents.

### Cross-step handoff notes (post-B0)
- Authoritative requirements source:
  - `Doc/Wazuh_SOC.pdf` is the requirement authority for Track B.
- Locked module scope:
  - Mandatory implementation scope is `Triage` + `Incidents` only.
  - `Detection` remains optional and is deferred by default.
- Locked implementation stack:
  - Backend: Node.js + TypeScript.
  - Frontend: React + TypeScript + Vite.
  - Database: SQLite via Knex.
  - API style: REST.
  - Data source: mock/seed data only (inline TS seed objects or JSON files); no live Wazuh integration in mandatory scope.
- Locked isolation boundaries:
  - Track B implementation must be isolated from Track A runtime and models.
  - Use `backend-soc/` and `frontend-soc/` (sibling apps), with Track B DB at `backend-soc/data/soc.sqlite`.
  - Do not share models/routes/tables with `backend/` and `frontend/` unless explicitly approved as platform code.
- Branch and handoff baseline:
  - Preferred branch for Track B delivery: `feature/wazuh-soc`.
  - B1 ownership starts in `backend-soc/` and `frontend-soc/`; no Track A file edits for feature delivery.
- Localization decision (locked in B0):
  - Default Track B SOC UI language is English (document language); revisit only if reviewer explicitly requests German wording.

### Step B1 - Data model and seed
Checklist:
- [x] Create only the data models needed for mandatory modules:
  - alerts
  - triage_decisions
  - incidents
  - incident_alert_links
  - incident_comments
- [x] Seed mock alerts and incidents sufficient for one happy path per module.
- [x] Keep schema simple and demo-first; no advanced analytics schema in B1.

Files to create/review:
- `backend-soc/src/db/migrations/*`
- `backend-soc/src/db/seeds/*`
- `backend-soc/src/db/knex.ts`
- `backend-soc/scripts/reset-test-data.ts`
- `backend-soc/README.md`

Risk checks:
- Alert IDs and incident links not stable across seed runs.
- Over-modeling optional detection metrics too early.

Exit criteria:
- Seeded data supports Triage and Incidents mandatory flows.

### Cross-step handoff notes (post-B1)
- `SOC_DB_PATH` is the only Track B DB path contract (default: `./data/soc.sqlite` under `backend-soc/`).
- `triage_decisions` is append-only audit history; `alerts.status` is materialized current queue state.
- Any B2 triage mutation must write both decision history and current status in one transaction.
- canonical decision->status mapping for B2 writes:
  - `true_positive` -> `triaged`
  - `false_positive` -> `triaged`
  - `escalate` -> `escalated`
  - `ignore` -> `ignored`
- Seed IDs are stable and explicit (`alert-*`, `incident-*`, `link-*`, `comment-*`, `decision-*`) for fixtures/screenshots.
- Seed timestamps are fixed UTC strings to avoid timeline drift across environments.
- `raw_json` is DB-validated with `json_valid(...)`; B2 should continue storing valid JSON payload text.
- `updated_at` uses insert defaults only; B2/B3 update paths must set `updated_at` explicitly on writes.
- Foreign keys use `ON DELETE CASCADE` to prevent orphan links/comments/decisions.

### Step B2 - Triage module
Checklist:
- [x] Implement required triage behaviors only:
  - alert list with core fields (ID, timestamp, severity, rule, host, IP, status)
  - simple filtering/sorting
  - alert detail with raw JSON
  - triage actions: true positive, false positive, ignore, escalate
- [x] Alert detail with raw JSON.
- [x] Persist triage state separately from base alert data.
- [x] Keep UI minimal; no advanced table virtualization/polish required.

Files to create/review:
- `backend-soc/src/routes/alerts.*`
- `backend-soc/src/routes/triage.*`
- `frontend-soc/src/pages/TriageList.*`
- `frontend-soc/src/pages/TriageDetail.*`

Risk checks:
- Decision updates overwrite source alert data.
- Missing audit trail fields on triage decisions (at least timestamp + decision required).

Exit criteria:
- Analyst queue behavior works end-to-end.
- One complete triage happy path validated with seeded data.

### Cross-step handoff notes (post-B2)
- Backend/frontend runtime contract:
  - SOC backend uses `SOC_PORT` with default `4100`.
  - `frontend-soc` dev proxy rewrites `/api/*` to `http://localhost:4100/*`.
- Endpoint contracts:
  - `GET /alerts`
    - query: `severity?`, `status?`, `sort?=received_at|severity`, `order?=asc|desc`, `limit?`, `offset?`.
    - unknown query keys are rejected (`400`) by strict query validation.
    - response: `{ data: AlertSummary[], pagination: { total, limit, offset } }`.
  - `GET /alerts/:id`
    - response: `{ data: AlertDetail }` where `raw_json` is parsed JSON object.
  - `POST /triage/alerts/:id/decisions`
    - body: `{ decision, note?, decided_by? }`.
    - response: `{ data: { decision, alert: { id, previous_status, status, updated_at } } }`.
- Response envelope convention for B3:
  - list endpoints use top-level `data + pagination`.
  - detail/mutation endpoints use `{ data: ... }`.
- Canonical decision->status mapping remains locked:
  - `true_positive` -> `triaged`
  - `false_positive` -> `triaged`
  - `escalate` -> `escalated`
  - `ignore` -> `ignored`
- Triage write-path contract (unchanged from B1, now implemented):
  - one transaction inserts `triage_decisions` audit row and updates `alerts.status` + `alerts.updated_at`.
  - re-triage is allowed; latest decision materializes current alert status while history remains append-only.
- Analyst identity (no auth in Track B):
  - `decided_by` resolution order: `x-analyst-id` header, then body `decided_by`, else default `analyst1`.
  - limitation: values are client-controlled in B2 demo mode and are not trustable audit identity.
- Decision id strategy:
  - seeded fixtures stay deterministic numeric IDs (`decision-001...`).
  - runtime B2 writes use `decision-${uuid}` to avoid collision.
- Known B2 concurrency behavior:
  - concurrent POST decisions on the same alert can both append history; `alerts.status` is last-write-wins.
- Audit visibility note:
  - `triage_decisions` is persisted and queryable in DB, but no read endpoint is exposed in B2 (`write-only API surface`).
  - if incident timeline or analyst UX needs decision history, add `GET /alerts/:id/decisions` in B3.
- Frontend route map for B3 integration:
  - `/triage`
  - `/triage/:id`
  - `/incidents` (B2 placeholder for B3 implementation target)

### Step B3 - Incidents module
Checklist:
- [x] Implement required incident behaviors only:
  - incident list with ID/title/severity/status/alert count
  - incident detail with timeline, linked alerts, comments
  - create and update incident
  - link alerts to incident
- [x] Keep timeline simple (created/updated/comments/links sorted by time).
- [x] No workflow engine/escalation automation in B3.

Files to create/review:
- `backend-soc/src/routes/incidents.*`
- `frontend-soc/src/pages/IncidentsList.*`
- `frontend-soc/src/pages/IncidentDetail.*`

Risk checks:
- Missing timeline ordering consistency.
- Linking logic allows duplicate alert-to-incident records.

Exit criteria:
- Incidents can be created and managed from alerts.
- One complete incident happy path validated from seeded alert to linked incident.

### Cross-step handoff notes (post-B3)
- Endpoint contracts:
  - `GET /incidents`
    - query: `severity?`, `status?`, `sort?=updated_at|created_at|severity`, `order?=asc|desc`, `limit?`, `offset?`.
    - unknown query keys are rejected (`400`) via strict query validation.
    - response: `{ data: IncidentSummary[], pagination: { total, limit, offset } }`.
  - `GET /incidents/:id`
    - response: `{ data: { incident, alerts, comments, timeline } }`.
  - `POST /incidents`
    - body: `{ title, severity, status? }`.
    - response: `{ data: IncidentSummary }`.
  - `PATCH /incidents/:id`
    - body: one-or-more of `{ title?, severity?, status? }`.
    - response: `{ data: IncidentSummary }`.
  - `POST /incidents/:id/alerts`
    - body: `{ alert_id }`.
    - duplicate incident/alert links return `409`.
    - response: `{ data: { id, incident_id, alert_id, linked_at } }`.
  - `POST /incidents/:id/comments`
    - body: `{ body, author? }`.
    - response: `{ data: { id, incident_id, author, body, created_at } }`.
- Timeline contract:
  - timeline contains `incident_created`, optional `incident_updated`, `alert_linked`, and `comment_added` events.
  - sorting is deterministic: `timestamp` ascending, then stable event id ascending.
- Write-path contract:
  - incident mutations (`PATCH`, link, comment) always update `incidents.updated_at`.
- Identity fallback (no auth in Track B):
  - comment `author` resolution order: `x-analyst-id` header, then body `author`, else default `analyst1`.
- Frontend route map after B3:
  - `/triage`
  - `/triage/:id`
  - `/incidents`
  - `/incidents/:id`

### Step B4 - Detection module (optional, post-B5 stretch)
Checklist:
- [ ] Execute only after B5 is complete and mandatory scope is stable.
- [ ] If executed, keep implementation minimal:
  - aggregate alert counts by rule
  - compute false-positive and escalation percentages from triage decisions
  - show simple noisy-rule flag

Files to create/review:
- `backend-soc/src/modules/detection/*`
- `backend-soc/src/routes/detection.*`
- `frontend-soc/src/pages/Detection.*`

Risk checks:
- Incorrect percentage denominator logic.
- Optional step delaying mandatory submission readiness.

Exit criteria:
- Optional module works and does not regress mandatory modules.

### Step B5 - Documentation and validation gate
Checklist:
- [x] Create SOC implementation guide.
- [x] Update README with SOC setup and run.
- [x] Include sample data notes and screenshots/demo proof.
- [x] Verify mandatory route reachability and endpoint health.
- [x] Verify one happy path each for Triage and Incidents.
- [x] Run frontend/backend lint + type-check + build.
- [x] Record final results in `STEP_LOG.md`.

Files to create/review:
- `IMPLEMENTATION_GUIDE_WAZUH.md`
- `README.md`
- `docs/screenshots/*`
- `STEP_LOG.md`

Exit criteria:
- PDF submission checklist fully satisfied.
- All mandatory `Wazuh_SOC.pdf` requirements demonstrably satisfied.

### Deferred (only if time remains after B5)
- Detection module depth beyond minimal implementation.
- Advanced dashboards/charts and non-required analytics UX.
- Advanced search/filter/pagination tuning and UI polish.

---

## Cross-cutting risks to monitor
- Requirement mixing between KeyCloak and Wazuh tracks.
- Missing seed data (both challenges explicitly require sample/seed data).
- Missing implementation guide (both challenges require it).
- Ambiguous screenshot text:
  - In `042--Change-User-Setting.png`, one global permission label is partially obscured by open menu.
  - Treat that label carefully and do not invent exact text without source confirmation.
- Localization mismatch:
  - UI text in screenshots is mostly German; challenge docs are English.
  - Decide whether to keep German labels for fidelity and document the decision.
- Authentication policy contradictions:
  - Do not allow global auth settings to disable all login methods simultaneously.
- Organization hierarchy integrity:
  - Prevent cycles and unsafe deletes.

## Agent handoff template
Use this when assigning a step to an agent:

1. Scope:
   - Track: `KeyCloak` or `Wazuh`
   - Step: `A#` or `B#` from this file
2. Ownership:
   - Exact files/folders the agent may modify
3. Constraints:
   - Keep APIs REST
   - Preserve seed/demo usability
   - Update docs when behavior changes
4. Done criteria:
   - Copy the step exit criteria verbatim
5. Verification:
   - Required commands/tests/screens to verify before handoff
