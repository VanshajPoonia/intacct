"use client"

import { useState, useEffect } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { 
  Key, 
  Plus,
  Copy,
  Eye,
  EyeOff,
  Trash2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react"
import { getApiKeys, createApiKey, revokeApiKey } from "@/lib/services"
import type { ApiKey } from "@/lib/types"

const permissions = [
  { value: "read:all", label: "Read All", description: "Read access to all resources" },
  { value: "write:all", label: "Write All", description: "Write access to all resources" },
  { value: "read:transactions", label: "Read Transactions", description: "Read transaction data" },
  { value: "write:transactions", label: "Write Transactions", description: "Create/modify transactions" },
  { value: "read:bills", label: "Read Bills", description: "Read bill data" },
  { value: "write:bills", label: "Write Bills", description: "Create/modify bills" },
  { value: "read:invoices", label: "Read Invoices", description: "Read invoice data" },
  { value: "write:invoices", label: "Write Invoices", description: "Create/modify invoices" },
  { value: "read:reports", label: "Read Reports", description: "Access reports and analytics" },
]

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [newKeyVisible, setNewKeyVisible] = useState<string | null>(null)
  const [revokeConfirm, setRevokeConfirm] = useState<string | null>(null)
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set())

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    permissions: ["read:all"] as string[],
    expiresIn: "never" as string,
  })

  useEffect(() => {
    fetchApiKeys()
  }, [])

  const fetchApiKeys = async () => {
    setLoading(true)
    const data = await getApiKeys()
    setApiKeys(data)
    setLoading(false)
  }

  const handleCreate = async () => {
    const expiresAt = formData.expiresIn === "never" ? undefined :
      formData.expiresIn === "30days" ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) :
      formData.expiresIn === "90days" ? new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) :
      formData.expiresIn === "1year" ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) : undefined

    const result = await createApiKey({
      name: formData.name,
      permissions: formData.permissions,
      expiresAt,
    })
    
    if (result.success && result.apiKey) {
      setNewKeyVisible(result.apiKey.key)
    }
    
    setFormData({ name: "", permissions: ["read:all"], expiresIn: "never" })
    fetchApiKeys()
  }

  const handleRevoke = async (id: string) => {
    await revokeApiKey(id)
    setRevokeConfirm(null)
    fetchApiKeys()
  }

  const toggleKeyVisibility = (id: string) => {
    setVisibleKeys(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const togglePermission = (permission: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }))
  }

  const maskKey = (key: string) => {
    return key.substring(0, 12) + "..." + key.substring(key.length - 4)
  }

  const activeKeys = apiKeys.filter(k => k.status === "active").length

  return (
    <AppShell>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">API Keys</h1>
            <p className="text-sm text-muted-foreground">
              Manage API keys for programmatic access
            </p>
          </div>
          <Button onClick={() => setCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create API Key
          </Button>
        </div>

        {/* Warning Banner */}
        <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-800 dark:text-yellow-200">Keep your API keys secure</p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Never share your API keys in public repositories or client-side code. 
                  Treat them like passwords.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Key className="h-4 w-4" />
                Total Keys
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? <Skeleton className="h-8 w-16" /> : apiKeys.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Active
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{loading ? <Skeleton className="h-8 w-16" /> : activeKeys}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                Revoked
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-muted-foreground">{loading ? <Skeleton className="h-8 w-16" /> : apiKeys.length - activeKeys}</div>
            </CardContent>
          </Card>
        </div>

        {/* API Keys Table */}
        <Card>
          <CardHeader>
            <CardTitle>API Keys</CardTitle>
            <CardDescription>
              Manage your API keys for integrations and automation
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : apiKeys.length === 0 ? (
              <div className="text-center py-8">
                <Key className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground mb-4">No API keys created yet</p>
                <Button onClick={() => setCreateModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create API Key
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Key</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Last Used</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apiKeys.map((apiKey) => (
                    <TableRow key={apiKey.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{apiKey.name}</div>
                          <div className="text-xs text-muted-foreground">
                            Created by {apiKey.createdBy}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 font-mono text-sm">
                          <span>
                            {visibleKeys.has(apiKey.id) ? apiKey.key : maskKey(apiKey.key)}
                          </span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={() => toggleKeyVisibility(apiKey.id)}
                          >
                            {visibleKeys.has(apiKey.id) ? (
                              <EyeOff className="h-3 w-3" />
                            ) : (
                              <Eye className="h-3 w-3" />
                            )}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6"
                            onClick={() => copyToClipboard(apiKey.key)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={apiKey.status === "active" ? "default" : "secondary"}>
                          {apiKey.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {apiKey.permissions.slice(0, 2).map((perm) => (
                            <Badge key={perm} variant="outline" className="text-xs">
                              {perm}
                            </Badge>
                          ))}
                          {apiKey.permissions.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{apiKey.permissions.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {apiKey.lastUsedAt 
                          ? new Date(apiKey.lastUsedAt).toLocaleDateString()
                          : "Never"
                        }
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {apiKey.expiresAt 
                          ? new Date(apiKey.expiresAt).toLocaleDateString()
                          : "Never"
                        }
                      </TableCell>
                      <TableCell>
                        {apiKey.status === "active" && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setRevokeConfirm(apiKey.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Revoke
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Create Modal */}
        <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create API Key</DialogTitle>
              <DialogDescription>
                Generate a new API key for programmatic access
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Key Name</Label>
                <Input 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Production API"
                />
              </div>
              <div className="space-y-2">
                <Label>Permissions</Label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                  {permissions.map((perm) => (
                    <div key={perm.value} className="flex items-start space-x-2">
                      <Checkbox
                        id={perm.value}
                        checked={formData.permissions.includes(perm.value)}
                        onCheckedChange={() => togglePermission(perm.value)}
                      />
                      <label 
                        htmlFor={perm.value}
                        className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {perm.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Expiration</Label>
                <div className="flex gap-2">
                  {[
                    { value: "never", label: "Never" },
                    { value: "30days", label: "30 Days" },
                    { value: "90days", label: "90 Days" },
                    { value: "1year", label: "1 Year" },
                  ].map((opt) => (
                    <Button
                      key={opt.value}
                      variant={formData.expiresIn === opt.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFormData({ ...formData, expiresIn: opt.value })}
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateModalOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate}>Create Key</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* New Key Display Modal */}
        <Dialog open={!!newKeyVisible} onOpenChange={() => setNewKeyVisible(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                API Key Created
              </DialogTitle>
              <DialogDescription>
                Make sure to copy your API key now. You {"won't"} be able to see it again!
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="bg-muted p-4 rounded-lg">
                <code className="text-sm break-all">{newKeyVisible}</code>
              </div>
              <Button 
                variant="outline" 
                className="w-full mt-3"
                onClick={() => newKeyVisible && copyToClipboard(newKeyVisible)}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy to Clipboard
              </Button>
            </div>
            <DialogFooter>
              <Button onClick={() => setNewKeyVisible(null)}>Done</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Revoke Confirmation */}
        <AlertDialog open={!!revokeConfirm} onOpenChange={() => setRevokeConfirm(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Revoke API Key?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. Any applications using this key will stop working immediately.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => revokeConfirm && handleRevoke(revokeConfirm)}
              >
                Revoke Key
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppShell>
  )
}
