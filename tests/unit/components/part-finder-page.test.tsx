import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@tests/helpers/render"
import { setupI18n } from "@/i18n"
import { PartFinderPage } from "@/features/part-finder/pages/part-finder-page"

vi.mock("@/lib/tauri", () => ({
  getVehicleBrands: vi.fn(),
  getVehicleModels: vi.fn(),
  getVehicleGenerations: vi.fn(),
  getVehicleEngines: vi.fn(),
  getVehicleTransmissions: vi.fn(),
  searchCompatibleProducts: vi.fn(),
  getRecommendationsForVehicle: vi.fn(),
}))

import {
  getVehicleBrands,
  getVehicleModels,
  getVehicleGenerations,
  getVehicleEngines,
  getVehicleTransmissions,
  searchCompatibleProducts,
  getRecommendationsForVehicle,
} from "@/lib/tauri"

setupI18n("en")

const mockBrands = [
  { id: 1, name: "Toyota", isActive: true, createdAt: "2026-01-01", updatedAt: "2026-01-01" },
  { id: 2, name: "Honda", isActive: true, createdAt: "2026-01-01", updatedAt: "2026-01-01" },
]

const mockModels = [
  { id: 1, brandId: 1, name: "Corolla", isActive: true, createdAt: "2026-01-01", updatedAt: "2026-01-01" },
  { id: 2, brandId: 1, name: "Camry", isActive: true, createdAt: "2026-01-01", updatedAt: "2026-01-01" },
]

const mockGenerations = [
  { id: 1, modelId: 1, name: "E210", yearStart: 2019, yearEnd: 2024, createdAt: "2026-01-01" },
]

const mockResults = [
  { productId: 10, productName: "Ceramic Brake Pads", productSku: "BP-CER-001", salePrice: 45.99, stockQuantity: 15, categoryName: "Brakes", brandName: "Brembo", compatibilityCount: 3 },
  { productId: 11, productName: "Oil Filter Premium", productSku: "OF-PRM-002", salePrice: 12.99, stockQuantity: 0, categoryName: "Filters", brandName: "Bosch", compatibilityCount: 2 },
]

describe("PartFinderPage", () => {
  beforeEach(() => {
    vi.mocked(getVehicleBrands).mockResolvedValue(mockBrands)
    vi.mocked(getVehicleModels).mockResolvedValue(mockModels)
    vi.mocked(getVehicleGenerations).mockResolvedValue(mockGenerations)
    vi.mocked(getVehicleEngines).mockResolvedValue([])
    vi.mocked(getVehicleTransmissions).mockResolvedValue([])
    vi.mocked(searchCompatibleProducts).mockResolvedValue([])
    vi.mocked(getRecommendationsForVehicle).mockResolvedValue([])
  })

  it("renders the page title", async () => {
    render(<PartFinderPage />)
    expect(screen.getByText("Part Finder")).toBeInTheDocument()
  })

  it("renders all selector labels", async () => {
    render(<PartFinderPage />)
    expect(screen.getByText("Brand")).toBeInTheDocument()
    expect(screen.getByText("Model")).toBeInTheDocument()
    expect(screen.getByText("Generation")).toBeInTheDocument()
    expect(screen.getByText("Year")).toBeInTheDocument()
    expect(screen.getByText("Engine")).toBeInTheDocument()
    expect(screen.getByText("Transmission")).toBeInTheDocument()
  })

  it("loads brands on mount", async () => {
    render(<PartFinderPage />)
    await waitFor(() => {
      expect(getVehicleBrands).toHaveBeenCalled()
    })
    expect(screen.getByText("Toyota")).toBeInTheDocument()
    expect(screen.getByText("Honda")).toBeInTheDocument()
  })

  it("cascades model selection after choosing a brand", async () => {
    render(<PartFinderPage />)
    await waitFor(() => {
      expect(getVehicleBrands).toHaveBeenCalled()
    })

    const brandSelect = screen.getAllByRole("combobox")[0]
    fireEvent.change(brandSelect, { target: { value: "1" } })

    await waitFor(() => {
      expect(getVehicleModels).toHaveBeenCalledWith(1)
    })
    expect(screen.getByText("Corolla")).toBeInTheDocument()
    expect(screen.getByText("Camry")).toBeInTheDocument()
  })

  it("cascades generation selection after choosing a model", async () => {
    render(<PartFinderPage />)
    await waitFor(() => {
      expect(getVehicleBrands).toHaveBeenCalled()
    })

    const brandSelect = screen.getAllByRole("combobox")[0]
    fireEvent.change(brandSelect, { target: { value: "1" } })

    await waitFor(() => {
      expect(getVehicleModels).toHaveBeenCalled()
    })

    const modelSelect = screen.getAllByRole("combobox")[1]
    fireEvent.change(modelSelect, { target: { value: "1" } })

    await waitFor(() => {
      expect(getVehicleGenerations).toHaveBeenCalledWith(1)
    })
    expect(screen.getByText("E210")).toBeInTheDocument()
  })

  it("calls searchCompatibleProducts when Find Parts is clicked", async () => {
    vi.mocked(searchCompatibleProducts).mockResolvedValue(mockResults)

    render(<PartFinderPage />)
    await waitFor(() => {
      expect(getVehicleBrands).toHaveBeenCalled()
    })

    const brandSelect = screen.getAllByRole("combobox")[0]
    fireEvent.change(brandSelect, { target: { value: "1" } })

    const searchBtn = screen.getByText("Find Parts")
    fireEvent.click(searchBtn)

    await waitFor(() => {
      expect(searchCompatibleProducts).toHaveBeenCalledWith(1, undefined, undefined, undefined, undefined, undefined)
    })
  })

  it("displays search results after search", async () => {
    vi.mocked(searchCompatibleProducts).mockResolvedValue(mockResults)

    render(<PartFinderPage />)
    await waitFor(() => {
      expect(getVehicleBrands).toHaveBeenCalled()
    })

    const brandSelect = screen.getAllByRole("combobox")[0]
    fireEvent.change(brandSelect, { target: { value: "1" } })

    fireEvent.click(screen.getByText("Find Parts"))

    await waitFor(() => {
      expect(screen.getByText("Ceramic Brake Pads")).toBeInTheDocument()
    })
    expect(screen.getByText("BP-CER-001")).toBeInTheDocument()
    expect(screen.getByText("$45.99")).toBeInTheDocument()
    expect(screen.getByText("15 in stock")).toBeInTheDocument()
  })

  it("shows out of stock badge for products with zero stock", async () => {
    vi.mocked(searchCompatibleProducts).mockResolvedValue(mockResults)

    render(<PartFinderPage />)
    await waitFor(() => {
      expect(getVehicleBrands).toHaveBeenCalled()
    })

    const brandSelect = screen.getAllByRole("combobox")[0]
    fireEvent.change(brandSelect, { target: { value: "1" } })

    fireEvent.click(screen.getByText("Find Parts"))

    await waitFor(() => {
      expect(screen.getByText("Ceramic Brake Pads")).toBeInTheDocument()
    })
    expect(screen.getByText("Out of stock")).toBeInTheDocument()
  })

  it("shows empty state when no results found", async () => {
    vi.mocked(searchCompatibleProducts).mockResolvedValue([])

    render(<PartFinderPage />)
    await waitFor(() => {
      expect(getVehicleBrands).toHaveBeenCalled()
    })

    const brandSelect = screen.getAllByRole("combobox")[0]
    fireEvent.change(brandSelect, { target: { value: "1" } })

    fireEvent.click(screen.getByText("Find Parts"))

    await waitFor(() => {
      expect(screen.getByText("No compatible parts found")).toBeInTheDocument()
    })
  })

  it("loads recommendations when brand is selected", async () => {
    vi.mocked(getRecommendationsForVehicle).mockResolvedValue(mockResults)

    render(<PartFinderPage />)
    await waitFor(() => {
      expect(getVehicleBrands).toHaveBeenCalled()
    })

    const brandSelect = screen.getAllByRole("combobox")[0]
    fireEvent.change(brandSelect, { target: { value: "1" } })

    await waitFor(() => {
      expect(getRecommendationsForVehicle).toHaveBeenCalled()
    })
  })

  it("disables model selector when no brand is selected", async () => {
    render(<PartFinderPage />)
    await waitFor(() => {
      expect(getVehicleBrands).toHaveBeenCalled()
    })

    const modelSelect = screen.getAllByRole("combobox")[1]
    expect(modelSelect).toBeDisabled()
  })
})
