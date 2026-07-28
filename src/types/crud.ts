export interface CrudEntity {
  id: number | string
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface SearchRequest {
  query: string
  fields?: string[]
}

export interface FilterRequest {
  field: string
  operator: FilterOperator
  value: unknown
}

export type FilterOperator =
  | "eq"
  | "neq"
  | "gt"
  | "gte"
  | "lt"
  | "lte"
  | "contains"
  | "startsWith"
  | "endsWith"
  | "in"
  | "notIn"
  | "between"
  | "isNull"
  | "isNotNull"

export interface SortRequest {
  field: string
  direction: "asc" | "desc"
}

export interface PaginationRequest {
  page: number
  pageSize: number
}

export interface CreateRequest<T> {
  data: T
}

export interface UpdateRequest<T> {
  id: number | string
  data: Partial<T>
}

export interface DeleteRequest {
  id: number | string
  soft?: boolean
}

export interface TableColumn<T = Record<string, unknown>> {
  id: string
  header: string
  accessorKey?: keyof T | string
  accessorFn?: (row: T) => unknown
  cell?: (row: T) => React.ReactNode
  sortable?: boolean
  filterable?: boolean
  searchable?: boolean
  hidden?: boolean
  width?: string
  minWidth?: string
  maxWidth?: string
  align?: "left" | "center" | "right"
  enableResizing?: boolean
  meta?: Record<string, unknown>
}

export interface TableAction<T = Record<string, unknown>> {
  label: string
  icon?: React.ComponentType<{ className?: string }>
  onClick: (row: T) => void
  variant?: "default" | "destructive" | "outline" | "ghost"
  permission?: string
  hidden?: (row: T) => boolean
  disabled?: (row: T) => boolean
}

export interface BulkAction<T = Record<string, unknown>> {
  label: string
  icon?: React.ComponentType<{ className?: string }>
  onClick: (rows: T[]) => void
  variant?: "default" | "destructive" | "outline" | "ghost"
  permission?: string
}

export interface FormField {
  name: string
  label: string
  type:
    | "text"
    | "number"
    | "email"
    | "password"
    | "phone"
    | "currency"
    | "textarea"
    | "checkbox"
    | "switch"
    | "select"
    | "multiSelect"
    | "radio"
    | "date"
    | "autocomplete"
    | "file"
    | "image"
  placeholder?: string
  description?: string
  required?: boolean
  disabled?: boolean
  hidden?: boolean
  options?: { label: string; value: string | number }[]
  min?: number
  max?: number
  step?: number
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  validate?: (value: unknown) => string | undefined
  defaultValue?: unknown
  className?: string
  colSpan?: 1 | 2 | 3 | 4 | 6 | 12
  section?: string
}

export interface EntityConfig<T = Record<string, unknown>> {
  name: string
  namePlural: string
  fields: FormField[]
  columns: TableColumn<T>[]
  actions?: TableAction<T>[]
  bulkActions?: BulkAction<T>[]
  permissionPrefix: string
  defaultPageSize?: number
  defaultSort?: SortRequest
  searchFields?: string[]
  filterFields?: string[]
}

export interface CrudResponse<T> {
  data: T
  message?: string
}

export interface ValidationResult {
  valid: boolean
  errors: Record<string, string[]>
}

export interface ExportConfig {
  filename: string
  format: "csv" | "xlsx" | "json"
  columns: string[]
}

export interface ImportResult {
  success: number
  errors: number
  total: number
  details: ImportError[]
}

export interface ImportError {
  row: number
  message: string
}
