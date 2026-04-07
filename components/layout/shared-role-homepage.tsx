"use client"

import type { RoleHomepageData } from "@/lib/types"
import { HomepageSectionGrid } from "./homepage-primitives"

export function SharedRoleHomepage({ data }: { data: RoleHomepageData }) {
  const fullSections = data.sections.filter(section => section.area === "full")
  const mainSections = data.sections.filter(section => section.area === "main")
  const railSections = data.sections.filter(section => section.area === "rail")

  return (
    <div className="space-y-6">
      {fullSections.map(section => (
        <HomepageSectionGrid key={section.id} section={section} />
      ))}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          {mainSections.map(section => (
            <HomepageSectionGrid key={section.id} section={section} />
          ))}
        </div>
        <div className="space-y-6">
          {railSections.map(section => (
            <HomepageSectionGrid key={section.id} section={section} className="grid-cols-1" />
          ))}
        </div>
      </div>
    </div>
  )
}
