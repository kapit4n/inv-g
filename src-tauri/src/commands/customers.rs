use serde::{Deserialize, Serialize};

use crate::DB_STATE;

#[derive(Debug, Serialize, Deserialize)]
pub struct Customer {
    pub id: i64,
    pub name: String,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub address: Option<String>,
    pub city: Option<String>,
    pub state: Option<String>,
    pub postal_code: Option<String>,
    pub country: Option<String>,
    pub notes: Option<String>,
    pub is_active: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CustomerSale {
    pub id: i64,
    pub sale_number: String,
    pub total: f64,
    pub payment_method: String,
    pub payment_status: String,
    pub item_count: Option<i64>,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CustomerDetail {
    pub customer: Customer,
    pub total_sales: i64,
    pub total_spent: f64,
    pub last_purchase: Option<String>,
    pub credit_limit: Option<f64>,
    pub credit_balance: Option<f64>,
    pub recent_sales: Vec<CustomerSale>,
    pub communications: Vec<CommunicationEntry>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreditAccount {
    pub id: i64,
    pub customer_id: i64,
    pub customer_name: Option<String>,
    pub credit_limit: f64,
    pub current_balance: f64,
    pub status: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreditTransaction {
    pub id: i64,
    pub account_id: i64,
    pub amount: f64,
    pub transaction_type: String,
    pub reference_type: Option<String>,
    pub reference_id: Option<String>,
    pub notes: Option<String>,
    pub created_by: Option<i64>,
    pub created_by_name: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CommunicationEntry {
    pub id: i64,
    pub customer_id: i64,
    #[serde(rename = "type")]
    pub type_: String,
    pub subject: String,
    pub message: Option<String>,
    pub created_by: Option<i64>,
    pub created_by_name: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CommunicationInput {
    pub customer_id: i64,
    #[serde(rename = "type")]
    pub type_: String,
    pub subject: String,
    pub message: Option<String>,
}

macro_rules! map_err {
    ($expr:expr) => {
        $expr.map_err(|e| format!("{}", e))
    };
}

fn row_to_customer(row: &rusqlite::Row) -> rusqlite::Result<Customer> {
    Ok(Customer {
        id: row.get(0)?,
        name: row.get(1)?,
        email: row.get(2)?,
        phone: row.get(3)?,
        address: row.get(4)?,
        city: row.get(5)?,
        state: row.get(6)?,
        postal_code: row.get(7)?,
        country: row.get(8)?,
        notes: row.get(9)?,
        is_active: row.get::<_, i64>(10)? != 0,
        created_at: row.get(11)?,
        updated_at: row.get(12)?,
    })
}

fn row_to_customer_sale(row: &rusqlite::Row) -> rusqlite::Result<CustomerSale> {
    Ok(CustomerSale {
        id: row.get(0)?,
        sale_number: row.get(1)?,
        total: row.get(2)?,
        payment_method: row.get(3)?,
        payment_status: row.get(4)?,
        item_count: row.get(5)?,
        created_at: row.get(6)?,
    })
}

fn row_to_credit_account(row: &rusqlite::Row) -> rusqlite::Result<CreditAccount> {
    Ok(CreditAccount {
        id: row.get(0)?,
        customer_id: row.get(1)?,
        customer_name: row.get(2)?,
        credit_limit: row.get(3)?,
        current_balance: row.get(4)?,
        status: row.get(5)?,
        created_at: row.get(6)?,
        updated_at: row.get(7)?,
    })
}

fn row_to_credit_transaction(row: &rusqlite::Row) -> rusqlite::Result<CreditTransaction> {
    Ok(CreditTransaction {
        id: row.get(0)?,
        account_id: row.get(1)?,
        amount: row.get(2)?,
        transaction_type: row.get(3)?,
        reference_type: row.get(4)?,
        reference_id: row.get(5)?,
        notes: row.get(6)?,
        created_by: row.get(7)?,
        created_by_name: row.get(8)?,
        created_at: row.get(9)?,
    })
}

fn row_to_communication_entry(row: &rusqlite::Row) -> rusqlite::Result<CommunicationEntry> {
    Ok(CommunicationEntry {
        id: row.get(0)?,
        customer_id: row.get(1)?,
        type_: row.get(2)?,
        subject: row.get(3)?,
        message: row.get(4)?,
        created_by: row.get(5)?,
        created_by_name: row.get(6)?,
        created_at: row.get(7)?,
    })
}

#[tauri::command]
pub fn get_customers(search: Option<String>) -> Result<Vec<Customer>, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let mut sql = String::from(
        "SELECT id, name, email, phone, address, city, state, postal_code, country, notes, is_active, created_at, updated_at FROM customers WHERE 1=1"
    );

    let mut query_params: Vec<Box<dyn rusqlite::types::ToSql>> = Vec::new();

    if let Some(ref s) = search {
        if !s.is_empty() {
            sql.push_str(" AND (name LIKE ?1 OR email LIKE ?1 OR phone LIKE ?1)");
            query_params.push(Box::new(format!("%{}%", s)));
        }
    }

    sql.push_str(" ORDER BY name");

    let params_refs: Vec<&dyn rusqlite::types::ToSql> = query_params.iter().map(|p| p.as_ref()).collect();

    let mut stmt = map_err!(conn.prepare(&sql))?;
    let rows = map_err!(stmt.query_map(params_refs.as_slice(), row_to_customer))?;
    let mut result = Vec::new();
    for row in rows {
        result.push(map_err!(row)?);
    }
    Ok(result)
}

#[tauri::command]
pub fn get_customer(id: i64) -> Result<Customer, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let row = conn.query_row(
        "SELECT id, name, email, phone, address, city, state, postal_code, country, notes, is_active, created_at, updated_at FROM customers WHERE id = ?1",
        rusqlite::params![id],
        row_to_customer,
    ).map_err(|e| e.to_string())?;

    Ok(row)
}

#[tauri::command]
pub fn create_customer(
    name: String,
    email: Option<String>,
    phone: Option<String>,
    address: Option<String>,
    city: Option<String>,
    state: Option<String>,
    postal_code: Option<String>,
    country: Option<String>,
    notes: Option<String>,
) -> Result<Customer, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    map_err!(conn.execute(
        "INSERT INTO customers (name, email, phone, address, city, state, postal_code, country, notes) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        rusqlite::params![name, email, phone, address, city, state, postal_code, country, notes],
    ))?;

    let id = conn.last_insert_rowid();
    drop(conn);

    get_customer(id)
}

#[tauri::command]
pub fn update_customer(
    id: i64,
    name: String,
    email: Option<String>,
    phone: Option<String>,
    address: Option<String>,
    city: Option<String>,
    state: Option<String>,
    postal_code: Option<String>,
    country: Option<String>,
    notes: Option<String>,
) -> Result<Customer, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    map_err!(conn.execute(
        "UPDATE customers SET name = ?1, email = ?2, phone = ?3, address = ?4, city = ?5, state = ?6, postal_code = ?7, country = ?8, notes = ?9, updated_at = datetime('now') WHERE id = ?10",
        rusqlite::params![name, email, phone, address, city, state, postal_code, country, notes, id],
    ))?;

    drop(conn);
    get_customer(id)
}

#[tauri::command]
pub fn archive_customer(id: i64) -> Result<(), String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    map_err!(conn.execute(
        "UPDATE customers SET is_active = 0, updated_at = datetime('now') WHERE id = ?1",
        rusqlite::params![id],
    ))?;

    Ok(())
}

#[tauri::command]
pub fn get_customer_detail(id: i64) -> Result<CustomerDetail, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let customer = conn.query_row(
        "SELECT id, name, email, phone, address, city, state, postal_code, country, notes, is_active, created_at, updated_at FROM customers WHERE id = ?1",
        rusqlite::params![id],
        row_to_customer,
    ).map_err(|e| e.to_string())?;

    let (total_sales, total_spent): (i64, f64) = conn.query_row(
        "SELECT COUNT(*), COALESCE(SUM(total), 0) FROM sales WHERE customer_id = ?1",
        rusqlite::params![id],
        |row| Ok((row.get(0)?, row.get(1)?)),
    ).map_err(|e| e.to_string())?;

    let last_purchase: Option<String> = conn.query_row(
        "SELECT MAX(created_at) FROM sales WHERE customer_id = ?1",
        rusqlite::params![id],
        |row| row.get(0),
    ).map_err(|e| e.to_string())?;

    let credit_info: Option<(f64, f64)> = conn.query_row(
        "SELECT credit_limit, current_balance FROM credit_accounts WHERE customer_id = ?1",
        rusqlite::params![id],
        |row| Ok((row.get(0)?, row.get(1)?)),
    ).ok();

    let mut stmt = map_err!(conn.prepare(
        "SELECT s.id, s.sale_number, s.total, s.payment_method, s.payment_status, (SELECT COUNT(*) FROM sale_items si WHERE si.sale_id = s.id) AS item_count, s.created_at FROM sales s WHERE s.customer_id = ?1 ORDER BY s.created_at DESC LIMIT 10"
    ))?;
    let rows = map_err!(stmt.query_map(rusqlite::params![id], row_to_customer_sale))?;
    let mut recent_sales = Vec::new();
    for row in rows {
        recent_sales.push(map_err!(row)?);
    }
    drop(stmt);

    let mut stmt = map_err!(conn.prepare(
        "SELECT cl.id, cl.customer_id, cl.type, cl.subject, cl.message, cl.created_by, u.full_name AS created_by_name, cl.created_at FROM communication_log cl LEFT JOIN users u ON u.id = cl.created_by WHERE cl.customer_id = ?1 ORDER BY cl.created_at DESC LIMIT 10"
    ))?;
    let rows = map_err!(stmt.query_map(rusqlite::params![id], row_to_communication_entry))?;
    let mut communications = Vec::new();
    for row in rows {
        communications.push(map_err!(row)?);
    }

    Ok(CustomerDetail {
        customer,
        total_sales,
        total_spent,
        last_purchase,
        credit_limit: credit_info.map(|c| c.0),
        credit_balance: credit_info.map(|c| c.1),
        recent_sales,
        communications,
    })
}

#[tauri::command]
pub fn get_customer_sales(customer_id: i64) -> Result<Vec<CustomerSale>, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let mut stmt = map_err!(conn.prepare(
        "SELECT s.id, s.sale_number, s.total, s.payment_method, s.payment_status, (SELECT COUNT(*) FROM sale_items si WHERE si.sale_id = s.id) AS item_count, s.created_at FROM sales s WHERE s.customer_id = ?1 ORDER BY s.created_at DESC"
    ))?;
    let rows = map_err!(stmt.query_map(rusqlite::params![customer_id], row_to_customer_sale))?;
    let mut result = Vec::new();
    for row in rows {
        result.push(map_err!(row)?);
    }
    Ok(result)
}

#[tauri::command]
pub fn get_credit_accounts() -> Result<Vec<CreditAccount>, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let mut stmt = map_err!(conn.prepare(
        "SELECT ca.id, ca.customer_id, c.name AS customer_name, ca.credit_limit, ca.current_balance, ca.status, ca.created_at, ca.updated_at FROM credit_accounts ca LEFT JOIN customers c ON c.id = ca.customer_id ORDER BY c.name"
    ))?;
    let rows = map_err!(stmt.query_map([], row_to_credit_account))?;
    let mut result = Vec::new();
    for row in rows {
        result.push(map_err!(row)?);
    }
    Ok(result)
}

#[tauri::command]
pub fn get_credit_account(customer_id: i64) -> Result<CreditAccount, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let row = conn.query_row(
        "SELECT ca.id, ca.customer_id, c.name AS customer_name, ca.credit_limit, ca.current_balance, ca.status, ca.created_at, ca.updated_at FROM credit_accounts ca LEFT JOIN customers c ON c.id = ca.customer_id WHERE ca.customer_id = ?1",
        rusqlite::params![customer_id],
        row_to_credit_account,
    ).map_err(|e| e.to_string())?;

    Ok(row)
}

#[tauri::command]
pub fn create_credit_account(customer_id: i64, credit_limit: f64) -> Result<CreditAccount, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    map_err!(conn.execute(
        "INSERT INTO credit_accounts (customer_id, credit_limit, current_balance, status) VALUES (?1, ?2, 0, 'active')",
        rusqlite::params![customer_id, credit_limit],
    ))?;

    drop(conn);
    get_credit_account(customer_id)
}

#[tauri::command]
pub fn update_credit_account(id: i64, credit_limit: f64, status: String) -> Result<CreditAccount, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    map_err!(conn.execute(
        "UPDATE credit_accounts SET credit_limit = ?1, status = ?2, updated_at = datetime('now') WHERE id = ?3",
        rusqlite::params![credit_limit, status, id],
    ))?;

    let customer_id: i64 = conn.query_row(
        "SELECT customer_id FROM credit_accounts WHERE id = ?1",
        rusqlite::params![id],
        |row| row.get(0),
    ).map_err(|e| e.to_string())?;

    drop(conn);
    get_credit_account(customer_id)
}

#[tauri::command]
pub fn get_credit_transactions(account_id: i64) -> Result<Vec<CreditTransaction>, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let mut stmt = map_err!(conn.prepare(
        "SELECT ct.id, ct.account_id, ct.amount, ct.transaction_type, ct.reference_type, ct.reference_id, ct.notes, ct.created_by, u.full_name AS created_by_name, ct.created_at FROM credit_transactions ct LEFT JOIN users u ON u.id = ct.created_by WHERE ct.account_id = ?1 ORDER BY ct.created_at DESC"
    ))?;
    let rows = map_err!(stmt.query_map(rusqlite::params![account_id], row_to_credit_transaction))?;
    let mut result = Vec::new();
    for row in rows {
        result.push(map_err!(row)?);
    }
    Ok(result)
}

#[tauri::command]
pub fn add_credit_transaction(
    account_id: i64,
    amount: f64,
    transaction_type: String,
    reference_type: Option<String>,
    reference_id: Option<String>,
    notes: Option<String>,
    created_by: i64,
) -> Result<CreditTransaction, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    map_err!(conn.execute(
        "INSERT INTO credit_transactions (account_id, amount, transaction_type, reference_type, reference_id, notes, created_by) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        rusqlite::params![account_id, amount, transaction_type, reference_type, reference_id, notes, created_by],
    ))?;

    let balance_change = match transaction_type.as_str() {
        "payment" | "credit" => amount,
        "debit" | "refund" => -amount,
        _ => 0.0,
    };

    map_err!(conn.execute(
        "UPDATE credit_accounts SET current_balance = current_balance + ?1, updated_at = datetime('now') WHERE id = ?2",
        rusqlite::params![balance_change, account_id],
    ))?;

    let new_id = conn.last_insert_rowid();

    let row = conn.query_row(
        "SELECT ct.id, ct.account_id, ct.amount, ct.transaction_type, ct.reference_type, ct.reference_id, ct.notes, ct.created_by, u.full_name AS created_by_name, ct.created_at FROM credit_transactions ct LEFT JOIN users u ON u.id = ct.created_by WHERE ct.id = ?1",
        rusqlite::params![new_id],
        row_to_credit_transaction,
    ).map_err(|e| e.to_string())?;

    Ok(row)
}

#[tauri::command]
pub fn get_communications(customer_id: i64) -> Result<Vec<CommunicationEntry>, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    let mut stmt = map_err!(conn.prepare(
        "SELECT cl.id, cl.customer_id, cl.type, cl.subject, cl.message, cl.created_by, u.full_name AS created_by_name, cl.created_at FROM communication_log cl LEFT JOIN users u ON u.id = cl.created_by WHERE cl.customer_id = ?1 ORDER BY cl.created_at DESC"
    ))?;
    let rows = map_err!(stmt.query_map(rusqlite::params![customer_id], row_to_communication_entry))?;
    let mut result = Vec::new();
    for row in rows {
        result.push(map_err!(row)?);
    }
    Ok(result)
}

#[tauri::command]
pub fn create_communication(input: CommunicationInput, created_by: i64) -> Result<CommunicationEntry, String> {
    let db = DB_STATE.get().ok_or("Database not initialized")?;
    let conn = db.conn.lock().map_err(|e| e.to_string())?;

    map_err!(conn.execute(
        "INSERT INTO communication_log (customer_id, type, subject, message, created_by) VALUES (?1, ?2, ?3, ?4, ?5)",
        rusqlite::params![input.customer_id, input.type_, input.subject, input.message, created_by],
    ))?;

    let new_id = conn.last_insert_rowid();

    let row = conn.query_row(
        "SELECT cl.id, cl.customer_id, cl.type, cl.subject, cl.message, cl.created_by, u.full_name AS created_by_name, cl.created_at FROM communication_log cl LEFT JOIN users u ON u.id = cl.created_by WHERE cl.id = ?1",
        rusqlite::params![new_id],
        row_to_communication_entry,
    ).map_err(|e| e.to_string())?;

    Ok(row)
}
