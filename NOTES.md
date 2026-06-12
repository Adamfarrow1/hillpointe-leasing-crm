# Implementation Notes

## Time Spent

Roughly 30–40 hours across design, implementation, and review.

## How Far I Got

**Tier 5 complete.**

I finished all of Tier 3 (status filtering, client-side search, assignee filter, unit filter) and all of Tier 4 (Zod form validation shared with the API, dashboard error handling with a retry button, optimistic UI for status changes and task toggles). For Tier 5 I wrote 8 integration tests covering all automation rules and wired up a GitHub Actions CI workflow that runs install, build, test, and lint on every push and pull request.

## What I Built

- TypeScript strict-mode monorepo with a shared `@crm/contracts` package so the API and frontend share the same Zod schemas and types
- Unit CRUD with inline create/edit/delete
- Prospect pipeline with a slide-in drawer, inline status transitions, and a per-prospect activity timeline
- Status automation rule engine — six rules in isolated files dispatched through a registry Map; every side effect (task creation, activity log, unit status flip, task auto-close) runs inside a single Prisma `$transaction` so the state is always consistent
- Task management with state tabs, edit modal, and mark-done/reopen
- Global activity feed and per-prospect timeline
- Tour scheduling with a ±60-minute double-booking guard per unit
- Tour outcome recording that auto-advances the prospect status and fires the appropriate automation rule
- Dashboard with live KPI cards, a pipeline funnel, upcoming tours, open tasks, and recent activity — shows a visible error banner with a retry button if any fetch fails
- API-level status filtering and client-side search/filter on Prospects and Tasks
- Optimistic UI for status changes and task toggles — the UI updates immediately and rolls back if the API call fails
- Shared `apiClient.ts` helper to replace five near-identical `fetch` wrappers that were copy-pasted across API modules
- `ActivityEventTypeSchema` audited and aligned with what the app actually produces (a few types were missing, a couple were listed that never got emitted)
- 8 Vitest integration tests covering the contacted, leased, lost, and toured rules plus the full completed-tour-outcome transaction path

## What I'd Build Next

1. Server-side search and pagination — client-side filtering is fine for demo data but won't scale
2. Auth — even basic session-based auth before this touched a real environment
3. Swap SQLite for Postgres for proper constraints and concurrent write safety
4. Turn `assignedUnit` from a string into a real FK to `Unit`
5. Deploy somewhere (Render, Railway, etc.)

## Tradeoffs I Made

- **SQLite instead of Postgres** — no external service needed to run the take-home locally, but I wouldn't ship this to production on SQLite. The Prisma schema is straightforward to migrate.
- **`assignedUnit` as a plain string** — I skipped the FK to avoid a mid-project migration. In a real codebase this would be `assignedUnitId Int? @relation(...)` from day one.
- **Client-side filtering** — fine for seed data, not fine at scale. The API already accepts a `?status=` query param; extending that to handle search and pagination would be a small lift.
- **No auth** — deliberately out of scope for the assessment, but it would be the first thing I added before any real usage.

## AI Tool Disclosure

I used AI tools during this project and want to be upfront about it:

- **GitHub Copilot** — inline completions throughout, plus back-and-forth on the rule engine architecture and transaction design.
- **Claude** — scaffolding boilerplate (route handlers, Zod schemas, Prisma models) and talking through design tradeoffs.
- **ChatGPT** — cross-checking spec requirements and thinking through edge cases.

Everything generated was reviewed, run locally, and adjusted where needed.

## Known Limitations

- SQLite — not production-ready for concurrent writes or strict referential integrity
- No auth or Role Based Access Control
- `assignedUnit` is a string, not a FK
- Filtering and search are client-side only
- Not deployed anywhere
