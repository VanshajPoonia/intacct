"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Building2, 
  Users, 
  MapPin, 
  Layers, 
  Calendar,
  ArrowRight,
  Globe,
  Settings,
  ChevronRight,
  TrendingUp,
} from "lucide-react"
import { getEntities, getDimensions } from "@/lib/services"
import type { Entity, Dimension } from "@/lib/types"

interface QuickStat {
  label: string
  value: string | number
  change?: string
  trend?: "up" | "down" | "neutral"
}

export default function CompanyPage() {
  const [entities, setEntities] = useState<Entity[]>([])
  const [dimensions, setDimensions] = useState<Dimension[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const [entitiesData, dimensionsData] = await Promise.all([
        getEntities(),
        getDimensions(),
      ])
      setEntities(entitiesData)
      setDimensions(dimensionsData)
      setLoading(false)
    }
    fetchData()
  }, [])

  const stats: QuickStat[] = [
    { label: "Entities", value: entities.filter(e => e.type !== 'consolidated').length, change: "+1 this quarter", trend: "up" },
    { label: "Departments", value: dimensions.filter(d => d.type === 'department').length },
    { label: "Locations", value: dimensions.filter(d => d.type === 'location').length },
    { label: "Employees", value: 156, change: "+12 YTD", trend: "up" },
  ]

  const modules = [
    {
      title: "Entities",
      description: "Manage legal entities, subsidiaries, and consolidated groups",
      icon: Building2,
      href: "/company/entities",
      stats: `${entities.filter(e => e.type !== 'consolidated').length} active entities`,
      color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    },
    {
      title: "Departments",
      description: "Organize your company structure by department",
      icon: Users,
      href: "/company/departments",
      stats: `${dimensions.filter(d => d.type === 'department').length} departments`,
      color: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    },
    {
      title: "Locations",
      description: "Manage office locations and geographic presence",
      icon: MapPin,
      href: "/company/locations",
      stats: `${dimensions.filter(d => d.type === 'location').length} locations`,
      color: "bg-green-500/10 text-green-600 dark:text-green-400",
    },
    {
      title: "Employees",
      description: "Employee directory and HR information",
      icon: Users,
      href: "/company/employees",
      stats: "156 employees",
      color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    },
    {
      title: "Dimensions",
      description: "Configure custom tracking dimensions for reporting",
      icon: Layers,
      href: "/company/dimensions",
      stats: `${dimensions.length} dimensions`,
      color: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
    },
    {
      title: "Fiscal Calendar",
      description: "Set up accounting periods and fiscal year settings",
      icon: Calendar,
      href: "/company/calendar",
      stats: "FY 2026 active",
      color: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    },
  ]

  if (loading) {
    return (
      <AppShell>
        <div className="p-6 space-y-6">
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Company</h1>
            <p className="text-muted-foreground">
              Manage your organizational structure, entities, and company settings
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/admin/settings">
              <Settings className="h-4 w-4 mr-2" />
              Company Settings
            </Link>
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{stat.label}</span>
                  {stat.trend === "up" && <TrendingUp className="h-4 w-4 text-green-500" />}
                </div>
                <div className="mt-1">
                  <span className="text-2xl font-bold">{stat.value}</span>
                </div>
                {stat.change && (
                  <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map((module) => {
            const Icon = module.icon
            return (
              <Link key={module.title} href={module.href}>
                <Card className="h-full hover:shadow-md transition-shadow cursor-pointer group">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className={`p-2.5 rounded-lg ${module.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <CardTitle className="text-lg mt-3">{module.title}</CardTitle>
                    <CardDescription>{module.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Badge variant="secondary" className="text-xs">
                      {module.stats}
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>

        {/* Entity Summary */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Entity Structure</CardTitle>
                <CardDescription>Your organizational hierarchy</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/company/entities">
                  View All
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {entities.slice(0, 4).map((entity) => (
                <div 
                  key={entity.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      entity.type === 'primary' 
                        ? 'bg-blue-500/10' 
                        : entity.type === 'consolidated' 
                          ? 'bg-purple-500/10' 
                          : 'bg-gray-500/10'
                    }`}>
                      {entity.type === 'consolidated' ? (
                        <Globe className="h-4 w-4 text-purple-600" />
                      ) : (
                        <Building2 className={`h-4 w-4 ${
                          entity.type === 'primary' ? 'text-blue-600' : 'text-muted-foreground'
                        }`} />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{entity.name}</p>
                      <p className="text-sm text-muted-foreground">{entity.code}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{entity.currency}</Badge>
                    <Badge variant={entity.type === 'primary' ? 'default' : 'secondary'} className="capitalize">
                      {entity.type}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
