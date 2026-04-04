// @ts-nocheck
"use client"

import { useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  Check,
  X,
  Clock,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Paperclip,
  Send,
  UserPlus,
  ArrowRight,
  FileText,
  Building2,
  Calendar,
  DollarSign,
  User,
  AlertCircle,
} from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"
import type { ApprovalItem, Approver } from "@/lib/types"

interface ApprovalDetailDrawerProps {
  approval: ApprovalItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onApprove: (id: string, comment?: string) => Promise<void>
  onReject: (id: string, comment?: string) => Promise<void>
  onReassign?: (id: string, userId: string) => Promise<void>
  users?: Array<{ id: string; name: string; email: string }>
}

// Mock line items for demo
const mockLineItems = [
  { id: '1', description: 'Software License - Annual', account: '6200 - Software', amount: 2400.00 },
  { id: '2', description: 'Cloud Hosting Services', account: '6210 - Cloud Services', amount: 1500.00 },
  { id: '3', description: 'Professional Services', account: '6300 - Consulting', amount: 3500.00 },
]

// Mock attachments
const mockAttachments = [
  { id: '1', name: 'invoice_12345.pdf', size: '245 KB', type: 'pdf', uploadedAt: new Date(2024, 0, 15) },
  { id: '2', name: 'receipt_scan.jpg', size: '1.2 MB', type: 'image', uploadedAt: new Date(2024, 0, 14) },
]

// Mock comments
const mockComments = [
  { id: '1', user: 'Sarah Chen', avatar: '', message: 'Please review the updated pricing.', createdAt: new Date(2024, 0, 15, 10, 30) },
  { id: '2', user: 'Michael Torres', avatar: '', message: 'Looks good to me. Forwarding to finance.', createdAt: new Date(2024, 0, 15, 14, 45) },
]

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value)
}

function ApproverStatus({ approver }: { approver: Approver }) {
  return (
    <div className="flex items-center gap-3 p-3 border rounded-lg">
      <Avatar className="h-8 w-8">
        <AvatarFallback className="text-xs bg-primary/10 text-primary">
          {approver.name.split(' ').map(n => n[0]).join('')}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{approver.name}</p>
        <p className="text-xs text-muted-foreground">{approver.email}</p>
      </div>
      <div className="flex items-center gap-2">
        {approver.status === 'approved' && (
          <>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span className="text-xs text-emerald-600">Approved</span>
          </>
        )}
        {approver.status === 'rejected' && (
          <>
            <XCircle className="h-4 w-4 text-red-600" />
            <span className="text-xs text-red-600">Rejected</span>
          </>
        )}
        {approver.status === 'pending' && (
          <>
            <Clock className="h-4 w-4 text-amber-600" />
            <span className="text-xs text-amber-600">Pending</span>
          </>
        )}
      </div>
    </div>
  )
}

export function ApprovalDetailDrawer({
  approval,
  open,
  onOpenChange,
  onApprove,
  onReject,
  onReassign,
  users = [],
}: ApprovalDetailDrawerProps) {
  const [comment, setComment] = useState("")
  const [newComment, setNewComment] = useState("")
  const [reassignUserId, setReassignUserId] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showReassign, setShowReassign] = useState(false)
  const [activeTab, setActiveTab] = useState("details")

  if (!approval) return null

  const handleApprove = async () => {
    setIsSubmitting(true)
    try {
      await onApprove(approval.id, comment || undefined)
      setComment("")
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReject = async () => {
    setIsSubmitting(true)
    try {
      await onReject(approval.id, comment || undefined)
      setComment("")
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReassign = async () => {
    if (!reassignUserId || !onReassign) return
    setIsSubmitting(true)
    try {
      await onReassign(approval.id, reassignUserId)
      setReassignUserId("")
      setShowReassign(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const typeLabels: Record<string, string> = {
    bill: 'Bill',
    invoice: 'Invoice',
    journal_entry: 'Journal Entry',
    purchase_order: 'Purchase Order',
    expense: 'Expense Report',
  }

  const isPending = approval.status === 'pending'

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[600px] sm:max-w-[600px] p-0 flex flex-col">
        <SheetHeader className="p-6 pb-4 border-b bg-muted/30">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-xs">
                  {typeLabels[approval.type] || approval.type}
                </Badge>
                <Badge 
                  variant="outline" 
                  className={
                    approval.status === 'pending' 
                      ? 'bg-amber-100 text-amber-700 border-amber-200' 
                      : approval.status === 'approved'
                      ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                      : 'bg-red-100 text-red-700 border-red-200'
                  }
                >
                  {approval.status.charAt(0).toUpperCase() + approval.status.slice(1)}
                </Badge>
              </div>
              <SheetTitle className="text-xl">{approval.documentNumber}</SheetTitle>
              <p className="text-sm text-muted-foreground mt-1">{approval.description}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">{formatCurrency(approval.amount)}</p>
              <p className="text-xs text-muted-foreground">{approval.currency}</p>
            </div>
          </div>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="mx-6 mt-4 w-auto justify-start">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="lines">Line Items</TabsTrigger>
            <TabsTrigger value="attachments" className="relative">
              Attachments
              <span className="ml-1.5 text-xs bg-muted px-1.5 rounded">{mockAttachments.length}</span>
            </TabsTrigger>
            <TabsTrigger value="comments" className="relative">
              Comments
              <span className="ml-1.5 text-xs bg-muted px-1.5 rounded">{mockComments.length}</span>
            </TabsTrigger>
            <TabsTrigger value="history">Approval Chain</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1">
            <TabsContent value="details" className="p-6 m-0">
              <div className="space-y-6">
                {/* Request Summary */}
                <div>
                  <h3 className="text-sm font-semibold mb-3">Request Summary</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Document</p>
                        <p className="text-sm font-medium">{approval.documentNumber}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Entity</p>
                        <p className="text-sm font-medium">TechFlow Inc</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Requested By</p>
                        <p className="text-sm font-medium">{approval.requestedBy}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Requested</p>
                        <p className="text-sm font-medium">{format(approval.requestedAt, 'MMM d, yyyy')}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Metadata */}
                <div>
                  <h3 className="text-sm font-semibold mb-3">Additional Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Department</span>
                      <span className="font-medium">Engineering</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Project</span>
                      <span className="font-medium">Infrastructure Upgrade</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Cost Center</span>
                      <span className="font-medium">CC-4500</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">Payment Terms</span>
                      <span className="font-medium">Net 30</span>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                {isPending && (
                  <div>
                    <h3 className="text-sm font-semibold mb-3">Quick Actions</h3>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => setShowReassign(!showReassign)}
                      >
                        <UserPlus className="h-4 w-4" />
                        Reassign
                      </Button>
                    </div>

                    {showReassign && (
                      <div className="mt-3 p-4 border rounded-lg bg-muted/30 space-y-3">
                        <Label>Reassign to</Label>
                        <Select value={reassignUserId} onValueChange={setReassignUserId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select user" />
                          </SelectTrigger>
                          <SelectContent>
                            {users.map((user) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleReassign} disabled={!reassignUserId || isSubmitting}>
                            Reassign
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setShowReassign(false)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="lines" className="p-6 m-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockLineItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.description}</TableCell>
                      <TableCell className="text-muted-foreground">{item.account}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatCurrency(item.amount)}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50 font-semibold">
                    <TableCell colSpan={2}>Total</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(mockLineItems.reduce((sum, item) => sum + item.amount, 0))}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="attachments" className="p-6 m-0">
              <div className="space-y-3">
                {mockAttachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <div className="p-2 bg-muted rounded">
                      <Paperclip className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{attachment.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {attachment.size} - Uploaded {format(attachment.uploadedAt, 'MMM d, yyyy')}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">View</Button>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="comments" className="p-6 m-0">
              <div className="space-y-4">
                {mockComments.map((commentItem) => (
                  <div key={commentItem.id} className="flex gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {commentItem.user.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{commentItem.user}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(commentItem.createdAt, { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{commentItem.message}</p>
                    </div>
                  </div>
                ))}

                <Separator className="my-4" />

                <div className="flex gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">SC</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <Textarea
                      placeholder="Add a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="min-h-[80px]"
                    />
                    <Button size="sm" disabled={!newComment.trim()}>
                      <Send className="h-4 w-4 mr-1.5" />
                      Post Comment
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="history" className="p-6 m-0">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold mb-3">Approval Chain</h3>
                
                {/* Approval Steps */}
                <div className="space-y-3">
                  {approval.approvers.map((approver, index) => (
                    <div key={approver.id}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-medium ${
                          index < approval.currentStep 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : index === approval.currentStep 
                            ? 'bg-amber-100 text-amber-700' 
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {index + 1}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          Step {index + 1} {index === approval.currentStep && isPending && '(Current)'}
                        </span>
                      </div>
                      <ApproverStatus approver={approver} />
                      {approver.comments && (
                        <p className="ml-9 mt-2 text-sm text-muted-foreground italic">
                          &ldquo;{approver.comments}&rdquo;
                        </p>
                      )}
                      {index < approval.approvers.length - 1 && (
                        <div className="flex items-center justify-center my-2">
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        {/* Action Footer */}
        {isPending && (
          <div className="p-6 border-t bg-background">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="approval-comment">Comment (optional)</Label>
                <Textarea
                  id="approval-comment"
                  placeholder="Add a comment with your decision..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="min-h-[60px]"
                />
              </div>
              <div className="flex gap-3">
                <Button
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  onClick={handleApprove}
                  disabled={isSubmitting}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={handleReject}
                  disabled={isSubmitting}
                >
                  <X className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
