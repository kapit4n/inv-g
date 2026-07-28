import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { DollarSign, CreditCard, Building2, History } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { DataTable } from "@/components/data-table"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { TextField, TextareaField } from "@/components/forms"
import { getCashRegisterStatus, getCashRegisterSessions, openCashRegister, closeCashRegister, getDailyCloseout } from "@/lib/tauri"
import { useNotification } from "@/hooks/use-notification"

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
      notification.success(t("common.success"), "Register opened")
      setOpenDialog(false)
    },
  })

  const closeMutation = useMutation({
    mutationFn: () => closeCashRegister(activeSession!.id, closingBalance, notes || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cash-register-status"] })
      queryClient.invalidateQueries({ queryKey: ["cash-register-sessions"] })
      notification.success(t("common.success"), "Register closed")
      setCloseDialog(false)
    },
  })

  const columns = [
    { header: "Opened At", accessorKey: "openedAt" as const, cell: (v: string) => new Date(v).toLocaleString() },
    { header: "Closed At", accessorKey: "closedAt" as const, cell: (v: string) => v ? new Date(v).toLocaleString() : "-" },
    { header: "User", accessorKey: "userName" as const },
    { header: "Opening", accessorKey: "openingBalance" as const, cell: (v: number) => v.toLocaleString("en-US", { style: "currency", currency: "USD" }) },
    { header: "Closing", accessorKey: "closingBalance" as const, cell: (v: number) => v ? v.toLocaleString("en-US", { style: "currency", currency: "USD" }) : "-" },
    { header: "Expected", accessorKey: "expectedBalance" as const, cell: (v: number) => v ? v.toLocaleString("en-US", { style: "currency", currency: "USD" }) : "-" },
    {
      header: "Difference", accessorKey: "difference" as const,
      cell: (v: number) => v !== null && v !== undefined ? (
        <span className={v >= 0 ? "text-green-600" : "text-red-600"}>{v.toLocaleString("en-US", { style: "currency", currency: "USD" })}</span>
      ) : "-",
    },
    { header: "Status", accessorKey: "status" as const, cell: (v: string) => <Badge variant={v === "open" ? "default" : "secondary"}>{v}</Badge> },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cash Register"
        description="Manage cash register sessions"
        actions={
          activeSession ? (
            <Button variant="destructive" size="sm" onClick={() => { setClosingBalance(0); setCloseDialog(true) }}>
              Close Register
            </Button>
          ) : (
            <Button size="sm" onClick={() => { setOpeningBalance(0); setOpenDialog(true) }}>
              Open Register
            </Button>
          )
        }
      />

      {activeSession && (
        <Card className="border-green-500">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Badge variant="default" className="bg-green-500">Open Session</Badge>
              <span className="text-sm font-normal text-muted-foreground">Since {new Date(activeSession.openedAt).toLocaleString()}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Opening Balance</p>
                <p className="text-2xl font-bold">{activeSession.openingBalance.toLocaleString("en-US", { style: "currency", currency: "USD" })}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cash Sales Today</p>
                <p className="text-2xl font-bold">{closeout?.cashTotal.toLocaleString("en-US", { style: "currency", currency: "USD" }) || "$0.00"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Expected</p>
                <p className="text-2xl font-bold">{((activeSession.openingBalance || 0) + (closeout?.cashTotal || 0)).toLocaleString("en-US", { style: "currency", currency: "USD" })}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Session History</CardTitle></CardHeader>
        <CardContent className="p-0">
          <DataTable columns={columns} data={sessions} />
        </CardContent>
      </Card>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Open Cash Register</DialogTitle></DialogHeader>
          <TextField label="Opening Balance" type="number" value={openingBalance} onChange={(v) => setOpeningBalance(Number(v))} />
          <TextareaField label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button onClick={() => openMutation.mutate()} disabled={openMutation.isPending}>Open Register</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={closeDialog} onOpenChange={setCloseDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Close Cash Register</DialogTitle></DialogHeader>
          <TextField label="Closing Balance (actual cash count)" type="number" value={closingBalance} onChange={(v) => setClosingBalance(Number(v))} />
          <TextareaField label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCloseDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => closeMutation.mutate()} disabled={closeMutation.isPending}>Close Register</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
