import { bills } from '@/lib/mock-data/payables'
import type { Bill, FinanceFilters, PaginatedResponse, SortConfig } from '@/lib/types'
import { delay, isInDateRange, matchesFinanceFilters, paginate, sortItems } from './base'

export async function getBills(
  filters: FinanceFilters,
  search?: string,
  statusFilter?: string[],
  sort?: SortConfig,
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedResponse<Bill>> {
  await delay()

  let filtered = bills.filter(bill => {
    if (!matchesFinanceFilters(bill, filters)) {
      return false
    }

    if (!isInDateRange(bill.date, filters.dateRange)) {
      return false
    }

    if (statusFilter?.length && !statusFilter.includes(bill.status)) {
      return false
    }

    if (!search) {
      return true
    }

    const haystack = [bill.number, bill.vendorName, bill.description, bill.terms].filter(Boolean).join(' ').toLowerCase()
    return haystack.includes(search.toLowerCase())
  })

  filtered = sort ? sortItems(filtered, sort) : [...filtered].sort((left, right) => right.date.getTime() - left.date.getTime())
  return paginate(filtered, page, pageSize)
}
