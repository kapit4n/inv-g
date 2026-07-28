#[tauri::command]
pub fn get_app_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

#[tauri::command]
pub fn health_check() -> Result<String, String> {
    Ok("Inventory Gear is running".to_string())
}

#[tauri::command]
pub fn greet(name: &str) -> String {
    format!("Hello, {}! Welcome to Inventory Gear.", name)
}
