import { describe, it, expect } from "vitest"
import { buildPrintConfig, isThermalPaper, paperWidth, paperSizeForKind } from "@/lib/print"
import type { AdminAppSetting } from "@/types"

function setting(key: string, value: string): AdminAppSetting {
  return {
    id: 0,
    category: "general",
    key,
    value,
    settingType: "string",
    isSystem: false,
    sortOrder: 0,
    createdAt: "",
    updatedAt: "",
  }
}

describe("buildPrintConfig", () => {
  it("maps store, currency, flags and printer settings", () => {
    const config = buildPrintConfig([
      setting("business_name", "Auto Parts SA"),
      setting("store_name", "Inventory Gear"),
      setting("address_line1", "Av. Central 123"),
      setting("address_line2", "Local 4"),
      setting("phone", "555-1234"),
      setting("tax_id", "RFC-ABC"),
      setting("currency", "MXN"),
      setting("receipt_footer", "Thank you!"),
      setting("receipt_show_tax_breakdown", "true"),
      setting("receipt_show_barcode", "false"),
      setting("receipt_show_customer_info", "true"),
      setting("receipt_printer", "Thermal A"),
      setting("paper_size_default", "58mm"),
    ])

    expect(config.store.name).toBe("Auto Parts SA")
    expect(config.store.address).toBe("Av. Central 123, Local 4")
    expect(config.store.phone).toBe("555-1234")
    expect(config.store.taxId).toBe("RFC-ABC")
    expect(config.currency).toBe("MXN")
    expect(config.footer).toBe("Thank you!")
    expect(config.showTaxBreakdown).toBe(true)
    expect(config.showBarcode).toBe(false)
    expect(config.showCustomerInfo).toBe(true)
    expect(config.receiptPrinter).toBe("Thermal A")
    expect(config.paperSizeDefault).toBe("58mm")
  })

  it("falls back to store_name and USD defaults", () => {
    const config = buildPrintConfig([setting("store_name", "Inventory Gear")])
    expect(config.store.name).toBe("Inventory Gear")
    expect(config.store.address).toBe("")
    expect(config.currency).toBe("USD")
    expect(config.paperSizeDefault).toBe("80mm")
    expect(config.showTaxBreakdown).toBe(false)
  })

  it("handles empty settings array", () => {
    const config = buildPrintConfig([])
    expect(config.store.name).toBeUndefined()
    expect(config.currency).toBe("USD")
  })
})

describe("paper size helpers", () => {
  it("detects thermal paper sizes case-insensitively", () => {
    expect(isThermalPaper("80mm")).toBe(true)
    expect(isThermalPaper("58mm")).toBe(true)
    expect(isThermalPaper("A4")).toBe(false)
    expect(isThermalPaper("letter")).toBe(false)
    expect(isThermalPaper("")).toBe(false)
  })

  it("maps paper sizes to physical widths", () => {
    expect(paperWidth("80mm")).toBe("80mm")
    expect(paperWidth("58mm")).toBe("58mm")
    expect(paperWidth("A4")).toBe("210mm")
    expect(paperWidth("a4")).toBe("210mm")
    expect(paperWidth("letter")).toBe("215.9mm")
    expect(paperWidth("unknown")).toBe("80mm")
  })

  it("resolves a kind-specific paper size when default is not thermal", () => {
    const config = buildPrintConfig([setting("paper_size_default", "letter")])
    expect(paperSizeForKind(config, "receipt")).toBe("80mm")
    expect(paperSizeForKind(config, "quote")).toBe("letter")
    expect(paperSizeForKind(config, "invoice")).toBe("letter")
  })

  it("keeps a thermal default for all kinds", () => {
    const config = buildPrintConfig([setting("paper_size_default", "80mm")])
    expect(paperSizeForKind(config, "quote")).toBe("80mm")
    expect(paperSizeForKind(config, "invoice")).toBe("80mm")
  })
})
