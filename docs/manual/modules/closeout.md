# Daily Closeout

## Overview

The Daily Closeout module provides the end-of-day financial summary. It aggregates all sales, payments, refunds, and tax data for the selected day, allowing the cashier or manager to verify totals and close the business day.

## Features

### Closeout Summary
- **Total Sales** — Number of transactions for the day.
- **Total Revenue** — Sum of all sale totals.
- **Total Tax** — Sum of tax collected.
- **Total Discount** — Sum of discounts applied.

### Payment Method Breakdown
- **Cash** — Total amount and transaction count.
- **Card** — Total amount and transaction count.
- **Transfer** — Total amount and transaction count.

### Refunds
- **Refunded Transactions** — Count of returns processed.
- **Refunded Total** — Total amount refunded.

### Net Revenue
- **Net Revenue** = Total Revenue - Refunded Total.

### Close Shift
1. Review the summary for accuracy.
2. Verify against the cash register session closing balance.
3. Add optional notes (e.g., "All checks balance").
4. Confirm close.
5. Backend: creates a DailyClosing record, finalizes the business day.
6. After closing, the day is locked — no new sales can be backdated.

### Closeout History
- Paginated table of all past daily closings.
- Columns: Date, Closed By, Total Sales, Revenue, Refunds, Net Revenue, Closed At.
- View detail of any historical closeout.
- No editing once closed.

## Available Actions

| Action | Description |
|--------|-------------|
| View Today's Closeout | Open the current day's summary |
| Close Shift | Finalize today's closeout |
| View Historical Closeout | Review a past closing summary |
| Export Closeout | Export closeout data to CSV/XLSX |

## Validation Rules

- All cash register sessions must be closed before daily closeout.
- Cannot close a day that has already been closed.
- Closeout date defaults to today; cannot be changed.
- Notes are optional but recommended if discrepancies exist.

## Related Modules

- [Cash Register](cash-register.md) — Sessions must be closed before closeout.
- [Sales](sales.md) — Sales data aggregated in closeout.
- [Returns](returns.md) — Refund data included in summary.
- [Reports](reports.md) — Daily sales report.

## Known Limitations

- Only one closeout per day allowed.
- No mid-day partial closeout.
- Closeout is date-based, not shift-based (if multiple shifts, sum all sessions).
- No automatic verification against physical cash count — requires manual check.
