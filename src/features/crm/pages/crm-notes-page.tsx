import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { StickyNote, Search, Filter } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { getCustomers, getCustomerNotes } from "@/lib/tauri"
import type { CustomerNote } from "@/types"

export function CrmNotesPage() {
  const { t } = useTranslation("crm")
  const [notes, setNotes] = useState<(CustomerNote & { customerName?: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("")
  const [customerFilter, _setCustomerFilter] = useState("")

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const customers = await getCustomers()
        const allNotes: (CustomerNote & { customerName?: string })[] = []
        for (const c of customers.slice(0, 50)) {
          try {
            const n = await getCustomerNotes(c.id)
            for (const note of n) {
              allNotes.push({ ...note, customerName: c.name })
            }
          } catch { }
        }
        allNotes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        setNotes(allNotes)
      } catch { } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const filteredNotes = notes.filter((n) => {
    if (search && !n.title?.toLowerCase().includes(search.toLowerCase()) && !n.content?.toLowerCase().includes(search.toLowerCase())) return false
    if (typeFilter && n.noteType !== typeFilter) return false
    if (customerFilter && n.customerName !== customerFilter && String(n.customerId) !== customerFilter) return false
    return true
  })

  const uniqueTypes = [...new Set(notes.map((n) => n.noteType))]

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("notes")}
        description={t("customerNotesOverview")}
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("searchNotes")}
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">{t("allTypes")}</option>
            {uniqueTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div className="text-sm text-muted-foreground">
          {t("notesCount", { count: filteredNotes.length, total: notes.length })}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : filteredNotes.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            <StickyNote className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
            {t("noResults")}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredNotes.map((n) => (
            <Card key={n.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs capitalize">{n.noteType}</Badge>
                      {n.isPrivate && <Badge variant="secondary" className="text-xs">{t("private")}</Badge>}
                    </div>
                    <p className="font-medium text-sm">{n.title}</p>
                    {n.content && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{n.content}</p>
                    )}
                  </div>
                  <div className="text-right text-xs text-muted-foreground whitespace-nowrap ml-4">
                    <p className="font-medium">{n.customerName || `#${n.customerId}`}</p>
                    <p>{n.createdByName || n.createdBy || "-"}</p>
                    <p>{new Date(n.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
