import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, fireEvent, waitFor } from "@tests/helpers/render"
import { setupI18n } from "@/i18n"
import { ImportExportPage } from "@/features/inventory/pages/import-export-page"
import { useAuthStore } from "@/stores"
import {
  exportProductsXlsx, exportProductsTemplate, previewProductImport,
  executeProductImport, getImportHistory,
} from "@/lib/tauri"
import { open, save } from "@tauri-apps/plugin-dialog"
import type { ImportPreview, ImportResult } from "@/types/inventory"

vi.mock("@/lib/tauri", () => ({
  exportProductsXlsx: vi.fn(),
  exportProductsTemplate: vi.fn(),
  previewProductImport: vi.fn(),
  executeProductImport: vi.fn(),
  getImportHistory: vi.fn(),
}))

vi.mock("@tauri-apps/plugin-dialog", () => ({
  open: vi.fn(),
  save: vi.fn(),
}))

setupI18n("en")

const user = {
  id: 1, username: "admin", email: "admin@test.com", fullName: "Admin User",
  roleId: 1, roleName: "Admin", isActive: true, createdAt: "2025-01-01T00:00:00Z",
}

const preview: ImportPreview = {
  filename: "catalog.xlsx",
  storeId: null,
  mode: "append",
  totalRows: 2,
  insertCount: 1,
  updateCount: 0,
  skipCount: 1,
  errorCount: 0,
  stockIncreaseCount: 1,
  stockDecreaseCount: 0,
  stockUnchangedCount: 0,
  rows: [
    {
      rowNumber: 2, sku: "860067", name: "MUÑON DIREC. TOY COROLLA/IPSU 84/95",
      action: "skip", reason: "Already exists", errors: [], currentStock: 4, newStock: 4, stockChange: 0,
    },
    {
      rowNumber: 3, sku: "NUEVO99", name: "NEW PART",
      action: "insert", reason: null, errors: [], currentStock: null, newStock: 10, stockChange: 10,
    },
  ],
  errorRows: [],
  rowsTruncated: false,
}

const importResult: ImportResult = {
  ok: true,
  filename: "catalog.xlsx",
  mode: "append",
  totalRows: 2,
  inserted: 1,
  updated: 0,
  skipped: 1,
  errors: 0,
  stockIncreased: 1,
  stockDecreased: 0,
  errorRows: [],
  importId: 1,
  message: null,
}

beforeEach(() => {
  vi.clearAllMocks()
  useAuthStore.getState().clearSession()
  ;(getImportHistory as ReturnType<typeof vi.fn>).mockResolvedValue([])
  ;(open as ReturnType<typeof vi.fn>).mockResolvedValue("/tmp/catalog.xlsx")
  ;(save as ReturnType<typeof vi.fn>).mockResolvedValue("/tmp/catalog.xlsx")
})

describe("ImportExportPage", () => {
  it("shows a permission message when the user lacks import and export permissions", () => {
    useAuthStore.getState().setSession(user, "token", ["inventory.view"])
    render(<ImportExportPage />)
    expect(screen.getByText(/You do not have permission to import or export inventory/i)).toBeInTheDocument()
    expect(screen.queryByText("Export inventory")).not.toBeInTheDocument()
  })

  it("renders the export card when the user can export and downloads the file", async () => {
    useAuthStore.getState().setSession(user, "token", ["inventory.export"])
    ;(exportProductsXlsx as ReturnType<typeof vi.fn>).mockResolvedValue({ path: "/tmp/out.xlsx", filename: "out.xlsx", productCount: 5 })

    render(<ImportExportPage />)

    expect(screen.getAllByText("Export inventory").length).toBeGreaterThan(0)
    expect(screen.queryByText("Import inventory")).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: /export inventory/i }))

    await waitFor(() => {
      expect(save).toHaveBeenCalled()
      expect(exportProductsXlsx).toHaveBeenCalledWith(expect.objectContaining({ scope: "active", createdBy: 1 }), expect.anything())
    })
  })

  it("downloads the template file", async () => {
    useAuthStore.getState().setSession(user, "token", ["inventory.export"])
    ;(save as ReturnType<typeof vi.fn>).mockResolvedValueOnce("/tmp/tpl.xlsx")
    ;(exportProductsTemplate as ReturnType<typeof vi.fn>).mockResolvedValue({ path: "/tmp/tpl.xlsx", filename: "tpl.xlsx", productCount: 0 })

    render(<ImportExportPage />)

    fireEvent.click(screen.getByRole("button", { name: /download template/i }))

    await waitFor(() => {
      expect(save).toHaveBeenCalled()
      expect(exportProductsTemplate).toHaveBeenCalledWith(expect.objectContaining({ path: "/tmp/tpl.xlsx" }), expect.anything())
    })
  })

  it("runs a preview of the selected file and imports it", async () => {
    useAuthStore.getState().setSession(user, "token", ["inventory.import"])
    ;(previewProductImport as ReturnType<typeof vi.fn>).mockResolvedValue(preview)
    ;(executeProductImport as ReturnType<typeof vi.fn>).mockResolvedValue(importResult)

    render(<ImportExportPage />)

    fireEvent.click(screen.getByRole("button", { name: /select file/i }))
    await screen.findByText("catalog.xlsx")

    fireEvent.click(screen.getByRole("button", { name: /preview/i }))

    await waitFor(() => {
      expect(previewProductImport).toHaveBeenCalledWith(expect.objectContaining({ mode: "append", storeId: null }), expect.anything())
    })
    expect(screen.getAllByText("catalog.xlsx").length).toBeGreaterThan(0)
    expect(screen.getByText("NEW PART")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: /import now/i }))

    await waitFor(() => {
      expect(executeProductImport).toHaveBeenCalledWith(expect.objectContaining({ mode: "append", createdBy: 1 }), expect.anything())
      expect(screen.getByText(/1 created, 0 updated, 1 skipped/i)).toBeInTheDocument()
    })
  })

  it("disables the import button when validation errors exist", async () => {
    useAuthStore.getState().setSession(user, "token", ["inventory.import"])
    const withErrors: ImportPreview = {
      ...preview,
      errorCount: 1,
      errorRows: [{ rowNumber: 5, sku: "BAD-1", message: "Category 'Direccion' not found" }],
    }
    ;(previewProductImport as ReturnType<typeof vi.fn>).mockResolvedValue(withErrors)

    render(<ImportExportPage />)

    fireEvent.click(screen.getByRole("button", { name: /select file/i }))
    await screen.findByText("catalog.xlsx")
    fireEvent.click(screen.getByRole("button", { name: /preview/i }))

    await waitFor(() => {
      expect(screen.getByText(/Category 'Direccion' not found/i)).toBeInTheDocument()
    })

    expect(screen.getByRole("button", { name: /import now/i })).toBeDisabled()
  })

  it("reflects the selected mode in the preview call", async () => {
    useAuthStore.getState().setSession(user, "token", ["inventory.import"])
    ;(previewProductImport as ReturnType<typeof vi.fn>).mockResolvedValue(preview)

    render(<ImportExportPage />)

    fireEvent.click(screen.getByRole("button", { name: /select file/i }))
    await screen.findByText("catalog.xlsx")

    fireEvent.click(screen.getByText("Append (skips existing products)"))
    fireEvent.click(await screen.findByText("Update (replaces data and stock of existing products)"))

    fireEvent.click(screen.getByRole("button", { name: /preview/i }))

    await waitFor(() => {
      expect(previewProductImport).toHaveBeenCalledWith(expect.objectContaining({ mode: "update" }), expect.anything())
    })
  })
})