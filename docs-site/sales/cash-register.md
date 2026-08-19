# Cash Register

## What is it?

Manage cash register sessions — open, operate, and close the register at the end of the day.

![Cash Register](/screenshots/light/20-cash-register.png)

## How to Access

**Sidebar → Sales → Cash Register**. Route: `/sales/register`.

## How to Use

### Opening the Register

1. Go to **Cash Register**
2. Click **Open Session**
3. Enter the **starting cash amount** (the float)
4. Click **Confirm**

### During the Day

- All POS sales are recorded against the open session
- Cash, card, and transfer totals are tracked
- The session shows running totals

### Closing the Register

1. Go to **Cash Register**
2. Click **Close Session**
3. Enter the **counted cash amount**
4. The system shows:
   - Expected cash (based on sales)
   - Actual cash (what you counted)
   - Difference (over/short)
5. Add notes if needed
6. Click **Close**

## Considerations

- Only one session can be open at a time
- Sales cannot be processed without an open session
- Daily closeout requires a closed session
- Cash differences are tracked for accountability

## Related

- [Point of Sale](/sales/pos) — Process sales
- [Daily Closeout](/sales/receipts-closeout) — End-of-day reconciliation
