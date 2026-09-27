import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, waitFor } from "@tests/helpers/render"
import { Route, Routes } from "react-router-dom"
import userEvent from "@testing-library/user-event"
import { ProductFormPage } from "@/features/inventory/pages/product-form-page"
import {
  getProduct, createProduct, updateProduct,
  getCategories, getBrands, getManufacturers, getSuppliers,
  getWarehouses, getStorageLocations,
} from "@/lib/tauri"
import { useAppSettingsStore } from "@/stores/app-settings.store"
import { useNotificationStore } from "@/stores/notification.store"
import { setupI18n } from "@/i18n"
import type { Product } from "@/types"

vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: vi.fn() },
}))

/**
 * The product form is where the shop sets the price it will actually charge, so
 * the arithmetic on this screen is business-critical and is duplicated in
 * `src/lib/pricing.ts` (which mirrors `pricing.rs` in the backend).
 *
 * Covered behaviour:
 * - **The suggested price** recomputes from cost and the effective margin, and
 *   the effective margin falls back to the global setting when the product has
 *   no margin of its own.
 * - **A manual price wins** over the suggestion (`editedPrice ?? suggested`).
 * - **An out-of-range margin blocks the save** instead of writing a price the
 *   backend would reject, and the field says why.
 * - **Optional text fields are sent as `undefined`**, not `""`, so the backend
 *   stores NULL rather than an empty string that would defeat a later search.
 */

setupI18n("en")

const product: Product = {
  id: 7, name: "Pastilla de freno", sku: "PB-001", barcode: "8412345678901",
  oemNumber: "OEM-1", internalCode: "INT-1", description: null,
  categoryId: 1, brandId: 2, manufacturerId: 3, supplierId: 4,
  costPrice: 100, salePrice: 130, wholesalePrice: 115, suggestedRetailPrice: 130, taxRate: 21,
  stockQuantity: 5, minStockLevel: 2, maxStockLevel: 20, reorderPoint: 3,
  unit: "unit", weight: null, warehouseId: 1, storageLocationId: null, imageUrl: null,
  profitMarginPct: null, isActive: true, createdAt: "2025-01-01T00:00:00Z",
} as unknown as Product

beforeEach(() => {
  vi.mocked(getProduct).mockResolvedValue(product as never)
  vi.mocked(createProduct).mockResolvedValue({ id: 8 } as never)
  vi.mocked(updateProduct).mockResolvedValue(product as never)
  vi.mocked(getCategories).mockResolvedValue([] as never)
  vi.mocked(getBrands).mockResolvedValue([] as never)
  vi.mocked(getManufacturers).mockResolvedValue([] as never)
  vi.mocked(getSuppliers).mockResolvedValue([] as never)
  vi.mocked(getWarehouses).mockResolvedValue([] as never)
  vi.mocked(getStorageLocations).mockResolvedValue([] as never)
  // Pin the global margin so the arithmetic below is deterministic.
  useAppSettingsStore.setState({
    settings: [{ key: "default_margin_percent", value: "30", valueType: "number", group: "business" } as never],
  })
})

afterEach(() => {
  vi.clearAllMocks()
  useAppSettingsStore.setState({ settings: [] })
  useNotificationStore.getState().clearAll()
})

/**
 * The form is only ever mounted under a route, and it reads the id from
 * `useParams`, so the route has to be declared rather than faked with
 * `history.pushState`.
 */
function renderForm(pattern: string, url: string) {
  window.history.pushState({}, "", url)
  return render(
    <Routes>
      <Route path={pattern} element={<ProductFormPage />} />
    </Routes>,
  )
}

/**
 * The pricing preview renders one row per figure, as `<caption> <value>`. Read
 * the row asked for rather than the screen, because the suggested and the
 * effective price are identical whenever no manual price is set.
 */
function previewRow(caption: string): string | undefined {
  const label = screen.getByText(new RegExp(`^${caption}:`))
  // The value is the caption's immediate sibling; the row also carries a
  // formula hint as a later sibling.
  return label.nextElementSibling?.textContent?.trim()
}

function notifications() {
  return useNotificationStore.getState().notifications
}

describe("ProductFormPage", () => {
  it("shows the add title when creating a product", () => {
    renderForm("/inventory/products/new", "/inventory/products/new")
    expect(screen.getByText("Add Product")).toBeInTheDocument()
    expect(getProduct).not.toHaveBeenCalled()
  })

  it("shows the edit title and loads the product when editing", async () => {
    renderForm("/inventory/products/:id/edit", "/inventory/products/7/edit")

    expect(screen.getByText("Edit Product")).toBeInTheDocument()
    await waitFor(() => expect(getProduct).toHaveBeenCalledWith(7))
    await waitFor(() => expect(screen.getByLabelText(/Product Name/)).toHaveValue("Pastilla de freno"))
  })

  it("suggests the sale price from the cost and the global margin", async () => {
    const user = userEvent.setup()
    renderForm("/inventory/products/new", "/inventory/products/new")

    // The page opens with a cost of 0, so type one in and check the suggestion
    // is 100 * (1 + 30/100).
    const cost = screen.getByLabelText("Cost Price")
    await user.clear(cost)
    await user.type(cost, "100")

    await waitFor(() => expect(previewRow("Suggested price")).toBe("$130.00"))
  })

  it("previews a margin entered on the product instead of the global one", async () => {
    const user = userEvent.setup()
    renderForm("/inventory/products/new", "/inventory/products/new")

    const cost = screen.getByLabelText("Cost Price")
    await user.clear(cost)
    await user.type(cost, "100")
    await user.type(screen.getByLabelText("% gain"), "50")

    await waitFor(() => expect(previewRow("Suggested price")).toBe("$150.00"))
  })

  it("sends a manual price in preference to the suggested one", async () => {
    const user = userEvent.setup()
    renderForm("/inventory/products/new", "/inventory/products/new")

    await user.type(screen.getByLabelText(/Product Name/), "Bujía")
    await user.type(screen.getByLabelText(/^SKU/), "BJ-9")
    await user.type(screen.getByLabelText("Cost Price"), "100")
    await user.type(screen.getByLabelText("Edited price (optional)"), "149.5")
    await user.click(screen.getByRole("button", { name: "Save" }))

    await waitFor(() => expect(createProduct).toHaveBeenCalled())
    const payload = vi.mocked(createProduct).mock.calls[0][0] as Record<string, unknown>
    expect(payload.salePrice).toBe(149.5)
    expect(payload.editedPrice).toBe(149.5)
    // A margin was never typed, so the global default is not written onto the
    // product; the preview is derived at render time instead.
    expect(payload.profitMarginPct).toBeNull()
  })

  it("sends blank optional fields as undefined so the backend stores NULL", async () => {
    const user = userEvent.setup()
    renderForm("/inventory/products/new", "/inventory/products/new")

    await user.type(screen.getByLabelText(/Product Name/), "Filtro")
    await user.type(screen.getByLabelText(/^SKU/), "FLT-1")
    await user.click(screen.getByRole("button", { name: "Save" }))

    await waitFor(() => expect(createProduct).toHaveBeenCalled())
    const payload = vi.mocked(createProduct).mock.calls[0][0] as Record<string, unknown>
    for (const key of ["barcode", "oemNumber", "internalCode", "description", "weight", "imageUrl"]) {
      expect(payload[key]).toBeUndefined()
    }
  })

  it("refuses to save a margin outside the allowed range and says why", async () => {
    const user = userEvent.setup()
    renderForm("/inventory/products/new", "/inventory/products/new")

    await user.type(screen.getByLabelText(/Product Name/), "Imposible")
    await user.type(screen.getByLabelText(/^SKU/), "IMP-1")
    await user.type(screen.getByLabelText("% gain"), "95")
    await user.click(screen.getByRole("button", { name: "Save" }))

    // 95% is above the 90% ceiling, so nothing may be written.
    expect(createProduct).not.toHaveBeenCalled()
    await waitFor(() => expect(screen.getByText("Must be between 0% and 90%")).toBeInTheDocument())
    expect(notifications().some((n) => n.type === "error")).toBe(true)
  })

  it("never lets a non-numeric price reach the field", async () => {
    const user = userEvent.setup()
    renderForm("/inventory/products/new", "/inventory/products/new")

    const price = screen.getByLabelText("Edited price (optional)")
    // The field is type=number, so the browser itself discards letters. The
    // guard in handleSave is defence in depth for values arriving by other
    // routes (paste handlers, autofill, a future non-number input).
    await user.type(price, "abc")
    expect(price).toHaveValue(null)

    await user.type(price, "12.5")
    expect(price).toHaveValue(12.5)
  })

  it("updates the loaded product with its own id rather than creating a new one", async () => {
    const user = userEvent.setup()
    renderForm("/inventory/products/:id/edit", "/inventory/products/7/edit")

    const name = screen.getByLabelText(/Product Name/)
    await waitFor(() => expect(name).toHaveValue("Pastilla de freno"))
    await user.clear(name)
    await user.type(name, "Pastilla de freno Premium")
    await user.click(screen.getByRole("button", { name: "Save" }))

    await waitFor(() => expect(updateProduct).toHaveBeenCalled())
    const [payload] = vi.mocked(updateProduct).mock.calls[0] as [Record<string, unknown>]
    expect(payload.id).toBe(7)
    expect(payload.name).toBe("Pastilla de freno Premium")
    expect(createProduct).not.toHaveBeenCalled()
  })
})
