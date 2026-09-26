import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Download, FileUp, FileSpreadsheet, Loader2, PackageOpen } from "lucide-react"
import { open, save } from "@tauri-apps/plugin-dialog"
import { EntityListPage } from "@/components/entity"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SelectField } from "@/components/forms"
import { DataTable } from "@/components/data-table"
import type { TableColumn } from "@/types/crud"
import {
  exportProductsXlsx,
  exportProductsTemplate,
  previewProductImport,
  executeProductImport,
  previewDemoCatalog,
  executeDemoCatalog,
  getImportHistory,
} from "@/lib/tauri"
import type {
  ExportScope, ImportHistoryRow, ImportMode, ImportPreview, ImportResult, RowPreview,
} from "@/types/inventory"
import { useAuthStore, useBusinessStore } from "@/stores"
import { useBusinessCapabilities, usePermission, useInvalidateStock } from "@/hooks"
import { useNotification } from "@/hooks/use-notification"
import { StoreSelector } from "@/components/store-selector"

type ImportSource = "file" | "demo"

export function ImportExportPage() {
  const { t } = useTranslation()
  const notification = useNotification()
  const queryClient = useQueryClient()
  const invalidateStock = useInvalidateStock()
  const capabilities = useBusinessCapabilities()
  const currentStoreId = useBusinessStore((s) => s.currentStoreId)
  const user = useAuthStore((s) => s.user)
  const canExport = usePermission("inventory.export")
  const canImport = usePermission("inventory.import")

  const [exportScope, setExportScope] = useState<ExportScope>("active")
  const [importFile, setImportFile] = useState<string | null>(null)
  const [importSource, setImportSource] = useState<ImportSource>("file")
  const [importMode, setImportMode] = useState<ImportMode>("append")
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [previewPage, setPreviewPage] = useState(1)

  const { data: history = [] } = useQuery({
    queryKey: ["import-history"],
    queryFn: getImportHistory,
  })

  const exportMutation = useMutation({
    mutationFn: exportProductsXlsx,
    onSuccess: (res) => {
      notification.success(
        t("inventory.exportDownloaded"),
        t("inventory.exportDownloadedDetails", { count: res.productCount, filename: res.filename })
      )
    },
    onError: (err) => notification.error(t("common.error"), String(err)),
  })

  const templateMutation = useMutation({
    mutationFn: exportProductsTemplate,
    onSuccess: (res) => {
      notification.success(t("inventory.downloadTemplate"), t("inventory.templateDownloaded", { filename: res.filename }))
    },
    onError: (err) => notification.error(t("common.error"), String(err)),
  })

  const previewMutation = useMutation({
    mutationFn: (args: { path: string | null; mode: ImportMode; storeId: number | null }) =>
      importSource === "demo"
        ? previewDemoCatalog({ mode: args.mode, storeId: args.storeId })
        : previewProductImport({ path: args.path ?? "", mode: args.mode, storeId: args.storeId }),
    onSuccess: (data) => {
      setPreview(data)
      setResult(null)
      setPreviewPage(1)
      if (data.errorRows.length === 0) {
        notification.info(t("inventory.preview"), t("inventory.previewGenerated"))
      } else {
        notification.warning(t("inventory.preview"), `${data.errorRows.length} ${t("inventory.rowsWithErrors").toLowerCase()}`)
      }
    },
    onError: (err) => notification.error(t("common.error"), String(err)),
  })

  const importMutation = useMutation({
    mutationFn: (args: { path: string | null; mode: ImportMode; storeId: number | null }) =>
      importSource === "demo"
        ? executeDemoCatalog({ mode: args.mode, storeId: args.storeId, createdBy: user?.id ?? null })
        : executeProductImport({ path: args.path ?? "", mode: args.mode, storeId: args.storeId, createdBy: user?.id ?? null }),
    onSuccess: (res) => {
      setResult(res)
      if (res.ok) {
        notification.success(
          t("inventory.importSuccess"),
          t("inventory.importSuccessDetails", {
            inserted: res.inserted, updated: res.updated, skipped: res.skipped,
            inc: res.stockIncreased, dec: res.stockDecreased,
          })
        )
        // An import moves stock in bulk. ["inventory-dashboard"] was invalidated
        // here, but no query uses that key — the real one is
        // "inventory-dashboard-stats" — so the counts never refreshed.
        invalidateStock()
        queryClient.invalidateQueries({ queryKey: ["import-history"] })
      } else {
        notification.error(t("inventory.importCancelled"), res.message ?? t("inventory.importCancelledMessage"))
      }
    },
    onError: (err) => notification.error(t("common.error"), String(err)),
  })

  const handlePickFile = async () => {
    const selected = await open({
      multiple: false,
      directory: false,
      filters: [{ name: "Excel", extensions: ["xlsx"] }],
    })
    if (typeof selected === "string") {
      setImportFile(selected)
      setImportSource("file")
      setPreview(null)
      setResult(null)
    }
  }

  const handleExport = async () => {
    const selected = await save({
      defaultPath: `inventario-${new Date().toISOString().slice(0, 10)}.xlsx`,
      filters: [{ name: "Excel", extensions: ["xlsx"] }],
    })
    if (!selected) return
    exportMutation.mutate({ path: selected, scope: exportScope, createdBy: user?.id })
  }

  const handleTemplate = async () => {
    const selected = await save({
      defaultPath: "plantilla-importacion-productos.xlsx",
      filters: [{ name: "Excel", extensions: ["xlsx"] }],
    })
    if (!selected) return
    templateMutation.mutate({ path: selected })
  }

  const handlePreview = () => {
    if (importSource === "file" && !importFile) {
      notification.warning(t("inventory.importInventory"), t("inventory.noFileSelected"))
      return
    }
    previewMutation.mutate({ path: importFile, mode: importMode, storeId: currentStoreId })
  }

  const handleImport = () => {
    if (!preview) return
    if (importSource === "file" && !importFile) return
    importMutation.mutate({ path: importFile, mode: importMode, storeId: currentStoreId })
  }

  const previewSlice = useMemo(() => {
    if (!preview) return []
    const pageSize = 50
    const start = (previewPage - 1) * pageSize
    return preview.rows.slice(start, start + pageSize)
  }, [preview, previewPage])

  const actionBadge = (row: RowPreview) => {
    const variantMap: Record<RowPreview["action"], "default" | "success" | "secondary" | "destructive"> = {
      insert: "default",
      update: "secondary",
      skip: "success",
      error: "destructive",
    }
    return <Badge variant={variantMap[row.action]}>{t(`inventory.action${row.action.charAt(0).toUpperCase() + row.action.slice(1)}`)}</Badge>
  }

  const columns: TableColumn<RowPreview>[] = [
    { id: "rowNumber", header: "#", accessorKey: "rowNumber" },
    {
      id: "sku", header: t("inventory.sku"), accessorKey: "sku",
      cell: (r) => r.sku || "-",
    },
    {
      id: "name", header: t("inventory.productName"), accessorKey: "name",
      cell: (r) => r.name || "-",
    },
    {
      id: "action", header: t("inventory.action"), accessorKey: "action",
      cell: actionBadge,
    },
    {
      id: "reason", header: t("inventory.preview"), accessorKey: "reason",
      cell: (r) => (r.reason ? <span className="text-muted-foreground">{r.reason}</span> : (r.errors.length ? <span className="text-destructive">{r.errors.join(" · ")}</span> : "-")),
    },
    {
      id: "currentStock", header: t("inventory.currentStock"), accessorKey: "currentStock",
      cell: (r) => r.currentStock ?? "-",
    },
    {
      id: "newStock", header: t("inventory.newStock"), accessorKey: "newStock",
      cell: (r) => r.newStock ?? "-",
    },
    {
      id: "stockChange", header: t("inventory.stockChange"), accessorKey: "stockChange",
      cell: (r) => {
        if (r.stockChange == null) return "-"
        return <span className={r.stockChange > 0 ? "text-emerald-600" : r.stockChange < 0 ? "text-destructive" : ""}>{r.stockChange > 0 ? `+${r.stockChange}` : r.stockChange}</span>
      },
    },
  ]

  if (!canExport && !canImport) {
    return (
      <EntityListPage title={t("inventory.importExport")} description={t("inventory.importExportDescription")}>
        <p className="py-16 text-center text-sm text-muted-foreground">{t("inventory.permissionNeeded")}</p>
      </EntityListPage>
    )
  }

  const historyColumns: TableColumn<ImportHistoryRow>[] = [
    { id: "filename", header: t("inventory.selectedFile"), accessorKey: "filename" },
    {
      id: "importMode", header: t("inventory.historyMode"), accessorKey: "importMode",
      cell: (r) => <Badge variant="secondary">{r.importMode}</Badge>,
    },
    { id: "inserted", header: t("inventory.createdRows"), accessorKey: "inserted" },
    { id: "updated", header: t("inventory.updatedRows"), accessorKey: "updated" },
    { id: "skipped", header: t("inventory.skippedRows"), accessorKey: "skipped" },
    {
      id: "errors", header: t("inventory.errorCount"), accessorKey: "errors",
      cell: (r) => (r.errors > 0 ? <span className="font-medium text-destructive">{r.errors}</span> : r.errors),
    },
    {
      id: "stockDelta", header: t("inventory.stockDelta"), accessorKey: "stockIncreased",
      cell: (r) => {
        const delta = r.stockIncreased - r.stockDecreased
        return <span className={delta > 0 ? "text-emerald-600" : delta < 0 ? "text-destructive" : ""}>{delta > 0 ? `+${delta}` : delta}</span>
      },
    },
    { id: "createdBy", header: t("common.createdBy"), accessorKey: "createdBy", cell: (r) => r.createdBy || "-" },
    { id: "createdAt", header: t("common.createdAt"), accessorKey: "createdAt", cell: (r) => new Date(r.createdAt).toLocaleString() },
  ]

  return (
    <EntityListPage title={t("inventory.importExport")} description={t("inventory.importExportDescription")}>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {canExport ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Download className="h-4 w-4" /> {t("inventory.exportInventory")}
              </CardTitle>
              <CardDescription>{t("inventory.exportInventoryCardDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <SelectField
                label={t("inventory.exportScope")}
                value={exportScope}
                onChange={(v) => setExportScope((v as ExportScope) || "active")}
                options={[
                  { label: t("inventory.exportScopeActive"), value: "active" },
                  { label: t("inventory.exportScopeAll"), value: "all" },
                ]}
              />
              <Button onClick={handleExport} disabled={exportMutation.isPending}>
                {exportMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                {t("inventory.exportInventory")}
              </Button>
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileSpreadsheet className="h-4 w-4" /> {t("inventory.downloadTemplate")}
            </CardTitle>
            <CardDescription>{t("inventory.downloadTemplateDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleTemplate} disabled={templateMutation.isPending}>
              {templateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
              {t("inventory.downloadTemplate")}
            </Button>
          </CardContent>
        </Card>

        {canImport ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <PackageOpen className="h-4 w-4" /> {t("inventory.importInventory")}
              </CardTitle>
              <CardDescription>{t("inventory.importInventoryCardDescription")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <SelectField
                label={t("inventory.importSource")}
                value={importSource}
                onChange={(v) => {
                  setImportSource((v as ImportSource) || "file")
                  setPreview(null)
                  setResult(null)
                }}
                options={[
                  { label: t("inventory.importSourceFile"), value: "file" },
                  { label: t("inventory.importSourceDemo"), value: "demo" },
                ]}
              />
              {importSource === "demo" ? (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="truncate">
                    {t("inventory.demoCatalogName")}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{t("inventory.demoCatalogNotice")}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={handlePickFile}>
                    <FileUp className="h-4 w-4" /> {t("inventory.selectFile")}
                  </Button>
                  {importFile ? (
                    <Badge variant="secondary" className="max-w-56 truncate" title={importFile}>
                      {importFile.split(/[\\/]/).pop()}
                    </Badge>
                  ) : null}
                </div>
              )}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <SelectField
                  label={t("inventory.importMode")}
                  value={importMode}
                  onChange={(v) => setImportMode((v as ImportMode) || "append")}
                  options={[
                    { label: t("inventory.modeAppend"), value: "append" },
                    { label: t("inventory.modeUpdate"), value: "update" },
                  ]}
                />
                {capabilities.storeSelection ? (
                  <StoreSelector />
                ) : null}
              </div>
              <Button
                onClick={handlePreview}
                disabled={(importSource === "file" && !importFile) || previewMutation.isPending}
              >
                {previewMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
                {preview ? t("inventory.previewAgain") : t("inventory.preview")}
              </Button>
            </CardContent>
          </Card>
        ) : null}
      </div>

      {preview ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <span>{t("inventory.previewTable")} — {preview.filename}</span>
              <div className="flex flex-wrap gap-2 text-xs">
                <Badge>{preview.totalRows} {t("inventory.totalRows").toLowerCase()}</Badge>
                <Badge variant="outline">{t("inventory.rowsCreated")}: {preview.insertCount}</Badge>
                <Badge variant="secondary">{t("inventory.rowsUpdated")}: {preview.updateCount}</Badge>
                <Badge variant="success">{t("inventory.rowsSkipped")}: {preview.skipCount}</Badge>
                <Badge variant="destructive">{t("inventory.rowsWithErrors")}: {preview.errorCount}</Badge>
              </div>
            </CardTitle>
            <CardDescription className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-xs">{t("inventory.stockIncrease")}: {preview.stockIncreaseCount}</Badge>
              <Badge variant="outline" className="text-xs">{t("inventory.stockDecrease")}: {preview.stockDecreaseCount}</Badge>
              <Badge variant="outline" className="text-xs">{t("inventory.stockUnchanged")}: {preview.stockUnchangedCount}</Badge>
              {preview.equivalentCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {t("inventory.equivalents.created")}: {preview.equivalentCount}
                </Badge>
              )}
              {preview.rowsTruncated ? <Badge variant="outline" className="text-xs">{t("inventory.rowsTruncated")}</Badge> : null}
            </CardDescription>
          </CardHeader>
          {preview.rows.length > 0 ? (
            <CardContent>
              <DataTable
                data={previewSlice}
                columns={columns}
                total={preview.rows.length}
                page={previewPage}
                pageSize={50}
                onPageChange={setPreviewPage}
                rowId={(r) => r.rowNumber}
                disableSearch
                disableColumnToggle
              />
            </CardContent>
          ) : null}
          <CardContent className="flex flex-col items-end gap-4 border-t pt-4">
            {preview.errorCount > 0 ? (
              <div className="w-full space-y-1">
                <p className="text-sm font-medium text-destructive">{t("inventory.errorList")}</p>
                <div className="max-h-40 overflow-y-auto rounded-lg border bg-destructive/5 p-3 text-sm">
                  {preview.errorRows.map((e) => (
                    <p key={`${e.rowNumber}-${e.message}`} className="text-destructive">
                      <span className="font-medium">Fila {e.rowNumber}</span> ({e.sku || "-"}): {e.message}
                    </p>
                  ))}
                </div>
              </div>
            ) : null}

            {importMutation.isPending ? (
              <Button disabled>
                <Loader2 className="h-4 w-4 animate-spin" /> {t("inventory.importNow")}
              </Button>
            ) : (
              <Button onClick={handleImport} disabled={preview.errorCount > 0}>
                <PackageOpen className="h-4 w-4" /> {t("inventory.importNow")}
              </Button>
            )}

            {result ? (
              <div className="w-full rounded-lg border bg-muted/30 p-4 text-sm">
                {result.ok ? (
                  <p className="font-medium text-emerald-600">
                    {t("inventory.importSuccessDetails", {
                      inserted: result.inserted, updated: result.updated, skipped: result.skipped,
                      inc: result.stockIncreased, dec: result.stockDecreased,
                    })}
                  </p>
                ) : (
                  <p className="font-medium text-destructive">{result.message ?? t("inventory.importCancelledMessage")}</p>
                )}
                {result.ok && result.equivalentCreated > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {t("inventory.equivalents.created")}: {result.equivalentCreated}
                  </p>
                )}
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("inventory.importHistory")}</CardTitle>
          <CardDescription>{t("inventory.importHistoryDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={history}
            columns={historyColumns}
            total={history.length}
            page={1}
            pageSize={history.length}
            rowId={(r) => r.id}
            emptyMessage={t("common.noData")}
            disableSearch
            disableColumnToggle
          />
        </CardContent>
      </Card>
    </EntityListPage>
  )
}