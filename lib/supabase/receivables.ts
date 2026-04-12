import type { Customer, Document, FinanceFilters, Invoice, InvoiceLineItem, PaginatedResponse, Receipt, SortConfig } from "@/lib/types"
import type { Database } from "@/lib/types/supabase"
import { isInDateRange, matchesFinanceFilters, paginate, sortItems } from "@/lib/services/base"
import { createSupabaseAdminClient } from "./admin"

type CustomerRow = Database["public"]["Tables"]["customers"]["Row"]
type DocumentRow = Database["public"]["Tables"]["documents"]["Row"]
type InvoiceLineRow = Database["public"]["Tables"]["invoice_lines"]["Row"]
type InvoiceRow = Database["public"]["Tables"]["invoices"]["Row"]
type InvoiceInsert = Database["public"]["Tables"]["invoices"]["Insert"]
type ReceiptRow = Database["public"]["Tables"]["receipts"]["Row"]

function getDerivedInvoiceStatus(status: Invoice["status"], dueDate: Date, openBalance: number) {
  if (!["draft", "paid", "voided"].includes(status) && openBalance > 0 && dueDate < new Date()) {
    return "overdue" as const
  }

  return status
}

function mapCustomer(row: CustomerRow): Customer {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    email: row.email,
    phone: row.phone ?? undefined,
    address: row.address ?? undefined,
    billingAddress: row.billing_address ?? undefined,
    creditLimit: row.credit_limit,
    paymentTerms: row.payment_terms,
    status: row.status as Customer["status"],
    balance: row.balance,
    lifetimeRevenue: row.lifetime_revenue,
    lastPaymentDate: row.last_payment_date ? new Date(row.last_payment_date) : undefined,
    lastPaymentAmount: row.last_payment_amount ?? undefined,
    currency: row.currency,
    createdAt: new Date(row.created_at),
    collectionNotes: row.collection_notes ?? undefined,
    assignedCollector: row.assigned_collector ?? undefined,
    collectionPriority: (row.collection_priority as Customer["collectionPriority"]) ?? undefined,
  }
}

function mapInvoiceLine(row: InvoiceLineRow): InvoiceLineItem {
  return {
    id: row.id,
    description: row.description,
    accountId: row.account_id,
    accountName: row.account_name,
    amount: row.amount,
    quantity: row.quantity,
    unitPrice: row.unit_price,
    taxAmount: row.tax_amount ?? undefined,
    departmentId: row.department_id ?? undefined,
    departmentName: row.department_name ?? undefined,
    projectId: row.project_id ?? undefined,
    projectName: row.project_name ?? undefined,
    classId: row.class_id ?? undefined,
    className: row.class_name ?? undefined,
  }
}

function mapInvoice(row: InvoiceRow, lineItems: InvoiceLineItem[] = []): Invoice {
  const dueDate = new Date(row.due_date)
  const openBalance = row.open_balance

  return {
    id: row.id,
    number: row.number,
    customerId: row.customer_id,
    customerName: row.customer_name,
    date: new Date(row.date),
    dueDate,
    amount: row.amount,
    amountPaid: row.amount_paid ?? undefined,
    openBalance,
    currency: row.currency,
    status: getDerivedInvoiceStatus(row.status as Invoice["status"], dueDate, openBalance),
    collectionStatus: row.collection_status as Invoice["collectionStatus"],
    description: row.description ?? undefined,
    lineItems,
    entityId: row.entity_id,
    departmentId: row.department_id ?? undefined,
    departmentName: row.department_name ?? undefined,
    billingAddress: row.billing_address ?? undefined,
    memo: row.memo ?? undefined,
    createdAt: new Date(row.created_at),
    sentAt: row.sent_at ? new Date(row.sent_at) : undefined,
    paidAt: row.paid_at ? new Date(row.paid_at) : undefined,
  }
}

function mapReceipt(row: ReceiptRow): Receipt {
  return {
    id: row.id,
    number: row.number,
    date: new Date(row.date),
    amount: row.amount,
    currency: row.currency,
    method: row.method as Receipt["method"],
    status: row.status as Receipt["status"],
    customerId: row.customer_id,
    customerName: row.customer_name,
    invoiceIds: row.invoice_ids,
    bankAccountId: row.bank_account_id,
    bankAccountName: row.bank_account_name,
    checkNumber: row.check_number ?? undefined,
    reference: row.reference ?? undefined,
    memo: row.memo ?? undefined,
    entityId: row.entity_id,
    createdBy: row.created_by,
    createdAt: new Date(row.created_at),
  }
}

function mapDocument(row: DocumentRow): Document {
  return {
    id: row.id,
    number: row.number,
    type: row.type as Document["type"],
    module: row.module as Document["module"],
    title: row.title,
    status: row.status as Document["status"],
    entityId: row.entity_id,
    relatedEntityType: row.related_entity_type ?? undefined,
    relatedEntityId: row.related_entity_id ?? undefined,
    fileName: row.file_name ?? undefined,
    fileSizeBytes: row.file_size_bytes ?? undefined,
    mimeType: row.mime_type ?? undefined,
    tags: row.tags ?? undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    version: row.version,
  }
}

function getInvoiceNumberSequence(number: string) {
  const match = number.match(/(\d+)(?!.*\d)/)
  return match ? Number.parseInt(match[1], 10) : 0
}

async function getNextInvoiceIdentifiers() {
  const supabase = createSupabaseAdminClient()
  const { data, error } = await supabase.from("invoices").select("number")

  if (error) {
    throw error
  }

  const nextSequence =
    (data ?? []).reduce((maximum, row) => Math.max(maximum, getInvoiceNumberSequence(row.number)), 1100) + 1

  return {
    id: `inv-${nextSequence}`,
    number: `INV-${nextSequence}`,
    sequence: nextSequence,
  }
}

async function adjustCustomerBalance(customerId: string, delta: number) {
  if (!delta) {
    return
  }

  const supabase = createSupabaseAdminClient()
  const { data, error } = await supabase.from("customers").select("balance").eq("id", customerId).maybeSingle()

  if (error) {
    throw error
  }

  if (!data) {
    return
  }

  const { error: updateError } = await supabase
    .from("customers")
    .update({
      balance: Math.max((data.balance ?? 0) + delta, 0),
    })
    .eq("id", customerId)

  if (updateError) {
    throw updateError
  }
}

async function getInvoiceLinesByInvoiceIds(invoiceIds: string[]) {
  if (!invoiceIds.length) {
    return new Map<string, InvoiceLineItem[]>()
  }

  const supabase = createSupabaseAdminClient()
  const { data, error } = await supabase
    .from("invoice_lines")
    .select("*")
    .in("invoice_id", invoiceIds)
    .order("sort_order", { ascending: true })

  if (error) {
    throw error
  }

  return (data ?? []).reduce((accumulator, row) => {
    const current = accumulator.get(row.invoice_id) ?? []
    current.push(mapInvoiceLine(row))
    accumulator.set(row.invoice_id, current)
    return accumulator
  }, new Map<string, InvoiceLineItem[]>())
}

export async function getSupabaseInvoices(
  filters?: FinanceFilters,
  search?: string,
  statusFilter?: string[],
  sort?: SortConfig,
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedResponse<Invoice>> {
  const supabase = createSupabaseAdminClient()
  const { data, error } = await supabase.from("invoices").select("*")

  if (error) {
    throw error
  }

  const invoiceRows = data ?? []
  const lineItemsByInvoiceId = await getInvoiceLinesByInvoiceIds(invoiceRows.map(invoice => invoice.id))

  let filtered = invoiceRows.map(row => mapInvoice(row, lineItemsByInvoiceId.get(row.id) ?? []))

  if (filters) {
    filtered = filtered.filter(invoice => {
      if (!matchesFinanceFilters(invoice, filters)) {
        return false
      }

      return isInDateRange(invoice.date, filters.dateRange)
    })
  }

  if (statusFilter?.length) {
    filtered = filtered.filter(invoice => statusFilter.includes(invoice.status))
  }

  if (search) {
    const normalizedSearch = search.toLowerCase()
    filtered = filtered.filter(invoice =>
      [invoice.number, invoice.customerName, invoice.description].filter(Boolean).join(" ").toLowerCase().includes(normalizedSearch)
    )
  }

  filtered = sort
    ? sortItems(filtered, sort)
    : [...filtered].sort((left, right) => right.date.getTime() - left.date.getTime())

  return paginate(filtered, page, pageSize)
}

export async function getSupabaseCustomers(
  search?: string,
  statusFilter?: string[],
  sort?: SortConfig,
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedResponse<Customer>> {
  const supabase = createSupabaseAdminClient()
  const { data, error } = await supabase.from("customers").select("*")

  if (error) {
    throw error
  }

  let filtered = (data ?? []).map(mapCustomer)

  if (statusFilter?.length) {
    filtered = filtered.filter(customer => statusFilter.includes(customer.status))
  }

  if (search) {
    const normalizedSearch = search.toLowerCase()
    filtered = filtered.filter(customer =>
      [customer.name, customer.code, customer.email].filter(Boolean).join(" ").toLowerCase().includes(normalizedSearch)
    )
  }

  filtered = sort
    ? sortItems(filtered, sort)
    : [...filtered].sort((left, right) => left.name.localeCompare(right.name))

  return paginate(filtered, page, pageSize)
}

export async function getSupabaseReceivablesInvoiceById(id: string): Promise<Invoice | null> {
  const supabase = createSupabaseAdminClient()
  const { data, error } = await supabase.from("invoices").select("*").eq("id", id).maybeSingle()

  if (error) {
    throw error
  }

  if (!data) {
    return null
  }

  const lineItemsByInvoiceId = await getInvoiceLinesByInvoiceIds([id])
  return mapInvoice(data, lineItemsByInvoiceId.get(id) ?? [])
}

export async function getSupabaseReceivablesCustomerById(id: string): Promise<Customer | null> {
  const supabase = createSupabaseAdminClient()
  const { data, error } = await supabase.from("customers").select("*").eq("id", id).maybeSingle()

  if (error) {
    throw error
  }

  return data ? mapCustomer(data) : null
}

export async function getSupabaseReceivablesInvoiceDocuments(id: string): Promise<Document[]> {
  const supabase = createSupabaseAdminClient()
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("module", "ar")
    .eq("related_entity_type", "invoice")
    .eq("related_entity_id", id)
    .order("updated_at", { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []).map(mapDocument)
}

export async function getSupabaseReceivablesInvoiceReceipts(id: string, filters?: FinanceFilters): Promise<Receipt[]> {
  const supabase = createSupabaseAdminClient()
  const { data, error } = await supabase
    .from("receipts")
    .select("*")
    .contains("invoice_ids", [id])
    .order("date", { ascending: false })

  if (error) {
    throw error
  }

  const receipts = (data ?? []).map(mapReceipt)

  if (!filters?.dateRange) {
    return receipts
  }

  return receipts.filter(receipt => isInDateRange(receipt.date, filters.dateRange))
}

export async function getSupabaseInvoiceDetailRouteData(id: string, filters?: FinanceFilters) {
  const invoice = await getSupabaseReceivablesInvoiceById(id)

  if (!invoice) {
    return null
  }

  const [customer, receipts, documents] = await Promise.all([
    getSupabaseReceivablesCustomerById(invoice.customerId),
    getSupabaseReceivablesInvoiceReceipts(id, filters),
    getSupabaseReceivablesInvoiceDocuments(id),
  ])

  return {
    invoice,
    customer,
    receipts,
    documents,
  }
}

export async function createSupabaseInvoice(input: Partial<Invoice>): Promise<Invoice> {
  const supabase = createSupabaseAdminClient()
  const now = new Date()
  const { id, number, sequence } = await getNextInvoiceIdentifiers()
  const amount = input.amount ?? input.lineItems?.reduce((sum, item) => sum + item.amount, 0) ?? 0
  const amountPaid = input.amountPaid ?? 0
  const openBalance = input.openBalance ?? Math.max(amount - amountPaid, 0)
  const status = input.status ?? "draft"

  const invoiceInsert: InvoiceInsert = {
    id,
    number,
    customer_id: input.customerId ?? "",
    customer_name: input.customerName ?? "",
    date: (input.date ?? now).toISOString(),
    due_date: (input.dueDate ?? now).toISOString(),
    amount,
    amount_paid: amountPaid || null,
    open_balance: openBalance,
    currency: input.currency ?? "USD",
    status,
    collection_status: input.collectionStatus ?? "none",
    description: input.description ?? null,
    entity_id: input.entityId ?? "e1",
    department_id: input.departmentId ?? null,
    department_name: input.departmentName ?? null,
    billing_address: input.billingAddress ?? null,
    memo: input.memo ?? null,
    created_at: (input.createdAt ?? now).toISOString(),
    sent_at: status === "sent" ? (input.sentAt ?? now).toISOString() : null,
    paid_at: input.paidAt?.toISOString() ?? null,
  }

  const { data: invoiceRow, error: invoiceError } = await supabase
    .from("invoices")
    .insert(invoiceInsert)
    .select("*")
    .single()

  if (invoiceError) {
    throw invoiceError
  }

  const normalizedLineItems = (input.lineItems ?? []).map((lineItem, index) => ({
    id: lineItem.id || `ili-${sequence}-${index + 1}`,
    invoice_id: id,
    description: lineItem.description,
    account_id: lineItem.accountId,
    account_name: lineItem.accountName,
    amount: lineItem.amount,
    quantity: lineItem.quantity,
    unit_price: lineItem.unitPrice,
    tax_amount: lineItem.taxAmount ?? null,
    department_id: lineItem.departmentId ?? input.departmentId ?? null,
    department_name: lineItem.departmentName ?? input.departmentName ?? null,
    project_id: lineItem.projectId ?? null,
    project_name: lineItem.projectName ?? null,
    class_id: lineItem.classId ?? null,
    class_name: lineItem.className ?? null,
    sort_order: index + 1,
  }))

  if (normalizedLineItems.length) {
    const { error: lineError } = await supabase.from("invoice_lines").insert(normalizedLineItems)

    if (lineError) {
      throw lineError
    }
  }

  await adjustCustomerBalance(invoiceInsert.customer_id, openBalance)

  return mapInvoice(invoiceRow, normalizedLineItems.map(mapInvoiceLine))
}

export async function sendSupabaseInvoice(id: string): Promise<Invoice | null> {
  const current = await getSupabaseReceivablesInvoiceById(id)

  if (!current || current.status !== "draft") {
    return null
  }

  const supabase = createSupabaseAdminClient()
  const { data, error } = await supabase
    .from("invoices")
    .update({
      status: "sent",
      sent_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single()

  if (error) {
    throw error
  }

  const lineItemsByInvoiceId = await getInvoiceLinesByInvoiceIds([id])
  return mapInvoice(data, lineItemsByInvoiceId.get(id) ?? [])
}

export async function voidSupabaseInvoice(id: string): Promise<Invoice | null> {
  const current = await getSupabaseReceivablesInvoiceById(id)

  if (!current || current.status === "paid" || current.status === "voided") {
    return null
  }

  const supabase = createSupabaseAdminClient()
  const { data, error } = await supabase
    .from("invoices")
    .update({
      status: "voided",
      open_balance: 0,
    })
    .eq("id", id)
    .select("*")
    .single()

  if (error) {
    throw error
  }

  await adjustCustomerBalance(current.customerId, -current.openBalance)

  const lineItemsByInvoiceId = await getInvoiceLinesByInvoiceIds([id])
  return mapInvoice(data, lineItemsByInvoiceId.get(id) ?? [])
}
