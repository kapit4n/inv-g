# Administration

## What is it?

The Administration module provides system-level management — users, roles, settings, database, backups, and diagnostics.

![Admin Dashboard](/screenshots/light/53-admin-dashboard.png)

## Sub-modules

| Module | Route | Purpose |
|--------|-------|---------|
| [Dashboard](/admin/) | `/admin` | System overview |
| [Users & Roles](/admin/users-roles) | `/admin/users` | Access management |
| [System Settings](/admin/settings) | `/admin/settings` | App configuration |
| [Database & Backups](/admin/database) | `/admin/database` | Data management |
| [Diagnostics & Audit](/admin/diagnostics) | `/admin/diagnostics` | System health |

## Admin Dashboard

The admin dashboard shows:
- System health status
- User activity
- Database statistics
- Recent audit events

::: warning
Administration features require **Owner** or **Admin** role.
:::

## Related

- [Settings](/settings/) — User preferences
- [Help](/settings/help) — Help and support
