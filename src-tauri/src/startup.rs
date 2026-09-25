//! Production startup: logging, database bootstrap and fatal-error reporting.
//!
//! Why this module exists
//! ----------------------
//! `run()` used to do its work *before* the Tauri builder, and every failure was
//! an `.expect()`. In a packaged Windows app that is the worst possible
//! behaviour: there is no console, so the panic text goes nowhere and the user
//! sees either nothing at all or an empty window with no explanation.
//!
//! Now the database is opened inside Tauri's `setup` hook — after the runtime
//! exists, before the window is shown — and any failure is reported through a
//! native message box that names the problem and points at the log file.
//!
//! Logging also moves here. A GUI subsystem binary on Windows has no stderr, so
//! `env_logger`'s default output is discarded. Production logs therefore go to
//! `<data dir>/logs/inventory-gear.log`, and stderr is kept in debug builds so
//! `npm run dev` still shows them in the terminal.

use std::fs::{self, File, OpenOptions};
use std::io::Write;
use std::path::{Path, PathBuf};

use tauri::AppHandle;
use tauri_plugin_dialog::DialogExt;

use crate::config::AppConfig;
use crate::db::DbState;

/// Rotate once the log passes this size, so a long-running install cannot fill
/// the user's disk with one ever-growing file.
const LOG_MAX_BYTES: u64 = 5 * 1024 * 1024;
const LOG_FILE_NAME: &str = "inventory-gear.log";

/// Duplicates log output to the log file and (in debug builds) to stderr.
struct TeeWriter {
    file: Option<File>,
    to_stderr: bool,
}

impl Write for TeeWriter {
    fn write(&mut self, buf: &[u8]) -> std::io::Result<usize> {
        if let Some(f) = self.file.as_mut() {
            // A failing log write must never take the app down.
            if f.write_all(buf).and_then(|_| f.flush()).is_err() {
                self.file = None;
            }
        }
        if self.to_stderr {
            let _ = std::io::stderr().write_all(buf);
        }
        Ok(buf.len())
    }

    fn flush(&mut self) -> std::io::Result<()> {
        if let Some(f) = self.file.as_mut() {
            let _ = f.flush();
        }
        Ok(())
    }
}

/// `<data dir>/logs`, created on demand.
fn log_dir(data_dir: &Path) -> PathBuf {
    data_dir.join("logs")
}

/// Points `env_logger` at the application-data log file.
///
/// Never panics: if the log file cannot be opened the app still runs (logging
/// degrades to stderr in debug, and to nowhere in release, rather than blocking
/// startup over a diagnostics problem).
pub fn init_logging(data_dir: &Path) {
    let mut file: Option<File> = None;
    let dir = log_dir(data_dir);
    if fs::create_dir_all(&dir).is_ok() {
        let path = dir.join(LOG_FILE_NAME);
        // Simple size-based rotation: move the old log aside once it is large.
        if let Ok(meta) = fs::metadata(&path) {
            if meta.len() > LOG_MAX_BYTES {
                let _ = fs::rename(&path, dir.join(format!("{LOG_FILE_NAME}.1")));
            }
        }
        file = OpenOptions::new().create(true).append(true).open(&path).ok();
    }

    let to_stderr = cfg!(debug_assertions);
    let mut builder = env_logger::Builder::new();
    builder.filter_level(log::LevelFilter::Info);

    // RUST_LOG still wins, so support can turn up verbosity without a rebuild.
    if let Ok(spec) = std::env::var("RUST_LOG") {
        if !spec.trim().is_empty() {
            builder.parse_filters(&spec);
        }
    }

    if file.is_some() || to_stderr {
        builder.target(env_logger::Target::Pipe(Box::new(TeeWriter { file, to_stderr })));
    }

    // `try_init` rather than `init`: a second call (tests, or a future
    // re-entry) must not abort the process.
    let _ = builder.try_init();
}

/// Path of the active log file, for error messages.
pub fn log_file_path(data_dir: &Path) -> PathBuf {
    log_dir(data_dir).join(LOG_FILE_NAME)
}

/// Opens (creating if needed) the database for the configured profile.
///
/// Safe to call on every launch: `init_database_with_profile` runs idempotent
/// migrations and the seeder is guarded, so an existing database is opened and
/// updated, never recreated.
pub fn bootstrap_database(app_config: &AppConfig) -> Result<DbState, String> {
    if let Some(parent) = app_config.db_path.parent() {
        fs::create_dir_all(parent).map_err(|e| {
            format!(
                "No se pudo crear la carpeta de datos {}: {e}",
                parent.display()
            )
        })?;
    }

    let db_path = app_config.db_path.to_string_lossy().to_string();
    let conn = crate::db::init_database_with_profile(&db_path, &app_config.profile)
        .map_err(|e| format!("No se pudo abrir la base de datos: {e}"))?;

    log::info!(
        "Base de datos abierta: {} (perfil: {})",
        app_config.db_path.display(),
        app_config.profile
    );

    Ok(DbState::new(conn, app_config.db_path.clone(), &app_config.profile))
}

/// Reports an unrecoverable startup failure in a native dialog.
///
/// Shows the message and returns — the caller decides how to terminate, so the
/// exit code reflects the failure rather than being hard-coded here. The message
/// names the problem in the user's language and points at the log file rather
/// than dumping filesystem internals into the UI.
pub fn show_fatal_error(handle: &AppHandle, data_dir: &Path, headline: &str, detail: &str) {
    let log_path = log_file_path(data_dir);

    log::error!("{headline}: {detail}");

    let body = format!("{detail}\n\nLos detalles técnicos están en:\n{}", log_path.display());

    handle.dialog().message(body).title(headline).blocking_show();
}
