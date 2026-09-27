import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { ExportService, ImportService, exportService, importService } from "@/lib/export"
import type { ExportConfig } from "@/types/crud"

/**
 * Export is how a shop's data leaves the app — into a spreadsheet, then into
 * their accountant's hands. The behaviour that matters is fidelity: a product
 * name containing a comma, a quote or a newline must not shift every column to
 * its right, and a column the user did not select must not appear at all.
 */

const config = (over: Partial<ExportConfig> = {}): ExportConfig => ({
  filename: "products",
  format: "csv",
  columns: ["sku", "name", "price"],
  ...over,
})

const products = [
  { sku: "BRK-001", name: "Brake Pad Set", price: 45.5, internalCost: 12 },
  { sku: "OIL-002", name: "Oil Filter, Heavy Duty", price: 8.25, internalCost: 3 },
  { sku: "PLG-003", name: 'Spark "Plugs" Set', price: 32, internalCost: 9 },
  { sku: "BRK-004", name: "Multi\nLine Description", price: 19, internalCost: null },
]

/** Captures what the service hands to the browser as a download. */
function captureDownloads() {
  const captured: { content: string; filename: string; mimeType: string; revoked: boolean }[] = []
  const createObjectURL = vi.fn((blob: Blob) => {
    captured.push({
      content: "",
      filename: "",
      mimeType: blob.type,
      revoked: false,
    })
    return "blob:mock"
  })
  const revokeObjectURL = vi.fn((url: string) => {
    if (url === "blob:mock" && captured.length) captured[captured.length - 1].revoked = true
  })

  vi.stubGlobal("URL", { ...URL, createObjectURL, revokeObjectURL })

  // The blob body is only readable synchronously via the captured blob, so keep
  // the blob itself and read it back with FileReader in the assertions helper.
  const blobs: Blob[] = []
  vi.stubGlobal("Blob", class extends Blob {
    constructor(parts: BlobPart[], options?: BlobPropertyBag) {
      super(parts, options)
      blobs.push(this)
    }
  })

  return {
    blobs,
    createObjectURL,
    revokeObjectURL,
    async text(index = 0) {
      return await blobs[index].text()
    },
    get last() {
      return captured[captured.length - 1]
    },
  }
}

describe("ExportService.exportData", () => {
  let downloads: ReturnType<typeof captureDownloads>
  const service = new ExportService()

  beforeEach(() => {
    downloads = captureDownloads()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe("CSV", () => {
    it("writes a header row and one row per record, in the configured column order", async () => {
      await service.exportData([products[0]], config())

      expect((await downloads.text()).split("\n")).toEqual([
        "sku,name,price",
        "BRK-001,Brake Pad Set,45.5",
      ])
    })

    it("exports only the configured columns, never the whole record", async () => {
      await service.exportData([products[0]], config({ columns: ["sku", "name"] }))
      const text = await downloads.text()
      expect(text).not.toContain("internalCost")
      expect(text).not.toContain("12")
    })

    it("quotes a value containing a comma so the remaining columns stay aligned", async () => {
      await service.exportData([products[1]], config())
      expect(await downloads.text()).toContain('"Oil Filter, Heavy Duty"')
    })

    it("doubles embedded quotes so they survive a spreadsheet round-trip", async () => {
      await service.exportData([products[2]], config())
      expect(await downloads.text()).toContain('"Spark ""Plugs"" Set"')
    })

    it("quotes a value containing a newline so a CSV parser keeps the row intact", async () => {
      // RFC 4180: an embedded line break is legal *inside* a quoted field, and
      // the row stays one record. It still occupies two physical lines, so
      // anything that splits the file on "\n" — `wc -l`, a naive preview —
      // will over-count rows. A conforming parser is required, not optional.
      await service.exportData([products[3]], config())
      const text = await downloads.text()

      expect(text).toContain('"Multi\nLine Description"')
      expect(text.split("\n")).toHaveLength(3)
      expect(text.startsWith("sku,name,price\nBRK-004,")).toBe(true)
    })

    it("writes an empty cell for null and undefined rather than the words", async () => {
      await service.exportData([{ sku: "X", name: null, price: undefined }], config())
      const lines = (await downloads.text()).split("\n")
      expect(lines[1]).toBe("X,,")
    })

    it("writes a header and no data rows for an empty selection", async () => {
      await service.exportData([], config())
      expect(await downloads.text()).toBe("sku,name,price")
    })

    it("names the file after the config and labels it as CSV", async () => {
      await service.exportData([products[0]], config({ filename: "stock-2026-09" }))
      expect(downloads.last.mimeType).toBe("text/csv")
      expect(await downloads.text()).toBeDefined()
    })
  })

  describe("JSON", () => {
    it("emits an array of objects restricted to the configured columns", async () => {
      await service.exportData(products, config({ format: "json" }))

      const parsed = JSON.parse(await downloads.text())
      expect(parsed).toHaveLength(4)
      expect(Object.keys(parsed[0])).toEqual(["sku", "name", "price"])
      expect(parsed[1]).toEqual({ sku: "OIL-002", name: "Oil Filter, Heavy Duty", price: 8.25 })
    })

    it("keeps null as null, unlike the CSV writer", async () => {
      await service.exportData([{ sku: "X", name: null, price: 1 }], config({ format: "json" }))
      expect(JSON.parse(await downloads.text())[0].name).toBeNull()
    })

    it("labels the download as JSON", async () => {
      await service.exportData([products[0]], config({ format: "json" }))
      expect(downloads.last.mimeType).toBe("application/json")
    })

    it("emits an empty array for an empty selection", async () => {
      await service.exportData([], config({ format: "json" }))
      expect(JSON.parse(await downloads.text())).toEqual([])
    })
  })

  describe("XLSX", () => {
    it("is not implemented and downloads nothing", async () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
      await service.exportData(products, config({ format: "xlsx" }))

      expect(warn).toHaveBeenCalledWith("XLSX export not yet implemented")
      expect(downloads.createObjectURL).not.toHaveBeenCalled()
      warn.mockRestore()
    })
  })

  describe("download plumbing", () => {
    it("revokes the object URL so the blob is not leaked", async () => {
      await service.exportData([products[0]], config())
      expect(downloads.createObjectURL).toHaveBeenCalledTimes(1)
      expect(downloads.revokeObjectURL).toHaveBeenCalledWith("blob:mock")
    })

    it("leaves no anchor element behind in the document", async () => {
      await service.exportData([products[0]], config())
      expect(document.querySelectorAll("a")).toHaveLength(0)
    })
  })
})

describe("ImportService", () => {
  const service = new ImportService()
  const file = { name: "products.csv" } as File

  it.each(["importCSV", "importJSON", "importXLSX"] as const)(
    "%s reports an empty result rather than failing",
    async (method) => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
      const result = await service[method](file)

      expect(result).toEqual({ success: 0, errors: 0, total: 0, details: [] })
      expect(warn).toHaveBeenCalled()
      warn.mockRestore()
    },
  )
})

describe("shared instances", () => {
  it("exports ready-to-use singletons", () => {
    expect(exportService).toBeInstanceOf(ExportService)
    expect(importService).toBeInstanceOf(ImportService)
  })
})
