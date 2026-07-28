export interface User {
  id: number
  email: string
  name: string
  role: string
  avatar?: string
  isActive: boolean
  lastLoginAt?: string
  createdAt: string
  updatedAt: string
}

export interface Product {
  id: number
  name: string
  sku: string
  barcode?: string
  description?: string
  categoryId?: number
  supplierId?: number
  costPrice: number
  sellPrice: number
  stockQuantity: number
  minStock: number
  maxStock?: number
  unit: string
  weight?: number
  image?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Category {
  id: number
  name: string
  description?: string
  parentId?: number
  icon?: string
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface Customer {
  id: number
  name: string
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  taxId?: string
  notes?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Supplier {
  id: number
  name: string
  email?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  website?: string
  contactPerson?: string
  notes?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Sale {
  id: number
  invoiceNumber: string
  customerId?: number
  userId: number
  subtotal: number
  tax: number
  discount: number
  total: number
  paymentMethod: string
  paymentStatus: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface SaleItem {
  id: number
  saleId: number
  productId: number
  quantity: number
  unitPrice: number
  total: number
  createdAt: string
}

export interface PurchaseOrder {
  id: number
  orderNumber: string
  supplierId?: number
  userId: number
  subtotal: number
  tax: number
  total: number
  status: string
  expectedDate?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface PurchaseOrderItem {
  id: number
  purchaseOrderId: number
  productId: number
  quantity: number
  unitCost: number
  total: number
  createdAt: string
}

export interface Setting {
  id: number
  key: string
  value?: string
  group: string
  createdAt: string
  updatedAt: string
}

export type Theme = "light" | "dark" | "system"

export interface Notification {
  id: string
  title: string
  message: string
  type: "info" | "success" | "warning" | "error"
  read: boolean
  createdAt: string
}

export type PageTitle = {
  title: string
  description?: string
}
