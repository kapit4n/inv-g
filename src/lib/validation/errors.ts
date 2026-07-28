export class ValidationErrors extends Error {
  fields: Record<string, string[]>
  constructor(fields: Record<string, string[]>) {
    super("Validation failed")
    this.name = "ValidationErrors"
    this.fields = fields
  }

  getFieldError(field: string): string | undefined {
    return this.fields[field]?.[0]
  }

  getFirstError(): string | undefined {
    return Object.values(this.fields).flat()[0]
  }

  hasErrors(): boolean {
    return Object.keys(this.fields).length > 0
  }

  toJSON() {
    return {
      name: this.name,
      fields: this.fields,
    }
  }
}
