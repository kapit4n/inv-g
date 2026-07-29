import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { ArrowLeft, Phone, Mail, MapPin, Plus } from "lucide-react"
import { useAuthStore } from "@/stores"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import toast from "react-hot-toast"
import {
  getCustomerDetail, getCustomerSales, getCreditAccount,
  createCreditAccount, getCreditTransactions, addCreditTransaction,
  getCommunications, createCommunication,
} from "@/lib/tauri"
import type { CustomerDetail, CustomerSale, CreditAccount, CreditTransaction, CommunicationEntry } from "@/types"

export function CustomerDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const customerId = Number(id)

  const [detail, setDetail] = useState<CustomerDetail | null>(null)
  const [sales, setSales] = useState<CustomerSale[]>([])
  const [creditAccount, setCreditAccount] = useState<CreditAccount | null>(null)
  const [transactions, setTransactions] = useState<CreditTransaction[]>([])
  const [communications, setCommunications] = useState<CommunicationEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("info")
  const [creatingCredit, setCreatingCredit] = useState(false)
  const [creditLimit, setCreditLimit] = useState("")

  const [txAmount, setTxAmount] = useState("")
  const [txType, setTxType] = useState("payment")
  const [txNotes, setTxNotes] = useState("")
  const [txSaving, setTxSaving] = useState(false)

  const [commType, setCommType] = useState("note")
  const [commSubject, setCommSubject] = useState("")
  const [commMessage, setCommMessage] = useState("")
  const [commSaving, setCommSaving] = useState(false)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [d, s, acc] = await Promise.all([
        getCustomerDetail(customerId),
        getCustomerSales(customerId),
        getCreditAccount(customerId).catch(() => null),
      ])
      setDetail(d)
      setSales(s)
      setCreditAccount(acc)
      if (acc) {
        const tx = await getCreditTransactions(acc.id)
        setTransactions(tx)
      }
      const comm = await getCommunications(customerId)
      setCommunications(comm)
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

  const handleAddCommunication = async () => {
    if (!commSubject.trim()) {
      toast.error("Subject is required")
      return
    }
    setCommSaving(true)
    try {
      const entry = await createCommunication(
        { customerId, type: commType, subject: commSubject.trim(), message: commMessage || undefined },
        user?.id ?? 0,
      )
      setCommunications((prev) => [...prev, entry])
      setCommSubject("")
      setCommMessage("")
      setCommType("note")
      toast.success("Communication added")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add communication")
    } finally {
      setCommSaving(false)
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
        <Button variant="ghost" size="icon" onClick={() => navigate("/customers")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">{customer.name}</h1>
        <Badge variant={customer.isActive ? "success" : "secondary"}>
          {customer.isActive ? t("customers.active") : t("customers.inactive")}
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-normal">{t("customers.totalSales")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{detail?.totalSales ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-normal">{t("customers.totalSpent")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">${(detail?.totalSpent ?? 0).toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground font-normal">{t("customers.lastPurchase")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{detail?.lastPurchase ? new Date(detail.lastPurchase).toLocaleDateString() : "-"}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="info">{t("customers.customerDetail")}</TabsTrigger>
          <TabsTrigger value="sales">{t("customers.salesHistory")}</TabsTrigger>
          <TabsTrigger value="credit">{t("customers.creditAccount")}</TabsTrigger>
          <TabsTrigger value="communications">{t("customers.communicationLog")}</TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground text-xs">{t("customers.customerName")}</Label>
                  <p className="text-sm font-medium">{customer.name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">{t("customers.email")}</Label>
                  <p className="text-sm flex items-center gap-1">{customer.email ? <><Mail className="h-3 w-3" />{customer.email}</> : "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">{t("customers.phone")}</Label>
                  <p className="text-sm flex items-center gap-1">{customer.phone ? <><Phone className="h-3 w-3" />{customer.phone}</> : "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">{t("customers.address")}</Label>
                  <p className="text-sm flex items-center gap-1">{customer.address ? <><MapPin className="h-3 w-3" />{customer.address}</> : "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">{t("customers.city")}</Label>
                  <p className="text-sm">{customer.city || "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">{t("customers.state")}</Label>
                  <p className="text-sm">{customer.state || "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">{t("customers.postalCode")}</Label>
                  <p className="text-sm">{customer.postalCode || "-"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">{t("customers.country")}</Label>
                  <p className="text-sm">{customer.country || "-"}</p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground text-xs">{t("customers.notes")}</Label>
                <p className="text-sm whitespace-pre-wrap">{customer.notes || "-"}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sales">
          <Card>
            <CardContent className="p-0 overflow-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("customers.saleNumber")}</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">{t("customers.total")}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("customers.paymentMethod")}</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("customers.paymentStatus")}</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Items</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("customers.date")}</th>
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
                  <p className="text-muted-foreground">{t("customers.noCreditAccount")}</p>
                  <div className="flex items-center justify-center gap-2 max-w-xs mx-auto">
                    <Input
                      type="number"
                      placeholder={t("customers.creditLimit")}
                      value={creditLimit}
                      onChange={(e) => setCreditLimit(e.target.value)}
                    />
                    <Button onClick={handleCreateCreditAccount} disabled={creatingCredit}>
                      {creatingCredit ? t("common.loading") : t("customers.createCreditAccount")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-muted-foreground font-normal">{t("customers.creditLimit")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">${creditAccount.creditLimit.toFixed(2)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-muted-foreground font-normal">{t("customers.currentBalance")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">${creditAccount.currentBalance.toFixed(2)}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-muted-foreground font-normal">{t("customers.availableCredit")}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">${(creditAccount.creditLimit - creditAccount.currentBalance).toFixed(2)}</p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">{t("customers.transactions")}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 overflow-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("customers.date")}</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("customers.transactionType")}</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">{t("customers.amount")}</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("customers.reference")}</th>
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
                    <CardTitle className="text-base">{t("customers.addPayment")} / {t("customers.addCharge")}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-4 items-end">
                      <div className="grid gap-2">
                        <Label>{t("customers.transactionType")}</Label>
                        <select
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                          value={txType}
                          onChange={(e) => setTxType(e.target.value)}
                        >
                          <option value="payment">{t("customers.addPayment")}</option>
                          <option value="charge">{t("customers.addCharge")}</option>
                        </select>
                      </div>
                      <div className="grid gap-2">
                        <Label>{t("customers.amount")}</Label>
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={txAmount}
                          onChange={(e) => setTxAmount(e.target.value)}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Notes</Label>
                        <Input
                          placeholder="Optional"
                          value={txNotes}
                          onChange={(e) => setTxNotes(e.target.value)}
                        />
                      </div>
                      <Button onClick={handleAddTransaction} disabled={txSaving}>
                        {txSaving ? t("common.loading") : t("common.save")}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="communications">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("customers.addCommunication")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <Label>{t("customers.communicationType")}</Label>
                      <select
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                        value={commType}
                        onChange={(e) => setCommType(e.target.value)}
                      >
                        <option value="call">{t("customers.call")}</option>
                        <option value="email">{t("customers.email")}</option>
                        <option value="visit">{t("customers.visit")}</option>
                        <option value="note">{t("customers.note")}</option>
                      </select>
                    </div>
                    <div className="grid gap-2">
                      <Label>{t("customers.subject")}</Label>
                      <Input value={commSubject} onChange={(e) => setCommSubject(e.target.value)} />
                    </div>
                    <div className="flex items-end">
                      <Button onClick={handleAddCommunication} disabled={commSaving}>
                        {commSaving ? t("common.loading") : t("common.save")}
                      </Button>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>{t("customers.message")}</Label>
                    <Textarea value={commMessage} onChange={(e) => setCommMessage(e.target.value)} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-0 overflow-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("customers.communicationType")}</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("customers.subject")}</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("customers.message")}</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Created By</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">{t("customers.date")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {communications.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">No communications</td>
                      </tr>
                    ) : (
                      communications.map((c) => (
                        <tr key={c.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3">
                            <Badge variant="outline">{c.type}</Badge>
                          </td>
                          <td className="px-4 py-3 text-sm font-medium">{c.subject}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground max-w-xs truncate">{c.message || "-"}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{c.createdByName || c.createdBy || "-"}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{new Date(c.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
