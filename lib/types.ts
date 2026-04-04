// Core Entity Types
export interface Entity {
  id: string
  name: string
  code: string
  type: 'primary' | 'subsidiary' | 'consolidated'
  currency: string
  status: 'active' | 'inactive'
}

export interface Vendor {
  id: string
  name: string
  code: string
  email: string
  phone?: string
  address?: string
  taxId?: string
  paymentTerms: string
  status: 'active' | 'inactive' | 'pending'
  balance: number
  currency: string
  createdAt: Date
}

export interface Customer {
  id: string
  name: string
  code: string
  email: string
  phone?: string
  address?: string
  creditLimit: number
  paymentTerms: string
  status: 'active' | 'inactive' | 'pending'
  balance: number
  currency: string
  createdAt: Date
}

export interface Account {
  id: string
  number: string
  name: string
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'
  category: string
  subCategory?: string
  balance: number
  currency: string
  status: 'active' | 'inactive'
  parentId?: string
}

export interface Transaction {
  id: string
  date: Date
  type: 'debit' | 'credit'
  amount: number
  currency: string
  accountId: string
  accountName: string
  description: string
  reference?: string
  status: 'posted' | 'pending' | 'voided'
  entityId: string
  createdBy: string
  createdAt: Date
}

export interface Bill {
  id: string
  number: string
  vendorId: string
  vendorName: string
  date: Date
  dueDate: Date
  amount: number
  currency: string
  status: 'draft' | 'pending' | 'approved' | 'paid' | 'voided'
  description?: string
  lineItems: BillLineItem[]
  entityId: string
  createdAt: Date
}

export interface BillLineItem {
  id: string
  description: string
  accountId: string
  accountName: string
  amount: number
  quantity: number
  unitPrice: number
}

export interface Invoice {
  id: string
  number: string
  customerId: string
  customerName: string
  date: Date
  dueDate: Date
  amount: number
  currency: string
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'voided'
  description?: string
  lineItems: InvoiceLineItem[]
  entityId: string
  createdAt: Date
}

export interface InvoiceLineItem {
  id: string
  description: string
  accountId: string
  accountName: string
  amount: number
  quantity: number
  unitPrice: number
}

export interface JournalEntry {
  id: string
  number: string
  date: Date
  description: string
  status: 'draft' | 'posted' | 'reversed'
  lines: JournalEntryLine[]
  entityId: string
  createdBy: string
  createdAt: Date
  postedAt?: Date
}

export interface JournalEntryLine {
  id: string
  accountId: string
  accountNumber: string
  accountName: string
  debit: number
  credit: number
  description?: string
  departmentId?: string
  locationId?: string
}

export interface ApprovalItem {
  id: string
  type: 'bill' | 'invoice' | 'journal_entry' | 'purchase_order' | 'expense'
  documentId: string
  documentNumber: string
  description: string
  amount: number
  currency: string
  requestedBy: string
  requestedAt: Date
  status: 'pending' | 'approved' | 'rejected'
  approvers: Approver[]
  currentStep: number
  entityId: string
}

export interface Approver {
  id: string
  name: string
  email: string
  status: 'pending' | 'approved' | 'rejected'
  respondedAt?: Date
  comments?: string
}

export interface ReportFilter {
  startDate?: Date
  endDate?: Date
  entityIds?: string[]
  accountIds?: string[]
  departmentIds?: string[]
  locationIds?: string[]
  vendorIds?: string[]
  customerIds?: string[]
  status?: string[]
}

export interface DashboardMetric {
  id: string
  label: string
  value: number
  previousValue?: number
  change?: number
  changeType?: 'positive' | 'negative' | 'neutral'
  format: 'currency' | 'number' | 'percentage'
  currency?: string
}

// Navigation Types
export interface NavModule {
  id: string
  label: string
  icon: string
  href?: string
  megaMenu?: MegaMenuGroup[]
}

export interface MegaMenuGroup {
  label: string
  items: MegaMenuItem[]
}

export interface MegaMenuItem {
  label: string
  href: string
  description?: string
  icon?: string
}

// User Types
export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  role: string
  entityIds: string[]
}

// Notification Types
export interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'success' | 'error'
  read: boolean
  createdAt: Date
  link?: string
}

// Task Types
export interface Task {
  id: string
  title: string
  description?: string
  dueDate?: Date
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'todo' | 'in_progress' | 'completed'
  assignedTo?: string
  relatedType?: string
  relatedId?: string
  createdAt: Date
}

// Bank Account Types
export interface BankAccount {
  id: string
  name: string
  accountNumber: string
  routingNumber?: string
  bankName: string
  type: 'checking' | 'savings' | 'credit'
  balance: number
  currency: string
  status: 'active' | 'inactive'
  lastSyncedAt?: Date
  entityId: string
}

// Chart Data Types
export interface ChartDataPoint {
  name: string
  value: number
  [key: string]: string | number
}
