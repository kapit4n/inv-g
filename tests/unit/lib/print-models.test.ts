import { describe, it, expect } from "vitest"
import {
  buildSaleReceiptModel,
  buildQuoteDocumentModel,
  buildCloseoutDocumentModel,
  formatTotalValue,
} from "@/lib/print"
import type { PrintConfig, Sale, SaleItem, SalePayment, Quote, QuoteItem, DailyCloseout } from "@/lib/print"

function makeConfig(overrides: Partial<PrintConfig> = {}): PrintConfig {
  return {
    store: { name: "Auto Parts SA", currency: "USD" },
    currency: "USD",
    footer: "Thank you!",
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

function makeSale(overrides: Partial<Sale> = {}): Sale {
  return {
    id: 1,
    saleNumber: "SALE-0001",
    receiptNumber: "RCP-00001",
    subtotal: 100,
    taxRate: 0.16,
    taxAmount: 16,
    discountAmount: 5,
    total: 111,
    paymentMethod: "cash",
    paymentStatus: "paid",
    customerName: "Juan Pérez",
    createdAt: "2026-08-13T10:00:00Z",
    updatedAt: "2026-08-13T10:00:00Z",
    ...overrides,
  }
}

function makeItems(): SaleItem[] {
  return [
    { id: 1, saleId: 1, productId: 1, quantity: 2, unitPrice: 30, discount: 0, total: 60, productName: "Brake Pads", productSku: "BRK-100" },
    { id: 2, saleId: 1, productId: 2, quantity: 1, unitPrice: 50, discount: 5, total: 45, productName: "Oil Filter", productSku: "OIL-200" },
  ]
}

function makePayments(): SalePayment[] {
  return [
    { id: 1, saleId: 1, method: "cash", amount: 111, reference: undefined, changeAmount: 10, createdAt: "2026-08-13T10:00:00Z" },
  ]
}

const labels = {
  title: "Receipt",
  subtotal: "Subtotal",
  tax: "Tax",
  discount: "Discount",
  total: "Total",
  customer: "Customer",
  methods: { cash: "Cash", card: "Card", transfer: "Transfer" },
}

describe("buildSaleReceiptModel", () => {
  it("shapes a thermal receipt with totals, items, payments and store", () => {
    const doc = buildSaleReceiptModel(makeSale(), makeItems(), makePayments(), makeConfig(), labels)

    expect(doc.kind).toBe("receipt")
    expect(doc.paperSize).toBe("80mm")
    expect(doc.documentNumber).toBe("SALE-0001")
    expect(doc.secondaryNumber).toBe("RCP-00001")
    expect(doc.title).toBe("Receipt")
    expect(doc.store.currency).toBe("USD")

    expect(doc.lineItems).toHaveLength(2)
    expect(doc.lineItems[0]).toMatchObject({ name: "Brake Pads", quantity: 2, unitPrice: 30, total: 60 })

    const totals = doc.totals
    expect(totals[0]).toMatchObject({ label: "Subtotal", value: 100 })
    expect(totals[1]).toMatchObject({ label: "Tax", value: 16 })
    expect(totals[2]).toMatchObject({ label: "Discount", value: -5 })
    expect(totals[3]).toMatchObject({ label: "Total", value: 111, bold: true })

    expect(doc.payments).toEqual([{ method: "Cash", amount: 111, change: 10 }])
    expect(doc.metaLines).toEqual([{ label: "Customer", value: "Juan Pérez" }])
    expect(doc.footer).toBe("Thank you!")
  })

  it("omits tax row when breakdown is hidden and tax is zero", () => {
    const doc = buildSaleReceiptModel(
      makeSale({ taxAmount: 0, discountAmount: 0 }),
      makeItems(),
      [],
      makeConfig({ showTaxBreakdown: false }),
      labels,
    )
    expect(doc.totals.find((t) => t.label === "Tax")).toBeUndefined()
    expect(doc.totals.map((t) => t.label)).toEqual(["Subtotal", "Total"])
  })

  it("omits customer meta when showCustomerInfo is disabled", () => {
    const doc = buildSaleReceiptModel(
      makeSale(),
      [],
      [],
      makeConfig({ showCustomerInfo: false }),
      labels,
    )
    expect(doc.metaLines).toEqual([])
  })

  it("falls back to product id when product name is missing", () => {
    const items = [{ ...makeItems()[0], productName: undefined, productId: 99 }]
    const doc = buildSaleReceiptModel(makeSale(), items, [], makeConfig(), labels)
    expect(doc.lineItems[0].name).toBe("#99")
  })
})

describe("buildQuoteDocumentModel", () => {
  const quote: Quote = {
    id: 7,
    quoteNumber: "QTE-0007",
    subtotal: 200,
    taxRate: 0.16,
    taxAmount: 32,
    discountAmount: 0,
    total: 232,
    status: "sent",
    validUntil: "2026-09-13T00:00:00Z",
    notes: "Freight included",
    termsConditions: "Net 30",
    customerName: "Taller Central",
    createdAt: "2026-08-13T10:00:00Z",
    updatedAt: "2026-08-13T10:00:00Z",
  }
  const items: QuoteItem[] = [
    { id: 1, quoteId: 7, productId: 1, quantity: 4, unitPrice: 50, discount: 0, total: 200, productName: "Shock Absorber", productSku: "SHP-300" },
  ]

  it("builds an A4 quote document", () => {
    const doc = buildQuoteDocumentModel(quote, items, makeConfig({ paperSizeDefault: "letter" }), {
      ...labels,
      validUntil: "Valid Until",
    })

    expect(doc.kind).toBe("quote")
    expect(doc.paperSize).toBe("letter")
    expect(doc.documentNumber).toBe("QTE-0007")
    expect(doc.lineItems[0].name).toBe("Shock Absorber")
    expect(doc.totals[doc.totals.length - 1]).toMatchObject({ label: "Total", value: 232, bold: true })
    expect(doc.metaLines).toContainEqual({ label: "Customer", value: "Taller Central" })
    expect(doc.metaLines.some((m) => m.label === "Valid Until")).toBe(true)
    expect(doc.notes).toBe("Freight included\n\nNet 30")
  })

  it("drops the tax row when hidden and zero", () => {
    const doc = buildQuoteDocumentModel(
      { ...quote, taxAmount: 0 },
      items,
      makeConfig({ showTaxBreakdown: false }),
      { ...labels, validUntil: "Valid Until" },
    )
    expect(doc.totals.find((t) => t.label === "Tax")).toBeUndefined()
  })
})

describe("buildCloseoutDocumentModel", () => {
  const closeout: DailyCloseout = {
    totalSales: 12,
    totalRevenue: 1000,
    totalTax: 160,
    totalDiscount: 40,
    cashTotal: 600,
    cardTotal: 300,
    transferTotal: 100,
    cashCount: 7,
    cardCount: 3,
    transferCount: 2,
    refundedCount: 1,
    refundedTotal: 50,
    netRevenue: 950,
    date: "2026-08-13",
  }

  it("builds a closeout report with counts and net bold", () => {
    const doc = buildCloseoutDocumentModel(closeout, makeConfig(), {
      title: "Daily Closeout",
      totalSales: "Sales",
      totalRevenue: "Revenue",
      totalTax: "Tax",
      totalDiscount: "Discount",
      cash: "Cash",
      card: "Card",
      transfer: "Transfer",
      refunds: "Refunds",
      netRevenue: "Net",
    })

    expect(doc.kind).toBe("report")
    expect(doc.lineItems).toEqual([])
    const sales = doc.totals.find((t) => t.label === "Sales")
    expect(sales).toMatchObject({ value: 12, format: "number" })
    expect(doc.totals.find((t) => t.label === "Refunds")).toMatchObject({ value: -50 })
    expect(doc.totals[doc.totals.length - 1]).toMatchObject({ label: "Net", value: 950, bold: true })
  })

  it("skips refunds row when there are none", () => {
    const doc = buildCloseoutDocumentModel(
      { ...closeout, refundedTotal: 0 },
      makeConfig(),
      { title: "Daily Closeout", totalSales: "Sales", totalRevenue: "Revenue", totalTax: "Tax", totalDiscount: "Discount", cash: "Cash", card: "Card", transfer: "Transfer", refunds: "Refunds", netRevenue: "Net" },
    )
    expect(doc.totals.find((t) => t.label === "Refunds")).toBeUndefined()
  })
})

describe("formatTotalValue", () => {
  it("formats currency rows and raw number rows", () => {
    expect(formatTotalValue({ value: 42, format: "currency" }, "USD")).toBe("$42.00")
    expect(formatTotalValue({ value: 42, format: "number" }, "USD")).toBe("42")
    expect(formatTotalValue({ value: 42 }, "USD")).toBe("$42.00")
  })
})
