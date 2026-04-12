import type {
  Account,
  AssetBook,
  BankAccount,
  Bill,
  Contract,
  Customer,
  DepreciationScheduleLine,
  Document,
  FinanceFilters,
  FixedAsset,
  Invoice,
  JournalEntry,
  Payment,
  PerformanceObligation,
  Receipt,
  ReconciliationItem,
  ReconciliationSummary,
  RevenueRecognitionEvent,
  RevenueSchedule,
  RevenueScheduleLine,
  Transaction,
  Vendor,
} from "@/lib/types"
import { delay, isInDateRange } from "./base"
import { fetchInternalApi, InternalApiError } from "./internal-api"
import {
  hydrateCustomer,
  hydrateDocument,
  hydrateInvoice,
  hydrateInvoiceDetailRouteData,
  hydrateReceipt,
  type SerializedCustomer,
  type SerializedInvoiceDetailRouteData,
} from "./receivables-hydration"
import { getRuntimeDataset } from "./runtime-data"
import {
  getBankAccountById,
  getReconciliationItems,
  getReconciliationSummary,
  getTransactions as getLegacyTransactions,
} from "./legacy"

let accounts: Account[] = []
let journalEntries: JournalEntry[] = []
let transactions: Transaction[] = []
let revenueRecognitionEvents: RevenueRecognitionEvent[] = []
let revenueScheduleLines: RevenueScheduleLine[] = []
let revenueSchedules: RevenueSchedule[] = []
let performanceObligations: PerformanceObligation[] = []
let fixedAssets: FixedAsset[] = []
let assetBooks: AssetBook[] = []
let assetLifecycleEvents: any[] = []
let depreciationScheduleLines: DepreciationScheduleLine[] = []
let payableDocuments: Document[] = []
let payments: Payment[] = []
let bills: Bill[] = []
let vendors: Vendor[] = []
let contracts: Contract[] = []
let detailRouteStatePromise: Promise<void> | null = null

async function ensureDetailRouteState() {
  if (detailRouteStatePromise) {
    return detailRouteStatePromise
  }

  detailRouteStatePromise = (async () => {
    const [accounting, contractsRevenue, fixedAssetsState, payables, receivables] = await Promise.all([
      getRuntimeDataset<{ accounts: Account[]; journalEntries: JournalEntry[]; transactions: Transaction[] }>("accounting"),
      getRuntimeDataset<{
        revenueRecognitionEvents: RevenueRecognitionEvent[]
        revenueScheduleLines: RevenueScheduleLine[]
        revenueSchedules: RevenueSchedule[]
        performanceObligations: PerformanceObligation[]
      }>("contracts_revenue"),
      getRuntimeDataset<{
        fixedAssets: FixedAsset[]
        assetBooks: AssetBook[]
        assetLifecycleEvents: any[]
        depreciationScheduleLines: DepreciationScheduleLine[]
      }>("fixed_assets"),
      getRuntimeDataset<{ payableDocuments: Document[]; payments: Payment[]; bills: Bill[]; vendors: Vendor[] }>("payables"),
      getRuntimeDataset<{ contracts: Contract[] }>("receivables"),
    ])

    accounts = accounting.accounts
    journalEntries = accounting.journalEntries
    transactions = accounting.transactions
    revenueRecognitionEvents = contractsRevenue.revenueRecognitionEvents
    revenueScheduleLines = contractsRevenue.revenueScheduleLines
    revenueSchedules = contractsRevenue.revenueSchedules
    performanceObligations = contractsRevenue.performanceObligations
    fixedAssets = fixedAssetsState.fixedAssets
    assetBooks = fixedAssetsState.assetBooks
    assetLifecycleEvents = fixedAssetsState.assetLifecycleEvents
    depreciationScheduleLines = fixedAssetsState.depreciationScheduleLines
    payableDocuments = payables.payableDocuments
    payments = payables.payments
    bills = payables.bills
    vendors = payables.vendors
    contracts = receivables.contracts
  })()

  try {
    await detailRouteStatePromise
  } finally {
    detailRouteStatePromise = null
  }
}

export interface BillDetailRouteData {
  bill: Bill
  vendor: Vendor | null
  payments: Payment[]
  documents: Document[]
}

export interface InvoiceDetailRouteData {
  invoice: Invoice
  customer: Customer | null
  receipts: Receipt[]
  documents: Document[]
}

export interface JournalEntryDetailRouteData {
  journal: JournalEntry
}

export interface AccountDetailRouteData {
  account: Account
  journals: JournalEntry[]
  transactions: Transaction[]
  balanceTrend: Array<{
    label: string
    balance: number
    debits: number
    credits: number
  }>
}

export interface BankAccountDetailRouteData {
  account: BankAccount
  transactions: Transaction[]
  reconciliationItems: ReconciliationItem[]
  reconciliationSummary: ReconciliationSummary
  balanceTrend: Array<{
    label: string
    balance: number
    inflows: number
    outflows: number
  }>
}

export interface ContractDetailRouteData {
  contract: Contract
  customer: Customer | null
  schedule: RevenueSchedule | null
  scheduleLines: RevenueScheduleLine[]
  obligations: PerformanceObligation[]
  recognitionEvents: RevenueRecognitionEvent[]
}

export interface FixedAssetDetailRouteData {
  asset: FixedAsset
  book: AssetBook | null
  depreciationLines: DepreciationScheduleLine[]
  lifecycleEvents: typeof assetLifecycleEvents
}

function filterByOptionalDateRange<T>(items: T[], getDate: (item: T) => Date | undefined, filters?: FinanceFilters) {
  if (!filters?.dateRange) {
    return items
  }

  return items.filter(item => {
    const value = getDate(item)
    return value ? isInDateRange(value, filters.dateRange) : true
  })
}

function getMonthLabel(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "2-digit",
  }).format(value)
}

function buildTrailingMonthLabels(range?: FinanceFilters["dateRange"], points: number = 6) {
  const endDate = range?.endDate ? new Date(range.endDate) : new Date()
  const labels: Array<{ key: string; label: string }> = []

  for (let index = points - 1; index >= 0; index -= 1) {
    const value = new Date(endDate)
    value.setMonth(endDate.getMonth() - index, 1)
    const key = `${value.getFullYear()}-${value.getMonth()}`

    labels.push({
      key,
      label: getMonthLabel(value),
    })
  }

  return labels
}

function buildAccountBalanceTrend(account: Account, journalsForAccount: JournalEntry[], filters?: FinanceFilters) {
  const months = buildTrailingMonthLabels(filters?.dateRange)
  const monthlyMovement = new Map<string, { debits: number; credits: number }>()

  journalsForAccount.forEach(journal => {
    if (filters?.dateRange && !isInDateRange(journal.date, filters.dateRange)) {
      return
    }

    const key = `${journal.date.getFullYear()}-${journal.date.getMonth()}`
    const current = monthlyMovement.get(key) ?? { debits: 0, credits: 0 }

    journal.lines
      .filter(line => line.accountId === account.id)
      .forEach(line => {
        current.debits += line.debit
        current.credits += line.credit
      })

    monthlyMovement.set(key, current)
  })

  let runningBalance = account.balance
  const normalized = months
    .slice()
    .reverse()
    .map(month => {
      const movement = monthlyMovement.get(month.key) ?? { debits: 0, credits: 0 }
      const delta =
        account.type === "asset" || account.type === "expense"
          ? movement.debits - movement.credits
          : movement.credits - movement.debits

      const currentBalance = runningBalance
      runningBalance -= delta

      return {
        label: month.label,
        balance: currentBalance,
        debits: movement.debits,
        credits: movement.credits,
      }
    })
    .reverse()

  return normalized
}

function getSignedTransactionAmount(transaction: Transaction) {
  if (["deposit", "receipt", "credit", "interest"].includes(transaction.type)) {
    return transaction.amount
  }

  if (["withdrawal", "payment", "fee", "debit", "transfer"].includes(transaction.type)) {
    return -Math.abs(transaction.amount)
  }

  return transaction.amount
}

function buildBankBalanceTrend(account: BankAccount, transactions: Transaction[], filters?: FinanceFilters) {
  const months = buildTrailingMonthLabels(filters?.dateRange)
  const monthlyMovement = new Map<string, { inflows: number; outflows: number; signedNet: number }>()

  transactions.forEach(transaction => {
    const key = `${transaction.date.getFullYear()}-${transaction.date.getMonth()}`
    const current = monthlyMovement.get(key) ?? { inflows: 0, outflows: 0, signedNet: 0 }
    const signedAmount = getSignedTransactionAmount(transaction)

    if (signedAmount >= 0) {
      current.inflows += signedAmount
    } else {
      current.outflows += Math.abs(signedAmount)
    }

    current.signedNet += signedAmount
    monthlyMovement.set(key, current)
  })

  let runningBalance = account.balance
  const normalized = months
    .slice()
    .reverse()
    .map(month => {
      const movement = monthlyMovement.get(month.key) ?? { inflows: 0, outflows: 0, signedNet: 0 }
      const currentBalance = runningBalance
      runningBalance -= movement.signedNet

      return {
        label: month.label,
        balance: currentBalance,
        inflows: movement.inflows,
        outflows: movement.outflows,
      }
    })
    .reverse()

  return normalized
}

function buildReceiptsForInvoice(invoice: Invoice): Receipt[] {
  if (!invoice.amountPaid) {
    return [] as Receipt[]
  }

  const paymentBatches = invoice.status === "partial"
    ? [Math.round(invoice.amountPaid * 0.6), invoice.amountPaid - Math.round(invoice.amountPaid * 0.6)]
    : [invoice.amountPaid]

  return paymentBatches.map((amount, index) => {
    const receiptDate = new Date(invoice.paidAt ?? invoice.sentAt ?? invoice.date)
    receiptDate.setDate(receiptDate.getDate() - ((paymentBatches.length - index - 1) * 4))

    return {
      id: `${invoice.id}-receipt-${index + 1}`,
      number: `RCT-${invoice.number.replace(/[^\d]/g, "").slice(-4)}-${index + 1}`,
      date: receiptDate,
      amount,
      currency: invoice.currency,
      method: index === 0 ? "ach" : "wire",
      status: "applied",
      customerId: invoice.customerId,
      customerName: invoice.customerName,
      invoiceIds: [invoice.id],
      bankAccountId: invoice.entityId === "e3" ? "ba-eu" : "ba-op",
      bankAccountName: invoice.entityId === "e3" ? "EU Operating" : "Northstar Operating",
      reference: `PAY-${invoice.number}-${index + 1}`,
      entityId: invoice.entityId,
      createdBy: "system",
      createdAt: receiptDate,
    }
  })
}

export async function getPayablesBillById(id: string): Promise<Bill | null> {
  await ensureDetailRouteState()
  await delay()
  return bills.find(candidate => candidate.id === id) ?? null
}

export async function getPayablesVendorById(id: string): Promise<Vendor | null> {
  await ensureDetailRouteState()
  await delay()
  return vendors.find(candidate => candidate.id === id) ?? null
}

export async function getPayablesBillPayments(id: string, filters?: FinanceFilters): Promise<Payment[]> {
  await ensureDetailRouteState()
  await delay()

  return filterByOptionalDateRange(
    payments.filter(payment => payment.billIds.includes(id)),
    payment => payment.date,
    filters
  )
}

export async function getPayablesBillDocuments(id: string): Promise<Document[]> {
  await ensureDetailRouteState()
  await delay()
  return payableDocuments.filter(document => document.relatedEntityId === id)
}

export async function getBillDetailRouteData(id: string, filters?: FinanceFilters): Promise<BillDetailRouteData | null> {
  const bill = await getPayablesBillById(id)

  if (!bill) {
    return null
  }

  const [vendor, billPayments, documents] = await Promise.all([
    getPayablesVendorById(bill.vendorId),
    getPayablesBillPayments(id, filters),
    getPayablesBillDocuments(id),
  ])

  return {
    bill,
    vendor,
    payments: billPayments,
    documents,
  }
}

export async function getReceivablesInvoiceById(id: string): Promise<Invoice | null> {
  try {
    const detail = await fetchInternalApi<SerializedInvoiceDetailRouteData>(`/api/receivables/invoices/${id}`)
    return hydrateInvoice(detail.invoice)
  } catch (error) {
    if (error instanceof InternalApiError && error.status === 404) {
      return null
    }
    throw error
  }
}

export async function getReceivablesCustomerById(id: string): Promise<Customer | null> {
  try {
    const customer = await fetchInternalApi<SerializedCustomer>(`/api/receivables/customers/${id}`)
    return hydrateCustomer(customer)
  } catch (error) {
    if (error instanceof InternalApiError && error.status === 404) {
      return null
    }
    throw error
  }
}

export async function getReceivablesInvoiceDocuments(id: string): Promise<Document[]> {
  try {
    const detail = await fetchInternalApi<SerializedInvoiceDetailRouteData>(`/api/receivables/invoices/${id}`)
    return detail.documents.map(hydrateDocument)
  } catch (error) {
    if (error instanceof InternalApiError && error.status === 404) {
      return []
    }
    throw error
  }
}

export async function getReceivablesInvoiceReceipts(id: string, filters?: FinanceFilters): Promise<Receipt[]> {
  const searchParams = new URLSearchParams()

  if (filters?.entityId) {
    searchParams.set("entityId", filters.entityId)
  }

  if (filters?.dateRange) {
    searchParams.set("dateStart", filters.dateRange.startDate.toISOString())
    searchParams.set("dateEnd", filters.dateRange.endDate.toISOString())
    if (filters.dateRange.preset) {
      searchParams.set("datePreset", filters.dateRange.preset)
    }
  }

  const detail = await fetchInternalApi<SerializedInvoiceDetailRouteData>(
    `/api/receivables/invoices/${id}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`
  )

  return detail.receipts.map(hydrateReceipt)
}

export async function getInvoiceDetailRouteData(id: string, filters?: FinanceFilters): Promise<InvoiceDetailRouteData | null> {
  const searchParams = new URLSearchParams()

  if (filters?.entityId) {
    searchParams.set("entityId", filters.entityId)
  }

  if (filters?.dateRange) {
    searchParams.set("dateStart", filters.dateRange.startDate.toISOString())
    searchParams.set("dateEnd", filters.dateRange.endDate.toISOString())
    if (filters.dateRange.preset) {
      searchParams.set("datePreset", filters.dateRange.preset)
    }
  }

  try {
    const detail = await fetchInternalApi<SerializedInvoiceDetailRouteData>(
      `/api/receivables/invoices/${id}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`
    )

    return hydrateInvoiceDetailRouteData(detail)
  } catch (error) {
    if (error instanceof InternalApiError && error.status === 404) {
      return null
    }
    throw error
  }
}

export async function getLedgerJournalEntryById(id: string): Promise<JournalEntry | null> {
  await ensureDetailRouteState()
  await delay()
  return journalEntries.find(candidate => candidate.id === id) ?? null
}

export async function getJournalEntryDetailRouteData(id: string): Promise<JournalEntryDetailRouteData | null> {
  const journal = await getLedgerJournalEntryById(id)
  return journal ? { journal } : null
}

export async function getLedgerAccountById(id: string): Promise<Account | null> {
  await ensureDetailRouteState()
  await delay()
  return accounts.find(candidate => candidate.id === id) ?? null
}

export async function getLedgerJournalsByAccountId(accountId: string, filters?: FinanceFilters): Promise<JournalEntry[]> {
  await ensureDetailRouteState()
  await delay()

  return journalEntries
    .filter(journal => journal.lines.some(line => line.accountId === accountId))
    .filter(journal => !filters?.dateRange || isInDateRange(journal.date, filters.dateRange))
}

export async function getLedgerTransactionsByAccountId(accountId: string, filters?: FinanceFilters): Promise<Transaction[]> {
  await ensureDetailRouteState()
  await delay()

  const scoped = transactions.filter(transaction => transaction.accountId === accountId)
  return filterByOptionalDateRange(scoped, transaction => transaction.date, filters)
}

export async function getAccountDetailRouteData(id: string, filters?: FinanceFilters): Promise<AccountDetailRouteData | null> {
  const account = await getLedgerAccountById(id)

  if (!account) {
    return null
  }

  const [accountJournals, accountTransactions] = await Promise.all([
    getLedgerJournalsByAccountId(id, filters),
    getLedgerTransactionsByAccountId(id, filters),
  ])

  return {
    account,
    journals: accountJournals,
    transactions: accountTransactions,
    balanceTrend: buildAccountBalanceTrend(account, accountJournals, filters),
  }
}

export async function getBankAccountDetailRouteData(id: string, filters: FinanceFilters): Promise<BankAccountDetailRouteData | null> {
  const account = await getBankAccountById(id)

  if (!account) {
    return null
  }

  const [allTransactions, reconciliationResult, reconciliationSummary] = await Promise.all([
    getLegacyTransactions(
      {
        ...filters,
        entityId: account.entityId,
      },
      undefined,
      undefined,
      undefined,
      { key: "date", direction: "desc" },
      1,
      200
    ),
    getReconciliationItems(id, undefined, { key: "date", direction: "desc" }, 1, 200),
    getReconciliationSummary(id),
  ])

  const scopedTransactions = allTransactions.data.filter(transaction => transaction.bankAccountId === id)

  return {
    account,
    transactions: scopedTransactions,
    reconciliationItems: reconciliationResult.data,
    reconciliationSummary,
    balanceTrend: buildBankBalanceTrend(account, scopedTransactions, filters),
  }
}

export async function getContractsRevenueContractById(id: string): Promise<Contract | null> {
  await ensureDetailRouteState()
  await delay()
  return contracts.find(candidate => candidate.id === id) ?? null
}

export async function getContractsRevenueScheduleByContractId(contractId: string): Promise<RevenueSchedule | null> {
  await ensureDetailRouteState()
  await delay()
  return revenueSchedules.find(candidate => candidate.contractId === contractId) ?? null
}

export async function getContractsRevenueScheduleLinesByContractId(contractId: string, filters?: FinanceFilters): Promise<RevenueScheduleLine[]> {
  await ensureDetailRouteState()
  await delay()
  const schedule = revenueSchedules.find(candidate => candidate.contractId === contractId)
  if (!schedule) {
    return []
  }

  return filterByOptionalDateRange(
    revenueScheduleLines.filter(candidate => candidate.scheduleId === schedule.id),
    line => line.recognitionDate,
    filters
  )
}

export async function getContractsRevenueObligationsByContractId(contractId: string): Promise<PerformanceObligation[]> {
  await ensureDetailRouteState()
  await delay()
  return performanceObligations.filter(candidate => candidate.contractId === contractId)
}

export async function getContractsRevenueEventsByContractId(contractId: string, filters?: FinanceFilters): Promise<RevenueRecognitionEvent[]> {
  await ensureDetailRouteState()
  await delay()

  return filterByOptionalDateRange(
    revenueRecognitionEvents.filter(candidate => candidate.contractId === contractId),
    event => event.recognitionDate,
    filters
  )
}

export async function getContractDetailRouteData(id: string, filters?: FinanceFilters): Promise<ContractDetailRouteData | null> {
  const contract = await getContractsRevenueContractById(id)

  if (!contract) {
    return null
  }

  const [customer, schedule, scheduleLines, obligations, recognitionEvents] = await Promise.all([
    getReceivablesCustomerById(contract.customerId),
    getContractsRevenueScheduleByContractId(id),
    getContractsRevenueScheduleLinesByContractId(id, filters),
    getContractsRevenueObligationsByContractId(id),
    getContractsRevenueEventsByContractId(id, filters),
  ])

  return {
    contract,
    customer,
    schedule,
    scheduleLines,
    obligations,
    recognitionEvents,
  }
}

export async function getFixedAssetsAssetById(id: string): Promise<FixedAsset | null> {
  await ensureDetailRouteState()
  await delay()
  return fixedAssets.find(candidate => candidate.id === id) ?? null
}

export async function getFixedAssetsBookByAssetId(assetId: string): Promise<AssetBook | null> {
  await ensureDetailRouteState()
  await delay()
  return assetBooks.find(candidate => candidate.assetId === assetId) ?? null
}

export async function getFixedAssetsDepreciationByAssetId(assetId: string, filters?: FinanceFilters): Promise<DepreciationScheduleLine[]> {
  await ensureDetailRouteState()
  await delay()

  return filterByOptionalDateRange(
    depreciationScheduleLines.filter(candidate => candidate.assetId === assetId),
    line => line.scheduledDate,
    filters
  )
}

export async function getFixedAssetsLifecycleByAssetId(assetId: string, filters?: FinanceFilters) {
  await ensureDetailRouteState()
  await delay()

  return filterByOptionalDateRange(
    assetLifecycleEvents.filter(candidate => candidate.assetId === assetId),
    event => event.eventDate,
    filters
  )
}

export async function getFixedAssetDetailRouteData(id: string, filters?: FinanceFilters): Promise<FixedAssetDetailRouteData | null> {
  const asset = await getFixedAssetsAssetById(id)

  if (!asset) {
    return null
  }

  const [book, depreciationLines, lifecycleEventsForAsset] = await Promise.all([
    getFixedAssetsBookByAssetId(id),
    getFixedAssetsDepreciationByAssetId(id, filters),
    getFixedAssetsLifecycleByAssetId(id, filters),
  ])

  return {
    asset,
    book,
    depreciationLines,
    lifecycleEvents: lifecycleEventsForAsset,
  }
}
