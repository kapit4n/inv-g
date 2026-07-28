use rusqlite::{Connection, Result};
use std::sync::Mutex;
use crate::db::schema;
use crate::db::seed;

#[derive(Debug)]
pub struct DbState {
    pub conn: Mutex<Connection>,
}

impl DbState {
    pub fn new(conn: Connection) -> Self {
        Self {
            conn: Mutex::new(conn),
        }
    }
}

pub fn init_database(db_path: &str) -> Result<Connection> {
    let conn = Connection::open(db_path)?;

    conn.execute_batch("PRAGMA journal_mode=WAL;")?;
    conn.execute_batch("PRAGMA foreign_keys=ON;")?;

    schema::create_tables(&conn)?;
    seed::seed_database(&conn)?;

    Ok(conn)
}
