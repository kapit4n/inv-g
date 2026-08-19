# Inventory Gear

Desktop ERP system for automotive parts businesses. Built with Tauri v2 + React 19 + TypeScript + SQLite/Rusqlite.

## Features

- **Inventory Management** — Products, categories, brands, warehouses, stock tracking, movements
- **Point of Sale** — Fast POS with barcode scanning, multiple payment methods, quotes, returns
- **Purchasing** — Purchase orders, receiving, supplier management, cost tracking, reorder suggestions
- **CRM & Vehicles** — Customer management, vehicle tracking, part compatibility, service reminders, warranties
- **Part Finder** — Vehicle-to-part search with cascading selectors
- **Cross References** — OEM numbers, aftermarket, interchange, supersession identifiers
- **Reports** — Executive dashboard, sales/inventory/purchasing reports, KPIs, profitability
- **Administration** — Users, roles & permissions, database, backups, diagnostics, audit log
- **Bilingual** — Full English and Spanish support (i18n)

## Getting Started

### Prerequisites

- Node.js 18+
- Rust toolchain (via [rustup](https://rustup.rs/))
- Tauri CLI

### Development

```bash
# Install dependencies
npm install

# Start development (frontend only)
npm run dev

# Start development (full Tauri app)
npm run dev:tauri
```

### Build

```bash
# Build frontend
npm run build

# Build full Tauri application
npm run build:tauri
```

## Testing

```bash
npm run verify          # Full quality gate (typecheck + lint + vitest + rust)
npm test                # Run all Vitest tests
npm run test:rust       # Run Rust backend tests
```

## Documentation

### User Manual

```bash
npm run docs:dev        # VitePress dev server (hot reload)
npm run docs:build      # Build documentation
npm run docs:preview    # Preview built documentation
npm run docs:pdf        # Generate PDF manual (requires Playwright)
```

The user manual is accessible within the application at `/manual`.

### Project Documentation

- `docs/` — Development documentation, architecture, guidelines
- `docs/manual/` — Existing module documentation (Markdown)
- `docs-site/` — VitePress documentation source

## Project Structure

```
inventory-gear/
├── src/                    # React frontend
│   ├── components/         # Shared UI components (shadcn/ui)
│   ├── features/           # Feature modules (16 modules)
│   ├── i18n/               # Translations (EN/ES)
│   ├── lib/                # Utilities and Tauri command bindings
│   ├── layouts/            # App shell, sidebar, topbar
│   ├── routes/             # React Router configuration
│   ├── stores/             # Zustand stores
│   └── types/              # TypeScript types
├── src-tauri/              # Rust backend
│   └── src/
│       ├── commands/       # Tauri command handlers
│       ├── db/             # SQLite schema and queries
│       └── ...
├── docs-site/              # VitePress documentation
├── docs/                   # Development documentation
├── tests/                  # Test suites
└── scripts/                # Build and utility scripts
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop | Tauri v2 |
| Frontend | React 19, TypeScript, Vite |
| UI | shadcn/ui, Tailwind CSS v4 |
| State | TanStack Query, Zustand |
| Backend | Rust, Rusqlite |
| Database | SQLite |
| i18n | i18next (EN/ES) |
| Documentation | VitePress |

## License

Private — All rights reserved.
