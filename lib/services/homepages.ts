import type {
  ApprovalItem,
  Bill,
  CloseTask,
  FinanceFilters,
  Invoice,
  JournalEntry,
  ReconciliationItem,
  RoleHomeConfig,
  RoleHomepageAction,
  RoleHomepageChartConfig,
  RoleHomepageData,
  RoleHomepageMetric,
  RoleHomepageSection,
  RoleHomepageWidget,
  RoleHomepageWidgetItem,
  RoleId,
  SavedView,
  Task,
} from '@/lib/types'
import { isInDateRange, matchesFinanceFilters } from './base'
import { getCloseStatus, getCloseTasks, getReconciliationData } from './close'
import { getRoleHomeConfig } from './identity'
import { getEntities, getJournalEntries, getTransactions } from './master-data'
import { getBills } from './payables'
import { getInvoices } from './receivables'
import {
  getBudgetVsActual,
  getCashFlow,
  getConsolidatedFinancials,
  getDashboardMetrics,
  getPnL,
  getTrialBalance,
} from './reporting'
import { getSavedViews } from './search-views'
import { getRuntimeDataset } from './runtime-data'
import {
  type AuditLogEntry,
  getApiKeys,
  getApprovalItems,
  getAuditLogs,
  getIntegrations,
  getTasks,
  getWorkflows,
} from './legacy'
import { getUsers } from './users-access'

let payableDocuments: any[] = []
let customers: any[] = []
let receivableDocuments: any[] = []
let workflowDocuments: any[] = []
let homepageStatePromise: Promise<void> | null = null

async function ensureHomepageState() {
  if (homepageStatePromise) {
    return homepageStatePromise
  }

  homepageStatePromise = (async () => {
    const [payables, receivables, workflow] = await Promise.all([
      getRuntimeDataset<{ payableDocuments: any[] }>("payables"),
      getRuntimeDataset<{ customers: any[]; receivableDocuments: any[] }>("receivables"),
      getRuntimeDataset<{ workflowDocuments: any[] }>("workflow"),
    ])

    payableDocuments = payables.payableDocuments
    customers = receivables.customers
    receivableDocuments = receivables.receivableDocuments
    workflowDocuments = workflow.workflowDocuments
  })()

  try {
    await homepageStatePromise
  } finally {
    homepageStatePromise = null
  }
}

const roleFallbacks: Partial<Record<RoleId, RoleId>> = {
  ap_clerk: 'ap_specialist',
  ar_clerk: 'ar_specialist',
  viewer: 'accountant',
}

const accentDescriptions: Record<RoleId, string> = {
  accountant: 'Queue-first close execution across reconciliations, journals, and document readiness.',
  ap_specialist: 'Vendor bills, approvals, payment readiness, and disbursement timing.',
  ar_specialist: 'Collections, invoice workload, and receivables follow-up by customer.',
  controller: 'Close assurance, reporting readiness, and policy-critical exceptions.',
  cfo: 'Performance, liquidity, plan variance, and consolidated visibility.',
  admin: 'Access governance, workflow health, platform integrations, and audit coverage.',
  ap_clerk: 'Vendor bills, approvals, payment readiness, and disbursement timing.',
  ar_clerk: 'Collections, invoice workload, and receivables follow-up by customer.',
  viewer: 'Queue-first close execution across reconciliations, journals, and document readiness.',
}

const actionDescriptions: Record<string, string> = {
  '/general-ledger/journal-entries': 'Prepare or review journal activity for the selected entity.',
  '/cash-management/reconciliation': 'Open the reconciliation workspace and resolve breaks.',
  '/work-queue': 'Jump into the cross-module operational queue.',
  '/accounts-payable/bills': 'Review bills, coding, and approval routing.',
  '/accounts-payable/vendors': 'Manage vendor records and onboarding issues.',
  '/accounts-receivable/invoices': 'Create or review invoice workload.',
  '/accounts-receivable/receipts': 'Apply receipts and monitor remittance activity.',
  '/general-ledger/reports/trial-balance': 'Validate balances before statements are issued.',
  '/reports/income-statement': 'Run the current-period P&L view.',
  '/admin/users': 'Manage user access and role assignments.',
  '/reports': 'Open the reporting workspace.',
  '/admin/workflows': 'Review workflow routing and approval automation.',
  '/admin/api-keys': 'Inspect API credentials and developer access.',
}

function toCanonicalRoleId(roleId: RoleId): RoleId {
  return roleFallbacks[roleId] ?? roleId
}

function formatCurrency(value: number, currency: string = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value)
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 0,
  }).format(value)
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`
}

function formatShortDate(value: Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(value)
}

function formatShortDateTime(value: Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(value)
}

function isSameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  )
}

function toneFromDelta(value: number): RoleHomepageMetric['tone'] {
  if (value > 0) {
    return 'positive'
  }
  if (value < 0) {
    return 'critical'
  }
  return 'neutral'
}

function statusToneFromValue(value: string): RoleHomepageWidgetItem['statusTone'] {
  const normalized = value.toLowerCase()

  if (['paid', 'approved', 'posted', 'completed', 'active', 'connected', 'healthy', 'on_track', 'ready'].includes(normalized)) {
    return 'positive'
  }

  if (['blocked', 'overdue', 'error', 'rejected', 'needs_review', 'missing', 'exception'].includes(normalized)) {
    return 'critical'
  }

  if (['pending', 'pending_approval', 'draft', 'in_progress', 'in_collections', 'reminder_sent'].includes(normalized)) {
    return 'warning'
  }

  return 'neutral'
}

function getActionIcon(href: string) {
  if (href.startsWith('/general-ledger')) {
    return 'BookOpenText'
  }
  if (href.startsWith('/accounts-payable')) {
    return 'ReceiptText'
  }
  if (href.startsWith('/accounts-receivable')) {
    return 'WalletCards'
  }
  if (href.startsWith('/cash-management')) {
    return 'Landmark'
  }
  if (href.startsWith('/work-queue') || href.startsWith('/approvals') || href.startsWith('/tasks')) {
    return 'Inbox'
  }
  if (href.startsWith('/reports')) {
    return 'LineChart'
  }
  if (href.startsWith('/admin')) {
    return 'ShieldCheck'
  }
  if (href.startsWith('/integrations')) {
    return 'PlugZap'
  }
  if (href.startsWith('/api-developer')) {
    return 'Code2'
  }
  if (href.startsWith('/ai')) {
    return 'Sparkles'
  }
  return 'ArrowLeftRight'
}

function uniqueById<T extends { id: string }>(items: T[]) {
  const seen = new Set<string>()
  return items.filter(item => {
    if (seen.has(item.id)) {
      return false
    }

    seen.add(item.id)
    return true
  })
}

function buildRoleHeaderMetric(id: string, label: string, value: string, detail?: string, tone?: RoleHomepageMetric['tone']): RoleHomepageMetric {
  return {
    id,
    label,
    value,
    detail,
    tone,
  }
}

function buildMetricFromWidget(metric: { id: string; label: string; value: number; change?: number; format?: string; currency?: string }): RoleHomepageMetric {
  const formattedValue =
    metric.format === 'currency'
      ? formatCurrency(metric.value, metric.currency ?? 'USD')
      : metric.format === 'percentage'
        ? formatPercent(metric.value)
        : formatNumber(metric.value)

  return {
    id: metric.id,
    label: metric.label,
    value: formattedValue,
    detail: metric.change !== undefined ? `${metric.change > 0 ? '+' : ''}${metric.change.toFixed(1)}% vs prior` : undefined,
    tone: metric.change !== undefined ? toneFromDelta(metric.change) : 'neutral',
  }
}

function toPrimaryActions(roleHomeConfig: RoleHomeConfig, extras: RoleHomepageAction[] = []) {
  const quickActions = roleHomeConfig.quickActions.map(action => ({
    ...action,
    icon: getActionIcon(action.href),
    description: actionDescriptions[action.href] ?? roleHomeConfig.subtitle,
    tone: 'accent' as const,
  }))

  return uniqueById([...quickActions, ...extras])
}

function toSavedViewActions(views: SavedView[], fallbackHref: string): RoleHomepageAction[] {
  return views.map(view => ({
    id: `view-${view.id}`,
    label: view.name,
    href: fallbackHref,
    description: view.isDefault ? 'Default saved view for this module.' : 'Saved operator filter set.',
    icon: 'Star',
    tone: view.isDefault ? 'accent' : 'neutral',
  }))
}

function toSection(id: string, area: RoleHomepageSection['area'], widgets: RoleHomepageWidget[]): RoleHomepageSection {
  return { id, area, widgets }
}

function buildMissingDocumentItems(filters: FinanceFilters, closeTasks: CloseTask[], journals: JournalEntry[], bills: Bill[], invoices: Invoice[]) {
  const items: RoleHomepageWidgetItem[] = []

  const scopedWorkflowDocuments = workflowDocuments.filter(document => matchesFinanceFilters(document, filters))
  const scopedPayableDocuments = payableDocuments.filter(document => matchesFinanceFilters(document, filters))
  const scopedReceivableDocuments = receivableDocuments.filter(document => matchesFinanceFilters(document, filters))

  closeTasks.forEach(task => {
    const attachedCount = scopedWorkflowDocuments.filter(document => document.relatedEntityId === task.id).length
    const missingCount = Math.max(task.documentCount - attachedCount, 0)

    if (missingCount > 0) {
      items.push({
        id: `missing-close-${task.id}`,
        title: task.name,
        description: `${task.ownerName} · ${task.phase.replace('_', ' ')}`,
        value: `${missingCount} missing`,
        href: '/work-queue',
        icon: 'Inbox',
        status: 'missing',
        statusTone: 'critical',
        meta: [formatShortDateTime(task.dueDate)],
      })
    }
  })

  journals
    .filter(entry => ['draft', 'pending'].includes(entry.status))
    .forEach(entry => {
      const attached = scopedWorkflowDocuments.some(document => document.relatedEntityId === entry.id)

      if (!attached) {
        items.push({
          id: `missing-journal-${entry.id}`,
          title: entry.number,
          description: entry.description,
          value: 'Support needed',
          href: '/general-ledger/journal-entries',
          icon: 'BookOpenText',
          status: 'missing',
          statusTone: 'critical',
          meta: [formatShortDate(entry.date)],
        })
      }
    })

  bills
    .filter(bill => bill.approvalStatus !== 'approved' || bill.status === 'draft')
    .forEach(bill => {
      const attached = scopedPayableDocuments.some(document => document.relatedEntityId === bill.id)

      if (!attached) {
        items.push({
          id: `missing-bill-${bill.id}`,
          title: bill.number,
          description: bill.vendorName,
          value: formatCurrency(bill.amount, bill.currency),
          href: '/accounts-payable/bills',
          icon: 'ReceiptText',
          status: 'missing',
          statusTone: 'critical' as const,
          meta: [formatShortDate(bill.dueDate)],
        })
      }
    })

  invoices
    .filter(invoice => invoice.openBalance > 0)
    .forEach(invoice => {
      const attached = scopedReceivableDocuments.some(document => document.relatedEntityId === invoice.id)

      if (!attached) {
        items.push({
          id: `missing-invoice-${invoice.id}`,
          title: invoice.number,
          description: invoice.customerName,
          value: formatCurrency(invoice.openBalance, invoice.currency),
          href: '/accounts-receivable/invoices',
          icon: 'WalletCards',
          status: 'missing',
          statusTone: 'critical' as const,
          meta: [formatShortDate(invoice.dueDate)],
        })
      }
    })

  return uniqueById(items)
}

function buildExceptionItems(
  closeTasks: CloseTask[],
  reconExceptions: ReconciliationItem[],
  approvals: ApprovalItem[],
  tasks: Task[],
) {
  const items: RoleHomepageWidgetItem[] = [
    ...closeTasks
      .filter(task => task.status === 'blocked')
      .map(task => ({
        id: `blocked-${task.id}`,
        title: task.name,
        description: task.blockerReason ?? `${task.ownerName} is waiting on a dependency.`,
        value: task.phase.replace('_', ' '),
        href: '/work-queue',
        icon: 'Inbox',
        status: 'blocked',
        statusTone: 'critical' as const,
        meta: [formatShortDateTime(task.dueDate)],
      })),
    ...reconExceptions.map(item => ({
      id: `recon-${item.id}`,
      title: item.description,
      description: item.reference ?? 'Reconciliation exception',
      value: formatCurrency(Math.abs(item.difference)),
      href: '/cash-management/reconciliation',
      icon: 'ArrowLeftRight',
      status: item.status,
      statusTone: 'critical' as const,
      meta: [formatShortDate(item.date)],
    })),
    ...approvals
      .filter(item => item.status === 'pending')
      .map(item => ({
        id: `approval-${item.id}`,
        title: item.documentNumber,
        description: item.description,
        value: formatCurrency(item.amount, item.currency),
        href: '/approvals',
        icon: 'BadgeCheck',
        status: 'pending',
        statusTone: 'warning' as const,
        meta: [formatShortDateTime(item.requestedAt)],
      })),
    ...tasks
      .filter(task => task.priority === 'high' && task.status !== 'completed')
      .map(task => ({
        id: `task-${task.id}`,
        title: task.title,
        description: task.description,
        value: task.assigneeName,
        href: '/tasks',
        icon: 'CheckSquare',
        status: task.status,
        statusTone: statusToneFromValue(task.status),
        meta: task.dueDate ? [formatShortDateTime(task.dueDate)] : undefined,
      })),
  ]

  return uniqueById(items)
}

async function getAccountantHomepageData(filters: FinanceFilters): Promise<RoleHomepageData> {
  const [roleHomeConfig, closeTasks, closeStatus, reconciliationData, journalEntries, transactionResponse, billResponse, invoiceResponse, approvals, workQueueViews, taskResponse] =
    await Promise.all([
      getRoleHomeConfig('accountant'),
      getCloseTasks(filters),
      getCloseStatus(filters),
      getReconciliationData(filters),
      getJournalEntries(filters, undefined, ['draft', 'pending'], { key: 'date', direction: 'desc' }, 1, 20),
      getTransactions(filters, undefined, undefined, undefined, { key: 'date', direction: 'desc' }, 1, 40),
      getBills(filters, undefined, undefined, { key: 'dueDate', direction: 'asc' }, 1, 20),
      getInvoices(filters, undefined, undefined, { key: 'dueDate', direction: 'asc' }, 1, 20),
      getApprovalItems(filters, 'pending', 1, 20),
      getSavedViews('work-queue'),
      getTasks(undefined, ['todo', 'in_progress'], undefined, undefined, { key: 'dueDate', direction: 'asc' }, 1, 20),
    ])

  if (!roleHomeConfig) {
    throw new Error('Missing accountant role home config')
  }

  const today = new Date()
  const tasksDueToday = closeTasks
    .filter(task => task.status !== 'completed' && isSameDay(task.dueDate, today))
    .sort((left, right) => left.dueDate.getTime() - right.dueDate.getTime())

  const unreconciledTransactions = transactionResponse.data
    .filter(transaction => ['unmatched', 'exception'].includes(transaction.reconciliationStatus ?? ''))
    .slice(0, 6)

  const draftJournals = journalEntries.data.slice(0, 6)
  const missingDocuments = buildMissingDocumentItems(filters, closeTasks, journalEntries.data, billResponse.data, invoiceResponse.data).slice(0, 6)
  const scopedApprovals = approvals.data.filter(item => isInDateRange(item.requestedAt, filters.dateRange))
  const scopedTasks = taskResponse.data.filter(task => !task.dueDate || isInDateRange(task.dueDate, filters.dateRange))
  const exceptionItems = buildExceptionItems(closeTasks, reconciliationData.exceptions, scopedApprovals, scopedTasks).slice(0, 6)

  const summaryMetrics: RoleHomepageMetric[] = [
    buildRoleHeaderMetric('due-today', 'Tasks Due Today', formatNumber(tasksDueToday.length), 'Close-critical work due in the current day.', tasksDueToday.length > 0 ? 'warning' : 'positive'),
    buildRoleHeaderMetric('unreconciled', 'Unreconciled Transactions', formatNumber(unreconciledTransactions.length), 'Bank activity still needing matching.', unreconciledTransactions.length > 0 ? 'critical' : 'positive'),
    buildRoleHeaderMetric('draft-journals', 'Draft Journals', formatNumber(draftJournals.length), 'Entries waiting on review or posting.', draftJournals.length > 0 ? 'warning' : 'neutral'),
    buildRoleHeaderMetric('missing-docs', 'Missing Documents', formatNumber(missingDocuments.length), 'Supporting evidence gaps across close work.', missingDocuments.length > 0 ? 'critical' : 'positive'),
    buildRoleHeaderMetric('close-progress', 'Close Progress', `${closeStatus.progressPercent}%`, closeStatus.currentPeriodLabel, closeStatus.progressPercent >= 80 ? 'positive' : 'warning'),
  ]

  const primaryActions = toPrimaryActions(roleHomeConfig, [
    {
      id: 'qa-accountant-exceptions',
      label: 'Review Exceptions',
      href: '/cash-management/reconciliation',
      description: 'Focus on unmatched and adjusted reconciliation activity.',
      icon: 'ArrowLeftRight',
      tone: 'warning',
    },
    {
      id: 'qa-accountant-saved-view',
      label: 'Month-End Exceptions',
      href: '/work-queue',
      description: 'Open the default saved queue view for close exceptions.',
      icon: 'Star',
      tone: 'neutral',
    },
  ])

  const sections = [
    toSection('accountant-queue', 'full', [
      {
        id: 'tasks-due-today',
        title: 'Tasks Due Today',
        description: 'Assigned close activity due before end of day for the selected scope.',
        kind: 'list',
        emptyMessage: 'No close tasks are due today for the current scope.',
        footerLink: {
          id: 'footer-work-queue',
          label: 'Open Work Queue',
          href: '/work-queue',
          description: 'Review the full accountant queue.',
          icon: 'Inbox',
        },
        items: tasksDueToday.map(task => ({
          id: task.id,
          title: task.name,
          description: `${task.ownerName} · ${task.phase.replace('_', ' ')}`,
          value: `${task.documentCount} docs · ${task.exceptionCount} exceptions`,
          href: '/work-queue',
          icon: 'Inbox',
          status: task.status,
          statusTone: statusToneFromValue(task.status),
          meta: [formatShortDateTime(task.dueDate)],
        })),
      },
    ]),
    toSection('accountant-operate', 'main', [
      {
        id: 'unreconciled-transactions',
        title: 'Unreconciled Transactions',
        description: 'Bank-feed and cash activity still waiting for matching or adjustment.',
        kind: 'list',
        emptyMessage: 'No unreconciled transactions in the selected window.',
        footerLink: {
          id: 'footer-reconciliation',
          label: 'Open Reconciliation',
          href: '/cash-management/reconciliation',
          description: 'Resolve unmatched and adjusted items.',
          icon: 'ArrowLeftRight',
        },
        items: unreconciledTransactions.map(transaction => ({
          id: transaction.id,
          title: transaction.description,
          description: transaction.reference ?? transaction.accountName,
          value: formatCurrency(transaction.amount, transaction.currency),
          secondaryValue: transaction.entityName,
          href: '/cash-management/reconciliation',
          icon: 'Landmark',
          status: transaction.reconciliationStatus,
          statusTone: statusToneFromValue(transaction.reconciliationStatus ?? 'exception'),
          meta: [formatShortDate(transaction.date), transaction.departmentName ?? 'Unassigned'],
        })),
      },
      {
        id: 'draft-journal-entries',
        title: 'Draft Journals',
        description: 'Entries requiring support, approval, or posting before statements are ready.',
        kind: 'list',
        emptyMessage: 'No draft or pending journal entries in the selected window.',
        footerLink: {
          id: 'footer-journals',
          label: 'Open Journal Entries',
          href: '/general-ledger/journal-entries',
          description: 'Review draft and pending journals.',
          icon: 'BookOpenText',
        },
        items: draftJournals.map(entry => ({
          id: entry.id,
          title: entry.number,
          description: entry.description,
          value: formatCurrency(entry.lines.reduce((sum, line) => sum + line.debit, 0)),
          secondaryValue: entry.createdBy,
          href: '/general-ledger/journal-entries',
          icon: 'BookOpenText',
          status: entry.status,
          statusTone: statusToneFromValue(entry.status),
          meta: [formatShortDate(entry.date), `${entry.lines.length} lines`],
        })),
      },
    ]),
    toSection('accountant-exceptions', 'full', [
      {
        id: 'missing-documents',
        title: 'Missing Documents',
        description: 'Source packets and support that are still missing for current-period work.',
        kind: 'list',
        emptyMessage: 'No document gaps were found for the current selection.',
        footerLink: {
          id: 'footer-approvals',
          label: 'Review AP / AR Queues',
          href: '/work-queue',
          description: 'Open the queue for follow-up.',
          icon: 'Inbox',
        },
        items: missingDocuments,
      },
      {
        id: 'exception-center',
        title: 'Exceptions',
        description: 'Blocked close items, pending approvals, and reconciliation breaks needing attention.',
        kind: 'list',
        emptyMessage: 'No high-priority exceptions are open for the current scope.',
        footerLink: {
          id: 'footer-exceptions',
          label: 'Open Exception Context',
          href: '/work-queue',
          description: 'Investigate outstanding blockers and exceptions.',
          icon: 'Inbox',
        },
        items: exceptionItems,
      },
    ]),
    toSection('accountant-rail', 'rail', [
      {
        id: 'close-progress',
        title: 'Close Progress',
        description: closeStatus.currentPeriodLabel,
        kind: 'progress',
        metrics: [
          buildRoleHeaderMetric('close-progress-value', 'Progress', `${closeStatus.progressPercent}%`, undefined, closeStatus.progressPercent >= 80 ? 'positive' : 'warning'),
          buildRoleHeaderMetric('close-blocked', 'Blocked', formatNumber(closeStatus.blockedTasks), undefined, closeStatus.blockedTasks > 0 ? 'critical' : 'positive'),
          buildRoleHeaderMetric('close-overdue', 'Overdue', formatNumber(closeStatus.overdueTasks), undefined, closeStatus.overdueTasks > 0 ? 'warning' : 'positive'),
        ],
        items: closeStatus.phaseBreakdown.map(phase => ({
          id: phase.phase,
          title: phase.phase.replace('_', ' '),
          description: `${phase.completed} of ${phase.total} completed`,
          value: phase.total === 0 ? '0%' : `${Math.round((phase.completed / phase.total) * 100)}%`,
          status: phase.completed === phase.total && phase.total > 0 ? 'ready' : 'in_progress',
          statusTone: phase.completed === phase.total && phase.total > 0 ? 'positive' : 'warning',
        })),
      },
      {
        id: 'saved-views',
        title: 'Saved Views',
        description: 'Operator shortcuts for month-end queue work.',
        kind: 'actions',
        actions: toSavedViewActions(workQueueViews, '/work-queue'),
        emptyMessage: 'No saved work-queue views yet.',
      },
    ]),
  ]

  return {
    roleId: 'accountant',
    roleLabel: 'Accountant',
    title: roleHomeConfig.title,
    subtitle: roleHomeConfig.subtitle,
    accentLabel: accentDescriptions.accountant,
    summaryMetrics,
    primaryActions,
    sections,
    refreshedAt: new Date(),
  }
}

async function getAPSpecialistHomepageData(filters: FinanceFilters): Promise<RoleHomepageData> {
  const [roleHomeConfig, billResponse, approvals] = await Promise.all([
    getRoleHomeConfig('ap_specialist'),
    getBills(filters, undefined, undefined, { key: 'dueDate', direction: 'asc' }, 1, 50),
    getApprovalItems(filters, 'pending', 1, 20),
  ])

  if (!roleHomeConfig) {
    throw new Error('Missing AP Specialist role home config')
  }

  const allBills = billResponse.data
  const scopedApprovals = approvals.data.filter(item => isInDateRange(item.requestedAt, filters.dateRange))
  const pendingBills = allBills.filter(bill => bill.status === 'pending' || bill.status === 'draft')
  const paymentReady = allBills.filter(bill => bill.approvalStatus === 'approved' && bill.paymentStatus === 'unpaid')
  const dueSoon = allBills.filter(bill => bill.paymentStatus !== 'paid' && bill.dueDate <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
  const vendorExceptions = pendingBills.filter(bill => bill.approvalStatus !== 'approved')

  return {
    roleId: 'ap_specialist',
    roleLabel: 'AP Specialist',
    title: roleHomeConfig.title,
    subtitle: roleHomeConfig.subtitle,
    accentLabel: accentDescriptions.ap_specialist,
    summaryMetrics: [
      buildRoleHeaderMetric('ap-pending-bills', 'Pending Bills', formatNumber(pendingBills.length), formatCurrency(pendingBills.reduce((sum, bill) => sum + bill.amount, 0)), pendingBills.length > 0 ? 'warning' : 'positive'),
      buildRoleHeaderMetric('ap-approvals', 'Approvals Waiting', formatNumber(scopedApprovals.length), 'Bills waiting for approval routing.', scopedApprovals.length > 0 ? 'warning' : 'positive'),
      buildRoleHeaderMetric('ap-payment-ready', 'Payment Ready', formatCurrency(paymentReady.reduce((sum, bill) => sum + bill.amount, 0)), `${paymentReady.length} bills approved for release`, 'neutral'),
      buildRoleHeaderMetric('ap-due-soon', 'Due In 7 Days', formatCurrency(dueSoon.reduce((sum, bill) => sum + bill.amount, 0)), `${dueSoon.length} obligations approaching due date`, dueSoon.length > 0 ? 'critical' : 'positive'),
    ],
    primaryActions: toPrimaryActions(roleHomeConfig, [
      {
        id: 'qa-ap-payments',
        label: 'Payment Readiness',
        href: '/accounts-payable/payments',
        description: 'Review approved bills and release timing.',
        icon: 'Landmark',
        tone: 'accent',
      },
    ]),
    sections: [
      toSection('ap-main', 'main', [
        {
          id: 'ap-pending-bills',
          title: 'Pending Bills',
          description: 'Draft and submitted bills that still need coding, support, or approval.',
          kind: 'list',
          emptyMessage: 'No pending AP workload in the current scope.',
          footerLink: {
            id: 'footer-ap-bills',
            label: 'Open Bills',
            href: '/accounts-payable/bills',
            icon: 'ReceiptText',
          },
          items: pendingBills.slice(0, 6).map(bill => ({
            id: bill.id,
            title: bill.number,
            description: bill.vendorName,
            value: formatCurrency(bill.amount, bill.currency),
            href: '/accounts-payable/bills',
            icon: 'ReceiptText',
            status: bill.approvalStatus,
            statusTone: statusToneFromValue(bill.approvalStatus),
            meta: [formatShortDate(bill.dueDate), bill.departmentName ?? 'Unassigned'],
          })),
        },
        {
          id: 'ap-approval-queue',
          title: 'Approval Queue',
          description: 'Bills currently waiting on approvers before payment release.',
          kind: 'list',
          emptyMessage: 'No AP approvals are waiting right now.',
          footerLink: {
            id: 'footer-ap-approvals',
            label: 'Open Approvals',
            href: '/accounts-payable/approvals',
            icon: 'BadgeCheck',
          },
          items: scopedApprovals.slice(0, 6).map(item => ({
            id: item.id,
            title: item.documentNumber,
            description: item.description,
            value: formatCurrency(item.amount, item.currency),
            href: '/accounts-payable/approvals',
            icon: 'BadgeCheck',
            status: item.priority ?? item.status,
            statusTone: statusToneFromValue(item.status),
            meta: [formatShortDateTime(item.requestedAt)],
          })),
        },
      ]),
      toSection('ap-rail', 'rail', [
        {
          id: 'ap-payment-readiness',
          title: 'Payment Readiness',
          description: 'Approved bills that can move into the next payment run.',
          kind: 'list',
          emptyMessage: 'Nothing is staged for payment release.',
          items: paymentReady.slice(0, 5).map(bill => ({
            id: bill.id,
            title: bill.number,
            description: bill.vendorName,
            value: formatCurrency(bill.amount, bill.currency),
            href: '/accounts-payable/payments',
            icon: 'Landmark',
            status: bill.paymentStatus,
            statusTone: statusToneFromValue(bill.paymentStatus),
            meta: [formatShortDate(bill.dueDate)],
          })),
        },
        {
          id: 'ap-vendor-exceptions',
          title: 'Vendor Exceptions',
          description: 'Bills needing follow-up because coding or approval is incomplete.',
          kind: 'list',
          emptyMessage: 'No vendor-side exceptions are open.',
          items: vendorExceptions.slice(0, 5).map(bill => ({
            id: bill.id,
            title: bill.vendorName,
            description: bill.description,
            value: bill.number,
            href: '/accounts-payable/vendors',
            icon: 'ReceiptText',
            status: bill.approvalStatus,
            statusTone: statusToneFromValue(bill.approvalStatus),
            meta: [formatShortDate(bill.date)],
          })),
        },
      ]),
    ],
    refreshedAt: new Date(),
  }
}

async function getARSpecialistHomepageData(filters: FinanceFilters): Promise<RoleHomepageData> {
  const [roleHomeConfig, invoiceResponse, transactionResponse] = await Promise.all([
    getRoleHomeConfig('ar_specialist'),
    getInvoices(filters, undefined, undefined, { key: 'dueDate', direction: 'asc' }, 1, 50),
    getTransactions(filters, undefined, ['receipt'], undefined, { key: 'date', direction: 'desc' }, 1, 20),
  ])

  if (!roleHomeConfig) {
    throw new Error('Missing AR Specialist role home config')
  }

  const allInvoices = invoiceResponse.data
  const overdueInvoices = allInvoices.filter(invoice => invoice.status === 'overdue' || invoice.collectionStatus === 'in_collections')
  const collectionCustomerIds = new Set(
    allInvoices
      .filter(invoice => invoice.collectionStatus !== 'none' || invoice.status === 'overdue')
      .map(invoice => invoice.customerId)
  )
  const collectionCustomers = customers.filter(customer => collectionCustomerIds.has(customer.id))
  const receiptBacklog = transactionResponse.data.filter(transaction => transaction.reconciliationStatus !== 'reconciled')
  const invoiceWorkload = allInvoices.filter(invoice => invoice.status === 'sent' || invoice.status === 'overdue')

  return {
    roleId: 'ar_specialist',
    roleLabel: 'AR Specialist',
    title: roleHomeConfig.title,
    subtitle: roleHomeConfig.subtitle,
    accentLabel: accentDescriptions.ar_specialist,
    summaryMetrics: [
      buildRoleHeaderMetric('ar-overdue', 'Overdue Invoices', formatCurrency(overdueInvoices.reduce((sum, invoice) => sum + invoice.openBalance, 0)), `${overdueInvoices.length} invoices require collection follow-up`, overdueInvoices.length > 0 ? 'critical' : 'positive'),
      buildRoleHeaderMetric('ar-open-workload', 'Open Invoice Workload', formatNumber(invoiceWorkload.length), 'Invoices still open or recently sent.', invoiceWorkload.length > 0 ? 'warning' : 'positive'),
      buildRoleHeaderMetric('ar-receipts', 'Receipt Backlog', formatNumber(receiptBacklog.length), 'Cash receipts still needing application or recon.', receiptBacklog.length > 0 ? 'warning' : 'positive'),
      buildRoleHeaderMetric('ar-collections', 'Collections Priority', formatNumber(collectionCustomers.length), 'Customers flagged for collector attention.', collectionCustomers.length > 0 ? 'critical' : 'neutral'),
    ],
    primaryActions: toPrimaryActions(roleHomeConfig, [
      {
        id: 'qa-ar-collections',
        label: 'Collections Queue',
        href: '/accounts-receivable/collections',
        description: 'Focus on overdue and in-collections invoices.',
        icon: 'PhoneCall',
        tone: 'accent',
      },
    ]),
    sections: [
      toSection('ar-main', 'main', [
        {
          id: 'ar-overdue-invoices',
          title: 'Overdue Invoices',
          description: 'Customer balances that should be prioritized for collection outreach.',
          kind: 'list',
          emptyMessage: 'No overdue invoices in the current scope.',
          footerLink: {
            id: 'footer-ar-collections',
            label: 'Open Collections',
            href: '/accounts-receivable/collections',
            icon: 'PhoneCall',
          },
          items: overdueInvoices.slice(0, 6).map(invoice => ({
            id: invoice.id,
            title: invoice.number,
            description: invoice.customerName,
            value: formatCurrency(invoice.openBalance, invoice.currency),
            href: '/accounts-receivable/invoices',
            icon: 'WalletCards',
            status: invoice.collectionStatus === 'none' ? invoice.status : invoice.collectionStatus,
            statusTone: statusToneFromValue(invoice.collectionStatus === 'none' ? invoice.status : invoice.collectionStatus),
            meta: [formatShortDate(invoice.dueDate)],
          })),
        },
        {
          id: 'ar-collection-priorities',
          title: 'Collection Priorities',
          description: 'Customers flagged for proactive outreach based on history and current exposure.',
          kind: 'list',
          emptyMessage: 'No collection-priority customers for the current scope.',
          items: collectionCustomers.slice(0, 5).map(customer => ({
            id: customer.id,
            title: customer.name,
            description: customer.collectionNotes ?? customer.paymentTerms,
            value: formatCurrency(customer.balance, customer.currency),
            href: '/accounts-receivable/customers',
            icon: 'Users',
            status: customer.collectionPriority ?? customer.status,
            statusTone: customer.collectionPriority === 'high' ? 'critical' : customer.collectionPriority === 'medium' ? 'warning' : statusToneFromValue(customer.status),
            meta: [customer.assignedCollector ?? 'Unassigned collector'],
          })),
        },
      ]),
      toSection('ar-rail', 'rail', [
        {
          id: 'ar-receipt-backlog',
          title: 'Receipt Application',
          description: 'Receipts that still need matching or follow-up.',
          kind: 'list',
          emptyMessage: 'All receipt activity is currently matched.',
          items: receiptBacklog.slice(0, 5).map(transaction => ({
            id: transaction.id,
            title: transaction.description,
            description: transaction.reference ?? transaction.accountName,
            value: formatCurrency(transaction.amount, transaction.currency),
            href: '/accounts-receivable/receipts',
            icon: 'Landmark',
            status: transaction.reconciliationStatus ?? 'pending',
            statusTone: statusToneFromValue(transaction.reconciliationStatus ?? 'pending'),
            meta: [formatShortDate(transaction.date)],
          })),
        },
        {
          id: 'ar-invoice-workload',
          title: 'Invoice Workload',
          description: 'Recently issued invoices still carrying open exposure.',
          kind: 'list',
          emptyMessage: 'No open invoice workload right now.',
          items: invoiceWorkload.slice(0, 5).map(invoice => ({
            id: invoice.id,
            title: invoice.number,
            description: invoice.customerName,
            value: formatCurrency(invoice.openBalance, invoice.currency),
            href: '/accounts-receivable/invoices',
            icon: 'WalletCards',
            status: invoice.status,
            statusTone: statusToneFromValue(invoice.status),
            meta: [formatShortDate(invoice.date)],
          })),
        },
      ]),
    ],
    refreshedAt: new Date(),
  }
}

async function getControllerHomepageData(filters: FinanceFilters): Promise<RoleHomepageData> {
  const [roleHomeConfig, closeStatus, closeTasks, trialBalance, reconciliationData, pendingJournals, approvals] = await Promise.all([
    getRoleHomeConfig('controller'),
    getCloseStatus(filters),
    getCloseTasks(filters),
    getTrialBalance(filters),
    getReconciliationData(filters),
    getJournalEntries(filters, undefined, ['draft', 'pending'], { key: 'date', direction: 'desc' }, 1, 20),
    getApprovalItems(filters, 'pending', 1, 20),
  ])

  if (!roleHomeConfig) {
    throw new Error('Missing controller role home config')
  }

  const blockedTasks = closeTasks.filter(task => task.status === 'blocked')
  const watchlistRows = [...trialBalance]
    .sort((left, right) => Math.max(right.periodDebit, right.periodCredit) - Math.max(left.periodDebit, left.periodCredit))
    .slice(0, 6)

  return {
    roleId: 'controller',
    roleLabel: 'Controller',
    title: roleHomeConfig.title,
    subtitle: roleHomeConfig.subtitle,
    accentLabel: accentDescriptions.controller,
    summaryMetrics: [
      buildRoleHeaderMetric('controller-close-progress', 'Close Progress', `${closeStatus.progressPercent}%`, closeStatus.currentPeriodLabel, closeStatus.progressPercent >= 80 ? 'positive' : 'warning'),
      buildRoleHeaderMetric('controller-blocked', 'Blocked Tasks', formatNumber(blockedTasks.length), 'Tasks currently blocked by dependencies or missing support.', blockedTasks.length > 0 ? 'critical' : 'positive'),
      buildRoleHeaderMetric('controller-recon-issues', 'Recon Issues', formatNumber(reconciliationData.exceptions.length), 'Exceptions still unresolved in reconciliation.', reconciliationData.exceptions.length > 0 ? 'critical' : 'positive'),
      buildRoleHeaderMetric('controller-pending-journals', 'Pending Journals', formatNumber(pendingJournals.total), 'Journal entries still awaiting approval or posting.', pendingJournals.total > 0 ? 'warning' : 'positive'),
    ],
    primaryActions: toPrimaryActions(roleHomeConfig, [
      {
        id: 'qa-controller-reports',
        label: 'Report Library',
        href: '/reports',
        description: 'Open reporting context for close sign-off.',
        icon: 'LineChart',
        tone: 'accent',
      },
    ]),
    sections: [
      toSection('controller-main', 'main', [
        {
          id: 'controller-close-blockers',
          title: 'Close Blockers',
          description: 'Tasks and approvals preventing clean close completion.',
          kind: 'list',
          emptyMessage: 'No close blockers are open in the selected scope.',
          items: blockedTasks.slice(0, 6).map(task => ({
            id: task.id,
            title: task.name,
            description: task.blockerReason ?? task.ownerName,
            value: task.phase.replace('_', ' '),
            href: '/work-queue',
            icon: 'Inbox',
            status: task.status,
            statusTone: 'critical',
            meta: [formatShortDateTime(task.dueDate)],
          })),
        },
        {
          id: 'controller-trial-balance',
          title: 'Trial Balance Watchlist',
          description: 'Accounts with the largest current-period movement or review sensitivity.',
          kind: 'list',
          emptyMessage: 'No trial-balance watchlist items were generated.',
          footerLink: {
            id: 'footer-controller-trial-balance',
            label: 'Open Trial Balance',
            href: '/general-ledger/reports/trial-balance',
            icon: 'Scale',
          },
          items: watchlistRows.map(row => ({
            id: row.accountId,
            title: `${row.accountNumber} ${row.accountName}`,
            description: row.accountType,
            value: formatCurrency(Math.max(row.periodDebit, row.periodCredit)),
            href: '/general-ledger/reports/trial-balance',
            icon: 'Scale',
            status: 'review',
            statusTone: 'warning',
            meta: [`Closing ${formatCurrency(Math.max(row.closingDebit, row.closingCredit))}`],
          })),
        },
      ]),
      toSection('controller-rail', 'rail', [
        {
          id: 'controller-reconciliation-issues',
          title: 'Reconciliation Issues',
          description: 'Outstanding unmatched and adjusted cash activity.',
          kind: 'list',
          emptyMessage: 'No reconciliation issues are open.',
          items: reconciliationData.exceptions.slice(0, 5).map(item => ({
            id: item.id,
            title: item.description,
            description: item.reference,
            value: formatCurrency(Math.abs(item.difference)),
            href: '/cash-management/reconciliation',
            icon: 'ArrowLeftRight',
            status: item.status,
            statusTone: 'critical',
            meta: [formatShortDate(item.date)],
          })),
        },
        {
          id: 'controller-report-readiness',
          title: 'Report Readiness',
          description: 'Operational checkpoints for statement issuance.',
          kind: 'list',
          emptyMessage: 'No readiness issues were found.',
          items: [
            {
              id: 'readiness-close',
              title: closeStatus.currentPeriodLabel,
              description: `${closeStatus.completedTasks} of ${closeStatus.totalTasks} tasks completed`,
              value: `${closeStatus.progressPercent}%`,
              href: '/reports',
              icon: 'LineChart',
              status: closeStatus.progressPercent >= 90 ? 'ready' : 'in_progress',
              statusTone: closeStatus.progressPercent >= 90 ? 'positive' : 'warning',
            },
            {
              id: 'readiness-pending-journals',
              title: 'Pending journals',
              description: 'Entries still waiting on posting or approval.',
              value: formatNumber(pendingJournals.total),
              href: '/general-ledger/journal-entries',
              icon: 'BookOpenText',
              status: pendingJournals.total === 0 ? 'ready' : 'pending',
              statusTone: pendingJournals.total === 0 ? 'positive' : 'warning',
            },
            {
              id: 'readiness-approvals',
              title: 'Pending approvals',
              description: 'Documents still waiting on finance sign-off.',
              value: formatNumber(approvals.total),
              href: '/approvals',
              icon: 'BadgeCheck',
              status: approvals.total === 0 ? 'ready' : 'pending',
              statusTone: approvals.total === 0 ? 'positive' : 'warning',
            },
          ],
        },
      ]),
    ],
    refreshedAt: new Date(),
  }
}

async function getCFOHomepageData(filters: FinanceFilters): Promise<RoleHomepageData> {
  const [roleHomeConfig, dashboardMetrics, pnl, cashFlow, budgetVsActual, consolidatedFinancials, entities] = await Promise.all([
    getRoleHomeConfig('cfo'),
    getDashboardMetrics(filters),
    getPnL(filters),
    getCashFlow(filters),
    getBudgetVsActual(filters),
    getConsolidatedFinancials(filters),
    getEntities(),
  ])

  if (!roleHomeConfig) {
    throw new Error('Missing CFO role home config')
  }

  const revenueVariance = budgetVsActual.find(item => item.category === 'Revenue')
  const entityPerformance = await Promise.all(
    consolidatedFinancials.entitiesIncluded.map(async entityId => {
      const metrics = await getDashboardMetrics({
        ...filters,
        entityId,
        entityIds: undefined,
      })

      const entity = entities.find(candidate => candidate.id === entityId)

      return {
        entityId,
        entityName: entity?.name ?? entityId,
        revenue: metrics.totalRevenue.value,
        netIncome: metrics.netIncome.value,
        cashBalance: metrics.cashBalance.value,
      }
    })
  )
  const eliminationAmount = consolidatedFinancials.eliminations.reduce((sum, adjustment) => sum + adjustment.amount, 0)
  const cfoInsights: RoleHomepageWidgetItem[] = [
    {
      id: 'cfo-insight-revenue',
      title: revenueVariance && revenueVariance.variancePercent < 0 ? 'Revenue pacing below plan' : 'Revenue pacing ahead of plan',
      description: revenueVariance
        ? `Revenue variance is ${formatPercent(revenueVariance.variancePercent)} for the selected scope.`
        : 'Revenue is tracking to current plan.',
      value: revenueVariance ? formatCurrency(revenueVariance.variance) : formatCurrency(0),
      href: '/reports/budget-vs-actual',
      icon: 'Sparkles',
      status: revenueVariance && revenueVariance.variancePercent < 0 ? 'warning' : 'positive',
      statusTone: revenueVariance && revenueVariance.variancePercent < 0 ? 'warning' : 'positive',
    },
    {
      id: 'cfo-insight-cash',
      title: cashFlow.netChangeInCash < 0 ? 'Liquidity trend requires review' : 'Cash generation is ahead of plan',
      description: `Net change in cash for the window is ${formatCurrency(cashFlow.netChangeInCash)}.`,
      value: formatCurrency(cashFlow.endingCash),
      href: '/reports/cash-flow',
      icon: 'Landmark',
      status: cashFlow.netChangeInCash < 0 ? 'warning' : 'positive',
      statusTone: cashFlow.netChangeInCash < 0 ? 'warning' : 'positive',
    },
    {
      id: 'cfo-insight-approvals',
      title: dashboardMetrics.pendingApprovals.value > 0 ? 'Approvals still blocking release' : 'Approval queue is clear',
      description: `${formatNumber(dashboardMetrics.pendingApprovals.value)} approvals remain pending in the current scope.`,
      value: formatCurrency(dashboardMetrics.apOutstanding.value),
      href: '/work-queue',
      icon: 'BadgeCheck',
      status: dashboardMetrics.pendingApprovals.value > 0 ? 'warning' : 'positive',
      statusTone: dashboardMetrics.pendingApprovals.value > 0 ? 'warning' : 'positive',
    },
    {
      id: 'cfo-insight-consolidation',
      title: 'Intercompany eliminations applied',
      description: `${consolidatedFinancials.entitiesIncluded.length} entities are included in this consolidated view.`,
      value: formatCurrency(eliminationAmount),
      href: '/reports',
      icon: 'Building2',
      status: 'active',
      statusTone: 'accent',
    },
  ]

  return {
    roleId: 'cfo',
    roleLabel: 'CFO',
    title: roleHomeConfig.title,
    subtitle: roleHomeConfig.subtitle,
    accentLabel: accentDescriptions.cfo,
    summaryMetrics: [
      buildMetricFromWidget(dashboardMetrics.totalRevenue),
      buildMetricFromWidget(dashboardMetrics.netIncome),
      buildMetricFromWidget(dashboardMetrics.cashBalance),
      buildMetricFromWidget(dashboardMetrics.budgetVariance),
    ],
    primaryActions: toPrimaryActions(roleHomeConfig, [
      {
        id: 'qa-cfo-balance-sheet',
        label: 'Balance Sheet',
        href: '/reports/balance-sheet',
        description: 'Review ending balances and capital structure.',
        icon: 'Scale',
        tone: 'neutral',
      },
      {
        id: 'qa-cfo-dashboards',
        label: 'Dashboards',
        href: '/dashboards',
        description: 'Open executive monitoring dashboards.',
        icon: 'PanelTop',
        tone: 'accent',
      },
    ]),
    sections: [
      toSection('cfo-charts', 'full', [
        {
          id: 'cfo-revenue-chart',
          title: 'Revenue vs Budget Trend',
          description: 'Monthly revenue performance against planned budget for the current fiscal period.',
          kind: 'chart',
          chart: {
            type: 'bar',
            data: budgetVsActual.slice(0, 6).map(item => ({
              name: item.category,
              value: item.actual,
              fill: item.variancePercent >= 0 ? 'hsl(var(--chart-1))' : 'hsl(var(--chart-3))',
            })),
            xAxisKey: 'name',
            showGrid: true,
            showLegend: false,
            height: 240,
          } satisfies RoleHomepageChartConfig,
          footerLink: {
            id: 'footer-cfo-budget-chart',
            label: 'Open Budget vs Actual Report',
            href: '/reports/budget-vs-actual',
            icon: 'Calculator',
          },
        },
        {
          id: 'cfo-cash-trend',
          title: 'Cash Flow Analysis',
          description: 'Operating, investing, and financing activities for the reporting window.',
          kind: 'chart',
          chart: {
            type: 'bar',
            data: [
              { name: 'Operating', value: cashFlow.operatingActivities.total, fill: cashFlow.operatingActivities.total >= 0 ? 'hsl(var(--chart-1))' : 'hsl(var(--destructive))' },
              { name: 'Investing', value: cashFlow.investingActivities.total, fill: cashFlow.investingActivities.total >= 0 ? 'hsl(var(--chart-2))' : 'hsl(var(--destructive))' },
              { name: 'Financing', value: cashFlow.financingActivities.total, fill: cashFlow.financingActivities.total >= 0 ? 'hsl(var(--chart-4))' : 'hsl(var(--destructive))' },
              { name: 'Net Change', value: cashFlow.netChangeInCash, fill: cashFlow.netChangeInCash >= 0 ? 'hsl(var(--chart-5))' : 'hsl(var(--destructive))' },
            ],
            xAxisKey: 'name',
            showGrid: true,
            showLegend: false,
            height: 240,
          } satisfies RoleHomepageChartConfig,
          footerLink: {
            id: 'footer-cfo-cash-chart',
            label: 'Open Cash Flow Statement',
            href: '/reports/cash-flow',
            icon: 'Landmark',
          },
        },
      ]),
      toSection('cfo-main', 'main', [
        {
          id: 'cfo-performance-trend',
          title: 'Performance Trend',
          description: 'Current versus prior-period profitability for the selected scope.',
          kind: 'list',
          emptyMessage: 'No performance trend data is available right now.',
          footerLink: {
            id: 'footer-cfo-income-statement',
            label: 'Open Income Statement',
            href: '/reports/income-statement',
            icon: 'LineChart',
          },
          items: [
            {
              id: 'trend-revenue',
              title: 'Revenue',
              description: `Prior ${formatCurrency(pnl.revenue.previousTotal)}`,
              value: formatCurrency(pnl.revenue.total),
              href: '/reports/income-statement',
              icon: 'LineChart',
              status: pnl.revenue.total >= pnl.revenue.previousTotal ? 'ahead' : 'watch',
              statusTone: pnl.revenue.total >= pnl.revenue.previousTotal ? ('positive' as const) : ('warning' as const),
            },
            {
              id: 'trend-gross-profit',
              title: 'Gross Profit',
              description: `Prior ${formatCurrency(pnl.previousGrossProfit)}`,
              value: formatCurrency(pnl.grossProfit),
              href: '/reports/income-statement',
              icon: 'LineChart',
              status: pnl.grossProfit >= pnl.previousGrossProfit ? 'ahead' : 'watch',
              statusTone: pnl.grossProfit >= pnl.previousGrossProfit ? ('positive' as const) : ('warning' as const),
            },
            {
              id: 'trend-operating-income',
              title: 'Operating Income',
              description: `Prior ${formatCurrency(pnl.previousOperatingIncome)}`,
              value: formatCurrency(pnl.operatingIncome),
              href: '/reports/income-statement',
              icon: 'LineChart',
              status: pnl.operatingIncome >= pnl.previousOperatingIncome ? 'ahead' : 'watch',
              statusTone: pnl.operatingIncome >= pnl.previousOperatingIncome ? ('positive' as const) : ('warning' as const),
            },
            {
              id: 'trend-net-income',
              title: 'Net Income',
              description: `Prior ${formatCurrency(pnl.previousNetIncome)}`,
              value: formatCurrency(pnl.netIncome),
              href: '/reports/income-statement',
              icon: 'LineChart',
              status: pnl.netIncome >= pnl.previousNetIncome ? 'ahead' : 'watch',
              statusTone: pnl.netIncome >= pnl.previousNetIncome ? ('positive' as const) : ('warning' as const),
            },
          ].map((item): RoleHomepageWidgetItem => ({
            ...item,
            href: '/reports/income-statement',
          })),
        },
        {
          id: 'cfo-budget-highlights',
          title: 'Budget vs Actual',
          description: 'Current plan variance highlights by category.',
          kind: 'list',
          emptyMessage: 'No budget data is available for the current scope.',
          footerLink: {
            id: 'footer-cfo-budget',
            label: 'Open Budget vs Actual',
            href: '/reports/budget-vs-actual',
            icon: 'Calculator',
          },
          items: budgetVsActual.slice(0, 5).map(item => ({
            id: `budget-${item.category}`,
            title: item.category,
            description: `Budget ${formatCurrency(item.budget)}`,
            value: formatCurrency(item.actual),
            href: '/reports/budget-vs-actual',
            icon: 'Calculator',
            status: `${item.variancePercent.toFixed(1)}%`,
            statusTone: toneFromDelta(-item.variancePercent),
            meta: [`Variance ${formatCurrency(item.variance)}`],
          })),
        },
      ]),
      toSection('cfo-rail', 'rail', [
        {
          id: 'cfo-cash-summary',
          title: 'Cash Summary',
          description: 'Liquidity, operating cash generation, and ending position.',
          kind: 'progress',
          metrics: [
            buildRoleHeaderMetric('cfo-ending-cash', 'Ending Cash', formatCurrency(cashFlow.endingCash), undefined, 'positive'),
            buildRoleHeaderMetric('cfo-operating-cash', 'Operating Cash', formatCurrency(cashFlow.operatingActivities.total), undefined, cashFlow.operatingActivities.total >= 0 ? 'positive' : 'critical'),
            buildRoleHeaderMetric('cfo-net-change', 'Net Change', formatCurrency(cashFlow.netChangeInCash), undefined, cashFlow.netChangeInCash >= 0 ? 'positive' : 'critical'),
          ],
          items: [
            {
              id: 'cfo-gross-profit',
              title: 'Gross Profit',
              description: 'Current-period gross profit',
              value: formatCurrency(pnl.grossProfit),
              status: pnl.grossProfit >= pnl.previousGrossProfit ? 'ahead' : 'watch',
              statusTone: pnl.grossProfit >= pnl.previousGrossProfit ? 'positive' : 'warning',
            },
            {
              id: 'cfo-revenue-variance',
              title: 'Revenue variance',
              description: 'Current plan variance',
              value: revenueVariance ? formatPercent(revenueVariance.variancePercent) : '0.0%',
              status: revenueVariance && revenueVariance.variancePercent >= 0 ? 'positive' : 'watch',
              statusTone: revenueVariance && revenueVariance.variancePercent >= 0 ? 'positive' : 'warning',
            },
          ],
        },
        {
          id: 'cfo-entity-performance',
          title: 'Consolidated View',
          description: 'Entity-level performance and elimination-adjusted context.',
          kind: 'list',
          items: entityPerformance.slice(0, 5).map(entity => ({
            id: entity.entityId,
            title: entity.entityName,
            description: `Net income ${formatCurrency(entity.netIncome)}`,
            value: formatCurrency(entity.revenue),
            href: '/reports',
            icon: 'Building2',
            status: 'active',
            statusTone: 'positive',
            meta: [`Cash ${formatCurrency(entity.cashBalance)}`],
          })),
          footerLink: {
            id: 'footer-cfo-consolidated',
            label: 'Open Reporting Library',
            href: '/reports',
            icon: 'LineChart',
          },
        },
      ]),
      toSection('cfo-ai', 'full', [
        {
          id: 'cfo-ai-insights',
          title: 'AI Insights',
          description: `Consolidated entities included: ${consolidatedFinancials.entitiesIncluded.join(', ')}`,
          kind: 'list',
          emptyMessage: 'No AI insights were generated for the current scope.',
          items: cfoInsights,
        },
      ]),
    ],
    refreshedAt: new Date(),
  }
}

async function getAdminHomepageData(filters: FinanceFilters): Promise<RoleHomepageData> {
  const [roleHomeConfig, users, integrations, workflows, apiKeys, auditLogs] = await Promise.all([
    getRoleHomeConfig('admin'),
    getUsers(undefined, undefined, undefined, undefined, 1, 50),
    getIntegrations(),
    getWorkflows(),
    getApiKeys(),
    getAuditLogs(undefined, undefined, filters.dateRange.startDate, filters.dateRange.endDate, 1, 10),
  ])

  if (!roleHomeConfig) {
    throw new Error('Missing admin role home config')
  }

  const activeUsers = users.data.filter(user => user.status === 'active')
  const pendingUsers = users.data.filter(user => user.status === 'pending')
  const unhealthyIntegrations = integrations.filter(integration => integration.status !== 'connected')
  const workflowIssues = workflows.filter(workflow => workflow.status !== 'active')

  return {
    roleId: 'admin',
    roleLabel: 'Admin',
    title: roleHomeConfig.title,
    subtitle: roleHomeConfig.subtitle,
    accentLabel: accentDescriptions.admin,
    summaryMetrics: [
      buildRoleHeaderMetric('admin-active-users', 'Active Users', formatNumber(activeUsers.length), `${pendingUsers.length} pending invitations`, 'positive'),
      buildRoleHeaderMetric('admin-integrations', 'Integration Issues', formatNumber(unhealthyIntegrations.length), 'Connections needing admin follow-up.', unhealthyIntegrations.length > 0 ? 'critical' : 'positive'),
      buildRoleHeaderMetric('admin-workflows', 'Workflow Issues', formatNumber(workflowIssues.length), 'Draft or inactive automations needing review.', workflowIssues.length > 0 ? 'warning' : 'positive'),
      buildRoleHeaderMetric('admin-api-keys', 'Active API Keys', formatNumber(apiKeys.filter(key => key.status === 'active').length), 'Developer access currently enabled.', 'neutral'),
    ],
    primaryActions: toPrimaryActions(roleHomeConfig, [
      {
        id: 'qa-admin-workflows',
        label: 'Manage Workflows',
        href: '/admin/workflows',
        description: 'Review routing, automation, and inactive flows.',
        icon: 'Workflow',
        tone: 'accent',
      },
      {
        id: 'qa-admin-api',
        label: 'API Keys',
        href: '/admin/api-keys',
        description: 'Inspect integration and developer credentials.',
        icon: 'Code2',
        tone: 'neutral',
      },
    ]),
    sections: [
      toSection('admin-main', 'main', [
        {
          id: 'admin-access',
          title: 'User Access',
          description: 'Pending or inactive users that need platform attention.',
          kind: 'list',
          emptyMessage: 'No access exceptions are waiting right now.',
          footerLink: {
            id: 'footer-admin-users',
            label: 'Open Users',
            href: '/admin/users',
            icon: 'Users',
          },
          items: users.data
            .filter(user => user.status !== 'active')
            .slice(0, 6)
            .map(user => ({
              id: user.id,
              title: user.displayName ?? `${user.firstName} ${user.lastName}`,
              description: user.email,
              value: user.role.replace('_', ' '),
              href: '/admin/users',
              icon: 'Users',
              status: user.status,
              statusTone: statusToneFromValue(user.status),
              meta: [formatShortDate(user.createdAt)],
            })),
        },
        {
          id: 'admin-integration-health',
          title: 'Integration Health',
          description: 'Connections that are disconnected, pending, or reporting errors.',
          kind: 'list',
          emptyMessage: 'All integrations are connected and healthy.',
          footerLink: {
            id: 'footer-admin-integrations',
            label: 'Open Integrations',
            href: '/integrations',
            icon: 'PlugZap',
          },
          items: unhealthyIntegrations.slice(0, 6).map(integration => ({
            id: integration.id,
            title: integration.name,
            description: integration.provider,
            value: integration.lastSyncAt ? formatShortDateTime(integration.lastSyncAt) : 'Never synced',
            href: '/integrations',
            icon: 'PlugZap',
            status: integration.status,
            statusTone: statusToneFromValue(integration.status),
          })),
        },
      ]),
      toSection('admin-rail', 'rail', [
        {
          id: 'admin-workflow-health',
          title: 'Workflow Governance',
          description: 'Draft or inactive automation that may affect approvals and controls.',
          kind: 'list',
          emptyMessage: 'All workflows are active.',
          items: workflowIssues.slice(0, 5).map(workflow => ({
            id: workflow.id,
            title: workflow.name,
            description: workflow.trigger,
            value: workflow.type,
            href: '/admin/workflows',
            icon: 'Workflow',
            status: workflow.status,
            statusTone: statusToneFromValue(workflow.status),
          })),
        },
        {
          id: 'admin-api-access',
          title: 'Developer Access',
          description: 'API keys and recent audit visibility for admin activity.',
          kind: 'list',
          items: [
            ...apiKeys.slice(0, 3).map(key => ({
              id: key.id,
              title: key.name,
              description: key.permissions.slice(0, 2).join(', '),
              value: key.lastUsedAt ? formatShortDateTime(key.lastUsedAt) : 'Unused',
              href: '/admin/api-keys',
              icon: 'Code2',
              status: key.status,
              statusTone: statusToneFromValue(key.status),
            })),
            ...auditLogs.data.slice(0, 2).map((log: AuditLogEntry) => ({
              id: log.id,
              title: `${log.action} ${log.entityType}`,
              description: `${log.userName} · ${log.entityNumber ?? log.entityId}`,
              value: formatShortDateTime(log.timestamp),
              href: '/admin/audit',
              icon: 'ShieldCheck',
              status: 'logged',
              statusTone: 'neutral' as const,
            })),
          ],
        },
      ]),
    ],
    refreshedAt: new Date(),
  }
}

export async function getRoleHomepageData(roleId: RoleId, filters: FinanceFilters): Promise<RoleHomepageData> {
  await ensureHomepageState()
  switch (toCanonicalRoleId(roleId)) {
    case 'accountant':
      return getAccountantHomepageData(filters)
    case 'ap_specialist':
      return getAPSpecialistHomepageData(filters)
    case 'ar_specialist':
      return getARSpecialistHomepageData(filters)
    case 'controller':
      return getControllerHomepageData(filters)
    case 'cfo':
      return getCFOHomepageData(filters)
    case 'admin':
      return getAdminHomepageData(filters)
    default:
      return getAccountantHomepageData(filters)
  }
}

export {
  getAccountantHomepageData,
  getAPSpecialistHomepageData,
  getARSpecialistHomepageData,
  getControllerHomepageData,
  getCFOHomepageData,
  getAdminHomepageData,
}
