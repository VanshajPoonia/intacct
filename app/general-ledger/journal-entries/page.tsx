"use client"

import { useState, useEffect, useCallback } from "react"
import { startOfYear, format } from "date-fns"
import { AppShell } from "@/components/layout/app-shell"
import { PageHeader } from "@/components/finance/page-header"
import { Card, CardContent } from "@/components/ui/card"
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Upload,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  FileText,
  Eye,
  Pencil,
  RotateCcw,
  CheckCircle,
  CalendarIcon,
  User,
  Building2,
} from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { toast } from "sonner"
import type { 
  JournalEntry, 
  DashboardFilters, 
  PaginatedResponse,
  SortConfig,
  Entity,
} from "@/lib/types"
import { 
  getJournalEntries, 
  getEntities,
  postJournalEntry,
  reverseJournalEntry,
} from "@/lib/services"
import { JournalEntryDrawer } from "@/components/general-ledger/journal-entry-drawer"
import { CreateJournalEntryModal } from "@/components/general-ledger/create-journal-entry-modal"

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  posted: "bg-green-100 text-green-800",
  reversed: "bg-orange-100 text-orange-800",
}

const defaultFilters: DashboardFilters = {
  entityId: 'e4',
  dateRange: {
    startDate: startOfYear(new Date()),
    endDate: new Date(),
    preset: 'this_year'
  }
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value)
}

export default function JournalEntriesPage() {
  // Filter state
  const [filters, setFilters] = useState<DashboardFilters>(defaultFilters)
  const [entities, setEntities] = useState<Entity[]>([])
  const [statusFilter, setStatusFilter] = useState<string[]>([])
  const [sourceFilter, setSourceFilter] = useState<string>('all')
  const [createdByFilter, setCreatedByFilter] = useState<string>('all')
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)
  const [search, setSearch] = useState("")
  const [sort, setSort] = useState<SortConfig | undefined>(undefined)
  const [page, setPage] = useState(1)
  const pageSize = 10
  
  // Data state
  const [data, setData] = useState<PaginatedResponse<JournalEntry> | null>(null)
  const [loading, setLoading] = useState(true)
  
  // UI state
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)

  // Load entities on mount
  useEffect(() => {
    getEntities().then(setEntities)
  }, [])

  // Fetch journal entries
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getJournalEntries(
        filters,
        search || undefined,
        statusFilter.length > 0 ? statusFilter : undefined,
        sort,
        page,
        pageSize
      )
      setData(result)
    } catch (error) {
      console.error('Error fetching journal entries:', error)
    } finally {
      setLoading(false)
    }
  }, [filters, search, statusFilter, sort, page])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Handle entity change
  const handleEntityChange = (entityId: string) => {
    setFilters(prev => ({ ...prev, entityId }))
    setPage(1)
  }

  // Handle status filter change
  const handleStatusChange = (status: string) => {
    if (status === 'all') {
      setStatusFilter([])
    } else {
      setStatusFilter([status])
    }
    setPage(1)
  }

  // Handle search
  const handleSearch = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  // Handle sort
  const handleSort = (key: string) => {
    setSort(prev => {
      if (prev?.key === key) {
        return prev.direction === 'asc' 
          ? { key, direction: 'desc' } 
          : undefined
      }
      return { key, direction: 'asc' }
    })
  }

  // Handle row click
  const handleRowClick = (entry: JournalEntry) => {
    setSelectedEntry(entry)
    setDrawerOpen(true)
  }

  // Handle post
  const handlePost = async (id: string) => {
    await postJournalEntry(id)
    fetchData()
  }

  // Handle reverse
  const handleReverse = async (id: string) => {
    await reverseJournalEntry(id)
    fetchData()
  }

  // Handle create success
  const handleCreateSuccess = () => {
    setCreateModalOpen(false)
    fetchData()
  }

  // Calculate total debits and credits
  const getEntryTotals = (entry: JournalEntry) => {
    const debits = entry.lines.reduce((sum, line) => sum + line.debit, 0)
    const credits = entry.lines.reduce((sum, line) => sum + line.credit, 0)
    return { debits, credits }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Journal Entries"
          description="Create and manage journal entries"
          actions={
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => toast.info('Import feature coming soon')}>
                <Upload className="h-4 w-4 mr-1.5" />
                Import
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1.5" />
                Export
              </Button>
              <Button size="sm" onClick={() => setCreateModalOpen(true)}>
                <Plus className="h-4 w-4 mr-1.5" />
                New Entry
              </Button>
            </div>
          }
        />

        {/* Filters */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Select value={filters.entityId} onValueChange={handleEntityChange}>
                  <SelectTrigger className="w-[200px] h-9">
                    <SelectValue placeholder="Select entity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="e4">All Entities (Consolidated)</SelectItem>
                    {entities.map(entity => (
                      <SelectItem key={entity.id} value={entity.id}>
                        {entity.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Select 
                  value={statusFilter.length === 0 ? 'all' : statusFilter[0]} 
                  onValueChange={handleStatusChange}
                >
                  <SelectTrigger className="w-[140px] h-9">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="posted">Posted</SelectItem>
                    <SelectItem value="reversed">Reversed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search entries..."
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>

              {/* Date Range */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9">
                    <CalendarIcon className="h-4 w-4 mr-1.5" />
                    {startDate ? format(startDate, 'MMM d') : 'Start'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => { setStartDate(date); setPage(1); }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9">
                    <CalendarIcon className="h-4 w-4 mr-1.5" />
                    {endDate ? format(endDate, 'MMM d') : 'End'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => { setEndDate(date); setPage(1); }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              {/* Source Filter */}
              <Select value={sourceFilter} onValueChange={(v) => { setSourceFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[130px] h-9">
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="import">Import</SelectItem>
                  <SelectItem value="recurring">Recurring</SelectItem>
                  <SelectItem value="allocation">Allocation</SelectItem>
                </SelectContent>
              </Select>

              {/* Created By Filter */}
              <Select value={createdByFilter} onValueChange={(v) => { setCreatedByFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[140px] h-9">
                  <User className="h-4 w-4 mr-1.5" />
                  <SelectValue placeholder="Created By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="sarah">Sarah Chen</SelectItem>
                  <SelectItem value="michael">Michael Johnson</SelectItem>
                  <SelectItem value="emily">Emily Davis</SelectItem>
                </SelectContent>
              </Select>

              {(startDate || endDate || sourceFilter !== 'all' || createdByFilter !== 'all') && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setStartDate(undefined)
                    setEndDate(undefined)
                    setSourceFilter('all')
                    setCreatedByFilter('all')
                    setPage(1)
                  }}
                >
                  Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="-ml-3 h-8"
                      onClick={() => handleSort('number')}
                    >
                      Entry #
                      <ArrowUpDown className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  </TableHead>
                  <TableHead className="w-[100px]">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="-ml-3 h-8"
                      onClick={() => handleSort('date')}
                    >
                      Date
                      <ArrowUpDown className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  </TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right w-[120px]">Debit</TableHead>
                  <TableHead className="text-right w-[120px]">Credit</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead className="w-[100px]">Created By</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                    </TableRow>
                  ))
                ) : data?.data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <FileText className="h-8 w-8" />
                        <p>No journal entries found</p>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setCreateModalOpen(true)}
                        >
                          Create Entry
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.data.map((entry) => {
                    const totals = getEntryTotals(entry)
                    return (
                      <TableRow 
                        key={entry.id} 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleRowClick(entry)}
                      >
                        <TableCell className="font-medium">{entry.number}</TableCell>
                        <TableCell>{format(new Date(entry.date), 'MMM d, yyyy')}</TableCell>
                        <TableCell className="max-w-[300px] truncate">{entry.description}</TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(totals.debits)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(totals.credits)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={statusColors[entry.status]}>
                            {entry.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{entry.createdBy}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation()
                                handleRowClick(entry)
                              }}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              {entry.status === 'draft' && (
                                <>
                                  <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation()
                                  }}>
                                    <Pencil className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handlePost(entry.id)
                                    }}
                                    className="text-green-600"
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Post Entry
                                  </DropdownMenuItem>
                                </>
                              )}
                              {entry.status === 'posted' && (
                                <DropdownMenuItem 
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleReverse(entry.id)
                                  }}
                                  className="text-orange-600"
                                >
                                  <RotateCcw className="h-4 w-4 mr-2" />
                                  Reverse Entry
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
            {data && data.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <p className="text-sm text-muted-foreground">
                  Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, data.total)} of {data.total} entries
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {Array.from({ length: Math.min(5, data.totalPages) }, (_, i) => {
                    const pageNum = i + 1
                    return (
                      <Button
                        key={pageNum}
                        variant={page === pageNum ? "default" : "outline"}
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={page === data.totalPages}
                    onClick={() => setPage(p => p + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Journal Entry Drawer */}
      <JournalEntryDrawer
        entry={selectedEntry}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onPost={handlePost}
        onReverse={handleReverse}
      />

      {/* Create Journal Entry Modal */}
      <CreateJournalEntryModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
        entityId={filters.entityId !== 'e4' ? filters.entityId : undefined}
      />
    </AppShell>
  )
}
