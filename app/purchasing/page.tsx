"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ShoppingCart, 
  Plus, 
  Search, 
  MoreHorizontal, 
  FileText, 
  Send,
  Check,
  Package,
  Clock,
  AlertCircle
} from "lucide-react"
import { 
  getPurchaseOrders, 
  approvePurchaseOrder, 
  sendPurchaseOrder 
} from "@/lib/services"
import type { PurchaseOrder } from "@/lib/types"
import { formatCurrency, formatDate } from "@/lib/utils"

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  pending_approval: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  approved: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  sent: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  partially_received: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  received: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  closed: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
}

export default function PurchasingPage() {
  const router = useRouter()
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [activeTab, setActiveTab] = useState("all")

  const loadData = async () => {
    setLoading(true)
    const statusFilterValues = activeTab === "all" ? undefined : [activeTab]
    const result = await getPurchaseOrders(statusFilterValues, undefined, search || undefined)
    setPurchaseOrders(result.data)
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [activeTab, search])

  const handleApprove = async (id: string) => {
    await approvePurchaseOrder(id)
    loadData()
  }

  const handleSend = async (id: string) => {
    await sendPurchaseOrder(id)
    loadData()
  }

  const metrics = {
    total: purchaseOrders.length,
    pending: purchaseOrders.filter(po => po.status === 'pending_approval').length,
    open: purchaseOrders.filter(po => ['approved', 'sent', 'partially_received'].includes(po.status)).length,
    totalValue: purchaseOrders.reduce((sum, po) => sum + po.total, 0),
  }

  return (
    <AppShell>
      <div className="flex-1 space-y-6 p-6">
        <PageHeader
          title="Purchasing"
          description="Manage purchase orders and vendor procurement"
          actions={
            <Button asChild>
              <Link href="/purchasing/orders/new">
                <Plus className="h-4 w-4 mr-2" />
                New Purchase Order
              </Link>
            </Button>
          }
        />

        {/* Metrics */}
        <div className="grid gap-4 md:grid-cols-4">
          <MetricCard
            title="Total POs"
            value={metrics.total}
            icon={<ShoppingCart className="h-4 w-4" />}
          />
          <MetricCard
            title="Pending Approval"
            value={metrics.pending}
            icon={<Clock className="h-4 w-4" />}
            trend={metrics.pending > 0 ? "attention" : undefined}
          />
          <MetricCard
            title="Open Orders"
            value={metrics.open}
            icon={<Package className="h-4 w-4" />}
          />
          <MetricCard
            title="Total Value"
            value={formatCurrency(metrics.totalValue)}
            icon={<FileText className="h-4 w-4" />}
          />
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium">Purchase Orders</CardTitle>
              <div className="flex items-center gap-3">
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
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="draft">Draft</TabsTrigger>
                <TabsTrigger value="pending_approval">Pending</TabsTrigger>
                <TabsTrigger value="approved">Approved</TabsTrigger>
                <TabsTrigger value="sent">Sent</TabsTrigger>
                <TabsTrigger value="partially_received">Partial</TabsTrigger>
                <TabsTrigger value="received">Received</TabsTrigger>
              </TabsList>
            </Tabs>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO Number</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Order Date</TableHead>
                  <TableHead>Expected</TableHead>
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
                ) : purchaseOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No purchase orders found
                    </TableCell>
                  </TableRow>
                ) : (
                  purchaseOrders.map((po) => (
                    <TableRow key={po.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-medium">
                        <Link href={`/purchasing/orders/${po.id}`} className="hover:underline">
                          {po.number}
                        </Link>
                      </TableCell>
                      <TableCell>{po.vendorName}</TableCell>
                      <TableCell>{formatDate(po.orderDate)}</TableCell>
                      <TableCell>{po.expectedDate ? formatDate(po.expectedDate) : '-'}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[po.status]} variant="secondary">
                          {po.status.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(po.total)}
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
                              <Link href={`/purchasing/orders/${po.id}`}>
                                <FileText className="h-4 w-4 mr-2" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            {(po.status === 'draft' || po.status === 'pending_approval') && (
                              <DropdownMenuItem onClick={() => handleApprove(po.id)}>
                                <Check className="h-4 w-4 mr-2" />
                                Approve
                              </DropdownMenuItem>
                            )}
                            {po.status === 'approved' && (
                              <DropdownMenuItem onClick={() => handleSend(po.id)}>
                                <Send className="h-4 w-4 mr-2" />
                                Send to Vendor
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
