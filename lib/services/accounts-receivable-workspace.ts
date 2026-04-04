import type {
  Customer,
  FinanceFilters,
  Invoice,
  ModuleOverviewData,
  Receipt,
  SortConfig,
  WorkspaceDetailData,
  WorkspaceListResponse,
} from '@/lib/types'
import { getInvoices } from './receivables'
import { getCustomerById, getCustomers, getInvoiceById, getReceiptById, getReceipts } from './legacy'
import { buildDetailField, buildOverviewRow, formatDateLabel, formatDateTimeLabel, formatMoney, getStatusTone } from './workspace-support'

interface WorkspaceQuery {
  search?: string
  statuses?: string[]
  methods?: string[]
  customerId?: string
  sort?: SortConfig
  page?: number
  pageSize?: number
}

export async function getAccountsReceivableOverview(filters: FinanceFilters): Promise<ModuleOverviewData> {
  const [invoices, customers, receipts] = await Promise.all([
    getInvoices(filters, undefined, undefined, { key: 'dueDate', direction: 'asc' }, 1, 8),
    getCustomers(undefined, undefined, { key: 'name', direction: 'asc' }, 1, 8),
    getReceipts(filters, undefined, undefined, undefined, { key: 'date', direction: 'desc' }, 1, 8),
  ])

  const overdueInvoices = invoices.data.filter(invoice => invoice.status === 'overdue')
  const unappliedReceipts = receipts.data.filter(receipt => receipt.status === 'unapplied')
  const activeCustomers = customers.data.filter(customer => customer.status === 'active')

  return {
    moduleId: 'accounts-receivable',
    title: 'Accounts Receivable',
    subtitle: 'Drive billing, collection follow-up, and receipt application from a shared operator workspace.',
    badge: 'Receivables Operations',
    metrics: [
      { id: 'ar-open', label: 'Open AR', value: formatMoney(invoices.data.reduce((sum, invoice) => sum + invoice.openBalance, 0)), detail: `${invoices.data.length} visible invoices`, tone: 'accent' },
      { id: 'ar-overdue', label: 'Overdue Balance', value: formatMoney(overdueInvoices.reduce((sum, invoice) => sum + invoice.openBalance, 0)), detail: `${overdueInvoices.length} overdue invoices`, tone: overdueInvoices.length ? 'critical' : 'positive' },
      { id: 'ar-unapplied', label: 'Unapplied Cash', value: formatMoney(unappliedReceipts.reduce((sum, receipt) => sum + receipt.amount, 0)), detail: `${unappliedReceipts.length} unapplied receipts`, tone: unappliedReceipts.length ? 'warning' : 'positive' },
      { id: 'ar-customers', label: 'Active Customers', value: String(activeCustomers.length), detail: `${customers.data.filter(customer => customer.status === 'hold').length} on hold`, tone: 'neutral' },
    ],
    actions: [
      { id: 'new-invoice', label: 'New Invoice', href: '/accounts-receivable/invoices', icon: 'plus', tone: 'accent' },
      { id: 'customers', label: 'Customer Master', href: '/accounts-receivable/customers', icon: 'users' },
      { id: 'receipts', label: 'Receipt Queue', href: '/accounts-receivable/receipts', icon: 'wallet' },
    ],
    sections: [
      {
        id: 'collections',
        title: 'Collection Priorities',
        description: 'Invoices needing active follow-up by due date and exposure.',
        rows: invoices.data.slice(0, 6).map(invoice =>
          buildOverviewRow(invoice.id, `${invoice.number} · ${invoice.customerName}`, {
            value: formatMoney(invoice.openBalance, invoice.currency),
            href: '/accounts-receivable/invoices',
            status: invoice.status,
            statusTone: getStatusTone(invoice.status),
            meta: [formatDateLabel(invoice.dueDate), invoice.departmentName ?? 'Unassigned'],
          })
        ),
      },
      {
        id: 'receipt-application',
        title: 'Receipt Application Queue',
        description: 'Recent customer cash still pending application or review.',
        rows: receipts.data.slice(0, 6).map(receipt =>
          buildOverviewRow(receipt.id, `${receipt.number} · ${receipt.customerName}`, {
            value: formatMoney(receipt.amount, receipt.currency),
            href: '/accounts-receivable/receipts',
            status: receipt.status,
            statusTone: getStatusTone(receipt.status),
            meta: [receipt.method.toUpperCase(), formatDateLabel(receipt.date)],
          })
        ),
      },
    ],
  }
}

export async function getInvoicesWorkspace(
  filters: FinanceFilters,
  query: WorkspaceQuery
): Promise<WorkspaceListResponse<Invoice>> {
  const result = await getInvoices(
    {
      ...filters,
      customerId: query.customerId ?? filters.customerId,
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
      { id: 'invoices-visible', label: 'Visible Invoices', value: String(result.total), detail: 'Filtered receivables population', tone: 'neutral' },
      { id: 'invoices-open', label: 'Open Balance', value: formatMoney(result.data.reduce((sum, invoice) => sum + invoice.openBalance, 0)), detail: 'Current page open AR', tone: 'accent' },
      { id: 'invoices-overdue', label: 'Overdue', value: String(result.data.filter(invoice => invoice.status === 'overdue').length), detail: 'Requires collection action', tone: result.data.some(invoice => invoice.status === 'overdue') ? 'critical' : 'positive' },
      { id: 'invoices-draft', label: 'Drafts', value: String(result.data.filter(invoice => invoice.status === 'draft').length), detail: 'Not yet sent', tone: 'warning' },
    ],
    actions: [
      { id: 'new-invoice', label: 'New Invoice', icon: 'plus', tone: 'accent' },
      { id: 'export-invoices', label: 'Export', icon: 'download' },
    ],
    filters: [
      {
        id: 'status',
        label: 'Status',
        options: [
          { value: 'all', label: 'All Statuses' },
          { value: 'draft', label: 'Draft' },
          { value: 'sent', label: 'Sent' },
          { value: 'partial', label: 'Partial' },
          { value: 'paid', label: 'Paid' },
          { value: 'overdue', label: 'Overdue' },
          { value: 'voided', label: 'Voided' },
        ],
      },
    ],
    emptyMessage: 'No invoices match the current receivables filters.',
    defaultSort: { key: 'dueDate', direction: 'asc' },
  }
}

export async function getInvoiceWorkspaceDetail(id: string): Promise<WorkspaceDetailData | null> {
  const invoice = await getInvoiceById(id)
  if (!invoice) {
    return null
  }

  return {
    id: invoice.id,
    title: invoice.number,
    subtitle: `${invoice.customerName} · ${invoice.description ?? 'Customer invoice'}`,
    badges: [
      { id: 'status', label: invoice.status, tone: getStatusTone(invoice.status) },
      { id: 'collection-status', label: invoice.collectionStatus.replace(/_/g, ' '), tone: getStatusTone(invoice.collectionStatus) },
    ],
    summary: [
      buildDetailField('invoice-amount', 'Invoice Amount', formatMoney(invoice.amount, invoice.currency)),
      buildDetailField('open-balance', 'Open Balance', formatMoney(invoice.openBalance, invoice.currency), invoice.openBalance > 0 ? 'warning' : 'positive'),
      buildDetailField('invoice-date', 'Invoice Date', formatDateLabel(invoice.date)),
      buildDetailField('due-date', 'Due Date', formatDateLabel(invoice.dueDate), invoice.status === 'overdue' ? 'critical' : 'neutral'),
    ],
    sections: [
      {
        id: 'line-items',
        title: 'Line Items',
        fields: invoice.lineItems.map(item =>
          buildDetailField(item.id, item.description, `${formatMoney(item.amount, invoice.currency)} · ${item.accountName}`)
        ),
      },
      {
        id: 'billing',
        title: 'Billing Context',
        fields: [
          buildDetailField('customer', 'Customer', invoice.customerName),
          buildDetailField('department', 'Department', invoice.departmentName ?? 'None'),
          buildDetailField('billing-address', 'Billing Address', invoice.billingAddress ?? 'Not provided'),
        ],
      },
    ],
    actions: [
      ...(invoice.status === 'draft' ? [{ id: 'send-invoice', label: 'Send Invoice', icon: 'send' }] : []),
      ...(invoice.status !== 'paid' && invoice.status !== 'voided' ? [{ id: 'void-invoice', label: 'Void Invoice', icon: 'ban' }] : []),
    ],
    links: [{ id: 'invoices', label: 'Open Invoice Workspace', href: '/accounts-receivable/invoices', description: 'Return to invoice operations' }],
  }
}

export async function getCustomersWorkspace(query: WorkspaceQuery): Promise<WorkspaceListResponse<Customer>> {
  const result = await getCustomers(
    query.search,
    query.statuses,
    query.sort ?? { key: 'name', direction: 'asc' },
    query.page ?? 1,
    query.pageSize ?? 15
  )

  return {
    ...result,
    metrics: [
      { id: 'customers-visible', label: 'Visible Customers', value: String(result.total), detail: 'Current customer scope', tone: 'neutral' },
      { id: 'customers-active', label: 'Active Customers', value: String(result.data.filter(customer => customer.status === 'active').length), detail: 'In good standing', tone: 'positive' },
      { id: 'customers-balance', label: 'Customer Balance', value: formatMoney(result.data.reduce((sum, customer) => sum + customer.balance, 0)), detail: 'Outstanding customer exposure', tone: 'accent' },
      { id: 'customers-critical', label: 'High Priority Collections', value: String(result.data.filter(customer => customer.collectionPriority === 'high' || customer.collectionPriority === 'critical').length), detail: 'Escalated customer accounts', tone: 'warning' },
    ],
    actions: [
      { id: 'new-customer', label: 'Add Customer', icon: 'plus', tone: 'accent' },
      { id: 'export-customers', label: 'Export', icon: 'download' },
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
          { value: 'hold', label: 'On Hold' },
        ],
      },
    ],
    emptyMessage: 'No customers match the current master-data filters.',
    defaultSort: { key: 'name', direction: 'asc' },
  }
}

export async function getCustomerWorkspaceDetail(id: string): Promise<WorkspaceDetailData | null> {
  const [customer, invoices] = await Promise.all([
    getCustomerById(id),
    getInvoices({ dateRange: { startDate: new Date('2026-01-01'), endDate: new Date('2026-12-31'), preset: 'this_year' }, customerId: id, entityId: 'e4' }, undefined, undefined, { key: 'dueDate', direction: 'asc' }, 1, 5),
  ])

  if (!customer) {
    return null
  }

  return {
    id: customer.id,
    title: customer.name,
    subtitle: `${customer.code} · ${customer.email}`,
    badges: [
      { id: 'status', label: customer.status, tone: getStatusTone(customer.status) },
      { id: 'priority', label: customer.collectionPriority ?? 'standard', tone: getStatusTone(customer.collectionPriority) },
    ],
    summary: [
      buildDetailField('balance', 'Outstanding Balance', formatMoney(customer.balance, customer.currency), customer.balance > 0 ? 'warning' : 'positive'),
      buildDetailField('credit-limit', 'Credit Limit', formatMoney(customer.creditLimit, customer.currency)),
      buildDetailField('terms', 'Terms', customer.paymentTerms),
      buildDetailField('collector', 'Assigned Collector', customer.assignedCollector ?? 'Unassigned'),
    ],
    sections: [
      {
        id: 'collections',
        title: 'Collections',
        fields: [
          buildDetailField('last-payment-date', 'Last Payment Date', formatDateLabel(customer.lastPaymentDate)),
          buildDetailField('last-payment-amount', 'Last Payment Amount', formatMoney(customer.lastPaymentAmount ?? 0, customer.currency)),
          buildDetailField('notes', 'Collection Notes', customer.collectionNotes ?? 'None'),
        ],
      },
      {
        id: 'open-invoices',
        title: 'Recent Invoices',
        fields: invoices.data.map(invoice =>
          buildDetailField(invoice.id, invoice.number, `${formatMoney(invoice.openBalance, invoice.currency)} · ${invoice.status}`)
        ),
      },
    ],
    actions: [{ id: 'edit-customer', label: 'Edit Customer', icon: 'pencil' }],
    links: [{ id: 'customers', label: 'Open Customer Workspace', href: '/accounts-receivable/customers', description: 'Return to customer master' }],
  }
}

export async function getReceiptsWorkspace(
  filters: FinanceFilters,
  query: WorkspaceQuery
): Promise<WorkspaceListResponse<Receipt>> {
  const result = await getReceipts(
    {
      ...filters,
      customerId: query.customerId ?? filters.customerId,
    },
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
      { id: 'receipts-visible', label: 'Visible Receipts', value: String(result.total), detail: 'Current receipt population', tone: 'neutral' },
      { id: 'receipts-applied', label: 'Applied Cash', value: formatMoney(result.data.filter(receipt => receipt.status === 'applied').reduce((sum, receipt) => sum + receipt.amount, 0)), detail: 'Already applied', tone: 'positive' },
      { id: 'receipts-unapplied', label: 'Unapplied Cash', value: formatMoney(result.data.filter(receipt => receipt.status === 'unapplied').reduce((sum, receipt) => sum + receipt.amount, 0)), detail: 'Needs operator attention', tone: 'warning' },
      { id: 'receipts-pending', label: 'Pending Deposit', value: formatMoney(result.data.filter(receipt => receipt.status === 'pending').reduce((sum, receipt) => sum + receipt.amount, 0)), detail: 'Pending bank or application step', tone: 'accent' },
    ],
    actions: [
      { id: 'new-receipt', label: 'New Receipt', icon: 'plus', tone: 'accent' },
      { id: 'export-receipts', label: 'Export', icon: 'download' },
    ],
    filters: [
      {
        id: 'status',
        label: 'Status',
        options: [
          { value: 'all', label: 'All Statuses' },
          { value: 'pending', label: 'Pending' },
          { value: 'applied', label: 'Applied' },
          { value: 'unapplied', label: 'Unapplied' },
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
          { value: 'cash', label: 'Cash' },
        ],
      },
    ],
    emptyMessage: 'No receipts match the current cash-application filters.',
    defaultSort: { key: 'date', direction: 'desc' },
  }
}

export async function getReceiptWorkspaceDetail(id: string): Promise<WorkspaceDetailData | null> {
  const receipt = await getReceiptById(id)
  if (!receipt) {
    return null
  }

  return {
    id: receipt.id,
    title: receipt.number,
    subtitle: `${receipt.customerName} · ${receipt.bankAccountName}`,
    badges: [
      { id: 'status', label: receipt.status, tone: getStatusTone(receipt.status) },
      { id: 'method', label: receipt.method, tone: 'neutral' },
    ],
    summary: [
      buildDetailField('amount', 'Receipt Amount', formatMoney(receipt.amount, receipt.currency)),
      buildDetailField('date', 'Receipt Date', formatDateLabel(receipt.date)),
      buildDetailField('customer', 'Customer', receipt.customerName),
      buildDetailField('reference', 'Reference', receipt.reference ?? receipt.checkNumber ?? 'None'),
    ],
    sections: [
      {
        id: 'application',
        title: 'Application',
        fields: [
          buildDetailField('bank-account', 'Bank Account', receipt.bankAccountName),
          buildDetailField('invoice-count', 'Linked Invoices', String(receipt.invoiceIds.length)),
          buildDetailField('created-by', 'Created By', receipt.createdBy),
          buildDetailField('created-at', 'Created At', formatDateTimeLabel(receipt.createdAt)),
        ],
      },
      {
        id: 'linked-invoices',
        title: 'Linked Invoices',
        fields: receipt.invoiceIds.map(invoiceId => buildDetailField(invoiceId, 'Invoice Reference', invoiceId)),
      },
    ],
    actions: [
      ...(receipt.status === 'pending' || receipt.status === 'unapplied' ? [{ id: 'apply-receipt', label: 'Apply Receipt', icon: 'check_circle_2' }] : []),
      ...(receipt.status !== 'voided' ? [{ id: 'void-receipt', label: 'Void Receipt', icon: 'ban' }] : []),
    ],
    links: [{ id: 'receipts', label: 'Open Receipt Workspace', href: '/accounts-receivable/receipts', description: 'Return to receipt operations' }],
  }
}
