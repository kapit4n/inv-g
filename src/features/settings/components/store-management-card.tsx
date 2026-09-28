import { useCallback, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Pencil, Plus, Power, Star, Trash2, Warehouse as WarehouseIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TextField, TextareaField } from "@/components/forms"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  createWarehouse,
  deleteWarehouse,
  getStoreDependencies,
  getWarehouses,
  setDefaultWarehouse,
  setWarehouseActive,
  updateWarehouse,
} from "@/lib/tauri"
import { businessErrorMessage } from "@/lib/business-errors"
import { useNotification } from "@/hooks/use-notification"
import { usePermission } from "@/hooks"
import { useBusinessStore } from "@/stores"
import type { StoreDependency, Warehouse } from "@/types/inventory"

/**
 * Store (almacén) management, in Settings.
 *
 * The store concept already exists as the `warehouses` table with an
 * `is_active` flag, and the business context already derives single vs multi
 * store mode from the number of active stores. This card is the management UI
 * that was missing: there was no way to activate, deactivate or delete a store,
 * because `create`/`update` never touched `is_active` and no delete command
 * existed at all.
 *
 * Two invariants are enforced on the backend, and mirrored here so the user is
 * not offered an action that will be refused:
 *
 *  - at least one store must stay active, so the last active one cannot be
 *    deactivated or deleted;
 *  - a store holding business data is never physically deleted.
 *
 * The active-store count is the only mode switch: there is no separate
 * single/multi store setting anywhere in this component, because the backend
 * recomputes it from the database on every read.
 */

/** Backend error codes that this UI can explain. */
const ERR_LAST_ACTIVE_STORE = "ERROR_LAST_ACTIVE_STORE"
const ERR_STORE_HAS_DEPENDENCIES = "ERROR_STORE_HAS_DEPENDENCIES"

interface StoreFormState {
  name: string
  code: string
  address: string
  city: string
  stateProvince: string
  country: string
  manager: string
  phone: string
  isActive: boolean
}

const EMPTY_FORM: StoreFormState = {
  name: "",
  code: "",
  address: "",
  city: "",
  stateProvince: "",
  country: "",
  manager: "",
  phone: "",
  isActive: true,
}

function toForm(warehouse: Warehouse): StoreFormState {
  return {
    name: warehouse.name,
    code: warehouse.code,
    address: warehouse.address ?? "",
    city: warehouse.city ?? "",
    stateProvince: warehouse.state ?? "",
    country: warehouse.country ?? "",
    manager: warehouse.manager ?? "",
    phone: warehouse.phone ?? "",
    isActive: warehouse.isActive,
  }
}

export function StoreManagementCard() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const notification = useNotification()
  const canManage = usePermission("inventory.warehouses.manage")
  const refreshBusiness = useBusinessStore((s) => s.refresh)

  const [editing, setEditing] = useState<Warehouse | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState<StoreFormState>(EMPTY_FORM)
  const [deleteTarget, setDeleteTarget] = useState<Warehouse | null>(null)

  // Shares the cache key with the inventory warehouses page, so a change made in
  // either place is reflected in the other without a second fetch.
  const { data: stores = [], isLoading } = useQuery({
    queryKey: ["inventory-warehouses"],
    queryFn: getWarehouses,
    enabled: canManage,
  })

  const { data: dependencies = [] } = useQuery({
    queryKey: ["store-dependencies", deleteTarget?.id],
    queryFn: () => getStoreDependencies(deleteTarget!.id),
    enabled: !!deleteTarget,
  })

  const activeStores = useMemo(() => stores.filter((s) => s.isActive), [stores])
  const activeCount = activeStores.length
  const isMultiStore = activeCount >= 2
  // Deactivating the only active store would leave the app with no store to
  // operate on, so the control is disabled and the backend refuses regardless.
  const canDeactivate = activeCount > 1

  const refreshAll = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ["inventory-warehouses"] })
    // The active-store count decides single vs multi store mode, so the business
    // context has to be re-read or the selector keeps offering a store that was
    // just deactivated.
    await refreshBusiness()
  }, [queryClient, refreshBusiness])

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name.trim(),
        code: form.code.trim(),
        address: form.address.trim() || undefined,
        city: form.city.trim() || undefined,
        stateProvince: form.stateProvince.trim() || undefined,
        country: form.country.trim() || undefined,
        manager: form.manager.trim() || undefined,
        phone: form.phone.trim() || undefined,
      }
      if (editing) {
        return updateWarehouse({ id: editing.id, ...payload })
      }
      return createWarehouse({ ...payload, isActive: form.isActive })
    },
    onSuccess: async () => {
      await refreshAll()
      notification.success(t("common.success"), editing ? t("settings.stores.editStore") : t("settings.stores.addStore"))
      setFormOpen(false)
      setEditing(null)
    },
    onError: (err) => notification.error(t("common.error"), businessErrorMessage(t, err)),
  })

  const activeMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) => setWarehouseActive(id, isActive),
    onSuccess: async () => {
      await refreshAll()
    },
    onError: (err) => notification.error(t("common.error"), businessErrorMessage(t, err)),
  })

  const defaultMutation = useMutation({
    mutationFn: (id: number) => setDefaultWarehouse(id),
    onSuccess: async () => {
      await refreshAll()
    },
    onError: (err) => notification.error(t("common.error"), businessErrorMessage(t, err)),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteWarehouse(id),
    onSuccess: async () => {
      await refreshAll()
      notification.success(t("common.success"), t("common.delete"))
      setDeleteTarget(null)
    },
    onError: (err) => {
      const raw = typeof err === "string" ? err : err instanceof Error ? err.message : String(err)
      if (raw === ERR_STORE_HAS_DEPENDENCIES) {
        // Re-query rather than reuse the pre-flight result: the counts may have
        // changed between opening the dialog and confirming.
        notification.error(
          t("common.error"),
          businessErrorMessage(t, raw, { summary: describeDependencies(dependencies) })
        )
        return
      }
      if (raw === ERR_LAST_ACTIVE_STORE) {
        notification.error(t("common.error"), t("settings.stores.lastActiveStore"))
        return
      }
      notification.error(t("common.error"), businessErrorMessage(t, err))
    },
  })

  if (!canManage) return null

  function describeDependencies(deps: StoreDependency[]): string {
    if (deps.length === 0) return "—"
    return deps
      .map((d) => t(`settings.stores.dependency_${d.entity}`, { count: d.count }))
      .join(", ")
  }

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormOpen(true)
  }

  const openEdit = (store: Warehouse) => {
    setEditing(store)
    setForm(toForm(store))
    setFormOpen(true)
  }

  const hasDependencies = dependencies.length > 0

  return (
    <>
      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-primary/10 p-3 text-primary">
                <WarehouseIcon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">{t("settings.stores.title")}</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">{t("settings.stores.description")}</p>
              </div>
            </div>
            <Button size="sm" onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" /> {t("settings.stores.addStore")}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            {t("settings.stores.activeStores", { count: activeCount })} ·{" "}
            {isMultiStore ? t("settings.stores.multiStoreMode") : t("settings.stores.singleStoreMode")}
          </p>

          {isLoading ? null : stores.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">{t("settings.stores.noStores")}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                    <th className="p-2 font-medium">{t("settings.stores.name")}</th>
                    <th className="p-2 font-medium">{t("settings.stores.code")}</th>
                    <th className="p-2 font-medium">{t("settings.stores.city")}</th>
                    <th className="p-2 font-medium">{t("settings.stores.manager")}</th>
                    <th className="p-2 font-medium">{t("common.status")}</th>
                    <th className="p-2 text-right font-medium">{t("common.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {stores.map((store) => (
                    <tr key={store.id} className="border-b last:border-0">
                      <td className="p-2 font-medium">
                        {store.name}
                        {store.isDefault && (
                          <Badge variant="info" className="ml-2">
                            {t("settings.stores.isDefault")}
                          </Badge>
                        )}
                      </td>
                      <td className="p-2 text-muted-foreground">{store.code}</td>
                      <td className="p-2 text-muted-foreground">{store.city || "-"}</td>
                      <td className="p-2 text-muted-foreground">{store.manager || "-"}</td>
                      <td className="p-2">
                        <Badge variant={store.isActive ? "success" : "secondary"}>
                          {store.isActive ? t("common.active") : t("common.inactive")}
                        </Badge>
                      </td>
                      <td className="p-2">
                        <div className="flex items-center justify-end gap-1">
                          {!store.isDefault && (
                            <Button
                              variant="ghost"
                              size="sm"
                              title={t("settings.stores.setDefault")}
                              onClick={() => defaultMutation.mutate(store.id)}
                            >
                              <Star className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            title={t("common.edit")}
                            onClick={() => openEdit(store)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            title={store.isActive ? t("settings.stores.deactivate") : t("settings.stores.activate")}
                            disabled={store.isActive && !canDeactivate}
                            onClick={() => activeMutation.mutate({ id: store.id, isActive: !store.isActive })}
                          >
                            <Power className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            title={t("common.delete")}
                            onClick={() => setDeleteTarget(store)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? t("settings.stores.editStore") : t("settings.stores.addStore")}</DialogTitle>
            <DialogDescription>{t("settings.stores.description")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextField
                label={t("settings.stores.name")}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
              <TextField
                label={t("settings.stores.code")}
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                required
              />
              <TextField
                label={t("settings.stores.manager")}
                value={form.manager}
                onChange={(e) => setForm({ ...form, manager: e.target.value })}
              />
              <TextField
                label={t("settings.stores.phone")}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <TextareaField
              label={t("settings.stores.address")}
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <TextField
                label={t("settings.stores.city")}
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
              <TextField
                label={t("settings.stores.state")}
                value={form.stateProvince}
                onChange={(e) => setForm({ ...form, stateProvince: e.target.value })}
              />
              <TextField
                label={t("settings.stores.country")}
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
              />
            </div>
            {!editing && (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                />
                {t("common.active")}
              </label>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !form.name.trim() || !form.code.trim()}
            >
              {saveMutation.isPending ? t("common.processing") : t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("common.confirmDelete")}</AlertDialogTitle>
            <AlertDialogDescription>
              {hasDependencies
                ? t("settings.stores.hasDependencies", { summary: describeDependencies(dependencies) })
                : t("settings.stores.deleteConfirm", { name: deleteTarget?.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              // A store with business data is deactivated, never deleted, so the
              // destructive action is simply not offered.
              disabled={hasDependencies || deleteMutation.isPending}
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              {deleteMutation.isPending ? t("common.processing") : t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
