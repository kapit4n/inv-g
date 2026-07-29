# Milestone 8 - Customers & Suppliers

## Status: Complete

## Summary
Implemented full customer management with CRUD list page, customer detail page with 4 tabs (Info, Sales History, Credit Account, Communication Log), updated sidebar navigation with sub-items, and added all Tauri function wrappers and type definitions.

## Files Created/Modified
```
CREATED:
  src/features/customers/pages/customer-detail-page.tsx
  src/components/ui/skeleton.tsx

MODIFIED:
  src/features/customers/pages/customers-page.tsx
  src/features/customers/index.ts
  src/types/index.ts
  src/lib/tauri.ts
  src/layouts/sidebar.tsx
  src/routes/index.tsx
  src/i18n/locales/en/customers.json
  src/i18n/locales/es/customers.json
```

## Details

### Customers List Page (`customers-page.tsx`)
- Fetches from `getCustomers(search?)` Tauri function
- Search with 300ms debounce
- Stat cards: total customers, active customers
- Table: name (clickable → detail), email, phone, city, total sales, status, actions
- Add Customer dialog with form fields: name, email, phone, address, city, state, postal code, country, notes
- Edit button opens edit dialog pre-filled with customer data
- Archive button toggles active status
- Loading state with skeleton rows
- Toast notifications for success/error

### Customer Detail Page (`customer-detail-page.tsx`)
- Route: `/customers/:id`
- Summary cards: total sales, total spent, last purchase date
- 4 tabs:
  - **Info**: Full customer details card
  - **Sales History**: Table of sales (sale #, total, payment method, status, items, date) — clickable rows navigate to `/sales/:id`
  - **Credit Account**: Account summary (limit, balance, available), transactions table, add payment/charge form; create credit account prompt if none exists
  - **Communication Log**: Entries table (type, subject, message, created by, date), add communication form with type select (call, email, visit, note)

### Types Added (`src/types/index.ts`)
- `Customer` — updated with `postalCode` & `country`, removed `zipCode`/`taxId`
- `CustomerSale`, `CustomerDetail`, `CreditAccount`, `CreditTransaction`, `CommunicationEntry`, `CommunicationInput`

### Tauri Functions Added (`src/lib/tauri.ts`)
- `getCustomers(search?)`, `createCustomer`, `updateCustomer`, `archiveCustomer` — refactored to individual params
- `getCustomerDetail`, `getCustomerSales`, `getCreditAccount`, `createCreditAccount`
- `getCreditTransactions`, `addCreditTransaction`
- `getCommunications`, `createCommunication`

### Sidebar
- Customers nav entry expanded with child items: "All Customers" and "Credit Accounts"

### Routes
- Added `/customers/:id` → `CustomerDetailPage`

### i18n
- Full English and Spanish translation sets for all customer UI strings

## Known Issues
- `getCustomers(search?)` expects the Rust `get_customers` to accept an optional `search` param
- Credit accounts standalone route (`/customers/credit-accounts`) has no dedicated page yet — credit functionality is embedded in customer detail
- Native `<select>` used for dropdowns (no shadcn Select component in project)

## Dependencies
- react-hot-toast (new dependency)
- @/components/ui/skeleton (new component)
- @tanstack/react-query available but not used (plain useEffect fetching)
- Tauri invoke wrappers from `@/lib/tauri`
