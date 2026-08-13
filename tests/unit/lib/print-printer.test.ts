import { describe, it, expect } from "vitest"
import { activePrinters, sortPrinters, resolveDefaultPrinter, printerLabel } from "@/lib/print"
import type { PrinterSetting } from "@/types"
import type { PrintConfig } from "@/lib/print"

function printer(overrides: Partial<PrinterSetting>): PrinterSetting {
  return {
    id: 1,
    name: "Printer",
    printerType: "receipt",
    interfaceType: "usb",
    paperSize: "80mm",
    margins: "{}",
    copies: 1,
    orientation: "portrait",
    isDefault: false,
    isActive: true,
    config: "{}",
    createdAt: "",
    updatedAt: "",
    ...overrides,
  }
}

function makeConfig(overrides: Partial<PrintConfig> = {}): PrintConfig {
  return {
    store: {},
    currency: "USD",
    showTaxBreakdown: true,
    showBarcode: false,
    showCustomerInfo: true,
    defaultPrinter: "",
    receiptPrinter: "",
    invoicePrinter: "",
    labelPrinter: "",
    paperSizeDefault: "80mm",
    ...overrides,
  }
}

describe("sortPrinters", () => {
  it("puts the default printer first, then alphabetical", () => {
    const printers = [
      printer({ id: 1, name: "Zebra", isDefault: false }),
      printer({ id: 2, name: "Alpha", isDefault: true }),
      printer({ id: 3, name: "Beta", isDefault: false }),
    ]
    const sorted = sortPrinters(printers)
    expect(sorted.map((p) => p.id)).toEqual([2, 3, 1])
  })

  it("does not mutate the input array", () => {
    const printers = [printer({ id: 1, name: "B" }), printer({ id: 2, name: "A" })]
    sortPrinters(printers)
    expect(printers[0].name).toBe("B")
  })
})

describe("activePrinters", () => {
  it("filters out inactive printers", () => {
    const printers = [
      printer({ id: 1, isActive: true }),
      printer({ id: 2, isActive: false }),
    ]
    expect(activePrinters(printers)).toHaveLength(1)
  })
})

describe("resolveDefaultPrinter", () => {
  it("prefers the configured printer for the document kind", () => {
    const printers = [
      printer({ id: 1, name: "Thermal A", isDefault: false }),
      printer({ id: 2, name: "Other", isDefault: true }),
    ]
    const config = makeConfig({ receiptPrinter: "Thermal A" })
    expect(resolveDefaultPrinter(printers, config, "receipt")?.id).toBe(1)
  })

  it("falls back to the default printer flag", () => {
    const printers = [
      printer({ id: 1, name: "Thermal A" }),
      printer({ id: 2, name: "Other", isDefault: true }),
    ]
    const config = makeConfig()
    expect(resolveDefaultPrinter(printers, config, "receipt")?.id).toBe(2)
  })

  it("falls back to the first active printer", () => {
    const printers = [printer({ id: 3, name: "First" })]
    const config = makeConfig({ receiptPrinter: "missing" })
    expect(resolveDefaultPrinter(printers, config, "receipt")?.id).toBe(3)
  })

  it("uses the invoice printer for invoice documents", () => {
    const printers = [
      printer({ id: 1, name: "Inkjet", printerType: "invoice" }),
      printer({ id: 2, name: "Thermal A" }),
    ]
    const config = makeConfig({ invoicePrinter: "Inkjet" })
    expect(resolveDefaultPrinter(printers, config, "invoice")?.id).toBe(1)
  })

  it("returns undefined when no active printers exist", () => {
    const printers = [printer({ id: 1, isActive: false })]
    expect(resolveDefaultPrinter(printers, makeConfig(), "receipt")).toBeUndefined()
  })
})

describe("printerLabel", () => {
  it("includes paper size when present", () => {
    expect(printerLabel(printer({ name: "Zebra", paperSize: "58mm" }))).toBe("Zebra (58mm)")
  })
})
