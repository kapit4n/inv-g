# Developer Setup Guide

## Prerequisites

### Required

| Tool | Version | Purpose |
|------|---------|---------|
| [Node.js](https://nodejs.org) | 22+ | Frontend tooling |
| [npm](https://npmjs.com) | 10+ | Package management |
| [Rust](https://rustup.rs) | 1.70+ | Backend compilation |
| [Tauri CLI](https://v2.tauri.app) | 2.x | Tauri app bundling |

### Linux System Dependencies (Debian/Ubuntu)

```bash
sudo apt-get install -y \
  libgtk-3-dev \
  libwebkit2gtk-4.1-dev \
  libjavascriptcoregtk-4.1-dev \
  libsoup-3.0-dev \
  libappindicator3-dev \
  librsvg2-dev \
  patchelf
```

For other Linux distributions, check the [Tauri v2 system dependencies guide](https://v2.tauri.app/start/prerequisites/).

### macOS

Xcode Command Line Tools are required:

```bash
xcode-select --install
```

### Windows

- Microsoft Visual Studio C++ Build Tools (or Visual Studio with "Desktop development with C++")
- WebView2 (included with Windows 10+)

## Clone the Repository

```bash
git clone https://github.com/your-org/inventory-gear.git
cd inventory-gear
```

## Install Dependencies

```bash
npm install
```

This installs:
- Frontend packages (React, TailwindCSS, shadcn/ui, TanStack Query, i18next, etc.)
- Development tools (TypeScript, ESLint, Prettier, Vite, Tauri CLI)
- Tauri plugins (shell, dialog, fs, store)

## Database Initialization

The SQLite database is initialized **automatically on first application launch**. The Rust backend:

1. Creates the database file at the platform's app data directory.
2. Runs the schema migration (all `CREATE TABLE` statements via `schema.rs`).
3. Seeds default data (roles, permissions, users, categories, brands, etc.).

### Manual Seeding

You can also run seed scripts from the command line for demo data:

```bash
# Run all seed scripts (inserts demo data if tables are empty)
npm run db:seed

# See available seed options
npm run db:seed:help
```

Seed scripts live in `database/seed/` and cover: categories, brands, manufacturers, suppliers, warehouses, storage locations, products, customers, vehicle catalog, product-vehicle compatibility, sales, and purchase orders.

### Drizzle ORM (for TypeScript schema reference)

Drizzle is configured but the primary schema management is done in Rust (`src-tauri/src/db/schema.rs`):

```bash
npm run db:generate   # Generate Drizzle migration files
npm run db:migrate    # Apply migrations
npm run db:studio     # Open Drizzle Studio (visual DB browser)
```

## Running in Development Mode

### Frontend-only (Vite dev server)

```bash
npm run dev
```

Opens the frontend in your browser at `http://localhost:5173`. Backend calls will fail since Tauri is not running.

### Full Application (Tauri + Vite)

```bash
npm run dev:tauri
```

This starts the Vite dev server and launches the Tauri desktop window. Hot-reload is enabled for both frontend (React) and backend (Rust) code.

## Building for Production

```bash
# Build the frontend only
npm run build

# Build the full Tauri desktop application
npm run tauri:build
```

Outputs are placed in:
- Frontend: `dist/`
- Tauri bundles: `src-tauri/target/release/bundle/`
  - Linux: `.deb`, `.AppImage`
  - macOS: `.dmg`
  - Windows: `.msi`, `.exe`

## Project Architecture Overview

```
inventory-gear/
├── src/                          # React frontend
│   ├── app/                      # App-level configuration
│   ├── components/               # Reusable UI components
│   │   ├── ui/                   # shadcn/ui primitives
│   │   ├── forms/                # Form field wrappers
│   │   ├── data-table/           # DataTable component
│   │   ├── dialogs/              # Dialog components
│   │   └── entity/               # Entity layout components
│   ├── features/                 # Feature modules (dashboard, inventory, sales, ...)
│   ├── hooks/                    # Custom React hooks
│   ├── i18n/                     # Internationalization
│   ├── layouts/                  # Layout components (sidebar, topbar)
│   ├── lib/                      # Utilities (tauri.ts, mappers, etc.)
│   ├── routes/                   # Route definitions
│   ├── services/                 # Service layer
│   ├── stores/                   # Zustand state stores
│   └── types/                    # TypeScript interfaces
├── src-tauri/                    # Rust backend
│   ├── src/
│   │   ├── commands/             # Tauri IPC command handlers
│   │   │   ├── admin/            # Admin commands (14 sub-modules)
│   │   │   └── reports/          # Report commands (10 sub-modules)
│   │   └── db/                   # Database connection, schema, seed data
│   └── tauri.conf.json           # Tauri configuration
├── database/                     # Seed scripts
└── docs/                         # Documentation
```

### Data Flow

```
UI Layer (React components)
    ↓  useState / useEffect / TanStack Query
Service Layer (src/lib/tauri.ts)
    ↓  invoke() Tauri IPC
Rust Commands (src-tauri/src/commands/)
    ↓  rusqlite
SQLite Database
```

## Code Style and Conventions

- **TypeScript**: Strict mode, camelCase for variables/functions, PascalCase for components/types.
- **Rust**: snake_case per Rust conventions. All structs use `#[serde(rename_all = "camelCase")]` for JSON serialization.
- **Frontend**: Feature-first folder organization. Each feature module is self-contained with its own pages and components.
- **Styling**: TailwindCSS v4 utility classes. shadcn/ui for primitives.
- **State**: Zustand for global state (auth, settings, notifications). TanStack Query for server data. Local state with `useState` for ephemeral data.
- **i18n**: All user-facing strings use the `t()` function from react-i18next.

## Testing Approach

Currently the project does not have automated test suites. Testing is done manually:

- **Frontend**: Visual verification in the Tauri window. React component behavior checked by navigating through all routes.
- **Backend**: Rust commands can be tested individually by invoking them from the frontend console or by running the app and checking SQLite database state.
- **Seed Data**: `npm run db:seed` inserts demo data used for manual QA.

Future test coverage will include:
- Vitest for React component tests
- Rust integration tests for Tauri commands

## Debugging Tips

### Frontend (React)

- Open the Tauri dev tools: Right-click → Inspect Element (or `Ctrl+Shift+I`).
- Use `console.log()` — output appears in the Tauri webview console.
- React DevTools can be connected to the Tauri webview.

### Backend (Rust)

The Rust backend uses `env_logger`. Run the app with logging enabled:

```bash
RUST_LOG=debug npm run dev:tauri
```

Log levels: `error`, `warn`, `info`, `debug`, `trace`.

To see SQL queries specifically:

```bash
RUST_LOG=inventory_gear=debug npm run dev:tauri
```

### Common Issues

| Problem | Solution |
|---------|----------|
| Tauri build fails on Linux | Ensure all system dependencies are installed (see Linux Dependencies above) |
| Database schema mismatch | Delete the database file (located in app data directory) and restart |
| `snake_case` fields undefined | Ensure Rust struct has `#[serde(rename_all = "camelCase")]` |
| Frontend can't reach backend | Run with `npm run dev:tauri` not just `npm run dev` |
| Hot reload not working | Restart the dev server. Check for TypeScript errors in console. |

### Database File Location

The SQLite database is stored at:

- **Linux**: `~/.local/share/inventory-gear/inventory_gear.db`
- **macOS**: `~/Library/Application Support/inventory-gear/inventory_gear.db`
- **Windows**: `%APPDATA%/inventory-gear/inventory_gear.db`

You can open it with any SQLite browser to inspect data directly.
