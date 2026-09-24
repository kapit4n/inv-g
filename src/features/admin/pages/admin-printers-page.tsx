import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Plus, Printer, Star, MoreHorizontal } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { getPrinters, createPrinter, updatePrinter, deletePrinter, setDefaultPrinter, testPrinter, getPrinterTypes } from "@/lib/tauri"
import type { PrinterSetting, PrinterInput } from "@/types"

export function AdminPrintersPage() {
  const { t } = useTranslation()
  const [printers, setPrinters] = useState<PrinterSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<PrinterSetting | null>(null)
  const [printerTypes, setPrinterTypes] = useState<string[]>([])
  const [form, setForm] = useState<PrinterInput>({
    name: "", printerType: "thermal", driverName: "", deviceName: "", interfaceType: "usb",
    ipAddress: "", port: 9100, paperSize: "80mm", margins: "0,0,0,0", copies: 1,
    orientation: "portrait", isDefault: false, config: "{}",
  })

  const loadPrinters = () => {
    setLoading(true)
    Promise.all([getPrinters(), getPrinterTypes()]).then(([p, types]) => {
      setPrinters(p)
      setPrinterTypes(types)
    }).finally(() => setLoading(false))
  }

  useEffect(() => { loadPrinters() }, [])

  const handleSave = async () => {
    if (editing) {
      await updatePrinter(editing.id, form)
    } else {
      await createPrinter(form)
    }
    setDialogOpen(false)
    setEditing(null)
    resetForm()
    loadPrinters()
  }

  const handleDelete = async (id: number) => {
    await deletePrinter(id)
    loadPrinters()
  }

  const handleSetDefault = async (id: number) => {
    await setDefaultPrinter(id)
    loadPrinters()
  }

  const handleTest = async (id: number) => {
    await testPrinter(id)
  }

  const resetForm = () => {
    setForm({ name: "", printerType: "thermal", driverName: "", deviceName: "", interfaceType: "usb", ipAddress: "", port: 9100, paperSize: "80mm", margins: "0,0,0,0", copies: 1, orientation: "portrait", isDefault: false, config: "{}" })
  }

  const openEdit = (printer: PrinterSetting) => {
    setEditing(printer)
    setForm({
      name: printer.name, printerType: printer.printerType, driverName: printer.driverName || "",
      deviceName: printer.deviceName || "", interfaceType: printer.interfaceType,
      ipAddress: printer.ipAddress || "", port: printer.port || 9100, paperSize: printer.paperSize,
      margins: printer.margins, copies: printer.copies, orientation: printer.orientation,
      isDefault: printer.isDefault, config: printer.config,
    })
    setDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("admin.printers.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("admin.printers.description")}</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditing(null); resetForm() }}}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> {t("admin.printers.add")}</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editing ? t("admin.printers.edit") : t("admin.printers.add")}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("admin.printers.name")}</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>{t("admin.printers.type")}</Label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.printerType} onChange={(e) => setForm({ ...form, printerType: e.target.value })}>
                    {printerTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>{t("admin.printers.connectionType")}</Label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.interfaceType} onChange={(e) => setForm({ ...form, interfaceType: e.target.value })}>
                    <option value="usb">USB</option><option value="network">Network</option><option value="bluetooth">Bluetooth</option>
                  </select>
                </div>
                {form.interfaceType === "network" && (
                  <>
                    <div className="space-y-2">
                      <Label>{t("admin.printers.ipAddress")}</Label>
                      <Input value={form.ipAddress} onChange={(e) => setForm({ ...form, ipAddress: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("admin.printers.port")}</Label>
                      <Input type="number" value={form.port} onChange={(e) => setForm({ ...form, port: Number(e.target.value) })} />
                    </div>
                  </>
                )}
                <div className="space-y-2">
                  <Label>{t("admin.printers.paperSize")}</Label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.paperSize} onChange={(e) => setForm({ ...form, paperSize: e.target.value })}>
                    <option value="80mm">80mm</option><option value="58mm">58mm</option><option value="letter">Letter</option><option value="a4">A4</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>{t("admin.printers.orientation")}</Label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.orientation} onChange={(e) => setForm({ ...form, orientation: e.target.value })}>
                    <option value="portrait">{t("admin.printers.portrait")}</option>
                    <option value="landscape">{t("admin.printers.landscape")}</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>{t("admin.printers.copies")}</Label>
                  <Input type="number" value={form.copies} onChange={(e) => setForm({ ...form, copies: Number(e.target.value) })} />
                </div>
                <div className="space-y-2 flex items-end pb-2">
                  <div className="flex items-center gap-2">
                    <Switch checked={form.isDefault} onCheckedChange={(v) => setForm({ ...form, isDefault: v })} />
                    <Label>{t("admin.printers.isDefault")}</Label>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setDialogOpen(false); setEditing(null); resetForm() }}>{t("common.cancel")}</Button>
                <Button onClick={handleSave}>{t("common.save")}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1,2].map((i) => <Card key={i}><CardContent className="p-6"><Skeleton className="h-32 w-full" /></CardContent></Card>)}
        </div>
      ) : printers.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">{t("admin.printers.noPrinters")}</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {printers.map((printer) => (
            <Card key={printer.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Printer className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{printer.name}</p>
                        {printer.isDefault && <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />}
                      </div>
                      <p className="text-xs text-muted-foreground">{printer.printerType} - {printer.interfaceType}</p>
                      {printer.ipAddress && <p className="text-xs text-muted-foreground">{printer.ipAddress}:{printer.port}</p>}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant={printer.isActive ? "success" : "secondary"}>{printer.isActive ? t("admin.printers.active") : t("admin.printers.inactive")}</Badge>
                        <span className="text-xs text-muted-foreground">{printer.paperSize} / {printer.orientation}</span>
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(printer)}>{t("admin.printers.edit")}</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleTest(printer.id)}>{t("admin.printers.testPrint")}</DropdownMenuItem>
                      {!printer.isDefault && <DropdownMenuItem onClick={() => handleSetDefault(printer.id)}>{t("admin.printers.setDefault")}</DropdownMenuItem>}
                      <DropdownMenuItem onClick={() => handleDelete(printer.id)}>{t("admin.printers.delete")}</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}