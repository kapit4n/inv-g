import { describe, it, expect } from "vitest"
import { slugify, truncate, cn, generateId, delay } from "@/lib/utils"

describe("slugify", () => {
  it("converts to lowercase", () => {
    expect(slugify("Hello World")).toBe("hello-world")
  })

  it("removes special characters", () => {
    expect(slugify("Hello! @World#")).toBe("hello-world")
  })

  it("replaces spaces with hyphens", () => {
    expect(slugify("hello world test")).toBe("hello-world-test")
  })

  it("handles multiple hyphens", () => {
    expect(slugify("hello---world")).toBe("hello-world")
  })

  it("handles empty string", () => {
    expect(slugify("")).toBe("")
  })
})

describe("truncate", () => {
  it("returns full text when shorter than length", () => {
    expect(truncate("hello", 10)).toBe("hello")
  })

  it("truncates and adds ellipsis", () => {
    expect(truncate("hello world this is long", 10)).toBe("hello worl...")
  })

  it("handles empty string", () => {
    expect(truncate("", 5)).toBe("")
  })

  it("handles exact length", () => {
    expect(truncate("hello", 5)).toBe("hello")
  })
})

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar")
  })

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "extra")).toBe("base extra")
  })

  it("handles empty inputs", () => {
    expect(cn()).toBe("")
  })
})

describe("generateId", () => {
  it("returns a UUID string", () => {
    const id = generateId()
    expect(id).toBe("00000000-0000-0000-0000-000000000000")
  })
})

describe("delay", () => {
  it("resolves after given ms", async () => {
    const start = Date.now()
    await delay(5)
    expect(Date.now() - start).toBeGreaterThanOrEqual(4)
  })
})
