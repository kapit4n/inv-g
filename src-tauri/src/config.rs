use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    pub app_name: String,
    pub version: String,
    pub db_path: PathBuf,
    pub log_level: String,
}

impl Default for AppConfig {
    fn default() -> Self {
        let db_path = dirs::data_local_dir()
            .map(|p| p.join("inventory-gear").join("inventory_gear.db"))
            .unwrap_or_else(|| PathBuf::from("inventory_gear.db"));

        Self {
            app_name: "Inventory Gear".to_string(),
            version: env!("CARGO_PKG_VERSION").to_string(),
            db_path,
            log_level: "info".to_string(),
        }
    }
}

impl AppConfig {
    pub fn new(db_dir: PathBuf) -> Self {
        let mut config = Self::default();
        config.db_path = db_dir.join("inventory_gear.db");
        config
    }
}
