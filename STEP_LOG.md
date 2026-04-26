# Step Log

## A1 — Backend Skeleton (2026-04-21)

**Files created:**
- `backend/package.json`
- `backend/tsconfig.json`
- `backend/knexfile.ts`
- `backend/.env.example`
- `backend/.gitignore`
- `backend/README.md`
- `backend/src/types/express.d.ts`
- `backend/src/config/env.ts`
- `backend/src/db/knex.ts`
- `backend/src/db/migrations/20260421_001_create_users.ts`
- `backend/src/db/seeds/01_admin.ts`
- `backend/src/middleware/errorHandler.ts`
- `backend/src/middleware/notFound.ts`
- `backend/src/middleware/requestLogger.ts`
- `backend/src/middleware/authenticate.ts`
- `backend/src/middleware/requireRole.ts`
- `backend/src/routes/index.ts`
- `backend/src/app.ts`
- `backend/src/server.ts`

**Validation results:**
- `npm install` — OK (197 packages)
- `npm run migrate` — OK (Batch 1 run: 1 migration)
- `npm run seed` — OK (Ran 1 seed file)
- `npm run seed` (second run) — OK (idempotent, no duplicate row)
- `npm run check` — OK (zero TypeScript errors)
- `npm run build` — OK (dist/ populated, zero errors)
- `npm run dev` — OK (server starts on port 4000)
- `GET /health` — 200 `{"status":"ok","timestamp":"..."}`
- `GET /nonexistent` — 404 `{"error":"Not Found","path":"/nonexistent"}`
- `GET /auth-check` (no token) — 401
- `GET /auth-check` (invalid token) — 401
- CORS header on `/health` with `Origin: http://localhost:3000` — `Access-Control-Allow-Origin: *`

**Deviations from plan:**
- Knex CLI requires `tsx` loader to resolve `knexfile.ts`; scripts updated to `tsx node_modules/.bin/knex --knexfile knexfile.ts ...`
- `knexfile.ts` uses `fileURLToPath(import.meta.url)` instead of `__dirname` (ESM context)
- `knexfile.ts` and `server.ts` both call `fs.mkdirSync` on the data dir so `npm run migrate` works on a fresh clone without manual `mkdir`

**Blockers:** None

**Next step:** A2 — Frontend skeleton

## A1 — Post-review fix (2026-04-21)

**Reason for fix:**
- `npm run start` failed because runtime startup attempted `db.migrate.latest()` from compiled code (`dist`), which conflicted with the migration source used by the TS Knex CLI flow.

**File updated:**
- `backend/src/server.ts`

**Change made:**
- Removed startup-time migration execution (`await db.migrate.latest()`).
- Removed now-unused `db` import.
- Startup now validates env, ensures DB directory exists, and starts server.

**Re-validation after fix:**
- `npm run check` — OK
- `npm run build` — OK
- `npm run migrate` — OK
- `npm run seed` — OK
- `npm run start` — OK
- `GET /health` — 200
- `GET /auth-check` (no token) — 401

**Status:** A1 remains complete and is now safe to proceed.

## A2 — Frontend Skeleton (2026-04-21)

**Files created:**
- `frontend/.env.example`
- `frontend/package.json`
- `frontend/tsconfig.app.json`
- `frontend/vite.config.ts`
- `frontend/src/main.tsx`
- `frontend/src/App.tsx`
- `frontend/src/index.css`
- `frontend/src/router/index.tsx`
- `frontend/src/router/ProtectedRoute.tsx`
- `frontend/src/context/AuthContext.tsx`
- `frontend/src/services/api.ts`
- `frontend/src/layout/AppLayout.tsx`
- `frontend/src/layout/Sidebar.tsx`
- `frontend/src/layout/Header.tsx`
- `frontend/src/pages/Login.tsx`
- `frontend/src/pages/Dashboard.tsx`
- `frontend/src/pages/UserManagement.tsx`
- `frontend/src/pages/InviteUsers.tsx`
- `frontend/src/pages/Organizations.tsx`
- `frontend/src/pages/GlobalSettingsAuth.tsx`
- `frontend/src/pages/GlobalSettingsMFA.tsx`

**Validation results:**
- `npm install` (frontend) — OK
- `npm run type-check` — OK (zero TypeScript errors)
- `npm run build` — OK (dist/ populated)
- `npm run dev -- --host 127.0.0.1 --port 5173` — OK (server starts on 5173)
- `GET /login` (dev server) — 200
- `GET /` (dev server) — 200
- JWT test-token command (ESM-safe, from `backend/`) — OK (token generated)

**Deviations from plan:**
- Vite scaffold currently installs React 19 by default; explicitly pinned project dependencies to React 18 (`react`/`react-dom` `^18.3.1`) to match A2 plan.
- TypeScript 6 raised `baseUrl` deprecation error during build; added `\"ignoreDeprecations\": \"6.0\"` to `tsconfig.app.json` to keep alias support and pass build.
- With `verbatimModuleSyntax` enabled, imports were adjusted to type-only form where required (`FormEvent`, `AxiosResponse`) to satisfy strict compilation.
- Browser-only validations (actual in-browser redirect behavior on auth state transitions) remain manual checks for the next reviewer/operator.

**Blockers:** None

**Next step:** A3 — Login module

## A2 — Post-review fixes (2026-04-21)

**Reason for fixes:**
- External review identified two real lint violations and two routing/UI correctness issues that would affect A3 development quality.

**Files updated:**
- `frontend/src/context/AuthContext.tsx`
- `frontend/src/context/auth-context.ts` (new)
- `frontend/src/context/useAuth.ts` (new)
- `frontend/src/layout/Sidebar.tsx`
- `frontend/src/router/index.tsx`
- `frontend/src/layout/Header.tsx`
- `frontend/src/pages/Login.tsx`
- `frontend/src/router/ProtectedRoute.tsx`

**Changes made:**
- Replaced mount-time auth hydration effect with lazy state initialization from `localStorage` to remove synchronous `setState` in `useEffect`.
- Split auth hook from provider file:
  - `AuthContext.tsx` now exports provider only.
  - `useAuth` moved to `context/useAuth.ts`.
  - shared context types/object moved to `context/auth-context.ts`.
- Added `end` matching for Dashboard `NavLink` so it is not active on every route.
- Changed wildcard route redirect from `/` to `/login` to avoid unnecessary unauth redirect chaining.
- Updated imports to use `@/context/useAuth`.

**Re-validation after fixes:**
- `npm run lint` — OK (zero errors)
- `npm run type-check` — OK
- `npm run build` — OK

**Deferred items (not blocking A2 exit):**
- `index.html` `<title>` is still `"frontend"` and `<html lang="en">` does not reflect German UI labels. To be updated in A9 branding pass.
- `login()` in `AuthContext.tsx` throws on an expired token; the throw is swallowed into a generic error message in `Login.tsx`. When the real `/auth/login` API is wired in A3, distinguish token-expired errors from credential errors and surface the correct message.

**Status:** A2 remains complete and is now lint-clean for A3 handoff.

## A3 — Login Module (2026-04-21)

**Files created:**
- `backend/src/middleware/validateBody.ts`
- `backend/src/modules/auth/auth.schemas.ts`
- `backend/src/modules/auth/auth.service.ts`
- `backend/src/modules/auth/auth.controller.ts`
- `backend/src/routes/auth.ts`
- `frontend/src/features/auth/auth-api.ts`

**Files updated:**
- `backend/package.json` (added `zod`, `ms`, `@types/ms`)
- `backend/.env.example` + `backend/.env` (added `JWT_EXPIRES_IN=8h`)
- `backend/src/config/env.ts` (expose `jwtExpiresIn`)
- `backend/src/app.ts` (explicit CORS `allowedHeaders: ['Content-Type','Authorization']`)
- `backend/src/routes/index.ts` (mount `/auth` router; `/auth-check` retained as admin-only probe)
- `backend/README.md` (Auth API section + documented limitations)
- `frontend/src/context/auth-context.ts` (export `TokenExpiredError`)
- `frontend/src/context/AuthContext.tsx` (throw `TokenExpiredError` instead of generic `Error`)
- `frontend/src/pages/Login.tsx` (real API call, typed error mapping, UI parity elements: Welcome, OR divider, sign-up placeholder, Google branded button)
- `frontend/src/layout/Header.tsx` (best-effort `POST /auth/logout` with swallowed rejection, then local logout)
- `frontend/src/index.css` (styles for `.login-welcome`, `.login-link`, `.login-divider`, `.login-google`)

**Validation results — backend:**
- `npm install zod ms @types/ms` — OK
- `npm run check` — OK (zero TS errors)
- `npm run build` — OK
- `npm run migrate` — OK (already up to date)
- `npm run seed` — OK
- `POST /auth/login` admin email (lowercase) — 200, full contract `{token, tokenType:"Bearer", expiresIn:28800, user}`
- `POST /auth/login` admin email (mixed case `Admin@Example.com`) — 200
- `POST /auth/login` username `admin` — 200
- `POST /auth/login` username `ADMIN` (uppercase) — 200
- `POST /auth/login` wrong password — 401 `Invalid credentials`
- `POST /auth/login` unknown user — 401 `Invalid credentials` (same message; dummy bcrypt.compare ran — verified via code path)
- `POST /auth/login` empty body — 400 with Zod field errors
- `POST /auth/login` missing password — 400
- `POST /auth/login` deactivated admin — 401 `Invalid credentials` (same message; no enumeration)
- `GET /auth/me` no token — 401 `Unauthorized`
- `GET /auth/me` valid token — 200 `{user:{id,email,username,role}}` (no `password_hash`, grep-verified)
- `GET /auth/me` token for deactivated user — 401 `Unauthorized`
- `GET /auth/me` token for non-existent user id (forged) — 401 `Unauthorized`
- `POST /auth/logout` no auth — 204
- `POST /auth/logout` with token — 204
- `GET /auth-check` admin token (regression) — 200
- `GET /health` (regression) — 200
- CORS preflight `OPTIONS /auth/login` from `Origin: http://localhost:5173` — 204 with `Access-Control-Allow-Origin: http://localhost:5173`, `Access-Control-Allow-Methods: GET,POST,PUT,DELETE,OPTIONS`, `Access-Control-Allow-Headers: Content-Type,Authorization`
- CORS preflight `OPTIONS /auth/me` — 204 with `Authorization` in allowed headers
- `expiresIn` value — positive integer 28800 (matches `JWT_EXPIRES_IN=8h` → `ms` → seconds)

**Validation results — frontend:**
- `npm run lint` — OK (zero errors)
- `npm run type-check` — OK
- `npm run build` — OK

**Decisions recorded:**
- Inactive users collapsed into `401 Invalid credentials` (same bucket as unknown user + wrong password) to close enumeration vector.
- Constant-time equalizer: module-level dummy bcrypt hash (saltRounds=10) compared on unknown-user branch.
- `GET /auth/me` added as the generic authenticated probe; returns 401 for deleted or deactivated token-bearers. `/auth-check` retained unchanged as admin-only role-middleware probe.
- Zod adopted as the platform-wide request validator (reused by A5–A8).
- `expiresIn` computed via `ms(JWT_EXPIRES_IN)` in seconds (OAuth2 convention); fallback to 28800 on parse failure.
- Frontend expired-token UX uses typed `TokenExpiredError` class (not magic string); closes A2 deferred item. `AuthProvider.login(token)` signature unchanged.
- Screenshot typo `Dont have an account? Sign up here` preserved verbatim for fidelity.
- Password field rendered alongside username/email field despite screenshot showing only one visible input. Rationale: `KeyCloak.docx` requires password auth; treating screenshot's single input as progressive disclosure would block the submission requirement. Deviation recorded here.
- Error-message strings inlined in `Login.tsx` (three keys) rather than creating a separate `error-messages.ts` module — avoids premature module split.
- Frontend feature client named `features/auth/auth-api.ts` to avoid clash with generic `services/api.ts`.
- CORS explicitly allows `Authorization` header so browser preflights succeed for `/auth/me` and future protected endpoints.
- `AGENT_EXECUTION_PLAN.md` checkboxes intentionally not updated (matches A1/A2 precedent). Reconciliation deferred to A9.

**Deferred (for later steps):**
- Write-side NFKC+lowercase normalization of `email`/`username` columns (A5) — closes remaining Unicode-edge-case collision risk.
- Rate limiting on `/auth/login` — documented in `backend/README.md`.
- Server-side token revocation / refresh tokens — out of scope.
- Real Google OAuth and sign-up flow — UI placeholders only.

**Blockers:** None.

**Next step:** A4 — Dashboard module.

## A3 — Post-review hardening fixes (2026-04-21)

**Reason for fixes:**
- A3 implementation review found one functional blocker and two correctness risks before A4 handoff:
  - frontend default `/api` base path did not reach backend `/auth/*` routes in dev,
  - frontend login mapped backend `400` input errors to a misleading network error,
  - `JWT_EXPIRES_IN` signing value could still fail at runtime even though response fallback existed.

**Files updated:**
- `frontend/vite.config.ts`
- `frontend/src/pages/Login.tsx`
- `backend/src/config/env.ts`
- `backend/src/modules/auth/auth.service.ts`
- `backend/src/server.ts`
- `AGENT_EXECUTION_PLAN.md` (added cross-step handoff/watchout section for next agents)

**Changes made:**
- Added Vite proxy rewrite `'/api' -> ''` so frontend default API calls (`/api/*`) correctly reach backend root-mounted routes (`/auth/*`, `/health`) in dev.
- Updated login error mapping:
  - `400` -> explicit input validation message,
  - `401/403` -> invalid credentials,
  - network/other -> connectivity/server fallback.
- Replaced `JWT_EXPIRES_IN` fallback behavior with strict shared validation:
  - added `requireJwtExpiresInSeconds()` in env config,
  - server startup now validates JWT expiry config up front,
  - token signing and response `expiresIn` both use the same validated seconds value.

**Re-validation after fixes:**
- Backend:
  - `npm run check` — OK
  - `npm run build` — OK
  - `npm run migrate` — OK (already up to date)
  - `npm run seed` — OK
  - `JWT_EXPIRES_IN=bogus node dist/server.js` — fails fast with expected validation error
- Frontend:
  - `npm run lint` — OK
  - `npm run type-check` — OK
  - `npm run build` — OK
- Live dev-proxy smoke:
  - `GET http://127.0.0.1:5173/login` — 200
  - `POST http://127.0.0.1:5173/api/auth/login` — 200 (token contract returned through proxy)
  - `GET http://127.0.0.1:5173/api/auth/me` with token — 200
  - `POST http://127.0.0.1:5173/api/auth/logout` — 204
  - `POST http://127.0.0.1:5173/api/auth/login` with `{}` — 400 (for Login.tsx input-error branch)

**Residual watchouts carried forward:**
- Write-side lowercase/NFKC normalization is still deferred to A5 (only read-time normalization is active in A3).
- Current CORS remains dev-friendly and should be tightened via allowlist before production hardening.
- A3 checkboxes in `AGENT_EXECUTION_PLAN.md` remain unchecked by convention used since A1/A2; `STEP_LOG.md` is the execution source of truth.

**Status:** A3 implementation is hardened, validated, and ready for A4 handoff.

## A4 — Dashboard Module (2026-04-25)

**Files updated:**
- `frontend/src/pages/Dashboard.tsx` (full rewrite from placeholder)
- `frontend/src/index.css` (appended dashboard styles only; no edits to existing rules)

**Implementation summary:**
- Replaced "Coming soon" placeholder with navigational landing page.
- Added inert `Benutzer suchen` search row: `<input type="search">` + `Suchen` button. `<form onSubmit={preventDefault}>` neutralizes Enter-key submission. Button is `type="button"`. No backend wiring.
- Added 4-card grid using `<Link>` (semantic, keyboard-accessible, supports middle-click / open-in-new-tab):
  - `Benutzer einladen` → `/invite`
  - `Organisation ändern` → `/organizations`
  - `Benutzer verwalten` → `/users`
  - `Globale Einstellungen` → `/settings/auth`
- Each card has German title + short German subtitle.
- CSS appended: `.dashboard-search`, `.dashboard-grid` (auto-fit, minmax 240px), `.dashboard-card` with hover/focus state.

**Validation results — frontend:**
- `npm run lint` — OK (zero errors)
- `npm run type-check` — OK
- `npm run build` — OK (`dist/assets/index-*.css` 3.62 kB, `dist/assets/index-*.js` 251.30 kB)
- `npm run dev -- --host 127.0.0.1 --port 5173` — server starts
- `GET http://127.0.0.1:5173/` — 200
- `GET http://127.0.0.1:5173/login` — 200

**Decisions recorded:**
- Cards implemented as `<Link>` rather than `useNavigate()` + onClick — semantic anchor element, keyboard-accessible, supports middle-click and open-in-new-tab without extra code.
- `Globale Einstellungen` card routes to `/settings/auth` (not `/settings/mfa`) — matches docx ordering (Authentication settings listed before MFA) and sidebar's effective default settings landing. Direct MFA access remains via sidebar.
- Search input is intentionally inert in A4 per `AGENT_EXECUTION_PLAN.md` ("UI only, no backend search required in A4"). `aria-label="Benutzer suchen"` retained for accessibility. Live wiring is owned by A5.
- Form-level `preventDefault` chosen over removing `<form>` — keeps semantic grouping of input+button while neutralizing Enter-submit reload.
- German labels preserved throughout (matches Sidebar.tsx convention; matches `Doc/010` screenshot).
- CSS appended only; no edits to existing `.page`, `.sidebar`, `.login-*`, header rules — zero regression surface for prior modules.
- `AGENT_EXECUTION_PLAN.md` checkboxes intentionally not updated (matches A1/A2/A3 precedent; reconciliation deferred to A9).

**Manual browser smoke:**
- Dev server boot + HTTP 200 for `/` and `/login` confirmed via curl.
- Full in-browser click-through smoke (admin login → click each card → verify URL change → back button → sidebar regression → header logout regression) is the operator/reviewer step; build + type-check + route map verification cover the static surface.

**Deferred:**
- Wiring `Benutzer suchen` to user search API — owned by A5.
- Pixel-perfect parity with `Doc/010--Main-Dashboard-after-successful-login.png` — deferred per "Deferred (only if time remains after A10)" section.

**Blockers:** None.

**Next step:** A5 — User management module.

## A5 — User Management Module (2026-04-25)

**Files created:**
- `backend/src/db/migrations/20260425_002_extend_users.ts`
- `backend/src/db/seeds/02_demo_users.ts`
- `backend/src/modules/users/normalize.ts`
- `backend/src/modules/users/users.schemas.ts`
- `backend/src/modules/users/users.service.ts`
- `backend/src/modules/users/users.controller.ts`
- `backend/src/routes/users.ts`
- `frontend/src/features/users/types.ts`
- `frontend/src/features/users/users-api.ts`
- `frontend/src/pages/UserDetails.tsx`

**Files updated:**
- `backend/src/routes/index.ts` (mount `/users` behind `authenticate + requireRole('admin')`)
- `backend/src/modules/auth/auth.service.ts` (reuse shared identifier normalization)
- `backend/src/db/seeds/01_admin.ts` (idempotent merge, system-admin marker, profile fields)
- `backend/src/db/migrations/20260421_001_create_users.ts` (comment corrected)
- `backend/README.md` (Users API section + caveats)
- `frontend/src/services/api.ts` (added `patch()` helper)
- `frontend/src/pages/UserManagement.tsx` (A5 two-pane list/create page)
- `frontend/src/pages/Dashboard.tsx` (search submit now navigates to `/users?q=...`)
- `frontend/src/router/index.tsx` (added `/users/:id`)
- `frontend/src/index.css` (A5 user-management styles appended)

**Implementation summary:**
- Added users data model extensions: `first_name`, `last_name`, `phone`, `is_system`.
- Migration includes normalization collision precheck; aborts with explicit error if normalized `email`/`username` duplicates exist before backfill.
- Added admin-only Users REST API:
  - `GET /users`, `GET /users/:id`
  - `POST /users`, `PATCH /users/:id`, `DELETE /users/:id`
  - `POST /users/:id/activate`, `POST /users/:id/deactivate`
  - `POST /users/:id/reset-password` (simulated)
- Added write-time identifier normalization (`NFKC + trim + lowercase`) for `email` and `username`.
- Added guardrail policy:
  - block self-delete and self-deactivate,
  - block self admin demotion,
  - block sensitive mutations/deactivate/delete for `is_system=true` users,
  - keep at least one active admin when demoting/deactivating/deleting active admins.
- Added password contract:
  - create without password returns `{ user, temporaryPassword }`,
  - create with password returns `{ user }`,
  - reset-password returns `{ temporaryPassword }`.
- Frontend A5 UI added:
  - `/users`: list + search + create form
  - `/users/:id`: detail/edit/activate-deactivate/delete/reset actions
  - dashboard search now routes to `/users?q=<query>`.

**Validation results — backend static:**
- `npm run check` — OK
- `npm run build` — OK
- `npm run migrate` — OK (Batch 2 run: 1 migration)
- `npm run seed` — OK (Ran 2 seed files)
- `npm run seed` (second run) — OK (idempotent)

**Validation results — backend runtime (scripted curl):**
- `GET /health` — 200
- `POST /auth/login` admin/non-admin — 200
- `GET /users` no token — 401
- `GET /users` non-admin token — 403
- `GET /users` admin token — 200 (no `password_hash` in response)
- `GET /users?q=admin` and `GET /users?q=ADMIN` — 200 (case-insensitive search)
- `POST /users` (no password) — 201 with `temporaryPassword`
- login with generated temporary password — 200
- `POST /users` (with password) — 201 without `temporaryPassword`
- login with provided password — 200
- duplicate email (mixed case) create — 409
- invalid create payload — 400 (zod details)
- `GET /users/:id` existing — 200; non-existing — 404
- `PATCH /users/:id` partial — 200; empty patch — 400
- self/system guard checks — 403 on protected operations
- non-self seed-admin guard check (using second admin account) — deactivate 403, delete 403
- `POST /users/:id/reset-password` — 200 with `temporaryPassword`; login with new temp password — 200
- deactivate/activate normal user — 200/200
- delete normal user — 204
- regressions:
  - `GET /auth/me` — 200
  - `GET /auth-check` — 200
  - `POST /auth/login` — 200

**Validation results — frontend:**
- `npm run lint` — OK
- `npm run type-check` — OK
- `npm run build` — OK

**Decisions recorded:**
- `/users/*` is admin-only across all methods in A5.
- Hard delete retained (no soft-delete in A5).
- `is_system` introduced to protect seed admin with non-bypassable policy.
- Simulated reset-password intentionally returns temporary password in response and is documented as non-production.
- Single-role baseline (`admin|user`) retained; no role matrix implementation in A5.

**Deferred (for later steps):**
- Org authorization/assignment flows (A7).
- Multi-role matrix and role join-table expansion.
- Production-grade password reset delivery and tokenized flow.
- Soft-delete strategy and referential cleanup across future org/invite relations.

**Blockers:** None.

**Next step:** A6 — Invite user module.

## A5 — Post-review fixes (2026-04-25)

**Reason for fixes:**
- Follow-up review identified six necessary correctness/UX issues:
  - username accepted email-like/whitespace forms,
  - phone clear behavior was implicit via empty string,
  - list query arrays were silently ignored,
  - self reset-password was allowed,
  - demo seed could fail on username-only collisions,
  - frontend role/reset UI allowed known-403 self actions.

**Files updated:**
- `backend/src/modules/users/users.schemas.ts`
- `backend/src/modules/users/users.controller.ts`
- `backend/src/modules/users/users.service.ts`
- `backend/src/db/seeds/02_demo_users.ts`
- `backend/README.md`
- `frontend/src/features/users/types.ts`
- `frontend/src/services/api.ts`
- `frontend/src/features/users/users-api.ts`
- `frontend/src/pages/UserDetails.tsx`

**Changes made:**
- Added username character policy: `[A-Za-z0-9._-]+` (rejects whitespace and `@`).
- Made phone clear semantics explicit:
  - create accepts optional non-empty phone string,
  - update accepts `phone: null` to clear,
  - update rejects empty-string phone values.
- `parseListQuery` now rejects array query values (`?q=a&q=b`) with `400`.
- Blocked self reset-password (`403`) in users service/controller path.
- Hardened demo seeding: pre-check by email **or** username before insert (no silent username collision abort).
- Frontend details UX:
  - role select disabled for self admin user (prevents known self-demote 403 path),
  - reset-password button disabled for self user.
- API helper cleanup: `del()` now returns `Promise<void>`; users delete client updated accordingly.

**Re-validation after fixes:**
- Backend static:
  - `npm run check` — OK
  - `npm run build` — OK
  - `npm run seed` (twice) — OK
- Frontend static:
  - `npm run lint` — OK
  - `npm run type-check` — OK
  - `npm run build` — OK
- Backend focused runtime checks:
  - username with `@` — 400
  - username with spaces — 400
  - `PATCH /users/:id` with `{"phone":""}` — 400
  - `PATCH /users/:id` with `{"phone":null}` — 200 and `phone:null`
  - `GET /users?q=a&q=b` — 400
  - `POST /users/:selfId/reset-password` — 403
  - non-self reset-password — 200

**Status:** A5 remains complete and now addresses the necessary review findings.

## A6 — Invite User Module (2026-04-25)

**Files created:**
- `backend/src/db/migrations/20260425_003_create_organizations.ts`
- `backend/src/db/migrations/20260425_004_create_invitations.ts`
- `backend/src/db/seeds/03_demo_orgs.ts`
- `backend/src/modules/organizations/organizations.service.ts`
- `backend/src/modules/organizations/organizations.controller.ts`
- `backend/src/modules/invitations/invitations.schemas.ts`
- `backend/src/modules/invitations/invitations.service.ts`
- `backend/src/modules/invitations/invitations.controller.ts`
- `backend/src/routes/invitations.ts`
- `backend/src/routes/organizations.ts`
- `frontend/src/features/invitations/types.ts`
- `frontend/src/features/invitations/invitations-api.ts`
- `frontend/src/features/organizations/types.ts`
- `frontend/src/features/organizations/organizations-api.ts`

**Files updated:**
- `backend/src/routes/index.ts` (mounted `/invitations` and `/organizations` as admin-only)
- `backend/README.md` (Organizations stub + Invitations API contracts)
- `frontend/src/pages/InviteUsers.tsx` (full implementation replacing placeholder)
- `frontend/src/index.css` (appended `.invite-*` styles only)
- `STEP_LOG.md` (this entry)

**Implementation summary:**
- Added minimal `organizations` persistence for invite FK target:
  - columns: `id,name,slug,parent_id,created_at,updated_at`
  - unique `slug`, parent self-reference (`ON DELETE SET NULL`), parent index.
- Added `invitations` persistence:
  - columns: `id,email,email_normalized,organization_id,token,status,invited_by_user_id,expires_at,created_at,updated_at`
  - status constraint: `pending|revoked|accepted`
  - unique token
  - partial unique index on pending key: `(email_normalized, organization_id) WHERE status='pending'`.
- Added idempotent demo org seed (`Kunden`, `Partner`, `Intern`).
- Added admin-only APIs:
  - `GET /organizations`
  - `POST /invitations`
  - `GET /invitations`
  - `POST /invitations/:id/revoke`.
- Invitation create contract is canonical and deterministic:
  - one response shape for all successful requests (`201`) with per-email `results[]` + `summary`
  - per-email status: `created|duplicate|invalid`
  - mixed valid/invalid/duplicate batches supported
  - `400` returned only when all provided emails are invalid
  - unknown org returns `404`.
- Backend normalization/validation:
  - email normalization on invite write uses NFKC + trim + lowercase
  - per-email format validation via zod email schema
  - in-request dedupe + DB-level partial unique index for race-safe duplicate prevention.
- Frontend invite page implementation:
  - textarea (`Email Addressen eingeben`) with comma/newline/semicolon/whitespace parsing
  - client dedupe + quick invalid count feedback
  - organization selector (`Organisation wechseln`) loaded from API
  - submit action (`Einladen`) with summary + per-email result list
  - recent invitation list (latest 10) with status + org + timestamp
  - explicit non-admin UI guard message for `/invite` route.

**Validation results — backend static:**
- `npm run check` — OK
- `npm run build` — OK
- `npm run migrate` — OK (`Batch 3 run: 2 migrations`)
- `npm run seed` — OK (`Ran 3 seed files`)
- `npm run seed` (second run) — OK (idempotent)

**Validation results — backend runtime (scripted curl):**
- `GET /organizations`:
  - no token -> `401`
  - non-admin -> `403`
  - admin -> `200`
- `POST /invitations`:
  - single valid email + valid org -> `201`, `created=1`
  - mixed batch (valid + malformed + duplicate + case-variant duplicate) -> `201`, mixed statuses returned
  - all-invalid batch -> `400` (`All provided emails are invalid`) with summary details
  - unknown `organizationId` -> `404`
  - non-admin -> `403`
  - no token -> `401`
  - same email + different org -> `201` created
- `GET /invitations` admin -> `200` with org/status fields; filters (`organizationId`, `status`, `q`) work
- `POST /invitations/:id/revoke` -> `200` and status `revoked`
- Focused reinvite check after same-org revoke -> `created` confirmed
- A5 regressions still green:
  - `GET /health` -> `200`
  - `POST /auth/login` -> `200`
  - `GET /users` as admin -> `200`

**Validation results — frontend:**
- `npm run lint` — OK
- `npm run type-check` — OK
- `npm run build` — OK

**Frontend runtime smoke (dev server):**
- `GET /invite` -> `200`
- `GET /` -> `200`

**Decisions recorded:**
- Duplicate handling is not a hard request-level `409`; duplicate emails are reported per-item in `results[]` while request returns `201` if at least one email is processable.
- Request-level `400` is reserved for all-invalid email batches.
- Invitation token is generated and stored for audit/redeem-forward compatibility but not exposed in list output.
- `organizations` schema is intentionally minimal and forward-compatible for A7 expansion.
- Invite page keeps screenshot label typo (`Email Addressen eingeben`) for fidelity and remains admin-safe in UI.
- `AGENT_EXECUTION_PLAN.md` checkboxes remain untouched (precedent maintained).

**Deferred (for later steps):**
- Real email delivery.
- Invite accept/redeem flow.
- Org CRUD/search/tree UI beyond selector/list stub (A7 scope).
- Multi-org assignment per invite.

**Blockers:** None.

**Next step:** A7 — Organization management module.

## A6 — Post-review fixes (2026-04-25)

**Reason for fixes:**
- Follow-up review identified correctness and maintainability gaps in A6:
  - SQLite foreign keys were not explicitly enabled,
  - invite result email casing was inconsistent between create-result and list,
  - invitation token/expiry fields were dead state for A6 scope,
  - recent-invitations UI had race-prone loading and no visible filter controls,
  - list-query array rejection lacked structured details.

**Files updated:**
- `backend/knexfile.ts`
- `backend/src/db/knex.ts`
- `backend/src/db/migrations/20260425_005_trim_invitation_fields.ts`
- `backend/src/modules/invitations/invitations.schemas.ts`
- `backend/src/modules/invitations/invitations.service.ts`
- `backend/src/modules/invitations/invitations.controller.ts`
- `backend/src/modules/users/users.controller.ts`
- `backend/README.md`
- `frontend/src/features/invitations/types.ts`
- `frontend/src/pages/InviteUsers.tsx`
- `frontend/src/index.css`

**Changes made:**
- Enabled SQLite foreign-key enforcement for both migration CLI and runtime app connections via Knex `pool.afterCreate` + `PRAGMA foreign_keys = ON`.
- Added migration `20260425_005_trim_invitation_fields.ts`:
  - drops unused `invitations.token` and `invitations.expires_at`,
  - replaces single-column created-at index with `(created_at, id)` index.
- Tightened invitation module contract:
  - removed `expiresInDays` from create schema,
  - create result now returns both `email` (display/original) and `emailNormalized` (equality key),
  - consistent casing behavior across `created|duplicate|invalid` outcomes.
- Removed dead token generation/collision-retry logic from invitation service.
- Added structured details for array query-param rejection in:
  - invitations list query parser,
  - users list query parser.
- Reworked InviteUsers page loading flow:
  - request-id guard prevents stale invitation responses from overwriting newer data,
  - visible recent-list filters added (`q`, `status`, `organization`),
  - loading-safe organization `<select>` placeholder option added,
  - refresh button now triggers deterministic reload tick.
- Hid admin-only navigation targets for non-admin users in dashboard cards and sidebar links to avoid predictable 403 navigation paths.
- Updated backend README invitation contracts to match the new payload shape.

**Re-validation after fixes:**
- Backend static:
  - `npm run check` — OK
  - `npm run build` — OK
  - `npm run migrate` — OK (`Batch 4 run: 1 migration`)
  - `npm run seed` (twice) — OK
- Frontend static:
  - `npm run lint` — OK
  - `npm run type-check` — OK
  - `npm run build` — OK
- Backend runtime:
  - full A6 API smoke script re-run — all expected statuses still green
  - focused FK verification through app Knex connection:
    - `PRAGMA foreign_keys` reported `1`
    - deleting an organization with an existing invitation now fails with `FOREIGN KEY constraint failed`
  - focused casing verification:
    - create result `email` preserves original casing
    - list result `email` matches original casing
    - normalized key available as `emailNormalized` in both.
- Frontend runtime:
  - dev smoke: `GET /invite` and `GET /` both `200`.

**Status:** A6 remains complete and now addresses the validated review findings without adding extra scope.

## A7 — Organization Management Module (2026-04-25)

**Files created:**
- `backend/src/db/migrations/20260425_006_create_organization_users.ts`
- `backend/src/modules/organizations/organizations.schemas.ts`

**Files updated:**
- `backend/src/modules/organizations/organizations.service.ts`
- `backend/src/modules/organizations/organizations.controller.ts`
- `backend/src/routes/organizations.ts`
- `backend/src/modules/users/users.service.ts`
- `backend/README.md`
- `frontend/src/features/organizations/types.ts`
- `frontend/src/features/organizations/organizations-api.ts`
- `frontend/src/features/users/types.ts`
- `frontend/src/pages/Organizations.tsx`
- `frontend/src/pages/UserDetails.tsx`
- `frontend/src/index.css`
- `STEP_LOG.md` (this entry)

**Implementation summary:**
- Added `organization_users` persistence for user↔organization assignment:
  - columns: `organization_id,user_id,created_at`
  - composite PK: `(organization_id, user_id)`
  - FK behavior:
    - `organization_id` -> `organizations.id` with `ON DELETE RESTRICT`
    - `user_id` -> `users.id` with `ON DELETE CASCADE`
  - index on `user_id` for efficient user-detail organization lookups.
- Replaced organizations A6 stub with full admin-only module APIs:
  - `GET /organizations` supports search/list query (`q,limit,offset`) and rejects array params.
  - `POST /organizations` with slug derivation from normalized name and optional `parentId`.
  - `DELETE /organizations/:id` with explicit pre-check blocking and structured `409` reasons.
  - `GET /organizations/:id/users` list assigned users.
  - `POST /organizations/:id/users` assign user (idempotent: `201` create, `200` existing).
  - `DELETE /organizations/:id/users/:userId` unassign user (`204`, idempotent for missing row).
- Hardened organization service behavior:
  - fixed slug-collision mapping to `409` (instead of surfacing SQLite errors as `500`),
  - fixed assignment duplicate mapping to idempotent `200` (instead of `500`),
  - delete-block reasons are explicit and stable:
    - `organization_has_users`
    - `organization_has_invitations`
    - `organization_has_children`
    - `organization_referenced` (race/DB fallback).
- Expanded `GET /users/:id` payload to include assigned `organizations: [{id,name,slug,parentId}]`.
- Implemented frontend organizations management page:
  - search (`Organisation suchen`), `Erstellen`, `Löschen`,
  - empty state text: `Keine Organisationen gefunden.`,
  - create modal with optional parent selector + required name,
  - success info: `Die Organisation wurde erstellt.`,
  - right panel for assigned users + assign/remove actions,
  - non-admin page-level guard message for direct `/organizations` navigation.
- Implemented user-details organization assignment UI:
  - `Organisationen` section with chips,
  - assign organization selector,
  - remove assignment actions,
  - refresh-safe handling so user edit/activate responses do not drop in-memory organization chips.
- Appended A7-specific `.org-*` and `.user-org-*` styles to `frontend/src/index.css` without modifying existing rule blocks.

**Validation results — backend static:**
- `npm run check` — OK
- `npm run build` — OK
- `npm run migrate` — OK (`Batch 5 run: 1 migration`)
- `npm run seed` — OK
- `npm run seed` (second run) — OK (idempotent)

**Validation results — backend runtime (admin/non-admin matrix):**
- Auth and access:
  - `GET /organizations` no token -> `401`
  - `GET /organizations` non-admin -> `403`
  - `GET /organizations` admin -> `200`
- List/search:
  - `GET /organizations?q=part` -> `200` and includes `partner`
  - `GET /organizations?q=PART` -> `200` and includes `partner`
  - `GET /organizations?q=a&q=b` -> `400` (array query rejection)
- Create/delete:
  - `POST /organizations {name:<acme>}` -> `201`, slug generated deterministically
  - collision check (`same slug, different case`) -> `409` (confirmed in focused collision rerun)
  - `POST /organizations {name:\"Sub\", parentId:<acmeId>}` -> `201`
  - `POST /organizations {name:\"X\", parentId:99999999}` -> `404`
  - `DELETE /organizations/:id` on unreferenced temp org -> `204`
  - parent with child org delete -> `409`, `details.reason=organization_has_children`
  - org with invitation delete -> `409`, `details.reason=organization_has_invitations`
  - org with assigned users delete -> `409`, `details.reason=organization_has_users`
- Assignment:
  - `POST /organizations/:id/users {userId}` first -> `201`
  - repeat same assign -> `200` (idempotent, no duplicate)
  - assign missing user -> `404`
  - `GET /organizations/:id/users` -> `200`
  - `DELETE /organizations/:id/users/:userId` -> `204`
  - repeat delete -> `204`
- User payload:
  - `GET /users/:id` -> `200` and includes `user.organizations` array.
- Regressions:
  - `POST /auth/login` -> `200`
  - `GET /users` admin -> `200`
  - `GET /invitations` admin -> `200`
  - `GET /organizations` invite selector endpoint remains `200`.

**Validation results — frontend static:**
- `npm run type-check` — OK
- `npm run lint` — OK
- `npm run build` — OK

**Frontend runtime smoke (dev server):**
- `GET /organizations` -> `200`
- `GET /users/15` -> `200`
- `GET /invite` -> `200`

**Decisions recorded:**
- Flat-org-first remains in effect; API accepts optional `parentId`, while hierarchy/tree UI remains deferred.
- Delete guard is explicit in service-level checks and still protected by DB FK constraints as race fallback.
- Assignment table is many-to-many; A7 UI supports repeated assignment actions and idempotent unassign.
- Existing invite flow was kept backward-compatible by preserving `GET /organizations` list response shape.
- Expanded user payload approach chosen over adding a new `/users/:id/organizations` route.
- `AGENT_EXECUTION_PLAN.md` checkboxes remain untouched (per prior-step precedent).

**Deferred (not blocking A7):**
- Tree/hierarchy visualization and hierarchy editing.
- Organization rename/edit endpoint.
- Soft-delete strategy.
- Multi-org-per-invitation behavior.

**Blockers:** None.

**Next step:** A8 — Global settings module.

## A7 — Post-review hardening fixes (2026-04-25)

**Reason for fixes:**
- Follow-up review identified a few contract and UX consistency gaps:
  - unassign endpoint idempotency only held when both entities still existed,
  - user mutation endpoints returning `{ user }` could omit `organizations`,
  - slug-collision error wording implied strict name uniqueness instead of normalized-slug uniqueness,
  - organizations page had small stale-selection/stale-list visual windows after delete/switch,
  - no explicit local destructive reset command for repeated A7 verification runs.

**Files updated:**
- `backend/src/modules/organizations/organizations.service.ts`
- `backend/src/modules/users/users.service.ts`
- `backend/scripts/reset-test-data.ts` (new)
- `backend/package.json`
- `backend/README.md`
- `frontend/src/pages/Organizations.tsx`
- `frontend/src/pages/UserDetails.tsx`
- `STEP_LOG.md` (this entry)

**Changes made:**
- Unassign behavior tightened to full idempotency:
  - `DELETE /organizations/:id/users/:userId` now returns `204` even if assignment row or entities are already missing (still `400` for invalid id params).
- User payload consistency improved:
  - endpoints that return `{ user }` after create/update/activate/deactivate now include `organizations` (same enrichment as `GET /users/:id`).
- Slug-collision error wording corrected:
  - now returns `409` with message `An organization with a similar name already exists`.
- Organizations page UX hardening:
  - successful delete now clears selection immediately and removes deleted org from local list state,
  - user-list panel rendering is keyed to the currently loaded organization id, preventing stale user flash while switching orgs.
- UserDetails error-message parser aligned with organizations page:
  - now checks `details.message` before generic fallback.
- Added explicit destructive local reset utility:
  - `npm run reset:test-data`
  - script clears invitations/organization assignments/organizations, removes non-system non-admin-seed users, and re-seeds demo orgs.

**Re-validation after fixes:**
- Backend static:
  - `npm run check` — OK
  - `npm run build` — OK
  - `npm run migrate` — OK
  - `npm run seed` (twice) — OK
  - `npm run reset:test-data` — OK
- Frontend static:
  - `npm run type-check` — OK
  - `npm run lint` — OK
  - `npm run build` — OK
- Focused backend runtime checks:
  - slug collision now returns `409` with corrected message
  - activate/patch user responses include `organizations` array
  - unassign after user deletion returns `204` (full idempotency)
- Frontend runtime smoke:
  - `GET /organizations` -> `200`
  - `GET /users/1` -> `200`

**Status:** A7 remains complete and now incorporates the requested review hardening changes.

## A8 — Global Settings Module (2026-04-25)

**Files created:**
- `backend/src/db/migrations/20260425_007_create_settings.ts`
- `backend/src/db/seeds/04_default_settings.ts`
- `backend/src/modules/settings/settings.schemas.ts`
- `backend/src/modules/settings/settings.service.ts`
- `backend/src/modules/settings/settings.controller.ts`
- `backend/src/routes/settings.ts`
- `frontend/src/features/settings/types.ts`
- `frontend/src/features/settings/settings-api.ts`

**Files updated:**
- `backend/src/routes/index.ts`
- `backend/README.md`
- `frontend/src/pages/GlobalSettingsAuth.tsx`
- `frontend/src/pages/GlobalSettingsMFA.tsx`
- `frontend/src/layout/Sidebar.tsx`
- `frontend/src/pages/Dashboard.tsx`
- `frontend/src/index.css`
- `STEP_LOG.md` (this entry)

**Implementation summary:**
- Added singleton global settings persistence:
  - new `settings` table with auth + MFA booleans, defaults matching screenshots (`password=true`, others `false`),
  - singleton guard enforced in DB (`id=1`) via insert/update triggers,
  - seed `04_default_settings.ts` inserts default row idempotently (`onConflict('id').ignore()`), without overwriting existing values.
- Added admin-only Settings API:
  - `GET /settings`
  - `PATCH /settings/auth`
  - `PATCH /settings/mfa`
  - mounted behind existing `authenticate + requireRole('admin')` middleware in `routes/index.ts`.
- Implemented strict request validation:
  - auth/mfa patch schemas are `.strict()` and reject unknown keys,
  - empty patch bodies are rejected (`At least one field must be provided`).
- Implemented auth lockout guardrail and dependent-toggle coercion:
  - backend rejects state where all primary methods are off with `409` and `details.reason=auth_methods_lockout`,
  - backend forces `delete_password_on_passkey=false` when resulting `passkeys=false`.
- Implemented concurrency-safe update behavior in settings service:
  - compare-and-swap style update conditions + bounded retries avoid stale-write lockout bypass during simultaneous admin changes,
  - conflict fallback returns `409` with `details.reason=settings_conflict`.
- Implemented frontend settings pages:
  - replaced both stubs with real pages loading persisted settings and saving single-toggle patches,
  - auth page includes: `Passkeys`, nested `Passwort löschen`, `Passwort`, `E-Mail Passcodes`, `Mobilfunknummer`,
  - MFA page includes: `Einmalpasswörter (TOTP-App)`, `E-Mail Passcodes`, `Mobilfunknummer`,
  - optimistic toggle updates with revert-on-error + post-mutation refetch to prevent drift,
  - page-level non-admin guard message for direct route access.
- Closed A8 access consistency risk:
  - settings links/cards are now admin-only in Sidebar and Dashboard, aligning frontend navigation with backend role policy.

**Validation results — backend static:**
- `npm run migrate` — OK (`Batch 6 run: 1 migrations`)
- `npm run seed` — OK (`Ran 4 seed files`)
- `npm run seed` (second run) — OK (idempotent)
- `npm run check` — OK
- `npm run build` — OK

**Validation results — backend runtime:**
- `GET /settings` no token -> `401`
- `GET /settings` non-admin -> `403`
- `GET /settings` admin -> `200` with defaults and all settings fields
- `PATCH /settings/auth` no token -> `401`
- `PATCH /settings/auth` non-admin -> `403`
- `PATCH /settings/auth {"passkeys":true}` admin -> `200`
- `PATCH /settings/auth {"delete_password_on_passkey":true}` -> `200` (with `passkeys=true`)
- `PATCH /settings/auth {"passkeys":false}` -> `200` and `delete_password_on_passkey=false` (server-coerced)
- `PATCH /settings/auth {"password":false}` with all other primary methods off -> `409`, `details.reason=auth_methods_lockout`
- `PATCH /settings/auth {}` -> `400`
- `PATCH /settings/auth {"bogus":true}` -> `400` (strict unknown-key rejection)
- `PATCH /settings/mfa {"mfa_totp":true}` -> `200`
- `PATCH /settings/mfa {"mfa_totp":false,"mfa_email":false,"mfa_sms":false}` -> `200` (no MFA guardrail in A8)
- `GET /settings` after mutations confirms persisted values.
- Focused concurrent-update guard check:
  - simultaneous `PATCH /settings/auth {"passkeys":false}` and `{"password":false}` returned one `200` and one `409`,
  - final persisted state still had at least one primary auth method enabled (no lockout bypass).
- Regressions:
  - `POST /auth/login` admin -> `200`
  - `GET /users` admin -> `200`
  - `GET /organizations` admin -> `200`

**Validation results — frontend static:**
- `npm run lint` — OK
- `npm run type-check` — OK
- `npm run build` — OK

**Frontend runtime smoke:**
- Dev server route checks:
  - `GET /settings/auth` -> `200`
  - `GET /settings/mfa` -> `200`

**Decisions recorded:**
- Singleton settings row remains `id=1`; DB-level trigger guard added to prevent drift.
- `GET /settings` is admin-only in A8 (same policy as other admin modules).
- New dedicated seed (`04_default_settings.ts`) used instead of extending `01_admin.ts` to keep seed responsibilities isolated.
- Lockout reason key is `auth_methods_lockout`.
- `delete_password_on_passkey` coercion is enforced server-side (frontend only mirrors it).
- Login-flow policy enforcement remains deferred; A8 scope is persisted policy + admin guardrail only.
- Frontend settings navigation made admin-only to match backend route policy and avoid non-admin dead-end 403 paths.
- `AGENT_EXECUTION_PLAN.md` checkboxes intentionally untouched (same precedent as prior steps).

**Deferred (not blocking A8):**
- Applying settings policy directly inside `/auth/login` decision flow.
- Per-user MFA state and enrollment.
- Real passkey enrollment, OTP delivery, and SMS provider integration.

**Blockers:** None.

**Next step:** A9 — Documentation and submission artifacts.

## A8 — Post-review hardening fixes (2026-04-25)

**Reason for fixes:**
- Follow-up review identified three concrete gaps:
  - `settings_conflict` responses surfaced English fallback text on German settings pages,
  - mutation flows could attempt `setState` after unmount during in-flight save/refetch cycles,
  - README settings section needed explicit coercion example for `delete_password_on_passkey` when `passkeys=false`.

**Files updated:**
- `frontend/src/pages/GlobalSettingsAuth.tsx`
- `frontend/src/pages/GlobalSettingsMFA.tsx`
- `backend/README.md`
- `STEP_LOG.md` (this entry)

**Changes made:**
- Added localized conflict handling in both settings pages:
  - `409` with `details.reason=settings_conflict` now maps to German user-facing message:
    - `Die Einstellungen wurden zwischenzeitlich geändert. Bitte erneut versuchen.`
- Added unmount-safety guards in both settings pages:
  - introduced `isMountedRef`,
  - guarded post-await state writes in mutation and post-mutation refetch paths.
- Expanded Settings API docs:
  - documented authoritative server coercion behavior with explicit request/response expectation for:
    - `{"passkeys":false,"delete_password_on_passkey":true}` -> persisted/returned `delete_password_on_passkey=false`.

**Re-validation after fixes:**
- Frontend static:
  - `npm run lint` — OK
  - `npm run type-check` — OK
  - `npm run build` — OK

**Status:** A8 remains complete and now incorporates the requested post-review hardening fixes.

## A9 — Documentation and Submission Artifacts (2026-04-25)

**Files created:**
- `README.md`
- `IMPLEMENTATION_GUIDE_KEYCLOAK.md`
- `docs/screenshots/00-login.png`
- `docs/screenshots/01-dashboard.png`
- `docs/screenshots/02-user-management-list.png`
- `docs/screenshots/03-user-management-detail.png`
- `docs/screenshots/04-invite-users.png`
- `docs/screenshots/05-organizations-empty.png`
- `docs/screenshots/06-organizations-create.png`
- `docs/screenshots/07-organizations-assign-users.png`
- `docs/screenshots/08-global-settings-auth.png`
- `docs/screenshots/09-global-settings-mfa.png`
- `docs/screenshots/README.md`

**Files updated:**
- `AGENT_EXECUTION_PLAN.md`
- `frontend/index.html`
- `STEP_LOG.md` (this entry)

**Implementation summary:**
- Added root submission docs:
  - `README.md` as reviewer entry point with setup/run/seed/validation flow.
  - `IMPLEMENTATION_GUIDE_KEYCLOAK.md` with required sections (overview, architecture, setup, module explanation, assumptions/limitations, future improvements) and explicit submission-checklist mapping.
- Added screenshot artifacts under `docs/screenshots/` and indexed them in `docs/screenshots/README.md`.
- Reconciled plan tracking in `AGENT_EXECUTION_PLAN.md`:
  - added one-line A9 reconciliation note before Track A,
  - marked A0-A9 checklist items complete,
  - left A10 unchecked.
- Closed the A2 deferred branding item during A9 by updating frontend shell metadata:
  - `frontend/index.html` `<html lang>` changed to `de`,
  - `<title>` updated to `Belzir IAM`.
- Performed final doc/code drift pass:
  - commands referenced in docs were cross-checked against `backend/package.json` and `frontend/package.json`,
  - documented route and endpoint references were cross-checked against `backend/src/routes/*.ts`.

**Validation results:**
- Backend static + seed flow:
  - `npm run check` — OK
  - `npm run build` — OK
  - `npm run migrate` — OK (`Already up to date`)
  - `npm run seed` — OK (`Ran 4 seed files`)
  - `npm run seed` (second run) — OK (`Ran 4 seed files`)
- Frontend static:
  - `npm run lint` — OK
  - `npm run type-check` — OK
  - `npm run build` — OK
- Route and API smoke (local stack):
  - frontend routes `GET /login`, `/`, `/users`, `/users/1`, `/invite`, `/organizations`, `/settings/auth`, `/settings/mfa` -> all `200`
  - API smoke:
    - `POST /auth/login` -> `200`
    - `GET /auth/me` -> `200`
    - `GET /users` -> `200`
    - `GET /invitations` -> `200`
    - `GET /organizations` -> `200`
    - `GET /settings` -> `200`
    - `GET /health` -> `200`

**Decisions recorded:**
- A0 reconciliation was finalized in A9 and anchored in current artifacts (`README.md`, `IMPLEMENTATION_GUIDE_KEYCLOAK.md`, screenshots, and prior A1-A8 evidence).
- Screenshots were captured from a running local stack using headless browser automation and stored as submission artifacts in `docs/screenshots/`.
- Existing package-local docs (`backend/README.md`, `frontend/README.md`) remain unchanged; root docs are the authoritative reviewer entrypoint.

**Deferred (not blocking A9):**
- A10 remains the explicit final validation gate in the execution plan (left unchecked by design).
- Previously recorded post-A8 deferred product-hardening items remain unchanged:
  - applying global auth settings policy inside `/auth/login`,
  - per-user MFA enrollment,
  - real passkey/OTP/SMS provider integration.

**Blockers:** None.

**Next step:** A10 — Validation gate.

## A9 — Post-review documentation fixes (2026-04-25)

**Reason for fixes:**
- A9 review identified documentation clarity and drift risks:
  - frontend API base-path behavior needed explicit explanation (`VITE_API_BASE_URL` empty default vs `/api` fallback),
  - README needed explicit reviewer-facing database/auth decision wording,
  - README needed an explicit non-admin demo-user warning,
  - README smoke snippet needed fail-fast handling when login/token extraction fails,
  - implementation guide needed explicit note that no automated `npm test` suite exists in current scope,
  - implementation guide needed stronger explicit mention of A8 deep lockout/conflict validations,
  - A2 deferred branding closure in A9 needed clearer mention in guide context,
  - plan handoff note used stale wording (`VITE_API_BASE_URL=/api`) and was reconciled.

**Files updated:**
- `README.md`
- `IMPLEMENTATION_GUIDE_KEYCLOAK.md`
- `AGENT_EXECUTION_PLAN.md`
- `STEP_LOG.md` (this entry)

**Changes made:**
- `README.md`:
  - added explicit Track A decisions (`Database choice: SQLite`, `Auth choice: JWT`),
  - documented frontend API base URL resolution exactly as implemented in code: `import.meta.env.VITE_API_BASE_URL || '/api'`,
  - added explicit warning that demo users are non-admin and will receive `403` on admin-only pages/APIs,
  - added JWT secret deployment note (placeholder acceptable locally; replace for non-local environments),
  - hardened API smoke block with `set -euo pipefail` and explicit token-presence guard.
- `IMPLEMENTATION_GUIDE_KEYCLOAK.md`:
  - added explicit database/auth decision sentence,
  - clarified JWT secret placeholder semantics,
  - documented frontend API baseURL fallback behavior,
  - added demo-user role limitation note,
  - added explicit note that A2 deferred branding closure was completed in A9,
  - added validation-summary row stating no automated `npm test` script exists,
  - expanded A8 deep-check summary with explicit lockout/conflict outcomes.
- `AGENT_EXECUTION_PLAN.md`:
  - updated cross-step API base-path note to match actual implementation and `.env.example` default behavior.

**Re-validation after fixes:**
- Documentation/code consistency checks (grep-based) — OK:
  - confirmed README and guide now state `VITE_API_BASE_URL || '/api'` behavior,
  - confirmed plan handoff note matches `frontend/src/services/api.ts`,
  - confirmed README includes demo-user/admin-only warning,
  - confirmed README smoke script contains fail-fast token guard,
  - confirmed guide includes explicit no-`npm test` note.
- Screenshot artifact sanity spot-check — OK:
  - visually checked representative captures (`00-login.png`, `01-dashboard.png`, `06-organizations-create.png`, `08-global-settings-auth.png`),
  - confirmed images are actual rendered application states rather than placeholder files.

**Status:** A9 remains complete and now addresses the documented review findings without changing functional scope.

## A10 — Validation Gate (2026-04-26)

**Files validated:**
- `Doc/KeyCloak.docx` (requirement authority reference via prior indexed extraction in `DOC_FILE_REFERENCE_INDEX.md`)
- `README.md`
- `IMPLEMENTATION_GUIDE_KEYCLOAK.md`
- `backend/package.json`
- `frontend/package.json`
- `backend/src/routes/index.ts`
- `backend/src/routes/auth.ts`
- `backend/src/routes/users.ts`
- `backend/src/routes/invitations.ts`
- `backend/src/routes/organizations.ts`
- `backend/src/routes/settings.ts`
- `frontend/src/router/index.tsx`
- `frontend/src/pages/Dashboard.tsx`
- `backend/.env.example`
- `frontend/.env.example`
- `docs/screenshots/` and `docs/screenshots/README.md`

**Environment prep notes:**
- `backend/.env` existed and matched expected contract.
- `frontend/.env` was missing and was created from `frontend/.env.example`.
- `backend/node_modules` and `frontend/node_modules` were already present; static/runtime validation proceeded without reinstall.

**Validation results — backend static:**
- `npm run migrate` — OK (`Already up to date`).
- `npm run seed` — OK (`Ran 4 seed files`).
- `npm run seed` (second run) — OK (`Ran 4 seed files`; idempotent).
- `npm run check` — OK (zero TypeScript errors).
- `npm run build` — OK.
- Deterministic runtime baseline run: `npm run reset:test-data` then `npm run seed` — OK.
- Post-fix recheck (after A10 hardening change): `npm run check` + `npm run build` — OK.
- Backend lint note: there is no backend `lint` script; A10 backend static gate uses `npm run check` per plan assumption.

**Validation results — backend runtime (endpoint matrix):**
- Health/auth:
  - `GET /health` -> `200`
  - `POST /auth/login` admin -> `200` (token returned)
  - `POST /auth/login` non-admin demo user -> `200` (token returned)
  - `GET /auth/me` (admin token) -> `200`
  - `GET /auth/me` (no token) -> `401`
  - `POST /auth/logout` -> `204`
- Users:
  - `GET /users` admin/non-admin/no-token -> `200` / `403` / `401`
  - `POST /users` (no password) -> `201` with `temporaryPassword`
  - `PATCH /users/:id` -> `200`
  - `POST /users/:id/deactivate` -> `200`
  - `POST /users/:id/activate` -> `200`
  - `POST /users/:id/reset-password` -> `200` with `temporaryPassword`
  - `DELETE /users/:id` -> `204`
- Invitations:
  - `GET /invitations` admin -> `200`
  - `POST /invitations` mixed batch (valid + invalid + duplicate) -> `201` with per-item result statuses
  - `POST /invitations/:id/revoke` -> `200`
  - `POST /invitations` non-admin/no-token -> `403` / `401`
- Organizations:
  - `GET /organizations` admin/non-admin/no-token -> `200` / `403` / `401`
  - `POST /organizations` -> `201`
  - `POST /organizations/:id/users` first/duplicate -> `201` / `200`
  - `GET /organizations/:id/users` -> `200`
  - `DELETE /organizations/:id/users/:userId` -> `204`
  - `DELETE /organizations/:id` blocked reasons validated:
    - `organization_has_children` (`409`)
    - `organization_has_users` (`409`)
    - `organization_has_invitations` (`409`)
- Settings:
  - `GET /settings` admin/non-admin/no-token -> `200` / `403` / `401`
  - `PATCH /settings/auth` baseline patch -> `200`
  - `PATCH /settings/mfa` baseline patch -> `200`
  - lockout attempt on auth methods -> `409` with `details.reason=auth_methods_lockout`
  - unknown-key patch -> `400`
  - `PATCH /settings/auth` non-admin/no-token -> `403` / `401`
- Focused concurrent settings race probe:
  - concurrent `PATCH /settings/auth {"passkeys":false}` and `{"password":false}` produced one `200` and one `409` (`auth_methods_lockout`), preserving no-lockout invariant.

**Validation results — frontend static:**
- `npm run lint` — OK.
- `npm run type-check` — OK.
- `npm run build` — OK.

**Validation results — frontend runtime:**
- Dev server route reachability checks on required routes all returned `200`:
  - `/login`, `/`, `/users`, `/users/1`, `/invite`, `/organizations`, `/settings/auth`, `/settings/mfa`.
- Dashboard navigation contract cross-check:
  - `frontend/src/pages/Dashboard.tsx` card routes target `/invite`, `/organizations`, `/users`, `/settings/auth` as required module entrypoints.
- Logout regression check:
  - `POST /auth/logout` -> `204`, then tokenless `GET /auth/me` -> `401`.
- Browser/UI note:
  - In this headless agent context, full visual click-through + browser console inspection was not executed interactively.
  - A10 gate evidence therefore uses route reachability + complete API happy-path matrix + route-map code verification.

**Submission checklist coverage (`Doc/KeyCloak.docx`):**
- Source code -> `backend/` and `frontend/`
- README/setup instructions -> `README.md`
- Implementation guide -> `IMPLEMENTATION_GUIDE_KEYCLOAK.md`
- Seed data -> `backend/src/db/seeds/*.ts`
- Screenshots/demo proof -> `docs/screenshots/*` + `docs/screenshots/README.md`
- Validation evidence -> `STEP_LOG.md` (A1-A10 entries)

**Decisions recorded:**
- A10 static gate order was executed as `migrate -> seed -> seed -> check -> build` to keep fresh-checkout semantics deterministic.
- Runtime validation used deterministic local reset (`reset:test-data` + `seed`) prior to smoke.
- Backend lint requirement is satisfied by `npm run check` (no backend lint script exists).
- `AGENT_EXECUTION_PLAN.md` A10 checklist items were ticked in A10 itself (final Track A step; no later reconciliation step).
- Minor drift introduced by reset hardening was immediately documented in `README.md`, `backend/README.md`, and `IMPLEMENTATION_GUIDE_KEYCLOAK.md`.

**Deferred (post-submission):**
- Apply global auth settings policy directly inside `/auth/login`.
- Per-user MFA enrollment and policy enforcement.
- Real passkey/email/SMS provider integrations.
- Track B (Wazuh SOC) remains untouched and pending B0.
- Existing deferred UX scope from Track A remains unchanged (multi-role matrix, hierarchy UX depth, pixel polish).

**Blockers:** None.

**Status:** A10 complete (Track A ready-to-submit).

## A10 — Post-review hardening fixes (2026-04-26)

**Reason for fixes:**
- A10 review surfaced a reproducibility gap: `npm run reset:test-data` did not reset persisted global settings, so reruns could inherit stale auth/MFA toggle state.

**Files updated:**
- `backend/scripts/reset-test-data.ts`
- `README.md`
- `backend/README.md`
- `IMPLEMENTATION_GUIDE_KEYCLOAK.md`
- `AGENT_EXECUTION_PLAN.md` (A10 checkbox reconciliation)
- `STEP_LOG.md` (this entry)

**Changes made:**
- Extended `reset:test-data` to restore settings singleton (`id=1`) to baseline auth/MFA defaults using upsert+merge.
- Updated docs to reflect the strengthened reset behavior.
- Completed final A10 checklist reconciliation in execution plan.

**Re-validation after fixes:**
- `npm run reset:test-data` -> OK.
- `npm run seed` -> OK.
- `npm run check` -> OK.
- `npm run build` -> OK.
- Full A10 runtime matrix remained green after the fix.

**Status:** A10 hardening fix complete; no regression introduced.

## A10 — Review follow-up alignment fixes (2026-04-26)

**Reason for fixes:**
- External A10 review flagged three documentation/process risks:
  - `frontend/.env` ignore coverage was not explicitly verified,
  - A10 self-tick deviation was documented in log but not visible in plan section,
  - reset utility sequencing on fresh checkout needed explicit wording (`migrate`/`seed` before reset).

**Files updated:**
- `frontend/.gitignore`
- `AGENT_EXECUTION_PLAN.md`
- `README.md`
- `backend/README.md`
- `IMPLEMENTATION_GUIDE_KEYCLOAK.md`
- `STEP_LOG.md` (this entry)

**Changes made:**
- Added explicit frontend env ignore rules:
  - `.env`
  - `.env.*`
  - `!.env.example`
- Added one-line A10 note in plan clarifying deliberate in-step checkbox ticking for final-step reconciliation.
- Added consistent reset sequencing note across docs:
  - on fresh checkout run `npm run migrate` and `npm run seed` first,
  - use `npm run reset:test-data` only after schema initialization.

**Verification:**
- Confirmed `frontend/.gitignore` now covers `.env` files while preserving `.env.example` tracking.
- Confirmed A10 note is present in `AGENT_EXECUTION_PLAN.md` near Step A10 heading.
- Confirmed reset sequencing note appears in all three docs (`README.md`, `backend/README.md`, `IMPLEMENTATION_GUIDE_KEYCLOAK.md`).

**Status:** Follow-up alignment fixes complete; no functional code regression introduced.

## B0 — Scope Lock (2026-04-26)

**Files updated:**
- `AGENT_EXECUTION_PLAN.md`
- `README.md`
- `STEP_LOG.md` (this entry)

**Changes made:**
- Re-confirmed Track B requirement authority as `Doc/Wazuh_SOC.pdf`.
- Locked mandatory Track B module scope to `Triage` and `Incidents` only.
- Marked `Detection` as optional/deferred and not part of baseline mandatory delivery.
- Plan amendment recorded explicitly for downstream agents:
  - Updated B4 gate to post-B5 execution (`execute only after B5 is complete and mandatory scope is stable`) to remove the prior B4/B5 ordering contradiction while preserving "stable mandatory scope first" intent.
- Locked Track B implementation stack to Node.js + TypeScript (backend), React + TypeScript + Vite (frontend), SQLite via Knex, and REST APIs.
- Locked physical isolation boundary for Track B work:
  - use `backend-soc/` and `frontend-soc/` as sibling apps,
  - use `backend-soc/data/soc.sqlite` as the Track B SQLite DB file,
  - do not mix Track B models/routes/tables with Track A unless explicitly approved as platform code.
- Updated Track B file ownership targets in execution-plan steps B1-B4 to `*-soc` paths to remove naming ambiguity before implementation starts.
- Locked Track B UI language default to English (revisit only on explicit reviewer request).

**Validation results (documentation-only step):**
- No application code, scaffolding, migrations, seeds, routes, or components were created/modified in this step.
- Plan consistency check: B0 checklist is fully checked and Track B handoff notes now capture stack + isolation + scope locks.
- README now contains a dedicated Track B scope-lock section and explicitly states implementation has not started.
- Track A untouched check (explicit): `find /Users/shayan/Desktop/Belzir/backend /Users/shayan/Desktop/Belzir/frontend -type f -mmin -8 ! -path "*/node_modules/*"` returned no files during B0 close-out, confirming no writes under `backend/` or `frontend/` in the B0 edit window.

**Decisions recorded:**
- Track B remains non-implemented after B0; this step is decision documentation only.
- Detection stays out of mandatory baseline until mandatory Track B scope and validation are stable.
- Track B branch/folder convention is locked for B1 start to avoid cross-track coupling.

**Deferred:**
- Any Track B code/scaffolding work (`B1+`).
- Detection implementation depth beyond minimal optional support.

**Blockers:** None.

**Status:** B0 complete.

**Next step:** B1 — Data model and seed.

## B1 — Data model and seed (2026-04-26)

**Files updated:**
- `backend-soc/package.json`
- `backend-soc/package-lock.json`
- `backend-soc/tsconfig.json`
- `backend-soc/knexfile.ts`
- `backend-soc/.env.example`
- `backend-soc/.gitignore`
- `backend-soc/data/.gitkeep`
- `backend-soc/src/db/config.ts`
- `backend-soc/src/db/knex.ts`
- `backend-soc/src/db/seedUtils.ts`
- `backend-soc/src/db/migrations/20260426_001_create_alerts.ts`
- `backend-soc/src/db/migrations/20260426_002_create_triage_decisions.ts`
- `backend-soc/src/db/migrations/20260426_003_create_incidents.ts`
- `backend-soc/src/db/migrations/20260426_004_create_incident_alert_links.ts`
- `backend-soc/src/db/migrations/20260426_005_create_incident_comments.ts`
- `backend-soc/src/db/seeds/01_alerts.ts`
- `backend-soc/src/db/seeds/02_incidents.ts`
- `backend-soc/src/db/seeds/03_triage_decisions.ts`
- `backend-soc/src/db/seeds/data/socSeedData.ts`
- `backend-soc/scripts/reset-test-data.ts`
- `backend-soc/README.md`
- `AGENT_EXECUTION_PLAN.md`
- `README.md`
- `STEP_LOG.md` (this entry)

**Changes made:**
- Created isolated Track B backend package in `backend-soc/` with independent Knex + SQLite wiring.
- Implemented the five mandatory B1 tables only:
  - `alerts`
  - `triage_decisions`
  - `incidents`
  - `incident_alert_links`
  - `incident_comments`
- Added schema-level default timestamps (`knex.fn.now()`) for create/link/comment audit columns to reduce B2/B3 write-path fragility.
- Added FK cascade behavior on all dependent relations to prevent orphan rows.
- Added unique composite constraint on `(incident_id, alert_id)` in `incident_alert_links`.
- Added deterministic, fixed UTC seed data (stable IDs, stable timestamps) for alerts/incidents/comments/links/triage decisions.
- Added reset utility `backend-soc/scripts/reset-test-data.ts` that restores DB to deterministic post-seed baseline.
- Added `backend-soc/README.md` with install/migrate/seed/reset usage and seeded ID contracts.
- Updated root docs to reflect B1 completion status and B1 runner commands.
- Updated execution plan B1 section:
  - checked all 3 B1 checkboxes,
  - corrected B1 file targets to data-layer files,
  - added post-B1 handoff notes for B2/B3.

**Schema and seed decisions recorded:**
- Primary key strategy:
  - Chosen: explicit string primary keys (`alert-001`, `incident-001`, `link-001`, `comment-001`, `decision-001`).
  - Reason: deterministic references for B2/B3 fixtures/screenshots and no auto-increment drift.
- Triage decision model:
  - Chosen: append-only `triage_decisions` audit log.
  - `alerts.status` remains materialized current state for queue/filter ergonomics.
  - B2 write-path contract: insert decision + update alert status in one transaction.
- Seed data format:
  - Chosen: inline TypeScript seed objects (`backend-soc/src/db/seeds/data/socSeedData.ts`).
  - No external JSON import required for B1.

**Seeded ID conventions:**
- Alerts: `alert-001` ... `alert-012`
- Incidents: `incident-001`, `incident-002`
- Links: `link-001` ... `link-003`
- Comments: `comment-001` ... `comment-003`
- Decisions: `decision-001` ... `decision-004`

**Validation results:**
- `cd backend-soc && npm install` -> OK.
- `npm run migrate` -> `Batch 1 run: 5 migrations`.
- `npm run migrate` (second run) -> `Already up to date`.
- `npm run seed` -> `Ran 3 seed files`.
- `npm run seed` (second run) -> `Ran 3 seed files` (idempotent).
- `npm run check` -> OK (no TypeScript errors).
- `npm run reset:test-data` -> `SOC test data reset complete.`

SQLite spot checks (`backend-soc/data/soc.sqlite`):
- `alerts` count: `12`
- `incidents` count: `2`
- `incident_alert_links` count: `3`
- `incident_comments` count: `3`
- `triage_decisions` count: `4`
- duplicate `(incident_id, alert_id)` rows: `0`
- per-incident minimum coverage:
  - `incident-001`: links `2`, comments `2`
  - `incident-002`: links `1`, comments `1`
- decision diversity:
  - `escalate:1`, `false_positive:1`, `ignore:1`, `true_positive:1`

FK cascade probe:
- Deleted `incident-001` and confirmed cascaded deletion:
  - links `2 -> 0`
  - comments `2 -> 0`
- Reverted to baseline via `npm run reset:test-data`.

Isolation check:
- `find /Users/shayan/Desktop/Belzir/backend /Users/shayan/Desktop/Belzir/frontend -type f -newer /tmp/b1_start_marker ! -path "*/node_modules/*"` returned no files.
- Confirms no Track A (`backend/`, `frontend/`) writes during B1 implementation.

**Implementation note (resolved during B1):**
- Initial seed run failed because `seedHelpers.ts` was placed under `src/db/seeds/` (Knex requires each file in seed directory to export `seed`).
- Resolved by moving helper to `src/db/seedUtils.ts` and updating imports.

**Deferred:**
- Any HTTP routes/controllers/server bootstrap for Track B (B2+).
- Any `frontend-soc/` implementation (B2+).
- Detection schema/tables/routes (optional B4 only, post mandatory scope stability).

**Blockers:** None.

**Status:** B1 complete.

**Next step:** B2 — Triage module.

## B1 — Review follow-up fixes (2026-04-26)

**Reason for changes:**
- Addressed external B1 review findings before B2 starts.
- Highest-priority fix: remove `updated_at` clobber behavior in triage seed.

**Files updated:**
- `backend-soc/src/db/seeds/03_triage_decisions.ts`
- `backend-soc/src/db/seeds/02_incidents.ts`
- `backend-soc/src/db/seeds/data/socSeedData.ts`
- `backend-soc/src/db/migrations/20260426_001_create_alerts.ts`
- `backend-soc/src/db/migrations/20260426_005_create_incident_comments.ts`
- `backend-soc/src/db/config.ts`
- `backend-soc/package.json`
- `backend-soc/README.md`
- `AGENT_EXECUTION_PLAN.md`
- `README.md`
- `STEP_LOG.md` (this entry)

**Changes made:**
- Fixed triage seed timestamp bug:
  - removed bulk `alerts` reset in `03_triage_decisions.ts` that previously forced all rows to `updated_at='2026-04-26T00:00:00Z'`.
  - seed now updates only the explicitly materialized decision rows.
- Removed redundant incident-table deletes from `02_incidents.ts`:
  - `01_alerts.ts` remains the single full-clear stage for baseline resets.
  - this avoids duplicate delete passes in every `seed:run` cycle.
- Hardened raw JSON contract:
  - `alerts.raw_json` now uses `CHECK (json_valid(raw_json))` in migration `20260426_001_create_alerts.ts`.
- Added timeline-oriented DB index:
  - `incident_comments` now has composite index `(incident_id, created_at)`.
- Improved env portability/typing in DB config:
  - dotenv loads from `backend-soc/.env` using file-relative resolution.
  - sqlite connection typing switched to `better-sqlite3` type.
- Added convenience verification script:
  - `npm run verify` = `migrate && seed && check`.
- Made B2 contracts explicit in docs/plan:
  - canonical decision->status mapping is now documented.
  - `updated_at` write responsibility is explicitly documented for B2/B3 updates.
  - confirmed B1 checklist contains all three `[x]` entries.

**Validation results (re-run after fixes):**
- Fresh DB rebuild: removed `backend-soc/data/soc.sqlite`, then re-ran full flow.
- `npm run migrate` -> `Batch 1 run: 5 migrations`.
- `npm run migrate` (second run) -> `Already up to date`.
- `npm run seed` (twice) -> `Ran 3 seed files` both runs.
- `npm run check` -> OK.
- `npm run reset:test-data` -> `SOC test data reset complete.`
- `npm run verify` -> `Already up to date` then `Ran 3 seed files` (consolidated smoke script passes).
- Row counts unchanged and valid:
  - alerts `12`, incidents `2`, links `3`, comments `3`, triage decisions `4`.
- Duplicate link check still clean: `(incident_id, alert_id)` duplicates `0`.
- New status timestamp regression check:
  - `alerts.status='new'` rows no longer receive a constant reset timestamp.
  - all 8 `new` alerts keep their curated per-alert `updated_at` values.
- JSON validity enforcement check:
  - attempted insert with `raw_json='not-json'` fails (`json_valid` constraint active).
- New comments composite index verified via `PRAGMA index_list('incident_comments')`.

**Status:** B1 remains complete; review follow-up fixes applied.

**Next step:** B2 — Triage module.

## B2 — Triage module (2026-04-26)

**Files updated:**
- `backend-soc/package.json`
- `backend-soc/package-lock.json`
- `backend-soc/.env.example`
- `backend-soc/README.md`
- `backend-soc/src/config/env.ts`
- `backend-soc/src/app.ts`
- `backend-soc/src/server.ts`
- `backend-soc/src/middleware/errorHandler.ts`
- `backend-soc/src/middleware/validateBody.ts`
- `backend-soc/src/middleware/validateQuery.ts`
- `backend-soc/src/middleware/requestLogger.ts`
- `backend-soc/src/middleware/notFound.ts`
- `backend-soc/src/routes/index.ts`
- `backend-soc/src/routes/alerts.ts`
- `backend-soc/src/routes/triage.ts`
- `backend-soc/src/modules/alerts/alerts.schemas.ts`
- `backend-soc/src/modules/alerts/alerts.service.ts`
- `backend-soc/src/modules/alerts/alerts.controller.ts`
- `backend-soc/src/modules/triage/triage.schemas.ts`
- `backend-soc/src/modules/triage/triage.service.ts`
- `backend-soc/src/modules/triage/triage.controller.ts`
- `backend-soc/src/db/config.ts`
- `frontend-soc/.env.example`
- `frontend-soc/.gitignore`
- `frontend-soc/package.json`
- `frontend-soc/package-lock.json`
- `frontend-soc/index.html`
- `frontend-soc/vite.config.ts`
- `frontend-soc/tsconfig.json`
- `frontend-soc/tsconfig.app.json`
- `frontend-soc/tsconfig.node.json`
- `frontend-soc/eslint.config.js`
- `frontend-soc/README.md`
- `frontend-soc/src/main.tsx`
- `frontend-soc/src/App.tsx`
- `frontend-soc/src/index.css`
- `frontend-soc/src/router/index.tsx`
- `frontend-soc/src/layout/AppLayout.tsx`
- `frontend-soc/src/services/api.ts`
- `frontend-soc/src/types/soc.ts`
- `frontend-soc/src/features/triage/api.ts`
- `frontend-soc/src/pages/TriageList.tsx`
- `frontend-soc/src/pages/TriageDetail.tsx`
- `frontend-soc/src/pages/IncidentsPlaceholder.tsx`
- `AGENT_EXECUTION_PLAN.md`
- `README.md`
- `STEP_LOG.md` (this entry)

**Changes made:**
- Implemented Track B backend HTTP layer in `backend-soc`:
  - Express bootstrap, CORS, JSON body parsing, request logging, not-found and error handling.
  - Route groups: `/alerts` and `/triage`, plus `/health`.
- Implemented `alerts` module:
  - `GET /alerts` with server-side `severity/status` filtering, `received_at|severity` sorting, `asc|desc` ordering, and `limit/offset` pagination.
  - `GET /alerts/:id` detail with `raw_json` parsed to JSON object.
- Implemented `triage` module:
  - `POST /triage/alerts/:id/decisions` with Zod validation.
  - Transactional write contract: insert `triage_decisions` audit row and update `alerts.status` + `alerts.updated_at` atomically.
  - Canonical decision->status map enforced exactly as locked in B1.
- Implemented analyst identity fallback for no-auth Track B:
  - `decided_by` precedence: `x-analyst-id` header -> body `decided_by` -> `analyst1` default.
- Scaffoled and implemented `frontend-soc` from scratch:
  - Vite + React + TypeScript app with `/api` proxy to `http://localhost:4100`.
  - SOC layout shell with nav (`Triage` active, `Incidents` placeholder route).
  - `TriageList` page with table columns (ID, timestamp, severity, rule, host, IP, status), severity/status filters, and timestamp/severity sort toggles.
  - `TriageDetail` page with metadata, formatted raw JSON viewer, optional note, and all four triage actions.
  - API services and shared SOC types aligned to backend response contracts.
- Updated docs to reflect B2 completion and handoff contracts for B3.

**Decisions recorded:**
- API contract clarity was locked in B2 to avoid frontend/backend drift:
  - `GET /alerts` returns `{ data, pagination }`.
  - `GET /alerts/:id` returns `{ data }` with parsed `raw_json`.
  - `POST /triage/alerts/:id/decisions` returns `{ data: { decision, alert } }`.
- Sorting/filtering is server-side only (no client fallback) to avoid order drift with pagination.
- Re-triage is allowed by design:
  - `triage_decisions` remains append-only audit history.
  - latest triage write materializes current `alerts.status`.
- Decision IDs use `decision-${randomUUID()}` to avoid collision-prone counter patterns.
- Track B remains intentionally unauthenticated in B2; `decided_by` is best-effort demo identity.

**Validation results:**
- Backend install/type/build:
  - `cd backend-soc && npm install` -> OK.
  - `npm run check` -> OK.
  - `npm run build` -> OK.
  - `npm run verify` -> `Already up to date`, `Ran 3 seed files`.
- Backend runtime smoke (server on `:4100`):
  - `GET /health` -> `200`.
  - `GET /alerts` -> `200`, `pagination.total=12`, `data.length=12`.
  - `GET /alerts?severity=high&status=new&sort=received_at&order=desc` -> `200`, filtered/sorted rows returned.
  - `GET /alerts/alert-001` -> `200`, `.data.raw_json` type = `object`.
  - `GET /alerts/does-not-exist` -> `404`.
  - `POST /triage/alerts/alert-004/decisions` with invalid decision -> `400` Zod error shape.
  - Four action writes on `alert-004..007` -> all `201`; status transitions matched map:
    - `true_positive` -> `triaged`
    - `false_positive` -> `triaged`
    - `ignore` -> `ignored`
    - `escalate` -> `escalated`
  - SQLite spot check after writes:
    - `triage_decisions` count `4 -> 8`.
    - targeted alert statuses updated correctly.
  - Baseline restore:
    - `npm run reset:test-data` -> `SOC test data reset complete.`
    - post-reset spot check -> `alerts=12`, `triage_decisions=4`, `newAlerts=8`.
- Frontend install/type/build/lint:
  - `cd frontend-soc && npm install` -> OK.
  - `npm run type-check` -> OK.
  - `npm run build` -> OK.
  - `npm run lint` -> initially failed on `react-hooks/set-state-in-effect`; fixed in `TriageDetail.tsx`; re-run -> OK.
- Frontend runtime smoke (with backend + frontend dev servers running):
  - `GET /` -> `200`
  - `GET /triage` -> `200`
  - `GET /triage/alert-004` -> `200`
  - `GET /incidents` -> `200`

**Implementation note (resolved during B2):**
- First B2 runtime smoke failed with `no such table: alerts` despite successful seeds.
- Root cause: built runtime resolved DB/env path under `dist/` due `__dirname`-relative root logic.
- Fix: switched `backend-soc/src/db/config.ts` and `backend-soc/src/config/env.ts` root detection to `process.cwd()` for consistent TS + compiled runtime behavior.

**Deferred:**
- Incidents API/pages (`B3`).
- Alert-linking-to-incident behaviors (`B3`).
- Detection module (`B4`, optional post-B5).
- Automated test runner for Track B (out of B2 scope).

**Blockers:** None.

**Status:** B2 complete.

**Next step:** B3 — Incidents module.

## B2 — Review follow-up (2026-04-26)

**Reason for changes:**
- Addressed post-B2 implementation review findings before B3 starts.

**Files updated:**
- `backend-soc/src/config/projectRoot.ts`
- `backend-soc/src/config/env.ts`
- `backend-soc/src/db/config.ts`
- `backend-soc/src/modules/alerts/alerts.schemas.ts`
- `backend-soc/src/modules/alerts/alerts.service.ts`
- `backend-soc/README.md`
- `AGENT_EXECUTION_PLAN.md`
- `README.md`
- `STEP_LOG.md` (this entry)

**Changes made:**
- Restored file-relative env portability (without breaking compiled runtime):
  - introduced `resolveProjectRoot(__dirname)` helper used by both env and DB config.
  - works for both `src/*` and `dist/src/*` execution contexts.
- Hardened query validation:
  - `GET /alerts` schema is now `.strict()`, so unknown query keys return `400` instead of being silently ignored.
- Added explicit code safety note on severity sort SQL helper contract.
- Expanded B2 handoff/docs for reviewer-raised risks:
  - response envelope convention note,
  - runtime decision ID strategy (seeded numeric IDs vs runtime UUID IDs),
  - no-auth `decided_by` trust limitation,
  - concurrent re-triage last-write-wins behavior,
  - audit history currently write-only at API layer (DB-visible only), with B3 note for optional read endpoint.

**Validation results:**
- `cd backend-soc && npm run check` -> OK.
- `npm run build` -> OK.
- `npm run verify` -> OK (`Already up to date`, `Ran 3 seed files`).
- Build output check (`find dist -maxdepth 3 -type f`) confirms compiled server at `dist/src/server.js`.
- Runtime smoke from repo root (`node backend-soc/dist/src/server.js`):
  - `GET /alerts?bogus=1` -> `400` with strict schema error.
  - `GET /health` -> `200`.

**Decisions / non-changes:**
- Kept `decision-${uuid}` for runtime writes (collision safety); documented explicitly as separate from deterministic seed IDs.
- Did not add `GET /alerts/:id/decisions` in B2 (kept scope); documented as B3 candidate if timeline/audit UX needs it.

**Status:** B2 remains complete and is now review-hardened.

**Next step:** B3 — Incidents module.

## B3 — Incidents module (2026-04-26)

**Reason for changes:**
- Implemented mandatory Track B Incidents scope from `Doc/Wazuh_SOC.pdf` with backend + frontend integration.

**Files created:**
- `backend-soc/src/routes/incidents.ts`
- `backend-soc/src/modules/incidents/incidents.schemas.ts`
- `backend-soc/src/modules/incidents/incidents.service.ts`
- `backend-soc/src/modules/incidents/incidents.controller.ts`
- `frontend-soc/src/features/incidents/api.ts`
- `frontend-soc/src/pages/IncidentsList.tsx`
- `frontend-soc/src/pages/IncidentDetail.tsx`

**Files updated:**
- `backend-soc/src/routes/index.ts`
- `frontend-soc/src/router/index.tsx`
- `frontend-soc/src/layout/AppLayout.tsx`
- `frontend-soc/src/services/api.ts`
- `frontend-soc/src/types/soc.ts`
- `frontend-soc/src/index.css`
- `backend-soc/README.md`
- `frontend-soc/README.md`
- `README.md`
- `AGENT_EXECUTION_PLAN.md`
- `STEP_LOG.md` (this entry)

**Files removed:**
- `frontend-soc/src/pages/IncidentsPlaceholder.tsx`

**Changes made:**
- Added Incidents backend API with strict validation and response-envelope conventions:
  - `GET /incidents` with `severity/status/sort/order/limit/offset` and strict unknown-query rejection.
  - `GET /incidents/:id` returning `incident + alerts + comments + timeline`.
  - `POST /incidents` and `PATCH /incidents/:id`.
  - `POST /incidents/:id/alerts` (duplicate link normalized to `409`).
  - `POST /incidents/:id/comments` with demo analyst fallback (`x-analyst-id` -> body `author` -> `analyst1`).
- Implemented timeline composition and deterministic ordering:
  - sources: incident `created_at`, optional `updated_at`, link `linked_at`, comment `created_at`.
  - sort: timestamp ascending, then stable event id ascending.
- Enforced incident write-path timestamp contract:
  - `PATCH`, link, and comment paths all update `incidents.updated_at` explicitly.
- Replaced incidents placeholder UI with working pages:
  - `/incidents`: list table (ID/title/severity/status/alert count), filters/sort, create incident form.
  - `/incidents/:id`: metadata, linked alerts, comments, timeline, and forms for update/link/comment.
- Kept Track B isolation and scope boundaries:
  - no Track A code changes.
  - no workflow engine or Detection implementation in B3.

**Validation results:**
- Backend compile/verification:
  - `cd backend-soc && npm run check` -> OK.
  - `npm run build` -> OK.
  - `npm run verify` -> OK (`Already up to date`, `Ran 3 seed files`).
- Backend runtime smoke (compiled server on `:4100`):
  - `GET /health` -> `200`.
  - `GET /incidents` -> `200`, `data.length=2`, `total=2`.
  - `GET /incidents?bogus=1` -> `400`.
  - `GET /incidents/incident-001` -> `200`, includes `incident/alerts/comments/timeline`.
  - `POST /incidents` -> `201` (created runtime `incident-${uuid}`).
  - `PATCH /incidents/:id` -> `200` (status/severity/title updated; `updated_at` changed).
  - `POST /incidents/:id/alerts` -> `201`.
  - repeated `POST /incidents/:id/alerts` for same alert -> `409`.
  - `POST /incidents/:id/comments` -> `201`.
  - `GET /incidents/:id` after mutations -> linked alert + comment present; timeline sorted deterministically and includes expected event types.
  - not-found checks:
    - `GET /incidents/incident-does-not-exist` -> `404`
    - `POST /incidents/:id/alerts` with unknown alert -> `404`
    - `POST /incidents/unknown/alerts` -> `404`
- Frontend checks:
  - `cd frontend-soc && npm run type-check` -> OK.
  - `npm run lint` -> initially failed (`react-hooks/set-state-in-effect` in `IncidentDetail.tsx`), fixed and re-run -> OK.
  - `npm run build` -> OK.
- Frontend runtime smoke:
  - `/incidents` -> `200`.
  - `/incidents/incident-001` -> `200`.
- Baseline restore after mutation smoke:
  - `cd backend-soc && npm run reset:test-data` -> `SOC test data reset complete.`
  - SQLite spot check -> `alerts=12, incidents=2, links=3, comments=3`.

**Notes:**
- In this environment, some `tsx`/port-binding commands required running outside sandbox due EPERM restrictions; reruns succeeded with approval.

**Deferred / non-changes:**
- Detection module remains deferred (`B4`, optional post-B5).
- `GET /alerts/:id/decisions` remains out of scope for B3.

**Blockers:** None.

**Status:** B3 complete.

**Next step:** B5 — Documentation and validation gate (`B4` remains optional/deferred).

## B5 — Documentation and validation gate (2026-04-26)

**Files created:**
- `IMPLEMENTATION_GUIDE_WAZUH.md`
- `docs/screenshots/10-soc-triage-list.png`
- `docs/screenshots/11-soc-triage-detail.png`
- `docs/screenshots/12-soc-incidents-list.png`
- `docs/screenshots/13-soc-incident-detail.png`

**Files updated:**
- `README.md`
- `docs/screenshots/README.md`
- `AGENT_EXECUTION_PLAN.md`
- `STEP_LOG.md` (this entry)

**Changes made:**
- Added Track B implementation guide `IMPLEMENTATION_GUIDE_WAZUH.md` with:
  - overview/scope lock,
  - architecture,
  - setup/run/reset,
  - module behavior for mandatory `Triage` + `Incidents`,
  - sample data/seed contracts,
  - validation summary,
  - assumptions/limitations,
  - future improvements,
  - submission-checklist mapping to `Doc/Wazuh_SOC.pdf`.
- Updated root `README.md` for B5 state:
  - repository now presented as dual-track deliverable,
  - Track B status advanced through B5,
  - Track B setup/run/reset instructions clarified,
  - explicit links added to Track B implementation guide and screenshot artifacts,
  - Detection remains explicitly deferred.
- Updated `docs/screenshots/README.md` to include separate Track A + Track B sections and index the four new Track B artifacts.
- Marked all B5 checklist items complete in `AGENT_EXECUTION_PLAN.md` while preserving B4 optional/deferred wording.

**Validation results — backend static (`backend-soc`):**
- `npm run check` -> OK.
- `npm run build` -> OK.
- `npm run verify` -> OK (`Already up to date`, `Ran 3 seed files`).
- Note: initial non-escalated verify attempt failed in sandbox with `tsx` IPC `EPERM`; rerun outside sandbox succeeded.

**Validation results — frontend static (`frontend-soc`):**
- `npm run lint` -> OK.
- `npm run type-check` -> OK.
- `npm run build` -> OK.

**Validation results — backend runtime endpoint health/matrix (`:4100`):**
- `GET /health` -> `200`
- `GET /alerts` -> `200`
- `GET /alerts?bogus=1` -> `400`
- `GET /alerts/alert-001` -> `200`
- `GET /incidents` -> `200`
- `GET /incidents?bogus=1` -> `400`
- `GET /incidents/incident-001` -> `200`

**Validation results — happy paths:**
- Triage happy path:
  - `POST /triage/alerts/alert-004/decisions` with `escalate` -> `201`
  - response confirmed status transition `new -> escalated`.
- Incidents happy path:
  - `POST /incidents` -> `201` (`incident-60821d4e-34b6-4a2d-b349-41f360845cf5`)
  - `PATCH /incidents/:id` -> `200`
  - `POST /incidents/:id/alerts` (`alert-005`) -> `201`
  - `POST /incidents/:id/comments` -> `201`
  - `GET /incidents/:id` -> `200` with validation check:
    - `hasAlert=true`
    - `hasComment=true`
    - `timelineCount=4`

**Validation results — frontend runtime reachability (`:5174`):**
- `GET /` -> `200`
- `GET /triage` -> `200`
- `GET /triage/alert-001` -> `200`
- `GET /incidents` -> `200`
- `GET /incidents/incident-001` -> `200`

**Screenshot/demo proof:**
- Captured via headless Chrome from live Track B stack:
  - `docs/screenshots/10-soc-triage-list.png`
  - `docs/screenshots/11-soc-triage-detail.png`
  - `docs/screenshots/12-soc-incidents-list.png`
  - `docs/screenshots/13-soc-incident-detail.png`
- Capture dimensions verified: all four are `1800x1200`.

**Post-smoke baseline restore:**
- `cd backend-soc && npm run reset:test-data` -> `SOC test data reset complete.`
- SQLite spot check after reset:
  - `alerts=12, incidents=2, links=3, comments=3, decisions=4`.

**Submission checklist coverage (`Doc/Wazuh_SOC.pdf`):**
- Source code -> `backend-soc/` + `frontend-soc/`
- Setup/run instructions -> `README.md`, `backend-soc/README.md`, `frontend-soc/README.md`
- Implementation guide -> `IMPLEMENTATION_GUIDE_WAZUH.md`
- Sample/seed data -> `backend-soc/src/db/seeds/*` + reset script
- Mandatory modules (`Triage`, `Incidents`) -> implemented and runtime-validated in this entry
- Screenshots/demo proof -> `docs/screenshots/10-13` + `docs/screenshots/README.md`

**Deferred / non-changes:**
- Detection module (`B4`) remains optional/deferred post-B5.
- No Track A implementation scope changes in this step.

**Blockers:** None.

**Status:** B5 complete.

**Next step:** B4 (optional post-B5 stretch, deferred unless explicitly requested).
