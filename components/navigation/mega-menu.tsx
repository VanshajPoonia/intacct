"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import type { MegaMenuGroup } from "@/lib/types"

interface MegaMenuProps {
  groups: MegaMenuGroup[]
  onClose: () => void
  onMouseEnter: () => void
  onMouseLeave: () => void
}

export function MegaMenu({ groups, onClose, onMouseEnter, onMouseLeave }: MegaMenuProps) {
  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 top-[6.5rem] z-40 bg-foreground/5 backdrop-blur-[1px]"
        onClick={onClose}
      />
      
      {/* Menu Panel */}
      <div 
        className="absolute left-0 right-0 z-50 border-b border-border bg-card shadow-lg animate-in fade-in-0 slide-in-from-top-2 duration-200"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <div className="mx-auto max-w-7xl px-6 py-6">
          <div className="grid grid-cols-3 gap-8">
            {groups.map((group, groupIndex) => (
              <div key={groupIndex} className="space-y-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {group.label}
                </h3>
                <ul className="space-y-1">
                  {group.items.map((item, itemIndex) => (
                    <li key={itemIndex}>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        className={cn(
                          "flex flex-col rounded-md px-3 py-2 transition-colors",
                          "hover:bg-muted focus:bg-muted focus:outline-none"
                        )}
                      >
                        <span className="text-sm font-medium text-foreground">
                          {item.label}
                        </span>
                        {item.description && (
                          <span className="text-xs text-muted-foreground mt-0.5">
                            {item.description}
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
