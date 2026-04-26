# Backend — KeyCloak IAM

## Stack decisions
- **Database**: SQLite via Knex.js (`better-sqlite3`). Zero external service required.
- **Auth**: JWT (stateless). Secret loaded from `JWT_SECRET` env var.
- **SQLite integrity**: foreign-key enforcement is enabled on every connection via `PRAGMA foreign_keys = ON`.

## Setup

```bash
cp .env.example .env
# Edit .env and set JWT_SECRET to a strong random string

npm install
npm run migrate   # creates SQLite DB and applies migrations
npm run seed      # inserts default admin user (admin@example.com)
npm run dev       # starts server on port 4000 with hot reload
```

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start with tsx watch (hot reload) |
| `npm run build` | Compile TypeScript to dist/ |
| `npm run check` | Type-check without emitting files |
| `npm run start` | Run compiled output |
| `npm run migrate` | Apply pending migrations |
| `npm run seed` | Insert seed data (idempotent) |

## Default admin credentials
- Email: `admin@example.com`
- Password: value of `SEED_ADMIN_PASSWORD` in `.env` (default: `ChangeMe123!`)

## Schema note
The `users.role` column is a single string (`'user'` or `'admin'`) serving as a
temporary baseline. Multi-role permission matrices and org-level authorization
are deferred to later steps.

## Auth API

All endpoints return JSON unless noted. Errors use `{ "error": "<message>" }`.

### `POST /auth/login`
Body:
```json
{ "usernameOrEmail": "admin", "password": "ChangeMe123!" }
```
- `usernameOrEmail` is trimmed; matching is case-insensitive (NFKC + `LOWER`).
- `password` is **not** trimmed.

Success (`200`):
```json
{
  "token": "<jwt>",
  "tokenType": "Bearer",
  "expiresIn": 28800,
  "user": { "id": 1, "email": "admin@example.com", "username": "admin", "role": "admin" }
}
```
- `expiresIn` is seconds until expiry, derived from `JWT_EXPIRES_IN`.

Failures:
- `400` — invalid body (missing fields).
- `401` `Invalid credentials` — unknown user, wrong password, **or** inactive account. The unknown-user branch runs a dummy `bcrypt.compare` to equalize response time and prevent enumeration.

### `POST /auth/logout`
Stateless acknowledgment. Returns `204` regardless of whether the caller sent a valid token. Client-side logout (clearing the stored token) is authoritative.

### `GET /auth/me`
Requires `Authorization: Bearer <token>`.

- `200` — `{ "user": { id, email, username, role } }`.
- `401` — missing/invalid token, **or** token references a deleted or deactivated user.

## Users API

All `/users/*` endpoints are **admin-only** and require `Authorization: Bearer <token>`.
Errors use `{ "error": "<message>" }`.

User object shape:
```json
{
  "id": 12,
  "firstName": "Admin",
  "lastName": "User",
  "username": "admin",
  "email": "admin@example.com",
  "phone": null,
  "role": "admin",
  "isActive": true,
  "isSystem": true,
  "organizations": [
    {
      "id": 2,
      "name": "Partner",
      "slug": "partner",
      "parentId": null
    }
  ]
}
```
- `organizations` is included on `GET /users/:id`.
- Endpoints returning a single `user` payload after create/update/activate/deactivate also include `organizations`.

Endpoints:
- `GET /users?q=&isActive=` — list/search users.
- `GET /users/:id` — fetch single user, including assigned `organizations`.
- `POST /users` — create user.
  - Accepts `firstName,lastName,username,email,phone?,role?,password?`.
  - `username` must match `[A-Za-z0-9._-]+` (no whitespace, no `@`).
  - If `password` is omitted, response is `{ "user": ..., "temporaryPassword": "..." }`.
  - If `password` is provided, response is `{ "user": ... }`.
- `PATCH /users/:id` — partial update (non-empty patch required).
  - To clear phone, send `"phone": null`. Empty-string phone values are rejected.
- `DELETE /users/:id` — hard delete.
- `POST /users/:id/activate` — activate user.
- `POST /users/:id/deactivate` — deactivate user.
- `POST /users/:id/reset-password` — simulated reset, returns `{ "temporaryPassword": "..." }`.

Safety rules:
- `email` and `username` are normalized on write (`NFKC + trim + lowercase`).
- Unique collisions on normalized identifiers return `409`.
- `password_hash` is never returned.
- Self-delete, self-deactivate, and self admin-demotion are blocked.
- Self reset-password is blocked.
- `is_system=true` users are immutable for sensitive fields and cannot be deactivated/deleted.

## Organizations API

All `/organizations/*` endpoints are **admin-only** and require `Authorization: Bearer <token>`.

### `GET /organizations`

Returns organizations for org-management and invite-selector usage.

Query params (all optional):
- `q` — case-insensitive match on `name` and `slug`
- `limit` — integer `1..200`
- `offset` — integer `>= 0`

Array query params are rejected with `400`.

Success (`200`):
```json
{
  "organizations": [
    {
      "id": 1,
      "name": "Kunden",
      "slug": "kunden",
      "parentId": null,
      "createdAt": "2026-04-25T17:10:00.000Z",
      "updatedAt": "2026-04-25T17:10:00.000Z"
    }
  ]
}
```

Failure codes:
- `400` — invalid query params.
- `401` — missing/invalid token.
- `403` — authenticated but non-admin role.

### `POST /organizations`
Body:
```json
{
  "name": "Acme",
  "parentId": null
}
```
- `name` is required, trimmed, NFKC-normalized.
- `slug` is derived from `name` (`NFKC + lowercase + non-alphanumeric => '-'`).
- `parentId` is optional/nullable.

Success (`201`):
```json
{
  "organization": {
    "id": 4,
    "name": "Acme",
    "slug": "acme",
    "parentId": null,
    "createdAt": "2026-04-25T17:30:00.000Z",
    "updatedAt": "2026-04-25T17:30:00.000Z"
  }
}
```

Failure codes:
- `400` — invalid body.
- `404` — parent organization not found.
- `409` — slug collision (for example similarly normalized names).
- `401`, `403` — auth/role failures.

### `DELETE /organizations/:id`
- Deletes an organization only when safe.
- `204` on success.

Delete-block semantics (`409` with structured `details.reason`):
- `organization_has_users` — user assignments exist.
- `organization_has_invitations` — invitation rows reference the org.
- `organization_has_children` — child organizations exist.
- `organization_referenced` — DB-level FK block/race safety fallback.

Other failure codes:
- `404` — organization not found.
- `401`, `403` — auth/role failures.

### `GET /organizations/:id/users`
Returns users assigned to the organization.

Success (`200`):
```json
{
  "users": [
    {
      "id": 15,
      "firstName": "Max",
      "lastName": "Mustermann",
      "username": "max",
      "email": "max@example.com",
      "isActive": true
    }
  ]
}
```

Failure codes:
- `404` — organization not found.
- `401`, `403` — auth/role failures.

### `POST /organizations/:id/users`
Body:
```json
{ "userId": 15 }
```
- Assigns a user to an organization.
- Idempotent:
  - first insert => `201`
  - existing assignment => `200`

Success payload:
```json
{
  "assignment": {
    "organizationId": 2,
    "userId": 15,
    "createdAt": "2026-04-25T18:00:00.000Z",
    "user": {
      "id": 15,
      "firstName": "Max",
      "lastName": "Mustermann",
      "username": "max",
      "email": "max@example.com",
      "isActive": true
    }
  }
}
```

Failure codes:
- `400` — invalid body/params.
- `404` — organization or user not found.
- `401`, `403` — auth/role failures.

### `DELETE /organizations/:id/users/:userId`
- Removes user assignment from organization.
- Idempotent: returns `204` even when assignment row or entities are already missing.

Failure codes:
- `400` — invalid route params.
- `401`, `403` — auth/role failures.

## Settings API

All `/settings/*` endpoints are **admin-only** and require `Authorization: Bearer <token>`.

Response shape:
```json
{
  "settings": {
    "id": 1,
    "passkeys": false,
    "password": true,
    "email_passcodes": false,
    "mobile_passcodes": false,
    "delete_password_on_passkey": false,
    "mfa_totp": false,
    "mfa_email": false,
    "mfa_sms": false,
    "created_at": "2026-04-25 19:41:47",
    "updated_at": "2026-04-25 19:44:32"
  }
}
```

### `GET /settings`
- Returns the singleton settings row.
- If the row is missing (manual DB drift), backend auto-creates defaults and returns them.

Failure codes:
- `401` — missing/invalid token.
- `403` — authenticated but non-admin.

### `PATCH /settings/auth`
Body supports partial updates of:
- `passkeys`
- `password`
- `email_passcodes`
- `mobile_passcodes`
- `delete_password_on_passkey`

Rules:
- Body must contain at least one allowed field.
- Unknown fields are rejected with `400`.
- If resulting `passkeys=false`, backend coerces `delete_password_on_passkey=false`.
  - This coercion is authoritative server behavior. If a request sends `{"passkeys":false,"delete_password_on_passkey":true}`, the persisted value and response payload return `delete_password_on_passkey=false`.
- Guardrail prevents full auth lockout. If all primary auth methods would become disabled (`passkeys`, `password`, `email_passcodes`, `mobile_passcodes` all false), update is rejected with:
  - `409`
  - `details.reason = "auth_methods_lockout"`

Failure codes:
- `400` — empty patch, unknown field, or invalid body.
- `409` — lockout guardrail or optimistic-write conflict.
- `401`, `403` — auth/role failures.

### `PATCH /settings/mfa`
Body supports partial updates of:
- `mfa_totp`
- `mfa_email`
- `mfa_sms`

Rules:
- Body must contain at least one allowed field.
- Unknown fields are rejected with `400`.
- Disabling all MFA methods is currently allowed in A8 scope.

Failure codes:
- `400` — empty patch, unknown field, or invalid body.
- `409` — optimistic-write conflict.
- `401`, `403` — auth/role failures.

## Resetting test data

Use this only for local/dev cleanup. It is destructive by design.
On a fresh checkout, run `npm run migrate` and `npm run seed` first so tables exist.

```bash
npm run reset:test-data
```

Behavior:
- deletes all `invitations` rows
- deletes all `organization_users` rows
- deletes all `organizations` rows
- deletes non-system users except the seed admin email
- restores `settings` row `id=1` to auth/MFA baseline defaults
- re-seeds demo organizations (`Kunden`, `Partner`, `Intern`)

## Invitations API

All `/invitations/*` endpoints are **admin-only** and require `Authorization: Bearer <token>`.

Invitation object shape:
```json
{
  "id": 10,
  "email": "new.user@example.com",
  "emailNormalized": "new.user@example.com",
  "organizationId": 1,
  "organizationName": "Kunden",
  "organizationSlug": "kunden",
  "status": "pending",
  "invitedByUserId": 1,
  "createdAt": "2026-04-25T17:14:20.000Z",
  "updatedAt": "2026-04-25T17:14:20.000Z"
}
```

### `POST /invitations`
Body:
```json
{
  "emails": ["a@example.com", "b@example.com"],
  "organizationId": 1
}
```

Rules:
- `emails` supports 1..50 entries.
- Email normalization is `NFKC + trim + lowercase`.
- Duplicate pending invitation key is `(email_normalized, organization_id, status='pending')`.
- Mixed batches are accepted: per-email status is returned as `created | duplicate | invalid`.
- If **all** emails are invalid, API returns `400`.

Success (`201`) response:
```json
{
  "organization": { "id": 1, "name": "Kunden", "slug": "kunden" },
  "results": [
    {
      "input": "A@Example.com",
      "email": "A@Example.com",
      "emailNormalized": "a@example.com",
      "status": "created",
      "invitation": { "...": "..." }
    },
    {
      "input": "bad",
      "email": "bad",
      "emailNormalized": "bad",
      "status": "invalid",
      "reason": "Invalid email format"
    },
    {
      "input": "A@EXAMPLE.COM",
      "email": "A@EXAMPLE.COM",
      "emailNormalized": "a@example.com",
      "status": "duplicate",
      "reason": "Pending invitation already exists for this organization"
    }
  ],
  "summary": { "requested": 3, "created": 1, "duplicate": 1, "invalid": 1 }
}
```

Failure codes:
- `400` — invalid body, invalid query params, or all-emails-invalid.
- `401` — missing/invalid token.
- `403` — authenticated but non-admin role.
- `404` — organization not found.

### `GET /invitations`
Query params:
- `q` (optional): case-insensitive match on email/org name/org slug
- `organizationId` (optional): integer filter
- `status` (optional): `pending | revoked | accepted`
- `limit` (optional, default `10`, max `100`)

Success (`200`):
```json
{ "invitations": [ { "...": "..." } ] }
```

### `POST /invitations/:id/revoke`
- Sets status to `revoked` (idempotent if already revoked).
- Returns `404` if invite id does not exist.
- Returns `409` if invite is already `accepted`.

### Env
- `JWT_SECRET` — required; signing secret.
- `JWT_EXPIRES_IN` — token lifetime (e.g. `15m`, `1h`, `8h`, `7d`). Default `8h`.

### Seed admin verification
```bash
npm run migrate && npm run seed
npm run dev
curl -X POST http://localhost:4000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"usernameOrEmail":"admin","password":"ChangeMe123!"}'
```

### Documented limitations (deferred)
- Stateless JWT — no server-side revocation. Logout relies on client clearing the token; a leaked token remains valid until expiry.
- No rate limiting on `/auth/login`. Add `express-rate-limit` or equivalent before production.
- No refresh tokens. Users re-authenticate when `expiresIn` elapses.
