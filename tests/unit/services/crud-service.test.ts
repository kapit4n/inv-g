import { describe, it, expect, beforeEach } from "vitest"
import { CrudService } from "@/services/crud.service"
import { createMockRepository } from "@tests/mocks/repository"
import { buildProduct } from "@tests/factories"

describe("CrudService", () => {
  let repo: ReturnType<typeof createMockRepository<any>>
  let service: CrudService<any>

  beforeEach(() => {
    repo = createMockRepository([buildProduct({ id: 1 }), buildProduct({ id: 2 })])
    service = new CrudService({ repository: repo, entityName: "Product" })
  })

  it("findAll returns all entities", async () => {
    const result = await service.findAll()
    expect(result).toHaveLength(2)
  })

  it("findById returns entity", async () => {
    const result = await service.findById(1)
    expect(result).not.toBeNull()
    expect(result.id).toBe(1)
  })

  it("findById returns null for missing", async () => {
    const result = await service.findById(999)
    expect(result).toBeNull()
  })

  it("paginate returns paginated result", async () => {
    const result = await service.paginate({ page: 1, pageSize: 10 })
    expect(result.data).toHaveLength(2)
    expect(result.total).toBe(2)
    expect(result.totalPages).toBe(1)
  })

  it("create adds entity", async () => {
    const result = await service.create(buildProduct({ id: 0 }))
    expect(result.id).toBe(3)
    const all = await service.findAll()
    expect(all).toHaveLength(3)
  })

  it("update modifies entity", async () => {
    const result = await service.update(1, { name: "Updated" })
    expect(result.name).toBe("Updated")
  })

  it("update throws for missing entity", async () => {
    await expect(service.update(999, { name: "x" })).rejects.toThrow()
  })

  it("delete removes entity", async () => {
    await service.delete(1)
    const all = await service.findAll()
    expect(all).toHaveLength(1)
  })

  it("archive sets isActive to false", async () => {
    const result = await service.archive(1)
    expect(result.isActive).toBe(false)
  })

  it("restore sets isActive to true", async () => {
    await service.archive(1)
    const result = await service.restore(1)
    expect(result.isActive).toBe(true)
  })

  it("count returns total", async () => {
    const count = await service.count()
    expect(count).toBe(2)
  })

  it("exists returns true for existing", async () => {
    expect(await service.exists(1)).toBe(true)
  })

  it("exists returns false for missing", async () => {
    expect(await service.exists(999)).toBe(false)
  })

  it("search finds matching entities", async () => {
    const result = await service.search({ query: "Product" })
    expect(result).toHaveLength(2)
  })
})
