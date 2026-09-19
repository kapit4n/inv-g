use rusqlite::{Connection, Result};
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use crate::db::schema;
use crate::db::seed;

#[derive(Debug, Clone)]
pub struct DbState {
    pub conn: Arc<Mutex<Connection>>,
    pub db_path: PathBuf,
    pub profile: String,
}

impl DbState {
    pub fn new(conn: Connection, db_path: PathBuf, profile: &str) -> Self {
        Self {
            conn: Arc::new(Mutex::new(conn)),
            db_path,
            profile: profile.to_string(),
        }
    }
}

pub fn init_database(db_path: &str) -> Result<Connection> {
    init_database_with_profile(db_path, crate::config::PROFILE_DEFAULT)
}

/// Opens (creating if needed) the DB at `db_path` and seeds it for the given
/// profile (see `seed_database_with_profile`).
pub fn init_database_with_profile(db_path: &str, profile: &str) -> Result<Connection> {
    let conn = Connection::open(db_path)?;

    conn.execute_batch("PRAGMA journal_mode=WAL;")?;
    conn.execute_batch("PRAGMA foreign_keys=ON;")?;

    schema::create_tables(&conn)?;
    seed::seed_database_with_profile(&conn, profile)?;

    Ok(conn)
}
