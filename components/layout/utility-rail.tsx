"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { 
  Bell, 
  MessageSquare, 
  HelpCircle,
  Sparkles,
  X
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useWorkspaceShellOptional } from "@/components/layout/workspace-shell-provider"
import { getNotifications, getUnreadCount } from "@/lib/services"
import type { Notification } from "@/lib/types"

interface UtilityRailProps {
  className?: string
}

export function UtilityRail({ className }: UtilityRailProps) {
  const shell = useWorkspaceShellOptional()
  const [activePanel, setActivePanel] = useState<string | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [notificationsLoading, setNotificationsLoading] = useState(false)
  const [notificationsError, setNotificationsError] = useState<string | null>(null)
  const [unreadNotifications, setUnreadNotifications] = useState(shell?.counts.notifications ?? 0)

  const togglePanel = (panelId: string) => {
    setActivePanel(activePanel === panelId ? null : panelId)
  }

  useEffect(() => {
    if (typeof shell?.counts.notifications === "number") {
      setUnreadNotifications(shell.counts.notifications)
      return
    }

    let cancelled = false

    async function loadUnreadCount() {
      try {
        const count = await getUnreadCount()
        if (!cancelled) {
          setUnreadNotifications(count)
        }
      } catch {
        if (!cancelled) {
          setUnreadNotifications(0)
        }
      }
    }

    void loadUnreadCount()

    return () => {
      cancelled = true
    }
  }, [shell?.counts.notifications])

  useEffect(() => {
    if (activePanel !== "notifications") {
      return
    }

    let cancelled = false

    async function loadNotifications() {
      setNotificationsLoading(true)
      setNotificationsError(null)

      try {
        const response = await getNotifications(false, undefined, 1, 12)
        if (!cancelled) {
          setNotifications(response.data)
        }
      } catch {
        if (!cancelled) {
          setNotifications([])
          setNotificationsError("Unable to load notifications.")
        }
      } finally {
        if (!cancelled) {
          setNotificationsLoading(false)
        }
      }
    }

    void loadNotifications()

    return () => {
      cancelled = true
    }
  }, [activePanel])

  return (
    <TooltipProvider delayDuration={0}>
      <div className={cn("flex", className)}>
        {/* Rail Buttons */}
        <div className="flex flex-col items-center gap-1 border-l border-border bg-sidebar p-2 w-12">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={activePanel === 'notifications' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => togglePanel('notifications')}
                className="relative h-9 w-9"
              >
                <Bell className="h-4 w-4" />
                {unreadNotifications > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]"
                  >
                    {unreadNotifications}
                  </Badge>
                )}
                <span className="sr-only">Notifications</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Notifications</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={activePanel === 'messages' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => togglePanel('messages')}
                className="h-9 w-9"
              >
                <MessageSquare className="h-4 w-4" />
                <span className="sr-only">Messages</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Messages</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={activePanel === 'ai' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => togglePanel('ai')}
                className="h-9 w-9"
              >
                <Sparkles className="h-4 w-4" />
                <span className="sr-only">AI Assistant</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">AI Assistant</TooltipContent>
          </Tooltip>

          <div className="flex-1" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={activePanel === 'help' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => togglePanel('help')}
                className="h-9 w-9"
              >
                <HelpCircle className="h-4 w-4" />
                <span className="sr-only">Help</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Help</TooltipContent>
          </Tooltip>
        </div>

        {/* Panel Content */}
        {activePanel && (
          <div className="w-80 border-l border-border bg-card flex flex-col">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h3 className="text-sm font-semibold capitalize">{activePanel}</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setActivePanel(null)}
                className="h-7 w-7"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close panel</span>
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {activePanel === 'notifications' && (
                <div className="space-y-3">
                  {notificationsLoading ? (
                    <div className="space-y-3">
                      {[0, 1, 2].map(index => (
                        <div key={index} className="rounded-lg border border-border p-3">
                          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                          <div className="mt-2 h-3 w-full animate-pulse rounded bg-muted" />
                          <div className="mt-1 h-3 w-4/5 animate-pulse rounded bg-muted" />
                        </div>
                      ))}
                    </div>
                  ) : notificationsError ? (
                    <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                      {notificationsError}
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                      No notifications in this view.
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div 
                        key={notification.id}
                        className={cn(
                          "rounded-lg border border-border p-3",
                          !notification.read && "bg-accent/50"
                        )}
                      >
                        <p className="text-sm font-medium">{notification.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{notification.message}</p>
                      </div>
                    ))
                  )}
                </div>
              )}
              {activePanel === 'messages' && (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  No messages yet
                </div>
              )}
              {activePanel === 'ai' && (
                <div className="text-center py-8">
                  <Sparkles className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm font-medium">AI Assistant</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Ask questions about your financial data
                  </p>
                </div>
              )}
              {activePanel === 'help' && (
                <div className="space-y-3">
                  <div className="rounded-lg border border-border p-3 hover:bg-muted cursor-pointer transition-colors">
                    <p className="text-sm font-medium">Getting Started</p>
                    <p className="text-xs text-muted-foreground mt-1">Learn the basics of FinanceOS</p>
                  </div>
                  <div className="rounded-lg border border-border p-3 hover:bg-muted cursor-pointer transition-colors">
                    <p className="text-sm font-medium">Documentation</p>
                    <p className="text-xs text-muted-foreground mt-1">Browse detailed guides</p>
                  </div>
                  <div className="rounded-lg border border-border p-3 hover:bg-muted cursor-pointer transition-colors">
                    <p className="text-sm font-medium">Contact Support</p>
                    <p className="text-xs text-muted-foreground mt-1">Get help from our team</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}
