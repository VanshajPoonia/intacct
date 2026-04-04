"use client"

import { useState, useEffect, useCallback } from "react"
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
  MoreHorizontal,
  ArrowUpDown,
  Folder,
  Eye,
  Pencil,
  Archive,
} from "lucide-react"
import type { Account, SortConfig } from "@/lib/types"
import { getChartOfAccounts, saveAccount, deleteAccount } from "@/lib/services"
import { AccountModal } from "@/components/general-ledger/account-modal"

const typeColors: Record<string, string> = {
  asset: "bg-blue-100 text-blue-800",
  liability: "bg-purple-100 text-purple-800",
  equity: "bg-green-100 text-green-800",
  revenue: "bg-emerald-100 text-emerald-800",
  expense: "bg-orange-100 text-orange-800",
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value)
}

export default function ChartOfAccountsPage() {
  // Filter state
  const [typeFilter, setTypeFilter] = useState<string[]>([])
  const [statusFilter, setStatusFilter] = useState<string>('active')
  const [search, setSearch] = useState("")
  const [sort, setSort] = useState<SortConfig | undefined>(undefined)
  
  // Data state
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  
  // UI state
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create')

  // Fetch accounts
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getChartOfAccounts(
        search || undefined,
        typeFilter.length > 0 ? typeFilter : undefined,
        statusFilter ? [statusFilter] : undefined,
        sort
      )
      setAccounts(result)
    } catch (error) {
      console.error('Error fetching accounts:', error)
    } finally {
      setLoading(false)
    }
  }, [search, typeFilter, statusFilter, sort])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Handle type filter change
  const handleTypeChange = (type: string) => {
    if (type === 'all') {
      setTypeFilter([])
    } else {
      setTypeFilter([type])
    }
  }

  // Handle status filter change
  const handleStatusChange = (status: string) => {
    setStatusFilter(status === 'all' ? '' : status)
  }

  // Handle search
  const handleSearch = (value: string) => {
    setSearch(value)
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

  // Handle create
  const handleCreate = () => {
    setSelectedAccount(null)
    setModalMode('create')
    setModalOpen(true)
  }

  // Handle edit
  const handleEdit = (account: Account) => {
    setSelectedAccount(account)
    setModalMode('edit')
    setModalOpen(true)
  }

  // Handle view
  const handleView = (account: Account) => {
    setSelectedAccount(account)
    setModalMode('view')
    setModalOpen(true)
  }

  // Handle archive
  const handleArchive = async (id: string) => {
    await deleteAccount(id)
    fetchData()
  }

  // Handle save
  const handleSave = async (data: Partial<Account>) => {
    await saveAccount(data)
    setModalOpen(false)
    fetchData()
  }

  // Group accounts by type for summary
  const accountsByType = accounts.reduce((acc, account) => {
    acc[account.type] = (acc[account.type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Chart of Accounts"
          description="Manage your general ledger account structure"
          actions={
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1.5" />
                Export
              </Button>
              <Button size="sm" onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-1.5" />
                New Account
              </Button>
            </div>
          }
        />

        {/* Summary Cards */}
        <div className="grid grid-cols-5 gap-4">
          {['asset', 'liability', 'equity', 'revenue', 'expense'].map(type => (
            <Card 
              key={type} 
              className={`cursor-pointer transition-colors ${typeFilter.includes(type) ? 'ring-2 ring-primary' : ''}`}
              onClick={() => handleTypeChange(typeFilter.includes(type) ? 'all' : type)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className={typeColors[type]}>
                    {type}
                  </Badge>
                  <span className="text-2xl font-semibold">{accountsByType[type] || 0}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2 capitalize">{type} Accounts</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Select 
                  value={typeFilter.length === 0 ? 'all' : typeFilter[0]} 
                  onValueChange={handleTypeChange}
                >
                  <SelectTrigger className="w-[140px] h-9">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="asset">Asset</SelectItem>
                    <SelectItem value="liability">Liability</SelectItem>
                    <SelectItem value="equity">Equity</SelectItem>
                    <SelectItem value="revenue">Revenue</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Select 
                  value={statusFilter || 'all'} 
                  onValueChange={handleStatusChange}
                >
                  <SelectTrigger className="w-[140px] h-9">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search accounts..."
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>

              <Button variant="outline" size="sm" className="ml-auto">
                <Filter className="h-4 w-4 mr-1.5" />
                More Filters
              </Button>
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
                      Number
                      <ArrowUpDown className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="-ml-3 h-8"
                      onClick={() => handleSort('name')}
                    >
                      Name
                      <ArrowUpDown className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  </TableHead>
                  <TableHead className="w-[120px]">Type</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right w-[140px]">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="-mr-3 h-8"
                      onClick={() => handleSort('balance')}
                    >
                      Balance
                      <ArrowUpDown className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  </TableHead>
                  <TableHead className="w-[90px]">Status</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24 ml-auto" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-14" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                    </TableRow>
                  ))
                ) : accounts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-32 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Folder className="h-8 w-8" />
                        <p>No accounts found</p>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={handleCreate}
                        >
                          Create Account
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  accounts.map((account) => (
                    <TableRow 
                      key={account.id} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleView(account)}
                    >
                      <TableCell className="font-mono font-medium">{account.number}</TableCell>
                      <TableCell className="font-medium">{account.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={typeColors[account.type]}>
                          {account.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{account.category}</TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(account.balance)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={account.status === 'active' ? 'default' : 'secondary'}>
                          {account.status}
                        </Badge>
                      </TableCell>
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
                              handleView(account)
                            }}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation()
                              handleEdit(account)
                            }}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {account.status === 'active' && (
                              <DropdownMenuItem 
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleArchive(account.id)
                                }}
                                className="text-orange-600"
                              >
                                <Archive className="h-4 w-4 mr-2" />
                                Archive
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

      {/* Account Modal */}
      <AccountModal
        account={selectedAccount}
        open={modalOpen}
        mode={modalMode}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />
    </AppShell>
  )
}
