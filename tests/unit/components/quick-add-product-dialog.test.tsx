import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor, fireEvent, act } from "@tests/helpers/render"
import { setupI18n } from "@/i18n"
import { QuickAddProductDialog } from "@/features/inventory/components/quick-add-product-dialog"
import { useAppSettingsStore, useAuthStore, useBusinessStore } from "@/stores"
import type { AdminAppSetting, User } from "@/types"

/**
 * The short form for registering a product: name, supplier, quantity, prices.
 *
 * Two things here are load-bearing and worth stating, because the obvious
 * implementation gets both wrong:
 *
 *  - The quantity must not be written straight onto the product. `create_product`
 *    accepts a `stock_quantity`, but writing it there leaves the counter holding
 *    units that never appear in the product's history. It goes in as a movement
 *    instead, which is also how every other stock entry in the app is recorded.
 *
 *  - `products.sku` is `NOT NULL UNIQUE`, so a blank SKU has to be filled in
 *    before the insert, and a duplicate has to come back as something the user
 *    can act on rather than a raw SQLite message.
 */

vi.mock("@/lib/tauri", () => ({
  createProduct: vi.fn(),
  createInventoryMovement: vi.fn(),
  getWarehouses: vi.fn(),
  getSuppliers: vi.fn(),
  createSupplier: vi.fn(),
}))

import {
  createProduct,
  createInventoryMovement,
  getWarehouses,
  getSuppliers,
  createSupplier,
} from "@/lib/tauri"

setupI18n("en")

const user: User = {
  id: 7, username: "admin", email: "admin@test.com", fullName: "Admin User",
  roleId: 2, roleName: "Administrator", isActive: true, createdAt: "2025-01-01T00:00:00Z",
}

function setting(key: string, value: string): AdminAppSetting {
  return { id: 0, category: "general", key, value, settingType: "string", isSystem: false, sortOrder: 0, createdAt: "", updatedAt: "" }
}

const suppliers = [
  { id: 1, companyName: "Bosch Bolivia", contactPerson: "Ana", phone: "70000001", mobile: null, email: null, website: null, taxNumber: "1111", address: null, city: null, state: null, postalCode: null, country: null, notes: null, isActive: true, createdAt: "", updatedAt: "" },
  { id: 2, companyName: "Importadora Andina", contactPerson: null, phone: null, mobile: null, email: null, website: null, taxNumber: null, address: null, city: null, state: null, postalCode: null, country: null, notes: null, isActive: true, createdAt: "", updatedAt: "" },
]

const createdProduct = {
  id: 55, name: "Brake pad set", sku: "QA-1", barcode: null, oemNumber: null, internalCode: null,
  description: null, categoryId: null, brandId: null, manufacturerId: null, supplierId: 1,
  costPrice: 100, salePrice: 130, wholesalePrice: 0, suggestedRetailPrice: 0, taxRate: 0,
  stockQuantity: 0, minStockLevel: 0, maxStockLevel: 0, reorderPoint: 0, unit: "unit",
  weight: null, warehouseId: null, storageLocationId: null, imageUrl: null,
  isActive: true, isDiscontinued: false, createdAt: "", updatedAt: "",
  profitMarginPct: null, editedPrice: null, suggestedPrice: 130, effectiveMarginPct: 30,
}

function renderDialog(onOpenChange = vi.fn()) {
  const utils = render(
    <QuickAddProductDialog open onOpenChange={onOpenChange} />
  )
  return { ...utils, onOpenChange }
}

/** Fills the four fields the quick add is actually about. */
function fillProductForm(overrides: Partial<Record<"name" | "sku" | "quantity" | "cost" | "sale", string>> = {}) {
  const values = {
    name: "Brake pad set",
    sku: "",
    quantity: "10",
    cost: "100",
    sale: "",
    ...overrides,
  }
  fireEvent.change(screen.getByTestId("quick-add-name"), { target: { value: values.name } })
  if (values.sku) fireEvent.change(screen.getByTestId("quick-add-sku"), { target: { value: values.sku } })
  fireEvent.change(screen.getByTestId("quick-add-quantity"), { target: { value: values.quantity } })
  fireEvent.change(screen.getByTestId("quick-add-cost"), { target: { value: values.cost } })
  if (values.sale) fireEvent.change(screen.getByTestId("quick-add-sale"), { target: { value: values.sale } })
  return values
}

beforeEach(() => {
  useAuthStore.getState().setSession(user, "token", ["inventory.view", "inventory.create"])
  useAppSettingsStore.setState({ settings: [setting("default_margin_percent", "30")], loaded: true, loading: false })
  useBusinessStore.setState({ context: null, loaded: false, loading: false, currentStoreId: null })
  vi.mocked(createProduct).mockReset().mockResolvedValue(createdProduct)
  vi.mocked(createInventoryMovement).mockReset().mockResolvedValue({} as never)
  vi.mocked(getWarehouses).mockReset().mockResolvedValue([])
  vi.mocked(getSuppliers).mockReset().mockResolvedValue(suppliers)
  vi.mocked(createSupplier).mockReset()
})

describe("QuickAddProductDialog", () => {
  it("registers the product and enters the quantity as a movement", async () => {
    renderDialog()
    fillProductForm({ sku: "BRK-100" })
    fireEvent.click(screen.getByTestId("quick-add-submit"))

    await waitFor(() => expect(createProduct).toHaveBeenCalledTimes(1))
    expect(createProduct).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Brake pad set",
        sku: "BRK-100",
        costPrice: 100,
        // Left at zero on the product row: the units arrive through the movement
        // so they are not counted twice and they show up in the product history.
        stockQuantity: 0,
        unit: "unit",
        createdBy: user.id,
      })
    )

    await waitFor(() => expect(createInventoryMovement).toHaveBeenCalledTimes(1))
    expect(createInventoryMovement).toHaveBeenCalledWith(
      expect.objectContaining({
        productId: 55,
        quantity: 10,
        type: "in",
        referenceType: "quick_add",
      })
    )
  })

  it("generates a SKU when the field is left empty", async () => {
    renderDialog()
    fillProductForm()
    fireEvent.click(screen.getByTestId("quick-add-submit"))

    await waitFor(() => expect(createProduct).toHaveBeenCalledTimes(1))
    const payload = vi.mocked(createProduct).mock.calls[0][0]
    expect(payload.sku).toMatch(/^QA-[0-9A-Z]+$/)
  })

  it("sends no movement when the quantity is zero", async () => {
    renderDialog()
    fillProductForm({ quantity: "0" })
    fireEvent.click(screen.getByTestId("quick-add-submit"))

    await waitFor(() => expect(createProduct).toHaveBeenCalledTimes(1))
    // The product is created with no stock, so there is nothing to record.
    await act(async () => {})
    expect(createInventoryMovement).not.toHaveBeenCalled()
  })

  it("stores a typed selling price as the manual override and leaves it null when blank", async () => {
    const { unmount } = renderDialog()
    fillProductForm({ sale: "150" })
    fireEvent.click(screen.getByTestId("quick-add-submit"))
    await waitFor(() => expect(createProduct).toHaveBeenCalledTimes(1))
    expect(vi.mocked(createProduct).mock.calls[0][0].editedPrice).toBe(150)
    unmount()

    renderDialog()
    fillProductForm()
    fireEvent.click(screen.getByTestId("quick-add-submit"))
    await waitFor(() => expect(createProduct).toHaveBeenCalledTimes(2))
    // Null means "derive from the margin on every read", which is what the
    // backend resolves sale_price from.
    expect(vi.mocked(createProduct).mock.calls[1][0].editedPrice).toBeNull()
  })

  it("turns a duplicate SKU into a message the user can act on", async () => {
    vi.mocked(createProduct).mockRejectedValue("UNIQUE constraint failed: products.sku")
    renderDialog()
    fillProductForm({ sku: "BRK-100" })
    fireEvent.click(screen.getByTestId("quick-add-submit"))

    expect(await screen.findByText("This SKU is already used by another product")).toBeInTheDocument()
    // A failed insert must not leave stock movements behind.
    expect(createInventoryMovement).not.toHaveBeenCalled()
    // The dialog stays open with the typed name intact so the SKU can be fixed.
    expect(screen.getByTestId("quick-add-name")).toHaveValue("Brake pad set")
  })

  it("keeps the supplier and prices between rows and clears the rest", async () => {
    renderDialog()
    fireEvent.change(screen.getByTestId("supplier-search"), { target: { value: "Bosch" } })
    fireEvent.click(await screen.findByTestId("supplier-option-1"))
    fillProductForm()
    fireEvent.click(screen.getByTestId("quick-add-submit"))

    await waitFor(() => expect(createProduct).toHaveBeenCalledTimes(1))
    expect(vi.mocked(createProduct).mock.calls[0][0].supplierId).toBe(1)

    // The next line of a supplier sheet: same supplier, same prices, new product.
    await waitFor(() => expect(screen.getByTestId("quick-add-name")).toHaveValue(""))
    expect(screen.getByTestId("quick-add-quantity")).toHaveValue(0)
    expect(screen.getByTestId("quick-add-cost")).toHaveValue(100)
    expect(screen.getByTestId("supplier-selected")).toHaveTextContent("Bosch Bolivia")
    expect(await screen.findByTestId("quick-add-added-count")).toHaveTextContent("1 product added")
  })

  it("registers an unknown supplier inline and attaches it to the product", async () => {
    vi.mocked(createSupplier).mockResolvedValue({ ...suppliers[0], id: 9, companyName: "Parts Express" })
    renderDialog()

    fireEvent.click(screen.getByTestId("supplier-new-toggle"))
    fireEvent.change(screen.getByTestId("supplier-new-name"), { target: { value: "Parts Express" } })
    fireEvent.click(screen.getByTestId("supplier-new-save"))

    await waitFor(() => expect(createSupplier).toHaveBeenCalledWith({
      companyName: "Parts Express",
      phone: undefined,
    }))
    await waitFor(() => expect(screen.getByTestId("supplier-selected")).toHaveTextContent("Parts Express"))

    fillProductForm()
    fireEvent.click(screen.getByTestId("quick-add-submit"))
    await waitFor(() => expect(createProduct).toHaveBeenCalledTimes(1))
    expect(vi.mocked(createProduct).mock.calls[0][0].supplierId).toBe(9)
  })

  it("offers a warehouse choice only when there is more than one", async () => {
    vi.mocked(getWarehouses).mockResolvedValue([
      { id: 1, name: "Central", code: "WH-001", isDefault: true, isActive: true },
    ])
    const { unmount } = renderDialog()
    await waitFor(() => expect(getWarehouses).toHaveBeenCalled())
    expect(screen.queryByRole("button", { name: "Central" })).not.toBeInTheDocument()
    unmount()

    vi.mocked(getWarehouses).mockResolvedValue([
      { id: 1, name: "Central", code: "WH-001", isDefault: true, isActive: true },
      { id: 2, name: "North", code: "WH-002", isDefault: false, isActive: true },
    ])
    renderDialog()
    const north = await screen.findByRole("button", { name: "North" })
    fireEvent.click(north)
    fillProductForm()
    fireEvent.click(screen.getByTestId("quick-add-submit"))
    await waitFor(() => expect(createProduct).toHaveBeenCalledTimes(1))
    expect(vi.mocked(createProduct).mock.calls[0][0].warehouseId).toBe(2)
  })

  it("warns when the selling price does not cover the cost", async () => {
    renderDialog()
    fillProductForm({ sale: "80" })
    expect(await screen.findByTestId("quick-add-below-cost")).toBeInTheDocument()
  })

  it("previews the price derived from the global gain", async () => {
    renderDialog()
    fillProductForm()
    // 100 x 1.30, from the seeded default_margin_percent. The suggested and the
    // effective price agree because no selling price was typed, so both read
    // $130.00.
    await waitFor(() => expect(screen.getAllByText("$130.00").length).toBe(2))
  })

  it("refuses to submit an incomplete row", () => {
    renderDialog()
    fireEvent.change(screen.getByTestId("quick-add-name"), { target: { value: "No price" } })
    // A product with no cost price would be registered at a value nobody set.
    expect(screen.getByTestId("quick-add-submit")).toBeDisabled()

    fillProductForm({ name: "", cost: "0" })
    expect(screen.getByTestId("quick-add-submit")).toBeDisabled()
  })
})
