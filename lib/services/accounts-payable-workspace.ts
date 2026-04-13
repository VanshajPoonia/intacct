import type {
  Bill,
  FinanceFilters,
  ModuleOverviewData,
  Payment,
  SortConfig,
  Vendor,
  WorkspaceDetailData,
  WorkspaceListResponse,
} from '@/lib/types'
import { getBillById, getBills, getPaymentById, getPayments, getVendors, getVendorById } from './payables'
import { buildDetailField, buildOverviewRow, formatDateLabel, formatDateTimeLabel, formatMoney, getStatusTone } from './workspace-support'

interface WorkspaceQuery {
  search?: string
  statuses?: string[]
  methods?: string[]
  vendorId?: string
  sort?: SortConfig
  page?: number
  pageSize?: number
}

export async function getAccountsPayableOverview(filters: FinanceFilters): Promise<ModuleOverviewData> {
  const [bills, vendors, payments] = await Promise.all([
    getBills(filters, undefined, undefined, { key: 'dueDate', direction: 'asc' }, 1, 8),
    getVendors(undefined, undefined, { key: 'name', direction: 'asc' }, 1, 8),
    getPayments(filters, undefined, undefined, undefined, { key: 'date', direction: 'desc' }, 1, 8),
  ])

  const pendingBills = bills.data.filter(bill => bill.status === 'pending' || bill.status === 'draft')
  const approvedBills = bills.data.filter(bill => bill.status === 'approved')
  const overdueBills = bills.data.filter(bill => bill.status !== 'paid' && bill.dueDate < filters.dateRange.endDate)

  return {
    moduleId: 'accounts-payable',
    title: 'Accounts Payable',
    subtitle: 'Prioritize bill approvals, vendor exposure, and payment release from a single operator workspace.',
    badge: 'Payables Operations',
    metrics: [
      { id: 'ap-pending', label: 'Pending Bills', value: formatMoney(pendingBills.reduce((sum, bill) => sum + bill.amount, 0)), detail: `${pendingBills.length} bills need review`, tone: pendingBills.length ? 'warning' : 'positive' },
      { id: 'ap-approved', label: 'Ready To Pay', value: formatMoney(approvedBills.reduce((sum, bill) => sum + bill.amount, 0)), detail: `${approvedBills.length} approved bills`, tone: approvedBills.length ? 'accent' : 'neutral' },
      { id: 'ap-overdue', label: 'Overdue Exposure', value: formatMoney(overdueBills.reduce((sum, bill) => sum + bill.amount, 0)), detail: `${overdueBills.length} overdue`, tone: overdueBills.length ? 'critical' : 'positive' },
      { id: 'ap-vendors', label: 'Active Vendors', value: String(vendors.data.filter(vendor => vendor.status === 'active').length), detail: `${payments.data.length} recent payments`, tone: 'neutral' },
    ],
    actions: [
      { id: 'new-bill', label: 'New Bill', href: '/accounts-payable/bills', icon: 'plus', tone: 'accent' },
      { id: 'vendors', label: 'Vendor Master', href: '/accounts-payable/vendors', icon: 'building_2' },
      { id: 'payments', label: 'Payment Queue', href: '/accounts-payable/payments', icon: 'wallet' },
    ],
    sections: [
      {
        id: 'bill-review',
        title: 'Bills Requiring Action',
        description: 'Draft, pending, and approved bills sorted by due date.',
        rows: bills.data.slice(0, 6).map(bill =>
          buildOverviewRow(bill.id, `${bill.number} · ${bill.vendorName}`, {
            value: formatMoney(bill.amount, bill.currency),
            href: '/accounts-payable/bills',
            status: bill.status,
            statusTone: getStatusTone(bill.status),
            meta: [formatDateLabel(bill.dueDate), bill.departmentName ?? 'Unassigned'],
          })
        ),
      },
      {
        id: 'payment-release',
        title: 'Payment Release Queue',
        description: 'Recently scheduled or released disbursements.',
        rows: payments.data.slice(0, 6).map(payment =>
          buildOverviewRow(payment.id, `${payment.number} · ${payment.vendorName}`, {
            value: formatMoney(payment.amount, payment.currency),
            href: '/accounts-payable/payments',
            status: payment.status,
            statusTone: getStatusTone(payment.status),
            meta: [payment.method.toUpperCase(), payment.bankAccountName],
          })
        ),
      },
    ],
  }
}

export async function getBillsWorkspace(
  filters: FinanceFilters,
  query: WorkspaceQuery
): Promise<WorkspaceListResponse<Bill>> {
  const result = await getBills(
    {
      ...filters,
      vendorId: query.vendorId ?? filters.vendorId,
    },
    query.search,
    query.statuses,
    query.sort ?? { key: 'dueDate', direction: 'asc' },
    query.page ?? 1,
    query.pageSize ?? 15
  )

  return {
    ...result,
    metrics: [
      { id: 'bills-total', label: 'Visible Bills', value: String(result.total), detail: 'Current filtered bill population', tone: 'neutral' },
      { id: 'bills-pending', label: 'Pending Approval', value: String(result.data.filter(bill => bill.status === 'pending').length), detail: formatMoney(result.data.filter(bill => bill.status === 'pending').reduce((sum, bill) => sum + bill.amount, 0)), tone: 'warning' },
      { id: 'bills-approved', label: 'Approved', value: String(result.data.filter(bill => bill.status === 'approved').length), detail: formatMoney(result.data.filter(bill => bill.status === 'approved').reduce((sum, bill) => sum + bill.amount, 0)), tone: 'accent' },
      { id: 'bills-overdue', label: 'Overdue', value: String(result.data.filter(bill => bill.status !== 'paid' && bill.dueDate < filters.dateRange.endDate).length), detail: 'Bills due before the selected period end', tone: 'critical' },
    ],
    actions: [
      { id: 'new-bill', label: 'New Bill', icon: 'plus', tone: 'accent' },
      { id: 'export-bills', label: 'Export', icon: 'download' },
    ],
    filters: [
      {
        id: 'status',
        label: 'Status',
        options: [
          { value: 'all', label: 'All Statuses' },
          { value: 'draft', label: 'Draft' },
          { value: 'pending', label: 'Pending' },
          { value: 'approved', label: 'Approved' },
          { value: 'paid', label: 'Paid' },
          { value: 'voided', label: 'Voided' },
        ],
      },
    ],
    emptyMessage: 'No bills match the current payables filters.',
    defaultSort: { key: 'dueDate', direction: 'asc' },
  }
}

export async function getBillWorkspaceDetail(id: string): Promise<WorkspaceDetailData | null> {
  const bill = await getBillById(id)
  if (!bill) {
    return null
  }

  return {
    id: bill.id,
    title: bill.number,
    subtitle: `${bill.vendorName} · ${bill.description ?? 'Vendor bill'}`,
    badges: [
      { id: 'status', label: bill.status, tone: getStatusTone(bill.status) },
      { id: 'approval', label: bill.approvalStatus.replace(/_/g, ' '), tone: getStatusTone(bill.approvalStatus) },
    ],
    summary: [
      buildDetailField('amount', 'Bill Amount', formatMoney(bill.amount, bill.currency)),
      buildDetailField('due-date', 'Due Date', formatDateLabel(bill.dueDate)),
      buildDetailField('entity', 'Entity', bill.entityId),
      buildDetailField('payment-status', 'Payment Status', bill.paymentStatus.replace(/_/g, ' '), getStatusTone(bill.paymentStatus)),
    ],
    sections: [
      {
        id: 'coding',
        title: 'Coding',
        fields: bill.lineItems.map(item =>
          buildDetailField(item.id, `${item.accountName}`, `${formatMoney(item.amount, bill.currency)}${item.departmentName ? ` · ${item.departmentName}` : ''}${item.projectName ? ` · ${item.projectName}` : ''}`)
        ),
      },
      {
        id: 'approval',
        title: 'Approval Context',
        fields: [
          buildDetailField('submitted-by', 'Submitted By', bill.submittedBy ?? 'Not submitted'),
          buildDetailField('approved-by', 'Approved By', bill.approvedBy ?? 'Awaiting approval'),
          buildDetailField('terms', 'Terms', bill.terms ?? 'None'),
        ],
      },
    ],
    actions: [
      ...(bill.status === 'pending' ? [{ id: 'approve-bill', label: 'Approve Bill', icon: 'check_circle_2' }] : []),
      ...(bill.status !== 'paid' && bill.status !== 'voided' ? [{ id: 'void-bill', label: 'Void Bill', icon: 'ban' }] : []),
    ],
    links: [{ id: 'ap-bills', label: 'Open Bill Workspace', href: '/accounts-payable/bills', description: 'Return to bill operations' }],
  }
}

export async function getVendorsWorkspace(query: WorkspaceQuery): Promise<WorkspaceListResponse<Vendor>> {
  const result = await getVendors(
    query.search,
    query.statuses,
    query.sort ?? { key: 'name', direction: 'asc' },
    query.page ?? 1,
    query.pageSize ?? 15
  )

  return {
    ...result,
    metrics: [
      { id: 'vendors-total', label: 'Visible Vendors', value: String(result.total), detail: 'Filtered vendor population', tone: 'neutral' },
      { id: 'vendors-active', label: 'Active Vendors', value: String(result.data.filter(vendor => vendor.status === 'active').length), detail: 'Eligible for purchasing and payment', tone: 'positive' },
      { id: 'vendors-balance', label: 'Open Balance', value: formatMoney(result.data.reduce((sum, vendor) => sum + vendor.balance, 0)), detail: 'Combined vendor liability', tone: 'accent' },
      { id: 'vendors-ach', label: 'ACH Preferred', value: String(result.data.filter(vendor => vendor.preferredPaymentMethod === 'ach').length), detail: 'Configured for electronic release', tone: 'neutral' },
    ],
    actions: [
      { id: 'new-vendor', label: 'Add Vendor', icon: 'plus', tone: 'accent' },
      { id: 'export-vendors', label: 'Export', icon: 'download' },
    ],
    filters: [
      {
        id: 'status',
        label: 'Status',
        options: [
          { value: 'all', label: 'All Statuses' },
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' },
          { value: 'pending', label: 'Pending' },
        ],
      },
    ],
    emptyMessage: 'No vendors match the current master-data filters.',
    defaultSort: { key: 'name', direction: 'asc' },
  }
}

export async function getVendorWorkspaceDetail(id: string): Promise<WorkspaceDetailData | null> {
  const [vendor, relatedBills] = await Promise.all([
    getVendorById(id),
    getBills({ dateRange: { startDate: new Date('2026-01-01'), endDate: new Date('2026-12-31'), preset: 'this_year' }, vendorId: id, entityId: 'e4' }, undefined, undefined, { key: 'date', direction: 'desc' }, 1, 5),
  ])

  if (!vendor) {
    return null
  }

  return {
    id: vendor.id,
    title: vendor.name,
    subtitle: `${vendor.code} · ${vendor.email}`,
    badges: [
      { id: 'status', label: vendor.status, tone: getStatusTone(vendor.status) },
      { id: 'method', label: vendor.preferredPaymentMethod ?? 'No default method', tone: 'neutral' },
    ],
    summary: [
      buildDetailField('open-balance', 'Open Balance', formatMoney(vendor.balance, vendor.currency)),
      buildDetailField('terms', 'Payment Terms', vendor.paymentTerms),
      buildDetailField('email', 'Remittance Email', vendor.remittanceEmail ?? vendor.email),
    ],
    sections: [
      {
        id: 'banking',
        title: 'Banking',
        fields: [
          buildDetailField('bank-name', 'Bank', vendor.bankName ?? 'Not configured'),
          buildDetailField('payment-method', 'Preferred Method', vendor.preferredPaymentMethod ?? 'None'),
          buildDetailField('phone', 'Phone', vendor.phone ?? 'Not provided'),
        ],
      },
      {
        id: 'recent-bills',
        title: 'Recent Bills',
        fields: relatedBills.data.map(bill =>
          buildDetailField(bill.id, bill.number, `${formatMoney(bill.amount, bill.currency)} · ${bill.status}`)
        ),
      },
    ],
    actions: [{ id: 'edit-vendor', label: 'Edit Vendor', icon: 'pencil' }],
    links: [{ id: 'vendor-master', label: 'Open Vendor Workspace', href: '/accounts-payable/vendors', description: 'Return to vendor master' }],
  }
}

export async function getPaymentsWorkspace(
  filters: FinanceFilters,
  query: WorkspaceQuery
): Promise<WorkspaceListResponse<Payment>> {
  const result = await getPayments(
    filters,
    query.search,
    query.statuses,
    query.methods,
    query.sort ?? { key: 'date', direction: 'desc' },
    query.page ?? 1,
    query.pageSize ?? 15
  )

  return {
    ...result,
    metrics: [
      { id: 'payments-visible', label: 'Visible Payments', value: String(result.total), detail: 'Current payment batch scope', tone: 'neutral' },
      { id: 'payments-pending', label: 'Pending Release', value: formatMoney(result.data.filter(payment => payment.status === 'pending').reduce((sum, payment) => sum + payment.amount, 0)), detail: `${result.data.filter(payment => payment.status === 'pending').length} pending`, tone: 'warning' },
      { id: 'payments-processing', label: 'In Flight', value: formatMoney(result.data.filter(payment => payment.status === 'processing').reduce((sum, payment) => sum + payment.amount, 0)), detail: 'Processing disbursements', tone: 'accent' },
      { id: 'payments-completed', label: 'Completed', value: formatMoney(result.data.filter(payment => payment.status === 'completed').reduce((sum, payment) => sum + payment.amount, 0)), detail: 'Settled in selected window', tone: 'positive' },
    ],
    actions: [
      { id: 'new-payment', label: 'New Payment', icon: 'plus', tone: 'accent' },
      { id: 'export-payments', label: 'Export', icon: 'download' },
    ],
    filters: [
      {
        id: 'status',
        label: 'Status',
        options: [
          { value: 'all', label: 'All Statuses' },
          { value: 'pending', label: 'Pending' },
          { value: 'processing', label: 'Processing' },
          { value: 'completed', label: 'Completed' },
          { value: 'failed', label: 'Failed' },
          { value: 'voided', label: 'Voided' },
        ],
      },
      {
        id: 'method',
        label: 'Method',
        options: [
          { value: 'all', label: 'All Methods' },
          { value: 'ach', label: 'ACH' },
          { value: 'wire', label: 'Wire' },
          { value: 'check', label: 'Check' },
          { value: 'credit_card', label: 'Card' },
        ],
      },
    ],
    emptyMessage: 'No payments match the current disbursement filters.',
    defaultSort: { key: 'date', direction: 'desc' },
  }
}

export async function getPaymentWorkspaceDetail(id: string): Promise<WorkspaceDetailData | null> {
  const payment = await getPaymentById(id)
  if (!payment) {
    return null
  }

  return {
    id: payment.id,
    title: payment.number,
    subtitle: `${payment.vendorName} · ${payment.bankAccountName}`,
    badges: [
      { id: 'status', label: payment.status, tone: getStatusTone(payment.status) },
      { id: 'method', label: payment.method, tone: 'neutral' },
    ],
    summary: [
      buildDetailField('amount', 'Payment Amount', formatMoney(payment.amount, payment.currency)),
      buildDetailField('date', 'Payment Date', formatDateLabel(payment.date)),
      buildDetailField('reference', 'Reference', payment.reference ?? payment.checkNumber ?? 'None'),
      buildDetailField('bank', 'Bank Account', payment.bankAccountName),
    ],
    sections: [
      {
        id: 'release-context',
        title: 'Release Context',
        fields: [
          buildDetailField('vendor', 'Vendor', payment.vendorName),
          buildDetailField('created-by', 'Created By', payment.createdBy),
          buildDetailField('created-at', 'Created At', formatDateTimeLabel(payment.createdAt)),
        ],
      },
      {
        id: 'bills',
        title: 'Linked Bills',
        fields: payment.billIds.map(billId => buildDetailField(billId, 'Bill Reference', billId)),
      },
    ],
    actions: [
      ...(payment.status === 'pending' ? [{ id: 'process-payment', label: 'Start Processing', icon: 'play_circle' }] : []),
      ...(payment.status === 'processing' ? [{ id: 'complete-payment', label: 'Mark Completed', icon: 'check_circle_2' }] : []),
      ...(payment.status !== 'completed' && payment.status !== 'voided' ? [{ id: 'void-payment', label: 'Void Payment', icon: 'ban' }] : []),
    ],
    links: [{ id: 'payments', label: 'Open Payment Workspace', href: '/accounts-payable/payments', description: 'Return to payment operations' }],
  }
}
