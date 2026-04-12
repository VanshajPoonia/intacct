"use client"

import { useRouter } from "next/navigation"
import { CreateInvoiceModal } from "@/components/accounts-receivable/create-invoice-modal"

export default function NewInvoicePage() {
  const router = useRouter()

  return (
    <CreateInvoiceModal
      open
      onClose={() => router.push("/accounts-receivable/invoices")}
      onSuccess={() => router.push("/accounts-receivable/invoices")}
    />
  )
}
