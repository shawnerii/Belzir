# frontend-soc (Track B B3)

Track B B3 delivers frontend flows for both mandatory modules:
- Triage
- Incidents

## Prerequisites

- Node.js 20+
- npm 10+
- `backend-soc` running on port `4100`

## Setup

```bash
cd frontend-soc
npm install
cp .env.example .env
npm run dev -- --host 127.0.0.1 --port 5174
```

## Scripts

- `npm run dev`: run Vite dev server
- `npm run type-check`: TypeScript check
- `npm run build`: production build
- `npm run lint`: ESLint
- `npm run preview`: preview build

## Environment

- `VITE_API_BASE_URL` defaults to empty, so `/api` is used in development.
- `vite.config.ts` proxies `/api/*` to `http://localhost:4100/*`.

## Available Routes

- `/triage`: triage queue with filter/sort
- `/triage/:id`: alert detail, raw JSON viewer, triage actions
- `/incidents`: incidents list with filter/sort and create incident form
- `/incidents/:id`: incident detail with timeline, linked alerts, comments, and incident update/link/comment actions
