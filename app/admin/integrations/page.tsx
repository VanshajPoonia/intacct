"use client"

import { useState, useEffect } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Plug, 
  RefreshCw,
  Link2,
  Link2Off,
  AlertCircle,
  Clock,
  CheckCircle2,
  Building,
  CreditCard,
  ShoppingCart,
  Receipt,
  Users2,
  Briefcase,
} from "lucide-react"
import { getIntegrations, syncIntegration, disconnectIntegration, reconnectIntegration } from "@/lib/services"
import type { Integration } from "@/lib/types"

const integrationIcons: Record<Integration["type"], typeof Building> = {
  bank: Building,
  payroll: Briefcase,
  crm: Users2,
  ecommerce: ShoppingCart,
  tax: Receipt,
  expense: CreditCard,
  hr: Users2,
}

const availableIntegrations = [
  { name: "Wells Fargo", type: "bank" as const, provider: "Plaid" },
  { name: "Gusto", type: "payroll" as const, provider: "Gusto" },
  { name: "HubSpot", type: "crm" as const, provider: "HubSpot" },
  { name: "Amazon", type: "ecommerce" as const, provider: "Amazon" },
  { name: "TaxJar", type: "tax" as const, provider: "TaxJar" },
  { name: "Concur", type: "expense" as const, provider: "Concur" },
]

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState<string | null>(null)

  useEffect(() => {
    fetchIntegrations()
  }, [])

  const fetchIntegrations = async () => {
    setLoading(true)
    const data = await getIntegrations()
    setIntegrations(data)
    setLoading(false)
  }

  const handleSync = async (id: string) => {
    setSyncing(id)
    await syncIntegration(id)
    setSyncing(null)
    fetchIntegrations()
  }

  const handleDisconnect = async (id: string) => {
    await disconnectIntegration(id)
    fetchIntegrations()
  }

  const handleReconnect = async (id: string) => {
    await reconnectIntegration(id)
    fetchIntegrations()
  }

  const handleConnect = (name: string, type: string, provider: string) => {
    // Simulate connecting a new integration
    console.log("Connecting:", name, type, provider)
    fetchIntegrations()
  }

  const getStatusBadge = (status: Integration["status"]) => {
    switch (status) {
      case "connected":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Connected
          </Badge>
        )
      case "error":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            <AlertCircle className="h-3 w-3 mr-1" />
            Error
          </Badge>
        )
      case "disconnected":
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
            <Link2Off className="h-3 w-3 mr-1" />
            Disconnected
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        )
      default:
        return null
    }
  }

  const connectedCount = integrations.filter(i => i.status === "connected").length
  const errorCount = integrations.filter(i => i.status === "error").length

  return (
    <AppShell>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Integrations</h1>
            <p className="text-sm text-muted-foreground">
              Connect third-party services to automate your workflows
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Plug className="h-4 w-4" />
                Total Integrations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-16" /> : integrations.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Connected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{loading ? <Skeleton className="h-8 w-16" /> : connectedCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Needs Attention
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{loading ? <Skeleton className="h-8 w-16" /> : errorCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Last Sync
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-16" /> : "Today"}</div>
            </CardContent>
          </Card>
        </div>

        {/* Connected Integrations */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Connected Integrations</h2>
          {loading ? (
            <div className="grid grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {integrations.map((integration) => {
                const Icon = integrationIcons[integration.type]
                return (
                  <Card key={integration.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-muted rounded-lg">
                            <Icon className="h-6 w-6" />
                          </div>
                          <div>
                            <CardTitle className="text-base">{integration.name}</CardTitle>
                            <CardDescription>{integration.provider}</CardDescription>
                          </div>
                        </div>
                        {getStatusBadge(integration.status)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                          {integration.lastSyncAt ? (
                            <span>Last synced: {new Date(integration.lastSyncAt).toLocaleString()}</span>
                          ) : (
                            <span>Never synced</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {integration.status === "connected" && (
                            <>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleSync(integration.id)}
                                disabled={syncing === integration.id}
                              >
                                <RefreshCw className={`h-4 w-4 mr-1 ${syncing === integration.id ? "animate-spin" : ""}`} />
                                Sync
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleDisconnect(integration.id)}
                              >
                                <Link2Off className="h-4 w-4 mr-1" />
                                Disconnect
                              </Button>
                            </>
                          )}
                          {(integration.status === "disconnected" || integration.status === "error") && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleReconnect(integration.id)}
                            >
                              <Link2 className="h-4 w-4 mr-1" />
                              Reconnect
                            </Button>
                          )}
                          {integration.status === "pending" && (
                            <Button variant="outline" size="sm" disabled>
                              <Clock className="h-4 w-4 mr-1" />
                              Pending
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>

        {/* Available Integrations */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Available Integrations</h2>
          <div className="grid grid-cols-3 gap-4">
            {availableIntegrations.map((integration) => {
              const Icon = integrationIcons[integration.type]
              return (
                <Card key={integration.name} className="hover:border-primary/50 transition-colors">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded-lg">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{integration.name}</CardTitle>
                        <CardDescription>{integration.provider}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => handleConnect(integration.name, integration.type, integration.provider)}
                    >
                      <Link2 className="h-4 w-4 mr-2" />
                      Connect
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
