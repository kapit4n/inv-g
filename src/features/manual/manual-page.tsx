import { useState, useRef, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Book, Download, ExternalLink, RefreshCw } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

export function ManualPage() {
  const { t } = useTranslation()
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    const handleLoad = () => setLoading(false)
    const handleError = () => {
      setLoadError(true)
      setLoading(false)
    }

    iframe.addEventListener("load", handleLoad)
    iframe.addEventListener("error", handleError)

    return () => {
      iframe.removeEventListener("load", handleLoad)
      iframe.removeEventListener("error", handleError)
    }
  }, [])

  const handleRefresh = () => {
    setLoading(true)
    setLoadError(false)
    if (iframeRef.current) {
      iframeRef.current.src = "/manual/index.html"
    }
  }

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title={t("help.userManual", "User Manual")}
        description={t("help.userManualDescription", "Browse the complete user guide for Inventory Gear")}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="mr-2 h-4 w-4" />
              {t("common.refresh", "Refresh")}
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="/manual/index.html" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                {t("help.openInNewTab", "Open in New Tab")}
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="/inventory-gear-user-manual.pdf" download>
                <Download className="mr-2 h-4 w-4" />
                {t("help.downloadPdf", "Download PDF")}
              </a>
            </Button>
          </div>
        }
      />

      <Card className="flex-1 overflow-hidden">
        <CardContent className="relative h-full p-0">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80">
              <div className="flex flex-col items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <p className="text-sm text-muted-foreground">
                  {t("help.loadingManual", "Loading manual...")}
                </p>
              </div>
            </div>
          )}

          {loadError ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-muted-foreground">
              <Book className="h-16 w-16 opacity-50" />
              <div className="text-center">
                <p className="text-lg font-medium">{t("help.manualNotAvailable", "Manual not available")}</p>
                <p className="text-sm">
                  {t("help.manualBuildRequired", "Build the documentation first with: npm run docs:build")}
                </p>
              </div>
              <Button variant="outline" onClick={handleRefresh}>
                <RefreshCw className="mr-2 h-4 w-4" />
                {t("common.retry", "Retry")}
              </Button>
            </div>
          ) : (
            <iframe
              ref={iframeRef}
              src="/manual/index.html"
              className="h-full w-full border-0"
              title={t("help.userManual", "User Manual")}
              sandbox="allow-same-origin allow-scripts allow-popups"
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
