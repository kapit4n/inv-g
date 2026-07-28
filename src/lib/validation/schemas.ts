import { z } from "zod"

export { z }

export function createRequiredString(label: string, min = 1, max = 255) {
  return z
    .string()
    .min(min, `${label} debe tener al menos ${min} caracteres`)
    .max(max, `${label} debe tener máximo ${max} caracteres`)
}

export function createOptionalString(max = 255) {
  return z.string().max(max).optional().or(z.literal(""))
}

export function createRequiredNumber(label: string, min?: number, max?: number) {
  let schema = z.number({ required_error: `${label} es requerido` })
  if (min !== undefined) schema = schema.min(min)
  if (max !== undefined) schema = schema.max(max)
  return schema
}

export function createOptionalNumber() {
  return z.number().optional().nullable()
}

export function createEmailSchema(required = true) {
  const schema = z.string().email("Email inválido").max(255)
  return required ? schema : schema.optional().or(z.literal(""))
}

export function createPhoneSchema(required = false) {
  const schema = z
    .string()
    .regex(/^[\d\s\-+()]*$/, "Teléfono inválido")
    .max(50)
  return required ? schema : schema.optional().or(z.literal(""))
}

export function createCurrencySchema(required = true) {
  let schema = z.number({ required_error: "El valor es requerido" })
  schema = schema.min(0, "El valor no puede ser negativo")
  return required
    ? schema
    : schema.optional().nullable()
}

export function createBooleanSchema() {
  return z.boolean()
}

export function createDateSchema(required = false) {
  const schema = z.string().or(z.date())
  return required ? schema : schema.optional().nullable()
}

export function createEnumSchema<T extends readonly string[]>(
  values: T,
  label: string,
  required = true
) {
  const schema = z.enum(values as unknown as [string, ...string[]], {
    errorMap: () => ({ message: `${label} inválido` }),
  })
  return required ? schema : schema.optional().nullable()
}

export function createPaginationSchema() {
  return z.object({
    page: z.coerce.number().min(1).default(1),
    pageSize: z.coerce.number().min(1).max(100).default(20),
  })
}

export function createSortSchema() {
  return z.object({
    field: z.string(),
    direction: z.enum(["asc", "desc"]),
  })
}

export function createFilterSchema() {
  return z.object({
    field: z.string(),
    operator: z.enum([
      "eq", "neq", "gt", "gte", "lt", "lte",
      "contains", "startsWith", "endsWith",
      "in", "notIn", "between", "isNull", "isNotNull",
    ]),
    value: z.unknown(),
  })
}

export function createSearchSchema() {
  return z.object({
    query: z.string().max(255),
    fields: z.array(z.string()).optional(),
  })
}

export function createIdSchema() {
  return z.union([z.number(), z.string()])
}

export function createUniqueField(
  validateFn: (value: string) => Promise<boolean>,
  label: string
) {
  return z.string().refine(
    async (val) => {
      const isUnique = await validateFn(val)
      return isUnique
    },
    { message: `${label} ya existe` }
  )
}

export function buildPaginatedQuerySchema() {
  return z.object({
    search: z.string().optional(),
    page: z.coerce.number().min(1).default(1),
    pageSize: z.coerce.number().min(1).max(100).default(20),
    sortField: z.string().optional(),
    sortDirection: z.enum(["asc", "desc"]).optional(),
    filters: z.array(createFilterSchema()).optional(),
  })
}
