"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import type { MegaMenuGroup } from "@/lib/types"

interface MegaMenuProps {
  groups: MegaMenuGroup[]
  moduleLabel: string
  onClose: () => void
}

export function MegaMenu({ groups, moduleLabel, onClose }: MegaMenuProps) {
  return (
    <>
      <div
        className="fixed inset-0 top-[6.25rem] z-40 bg-foreground/5 backdrop-blur-[1px]"
        onClick={onClose}
      />

      <div
        className="absolute inset-x-0 z-50 border-b border-border/80 bg-card/95 shadow-[0_18px_40px_rgba(15,23,42,0.08)] animate-in fade-in-0 slide-in-from-top-2 duration-200"
      >
        <div className="mx-auto flex max-w-[1680px] flex-col gap-5 px-6 py-5">
          <div className="flex items-center justify-between gap-4 border-b border-border/70 pb-4">
            <div className="space-y-1">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Module Navigation
              </div>
              <div className="text-sm font-semibold text-foreground">{moduleLabel}</div>
            </div>
          </div>
          <div className={cn("grid gap-8", groups.length > 2 ? "lg:grid-cols-3" : "lg:grid-cols-2")}>
            {groups.map(group => (
              <div key={group.id} className="space-y-3">
                <div className="space-y-1">
                  <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    {group.label}
                  </h3>
                  {group.description ? <p className="text-xs text-muted-foreground">{group.description}</p> : null}
                </div>
                <ul className="space-y-1">
                  {group.items.map(item => (
                    <li key={item.id}>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        className={cn(
                          "flex min-h-16 flex-col justify-center rounded-sm border border-transparent px-3 py-2.5 transition-colors",
                          "hover:border-border hover:bg-muted/60 focus:border-border focus:bg-muted/60 focus:outline-none"
                        )}
                      >
                        <span className="text-sm font-medium text-foreground">
                          {item.label}
                        </span>
                        {item.description ? (
                          <span className="mt-1 text-xs text-muted-foreground">
                            {item.description}
                          </span>
                        ) : null}
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
