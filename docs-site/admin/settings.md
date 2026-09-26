# System Settings

## What is it?

Configure application-wide settings: business details, taxes, pricing defaults,
printing, backups, security and which modules are active. Every setting applies to
the whole installation rather than to a single user — user-level preferences live in
[Settings](/settings/).

## How to Access

**Sidebar → Administration → Settings**. Route: `/admin/settings`.

The page lists the setting groups as tabs down the left. With more than one group
you pick the group first and only its settings are shown; **Save Changes** writes
every value on that page in one operation.

## Settings Groups

| Group | Content |
|-------|---------|
| General | Store name, logo, currency, time zone, language |
| Theme | Light, dark or follow the system |
| Localization | Date, time and number formats |
| Security | Password rules, session timeout, lockout policy |
| Inventory | Low-stock threshold, default warehouse, barcode format |
| Sales | Receipt footer, number prefixes, payment method, receipt layout |
| Purchasing | Purchase order number prefix |
| Printing | Default, receipt, invoice and label printers, paper size |
| Database | Auto vacuum |
| Backup | Automatic backups, interval, retention, compression, destination |
| Updates | Update checks and release channel |
| Performance | Cache toggle and cache lifetime |
| Business details | Legal name, tax ID, address, phone, email, website |
| Taxes | Default tax rate, tax-inclusive pricing, tax ID on invoices |
| Notifications | Which alerts you get, and their sound |
| Business | Rows per page, **global profit percentage**, active modules |

## The Global Profit Percentage

**Business → Global profit (%)** is the fallback margin used when a product does
not carry its own. Products resolve their sale price in this order:

1. the product's own **Profit %**, when it has one;
2. its **edited price**, when one was typed in manually;
3. the **global profit percentage** from this page.

So a product only follows the global value when both its own percentage and its
edited price are empty. Saving a new value here re-prices every product in that
third group immediately; products with their own margin or a manual price are left
alone. The allowed range is 0% to 90%, and the value must be a number.

::: tip
Existing products usually keep their own margin. When a product was created or
migrated before this setting existed, its margin was calculated from the price it
already had, so it stays on that margin. To make a product follow the global value,
open it and clear its **Profit %** field — the product form shows the global value
as a hint and tells you where to change it.
:::

## How to Modify

1. Go to **Admin → Settings**
2. Pick the **group** on the left
3. Change the values you need — invalid entries are flagged in place and block the save
4. Click **Save Changes**

## Considerations

- Some settings require the Admin or Owner role.
- Changes apply immediately, system-wide, to every user.
- Business details appear on receipts, invoices and reports.
- Tax settings affect all price calculations.
- The global profit percentage re-prices products, so check the affected products
  before saving a large change.

## Related

- [Products](/inventory/products) — where a product sets its own margin
- [Administration](/admin/) — System management
- [Settings](/settings/) — User preferences
