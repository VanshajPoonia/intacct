import type {
  BankAccount,
  FinanceFilters,
  ModuleOverviewData,
  ReconciliationItem,
  SortConfig,
  Transaction,
  WorkspaceDetailData,
  WorkspaceListResponse,
} from '@/lib/types'
import { getCashPosition, getReconciliationData, getReconciliationItems } from './close'
import { matchesFinanceFilters, paginate, sortItems } from './base'
import { getBankAccountById, getBankAccounts, getEntities, getTransactions, getTransactionById } from './master-data'
import { buildDetailField, buildOverviewRow, formatDateLabel, formatDateTimeLabel, formatMoney, getStatusTone } from './workspace-support'

interface WorkspaceQuery {
  search?: string
  statuses?: string[]
  types?: string[]
  bankAccountId?: string
  reconStatus?: string
  sort?: SortConfig
  page?: number
  pageSize?: number
}

export async function getCashManagementOverview(filters: FinanceFilters): Promise<ModuleOverviewData> {
  const [cashPosition, bankAccounts, reconciliationData, transactions] = await Promise.all([
    getCashPosition(filters),
    getBankAccounts(),
    getReconciliationData(filters),
    getTransactions(filters, undefined, undefined, undefined, { key: 'date', direction: 'desc' }, 1, 8),
  ])

  const scopedAccounts = bankAccounts.filter(account => matchesFinanceFilters(account, filters))

  return {
    moduleId: 'cash-management',
    title: 'Cash Management',
    subtitle: 'Monitor liquidity, bank activity, and reconciliation exceptions from an operator-focused workspace.',
    badge: 'Cash Operations',
    metrics: [
      { id: 'cash-total', label: 'Total Cash', value: formatMoney(cashPosition.totalCash), detail: formatMoney(cashPosition.availableCash) + ' available', tone: 'accent' },
      { id: 'cash-inflows', label: 'Pending Inflows', value: formatMoney(cashPosition.pendingInflows), detail: 'Expected into selected period', tone: 'positive' },
      { id: 'cash-outflows', label: 'Pending Outflows', value: formatMoney(cashPosition.pendingOutflows), detail: 'Expected out of selected period', tone: 'warning' },
      { id: 'cash-exceptions', label: 'Reconciliation Exceptions', value: String(reconciliationData.exceptions.length), detail: `${scopedAccounts.length} visible bank accounts`, tone: reconciliationData.exceptions.length ? 'critical' : 'positive' },
    ],
    actions: [
      { id: 'accounts', label: 'Bank Accounts', href: '/cash-management/accounts', icon: 'building_2' },
      { id: 'transactions', label: 'Bank Transactions', href: '/cash-management/transactions', icon: 'list' },
      { id: 'reconcile', label: 'Reconciliation', href: '/cash-management/reconciliation', icon: 'check_check', tone: 'accent' },
    ],
    sections: [
      {
        id: 'accounts',
        title: 'Bank Account Positions',
        description: 'Current cash and available liquidity by connected account.',
        rows: scopedAccounts.slice(0, 6).map(account =>
          buildOverviewRow(account.id, account.name, {
            value: formatMoney(account.balance, account.currency),
            href: '/cash-management/accounts',
            status: account.status,
            statusTone: getStatusTone(account.status),
            meta: [account.bankName, account.entityName ?? account.entityId],
          })
        ),
      },
      {
        id: 'exceptions',
        title: 'Reconciliation Exceptions',
        description: 'Transactions still unmatched or adjusted in the selected period.',
        rows: reconciliationData.exceptions.slice(0, 6).map(item =>
          buildOverviewRow(item.id, item.description, {
            value: formatMoney(Math.abs(item.difference || item.bankAmount)),
            href: '/cash-management/reconciliation',
            status: item.status,
            statusTone: getStatusTone(item.status),
            meta: [formatDateLabel(item.date), item.reference ?? item.type],
          })
        ),
      },
    ],
  }
}

export async function getCashAccountsWorkspace(
  filters: FinanceFilters,
  query: WorkspaceQuery
): Promise<WorkspaceListResponse<BankAccount>> {
  const accounts = (await getBankAccounts()).filter(account => matchesFinanceFilters(account, filters))
  const sorted = sortItems(accounts, query.sort ?? { key: 'balance', direction: 'desc' })

  return {
    data: sorted,
    total: sorted.length,
    page: 1,
    pageSize: sorted.length,
    totalPages: 1,
    metrics: [
      { id: 'accounts-visible', label: 'Visible Accounts', value: String(sorted.length), detail: 'Connected bank and treasury accounts', tone: 'neutral' },
      { id: 'accounts-balance', label: 'Account Balance', value: formatMoney(sorted.reduce((sum, account) => sum + account.balance, 0)), detail: 'Total current balance', tone: 'accent' },
      { id: 'accounts-available', label: 'Available Balance', value: formatMoney(sorted.reduce((sum, account) => sum + (account.availableBalance ?? account.balance), 0)), detail: 'Available liquidity', tone: 'positive' },
      { id: 'accounts-frozen', label: 'Frozen Accounts', value: String(sorted.filter(account => account.status === 'frozen').length), detail: 'Accounts with operational holds', tone: sorted.some(account => account.status === 'frozen') ? 'critical' : 'neutral' },
    ],
    actions: [
      { id: 'sync-accounts', label: 'Sync Accounts', icon: 'refresh_cw' },
      { id: 'add-account', label: 'Add Account', icon: 'plus', tone: 'accent' },
    ],
    filters: [],
    emptyMessage: 'No bank accounts match the current cash filters.',
    defaultSort: { key: 'balance', direction: 'desc' },
  }
}

export async function getBankAccountWorkspaceDetail(id: string): Promise<WorkspaceDetailData | null> {
  const [account, entities] = await Promise.all([getBankAccountById(id), getEntities()])
  if (!account) {
    return null
  }

  const entity = entities.find(candidate => candidate.id === account.entityId)

  return {
    id: account.id,
    title: account.name,
    subtitle: `${account.bankName} · ${account.accountNumber}`,
    badges: [
      { id: 'type', label: account.type.replace(/_/g, ' '), tone: 'neutral' },
      { id: 'status', label: account.status, tone: getStatusTone(account.status) },
    ],
    summary: [
      buildDetailField('balance', 'Current Balance', formatMoney(account.balance, account.currency)),
      buildDetailField('available-balance', 'Available Balance', formatMoney(account.availableBalance ?? account.balance, account.currency)),
      buildDetailField('entity', 'Entity', entity?.name ?? account.entityId),
      buildDetailField('last-synced', 'Last Synced', formatDateTimeLabel(account.lastSyncedAt)),
    ],
    sections: [
      {
        id: 'banking',
        title: 'Banking Setup',
        fields: [
          buildDetailField('bank-name', 'Bank', account.bankName),
          buildDetailField('account-number', 'Account Number', account.accountNumber),
          buildDetailField('routing-number', 'Routing Number', account.routingNumber ?? 'Not captured'),
        ],
      },
    ],
    actions: [{ id: 'sync-account', label: 'Sync Account', icon: 'refresh_cw' }],
    links: [{ id: 'accounts', label: 'Open Bank Accounts', href: '/cash-management/accounts', description: 'Return to the bank account list' }],
  }
}

export async function getCashTransactionsWorkspace(
  filters: FinanceFilters,
  query: WorkspaceQuery
): Promise<WorkspaceListResponse<Transaction>> {
  const result = await getTransactions(
    {
      ...filters,
      status: query.statuses,
    },
    query.search,
    query.types,
    query.reconStatus,
    query.sort ?? { key: 'date', direction: 'desc' },
    query.page ?? 1,
    query.pageSize ?? 15
  )

  return {
    ...result,
    metrics: [
      { id: 'transactions-visible', label: 'Visible Transactions', value: String(result.total), detail: 'Current bank transaction scope', tone: 'neutral' },
      { id: 'transactions-in', label: 'Inflows', value: formatMoney(result.data.filter(transaction => transaction.amount > 0).reduce((sum, transaction) => sum + transaction.amount, 0)), detail: 'Deposits, receipts, and credits', tone: 'positive' },
      { id: 'transactions-out', label: 'Outflows', value: formatMoney(Math.abs(result.data.filter(transaction => transaction.amount < 0).reduce((sum, transaction) => sum + transaction.amount, 0))), detail: 'Payments, withdrawals, and fees', tone: 'warning' },
      { id: 'transactions-exceptions', label: 'Exceptions', value: String(result.data.filter(transaction => transaction.reconciliationStatus === 'exception' || transaction.reconciliationStatus === 'unmatched').length), detail: 'Needs reconciliation review', tone: 'critical' },
    ],
    actions: [
      { id: 'export-transactions', label: 'Export', icon: 'download' },
      { id: 'open-reconciliation', label: 'Open Reconciliation', icon: 'check_check', href: '/cash-management/reconciliation', tone: 'accent' },
    ],
    filters: [
      {
        id: 'type',
        label: 'Type',
        options: [
          { value: 'all', label: 'All Types' },
          { value: 'deposit', label: 'Deposit' },
          { value: 'withdrawal', label: 'Withdrawal' },
          { value: 'transfer', label: 'Transfer' },
          { value: 'fee', label: 'Fee' },
          { value: 'interest', label: 'Interest' },
          { value: 'payment', label: 'Payment' },
          { value: 'receipt', label: 'Receipt' },
        ],
      },
      {
        id: 'reconciliation',
        label: 'Reconciliation',
        options: [
          { value: 'all', label: 'All States' },
          { value: 'unmatched', label: 'Unmatched' },
          { value: 'matched', label: 'Matched' },
          { value: 'reconciled', label: 'Reconciled' },
          { value: 'exception', label: 'Exception' },
        ],
      },
    ],
    emptyMessage: 'No bank transactions match the current cash filters.',
    defaultSort: { key: 'date', direction: 'desc' },
  }
}

export async function getCashTransactionWorkspaceDetail(id: string): Promise<WorkspaceDetailData | null> {
  const transaction = await getTransactionById(id)
  if (!transaction) {
    return null
  }

  return {
    id: transaction.id,
    title: transaction.description,
    subtitle: `${transaction.reference ?? transaction.type} · ${transaction.bankAccountName ?? transaction.accountName}`,
    badges: [
      { id: 'status', label: transaction.status, tone: getStatusTone(transaction.status) },
      ...(transaction.reconciliationStatus ? [{ id: 'reconciliation-status', label: transaction.reconciliationStatus, tone: getStatusTone(transaction.reconciliationStatus) }] : []),
    ],
    summary: [
      buildDetailField('amount', 'Amount', formatMoney(transaction.amount, transaction.currency)),
      buildDetailField('date', 'Date', formatDateLabel(transaction.date)),
      buildDetailField('source', 'Source', transaction.source ?? 'system'),
      buildDetailField('account', 'GL Account', transaction.accountName),
    ],
    sections: [
      {
        id: 'context',
        title: 'Transaction Context',
        fields: [
          buildDetailField('bank-account', 'Bank Account', transaction.bankAccountName ?? 'Not linked'),
          buildDetailField('category', 'Category', transaction.category ?? 'Not categorized'),
          buildDetailField('department', 'Department', transaction.departmentName ?? 'None'),
          buildDetailField('project', 'Project', transaction.projectName ?? 'None'),
        ],
      },
      {
        id: 'metadata',
        title: 'Metadata',
        fields: [
          buildDetailField('reference', 'Reference', transaction.reference ?? 'None'),
          buildDetailField('entity', 'Entity', transaction.entityName ?? transaction.entityId),
          buildDetailField('created-by', 'Created By', transaction.createdBy),
          buildDetailField('created-at', 'Created At', formatDateTimeLabel(transaction.createdAt)),
        ],
      },
    ],
    actions: [],
    links: [{ id: 'transactions', label: 'Open Transaction Workspace', href: '/cash-management/transactions', description: 'Return to bank transactions' }],
  }
}

export async function getReconciliationWorkspace(
  filters: FinanceFilters,
  query: WorkspaceQuery
): Promise<WorkspaceListResponse<ReconciliationItem>> {
  const bankAccountId = query.bankAccountId
  const response = bankAccountId
    ? await getReconciliationItems(
        bankAccountId,
        query.statuses,
        query.sort ?? { key: 'date', direction: 'desc' },
        query.page ?? 1,
        query.pageSize ?? 15
      )
    : paginate<ReconciliationItem>([], 1, query.pageSize ?? 15)

  const scopedData = response.data.filter(item => matchesFinanceFilters(item, filters))
  const paginated = paginate(
    sortItems(scopedData, query.sort ?? { key: 'date', direction: 'desc' }),
    query.page ?? 1,
    query.pageSize ?? 15
  )

  return {
    ...paginated,
    metrics: [
      { id: 'recon-visible', label: 'Visible Items', value: String(paginated.total), detail: 'Current reconciliation scope', tone: 'neutral' },
      { id: 'recon-unmatched', label: 'Unmatched', value: String(scopedData.filter(item => item.status === 'unmatched').length), detail: 'Needs operator match or clear', tone: scopedData.some(item => item.status === 'unmatched') ? 'critical' : 'positive' },
      { id: 'recon-adjusted', label: 'Adjusted', value: String(scopedData.filter(item => item.status === 'adjusted').length), detail: 'Requires adjustment audit trail', tone: scopedData.some(item => item.status === 'adjusted') ? 'warning' : 'neutral' },
      { id: 'recon-difference', label: 'Open Difference', value: formatMoney(scopedData.reduce((sum, item) => sum + Math.abs(item.difference), 0)), detail: 'Remaining variance in view', tone: 'accent' },
    ],
    actions: [
      { id: 'refresh-reconciliation', label: 'Refresh', icon: 'refresh_cw' },
      { id: 'export-reconciliation', label: 'Export', icon: 'download' },
    ],
    filters: [
      {
        id: 'status',
        label: 'Status',
        options: [
          { value: 'all', label: 'All Statuses' },
          { value: 'matched', label: 'Matched' },
          { value: 'unmatched', label: 'Unmatched' },
          { value: 'adjusted', label: 'Adjusted' },
          { value: 'cleared', label: 'Cleared' },
        ],
      },
    ],
    emptyMessage: 'No reconciliation items match the current review filters.',
    defaultSort: { key: 'date', direction: 'desc' },
  }
}

export async function getReconciliationWorkspaceDetail(
  filters: FinanceFilters,
  bankAccountId: string | undefined,
  id: string
): Promise<WorkspaceDetailData | null> {
  if (!bankAccountId) {
    return null
  }

  const [reconciliationData, account] = await Promise.all([
    getReconciliationData(filters, bankAccountId),
    getBankAccountById(bankAccountId),
  ])

  const item = reconciliationData.items.find(candidate => candidate.id === id)
  if (!item) {
    return null
  }

  return {
    id: item.id,
    title: item.description,
    subtitle: `${item.reference ?? item.type} · ${account?.name ?? item.bankAccountId}`,
    badges: [
      { id: 'status', label: item.status, tone: getStatusTone(item.status) },
      { id: 'type', label: item.type, tone: 'neutral' },
    ],
    summary: [
      buildDetailField('bank-amount', 'Bank Amount', formatMoney(item.bankAmount)),
      buildDetailField('book-amount', 'Book Amount', formatMoney(item.bookAmount)),
      buildDetailField('difference', 'Difference', formatMoney(item.difference), item.difference === 0 ? 'positive' : 'critical'),
      buildDetailField('date', 'Date', formatDateLabel(item.date)),
    ],
    sections: [
      {
        id: 'match-context',
        title: 'Match Context',
        fields: [
          buildDetailField('bank-account', 'Bank Account', account?.name ?? item.bankAccountId),
          buildDetailField('transaction-id', 'Matched Transaction', item.transactionId ?? 'Not matched'),
          buildDetailField('matched-by', 'Matched By', item.matchedBy ?? 'Not matched'),
          buildDetailField('matched-at', 'Matched At', formatDateTimeLabel(item.matchedAt)),
        ],
      },
    ],
    actions: [
      ...(item.status === 'unmatched' ? [{ id: 'match-item', label: 'Match Item', icon: 'link' }, { id: 'clear-item', label: 'Clear Item', icon: 'check_check' }] : []),
      ...(item.status === 'matched' ? [{ id: 'clear-item', label: 'Clear Item', icon: 'check_check' }] : []),
    ],
    links: [{ id: 'reconciliation', label: 'Open Reconciliation Workspace', href: '/cash-management/reconciliation', description: 'Return to reconciliation review' }],
  }
}
