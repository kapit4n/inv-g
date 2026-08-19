import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Plus, Trash2, Link2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { EntityInfoCard, InfoRow } from "@/components/entity"
import { getProductIdentifiers, createProductIdentifier, deleteProductIdentifier } from "@/lib/tauri"
import type { ProductIdentifier } from "@/types"
import toast from "react-hot-toast"

interface Props {
  productId: number
}

const IDENTIFIER_TYPES = ["oem", "aftermarket", "interchange", "supersession", "cross_ref"] as const

export function ProductIdentifiersTab({ productId }: Props) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const { data: identifiers = [], isLoading } = useQuery({
    queryKey: ["product-identifiers", productId],
    queryFn: () => getProductIdentifiers(productId),
  })

  const [newIdentifier, setNewIdentifier] = useState("")
  const [newType, setNewType] = useState<string>("oem")
  const [newBrandName, setNewBrandName] = useState("")
  const [newNotes, setNewNotes] = useState("")
  const [showAdd, setShowAdd] = useState(false)

  const createMutation = useMutation({
    mutationFn: () => createProductIdentifier(productId, newIdentifier, newType, newBrandName || undefined, newNotes || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-identifiers", productId] })
      setNewIdentifier("")
      setNewType("oem")
      setNewBrandName("")
      setNewNotes("")
      setShowAdd(false)
      toast.success(t("common.saved"))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteProductIdentifier(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-identifiers", productId] })
      toast.success(t("common.deleted"))
    },
  })

  const grouped = IDENTIFIER_TYPES.reduce((acc, type) => {
    const items = identifiers.filter((i) => i.identifierType === type)
    if (items.length > 0) acc[type] = items
    return acc
  }, {} as Record<string, ProductIdentifier[]>)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Link2 className="h-5 w-5" />
          {t("inventory.identifiers")}
        </h3>
        <Button size="sm" onClick={() => setShowAdd(!showAdd)}>
          <Plus className="mr-2 h-4 w-4" />
          {t("common.add")}
        </Button>
      </div>

      {showAdd && (
        <Card>
          <CardContent className="space-y-3 pt-6">
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder={t("inventory.identifier")}
                value={newIdentifier}
                onChange={(e) => setNewIdentifier(e.target.value)}
              />
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              >
                {IDENTIFIER_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {t(`inventory.identifierType.${type}`)}
                  </option>
                ))}
              </select>
              <Input
                placeholder={t("inventory.brandNameOptional")}
                value={newBrandName}
                onChange={(e) => setNewBrandName(e.target.value)}
              />
              <Input
                placeholder={t("inventory.notesOptional")}
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowAdd(false)}>
                {t("common.cancel")}
              </Button>
              <Button
                size="sm"
                onClick={() => createMutation.mutate()}
                disabled={!newIdentifier.trim() || createMutation.isPending}
              >
                {t("common.save")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
      ) : identifiers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Link2 className="h-10 w-10 mb-3 opacity-50" />
            <p className="text-sm">{t("inventory.noIdentifiers")}</p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(grouped).map(([type, items]) => (
          <EntityInfoCard key={type} title={t(`inventory.identifierType.${type}`)} columns={2}>
            {items.map((ident) => (
              <InfoRow
                key={ident.id}
                label={ident.identifier}
                value={
                  <div className="flex items-center gap-2">
                    {ident.brandName && <Badge variant="outline">{ident.brandName}</Badge>}
                    {ident.notes && <span className="text-xs text-muted-foreground">{ident.notes}</span>}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-destructive"
                      onClick={() => deleteMutation.mutate(ident.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                }
              />
            ))}
          </EntityInfoCard>
        ))
      )}
    </div>
  )
}
