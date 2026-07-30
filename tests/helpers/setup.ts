import "@testing-library/jest-dom"

vi.stubGlobal("crypto", {
  randomUUID: () => "00000000-0000-0000-0000-000000000000",
})

vi.stubGlobal("localStorage", {
  _store: {} as Record<string, string>,
  getItem(key: string) { return this._store[key] ?? null },
  setItem(key: string, value: string) { this._store[key] = value },
  removeItem(key: string) { delete this._store[key] },
  clear() { this._store = {} },
  get length() { return Object.keys(this._store).length },
  key(index: number) { return Object.keys(this._store)[index] ?? null },
})

vi.mock("@/lib/tauri", () => ({
  getAppVersion: vi.fn().mockResolvedValue("0.1.0"),
  healthCheck: vi.fn().mockResolvedValue("Inventory Gear is running"),
  greet: vi.fn().mockResolvedValue("Hello, test!"),
  runSeeds: vi.fn().mockResolvedValue("Seeds executed"),
  login: vi.fn().mockResolvedValue({
    user: { id: 1, username: "admin", email: "admin@test.com", fullName: "Admin User", roleId: 1, roleName: "Admin", isActive: true, createdAt: "2025-01-01T00:00:00Z" },
    token: "test-token",
    permissions: ["*"],
  }),
  loginByRole: vi.fn().mockResolvedValue({
    user: { id: 1, username: "admin", email: "admin@test.com", fullName: "Admin User", roleId: 1, roleName: "Admin", isActive: true, createdAt: "2025-01-01T00:00:00Z" },
    token: "test-token",
    permissions: ["*"],
  }),
  logout: vi.fn().mockResolvedValue(undefined),
  getCurrentUser: vi.fn().mockResolvedValue({
    user: { id: 1, username: "admin", email: "admin@test.com", fullName: "Admin User", roleId: 1, roleName: "Admin", isActive: true, createdAt: "2025-01-01T00:00:00Z" },
    permissions: ["*"],
    expiresAt: "2099-12-31T23:59:59Z",
  }),
  checkSession: vi.fn().mockResolvedValue(true),
  getUserPermissionsList: vi.fn().mockResolvedValue(["*"]),
  getSettings: vi.fn().mockResolvedValue([]),
  getSetting: vi.fn().mockResolvedValue(null),
  updateSetting: vi.fn().mockResolvedValue(undefined),
  getSettingsByGroup: vi.fn().mockResolvedValue([]),
}))
