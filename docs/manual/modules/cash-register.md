# Cash Register

## Overview

The Cash Register module manages daily cash drawer sessions. Each shift requires opening a session with a starting cash balance and closing it with an ending count. The system calculates the expected balance based on transactions performed during the session and reports any discrepancy.

## Features

### Open Session
1. Navigate to Cash Register.
2. Enter opening balance (cash in drawer at start of shift).
3. Optional note (e.g., shift identifier, cashier name).
4. Session status becomes "Open".
5. Only one open session per user at a time.

### Active Session View
- Displays current session info: opened at, opening balance, current cashier.
- Running totals: cash sales, card sales, transfer sales, total sales.
- Expected balance = opening balance + cash sales - cash refunds.
- Cash in/out buttons for manual cash movements (e.g., picking up cash, dropping to safe).

### Close Session
1. Count physical cash in the drawer.
2. Enter closing balance (actual cash counted).
3. System displays:
   - Expected balance (based on transactions).
   - Actual balance (entered).
   - Difference (actual - expected).
4. Optional note for any discrepancy explanation.
5. Confirm close.
6. Session status becomes "Closed".
7. If difference exceeds a configurable threshold, a warning is shown.

### Session History
- Paginated table of all past sessions.
- Columns: Cashier, Opened At, Closed At, Opening Balance, Closing Balance, Expected, Difference, Status.
- Filter by cashier, date range, status (Open/Closed).
- View detail of any closed session.

### Difference Handling
- Positive difference: drawer has more cash than expected (surplus).
- Negative difference: drawer is short (shortage).
- Differences are logged for audit purposes.
- Configurable tolerance threshold before warning.

## Available Actions

| Action | Description |
|--------|-------------|
| Open Session | Start a new cash register session |
| Close Session | End the current session with balance count |
| View Session | See detail of a historical session |
| Export Sessions | Export session history to CSV/XLSX |

## Validation Rules

- Opening balance must be >= 0.
- Closing balance must be >= 0.
- Cannot close a session that is already closed.
- Cannot open a new session if one is already open (per user).
- Difference note is required if difference exceeds threshold.

## Related Modules

- [POS](pos.md) — All POS transactions are recorded against the open session.
- [Closeout](closeout.md) — End-of-day summary includes session data.
- [Sales](sales.md) — Transaction details.
- [Admin](admin.md) — User assignment to sessions.

## Known Limitations

- No multi-user session sharing — one cashier per session.
- No mid-shift cash reconciliation without closing.
- Manual cash count entry — no integration with cash counting hardware.
- No session z-read report generation.
