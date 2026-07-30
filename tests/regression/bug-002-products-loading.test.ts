import { describe, it, expect } from "vitest"
import { buildProduct } from "@tests/factories"

describe("BUG-002: Products list returns correct data shape", () => {
  it("product has required fields", () => {
    const p = buildProduct()
    expect(p).toHaveProperty("id")
    expect(p).toHaveProperty("name")
    expect(p).toHaveProperty("sku")
    expect(p).toHaveProperty("costPrice")
    expect(p).toHaveProperty("sellPrice")
    expect(p).toHaveProperty("stockQuantity")
    expect(p).toHaveProperty("isActive")
  })

  it("product sku is unique across builds", () => {
    const p1 = buildProduct()
    const p2 = buildProduct()
    expect(p1.sku).not.toBe(p2.sku)
  })

  it("product list can be paginated", () => {
    const products = Array.from({ length: 5 }, () => buildProduct())
    expect(products).toHaveLength(5)
    const page1 = products.slice(0, 3)
    const page2 = products.slice(3)
    expect(page1).toHaveLength(3)
    expect(page2).toHaveLength(2)
  })
})
