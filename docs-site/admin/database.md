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

## Related

- [Diagnostics](/admin/diagnostics) — System health checks
- [Administration](/admin/) — System management
