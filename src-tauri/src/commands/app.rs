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

/// Developer-only: shells out to `npx tsx database/seed/run.ts`.
///
/// This has no place in a packaged build. There is no Node.js on a normal
/// Windows install and no `database/seed/run.ts` next to the executable, so the
/// command could only ever fail — it used to surface to users as "Seed failed:
/// ... Is Node.js installed?" from a menu item in the top bar. In release builds
/// it now refuses up front, and the menu entry is hidden by the frontend.
///
/// The production seed path is `db::seed::seed_database_with_profile`, which
/// runs automatically on an empty database. For demo data use the
/// `execute_demo_catalog` command, which is pure Rust and needs no Node.js.
#[tauri::command]
pub fn run_seeds() -> Result<String, String> {
    if !cfg!(debug_assertions) {
        return Err(
            "Este comando solo está disponible en builds de desarrollo. \
             Para cargar datos de ejemplo usa Inventario → Importar/Exportar → Catálogo de demostración."
                .to_string(),
        );
    }

    // Try to find the seed runner script
    let cwd = std::env::current_dir().map_err(|e| e.to_string())?;
    
    // Search upwards for database/seed/run.ts
    let mut dir = cwd.clone();
    let seed_script = loop {
        let candidate = dir.join("database").join("seed").join("run.ts");
        if candidate.exists() {
            break candidate;
        }
        if !dir.pop() {
            return Err(
                "Could not find database/seed/run.ts. Run from the project root or specify INVENTORY_GEAR_PATH.".to_string()
            );
        }
    };

    let project_root = seed_script.parent().unwrap().parent().unwrap().parent().unwrap();

    let output = std::process::Command::new("npx")
        .arg("tsx")
        .arg(&seed_script)
        .current_dir(project_root)
        .output()
        .map_err(|e| format!("Failed to run seed script: {}. Is Node.js installed?", e))?;

    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();

    if output.status.success() {
        Ok(stdout)
    } else {
        Err(format!("Seed script failed:\n{}\n{}", stdout, stderr))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_get_app_version() {
        let version = get_app_version();
        assert!(!version.is_empty());
        assert!(version.contains('.'));
    }

    #[test]
    fn test_health_check() {
        let result = health_check();
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), "Inventory Gear is running");
    }

    #[test]
    fn test_greet() {
        let greeting = greet("TestUser");
        assert!(greeting.contains("TestUser"));
        assert!(greeting.contains("Welcome"));
    }

    #[test]
    fn test_greet_empty_name() {
        let greeting = greet("");
        assert!(greeting.contains("Welcome"));
    }
}
