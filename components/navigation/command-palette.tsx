"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useWorkspaceShellOptional } from "@/components/layout/workspace-shell-provider"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { getShellIcon } from "@/lib/utils/shell-icons"

interface CommandPaletteProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter()
  const shell = useWorkspaceShellOptional()
  const [search, setSearch] = useState("")

  const isOpen = open ?? shell?.commandPaletteOpen ?? false
  const setOpen = onOpenChange ?? shell?.setCommandPaletteOpen ?? (() => {})
  const groups = shell?.commandGroups ?? []

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setOpen(!isOpen)
      }
    }

    document.addEventListener("keydown", handleKeydown)
    return () => document.removeEventListener("keydown", handleKeydown)
  }, [isOpen, setOpen])

  const filteredGroups = useMemo(() => {
    if (!search.trim()) {
      return groups
    }

    const query = search.toLowerCase()

    return groups
      .map(group => ({
        ...group,
        items: group.items.filter(item => {
          const haystack = [item.label, item.description, ...(item.keywords ?? [])]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()

          return haystack.includes(query)
        }),
      }))
      .filter(group => group.items.length > 0)
  }, [groups, search])

  const handleSelect = (href: string) => {
    setOpen(false)
    setSearch("")
    router.push(href)
  }

  return (
    <CommandDialog open={isOpen} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Search navigation, create actions, and finance workspaces..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No matching workspace actions.</CommandEmpty>
        {filteredGroups.map((group, index) => (
          <div key={group.id}>
            <CommandGroup heading={group.label}>
              {group.items.map(item => {
                const Icon = getShellIcon(item.icon)
                return (
                  <CommandItem key={item.id} onSelect={() => handleSelect(item.href)} className="gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate">{item.label}</div>
                      {item.description ? <div className="truncate text-xs text-muted-foreground">{item.description}</div> : null}
                    </div>
                  </CommandItem>
                )
              })}
            </CommandGroup>
            {index < filteredGroups.length - 1 ? <CommandSeparator /> : null}
          </div>
        ))}
      </CommandList>
    </CommandDialog>
  )
}
