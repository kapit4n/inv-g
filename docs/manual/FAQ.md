# Frequently Asked Questions

> 100+ commonly asked questions organized by category.

---

## Getting Started (1–15)

**1. What is Inventory Gear?**
A desktop inventory management, point-of-sale (POS), and CRM system for auto parts stores, built with Tauri v2, React, TypeScript, and SQLite.

**2. How do I install Inventory Gear?**
Download the installer from the official website or build from source. See the [Setup Guide](../SETUP.md) for detailed instructions.

**3. What are the system requirements?**
Windows 10+, macOS 11+, or Linux (modern distro). 4GB RAM minimum, 500MB disk space. SQLite is bundled — no external database server needed.

**4. How do I log in for the first time?**
Use the default credentials: username `admin`, password `123456`. You will be prompted to change your password on first login.

**5. What are the default user accounts?**

| Username | Role | Password |
|---|---|---|
| owner | Owner | 123456 |
| admin | Administrator | 123456 |
| cashier | Cashier | 123456 |
| warehouse | Warehouse | 123456 |
| purchasing | Purchasing | 123456 |
| viewer | Viewer | 123456 |

**6. Can I change the default password?**
Yes. Go to your profile or ask an administrator to reset it. It is strongly recommended to change default passwords immediately.

**7. How do I reset my password?**
Contact your system administrator. They can reset your password from Admin > Users.

**8. Is Inventory Gear free?**
The application uses a licensing model. A trial license is included with the initial installation.

**9. How do I activate my license?**
Go to Administration > Licensing, enter your license key, and click Activate.

**10. What languages are supported?**
English (en) and Spanish (es). Additional languages can be added via the i18n system.

**11. How do I change the language?**
Go to Settings > Language and select English or Spanish. The change applies immediately.

**12. Does Inventory Gear work offline?**
Yes. The application runs locally with SQLite. No internet connection is required for core functionality.

**13. How do I update the application?**
Go to Administration > Updates to check for and install updates. Configure automatic updates in Settings.

**14. Can I use Inventory Gear on multiple computers?**
Yes. The license determines the number of seats (concurrent users). Each installation uses its own local database.

**15. How do I get help?**
Go to Help in the sidebar for documentation and support information. You can also open an issue on the project repository.

---

## Sales & POS (16–35)

**16. How do I create a new sale?**
Go to Sales > Point of Sale, search for products, add them to the cart, enter payment, and click Complete Sale.

**17. Why can't I find a product in the POS?**
Check that the product exists in Inventory > Products, is marked as Active (not Discontinued), and has stock quantity > 0.

**18. How do I add a customer to a sale?**
Use the customer search field in the cart panel. Search by name, phone, or email. The customer field is optional.

**19. Can I split a payment across multiple methods?**
Yes. Click "+ Add" in the payments section to add extra payment rows. You can mix cash, card, and transfer.

**20. How is change calculated for cash payments?**
If the total is $50 and the customer pays $100 cash, the system calculates $50 change due.

**21. Why is the Complete Sale button disabled?**
The button is disabled if: the cart is empty, payment is still processing, or the total paid is less than the total due.

**22. How do I apply a discount?**
Enter a discount percentage in the discount field in the cart panel. The discount is a percentage of the subtotal, not a fixed amount.

**23. Can I edit a sale after it's completed?**
No. Completed sales cannot be edited. Use returns/refunds to correct errors.

**24. How do I refund a sale?**
Go to Sales > Returns, find the original sale, select items to return, enter a reason, and confirm.

**25. Does refunding add stock back?**
Yes. When a sale is refunded, the returned product quantities are added back to inventory.

**26. How do I create a quote?**
Go to Sales > Quotes, click New Quote, add customer and items, set validity date, and save.

**27. How do I convert a quote to a sale?**
Open the quote and click Convert to Sale. A new sale is created with the quote's customer and items.

**28. What happens when a quote expires?**
Expired quotes cannot be converted to sales. They remain in the system for reference.

**29. How do I view past sales?**
Go to Sales > Sales History. Search by invoice number or customer name.

**30. How do I reprint a receipt?**
Go to Sales > Receipts, find the receipt, and click Reprint.

**31. What is the Cash Register for?**
The Cash Register tracks the physical cash in your register. Open a session with an opening balance, then close it to reconcile.

**32. How do I open the cash register?**
Go to Sales > Cash Register, click Open Register, enter the starting cash amount.

**33. How do I close the cash register?**
Click Close Register, enter the actual cash count, and review the difference.

**34. What is the Daily Closeout?**
It summarizes the day's sales, payments, taxes, discounts, and refunds for end-of-day reconciliation.

**35. Can I close the day without closing the cash register?**
The system requires the cash register to be closed before completing the daily closeout.

---

## Inventory (36–55)

**36. How do I add a new product?**
Go to Inventory > Products, click Add Product, enter required fields (name, SKU), and save.

**37. What is a SKU and how should I format it?**
SKU (Stock Keeping Unit) is a unique product identifier. Use a consistent format like `CATEGORY-BRAND-001`.

**38. Can I import products from a CSV file?**
Yes. Use the Import button on the Products page. The file must follow the expected column format.

**39. How do I organize products by category?**
Create categories in Inventory > Categories, then assign products to categories during creation/editing.

**40. What is the difference between a brand and a manufacturer?**
A brand is the product line name (e.g., Bosch). A manufacturer is the company that produces it (e.g., Bosch GmbH). They can overlap.

**41. How do low stock alerts work?**
When a product's stock quantity falls below its Min Stock Level, it appears in low stock reports and dashboard alerts.

**42. How do I set a reorder point?**
Edit the product and set the Reorder Point field. The reorder suggestions page will show products at or below this point.

**43. What is inventory valuation?**
The total value of your stock calculated at cost price or retail price. View it on the Inventory Dashboard.

**44. How do I record a stock adjustment?**
Go to Inventory > Inventory Movements, click Add Movement, select the product, type (adjustment), and quantity.

**45. Are inventory movements automatic?**
Yes. Sales and purchase receipts automatically create inventory movements. Manual adjustments are for corrections.

**46. How do I manage multiple warehouses?**
Create warehouses in Inventory > Warehouses, then create storage locations within each warehouse.

**47. How do I find where a product is stored?**
Check the product's Warehouse and Storage Location fields. Storage locations follow a Zone-Aisle-Shelf-Bin hierarchy.

**48. What happens when I archive a category?**
Archived categories are hidden from selection lists but existing product assignments remain.

**49. Can I delete a product?**
Products are soft-deleted (archived) rather than permanently deleted. Set the product as inactive or discontinued.

**50. How do I add a barcode to a product?**
Enter the barcode number in the Barcode field during product creation or editing.

**51. How do I add product images?**
Enter an image file path or URL in the Image URL field. Multiple images can be managed from the product detail page.

**52. What is an OEM number?**
Original Equipment Manufacturer number — the part number assigned by the vehicle manufacturer. Useful for cross-referencing parts.

**53. How do I set different prices (retail, wholesale)?**
The product form has separate fields for Sale Price, Wholesale Price, and Suggested Retail Price.

**54. How does tax rate work per product?**
Set a tax rate percentage on each product. The system calculates tax in the POS based on this rate.

**55. Can I track serial numbers?**
Serial number tracking is not currently supported. Products are tracked by quantity only.

---

## Purchasing (56–70)

**56. How do I create a purchase order?**
Go to Purchases > Orders, click New Purchase Order, select supplier, add items, and save.

**57. What purchase order statuses are there?**
Draft → Pending Approval → Approved → Sent → Partially Received → Completed. Also: Cancelled.

**58. How do I approve a purchase order?**
Open the PO and click Approve. Requires `purchases.approve` permission.

**59. How do I receive items from a PO?**
Open the PO and click Receive Order. Enter received and damaged quantities.

**60. Does receiving a PO update inventory automatically?**
Yes. Received quantities are added to inventory automatically.

**61. How do I return items to a supplier?**
Go to Purchases > Returns, create a new return referencing the original PO and supplier.

**62. What is a purchase request?**
An internal request to the purchasing department for products that need ordering.

**63. How do I check product cost history?**
Go to Purchases > Cost History. Cost changes are recorded when POs are received.

**64. What are reorder suggestions?**
Products whose current stock is at or below their reorder point, with suggested order quantities.

**65. How do I map a supplier's product to mine?**
Go to Purchases > Supplier Products. Link your product to a supplier with their SKU and pricing.

**66. What is lead time?**
The number of days between ordering from a supplier and receiving the goods.

**67. How do I set a preferred supplier?**
In Supplier Products, mark a supplier-product link as Preferred. The preferred supplier is used as default in POs.

**68. Can I have partial receipts?**
Yes. A PO can be Partially Received when only some items arrive. Receipt remaining items later.

**69. How do I handle damaged goods from a supplier?**
During receiving, enter the damaged quantity. This allows you to record issues and file claims.

**70. What is a supplier SKU?**
The supplier's own product code for the item. Store it in the Supplier Products mapping.

---

## Customers & CRM (71–85)

**71. How do I add a new customer?**
Go to Customers or CRM > Customers, click Add Customer, enter their details, and save.

**72. How do I link a vehicle to a customer?**
From the customer detail page, go to the Vehicles tab and click Add Vehicle.

**73. How do I find parts compatible with a vehicle?**
Go to CRM > Compatibility, select the vehicle brand, model, year, and engine to see compatible parts.

**74. How do I set up service reminders?**
Go to CRM > Reminders, click Add Reminder, select customer and vehicle, set due date/mileage.

**75. Will I be notified of upcoming reminders?**
Reminders are shown on the CRM Dashboard. Overdue reminders are flagged in reports.

**76. How do I register a warranty?**
Go to CRM > Warranties, click Register Warranty, select customer, product, set warranty period.

**77. How does customer credit work?**
Set a credit limit on the customer's account. Track their balance and available credit. The system can block sales that exceed the limit.

**78. How do I record a credit payment?**
Credit payments are recorded automatically when a credit sale is processed. Manual adjustments are made via the credit transactions page.

**79. What is the customer timeline?**
An automatic chronological log of all customer-related events (sales, notes, reminders, communications).

**80. Can I add private notes to a customer?**
Yes. In CRM > Notes, mark a note as Private. Private notes are visible only to users with appropriate permissions.

**81. How do I view a customer's purchase history?**
Open the customer detail page and check the Sales History tab.

**82. Can I export customer data?**
Customer data can be exported from the Customers page using the Export function.

**83. How do I search for a customer?**
Use the search bar on the Customers page. Search by name, phone, email, or customer code.

**84. What customer types are available?**
Individual and Business. Set the type during customer creation.

**85. How do I record communication with a customer?**
From the customer detail page, use the Communication Log tab to add entries.

---

## Reports (86–95)

**86. How do I generate a sales report?**
Go to Reports > Sales, select the report type (daily, weekly, monthly, etc.), apply filters, and view results.

**87. Can I export reports to Excel?**
Yes. Use the Export function on any report page. Formats: CSV, Excel, PDF, JSON.

**88. How do I schedule a recurring report?**
Go to Reports > Scheduled Reports, click Schedule New, configure frequency and format.

**89. Can I create custom reports?**
Yes. Go to Reports > Custom Reports, use the Report Builder to select fields, filters, and grouping.

**90. Why is my report showing no data?**
Check the date range filter. If the range is valid and still no data, there may be no transactions for that period.

**91. What is the Executive Dashboard?**
A high-level summary of business performance — revenue, transactions, top products, low stock alerts.

**92. What KPIs are available?**
Revenue Growth, Inventory Turnover, Average Order Value, Customer Lifetime Value, Gross Margin, and 15+ more.

**93. Can I see profitability by product?**
Yes. Go to Reports > Profitability and select "by Product" to see margin analysis per product.

**94. How do I view inventory valuation?**
Go to Reports > Inventory and select Inventory Valuation to see stock value at cost and retail.

**95. Are report filters saved?**
You can save filter presets. Scheduled reports use their own saved configurations.

---

## Administration (96–105)

**96. How do I create a new user?**
Go to Administration > Users, click Create User, enter their details, assign a role.

**97. How do I change a user's role?**
Edit the user from Administration > Users and select a different role.

**98. How do I create a custom role?**
Go to Administration > Roles, click Create Role, name it, and assign permissions using the permission matrix.

**99. How do I back up the database?**
Go to Administration > Backups, click Create Backup Now. You can also configure automatic backups.

**100. How do I restore from a backup?**
Go to Administration > Restore, select a backup file, validate it, and confirm the restore.

**101. What happens when I restore a backup?**
All current data is replaced with the data from the backup file. This action cannot be undone.

**102. How do I check system health?**
Go to Administration > Diagnostics and run the diagnostic checks.

**103. Where are audit logs stored?**
Audit logs are stored in the database. View them in Administration > Audit.

**104. How do I configure a printer?**
Go to Administration > Printers, click Add Printer, enter connection details.

**105. How do I clear the application cache?**
Go to Administration > Maintenance and click Clear Cache.

---

## Settings (106–112)

**106. How do I change the store name?**
Go to Settings or Administration > Settings, find the Store Information section.

**107. How do I set the default tax rate?**
Go to Administration > Settings > General and update the Tax Rate field.

**108. How do I change the currency?**
Go to Administration > Settings > General and update the Currency field.

**109. How do I enable automatic backups?**
Go to Administration > Settings > Backup, toggle Auto Backup on, set interval and retention.

**110. How do I configure security policies?**
Go to Administration > Settings > Security to set password policies, lockout rules, and auto-logout.

**111. How do I reset all settings to defaults?**
Go to Administration > Settings and click Reset to Defaults at the bottom.

**112. How do I change the receipt footer text?**
Go to Administration > Settings > Sales and update the Receipt Footer field.

---

## Troubleshooting (113–120)

**113. Why can't I log in?**
Check your username and password. If forgotten, contact an administrator to reset your password. Ensure Caps Lock is off.

**114. Why can't I print?**
Check that a printer is configured in Administration > Printers. Verify the printer is powered on and connected.

**115. Why are products not showing in POS?**
Ensure products are active (not discontinued), have stock quantity, and belong to the current warehouse.

**116. Why is the database locked?**
The database can be locked during backups or intensive operations. Wait a moment and try again.

**117. Why is my report empty?**
Check your date range and filter selections. If the filters are correct and data still doesn't appear, there may be no matching records.

**118. Why can't I access a page?**
You may not have the required permission. Contact an administrator to check your role permissions.

**119. Why is the language not changing?**
Language changes apply immediately. If it doesn't change, try restarting the application.

**120. Why is the theme not applying?**
Check that your OS/browser allows theme changes. The System option follows your OS preference.

---

## General (121+)

**121. How is data stored?**
All data is stored locally in a SQLite database file on your computer.

**122. Can I use the app on a network?**
The app is designed as a single-user desktop application. Multi-user network mode is not currently supported.

**123. How do I upgrade from trial to full license?**
Go to Administration > Licensing, deactivate the trial key, enter your purchased license key, and activate.

**124. Is my data encrypted?**
The SQLite database is not encrypted by default. Backups can be encrypted if configured in settings.

**125. How do I contribute to the project?**
See the [Contributing Guide](../CONTRIBUTING.md) for development setup and contribution guidelines.

**126. Where can I report bugs?**
Open an issue on the project repository. Include steps to reproduce, expected behavior, and actual behavior.

**127. How do I request a new feature?**
Open a feature request on the project repository with a clear description of the use case.

**128. Can I add custom fields to products?**
Custom fields are not currently supported. Products use the predefined schema fields.

**129. Does the app support barcode scanning?**
Yes. A barcode scanner can be configured as a device. Scanned barcodes populate the POS search automatically.

**130. How do I contact support?**
Go to Help > Support for contact information. You can also check the official website and documentation.
