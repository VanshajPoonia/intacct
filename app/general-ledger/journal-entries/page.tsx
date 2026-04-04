"use client"

import { ModulePage } from "@/components/layout/module-page"
import { DataTable, type Column } from "@/components/tables/data-table"
import { StatusBadge } from "@/components/finance/status-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { journalEntries } from "@/lib/mock-data"
import type { JournalEntry } from "@/lib/types"
import { Plus, Search, Filter, Download } from "lucide-react"
import { format } from "date-fns"

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value)
}

const columns: Column<JournalEntry>[] = [
  {
    key: 'number',
    header: 'Number',
    cell: (item) => (
      <span className="font-medium text-primary">{item.number}</span>
    )
  },
  {
    key: 'date',
    header: 'Date',
    cell: (item) => (
      <span className="tabular-nums">{format(item.date, 'MMM d, yyyy')}</span>
    )
  },
  {
    key: 'description',
    header: 'Description',
    cell: (item) => (
      <span className="truncate block max-w-[250px]">{item.description}</span>
    )
  },
  {
    key: 'debit',
    header: 'Debit',
    align: 'right',
    cell: (item) => {
      const total = item.lines.reduce((sum, line) => sum + line.debit, 0)
      return <span className="tabular-nums">{formatCurrency(total)}</span>
    }
  },
  {
    key: 'credit',
    header: 'Credit',
    align: 'right',
    cell: (item) => {
      const total = item.lines.reduce((sum, line) => sum + line.credit, 0)
      return <span className="tabular-nums">{formatCurrency(total)}</span>
    }
  },
  {
    key: 'status',
    header: 'Status',
    cell: (item) => <StatusBadge status={item.status} />
  }
]

export default function JournalEntriesPage() {
  return (
    <ModulePage
      title="Journal Entries"
      description="View and manage general ledger journal entries"
      breadcrumbs={[
        { label: 'General Ledger', href: '/general-ledger' },
        { label: 'Journal Entries' }
      ]}
      actions={
        <>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1.5" />
            Export
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            New Entry
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search entries..." className="pl-9 h-9" />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-1.5" />
            Filters
          </Button>
        </div>

        {/* Table */}
        <DataTable columns={columns} data={journalEntries} />
      </div>
    </ModulePage>
  )
}
