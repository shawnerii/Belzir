# Screenshot Index (Track A + Track B)

## Track A — Simplified KeyCloak IAM

Capture date: 2026-04-25
Capture source: local running stack (`backend` + `frontend`) using headless Chrome automation.

### Files

- `00-login.png` — Login screen (`Doc/000--Login-Screen.png`)
- `01-dashboard.png` — Dashboard after authenticated session (`Doc/010--Main-Dashboard-after-successful-login.png`)
- `02-user-management-list.png` — User management list/create page (`Doc/040--User-Management-without-selected-user.png`)
- `03-user-management-detail.png` — User detail/edit page (`Doc/042--Change-User-Setting.png`)
- `04-invite-users.png` — Invite users module (`Doc/021--Invite-User-Screen.png`)
- `05-organizations-empty.png` — Organizations page empty-search state (`Doc/030--Orgnization-Change.png`)
- `06-organizations-create.png` — Organizations page after create action (`Doc/031--Create-New-Organization.png`)
- `07-organizations-assign-users.png` — Organizations page assign-user workflow state (`Doc/030--Orgnization-Change.png`, `Doc/031--Create-New-Organization.png`)
- `08-global-settings-auth.png` — Global authentication settings (`Doc/050--Global-Settings--User-Authentication.png`)
- `09-global-settings-mfa.png` — Global MFA settings (`Doc/051--Global-Settings--User-MFA.png`)

## Track B — Wazuh SOC

Capture date: 2026-04-26
Capture source: local running stack (`backend-soc` + `frontend-soc`) using headless Chrome automation.

### Files

- `10-soc-triage-list.png` — Triage queue list (`/triage`)
- `11-soc-triage-detail.png` — Triage detail with raw JSON and actions (`/triage/alert-001`)
- `12-soc-incidents-list.png` — Incidents list + create panel (`/incidents`)
- `13-soc-incident-detail.png` — Incident detail timeline/alerts/comments (`/incidents/incident-001`)

All filenames are referenced by `README.md`, `IMPLEMENTATION_GUIDE_KEYCLOAK.md`, and `IMPLEMENTATION_GUIDE_WAZUH.md`.
