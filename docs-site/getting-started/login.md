# Login

## Overview

The login screen is the entry point to Inventory Gear. All users must authenticate before accessing the system.

![Login Screen](/screenshots/light/01-login.png)

## How to Login

### Step 1: Enter Credentials

1. Type your **username** or **email** in the first field
2. Type your **password** in the second field

### Step 2: Click Login

Click the **Login** button or press **Enter**.

### Step 3: Access Granted

You will be redirected to the **Dashboard**.

## Features

### Remember Me
Check **Remember Me** to stay logged in across sessions.

### Language Toggle
Switch between **English** and **Español** using the language button in the top-right corner.

### Theme Toggle
Switch between **Light** and **Dark** themes using the theme button.

## Session Behavior

- Sessions are managed securely with server-side tokens
- Idle sessions will timeout after the configured period
- You can log out at any time via **Sidebar → Logout**

## Roles & Permissions

Each user has a role that determines what they can access:

| Role | Access Level |
|------|-------------|
| Owner | Full system access |
| Admin | Most features, limited system settings |
| Cashier | POS, sales history, product lookup |
| Warehouse | Inventory, stock, movements |
| Viewer | Read-only access |

::: warning
If you see a "Forbidden" page, your role doesn't have permission for that feature. Contact your administrator.
:::

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Invalid credentials" | Check username/password, ensure Caps Lock is off |
| "Account locked" | Contact your administrator to unlock the account |
| Redirected to Forbidden | Your role lacks permission — ask admin to adjust |
| Can't remember password | Contact your administrator for a password reset |

## Related

- [First Steps](/getting-started/first-steps) — What to do after logging in
- [Administration → Users & Roles](/admin/users-roles) — Manage user accounts
