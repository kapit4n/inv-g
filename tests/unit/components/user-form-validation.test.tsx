import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, fireEvent, waitFor } from "@tests/helpers/render"
import { setupI18n } from "@/i18n"
import { validateUserForm, hasErrors, translateUserSaveError } from "@/lib/validation/user-form"
import type { UserFormValues } from "@/lib/validation/user-form"
import { AdminUserFormPage } from "@/features/admin/pages/admin-user-form-page"
import { EmployeesPage } from "@/features/employees/pages/employees-page"
import {
  getAdminRoles,
  getAdminUser,
  createAdminUser,
  updateAdminUser,
  getAdminUsers,
} from "@/lib/tauri"
import { useAuthStore } from "@/stores"
import type { User } from "@/types"

/**
 * The gap this covers: `roleId: form.roleId || undefined` meant leaving the
 * select on its placeholder sent no role at all, and the backend stores a NULL
 * `role_id` without complaint. The result was an account that can sign in and do
 * nothing, created with one click and no warning. Role is now required on both
 * user-creation surfaces, and the message is shown on the field itself.
 */

vi.mock("@/lib/tauri", () => ({
  getAdminRoles: vi.fn(),
  getAdminUser: vi.fn(),
  getAdminUsers: vi.fn(),
  createAdminUser: vi.fn(),
  updateAdminUser: vi.fn(),
}))

setupI18n("en")

const admin: User = {
  id: 7, username: "admin", email: "admin@test.com", fullName: "Admin",
  isActive: true, passwordChangeRequired: false, createdAt: "2026-01-01T00:00:00Z",
}

const roles = [{ id: 3, name: "Cashier" }, { id: 2, name: "Administrator" }]

function validForm(overrides: Partial<UserFormValues> = {}): UserFormValues {
  return { username: "nuevo", fullName: "Nuevo Usuario", email: "nuevo@test.com", phone: "", roleId: 3, ...overrides }
}

function setAdmin() {
  useAuthStore.setState({ isAuthenticated: true, permissions: ["admin.users.manage", "employees.view", "employees.manage"], user: admin })
}

async function pickRole(name: string) {
  fireEvent.click(screen.getByRole("combobox"))
  fireEvent.click(await screen.findByRole("option", { name }))
}

/** The `validation` namespace is registered separately, so these resolve for real. */
const REQUIRED = "This field is required"
const SELECT_OPTION = "Please select an option"

describe("validateUserForm", () => {
  it("passes a complete form", () => {
    expect(validateUserForm(validForm())).toEqual({})
    expect(hasErrors(validateUserForm(validForm()))).toBe(false)
  })

  it("requires a role, and treats the 0 placeholder as unset", () => {
    expect(validateUserForm(validForm({ roleId: 0 }))).toEqual({
      roleId: { key: "validation.selectOption" },
    })
  })

  it("can skip the role check where one genuinely cannot be chosen", () => {
    expect(validateUserForm(validForm({ roleId: 0 }), { requireRole: false })).toEqual({})
  })

  it("requires username, full name and email", () => {
    const errors = validateUserForm({ username: "", fullName: "  ", email: "", phone: "", roleId: 3 })
    expect(errors.username?.key).toBe("validation.requiredField")
    // Whitespace is not a name: this would have been sent as `"  "`.
    expect(errors.fullName?.key).toBe("validation.requiredField")
    expect(errors.email?.key).toBe("validation.requiredField")
  })

  it("rejects a malformed email but not an absent optional phone", () => {
    expect(validateUserForm(validForm({ email: "nuevo@correo" })).email?.key).toBe("validation.invalidEmail")
    expect(validateUserForm(validForm({ phone: "" })).phone).toBeUndefined()
    expect(validateUserForm(validForm({ phone: "+34 600 11 22 33" })).phone).toBeUndefined()
    expect(validateUserForm(validForm({ phone: "llama ahora" })).phone?.key).toBe("validation.invalidPhone")
  })

  it("reports every problem at once rather than one per attempt", () => {
    expect(Object.keys(validateUserForm({ username: "", fullName: "", email: "", phone: "", roleId: 0 }))).toHaveLength(4)
  })
})

describe("translateUserSaveError", () => {
  it("turns the raw SQLite duplicate text into a field message", () => {
    // This is the exact string `create_admin_user` bubbles up: it runs a raw
    // INSERT with no duplicate check of its own.
    expect(translateUserSaveError("UNIQUE constraint failed: users.username").key).toBe("validation.usernameTaken")
    expect(translateUserSaveError("UNIQUE constraint failed: users.email").key).toBe("validation.emailTaken")
    expect(translateUserSaveError("FOREIGN KEY constraint failed").key).toBe("validation.roleNotFound")
  })

  it("passes a real message through untouched", () => {
    expect(translateUserSaveError("No tienes permiso para crear usuarios.").key).toBe("No tienes permiso para crear usuarios.")
    expect(translateUserSaveError("No fields to update").key).toBe("No fields to update")
  })
})

describe.each([
  { name: "AdminUserFormPage", render: () => render(<AdminUserFormPage />), open: () => {} },
  {
    name: "EmployeesPage",
    render: () => render(<EmployeesPage />),
    open: async () => fireEvent.click(await screen.findByRole("button", { name: /Add employee/i })),
  },
])("$name required-field validation", ({ render: renderIt, open }) => {
  beforeEach(() => {
    setAdmin()
    vi.mocked(getAdminRoles).mockReset().mockResolvedValue(roles)
    vi.mocked(getAdminUser).mockReset()
    vi.mocked(getAdminUsers).mockReset().mockResolvedValue([])
    vi.mocked(createAdminUser).mockReset().mockResolvedValue({} as never)
    vi.mocked(updateAdminUser).mockReset().mockResolvedValue({} as never)
  })

  it("refuses to save without a role and says so on the field", async () => {
    renderIt()
    await open()

    fireEvent.change(screen.getByLabelText(/^Username/), { target: { value: "nuevo" } })
    fireEvent.change(screen.getByLabelText(/Full Name/), { target: { value: "Nuevo Usuario" } })
    fireEvent.change(screen.getByLabelText(/^Email/), { target: { value: "nuevo@test.com" } })
    fireEvent.click(screen.getByRole("button", { name: /^Save$/ }))

    expect(await screen.findByText(SELECT_OPTION)).toBeInTheDocument()
    // The whole point: no roleless account reaches the database.
    expect(createAdminUser).not.toHaveBeenCalled()
  })

  it("reports the required text fields instead of only the first", async () => {
    renderIt()
    await open()
    fireEvent.click(screen.getByRole("button", { name: /^Save$/ }))

    // Username, full name, email and role all missing at once.
    expect(await screen.findAllByText(REQUIRED)).toHaveLength(3)
    expect(screen.getByText(SELECT_OPTION)).toBeInTheDocument()
    expect(createAdminUser).not.toHaveBeenCalled()
  })

  it("rejects a malformed email without sending it", async () => {
    renderIt()
    await open()

    fireEvent.change(screen.getByLabelText(/^Username/), { target: { value: "nuevo" } })
    fireEvent.change(screen.getByLabelText(/Full Name/), { target: { value: "Nuevo Usuario" } })
    fireEvent.change(screen.getByLabelText(/^Email/), { target: { value: "nuevo@correo" } })
    await pickRole("Cashier")
    fireEvent.click(screen.getByRole("button", { name: /^Save$/ }))

    expect(await screen.findByText("Invalid email address")).toBeInTheDocument()
    expect(createAdminUser).not.toHaveBeenCalled()
  })

  it("clears a field's error once it is edited, leaving the others alone", async () => {
    renderIt()
    await open()
    fireEvent.click(screen.getByRole("button", { name: /^Save$/ }))

    expect(await screen.findAllByText(REQUIRED)).toHaveLength(3)
    fireEvent.change(screen.getByLabelText(/^Username/), { target: { value: "nuevo" } })

    await waitFor(() => expect(screen.getAllByText(REQUIRED)).toHaveLength(2))
  })

  it("saves once everything is filled in", async () => {
    renderIt()
    await open()

    fireEvent.change(screen.getByLabelText(/^Username/), { target: { value: "nuevo" } })
    fireEvent.change(screen.getByLabelText(/Full Name/), { target: { value: "Nuevo Usuario" } })
    fireEvent.change(screen.getByLabelText(/^Email/), { target: { value: "  nuevo@test.com  " } })
    await pickRole("Cashier")
    fireEvent.click(screen.getByRole("button", { name: /^Save$/ }))

    await waitFor(() => expect(createAdminUser).toHaveBeenCalledTimes(1))
    const payload = vi.mocked(createAdminUser).mock.calls[0][0]
    expect(payload).toMatchObject({ username: "nuevo", email: "nuevo@test.com", roleId: 3 })
  })

  it("points at the username when the backend reports a duplicate", async () => {
    vi.mocked(createAdminUser).mockRejectedValue("UNIQUE constraint failed: users.username")
    renderIt()
    await open()

    fireEvent.change(screen.getByLabelText(/^Username/), { target: { value: "nuevo" } })
    fireEvent.change(screen.getByLabelText(/Full Name/), { target: { value: "Nuevo Usuario" } })
    fireEvent.change(screen.getByLabelText(/^Email/), { target: { value: "nuevo@test.com" } })
    await pickRole("Cashier")
    fireEvent.click(screen.getByRole("button", { name: /^Save$/ }))

    // The raw SQLite text is never shown to the user.
    expect(await screen.findByText("That username is already in use")).toBeInTheDocument()
    expect(screen.queryByText(/UNIQUE constraint/)).not.toBeInTheDocument()
  })
})
