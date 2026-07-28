# Architecture

## Overview

Inventory Gear follows a **feature-first architecture** with clear separation of concerns.

## Project Structure

```
src/
├── app/                    # App-level configuration
├── components/
│   ├── ui/                 # Reusable UI primitives (shadcn/ui)
│   └── (app-level)         # App-specific reusable components
├── features/               # Feature modules
│   ├── dashboard/
│   ├── inventory/
│   ├── sales/
│   ├── purchases/
│   ├── customers/
│   ├── suppliers/
│   ├── vehicles/
│   ├── warehouse/
│   ├── reports/
│   ├── employees/
│   ├── settings/
│   └── help/
├── hooks/                  # Custom React hooks
├── layouts/                # Layout components
├── lib/                    # Utilities and helpers
├── routes/                 # Route definitions
├── services/               # API and backend services
├── stores/                 # Zustand state stores
├── styles/                 # Global styles
├── types/                  # TypeScript type definitions
└── assets/                 # Static assets
```

## Data Flow

1. **UI Layer** → React components with TailwindCSS
2. **State Layer** → Zustand stores + React Query cache
3. **Service Layer** → Tauri IPC commands
4. **Data Layer** → SQLite via rusqlite (Rust) / Drizzle ORM (TypeScript)

## IPC Communication

Frontend communicates with Rust backend via Tauri's IPC system:
```typescript
import { invoke } from "@tauri-apps/api/core"
const result = await invoke<string>("command_name", { arg: value })
```

## Design Principles

1. **Feature-first organization** — each module is self-contained
2. **Offline-first** — SQLite local database, no cloud dependency
3. **Type safety** — strict TypeScript + Zod validation
4. **Component composition** — small, reusable UI primitives
5. **Progressive enhancement** — features can be added incrementally
