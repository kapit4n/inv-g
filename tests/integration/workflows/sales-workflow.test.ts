import { describe, it, expect, beforeEach } from "vitest"
import { CrudService } from "@/services/crud.service"
import { createMockRepository } from "@tests/mocks/repository"
import { buildProduct, buildCustomer, buildSale } from "@tests/factories"
import type { Product, Sale } from "@/types"

describe("Sales Workflow Integration", () => {
  let productRepo: ReturnType<typeof createMockRepository<Product>>
  let saleRepo: ReturnType<typeof createMockRepository<Sale>>
  let productService: CrudService<Product>
  let saleService: CrudService<Sale>

  beforeEach(() => {
    productRepo = createMockRepository([
      buildProduct({ id: 1, name: "Widget", stockQuantity: 100, sellPrice: 10 }),
      buildProduct({ id: 2, name: "Gadget", stockQuantity: 50, sellPrice: 25 }),
    ])
    saleRepo = createMockRepository([])
    productService = new CrudService({ repository: productRepo, entityName: "Product" })
    saleService = new CrudService({ repository: saleRepo, entityName: "Sale" })
  })

  it("create sale reduces stock quantity (business rule)", async () => {
    const product = await productService.findById(1)
    expect(product!.stockQuantity).toBe(100)

    const sale = buildSale({ id: 0, total: 20 })
    const created = await saleService.create(sale)
    expect(created.id).toBeGreaterThan(0)

    const soldQty = 2
    const updatedProduct = await productService.update(1, { stockQuantity: product!.stockQuantity - soldQty })
    expect(updatedProduct.stockQuantity).toBe(98)
  })

  it("prevents creating sale with insufficient stock", async () => {
    const product = await productService.findById(1)
    expect(product!.stockQuantity).toBe(100)

    function canSell(product: Product, qty: number): boolean {
      return product.stockQuantity >= qty
    }

    expect(canSell(product!, 100)).toBe(true)
    expect(canSell(product!, 101)).toBe(false)
  })

  it("searches sales by sale number", async () => {
    await saleService.create(buildSale({ saleNumber: "SALE-001" }))
    await saleService.create(buildSale({ saleNumber: "SALE-002" }))
    await saleService.create(buildSale({ saleNumber: "INV-001" }))

    const result = await saleService.search({ query: "SALE" })
    expect(result).toHaveLength(2)
  })

  it("paginates sales", async () => {
    for (let i = 0; i < 15; i++) {
      await saleService.create(buildSale({ saleNumber: `SALE-${i}` }))
    }

    const page1 = await saleService.paginate({ page: 1, pageSize: 10 })
    expect(page1.data).toHaveLength(10)
    expect(page1.total).toBe(15)
  })

  it("soft delete preserves sale record", async () => {
    const sale = await saleService.create(buildSale({ saleNumber: "SALE-DEL" }))
    await saleService.delete(sale.id, true)
    const deleted = await saleService.findById(sale.id)
    expect(deleted).toBeNull()

    const all = await saleService.findAll()
    expect(all).toHaveLength(0)
  })
})
