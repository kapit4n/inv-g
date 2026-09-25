import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/data-table"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { TextField, TextareaField } from "@/components/forms"
import { getCashRegisterStatus, getCashRegisterSessions, openCashRegister, closeCashRegister, getDailyCloseout } from "@/lib/tauri"
import { useNotification } from "@/hooks/use-notification"
import type { TableColumn } from "@/types/crud"
import type { CashRegisterSession } from "@/types"

export function CashRegisterPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const notification = useNotification()

  const { data: activeSession } = useQuery({
    queryKey: ["cash-register-status"],
    queryFn: getCashRegisterStatus,
    refetchInterval: 5000,
  })

  const { data: sessions = [] } = useQuery({
    queryKey: ["cash-register-sessions"],
    queryFn: getCashRegisterSessions,
  })

  const { data: closeout } = useQuery({
    queryKey: ["daily-closeout"],
    queryFn: getDailyCloseout,
  })

  const [openDialog, setOpenDialog] = useState(false)
  const [closeDialog, setCloseDialog] = useState(false)
  const [openingBalance, setOpeningBalance] = useState(0)
  const [closingBalance, setClosingBalance] = useState(0)
  const [notes, setNotes] = useState("")

  const openMutation = useMutation({
    mutationFn: () => openCashRegister(1, openingBalance, notes || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cash-register-status"] })
      queryClient.invalidateQueries({ queryKey: ["cash-register-sessions"] })
      notification.success(t("common.success"), t("registerOpened"))
      setOpenDialog(false)
    },
    onError: (err) => {
      notification.error(t("common.error"), String(err))
    },
  })

  const closeMutation = useMutation({
    mutationFn: () => closeCashRegister(activeSession!.id, closingBalance, notes || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cash-register-status"] })
      queryClient.invalidateQueries({ queryKey: ["cash-register-sessions"] })
      notification.success(t("common.success"), t("registerClosed"))
      setCloseDialog(false)
    },
    onError: (err) => {
      notification.error(t("common.error"), String(err))
    },
  })

  const columns: TableColumn<CashRegisterSession>[] = [
    { id: "openedAt", header: t("openedAt"), accessorKey: "openedAt", cell: (r) => new Date(r.openedAt).toLocaleString() },
    { id: "closedAt", header: t("closedAt"), accessorKey: "closedAt", cell: (r) => r.closedAt ? new Date(r.closedAt).toLocaleString() : "-" },
    { id: "user", header: t("user"), accessorKey: "userName" },
    { id: "opening", header: t("opening"), accessorKey: "openingBalance", cell: (r) => r.openingBalance.toLocaleString("en-US", { style: "currency", currency: "USD" }) },
    { id: "closing", header: t("closing"), accessorKey: "closingBalance", cell: (r) => r.closingBalance ? r.closingBalance.toLocaleString("en-US", { style: "currency", currency: "USD" }) : "-" },
    { id: "expected", header: t("expected"), accessorKey: "expectedBalance", cell: (r) => r.expectedBalance ? r.expectedBalance.toLocaleString("en-US", { style: "currency", currency: "USD" }) : "-" },
    {
      id: "difference", header: t("difference"), accessorKey: "difference",
      cell: (r) => r.difference !== null && r.difference !== undefined ? (
        <span className={r.difference >= 0 ? "text-green-600" : "text-red-600"}>{r.difference.toLocaleString("en-US", { style: "currency", currency: "USD" })}</span>
      ) : "-",
    },
    { id: "status", header: t("status"), accessorKey: "status", cell: (r) => <Badge variant={r.status === "open" ? "default" : "secondary"}>{r.status}</Badge> },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("cashRegister")}
        description={t("manageCashRegisterSessions")}
        actions={
          activeSession ? (
            <Button variant="destructive" size="sm" onClick={() => { setClosingBalance(0); setCloseDialog(true) }}>
              {t("closeRegister")}
            </Button>
          ) : (
            <Button size="sm" onClick={() => { setOpeningBalance(0); setOpenDialog(true) }}>
              {t("openRegister")}
            </Button>
          )
        }
      />

      {activeSession && (
        <Card className="border-green-500">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Badge variant="default" className="bg-green-500">{t("openSession")}</Badge>
              <span className="text-sm font-normal text-muted-foreground">{t("since", { date: new Date(activeSession.openedAt).toLocaleString() })}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">{t("openingBalance")}</p>
                <p className="text-2xl font-bold">{activeSession.openingBalance.toLocaleString("en-US", { style: "currency", currency: "USD" })}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("cashSalesToday")}</p>
                <p className="text-2xl font-bold">{closeout?.cashTotal.toLocaleString("en-US", { style: "currency", currency: "USD" }) || "$0.00"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("expected")}</p>
                <p className="text-2xl font-bold">{((activeSession.openingBalance || 0) + (closeout?.cashTotal || 0)).toLocaleString("en-US", { style: "currency", currency: "USD" })}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">{t("sessionHistory")}</CardTitle></CardHeader>
        <CardContent className="p-0">
          <DataTable columns={columns} data={sessions} />
        </CardContent>
      </Card>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("openCashRegister")}</DialogTitle></DialogHeader>
          <TextField label={t("openingBalance")} type="number" value={openingBalance} onChange={(e) => setOpeningBalance(Number(e.target.value) || 0)} />
          <TextareaField label={t("notes")} value={notes} onChange={(e) => setNotes(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(false)}>{t("cancel")}</Button>
            <Button onClick={() => openMutation.mutate()} disabled={openMutation.isPending}>{t("openRegister")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={closeDialog} onOpenChange={setCloseDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("closeCashRegister")}</DialogTitle></DialogHeader>
          <TextField label={t("closingBalanceCount")} type="number" value={closingBalance} onChange={(e) => setClosingBalance(Number(e.target.value) || 0)} />
          <TextareaField label={t("notes")} value={notes} onChange={(e) => setNotes(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCloseDialog(false)}>{t("cancel")}</Button>
            <Button variant="destructive" onClick={() => closeMutation.mutate()} disabled={closeMutation.isPending}>{t("closeRegister")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
