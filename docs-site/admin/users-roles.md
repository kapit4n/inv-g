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
| Reset Password | Restore the shared default `CHANGEPASSWORD` and force a change at next sign-in |
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
4. **Reset password** — use the key icon to put the account back on the shared
   default **`CHANGEPASSWORD`** and force a change at the next sign-in.

The header cards show the current totals (total employees, active accounts,
number of roles). Search filters by username, email, or full name.

### Resetting an Employee's Password

Use this when an employee has forgotten their password. There is no password to
type: the account is put back on the shared default, and the forced change is
re-armed, so the next sign-in lands on the change-password screen exactly as it
would for a newly created account.

1. Go to **Empleados**
2. Click the key icon on the employee's row
3. Read the confirmation (it names the employee and the shared default) and
   click **Confirm**

Afterwards:

- The employee signs in with **`CHANGEPASSWORD`** and the app forces them to set
  their own password before anything else opens
- The password expiry is re-armed (90 days from the reset)
- An account that must change its password is marked under the employee's name
  in the list, so you can see who has not signed in yet
- The reset is recorded in the audit trail (Diagnostics → Audit) — never the
  password itself

There is no self-service reset: an administrator performs it. Resetting your own
account from this screen is allowed and has the same effect on your next sign-in.

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
