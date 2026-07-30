# Settings

## Overview

The Settings module allows end users to configure their application preferences. It covers language, theme, store information, appearance, security, receipt printing defaults, and notification preferences. Settings are persisted and applied immediately.

## Features

### Language Selection
- Supported languages: **English**, **Spanish**.
- Language change takes effect immediately.
- All UI text, labels, and messages switch to the selected language.
- Language preference is persisted across sessions.

### Theme
- **Light** — Light background, dark text.
- **Dark** — Dark background, light text.
- **System** — Follows the operating system's color scheme preference.
- Theme is applied immediately via CSS variable switching.
- Theme preference is persisted.

### Store Information
- **Store Name** — Displayed on receipts and invoices.
- **Store Address** — Printed on receipts.
- **Store Phone** — Contact number for receipts.
- **Store Email** — Contact email for receipts.
- **Tax ID / RNC** — Tax registration number for invoices.
- **Currency Symbol** — Display currency (default: $).
- **Currency Code** — ISO currency code (default: USD).

### Appearance
- **Density** — Compact / Comfortable (controls spacing in tables and forms).
- **Font Size** — Small / Normal / Large.
- **Sidebar Behavior** — Collapsed by default / Expanded by default.
- **Table Page Size** — Default number of rows per page (10/25/50/100).

### Security
- **Session Timeout** — Minutes of inactivity before automatic logout (5/15/30/60/Never).
- **Password Expiry** — Days after which password must be changed (30/60/90/Never).
- **Failed Login Attempts** — Max attempts before account lockout (3/5/10).

### Receipt Printing Defaults
- **Default Printer** — Select from configured printers.
- **Receipt Copies** — Default number of copies to print.
- **Auto-Print** — Automatically print receipt after sale.
- **Receipt Footer** — Custom text printed at the bottom of receipts (e.g., return policy, thank you message).
- **Show Customer Info** — Include customer name on receipt.
- **Show Barcode** — Print barcode on receipt.

### Notifications
- **Low Stock Alerts** — Enable/disable low-stock notifications.
- **Daily Summary** — Receive end-of-day summary notification.
- **Order Status** — Notifications on purchase order status changes.
- **System Updates** — Notifications when updates are available.
- **Reminder Notifications** — Service reminder due alerts.

## Settings Persistence
- All settings are persisted via the Zustand store (for UI preferences) and the database settings table (for application settings).
- Settings are loaded on application start and applied before the UI renders.
- User-specific settings (theme, language, density) are per-user.
- Global settings (store info, receipt defaults) apply system-wide.

## Available Actions

| Action | Description |
|--------|-------------|
| Change Language | Switch between English and Spanish |
| Change Theme | Toggle light, dark, or system theme |
| Update Store Info | Edit store name, address, contact, tax ID |
| Configure Appearance | Adjust density, font size, sidebar, page size |
| Set Security Options | Configure session timeout, password expiry, lockout |
| Set Receipt Defaults | Choose default printer, copies, auto-print, footer |
| Manage Notifications | Enable/disable notification types |

## Validation Rules

- Store name is required for receipt printing.
- Currency symbol must be a single character.
- Session timeout must be a valid duration.
- Notification settings are boolean (on/off).
- Receipt footer max length: 500 characters.

## Related Modules

- [Admin](admin.md) — System-wide admin settings.
- [Auth](auth.md) — Session timeout and security settings.
- [POS](pos.md) — Auto-print receipt setting.
- [Receipts](receipts.md) — Printing defaults.
- [Inventory](inventory.md) — Low stock alert setting.

## Known Limitations

- Language support limited to English and Spanish (more can be added via i18n files).
- No per-language formatting of numbers/dates/currencies.
- No user-specific settings sync across devices (settings are local).
- Receipt footer is plain text only (no HTML/markup).
- Notification preferences have no effect until notification backend is implemented.
- Theme setting does not affect printed receipts (always prints in light mode).
