"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { 
  Search, 
  Bell, 
  CheckSquare, 
  HelpCircle, 
  ChevronDown,
  Building2,
  CalendarDays,
  LogOut,
  Settings,
  User
} from "lucide-react"
import { cn } from "@/lib/utils"
import { entities, currentUser, notifications, tasks } from "@/lib/mock-data"
import type { DateRange } from "react-day-picker"
import { format } from "date-fns"

interface AppHeaderProps {
  onSearchClick: () => void
  className?: string
}

export function AppHeader({ onSearchClick, className }: AppHeaderProps) {
  const [selectedEntity, setSelectedEntity] = useState(entities[0])
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(2024, 2, 1),
    to: new Date(2024, 2, 31),
  })
  const [showNotifications, setShowNotifications] = useState(false)
  const [showTasks, setShowTasks] = useState(false)

  const unreadNotifications = notifications.filter(n => !n.read).length
  const pendingTasks = tasks.filter(t => t.status !== 'completed').length

  return (
    <header className={cn(
      "sticky top-0 z-50 flex h-14 items-center justify-between gap-4 border-b border-border bg-card px-4",
      className
    )}>
      {/* Left: Logo and Product Name */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <span className="text-sm font-bold text-primary-foreground">F</span>
          </div>
          <span className="text-lg font-semibold text-foreground hidden sm:block">FinanceOS</span>
        </div>
      </div>

      {/* Center: Search, Entity Switcher, Date Range */}
      <div className="flex flex-1 items-center justify-center gap-2 max-w-2xl">
        {/* Global Search */}
        <Button 
          variant="outline" 
          size="sm"
          onClick={onSearchClick}
          className="h-9 w-64 justify-start text-muted-foreground bg-muted/50 border-border hover:bg-muted"
        >
          <Search className="mr-2 h-4 w-4" />
          <span className="text-sm">Search...</span>
          <kbd className="pointer-events-none ml-auto inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>

        {/* Entity Switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 gap-1.5 border-border bg-background">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium hidden md:block">{selectedEntity.code}</span>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Select Entity</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {entities.map((entity) => (
              <DropdownMenuItem
                key={entity.id}
                onClick={() => setSelectedEntity(entity)}
                className={cn(
                  "cursor-pointer",
                  selectedEntity.id === entity.id && "bg-accent"
                )}
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{entity.name}</span>
                  <span className="text-xs text-muted-foreground">{entity.code} • {entity.currency}</span>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Date Range Selector */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 gap-1.5 border-border bg-background hidden lg:flex">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "MMM d")} - {format(dateRange.to, "MMM d, yyyy")}
                    </>
                  ) : (
                    format(dateRange.from, "MMM d, yyyy")
                  )
                ) : (
                  "Select dates"
                )}
              </span>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="center">
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={setDateRange}
              numberOfMonths={2}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Right: Notifications, Tasks, Help, Profile */}
      <div className="flex items-center gap-1">
        {/* Notifications */}
        <Popover open={showNotifications} onOpenChange={setShowNotifications}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 relative">
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
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0">
            <div className="border-b border-border px-4 py-3">
              <h3 className="text-sm font-semibold">Notifications</h3>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.slice(0, 5).map((notification) => (
                <div 
                  key={notification.id}
                  className={cn(
                    "flex flex-col gap-1 border-b border-border px-4 py-3 last:border-0",
                    !notification.read && "bg-accent/50"
                  )}
                >
                  <span className="text-sm font-medium">{notification.title}</span>
                  <span className="text-xs text-muted-foreground">{notification.message}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-border px-4 py-2">
              <Button variant="ghost" size="sm" className="w-full text-xs">
                View all notifications
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Tasks */}
        <Popover open={showTasks} onOpenChange={setShowTasks}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 relative">
              <CheckSquare className="h-4 w-4" />
              {pendingTasks > 0 && (
                <Badge 
                  className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-amber-500 hover:bg-amber-500"
                >
                  {pendingTasks}
                </Badge>
              )}
              <span className="sr-only">Tasks</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0">
            <div className="border-b border-border px-4 py-3">
              <h3 className="text-sm font-semibold">My Tasks</h3>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {tasks.slice(0, 4).map((task) => (
                <div 
                  key={task.id}
                  className="flex items-start gap-3 border-b border-border px-4 py-3 last:border-0"
                >
                  <div className={cn(
                    "mt-0.5 h-2 w-2 rounded-full",
                    task.priority === 'urgent' && "bg-red-500",
                    task.priority === 'high' && "bg-amber-500",
                    task.priority === 'medium' && "bg-blue-500",
                    task.priority === 'low' && "bg-gray-400"
                  )} />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium block truncate">{task.title}</span>
                    {task.dueDate && (
                      <span className="text-xs text-muted-foreground">
                        Due {format(task.dueDate, "MMM d")}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-border px-4 py-2">
              <Button variant="ghost" size="sm" className="w-full text-xs">
                View all tasks
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Help */}
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <HelpCircle className="h-4 w-4" />
          <span className="sr-only">Help</span>
        </Button>

        {/* User Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-9 gap-2 pl-2 pr-1">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {currentUser.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="font-medium">{currentUser.name}</span>
                <span className="text-xs text-muted-foreground font-normal">{currentUser.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
