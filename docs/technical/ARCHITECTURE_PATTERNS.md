# Architecture Patterns

This document covers the key architectural decisions and implementation patterns used in Inventory Gear.

---

## 1. CRUD Pattern

Every entity in the system follows a consistent CRUD pattern. There is no generic CRUD service on the Rust side — each entity has its own commands — but the structure is highly uniform.

### Standard CRUD Commands

| Operation | Command Name | SQL Pattern | Returns |
|-----------|-------------|-------------|---------|
| **List** | `get_<entities>` | `SELECT * FROM <table> ORDER BY ...` | `Vec<Entity>` |
| **Get** | `get_<entity>` | `SELECT * FROM <table> WHERE id = ?` | `Entity` |
| **Create** | `create_<entity>` | `INSERT INTO <table> (...) VALUES (...)` → `last_insert_rowid` → re-select | `Entity` |
| **Update** | `update_<entity>` | `UPDATE <table> SET ... WHERE id = ?` → re-select | `Entity` |
| **Archive** | `archive_<entity>` | `UPDATE <table> SET is_active = 0 WHERE id = ?` | `void` |
| **Restore** | `restore_<entity>` | `UPDATE <table> SET is_active = 1 WHERE id = ?` | `void` |

### Soft-Delete Convention
- Entities use `is_active` boolean for soft-delete (not actual DELETE).
- Archived records remain in the database but are excluded from default views.
- `restore_*` commands flip `is_active` back to 1.

### Create-Then-Select Pattern
Every `create_*` command uses `last_insert_rowid()` followed by a re-select to return the full entity with database-generated defaults (timestamps, computed fields):

```rust
// Pattern from commands/inventory.rs
conn.execute("INSERT INTO brands ...", params![...])?;
let id = conn.last_insert_rowid();
let mut stmt = conn.prepare("SELECT * FROM brands WHERE id = ?1")?;
stmt.query_row(params![id], |row| { /* map to Brand */ })
```

### Pagination Pattern
The `PaginatedResult<T>` struct wraps all paginated list endpoints:

```rust
pub struct PaginatedResult<T> {
    pub data: Vec<T>,
    pub total: i64,
    pub page: i64,
    pub page_size: i64,
    pub total_pages: i64,
}
```

A generic `paginate()` helper in `inventory.rs` handles pagination, but most modules inline their own SQL with `LIMIT ? OFFSET ?`.

---

## 2. State Management Strategy

The app uses a **split state architecture**:

### Client State: Zustand
**Files:** `src/stores/*.store.ts`

Small, focused stores for UI state that doesn't need to survive page reloads:

| Store | File | Purpose |
|-------|------|---------|
| `authStore` | `auth.store.ts` | Token, current user, permissions array, login/logout actions |
| `themeStore` | `theme.store.ts` | Theme mode (light/dark/system) |
| `languageStore` | `language.store.ts` | Current language (es/en) |
| `dialogStore` | `dialog.store.ts` | Dialog visibility state (delete/confirm/prompt) |
| `notificationStore` | `notification.store.ts` | Notification queue |
| `settingsStore` | `settings.store.ts` | App settings cache |

**Pattern:**
```typescript
// src/stores/auth.store.ts
import { create } from "zustand"
import { login as apiLogin, logout as apiLogout, checkSession } from "@/lib/tauri"

interface AuthState {
  token: string | null
  user: UserResponse | null
  permissions: string[]
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  checkSession: () => Promise<boolean>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  permissions: [],
  isAuthenticated: false,

  login: async (username, password) => {
    const response = await apiLogin(username, password)
    set({
      token: response.token,
      user: response.user,
      permissions: response.permissions,
      isAuthenticated: true,
    })
  },

  logout: async () => {
    const token = get().token
    if (token) await apiLogout(token)
    set({ token: null, user: null, permissions: [], isAuthenticated: false })
  },

  checkSession: async () => {
    const token = get().token
    if (!token) return false
    const valid = await checkSession(token)
    if (!valid) set({ token: null, user: null, permissions: [], isAuthenticated: false })
    return valid
  },
}))
```

### Server State: React Query (TanStack Query)
**Files:** `src/hooks/use-crud.ts`

All data from the backend is managed through React Query:

- **Queries:** `useQuery` with `queryKey: [entity, page, sort, search, filters]`
- **Mutations:** `useMutation` for create/update/delete with automatic cache invalidation
- **Cache invalidation:** `queryClient.invalidateQueries({ queryKey: [entity] })` on mutation success

```typescript
// Pattern from use-crud.ts
const paginatedQuery = useQuery({
  queryKey: [queryKey, page, pageSize, sort, search, filters],
  queryFn: () => service.paginate({ page, pageSize }, sort, filters),
})

const createMutation = useMutation({
  mutationFn: (data) => service.create(data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: [queryKey] })
    notification.success("Success", "Created successfully")
  },
  onError: (error) => {
    notification.error("Error", `Failed: ${error}`)
  },
})
```

### State Rules
- **Never** store server data in Zustand — use React Query cache instead
- **Never** store UI state (dialog open, selected tab) in React Query
- **Session/auth state** lives in both Zustand (runtime) and SQLite (persistent sessions table)

---

## 3. Form Handling Pattern

All forms use **controlled components** with explicit state management (no form libraries like Formik or React Hook Form).

### Component Structure

```tsx
function ProductForm() {
  const [name, setName] = useState("")
  const [sku, setSku] = useState("")
  const [price, setPrice] = useState(0)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!name) errs.name = "Name is required"
    if (!sku) errs.sku = "SKU is required"
    if (price <= 0) errs.price = "Price must be positive"
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = () => {
    if (!validate()) return
    createProduct({ name, sku, costPrice: price, ... })
  }

  return (
    <div className="space-y-4">
      <TextField label="Name" value={name} onChange={setName} error={errors.name} required />
      <TextField label="SKU" value={sku} onChange={setSku} error={errors.sku} required />
      <NumberField label="Price" value={price} onChange={setPrice} error={errors.price} />
      <Button onClick={handleSubmit}>Save</Button>
    </div>
  )
}
```

### FormFieldWrapper
The `FormFieldWrapper` component provides consistent layout for all field types:

```tsx
<FormFieldWrapper label="Name" error={errors.name} description="Product display name" required>
  <Input value={name} onChange={(e) => setName(e.target.value)} />
</FormFieldWrapper>
```

### Field Types
- `TextField` — text input
- `NumberField` — number input with min/max/step
- `SelectField` — dropdown from options
- `DateField` — date picker
- `TextareaField` — multi-line text
- `SwitchField` — boolean toggle
- `CheckboxField` — checkbox
- `CurrencyField` — formatted currency input
- `PhoneField` — phone input
- `EmailField` — email input with validation
- `CustomerSearchField` — autocomplete customer search

---

## 4. DataTable Pattern

The `DataTable` is the primary component for displaying tabular data across the entire app.

### Column Definitions

```typescript
interface TableColumn<T> {
  id: string
  header: string
  accessorKey?: keyof T          // Direct property access
  accessorFn?: (row: T) => ReactNode  // Computed value
  cell?: (props: { row: T; value: unknown }) => ReactNode  // Custom render
  enableSorting?: boolean
  enableHiding?: boolean
  size?: number
  meta?: { align?: "left" | "center" | "right" }
}
```

### Cell Renderer Patterns

| Pattern | Example |
|---------|---------|
| **Direct value** | `accessorKey: "name"` |
| **Formatted value** | `cell: ({ value }) => \`$\${value.toFixed(2)}\`` |
| **Status badge** | `cell: ({ value }) => <Badge variant={value}>{value}</Badge>` |
| **Boolean icon** | `cell: ({ value }) => value ? <CheckCircle /> : <XCircle />` |
| **Action buttons** | `cell: ({ row }) => <Button onClick={() => edit(row)}>Edit</Button>` |

### Action Pattern

```typescript
actions={[
  {
    label: "Edit",
    onClick: (row) => navigate(`/${entity}/${row.id}/edit`),
  },
  {
    label: "Delete",
    onClick: (row) => dialogStore.openDelete(entity, () => deleteMutation.mutate(row.id)),
    variant: "destructive",
  },
]}
```

### Row Selection for Bulk Actions

```typescript
bulkActions={[
  {
    label: "Archive Selected",
    onClick: (selected) => archiveMutation.mutate(Array.from(selected)),
    variant: "outline",
  },
]}
```

---

## 5. Pagination and Search Patterns

### Backend Pagination
Commands that support pagination accept `page` and `pageSize` parameters and return `PaginatedResult<T>`:

```rust
pub fn get_products(
    state: State<DbState>,
    page: i64,
    page_size: i64,
    search: Option<String>,
) -> Result<PaginatedResult<Product>, String>
```

SQL pattern:
```sql
SELECT COUNT(*) FROM products WHERE name LIKE ?1  -- total
SELECT * FROM products WHERE name LIKE ?1 ORDER BY id DESC LIMIT ?2 OFFSET ?3
```

### Search Implementation
Search is done server-side using SQL `LIKE '%term%'` on relevant columns:

| Entity | Searchable Columns |
|--------|-------------------|
| Products | name, sku, barcode, oem_number, internal_code |
| Customers | name, phone, email |
| Sales | sale_number, customer name (JOIN) |
| Purchase Orders | PO number, supplier name (JOIN) |
| Admin Users | username, email, full_name |

### Frontend Pagination Hook
```typescript
// src/hooks/use-pagination.ts
const { page, pageSize, setPage, setPageSize } = usePagination({ defaultPageSize: 20 })
```

### Frontend Search Hook
```typescript
// src/hooks/use-search.ts
const { search, debouncedSearch, setSearch } = useSearch({ debounceMs: 300 })
```

---

## 6. Error Handling Strategy

### Rust Backend: AppError Enum

```rust
// src-tauri/src/error.rs
#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("Database error: {0}")]
    Database(#[from] rusqlite::Error),

    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("Serialization error: {0}")]
    Serialization(#[from] serde_json::Error),

    #[error("Configuration error: {0}")]
    Config(String),

    #[error("Not found: {0}")]
    NotFound(String),

    #[error("Internal error: {0}")]
    Internal(String),
}
```

All commands flatten errors to `String` for IPC:
```rust
.map_err(|e| e.to_string())
```

### Frontend: Error Boundary

```typescript
// src/components/error-boundary.tsx
class ErrorBoundary extends React.Component<Props, { hasError: boolean; error?: Error }> {
  state = { hasError: false }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} onRetry={() => this.setState({ hasError: false })} />
    }
    return this.props.children
  }
}
```

### Frontend: Notification System

```typescript
// src/hooks/use-notification.ts
const notification = useNotification()

// Usage in mutations:
notification.success("Created", "Product saved successfully")
notification.error("Error", `Failed: ${error}`)
notification.info("Info", "Processing...")
notification.warning("Warning", "Stock is low")
```

### Error Handling Layers

```
┌─────────────────────────────────────────────────────┐
│ ErrorBoundary (component crash)                      │
│   → Fallback UI with retry button                   │
├─────────────────────────────────────────────────────┤
│ React Query onError callbacks                        │
│   → Notification toast with error message           │
├─────────────────────────────────────────────────────┤
│ try/catch in mutations                               │
│   → setErrors on form fields                        │
├─────────────────────────────────────────────────────┤
│ Rust Result<_, String> → rejected Promise            │
│   → .map_err(|e| e.to_string())                     │
└─────────────────────────────────────────────────────┘
```

---

## 7. i18n Architecture

### Configuration

```typescript
// src/i18n/config.ts
i18n.use(initReactI18next).init({
  resources: { es: { ... }, en: { ... } },
  lng: "es",
  fallbackLng: "es",
  defaultNS: "common",
  ns: ["common", "dashboard", "inventory", "sales", "purchases", "customers",
       "suppliers", "vehicles", "warehouse", "reports", "settings", "auth",
       "employees", "validation", "errors", "help", "crm", "admin"],
  nsSeparator: ".",
  interpolation: { escapeValue: false },
})
```

### 18 Namespaces

| Namespace | Purpose | Example Key |
|-----------|---------|-------------|
| `common` | Shared labels, buttons | `common.save`, `common.cancel` |
| `dashboard` | Dashboard widgets | `dashboard.totalSales` |
| `inventory` | Products, categories, brands | `inventory.productName` |
| `sales` | POS, quotes, receipts | `sales.checkout` |
| `purchases` | POs, receiving, returns | `purchases.poNumber` |
| `customers` | Customer management | `customers.creditLimit` |
| `suppliers` | Supplier management | `suppliers.companyName` |
| `vehicles` | Vehicle catalog | `vehicles.brand` |
| `warehouse` | Warehouses, locations | `warehouse.utilization` |
| `reports` | Reports module | `reports.salesDaily` |
| `settings` | App settings | `settings.storeName` |
| `auth` | Login, permissions | `auth.loginButton` |
| `employees` | User management | `employees.role` |
| `validation` | Form validation messages | `validation.required` |
| `errors` | Error messages | `errors.notFound` |
| `help` | Help tooltips | `help.productCreation` |
| `crm` | CRM dashboard | `crm.customerGrowth` |
| `admin` | Admin panel | `admin.backupCreated` |

### Usage in Components

```tsx
import { useTranslation } from "react-i18next"

function ProductForm() {
  const { t } = useTranslation("inventory")
  return <h1>{t("createProduct")}</h1>
  // Dot notation for nested keys:
  // t("details.name") → inventory.details.name
}
```

### Language Store
```typescript
// src/stores/language.store.ts
export const useLanguageStore = create({
  language: "es",
  setLanguage: (lang: string) => {
    i18n.changeLanguage(lang)
    set({ language: lang })
  },
})
```

---

## 8. RBAC Implementation

### Permission Model
Permissions are stored in the `permissions` table with key, name, group, and description. They are assigned to roles via the `role_permissions` join table.

### Permission Keys
Permissions follow `module.action` format:

```
dashboard.view
inventory.create
sales.refund
purchases.approve
admin.users.manage
reports.profitability.view
```

### 80+ Permissions in 15 Groups
Defined in `src-tauri/src/db/seed.rs`:

```
dashboard, inventory, sales, purchases, customers, suppliers,
reports, employees, settings, warehouse, vehicles, reminders,
warranty, auth, admin
```

### 6 Default Roles

| Role | Description | Permissions |
|------|-------------|-------------|
| `owner` | Full access to everything | 70+ permissions |
| `administrator` | All permissions except auth.manage | 70+ permissions |
| `cashier` | POS operations, view inventory | ~6 permissions |
| `warehouse` | Inventory view, create, receive PO | ~5 permissions |
| `purchasing` | Full purchasing workflow | ~12 permissions |
| `viewer` | Read-only access | ~9 permissions |

### Frontend Permission Checking

**PermissionGuard** — Conditionally renders children:
```tsx
<PermissionGuard permission="admin.users.manage">
  <UserManagementPanel />
</PermissionGuard>
```

**ProtectedButton** — Disables if permission missing:
```tsx
<ProtectedButton permission="inventory.create" onClick={handleCreate}>
  Add Product
</ProtectedButton>
```

Both components read from the Zustand auth store:
```typescript
const permissions = useAuthStore((s) => s.permissions)
const hasPermission = permissions.includes(requiredPermission)
```

### Rust Permission Checking
Commands do **not** enforce permissions at the Rust level. Permission validation happens exclusively on the frontend. The `get_user_permissions_list` command provides the user's permission set for the frontend guard components.

---

## 9. Theming System

### CSS Variables + TailwindCSS

```css
/* Root variables for light mode */
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  --primary-foreground: 210 40% 98%;
  --destructive: 0 84.2% 60.2%;
  --muted: 210 40% 96.1%;
  --card: 0 0% 100%;
  --border: 214.3 31.8% 91.4%;
}

/* Dark mode overrides */
.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --primary: 217.2 91.2% 59.8%;
  --destructive: 0 62.8% 30.6%;
  --muted: 217.2 32.6% 17.5%;
  --card: 222.2 84% 4.9%;
  --border: 217.2 32.6% 17.5%;
}
```

### Theme Store

```typescript
// src/stores/theme.store.ts
export const useThemeStore = create((set) => ({
  theme: "system" as "light" | "dark" | "system",
  setTheme: (theme) => {
    set({ theme })
    applyTheme(theme)
  },
}))

function applyTheme(theme: string) {
  const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)
  document.documentElement.classList.toggle("dark", isDark)
}
```

### Usage in Components
```tsx
// Tailwind utility classes use CSS variables:
<div className="bg-background text-foreground border-border" />
<div className="bg-card text-card-foreground" />
<Button variant="destructive" />
<Badge variant="secondary" />
```

---

## 10. Database Connection Management

### Architecture

```rust
// src-tauri/src/db/connection.rs
pub struct DbState {
    pub conn: Arc<Mutex<Connection>>,
}

// Global singleton for auth commands
static DB_STATE: OnceLock<DbState> = OnceLock::new();

// Tauri managed state for all other commands
tauri::Builder::default()
    .manage(tauri_state)  // Available as State<DbState>
```

### Connection Lifecycle

1. **App start** → `init_database()` opens SQLite file
2. **Pragmas set** → `journal_mode=WAL`, `foreign_keys=ON`
3. **Schema** → `schema::create_tables()` runs if `user_version < SCHEMA_VERSION`
4. **Seed data** → `seed::seed_database()` inserts defaults if users table is empty
5. **Tauri managed** → `DbState` is cloned and injected into Tauri's state system

### Connection Access Patterns
Every command follows:
```rust
let conn = state.conn.lock().map_err(|e| e.to_string())?;
```
or (for auth):
```rust
let db = DB_STATE.get().ok_or("Database not initialized")?;
let conn = db.conn.lock().map_err(|e| e.to_string())?;
```

### Transaction Handling
Transactions are implicit (auto-commit per statement) except for `process_checkout` which relies on SQLite's WAL mode atomicity. No explicit `BEGIN`/`COMMIT` is used in the codebase — each command is a single implicit transaction.

---

## 11. Seed Data Pipeline

### Check-and-Seed Pattern

Located in `src-tauri/src/db/seed.rs`. The pipeline runs on every app start but is **idempotent**:

```rust
pub fn seed_database(conn: &Connection) -> Result<()> {
    // Check: only seed if users table is empty
    let existing_users: i64 = conn.query_row("SELECT COUNT(*) FROM users", ...)?;
    if existing_users == 0 {
        seed_permissions(conn)?;
        seed_roles(conn)?;
        seed_users(conn)?;
        seed_settings(conn)?;
        seed_categories(conn)?;
        seed_brands(conn)?;
        seed_manufacturers(conn)?;
        seed_suppliers(conn)?;
        seed_warehouses(conn)?;
        seed_storage_locations(conn)?;
        seed_products(conn)?;
    }

    // Always run (check existence internally via SELECT COUNT)
    seed_additional_permissions(conn)?;
    seed_application_settings(conn)?;
    seed_printer_settings(conn)?;
    seed_device_settings(conn)?;
    seed_license_record(conn)?;
    seed_system_update_record(conn)?;

    Ok(())
}
```

### Seed Data Summary

| Entity | Records | Identity |
|--------|---------|----------|
| Permissions | 80+ | Key-based |
| Roles | 6 | Name-based |
| Users | 6 | Username-based |
| Settings | 12 | Key-based |
| Application Settings | 40+ | Key-based |
| Categories | 10 | Name-based |
| Brands | 8 | Name-based |
| Manufacturers | 6 | Name-based |
| Suppliers | 4 | Name-based |
| Warehouses | 3 | Name-based |
| Storage Locations | 7 | Code-based |
| Products | 15 | SKU-based |

### Default Users
| Username | Password | Role |
|----------|----------|------|
| `owner` | 123456 | owner |
| `admin` | 123456 | administrator |
| `cashier` | 123456 | cashier |
| `warehouse` | 123456 | warehouse |
| `purchasing` | 123456 | purchasing |
| `viewer` | 123456 | viewer |

---

## 12. Report Generation Architecture

### SQL Aggregation Pattern

All reports use SQL aggregate functions for computation:

```sql
-- Example: Daily sales report
SELECT date(created_at) as day,
       COUNT(*) as sale_count,
       SUM(total) as revenue,
       SUM(tax_amount) as tax,
       SUM(discount_amount) as discounts
FROM sales
WHERE created_at >= ?1 AND created_at <= ?2
  AND payment_status != 'refunded'
GROUP BY date(created_at)
ORDER BY day
```

### Report Filter Pattern

Reports accept filter structs with date ranges, entity IDs, and grouping options:

```typescript
interface SalesReportFilter {
  dateFrom?: string
  dateTo?: string
  userId?: number
  customerId?: number
  paymentMethod?: string
  warehouseId?: number
}
```

### Report Types

| Category | Reports | Granularity |
|----------|---------|-------------|
| Sales | Daily, Weekly, Monthly, Yearly, By Cashier, By Payment Method | Time-period |
| Inventory | Full report, Valuation, Low Stock, Aging, Fast/Slow, Movements | Snapshot |
| Purchasing | By Month, By Supplier, PO Status, Reorder, Cost History | Time-period |
| Customers | Top N, Growth, Locations, Inactive, Credit Summary | Snapshot |
| Suppliers | Ranking, Lead Time Analysis | Snapshot |
| Warehouse | Utilization, Stock Distribution, Adjustments | Snapshot |
| Profitability | Summary, By Category, Product, Supplier, Brand, Customer, Warehouse | Time-period |
| KPIs | Values, Definitions | Snapshot |

### Report Pagination
Most report functions return full arrays (not paginated) since they are designed for export/display with filtering applied before retrieval. The `log_report_generation` command records execution time, row count, and export format for audit.

---

## 13. Settings Architecture

### Two-tier Settings System

**Legacy settings** (`settings` table): Used by the simpler `settings` module commands.

**Application settings** (`application_settings` table): Full-featured key-value store used by the `admin/settings` module.

### Application Settings Schema

```sql
CREATE TABLE application_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,     -- e.g., 'general', 'security', 'printing', 'backup'
    key TEXT NOT NULL UNIQUE,   -- e.g., 'store_name', 'auto_backup'
    value TEXT,                 -- Stored as string
    setting_type TEXT NOT NULL, -- 'string', 'number', 'boolean', 'json'
    description TEXT,
    options TEXT,               -- JSON array for select-type settings
    is_system BOOLEAN DEFAULT 0,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT,
    updated_at TEXT
);
```

### Setting Categories

```typescript
interface SettingCategory {
  id: string           // e.g., 'general', 'security', 'inventory'
  name: string         // Display name
  description: string
  icon?: string
  sortOrder: number
  settings: AdminAppSetting[]
}
```

40+ application settings across 13 categories:

| Category | Example Settings | Count |
|----------|-----------------|-------|
| `general` | store_name, currency, timezone | 5 |
| `theme` | theme | 1 |
| `localization` | date_format, number_format | 3 |
| `security` | auto_logout, password_min_length, lockout | 7 |
| `inventory` | low_stock_threshold, barcode_format | 3 |
| `sales` | receipt_footer, invoice_prefix | 3 |
| `purchasing` | po_prefix | 1 |
| `printing` | default_printer, paper_size | 5 |
| `database` | auto_vacuum | 1 |
| `backup` | auto_backup, backup_interval, retention | 6 |
| `updates` | auto_check_updates, update_channel | 2 |
| `performance` | cache_enabled, cache_ttl | 2 |
| `system` | app_version (read-only) | 1 |

### Type Validation

Settings are stored as strings but tagged with `setting_type`:

| Type | Frontend Component | Validation |
|------|-------------------|------------|
| `string` | TextField | None |
| `number` | NumberField | Must be numeric |
| `boolean` | SwitchField | true/false |
| `json` | Textarea | Must parse as JSON |

### Setting History

```sql
CREATE TABLE setting_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    setting_key TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    action TEXT,         -- 'updated', 'reset'
    user_id INTEGER,
    username TEXT,
    details TEXT,
    created_at TEXT
);
```

Changes are logged via `get_setting_history`/`reset_setting_to_default` commands.
