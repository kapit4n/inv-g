import { useState, type FormEvent } from "react"
import { useTranslation } from "react-i18next"
import { KeyRound, Loader2, LogOut, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/hooks"
import { useAuthStore } from "@/stores"
import { AuthService } from "@/services/auth.service"
import { useNotification } from "@/hooks/use-notification"

const MIN_PASSWORD_LEN = 6

/**
 * The screen a provisioned user cannot get past until they replace the password
 * they were shipped with.
 *
 * Deliberately not a route. It is rendered in place of the app shell while
 * `mustChangePassword` is set, so there is no URL that reaches the rest of the
 * app, no back button that returns to it, and no way in by deep link or from a
 * stale tab. Signing out is the only exit, which is the point: the password these
 * accounts share is not a secret.
 *
 * The length check mirrors the backend's, so it saves a round trip rather than
 * being the only enforcement.
 */
export function ForcePasswordChange() {
  const { t } = useTranslation()
  const { user, token, logout } = useAuth()
  const { success } = useNotification()
  const markPasswordChanged = useAuthStore((state) => state.markPasswordChanged)

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!currentPassword) {
      setError(t("auth.currentPasswordRequired"))
      return
    }
    if (newPassword.length < MIN_PASSWORD_LEN) {
      setError(t("auth.passwordTooShort", { min: MIN_PASSWORD_LEN }))
      return
    }
    if (newPassword === currentPassword) {
      setError(t("auth.passwordSameAsCurrent"))
      return
    }
    if (newPassword !== confirmPassword) {
      setError(t("auth.passwordsDoNotMatch"))
      return
    }
    if (!token) {
      setError(t("auth.sessionExpired"))
      return
    }

    setLoading(true)
    try {
      await AuthService.changePassword(token, currentPassword, newPassword)
      // The backend has cleared the flag. Re-read rather than trusting this
      // component, so the store and local storage agree with the database and the
      // next launch does not bounce the user back to this form.
      const refreshed = await AuthService.refreshSession()
      markPasswordChanged(refreshed?.user)
      success(t("auth.passwordChanged"))
    } catch (err) {
      setError(typeof err === "string" ? err : t("auth.passwordChangeFailed"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-semibold">{t("auth.changePasswordRequiredTitle")}</h1>
          <p className="text-sm text-muted-foreground">
            {user?.fullName
              ? t("auth.changePasswordRequiredBody", { name: user.fullName })
              : t("auth.changePasswordRequiredBodyGeneric")}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-card p-6 shadow-sm">
          <div className="space-y-2">
            <Label htmlFor="force-current-password">{t("auth.currentPassword")}</Label>
            <Input
              id="force-current-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="force-new-password">{t("auth.newPassword")}</Label>
            <Input
              id="force-new-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="force-confirm-password">{t("auth.confirmPassword")}</Label>
            <Input
              id="force-confirm-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={showPassword}
              onChange={(e) => setShowPassword(e.target.checked)}
              disabled={loading}
            />
            {t("auth.showPassword")}
          </label>

          {error && (
            <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
            {t("auth.saveNewPassword")}
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => logout()}
            disabled={loading}
          >
            <LogOut className="h-4 w-4" />
            {t("auth.signOutInstead")}
          </Button>
        </form>
      </div>
    </div>
  )
}
