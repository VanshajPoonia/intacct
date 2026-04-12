"use client"

import { useRouter } from "next/navigation"
import { useWorkspaceShell } from "@/components/layout/workspace-shell-provider"
import { CreateJournalEntryModal } from "@/components/general-ledger/create-journal-entry-modal"

export default function NewJournalEntryPage() {
  const router = useRouter()
  const { activeEntity } = useWorkspaceShell()

  return (
    <CreateJournalEntryModal
      open
      entityId={activeEntity?.id}
      onClose={() => router.push("/general-ledger/journal-entries")}
      onSuccess={() => router.push("/general-ledger/journal-entries")}
    />
  )
}
