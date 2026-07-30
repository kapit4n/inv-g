# Troubleshooting Guide

> Common issues, their causes, and step-by-step solutions.

---

## 1. Cannot Log In

**Symptom:** The login page rejects credentials with an "Invalid username or password" error.

**Possible causes:**

- Incorrect username or password
- Caps Lock is on
- User account is disabled or locked
- Password has expired
- Database issue

**Step-by-step solution:**

1. Verify the username is correct (check with your administrator).
2. Ensure Caps Lock is off — passwords are case-sensitive.
3. Check that you are using the correct password. Default passwords are `123456` for all built-in accounts.
4. If you have forgotten your password, ask an administrator to reset it:
   - Admin > Users > find your user > Actions > Reset Password.
5. If the account is locked (too many failed attempts), wait for the lockout duration to expire or ask an administrator to unlock it.
6. If the account is disabled, ask an administrator to enable it.
7. If all else fails, check the database connection:
   - Go to Admin > Diagnostics and run the Database Connection check.
   - If the database is corrupted, restore from the latest backup.

---

## 2. Cannot Print

**Symptom:** The Print or Reprint button produces no output, or an error is shown.

**Possible causes:**

- No printer configured in the system
- Printer is powered off or disconnected
- Wrong printer driver or connection type
- Network printer is unreachable
- Paper jam or out of paper

**Step-by-step solution:**

1. Go to **Administration > Printers** and verify at least one printer is configured and marked as active.
2. If no printer exists, click **Add Printer** and configure:
   - Name (e.g., "Receipt Printer")
   - Type (Receipt, Thermal, Laser, etc.)
   - Connection type (USB, Network, Bluetooth)
   - IP address and port (for network printers)
3. Click **Test Print** to verify the printer works.
4. Check physical connections:
   - USB printer: ensure the cable is connected and the device is powered on.
   - Network printer: verify the IP address is correct and the printer is reachable (ping the IP).
5. Check printer status:
   - Ensure there is paper loaded.
   - Clear any paper jams.
   - Check for error lights on the printer.
6. If using a thermal printer, ensure the correct paper size (80mm, 58mm) is selected in printer settings.
7. Restart the application and try again.

---

## 3. No Stock Showing

**Symptom:** The inventory or POS shows zero products, or stock quantities are missing.

**Possible causes:**

- No products have been created yet
- Products are filtered by a criteria that excludes them
- Products are set as inactive or discontinued
- Warehouse filter is excluding products
- Database query issue

**Step-by-step solution:**

1. Go to **Inventory > Products** and verify products exist in the system.
2. If no products appear, check for active filters:
   - Clear the search box.
   - Reset category, brand, and status filters.
   - Ensure "All" is selected for warehouse filters.
3. Check a specific product:
   - Open a product to verify it has stock quantity > 0.
   - Verify the product is **Active** (not Discontinued).
   - Check the **Warehouse** assignment matches the current warehouse filter.
4. If the product is out of stock, create a purchase order or stock adjustment to add inventory.
5. In the POS:
   - The product search requires at least 2–3 characters to start returning results.
   - Products with zero stock or discontinued status are not shown in POS.
6. If products exist but stock is wrong, check **Inventory > Inventory Movements** for recent adjustments or sales that may have reduced stock.
7. As a last resort, run Admin > Diagnostics > Database Integrity Check.

---

## 4. Permission Denied

**Symptom:** A "Forbidden" page is shown, or a button/menu is grayed out or missing.

**Possible causes:**

- Your role does not include the required permission
- The route is restricted
- Your session has expired

**Step-by-step solution:**

1. Note the action or page you are trying to access.
2. Contact your system administrator to verify your role has the required permission.
3. The administrator can:
   - Go to **Administration > Roles** and check which permissions your role has.
   - Edit your role to add missing permissions.
   - Assign you a different role with broader access.
4. Common permission gaps:
   - Cannot create sales: missing `sales.create`
   - Cannot see reports: missing `reports.view`
   - Cannot access admin: missing `admin.*` permissions
5. If you see "Session Expired", log out and log back in.
6. If the issue persists after permissions are granted, restart the application.

---

## 5. Database Locked

**Symptom:** An error message stating "database is locked" or "SQLITE_BUSY" appears.

**Possible causes:**

- A backup operation is in progress
- Another process is accessing the database
- A long-running query is executing
- Application crash left a lock file

**Step-by-step solution:**

1. Wait a few seconds and retry the operation — the lock is usually temporary.
2. Check if a backup is running:
   - Go to **Administration > Backups** and see if a backup is in progress.
   - Wait for the backup to complete.
3. Check if another instance of the application is running:
   - Open Task Manager (Windows) or Activity Monitor (macOS) or `ps` (Linux).
   - Close any duplicate instances of Inventory Gear.
4. If the application crashed:
   - Close the application completely.
   - Delete the SQLite WAL and SHM files in the database directory:
     - `inventory-gear.db-wal`
     - `inventory-gear.db-shm`
   - Restart the application.
5. Run database maintenance:
   - Go to **Administration > Database** and click **Run Integrity Check**.
   - If issues are found, run **Vacuum Database**.
6. If the problem persists, restore from the latest backup.

---

## 6. Printer Offline

**Symptom:** A printer shows "Offline" status or test print fails.

**Possible causes:**

- Printer is powered off
- USB cable is disconnected
- Network printer is unreachable
- Printer driver issue
- Printer is in error state

**Step-by-step solution:**

1. Verify the printer is powered on.
2. Check physical connections:
   - USB: ensure the cable is firmly connected at both ends.
   - Network: verify the Ethernet/Wi-Fi connection.
3. Check if the printer is accessible:
   - For network printers, open a command prompt and run `ping <printer-ip>`.
   - If the ping fails, check network connectivity and printer IP configuration.
4. Verify the printer is set as default or active:
   - Go to **Administration > Printers**.
   - Ensure the printer has "Active" checked.
   - Optionally set it as "Default Printer".
5. Test the printer from the operating system:
   - Windows: Print a test page from Devices & Printers.
   - Linux: Use the CUPS web interface.
   - macOS: Print a test page from System Settings > Printers & Scanners.
6. Restart the printer (power cycle).
7. Update or reinstall the printer driver.
8. Delete the printer from Inventory Gear and add it again with correct settings.

---

## 7. Application Won't Start

**Symptom:** The application fails to launch, shows a blank screen, or crashes on startup.

**Possible causes:**

- Corrupted installation
- Missing system dependencies
- Database file is corrupted
- Configuration file is corrupted
- Outdated graphics drivers
- Antivirus blocking the application

**Step-by-step solution:**

1. Restart your computer and try again.
2. Check system requirements:
   - Windows 10+, macOS 11+, or modern Linux distribution.
   - Minimum 4GB RAM.
3. Reinstall the application:
   - Uninstall Inventory Gear.
   - Download the latest version from the official source.
   - Install and try again.
4. If the database is corrupted:
   - Locate the database file (default location depends on OS — check logs or configuration).
   - Rename or move the database file (the app will create a new one on next launch).
   - Restore from the latest backup.
5. Check the application logs:
   - Logs are typically stored in the application data directory.
   - Look for error messages indicating the cause.
6. Disable antivirus temporarily and try launching again.
7. Update graphics drivers (especially for WebView2/Tauri).
8. If using Linux, ensure WebKitGTK and other Tauri dependencies are installed:
   ```bash
   # Debian/Ubuntu
   sudo apt install libwebkit2gtk-4.1-dev build-essential libssl-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev
   # Fedora
   sudo dnf install webkit2gtk4.1-devel openssl-devel gtk3-devel libappindicator-gtk3 librsvg2-devel
   ```

---

## 8. Reports Showing No Data

**Symptom:** A report page loads but displays "No data available" or empty tables/charts.

**Possible causes:**

- Date range filter is set to a period with no transactions
- Other filters (category, supplier, customer) are too restrictive
- No sales/purchases/inventory movements have been recorded yet
- The report's underlying data table is empty
- Permissions restrict what data is visible

**Step-by-step solution:**

1. Check the **Date Range** filter — extend it to a wider range (last 90 days, this year, or all time).
2. Clear all filters and presets, then regenerate the report.
3. Verify that source data exists:
   - For Sales reports: go to Sales > Sales History and check there are sales.
   - For Inventory reports: go to Inventory > Products and check there are products.
   - For Purchasing reports: go to Purchases > Orders and check there are POs.
4. If you have permission restrictions, you may only see a subset of data. Check with an administrator.
5. Try a different report type to isolate the issue:
   - If one specific report is empty but others work, there may be a bug in that report.
   - If all reports are empty, the database is likely empty.
6. Use the **Export** function to see if data exists in the raw export (even if the chart shows nothing).
7. Check the **Executive Dashboard** — if it shows data, the issue is with specific report filters.

---

## 9. POS Not Loading Products

**Symptom:** The POS page opens but no products appear when searching.

**Possible causes:**

- No products exist in the database
- Products are inactive or discontinued
- Products have zero stock quantity
- Search query is too short or too specific
- Backend query is failing

**Step-by-step solution:**

1. Go to **Inventory > Products** to confirm products exist.
2. Verify at least one product is:
   - **Active** (is_active = true)
   - **Not Discontinued** (is_discontinued = false)
   - Has **stock_quantity > 0**
3. Check that products have a **Sale Price** set (price must be positive).
4. Try searching with generic terms like "oil", "filter", or "brake" to see if any results appear.
5. If products exist but still don't appear:
   - Check the browser/console for JavaScript errors (press F12, check Console tab).
   - Restart the application.
6. If there's a backend error:
   - Run Admin > Diagnostics to check the database connection.
   - Check application logs for query errors.
7. Try creating a test product with minimal fields and check if it appears in POS.

---

## 10. Checkout Fails

**Symptom:** Clicking "Complete Sale" produces an error or the sale is not recorded.

**Possible causes:**

- Insufficient payment entered
- Database error during transaction
- Payment validation fails
- Customer credit limit exceeded
- Stock insufficient for items in cart

**Step-by-step solution:**

1. Verify **Total Paid >= Total Due**. The Complete Sale button is disabled if payment is insufficient.
2. Check that all required payment fields are filled:
   - Transfer payments require a reference number.
   - Card payments do not require a reference (optional).
3. If a customer is selected with a credit account:
   - Verify the sale total does not exceed the customer's available credit.
   - If using credit payment, ensure `customers.credit` permission is enabled.
4. Check product stock:
   - Go to each product in the cart and verify stock is sufficient.
   - If another user processed a sale for the same item simultaneously, stock may have changed.
5. Refresh the POS page to get updated product data and try again.
6. If the error persists:
   - Check for database errors in the logs.
   - Run Admin > Diagnostics to verify database integrity.
7. As a workaround, reduce quantities or remove items and try the checkout again.

---

## 11. Language Not Changing

**Symptom:** Changing the language in Settings has no visible effect.

**Possible causes:**

- Translation files are missing or incomplete
- Browser/application cache needs clearing
- Language setting was not saved
- UI components not re-rendering

**Step-by-step solution:**

1. Go to **Settings > Language** and confirm your selection is saved.
2. Verify the language files exist:
   - English: `src/i18n/locales/en/`
   - Spanish: `src/i18n/locales/es/`
   - (Contact support if your language is not listed.)
3. Clear the application cache:
   - Go to **Administration > Maintenance** and click **Clear Cache**.
4. Restart the application.
5. If only some parts of the UI are translated:
   - Some dynamic content may not have translation keys yet.
   - This is a known limitation — report missing translations to the development team.
6. If you are using a custom or community-provided language file, verify the JSON structure matches the expected format.

---

## 12. Theme Not Applying

**Symptom:** Switching between Light/Dark/System themes has no visible effect.

**Possible causes:**

- Theme setting was not saved
- Operating system theme override
- CSS not reloading
- Browser/WebView2 caching

**Step-by-step solution:**

1. Go to **Settings > Theme** and confirm your selection (Light, Dark, or System).
2. If using **System** mode:
   - The app follows your OS theme setting.
   - Change your OS theme (e.g., Windows: Settings > Personalization > Colors > Choose your default app mode).
   - Verify the app reflects the change.
3. If using **Light** or **Dark**:
   - The setting should apply immediately.
   - If it doesn't, toggle between Light and Dark a few times.
4. Clear the application cache:
   - Go to **Administration > Maintenance** > **Clear Cache**.
5. Restart the application.
6. If running in a browser (development mode), try clearing the browser cache.
7. Check that the CSS files are loading correctly (F12 > Network tab, look for 404 errors on CSS files).

---

## 13. Backup Fails

**Symptom:** Creating a backup produces an error or the backup file is missing/corrupted.

**Possible causes:**

- Insufficient disk space
- Write permissions on the backup directory
- Database is locked during backup
- Backup destination is invalid
- File size exceeds filesystem limits

**Step-by-step solution:**

1. Check available disk space on the backup destination drive.
2. Verify the backup directory exists and is writable:
   - Go to **Administration > Settings > Backup** and check the backup path.
   - Ensure the directory exists or create it manually.
3. Try a different backup location (e.g., a different drive or folder).
4. Close all other operations and retry:
   - Ensure no sales are being processed.
   - Wait for any running operations to complete.
5. If the database is large, backups may take time — do not interrupt the process.
6. Check backup compression and encryption settings:
   - If encryption is enabled but the key is invalid, backups may fail.
   - Try disabling compression and encryption.
7. Manually copy the database file as a fallback:
   - Locate the database file (check logs for the path).
   - Copy it to a safe location while the application is closed.
8. Check application logs for detailed error messages.

---

## 14. Restore Fails

**Symptom:** Restoring from a backup produces an error or the restored database is corrupted.

**Possible causes:**

- Backup file is corrupted
- Backup file is from an incompatible version
- Insufficient disk space
- Database is in use
- Permission denied to write the database file

**Step-by-step solution:**

1. Verify the backup file exists and is accessible.
2. Check the backup file size — a zero-byte file is corrupted.
3. Ensure the backup was created by the same version of Inventory Gear:
   - Restoring a backup from a different app version may cause schema incompatibility.
4. Free up disk space if the drive is full.
5. Close the application completely and try restoring from the command line or file copy as a workaround:
   - Locate the current database file and rename it (as a backup of the current state).
   - Copy the backup file to the database location with the correct filename.
   - Restart the application.
6. Use the **Validate Backup** option (if available) before attempting restore.
7. If using a partial restore, verify the selected tables exist in the backup.
8. If all restore methods fail, the backup file may be irreparably damaged. Check if older backups are available.

---

## 15. Audit Log Empty

**Symptom:** The Audit page shows no events or only very old events.

**Possible causes:**

- Audit logging is disabled or not implemented
- Events have been purged
- Filter is too restrictive
- Database has been restored from an older backup

**Step-by-step solution:**

1. Check the date range filter — extend it to a larger range.
2. Clear all filters to show all events.
3. Generate a test event:
   - Perform an action (e.g., create a sale, edit a product).
   - Refresh the audit page and check if the event appears.
4. If new events appear but old events are missing:
   - Audit logs may have been purged by maintenance (Admin > Maintenance > Purge Deleted Records).
   - Check if a database restore replaced the current data with an older snapshot.
5. If no events appear at all:
   - Audit logging requires the `admin.audit.view` permission to view.
   - Check that the audit table exists in the database (Admin > Database > Table Sizes).
   - Run a database integrity check.
6. Check application logs to verify audit events are being written.
7. If the audit table is empty and should have data, check if the backup from which the database was restored had audit data.
