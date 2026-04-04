"use client"

import { ModulePage } from "@/components/layout/module-page"
import { DataTable, type Column } from "@/components/tables/data-table"
import { StatusBadge } from "@/components/finance/status-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { invoices } from "@/lib/mock-data"
import type { Invoice } from "@/lib/types"
import { Plus, Search, Filter, Download } from "lucide-react"
import { format } from "date-fns"

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value)
}

const columns: Column<Invoice>[] = [
  {
    key: 'number',
    header: 'Invoice #',
    cell: (item) => (
      <span className="font-medium text-primary">{item.number}</span>
    )
  },
  {
    key: 'customerName',
    header: 'Customer',
    cell: (item) => (
      <span className="font-medium">{item.customerName}</span>
    )
  },
  {
    key: 'date',
    header: 'Invoice Date',
    cell: (item) => (
      <span className="tabular-nums">{format(item.date, 'MMM d, yyyy')}</span>
    )
  },
  {
    key: 'dueDate',
    header: 'Due Date',
    cell: (item) => (
      <span className="tabular-nums">{format(item.dueDate, 'MMM d, yyyy')}</span>
    )
  },
  {
    key: 'amount',
    header: 'Amount',
    align: 'right',
    cell: (item) => (
      <span className="tabular-nums font-medium">{formatCurrency(item.amount)}</span>
    )
  },
  {
    key: 'status',
    header: 'Status',
    cell: (item) => <StatusBadge status={item.status} />
  }
]

export default function InvoicesPage() {
  return (
    <ModulePage
      title="Invoices"
      description="Manage customer invoices and collections"
      breadcrumbs={[
        { label: 'Accounts Receivable', href: '/accounts-receivable' },
        { label: 'Invoices' }
      ]}
      actions={
        <>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1.5" />
            Export
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            New Invoice
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search invoices..." className="pl-9 h-9" />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-1.5" />
            Filters
          </Button>
        </div>

        {/* Table */}
        <DataTable columns={columns} data={invoices} />
      </div>
    </ModulePage>
  )
}
