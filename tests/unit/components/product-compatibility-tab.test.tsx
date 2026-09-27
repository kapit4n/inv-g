import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@tests/helpers/render"
import { setupI18n } from "@/i18n"
import { ProductCompatibilityTab } from "@/features/inventory/components/product-compatibility-tab"

/**
 * The Part Finder answered "No se encontraron partes compatibles" for every
 * input, on every database, because nothing could ever write a row to
 * `product_vehicle_compatibility`.
 *
 * `create_compatibility` and `delete_compatibility` were registered in Rust and
 * bound in `src/lib/tauri.ts`, but no component ever called them: this tab was
 * the only reader of the table and it rendered "Sin datos" with no way forward.
 * The search inner-joined the same table, so an empty table meant the whole
 * feature was dead on arrival. These tests cover the write path that was
 * missing.
 */

vi.mock("@/lib/tauri", () => ({
  getProductCompatibility: vi.fn(),
  createCompatibility: vi.fn(),
  deleteCompatibility: vi.fn(),
  getVehicleBrands: vi.fn(),
  getVehicleModels: vi.fn(),
  getVehicleGenerations: vi.fn(),
  getVehicleEngines: vi.fn(),
  getVehicleTransmissions: vi.fn(),
}))

vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: vi.fn() },
}))

import toast from "react-hot-toast"
import {
  getProductCompatibility,
  createCompatibility,
  deleteCompatibility,
  getVehicleBrands,
  getVehicleModels,
  getVehicleGenerations,
  getVehicleEngines,
  getVehicleTransmissions,
} from "@/lib/tauri"

setupI18n("en")

const mockBrands = [
  { id: 1, name: "Toyota", isActive: true },
  { id: 2, name: "Honda", isActive: true },
]
const mockModels = [
  { id: 1, brandId: 1, name: "Corolla", isActive: true },
  { id: 2, brandId: 1, name: "Hilux", isActive: true },
  { id: 3, brandId: 2, name: "Civic", isActive: true },
]
const mockGenerations = [
  { id: 1, modelId: 1, name: "E210", yearStart: 2019, yearEnd: 2024 },
]
const mockEngines = [{ id: 1, name: "1.8 VVT-i" }]
const mockTransmissions = [{ id: 1, name: "CVT" }]

const mockEntries = [
  {
    id: 1,
    productId: 10,
    productName: "Ceramic Brake Pads",
    productSku: "BP-CER-001",
    brandId: 1,
    brandName: "Toyota",
    modelId: 1,
    modelName: "Corolla",
    generationId: 1,
    generationName: "E210",
    engineId: 1,
    engineName: "1.8 VVT-i",
    transmissionId: null,
    transmissionName: null,
    yearStart: 2019,
    yearEnd: 2024,
    notes: null,
    createdAt: "2026-01-01T00:00:00",
  },
]

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(getProductCompatibility).mockResolvedValue(mockEntries)
  vi.mocked(getVehicleBrands).mockResolvedValue(mockBrands)
  // The real command filters by brand server-side; the mock has to as well,
  // or the test would "prove" a scoping rule the query never had.
  vi.mocked(getVehicleModels).mockImplementation((brandId?: number) =>
    Promise.resolve(mockModels.filter((m) => m.brandId === brandId))
  )
  vi.mocked(getVehicleGenerations).mockResolvedValue(mockGenerations)
  vi.mocked(getVehicleEngines).mockResolvedValue(mockEngines)
  vi.mocked(getVehicleTransmissions).mockResolvedValue(mockTransmissions)
  vi.mocked(createCompatibility).mockResolvedValue({} as never)
  vi.mocked(deleteCompatibility).mockResolvedValue(undefined)
})

/**
 * The add form starts closed. Opening it is not enough: the brand picker is
 * populated by an async query, and a `<select>` with no matching `<option>`
 * silently reports `value === ""` after a change, so the test has to wait for
 * the catalog before it can drive the cascade.
 */
async function openForm() {
  render(<ProductCompatibilityTab productId={10} />)
  fireEvent.click(screen.getByRole("button", { name: /add compatibility/i }))
  await screen.findByLabelText(/^brand$/i)
  await screen.findByRole("option", { name: "Toyota" })
}

/** Every field is reachable by its visible label, which is what a screen reader uses. */
const brand = () => screen.getByLabelText(/^brand$/i) as HTMLSelectElement
const model = () => screen.getByLabelText(/^model$/i) as HTMLSelectElement
const generation = () => screen.getByLabelText(/^generation$/i) as HTMLSelectElement
const yearStart = () => screen.getByLabelText(/^year start$/i) as HTMLSelectElement
const yearEnd = () => screen.getByLabelText(/^year end$/i) as HTMLSelectElement
const save = () => screen.getByRole("button", { name: /^save$/i }) as HTMLButtonElement

/**
 * Each level of the cascade is loaded by its own async query, and a `<select>`
 * silently reports `value === ""` when the change names an option that has not
 * rendered yet. So every step waits for the option it is about to pick.
 */
async function chooseBrand(id: string) {
  fireEvent.change(brand(), { target: { value: id } })
  await screen.findByRole("option", { name: id === "1" ? "Corolla" : "Civic" })
}

async function chooseModel(id: string) {
  fireEvent.change(model(), { target: { value: id } })
  await screen.findByRole("option", { name: "E210" })
}

describe("ProductCompatibilityTab write path", () => {
  it("lists the fitments already recorded for the product", async () => {
    render(<ProductCompatibilityTab productId={10} />)
    expect(await screen.findByText(/Toyota Corolla E210/)).toBeInTheDocument()
    expect(screen.getByText("2019-2024")).toBeInTheDocument()
    expect(screen.getByText("1.8 VVT-i")).toBeInTheDocument()
  })

  it("offers no way to add a fitment when the product has none", async () => {
    vi.mocked(getProductCompatibility).mockResolvedValue([])
    render(<ProductCompatibilityTab productId={10} />)
    expect(await screen.findByText(/no vehicle compatibility/i)).toBeInTheDocument()
    // The empty state used to be a dead end, and this is the reason why.
    expect(screen.getByRole("button", { name: /add compatibility/i })).toBeInTheDocument()
  })

  it("creates a fitment and refreshes the list", async () => {
    await openForm()
    await chooseBrand("1")
    await chooseModel("1")
    fireEvent.change(yearStart(), { target: { value: "2015" } })
    fireEvent.change(yearEnd(), { target: { value: "2020" } })
    await waitFor(() => expect(save()).toBeEnabled())
    fireEvent.click(save())

    await waitFor(() =>
      expect(createCompatibility).toHaveBeenCalledWith(
        10, 1, 1, undefined, undefined, undefined, 2015, 2020, undefined
      )
    )
    // The list the Part Finder reads has to be re-fetched.
    await waitFor(() => expect(getProductCompatibility).toHaveBeenCalledTimes(2))
  })

  it("cascades brand to model to generation", async () => {
    await openForm()
    await chooseBrand("1")
    expect(getVehicleModels).toHaveBeenCalledWith(1)
    // The model list is scoped to the brand, so only Toyota models appear.
    expect(await screen.findByRole("option", { name: "Corolla" })).toBeInTheDocument()
    expect(screen.queryByRole("option", { name: "Civic" })).not.toBeInTheDocument()

    await chooseModel("1")
    expect(getVehicleGenerations).toHaveBeenCalledWith(1)
  })

  it("clears the model and generation when the brand changes", async () => {
    await openForm()
    await chooseBrand("1")
    await chooseModel("1")

    // A model belongs to exactly one brand, so it cannot survive the change.
    fireEvent.change(brand(), { target: { value: "2" } })
    await screen.findByRole("option", { name: "Civic" })
    expect(model().value).toBe("")
    expect(generation().value).toBe("")
  })

  it("refuses to save a fitment that names no vehicle", async () => {
    await openForm()
    // Year range alone matches nothing, so the button must stay disabled.
    fireEvent.change(yearStart(), { target: { value: "2015" } })
    expect(save()).toBeDisabled()

    fireEvent.change(brand(), { target: { value: "1" } })
    await waitFor(() => expect(save()).toBeEnabled())
  })

  it("refuses an inverted year range", async () => {
    await openForm()
    fireEvent.change(brand(), { target: { value: "1" } })
    fireEvent.change(yearStart(), { target: { value: "2020" } })
    fireEvent.change(yearEnd(), { target: { value: "2015" } })

    expect(await screen.findByText(/start year cannot be after the end year/i)).toBeInTheDocument()
    expect(save()).toBeDisabled()
  })

  it("deletes a fitment and refreshes the list", async () => {
    render(<ProductCompatibilityTab productId={10} />)
    await screen.findByText(/Toyota Corolla E210/)
    fireEvent.click(screen.getByRole("button", { name: /delete/i }))

    await waitFor(() => expect(deleteCompatibility).toHaveBeenCalledWith(1))
    await waitFor(() => expect(getProductCompatibility).toHaveBeenCalledTimes(2))
  })

  it("surfaces a failure instead of silently doing nothing", async () => {
    vi.mocked(createCompatibility).mockRejectedValue(new Error("FK constraint failed"))
    await openForm()
    await chooseBrand("1")
    await waitFor(() => expect(save()).toBeEnabled())
    fireEvent.click(save())

    // The command rejects with an `Error`, so the toast carries `String(e)`.
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Error: FK constraint failed"))
    expect(toast.success).not.toHaveBeenCalled()
    // The form must stay open so the entry is not silently lost.
    expect(save()).toBeInTheDocument()
  })

  it("reports success and collapses the form", async () => {
    await openForm()
    await chooseBrand("1")
    await waitFor(() => expect(save()).toBeEnabled())
    fireEvent.click(save())

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Compatibility added successfully"))
    await waitFor(() => expect(screen.queryByLabelText(/^brand$/i)).not.toBeInTheDocument())
  })
})
