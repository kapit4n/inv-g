import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, waitFor, userEvent } from "@tests/helpers/render"
import { setupI18n } from "@/i18n"
import { EmployeesPage } from "@/features/employees/pages/employees-page"
import { getAdminUsers, getAdminRoles, resetUserPassword } from "@/lib/tauri"
import { useAuthStore } from "@/stores"
import type { AdminUser, User } from "@/types"
import toast from "react-hot-toast"

vi.mock("@/lib/tauri", () => ({
  getAdminUsers: vi.fn(),
  getAdminRoles: vi.fn(),
  createAdminUser: vi.fn(),
  updateAdminUser: vi.fn(),
  archiveAdminUser: vi.fn(),
  restoreAdminUser: vi.fn(),
  resetUserPassword: vi.fn(),
}))

vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: vi.fn() },
}))

setupI18n("en")

const CURRENT_USER_ID = 7

function employee(overrides: Partial<AdminUser> = {}): AdminUser {
  return {
    id: 21,
    username: "vendedor1",
    email: "vendedor1@test.inv",
    fullName: "Vendedor Uno",
    roleId: 3,
    roleName: "Cajero",
    isActive: true,
    isLocked: false,
    passwordChangeRequired: false,
    lastLoginAt: null,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  } as AdminUser
}

function signInAsAdministrator() {
  const user: User = {
    id: CURRENT_USER_ID,
    username: "admin",
    email: "admin@test.inv",
    fullName: "Admin",
    roleId: 2,
    roleName: "Administrador",
    isActive: true,
    passwordChangeRequired: false,
    createdAt: "2026-01-01T00:00:00Z",
  }
  useAuthStore.setState({ isAuthenticated: true, permissions: ["admin.users.manage"], user })
}

describe("EmployeesPage — reset password", () => {
  beforeEach(() => {
    vi.mocked(getAdminUsers).mockReset()
    vi.mocked(getAdminRoles).mockReset()
    vi.mocked(resetUserPassword).mockReset()
    vi.mocked(toast.success).mockReset()
    vi.mocked(toast.error).mockReset()
    vi.mocked(getAdminRoles).mockResolvedValue([])
    vi.mocked(getAdminUsers).mockResolvedValue([employee()])
    vi.mocked(resetUserPassword).mockResolvedValue(undefined)
    signInAsAdministrator()
  })

  it("asks for confirmation and explains the shared default", async () => {
    const user = userEvent.setup()
    render(<EmployeesPage />)

    await screen.findByText("Vendedor Uno")
    await user.click(screen.getByTitle("Reset Password"))

    expect(await screen.findByText("Reset Password")).toBeInTheDocument()
    expect(screen.getByText(/Set Vendedor Uno's password back to the shared default\?/)).toBeInTheDocument()
    expect(screen.getByText(/CHANGEPASSWORD/)).toBeInTheDocument()
    // Nothing is reset until the operator confirms.
    expect(resetUserPassword).not.toHaveBeenCalled()
  })

  it("resets to the default and re-arms the forced first change", async () => {
    const user = userEvent.setup()
    render(<EmployeesPage />)

    await screen.findByText("Vendedor Uno")
    await user.click(screen.getByTitle("Reset Password"))
    await user.click(await screen.findByRole("button", { name: "Confirm" }))

    await waitFor(() => {
      expect(resetUserPassword).toHaveBeenCalledTimes(1)
    })
    // Blank password: the backend substitutes the shared default, so the
    // constant lives in one place. `true` re-arms the forced first change and
    // the last argument is the acting user the backend permission-checks.
    expect(resetUserPassword).toHaveBeenCalledWith(21, "", true, CURRENT_USER_ID)
  })

  it("can be cancelled without touching the account", async () => {
    const user = userEvent.setup()
    render(<EmployeesPage />)

    await screen.findByText("Vendedor Uno")
    await user.click(screen.getByTitle("Reset Password"))
    await user.click(await screen.findByRole("button", { name: "Cancel" }))

    expect(resetUserPassword).not.toHaveBeenCalled()
  })

  it("reports a backend rejection and keeps the dialog open", async () => {
    vi.mocked(resetUserPassword).mockRejectedValue(new Error("No tienes permiso para restablecer contraseñas."))
    const user = userEvent.setup()
    render(<EmployeesPage />)

    await screen.findByText("Vendedor Uno")
    await user.click(screen.getByTitle("Reset Password"))
    await user.click(await screen.findByRole("button", { name: "Confirm" }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("No tienes permiso para restablecer contraseñas.")
    })
    // The list is not refetched, so the operator keeps the context to retry.
    expect(getAdminUsers).toHaveBeenCalledTimes(1)
    expect(await screen.findByRole("button", { name: "Confirm" })).toBeInTheDocument()
  })

  it("marks accounts that must change the password at the next sign-in", async () => {
    vi.mocked(getAdminUsers).mockResolvedValue([employee({ passwordChangeRequired: true })])
    render(<EmployeesPage />)

    expect(await screen.findByText("Must change password at next sign-in")).toBeInTheDocument()
  })
})
