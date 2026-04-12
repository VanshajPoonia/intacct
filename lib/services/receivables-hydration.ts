import type { Customer, Document, Invoice, InvoiceLineItem, Receipt } from "@/lib/types"
import type { InvoiceDetailRouteData } from "./detail-routes"

export interface SerializedCustomer extends Omit<Customer, "createdAt" | "lastPaymentDate"> {
  createdAt: string
  lastPaymentDate?: string
}

export interface SerializedDocument extends Omit<Document, "createdAt" | "updatedAt"> {
  createdAt: string
  updatedAt: string
}

export interface SerializedInvoiceLineItem extends InvoiceLineItem {}

export interface SerializedInvoice extends Omit<Invoice, "date" | "dueDate" | "createdAt" | "sentAt" | "paidAt" | "lineItems"> {
  date: string
  dueDate: string
  createdAt: string
  sentAt?: string
  paidAt?: string
  lineItems: SerializedInvoiceLineItem[]
}

export interface SerializedReceipt extends Omit<Receipt, "date" | "createdAt"> {
  date: string
  createdAt: string
}

export interface SerializedInvoiceDetailRouteData {
  invoice: SerializedInvoice
  customer: SerializedCustomer | null
  receipts: SerializedReceipt[]
  documents: SerializedDocument[]
}

export function hydrateCustomer(customer: SerializedCustomer): Customer {
  return {
    ...customer,
    createdAt: new Date(customer.createdAt),
    lastPaymentDate: customer.lastPaymentDate ? new Date(customer.lastPaymentDate) : undefined,
  }
}

export function hydrateDocument(document: SerializedDocument): Document {
  return {
    ...document,
    createdAt: new Date(document.createdAt),
    updatedAt: new Date(document.updatedAt),
  }
}

export function hydrateInvoiceLineItem(lineItem: SerializedInvoiceLineItem): InvoiceLineItem {
  return lineItem
}

export function hydrateInvoice(invoice: SerializedInvoice): Invoice {
  return {
    ...invoice,
    date: new Date(invoice.date),
    dueDate: new Date(invoice.dueDate),
    createdAt: new Date(invoice.createdAt),
    sentAt: invoice.sentAt ? new Date(invoice.sentAt) : undefined,
    paidAt: invoice.paidAt ? new Date(invoice.paidAt) : undefined,
    lineItems: invoice.lineItems.map(hydrateInvoiceLineItem),
  }
}

export function hydrateReceipt(receipt: SerializedReceipt): Receipt {
  return {
    ...receipt,
    date: new Date(receipt.date),
    createdAt: new Date(receipt.createdAt),
  }
}

export function hydrateInvoiceDetailRouteData(detail: SerializedInvoiceDetailRouteData): InvoiceDetailRouteData {
  return {
    invoice: hydrateInvoice(detail.invoice),
    customer: detail.customer ? hydrateCustomer(detail.customer) : null,
    receipts: detail.receipts.map(hydrateReceipt),
    documents: detail.documents.map(hydrateDocument),
  }
}
