import { describe, it, expect } from "vitest"
import { PermissionService } from "@/services/permission.service"

// Mirrors the seeded `cashier` role in src-tauri/src/db/seed.rs.
const CASHIER = [
  "dashboard.view",
  "sales.view",
  "sales.create",
  "sales.quotes",
  "sales.register",
  "sales.receipts",
]

const ADMINISTRATOR = [
  ...CASHIER,
  "inventory.view",
  "purchases.view",
  "customers.view",
  "reports.view",
  "warehouse.view",
  "employees.manage",
  "admin.users.manage",
  "admin.settings.manage",
]

describe("PermissionService route access", () => {
  describe("getRoutePermission", () => {
    it("resolves module roots to their permission", () => {
      expect(PermissionService.getRoutePermission("/sales")).toBe("sales.view")
      expect(PermissionService.getRoutePermission("/inventory")).toBe("inventory.view")
      expect(PermissionService.getRoutePermission("/crm")).toBe("customers.view")
      expect(PermissionService.getRoutePermission("/employees")).toBe("employees.manage")
    })

    it("resolves child pages to the parent module permission", () => {
      expect(PermissionService.getRoutePermission("/sales/new")).toBe("sales.view")
      expect(PermissionService.getRoutePermission("/inventory/products/12/edit")).toBe("inventory.view")
      expect(PermissionService.getRoutePermission("/reports/purchasing")).toBe("reports.view")
      expect(PermissionService.getRoutePermission("/crm/customers/7")).toBe("customers.view")
    })

    it("keeps the sales customers page inside the sales module", () => {
      // /sales/customers is a sales screen, not the CRM customers module.
      expect(PermissionService.getRoutePermission("/sales/customers")).toBe("sales.view")
    })

    it("keeps /warehouse separate from /inventory", () => {
      expect(PermissionService.getRoutePermission("/warehouse")).toBe("warehouse.view")
    })

    it("gates the whole admin section", () => {
      expect(PermissionService.getRoutePermission("/admin")).toBe("admin.module")
      expect(PermissionService.getRoutePermission("/admin/users")).toBe("admin.module")
      expect(PermissionService.getRoutePermission("/admin/database")).toBe("admin.module")
    })

    it("returns null for ungated pages", () => {
      expect(PermissionService.getRoutePermission("/part-finder")).toBeNull()
      expect(PermissionService.getRoutePermission("/help")).toBeNull()
      expect(PermissionService.getRoutePermission("/manual")).toBeNull()
      expect(PermissionService.getRoutePermission("/")).toBeNull()
    })

    it("does not match a prefix that is not a path boundary", () => {
      expect(PermissionService.getRoutePermission("/salesXYZ")).toBeNull()
      expect(PermissionService.getRoutePermission("/customer-support")).toBeNull()
    })
  })

  describe("hasRouteAccess", () => {
    it("lets a cashier reach only the dashboard and the sales module", () => {
      for (const path of [
        "/dashboard",
        "/sales",
        "/sales/new",
        "/sales/history",
        "/sales/quotes",
        "/sales/quotes/new",
        "/sales/register",
        "/sales/receipts",
        "/sales/customers",
      ]) {
        expect(PermissionService.hasRouteAccess(CASHIER, path), path).toBe(true)
      }
    })

    it("blocks a cashier from every non-sales module", () => {
      for (const path of [
        "/inventory",
        "/inventory/products",
        "/purchases",
        "/purchases/orders/new",
        "/crm",
        "/customers",
        "/vehicles",
        "/warehouse",
        "/reports",
        "/employees",
        "/settings",
        "/admin",
        "/admin/users",
        "/admin/database",
      ]) {
        expect(PermissionService.hasRouteAccess(CASHIER, path), path).toBe(false)
      }
    })

    it("leaves the public tools and help open to a cashier", () => {
      expect(PermissionService.hasRouteAccess(CASHIER, "/part-finder")).toBe(true)
      expect(PermissionService.hasRouteAccess(CASHIER, "/help")).toBe(true)
      expect(PermissionService.hasRouteAccess(CASHIER, "/manual")).toBe(true)
    })

    it("lets an administrator reach every module", () => {
      for (const path of [
        "/dashboard",
        "/sales",
        "/inventory",
        "/purchases",
        "/crm",
        "/customers",
        "/warehouse",
        "/reports",
        "/employees",
        "/admin",
        "/admin/users",
      ]) {
        expect(PermissionService.hasRouteAccess(ADMINISTRATOR, path), path).toBe(true)
      }
    })

    it("blocks the admin section for a role with no admin permission", () => {
      expect(PermissionService.hasRouteAccess(CASHIER, "/admin")).toBe(false)
      expect(PermissionService.hasRouteAccess(["sales.view", "admin.audit.view"], "/admin/audit")).toBe(true)
      expect(PermissionService.hasRouteAccess(["sales.view"], "/admin/audit")).toBe(false)
    })
  })
})
