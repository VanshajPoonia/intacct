"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { AppShell } from "@/components/layout/app-shell"
import { PageHeader } from "@/components/finance/page-header"
import { MetricCard } from "@/components/finance/metric-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
  getSalesOrders, 
  confirmSalesOrder, 
  shipSalesOrder,
  invoiceSalesOrder 
} from "@/lib/services"
import type { SalesOrder } from "@/lib/types"
import { formatCurrency, formatDate } from "@/lib/utils"

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  pending_approval: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  approved: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  confirmed: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  partially_shipped: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  shipped: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
  invoiced: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  closed: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
}

export default function OrderManagementPage() {
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [activeTab, setActiveTab] = useState("all")

  const loadData = async () => {
    setLoading(true)
    const statusFilterValues = activeTab === "all" ? undefined : [activeTab]
    const result = await getSalesOrders(statusFilterValues, undefined, search || undefined)
    setSalesOrders(result.data)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [activeTab, search])

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

  const metrics = {
    total: salesOrders.length,
    confirmed: salesOrders.filter(so => so.status === 'confirmed').length,
    shipped: salesOrders.filter(so => so.status === 'shipped').length,
    totalValue: salesOrders.reduce((sum, so) => sum + so.total, 0),
  }

  return (
    <AppShell>
      <div className="flex-1 space-y-6 p-6">
        <PageHeader
          title="Order Management"
          description="Manage sales orders and fulfillment"
          actions={
            <Button asChild>
              <Link href="/order-management/orders/new">
                <Plus className="h-4 w-4 mr-2" />
                New Sales Order
              </Link>
            </Button>
          }
        />

        {/* Metrics */}
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard
            title="Total Orders"
            value={metrics.total}
            icon={<ClipboardList className="h-4 w-4" />}
          />
          <MetricCard
            title="To Ship"
            value={metrics.confirmed}
            icon={<Package className="h-4 w-4" />}
            trend={metrics.confirmed > 0 ? "attention" : undefined}
          />
          <MetricCard
            title="Shipped"
            value={metrics.shipped}
            icon={<Truck className="h-4 w-4" />}
          />
          <MetricCard
            title="Order Value"
            value={formatCurrency(metrics.totalValue)}
            icon={<Receipt className="h-4 w-4" />}
          />
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
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="draft">Draft</TabsTrigger>
                <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
                <TabsTrigger value="shipped">Shipped</TabsTrigger>
                <TabsTrigger value="invoiced">Invoiced</TabsTrigger>
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
                      <TableCell>{so.customerName}</TableCell>
                      <TableCell>{formatDate(so.orderDate)}</TableCell>
                      <TableCell>{so.requestedDate ? formatDate(so.requestedDate) : '-'}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[so.status]} variant="secondary">
                          {so.status.replace(/_/g, ' ')}
                        </Badge>
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
