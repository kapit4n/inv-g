use calamine::{open_workbook, Data, Reader, Xlsx};
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use tauri::State;

use crate::commands::business::{default_store_id, is_multi_store};
use crate::db::DbState;

fn get_conn<'r>(
    state: &'r State<'r, DbState>,
) -> Result<std::sync::MutexGuard<'r, rusqlite::Connection>, String> {
    state.conn.lock().map_err(|e| format!("Database lock error: {}", e))
}

const SHEET_PRODUCTOS: &str = "Productos";

const COL_NUM: usize = 0;
const COL_CODIGO: usize = 1;
const COL_CODIGO2: usize = 2;
const COL_SKU: usize = 3;
const COL_NOMBRE: usize = 4;
const COL_DESC: usize = 5;
const COL_CATEGORIA: usize = 6;
const COL_MARCA: usize = 7;
const COL_FABRICANTE: usize = 8;
const COL_PROVEEDOR: usize = 9;
const COL_COSTO: usize = 10;
const COL_PRECIO: usize = 11;
const COL_MAYORISTA: usize = 12;
const COL_SUGERIDO: usize = 13;
const COL_IMPUESTO: usize = 14;
const COL_STOCK: usize = 15;
const COL_STOCK_MIN: usize = 16;
const COL_STOCK_MAX: usize = 17;
const COL_REORDER: usize = 18;
const COL_UNIDAD: usize = 19;
const COL_PESO: usize = 20;
const COL_BARCODE: usize = 21;
const COL_ALMACEN: usize = 22;
const COL_UBICACION: usize = 23;
const COL_IMAGEN: usize = 24;
const COL_ACTIVO: usize = 25;
const COL_DESCONT: usize = 26;

const HEADERS: [&str; 27] = [
    "N°",
    "Código",
    "Código_2",
    "SKU",
    "Nombre",
    "Descripción",
    "Categoría",
    "Marca",
    "Fabricante",
    "Proveedor",
    "Precio de compra (costo)",
    "Precio de venta",
    "Precio mayorista",
    "Precio sugerido",
    "Impuesto (%)",
    "Stock inicial",
    "Stock mínimo",
    "Stock máximo",
    "Punto de reorden",
    "Unidad",
    "Peso (kg)",
    "Código de barras",
    "Almacén",
    "Ubicación",
    "URL imagen",
    "Activo",
    "Descontinuado",
];

const PREVIEW_ROW_LIMIT: usize = 500;

// ── Cells / parsing ─────────────────────────────────────────────────────────

fn is_empty_cell(c: &Data) -> bool {
    matches!(c, Data::Empty)
}

fn format_float(f: f64) -> String {
    if f.is_nan() || f.is_infinite() {
        String::new()
    } else if f.fract() == 0.0 && f.abs() < 1e15 {
        format!("{}", f as i64)
    } else {
        format!("{}", f)
    }
}

fn cell_str(c: &Data) -> Option<String> {
    match c {
        Data::Empty => None,
        Data::String(s) => Some(s.trim().to_string()),
        Data::Float(f) => Some(format_float(*f)),
        Data::Int(i) => Some(i.to_string()),
        Data::Bool(b) => Some(if *b { "1".into() } else { "0".into() }),
        Data::DateTime(dt) => Some(dt.to_string()),
        _ => None,
    }
}

fn parse_flex_number(s: &str) -> Option<f64> {
    let s = s.trim().replace(' ', "");
    if s.is_empty() {
        return None;
    }
    if let Ok(n) = s.parse::<f64>() {
        return Some(n);
    }
    let has_comma = s.contains(',');
    let has_dot = s.contains('.');
    if has_comma && has_dot {
        let last_comma = s.rfind(',')?;
        let last_dot = s.rfind('.')?;
        if last_comma > last_dot {
            s.replace('.', "").replace(',', ".").parse::<f64>().ok()
        } else {
            s.replace(',', "").parse::<f64>().ok()
        }
    } else if has_comma {
        s.replace(',', ".").parse::<f64>().ok()
    } else {
        None
    }
}

fn parse_bool_value(s: &str) -> Option<bool> {
    match s.trim().to_lowercase().as_str() {
        "si" | "sí" | "yes" | "true" | "1" | "y" => Some(true),
        "no" | "false" | "0" | "n" => Some(false),
        _ => None,
    }
}

#[derive(Debug, Clone, Default)]
struct RawRow {
    row_number: usize,
    codigo: Option<String>,
    codigo_2: Option<String>,
    sku: Option<String>,
    nombre: Option<String>,
    descripcion: Option<String>,
    categoria: Option<String>,
    marca: Option<String>,
    fabricante: Option<String>,
    proveedor: Option<String>,
    costo: Option<f64>,
    precio: Option<f64>,
    mayorista: Option<f64>,
    sugerido: Option<f64>,
    impuesto: Option<f64>,
    stock: Option<i64>,
    stock_min: Option<i64>,
    stock_max: Option<i64>,
    reorder: Option<i64>,
    unidad: Option<String>,
    peso: Option<f64>,
    barcode: Option<String>,
    almacen: Option<String>,
    ubicacion: Option<String>,
    imagen: Option<String>,
    activo: Option<bool>,
    descontinuado: Option<bool>,
    errors: Vec<String>,
}

fn looks_like_header(row: &[Data]) -> bool {
    let get = |col: usize| row.get(col).and_then(cell_str).map(|s| s.to_lowercase());
    let sku = get(COL_SKU).unwrap_or_default();
    let nombre = get(COL_NOMBRE).unwrap_or_default();
    let codigo = get(COL_CODIGO).unwrap_or_default();
    row.len() >= 4
        && (sku == "sku" || nombre == "nombre" || codigo == "código" || codigo == "codigo")
}

fn parse_workbook(path: &str) -> Result<Vec<RawRow>, String> {
    let mut wb: Xlsx<_> =
        open_workbook(path).map_err(|e| format!("No es un archivo Excel (.xlsx) válido: {}", e))?;

    let sheet_names = wb.sheet_names().to_vec();
    let sheet_name = sheet_names
        .iter()
        .find(|n| n.eq_ignore_ascii_case(SHEET_PRODUCTOS))
        .or_else(|| sheet_names.iter().find(|n| n.to_lowercase().contains("product")))
        .ok_or_else(|| "La hoja 'Productos' no existe en el archivo.".to_string())?;

    let range = wb
        .worksheet_range(sheet_name)
        .map_err(|e| format!("Error al leer la hoja '{}': {}", sheet_name, e))?;

    let mut rows = Vec::new();
    let mut first_row = true;
    for (idx, cells) in range.rows().enumerate() {
        let excel_row = idx + 1;
        if first_row && looks_like_header(cells) {
            first_row = false;
            continue;
        }
        first_row = false;
        if cells.iter().all(is_empty_cell) {
            continue;
        }
        rows.push(extract_row(cells, excel_row));
    }
    Ok(rows)
}

fn cell_str_opt(cells: &[Data], col: usize) -> Option<String> {
    cells
        .get(col)
        .and_then(cell_str)
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
}

fn parse_number_value(
    errors: &mut Vec<String>,
    excel_row: usize,
    label: &str,
    cells: &[Data],
    col: usize,
) -> Option<f64> {
    match cells.get(col).and_then(cell_str) {
        None => None,
        Some(s) => match parse_flex_number(&s) {
            Some(n) if n < 0.0 => {
                errors.push(format!("Fila {}: {} no puede ser negativo.", excel_row, label));
                None
            }
            Some(n) => Some(n),
            None => {
                errors.push(format!("Fila {}: {} debe ser un número.", excel_row, label));
                None
            }
        },
    }
}

fn parse_integer_value(
    errors: &mut Vec<String>,
    excel_row: usize,
    label: &str,
    cells: &[Data],
    col: usize,
) -> Option<i64> {
    match cells.get(col).and_then(cell_str) {
        None => None,
        Some(s) => match parse_flex_number(&s) {
            Some(n) if n < 0.0 => {
                errors.push(format!("Fila {}: {} no puede ser negativo.", excel_row, label));
                None
            }
            Some(n) if n.fract() != 0.0 => {
                errors.push(format!("Fila {}: {} debe ser un número entero.", excel_row, label));
                None
            }
            Some(n) => Some(n as i64),
            None => {
                errors.push(format!("Fila {}: {} debe ser un número.", excel_row, label));
                None
            }
        },
    }
}

fn extract_row(cells: &[Data], excel_row: usize) -> RawRow {
    let mut errors: Vec<String> = Vec::new();

    let mut r = RawRow {
        row_number: excel_row,
        codigo: cell_str_opt(cells, COL_CODIGO),
        codigo_2: cell_str_opt(cells, COL_CODIGO2),
        sku: cell_str_opt(cells, COL_SKU),
        nombre: cell_str_opt(cells, COL_NOMBRE),
        descripcion: cell_str_opt(cells, COL_DESC),
        categoria: cell_str_opt(cells, COL_CATEGORIA),
        marca: cell_str_opt(cells, COL_MARCA),
        fabricante: cell_str_opt(cells, COL_FABRICANTE),
        proveedor: cell_str_opt(cells, COL_PROVEEDOR),
        unidad: cell_str_opt(cells, COL_UNIDAD),
        barcode: cell_str_opt(cells, COL_BARCODE),
        almacen: cell_str_opt(cells, COL_ALMACEN),
        ubicacion: cell_str_opt(cells, COL_UBICACION),
        imagen: cell_str_opt(cells, COL_IMAGEN),
        ..Default::default()
    };

    r.costo = parse_number_value(&mut errors, excel_row, "Precio de compra (costo)", cells, COL_COSTO);
    r.precio = parse_number_value(&mut errors, excel_row, "Precio de venta", cells, COL_PRECIO);
    r.mayorista = parse_number_value(&mut errors, excel_row, "Precio mayorista", cells, COL_MAYORISTA);
    r.sugerido = parse_number_value(&mut errors, excel_row, "Precio sugerido", cells, COL_SUGERIDO);
    r.impuesto = parse_number_value(&mut errors, excel_row, "Impuesto", cells, COL_IMPUESTO);
    r.peso = parse_number_value(&mut errors, excel_row, "Peso", cells, COL_PESO);
    r.stock = parse_integer_value(&mut errors, excel_row, "Stock inicial", cells, COL_STOCK);
    r.stock_min = parse_integer_value(&mut errors, excel_row, "Stock mínimo", cells, COL_STOCK_MIN);
    r.stock_max = parse_integer_value(&mut errors, excel_row, "Stock máximo", cells, COL_STOCK_MAX);
    r.reorder = parse_integer_value(&mut errors, excel_row, "Punto de reorden", cells, COL_REORDER);

    for (col, label, slot) in [
        (COL_ACTIVO, "Activo", &mut r.activo),
        (COL_DESCONT, "Descontinuado", &mut r.descontinuado),
    ] {
        match cells.get(col).and_then(cell_str) {
            None => {}
            Some(v) => match parse_bool_value(&v) {
                Some(b) => *slot = Some(b),
                None => errors.push(format!(
                    "Fila {}: {} debe ser Sí o No (se recibió '{}').",
                    excel_row, label, v
                )),
            },
        }
    }

    r.errors = errors;
    r
}

// ── Catalogs / masters ──────────────────────────────────────────────────────

struct CatalogProduct {
    id: i64,
    name: String,
    sku: String,
    barcode: Option<String>,
    oem: Option<String>,
    internal: Option<String>,
    cost_price: f64,
    stock: i64,
    min_stock: i64,
    max_stock: i64,
    reorder: i64,
    unit: String,
    weight: Option<f64>,
    warehouse_id: Option<i64>,
    storage_location_id: Option<i64>,
    image_url: Option<String>,
    is_active: bool,
    is_discontinued: bool,
}

struct Catalog {
    products: HashMap<i64, CatalogProduct>,
    by_sku: HashMap<String, i64>,
    by_oem: HashMap<String, i64>,
    by_internal: HashMap<String, i64>,
    by_barcode: HashMap<String, i64>,
    by_identifier: HashMap<String, i64>,
}

impl Catalog {
    fn find(&self, sku: &str, codigo: &str, barcode: &str) -> Option<i64> {
        if !sku.is_empty() {
            if let Some(id) = self.by_sku.get(&sku.to_lowercase()) {
                return Some(*id);
            }
        }
        if !codigo.is_empty() {
            let k = codigo.to_lowercase();
            if let Some(id) = self.by_oem.get(&k) {
                return Some(*id);
            }
            if let Some(id) = self.by_internal.get(&k) {
                return Some(*id);
            }
            if let Some(id) = self.by_identifier.get(&k) {
                return Some(*id);
            }
        }
        if !barcode.is_empty() {
            if let Some(id) = self.by_barcode.get(&barcode.to_lowercase()) {
                return Some(*id);
            }
        }
        None
    }
}

fn load_catalog(conn: &Connection) -> Result<Catalog, String> {
    let mut products = HashMap::new();
    let mut by_sku = HashMap::new();
    let mut by_oem = HashMap::new();
    let mut by_internal = HashMap::new();
    let mut by_barcode = HashMap::new();
    let mut by_identifier = HashMap::new();

    let mut stmt = conn
        .prepare(
            "SELECT id, name, sku, barcode, oem_number, internal_code, cost_price, stock_quantity,
                    min_stock_level, max_stock_level, reorder_point, unit, weight,
                    warehouse_id, storage_location_id, image_url, is_active, is_discontinued
             FROM products",
        )
        .map_err(|e| e.to_string())?;
    let mapped = stmt
        .query_map([], |row| {
            Ok(CatalogProduct {
                id: row.get(0)?,
                name: row.get(1)?,
                sku: row.get(2)?,
                barcode: row.get(3)?,
                oem: row.get(4)?,
                internal: row.get(5)?,
                cost_price: row.get(6)?,
                stock: row.get(7)?,
                min_stock: row.get(8)?,
                max_stock: row.get(9)?,
                reorder: row.get(10)?,
                unit: row.get(11)?,
                weight: row.get(12)?,
                warehouse_id: row.get(13)?,
                storage_location_id: row.get(14)?,
                image_url: row.get(15)?,
                is_active: row.get::<_, i64>(16)? != 0,
                is_discontinued: row.get::<_, i64>(17)? != 0,
            })
        })
        .map_err(|e| e.to_string())?;

    for row in mapped {
        let row = row.map_err(|e| e.to_string())?;
        by_sku.insert(row.sku.to_lowercase(), row.id);
        if let Some(o) = &row.oem {
            by_oem.insert(o.to_lowercase(), row.id);
        }
        if let Some(i) = &row.internal {
            by_internal.insert(i.to_lowercase(), row.id);
        }
        if let Some(b) = &row.barcode {
            by_barcode.insert(b.to_lowercase(), row.id);
        }
        products.insert(row.id, row);
    }

    let mut istmt = conn
        .prepare("SELECT product_id, identifier FROM product_identifiers")
        .map_err(|e| e.to_string())?;
    let imapped = istmt
        .query_map([], |row| Ok((row.get::<_, i64>(0)?, row.get::<_, String>(1)?)))
        .map_err(|e| e.to_string())?;
    for r in imapped {
        let (pid, ident) = r.map_err(|e| e.to_string())?;
        by_identifier.entry(ident.to_lowercase()).or_insert(pid);
    }

    Ok(Catalog {
        products,
        by_sku,
        by_oem,
        by_internal,
        by_barcode,
        by_identifier,
    })
}

struct Masters {
    categories: HashMap<String, i64>,
    category_names: Vec<String>,
    brands: HashMap<String, i64>,
    brand_names: Vec<String>,
    manufacturers: HashMap<String, i64>,
    manufacturer_names: Vec<String>,
    suppliers: HashMap<String, i64>,
    supplier_names: Vec<String>,
    warehouses_by_code: HashMap<String, i64>,
    warehouses_by_id: HashMap<i64, String>,
    locations_by_code: HashMap<String, (i64, i64)>,
}

fn name_map(conn: &Connection, table: &str, id_col: &str, name_col: &str) -> Result<(HashMap<String, i64>, Vec<String>), String> {
    let mut map = HashMap::new();
    let mut names = Vec::new();
    let sql = format!("SELECT {} , {} FROM {} WHERE is_active = 1", id_col, name_col, table);
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |row| Ok((row.get::<_, String>(1)?, row.get::<_, i64>(0)?)))
        .map_err(|e| e.to_string())?;
    for r in rows {
        let (name, id) = r.map_err(|e| e.to_string())?;
        names.push(name.clone());
        map.insert(name.to_lowercase(), id);
    }
    Ok((map, names))
}

fn load_masters(conn: &Connection) -> Result<Masters, String> {
    let (categories, category_names) = name_map(conn, "categories", "id", "name")?;
    let (brands, brand_names) = name_map(conn, "brands", "id", "name")?;
    let (manufacturers, manufacturer_names) = name_map(conn, "manufacturers", "id", "name")?;
    let (suppliers, supplier_names) = name_map(conn, "suppliers", "id", "company_name")?;

    let mut warehouses_by_code = HashMap::new();
    let mut warehouses_by_id = HashMap::new();
    {
        let mut stmt = conn
            .prepare("SELECT id, code FROM warehouses WHERE is_active = 1")
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map([], |row| Ok((row.get::<_, i64>(0)?, row.get::<_, String>(1)?)))
            .map_err(|e| e.to_string())?;
        for r in rows {
            let (id, code) = r.map_err(|e| e.to_string())?;
            warehouses_by_code.insert(code.to_lowercase(), id);
            warehouses_by_id.insert(id, code);
        }
    }

    let mut locations_by_code = HashMap::new();
    {
        let mut stmt = conn
            .prepare("SELECT id, warehouse_id, code FROM storage_locations WHERE is_active = 1")
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map([], |row| {
                Ok((row.get::<_, i64>(0)?, row.get::<_, i64>(1)?, row.get::<_, String>(2)?))
            })
            .map_err(|e| e.to_string())?;
        for r in rows {
            let (id, wid, code) = r.map_err(|e| e.to_string())?;
            locations_by_code.insert(code.to_lowercase(), (id, wid));
        }
    }

    Ok(Masters {
        categories,
        category_names,
        brands,
        brand_names,
        manufacturers,
        manufacturer_names,
        suppliers,
        supplier_names,
        warehouses_by_code,
        warehouses_by_id,
        locations_by_code,
    })
}

fn normalize_word(s: &str) -> String {
    let mut out = String::with_capacity(s.len());
    for c in s.chars().flat_map(|c| c.to_lowercase()) {
        out.push(match c {
            'á' | 'ä' | 'à' | 'â' | 'ã' => 'a',
            'é' | 'ë' | 'è' | 'ê' => 'e',
            'í' | 'ï' | 'ì' | 'î' => 'i',
            'ó' | 'ö' | 'ò' | 'ô' | 'õ' => 'o',
            'ú' | 'ü' | 'ù' | 'û' => 'u',
            'ñ' => 'n',
            other => other,
        });
    }
    out
}

fn suggestions(names: &[String], needle: &str, max: usize) -> Vec<String> {
    let n = normalize_word(needle);
    names
        .iter()
        .filter(|s| {
            let sl = normalize_word(s);
            sl.contains(&n) || n.contains(&sl)
        })
        .take(max)
        .cloned()
        .collect()
}

fn resolve_ref(
    map: &HashMap<String, i64>,
    names: &[String],
    value: &str,
    label: &str,
    row_number: usize,
    errors: &mut Vec<String>,
) -> Option<i64> {
    if let Some(id) = map.get(&value.to_lowercase()) {
        return Some(*id);
    }
    let mut msg = format!("Fila {}: {} '{}' no se encontró.", row_number, label, value);
    let hits = suggestions(names, value, 5);
    if !hits.is_empty() {
        msg.push_str(&format!(" ¿Se refiere a: {}?", hits.join(", ")));
    }
    errors.push(msg);
    None
}

// ── Parsed / validated rows ─────────────────────────────────────────────────

#[derive(Debug, Clone)]
struct ParsedRow {
    raw: RawRow,
    sku: String,
    matched: Option<i64>,
    category_id: Option<i64>,
    brand_id: Option<i64>,
    manufacturer_id: Option<i64>,
    supplier_id: Option<i64>,
    warehouse_id: Option<i64>,
    storage_location_id: Option<i64>,
    errors: Vec<String>,
}

fn resolve_store_scope(conn: &Connection, store_id: Option<i64>) -> Option<i64> {
    match store_id {
        Some(id) => Some(id),
        None => {
            if is_multi_store(conn) {
                None
            } else {
                default_store_id(conn)
            }
        }
    }
}

fn parse_rows(
    conn: &Connection,
    raw_rows: Vec<RawRow>,
    store_id: Option<i64>,
) -> Result<Vec<ParsedRow>, String> {
    let masters = load_masters(conn)?;
    let catalog = load_catalog(conn)?;
    let scope_warehouse = resolve_store_scope(conn, store_id);

    let mut seen_identities: HashSet<String> = HashSet::new();
    let mut parsed = Vec::new();

    for raw in raw_rows {
        let mut errors = raw.errors.clone();
        let row_number = raw.row_number;

        let sku = raw
            .sku
            .clone()
            .filter(|s| !s.trim().is_empty())
            .or_else(|| raw.codigo_2.clone())
            .or_else(|| raw.codigo.clone())
            .unwrap_or_default();
        let sku = sku.trim().to_string();

        let name = raw.nombre.clone().unwrap_or_default();
        if name.trim().is_empty() {
            errors.push(format!("Fila {}: El nombre es obligatorio.", row_number));
        }

        let identity = raw
            .sku
            .clone()
            .filter(|s| !s.trim().is_empty())
            .or_else(|| raw.codigo.clone())
            .or_else(|| raw.barcode.clone())
            .unwrap_or_default();
        let identity = identity.trim().to_lowercase();
        if identity.is_empty() {
            errors.push(format!(
                "Fila {}: Falta un identificador (SKU, Código o Código de barras).",
                row_number
            ));
        } else if seen_identities.contains(&identity) {
            errors.push(format!(
                "Fila {}: El identificador '{}' está duplicado dentro del archivo.",
                row_number, identity
            ));
        }
        seen_identities.insert(identity.clone());

        let codigo = raw.codigo.clone().unwrap_or_default();
        let barcode = raw.barcode.clone().unwrap_or_default();
        let matched = if errors.is_empty() || identity.is_empty() {
            catalog.find(&sku, &codigo, &barcode)
        } else {
            catalog.find(&identity, "", "")
        };

        if let Some(matched) = matched {
            let target = catalog.products.get(&matched).unwrap();
            if !sku.is_empty() {
                if let Some(other) = catalog.by_sku.get(&sku.to_lowercase()) {
                    if *other != matched {
                        errors.push(format!(
                            "Fila {}: El SKU '{}' ya está en uso por '{}'.",
                            row_number, sku, target.name
                        ));
                    }
                }
            }
        } else if !sku.is_empty() && catalog.by_sku.contains_key(&sku.to_lowercase()) {
            errors.push(format!(
                "Fila {}: El SKU '{}' ya está en uso por otro producto.",
                row_number, sku
            ));
        }

        let category_id = raw
            .categoria
            .as_deref()
            .map(|v| {
                resolve_ref(
                    &masters.categories,
                    &masters.category_names,
                    v,
                    "Categoría",
                    row_number,
                    &mut errors,
                )
                .unwrap_or(-1)
            })
            .filter(|id| *id >= 0);
        let brand_id = raw
            .marca
            .as_deref()
            .map(|v| {
                resolve_ref(
                    &masters.brands,
                    &masters.brand_names,
                    v,
                    "Marca",
                    row_number,
                    &mut errors,
                )
                .unwrap_or(-1)
            })
            .filter(|id| *id >= 0);
        let manufacturer_id = raw
            .fabricante
            .as_deref()
            .map(|v| {
                resolve_ref(
                    &masters.manufacturers,
                    &masters.manufacturer_names,
                    v,
                    "Fabricante",
                    row_number,
                    &mut errors,
                )
                .unwrap_or(-1)
            })
            .filter(|id| *id >= 0);
        let supplier_id = raw
            .proveedor
            .as_deref()
            .map(|v| {
                resolve_ref(
                    &masters.suppliers,
                    &masters.supplier_names,
                    v,
                    "Proveedor",
                    row_number,
                    &mut errors,
                )
                .unwrap_or(-1)
            })
            .filter(|id| *id >= 0);

        let mut warehouse_id: Option<i64> = None;
        if let Some(code) = &raw.almacen {
            match masters.warehouses_by_code.get(&code.to_lowercase()) {
                Some(id) => warehouse_id = Some(*id),
                None => {
                    errors.push(format!(
                        "Fila {}: Almacén '{}' no se encontró.",
                        row_number, code
                    ));
                }
            }
        }

        let mut storage_location_id: Option<i64> = None;
        if let Some(loc) = &raw.ubicacion {
            match masters.locations_by_code.get(&loc.to_lowercase()) {
                Some((id, _loc_wid)) => storage_location_id = Some(*id),
                None => {
                    errors.push(format!("Fila {}: Ubicación '{}' no se encontró.", row_number, loc));
                }
            }
        }

        if let Some(scope) = scope_warehouse {
            match warehouse_id {
                Some(wid) => {
                    if wid != scope {
                        if let Some(code) = masters.warehouses_by_id.get(&wid) {
                            errors.push(format!(
                                "Fila {}: El almacén '{}' no pertenece a la tienda seleccionada.",
                                row_number, code
                            ));
                        }
                    }
                }
                None => warehouse_id = Some(scope),
            }
            if storage_location_id.is_some() && warehouse_id.is_none() {
                warehouse_id = Some(scope);
            }
        }

        if warehouse_id.is_none() {
            if let Some(loc_code) = &raw.ubicacion {
                if let Some((_, loc_wid)) = masters.locations_by_code.get(&loc_code.to_lowercase()) {
                    warehouse_id = Some(*loc_wid);
                }
            }
        }

        if let (Some(loc_wid), Some(wid)) = (
            raw.ubicacion
                .as_deref()
                .and_then(|l| masters.locations_by_code.get(&l.to_lowercase()).map(|(_, w)| *w)),
            warehouse_id,
        ) {
            if loc_wid != wid {
                errors.push(format!(
                    "Fila {}: La ubicación '{}' no pertenece al almacén seleccionado.",
                    row_number,
                    raw.ubicacion.as_deref().unwrap_or("")
                ));
            }
        }

        parsed.push(ParsedRow {
            raw,
            sku,
            matched,
            category_id,
            brand_id,
            manufacturer_id,
            supplier_id,
            warehouse_id,
            storage_location_id,
            errors,
        });
    }

    Ok(parsed)
}

// ── Preview ─────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RowPreview {
    pub row_number: usize,
    pub sku: String,
    pub name: String,
    pub action: String,
    pub reason: Option<String>,
    pub errors: Vec<String>,
    pub current_stock: Option<i64>,
    pub new_stock: Option<i64>,
    pub stock_change: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RowError {
    pub row_number: usize,
    pub sku: String,
    pub message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportPreview {
    pub filename: String,
    pub store_id: Option<i64>,
    pub mode: String,
    pub total_rows: usize,
    pub insert_count: usize,
    pub update_count: usize,
    pub skip_count: usize,
    pub error_count: usize,
    pub stock_increase_count: usize,
    pub stock_decrease_count: usize,
    pub stock_unchanged_count: usize,
    pub rows: Vec<RowPreview>,
    pub error_rows: Vec<RowError>,
    pub rows_truncated: bool,
}

#[tauri::command]
pub fn preview_product_import(
    state: State<DbState>,
    path: String,
    mode: Option<String>,
    store_id: Option<i64>,
) -> Result<ImportPreview, String> {
    let conn = get_conn(&state)?;
    let mode = mode.unwrap_or_else(|| "append".into());
    let raw_rows = parse_workbook(&path)?;
    preview_internal(&conn, &path, &mode, store_id, raw_rows)
}

fn preview_internal(
    conn: &Connection,
    path: &str,
    mode: &str,
    store_id: Option<i64>,
    raw_rows: Vec<RawRow>,
) -> Result<ImportPreview, String> {
    let catalog = load_catalog(conn)?;
    let parsed = parse_rows(conn, raw_rows, store_id)?;
    let total_rows = parsed.len();

    let mut insert = 0usize;
    let mut update = 0usize;
    let mut skip = 0usize;
    let mut error = 0usize;
    let mut inc = 0usize;
    let mut dec = 0usize;
    let mut same = 0usize;
    let mut rows: Vec<RowPreview> = Vec::new();
    let mut error_rows: Vec<RowError> = Vec::new();
    let mut truncated = false;

    for p in &parsed {
        let current_stock = p.matched.and_then(|id| catalog.products.get(&id).map(|x| x.stock));
        let new_stock = p.raw.stock;
        let is_error = !p.errors.is_empty();

        let (action, reason): (String, Option<String>) = if is_error {
            ("error".into(), None)
        } else if let Some(id) = p.matched {
            if mode.eq_ignore_ascii_case("append") {
                let name = catalog.products.get(&id).map(|x| x.name.clone()).unwrap_or_default();
                (String::from("skip"), Some(format!("Ya existe: {}", name)))
            } else {
                (String::from("update"), None)
            }
        } else {
            (String::from("insert"), None)
        };

        let stock_change = if is_error {
            None
        } else {
            match (new_stock, current_stock) {
                (Some(new_val), Some(cur)) => Some(new_val - cur),
                (Some(new_val), None) => Some(new_val),
                (None, _) => None,
            }
        };
        match stock_change {
            Some(c) if c > 0 => inc += 1,
            Some(c) if c < 0 => dec += 1,
            _ => same += 1,
        }

        match action.as_str() {
            "insert" => insert += 1,
            "update" => update += 1,
            "skip" => skip += 1,
            _ => error += 1,
        }

        if is_error {
            for e in &p.errors {
                error_rows.push(RowError {
                    row_number: p.raw.row_number,
                    sku: p.sku.clone(),
                    message: e.clone(),
                });
            }
        }

        if rows.len() < PREVIEW_ROW_LIMIT {
            rows.push(RowPreview {
                row_number: p.raw.row_number,
                sku: p.sku.clone(),
                name: p
                    .matched
                    .and_then(|id| catalog.products.get(&id).map(|x| x.name.clone()))
                    .unwrap_or_else(|| p.raw.nombre.clone().unwrap_or_default()),
                action,
                reason,
                errors: p.errors.clone(),
                current_stock,
                new_stock,
                stock_change,
            });
        } else if !truncated {
            truncated = true;
        }
    }

    let filename = std::path::Path::new(path)
        .file_name()
        .map(|s| s.to_string_lossy().to_string())
        .unwrap_or_else(|| path.to_string());

    Ok(ImportPreview {
        filename,
        store_id,
        mode: mode.to_string(),
        total_rows,
        insert_count: insert,
        update_count: update,
        skip_count: skip,
        error_count: error,
        stock_increase_count: inc,
        stock_decrease_count: dec,
        stock_unchanged_count: same,
        rows,
        error_rows,
        rows_truncated: truncated,
    })
}

// ── Execute ─────────────────────────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportResult {
    pub ok: bool,
    pub filename: String,
    pub mode: String,
    pub total_rows: usize,
    pub inserted: usize,
    pub updated: usize,
    pub skipped: usize,
    pub errors: usize,
    pub stock_increased: usize,
    pub stock_decreased: usize,
    pub error_rows: Vec<RowError>,
    pub import_id: Option<i64>,
    pub message: Option<String>,
}

#[tauri::command]
pub fn execute_product_import(
    state: State<DbState>,
    path: String,
    mode: Option<String>,
    store_id: Option<i64>,
    created_by: Option<i64>,
) -> Result<ImportResult, String> {
    let conn = get_conn(&state)?;
    let mode = mode.unwrap_or_else(|| "append".into());
    execute_internal(&conn, &path, &mode, store_id, created_by)
}

fn execute_internal(
    conn: &Connection,
    path: &str,
    mode: &str,
    store_id: Option<i64>,
    created_by: Option<i64>,
) -> Result<ImportResult, String> {
    let raw = parse_workbook(path)?;
    let parsed = parse_rows(conn, raw, store_id)?;
    let catalog = load_catalog(conn)?;

    let mut error_rows: Vec<RowError> = Vec::new();
    let mut any_error = false;
    for p in &parsed {
        if !p.errors.is_empty() {
            any_error = true;
            for e in &p.errors {
                error_rows.push(RowError {
                    row_number: p.raw.row_number,
                    sku: p.sku.clone(),
                    message: e.clone(),
                });
            }
        }
    }

    let filename = std::path::Path::new(path)
        .file_name()
        .map(|s| s.to_string_lossy().to_string())
        .unwrap_or_else(|| path.to_string());

    if any_error {
        return Ok(ImportResult {
            ok: false,
            filename,
            mode: mode.to_string(),
            total_rows: parsed.len(),
            inserted: 0,
            updated: 0,
            skipped: 0,
            errors: error_rows.len(),
            stock_increased: 0,
            stock_decreased: 0,
            error_rows,
            import_id: None,
            message: Some("La importación se canceló: se encontraron errores de validación.".into()),
        });
    }

    let reference_id = format!("import-{}", uuid::Uuid::new_v4());
    let mut inserted = 0usize;
    let mut updated = 0usize;
    let mut skipped = 0usize;
    let mut inc = 0usize;
    let mut dec = 0usize;

    conn.execute_batch("BEGIN IMMEDIATE").map_err(|e| e.to_string())?;
    let tx_result: std::result::Result<(), String> = (|| {
        for p in &parsed {
            if let Some(id) = p.matched {
                if mode.eq_ignore_ascii_case("append") {
                    skipped += 1;
                    continue;
                }
                let existing = catalog.products.get(&id).unwrap();

                let new_stock = p.raw.stock.unwrap_or(existing.stock);
                let old_cost = existing.cost_price;
                let new_cost = p.raw.costo.unwrap_or(old_cost);

                let new_barcode = if p.raw.barcode.is_some() {
                    p.raw.barcode.as_deref()
                } else {
                    existing.barcode.as_deref()
                };
                let new_oem = if p.raw.codigo.is_some() {
                    p.raw.codigo.as_deref()
                } else {
                    existing.oem.as_deref()
                };
                let new_internal = if p.raw.codigo_2.is_some() {
                    p.raw.codigo_2.as_deref()
                } else {
                    existing.internal.as_deref()
                };
                let new_category = p.category_id.or(existing_category_id(&conn, id)?);
                let new_brand = p.brand_id.or(existing_brand_id(&conn, id)?);
                let new_manufacturer = p.manufacturer_id.or(existing_manufacturer_id(&conn, id)?);
                let new_supplier = p.supplier_id.or(existing_supplier_id(&conn, id)?);
                let new_warehouse = p.warehouse_id.or(existing.warehouse_id);
                let new_location = p.storage_location_id.or(existing.storage_location_id);
                let min_stock = p.raw.stock_min.unwrap_or(existing.min_stock);
                let max_stock = p.raw.stock_max.unwrap_or(existing.max_stock);
                let reorder = p.raw.reorder.unwrap_or(existing.reorder);
                let unit = p.raw.unidad.clone().unwrap_or_else(|| existing.unit.clone());
                let weight = p
                    .raw
                    .peso
                    .map(Some)
                    .unwrap_or(existing.weight);
                let image = p
                    .raw
                    .imagen
                    .as_deref()
                    .map(|s| s.to_string())
                    .or_else(|| existing.image_url.clone());
                let desc = if p.raw.descripcion.is_some() {
                    p.raw.descripcion.clone()
                } else {
                    existing_desc(conn, id)?
                };
                let is_active = p.raw.activo.unwrap_or(existing.is_active);
                let is_discontinued = p.raw.descontinuado.unwrap_or(existing.is_discontinued);
                let name = if p.raw.nombre.is_some() {
                    p.raw.nombre.clone().unwrap()
                } else {
                    existing.name.clone()
                };
                let sku_val = if p.raw.sku.is_some() {
                    p.sku.clone()
                } else {
                    existing.sku.clone()
                };

                conn.execute(
                    "UPDATE products SET name=?1, sku=?2, barcode=?3, oem_number=?4, internal_code=?5,
                        description=?6, category_id=?7, brand_id=?8, manufacturer_id=?9, supplier_id=?10,
                        cost_price=?11, sale_price=?12, wholesale_price=?13, suggested_retail_price=?14,
                        tax_rate=?15, stock_quantity=?16, min_stock_level=?17, max_stock_level=?18,
                        reorder_point=?19, unit=?20, weight=?21, warehouse_id=?22, storage_location_id=?23,
                        image_url=?24, is_active=?25, is_discontinued=?26, updated_at=datetime('now')
                     WHERE id=?27",
                    params![
                        name, sku_val, new_barcode, new_oem, new_internal,
                        desc, new_category, new_brand, new_manufacturer, new_supplier,
                        new_cost,
                        p.raw.precio.unwrap_or(existing_sale_price(&conn, id)?),
                        p.raw.mayorista.unwrap_or(existing_wholesale(&conn, id)?),
                        p.raw.sugerido.unwrap_or(existing_suggested(&conn, id)?),
                        p.raw.impuesto.unwrap_or(existing_tax(&conn, id)?),
                        new_stock, min_stock, max_stock, reorder, unit, weight,
                        new_warehouse, new_location, image,
                        is_active, is_discontinued,
                        id
                    ],
                )
                .map_err(|e| e.to_string())?;

                if p.raw.costo.is_some() && (new_cost - old_cost).abs() > f64::EPSILON {
                    conn.execute(
                        "INSERT INTO product_cost_history (product_id, supplier_id, purchase_order_id, old_cost, new_cost, quantity, created_by)
                         VALUES (?1, ?2, NULL, ?3, ?4, ?5, ?6)",
                        params![id, p.supplier_id, old_cost, new_cost, existing.stock, created_by],
                    )
                    .map_err(|e| e.to_string())?;
                }

                if let Some(new_val) = p.raw.stock {
                    let diff = new_val - existing.stock;
                    if diff != 0 {
                        conn.execute(
                            "INSERT INTO inventory_movements (product_id, warehouse_id, quantity, type, reference_type, reference_id, notes, created_by)
                             VALUES (?1, ?2, ?3, 'adjustment', 'import', ?4, 'Importación Excel', ?5)",
                            params![id, new_warehouse, diff, &reference_id, created_by],
                        )
                        .map_err(|e| e.to_string())?;
                        if diff > 0 {
                            inc += 1;
                        } else {
                            dec += 1;
                        }
                    }
                }
                if p.raw.codigo.is_some() {
                    upsert_identifier(&conn, id, p.raw.codigo.as_deref().unwrap_or(""), "oem")?;
                }
                if p.raw.codigo_2.is_some() {
                    upsert_identifier(&conn, id, p.raw.codigo_2.as_deref().unwrap_or(""), "alternate")?;
                }
                updated += 1;
            } else {
                let new_stock = p.raw.stock.unwrap_or(0);
                let is_active = p.raw.activo.unwrap_or(true);
                let is_discontinued = p.raw.descontinuado.unwrap_or(false);
                let desc = p.raw.descripcion.clone();
                let codigo = p.raw.codigo.clone();
                let codigo_2 = p.raw.codigo_2.clone();

                conn.execute(
                    "INSERT INTO products (name, sku, barcode, oem_number, internal_code, description,
                        category_id, brand_id, manufacturer_id, supplier_id, cost_price, sale_price,
                        wholesale_price, suggested_retail_price, tax_rate, stock_quantity,
                        min_stock_level, max_stock_level, reorder_point, unit, weight,
                        warehouse_id, storage_location_id, image_url, is_active, is_discontinued)
                     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16,
                        ?17, ?18, ?19, ?20, ?21, ?22, ?23, ?24, ?25, ?26)",
                    params![
                        p.raw.nombre.clone().unwrap_or_default(),
                        p.sku,
                        p.raw.barcode,
                        codigo.clone(),
                        codigo_2.clone(),
                        desc,
                        p.category_id,
                        p.brand_id,
                        p.manufacturer_id,
                        p.supplier_id,
                        p.raw.costo.unwrap_or(0.0),
                        p.raw.precio.unwrap_or(0.0),
                        p.raw.mayorista.unwrap_or(0.0),
                        p.raw.sugerido.unwrap_or(0.0),
                        p.raw.impuesto.unwrap_or(0.0),
                        new_stock,
                        p.raw.stock_min.unwrap_or(0),
                        p.raw.stock_max.unwrap_or(0),
                        p.raw.reorder.unwrap_or(0),
                        p.raw.unidad.clone().unwrap_or_else(|| "pcs".into()),
                        p.raw.peso,
                        p.warehouse_id,
                        p.storage_location_id,
                        p.raw.imagen,
                        is_active,
                        is_discontinued,
                    ],
                )
                .map_err(|e| e.to_string())?;
                let product_id = conn.last_insert_rowid();

                if let Some(c) = &codigo {
                    upsert_identifier(&conn, product_id, c, "oem")?;
                }
                if let Some(c) = &codigo_2 {
                    upsert_identifier(&conn, product_id, c, "alternate")?;
                }

                if new_stock > 0 {
                    conn.execute(
                        "INSERT INTO inventory_movements (product_id, warehouse_id, quantity, type, reference_type, reference_id, notes, created_by)
                         VALUES (?1, ?2, ?3, 'adjustment', 'import', ?4, 'Importación Excel', ?5)",
                        params![product_id, p.warehouse_id, new_stock, &reference_id, created_by],
                    )
                    .map_err(|e| e.to_string())?;
                    inc += 1;
                } else if new_stock < 0 {
                    dec += 1;
                }
                inserted += 1;
            }
        }
        Ok(())
    })();

    match tx_result {
        Ok(_) => {
            conn.execute_batch("COMMIT").map_err(|e| {
                let _ = conn.execute_batch("ROLLBACK");
                e.to_string()
            })?;
        }
        Err(e) => {
            let _ = conn.execute_batch("ROLLBACK");
            return Err(e);
        }
    }

    let import_id = conn
        .execute(
            "INSERT INTO import_history (filename, import_mode, total_rows, inserted, updated, skipped, errors,
                stock_increased, stock_decreased, created_by)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
            params![
                filename,
                mode,
                parsed.len(),
                inserted,
                updated,
                skipped,
                0_i64,
                inc,
                dec,
                created_by
            ],
        )
        .map_err(|e| e.to_string())?;
    let import_id = if import_id > 0 {
        Some(conn.last_insert_rowid())
    } else {
        None
    };

    create_import_audit_log(
        &conn,
        created_by,
        "inventory_import",
        import_id,
        &filename,
        &mode,
        inserted,
        updated,
        skipped,
    )
    .map_err(|e| e.to_string())?;

    Ok(ImportResult {
        ok: true,
        filename,
        mode: mode.to_string(),
        total_rows: parsed.len(),
        inserted,
        updated,
        skipped,
        errors: 0,
        stock_increased: inc,
        stock_decreased: dec,
        error_rows: Vec::new(),
        import_id,
        message: None,
    })
}

fn existing_category_id(conn: &Connection, id: i64) -> Result<Option<i64>, String> {
    conn.query_row("SELECT category_id FROM products WHERE id = ?1", params![id], |r| r.get(0))
        .map_err(|e| e.to_string())
}
fn existing_brand_id(conn: &Connection, id: i64) -> Result<Option<i64>, String> {
    conn.query_row("SELECT brand_id FROM products WHERE id = ?1", params![id], |r| r.get(0))
        .map_err(|e| e.to_string())
}
fn existing_manufacturer_id(conn: &Connection, id: i64) -> Result<Option<i64>, String> {
    conn.query_row("SELECT manufacturer_id FROM products WHERE id = ?1", params![id], |r| r.get(0))
        .map_err(|e| e.to_string())
}
fn existing_supplier_id(conn: &Connection, id: i64) -> Result<Option<i64>, String> {
    conn.query_row("SELECT supplier_id FROM products WHERE id = ?1", params![id], |r| r.get(0))
        .map_err(|e| e.to_string())
}
fn existing_sale_price(conn: &Connection, id: i64) -> Result<f64, String> {
    conn.query_row("SELECT sale_price FROM products WHERE id = ?1", params![id], |r| r.get(0))
        .map_err(|e| e.to_string())
}
fn existing_wholesale(conn: &Connection, id: i64) -> Result<f64, String> {
    conn.query_row("SELECT wholesale_price FROM products WHERE id = ?1", params![id], |r| r.get(0))
        .map_err(|e| e.to_string())
}
fn existing_suggested(conn: &Connection, id: i64) -> Result<f64, String> {
    conn.query_row("SELECT suggested_retail_price FROM products WHERE id = ?1", params![id], |r| r.get(0))
        .map_err(|e| e.to_string())
}
fn existing_tax(conn: &Connection, id: i64) -> Result<f64, String> {
    conn.query_row("SELECT tax_rate FROM products WHERE id = ?1", params![id], |r| r.get(0))
        .map_err(|e| e.to_string())
}
fn existing_desc(conn: &Connection, id: i64) -> Result<Option<String>, String> {
    conn.query_row("SELECT description FROM products WHERE id = ?1", params![id], |r| r.get(0))
        .map_err(|e| e.to_string())
}

fn upsert_identifier(conn: &Connection, product_id: i64, identifier: &str, i_type: &str) -> Result<(), String> {
    if identifier.trim().is_empty() {
        return Ok(());
    }
    conn.execute(
        "INSERT OR IGNORE INTO product_identifiers (product_id, identifier, identifier_type) VALUES (?1, ?2, ?3)",
        params![product_id, identifier, i_type],
    )
    .map(|_| ())
    .map_err(|e| e.to_string())
}

fn create_import_audit_log(
    conn: &Connection,
    created_by: Option<i64>,
    action: &str,
    entity_id: Option<i64>,
    filename: &str,
    mode: &str,
    inserted: usize,
    updated: usize,
    skipped: usize,
) -> Result<(), String> {
    let details = serde_json::json!({
        "filename": filename,
        "mode": mode,
        "inserted": inserted,
        "updated": updated,
        "skipped": skipped,
    })
    .to_string();
    conn.execute(
        "INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, severity)
         VALUES (?1, ?2, 'inventory', ?3, ?4, 'info')",
        params![
            created_by,
            action,
            entity_id.map(|id| id.to_string()),
            details
        ],
    )
    .map(|_| ())
    .map_err(|e| e.to_string())
}

fn export_history(conn: &Connection, created_by: Option<i64>, filename: &str, scope: &str, total: usize) -> Result<(), String> {
    let details = serde_json::json!({ "filename": filename, "scope": scope, "products": total }).to_string();
    conn.execute(
        "INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, severity)
         VALUES (?1, 'inventory_export', 'inventory', NULL, ?2, 'info')",
        params![created_by, details],
    )
    .map(|_| ())
    .map_err(|e| e.to_string())
}

// ── Excel writing ───────────────────────────────────────────────────────────

fn write_header(ws: &mut rust_xlsxwriter::Worksheet, fmt: &rust_xlsxwriter::Format) -> Result<(), String> {
    for (col, h) in HEADERS.iter().enumerate() {
        ws.write_string_with_format(0, col as u16, *h, fmt)
            .map_err(|e| e.to_string())?;
    }
    ws.set_freeze_panes(1, 0).map_err(|e| e.to_string())?;
    Ok(())
}

fn column_widths(ws: &mut rust_xlsxwriter::Worksheet) -> Result<(), String> {
    let widths: [(u16, f64); 27] = [
        (0, 5.0), (1, 14.0), (2, 14.0), (3, 14.0), (4, 42.0), (5, 42.0),
        (6, 16.0), (7, 16.0), (8, 16.0), (9, 22.0), (10, 14.0), (11, 14.0),
        (12, 14.0), (13, 14.0), (14, 12.0), (15, 12.0), (16, 12.0), (17, 12.0),
        (18, 12.0), (19, 10.0), (20, 10.0), (21, 14.0), (22, 12.0), (23, 18.0),
        (24, 18.0), (25, 10.0), (26, 14.0),
    ];
    for (col, w) in widths {
        ws.set_column_width(col, w).map_err(|e| e.to_string())?;
    }
    ws.set_row_height(0, 30.0).map_err(|e| e.to_string())?;
    Ok(())
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportResult {
    pub path: String,
    pub filename: String,
    pub product_count: usize,
}

fn write_masters_sheet(conn: &Connection, wb: &mut rust_xlsxwriter::Workbook) -> Result<(), String> {
    let ws = wb
        .add_worksheet()
        .set_name("Maestros de referencia")
        .map_err(|e| e.to_string())?;
    let bold = rust_xlsxwriter::Format::new()
        .set_bold()
        .set_background_color(rust_xlsxwriter::Color::Gray);
    ws.write_string_with_format(0, 0, "Tabla destino", &bold).map_err(|e| e.to_string())?;
    ws.write_string_with_format(0, 1, "Campo", &bold).map_err(|e| e.to_string())?;
    ws.write_string_with_format(0, 2, "Valor", &bold).map_err(|e| e.to_string())?;
    ws.set_column_width(0, 24.0).map_err(|e| e.to_string())?;
    ws.set_column_width(1, 16.0).map_err(|e| e.to_string())?;
    ws.set_column_width(2, 42.0).map_err(|e| e.to_string())?;
    ws.set_freeze_panes(1, 0).map_err(|e| e.to_string())?;

    let mut row = 1u32;
    for (table, _col, names) in [
        ("categories", "name", masters_names(conn, "categories", "name")?),
        ("brands", "name", masters_names(conn, "brands", "name")?),
        ("manufacturers", "name", masters_names(conn, "manufacturers", "name")?),
        ("suppliers", "company_name", masters_names(conn, "suppliers", "company_name")?),
        ("warehouses", "code", masters_names(conn, "warehouses", "code")?),
        ("storage_locations", "code", masters_names(conn, "storage_locations", "code")?),
    ] {
        for name in names {
            ws.write_string(row, 0, table).map_err(|e| e.to_string())?;
            ws.write_string(row, 1, "name").map_err(|e| e.to_string())?;
            ws.write_string(row, 2, &name).map_err(|e| e.to_string())?;
            row += 1;
        }
    }
    Ok(())
}

fn masters_names(conn: &Connection, table: &str, col: &str) -> Result<Vec<String>, String> {
    let sql = format!("SELECT {} FROM {} WHERE is_active = 1 ORDER BY {}", col, table, col);
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |r| r.get::<_, String>(0))
        .map_err(|e| e.to_string())?;
    let mut out = Vec::new();
    for r in rows {
        out.push(r.map_err(|e| e.to_string())?);
    }
    Ok(out)
}

#[derive(Debug, Clone)]
struct ExportProduct {
    codigo: String,
    codigo_2: String,
    sku: String,
    name: String,
    descripcion: Option<String>,
    categoria: Option<String>,
    marca: Option<String>,
    fabricante: Option<String>,
    proveedor: Option<String>,
    costo: f64,
    precio: f64,
    mayorista: f64,
    sugerido: f64,
    impuesto: f64,
    stock: i64,
    min_stock: i64,
    max_stock: i64,
    reorder: i64,
    unidad: String,
    peso: Option<f64>,
    barcode: Option<String>,
    almacen: Option<String>,
    ubicacion: Option<String>,
    imagen: Option<String>,
    activo: bool,
    descontinuado: bool,
}

fn load_export_products(conn: &Connection, scope: &str) -> Result<Vec<ExportProduct>, String> {
    let where_clause = if scope.eq_ignore_ascii_case("all") {
        ""
    } else {
        "WHERE p.is_active = 1"
    };
    let sql = format!(
        "SELECT p.id, p.name, p.sku, p.barcode, p.oem_number, p.internal_code, p.description,
            c.name AS categoria, b.name AS marca, m.name AS fabricante, s.company_name AS proveedor,
            p.cost_price, p.sale_price, p.wholesale_price, p.suggested_retail_price, p.tax_rate,
            p.stock_quantity, p.min_stock_level, p.max_stock_level, p.reorder_point, p.unit, p.weight,
            w.code AS almacen, sl.code AS ubicacion, p.image_url, p.is_active, p.is_discontinued
         FROM products p
         LEFT JOIN categories c ON c.id = p.category_id
         LEFT JOIN brands b ON b.id = p.brand_id
         LEFT JOIN manufacturers m ON m.id = p.manufacturer_id
         LEFT JOIN suppliers s ON s.id = p.supplier_id
         LEFT JOIN warehouses w ON w.id = p.warehouse_id
         LEFT JOIN storage_locations sl ON sl.id = p.storage_location_id
         {} ORDER BY p.sku",
        where_clause
    );
    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map([], |row| {
            Ok((
                row.get::<_, i64>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, String>(2)?,
                row.get::<_, Option<String>>(3)?,
                row.get::<_, Option<String>>(4)?,
                row.get::<_, Option<String>>(5)?,
                row.get::<_, Option<String>>(6)?,
                row.get::<_, Option<String>>(7)?,
                row.get::<_, Option<String>>(8)?,
                row.get::<_, Option<String>>(9)?,
                row.get::<_, Option<String>>(10)?,
                row.get::<_, f64>(11)?,
                row.get::<_, f64>(12)?,
                row.get::<_, f64>(13)?,
                row.get::<_, f64>(14)?,
                row.get::<_, f64>(15)?,
                row.get::<_, i64>(16)?,
                row.get::<_, i64>(17)?,
                row.get::<_, i64>(18)?,
                row.get::<_, i64>(19)?,
                row.get::<_, String>(20)?,
                row.get::<_, Option<f64>>(21)?,
                row.get::<_, Option<String>>(22)?,
                row.get::<_, Option<String>>(23)?,
                row.get::<_, Option<String>>(24)?,
                row.get::<_, i64>(25)?,
                row.get::<_, i64>(26)?,
            ))
        })
        .map_err(|e| e.to_string())?;

    let mut alt_by_product: HashMap<i64, String> = HashMap::new();
    if let Ok(mut istmt) = conn.prepare(
        "SELECT product_id, identifier FROM product_identifiers WHERE identifier_type = 'alternate' ORDER BY id",
    ) {
        let imapped = istmt
            .query_map([], |row| Ok((row.get::<_, i64>(0)?, row.get::<_, String>(1)?)))
            .map_err(|e| e.to_string())?;
        for r in imapped {
            let (pid, ident) = r.map_err(|e| e.to_string())?;
            alt_by_product.entry(pid).or_insert(ident);
        }
    }

    let mut out = Vec::new();
    for r in rows {
        let (id, name, sku, barcode, oem, internal, desc, categoria, marca, fabricante, proveedor,
             costo, precio, mayorista, sugerido, impuesto, stock, min_stock, max_stock, reorder,
             unidad, peso, almacen, ubicacion, imagen, activo, descontinuado) = r.map_err(|e| e.to_string())?;

        let codigo = oem.clone().or_else(|| internal.clone()).unwrap_or_default();
        let codigo_2 = alt_by_product
            .get(&id)
            .cloned()
            .or_else(|| {
                internal
                    .clone()
                    .filter(|i| i != &codigo && !codigo.is_empty())
                    .or_else(|| if codigo.is_empty() { internal.clone() } else { None })
            })
            .unwrap_or_default();

        out.push(ExportProduct {
            codigo,
            codigo_2,
            sku,
            name,
            descripcion: desc,
            categoria,
            marca,
            fabricante,
            proveedor,
            costo,
            precio,
            mayorista,
            sugerido,
            impuesto,
            stock,
            min_stock,
            max_stock,
            reorder,
            unidad,
            peso,
            barcode,
            almacen,
            ubicacion,
            imagen,
            activo: activo != 0,
            descontinuado: descontinuado != 0,
        });
    }
    Ok(out)
}

fn build_export_workbook(conn: &Connection, scope: &str) -> Result<rust_xlsxwriter::Workbook, String> {
    let products = load_export_products(conn, scope)?;
    let mut wb = rust_xlsxwriter::Workbook::new();
    let ws = wb
        .add_worksheet()
        .set_name(SHEET_PRODUCTOS)
        .map_err(|e| e.to_string())?;
    let mut ws = ws;
    let header_fmt = rust_xlsxwriter::Format::new()
        .set_bold()
        .set_background_color(rust_xlsxwriter::Color::Gray)
        .set_align(rust_xlsxwriter::FormatAlign::Center);
    write_header(&mut ws, &header_fmt)?;
    column_widths(&mut ws)?;

    for (i, p) in products.iter().enumerate() {
        let row = (i + 1) as u32;
        ws.write_number(row, COL_NUM as u16, (i + 1) as f64).map_err(|e| e.to_string())?;
        ws.write_string(row, COL_CODIGO as u16, &p.codigo).map_err(|e| e.to_string())?;
        ws.write_string(row, COL_CODIGO2 as u16, &p.codigo_2).map_err(|e| e.to_string())?;
        ws.write_string(row, COL_SKU as u16, &p.sku).map_err(|e| e.to_string())?;
        ws.write_string(row, COL_NOMBRE as u16, &p.name).map_err(|e| e.to_string())?;
        ws.write_string(row, COL_DESC as u16, p.descripcion.as_deref().unwrap_or(""))
            .map_err(|e| e.to_string())?;
        ws.write_string(row, COL_CATEGORIA as u16, p.categoria.as_deref().unwrap_or(""))
            .map_err(|e| e.to_string())?;
        ws.write_string(row, COL_MARCA as u16, p.marca.as_deref().unwrap_or(""))
            .map_err(|e| e.to_string())?;
        ws.write_string(row, COL_FABRICANTE as u16, p.fabricante.as_deref().unwrap_or(""))
            .map_err(|e| e.to_string())?;
        ws.write_string(row, COL_PROVEEDOR as u16, p.proveedor.as_deref().unwrap_or(""))
            .map_err(|e| e.to_string())?;
        ws.write_number(row, COL_COSTO as u16, p.costo).map_err(|e| e.to_string())?;
        ws.write_number(row, COL_PRECIO as u16, p.precio).map_err(|e| e.to_string())?;
        ws.write_number(row, COL_MAYORISTA as u16, p.mayorista).map_err(|e| e.to_string())?;
        ws.write_number(row, COL_SUGERIDO as u16, p.sugerido).map_err(|e| e.to_string())?;
        ws.write_number(row, COL_IMPUESTO as u16, p.impuesto).map_err(|e| e.to_string())?;
        ws.write_number(row, COL_STOCK as u16, p.stock as f64).map_err(|e| e.to_string())?;
        ws.write_number(row, COL_STOCK_MIN as u16, p.min_stock as f64).map_err(|e| e.to_string())?;
        ws.write_number(row, COL_STOCK_MAX as u16, p.max_stock as f64).map_err(|e| e.to_string())?;
        ws.write_number(row, COL_REORDER as u16, p.reorder as f64).map_err(|e| e.to_string())?;
        ws.write_string(row, COL_UNIDAD as u16, &p.unidad).map_err(|e| e.to_string())?;
        if let Some(w) = p.peso {
            ws.write_number(row, COL_PESO as u16, w).map_err(|e| e.to_string())?;
        }
        ws.write_string(row, COL_BARCODE as u16, p.barcode.as_deref().unwrap_or(""))
            .map_err(|e| e.to_string())?;
        ws.write_string(row, COL_ALMACEN as u16, p.almacen.as_deref().unwrap_or(""))
            .map_err(|e| e.to_string())?;
        ws.write_string(row, COL_UBICACION as u16, p.ubicacion.as_deref().unwrap_or(""))
            .map_err(|e| e.to_string())?;
        ws.write_string(row, COL_IMAGEN as u16, p.imagen.as_deref().unwrap_or(""))
            .map_err(|e| e.to_string())?;
        ws.write_string(row, COL_ACTIVO as u16, if p.activo { "Sí" } else { "No" })
            .map_err(|e| e.to_string())?;
        ws.write_string(row, COL_DESCONT as u16, if p.descontinuado { "Sí" } else { "No" })
            .map_err(|e| e.to_string())?;
    }

    write_masters_sheet(conn, &mut wb)?;
    Ok(wb)
}

#[tauri::command]
pub fn export_products_xlsx(
    state: State<DbState>,
    path: String,
    scope: Option<String>,
    created_by: Option<i64>,
) -> Result<ExportResult, String> {
    let conn = get_conn(&state)?;
    let scope = scope.unwrap_or_else(|| "active".into());
    let mut wb = build_export_workbook(&conn, &scope)?;

    if let Some(parent) = std::path::Path::new(&path).parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    wb.save(&path).map_err(|e| format!("No se pudo guardar el archivo: {}", e))?;

    let count = {
        let products = load_export_products(&conn, &scope)?;
        products.len()
    };
    let filename = std::path::Path::new(&path)
        .file_name()
        .map(|s| s.to_string_lossy().to_string())
        .unwrap_or_else(|| path.clone());
    export_history(&conn, created_by, &filename, &scope, count)?;

    Ok(ExportResult {
        path: path.clone(),
        filename,
        product_count: count,
    })
}

#[tauri::command]
pub fn export_products_template(
    state: State<DbState>,
    path: String,
) -> Result<ExportResult, String> {
    let conn = get_conn(&state)?;
    let mut wb = rust_xlsxwriter::Workbook::new();
    let ws = wb
        .add_worksheet()
        .set_name(SHEET_PRODUCTOS)
        .map_err(|e| e.to_string())?;
    let header_fmt = rust_xlsxwriter::Format::new()
        .set_bold()
        .set_background_color(rust_xlsxwriter::Color::Gray)
        .set_align(rust_xlsxwriter::FormatAlign::Center);
    let mut ws = ws;
    write_header(&mut ws, &header_fmt)?;
    column_widths(&mut ws)?;

    let example: [[&str; 27]; 2] = [
        [
            "1", "860067", "", "860067", "MUÑON DIREC. TOY COROLLA/IPSU 84/95", "",
            "Dirección", "Toyota Genuine", "", "Autorepuestos Demo SRL",
            "24.50", "35.00", "29.75", "40.25", "0",
            "4", "1", "12", "2", "pcs", "", "", "WH-001", "WH-001-A-01-A-01", "", "Sí", "No",
        ],
        [
            "2", "860068", "124846", "124846", "TERMINAL DE DIRECCION IPSU/CALDINA L", "",
            "Dirección", "Toyota Genuine", "", "Autorepuestos Demo SRL",
            "53.90", "77.00", "65.45", "88.55", "0",
            "4", "1", "12", "2", "pcs", "", "", "WH-001", "WH-001-A-01-A-01", "", "Sí", "No",
        ],
    ];
    for (i, row_vals) in example.iter().enumerate() {
        let row = (i + 1) as u32;
        for (col, v) in row_vals.iter().enumerate() {
            ws.write_string(row, col as u16, *v).map_err(|e| e.to_string())?;
        }
    }

    write_masters_sheet(&conn, &mut wb)?;

    let instr = wb
        .add_worksheet()
        .set_name("INSTRUCCIONES")
        .map_err(|e| e.to_string())?;
    instr
        .set_column_width(0, 118.0)
        .map_err(|e| e.to_string())?;
    let bold = rust_xlsxwriter::Format::new().set_bold();
    let lines: &[&str] = &[
        "IMPORTAR Y EXPORTAR PRODUCTOS E INVENTARIO",
        "",
        "1. Exportar: Inventario → Importar/Exportar → Exportar inventario. Se genera un archivo .xlsx con la pestaña \"Productos\" y la pestaña \"Maestros de referencia\".",
        "2. Importar: use el menú Inventario → Importar/Exportar → Importar inventario y seleccione un archivo .xlsx.",
        "3. Pestaña \"Productos\": cada fila es un producto. No cambie la primera fila (encabezados).",
        "4. Identificación: se busca por SKU, luego por Código y luego por Código de barras.",
        "5. Modo Agregar: los productos que ya existen se omiten. Los nuevos se crean.",
        "6. Modo Reemplazar/Actualizar: los productos existentes se actualizan con las columnas llenas y el \"Stock inicial\" reemplaza el stock actual (no es un ajuste relativo). El resumen de cambios de stock se muestra antes de confirmar.",
        "7. Los valores de Categoría, Marca, Fabricante, Proveedor, Almacén y Ubicación deben coincidir con los nombres de la pestaña \"Maestros de referencia\".",
        "8. Las filas de ejemplo (860067 y 860068) son ilustrativas: elimínelas antes de importar.",
        "9. La importación es transaccional: si un producto presenta errores, no se importa nada.",
    ];
    for (i, line) in lines.iter().enumerate() {
        if i == 0 {
            instr
                .write_string_with_format(i as u32, 0, *line, &bold)
                .map_err(|e| e.to_string())?;
        } else {
            instr.write_string(i as u32, 0, *line).map_err(|e| e.to_string())?;
        }
    }

    if let Some(parent) = std::path::Path::new(&path).parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    wb.save(&path).map_err(|e| format!("No se pudo guardar el archivo: {}", e))?;

    let filename = std::path::Path::new(&path)
        .file_name()
        .map(|s| s.to_string_lossy().to_string())
        .unwrap_or_else(|| path.clone());

    Ok(ExportResult {
        path: path.clone(),
        filename,
        product_count: 0,
    })
}

// ── Import history ──────────────────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportHistoryRow {
    pub id: i64,
    pub filename: String,
    pub import_mode: String,
    pub total_rows: i64,
    pub inserted: i64,
    pub updated: i64,
    pub skipped: i64,
    pub errors: i64,
    pub stock_increased: i64,
    pub stock_decreased: i64,
    pub created_by: Option<String>,
    pub created_at: String,
}

#[tauri::command]
pub fn get_import_history(state: State<DbState>) -> Result<Vec<ImportHistoryRow>, String> {
    let conn = get_conn(&state)?;
    let limit = 30_i64;
    let mut stmt = conn
        .prepare(
            "SELECT h.id, h.filename, h.import_mode, h.total_rows, h.inserted, h.updated, h.skipped,
                    h.errors, h.stock_increased, h.stock_decreased, u.full_name, h.created_at
             FROM import_history h
             LEFT JOIN users u ON u.id = h.created_by
             ORDER BY h.id DESC LIMIT ?1",
        )
        .map_err(|e| e.to_string())?;
    let rows = stmt
        .query_map(params![limit], |row| {
            Ok(ImportHistoryRow {
                id: row.get(0)?,
                filename: row.get(1)?,
                import_mode: row.get(2)?,
                total_rows: row.get(3)?,
                inserted: row.get(4)?,
                updated: row.get(5)?,
                skipped: row.get(6)?,
                errors: row.get(7)?,
                stock_increased: row.get(8)?,
                stock_decreased: row.get(9)?,
                created_by: row.get(10)?,
                created_at: row.get(11)?,
            })
        })
        .map_err(|e| e.to_string())?;
    rows.collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())
}

// ── Tests ───────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use crate::config::PROFILE_EMPTY;
    use crate::db::init_database_with_profile;
    use uuid::Uuid;

    fn test_db() -> Connection {
        let dir = std::env::temp_dir().join(format!("ig_import_export_{}", Uuid::new_v4()));
        std::fs::create_dir_all(&dir).unwrap();
        let path = dir.join("test.db");
        init_database_with_profile(path.to_str().unwrap(), PROFILE_EMPTY).expect("init db empty profile")
    }

    fn write_xlsx_bytes(rows: &[Vec<Data>]) -> Vec<u8> {
        let mut wb = rust_xlsxwriter::Workbook::new();
        let ws = wb.add_worksheet().set_name("Productos").unwrap();
        for (r, cells) in rows.iter().enumerate() {
            for (c, cell) in cells.iter().enumerate() {
                if let Data::String(s) = cell {
                    ws.write_string(r as u32, c as u16, s).unwrap();
                } else if let Data::Float(f) = cell {
                    ws.write_number(r as u32, c as u16, *f).unwrap();
                } else if let Data::Int(i) = cell {
                    ws.write_number(r as u32, c as u16, *i as f64).unwrap();
                }
            }
        }
        wb.save_to_buffer().expect("save buffer")
    }

    fn demo_db() -> Connection {
        let db = test_db();
        db.execute_batch(
            "INSERT INTO categories (name, is_active) VALUES ('Dirección', 1), ('Suspensión', 1);
             INSERT INTO brands (name, is_active) VALUES ('Toyota Genuine', 1), ('TRW', 1);
             INSERT INTO suppliers (company_name, is_active) VALUES ('Autorepuestos Demo SRL', 1);
             INSERT INTO warehouses (name, code, is_active) VALUES ('Almacén Principal', 'WH-001', 1);
             INSERT INTO storage_locations (warehouse_id, zone, aisle, shelf, bin, code, is_active)
             VALUES (1, 'A', '01', 'A', '01', 'WH-001-A-01-A-01', 1);
             INSERT INTO products (name, sku, oem_number, internal_code, sale_price, cost_price, stock_quantity, warehouse_id, storage_location_id, is_active)
             VALUES ('MUÑON DIREC. TOY COROLLA/IPSU 84/95', '860067', '860067', '860067', 35.0, 24.5, 4, 1, 1, 1);",
        )
        .unwrap();
        db
    }

    fn row_data(cells: &[Option<&str>]) -> Vec<Data> {
        let mut v = Vec::with_capacity(27);
        for opt in cells {
            match opt {
                Some(s) if s.trim().is_empty() => v.push(Data::Empty),
                Some(s) => {
                    if let Ok(f) = s.parse::<f64>() {
                        if f.fract() == 0.0 {
                            v.push(Data::Float(f));
                        } else {
                            v.push(Data::String(s.to_string()));
                        }
                    } else {
                        v.push(Data::String(s.to_string()));
                    }
                }
                None => v.push(Data::Empty),
            }
        }
        v
    }

    fn header() -> Vec<Data> {
        HEADERS
            .iter()
            .map(|h| Data::String(h.to_string()))
            .collect()
    }

    fn to_bytes(rows: &[Vec<Data>]) -> Vec<u8> {
        write_xlsx_bytes(rows)
    }

    fn write_to_temp(bytes: &[u8], name: &str) -> String {
        let dir = std::env::temp_dir().join(format!("ig_xlsx_{}", Uuid::new_v4()));
        std::fs::create_dir_all(&dir).unwrap();
        let path = dir.join(name);
        std::fs::write(&path, bytes).unwrap();
        path.to_string_lossy().to_string()
    }

    #[test]
    fn test_parse_workbook_skips_header_and_empty_rows() {
        let data = vec![
            header(),
            row_data(&[Some("1"), Some("860001"), None, Some("S1"), Some("Amoortiguador")]),
            row_data(&[Some("")]),
            row_data(&[Some("2"), Some("860002"), None, Some("S2"), Some("Buje")]),
        ];
        let path = write_to_temp(&to_bytes(&data), "basic.xlsx");
        let rows = parse_workbook(&path).unwrap();
        assert_eq!(rows.len(), 2);
        assert_eq!(rows[0].row_number, 2);
        assert_eq!(rows[0].sku.as_deref(), Some("S1"));
        assert_eq!(rows[1].row_number, 4);
    }

    #[test]
    fn test_parse_flex_number_locale() {
        assert_eq!(parse_flex_number("15.5"), Some(15.5));
        assert_eq!(parse_flex_number("15,5"), Some(15.5));
        assert_eq!(parse_flex_number("1.234,56"), Some(1234.56));
        assert_eq!(parse_flex_number("1,234.56"), Some(1234.56));
        assert_eq!(parse_flex_number("abc"), None);
    }

    #[test]
    fn test_preview_append_detects_existing_and_new() {
        let db = demo_db();
        let data = vec![
            header(),
            row_data(&[Some("1"), Some("860067"), None, Some("860067"), Some("MUÑON EXISTENTE"), None,
                        Some("Dirección"), Some("Toyota Genuine"), None, Some("Autorepuestos Demo SRL")]),
            row_data(&[Some("2"), Some("999999"), None, Some("NUEVO99"), Some("Producto Nuevo"), None,
                        Some("Suspensión"), Some("TRW"), None, Some("Autorepuestos Demo SRL")]),
        ];
        let path = write_to_temp(&to_bytes(&data), "append.xlsx");
        let preview = preview_internal(&db, &path, "append", None, parse_workbook(&path).unwrap()).unwrap();
        assert_eq!(preview.total_rows, 2);
        assert_eq!(preview.insert_count, 1);
        assert_eq!(preview.update_count, 0);
        assert_eq!(preview.skip_count, 1);
        assert_eq!(preview.error_count, 0);
        assert_eq!(preview.rows[0].action, "skip");
        assert_eq!(preview.rows[1].action, "insert");
    }

    #[test]
    fn test_preview_rejects_unknown_category_with_suggestion() {
        let db = demo_db();
        let data = vec![
            header(),
            row_data(&[Some("1"), Some("999998"), None, Some("NO-CAT"), Some("Sin categoria valida"), None,
                        Some("Direccion"), Some("Toyota Genuine"), None, Some("Autorepuestos Demo SRL")]),
        ];
        let path = write_to_temp(&to_bytes(&data), "bad_cat.xlsx");
        let preview = preview_internal(&db, &path, "append", None, parse_workbook(&path).unwrap()).unwrap();
        assert_eq!(preview.error_count, 1);
        assert!(preview.error_rows[0].message.contains("Dirección"), "{:?}", preview.error_rows[0].message);
    }

    #[test]
    fn test_execute_insert_and_append_skip() {
        let db = demo_db();
        let data = vec![
            header(),
            row_data(&[Some("1"), Some("860067"), None, Some("860067"), Some("MUÑON EXISTENTE"), None,
                        Some("Dirección"), Some("Toyota Genuine"), None, Some("Autorepuestos Demo SRL")]),
            row_data(&[Some("2"), Some("999999"), None, Some("NUEVO99"), Some("Producto Nuevo"), None,
                        Some("Suspensión"), Some("TRW"), None, Some("Autorepuestos Demo SRL"),
                        Some("10"), Some("25"), None, None, None, Some("7")]),
        ];
        let path = write_to_temp(&to_bytes(&data), "execute.xlsx");
        let result = execute_internal(&db, &path, "append", None, None).unwrap();
        assert!(result.ok);
        assert_eq!(result.inserted, 1);
        assert_eq!(result.skipped, 1);
        assert_eq!(result.stock_increased, 1);

        let count: i64 = db.query_row("SELECT COUNT(*) FROM products", [], |r| r.get(0)).unwrap();
        assert_eq!(count, 2);

        let stock: i64 = db
            .query_row("SELECT stock_quantity FROM products WHERE sku='NUEVO99'", [], |r| r.get(0))
            .unwrap();
        assert_eq!(stock, 7);

        let ids: i64 = db
            .query_row("SELECT COUNT(*) FROM product_identifiers", [], |r| r.get(0))
            .unwrap();
        assert!(ids >= 1, "expected at least one oem identifier for the new product");
    }

    #[test]
    fn test_execute_replace_sets_absolute_stock_and_logs_movement() {
        let db = demo_db();
        let data = vec![
            header(),
            row_data(&[Some("1"), Some("860067"), None, Some("860067"), Some("MUÑON 84/95"), None,
                        Some("Dirección"), Some("Toyota Genuine"), None, Some("Autorepuestos Demo SRL"),
                        None, None, None, None, None, Some("10"), Some("2"), Some("30"), Some("1"),
                        Some("pcs"), None, None, Some("WH-001"), Some("WH-001-A-01-A-01"), None, Some("Sí"), Some("No")]),
        ];
        let path = write_to_temp(&to_bytes(&data), "replace.xlsx");
        let result = execute_internal(&db, &path, "update", None, None).unwrap();
        assert!(result.ok, "{:?}", result);
        assert_eq!(result.updated, 1);
        assert_eq!(result.inserted, 0);
        assert_eq!(result.stock_increased, 1);

        let stock: i64 = db.query_row("SELECT stock_quantity FROM products WHERE sku='860067'", [], |r| r.get(0)).unwrap();
        assert_eq!(stock, 10);
        let diff = stock - 4;
        assert_eq!(diff, 6);

        let mov: i64 = db
            .query_row(
                "SELECT COUNT(*) FROM inventory_movements WHERE product_id=1 AND reference_type='import'",
                [],
                |r| r.get(0),
            )
            .unwrap();
        assert_eq!(mov, 1);
        let qty: i64 = db
            .query_row(
                "SELECT quantity FROM inventory_movements WHERE product_id=1 AND reference_type='import'",
                [],
                |r| r.get(0),
            )
            .unwrap();
        assert_eq!(qty, 6);

        let h: i64 = db.query_row("SELECT COUNT(*) FROM import_history", [], |r| r.get(0)).unwrap();
        assert_eq!(h, 1);
    }

    #[test]
    fn test_execute_rolls_back_on_error() {
        let db = demo_db();
        let data = vec![
            header(),
            row_data(&[Some("1"), Some("860067"), None, Some("860067"), Some("MUÑON OK"), None,
                        Some("Dirección"), None, None, None]),
            row_data(&[Some("2"), Some("888888"), None, Some("NUEVO-ERR"), Some("Mal categoría"), None,
                        Some("NoExiste")]),
        ];
        let path = write_to_temp(&to_bytes(&data), "rollback.xlsx");
        let result = execute_internal(&db, &path, "append", None, None).unwrap();
        assert!(!result.ok);
        assert_eq!(result.errors, 1);

        let count: i64 = db.query_row("SELECT COUNT(*) FROM products", [], |r| r.get(0)).unwrap();
        assert_eq!(count, 1, "no new products should have been written");
    }

    #[test]
    fn test_export_writes_expected_columns() {
        let db = demo_db();
        let scope = "active";
        let mut wb = build_export_workbook(&db, scope).unwrap();
        let path = write_to_temp(&[], "export_probe.xlsx");
        wb.save(&path).unwrap();

        let mut reader: Xlsx<_> = open_workbook(&path).unwrap();
        let rng = reader.worksheet_range("Productos").unwrap();
        assert!(rng.width() >= 27, "expected >=27 columns, got {}", rng.width());
        let rows: Vec<&[Data]> = rng.rows().collect();
        assert_eq!(rows.len(), 2, "header + 1 product");
        let first = &rows[1];
        let n: f64 = match &first[COL_NUM] {
            Data::Float(f) => *f,
            Data::Int(i) => *i as f64,
            other => panic!("unexpected N° cell {:?}", other),
        };
        assert_eq!(n, 1.0);
        let codigo = cell_str(&first[COL_CODIGO]).unwrap();
        assert_eq!(codigo, "860067");
        let stock: f64 = match &first[COL_STOCK] {
            Data::Float(f) => *f,
            Data::Int(i) => *i as f64,
            other => panic!("unexpected stock cell {:?}", other),
        };
        assert_eq!(stock, 4.0);
    }

    #[test]
    fn test_get_import_history_after_execute() {
        let db = demo_db();
        let data = vec![
            header(),
            row_data(&[Some("1"), Some("999991"), None, Some("HIST1"), Some("Histórico"), None,
                        Some("Dirección"), None, None, None, None, Some("12")]),
        ];
        let path = write_to_temp(&to_bytes(&data), "hist.xlsx");
        execute_internal(&db, &path, "append", None, None).unwrap();

        let mut stmt = db
            .prepare("SELECT filename, import_mode, inserted FROM import_history")
            .unwrap();
        let rows: Vec<(String, String, i64)> = stmt
            .query_map([], |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?)))
            .unwrap()
            .collect::<Result<_, _>>()
            .unwrap();
        assert_eq!(rows.len(), 1);
        assert_eq!(rows[0].1, "append");
        assert_eq!(rows[0].2, 1);
    }
}
