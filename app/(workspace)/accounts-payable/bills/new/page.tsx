"use client"

import { useRouter } from "next/navigation"
import { CreateBillModal } from "@/components/accounts-payable/create-bill-modal"

export default function NewBillPage() {
  const router = useRouter()

  return (
    <CreateBillModal
      open
      onClose={() => router.push("/accounts-payable/bills")}
      onSuccess={() => router.push("/accounts-payable/bills")}
    />
  )
}
