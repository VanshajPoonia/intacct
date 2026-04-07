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
  bankName?: string
  bankAccountNumber?: string
  bankRoutingNumber?: string
  preferredPaymentMethod?: 'check' | 'ach' | 'wire'
  remittanceEmail?: string
}

export interface BillLineItem {
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
  locationId?: string
  locationName?: string
  projectId?: string
  projectName?: string
}

export interface Bill {
  id: string
  number: string
  vendorId: string
  vendorName: string
  date: Date
  dueDate: Date
  amount: number
  amountPaid?: number
  currency: string
  status: 'draft' | 'pending' | 'approved' | 'paid' | 'voided'
  approvalStatus: 'not_submitted' | 'pending_approval' | 'approved' | 'rejected'
  paymentStatus: 'unpaid' | 'partial' | 'paid'
  description?: string
  lineItems: BillLineItem[]
  entityId: string
  departmentId?: string
  departmentName?: string
  locationId?: string
  locationName?: string
  terms?: string
  createdAt: Date
  submittedAt?: Date
  submittedBy?: string
  approvedAt?: Date
  approvedBy?: string
  rejectedAt?: Date
  rejectedBy?: string
  rejectionReason?: string
}

export interface BillApprovalHistory {
  id: string
  billId: string
  action: 'submitted' | 'approved' | 'rejected' | 'reassigned' | 'commented'
  userId: string
  userName: string
  timestamp: Date
  comment?: string
  fromUser?: string
  toUser?: string
}

export interface Payment {
  id: string
  number: string
  date: Date
  amount: number
  currency: string
  method: 'check' | 'ach' | 'wire' | 'credit_card'
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'voided'
  vendorId: string
  vendorName: string
  billIds: string[]
  bankAccountId: string
  bankAccountName: string
  checkNumber?: string
  reference?: string
  memo?: string
  entityId: string
  createdBy: string
  createdAt: Date
}

export interface PurchaseOrderLine {
  id: string
  description: string
  quantity: number
  unitPrice: number
  amount: number
  receivedQuantity: number
  accountId: string
}

export interface PurchaseOrder {
  id: string
  number: string
  vendorId: string
  vendorName: string
  status:
    | 'draft'
    | 'pending_approval'
    | 'approved'
    | 'sent'
    | 'partially_received'
    | 'received'
    | 'closed'
    | 'cancelled'
  orderDate: Date
  expectedDate?: Date
  lines: PurchaseOrderLine[]
  subtotal: number
  tax: number
  total: number
  entityId: string
  departmentId?: string
  projectId?: string
  notes?: string
  createdBy: string
  createdAt: Date
}
