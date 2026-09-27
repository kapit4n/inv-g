import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, fireEvent, waitFor } from "@tests/helpers/render"
import { setupI18n } from "@/i18n"
import { PurchaseReturnsPage } from "@/features/purchases/pages/purchase-returns-page"
import { NotificationCenter } from "@/components/notification-center"
import { useNotificationStore } from "@/stores"
import {
  getPurchaseReturns,
  getPurchaseOrders,
  getPurchaseOrderItems,
  createPurchaseReturn,
} from "@/lib/tauri"
import type { PurchaseOrder, PurchaseOrderItem } from "@/types"

// Selecting a purchase order used to leave the return form empty and the
// "Create return" button permanently disabled.
//
// handleSelectPo seeded the line items from `poItems`, the react-query result of
// getPurchaseOrderItems(selectedPoId). At the moment the order was picked,
// selectedPoId was still null, the query was disabled and poItems was []. The
// seed therefore produced an empty list, and nothing re-derived it when the
// query later resolved. Both reported symptoms came from that one line:
//   - no products listed, because returnItems was []
//   - button disabled, because [].every(qty === 0) is true
//
// The rows are now derived from the query result, so they appear whenever the
// items arrive.

const order: PurchaseOrder = {
  id: 7,
  poNumber: "PO-000007",
  supplierId: 3,
  supplierName: "Ace Parts",
  status: "completed",
  orderDate: "2026-09-20",
  expectedDate: undefined,
  receivedDate: undefined,
  subtotal: 250,
  taxAmount: 0,
  total: 250,
  notes: undefined,
  createdBy: 1,
  createdByName: "Admin",
  createdAt: "2026-09-20 04:00:00",
  updatedAt: "2026-09-20 04:00:00",
  itemCount: 2,
} as PurchaseOrder

const items: PurchaseOrderItem[] = [
  {
    id: 1,
    purchaseOrderId: 7,
    productId: 11,
    productName: "Brake Pads",
    productSku: "BRK-100",
    quantity: 4,
    receivedQuantity: 4,
    damagedQuantity: 0,
    unitCost: 25,
    lineTotal: 100,
  },
  {
    id: 2,
    purchaseOrderId: 7,
    productId: 12,
    productName: "Oil Filter",
    productSku: "FLT-200",
    quantity: 10,
    receivedQuantity: 10,
    damagedQuantity: 0,
    unitCost: 15,
    lineTotal: 150,
  },
] as PurchaseOrderItem[]

vi.mock("@/lib/tauri", () => ({
  getPurchaseReturns: vi.fn(),
  getPurchaseOrders: vi.fn(),
  getPurchaseOrderItems: vi.fn(),
  createPurchaseReturn: vi.fn(),
}))

setupI18n("en")

/** Opens the dialog and picks the purchase order. */
async function selectOrder() {
  render(
    <>
      <PurchaseReturnsPage />
      <NotificationCenter />
    </>,
  )

  fireEvent.click(await screen.findByRole("button", { name: /new return/i }))
  fireEvent.click(await screen.findByText("PO-000007"))
}

function createButton() {
  return screen.getByRole("button", { name: /create return/i })
}

describe("new purchase return form", () => {
  beforeEach(() => {
    useNotificationStore.setState({ notifications: [], unreadCount: 0 })
    for (const fn of [getPurchaseReturns, getPurchaseOrders, getPurchaseOrderItems, createPurchaseReturn]) {
      vi.mocked(fn).mockReset()
    }
    vi.mocked(getPurchaseReturns).mockResolvedValue([])
    vi.mocked(getPurchaseOrders).mockResolvedValue([order])
    vi.mocked(getPurchaseOrderItems).mockResolvedValue(items)
    vi.mocked(createPurchaseReturn).mockResolvedValue({ id: 1 } as never)
  })

  it("lists the order's products once they load", async () => {
    await selectOrder()

    // The regression: these rows never rendered.
    expect(await screen.findByText("Brake Pads")).toBeTruthy()
    expect(screen.getByText("Oil Filter")).toBeTruthy()
    // One quantity input per line, plus none for the header.
    expect(screen.getAllByRole("spinbutton")).toHaveLength(2)
  })

  it("enables 'Create return' once a reason and a quantity are given", async () => {
    await selectOrder()
    await screen.findByText("Brake Pads")

    // Nothing entered yet.
    expect(createButton().hasAttribute("disabled")).toBe(true)

    const reason = screen.getByPlaceholderText(/damaged/i)
    fireEvent.change(reason, { target: { value: "Wrong size" } })

    // A reason alone is not enough — the button also needs a quantity.
    expect(createButton().hasAttribute("disabled")).toBe(true)

    fireEvent.change(screen.getAllByRole("spinbutton")[0], { target: { value: "2" } })
    await waitFor(() => expect(createButton().hasAttribute("disabled")).toBe(false))
  })

  it("sends the products that were listed, with their quantities", async () => {
    await selectOrder()
    await screen.findByText("Brake Pads")

    fireEvent.change(screen.getByPlaceholderText(/damaged/i), { target: { value: "Defective" } })
    fireEvent.change(screen.getAllByRole("spinbutton")[0], { target: { value: "2" } })
    fireEvent.change(screen.getAllByRole("spinbutton")[1], { target: { value: "5" } })

    await waitFor(() => expect(createButton().hasAttribute("disabled")).toBe(false))
    fireEvent.click(createButton())

    await waitFor(() => expect(createPurchaseReturn).toHaveBeenCalled())
    const [, input] = vi.mocked(createPurchaseReturn).mock.calls[0]
    expect(input.poId).toBe(7)
    expect(input.supplierId).toBe(3)
    expect(input.reason).toBe("Defective")
    expect(input.items).toEqual([
      { productId: 11, quantity: 2, unitCost: 25, reason: undefined },
      { productId: 12, quantity: 5, unitCost: 15, reason: undefined },
    ])
  })

  it("explains an empty order instead of showing a blank table", async () => {
    vi.mocked(getPurchaseOrderItems).mockResolvedValue([])

    await selectOrder()

    expect(await screen.findByText(/no items to return/i)).toBeTruthy()
    // An order with no lines cannot produce a return.
    expect(createButton().hasAttribute("disabled")).toBe(true)
  })

  it("keeps the button disabled when only some lines are filled in", async () => {
    await selectOrder()
    await screen.findByText("Brake Pads")

    fireEvent.change(screen.getByPlaceholderText(/damaged/i), { target: { value: "Broken" } })
    // Zeroing a line back to 0 keeps it out of the payload.
    fireEvent.change(screen.getAllByRole("spinbutton")[0], { target: { value: "3" } })
    await waitFor(() => expect(createButton().hasAttribute("disabled")).toBe(false))

    fireEvent.change(screen.getAllByRole("spinbutton")[0], { target: { value: "0" } })
    await waitFor(() => expect(createButton().hasAttribute("disabled")).toBe(true))
  })
})
