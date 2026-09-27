import { describe, it, expect, beforeAll, vi } from "vitest"
import { setupI18n } from "@/i18n/config"
import { businessErrorMessage } from "@/lib/business-errors"
import { ValidationErrors } from "@/lib/validation/errors"
import {
  createValidator,
  validateField,
  validateForm,
  getFieldError,
  formatErrors,
} from "@/lib/validation/validators"
import {
  createRequiredString,
  createOptionalString,
  createRequiredNumber,
  createEmailSchema,
  createPhoneSchema,
  createCurrencySchema,
  createEnumSchema,
  createPaginationSchema,
  createUniqueField,
  buildPaginatedQuerySchema,
} from "@/lib/validation/schemas"
import { z } from "zod"
import type { FormField } from "@/types/crud"

/**
 * Form validation is the last thing standing between a typo and a bad row in
 * the database, so the rules are asserted in both directions: what must be
 * rejected, and — just as importantly — what must be accepted. A validator that
 * rejects valid input is a shop unable to save a part.
 */

describe("createValidator", () => {
  const validator = createValidator(z.object({ name: z.string().min(1), qty: z.number() }))

  it("reports a clean result for valid data", async () => {
    expect(await validator.validate({ name: "Oil", qty: 2 })).toEqual({ valid: true, errors: {} })
  })

  it("groups issues by dotted path so nested forms can address them", async () => {
    const result = await validator.validate({ name: "", qty: 2 })
    expect(result.valid).toBe(false)
    expect(result.errors.name).toHaveLength(1)
  })

  it("collects every message for a repeated path", async () => {
    const repeated = createValidator(z.object({ code: z.string().min(5).regex(/^[0-9]+$/) }))
    const result = await repeated.validate({ code: "ab" })
    expect(result.errors.code).toHaveLength(2)
  })

  it("returns a form-level message when the schema throws something that is not a ZodError", async () => {
    const exploding = createValidator(
      z.object({}).transform(() => {
        throw new Error("boom")
      }),
    )
    const result = await exploding.validate({})
    expect(result).toEqual({ valid: false, errors: { _form: ["Error de validación inesperado"] } })
  })

  it("exposes parse and safeParse pass-throughs", () => {
    expect(validator.parse({ name: "Oil", qty: 1 })).toEqual({ name: "Oil", qty: 1 })
    expect(validator.safeParse({ name: "", qty: 1 }).success).toBe(false)
    expect(() => validator.parse({ name: "", qty: 1 })).toThrow()
  })
})

describe("validateField", () => {
  const field = (over: Partial<FormField>): FormField =>
    ({ name: "f", label: "Campo", type: "text", ...over }) as FormField

  it("requires a value when the field is required", () => {
    for (const empty of [undefined, null, ""]) {
      expect(validateField(field({ required: true }), empty)).toBe("Campo es requerido")
    }
  })

  it("accepts 0 and false for a required field", () => {
    expect(validateField(field({ required: true }), 0)).toBeUndefined()
    expect(validateField(field({ required: true }), false)).toBeUndefined()
  })

  it("defers entirely to a custom validate function when present", () => {
    const custom = field({ required: true, minLength: 5, validate: (v) => (v === "taken" ? "Ya existe" : undefined) })
    expect(validateField(custom, "taken")).toBe("Ya existe")
    expect(validateField(custom, "free")).toBeUndefined()
  })

  it("enforces min and max length on strings only", () => {
    const f = field({ minLength: 3, maxLength: 5 })
    expect(validateField(f, "ab")).toBe("Mínimo 3 caracteres")
    expect(validateField(f, "abcdef")).toBe("Máximo 5 caracteres")
    expect(validateField(f, "abcd")).toBeUndefined()
    expect(validateField(f, 12345)).toBeUndefined()
  })

  it("enforces a pattern", () => {
    const f = field({ pattern: /^[A-Z]{3}$/ })
    expect(validateField(f, "abc")).toBe("Campo inválido")
    expect(validateField(f, "ABC")).toBeUndefined()
  })

  it("validates email shape and lets an empty optional email through", () => {
    const f = field({ type: "email" })
    expect(validateField(f, "nope")).toBe("Email inválido")
    expect(validateField(f, "a@b.co")).toBeUndefined()
    expect(validateField(f, "")).toBeUndefined()
  })

  it("validates phone shape and lets an empty optional phone through", () => {
    const f = field({ type: "phone" })
    expect(validateField(f, "555-CALL")).toBe("Teléfono inválido")
    expect(validateField(f, "+1 (555) 010-2030")).toBeUndefined()
    expect(validateField(f, "")).toBeUndefined()
  })

  it("returns undefined for a valid plain field", () => {
    expect(validateField(field({}), "anything")).toBeUndefined()
  })
})

describe("validateForm", () => {
  const fields: FormField[] = [
    { name: "name", label: "Nombre", type: "text", required: true },
    { name: "email", label: "Email", type: "email" },
    { name: "notes", label: "Notas", type: "text", hidden: true, required: true },
  ]

  it("collects one message per offending field", () => {
    expect(validateForm(fields, { name: "", email: "bad" })).toEqual({
      name: "Nombre es requerido",
      email: "Email inválido",
    })
  })

  it("skips hidden fields entirely", () => {
    expect(validateForm(fields, { name: "Oil" })).toEqual({})
  })

  it("returns an empty object for a valid form", () => {
    expect(validateForm(fields, { name: "Oil", email: "a@b.co" })).toEqual({})
  })
})

describe("getFieldError / formatErrors", () => {
  it("returns the first message for a field, and undefined for an unknown one", () => {
    const errors = { name: ["primero", "segundo"] }
    expect(getFieldError(errors, "name")).toBe("primero")
    expect(getFieldError(errors, "missing")).toBeUndefined()
  })

  it("flattens every message onto separate lines", () => {
    expect(formatErrors({ a: ["one", "two"], b: ["three"] })).toBe("one\ntwo\nthree")
  })
})

describe("schema factories", () => {
  it("createRequiredString bounds the length and names the field", () => {
    const s = createRequiredString("Nombre", 2, 4)
    expect(s.safeParse("ab").success).toBe(true)
    expect(s.safeParse("a").error?.issues[0].message).toBe("Nombre debe tener al menos 2 caracteres")
    expect(s.safeParse("abcde").error?.issues[0].message).toBe("Nombre debe tener máximo 4 caracteres")
  })

  it("createOptionalString allows undefined, empty and null-ish values but bounds length", () => {
    const s = createOptionalString(5)
    expect(s.safeParse(undefined).success).toBe(true)
    expect(s.safeParse("").success).toBe(true)
    expect(s.safeParse("abcde").success).toBe(true)
    expect(s.safeParse("abcdef").success).toBe(false)
  })

  it("createRequiredNumber applies only the bounds it is given", () => {
    expect(createRequiredNumber("Precio").safeParse(0).success).toBe(true)
    expect(createRequiredNumber("Precio", 1).safeParse(0).success).toBe(false)
    expect(createRequiredNumber("Precio", undefined, 5).safeParse(6).success).toBe(false)
    expect(createRequiredNumber("Precio").safeParse(undefined).error?.issues[0].message).toBe("Precio es requerido")
  })

  it("createEmailSchema requires a valid address by default and relaxes when told to", () => {
    expect(createEmailSchema().safeParse("a@b.co").success).toBe(true)
    expect(createEmailSchema().safeParse("nope").success).toBe(false)
    expect(createEmailSchema(false).safeParse(undefined).success).toBe(true)
    expect(createEmailSchema(false).safeParse("").success).toBe(true)
  })

  it("createPhoneSchema allows the punctuation a shopkeeper actually types", () => {
    const s = createPhoneSchema()
    expect(s.safeParse("+1 (555) 010-2030").success).toBe(true)
    expect(s.safeParse("555 CALL").success).toBe(false)
    expect(s.safeParse(undefined).success).toBe(true)
    expect(createPhoneSchema(true).safeParse(undefined).success).toBe(false)
  })

  it("createCurrencySchema refuses negative money", () => {
    expect(createCurrencySchema().safeParse(-1).error?.issues[0].message).toBe("El valor no puede ser negativo")
    expect(createCurrencySchema().safeParse(0).success).toBe(true)
    expect(createCurrencySchema(false).safeParse(null).success).toBe(true)
  })

  it("createEnumSchema reports the field label rather than the raw enum", () => {
    const s = createEnumSchema(["draft", "sent"], "Estado")
    expect(s.safeParse("draft").success).toBe(true)
    expect(s.safeParse("posted").error?.issues[0].message).toBe("Estado inválido")
    expect(createEnumSchema(["draft"], "Estado", false).safeParse(null).success).toBe(true)
  })

  it("createPaginationSchema coerces strings from the URL and caps page size", () => {
    const s = createPaginationSchema()
    expect(s.parse({})).toEqual({ page: 1, pageSize: 20 })
    expect(s.parse({ page: "3", pageSize: "50" })).toEqual({ page: 3, pageSize: 50 })
    expect(s.safeParse({ page: 0 }).success).toBe(false)
    expect(s.safeParse({ pageSize: 101 }).success).toBe(false)
  })

  it("createUniqueField rejects a value the async check reports as taken", async () => {
    const taken = vi.fn().mockResolvedValue(false)
    const s = createUniqueField(taken, "SKU")
    await expect(s.safeParseAsync("ABC")).resolves.toMatchObject({ success: false })
    expect(taken).toHaveBeenCalledWith("ABC")
    const free = createUniqueField(async () => true, "SKU")
    await expect(free.safeParseAsync("ABC")).resolves.toMatchObject({ success: true })
  })
})

describe("buildPaginatedQuerySchema", () => {
  it("applies pagination defaults while leaving the rest optional", () => {
    expect(buildPaginatedQuerySchema().parse({})).toEqual({ page: 1, pageSize: 20 })
  })

  it("accepts a full query with search, sort and filters", () => {
    const parsed = buildPaginatedQuerySchema().parse({
      search: "brake",
      page: "2",
      pageSize: "25",
      sortField: "name",
      sortDirection: "desc",
      filters: [{ field: "category", operator: "in", value: ["brakes"] }],
    })
    expect(parsed).toMatchObject({ search: "brake", page: 2, pageSize: 25, sortDirection: "desc" })
  })

  it("rejects an unknown sort direction and an unknown filter operator", () => {
    expect(buildPaginatedQuerySchema().safeParse({ sortDirection: "sideways" }).success).toBe(false)
    expect(
      buildPaginatedQuerySchema().safeParse({ filters: [{ field: "a", operator: "soundsLike", value: 1 }] }).success,
    ).toBe(false)
  })
})

describe("ValidationErrors", () => {
  const err = new ValidationErrors({ name: ["required", "too short"], email: ["invalid"] })

  it("is an Error carrying its field map", () => {
    expect(err).toBeInstanceOf(Error)
    expect(err.name).toBe("ValidationErrors")
    expect(err.fields.name).toHaveLength(2)
  })

  it("exposes the first message for a field and for the whole error", () => {
    expect(err.getFieldError("name")).toBe("required")
    expect(err.getFieldError("phone")).toBeUndefined()
    expect(err.getFirstError()).toBe("required")
  })

  it("reports whether it holds any errors", () => {
    expect(err.hasErrors()).toBe(true)
    expect(new ValidationErrors({}).hasErrors()).toBe(false)
    expect(new ValidationErrors({}).getFirstError()).toBeUndefined()
  })

  it("serialises name and fields only", () => {
    expect(err.toJSON()).toEqual({ name: "ValidationErrors", fields: err.fields })
  })
})

describe("businessErrorMessage", () => {
  let i18n: ReturnType<typeof setupI18n>

  beforeAll(async () => {
    i18n = setupI18n("es")
    if (!i18n.isInitialized) await new Promise((resolve) => i18n.on("initialized", resolve))
  })

  it("translates a known backend code carried as a string", async () => {
    await i18n.changeLanguage("es")
    expect(businessErrorMessage(i18n.t, "ERROR_MULTI_STORE_REQUIRED")).toBe(
      "Esta función requiere un perfil de base de datos de múltiples tiendas.",
    )
  })

  it("translates a known backend code carried as an Error", async () => {
    await i18n.changeLanguage("en")
    expect(businessErrorMessage(i18n.t, new Error("ERROR_STORE_NOT_FOUND"))).toBe(
      "The selected store could not be found.",
    )
  })

  it("passes an unrecognised message straight through", () => {
    expect(businessErrorMessage(i18n.t, "Database is locked")).toBe("Database is locked")
    expect(businessErrorMessage(i18n.t, new Error("Database is locked"))).toBe("Database is locked")
  })

  it("stringifies anything that is neither a string nor an Error", () => {
    expect(businessErrorMessage(i18n.t, 404)).toBe("404")
    expect(businessErrorMessage(i18n.t, null)).toBe("null")
    expect(businessErrorMessage(i18n.t, undefined)).toBe("undefined")
  })

  it("has a real translation for every code it maps, in every shipped locale", async () => {
    // A code with no translation renders as the raw i18n key, which is the
    // error message the shopkeeper sees. Cheap to check, invisible in review.
    const codes = [
      "ERROR_MULTI_STORE_REQUIRED",
      "ERROR_STORE_REQUIRED",
      "ERROR_STORE_NOT_FOUND",
      "ERROR_TRANSFER_SAME_STORE",
      "ERROR_DEV_ONLY",
    ]
    for (const locale of ["es", "en"]) {
      await i18n.changeLanguage(locale)
      for (const code of codes) {
        const message = businessErrorMessage(i18n.t, code)
        expect(message, `${code} in ${locale}`).not.toBe(code)
        expect(message).not.toContain("business.errors.")
      }
    }
  })
})
