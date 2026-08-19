import { describe, it, expect, beforeEach } from "vitest"
import { cycleTheme } from "@/lib/theme-cycle"

describe("cycleTheme", () => {
  beforeEach(() => {
    document.documentElement.classList.remove("dark", "light")
    document.documentElement.removeAttribute("data-theme")
  })

  it("cycles from no theme to light", () => {
    const result = cycleTheme()
    expect(result).toBe("light")
    expect(document.documentElement.getAttribute("data-theme")).toBe("light")
  })

  it("cycles from light to dark", () => {
    document.documentElement.classList.add("light")
    document.documentElement.setAttribute("data-theme", "light")
    const result = cycleTheme()
    expect(result).toBe("dark")
    expect(document.documentElement.classList.contains("dark")).toBe(true)
  })

  it("cycles from dark to system", () => {
    document.documentElement.classList.add("dark")
    document.documentElement.setAttribute("data-theme", "dark")
    const result = cycleTheme()
    expect(result).toBe("system")
    expect(document.documentElement.classList.contains("dark")).toBe(false)
  })

  it("cycles from system to light", () => {
    document.documentElement.setAttribute("data-theme", "system")
    const result = cycleTheme()
    expect(result).toBe("light")
    expect(document.documentElement.getAttribute("data-theme")).toBe("light")
  })
})
