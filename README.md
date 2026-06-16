# Hillpointe Leasing CRM

[![CI](https://github.com/Adamfarrow1/hillpointe-leasing-crm/actions/workflows/ci.yml/badge.svg)](https://github.com/Adamfarrow1/hillpointe-leasing-crm/actions/workflows/ci.yml)

A full-stack CRM for leasing agents managing apartment units, prospects, tours, tasks, and activity events. Built as a TypeScript-strict monorepo with a shared contracts layer that drives both API validation and frontend type safety.

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS v4, React Router v7 |
| Backend | Node.js, Express 4, Prisma 5, SQLite |
| Contracts | Zod 3 (shared schemas, inferred types) |
| Tooling | npm workspaces, TypeScript strict mode |

## Monorepo Structure

```
hillpointe-leasing-crm/
+-- apps/
   +-- api/          # Express REST API (port 3001)
   +-- web/          # React + Vite frontend (port 5173)
+-- packages/
    +-- contracts/    # Shared Zod schemas and inferred types
```

## Getting Started

### Prerequisites

- Node.js 22 LTS (v22.x.x recommended — v26.2.0 has known compatibility issues with native dependencies such as `lightningcss`)
- npm 10+

### Install

```bash
npm install
```

### Database setup (first time)

```bash
cd apps/api
npx prisma migrate dev
npm run prisma:seed
```

### Run (two terminals)

**API:**
```bash
npm run dev --workspace=apps/api
```

**Frontend:**
```bash
npm run dev -w web
```

Open [http://localhost:5173](http://localhost:5173). The Vite dev server proxies `/api/*` to the API on port 3001.

## Available Scripts

Run from the repo root unless noted.

| Command | Description |
|---|---|
| `npm run dev -w web` | Start frontend dev server |
| `npm run dev --workspace=apps/api` | Start API with hot reload |
| `npm run build -w web` | Production build (type-check + Vite) |
| `npm run build --workspace=apps/api` | Compile API TypeScript |
| `npm test --workspace=apps/api` | Run rule engine integration tests |
| `npx prisma studio` (in `apps/api`) | Browse the SQLite database |
| `npm run prisma:seed` (in `apps/api`) | Seed demo prospects and tasks |

## Shared Contracts

`packages/contracts` is the single source of truth for all domain types. Both the API (runtime validation via Zod `.parse()`) and the frontend (TypeScript types via `z.infer<>`) import from `@crm/contracts`.

```ts
import { UnitSchema, type Unit, type CreateUnitInput } from '@crm/contracts';
```

**Exported schemas:** `Unit`, `Prospect`, `Tour`, `Task`, `ActivityEvent`
Each module exports: a read schema, create/update input schemas, and inferred TypeScript types.

## API Endpoints

Base URL: `http://localhost:3001`

### Units
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/units` | List all units |
| `GET` | `/api/units/:id` | Get unit by ID |
| `POST` | `/api/units` | Create unit |
| `PATCH` | `/api/units/:id` | Update unit |
| `DELETE` | `/api/units/:id` | Delete unit |

### Prospects
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/prospects` | List all prospects |
| `GET` | `/api/prospects/:id` | Get prospect by ID |
| `POST` | `/api/prospects` | Create prospect |
| `PATCH` | `/api/prospects/:id` | Update prospect fields |
| `PATCH` | `/api/prospects/:id/status` | Advance pipeline status (triggers automation) |
| `DELETE` | `/api/prospects/:id` | Delete prospect |
| `GET` | `/api/prospects/:id/activity` | Activity timeline for a prospect |

### Tours
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/tours` | List all tours |
| `POST` | `/api/tours` | Schedule a tour (double-booking checked) |
| `PATCH` | `/api/tours/:id` | Reschedule or change unit |
| `PATCH` | `/api/tours/:id/outcome` | Record outcome (completed / no_show / cancelled) |

### Tasks
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/tasks` | List tasks (filterable by `state`, `prospectId`) |
| `PATCH` | `/api/tasks/:id` | Edit task fields |
| `PATCH` | `/api/tasks/:id/complete` | Mark task done |
| `PATCH` | `/api/tasks/:id/reopen` | Reopen a completed task |
| `DELETE` | `/api/tasks/:id` | Delete task |

### Activity
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/activity-events` | List events (filterable by `prospectId`, `unitId`, `type`) |

## Automation Engine

Status transitions via `PATCH /api/prospects/:id/status` run a transactional rule engine that automatically creates follow-up tasks and activity log entries.

| Status transition | Effect | Activity logged |
|---|---|---|
| → `contacted` | Closes any open tasks from prior stages; creates task: "Send tour availability to {name}" (due +2 days) | ✅ |
| → `tour_scheduled` | Closes any open tasks; if an upcoming tour exists creates "Confirm tour 24h prior" (due: tour date − 1 day); otherwise creates "Schedule a tour for {name}" (due +1 day) | ✅ |
| → `toured` | Closes any open tasks; creates task: "Send application link to {name}" (due +1 day) | ✅ |
| → `application` | Closes any open tasks; creates task: "Review application — {name}" (due +3 days) | ✅ |
| → `leased` | Marks assigned unit as leased; auto-closes all open tasks for the prospect | ✅ |
| → `lost` | Auto-closes all open tasks for the prospect | ✅ |

Tour outcomes also trigger automation:
- **Completed** → advances prospect to `toured`, fires the toured rule, closes open "Confirm tour" tasks
- **Cancelled / No-show** → records outcome; no automatic status advance

## Domain Model

```
Prospect --< Tour >-- Unit
    +--< Task
    +--< ActivityEvent
```

**Prospect pipeline:** `new` ? `contacted` ? `tour_scheduled` ? `toured` ? `application` ? `leased` (or `lost` from any stage)

## Implementation Status

**Highest tier fully reached: Tier 5**

| Tier | Feature | Status |
|---|---|---|
| Tier 0 | Project scaffold + shared contracts | ✅ Complete |
| Tier 0 | Unit CRUD (API + frontend) | ✅ Complete |
| Tier 0 | Prospect pipeline (API + frontend + drawer) | ✅ Complete |
| Tier 1 | Status automation rule engine | ✅ Complete |
| Tier 1 | Task management (API + frontend) | ✅ Complete |
| Tier 1 | Activity timeline (API + frontend) | ✅ Complete |
| Tier 2 | Tour scheduling with double-booking prevention | ✅ Complete |
| Tier 2 | Tour outcome recording with automation | ✅ Complete |
| Tier 2 | Dashboard with live data (KPIs, pipeline, tours, tasks, activity) | ✅ Complete |
| Tier 2 | ProspectDrawer with inline activity timeline | ✅ Complete |
| Tier 3 | Status filtering via API query param | ✅ Complete |
| Tier 3 | Client-side search on Prospects page | ✅ Complete |
| Tier 3 | Assigned unit filter on Prospects page | ✅ Complete |
| Tier 3 | Assignee filter on Tasks page | ✅ Complete |
| Tier 4 | Form validation surfaced from shared Zod schemas | ✅ Complete |
| Tier 4 | Loading, error, and empty states | ✅ Complete |
| Tier 4 | Dashboard error handling with retry | ✅ Complete |
| Tier 4 | Optimistic UI on status change and task complete/reopen | ✅ Complete |
| Tier 5 | Rule engine and tour automation integration tests (Vitest, 8 tests) | ✅ Complete |
| Tier 5 | CI workflow | ✅ Complete |

## Submission Status

| Item | Status |
|---|---|
| Git repository | Current repo |
| Live deployment | TODO |
| `NOTES.md` | ✅ Included |
| `README.md` | ✅ Included |

## Known Limitations / Future Improvements

- **Authentication** — No auth or RBAC implemented. A production version would add JWT-based authentication and role-based permissions (leasing agent vs. manager).
- **Database** — SQLite is used for take-home simplicity. A production version would use Postgres for stronger relational integrity and concurrent write support.
- **Search and filtering** — Prospect search is currently client-side. A production version would implement server-side full-text search with pagination.

## Deployment

The app is split across two services:
- **Railway** — Express API + SQLite database
- **Vercel** — React/Vite frontend

---

### Railway (API)

The `railway.json` at the repo root configures Railway automatically.

**Steps:**
1. New project → **Deploy from GitHub repo** → select this repo
2. Set **Root Directory** to `.` (repo root) — `railway.json` controls everything else
3. Add a **Volume** mounted at `/data` (persists the SQLite database)
4. Add these **Environment Variables**:

| Variable | Value |
|---|---|
| `DATABASE_URL` | `file:/data/prod.db` |
| `NODE_ENV` | `production` |
| `FRONTEND_URL` | `https://YOUR-APP.vercel.app` |

Build command (from `railway.json`):
```
npm install && npm run build --workspace=@crm/contracts && npm run build --workspace=api
```

Start command (from `railway.json`):
```
npm run start --workspace=api
```

The `api` start script runs `prisma migrate deploy && node dist/server.js`.

---

### Vercel (Frontend)

**Steps:**
1. New project → **Import** this repo
2. In the project settings set:
   - **Root Directory:** `apps/web`
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build` *(or leave as detected)*
   - **Output Directory:** `dist`
3. Add this **Environment Variable:**

| Variable | Value |
|---|---|
| `VITE_API_URL` | `https://YOUR-RAILWAY-API.up.railway.app` |

The `vercel.json` at the repo root handles React Router's client-side routing (rewrites all paths to `index.html`).


- **Tests** — Vitest integration tests cover all six automation rules and the completed tour outcome transaction (8 tests).

## Continuous Integration

The repository runs a GitHub Actions CI workflow on every push and pull request (all branches).

The workflow:
- **Builds the backend** — compiles the API TypeScript (`tsc`) after generating the Prisma client
- **Builds the frontend** — runs `tsc -b && vite build` to type-check and bundle the React app
- **Runs automation tests** — applies Prisma migrations to a fresh SQLite test database and executes all 8 Vitest integration tests
- **Lints the frontend** — runs ESLint across the web workspace

Status is shown by the badge at the top of this file.
- **CI** — No GitHub Actions workflow exists yet. Would be added alongside server-side search.
- **Dashboard analytics caching** — Dashboard KPI queries run on every load. A production version would add caching if query volume grew.
