pub mod connection;
pub mod schema;
pub mod seed;

pub use connection::{init_database_with_profile, DbState};
// The app always opens through `init_database_with_profile`; only the schema
// tests build a bare database.
#[cfg(test)]
pub use connection::init_database;