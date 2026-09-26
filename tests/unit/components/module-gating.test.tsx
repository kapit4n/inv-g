import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { MemoryRouter, Outlet, Route, Routes } from "react-router-dom"
import { setupI18n } from "@/i18n"
import { ModuleRoute } from "@/components/auth-guards"
import { useAppSettingsStore } from "@/stores"
import type { AdminAppSetting } from "@/types"

/**
 * "Activar módulo de compras" in Admin > Settings appeared to do nothing.
 *
 * The three flags (`enable_sales`, `enable_purchasing`, `enable_crm`) are rows
 * in `application_settings`. The admin page could render and save them, but
 * nothing ever *read* them: no route guard, no sidebar filter, no command
 * palette filter. The settings were write-only, so switching a module off left
 * the whole module reachable. `use-modules.ts` is now the single reader.
 *
 * The tree below mirrors `src/routes/index.tsx`: `ModuleRoute` wraps the
 * authenticated layout and every page is a child route rendered through an
 * `Outlet`. That shape matters. On a blocked module the guard renders
 * `<Navigate to="/dashboard">`, which lands on a *sibling* child route, so the
 * assertion is "the purchases page is replaced by the dashboard" rather than
 * "the children vanished" -- with the guard mounted on its own, it would simply
 * re-render its own children at the new path and appear to do nothing.
 */

setupI18n("en")

function setting(key: string, value: string): AdminAppSetting {
  return {
    id: 1,
    category: "business",
    key,
    value,
    settingType: "boolean",
    description: "",
    isSystem: 1,
    sortOrder: 0,
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  } as AdminAppSetting
}

const ALL_ON = [
  setting("enable_sales", "true"),
  setting("enable_purchasing", "true"),
  setting("enable_crm", "true"),
]

/** Mirrors `admin-settings-page.tsx`, which writes the literal strings. */
function setFlags(values: Record<string, string>) {
  useAppSettingsStore.setState({
    settings: ALL_ON.map((s) =>
      values[s.key] === undefined ? s : { ...s, value: values[s.key] }
    ),
    loaded: true,
  })
}

/** Paths that must be gated, and the module each belongs to. */
const PURCHASE_PATHS = [
  "/purchases",
  "/purchases/orders",
  "/purchases/orders/new",
  "/purchases/reorder-suggestions",
  "/purchases/supplier-products",
]
const SALES_PATHS = ["/sales", "/sales/pos"]
const CRM_PATHS = ["/crm", "/crm/customers", "/crm/vehicles"]
/** Module-independent areas: the flags must never reach these. */
const SHARED_PATHS = ["/inventory/products", "/part-finder", "/reports/sales", "/admin/settings"]
/** Where `ModuleRoute` sends a blocked module. */
const DASHBOARD = "/dashboard"

function renderAt(path: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const page = (label: string) => <p>{label}</p>

  const children = [
    <Route key={DASHBOARD} path={DASHBOARD.slice(1)} element={page("dashboard")} />,
    ...PURCHASE_PATHS.map((p) => <Route key={p} path={p.slice(1)} element={page("purchases page")} />),
    ...SALES_PATHS.map((p) => <Route key={p} path={p.slice(1)} element={page("sales page")} />),
    ...CRM_PATHS.map((p) => <Route key={p} path={p.slice(1)} element={page("crm page")} />),
    ...SHARED_PATHS.map((p) => <Route key={p} path={p.slice(1)} element={page("shared page")} />),
  ]

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route
            path="/"
            element={
              <ModuleRoute>
                <Outlet />
              </ModuleRoute>
            }
          >
            {children}
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

/** The guard redirected: we are on the dashboard instead of the requested page. */
function expectRedirectedToDashboard() {
  expect(screen.getByText("dashboard")).toBeInTheDocument()
  for (const label of ["purchases page", "sales page", "crm page", "shared page"]) {
    expect(screen.queryByText(label), `${label} must not render after a redirect`).not.toBeInTheDocument()
  }
}

describe("purchasing module flag", () => {
  it("shows the module when the flag is on", () => {
    setFlags({ enable_purchasing: "true" })
    renderAt("/purchases/orders")
    expect(screen.getByText("purchases page")).toBeInTheDocument()
  })

  it("redirects to the dashboard when the flag is off", () => {
    setFlags({ enable_purchasing: "false" })
    renderAt("/purchases/orders")
    expectRedirectedToDashboard()
  })

  it("blocks a hand-typed or bookmarked URL, not just the linked one", () => {
    setFlags({ enable_purchasing: "false" })
    for (const path of PURCHASE_PATHS) {
      const { unmount } = renderAt(path)
      expectRedirectedToDashboard()
      unmount()
    }
  })

  it("leaves the other modules alone", () => {
    setFlags({ enable_purchasing: "false" })
    for (const path of [...SALES_PATHS, ...CRM_PATHS]) {
      const { unmount } = renderAt(path)
      expect(
        screen.getByText(path.startsWith("/sales") ? "sales page" : "crm page"),
        `${path} must stay reachable`
      ).toBeInTheDocument()
      unmount()
    }
  })

  it("leaves the shared modules reachable when every module is off", () => {
    setFlags({ enable_sales: "false", enable_purchasing: "false", enable_crm: "false" })
    for (const path of SHARED_PATHS) {
      const { unmount } = renderAt(path)
      expect(screen.getByText("shared page"), `${path} must stay reachable`).toBeInTheDocument()
      unmount()
    }
  })

  it("blocks each module only by its own flag", () => {
    setFlags({ enable_sales: "false", enable_purchasing: "true", enable_crm: "true" })
    const first = renderAt("/sales")
    expectRedirectedToDashboard()
    first.unmount()

    renderAt("/purchases/orders")
    expect(screen.getByText("purchases page")).toBeInTheDocument()
  })
})

describe("module flag parsing", () => {
  /**
   * A database predating the seed has no row for these keys at all. Hiding a
   * whole business module in that state would be far worse than briefly showing
   * one that was meant to be off, so the reader fails open.
   */
  it("treats a missing row as enabled", () => {
    useAppSettingsStore.setState({ settings: [], loaded: true })
    renderAt("/purchases/orders")
    expect(screen.getByText("purchases page")).toBeInTheDocument()
  })

  it("only the literal 'false' disables a module", () => {
    for (const value of ["true", "TRUE", "True", "1", "yes", "", "  "]) {
      setFlags({ enable_purchasing: value })
      const { unmount } = renderAt("/purchases/orders")
      expect(screen.getByText("purchases page"), `'${value}' must not disable purchasing`).toBeInTheDocument()
      unmount()
    }
  })

  it("is case-insensitive about 'false'", () => {
    setFlags({ enable_purchasing: "FALSE" })
    renderAt("/purchases/orders")
    expectRedirectedToDashboard()
  })
})
