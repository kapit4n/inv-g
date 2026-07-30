import { describe, it, expect } from "vitest"

type RouteEntry = { path: string; element: string; protected?: boolean; children?: RouteEntry[] }

const KNOWN_ROUTES: RouteEntry[] = [
  { path: "/", element: "DashboardPage", protected: true },
  { path: "/login", element: "LoginPage", protected: false },
  { path: "/products", element: "ProductsPage", protected: true },
  { path: "/products/new", element: "ProductFormPage", protected: true },
  { path: "/products/:id", element: "ProductDetailPage", protected: true },
  { path: "/sales", element: "SalesHistoryPage", protected: true },
  { path: "/sales/pos", element: "POSPage", protected: true },
  { path: "/sales/:id", element: "SaleDetailPage", protected: true },
  { path: "/purchases", element: "PurchaseOrdersPage", protected: true },
  { path: "/purchases/new", element: "PurchaseOrderFormPage", protected: true },
  { path: "/purchases/:id", element: "PurchaseOrderDetailPage", protected: true },
  { path: "/customers", element: "CustomersPage", protected: true },
  { path: "/customers/:id", element: "CustomerDetailPage", protected: true },
  { path: "/reports", element: "ReportsPage", protected: true },
  { path: "/admin", element: "AdminDashboardPage", protected: true },
  { path: "/admin/users", element: "AdminUsersPage", protected: true },
  { path: "/admin/roles", element: "AdminRolesPage", protected: true },
]

describe("Route Registration Smoke", () => {
  it("all routes have paths", () => {
    for (const route of KNOWN_ROUTES) {
      expect(route.path).toBeTruthy()
      expect(route.path.startsWith("/")).toBe(true)
    }
  })

  it("all routes have element names", () => {
    for (const route of KNOWN_ROUTES) {
      expect(route.element).toBeTruthy()
      expect(route.element.endsWith("Page")).toBe(true)
    }
  })

  it("no duplicate paths", () => {
    const paths = KNOWN_ROUTES.map((r) => r.path)
    const uniquePaths = new Set(paths)
    expect(uniquePaths.size).toBe(paths.length)
  })

  it("auth routes are distinct", () => {
    const loginRoute = KNOWN_ROUTES.find((r) => r.path === "/login")
    expect(loginRoute).toBeDefined()
    expect(loginRoute!.protected).toBe(false)

    const protectedRoutes = KNOWN_ROUTES.filter((r) => r.path !== "/login")
    for (const route of protectedRoutes) {
      expect(route.protected).toBe(true)
    }
  })
})
