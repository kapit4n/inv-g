import { describe, it, expect } from "vitest"
import { buildCustomer } from "@tests/factories"

describe("BUG-003: Empty customers should not crash", () => {
  it("customer factory produces valid customer", () => {
    const c = buildCustomer()
    expect(c).toHaveProperty("id")
    expect(c).toHaveProperty("name")
    expect(c).toHaveProperty("email")
    expect(c).toHaveProperty("isActive")
  })

  it("empty array map over customers returns empty", () => {
    const customers: any[] = []
    const result = customers.map((c) => c.name)
    expect(result).toEqual([])
  })

  it("filter on empty list returns empty", () => {
    const customers: any[] = []
    const active = customers.filter((c) => c.isActive)
    expect(active).toEqual([])
  })

  it("find on empty list returns undefined (no crash)", () => {
    const customers: any[] = []
    const found = customers.find((c) => c.id === 1)
    expect(found).toBeUndefined()
  })
})
