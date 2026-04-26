# Doc Folder Reference Index

## Purpose
This file is a complete index of all files inside `Doc/` with practical descriptions.
Use it to quickly find the source file for any required detail while coordinating agents.

## File inventory (complete)
- `Doc/000--Login-Screen.png`
- `Doc/010--Main-Dashboard-after-successful-login.png`
- `Doc/021--Invite-User-Screen.png`
- `Doc/030--Orgnization-Change.png`
- `Doc/031--Create-New-Organization.png`
- `Doc/040--User-Management-without-selected-user.png`
- `Doc/042--Change-User-Setting.png`
- `Doc/050--Global-Settings--User-Authentication.png`
- `Doc/051--Global-Settings--User-MFA.png`
- `Doc/KeyCloak.docx`
- `Doc/Wazuh_SOC.pdf`

## Quick lookup by topic
- Login UI: `Doc/000--Login-Screen.png`
- Main dashboard and module cards: `Doc/010--Main-Dashboard-after-successful-login.png`
- Invite users: `Doc/021--Invite-User-Screen.png`
- Organization list/search/create/delete:
  - `Doc/030--Orgnization-Change.png`
  - `Doc/031--Create-New-Organization.png`
- User create and user detail/edit:
  - `Doc/040--User-Management-without-selected-user.png`
  - `Doc/042--Change-User-Setting.png`
- Global auth and MFA settings:
  - `Doc/050--Global-Settings--User-Authentication.png`
  - `Doc/051--Global-Settings--User-MFA.png`
- Full IAM requirements: `Doc/KeyCloak.docx`
- Full SOC requirements: `Doc/Wazuh_SOC.pdf`

---

## Detailed file descriptions

### 1) `Doc/000--Login-Screen.png`
- Type: PNG image, 716 x 876.
- What it contains:
  - Card-style login screen.
  - Labels: `Welcome`, `Log in`, `Username or email`.
  - Username field shown with value `admin`.
  - Primary button: `Log in`.
  - Link text: `Dont have an account? Sign up here`.
  - Divider `OR`.
  - Social button with Google branding.
- What to use it for:
  - Login page structure and required visible controls.

### 2) `Doc/010--Main-Dashboard-after-successful-login.png`
- Type: PNG image, 3736 x 1440.
- What it contains:
  - Search section: `Benutzer suchen` with search field and search button.
  - Four main navigation cards:
    - `Benutzer einladen`
    - `Organisation andern` (card title style in screenshot)
    - `Benutzer verwalten`
    - `Globale Einstellungen`
- What to use it for:
  - Dashboard route and entry points to each module.

### 3) `Doc/021--Invite-User-Screen.png`
- Type: PNG image, 3756 x 1796.
- What it contains:
  - Left navigation and user list panel with search (`Benutzer suchen`).
  - Example users:
    - `NewTest User` / `abc@test.de`
    - multiple `John Doe` entries with generated emails.
  - Right panel:
    - `Email Addressen eingeben` large input area.
    - `Organisation wechseln` section.
    - Helper text (German): click to search/select/drag organizations from tree.
    - Action button: `Einladen`.
- What to use it for:
  - Invite flow requirements: input emails + assign organization + submit.

### 4) `Doc/030--Orgnization-Change.png`
- Type: PNG image, 3764 x 1764.
- What it contains:
  - Organization management screen state with no results.
  - Search bar: `Organisation suchen`.
  - Buttons: `Erstellen` and `Loschen`.
  - Empty state message: `Keine Organisationen gefunden.`
  - Left side still shows user list panel.
- What to use it for:
  - Organization search/create/delete controls and empty-state behavior.

### 5) `Doc/031--Create-New-Organization.png`
- Type: PNG image, 3760 x 1792.
- What it contains:
  - Success banner: `Die Organisation wurde erstellt.`
  - Organization tree area showing `Kunden` with:
    - `Keine Benutzer`
    - `Keine Unterorganisationen`
  - Modal dialog `Organisation erstellen` with text:
    - Choose parent organization or leave empty to create root organization.
    - Then provide new organization name.
  - Fields:
    - `Obergeordnote Organisation` (dropdown in screenshot spelling)
    - `Name` with value `Partner`
  - Actions: `Abbrechen` and `Ja`.
- What to use it for:
  - Create-organization flow, parent-child hierarchy support, success feedback.

### 6) `Doc/040--User-Management-without-selected-user.png`
- Type: PNG image, 3768 x 1744.
- What it contains:
  - User management page with no selected user detail.
  - Left panel: searchable user list + selection checkboxes.
  - Right panel user creation form fields:
    - `Vorname`
    - `Nachname`
    - `Benutzername`
    - `Email`
    - `Telefonnummer`
  - Organization selector section: `Organisation wechseln`.
  - Action button: `Benutzer anlegen` (shown disabled style).
- What to use it for:
  - User creation form fields and layout.

### 7) `Doc/042--Change-User-Setting.png`
- Type: PNG image, 3764 x 1796.
- What it contains:
  - Search is filtered to `kirsche`.
  - Selected user: `Kai Kirsche`, username `kkirsche`, email `kkirsche@intension.de`.
  - Account toggle shown as enabled.
  - Overflow menu entries:
    - `Benutzer bearbeiten`
    - `Benutzer loschen`
    - `Passwort zurucksetzen`
    - `Autorisierung Fur Organisationen`
  - Permission block: `Globale Berechtigungen` with checkboxes:
    - `Systemadministrator`
    - `Globaler Benutzeradministrator`
    - one additional `Globaler 3rd-Level ...` label partially obscured by menu
  - Informational blocks:
    - `Benutzer Authentifizierung` status text
    - `Multifaktor Authentifizierung` status text
  - Organization assignment section with chip: `Partner`.
- What to use it for:
  - User detail/edit/delete/reset-password/role authorization behavior.
- Accuracy note:
  - One permission label is partially hidden; do not assume exact hidden suffix.

### 8) `Doc/050--Global-Settings--User-Authentication.png`
- Type: PNG image, 3840 x 1792.
- What it contains:
  - Page title: `Globale Einstellungen`.
  - Left settings menu:
    - `Benutzer Authentifizierung` (selected)
    - `Multifaktor Authentifizierung`
  - Main section `Benutzer Authentifizierung` with toggle cards:
    - `Passkeys` (off in screenshot)
    - nested `Passwort loschen` (off/disabled style)
    - `Passwort` (on)
    - `E-Mail Passcodes` (off)
    - `Mobilfunknummer` (off)
  - Descriptive text for each method.
- What to use it for:
  - Global login method policy toggles and persistence expectations.

### 9) `Doc/051--Global-Settings--User-MFA.png`
- Type: PNG image, 3764 x 1788.
- What it contains:
  - Same settings page shell as previous image.
  - Left menu with `Multifaktor Authentifizierung` selected.
  - MFA cards:
    - `Einmalpassworter (TOTP-App)` (off)
    - `E-Mail Passcodes` (off)
    - `Mobilfunknummer` (off)
  - Description text indicates email/SMS can be fallback if no TOTP app.
- What to use it for:
  - Global MFA method toggles and fallback logic.

### 10) `Doc/KeyCloak.docx`
- Type: Microsoft Word document.
- What it contains:
  - Challenge title: `Werkstudent Coding Challenge: Simplified KeyCloak`.
  - Objective: build simplified IAM web app from provided UI screens.
  - Timeline: present in source brief (intentionally not fixed in this index).
  - Required stack:
    - Backend Node.js (TypeScript preferred)
    - Frontend React
    - Database `MonogoDB` or PostgreSQL or SQLite (typo appears in source)
    - REST API
    - Session or JWT auth
  - Modules and functional requirements:
    - Login
    - Dashboard
    - User Management
    - User Invitation
    - Organization Management
    - Global Authentication Settings
    - Global MFA Settings
  - Backend API requirements:
    - Auth
    - Users CRUD
    - Invitations
    - Organizations
    - Settings
  - Mandatory implementation guide sections.
  - Submission checklist including source, README, setup, seed, screenshots/demo.
- Extra notes:
  - No embedded image files detected inside the `.docx` package.

### 11) `Doc/Wazuh_SOC.pdf`
- Type: PDF document, 3 pages.
- What it contains:
  - Challenge title: `Werkstudent Coding Challenge: Wazuh`.
  - Objective: small SOC workflow.
  - Timeline: present in source brief (intentionally not fixed in this index).
  - Recommended stack: Node.js (TS preferred), React, DB, REST.
  - Mandatory modules:
    - Triage
    - Incidents
  - Optional but preferred:
    - Detection
  - Triage requirements:
    - Alert list with fields (ID, timestamp, severity, rule, host, IP, status)
    - Filters/sorting
    - Alert detail with raw JSON
    - Actions: true/false positive, ignore, escalate
  - Incidents requirements:
    - Incident list (ID, title, severity, status, alert count)
    - Incident detail with timeline, alerts, comments
    - Endpoints and DB support for incidents/comments/linking alerts
  - Detection requirements (optional):
    - Rule metrics: alert count, false positive percent, escalation percent
    - Noisy rule identification
  - Mandatory implementation guide topics and submission checklist.
- Extra notes:
  - Metadata extracted:
    - CreationDate: `2026-04-18T14:25:46Z`
    - ModDate: `2026-04-18T14:25:46Z`
  - No embedded images detected.

---

## Reliability notes for agents
- Prefer the document files (`KeyCloak.docx`, `Wazuh_SOC.pdf`) for requirement authority.
- Use screenshots to resolve UI behavior, naming, and state details.
- Do not infer hidden text from obscured screenshot areas.
- If translation/localization is changed in implementation, record that decision explicitly in README.
