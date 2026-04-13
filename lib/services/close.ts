import type {
  BankAccount,
  CashPositionData,
  CloseStatus,
  CloseTask,
  FinanceFilters,
  PaginatedResponse,
  ReconciliationData,
  ReconciliationItem,
  ReconciliationSummary,
  SortConfig,
  Transaction,
} from "@/lib/types"
import { delay, isInDateRange, matchesFinanceFilters, paginate, sortItems } from "./base"
import { getRuntimeDataset } from "./runtime-data"

let bankAccounts: BankAccount[] = []
let reconciliationItems: ReconciliationItem[] = []
let closeTasks: CloseTask[] = []
let transactions: Transaction[] = []

async function ensureCloseState() {
  const [accounting, workflow] = await Promise.all([
    getRuntimeDataset<{
      bankAccounts: BankAccount[]
      reconciliationItems: ReconciliationItem[]
      transactions: Transaction[]
    }>("accounting"),
    getRuntimeDataset<{ closeTasks: CloseTask[] }>("workflow"),
  ])

  bankAccounts = accounting.bankAccounts
  reconciliationItems = accounting.reconciliationItems
  transactions = accounting.transactions
  closeTasks = workflow.closeTasks
}

export async function getCloseTasks(filters: FinanceFilters): Promise<CloseTask[]> {
  await ensureCloseState()
  await delay()
  return closeTasks.filter(task => matchesFinanceFilters(task, filters) && isInDateRange(task.dueDate, filters.dateRange))
}

export async function getCloseStatus(filters: FinanceFilters): Promise<CloseStatus> {
  const tasks = await getCloseTasks(filters)
  const completedTasks = tasks.filter(task => task.status === 'completed')
  const blockedTasks = tasks.filter(task => task.status === 'blocked')
  const referenceDate = filters.dateRange.endDate
  const overdueTasks = tasks.filter(task => task.status !== 'completed' && task.dueDate < referenceDate)
  const progressPercent = tasks.length ? Math.round((completedTasks.length / tasks.length) * 100) : 0

  return {
    entityId: filters.entityId,
    totalTasks: tasks.length,
    completedTasks: completedTasks.length,
    blockedTasks: blockedTasks.length,
    overdueTasks: overdueTasks.length,
    progressPercent,
    currentPeriodLabel: `${filters.dateRange.endDate.toLocaleString('en-US', { month: 'long' })} ${filters.dateRange.endDate.getFullYear()} Close`,
    phaseBreakdown: (['pre_close', 'soft_close', 'hard_close', 'post_close'] as const).map(phase => {
      const phaseTasks = tasks.filter(task => task.phase === phase)
      return {
        phase,
        total: phaseTasks.length,
        completed: phaseTasks.filter(task => task.status === 'completed').length,
      }
    }),
    nextDueTask: [...tasks].sort((left, right) => left.dueDate.getTime() - right.dueDate.getTime())[0],
  }
}

export async function getCashPosition(filters: FinanceFilters): Promise<CashPositionData> {
  await ensureCloseState()
  await delay()

  const scopedAccounts = bankAccounts.filter(account => matchesFinanceFilters(account, filters))
  const scopedTransactions = transactions.filter(
    transaction => matchesFinanceFilters(transaction, filters) && isInDateRange(transaction.date, filters.dateRange)
  )

  const totalCash = scopedAccounts.reduce((sum, account) => sum + account.balance, 0)
  const availableCash = scopedAccounts.reduce((sum, account) => sum + (account.availableBalance ?? account.balance), 0)
  const pendingInflows = scopedTransactions
    .filter(transaction => transaction.status === "pending" && transaction.amount > 0)
    .reduce((sum, transaction) => sum + transaction.amount, 0)
  const pendingOutflows = Math.abs(
    scopedTransactions
      .filter(transaction => transaction.status === "pending" && transaction.amount < 0)
      .reduce((sum, transaction) => sum + transaction.amount, 0)
  )

  const transactionDates = [...new Set(scopedTransactions.map(transaction => transaction.date.toISOString().slice(0, 10)))]
    .sort()
    .slice(-7)

  let runningBalance = totalCash
  const dailyForecast = transactionDates.map(dateKey => {
    const dayTransactions = scopedTransactions.filter(transaction => transaction.date.toISOString().slice(0, 10) === dateKey)
    const inflows = dayTransactions.filter(transaction => transaction.amount > 0).reduce((sum, transaction) => sum + transaction.amount, 0)
    const outflows = Math.abs(dayTransactions.filter(transaction => transaction.amount < 0).reduce((sum, transaction) => sum + transaction.amount, 0))
    const opening = runningBalance
    const closing = opening + inflows - outflows
    runningBalance = closing

    return {
      date: dateKey,
      opening,
      inflows,
      outflows,
      closing,
    }
  })

  return {
    totalCash,
    availableCash,
    pendingInflows,
    pendingOutflows,
    projectedBalance: totalCash + pendingInflows - pendingOutflows,
    accountBreakdown: scopedAccounts.map(account => ({
      accountId: account.id,
      accountName: account.name,
      balance: account.balance,
      available: account.availableBalance ?? account.balance,
    })),
    dailyForecast,
  }
}

export async function getReconciliationItems(
  bankAccountId: string,
  statusFilter?: string[],
  sort?: SortConfig,
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedResponse<ReconciliationItem>> {
  await ensureCloseState()
  await delay()

  let filtered = reconciliationItems.filter(item => item.bankAccountId === bankAccountId)

  if (statusFilter?.length) {
    filtered = filtered.filter(item => statusFilter.includes(item.status))
  }

  filtered = sort
    ? sortItems(filtered, sort)
    : [...filtered].sort((left, right) => right.date.getTime() - left.date.getTime())

  return paginate(filtered, page, pageSize)
}

export async function getReconciliationSummary(bankAccountId: string): Promise<ReconciliationSummary> {
  await ensureCloseState()
  await delay()

  const account = bankAccounts.find(candidate => candidate.id === bankAccountId)
  const items = reconciliationItems.filter(item => item.bankAccountId === bankAccountId)
  const outstandingDeposits = items
    .filter(item => item.bankAmount > 0 && item.status !== "matched")
    .reduce((sum, item) => sum + item.bankAmount, 0)
  const outstandingWithdrawals = items
    .filter(item => item.bankAmount < 0 && item.status !== "matched")
    .reduce((sum, item) => sum + Math.abs(item.bankAmount), 0)
  const adjustments = items.filter(item => item.status === "adjusted").reduce((sum, item) => sum + item.difference, 0)
  const bookBalance = items.reduce((sum, item) => sum + item.bookAmount, 0)
  const unmatchedCount = items.filter(item => item.status === "unmatched").length
  const lastReconciledDate = [...items]
    .filter(item => item.status === "matched")
    .sort((left, right) => right.date.getTime() - left.date.getTime())[0]?.date

  return {
    bankBalance: account?.balance ?? 0,
    bookBalance,
    outstandingDeposits,
    outstandingWithdrawals,
    adjustments,
    reconciledBalance: bookBalance + outstandingDeposits - outstandingWithdrawals + adjustments,
    unmatchedCount,
    lastReconciledDate,
    status: unmatchedCount || items.some(item => item.status === "adjusted") ? "needs_review" : "completed",
  }
}

export async function getReconciliationData(filters: FinanceFilters, bankAccountId?: string): Promise<ReconciliationData> {
  await ensureCloseState()
  await delay()

  const filtered = reconciliationItems.filter(item => {
    if (bankAccountId && item.bankAccountId !== bankAccountId) {
      return false
    }

    if (!matchesFinanceFilters(item, filters)) {
      return false
    }

    return isInDateRange(item.date, filters.dateRange)
  })

  const scopedBankAccounts = bankAccounts.filter(account => matchesFinanceFilters(account, filters))
  const selectedBankAccount =
    scopedBankAccounts.find(account => account.id === bankAccountId) ??
    scopedBankAccounts[0] ??
    bankAccounts[0]
  const outstandingDeposits = filtered.filter(item => item.bankAmount > 0 && item.status !== 'matched').reduce((sum, item) => sum + item.bankAmount, 0)
  const outstandingWithdrawals = filtered.filter(item => item.bankAmount < 0 && item.status !== 'matched').reduce((sum, item) => sum + Math.abs(item.bankAmount), 0)
  const adjustments = filtered.filter(item => item.status === 'adjusted').reduce((sum, item) => sum + item.difference, 0)
  const exceptions = filtered.filter(item => item.status === 'unmatched' || item.status === 'adjusted')
  const bookBalance = filtered.reduce((sum, item) => sum + item.bookAmount, 0)

  return {
    summary: {
      bankBalance: selectedBankAccount?.balance ?? 0,
      bookBalance,
      outstandingDeposits,
      outstandingWithdrawals,
      adjustments,
      reconciledBalance: bookBalance + outstandingDeposits - outstandingWithdrawals + adjustments,
      unmatchedCount: filtered.filter(item => item.status === 'unmatched').length,
      lastReconciledDate: filtered.filter(item => item.status === 'matched').sort((left, right) => right.date.getTime() - left.date.getTime())[0]?.date,
      status: exceptions.length > 0 ? 'needs_review' : 'completed',
    },
    items: filtered,
    exceptions,
  }
}
