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
        ])
        .run(tauri::generate_context!())
        .expect("Error while running tauri application");
}
