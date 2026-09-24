import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Plus, MoreHorizontal } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { getDevices, createDevice, updateDevice, deleteDevice, testDevice, getDeviceTypes } from "@/lib/tauri"
import type { DeviceSetting, DeviceInput } from "@/types"

export function AdminDevicesPage() {
  const { t } = useTranslation()
  const [devices, setDevices] = useState<DeviceSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<DeviceSetting | null>(null)
  const [deviceTypes, setDeviceTypes] = useState<string[]>([])
  const [form, setForm] = useState<DeviceInput>({
    name: "", deviceType: "scanner", identifier: "", interfaceType: "usb", config: "{}",
  })

  const loadDevices = () => {
    setLoading(true)
    Promise.all([getDevices(), getDeviceTypes()]).then(([d, types]) => {
      setDevices(d)
      setDeviceTypes(types)
    }).finally(() => setLoading(false))
  }

  useEffect(() => { loadDevices() }, [])

  const handleSave = async () => {
    if (editing) {
      await updateDevice(editing.id, form)
    } else {
      await createDevice(form)
    }
    setDialogOpen(false)
    setEditing(null)
    resetForm()
    loadDevices()
  }

  const handleDelete = async (id: number) => {
    await deleteDevice(id)
    loadDevices()
  }

  const handleTest = async (id: number) => {
    await testDevice(id)
  }

  const resetForm = () => {
    setForm({ name: "", deviceType: "scanner", identifier: "", interfaceType: "usb", config: "{}" })
  }

  const openEdit = (device: DeviceSetting) => {
    setEditing(device)
    setForm({
      name: device.name, deviceType: device.deviceType,
      identifier: device.identifier || "", interfaceType: device.interfaceType, config: device.config,
    })
    setDialogOpen(true)
  }

  const deviceIcon = (type: string) => {
    const icons: Record<string, string> = {
      scanner: "🔍", barcode_reader: "📷", cash_drawer: "💰", card_terminal: "💳",
      scale: "⚖️", label_printer: "🏷️", display: "🖥️", other: "🔌",
    }
    return icons[type] || "🔌"
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("admin.devices.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("admin.devices.description")}</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditing(null); resetForm() }}}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> {t("admin.devices.add")}</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>{editing ? t("admin.devices.edit") : t("admin.devices.add")}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>{t("admin.devices.name")}</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>{t("admin.devices.type")}</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.deviceType} onChange={(e) => setForm({ ...form, deviceType: e.target.value })}>
                  {deviceTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>{t("admin.devices.connectionType")}</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.interfaceType} onChange={(e) => setForm({ ...form, interfaceType: e.target.value })}>
                  <option value="usb">USB</option><option value="bluetooth">Bluetooth</option><option value="network">Network</option><option value="serial">{t("admin.devices.serial")}</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>{t("admin.devices.identifierSerial")}</Label>
                <Input value={form.identifier} onChange={(e) => setForm({ ...form, identifier: e.target.value })} />
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1,2,3].map((i) => <Card key={i}><CardContent className="p-6"><Skeleton className="h-24 w-full" /></CardContent></Card>)}
        </div>
      ) : devices.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">{t("admin.devices.noDevices")}</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {devices.map((device) => (
            <Card key={device.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{deviceIcon(device.deviceType)}</div>
                    <div>
                      <p className="text-sm font-medium">{device.name}</p>
                      <p className="text-xs text-muted-foreground">{device.deviceType} ({device.interfaceType})</p>
                      {device.identifier && <p className="text-xs text-muted-foreground">ID: {device.identifier}</p>}
                      <Badge className="mt-2" variant={device.isActive ? "success" : "secondary"}>
                        {device.isActive ? t("admin.devices.active") : t("admin.devices.inactive")}
                      </Badge>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(device)}>{t("admin.devices.edit")}</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleTest(device.id)}>{t("admin.devices.testDevice")}</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(device.id)}>{t("admin.devices.delete")}</DropdownMenuItem>
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