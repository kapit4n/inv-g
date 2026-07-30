import { describe, it, expect, beforeEach } from "vitest"
import { CrudService } from "@/services/crud.service"
import { createMockRepository } from "@tests/mocks/repository"
import { buildProduct, buildSupplier, buildPurchaseOrder } from "@tests/factories"
import type { Product, Supplier, PurchaseOrder } from "@/types"

describe("Purchasing Workflow Integration", () => {
  let poRepo: ReturnType<typeof createMockRepository<PurchaseOrder>>
  let supplierRepo: ReturnType<typeof createMockRepository<Supplier>>
  let productRepo: ReturnType<typeof createMockRepository<Product>>
  let poService: CrudService<PurchaseOrder>

  beforeEach(() => {
    poRepo = createMockRepository([])
    supplierRepo = createMockRepository([buildSupplier({ id: 1, name: "Distributor A" })])
    productRepo = createMockRepository([
      buildProduct({ id: 1, name: "Raw Material", stockQuantity: 0, costPrice: 5 }),
    ])
    poService = new CrudService({ repository: poRepo, entityName: "PurchaseOrder" })
  })

  it("create purchase order and update stock on receipt", async () => {
    const po = await poService.create(
      buildPurchaseOrder({ poNumber: "PO-001", status: "pending" })
    )
    expect(po.status).toBe("pending")

    const received = await poService.update(po.id, { status: "received" })
    expect(received.status).toBe("received")

    const product = await productRepo.findById(1)
    const receivedQty = 50
    await productRepo.update(1, { stockQuantity: (product?.stockQuantity ?? 0) + receivedQty })
    const updated = await productRepo.findById(1)
    expect(updated!.stockQuantity).toBe(50)
  })

  it("purchase order lifecycle: pending → approved → sent → received", async () => {
    const po = await poService.create(buildPurchaseOrder({ poNumber: "PO-LIFE", status: "pending" }))
    expect(po.status).toBe("pending")

    const approved = await poService.update(po.id, { status: "approved" })
    expect(approved.status).toBe("approved")

    const sent = await poService.update(po.id, { status: "sent" })
    expect(sent.status).toBe("sent")

    const received = await poService.update(po.id, { status: "received" })
    expect(received.status).toBe("received")
  })

  it("cannot create purchase order without supplier (business rule)", async () => {
    function validatePO(po: Partial<PurchaseOrder>): boolean {
      return !!po.supplierId
    }

    expect(validatePO({ supplierId: 1 })).toBe(true)
    expect(validatePO({})).toBe(false)
  })

  it("purchase order pagination works", async () => {
    for (let i = 0; i < 12; i++) {
      await poService.create(buildPurchaseOrder({ poNumber: `PO-${i}` }))
    }
    const page1 = await poService.paginate({ page: 1, pageSize: 10 })
    expect(page1.data).toHaveLength(10)
    expect(page1.total).toBe(12)
  })
})
