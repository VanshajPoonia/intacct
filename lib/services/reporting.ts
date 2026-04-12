import type {
  Account,
  AccountType,
  BalanceSheetData,
  BudgetActualData,
  CashFlowData,
  ConsolidatedFinancials,
  DashboardMetric,
  DashboardMetricsResponse,
  FinanceFilters,
  IncomeStatementData,
  PnLData,
  TrialBalanceRow,
} from '@/lib/types'
import { delay, getDateRangeFactor, getEntityWeight, isInDateRange, matchesFinanceFilters } from './base'
import { getRuntimeDataset } from './runtime-data'

let accounts: Account[] = []
let bankAccounts: any[] = []
let consolidationAdjustments: Array<{ label: string; amount: number }> = []
let journalEntries: any[] = []
let transactions: any[] = []
let bills: any[] = []
let payableApprovalItems: any[] = []
let invoices: any[] = []
let budgetTargets: any[] = []
let workflowApprovalItems: any[] = []
let reportingStatePromise: Promise<void> | null = null

async function ensureReportingState() {
  if (reportingStatePromise) {
    return reportingStatePromise
  }

  reportingStatePromise = (async () => {
    const [accounting, payables, receivables, reporting, workflow] = await Promise.all([
      getRuntimeDataset<{
        accounts: Account[]
        bankAccounts: any[]
        consolidationAdjustments: Array<{ label: string; amount: number }>
        journalEntries: any[]
        transactions: any[]
      }>("accounting"),
      getRuntimeDataset<{ bills: any[]; payableApprovalItems: any[] }>("payables"),
      getRuntimeDataset<{ invoices: any[] }>("receivables"),
      getRuntimeDataset<{ budgetTargets: any[] }>("reporting"),
      getRuntimeDataset<{ workflowApprovalItems: any[] }>("workflow"),
    ])

    accounts = accounting.accounts
    bankAccounts = accounting.bankAccounts
    consolidationAdjustments = accounting.consolidationAdjustments
    journalEntries = accounting.journalEntries
    transactions = accounting.transactions
    bills = payables.bills
    payableApprovalItems = payables.payableApprovalItems
    invoices = receivables.invoices
    budgetTargets = reporting.budgetTargets
    workflowApprovalItems = workflow.workflowApprovalItems
  })()

  try {
    await reportingStatePromise
  } finally {
    reportingStatePromise = null
  }
}

const CONSOLIDATED_ENTITY_IDS = ['e1', 'e2', 'e3'] as const

function round(value: number) {
  return Math.round(value)
}

function getScopedEntityIds(filters: FinanceFilters) {
  const selected = [...new Set([filters.entityId, ...(filters.entityIds ?? [])].filter(Boolean))] as string[]
  const scoped = selected.filter(entityId => entityId !== 'e4')
  return scoped.length ? scoped : [...CONSOLIDATED_ENTITY_IDS]
}

function getScopedEntityWeight(filters: FinanceFilters) {
  return getScopedEntityIds(filters).reduce((sum, entityId) => sum + getEntityWeight(entityId), 0)
}

function matchesSelectedValues(recordValue: string | undefined, single?: string, multiple?: string[]) {
  const selected = [...new Set([single, ...(multiple ?? [])].filter(Boolean))] as string[]
  if (!selected.length) {
    return true
  }
  if (!recordValue) {
    return false
  }
  return selected.includes(recordValue)
}

function matchesLineDimensions(
  line: {
    departmentId?: string
    locationId?: string
    projectId?: string
    customerId?: string
    vendorId?: string
  },
  filters: FinanceFilters
) {
  return (
    matchesSelectedValues(line.departmentId, filters.departmentId, filters.departmentIds) &&
    matchesSelectedValues(line.locationId, filters.locationId, filters.locationIds) &&
    matchesSelectedValues(line.projectId, filters.projectId, filters.projectIds) &&
    matchesSelectedValues(line.customerId, filters.customerId) &&
    matchesSelectedValues(line.vendorId, filters.vendorId)
  )
}

function scaleBaseBalance(account: Account, filters: FinanceFilters) {
  if (account.entityId) {
    return getScopedEntityIds(filters).includes(account.entityId) ? account.balance : 0
  }

  return account.balance * getScopedEntityWeight(filters)
}

function getJournalLineNaturalAmount(accountType: AccountType, debit: number, credit: number) {
  if (accountType === 'asset' || accountType === 'expense') {
    return debit - credit
  }

  return credit - debit
}

function getTransactionNaturalAmount(accountType: AccountType, transactionType: string, amount: number) {
  if (accountType === 'expense') {
    return ['debit', 'payment', 'withdrawal', 'fee'].includes(transactionType) ? amount : -amount
  }

  if (accountType === 'asset') {
    return ['receipt', 'deposit', 'interest', 'credit'].includes(transactionType) ? amount : -amount
  }

  return ['credit', 'receipt', 'deposit', 'journal'].includes(transactionType) ? amount : -amount
}

function getAccountMovement(account: Account, filters: FinanceFilters) {
  const journalMovement = journalEntries
    .filter(entry => matchesFinanceFilters(entry, filters) && isInDateRange(entry.date, filters.dateRange))
    .reduce((sum, entry) => {
      const entryMovement = entry.lines
        .filter((line: any) => line.accountId === account.id && matchesLineDimensions(line, filters))
        .reduce((lineSum: number, line: any) => lineSum + getJournalLineNaturalAmount(account.type, line.debit, line.credit), 0)

      return sum + entryMovement
    }, 0)

  const transactionMovement = transactions
    .filter(transaction => transaction.accountId === account.id)
    .filter(transaction => matchesFinanceFilters(transaction, filters) && isInDateRange(transaction.date, filters.dateRange))
    .reduce((sum, transaction) => sum + getTransactionNaturalAmount(account.type, transaction.type, transaction.amount), 0)

  return journalMovement + transactionMovement
}

function buildAccountEndingBalances(filters: FinanceFilters) {
  return accounts.map(account => {
    const baseBalance = scaleBaseBalance(account, filters)
    const movement = getAccountMovement(account, filters)

    return {
      account,
      baseBalance,
      movement,
      endingBalance: baseBalance + movement,
    }
  })
}

function buildMetric(
  id: string,
  label: string,
  value: number,
  previousValue: number,
  format: DashboardMetric['format'],
  currency: string = 'USD'
): DashboardMetric {
  const change = previousValue === 0 ? 0 : ((value - previousValue) / Math.abs(previousValue)) * 100

  return {
    id,
    label,
    value: round(value),
    previousValue: round(previousValue),
    change: Number(change.toFixed(1)),
    changeType: change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral',
    format,
    currency: format === 'currency' ? currency : undefined,
  }
}

function buildSection(lines: PnLData['revenue']['lines']) {
  return {
    lines,
    total: lines.reduce((sum, line) => sum + line.amount, 0),
    previousTotal: lines.reduce((sum, line) => sum + (line.previousAmount ?? 0), 0),
  }
}

function sumNamedLines(sections: PnLData['revenue'][]) {
  const totals = new Map<string, { name: string; amount: number; previousAmount: number }>()

  sections.forEach(section => {
    section.lines.forEach(line => {
      const current = totals.get(line.name) ?? { name: line.name, amount: 0, previousAmount: 0 }
      current.amount += line.amount
      current.previousAmount += line.previousAmount ?? 0
      totals.set(line.name, current)
    })
  })

  return {
    lines: [...totals.values()].map(line => ({
      name: line.name,
      amount: round(line.amount),
      previousAmount: round(line.previousAmount),
    })),
    total: round(sections.reduce((sum, section) => sum + section.total, 0)),
    previousTotal: round(sections.reduce((sum, section) => sum + section.previousTotal, 0)),
  }
}

function sumBalanceBucket(buckets: Array<Record<string, number>>): BalanceSheetData['assets']['currentAssets'] {
  const combined: BalanceSheetData['assets']['currentAssets'] = { total: 0 }

  buckets.forEach(bucket => {
    Object.entries(bucket).forEach(([key, value]) => {
      combined[key] = (combined[key] ?? 0) + value
    })
  })

  combined.total = Object.entries(combined)
    .filter(([key]) => key !== 'total')
    .reduce((sum, [, value]) => sum + value, 0)

  return combined
}

function sumNamedAmounts(items: { name: string; amount: number }[][]) {
  const combined = new Map<string, number>()

  items.forEach(group => {
    group.forEach(item => {
      combined.set(item.name, (combined.get(item.name) ?? 0) + item.amount)
    })
  })

  return [...combined.entries()].map(([name, amount]) => ({
    name,
    amount: round(amount),
  }))
}

function appendEliminationLine(section: PnLData['revenue'], label: string, amount: number) {
  section.lines = [...section.lines, { name: label, amount: -Math.abs(amount), previousAmount: 0 }]
  section.total -= Math.abs(amount)
}

function aggregatePnLs(statements: PnLData[]): PnLData {
  const revenue = sumNamedLines(statements.map(statement => statement.revenue))
  const costOfGoodsSold = sumNamedLines(statements.map(statement => statement.costOfGoodsSold))
  const operatingExpenses = sumNamedLines(statements.map(statement => statement.operatingExpenses))
  const grossProfit = revenue.total - costOfGoodsSold.total
  const previousGrossProfit = revenue.previousTotal - costOfGoodsSold.previousTotal
  const operatingIncome = grossProfit - operatingExpenses.total
  const previousOperatingIncome = previousGrossProfit - operatingExpenses.previousTotal

  const otherIncome = {
    interestIncome: round(statements.reduce((sum, statement) => sum + statement.otherIncome.interestIncome, 0)),
    interestExpense: round(statements.reduce((sum, statement) => sum + statement.otherIncome.interestExpense, 0)),
    other: round(statements.reduce((sum, statement) => sum + statement.otherIncome.other, 0)),
    total: round(statements.reduce((sum, statement) => sum + statement.otherIncome.total, 0)),
  }

  const incomeBeforeTax = operatingIncome + otherIncome.total
  const previousIncomeBeforeTax = round(statements.reduce((sum, statement) => sum + statement.previousIncomeBeforeTax, 0))
  const incomeTaxExpense = round(statements.reduce((sum, statement) => sum + statement.incomeTaxExpense, 0))
  const netIncome = incomeBeforeTax - incomeTaxExpense
  const previousNetIncome = round(statements.reduce((sum, statement) => sum + statement.previousNetIncome, 0))

  return {
    revenue,
    costOfGoodsSold,
    grossProfit,
    previousGrossProfit,
    operatingExpenses,
    operatingIncome,
    previousOperatingIncome,
    otherIncome,
    incomeBeforeTax,
    previousIncomeBeforeTax,
    incomeTaxExpense,
    netIncome,
    previousNetIncome,
  }
}

function aggregateBalanceSheets(statements: BalanceSheetData[]): BalanceSheetData {
  const currentAssets = sumBalanceBucket(statements.map(statement => statement.assets.currentAssets))
  const nonCurrentAssets = sumBalanceBucket(statements.map(statement => statement.assets.nonCurrentAssets))
  const currentLiabilities = sumBalanceBucket(statements.map(statement => statement.liabilities.currentLiabilities))
  const nonCurrentLiabilities = sumBalanceBucket(statements.map(statement => statement.liabilities.nonCurrentLiabilities))
  const equity = sumBalanceBucket(statements.map(statement => statement.equity))

  return {
    assets: {
      currentAssets,
      nonCurrentAssets,
      total: currentAssets.total + nonCurrentAssets.total,
    },
    liabilities: {
      currentLiabilities,
      nonCurrentLiabilities,
      total: currentLiabilities.total + nonCurrentLiabilities.total,
    },
    equity,
  }
}

function aggregateCashFlows(statements: CashFlowData[]): CashFlowData {
  const adjustments = sumNamedAmounts(statements.map(statement => statement.operatingActivities.adjustments))
  const changesInWorkingCapital = sumNamedAmounts(statements.map(statement => statement.operatingActivities.changesInWorkingCapital))
  const investingItems = sumNamedAmounts(statements.map(statement => statement.investingActivities.items))
  const financingItems = sumNamedAmounts(statements.map(statement => statement.financingActivities.items))

  return {
    operatingActivities: {
      netIncome: round(statements.reduce((sum, statement) => sum + statement.operatingActivities.netIncome, 0)),
      adjustments,
      changesInWorkingCapital,
      total: round(statements.reduce((sum, statement) => sum + statement.operatingActivities.total, 0)),
    },
    investingActivities: {
      items: investingItems,
      total: round(statements.reduce((sum, statement) => sum + statement.investingActivities.total, 0)),
    },
    financingActivities: {
      items: financingItems,
      total: round(statements.reduce((sum, statement) => sum + statement.financingActivities.total, 0)),
    },
    netChangeInCash: round(statements.reduce((sum, statement) => sum + statement.netChangeInCash, 0)),
    beginningCash: round(statements.reduce((sum, statement) => sum + statement.beginningCash, 0)),
    endingCash: round(statements.reduce((sum, statement) => sum + statement.endingCash, 0)),
    previousNetChangeInCash: round(statements.reduce((sum, statement) => sum + statement.previousNetChangeInCash, 0)),
  }
}

export async function getPnL(filters: FinanceFilters): Promise<PnLData> {
  await ensureReportingState()
  await delay()

  const factor = getDateRangeFactor(filters.dateRange)
  const balances = buildAccountEndingBalances(filters)

  const revenue = buildSection(
    balances
      .filter(item => item.account.type === 'revenue')
      .map(item => ({
        name: item.account.name,
        amount: round(Math.abs(item.endingBalance * factor)),
        previousAmount: round(Math.abs(item.endingBalance * factor * 0.91)),
      }))
  )

  const costOfGoodsSold = buildSection(
    balances
      .filter(item => item.account.id === 'a-cogs')
      .map(item => ({
        name: item.account.name,
        amount: round(Math.abs(item.endingBalance * factor)),
        previousAmount: round(Math.abs(item.endingBalance * factor * 0.95)),
      }))
  )

  const operatingExpenses = buildSection(
    balances
      .filter(item => item.account.type === 'expense' && item.account.id !== 'a-cogs')
      .map(item => ({
        name: item.account.name,
        amount: round(Math.abs(item.endingBalance * factor)),
        previousAmount: round(Math.abs(item.endingBalance * factor * 0.93)),
      }))
  )

  const grossProfit = revenue.total - costOfGoodsSold.total
  const previousGrossProfit = revenue.previousTotal - costOfGoodsSold.previousTotal
  const operatingIncome = grossProfit - operatingExpenses.total
  const previousOperatingIncome = previousGrossProfit - operatingExpenses.previousTotal

  const scopedBankAccounts = bankAccounts.filter(account => matchesFinanceFilters(account, filters))
  const otherIncome = {
    interestIncome: round(scopedBankAccounts.reduce((sum, account) => sum + (account.currency === 'USD' ? 1200 : 1100), 0) * factor),
    interestExpense: round(Math.abs((balances.find(item => item.account.id === 'a-debt')?.endingBalance ?? 0) * 0.018) * factor),
    other: round(4500 * getScopedEntityWeight(filters) * factor),
    total: 0,
  }
  otherIncome.total = otherIncome.interestIncome - otherIncome.interestExpense + otherIncome.other

  const incomeBeforeTax = operatingIncome + otherIncome.total
  const previousIncomeBeforeTax = previousOperatingIncome + round(otherIncome.total * 0.88)
  const incomeTaxExpense = round(Math.max(incomeBeforeTax, 0) * 0.24)
  const netIncome = incomeBeforeTax - incomeTaxExpense
  const previousNetIncome = round(previousIncomeBeforeTax * 0.77)

  return {
    revenue,
    costOfGoodsSold,
    grossProfit,
    previousGrossProfit,
    operatingExpenses,
    operatingIncome,
    previousOperatingIncome,
    otherIncome,
    incomeBeforeTax,
    previousIncomeBeforeTax,
    incomeTaxExpense,
    netIncome,
    previousNetIncome,
  }
}

export async function getIncomeStatementData(filters: FinanceFilters): Promise<IncomeStatementData> {
  await ensureReportingState()
  return getPnL(filters)
}

export async function getBalanceSheet(filters: FinanceFilters): Promise<BalanceSheetData> {
  await ensureReportingState()
  await delay()

  const endingBalances = buildAccountEndingBalances(filters)
  const weight = getScopedEntityWeight(filters)
  const inventory = round(
    Math.abs(
      transactions
        .filter(transaction => transaction.category === 'inventory')
        .filter(transaction => matchesFinanceFilters(transaction, filters) && isInDateRange(transaction.date, filters.dateRange))
        .reduce((sum, transaction) => sum + transaction.amount, 0) * 0.62
    )
  )

  const currentAssets = {
    cash: round(endingBalances.find(item => item.account.id === 'a-cash')?.endingBalance ?? 0),
    accountsReceivable: round(endingBalances.find(item => item.account.id === 'a-ar')?.endingBalance ?? 0),
    inventory,
    prepaidExpenses: round(endingBalances.find(item => item.account.id === 'a-prepaid')?.endingBalance ?? 0),
    other: round(((endingBalances.find(item => item.account.id === 'a-prepaid')?.endingBalance ?? 0) * 0.35) + 48000 * weight),
    total: 0,
  }
  currentAssets.total =
    currentAssets.cash +
    currentAssets.accountsReceivable +
    currentAssets.inventory +
    currentAssets.prepaidExpenses +
    currentAssets.other

  const nonCurrentAssets = {
    ppe: round(endingBalances.find(item => item.account.id === 'a-fixed')?.endingBalance ?? 0),
    accumulatedDepreciation: round(Math.abs(endingBalances.find(item => item.account.id === 'a-accdep')?.endingBalance ?? 0)),
    intangibles: round(225000 * weight),
    investments: round(91000 * weight),
    other: round(34000 * weight),
    total: 0,
  }
  nonCurrentAssets.total =
    nonCurrentAssets.ppe -
    nonCurrentAssets.accumulatedDepreciation +
    nonCurrentAssets.intangibles +
    nonCurrentAssets.investments +
    nonCurrentAssets.other

  const longTermDebt = round(endingBalances.find(item => item.account.id === 'a-debt')?.endingBalance ?? 0)
  const currentLiabilities = {
    accountsPayable: round(endingBalances.find(item => item.account.id === 'a-ap')?.endingBalance ?? 0),
    accruedExpenses: round(endingBalances.find(item => item.account.id === 'a-accrual')?.endingBalance ?? 0),
    deferredRevenue: round(endingBalances.find(item => item.account.id === 'a-deferred')?.endingBalance ?? 0),
    shortTermDebt: round(longTermDebt * 0.08),
    currentPortionLTD: round(longTermDebt * 0.06),
    other: round(((endingBalances.find(item => item.account.id === 'a-deferred')?.endingBalance ?? 0) * 0.22) + 28000 * weight),
    total: 0,
  }
  currentLiabilities.total =
    currentLiabilities.accountsPayable +
    currentLiabilities.accruedExpenses +
    currentLiabilities.deferredRevenue +
    currentLiabilities.shortTermDebt +
    currentLiabilities.currentPortionLTD +
    currentLiabilities.other

  const nonCurrentLiabilities = {
    longTermDebt,
    deferredTax: round(92000 * weight),
    other: round(31000 * weight),
    total: 0,
  }
  nonCurrentLiabilities.total =
    nonCurrentLiabilities.longTermDebt +
    nonCurrentLiabilities.deferredTax +
    nonCurrentLiabilities.other

  const equity = {
    commonStock: round(450000 * weight),
    additionalPaidInCapital: round(320000 * weight),
    retainedEarnings: round(endingBalances.find(item => item.account.id === 'a-equity')?.endingBalance ?? 0),
    treasuryStock: round(18000 * weight),
    otherComprehensiveIncome: round(12000 * weight),
    total: 0,
  }
  equity.total =
    equity.commonStock +
    equity.additionalPaidInCapital +
    equity.retainedEarnings -
    equity.treasuryStock +
    equity.otherComprehensiveIncome

  return {
    assets: {
      currentAssets,
      nonCurrentAssets,
      total: currentAssets.total + nonCurrentAssets.total,
    },
    liabilities: {
      currentLiabilities,
      nonCurrentLiabilities,
      total: currentLiabilities.total + nonCurrentLiabilities.total,
    },
    equity,
  }
}

export async function getBalanceSheetData(filters: FinanceFilters): Promise<BalanceSheetData> {
  await ensureReportingState()
  return getBalanceSheet(filters)
}

export async function getCashFlow(filters: FinanceFilters): Promise<CashFlowData> {
  await ensureReportingState()
  await delay()

  const factor = Math.max(getDateRangeFactor(filters.dateRange), 0.1)
  const pnl = await getPnL(filters)
  const balanceSheet = await getBalanceSheet(filters)

  const operatingAdjustments = [
    { name: 'Depreciation', amount: round((balanceSheet.assets.nonCurrentAssets.accumulatedDepreciation ?? 0) * 0.04 * factor) },
    { name: 'Deferred revenue release', amount: -round((balanceSheet.liabilities.currentLiabilities.deferredRevenue ?? 0) * 0.05 * factor) },
  ]

  const changesInWorkingCapital = [
    { name: 'Accounts Receivable', amount: -round(balanceSheet.assets.currentAssets.accountsReceivable * 0.04) },
    { name: 'Accounts Payable', amount: round(balanceSheet.liabilities.currentLiabilities.accountsPayable * 0.03) },
    { name: 'Inventory', amount: -round((balanceSheet.assets.currentAssets.inventory ?? 0) * 0.03) },
    { name: 'Accrued Expenses', amount: round(balanceSheet.liabilities.currentLiabilities.accruedExpenses * 0.02) },
  ]

  const operatingTotal =
    pnl.netIncome +
    operatingAdjustments.reduce((sum, adjustment) => sum + adjustment.amount, 0) +
    changesInWorkingCapital.reduce((sum, item) => sum + item.amount, 0)

  const investingItems = [
    { name: 'Capex', amount: -round(96000 * factor) },
    { name: 'Capitalized implementation tooling', amount: -round(28000 * factor) },
  ]
  const investingTotal = investingItems.reduce((sum, item) => sum + item.amount, 0)

  const financingItems = [
    { name: 'Debt principal payment', amount: -round(52000 * factor) },
    { name: 'Intercompany funding', amount: round(18000 * factor) },
  ]
  const financingTotal = financingItems.reduce((sum, item) => sum + item.amount, 0)

  const beginningCash = round((balanceSheet.assets.currentAssets.cash ?? 0) * 0.92)
  const netChangeInCash = operatingTotal + investingTotal + financingTotal

  return {
    operatingActivities: {
      netIncome: pnl.netIncome,
      adjustments: operatingAdjustments,
      changesInWorkingCapital,
      total: operatingTotal,
    },
    investingActivities: {
      items: investingItems,
      total: investingTotal,
    },
    financingActivities: {
      items: financingItems,
      total: financingTotal,
    },
    netChangeInCash,
    beginningCash,
    endingCash: beginningCash + netChangeInCash,
    previousNetChangeInCash: round(netChangeInCash * 0.82),
  }
}

export async function getCashFlowData(filters: FinanceFilters): Promise<CashFlowData> {
  await ensureReportingState()
  return getCashFlow(filters)
}

export async function getTrialBalance(filters: FinanceFilters): Promise<TrialBalanceRow[]> {
  await ensureReportingState()
  await delay()

  const factor = getDateRangeFactor(filters.dateRange)

  return buildAccountEndingBalances(filters).map(item => {
    const openingBase = Math.abs(item.baseBalance)
    const periodMovement = Math.abs(item.movement * factor)
    const debitNormal = item.account.type === 'asset' || item.account.type === 'expense'

    return {
      accountId: item.account.id,
      accountNumber: item.account.number,
      accountName: item.account.name,
      accountType: item.account.type,
      openingDebit: debitNormal ? round(openingBase * 0.88) : 0,
      openingCredit: debitNormal ? 0 : round(openingBase * 0.88),
      periodDebit: debitNormal ? round(periodMovement) : round(periodMovement * 0.36),
      periodCredit: debitNormal ? round(periodMovement * 0.22) : round(periodMovement),
      closingDebit: debitNormal ? Math.max(round(item.endingBalance), 0) : 0,
      closingCredit: debitNormal ? 0 : Math.max(round(item.endingBalance), 0),
    }
  })
}

export async function getBudgetVsActual(filters: FinanceFilters): Promise<BudgetActualData[]> {
  await ensureReportingState()
  await delay()

  const factor = getDateRangeFactor(filters.dateRange)
  const selectedEntities = getScopedEntityIds(filters)

  return budgetTargets
    .filter(target => selectedEntities.includes(target.entityId))
    .filter(target => !filters.departmentId || target.departmentId === filters.departmentId)
    .filter(target => !filters.projectId || target.projectId === filters.projectId)
    .map(target => {
      const budget = round(target.budget * factor)
      const actual = round(target.actual * factor)
      const variance = actual - budget

      return {
        category: target.category,
        budget,
        actual,
        variance,
        variancePercent: budget === 0 ? 0 : Number(((variance / budget) * 100).toFixed(1)),
      }
    })
}

export async function getDashboardMetrics(filters: FinanceFilters): Promise<DashboardMetricsResponse> {
  await ensureReportingState()
  await delay()

  const [pnl, balanceSheet, budgetVsActual] = await Promise.all([
    getPnL(filters),
    getBalanceSheet(filters),
    getBudgetVsActual(filters),
  ])

  const arOutstanding = invoices
    .filter(invoice => matchesFinanceFilters(invoice, filters) && isInDateRange(invoice.date, filters.dateRange))
    .reduce((sum, invoice) => sum + invoice.openBalance, 0)

  const apOutstanding = bills
    .filter(bill => matchesFinanceFilters(bill, filters) && isInDateRange(bill.date, filters.dateRange))
    .reduce((sum, bill) => sum + (bill.amount - (bill.amountPaid ?? 0)), 0)

  const pendingApprovals = [...payableApprovalItems, ...workflowApprovalItems]
    .filter(item => item.status === 'pending')
    .filter(item => matchesFinanceFilters(item, filters))
    .filter(item => isInDateRange(item.requestedAt, filters.dateRange))
    .length

  const revenueBudget = budgetVsActual.find(item => item.category === 'Revenue')

  return {
    totalRevenue: buildMetric('metric-revenue', 'Total Revenue', pnl.revenue.total, pnl.revenue.previousTotal, 'currency'),
    totalExpenses: buildMetric(
      'metric-expenses',
      'Total Expenses',
      pnl.costOfGoodsSold.total + pnl.operatingExpenses.total,
      pnl.costOfGoodsSold.previousTotal + pnl.operatingExpenses.previousTotal,
      'currency'
    ),
    netIncome: buildMetric('metric-net-income', 'Net Income', pnl.netIncome, pnl.previousNetIncome, 'currency'),
    cashBalance: buildMetric('metric-cash', 'Cash Balance', balanceSheet.assets.currentAssets.cash, round(balanceSheet.assets.currentAssets.cash * 0.91), 'currency'),
    arOutstanding: buildMetric('metric-ar', 'AR Outstanding', arOutstanding, round(arOutstanding * 0.95), 'currency'),
    apOutstanding: buildMetric('metric-ap', 'AP Outstanding', apOutstanding, round(apOutstanding * 1.03), 'currency'),
    budgetVariance: {
      id: 'metric-budget-variance',
      label: 'Budget Variance',
      value: Number((revenueBudget?.variancePercent ?? 0).toFixed(1)),
      previousValue: Number(((revenueBudget?.variancePercent ?? 0) * 0.85).toFixed(1)),
      change: Number((((revenueBudget?.variancePercent ?? 0) * 0.15)).toFixed(1)),
      changeType: (revenueBudget?.variance ?? 0) <= 0 ? 'negative' : 'positive',
      format: 'percentage',
    },
    pendingApprovals: buildMetric('metric-approvals', 'Pending Approvals', pendingApprovals, Math.max(pendingApprovals - 2, 0), 'number'),
  }
}

export async function getConsolidatedFinancials(filters: FinanceFilters): Promise<ConsolidatedFinancials> {
  await ensureReportingState()
  const entityIds = getScopedEntityIds({ ...filters, entityId: 'e4' })

  const statementFilters = entityIds.map(entityId => ({
    ...filters,
    entityId,
    entityIds: undefined,
  }))

  const pnlStatements = await Promise.all(statementFilters.map(filter => getPnL(filter)))
  const balanceSheetStatements = await Promise.all(statementFilters.map(filter => getBalanceSheet(filter)))
  const cashFlowStatements = await Promise.all(statementFilters.map(filter => getCashFlow(filter)))

  const pnl = aggregatePnLs(pnlStatements)
  const balanceSheet = aggregateBalanceSheets(balanceSheetStatements)
  const cashFlow = aggregateCashFlows(cashFlowStatements)

  const revenueElimination = consolidationAdjustments
    .filter(adjustment => adjustment.label.toLowerCase().includes('services'))
    .reduce((sum, adjustment) => sum + adjustment.amount, 0)
  const balanceSheetElimination = consolidationAdjustments
    .filter(adjustment => adjustment.label.toLowerCase().includes('ap/ar'))
    .reduce((sum, adjustment) => sum + adjustment.amount, 0)

  if (revenueElimination > 0) {
    appendEliminationLine(pnl.revenue, 'Intercompany revenue elimination', revenueElimination)
    pnl.grossProfit -= revenueElimination
    pnl.operatingIncome -= revenueElimination
    pnl.incomeBeforeTax -= revenueElimination
    pnl.netIncome -= revenueElimination
  }

  if (balanceSheetElimination > 0) {
    balanceSheet.assets.currentAssets.accountsReceivable -= balanceSheetElimination
    balanceSheet.assets.currentAssets.total -= balanceSheetElimination
    balanceSheet.assets.total -= balanceSheetElimination
    balanceSheet.liabilities.currentLiabilities.accountsPayable -= balanceSheetElimination
    balanceSheet.liabilities.currentLiabilities.total -= balanceSheetElimination
    balanceSheet.liabilities.total -= balanceSheetElimination
  }

  if (revenueElimination > 0) {
    cashFlow.operatingActivities.adjustments = [
      ...cashFlow.operatingActivities.adjustments,
      { name: 'Intercompany revenue elimination', amount: -revenueElimination },
    ]
    cashFlow.operatingActivities.total -= revenueElimination
    cashFlow.netChangeInCash -= revenueElimination
    cashFlow.endingCash -= revenueElimination
  }

  return {
    entitiesIncluded: entityIds,
    eliminations: consolidationAdjustments.map(adjustment => ({ ...adjustment })),
    pnl,
    balanceSheet,
    cashFlow,
  }
}
