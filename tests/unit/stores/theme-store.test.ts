import { describe, it, expect, beforeEach } from "vitest"
import { useThemeStore } from "@/stores/theme.store"

describe("ThemeStore", () => {
  beforeEach(() => {
    useThemeStore.setState({ theme: "system" })
  })

  it("defaults to system", () => {
    expect(useThemeStore.getState().theme).toBe("system")
  })

  it("setTheme changes theme", () => {
    useThemeStore.getState().setTheme("dark")
    expect(useThemeStore.getState().theme).toBe("dark")
  })

  it("setTheme accepts light", () => {
    useThemeStore.getState().setTheme("light")
    expect(useThemeStore.getState().theme).toBe("light")
  })
})
