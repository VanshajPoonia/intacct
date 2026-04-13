import type { Bill, FinanceFilters, PaginatedResponse, Payment, SortConfig, Vendor } from "@/lib/types"
import { delay, isInDateRange, matchesFinanceFilters, paginate, sortItems } from "./base"
import { getRuntimeDataset } from "./runtime-data"

let bills: Bill[] = []
let payments: Payment[] = []
let vendors: Vendor[] = []

async function ensurePayablesState() {
  const dataset = await getRuntimeDataset<{
    bills: Bill[]
    payments: Payment[]
    vendors: Vendor[]
  }>("payables")
  bills = dataset.bills
  payments = dataset.payments
  vendors = dataset.vendors
}

export async function getBills(
  filters?: FinanceFilters,
  search?: string,
  statusFilter?: string[],
  sort?: SortConfig,
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedResponse<Bill>> {
  await ensurePayablesState()
  await delay()

  let filtered = bills.filter(bill => {
    if (filters && !matchesFinanceFilters(bill, filters)) {
      return false
    }

    if (filters?.dateRange && !isInDateRange(bill.date, filters.dateRange)) {
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

export async function getBillById(id: string): Promise<Bill | null> {
  await ensurePayablesState()
  await delay()
  return bills.find(bill => bill.id === id) ?? null
}

export async function getVendors(
  search?: string,
  statusFilter?: string[],
  sort?: SortConfig,
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedResponse<Vendor>> {
  await ensurePayablesState()
  await delay()

  let filtered = [...vendors]

  if (statusFilter?.length) {
    filtered = filtered.filter(vendor => statusFilter.includes(vendor.status))
  }

  if (search) {
    const normalizedSearch = search.toLowerCase()
    filtered = filtered.filter(vendor =>
      [vendor.name, vendor.code, vendor.email, vendor.remittanceEmail].filter(Boolean).join(" ").toLowerCase().includes(normalizedSearch)
    )
  }

  filtered = sort
    ? sortItems(filtered, sort)
    : [...filtered].sort((left, right) => left.name.localeCompare(right.name))

  return paginate(filtered, page, pageSize)
}

export async function getVendorById(id: string): Promise<Vendor | null> {
  await ensurePayablesState()
  await delay()
  return vendors.find(vendor => vendor.id === id) ?? null
}

export async function getPayments(
  filters?: Partial<FinanceFilters>,
  search?: string,
  statusFilter?: string[],
  methodFilter?: string[],
  sort?: SortConfig,
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedResponse<Payment>> {
  await ensurePayablesState()
  await delay()

  let filtered = payments.filter(payment => {
    if (filters && !matchesFinanceFilters(payment, filters)) {
      return false
    }

    if (filters?.dateRange && !isInDateRange(payment.date, filters.dateRange)) {
      return false
    }

    if (statusFilter?.length && !statusFilter.includes(payment.status)) {
      return false
    }

    if (methodFilter?.length && !methodFilter.includes(payment.method)) {
      return false
    }

    if (!search) {
      return true
    }

    const haystack = [payment.number, payment.vendorName, payment.reference, payment.checkNumber, payment.memo]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()

    return haystack.includes(search.toLowerCase())
  })

  filtered = sort
    ? sortItems(filtered, sort)
    : [...filtered].sort((left, right) => right.date.getTime() - left.date.getTime())

  return paginate(filtered, page, pageSize)
}

export async function getPaymentById(id: string): Promise<Payment | null> {
  await ensurePayablesState()
  await delay()
  return payments.find(payment => payment.id === id) ?? null
}
