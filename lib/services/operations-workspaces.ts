import type {
  Allocation,
  ExpenseEntry,
  FinanceFilters,
  ProjectDetail,
  RecurringJournal,
  SalesOrder,
  SortConfig,
  TimeEntry,
  WorkspaceAction,
  WorkspaceListResponse,
  WorkspaceMetricCard,
  WorkspaceTabItem,
} from '@/lib/types'
import { isInDateRange, matchesFinanceFilters, paginate, sortItems } from './base'
import {
  getAllocations,
  getExpenseEntries,
  getProjectDetails,
  getRecurringJournals,
  getSalesOrders,
  getTimeEntries,
} from './legacy'

interface TabbedWorkspaceListResponse<T> extends WorkspaceListResponse<T> {
  tabs: WorkspaceTabItem[]
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
    maximumFractionDigits: 1,
  }).format(value)
}

function buildResponse<T>({
  items,
  sort,
  page,
  pageSize,
  metrics,
  actions,
  emptyMessage,
}: {
  items: T[]
  sort: SortConfig
  page: number
  pageSize: number
  metrics: WorkspaceMetricCard[]
  actions: WorkspaceAction[]
  emptyMessage: string
}): WorkspaceListResponse<T> {
  const sorted = sortItems(items, sort)
  const paginated = paginate(sorted, page, pageSize)

  return {
    ...paginated,
    metrics,
    actions,
    filters: [],
    emptyMessage,
    defaultSort: sort,
  }
}

function buildTabs(statusCounts: Record<string, number>, order: Array<{ id: string; label: string }>): WorkspaceTabItem[] {
  return order.map(item => ({
    id: item.id,
    label: item.label,
    count:
      item.id === 'all'
        ? Object.values(statusCounts).reduce((sum, count) => sum + count, 0)
        : (statusCounts[item.id] ?? 0),
  }))
}

function matchesSearch(values: Array<string | undefined>, search?: string) {
  if (!search) {
    return true
  }

  const normalizedSearch = search.trim().toLowerCase()
  if (!normalizedSearch) {
    return true
  }

  return values.some(value => value?.toLowerCase().includes(normalizedSearch))
}

function withDateFallback<T>(items: T[], predicate: (item: T) => boolean) {
  const datedItems = items.filter(predicate)
  return datedItems.length > 0 ? datedItems : items
}

function overlapsRange(startDate: Date, endDate: Date | undefined, filters: FinanceFilters) {
  const rangeStart = filters.dateRange.startDate
  const rangeEnd = filters.dateRange.endDate
  const effectiveEnd = endDate ?? startDate

  return startDate <= rangeEnd && effectiveEnd >= rangeStart
}

export async function getOrderManagementWorkspace(
  filters: FinanceFilters,
  options?: {
    status?: string
    search?: string
    sort?: SortConfig
    page?: number
    pageSize?: number
  }
): Promise<TabbedWorkspaceListResponse<SalesOrder>> {
  const sort = options?.sort ?? { key: 'orderDate', direction: 'desc' }
  const page = options?.page ?? 1
  const pageSize = options?.pageSize ?? 20
  const status = options?.status ?? 'all'
  const response = await getSalesOrders(undefined, undefined, undefined, undefined, 1, 200)

  const entityScoped = response.data.filter(order =>
    matchesFinanceFilters({ entityId: order.entityId, customerId: order.customerId, status: order.status }, filters)
  )
  const scoped = withDateFallback(entityScoped, order => isInDateRange(order.orderDate, filters.dateRange))

  const statusCounts = scoped.reduce<Record<string, number>>((counts, order) => {
    counts[order.status] = (counts[order.status] ?? 0) + 1
    return counts
  }, {})

  const filtered = scoped.filter(order => {
    if (status !== 'all' && order.status !== status) {
      return false
    }

    return matchesSearch([order.number, order.customerName, order.createdBy], options?.search)
  })

  const metrics: WorkspaceMetricCard[] = [
    {
      id: 'orders-total',
      label: 'Orders In Scope',
      value: formatNumber(filtered.length),
      detail: `${formatNumber(scoped.length)} in selected entity and date range`,
    },
    {
      id: 'orders-to-ship',
      label: 'Ready To Ship',
      value: formatNumber(filtered.filter(order => ['confirmed', 'partially_shipped'].includes(order.status)).length),
      detail: 'Confirmed orders still in fulfillment.',
      tone: filtered.some(order => ['confirmed', 'partially_shipped'].includes(order.status)) ? 'warning' : 'positive',
    },
    {
      id: 'orders-invoiced',
      label: 'Invoiced',
      value: formatNumber(filtered.filter(order => order.status === 'invoiced').length),
      detail: 'Orders already converted to revenue documents.',
      tone: 'positive',
    },
    {
      id: 'orders-value',
      label: 'Current Value',
      value: formatCurrency(filtered.reduce((sum, order) => sum + order.total, 0)),
      detail: 'Total order value for the current view.',
    },
  ]

  const actions: WorkspaceAction[] = [
    { id: 'new-order', label: 'New Sales Order', href: '/order-management/orders/new', icon: 'Plus', tone: 'accent' },
    { id: 'open-invoices', label: 'Open Invoices', href: '/accounts-receivable/invoices', icon: 'WalletCards' },
    { id: 'open-customers', label: 'Customers', href: '/accounts-receivable/customers', icon: 'Users' },
  ]

  return {
    ...buildResponse({
      items: filtered,
      sort,
      page,
      pageSize,
      metrics,
      actions,
      emptyMessage: 'No sales orders match the current scope.',
    }),
    tabs: buildTabs(statusCounts, [
      { id: 'all', label: 'All' },
      { id: 'draft', label: 'Draft' },
      { id: 'pending_approval', label: 'Pending Approval' },
      { id: 'confirmed', label: 'Confirmed' },
      { id: 'shipped', label: 'Shipped' },
      { id: 'invoiced', label: 'Invoiced' },
    ]),
  }
}

export async function getProjectsWorkspace(
  filters: FinanceFilters,
  options?: {
    status?: string
    search?: string
    sort?: SortConfig
    page?: number
    pageSize?: number
  }
): Promise<TabbedWorkspaceListResponse<ProjectDetail>> {
  const sort = options?.sort ?? { key: 'startDate', direction: 'desc' }
  const page = options?.page ?? 1
  const pageSize = options?.pageSize ?? 20
  const status = options?.status ?? 'all'
  const response = await getProjectDetails(undefined, undefined, undefined, undefined, 1, 200)

  const entityScoped = response.data.filter(project => {
    if (
      !matchesFinanceFilters(
        {
          entityId: project.entityId,
          departmentId: project.departmentId,
          customerId: project.customerId,
          projectId: project.id,
          status: project.status,
        },
        filters
      )
    ) {
      return false
    }
    return true
  })
  const scoped = withDateFallback(entityScoped, project => overlapsRange(project.startDate, project.endDate, filters))

  const statusCounts = scoped.reduce<Record<string, number>>((counts, project) => {
    counts[project.status] = (counts[project.status] ?? 0) + 1
    return counts
  }, {})

  const filtered = scoped.filter(project => {
    if (status !== 'all' && project.status !== status) {
      return false
    }

    return matchesSearch([project.name, project.code, project.customerName, project.managerName], options?.search)
  })

  const averageMargin =
    filtered.length > 0 ? filtered.reduce((sum, project) => sum + project.profitMargin, 0) / filtered.length : 0

  const metrics: WorkspaceMetricCard[] = [
    {
      id: 'projects-total',
      label: 'Projects In Scope',
      value: formatNumber(filtered.length),
      detail: `${formatNumber(scoped.filter(project => project.status === 'active').length)} active in the selected window`,
    },
    {
      id: 'projects-budget',
      label: 'Budget',
      value: formatCurrency(filtered.reduce((sum, project) => sum + project.budget, 0)),
      detail: 'Total managed budget for the current view.',
    },
    {
      id: 'projects-revenue',
      label: 'Revenue',
      value: formatCurrency(filtered.reduce((sum, project) => sum + project.revenue, 0)),
      detail: 'Recognized and billable project revenue.',
      tone: 'positive',
    },
    {
      id: 'projects-margin',
      label: 'Avg Margin',
      value: `${averageMargin.toFixed(1)}%`,
      detail: 'Average gross margin across visible projects.',
      tone: averageMargin >= 20 ? 'positive' : averageMargin >= 10 ? 'warning' : 'critical',
    },
  ]

  const actions: WorkspaceAction[] = [
    { id: 'new-project', label: 'New Project', href: '/projects/new', icon: 'Plus', tone: 'accent' },
    { id: 'open-time-expenses', label: 'Time & Expenses', href: '/time-expenses', icon: 'Clock3' },
    { id: 'open-customers', label: 'Customers', href: '/accounts-receivable/customers', icon: 'Users' },
  ]

  return {
    ...buildResponse({
      items: filtered,
      sort,
      page,
      pageSize,
      metrics,
      actions,
      emptyMessage: 'No projects match the current scope.',
    }),
    tabs: buildTabs(statusCounts, [
      { id: 'all', label: 'All' },
      { id: 'planning', label: 'Planning' },
      { id: 'active', label: 'Active' },
      { id: 'on_hold', label: 'On Hold' },
      { id: 'completed', label: 'Completed' },
      { id: 'cancelled', label: 'Cancelled' },
    ]),
  }
}

export async function getTimeTrackingWorkspace(
  filters: FinanceFilters,
  options?: {
    search?: string
    sort?: SortConfig
    page?: number
    pageSize?: number
  }
): Promise<WorkspaceListResponse<TimeEntry>> {
  const sort = options?.sort ?? { key: 'date', direction: 'desc' }
  const page = options?.page ?? 1
  const pageSize = options?.pageSize ?? 20
  const response = await getTimeEntries(undefined, undefined, undefined, undefined, undefined, 1, 200)

  const entityScoped = response.data.filter(entry => {
    if (
      !matchesFinanceFilters(
        {
          entityId: entry.entityId,
          employeeId: entry.employeeId,
          projectId: entry.projectId,
          status: entry.status,
        },
        filters
      )
    ) {
      return false
    }
    return true
  })
  const dateScoped = withDateFallback(entityScoped, entry => isInDateRange(entry.date, filters.dateRange))
  const filtered = dateScoped.filter(entry =>
    matchesSearch([entry.employeeName, entry.projectName, entry.taskDescription, entry.notes], options?.search)
  )

  const totalHours = filtered.reduce((sum, entry) => sum + entry.hours, 0)
  const billableHours = filtered.filter(entry => entry.billable).reduce((sum, entry) => sum + entry.hours, 0)
  const billableAmount = filtered.filter(entry => entry.billable).reduce((sum, entry) => sum + entry.amount, 0)
  const pendingApproval = filtered.filter(entry => entry.status === 'submitted').length

  return buildResponse({
    items: filtered,
    sort,
    page,
    pageSize,
    metrics: [
      { id: 'time-total-hours', label: 'Total Hours', value: `${formatNumber(totalHours)}h`, detail: 'All time logged in the selected scope.' },
      { id: 'time-billable-hours', label: 'Billable Hours', value: `${formatNumber(billableHours)}h`, detail: 'Hours ready to flow into customer billing.' },
      { id: 'time-billable-amount', label: 'Billable Amount', value: formatCurrency(billableAmount), detail: 'Chargeable value from visible entries.' },
      {
        id: 'time-pending-approval',
        label: 'Pending Approval',
        value: formatNumber(pendingApproval),
        detail: 'Submitted time still waiting on approval.',
        tone: pendingApproval > 0 ? 'warning' : 'positive',
      },
    ],
    actions: [
      { id: 'log-time', label: 'Log Time', href: '/time-expenses/time/new', icon: 'Clock3', tone: 'accent' },
      { id: 'new-expense', label: 'New Expense', href: '/time-expenses/expenses/new', icon: 'ReceiptText' },
      { id: 'open-projects', label: 'Projects', href: '/projects', icon: 'FolderKanban' },
    ],
    emptyMessage: 'No time entries match the current scope.',
  })
}

export async function getExpenseWorkspace(
  filters: FinanceFilters,
  options?: {
    search?: string
    sort?: SortConfig
    page?: number
    pageSize?: number
  }
): Promise<WorkspaceListResponse<ExpenseEntry>> {
  const sort = options?.sort ?? { key: 'date', direction: 'desc' }
  const page = options?.page ?? 1
  const pageSize = options?.pageSize ?? 20
  const response = await getExpenseEntries(undefined, undefined, undefined, undefined, undefined, undefined, 1, 200)

  const entityScoped = response.data.filter(expense => {
    if (
      !matchesFinanceFilters(
        {
          entityId: expense.entityId,
          employeeId: expense.employeeId,
          projectId: expense.projectId,
          customerId: expense.customerId,
          status: expense.status,
        },
        filters
      )
    ) {
      return false
    }
    return true
  })
  const dateScoped = withDateFallback(entityScoped, expense => isInDateRange(expense.date, filters.dateRange))
  const filtered = dateScoped.filter(expense =>
    matchesSearch(
      [expense.employeeName, expense.category, expense.description, expense.projectName, expense.notes],
      options?.search
    )
  )

  const totalAmount = filtered.reduce((sum, expense) => sum + expense.amount, 0)
  const billableAmount = filtered.filter(expense => expense.billable).reduce((sum, expense) => sum + expense.amount, 0)
  const pendingApproval = filtered.filter(expense => expense.status === 'submitted').length
  const pendingReimbursement = filtered.filter(expense => expense.status === 'approved').length

  return buildResponse({
    items: filtered,
    sort,
    page,
    pageSize,
    metrics: [
      { id: 'expense-total', label: 'Total Expenses', value: formatCurrency(totalAmount), detail: 'All expenses in the current view.' },
      { id: 'expense-billable', label: 'Billable', value: formatCurrency(billableAmount), detail: 'Expenses that can be re-billed to customers.' },
      {
        id: 'expense-pending-approval',
        label: 'Pending Approval',
        value: formatNumber(pendingApproval),
        detail: 'Submitted expenses still waiting on review.',
        tone: pendingApproval > 0 ? 'warning' : 'positive',
      },
      {
        id: 'expense-to-reimburse',
        label: 'To Reimburse',
        value: formatNumber(pendingReimbursement),
        detail: 'Approved expenses awaiting reimbursement.',
        tone: pendingReimbursement > 0 ? 'warning' : 'neutral',
      },
    ],
    actions: [
      { id: 'new-expense', label: 'New Expense', href: '/time-expenses/expenses/new', icon: 'ReceiptText', tone: 'accent' },
      { id: 'log-time', label: 'Log Time', href: '/time-expenses/time/new', icon: 'Clock3' },
      { id: 'open-projects', label: 'Projects', href: '/projects', icon: 'FolderKanban' },
    ],
    emptyMessage: 'No expense reports match the current scope.',
  })
}

export async function getAllocationsWorkspaceList(
  filters: FinanceFilters,
  options?: {
    status?: string
    search?: string
    sort?: SortConfig
    page?: number
    pageSize?: number
  }
): Promise<TabbedWorkspaceListResponse<Allocation>> {
  const sort = options?.sort ?? { key: 'createdAt', direction: 'desc' }
  const page = options?.page ?? 1
  const pageSize = options?.pageSize ?? 20
  const status = options?.status ?? 'all'
  const response = await getAllocations()

  const entityScoped = response.filter(allocation => {
    if (!matchesFinanceFilters({ entityId: allocation.entityId, status: allocation.status }, filters)) {
      return false
    }

    const departmentScoped =
      !filters.departmentId && !(filters.departmentIds?.length)
        ? true
        : allocation.targets.some(target =>
            matchesFinanceFilters({ departmentId: target.departmentId }, filters)
          )

    if (!departmentScoped) {
      return false
    }
    return true
  })
  const scoped = withDateFallback(entityScoped, allocation =>
    allocation.lastRunDate
      ? isInDateRange(allocation.lastRunDate, filters.dateRange)
      : isInDateRange(allocation.createdAt, filters.dateRange)
  )

  const statusCounts = scoped.reduce<Record<string, number>>((counts, allocation) => {
    counts[allocation.status] = (counts[allocation.status] ?? 0) + 1
    return counts
  }, {})

  const filtered = scoped.filter(allocation => {
    if (status !== 'all' && allocation.status !== status) {
      return false
    }

    return matchesSearch(
      [allocation.name, allocation.description, allocation.sourceAccountName, allocation.basis],
      options?.search
    )
  })

  const metrics: WorkspaceMetricCard[] = [
    { id: 'alloc-total', label: 'Rules In Scope', value: formatNumber(filtered.length), detail: 'Allocation rules visible for the selected scope.' },
    {
      id: 'alloc-active',
      label: 'Active',
      value: formatNumber(filtered.filter(allocation => allocation.status === 'active').length),
      detail: 'Rules ready for scheduled or on-demand runs.',
      tone: 'positive',
    },
    {
      id: 'alloc-draft',
      label: 'Draft',
      value: formatNumber(filtered.filter(allocation => allocation.status === 'draft').length),
      detail: 'Rules still being configured or reviewed.',
      tone: filtered.some(allocation => allocation.status === 'draft') ? 'warning' : 'neutral',
    },
    {
      id: 'alloc-targets',
      label: 'Target Splits',
      value: formatNumber(filtered.reduce((sum, allocation) => sum + allocation.targets.length, 0)),
      detail: 'Distribution targets across visible rules.',
    },
  ]

  const actions: WorkspaceAction[] = [
    { id: 'new-allocation', label: 'New Allocation', href: '/general-ledger/allocations/new', icon: 'Plus', tone: 'accent' },
    { id: 'journal-entries', label: 'Journal Entries', href: '/general-ledger/journal-entries', icon: 'BookOpenText' },
    { id: 'trial-balance', label: 'Trial Balance', href: '/general-ledger/reports/trial-balance', icon: 'Scale' },
  ]

  return {
    ...buildResponse({
      items: filtered,
      sort,
      page,
      pageSize,
      metrics,
      actions,
      emptyMessage: 'No allocation rules match the current scope.',
    }),
    tabs: buildTabs(statusCounts, [
      { id: 'all', label: 'All' },
      { id: 'active', label: 'Active' },
      { id: 'draft', label: 'Draft' },
      { id: 'inactive', label: 'Inactive' },
    ]),
  }
}

export async function getRecurringJournalsWorkspaceList(
  filters: FinanceFilters,
  options?: {
    status?: string
    search?: string
    sort?: SortConfig
    page?: number
    pageSize?: number
  }
): Promise<TabbedWorkspaceListResponse<RecurringJournal>> {
  const sort = options?.sort ?? { key: 'nextRunDate', direction: 'asc' }
  const page = options?.page ?? 1
  const pageSize = options?.pageSize ?? 20
  const status = options?.status ?? 'all'
  const response = await getRecurringJournals()

  const entityScoped = response.filter(journal => {
    if (!matchesFinanceFilters({ entityId: journal.entityId, status: journal.status }, filters)) {
      return false
    }
    return true
  })
  const scoped = withDateFallback(entityScoped, journal => {
    const dateCandidates = [journal.nextRunDate, journal.lastRunDate, journal.startDate].filter(Boolean) as Date[]
    return dateCandidates.some(date => isInDateRange(date, filters.dateRange))
  })

  const statusCounts = scoped.reduce<Record<string, number>>((counts, journal) => {
    counts[journal.status] = (counts[journal.status] ?? 0) + 1
    return counts
  }, {})

  const filtered = scoped.filter(journal => {
    if (status !== 'all' && journal.status !== status) {
      return false
    }

    return matchesSearch([journal.name, journal.description, journal.createdBy], options?.search)
  })

  const totalAmount = filtered.reduce(
    (sum, journal) => sum + journal.templateLines.reduce((lineSum, line) => lineSum + line.debit, 0),
    0
  )

  const metrics: WorkspaceMetricCard[] = [
    { id: 'rj-total', label: 'Templates', value: formatNumber(filtered.length), detail: 'Recurring journal templates in scope.' },
    {
      id: 'rj-active',
      label: 'Active',
      value: formatNumber(filtered.filter(journal => journal.status === 'active').length),
      detail: 'Templates currently eligible for execution.',
      tone: 'positive',
    },
    {
      id: 'rj-runs',
      label: 'Total Runs',
      value: formatNumber(filtered.reduce((sum, journal) => sum + journal.runCount, 0)),
      detail: 'Execution count across visible templates.',
    },
    {
      id: 'rj-amount',
      label: 'Template Amount',
      value: formatCurrency(totalAmount),
      detail: 'Gross debit amount across visible schedules.',
    },
  ]

  const actions: WorkspaceAction[] = [
    { id: 'new-recurring-journal', label: 'New Recurring Journal', href: '/general-ledger/recurring-journals/new', icon: 'Plus', tone: 'accent' },
    { id: 'journal-entries', label: 'Journal Entries', href: '/general-ledger/journal-entries', icon: 'BookOpenText' },
    { id: 'periods', label: 'Periods', href: '/general-ledger/accounting-periods', icon: 'CalendarDays' },
  ]

  return {
    ...buildResponse({
      items: filtered,
      sort,
      page,
      pageSize,
      metrics,
      actions,
      emptyMessage: 'No recurring journals match the current scope.',
    }),
    tabs: buildTabs(statusCounts, [
      { id: 'all', label: 'All' },
      { id: 'active', label: 'Active' },
      { id: 'paused', label: 'Paused' },
      { id: 'expired', label: 'Expired' },
    ]),
  }
}
