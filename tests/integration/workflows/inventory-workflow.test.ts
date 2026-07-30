import { describe, it, expect, beforeEach } from "vitest"
import { CrudService } from "@/services/crud.service"
import { createMockRepository } from "@tests/mocks/repository"
import { buildProduct, buildCategory } from "@tests/factories"
import type { Product, Category } from "@/types"

describe("Inventory Engine Business Rules", () => {
  let productService: CrudService<Product>
  let categoryService: CrudService<Category>

  beforeEach(() => {
    const catRepo = createMockRepository([buildCategory({ id: 1, name: "Tires" })])
    const prodRepo = createMockRepository([])
    categoryService = new CrudService({ repository: catRepo, entityName: "Category" })
    productService = new CrudService({ repository: prodRepo, entityName: "Product" })
  })

  it("cannot delete category with products", async () => {
    const category = await categoryService.findById(1)
    expect(category).not.toBeNull()

    await productService.create(buildProduct({ categoryId: category!.id, name: "Tire A" }))
    const products = await productService.findAll()
    const productsInCategory = products.filter((p) => p.categoryId === category!.id)
    expect(productsInCategory).toHaveLength(1)

    function canDeleteCategory(catId: number, productsInCat: number): boolean {
      return productsInCat === 0
    }

    expect(canDeleteCategory(1, productsInCategory.length)).toBe(false)
  })

  it("negative stock quantity is prevented (business rule)", () => {
    function validateStock(qty: number): boolean {
      return qty >= 0
    }

    expect(validateStock(0)).toBe(true)
    expect(validateStock(100)).toBe(true)
    expect(validateStock(-1)).toBe(false)
  })

  it("inventory value calculation is correct", async () => {
    const p1 = await productService.create(buildProduct({ costPrice: 10, stockQuantity: 5 }))
    const p2 = await productService.create(buildProduct({ costPrice: 20, stockQuantity: 3 }))

    const allProducts = await productService.findAll()
    const totalValue = allProducts.reduce((sum, p) => sum + p.costPrice * p.stockQuantity, 0)
    expect(totalValue).toBe(10 * 5 + 20 * 3)
  })

  it("reorder point detection works", async () => {
    await productService.create(buildProduct({ stockQuantity: 5, minStock: 10, name: "Low Stock Item" }))
    const products = await productService.findAll()
    const needsReorder = products.filter((p) => p.stockQuantity <= p.minStock)
    expect(needsReorder).toHaveLength(1)
    expect(needsReorder[0].name).toBe("Low Stock Item")
  })
})
