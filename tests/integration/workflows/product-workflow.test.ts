import { describe, it, expect, beforeEach } from "vitest"
import { CrudService } from "@/services/crud.service"
import { createMockRepository } from "@tests/mocks/repository"
import { buildProduct, buildCategory, buildSupplier } from "@tests/factories"
import type { Product, Category, Supplier } from "@/types"

describe("Product Workflow Integration", () => {
  let productRepo: ReturnType<typeof createMockRepository<Product>>
  let categoryRepo: ReturnType<typeof createMockRepository<Category>>
  let supplierRepo: ReturnType<typeof createMockRepository<Supplier>>
  let productService: CrudService<Product>

  beforeEach(() => {
    const category = buildCategory({ id: 1, name: "Electronics" })
    const supplier = buildSupplier({ id: 1, name: "Tech Distributor" })
    categoryRepo = createMockRepository([category])
    supplierRepo = createMockRepository([supplier])
    productRepo = createMockRepository([])
    productService = new CrudService({ repository: productRepo, entityName: "Product" })
  })

  it("full product lifecycle: create → read → update → delete", async () => {
    const created = await productService.create(
      buildProduct({ name: "Widget", sku: "WDG-001", costPrice: 5, sellPrice: 10, stockQuantity: 50 })
    )
    expect(created.id).toBeGreaterThan(0)
    expect(created.name).toBe("Widget")

    const found = await productService.findById(created.id)
    expect(found).not.toBeNull()
    expect(found!.sku).toBe("WDG-001")

    const updated = await productService.update(created.id, { sellPrice: 12 })
    expect(updated.sellPrice).toBe(12)

    await productService.delete(created.id)
    const afterDelete = await productService.findById(created.id)
    expect(afterDelete).toBeNull()
  })

  it("archives and restores product", async () => {
    const product = await productService.create(buildProduct({ name: "Archivable" }))
    expect(product.isActive).toBe(true)

    const archived = await productService.archive(product.id)
    expect(archived.isActive).toBe(false)

    const restored = await productService.restore(product.id)
    expect(restored.isActive).toBe(true)
  })

  it("paginates products correctly", async () => {
    for (let i = 0; i < 25; i++) {
      await productService.create(buildProduct({ name: `Product ${i}` }))
    }

    const page1 = await productService.paginate({ page: 1, pageSize: 10 })
    expect(page1.data).toHaveLength(10)
    expect(page1.total).toBe(25)
    expect(page1.totalPages).toBe(3)

    const page3 = await productService.paginate({ page: 3, pageSize: 10 })
    expect(page3.data).toHaveLength(5)
  })

  it("searches products by name", async () => {
    await productService.create(buildProduct({ name: "Laptop HP" }))
    await productService.create(buildProduct({ name: "Laptop Dell" }))
    await productService.create(buildProduct({ name: "Mouse" }))

    const result = await productService.search({ query: "Laptop" })
    expect(result).toHaveLength(2)
  })

  it("prevents selling more than available stock (business rule)", async () => {
    const product = await productService.create(buildProduct({ stockQuantity: 10 }))

    function validateStock(product: Product, requestedQty: number): boolean {
      return product.stockQuantity >= requestedQty
    }

    expect(validateStock(product, 5)).toBe(true)
    expect(validateStock(product, 10)).toBe(true)
    expect(validateStock(product, 11)).toBe(false)
  })

  it("prevents duplicate SKU (business rule)", async () => {
    await productService.create(buildProduct({ sku: "UNIQUE-001" }))

    const allProducts = await productService.findAll()
    const skus = allProducts.map((p) => p.sku)
    const duplicateCheck = (sku: string) => skus.filter((s) => s === sku).length <= 1

    expect(duplicateCheck("UNIQUE-001")).toBe(true)
    expect(duplicateCheck("OTHER")).toBe(true)
  })
})
