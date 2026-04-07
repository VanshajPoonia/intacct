"use client"

import { Building2, Check, ChevronDown } from "lucide-react"
import { useWorkspaceShell } from "@/components/layout/workspace-shell-provider"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface OrgSwitcherProps {
  collapsed?: boolean
}

export function OrgSwitcher({ collapsed = false }: OrgSwitcherProps) {
  const { activeEntity, activeRole, entities, setActiveEntity } = useWorkspaceShell()

  if (!activeEntity || !activeRole) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn("h-auto w-full justify-start gap-2 rounded-sm px-2 py-2", collapsed && "justify-center px-1.5")}
        >
          <Avatar className="h-8 w-8 rounded-sm">
            <AvatarFallback className="rounded-sm bg-primary text-xs font-semibold text-primary-foreground">
              {activeEntity.code.slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          {!collapsed ? (
            <>
              <div className="min-w-0 flex-1 text-left">
                <div className="truncate text-sm font-medium text-foreground">{activeEntity.name}</div>
                <div className="truncate text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  {activeRole.name}
                </div>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72 rounded-sm">
        <DropdownMenuLabel className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Active Entity
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {entities.map(entity => (
          <DropdownMenuItem
            key={entity.id}
            onClick={() => setActiveEntity(entity.id)}
            className="cursor-pointer gap-3 rounded-sm py-2.5"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-muted">
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{entity.name}</div>
              <div className="text-xs text-muted-foreground">
                {entity.code} · {entity.currency}
              </div>
            </div>
            {entity.id === activeEntity.id ? <Check className="h-4 w-4 text-primary" /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
