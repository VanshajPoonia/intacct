"use client"

import { useState } from "react"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Bell, 
  Mail,
  Smartphone,
  Clock,
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  FileText,
  UserCheck,
  Calendar,
  DollarSign,
  Settings2,
  Save,
  RotateCcw,
} from "lucide-react"

interface NotificationSetting {
  id: string
  category: string
  name: string
  description: string
  email: boolean
  push: boolean
  frequency: 'instant' | 'hourly' | 'daily' | 'weekly'
}

const defaultSettings: NotificationSetting[] = [
  // Approvals
  { id: 'n1', category: 'approvals', name: 'Approval Required', description: 'When a document requires your approval', email: true, push: true, frequency: 'instant' },
  { id: 'n2', category: 'approvals', name: 'Approval Completed', description: 'When your submitted document is approved', email: true, push: true, frequency: 'instant' },
  { id: 'n3', category: 'approvals', name: 'Approval Rejected', description: 'When your submitted document is rejected', email: true, push: true, frequency: 'instant' },
  // Tasks
  { id: 'n4', category: 'tasks', name: 'Task Assigned', description: 'When a task is assigned to you', email: true, push: true, frequency: 'instant' },
  { id: 'n5', category: 'tasks', name: 'Task Due Soon', description: 'Reminder before task is due', email: true, push: false, frequency: 'daily' },
  { id: 'n6', category: 'tasks', name: 'Task Overdue', description: 'When a task becomes overdue', email: true, push: true, frequency: 'instant' },
  // Payments
  { id: 'n7', category: 'payments', name: 'Payment Received', description: 'When a customer payment is received', email: true, push: false, frequency: 'instant' },
  { id: 'n8', category: 'payments', name: 'Payment Failed', description: 'When a payment fails to process', email: true, push: true, frequency: 'instant' },
  { id: 'n9', category: 'payments', name: 'Payment Scheduled', description: 'Reminder for scheduled payments', email: true, push: false, frequency: 'daily' },
  // Invoices
  { id: 'n10', category: 'invoices', name: 'Invoice Overdue', description: 'When a customer invoice becomes overdue', email: true, push: false, frequency: 'daily' },
  { id: 'n11', category: 'invoices', name: 'Invoice Paid', description: 'When an invoice is marked as paid', email: false, push: false, frequency: 'daily' },
  // System
  { id: 'n12', category: 'system', name: 'Period Close Reminder', description: 'Reminder before accounting period closes', email: true, push: false, frequency: 'daily' },
  { id: 'n13', category: 'system', name: 'Sync Errors', description: 'When integration sync fails', email: true, push: true, frequency: 'instant' },
  { id: 'n14', category: 'system', name: 'Security Alerts', description: 'Important security notifications', email: true, push: true, frequency: 'instant' },
]

const categories = [
  { id: 'approvals', label: 'Approvals', icon: UserCheck },
  { id: 'tasks', label: 'Tasks', icon: CheckCircle2 },
  { id: 'payments', label: 'Payments', icon: DollarSign },
  { id: 'invoices', label: 'Invoices', icon: FileText },
  { id: 'system', label: 'System', icon: Settings2 },
]

export default function NotificationsSettingsPage() {
  const [settings, setSettings] = useState<NotificationSetting[]>(defaultSettings)
  const [activeCategory, setActiveCategory] = useState("approvals")
  const [hasChanges, setHasChanges] = useState(false)
  
  // Global settings
  const [globalSettings, setGlobalSettings] = useState({
    digestEmail: true,
    digestTime: '09:00',
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
    emailUnsubscribeAll: false,
  })

  const updateSetting = (id: string, field: 'email' | 'push' | 'frequency', value: boolean | string) => {
    setSettings(settings.map(s => 
      s.id === id ? { ...s, [field]: value } : s
    ))
    setHasChanges(true)
  }

  const handleSave = () => {
    console.log("Saving notification settings:", { settings, globalSettings })
    setHasChanges(false)
  }

  const handleReset = () => {
    setSettings(defaultSettings)
    setHasChanges(false)
  }

  const filteredSettings = settings.filter(s => s.category === activeCategory)
  const enabledCount = settings.filter(s => s.email || s.push).length

  return (
    <AppShell>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Notification Settings</h1>
            <p className="text-sm text-muted-foreground">
              Configure how and when you receive notifications
            </p>
          </div>
          <div className="flex items-center gap-2">
            {hasChanges && (
              <>
                <Button variant="outline" onClick={handleReset}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
                <Button onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Total Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{settings.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Enabled
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{enabledCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{settings.filter(s => s.email).length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                Push Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{settings.filter(s => s.push).length}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Notification Settings by Category */}
          <div className="col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <Tabs value={activeCategory} onValueChange={setActiveCategory}>
                  <TabsList>
                    {categories.map((cat) => {
                      const Icon = cat.icon
                      const count = settings.filter(s => s.category === cat.id && (s.email || s.push)).length
                      const total = settings.filter(s => s.category === cat.id).length
                      return (
                        <TabsTrigger key={cat.id} value={cat.id} className="flex items-center gap-1.5">
                          <Icon className="h-4 w-4" />
                          {cat.label}
                          <span className="text-xs text-muted-foreground">({count}/{total})</span>
                        </TabsTrigger>
                      )
                    })}
                  </TabsList>
                </Tabs>
              </CardHeader>
              <CardContent className="space-y-4">
                {filteredSettings.map((setting) => (
                  <div key={setting.id} className="flex items-start justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{setting.name}</p>
                      <p className="text-sm text-muted-foreground">{setting.description}</p>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <Switch 
                          checked={setting.email}
                          onCheckedChange={(v) => updateSetting(setting.id, 'email', v)}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4 text-muted-foreground" />
                        <Switch 
                          checked={setting.push}
                          onCheckedChange={(v) => updateSetting(setting.id, 'push', v)}
                        />
                      </div>
                      <Select 
                        value={setting.frequency}
                        onValueChange={(v) => updateSetting(setting.id, 'frequency', v)}
                      >
                        <SelectTrigger className="w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="instant">Instant</SelectItem>
                          <SelectItem value="hourly">Hourly</SelectItem>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Global Settings */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Email Digest</CardTitle>
                <CardDescription>Receive a summary of notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Daily Digest</Label>
                    <p className="text-xs text-muted-foreground">Receive a daily summary email</p>
                  </div>
                  <Switch 
                    checked={globalSettings.digestEmail}
                    onCheckedChange={(v) => {
                      setGlobalSettings({ ...globalSettings, digestEmail: v })
                      setHasChanges(true)
                    }}
                  />
                </div>
                {globalSettings.digestEmail && (
                  <div className="space-y-2">
                    <Label>Delivery Time</Label>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <Input 
                        type="time"
                        value={globalSettings.digestTime}
                        onChange={(e) => {
                          setGlobalSettings({ ...globalSettings, digestTime: e.target.value })
                          setHasChanges(true)
                        }}
                        className="w-32"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quiet Hours</CardTitle>
                <CardDescription>Pause notifications during specific hours</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable Quiet Hours</Label>
                    <p className="text-xs text-muted-foreground">No push notifications during this time</p>
                  </div>
                  <Switch 
                    checked={globalSettings.quietHoursEnabled}
                    onCheckedChange={(v) => {
                      setGlobalSettings({ ...globalSettings, quietHoursEnabled: v })
                      setHasChanges(true)
                    }}
                  />
                </div>
                {globalSettings.quietHoursEnabled && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Start</Label>
                      <Input 
                        type="time"
                        value={globalSettings.quietHoursStart}
                        onChange={(e) => {
                          setGlobalSettings({ ...globalSettings, quietHoursStart: e.target.value })
                          setHasChanges(true)
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End</Label>
                      <Input 
                        type="time"
                        value={globalSettings.quietHoursEnd}
                        onChange={(e) => {
                          setGlobalSettings({ ...globalSettings, quietHoursEnd: e.target.value })
                          setHasChanges(true)
                        }}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  Unsubscribe
                </CardTitle>
                <CardDescription>Stop receiving all email notifications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Unsubscribe from all emails</Label>
                    <p className="text-xs text-muted-foreground">Critical alerts will still be sent</p>
                  </div>
                  <Switch 
                    checked={globalSettings.emailUnsubscribeAll}
                    onCheckedChange={(v) => {
                      setGlobalSettings({ ...globalSettings, emailUnsubscribeAll: v })
                      setHasChanges(true)
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
