use rusqlite::{Connection, Result};

const SCHEMA_VERSION: i32 = 10;

fn get_user_version(conn: &Connection) -> Result<i32> {
    let version: i32 = conn.pragma_query_value(None, "user_version", |row| row.get(0))?;
    Ok(version)
}

fn set_user_version(conn: &Connection, version: i32) -> Result<()> {
    conn.pragma_update(None, "user_version", version)?;
    Ok(())
}

pub fn create_tables(conn: &Connection) -> Result<()> {
    let current_version = get_user_version(conn)?;

    if current_version >= SCHEMA_VERSION {
        return Ok(());
    }

    if current_version > 0 && current_version < SCHEMA_VERSION {
        conn.execute_batch("PRAGMA foreign_keys=OFF;")?;
        conn.execute_batch(
            "
            DROP TABLE IF EXISTS held_sale_items;
            DROP TABLE IF EXISTS held_sales;
            DROP TABLE IF EXISTS purchase_return_items;
            DROP TABLE IF EXISTS purchase_returns;
            DROP TABLE IF EXISTS purchase_receipt_items;
            DROP TABLE IF EXISTS purchase_receipts;
            DROP TABLE IF EXISTS product_cost_history;
            DROP TABLE IF EXISTS supplier_products;
            DROP TABLE IF EXISTS purchase_request_items;
            DROP TABLE IF EXISTS purchase_requests;
            DROP TABLE IF EXISTS receipts;
            DROP TABLE IF EXISTS daily_closings;
            DROP TABLE IF EXISTS cash_register_sessions;
            DROP TABLE IF EXISTS quote_items;
            DROP TABLE IF EXISTS quotes;
            DROP TABLE IF EXISTS sale_payments;
            DROP TABLE IF EXISTS inventory_movements;
            DROP TABLE IF EXISTS product_vehicle_compatibility;
            DROP TABLE IF EXISTS product_images;
            DROP TABLE IF EXISTS storage_locations;
            DROP TABLE IF EXISTS warehouses;
            DROP TABLE IF EXISTS manufacturers;
            DROP TABLE IF EXISTS brands;
            DROP TABLE IF EXISTS purchase_order_items;
            DROP TABLE IF EXISTS purchase_orders;
            DROP TABLE IF EXISTS sale_items;
            DROP TABLE IF EXISTS sales;
            DROP TABLE IF EXISTS customers;
            DROP TABLE IF EXISTS products;
            DROP TABLE IF EXISTS categories;
            DROP TABLE IF EXISTS credit_transactions;
            DROP TABLE IF EXISTS credit_accounts;
            DROP TABLE IF EXISTS service_reminders;
            DROP TABLE IF EXISTS warranties;
            DROP TABLE IF EXISTS customer_notes;
            DROP TABLE IF EXISTS customer_timeline;
            DROP TABLE IF EXISTS customer_vehicles;
            DROP TABLE IF EXISTS vehicle_years;
            DROP TABLE IF EXISTS vehicle_fuels;
            DROP TABLE IF EXISTS vehicle_transmissions;
            DROP TABLE IF EXISTS vehicle_engines;
            DROP TABLE IF EXISTS vehicle_generations;
            DROP TABLE IF EXISTS vehicle_models;
            DROP TABLE IF EXISTS vehicle_brands;
            DROP TABLE IF EXISTS report_history;
            DROP TABLE IF EXISTS scheduled_reports;
            DROP TABLE IF EXISTS saved_reports;
            DROP TABLE IF EXISTS dashboard_preferences;
            DROP TABLE IF EXISTS kpi_definitions;
            DROP TABLE IF EXISTS report_templates;
            DROP TABLE IF EXISTS system_updates;
            DROP TABLE IF EXISTS restore_history;
            DROP TABLE IF EXISTS printer_settings;
            DROP TABLE IF EXISTS maintenance_logs;
            DROP TABLE IF EXISTS license_information;
            DROP TABLE IF EXISTS diagnostic_reports;
            DROP TABLE IF EXISTS device_settings;
            DROP TABLE IF EXISTS backup_history;
            DROP TABLE IF EXISTS communication_log;
            DROP TABLE IF EXISTS audit_logs;
            DROP TABLE IF EXISTS settings;
            DROP TABLE IF EXISTS user_sessions;
            DROP TABLE IF EXISTS role_permissions;
            DROP TABLE IF EXISTS permissions;
            DROP TABLE IF EXISTS users;
            DROP TABLE IF EXISTS roles;
            DROP TABLE IF EXISTS suppliers;
            ",
        )?;
        conn.execute_batch("PRAGMA foreign_keys=ON;")?;
    }

    conn.execute_batch(
        "
        CREATE TABLE IF NOT EXISTS roles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            description TEXT,
            is_system INTEGER NOT NULL DEFAULT 0,
            is_active INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS permissions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            key TEXT NOT NULL UNIQUE,
            name TEXT NOT NULL,
            group_name TEXT NOT NULL DEFAULT '',
            description TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS role_permissions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            role_id INTEGER NOT NULL,
            permission_id INTEGER NOT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
            FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
            UNIQUE(role_id, permission_id)
        );

        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            full_name TEXT NOT NULL,
            phone TEXT,
            role_id INTEGER,
            is_active INTEGER NOT NULL DEFAULT 1,
            is_locked INTEGER NOT NULL DEFAULT 0,
            locked_until TEXT,
            failed_login_attempts INTEGER NOT NULL DEFAULT 0,
            password_expires_at TEXT,
            password_change_required INTEGER NOT NULL DEFAULT 0,
            last_login_at TEXT,
            notes TEXT,
            created_by INTEGER,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (role_id) REFERENCES roles(id),
            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS user_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            token TEXT NOT NULL UNIQUE,
            expires_at TEXT NOT NULL,
            is_active INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            key TEXT NOT NULL UNIQUE,
            value TEXT,
            group_name TEXT NOT NULL DEFAULT 'general',
            setting_type TEXT NOT NULL DEFAULT 'string',
            description TEXT,
            is_system INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            action TEXT NOT NULL,
            entity_type TEXT,
            entity_id TEXT,
            details TEXT,
            severity TEXT NOT NULL DEFAULT 'info',
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            parent_id INTEGER,
            sort_order INTEGER NOT NULL DEFAULT 0,
            is_active INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (parent_id) REFERENCES categories(id)
        );

        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            sku TEXT NOT NULL UNIQUE,
            barcode TEXT,
            oem_number TEXT,
            internal_code TEXT,
            description TEXT,
            category_id INTEGER,
            brand_id INTEGER,
            manufacturer_id INTEGER,
            supplier_id INTEGER,
            cost_price REAL NOT NULL DEFAULT 0,
            sale_price REAL NOT NULL DEFAULT 0,
            wholesale_price REAL NOT NULL DEFAULT 0,
            suggested_retail_price REAL NOT NULL DEFAULT 0,
            tax_rate REAL NOT NULL DEFAULT 0,
            stock_quantity INTEGER NOT NULL DEFAULT 0,
            min_stock_level INTEGER NOT NULL DEFAULT 0,
            max_stock_level INTEGER NOT NULL DEFAULT 0,
            reorder_point INTEGER NOT NULL DEFAULT 0,
            unit TEXT NOT NULL DEFAULT 'pcs',
            weight REAL,
            warehouse_id INTEGER,
            storage_location_id INTEGER,
            image_url TEXT,
            is_active INTEGER NOT NULL DEFAULT 1,
            is_discontinued INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (category_id) REFERENCES categories(id),
            FOREIGN KEY (brand_id) REFERENCES brands(id),
            FOREIGN KEY (manufacturer_id) REFERENCES manufacturers(id),
            FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
            FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
            FOREIGN KEY (storage_location_id) REFERENCES storage_locations(id)
        );

        CREATE TABLE IF NOT EXISTS customers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL DEFAULT '',
            customer_code TEXT,
            customer_type TEXT NOT NULL DEFAULT 'individual',
            first_name TEXT,
            last_name TEXT,
            business_name TEXT,
            tax_number TEXT,
            phone TEXT,
            mobile TEXT,
            email TEXT,
            whatsapp TEXT,
            address TEXT,
            city TEXT,
            state TEXT,
            country TEXT DEFAULT 'ID',
            postal_code TEXT,
            preferred_contact TEXT,
            preferred_language TEXT DEFAULT 'es',
            notes TEXT,
            is_active INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS suppliers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            company_name TEXT NOT NULL,
            contact_person TEXT,
            phone TEXT,
            mobile TEXT,
            email TEXT,
            website TEXT,
            tax_number TEXT,
            address TEXT,
            city TEXT,
            state TEXT,
            postal_code TEXT,
            country TEXT DEFAULT 'ID',
            notes TEXT,
            is_active INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS sales (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sale_number TEXT NOT NULL UNIQUE,
            receipt_number TEXT,
            customer_id INTEGER,
            user_id INTEGER,
            warehouse_id INTEGER,
            subtotal REAL NOT NULL DEFAULT 0,
            tax_rate REAL NOT NULL DEFAULT 0,
            tax_amount REAL NOT NULL DEFAULT 0,
            discount_amount REAL NOT NULL DEFAULT 0,
            total REAL NOT NULL DEFAULT 0,
            payment_method TEXT NOT NULL DEFAULT 'cash',
            payment_status TEXT NOT NULL DEFAULT 'paid',
            notes TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (customer_id) REFERENCES customers(id),
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
        );

        CREATE TABLE IF NOT EXISTS sale_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sale_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL DEFAULT 1,
            unit_price REAL NOT NULL DEFAULT 0,
            discount REAL NOT NULL DEFAULT 0,
            total REAL NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES products(id)
        );

        CREATE TABLE IF NOT EXISTS purchase_orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            po_number TEXT NOT NULL UNIQUE,
            supplier_id INTEGER,
            user_id INTEGER,
            warehouse_id INTEGER,
            order_date TEXT NOT NULL DEFAULT (datetime('now')),
            expected_delivery_date TEXT,
            currency TEXT NOT NULL DEFAULT 'BOB',
            payment_terms TEXT,
            shipping_method TEXT,
            reference_number TEXT,
            buyer TEXT,
            subtotal REAL NOT NULL DEFAULT 0,
            tax_rate REAL NOT NULL DEFAULT 0,
            tax_amount REAL NOT NULL DEFAULT 0,
            discount_amount REAL NOT NULL DEFAULT 0,
            shipping_cost REAL NOT NULL DEFAULT 0,
            total REAL NOT NULL DEFAULT 0,
            status TEXT NOT NULL DEFAULT 'draft',
            notes TEXT,
            approved_by INTEGER,
            approved_at TEXT,
            sent_at TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
            FOREIGN KEY (approved_by) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS purchase_order_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            purchase_order_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            supplier_sku TEXT,
            quantity INTEGER NOT NULL DEFAULT 1,
            unit_cost REAL NOT NULL DEFAULT 0,
            discount REAL NOT NULL DEFAULT 0,
            tax REAL NOT NULL DEFAULT 0,
            total REAL NOT NULL DEFAULT 0,
            received_quantity INTEGER NOT NULL DEFAULT 0,
            damaged_quantity INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES products(id)
        );

        CREATE TABLE IF NOT EXISTS brands (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            description TEXT,
            country TEXT,
            website TEXT,
            logo_url TEXT,
            is_active INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS manufacturers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            country TEXT,
            phone TEXT,
            email TEXT,
            website TEXT,
            notes TEXT,
            is_active INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS warehouses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            code TEXT NOT NULL UNIQUE,
            address TEXT,
            city TEXT,
            state TEXT,
            country TEXT DEFAULT 'ID',
            manager TEXT,
            phone TEXT,
            is_active INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS storage_locations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            warehouse_id INTEGER NOT NULL,
            zone TEXT,
            aisle TEXT,
            shelf TEXT,
            bin TEXT,
            code TEXT NOT NULL UNIQUE,
            description TEXT,
            is_active INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS product_images (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id INTEGER NOT NULL,
            file_path TEXT NOT NULL,
            is_primary INTEGER NOT NULL DEFAULT 0,
            sort_order INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS inventory_movements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id INTEGER NOT NULL,
            warehouse_id INTEGER,
            quantity INTEGER NOT NULL,
            type TEXT NOT NULL DEFAULT 'adjustment',
            reference_type TEXT,
            reference_id TEXT,
            notes TEXT,
            created_by INTEGER,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
            FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE SET NULL,
            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS sale_payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sale_id INTEGER NOT NULL,
            method TEXT NOT NULL,
            amount REAL NOT NULL,
            reference TEXT,
            change_amount REAL NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS quotes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            quote_number TEXT NOT NULL UNIQUE,
            customer_id INTEGER,
            user_id INTEGER,
            subtotal REAL NOT NULL DEFAULT 0,
            tax_rate REAL NOT NULL DEFAULT 0,
            tax_amount REAL NOT NULL DEFAULT 0,
            discount_amount REAL NOT NULL DEFAULT 0,
            total REAL NOT NULL DEFAULT 0,
            status TEXT NOT NULL DEFAULT 'draft',
            valid_until TEXT,
            notes TEXT,
            terms_conditions TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (customer_id) REFERENCES customers(id),
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS quote_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            quote_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL DEFAULT 1,
            unit_price REAL NOT NULL DEFAULT 0,
            discount REAL NOT NULL DEFAULT 0,
            total REAL NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES products(id)
        );

        CREATE TABLE IF NOT EXISTS cash_register_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            opened_at TEXT NOT NULL DEFAULT (datetime('now')),
            closed_at TEXT,
            opening_balance REAL NOT NULL DEFAULT 0,
            closing_balance REAL,
            expected_balance REAL,
            difference REAL,
            status TEXT NOT NULL DEFAULT 'open',
            notes TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS daily_closings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            closed_by INTEGER NOT NULL,
            closed_at TEXT NOT NULL DEFAULT (datetime('now')),
            date TEXT NOT NULL,
            total_sales INTEGER NOT NULL DEFAULT 0,
            total_revenue REAL NOT NULL DEFAULT 0,
            total_tax REAL NOT NULL DEFAULT 0,
            total_discount REAL NOT NULL DEFAULT 0,
            cash_total REAL NOT NULL DEFAULT 0,
            card_total REAL NOT NULL DEFAULT 0,
            transfer_total REAL NOT NULL DEFAULT 0,
            cash_count INTEGER NOT NULL DEFAULT 0,
            card_count INTEGER NOT NULL DEFAULT 0,
            transfer_count INTEGER NOT NULL DEFAULT 0,
            refunded_count INTEGER NOT NULL DEFAULT 0,
            refunded_total REAL NOT NULL DEFAULT 0,
            net_revenue REAL NOT NULL DEFAULT 0,
            notes TEXT,
            FOREIGN KEY (closed_by) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS receipts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sale_id INTEGER NOT NULL,
            receipt_number TEXT NOT NULL UNIQUE,
            receipt_type TEXT NOT NULL DEFAULT 'sale',
            printed_at TEXT,
            is_printed INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS purchase_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            request_number TEXT NOT NULL UNIQUE,
            requested_by INTEGER,
            warehouse_id INTEGER,
            priority TEXT NOT NULL DEFAULT 'medium',
            status TEXT NOT NULL DEFAULT 'draft',
            reason TEXT,
            required_date TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (requested_by) REFERENCES users(id),
            FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
        );

        CREATE TABLE IF NOT EXISTS purchase_request_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            request_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            requested_quantity INTEGER NOT NULL DEFAULT 1,
            current_stock INTEGER NOT NULL DEFAULT 0,
            min_stock_level INTEGER NOT NULL DEFAULT 0,
            supplier_suggestion TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (request_id) REFERENCES purchase_requests(id) ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES products(id)
        );

        CREATE TABLE IF NOT EXISTS purchase_receipts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            receipt_number TEXT NOT NULL UNIQUE,
            purchase_order_id INTEGER NOT NULL,
            received_by INTEGER,
            warehouse_id INTEGER,
            notes TEXT,
            status TEXT NOT NULL DEFAULT 'pending',
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id),
            FOREIGN KEY (received_by) REFERENCES users(id),
            FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
        );

        CREATE TABLE IF NOT EXISTS purchase_receipt_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            receipt_id INTEGER NOT NULL,
            po_item_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            expected_quantity INTEGER NOT NULL DEFAULT 0,
            received_quantity INTEGER NOT NULL DEFAULT 0,
            damaged_quantity INTEGER NOT NULL DEFAULT 0,
            accepted_quantity INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (receipt_id) REFERENCES purchase_receipts(id) ON DELETE CASCADE,
            FOREIGN KEY (po_item_id) REFERENCES purchase_order_items(id),
            FOREIGN KEY (product_id) REFERENCES products(id)
        );

        CREATE TABLE IF NOT EXISTS purchase_returns (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            return_number TEXT NOT NULL UNIQUE,
            purchase_order_id INTEGER,
            supplier_id INTEGER NOT NULL,
            reason TEXT,
            status TEXT NOT NULL DEFAULT 'pending',
            created_by INTEGER,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id),
            FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
            FOREIGN KEY (created_by) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS purchase_return_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            return_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            quantity INTEGER NOT NULL DEFAULT 1,
            unit_cost REAL NOT NULL DEFAULT 0,
            reason TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (return_id) REFERENCES purchase_returns(id) ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES products(id)
        );

        CREATE TABLE IF NOT EXISTS supplier_products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            supplier_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            supplier_sku TEXT,
            is_preferred INTEGER NOT NULL DEFAULT 0,
            minimum_order_quantity INTEGER NOT NULL DEFAULT 1,
            lead_time_days INTEGER NOT NULL DEFAULT 1,
            default_cost REAL NOT NULL DEFAULT 0,
            currency TEXT NOT NULL DEFAULT 'BOB',
            status TEXT NOT NULL DEFAULT 'active',
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
            UNIQUE(supplier_id, product_id)
        );

        CREATE TABLE IF NOT EXISTS product_cost_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id INTEGER NOT NULL,
            supplier_id INTEGER,
            purchase_order_id INTEGER,
            old_cost REAL NOT NULL DEFAULT 0,
            new_cost REAL NOT NULL DEFAULT 0,
            quantity INTEGER NOT NULL DEFAULT 0,
            created_by INTEGER,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
            FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
            FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id),
            FOREIGN KEY (created_by) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS credit_accounts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id INTEGER NOT NULL UNIQUE,
            credit_limit REAL NOT NULL DEFAULT 0,
            current_balance REAL NOT NULL DEFAULT 0,
            status TEXT NOT NULL DEFAULT 'active',
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS credit_transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            account_id INTEGER NOT NULL,
            amount REAL NOT NULL,
            transaction_type TEXT NOT NULL,
            reference_type TEXT,
            reference_id TEXT,
            notes TEXT,
            created_by INTEGER,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (account_id) REFERENCES credit_accounts(id) ON DELETE CASCADE,
            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS vehicle_brands (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            description TEXT,
            country TEXT,
            is_active INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS vehicle_models (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            brand_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            is_active INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (brand_id) REFERENCES vehicle_brands(id) ON DELETE CASCADE,
            UNIQUE(brand_id, name)
        );

        CREATE TABLE IF NOT EXISTS vehicle_generations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            model_id INTEGER NOT NULL,
            name TEXT,
            year_start INTEGER,
            year_end INTEGER,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (model_id) REFERENCES vehicle_models(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS vehicle_engines (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            displacement TEXT,
            power TEXT,
            fuel_type TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS vehicle_transmissions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            type TEXT,
            gears INTEGER,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS vehicle_fuels (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS customer_vehicles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id INTEGER NOT NULL,
            license_plate TEXT,
            nickname TEXT,
            brand_id INTEGER,
            model_id INTEGER,
            generation_id INTEGER,
            year INTEGER,
            engine_id INTEGER,
            transmission_id INTEGER,
            fuel_id INTEGER,
            vin TEXT,
            color TEXT,
            mileage INTEGER DEFAULT 0,
            purchase_date TEXT,
            notes TEXT,
            status TEXT NOT NULL DEFAULT 'active',
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
            FOREIGN KEY (brand_id) REFERENCES vehicle_brands(id),
            FOREIGN KEY (model_id) REFERENCES vehicle_models(id),
            FOREIGN KEY (generation_id) REFERENCES vehicle_generations(id),
            FOREIGN KEY (engine_id) REFERENCES vehicle_engines(id),
            FOREIGN KEY (transmission_id) REFERENCES vehicle_transmissions(id),
            FOREIGN KEY (fuel_id) REFERENCES vehicle_fuels(id)
        );

        CREATE TABLE IF NOT EXISTS customer_notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id INTEGER NOT NULL,
            note_type TEXT NOT NULL DEFAULT 'general',
            title TEXT,
            content TEXT,
            is_private INTEGER NOT NULL DEFAULT 0,
            created_by INTEGER,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS customer_timeline (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id INTEGER NOT NULL,
            event_type TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            reference_type TEXT,
            reference_id TEXT,
            created_by INTEGER,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS service_reminders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id INTEGER NOT NULL,
            vehicle_id INTEGER,
            reminder_type TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            due_date TEXT,
            due_mileage INTEGER,
            status TEXT NOT NULL DEFAULT 'pending',
            completed_at TEXT,
            completed_by INTEGER,
            notes TEXT,
            created_by INTEGER,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
            FOREIGN KEY (vehicle_id) REFERENCES customer_vehicles(id) ON DELETE SET NULL,
            FOREIGN KEY (completed_by) REFERENCES users(id) ON DELETE SET NULL,
            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS warranties (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            warranty_number TEXT NOT NULL UNIQUE,
            sale_id INTEGER,
            product_id INTEGER,
            customer_id INTEGER NOT NULL,
            vehicle_id INTEGER,
            warranty_type TEXT NOT NULL DEFAULT 'standard',
            period_months INTEGER NOT NULL DEFAULT 12,
            start_date TEXT NOT NULL,
            expiration_date TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'active',
            notes TEXT,
            created_by INTEGER,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE SET NULL,
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
            FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
            FOREIGN KEY (vehicle_id) REFERENCES customer_vehicles(id) ON DELETE SET NULL,
            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS product_vehicle_compatibility (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id INTEGER NOT NULL,
            brand_id INTEGER,
            model_id INTEGER,
            generation_id INTEGER,
            engine_id INTEGER,
            transmission_id INTEGER,
            year_start INTEGER,
            year_end INTEGER,
            notes TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
            FOREIGN KEY (brand_id) REFERENCES vehicle_brands(id),
            FOREIGN KEY (model_id) REFERENCES vehicle_models(id),
            FOREIGN KEY (generation_id) REFERENCES vehicle_generations(id),
            FOREIGN KEY (engine_id) REFERENCES vehicle_engines(id),
            FOREIGN KEY (transmission_id) REFERENCES vehicle_transmissions(id)
        );

        CREATE TABLE IF NOT EXISTS communication_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id INTEGER NOT NULL,
            type TEXT NOT NULL DEFAULT 'note',
            subject TEXT NOT NULL,
            message TEXT,
            created_by INTEGER,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS saved_reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            module TEXT NOT NULL,
            config TEXT NOT NULL DEFAULT '{}',
            columns TEXT,
            filters TEXT,
            sorting TEXT,
            is_favorite INTEGER NOT NULL DEFAULT 0,
            version INTEGER NOT NULL DEFAULT 1,
            created_by INTEGER,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS scheduled_reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            saved_report_id INTEGER,
            name TEXT NOT NULL,
            frequency TEXT NOT NULL DEFAULT 'weekly',
            day_of_week INTEGER,
            day_of_month INTEGER,
            time TEXT NOT NULL DEFAULT '08:00',
            export_format TEXT NOT NULL DEFAULT 'csv',
            destination TEXT NOT NULL DEFAULT 'local',
            recipients TEXT,
            is_active INTEGER NOT NULL DEFAULT 1,
            last_run_at TEXT,
            next_run_at TEXT,
            created_by INTEGER,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (saved_report_id) REFERENCES saved_reports(id) ON DELETE SET NULL,
            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS report_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            report_name TEXT NOT NULL,
            module TEXT NOT NULL,
            filters TEXT,
            export_format TEXT,
            execution_time_ms INTEGER DEFAULT 0,
            row_count INTEGER DEFAULT 0,
            file_path TEXT,
            generated_by INTEGER,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (generated_by) REFERENCES users(id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS dashboard_preferences (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL UNIQUE,
            layout TEXT NOT NULL DEFAULT '[]',
            widgets TEXT NOT NULL DEFAULT '[]',
            theme TEXT NOT NULL DEFAULT 'light',
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS kpi_definitions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            key TEXT NOT NULL UNIQUE,
            description TEXT,
            category TEXT NOT NULL DEFAULT 'general',
            formula TEXT,
            unit TEXT,
            target REAL,
            warning_threshold REAL,
            critical_threshold REAL,
            is_active INTEGER NOT NULL DEFAULT 1,
            sort_order INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS report_templates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            module TEXT NOT NULL,
            config TEXT NOT NULL DEFAULT '{}',
            is_system INTEGER NOT NULL DEFAULT 0,
            created_by INTEGER,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
        );

        -- Admin Module Tables (v8)
        CREATE TABLE IF NOT EXISTS backup_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            file_name TEXT NOT NULL,
            file_path TEXT NOT NULL,
            file_size INTEGER NOT NULL DEFAULT 0,
            backup_type TEXT NOT NULL DEFAULT 'manual',
            compression TEXT NOT NULL DEFAULT 'none',
            encryption TEXT NOT NULL DEFAULT 'none',
            status TEXT NOT NULL DEFAULT 'completed',
            checksum TEXT,
            notes TEXT,
            created_by INTEGER,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS restore_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            backup_id INTEGER,
            file_name TEXT NOT NULL,
            file_path TEXT NOT NULL,
            restore_type TEXT NOT NULL DEFAULT 'complete',
            status TEXT NOT NULL DEFAULT 'completed',
            tables_restored TEXT,
            error_message TEXT,
            created_by INTEGER,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (backup_id) REFERENCES backup_history(id) ON DELETE SET NULL,
            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS printer_settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            printer_type TEXT NOT NULL DEFAULT 'receipt',
            driver_name TEXT,
            device_name TEXT,
            interface_type TEXT NOT NULL DEFAULT 'usb',
            ip_address TEXT,
            port INTEGER,
            paper_size TEXT NOT NULL DEFAULT '80mm',
            margins TEXT NOT NULL DEFAULT '{\"top\":0,\"bottom\":0,\"left\":0,\"right\":0}',
            copies INTEGER NOT NULL DEFAULT 1,
            orientation TEXT NOT NULL DEFAULT 'portrait',
            is_default INTEGER NOT NULL DEFAULT 0,
            is_active INTEGER NOT NULL DEFAULT 1,
            config JSON NOT NULL DEFAULT '{}',
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS device_settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            device_type TEXT NOT NULL DEFAULT 'scanner',
            identifier TEXT,
            interface_type TEXT NOT NULL DEFAULT 'usb',
            config JSON NOT NULL DEFAULT '{}',
            is_active INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS application_settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category TEXT NOT NULL DEFAULT 'general',
            key TEXT NOT NULL UNIQUE,
            value TEXT,
            setting_type TEXT NOT NULL DEFAULT 'string',
            description TEXT,
            options TEXT,
            validation TEXT,
            is_system INTEGER NOT NULL DEFAULT 0,
            sort_order INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS license_information (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            license_key TEXT NOT NULL UNIQUE,
            license_type TEXT NOT NULL DEFAULT 'trial',
            company_name TEXT,
            contact_name TEXT,
            contact_email TEXT,
            max_users INTEGER NOT NULL DEFAULT 5,
            max_stores INTEGER NOT NULL DEFAULT 1,
            features TEXT NOT NULL DEFAULT '[]',
            activation_date TEXT,
            expiration_date TEXT,
            status TEXT NOT NULL DEFAULT 'inactive',
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS maintenance_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            operation TEXT NOT NULL,
            details TEXT,
            status TEXT NOT NULL DEFAULT 'completed',
            duration_ms INTEGER NOT NULL DEFAULT 0,
            affected_rows INTEGER NOT NULL DEFAULT 0,
            error_message TEXT,
            created_by INTEGER,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS diagnostic_reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            report_type TEXT NOT NULL DEFAULT 'system',
            status TEXT NOT NULL DEFAULT 'healthy',
            summary TEXT,
            details JSON NOT NULL DEFAULT '{}',
            issues_found INTEGER NOT NULL DEFAULT 0,
            warnings INTEGER NOT NULL DEFAULT 0,
            created_by INTEGER,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS system_updates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            version TEXT NOT NULL,
            release_date TEXT,
            release_notes TEXT,
            download_url TEXT,
            file_name TEXT,
            file_size INTEGER,
            checksum TEXT,
            status TEXT NOT NULL DEFAULT 'available',
            installed_at TEXT,
            installed_by INTEGER,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (installed_by) REFERENCES users(id) ON DELETE SET NULL
        );

        -- Indexes for fast product search (TASK 06)
        CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
        CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
        CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
        CREATE INDEX IF NOT EXISTS idx_products_oem_number ON products(oem_number);
        CREATE INDEX IF NOT EXISTS idx_products_internal_code ON products(internal_code);
        CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
        CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand_id);
        CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);

        -- Held sales (TASK 07)
        CREATE TABLE IF NOT EXISTS held_sales (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            hold_number TEXT NOT NULL UNIQUE,
            customer_id INTEGER,
            user_id INTEGER,
            subtotal REAL NOT NULL DEFAULT 0,
            tax_amount REAL NOT NULL DEFAULT 0,
            discount_amount REAL NOT NULL DEFAULT 0,
            total REAL NOT NULL DEFAULT 0,
            discount_percent REAL NOT NULL DEFAULT 0,
            notes TEXT,
            label TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (customer_id) REFERENCES customers(id),
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS held_sale_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            held_sale_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            sku TEXT NOT NULL,
            quantity INTEGER NOT NULL DEFAULT 1,
            unit_price REAL NOT NULL DEFAULT 0,
            tax_rate REAL NOT NULL DEFAULT 0,
            total REAL NOT NULL DEFAULT 0,
            stock_quantity INTEGER NOT NULL DEFAULT 0,
            unit TEXT NOT NULL DEFAULT 'pcs',
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (held_sale_id) REFERENCES held_sales(id) ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES products(id)
        );
        ",
    )?;
    set_user_version(conn, SCHEMA_VERSION)?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::init_database;
    use rusqlite::Connection;
    use std::path::PathBuf;

    struct TestDb {
        dir: PathBuf,
        path: PathBuf,
    }

    impl TestDb {
        fn new() -> Self {
            let dir = std::env::temp_dir().join(format!("ig_schema_test_{}", uuid::Uuid::new_v4()));
            std::fs::create_dir_all(&dir).expect("create temp dir");
            let path = dir.join("test.db");
            Self { dir, path }
        }

        fn conn(&self) -> Connection {
            init_database(self.path.to_str().unwrap()).expect("init_database failed")
        }
    }

    impl Drop for TestDb {
        fn drop(&mut self) {
            let _ = std::fs::remove_dir_all(&self.dir);
        }
    }

    fn table_names(conn: &Connection) -> Vec<String> {
        let mut stmt = conn
            .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
            .unwrap();
        let rows = stmt.query_map([], |row| row.get(0)).unwrap();
        rows.filter_map(|r| r.ok()).collect()
    }

    fn get_schema_version(conn: &Connection) -> i32 {
        conn.pragma_query_value(None, "user_version", |row| row.get(0))
            .unwrap_or(0)
    }

    const EXPECTED_TABLES: &[&str] = &[
        "application_settings",
        "audit_logs",
        "backup_history",
        "brands",
        "categories",
        "communication_log",
        "credit_accounts",
        "credit_transactions",
        "customer_notes",
        "customer_timeline",
        "customer_vehicles",
        "customers",
        "dashboard_preferences",
        "device_settings",
        "diagnostic_reports",
        "held_sale_items",
        "held_sales",
        "kpi_definitions",
        "license_information",
        "maintenance_logs",
        "manufacturers",
        "permissions",
        "printer_settings",
        "product_cost_history",
        "product_images",
        "product_vehicle_compatibility",
        "products",
        "purchase_order_items",
        "purchase_orders",
        "purchase_receipt_items",
        "purchase_receipts",
        "purchase_request_items",
        "purchase_requests",
        "purchase_return_items",
        "purchase_returns",
        "quote_items",
        "quotes",
        "receipts",
        "report_history",
        "report_templates",
        "restore_history",
        "role_permissions",
        "roles",
        "sale_items",
        "sale_payments",
        "sales",
        "saved_reports",
        "scheduled_reports",
        "service_reminders",
        "settings",
        "storage_locations",
        "supplier_products",
        "suppliers",
        "system_updates",
        "user_sessions",
        "users",
        "vehicle_brands",
        "vehicle_engines",
        "vehicle_fuels",
        "vehicle_generations",
        "vehicle_models",
        "vehicle_transmissions",
        "warranties",
    ];

    fn assert_all_tables_exist(conn: &Connection) {
        let existing = table_names(conn);
        for expected in EXPECTED_TABLES {
            assert!(
                existing.iter().any(|t| t == expected),
                "Missing table: {expected}"
            );
        }
    }

    // ── Fresh database tests ─────────────────────────────────────────

    #[test]
    fn fresh_db_creates_all_tables() {
        let td = TestDb::new();
        let conn = td.conn();
        assert_all_tables_exist(&conn);
    }

    #[test]
    fn fresh_db_sets_schema_version() {
        let td = TestDb::new();
        let conn = td.conn();
        assert_eq!(get_schema_version(&conn), SCHEMA_VERSION);
    }

    #[test]
    fn fresh_db_seeds_roles() {
        let td = TestDb::new();
        let conn = td.conn();
        let count: i64 = conn
            .query_row("SELECT COUNT(*) FROM roles", [], |row| row.get(0))
            .unwrap();
        assert!(count >= 6, "Expected at least 6 seed roles, got {count}");
    }

    #[test]
    fn fresh_db_seeds_users() {
        let td = TestDb::new();
        let conn = td.conn();
        let count: i64 = conn
            .query_row("SELECT COUNT(*) FROM users", [], |row| row.get(0))
            .unwrap();
        assert!(count >= 6, "Expected at least 6 seed users, got {count}");
    }

    #[test]
    fn fresh_db_seeds_permissions() {
        let td = TestDb::new();
        let conn = td.conn();
        let count: i64 = conn
            .query_row("SELECT COUNT(*) FROM permissions", [], |row| row.get(0))
            .unwrap();
        assert!(count >= 40, "Expected at least 40 permissions, got {count}");
    }

    #[test]
    fn fresh_db_seeds_warehouses() {
        let td = TestDb::new();
        let conn = td.conn();
        let count: i64 = conn
            .query_row("SELECT COUNT(*) FROM warehouses", [], |row| row.get(0))
            .unwrap();
        assert!(count >= 3, "Expected at least 3 warehouses, got {count}");
    }

    #[test]
    fn fresh_db_seeds_products() {
        let td = TestDb::new();
        let conn = td.conn();
        let count: i64 = conn
            .query_row("SELECT COUNT(*) FROM products", [], |row| row.get(0))
            .unwrap();
        assert!(count >= 15, "Expected at least 15 products, got {count}");
    }

    // ── Foreign key integrity tests ──────────────────────────────────

    #[test]
    fn fk_enforced_after_creation() {
        let td = TestDb::new();
        let conn = td.conn();
        let fk_on: i32 = conn
            .pragma_query_value(None, "foreign_keys", |row| row.get(0))
            .unwrap();
        assert_eq!(fk_on, 1, "foreign_keys pragma should be ON after init");
    }

    #[test]
    fn insert_product_with_invalid_category_fk_fails() {
        let td = TestDb::new();
        let conn = td.conn();
        let result = conn.execute(
            "INSERT INTO products (name, sku, cost_price, sale_price, category_id) VALUES ('test', 'FK-TEST-1', 1.0, 2.0, 99999)",
            [],
        );
        assert!(result.is_err(), "FK violation should fail");
    }

    #[test]
    fn insert_product_with_invalid_brand_fk_fails() {
        let td = TestDb::new();
        let conn = td.conn();
        let result = conn.execute(
            "INSERT INTO products (name, sku, cost_price, sale_price, brand_id) VALUES ('test', 'FK-TEST-2', 1.0, 2.0, 99999)",
            [],
        );
        assert!(result.is_err(), "FK violation should fail");
    }

    #[test]
    fn insert_product_with_invalid_warehouse_fk_fails() {
        let td = TestDb::new();
        let conn = td.conn();
        let result = conn.execute(
            "INSERT INTO products (name, sku, cost_price, sale_price, warehouse_id) VALUES ('test', 'FK-TEST-3', 1.0, 2.0, 99999)",
            [],
        );
        assert!(result.is_err(), "FK violation should fail");
    }

    #[test]
    fn insert_user_with_invalid_role_fk_fails() {
        let td = TestDb::new();
        let conn = td.conn();
        let result = conn.execute(
            "INSERT INTO users (username, email, password_hash, full_name, role_id) VALUES ('fktest', 'fk@test.com', 'hash', 'FK Test', 99999)",
            [],
        );
        assert!(result.is_err(), "FK violation should fail");
    }

    #[test]
    fn insert_sale_item_with_invalid_sale_fk_fails() {
        let td = TestDb::new();
        let conn = td.conn();
        let result = conn.execute(
            "INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, total) VALUES (99999, 1, 1, 1.0, 1.0)",
            [],
        );
        assert!(result.is_err(), "FK violation should fail");
    }

    #[test]
    fn insert_role_permission_with_invalid_role_fk_fails() {
        let td = TestDb::new();
        let conn = td.conn();
        let result = conn.execute(
            "INSERT INTO role_permissions (role_id, permission_id) VALUES (99999, 1)",
            [],
        );
        assert!(result.is_err(), "FK violation should fail");
    }

    #[test]
    fn insert_valid_product_succeeds() {
        let td = TestDb::new();
        let conn = td.conn();
        let cat_id: i64 = conn
            .query_row("SELECT id FROM categories LIMIT 1", [], |row| row.get(0))
            .unwrap();
        let brand_id: i64 = conn
            .query_row("SELECT id FROM brands LIMIT 1", [], |row| row.get(0))
            .unwrap();
        let wh_id: i64 = conn
            .query_row("SELECT id FROM warehouses LIMIT 1", [], |row| row.get(0))
            .unwrap();
        let result = conn.execute(
            "INSERT INTO products (name, sku, cost_price, sale_price, category_id, brand_id, warehouse_id) VALUES ('valid', 'VALID-FK-1', 1.0, 2.0, ?1, ?2, ?3)",
            rusqlite::params![cat_id, brand_id, wh_id],
        );
        assert!(result.is_ok(), "Valid FK insert should succeed");
    }

    // ── Migration tests ──────────────────────────────────────────────

    #[test]
    fn migration_from_old_version_succeeds() {
        let td = TestDb::new();
        let path = td.path.to_str().unwrap();

        // Create DB at an older schema version.
        {
            let conn = Connection::open(path).unwrap();
            conn.execute_batch("PRAGMA user_version=8;").unwrap();
        }

        // Running init_database should migrate and create everything.
        let conn = init_database(path).expect("migration should succeed");
        assert_all_tables_exist(&conn);
        assert_eq!(get_schema_version(&conn), SCHEMA_VERSION);
    }

    #[test]
    fn migration_from_old_version_with_fk_linked_data() {
        let td = TestDb::new();
        let path = td.path.to_str().unwrap();

        // Simulate a partial old DB with FK-linked data.
        {
            let conn = Connection::open(path).unwrap();
            conn.execute_batch("PRAGMA foreign_keys=OFF;").unwrap();
            conn.execute_batch(
                "
                CREATE TABLE roles (id INTEGER PRIMARY KEY, name TEXT);
                CREATE TABLE users (id INTEGER PRIMARY KEY, role_id INTEGER REFERENCES roles(id));
                CREATE TABLE permissions (id INTEGER PRIMARY KEY, key TEXT);
                CREATE TABLE role_permissions (id INTEGER PRIMARY KEY, role_id INTEGER, permission_id INTEGER);
                CREATE TABLE categories (id INTEGER PRIMARY KEY, name TEXT);
                CREATE TABLE brands (id INTEGER PRIMARY KEY, name TEXT);
                CREATE TABLE suppliers (id INTEGER PRIMARY KEY, company_name TEXT);
                CREATE TABLE warehouses (id INTEGER PRIMARY KEY, name TEXT, code TEXT);
                CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT, sku TEXT, category_id INTEGER REFERENCES categories(id), brand_id INTEGER REFERENCES brands(id), supplier_id INTEGER REFERENCES suppliers(id), warehouse_id INTEGER REFERENCES warehouses(id));
                CREATE TABLE customers (id INTEGER PRIMARY KEY, name TEXT);
                CREATE TABLE sales (id INTEGER PRIMARY KEY, sale_number TEXT, customer_id INTEGER REFERENCES customers(id), user_id INTEGER REFERENCES users(id));
                CREATE TABLE sale_items (id INTEGER PRIMARY KEY, sale_id INTEGER REFERENCES sales(id), product_id INTEGER);
                CREATE TABLE settings (id INTEGER PRIMARY KEY, key TEXT UNIQUE, value TEXT);

                INSERT INTO roles VALUES (1, 'owner');
                INSERT INTO users VALUES (1, 1);
                INSERT INTO categories VALUES (1, 'Engine');
                INSERT INTO brands VALUES (1, 'Bosch');
                INSERT INTO suppliers VALUES (1, 'TestSupplier');
                INSERT INTO warehouses VALUES (1, 'Main', 'WH-001');
                INSERT INTO products VALUES (1, 'Filter', 'SKU-1', 1, 1, 1, 1);
                INSERT INTO customers VALUES (1, 'Test Customer');
                INSERT INTO sales VALUES (1, 'SALE-001', 1, 1);
                INSERT INTO sale_items VALUES (1, 1, 1);
                INSERT INTO settings VALUES (1, 'app_version', '0.1.0');
                PRAGMA user_version=8;
                ",
            )
            .unwrap();
        }

        // Now init — the migration should drop everything and recreate.
        let conn = init_database(path).expect("migration with FK data should succeed");
        assert_all_tables_exist(&conn);
        assert_eq!(get_schema_version(&conn), SCHEMA_VERSION);

        // Should be fresh — no stale data from the old schema.
        let users: i64 = conn
            .query_row("SELECT COUNT(*) FROM users", [], |row| row.get(0))
            .unwrap();
        assert!(users >= 6, "Should have seeded users after migration");
    }

    #[test]
    fn migration_preserves_no_data_from_old_schema() {
        let td = TestDb::new();
        let path = td.path.to_str().unwrap();

        {
            let conn = Connection::open(path).unwrap();
            conn.execute_batch("PRAGMA foreign_keys=OFF;").unwrap();
            conn.execute_batch(
                "
                CREATE TABLE settings (id INTEGER PRIMARY KEY, key TEXT UNIQUE, value TEXT);
                INSERT INTO settings VALUES (1, 'old_key', 'old_value');
                PRAGMA user_version=5;
                ",
            )
            .unwrap();
        }

        let conn = init_database(path).unwrap();
        let old_val: Option<String> = conn
            .query_row(
                "SELECT value FROM settings WHERE key = 'old_key'",
                [],
                |row| row.get(0),
            )
            .ok();
        assert!(old_val.is_none(), "Old data should not survive migration");
    }

    // ── Idempotency tests ────────────────────────────────────────────

    #[test]
    fn init_database_is_idempotent() {
        let td = TestDb::new();
        let path = td.path.to_str().unwrap();

        let conn1 = init_database(path).expect("first init");
        let users1: i64 = conn1
            .query_row("SELECT COUNT(*) FROM users", [], |row| row.get(0))
            .unwrap();
        drop(conn1);

        let conn2 = init_database(path).expect("second init");
        let users2: i64 = conn2
            .query_row("SELECT COUNT(*) FROM users", [], |row| row.get(0))
            .unwrap();
        assert_eq!(users1, users2, "Double init should not duplicate data");
    }

    #[test]
    fn init_database_preserves_existing_data() {
        let td = TestDb::new();
        let path = td.path.to_str().unwrap();

        let conn = init_database(path).unwrap();
        // Add a custom row.
        conn.execute(
            "INSERT INTO settings (key, value, group_name, setting_type, description) VALUES ('test_marker', 'yes', 'test', 'string', 'test')",
            [],
        )
        .unwrap();
        drop(conn);

        let conn = init_database(path).unwrap();
        let val: Option<String> = conn
            .query_row(
                "SELECT value FROM settings WHERE key = 'test_marker'",
                [],
                |row| row.get(0),
            )
            .ok();
        assert_eq!(val, Some("yes".into()), "Existing data preserved after reinit");
    }

    // ── Schema version edge cases ────────────────────────────────────

    #[test]
    fn already_at_current_version_is_noop() {
        let td = TestDb::new();
        let path = td.path.to_str().unwrap();

        let conn = init_database(path).unwrap();
        let users_before: i64 = conn
            .query_row("SELECT COUNT(*) FROM users", [], |row| row.get(0))
            .unwrap();

        // Re-init — should be a no-op.
        drop(conn);
        let conn = init_database(path).unwrap();
        let users_after: i64 = conn
            .query_row("SELECT COUNT(*) FROM users", [], |row| row.get(0))
            .unwrap();
        assert_eq!(users_before, users_after);
    }

    #[test]
    fn migration_from_version_1_to_current() {
        let td = TestDb::new();
        let path = td.path.to_str().unwrap();

        {
            let conn = Connection::open(path).unwrap();
            conn.execute_batch("PRAGMA user_version=1;").unwrap();
        }

        let conn = init_database(path).expect("migration from v1 should succeed");
        assert_all_tables_exist(&conn);
        assert_eq!(get_schema_version(&conn), SCHEMA_VERSION);
    }

    #[test]
    fn migration_from_version_9_to_current() {
        let td = TestDb::new();
        let path = td.path.to_str().unwrap();

        {
            let conn = Connection::open(path).unwrap();
            conn.execute_batch("PRAGMA user_version=9;").unwrap();
        }

        let conn = init_database(path).expect("migration from v9 should succeed");
        assert_all_tables_exist(&conn);
        assert_eq!(get_schema_version(&conn), SCHEMA_VERSION);
    }

    // ── FK constraint remains active after migration ─────────────────

    #[test]
    fn fk_enforced_after_migration() {
        let td = TestDb::new();
        let path = td.path.to_str().unwrap();

        {
            let conn = Connection::open(path).unwrap();
            conn.execute_batch("PRAGMA user_version=8;").unwrap();
        }

        let conn = init_database(path).unwrap();
        let result = conn.execute(
            "INSERT INTO products (name, sku, cost_price, sale_price, category_id) VALUES ('test', 'FK-MIG-1', 1.0, 2.0, 99999)",
            [],
        );
        assert!(result.is_err(), "FK enforcement should work after migration");
    }

    #[test]
    fn fk_check_finds_no_violations_after_init() {
        let td = TestDb::new();
        let conn = td.conn();
        let violations: Vec<(String, i64, String, i64)> = conn
            .prepare("PRAGMA foreign_key_check")
            .unwrap()
            .query_map([], |row| {
                Ok((
                    row.get::<_, String>(0)?,
                    row.get::<_, i64>(1)?,
                    row.get::<_, String>(2)?,
                    row.get::<_, i64>(3)?,
                ))
            })
            .unwrap()
            .filter_map(|r| r.ok())
            .collect();
        assert!(
            violations.is_empty(),
            "Should have no FK violations after init, found: {violations:?}"
        );
    }

    #[test]
    fn fk_check_finds_no_violations_after_migration() {
        let td = TestDb::new();
        let path = td.path.to_str().unwrap();

        {
            let conn = Connection::open(path).unwrap();
            conn.execute_batch("PRAGMA user_version=7;").unwrap();
        }

        let conn = init_database(path).unwrap();
        let violations: Vec<String> = conn
            .prepare("PRAGMA foreign_key_check")
            .unwrap()
            .query_map([], |row| row.get::<_, String>(0))
            .unwrap()
            .filter_map(|r| r.ok())
            .collect();
        assert!(
            violations.is_empty(),
            "Should have no FK violations after migration, found: {violations:?}"
        );
    }
}
