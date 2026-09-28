/**
 * Field validation for creating and editing a user account.
 *
 * The Employees page and the Admin → Users form were written independently and
 * had drifted apart: the dialog checked three fields and reported them in a
 * single toast, the page checked only what the browser's `required` attribute
 * caught and had no error display at all, and neither required a role. `roleId: 0`
 * was turned into `undefined` on the way to the IPC call, so leaving the select
 * on its placeholder silently created an account with no permissions at all --
 * an account that can sign in and do nothing.
 *
 * `roleId` is therefore required here. That is stricter than the backend, which
 * stores a NULL `role_id` happily; the check belongs in the form because a
 * roleless account is never what anyone means to create.
 *
 * Errors are returned as translation *keys* rather than sentences, because the
 * sibling helpers in `schemas.ts` hard-code Spanish and this validator is used by
 * both the English and Spanish builds. The pages resolve them with `t()`.
 */

export interface UserFormValues {
  username: string
  fullName: string
  email: string
  phone: string
  roleId: number
}

export type UserFormField = keyof UserFormValues

/** A validation failure, expressed as an i18next key plus its interpolation values. */
export interface ValidationIssue {
  key: string
  params?: Record<string, string | number>
}

export type UserFormErrors = Partial<Record<UserFormField, ValidationIssue>>

/**
 * Deliberately permissive: the same shape the rest of the app accepts for a
 * phone number (`src/lib/validation/schemas.ts:createPhoneSchema`), because the
 * real gate is whether the value round-trips, not whether it matches a pattern.
 */
const PHONE_PATTERN = /^[\d\s\-+()]+$/

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * @param values  The raw form state, untrimmed. Callers pass the live state and
 *                we trim here, so a field holding only spaces fails as empty
 *                rather than being sent as a whitespace username.
 * @param options.requireRole  Set false only where a role genuinely cannot be
 *                chosen yet. Both current call sites require it.
 */
export function validateUserForm(
  values: UserFormValues,
  options: { requireRole?: boolean } = {}
): UserFormErrors {
  const { requireRole = true } = options
  const errors: UserFormErrors = {}

  const username = values.username.trim()
  const fullName = values.fullName.trim()
  const email = values.email.trim()
  const phone = values.phone.trim()

  if (!username) {
    errors.username = { key: "validation.requiredField" }
  }

  if (!fullName) {
    errors.fullName = { key: "validation.requiredField" }
  }

  if (!email) {
    errors.email = { key: "validation.requiredField" }
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = { key: "validation.invalidEmail" }
  }

  // Optional, but an empty string is not a phone number.
  if (phone && !PHONE_PATTERN.test(phone)) {
    errors.phone = { key: "validation.invalidPhone" }
  }

  // The select starts on 0, which is the placeholder rather than a real role.
  if (requireRole && !values.roleId) {
    errors.roleId = { key: "validation.selectOption" }
  }

  return errors
}

export function hasErrors(errors: UserFormErrors): boolean {
  return Object.keys(errors).length > 0
}

/**
 * Turns a save failure into a translation key.
 *
 * The backend does no duplicate checking of its own: `create_admin_user` runs a
 * raw INSERT, so rusqlite's own text reaches the caller and used to be shown to
 * the user verbatim as `UNIQUE constraint failed: users.username`. `role_id` is a
 * real foreign key, so a role that was deleted between loading the select and
 * saving arrives the same way.
 */
export function translateUserSaveError(message: string): ValidationIssue {
  const text = message.toLowerCase()

  if (text.includes("users.username") || text.includes("username")) {
    return { key: "validation.usernameTaken" }
  }
  if (text.includes("users.email") || text.includes("email")) {
    return { key: "validation.emailTaken" }
  }
  if (text.includes("foreign key")) {
    // Only `role_id` is a foreign key on this form -- username, full_name and
    // email are plain NOT NULL columns -- so a bare FK failure is the role.
    return { key: "validation.roleNotFound" }
  }

  // Anything else is a real message worth showing: a permission refusal, or
  // "No fields to update".
  return { key: message }
}
