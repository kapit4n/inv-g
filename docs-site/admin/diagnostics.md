# Diagnostics & Audit

## What is it?

Monitor system health, run diagnostic checks, and review the audit trail of all user actions.

## Diagnostics

### How to Access

**Sidebar → Administration → Diagnostics**. Route: `/admin/diagnostics`.

### Available Checks

| Check | Description |
|-------|-------------|
| Database Connection | Verify DB is accessible |
| Schema Integrity | Check schema version and consistency |
| File System | Verify data directories exist and are writable |
| Memory Usage | Check application memory |
| Dependencies | Verify all required libraries |

### Running Diagnostics

1. Go to **Admin → Diagnostics**
2. Click **Run Diagnostics**
3. Review results (green = OK, red = issue)
4. Address any flagged issues

## Audit Log

### What is it?

A complete record of all user actions in the system for accountability and compliance.

### How to Access

**Sidebar → Administration → Audit**. Route: `/admin/audit`.

### What is Logged

- Login/logout events
- CRUD operations on all entities
- Permission changes
- System configuration changes
- Data exports

### Viewing the Audit Log

1. Go to **Admin → Audit**
2. Use **filters** (user, action, date range, entity)
3. Review entries with timestamps and details

## Updates

### How to Access

**Sidebar → Administration → Updates**. Route: `/admin/updates`.

### Checking for Updates

1. Go to **Admin → Updates**
2. Click **Check for Updates**
3. Review available updates
4. Download and install

## Licensing

### How to Access

**Sidebar → Administration → Licensing**. Route: `/admin/licensing`.

Shows current license status, type, and expiration.

## Related

- [Users & Roles](/admin/users-roles) — User management
- [Database & Backups](/admin/database) — Data management
