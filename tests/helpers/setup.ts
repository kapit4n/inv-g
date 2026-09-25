import "@testing-library/jest-dom"

vi.stubGlobal("crypto", {
  randomUUID: () => "00000000-0000-0000-0000-000000000000",
})

if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = vi.fn()
}

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
  getBusinessContext: vi.fn().mockResolvedValue({
    activeProfile: "multi-store",
    databasePath: "",
    multiStore: true,
    storeCount: 3,
    defaultStoreId: null,
    stores: [
      { id: 1, name: "Central Store", code: "WH-001", isActive: true, isDefault: true },
      { id: 2, name: "North Branch", code: "WH-002", isActive: true, isDefault: false },
      { id: 3, name: "South Branch", code: "WH-003", isActive: true, isDefault: false },
    ],
    capabilities: { multiStore: true, storeSelection: true, storeManagement: true, storeTransfers: true, crossStoreReports: true },
    devMode: true,
  }),
  getBusinessCapabilities: vi.fn().mockResolvedValue({
    multiStore: true,
    storeSelection: true,
    storeManagement: true,
    storeTransfers: true,
    crossStoreReports: true,
  }),
  switchDatabaseProfile: vi.fn().mockResolvedValue("Profile switched. Restart required."),
  transferInventoryBetweenStores: vi.fn().mockResolvedValue("TRX-000001"),
  getStoreSales: vi.fn().mockResolvedValue([
    { storeId: 1, storeName: "Central Store", storeCode: "WH-001", salesCount: 10, totalRevenue: 1200, cashTotal: 800, cardTotal: 400, transferTotal: 0 },
    { storeId: 2, storeName: "North Branch", storeCode: "WH-002", salesCount: 4, totalRevenue: 450, cashTotal: 300, cardTotal: 150, transferTotal: 0 },
  ]),
  getStoreInventory: vi.fn().mockResolvedValue([
    { storeId: 1, storeName: "Central Store", storeCode: "WH-001", productCount: 80, totalStockUnits: 950, inventoryValue: 25000 },
    { storeId: 2, storeName: "North Branch", storeCode: "WH-002", productCount: 40, totalStockUnits: 310, inventoryValue: 8100 },
  ]),
}))

// Radix overlays (Popover, Select, DropdownMenu) position themselves with Popper,
// which observes its trigger for size changes and captures pointers to tell a
// click inside from a click outside. jsdom implements neither, so opening any of
// them throws. This has bitten every overlay component the first time it was
// rendered under test.
if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}

if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false
  Element.prototype.setPointerCapture = () => {}
  Element.prototype.releasePointerCapture = () => {}
}
