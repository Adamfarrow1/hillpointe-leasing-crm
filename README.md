# Hillpointe Leasing CRM

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
├── apps/
│   ├── api/          # Express REST API (port 3001)
│   └── web/          # React + Vite frontend (port 5173)
└── packages/
    └── contracts/    # Shared Zod schemas and inferred types
```

## Getting Started

### Prerequisites

- Node.js 20+
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
| `npx prisma studio` (in `apps/api`) | Browse the SQLite database |
| `npm run prisma:seed` (in `apps/api`) | Seed 101–202 sample units |

## Shared Contracts

`packages/contracts` is the single source of truth for all domain types. Both the API (runtime validation via Zod `.parse()`) and the frontend (TypeScript types via `z.infer<>`) import from `@crm/contracts`.

```ts
import { UnitSchema, type Unit, type CreateUnitInput } from '@crm/contracts';
```

**Exported schemas:** `Unit`, `Prospect`, `Tour`, `Task`, `ActivityEvent`  
Each module exports: a read schema, create/update input schemas, and inferred TypeScript types.

## API Endpoints

Base URL: `http://localhost:3001`

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `GET` | `/api/units` | List all units |
| `GET` | `/api/units/:id` | Get unit by ID |
| `POST` | `/api/units` | Create unit |
| `PATCH` | `/api/units/:id` | Update unit |
| `DELETE` | `/api/units/:id` | Delete unit |

A [Postman collection](./units-api.postman_collection.json) is included at the repo root for manual API testing.

## Domain Model

```
Prospect ──< Tour >── Unit
    │
    └──< Task
    └──< ActivityEvent
```

**Prospect pipeline:** `new` → `contacted` → `tour_scheduled` → `toured` → `application` → `leased` (or `lost` from any stage)

## Implementation Status

| Tier | Feature | Status |
|---|---|---|
| 0 | Project scaffold + shared contracts | ✅ Complete |
| 0 | Unit CRUD (API + frontend) | ✅ Complete |
| 0 | Prospect list view (mock data) | ✅ UI complete |
| 0 | Dashboard with pipeline + KPIs | ✅ Complete |
| 1 | Automation rule engine | 🔜 Planned |
| 1 | Task management | 🔜 Planned |
| 1 | Activity timeline | 🔜 Planned |
| 2 | Tour scheduling | 🔜 Planned |
| 3 | Search & filter | 🔜 Planned |
