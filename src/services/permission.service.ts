/** Internal sentinel for the Admin section: any `admin.*` permission grants access. */
const ADMIN_GATE = "admin.module"
const ADMIN_PREFIX = "/admin"

// Ordered longest-prefix-first. Module children inherit the parent permission
// (e.g. /inventory/products -> inventory.view), while /warehouse stays its own
// module and /sales/customers stays inside the sales module.
const ROUTE_PERMISSIONS: ReadonlyArray<readonly [prefix: string, permission: string]> = [
  ["/dashboard", "dashboard.view"],
  ["/sales", "sales.view"],
  ["/inventory", "inventory.view"],
  ["/purchases", "purchases.view"],
  ["/crm", "customers.view"],
  ["/customers", "customers.view"],
  ["/vehicles", "vehicles.view"],
  ["/warehouse", "warehouse.view"],
  ["/reports", "reports.view"],
  ["/employees", "employees.manage"],
  ["/settings", "settings.view"],
]

export const PermissionService = {
  hasPermission(permissions: string[], permission: string): boolean {
    return permissions.includes(permission)
  },

  hasAnyPermission(permissions: string[], checks: string[]): boolean {
    return checks.some((p) => permissions.includes(p))
  },

  hasAllPermissions(permissions: string[], checks: string[]): boolean {
    return checks.every((p) => permissions.includes(p))
  },

  canAccessRoute(permissions: string[], routePermission: string): boolean {
    if (routePermission === ADMIN_GATE) {
      return permissions.some((p) => p.startsWith("admin."))
    }
    return this.hasPermission(permissions, routePermission)
  },

  getRoutePermission(pathname: string): string | null {
    if (pathname === ADMIN_PREFIX || pathname.startsWith(ADMIN_PREFIX + "/")) {
      return ADMIN_GATE
    }
    for (const [prefix, permission] of ROUTE_PERMISSIONS) {
      if (pathname === prefix || pathname.startsWith(prefix + "/")) return permission
    }
    return null
  },

  hasRouteAccess(permissions: string[], pathname: string): boolean {
    const permission = this.getRoutePermission(pathname)
    if (!permission) return true
    return this.canAccessRoute(permissions, permission)
  },

  filterByPermission<T extends { requiredPermission?: string }>(
    items: T[],
    permissions: string[]
  ): T[] {
    return items.filter((item) => {
      if (!item.requiredPermission) return true
      return this.hasPermission(permissions, item.requiredPermission)
    })
  },
}