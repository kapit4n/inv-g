import type { TFunction } from "i18next"

/**
 * The purchase order lifecycle, as the database and the Rust command agree on
 * it. The order detail page, the orders list and the receive page all read
 * their labels, badges and filters from here, so a status cannot be named one
 * thing in a badge and another in a filter.
 *
 * The workflow is:
 *
 * ```text
 * draft ──submit──▶ pending_approval ──approve──▶ approved ──send──▶ sent
 *   │                     │  │                        │                │
 *   │                     │  └──reject──▶ draft        │                ├─receive all──▶ completed
 *   │                     └──cancel──▶ cancelled      └──cancel──▶ cancelled   └─receive some──▶ partially_received
 *   └──cancel──▶ cancelled                                                              │              │
 *                                                                              receive all ──┘
 * ```
 *
 * `receive_purchase_order` decides between `partially_received` and `completed`
 * by itself, based on whether every line is accounted for, so those two are not
 * statuses the user picks.
 */
export const PURCHASE_ORDER_STATUSES = [
  "draft",
  "pending_approval",
  "approved",
  "sent",
  "partially_received",
  "completed",
  "cancelled",
] as const

export type PurchaseOrderStatus = (typeof PURCHASE_ORDER_STATUSES)[number]

type BadgeVariant =
  | "default"
  | "secondary"
  | "destructive"
  | "outline"
  | "success"
  | "warning"
  | "info"

/** The translation key of each status, in the `purchases` namespace. */
const statusLabelKeys: Record<PurchaseOrderStatus, string> = {
  draft: "draft",
  pending_approval: "pendingApproval",
  approved: "approved",
  sent: "sent",
  partially_received: "partiallyReceived",
  completed: "completed",
  cancelled: "cancelled",
}

const statusVariants: Record<PurchaseOrderStatus, BadgeVariant> = {
  draft: "secondary",
  pending_approval: "warning",
  approved: "info",
  sent: "default",
  partially_received: "warning",
  completed: "success",
  cancelled: "destructive",
}

export function isPurchaseOrderStatus(value: string): value is PurchaseOrderStatus {
  return (PURCHASE_ORDER_STATUSES as readonly string[]).includes(value)
}

/**
 * The translated name of a status. An unknown status falls back to the raw
 * value rather than to a blank, so a status the backend adds later is visible
 * instead of silently rendering nothing.
 */
export function purchaseOrderStatusLabel(t: TFunction, status: string): string {
  if (!isPurchaseOrderStatus(status)) return status
  return t(statusLabelKeys[status])
}

export function purchaseOrderStatusVariant(status: string): BadgeVariant {
  return isPurchaseOrderStatus(status) ? statusVariants[status] : "outline"
}
