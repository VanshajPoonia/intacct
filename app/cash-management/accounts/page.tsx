"use client"

import { useState, useEffect } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { getBankAccounts, getEntities } from "@/lib/services"
import type { BankAccount, Entity } from "@/lib/types"
import { Plus, RefreshCw, Building2, CreditCard, Wallet, ExternalLink, MoreHorizontal, TrendingUp, TrendingDown } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

function formatCurrency(value: number, currency: string = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value)
}

const accountIcons: Record<string, typeof Building2> = {
  checking: Building2,
  savings: Wallet,
  credit: CreditCard,
  corporate_card: CreditCard,
}

export default function BankAccountsPage() {
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [entities, setEntities] = useState<Entity[]>([])
  const [selectedEntity, setSelectedEntity] = useState<string>("all")
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards")
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    setLoading(true)
    try {
      const [accountsResult, entitiesResult] = await Promise.all([
        getBankAccounts(),
        getEntities()
      ])
      setAccounts(accountsResult)
      setEntities(entitiesResult)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredAccounts = selectedEntity === "all" 
    ? accounts 
    : accounts.filter(a => a.entityId === selectedEntity)

  const totalBalance = filteredAccounts.reduce((sum, acc) => sum + acc.balance, 0)
  const totalAvailable = filteredAccounts.reduce((sum, acc) => sum + (acc.availableBalance || acc.balance), 0)
  const checkingAccounts = filteredAccounts.filter(a => a.type === 'checking')
  const cardAccounts = filteredAccounts.filter(a => a.type === 'credit' || a.type === 'corporate_card')

  return (
    <AppShell>
      <div className="flex-1 overflow-auto">
        <div className="p-6 space-y-6">
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Bank Accounts</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Manage connected bank accounts and card feeds
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Select value={selectedEntity} onValueChange={setSelectedEntity}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Entities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Entities</SelectItem>
                  {entities.map((entity) => (
                    <SelectItem key={entity.id} value={entity.id}>
                      {entity.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={loadData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync All
              </Button>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Account
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Total Balance</p>
                {loading ? (
                  <Skeleton className="h-8 w-32 mt-1" />
                ) : (
                  <p className="text-2xl font-bold tabular-nums">{formatCurrency(totalBalance)}</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Available Balance</p>
                {loading ? (
                  <Skeleton className="h-8 w-32 mt-1" />
                ) : (
                  <p className="text-2xl font-bold tabular-nums text-green-600">{formatCurrency(totalAvailable)}</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Bank Accounts</p>
                {loading ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-bold">{checkingAccounts.length + filteredAccounts.filter(a => a.type === 'savings').length}</p>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Card Accounts</p>
                {loading ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-bold">{cardAccounts.length}</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* View Toggle */}
          <div className="flex items-center justify-between">
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "cards" | "table")}>
              <TabsList>
                <TabsTrigger value="cards">Cards</TabsTrigger>
                <TabsTrigger value="table">Table</TabsTrigger>
              </TabsList>
            </Tabs>
            <p className="text-sm text-muted-foreground">
              Last synced: {accounts[0]?.lastSyncedAt ? format(accounts[0].lastSyncedAt, 'MMM d, h:mm a') : 'Never'}
            </p>
          </div>

          {/* Account Cards View */}
          {viewMode === "cards" && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <Skeleton className="h-12 w-full mb-3" />
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardContent>
                  </Card>
                ))
              ) : (
                filteredAccounts.map((account) => {
                  const Icon = accountIcons[account.type] || Building2
                  const isNegative = account.balance < 0
                  const isCard = account.type === 'credit' || account.type === 'corporate_card'

                  return (
                    <Card key={account.id} className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "p-2 rounded-lg",
                              isCard ? "bg-amber-100" : "bg-accent/10"
                            )}>
                              <Icon className={cn(
                                "h-5 w-5",
                                isCard ? "text-amber-700" : "text-accent"
                              )} />
                            </div>
                            <div>
                              <p className="font-medium">{account.name}</p>
                              <p className="text-xs text-muted-foreground">{account.bankName}</p>
                            </div>
                          </div>
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "capitalize text-xs",
                              account.status === 'frozen' && "bg-red-50 text-red-700 border-red-200"
                            )}
                          >
                            {account.type.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-baseline justify-between">
                            <span className="text-xs text-muted-foreground">{account.accountNumber}</span>
                            <span className={cn(
                              "text-xl font-semibold tabular-nums",
                              isNegative && "text-red-600"
                            )}>
                              {formatCurrency(account.balance, account.currency)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Available</span>
                            <span className="font-medium text-green-600">
                              {formatCurrency(account.availableBalance || account.balance, account.currency)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t">
                            <span className="text-xs text-muted-foreground">
                              {account.entityName || 'Unknown Entity'}
                            </span>
                            {account.lastSyncedAt && (
                              <span className="text-xs text-muted-foreground">
                                {format(account.lastSyncedAt, 'MMM d, h:mm a')}
                              </span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </div>
          )}

          {/* Table View */}
          {viewMode === "table" && (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account Name</TableHead>
                      <TableHead>Institution</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Currency</TableHead>
                      <TableHead className="text-right">Current Balance</TableHead>
                      <TableHead className="text-right">Available Balance</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                          <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                        </TableRow>
                      ))
                    ) : filteredAccounts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                          No accounts found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredAccounts.map((account) => {
                        const isNegative = account.balance < 0
                        return (
                          <TableRow key={account.id} className="cursor-pointer hover:bg-muted/50">
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="font-medium">{account.name}</div>
                                <span className="text-xs text-muted-foreground">{account.accountNumber}</span>
                              </div>
                            </TableCell>
                            <TableCell>{account.bankName}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {account.entityName || 'Unknown'}
                              </Badge>
                            </TableCell>
                            <TableCell className="capitalize">{account.type.replace('_', ' ')}</TableCell>
                            <TableCell>{account.currency}</TableCell>
                            <TableCell className={cn(
                              "text-right font-medium tabular-nums",
                              isNegative && "text-red-600"
                            )}>
                              {formatCurrency(account.balance, account.currency)}
                            </TableCell>
                            <TableCell className="text-right font-medium tabular-nums text-green-600">
                              {formatCurrency(account.availableBalance || account.balance, account.currency)}
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant="secondary"
                                className={cn(
                                  "text-xs",
                                  account.status === 'active' ? "bg-green-100 text-green-700" :
                                  account.status === 'frozen' ? "bg-red-100 text-red-700" :
                                  "bg-gray-100 text-gray-700"
                                )}
                              >
                                {account.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>View Transactions</DropdownMenuItem>
                                  <DropdownMenuItem>Reconcile</DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppShell>
  )
}
