import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, fireEvent, waitFor } from "@tests/helpers/render"
import { setupI18n } from "@/i18n"
import { AdminUserFormPage } from "@/features/admin/pages/admin-user-form-page"
import { getAdminRoles, createAdminUser, updateAdminUser, getAdminUser } from "@/lib/tauri"
import { useAuthStore } from "@/stores"
import type { User } from "@/types"

vi.mock("@/lib/tauri", () => ({
  getAdminRoles: vi.fn(),
  getAdminUser: vi.fn(),
  createAdminUser: vi.fn(),
  updateAdminUser: vi.fn(),
}))

setupI18n("en")

function setCurrentUser(id: number, permissions: string[]) {
  const user: User = {
    id,
    username: "admin",
    email: "admin@test.com",
    fullName: "Admin",
    isActive: true,
    passwordChangeRequired: false,
    createdAt: "2026-01-01T00:00:00Z",
  }
  useAuthStore.setState({ isAuthenticated: true, permissions, user })
}

/** Opens the role select and clicks an option. */
async function pickRole(name: string) {
  fireEvent.click(screen.getByRole("combobox"))
  fireEvent.click(await screen.findByRole("option", { name }))
}

describe("AdminUserFormPage", () => {
  beforeEach(() => {
    vi.mocked(getAdminRoles).mockReset()
    vi.mocked(getAdminUser).mockReset()
    vi.mocked(createAdminUser).mockReset()
    vi.mocked(updateAdminUser).mockReset()
    vi.mocked(getAdminRoles).mockResolvedValue([])
    vi.mocked(createAdminUser).mockResolvedValue({
      id: 9,
      username: "nuevo",
      email: "nuevo@test.com",
      fullName: "Nuevo",
      isActive: true,
      isLocked: false,
      failedLoginAttempts: 0,
      passwordChangeRequired: true,
      createdAt: "2026-01-01T00:00:00Z",
      updatedAt: "2026-01-01T00:00:00Z",
    })
  })

  it("asks the administrator to keep the shared CHANGEPASSWORD instead of picking one", async () => {
    setCurrentUser(7, ["admin.users.manage"])
    render(<AdminUserFormPage />)

    expect(screen.getByText(/CHANGEPASSWORD/)).toBeInTheDocument()
    expect(screen.getAllByRole("textbox")).toHaveLength(5)
    expect(screen.queryByRole("button", { name: "Save" })).toBeInTheDocument()
    expect(screen.queryByLabelText("Password")).not.toBeInTheDocument()
  })

  it("creates the user with CHANGEPASSWORD and the logged-in administrator as creator", async () => {
    setCurrentUser(7, ["admin.users.manage"])
    vi.mocked(getAdminRoles).mockResolvedValue([{ id: 3, name: "Cashier" }])
    render(<AdminUserFormPage />)

    const [username, fullName, email] = screen.getAllByRole("textbox")
    fireEvent.change(username, { target: { value: "nuevo" } })
    fireEvent.change(fullName, { target: { value: "Nuevo Usuario" } })
    fireEvent.change(email, { target: { value: "nuevo@test.com" } })
    await pickRole("Cashier")
    fireEvent.click(screen.getByRole("button", { name: "Save" }))

    await waitFor(() =>
      expect(createAdminUser).toHaveBeenCalledWith(
        {
          username: "nuevo",
          email: "nuevo@test.com",
          password: "CHANGEPASSWORD",
          fullName: "Nuevo Usuario",
          phone: undefined,
          roleId: 3,
          notes: undefined,
        },
        7
      )
    )
  })

  it("blocks anyone without admin.users.manage", () => {
    setCurrentUser(2, ["sales.view"])
    render(<AdminUserFormPage />)

    expect(screen.getByText(/do not have permission to manage users/i)).toBeInTheDocument()
    expect(screen.queryByText(/CHANGEPASSWORD/)).not.toBeInTheDocument()
    expect(screen.queryAllByRole("textbox")).toHaveLength(0)
  })
})