// @ts-nocheck
"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { AppShell } from "@/components/layout/app-shell"
import { useWorkspaceShell } from "@/components/layout/workspace-shell-provider"
import { StatusBadge } from "@/components/finance/status-badge"
import { PageHeader } from "@/components/finance/page-header"
import { MetricCard } from "@/components/finance/metric-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ClipboardList, 
  Plus, 
  Search, 
  MoreHorizontal, 
  FileText, 
  Truck,
  Receipt,
  Package,
  Clock,
  CheckCircle
} from "lucide-react"
import { 
  getOrderManagementWorkspace,
  confirmSalesOrder, 
  shipSalesOrder,
  invoiceSalesOrder 
} from "@/lib/services"
import type { FinanceFilters, SalesOrder } from "@/lib/types"
import { formatCurrency, formatDate } from "@/lib/utils"

export default function OrderManagementPage() {
  const { activeEntity, dateRange } = useWorkspaceShell()
  const [workspace, setWorkspace] = useState<Awaited<ReturnType<typeof getOrderManagementWorkspace>> | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const shellFilters = useMemo<FinanceFilters | null>(() => {
    if (!activeEntity || !dateRange) {
      return null
    }

    return {
      entityId: activeEntity.id,
      dateRange,
    }
  }, [activeEntity, dateRange])

  const loadData = useCallback(async () => {
    if (!shellFilters) {
      return
    }

    setLoading(true)
    const result = await getOrderManagementWorkspace(shellFilters, {
      status: activeTab,
      search,
      page: 1,
      pageSize: 50,
    })
    setWorkspace(result)
    setLoading(false)
  }, [activeTab, search, shellFilters])

  useEffect(() => {
    if (!shellFilters) {
      return
    }

    loadData()
  }, [loadData, shellFilters])

  const handleConfirm = async (id: string) => {
    await confirmSalesOrder(id)
    loadData()
  }

  const handleShip = async (id: string) => {
    await shipSalesOrder(id)
    loadData()
  }

  const handleInvoice = async (id: string) => {
    await invoiceSalesOrder(id)
    loadData()
  }

  const salesOrders = workspace?.data ?? []
  const metrics = workspace?.metrics ?? []
  const tabs = workspace?.tabs ?? []
  const headerActions = workspace?.actions ?? []

  return (
    <AppShell>
      <div className="flex-1 space-y-6 p-6">
        <PageHeader
          title="Order Management"
          description={activeEntity ? `Manage sales orders and fulfillment for ${activeEntity.name}` : "Manage sales orders and fulfillment"}
          actions={
            <div className="flex gap-2">
              {headerActions.slice(1).map(action => (
                <Button key={action.id} variant="outline" asChild>
                  <Link href={action.href ?? "/order-management"}>{action.label}</Link>
                </Button>
              ))}
              <Button asChild>
                <Link href="/order-management/orders/new">
                  <Plus className="h-4 w-4 mr-2" />
                  New Sales Order
                </Link>
              </Button>
            </div>
          }
        />

        {/* Metrics */}
        <div className="grid gap-4 md:grid-cols-4">
          {metrics.map((metric, index) => (
            <MetricCard
              key={metric.id}
              title={metric.label}
              value={metric.value}
              icon={
                index === 0 ? <ClipboardList className="h-4 w-4" /> :
                index === 1 ? <Package className="h-4 w-4" /> :
                index === 2 ? <Truck className="h-4 w-4" /> :
                <Receipt className="h-4 w-4" />
              }
              trend={metric.tone === "critical" || metric.tone === "warning" ? "attention" : metric.tone === "positive" ? "up" : undefined}
            />
          ))}
        </div>

        {/* Orders Table */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium">Sales Orders</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search orders..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
              <TabsList>
                {tabs.map(tab => (
                  <TabsTrigger key={tab.id} value={tab.id}>
                    {tab.label}
                    {typeof tab.count === "number" ? ` (${tab.count})` : ""}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SO Number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Order Date</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : salesOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No sales orders found
                    </TableCell>
                  </TableRow>
                ) : (
                  salesOrders.map((so) => (
                    <TableRow key={so.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-medium">
                        <Link href={`/order-management/orders/${so.id}`} className="hover:underline">
                          {so.number}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link href={`/accounts-receivable/customers/${so.customerId}`} className="text-muted-foreground transition-colors hover:text-foreground hover:underline">
                          {so.customerName}
                        </Link>
                      </TableCell>
                      <TableCell>{formatDate(so.orderDate)}</TableCell>
                      <TableCell>{so.requestedDate ? formatDate(so.requestedDate) : '-'}</TableCell>
                      <TableCell>
                        <StatusBadge status={so.status} />
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(so.total)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/order-management/orders/${so.id}`}>
                                <FileText className="h-4 w-4 mr-2" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            {(so.status === 'draft' || so.status === 'approved') && (
                              <DropdownMenuItem onClick={() => handleConfirm(so.id)}>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Confirm Order
                              </DropdownMenuItem>
                            )}
                            {so.status === 'confirmed' && (
                              <DropdownMenuItem onClick={() => handleShip(so.id)}>
                                <Truck className="h-4 w-4 mr-2" />
                                Mark Shipped
                              </DropdownMenuItem>
                            )}
                            {so.status === 'shipped' && (
                              <DropdownMenuItem onClick={() => handleInvoice(so.id)}>
                                <Receipt className="h-4 w-4 mr-2" />
                                Create Invoice
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
