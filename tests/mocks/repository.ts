import type { Repository } from "@/lib/repository"
import type { CrudEntity, PaginatedResult, SearchRequest, FilterRequest, SortRequest, PaginationRequest } from "@/types/crud"

export function createMockRepository<T extends CrudEntity>(initialData: T[] = []): Repository<T> & { data: T[] } {
  let data = [...initialData]
  let nextId = initialData.length > 0 ? Math.max(...initialData.map((d) => Number(d.id))) + 1 : 1

  return {
    data,

    async findAll() { return [...data] },

    async findById(id: number | string) { return data.find((d) => d.id === id) ?? null },

    async create(entity: Partial<T>): Promise<T> {
      const newEntity = { ...entity, id: nextId++ } as unknown as T
      data.push(newEntity)
      return newEntity
    },

    async update(id: number | string, updates: Partial<T>): Promise<T> {
      const index = data.findIndex((d) => d.id === id)
      if (index === -1) throw new Error(`Not found: ${id}`)
      const updated = { ...data[index], ...updates, id: data[index].id }
      data[index] = updated
      return updated
    },

    async delete(id: number | string, _soft?: boolean): Promise<void> {
      data = data.filter((d) => d.id !== id)
    },

    async archive(id: number | string): Promise<T> {
      return this.update(id, { isActive: false } as Partial<T>)
    },

    async restore(id: number | string): Promise<T> {
      return this.update(id, { isActive: true } as Partial<T>)
    },

    async search(query: SearchRequest): Promise<T[]> {
      return data.filter((d) =>
        Object.values(d as object).some(
          (v) => typeof v === "string" && v.toLowerCase().includes(query.query.toLowerCase())
        )
      )
    },

    async paginate(
      pagination: PaginationRequest,
      _sort?: SortRequest,
      _filters?: FilterRequest[],
      _search?: SearchRequest
    ): Promise<PaginatedResult<T>> {
      const total = data.length
      const start = (pagination.page - 1) * pagination.pageSize
      const paged = data.slice(start, start + pagination.pageSize)
      return { data: paged, total, page: pagination.page, pageSize: pagination.pageSize, totalPages: Math.ceil(total / pagination.pageSize) }
    },

    async count(_filters?: FilterRequest[]): Promise<number> { return data.length },

    async exists(id: number | string): Promise<boolean> { return data.some((d) => d.id === id) },
  }
}
