"use client"

import { useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
import { 
  Building2, 
  Globe, 
  DollarSign, 
  Users, 
  Settings2,
  Link2,
  FileText,
  ChevronRight,
  Check,
  X,
  Plus,
  Landmark,
} from "lucide-react"
import type { Entity, BankAccount, User } from "@/lib/types"

interface EntityDetailDrawerProps {
  entity: Entity | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (entity: Entity) => void
  entities: Entity[]
}

// Mock data for demonstration
const mockBankAccounts: BankAccount[] = [
  { id: 'ba1', name: 'Operating Account', accountNumber: '****4567', bankName: 'Wells Fargo', type: 'checking', balance: 1250000, availableBalance: 1245000, currency: 'USD', status: 'active', entityId: 'e1' },
  { id: 'ba2', name: 'Payroll Account', accountNumber: '****8901', bankName: 'Wells Fargo', type: 'checking', balance: 450000, availableBalance: 450000, currency: 'USD', status: 'active', entityId: 'e1' },
]

const mockUsers: User[] = [
  { id: 'u1', email: 'sarah.chen@acme.com', firstName: 'Sarah', lastName: 'Chen', role: 'admin', status: 'active', entityIds: ['e1', 'e2', 'e3', 'e4'], createdAt: new Date() },
  { id: 'u2', email: 'john.smith@acme.com', firstName: 'John', lastName: 'Smith', role: 'controller', status: 'active', entityIds: ['e1', 'e2'], createdAt: new Date() },
  { id: 'u3', email: 'emily.davis@acme.com', firstName: 'Emily', lastName: 'Davis', role: 'accountant', status: 'active', entityIds: ['e1'], createdAt: new Date() },
]

const currencies = ['USD', 'EUR', 'GBP', 'CAD', 'JPY', 'AUD', 'CHF']
const countries = ['United States', 'United Kingdom', 'Germany', 'Canada', 'Japan', 'Australia', 'Switzerland', 'France', 'Netherlands']

export function EntityDetailDrawer({ 
  entity, 
  open, 
  onOpenChange, 
  onSave,
  entities 
}: EntityDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState("profile")
  const [editMode, setEditMode] = useState(false)
  const [formData, setFormData] = useState<Partial<Entity>>({})

  // Reset form when entity changes
  const handleOpen = (isOpen: boolean) => {
    if (isOpen && entity) {
      setFormData({
        name: entity.name,
        code: entity.code,
        type: entity.type,
        currency: entity.currency,
        status: entity.status,
        country: entity.country,
        parentId: entity.parentId,
      })
      setEditMode(false)
    }
    onOpenChange(isOpen)
  }

  const handleSave = () => {
    if (entity) {
      onSave({ ...entity, ...formData } as Entity)
      setEditMode(false)
    }
  }

  // Intercompany settings (mock)
  const [intercompanySettings, setIntercompanySettings] = useState({
    autoEliminate: true,
    defaultCurrency: 'USD',
    allowedPartners: ['e1', 'e2', 'e3'],
    requireApproval: true,
    approvalThreshold: 10000,
  })

  // Reporting settings (mock)
  const [reportingSettings, setReportingSettings] = useState({
    consolidationMethod: 'full',
    minorityInterest: false,
    functionalCurrency: 'USD',
    reportingCalendar: 'standard',
  })

  if (!entity) return null

  const linkedBankAccounts = mockBankAccounts.filter(ba => ba.entityId === entity.id)
  const entityUsers = mockUsers.filter(u => u.entityIds.includes(entity.id))
  const parentEntity = entities.find(e => e.id === entity.parentId)

  const getTypeColor = (type: Entity["type"]) => {
    switch (type) {
      case "parent": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "subsidiary": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "branch": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
      case "department": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
      default: return "bg-muted text-muted-foreground"
    }
  }

  const getRoleBadgeColor = (role: User["role"]) => {
    switch (role) {
      case "admin": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "controller": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "accountant": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      default: return "bg-muted text-muted-foreground"
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleOpen}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <SheetTitle className="text-xl">{entity.name}</SheetTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className={getTypeColor(entity.type)}>
                    {entity.type}
                  </Badge>
                  <span className="text-sm text-muted-foreground font-mono">{entity.code}</span>
                </div>
              </div>
            </div>
            {!editMode ? (
              <Button variant="outline" size="sm" onClick={() => setEditMode(true)}>
                Edit
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => setEditMode(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSave}>
                  Save
                </Button>
              </div>
            )}
          </div>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile" className="text-xs">Profile</TabsTrigger>
            <TabsTrigger value="intercompany" className="text-xs">Intercompany</TabsTrigger>
            <TabsTrigger value="bank" className="text-xs">Bank</TabsTrigger>
            <TabsTrigger value="users" className="text-xs">Users</TabsTrigger>
            <TabsTrigger value="reporting" className="text-xs">Reporting</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="mt-4 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Entity Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Entity Name</Label>
                    {editMode ? (
                      <Input 
                        value={formData.name || ''} 
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    ) : (
                      <p className="text-sm font-medium">{entity.name}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Code</Label>
                    {editMode ? (
                      <Input 
                        value={formData.code || ''} 
                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      />
                    ) : (
                      <p className="text-sm font-medium font-mono">{entity.code}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    {editMode ? (
                      <Select 
                        value={formData.type} 
                        onValueChange={(v) => setFormData({ ...formData, type: v as Entity["type"] })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="parent">Parent</SelectItem>
                          <SelectItem value="subsidiary">Subsidiary</SelectItem>
                          <SelectItem value="branch">Branch</SelectItem>
                          <SelectItem value="department">Department</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="outline" className={getTypeColor(entity.type)}>
                        {entity.type}
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Parent Entity</Label>
                    {editMode ? (
                      <Select 
                        value={formData.parentId || 'none'} 
                        onValueChange={(v) => setFormData({ ...formData, parentId: v === 'none' ? undefined : v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="No parent" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No parent</SelectItem>
                          {entities.filter(e => e.id !== entity.id && e.type !== 'consolidated').map(e => (
                            <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm font-medium">{parentEntity?.name || '—'}</p>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <DollarSign className="h-3 w-3" />
                      Base Currency
                    </Label>
                    {editMode ? (
                      <Select 
                        value={formData.currency} 
                        onValueChange={(v) => setFormData({ ...formData, currency: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {currencies.map(c => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm font-medium">{entity.currency}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Globe className="h-3 w-3" />
                      Country
                    </Label>
                    {editMode ? (
                      <Select 
                        value={formData.country || 'United States'} 
                        onValueChange={(v) => setFormData({ ...formData, country: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {countries.map(c => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm font-medium">{entity.country || 'United States'}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <div className="flex items-center gap-2">
                    <Badge variant={entity.status === 'active' ? 'default' : 'secondary'}>
                      {entity.status}
                    </Badge>
                    {editMode && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setFormData({ 
                          ...formData, 
                          status: formData.status === 'active' ? 'inactive' : 'active' 
                        })}
                      >
                        Toggle Status
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Intercompany Tab */}
          <TabsContent value="intercompany" className="mt-4 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Link2 className="h-4 w-4" />
                  Intercompany Settings
                </CardTitle>
                <CardDescription>Configure intercompany transaction rules</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Automatic Eliminations</Label>
                    <p className="text-xs text-muted-foreground">Auto-create elimination entries on consolidation</p>
                  </div>
                  <Switch 
                    checked={intercompanySettings.autoEliminate}
                    onCheckedChange={(v) => setIntercompanySettings({ ...intercompanySettings, autoEliminate: v })}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Require Approval</Label>
                    <p className="text-xs text-muted-foreground">Require approval for intercompany transactions</p>
                  </div>
                  <Switch 
                    checked={intercompanySettings.requireApproval}
                    onCheckedChange={(v) => setIntercompanySettings({ ...intercompanySettings, requireApproval: v })}
                  />
                </div>

                {intercompanySettings.requireApproval && (
                  <div className="space-y-2 ml-6">
                    <Label>Approval Threshold</Label>
                    <div className="flex items-center gap-2">
                      <Input 
                        type="number"
                        value={intercompanySettings.approvalThreshold}
                        onChange={(e) => setIntercompanySettings({ 
                          ...intercompanySettings, 
                          approvalThreshold: parseInt(e.target.value) || 0 
                        })}
                        className="w-32"
                      />
                      <span className="text-sm text-muted-foreground">and above</span>
                    </div>
                  </div>
                )}

                <Separator />

                <div className="space-y-2">
                  <Label>Allowed Intercompany Partners</Label>
                  <div className="flex flex-wrap gap-2">
                    {entities.filter(e => e.id !== entity.id && e.type !== 'consolidated').map(e => {
                      const isAllowed = intercompanySettings.allowedPartners.includes(e.id)
                      return (
                        <Badge 
                          key={e.id}
                          variant={isAllowed ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => {
                            if (isAllowed) {
                              setIntercompanySettings({
                                ...intercompanySettings,
                                allowedPartners: intercompanySettings.allowedPartners.filter(id => id !== e.id)
                              })
                            } else {
                              setIntercompanySettings({
                                ...intercompanySettings,
                                allowedPartners: [...intercompanySettings.allowedPartners, e.id]
                              })
                            }
                          }}
                        >
                          {isAllowed && <Check className="h-3 w-3 mr-1" />}
                          {e.name}
                        </Badge>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bank Accounts Tab */}
          <TabsContent value="bank" className="mt-4 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Landmark className="h-4 w-4" />
                    Linked Bank Accounts
                  </CardTitle>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Link Account
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {linkedBankAccounts.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No bank accounts linked to this entity
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Account</TableHead>
                        <TableHead>Bank</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {linkedBankAccounts.map(account => (
                        <TableRow key={account.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{account.name}</p>
                              <p className="text-xs text-muted-foreground">{account.accountNumber}</p>
                            </div>
                          </TableCell>
                          <TableCell>{account.bankName}</TableCell>
                          <TableCell className="text-right font-medium">
                            ${account.balance.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="mt-4 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Users with Access
                  </CardTitle>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Add User
                  </Button>
                </div>
                <CardDescription>{entityUsers.length} users have access to this entity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {entityUsers.map(user => (
                    <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>{user.firstName[0]}{user.lastName[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.firstName} {user.lastName}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={getRoleBadgeColor(user.role)}>
                          {user.role}
                        </Badge>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reporting Tab */}
          <TabsContent value="reporting" className="mt-4 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Reporting Settings
                </CardTitle>
                <CardDescription>Configure consolidation and reporting options</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Consolidation Method</Label>
                    <Select 
                      value={reportingSettings.consolidationMethod}
                      onValueChange={(v) => setReportingSettings({ ...reportingSettings, consolidationMethod: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full">Full Consolidation</SelectItem>
                        <SelectItem value="proportional">Proportional</SelectItem>
                        <SelectItem value="equity">Equity Method</SelectItem>
                        <SelectItem value="none">No Consolidation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Functional Currency</Label>
                    <Select 
                      value={reportingSettings.functionalCurrency}
                      onValueChange={(v) => setReportingSettings({ ...reportingSettings, functionalCurrency: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map(c => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Track Minority Interest</Label>
                    <p className="text-xs text-muted-foreground">Track non-controlling interest in subsidiaries</p>
                  </div>
                  <Switch 
                    checked={reportingSettings.minorityInterest}
                    onCheckedChange={(v) => setReportingSettings({ ...reportingSettings, minorityInterest: v })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Reporting Calendar</Label>
                  <Select 
                    value={reportingSettings.reportingCalendar}
                    onValueChange={(v) => setReportingSettings({ ...reportingSettings, reportingCalendar: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard (Jan-Dec)</SelectItem>
                      <SelectItem value="fiscal">Fiscal Year (Apr-Mar)</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}
