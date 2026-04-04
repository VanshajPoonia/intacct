"use client"

import { ModulePage } from "@/components/layout/module-page"
import { DataTable, type Column } from "@/components/tables/data-table"
import { StatusBadge } from "@/components/finance/status-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { customers } from "@/lib/mock-data"
import type { Customer } from "@/lib/types"
import { Plus, Search, Filter, Download } from "lucide-react"

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(value)
}

const columns: Column<Customer>[] = [
  {
    key: 'code',
    header: 'Code',
    cell: (item) => (
      <span className="font-mono text-muted-foreground">{item.code}</span>
    )
  },
  {
    key: 'name',
    header: 'Customer Name',
    cell: (item) => (
      <div className="flex flex-col">
        <span className="font-medium">{item.name}</span>
        <span className="text-xs text-muted-foreground">{item.email}</span>
      </div>
    )
  },
  {
    key: 'paymentTerms',
    header: 'Terms',
    cell: (item) => (
      <span className="text-muted-foreground">{item.paymentTerms}</span>
    )
  },
  {
    key: 'creditLimit',
    header: 'Credit Limit',
    align: 'right',
    cell: (item) => (
      <span className="tabular-nums text-muted-foreground">{formatCurrency(item.creditLimit)}</span>
    )
  },
  {
    key: 'balance',
    header: 'Balance',
    align: 'right',
    cell: (item) => (
      <span className="tabular-nums font-medium">{formatCurrency(item.balance)}</span>
    )
  },
  {
    key: 'status',
    header: 'Status',
    cell: (item) => <StatusBadge status={item.status} />
  }
]

export default function CustomersPage() {
  return (
    <ModulePage
      title="Customers"
      description="Manage your customer master data"
      breadcrumbs={[
        { label: 'Accounts Receivable', href: '/accounts-receivable' },
        { label: 'Customers' }
      ]}
      actions={
        <>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1.5" />
            Export
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            New Customer
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search customers..." className="pl-9 h-9" />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-1.5" />
            Filters
          </Button>
        </div>

        {/* Table */}
        <DataTable columns={columns} data={customers} />
      </div>
    </ModulePage>
  )
}
