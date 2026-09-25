# Development Guide

## Prerequisites

- Node.js 18+
- Rust toolchain (rustup)
- Tauri CLI
- npm

## Getting Started

```bash
# Clone the repository
git clone <repo-url>
cd inventory-gear

# Install dependencies
npm install

# Start development
npm run dev          # Frontend only (Vite)
npm run dev:tauri    # Full app (Tauri + Vite)
```

## Project Structure

```
inventory-gear/
├── src/                    # React frontend
│   ├── components/         # Shared UI components (shadcn)
│   ├── features/           # Feature modules
│   ├── i18n/               # Translations (EN/ES)
│   ├── lib/                # Utilities and Tauri bindings
│   ├── layouts/            # App shell, sidebar, topbar
│   ├── routes/             # React Router config
│   ├── stores/             # Zustand stores
│   └── types/              # TypeScript types
├── src-tauri/              # Rust backend
│   ├── src/
│   │   ├── commands/       # Tauri command handlers
│   │   ├── db/             # Database schema and queries
│   │   └── ...
│   └── Cargo.toml
├── tests/                  # Test suites
│   ├── unit/
│   ├── integration/
│   └── smoke/
├── docs/                   # Documentation source
├── docs-site/              # VitePress documentation
└── scripts/                # Build and utility scripts
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run dev:tauri` | Start full Tauri app |
| `npm run build` | Build frontend |
| `npm run tauri:build` | Build full Tauri app |
| `npm run lint` | Lint code |
| `npm run typecheck` | TypeScript check |
| `npm test` | Run all tests |
| `npm run verify` | Full quality gate |
| `npm run docs:dev` | VitePress dev server |
| `npm run docs:build` | Build documentation |
| `npm run docs:pdf` | Generate PDF manual |

## Adding a New Feature

1. Create feature directory: `src/features/my-feature/`
2. Add pages in `pages/` subdirectory
3. Export from `index.ts`
4. Add route in `src/routes/index.tsx`
5. Add sidebar item in `src/layouts/sidebar.tsx`
6. Add i18n keys in `src/i18n/locales/`
7. Add Tauri commands if needed
8. Write tests
9. **Update documentation** in `docs-site/manual/`

## Testing

```bash
npm run verify          # Full quality gate
npm test                # All tests
npm run test:unit       # Unit tests only
npm run test:rust       # Rust tests only
```

## Related

- [Architecture](/developer/architecture)
- [Testing](/developer/testing)
