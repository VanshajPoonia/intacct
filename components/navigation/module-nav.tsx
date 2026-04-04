"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { 
  LayoutDashboard,
  FileText,
  Building2,
  Banknote,
  BookOpen,
  Receipt,
  CreditCard,
  ShoppingCart,
  Package,
  FolderKanban,
  Clock,
  Network,
  Settings,
  ChevronDown
} from "lucide-react"
import { cn } from "@/lib/utils"
import { navModules } from "@/lib/mock-data"
import { MegaMenu } from "./mega-menu"

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  FileText,
  Building2,
  Banknote,
  BookOpen,
  Receipt,
  CreditCard,
  ShoppingCart,
  Package,
  FolderKanban,
  Clock,
  Network,
  Settings,
}

export function ModuleNav() {
  const pathname = usePathname()
  const [activeModule, setActiveModule] = useState<string | null>(null)
  const navRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Close mega menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setActiveModule(null)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle keyboard navigation
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setActiveModule(null)
      }
    }
    
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  const handleModuleClick = (moduleId: string, hasMenu: boolean) => {
    if (hasMenu) {
      setActiveModule(activeModule === moduleId ? null : moduleId)
    } else {
      setActiveModule(null)
    }
  }

  const handleMouseEnter = (moduleId: string, hasMenu: boolean) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    if (hasMenu && activeModule) {
      setActiveModule(moduleId)
    }
  }

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setActiveModule(null)
    }, 150)
  }

  const handleMenuMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
  }

  return (
    <div ref={navRef} className="relative">
      <nav className="flex items-center border-b border-border bg-card px-4 overflow-x-auto">
        <div className="flex items-center gap-0.5">
          {navModules.map((module) => {
            const Icon = iconMap[module.icon] || LayoutDashboard
            const isActive = module.href 
              ? pathname === module.href 
              : pathname.startsWith(`/${module.id}`)
            const hasMenu = !!module.megaMenu
            const isMenuOpen = activeModule === module.id

            return (
              <div
                key={module.id}
                className="relative"
                onMouseEnter={() => handleMouseEnter(module.id, hasMenu)}
                onMouseLeave={handleMouseLeave}
              >
                {module.href && !hasMenu ? (
                  <Link href={module.href}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "h-10 px-3 gap-1.5 rounded-none border-b-2 border-transparent text-muted-foreground hover:text-foreground hover:bg-transparent",
                        isActive && "border-b-primary text-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-sm font-medium hidden lg:block">{module.label}</span>
                    </Button>
                  </Link>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleModuleClick(module.id, hasMenu)}
                    className={cn(
                      "h-10 px-3 gap-1.5 rounded-none border-b-2 border-transparent text-muted-foreground hover:text-foreground hover:bg-transparent",
                      isActive && "border-b-primary text-foreground",
                      isMenuOpen && "text-foreground bg-muted"
                    )}
                    aria-expanded={isMenuOpen}
                    aria-haspopup={hasMenu}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-medium hidden lg:block">{module.label}</span>
                    {hasMenu && (
                      <ChevronDown className={cn(
                        "h-3 w-3 transition-transform hidden lg:block",
                        isMenuOpen && "rotate-180"
                      )} />
                    )}
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      </nav>

      {/* Mega Menu Overlay */}
      {activeModule && (() => {
        const module = navModules.find(m => m.id === activeModule)
        if (module?.megaMenu) {
          return (
            <MegaMenu
              groups={module.megaMenu}
              onClose={() => setActiveModule(null)}
              onMouseEnter={handleMenuMouseEnter}
              onMouseLeave={handleMouseLeave}
            />
          )
        }
        return null
      })()}
    </div>
  )
}
