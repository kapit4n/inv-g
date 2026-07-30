# Administration

## Overview

The Administration panel provides complete system management capabilities. It covers user and role management, application settings, printer and device configuration, backup and restore, database management, diagnostics, audit, updates, licensing, and system maintenance.

## Features

### Admin Dashboard
- **User Activity**: Active user count, recent logins chart.
- **Database Growth**: Database size with trend chart.
- **Recent Audit Events**: Latest audit log entries.
- **System Stats**: Database size, last backup, storage usage, app version, connected printers, license status, system health.

### Users

**User CRUD:**
- Username, email, full name, phone number.
- Role assignment.
- Password set on creation (with password policy enforcement).
- Active/inactive status.
- Notes field.

**User Management:**
- Password reset (admin-initiated, forces change on next login).
- Lock/unlock user account (with lock reason and lock duration).
- View active sessions per user.
- Login tracking: last login date, failed login attempt count.
- Password expiry tracking.

**User Search:**
- Search by username, email, full name.
- Filter by role, status, lock status.

### Roles & Permissions

**Role CRUD:**
- Role name, description.
- System roles are read-only (predefined by the system).

**Permission Assignment:**
- Grouped permissions by module (Dashboard, Sales, Inventory, Purchasing, CRM, Reports, Admin, etc.).
- Bulk select/deselect all permissions in a group.
- Clone role (copy all permissions to a new role).
- View user count per role before deletion.
- Role activation/deactivation.

### Settings (Admin)
Category-based application settings management.

**Setting Categories:**
- Store Information, Sales, Inventory, Purchasing, Customer, Notifications, Security, Printing, General.

**Setting Fields:**
- Key, value, setting type (string, number, boolean, select, textarea).
- Description, validation rules, allowed options.
- System settings are read-only.
- Change history tracking with who changed what and when.

### Printers
Manage receipt, label, and document printers.

| Field | Description |
|-------|-------------|
| Name | Friendly printer name |
| Printer Type | Receipt (80mm/58mm), Label, Document (A4) |
| Driver/Interface | Network (IP + Port), USB, System default |
| IP Address | For network printers |
| Port | Port number |
| Paper Size | 58mm, 80mm, Letter, A4, Custom |
| Margins | Top, bottom, left, right |
| Copies | Default number of copies |
| Orientation | Portrait, Landscape |
| Config | JSON configuration for driver-specific settings |
| Is Default | Set as the system default printer |
| Is Active | Enable/disable |

**Actions:**
- Test print (sends a test page).
- Set as default printer.

### Devices
Manage peripheral devices.

**Device Types:**
- Barcode Scanner — Scanner configuration and identifier.
- Credit Card Terminal — Payment terminal integration.
- Receipt Printer (also in Printers section).
- Label Printer.

| Field | Description |
|-------|-------------|
| Name | Friendly device name |
| Device Type | Scanner, CC Terminal, etc. |
| Identifier | Device-specific identifier (e.g., COM port, IP) |
| Interface | USB, Network, Bluetooth, Serial |
| Config | JSON configuration |
| Is Active | Enable/disable |

**Actions:**
- Test device connection.
- Set as active/inactive.

### Backups

**Manual Backup:**
- Create a full database backup on demand.
- Select compression type: None, Gzip, Zstd.
- Optional encryption with password.
- Optional notes.

**Automatic Backup:**
- Enable/disable automatic backups.
- Frequency: Hourly, Daily, Weekly, Monthly.
- Retention: number of backups to keep.
- Compression and encryption settings.

**Backup List:**
- File name, file size, backup type (manual/automatic/scheduled).
- Compression, encryption status, status (completed/failed/in-progress).
- Checksum for integrity verification.
- Created by, created at.
- Download/delete backups.

**Restore from Backup (see Restore section).**

### Restore
Restore the database from a backup file.

**Restore Types:**
- **Complete Restore** — Replace the entire database.
- **Partial Restore** — Select specific tables to restore.

**Workflow:**
1. Select a backup from the list or upload a backup file.
2. Choose restore type (complete or partial).
3. For partial: select which tables to restore.
4. Confirm restore (warning: data will be overwritten).
5. System performs restore and creates a restore record.
6. Status tracking: Pending, In Progress, Completed, Failed.
7. Error message logged if failed.

**Restore History:**
- File name, restore type, status, tables restored, error message.
- Created by and timestamp.

### Database
Database management and monitoring.

**Stats:**
- Page size, page count, total size.
- Table count, index count.
- Integrity status, freelist count.
- Schema version.

**Table Info:**
- Per-table: name, row count, page count.

**Operations:**
- **Vacuum** — Reclaim disk space (SQLite VACUUM).
- **Optimize** — PRAGMA optimize.
- **Integrity Check** — PRAGMA integrity_check.
- **Reindex** — Rebuild all indexes.
- **Migration Status** — View applied and pending migrations.

### Diagnostics
System diagnostic tools.

**System Check:**
- Run comprehensive health checks:
  - Database connection.
  - Disk space.
  - Required directories.
  - Printer connectivity.
  - Configuration integrity.
- Each check returns: name, status (pass/warning/fail), message, details.

**Diagnostic History:**
- Past diagnostic reports with type, status, summary, issues found, warnings.
- View details of any past diagnostic report.

**Diagnostic Summary:**
- Aggregated view of all system checks.

**System Logs:**
- View application logs.
- Filter by level (error, warning, info, debug).
- Search log contents.

**Support Package:**
- Generate a support package (zipped archive of logs + config + diagnostic report).
- Download the support package for sending to support.

### Audit
Complete audit trail of all system activities.

**Audit Events:**
- Every create, update, delete action across all modules is logged.
- Each event records: timestamp, user (username + full name), action, entity type, entity ID, details (JSON), severity.

**Views:**
- **Timeline** — Chronological list of all events.
- **By Action** — Grouped/filtered by action type (CREATE, UPDATE, DELETE, LOGIN, etc.).
- **By User** — Filter events for a specific user.

**Filtering:**
- Action type, entity type, severity, user, date range, free-text search.

**Export:**
- Export audit log to CSV or JSON.

### Updates
Application version management.

**Current Version:**
- Display installed version, build date, release notes.

**Check for Updates:**
- Query the update server for new versions.
- Display available version, release notes, file size.

**Install Update:**
- Download and install the update.
- Track installation progress.
- Status: Available, Downloaded, Installing, Installed, Failed.

**Update History:**
- Past updates with version, release date, install date, installed by, status.

### Licensing
License key management.

| Field | Description |
|-------|-------------|
| License Key | Unique license key |
| License Type | Single User, Multi User, Enterprise, Trial |
| Company Name | Registered company |
| Contact Info | Name, email of license holder |
| Max Users | User limit |
| Max Stores | Store/branch limit |
| Features | Enabled feature flags (JSON) |
| Activation Date | When the license was activated |
| Expiration Date | License expiry |
| Status | Active, Expired, Suspended, Trial |

**Actions:**
- Activate license (enter key → validate → activate).
- Deactivate license.
- View license details.

### Maintenance
System maintenance operations.

**Maintenance Operations:**
- Clear audit log (older than N days, configurable).
- Clear old notifications.
- Recalculate stock levels.
- Clean up temp files.
- Rebuild search indexes.

**Maintenance Log:**
- Each operation recorded: operation name, details, status, duration (ms), affected rows, error message.
- Created by and timestamp.

**View Logs:**
- System log viewer.
- Filter by date, level, source.

**Storage Info:**
- Database file size.
- Database WAL/journal size.
- Backup storage used.
- Log storage used.
- Total storage used.

**System Info:**
- App version, build info.
- Operating system, architecture.
- Tauri version, Rust version.
- SQLite version.
- Database file path.
- Working directory.

### About
- Application name, version, build date.
- Developer/company information.
- License type and status.
- System information summary.
- Links to documentation and support.

## Available Actions

| Action | Category |
|--------|----------|
| CRUD Users | Users |
| Reset Password | Users |
| Lock/Unlock User | Users |
| View Sessions | Users |
| CRUD Roles | Roles |
| Clone Role | Roles |
| Bulk Assign Permissions | Roles |
| Manage Settings | Settings |
| CRUD Printers | Printers |
| Test Print | Printers |
| Set Default Printer | Printers |
| CRUD Devices | Devices |
| Test Device | Devices |
| Create Backup | Backups |
| Configure Auto Backup | Backups |
| Restore Backup | Restore |
| Vacuum Database | Database |
| Optimize Database | Database |
| Integrity Check | Database |
| Run Diagnostics | Diagnostics |
| Generate Support Package | Diagnostics |
| View Audit Log | Audit |
| Export Audit Log | Audit |
| Check for Updates | Updates |
| Activate License | Licensing |
| Run Maintenance | Maintenance |
| Clear Audit Logs | Maintenance |

## Validation Rules

- Username must be unique.
- Email must be unique across users.
- Password must meet minimum complexity requirements (length, uppercase, number, special char).
- Cannot deactivate your own user account.
- Cannot delete a role that has users assigned.
- System roles cannot be deleted or modified.
- Printer name is required per location.
- Device identifier must be unique per device type.
- Backup encryption password is required if encryption is enabled.
- Restore overwrites existing data — confirmation is required.
- License key format is validated before activation.
- Maintenance operations are logged for audit.
- Setting key must be unique within a category.

## Related Modules

- [Auth](auth.md) — Authentication and session management.
- [Settings](settings.md) — End-user settings.
- [Employees](employees.md) — Employee management.
- [Reports](reports.md) — Admin reports.
- [Dashboard](dashboard.md) — User activity data source.

## Known Limitations

- No LDAP/SSO/Azure AD integration.
- No two-factor authentication.
- Password policy is system-wide (not per-role).
- Backup encryption key management is manual.
- Printer discovery is manual (no auto-detect network printers).
- Device testing is limited to connectivity checks.
- Audit log can grow large — requires periodic cleanup.
- No real-time user session monitoring.
- No granular feature flags per license tier (all features or none).
- No export of backup to external storage (S3, FTP, etc.).
