mod commands;
mod config;
mod db;
mod error;

use db::{init_database, DbState};
use std::sync::OnceLock;

static DB_STATE: OnceLock<DbState> = OnceLock::new();

pub fn run() {
    env_logger::init();

    let app_config = config::AppConfig::default();

    let db_path = app_config.db_path.to_string_lossy().to_string();

    if let Some(parent) = app_config.db_path.parent() {
        std::fs::create_dir_all(parent).expect("Failed to create database directory");
    }

    let conn = init_database(&db_path).expect("Failed to initialize database");

    let db_state = DbState::new(conn);
    DB_STATE.set(db_state).expect("Failed to set database state");

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            commands::app::get_app_version,
            commands::app::health_check,
            commands::app::greet,
            commands::auth::login,
            commands::auth::logout,
            commands::auth::get_current_user,
            commands::auth::check_session,
            commands::auth::get_user_permissions_list,
            commands::settings::get_settings,
            commands::settings::get_setting,
            commands::settings::update_setting,
            commands::settings::get_settings_by_group,
            commands::inventory::get_categories,
            commands::inventory::create_category,
            commands::inventory::update_category,
            commands::inventory::archive_category,
            commands::inventory::restore_category,
            commands::inventory::get_brands,
            commands::inventory::create_brand,
            commands::inventory::update_brand,
            commands::inventory::archive_brand,
            commands::inventory::get_manufacturers,
            commands::inventory::create_manufacturer,
            commands::inventory::update_manufacturer,
            commands::inventory::get_suppliers,
            commands::inventory::create_supplier,
            commands::inventory::update_supplier,
            commands::inventory::archive_supplier,
            commands::inventory::get_warehouses,
            commands::inventory::create_warehouse,
            commands::inventory::update_warehouse,
            commands::inventory::get_storage_locations,
            commands::inventory::create_storage_location,
            commands::inventory::get_products,
            commands::inventory::get_product,
            commands::inventory::create_product,
            commands::inventory::update_product,
            commands::inventory::archive_product,
            commands::inventory::restore_product,
            commands::inventory::get_dashboard_stats,
            commands::inventory::get_product_compatibility,
            commands::inventory::get_product_images,
        ])
        .run(tauri::generate_context!())
        .expect("Error while running tauri application");
}
