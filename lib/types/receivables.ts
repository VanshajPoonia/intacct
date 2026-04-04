export interface Customer {
  id: string
  name: string
  code: string
  email: string
  phone?: string
  address?: string
  billingAddress?: string
  creditLimit: number
  paymentTerms: string
  status: 'active' | 'inactive' | 'pending' | 'hold'
  balance: number
  lifetimeRevenue: number
  lastPaymentDate?: Date
  lastPaymentAmount?: number
  currency: string
  createdAt: Date
  collectionNotes?: string
  assignedCollector?: string
  collectionPriority?: 'low' | 'medium' | 'high' | 'critical'
}

export interface InvoiceLineItem {
  id: string
  description: string
  accountId: string
  accountName: string
  amount: number
  quantity: number
  unitPrice: number
  taxAmount?: number
  departmentId?: string
  departmentName?: string
  projectId?: string
  projectName?: string
  classId?: string
  className?: string
}

export interface Invoice {
  id: string
  number: string
  customerId: string
  customerName: string
  date: Date
  dueDate: Date
  amount: number
  amountPaid?: number
  openBalance: number
  currency: string
  status: 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'voided'
  collectionStatus:
    | 'none'
    | 'reminder_sent'
    | 'in_collections'
    | 'escalated'
    | 'written_off'
  description?: string
  lineItems: InvoiceLineItem[]
  entityId: string
  departmentId?: string
  departmentName?: string
  billingAddress?: string
  memo?: string
  createdAt: Date
  sentAt?: Date
  paidAt?: Date
}

export interface Receipt {
  id: string
  number: string
  date: Date
  amount: number
  currency: string
  method: 'check' | 'ach' | 'wire' | 'credit_card' | 'cash'
  status: 'pending' | 'applied' | 'unapplied' | 'voided'
  customerId: string
  customerName: string
  invoiceIds: string[]
  bankAccountId: string
  bankAccountName: string
  checkNumber?: string
  reference?: string
  memo?: string
  entityId: string
  createdBy: string
  createdAt: Date
}

export interface SalesOrderLine {
  id: string
  description: string
  quantity: number
  unitPrice: number
  amount: number
  shippedQuantity: number
  accountId: string
}

export interface SalesOrder {
  id: string
  number: string
  customerId: string
  customerName: string
  status:
    | 'draft'
    | 'pending_approval'
    | 'approved'
    | 'confirmed'
    | 'partially_shipped'
    | 'shipped'
    | 'invoiced'
    | 'closed'
    | 'cancelled'
  orderDate: Date
  requestedDate?: Date
  lines: SalesOrderLine[]
  subtotal: number
  tax: number
  total: number
  entityId: string
  salesRepId?: string
  notes?: string
  createdBy: string
  createdAt: Date
}

export interface Contract {
  id: string
  number: string
  name: string
  customerId: string
  customerName: string
  entityId: string
  projectId?: string
  startDate: Date
  endDate: Date
  contractValue: number
  recognizedRevenue: number
  deferredRevenue: number
  billingFrequency: 'monthly' | 'quarterly' | 'annually' | 'milestone'
  status: 'draft' | 'active' | 'renewal_pending' | 'expired' | 'terminated'
  createdAt: Date
}
