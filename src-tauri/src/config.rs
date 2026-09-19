use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};

/// Database profile identifiers.
pub const PROFILE_DEFAULT: &str = "default";
pub const PROFILE_SINGLE_STORE: &str = "single-store";
pub const PROFILE_MULTI_STORE: &str = "multi-store";
pub const PROFILE_EMPTY: &str = "empty";

/// Env var that overrides the persisted profile (highest precedence).
pub const PROFILE_ENV_VAR: &str = "IG_DATABASE_PROFILE";

/// Name of the file (inside the data dir) that persists the active profile.
pub const PROFILE_FILE_NAME: &str = "profile.json";

/// All known profiles, in a stable order.
pub const ALL_PROFILES: &[&str] = &[
    PROFILE_DEFAULT,
    PROFILE_SINGLE_STORE,
    PROFILE_MULTI_STORE,
    PROFILE_EMPTY,
];

pub fn is_valid_profile(profile: &str) -> bool {
    ALL_PROFILES.contains(&profile)
}

/// Maps a profile identifier to its database file name.
pub fn profile_db_file_name(profile: &str) -> &'static str {
    match profile {
        PROFILE_SINGLE_STORE => "inventory-gear-single.db",
        PROFILE_MULTI_STORE => "inventory-gear-multi.db",
        PROFILE_EMPTY => "inventory-gear-empty.db",
        _ => "inventory_gear.db",
    }
}

/// The directory that holds DB files and `profile.json`.
pub fn data_dir() -> PathBuf {
    dirs::data_local_dir()
        .map(|p| p.join("inventory-gear"))
        .unwrap_or_else(|| PathBuf::from("inventory-gear"))
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    pub app_name: String,
    pub version: String,
    pub db_path: PathBuf,
    pub log_level: String,
    pub profile: String,
    pub data_dir: PathBuf,
}

impl Default for AppConfig {
    fn default() -> Self {
        let data_dir = data_dir();
        let profile = read_active_profile(&data_dir);
        let db_path = data_dir.join(profile_db_file_name(&profile));

        Self {
            app_name: "Inventory Gear".to_string(),
            version: env!("CARGO_PKG_VERSION").to_string(),
            db_path,
            log_level: "info".to_string(),
            profile,
            data_dir,
        }
    }
}

impl AppConfig {
    pub fn new(db_dir: PathBuf) -> Self {
        let profile = read_active_profile(&db_dir);
        let db_path = db_dir.join(profile_db_file_name(&profile));
        Self {
            data_dir: db_dir,
            profile,
            db_path,
            ..Self::default()
        }
    }

    /// Path of the persisted profile file.
    pub fn profile_file(&self) -> PathBuf {
        self.data_dir.join(PROFILE_FILE_NAME)
    }
}

/// Resolves the active profile: env var overrides the file, unknown falls back
/// to `default`.
pub fn read_active_profile(data_dir: &Path) -> String {
    if let Ok(from_env) = std::env::var(PROFILE_ENV_VAR) {
        if from_env.trim().is_empty() {
            // treat empty as unset
        } else if is_valid_profile(from_env.trim()) {
            return from_env.trim().to_string();
        } else {
            eprintln!(
                "Warning: {}={} is not a known profile, falling back to default",
                PROFILE_ENV_VAR, from_env
            );
            return PROFILE_DEFAULT.to_string();
        }
    }

    let file = data_dir.join(PROFILE_FILE_NAME);
    if let Ok(contents) = std::fs::read_to_string(&file) {
        if let Ok(info) = serde_json::from_str::<ProfileFile>(&contents) {
            if is_valid_profile(&info.profile) {
                return info.profile;
            }
        }
    }

    PROFILE_DEFAULT.to_string()
}

/// Persists the active profile so future launches open the right DB.
pub fn write_active_profile(data_dir: &Path, profile: &str) -> std::io::Result<()> {
    if !is_valid_profile(profile) {
        return Err(std::io::Error::new(
            std::io::ErrorKind::InvalidInput,
            format!("Unknown database profile: {}", profile),
        ));
    }
    std::fs::create_dir_all(data_dir)?;
    let info = ProfileFile { profile: profile.to_string() };
    serde_json::to_writer_pretty(&mut std::io::BufWriter::new(
        std::fs::File::create(data_dir.join(PROFILE_FILE_NAME))?,
    ), &info).map_err(std::io::Error::other)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProfileFile {
    pub profile: String,
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::atomic::{AtomicU64, Ordering};

    static TEST_DIR_COUNTER: AtomicU64 = AtomicU64::new(0);

    /// Unique directory per call so parallel tests never share state.
    fn temp_dir() -> PathBuf {
        let mut dir = std::env::temp_dir();
        dir.push(format!(
            "inventory-gear-config-{}-{}",
            std::process::id(),
            TEST_DIR_COUNTER.fetch_add(1, Ordering::Relaxed)
        ));
        let _ = std::fs::remove_dir_all(&dir);
        dir
    }

    #[test]
    fn test_default_config() {
        let config = AppConfig::default();
        assert_eq!(config.app_name, "Inventory Gear");
        assert_eq!(config.log_level, "info");
        assert!(!config.version.is_empty());
        assert_eq!(config.profile, PROFILE_DEFAULT);
    }

    #[test]
    fn test_valid_profiles() {
        for p in ALL_PROFILES {
            assert!(is_valid_profile(p));
        }
        assert!(!is_valid_profile("nope"));
        assert!(!is_valid_profile(""));
    }

    #[test]
    fn test_db_file_mapping() {
        assert_eq!(profile_db_file_name(PROFILE_DEFAULT), "inventory_gear.db");
        assert_eq!(profile_db_file_name(PROFILE_SINGLE_STORE), "inventory-gear-single.db");
        assert_eq!(profile_db_file_name(PROFILE_MULTI_STORE), "inventory-gear-multi.db");
        assert_eq!(profile_db_file_name(PROFILE_EMPTY), "inventory-gear-empty.db");
        assert_eq!(profile_db_file_name("unknown"), "inventory_gear.db");
    }

    #[test]
    fn test_config_default_profile_db_file() {
        let cfg = AppConfig::default();
        assert!(cfg.db_path.ends_with("inventory_gear.db"));
    }

    #[test]
    fn test_read_active_profile_no_file_falls_back_to_default() {
        let dir = temp_dir();
        assert_eq!(read_active_profile(&dir), PROFILE_DEFAULT);
    }

    #[test]
    fn test_write_and_read_profile_roundtrip() {
        let dir = temp_dir();
        write_active_profile(&dir, PROFILE_MULTI_STORE).expect("write profile");
        assert_eq!(read_active_profile(&dir), PROFILE_MULTI_STORE);
    }

    #[test]
    fn test_unknown_file_profile_falls_back_to_default() {
        let dir = temp_dir();
        std::fs::create_dir_all(&dir).unwrap();
        std::fs::write(dir.join(PROFILE_FILE_NAME), r#"{"profile":"bogus"}"#).unwrap();
        assert_eq!(read_active_profile(&dir), PROFILE_DEFAULT);
    }

    #[test]
    fn test_env_var_overrides_file() {
        let dir = temp_dir();
        write_active_profile(&dir, PROFILE_MULTI_STORE).unwrap();
        unsafe { std::env::set_var(PROFILE_ENV_VAR, PROFILE_SINGLE_STORE); }
        assert_eq!(read_active_profile(&dir), PROFILE_SINGLE_STORE);
        unsafe { std::env::remove_var(PROFILE_ENV_VAR); }
    }

    #[test]
    fn test_config_with_dir_uses_profile_file() {
        let dir = temp_dir();
        write_active_profile(&dir, PROFILE_EMPTY).unwrap();
        let config = AppConfig::new(dir.clone());
        assert_eq!(config.profile, PROFILE_EMPTY);
        assert_eq!(config.db_path, dir.join("inventory-gear-empty.db"));
    }

    #[test]
    fn test_write_invalid_profile_is_error() {
        assert!(write_active_profile(&temp_dir(), "bogus").is_err());
    }
}