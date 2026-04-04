"use client"

import { useState, useEffect } from "react"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { getPreferences, updatePreferences, resetPreferences, getEntities } from "@/lib/services"
import type { UserPreferences, Entity } from "@/lib/types"
import { 
  User, 
  Bell, 
  Palette, 
  Shield, 
  Building2, 
  Calendar,
  Loader2,
  RotateCcw,
  Save,
} from "lucide-react"

export default function SettingsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [preferences, setPreferences] = useState<UserPreferences | null>(null)
  const [entities, setEntities] = useState<Entity[]>([])
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      const [prefsData, entitiesData] = await Promise.all([
        getPreferences(),
        getEntities(),
      ])
      setPreferences(prefsData)
      setEntities(entitiesData)
      setLoading(false)
    }
    loadData()
  }, [])

  const handleUpdatePreference = <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    if (!preferences) return
    setPreferences({ ...preferences, [key]: value })
    setHasChanges(true)
  }

  const handleUpdateNotification = (key: keyof UserPreferences['notifications'], value: boolean) => {
    if (!preferences) return
    setPreferences({
      ...preferences,
      notifications: { ...preferences.notifications, [key]: value },
    })
    setHasChanges(true)
  }

  const handleSave = async () => {
    if (!preferences) return
    setSaving(true)
    const result = await updatePreferences(preferences)
    if (result.success) {
      toast({ title: "Preferences saved", description: "Your settings have been updated." })
      setHasChanges(false)
    } else {
      toast({ title: "Error", description: "Failed to save preferences.", variant: "destructive" })
    }
    setSaving(false)
  }

  const handleReset = async () => {
    setSaving(true)
    const result = await resetPreferences()
    if (result.success) {
      setPreferences(result.preferences)
      toast({ title: "Preferences reset", description: "Settings have been restored to defaults." })
      setHasChanges(false)
    }
    setSaving(false)
  }

  return (
    <AppShell>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
            <p className="text-muted-foreground">Manage your account preferences</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleReset} disabled={saving}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset to Defaults
            </Button>
            <Button onClick={handleSave} disabled={saving || !hasChanges}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save Changes
            </Button>
          </div>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList>
            <TabsTrigger value="general">
              <User className="h-4 w-4 mr-2" />
              General
            </TabsTrigger>
            <TabsTrigger value="appearance">
              <Palette className="h-4 w-4 mr-2" />
              Appearance
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="security">
              <Shield className="h-4 w-4 mr-2" />
              Security
            </TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Default Settings</CardTitle>
                <CardDescription>Configure your default entity and date range</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {loading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : (
                  <>
                    <div className="grid gap-2">
                      <Label htmlFor="defaultEntity">
                        <Building2 className="h-4 w-4 inline mr-2" />
                        Default Entity
                      </Label>
                      <Select
                        value={preferences?.defaultEntity || 'e4'}
                        onValueChange={(value) => handleUpdatePreference('defaultEntity', value)}
                      >
                        <SelectTrigger id="defaultEntity">
                          <SelectValue placeholder="Select default entity" />
                        </SelectTrigger>
                        <SelectContent>
                          {entities.map((entity) => (
                            <SelectItem key={entity.id} value={entity.id}>
                              {entity.name} ({entity.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-muted-foreground">
                        This entity will be selected by default when you open the app
                      </p>
                    </div>

                    <Separator />

                    <div className="grid gap-2">
                      <Label htmlFor="defaultDateRange">
                        <Calendar className="h-4 w-4 inline mr-2" />
                        Default Date Range
                      </Label>
                      <Select
                        value={preferences?.defaultDateRange || 'this_month'}
                        onValueChange={(value) => handleUpdatePreference('defaultDateRange', value as UserPreferences['defaultDateRange'])}
                      >
                        <SelectTrigger id="defaultDateRange">
                          <SelectValue placeholder="Select default date range" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="today">Today</SelectItem>
                          <SelectItem value="this_week">This Week</SelectItem>
                          <SelectItem value="this_month">This Month</SelectItem>
                          <SelectItem value="this_quarter">This Quarter</SelectItem>
                          <SelectItem value="this_year">This Year</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-muted-foreground">
                        Dashboard and reports will default to this date range
                      </p>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Collapsed Sidebar</Label>
                        <p className="text-sm text-muted-foreground">
                          Start with sidebar collapsed by default
                        </p>
                      </div>
                      <Switch
                        checked={preferences?.sidebarCollapsed || false}
                        onCheckedChange={(checked) => handleUpdatePreference('sidebarCollapsed', checked)}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Settings */}
          <TabsContent value="appearance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Theme</CardTitle>
                <CardDescription>Customize the appearance of the application</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <div className="grid gap-2">
                    <Label htmlFor="theme">Color Theme</Label>
                    <Select
                      value={preferences?.theme || 'system'}
                      onValueChange={(value) => handleUpdatePreference('theme', value as UserPreferences['theme'])}
                    >
                      <SelectTrigger id="theme">
                        <SelectValue placeholder="Select theme" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      Choose between light, dark, or system preference
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Configure how you receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {loading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive notifications via email
                        </p>
                      </div>
                      <Switch
                        checked={preferences?.notifications.email || false}
                        onCheckedChange={(checked) => handleUpdateNotification('email', checked)}
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Push Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Receive push notifications in your browser
                        </p>
                      </div>
                      <Switch
                        checked={preferences?.notifications.push || false}
                        onCheckedChange={(checked) => handleUpdateNotification('push', checked)}
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Approval Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Get notified when items need your approval
                        </p>
                      </div>
                      <Switch
                        checked={preferences?.notifications.approvals || false}
                        onCheckedChange={(checked) => handleUpdateNotification('approvals', checked)}
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Task Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Get notified about assigned tasks and due dates
                        </p>
                      </div>
                      <Switch
                        checked={preferences?.notifications.tasks || false}
                        onCheckedChange={(checked) => handleUpdateNotification('tasks', checked)}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Manage your account security</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <Button variant="outline" size="sm">Enable 2FA</Button>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Change Password</Label>
                    <p className="text-sm text-muted-foreground">
                      Update your account password
                    </p>
                  </div>
                  <Button variant="outline" size="sm">Change Password</Button>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Active Sessions</Label>
                    <p className="text-sm text-muted-foreground">
                      Manage devices where you&apos;re logged in
                    </p>
                  </div>
                  <Button variant="outline" size="sm">View Sessions</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  )
}
