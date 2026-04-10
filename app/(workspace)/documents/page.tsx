"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Breadcrumbs } from "@/components/navigation/breadcrumbs"
import {
  DenseSectionHeader,
  WorkspaceBreadcrumbRow,
  WorkspaceContentContainer,
  WorkspacePageToolbar,
} from "@/components/layout/workspace-primitives"
import { useWorkspaceShell } from "@/components/layout/workspace-shell-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Download,
  Eye,
  File as FilePdf,
  FileCheck,
  FileImage,
  FileSpreadsheet,
  FileText,
  Filter,
  MoreHorizontal,
  Search,
  Trash2,
  Upload,
} from "lucide-react"
import { cn } from "@/lib/utils"

const toneClasses = {
  neutral: "border-border bg-background text-muted-foreground",
  accent: "border-primary/20 bg-primary/10 text-primary",
  positive: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  critical: "border-red-200 bg-red-50 text-red-700",
} as const

interface Document {
  id: string
  name: string
  type: "invoice" | "receipt" | "contract" | "statement" | "report" | "other"
  fileType: "pdf" | "image" | "spreadsheet" | "document"
  size: string
  uploadedAt: Date
  uploadedBy: string
  status: "pending" | "approved" | "rejected" | "archived"
  relatedEntity: string
  relatedEntityId: string
  relatedModule: string
  tags: string[]
}

const mockDocuments: Document[] = [
  {
    id: "doc-001",
    name: "INV-2024-001-Support.pdf",
    type: "invoice",
    fileType: "pdf",
    size: "245 KB",
    uploadedAt: new Date("2024-03-15T10:30:00"),
    uploadedBy: "John Smith",
    status: "approved",
    relatedEntity: "Bill #INV-2024-001",
    relatedEntityId: "bill-001",
    relatedModule: "Accounts Payable",
    tags: ["vendor", "office-supplies"],
  },
  {
    id: "doc-002",
    name: "Receipt-March-2024.jpg",
    type: "receipt",
    fileType: "image",
    size: "1.2 MB",
    uploadedAt: new Date("2024-03-14T14:22:00"),
    uploadedBy: "Sarah Johnson",
    status: "pending",
    relatedEntity: "Expense Report #EXP-001",
    relatedEntityId: "exp-001",
    relatedModule: "Expenses",
    tags: ["travel", "Q1-2024"],
  },
  {
    id: "doc-003",
    name: "Vendor-Agreement-2024.pdf",
    type: "contract",
    fileType: "pdf",
    size: "890 KB",
    uploadedAt: new Date("2024-03-10T09:15:00"),
    uploadedBy: "Michael Brown",
    status: "approved",
    relatedEntity: "Vendor: Acme Corp",
    relatedEntityId: "vendor-001",
    relatedModule: "Vendors",
    tags: ["legal", "contract"],
  },
  {
    id: "doc-004",
    name: "Bank-Statement-Feb-2024.pdf",
    type: "statement",
    fileType: "pdf",
    size: "456 KB",
    uploadedAt: new Date("2024-03-05T16:45:00"),
    uploadedBy: "Emily Davis",
    status: "approved",
    relatedEntity: "Chase Business Checking",
    relatedEntityId: "bank-001",
    relatedModule: "Cash Management",
    tags: ["banking", "reconciliation"],
  },
  {
    id: "doc-005",
    name: "Q1-Budget-Analysis.xlsx",
    type: "report",
    fileType: "spreadsheet",
    size: "2.1 MB",
    uploadedAt: new Date("2024-03-01T11:00:00"),
    uploadedBy: "Robert Wilson",
    status: "approved",
    relatedEntity: "Budget Version: FY2024-Q1",
    relatedEntityId: "budget-001",
    relatedModule: "Budgets & Forecasting",
    tags: ["budget", "quarterly"],
  },
  {
    id: "doc-006",
    name: "Customer-PO-2024-05.pdf",
    type: "other",
    fileType: "pdf",
    size: "125 KB",
    uploadedAt: new Date("2024-02-28T13:30:00"),
    uploadedBy: "Lisa Anderson",
    status: "pending",
    relatedEntity: "Invoice #AR-2024-005",
    relatedEntityId: "invoice-005",
    relatedModule: "Accounts Receivable",
    tags: ["customer", "purchase-order"],
  },
  {
    id: "doc-007",
    name: "Audit-Support-2023.pdf",
    type: "other",
    fileType: "pdf",
    size: "3.4 MB",
    uploadedAt: new Date("2024-02-20T08:00:00"),
    uploadedBy: "James Taylor",
    status: "archived",
    relatedEntity: "Audit: FY2023",
    relatedEntityId: "audit-001",
    relatedModule: "General Ledger",
    tags: ["audit", "compliance"],
  },
  {
    id: "doc-008",
    name: "Asset-Photo-Server.jpg",
    type: "other",
    fileType: "image",
    size: "2.8 MB",
    uploadedAt: new Date("2024-02-15T15:20:00"),
    uploadedBy: "Jennifer Lee",
    status: "approved",
    relatedEntity: "Asset: Server Equipment",
    relatedEntityId: "asset-001",
    relatedModule: "Fixed Assets",
    tags: ["asset", "equipment"],
  },
]

function getFileIcon(fileType: Document["fileType"]) {
  switch (fileType) {
    case "pdf":
      return <FilePdf className="h-5 w-5 text-red-500" />
    case "image":
      return <FileImage className="h-5 w-5 text-blue-500" />
    case "spreadsheet":
      return <FileSpreadsheet className="h-5 w-5 text-emerald-500" />
    default:
      return <FileText className="h-5 w-5 text-muted-foreground" />
  }
}

function getStatusTone(status: Document["status"]) {
  switch (status) {
    case "approved":
      return "positive"
    case "pending":
      return "warning"
    case "rejected":
      return "critical"
    case "archived":
      return "neutral"
  }
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value)
}

export default function DocumentsPage() {
  const { activeEntity } = useWorkspaceShell()
  const [documents, setDocuments] = useState<Document[]>(mockDocuments)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [activeTab, setActiveTab] = useState("all")

  const filteredDocuments = useMemo(() => {
    let result = documents

    if (search) {
      const searchLower = search.toLowerCase()
      result = result.filter(
        doc =>
          doc.name.toLowerCase().includes(searchLower) ||
          doc.relatedEntity.toLowerCase().includes(searchLower) ||
          doc.tags.some(tag => tag.toLowerCase().includes(searchLower))
      )
    }

    if (typeFilter !== "all") {
      result = result.filter(doc => doc.type === typeFilter)
    }

    if (statusFilter !== "all") {
      result = result.filter(doc => doc.status === statusFilter)
    }

    if (activeTab !== "all") {
      result = result.filter(doc => doc.status === activeTab)
    }

    return result
  }, [documents, search, typeFilter, statusFilter, activeTab])

  const stats = useMemo(
    () => ({
      total: documents.length,
      pending: documents.filter(doc => doc.status === "pending").length,
      approved: documents.filter(doc => doc.status === "approved").length,
      archived: documents.filter(doc => doc.status === "archived").length,
    }),
    [documents]
  )

  if (!activeEntity) {
    return null
  }

  return (
    <WorkspaceContentContainer className="gap-5">
      <WorkspacePageToolbar>
        <WorkspaceBreadcrumbRow>
          <Breadcrumbs />
        </WorkspaceBreadcrumbRow>
      </WorkspacePageToolbar>

      <DenseSectionHeader
        eyebrow="Document Management"
        title="Document Center"
        description="Manage supporting documents, receipts, and attachments across all financial records."
        actions={
          <>
            <Button variant="outline" size="sm" className="rounded-sm">
              <Filter className="mr-1.5 h-4 w-4" />
              Advanced Filter
            </Button>
            <Button size="sm" className="rounded-sm" onClick={() => toast.info("Upload dialog will open")}>
              <Upload className="mr-1.5 h-4 w-4" />
              Upload Document
            </Button>
          </>
        }
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-border/80">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-muted">
                <FileText className="h-5 w-5 text-foreground" />
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Total Documents</div>
                <div className="text-2xl font-semibold">{stats.total}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-amber-50">
                <FileText className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Pending Review</div>
                <div className="text-2xl font-semibold">{stats.pending}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-emerald-50">
                <FileCheck className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Approved</div>
                <div className="text-2xl font-semibold">{stats.approved}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-muted">
                <FileText className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Archived</div>
                <div className="text-2xl font-semibold">{stats.archived}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <section className="space-y-4 border border-border/80 bg-card/95 shadow-sm">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="border-b border-border/80 px-4 pt-4">
            <TabsList className="h-auto gap-4 bg-transparent p-0">
              <TabsTrigger
                value="all"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none pb-3"
              >
                All Documents
              </TabsTrigger>
              <TabsTrigger
                value="pending"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none pb-3"
              >
                Pending ({stats.pending})
              </TabsTrigger>
              <TabsTrigger
                value="approved"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none pb-3"
              >
                Approved
              </TabsTrigger>
              <TabsTrigger
                value="archived"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-primary rounded-none pb-3"
              >
                Archived
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="px-4 py-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full lg:max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search documents, entities, or tags..."
                  className="h-9 rounded-sm pl-9"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="h-9 min-w-[140px] rounded-sm">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="invoice">Invoice</SelectItem>
                    <SelectItem value="receipt">Receipt</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="statement">Statement</SelectItem>
                    <SelectItem value="report">Report</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-9 min-w-[140px] rounded-sm">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <TabsContent value={activeTab} className="mt-0">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border/80 bg-muted/40 hover:bg-muted/40">
                  <TableHead className="px-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Document</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Type</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Related To</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Uploaded</TableHead>
                  <TableHead className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Status</TableHead>
                  <TableHead className="text-right text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                      No documents match the current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDocuments.map(doc => (
                    <TableRow key={doc.id} className="border-b border-border/60">
                      <TableCell className="px-4">
                        <div className="flex items-center gap-3">
                          {getFileIcon(doc.fileType)}
                          <div className="space-y-1">
                            <div className="font-medium text-foreground">{doc.name}</div>
                            <div className="flex flex-wrap gap-1">
                              {doc.tags.slice(0, 2).map(tag => (
                                <Badge key={tag} variant="outline" className="rounded-sm px-1.5 py-0 text-[10px] text-muted-foreground">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm capitalize text-foreground">{doc.type}</div>
                        <div className="text-xs text-muted-foreground">{doc.size}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-foreground">{doc.relatedEntity}</div>
                        <div className="text-xs text-muted-foreground">{doc.relatedModule}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-foreground">{formatDate(doc.uploadedAt)}</div>
                        <div className="text-xs text-muted-foreground">{doc.uploadedBy}</div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "rounded-sm px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]",
                            toneClasses[getStatusTone(doc.status)]
                          )}
                        >
                          {doc.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => toast.info("Preview document")}>
                              <Eye className="mr-2 h-4 w-4" />
                              Preview
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toast.info("Download document")}>
                              <Download className="mr-2 h-4 w-4" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toast.info("Delete document")} className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>
      </section>
    </WorkspaceContentContainer>
  )
}
