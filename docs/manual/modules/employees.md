# Employees

## Overview

The Employees module manages staff records. It is separate from Users — employees represent the actual persons working at the business, while users are system accounts. Every user may be linked to an employee record, but employee records can exist independently for HR tracking.

## Features

### Employee List
- Paginated table with columns: Name, Email, Phone, Role, Department, Status.
- Search by name, email, phone.
- Filter by role, status, department.

### Employee CRUD

| Field | Description |
|-------|-------------|
| First Name | Employee's first name |
| Last Name | Employee's last name |
| Email | Work email address |
| Phone | Work phone number |
| Mobile | Mobile phone number |
| Role | System role assignment (Administrator, Sales Associate, Inventory Manager, Warehouse Staff) |
| Department | Department or team |
| Position | Job title |
| Hire Date | Date of employment start |
| Salary | Compensation (optional field) |
| Address | Residential address |
| City | City |
| State | State/province |
| Postal Code | ZIP/postal code |
| Emergency Contact | Emergency contact name |
| Emergency Phone | Emergency contact phone |
| Notes | Free-form notes |
| Status | Active / Inactive / On Leave / Terminated |

### Role Assignment
Employees can be assigned one of the following roles:
- **Administrator** — Full system access.
- **Sales Associate** — POS, sales history, basic customer management.
- **Inventory Manager** — Product catalog, stock management, purchasing.
- **Warehouse Staff** — Warehouse operations, stock receipt, transfers.
- Custom roles (created via [Admin](admin.md) panel) are also available.

### Status Tracking
- **Active** — Currently employed and active.
- **Inactive** — Employed but not active (e.g., long-term leave).
- **On Leave** — Temporary absence.
- **Terminated** — Employment ended.

## Available Actions

| Action | Description |
|--------|-------------|
| Create Employee | Add a new employee record |
| Edit Employee | Update employee details |
| Delete Employee | Soft delete (set inactive) |
| View Employee | Employee detail/profile page |
| Change Role | Update assigned system role |
| Change Status | Update employment status |
| Export Employee List | Export to CSV/XLSX |

## Validation Rules

- First and last name are required.
- Email format validation if provided.
- Role is required.
- Status is required (defaults to Active).
- Cannot delete an employee with linked user account (deactivate instead).
- Hire date cannot be in the future.

## Related Modules

- [Auth](auth.md) — User authentication linked to employee accounts.
- [Admin](admin.md) — User account management and role permissions.
- [Sales](sales.md) — Cashier attribution.
- [Reports](reports.md) — Sales by cashier report.

## Known Limitations

- No attendance/time tracking.
- No payroll integration.
- No employee document storage (contracts, certifications).
- No reporting hierarchy/manager assignment.
- Employee-user linking is manual (no auto-provisioning from employee creation).
- No schedule/shift management.
