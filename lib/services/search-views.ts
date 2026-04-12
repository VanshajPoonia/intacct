import type { Account, Bill, Customer, Entity, FinanceFilters, Invoice, JournalEntry, RoleId, SavedView, SearchResult, SearchResultsByType, Vendor } from "@/lib/types"
import { delay, matchesFinanceFilters } from "./base"
import { fetchInternalApi } from "./internal-api"
import { getCurrentUser } from "./identity"
import { getRuntimeDataset } from "./runtime-data"

function buildScore(label: string, query: string) {
  const loweredLabel = label.toLowerCase()
  const loweredQuery = query.toLowerCase()
  if (loweredLabel.startsWith(loweredQuery)) {
    return 100
  }
  if (loweredLabel.includes(loweredQuery)) {
    return 75
  }
  return 50
}

function groupResults(results: SearchResult[]): SearchResultsByType {
  return {
    entities: results.filter(result => result.type === 'entity'),
    accounts: results.filter(result => result.type === 'account'),
    vendors: results.filter(result => result.type === 'vendor'),
    customers: results.filter(result => result.type === 'customer'),
    bills: results.filter(result => result.type === 'bill'),
    invoices: results.filter(result => result.type === 'invoice'),
    journalEntries: results.filter(result => result.type === 'journal_entry'),
  }
}

export async function searchAll(query: string, filters?: Partial<FinanceFilters>): Promise<SearchResultsByType> {
  await delay()

  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) {
    return groupResults([])
  }

  const [{ accounts, journalEntries }, { entities }, { bills, vendors }, { customers, invoices }] = await Promise.all([
    getRuntimeDataset<{ accounts: Account[]; journalEntries: JournalEntry[] }>("accounting"),
    getRuntimeDataset<{ entities: Entity[] }>("organization"),
    getRuntimeDataset<{ bills: Bill[]; vendors: Vendor[] }>("payables"),
    getRuntimeDataset<{ customers: Customer[]; invoices: Invoice[] }>("receivables"),
  ])

  const results: SearchResult[] = [
    ...entities
      .filter(entity => entity.name.toLowerCase().includes(normalizedQuery) || entity.code.toLowerCase().includes(normalizedQuery))
      .map(entity => ({
        id: entity.id,
        type: 'entity' as const,
        label: entity.name,
        sublabel: entity.code,
        href: `/company/entities`,
        entityId: entity.id,
        score: buildScore(entity.name, normalizedQuery),
      })),
    ...accounts
      .filter(account => `${account.number} ${account.name}`.toLowerCase().includes(normalizedQuery))
      .map(account => ({
        id: account.id,
        type: 'account' as const,
        label: `${account.number} ${account.name}`,
        sublabel: account.category,
        href: `/general-ledger/chart-of-accounts`,
        score: buildScore(account.name, normalizedQuery),
      })),
    ...vendors
      .filter(vendor => `${vendor.name} ${vendor.code}`.toLowerCase().includes(normalizedQuery))
      .map(vendor => ({
        id: vendor.id,
        type: 'vendor' as const,
        label: vendor.name,
        sublabel: vendor.code,
        href: `/accounts-payable/vendors`,
        score: buildScore(vendor.name, normalizedQuery),
      })),
    ...customers
      .filter(customer => `${customer.name} ${customer.code}`.toLowerCase().includes(normalizedQuery))
      .map(customer => ({
        id: customer.id,
        type: 'customer' as const,
        label: customer.name,
        sublabel: customer.code,
        href: `/accounts-receivable/customers`,
        score: buildScore(customer.name, normalizedQuery),
      })),
    ...bills
      .filter(bill => `${bill.number} ${bill.vendorName} ${bill.description}`.toLowerCase().includes(normalizedQuery))
      .filter(bill => !filters || matchesFinanceFilters(bill, filters))
      .map(bill => ({
        id: bill.id,
        type: 'bill' as const,
        label: bill.number,
        sublabel: bill.vendorName,
        href: `/accounts-payable/bills`,
        entityId: bill.entityId,
        score: buildScore(bill.number, normalizedQuery),
      })),
    ...invoices
      .filter(invoice => `${invoice.number} ${invoice.customerName} ${invoice.description}`.toLowerCase().includes(normalizedQuery))
      .filter(invoice => !filters || matchesFinanceFilters(invoice, filters))
      .map(invoice => ({
        id: invoice.id,
        type: 'invoice' as const,
        label: invoice.number,
        sublabel: invoice.customerName,
        href: `/accounts-receivable/invoices`,
        entityId: invoice.entityId,
        score: buildScore(invoice.number, normalizedQuery),
      })),
    ...journalEntries
      .filter(entry => `${entry.number} ${entry.description}`.toLowerCase().includes(normalizedQuery))
      .filter(entry => !filters || matchesFinanceFilters(entry, filters))
      .map(entry => ({
        id: entry.id,
        type: 'journal_entry' as const,
        label: entry.number,
        sublabel: entry.description,
        href: `/general-ledger/journal-entries`,
        entityId: entry.entityId,
        score: buildScore(entry.number, normalizedQuery),
      })),
  ]

  return groupResults(results.sort((left, right) => right.score - left.score))
}

type SavedViewRow = {
  id: string
  module: string
  name: string
  filters: SavedView["filters"]
  columns?: SavedView["columns"] | null
  sort_by?: string | null
  sort_direction?: "asc" | "desc" | null
  is_default: boolean
  role_scope?: string | string[] | null
  created_by: string
  created_at: string
  updated_at?: string | null
}

function normalizeSavedView(row: SavedViewRow): SavedView {
  const roleScope = (Array.isArray(row.role_scope)
    ? row.role_scope
    : typeof row.role_scope === "string" && row.role_scope.length > 0
      ? row.role_scope.split(",")
      : undefined) as RoleId[] | undefined

  return {
    id: row.id,
    module: row.module,
    name: row.name,
    filters: row.filters,
    columns: row.columns ?? undefined,
    sortBy: row.sort_by ?? undefined,
    sortDirection: row.sort_direction ?? undefined,
    isDefault: row.is_default,
    roleScope,
    createdBy: row.created_by,
    createdAt: new Date(row.created_at),
    updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
  }
}

export async function getSavedViews(module?: string): Promise<SavedView[]> {
  const response = await fetchInternalApi<{ data: SavedViewRow[] }>(`/api/saved-views${module ? `?module=${encodeURIComponent(module)}` : ""}`)
  return response.data.map(normalizeSavedView)
}

export async function saveView(view: Partial<SavedView> & Pick<SavedView, 'name' | 'module' | 'filters'>): Promise<SavedView> {
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    throw new Error("Authentication required.")
  }

  const response = await fetchInternalApi<{ data: SavedViewRow }>("/api/saved-views", {
    method: "POST",
    body: JSON.stringify({
      ...view,
      createdBy: currentUser.id,
      createdAt: new Date().toISOString(),
    }),
  })

  return normalizeSavedView(response.data)
}

export async function getSavedViewById(id: string): Promise<SavedView | null> {
  const response = await fetchInternalApi<{ data: SavedViewRow | null }>(`/api/saved-views/${id}`)
  return response.data ? normalizeSavedView(response.data) : null
}

export async function createSavedView(view: Omit<SavedView, 'id' | 'createdBy' | 'createdAt'>): Promise<{ success: boolean; view?: SavedView }> {
  const created = await saveView(view)
  return { success: true, view: created }
}

export async function updateSavedView(id: string, updates: Partial<SavedView>): Promise<{ success: boolean }> {
  await fetchInternalApi<{ data: SavedViewRow }>(`/api/saved-views/${id}`, {
    method: "PATCH",
    body: JSON.stringify(updates),
  })
  return { success: true }
}

export async function deleteSavedView(id: string): Promise<{ success: boolean }> {
  await fetchInternalApi<{ success: boolean }>(`/api/saved-views/${id}`, {
    method: "DELETE",
  })
  return { success: true }
}

export async function setDefaultView(id: string, module: string): Promise<{ success: boolean }> {
  await fetchInternalApi<{ data: SavedViewRow }>(`/api/saved-views/${id}`, {
    method: "PATCH",
    body: JSON.stringify({
      module,
      isDefault: true,
    }),
  })
  return { success: true }
}
