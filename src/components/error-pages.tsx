import { useTranslation } from "react-i18next"
import { ShieldOff, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"

export function UnauthorizedPage() {
  const { t } = useTranslation()

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-center max-w-sm">
        <div className="rounded-full bg-muted p-4">
          <Lock className="h-8 w-8 text-muted-foreground" />
        </div>
        <h1 className="text-xl font-bold">{t("common.unauthorized")}</h1>
        <p className="text-sm text-muted-foreground">{t("common.unauthorizedDesc")}</p>
      </div>
    </div>
  )
}

export function ForbiddenPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-center max-w-sm">
        <div className="rounded-full bg-destructive/10 p-4">
          <ShieldOff className="h-8 w-8 text-destructive" />
        </div>
        <h1 className="text-xl font-bold">{t("common.forbidden")}</h1>
        <p className="text-sm text-muted-foreground">{t("common.forbiddenDesc")}</p>
        <Button variant="outline" onClick={() => navigate("/dashboard")}>
          {t("common.goToDashboard")}
        </Button>
      </div>
    </div>
  )
}
