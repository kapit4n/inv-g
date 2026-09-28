# Database & Backups

## What is it?

Manage the SQLite database — view schema info, create backups, restore data, and run maintenance.

## How to Access

**Sidebar → Administration → Database**. Route: `/admin/database`.

## Database Info

The database page shows:
- Schema version
- Table counts and sizes
- Total records
- Database file size

## Backups

### How to Access

**Sidebar → Administration → Backups**. Route: `/admin/backups`.

### Creating a Backup

1. Go to **Admin → Backups**
2. Click **Create Backup**
3. Enter a **description** (optional)
4. Wait for completion
5. Backup is stored locally

### Backup Contents

Each backup includes:
- Complete database snapshot
- Timestamp and description
- Schema version

## Restore

### How to Access

**Sidebar → Administration → Restore**. Route: `/admin/restore`.

### How to Restore

1. Go to **Admin → Restore**
2. Select a **backup** from the list
3. Review backup details
4. Click **Restore**
5. Confirm the action

::: danger
Restoring replaces ALL current data with the backup. This cannot be undone.
:::

## Considerations

- Create regular backups before major changes
- Backups are stored in the application data directory
- The database uses SQLite for reliability
- Schema migrations run automatically on startup

## Database Lifecycle

The database is created and initialized **only once**, on the very first launch
after installation:

1. The schema is created and brought to the current version (migrations run
   automatically on startup against the existing file).
2. The seed runs **only when there are no users yet** — reference data
   (categories, brands, warehouses, products), roles, permissions and the
   initial accounts are created.
3. A `database_initialized` marker is recorded.

On every later restart **and after every application update** the seed is
idempotent and skipped for existing data: nothing is deleted and no demo data
is re-inserted. Updates replace the application files in the install folder but
**never touch the database**, which lives in the per-user data directory
(`%LOCALAPPDATA%\inventory-gear\` on Windows), outside Program Files.

The **only** way to recreate the initial data is the explicit, two-step
"Restore initial data" tool described below.

## Restore Initial Data

### What is it?

Rebuilds the database exactly as if the application had just been installed:
all products, customers, sales, purchases, users, roles and settings are reset
to the first-launch state.

### How to Access

**Sidebar → Administration → Database**, scroll to **Restaurar datos iniciales**.

### How to Use

1. Review the blast radius (users, products, customers, sales, …) shown in the
   preview.
2. Type the literal confirm word **`RESTAURAR`** into the confirmation field.
3. Click **Restore initial data** and confirm again in the dialog.
4. A pre-reset backup is created automatically first
   (`inventory-gear-backup-<timestamp>.sqlite` in the backups folder).
5. When the restore finishes you are **signed out** — the account that performed
   the reset no longer exists. Sign in with one of the recreated accounts
   (the installer-configured users, or the six demo accounts) and change the
   password on first login.

### What is kept

- The pre-reset backup record and the restore history, so the previous state
  can still be brought back from **Backups → Restore**.
- The audit trail.

### Considerations

- Only users with the `admin.database.manage` permission (owner /
  administrator) can perform a reset; the backend enforces this too.
- Everything else is wiped and re-seeded — customized settings, stock counts
  and history are **lost**. Export data first if you need to preserve it.
- The backup is the only way back: do not delete it until you are sure the
  restored state is the one you want.

### Manual Check Checklist

Verify the lifecycle on a clean Windows machine:

**Scenario A — First launch**
1. Install `InventoryGear-<version>-setup.exe`.
2. Launch — confirm the database is created in the data directory.
3. Log in with an installer-configured account (or the demo accounts) and
   confirm the change-password screen appears.
4. Verify the seeded demo catalog, the default warehouse and the default
   currency **BOB**.

**Scenario B — Restart**
1. Close and reopen the application.
2. Confirm no re-seeding: users keep their changed passwords, no extra demo
   data appears, and your edits (products, customers, settings) are intact.

**Scenario C — Update**
1. Install a newer build over the current one.
2. Launch — confirm the update-installed banner and that all data from Scenario B
   is still present exactly as left.

**Scenario D — Restore initial data**
1. Create some data (products, a sale, a customer, a setting change) and enable
   `admin.database.manage` is present for the owner account.
2. Admin → Database → Restaurar datos iniciales: type `RESTAURAR`, confirm.
3. Confirm the pre-reset backup exists in the backups folder and is listed in
   Backups.
4. Confirm you are signed out; log back in with a recreated account.
5. Confirm the database matches the first-launch state (products/customers/sales
   gone, users recreated, settings back to defaults, currency BOB).
6. Restore the pre-reset backup and confirm all Scenario-D data is back.

## Related

- [Diagnostics](/admin/diagnostics) — System health checks
- [Administration](/admin/) — System management
- [Backups & restore](/admin/database) — Creating and restoring backups
