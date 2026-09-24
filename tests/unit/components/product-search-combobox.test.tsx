import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@tests/helpers/render"
import { ProductSearchCombobox } from "@/components/product-search-combobox"
import { globalProductSearch } from "@/lib/tauri"
import { setupI18n } from "@/i18n"
import type { ProductForPos } from "@/types"

setupI18n("en")

vi.mock("@/lib/tauri", () => ({
  globalProductSearch: vi.fn(),
}))

const mockProducts: ProductForPos[] = [
  { id: 1, name: "Brake Pads", sku: "BRK-100", barcode: "750100", salePrice: 100, wholesalePrice: 70, stockQuantity: 10, unit: "set", taxRate: 16, isActive: true, brandName: "Bosch" },
  { id: 2, name: "Oil Filter", sku: "OIL-200", salePrice: 50, wholesalePrice: 35, stockQuantity: 0, unit: "unit", taxRate: 16, isActive: true, brandName: "Mann" },
]

describe("ProductSearchCombobox", () => {
  const onSelect = vi.fn()

  beforeEach(() => {
    onSelect.mockReset()
    vi.mocked(globalProductSearch).mockReset()
    vi.mocked(globalProductSearch).mockResolvedValue(mockProducts)
  })

  it("renders with placeholder text", () => {
    render(<ProductSearchCombobox onSelect={onSelect} />)
    expect(screen.getByRole("combobox")).toBeDefined()
  })

  it("opens popover and shows search input on click", async () => {
    render(<ProductSearchCombobox onSelect={onSelect} />)
    fireEvent.click(screen.getByRole("combobox"))
    expect(await screen.findByPlaceholderText("Type to search...")).toBeDefined()
  })

  it("shows products after typing a query", async () => {
    render(<ProductSearchCombobox onSelect={onSelect} />)
    fireEvent.click(screen.getByRole("combobox"))
    const input = await screen.findByPlaceholderText("Type to search...")
    fireEvent.change(input, { target: { value: "brake" } })
    await waitFor(() => {
      expect(screen.getByText("Brake Pads")).toBeDefined()
      expect(screen.getByText("Bosch")).toBeDefined()
    })
  })

  it("calls onSelect when a product is clicked", async () => {
    render(<ProductSearchCombobox onSelect={onSelect} />)
    fireEvent.click(screen.getByRole("combobox"))
    const input = await screen.findByPlaceholderText("Type to search...")
    fireEvent.change(input, { target: { value: "brake" } })
    await waitFor(() => expect(screen.getByText("Brake Pads")).toBeDefined())
    fireEvent.click(screen.getByText("Brake Pads"))
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 1, name: "Brake Pads" }))
  })

  it("shows out-of-stock badge for zero-stock products", async () => {
    render(<ProductSearchCombobox onSelect={onSelect} />)
    fireEvent.click(screen.getByRole("combobox"))
    const input = await screen.findByPlaceholderText("Type to search...")
    fireEvent.change(input, { target: { value: "oil" } })
    await waitFor(() => expect(screen.getByText("Oil Filter")).toBeDefined())
    expect(screen.getByText("Out")).toBeDefined()
  })

  it("shows no products found message", async () => {
    vi.mocked(globalProductSearch).mockResolvedValue([])
    render(<ProductSearchCombobox onSelect={onSelect} />)
    fireEvent.click(screen.getByRole("combobox"))
    const input = await screen.findByPlaceholderText("Type to search...")
    fireEvent.change(input, { target: { value: "zzz" } })
    await waitFor(() => expect(screen.getByText("No products found")).toBeDefined())
  })
})
