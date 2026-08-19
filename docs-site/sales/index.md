# Sales

## What is it?

The Sales module handles all customer transactions — from quick point-of-sale to quotes, returns, and daily reconciliation.

![Sales](/screenshots/light/15-sales-history.png)

## Sub-modules

| Module | Route | Purpose |
|--------|-------|---------|
| [Point of Sale](/sales/pos) | `/sales/new` | Process new sales |
| [Sales History](/sales/history) | `/sales` | View past transactions |
| [Quotes](/sales/quotes) | `/sales/quotes` | Create and manage quotes |
| [Returns](/sales/returns) | `/sales/returns` | Process returns and refunds |
| [Cash Register](/sales/cash-register) | `/sales/register` | Open/close cash sessions |
| [Receipts](/sales/receipts-closeout) | `/sales/receipts` | View and print receipts |
| [Daily Closeout](/sales/receipts-closeout) | `/sales/closeout` | End-of-day reconciliation |

## Workflow

```
Open Cash Register → Make Sale → Print Receipt → End of Day Closeout
```

## Tips

- Use barcode scanning for fast product lookup
- Create quotes for customers who need time to decide
- Always close the cash register at end of day
- Review daily closeout for accuracy

## Related

- [Inventory](/inventory/) — Product stock
- [Reports → Sales](/reports/sales) — Sales analytics
