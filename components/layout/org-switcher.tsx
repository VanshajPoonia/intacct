"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { 
  Building2, 
  ChevronDown, 
  Check, 
  Plus, 
  Settings,
  Search,
  Globe,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Organization {
  id: string
  name: string
  code: string
  type: 'production' | 'sandbox' | 'demo'
  role: string
  entitiesCount: number
  currency: string
}

const mockOrganizations: Organization[] = [
  { 
    id: 'org1', 
    name: 'Acme Corporation', 
    code: 'ACME', 
    type: 'production', 
    role: 'Admin',
    entitiesCount: 4,
    currency: 'USD',
  },
  { 
    id: 'org2', 
    name: 'Acme Corp - Sandbox', 
    code: 'ACME-SB', 
    type: 'sandbox', 
    role: 'Admin',
    entitiesCount: 4,
    currency: 'USD',
  },
  { 
    id: 'org3', 
    name: 'Beta Industries', 
    code: 'BETA', 
    type: 'production', 
    role: 'Viewer',
    entitiesCount: 2,
    currency: 'EUR',
  },
  { 
    id: 'org4', 
    name: 'FinanceOS Demo', 
    code: 'DEMO', 
    type: 'demo', 
    role: 'Admin',
    entitiesCount: 3,
    currency: 'USD',
  },
]

interface OrgSwitcherProps {
  collapsed?: boolean
}

export function OrgSwitcher({ collapsed = false }: OrgSwitcherProps) {
  const router = useRouter()
  const [currentOrg, setCurrentOrg] = useState<Organization>(mockOrganizations[0])
  const [searchQuery, setSearchQuery] = useState("")
  const [switchDialogOpen, setSwitchDialogOpen] = useState(false)
  const [pendingOrg, setPendingOrg] = useState<Organization | null>(null)

  const filteredOrgs = mockOrganizations.filter(org => 
    org.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    org.code.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleOrgSelect = (org: Organization) => {
    if (org.id === currentOrg.id) return
    setPendingOrg(org)
    setSwitchDialogOpen(true)
  }

  const confirmSwitch = () => {
    if (pendingOrg) {
      setCurrentOrg(pendingOrg)
      setSwitchDialogOpen(false)
      setPendingOrg(null)
      // In a real app, this would trigger a full context refresh
      router.refresh()
    }
  }

  const getTypeColor = (type: Organization['type']) => {
    switch (type) {
      case 'production': return 'bg-emerald-500'
      case 'sandbox': return 'bg-amber-500'
      case 'demo': return 'bg-blue-500'
    }
  }

  const getTypeBadge = (type: Organization['type']) => {
    switch (type) {
      case 'production': return null
      case 'sandbox': return <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800">Sandbox</Badge>
      case 'demo': return <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800">Demo</Badge>
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            className={cn(
              "w-full justify-start gap-2 h-auto py-2",
              collapsed && "justify-center px-2"
            )}
          >
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarFallback className="rounded-lg bg-primary text-primary-foreground text-xs font-semibold">
                {currentOrg.code.slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <>
                <div className="flex flex-col items-start text-left flex-1 min-w-0">
                  <span className="text-sm font-medium truncate w-full">{currentOrg.name}</span>
                  <span className="text-xs text-muted-foreground">{currentOrg.role}</span>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-72">
          <div className="p-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search organizations..." 
                className="pl-8 h-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
            Organizations
          </DropdownMenuLabel>
          <div className="max-h-64 overflow-y-auto">
            {filteredOrgs.map((org) => (
              <DropdownMenuItem 
                key={org.id}
                onClick={() => handleOrgSelect(org)}
                className="flex items-start gap-3 py-2.5 cursor-pointer"
              >
                <div className="relative">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarFallback className="rounded-lg bg-muted text-xs font-medium">
                      {org.code.slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className={cn(
                    "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background",
                    getTypeColor(org.type)
                  )} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">{org.name}</span>
                    {org.id === currentOrg.id && (
                      <Check className="h-4 w-4 text-primary shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">{org.role}</span>
                    {getTypeBadge(org.type)}
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="gap-2">
            <Plus className="h-4 w-4" />
            Request New Organization
          </DropdownMenuItem>
          <DropdownMenuItem className="gap-2">
            <Settings className="h-4 w-4" />
            Organization Settings
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Switch Confirmation Dialog */}
      <Dialog open={switchDialogOpen} onOpenChange={setSwitchDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Switch Organization</DialogTitle>
            <DialogDescription>
              You are about to switch to a different organization. Any unsaved changes will be lost.
            </DialogDescription>
          </DialogHeader>
          {pendingOrg && (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
              <Avatar className="h-10 w-10 rounded-lg">
                <AvatarFallback className="rounded-lg bg-primary text-primary-foreground font-semibold">
                  {pendingOrg.code.slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{pendingOrg.name}</span>
                  {getTypeBadge(pendingOrg.type)}
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground mt-0.5">
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5" />
                    {pendingOrg.entitiesCount} entities
                  </span>
                  <span className="flex items-center gap-1">
                    <Globe className="h-3.5 w-3.5" />
                    {pendingOrg.currency}
                  </span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSwitchDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmSwitch}>
              Switch Organization
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
