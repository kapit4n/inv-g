# Reset All Sales

## What is it?

A hidden, opt-in administration tool that permanently removes every selling
record from the database so the business can start selling from a clean slate —
without touching clients or anything related to products.

## What is it for?

The reset clears all data produced by selling:

- **Sales** and everything they cascade: sale items, sale payments and receipts
- **Quotes** (and their items) and **held sales** (in-progress carts)
- **Cash register sessions** and **daily closings**
- **Stock movements** caused by sales and refunds
  (`reference_type` sale/refund)

Everything else is deliberately **left alone**:

- Clients, their vehicles, notes, reminders and credit accounts/balances
- Products, categories, brands, suppliers — and their **stock quantities**
- Purchase orders and purchase history
- Warranties (their link to the removed sale is blanked, the warranty stays)
- Users, roles, permissions, settings and audit history

## How to Access

The tool is **hidden by default**. To make it visible:

1. Go to **Administration → Settings**.
2. Open the **Admin** group.
3. Turn on **Reset all sales tool** (`enable_sales_reset`) and save.

Only after that does the **Reset all sales** entry appear under
**Administration** in the sidebar, at the route `/admin/sales-reset`.

The action itself additionally requires the **Database management**
(`admin.database.manage`) permission; without it the page shows the blast radius
but the reset button does not appear.

## How to Use

1. Open **Administration → Reset all sales**.
2. Review the **Will be removed** list: live counts of sales, quotes, held
   sales, register sessions, closings and movements, plus the total sales
   revenue that will be wiped.
3. Confirm that everything under **Will NOT be touched** is what you expect.
4. Make a backup first (`Administration → Backups`) if there is any doubt.
5. Type the confirmation word **RESET** (exact, capital letters).
6. Click **Reset all sales**.

When it finishes the page lists what was removed, and every view that depends on
selling data (sales history, cash register, closeouts, dashboard widgets, stock
views) refreshes automatically. The action is recorded in the **audit log**
(`Administration → Audit`) as `reset_sales`.

## Considerations

- This cannot be undone. There is no recycle bin for sales.
- Numbers restart: because sale, quote, receipt and hold numbers are derived
  from the current row counts, the first sale after a reset is numbered
  `INV-00001` again.
- The backend refuses the reset when the `enable_sales_reset` flag is off and
  when the confirmation text is wrong, so a disabled flag cannot be bypassed
  from the interface.
- Make a backup before resetting even if you are confident — it is the only way
  to reverse the operation.

## Related

- [System Settings](/admin/settings) — where the tool is enabled
- [Database & Backups](/admin/database) — backing up before a reset
- [Diagnostics & Audit](/admin/diagnostics) — reading the `reset_sales` audit trail