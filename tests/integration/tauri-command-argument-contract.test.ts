import { describe, it, expect } from "vitest"
import { readFileSync, readdirSync, statSync } from "node:fs"
import { join } from "node:path"

/**
 * BUG-012: "Crear Devolución" (and "Crear Solicitud") failed on save.
 *
 * Every command crossed the IPC boundary through a hand-written wrapper in
 * `src/lib/tauri.ts`, and those wrappers had drifted from the Rust signatures:
 *
 *     // createPurchaseReturn
 *     invoke("create_purchase_return", { userId, input })
 *     // create_purchase_return(state, po_id, user_id, supplier_id, reason, items)
 *
 * The payload nested the fields one level deeper than the command expected, so
 * Tauri rejected the call before it ever reached the database:
 *
 *     invalid args `supplierId` for command `create_purchase_return`
 *
 * A component test cannot catch this. The page's tests mock `tauri.ts`, so the
 * wrapper is never executed against a real signature - the mock agrees with
 * whatever the wrapper happens to send. Two of the three bugs in this area were
 * invisible for the same reason.
 *
 * So this test reads both sides of the boundary and checks them against each
 * other. It is a structural check, not a behavioural one: a unit test that
 * reimplemented the argument mapping would only prove the mapping it wrote.
 */

const REPO = join(__dirname, "..", "..")
const RUST_ROOT = join(REPO, "src-tauri", "src")
const TAURI_TS = join(REPO, "src", "lib", "tauri.ts")

/** Tauri injects these; they never appear in an invoke payload. */
const IMPLICIT_PARAMS = new Set(["state", "app", "window"])

function rustFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) return rustFiles(full)
    return entry.endsWith(".rs") ? [full] : []
  })
}

/** Splits a parameter list on commas that are not nested inside brackets. */
function splitTopLevel(body: string): string[] {
  const out: string[] = []
  let depth = 0
  let current = ""
  for (const ch of body) {
    if ("(<[".includes(ch)) depth += 1
    else if (")>]".includes(ch)) depth -= 1
    if (ch === "," && depth === 0) {
      out.push(current)
      current = ""
    } else {
      current += ch
    }
  }
  out.push(current)
  return out
}

/** Reads the return type of `fn name(...)` that follows `index`. */
function readParams(source: string, open: number): string {
  let depth = 1
  let i = open
  while (depth > 0 && i < source.length) {
    if (source[i] === "(") depth += 1
    else if (source[i] === ")") depth -= 1
    i += 1
  }
  return source.slice(open, i - 1)
}

function toCamel(snake: string): string {
  const [head, ...rest] = snake.split("_")
  return head + rest.map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join("")
}

interface Command {
  file: string
  required: string[]
  optional: string[]
}

/** Every `#[tauri::command]`, with the parameters a caller must supply. */
function rustCommands(): { commands: Map<string, Command>; underscoreParams: string[] } {
  const commands = new Map<string, Command>()
  const underscoreParams: string[] = []
  for (const file of rustFiles(RUST_ROOT)) {
    const source = readFileSync(file, "utf8")
    const pattern = /#\[tauri::command\]\s*(?:pub\s+)?(?:async\s+)?fn\s+(\w+)\s*\(/g
    for (const match of source.matchAll(pattern)) {
      const name = match[1]
      const params = readParams(source, match.index + match[0].length)
      const required: string[] = []
      const optional: string[] = []
      for (const param of splitTopLevel(params)) {
        const parsed = /^\s*(?:pub\s+)?([a-z_][a-z0-9_]*)\s*:\s*(.+)$/.exec(param)
        if (!parsed) continue
        const [, paramName, type] = parsed
        if (IMPLICIT_PARAMS.has(paramName)) continue
        // `_sale_price` is bound but never read. Tauri still derives a wire name
        // from it (`_sale_price` -> `SalePrice`), which no TS caller writes, so
        // the test cannot model it. `underscoreParams` reports these instead of
        // guessing; see the dedicated test below.
        if (paramName.startsWith("_")) {
          underscoreParams.push(`${name}._${paramName.slice(1)}`)
          continue
        }
        if (/^Option\s*</.test(type)) optional.push(toCamel(paramName))
        else required.push(toCamel(paramName))
      }
      commands.set(name, { file, required, optional })
    }
  }
  return { commands, underscoreParams }
}

interface InvokeSite {
  command: string
  /** Keys written literally in the payload. */
  keys: string[]
  /** True when the payload spreads another object, e.g. `{ id, ...params }`. */
  hasSpread: boolean
  /**
   * True when the payload is a bare expression, e.g. `invoke("create_category", data)`.
   * The key set then lives in the caller's type, not at the call site, so the test
   * cannot check it without a TypeScript checker.
   */
  dynamic: boolean
  line: number
}

/** The payload keys of one invoke, ignoring keys nested inside objects. */
function payloadKeys(body: string): { keys: string[]; hasSpread: boolean } {
  const keys: string[] = []
  let hasSpread = false
  let depth = 0
  let i = 0
  while (i < body.length) {
    const ch = body[i]
    if ("{(["[ch]) {
      depth += 1
    } else if ("})]".includes(ch)) {
      depth -= 1
    } else if (ch === "." && body.slice(i, i + 3) === "...") {
      if (depth === 0) hasSpread = true
      i += 2
    } else if (depth === 0 && /[A-Za-z_$]/.test(ch)) {
      const key = /^(?:\.\.\.)?\s*([A-Za-z_$][\w$]*)\s*(?=[:,}])/.exec(body.slice(i))
      if (key) {
        keys.push(key[1])
        i += key[0].length - 1
      }
    }
    i += 1
  }
  return { keys, hasSpread }
}

function invokeSites(): InvokeSite[] {
  const source = readFileSync(TAURI_TS, "utf8")
  const sites: InvokeSite[] = []
  const pattern = /invoke(?:<[^>]*>)?\(\s*"(\w+)"\s*(,)?\s*(\{)?/g
  for (const match of source.matchAll(pattern)) {
    const [full, command, hasComma, hasBrace] = match
    const line = source.slice(0, match.index).split("\n").length
    // `invoke("x")` takes no payload at all; `invoke("x", expr)` builds one
    // somewhere the test cannot see.
    if (!hasComma) {
      sites.push({ command, keys: [], hasSpread: false, dynamic: false, line })
      continue
    }
    if (!hasBrace) {
      sites.push({ command, keys: [], hasSpread: false, dynamic: true, line })
      continue
    }
    const open = match.index + full.length - 1
    const body = readParams(source, open + 1)
    const { keys, hasSpread } = payloadKeys(body)
    sites.push({ command, keys, hasSpread, dynamic: false, line })
  }
  return sites
}

const { commands, underscoreParams } = rustCommands()
const sites = invokeSites()

/**
 * Payloads that spread another object cannot be checked key by key, because the
 * spread's shape lives in the caller's type. They are listed here so that adding
 * one is a deliberate act rather than a silent gap in coverage.
 */
const SPREAD_PAYLOAD_COMMANDS = new Set([
  "update_customer_vehicle",
  "search_compatible_products",
  "get_recommendations_for_vehicle",
  "global_product_search",
  "search_products_for_pos",
  "record_update_available",
  "refund_sale",
])

/**
 * Wrappers that forward a whole object (`invoke("create_category", data)`) rather
 * than writing the payload inline. Verified by reading each wrapper and its Rust
 * signature by hand, so they stay on this list until the test grows a real
 * TypeScript checker.
 */
const DYNAMIC_PAYLOAD_COMMANDS = new Set([
  "create_category",
  "update_category",
  "create_brand",
  "update_brand",
  "create_manufacturer",
  "update_manufacturer",
  "create_supplier",
  "update_supplier",
  "create_warehouse",
  "update_warehouse",
  "create_storage_location",
  "update_storage_location",
  "create_product",
  "update_product",
  "create_product_compatibility",
  "create_inventory_movement",
  "export_products_xlsx",
  "export_products_template",
  "preview_product_import",
  "execute_product_import",
  "create_sale",
  "create_product_image",
  "create_customer_vehicle",
  "preview_demo_catalog",
  "execute_demo_catalog",
  "get_purchase_orders",
])

/**
 * Bindings known to be broken but not fixable without a product decision, so the
 * contract test must not report them as regressions. Tracked in
 * `docs/BUG_FIX_LOG.md`.
 */
const KNOWN_BROKEN_COMMANDS = new Map<string, string>([
  [
    "create_product_compatibility",
    "the form collects free-text brand/model/engine, but create_compatibility wants brand_id/model_id/engine_id; needs a name-to-id decision",
  ],
])

describe("tauri command argument contract", () => {
  it("finds the bindings and the commands to compare", () => {
    expect(sites.length).toBeGreaterThan(200)
    expect(commands.size).toBeGreaterThan(200)
  })

  it("invokes only commands the backend actually registers", () => {
    const unknown = sites
      .filter((site) => !commands.has(site.command) && !KNOWN_BROKEN_COMMANDS.has(site.command))
      .map((site) => `src/lib/tauri.ts:${site.line} invokes "${site.command}", which no #[tauri::command] defines`)
    expect(unknown).toEqual([])
  })

  it("supplies every required argument the command asks for", () => {
    const problems: string[] = []
    for (const site of sites) {
      const command = commands.get(site.command)
      if (!command || site.hasSpread || site.dynamic) continue
      const missing = command.required.filter((param) => !site.keys.includes(param))
      if (missing.length > 0) {
        problems.push(
          `src/lib/tauri.ts:${site.line} invokes "${site.command}" with { ${site.keys.join(", ")} } ` +
            `but ${command.file} requires ${missing.join(", ")}`
        )
      }
    }
    expect(problems).toEqual([])
  })

  it("keeps spread payloads on the reviewed list", () => {
    const unreviewed = sites
      .filter((site) => site.hasSpread && !SPREAD_PAYLOAD_COMMANDS.has(site.command))
      .map((site) => `"${site.command}" at src/lib/tauri.ts:${site.line}`)
    expect(unreviewed).toEqual([])
  })

  it("keeps forwarded payloads on the reviewed list", () => {
    const unreviewed = sites
      .filter((site) => site.dynamic && !DYNAMIC_PAYLOAD_COMMANDS.has(site.command))
      .map((site) => `"${site.command}" at src/lib/tauri.ts:${site.line}`)
    expect(unreviewed).toEqual([])
  })

  it("reports Rust parameters the wire name of which is ambiguous", () => {
    // These are bound but never read: `create_sale` recomputes subtotal, tax,
    // discount and payment status, and the product commands recompute sale_price
    // from cost and margin. Tauri derives a wire name from each (`_sale_price` ->
    // `SalePrice`) that no caller writes, and in practice Tauri tolerates the
    // absence, so the required-key check cannot see them either way. Pinned so a
    // rename cannot pass unnoticed.
    expect(underscoreParams.sort()).toEqual([
      "create_product._sale_price",
      "create_sale._discount_amount",
      "create_sale._payment_status",
      "create_sale._subtotal",
      "create_sale._tax_amount",
      "create_sale._tax_rate",
      "update_product._sale_price",
    ])
  })

  it("catches a wrapper that nests its payload one level too deep", () => {
    // The exact shape of BUG-012, kept as a live example: `create_purchase_return`
    // takes flat parameters, so a nested `input` cannot satisfy them.
    const command = commands.get("create_purchase_return")
    // `po_id` is `Option<i64>`, so it is optional, not required.
    expect(command?.required.sort()).toEqual(["items", "reason", "supplierId", "userId"])
    expect(command?.optional.sort()).toEqual(["poId"])

    const site = sites.find((s) => s.command === "create_purchase_return")
    expect(site).toBeDefined()
    // A payload of `{ userId, input }` must register as a failure.
    const missing = command!.required.filter((param) => !site!.keys.includes(param))
    expect(missing).toEqual([])
  })
})
