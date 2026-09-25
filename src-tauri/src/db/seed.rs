use rusqlite::{Connection, Result};
use bcrypt::{hash, DEFAULT_COST};

const DEFAULT_PERMISSIONS: &[(&str, &str, &str, &str)] = &[
    ("dashboard.view", "Ver Dashboard", "dashboard", "Access the dashboard"),
    ("inventory.view", "Ver Inventario", "inventory", "View inventory"),
    ("inventory.create", "Crear Producto", "inventory", "Create products"),
    ("inventory.update", "Actualizar Producto", "inventory", "Update products"),
    ("inventory.delete", "Eliminar Producto", "inventory", "Delete products"),
    ("inventory.export", "Exportar Inventario", "inventory", "Export products and inventory to Excel"),
    ("inventory.import", "Importar Inventario", "inventory", "Import products and inventory from Excel"),
    ("sales.view", "Ver Ventas", "sales", "View sales"),
    ("sales.create", "Crear Venta", "sales", "Create sales"),
    ("sales.refund", "Reembolsar Venta", "sales", "Refund sales"),
    ("sales.quotes", "Gestionar Cotizaciones", "sales", "Manage quotes"),
    ("sales.register", "Gestionar Caja", "sales", "Manage cash register"),
    ("sales.closeout", "Cerrar Turno", "sales", "Close daily shift"),
    ("sales.receipts", "Ver Recibos", "sales", "View receipts"),
    ("purchases.view", "Ver Compras", "purchases", "View purchases"),
    ("purchases.create", "Crear Compra", "purchases", "Create purchase orders"),
    ("purchases.update", "Actualizar Compra", "purchases", "Update purchase orders"),
    ("purchases.delete", "Eliminar Compra", "purchases", "Delete purchase orders"),
    ("purchases.approve", "Aprobar Compra", "purchases", "Approve purchase orders"),
    ("purchases.receive", "Recibir Compra", "purchases", "Receive purchase orders"),
    ("purchases.returns", "Devolver Compra", "purchases", "Handle purchase returns"),
    ("purchases.requests", "Solicitudes de Compra", "purchases", "Manage purchase requests"),
    ("purchases.supplier_products", "Catálogo de Proveedores", "purchases", "Manage supplier product catalog"),
    ("purchases.cost_history", "Historial de Costos", "purchases", "View cost history"),
    ("customers.credit", "Gestionar Crédito", "customers", "Manage customer credit accounts"),
    ("customers.communication", "Registro de Comunicación", "customers", "Manage customer communication log"),
    ("customers.view", "Ver Clientes", "customers", "View customers"),
    ("customers.create", "Crear Cliente", "customers", "Create customers"),
    ("customers.update", "Actualizar Cliente", "customers", "Update customers"),
    ("customers.delete", "Eliminar Cliente", "customers", "Delete customers"),
    ("suppliers.view", "Ver Proveedores", "suppliers", "View suppliers"),
    ("suppliers.create", "Crear Proveedor", "suppliers", "Create suppliers"),
    ("reports.view", "Ver Reportes", "reports", "View reports"),
    ("employees.manage", "Gestionar Empleados", "employees", "Manage employees"),
    ("settings.manage", "Gestionar Configuración", "settings", "Manage settings"),
    ("reports.export", "Exportar Reportes", "reports", "Export reports"),
    ("reports.sales.view", "Ver Reportes de Ventas", "reports", "View sales reports"),
    ("reports.inventory.view", "Ver Reportes de Inventario", "reports", "View inventory reports"),
    ("reports.purchases.view", "Ver Reportes de Compras", "reports", "View purchasing reports"),
    ("reports.customers.view", "Ver Reportes de Clientes", "reports", "View customer reports"),
    ("reports.suppliers.view", "Ver Reportes de Proveedores", "reports", "View supplier reports"),
    ("reports.profitability.view", "Ver Rentabilidad", "reports", "View profitability reports"),
    ("reports.create", "Crear Reportes Personalizados", "reports", "Create custom reports"),
    ("reports.schedule", "Programar Reportes", "reports", "Schedule reports"),
    ("reports.manage_templates", "Gestionar Plantillas", "reports", "Manage report templates"),
    ("settings.view", "Ver Configuración", "settings", "View settings"),
    ("warehouse.view", "Ver Almacén", "warehouse", "View warehouse"),
    ("vehicles.view", "Ver Vehículos", "vehicles", "View vehicles"),
    ("vehicles.create", "Crear Vehículo", "vehicles", "Create vehicles"),
    ("vehicles.update", "Actualizar Vehículo", "vehicles", "Update vehicles"),
    ("vehicles.delete", "Eliminar Vehículo", "vehicles", "Delete vehicles"),
    ("reminders.view", "Ver Recordatorios", "reminders", "View service reminders"),
    ("reminders.manage", "Gestionar Recordatorios", "reminders", "Manage service reminders"),
    ("warranty.view", "Ver Garantías", "warranty", "View warranties"),
    ("warranty.manage", "Gestionar Garantías", "warranty", "Manage warranties"),
    ("customers.notes", "Notas de Cliente", "customers", "Manage customer notes"),
    ("auth.manage", "Gestionar Usuarios", "auth", "Manage users and roles"),
    ("admin.users.manage", "Gestionar Usuarios", "admin", "Create, edit, disable users"),
    ("admin.roles.manage", "Gestionar Roles", "admin", "Create, edit, clone roles"),
    ("admin.permissions.manage", "Gestionar Permisos", "admin", "Manage permission assignments"),
    ("admin.settings.manage", "Gestionar Configuración", "admin", "Manage application settings"),
    ("admin.backups.manage", "Gestionar Respaldos", "admin", "Create and manage backups"),
    ("admin.restore", "Restaurar Sistema", "admin", "Restore from backups"),
    ("admin.database.manage", "Gestionar Base de Datos", "admin", "Database maintenance operations"),
    ("admin.printers.manage", "Gestionar Impresoras", "admin", "Manage printer settings"),
    ("admin.audit.view", "Ver Auditoría", "admin", "View audit logs"),
    ("admin.maintenance.manage", "Mantenimiento", "admin", "Run maintenance operations"),
    ("admin.updates.manage", "Gestionar Actualizaciones", "admin", "Manage system updates"),
    ("admin.license.manage", "Gestionar Licencia", "admin", "Manage license information"),
    ("admin.diagnostics.view", "Ver Diagnósticos", "admin", "View diagnostics"),
    ("admin.devices.manage", "Gestionar Dispositivos", "admin", "Manage connected devices"),
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
        "inventory.export", "inventory.import",
        "inventory.categories.manage", "inventory.brands.manage", "inventory.manufacturers.manage",
        "inventory.suppliers.manage", "inventory.warehouses.manage", "inventory.storage.manage",
        "sales.view", "sales.create", "sales.refund", "sales.quotes", "sales.register", "sales.closeout", "sales.receipts",
        "purchases.view", "purchases.create", "purchases.update", "purchases.delete",
        "purchases.approve", "purchases.receive", "purchases.returns", "purchases.requests",
        "purchases.supplier_products", "purchases.cost_history",
        "customers.view", "customers.create", "customers.update", "customers.delete",
        "customers.credit", "customers.communication",
        "customers.notes",
        "suppliers.view", "suppliers.create",
        "reports.view",
        "employees.manage",
        "settings.manage", "settings.view",
        "warehouse.view",
        "vehicles.view", "vehicles.create", "vehicles.update", "vehicles.delete",
        "reminders.view", "reminders.manage",
        "warranty.view", "warranty.manage",
        "auth.manage",
        "admin.users.manage", "admin.roles.manage", "admin.permissions.manage",
        "admin.settings.manage", "admin.backups.manage", "admin.restore",
        "admin.database.manage", "admin.printers.manage", "admin.audit.view",
        "admin.maintenance.manage", "admin.updates.manage", "admin.license.manage",
        "admin.diagnostics.view", "admin.devices.manage",
    ]),
    ("administrator", "Administrador", true, &[
        "dashboard.view",
        "inventory.view", "inventory.create", "inventory.update", "inventory.delete",
        "inventory.export", "inventory.import",
        "inventory.categories.manage", "inventory.brands.manage", "inventory.manufacturers.manage",
        "inventory.suppliers.manage", "inventory.warehouses.manage", "inventory.storage.manage",
        "sales.view", "sales.create", "sales.refund", "sales.quotes", "sales.register", "sales.closeout", "sales.receipts",
        "purchases.view", "purchases.create", "purchases.update", "purchases.delete",
        "purchases.approve", "purchases.receive", "purchases.returns", "purchases.requests",
        "purchases.supplier_products", "purchases.cost_history",
        "customers.view", "customers.create", "customers.update", "customers.delete",
        "customers.credit", "customers.communication",
        "customers.notes",
        "suppliers.view", "suppliers.create",
        "reports.view", "reports.export", "reports.sales.view", "reports.inventory.view",
        "reports.purchases.view", "reports.customers.view", "reports.suppliers.view",
        "reports.profitability.view", "reports.create", "reports.schedule", "reports.manage_templates",
        "employees.manage",
        "settings.manage", "settings.view",
        "warehouse.view",
        "vehicles.view", "vehicles.create", "vehicles.update", "vehicles.delete",
        "reminders.view", "reminders.manage",
        "warranty.view", "warranty.manage",
        "admin.users.manage", "admin.roles.manage", "admin.permissions.manage",
        "admin.settings.manage", "admin.backups.manage", "admin.restore",
        "admin.database.manage", "admin.printers.manage", "admin.audit.view",
        "admin.maintenance.manage", "admin.updates.manage", "admin.license.manage",
        "admin.diagnostics.view", "admin.devices.manage",
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
        "inventory.export", "inventory.import",
        "purchases.view", "purchases.receive",
        "warehouse.view",
    ]),
    ("purchasing", "Compras", true, &[
        "dashboard.view",
        "inventory.view", "inventory.create", "inventory.export",
        "purchases.view", "purchases.create", "purchases.update",
        "purchases.approve", "purchases.receive", "purchases.returns", "purchases.requests",
        "purchases.supplier_products", "purchases.cost_history",
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
    ("Dirección", "Terminales, cremalleras, muñones y brazos", 1, None),
    ("Suspensión", "Rótulas, barras estabilizadoras y muñones", 2, None),
];

const SEED_BRANDS: &[(&str, &str, &str, &str)] = &[
    ("Toyota Genuine", "Marca Toyota Genuine - Japón", "Japón", "https://www.toyota.com"),
    ("TRW", "Marca TRW - EEUU", "EEUU", "https://www.zf.com"),
];

const SEED_MANUFACTURERS: &[(&str, &str, &str, &str, &str)] = &[
    ("Toyota Motor Corp.", "Japón", "+81 3 3817 7111", "info@toyota.com", "https://www.toyota.com"),
    ("ZF Group (TRW)", "EEUU", "+1 734 855 2000", "info@zf.com", "https://www.zf.com"),
];

const SEED_SUPPLIERS: &[(&str, &str, &str, &str, &str, &str, &str, &str, &str)] = &[
    ("Autorepuestos Demo SRL", "María Condori", "+591 4 4455667", "", "demo@autorepuestos.bo", "", "10203040", "Av. Ayacucho #1234", "Cochabamba"),
];

const SEED_WAREHOUSES: &[(&str, &str, &str, &str, &str)] = &[
    ("Almacén Principal", "WH-001", "Zona Industrial, Calle WH-001", "Cochabamba", "Bolivia"),
    ("Almacén Norte", "WH-002", "Calle Secundaria 500", "Cochabamba", "Bolivia"),
    ("Almacén Sur", "WH-003", "Av. Sur 200", "Santa Cruz", "Bolivia"),
];

const SEED_STORAGE_LOCATIONS: &[(&str, &str, &str, &str, &str, i32)] = &[
    ("A", "01", "A", "01", "WH-001-A-01-A-01", 1),
    ("A", "01", "B", "01", "WH-001-A-01-B-01", 1),
    ("A", "02", "A", "01", "WH-001-A-02-A-01", 1),
    ("A", "02", "B", "01", "WH-001-A-02-B-01", 1),
    ("B", "01", "A", "01", "WH-001-B-01-A-01", 1),
    ("B", "01", "B", "01", "WH-001-B-01-B-01", 1),
    ("B", "02", "A", "01", "WH-001-B-02-A-01", 1),
    ("B", "02", "B", "01", "WH-001-B-02-B-01", 1),
    ("C", "01", "A", "01", "WH-001-C-01-A-01", 1),
    ("C", "01", "B", "01", "WH-001-C-01-B-01", 1),
    ("C", "02", "A", "01", "WH-001-C-02-A-01", 1),
    ("C", "02", "B", "01", "WH-001-C-02-B-01", 1),
    ("A", "01", "A", "01", "WH-002-A-01-A-01", 2),
    ("A", "01", "B", "01", "WH-002-A-01-B-01", 2),
    ("A", "01", "A", "01", "WH-003-A-01-A-01", 3),
];

// Demo catalog — mirrors scripts/database/seed-demo-catalog.mjs:
// (code, alt, name, price, category, brand, qty)
//   sku          = alt || code
//   oem_number   = code
//   internal_code= code
//   sale_price   = price
//   cost_price   ≈ round2(price * 0.70)
//   stock        = qty
const SEED_PRODUCTS: &[(&str, Option<&str>, &str, f64, &str, &str, i32)] = &[
    ("860067", None, "MUÑON DIREC. TOY COROLLA/IPSU 84/95", 35.0, "Dirección", "Toyota Genuine", 4),
    ("860068", Some("124846"), "TERMINAL DE DIRECCION IPSU/CALDINA L", 77.0, "Dirección", "Toyota Genuine", 4),
    ("860069", Some("124847"), "TERMINAL DE DIRECCION IPSU/CALDINA R", 77.0, "Dirección", "Toyota Genuine", 4),
    ("860090", None, "MUÑON DIR. TOY. HIACE 2002 14X15", 68.0, "Dirección", "Toyota Genuine", 4),
    ("860030", Some("RACK-H-Y"), "BRAZO DE CREMALLERA HIDRAULICO TOY. 16X14 (16X14X1.5)", 45.0, "Dirección", "TRW", 4),
    ("860029", Some("RACK-L-Y"), "BRAZO DE CREMALLERA MECANICA 14X14", 45.0, "Dirección", "TRW", 4),
    ("860093", None, "BRAZO/PRECAP DIR. TOY. COROLLA/CALDINA/HIACE 14X15", 58.0, "Dirección", "Toyota Genuine", 4),
    ("860039", Some("124192"), "ROTULA/MUÑON SUSP. TOY. COROLLA 92/PSU", 53.0, "Suspensión", "Toyota Genuine", 4),
    ("860153", Some("43330-29075"), "MUÑON/ROTULA INF. DE KING LONG 2016-2020", 110.0, "Suspensión", "TRW", 4),
    ("860154", Some("43350-29095"), "MUÑON/ROTULA SUP KING LONG 2016-2020", 114.0, "Suspensión", "TRW", 4),
    ("860144", Some("HQ-T26204"), "TERMINAL/MUÑON DIR. KING LONG 99/2004 14X15 MM", 57.0, "Dirección", "TRW", 4),
    ("860056", Some("YOI-241"), "ROTULA/MUÑON INF. NOAH PATENTADO", 89.0, "Suspensión", "Toyota Genuine", 4),
    ("860057", Some("YOI-240"), "ROTULA/MUÑON SUP. NOAH SIN GRASERA BLINDADO", 71.0, "Suspensión", "Toyota Genuine", 4),
    ("860026", Some("YOI-237"), "BARRA ESTABILIZADORA NOAH TRAS. 99 MUÑON/PERNO", 60.0, "Suspensión", "Toyota Genuine", 4),
    ("120714", Some("YOI-192"), "BARRA ESTAB. NOAH DEL 96", 46.0, "Suspensión", "Toyota Genuine", 4),
    ("850027", None, "JUNTA COROLLA DIESEL/IPSUCALDINA ABS 26X24 (26X56X24)", 172.0, "Dirección", "Toyota Genuine", 4),
    ("850020", Some("TO-1-1010A"), "JUNTA GASOLINA ABS COROLLA 26X23 (26X56X23)", 162.0, "Dirección", "Toyota Genuine", 4),
    ("850136", Some("RF4950021"), "CAPUCHON TRICETA TOY. NOAH/VOXY 2000 YARIS/CALDINA/RAV4", 40.0, "Dirección", "Toyota Genuine", 4),
    ("850000", Some("850070"), "CAPUCHON JUNTA C/PRECINTO MET.", 28.0, "Dirección", "Toyota Genuine", 4),
];

/// Seeds the database using the `default` profile (legacy behaviour).
/// Unprofiled seeder; the app seeds through `seed_database_with_profile`.
#[allow(dead_code)]
pub fn seed_database(conn: &Connection) -> Result<()> {
    seed_database_with_profile(conn, crate::config::PROFILE_DEFAULT)
}

/// Seeds the database honouring the active database profile.
///
/// * `default` — legacy behaviour (3 warehouses, everything seeded).
/// * `single-store` — exactly 1 warehouse, all products in it.
/// * `multi-store` — 3 warehouses, products distributed across them.
/// * `empty` — users/roles/permissions/settings only, no business reference
///   data or warehouses.
pub fn seed_database_with_profile(conn: &Connection, profile: &str) -> Result<()> {
    let existing_users: i64 = conn.query_row(
        "SELECT COUNT(*) FROM users", [], |row| row.get(0)
    )?;

    if existing_users == 0 {
        seed_permissions(conn)?;
        seed_roles(conn)?;
        seed_users(conn)?;
        seed_settings(conn)?;

        if profile != crate::config::PROFILE_EMPTY {
            seed_categories(conn)?;
            seed_brands(conn)?;
            seed_manufacturers(conn)?;
            seed_suppliers(conn)?;
            seed_warehouses(conn, profile)?;
            seed_storage_locations(conn, profile)?;
            seed_products(conn, profile)?;
        }
    }

    // Always seed these (they check existence internally)
    seed_additional_permissions(conn)?;
    seed_application_settings(conn)?;
    seed_printer_settings(conn)?;
    seed_device_settings(conn)?;
    seed_license_record(conn)?;
    seed_system_update_record(conn)?;

    Ok(())
}

fn seed_additional_permissions(conn: &Connection) -> Result<()> {
    let existing: i64 = conn.query_row(
        "SELECT COUNT(*) FROM permissions WHERE key LIKE 'admin.%'", [], |row| row.get(0)
    )?;
    if existing > 0 { return Ok(()); }
    for (key, name, group, description) in DEFAULT_PERMISSIONS {
        conn.execute(
            "INSERT OR IGNORE INTO permissions (key, name, group_name, description) VALUES (?1, ?2, ?3, ?4)",
            rusqlite::params![key, name, group, description],
        )?;
    }
    for (role_name, _desc, _sys, perms) in ROLES {
        let role_id: Option<i64> = conn.query_row(
            "SELECT id FROM roles WHERE name = ?1",
            rusqlite::params![role_name],
            |row| row.get(0),
        ).ok();
        if let Some(rid) = role_id {
            for perm_key in perms.iter().copied() {
                if let Ok(perm_id) = conn.query_row::<i64, _, _>(
                    "SELECT id FROM permissions WHERE key = ?1",
                    rusqlite::params![perm_key],
                    |row| row.get(0),
                ) {
                    conn.execute(
                        "INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (?1, ?2)",
                        rusqlite::params![rid, perm_id],
                    )?;
                }
            }
        }
    }
    Ok(())
}

fn seed_application_settings(conn: &Connection) -> Result<()> {
    // Idempotent per-key seeding: INSERT OR IGNORE adds any missing keys to
    // existing databases without touching values that are already present.
    let app_settings: &[(&str, &str, &str, &str, &str, Option<&str>, Option<&str>)] = &[
        ("general", "store_name", "Inventory Gear", "string", "Store display name", None, None),
        ("general", "store_logo", "", "string", "Store logo URL", None, None),
        ("general", "currency", "USD", "string", "Default currency", Some("{\"options\":[\"USD\",\"MXN\",\"EUR\",\"GTQ\",\"CRC\",\"COP\"]}"), None),
        ("general", "timezone", "America/Mexico_City", "string", "Timezone", None, None),
        ("general", "language", "es", "string", "Default language", Some("{\"options\":[\"es\",\"en\"]}"), None),
        ("theme", "theme", "system", "string", "Default theme", Some("{\"options\":[\"light\",\"dark\",\"system\"]}"), None),
        ("localization", "date_format", "DD/MM/YYYY", "string", "Date format", None, None),
        ("localization", "time_format", "HH:mm", "string", "Time format", None, None),
        ("localization", "number_format", "1,234.56", "string", "Number format", None, None),
        ("security", "auto_logout_minutes", "60", "number", "Auto logout after minutes of inactivity", None, Some("{\"min\":1,\"max\":1440}")),
        ("security", "password_min_length", "6", "number", "Minimum password length", None, Some("{\"min\":4,\"max\":64}")),
        ("security", "password_require_uppercase", "false", "boolean", "Require uppercase in password", None, None),
        ("security", "password_require_numbers", "false", "boolean", "Require numbers in password", None, None),
        ("security", "failed_login_lockout", "5", "number", "Failed login attempts before lockout", None, Some("{\"min\":1,\"max\":50}")),
        ("security", "lockout_duration_minutes", "30", "number", "Lockout duration in minutes", None, Some("{\"min\":1,\"max\":1440}")),
        ("security", "password_expiry_days", "0", "number", "Password expiry in days (0 = never)", None, Some("{\"min\":0,\"max\":365}")),
        ("inventory", "low_stock_threshold", "10", "number", "Low stock alert threshold", None, Some("{\"min\":0,\"max\":100000}")),
        ("inventory", "default_warehouse", "", "string", "Default warehouse", None, None),
        ("inventory", "barcode_format", "CODE128", "string", "Barcode format", Some("{\"options\":[\"CODE128\",\"EAN13\",\"UPC\",\"QR\"]}"), None),
        ("sales", "receipt_footer", "Thank you for your purchase!", "string", "Receipt footer text", None, None),
        ("sales", "invoice_prefix", "INV-", "string", "Invoice number prefix", None, None),
        ("sales", "sale_prefix", "SALE-", "string", "Sale number prefix", None, None),
        ("sales", "quote_prefix", "QTE-", "string", "Quote number prefix", None, None),
        ("sales", "default_payment_method", "cash", "string", "Default payment method", Some("{\"options\":[\"cash\",\"card\",\"transfer\",\"credit\"]}"), None),
        ("sales", "receipt_show_tax_breakdown", "true", "boolean", "Show tax breakdown on receipts", None, None),
        ("sales", "receipt_show_barcode", "false", "boolean", "Print barcode on receipts", None, None),
        ("sales", "receipt_show_customer_info", "true", "boolean", "Show customer info on receipts", None, None),
        ("purchasing", "po_prefix", "PO-", "string", "Purchase order prefix", None, None),
        ("printing", "default_printer", "", "string", "Default printer name", None, None),
        ("printing", "receipt_printer", "", "string", "Receipt printer name", None, None),
        ("printing", "invoice_printer", "", "string", "Invoice printer name", None, None),
        ("printing", "label_printer", "", "string", "Label printer name", None, None),
        ("printing", "paper_size_default", "80mm", "string", "Default paper size", None, None),
        ("database", "auto_vacuum", "false", "boolean", "Enable auto vacuum", None, None),
        ("backup", "auto_backup", "true", "boolean", "Enable automatic backups", None, None),
        ("backup", "backup_interval_hours", "24", "number", "Backup interval in hours", None, Some("{\"min\":1,\"max\":720}")),
        ("backup", "backup_retention_days", "30", "number", "Backup retention in days", None, Some("{\"min\":1,\"max\":3650}")),
        ("backup", "backup_compression", "true", "boolean", "Compress backups", None, None),
        ("backup", "backup_encryption", "false", "boolean", "Encrypt backups", None, None),
        ("backup", "backup_destination", "local", "string", "Backup destination", Some("{\"options\":[\"local\",\"external\",\"cloud\"]}"), None),
        ("backup", "backup_path", "", "string", "Backup directory path", None, None),
        ("updates", "auto_check_updates", "true", "boolean", "Automatically check for updates", None, None),
        ("updates", "update_channel", "stable", "string", "Update channel", Some("{\"options\":[\"stable\",\"beta\",\"nightly\"]}"), None),
        ("performance", "cache_enabled", "true", "boolean", "Enable caching", None, None),
        ("performance", "cache_ttl_seconds", "300", "number", "Cache TTL in seconds", None, Some("{\"min\":0,\"max\":86400}")),
        ("company", "business_name", "", "string", "Legal business name", None, None),
        ("company", "tax_id", "", "string", "Tax identification number (RFC/NIT)", None, Some("{\"maxLength\":30}")),
        ("company", "address_line1", "", "string", "Street address line 1", None, None),
        ("company", "address_line2", "", "string", "Street address line 2", None, None),
        ("company", "city", "", "string", "City", None, None),
        ("company", "state", "", "string", "State / province", None, None),
        ("company", "postal_code", "", "string", "Postal code", None, Some("{\"maxLength\":12}")),
        ("company", "phone", "", "string", "Business phone", None, None),
        ("company", "email", "", "string", "Business email", None, None),
        ("company", "website", "", "string", "Business website", None, None),
        ("company", "business_type", "auto_parts", "string", "Business type", Some("{\"options\":[\"auto_parts\",\"tire_shop\",\"general_store\",\"retail\"]}"), None),
        ("tax", "tax_rate", "16", "number", "Default tax rate percentage", None, Some("{\"min\":0,\"max\":100}")),
        ("tax", "prices_include_tax", "false", "boolean", "Prices already include tax", None, None),
        ("tax", "tax_id_required", "false", "boolean", "Require tax ID on invoices", None, None),
        ("notifications", "notify_low_stock", "true", "boolean", "Notify when stock is low", None, None),
        ("notifications", "notify_purchase_orders", "true", "boolean", "Notify on purchase order events", None, None),
        ("notifications", "notify_warranty_expiry", "true", "boolean", "Notify when warranties are expiring", None, None),
        ("notifications", "notify_backup_failures", "true", "boolean", "Notify on backup failures", None, None),
        ("notifications", "sound_enabled", "true", "boolean", "Play sound notifications", None, None),
        ("business", "items_per_page", "25", "number", "Default items per page", None, Some("{\"min\":5,\"max\":200}")),
        ("business", "default_margin_percent", "30", "number", "Default sale margin percentage", None, Some("{\"min\":0,\"max\":90}")),
        ("business", "enable_sales", "true", "boolean", "Enable sales module", None, None),
        ("business", "enable_purchasing", "true", "boolean", "Enable purchasing module", None, None),
        ("business", "enable_crm", "true", "boolean", "Enable CRM module", None, None),
    ];

    let mut sort_order: std::collections::HashMap<&str, i64> = std::collections::HashMap::new();
    for (category, key, value, stype, description, options, validation) in app_settings {
        let order = sort_order.entry(category).or_insert(0);
        *order += 1;
        conn.execute(
            "INSERT OR IGNORE INTO application_settings (category, key, value, setting_type, description, options, validation, sort_order) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
            rusqlite::params![category, key, value, stype, description, options.map(|o| o.to_string()), validation.map(|v| v.to_string()), *order],
        )?;
    }

    // Keep application_settings in sync with any legacy settings values and
    // place tax config under its dedicated category (idempotent; the admin
    // write path mirrors both tables so they stay equal).
    let settings: Vec<(String, String)> = {
        let stmt = conn.prepare("SELECT key, value FROM settings WHERE value IS NOT NULL").ok();
        if let Some(mut s) = stmt {
            let rows = s.query_map([], |row| Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))).ok();
            if let Some(r) = rows {
                r.filter_map(|r| r.ok()).collect()
            } else { vec![] }
        } else { vec![] }
    };
    for (key, value) in settings {
        conn.execute("UPDATE application_settings SET value = ?1 WHERE key = ?2", rusqlite::params![value, key]).ok();
    }
    conn.execute(
        "UPDATE application_settings SET category = 'tax' WHERE key = 'tax_rate' AND category = 'general'",
        [],
    ).ok();
    Ok(())
}

fn seed_printer_settings(conn: &Connection) -> Result<()> {
    let existing: i64 = conn.query_row(
        "SELECT COUNT(*) FROM printer_settings", [], |row| row.get(0)
    )?;
    if existing > 0 { return Ok(()); }
    conn.execute(
        "INSERT INTO printer_settings (name, printer_type, interface_type, paper_size, is_default, is_active) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        rusqlite::params!["Default Receipt Printer", "receipt", "usb", "80mm", 1, 1],
    )?;
    conn.execute(
        "INSERT INTO printer_settings (name, printer_type, interface_type, paper_size, is_default, is_active) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        rusqlite::params!["Default Invoice Printer", "invoice", "usb", "A4", 0, 1],
    )?;
    Ok(())
}

fn seed_device_settings(conn: &Connection) -> Result<()> {
    let existing: i64 = conn.query_row(
        "SELECT COUNT(*) FROM device_settings", [], |row| row.get(0)
    )?;
    if existing > 0 { return Ok(()); }
    conn.execute(
        "INSERT INTO device_settings (name, device_type, identifier, interface_type) VALUES (?1, ?2, ?3, ?4)",
        rusqlite::params!["Default Barcode Scanner", "scanner", "", "usb"],
    )?;
    Ok(())
}

fn seed_license_record(conn: &Connection) -> Result<()> {
    let existing: i64 = conn.query_row(
        "SELECT COUNT(*) FROM license_information", [], |row| row.get(0)
    )?;
    if existing > 0 { return Ok(()); }
    conn.execute(
        "INSERT INTO license_information (license_key, license_type, company_name, max_users, max_stores, features, status) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        rusqlite::params!["TRIAL-0000-0000-0000", "trial", "My Company", 5, 1, "[\"core\"]", "trial"],
    )?;
    Ok(())
}

fn seed_system_update_record(conn: &Connection) -> Result<()> {
    let existing: i64 = conn.query_row(
        "SELECT COUNT(*) FROM system_updates", [], |row| row.get(0)
    )?;
    if existing > 0 { return Ok(()); }

    // Get the current app version from settings
    let version: String = conn.query_row(
        "SELECT value FROM settings WHERE key = 'app_version'",
        [],
        |row| row.get(0),
    ).unwrap_or_else(|_| "0.1.0".into());

    conn.execute(
        "INSERT INTO system_updates (version, status) VALUES (?1, ?2)",
        rusqlite::params![version, "installed"],
    )?;
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

fn seed_warehouses(conn: &Connection, profile: &str) -> Result<()> {
    if profile == crate::config::PROFILE_EMPTY {
        return Ok(());
    }

    // single-store keeps only the first warehouse; default/multi-store keep all.
    let warehouses: &[(&str, &str, &str, &str, &str)] = if profile == crate::config::PROFILE_SINGLE_STORE {
        &SEED_WAREHOUSES[..1]
    } else {
        &SEED_WAREHOUSES[..]
    };

    for (name, code, address, city, state) in warehouses {
        conn.execute(
            "INSERT OR IGNORE INTO warehouses (name, code, address, city, state) VALUES (?1, ?2, ?3, ?4, ?5)",
            rusqlite::params![name, code, address, city, state],
        )?;
    }
    Ok(())
}

fn seed_storage_locations(conn: &Connection, profile: &str) -> Result<()> {
    if profile == crate::config::PROFILE_EMPTY {
        return Ok(());
    }

    let locations: &[(&str, &str, &str, &str, &str, i32)] = if profile == crate::config::PROFILE_SINGLE_STORE {
        &SEED_STORAGE_LOCATIONS[..12]
    } else {
        &SEED_STORAGE_LOCATIONS[..]
    };

    for (zone, aisle, shelf, bin, code, warehouse_idx) in locations {
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

fn warehouse_ids(conn: &Connection) -> Vec<i64> {
    let mut stmt = match conn.prepare("SELECT id FROM warehouses ORDER BY code") {
        Ok(s) => s,
        Err(_) => return Vec::new(),
    };
    stmt.query_map([], |row| row.get::<_, i64>(0))
        .map(|rows| rows.filter_map(|r| r.ok()).collect())
        .unwrap_or_default()
}

fn seed_products(conn: &Connection, profile: &str) -> Result<()> {
    if profile == crate::config::PROFILE_EMPTY {
        return Ok(());
    }

    let warehouses = warehouse_ids(conn);
    let default_warehouse_id = warehouses.first().copied().unwrap_or(1);
    let multi_store = profile == crate::config::PROFILE_MULTI_STORE;

    let round2 = |n: f64| (n * 100.0).round() / 100.0;

    let category_by_name = |name: &str| -> Option<i64> {
        conn.query_row("SELECT id FROM categories WHERE name = ?1", rusqlite::params![name], |row| row.get(0)).ok()
    };
    let brand_by_name = |name: &str| -> Option<i64> {
        conn.query_row("SELECT id FROM brands WHERE name = ?1", rusqlite::params![name], |row| row.get(0)).ok()
    };
    let default_supplier = || -> Option<i64> {
        conn.query_row("SELECT id FROM suppliers WHERE company_name = ?1", rusqlite::params!["Autorepuestos Demo SRL"], |row| row.get(0)).ok()
    };

    let locations_for = |wh: i64| -> Vec<i64> {
        let mut stmt = match conn.prepare("SELECT id FROM storage_locations WHERE warehouse_id = ?1 ORDER BY id") {
            Ok(s) => s,
            Err(_) => return Vec::new(),
        };
        stmt.query_map([wh], |row| row.get::<_, i64>(0))
            .map(|rows| rows.filter_map(|r| r.ok()).collect())
            .unwrap_or_default()
    };

    let default_locations: Vec<i64> = locations_for(default_warehouse_id);

    for (i, (code, alt, name, price, category, brand, qty)) in SEED_PRODUCTS.iter().enumerate() {
        let category_id = category_by_name(category);
        let brand_id = brand_by_name(brand);
        let supplier_id = default_supplier();
        let sku = alt.as_ref().unwrap_or(code).trim();

        // multi-store distributes products round-robin across stores; any
        // other profile pins everything to the first (only) warehouse.
        let warehouse_id = if multi_store && !warehouses.is_empty() {
            warehouses[i % warehouses.len()]
        } else {
            default_warehouse_id
        };

        // assign the product's own warehouse storage locations round-robin.
        let pool = if multi_store { locations_for(warehouse_id) } else { default_locations.clone() };
        let storage_location_id = if pool.is_empty() {
            None
        } else {
            Some(pool[i % pool.len()])
        };

        let cost = round2(price * 0.70);
        // Implied margin keeps the demo prices reproducible under the new
        // pricing model: suggested(cost, margin) reproduces `price`.
        let margin = crate::pricing::implied_margin_pct(cost, *price);

        conn.execute(
            "INSERT OR IGNORE INTO products (name, sku, oem_number, internal_code, description, category_id, brand_id, supplier_id, cost_price, sale_price, wholesale_price, suggested_retail_price, tax_rate, stock_quantity, min_stock_level, max_stock_level, reorder_point, unit, warehouse_id, storage_location_id, is_active, is_discontinued, profit_margin_pct) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, 0, ?13, ?14, ?15, ?16, ?17, ?18, ?19, 1, 0, ?20)",
            rusqlite::params![
                name.trim(),
                sku,
                code,
                code,
                name.trim(),
                category_id,
                brand_id,
                supplier_id,
                cost,
                price,
                round2(price * 0.85),
                (price * 1.15).round(),
                qty,
                1,
                qty * 3,
                2,
                "pcs",
                warehouse_id,
                storage_location_id,
                margin,
            ],
        )?;

        let product_id: Option<i64> = conn.query_row(
            "SELECT id FROM products WHERE sku = ?1",
            rusqlite::params![sku],
            |row| row.get(0),
        ).ok();
        if let Some(pid) = product_id {
            conn.execute(
                "INSERT OR IGNORE INTO product_identifiers (product_id, identifier, identifier_type, brand_name, notes, created_at) VALUES (?1, ?2, 'oem', ?3, 'Código OEM', datetime('now'))",
                rusqlite::params![pid, code, brand],
            )?;
            if let Some(alt) = alt {
                conn.execute(
                    "INSERT OR IGNORE INTO product_identifiers (product_id, identifier, identifier_type, brand_name, notes, created_at) VALUES (?1, ?2, 'alternate', ?3, 'Código alterno', datetime('now'))",
                    rusqlite::params![pid, alt.trim(), brand],
                )?;
            }
        }
    }
    Ok(())
}
