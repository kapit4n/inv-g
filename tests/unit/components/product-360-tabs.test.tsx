import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@tests/helpers/render"
import { setupI18n } from "@/i18n"
import { ProductOverviewTab } from "@/features/inventory/components/product-overview-tab"
import { ProductInventoryTab } from "@/features/inventory/components/product-inventory-tab"
import { ProductPricingTab } from "@/features/inventory/components/product-pricing-tab"
import { ProductSuppliersTab } from "@/features/inventory/components/product-suppliers-tab"
import { ProductCompatibilityTab } from "@/features/inventory/components/product-compatibility-tab"
import { ProductActivityTab } from "@/features/inventory/components/product-activity-tab"
import { ProductEquivalentsTab } from "@/features/inventory/components/product-equivalents-tab"
import type { InventoryProduct, ProductImage } from "@/types/inventory"

setupI18n("en")

vi.mock("@/lib/tauri", () => ({
  getInventoryMovements: vi.fn().mockResolvedValue([]),
  getCostHistory: vi.fn().mockResolvedValue([]),
  getSupplierProducts: vi.fn().mockResolvedValue([]),
  getSuppliers: vi.fn().mockResolvedValue([]),
  getProductCompatibility: vi.fn().mockResolvedValue([]),
  getProductImages: vi.fn().mockResolvedValue([]),
  getWarehouses: vi.fn().mockResolvedValue([]),
  getProductEquivalents: vi.fn().mockResolvedValue([]),
  getProducts: vi.fn().mockResolvedValue({ data: [], total: 0, page: 1, pageSize: 20, totalPages: 0 }),
  addProductEquivalent: vi.fn().mockResolvedValue({}),
  removeProductEquivalent: vi.fn().mockResolvedValue(undefined),
}))

const baseProduct: InventoryProduct = {
  id: 1,
  name: "Test Product",
  sku: "TP-001",
  barcode: "123456789",
  oemNumber: "OEM-100",
  internalCode: "INT-200",
  description: "A test product",
  categoryId: 1,
  brandId: 2,
  manufacturerId: 3,
  supplierId: 4,
  costPrice: 10,
  salePrice: 20,
  wholesalePrice: 15,
  suggestedRetailPrice: 22,
  taxRate: 0.13,
  stockQuantity: 50,
  minStockLevel: 10,
  maxStockLevel: 100,
  reorderPoint: 15,
  unit: "pcs",
  weight: 1.5,
  warehouseId: 1,
  storageLocationId: 2,
  imageUrl: null,
  isActive: true,
  isDiscontinued: false,
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-06-01T00:00:00Z",
  profitMarginPct: null,
  editedPrice: null,
  suggestedPrice: 13,
  effectiveMarginPct: 30,
}

const images: ProductImage[] = [
  { id: 1, productId: 1, filePath: "/img/front.jpg", isPrimary: true, sortOrder: 0, createdAt: "2024-01-01T00:00:00Z" },
  { id: 2, productId: 1, filePath: "/img/back.jpg", isPrimary: false, sortOrder: 1, createdAt: "2024-01-02T00:00:00Z" },
]

describe("ProductOverviewTab", () => {
  it("renders product name and SKU", () => {
    render(
      <ProductOverviewTab product={baseProduct} catName="Brakes" brandName="Brembo" images={images} />
    )
    expect(screen.getByText("Test Product")).toBeInTheDocument()
    expect(screen.getByText("TP-001")).toBeInTheDocument()
  })

  it("renders pricing information", () => {
    render(
      <ProductOverviewTab product={baseProduct} catName="Brakes" brandName="Brembo" images={images} />
    )
    expect(screen.getByText("$10.00")).toBeInTheDocument()
    expect(screen.getByText("$20.00")).toBeInTheDocument()
  })

  it("renders stock information", () => {
    render(
      <ProductOverviewTab product={baseProduct} catName="Brakes" brandName="Brembo" images={images} />
    )
    expect(screen.getByText("50")).toBeInTheDocument()
  })

  it("shows product images with primary badge", () => {
    render(
      <ProductOverviewTab product={baseProduct} catName="Brakes" brandName="Brembo" images={images} />
    )
    expect(screen.getByText("/img/front.jpg")).toBeInTheDocument()
    expect(screen.getByText("/img/back.jpg")).toBeInTheDocument()
    expect(screen.getByText("Primary")).toBeInTheDocument()
  })

  it("shows active status badge", () => {
    render(
      <ProductOverviewTab product={baseProduct} catName="Brakes" brandName="Brembo" images={images} />
    )
    expect(screen.getByText("Active")).toBeInTheDocument()
  })

  it("shows inactive badge when product is inactive", () => {
    render(
      <ProductOverviewTab product={{ ...baseProduct, isActive: false }} catName="Brakes" brandName="Brembo" images={[]} />
    )
    expect(screen.getByText("Inactive")).toBeInTheDocument()
  })

  it("shows discontinued as yes when true", () => {
    render(
      <ProductOverviewTab product={{ ...baseProduct, isDiscontinued: true }} catName="Brakes" brandName="Brembo" images={[]} />
    )
    expect(screen.getByText("Yes")).toBeInTheDocument()
  })

  it("renders category and brand names", () => {
    render(
      <ProductOverviewTab product={baseProduct} catName="Brakes" brandName="Brembo" images={[]} />
    )
    expect(screen.getByText("Brakes")).toBeInTheDocument()
    expect(screen.getByText("Brembo")).toBeInTheDocument()
  })

  it("renders weight in kg", () => {
    render(
      <ProductOverviewTab product={baseProduct} catName="Brakes" brandName="Brembo" images={[]} />
    )
    expect(screen.getByText("1.5 kg")).toBeInTheDocument()
  })

  it("shows dash when weight is null", () => {
    render(
      <ProductOverviewTab product={{ ...baseProduct, weight: null }} catName="Brakes" brandName="Brembo" images={[]} />
    )
    const dashes = screen.getAllByText("-")
    expect(dashes.length).toBeGreaterThan(0)
  })
})

describe("ProductInventoryTab", () => {
  it("shows stock quantity", () => {
    render(<ProductInventoryTab product={baseProduct} whName="Main" storageLocName="A1" />)
    expect(screen.getByText(/50/)).toBeInTheDocument()
  })

  it("shows In Stock badge for adequate stock", () => {
    render(<ProductInventoryTab product={baseProduct} whName="Main" storageLocName="A1" />)
    expect(screen.getByText("In Stock")).toBeInTheDocument()
  })

  it("shows Out of Stock badge when stock is 0", () => {
    render(<ProductInventoryTab product={{ ...baseProduct, stockQuantity: 0 }} whName="Main" storageLocName="A1" />)
    expect(screen.getByText("Out of Stock")).toBeInTheDocument()
  })

  it("shows Low Stock badge when stock is at or below min", () => {
    render(<ProductInventoryTab product={{ ...baseProduct, stockQuantity: 5 }} whName="Main" storageLocName="A1" />)
    expect(screen.getByText("Low Stock")).toBeInTheDocument()
  })

  it("shows warehouse and storage location", () => {
    render(<ProductInventoryTab product={baseProduct} whName="Main Warehouse" storageLocName="A1-02" />)
    expect(screen.getByText("Main Warehouse")).toBeInTheDocument()
    expect(screen.getByText("A1-02")).toBeInTheDocument()
  })
})

describe("ProductPricingTab", () => {
  it("renders cost and sale prices", () => {
    render(<ProductPricingTab product={baseProduct} />)
    expect(screen.getByText("$10.00")).toBeInTheDocument()
    expect(screen.getByText("$20.00")).toBeInTheDocument()
  })

  it("renders margin percentage over cost", () => {
    render(<ProductPricingTab product={baseProduct} />)
    expect(screen.getByText("100.0%")).toBeInTheDocument()
  })

  it("shows configured margin from the product", () => {
    render(<ProductPricingTab product={{ ...baseProduct, effectiveMarginPct: 50 }} />)
    expect(screen.getByText("50.0%")).toBeInTheDocument()
  })

  it("shows negative margin when selling below cost", () => {
    render(<ProductPricingTab product={{ ...baseProduct, salePrice: 0 }} />)
    expect(screen.getByText("-100.0%")).toBeInTheDocument()
  })

  it("renders suggested and edited pricing rows", () => {
    render(<ProductPricingTab product={baseProduct} />)
    expect(screen.getByText("$13.00")).toBeInTheDocument()
    expect(screen.getByText("Auto")).toBeInTheDocument()
  })

  it("renders tax rate as percentage", () => {
    render(<ProductPricingTab product={baseProduct} />)
    expect(screen.getByText("13.0%")).toBeInTheDocument()
  })
})

describe("ProductSuppliersTab", () => {
  it("shows no data message when empty", () => {
    render(<ProductSuppliersTab product={baseProduct} />)
    expect(screen.getByText("No data")).toBeInTheDocument()
  })
})

describe("ProductCompatibilityTab", () => {
  it("shows no data message when empty", () => {
    render(<ProductCompatibilityTab productId={1} />)
    expect(screen.getByText("No data")).toBeInTheDocument()
  })
})

describe("ProductActivityTab", () => {
  it("shows no data message when empty", () => {
    render(<ProductActivityTab productId={1} />)
    expect(screen.getByText("No data")).toBeInTheDocument()
  })
})

describe("ProductEquivalentsTab", () => {
  it("shows empty message when there are no equivalents", async () => {
    render(<ProductEquivalentsTab productId={1} />)
    expect(await screen.findByText("This product has no registered equivalents")).toBeInTheDocument()
  })

  it("renders each equivalent with name, sku and stock", async () => {
    const { getProductEquivalents } = await import("@/lib/tauri")
    vi.mocked(getProductEquivalents).mockResolvedValueOnce([
      {
        id: 1, productId: 1, equivalentProductId: 2, note: undefined, createdAt: "2024-01-01T00:00:00Z",
        name: "Alternate Pad", sku: "AP-002", brandName: "Brembo", categoryName: "Brakes",
        stockQuantity: 7, unit: "pcs", salePrice: 25, wholesalePrice: 20, taxRate: 0.13,
        imageUrl: undefined, isActive: true,
      },
    ])
    render(<ProductEquivalentsTab productId={1} />)
    expect(await screen.findByText(/Alternate Pad/)).toBeInTheDocument()
    expect(screen.getByText("AP-002")).toBeInTheDocument()
    expect(screen.getByText("7 pcs")).toBeInTheDocument()
  })

  it("flags an inactive equivalent", async () => {
    const { getProductEquivalents } = await import("@/lib/tauri")
    vi.mocked(getProductEquivalents).mockResolvedValueOnce([
      {
        id: 1, productId: 1, equivalentProductId: 3, note: undefined, createdAt: "2024-01-01T00:00:00Z",
        name: "Old Pad", sku: "OP-003", brandName: undefined, categoryName: undefined,
        stockQuantity: 0, unit: "pcs", salePrice: 18, wholesalePrice: 14, taxRate: 0.13,
        imageUrl: undefined, isActive: false,
      },
    ])
    render(<ProductEquivalentsTab productId={1} />)
    expect(await screen.findByText("Inactive")).toBeInTheDocument()
  })
})
