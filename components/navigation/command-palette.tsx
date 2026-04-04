"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  LayoutDashboard,
  BookOpen,
  Receipt,
  CreditCard,
  Banknote,
  FileText,
  Building,
  Users,
  Hash,
  Plus,
} from "lucide-react"
import { searchableItems } from "@/lib/mock-data"

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  BookOpen,
  Receipt,
  CreditCard,
  Banknote,
  FileText,
  Building,
  Users,
  Hash,
  Plus,
}

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter()
  const [search, setSearch] = useState("")

  // Keyboard shortcut to open
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        onOpenChange(!open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [open, onOpenChange])

  // Group items by type
  const groupedItems = useMemo(() => {
    const filtered = search
      ? searchableItems.filter(item =>
          item.label.toLowerCase().includes(search.toLowerCase()) ||
          (item.meta && item.meta.toLowerCase().includes(search.toLowerCase()))
        )
      : searchableItems

    return {
      modules: filtered.filter(item => item.type === 'module'),
      reports: filtered.filter(item => item.type === 'report'),
      vendors: filtered.filter(item => item.type === 'vendor'),
      customers: filtered.filter(item => item.type === 'customer'),
      accounts: filtered.filter(item => item.type === 'account'),
      transactions: filtered.filter(item => item.type === 'transaction'),
    }
  }, [search])

  const handleSelect = (href: string) => {
    onOpenChange(false)
    setSearch("")
    router.push(href)
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search modules, reports, vendors, customers..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {/* Quick Actions */}
        {groupedItems.transactions.length > 0 && (
          <>
            <CommandGroup heading="Quick Actions">
              {groupedItems.transactions.map((item) => {
                const Icon = iconMap[item.icon] || FileText
                return (
                  <CommandItem
                    key={item.href}
                    onSelect={() => handleSelect(item.href)}
                    className="gap-2"
                  >
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span>{item.label}</span>
                  </CommandItem>
                )
              })}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* Modules */}
        {groupedItems.modules.length > 0 && (
          <>
            <CommandGroup heading="Modules">
              {groupedItems.modules.map((item) => {
                const Icon = iconMap[item.icon] || LayoutDashboard
                return (
                  <CommandItem
                    key={item.href}
                    onSelect={() => handleSelect(item.href)}
                    className="gap-2"
                  >
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span>{item.label}</span>
                  </CommandItem>
                )
              })}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* Reports */}
        {groupedItems.reports.length > 0 && (
          <>
            <CommandGroup heading="Reports">
              {groupedItems.reports.map((item) => {
                const Icon = iconMap[item.icon] || FileText
                return (
                  <CommandItem
                    key={item.href}
                    onSelect={() => handleSelect(item.href)}
                    className="gap-2"
                  >
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span>{item.label}</span>
                  </CommandItem>
                )
              })}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* Vendors */}
        {groupedItems.vendors.length > 0 && (
          <CommandGroup heading="Vendors">
            {groupedItems.vendors.slice(0, 5).map((item) => {
              const Icon = iconMap[item.icon] || Building
              return (
                <CommandItem
                  key={item.href}
                  onSelect={() => handleSelect(item.href)}
                  className="gap-2"
                >
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span>{item.label}</span>
                  {item.meta && (
                    <span className="ml-auto text-xs text-muted-foreground">
                      {item.meta}
                    </span>
                  )}
                </CommandItem>
              )
            })}
          </CommandGroup>
        )}

        {/* Customers */}
        {groupedItems.customers.length > 0 && (
          <CommandGroup heading="Customers">
            {groupedItems.customers.slice(0, 5).map((item) => {
              const Icon = iconMap[item.icon] || Users
              return (
                <CommandItem
                  key={item.href}
                  onSelect={() => handleSelect(item.href)}
                  className="gap-2"
                >
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span>{item.label}</span>
                  {item.meta && (
                    <span className="ml-auto text-xs text-muted-foreground">
                      {item.meta}
                    </span>
                  )}
                </CommandItem>
              )
            })}
          </CommandGroup>
        )}

        {/* Accounts */}
        {groupedItems.accounts.length > 0 && (
          <CommandGroup heading="Accounts">
            {groupedItems.accounts.slice(0, 5).map((item) => {
              const Icon = iconMap[item.icon] || Hash
              return (
                <CommandItem
                  key={item.href}
                  onSelect={() => handleSelect(item.href)}
                  className="gap-2"
                >
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{item.label}</span>
                  {item.meta && (
                    <span className="ml-auto text-xs text-muted-foreground capitalize">
                      {item.meta}
                    </span>
                  )}
                </CommandItem>
              )
            })}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  )
}
