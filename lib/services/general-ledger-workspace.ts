import type {
  Account,
  FinanceFilters,
  JournalEntry,
  ModuleOverviewData,
  SortConfig,
  WorkspaceDetailData,
  WorkspaceListResponse,
} from '@/lib/types'
import { getCloseStatus } from './close'
import { getChartOfAccounts, getEntities, getJournalEntries } from './master-data'
import { getTrialBalance } from './reporting'
import { getAccountById, getAuditLogs, getJournalEntryById } from './legacy'
import { buildDetailField, buildOverviewRow, formatDateLabel, formatDateTimeLabel, formatMoney, getStatusTone } from './workspace-support'

interface WorkspaceQuery {
  search?: string
  statuses?: string[]
  types?: string[]
  sort?: SortConfig
  page?: number
  pageSize?: number
}

function getJournalAmount(entry: JournalEntry) {
  return entry.lines.reduce((sum, line) => sum + Math.max(line.debit, line.credit), 0)
}

export async function getGeneralLedgerOverview(filters: FinanceFilters): Promise<ModuleOverviewData> {
  const [journals, accounts, closeStatus, trialBalance] = await Promise.all([
    getJournalEntries(filters, undefined, undefined, { key: 'date', direction: 'desc' }, 1, 8),
    getChartOfAccounts(undefined, undefined, { key: 'number', direction: 'asc' }, filters),
    getCloseStatus(filters),
    getTrialBalance(filters),
  ])

  const draftEntries = journals.data.filter(entry => entry.status === 'draft')
  const pendingEntries = journals.data.filter(entry => entry.status === 'pending')
  const inactiveAccounts = accounts.filter(account => account.status === 'inactive')
  const trialBalanceDelta = Math.abs(
    trialBalance.reduce((sum, row) => sum + row.closingDebit, 0) -
      trialBalance.reduce((sum, row) => sum + row.closingCredit, 0)
  )

  return {
    moduleId: 'general-ledger',
    title: 'General Ledger',
    subtitle: 'Control journals, account structure, and period readiness from one operator workspace.',
    badge: 'Ledger Control',
    metrics: [
      { id: 'gl-drafts', label: 'Draft Journals', value: String(draftEntries.length), detail: `${pendingEntries.length} pending review`, tone: draftEntries.length ? 'warning' : 'positive' },
      { id: 'gl-close', label: 'Close Progress', value: `${closeStatus.progressPercent}%`, detail: `${closeStatus.blockedTasks} blocked tasks`, tone: closeStatus.blockedTasks ? 'critical' : 'accent' },
      { id: 'gl-trial-balance', label: 'Trial Balance Delta', value: formatMoney(trialBalanceDelta), detail: 'Ending debit vs credit difference', tone: trialBalanceDelta === 0 ? 'positive' : 'critical' },
      { id: 'gl-accounts', label: 'Active Accounts', value: String(accounts.filter(account => account.status === 'active').length), detail: `${inactiveAccounts.length} inactive`, tone: 'neutral' },
    ],
    actions: [
      { id: 'new-journal', label: 'New Journal Entry', href: '/general-ledger/journal-entries', icon: 'plus', tone: 'accent' },
      { id: 'open-chart', label: 'Chart of Accounts', href: '/general-ledger/chart-of-accounts', icon: 'list_tree' },
      { id: 'trial-balance', label: 'Trial Balance', href: '/general-ledger/reports/trial-balance', icon: 'bar_chart_3' },
    ],
    sections: [
      {
        id: 'journal-review',
        title: 'Journal Review Queue',
        description: 'Draft and pending entries that still need attention before posting.',
        rows: journals.data
          .filter(entry => entry.status === 'draft' || entry.status === 'pending')
          .slice(0, 6)
          .map(entry =>
            buildOverviewRow(entry.id, `${entry.number} · ${entry.description}`, {
              value: formatMoney(getJournalAmount(entry)),
              href: '/general-ledger/journal-entries',
              status: entry.status,
              statusTone: getStatusTone(entry.status),
              meta: [formatDateLabel(entry.date), entry.createdBy],
            })
          ),
      },
      {
        id: 'close-readiness',
        title: 'Close Readiness',
        description: 'Close blockers and chart issues that affect ledger completion.',
        rows: [
          buildOverviewRow('close-progress', closeStatus.currentPeriodLabel, {
            value: `${closeStatus.completedTasks}/${closeStatus.totalTasks} tasks`,
            href: '/work-queue',
            status: closeStatus.blockedTasks ? 'blocked' : 'on track',
            statusTone: closeStatus.blockedTasks ? 'critical' : 'positive',
            meta: [`${closeStatus.overdueTasks} overdue`, `${closeStatus.blockedTasks} blocked`],
          }),
          ...inactiveAccounts.slice(0, 3).map(account =>
            buildOverviewRow(account.id, `${account.number} · ${account.name}`, {
              value: formatMoney(account.balance, account.currency),
              href: '/general-ledger/chart-of-accounts',
              status: account.status,
              statusTone: getStatusTone(account.status),
              meta: [account.type, account.category],
            })
          ),
        ],
      },
    ],
  }
}

export async function getJournalEntriesWorkspace(
  filters: FinanceFilters,
  query: WorkspaceQuery
): Promise<WorkspaceListResponse<JournalEntry>> {
  const result = await getJournalEntries(
    filters,
    query.search,
    query.statuses,
    query.sort ?? { key: 'date', direction: 'desc' },
    query.page ?? 1,
    query.pageSize ?? 15
  )

  const draftEntries = result.data.filter(entry => entry.status === 'draft')
  const pendingEntries = result.data.filter(entry => entry.status === 'pending')
  const postedEntries = result.data.filter(entry => entry.status === 'posted')

  return {
    ...result,
    metrics: [
      { id: 'journals-total', label: 'Visible Entries', value: String(result.total), detail: `${postedEntries.length} posted on this page`, tone: 'neutral' },
      { id: 'journals-drafts', label: 'Draft Entries', value: String(draftEntries.length), detail: `${pendingEntries.length} pending`, tone: draftEntries.length ? 'warning' : 'positive' },
      {
        id: 'journals-value',
        label: 'Current Page Value',
        value: formatMoney(result.data.reduce((sum, entry) => sum + getJournalAmount(entry), 0)),
        detail: 'Combined debit or credit magnitude',
        tone: 'accent',
      },
      {
        id: 'journals-postable',
        label: 'Ready To Post',
        value: String(draftEntries.length),
        detail: 'Drafts available for posting',
        tone: draftEntries.length ? 'warning' : 'positive',
      },
    ],
    actions: [
      { id: 'new-entry', label: 'New Entry', icon: 'plus', tone: 'accent' },
      { id: 'import-journal', label: 'Import Journals', icon: 'upload' },
    ],
    filters: [
      {
        id: 'status',
        label: 'Status',
        options: [
          { value: 'all', label: 'All Statuses' },
          { value: 'draft', label: 'Draft' },
          { value: 'pending', label: 'Pending' },
          { value: 'posted', label: 'Posted' },
          { value: 'reversed', label: 'Reversed' },
        ],
      },
    ],
    emptyMessage: 'No journal entries match the current ledger filters.',
    defaultSort: { key: 'date', direction: 'desc' },
  }
}

export async function getJournalEntryWorkspaceDetail(id: string): Promise<WorkspaceDetailData | null> {
  const [entry, entities, auditLogs] = await Promise.all([
    getJournalEntryById(id),
    getEntities(),
    getAuditLogs('journal_entry', id),
  ])

  if (!entry) {
    return null
  }

  const entity = entities.find(candidate => candidate.id === entry.entityId)
  const totalDebits = entry.lines.reduce((sum, line) => sum + line.debit, 0)
  const totalCredits = entry.lines.reduce((sum, line) => sum + line.credit, 0)

  return {
    id: entry.id,
    title: entry.number,
    subtitle: entry.description,
    badges: [
      { id: 'status', label: entry.status, tone: getStatusTone(entry.status) },
      { id: 'entity', label: entity?.code ?? entry.entityId, tone: 'neutral' },
    ],
    summary: [
      buildDetailField('entry-date', 'Entry Date', formatDateLabel(entry.date)),
      buildDetailField('entity', 'Entity', entity?.name ?? entry.entityId),
      buildDetailField('created-by', 'Created By', entry.createdBy),
      buildDetailField('debits', 'Total Debits', formatMoney(totalDebits)),
      buildDetailField('credits', 'Total Credits', formatMoney(totalCredits)),
      buildDetailField('balance', 'Balance Status', totalDebits === totalCredits ? 'Balanced' : 'Out of balance', totalDebits === totalCredits ? 'positive' : 'critical'),
    ],
    sections: [
      {
        id: 'lines',
        title: 'Journal Lines',
        fields: entry.lines.map(line =>
          buildDetailField(
            line.id,
            `${line.accountNumber} · ${line.accountName}`,
            `${formatMoney(line.debit || line.credit)}${line.departmentName ? ` · ${line.departmentName}` : ''}${line.projectName ? ` · ${line.projectName}` : ''}`
          )
        ),
      },
      {
        id: 'activity',
        title: 'Activity',
        fields: auditLogs.data.slice(0, 6).map(log =>
          buildDetailField(log.id, log.action, `${log.userName} · ${formatDateTimeLabel(log.timestamp)}`)
        ),
      },
    ],
    actions: [
      ...(entry.status === 'draft' ? [{ id: 'post', label: 'Post Entry', icon: 'check_circle_2' }] : []),
      ...(entry.status === 'posted' ? [{ id: 'reverse', label: 'Reverse Entry', icon: 'rotate_ccw' }] : []),
    ],
    links: [
      { id: 'journals', label: 'Open Journal Workspace', href: '/general-ledger/journal-entries', description: 'Return to the journal worklist' },
      { id: 'trial-balance', label: 'Open Trial Balance', href: '/general-ledger/reports/trial-balance', description: 'Validate period balancing' },
    ],
  }
}

export async function getChartOfAccountsWorkspace(
  filters: FinanceFilters,
  query: WorkspaceQuery
): Promise<WorkspaceListResponse<Account>> {
  const result = await getChartOfAccounts(
    query.search,
    query.types,
    query.sort ?? { key: 'number', direction: 'asc' },
    filters
  )

  const activeAccounts = result.filter(account => account.status === 'active')

  return {
    data: result,
    total: result.length,
    page: 1,
    pageSize: result.length,
    totalPages: 1,
    metrics: [
      { id: 'accounts-total', label: 'Visible Accounts', value: String(result.length), detail: `${activeAccounts.length} active`, tone: 'neutral' },
      {
        id: 'accounts-assets',
        label: 'Asset Accounts',
        value: String(result.filter(account => account.type === 'asset').length),
        detail: 'Cash, receivables, and fixed assets',
        tone: 'accent',
      },
      {
        id: 'accounts-revenue',
        label: 'Revenue Accounts',
        value: String(result.filter(account => account.type === 'revenue').length),
        detail: 'Recognized income structure',
        tone: 'positive',
      },
      {
        id: 'accounts-inactive',
        label: 'Inactive Accounts',
        value: String(result.filter(account => account.status === 'inactive').length),
        detail: 'Retained for audit history',
        tone: result.some(account => account.status === 'inactive') ? 'warning' : 'neutral',
      },
    ],
    actions: [
      { id: 'new-account', label: 'New Account', icon: 'plus', tone: 'accent' },
      { id: 'export-accounts', label: 'Export', icon: 'download' },
    ],
    filters: [
      {
        id: 'type',
        label: 'Type',
        options: [
          { value: 'all', label: 'All Types' },
          { value: 'asset', label: 'Asset' },
          { value: 'liability', label: 'Liability' },
          { value: 'equity', label: 'Equity' },
          { value: 'revenue', label: 'Revenue' },
          { value: 'expense', label: 'Expense' },
        ],
      },
    ],
    emptyMessage: 'No accounts match the current chart filters.',
    defaultSort: { key: 'number', direction: 'asc' },
  }
}

export async function getChartAccountWorkspaceDetail(id: string): Promise<WorkspaceDetailData | null> {
  const [account, entities] = await Promise.all([getAccountById(id), getEntities()])

  if (!account) {
    return null
  }

  const entity = entities.find(candidate => candidate.id === account.entityId)

  return {
    id: account.id,
    title: `${account.number} · ${account.name}`,
    subtitle: `${account.category}${account.subCategory ? ` · ${account.subCategory}` : ''}`,
    badges: [
      { id: 'type', label: account.type, tone: account.type === 'expense' ? 'warning' : account.type === 'revenue' ? 'positive' : 'neutral' },
      { id: 'status', label: account.status, tone: getStatusTone(account.status) },
    ],
    summary: [
      buildDetailField('balance', 'Current Balance', formatMoney(account.balance, account.currency)),
      buildDetailField('entity', 'Entity Scope', entity?.name ?? 'Shared / all entities'),
      buildDetailField('currency', 'Currency', account.currency),
    ],
    sections: [
      {
        id: 'classification',
        title: 'Classification',
        fields: [
          buildDetailField('account-type', 'Account Type', account.type),
          buildDetailField('category', 'Category', account.category),
          buildDetailField('sub-category', 'Sub Category', account.subCategory ?? 'None'),
        ],
      },
    ],
    actions: [
      { id: 'edit-account', label: 'Edit Account', icon: 'pencil' },
      { id: account.status === 'active' ? 'archive-account' : 'activate-account', label: account.status === 'active' ? 'Archive Account' : 'Activate Account', icon: 'archive' },
    ],
    links: [{ id: 'chart', label: 'Open Chart Workspace', href: '/general-ledger/chart-of-accounts', description: 'Return to chart maintenance' }],
  }
}
