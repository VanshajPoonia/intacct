"use client"

import { useEffect, useState, useCallback } from "react"
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
  TableFooter,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  CheckCircle, 
  RotateCcw, 
  Printer, 
  Download,
  FileText,
  Clock,
  User,
  Building,
  Paperclip,
} from "lucide-react"
import type { JournalEntry } from "@/lib/types"
import type { AuditLogEntry } from "@/lib/services"
import { getJournalEntryById, getAuditLogs } from "@/lib/services"

interface JournalEntryDrawerProps {
  entry: JournalEntry | null
  open: boolean
  onClose: () => void
  onPost?: (id: string) => void
  onReverse?: (id: string) => void
}

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  posted: "bg-green-100 text-green-800",
  reversed: "bg-orange-100 text-orange-800",
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value)
}

export function JournalEntryDrawer({ 
  entry: initialEntry, 
  open, 
  onClose,
  onPost,
  onReverse,
}: JournalEntryDrawerProps) {
  const [entry, setEntry] = useState<JournalEntry | null>(initialEntry)
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("details")

  // Fetch full entry details and audit logs when drawer opens
  const fetchEntryData = useCallback(async () => {
    if (!initialEntry?.id) return
    
    setLoading(true)
    try {
      const [entryData, logsData] = await Promise.all([
        getJournalEntryById(initialEntry.id),
        getAuditLogs('journal_entry', initialEntry.id),
      ])
      
      if (entryData) {
        setEntry(entryData)
      }
      setAuditLogs(logsData.data)
    } catch (error) {
      console.error('Error fetching entry data:', error)
    } finally {
      setLoading(false)
    }
  }, [initialEntry?.id])

  useEffect(() => {
    if (open && initialEntry) {
      setEntry(initialEntry)
      fetchEntryData()
    }
  }, [open, initialEntry, fetchEntryData])

  // Calculate totals
  const totals = entry?.lines.reduce(
    (acc, line) => ({
      debit: acc.debit + line.debit,
      credit: acc.credit + line.credit,
    }),
    { debit: 0, credit: 0 }
  ) || { debit: 0, credit: 0 }

  const isBalanced = Math.abs(totals.debit - totals.credit) < 0.01

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl p-0 flex flex-col">
        <SheetHeader className="px-6 py-4 border-b">
          <div className="flex items-start justify-between">
            <div>
              <SheetTitle className="text-lg font-semibold">
                {loading ? <Skeleton className="h-6 w-32" /> : entry?.number}
              </SheetTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {loading ? (
                  <Skeleton className="h-4 w-48" />
                ) : (
                  entry?.description
                )}
              </p>
            </div>
            {entry && (
              <Badge variant="secondary" className={statusColors[entry.status]}>
                {entry.status}
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
                value="lines" 
                className="h-10 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0"
              >
                Journal Lines
              </TabsTrigger>
              <TabsTrigger 
                value="audit" 
                className="h-10 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0"
              >
                Audit Trail
              </TabsTrigger>
              <TabsTrigger 
                value="attachments" 
                className="h-10 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0"
              >
                Attachments
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
              ) : entry ? (
                <div className="space-y-6">
                  {/* Header Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-muted">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Entry Number</p>
                        <p className="font-medium">{entry.number}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-muted">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Entry Date</p>
                        <p className="font-medium">{format(new Date(entry.date), 'MMM d, yyyy')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-muted">
                        <Building className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Entity</p>
                        <p className="font-medium">
                          {entry.entityId === 'e1' ? 'Acme Corporation' : 
                           entry.entityId === 'e2' ? 'Acme West' : 
                           entry.entityId === 'e3' ? 'Acme Europe' : 'Unknown'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-muted">
                        <User className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Created By</p>
                        <p className="font-medium">{entry.createdBy}</p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Description */}
                  <div>
                    <p className="text-sm font-medium mb-2">Description</p>
                    <p className="text-sm text-muted-foreground">{entry.description}</p>
                  </div>

                  <Separator />

                  {/* Summary */}
                  <div>
                    <p className="text-sm font-medium mb-3">Summary</p>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground">Total Debits</p>
                        <p className="text-lg font-semibold text-green-600">{formatCurrency(totals.debit)}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground">Total Credits</p>
                        <p className="text-lg font-semibold text-blue-600">{formatCurrency(totals.credit)}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground">Balance</p>
                        <p className={`text-lg font-semibold ${isBalanced ? 'text-foreground' : 'text-destructive'}`}>
                          {isBalanced ? 'Balanced' : formatCurrency(Math.abs(totals.debit - totals.credit))}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Timestamps */}
                  <div className="pt-4 border-t space-y-2 text-sm text-muted-foreground">
                    <p>Created: {format(new Date(entry.createdAt), 'MMM d, yyyy h:mm a')}</p>
                    {entry.postedAt && (
                      <p>Posted: {format(new Date(entry.postedAt), 'MMM d, yyyy h:mm a')}</p>
                    )}
                  </div>
                </div>
              ) : null}
            </TabsContent>

            <TabsContent value="lines" className="p-6 m-0">
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : entry ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Account</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right w-[120px]">Debit</TableHead>
                      <TableHead className="text-right w-[120px]">Credit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entry.lines.map((line) => (
                      <TableRow key={line.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{line.accountNumber}</p>
                            <p className="text-xs text-muted-foreground">{line.accountName}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {line.description || '-'}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {line.debit > 0 ? formatCurrency(line.debit) : '-'}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {line.credit > 0 ? formatCurrency(line.credit) : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={2} className="font-medium">Total</TableCell>
                      <TableCell className="text-right font-mono font-medium">
                        {formatCurrency(totals.debit)}
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium">
                        {formatCurrency(totals.credit)}
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              ) : null}
            </TabsContent>

            <TabsContent value="audit" className="p-6 m-0">
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="space-y-1 flex-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No audit history available</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {auditLogs.map((log, index) => (
                    <div key={log.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className="p-2 rounded-full bg-muted">
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        {index < auditLogs.length - 1 && (
                          <div className="w-px h-full bg-border mt-2" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{log.userName}</span>
                          <Badge variant="outline" className="text-xs capitalize">
                            {log.action}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {format(new Date(log.timestamp), 'MMM d, yyyy h:mm a')}
                        </p>
                        {log.changes && log.changes.length > 0 && (
                          <div className="mt-2 p-2 rounded bg-muted/50 text-xs">
                            {log.changes.map((change, i) => (
                              <p key={i}>
                                <span className="font-medium">{change.field}:</span>{' '}
                                <span className="text-muted-foreground">{change.oldValue}</span>
                                {' → '}
                                <span>{change.newValue}</span>
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="attachments" className="p-6 m-0">
              <div className="text-center py-8 text-muted-foreground">
                <Paperclip className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No attachments</p>
                <Button variant="outline" size="sm" className="mt-3">
                  Add Attachment
                </Button>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Printer className="h-4 w-4 mr-1.5" />
              Print
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-1.5" />
              Export
            </Button>
          </div>
          <div className="flex items-center gap-2">
            {entry?.status === 'draft' && onPost && (
              <Button 
                size="sm" 
                onClick={() => {
                  onPost(entry.id)
                  onClose()
                }}
              >
                <CheckCircle className="h-4 w-4 mr-1.5" />
                Post Entry
              </Button>
            )}
            {entry?.status === 'posted' && onReverse && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  onReverse(entry.id)
                  onClose()
                }}
              >
                <RotateCcw className="h-4 w-4 mr-1.5" />
                Reverse
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
