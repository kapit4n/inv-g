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
   - **Full Name** (required)
   - **Phone / Role / Notes** (optional)
4. Click **Save**

Only users with the **Owner** or **Administrator** role can create users. For
everyone else the Users section is hidden and the routes return an "access
denied" message.

### Default Password

There is no password step when creating a user:

- Every new account starts with the shared default password **`CHANGEPASSWORD`**
- The first time the user signs in, the app forces them to change it before
  going anywhere else
- The default password also expires 90 days after creation
- Because the default is shared across accounts, never let a new user work
  before they have replaced it; the forced change happens automatically

### User Management

| Action | Description |
|--------|-------------|
| Edit | Modify user details |
| Deactivate | Disable without deleting |
| Reset Password | Set new password |
| Change Role | Assign different role |

## Employees Screen

The **Empleados** page (sidebar → **Empleados**, route `/employees`) is the
same user-management feature surfaced alongside the shop, restricted to the same
`admin.users.manage` gate as **Admin → Users**.

### What is it?

A screen to manage staff accounts (employees) without leaving the operational
area of the app. It is backed by the same accounts, roles, and permission rules
as **Admin → Users**.

### How to Access

**Sidebar → Empleados**. Only **Owner** and **Administrator** roles see a
functional page; anyone without `admin.users.manage` sees an access-denied
message (and the backend rejects any such request).

### How to Use

1. **Add employee** — click the button in the header and fill in **Username**,
   **Full name**, **Email** (required) plus **Phone** and **Role** (optional).
   New accounts start with the shared default password **`CHANGEPASSWORD`**
   and must replace it on their first login (see [Default
   Password](#default-password)).
2. **Edit employee** — use the edit (pencil) icon on a row to change the same
   fields via the pre-filled dialog.
3. **Enable / disable** — use the cross / recycle icon to disable (archive) or
   re-enable an account. Disabled accounts cannot sign in but are never deleted.

The header cards show the current totals (total employees, active accounts,
number of roles). Search filters by username, email, or full name.

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
- Only Owner and Administrator roles may create users (permission `admin.users.manage`); the backend rejects any other creator

## Related

- [Login](/getting-started/login) — Authentication
- [Diagnostics & Audit](/admin/diagnostics) — Activity tracking
