# Role-Based Access Control (RBAC)

## Overview

Inventory Gear uses a comprehensive RBAC system with roles, permissions, and a role-permission join table. The system enforces access control at both the frontend (UI hiding, route guarding) and backend (Rust command authorization) levels.

## Database Schema

### Tables

Three core tables implement RBAC:

**`roles`** — Defines user roles.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto-incrementing ID |
| name | TEXT UNIQUE | Role identifier (e.g., `owner`, `cashier`) |
| description | TEXT | Human-readable description |
| is_system | INTEGER | 1 = system role (can't be deleted) |
| is_active | INTEGER | 1 = active |

**`permissions`** — Defines granular permissions.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto-incrementing ID |
| key | TEXT UNIQUE | Permission key (e.g., `sales.create`) |
| name | TEXT | Display name in Spanish |
| group_name | TEXT | Grouping category (e.g., `sales`, `inventory`) |
| description | TEXT | Description of what the permission grants |

**`role_permissions`** — Many-to-many join table.

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto-incrementing ID |
| role_id | INTEGER FK → roles.id | Role being granted permission |
| permission_id | INTEGER FK → permissions.id | Permission being granted |

## Permission Key Naming Convention

All permission keys follow the `module.action` pattern:

```
{module}.{submodule?}.{action}
```

Examples:

| Key | Meaning |
|-----|---------|
| `dashboard.view` | View the dashboard |
| `inventory.create` | Create products |
| `inventory.categories.manage` | Manage categories |
| `sales.view` | View sales |
| `sales.create` | Create sales |
| `sales.refund` | Process refunds |
| `purchases.approve` | Approve purchase orders |
| `customers.credit` | Manage customer credit accounts |
| `reports.sales.view` | View sales reports |
| `admin.users.manage` | Manage users |
| `admin.backups.manage` | Manage backups |
| `admin.database.manage` | Database maintenance |

Available modules: `dashboard`, `inventory`, `sales`, `purchases`, `customers`, `suppliers`, `reports`, `warehouse`, `vehicles`, `reminders`, `warranty`, `auth`, `admin`, `settings`, `employees`.

## Checking Permissions in the Frontend

### PermissionGuard Component

Wraps content that should only render if the user has a specific permission:

```tsx
import { PermissionGuard } from "@/components/permission-guard"

<PermissionGuard permission="sales.create">
  <Button>New Sale</Button>
</PermissionGuard>
```

Optionally provide a `fallback` ReactNode:

```tsx
<PermissionGuard permission="admin.settings.manage" fallback={<p>Contact an administrator</p>}>
  <SettingsEditor />
</PermissionGuard>
```

### AnyPermissionGuard Component

Renders children if the user has **any** of the listed permissions:

```tsx
import { AnyPermissionGuard } from "@/components/permission-guard"

<AnyPermissionGuard permissions={["sales.view", "sales.create"]}>
  <SalesSection />
</AnyPermissionGuard>
```

### ProtectedButton Component

A button that is hidden entirely if the user lacks the permission:

```tsx
import { ProtectedButton } from "@/components/protected-button"

<ProtectedButton permission="inventory.create" onClick={handleAdd}>
  Add Product
</ProtectedButton>
```

Supports an optional `tooltip` prop for disabled-state tooltips:

```tsx
<ProtectedButton permission="purchases.approve" tooltip="You don't have permission to approve">
  Approve
</ProtectedButton>
```

### usePermissions Hook

For custom conditional logic:

```tsx
import { usePermissions, usePermission } from "@/hooks"

function MyComponent() {
  const { hasPermission, hasAnyPermission, permissions } = usePermissions()

  if (hasPermission("reports.export")) {
    return <ExportButton />
  }

  return null
}
```

For a single permission check:

```tsx
const canEdit = usePermission("inventory.update")
```

### PermissionRoute (Route Guard)

Protects entire routes at the router level:

```tsx
import { PermissionRoute } from "@/components/auth-guards"

<Route
  path="/admin/settings"
  element={
    <PermissionRoute permission="admin.settings.manage">
      <AdminSettingsPage />
    </PermissionRoute>
  }
/>
```

Without the required permission, the user is redirected to `/forbidden`.

### AuthenticatedRoute / GuestRoute

```tsx
import { AuthenticatedRoute, GuestRoute } from "@/components/auth-guards"

// Protects routes that require login
<AuthenticatedRoute><DashboardPage /></AuthenticatedRoute>

// Only shown to unauthenticated users (login page)
<GuestRoute><LoginPage /></GuestRoute>
```

## Checking Permissions in the Backend (Rust)

Tauri commands can check permissions before executing. The pattern uses the command's `State` and `app_handle` to verify:

```rust
use tauri::State;
use crate::db::DbState;

#[tauri::command]
pub fn create_sale(
    state: State<DbState>,
    app_handle: tauri::AppHandle,
    input: SaleInput,
) -> Result<Sale, String> {
    // Check permission
    let user_permissions = get_current_user_permissions(&app_handle)?;
    if !user_permissions.contains(&"sales.create".to_string()) {
        return Err("Permission denied: sales.create".to_string());
    }

    // Proceed with operation
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    // ... business logic
}
```

The frontend automatically receives permission check failures as error responses and can display appropriate messages.

## Seed Roles and Their Permissions

Six roles are seeded by default:

### Owner (`owner`)
Has every permission in the system. Full access to all features, administration, and system configuration.

### Administrator (`administrator`)
Same as Owner for operational features (inventory, sales, purchases, CRM, reports, customers, suppliers, vehicles). Full access to admin module (users, roles, settings, backups, database, printers, audit, maintenance, updates, license, diagnostics, devices).

### Cashier (`cashier`)
- View dashboard
- View inventory
- View and create sales, manage quotes, cash register, receipts
- View and create customers

### Warehouse (`warehouse`)
- View dashboard
- View, create, and update inventory
- View purchases, receive POs
- View warehouse

### Purchasing (`purchasing`)
- View dashboard
- View and create inventory
- Full purchasing access (view, create, update, approve, receive, returns, requests, supplier catalog, cost history)
- View and create suppliers

### Viewer (`viewer`)
Read-only access to: dashboard, inventory, sales, purchases, customers, suppliers, reports, warehouse, vehicles, settings.

## Adding New Permissions

### 1. Add the permission key

In `src-tauri/src/db/seed.rs`, add an entry to `DEFAULT_PERMISSIONS`:

```rust
const DEFAULT_PERMISSIONS: &[(&str, &str, &str, &str)] = &[
    // ... existing permissions
    ("workshops.manage", "Gestionar Talleres", "workshops", "Manage workshops"),
];
```

### 2. Assign to roles

In the `ROLES` constant, add the permission key to the relevant role's permission list:

```rust
("owner", "Propietario", true, &[
    // ... existing permissions
    "workshops.manage",
]),
("administrator", "Administrador", true, &[
    // ... existing permissions
    "workshops.manage",
]),
```

### 3. Use in frontend

```tsx
<PermissionGuard permission="workshops.manage">
  <WorkshopManagementPanel />
</PermissionGuard>
```

### 4. Use in backend (optional)

Add permission checks to Rust commands that should be gated.

### 5. Re-run seeds

The `seed_additional_permissions` function runs on every startup and inserts any missing permissions. The existing role-permission assignments are batch-inserted using `INSERT OR IGNORE`, so it is safe to re-run.

## Permission Groups

Permissions are organized into groups for the permission matrix UI in admin role management:

| Group | Permissions |
|-------|-------------|
| `dashboard` | dashboard.view |
| `inventory` | inventory.view, create, update, delete, categories.manage, brands.manage, manufacturers.manage, suppliers.manage, warehouses.manage, storage.manage |
| `sales` | sales.view, create, refund, quotes, register, closeout, receipts |
| `purchases` | purchases.view, create, update, delete, approve, receive, returns, requests, supplier_products, cost_history |
| `customers` | customers.view, create, update, delete, credit, communication, notes |
| `suppliers` | suppliers.view, create |
| `reports` | reports.view, export, sales.view, inventory.view, purchases.view, customers.view, suppliers.view, profitability.view, create, schedule, manage_templates |
| `settings` | settings.view, manage |
| `warehouse` | warehouse.view |
| `vehicles` | vehicles.view, create, update, delete |
| `reminders` | reminders.view, manage |
| `warranty` | warranty.view, manage |
| `auth` | auth.manage |
| `admin` | admin.users.manage, roles.manage, permissions.manage, settings.manage, backups.manage, restore, database.manage, printers.manage, audit.view, maintenance.manage, updates.manage, license.manage, diagnostics.view, devices.manage |
| `employees` | employees.manage |

The permission matrix UI in `AdminRoleFormPage` displays all permissions grouped by `group_name`, with select-all checkboxes per group and individual toggles for each permission.
