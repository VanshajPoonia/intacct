import { invoices } from '@/lib/mock-data/receivables'
import type { FinanceFilters, Invoice, PaginatedResponse, SortConfig } from '@/lib/types'
import { delay, isInDateRange, matchesFinanceFilters, paginate, sortItems } from './base'

export async function getInvoices(
  filters: FinanceFilters,
  search?: string,
  statusFilter?: string[],
  sort?: SortConfig,
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedResponse<Invoice>> {
  await delay()

  let filtered = invoices.filter(invoice => {
    if (!matchesFinanceFilters(invoice, filters)) {
      return false
    }

    if (!isInDateRange(invoice.date, filters.dateRange)) {
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
