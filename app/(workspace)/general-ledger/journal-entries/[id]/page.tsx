"use client"

import { use, useMemo, useState } from "react"
import Link from "next/link"
import { AlertTriangle, ArrowLeft, Check, Copy, Download, Edit, FileText, Lock, MoreHorizontal, Paperclip, Plus, RotateCcw, Send, Trash2, User } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { mockJournalEntries, mockAccounts } from "@/lib/mock-data"
import { formatCurrency, formatDate } from "@/lib/services"

export default function JournalEntryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [comment, setComment] = useState("")

  const journal = useMemo(() => mockJournalEntries.find(j => j.id === id) || mockJournalEntries[0], [id])
  
  const enrichedLines = useMemo(() => 
    journal.lines.map(line => {
      const account = mockAccounts.find(a => a.id === line.accountId)
      return {
        ...line,
        accountName: account?.name || "Unknown Account",
        accountNumber: account?.accountNumber || "0000",
      }
    }),
    [journal.lines]
  )

  const totalDebits = enrichedLines.filter(l => l.type === "debit").reduce((sum, l) => sum + l.amount, 0)
  const totalCredits = enrichedLines.filter(l => l.type === "credit").reduce((sum, l) => sum + l.amount, 0)
  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.01

  const statusColors: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    approved: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    posted: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    reversed: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  }

  const timeline = [
    { id: 1, type: "created", user: journal.createdBy || "System", date: journal.createdAt, description: "Journal entry created" },
    ...(journal.status !== "draft"
      ? [{ id: 2, type: "submitted", user: journal.createdBy || "System", date: journal.createdAt, description: "Submitted for approval" }]
      : []),
    ...(journal.status === "posted" || journal.status === "approved"
      ? [{ id: 3, type: "approved", user: "Controller", date: journal.entryDate, description: "Approved by controller" }]
      : []),
    ...(journal.status === "posted"
      ? [{ id: 4, type: "posted", user: "System", date: journal.entryDate, description: "Posted to general ledger" }]
      : []),
    ...(journal.status === "rejected"
      ? [{ id: 5, type: "rejected", user: "Controller", date: journal.entryDate, description: "Entry rejected - requires revision" }]
      : []),
  ]

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b bg-background">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/general-ledger/journal-entries">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-semibold">{journal.entryNumber}</h1>
                <Badge className={statusColors[journal.status]}>{journal.status}</Badge>
                {journal.isRecurring && <Badge variant="outline">Recurring</Badge>}
                {journal.isReversing && <Badge variant="outline">Reversing</Badge>}
              </div>
              <p className="text-sm text-muted-foreground">
                {journal.entryType} &middot; {formatDate(journal.entryDate)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {journal.status === "draft" && (
              <Button size="sm">
                <Send className="mr-2 h-4 w-4" />
                Submit for Approval
              </Button>
            )}
            {journal.status === "pending" && (
              <>
                <Button variant="outline" size="sm" className="text-destructive">
                  Reject
                </Button>
                <Button size="sm" className="bg-green-600 hover:bg-green-700">
                  <Check className="mr-2 h-4 w-4" />
                  Approve & Post
                </Button>
              </>
            )}
            {journal.status === "posted" && (
              <Button variant="outline" size="sm">
                <RotateCcw className="mr-2 h-4 w-4" />
                Reverse Entry
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
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate Entry
                </DropdownMenuItem>
                {journal.status === "draft" && (
                  <DropdownMenuItem>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Entry
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem>
                  <Download className="mr-2 h-4 w-4" />
                  Export PDF
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Paperclip className="mr-2 h-4 w-4" />
                  Add Attachment
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {journal.status === "draft" && (
                  <DropdownMenuItem className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Entry
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        <div className="mx-auto max-w-6xl">
          {/* Balance Warning */}
          {!isBalanced && (
            <Alert variant="destructive" className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Entry Out of Balance</AlertTitle>
              <AlertDescription>
                Debits ({formatCurrency(totalDebits)}) do not equal credits ({formatCurrency(totalCredits)}). 
                Difference: {formatCurrency(Math.abs(totalDebits - totalCredits))}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Summary Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Entry Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Debits</p>
                      <p className="text-2xl font-bold">{formatCurrency(totalDebits)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Credits</p>
                      <p className="text-2xl font-bold">{formatCurrency(totalCredits)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Line Items</p>
                      <p className="text-2xl font-bold">{enrichedLines.length}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Balance Status</p>
                      <div className="flex items-center gap-2 mt-1">
                        {isBalanced ? (
                          <>
                            <div className="h-3 w-3 rounded-full bg-green-500" />
                            <span className="font-medium text-green-600">Balanced</span>
                          </>
                        ) : (
                          <>
                            <div className="h-3 w-3 rounded-full bg-red-500" />
                            <span className="font-medium text-red-600">Unbalanced</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tabs */}
              <Tabs defaultValue="lines" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="lines">Line Items</TabsTrigger>
                  <TabsTrigger value="attachments">Attachments</TabsTrigger>
                  <TabsTrigger value="activity">Activity</TabsTrigger>
                </TabsList>

                <TabsContent value="lines">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="text-base">Journal Lines</CardTitle>
                      {journal.status === "draft" && (
                        <Button variant="outline" size="sm">
                          <Plus className="mr-2 h-4 w-4" />
                          Add Line
                        </Button>
                      )}
                    </CardHeader>
                    <CardContent className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Account</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Department</TableHead>
                            <TableHead className="text-right">Debit</TableHead>
                            <TableHead className="text-right">Credit</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {enrichedLines.map(line => (
                            <TableRow key={line.id}>
                              <TableCell>
                                <Link 
                                  href={`/general-ledger/chart-of-accounts/${line.accountId}`}
                                  className="font-medium text-primary hover:underline"
                                >
                                  {line.accountNumber} - {line.accountName}
                                </Link>
                              </TableCell>
                              <TableCell>{line.description || "-"}</TableCell>
                              <TableCell>{line.departmentId || "-"}</TableCell>
                              <TableCell className="text-right">
                                {line.type === "debit" ? formatCurrency(line.amount) : ""}
                              </TableCell>
                              <TableCell className="text-right">
                                {line.type === "credit" ? formatCurrency(line.amount) : ""}
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow className="bg-muted/50 font-semibold">
                            <TableCell colSpan={3}>Totals</TableCell>
                            <TableCell className="text-right">{formatCurrency(totalDebits)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(totalCredits)}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="attachments">
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
                            <p className="font-medium">supporting_doc_{journal.entryNumber}.pdf</p>
                            <p className="text-sm text-muted-foreground">156 KB &middot; Uploaded {formatDate(journal.createdAt)}</p>
                          </div>
                          <Button variant="ghost" size="icon">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="activity">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Activity Log</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {timeline.map((event, index) => (
                          <div key={event.id} className="flex gap-3">
                            <div className="relative">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                                {event.type === "posted" ? (
                                  <Check className="h-4 w-4 text-green-600" />
                                ) : event.type === "rejected" ? (
                                  <AlertTriangle className="h-4 w-4 text-red-600" />
                                ) : (
                                  <User className="h-4 w-4" />
                                )}
                              </div>
                              {index < timeline.length - 1 && (
                                <div className="absolute left-4 top-8 h-full w-px bg-border" />
                              )}
                            </div>
                            <div className="flex-1 pb-4">
                              <p className="font-medium">{event.description}</p>
                              <p className="text-sm text-muted-foreground">
                                {event.user} &middot; {formatDate(event.date)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Entry Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Entry Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Entry Number</span>
                    <span className="font-medium">{journal.entryNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Entry Date</span>
                    <span>{formatDate(journal.entryDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Entry Type</span>
                    <span className="capitalize">{journal.entryType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Period</span>
                    <span>{journal.periodId || "Current"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Entity</span>
                    <span>Acme Corp</span>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-muted-foreground mb-1">Description</p>
                    <p className="font-medium">{journal.description}</p>
                  </div>
                  {journal.reference && (
                    <div>
                      <p className="text-muted-foreground mb-1">Reference</p>
                      <p className="font-medium">{journal.reference}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Created By */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Created By</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {(journal.createdBy || "SY").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{journal.createdBy || "System"}</p>
                      <p className="text-sm text-muted-foreground">{formatDate(journal.createdAt)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Comments */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Comments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>You</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <Textarea
                          placeholder="Add a comment..."
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          className="min-h-[80px]"
                        />
                        <div className="mt-2 flex justify-end">
                          <Button size="sm" disabled={!comment.trim()}>
                            Post Comment
                          </Button>
                        </div>
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
