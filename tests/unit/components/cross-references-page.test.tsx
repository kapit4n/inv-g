import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@tests/helpers/render"
import { setupI18n } from "@/i18n"
import { CrossReferencesPage } from "@/features/inventory/pages/cross-references-page"

vi.mock("@/lib/tauri", () => ({
  crossReferenceSearch: vi.fn(),
}))

import { crossReferenceSearch } from "@/lib/tauri"

setupI18n("en")

const mockResults = [
  {
    productId: 1,
    productName: "Front Brake Pads",
    productSku: "BP-001",
    salePrice: 45.99,
    stockQuantity: 20,
    categoryName: "Brakes",
    brandName: "Bosch",
    matchedIdentifier: "BP-001",
    matchedType: "product_field",
  },
  {
    productId: 2,
    productName: "OEM Brake Pads",
    productSku: "OBP-002",
    salePrice: 62.50,
    stockQuantity: 8,
    categoryName: "Brakes",
    brandName: "Toyota",
    matchedIdentifier: "04465-33471",
    matchedType: "oem",
  },
]

beforeEach(() => {
  vi.clearAllMocks()
  ;(crossReferenceSearch as ReturnType<typeof vi.fn>).mockResolvedValue([])
})

describe("CrossReferencesPage", () => {
  it("renders the page header", () => {
    render(<CrossReferencesPage />)
    expect(screen.getByText("Cross References")).toBeInTheDocument()
  })

  it("renders search input", () => {
    render(<CrossReferencesPage />)
    expect(screen.getByPlaceholderText(/Enter OEM number/)).toBeInTheDocument()
  })

  it("calls crossReferenceSearch on search button click", async () => {
    ;(crossReferenceSearch as ReturnType<typeof vi.fn>).mockResolvedValue(mockResults)
    render(<CrossReferencesPage />)

    const input = screen.getByPlaceholderText(/Enter OEM number/)
    fireEvent.change(input, { target: { value: "04465-33471" } })
    fireEvent.click(screen.getByRole("button", { name: /search/i }))

    await waitFor(() => {
      expect(crossReferenceSearch).toHaveBeenCalledWith("04465-33471")
    })
  })

  it("displays search results", async () => {
    ;(crossReferenceSearch as ReturnType<typeof vi.fn>).mockResolvedValue(mockResults)
    render(<CrossReferencesPage />)

    const input = screen.getByPlaceholderText(/Enter OEM number/)
    fireEvent.change(input, { target: { value: "brake" } })
    fireEvent.click(screen.getByRole("button", { name: /search/i }))

    await waitFor(() => {
      expect(screen.getByText("Front Brake Pads")).toBeInTheDocument()
      expect(screen.getByText("OEM Brake Pads")).toBeInTheDocument()
    })
  })

  it("displays no results message when empty", async () => {
    ;(crossReferenceSearch as ReturnType<typeof vi.fn>).mockResolvedValue([])
    render(<CrossReferencesPage />)

    const input = screen.getByPlaceholderText(/Enter OEM number/)
    fireEvent.change(input, { target: { value: "xyz" } })
    fireEvent.click(screen.getByRole("button", { name: /search/i }))

    await waitFor(() => {
      expect(screen.getByText("No results")).toBeInTheDocument()
    })
  })

  it("search button is disabled when query is empty", () => {
    render(<CrossReferencesPage />)
    const btn = screen.getByRole("button", { name: /search/i })
    expect(btn).toBeDisabled()
  })

  it("displays matched identifier badge for results", async () => {
    ;(crossReferenceSearch as ReturnType<typeof vi.fn>).mockResolvedValue(mockResults)
    render(<CrossReferencesPage />)

    const input = screen.getByPlaceholderText(/Enter OEM number/)
    fireEvent.change(input, { target: { value: "brake" } })
    fireEvent.click(screen.getByRole("button", { name: /search/i }))

    await waitFor(() => {
      expect(screen.getByText("Product Field")).toBeInTheDocument()
      expect(screen.getByText("oem")).toBeInTheDocument()
    })
  })

  it("shows result count", async () => {
    ;(crossReferenceSearch as ReturnType<typeof vi.fn>).mockResolvedValue(mockResults)
    render(<CrossReferencesPage />)

    const input = screen.getByPlaceholderText(/Enter OEM number/)
    fireEvent.change(input, { target: { value: "brake" } })
    fireEvent.click(screen.getByRole("button", { name: /search/i }))

    await waitFor(() => {
      expect(screen.getByText(/Results \(2\)/)).toBeInTheDocument()
    })
  })

  it("shows loading skeleton during search", async () => {
    let resolvePromise: (value: unknown[]) => void
    ;(crossReferenceSearch as ReturnType<typeof vi.fn>).mockReturnValue(
      new Promise((resolve) => { resolvePromise = resolve })
    )
    render(<CrossReferencesPage />)

    const input = screen.getByPlaceholderText(/Enter OEM number/)
    fireEvent.change(input, { target: { value: "brake" } })
    fireEvent.click(screen.getByRole("button", { name: /search/i }))

    await waitFor(() => {
      expect(screen.getAllByRole("generic")).toBeTruthy()
    })

    resolvePromise!(mockResults)
  })

  it("triggers search on Enter key press", async () => {
    ;(crossReferenceSearch as ReturnType<typeof vi.fn>).mockResolvedValue(mockResults)
    render(<CrossReferencesPage />)

    const input = screen.getByPlaceholderText(/Enter OEM number/)
    fireEvent.change(input, { target: { value: "test" } })
    fireEvent.keyDown(input, { key: "Enter" })

    await waitFor(() => {
      expect(crossReferenceSearch).toHaveBeenCalledWith("test")
    })
  })

  it("displays price and stock for results", async () => {
    ;(crossReferenceSearch as ReturnType<typeof vi.fn>).mockResolvedValue(mockResults)
    render(<CrossReferencesPage />)

    const input = screen.getByPlaceholderText(/Enter OEM number/)
    fireEvent.change(input, { target: { value: "brake" } })
    fireEvent.click(screen.getByRole("button", { name: /search/i }))

    await waitFor(() => {
      expect(screen.getByText("$45.99")).toBeInTheDocument()
      expect(screen.getByText("$62.50")).toBeInTheDocument()
      expect(screen.getByText("20 in stock")).toBeInTheDocument()
      expect(screen.getByText("8 in stock")).toBeInTheDocument()
    })
  })
})
