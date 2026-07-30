import { describe, it, expect } from "vitest"
import { createMapper, mapList, createSimpleMapper, pick, omit } from "@/lib/mappers"

interface Source { id: number; name: string; extra: string }
interface Target { id: number; displayName: string }

describe("createMapper", () => {
  it("maps both directions", () => {
    const mapper = createMapper<Source, Target>(
      (s) => ({ id: s.id, displayName: s.name }),
      (t) => ({ id: t.id, name: t.displayName, extra: "" })
    )
    expect(mapper.toDomain({ id: 1, name: "test", extra: "x" })).toEqual({ id: 1, displayName: "test" })
    expect(mapper.toPersistence({ id: 1, displayName: "test" })).toEqual({ id: 1, name: "test", extra: "" })
  })
})

describe("mapList", () => {
  it("maps array of items", () => {
    const mapper = createMapper<Source, Target>(
      (s) => ({ id: s.id, displayName: s.name }),
      () => ({ id: 0, displayName: "" })
    )
    const result = mapList([{ id: 1, name: "a", extra: "" }, { id: 2, name: "b", extra: "" }], mapper)
    expect(result).toEqual([{ id: 1, displayName: "a" }, { id: 2, displayName: "b" }])
  })

  it("returns empty array for empty input", () => {
    const mapper = createSimpleMapper<number>()
    expect(mapList([], mapper)).toEqual([])
  })
})

describe("createSimpleMapper", () => {
  it("returns identity mapper", () => {
    const mapper = createSimpleMapper<number>()
    expect(mapper.toDomain(42)).toBe(42)
    expect(mapper.toPersistence(42)).toBe(42)
  })
})

describe("pick", () => {
  it("selects specified keys", () => {
    const obj = { a: 1, b: 2, c: 3 }
    expect(pick(obj, ["a", "c"])).toEqual({ a: 1, c: 3 })
  })

  it("handles missing keys gracefully", () => {
    const obj = { a: 1 }
    expect(pick(obj, ["a", "b"])).toEqual({ a: 1 })
  })

  it("returns empty for no keys", () => {
    expect(pick({ a: 1 }, [])).toEqual({})
  })
})

describe("omit", () => {
  it("omits specified keys", () => {
    const obj = { a: 1, b: 2, c: 3 }
    expect(omit(obj, ["b"])).toEqual({ a: 1, c: 3 })
  })

  it("returns full object when omitting missing key", () => {
    const obj = { a: 1 }
    expect(omit(obj, ["b"])).toEqual({ a: 1 })
  })

  it("returns empty when omitting all keys", () => {
    expect(omit({ a: 1, b: 2 }, ["a", "b"])).toEqual({})
  })
})
