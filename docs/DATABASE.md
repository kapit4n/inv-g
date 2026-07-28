# Database

## Overview

SQLite is used as the local database, managed via rusqlite in Rust and Drizzle ORM in TypeScript.

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
