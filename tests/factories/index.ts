import type { User, Product, Customer, Supplier, Category, Sale, PurchaseOrder, Quote, AdminUser } from "@/types"

let nextId = 1

export function resetIds() { nextId = 1 }

export function buildUser(overrides: Partial<User> = {}): User {
  const id = nextId++
  return { id, username: `user${id}`, email: `user${id}@test.com`, fullName: `User ${id}`, roleId: 1, roleName: "Admin", isActive: true, createdAt: "2025-01-01T00:00:00Z", ...overrides }
}

export function buildProduct(overrides: Partial<Product> = {}): Product {
  const id = nextId++
  return { id, name: `Product ${id}`, sku: `SKU-${id}`, barcode: `BAR-${id}`, description: `Description ${id}`, categoryId: 1, supplierId: 1, costPrice: 10, sellPrice: 15, stockQuantity: 100, minStock: 10, maxStock: 200, unit: "pcs", weight: 1, image: null, isActive: true, createdAt: "2025-01-01T00:00:00Z", updatedAt: "2025-01-01T00:00:00Z", ...overrides }
}

export function buildCustomer(overrides: Partial<Customer> = {}): Customer {
  const id = nextId++
  return { id, name: `Customer ${id}`, email: `cust${id}@test.com`, phone: "555-0000", address: `Addr ${id}`, city: "City", state: "State", postalCode: "00000", country: "US", notes: null, isActive: true, createdAt: "2025-01-01T00:00:00Z", updatedAt: "2025-01-01T00:00:00Z", ...overrides }
}

export function buildSupplier(overrides: Partial<Supplier> = {}): Supplier {
  const id = nextId++
  return { id, name: `Supplier ${id}`, email: `supp${id}@test.com`, phone: "555-1000", address: `Addr ${id}`, city: "City", state: "State", zipCode: "00000", website: null, contactPerson: null, notes: null, isActive: true, createdAt: "2025-01-01T00:00:00Z", updatedAt: "2025-01-01T00:00:00Z", ...overrides }
}

export function buildCategory(overrides: Partial<Category> = {}): Category {
  const id = nextId++
  return { id, name: `Category ${id}`, description: null, parentId: undefined, icon: null, sortOrder: 0, createdAt: "2025-01-01T00:00:00Z", updatedAt: "2025-01-01T00:00:00Z", ...overrides }
}

export function buildSale(overrides: Partial<Sale> = {}): Sale {
  const id = nextId++
  return { id, saleNumber: `SALE-${id}`, receiptNumber: null, customerId: 1, userId: 1, warehouseId: 1, subtotal: 100, taxRate: 0.18, taxAmount: 18, discountAmount: 0, total: 118, paymentMethod: "cash", paymentStatus: "paid", notes: null, createdAt: "2025-01-01T00:00:00Z", updatedAt: "2025-01-01T00:00:00Z", customerName: "Customer 1", itemCount: 3, ...overrides }
}

export function buildPurchaseOrder(overrides: Partial<PurchaseOrder> = {}): PurchaseOrder {
  const id = nextId++
  return { id, poNumber: `PO-${id}`, supplierId: 1, supplierName: "Supplier 1", userId: 1, userName: "Admin", warehouseId: 1, warehouseName: "Main", orderDate: "2025-01-01T00:00:00Z", expectedDeliveryDate: null, currency: "USD", paymentTerms: null, shippingMethod: null, referenceNumber: null, buyer: null, subtotal: 500, taxRate: 0.18, taxAmount: 90, discountAmount: 0, shippingCost: 0, total: 590, status: "pending", notes: null, approvedBy: null, approvedByName: null, approvedAt: null, sentAt: null, itemCount: 5, createdAt: "2025-01-01T00:00:00Z", updatedAt: "2025-01-01T00:00:00Z", ...overrides }
}

export function buildQuote(overrides: Partial<Quote> = {}): Quote {
  const id = nextId++
  return { id, quoteNumber: `Q-${id}`, customerId: 1, userId: 1, subtotal: 200, taxRate: 0.18, taxAmount: 36, discountAmount: 0, total: 236, status: "pending", validUntil: null, notes: null, termsConditions: null, createdAt: "2025-01-01T00:00:00Z", updatedAt: "2025-01-01T00:00:00Z", customerName: "Customer 1", itemCount: 2, ...overrides }
}

export function buildAdminUser(overrides: Partial<AdminUser> = {}): AdminUser {
  const id = nextId++
  return { id, username: `admin${id}`, email: `admin${id}@test.com`, fullName: `Admin ${id}`, phone: null, roleId: 1, roleName: "Admin", isActive: true, isLocked: false, lockedUntil: null, failedLoginAttempts: 0, passwordExpiresAt: null, passwordChangeRequired: false, lastLoginAt: null, notes: null, createdBy: null, createdByName: null, createdAt: "2025-01-01T00:00:00Z", updatedAt: "2025-01-01T00:00:00Z", ...overrides }
}
