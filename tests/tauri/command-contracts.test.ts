import { describe, it, expect } from "vitest"
import * as tauri from "@/lib/tauri"

describe("Tauri Command Contracts", () => {
  it("getAppVersion returns string", async () => {
    const result = await tauri.getAppVersion()
    expect(typeof result).toBe("string")
    expect(result).toBe("0.1.0")
  })

  it("healthCheck returns string", async () => {
    const result = await tauri.healthCheck()
    expect(typeof result).toBe("string")
  })

  it("greet returns personalized greeting", async () => {
    const result = await tauri.greet("Tester")
    expect(typeof result).toBe("string")
    expect(result.length).toBeGreaterThan(0)
  })

  it("login returns session with user, token, and permissions", async () => {
    const result = await tauri.login("admin", "password")
    expect(result).toHaveProperty("user")
    expect(result).toHaveProperty("token")
    expect(result).toHaveProperty("permissions")
    expect(result.user).toHaveProperty("id")
    expect(result.user).toHaveProperty("username")
    expect(result.user).toHaveProperty("email")
    expect(Array.isArray(result.permissions)).toBe(true)
  })

  it("loginByRole returns session", async () => {
    const result = await tauri.loginByRole("Admin")
    expect(result).toHaveProperty("token")
    expect(result.permissions).toContain("*")
  })

  it("logout completes without error", async () => {
    await expect(tauri.logout("test-token")).resolves.toBeUndefined()
  })

  it("getCurrentUser returns session info", async () => {
    const result = await tauri.getCurrentUser("test-token")
    expect(result).toHaveProperty("user")
    expect(result).toHaveProperty("permissions")
    expect(result).toHaveProperty("expiresAt")
  })

  it("checkSession returns boolean", async () => {
    const result = await tauri.checkSession("test-token")
    expect(typeof result).toBe("boolean")
    expect(result).toBe(true)
  })

  it("getUserPermissionsList returns array", async () => {
    const result = await tauri.getUserPermissionsList()
    expect(Array.isArray(result)).toBe(true)
  })

  it("getSettings returns array", async () => {
    const result = await tauri.getSettings()
    expect(Array.isArray(result)).toBe(true)
  })

  it("runSeeds returns success message", async () => {
    const result = await tauri.runSeeds()
    expect(typeof result).toBe("string")
  })
})
