import type { Customer, FinanceFilters, Invoice, PaginatedResponse, Receipt, SortConfig } from "@/lib/types"
import { fetchInternalApi, InternalApiError } from "./internal-api"
import {
  hydrateCustomer,
  hydrateInvoice,
  hydrateInvoiceDetailRouteData,
  hydrateReceipt,
  type SerializedCustomer,
  type SerializedInvoice,
  type SerializedInvoiceDetailRouteData,
  type SerializedReceipt,
} from "./receivables-hydration"

type SerializedPaginatedResponse<T> = Omit<PaginatedResponse<T>, "data"> & {
  data: T[]
}

function appendCommonReceivablesFilters(searchParams: URLSearchParams, filters?: Partial<FinanceFilters>) {
  if (filters?.entityId) {
    searchParams.set("entityId", filters.entityId)
  }

  if (filters?.customerId) {
    searchParams.set("customerId", filters.customerId)
  }

  if (filters?.dateRange) {
    searchParams.set("dateStart", filters.dateRange.startDate.toISOString())
    searchParams.set("dateEnd", filters.dateRange.endDate.toISOString())
    if (filters.dateRange.preset) {
      searchParams.set("datePreset", filters.dateRange.preset)
    }
  }
}

function appendSearchSortAndPaging(
  searchParams: URLSearchParams,
  options: {
    search?: string
    sort?: SortConfig
    page?: number
    pageSize?: number
  }
) {
  if (options.search) {
    searchParams.set("search", options.search)
  }

  if (options.sort) {
    searchParams.set("sortKey", options.sort.key)
    searchParams.set("sortDirection", options.sort.direction)
  }

  searchParams.set("page", String(options.page ?? 1))
  searchParams.set("pageSize", String(options.pageSize ?? 10))
}

export async function getInvoices(
  filters?: FinanceFilters,
  search?: string,
  statusFilter?: string[],
  sort?: SortConfig,
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedResponse<Invoice>> {
  const searchParams = new URLSearchParams()

  appendCommonReceivablesFilters(searchParams, filters)
  appendSearchSortAndPaging(searchParams, { search, sort, page, pageSize })
  statusFilter?.forEach(status => searchParams.append("status", status))

  const result = await fetchInternalApi<SerializedPaginatedResponse<SerializedInvoice>>(
    `/api/receivables/invoices?${searchParams.toString()}`
  )

  return {
    ...result,
    data: result.data.map(hydrateInvoice),
  }
}

export async function getInvoiceById(id: string): Promise<Invoice | null> {
  try {
    const result = await fetchInternalApi<SerializedInvoiceDetailRouteData>(`/api/receivables/invoices/${id}`)
    return hydrateInvoiceDetailRouteData(result).invoice
  } catch (error) {
    if (error instanceof InternalApiError && error.status === 404) {
      return null
    }

    throw error
  }
}

export async function getCustomers(
  search?: string,
  statusFilter?: string[],
  sort?: SortConfig,
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedResponse<Customer>> {
  const searchParams = new URLSearchParams()

  appendSearchSortAndPaging(searchParams, { search, sort, page, pageSize })
  statusFilter?.forEach(status => searchParams.append("status", status))

  const result = await fetchInternalApi<SerializedPaginatedResponse<SerializedCustomer>>(
    `/api/receivables/customers?${searchParams.toString()}`
  )

  return {
    ...result,
    data: result.data.map(hydrateCustomer),
  }
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  try {
    const result = await fetchInternalApi<SerializedCustomer>(`/api/receivables/customers/${id}`)
    return hydrateCustomer(result)
  } catch (error) {
    if (error instanceof InternalApiError && error.status === 404) {
      return null
    }

    throw error
  }
}

export async function getReceipts(
  filters?: Partial<FinanceFilters>,
  search?: string,
  statusFilter?: string[],
  methodFilter?: string[],
  sort?: SortConfig,
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedResponse<Receipt>> {
  const searchParams = new URLSearchParams()

  appendCommonReceivablesFilters(searchParams, filters)
  appendSearchSortAndPaging(searchParams, { search, sort, page, pageSize })
  statusFilter?.forEach(status => searchParams.append("status", status))
  methodFilter?.forEach(method => searchParams.append("method", method))

  const result = await fetchInternalApi<SerializedPaginatedResponse<SerializedReceipt>>(
    `/api/receivables/receipts?${searchParams.toString()}`
  )

  return {
    ...result,
    data: result.data.map(hydrateReceipt),
  }
}

export async function getReceiptById(id: string): Promise<Receipt | null> {
  try {
    const result = await fetchInternalApi<SerializedReceipt>(`/api/receivables/receipts/${id}`)
    return hydrateReceipt(result)
  } catch (error) {
    if (error instanceof InternalApiError && error.status === 404) {
      return null
    }

    throw error
  }
}
