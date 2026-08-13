import type { Page } from "@playwright/test"

export const MOCK_DELAY = 100

type DataMap = Record<string, any>

export async function setupInvokeMock(page: Page, options?: { theme?: "light" | "dark" }) {
  const theme = options?.theme ?? "light"

  const data: DataMap = await buildMockData(theme)

  // Build a JavaScript source string with all mock data embedded.
  // Functions are serialized via .toString() (types are stripped by tsx at runtime).
  // This avoids structuredClone dropping functions when passing via addInitScript arg.
  const lines: string[] = []
  for (const [key, val] of Object.entries(data)) {
    const valSrc = typeof val === "function" ? val.toString() : JSON.stringify(val)
    lines.push(`"${key}": ${valSrc}`)
  }
  const dataSource = `{\n${lines.join(",\n")}\n}`

  const script = `
(() => {
  const data = ${dataSource};
  const delay = ${MOCK_DELAY};
  window.__TAURI_INTERNALS__ = {
    invoke: async (cmd, args) => {
      await new Promise(r => setTimeout(r, delay));
      if (cmd in data) {
        const val = data[cmd];
        return typeof val === "function" ? val(args || {}) : val;
      }
      if (cmd.startsWith("create_") || cmd.startsWith("update_")) {
        if (args && typeof args === "object" && "id" in args) return args;
        if (args && typeof args === "object" && "input" in args) return args.input;
        const id = Math.floor(Math.random() * 900) + 100;
        return { id, ...(args || {}) };
      }
      if (cmd.startsWith("delete_") || cmd.startsWith("archive_") || cmd.startsWith("restore_")) {
        return undefined;
      }
      const noopPrefixes = [
        "toggle_","set_","mark_","revoke_","reset_","lock_","unlock_",
        "clone_","assign_","bulk_","save_","log_","record_","clear_",
        "reindex_","vacuum_","optimize_","check_","export_","deactivate_",
        "activate_","validate_","convert_","refund_","run_","close_","open_",
      ];
      for (const p of noopPrefixes) { if (cmd.startsWith(p)) return undefined; }
      return null;
    },
    metadata: {
      appName: "InventoryGear",
      appVersion: "1.2.0",
      tauriVersion: "2.0.0",
      platform: "linux",
    },
  };
})();
`
  await page.addInitScript(script)
}

function buildMockData(theme: string): DataMap {
  const d: DataMap = {}

  // --- App ---
  d["get_app_version"] = "1.2.0"
  d["health_check"] = "ok"
  d["greet"] = (a: any) => "¡Hola, " + (a?.name || "Invitado") + "!"
  d["run_seeds"] = "Semillas ejecutadas correctamente"

  // --- Auth ---
  d["login"] = {
    user: { id: 1, username: "admin", fullName: "Administrador", email: "admin@inventorygear.com", roleId: 1, roleName: "Administrator", isActive: true },
    token: "mock-token-" + Date.now(),
    permissions: ["*"],
  }
  d["login_by_role"] = {
    user: { id: 1, username: "admin", fullName: "Administrador", email: "admin@inventorygear.com", roleId: 1, roleName: "Administrator", isActive: true },
    token: "mock-token-" + Date.now(),
    permissions: ["*"],
  }
  d["logout"] = undefined
  d["get_current_user"] = {
    user: { id: 1, username: "admin", fullName: "Administrador", email: "admin@inventorygear.com", roleId: 1, roleName: "Administrator", isActive: true },
    permissions: ["*"],
  }
  d["check_session"] = true
  d["get_user_permissions_list"] = ["*"]

  // --- Settings ---
  d["get_settings"] = [
    { key: "language", value: "es", group: "general", description: "Idioma de la aplicación" },
    { key: "theme", value: theme, group: "appearance", description: "Tema visual" },
    { key: "currency", value: "MXN", group: "regional", description: "Moneda predeterminada" },
    { key: "tax_rate", value: "16", group: "tax", description: "Tasa de impuesto (%)" },
    { key: "store_name", value: "InventoryGear", group: "general", description: "Nombre del negocio" },
    { key: "low_stock_threshold", value: "10", group: "inventory", description: "Umbral de stock bajo" },
    { key: "date_format", value: "dd/MM/yyyy", group: "regional", description: "Formato de fecha" },
    { key: "time_format", value: "HH:mm", group: "regional", description: "Formato de hora" },
    { key: "items_per_page", value: "25", group: "general", description: "Artículos por página" },
    { key: "enable_pos", value: "true", group: "sales", description: "Habilitar punto de venta" },
    { key: "enable_credit", value: "true", group: "sales", description: "Habilitar crédito" },
    { key: "enable_inventory", value: "true", group: "inventory", description: "Habilitar inventario" },
    { key: "enable_purchasing", value: "true", group: "purchasing", description: "Habilitar compras" },
    { key: "enable_crm", value: "true", group: "crm", description: "Habilitar CRM" },
    { key: "invoice_footer", value: "Gracias por su compra", group: "sales", description: "Pie de factura" },
    { key: "default_warehouse_id", value: "1", group: "inventory", description: "Almacén predeterminado" },
    { key: "session_timeout_minutes", value: "480", group: "security", description: "Tiempo de sesión (min)" },
    { key: "max_login_attempts", value: "5", group: "security", description: "Intentos máximos de login" },
    { key: "password_min_length", value: "8", group: "security", description: "Longitud mínima de contraseña" },
    { key: "auto_backup_enabled", value: "true", group: "backup", description: "Respaldo automático" },
    { key: "auto_backup_interval_hours", value: "24", group: "backup", description: "Intervalo de respaldo (hrs)" },
    { key: "receipt_width_mm", value: "80", group: "printing", description: "Ancho del recibo (mm)" },
    { key: "default_printer_id", value: "1", group: "printing", description: "Impresora predeterminada" },
    { key: "smtp_host", value: "smtp.example.com", group: "email", description: "Servidor SMTP" },
    { key: "smtp_port", value: "587", group: "email", description: "Puerto SMTP" },
    { key: "enable_notifications", value: "true", group: "notifications", description: "Notificaciones habilitadas" },
    { key: "default_country", value: "México", group: "regional", description: "País predeterminado" },
    { key: "default_city", value: "Ciudad de México", group: "regional", description: "Ciudad predeterminada" },
    { key: "business_type", value: "auto_parts", group: "general", description: "Tipo de negocio" },
  ]
  d["get_setting"] = (a: any) => {
    const settings = d["get_settings"] as any[]
    return settings.find((s: any) => s.key === a?.key) ?? null
  }
  d["update_setting"] = undefined
  d["get_settings_by_group"] = (a: any) => {
    const settings = d["get_settings"] as any[]
    return settings.filter((s: any) => s.group === (a?.group ?? "general"))
  }

  // --- Categories ---
  d["get_categories"] = [
    { id: 1, name: "Pastillas de Freno", description: "Pastillas de freno para todas las marcas", parentId: null, sortOrder: 1, isActive: true },
    { id: 2, name: "Discos de Freno", description: "Discos de freno delanteros y traseros", parentId: null, sortOrder: 2, isActive: true },
    { id: 3, name: "Amortiguadores", description: "Amortiguadores y suspensiones", parentId: null, sortOrder: 3, isActive: true },
    { id: 4, name: "Filtros", description: "Filtros de aceite, aire, combustible", parentId: null, sortOrder: 4, isActive: true },
    { id: 5, name: "Bujías", description: "Bujías de encendido", parentId: null, sortOrder: 5, isActive: true },
    { id: 6, name: "Correas", description: "Correas de distribución y accesorios", parentId: null, sortOrder: 6, isActive: true },
    { id: 7, name: "Baterías", description: "Baterías para automóvil", parentId: null, sortOrder: 7, isActive: true },
    { id: 8, name: "Embragues", description: "Sistemas de embrague", parentId: null, sortOrder: 8, isActive: true },
    { id: 9, name: "Radiadores", description: "Radiadores y sistemas de enfriamiento", parentId: null, sortOrder: 9, isActive: true },
    { id: 10, name: "Alternadores", description: "Alternadores y componentes eléctricos", parentId: null, sortOrder: 10, isActive: true },
    { id: 11, name: "Arranques", description: "Motores de arranque", parentId: null, sortOrder: 11, isActive: true },
    { id: 12, name: "Rodamientos", description: "Rodamientos y baleros", parentId: null, sortOrder: 12, isActive: true },
    { id: 13, name: "Mangueras", description: "Mangueras y conexiones", parentId: null, sortOrder: 13, isActive: true },
    { id: 14, name: "Suspensión", description: "Componentes de suspensión", parentId: null, sortOrder: 14, isActive: true },
    { id: 15, name: "Dirección", description: "Componentes de dirección hidráulica", parentId: null, sortOrder: 15, isActive: true },
    { id: 16, name: "Escapes", description: "Sistemas de escape y silenciadores", parentId: null, sortOrder: 16, isActive: true },
    { id: 17, name: "Lubricantes", description: "Aceites y lubricantes", parentId: null, sortOrder: 17, isActive: true },
    { id: 18, name: "Llantas", description: "Neumáticos y llantas", parentId: null, sortOrder: 18, isActive: true },
    { id: 19, name: "Faros", description: "Faros delanteros y traseros", parentId: null, sortOrder: 19, isActive: true },
    { id: 20, name: "Espejos", description: "Espejos retrovisores y laterales", parentId: null, sortOrder: 20, isActive: true },
    { id: 21, name: "Limpiaparabrisas", description: "Escobillas y brazos limpiadores", parentId: null, sortOrder: 21, isActive: true },
    { id: 22, name: "Termostatos", description: "Termostatos y sensores de temperatura", parentId: null, sortOrder: 22, isActive: true },
    { id: 23, name: "Sensores", description: "Sensores electrónicos automotrices", parentId: null, sortOrder: 23, isActive: true },
    { id: 24, name: "Bombas de Agua", description: "Bombas de agua para sistema de enfriamiento", parentId: null, sortOrder: 24, isActive: true },
    { id: 25, name: "Inyectores", description: "Inyectores de combustible", parentId: null, sortOrder: 25, isActive: true },
    { id: 26, name: "Carburadores", description: "Carburadores y kits de reparación", parentId: null, sortOrder: 26, isActive: true },
    { id: 27, name: "Turbo", description: "Turbocompresores y componentes", parentId: null, sortOrder: 27, isActive: true },
    { id: 28, name: "Transmisión", description: "Componentes de transmisión manual y automática", parentId: null, sortOrder: 28, isActive: true },
    { id: 29, name: "Diferencial", description: "Diferenciales y ejes", parentId: null, sortOrder: 29, isActive: true },
    { id: 30, name: "Aire Acondicionado", description: "Componentes de climatización", parentId: null, sortOrder: 30, isActive: true },
  ]
  d["create_category"] = (a: any) => ({ id: Math.floor(Math.random() * 900) + 100, name: a?.name ?? "Nueva Categoría", description: a?.description ?? "", parentId: a?.parentId ?? null, sortOrder: a?.sortOrder ?? 99, isActive: true })
  d["update_category"] = (a: any) => a
  d["archive_category"] = undefined
  d["restore_category"] = undefined

  // --- Brands ---
  d["get_brands"] = [
    { id: 1, name: "Bosch", description: "Componentes eléctricos y sistemas de frenos", country: "Alemania", website: "https://www.bosch.com", isActive: true },
    { id: 2, name: "Brembo", description: "Sistemas de frenado de alto rendimiento", country: "Italia", website: "https://www.brembo.com", isActive: true },
    { id: 3, name: "Monroe", description: "Amortiguadores y suspensiones", country: "Estados Unidos", website: "https://www.monroe.com", isActive: true },
    { id: 4, name: "SKF", description: "Rodamientos y retenes", country: "Suecia", website: "https://www.skf.com", isActive: true },
    { id: 5, name: "NGK", description: "Bujías y sensores", country: "Japón", website: "https://www.ngk.com", isActive: true },
    { id: 6, name: "Continental", description: "Correas y mangueras", country: "Alemania", website: "https://www.continental.com", isActive: true },
    { id: 7, name: "Varta", description: "Baterías automotrices", country: "Alemania", website: "https://www.varta.com", isActive: true },
    { id: 8, name: "Valeo", description: "Sistemas de climatización e iluminación", country: "Francia", website: "https://www.valeo.com", isActive: true },
    { id: 9, name: "Denso", description: "Sistemas de encendido y componentes", country: "Japón", website: "https://www.denso.com", isActive: true },
    { id: 10, name: "Hella", description: "Iluminación y electrónica", country: "Alemania", website: "https://www.hella.com", isActive: true },
    { id: 11, name: "Gates", description: "Correas y mangueras industriales", country: "Estados Unidos", website: "https://www.gates.com", isActive: true },
    { id: 12, name: "Febi", description: "Componentes de suspensión y dirección", country: "Alemania", website: "https://www.febi.com", isActive: true },
    { id: 13, name: "Mann-Filter", description: "Filtros para automoción", country: "Alemania", website: "https://www.mann-filter.com", isActive: true },
    { id: 14, name: "Sachs", description: "Embragues y amortiguadores", country: "Alemania", website: "https://www.sachs.com", isActive: true },
    { id: 15, name: "Lemforder", description: "Componentes de suspensión de precisión", country: "Alemania", website: "https://www.lemforder.com", isActive: true },
    { id: 16, name: "TRW", description: "Sistemas de frenado y dirección", country: "Estados Unidos", website: "https://www.trw.com", isActive: true },
    { id: 17, name: "Mahle", description: "Filtros y sistemas de motor", country: "Alemania", website: "https://www.mahle.com", isActive: true },
    { id: 18, name: "KYB", description: "Amortiguadores y suspensiones", country: "Japón", website: "https://www.kyb.com", isActive: true },
    { id: 19, name: "Dayco", description: "Correas de distribución y accesorios", country: "Estados Unidos", website: "https://www.dayco.com", isActive: true },
    { id: 20, name: "ACDelco", description: "Componentes eléctricos y de motor", country: "Estados Unidos", website: "https://www.acdelco.com", isActive: true },
  ]
  d["create_brand"] = (a: any) => ({ id: Math.floor(Math.random() * 900) + 100, name: a?.name ?? "Nueva Marca", description: a?.description ?? "", country: a?.country ?? "", website: a?.website ?? "", isActive: true })
  d["update_brand"] = (a: any) => a
  d["archive_brand"] = undefined

  // --- Manufacturers ---
  d["get_manufacturers"] = [
    { id: 1, name: "Bosch México", country: "México", phone: "+52 55 1234 5600", email: "ventas@bosch.mx", website: "https://www.bosch.mx", notes: "Fabricante líder en componentes eléctricos", isActive: true },
    { id: 2, name: "Brembo Italia", country: "Italia", phone: "+39 035 1234567", email: "export@brembo.it", website: "https://www.brembo.com", notes: "Especialistas en frenos de alto rendimiento", isActive: true },
    { id: 3, name: "Valeo Sistemas", country: "Francia", phone: "+33 1 2345 6789", email: "contact@valeo.com", website: "https://www.valeo.com", notes: "Sistemas de climatización e iluminación", isActive: true },
    { id: 4, name: "Denso México", country: "México", phone: "+52 81 2345 6700", email: "info@denso.mx", website: "https://www.denso.com", notes: "Sistemas de encendido", isActive: true },
    { id: 5, name: "NGK Spark Plugs", country: "Japón", phone: "+81 52 123 4567", email: "sales@ngk.co.jp", website: "https://www.ngk.com", notes: "Bujías y sensores", isActive: true },
    { id: 6, name: "SKF de México", country: "México", phone: "+52 55 9876 5432", email: "servicio@skf.mx", website: "https://www.skf.mx", notes: "Rodamientos y retenes", isActive: true },
    { id: 7, name: "Continental Automotive", country: "Alemania", phone: "+49 511 123 4567", email: "info@continental.com", website: "https://www.continental.com", notes: "Correas y mangueras", isActive: true },
    { id: 8, name: "Varta Baterías", country: "Alemania", phone: "+49 6196 123456", email: "info@varta.com", website: "https://www.varta.com", notes: "Baterías automotrices", isActive: true },
    { id: 9, name: "Monroe México", country: "México", phone: "+52 33 2345 6789", email: "ventas@monroe.mx", website: "https://www.monroe.mx", notes: "Amortiguadores", isActive: true },
    { id: 10, name: "Gates Corporativo", country: "Estados Unidos", phone: "+1 303 123 4567", email: "info@gates.com", website: "https://www.gates.com", notes: "Correas industriales", isActive: true },
  ]
  d["create_manufacturer"] = (a: any) => ({ id: Math.floor(Math.random() * 900) + 100, name: a?.name ?? "Nuevo Fabricante", country: a?.country ?? "", phone: a?.phone ?? "", email: a?.email ?? "", website: a?.website ?? "", notes: a?.notes ?? "", isActive: true })
  d["update_manufacturer"] = (a: any) => a

  // --- Suppliers (24) ---
  d["get_suppliers"] = [
    { id: 1, companyName: "Autopartes del Centro S.A. de C.V.", contactPerson: "Carlos Hernández", phone: "+52 55 1111 2233", mobile: "+52 55 9988 7766", email: "carlos@autopartescentro.mx", taxNumber: "AUT-851212-XXX", address: "Av. Reforma 123", city: "Ciudad de México", stateProvince: "CDMX", country: "México", isActive: true, paymentTerms: "30 días", creditLimit: 50000 },
    { id: 2, companyName: "Refaccionaría del Norte S.A.", contactPerson: "María García", phone: "+52 81 2222 3344", mobile: "+52 81 8877 6655", email: "maria@refaccionarianorte.mx", taxNumber: "REF-920101-XXX", address: "Blvd. Independencia 456", city: "Monterrey", stateProvince: "Nuevo León", country: "México", isActive: true, paymentTerms: "15 días", creditLimit: 35000 },
    { id: 3, companyName: "Importadora de Autopartes del Pacífico", contactPerson: "Juan López", phone: "+52 33 3333 4455", mobile: "+52 33 7766 5544", email: "juan@importadorapacifico.mx", taxNumber: "IMP-030303-XXX", address: "Av. Américas 789", city: "Guadalajara", stateProvince: "Jalisco", country: "México", isActive: true, paymentTerms: "60 días", creditLimit: 75000 },
    { id: 4, companyName: "Distribuidora de Frenos y Embragues", contactPerson: "Ana Martínez", phone: "+52 55 4444 5566", mobile: "+52 55 6655 4433", email: "ana@frenosyembragues.mx", taxNumber: "DFE-141414-XXX", address: "Eje Central 321", city: "Ciudad de México", stateProvince: "CDMX", country: "México", isActive: true, paymentTerms: "30 días", creditLimit: 40000 },
    { id: 5, companyName: "Proveedora Automotriz del Bajío", contactPerson: "Roberto Sánchez", phone: "+52 442 5555 6677", mobile: "+52 442 5544 3322", email: "roberto@proveedorabajio.mx", taxNumber: "PAB-252525-XXX", address: "Av. Zaragoza 654", city: "Querétaro", stateProvince: "Querétaro", country: "México", isActive: true, paymentTerms: "45 días", creditLimit: 60000 },
    { id: 6, companyName: "Suspensiones y Dirección S.A.", contactPerson: "Patricia Ramírez", phone: "+52 55 6666 7788", mobile: "+52 55 4433 2211", email: "patricia@suspensionesdireccion.mx", taxNumber: "SYD-363636-XXX", address: "Insurgentes Sur 987", city: "Ciudad de México", stateProvince: "CDMX", country: "México", isActive: true, paymentTerms: "30 días", creditLimit: 45000 },
    { id: 7, companyName: "Eléctricos Automotrices del Golfo", contactPerson: "Fernando Díaz", phone: "+52 229 7777 8899", mobile: "+52 229 3322 1100", email: "fernando@electricosgolfo.mx", taxNumber: "EAG-474747-XXX", address: "Blvd. Costero 321", city: "Veracruz", stateProvince: "Veracruz", country: "México", isActive: true, paymentTerms: "15 días", creditLimit: 25000 },
    { id: 8, companyName: "Lubricantes y Refacciones del Sureste", contactPerson: "Gabriela Tun", phone: "+52 999 8888 9900", mobile: "+52 999 2211 0099", email: "gabriela@lubricantessureste.mx", taxNumber: "LRS-585858-XXX", address: "Av. Tecnológico 159", city: "Mérida", stateProvince: "Yucatán", country: "México", isActive: true, paymentTerms: "30 días", creditLimit: 30000 },
    { id: 9, companyName: "Correas y Filtros Industriales", contactPerson: "Luis Torres", phone: "+52 55 9999 0011", mobile: "+52 55 1100 9988", email: "luis@correasfiltros.mx", taxNumber: "CFI-696969-XXX", address: "Calz. Vallejo 753", city: "Ciudad de México", stateProvince: "CDMX", country: "México", isActive: true, paymentTerms: "30 días", creditLimit: 55000 },
    { id: 10, companyName: "TurboComponentes de México", contactPerson: "Andrés Mendoza", phone: "+52 33 0000 1122", mobile: "+52 33 9988 7766", email: "andres@turbocomponentes.mx", taxNumber: "TCM-070707-XXX", address: "Av. Vallarta 852", city: "Guadalajara", stateProvince: "Jalisco", country: "México", isActive: true, paymentTerms: "60 días", creditLimit: 80000 },
    { id: 11, companyName: "Frenos del Centro S.A.", contactPerson: "Diana Flores", phone: "+52 442 1111 2233", mobile: "+52 442 7766 5544", email: "diana@frenoscentro.mx", taxNumber: "FDC-181818-XXX", address: "Av. Constituyentes 456", city: "Querétaro", stateProvince: "Querétaro", country: "México", isActive: true, paymentTerms: "30 días", creditLimit: 40000 },
    { id: 12, companyName: "Rodamientos y Baleros del Norte", contactPerson: "Miguel Ángel Ruiz", phone: "+52 81 2222 3344", mobile: "+52 81 6655 4433", email: "miguel@rodamientosnorte.mx", taxNumber: "RBN-292929-XXX", address: "Av. Constitución 789", city: "Monterrey", stateProvince: "Nuevo León", country: "México", isActive: true, paymentTerms: "45 días", creditLimit: 50000 },
    { id: 13, companyName: "Autopartes Especializadas de Occidente", contactPerson: "Carmen Vega", phone: "+52 33 3333 4455", mobile: "+52 33 5544 3322", email: "carmen@autopartesoccidente.mx", taxNumber: "AEO-404040-XXX", address: "Av. López Mateos 321", city: "Guadalajara", stateProvince: "Jalisco", country: "México", isActive: true, paymentTerms: "30 días", creditLimit: 35000 },
    { id: 14, companyName: "Sensores y Electrónica Automotriz", contactPerson: "Héctor Rivas", phone: "+52 55 4444 5566", mobile: "+52 55 4433 2211", email: "hector@sensoreselectronica.mx", taxNumber: "SEA-515151-XXX", address: "Av. Tlalpan 654", city: "Ciudad de México", stateProvince: "CDMX", country: "México", isActive: true, paymentTerms: "15 días", creditLimit: 20000 },
    { id: 15, companyName: "Baterías y Arranques Nacionales", contactPerson: "Sofía Medina", phone: "+52 55 5555 6677", mobile: "+52 55 3322 1100", email: "sofia@bateriasarranques.mx", taxNumber: "BAN-626262-XXX", address: "Eje 3 Oriente 987", city: "Ciudad de México", stateProvince: "CDMX", country: "México", isActive: true, paymentTerms: "30 días", creditLimit: 30000 },
    { id: 16, companyName: "Radiadores y Enfriamiento S.A.", contactPerson: "Oscar Campos", phone: "+52 81 6666 7788", mobile: "+52 81 2211 0099", email: "oscar@radiadoresenfriamiento.mx", taxNumber: "RES-737373-XXX", address: "Av. Industrias 159", city: "Monterrey", stateProvince: "Nuevo León", country: "México", isActive: true, paymentTerms: "45 días", creditLimit: 45000 },
    { id: 17, companyName: "Escape y Tubería Automotriz", contactPerson: "Laura Castillo", phone: "+52 55 7777 8899", mobile: "+52 55 1100 9988", email: "laura@escapetuberia.mx", taxNumber: "ETA-848484-XXX", address: "Calz. Ignacio Zaragoza 753", city: "Ciudad de México", stateProvince: "CDMX", country: "México", isActive: true, paymentTerms: "30 días", creditLimit: 25000 },
    { id: 18, companyName: "Transmisiones del Valle de México", contactPerson: "Ricardo Nava", phone: "+52 55 8888 9900", mobile: "+52 55 0099 8877", email: "ricardo@transmisionesvalle.mx", taxNumber: "TVM-959595-XXX", address: "Av. Hidalgo 456", city: "Ecatepec", stateProvince: "Estado de México", country: "México", isActive: true, paymentTerms: "30 días", creditLimit: 60000 },
    { id: 19, companyName: "Iluminación Automotriz del Centro", contactPerson: "Verónica Soto", phone: "+52 55 0000 1111", mobile: "+52 55 8877 6655", email: "veronica@iluminacioncentro.mx", taxNumber: "IAC-060606-XXX", address: "Av. Cuauhtémoc 852", city: "Ciudad de México", stateProvince: "CDMX", country: "México", isActive: true, paymentTerms: "15 días", creditLimit: 20000 },
    { id: 20, companyName: "Aire Acondicionado Automotriz S.A.", contactPerson: "Daniel Peña", phone: "+52 33 1111 2222", mobile: "+52 33 7766 5544", email: "daniel@aireautomotriz.mx", taxNumber: "AAA-161616-XXX", address: "Av. Patria 321", city: "Guadalajara", stateProvince: "Jalisco", country: "México", isActive: true, paymentTerms: "30 días", creditLimit: 35000 },
    { id: 21, companyName: "Mangueras y Conexiones Hidráulicas", contactPerson: "Alejandra Cruz", phone: "+52 55 2222 3333", mobile: "+52 55 6655 4433", email: "alejandra@manguerashidraulicas.mx", taxNumber: "MCH-272727-XXX", address: "Eje 5 Sur 654", city: "Ciudad de México", stateProvince: "CDMX", country: "México", isActive: true, paymentTerms: "30 días", creditLimit: 30000 },
    { id: 22, companyName: "Embragues Profesionales de México", contactPerson: "Jorge Lara", phone: "+52 55 3333 4444", mobile: "+52 55 5544 3322", email: "jorge@embraguesprofesionales.mx", taxNumber: "EPM-383838-XXX", address: "Av. Taxqueña 987", city: "Ciudad de México", stateProvince: "CDMX", country: "México", isActive: true, paymentTerms: "45 días", creditLimit: 55000 },
    { id: 23, companyName: "Inyección Electrónica Automotriz", contactPerson: "Paola Guerrero", phone: "+52 81 4444 5555", mobile: "+52 81 4433 2211", email: "paola@inyecionelectronica.mx", taxNumber: "IEA-494949-XXX", address: "Av. Universidad 159", city: "Monterrey", stateProvince: "Nuevo León", country: "México", isActive: true, paymentTerms: "30 días", creditLimit: 40000 },
    { id: 24, companyName: "Suspensión Neumática del Bajío", contactPerson: "Eduardo Pacheco", phone: "+52 442 5555 6666", mobile: "+52 442 3322 1100", email: "eduardo@suspensionbajio.mx", taxNumber: "SNB-505050-XXX", address: "Blvd. Bernardo Quintana 753", city: "Querétaro", stateProvince: "Querétaro", country: "México", isActive: true, paymentTerms: "60 días", creditLimit: 70000 },
  ]
  d["create_supplier"] = (a: any) => ({ id: Math.floor(Math.random() * 900) + 100, companyName: a?.companyName ?? "Nuevo Proveedor", contactPerson: a?.contactPerson ?? "", phone: a?.phone ?? "", mobile: a?.mobile ?? "", email: a?.email ?? "", website: a?.website ?? "", taxNumber: a?.taxNumber ?? "", address: a?.address ?? "", city: a?.city ?? "", stateProvince: a?.stateProvince ?? "", country: a?.country ?? "México", isActive: true, paymentTerms: "30 días", creditLimit: 0 })
  d["update_supplier"] = (a: any) => a
  d["archive_supplier"] = undefined

  // --- Warehouses ---
  d["get_warehouses"] = [
    { id: 1, name: "Almacén Central", code: "CDMX-01", address: "Av. Reforma 123", city: "Ciudad de México", stateProvince: "CDMX", country: "México", manager: "Juan Pérez", phone: "+52 55 1111 2222", isActive: true },
    { id: 2, name: "Almacén Norte", code: "MTY-01", address: "Blvd. Independencia 456", city: "Monterrey", stateProvince: "Nuevo León", country: "México", manager: "María López", phone: "+52 81 2222 3333", isActive: true },
    { id: 3, name: "Almacén Sur", code: "MER-01", address: "Av. Tecnológico 789", city: "Mérida", stateProvince: "Yucatán", country: "México", manager: "Carlos Tun", phone: "+52 999 3333 4444", isActive: true },
    { id: 4, name: "Almacén Taller", code: "TLL-01", address: "Eje Central 321", city: "Ciudad de México", stateProvince: "CDMX", country: "México", manager: "Ana García", phone: "+52 55 4444 5555", isActive: true },
  ]
  d["create_warehouse"] = (a: any) => ({ id: Math.floor(Math.random() * 900) + 100, name: a?.name ?? "Nuevo Almacén", code: a?.code ?? "NEW-01", address: a?.address ?? "", city: a?.city ?? "", stateProvince: a?.stateProvince ?? "", country: a?.country ?? "México", manager: a?.manager ?? "", phone: a?.phone ?? "", isActive: true })
  d["update_warehouse"] = (a: any) => a

  // --- Storage Locations ---
  d["get_storage_locations"] = (a: any) => {
    const all = [
      { id: 1, warehouseId: 1, zone: "A", aisle: "01", shelf: "A", bin: "001", code: "CDMX-A01-A001", description: "Pastillas de freno" },
      { id: 2, warehouseId: 1, zone: "A", aisle: "01", shelf: "B", bin: "002", code: "CDMX-A01-B002", description: "Discos de freno" },
      { id: 3, warehouseId: 1, zone: "A", aisle: "02", shelf: "A", bin: "003", code: "CDMX-A02-A003", description: "Filtros de aceite" },
      { id: 4, warehouseId: 1, zone: "B", aisle: "01", shelf: "A", bin: "004", code: "CDMX-B01-A004", description: "Amortiguadores" },
      { id: 5, warehouseId: 1, zone: "B", aisle: "02", shelf: "B", bin: "005", code: "CDMX-B02-B005", description: "Bujías" },
      { id: 6, warehouseId: 1, zone: "C", aisle: "01", shelf: "A", bin: "006", code: "CDMX-C01-A006", description: "Correas" },
      { id: 7, warehouseId: 1, zone: "C", aisle: "02", shelf: "B", bin: "007", code: "CDMX-C02-B007", description: "Baterías" },
      { id: 8, warehouseId: 2, zone: "A", aisle: "01", shelf: "A", bin: "001", code: "MTY-A01-A001", description: "Embragues" },
      { id: 9, warehouseId: 2, zone: "A", aisle: "02", shelf: "B", bin: "002", code: "MTY-A02-B002", description: "Radiadores" },
      { id: 10, warehouseId: 2, zone: "B", aisle: "01", shelf: "A", bin: "003", code: "MTY-B01-A003", description: "Alternadores" },
      { id: 11, warehouseId: 3, zone: "A", aisle: "01", shelf: "A", bin: "001", code: "MER-A01-A001", description: "Rodamientos" },
      { id: 12, warehouseId: 4, zone: "T", aisle: "01", shelf: "A", bin: "001", code: "TLL-T01-A001", description: "Taller - General" },
    ]
    return a?.warehouseId ? all.filter((l) => l.warehouseId === a.warehouseId) : all
  }
  d["create_storage_location"] = (a: any) => ({ id: Math.floor(Math.random() * 900) + 100, warehouseId: a?.warehouseId ?? 1, zone: a?.zone ?? "", aisle: a?.aisle ?? "", shelf: a?.shelf ?? "", bin: a?.bin ?? "", code: a?.code ?? "NEW-001", description: a?.description ?? "" })
  d["update_storage_location"] = (a: any) => a
  d["archive_storage_location"] = undefined

  // --- Products (144 products) ---
  d["get_products"] = (a: any) => ({
    data: [
      { id: 1, name: "Pastillas de Freno Delanteras", sku: "FRN-PFD-001", description: "Pastillas de freno delanteras para sedán", categoryId: 1, categoryName: "Pastillas de Freno", brandId: 2, brandName: "Brembo", unitPrice: 350, costPrice: 210, taxRate: 16, stock: 45, minStock: 10, maxStock: 100, warehouseId: 1, warehouseName: "Almacén Central", storageLocationId: 1, storageLocationCode: "CDMX-A01-A001", isActive: true },
      { id: 2, name: "Discos de Freno Delanteros", sku: "FRN-DFD-002", description: "Discos de freno delanteros ventilados", categoryId: 2, categoryName: "Discos de Freno", brandId: 2, brandName: "Brembo", unitPrice: 890, costPrice: 534, taxRate: 16, stock: 30, minStock: 8, maxStock: 60, warehouseId: 1, warehouseName: "Almacén Central", isActive: true },
      { id: 3, name: "Amortiguador Trasero", sku: "SUS-AMT-003", description: "Amortiguador trasero gas", categoryId: 3, categoryName: "Amortiguadores", brandId: 3, brandName: "Monroe", unitPrice: 650, costPrice: 390, taxRate: 16, stock: 25, minStock: 10, maxStock: 50, warehouseId: 1, isActive: true },
      { id: 4, name: "Filtro de Aceite", sku: "FLT-FAC-004", description: "Filtro de aceite para motor", categoryId: 4, categoryName: "Filtros", brandId: 13, brandName: "Mann-Filter", unitPrice: 85, costPrice: 51, taxRate: 16, stock: 120, minStock: 30, maxStock: 300, warehouseId: 1, isActive: true },
      { id: 5, name: "Bujía de Encendido", sku: "EN-BUJ-005", description: "Bujía de encendido de iridio", categoryId: 5, categoryName: "Bujías", brandId: 5, brandName: "NGK", unitPrice: 95, costPrice: 57, taxRate: 16, stock: 200, minStock: 50, maxStock: 500, warehouseId: 1, isActive: true },
    ],
    total: 144,
    page: a?.page ?? 1,
    pageSize: a?.pageSize ?? 25,
    totalPages: 6,
  })

  d["get_product"] = (a: any) => ({
    id: a?.id ?? 1,
    name: "Pastillas de Freno Delanteras",
    sku: "FRN-PFD-001",
    description: "Pastillas de freno delanteras para sedán",
    categoryId: 1,
    categoryName: "Pastillas de Freno",
    brandId: 2,
    brandName: "Brembo",
    unitPrice: 350,
    costPrice: 210,
    taxRate: 16,
    stock: 45,
    minStock: 10,
    maxStock: 100,
    warehouseId: 1,
    warehouseName: "Almacén Central",
    storageLocationId: 1,
    storageLocationCode: "CDMX-A01-A001",
    isActive: true,
    images: [],
    compatibility: [
      { id: 1, vehicleBrand: "Toyota", vehicleModel: "Corolla", yearStart: 2015, yearEnd: 2020, engine: "1.8L", notes: "Delanteras" },
      { id: 2, vehicleBrand: "Honda", vehicleModel: "Civic", yearStart: 2016, yearEnd: 2021, engine: "2.0L", notes: "Delanteras" },
    ],
  })
  d["create_product"] = (a: any) => ({ id: Math.floor(Math.random() * 900) + 100, name: a?.name ?? "Nuevo Producto", sku: a?.sku ?? "NEW-SKU-" + Date.now(), unitPrice: a?.unitPrice ?? 0, costPrice: a?.costPrice ?? 0, taxRate: a?.taxRate ?? 16, stock: 0, minStock: 5, maxStock: 50, isActive: true, ...a })
  d["update_product"] = (a: any) => a
  d["archive_product"] = undefined
  d["restore_product"] = undefined

  // --- Dashboard Stats ---
  d["get_dashboard_stats"] = {
    totalProducts: 144,
    lowStock: 12,
    categories: 30,
    totalValue: 45280.50,
    totalSales: 1280,
    todaySales: 3850.00,
    weekSales: 25400.00,
    monthSales: 98500.00,
    pendingOrders: 5,
    totalCustomers: 32,
    totalSuppliers: 24,
    activeUsers: 8,
    topSellingProducts: [
      { id: 4, name: "Filtro de Aceite", sku: "FLT-FAC-004", quantity: 45, total: 3825 },
      { id: 5, name: "Bujía de Encendido", sku: "EN-BUJ-005", quantity: 38, total: 3610 },
      { id: 1, name: "Pastillas de Freno Delanteras", sku: "FRN-PFD-001", quantity: 22, total: 7700 },
    ],
    recentSales: [
      { id: 1, customer: "Juan Pérez", total: 1250.00, createdAt: "2026-07-30T10:30:00Z" },
      { id: 2, customer: "María García", total: 890.00, createdAt: "2026-07-30T11:00:00Z" },
      { id: 3, customer: "Luis Martínez", total: 2340.00, createdAt: "2026-07-30T11:30:00Z" },
    ],
    lowStockProducts: [
      { id: 27, name: "Turbo Cargador Completo", sku: "TUR-COM-027", stock: 2, minStock: 1 },
      { id: 64, name: "Culata de Cilindro", sku: "MOT-CUL-064", stock: 2, minStock: 1 },
      { id: 10, name: "Alternador 120A", sku: "ELE-ALT-010", stock: 5, minStock: 2 },
    ],
  }

  // --- Inventory Movements ---
  d["get_inventory_movements"] = (a: any) => {
    const all = [
      { id: 1, productId: 1, productName: "Pastillas de Freno Delanteras", warehouseId: 1, warehouseName: "Almacén Central", quantity: 20, type: "entry", referenceType: "purchase", referenceId: "PO-001", notes: "Entrada por compra", createdBy: 1, createdAt: "2026-07-29T10:00:00Z" },
      { id: 2, productId: 4, productName: "Filtro de Aceite", warehouseId: 1, quantity: -5, type: "exit", referenceType: "sale", referenceId: "S-001", notes: "Salida por venta", createdBy: 1, createdAt: "2026-07-29T11:00:00Z" },
      { id: 3, productId: 5, productName: "Bujía de Encendido", warehouseId: 1, quantity: -10, type: "exit", referenceType: "sale", referenceId: "S-002", notes: "Salida por venta", createdBy: 1, createdAt: "2026-07-29T12:00:00Z" },
      { id: 4, productId: 7, productName: "Batería Automotriz 12V", warehouseId: 1, quantity: 5, type: "entry", referenceType: "purchase", referenceId: "PO-002", notes: "Entrada por compra", createdBy: 1, createdAt: "2026-07-28T10:00:00Z" },
      { id: 5, productId: 12, productName: "Rodamiento de Rueda Trasero", warehouseId: 3, quantity: -2, type: "exit", referenceType: "sale", referenceId: "S-003", notes: "Salida por venta", createdBy: 1, createdAt: "2026-07-28T11:00:00Z" },
      { id: 6, productId: 18, productName: "Llanta 205/55R16", warehouseId: 1, quantity: 10, type: "entry", referenceType: "purchase", referenceId: "PO-003", notes: "Entrada por compra", createdBy: 1, createdAt: "2026-07-27T10:00:00Z" },
      { id: 7, productId: 2, productName: "Discos de Freno Delanteros", warehouseId: 1, quantity: -3, type: "exit", referenceType: "sale", referenceId: "S-004", notes: "Salida por venta", createdBy: 1, createdAt: "2026-07-27T11:00:00Z" },
      { id: 8, productId: 34, productName: "Filtro de Aire", warehouseId: 1, quantity: -8, type: "exit", referenceType: "sale", referenceId: "S-005", notes: "Salida por venta", createdBy: 1, createdAt: "2026-07-26T10:00:00Z" },
      { id: 9, productId: 8, productName: "Kit de Embrague Completo", warehouseId: 2, quantity: 2, type: "entry", referenceType: "purchase", referenceId: "PO-004", notes: "Entrada por compra", createdBy: 1, createdAt: "2026-07-26T11:00:00Z" },
      { id: 10, productId: 3, productName: "Amortiguador Trasero", warehouseId: 1, quantity: -4, type: "exit", referenceType: "sale", referenceId: "S-006", notes: "Salida por venta", createdBy: 1, createdAt: "2026-07-25T10:00:00Z" },
      { id: 11, productId: 17, productName: "Aceite de Motor 20W50", warehouseId: 1, quantity: -12, type: "exit", referenceType: "sale", referenceId: "S-007", notes: "Salida por venta", createdBy: 1, createdAt: "2026-07-25T11:00:00Z" },
      { id: 12, productId: 23, productName: "Sensor de Oxígeno", warehouseId: 1, quantity: 8, type: "entry", referenceType: "purchase", referenceId: "PO-005", notes: "Entrada por compra", createdBy: 1, createdAt: "2026-07-24T10:00:00Z" },
      { id: 13, productId: 9, productName: "Radiador de Aluminio", warehouseId: 2, quantity: -1, type: "exit", referenceType: "sale", referenceId: "S-008", notes: "Salida por venta", createdBy: 1, createdAt: "2026-07-24T11:00:00Z" },
      { id: 14, productId: 15, productName: "Bomba de Dirección Hidráulica", warehouseId: 1, quantity: -2, type: "exit", referenceType: "sale", referenceId: "S-009", notes: "Salida por venta", createdBy: 1, createdAt: "2026-07-23T10:00:00Z" },
      { id: 15, productId: 30, productName: "Compresor de Aire Acondicionado", warehouseId: 3, quantity: 1, type: "entry", referenceType: "purchase", referenceId: "PO-006", notes: "Entrada por compra", createdBy: 1, createdAt: "2026-07-23T11:00:00Z" },
      { id: 16, productId: 6, productName: "Correa de Distribución", warehouseId: 1, quantity: -3, type: "exit", referenceType: "sale", referenceId: "S-010", notes: "Salida por venta", createdBy: 1, createdAt: "2026-07-22T10:00:00Z" },
      { id: 17, productId: 11, productName: "Motor de Arranque", warehouseId: 2, quantity: -2, type: "exit", referenceType: "sale", referenceId: "S-011", notes: "Salida por venta", createdBy: 1, createdAt: "2026-07-22T11:00:00Z" },
      { id: 18, productId: 21, productName: "Escobilla Limpiaparabrisas Juego", warehouseId: 1, quantity: -15, type: "exit", referenceType: "sale", referenceId: "S-012", notes: "Salida por venta", createdBy: 1, createdAt: "2026-07-21T10:00:00Z" },
      { id: 19, productId: 10, productName: "Alternador 120A", warehouseId: 2, quantity: 3, type: "entry", referenceType: "purchase", referenceId: "PO-007", notes: "Entrada por compra", createdBy: 1, createdAt: "2026-07-21T11:00:00Z" },
      { id: 20, productId: 25, productName: "Inyector de Combustible", warehouseId: 1, quantity: -4, type: "exit", referenceType: "sale", referenceId: "S-013", notes: "Salida por venta", createdBy: 1, createdAt: "2026-07-20T10:00:00Z" },
      { id: 21, productId: 28, productName: "Aceite de Transmisión Automática", warehouseId: 2, quantity: -6, type: "exit", referenceType: "sale", referenceId: "S-014", notes: "Salida por venta", createdBy: 1, createdAt: "2026-07-20T11:00:00Z" },
      { id: 22, productId: 13, productName: "Manguera de Radiador", warehouseId: 1, quantity: -8, type: "exit", referenceType: "sale", referenceId: "S-015", notes: "Salida por venta", createdBy: 1, createdAt: "2026-07-19T10:00:00Z" },
    ]
    return a?.productId ? all.filter((m) => m.productId === a.productId) : all
  }
  d["create_inventory_movement"] = (a: any) => ({ id: Math.floor(Math.random() * 900) + 100, ...a, createdAt: new Date().toISOString() })

  // --- Product Images ---
  d["get_product_images"] = () => []
  d["create_product_image"] = (a: any) => ({ id: Math.floor(Math.random() * 900) + 100, ...a })
  d["delete_product_image"] = undefined

  // --- Product Compatibility ---
  d["get_product_compatibility"] = (a: any) => {
    const all = [
      { id: 1, productId: 1, vehicleBrand: "Toyota", vehicleModel: "Corolla", yearStart: 2015, yearEnd: 2020, engine: "1.8L 2ZR-FE", transmission: "CVT", notes: "Delanteras" },
      { id: 2, productId: 1, vehicleBrand: "Honda", vehicleModel: "Civic", yearStart: 2016, yearEnd: 2021, engine: "2.0L R20A", transmission: "CVT", notes: "Delanteras" },
      { id: 3, productId: 1, vehicleBrand: "Nissan", vehicleModel: "Sentra", yearStart: 2017, yearEnd: 2022, engine: "1.8L MR18DE", transmission: "CVT", notes: "Delanteras" },
      { id: 4, productId: 1, vehicleBrand: "Mazda", vehicleModel: "3", yearStart: 2014, yearEnd: 2019, engine: "2.0L PE-VPS", transmission: "6AT", notes: "Delanteras" },
      { id: 5, productId: 2, vehicleBrand: "Toyota", vehicleModel: "Corolla", yearStart: 2015, yearEnd: 2020, engine: "1.8L", transmission: "CVT", notes: "Delanteros ventilados" },
      { id: 6, productId: 3, vehicleBrand: "Toyota", vehicleModel: "Hilux", yearStart: 2012, yearEnd: 2018, engine: "2.5L 2KD-FTV", transmission: "5MT", notes: "Trasero gas" },
      { id: 7, productId: 4, vehicleBrand: "Volkswagen", vehicleModel: "Jetta", yearStart: 2013, yearEnd: 2020, engine: "2.0L", transmission: "6AT", notes: "Motor gasolina" },
      { id: 8, productId: 5, vehicleBrand: "GM", vehicleModel: "Cruze", yearStart: 2016, yearEnd: 2021, engine: "1.4L Turbo", transmission: "6AT", notes: "Iridio" },
    ]
    return a?.productId ? all.filter((c) => c.productId === a.productId) : all
  }
  d["create_product_compatibility"] = (a: any) => ({ id: Math.floor(Math.random() * 900) + 100, ...a })
  d["delete_product_compatibility"] = undefined
  d["create_compatibility"] = (a: any) => ({ id: Math.floor(Math.random() * 900) + 100, ...a })
  d["delete_compatibility"] = undefined
  d["search_compatible_products"] = () => [
    { id: 1, productId: 1, productName: "Pastillas de Freno Delanteras", sku: "FRN-PFD-001", unitPrice: 350, brandName: "Brembo", matchScore: 95 },
    { id: 2, productId: 4, productName: "Filtro de Aceite", sku: "FLT-FAC-004", unitPrice: 85, brandName: "Mann-Filter", matchScore: 90 },
  ]
  d["get_recommendations_for_vehicle"] = () => [
    { id: 1, productId: 1, productName: "Pastillas de Freno Delanteras", sku: "FRN-PFD-001", unitPrice: 350, brandName: "Brembo", matchScore: 95 },
    { id: 2, productId: 4, productName: "Filtro de Aceite", sku: "FLT-FAC-004", unitPrice: 85, brandName: "Mann-Filter", matchScore: 92 },
    { id: 3, productId: 5, productName: "Bujía de Encendido", sku: "EN-BUJ-005", unitPrice: 95, brandName: "NGK", matchScore: 88 },
    { id: 4, productId: 6, productName: "Correa de Distribución", sku: "COR-CDI-006", unitPrice: 450, brandName: "Gates", matchScore: 85 },
  ]

  // --- Customers (30+) ---
  d["get_customers"] = (a: any) => {
    const all = [
      { id: 1, name: "Juan Pérez López", email: "juan.perez@email.com", phone: "+52 55 1111 2222", address: "Av. Reforma 123", city: "Ciudad de México", state: "CDMX", postalCode: "06600", country: "México", isActive: true, totalPurchases: 15, totalSpent: 28500.00, lastPurchase: "2026-07-28T10:00:00Z", createdAt: "2025-03-10T10:00:00Z" },
      { id: 2, name: "María García Hernández", email: "maria.garcia@email.com", phone: "+52 55 2222 3333", address: "Insurgentes Sur 456", city: "Ciudad de México", state: "CDMX", postalCode: "06700", country: "México", isActive: true, totalPurchases: 8, totalSpent: 12400.00, lastPurchase: "2026-07-25T10:00:00Z", createdAt: "2025-04-15T10:00:00Z" },
      { id: 3, name: "Luis Martínez Rodríguez", email: "luis.martinez@email.com", phone: "+52 55 3333 4444", address: "Calz. Vallejo 789", city: "Ciudad de México", state: "CDMX", postalCode: "07700", country: "México", isActive: true, totalPurchases: 22, totalSpent: 45200.00, lastPurchase: "2026-07-30T10:00:00Z", createdAt: "2025-01-20T10:00:00Z" },
      { id: 4, name: "Ana Sánchez Torres", email: "ana.sanchez@email.com", phone: "+52 55 4444 5555", address: "Eje Central 321", city: "Ciudad de México", state: "CDMX", postalCode: "06800", country: "México", isActive: true, totalPurchases: 5, totalSpent: 6800.00, lastPurchase: "2026-07-20T10:00:00Z", createdAt: "2025-05-10T10:00:00Z" },
      { id: 5, name: "Carlos Mendoza Flores", email: "carlos.mendoza@email.com", phone: "+52 55 5555 6666", address: "Av. Universidad 654", city: "Ciudad de México", state: "CDMX", postalCode: "04500", country: "México", isActive: true, totalPurchases: 12, totalSpent: 19800.00, lastPurchase: "2026-07-22T10:00:00Z", createdAt: "2025-02-28T10:00:00Z" },
      { id: 6, name: "Laura Jiménez Vargas", email: "laura.jimenez@email.com", phone: "+52 55 6666 7777", address: "Blvd. de las Águilas 987", city: "Ciudad de México", state: "CDMX", postalCode: "01700", country: "México", isActive: true, totalPurchases: 3, totalSpent: 3400.00, lastPurchase: "2026-07-15T10:00:00Z", createdAt: "2026-01-15T10:00:00Z" },
      { id: 7, name: "Roberto Díaz Castillo", email: "roberto.diaz@email.com", phone: "+52 55 7777 8888", address: "Av. Tláhuac 159", city: "Ciudad de México", state: "CDMX", postalCode: "13200", country: "México", isActive: true, totalPurchases: 18, totalSpent: 32100.00, lastPurchase: "2026-07-29T10:00:00Z", createdAt: "2025-03-20T10:00:00Z" },
      { id: 8, name: "Patricia Vega Ríos", email: "patricia.vega@email.com", phone: "+52 55 8888 9999", address: "Calz. México-Tacuba 753", city: "Ciudad de México", state: "CDMX", postalCode: "11400", country: "México", isActive: true, totalPurchases: 7, totalSpent: 9100.00, lastPurchase: "2026-07-18T10:00:00Z", createdAt: "2025-06-05T10:00:00Z" },
      { id: 9, name: "Fernando Ruiz Gómez", email: "fernando.ruiz@email.com", phone: "+52 55 9999 0000", address: "Av. Insurgentes 852", city: "Ciudad de México", state: "CDMX", postalCode: "06100", country: "México", isActive: true, totalPurchases: 10, totalSpent: 15600.00, lastPurchase: "2026-07-26T10:00:00Z", createdAt: "2025-04-10T10:00:00Z" },
      { id: 10, name: "Gabriela Soto Muñoz", email: "gabriela.soto@email.com", phone: "+52 55 0000 1111", address: "Eje 5 Sur 456", city: "Ciudad de México", state: "CDMX", postalCode: "09000", country: "México", isActive: true, totalPurchases: 4, totalSpent: 5200.00, lastPurchase: "2026-07-12T10:00:00Z", createdAt: "2025-08-20T10:00:00Z" },
      { id: 11, name: "Miguel Ángel Torres", email: "miguel.torres@email.com", phone: "+52 55 1111 2233", address: "Av. Revolución 321", city: "Ciudad de México", state: "CDMX", postalCode: "03800", country: "México", isActive: true, totalPurchases: 20, totalSpent: 38900.00, lastPurchase: "2026-07-30T10:00:00Z", createdAt: "2025-01-05T10:00:00Z" },
      { id: 12, name: "Diana Ramírez López", email: "diana.ramirez@email.com", phone: "+52 55 2222 3344", address: "Blvd. Adolfo López Mateos 654", city: "Ciudad de México", state: "CDMX", postalCode: "01200", country: "México", isActive: true, totalPurchases: 6, totalSpent: 7800.00, lastPurchase: "2026-07-16T10:00:00Z", createdAt: "2025-07-10T10:00:00Z" },
      { id: 13, name: "Oscar Hernández Flores", email: "oscar.hernandez@email.com", phone: "+52 81 1111 2222", address: "Av. Constitución 123", city: "Monterrey", state: "Nuevo León", postalCode: "64000", country: "México", isActive: true, totalPurchases: 9, totalSpent: 14200.00, lastPurchase: "2026-07-24T10:00:00Z", createdAt: "2025-02-15T10:00:00Z" },
      { id: 14, name: "Sofía Martínez García", email: "sofia.martinez@email.com", phone: "+52 81 2222 3333", address: "Blvd. Independencia 789", city: "Monterrey", state: "Nuevo León", postalCode: "64600", country: "México", isActive: true, totalPurchases: 14, totalSpent: 25600.00, lastPurchase: "2026-07-27T10:00:00Z", createdAt: "2025-03-01T10:00:00Z" },
      { id: 15, name: "Andrés López Sánchez", email: "andres.lopez@email.com", phone: "+52 33 1111 2222", address: "Av. Américas 456", city: "Guadalajara", state: "Jalisco", postalCode: "44100", country: "México", isActive: true, totalPurchases: 11, totalSpent: 20100.00, lastPurchase: "2026-07-23T10:00:00Z", createdAt: "2025-04-20T10:00:00Z" },
      { id: 16, name: "Carmen Torres Navarro", email: "carmen.torres@email.com", phone: "+52 33 2222 3333", address: "Av. Vallarta 789", city: "Guadalajara", state: "Jalisco", postalCode: "44110", country: "México", isActive: true, totalPurchases: 2, totalSpent: 1800.00, lastPurchase: "2026-07-10T10:00:00Z", createdAt: "2026-03-15T10:00:00Z" },
      { id: 17, name: "Héctor Rivas Mendoza", email: "hector.rivas@email.com", phone: "+52 442 1111 2222", address: "Av. Zaragoza 321", city: "Querétaro", state: "Querétaro", postalCode: "76000", country: "México", isActive: true, totalPurchases: 16, totalSpent: 29800.00, lastPurchase: "2026-07-28T10:00:00Z", createdAt: "2025-02-10T10:00:00Z" },
      { id: 18, name: "Verónica Nava Campos", email: "veronica.nava@email.com", phone: "+52 442 2222 3333", address: "Blvd. Bernardo Quintana 654", city: "Querétaro", state: "Querétaro", postalCode: "76050", country: "México", isActive: true, totalPurchases: 5, totalSpent: 6400.00, lastPurchase: "2026-07-19T10:00:00Z", createdAt: "2025-09-10T10:00:00Z" },
      { id: 19, name: "Ricardo Campos Ríos", email: "ricardo.campos@email.com", phone: "+52 999 1111 2222", address: "Av. Tecnológico 456", city: "Mérida", state: "Yucatán", postalCode: "97100", country: "México", isActive: true, totalPurchases: 7, totalSpent: 11200.00, lastPurchase: "2026-07-21T10:00:00Z", createdAt: "2025-05-25T10:00:00Z" },
      { id: 20, name: "Alejandra Tun Pech", email: "alejandra.tun@email.com", phone: "+52 999 2222 3333", address: "Calle 60 789", city: "Mérida", state: "Yucatán", postalCode: "97000", country: "México", isActive: true, totalPurchases: 3, totalSpent: 2900.00, lastPurchase: "2026-07-14T10:00:00Z", createdAt: "2026-02-20T10:00:00Z" },
      { id: 21, name: "Daniel Peña Rivera", email: "daniel.pena@email.com", phone: "+52 229 1111 2222", address: "Blvd. Costero 321", city: "Veracruz", state: "Veracruz", postalCode: "91700", country: "México", isActive: true, totalPurchases: 8, totalSpent: 13500.00, lastPurchase: "2026-07-22T10:00:00Z", createdAt: "2025-06-15T10:00:00Z" },
      { id: 22, name: "Eduardo Pacheco Lara", email: "eduardo.pacheco@email.com", phone: "+52 55 1234 5678", address: "Calz. de la Viga 753", city: "Ciudad de México", state: "CDMX", postalCode: "08800", country: "México", isActive: true, totalPurchases: 13, totalSpent: 22400.00, lastPurchase: "2026-07-29T10:00:00Z", createdAt: "2025-03-30T10:00:00Z" },
      { id: 23, name: "Paola Guerrero Soto", email: "paola.guerrero@email.com", phone: "+52 55 2345 6789", address: "Av. Azcapotzalco 456", city: "Ciudad de México", state: "CDMX", postalCode: "02000", country: "México", isActive: true, totalPurchases: 1, totalSpent: 650.00, lastPurchase: "2026-06-30T10:00:00Z", createdAt: "2026-06-30T10:00:00Z" },
      { id: 24, name: "Jorge Lara Cruz", email: "jorge.lara@email.com", phone: "+52 55 3456 7890", address: "Av. Ermita Iztapalapa 789", city: "Ciudad de México", state: "CDMX", postalCode: "09500", country: "México", isActive: true, totalPurchases: 10, totalSpent: 17800.00, lastPurchase: "2026-07-26T10:00:00Z", createdAt: "2025-04-05T10:00:00Z" },
      { id: 25, name: "Teresa Medina Flores", email: "teresa.medina@email.com", phone: "+52 55 4567 8901", address: "Blvd. Puerto Aéreo 321", city: "Ciudad de México", state: "CDMX", postalCode: "15500", country: "México", isActive: true, totalPurchases: 4, totalSpent: 5100.00, lastPurchase: "2026-07-17T10:00:00Z", createdAt: "2025-10-10T10:00:00Z" },
      { id: 26, name: "Gustavo Rangel Núñez", email: "gustavo.rangel@email.com", phone: "+52 55 5678 9012", address: "Av. Centenario 654", city: "Ciudad de México", state: "CDMX", postalCode: "02600", country: "México", isActive: true, totalPurchases: 6, totalSpent: 9600.00, lastPurchase: "2026-07-20T10:00:00Z", createdAt: "2025-07-05T10:00:00Z" },
      { id: 27, name: "Mónica Aguilar Serrano", email: "monica.aguilar@email.com", phone: "+52 55 6789 0123", address: "Eje 3 Oriente 987", city: "Ciudad de México", state: "CDMX", postalCode: "09060", country: "México", isActive: true, totalPurchases: 9, totalSpent: 14100.00, lastPurchase: "2026-07-24T10:00:00Z", createdAt: "2025-05-30T10:00:00Z" },
      { id: 28, name: "Alberto Cuevas Díaz", email: "alberto.cuevas@email.com", phone: "+52 33 3456 7890", address: "Av. México 456", city: "Guadalajara", state: "Jalisco", postalCode: "44120", country: "México", isActive: true, totalPurchases: 5, totalSpent: 8200.00, lastPurchase: "2026-07-18T10:00:00Z", createdAt: "2025-08-15T10:00:00Z" },
      { id: 29, name: "Rosa María Flores", email: "rosa.flores@email.com", phone: "+52 81 3456 7890", address: "Av. Miguel Alemán 123", city: "Monterrey", state: "Nuevo León", postalCode: "66400", country: "México", isActive: true, totalPurchases: 11, totalSpent: 19200.00, lastPurchase: "2026-07-27T10:00:00Z", createdAt: "2025-02-20T10:00:00Z" },
      { id: 30, name: "Francisco Javier López", email: "francisco.lopez@email.com", phone: "+52 55 7890 1234", address: "Calz. Zaragoza 159", city: "Ciudad de México", state: "CDMX", postalCode: "15000", country: "México", isActive: true, totalPurchases: 3, totalSpent: 4200.00, lastPurchase: "2026-07-11T10:00:00Z", createdAt: "2026-01-10T10:00:00Z" },
      { id: 31, name: "Silvia Ríos Navarro", email: "silvia.rios@email.com", phone: "+52 999 3456 7890", address: "Calle 67 321", city: "Mérida", state: "Yucatán", postalCode: "97200", country: "México", isActive: true, totalPurchases: 2, totalSpent: 2100.00, lastPurchase: "2026-07-08T10:00:00Z", createdAt: "2026-04-15T10:00:00Z" },
      { id: 32, name: "Raúl Velázquez Tun", email: "raul.velazquez@email.com", phone: "+52 44 2111 2233", address: "Av. Universidad 123", city: "San Luis Potosí", state: "San Luis Potosí", postalCode: "78000", country: "México", isActive: true, totalPurchases: 8, totalSpent: 12600.00, lastPurchase: "2026-07-23T10:00:00Z", createdAt: "2025-06-20T10:00:00Z" },
    ]
    if (a?.search) {
      const s = a.search.toLowerCase()
      return all.filter((c) => c.name.toLowerCase().includes(s) || c.email.toLowerCase().includes(s) || c.phone.includes(s))
    }
    return all
  }

  d["create_customer"] = (a: any) => ({ id: Math.floor(Math.random() * 900) + 100, name: a?.name ?? "Nuevo Cliente", email: a?.email ?? "", phone: a?.phone ?? "", address: a?.address ?? "", city: a?.city ?? "", state: a?.state ?? "", postalCode: a?.postalCode ?? "", country: a?.country ?? "México", isActive: true, totalPurchases: 0, totalSpent: 0, createdAt: new Date().toISOString() })
  d["update_customer"] = (a: any) => a
  d["archive_customer"] = undefined
  d["get_customer_detail"] = (a: any) => ({
    id: a?.id ?? 1,
    name: "Juan Pérez López",
    email: "juan.perez@email.com",
    phone: "+52 55 1111 2222",
    address: "Av. Reforma 123",
    city: "Ciudad de México",
    state: "CDMX",
    postalCode: "06600",
    country: "México",
    isActive: true,
    totalPurchases: 15,
    totalSpent: 28500.00,
    lastPurchase: "2026-07-28T10:00:00Z",
    createdAt: "2025-03-10T10:00:00Z",
    updatedAt: "2026-07-28T10:00:00Z",
    notes: "Cliente frecuente, prefiere productos de frenado",
    creditLimit: 10000,
    creditBalance: 2500,
    hasCreditAccount: true,
    vehicles: [
      { id: 1, licensePlate: "ABC-1234", brand: "Toyota", model: "Corolla", year: 2018, color: "Blanco" },
    ],
  })
  d["get_customer_sales"] = (a: any) => [
    { id: 1, customerId: a?.customerId ?? 1, customerName: "Juan Pérez López", total: 1250.00, paymentMethod: "Efectivo", paymentStatus: "paid", items: 3, createdAt: "2026-07-28T10:30:00Z" },
    { id: 2, customerId: a?.customerId ?? 1, total: 890.00, paymentMethod: "Tarjeta", paymentStatus: "paid", items: 2, createdAt: "2026-07-20T10:30:00Z" },
    { id: 3, customerId: a?.customerId ?? 1, total: 2340.00, paymentMethod: "Crédito", paymentStatus: "pending", items: 4, createdAt: "2026-07-15T10:30:00Z" },
    { id: 4, customerId: a?.customerId ?? 1, total: 560.00, paymentMethod: "Efectivo", paymentStatus: "paid", items: 1, createdAt: "2026-07-10T10:30:00Z" },
    { id: 5, customerId: a?.customerId ?? 1, total: 1850.00, paymentMethod: "Transferencia", paymentStatus: "paid", items: 3, createdAt: "2026-07-05T10:30:00Z" },
    { id: 6, customerId: a?.customerId ?? 1, total: 320.00, paymentMethod: "Efectivo", paymentStatus: "paid", items: 1, createdAt: "2026-06-28T10:30:00Z" },
  ]
  d["get_credit_account"] = (a: any) => ({
    id: 1,
    customerId: a?.customerId ?? 1,
    customerName: "Juan Pérez López",
    creditLimit: 10000,
    currentBalance: 2500,
    availableCredit: 7500,
    status: "active",
    openedAt: "2025-03-10T10:00:00Z",
    lastTransaction: "2026-07-15T10:30:00Z",
  })
  d["create_credit_account"] = (a: any) => ({ id: Math.floor(Math.random() * 900) + 100, customerId: a?.customerId, creditLimit: a?.creditLimit, currentBalance: 0, availableCredit: a?.creditLimit, status: "active", openedAt: new Date().toISOString() })
  d["get_credit_transactions"] = (a: any) => [
    { id: 1, accountId: a?.accountId ?? 1, amount: 2500, transactionType: "purchase", referenceType: "sale", referenceId: "S-003", notes: "Compra a crédito", createdBy: 1, createdAt: "2026-07-15T10:30:00Z" },
    { id: 2, accountId: a?.accountId ?? 1, amount: -500, transactionType: "payment", referenceType: "cash", referenceId: "P-001", notes: "Pago a cuenta", createdBy: 1, createdAt: "2026-07-18T10:30:00Z" },
    { id: 3, accountId: a?.accountId ?? 1, amount: 1500, transactionType: "purchase", referenceType: "sale", referenceId: "S-006", notes: "Compra a crédito", createdBy: 1, createdAt: "2026-07-22T10:30:00Z" },
    { id: 4, accountId: a?.accountId ?? 1, amount: -1000, transactionType: "payment", referenceType: "cash", referenceId: "P-002", notes: "Pago a cuenta", createdBy: 1, createdAt: "2026-07-25T10:30:00Z" },
    { id: 5, accountId: a?.accountId ?? 1, amount: 2500, transactionType: "purchase", referenceType: "sale", referenceId: "S-008", notes: "Compra a crédito", createdBy: 1, createdAt: "2026-07-28T10:30:00Z" },
  ]
  d["add_credit_transaction"] = (a: any) => ({ id: Math.floor(Math.random() * 900) + 100, accountId: a?.accountId, amount: a?.amount, transactionType: a?.transactionType, referenceType: a?.referenceType, referenceId: a?.referenceId, notes: a?.notes, createdBy: a?.createdBy, createdAt: new Date().toISOString() })
  d["get_communications"] = (a: any) => [
    { id: 1, customerId: a?.customerId ?? 1, type: "call", subject: "Llamada de seguimiento", content: "Se contactó al cliente para recordatorio de servicio", direction: "outbound", createdBy: 1, createdAt: "2026-07-20T10:00:00Z" },
    { id: 2, customerId: a?.customerId ?? 1, type: "email", subject: "Promoción de frenos", content: "Se envió oferta de pastillas de freno", direction: "outbound", createdBy: 1, createdAt: "2026-07-18T10:00:00Z" },
    { id: 3, customerId: a?.customerId ?? 1, type: "whatsapp", subject: "Recordatorio de pago", content: "Se recordó pago pendiente", direction: "outbound", createdBy: 1, createdAt: "2026-07-16T10:00:00Z" },
    { id: 4, customerId: a?.customerId ?? 1, type: "call", subject: "Consulta de producto", content: "Cliente preguntó por disponibilidad de frenos", direction: "inbound", createdBy: 1, createdAt: "2026-07-14T10:00:00Z" },
  ]
  d["create_communication"] = (a: any) => ({ id: Math.floor(Math.random() * 900) + 100, customerId: a?.customerId, type: a?.type, subject: a?.subject, content: a?.content, createdAt: new Date().toISOString() })
  d["get_customer_notes"] = (a: any) => [
    { id: 1, customerId: a?.customerId ?? 1, noteType: "general", title: "Cliente frecuente", content: "Prefiere comprar pastillas de freno marca Brembo", isPrivate: false, createdBy: 1, createdAt: "2025-03-10T10:00:00Z" },
    { id: 2, customerId: a?.customerId ?? 1, noteType: "followup", title: "Recordar cambio de aceite", content: "Cliente tiene pendiente cambio de aceite cada 6 meses", isPrivate: true, createdBy: 1, createdAt: "2026-01-15T10:00:00Z" },
    { id: 3, customerId: a?.customerId ?? 1, noteType: "complaint", title: "Queja resuelta", content: "Cliente reportó ruido en frenos, se reemplazaron bajo garantía", isPrivate: false, createdBy: 1, createdAt: "2026-03-20T10:00:00Z" },
  ]
  d["create_customer_note"] = (a: any) => ({ id: Math.floor(Math.random() * 900) + 100, customerId: a?.customerId, noteType: a?.noteType, title: a?.title, content: a?.content, isPrivate: a?.isPrivate, createdBy: a?.createdBy, createdAt: new Date().toISOString() })
  d["get_customer_timeline"] = (a: any) => [
    { id: 1, customerId: a?.customerId ?? 1, eventType: "purchase", description: "Compra de pastillas de freno", referenceId: "S-001", createdAt: "2026-07-28T10:30:00Z" },
    { id: 2, customerId: a?.customerId ?? 1, eventType: "payment", description: "Pago a cuenta de crédito", referenceId: "P-001", createdAt: "2026-07-25T10:30:00Z" },
    { id: 3, customerId: a?.customerId ?? 1, eventType: "call", description: "Llamada de seguimiento", referenceId: "C-001", createdAt: "2026-07-20T10:00:00Z" },
    { id: 4, customerId: a?.customerId ?? 1, eventType: "note", description: "Nota agregada: Recordar cambio de aceite", createdAt: "2026-01-15T10:00:00Z" },
    { id: 5, customerId: a?.customerId ?? 1, eventType: "purchase", description: "Compra de frenos y filtro", referenceId: "S-002", createdAt: "2026-07-30T10:30:00Z" },
    { id: 6, customerId: a?.customerId ?? 1, eventType: "vehicle_added", description: "Vehículo registrado: Toyota Corolla 2018", createdAt: "2025-03-10T10:00:00Z" },
  ]

  // --- Vehicle Brands ---
  d["get_vehicle_brands"] = (a: any) => {
    const all = [
      { id: 1, name: "Toyota", description: "Toyota Motor Corporation", country: "Japón", isActive: true },
      { id: 2, name: "Honda", description: "Honda Motor Co., Ltd.", country: "Japón", isActive: true },
      { id: 3, name: "Nissan", description: "Nissan Motor Corporation", country: "Japón", isActive: true },
      { id: 4, name: "Mazda", description: "Mazda Motor Corporation", country: "Japón", isActive: true },
      { id: 5, name: "Volkswagen", description: "Volkswagen AG", country: "Alemania", isActive: true },
      { id: 6, name: "BMW", description: "Bayerische Motoren Werke AG", country: "Alemania", isActive: true },
      { id: 7, name: "Mercedes-Benz", description: "Mercedes-Benz Group AG", country: "Alemania", isActive: true },
      { id: 8, name: "Audi", description: "Audi AG", country: "Alemania", isActive: true },
      { id: 9, name: "Ford", description: "Ford Motor Company", country: "Estados Unidos", isActive: true },
      { id: 10, name: "Chevrolet", description: "General Motors", country: "Estados Unidos", isActive: true },
      { id: 11, name: "Hyundai", description: "Hyundai Motor Company", country: "Corea del Sur", isActive: true },
      { id: 12, name: "Kia", description: "Kia Corporation", country: "Corea del Sur", isActive: true },
      { id: 13, name: "Suzuki", description: "Suzuki Motor Corporation", country: "Japón", isActive: true },
      { id: 14, name: "Mitsubishi", description: "Mitsubishi Motors", country: "Japón", isActive: true },
      { id: 15, name: "Subaru", description: "Subaru Corporation", country: "Japón", isActive: true },
      { id: 16, name: "Renault", description: "Renault Group", country: "Francia", isActive: true },
      { id: 17, name: "Peugeot", description: "Peugeot S.A.", country: "Francia", isActive: true },
      { id: 18, name: "Fiat", description: "Fiat Automobiles", country: "Italia", isActive: true },
      { id: 19, name: "Chrysler", description: "Stellantis North America", country: "Estados Unidos", isActive: true },
      { id: 20, name: "Jeep", description: "Jeep / Stellantis", country: "Estados Unidos", isActive: true },
    ]
    if (a?.search) {
      const s = a.search.toLowerCase()
      return all.filter((b) => b.name.toLowerCase().includes(s))
    }
    return all
  }
  d["create_vehicle_brand"] = (a: any) => ({ id: Math.floor(Math.random() * 900) + 100, name: a?.name, description: a?.description, country: a?.country, isActive: true })
  d["update_vehicle_brand"] = (a: any) => a

  // --- Vehicle Models ---
  d["get_vehicle_models"] = (a: any) => {
    const all: Record<number, any[]> = {
      1: [
        { id: 1, brandId: 1, name: "Corolla", isActive: true },
        { id: 2, brandId: 1, name: "Hilux", isActive: true },
        { id: 3, brandId: 1, name: "Camry", isActive: true },
        { id: 4, brandId: 1, name: "RAV4", isActive: true },
        { id: 5, brandId: 1, name: "Yaris", isActive: true },
        { id: 6, brandId: 1, name: "Tacoma", isActive: true },
        { id: 7, brandId: 1, name: "Tundra", isActive: true },
      ],
      2: [
        { id: 8, brandId: 2, name: "Civic", isActive: true },
        { id: 9, brandId: 2, name: "CR-V", isActive: true },
        { id: 10, brandId: 2, name: "Accord", isActive: true },
        { id: 11, brandId: 2, name: "HR-V", isActive: true },
        { id: 12, brandId: 2, name: "Pilot", isActive: true },
      ],
      3: [
        { id: 13, brandId: 3, name: "Sentra", isActive: true },
        { id: 14, brandId: 3, name: "Versa", isActive: true },
        { id: 15, brandId: 3, name: "Altima", isActive: true },
        { id: 16, brandId: 3, name: "Frontier", isActive: true },
        { id: 17, brandId: 3, name: "NP300", isActive: true },
      ],
      5: [
        { id: 18, brandId: 5, name: "Jetta", isActive: true },
        { id: 19, brandId: 5, name: "Vento", isActive: true },
        { id: 20, brandId: 5, name: "Tiguan", isActive: true },
        { id: 21, brandId: 5, name: "Golf", isActive: true },
        { id: 22, brandId: 5, name: "Passat", isActive: true },
      ],
    }
    if (a?.brandId) {
      return all[a.brandId] ?? []
    }
    const models = Object.values(all).flat()
    if (a?.search) {
      const s = a.search.toLowerCase()
      return models.filter((m: any) => m.name.toLowerCase().includes(s))
    }
    return models
  }
  d["create_vehicle_model"] = (a: any) => ({ id: Math.floor(Math.random() * 900) + 100, brandId: a?.brandId, name: a?.name, isActive: true })

  // --- Vehicle Generations ---
  d["get_vehicle_generations"] = (a: any) => {
    const all: Record<number, any[]> = {
      1: [
        { id: 1, modelId: 1, name: "E180", yearStart: 2013, yearEnd: 2018 },
        { id: 2, modelId: 1, name: "E210", yearStart: 2019, yearEnd: 2024 },
      ],
      8: [
        { id: 3, modelId: 8, name: "FC5", yearStart: 2016, yearEnd: 2021 },
        { id: 4, modelId: 8, name: "FE", yearStart: 2022, yearEnd: 2025 },
      ],
    }
    return a?.modelId ? (all[a.modelId] ?? []) : []
  }
  d["create_vehicle_generation"] = (a: any) => ({ id: Math.floor(Math.random() * 900) + 100, modelId: a?.modelId, name: a?.name ?? "", yearStart: a?.yearStart, yearEnd: a?.yearEnd })

  // --- Vehicle Engines ---
  d["get_vehicle_engines"] = (a: any) => {
    const all = [
      { id: 1, name: "1.8L 2ZR-FE", displacement: "1.8L", power: "140 hp", fuelType: "Gasolina" },
      { id: 2, name: "2.0L R20A", displacement: "2.0L", power: "155 hp", fuelType: "Gasolina" },
      { id: 3, name: "1.6L HR16DE", displacement: "1.6L", power: "118 hp", fuelType: "Gasolina" },
      { id: 4, name: "2.5L 2KD-FTV", displacement: "2.5L", power: "144 hp", fuelType: "Diésel" },
      { id: 5, name: "2.0L EA888", displacement: "2.0L", power: "210 hp", fuelType: "Gasolina" },
      { id: 6, name: "1.4L TSI", displacement: "1.4L", power: "150 hp", fuelType: "Gasolina" },
      { id: 7, name: "3.0L N57", displacement: "3.0L", power: "258 hp", fuelType: "Diésel" },
      { id: 8, name: "2.0L PE-VPS", displacement: "2.0L", power: "165 hp", fuelType: "Gasolina" },
    ]
    if (a?.search) {
      const s = a.search.toLowerCase()
      return all.filter((e) => e.name.toLowerCase().includes(s) || e.fuelType.toLowerCase().includes(s))
    }
    return all
  }
  d["create_vehicle_engine"] = (a: any) => ({ id: Math.floor(Math.random() * 900) + 100, name: a?.name, displacement: a?.displacement, power: a?.power, fuelType: a?.fuelType })

  // --- Vehicle Transmissions ---
  d["get_vehicle_transmissions"] = () => [
    { id: 1, name: "5MT", type: "manual", gears: 5 },
    { id: 2, name: "6MT", type: "manual", gears: 6 },
    { id: 3, name: "5AT", type: "automatic", gears: 5 },
    { id: 4, name: "6AT", type: "automatic", gears: 6 },
    { id: 5, name: "8AT", type: "automatic", gears: 8 },
    { id: 6, name: "CVT", type: "cvt", gears: null },
    { id: 7, name: "DCT", type: "dct", gears: 6 },
    { id: 8, name: "AMT", type: "amt", gears: 5 },
  ]
  d["create_vehicle_transmission"] = (a: any) => ({ id: Math.floor(Math.random() * 900) + 100, name: a?.name, type: a?.type, gears: a?.gears })

  // --- Vehicle Fuels ---
  d["get_vehicle_fuels"] = () => [
    { id: 1, name: "Gasolina", description: "Gasolina sin plomo" },
    { id: 2, name: "Diésel", description: "Diésel automotriz" },
    { id: 3, name: "Eléctrico", description: "Vehículo eléctrico" },
    { id: 4, name: "Híbrido", description: "Gasolina + Eléctrico" },
    { id: 5, name: "Gas LP", description: "Gas licuado de petróleo" },
    { id: 6, name: "GNV", description: "Gas natural vehicular" },
  ]
  d["create_vehicle_fuel"] = (a: any) => ({ id: Math.floor(Math.random() * 900) + 100, name: a?.name })

  // --- Customer Vehicles ---
  d["get_customer_vehicles"] = (a: any) => [
    { id: 1, customerId: a?.customerId ?? 1, licensePlate: "ABC-1234", nickname: "Corolla Blanco", brandId: 1, brandName: "Toyota", modelId: 1, modelName: "Corolla", generationId: 2, generationName: "E210", year: 2020, engineId: 1, engineName: "1.8L 2ZR-FE", transmissionId: 6, transmissionName: "CVT", fuelId: 1, fuelName: "Gasolina", vin: "JT2BF26KX0R123456", color: "Blanco", mileage: 45000, purchaseDate: "2020-06-15", isActive: true },
    { id: 2, customerId: a?.customerId ?? 1, licensePlate: "DEF-5678", nickname: "Hilux de trabajo", brandId: 1, brandName: "Toyota", modelId: 2, modelName: "Hilux", year: 2018, engineId: 4, engineName: "2.5L 2KD-FTV", transmissionId: 1, transmissionName: "5MT", fuelId: 2, fuelName: "Diésel", vin: "JT2BF26KX0R789012", color: "Gris", mileage: 85000, purchaseDate: "2018-03-10", isActive: true },
  ]
  d["get_customer_vehicle"] = (a: any) => ({
    id: a?.id ?? 1,
    customerId: 1,
    licensePlate: "ABC-1234",
    nickname: "Corolla Blanco",
    brandId: 1,
    brandName: "Toyota",
    modelId: 1,
    modelName: "Corolla",
    generationId: 2,
    generationName: "E210",
    year: 2020,
    engineId: 1,
    engineName: "1.8L 2ZR-FE",
    transmissionId: 6,
    transmissionName: "CVT",
    fuelId: 1,
    fuelName: "Gasolina",
    vin: "JT2BF26KX0R123456",
    color: "Blanco",
    mileage: 45000,
    purchaseDate: "2020-06-15",
    isActive: true,
  })
  d["create_customer_vehicle"] = (a: any) => ({ id: Math.floor(Math.random() * 900) + 100, ...a, createdAt: new Date().toISOString() })
  d["update_customer_vehicle"] = (a: any) => a
  d["delete_customer_vehicle"] = undefined

  // --- Service Reminders ---
  d["get_service_reminders"] = (a: any) => [
    { id: 1, customerId: a?.customerId ?? 1, customerName: "Juan Pérez López", vehicleId: 1, vehicleName: "Corolla 2020", reminderType: "maintenance", title: "Cambio de Aceite", description: "Cambio de aceite cada 6 meses", dueDate: "2026-09-15", dueMileage: 50000, status: "pending", createdBy: 1, createdAt: "2026-07-15T10:00:00Z" },
    { id: 2, customerId: a?.customerId ?? 1, customerName: "Juan Pérez López", vehicleId: 1, vehicleName: "Corolla 2020", reminderType: "inspection", title: "Revisión de Frenos", description: "Revisión del sistema de frenos", dueDate: "2026-10-01", dueMileage: null, status: "pending", createdBy: 1, createdAt: "2026-07-20T10:00:00Z" },
    { id: 3, customerId: a?.customerId ?? 2, customerName: "María García Hernández", vehicleId: 2, vehicleName: "Civic 2019", reminderType: "maintenance", title: "Cambio de Bujías", description: "Cambiar bujías cada 40000 km", dueDate: "2026-08-20", dueMileage: 60000, status: "pending", createdBy: 1, createdAt: "2026-07-10T10:00:00Z" },
    { id: 4, customerId: a?.customerId ?? 3, customerName: "Luis Martínez Rodríguez", vehicleId: 3, vehicleName: "Sentra 2021", reminderType: "service", title: "Servicio de 30000 km", description: "Servicio completo de mantenimiento", dueDate: "2026-08-01", dueMileage: 30000, status: "overdue", createdBy: 1, createdAt: "2026-06-01T10:00:00Z" },
    { id: 5, customerId: a?.customerId ?? 1, customerName: "Juan Pérez López", vehicleId: 1, vehicleName: "Corolla 2020", reminderType: "warranty", title: "Fin Garantía", description: "La garantía del vehículo expira", dueDate: "2026-12-31", dueMileage: null, status: "completed", createdBy: 1, createdAt: "2026-01-01T10:00:00Z" },
  ]
  d["get_service_reminder"] = (a: any) => ({
    id: a?.id ?? 1,
    customerId: 1,
    customerName: "Juan Pérez López",
    vehicleId: 1,
    vehicleName: "Corolla 2020",
    reminderType: "maintenance",
    title: "Cambio de Aceite",
    description: "Cambio de aceite cada 6 meses",
    dueDate: "2026-09-15",
    dueMileage: 50000,
    status: "pending",
    createdBy: 1,
    createdAt: "2026-07-15T10:00:00Z",
    updatedAt: "2026-07-15T10:00:00Z",
  })
  d["create_service_reminder"] = (a: any) => ({ id: Math.floor(Math.random() * 900) + 100, ...a, createdAt: new Date().toISOString() })
  d["update_service_reminder_status"] = (a: any) => ({ ...a, status: a?.status, updatedAt: new Date().toISOString() })
  d["get_overdue_reminders"] = () => [
    { id: 4, customerId: 3, customerName: "Luis Martínez Rodríguez", vehicleId: 3, vehicleName: "Sentra 2021", reminderType: "service", title: "Servicio de 30000 km", description: "Servicio completo de mantenimiento", dueDate: "2026-08-01", status: "overdue", createdAt: "2026-06-01T10:00:00Z" },
  ]

  // --- Warranties ---
  d["get_warranties"] = (a: any) => [
    { id: 1, saleId: 1, productId: 1, productName: "Pastillas de Freno Delanteras", customerId: 1, customerName: "Juan Pérez López", vehicleId: 1, vehicleName: "Corolla 2020", warrantyType: "product", periodMonths: 12, startDate: "2026-07-28", endDate: "2027-07-28", status: "active", notes: "Garantía estándar de fábrica", createdBy: 1, createdAt: "2026-07-28T10:30:00Z" },
    { id: 2, saleId: 2, productId: 4, productName: "Filtro de Aceite", customerId: 2, customerName: "María García Hernández", warrantyType: "product", periodMonths: 6, startDate: "2026-07-20", endDate: "2027-01-20", status: "active", createdBy: 1, createdAt: "2026-07-20T10:30:00Z" },
    { id: 3, saleId: 3, productId: 8, productName: "Kit de Embrague Completo", customerId: 3, customerName: "Luis Martínez Rodríguez", warrantyType: "extended", periodMonths: 24, startDate: "2026-07-15", endDate: "2028-07-15", status: "active", notes: "Garantía extendida", createdBy: 1, createdAt: "2026-07-15T10:30:00Z" },
  ]
  d["get_warranty"] = (a: any) => ({
    id: a?.id ?? 1,
    saleId: 1,
    productId: 1,
    productName: "Pastillas de Freno Delanteras",
    customerId: 1,
    customerName: "Juan Pérez López",
    warrantyType: "product",
    periodMonths: 12,
    startDate: "2026-07-28",
    endDate: "2027-07-28",
    status: "active",
    createdBy: 1,
    createdAt: "2026-07-28T10:30:00Z",
  })
  d["create_warranty"] = (a: any) => ({ id: Math.floor(Math.random() * 900) + 100, ...a, createdAt: new Date().toISOString() })
  d["update_warranty_status"] = (a: any) => ({ ...a, status: a?.status, updatedAt: new Date().toISOString() })
  d["get_expiring_warranties"] = (a: any) => [
    { id: 2, productName: "Filtro de Aceite", customerName: "María García Hernández", endDate: "2027-01-20", status: "active" },
  ]

  // --- CRM Dashboard ---
  d["get_crm_dashboard"] = {
    totalCustomers: 32,
    newCustomersThisMonth: 3,
    activeCustomersThisMonth: 18,
    pendingReminders: 4,
    overdueReminders: 1,
    totalVehicles: 38,
    totalServiceReminders: 12,
    customerGrowth: [
      { month: "2026-01", count: 18 },
      { month: "2026-02", count: 20 },
      { month: "2026-03", count: 22 },
      { month: "2026-04", count: 24 },
      { month: "2026-05", count: 27 },
      { month: "2026-06", count: 29 },
      { month: "2026-07", count: 32 },
    ],
    topCustomers: [
      { id: 3, name: "Luis Martínez Rodríguez", totalSpent: 45200, lastPurchase: "2026-07-30T10:00:00Z" },
      { id: 11, name: "Miguel Ángel Torres", totalSpent: 38900, lastPurchase: "2026-07-30T10:00:00Z" },
      { id: 7, name: "Roberto Díaz Castillo", totalSpent: 32100, lastPurchase: "2026-07-29T10:00:00Z" },
    ],
  }
  d["get_customers_by_month"] = (a: any) => [
    ["2026-01", 18],
    ["2026-02", 20],
    ["2026-03", 22],
    ["2026-04", 24],
    ["2026-05", 27],
    ["2026-06", 29],
    ["2026-07", 32],
  ]

  // --- Sales / POS ---
  d["get_sales"] = () => [
    { id: 1, customerId: 1, customerName: "Juan Pérez López", subtotal: 1080.00, taxRate: 16, taxAmount: 172.80, discountAmount: 0, total: 1252.80, paymentMethod: "Efectivo", paymentStatus: "paid", items: 3, createdAt: "2026-07-30T10:30:00Z" },
    { id: 2, customerId: 2, customerName: "María García Hernández", subtotal: 767.24, taxRate: 16, taxAmount: 122.76, discountAmount: 0, total: 890.00, paymentMethod: "Tarjeta", paymentStatus: "paid", items: 2, createdAt: "2026-07-30T11:00:00Z" },
    { id: 3, customerId: 3, customerName: "Luis Martínez Rodríguez", subtotal: 2017.24, taxRate: 16, taxAmount: 322.76, discountAmount: 0, total: 2340.00, paymentMethod: "Crédito", paymentStatus: "pending", items: 4, createdAt: "2026-07-30T11:30:00Z" },
    { id: 4, customerId: null, customerName: "Cliente General", subtotal: 482.76, taxRate: 16, taxAmount: 77.24, discountAmount: 0, total: 560.00, paymentMethod: "Efectivo", paymentStatus: "paid", items: 1, createdAt: "2026-07-30T12:00:00Z" },
    { id: 5, customerId: 1, customerName: "Juan Pérez López", subtotal: 1594.83, taxRate: 16, taxAmount: 255.17, discountAmount: 0, total: 1850.00, paymentMethod: "Transferencia", paymentStatus: "paid", items: 3, createdAt: "2026-07-29T10:30:00Z" },
    { id: 6, customerId: 4, customerName: "Ana Sánchez Torres", subtotal: 275.86, taxRate: 16, taxAmount: 44.14, discountAmount: 0, total: 320.00, paymentMethod: "Efectivo", paymentStatus: "paid", items: 1, createdAt: "2026-07-29T11:00:00Z" },
    { id: 7, customerId: 5, customerName: "Carlos Mendoza Flores", subtotal: 775.86, taxRate: 16, taxAmount: 124.14, discountAmount: 0, total: 900.00, paymentMethod: "Tarjeta", paymentStatus: "paid", items: 2, createdAt: "2026-07-29T11:30:00Z" },
    { id: 8, customerId: 7, customerName: "Roberto Díaz Castillo", subtotal: 2931.03, taxRate: 16, taxAmount: 468.97, discountAmount: 0, total: 3400.00, paymentMethod: "Crédito", paymentStatus: "paid", items: 5, createdAt: "2026-07-28T10:00:00Z" },
    { id: 9, customerId: 13, customerName: "Oscar Hernández Flores", subtotal: 431.03, taxRate: 16, taxAmount: 68.97, discountAmount: 0, total: 500.00, paymentMethod: "Efectivo", paymentStatus: "paid", items: 1, createdAt: "2026-07-28T11:00:00Z" },
    { id: 10, customerId: 17, customerName: "Héctor Rivas Mendoza", subtotal: 1034.48, taxRate: 16, taxAmount: 165.52, discountAmount: 0, total: 1200.00, paymentMethod: "Tarjeta", paymentStatus: "paid", items: 2, createdAt: "2026-07-28T11:30:00Z" },
    { id: 11, customerId: 1, customerName: "Juan Pérez López", subtotal: 2586.21, taxRate: 16, taxAmount: 413.79, discountAmount: 0, total: 3000.00, paymentMethod: "Efectivo", paymentStatus: "paid", items: 4, createdAt: "2026-07-27T10:00:00Z" },
    { id: 12, customerId: 6, customerName: "Laura Jiménez Vargas", subtotal: 517.24, taxRate: 16, taxAmount: 82.76, discountAmount: 0, total: 600.00, paymentMethod: "Tarjeta", paymentStatus: "paid", items: 2, createdAt: "2026-07-27T11:00:00Z" },
    { id: 13, customerId: 2, customerName: "María García Hernández", subtotal: 1551.72, taxRate: 16, taxAmount: 248.28, discountAmount: 0, total: 1800.00, paymentMethod: "Transferencia", paymentStatus: "paid", items: 3, createdAt: "2026-07-26T10:00:00Z" },
    { id: 14, customerId: 8, customerName: "Patricia Vega Ríos", subtotal: 689.66, taxRate: 16, taxAmount: 110.34, discountAmount: 0, total: 800.00, paymentMethod: "Efectivo", paymentStatus: "paid", items: 1, createdAt: "2026-07-26T11:00:00Z" },
    { id: 15, customerId: 14, customerName: "Sofía Martínez García", subtotal: 1293.10, taxRate: 16, taxAmount: 206.90, discountAmount: 0, total: 1500.00, paymentMethod: "Tarjeta", paymentStatus: "paid", items: 2, createdAt: "2026-07-25T10:00:00Z" },
    { id: 16, customerId: 9, customerName: "Fernando Ruiz Gómez", subtotal: 862.07, taxRate: 16, taxAmount: 137.93, discountAmount: 0, total: 1000.00, paymentMethod: "Efectivo", paymentStatus: "paid", items: 2, createdAt: "2026-07-25T11:00:00Z" },
    { id: 17, customerId: 22, customerName: "Eduardo Pacheco Lara", subtotal: 2155.17, taxRate: 16, taxAmount: 344.83, discountAmount: 0, total: 2500.00, paymentMethod: "Transferencia", paymentStatus: "paid", items: 3, createdAt: "2026-07-24T10:00:00Z" },
    { id: 18, customerId: 3, customerName: "Luis Martínez Rodríguez", subtotal: 4310.34, taxRate: 16, taxAmount: 689.66, discountAmount: 0, total: 5000.00, paymentMethod: "Crédito", paymentStatus: "paid", items: 5, createdAt: "2026-07-24T11:00:00Z" },
    { id: 19, customerId: 24, customerName: "Jorge Lara Cruz", subtotal: 344.83, taxRate: 16, taxAmount: 55.17, discountAmount: 0, total: 400.00, paymentMethod: "Efectivo", paymentStatus: "paid", items: 1, createdAt: "2026-07-23T10:00:00Z" },
    { id: 20, customerId: 29, customerName: "Rosa María Flores", subtotal: 1724.14, taxRate: 16, taxAmount: 275.86, discountAmount: 0, total: 2000.00, paymentMethod: "Tarjeta", paymentStatus: "paid", items: 3, createdAt: "2026-07-23T11:00:00Z" },
    { id: 21, customerId: 11, customerName: "Miguel Ángel Torres", subtotal: 2586.21, taxRate: 16, taxAmount: 413.79, discountAmount: 0, total: 3000.00, paymentMethod: "Efectivo", paymentStatus: "paid", items: 4, createdAt: "2026-07-22T10:00:00Z" },
    { id: 22, customerId: 15, customerName: "Andrés López Sánchez", subtotal: 1293.10, taxRate: 16, taxAmount: 206.90, discountAmount: 0, total: 1500.00, paymentMethod: "Tarjeta", paymentStatus: "paid", items: 2, createdAt: "2026-07-22T11:00:00Z" },
  ]

  d["get_sale"] = (a: any) => ({
    id: a?.id ?? 1,
    customerId: 1,
    customerName: "Juan Pérez López",
    subtotal: 1080.00,
    taxRate: 16,
    taxAmount: 172.80,
    discountAmount: 0,
    total: 1252.80,
    paymentMethod: "Efectivo",
    paymentStatus: "paid",
    notes: "Venta directa en mostrador",
    createdAt: "2026-07-30T10:30:00Z",
    updatedAt: "2026-07-30T10:30:00Z",
    items: [
      { id: 1, saleId: 1, productId: 1, productName: "Pastillas de Freno Delanteras", sku: "FRN-PFD-001", quantity: 2, unitPrice: 350, discount: 0, total: 700 },
      { id: 2, saleId: 1, productId: 4, productName: "Filtro de Aceite", sku: "FLT-FAC-004", quantity: 2, unitPrice: 85, discount: 0, total: 170 },
      { id: 3, saleId: 1, productId: 5, productName: "Bujía de Encendido", sku: "EN-BUJ-005", quantity: 2, unitPrice: 95, discount: 0, total: 190 },
    ],
  })
  d["get_sale_items"] = (a: any) => [
    { id: 1, saleId: a?.saleId ?? 1, productId: 1, productName: "Pastillas de Freno Delanteras", sku: "FRN-PFD-001", quantity: 2, unitPrice: 350, discount: 0, total: 700 },
    { id: 2, saleId: a?.saleId ?? 1, productId: 4, productName: "Filtro de Aceite", sku: "FLT-FAC-004", quantity: 2, unitPrice: 85, discount: 0, total: 170 },
    { id: 3, saleId: a?.saleId ?? 1, productId: 5, productName: "Bujía de Encendido", sku: "EN-BUJ-005", quantity: 2, unitPrice: 95, discount: 0, total: 190 },
  ]
  d["get_sale_payments"] = (a: any) => [
    { id: 1, saleId: a?.saleId ?? 1, paymentMethod: "Efectivo", amount: 1252.80, reference: "", processedBy: 1, processedAt: "2026-07-30T10:30:00Z" },
  ]
  d["get_daily_closeout"] = {
    date: "2026-07-30",
    totalSales: 22,
    totalRevenue: 28450.60,
    totalTax: 4552.10,
    totalDiscount: 0,
    byPaymentMethod: {
      Efectivo: 9850.00,
      Tarjeta: 10200.00,
      Crédito: 5400.60,
      Transferencia: 3000.00,
    },
    byCashier: [
      { cashierId: 1, cashierName: "Admin", sales: 15, total: 19250.60 },
      { cashierId: 2, cashierName: "Vendedor 1", sales: 7, total: 9200.00 },
    ],
  }
  d["refund_sale"] = (a: any) => ({
    id: a?.saleId,
    customerId: 1,
    customerName: "Juan Pérez López",
    total: -1252.80,
    paymentStatus: "refunded",
    notes: a?.reason ?? "Devolución",
    createdAt: new Date().toISOString(),
  })
  d["create_sale"] = (a: any) => ({ id: Math.floor(Math.random() * 900) + 100, ...a, createdAt: new Date().toISOString() })
  d["search_products_for_pos"] = (a: any) => {
    const products = [
      { id: 1, name: "Pastillas de Freno Delanteras", sku: "FRN-PFD-001", description: "Pastillas de freno delanteras", categoryName: "Pastillas de Freno", brandName: "Brembo", unitPrice: 350, stock: 45, taxRate: 16 },
      { id: 2, name: "Discos de Freno Delanteros", sku: "FRN-DFD-002", description: "Discos de freno delanteros ventilados", categoryName: "Discos de Freno", brandName: "Brembo", unitPrice: 890, stock: 30, taxRate: 16 },
      { id: 3, name: "Amortiguador Trasero", sku: "SUS-AMT-003", description: "Amortiguador trasero gas", categoryName: "Amortiguadores", brandName: "Monroe", unitPrice: 650, stock: 25, taxRate: 16 },
      { id: 4, name: "Filtro de Aceite", sku: "FLT-FAC-004", description: "Filtro de aceite para motor", categoryName: "Filtros", brandName: "Mann-Filter", unitPrice: 85, stock: 120, taxRate: 16 },
      { id: 5, name: "Bujía de Encendido", sku: "EN-BUJ-005", description: "Bujía de encendido de iridio", categoryName: "Bujías", brandName: "NGK", unitPrice: 95, stock: 200, taxRate: 16 },
      { id: 6, name: "Correa de Distribución", sku: "COR-CDI-006", description: "Correa de distribución con kit", categoryName: "Correas", brandName: "Gates", unitPrice: 450, stock: 35, taxRate: 16 },
      { id: 7, name: "Batería Automotriz 12V", sku: "BAT-B12-007", description: "Batería 12V 75Ah", categoryName: "Baterías", brandName: "Varta", unitPrice: 1200, stock: 18, taxRate: 16 },
      { id: 12, name: "Rodamiento de Rueda Trasero", sku: "ROD-RRT-012", description: "Rodamiento de rueda trasero", categoryName: "Rodamientos", brandName: "SKF", unitPrice: 320, stock: 40, taxRate: 16 },
      { id: 17, name: "Aceite de Motor 20W50", sku: "LUB-ACE-017", description: "Aceite de motor 20W50 4L", categoryName: "Lubricantes", brandName: "Bosch", unitPrice: 280, stock: 80, taxRate: 16 },
      { id: 18, name: "Llanta 205/55R16", sku: "LLA-205-018", description: "Llanta 205/55R16 91V", categoryName: "Llantas", brandName: "Continental", unitPrice: 1500, stock: 20, taxRate: 16 },
      { id: 21, name: "Escobilla Limpiaparabrisas Juego", sku: "LIM-ESC-021", description: "Juego de escobillas limpiaparabrisas", categoryName: "Limpiaparabrisas", brandName: "Bosch", unitPrice: 180, stock: 60, taxRate: 16 },
      { id: 23, name: "Sensor de Oxígeno", sku: "SEN-SOX-023", description: "Sensor de oxígeno lambda", categoryName: "Sensores", brandName: "NGK", unitPrice: 450, stock: 11, taxRate: 16 },
      { id: 24, name: "Bomba de Agua", sku: "REF-BAG-024", description: "Bomba de agua para motor", categoryName: "Bombas de Agua", brandName: "Denso", unitPrice: 650, stock: 16, taxRate: 16 },
      { id: 25, name: "Inyector de Combustible", sku: "INY-COM-025", description: "Inyector de combustible", categoryName: "Inyectores", brandName: "Denso", unitPrice: 380, stock: 22, taxRate: 16 },
      { id: 34, name: "Filtro de Aire", sku: "FLT-FAI-034", description: "Filtro de aire para motor", categoryName: "Filtros", brandName: "Mann-Filter", unitPrice: 95, stock: 90, taxRate: 16 },
      { id: 44, name: "Rótula de Suspensión", sku: "SUS-ROT-044", description: "Rótula de suspensión inferior", categoryName: "Suspensión", brandName: "Lemforder", unitPrice: 210, stock: 30, taxRate: 16 },
      { id: 45, name: "Terminal de Dirección", sku: "DIR-TER-045", description: "Terminal de dirección exterior", categoryName: "Dirección", brandName: "TRW", unitPrice: 190, stock: 35, taxRate: 16 },
      { id: 47, name: "Aceite de Motor 10W40", sku: "LUB-104-047", description: "Aceite de motor 10W40 4L", categoryName: "Lubricantes", brandName: "ACDelco", unitPrice: 260, stock: 75, taxRate: 16 },
      { id: 66, name: "Líquido de Frenos DOT4", sku: "FRN-LFD-066", description: "Líquido de frenos DOT4 500ml", categoryName: "Pastillas de Freno", brandName: "Bosch", unitPrice: 65, stock: 70, taxRate: 16 },
      { id: 92, name: "Aceite de Motor 5W30", sku: "LUB-053-092", description: "Aceite de motor 5W30 4L sintético", categoryName: "Lubricantes", brandName: "ACDelco", unitPrice: 320, stock: 60, taxRate: 16 },
      { id: 96, name: "Tapón de Aceite", sku: "LUB-TAC-096", description: "Tapón de aceite", categoryName: "Lubricantes", brandName: "Mahle", unitPrice: 25, stock: 60, taxRate: 16 },
    ]
    if (a?.search) {
      const s = a.search.toLowerCase()
      return products.filter((p) => p.name.toLowerCase().includes(s) || p.sku.toLowerCase().includes(s) || p.description.toLowerCase().includes(s))
    }
    return products
  }
  d["process_checkout"] = (a: any) => ({
    success: true,
    saleId: Math.floor(Math.random() * 900) + 100,
    sale: {
      id: Math.floor(Math.random() * 900) + 100,
      customerId: a?.input?.customerId ?? null,
      customerName: a?.input?.customerName ?? "Cliente General",
      subtotal: a?.input?.subtotal ?? 0,
      taxRate: 16,
      taxAmount: (a?.input?.subtotal ?? 0) * 0.16,
      discountAmount: a?.input?.discountAmount ?? 0,
      total: a?.input?.total ?? 0,
      paymentMethod: a?.input?.paymentMethod ?? "Efectivo",
      paymentStatus: "paid",
      items: (a?.input?.items ?? []).length,
      createdAt: new Date().toISOString(),
    },
    receipt: {
      id: Math.floor(Math.random() * 900) + 100,
      saleId: Math.floor(Math.random() * 900) + 100,
      receiptNumber: "R-" + Date.now(),
      printedAt: null,
    },
  })
  d["get_sales_summary"] = {
    todaySales: 3850.00,
    weekSales: 25400.00,
    monthSales: 98500.00,
    yearSales: 685000.00,
    averageTicket: 445.00,
    totalTransactions: 1280,
    totalRefunds: 15,
    refundAmount: 8500.00,
    topPaymentMethod: "Tarjeta",
    byPaymentMethod: [
      { method: "Efectivo", count: 480, total: 215000.00 },
      { method: "Tarjeta", count: 520, total: 285000.00 },
      { method: "Transferencia", count: 180, total: 125000.00 },
      { method: "Crédito", count: 100, total: 60000.00 },
    ],
  }
  d["get_sales_chart_data"] = (a: any) => ({
    labels: ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"],
    datasets: [
      {
        label: "Ventas 2026",
        data: [45000, 52000, 48000, 58000, 55000, 62000, 68500, 0, 0, 0, 0, 0],
      },
    ],
  })
  d["search_sales"] = (a: any) => {
    const all = d["get_sales"]() as any[]
    if (a?.query) {
      const q = a.query.toLowerCase()
      return all.filter((s) => s.customerName?.toLowerCase().includes(q) || String(s.id).includes(q))
    }
    return all
  }

  // --- Quotes ---
  d["get_quotes"] = () => [
    { id: 1, customerId: 1, customerName: "Juan Pérez López", subtotal: 1530.00, taxRate: 16, taxAmount: 244.80, total: 1774.80, status: "approved", validUntil: "2026-08-15", createdAt: "2026-07-25T10:00:00Z" },
    { id: 2, customerId: 3, customerName: "Luis Martínez Rodríguez", subtotal: 3200.00, taxRate: 16, taxAmount: 512.00, total: 3712.00, status: "pending", validUntil: "2026-08-20", createdAt: "2026-07-26T10:00:00Z" },
    { id: 3, customerId: 5, customerName: "Carlos Mendoza Flores", subtotal: 850.00, taxRate: 16, taxAmount: 136.00, total: 986.00, status: "draft", validUntil: "2026-08-10", createdAt: "2026-07-27T10:00:00Z" },
    { id: 4, customerId: 7, customerName: "Roberto Díaz Castillo", subtotal: 2100.00, taxRate: 16, taxAmount: 336.00, total: 2436.00, status: "approved", validUntil: "2026-08-25", createdAt: "2026-07-28T10:00:00Z" },
    { id: 5, customerId: 11, customerName: "Miguel Ángel Torres", subtotal: 4500.00, taxRate: 16, taxAmount: 720.00, total: 5220.00, status: "converted", validUntil: "2026-08-30", createdAt: "2026-07-20T10:00:00Z" },
    { id: 6, customerId: 14, customerName: "Sofía Martínez García", subtotal: 1200.00, taxRate: 16, taxAmount: 192.00, total: 1392.00, status: "rejected", validUntil: "2026-08-12", createdAt: "2026-07-22T10:00:00Z" },
    { id: 7, customerId: 17, customerName: "Héctor Rivas Mendoza", subtotal: 2800.00, taxRate: 16, taxAmount: 448.00, total: 3248.00, status: "pending", validUntil: "2026-09-01", createdAt: "2026-07-29T10:00:00Z" },
    { id: 8, customerId: 22, customerName: "Eduardo Pacheco Lara", subtotal: 650.00, taxRate: 16, taxAmount: 104.00, total: 754.00, status: "draft", validUntil: "2026-08-18", createdAt: "2026-07-24T10:00:00Z" },
    { id: 9, customerId: 24, customerName: "Jorge Lara Cruz", subtotal: 1900.00, taxRate: 16, taxAmount: 304.00, total: 2204.00, status: "approved", validUntil: "2026-08-22", createdAt: "2026-07-23T10:00:00Z" },
    { id: 10, customerId: 29, customerName: "Rosa María Flores", subtotal: 3500.00, taxRate: 16, taxAmount: 560.00, total: 4060.00, status: "pending", validUntil: "2026-09-05", createdAt: "2026-07-30T10:00:00Z" },
  ]
  d["get_quote"] = (a: any) => ({
    id: a?.id ?? 1,
    customerId: 1,
    customerName: "Juan Pérez López",
    subtotal: 1530.00,
    taxRate: 16,
    taxAmount: 244.80,
    total: 1774.80,
    status: "approved",
    validUntil: "2026-08-15",
    notes: "Cotización para servicio completo",
    createdAt: "2026-07-25T10:00:00Z",
    updatedAt: "2026-07-26T10:00:00Z",
    items: [
      { id: 1, quoteId: 1, productId: 1, productName: "Pastillas de Freno Delanteras", sku: "FRN-PFD-001", quantity: 2, unitPrice: 350, total: 700 },
      { id: 2, quoteId: 1, productId: 6, productName: "Correa de Distribución", sku: "COR-CDI-006", quantity: 1, unitPrice: 450, total: 450 },
      { id: 3, quoteId: 1, productId: 4, productName: "Filtro de Aceite", sku: "FLT-FAC-004", quantity: 2, unitPrice: 85, total: 170 },
    ],
  })
  d["get_quote_items"] = (a: any) => [
    { id: 1, quoteId: a?.quoteId ?? 1, productId: 1, productName: "Pastillas de Freno Delanteras", sku: "FRN-PFD-001", quantity: 2, unitPrice: 350, total: 700 },
    { id: 2, quoteId: a?.quoteId ?? 1, productId: 6, productName: "Correa de Distribución", sku: "COR-CDI-006", quantity: 1, unitPrice: 450, total: 450 },
    { id: 3, quoteId: a?.quoteId ?? 1, productId: 4, productName: "Filtro de Aceite", sku: "FLT-FAC-004", quantity: 2, unitPrice: 85, total: 170 },
  ]
  d["create_quote"] = (a: any) => ({ id: Math.floor(Math.random() * 900) + 100, ...a?.input, createdAt: new Date().toISOString(), status: "draft", validUntil: new Date(Date.now() + 30 * 86400000).toISOString() })
  d["update_quote"] = (a: any) => a
  d["delete_quote"] = undefined
  d["update_quote_status"] = (a: any) => ({ id: a?.id, status: a?.status, updatedAt: new Date().toISOString() })
  d["convert_quote_to_sale"] = (a: any) => ({
    success: true,
    saleId: Math.floor(Math.random() * 900) + 100,
    sale: {
      id: Math.floor(Math.random() * 900) + 100,
      quoteId: a?.quoteId,
      customerId: 1,
      customerName: "Juan Pérez López",
      subtotal: 1530.00,
      taxRate: 16,
      taxAmount: 244.80,
      total: 1774.80,
      paymentMethod: "Efectivo",
      paymentStatus: "paid",
      createdAt: new Date().toISOString(),
    },
  })

  // --- Cash Register ---
  d["get_cash_register_status"] = () => ({
    id: 1,
    userId: 1,
    userName: "Administrador",
    openingBalance: 500.00,
    currentBalance: 8520.00,
    status: "open",
    openedAt: "2026-07-30T08:00:00Z",
  })
  d["open_cash_register"] = (a: any) => ({
    id: Math.floor(Math.random() * 900) + 100,
    userId: a?.userId,
    userName: "Administrador",
    openingBalance: a?.openingBalance,
    currentBalance: a?.openingBalance,
    notes: a?.notes,
    status: "open",
    openedAt: new Date().toISOString(),
  })
  d["close_cash_register"] = (a: any) => ({
    id: a?.id,
    userId: 1,
    closingBalance: a?.closingBalance,
    notes: a?.notes,
    status: "closed",
    closedAt: new Date().toISOString(),
  })
  d["get_cash_register_sessions"] = () => [
    { id: 1, userId: 1, userName: "Administrador", openingBalance: 500, closingBalance: 8520, expectedBalance: 8500, difference: 20, status: "open", openedAt: "2026-07-30T08:00:00Z" },
    { id: 2, userId: 1, userName: "Administrador", openingBalance: 500, closingBalance: 7650, expectedBalance: 7600, difference: 50, status: "closed", openedAt: "2026-07-29T08:00:00Z", closedAt: "2026-07-29T18:00:00Z" },
    { id: 3, userId: 2, userName: "Vendedor 1", openingBalance: 300, closingBalance: 4320, expectedBalance: 4300, difference: 20, status: "closed", openedAt: "2026-07-29T08:00:00Z", closedAt: "2026-07-29T18:00:00Z" },
    { id: 4, userId: 1, userName: "Administrador", openingBalance: 500, closingBalance: 8200, expectedBalance: 8200, difference: 0, status: "closed", openedAt: "2026-07-28T08:00:00Z", closedAt: "2026-07-28T18:00:00Z" },
    { id: 5, userId: 2, userName: "Vendedor 1", openingBalance: 300, closingBalance: 5100, expectedBalance: 5100, difference: 0, status: "closed", openedAt: "2026-07-28T08:00:00Z", closedAt: "2026-07-28T18:00:00Z" },
  ]
  d["close_daily_shift"] = (a: any) => ({
    id: Math.floor(Math.random() * 900) + 100,
    closedBy: a?.closedBy,
    notes: a?.notes,
    totalSales: 3850.00,
    totalTransactions: 8,
    byPaymentMethod: { Efectivo: 1500.00, Tarjeta: 1850.00, Crédito: 500.00 },
    closedAt: new Date().toISOString(),
  })
  d["get_daily_closings"] = () => [
    { id: 1, closedBy: 1, closedByName: "Administrador", totalSales: 8500.00, totalTransactions: 15, notes: "Cierre normal", closedAt: "2026-07-29T18:00:00Z" },
    { id: 2, closedBy: 1, closedByName: "Administrador", totalSales: 7200.00, totalTransactions: 12, notes: "Cierre normal", closedAt: "2026-07-28T18:00:00Z" },
    { id: 3, closedBy: 1, closedByName: "Administrador", totalSales: 9500.00, totalTransactions: 18, notes: "Día alto", closedAt: "2026-07-27T18:00:00Z" },
    { id: 4, closedBy: 1, closedByName: "Administrador", totalSales: 6200.00, totalTransactions: 10, notes: "Cierre normal", closedAt: "2026-07-26T18:00:00Z" },
    { id: 5, closedBy: 1, closedByName: "Administrador", totalSales: 7800.00, totalTransactions: 14, notes: "Cierre normal", closedAt: "2026-07-25T18:00:00Z" },
  ]

  // --- Receipts ---
  d["get_receipts_for_sale"] = (a: any) => [
    { id: 1, saleId: a?.saleId ?? 1, receiptNumber: "R-2026-07-30-001", receiptType: "sale", printed: false, createdAt: "2026-07-30T10:30:00Z" },
  ]
  d["get_receipt"] = (a: any) => ({
    id: a?.id ?? 1,
    saleId: 1,
    receiptNumber: "R-2026-07-30-001",
    receiptType: "sale",
    printed: false,
    createdAt: "2026-07-30T10:30:00Z",
    items: [
      { productName: "Pastillas de Freno Delanteras", quantity: 2, unitPrice: 350, total: 700 },
      { productName: "Filtro de Aceite", quantity: 2, unitPrice: 85, total: 170 },
      { productName: "Bujía de Encendido", quantity: 2, unitPrice: 95, total: 190 },
    ],
    subtotal: 1060.00,
    tax: 169.60,
    total: 1229.60,
  })
  d["mark_receipt_printed"] = (a: any) => ({ id: a?.id, printed: true, printedAt: new Date().toISOString() })

  // --- Purchase Orders ---
  d["get_purchase_orders"] = (a: any) => {
    const all = [
      { id: 1, supplierId: 1, supplierName: "Autopartes del Centro S.A. de C.V.", warehouseId: 1, warehouseName: "Almacén Central", status: "received", total: 8500.00, items: 8, buyer: "Admin", notes: "Compra regular mensual", orderedAt: "2026-07-20T10:00:00Z", expectedAt: "2026-07-25T10:00:00Z", receivedAt: "2026-07-24T10:00:00Z", createdAt: "2026-07-20T10:00:00Z" },
      { id: 2, supplierId: 3, supplierName: "Importadora de Autopartes del Pacífico", warehouseId: 1, status: "pending", total: 12400.00, items: 12, buyer: "Admin", notes: "Pedido de temporada", orderedAt: "2026-07-28T10:00:00Z", expectedAt: "2026-08-05T10:00:00Z", createdAt: "2026-07-28T10:00:00Z" },
      { id: 3, supplierId: 5, supplierName: "Proveedora Automotriz del Bajío", warehouseId: 2, status: "partial", total: 6800.00, items: 5, buyer: "Admin", orderedAt: "2026-07-25T10:00:00Z", expectedAt: "2026-07-30T10:00:00Z", partiallyReceivedAt: "2026-07-29T10:00:00Z", createdAt: "2026-07-25T10:00:00Z" },
      { id: 4, supplierId: 2, supplierName: "Refaccionaría del Norte S.A.", warehouseId: 2, status: "sent", total: 5200.00, items: 6, buyer: "Admin", orderedAt: "2026-07-29T10:00:00Z", expectedAt: "2026-08-02T10:00:00Z", createdAt: "2026-07-29T10:00:00Z" },
      { id: 5, supplierId: 7, supplierName: "Eléctricos Automotrices del Golfo", warehouseId: 1, status: "draft", total: 3200.00, items: 4, buyer: "Admin", createdAt: "2026-07-30T10:00:00Z" },
      { id: 6, supplierId: 10, supplierName: "TurboComponentes de México", warehouseId: 2, status: "received", total: 15000.00, items: 3, buyer: "Admin", orderedAt: "2026-07-15T10:00:00Z", expectedAt: "2026-07-20T10:00:00Z", receivedAt: "2026-07-19T10:00:00Z", createdAt: "2026-07-15T10:00:00Z" },
      { id: 7, supplierId: 4, supplierName: "Distribuidora de Frenos y Embragues", warehouseId: 1, status: "cancelled", total: 4500.00, items: 5, buyer: "Admin", notes: "Cancelado por falta de stock del proveedor", orderedAt: "2026-07-10T10:00:00Z", cancelledAt: "2026-07-12T10:00:00Z", createdAt: "2026-07-10T10:00:00Z" },
      { id: 8, supplierId: 6, supplierName: "Suspensiones y Dirección S.A.", warehouseId: 1, status: "pending", total: 7200.00, items: 7, buyer: "Admin", orderedAt: "2026-07-30T10:00:00Z", expectedAt: "2026-08-06T10:00:00Z", createdAt: "2026-07-30T10:00:00Z" },
      { id: 9, supplierId: 9, supplierName: "Correas y Filtros Industriales", warehouseId: 1, status: "partial", total: 3800.00, items: 4, buyer: "Admin", orderedAt: "2026-07-22T10:00:00Z", expectedAt: "2026-07-28T10:00:00Z", partiallyReceivedAt: "2026-07-27T10:00:00Z", createdAt: "2026-07-22T10:00:00Z" },
      { id: 10, supplierId: 8, supplierName: "Lubricantes y Refacciones del Sureste", warehouseId: 3, status: "received", total: 2800.00, items: 3, buyer: "Admin", orderedAt: "2026-07-18T10:00:00Z", expectedAt: "2026-07-23T10:00:00Z", receivedAt: "2026-07-22T10:00:00Z", createdAt: "2026-07-18T10:00:00Z" },
    ]
    if (a?.status) return all.filter((po) => po.status === a.status)
    if (a?.supplierId) return all.filter((po) => po.supplierId === a.supplierId)
    return all
  }
  d["get_purchase_order"] = (a: any) => ({
    id: a?.id ?? 1,
    supplierId: 1,
    supplierName: "Autopartes del Centro S.A. de C.V.",
    warehouseId: 1,
    warehouseName: "Almacén Central",
    status: "received",
    total: 8500.00,
    items: 8,
    buyer: "Admin",
    notes: "Compra regular mensual",
    orderedAt: "2026-07-20T10:00:00Z",
    expectedAt: "2026-07-25T10:00:00Z",
    receivedAt: "2026-07-24T10:00:00Z",
    createdAt: "2026-07-20T10:00:00Z",
    updatedAt: "2026-07-24T10:00:00Z",
  })
  d["create_purchase_order"] = (a: any) => ({ id: Math.floor(Math.random() * 900) + 100, ...a?.input, buyer: "Admin", status: "draft", createdAt: new Date().toISOString() })
  d["update_purchase_order"] = (a: any) => a
  d["update_purchase_order_status"] = (a: any) => ({ id: a?.id, status: a?.status, updatedAt: new Date().toISOString() })
  d["delete_purchase_order"] = undefined
  d["get_purchase_order_items"] = (a: any) => [
    { id: 1, purchaseOrderId: a?.purchaseOrderId ?? 1, productId: 1, productName: "Pastillas de Freno Delanteras", sku: "FRN-PFD-001", quantityOrdered: 10, quantityReceived: 10, unitCost: 210, total: 2100 },
    { id: 2, purchaseOrderId: a?.purchaseOrderId ?? 1, productId: 4, productName: "Filtro de Aceite", sku: "FLT-FAC-004", quantityOrdered: 30, quantityReceived: 30, unitCost: 51, total: 1530 },
    { id: 3, purchaseOrderId: a?.purchaseOrderId ?? 1, productId: 5, productName: "Bujía de Encendido", sku: "EN-BUJ-005", quantityOrdered: 50, quantityReceived: 50, unitCost: 57, total: 2850 },
    { id: 4, purchaseOrderId: a?.purchaseOrderId ?? 1, productId: 7, productName: "Batería Automotriz 12V", sku: "BAT-B12-007", quantityOrdered: 5, quantityReceived: 5, unitCost: 720, total: 3600 },
    { id: 5, purchaseOrderId: a?.purchaseOrderId ?? 1, productId: 21, productName: "Escobilla Limpiaparabrisas Juego", sku: "LIM-ESC-021", quantityOrdered: 20, quantityReceived: 20, unitCost: 108, total: 2160 },
    { id: 6, purchaseOrderId: a?.purchaseOrderId ?? 1, productId: 34, productName: "Filtro de Aire", sku: "FLT-FAI-034", quantityOrdered: 25, quantityReceived: 25, unitCost: 57, total: 1425 },
    { id: 7, purchaseOrderId: a?.purchaseOrderId ?? 1, productId: 17, productName: "Aceite de Motor 20W50", sku: "LUB-ACE-017", quantityOrdered: 20, quantityReceived: 20, unitCost: 168, total: 3360 },
    { id: 8, purchaseOrderId: a?.purchaseOrderId ?? 1, productId: 2, productName: "Discos de Freno Delanteros", sku: "FRN-DFD-002", quantityOrdered: 5, quantityReceived: 5, unitCost: 534, total: 2670 },
  ]

  // --- Purchase Requests ---
  d["get_purchase_requests"] = (a: any) => [
    { id: 1, requestedBy: 1, requestedByName: "Administrador", warehouseId: 1, warehouseName: "Almacén Central", status: "approved", notes: "Reabastecimiento urgente", items: 3, total: 4500.00, createdAt: "2026-07-25T10:00:00Z", approvedAt: "2026-07-26T10:00:00Z" },
    { id: 2, requestedBy: 2, requestedByName: "Vendedor 1", warehouseId: 1, status: "pending", notes: "Productos de temporada", items: 2, total: 2800.00, createdAt: "2026-07-28T10:00:00Z" },
    { id: 3, requestedBy: 1, requestedByName: "Administrador", warehouseId: 2, status: "draft", items: 1, total: 1200.00, createdAt: "2026-07-30T10:00:00Z" },
    { id: 4, requestedBy: 1, requestedByName: "Administrador", warehouseId: 3, status: "rejected", notes: "Fuera de presupuesto", items: 5, total: 8500.00, createdAt: "2026-07-20T10:00:00Z", rejectedAt: "2026-07-22T10:00:00Z" },
    { id: 5, requestedBy: 2, requestedByName: "Vendedor 1", warehouseId: 1, status: "approved", notes: "Reposición de stock", items: 4, total: 3200.00, createdAt: "2026-07-22T10:00:00Z", approvedAt: "2026-07-23T10:00:00Z" },
  ]
  d["get_purchase_request"] = (a: any) => ({
    id: a?.id ?? 1,
    requestedBy: 1,
    requestedByName: "Administrador",
    warehouseId: 1,
    warehouseName: "Almacén Central",
    status: "approved",
    notes: "Reabastecimiento urgente",
    createdAt: "2026-07-25T10:00:00Z",
    approvedAt: "2026-07-26T10:00:00Z",
  })
  d["create_purchase_request"] = (a: any) => ({ id: Math.floor(Math.random() * 900) + 100, ...a?.input, status: "draft", createdAt: new Date().toISOString() })
  d["update_purchase_request_status"] = (a: any) => ({ id: a?.id, status: a?.status, updatedAt: new Date().toISOString() })

  // --- Purchase Receipts ---
  d["get_purchase_receipts"] = (a: any) => [
    { id: 1, purchaseOrderId: 1, poNumber: "PO-001", supplierName: "Autopartes del Centro S.A. de C.V.", warehouseName: "Almacén Central", items: 8, total: 8500.00, receivedBy: "Admin", notes: "Todo en buen estado", receivedAt: "2026-07-24T10:00:00Z" },
    { id: 2, purchaseOrderId: 6, poNumber: "PO-006", supplierName: "TurboComponentes de México", warehouseName: "Almacén Norte", items: 3, total: 15000.00, receivedBy: "Admin", notes: "Productos especializados", receivedAt: "2026-07-19T10:00:00Z" },
    { id: 3, purchaseOrderId: 10, poNumber: "PO-010", supplierName: "Lubricantes y Refacciones del Sureste", warehouseName: "Almacén Sur", items: 3, total: 2800.00, receivedBy: "Admin", receivedAt: "2026-07-22T10:00:00Z" },
    { id: 4, purchaseOrderId: 3, poNumber: "PO-003", supplierName: "Proveedora Automotriz del Bajío", warehouseName: "Almacén Norte", items: 3, total: 4200.00, receivedBy: "Admin", notes: "Recepción parcial", receivedAt: "2026-07-29T10:00:00Z" },
    { id: 5, purchaseOrderId: 9, poNumber: "PO-009", supplierName: "Correas y Filtros Industriales", warehouseName: "Almacén Central", items: 2, total: 2100.00, receivedBy: "Admin", notes: "Recepción parcial", receivedAt: "2026-07-27T10:00:00Z" },
  ]
  d["get_purchase_receipt"] = (a: any) => ({
    id: a?.id ?? 1,
    purchaseOrderId: 1,
    poNumber: "PO-001",
    supplierId: 1,
    supplierName: "Autopartes del Centro S.A. de C.V.",
    warehouseId: 1,
    warehouseName: "Almacén Central",
    items: [
      { productId: 1, productName: "Pastillas de Freno Delanteras", sku: "FRN-PFD-001", quantityOrdered: 10, quantityReceived: 10, unitCost: 210 },
      { productId: 4, productName: "Filtro de Aceite", sku: "FLT-FAC-004", quantityOrdered: 30, quantityReceived: 30, unitCost: 51 },
    ],
    total: 8500.00,
    receivedBy: "Admin",
    notes: "Todo en buen estado",
    receivedAt: "2026-07-24T10:00:00Z",
  })
  d["receive_purchase_order"] = (a: any) => ({
    id: Math.floor(Math.random() * 900) + 100,
    purchaseOrderId: a?.poId,
    warehouseId: a?.warehouseId,
    items: a?.items,
    receivedBy: "Admin",
    notes: a?.notes,
    receivedAt: new Date().toISOString(),
  })

  // --- Purchase Returns ---
  d["get_purchase_returns"] = (a: any) => [
    { id: 1, supplierId: 1, supplierName: "Autopartes del Centro S.A. de C.V.", purchaseOrderId: 1, poNumber: "PO-001", total: 510.00, reason: "Producto defectuoso", status: "completed", createdBy: 1, createdAt: "2026-07-25T10:00:00Z" },
    { id: 2, supplierId: 4, supplierName: "Distribuidora de Frenos y Embragues", purchaseOrderId: 7, poNumber: "PO-007", total: 1080.00, reason: "Producto incorrecto", status: "pending", createdBy: 1, createdAt: "2026-07-12T10:00:00Z" },
    { id: 3, supplierId: 6, supplierName: "Suspensiones y Dirección S.A.", purchaseOrderId: 3, poNumber: "PO-003", total: 360.00, reason: "Dañado en transporte", status: "completed", createdBy: 1, createdAt: "2026-07-20T10:00:00Z" },
  ]
  d["get_purchase_return"] = (a: any) => ({
    id: a?.id ?? 1,
    supplierId: 1,
    supplierName: "Autopartes del Centro S.A. de C.V.",
    total: 510.00,
    reason: "Producto defectuoso",
    status: "completed",
    createdAt: "2026-07-25T10:00:00Z",
  })
  d["create_purchase_return"] = (a: any) => ({ id: Math.floor(Math.random() * 900) + 100, ...a?.input, status: "pending", createdAt: new Date().toISOString() })

  // --- Supplier Products ---
  d["get_supplier_products"] = (a: any) => [
    { id: 1, supplierId: 1, supplierName: "Autopartes del Centro S.A. de C.V.", productId: 1, productName: "Pastillas de Freno Delanteras", sku: "FRN-PFD-001", supplierSku: "APC-BREMBO-001", unitCost: 210, moq: 5, leadTimeDays: 3, isPreferred: true },
    { id: 2, supplierId: 1, supplierName: "Autopartes del Centro S.A. de C.V.", productId: 4, productName: "Filtro de Aceite", sku: "FLT-FAC-004", supplierSku: "APC-MANN-004", unitCost: 51, moq: 10, leadTimeDays: 2, isPreferred: true },
    { id: 3, supplierId: 1, supplierName: "Autopartes del Centro S.A. de C.V.", productId: 5, productName: "Bujía de Encendido", sku: "EN-BUJ-005", supplierSku: "APC-NGK-005", unitCost: 57, moq: 20, leadTimeDays: 4, isPreferred: false },
    { id: 4, supplierId: 3, supplierName: "Importadora de Autopartes del Pacífico", productId: 7, productName: "Batería Automotriz 12V", sku: "BAT-B12-007", supplierSku: "IAP-VARTA-007", unitCost: 720, moq: 2, leadTimeDays: 5, isPreferred: true },
    { id: 5, supplierId: 3, supplierName: "Importadora de Autopartes del Pacífico", productId: 8, productName: "Kit de Embrague Completo", sku: "EMB-KIT-008", supplierSku: "IAP-SACHS-008", unitCost: 1500, moq: 1, leadTimeDays: 7, isPreferred: true },
    { id: 6, supplierId: 5, supplierName: "Proveedora Automotriz del Bajío", productId: 3, productName: "Amortiguador Trasero", sku: "SUS-AMT-003", supplierSku: "PAB-MONROE-003", unitCost: 390, moq: 3, leadTimeDays: 4, isPreferred: true },
    { id: 7, supplierId: 10, supplierName: "TurboComponentes de México", productId: 27, productName: "Turbo Cargador Completo", sku: "TUR-COM-027", supplierSku: "TCM-BOSCH-027", unitCost: 5100, moq: 1, leadTimeDays: 10, isPreferred: true },
    { id: 8, supplierId: 10, supplierName: "TurboComponentes de México", productId: 76, productName: "Actuador de Turbo", sku: "TUR-ACT-076", supplierSku: "TCM-ACT-076", unitCost: 720, moq: 1, leadTimeDays: 8, isPreferred: false },
    { id: 9, supplierId: 2, supplierName: "Refaccionaría del Norte S.A.", productId: 9, productName: "Radiador de Aluminio", sku: "REF-RAD-009", supplierSku: "RNS-VALEO-009", unitCost: 1080, moq: 2, leadTimeDays: 5, isPreferred: true },
    { id: 10, supplierId: 2, supplierName: "Refaccionaría del Norte S.A.", productId: 10, productName: "Alternador 120A", sku: "ELE-ALT-010", supplierSku: "RNS-BOSCH-010", unitCost: 1320, moq: 1, leadTimeDays: 6, isPreferred: true },
  ]
  d["create_supplier_product"] = (a: any) => ({ id: Math.floor(Math.random() * 900) + 100, ...a?.input })
  d["update_supplier_product"] = (a: any) => a
  d["delete_supplier_product"] = undefined

  // --- Cost History ---
  d["get_cost_history"] = (a: any) => [
    { id: 1, productId: a?.productId ?? 1, productName: "Pastillas de Freno Delanteras", supplierId: 1, supplierName: "Autopartes del Centro S.A. de C.V.", oldCost: 220, newCost: 210, changedAt: "2026-07-01T10:00:00Z", changedBy: 1 },
    { id: 2, productId: a?.productId ?? 1, productName: "Pastillas de Freno Delanteras", supplierId: 1, supplierName: "Autopartes del Centro S.A. de C.V.", oldCost: 230, newCost: 220, changedAt: "2026-04-15T10:00:00Z", changedBy: 1 },
    { id: 3, productId: a?.productId ?? 4, productName: "Filtro de Aceite", supplierId: 1, supplierName: "Autopartes del Centro S.A. de C.V.", oldCost: 55, newCost: 51, changedAt: "2026-06-15T10:00:00Z", changedBy: 1 },
    { id: 4, productId: a?.productId ?? 7, productName: "Batería Automotriz 12V", supplierId: 3, supplierName: "Importadora de Autopartes del Pacífico", oldCost: 750, newCost: 720, changedAt: "2026-05-20T10:00:00Z", changedBy: 1 },
    { id: 5, productId: a?.productId ?? 3, productName: "Amortiguador Trasero", supplierId: 5, supplierName: "Proveedora Automotriz del Bajío", oldCost: 400, newCost: 390, changedAt: "2026-07-10T10:00:00Z", changedBy: 1 },
  ]
  d["get_purchase_cost_history"] = (a: any) => d["get_cost_history"](a)

  // --- Purchasing Dashboard ---
  d["get_purchase_dashboard"] = {
    totalPOs: 10,
    pendingPOs: 3,
    draftPOs: 1,
    totalSpent: 70500.00,
    monthSpent: 28500.00,
    averageLeadTime: 4.5,
    topSuppliers: [
      { id: 1, name: "Autopartes del Centro S.A. de C.V.", total: 18000.00, orders: 3 },
      { id: 3, name: "Importadora de Autopartes del Pacífico", total: 12400.00, orders: 1 },
      { id: 10, name: "TurboComponentes de México", total: 15000.00, orders: 1 },
    ],
    poByStatus: [
      { status: "draft", count: 1 },
      { status: "pending", count: 2 },
      { status: "sent", count: 1 },
      { status: "partial", count: 2 },
      { status: "received", count: 3 },
      { status: "cancelled", count: 1 },
    ],
  }
  d["get_reorder_suggestions"] = () => [
    { id: 10, productId: 10, productName: "Alternador 120A", sku: "ELE-ALT-010", currentStock: 5, minStock: 2, maxStock: 12, suggestedOrder: 10, supplierName: "Refaccionaría del Norte S.A.", leadTimeDays: 6, unitCost: 1320 },
    { id: 27, productId: 27, productName: "Turbo Cargador Completo", sku: "TUR-COM-027", currentStock: 2, minStock: 1, maxStock: 5, suggestedOrder: 3, supplierName: "TurboComponentes de México", leadTimeDays: 10, unitCost: 5100 },
    { id: 64, productId: 64, productName: "Culata de Cilindro", sku: "MOT-CUL-064", currentStock: 2, minStock: 1, maxStock: 5, suggestedOrder: 3, supplierName: "Proveedora Automotriz del Bajío", leadTimeDays: 7, unitCost: 2700 },
    { id: 9, productId: 9, productName: "Radiador de Aluminio", sku: "REF-RAD-009", currentStock: 8, minStock: 3, maxStock: 15, suggestedOrder: 10, supplierName: "Refaccionaría del Norte S.A.", leadTimeDays: 5, unitCost: 1080 },
    { id: 15, productId: 15, productName: "Bomba de Dirección Hidráulica", sku: "DIR-BDH-015", currentStock: 6, minStock: 2, maxStock: 15, suggestedOrder: 10, supplierName: "Suspensiones y Dirección S.A.", leadTimeDays: 4, unitCost: 720 },
  ]
  d["get_supplier_performance"] = (a: any) => [
    { id: 1, supplierId: a?.supplierId ?? 1, supplierName: "Autopartes del Centro S.A. de C.V.", onTimeRate: 95, qualityRate: 98, averageLeadTime: 3, totalOrders: 8, totalSpent: 45000 },
    { id: 2, supplierId: a?.supplierId ?? 2, supplierName: "Refaccionaría del Norte S.A.", onTimeRate: 88, qualityRate: 92, averageLeadTime: 4.5, totalOrders: 5, totalSpent: 28000 },
    { id: 3, supplierId: a?.supplierId ?? 3, supplierName: "Importadora de Autopartes del Pacífico", onTimeRate: 90, qualityRate: 95, averageLeadTime: 6, totalOrders: 4, totalSpent: 35000 },
  ]

  // --- Executive Dashboard ---
  d["get_executive_dashboard"] = {
    revenue: { today: 3850, week: 25400, month: 98500, year: 685000 },
    sales: { today: 8, week: 45, month: 180, year: 1280 },
    expenses: { month: 45000, year: 320000 },
    profit: { month: 53500, year: 365000 },
    margin: 0.45,
    topProducts: [
      { id: 1, name: "Pastillas de Freno Delanteras", sku: "FRN-PFD-001", quantity: 22, revenue: 7700 },
      { id: 4, name: "Filtro de Aceite", sku: "FLT-FAC-004", quantity: 45, revenue: 3825 },
      { id: 5, name: "Bujía de Encendido", sku: "EN-BUJ-005", quantity: 38, revenue: 3610 },
    ],
    salesByDay: [
      { date: "2026-07-24", total: 7200 },
      { date: "2026-07-25", total: 8500 },
      { date: "2026-07-26", total: 6200 },
      { date: "2026-07-27", total: 9500 },
      { date: "2026-07-28", total: 7800 },
      { date: "2026-07-29", total: 8200 },
      { date: "2026-07-30", total: 3850 },
    ],
    inventoryValue: 45280,
    totalProducts: 144,
    lowStockItems: 12,
    pendingOrders: 5,
  }
  d["get_dashboard_widgets"] = {
    widgets: [
      { id: 1, type: "sales_today", title: "Ventas Hoy", visible: true, order: 1 },
      { id: 2, type: "sales_chart", title: "Gráfico de Ventas", visible: true, order: 2 },
      { id: 3, type: "top_products", title: "Productos Más Vendidos", visible: true, order: 3 },
      { id: 4, type: "low_stock", title: "Stock Bajo", visible: true, order: 4 },
      { id: 5, type: "recent_sales", title: "Ventas Recientes", visible: true, order: 5 },
      { id: 6, type: "pending_orders", title: "Órdenes Pendientes", visible: false, order: 6 },
      { id: 7, type: "inventory_value", title: "Valor del Inventario", visible: true, order: 7 },
    ],
  }
  d["get_chart_data"] = {
    salesDaily: [1200, 1800, 900, 2100, 1500, 2500, 1800, 3200, 1400, 2800, 1600, 2000, 1100, 1900, 2300, 1700, 3000, 1200, 2100, 1500, 1800, 2500, 1400, 2200, 1800, 1600, 2800, 1300, 1900, 3850],
    salesMonthly: [45000, 52000, 48000, 58000, 55000, 62000, 68500],
    profitMonthly: [22500, 27000, 24000, 31000, 28000, 33000, 37000],
    expensesMonthly: [22500, 25000, 24000, 27000, 27000, 29000, 31500],
  }

  // --- Sales Reports ---
  d["get_sales_report_daily"] = (a: any) => [
    { date: "2026-07-30", transactions: 8, subtotal: 3320, tax: 531.20, discount: 0, total: 3851.20, cash: 1500, card: 1850, credit: 501.20, transfer: 0 },
    { date: "2026-07-29", transactions: 12, subtotal: 7320, tax: 1171.20, discount: 0, total: 8491.20, cash: 3200, card: 4000, credit: 1291.20, transfer: 0 },
  ]
  d["get_sales_report_weekly"] = (a: any) => [
    { week: "2026-W30", transactions: 45, subtotal: 21960, tax: 3513.60, discount: 0, total: 25473.60 },
    { week: "2026-W29", transactions: 38, subtotal: 18540, tax: 2966.40, discount: 0, total: 21506.40 },
  ]
  d["get_sales_report_monthly"] = (a: any) => [
    { month: "2026-07", transactions: 180, subtotal: 84910, tax: 13585.60, discount: 1200, total: 97295.60 },
    { month: "2026-06", transactions: 165, subtotal: 78450, tax: 12552, discount: 800, total: 90202 },
  ]
  d["get_sales_report_yearly"] = (a: any) => [
    { year: 2026, transactions: 1280, subtotal: 590000, tax: 94400, discount: 8500, total: 675900 },
  ]
  d["get_sales_by_cashier"] = (a: any) => [
    { cashierId: 1, cashierName: "Administrador", transactions: 120, subtotal: 68000, total: 78880 },
    { cashierId: 2, cashierName: "Vendedor 1", transactions: 60, subtotal: 34500, total: 40020 },
  ]
  d["get_sales_by_payment_method"] = (a: any) => [
    { method: "Efectivo", transactions: 480, subtotal: 185000, total: 214600 },
    { method: "Tarjeta", transactions: 520, subtotal: 245000, total: 284200 },
    { method: "Transferencia", transactions: 180, subtotal: 108000, total: 125280 },
    { method: "Crédito", transactions: 100, subtotal: 52000, total: 60320 },
  ]
  d["get_sales_discount_analysis"] = (a: any) => ({
    totalDiscount: 8500,
    averageDiscount: 42.50,
    transactionsWithDiscount: 200,
    percentageDiscounted: 15.6,
    byRange: [
      { range: "0-10%", count: 80, total: 3200 },
      { range: "10-20%", count: 60, total: 2800 },
      { range: "20-50%", count: 40, total: 1800 },
      { range: ">50%", count: 20, total: 700 },
    ],
  })
  d["get_sales_returns_summary"] = (a: any) => ({
    totalReturns: 15,
    totalRefunded: 8500,
    averageRefund: 566.67,
    topReasons: [
      { reason: "Producto defectuoso", count: 7, total: 4200 },
      { reason: "Producto incorrecto", count: 5, total: 2800 },
      { reason: "Cambio de opinión", count: 3, total: 1500 },
    ],
  })
  d["get_sales_tax_summary"] = (a: any) => ({
    totalTax: 94400,
    byRate: [
      { rate: 16, taxable: 590000, tax: 94400 },
    ],
  })
  d["get_sales_quote_conversion"] = () => 0.65

  // --- Inventory Reports ---
  d["get_inventory_report"] = (a: any) => [
    { id: 1, name: "Pastillas de Freno Delanteras", sku: "FRN-PFD-001", categoryName: "Pastillas de Freno", stock: 45, minStock: 10, unitPrice: 350, costPrice: 210, totalValue: 15750 },
    { id: 4, name: "Filtro de Aceite", sku: "FLT-FAC-004", categoryName: "Filtros", stock: 120, minStock: 30, unitPrice: 85, costPrice: 51, totalValue: 10200 },
  ]
  d["get_inventory_valuation"] = () => [
    { categoryId: 1, categoryName: "Pastillas de Freno", totalProducts: 8, totalStock: 196, totalValue: 48500 },
    { categoryId: 4, categoryName: "Filtros", totalProducts: 6, totalStock: 388, totalValue: 28450 },
    { categoryId: 5, categoryName: "Bujías", totalProducts: 6, totalStock: 437, totalValue: 28650 },
  ]
  d["get_inventory_low_stock"] = () => [
    { id: 27, name: "Turbo Cargador Completo", sku: "TUR-COM-027", stock: 2, minStock: 1, categoryName: "Turbo" },
    { id: 64, name: "Culata de Cilindro", sku: "MOT-CUL-064", stock: 2, minStock: 1, categoryName: "Bombas de Agua" },
  ]
  d["get_inventory_movement_report"] = (a: any) => [
    { month: "2026-07", entries: 8, exits: 45, net: -37 },
    { month: "2026-06", entries: 12, exits: 38, net: -26 },
  ]
  d["get_inventory_aging"] = (a: any) => [
    { id: 27, name: "Turbo Cargador Completo", sku: "TUR-COM-027", stock: 2, daysInStock: 90, warehouseName: "Almacén Norte" },
    { id: 64, name: "Culata de Cilindro", sku: "MOT-CUL-064", stock: 2, daysInStock: 75, warehouseName: "Almacén Norte" },
  ]
  d["get_inventory_overstock"] = () => [
    { id: 5, name: "Bujía de Encendido", sku: "EN-BUJ-005", stock: 200, maxStock: 500, categoryName: "Bujías" },
  ]
  d["get_inventory_fast_slow"] = (a: any) => [
    { id: 4, name: "Filtro de Aceite", sku: "FLT-FAC-004", movementRate: 15, category: "fast" },
    { id: 5, name: "Bujía de Encendido", sku: "EN-BUJ-005", movementRate: 12, category: "fast" },
    { id: 27, name: "Turbo Cargador Completo", sku: "TUR-COM-027", movementRate: 0.5, category: "slow" },
  ]

  // --- Purchasing Reports ---
  d["get_purchases_by_month"] = (a: any) => [
    { month: "2026-07", orders: 4, total: 28500, items: 18 },
    { month: "2026-06", orders: 3, total: 22000, items: 14 },
  ]
  d["get_purchases_by_supplier"] = (a: any) => [
    { supplierId: 1, supplierName: "Autopartes del Centro S.A. de C.V.", orders: 3, total: 18000 },
    { supplierId: 10, supplierName: "TurboComponentes de México", orders: 1, total: 15000 },
  ]
  d["get_supplier_performance_report"] = () => [
    { id: 1, name: "Autopartes del Centro S.A. de C.V.", onTimeDelivery: 95, qualityRating: 98, responseTime: 1, averageLeadTime: 3 },
    { id: 2, name: "Refaccionaría del Norte S.A.", onTimeDelivery: 88, qualityRating: 92, responseTime: 2, averageLeadTime: 4.5 },
  ]
  d["get_po_status_summary"] = () => [
    { status: "draft", count: 1, total: 3200 },
    { status: "pending", count: 2, total: 19600 },
    { status: "sent", count: 1, total: 5200 },
    { status: "partial", count: 2, total: 11000 },
    { status: "received", count: 3, total: 26300 },
    { status: "cancelled", count: 1, total: 4500 },
  ]
  d["get_products_to_reorder"] = () => [
    { id: 10, productName: "Alternador 120A", sku: "ELE-ALT-010", currentStock: 5, minStock: 2, suggestedOrder: 10, supplier: "Refaccionaría del Norte S.A." },
    { id: 27, productName: "Turbo Cargador Completo", sku: "TUR-COM-027", currentStock: 2, minStock: 1, suggestedOrder: 3, supplier: "TurboComponentes de México" },
  ]

  // --- Customer Reports ---
  d["get_top_customers"] = (a: any) => [
    { id: 3, name: "Luis Martínez Rodríguez", totalSpent: 45200, totalPurchases: 22, lastPurchase: "2026-07-30" },
    { id: 11, name: "Miguel Ángel Torres", totalSpent: 38900, totalPurchases: 20, lastPurchase: "2026-07-30" },
    { id: 7, name: "Roberto Díaz Castillo", totalSpent: 32100, totalPurchases: 18, lastPurchase: "2026-07-29" },
    { id: 17, name: "Héctor Rivas Mendoza", totalSpent: 29800, totalPurchases: 16, lastPurchase: "2026-07-28" },
    { id: 1, name: "Juan Pérez López", totalSpent: 28500, totalPurchases: 15, lastPurchase: "2026-07-28" },
  ]
  d["get_customer_growth_report"] = () => [
    { month: "2026-01", newCustomers: 2, totalCustomers: 18 },
    { month: "2026-02", newCustomers: 2, totalCustomers: 20 },
    { month: "2026-03", newCustomers: 2, totalCustomers: 22 },
    { month: "2026-04", newCustomers: 2, totalCustomers: 24 },
    { month: "2026-05", newCustomers: 3, totalCustomers: 27 },
    { month: "2026-06", newCustomers: 2, totalCustomers: 29 },
    { month: "2026-07", newCustomers: 3, totalCustomers: 32 },
  ]
  d["get_customer_locations"] = () => [
    { city: "Ciudad de México", state: "CDMX", count: 15 },
    { city: "Monterrey", state: "Nuevo León", count: 5 },
    { city: "Guadalajara", state: "Jalisco", count: 4 },
    { city: "Querétaro", state: "Querétaro", count: 2 },
    { city: "Mérida", state: "Yucatán", count: 2 },
    { city: "Veracruz", state: "Veracruz", count: 1 },
    { city: "San Luis Potosí", state: "San Luis Potosí", count: 1 },
  ]
  d["get_inactive_customers"] = (a: any) => [
    { id: 23, name: "Paola Guerrero Soto", lastPurchase: "2026-06-30", daysInactive: 30, totalSpent: 650 },
    { id: 6, name: "Laura Jiménez Vargas", lastPurchase: "2026-07-15", daysInactive: 15, totalSpent: 3400 },
  ]
  d["get_customer_credit_summary"] = {
    totalAccounts: 8,
    totalCreditLimit: 80000,
    totalOutstanding: 28500,
    availableCredit: 51500,
    overdueAccounts: 1,
    overdueAmount: 2500,
    averageUtilization: 35.6,
  }
  d["get_customer_service_summary"] = {
    totalVehicles: 38,
    totalReminders: 12,
    pendingReminders: 4,
    overdueReminders: 1,
    warrantiesActive: 3,
    warrantiesExpiring: 1,
  }

  // --- Supplier Reports ---
  d["get_supplier_ranking"] = () => [
    { id: 1, name: "Autopartes del Centro S.A. de C.V.", score: 96.5, onTimeDelivery: 95, qualityRating: 98, pricingCompetitiveness: 85 },
    { id: 10, name: "TurboComponentes de México", score: 92.0, onTimeDelivery: 90, qualityRating: 95, pricingCompetitiveness: 80 },
    { id: 3, name: "Importadora de Autopartes del Pacífico", score: 90.5, onTimeDelivery: 88, qualityRating: 95, pricingCompetitiveness: 82 },
  ]
  d["get_lead_time_analysis"] = () => [
    { supplierId: 1, supplierName: "Autopartes del Centro S.A. de C.V.", averageLeadTime: 3, minLeadTime: 2, maxLeadTime: 5, ordersAnalyzed: 8 },
    { supplierId: 2, supplierName: "Refaccionaría del Norte S.A.", averageLeadTime: 4.5, minLeadTime: 3, maxLeadTime: 7, ordersAnalyzed: 5 },
    { supplierId: 3, supplierName: "Importadora de Autopartes del Pacífico", averageLeadTime: 6, minLeadTime: 4, maxLeadTime: 10, ordersAnalyzed: 4 },
  ]

  // --- Warehouse Reports ---
  d["get_warehouse_utilization"] = () => [
    { id: 1, name: "Almacén Central", totalLocations: 7, usedLocations: 7, utilization: 100, totalProducts: 85, totalStock: 856 },
    { id: 2, name: "Almacén Norte", totalLocations: 3, usedLocations: 3, utilization: 100, totalProducts: 32, totalStock: 148 },
    { id: 3, name: "Almacén Sur", totalLocations: 1, usedLocations: 1, utilization: 100, totalProducts: 15, totalStock: 95 },
    { id: 4, name: "Almacén Taller", totalLocations: 1, usedLocations: 1, utilization: 100, totalProducts: 12, totalStock: 45 },
  ]
  d["get_warehouse_stock_distribution"] = (a: any) => [
    { categoryId: 1, categoryName: "Pastillas de Freno", totalProducts: 3, totalStock: 67 },
    { categoryId: 12, categoryName: "Rodamientos", totalProducts: 5, totalStock: 125 },
  ]
  d["get_warehouse_adjustments"] = () => [
    { id: 1, warehouseId: 1, warehouseName: "Almacén Central", type: "positive", reason: "Conteo cíclico", affectedProducts: 3, totalAdjustment: 15, createdBy: 1, createdAt: "2026-07-28T10:00:00Z" },
    { id: 2, warehouseId: 1, warehouseName: "Almacén Central", type: "negative", reason: "Daño en almacén", affectedProducts: 2, totalAdjustment: -5, createdBy: 1, createdAt: "2026-07-25T10:00:00Z" },
  ]

  // --- Profitability Reports ---
  d["get_profit_summary"] = (a: any) => [
    { month: "2026-07", revenue: 98500, cost: 45000, grossProfit: 53500, margin: 0.543 },
    { month: "2026-06", revenue: 90200, cost: 42000, grossProfit: 48200, margin: 0.534 },
    { month: "2026-05", revenue: 85000, cost: 40000, grossProfit: 45000, margin: 0.529 },
  ]
  d["get_profit_by_category"] = () => [
    { entityId: 1, entityName: "Pastillas de Freno", revenue: 28500, cost: 17100, profit: 11400, margin: 0.40 },
    { entityId: 4, entityName: "Filtros", revenue: 19600, cost: 11760, profit: 7840, margin: 0.40 },
    { entityId: 17, entityName: "Lubricantes", revenue: 15200, cost: 9120, profit: 6080, margin: 0.40 },
  ]
  d["get_profit_by_product"] = (a: any) => [
    { entityId: 1, entityName: "Pastillas de Freno Delanteras", entitySku: "FRN-PFD-001", revenue: 7700, cost: 4620, profit: 3080, margin: 0.40 },
    { entityId: 4, entityName: "Filtro de Aceite", entitySku: "FLT-FAC-004", revenue: 3825, cost: 2295, profit: 1530, margin: 0.40 },
    { entityId: 5, entityName: "Bujía de Encendido", entitySku: "EN-BUJ-005", revenue: 3610, cost: 2166, profit: 1444, margin: 0.40 },
  ]
  d["get_profit_by_supplier"] = () => [
    { entityId: 1, entityName: "Autopartes del Centro S.A. de C.V.", revenue: 45000, cost: 27000, profit: 18000, margin: 0.40 },
    { entityId: 10, entityName: "TurboComponentes de México", revenue: 28000, cost: 16800, profit: 11200, margin: 0.40 },
  ]
  d["get_profit_by_brand"] = () => [
    { entityId: 2, entityName: "Brembo", revenue: 32000, cost: 19200, profit: 12800, margin: 0.40 },
    { entityId: 13, entityName: "Mann-Filter", revenue: 18000, cost: 10800, profit: 7200, margin: 0.40 },
  ]
  d["get_profit_by_customer"] = (a: any) => [
    { entityId: 3, entityName: "Luis Martínez Rodríguez", revenue: 45200, cost: 27120, profit: 18080, margin: 0.40 },
    { entityId: 11, entityName: "Miguel Ángel Torres", revenue: 38900, cost: 23340, profit: 15560, margin: 0.40 },
  ]
  d["get_profit_by_warehouse"] = () => [
    { entityId: 1, entityName: "Almacén Central", revenue: 78500, cost: 47100, profit: 31400, margin: 0.40 },
    { entityId: 2, entityName: "Almacén Norte", revenue: 32000, cost: 19200, profit: 12800, margin: 0.40 },
    { entityId: 3, entityName: "Almacén Sur", revenue: 12000, cost: 7200, profit: 4800, margin: 0.40 },
  ]

  // --- KPIs ---
  d["get_kpi_values"] = () => [
    { id: 1, key: "revenue_month", name: "Ingresos del Mes", value: 98500, unit: "MXN", target: 100000, trend: "up" },
    { id: 2, key: "profit_margin", name: "Margen de Ganancia", value: 45.5, unit: "%", target: 40, trend: "up" },
    { id: 3, key: "inventory_turnover", name: "Rotación de Inventario", value: 4.2, unit: "veces", target: 5, trend: "stable" },
    { id: 4, key: "customer_acquisition", name: "Nuevos Clientes", value: 3, unit: "", target: 5, trend: "down" },
    { id: 5, key: "order_fulfillment", name: "Cumplimiento de Órdenes", value: 92, unit: "%", target: 95, trend: "stable" },
    { id: 6, key: "on_time_delivery", name: "Entregas a Tiempo", value: 90, unit: "%", target: 95, trend: "stable" },
    { id: 7, key: "average_ticket", name: "Ticket Promedio", value: 445, unit: "MXN", target: 500, trend: "down" },
    { id: 8, key: "quote_conversion", name: "Conversión de Cotizaciones", value: 65, unit: "%", target: 70, trend: "up" },
  ]
  d["get_kpi_definitions"] = () => [
    { id: 1, key: "revenue_month", name: "Ingresos del Mes", description: "Total de ingresos del mes actual", unit: "MXN", formula: "Suma de todas las ventas del mes", target: 100000, isActive: true },
    { id: 2, key: "profit_margin", name: "Margen de Ganancia", description: "Porcentaje de ganancia sobre ingresos", unit: "%", formula: "(Ingresos - Costos) / Ingresos * 100", target: 40, isActive: true },
    { id: 3, key: "inventory_turnover", name: "Rotación de Inventario", description: "Veces que se vende el inventario en un período", unit: "veces", formula: "Costo de ventas / Inventario promedio", target: 5, isActive: true },
    { id: 4, key: "customer_acquisition", name: "Nuevos Clientes", description: "Número de nuevos clientes en el mes", unit: "", formula: "Conteo de nuevos clientes", target: 5, isActive: true },
  ]

  // --- Saved / Scheduled Reports ---
  d["get_saved_reports"] = (a: any) => [
    { id: 1, name: "Ventas Mensuales", module: a?.module ?? "sales", description: "Reporte mensual de ventas", filters: JSON.stringify({ period: "monthly" }), createdBy: 1, createdAt: "2026-01-15T10:00:00Z" },
    { id: 2, name: "Productos con Stock Bajo", module: a?.module ?? "inventory", description: "Productos por debajo del mínimo", filters: JSON.stringify({}), createdBy: 1, createdAt: "2026-02-10T10:00:00Z" },
    { id: 3, name: "Rendimiento de Proveedores", module: a?.module ?? "purchasing", description: "Evaluación de proveedores", filters: JSON.stringify({}), createdBy: 1, createdAt: "2026-03-05T10:00:00Z" },
  ]
  d["create_saved_report"] = (a: any) => ({ id: Math.floor(Math.random() * 900) + 100, ...a?.input, createdBy: a?.createdBy, createdAt: new Date().toISOString() })
  d["delete_saved_report"] = undefined
  d["get_scheduled_reports"] = () => [
    { id: 1, name: "Reporte Semanal de Ventas", savedReportId: 1, savedReportName: "Ventas Mensuales", frequency: "weekly", dayOfWeek: 1, dayOfMonth: null, time: "08:00", exportFormat: "pdf", isActive: true, createdBy: 1, createdAt: "2026-01-15T10:00:00Z" },
    { id: 2, name: "Inventario Crítico", savedReportId: 2, savedReportName: "Productos con Stock Bajo", frequency: "daily", dayOfWeek: null, dayOfMonth: null, time: "06:00", exportFormat: "csv", isActive: true, createdBy: 1, createdAt: "2026-02-10T10:00:00Z" },
  ]
  d["create_scheduled_report"] = (a: any) => ({ id: Math.floor(Math.random() * 900) + 100, ...a, isActive: true, createdAt: new Date().toISOString() })
  d["toggle_scheduled_report"] = undefined
  d["get_report_history"] = (a: any) => [
    { id: 1, reportName: "Ventas Mensuales", module: "sales", exportFormat: "pdf", executionTimeMs: 1500, rowCount: 30, generatedBy: 1, generatedAt: "2026-07-30T08:00:00Z" },
    { id: 2, reportName: "Productos con Stock Bajo", module: "inventory", exportFormat: "csv", executionTimeMs: 800, rowCount: 12, generatedBy: 1, generatedAt: "2026-07-30T06:00:00Z" },
    { id: 3, reportName: "Ventas Mensuales", module: "sales", exportFormat: "pdf", executionTimeMs: 1200, rowCount: 28, generatedBy: 1, generatedAt: "2026-07-23T08:00:00Z" },
  ]
  d["log_report_generation"] = undefined
  d["get_report_templates"] = (a: any) => [
    { id: 1, name: "Reporte de Ventas Diario", module: "sales", description: "Plantilla para reporte de ventas diario", defaultFilters: JSON.stringify({ period: "daily" }) },
    { id: 2, name: "Valuación de Inventario", module: "inventory", description: "Plantilla para valuación de inventario", defaultFilters: JSON.stringify({}) },
  ]
  d["get_dashboard_preferences"] = (a: any) => JSON.stringify({
    widgets: [
      { id: 1, type: "sales_today", visible: true, order: 1 },
      { id: 2, type: "sales_chart", visible: true, order: 2 },
    ],
  })
  d["save_dashboard_preferences"] = undefined

  // --- Admin Dashboard ---
  d["get_admin_dashboard"] = {
    activeUsers: 8,
    totalUsers: 12,
    databaseSize: "12.5 MB",
    databaseSizeBytes: 13107200,
    lastBackup: "2026-07-30T02:00:00Z",
    backupStatus: "successful",
    storageUsage: "45%",
    storageUsedBytes: 524288000,
    appVersion: "1.2.0",
    connectedPrinters: 2,
    recentLogins: 15,
    recentErrors: 2,
    auditEventsToday: 48,
    systemHealth: "healthy",
    licenseStatus: "active",
  }
  d["get_user_activity_chart"] = (a: any) => {
    const days = a?.days ?? 7
    const data = []
    const now = new Date()
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      data.push({ date: d.toISOString().split("T")[0], count: Math.floor(Math.random() * 50) + 10 })
    }
    return data
  }
  d["get_database_growth_chart"] = (a: any) => {
    const days = a?.days ?? 7
    const data = []
    const now = new Date()
    let size = 12000000
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      size += Math.floor(Math.random() * 100000) + 50000
      data.push({ date: d.toISOString().split("T")[0], sizeBytes: size })
    }
    return data
  }
  d["get_recent_audit_events"] = (a: any) => [
    { id: 1, userId: 1, username: "admin", fullName: "Administrador", action: "login", entityType: "session", severity: "info", createdAt: "2026-07-30T08:00:00Z" },
    { id: 2, userId: 2, username: "vendedor1", fullName: "Vendedor Uno", action: "login", entityType: "session", severity: "info", createdAt: "2026-07-30T08:15:00Z" },
    { id: 3, userId: 1, username: "admin", fullName: "Administrador", action: "create_sale", entityType: "sale", entityId: "25", details: "Venta creada por $1,250", severity: "info", createdAt: "2026-07-30T10:30:00Z" },
    { id: 4, userId: 1, username: "admin", fullName: "Administrador", action: "update_product", entityType: "product", entityId: "5", details: "Precio actualizado de $95 a $105", severity: "info", createdAt: "2026-07-30T11:00:00Z" },
    { id: 5, userId: 2, username: "vendedor1", fullName: "Vendedor Uno", action: "failed_login", entityType: "session", details: "Contraseña incorrecta", severity: "warning", createdAt: "2026-07-30T08:10:00Z" },
  ]

  // --- Admin Users ---
  d["get_admin_users"] = (a: any) => [
    { id: 1, username: "admin", email: "admin@inventorygear.com", fullName: "Administrador", phone: "+52 55 1111 2222", roleId: 1, roleName: "Administrator", isActive: true, isLocked: false, failedLoginAttempts: 0, passwordChangeRequired: false, lastLoginAt: "2026-07-30T08:00:00Z", createdAt: "2025-01-01T00:00:00Z", updatedAt: "2026-07-30T08:00:00Z" },
    { id: 2, username: "vendedor1", email: "vendedor1@inventorygear.com", fullName: "Vendedor Uno", phone: "+52 55 2222 3333", roleId: 2, roleName: "Seller", isActive: true, isLocked: false, failedLoginAttempts: 1, passwordChangeRequired: false, lastLoginAt: "2026-07-30T08:15:00Z", createdAt: "2025-03-15T10:00:00Z", updatedAt: "2026-07-30T08:15:00Z" },
    { id: 3, username: "vendedor2", email: "vendedor2@inventorygear.com", fullName: "Vendedora Dos", phone: "+52 55 3333 4444", roleId: 2, roleName: "Seller", isActive: true, isLocked: false, failedLoginAttempts: 0, passwordChangeRequired: true, createdAt: "2025-06-20T10:00:00Z", updatedAt: "2026-07-28T10:00:00Z" },
    { id: 4, username: "almacen1", email: "almacen1@inventorygear.com", fullName: "Almacenista Uno", phone: "+52 55 4444 5555", roleId: 3, roleName: "Warehouse", isActive: true, isLocked: false, failedLoginAttempts: 0, passwordChangeRequired: false, lastLoginAt: "2026-07-29T07:00:00Z", createdAt: "2025-04-10T10:00:00Z", updatedAt: "2026-07-29T07:00:00Z" },
    { id: 5, username: "compras1", email: "compras1@inventorygear.com", fullName: "Comprador Uno", phone: "+52 55 5555 6666", roleId: 4, roleName: "Purchasing", isActive: true, isLocked: false, failedLoginAttempts: 0, passwordChangeRequired: false, lastLoginAt: "2026-07-29T09:00:00Z", createdAt: "2025-05-05T10:00:00Z", updatedAt: "2026-07-29T09:00:00Z" },
    { id: 6, username: "gerente1", email: "gerente1@inventorygear.com", fullName: "Gerente General", phone: "+52 55 6666 7777", roleId: 5, roleName: "Manager", isActive: true, isLocked: false, failedLoginAttempts: 0, passwordChangeRequired: false, lastLoginAt: "2026-07-28T10:00:00Z", createdAt: "2025-02-01T10:00:00Z", updatedAt: "2026-07-28T10:00:00Z" },
    { id: 7, username: "cajero1", email: "cajero1@inventorygear.com", fullName: "Cajero Uno", phone: "+52 55 7777 8888", roleId: 6, roleName: "Cashier", isActive: true, isLocked: false, failedLoginAttempts: 0, passwordChangeRequired: false, lastLoginAt: "2026-07-29T08:00:00Z", createdAt: "2025-07-15T10:00:00Z", updatedAt: "2026-07-29T08:00:00Z" },
    { id: 8, username: "admin2", email: "admin2@inventorygear.com", fullName: "Co-Administrador", phone: "+52 55 8888 9999", roleId: 1, roleName: "Administrator", isActive: true, isLocked: false, failedLoginAttempts: 0, passwordChangeRequired: false, lastLoginAt: "2026-07-27T12:00:00Z", createdAt: "2025-08-01T10:00:00Z", updatedAt: "2026-07-27T12:00:00Z" },
    { id: 9, username: "user_inactivo", email: "inactivo@inventorygear.com", fullName: "Usuario Inactivo", roleId: 2, roleName: "Seller", isActive: false, isLocked: false, failedLoginAttempts: 0, passwordChangeRequired: false, createdAt: "2025-09-01T10:00:00Z", updatedAt: "2026-06-01T10:00:00Z" },
    { id: 10, username: "user_bloqueado", email: "bloqueado@inventorygear.com", fullName: "Usuario Bloqueado", roleId: 2, roleName: "Seller", isActive: true, isLocked: true, lockedUntil: "2026-08-01T00:00:00Z", failedLoginAttempts: 5, passwordChangeRequired: false, createdAt: "2025-10-01T10:00:00Z", updatedAt: "2026-07-30T08:00:00Z" },
  ]
  d["get_admin_user"] = (a: any) => ({
    id: a?.id ?? 1,
    username: "admin",
    email: "admin@inventorygear.com",
    fullName: "Administrador",
    phone: "+52 55 1111 2222",
    roleId: 1,
    roleName: "Administrator",
    isActive: true,
    isLocked: false,
    failedLoginAttempts: 0,
    passwordChangeRequired: false,
    lastLoginAt: "2026-07-30T08:00:00Z",
    notes: "Usuario administrador principal",
    createdBy: 1,
    createdByName: "System",
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2026-07-30T08:00:00Z",
  })
  d["create_admin_user"] = (a: any) => ({ id: Math.floor(Math.random() * 900) + 100, username: a?.input?.username, email: a?.input?.email, fullName: a?.input?.fullName, phone: a?.input?.phone, roleId: a?.input?.roleId, isActive: true, isLocked: false, failedLoginAttempts: 0, passwordChangeRequired: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
  d["update_admin_user"] = (a: any) => a?.input
  d["archive_admin_user"] = undefined
  d["restore_admin_user"] = undefined
  d["reset_user_password"] = undefined
  d["lock_user_account"] = undefined
  d["unlock_user_account"] = undefined
  d["get_user_sessions"] = (a: any) => [
    { id: 1, user_id: a?.userId ?? 1, token: "tok-xxxx-xxxx-1", expires_at: "2026-08-01T08:00:00Z", is_active: true, created_at: "2026-07-30T08:00:00Z" },
    { id: 2, user_id: a?.userId ?? 1, token: "tok-xxxx-xxxx-2", expires_at: "2026-07-29T08:00:00Z", is_active: false, created_at: "2026-07-25T08:00:00Z" },
  ]
  d["revoke_user_session"] = undefined
  d["get_total_user_count"] = 12

  // --- Admin Roles ---
  d["get_admin_roles"] = (a: any) => [
    { id: 1, name: "Administrator", description: "Acceso total al sistema", isSystem: true, isActive: true, permissionCount: 120, userCount: 2, createdAt: "2025-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" },
    { id: 2, name: "Seller", description: "Ventas y POS", isSystem: true, isActive: true, permissionCount: 45, userCount: 3, createdAt: "2025-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" },
    { id: 3, name: "Warehouse", description: "Gestión de almacén e inventario", isSystem: true, isActive: true, permissionCount: 30, userCount: 1, createdAt: "2025-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" },
    { id: 4, name: "Purchasing", description: "Compras y proveedores", isSystem: true, isActive: true, permissionCount: 28, userCount: 1, createdAt: "2025-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" },
    { id: 5, name: "Manager", description: "Reportes y dashboards", isSystem: false, isActive: true, permissionCount: 55, userCount: 1, createdAt: "2025-02-15T10:00:00Z", updatedAt: "2026-03-01T10:00:00Z" },
    { id: 6, name: "Cashier", description: "Solo caja registradora", isSystem: false, isActive: true, permissionCount: 15, userCount: 1, createdAt: "2025-07-01T10:00:00Z", updatedAt: "2026-07-01T10:00:00Z" },
    { id: 7, name: "Consultant", description: "Solo consulta de datos", isSystem: false, isActive: false, permissionCount: 10, userCount: 0, createdAt: "2025-11-01T10:00:00Z", updatedAt: "2026-05-01T10:00:00Z" },
  ]
  d["get_admin_role"] = (a: any) => ({
    role: {
      id: a?.id ?? 1,
      name: "Administrator",
      description: "Acceso total al sistema",
      isSystem: true,
      isActive: true,
      permissionCount: 120,
      userCount: 2,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    },
    permissions: ["*"],
  })
  d["get_all_permissions"] = (a: any) => [
    { id: 1, key: "sales.create", name: "Crear Ventas", groupName: "Ventas", description: "Permite crear nuevas ventas" },
    { id: 2, key: "sales.read", name: "Ver Ventas", groupName: "Ventas", description: "Permite ver ventas existentes" },
    { id: 3, key: "sales.update", name: "Actualizar Ventas", groupName: "Ventas", description: "Permite modificar ventas" },
    { id: 4, key: "sales.delete", name: "Eliminar Ventas", groupName: "Ventas", description: "Permite eliminar ventas" },
    { id: 5, key: "sales.refund", name: "Reembolsar Ventas", groupName: "Ventas", description: "Permite realizar devoluciones" },
    { id: 6, key: "inventory.create", name: "Crear Productos", groupName: "Inventario", description: "Permite crear nuevos productos" },
    { id: 7, key: "inventory.read", name: "Ver Inventario", groupName: "Inventario", description: "Permite consultar el inventario" },
    { id: 8, key: "inventory.update", name: "Actualizar Productos", groupName: "Inventario", description: "Permite modificar productos" },
    { id: 9, key: "purchasing.create", name: "Crear Órdenes", groupName: "Compras", description: "Permite crear órdenes de compra" },
    { id: 10, key: "customers.create", name: "Crear Clientes", groupName: "Clientes", description: "Permite crear nuevos clientes" },
    { id: 11, key: "customers.read", name: "Ver Clientes", groupName: "Clientes", description: "Permite consultar clientes" },
    { id: 12, key: "customers.update", name: "Actualizar Clientes", groupName: "Clientes", description: "Permite modificar clientes" },
    { id: 13, key: "reports.read", name: "Ver Reportes", groupName: "Reportes", description: "Permite acceder a reportes" },
    { id: 14, key: "admin.users", name: "Gestionar Usuarios", groupName: "Administración", description: "Permite administrar usuarios" },
    { id: 15, key: "admin.roles", name: "Gestionar Roles", groupName: "Administración", description: "Permite administrar roles" },
    { id: 16, key: "admin.settings", name: "Configuración", groupName: "Administración", description: "Permite modificar configuración" },
    { id: 17, key: "admin.backups", name: "Respaldos", groupName: "Administración", description: "Permite gestionar respaldos" },
    { id: 18, key: "pos.access", name: "Acceso a POS", groupName: "POS", description: "Permite usar el punto de venta" },
    { id: 19, key: "crm.access", name: "Acceso a CRM", groupName: "CRM", description: "Permite usar el módulo CRM" },
    { id: 20, key: "warehouse.access", name: "Acceso a Almacén", groupName: "Almacén", description: "Permite gestionar almacenes" },
  ]
  d["get_permission_groups"] = ["Ventas", "Inventario", "Compras", "Clientes", "Reportes", "Administración", "POS", "CRM", "Almacén"]
  d["create_admin_role"] = (a: any) => ({ id: Math.floor(Math.random() * 900) + 100, name: a?.input?.name, description: a?.input?.description, isSystem: false, isActive: true, permissionCount: (a?.input?.permissions ?? []).length, userCount: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
  d["update_admin_role"] = (a: any) => a?.input
  d["clone_admin_role"] = (a: any) => ({ id: Math.floor(Math.random() * 900) + 100, name: a?.newName, description: "Rol clonado", isSystem: false, isActive: true, permissionCount: 0, userCount: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
  d["archive_admin_role"] = undefined
  d["assign_permissions_to_role"] = undefined
  d["bulk_assign_permissions"] = undefined

  // --- Admin App Settings ---
  const appSettings = [
    { category: "general", key: "store_name", value: "InventoryGear", settingType: "string", description: "Nombre de la tienda", isSystem: true },
    { category: "general", key: "store_logo", value: "", settingType: "string", description: "URL del logotipo", isSystem: true },
    { category: "general", key: "currency", value: "MXN", settingType: "select", description: "Moneda predeterminada", options: JSON.stringify(["USD", "MXN", "EUR", "GTQ", "CRC", "COP"]), isSystem: true },
    { category: "general", key: "timezone", value: "America/Mexico_City", settingType: "string", description: "Zona horaria", isSystem: true },
    { category: "general", key: "language", value: "es", settingType: "select", description: "Idioma por defecto", options: JSON.stringify({ options: ["es", "en"] }), isSystem: true },
    { category: "theme", key: "theme", value: "system", settingType: "select", description: "Tema por defecto", options: JSON.stringify({ options: ["light", "dark", "system"] }), isSystem: true },
    { category: "localization", key: "date_format", value: "DD/MM/YYYY", settingType: "string", description: "Formato de fecha", isSystem: true },
    { category: "localization", key: "time_format", value: "HH:mm", settingType: "string", description: "Formato de hora", isSystem: true },
    { category: "localization", key: "number_format", value: "1,234.56", settingType: "string", description: "Formato de números", isSystem: true },
    { category: "security", key: "auto_logout_minutes", value: "60", settingType: "number", description: "Cierre de sesión por inactividad (min)", validation: JSON.stringify({ min: 1, max: 1440 }), isSystem: true },
    { category: "security", key: "password_min_length", value: "8", settingType: "number", description: "Longitud mínima de contraseña", validation: JSON.stringify({ min: 4, max: 64 }), isSystem: true },
    { category: "security", key: "failed_login_lockout", value: "5", settingType: "number", description: "Intentos antes de bloqueo", validation: JSON.stringify({ min: 1, max: 50 }), isSystem: true },
    { category: "inventory", key: "low_stock_threshold", value: "10", settingType: "number", description: "Umbral de stock bajo", validation: JSON.stringify({ min: 0, max: 100000 }), isSystem: true },
    { category: "inventory", key: "default_warehouse_id", value: "1", settingType: "number", description: "Almacén predeterminado", isSystem: true },
    { category: "inventory", key: "barcode_format", value: "CODE128", settingType: "select", description: "Formato de código de barras", options: JSON.stringify({ options: ["CODE128", "EAN13", "UPC", "QR"] }), isSystem: true },
    { category: "sales", key: "receipt_footer", value: "¡Gracias por su compra!", settingType: "string", description: "Pie de recibo", isSystem: false },
    { category: "sales", key: "invoice_prefix", value: "INV-", settingType: "string", description: "Prefijo de factura", isSystem: true },
    { category: "sales", key: "sale_prefix", value: "SALE-", settingType: "string", description: "Prefijo de venta", isSystem: true },
    { category: "sales", key: "quote_prefix", value: "QTE-", settingType: "string", description: "Prefijo de cotización", isSystem: true },
    { category: "sales", key: "default_payment_method", value: "cash", settingType: "select", description: "Método de pago por defecto", options: JSON.stringify({ options: ["cash", "card", "transfer", "credit"] }), isSystem: true },
    { category: "sales", key: "receipt_show_tax_breakdown", value: "true", settingType: "boolean", description: "Mostrar desglose de impuestos", isSystem: true },
    { category: "sales", key: "receipt_show_barcode", value: "false", settingType: "boolean", description: "Imprimir código de barras en recibos", isSystem: true },
    { category: "sales", key: "receipt_show_customer_info", value: "true", settingType: "boolean", description: "Mostrar datos del cliente en recibos", isSystem: true },
    { category: "purchasing", key: "po_prefix", value: "PO-", settingType: "string", description: "Prefijo de orden de compra", isSystem: true },
    { category: "printing", key: "paper_size_default", value: "80mm", settingType: "select", description: "Tamaño de papel por defecto", options: JSON.stringify({ options: ["80mm", "58mm", "A4", "Letter"] }), isSystem: true },
    { category: "backup", key: "auto_backup", value: "true", settingType: "boolean", description: "Copias de seguridad automáticas", isSystem: true },
    { category: "backup", key: "backup_interval_hours", value: "24", settingType: "number", description: "Intervalo de respaldo (horas)", validation: JSON.stringify({ min: 1, max: 720 }), isSystem: true },
    { category: "backup", key: "backup_retention_days", value: "30", settingType: "number", description: "Retención (días)", validation: JSON.stringify({ min: 1, max: 3650 }), isSystem: true },
    { category: "updates", key: "auto_check_updates", value: "true", settingType: "boolean", description: "Buscar actualizaciones automáticamente", isSystem: true },
    { category: "performance", key: "cache_enabled", value: "true", settingType: "boolean", description: "Habilitar caché", isSystem: true },
    { category: "performance", key: "cache_ttl_seconds", value: "300", settingType: "number", description: "TTL de caché (segundos)", validation: JSON.stringify({ min: 0, max: 86400 }), isSystem: true },
    { category: "company", key: "business_name", value: "Autopartes Pérez S.A. de C.V.", settingType: "string", description: "Razón social del negocio", isSystem: false },
    { category: "company", key: "tax_id", value: "APE-830912-KL4", settingType: "string", description: "Identificación fiscal (RFC/NIT)", validation: JSON.stringify({ maxLength: 30 }), isSystem: false },
    { category: "company", key: "address_line1", value: "Av. Revolución 1234", settingType: "string", description: "Dirección línea 1", isSystem: false },
    { category: "company", key: "address_line2", value: "Col. Centro", settingType: "string", description: "Dirección línea 2", isSystem: false },
    { category: "company", key: "city", value: "Ciudad de México", settingType: "string", description: "Ciudad", isSystem: false },
    { category: "company", key: "state", value: "CDMX", settingType: "string", description: "Estado / provincia", isSystem: false },
    { category: "company", key: "postal_code", value: "06000", settingType: "string", description: "Código postal", validation: JSON.stringify({ maxLength: 12 }), isSystem: false },
    { category: "company", key: "phone", value: "+52 55 1234 5678", settingType: "string", description: "Teléfono del negocio", isSystem: false },
    { category: "company", key: "email", value: "ventas@autopartes.com.mx", settingType: "string", description: "Correo del negocio", isSystem: false },
    { category: "company", key: "website", value: "www.autopartesperez.mx", settingType: "string", description: "Sitio web", isSystem: false },
    { category: "company", key: "business_type", value: "auto_parts", settingType: "select", description: "Tipo de negocio", options: JSON.stringify({ options: ["auto_parts", "tire_shop", "general_store", "retail"] }), isSystem: false },
    { category: "tax", key: "tax_rate", value: "16", settingType: "number", description: "Tasa de impuesto (%)", validation: JSON.stringify({ min: 0, max: 100 }), isSystem: true },
    { category: "tax", key: "prices_include_tax", value: "false", settingType: "boolean", description: "Los precios ya incluyen impuesto", isSystem: true },
    { category: "tax", key: "tax_id_required", value: "false", settingType: "boolean", description: "Requerir RFC/NIT en facturas", isSystem: true },
    { category: "notifications", key: "notify_low_stock", value: "true", settingType: "boolean", description: "Notificar stock bajo", isSystem: true },
    { category: "notifications", key: "notify_purchase_orders", value: "true", settingType: "boolean", description: "Notificar eventos de compras", isSystem: true },
    { category: "notifications", key: "notify_warranty_expiry", value: "true", settingType: "boolean", description: "Notificar garantías por vencer", isSystem: true },
    { category: "notifications", key: "notify_backup_failures", value: "true", settingType: "boolean", description: "Notificar fallos de respaldo", isSystem: true },
    { category: "notifications", key: "sound_enabled", value: "true", settingType: "boolean", description: "Reproducir sonidos de notificación", isSystem: true },
    { category: "business", key: "items_per_page", value: "25", settingType: "number", description: "Elementos por página", validation: JSON.stringify({ min: 5, max: 200 }), isSystem: true },
    { category: "business", key: "default_margin_percent", value: "30", settingType: "number", description: "Margen de venta por defecto (%)", validation: JSON.stringify({ min: 0, max: 90 }), isSystem: true },
    { category: "business", key: "enable_sales", value: "true", settingType: "boolean", description: "Habilitar módulo de ventas", isSystem: true },
    { category: "business", key: "enable_purchasing", value: "true", settingType: "boolean", description: "Habilitar módulo de compras", isSystem: true },
    { category: "business", key: "enable_crm", value: "true", settingType: "boolean", description: "Habilitar módulo CRM", isSystem: true },
  ]
  d["get_app_settings"] = (a: any) =>
    (a?.category ? appSettings.filter((s) => s.category === a.category) : appSettings).map((s, i) => ({
      id: i + 1,
      category: s.category,
      key: s.key,
      value: s.value,
      settingType: s.settingType,
      description: s.description,
      options: s.options,
      validation: s.validation,
      isSystem: s.isSystem,
      sortOrder: i + 1,
      createdAt: "2025-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    }))
  d["get_setting_categories"] = () => {
    const counts: Record<string, number> = {}
    appSettings.forEach((s) => { counts[s.category] = (counts[s.category] ?? 0) + 1 })
    return Object.entries(counts).map(([category, count]) => ({ category, count }))
  }
  d["update_app_setting"] = undefined
  d["update_app_settings_bulk"] = undefined
  d["get_setting_history"] = (a: any) => [
    { id: 1, user_id: 1, username: "admin", action: "update", details: `Cambió ${a?.key ?? "store_name"} de "Mi Tienda" a "InventoryGear"`, created_at: "2026-01-15T10:00:00Z" },
    { id: 2, user_id: 1, username: "admin", action: "update", details: `Cambió ${a?.key ?? "tax_rate"} de "16" a "18" y luego a "16"`, created_at: "2026-03-10T10:00:00Z" },
  ]
  d["reset_setting_to_default"] = undefined

  // --- Printers ---
  d["get_printers"] = (a: any) => [
    { id: 1, name: "Impresora Térmica Mostrador", printerType: "receipt", driverName: "EPSON TM-T20", deviceName: "/dev/usb/lp0", interfaceType: "usb", paperSize: "80mm", margins: JSON.stringify({ top: 0, bottom: 0, left: 0, right: 0 }), copies: 1, orientation: "portrait", isDefault: true, isActive: true, config: JSON.stringify({ charset: "CP437", codepage: "437", dpi: 203 }), createdAt: "2025-01-15T10:00:00Z", updatedAt: "2026-06-01T10:00:00Z" },
    { id: 2, name: "Impresora Láser Oficina", printerType: "label", driverName: "Brother HL-L2350DW", deviceName: "192.168.1.100", interfaceType: "network", ipAddress: "192.168.1.100", port: 9100, paperSize: "Letter", margins: JSON.stringify({ top: 5, bottom: 5, left: 5, right: 5 }), copies: 1, orientation: "landscape", isDefault: false, isActive: true, config: JSON.stringify({ resolution: "600x600", duplex: false }), createdAt: "2025-03-20T10:00:00Z", updatedAt: "2026-05-15T10:00:00Z" },
  ]
  d["get_printer_types"] = () => ["receipt", "label", "laser", "inkjet", "thermal"]
  d["create_printer"] = (a: any) => ({ id: Math.floor(Math.random() * 900) + 100, ...a?.input, isDefault: false, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
  d["update_printer"] = (a: any) => a
  d["delete_printer"] = undefined
  d["set_default_printer"] = undefined
  d["test_printer"] = (a: any) => `Prueba de impresora #${a?.id} exitosa - Página de prueba enviada`

  // --- Devices ---
  d["get_devices"] = (a: any) => [
    { id: 1, name: "Escáner Código de Barras", deviceType: "barcode_scanner", identifier: "SN-HONEYWELL-001", interfaceType: "usb", config: JSON.stringify({ symbologies: ["code128", "ean13", "upca"], triggerMode: "manual" }), isActive: true, createdAt: "2025-02-01T10:00:00Z", updatedAt: "2026-01-15T10:00:00Z" },
    { id: 2, name: "Lector de Tarjetas", deviceType: "card_reader", identifier: "SN-IDTECH-002", interfaceType: "usb", config: JSON.stringify({ chipReader: true, nfcEnabled: true }), isActive: true, createdAt: "2025-02-01T10:00:00Z", updatedAt: "2026-01-15T10:00:00Z" },
    { id: 3, name: "Báscula Mostrador", deviceType: "scale", identifier: "SN-CAS-003", interfaceType: "serial", config: JSON.stringify({ baudRate: 9600, dataBits: 8, stopBits: 1, parity: "none" }), isActive: false, createdAt: "2025-04-01T10:00:00Z", updatedAt: "2026-02-01T10:00:00Z" },
  ]
  d["get_device_types"] = () => ["barcode_scanner", "card_reader", "scale", "pinpad", "fingerprint_reader"]
  d["create_device"] = (a: any) => ({ id: Math.floor(Math.random() * 900) + 100, ...a?.input, isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
  d["update_device"] = (a: any) => a
  d["delete_device"] = undefined
  d["test_device"] = (a: any) => `Prueba de dispositivo #${a?.id} exitosa`

  // --- Backups ---
  d["get_backup_history"] = (a: any) => [
    { id: 1, fileName: "inventory_gear_2026-07-30_020000.sqlite", filePath: "/backups/inventory_gear_2026-07-30_020000.sqlite", fileSize: 12582912, backupType: "full", compression: "gzip", encryption: "aes256", status: "completed", notes: "Respaldo automático nocturno", createdBy: 1, createdByName: "System", createdAt: "2026-07-30T02:00:00Z" },
    { id: 2, fileName: "inventory_gear_2026-07-29_020000.sqlite", filePath: "/backups/inventory_gear_2026-07-29_020000.sqlite", fileSize: 12566528, backupType: "full", compression: "gzip", encryption: "aes256", status: "completed", createdBy: 1, createdByName: "System", createdAt: "2026-07-29T02:00:00Z" },
    { id: 3, fileName: "inventory_gear_2026-07-28_020000.sqlite", filePath: "/backups/inventory_gear_2026-07-28_020000.sqlite", fileSize: 12550144, backupType: "full", compression: "gzip", encryption: "aes256", status: "completed", createdBy: 1, createdByName: "System", createdAt: "2026-07-28T02:00:00Z" },
    { id: 4, fileName: "inventory_gear_2026-07-27_140000.sqlite", filePath: "/backups/inventory_gear_2026-07-27_140000.sqlite", fileSize: 12533760, backupType: "manual", compression: "gzip", encryption: "aes256", status: "completed", notes: "Respaldo manual antes de actualización", createdBy: 1, createdByName: "Administrador", createdAt: "2026-07-27T14:00:00Z" },
    { id: 5, fileName: "inventory_gear_2026-07-26_020000.sqlite", filePath: "/backups/inventory_gear_2026-07-26_020000.sqlite", fileSize: 12517376, backupType: "full", compression: "gzip", encryption: "aes256", status: "completed", createdBy: 1, createdByName: "System", createdAt: "2026-07-26T02:00:00Z" },
  ]
  d["get_restore_history"] = (a: any) => [
    { id: 1, backupId: 2, fileName: "inventory_gear_2026-06-15_020000.sqlite", filePath: "/backups/inventory_gear_2026-06-15_020000.sqlite", restoreType: "full", status: "completed", tablesRestored: "all", createdBy: 1, createdByName: "Administrador", createdAt: "2026-06-20T10:00:00Z" },
    { id: 2, backupId: 1, fileName: "inventory_gear_2026-05-01_020000.sqlite", filePath: "/backups/inventory_gear_2026-05-01_020000.sqlite", restoreType: "partial", status: "failed", errorMessage: "Error de integridad en tabla 'audit_logs'", createdBy: 1, createdByName: "Administrador", createdAt: "2026-05-05T10:00:00Z" },
  ]
  d["create_backup"] = (a: any) => ({
    id: Math.floor(Math.random() * 900) + 100,
    fileName: `inventory_gear_${new Date().toISOString().replace(/[T:]/g, "_").slice(0, 19)}.db`,
    filePath: `/backups/inventory_gear_${new Date().toISOString().replace(/[T:]/g, "_").slice(0, 19)}.db`,
    fileSize: 12582912,
    backupType: a?.backupType ?? "manual",
    compression: "none",
    encryption: "none",
    status: "completed",
    checksum: "a3f1c2e9b7d8456f9e0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e",
    notes: a?.notes,
    createdBy: a?.createdBy,
    createdByName: "Administrador",
    createdAt: new Date().toISOString(),
  })
  d["delete_backup"] = undefined
  d["verify_backup"] = (a: any) => ({
    fileName: "inventory_gear_2026-07-30_020000.sqlite",
    filePath: `/backups/inventory_gear_2026-07-30_020000.sqlite`,
    fileSize: 12582912,
    valid: true,
    sqliteValid: true,
    integrityOk: true,
    checksum: "a3f1c2e9b7d8456f9e0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e",
    checksumMatch: true,
    message: "Backup is valid",
  })
  d["restore_backup"] = (a: any) => ({
    id: Math.floor(Math.random() * 900) + 100,
    backupId: a?.input?.backupId,
    fileName: "inventory_gear_2026-07-30_020000.sqlite",
    filePath: `/backups/inventory_gear_2026-07-30_020000.sqlite`,
    restoreType: a?.input?.restoreType ?? "complete",
    status: "completed",
    tablesRestored: "all",
    createdBy: a?.input?.createdBy,
    createdByName: "Administrador",
    createdAt: new Date().toISOString(),
  })
  d["get_scheduled_backup_config"] = () => JSON.stringify({ enabled: true, intervalHours: 24, time: "02:00", retentionDays: 30, compression: "gzip", encryption: "aes256" })
  d["save_scheduled_backup_config"] = undefined
  d["get_backup_stats"] = { total_backups: 45, total_size_bytes: 570425344, total_size_mb: "544 MB", last_backup: "2026-07-30T02:00:00Z" }

  // --- Database ---
  d["get_database_stats"] = {
    pageSize: 4096,
    pageCount: 3276,
    totalSize: 13418496,
    tableCount: 28,
    indexCount: 35,
    integrityOk: true,
    freelistCount: 12,
    schemaVersion: 12,
  }
  d["get_table_sizes"] = () => [
    { name: "sales", rowCount: 1280, pageCount: 320 },
    { name: "sale_items", rowCount: 3840, pageCount: 480 },
    { name: "products", rowCount: 144, pageCount: 36 },
    { name: "customers", rowCount: 32, pageCount: 8 },
    { name: "purchase_orders", rowCount: 10, pageCount: 4 },
    { name: "inventory_movements", rowCount: 280, pageCount: 70 },
    { name: "audit_logs", rowCount: 5200, pageCount: 650 },
    { name: "users", rowCount: 10, pageCount: 4 },
  ]
  d["vacuum_database"] = "Base de datos optimizada correctamente (3.2 MB liberados)"
  d["optimize_database"] = "Base de datos optimizada correctamente - índices reconstruidos"
  d["check_database_integrity"] = "ok"
  d["get_migration_status"] = [
    { version: 1, appliedAt: "2025-01-01T00:00:00Z" },
    { version: 2, appliedAt: "2025-02-15T00:00:00Z" },
    { version: 3, appliedAt: "2025-04-01T00:00:00Z" },
    { version: 4, appliedAt: "2025-06-15T00:00:00Z" },
    { version: 5, appliedAt: "2025-09-01T00:00:00Z" },
    { version: 6, appliedAt: "2025-11-15T00:00:00Z" },
    { version: 7, appliedAt: "2026-01-15T00:00:00Z" },
    { version: 8, appliedAt: "2026-03-01T00:00:00Z" },
    { version: 9, appliedAt: "2026-05-15T00:00:00Z" },
    { version: 10, appliedAt: "2026-07-01T00:00:00Z" },
    { version: 11, appliedAt: "2026-07-20T00:00:00Z" },
    { version: 12, appliedAt: "2026-07-28T00:00:00Z" },
  ]
  d["reindex_database"] = "Índices reindexados correctamente (12 índices)"

  // --- Diagnostics ---
  d["run_diagnostics"] = () => [
    { name: "Conexión a Base de Datos", status: "passed", message: "Conexión exitosa a SQLite", details: "Latencia: 2ms" },
    { name: "Integridad de Base de Datos", status: "passed", message: "Integridad verificada correctamente" },
    { name: "Sistema de Archivos", status: "passed", message: "Espacio en disco suficiente", details: "Libre: 45.2 GB de 120 GB" },
    { name: "Memoria RAM", status: "passed", message: "Memoria suficiente disponible", details: "Libre: 4.2 GB de 8 GB" },
    { name: "Impresoras Configuradas", status: "warning", message: "1 impresora no disponible", details: "Impresora Láser Oficina no responde" },
    { name: "Backups Recientes", status: "passed", message: "Último backup hace 6 horas" },
    { name: "Permisos de Archivos", status: "passed", message: "Permisos correctos" },
    { name: "Carpeta de Backups", status: "failed", message: "La carpeta de backups tiene 85% de capacidad usada", details: "Se recomienda liberar espacio" },
  ]
  d["get_diagnostic_history"] = (a: any) => [
    { id: 1, reportType: "system", status: "passed", summary: "8 checks pasados, 0 fallos", issuesFound: 0, warnings: 1, createdBy: 1, createdAt: "2026-07-30T06:00:00Z" },
    { id: 2, reportType: "system", status: "warning", summary: "7 checks pasados, 1 advertencia", details: { checks: [{ name: "Backups", status: "warning" }] }, issuesFound: 0, warnings: 1, createdBy: 1, createdAt: "2026-07-29T06:00:00Z" },
    { id: 3, reportType: "system", status: "passed", summary: "8 checks pasados, 0 fallos", issuesFound: 0, warnings: 0, createdBy: 1, createdAt: "2026-07-28T06:00:00Z" },
  ]
  d["save_diagnostic_report"] = undefined
  d["get_diagnostic_summary"] = { healthy: 6, warning: 1, critical: 1, total: 8, last_report: "2026-07-30T06:00:00Z" }
  d["get_system_logs"] = (a: any) => `[2026-07-30 08:00:00] INFO: Sistema iniciado correctamente
[2026-07-30 08:00:01] INFO: Conexión a base de datos establecida
[2026-07-30 08:00:02] INFO: Usuario 'admin' inició sesión
[2026-07-30 08:15:00] INFO: Usuario 'vendedor1' inició sesión
[2026-07-30 08:15:01] WARN: Usuario 'vendedor1' - 1 intento(s) fallido(s) previo(s)
[2026-07-30 10:30:00] INFO: Venta #25 creada por admin ($1,252.80)
[2026-07-30 10:35:00] INFO: Respaldo automático completado
[2026-07-30 11:00:00] INFO: Producto #5 actualizado por admin
[2026-07-30 11:30:00] ERROR: Error al conectar con impresora #2 - Timeout
[2026-07-30 12:00:00] INFO: Diagnóstico del sistema ejecutado - 8 checks`
  d["get_support_package"] = () => "/tmp/support_package_2026-07-30.tar.gz"

  // --- Audit ---
  d["get_audit_events"] = (a: any) => [
    { id: 100, userId: 1, username: "admin", fullName: "Administrador", action: "login", entityType: "session", severity: "info", createdAt: "2026-07-30T08:00:00Z" },
    { id: 99, userId: 2, username: "vendedor1", fullName: "Vendedor Uno", action: "login", entityType: "session", severity: "info", createdAt: "2026-07-30T08:15:00Z" },
    { id: 98, userId: 1, username: "admin", fullName: "Administrador", action: "create_sale", entityType: "sale", entityId: "25", details: "Venta creada por $1,252.80", severity: "info", createdAt: "2026-07-30T10:30:00Z" },
    { id: 97, userId: 1, username: "admin", fullName: "Administrador", action: "update_product", entityType: "product", entityId: "5", details: "Precio actualizado de $95.00 a $105.00", severity: "info", createdAt: "2026-07-30T11:00:00Z" },
    { id: 96, userId: 2, username: "vendedor1", fullName: "Vendedor Uno", action: "failed_login", entityType: "session", details: "Contraseña incorrecta", severity: "warning", createdAt: "2026-07-30T08:10:00Z" },
    { id: 95, userId: 1, username: "admin", fullName: "Administrador", action: "create_user", entityType: "user", entityId: "11", details: "Usuario 'nuevo_user' creado", severity: "info", createdAt: "2026-07-29T14:00:00Z" },
    { id: 94, userId: 1, username: "admin", fullName: "Administrador", action: "delete_backup", entityType: "backup", entityId: "3", details: "Backup antiguo eliminado", severity: "info", createdAt: "2026-07-29T10:00:00Z" },
    { id: 93, userId: 1, username: "admin", fullName: "Administrador", action: "run_diagnostics", entityType: "system", severity: "info", createdAt: "2026-07-29T06:00:00Z" },
    { id: 92, userId: 9, username: "user_inactivo", fullName: "Usuario Inactivo", action: "failed_login", entityType: "session", details: "Cuenta desactivada", severity: "error", createdAt: "2026-07-28T16:00:00Z" },
    { id: 91, userId: 1, username: "admin", fullName: "Administrador", action: "update_setting", entityType: "setting", entityId: "tax_rate", details: "Tasa de impuesto actualizada", severity: "info", createdAt: "2026-07-28T12:00:00Z" },
    { id: 90, userId: 2, username: "vendedor1", fullName: "Vendedor Uno", action: "refund_sale", entityType: "sale", entityId: "12", details: "Devolución procesada por $320.00", severity: "warning", createdAt: "2026-07-28T11:00:00Z" },
    { id: 89, userId: 1, username: "admin", fullName: "Administrador", action: "create_backup", entityType: "backup", entityId: "4", details: "Backup manual creado", severity: "info", createdAt: "2026-07-27T14:00:00Z" },
    { id: 88, userId: 10, username: "user_bloqueado", fullName: "Usuario Bloqueado", action: "failed_login", entityType: "session", details: "Cuenta bloqueada - excedido intentos", severity: "critical", createdAt: "2026-07-27T10:00:00Z" },
    { id: 87, userId: 1, username: "admin", fullName: "Administrador", action: "lock_user", entityType: "user", entityId: "10", details: "Usuario 'user_bloqueado' bloqueado por seguridad", severity: "warning", createdAt: "2026-07-27T10:00:00Z" },
    { id: 86, userId: 1, username: "admin", fullName: "Administrador", action: "update_app", entityType: "system", details: "Actualización a versión 1.2.0 instalada", severity: "info", createdAt: "2026-07-25T02:00:00Z" },
  ]
  d["get_audit_event"] = (a: any) => ({
    id: a?.id ?? 100,
    userId: 1,
    username: "admin",
    fullName: "Administrador",
    action: "login",
    entityType: "session",
    entityId: undefined,
    details: undefined,
    severity: "info",
    createdAt: "2026-07-30T08:00:00Z",
  })
  d["get_audit_summary"] = { total_events: 5200, by_severity: { info: 4200, warning: 650, error: 280, critical: 70 }, by_action: { login: 1200, failed_login: 180, create_sale: 1280, update_product: 320, delete_backup: 45 }, by_entity_type: { session: 1380, sale: 1280, product: 320, user: 85, backup: 45, setting: 60, system: 30 } }
  d["get_audit_timeline"] = (a: any) => {
    const days = a?.days ?? 30
    const data = []
    const now = new Date()
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      data.push({ date: d.toISOString().split("T")[0], count: Math.floor(Math.random() * 100) + 50 })
    }
    return data
  }
  d["get_audit_by_action"] = () => [
    { action: "login", count: 1200, last_occurrence: "2026-07-30T08:00:00Z" },
    { action: "failed_login", count: 180, last_occurrence: "2026-07-30T08:10:00Z" },
    { action: "create_sale", count: 1280, last_occurrence: "2026-07-30T10:30:00Z" },
    { action: "update_product", count: 320, last_occurrence: "2026-07-30T11:00:00Z" },
    { action: "create_backup", count: 45, last_occurrence: "2026-07-27T14:00:00Z" },
    { action: "delete_backup", count: 45, last_occurrence: "2026-07-29T10:00:00Z" },
    { action: "create_user", count: 15, last_occurrence: "2026-07-29T14:00:00Z" },
    { action: "update_setting", count: 60, last_occurrence: "2026-07-28T12:00:00Z" },
    { action: "refund_sale", count: 15, last_occurrence: "2026-07-28T11:00:00Z" },
  ]
  d["get_audit_by_user"] = (a: any) => [
    { user_id: 1, username: "admin", full_name: "Administrador", count: 3200, last_activity: "2026-07-30T11:00:00Z" },
    { user_id: 2, username: "vendedor1", full_name: "Vendedor Uno", count: 1200, last_activity: "2026-07-30T08:15:00Z" },
    { user_id: 10, username: "user_bloqueado", full_name: "Usuario Bloqueado", count: 350, last_activity: "2026-07-27T10:00:00Z" },
    { user_id: 9, username: "user_inactivo", full_name: "Usuario Inactivo", count: 120, last_activity: "2026-07-28T16:00:00Z" },
  ]
  d["export_audit_logs"] = (a: any) => "/tmp/audit_export_2026-07-30.csv"

  // --- System Updates ---
  d["get_system_updates"] = () => [
    { id: 1, version: "1.2.0", releaseDate: "2026-07-25", releaseNotes: "Nuevo módulo de CRM, mejoras en POS", downloadUrl: "https://updates.inventorygear.com/v1.2.0", fileName: "inventory-gear-1.2.0.tar.gz", fileSize: 52428800, checksum: "sha256:a1b2c3d4e5f6...", status: "installed", installedAt: "2026-07-25T02:00:00Z", installedBy: 1, createdAt: "2026-07-20T10:00:00Z" },
    { id: 2, version: "1.1.0", releaseDate: "2026-05-15", releaseNotes: "Reportes mejorados, corrección de errores", downloadUrl: "https://updates.inventorygear.com/v1.1.0", fileName: "inventory-gear-1.1.0.tar.gz", fileSize: 48742400, checksum: "sha256:2b3c4d5e6f7a...", status: "installed", installedAt: "2026-05-15T02:00:00Z", installedBy: 1, createdAt: "2026-05-10T10:00:00Z" },
    { id: 3, version: "1.0.0", releaseDate: "2026-01-15", releaseNotes: "Primera versión estable", downloadUrl: "https://updates.inventorygear.com/v1.0.0", fileName: "inventory-gear-1.0.0.tar.gz", fileSize: 45088768, checksum: "sha256:3c4d5e6f7a8b...", status: "installed", installedAt: "2026-01-15T02:00:00Z", installedBy: 1, createdAt: "2026-01-10T10:00:00Z" },
    { id: 4, version: "1.3.0-beta", releaseDate: "2026-08-01", releaseNotes: "Versión beta - Nuevo dashboard ejecutivo", downloadUrl: "https://updates.inventorygear.com/v1.3.0-beta", fileName: "inventory-gear-1.3.0-beta.tar.gz", fileSize: 55050240, checksum: "sha256:4d5e6f7a8b9c...", status: "available", createdAt: "2026-07-28T10:00:00Z" },
  ]
  d["check_for_updates"] = { current_version: "1.2.0", latest_version: "1.3.0-beta", has_update: true }
  d["get_current_version"] = "1.2.0"
  d["record_update_available"] = undefined
  d["mark_update_installed"] = undefined

  // --- License ---
  d["get_license_info"] = () => ({
    id: 1,
    licenseKey: "INVGEAR-XXXX-XXXX-XXXX-XXXXXXXXXXXX",
    licenseType: "professional",
    companyName: "InventoryGear S.A. de C.V.",
    contactName: "Administrador",
    contactEmail: "admin@inventorygear.com",
    maxUsers: 20,
    maxStores: 3,
    features: JSON.stringify(["pos", "inventory", "purchasing", "crm", "reports", "backups"]),
    activationDate: "2026-01-15",
    expirationDate: "2027-01-15",
    status: "active",
    createdAt: "2026-01-15T00:00:00Z",
    updatedAt: "2026-01-15T00:00:00Z",
  })
  d["save_license"] = (a: any) => ({
    id: 1,
    ...a?.input,
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })
  d["activate_license"] = (a: any) => ({
    id: 1,
    licenseKey: a?.licenseKey ?? "INVGEAR-XXXX-XXXX-XXXX-XXXXXXXXXXXX",
    licenseType: "professional",
    companyName: "InventoryGear S.A. de C.V.",
    maxUsers: 20,
    maxStores: 3,
    features: JSON.stringify(["pos", "inventory", "purchasing", "crm", "reports", "backups"]),
    activationDate: new Date().toISOString(),
    status: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })
  d["deactivate_license"] = undefined
  d["validate_license"] = { valid: true, status: "active", expiration_date: "2027-01-15", expired: false }

  // --- Maintenance ---
  d["get_maintenance_logs"] = (a: any) => [
    { id: 1, operation: "vacuum", details: "Optimización de base de datos ejecutada", status: "completed", durationMs: 3200, affectedRows: 0, createdBy: 1, createdByName: "System", createdAt: "2026-07-30T02:00:00Z" },
    { id: 2, operation: "reindex", details: "Reindexación de tablas completada", status: "completed", durationMs: 1800, affectedRows: 0, createdBy: 1, createdByName: "System", createdAt: "2026-07-30T02:05:00Z" },
    { id: 3, operation: "clear_audit_logs", details: "Limpieza de logs de auditoría anteriores a 90 días", status: "completed", durationMs: 500, affectedRows: 1200, createdBy: 1, createdByName: "Administrador", createdAt: "2026-07-28T10:00:00Z" },
    { id: 4, operation: "backup_cleanup", details: "Limpieza de backups antiguos (retención: 30 días)", status: "completed", durationMs: 200, affectedRows: 5, createdBy: 1, createdByName: "System", createdAt: "2026-07-28T02:00:00Z" },
    { id: 5, operation: "integrity_check", details: "Verificación de integridad de base de datos", status: "completed", durationMs: 4500, affectedRows: 0, createdBy: 1, createdByName: "System", createdAt: "2026-07-28T02:10:00Z" },
  ]
  d["run_maintenance"] = (a: any) => ({
    operation: a?.operation,
    status: "completed",
    details: `Operación '${a?.operation}' ejecutada correctamente`,
    duration_ms: Math.floor(Math.random() * 3000) + 500,
    affected_rows: a?.operation === "clear_audit_logs" ? Math.floor(Math.random() * 1000) + 100 : 0,
  })
  d["clear_audit_logs"] = (a: any) => Math.floor(Math.random() * 500) + 50

  // --- Storage / System Info ---
  d["get_storage_info"] = {
    database_size_bytes: 13418496,
    database_size_mb: "12.8 MB",
    backup_count: 45,
    backup_total_size_bytes: 570425344,
    backup_total_size_mb: "544 MB",
    audit_log_count: 5200,
    log_size_bytes: 2097152,
    log_size_mb: "2.0 MB",
  }
  d["get_system_info"] = {
    app_version: "1.2.0",
    db_version: 12,
    operating_system: "Linux 6.8.0-arch-1 x86_64",
    architecture: "x86_64",
    hostname: "inventory-server",
    timestamp: new Date().toISOString(),
  }

  return d
}
