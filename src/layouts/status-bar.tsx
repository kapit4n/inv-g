import { Wifi, Database, Clock } from "lucide-react"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"

export function StatusBar() {
  const [time, setTime] = useState(new Date())
  const { t } = useTranslation()

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <footer className="flex h-7 items-center justify-between border-t bg-muted/30 px-4 text-[11px] text-muted-foreground">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <Wifi className="h-3 w-3 text-emerald-500" />
          <span>{t("common.connected")}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Database className="h-3 w-3" />
          <span>{t("common.database")}</span>
          <Badge variant="outline" className="h-4 px-1 py-0 text-[9px]">{t("common.local")}</Badge>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span>{t("common.version")} 0.1.0</span>
        <div className="flex items-center gap-1.5">
          <Clock className="h-3 w-3" />
          <span>{format(time, "MMM dd, yyyy HH:mm:ss")}</span>
        </div>
      </div>
    </footer>
  )
}
