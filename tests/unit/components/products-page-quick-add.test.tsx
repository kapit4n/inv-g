import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@tests/helpers/render"
import { setupI18n } from "@/i18n"
import { ProductsPage } from "@/features/inventory/pages/products-page"
import { useAuthStore, useAppSettingsStore } from "@/stores"
import type { AdminAppSetting, User } from "@/types"

/**
 * The quick add sits next to the full product form on the list page, and both
 * are hidden from a role that may not create products. `create_product` performs
 * no permission check on the backend, so the button is the only thing standing
 * between a read-only role and an empty inventory it can then sell from.
 */

vi.mock("@/lib/tauri", () => ({
  getProducts: vi.fn(),
  createProduct: vi.fn(),
  createInventoryMovement: vi.fn(),
  getWarehouses: vi.fn().mockResolvedValue([]),
  getSuppliers: vi.fn().mockResolvedValue([]),
  createSupplier: vi.fn(),
}))

import { getProducts } from "@/lib/tauri"

setupI18n("en")

const user: User = {
  id: 1, username: "admin", email: "admin@test.com", fullName: "Admin User",
  roleId: 2, roleName: "Administrator", isActive: true, createdAt: "2025-01-01T00:00:00Z",
}

function setting(key: string, value: string): AdminAppSetting {
  return { id: 0, category: "general", key, value, settingType: "string", isSystem: false, sortOrder: 0, createdAt: "", updatedAt: "" }
}

beforeEach(() => {
  vi.mocked(getProducts).mockReset().mockResolvedValue({ data: [], total: 0, page: 1, pageSize: 20, totalPages: 0 })
  useAppSettingsStore.setState({ settings: [setting("default_margin_percent", "30")], loaded: true, loading: false })
  useAuthStore.getState().clearSession()
})

describe("ProductsPage quick add entry point", () => {
  it("offers the quick add next to the full form to a role that can create", async () => {
    useAuthStore.getState().setSession(user, "token", ["inventory.view", "inventory.create"])
    render(<ProductsPage />)

    expect(await screen.findByTestId("open-quick-add")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Add Product/ })).toBeInTheDocument()
  })

  it("opens the quick add dialog", async () => {
    useAuthStore.getState().setSession(user, "token", ["inventory.view", "inventory.create"])
    render(<ProductsPage />)

    const trigger = await screen.findByTestId("open-quick-add")
    expect(screen.queryByTestId("quick-add-product-dialog")).not.toBeInTheDocument()
    trigger.click()
    await waitFor(() => expect(screen.getByTestId("quick-add-product-dialog")).toBeInTheDocument())
  })

  it("hides both creation buttons from a read-only role", async () => {
    useAuthStore.getState().setSession(user, "token", ["inventory.view"])
    render(<ProductsPage />)

    // Wait for the list to mount so the assertions are not racing the render.
    await waitFor(() => expect(getProducts).toHaveBeenCalled())
    expect(screen.queryByTestId("open-quick-add")).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /Add Product/ })).not.toBeInTheDocument()
  })
})
