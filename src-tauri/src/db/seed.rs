use rusqlite::{Connection, Result};
use bcrypt::{hash, DEFAULT_COST};

const DEFAULT_PERMISSIONS: &[(&str, &str, &str, &str)] = &[
    ("dashboard.view", "Ver Dashboard", "dashboard", "Access the dashboard"),
    ("inventory.view", "Ver Inventario", "inventory", "View inventory"),
    ("inventory.create", "Crear Producto", "inventory", "Create products"),
    ("inventory.update", "Actualizar Producto", "inventory", "Update products"),
    ("inventory.delete", "Eliminar Producto", "inventory", "Delete products"),
    ("sales.view", "Ver Ventas", "sales", "View sales"),
    ("sales.create", "Crear Venta", "sales", "Create sales"),
    ("sales.refund", "Reembolsar Venta", "sales", "Refund sales"),
    ("sales.quotes", "Gestionar Cotizaciones", "sales", "Manage quotes"),
    ("sales.register", "Gestionar Caja", "sales", "Manage cash register"),
    ("sales.closeout", "Cerrar Turno", "sales", "Close daily shift"),
    ("sales.receipts", "Ver Recibos", "sales", "View receipts"),
    ("purchases.view", "Ver Compras", "purchases", "View purchases"),
    ("purchases.create", "Crear Compra", "purchases", "Create purchase orders"),
    ("customers.view", "Ver Clientes", "customers", "View customers"),
    ("customers.create", "Crear Cliente", "customers", "Create customers"),
    ("customers.update", "Actualizar Cliente", "customers", "Update customers"),
    ("customers.delete", "Eliminar Cliente", "customers", "Delete customers"),
    ("suppliers.view", "Ver Proveedores", "suppliers", "View suppliers"),
    ("suppliers.create", "Crear Proveedor", "suppliers", "Create suppliers"),
    ("reports.view", "Ver Reportes", "reports", "View reports"),
    ("employees.manage", "Gestionar Empleados", "employees", "Manage employees"),
    ("settings.manage", "Gestionar Configuración", "settings", "Manage settings"),
    ("settings.view", "Ver Configuración", "settings", "View settings"),
    ("warehouse.view", "Ver Almacén", "warehouse", "View warehouse"),
    ("vehicles.view", "Ver Vehículos", "vehicles", "View vehicles"),
    ("auth.manage", "Gestionar Usuarios", "auth", "Manage users and roles"),
    ("inventory.categories.manage", "Gestionar Categorías", "inventory", "Manage categories"),
    ("inventory.brands.manage", "Gestionar Marcas", "inventory", "Manage brands"),
    ("inventory.manufacturers.manage", "Gestionar Fabricantes", "inventory", "Manage manufacturers"),
    ("inventory.suppliers.manage", "Gestionar Proveedores", "inventory", "Manage suppliers"),
    ("inventory.warehouses.manage", "Gestionar Almacenes", "inventory", "Manage warehouses"),
    ("inventory.storage.manage", "Gestionar Ubicaciones", "inventory", "Manage storage locations"),
];

const ROLES: &[(&str, &str, bool, &[&str])] = &[
    ("owner", "Propietario", true, &[
        "dashboard.view",
        "inventory.view", "inventory.create", "inventory.update", "inventory.delete",
        "inventory.categories.manage", "inventory.brands.manage", "inventory.manufacturers.manage",
        "inventory.suppliers.manage", "inventory.warehouses.manage", "inventory.storage.manage",
        "sales.view", "sales.create", "sales.refund", "sales.quotes", "sales.register", "sales.closeout", "sales.receipts",
        "purchases.view", "purchases.create",
        "customers.view", "customers.create", "customers.update", "customers.delete",
        "suppliers.view", "suppliers.create",
        "reports.view",
        "employees.manage",
        "settings.manage", "settings.view",
        "warehouse.view",
        "vehicles.view",
        "auth.manage",
    ]),
    ("administrator", "Administrador", true, &[
        "dashboard.view",
        "inventory.view", "inventory.create", "inventory.update", "inventory.delete",
        "inventory.categories.manage", "inventory.brands.manage", "inventory.manufacturers.manage",
        "inventory.suppliers.manage", "inventory.warehouses.manage", "inventory.storage.manage",
        "sales.view", "sales.create", "sales.refund", "sales.quotes", "sales.register", "sales.closeout", "sales.receipts",
        "purchases.view", "purchases.create",
        "customers.view", "customers.create", "customers.update", "customers.delete",
        "suppliers.view", "suppliers.create",
        "reports.view",
        "employees.manage",
        "settings.manage", "settings.view",
        "warehouse.view",
        "vehicles.view",
    ]),
    ("cashier", "Cajero", true, &[
        "dashboard.view",
        "inventory.view",
        "sales.view", "sales.create", "sales.quotes", "sales.register", "sales.receipts",
        "customers.view", "customers.create",
    ]),
    ("warehouse", "Almacén", true, &[
        "dashboard.view",
        "inventory.view", "inventory.create", "inventory.update",
        "purchases.view",
        "warehouse.view",
    ]),
    ("purchasing", "Compras", true, &[
        "dashboard.view",
        "inventory.view", "inventory.create",
        "purchases.view", "purchases.create",
        "suppliers.view", "suppliers.create",
    ]),
    ("viewer", "Espectador", true, &[
        "dashboard.view",
        "inventory.view",
        "sales.view",
        "purchases.view",
        "customers.view",
        "suppliers.view",
        "reports.view",
        "warehouse.view",
        "vehicles.view",
        "settings.view",
    ]),
];

const DEFAULT_USERS: &[(&str, &str, &str, &str)] = &[
    ("owner", "owner@inventorygear.com", "Propietario", "owner"),
    ("admin", "admin@inventorygear.com", "Administrador", "administrator"),
    ("cashier", "cashier@inventorygear.com", "Cajero", "cashier"),
    ("warehouse", "warehouse@inventorygear.com", "Almacenero", "warehouse"),
    ("purchasing", "purchasing@inventorygear.com", "Comprador", "purchasing"),
    ("viewer", "viewer@inventorygear.com", "Espectador", "viewer"),
];

const DEFAULT_SETTINGS: &[(&str, &str, &str, &str, &str)] = &[
    ("store_name", "Inventory Gear", "general", "string", "Store name"),
    ("store_logo", "", "general", "string", "Store logo URL"),
    ("currency", "USD", "general", "string", "Default currency"),
    ("timezone", "America/Mexico_City", "general", "string", "Timezone"),
    ("tax_rate", "16", "general", "number", "Default tax rate percentage"),
    ("receipt_footer", "¡Gracias por su compra!", "printing", "string", "Receipt footer text"),
    ("auto_backup", "true", "backup", "boolean", "Enable auto backup"),
    ("backup_interval", "24", "backup", "number", "Backup interval in hours"),
    ("low_stock_threshold", "10", "inventory", "number", "Low stock alert threshold"),
    ("language", "es", "localization", "string", "Default language"),
    ("theme", "system", "appearance", "string", "Default theme"),
    ("app_version", "0.1.0", "system", "string", "Application version"),
];

const SEED_CATEGORIES: &[(&str, &str, i32, Option<&str>)] = &[
    ("Engine", "Engine parts and components", 1, None),
    ("Brakes", "Braking system parts", 2, None),
    ("Electrical", "Electrical system components", 3, None),
    ("Suspension", "Suspension and steering parts", 4, None),
    ("Cooling", "Cooling system parts", 5, None),
    ("Filters", "Oil, air, fuel filters", 6, None),
    ("Lubricants", "Oils and lubricants", 7, None),
    ("Accessories", "Vehicle accessories", 8, None),
    ("Transmission", "Transmission and clutch parts", 9, None),
    ("Exhaust", "Exhaust system parts", 10, None),
];

const SEED_BRANDS: &[(&str, &str, &str, &str)] = &[
    ("Bosch", "German engineering and electronics", "Germany", "https://www.bosch.com"),
    ("NGK", "Leading spark plug manufacturer", "Japan", "https://www.ngk.com"),
    ("SKF", "Bearings and seals specialist", "Sweden", "https://www.skf.com"),
    ("Valeo", "French automotive supplier", "France", "https://www.valeo.com"),
    ("Denso", "Japanese automotive components", "Japan", "https://www.denso.com"),
    ("ACDelco", "GM original equipment parts", "USA", "https://www.acdelco.com"),
    ("Mann-Filter", "German filtration specialist", "Germany", "https://www.mann-filter.com"),
    ("Continental", "German automotive parts", "Germany", "https://www.continental.com"),
];

const SEED_MANUFACTURERS: &[(&str, &str, &str, &str, &str)] = &[
    ("Bosch GmbH", "Germany", "+49 711 8110", "info@bosch.com", "https://www.bosch.com"),
    ("NGK Spark Plug Co.", "Japan", "+81 52 872 8211", "info@ngk.co.jp", "https://www.ngk.com"),
    ("Denso Corporation", "Japan", "+81 566 25 5511", "info@denso.com", "https://www.denso.com"),
    ("Valeo SA", "France", "+33 1 40 55 20 20", "contact@valeo.com", "https://www.valeo.com"),
    ("SKF Group", "Sweden", "+46 31 337 1000", "info@skf.com", "https://www.skf.com"),
    ("Mann+Hummel GmbH", "Germany", "+49 7141 98 0", "info@mann-hummel.com", "https://www.mann-filter.com"),
];

const SEED_SUPPLIERS: &[(&str, &str, &str, &str, &str, &str, &str, &str, &str)] = &[
    ("AutoParts Express", "Carlos Mendoza", "+52 55 1234 5678", "+52 55 9876 5432", "carlos@autopartsexpress.com", "www.autopartsexpress.com", "AUT-123456", "Av. Reforma 123, Col. Centro", "Ciudad de México"),
    ("Importadora de Partes", "María García", "+52 33 2345 6789", "+52 33 8765 4321", "maria@importadorapartes.com", "www.importadorapartes.com", "IMP-234567", "Calle Independencia 456", "Guadalajara"),
    ("Distribuidora Automotriz", "Juan López", "+52 81 3456 7890", "+52 81 7654 3210", "juan@distautomotriz.com", "www.distautomotriz.com", "DIS-345678", "Av. Constitución 789", "Monterrey"),
    ("Suministros del Motor", "Ana Martínez", "+52 55 4567 8901", "+52 55 6543 2109", "ana@suministrosmotor.com", "www.suministrosmotor.com", "SUM-456789", "Calle Industria 321", "Ciudad de México"),
];

const SEED_WAREHOUSES: &[(&str, &str, &str, &str, &str)] = &[
    ("Almacén Principal", "WH-001", "Av. Principal 1000, Col. Industrial", "Ciudad de México", "CDMX"),
    ("Almacén Secundario", "WH-002", "Calle Secundaria 500, Col. La Villa", "Ciudad de México", "CDMX"),
    ("Almacén Norte", "WH-003", "Av. Norte 200, Col. San Juan", "Monterrey", "Nuevo León"),
];

const SEED_STORAGE_LOCATIONS: &[(&str, &str, &str, &str, &str, i32)] = &[
    ("A", "1", "A", "01", "WH-001-A-1-A-01", 1),
    ("A", "1", "B", "01", "WH-001-A-1-B-01", 1),
    ("A", "2", "A", "01", "WH-001-A-2-A-01", 1),
    ("B", "1", "A", "01", "WH-001-B-1-A-01", 1),
    ("A", "1", "A", "01", "WH-002-A-1-A-01", 2),
    ("A", "1", "B", "01", "WH-002-A-1-B-01", 2),
    ("A", "1", "A", "01", "WH-003-A-1-A-01", 3),
];

const SEED_PRODUCTS: &[(&str, &str, &str, f64, f64, i32, i32, i32, &str, i32, i32, i32)] = &[
    ("Oil Filter - Bosch P3100", "OIL-BOSCH-001", "Filtro de aceite Bosch", 3.50, 8.50, 150, 10, 200, "pcs", 6, 1, 1),
    ("Air Filter - Mann C 25 008", "AIR-MANN-001", "Filtro de aire Mann", 5.00, 12.00, 80, 5, 100, "pcs", 6, 7, 1),
    ("Brake Pads Ceramic - Bosch", "BRK-BOSCH-001", "Pastillas de freno cerámicas Bosch", 15.00, 35.00, 60, 5, 100, "set", 2, 1, 1),
    ("Spark Plug Iridium - NGK", "SPK-NGK-001", "Bujía de iridio NGK", 4.00, 12.00, 200, 20, 300, "pcs", 3, 2, 1),
    ("Alternator 120A - Bosch", "ALT-BOSCH-001", "Alternador 120 amperios Bosch", 80.00, 180.00, 15, 3, 30, "pcs", 3, 1, 1),
    ("Battery 60Ah - Bosch", "BAT-BOSCH-001", "Batería 60Ah Bosch", 55.00, 120.00, 30, 5, 50, "pcs", 3, 1, 1),
    ("Radiator Aluminum - Valeo", "RAD-VALEO-001", "Radiador de aluminio Valeo", 45.00, 95.00, 20, 3, 40, "pcs", 5, 3, 1),
    ("Fuel Pump Electric - Denso", "FLP-DENSO-001", "Bomba de gasolina eléctrica Denso", 35.00, 85.00, 25, 3, 50, "pcs", 3, 5, 1),
    ("Water Pump - SKF", "WAP-SKF-001", "Bomba de agua SKF", 25.00, 55.00, 30, 5, 60, "pcs", 5, 3, 1),
    ("Timing Belt Kit - Continental", "TBK-CONT-001", "Kit de banda de tiempo Continental", 30.00, 75.00, 15, 3, 30, "kit", 9, 8, 1),
    ("Ball Joint - SKF", "BLJ-SKF-001", "Rótula de suspensión SKF", 8.00, 22.00, 40, 5, 80, "pcs", 4, 3, 1),
    ("Shock Absorber - Monroe", "SHK-MONROE-001", "Amortiguador Monroe", 25.00, 60.00, 20, 3, 40, "pcs", 4, 1, 1),
    ("Oxygen Sensor - Bosch", "O2S-BOSCH-001", "Sensor de oxígeno Bosch", 18.00, 45.00, 10, 2, 25, "pcs", 3, 1, 1),
    ("Starter Motor - Denso", "STR-DENSO-001", "Motor de arranque Denso", 60.00, 140.00, 10, 2, 20, "pcs", 3, 5, 1),
    ("Engine Oil 5W30 Synthetic", "OIL-MOBIL-001", "Aceite de motor sintético 5W30", 8.00, 22.00, 100, 10, 150, "ltr", 7, 1, 1),
];

pub fn seed_database(conn: &Connection) -> Result<()> {
    let existing_users: i64 = conn.query_row(
        "SELECT COUNT(*) FROM users", [], |row| row.get(0)
    )?;

    if existing_users > 0 {
        return Ok(());
    }

    seed_permissions(conn)?;
    seed_roles(conn)?;
    seed_users(conn)?;
    seed_settings(conn)?;
    seed_categories(conn)?;
    seed_brands(conn)?;
    seed_manufacturers(conn)?;
    seed_suppliers(conn)?;
    seed_warehouses(conn)?;
    seed_storage_locations(conn)?;
    seed_products(conn)?;

    Ok(())
}

fn seed_permissions(conn: &Connection) -> Result<()> {
    for (key, name, group, description) in DEFAULT_PERMISSIONS {
        conn.execute(
            "INSERT OR IGNORE INTO permissions (key, name, group_name, description) VALUES (?1, ?2, ?3, ?4)",
            rusqlite::params![key, name, group, description],
        )?;
    }
    Ok(())
}

fn seed_roles(conn: &Connection) -> Result<()> {
    for (role_name, description, is_system, permissions) in ROLES {
        conn.execute(
            "INSERT OR IGNORE INTO roles (name, description, is_system) VALUES (?1, ?2, ?3)",
            rusqlite::params![role_name, description, if *is_system { 1 } else { 0 }],
        )?;

        let role_id: i64 = conn.query_row(
            "SELECT id FROM roles WHERE name = ?1",
            rusqlite::params![role_name],
            |row| row.get(0),
        )?;

        for perm_key in permissions.iter().copied() {
            if let Ok(perm_id) = conn.query_row::<i64, _, _>(
                "SELECT id FROM permissions WHERE key = ?1",
                rusqlite::params![perm_key],
                |row| row.get(0),
            ) {
                conn.execute(
                    "INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (?1, ?2)",
                    rusqlite::params![role_id, perm_id],
                )?;
            }
        }
    }
    Ok(())
}

fn seed_users(conn: &Connection) -> Result<()> {
    let default_password = hash("123456", DEFAULT_COST).expect("Failed to hash password");

    for (username, email, full_name, role_name) in DEFAULT_USERS {
        let role_id: Option<i64> = conn.query_row(
            "SELECT id FROM roles WHERE name = ?1",
            rusqlite::params![role_name],
            |row| row.get(0),
        ).ok();

        conn.execute(
            "INSERT OR IGNORE INTO users (username, email, password_hash, full_name, role_id) VALUES (?1, ?2, ?3, ?4, ?5)",
            rusqlite::params![username, email, default_password, full_name, role_id],
        )?;
    }
    Ok(())
}

fn seed_settings(conn: &Connection) -> Result<()> {
    for (key, value, group, setting_type, description) in DEFAULT_SETTINGS {
        conn.execute(
            "INSERT OR IGNORE INTO settings (key, value, group_name, setting_type, description) VALUES (?1, ?2, ?3, ?4, ?5)",
            rusqlite::params![key, value, group, setting_type, description],
        )?;
    }
    Ok(())
}

fn seed_categories(conn: &Connection) -> Result<()> {
    for (name, description, sort_order, _parent) in SEED_CATEGORIES {
        conn.execute(
            "INSERT OR IGNORE INTO categories (name, description, sort_order) VALUES (?1, ?2, ?3)",
            rusqlite::params![name, description, sort_order],
        )?;
    }
    Ok(())
}

fn seed_brands(conn: &Connection) -> Result<()> {
    for (name, description, country, website) in SEED_BRANDS {
        conn.execute(
            "INSERT OR IGNORE INTO brands (name, description, country, website) VALUES (?1, ?2, ?3, ?4)",
            rusqlite::params![name, description, country, website],
        )?;
    }
    Ok(())
}

fn seed_manufacturers(conn: &Connection) -> Result<()> {
    for (name, country, phone, email, website) in SEED_MANUFACTURERS {
        conn.execute(
            "INSERT OR IGNORE INTO manufacturers (name, country, phone, email, website) VALUES (?1, ?2, ?3, ?4, ?5)",
            rusqlite::params![name, country, phone, email, website],
        )?;
    }
    Ok(())
}

fn seed_suppliers(conn: &Connection) -> Result<()> {
    for (company_name, contact_person, phone, mobile, email, website, tax_number, address, city) in SEED_SUPPLIERS {
        conn.execute(
            "INSERT OR IGNORE INTO suppliers (company_name, contact_person, phone, mobile, email, website, tax_number, address, city) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            rusqlite::params![company_name, contact_person, phone, mobile, email, website, tax_number, address, city],
        )?;
    }
    Ok(())
}

fn seed_warehouses(conn: &Connection) -> Result<()> {
    for (name, code, address, city, state) in SEED_WAREHOUSES {
        conn.execute(
            "INSERT OR IGNORE INTO warehouses (name, code, address, city, state) VALUES (?1, ?2, ?3, ?4, ?5)",
            rusqlite::params![name, code, address, city, state],
        )?;
    }
    Ok(())
}

fn seed_storage_locations(conn: &Connection) -> Result<()> {
    for (zone, aisle, shelf, bin, code, warehouse_idx) in SEED_STORAGE_LOCATIONS {
        if let Ok(warehouse_id) = conn.query_row::<i64, _, _>(
            "SELECT id FROM warehouses WHERE code = ?1",
            rusqlite::params![format!("WH-{:03}", warehouse_idx)],
            |row| row.get(0),
        ) {
            conn.execute(
                "INSERT OR IGNORE INTO storage_locations (warehouse_id, zone, aisle, shelf, bin, code) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
                rusqlite::params![warehouse_id, zone, aisle, shelf, bin, code],
            )?;
        }
    }
    Ok(())
}

fn seed_products(conn: &Connection) -> Result<()> {
    let default_category = |idx: i32| -> Option<i64> {
        conn.query_row("SELECT id FROM categories WHERE sort_order = ?1", rusqlite::params![idx], |row| row.get(0)).ok()
    };
    let default_supplier = |idx: i32| -> Option<i64> {
        conn.query_row("SELECT id FROM suppliers WHERE id = ?1", rusqlite::params![idx], |row| row.get(0)).ok()
    };
    let default_brand = |idx: i32| -> Option<i64> {
        conn.query_row("SELECT id FROM brands WHERE id = ?1", rusqlite::params![idx], |row| row.get(0)).ok()
    };

    for (name, sku, description, cost_price, sale_price, stock_qty, min_stock, max_stock, unit, cat_idx, brand_idx, supplier_idx) in SEED_PRODUCTS {
        let category_id = default_category(*cat_idx);
        let brand_id = default_brand(*brand_idx);
        let supplier_id = default_supplier(*supplier_idx);

        conn.execute(
            "INSERT OR IGNORE INTO products (name, sku, description, cost_price, sale_price, stock_quantity, min_stock_level, max_stock_level, unit, category_id, brand_id, supplier_id, warehouse_id) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, 1)",
            rusqlite::params![name, sku, description, cost_price, sale_price, stock_qty, min_stock, max_stock, unit, category_id, brand_id, supplier_id],
        )?;
    }
    Ok(())
}
