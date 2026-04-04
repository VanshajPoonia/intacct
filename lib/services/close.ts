import { bankAccounts, reconciliationItems } from '@/lib/mock-data/accounting'
import { closeTasks } from '@/lib/mock-data/workflow'
import type { CloseStatus, CloseTask, FinanceFilters, ReconciliationData } from '@/lib/types'
import { delay, isInDateRange, matchesFinanceFilters } from './base'

export async function getCloseTasks(filters: FinanceFilters): Promise<CloseTask[]> {
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

export async function getReconciliationData(filters: FinanceFilters, bankAccountId?: string): Promise<ReconciliationData> {
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
      bankBalance: selectedBankAccount.balance,
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
