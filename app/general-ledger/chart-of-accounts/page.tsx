"use client"

import { ModulePage } from "@/components/layout/module-page"
import { DataTable, type Column } from "@/components/tables/data-table"
import { StatusBadge } from "@/components/finance/status-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { accounts } from "@/lib/mock-data"
import type { Account } from "@/lib/types"
import { Plus, Search, Filter, Download } from "lucide-react"

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(value)
}

const typeColors: Record<string, string> = {
  asset: 'bg-blue-50 text-blue-700 border-blue-200',
  liability: 'bg-red-50 text-red-700 border-red-200',
  equity: 'bg-purple-50 text-purple-700 border-purple-200',
  revenue: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  expense: 'bg-amber-50 text-amber-700 border-amber-200',
}

const columns: Column<Account>[] = [
  {
    key: 'number',
    header: 'Account #',
    cell: (item) => (
      <span className="font-mono font-medium">{item.number}</span>
    )
  },
  {
    key: 'name',
    header: 'Account Name',
    cell: (item) => (
      <span className="font-medium">{item.name}</span>
    )
  },
  {
    key: 'type',
    header: 'Type',
    cell: (item) => (
      <Badge variant="outline" className={`capitalize ${typeColors[item.type]}`}>
        {item.type}
      </Badge>
    )
  },
  {
    key: 'category',
    header: 'Category',
    cell: (item) => (
      <span className="text-muted-foreground">{item.category}</span>
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

export default function ChartOfAccountsPage() {
  return (
    <ModulePage
      title="Chart of Accounts"
      description="Manage your general ledger account structure"
      breadcrumbs={[
        { label: 'General Ledger', href: '/general-ledger' },
        { label: 'Chart of Accounts' }
      ]}
      actions={
        <>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1.5" />
            Export
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            New Account
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search accounts..." className="pl-9 h-9" />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-1.5" />
            Filters
          </Button>
        </div>

        {/* Table */}
        <DataTable columns={columns} data={accounts} />
      </div>
    </ModulePage>
  )
}
