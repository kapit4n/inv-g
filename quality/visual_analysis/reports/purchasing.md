# Purchasing Module — QA Report

**Screenshots:** 23 through 32 (light + dark = 20 screenshots)

## Issues Found

| ID | Issue | Priority | Confidence |
|----|-------|----------|------------|
| PUR-01 | Purchase order form has no line items | Medium | High |
| PUR-02 | Purchase order detail may show empty sections if real API differs | Medium | Medium |
| PUR-03 | No receiving workflow screenshots | Medium | High |

## 23-purchasing-dashboard
- **Detected Problems:** Stats cards, PO by status chart render correctly

## 24-purchase-orders
- **Detected Problems:** 10 POs with varied statuses in DataTable

## 25-purchase-order-form
- **Detected Problems:** Supplier and warehouse fields filled, no line items added
- **Root Cause:** Test does not add items before capture
- **Recommendation:** Add screenshot with items

## 26-purchase-order-detail
- **Detected Problems:** PO header, items table, totals visible

## 27-purchase-requests
- **Detected Problems:** 5 requests with varied statuses

## 28-purchase-receipts
- **Detected Problems:** 5 receipt entries

## 29-purchase-returns
- **Detected Problems:** 3 return entries

## 30-supplier-products
- **Detected Problems:** 10 supplier products in catalog

## 31-cost-history
- **Detected Problems:** 5 cost history entries

## 32-reorder-suggestions
- **Detected Problems:** 5 reorder suggestions with stock levels

## Score
- Stability: 7/10
- UI Quality: 8/10
- UX Quality: 7/10
