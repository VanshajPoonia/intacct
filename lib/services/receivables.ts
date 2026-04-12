import { invoices } from '@/lib/mock-data/receivables'
import type { FinanceFilters, Invoice, PaginatedResponse, SortConfig } from '@/lib/types'
import { delay, isInDateRange, matchesFinanceFilters, paginate, sortItems } from './base'
import { fetchInternalApi, shouldUseSupabaseDataSource } from './internal-api'
import { hydrateInvoice, type SerializedInvoice } from './receivables-hydration'

type SerializedInvoicesResponse = PaginatedResponse<SerializedInvoice>

export async function getInvoices(
  filters?: FinanceFilters,
  search?: string,
  statusFilter?: string[],
  sort?: SortConfig,
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedResponse<Invoice>> {
  if (shouldUseSupabaseDataSource()) {
    const searchParams = new URLSearchParams()

    if (search) {
      searchParams.set('search', search)
    }

    statusFilter?.forEach(status => searchParams.append('status', status))

    if (sort) {
      searchParams.set('sortKey', sort.key)
      searchParams.set('sortDirection', sort.direction)
    }

    searchParams.set('page', String(page))
    searchParams.set('pageSize', String(pageSize))

    if (filters?.entityId) {
      searchParams.set('entityId', filters.entityId)
    }

    if (filters?.customerId) {
      searchParams.set('customerId', filters.customerId)
    }

    if (filters?.dateRange) {
      searchParams.set('dateStart', filters.dateRange.startDate.toISOString())
      searchParams.set('dateEnd', filters.dateRange.endDate.toISOString())
      if (filters.dateRange.preset) {
        searchParams.set('datePreset', filters.dateRange.preset)
      }
    }

    const result = await fetchInternalApi<SerializedInvoicesResponse>(`/api/receivables/invoices?${searchParams.toString()}`)

    return {
      ...result,
      data: result.data.map(hydrateInvoice),
    }
  }

  await delay()

  let filtered = invoices.filter(invoice => {
    if (filters && !matchesFinanceFilters(invoice, filters)) {
      return false
    }

    if (filters?.dateRange && !isInDateRange(invoice.date, filters.dateRange)) {
      return false
    }

    if (statusFilter?.length && !statusFilter.includes(invoice.status)) {
      return false
    }

    if (!search) {
      return true
    }

    const haystack = [invoice.number, invoice.customerName, invoice.description].filter(Boolean).join(' ').toLowerCase()
    return haystack.includes(search.toLowerCase())
  })

  filtered = sort ? sortItems(filtered, sort) : [...filtered].sort((left, right) => right.date.getTime() - left.date.getTime())
  return paginate(filtered, page, pageSize)
}
