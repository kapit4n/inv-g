import type { CrudEntity, PaginatedResult, SearchRequest, FilterRequest, SortRequest, PaginationRequest, ValidationResult } from "@/types/crud"
import type { Repository } from "@/lib/repository"
import { createValidator } from "@/lib/validation"
import type { z } from "zod"

export interface CrudServiceConfig<T extends CrudEntity> {
  repository: Repository<T>
  schema?: z.ZodType<Partial<T>>
  entityName: string
  onError?: (error: unknown) => void
  onSuccess?: (action: string, entity?: T) => void
}

export class CrudService<T extends CrudEntity> {
  private repository: Repository<T>
  private validator: ReturnType<typeof createValidator> | null
  constructor(config: CrudServiceConfig<T>) {
    this.repository = config.repository
    this.validator = config.schema ? createValidator(config.schema) : null
  }

  async findAll(): Promise<T[]> {
    return this.execute("findAll", () => this.repository.findAll())
  }

  async findById(id: number | string): Promise<T | null> {
    return this.execute("findById", () => this.repository.findById(id))
  }

  async search(query: SearchRequest): Promise<T[]> {
    return this.execute("search", () => this.repository.search(query))
  }

  async paginate(
    pagination: PaginationRequest,
    sort?: SortRequest,
    filters?: FilterRequest[],
    search?: SearchRequest
  ): Promise<PaginatedResult<T>> {
    return this.execute("paginate", () =>
      this.repository.paginate(pagination, sort, filters, search)
    )
  }

  async create(data: Partial<T>): Promise<T> {
    await this.validate(data)
    const entity = await this.execute("create", () => this.repository.create(data))
    return entity
  }

  async update(id: number | string, data: Partial<T>): Promise<T> {
    await this.validate(data)
    const entity = await this.execute("update", () => this.repository.update(id, data))
    return entity
  }

  async delete(id: number | string, soft?: boolean): Promise<void> {
    return this.execute("delete", () => this.repository.delete(id, soft))
  }

  async archive(id: number | string): Promise<T> {
    return this.execute("archive", () => this.repository.archive(id))
  }

  async restore(id: number | string): Promise<T> {
    return this.execute("restore", () => this.repository.restore(id))
  }

  async count(filters?: FilterRequest[]): Promise<number> {
    return this.execute("count", () => this.repository.count(filters))
  }

  async exists(id: number | string): Promise<boolean> {
    return this.execute("exists", () => this.repository.exists(id))
  }

  private async validate(data: Partial<T>): Promise<void> {
    if (!this.validator) return
    const result: ValidationResult = await this.validator.validate(data)
    if (!result.valid) {
      throw result
    }
  }

  private async execute<R>(_action: string, fn: () => Promise<R>): Promise<R> {
    try {
      const result = await fn()
      return result
    } catch (error) {
      throw error
    }
  }
}
