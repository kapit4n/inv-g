# Purchasing

## What is it?

The Purchasing module manages procurement — from creating purchase orders to receiving stock and tracking supplier performance.

![Purchasing](/screenshots/light/23-purchasing-dashboard.png)

## Sub-modules

| Module | Route | Purpose |
|--------|-------|---------|
| [Dashboard](/purchases/) | `/purchases` | Purchasing overview |
| [Purchase Orders](/purchases/orders) | `/purchases/orders` | Create and manage POs |
| [Receiving & Returns](/purchases/receiving) | `/purchases/receipts` | Receive goods, process returns |
| [Supplier Products & Costs](/purchases/supplier-products) | `/purchases/supplier-products` | Supplier catalog and pricing |

## Workflow

```
Create PO → Send to Supplier → Receive Goods → Update Stock → Process Invoice
```

## Related

- [Inventory](/inventory/) — Stock levels
- [Suppliers](/crm/) — Supplier management
- [Reports → Purchasing](/reports/purchasing) — Procurement analytics
