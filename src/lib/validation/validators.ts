import { z } from "zod"
import type { ValidationResult, FormField } from "@/types/crud"

export function createValidator<T extends z.ZodType>(schema: T) {
  return {
    validate: async (data: unknown): Promise<ValidationResult> => {
      try {
        await schema.parseAsync(data)
        return { valid: true, errors: {} }
      } catch (error) {
        if (error instanceof z.ZodError) {
          const errors: Record<string, string[]> = {}
          for (const issue of error.issues) {
            const path = issue.path.join(".")
            if (!errors[path]) errors[path] = []
            errors[path].push(issue.message)
          }
          return { valid: false, errors }
        }
        return { valid: false, errors: { _form: ["Error de validación inesperado"] } }
      }
    },
    parse: (data: unknown) => schema.parse(data),
    safeParse: (data: unknown) => schema.safeParse(data),
  }
}

export function validateField(field: FormField, value: unknown): string | undefined {
  if (field.required && (value === undefined || value === null || value === "")) {
    return `${field.label} es requerido`
  }
  if (field.validate) {
    return field.validate(value)
  }
  if (field.minLength && typeof value === "string" && value.length < field.minLength) {
    return `Mínimo ${field.minLength} caracteres`
  }
  if (field.maxLength && typeof value === "string" && value.length > field.maxLength) {
    return `Máximo ${field.maxLength} caracteres`
  }
  if (field.pattern && typeof value === "string" && !field.pattern.test(value)) {
    return `${field.label} inválido`
  }
  if (field.type === "email" && typeof value === "string" && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return "Email inválido"
  }
  if (field.type === "phone" && typeof value === "string" && value && !/^[\d\s\-+()]*$/.test(value)) {
    return "Teléfono inválido"
  }
  return undefined
}

export function validateForm(fields: FormField[], data: Record<string, unknown>): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const field of fields) {
    if (field.hidden) continue
    const error = validateField(field, data[field.name])
    if (error) errors[field.name] = error
  }
  return errors
}

export function getFieldError(errors: Record<string, string[]>, fieldName: string): string | undefined {
  return errors[fieldName]?.[0]
}

export function formatErrors(errors: Record<string, string[]>): string {
  return Object.values(errors)
    .flat()
    .join("\n")
}
