"use client"

import { useState, useEffect } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { getBankAccounts } from "@/lib/services"
import type { BankAccount } from "@/lib/types"
import { Plus, RefreshCw, Building2, CreditCard, Wallet } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value)
}

const accountIcons = {
  checking: Building2,
  savings: Wallet,
  credit: CreditCard,
}

export default function BankAccountsPage() {
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadAccounts() {
      setLoading(true)
      try {
        const result = await getBankAccounts()
        setAccounts(result)
      } finally {
        setLoading(false)
      }
    }
    loadAccounts()
  }, [])

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0)

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
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Sync All
              </Button>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Account
              </Button>
            </div>
          </div>

          {/* Summary Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Cash Position</p>
                  {loading ? (
                    <Skeleton className="h-9 w-48 mt-1" />
                  ) : (
                    <p className="text-3xl font-semibold tabular-nums">{formatCurrency(totalBalance)}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">{accounts.length} accounts connected</p>
                  <p className="text-xs text-muted-foreground mt-1">Last synced: Today at 10:30 AM</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-12 w-full mb-3" />
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardContent>
                </Card>
              ))
            ) : (
              accounts.map((account) => {
                const Icon = accountIcons[account.type]
                const isNegative = account.balance < 0

                return (
                  <Card key={account.id} className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "p-2 rounded-lg",
                            account.type === 'credit' ? "bg-amber-100" : "bg-accent/50"
                          )}>
                            <Icon className={cn(
                              "h-5 w-5",
                              account.type === 'credit' ? "text-amber-700" : "text-accent-foreground"
                            )} />
                          </div>
                          <div>
                            <p className="font-medium">{account.name}</p>
                            <p className="text-xs text-muted-foreground">{account.bankName}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="capitalize text-xs">
                          {account.type}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-baseline justify-between">
                          <span className="text-xs text-muted-foreground">{account.accountNumber}</span>
                          <span className={cn(
                            "text-xl font-semibold tabular-nums",
                            isNegative && "text-red-600"
                          )}>
                            {formatCurrency(account.balance)}
                          </span>
                        </div>
                        {account.lastSyncedAt && (
                          <p className="text-xs text-muted-foreground">
                            Synced {format(account.lastSyncedAt, 'MMM d, h:mm a')}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
