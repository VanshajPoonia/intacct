import type { ApprovalItem, Bill, Document, Payment, Vendor } from '@/lib/types'

export const vendors: Vendor[] = [
  { id: 'v-vertex', name: 'Vertex Components', code: 'VERTEX', email: 'ap@vertexcomponents.com', phone: '(312) 555-1111', paymentTerms: 'Net 30', status: 'active', balance: 182000, currency: 'USD', createdAt: new Date('2024-07-12'), preferredPaymentMethod: 'ach' },
  { id: 'v-clearwater', name: 'Clearwater Advisory', code: 'CLEAR', email: 'billing@clearwateradvisory.com', phone: '(312) 555-2233', paymentTerms: 'Net 15', status: 'active', balance: 38400, currency: 'USD', createdAt: new Date('2024-10-05'), preferredPaymentMethod: 'wire' },
  { id: 'v-skygrid', name: 'SkyGrid Cloud', code: 'SKYGRID', email: 'invoices@skygridcloud.com', phone: '(415) 555-4432', paymentTerms: 'Net 30', status: 'active', balance: 26400, currency: 'USD', createdAt: new Date('2025-02-20'), preferredPaymentMethod: 'ach' },
  { id: 'v-nova', name: 'Nova Logistics', code: 'NOVA', email: 'ap@novalogistics.com', phone: '(720) 555-9200', paymentTerms: 'Net 45', status: 'active', balance: 91200, currency: 'USD', createdAt: new Date('2025-03-11'), preferredPaymentMethod: 'check' },
]

export const bills: Bill[] = [
  {
    id: 'bill-7601',
    number: 'BILL-7601',
    vendorId: 'v-vertex',
    vendorName: 'Vertex Components',
    date: new Date('2026-03-08'),
    dueDate: new Date('2026-04-07'),
    amount: 62000,
    amountPaid: 62000,
    currency: 'USD',
    status: 'paid',
    approvalStatus: 'approved',
    paymentStatus: 'paid',
    description: 'March raw material shipment',
    entityId: 'e2',
    departmentId: 'd-ops',
    departmentName: 'Operations',
    createdAt: new Date('2026-03-08T08:00:00'),
    approvedAt: new Date('2026-03-12T10:00:00'),
    approvedBy: 'u2',
    lineItems: [
      { id: 'bli-1', description: 'Steel coil inventory', accountId: 'a-cogs', accountName: 'Cost of Goods Sold', amount: 62000, quantity: 1, unitPrice: 62000, departmentId: 'd-ops', departmentName: 'Operations', projectId: 'p-erp', projectName: 'ERP Data Migration' },
    ],
  },
  {
    id: 'bill-7602',
    number: 'BILL-7602',
    vendorId: 'v-clearwater',
    vendorName: 'Clearwater Advisory',
    date: new Date('2026-03-19'),
    dueDate: new Date('2026-04-03'),
    amount: 18500,
    currency: 'USD',
    status: 'approved',
    approvalStatus: 'approved',
    paymentStatus: 'unpaid',
    description: 'Close acceleration advisory support',
    entityId: 'e1',
    departmentId: 'd-fin',
    departmentName: 'Finance',
    createdAt: new Date('2026-03-19T11:15:00'),
    approvedAt: new Date('2026-03-21T09:00:00'),
    approvedBy: 'u2',
    lineItems: [
      { id: 'bli-2', description: 'Close readiness support', accountId: 'a-prof', accountName: 'Professional Services', amount: 18500, quantity: 1, unitPrice: 18500, departmentId: 'd-fin', departmentName: 'Finance', projectId: 'p-close', projectName: 'Q1 Close Acceleration' },
    ],
  },
  {
    id: 'bill-7603',
    number: 'BILL-7603',
    vendorId: 'v-skygrid',
    vendorName: 'SkyGrid Cloud',
    date: new Date('2026-03-22'),
    dueDate: new Date('2026-04-21'),
    amount: 26400,
    currency: 'USD',
    status: 'pending',
    approvalStatus: 'pending_approval',
    paymentStatus: 'unpaid',
    description: 'Cloud hosting renewal',
    entityId: 'e1',
    departmentId: 'd-it',
    departmentName: 'IT',
    createdAt: new Date('2026-03-22T13:40:00'),
    submittedAt: new Date('2026-03-23T09:20:00'),
    submittedBy: 'u3',
    lineItems: [
      { id: 'bli-3', description: 'Cloud platform annual commit', accountId: 'a-prof', accountName: 'Professional Services', amount: 26400, quantity: 1, unitPrice: 26400, departmentId: 'd-it', departmentName: 'IT', projectId: 'p-erp', projectName: 'ERP Data Migration' },
    ],
  },
  {
    id: 'bill-7604',
    number: 'BILL-7604',
    vendorId: 'v-clearwater',
    vendorName: 'Clearwater Advisory',
    date: new Date('2026-03-25'),
    dueDate: new Date('2026-04-09'),
    amount: 17850,
    currency: 'USD',
    status: 'draft',
    approvalStatus: 'not_submitted',
    paymentStatus: 'unpaid',
    description: 'Quarter-end review workshop',
    entityId: 'e1',
    departmentId: 'd-fin',
    departmentName: 'Finance',
    createdAt: new Date('2026-03-25T16:00:00'),
    lineItems: [
      { id: 'bli-4', description: 'Workshop facilitation', accountId: 'a-prof', accountName: 'Professional Services', amount: 17850, quantity: 1, unitPrice: 17850, departmentId: 'd-fin', departmentName: 'Finance' },
    ],
  },
]

export const payments: Payment[] = [
  { id: 'pay-5001', number: 'PAY-5001', date: new Date('2026-03-30'), amount: 62000, currency: 'USD', method: 'ach', status: 'completed', vendorId: 'v-vertex', vendorName: 'Vertex Components', billIds: ['bill-7601'], bankAccountId: 'ba-op', bankAccountName: 'Northstar Operating', reference: 'PMT-2209', entityId: 'e2', createdBy: 'u3', createdAt: new Date('2026-03-30T13:45:00') },
  { id: 'pay-5002', number: 'PAY-5002', date: new Date('2026-04-03'), amount: 18500, currency: 'USD', method: 'wire', status: 'pending', vendorId: 'v-clearwater', vendorName: 'Clearwater Advisory', billIds: ['bill-7602'], bankAccountId: 'ba-op', bankAccountName: 'Northstar Operating', reference: 'WIRE-3401', entityId: 'e1', createdBy: 'u3', createdAt: new Date('2026-04-01T10:10:00') },
]

export const payableApprovalItems: ApprovalItem[] = [
  { id: 'ap-2001', type: 'bill', documentId: 'bill-7603', documentNumber: 'BILL-7603', description: 'Cloud hosting renewal requires controller approval', amount: 26400, currency: 'USD', requestedBy: 'Lena Garcia', requestedAt: new Date('2026-03-23T09:20:00'), status: 'pending', priority: 'medium', entityId: 'e1' },
  { id: 'ap-2002', type: 'bill', documentId: 'bill-7602', documentNumber: 'BILL-7602', description: 'Close advisory support approved and awaiting payment release', amount: 18500, currency: 'USD', requestedBy: 'Ava Mitchell', requestedAt: new Date('2026-03-21T09:00:00'), status: 'approved', priority: 'high', entityId: 'e1' },
]

export const payableDocuments: Document[] = [
  { id: 'doc-bill-7602', number: 'DOC-7602', type: 'bill', module: 'ap', title: 'Clearwater Advisory bill packet', status: 'approved', entityId: 'e1', relatedEntityType: 'bill', relatedEntityId: 'bill-7602', fileName: 'bill-7602.pdf', fileSizeBytes: 421880, mimeType: 'application/pdf', createdAt: new Date('2026-03-19T11:20:00'), updatedAt: new Date('2026-03-21T09:01:00'), version: 2 },
  { id: 'doc-bill-7603', number: 'DOC-7603', type: 'bill', module: 'ap', title: 'SkyGrid vendor invoice', status: 'pending', entityId: 'e1', relatedEntityType: 'bill', relatedEntityId: 'bill-7603', fileName: 'bill-7603.pdf', fileSizeBytes: 182100, mimeType: 'application/pdf', createdAt: new Date('2026-03-22T13:45:00'), updatedAt: new Date('2026-03-23T09:20:00'), version: 1 },
]
