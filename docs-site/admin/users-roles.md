# Users & Roles

## What is it?

Manage user accounts, roles, and permissions for role-based access control (RBAC).

## Users

### How to Access

**Sidebar → Administration → Users**. Route: `/admin/users`.

### Creating a User

1. Go to **Admin → Users**
2. Click **+ New User**
3. Fill in:
   - **Username** (required)
   - **Email** (required)
   - **Password** (required)
   - **Full Name**
   - **Role** (select from dropdown)
4. Click **Save**

### User Management

| Action | Description |
|--------|-------------|
| Edit | Modify user details |
| Deactivate | Disable without deleting |
| Reset Password | Set new password |
| Change Role | Assign different role |

## Roles

### How to Access

**Sidebar → Administration → Roles**. Route: `/admin/roles`.

### Default Roles

| Role | Access Level |
|------|-------------|
| Owner | Full system access, cannot be deleted |
| Admin | Most features, limited system settings |
| Cashier | POS, sales, product lookup |
| Warehouse | Inventory, stock, movements |
| Viewer | Read-only access |

### Creating a Custom Role

1. Go to **Admin → Roles**
2. Click **+ New Role**
3. Enter **Role Name** and **Description**
4. Select **Permissions** (granular per-module)
5. Save

### Permission Categories

- **Dashboard** — View dashboard
- **Inventory** — CRUD products, categories, stock
- **Sales** — POS, sales, quotes, returns
- **Purchases** — POs, receiving, supplier products
- **CRM** — Customers, vehicles, compatibility
- **Reports** — View and export reports
- **Admin** — System administration

## Considerations

- The Owner role cannot be deleted or demoted
- Changes to permissions take effect on next login
- Each user has one active role
- Permission changes are audited

## Related

- [Login](/getting-started/login) — Authentication
- [Diagnostics & Audit](/admin/diagnostics) — Activity tracking
