# PVS Dispatch

Desktop scheduling & crew planning app for Prestige View Services. This is the
daily planning, crew assignment, and dispatch layer that sits **on top of
Jobber** — it imports data and owns the daily plan. It does not do quoting,
invoicing, or payments.

Everything works fully offline. The only features that ever touch the network
are the AI daily planner (Phase 3), the optional real drive-time provider, and
the optional publish-schedule link (Phase 5) — all off by default.

## Stack

Electron + React 18 + TypeScript (strict) + Vite · Tailwind + shadcn-style
components · SQLite (better-sqlite3) + Drizzle ORM with versioned migrations ·
TanStack Query + Zustand · dnd-kit · date-fns.

## Getting started

```bash
cd pvs-dispatch
npm install                 # also rebuilds better-sqlite3 for Electron
npm run dev                 # terminal 1: vite dev server
npm run dev:electron        # terminal 2: electron shell pointed at it
```

On first launch with an empty database the app offers a one-click **demo
dataset** (12 workers, 4 crews, 60 customers across Petawawa/Pembroke, 200
jobs). To seed a standalone dev database from the CLI instead:

```bash
npm rebuild better-sqlite3  # switch the native binding to your Node ABI
npm run db:seed             # writes dev-data/pvs-dispatch.sqlite
```

(`npm install` rebuilds better-sqlite3 against Electron's ABI via
`electron-builder install-app-deps`; the CLI seed runs under plain Node, hence
the rebuild when switching between the two.)

Other commands:

```bash
npm run typecheck           # strict TS across renderer + main process
npm run build               # typecheck + vite build + electron tsc
npm run db:generate         # regenerate Drizzle migrations after schema edits
npm run package             # electron-builder installers (Windows + macOS)
```

## Where data lives

- Database: `<userData>/data/pvs-dispatch.sqlite` (WAL mode, foreign keys on)
- Backups: `<userData>/backups/` — automatic nightly backup with 30-day
  retention, a snapshot before every schema migration, and a manual
  "Back up now" button in Settings
- API keys: encrypted with Electron `safeStorage` (OS keychain), stored only as
  ciphertext in the settings row, never in plain text config

## Architecture

```
electron/
  main.ts          app lifecycle, window, nightly backup scheduler
  preload.ts       contextBridge — renderer can only invoke pvs:* channels
  db/schema.ts     complete Drizzle schema (all 5 phases)
  db/index.ts      open/migrate/backup
  services/        all query + mutation logic (plain functions over the db,
                   shared by IPC handlers and the CLI seed script)
  ipc/index.ts     channel registry; converts errors to human-readable messages
shared/types.ts    row types inferred from the schema + IPC payload contracts
src/               React renderer (screens, schedule board, dialogs)
drizzle/           generated SQL migrations (versioned, committed)
scripts/seed.ts    CLI seeding for development
```

All database writes go through transactions in the service layer. Scheduling
mutations return their previous values so the UI keeps a 20-step undo/redo
stack (`Ctrl/Cmd+Z`, `Shift+Ctrl/Cmd+Z`).

## Keyboard shortcuts

`N` new job · `T` jump to today's schedule · `←`/`→` previous/next day ·
`/` focus search · `Ctrl/Cmd+Z` undo scheduling change · `+Shift` redo

## Build phases

- **Phase 1 (done)** — Electron shell, full schema + migrations, settings,
  workers, crews, customers, properties, service catalog, manual job creation,
  Day/3-Day/Week/Month schedule board with drag-and-drop assignment,
  drop validation warnings (certification, time off, max hours, drive time),
  dashboard KPIs, demo seed data.
- **Phase 2 (done)** — full job drawer (checklists, photos via the
  `pvsphoto://` protocol, crew notes, activity log), crew run sheet and
  master day schedule print views, PDF export via `printToPDF` and PNG
  export for texting, app icon + pinnable installers (NSIS shortcuts).
- **Phase 3 (done)** — AI daily planner: the app assembles the full context
  (jobs with durations/prices/cert levels, crews with certifications, a
  drive-time matrix, your economics) and calls the Anthropic API from the
  main process with the key from `safeStorage`. Plans are Zod-validated with
  one retry — the model can never invent jobs/crews or write to the database;
  only per-crew human approval applies a plan (stored on `day_plans` with the
  rationale). Includes proposed-vs-current diff view and a follow-up chat
  that proposes revisions through the same approve/reject flow. Privacy: the
  model sees addresses, durations, prices, and crew first names — never
  customer phone numbers or emails.
- **Phase 4** — Snow dispatch mode: storm events, contract triggers, SLA
  clocks, storm summary report.
- **Phase 5** — reports, Jobber CSV import, recurring jobs from RRULE,
  optional cloud share link and real drive-time provider.
