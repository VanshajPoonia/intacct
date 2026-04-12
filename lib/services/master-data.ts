import type { Account, Entity, FinanceFilters, JournalEntry, PaginatedResponse, SortConfig, Transaction } from "@/lib/types"
import { delay, isInDateRange, matchesFinanceFilters, paginate, sortItems } from "./base"
import { getRuntimeDataset } from "./runtime-data"

let entities: Entity[] = []
let accounts: Account[] = []
let transactions: Transaction[] = []
let journalEntries: JournalEntry[] = []

async function ensureMasterDataState() {
  const [{ entities: nextEntities }, accounting] = await Promise.all([
    getRuntimeDataset<{ entities: Entity[] }>("organization"),
    getRuntimeDataset<{ accounts: Account[]; transactions: Transaction[]; journalEntries: JournalEntry[] }>("accounting"),
  ])

  entities = nextEntities
  accounts = accounting.accounts
  transactions = accounting.transactions
  journalEntries = accounting.journalEntries
}

export async function getEntities(): Promise<Entity[]> {
  await ensureMasterDataState()
  await delay()
  return [...entities]
}

export async function getTransactions(
  filters: FinanceFilters,
  search?: string,
  typeFilter?: string[],
  reconStatusFilter?: string,
  sort?: SortConfig,
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedResponse<Transaction>> {
  await ensureMasterDataState()
  await delay()

  let filtered = transactions.filter(transaction => {
    if (!matchesFinanceFilters(transaction, filters)) {
      return false
    }

    if (!isInDateRange(transaction.date, filters.dateRange)) {
      return false
    }

    if (typeFilter?.length && !typeFilter.includes(transaction.type)) {
      return false
    }

    if (reconStatusFilter && transaction.reconciliationStatus !== reconStatusFilter) {
      return false
    }

    if (!search) {
      return true
    }

    const haystack = [
      transaction.description,
      transaction.reference,
      transaction.accountName,
      transaction.bankAccountName,
      transaction.category,
      transaction.entityName,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    return haystack.includes(search.toLowerCase())
  })

  filtered = sort ? sortItems(filtered, sort) : [...filtered].sort((left, right) => right.date.getTime() - left.date.getTime())
  return paginate(filtered, page, pageSize)
}

export async function getJournalEntries(
  filters: FinanceFilters,
  search?: string,
  statusFilter?: string[],
  sort?: SortConfig,
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedResponse<JournalEntry>> {
  await ensureMasterDataState()
  await delay()

  let filtered = journalEntries.filter(entry => {
    if (!matchesFinanceFilters(entry, filters)) {
      return false
    }

    if (!isInDateRange(entry.date, filters.dateRange)) {
      return false
    }

    if (statusFilter?.length && !statusFilter.includes(entry.status)) {
      return false
    }

    if (!search) {
      return true
    }

    const haystack = [entry.number, entry.description, entry.createdBy].join(' ').toLowerCase()
    return haystack.includes(search.toLowerCase())
  })

  filtered = sort ? sortItems(filtered, sort) : [...filtered].sort((left, right) => right.date.getTime() - left.date.getTime())
  return paginate(filtered, page, pageSize)
}

export async function getChartOfAccounts(
  search?: string,
  typeFilter?: string[],
  sort?: SortConfig,
  filters?: FinanceFilters
): Promise<Account[]> {
  await ensureMasterDataState()
  await delay()

  let filtered = [...accounts]

  if (filters) {
    filtered = filtered.filter(account => {
      if (!account.entityId) {
        return true
      }

      return matchesFinanceFilters(account, filters)
    })
  }

  if (typeFilter?.length) {
    filtered = filtered.filter(account => typeFilter.includes(account.type))
  }

  if (search) {
    const query = search.toLowerCase()
    filtered = filtered.filter(account =>
      [account.number, account.name, account.category, account.subCategory]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query)
    )
  }

  return sort ? sortItems(filtered, sort) : filtered
}
