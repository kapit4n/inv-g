import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { Package, Moon, Sun, Monitor } from "lucide-react"
import { LoginForm } from "@/components/login-form"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useLanguageStore, useThemeStore } from "@/stores"
import { useEffect } from "react"

export function LoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { language, setLanguage } = useLanguageStore()
  const { theme, setTheme } = useThemeStore()

  const themes = [
    { value: "light" as const, icon: Sun },
    { value: "dark" as const, icon: Moon },
    { value: "system" as const, icon: Monitor },
  ]

  useEffect(() => {
    const savedTheme = localStorage.getItem("inventory-gear-theme")
    if (savedTheme) {
      try {
        const parsed = JSON.parse(savedTheme)
        if (parsed.state?.theme) {
          setTheme(parsed.state.theme)
        }
      } catch {}
    }
  }, [setTheme])

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/50 p-4">
      <div className="absolute right-4 top-4 flex items-center gap-2">
        <div className="flex rounded-lg border p-0.5">
          <Button
            variant={language === "es" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => setLanguage("es")}
          >
            ES
          </Button>
          <Button
            variant={language === "en" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => setLanguage("en")}
          >
            EN
          </Button>
        </div>
        <div className="flex rounded-lg border p-0.5">
          {themes.map((t) => {
            const Icon = t.icon
            return (
              <Button
                key={t.value}
                variant={theme === t.value ? "secondary" : "ghost"}
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setTheme(t.value)}
              >
                <Icon className="h-3.5 w-3.5" />
              </Button>
            )
          })}
        </div>
      </div>

      <div className="flex w-full max-w-5xl items-center gap-8 lg:gap-16">
        <div className="hidden flex-1 flex-col gap-4 lg:flex">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
              <Package className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{t("common.appName")}</h1>
              <p className="text-sm text-muted-foreground">{t("auth.welcomeSubtitle")}</p>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            <div className="rounded-lg border bg-card p-4">
              <p className="text-sm text-muted-foreground">{t("auth.loginHelp")}</p>
            </div>
          </div>
        </div>

        <Card className="w-full max-w-sm shrink-0 shadow-xl">
          <CardHeader className="pb-4 pt-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow lg:hidden">
              <Package className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-semibold">{t("auth.welcome")}</h2>
            <p className="text-sm text-muted-foreground">{t("auth.signInPrompt")}</p>
          </CardHeader>
          <CardContent className="pb-6">
            <LoginForm onSuccess={() => navigate("/dashboard", { replace: true })} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
