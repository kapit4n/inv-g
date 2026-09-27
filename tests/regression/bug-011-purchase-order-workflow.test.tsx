import { describe, it, expect, beforeEach, vi } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { render, screen, fireEvent, waitFor } from "@tests/helpers/render"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { setupI18n, i18n } from "@/i18n"
import { NotificationCenter } from "@/components/notification-center"
import { PurchaseReceiptFormPage } from "@/features/purchases/pages/purchase-receipt-form-page"
import { PurchaseOrderDetailPage } from "@/features/purchases/pages/purchase-order-detail-page"
import {
  PURCHASE_ORDER_STATUSES,
  purchaseOrderStatusLabel,
  purchaseOrderStatusVariant,
} from "@/features/purchases/purchase-order-status"
import { useAuthStore } from "@/stores"
import {
  getPurchaseOrder,
  getPurchaseOrderItems,
  getWarehouses,
  receivePurchaseOrder,
  updatePurchaseOrderStatus,
  deletePurchaseOrder,
} from "@/lib/tauri"
import type { PurchaseOrder, PurchaseOrderItem, PurchaseReceipt } from "@/types"
import type { Warehouse } from "@/types/inventory"

vi.mock("@/lib/tauri", () => ({
  getPurchaseOrder: vi.fn(),
  getPurchaseOrderItems: vi.fn(),
  getWarehouses: vi.fn(),
  receivePurchaseOrder: vi.fn(),
  updatePurchaseOrderStatus: vi.fn(),
  deletePurchaseOrder: vi.fn(),
}))

setupI18n("en")

/**
 * BUG-011: the purchase order workflow could not be finished.
 *
 * Three defects in a row, on the path from an approved order to a closed one:
 *
 * 1. `update_purchase_order_status` had no `approved -> sent` arm, so the
 *    "Send to Supplier" button the detail page offers on an approved order was
 *    refused with "Invalid status transition from 'approved' to 'sent'" and the
 *    order never moved. Covered on the Rust side by
 *    `an_approved_order_can_be_sent_to_the_supplier`; the page-side wiring is
 *    asserted below.
 * 2. The "Receive Order" button navigated to `/purchases/receipts/new`, which
 *    was not a route, so the catch-all sent the user to the dashboard and no
 *    receipt could ever be recorded. `receive_purchase_order` only accepts a
 *    `sent` or `partially_received` order, so nothing could close the order.
 * 3. The pages labelled statuses from two hand-written English maps that called
 *    the terminal state `received`, while the backend writes `completed`. A
 *    finished order therefore showed the raw string "completed" in an
 *    otherwise translated UI, and the status filter offered a value that never
 *    occurred instead of the one that does.
 */

const warehouses: Warehouse[] = [
  { id: 7, name: "Main", code: "MAIN", address: null, city: null, state: null, country: null, manager: null, isActive: true, createdAt: "", updatedAt: "" },
]

function order(overrides: Partial<PurchaseOrder> = {}): PurchaseOrder {
  return {
    id: 1,
    poNumber: "PO-0001",
    supplierId: 3,
    supplierName: "Bosch",
    warehouseId: 7,
    warehouseName: "Main",
    orderDate: "2026-09-01",
    currency: "BOB",
    subtotal: 100,
    taxRate: 0,
    taxAmount: 0,
    discountAmount: 0,
    shippingCost: 0,
    total: 100,
    status: "sent",
    itemCount: 2,
    createdAt: "2026-09-01 10:00:00",
    updatedAt: "2026-09-01 10:00:00",
    ...overrides,
  }
}

function poItem(overrides: Partial<PurchaseOrderItem> = {}): PurchaseOrderItem {
  return {
    id: 1,
    purchaseOrderId: 1,
    productId: 11,
    productName: "Brake Pad",
    productSku: "BP-1",
    quantity: 10,
    unitCost: 5,
    discount: 0,
    tax: 0,
    total: 50,
    receivedQuantity: 0,
    damagedQuantity: 0,
    createdAt: "",
    updatedAt: "",
    ...overrides,
  }
}

function renderReceive(poId = 1) {
  return render(
    <MemoryRouter initialEntries={[`/purchases/receipts/new?poId=${poId}`]}>
      <PurchaseReceiptFormPage />
      <NotificationCenter />
    </MemoryRouter>,
    { withRouter: false }
  )
}

beforeEach(() => {
  vi.mocked(getPurchaseOrder).mockReset()
  vi.mocked(getPurchaseOrderItems).mockReset()
  vi.mocked(getWarehouses).mockReset()
  vi.mocked(receivePurchaseOrder).mockReset()
  vi.mocked(updatePurchaseOrderStatus).mockReset()
  vi.mocked(deletePurchaseOrder).mockReset()
  vi.mocked(getWarehouses).mockResolvedValue(warehouses)
  useAuthStore.setState({
    user: {
      id: 5,
      username: "buyer",
      email: "buyer@test.com",
      fullName: "Buyer",
      isActive: true,
      createdAt: "",
    },
  })
})

describe("BUG-011 the receive page the workflow was missing", () => {
  it("is reachable at the URL the order detail page links to", () => {
    const routes = readFileSync(join(process.cwd(), "src", "routes", "index.tsx"), "utf8")
    // The detail page's "Receive Order" button targets this path. Before the
    // fix no route matched it and the catch-all sent the user to /dashboard.
    expect(routes).toMatch(/path:\s*"purchases\/receipts\/new"/)
    expect(
      readFileSync(join(process.cwd(), "src", "features", "purchases", "pages", "purchase-order-detail-page.tsx"), "utf8")
    ).toContain("/purchases/receipts/new?poId=")
  })

  it("pre-fills each line with what is still outstanding", async () => {
    vi.mocked(getPurchaseOrder).mockResolvedValue(order())
    vi.mocked(getPurchaseOrderItems).mockResolvedValue([
      poItem({ id: 1, quantity: 10, receivedQuantity: 4, damagedQuantity: 1 }),
      poItem({ id: 2, productId: 12, productName: "Rotor", quantity: 5, receivedQuantity: 0, damagedQuantity: 0 }),
    ])

    renderReceive()

    // 10 - 4 received - 1 damaged = 5 outstanding on the first line.
    const received = await screen.findAllByLabelText("Received")
    expect(received).toHaveLength(2)
    expect(received[0]).toHaveValue(5)
    expect(received[1]).toHaveValue(5)
  })

  it("submits the order id, the signed-in user, the warehouse and every line", async () => {
    vi.mocked(getPurchaseOrder).mockResolvedValue(order())
    vi.mocked(getPurchaseOrderItems).mockResolvedValue([
      poItem({ id: 1, productId: 11, quantity: 10, receivedQuantity: 0, damagedQuantity: 0 }),
      poItem({ id: 2, productId: 12, quantity: 4, receivedQuantity: 0, damagedQuantity: 0 }),
    ])
    const receipt = { id: 99 } as PurchaseReceipt
    vi.mocked(receivePurchaseOrder).mockResolvedValue(receipt)

    renderReceive()
    await screen.findAllByLabelText("Received")

    fireEvent.click(screen.getByRole("button", { name: /mark received/i }))

    await waitFor(() => expect(receivePurchaseOrder).toHaveBeenCalledTimes(1))
    expect(vi.mocked(receivePurchaseOrder).mock.calls[0]).toEqual([
      1,
      5,
      7,
      undefined,
      [
        { poItemId: 1, productId: 11, receivedQuantity: 10, damagedQuantity: 0 },
        { poItemId: 2, productId: 12, receivedQuantity: 4, damagedQuantity: 0 },
      ],
    ])
  })

  it("sends damaged units apart from accepted ones, and keeps them out of stock", async () => {
    vi.mocked(getPurchaseOrder).mockResolvedValue(order())
    vi.mocked(getPurchaseOrderItems).mockResolvedValue([
      poItem({ id: 1, quantity: 10, receivedQuantity: 0, damagedQuantity: 0 }),
    ])
    vi.mocked(receivePurchaseOrder).mockResolvedValue({ id: 99 } as PurchaseReceipt)

    renderReceive()
    await screen.findAllByLabelText("Received")

    fireEvent.change(screen.getByLabelText("Damaged"), { target: { value: "2" } })
    fireEvent.change(screen.getByLabelText("Received"), { target: { value: "8" } })
    fireEvent.click(screen.getByRole("button", { name: /mark received/i }))

    await waitFor(() => expect(receivePurchaseOrder).toHaveBeenCalledTimes(1))
    const payload = vi.mocked(receivePurchaseOrder).mock.calls[0][4]
    expect(payload).toEqual([
      { poItemId: 1, productId: 11, receivedQuantity: 8, damagedQuantity: 2 },
    ])
    // 8 received - 2 damaged is what reaches stock, and the page says so.
    expect(await screen.findByText("6")).toBeInTheDocument()
  })

  it("refuses a line that claims more than was ordered", async () => {
    vi.mocked(getPurchaseOrder).mockResolvedValue(order())
    vi.mocked(getPurchaseOrderItems).mockResolvedValue([
      poItem({ id: 1, quantity: 10, receivedQuantity: 0, damagedQuantity: 0 }),
    ])

    renderReceive()
    await screen.findAllByLabelText("Received")

    fireEvent.change(screen.getByLabelText("Received"), { target: { value: "11" } })

    const button = screen.getByRole("button", { name: /mark received/i })
    expect(button).toBeDisabled()
    expect(await screen.findByText(/exceeds what is outstanding \(10\)/i)).toBeInTheDocument()
    expect(receivePurchaseOrder).not.toHaveBeenCalled()
  })

  it("counts a partially received order against what is left, not the original quantity", async () => {
    vi.mocked(getPurchaseOrder).mockResolvedValue(order({ status: "partially_received" }))
    vi.mocked(getPurchaseOrderItems).mockResolvedValue([
      poItem({ id: 1, quantity: 10, receivedQuantity: 7, damagedQuantity: 0 }),
    ])

    renderReceive()
    const received = await screen.findAllByLabelText("Received")
    expect(received[0]).toHaveValue(3)
    expect(received[0]).toHaveAttribute("max", "3")
  })

  it("will not submit a receipt with nothing recorded", async () => {
    vi.mocked(getPurchaseOrder).mockResolvedValue(order())
    vi.mocked(getPurchaseOrderItems).mockResolvedValue([
      poItem({ id: 1, quantity: 10, receivedQuantity: 0, damagedQuantity: 0 }),
    ])

    renderReceive()
    await screen.findAllByLabelText("Received")

    fireEvent.change(screen.getByLabelText("Received"), { target: { value: "0" } })
    fireEvent.change(screen.getByLabelText("Damaged"), { target: { value: "0" } })
    fireEvent.click(screen.getByRole("button", { name: /mark received/i }))

    await waitFor(() =>
      expect(screen.getByText(/there is nothing to record/i)).toBeInTheDocument()
    )
    expect(receivePurchaseOrder).not.toHaveBeenCalled()
  })

  it("shows a not-found state instead of an empty form for an unknown order", async () => {
    vi.mocked(getPurchaseOrder).mockResolvedValue(null as unknown as PurchaseOrder)
    vi.mocked(getPurchaseOrderItems).mockResolvedValue([])

    renderReceive(404)

    expect(await screen.findByText(/purchase order not found/i)).toBeInTheDocument()
  })
})

describe("BUG-011 the order detail page can send an approved order", () => {
  it("sends the order to the supplier once it is approved", async () => {
    vi.mocked(getPurchaseOrder).mockResolvedValue(order({ status: "approved", sentAt: undefined }))
    vi.mocked(updatePurchaseOrderStatus).mockResolvedValue(order({ status: "sent" }))

    render(
      <MemoryRouter initialEntries={["/purchases/orders/1"]}>
        <Routes>
          <Route path="/purchases/orders/:id" element={<PurchaseOrderDetailPage />} />
        </Routes>
      </MemoryRouter>,
      { withRouter: false }
    )

    const send = await screen.findByRole("button", { name: /send to supplier/i })
    fireEvent.click(send)

    await waitFor(() =>
      expect(updatePurchaseOrderStatus).toHaveBeenCalledWith(1, "sent", expect.any(Number))
    )
  })

  it("offers receiving, not sending, once the order is with the supplier", async () => {
    vi.mocked(getPurchaseOrder).mockResolvedValue(order({ status: "sent" }))

    render(
      <MemoryRouter initialEntries={["/purchases/orders/1"]}>
        <Routes>
          <Route path="/purchases/orders/:id" element={<PurchaseOrderDetailPage />} />
        </Routes>
      </MemoryRouter>,
      { withRouter: false }
    )

    expect(await screen.findByRole("button", { name: /receive order/i })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /send to supplier/i })).not.toBeInTheDocument()
  })
})

describe("BUG-011 status vocabulary", () => {
  it("uses the statuses the backend actually writes", () => {
    expect([...PURCHASE_ORDER_STATUSES]).toEqual([
      "draft",
      "pending_approval",
      "approved",
      "sent",
      "partially_received",
      "completed",
      "cancelled",
    ])
    // The pages used to label a `received` status that no query ever returns.
    expect(PURCHASE_ORDER_STATUSES as readonly string[]).not.toContain("received")
  })

  it("translates every status, including the terminal one", () => {
    const t = i18n.getFixedT(null, "purchases")
    for (const status of PURCHASE_ORDER_STATUSES) {
      const label = purchaseOrderStatusLabel(t, status)
      expect(label, `${status} must have a label`).toBeTruthy()
      expect(label, `${status} must be translated, not a raw key`).not.toBe(status)
      expect(label).not.toMatch(/^[a-z_]+$/)
    }
    expect(purchaseOrderStatusLabel(t, "completed")).toBe("Completed")
    expect(purchaseOrderStatusLabel(t, "partially_received")).toBe("Partially Received")
    expect(purchaseOrderStatusVariant("completed")).toBe("success")
  })

  it("falls back to the raw value for a status it does not know", () => {
    const t = i18n.getFixedT(null, "purchases")
    expect(purchaseOrderStatusLabel(t, "awaiting_approval")).toBe("awaiting_approval")
    expect(purchaseOrderStatusVariant("awaiting_approval")).toBe("outline")
  })

  it("no longer keeps a hand-written English status map in the purchase pages", () => {
    for (const page of ["purchase-orders-page.tsx", "purchase-order-detail-page.tsx"]) {
      const source = readFileSync(
        join(process.cwd(), "src", "features", "purchases", "pages", page),
        "utf8"
      )
      expect(source, `${page} must not hardcode status labels`).not.toMatch(
        /pending_approval:\s*"/,
      )
      expect(source, `${page} must not hardcode status labels`).not.toMatch(
        /partially_received:\s*"/,
      )
    }
  })
})

describe("BUG-011 the warehouse is the receiving destination", () => {
  it("pre-selects the order's own warehouse", async () => {
    vi.mocked(getPurchaseOrder).mockResolvedValue(order({ warehouseId: 7 }))
    vi.mocked(getPurchaseOrderItems).mockResolvedValue([poItem()])

    renderReceive()
    await screen.findAllByLabelText("Received")

    // Radix renders the chosen option's label in the trigger, not its value.
    // `FormFieldWrapper` renders a <Label> with no htmlFor, so the trigger has no
    // accessible name to query by.
    expect(screen.getByRole("combobox")).toHaveTextContent("Main")
  })
})
