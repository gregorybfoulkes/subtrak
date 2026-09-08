# Subtrak

Subtrak is a local-first desktop application for tracking recurring subscriptions. It records what a subscription costs, when it renews, and the estimated monthly and yearly totals. The v1 application has no account system, cloud sync, remote API, or telemetry; subscription data is stored locally in SQLite.

## v1 capabilities

- Create, edit, and delete subscriptions.
- Store name, amount, currency, billing cycle, category, renewal date, and optional notes.
- Calculate monthly and yearly totals from weekly, monthly, and yearly charges.
- Search by subscription name or notes.
- Filter by category or billing cycle.
- Sort results by renewal date and then name.
- Flag renewals occurring within the next seven days.
- Seed eight example subscriptions on first launch of a new database.

## Stack

| Area | Technology | Version/configuration |
| --- | --- | --- |
| Desktop runtime | Electron | `^42.1.0` |
| Renderer | React + React DOM | `^19.2.7` |
| Build tool | Vite | `^8.0.16` |
| Language | TypeScript | `^6.0.3`, strict mode |
| Styling | Tailwind CSS + `@tailwindcss/vite` | `^4.3.0` |
| Persistence | SQLite via `better-sqlite3` | `^12.11.1` |
| Packaging | electron-builder | `^26.8.1` |

The project is an npm package using native ES modules (`"type": "module"`). `better-sqlite3` is the only runtime dependency; React, Vite, Electron, Tailwind, TypeScript, and their plugins are development dependencies.

## Architecture

The application has three Electron layers:

1. **Renderer** (`src/`) contains the React UI, filters, forms, and display-only billing calculations.
2. **Preload** (`electron/preload/`) runs with context isolation and exposes the narrow `window.subtrak` API through `contextBridge`.
3. **Main** (`electron/main/`) owns the BrowserWindow, IPC handlers, input validation, SQLite connection, schema initialization, seed data, and database shutdown.

The renderer does not import Node APIs or access SQLite. It calls the typed API declared in [shared/types.ts](shared/types.ts), which maps to IPC channels registered in [electron/main/ipc/subscriptions.ts](electron/main/ipc/subscriptions.ts).

### Runtime security settings

- `contextIsolation: true`
- `nodeIntegration: false`
- A preload bridge is used instead of exposing `ipcRenderer` directly.
- The HTML entry point defines a same-origin script Content Security Policy, with inline scripts allowed by the current `script-src` policy.
- The main process validates required fields and allowed billing cycles before writes.

## Data model and storage

The database file is created as `subtrak.db` in Electron's `app.getPath('userData')` directory. The exact path is platform-specific and is managed by Electron. SQLite uses write-ahead logging (`WAL`).

The current schema is one table:

```sql
subscriptions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  amount REAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  billing_cycle TEXT NOT NULL,
  category TEXT NOT NULL,
  renewal_date TEXT NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
)
```

Dates are stored as ISO date or timestamp strings. IDs are generated with `crypto.randomUUID()`. The current startup migration only creates the table when it does not exist; there is no versioned migration framework yet.

On an empty database, startup inserts these demo records: Netflix, Spotify, Adobe Creative Cloud, GitHub Copilot, Xbox Game Pass, iCloud+, Peloton, and The Economist. Seeding is skipped once any subscription exists.

### Billing rules

- Weekly amount to monthly: `amount * (52 / 12)`.
- Monthly amount to monthly: `amount`.
- Yearly amount to monthly: `amount / 12`.
- Yearly total is monthly total multiplied by `12`.
- Currency formatting uses `Intl.NumberFormat('en-US')`.
- Totals are numeric sums and do not perform foreign-exchange conversion. Mixing currencies in one list therefore produces a mathematical total, not a converted monetary total.
- A renewal is considered soon when it is between today and seven days from today, inclusive.

## IPC API

The preload bridge exposes `window.subtrak.subscriptions`:

| Method | Purpose |
| --- | --- |
| `list(filters?)` | Return subscriptions ordered by renewal date and name. Supports `search`, `category`, and `billing_cycle`. |
| `get(id)` | Return one subscription or `null`. |
| `create(input)` | Validate and insert a subscription, then return it. |
| `update(id, input)` | Validate and update an existing subscription, then return it. |
| `delete(id)` | Delete an existing subscription. |

Required write validation is performed in the main process: a non-empty name and category, a finite amount greater than zero, a parseable renewal date, and one of `weekly`, `monthly`, or `yearly` as the billing cycle.

## Configuration

### Vite

[vite.config.ts](vite.config.ts) configures React, Tailwind CSS, and the Electron main/preload builds. It defines these aliases:

- `@/*` -> `src/*`
- `@shared/*` -> `shared/*`

The renderer output is `dist/`. Electron main and preload output is `dist-electron/`. Runtime dependencies are externalized from the Electron bundles. The Vite config removes `dist-electron/` before each configuration run and enables source maps for development or VS Code debugging.

### TypeScript

[tsconfig.json](tsconfig.json) covers `src/` and `shared/` with strict checking, ES modules, bundler resolution, and no emit. [tsconfig.node.json](tsconfig.node.json) covers Electron, shared code, Vite configuration, and `package.json` with Node types.

### Packaging

[electron-builder.json](electron-builder.json) uses application ID `com.subtrak.app`, product name `Subtrak`, and writes artifacts to `release/`. It packages `dist/` and `dist-electron/` and targets:

- macOS: DMG and ZIP
- Windows: NSIS installer
- Linux: AppImage

Artifact names follow `Subtrak-{version}-{arch}.{ext}`.

## Local development

### Prerequisites

- Node.js and npm. The project does not declare an `.nvmrc` or an engines field; use a current LTS Node release compatible with Electron 42 and Vite 8.
- A platform supported by Electron and the native `better-sqlite3` module.

### Install and run

```bash
npm install
npm run dev
```

`npm run dev` starts Vite in serve mode and launches Electron through `vite-plugin-electron`. Hot reload is enabled for the renderer during development.

### Commands

```bash
npm run dev        # Start the Electron app with the Vite development server
npm run build      # Build renderer/main/preload and package installers
npm run preview    # Preview the built renderer through Vite
npm run typecheck  # Run tsc --noEmit
npm test            # Run the Vitest suite once
npm run test:watch  # Run Vitest in watch mode
npm run test:coverage # Run tests with coverage thresholds
```

The `postinstall` script runs `electron-builder install-app-deps` so native dependencies are prepared after installation.

## Repository layout

```text
electron/
  main/index.ts              Electron lifecycle and BrowserWindow
  main/db/database.ts        SQLite connection, schema creation, and demo seed
  main/db/subscriptions.ts   Subscription queries and persistence operations
  main/ipc/subscriptions.ts  IPC registration and main-process validation
  preload/index.ts           Context-isolated renderer bridge
shared/types.ts              Shared domain types and window.subtrak contract
src/App.tsx                  Renderer composition and UI state
src/components/              Dashboard, search, filters, form, and list
src/hooks/useSubscriptions.ts Renderer data loading and mutation hook
src/lib/billing.ts           Billing normalization and date helpers
vite.config.ts               Renderer and Electron build configuration
electron-builder.json        Installer and artifact configuration
```

## Verification and current boundaries

The repository provides Vitest unit tests, TypeScript checking, coverage thresholds, and a GitHub Actions workflow. See [TESTING.md](TESTING.md) for the test pyramid, integration/E2E plan, and templates. The current automated tests focus on billing and exchange-rate services; IPC/database integration and Electron E2E coverage remain planned.

There is no configured cloud service, authentication, backup/export workflow, currency conversion service, recurring renewal automation, notification system, CI workflow, or release signing configuration in v1. The local database should be backed up using the platform's `userData` directory if data preservation is required.

## License

No license is specified in the repository.
