# Architecture

## System Overview

Inventory Gear is a **desktop ERP application** built with:

- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS v4
- **Backend:** Tauri v2 + Rust
- **Database:** SQLite (via Rusqlite)
- **UI Components:** shadcn/ui
- **State Management:** React Query (TanStack Query)
- **Internationalization:** i18next (EN/ES)
- **Documentation:** VitePress

## Architecture Diagram

```
┌─────────────────────────────────────────────────┐
│                  Tauri Window                     │
│  ┌─────────────────────────────────────────────┐ │
│  │           React Frontend (WebView)           │ │
│  │                                              │ │
│  │  ┌──────────┐  ┌──────────┐  ┌───────────┐ │ │
│  │  │ Features │  │Components│  │  Stores    │ │ │
│  │  │  (pages) │  │(shadcn)  │  │(settings) │ │ │
│  │  └────┬─────┘  └────┬─────┘  └─────┬─────┘ │ │
│  │       │              │              │        │ │
│  │       └──────────────┼──────────────┘        │ │
│  │                      │                       │ │
│  │              ┌───────┴────────┐              │ │
│  │              │  Tauri Bridge  │              │ │
│  │              │   (invoke)     │              │ │
│  │              └───────┬────────┘              │ │
│  └──────────────────────┼───────────────────────┘ │
│                         │                          │
│  ┌──────────────────────┼───────────────────────┐ │
│  │           Rust Backend (Tauri)                │ │
│  │                                              │ │
│  │  ┌──────────┐  ┌──────────┐  ┌───────────┐ │ │
│  │  │ Commands │  │ Database │  │  Auth      │ │ │
│  │  │          │  │ (SQLite) │  │  (RBAC)   │ │ │
│  │  └──────────┘  └──────────┘  └───────────┘ │ │
│  └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

## Key Patterns

### Command Pattern
All backend operations go through Tauri commands:
```rust
#[tauri::command]
pub fn get_products(page: i64, limit: i64) -> Result<...> { ... }
```

### Feature-Based Organization
```
src/features/
  ├── inventory/     # Product, category, warehouse management
  ├── sales/         # POS, quotes, returns
  ├── purchases/     # POs, receiving, supplier products
  ├── crm/           # Customers, vehicles, compatibility
  ├── reports/       # Analytics and reporting
  ├── admin/         # System administration
  └── ...
```

### Schema Migrations
Database schema is versioned and migrated automatically:
```rust
const SCHEMA_VERSION: i32 = 11;
```

## Related

- [Development Guide](/developer/development)
- [Testing](/developer/testing)
