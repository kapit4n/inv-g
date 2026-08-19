import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@tests/helpers/render"
import { setupI18n } from "@/i18n"
import { ProductIdentifiersTab } from "@/features/inventory/components/product-identifiers-tab"

vi.mock("@/lib/tauri", () => ({
  getProductIdentifiers: vi.fn(),
  createProductIdentifier: vi.fn(),
  deleteProductIdentifier: vi.fn(),
}))

import {
  getProductIdentifiers,
  createProductIdentifier,
  deleteProductIdentifier,
} from "@/lib/tauri"

setupI18n("en")

const mockIdentifiers = [
  {
    id: 1,
    productId: 10,
    identifier: "04465-33471",
    identifierType: "oem",
    brandName: "Toyota",
    notes: "Genuine OEM part",
    createdAt: "2026-01-01T00:00:00",
  },
  {
    id: 2,
    productId: 10,
    identifier: "BP-12345",
    identifierType: "aftermarket",
    brandName: "Bosch",
    notes: undefined,
    createdAt: "2026-01-01T00:00:00",
  },
]

beforeEach(() => {
  vi.clearAllMocks()
  ;(getProductIdentifiers as ReturnType<typeof vi.fn>).mockResolvedValue(mockIdentifiers)
  ;(createProductIdentifier as ReturnType<typeof vi.fn>).mockResolvedValue({
    id: 3,
    productId: 10,
    identifier: "NEW-001",
    identifierType: "cross_ref",
    brandName: null,
    notes: null,
    createdAt: "2026-01-02T00:00:00",
  })
  ;(deleteProductIdentifier as ReturnType<typeof vi.fn>).mockResolvedValue(undefined)
})

describe("ProductIdentifiersTab", () => {
  it("renders the identifiers heading", async () => {
    render(<ProductIdentifiersTab productId={10} />)
    await waitFor(() => {
      expect(screen.getByText("Product Identifiers")).toBeInTheDocument()
    })
  })

  it("fetches and displays identifiers", async () => {
    render(<ProductIdentifiersTab productId={10} />)
    await waitFor(() => {
      expect(getProductIdentifiers).toHaveBeenCalledWith(10)
      expect(screen.getByText("04465-33471")).toBeInTheDocument()
      expect(screen.getByText("BP-12345")).toBeInTheDocument()
    })
  })

  it("shows brand names for identifiers", async () => {
    render(<ProductIdentifiersTab productId={10} />)
    await waitFor(() => {
      expect(screen.getByText("Toyota")).toBeInTheDocument()
      expect(screen.getByText("Bosch")).toBeInTheDocument()
    })
  })

  it("shows notes for identifiers", async () => {
    render(<ProductIdentifiersTab productId={10} />)
    await waitFor(() => {
      expect(screen.getByText("Genuine OEM part")).toBeInTheDocument()
    })
  })

  it("shows no identifiers message when empty", async () => {
    ;(getProductIdentifiers as ReturnType<typeof vi.fn>).mockResolvedValue([])
    render(<ProductIdentifiersTab productId={10} />)
    await waitFor(() => {
      expect(screen.getByText("No identifiers added yet")).toBeInTheDocument()
    })
  })

  it("shows add form when Add button is clicked", async () => {
    render(<ProductIdentifiersTab productId={10} />)
    await waitFor(() => {
      expect(screen.getByText("Product Identifiers")).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole("button", { name: /add/i }))
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/identifier/i)).toBeInTheDocument()
    })
  })

  it("creates a new identifier", async () => {
    render(<ProductIdentifiersTab productId={10} />)
    await waitFor(() => {
      expect(screen.getByText("Product Identifiers")).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole("button", { name: /add/i }))

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/identifier/i)).toBeInTheDocument()
    })

    fireEvent.change(screen.getByPlaceholderText(/identifier/i), { target: { value: "NEW-001" } })
    fireEvent.click(screen.getByRole("button", { name: /save/i }))

    await waitFor(() => {
      expect(createProductIdentifier).toHaveBeenCalledWith(10, "NEW-001", "oem", undefined, undefined)
    })
  })

  it("cancels add form on cancel button click", async () => {
    render(<ProductIdentifiersTab productId={10} />)
    await waitFor(() => {
      expect(screen.getByText("Product Identifiers")).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole("button", { name: /add/i }))
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/identifier/i)).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole("button", { name: /cancel/i }))
    await waitFor(() => {
      expect(screen.queryByPlaceholderText(/identifier/i)).not.toBeInTheDocument()
    })
  })

  it("deletes an identifier on trash button click", async () => {
    const { container } = render(<ProductIdentifiersTab productId={10} />)
    await waitFor(() => {
      expect(screen.getByText("04465-33471")).toBeInTheDocument()
    })

    const deleteBtn = container.querySelector("button.text-destructive")
    if (deleteBtn) {
      fireEvent.click(deleteBtn)
      await waitFor(() => {
        expect(deleteProductIdentifier).toHaveBeenCalled()
      })
    }
  })

  it("groups identifiers by type", async () => {
    render(<ProductIdentifiersTab productId={10} />)
    await waitFor(() => {
      expect(screen.getByText("OEM Number")).toBeInTheDocument()
      expect(screen.getByText("Aftermarket")).toBeInTheDocument()
    })
  })

  it("identifier type select has all types", async () => {
    render(<ProductIdentifiersTab productId={10} />)
    fireEvent.click(screen.getByRole("button", { name: /add/i }))

    await waitFor(() => {
      const select = screen.getByDisplayValue("OEM Number")
      expect(select).toBeInTheDocument()
      const options = (select as HTMLSelectElement).querySelectorAll("option")
      expect(options.length).toBe(5)
    })
  })
})
