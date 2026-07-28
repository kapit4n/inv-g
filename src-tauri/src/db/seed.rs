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
];

const ROLES: &[(&str, &str, bool, &[&str])] = &[
    ("owner", "Propietario", true, &[
        "dashboard.view",
        "inventory.view", "inventory.create", "inventory.update", "inventory.delete",
        "sales.view", "sales.create", "sales.refund",
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
        "sales.view", "sales.create", "sales.refund",
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
        "sales.view", "sales.create",
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
