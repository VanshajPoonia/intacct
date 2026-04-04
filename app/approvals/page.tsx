"use client"

import { ModulePage } from "@/components/layout/module-page"
import { DataTable, type Column } from "@/components/tables/data-table"
import { StatusBadge } from "@/components/finance/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { approvalItems } from "@/lib/mock-data"
import type { ApprovalItem } from "@/lib/types"
import { Check, X, Clock, CheckCircle2, XCircle } from "lucide-react"
import { format } from "date-fns"

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value)
}

const columns: Column<ApprovalItem>[] = [
  {
    key: 'documentNumber',
    header: 'Document',
    cell: (item) => (
      <div className="flex flex-col">
        <span className="font-medium text-primary">{item.documentNumber}</span>
        <span className="text-xs text-muted-foreground capitalize">{item.type.replace('_', ' ')}</span>
      </div>
    )
  },
  {
    key: 'description',
    header: 'Description',
    cell: (item) => (
      <span className="text-sm truncate block max-w-[300px]">{item.description}</span>
    )
  },
  {
    key: 'requestedBy',
    header: 'Requested By',
    cell: (item) => (
      <div className="flex flex-col">
        <span className="text-sm">{item.requestedBy}</span>
        <span className="text-xs text-muted-foreground">{format(item.requestedAt, 'MMM d, yyyy')}</span>
      </div>
    )
  },
  {
    key: 'amount',
    header: 'Amount',
    align: 'right',
    cell: (item) => (
      <span className="font-medium tabular-nums">{formatCurrency(item.amount)}</span>
    )
  },
  {
    key: 'status',
    header: 'Status',
    cell: (item) => <StatusBadge status={item.status} />
  },
  {
    key: 'actions',
    header: '',
    align: 'right',
    cell: () => (
      <div className="flex items-center justify-end gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
          <Check className="h-4 w-4" />
          <span className="sr-only">Approve</span>
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50">
          <X className="h-4 w-4" />
          <span className="sr-only">Reject</span>
        </Button>
      </div>
    )
  }
]

export default function ApprovalsPage() {
  const pendingItems = approvalItems.filter(item => item.status === 'pending')
  const approvedItems = approvalItems.filter(item => item.status === 'approved')
  const rejectedItems = approvalItems.filter(item => item.status === 'rejected')

  return (
    <ModulePage
      title="Approvals"
      description="Review and approve pending items"
      breadcrumbs={[{ label: 'Approvals' }]}
    >
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-100">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{pendingItems.length}</p>
                  <p className="text-sm text-muted-foreground">Pending Approvals</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-100">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{approvedItems.length}</p>
                  <p className="text-sm text-muted-foreground">Approved Today</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-100">
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{rejectedItems.length}</p>
                  <p className="text-sm text-muted-foreground">Rejected Today</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending" className="gap-1.5">
              Pending
              {pendingItems.length > 0 && (
                <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                  {pendingItems.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <DataTable 
              columns={columns} 
              data={pendingItems}
              emptyMessage="No pending approvals"
            />
          </TabsContent>

          <TabsContent value="approved">
            <DataTable 
              columns={columns.filter(c => c.key !== 'actions')} 
              data={approvedItems}
              emptyMessage="No approved items"
            />
          </TabsContent>

          <TabsContent value="rejected">
            <DataTable 
              columns={columns.filter(c => c.key !== 'actions')} 
              data={rejectedItems}
              emptyMessage="No rejected items"
            />
          </TabsContent>

          <TabsContent value="all">
            <DataTable 
              columns={columns.filter(c => c.key !== 'actions')} 
              data={approvalItems}
              emptyMessage="No approval items"
            />
          </TabsContent>
        </Tabs>
      </div>
    </ModulePage>
  )
}
