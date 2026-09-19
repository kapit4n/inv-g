# Database

## Overview

SQLite is used as the local database, managed via rusqlite in Rust and Drizzle ORM in TypeScript.

## Database Profiles

The app opens **one of four development/test databases** depending on the active
profile (`default`, `single-store`, `multi-store`, `empty`). Files all live in
the app data directory:

```
inventory_gear.db          ← default (legacy/production behaviour)
inventory-gear-single.db   ← single-store
inventory-gear-multi.db    ← multi-store
inventory-gear-empty.db    ← empty
```

Resolution order: `IG_DATABASE_PROFILE` env var → `profile.json` in the data dir
→ `default`. See [`database-profiles.md`](./database-profiles.md).

## Schema

### Core Tables
- `users` — User accounts and authentication
- `roles` — Role definitions and permissions
- `products` — Product catalog
- `categories` — Product categories (hierarchical)
- `customers` — Customer database
- `suppliers` — Supplier information
- `sales` — Sales transactions
- `sale_items` — Individual sale line items
- `purchase_orders` — Purchase order headers
- `purchase_order_items` — Purchase order line items
- `settings` — Application configuration

## Migrations

Generated via Drizzle Kit:
```bash
npm run db:generate   # Generate migration files
npm run db:migrate    # Apply migrations
npm run db:studio     # Visual database browser
```

## Design Decisions

- SQLite for offline-first, zero-config deployment
- Timestamps stored as ISO 8601 strings
- Soft deletes via `is_active` flags
- Auto-incrementing integer IDs
- JSON fields for flexible data (permissions, settings)
