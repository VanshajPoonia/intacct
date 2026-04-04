"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { format } from "date-fns"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Pencil, 
  FileText,
  Building,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Archive,
  TrendingUp,
} from "lucide-react"
import type { Vendor, Bill } from "@/lib/types"
import type { DashboardFilters } from "@/lib/types"
import { getBills } from "@/lib/services"

interface VendorDrawerProps {
  vendor: Vendor | null
  open: boolean
  onClose: () => void
  onEdit?: (vendor: Vendor) => void
  onArchive?: (id: string) => void
}

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  inactive: "bg-muted text-muted-foreground",
  pending: "bg-yellow-100 text-yellow-800",
}

const billStatusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-blue-100 text-blue-800",
  paid: "bg-green-100 text-green-800",
  voided: "bg-red-100 text-red-800",
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value)
}

export function VendorDrawer({ 
  vendor, 
  open, 
  onClose,
  onEdit,
  onArchive,
}: VendorDrawerProps) {
  const [activeTab, setActiveTab] = useState("details")
  const [loading, setLoading] = useState(false)
  const [bills, setBills] = useState<Bill[]>([])
  const [loadingBills, setLoadingBills] = useState(false)

  // Fetch vendor bills when drawer opens
  const fetchVendorBills = useCallback(async () => {
    if (!vendor?.id) return
    
    setLoadingBills(true)
    try {
      const defaultFilters: DashboardFilters = {
        entityId: 'e4',
        dateRange: {
          startDate: new Date(2024, 0, 1),
          endDate: new Date(),
          preset: 'this_year'
        },
        vendorId: vendor.id
      }
      
      const result = await getBills(defaultFilters, undefined, undefined, undefined, 1, 10)
      setBills(result.data)
    } catch (error) {
      console.error('Error fetching vendor bills:', error)
    } finally {
      setLoadingBills(false)
    }
  }, [vendor?.id])

  useEffect(() => {
    if (open && vendor) {
      setLoading(true)
      setTimeout(() => setLoading(false), 200)
      fetchVendorBills()
    }
  }, [open, vendor, fetchVendorBills])

  // Calculate bill stats
  const billStats = useMemo(() => {
    const total = bills.length
    const paid = bills.filter(b => b.status === 'paid').length
    const pending = bills.filter(b => b.status === 'pending' || b.status === 'approved').length
    const totalAmount = bills.reduce((sum, b) => sum + b.amount, 0)
    const paidAmount = bills.filter(b => b.status === 'paid').reduce((sum, b) => sum + b.amount, 0)
    
    return { total, paid, pending, totalAmount, paidAmount }
  }, [bills])

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl p-0 flex flex-col">
        <SheetHeader className="px-6 py-4 border-b">
          <div className="flex items-start justify-between">
            <div>
              <SheetTitle className="text-lg font-semibold">
                {loading ? <Skeleton className="h-6 w-40" /> : vendor?.name}
              </SheetTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {loading ? (
                  <Skeleton className="h-4 w-24" />
                ) : (
                  vendor?.code
                )}
              </p>
            </div>
            {vendor && (
              <Badge variant="secondary" className={statusColors[vendor.status]}>
                {vendor.status}
              </Badge>
            )}
          </div>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 border-b">
            <TabsList className="h-10 w-full justify-start bg-transparent p-0 gap-6">
              <TabsTrigger 
                value="details" 
                className="h-10 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0"
              >
                Details
              </TabsTrigger>
              <TabsTrigger 
                value="bills" 
                className="h-10 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0"
              >
                Bills ({billStats.total})
              </TabsTrigger>
              <TabsTrigger 
                value="payments" 
                className="h-10 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0"
              >
                Payment History
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1">
            <TabsContent value="details" className="p-6 m-0">
              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  ))}
                </div>
              ) : vendor ? (
                <div className="space-y-6">
                  {/* Contact Info */}
                  <div>
                    <p className="text-sm font-medium mb-3">Contact Information</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-muted">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Email</p>
                          <p className="text-sm">{vendor.email || '-'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-muted">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Phone</p>
                          <p className="text-sm">{vendor.phone || '-'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 col-span-2">
                        <div className="p-2 rounded-lg bg-muted">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Address</p>
                          <p className="text-sm">{vendor.address || '-'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Payment Info */}
                  <div>
                    <p className="text-sm font-medium mb-3">Payment Information</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-muted">
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Payment Terms</p>
                          <p className="font-medium">{vendor.paymentTerms}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-muted">
                          <Building className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Currency</p>
                          <p className="font-medium">{vendor.currency}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Balance Summary */}
                  <div>
                    <p className="text-sm font-medium mb-3">Account Summary</p>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground">Current Balance</p>
                        <p className="text-lg font-semibold">{formatCurrency(vendor.balance)}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground">Total Bills</p>
                        <p className="text-lg font-semibold">{billStats.total}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground">Pending Bills</p>
                        <p className="text-lg font-semibold">{billStats.pending}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </TabsContent>

            <TabsContent value="bills" className="p-6 m-0">
              {loadingBills ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : bills.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No bills for this vendor</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bill #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bills.map((bill) => (
                      <TableRow key={bill.id}>
                        <TableCell className="font-medium">{bill.number}</TableCell>
                        <TableCell>{format(new Date(bill.date), 'MMM d, yyyy')}</TableCell>
                        <TableCell>{format(new Date(bill.dueDate), 'MMM d, yyyy')}</TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(bill.amount)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={billStatusColors[bill.status]}>
                            {bill.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="payments" className="p-6 m-0">
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Payment history coming soon</p>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t flex items-center justify-between">
          <div className="flex items-center gap-2">
            {vendor?.status === 'active' && onArchive && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  onArchive(vendor.id)
                  onClose()
                }}
              >
                <Archive className="h-4 w-4 mr-1.5" />
                Archive
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {vendor && onEdit && (
              <Button 
                size="sm"
                onClick={() => {
                  onEdit(vendor)
                  onClose()
                }}
              >
                <Pencil className="h-4 w-4 mr-1.5" />
                Edit Vendor
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
