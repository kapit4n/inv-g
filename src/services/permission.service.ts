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
    return this.hasPermission(permissions, routePermission)
  },

  getRoutePermission(pathname: string): string | null {
    const routeMap: Record<string, string> = {
      "/dashboard": "dashboard.view",
      "/inventory": "inventory.view",
      "/sales": "sales.view",
      "/purchases": "purchases.view",
      "/customers": "customers.view",
      "/suppliers": "suppliers.view",
      "/vehicles": "vehicles.view",
      "/warehouse": "warehouse.view",
      "/reports": "reports.view",
      "/employees": "employees.manage",
      "/settings": "settings.view",
      "/help": "dashboard.view",
    }
    return routeMap[pathname] ?? null
  },

  hasRouteAccess(permissions: string[], pathname: string): boolean {
    const permission = this.getRoutePermission(pathname)
    if (!permission) return true
    return this.hasPermission(permissions, permission)
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
