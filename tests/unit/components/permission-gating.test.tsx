import { describe, it, expect, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter, Outlet, Route, Routes } from "react-router-dom"
import { setupI18n } from "@/i18n"
import { RoutePermissionGuard } from "@/components/auth-guards"
import { useAuthStore } from "@/stores"
import type { User } from "@/types"

/**
 * "A cashier should only be able to use the sales modules."
 *
 * The seeded `cashier` role in src-tauri/src/db/seed.rs is now dashboard +
 * sales only. Hiding the modules from the sidebar is not enough on its own: a
 * bookmarked URL, the command palette, or a hand-typed address still reached
 * every page, because the router only checked "is this user signed in". The
 * tree below mirrors src/routes/index.tsx, where `RoutePermissionGuard` wraps
 * the authenticated layout and each page is a child route rendered through an
 * `Outlet`. That shape matters: on a denied route the guard renders
 * `<Navigate to="/forbidden">`, which is a sibling route, so the assertion is
 * "the page is replaced by the forbidden screen".
 */

setupI18n("en")

const user: User = {
  id: 2, username: "cajero", email: "cajero@test.com", fullName: "Cajero Uno",
  roleId: 3, roleName: "Cajero", isActive: true, createdAt: "2025-01-01T00:00:00Z",
}

const CASHIER_PERMISSIONS = [
  "dashboard.view",
  "sales.view",
  "sales.create",
  "sales.quotes",
  "sales.register",
  "sales.receipts",
]

const ADMINISTRATOR_PERMISSIONS = [
  ...CASHIER_PERMISSIONS,
  "inventory.view",
  "purchases.view",
  "customers.view",
  "vehicles.view",
  "warehouse.view",
  "reports.view",
  "employees.manage",
  "settings.view",
  "admin.users.manage",
  "admin.settings.manage",
]

const SALES_PATHS = ["/sales", "/sales/new", "/sales/quotes", "/sales/register", "/sales/customers"]
const BLOCKED_PATHS = [
  "/inventory",
  "/inventory/products",
  "/purchases",
  "/crm",
  "/crm/customers",
  "/customers",
  "/vehicles",
  "/warehouse",
  "/reports",
  "/reports/sales",
  "/employees",
  "/settings",
  "/admin",
  "/admin/users",
]
const OPEN_PATHS = ["/dashboard", "/part-finder", "/help", "/manual"]
const DASHBOARD = "/dashboard"
const FORBIDDEN = "/forbidden"

function signIn(permissions: string[]) {
  useAuthStore.getState().setSession(user, "token", permissions)
}

function renderAt(path: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const page = (label: string) => <p>{label}</p>

  const children = [
    <Route key={DASHBOARD} path={DASHBOARD.slice(1)} element={page("dashboard")} />,
    <Route key={FORBIDDEN} path={FORBIDDEN.slice(1)} element={page("forbidden")} />,
    ...OPEN_PATHS.filter((p) => p !== DASHBOARD).map((p) => <Route key={p} path={p.slice(1)} element={page("open page")} />),
    ...SALES_PATHS.map((p) => <Route key={p} path={p.slice(1)} element={page("sales page")} />),
    ...BLOCKED_PATHS.map((p) => <Route key={p} path={p.slice(1)} element={page("blocked page")} />),
  ]

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route
            path="/"
            element={
              <RoutePermissionGuard>
                <Outlet />
              </RoutePermissionGuard>
            }
          >
            {children}
          </Route>
          <Route path={FORBIDDEN.slice(1)} element={page("forbidden")} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

function expectForbidden() {
  expect(screen.getByText("forbidden")).toBeInTheDocument()
  for (const label of ["sales page", "blocked page", "open page"]) {
    expect(screen.queryByText(label), `${label} must not render after a redirect`).not.toBeInTheDocument()
  }
}

beforeEach(() => {
  useAuthStore.getState().clearSession()
})

describe("cashier role access", () => {
  it("reaches the dashboard", () => {
    signIn(CASHIER_PERMISSIONS)
    renderAt(DASHBOARD)
    expect(screen.getByText("dashboard")).toBeInTheDocument()
  })

  it("reaches every sales screen, including the one that lists customers", () => {
    signIn(CASHIER_PERMISSIONS)
    for (const path of SALES_PATHS) {
      const { unmount } = renderAt(path)
      expect(screen.getByText("sales page"), path).toBeInTheDocument()
      unmount()
    }
  })

  it("is sent to the forbidden screen for every other module", () => {
    signIn(CASHIER_PERMISSIONS)
    for (const path of BLOCKED_PATHS) {
      const { unmount } = renderAt(path)
      expectForbidden()
      unmount()
    }
  })

  it("blocks a hand-typed or bookmarked URL, not just the linked one", () => {
    signIn(CASHIER_PERMISSIONS)
    for (const path of ["/inventory/products", "/admin/users", "/reports/sales"]) {
      const { unmount } = renderAt(path)
      expectForbidden()
      unmount()
    }
  })

  it("leaves the shared tools open", () => {
    signIn(CASHIER_PERMISSIONS)
    for (const path of ["/part-finder", "/help", "/manual"]) {
      const { unmount } = renderAt(path)
      expect(screen.getByText("open page"), path).toBeInTheDocument()
      unmount()
    }
  })
})

describe("administrator role access", () => {
  it("is never sent to the forbidden screen", () => {
    signIn(ADMINISTRATOR_PERMISSIONS)
    for (const path of [DASHBOARD, ...SALES_PATHS, ...BLOCKED_PATHS, "/part-finder"]) {
      const { unmount } = renderAt(path)
      expect(screen.queryByText("forbidden"), path).not.toBeInTheDocument()
      unmount()
    }
  })
})

describe("signed-out visitor", () => {
  it("is denied every gated route", () => {
    // No session: no permissions, so nothing is reachable.
    for (const path of [DASHBOARD, ...SALES_PATHS, ...BLOCKED_PATHS]) {
      const { unmount } = renderAt(path)
      expectForbidden()
      unmount()
    }
  })
})
