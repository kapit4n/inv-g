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

## Roles

### How to Access

**Sidebar → Administration → Roles**. Route: `/admin/roles`.

### Default Roles

| Role | Access Level |
|------|-------------|
| Owner | Full system access, cannot be deleted |
| Admin | Most features, limited system settings |
| Cashier | **Sales module only** (plus the dashboard) — a selling-only account |
| Warehouse | Inventory, stock, movements |
| Viewer | Read-only access |

### Cashier — the selling-only role

A cashier account is focused purely on selling. It can open only the **Sales**
module and the **Dashboard**:

- **Visible and usable:** Dashboard and every Sales screen — Point of Sale,
  Sales history, Quotes, Returns, Cash register, Receipts, Daily closeout and
  the Sales customers list
- **Hidden and blocked:** Inventory, Purchases, CRM (including the standalone
  Customers and Vehicles pages), Warehouse, Reports, Employees, Admin, and
  Settings

Hidden modules are not merely removed from the sidebar: opening one directly —
via a bookmarked address, the command palette, or a hand-typed URL — sends the
user to the access-denied screen. The shared tools that are not part of a
business module (Part finder, Help, Manual) stay open.

Attaching a customer to a sale, and opening a new customer from the POS, remain
part of the sale itself and are available to a cashier.

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
- A module is shown in the sidebar and may be opened only when the role carries
  that module's permission, so a cashier sees Sales only while an administrator
  sees everything
- A blocked URL redirects to the access-denied screen; it is not enough to hide
  the menu entry, because a bookmark or the command palette could still reach it
- The seeded role permissions apply to **new** databases. On an existing
  database, review the role under **Admin → Roles** and adjust its permissions
  to match

## Related

- [Login](/getting-started/login) — Authentication
- [Diagnostics & Audit](/admin/diagnostics) — Activity tracking
