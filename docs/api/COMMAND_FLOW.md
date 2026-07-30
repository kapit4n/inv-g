# IPC Command Flow Architecture

This document describes how data flows from the frontend UI through Tauri IPC into the Rust backend, SQLite, and back.

---

## End-to-End Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│ FRONTEND (React + TypeScript)                                       │
│                                                                     │
│  ┌─────────────┐   ┌──────────┐   ┌──────────────────────────────┐ │
│  │ Component    │──→│ React    │──→│ src/lib/tauri.ts            │ │
│  │ (Button,     │   │ Query    │   │ invoke<T>("cmd", {args})    │ │
│  │  Form, etc)  │   │ /Mutation│   │                              │ │
│  └─────────────┘   └──────────┘   └──────────┬───────────────────┘ │
│                                              │ invoke()             │
│                                              ▼                      │
│                                    ┌──────────────────┐            │
│                                    │ Tauri IPC Bridge  │            │
│                                    │ (JSON serialized) │            │
│                                    └────────┬─────────┘            │
└─────────────────────────────────────────────┼───────────────────────┘
                                              │ IPC Boundary
┌─────────────────────────────────────────────┼───────────────────────┐
│ TAURI RUST BACKEND                          │                       │
│                                              ▼                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  tauri::generate_handler![...]                               │   │
│  │  Route: "command_name" → #[tauri::command] fn               │   │
│  └──────────────────────────┬───────────────────────────────────┘   │
│                             │                                        │
│                             ▼                                        │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Command Function (e.g., process_checkout)                   │   │
│  │  pub fn process_checkout(state: State<DbState>,             │   │
│  │                           input: CheckoutInput)              │   │
│  │              → Result<CheckoutResult, String>                │   │
│  └──────────────────────────┬───────────────────────────────────┘   │
│                             │                                        │
│                             ▼                                        │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  DB_STATE / State<DbState>                                   │   │
│  │  Arc<Mutex<Connection>>                                       │   │
│  │  conn.lock() → MutexGuard → rusqlite::Connection             │   │
│  └──────────────────────────┬───────────────────────────────────┘   │
│                             │                                        │
│                             ▼                                        │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  rusqlite (prepared statements, params!, query_map,          │   │
│  │            execute, last_insert_rowid)                        │   │
│  └──────────────────────────┬───────────────────────────────────┘   │
│                             │                                        │
│                             ▼                                        │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  SQLite Database File                                        │   │
│  │  (WAL mode, foreign_keys ON, pragma-optimized)               │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Return path: Result<T, String> → serde Serialize (camelCase)      │
│              → Tauri IPC → JSON → TypeScript deserialize           │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Key Architectural Components

### Database Connection Management
```
src-tauri/src/db/connection.rs

DbState {
    conn: Arc<Mutex<Connection>>  // Thread-safe shared connection
}

// Global singleton for auth commands (use DB_STATE directly)
static DB_STATE: OnceLock<DbState> = OnceLock::new();

// Managed Tauri state for other commands
tauri::Builder::default()
    .manage(tauri_state)  // Available as State<DbState>
```

Every command follows one of two access patterns:

**Pattern A — Managed State (most commands):**
```rust
#[tauri::command]
pub fn get_customers(state: State<DbState>, search: Option<String>) -> Result<Vec<Customer>, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    // ... SQL queries ...
}
```

**Pattern B — Global Singleton (auth commands):**
```rust
#[tauri::command]
pub fn login(username: String, password: String) -> Result<LoginResponse, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;
    // ... SQL queries ...
}
```

### Error Handling
All commands return `Result<T, String>`. The `AppError` enum in `src-tauri/src/error.rs` provides typed errors (Database, NotFound, Config, etc.) but commands use `.map_err(|e| e.to_string())` to flatten them to strings for IPC.

---

## Sequence Diagrams

### 1. Login Flow

```
Frontend                          Tauri IPC                Rust Backend                  SQLite
   │                                │                          │                            │
   │  login("admin", "123456")      │                          │                            │
   │────────────────────────────────→ invoke() ───────────────→│                            │
   │                                │                          │                            │
   │                                │  login(username, password)                            │
   │                                │                          │                            │
   │                                │                          │ QUERY: SELECT id, username, │
   │                                │                          │   email, password_hash,    │
   │                                │                          │   full_name, role_id,      │
   │                                │                          │   is_active, created_at    │
   │                                │                          │   FROM users               │
   │                                │                          │   WHERE username=?         │
   │                                │                          │   AND is_active=1          │
   │                                │                          │───────────────────────────→│
   │                                │                          │                            │
   │                                │                          │ User row                   │
   │                                │                          │←───────────────────────────│
   │                                │                          │                            │
   │                                │                          │ bcrypt::verify(password,   │
   │                                │                          │   password_hash)            │
   │                                │                          │                            │
   │                                │                          │ UUID::new_v4() → token     │
   │                                │                          │                            │
   │                                │                          │ INSERT INTO user_sessions  │
   │                                │                          │   (user_id, token,         │
   │                                │                          │    expires_at)              │
   │                                │                          │───────────────────────────→│
   │                                │                          │                            │
   │                                │                          │ UPDATE users SET           │
   │                                │                          │   last_login_at            │
   │                                │                          │───────────────────────────→│
   │                                │                          │                            │
   │                                │                          │ INSERT INTO audit_logs     │
   │                                │                          │   (login action)           │
   │                                │                          │───────────────────────────→│
   │                                │                          │                            │
   │                                │                          │ QUERY: role name,          │
   │                                │                          │   user permissions         │
   │                                │                          │───────────────────────────→│
   │                                │                          │                            │
   │                                │←─── LoginResponse ───────│                            │
   │                                │     { user, token,       │                            │
   │                                │       permissions }      │                            │
   │←────────────────────────────────│                          │                            │
   │                                │                          │                            │
   │ Store token in auth store      │                          │                            │
   │ (Zustand: auth.store.ts)       │                          │                            │
   │ Redirect to dashboard          │                          │                            │
```

### 2. POS Checkout Flow

```
Frontend                          Tauri IPC                Rust Backend                  SQLite
   │                                │                          │                            │
   │  processCheckout(input)        │                          │                            │
   │────────────────────────────────→ invoke() ───────────────→│                            │
   │                                │                          │                            │
   │                                │  process_checkout(        │                            │
   │                                │    input: CheckoutInput) │                            │
   │                                │                          │                            │
   │                                │                          │─── BEGIN TRANSACTION ──────→│
   │                                │                          │    (implicit, WAL mode)     │
   │                                │                          │                            │
   │                                │                          │ COUNT(*) FROM sales         │
   │                                │                          │ → next_sale_number()        │
   │                                │                          │───────────────────────────→│
   │                                │                          │                            │
   │                                │                          │ COUNT(*) FROM receipts      │
   │                                │                          │ → next_receipt_number()     │
   │                                │                          │───────────────────────────→│
   │                                │                          │                            │
   │                                │                          │ INSERT INTO sales           │
   │                                │                          │   (sale_number,             │
   │                                │                          │    receipt_number,          │
   │                                │                          │    customer_id, user_id,    │
   │                                │                          │    subtotal, total, ...)    │
   │                                │                          │───────────────────────────→│
   │                                │                          │                            │
   │                                │                          │ ← last_insert_rowid →      │
   │                                │                          │                            │
   │                                │                          │ FOR EACH item:              │
   │                                │                          │   INSERT INTO sale_items   │
   │                                │                          │───────────────────────────→│
   │                                │                          │                            │
   │                                │                          │   UPDATE products SET      │
   │                                │                          │     stock_quantity =        │
   │                                │                          │     stock_quantity - qty   │
   │                                │                          │───────────────────────────→│
   │                                │                          │                            │
   │                                │                          │   INSERT INTO              │
   │                                │                          │     inventory_movements   │
   │                                │                          │     (type='out',           │
   │                                │                          │      ref='sale')           │
   │                                │                          │───────────────────────────→│
   │                                │                          │                            │
   │                                │                          │ FOR EACH payment:           │
   │                                │                          │   INSERT INTO              │
   │                                │                          │     sale_payments         │
   │                                │                          │───────────────────────────→│
   │                                │                          │                            │
   │                                │                          │ INSERT INTO receipts       │
   │                                │                          │   (sale_id, receipt_number │
   │                                │                          │    type='sale')            │
   │                                │                          │───────────────────────────→│
   │                                │                          │                            │
   │                                │                          │ SELECT sale + joins        │
   │                                │                          │   (to return full data)    │
   │                                │                          │───────────────────────────→│
   │                                │                          │                            │
   │                                │                          │─── COMMIT ─────────────────→│
   │                                │                          │                            │
   │                                │←── CheckoutResult ───────│                            │
   │                                │     { sale, items,       │                            │
   │                                │       payments,          │                            │
   │                                │       receipt_number }   │                            │
   │←────────────────────────────────│                          │                            │
   │                                │                          │                            │
   │ Invalidate React Query         │                          │                            │
   │ keys for sales, inventory,     │                          │                            │
   │ dashboard                      │                          │                            │
   │ Print receipt                  │                          │                            │
   │ Show success notification      │                          │                            │
```

### 3. Product CRUD Flow

#### Create Product

```
Frontend                          Tauri IPC                Rust Backend                  SQLite
   │                                │                          │                            │
   │  createProduct(data)           │                          │                            │
   │────────────────────────────────→ invoke() ───────────────→│                            │
   │                                │                          │                            │
   │                                │  create_product(name,    │                            │
   │                                │    sku, cost_price,      │                            │
   │                                │    sale_price, ...)      │                            │
   │                                │                          │                            │
   │                                │                          │ INSERT INTO products       │
   │                                │                          │   (name, sku, barcode,     │
   │                                │                          │    cost_price, sale_price, │
   │                                │                          │    stock_quantity, ...)    │
   │                                │                          │───────────────────────────→│
   │                                │                          │                            │
   │                                │                          │ ← last_insert_rowid        │
   │                                │                          │                            │
   │                                │                          │ SELECT * FROM products     │
   │                                │                          │   WHERE id = ?             │
   │                                │                          │───────────────────────────→│
   │                                │                          │                            │
   │                                │←── InventoryProduct ─────│                            │
   │←────────────────────────────────│                          │                            │
```

#### Update Product

```
   │  updateProduct({ id, ... })    │                          │                            │
   │────────────────────────────────→ invoke() ───────────────→│                            │
   │                                │                          │                            │
   │                                │                          │ UPDATE products SET         │
   │                                │                          │   name=?, sku=?,            │
   │                                │                          │   cost_price=?,             │
   │                                │                          │   updated_at=datetime(...)  │
   │                                │                          │   WHERE id=?               │
   │                                │                          │───────────────────────────→│
   │                                │                          │                            │
   │                                │                          │ SELECT * FROM products     │
   │                                │                          │   WHERE id = ?             │
   │                                │                          │───────────────────────────→│
   │                                │                          │                            │
   │                                │←── InventoryProduct ─────│                            │
   │←────────────────────────────────│                          │                            │
```

#### Archive Product (Soft Delete)

```
   │  archiveProduct(id)            │                          │                            │
   │────────────────────────────────→ invoke() ───────────────→│                            │
   │                                │                          │                            │
   │                                │                          │ UPDATE products SET         │
   │                                │                          │   is_active = 0,           │
   │                                │                          │   updated_at = datetime(..)│
   │                                │                          │   WHERE id = ?             │
   │                                │                          │───────────────────────────→│
   │                                │                          │                            │
   │                                │←── void ─────────────────│                            │
   │←────────────────────────────────│                          │                            │
```

#### Restore Product

```
   │  restoreProduct(id)            │                          │                            │
   │────────────────────────────────→ invoke() ───────────────→│                            │
   │                                │                          │                            │
   │                                │                          │ UPDATE products SET         │
   │                                │                          │   is_active = 1,           │
   │                                │                          │   updated_at = datetime(..)│
   │                                │                          │   WHERE id = ?             │
   │                                │                          │───────────────────────────→│
   │                                │                          │                            │
   │                                │←── void ─────────────────│                            │
   │←────────────────────────────────│                          │                            │
```

#### Stock Management During Product CRUD

When a product is created, stock is set via `stock_quantity`. Actual stock changes happen through:

1. **Checkout** (`process_checkout`) — deducts stock: `stock_quantity - quantity`
2. **Purchase Receiving** (`receive_purchase_order`) — adds stock: `stock_quantity + quantity`
3. **Inventory Movements** (`create_inventory_movement`) — adjusts stock by signed quantity
4. **Refund** (`refund_sale`) — restores stock: `stock_quantity + quantity`

Each stock change also creates an `inventory_movements` record with type (`in`/`out`), reference type, and reference ID for full traceability.

```
Example: Stock movement chain for a product sale
┌──────────┐     ┌──────────────┐     ┌──────────────────┐
│ Product   │────→│ Sale Item    │────→│ Inventory        │
│ stock_qt │     │ quantity=N   │     │ Movement         │
│ = old - N│     │ total=$X     │     │ type='out'       │
└──────────┘     └──────────────┘     │ ref='sale'       │
                                      └──────────────────┘
```

---

## Frontend Data Flow Patterns

### React Query Pattern (Server State)
```typescript
// src/hooks/use-crud.ts
const paginatedQuery = useQuery<PaginatedResult<T>>({
  queryKey: [queryKey, page, pageSize, sort, search, filters],
  queryFn: () => service.paginate({ page, pageSize }, sort, filters),
})

const createMutation = useMutation({
  mutationFn: (data: Partial<T>) => service.create(data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: [queryKey] })
    notification.success("Creado", "El registro se creó correctamente")
  },
})
```

### Zustand Pattern (Client State)
```typescript
// src/stores/auth.store.ts
interface AuthState {
  token: string | null
  user: UserResponse | null
  permissions: string[]
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  checkSession: () => Promise<boolean>
}
```

### Direct invoke Pattern (Simple calls)
```typescript
// src/lib/tauri.ts
export async function getAppVersion(): Promise<string> {
  return invoke<string>("get_app_version")
}
```

---

## IPC Serialization Details

### Rust → Frontend (serde rename_all = "camelCase")
```rust
#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Sale {
    pub id: i64,
    pub sale_number: String,     // → saleNumber
    pub customer_id: Option<i64>, // → customerId
    pub created_at: String,      // → createdAt
}
```

### Frontend → Rust (camelCase in TypeScript, deserialized as snake_case)
```typescript
interface CheckoutInput {
  customerId?: number       // → customer_id in Rust
  warehouseId?: number      // → warehouse_id in Rust
  paymentMethod: string     // → payment_method in Rust
}
```

### Numeric Types
- SQLite `INTEGER` → Rust `i64` → TypeScript `number`
- SQLite `REAL` → Rust `f64` → TypeScript `number`
- SQLite `TEXT` → Rust `String` → TypeScript `string`
- SQLite `INTEGER` (boolean) → Rust `i64` (compared as `!= 0`) → TypeScript `boolean`
