"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import {
  Bell,
  CalendarDays,
  CheckSquare,
  ChevronDown,
  HelpCircle,
  LogOut,
  Search,
  Settings,
  ShieldCheck,
  User,
  Users,
} from "lucide-react"
import { useWorkspaceShell } from "@/components/layout/workspace-shell-provider"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/lib/auth/context"
import { cn } from "@/lib/utils"

interface AppHeaderProps {
  onSearchClick?: () => void
  className?: string
}

function formatDateWindow(startDate: Date, endDate: Date) {
  return `${format(startDate, "MMM d")} - ${format(endDate, "MMM d, yyyy")}`
}

export function AppHeader({ onSearchClick, className }: AppHeaderProps) {
  const router = useRouter()
  const { logout } = useAuth()
  const {
    activeEntity,
    activeRole,
    availableRoles,
    currentUser,
    counts,
    datePresets,
    dateRange,
    entities,
    openCommandPalette,
    setActiveEntity,
    setActiveRole,
    setDatePreset,
  } = useWorkspaceShell()

  const userName =
    currentUser?.displayName ?? [currentUser?.firstName, currentUser?.lastName].filter(Boolean).join(" ") || "Finance User"
  const userInitials = [currentUser?.firstName?.[0], currentUser?.lastName?.[0]].filter(Boolean).join("") || "FU"

  const handleLogout = async () => {
    await logout()
    router.push("/login")
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-border/80 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/88",
        className
      )}
    >
      <div className="mx-auto flex h-[60px] max-w-[1680px] items-center gap-3 px-3 py-2 sm:px-4 lg:px-6">
        <div className="flex min-w-0 items-center gap-3 border-r border-border/70 pr-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-sm bg-primary text-sm font-semibold text-primary-foreground">
            F
          </div>
          <div className="hidden min-w-0 sm:block">
            <div className="text-sm font-semibold tracking-tight text-foreground">FinanceOS</div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Enterprise Finance</div>
          </div>
        </div>

        <div className="hidden min-w-0 items-center gap-2 lg:flex">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-2 rounded-sm border-border bg-background">
                <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-semibold uppercase tracking-[0.12em]">{activeRole?.name ?? "Role"}</span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-72 rounded-sm">
              <DropdownMenuLabel className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Demo Role
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {availableRoles.map(role => (
                <DropdownMenuItem
                  key={role.id}
                  onClick={() => setActiveRole(role.id)}
                  className={cn("cursor-pointer gap-3 rounded-sm py-2.5", role.id === activeRole?.id && "bg-muted")}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-muted">
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">{role.name}</div>
                    <div className="text-xs text-muted-foreground">{role.description}</div>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-2 rounded-sm border-border bg-background">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Entity</span>
                <span className="max-w-[140px] truncate text-sm font-medium">{activeEntity?.code ?? "Select"}</span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-72 rounded-sm">
              <DropdownMenuLabel className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Reporting Entity
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {entities.map(entity => (
                <DropdownMenuItem
                  key={entity.id}
                  onClick={() => setActiveEntity(entity.id)}
                  className={cn("cursor-pointer gap-3 rounded-sm py-2.5", entity.id === activeEntity?.id && "bg-muted")}
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">{entity.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {entity.code} · {entity.currency}
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 gap-2 rounded-sm border-border bg-background">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                <span className="hidden text-sm font-medium xl:block">
                  {dateRange ? formatDateWindow(dateRange.startDate, dateRange.endDate) : "Date Range"}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 rounded-sm">
              <DropdownMenuLabel className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Reporting Window
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {datePresets.map(option => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => setDatePreset(option.value)}
                  className={cn(
                    "cursor-pointer rounded-sm py-2",
                    dateRange?.preset === option.value && "bg-muted"
                  )}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={onSearchClick ?? openCommandPalette}
            className="hidden h-9 w-[280px] justify-start gap-2 rounded-sm border-border bg-background text-muted-foreground md:flex"
          >
            <Search className="h-4 w-4" />
            <span className="text-sm">Search navigation, actions, or records</span>
            <kbd className="ml-auto rounded-sm border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
              ⌘K
            </kbd>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onSearchClick ?? openCommandPalette}
            className="h-9 w-9 rounded-sm md:hidden"
          >
            <Search className="h-4 w-4" />
          </Button>

          <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-sm" asChild>
            <Link href="/notifications">
              <Bell className="h-4 w-4" />
              {counts.notifications > 0 ? (
                <Badge className="absolute -right-1 -top-1 h-4 min-w-4 rounded-sm px-1 text-[10px]">
                  {counts.notifications}
                </Badge>
              ) : null}
            </Link>
          </Button>

          <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-sm" asChild>
            <Link href="/tasks">
              <CheckSquare className="h-4 w-4" />
              {counts.tasks > 0 ? (
                <Badge className="absolute -right-1 -top-1 h-4 min-w-4 rounded-sm bg-amber-500 px-1 text-[10px] text-white hover:bg-amber-500">
                  {counts.tasks}
                </Badge>
              ) : null}
            </Link>
          </Button>

          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-sm" asChild>
            <Link href="/reports">
              <HelpCircle className="h-4 w-4" />
            </Link>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-9 gap-2 rounded-sm border border-transparent pl-2 pr-1 hover:border-border">
                <Avatar className="h-7 w-7 rounded-sm">
                  <AvatarFallback className="rounded-sm bg-primary text-xs text-primary-foreground">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden text-left lg:block">
                  <div className="max-w-[160px] truncate text-sm font-medium text-foreground">{userName}</div>
                  <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                    {activeRole?.name ?? "Role"}
                  </div>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60 rounded-sm">
              <DropdownMenuLabel>
                <div className="space-y-1">
                  <div className="font-medium">{userName}</div>
                  <div className="text-xs text-muted-foreground">{currentUser?.email ?? "demo@financeos.app"}</div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer rounded-sm">
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer rounded-sm">
                <Link href="/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer rounded-sm text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
