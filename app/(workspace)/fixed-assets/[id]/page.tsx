"use client"

import { use, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Building2, Calendar, Clock, Download, Edit, FileText, Landmark, MoreHorizontal, Package, Plus, Settings, TrendingDown, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { mockAssets } from "@/lib/mock-data"
import { formatCurrency, formatDate } from "@/lib/services"

export default function AssetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  const asset = useMemo(() => mockAssets.find(a => a.id === id) || mockAssets[0], [id])
  
  const accumulatedDepreciation = asset.acquisitionCost - asset.currentValue
  const depreciationPercent = (accumulatedDepreciation / asset.acquisitionCost) * 100
  const remainingLife = Math.max(0, asset.usefulLife - Math.floor((Date.now() - new Date(asset.inServiceDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)))

  const statusColors: Record<string, string> = {
    active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    disposed: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
    "fully-depreciated": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    impaired: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  }

  // Generate depreciation schedule
  const depreciationSchedule = useMemo(() => {
    const schedule = []
    const annualDepreciation = (asset.acquisitionCost - (asset.salvageValue || 0)) / asset.usefulLife
    let bookValue = asset.acquisitionCost
    
    for (let year = 1; year <= asset.usefulLife; year++) {
      const yearStart = new Date(asset.inServiceDate)
      yearStart.setFullYear(yearStart.getFullYear() + year - 1)
      
      bookValue -= annualDepreciation
      schedule.push({
        year,
        period: yearStart.getFullYear().toString(),
        depreciation: annualDepreciation,
        accumulated: annualDepreciation * year,
        bookValue: Math.max(bookValue, asset.salvageValue || 0),
      })
    }
    return schedule
  }, [asset])

  // Chart data
  const chartData = depreciationSchedule.map(s => ({
    period: s.period,
    depreciation: s.depreciation,
    bookValue: s.bookValue,
  }))

  const chartConfig: ChartConfig = {
    depreciation: { label: "Depreciation", color: "hsl(var(--chart-1))" },
    bookValue: { label: "Book Value", color: "hsl(var(--chart-2))" },
  }

  // Activity timeline
  const timeline = [
    { id: 1, type: "acquired", date: asset.acquisitionDate, description: `Asset acquired for ${formatCurrency(asset.acquisitionCost)}` },
    { id: 2, type: "service", date: asset.inServiceDate, description: "Placed in service" },
    ...(asset.status === "disposed" 
      ? [{ id: 3, type: "disposed", date: asset.disposalDate || new Date().toISOString(), description: `Asset disposed for ${formatCurrency(asset.disposalValue || 0)}` }]
      : []),
  ]

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b bg-background">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/fixed-assets">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-semibold">{asset.name}</h1>
                <Badge className={statusColors[asset.status]}>{asset.status}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {asset.assetNumber} &middot; {asset.category}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {asset.status === "active" && (
              <Button variant="outline" size="sm">
                <TrendingDown className="mr-2 h-4 w-4" />
                Record Impairment
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Asset
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Change Depreciation
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Download className="mr-2 h-4 w-4" />
                  Export Details
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {asset.status === "active" && (
                  <DropdownMenuItem className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Dispose Asset
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        <div className="mx-auto max-w-6xl space-y-6">
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Acquisition Cost</p>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold mt-2">{formatCurrency(asset.acquisitionCost)}</p>
                <p className="text-xs text-muted-foreground mt-1">Original value</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Current Book Value</p>
                  <Landmark className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold mt-2">{formatCurrency(asset.currentValue)}</p>
                <p className="text-xs text-muted-foreground mt-1">Net of depreciation</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Accumulated Depreciation</p>
                  <TrendingDown className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold mt-2">{formatCurrency(accumulatedDepreciation)}</p>
                <div className="mt-2">
                  <Progress value={depreciationPercent} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">{depreciationPercent.toFixed(1)}% depreciated</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Remaining Life</p>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold mt-2">{remainingLife} years</p>
                <p className="text-xs text-muted-foreground mt-1">of {asset.usefulLife} year useful life</p>
              </CardContent>
            </Card>
          </div>

          {/* Depreciation Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Depreciation Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[250px] w-full">
                <BarChart data={chartData} accessibilityLayer>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="period" tickLine={false} axisLine={false} tickMargin={8} />
                  <YAxis 
                    tickLine={false} 
                    axisLine={false} 
                    tickMargin={8}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="depreciation" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="schedule" className="space-y-4">
            <TabsList>
              <TabsTrigger value="schedule">Depreciation Schedule</TabsTrigger>
              <TabsTrigger value="details">Asset Details</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
            </TabsList>

            <TabsContent value="schedule">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">Depreciation Schedule</CardTitle>
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Export
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Year</TableHead>
                        <TableHead>Period</TableHead>
                        <TableHead className="text-right">Depreciation</TableHead>
                        <TableHead className="text-right">Accumulated</TableHead>
                        <TableHead className="text-right">Book Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {depreciationSchedule.map(row => (
                        <TableRow key={row.year}>
                          <TableCell>{row.year}</TableCell>
                          <TableCell>{row.period}</TableCell>
                          <TableCell className="text-right">{formatCurrency(row.depreciation)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(row.accumulated)}</TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(row.bookValue)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="details">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Asset Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Asset Number</p>
                        <p className="font-medium">{asset.assetNumber}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Asset Name</p>
                        <p className="font-medium">{asset.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Description</p>
                        <p className="font-medium">{asset.description || "No description provided"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Category</p>
                        <p className="font-medium">{asset.category}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Location</p>
                        <p className="font-medium">{asset.location || "Not specified"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Department</p>
                        <p className="font-medium">{asset.departmentId || "Not assigned"}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Acquisition Date</p>
                        <p className="font-medium">{formatDate(asset.acquisitionDate)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">In Service Date</p>
                        <p className="font-medium">{formatDate(asset.inServiceDate)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Depreciation Method</p>
                        <p className="font-medium capitalize">{asset.depreciationMethod.replace("-", " ")}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Useful Life</p>
                        <p className="font-medium">{asset.usefulLife} years</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Salvage Value</p>
                        <p className="font-medium">{formatCurrency(asset.salvageValue || 0)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Asset Account</p>
                        <p className="font-medium">1500 - Fixed Assets</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Activity Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {timeline.map((event, index) => (
                      <div key={event.id} className="flex gap-3">
                        <div className="relative">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                            {event.type === "acquired" ? (
                              <Package className="h-4 w-4" />
                            ) : event.type === "disposed" ? (
                              <Trash2 className="h-4 w-4" />
                            ) : (
                              <Calendar className="h-4 w-4" />
                            )}
                          </div>
                          {index < timeline.length - 1 && (
                            <div className="absolute left-4 top-8 h-full w-px bg-border" />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <p className="font-medium">{event.description}</p>
                          <p className="text-sm text-muted-foreground">{formatDate(event.date)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">Supporting Documents</CardTitle>
                  <Button variant="outline" size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Upload
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    <div className="flex items-center gap-3 rounded-lg border p-3">
                      <div className="rounded bg-blue-100 p-2 dark:bg-blue-900/30">
                        <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">purchase_invoice_{asset.assetNumber}.pdf</p>
                        <p className="text-sm text-muted-foreground">245 KB &middot; Uploaded {formatDate(asset.acquisitionDate)}</p>
                      </div>
                      <Button variant="ghost" size="icon">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-3 rounded-lg border p-3">
                      <div className="rounded bg-green-100 p-2 dark:bg-green-900/30">
                        <FileText className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">warranty_{asset.assetNumber}.pdf</p>
                        <p className="text-sm text-muted-foreground">128 KB &middot; Uploaded {formatDate(asset.acquisitionDate)}</p>
                      </div>
                      <Button variant="ghost" size="icon">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
