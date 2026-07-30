# Sequence Diagrams

> **Last updated:** 2026-07-29

---

## 1. Authentication

### Login — Session Validation — Logout

```mermaid
sequenceDiagram
    participant User
    participant LoginPage
    participant AuthStore
    participant AuthService
    participant DB
    participant TopBar
    participant App

    %% LOGIN FLOW
    User->>LoginPage: Enter credentials
    LoginPage->>AuthService: login(username, password)
    AuthService->>DB: SELECT user WHERE username = ?
    DB-->>AuthService: User + hashed password
    AuthService->>AuthService: Compare password hash
    alt Valid credentials
        AuthService->>AuthService: Generate session token
        AuthService->>AuthStore: setAuth({ user, token })
        AuthStore-->>LoginPage: Auth state updated
        LoginPage->>App: navigate("/dashboard")
        App->>App: Render AppShell + Dashboard
    else Invalid credentials
        AuthService-->>LoginPage: Error
        LoginPage-->>User: "Invalid credentials"
    end

    %% SESSION VALIDATION (on app load)
    User->>App: Refresh page / new tab
    App->>AuthStore: initialize()
    AuthStore->>AuthStore: Read stored token
    alt Token exists
        AuthStore->>AuthService: validateSession()
        AuthService-->>AuthStore: User profile
        AuthStore->>AuthStore: Set authenticated state
    else No token
        AuthStore->>AuthStore: Set unauthenticated state
        App->>LoginPage: Redirect to /login
    end

    %% LOGOUT FLOW
    User->>TopBar: Click user menu → Logout
    TopBar->>AuthService: logout()
    AuthService->>AuthStore: Clear auth state
    AuthService->>AuthService: Clear stored token
    TopBar->>App: navigate("/login")
    App-->>User: LoginPage displayed
```

---

## 2. POS Checkout

### Full Transaction: Validate Stock → Create Sale → Update Stock → Process Payments → Create Receipt

```mermaid
sequenceDiagram
    participant Cashier
    participant PosPage
    participant CheckoutAPI
    participant DB
    participant StockService
    participant PaymentService
    participant ReceiptService

    Cashier->>PosPage: Search and add products to cart
    Cashier->>PosPage: Select customer, set discount
    Cashier->>PosPage: Enter payments (cash/card/transfer)
    Cashier->>PosPage: Click "Complete Sale"

    PosPage->>PosPage: Validate cart not empty
    PosPage->>PosPage: Validate totalPaid >= total
    PosPage->>CheckoutAPI: processCheckout({ items, customerId, payments, notes })

    CheckoutAPI->>DB: BEGIN TRANSACTION
    CheckoutAPI->>StockService: validateStock(items)
    StockService->>DB: SELECT stock_quantity FOR UPDATE
    DB-->>StockService: Current stock levels

    alt Insufficient stock
        StockService-->>CheckoutAPI: Error: insufficient stock
        CheckoutAPI->>DB: ROLLBACK
        CheckoutAPI-->>PosPage: Error notification
        PosPage-->>Cashier: Show error
    else Stock OK
        CheckoutAPI->>DB: INSERT INTO sales (customerId, subtotal, tax, discount, total, status)
        DB-->>CheckoutAPI: sale.id
        CheckoutAPI->>DB: INSERT INTO sale_items (saleId, productId, quantity, unitPrice, total)
        CheckoutAPI->>StockService: updateStock(items, decrement)
        StockService->>DB: UPDATE products SET stock_quantity = stock_quantity - ?
        StockService->>DB: INSERT INTO inventory_movements (type='out', ...)
        CheckoutAPI->>PaymentService: processPayments(saleId, payments)
        PaymentService->>DB: INSERT INTO sale_payments (saleId, method, amount, reference)
        alt Cash payment with overpayment
            PaymentService->>PaymentService: Calculate change
            PaymentService->>DB: Record change_amount
        end
        CheckoutAPI->>ReceiptService: createReceipt(saleId)
        ReceiptService->>DB: INSERT INTO receipts (saleId, status='pending')
        DB-->>ReceiptService: receipt.id
        CheckoutAPI->>DB: COMMIT

        CheckoutAPI-->>PosPage: { sale: {...}, receipt: {...} }
        PosPage->>PosPage: Invalidate queries (sales, pos-search, closeout)
        PosPage-->>Cashier: navigate("/sales/:saleId")
    end
```

---

## 3. Purchase Order Lifecycle

### Create → Approve → Send → Receive → Complete

```mermaid
sequenceDiagram
    participant Buyer
    participant POForm
    participant PODetail
    participant PO_Service
    participant DB
    participant StockService
    participant ReceiptService

    %% CREATE
    Buyer->>POForm: Select supplier, warehouse
    Buyer->>POForm: Add products (qty, cost)
    Buyer->>POForm: Click Save
    POForm->>PO_Service: createPurchaseOrder(data)
    PO_Service->>DB: INSERT purchase_order (status='draft')
    PO_Service->>DB: INSERT purchase_order_items
    PO_Service-->>POForm: PO created
    POForm->>PODetail: navigate to detail

    %% SEND
    Buyer->>PODetail: Click "Send to Supplier"
    PODetail->>PO_Service: updateStatus(id, 'sent')
    PO_Service->>DB: UPDATE status = 'sent'
    PO_Service-->>PODetail: Status updated

    %% RECEIVE (goods arrive)
    Buyer->>PODetail: Click "Receive"
    PODetail->>PO_Service: getPurchaseOrder(id)
    PO_Service-->>PODetail: PO with line items
    Buyer->>PODetail: Enter received/damaged qty per item
    Buyer->>PODetail: Confirm Receipt

    PODetail->>PO_Service: receivePurchaseOrder(id, items)
    PO_Service->>DB: BEGIN TRANSACTION
    PO_Service->>DB: INSERT purchase_receipt
    PO_Service->>DB: INSERT purchase_receipt_items
    PO_Service->>StockService: Add stock (received - damaged)
    StockService->>DB: UPDATE products SET stock_quantity += ?
    StockService->>DB: INSERT inventory_movement (type='in')
    PO_Service->>DB: UPDATE purchase_order_items SET received_qty, damaged_qty
    alt All items fully received
        PO_Service->>DB: UPDATE purchase_order SET status = 'received'
    else Partial
        PO_Service->>DB: UPDATE purchase_order SET status = 'partially_received'
    end
    PO_Service->>DB: COMMIT
    PO_Service-->>PODetail: Receipt created, stock updated
    PODetail-->>Buyer: PO status updated
```

---

## 4. Inventory Movement

### Sale Trigger → Auto Movement → Stock Update → History Log

```mermaid
sequenceDiagram
    participant System
    participant StockService
    participant MovementService
    participant DB

    Note over System: Sale checkout triggers movement
    System->>StockService: deductStock(productId, quantity, reference)

    StockService->>DB: SELECT stock_quantity FROM products WHERE id = ? FOR UPDATE
    DB-->>StockService: current_qty

    alt current_qty >= quantity
        StockService->>DB: UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?
        StockService->>MovementService: logMovement(productId, 'out', quantity, reference, saleId)
        MovementService->>DB: INSERT INTO inventory_movements (productId, type, quantity, reference, referenceId, notes, createdBy, createdAt)
        MovementService-->>StockService: Movement recorded
        StockService-->>System: OK
    else Insufficient stock
        StockService-->>System: Error: insufficient stock
    end

    Note over System: Purchase receipt also triggers (type='in')
    System->>StockService: addStock(productId, quantity, reference)
    StockService->>DB: UPDATE products SET stock_quantity += ?
    StockService->>MovementService: logMovement(productId, 'in', quantity, reference, receiptId)
    MovementService->>DB: INSERT into inventory_movements
    MovementService-->>StockService: OK
    StockService-->>System: OK
```

---

## 5. Customer Vehicle Registration

### Select Brand → Filter Models → Select Model → Filter Generations → Enter Details → Save

```mermaid
sequenceDiagram
    participant User
    participant Dialog
    participant VehicleAPI
    participant DB

    User->>Dialog: Open Add Vehicle dialog
    Dialog->>VehicleAPI: getVehicleBrands()
    VehicleAPI->>DB: SELECT * FROM vehicle_brands
    DB-->>VehicleAPI: Brand list
    VehicleAPI-->>Dialog: Brands rendered

    User->>Dialog: Select Brand
    Dialog->>VehicleAPI: getVehicleModels(brandId)
    VehicleAPI->>DB: SELECT * FROM vehicle_models WHERE brandId = ?
    DB-->>VehicleAPI: Model list
    VehicleAPI-->>Dialog: Models rendered in second dropdown

    User->>Dialog: Select Model
    Dialog->>VehicleAPI: getVehicleGenerations(modelId)
    VehicleAPI->>DB: SELECT * FROM vehicle_generations WHERE modelId = ?
    DB-->>VehicleAPI: Generation list
    VehicleAPI-->>Dialog: Generations rendered

    User->>Dialog: Select Generation (optional)
    Dialog->>VehicleAPI: getVehicleEngines(generationId)
    VehicleAPI->>DB: SELECT * FROM vehicle_engines WHERE generationId = ?
    DB-->>VehicleAPI: Engine list
    VehicleAPI-->>Dialog: Engines rendered

    User->>Dialog: Enter year, VIN, license plate, color, notes
    User->>Dialog: Click Save

    Dialog->>VehicleAPI: createCustomerVehicle(customerId, { brandId, modelId, generationId?, engineId?, year, vin, licensePlate, color, notes })
    VehicleAPI->>DB: INSERT INTO customer_vehicles (customerId, brandId, modelId, generationId, engineId, year, vin, licensePlate, color, notes)
    DB-->>VehicleAPI: Vehicle created
    VehicleAPI-->>Dialog: Success
    Dialog-->>User: Vehicle added to list
```

---

## 6. Backup and Restore

### Create Backup → Download → Restore

```mermaid
sequenceDiagram
    participant Admin
    participant BackupsPage
    participant BackupService
    participant DB
    participant FileSystem
    participant RestorePage

    %% BACKUP
    Admin->>BackupsPage: Click "Create Backup"
    BackupsPage->>BackupService: createBackup('manual', 'Manual backup', userId)
    BackupService->>DB: BEGIN
    BackupService->>DB: .dump (or custom export)
    DB-->>BackupService: SQL/data content
    BackupService->>FileSystem: Write backup file
    FileSystem-->>BackupService: File saved
    BackupService->>DB: INSERT INTO backup_history (type, size, filePath, status, createdBy)
    DB-->>BackupService: Record created
    BackupService->>DB: COMMIT
    BackupService-->>BackupsPage: Backup record
    BackupsPage-->>Admin: Backup in list

    %% DOWNLOAD
    Admin->>BackupsPage: Click Download
    BackupsPage->>BackupService: getBackupFile(id)
    BackupService->>FileSystem: Read file
    FileSystem-->>BackupService: File data
    BackupService-->>BackupsPage: File download

    %% RESTORE
    Admin->>RestorePage: Select backup file
    RestorePage->>BackupService: restoreFromBackup(filePath)
    BackupService->>DB: DROP/CREATE tables
    BackupService->>DB: Execute SQL from backup
    DB-->>BackupService: Tables recreated
    BackupService-->>RestorePage: Restore completed
    RestorePage-->>Admin: Success message
```

---

## 7. Report Generation

### Set Filters → Execute SQL → Return Data → Render Chart/Table

```mermaid
sequenceDiagram
    participant User
    participant ReportPage
    participant ReportAPI
    participant DB

    User->>ReportPage: Navigate to report
    ReportPage->>ReportPage: Load initial filters (defaults)
    User->>ReportPage: Set date range, filters
    User->>ReportPage: Click "Apply" / auto-submit

    ReportPage->>ReportAPI: getSalesReport({ dateFrom, dateTo, paymentMethod })
    ReportAPI->>DB: SET role, timezone
    ReportAPI->>DB: SELECT ...
    ReportAPI->>DB:   SUM, COUNT, GROUP BY ...
    ReportAPI->>DB:   WHERE date BETWEEN ? AND ? ...
    DB-->>ReportAPI: Result set (rows)
    ReportAPI->>ReportAPI: Transform data for charts
    ReportAPI-->>ReportPage: { stats, chartData, tableData }

    ReportPage->>ReportPage: Render stat cards
    ReportPage->>ReportPage: Render chart (recharts)
    ReportPage->>ReportPage: Render data table

    User->>ReportPage: Modify filters
    ReportPage->>ReportAPI: getSalesReport(updatedFilters)
    ReportAPI->>DB: Re-execute with new params
    DB-->>ReportAPI: Updated data
    ReportAPI-->>ReportPage: Updated results
    ReportPage->>ReportPage: Re-render all sections

    alt Export requested
        User->>ReportPage: Click Export → CSV/Excel/PDF
        ReportPage->>ReportAPI: exportReport({ type, format, filters })
        ReportAPI->>DB: Execute same query
        DB-->>ReportAPI: Full dataset
        ReportAPI->>ReportAPI: Format as requested
        ReportAPI-->>ReportPage: File blob
        ReportPage-->>User: Download triggers
    end
```

---

## 8. Quote to Sale Conversion

### Create Quote → Convert → New Sale Created

```mermaid
sequenceDiagram
    participant User
    participant QuoteForm
    participant QuoteDetail
    participant QuoteService
    participant SaleService
    participant DB

    %% CREATE QUOTE
    User->>QuoteForm: Select customer, add products
    User->>QuoteForm: Set tax rate, notes
    User->>QuoteForm: Click Save
    QuoteForm->>QuoteService: createQuote({ customerId, items, taxRate, notes })
    QuoteService->>DB: INSERT INTO quotes (customerId, subtotal, tax, total, status='draft', validUntil, notes)
    QuoteService->>DB: INSERT INTO quote_items (quoteId, productId, quantity, unitPrice, discount, total)
    DB-->>QuoteService: Quote created
    QuoteService-->>QuoteForm: { quote.id }
    QuoteForm->>QuoteDetail: navigate(/sales/quotes/:id)

    %% SEND QUOTE (optional)
    User->>QuoteDetail: Change status to "sent"
    QuoteDetail->>QuoteService: updateQuoteStatus(id, 'sent')
    QuoteService->>DB: UPDATE quotes SET status = 'sent'
    QuoteService-->>QuoteDetail: Status updated

    %% CONVERT TO SALE
    User->>QuoteDetail: Click "Convert to Sale"
    QuoteDetail->>QuoteService: convertQuoteToSale(quoteId)
    QuoteService->>DB: BEGIN TRANSACTION

    QuoteService->>DB: SELECT * FROM quotes WHERE id = ? FOR UPDATE
    QuoteService->>DB: SELECT * FROM quote_items WHERE quoteId = ?

    QuoteService->>SaleService: createSaleFromQuote(quote)
    SaleService->>DB: INSERT INTO sales (customerId, subtotal, tax, discount, total, status='pending', source='quote', sourceId)
    SaleService->>DB: INSERT INTO sale_items (saleId, productId, quantity, unitPrice, discount, total)

    QuoteService->>DB: UPDATE quotes SET status = 'converted'

    QuoteService->>DB: COMMIT
    QuoteService-->>QuoteDetail: { saleId }

    QuoteDetail->>QuoteDetail: navigate(/sales/saleId)
    QuoteDetail-->>User: Sale Detail displayed
```

---

## Index

| Diagram | Page | Description |
|---|---|---|
| 1. Authentication | Login, Session, Logout | Full auth lifecycle |
| 2. POS Checkout | `/sales/new` | Complete sale transaction with stock, payments, receipt |
| 3. Purchase Order | `/purchases/orders/:id` | PO from creation through receive |
| 4. Inventory Movement | Auto-triggered | Stock deduction and logging |
| 5. Vehicle Registration | Customer Detail → Vehicles | Cascading selection with brand/model/generation |
| 6. Backup & Restore | `/admin/backups`, `/admin/restore` | Backup creation, download, restore |
| 7. Report Generation | `/reports/*` | Filter → Query → Render → Export |
| 8. Quote to Sale | `/sales/quotes/:id` | Convert quote into sale |
