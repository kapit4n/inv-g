# Authentication

## Overview

The Authentication module manages user login, session handling, and role-based access control. It ensures that only authorized users can access the application and that each user can only perform actions permitted by their assigned role.

## Features

### Login Page
- URL: `/login`
- **Guest Route** — Only accessible to unauthenticated users; authenticated users are redirected to the dashboard.
- Form fields: Username, Password.
- Submit button with loading state.
- Error display for invalid credentials.

### Authentication Flow
1. User enters username and password.
2. Frontend sends `LoginRequest` to the backend via Tauri IPC.
3. Backend validates credentials against the database (hashed password comparison).
4. On success: backend returns `LoginResponse` with user object, JWT token, and permissions array.
5. Frontend stores auth state (user, token, permissions) in the Zustand auth store.
6. Token is stored securely for subsequent IPC calls.
7. User is redirected to the Dashboard.

### Session Management
- **Session Token** — JWT-based token with expiry.
- **Remember Me** — Extended session duration when "Remember Me" is checked.
- **Session Timeout** — Automatic logout after a period of inactivity (configurable in settings).
- **Logout** — Clears auth state and token, redirects to login page.

### Auth State
Managed via Zustand store:
- `user` — Current user object (User or null).
- `token` — JWT token (string or null).
- `permissions` — String array of permission keys (e.g., `sales:create`, `inventory:view`).
- `isAuthenticated` — Boolean derived from token presence.
- `isLoading` — Boolean for initial auth check.

### Route Guards
- **AuthenticatedRoute** — Wraps all app routes except login. Redirects to `/login` if not authenticated.
- **GuestRoute** — Wraps the login page. Redirects to `/dashboard` if already authenticated.

### Role-Based Access Control
- **Roles** — Admin, Manager, Sales Associate, Inventory Manager, Warehouse Staff (predefined, extendable).
- **Permissions** — Granular action-level permissions (e.g., `sales:create`, `sales:refund`, `inventory:edit`, `admin:users:manage`).
- **PermissionGuard** — Component-level guard that conditionally renders children based on permission.
- **ProtectedButton** — Button that is disabled/hidden based on permission.
- Permissions are fetched at login and cached in the auth store.

### Permission Checking
- **Function**: `hasPermission(permission: string): boolean`
- **Bulk Check**: `hasAllPermissions(permissions: string[]): boolean`
- Permission keys follow the convention: `module:action` (e.g., `inventory:create`, `reports:view`).

### Session Expiry Handling
- Token expiry is checked before each IPC call.
- If token is expired, the user is automatically logged out.
- A "Session expired" notification is shown before redirecting to login.
- Inactivity timeout is configurable in application settings.

### Forbidden Page
- URL: `/forbidden`
- Shown when a user tries to access a route or perform an action they don't have permission for.
- Provides a link back to the dashboard.

## Available Actions

| Action | Description |
|--------|-------------|
| Login | Authenticate with username and password |
| Logout | End the current session |
| Check Auth | Verify current session validity |
| Refresh Permissions | Reload user permissions (after role change) |

## Validation Rules

- Username and password are required.
- Password must match the stored hash.
- Account must be active and not locked.
- Maximum failed login attempts (configurable) before account lockout.
- Password expiry check (if applicable).
- Session token format and signature validation.

## Security Measures

- Passwords are hashed using a strong algorithm (bcrypt/argon2).
- Tokens are signed and verified server-side.
- Failed login attempts are tracked and can trigger account lockout.
- All authentication events are logged in the audit trail.
- Session tokens are invalidated on logout.
- Inactivity timeout auto-logs out idle users.

## Related Modules

- [Admin](admin.md) — User management, role management, password reset, lock/unlock.
- [Settings](settings.md) — Session timeout configuration.
- [Employees](employees.md) — Employee records linked to user accounts.

## Known Limitations

- No two-factor authentication (2FA).
- No OAuth/SSO/LDAP integration.
- No passkey or biometric authentication.
- Remember Me uses extended token expiry (not persistent refresh tokens).
- Session management is client-side only (no server-side session store).
- Token revocation requires either token expiry or manual user deactivation.
- No concurrent session limiting.
- No IP-based access restrictions.
- No CAPTCHA on login form.
