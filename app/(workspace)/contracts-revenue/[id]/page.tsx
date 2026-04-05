"use client"

import { use, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Building2, Calendar, Check, Clock, DollarSign, Download, Edit, ExternalLink, FileText, MoreHorizontal, Plus, RefreshCw, Send, TrendingUp, User } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { mockContracts, mockCustomers } from "@/lib/mock-data"
import { formatCurrency, formatDate } from "@/lib/services"

export default function ContractDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  const contract = useMemo(() => mockContracts.find(c => c.id === id) || mockContracts[0], [id])
  const customer = useMemo(() => mockCustomers.find(c => c.id === contract.customerId) || mockCustomers[0], [contract.customerId])

  const recognizedRevenue = contract.totalValue * 0.65
  const deferredRevenue = contract.totalValue - recognizedRevenue
  const completionPercent = (recognizedRevenue / contract.totalValue) * 100

  const statusColors: Record<string, string> = {
    active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    draft: "bg-muted text-muted-foreground",
    pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    completed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  }

  // Generate revenue schedule
  const revenueSchedule = useMemo(() => {
    const schedule = []
    const startDate = new Date(contract.startDate)
    const endDate = new Date(contract.endDate)
    const months = Math.ceil((endDate.getTime() - startDate.getTime()) / (30 * 24 * 60 * 60 * 1000))
    const monthlyRevenue = contract.totalValue / months

    for (let i = 0; i < months; i++) {
      const periodDate = new Date(startDate)
      periodDate.setMonth(periodDate.getMonth() + i)
      const isPast = periodDate < new Date()
      
      schedule.push({
        id: `period-${i}`,
        period: periodDate.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        scheduled: monthlyRevenue,
        recognized: isPast ? monthlyRevenue : 0,
        deferred: isPast ? 0 : monthlyRevenue,
        status: isPast ? "recognized" : "scheduled",
      })
    }
    return schedule
  }, [contract])

  // Chart data
  const chartData = revenueSchedule.map(s => ({
    period: s.period,
    recognized: s.recognized,
    deferred: s.deferred,
  }))

  const chartConfig: ChartConfig = {
    recognized: { label: "Recognized", color: "hsl(var(--chart-1))" },
  }

  // Performance obligations
  const obligations = [
    { id: 1, name: "Software License", value: contract.totalValue * 0.4, recognized: contract.totalValue * 0.26, method: "Point in Time", status: "in-progress" },
    { id: 2, name: "Implementation Services", value: contract.totalValue * 0.35, recognized: contract.totalValue * 0.28, method: "Over Time", status: "in-progress" },
    { id: 3, name: "Support & Maintenance", value: contract.totalValue * 0.25, recognized: contract.totalValue * 0.11, method: "Over Time", status: "in-progress" },
  ]

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b bg-background">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/contracts-revenue">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-semibold">{contract.contractNumber}</h1>
                <Badge className={statusColors[contract.status]}>{contract.status}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                <Link href={`/accounts-receivable/customers/${customer.id}`} className="hover:underline">
                  {customer.name}
                </Link>
                {" "}&middot; {contract.name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Recalculate
            </Button>
            <Button size="sm">
              <Send className="mr-2 h-4 w-4" />
              Generate Invoice
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Contract
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Amendment
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Download className="mr-2 h-4 w-4" />
                  Export Details
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">Cancel Contract</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Summary Cards */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">Contract Value</p>
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <p className="text-2xl font-bold mt-2">{formatCurrency(contract.totalValue)}</p>
                    <p className="text-xs text-muted-foreground mt-1">Total contract amount</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">Revenue Recognized</p>
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    </div>
                    <p className="text-2xl font-bold mt-2 text-green-600">{formatCurrency(recognizedRevenue)}</p>
                    <div className="mt-2">
                      <Progress value={completionPercent} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">{completionPercent.toFixed(1)}% complete</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">Deferred Revenue</p>
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <p className="text-2xl font-bold mt-2">{formatCurrency(deferredRevenue)}</p>
                    <p className="text-xs text-muted-foreground mt-1">To be recognized</p>
                  </CardContent>
                </Card>
              </div>

              {/* Revenue Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Revenue Recognition Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[250px] w-full">
                    <AreaChart data={chartData} accessibilityLayer>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="period" tickLine={false} axisLine={false} tickMargin={8} />
                      <YAxis 
                        tickLine={false} 
                        axisLine={false} 
                        tickMargin={8}
                        tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area
                        type="monotone"
                        dataKey="recognized"
                        fill="hsl(var(--chart-1))"
                        stroke="hsl(var(--chart-1))"
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Tabs */}
              <Tabs defaultValue="schedule" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="schedule">Revenue Schedule</TabsTrigger>
                  <TabsTrigger value="obligations">Performance Obligations</TabsTrigger>
                  <TabsTrigger value="invoices">Invoices</TabsTrigger>
                  <TabsTrigger value="amendments">Amendments</TabsTrigger>
                </TabsList>

                <TabsContent value="schedule">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="text-base">Revenue Recognition Schedule</CardTitle>
                      <Button variant="outline" size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        Export
                      </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Period</TableHead>
                            <TableHead className="text-right">Scheduled</TableHead>
                            <TableHead className="text-right">Recognized</TableHead>
                            <TableHead className="text-right">Deferred</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {revenueSchedule.slice(0, 12).map(row => (
                            <TableRow key={row.id}>
                              <TableCell className="font-medium">{row.period}</TableCell>
                              <TableCell className="text-right">{formatCurrency(row.scheduled)}</TableCell>
                              <TableCell className="text-right text-green-600">{formatCurrency(row.recognized)}</TableCell>
                              <TableCell className="text-right">{formatCurrency(row.deferred)}</TableCell>
                              <TableCell>
                                <Badge variant={row.status === "recognized" ? "default" : "outline"}>
                                  {row.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="obligations">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Performance Obligations (ASC 606)</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Obligation</TableHead>
                            <TableHead>Recognition Method</TableHead>
                            <TableHead className="text-right">Value</TableHead>
                            <TableHead className="text-right">Recognized</TableHead>
                            <TableHead>Progress</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {obligations.map(ob => (
                            <TableRow key={ob.id}>
                              <TableCell className="font-medium">{ob.name}</TableCell>
                              <TableCell>{ob.method}</TableCell>
                              <TableCell className="text-right">{formatCurrency(ob.value)}</TableCell>
                              <TableCell className="text-right text-green-600">{formatCurrency(ob.recognized)}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Progress value={(ob.recognized / ob.value) * 100} className="h-2 w-20" />
                                  <span className="text-xs text-muted-foreground">
                                    {((ob.recognized / ob.value) * 100).toFixed(0)}%
                                  </span>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="invoices">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="text-base">Related Invoices</CardTitle>
                      <Button variant="outline" size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Create Invoice
                      </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Invoice #</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Period</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {[
                            { number: "INV-2026-001", date: "2026-01-15", period: "Jan 2026", amount: contract.totalValue / 12, status: "paid" },
                            { number: "INV-2026-002", date: "2026-02-15", period: "Feb 2026", amount: contract.totalValue / 12, status: "paid" },
                            { number: "INV-2026-003", date: "2026-03-15", period: "Mar 2026", amount: contract.totalValue / 12, status: "sent" },
                          ].map(inv => (
                            <TableRow key={inv.number}>
                              <TableCell>
                                <Link href="/accounts-receivable/invoices" className="text-primary hover:underline font-medium">
                                  {inv.number}
                                </Link>
                              </TableCell>
                              <TableCell>{formatDate(inv.date)}</TableCell>
                              <TableCell>{inv.period}</TableCell>
                              <TableCell className="text-right">{formatCurrency(inv.amount)}</TableCell>
                              <TableCell>
                                <Badge className={inv.status === "paid" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : ""}>
                                  {inv.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="amendments">
                  <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                      <FileText className="mx-auto h-12 w-12 mb-4 opacity-30" />
                      <p className="font-medium">No Amendments</p>
                      <p className="text-sm mt-1">This contract has not been amended.</p>
                      <Button variant="outline" size="sm" className="mt-4">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Amendment
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Customer */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Customer</CardTitle>
                </CardHeader>
                <CardContent>
                  <Link href={`/accounts-receivable/customers/${customer.id}`} className="block group">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>{customer.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium group-hover:underline">{customer.name}</p>
                        <p className="text-sm text-muted-foreground">{customer.email}</p>
                      </div>
                    </div>
                  </Link>
                </CardContent>
              </Card>

              {/* Contract Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Contract Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Contract Number</span>
                    <span className="font-medium">{contract.contractNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Contract Type</span>
                    <span className="capitalize">{contract.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Start Date</span>
                    <span>{formatDate(contract.startDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">End Date</span>
                    <span>{formatDate(contract.endDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Billing Frequency</span>
                    <span className="capitalize">{contract.billingFrequency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Auto Renew</span>
                    <span>{contract.autoRenew ? "Yes" : "No"}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Revenue Account</span>
                    <span>4000 - Revenue</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Deferred Account</span>
                    <span>2400 - Deferred Revenue</span>
                  </div>
                </CardContent>
              </Card>

              {/* Key Dates */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Key Dates</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                        <Calendar className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium">Next Invoice</p>
                        <p className="text-sm text-muted-foreground">April 15, 2026</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                        <RefreshCw className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium">Renewal Date</p>
                        <p className="text-sm text-muted-foreground">{formatDate(contract.endDate)}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
