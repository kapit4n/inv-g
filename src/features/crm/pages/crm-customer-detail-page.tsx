import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { ArrowLeft, Phone, Mail, MapPin, Car, Plus, Trash2 } from "lucide-react"
import { useAuthStore } from "@/stores"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import toast from "react-hot-toast"
import {
  getCustomerDetail, getCustomerSales, getCreditAccount,
  createCreditAccount, getCreditTransactions, addCreditTransaction,
  getCommunications,
  getCustomerVehicles, getVehicleBrands, getVehicleModels,
  createCustomerVehicle, deleteCustomerVehicle,
  getCustomerNotes, createCustomerNote,
  getCustomerTimeline,
} from "@/lib/tauri"
import type {
  CustomerDetail, CustomerSale, CreditAccount, CreditTransaction,
  CommunicationEntry, CustomerVehicle, VehicleBrand, VehicleModel,
  CustomerNote, TimelineEntry,
} from "@/types"

export function CrmCustomerDetailPage() {
  const { t } = useTranslation("crm")
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const customerId = Number(id)

  const [detail, setDetail] = useState<CustomerDetail | null>(null)
  const [sales, setSales] = useState<CustomerSale[]>([])
  const [vehicles, setVehicles] = useState<CustomerVehicle[]>([])
  const [notes, setNotes] = useState<CustomerNote[]>([])
  const [timeline, setTimeline] = useState<TimelineEntry[]>([])
  const [creditAccount, setCreditAccount] = useState<CreditAccount | null>(null)
  const [transactions, setTransactions] = useState<CreditTransaction[]>([])
  const [_communications, setCommunications] = useState<CommunicationEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  const [creatingCredit, setCreatingCredit] = useState(false)
  const [creditLimit, setCreditLimit] = useState("")
  const [txAmount, setTxAmount] = useState("")
  const [txType, setTxType] = useState("payment")
  const [txNotes, setTxNotes] = useState("")
  const [txSaving, setTxSaving] = useState(false)

  const [vehicleDialog, setVehicleDialog] = useState(false)
  const [vFormPlate, setVFormPlate] = useState("")
  const [vFormNickname, setVFormNickname] = useState("")
  const [vFormBrandId, setVFormBrandId] = useState("")
  const [vFormModelId, setVFormModelId] = useState("")
  const [vFormYear, setVFormYear] = useState("")
  const [vFormVin, setVFormVin] = useState("")
  const [vFormColor, setVFormColor] = useState("")
  const [vFormMileage, setVFormMileage] = useState("")
  const [vSaving, setVSaving] = useState(false)
  const [brands, setBrands] = useState<VehicleBrand[]>([])
  const [models, setModels] = useState<VehicleModel[]>([])

  const [noteDialog, setNoteDialog] = useState(false)
  const [nFormType, setNFormType] = useState("general")
  const [nFormTitle, setNFormTitle] = useState("")
  const [nFormContent, setNFormContent] = useState("")
  const [nFormPrivate, setNFormPrivate] = useState(false)
  const [nSaving, setNSaving] = useState(false)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [d, s, v, n, tl, acc, comm] = await Promise.all([
        getCustomerDetail(customerId),
        getCustomerSales(customerId),
        getCustomerVehicles(customerId),
        getCustomerNotes(customerId),
        getCustomerTimeline(customerId),
        getCreditAccount(customerId).catch(() => null),
        getCommunications(customerId),
      ])
      setDetail(d)
      setSales(s)
      setVehicles(v)
      setNotes(n)
      setTimeline(tl)
      setCommunications(comm)
      setCreditAccount(acc)
      if (acc) {
        const tx = await getCreditTransactions(acc.id)
        setTransactions(tx)
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load customer detail")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (customerId) fetchAll()
  }, [customerId])

  const handleCreateCreditAccount = async () => {
    const limit = parseFloat(creditLimit)
    if (isNaN(limit) || limit <= 0) {
      toast.error("Invalid credit limit")
      return
    }
    setCreatingCredit(true)
    try {
      const acc = await createCreditAccount(customerId, limit)
      setCreditAccount(acc)
      toast.success("Credit account created")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create credit account")
    } finally {
      setCreatingCredit(false)
    }
  }

  const handleAddTransaction = async () => {
    if (!creditAccount) return
    const amount = parseFloat(txAmount)
    if (isNaN(amount) || amount <= 0) {
      toast.error("Invalid amount")
      return
    }
    setTxSaving(true)
    try {
      const tx = await addCreditTransaction(
        creditAccount.id, txType === "charge" ? -amount : amount,
        txType, undefined, undefined, txNotes || undefined, user?.id ?? 0,
      )
      setTransactions((prev) => [...prev, tx])
      const updated = await getCreditAccount(customerId)
      setCreditAccount(updated)
      setTxAmount("")
      setTxNotes("")
      toast.success("Transaction added")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add transaction")
    } finally {
      setTxSaving(false)
    }
  }

  const openVehicleDialog = async () => {
    try {
      const b = await getVehicleBrands()
      setBrands(b)
    } catch { }
    setVehicleDialog(true)
  }

  const handleBrandChange = async (brandId: string) => {
    setVFormBrandId(brandId)
    setVFormModelId("")
    if (brandId) {
      try {
        const m = await getVehicleModels(Number(brandId))
        setModels(m)
      } catch { }
    } else {
      setModels([])
    }
  }

  const handleAddVehicle = async () => {
    setVSaving(true)
    try {
      await createCustomerVehicle({
        customerId,
        licensePlate: vFormPlate || undefined,
        nickname: vFormNickname || undefined,
        brandId: vFormBrandId ? Number(vFormBrandId) : undefined,
        modelId: vFormModelId ? Number(vFormModelId) : undefined,
        year: vFormYear ? Number(vFormYear) : undefined,
        vin: vFormVin || undefined,
        color: vFormColor || undefined,
        mileage: vFormMileage ? Number(vFormMileage) : 0,
        userId: user?.id ?? 0,
      })
      toast.success("Vehicle added")
      setVehicleDialog(false)
      setVFormPlate("")
      setVFormNickname("")
      setVFormBrandId("")
      setVFormModelId("")
      setVFormYear("")
      setVFormVin("")
      setVFormColor("")
      setVFormMileage("")
      const v = await getCustomerVehicles(customerId)
      setVehicles(v)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add vehicle")
    } finally {
      setVSaving(false)
    }
  }

  const handleDeleteVehicle = async (vehicleId: number) => {
    try {
      await deleteCustomerVehicle(vehicleId)
      toast.success("Vehicle deleted")
      const v = await getCustomerVehicles(customerId)
      setVehicles(v)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete vehicle")
    }
  }

  const handleAddNote = async () => {
    if (!nFormTitle.trim()) {
      toast.error("Title is required")
      return
    }
    setNSaving(true)
    try {
      await createCustomerNote(customerId, nFormType, nFormPrivate, user?.id ?? 0, nFormTitle.trim(), nFormContent || undefined)
      toast.success("Note added")
      setNoteDialog(false)
      setNFormType("general")
      setNFormTitle("")
      setNFormContent("")
      setNFormPrivate(false)
      const n = await getCustomerNotes(customerId)
      setNotes(n)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add note")
    } finally {
      setNSaving(false)
    }
  }

  const customer = detail?.customer

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-9 rounded-md" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    )
  }

  if (!customer) {
    return <div className="text-center py-12 text-muted-foreground">Customer not found</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/crm/customers")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">{customer.name}</h1>
        <Badge variant={customer.isActive ? "success" : "secondary"}>
          {customer.isActive ? "Active" : "Inactive"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-normal">Total Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{detail?.totalSales ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-normal">Total Spent</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${(detail?.totalSpent ?? 0).toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-normal">Last Purchase</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{detail?.lastPurchase ? new Date(detail.lastPurchase).toLocaleDateString() : "-"}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="vehicles">Vehicles ({vehicles.length})</TabsTrigger>
          <TabsTrigger value="sales">Purchase History</TabsTrigger>
          <TabsTrigger value="credit">Credit</TabsTrigger>
          <TabsTrigger value="notes">Notes ({notes.length})</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-xs">Name</Label>
                  <p className="text-sm font-medium">{customer.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Email</Label>
                  <p className="text-sm flex items-center gap-1">{customer.email ? <><Mail className="h-3 w-3" />{customer.email}</> : "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Phone</Label>
                  <p className="text-sm flex items-center gap-1">{customer.phone ? <><Phone className="h-3 w-3" />{customer.phone}</> : "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Address</Label>
                  <p className="text-sm flex items-center gap-1">{customer.address ? <><MapPin className="h-3 w-3" />{customer.address}</> : "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">City</Label>
                  <p className="text-sm">{customer.city || "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">State</Label>
                  <p className="text-sm">{customer.state || "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Postal Code</Label>
                  <p className="text-sm">{customer.postalCode || "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Country</Label>
                  <p className="text-sm">{customer.country || "-"}</p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">Notes</Label>
                <p className="text-sm whitespace-pre-wrap">{customer.notes || "-"}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vehicles">
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button size="sm" onClick={openVehicleDialog}>
                <Plus className="h-4 w-4 mr-1" /> {t("addVehicle")}
              </Button>
            </div>
            {vehicles.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-sm text-muted-foreground">
                  No vehicles registered
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {vehicles.map((v) => (
                  <Card key={v.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Car className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{v.brandName} {v.modelName}</span>
                          </div>
                          {v.licensePlate && <p className="text-xs text-muted-foreground">Plate: {v.licensePlate}</p>}
                          {v.nickname && <p className="text-xs text-muted-foreground">Nickname: {v.nickname}</p>}
                          {v.vin && <p className="text-xs text-muted-foreground">VIN: {v.vin}</p>}
                          {v.year && <p className="text-xs text-muted-foreground">Year: {v.year}</p>}
                          <p className="text-xs text-muted-foreground">Mileage: {v.mileage.toLocaleString()} km</p>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteVehicle(v.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <Dialog open={vehicleDialog} onOpenChange={setVehicleDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t("addVehicle")}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>License Plate</Label>
                      <Input value={vFormPlate} onChange={(e) => setVFormPlate(e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                      <Label>Nickname</Label>
                      <Input value={vFormNickname} onChange={(e) => setVFormNickname(e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Brand</Label>
                      <select
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                        value={vFormBrandId}
                        onChange={(e) => handleBrandChange(e.target.value)}
                      >
                        <option value="">{t("selectBrand")}</option>
                        {brands.map((b) => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Model</Label>
                      <select
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                        value={vFormModelId}
                        onChange={(e) => setVFormModelId(e.target.value)}
                      >
                        <option value="">{t("selectModel")}</option>
                        {models.map((m) => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Year</Label>
                      <Input type="number" value={vFormYear} onChange={(e) => setVFormYear(e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                      <Label>Color</Label>
                      <Input value={vFormColor} onChange={(e) => setVFormColor(e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>VIN</Label>
                      <Input value={vFormVin} onChange={(e) => setVFormVin(e.target.value)} />
                    </div>
                    <div className="grid gap-2">
                      <Label>Mileage</Label>
                      <Input type="number" value={vFormMileage} onChange={(e) => setVFormMileage(e.target.value)} />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setVehicleDialog(false)}>{t("cancel")}</Button>
                  <Button onClick={handleAddVehicle} disabled={vSaving}>{vSaving ? "Saving..." : t("save")}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </TabsContent>

        <TabsContent value="sales">
          <Card>
            <CardContent className="p-0 overflow-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Sale #</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Total</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Payment Method</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("status")}</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Items</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">No sales found</td>
                    </tr>
                  ) : (
                    sales.map((s) => (
                      <tr
                        key={s.id}
                        className="border-b last:border-0 hover:bg-muted/30 transition-colors cursor-pointer"
                        onClick={() => navigate(`/sales/${s.id}`)}
                      >
                        <td className="px-4 py-3 text-sm font-medium text-primary">{s.saleNumber}</td>
                        <td className="px-4 py-3 text-sm text-right font-medium">${s.total.toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{s.paymentMethod}</td>
                        <td className="px-4 py-3">
                          <Badge variant={s.paymentStatus === "paid" ? "success" : s.paymentStatus === "pending" ? "warning" : "secondary"}>
                            {s.paymentStatus}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-center">{s.itemCount ?? "-"}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{new Date(s.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="credit">
          <div className="space-y-4">
            {!creditAccount ? (
              <Card>
                <CardContent className="p-6 text-center space-y-4">
                  <p className="text-muted-foreground">No credit account</p>
                  <div className="flex items-center justify-center gap-2 max-w-xs mx-auto">
                    <Input
                      type="number"
                      placeholder="Credit limit"
                      value={creditLimit}
                      onChange={(e) => setCreditLimit(e.target.value)}
                    />
                    <Button onClick={handleCreateCreditAccount} disabled={creatingCredit}>
                      {creatingCredit ? "Creating..." : "Create Account"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-muted-foreground font-normal">{t("creditLimit")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">${creditAccount.creditLimit.toFixed(2)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-muted-foreground font-normal">{t("currentBalance")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">${creditAccount.currentBalance.toFixed(2)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-muted-foreground font-normal">{t("availableCredit")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">${(creditAccount.creditLimit - creditAccount.currentBalance).toFixed(2)}</p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">{t("transactions")}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 overflow-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Type</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Amount</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Reference</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">No transactions</td>
                          </tr>
                        ) : (
                          transactions.map((tx) => (
                            <tr key={tx.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                              <td className="px-4 py-3 text-sm text-muted-foreground">{new Date(tx.createdAt).toLocaleDateString()}</td>
                              <td className="px-4 py-3 text-sm">
                                <Badge variant={tx.transactionType === "payment" ? "success" : "warning"}>
                                  {tx.transactionType}
                                </Badge>
                              </td>
                              <td className={`px-4 py-3 text-sm text-right font-medium ${tx.amount < 0 ? "text-destructive" : "text-green-600"}`}>
                                {tx.amount < 0 ? `-$${Math.abs(tx.amount).toFixed(2)}` : `$${tx.amount.toFixed(2)}`}
                              </td>
                              <td className="px-4 py-3 text-sm text-muted-foreground">{tx.referenceType ? `${tx.referenceType} #${tx.referenceId}` : "-"}</td>
                              <td className="px-4 py-3 text-sm text-muted-foreground">{tx.notes || "-"}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Add Payment / Charge</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-4 items-end">
                      <div className="grid gap-2">
                        <Label>Type</Label>
                        <select
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                          value={txType}
                          onChange={(e) => setTxType(e.target.value)}
                        >
                          <option value="payment">Payment</option>
                          <option value="charge">Charge</option>
                        </select>
                      </div>
                      <div className="grid gap-2">
                        <Label>Amount</Label>
                        <Input type="number" placeholder="0.00" value={txAmount} onChange={(e) => setTxAmount(e.target.value)} />
                      </div>
                      <div className="grid gap-2">
                        <Label>Notes</Label>
                        <Input placeholder="Optional" value={txNotes} onChange={(e) => setTxNotes(e.target.value)} />
                      </div>
                      <Button onClick={handleAddTransaction} disabled={txSaving}>
                        {txSaving ? "Loading..." : "Save"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="notes">
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button size="sm" onClick={() => setNoteDialog(true)}>
                <Plus className="h-4 w-4 mr-1" /> {t("addNote")}
              </Button>
            </div>
            {notes.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-sm text-muted-foreground">No notes</CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {notes.map((n) => (
                  <Card key={n.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">{n.noteType}</Badge>
                            {n.isPrivate && <Badge variant="secondary" className="text-xs">Private</Badge>}
                          </div>
                          <p className="font-medium text-sm">{n.title}</p>
                          {n.content && <p className="text-sm text-muted-foreground">{n.content}</p>}
                          <p className="text-xs text-muted-foreground">{n.createdByName} &mdash; {new Date(n.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <Dialog open={noteDialog} onOpenChange={setNoteDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t("addNote")}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Type</Label>
                    <select
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                      value={nFormType}
                      onChange={(e) => setNFormType(e.target.value)}
                    >
                      <option value="general">General</option>
                      <option value="call">Call</option>
                      <option value="visit">Visit</option>
                      <option value="complaint">Complaint</option>
                      <option value="follow_up">Follow Up</option>
                    </select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Title *</Label>
                    <Input value={nFormTitle} onChange={(e) => setNFormTitle(e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Content</Label>
                    <Textarea value={nFormContent} onChange={(e) => setNFormContent(e.target.value)} />
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={nFormPrivate} onChange={(e) => setNFormPrivate(e.target.checked)} />
                    Private note (only visible to staff)
                  </label>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setNoteDialog(false)}>{t("cancel")}</Button>
                  <Button onClick={handleAddNote} disabled={nSaving}>{nSaving ? "Saving..." : t("save")}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </TabsContent>

        <TabsContent value="timeline">
          <Card>
            <CardContent className="p-0">
              {timeline.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">No activity recorded</div>
              ) : (
                <div className="divide-y">
                  {timeline.map((entry) => (
                    <div key={entry.id} className="p-4 flex items-start gap-3">
                      <div className="mt-0.5">
                        <Badge variant="outline" className="text-xs capitalize">{entry.eventType}</Badge>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{entry.title}</p>
                        {entry.description && <p className="text-xs text-muted-foreground">{entry.description}</p>}
                      </div>
                      <div className="text-xs text-muted-foreground whitespace-nowrap">
                        {entry.createdByName} &mdash; {new Date(entry.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
