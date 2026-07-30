# Inventory Gear User Manual

> Version 0.1.0 | Last updated: July 2026

---

## Table of Contents

1. [Dashboard](#1-dashboard)
2. [Point of Sale (POS)](#2-point-of-sale-pos)
3. [Sales History](#3-sales-history)
4. [Quotes](#4-quotes)
5. [Returns](#5-returns)
6. [Cash Register](#6-cash-register)
7. [Receipts](#7-receipts)
8. [Daily Closeout](#8-daily-closeout)
9. [Inventory Dashboard](#9-inventory-dashboard)
10. [Categories](#10-categories)
11. [Brands](#11-brands)
12. [Manufacturers](#12-manufacturers)
13. [Suppliers (Inventory)](#13-suppliers-inventory)
14. [Warehouses](#14-warehouses)
15. [Storage Locations](#15-storage-locations)
16. [Products](#16-products)
17. [Inventory Movements](#17-inventory-movements)
18. [Purchasing Dashboard](#18-purchasing-dashboard)
19. [Purchase Orders](#19-purchase-orders)
20. [Purchase Requests](#20-purchase-requests)
21. [Purchase Receipts](#21-purchase-receipts)
22. [Purchase Returns](#22-purchase-returns)
23. [Supplier Products](#23-supplier-products)
24. [Cost History](#24-cost-history)
25. [Reorder Suggestions](#25-reorder-suggestions)
26. [Customers](#26-customers)
27. [Suppliers (CRM)](#27-suppliers)
28. [Vehicles](#28-vehicles)
29. [CRM Dashboard](#29-crm-dashboard)
30. [CRM Customers](#30-crm-customers)
31. [CRM Vehicles](#31-crm-vehicles)
32. [Compatibility](#32-compatibility)
33. [Service Reminders](#33-service-reminders)
34. [Warranties](#34-warranties)
35. [Customer Credit](#35-customer-credit)
36. [Customer Notes](#36-customer-notes)
37. [Reports](#37-reports)
38. [Administration](#38-administration)
39. [Employees](#39-employees)
40. [Settings](#40-settings)
41. [Help](#41-help)

---

## 1. Dashboard

**Purpose:** Central hub displaying key performance metrics, recent activity, stock alerts, and quick-access widgets for the day's operations.

**Who can use it:** All authenticated users.

**How to access:** Click **Dashboard** in the sidebar (first item, icon: LayoutDashboard). Route: `/dashboard`.

**What you see:**

- **Stat cards:** Today's Sales, Today's Orders, Inventory Value, Low Stock Items — each with trend indicators (percentage change from yesterday, last week, or last month).
- **Best Sellers:** Top-performing products this month with quantity sold and revenue.
- **Recent Activity:** Latest store events (sales, purchases, returns) with timestamps.
- **Monthly Sales Overview:** Bar/line chart showing daily or monthly sales trends.
- **Profit Overview:** Revenue vs. cost of goods sold chart.
- **Stock Alerts:** Products below minimum stock level requiring attention.
- **Recent Purchases:** Latest purchase orders with status.

**Common mistakes:** Dashboard data refreshes on page load. If data appears stale, use the browser refresh or navigate away and back.

**Tips:** Click **View Report** on any widget to open the full report for that metric. The dashboard respects your role permissions — you will only see widgets for modules you have access to.

---

## 2. Point of Sale (POS)

**Purpose:** Process customer sales quickly. Search products, build a cart, apply discounts, accept multiple payment methods, and generate receipts.

**Who can use it:** Users with `sales.create` permission (Cashier, Administrator, Owner).

**How to access:** Sales > **Point of Sale** in the sidebar. Route: `/sales/new`.

**Step-by-step:**

1. **Search products:** Type a product name, SKU, or barcode in the search box. Results appear below in card format.
2. **Add to cart:** Click a product card to add it to the cart (one click = 1 unit). Click again to increment quantity.
3. **Adjust quantities:** In the cart panel, use the **+** and **-** buttons to adjust item quantities. Click the trash icon to remove an item.
4. **Apply discount:** Enter a discount percentage in the discount field (0–100%). The discount amount and new total update automatically.
5. **Select customer:** (Optional) Use the customer search field to associate the sale with a customer for loyalty tracking.
6. **Add payments:**
   - Default payment method is **Cash**. Select **Card** or **Transfer** from the dropdown.
   - Enter the amount paid. For cash payments, change due is calculated automatically.
   - For transfers, enter a reference number.
   - Click **+ Add** to split payment across multiple methods.
7. **Add notes:** (Optional) Enter internal notes for the sale.
8. **Complete sale:** Click **Complete Sale** (button shows total amount). The system validates that total paid >= total due.

**After checkout:** The sale is recorded, stock is deducted, and you are redirected to the sale detail page. An invoice number is generated automatically.

**Common mistakes:**

- Forgetting to select a customer (optional but recommended for returns and loyalty).
- Entering less total payment than the sale total — the button remains disabled until sufficient payment is entered.
- Not noticing the discount is a percentage, not a fixed amount.

**Tips:**

- Press **Escape** to clear the search field and refocus it.
- Use **F1–F4** for quick actions (configured per system).
- The POS shows stock levels and tax rates on each product card.
- Products with stock <= 5 show a red badge.
- Use the **Cancel** button in the top-right to discard the current transaction.

---

## 3. Sales History

**Purpose:** View, search, and manage completed sales transactions. Access details, reprint receipts, process refunds.

**Who can use it:** Users with `sales.view` permission.

**How to access:** Sales > **Sales History** in the sidebar. Route: `/sales`.

**Step-by-step:**

1. The sales list shows all transactions with invoice number, customer, items count, total, payment method, status, and date.
2. **Search invoices:** Use the search bar to filter by invoice number or customer name.
3. **View details:** Click any sale row to open the sale detail page (`/sales/:id`).
4. **Sale detail page shows:**
   - Invoice number and sale date
   - Customer information
   - Itemized product list with quantities, prices, and totals
   - Payment breakdown (method, amount, reference, change)
   - Discount and tax summary
   - Sale notes

**Common mistakes:** Sales cannot be edited after completion. Errors must be handled via returns or refunds.

**Tips:** Use the search box for quick invoice lookup. The list is paginated — use the pagination controls at the bottom.

---

## 4. Quotes

**Purpose:** Create, manage, and convert price quotes to sales. Quotes allow you to reserve pricing for customers before they commit to a purchase.

**Who can use it:** Users with `sales.quotes` permission.

**How to access:** Sales > **Quotes** in the sidebar. Route: `/sales/quotes`.

**Step-by-step — Create Quote:**

1. Click **New Quote** (or navigate to `/sales/quotes/new`).
2. **Select customer:** Search and select the customer receiving the quote.
3. **Add items:** Search products and add them with quantities. Each item shows unit price and total.
4. **Set validity:** Enter the **Valid Until** date (the quote expires after this date).
5. **Apply discounts:** Enter discount percentage if applicable.
6. **Add terms & conditions:** (Optional) Include payment terms, delivery terms, etc.
7. **Add notes:** Internal notes.
8. **Save:** Click **Save** to create the quote as a **Draft**.

**Quote statuses:** Draft, Sent, Accepted, Converted, Expired, Cancelled.

**Convert quote to sale:**

1. Open a quote in Accepted or Draft status.
2. Click **Convert to Sale**.
3. The system creates a new sale prepopulated with the quote's customer and items.
4. Complete the sale in the POS.

**Common mistakes:** Quotes do not reserve stock. Stock availability should be verified before converting to a sale.

**Tips:** Set a reasonable validity period (e.g., 7–15 days). Use the **Sent** status to track which quotes have been delivered to customers. Review expired quotes regularly.

---

## 5. Returns

**Purpose:** Process customer returns and refunds. Returned stock is added back to inventory.

**Who can use it:** Users with `sales.refund` permission.

**How to access:** Sales > **Returns** in the sidebar. Route: `/sales/returns`.

**Step-by-step:**

1. The returns page lists all processed returns with return ID, sale reference, customer, items, total refunded, reason, and date.
2. Click a return row to view details.
3. To create a new return:
   - Find the original sale by invoice number.
   - Select which items to return (quantity cannot exceed the original quantity).
   - Enter a return reason (defective, wrong part, customer changed mind, etc.).
   - Confirm the refund. The refund amount is credited and stock is returned to inventory.

**Common mistakes:** Processing a return for items that were already returned. The system prevents returning more than the original quantity.

**Tips:** Use the **Return Reason** field to track common issues with products or suppliers. This data feeds into return reports.

---

## 6. Cash Register

**Purpose:** Track cash register sessions — open and close the register, manage opening/closing balances, and reconcile cash differences.

**Who can use it:** Users with `sales.register` permission.

**How to access:** Sales > **Cash Register** in the sidebar. Route: `/sales/register`.

**Step-by-step — Open Register:**

1. Click **Open Register**.
2. Enter the **Opening Balance** (amount of cash in the register at the start of the shift).
3. The session is recorded with your user, timestamp, and opening balance.

**Close Register:**

1. Click **Close Register** on an open session.
2. Enter the **Closing Balance** (actual cash count).
3. The system calculates the **Expected Balance** (opening + sales - cash paid out) and the **Difference**.
4. A difference may indicate errors, theft, or miscounts.

**Session statuses:** Open, Closed.

**Common mistakes:** Forgetting to open the register before processing sales. The system may warn if no open session exists.

**Tips:** Count cash carefully before entering closing balance. Investigate significant differences immediately. Only one session can be open per user at a time.

---

## 7. Receipts

**Purpose:** View and reprint sale receipts. Receipts are automatically generated for each completed sale.

**Who can use it:** Users with `sales.receipts` permission.

**How to access:** Sales > **Receipts** in the sidebar. Route: `/sales/receipts`.

**Step-by-step:**

1. The receipts page lists all receipts with receipt number, sale reference, type (sale/return), printed status, and date.
2. **Reprint:** Click **Reprint** to send the receipt to the configured printer.
3. **Mark as Printed:** Manually mark a receipt as printed if it was printed outside the system.

**Receipt types:** Sale, Return, Quote.

**Common mistakes:** Attempting to print when no printer is configured — configure printers in Administration > Printers.

**Tips:** Receipts are stored in the database and can be reprinted at any time. The receipt template is configurable in Settings.

---

## 8. Daily Closeout

**Purpose:** Close the business day — generate a summary of all sales, payments, taxes, discounts, and refunds for reconciliation.

**Who can use it:** Users with `sales.closeout` permission.

**How to access:** Sales > **Daily Closeout** in the sidebar. Route: `/sales/closeout`.

**Step-by-step:**

1. The closeout page shows a summary of today's operations.
2. **Review metrics:** Total Sales, Total Revenue, Total Tax, Total Discount, Transactions count, Refunds count, Net Revenue.
3. **Payment breakdown:** Cash total, Card total, Transfer total, each with transaction counts.
4. **Close day:** Click **Close Day** to finalize the closeout.
5. Once closed, the day's data is locked and a daily closing record is created.

**Common mistakes:** Closing the day before all transactions are completed. Only close when the business day is truly finished.

**Tips:** Run the closeout after the cash register is closed. Review the payment breakdown against actual cash/terminal totals. Use the notes field to record any anomalies.

---

## 9. Inventory Dashboard

**Purpose:** High-level overview of inventory status — total products, stock value, low stock alerts, and category/brand/warehouse counts.

**Who can use it:** Users with `inventory.view` permission.

**How to access:** Click **Inventory** in the sidebar (or Inventory > Dashboard). Route: `/inventory`.

**What you see:**

- **Stat cards:** Total Products, Inventory Value (cost & retail), Active Products, Total Brands, Total Suppliers, Total Warehouses.
- **Charts:** Inventory distribution by category, stock status breakdown.
- **Alerts:** Low stock and out-of-stock product counts with links to filtered product lists.

**Tips:** Click any stat card or alert to navigate directly to the related product list with filters applied.

---

## 10. Categories

**Purpose:** Organize products into a hierarchical category structure (e.g., Engine > Pistons > Rings).

**Who can use it:** Users with `inventory.categories.manage` permission.

**How to access:** Inventory > **Categories** in the sidebar. Route: `/inventory/categories`.

**Step-by-step — Create Category:**

1. Click **Add Category** (or navigate to `/inventory/categories/new`).
2. Enter **Name** (required).
3. Enter **Description** (optional).
4. Select **Parent Category** to create a subcategory (optional).
5. Set **Sort Order** for display ordering.
6. Click **Save**.

**Edit/Archive:** Click a category row to edit. Use the archive action to soft-delete (products assigned to an archived category remain).

**Common mistakes:** Archiving a category that is in use by active products prevents new assignments but does not break existing ones.

**Tips:** Plan your category hierarchy before entering data. Use 3–4 levels maximum. Categories with parent categories appear as sub-items in product forms.

---

## 11. Brands

**Purpose:** Manage product brand catalog (e.g., Bosch, NGK, SKF).

**Who can use it:** Users with `inventory.brands.manage` permission.

**How to access:** Inventory > **Brands** in the sidebar. Route: `/inventory/brands`.

**Step-by-step — Create Brand:**

1. Click **Add Brand**.
2. Enter **Name** (required).
3. Enter **Description** (optional).
4. Enter **Country** of origin.
5. Enter **Website** URL.
6. Click **Save**.

**Tips:** Brands are globally unique. Link brands to products during product creation/editing.

---

## 12. Manufacturers

**Purpose:** Manage product manufacturer information (e.g., Bosch GmbH, NGK Spark Plug Co.).

**Who can use it:** Users with `inventory.manufacturers.manage` permission.

**How to access:** Inventory > **Manufacturers** in the sidebar. Route: `/inventory/manufacturers`.

**Step-by-step — Create Manufacturer:**

1. Click **Add Manufacturer**.
2. Enter **Name** (required).
3. Enter **Country**, **Phone**, **Email**, **Website** (optional).
4. Add **Notes** (optional).
5. Click **Save**.

**Tips:** A brand can have multiple manufacturers (e.g., Bosch sells products from different factories). A manufacturer can also be a brand.

---

## 13. Suppliers (Inventory)

**Purpose:** Manage supplier information within the inventory module. These are distinct from the CRM suppliers list.

**Who can use it:** Users with `inventory.suppliers.manage` permission.

**How to access:** Inventory > **Suppliers** in the sidebar. Route: `/inventory/suppliers`.

**Step-by-step — Create Supplier:**

1. Click **Add Supplier**.
2. Enter **Company Name** (required).
3. Enter **Contact Person**, **Phone**, **Mobile**, **Email**, **Website**, **Tax ID**.
4. Enter **Address**, **City**, **State/Province**, **Country**.
5. Add **Notes**.
6. Click **Save**.

**Tips:** The inventory suppliers list is used to assign a default supplier to products. For comprehensive supplier management (catalogs, performance), use the Purchasing module.

---

## 14. Warehouses

**Purpose:** Define physical warehouse locations where inventory is stored.

**Who can use it:** Users with `inventory.warehouses.manage` permission.

**How to access:** Inventory > **Warehouses** in the sidebar. Route: `/inventory/warehouses`.

**Step-by-step — Create Warehouse:**

1. Click **Add Warehouse**.
2. Enter **Name** (required).
3. Enter **Code** (unique identifier, e.g., WH-001).
4. Enter **Address**, **City**, **State/Province**, **Country**.
5. Enter **Manager** and **Phone** (optional).
6. Click **Save**.

**Tips:** Each warehouse can have multiple storage locations (bins/shelves). Assign products to a warehouse during product creation.

---

## 15. Storage Locations

**Purpose:** Define specific bin/shelf/aisle locations within a warehouse for precise inventory tracking.

**Who can use it:** Users with `inventory.storage.manage` permission.

**How to access:** Inventory > **Storage Locations** in the sidebar. Route: `/inventory/storage-locations`.

**Step-by-step — Create Storage Location:**

1. Click **Add Storage Location**.
2. Select the **Warehouse** (required).
3. Enter **Zone**, **Aisle**, **Shelf**, **Bin** for the location path.
4. The **Code** field auto-generates from the path (e.g., WH-001-A-1-A-01).
5. Enter a **Description** (optional).
6. Click **Save**.

**Tips:** Use a consistent naming convention. The hierarchical path (Zone > Aisle > Shelf > Bin) enables efficient picking and put-away.

---

## 16. Products

**Purpose:** The core product catalog — create, edit, and manage all products with pricing, stock, and categorization.

**Who can use it:** Users with `inventory.view` (view) and `inventory.create`/`inventory.update` (create/edit) permissions.

**How to access:** Inventory > **Products** in the sidebar. Route: `/inventory/products`.

**Step-by-step — Create Product:**

1. Click **Add Product** (or navigate to `/inventory/products/new`).
2. Enter required fields:
   - **Product Name** (required)
   - **SKU** (required, unique) — Stock Keeping Unit identifier
3. Enter optional fields:
   - **Barcode**, **OEM Number**, **Internal Code**
   - **Description**
   - **Category**, **Brand**, **Manufacturer**, **Supplier**
   - **Cost Price**, **Sale Price**, **Wholesale Price**, **Suggested Retail Price**
   - **Tax Rate** (%)
   - **Stock Quantity**, **Min Stock Level**, **Max Stock Level**, **Reorder Point**
   - **Unit** (pcs, set, ltr, kg, box, etc.)
   - **Weight**
   - **Warehouse**, **Storage Location**
   - **Image URL**
4. Toggle **Discontinued** if the product is no longer sold.
5. Click **Save**.

**Product list:** Search by name, SKU, or barcode. Filter by category, brand, supplier, warehouse, or stock status (In Stock, Low Stock, Out of Stock). Export to CSV.

**Product detail page (`/inventory/products/:id`)** shows:

- Full product information
- Images
- Vehicle compatibility entries
- Stock movement history
- Sales history for this product

**Common mistakes:** Duplicate SKUs are rejected. Plan your SKU convention carefully (e.g., `CAT-BRAND-001`).

**Tips:** Use the barcode field for quick POS lookup. Set Min Stock Level and Reorder Point to enable reorder suggestions. The import feature allows bulk product creation from CSV.

---

## 17. Inventory Movements

**Purpose:** Record all stock movements — stock in (receipts), stock out (sales, adjustments), and manual adjustments.

**Who can use it:** Users with `inventory.view` permission.

**How to access:** Inventory > **Inventory Movements** in the sidebar. Route: `/inventory/movements`.

**Step-by-step — Record Movement:**

1. Click **Add Movement**.
2. Select the **Product**.
3. Select the **Movement Type**: Stock In, Stock Out, or Adjustment.
4. Enter **Quantity** (positive number; stock out reduces inventory).
5. Select **Warehouse**.
6. Enter optional **Notes** (reason for the movement).
7. Click **Save**.

**Movement types:**
- **Stock In:** Increases inventory (purchase receipts, returns).
- **Stock Out:** Decreases inventory (sales, damage, shrinkage).
- **Adjustment:** Manual correction (positive or negative).

**Tips:** Use notes to document the reason for manual adjustments. Inventory movements are automatically created by sales and purchase receipts.

---

## 18. Purchasing Dashboard

**Purpose:** Overview of purchasing operations — pending orders, monthly spend, average order value, and today's receipts.

**Who can use it:** Users with `purchases.view` permission.

**How to access:** Click **Purchases** in the sidebar. Route: `/purchases`.

**What you see:**

- **Stat cards:** Pending Orders, Awaiting Approval, Awaiting Delivery, Total Orders, This Month spend, Avg. Order Value, Today's Receipts.
- **Top Suppliers:** Suppliers ranked by purchase volume.
- **Recent Orders:** Latest purchase orders with status and totals.

**Tips:** Use this dashboard as your daily purchasing command center. Monitor pending approvals and deliveries.

---

## 19. Purchase Orders

**Purpose:** Create and manage purchase orders (POs) to suppliers. Track the full lifecycle from draft to received.

**Who can use it:** Users with `purchases.create` (create), `purchases.update` (edit), `purchases.delete` (delete), `purchases.approve` (approve) permissions.

**How to access:** Purchases > **Orders** in the sidebar. Route: `/purchases/orders`.

**Step-by-step — Create Purchase Order:**

1. Click **New Purchase Order**.
2. Select **Supplier** (required).
3. Enter **Order Date** (defaults to today).
4. Enter **Expected Delivery Date**.
5. Select **Warehouse** for receiving.
6. Enter **Buyer**, **Payment Terms**, **Shipping Method**, **Reference Number**.
7. **Add items:** Search products, enter quantity, unit cost, and discount. The system calculates line totals.
8. Enter **Shipping Cost** if applicable.
9. Review **Subtotal**, **Tax**, **Discount**, and **Grand Total**.
10. Add **Notes** (internal).
11. Click **Save** to create as Draft.

**PO Status Lifecycle:**
- **Draft** → **Pending Approval** (submit for approval)
- **Pending Approval** → **Approved** (approve) or back to Draft (reject)
- **Approved** → **Sent** (mark as sent to supplier)
- **Sent** → **Partially Received** / **Completed** (receive items)
- **Cancelled** (cancel at any point before completion)

**Receive items:** From the PO detail page, click **Receive Order** to record incoming items, damaged quantities, and update inventory.

**Common mistakes:** Creating POs without specifying expected delivery dates makes planning difficult. Always set payment terms.

**Tips:** Use the **Reference Number** field for the supplier's PO number. Use **Payment Terms** to track Net 30, Net 60, etc. POs in Draft status can be edited freely.

---

## 20. Purchase Requests

**Purpose:** Internal requests to purchasing department for products that need to be ordered.

**Who can use it:** Users with `purchases.requests` permission.

**How to access:** Purchases > **Requests** in the sidebar. Route: `/purchases/requests`.

**Step-by-step — Create Request:**

1. Click **New Request**.
2. Set **Priority**: Low, Medium, High, Urgent.
3. Select **Warehouse**.
4. Enter **Reason** for the request.
5. Set **Required Date**.
6. **Add items:** Select products, enter requested quantity. Current stock and min stock levels are shown for reference.
7. Click **Save**.

**Request statuses:** Draft, Submitted, Approved, Ordered, Fulfilled, Cancelled.

**Tips:** Purchase requests feed into the purchasing workflow. Approved requests can be converted into purchase orders.

---

## 21. Purchase Receipts

**Purpose:** Record the receipt of goods from purchase orders.

**Who can use it:** Users with `purchases.receive` permission.

**How to access:** Purchases > **Receipts** in the sidebar. Route: `/purchases/receipts`.

**Step-by-step:**

1. Receipts are created when receiving a purchase order.
2. From a PO detail page, click **Receive Order**.
3. Enter **received quantity**, **damaged quantity** for each item.
4. The system calculates accepted quantity.
5. Click **Save** to create the receipt and update inventory.

**Common mistakes:** Receiving more than the ordered quantity — the system caps at the ordered amount.

**Tips:** Record damaged quantities accurately for supplier claims. Receipts can be viewed from the Receipts page.

---

## 22. Purchase Returns

**Purpose:** Return defective, damaged, or incorrect items to suppliers.

**Who can use it:** Users with `purchases.returns` permission.

**How to access:** Purchases > **Returns** in the sidebar. Route: `/purchases/returns`.

**Step-by-step — Create Return:**

1. Click **New Return**.
2. Select the **Supplier**.
3. Reference the original **Purchase Order** (optional).
4. **Add items:** Select products and quantities being returned.
5. Enter **Reason** for the return.
6. Click **Save**.

**Return statuses:** Pending, Approved, Shipped, Received, Completed, Rejected.

**Tips:** Purchase returns decrease inventory. Link returns to the original PO for audit trail.

---

## 23. Supplier Products

**Purpose:** Maintain a catalog of products each supplier offers, including their SKU, pricing, lead times, and minimum order quantities.

**Who can use it:** Users with `purchases.supplier_products` permission.

**How to access:** Purchases > **Supplier Products** in the sidebar. Route: `/purchases/supplier-products`.

**Step-by-step:**

1. The page lists all supplier-product associations.
2. **Add:** Link a product to a supplier with supplier's SKU, default cost, lead time, minimum order quantity, and preferred status.
3. **Edit:** Update pricing or lead times.
4. **Delete:** Remove a supplier-product link.

**Tips:** Mark preferred suppliers for faster PO creation. Use the supplier SKU field to map your internal products to supplier catalogs.

---

## 24. Cost History

**Purpose:** Track changes in product cost prices over time, linked to purchase orders.

**Who can use it:** Users with `purchases.cost_history` permission.

**How to access:** Purchases > **Cost History** in the sidebar. Route: `/purchases/cost-history`.

**What you see:** A timeline of cost changes for each product: old cost, new cost, quantity, supplier, referenced PO, and timestamp.

**Tips:** Cost history is automatically recorded when a purchase order is received. Use this to analyze supplier pricing trends.

---

## 25. Reorder Suggestions

**Purpose:** Automatically suggest products that need reordering based on stock levels, reorder points, and sales velocity.

**Who can use it:** Users with `purchases.view` permission.

**How to access:** Purchases > **Reorder Suggestions** in the sidebar. Route: `/purchases/reorder-suggestions`.

**What you see:** Products where current stock is at or below the reorder point, with suggested order quantities.

**Tips:** Review suggestions daily. Suggested quantities can be adjusted before creating a PO. Configure reorder points on each product.

---

## 26. Customers

**Purpose:** Manage customer database — create, edit, view profiles, sales history, and communications.

**Who can use it:** Users with `customers.view` (view), `customers.create` (create), `customers.update` (edit), `customers.delete` (delete) permissions.

**How to access:** Click **Customers** in the sidebar (standalone entry). Route: `/customers`.

**Step-by-step — Create Customer:**

1. Click **Add Customer** (navigate to `/customers/new` — shared CRM entity).
2. Enter **Name** (required).
3. Enter optional: **Email**, **Phone**, **Mobile**, **WhatsApp**, **Tax ID**, **Address**, **City**, **State**, **Country**, **Postal Code**.
4. Set **Customer Type**: Individual or Business.
5. Set **Preferred Contact** method and **Preferred Language**.
6. Add **Notes**.
7. Click **Save**.

**Customer detail page (`/customers/:id`)** shows:

- Full profile and contact information
- Sales history
- Credit account status and transactions
- Linked vehicles
- Service reminders
- Warranties
- Notes and communication log
- Activity timeline

**Tips:** Use the CRM module for advanced customer management. The Customers page is a streamlined view — the CRM module offers the same capabilities with additional relationship management tools.

---

## 27. Suppliers

**Purpose:** View and manage the supplier directory.

**Who can use it:** Users with `suppliers.view` and `suppliers.create` permissions.

**How to access:** Click **Suppliers** in the sidebar. Route: `/suppliers`.

**Step-by-step — Create Supplier:**

1. Click **Add Supplier**.
2. Enter **Company Name** (required).
3. Enter **Contact Person**, **Phone**, **Mobile**, **Email**, **Website**, **Tax ID**.
4. Enter **Address**, **City**, **State**, **Country**, **Postal Code**.
5. Add **Notes**.
6. Click **Save**.

**Tips:** Supplier information is shared across the Purchasing and Inventory modules. Keep supplier contact details up to date.

---

## 28. Vehicles

**Purpose:** Manage the vehicle reference database — brands, models, generations, engines, transmissions, and fuels. Also track customer vehicles.

**Who can use it:** Users with `vehicles.view`, `vehicles.create`, `vehicles.update`, `vehicles.delete` permissions.

**How to access:** Two entry points:
- **CRM > Vehicles** — CRM-integrated vehicle management
- **Vehicles** in sidebar (standalone) — Route: `/vehicles`

**Sub-entities:**

- **Vehicle Brands:** Makes (Toyota, Ford, BMW, etc.)
- **Vehicle Models:** Specific models within a brand (Corolla, Mustang, 3 Series)
- **Generations:** Model generations with year ranges (E90, 2005–2011)
- **Engines:** Engine variants (2.0L Turbo, 1.6L Diesel)
- **Transmissions:** Transmission types (5-speed Manual, 6-speed Auto)
- **Fuels:** Fuel types (Gasoline, Diesel, Hybrid, Electric)
- **Customer Vehicles:** Link specific vehicles to customers with license plate, VIN, color, mileage

**Tips:** The vehicle database enables parts compatibility matching (select a vehicle, find compatible parts). Customer vehicles link to service reminders and warranties.

---

## 29. CRM Dashboard

**Purpose:** CRM command center showing customer metrics, vehicle counts, upcoming reminders, and credit status.

**Who can use it:** Users with CRM module access.

**How to access:** Click **CRM** in the sidebar. Route: `/crm`.

**What you see:**

- **Stat cards:** Total Customers, Active Customers, New This Month, Vehicles Registered, Upcoming Reminders, Expired Warranties, Lifetime Revenue.
- **Quick links** to all CRM sub-modules.

---

## 30. CRM Customers

**Purpose:** Comprehensive customer management with detailed profiles, vehicles, reminders, warranties, credit, notes, timeline, and communication log.

**Who can use it:** Users with `customers.*` permissions.

**How to access:** CRM > **Customers**. Route: `/crm/customers`.

**Features on customer detail (`/crm/customers/:id`):**

- Profile with full contact info
- Linked vehicles tab
- Sales history tab
- Credit account tab (limit, balance, available credit, transactions)
- Service reminders tab
- Warranties tab
- Notes tab (add, edit, delete notes)
- Communication log tab
- Activity timeline

**Tips:** Use CRM Customers for the full 360-degree customer view. The Timeline automatically records events (sales, notes, reminders, etc.).

---

## 31. CRM Vehicles

**Purpose:** View all customer vehicles across the customer base.

**Who can use it:** Users with `vehicles.view` permission.

**How to access:** CRM > **Vehicles**. Route: `/crm/vehicles`.

**What you see:** A list of all vehicles linked to customers, searchable by license plate, VIN, customer name, brand, or model.

**Tips:** Click a vehicle to view full details and the customer profile.

---

## 32. Compatibility

**Purpose:** Search parts by vehicle — find which products are compatible with a specific vehicle make, model, year, and engine.

**Who can use it:** Users with inventory view permissions.

**How to access:** CRM > **Compatibility**. Route: `/crm/compatibility`.

**Step-by-step:**

1. **Select Brand** (e.g., Toyota).
2. **Select Model** (e.g., Corolla).
3. **Select Year** or Generation.
4. **Select Engine** (optional).
5. The system displays compatible parts with pricing and stock levels.

**Tips:** Compatibility entries are created per product in the Product Detail page (Vehicle Compatibility tab). This is a powerful upselling tool at the point of sale.

---

## 33. Service Reminders

**Purpose:** Schedule and track service reminders for customer vehicles (oil change, brake inspection, timing belt, etc.).

**Who can use it:** Users with `reminders.view` and `reminders.manage` permissions.

**How to access:** CRM > **Reminders**. Route: `/crm/reminders`.

**Step-by-step — Add Reminder:**

1. Click **Add Reminder**.
2. Select **Customer**.
3. Select **Vehicle** (if applicable).
4. Select **Reminder Type** (Oil Change, Tire Rotation, Brake Service, etc.).
5. Enter **Title** and **Description**.
6. Set **Due Date** and/or **Due Mileage**.
7. Click **Save**.

**Statuses:** Pending, Completed, Overdue.

**Tips:** Reminders with past due dates are automatically flagged as Overdue. Use mileage-based reminders for vehicles without regular schedules.

---

## 34. Warranties

**Purpose:** Register and track product warranties for customers.

**Who can use it:** Users with `warranty.view` and `warranty.manage` permissions.

**How to access:** CRM > **Warranties**. Route: `/crm/warranties`.

**Step-by-step — Register Warranty:**

1. Click **Register Warranty**.
2. Select **Customer**.
3. Select **Product** (the item under warranty).
4. Select **Vehicle** (if applicable).
5. Select **Warranty Type** (Standard, Extended, Manufacturer).
6. Set **Period** (months) — expiration date auto-calculates.
7. Click **Save**.

**Statuses:** Active, Expiring Soon, Expired, Void.

**Tips:** Warranties are automatically created when a sale is completed if the product has a warranty period configured. Check the Expired Warranty report for follow-up opportunities.

---

## 35. Customer Credit

**Purpose:** Manage customer credit accounts — set credit limits, track balances, and view credit transactions.

**Who can use it:** Users with `customers.credit` permission.

**How to access:** CRM > **Credit**. Route: `/crm/credit`.

**Step-by-step:**

1. The page lists all customers with credit accounts.
2. Click a customer to view their credit detail: Credit Limit, Current Balance, Available Credit.
3. Credit transactions (purchases, payments, adjustments) are recorded automatically and manually.

**Tips:** Monitor available credit before processing sales for credit customers. The system can warn if a sale would exceed the credit limit.

---

## 36. Customer Notes

**Purpose:** Add internal notes to customer profiles (preferences, special instructions, issues).

**Who can use it:** Users with `customers.notes` permission.

**How to access:** CRM > **Notes**. Route: `/crm/notes`.

**Step-by-step:**

1. The page lists all customer notes.
2. **Add Note:** Select customer, enter title and content, optionally mark as private.
3. **Edit/Delete:** Manage existing notes.

**Tips:** Private notes are visible only to users with the appropriate permission level. Notes appear on the customer's timeline.

---

## 37. Reports

**Purpose:** Generate business intelligence across all operational domains.

**Who can use it:** Users with `reports.view` (general), plus specific report permissions.

**How to access:** Click **Reports** in the sidebar. Sub-module routes in `/reports/*`.

### Report Categories (45+ report types)

#### 37.1 Executive Dashboard (`/reports`)
At-a-glance business performance: Revenue Today/Week/Month, Transactions, Top Selling Products/Categories, Low Stock Alerts, Recent Sales, Sales Trend chart, Profit & Loss chart.

#### 37.2 Sales Reports (`/reports/sales`)
- Daily/Weekly/Monthly/Yearly Sales
- Sales by Cashier, Customer, Category, Brand, Product, Warehouse, Payment Method
- Revenue Overview, Transaction Overview
- Average Order Value, Sales Trends, Period Comparison
- Hourly Sales Breakdown
- Discount Analysis (total discounts, by type/product/cashier, impact on revenue)
- Tax Summary (collected, owed, by rate/product/period)
- Returns Summary (return rate, by reason/product/customer)
- Quotes Conversion (conversion rate, by salesperson)

#### 37.3 Inventory Reports (`/reports/inventory`)
- Current Stock Report, Inventory Valuation
- Inventory by Warehouse/Category
- Low Stock, Out of Stock, Overstock Reports
- Inventory Movements, Adjustments
- Inventory Aging, Dead Stock Report
- Fast/Slow Moving Products
- Stock Value Summary
- Reorder Suggestions

#### 37.4 Purchasing Reports (`/reports/purchasing`)
- Purchases by Month/Supplier
- Purchase Cost Analysis, Cost History
- Purchase Returns, Supplier Lead Time
- Purchasing Performance, PO Status
- Receiving Report, Reorder Report
- Spending Trend, Price Comparison
- Order Fulfillment Rate

#### 37.5 Customer Reports (`/reports/customers`)
- Top Customers, Customer Lifetime Value
- New Customers, Inactive Customers
- Purchase Frequency, Average Ticket
- Customer Growth, Locations
- Mechanic Customers, Fleet Customers
- Credit Customer Report, Reminders
- Warranty Status, Retention, Acquisition
- Customer Segmentation, Satisfaction

#### 37.6 Supplier Reports (`/reports/suppliers`)
- Top Suppliers, Purchase Volume
- Average Cost by Supplier, Performance
- Late Deliveries, Returns
- Preferred Suppliers, Ranking
- Lead Time, Pricing Trend
- Quality Rating, Compliance Rate

#### 37.7 Warehouse Reports (`/reports/warehouses`)
- Warehouse Utilization, Stock Distribution
- Warehouse Stock Value
- Transfers, Adjustments
- Storage Capacity, Picking Efficiency
- Receiving Efficiency

#### 37.8 Profitability Reports (`/reports/profitability`)
- Gross Revenue, Total Cost, Total Profit
- Profit Margin, by Product/Category/Supplier/Customer/Brand/Warehouse
- Gross Profit, Net Profit
- Cost-to-Revenue Ratio, Break-Even Analysis

#### 37.9 KPIs (`/reports/kpis`)
- Revenue Growth, Sales Growth, Inventory Turnover
- Average Order Value, Customer Acquisition Cost
- Customer Lifetime Value, ROI
- Gross Margin, Net Margin
- Order Fulfillment Rate, On-Time Delivery
- Inventory Accuracy, Sell-Through Rate
- Stock-to-Sales Ratio, Lead Time
- Days of Inventory, Employee Productivity
- Transactions per Day, Revenue per Employee

#### 37.10 Custom Reports (`/reports/custom`)
Build reports from scratch: select fields, add filters, group/sort, choose chart type, save as templates.

#### 37.11 Scheduled Reports (`/reports/scheduled`)
Schedule report generation: set frequency (daily/weekly/monthly/quarterly), format (CSV/Excel/PDF/JSON), and recipients.

#### 37.12 Exports (`/reports/exports`)
Export report data: CSV, Excel, PDF, JSON. Select date range, include headers, compress file.

### Report Filters

Most reports support filters: Date Range (with quick presets), Warehouse, Category, Brand, Supplier, Customer, Cashier, Payment Method, Status. Filters can be saved as presets.

### Tips

- Use Date Range filters to narrow down large datasets.
- Reports can be exported for external analysis.
- Saved filters speed up recurring report generation.
- Scheduled reports can be emailed automatically.
- The Executive Dashboard provides a quick pulse check — drill into specific reports for deeper analysis.

---

## 38. Administration

**Purpose:** System administration tools for managing users, roles, settings, backups, database, diagnostics, audits, updates, licensing, printers, and devices.

**Who can use it:** Users with appropriate `admin.*` permissions (Owner, Administrator roles).

**How to access:** Click **Administration** in the sidebar.

### 38.1 Admin Dashboard (`/admin`)
System overview: Active Users, Total Users, Database Size, Backup Status, Last Backup, Storage Usage, App Version, Connected Printers, Recent Logins, Recent Errors, Audit Events Today, System Health, License Status. Charts for User Activity, Database Growth, Recent Audit Events.

### 38.2 Users (`/admin/users`)
Manage user accounts: Create, Edit, Disable, Enable, Lock, Unlock, Reset Password, Force Password Change. Fields: Username, Email, Full Name, Role, Status, Phone, Department, Notes. Search and filter users.

### 38.3 Roles (`/admin/roles`)
Manage roles and permissions:

1. Click **Create Role** — enter name, description.
2. Use the **Permission Matrix** to assign granular permissions per module and action.
3. **Clone** existing roles to use as templates.
4. **Assign** roles to users from the role detail page.

Default roles: Owner, Administrator, Cashier, Warehouse, Purchasing, Viewer.

### 38.4 Settings (`/admin/settings`)
System-wide application settings organized by category:
- **General:** Store name, logo, currency, timezone, tax rate
- **Localization:** Language, date/time format, number format
- **Theme:** Default theme (light/dark/system)
- **Security:** Auto-logout, password policies, failed login lockout
- **Inventory:** Low stock threshold, default warehouse, barcode format
- **Sales:** Receipt footer, invoice prefix, default payment method
- **Purchasing:** PO prefix
- **Printing:** Default/receipt/invoice/label printers, paper size
- **Database:** Auto-vacuum
- **Backup:** Schedule, retention, compression, encryption, destination path
- **Updates:** Auto-check, update channel
- **Performance:** Cache settings

### 38.5 Printers (`/admin/printers`)
Configure printers: Name, Type (Thermal, Inkjet, Laser, Dot Matrix, Label, Receipt), Connection (USB, Network, Bluetooth), IP Address, Port, Paper Size, Orientation, Copies. Set default printer. Test print.

### 38.6 Devices (`/admin/devices`)
Manage hardware devices: Type (Barcode Scanner, Card Reader, Cash Drawer, Barcode Printer, Label Printer, Scale, Camera, Biometric Reader, Customer Display, Kiosk Terminal). Configure name, manufacturer, model, serial number, connection type.

### 38.7 Backups (`/admin/backups`)
Create and manage database backups:

1. **Create Backup Now** — manually create a compressed backup.
2. **Schedule** — set automatic backup frequency (daily/weekly/monthly), retention period.
3. **Download** — save backup files.
4. **Delete** — remove old backups.

### 38.8 Restore (`/admin/restore`)
Restore database from backup:

1. Select a backup file.
2. Validate the backup before restoring.
3. Choose **Complete Restore** (full database) or **Partial Restore** (specific tables).
4. Confirm — this action replaces current data and cannot be undone.

### 38.9 Database (`/admin/database`)
Database maintenance:

- **Statistics:** Total size, table count, record count, index size, cache hit ratio.
- **Table Sizes:** Breakdown of each table.
- **Actions:** Vacuum Database (reclaim storage), Optimize (performance), Integrity Check (structural verification).

### 38.10 Diagnostics (`/admin/diagnostics`)
Run system health checks:

- Database Connection, File Permissions, Disk Space, Memory Usage, CPU Load
- Network Connectivity, Email Service, Backup Integrity, Scheduled Tasks
- Application Health, Cache Status, Time Synchronization

### 38.11 Audit (`/admin/audit`)
View and search audit logs: Chronological timeline of all system events. Filter by user, action, module, date range, severity. Export as CSV/JSON/PDF.

### 38.12 Updates (`/admin/updates`)
Check for and install application updates. Configure update channel (Stable, Beta, Alpha). View update history and release notes.

### 38.13 Licensing (`/admin/licensing`)
Manage software license: Enter license key, activate/deactivate/reactivate. View license type, expiration, seats, features.

### 38.14 Maintenance (`/admin/maintenance`)
System maintenance tools: Clear Cache, Optimize Database, Clean Log Files, Reset User Preferences, Generate Maintenance Report, Repair File Permissions, Purge Deleted Records, Reindex Search.

### 38.15 About (`/admin/about`)
Application information: Version, Build Number, Release Date, Technology Stack, Credits, Third-party licenses. Links to website, documentation, and support.

---

## 39. Employees

**Purpose:** View and manage employee accounts. Employees are system users with roles and permissions.

**Who can use it:** Users with `employees.manage` permission.

**How to access:** Click **Employees** in the sidebar. Route: `/employees`.

**What you see:** List of all users with name, email, role, last active timestamp, and status (Active/Inactive).

**Tips:** Employee management is linked to the User Administration in the Admin module. Use Employees for a quick overview; use Admin > Users for detailed management.

---

## 40. Settings

**Purpose:** Configure personal application preferences and business settings.

**Who can use it:** All authenticated users (personal settings). Business-wide settings require `settings.manage` permission.

**How to access:** Click **Settings** in the sidebar. Route: `/settings`.

**Settings tabs:**

- **Language:** Select English (en) or Spanish (es).
- **Theme:** Light, Dark, or System (follows OS preference).
- **Store Information:** Business name, address, contact details (requires permission).
- **Appearance:** Theme toggle, color scheme preferences.
- **Quick Toggles:** Low Stock Alerts, Sound Effects, Auto Backup, Dark Mode.

**Tips:** Language and theme changes apply immediately. Store information changes are system-wide. Quick toggles provide convenient access to frequently adjusted settings.

---

## 41. Help

**Purpose:** Access documentation, keyboard shortcuts reference, support information, and changelog.

**Who can use it:** All authenticated users.

**How to access:** Click **Help** in the sidebar. Route: `/help`.

**What you see:**

- Link to this user manual
- Keyboard shortcuts reference
- Application version information
- Support contact information
- Changelog

**Tips:** Press **Ctrl+K** (or Cmd+K on macOS) to open the Command Palette for quick navigation to any module.
