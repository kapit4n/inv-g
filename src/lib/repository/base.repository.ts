import type {
  CrudEntity,
  PaginatedResult,
  SearchRequest,
  FilterRequest,
  SortRequest,
  PaginationRequest,
} from "@/types/crud"

export interface Repository<T extends CrudEntity> {
  findAll(): Promise<T[]>
  findById(id: number | string): Promise<T | null>
  search(query: SearchRequest): Promise<T[]>
  paginate(
    pagination: PaginationRequest,
    sort?: SortRequest,
    filters?: FilterRequest[],
    search?: SearchRequest
  ): Promise<PaginatedResult<T>>
  create(data: Partial<T>): Promise<T>
  update(id: number | string, data: Partial<T>): Promise<T>
  delete(id: number | string, soft?: boolean): Promise<void>
  archive(id: number | string): Promise<T>
  restore(id: number | string): Promise<T>
  count(filters?: FilterRequest[]): Promise<number>
  exists(id: number | string): Promise<boolean>
}

export abstract class BaseRepository<T extends CrudEntity> implements Repository<T> {
  abstract findAll(): Promise<T[]>
  abstract findById(id: number | string): Promise<T | null>
  abstract search(query: SearchRequest): Promise<T[]>
  abstract paginate(
    pagination: PaginationRequest,
    sort?: SortRequest,
    filters?: FilterRequest[],
    search?: SearchRequest
  ): Promise<PaginatedResult<T>>
  abstract create(data: Partial<T>): Promise<T>
  abstract update(id: number | string, data: Partial<T>): Promise<T>
  abstract delete(id: number | string, soft?: boolean): Promise<void>
  abstract archive(id: number | string): Promise<T>
  abstract restore(id: number | string): Promise<T>
  abstract count(filters?: FilterRequest[]): Promise<number>
  abstract exists(id: number | string): Promise<boolean>
}
