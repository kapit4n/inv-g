import { describe, it, expect } from "vitest"
import { useAuthStore } from "@/stores/auth.store"
import { useNotificationStore } from "@/stores/notification.store"
import { useDialogStore } from "@/stores/dialog.store"
import { useThemeStore } from "@/stores/theme.store"
import { useLanguageStore } from "@/stores/language.store"
import { useSettingsStore } from "@/stores/settings.store"
import { formatCurrency, formatNumber, formatDate, cn, slugify, truncate } from "@/lib/utils"
import { createMapper, mapList } from "@/lib/mappers"
import { CrudService } from "@/services/crud.service"
import { createMockRepository } from "@tests/mocks/repository"
import { buildProduct, buildCustomer, buildSupplier, buildUser, buildSale } from "@tests/factories"

describe("Smoke: Core Libraries Load Correctly", () => {
  it("all stores initialize without error", () => {
    expect(() => useAuthStore.getState()).not.toThrow()
    expect(() => useNotificationStore.getState()).not.toThrow()
    expect(() => useDialogStore.getState()).not.toThrow()
    expect(() => useThemeStore.getState()).not.toThrow()
    expect(() => useLanguageStore.getState()).not.toThrow()
    expect(() => useSettingsStore.getState()).not.toThrow()
  })

  it("all utility functions work", () => {
    expect(formatCurrency(100)).toBe("$100.00")
    expect(formatNumber(1000)).toBe("1,000")
    expect(formatDate("2025-06-15")).toContain("2025")
    expect(cn("a", "b")).toBe("a b")
    expect(slugify("Hello World")).toBe("hello-world")
    expect(truncate("hello world", 5)).toBe("hello...")
  })

  it("mappers work", () => {
    const mapper = createMapper<number, string>(
      (n) => `num-${n}`,
      (s) => parseInt(s.replace("num-", ""))
    )
    expect(mapper.toDomain(42)).toBe("num-42")
    expect(mapper.toPersistence("num-42")).toBe(42)
    expect(mapList([1, 2], mapper)).toEqual(["num-1", "num-2"])
  })

  it("factories produce valid entities", () => {
    expect(buildProduct().sku).toBeTruthy()
    expect(buildCustomer().name).toBeTruthy()
    expect(buildSupplier().name).toBeTruthy()
    expect(buildUser().username).toBeTruthy()
    expect(buildSale().saleNumber).toBeTruthy()
  })

  it("crud service works end-to-end", async () => {
    const repo = createMockRepository([buildProduct({ id: 1 })])
    const service = new CrudService({ repository: repo, entityName: "Test" })
    const all = await service.findAll()
    expect(all).toHaveLength(1)
    const created = await service.create(buildProduct({ id: 0 }))
    expect(created.id).toBeGreaterThan(0)
    expect(await service.count()).toBe(2)
  })
})
