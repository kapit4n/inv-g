import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@tests/helpers/render"
import { globalProductSearch } from "@/lib/tauri"
import { useProductSearch } from "@/hooks/use-product-search"
import type { ProductForPos } from "@/types"

vi.mock("@/lib/tauri", () => ({
  globalProductSearch: vi.fn(),
}))

const mockProducts: ProductForPos[] = [
  { id: 1, name: "Brake Pads", sku: "BRK-100", barcode: "750100", salePrice: 100, wholesalePrice: 70, stockQuantity: 10, unit: "set", taxRate: 16, isActive: true, brandName: "Bosch" },
  { id: 2, name: "Oil Filter", sku: "OIL-200", salePrice: 50, wholesalePrice: 35, stockQuantity: 8, unit: "unit", taxRate: 16, isActive: true, brandName: "Mann" },
]

function SearchTestComponent({ options }: { options?: Parameters<typeof useProductSearch>[0] }) {
  const { query, setQuery, products, isTyping } = useProductSearch(options)
  return (
    <div>
      <input value={query} onChange={(e) => setQuery(e.target.value)} aria-label="search" />
      <span data-testid="count">{products.length}</span>
      <span data-testid="typing">{String(isTyping)}</span>
      {products.map((p) => (
        <div key={p.id} data-testid={`product-${p.id}`}>{p.name}</div>
      ))}
    </div>
  )
}

describe("useProductSearch", () => {
  beforeEach(() => {
    vi.mocked(globalProductSearch).mockReset()
    vi.mocked(globalProductSearch).mockResolvedValue(mockProducts)
  })

  it("does not query when query is empty and queryAllWhenEmpty is false", async () => {
    render(<SearchTestComponent />)
    expect(screen.getByTestId("count").textContent).toBe("0")
    expect(globalProductSearch).not.toHaveBeenCalled()
  })

  it("queries all products when queryAllWhenEmpty is true", async () => {
    render(<SearchTestComponent options={{ queryAllWhenEmpty: true }} />)
    await waitFor(() => {
      expect(screen.getByTestId("count").textContent).toBe("2")
    })
    expect(globalProductSearch).toHaveBeenCalledWith("", 20)
  })

  it("fires query after debounce when user types", async () => {
    render(<SearchTestComponent options={{ debounceMs: 100 }} />)
    const input = screen.getByRole("textbox", { name: "search" })
    fireEvent.change(input, { target: { value: "brake" } })

    expect(globalProductSearch).not.toHaveBeenCalled()

    await waitFor(() => {
      expect(globalProductSearch).toHaveBeenCalled()
    }, { timeout: 2000 })
  })

  it("respects limit option", async () => {
    render(<SearchTestComponent options={{ debounceMs: 100, limit: 5 }} />)
    const input = screen.getByRole("textbox", { name: "search" })
    fireEvent.change(input, { target: { value: "pad" } })

    await waitFor(() => {
      expect(globalProductSearch).toHaveBeenCalledWith("pad", 5)
    }, { timeout: 2000 })
  })

  it("shows isTyping while debounce is pending", async () => {
    render(<SearchTestComponent options={{ debounceMs: 500 }} />)
    const input = screen.getByRole("textbox", { name: "search" })
    fireEvent.change(input, { target: { value: "brake" } })

    expect(screen.getByTestId("typing").textContent).toBe("true")

    await waitFor(() => {
      expect(screen.getByTestId("typing").textContent).toBe("false")
    }, { timeout: 2000 })
  })
})
