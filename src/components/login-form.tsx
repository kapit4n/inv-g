import { useEffect, useState, type FormEvent } from "react"
import { useTranslation } from "react-i18next"
import { Eye, EyeOff, Loader2, LogIn, Bug, Shield, User, Store, Wrench, Database } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useAuth } from "@/hooks"
import { getQuickLoginRoles } from "@/lib/tauri"

interface LoginFormProps {
  onSuccess?: () => void
}

/**
 * Presentation for the quick-login buttons: icon and colour per role.
 *
 * These names are matched against `roles.name` exactly — SQLite `=` is
 * case-sensitive — so they must match what the seeder inserts. `administrator`
 * was previously listed as `admin`, which is not a role at all, so that button
 * always failed with "Role 'admin' not found".
 *
 * Whether a role is *offered* is not decided here. `getQuickLoginRoles` reports
 * the roles the backend will actually accept, and the list is filtered against
 * that below.
 */
const QUICK_LOGIN_PRESENTATION: Record<string, { icon: typeof Shield; color: string }> = {
  owner: { icon: Shield, color: "text-red-500" },
  administrator: { icon: Wrench, color: "text-orange-500" },
  cashier: { icon: User, color: "text-blue-500" },
  warehouse: { icon: Store, color: "text-green-500" },
  purchasing: { icon: Wrench, color: "text-teal-500" },
  viewer: { icon: Database, color: "text-gray-500" },
}

/**
 * Presentation for a role, with a neutral default.
 *
 * The fallback is what lets the filter and the lookup disagree safely: a role the
 * backend enabled that this component has no styling for still gets a working
 * button instead of a crash or a blank slot.
 */
function quickLoginPresentation(name: string): { icon: typeof Shield; color: string } {
  return QUICK_LOGIN_PRESENTATION[name] ?? { icon: User, color: "text-gray-500" }
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const { t } = useTranslation()
  const { login, loginByRole } = useAuth()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [remember, setRemember] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [testingOpen, setTestingOpen] = useState(false)
  const [quickLoginRoles, setQuickLoginRoles] = useState<string[]>([])

  // Which roles can sign in without a password is server state, not a constant.
  // Fetched once when the form mounts so a role an administrator has switched off
  // does not appear, and so a role they have switched on appears without a
  // rebuild.
  useEffect(() => {
    let cancelled = false
    getQuickLoginRoles()
      .then((roles) => {
        if (!cancelled) setQuickLoginRoles(roles)
      })
      .catch(() => {
        // No quick login available, or the backend is unreachable: show none
        // rather than buttons that are guaranteed to fail.
        if (!cancelled) setQuickLoginRoles([])
      })
    return () => { cancelled = true }
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!username.trim()) {
      setError(t("auth.usernameRequired"))
      return
    }
    if (!password.trim()) {
      setError(t("auth.passwordRequired"))
      return
    }

    setLoading(true)
    try {
      await login(username, password)
      onSuccess?.()
    } catch (err) {
      setError(typeof err === "string" ? err : t("auth.invalidCredentials"))
    } finally {
      setLoading(false)
    }
  }

  const handleRoleLogin = async (role: string) => {
    setError(null)
    setLoading(true)
    try {
      await loginByRole(role)
      onSuccess?.()
    } catch (err) {
      setError(typeof err === "string" ? err : "Login failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="username">{t("auth.username")}</Label>
        <Input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder={t("auth.usernamePlaceholder")}
          autoFocus
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">{t("auth.password")}</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("auth.passwordPlaceholder")}
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Switch
          id="remember"
          checked={remember}
          onCheckedChange={setRemember}
        />
        <Label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">
          {t("auth.rememberSession")}
        </Label>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <LogIn className="h-4 w-4 mr-2" />
        )}
        {loading ? t("auth.signingIn") : t("auth.signIn")}
      </Button>

      {quickLoginRoles.length > 0 && (
      <Collapsible open={testingOpen} onOpenChange={setTestingOpen}>
        <CollapsibleTrigger asChild>
          <Button type="button" variant="outline" size="sm" className="w-full gap-2 text-xs text-muted-foreground">
            <Bug className="h-3.5 w-3.5" />
            {testingOpen ? "Hide testing quick-login" : "Testing: quick login by role"}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2 pt-2">
          <p className="text-xs text-muted-foreground">Click a role to log in as the first active user with that role:</p>
          <div className="grid grid-cols-2 gap-2">
            {quickLoginRoles.map((name) => {
              const { icon: Icon, color } = quickLoginPresentation(name)
              return (
                <Button
                  key={name}
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={loading}
                  onClick={() => handleRoleLogin(name)}
                  className="justify-start gap-2"
                >
                  <Icon className={`h-4 w-4 ${color}`} />
                  <span className="capitalize">{name}</span>
                </Button>
              )
            })}
          </div>
        </CollapsibleContent>
      </Collapsible>
      )}
    </form>
  )
}
