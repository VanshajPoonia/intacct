import type { FinanceFilters, Invoice, PaginatedResponse, SortConfig } from '@/lib/types'
import { fetchInternalApi } from './internal-api'
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
