//! Build-time installer configuration: the pre-seeded users and the quick-login
//! role toggles that ship inside the installer.
//!
//! The file is `installer-config.json`, maintained before a release is cut (see
//! `scripts/installer-config.mjs`) and bundled as a Tauri resource, so it sits
//! next to the installed executable. It is read once, on first launch, to seed
//! users; it is never written to and never re-read after the users exist.
//!
//! ## Why a plain file and not Tauri resources
//!
//! `AppConfig::default()` runs before Tauri's setup hook and before `DB_STATE`
//! exists, and the seeding this feeds happens in `db::seed` on the very first
//! launch. Resolving the path from `current_exe()` needs none of Tauri's resource
//! API, works identically in development and in an installed build, and can be
//! pointed elsewhere with an environment variable for local testing.
//!
//! ## Secrets
//!
//! These are the passwords the machines will ship with, and a bcrypt hash of a
//! known password is not a secret. That is the point: the operator sets a password
//! per installation, `passwordChangeRequired` forces each user to replace it on
//! first login, and the file never leaves the build machine unless the operator
//! checks it into the repository. It is listed in `.gitignore` by default; see
//! `scripts/installer-config.mjs` for the workflow that keeps it out of git while
//! still shipping it in the installer.

use serde::Deserialize;
use std::path::{Path, PathBuf};

/// Name of the configuration file, looked for beside the executable and in the
/// repository root during development.
pub const CONFIG_FILE_NAME: &str = "installer-config.json";

/// Environment variable that overrides the search. Used by the dev scripts and
/// by anyone testing a configuration without rebuilding the installer.
pub const CONFIG_PATH_ENV_VAR: &str = "IG_INSTALLER_CONFIG";

/// Minimum password length enforced when seeding.
pub const MIN_PASSWORD_LEN: usize = 6;

/// One user to pre-create on first launch.
///
/// `role` defaults to `owner` so a hand-written config that only lists usernames
/// and passwords still produces administrators, which is the common case for an
/// installation being prepared for a single owner.
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConfiguredUser {
    pub username: String,
    pub email: String,
    pub full_name: String,
    pub password: String,
    /// Role name; must match `roles.name` exactly. Defaults to `owner`.
    #[serde(default = "default_role")]
    pub role: String,
    /// Force a password change on first login. Defaults to true, because a
    /// pre-configured password is a shared password until the user replaces it.
    #[serde(default = "default_true")]
    pub password_change_required: bool,
    #[serde(default)]
    pub phone: Option<String>,
    /// Insert the user as active. Defaults to true.
    #[serde(default = "default_true")]
    pub active: bool,
}

/// Roles that may sign in with `login_by_role` (no password).
///
/// A role that is not listed here is denied by the backend, so a missing entry
/// means "off" rather than "on".
#[derive(Debug, Clone, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct InstallerConfig {
    #[serde(default)]
    pub users: Vec<ConfiguredUser>,
    #[serde(default)]
    pub quick_login_roles: Vec<String>,
}

fn default_role() -> String {
    "owner".to_string()
}

fn default_true() -> bool {
    true
}

/// A configuration that could not be used, with the reason.
///
/// Seeding treats this as fatal rather than skipping the file: an operator who
/// configures four users and gets none of them because of a typo would find out
/// from a login screen, not from a build. Every other seed step is best-effort.
#[derive(Debug)]
pub struct ConfigError(pub String);

impl std::fmt::Display for ConfigError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.0)
    }
}

/// Candidate locations, most specific first.
///
/// 1. `IG_INSTALLER_CONFIG`, so a config can be pointed at explicitly.
/// 2. Beside the executable — where the Tauri bundle puts a bundled resource.
/// 3. The repository root, so `tauri dev` and a fresh clone behave the same.
pub fn candidate_paths() -> Vec<PathBuf> {
    let mut paths = Vec::new();

    if let Ok(explicit) = std::env::var(CONFIG_PATH_ENV_VAR) {
        let trimmed = explicit.trim();
        if !trimmed.is_empty() {
            paths.push(PathBuf::from(trimmed));
        }
    }

    if let Ok(exe) = std::env::current_exe() {
        if let Some(dir) = exe.parent() {
            paths.push(dir.join(CONFIG_FILE_NAME));
        }
    }

    paths.push(repo_root().join(CONFIG_FILE_NAME));
    paths
}

/// Repository root, derived from this file's location at compile time.
///
/// `env!("CARGO_MANIFEST_DIR")` is `<repo>/src-tauri`, so one `..` up is the
/// root. Compile-time rather than runtime so it is correct in a bundled binary
/// whose `current_exe` is an install directory.
fn repo_root() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .map(Path::to_path_buf)
        .unwrap_or_else(|| PathBuf::from(env!("CARGO_MANIFEST_DIR")))
}

/// The first candidate that exists, if any.
pub fn resolve_path() -> Option<PathBuf> {
    candidate_paths().into_iter().find(|p| p.is_file())
}

/// Load and validate the configuration.
///
/// `Ok(None)` means there is no config file, which is the normal case for a
/// developer checkout and falls back to the built-in default users.
pub fn load() -> Result<Option<InstallerConfig>, ConfigError> {
    let path = match resolve_path() {
        Some(p) => p,
        None => return Ok(None),
    };

    let raw = std::fs::read_to_string(&path).map_err(|e| {
        ConfigError(format!(
            "No se pudo leer {}: {e}",
            path.to_string_lossy()
        ))
    })?;

    let config: InstallerConfig = serde_json::from_str(&raw).map_err(|e| {
        ConfigError(format!(
            "{} no es un archivo de configuración válido: {e}",
            path.to_string_lossy()
        ))
    })?;

    validate(&config, &path)?;
    Ok(Some(config))
}

/// Reject a configuration that would create a user who cannot log in, or that
/// would quietly create fewer users than were asked for.
///
/// The checks that matter are uniqueness and a non-empty password: both produce
/// an INSERT that either fails or creates an account nobody can use, and both
/// are far cheaper to catch here than after a customer's first launch.
fn validate(config: &InstallerConfig, path: &Path) -> Result<(), ConfigError> {
    let mut usernames: Vec<&str> = Vec::new();
    let mut emails: Vec<&str> = Vec::new();

    for (index, user) in config.users.iter().enumerate() {
        let position = index + 1;
        let label = if user.username.trim().is_empty() {
            format!("usuario #{}", position)
        } else {
            user.username.clone()
        };

        if user.username.trim().is_empty() {
            return Err(ConfigError(format!(
                "{CONFIG_FILE_NAME}: {label} no tiene nombre de usuario."
            )));
        }
        if user.email.trim().is_empty() {
            return Err(ConfigError(format!(
                "{CONFIG_FILE_NAME}: {label} no tiene correo electrónico."
            )));
        }
        if user.full_name.trim().is_empty() {
            return Err(ConfigError(format!(
                "{CONFIG_FILE_NAME}: {label} no tiene nombre completo."
            )));
        }
        if user.password.chars().count() < MIN_PASSWORD_LEN {
            return Err(ConfigError(format!(
                "{CONFIG_FILE_NAME}: la contraseña de {label} debe tener al menos {MIN_PASSWORD_LEN} caracteres."
            )));
        }

        if usernames.contains(&user.username.as_str()) {
            return Err(ConfigError(format!(
                "{CONFIG_FILE_NAME}: el nombre de usuario '{}' está repetido.",
                user.username
            )));
        }
        if emails.contains(&user.email.as_str()) {
            return Err(ConfigError(format!(
                "{CONFIG_FILE_NAME}: el correo '{}' está repetido.",
                user.email
            )));
        }

        usernames.push(&user.username);
        emails.push(&user.email);
    }

    let mut roles = Vec::new();
    for role in &config.quick_login_roles {
        let name = role.trim();
        if name.is_empty() {
            continue;
        }
        if roles.contains(&name) {
            return Err(ConfigError(format!(
                "{CONFIG_FILE_NAME}: el rol '{name}' está repetido en quickLoginRoles."
            )));
        }
        roles.push(name);
    }

    log::info!(
        "{}: {} usuario(s) configurado(s), {} rol(es) con acceso rápido, desde {}",
        path.file_name().map(|n| n.to_string_lossy().to_string()).unwrap_or_default(),
        config.users.len(),
        roles.len(),
        path.to_string_lossy()
    );

    Ok(())
}
