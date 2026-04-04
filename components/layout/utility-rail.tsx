"use client"

import { useState } from "react"
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
import { notifications } from "@/lib/mock-data"

interface UtilityRailProps {
  className?: string
}

export function UtilityRail({ className }: UtilityRailProps) {
  const [activePanel, setActivePanel] = useState<string | null>(null)
  const unreadNotifications = notifications.filter(n => !n.read).length

  const togglePanel = (panelId: string) => {
    setActivePanel(activePanel === panelId ? null : panelId)
  }

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
                  {notifications.map((notification) => (
                    <div 
                      key={notification.id}
                      className={cn(
                        "rounded-lg border border-border p-3",
                        !notification.read && "bg-accent/50"
                      )}
                    >
                      <p className="text-sm font-medium">{notification.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{notification.message}</p>
                    </div>
                  ))}
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
