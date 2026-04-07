import { currentUser } from '@/lib/mock-data/identity'
import { accounts, journalEntries } from '@/lib/mock-data/accounting'
import { entities } from '@/lib/mock-data/organization'
import { bills } from '@/lib/mock-data/payables'
import { customers, invoices } from '@/lib/mock-data/receivables'
import { savedViews } from '@/lib/mock-data/workflow'
import { vendors } from '@/lib/mock-data/payables'
import type { FinanceFilters, SavedView, SearchResult, SearchResultsByType } from '@/lib/types'
import { delay, matchesFinanceFilters } from './base'

const savedViewStore = [...savedViews]

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

export async function getSavedViews(module?: string): Promise<SavedView[]> {
  await delay()
  return (module ? savedViewStore.filter(view => view.module === module) : savedViewStore).map(view => ({ ...view }))
}

export async function saveView(view: Partial<SavedView> & Pick<SavedView, 'name' | 'module' | 'filters'>): Promise<SavedView> {
  await delay()

  if (view.id) {
    const existing = savedViewStore.find(candidate => candidate.id === view.id)
    if (existing) {
      Object.assign(existing, view, { updatedAt: new Date() })
      if (existing.isDefault) {
        savedViewStore.forEach(candidate => {
          if (candidate.module === existing.module && candidate.id !== existing.id) {
            candidate.isDefault = false
          }
        })
      }
      return existing
    }
  }

  const created: SavedView = {
    id: `sv-${Date.now().toString(36)}-${savedViewStore.length + 1}`,
    name: view.name,
    module: view.module,
    filters: view.filters,
    columns: view.columns,
    sortBy: view.sortBy,
    sortDirection: view.sortDirection,
    isDefault: view.isDefault ?? false,
    roleScope: view.roleScope,
    createdBy: currentUser.id,
    createdAt: new Date(),
  }

  if (created.isDefault) {
    savedViewStore.forEach(candidate => {
      if (candidate.module === created.module) {
        candidate.isDefault = false
      }
    })
  }

  savedViewStore.push(created)
  return { ...created }
}

export async function getSavedViewById(id: string): Promise<SavedView | null> {
  await delay()
  const view = savedViewStore.find(candidate => candidate.id === id)
  return view ? { ...view } : null
}

export async function createSavedView(view: Omit<SavedView, 'id' | 'createdBy' | 'createdAt'>): Promise<{ success: boolean; view?: SavedView }> {
  const created = await saveView(view)
  return { success: true, view: created }
}

export async function updateSavedView(id: string, updates: Partial<SavedView>): Promise<{ success: boolean }> {
  const existing = savedViewStore.find(view => view.id === id)
  if (!existing) {
    return { success: false }
  }

  await saveView({
    ...existing,
    ...updates,
    id,
  })
  return { success: true }
}

export async function deleteSavedView(id: string): Promise<{ success: boolean }> {
  await delay()
  const index = savedViewStore.findIndex(view => view.id === id)
  if (index === -1) {
    return { success: false }
  }
  savedViewStore.splice(index, 1)
  return { success: true }
}

export async function setDefaultView(id: string, module: string): Promise<{ success: boolean }> {
  await delay()
  savedViewStore.forEach(view => {
    if (view.module === module) {
      view.isDefault = view.id === id
      view.updatedAt = new Date()
    }
  })
  return { success: true }
}
