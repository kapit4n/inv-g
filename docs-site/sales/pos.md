# Point of Sale (POS)

## What is it?

The POS (Point of Sale) is a fast, barcode-friendly interface for processing customer sales.

![POS](/screenshots/light/14-pos.png)

## What is it for?

Process customer transactions quickly with product search, quantity adjustment, discounts, and multiple payment methods.

## How to Access

**Sidebar → Sales → Point of Sale**. Route: `/sales/new`.

## How to Create a Sale

### Step 1: Add Products

- **Search** by name, SKU, barcode, or OEM number
- **Scan** a barcode with a USB/Bluetooth scanner
- Click on a product to add it to the cart

### Step 2: Adjust Quantities

- Click **+** or **−** to change quantity
- Or type the quantity directly

### Step 3: Apply Discounts (Optional)

- **Item discount** — Discount on specific line items
- **Order discount** — Discount on entire order
- Enter as percentage or fixed amount

### Step 4: Select Customer (Optional)

- Click **Select Customer** to attach a customer
- Useful for credit sales and history tracking

### Step 5: Choose Payment Method

| Method | Description |
|--------|-------------|
| Cash | Cash payment with change calculation |
| Card | Credit/debit card |
| Transfer | Bank transfer |
| Credit | Charge to customer account |

### Step 6: Complete Sale

Click **Complete Sale** or press **Enter** to finalize.

### Step 7: Print Receipt

A receipt is generated automatically. Click **Print** to print or **Download** for PDF.

## Features

### Barcode Scanning
Connect a USB or Bluetooth barcode scanner. Products are added automatically when scanned.

### Held Sales
Need to pause a transaction? Use **Hold** to save it. Retrieve it later from the held sales list.

### Customer Credit
For approved customers, sales can be charged to their credit account.

### Tax Calculation
Taxes are calculated automatically based on product tax rates.

## Considerations

- A cash register session must be open to process sales
- Stock quantities are updated automatically on sale
- Sales cannot be deleted — use returns for corrections
- Receipts are generated for every completed sale

## Common Errors

| Error | Solution |
|-------|----------|
| "No cash register open" | Open a cash register session first |
| "Insufficient stock" | Check product stock level |
| "Product not found" | Verify product exists and is active |

## Related

- [Cash Register](/sales/cash-register) — Open sessions
- [Sales History](/sales/history) — View past sales
- [Returns](/sales/returns) — Process returns
