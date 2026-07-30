# Contributing to Inventory Gear

## How to Add a New Feature

Adding a new feature module (e.g., a "Workshops" module) involves creating a frontend page, wiring up Rust backend commands, and registering everything.

### 1. Create a Route

In `src/routes/index.tsx`, add your route:

```tsx
<Route path="/workshops" element={<WorkshopsPage />} />
```

### 2. Create a Page Component

Create `src/features/workshops/pages/workshops-page.tsx`:

```tsx
import { useTranslation } from "react-i18next"

export function WorkshopsPage() {
  const { t } = useTranslation("workshops")
  return <h1>{t("title")}</h1>
}
```

Export from `src/features/workshops/index.ts`:

```ts
export { WorkshopsPage } from "./pages/workshops-page"
```

### 3. Create a Tauri Command (Rust)

In `src-tauri/src/commands/workshops.rs`:

```rust
use serde::Serialize;
use tauri::State;
use crate::db::DbState;

#[derive(Serialize)]
pub struct Workshop {
    pub id: i64,
    pub name: String,
}

#[tauri::command]
pub fn get_workshops(state: State<DbState>) -> Result<Vec<Workshop>, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn.prepare("SELECT id, name FROM workshops")
        .map_err(|e| e.to_string())?;
    let workshops = stmt.query_map([], |row| {
        Ok(Workshop {
            id: row.get(0)?,
            name: row.get(1)?,
        })
    }).map_err(|e| e.to_string())?
    .filter_map(|r| r.ok())
    .collect();
    Ok(workshops)
}
```

### 4. Register the Command

In `src-tauri/src/commands/mod.rs`:

```rust
pub mod workshops;
```

In `src-tauri/src/lib.rs`:

```rust
commands::workshops::get_workshops,
```

### 5. Add a TypeScript Wrapper

In `src/lib/tauri.ts`:

```ts
import { invoke } from "@tauri-apps/api/core"

export interface Workshop {
  id: number
  name: string
}

export function getWorkshops(): Promise<Workshop[]> {
  return invoke("get_workshops")
}
```

### 6. Add i18n Translations

Create `src/i18n/locales/en/workshops.json` and `src/i18n/locales/es/workshops.json`. Register them in `src/i18n/config.ts`.

### 7. Add to Sidebar

In `src/layouts/sidebar.tsx`, add the navigation item.

### 8. Add Permissions (if needed)

In `src-tauri/src/db/seed.rs`, add a permission key and assign it to relevant roles.

## How to Add a New Database Table

### 1. Add to Schema

In `src-tauri/src/db/schema.rs`, add your `CREATE TABLE` statement inside the `create_tables` function, increment `SCHEMA_VERSION`.

```rust
const SCHEMA_VERSION: i32 = 9; // increment

conn.execute_batch("
    CREATE TABLE IF NOT EXISTS workshops (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        ...other columns...
    );
")?;
```

### 2. Add a Rust Struct

Define a struct with `#[derive(Serialize)]` and `#[serde(rename_all = "camelCase")]`:

```rust
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Workshop {
    pub id: i64,
    pub name: String,
    pub is_active: bool,
}
```

### 3. Add CRUD Commands

Create the Tauri commands for list, get, create, update, archive operations. Follow the pattern in existing command files (e.g., `inventory.rs`).

### 4. Add TypeScript Types

In `src/types/index.ts` or a dedicated type file:

```ts
export interface Workshop {
  id: number
  name: string
  isActive: boolean
}
```

### 5. Add Tauri Wrappers

In `src/lib/tauri.ts`, add invoke wrapper functions for each command.

## How to Add a New Report

### 1. Add a Rust Command

Add a file in `src-tauri/src/commands/reports/` (or add to an existing sub-module):

```rust
#[tauri::command]
pub fn get_workshop_report(state: State<DbState>) -> Result<Vec<WorkshopReportRow>, String> {
    // SQL aggregation query
}
```

### 2. Register the Command

In `src-tauri/src/commands/reports/mod.rs`:

```rust
pub mod workshops;
pub use workshops::*;
```

In `src-tauri/src/lib.rs`, add the command to the `.invoke_handler()`.

### 3. Add a TypeScript Binding

In `src/lib/tauri.ts`:

```ts
export function getWorkshopReport(): Promise<WorkshopReportRow[]> {
  return invoke("get_workshop_report")
}
```

### 4. Create a Report Page

Create `src/features/reports/pages/reports-workshops-page.tsx`, export from `src/features/reports/index.ts`, add route in `src/routes/index.tsx`, and add sidebar item in `src/layouts/sidebar.tsx`.

### 5. Add i18n Keys

Add keys to `src/i18n/locales/{en,es}/reports.json`.

## Code Review Checklist

- [ ] TypeScript strict mode passes (`npm run typecheck`)
- [ ] ESLint passes (`npm run lint`)
- [ ] All Rust structs have `#[serde(rename_all = "camelCase")]` when serialized to frontend
- [ ] All user-facing strings use `t()` for i18n
- [ ] Tauri commands return `Result<T, String>` (not panicking)
- [ ] Database queries use parameterized statements (`?1`, `?2`), not string interpolation
- [ ] New routes are added both in the router and the sidebar
- [ ] New permissions have corresponding seed data entries
- [ ] New Rust commands are registered in `lib.rs`
- [ ] New modules are added to `commands/mod.rs`
- [ ] Frontend pages are exported from the feature's `index.ts`
- [ ] Error states, loading states, and empty states are handled in the UI

## Commit Message Convention

Use conventional commits with the `Milestone X:` prefix for milestone work:

```
Milestone X: Short description

- Bullet point of key changes
- One per logical change
- Complete sentences in past tense
```

For non-milestone work:

```
type(scope): description

feat    — new feature
fix     — bug fix
docs    — documentation
refactor — code change that neither fixes a bug nor adds a feature
style   — formatting, whitespace
chore   — maintenance, dependencies
```

Examples:
```
Milestone 12: Workshops Module

- Added workshops CRUD backend with 4 Tauri commands
- Added workshops list and form pages
- Added i18n keys for workshops (es/en)

fix(inventory): prevent division by zero in stock calculation

docs: update setup guide with Linux dependencies
```

## Branch Naming

- `feature/short-description` — new features
- `fix/short-description` — bug fixes
- `docs/short-description` — documentation changes
- `refactor/short-description` — code restructuring
- `chore/short-description` — maintenance

Example: `feature/add-workshops-module`

## Pull Request Process

1. Create a feature branch from `main`.
2. Make your changes following the guidelines above.
3. Run `npm run typecheck` and `npm run lint`.
4. Push and create a PR against `main`.
5. Ensure the PR description explains what was changed and why.
6. Link any related issues.
