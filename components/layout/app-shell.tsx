"use client"

import { useState, useCallback } from "react"
import { AppHeader } from "./app-header"
import { AppSidebar } from "./app-sidebar"
import { ModuleNav } from "@/components/navigation/module-nav"
import { UtilityRail } from "./utility-rail"
import { CommandPalette } from "@/components/navigation/command-palette"
import { cn } from "@/lib/utils"

interface AppShellProps {
  children: React.ReactNode
  showUtilityRail?: boolean
}

export function AppShell({ children, showUtilityRail = false }: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)

  const handleSearchClick = useCallback(() => {
    setCommandPaletteOpen(true)
  }, [])

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Top Header */}
      <AppHeader onSearchClick={handleSearchClick} />
      
      {/* Module Navigation */}
      <ModuleNav />

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <AppSidebar 
          collapsed={sidebarCollapsed} 
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
        />

        {/* Main Content */}
        <main className={cn(
          "flex-1 overflow-y-auto bg-background p-6",
          "transition-all duration-200"
        )}>
          {children}
        </main>

        {/* Right Utility Rail */}
        {showUtilityRail && <UtilityRail />}
      </div>

      {/* Command Palette */}
      <CommandPalette 
        open={commandPaletteOpen} 
        onOpenChange={setCommandPaletteOpen} 
      />
    </div>
  )
}
