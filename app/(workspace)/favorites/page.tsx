"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { AppShell } from "@/components/layout/app-shell"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { 
  getSavedReports, 
  getSavedViews, 
  getVendors, 
  getCustomers,
  toggleReportFavorite
} from "@/lib/services"
import type { SavedReport, SavedView, Vendor, Customer } from "@/lib/types"
import { 
  Star, 
  FileText, 
  Filter, 
  Building2, 
  Users, 
  ExternalLink,
  Clock,
  Trash2
} from "lucide-react"
import { formatDate } from "@/lib/utils"

interface FavoriteItem {
  id: string
  type: "report" | "view" | "vendor" | "customer"
  title: string
  description?: string
  href: string
  lastAccessed?: Date
  category?: string
}

export default function FavoritesPage() {
  const [loading, setLoading] = useState(true)
  const [favorites, setFavorites] = useState<FavoriteItem[]>([])
  const [recentlyViewed, setRecentlyViewed] = useState<FavoriteItem[]>([])

  useEffect(() => {
    async function loadFavorites() {
      setLoading(true)
      
      const [reports, views, vendors, customers] = await Promise.all([
        getSavedReports(),
        getSavedViews(),
        getVendors(),
        getCustomers(),
      ])

      // Get favorited reports
      const favoritedReports: FavoriteItem[] = reports
        .filter((r: SavedReport) => r.isFavorite)
        .map((r: SavedReport) => ({
          id: r.id,
          type: "report" as const,
          title: r.name,
          description: r.description,
          href: `/reports/${r.id}`,
          lastAccessed: r.lastRun ? new Date(r.lastRun) : undefined,
          category: r.category,
        }))

      // Get default/favorite views
      const favoritedViews: FavoriteItem[] = views
        .filter((v: SavedView) => v.isDefault)
        .map((v: SavedView) => ({
          id: v.id,
          type: "view" as const,
          title: v.name,
          description: `${v.module} saved view`,
          href: `/${v.module.toLowerCase().replace(/\s+/g, '-')}?view=${v.id}`,
          category: v.module,
        }))

      // Get a sample of frequently accessed vendors (simulated)
      const favVendors: FavoriteItem[] = vendors.slice(0, 3).map((v: Vendor) => ({
        id: v.id,
        type: "vendor" as const,
        title: v.name,
        description: `${v.type} vendor`,
        href: `/accounts-payable/vendors/${v.id}`,
        category: v.type,
      }))

      // Get a sample of key customers (simulated)
      const favCustomers: FavoriteItem[] = customers.slice(0, 3).map((c: Customer) => ({
        id: c.id,
        type: "customer" as const,
        title: c.name,
        description: c.industry,
        href: `/accounts-receivable/customers/${c.id}`,
        category: c.industry,
      }))

      setFavorites([...favoritedReports, ...favoritedViews, ...favVendors, ...favCustomers])

      // Simulate recently viewed
      const recent: FavoriteItem[] = [
        ...reports.slice(0, 2).map((r: SavedReport) => ({
          id: r.id,
          type: "report" as const,
          title: r.name,
          description: r.description,
          href: `/reports/${r.id}`,
          lastAccessed: new Date(Date.now() - Math.random() * 86400000 * 7),
          category: r.category,
        })),
        ...vendors.slice(0, 2).map((v: Vendor) => ({
          id: v.id,
          type: "vendor" as const,
          title: v.name,
          description: `${v.type} vendor`,
          href: `/accounts-payable/vendors/${v.id}`,
          lastAccessed: new Date(Date.now() - Math.random() * 86400000 * 7),
          category: v.type,
        })),
      ].sort((a, b) => (b.lastAccessed?.getTime() || 0) - (a.lastAccessed?.getTime() || 0))

      setRecentlyViewed(recent)
      setLoading(false)
    }

    loadFavorites()
  }, [])

  const handleRemoveFavorite = async (item: FavoriteItem) => {
    if (item.type === "report") {
      await toggleReportFavorite(item.id)
      setFavorites(prev => prev.filter(f => f.id !== item.id))
    }
  }

  const getTypeIcon = (type: FavoriteItem["type"]) => {
    switch (type) {
      case "report": return <FileText className="h-4 w-4" />
      case "view": return <Filter className="h-4 w-4" />
      case "vendor": return <Building2 className="h-4 w-4" />
      case "customer": return <Users className="h-4 w-4" />
    }
  }

  const getTypeBadgeColor = (type: FavoriteItem["type"]) => {
    switch (type) {
      case "report": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
      case "view": return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
      case "vendor": return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
      case "customer": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
    }
  }

  const reportFavorites = favorites.filter(f => f.type === "report")
  const viewFavorites = favorites.filter(f => f.type === "view")
  const vendorFavorites = favorites.filter(f => f.type === "vendor")
  const customerFavorites = favorites.filter(f => f.type === "customer")

  return (
    <AppShell>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Favorites</h1>
            <p className="text-muted-foreground">Quick access to your starred items and recent activity</p>
          </div>
          <Badge variant="secondary" className="text-xs">
            {favorites.length} items
          </Badge>
        </div>

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">All ({favorites.length})</TabsTrigger>
            <TabsTrigger value="reports">Reports ({reportFavorites.length})</TabsTrigger>
            <TabsTrigger value="views">Views ({viewFavorites.length})</TabsTrigger>
            <TabsTrigger value="vendors">Vendors ({vendorFavorites.length})</TabsTrigger>
            <TabsTrigger value="customers">Customers ({customerFavorites.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            {/* Recently Viewed Section */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-base">Recently Viewed</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : recentlyViewed.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">No recent items</p>
                ) : (
                  <div className="space-y-2">
                    {recentlyViewed.map(item => (
                      <Link key={item.id} href={item.href}>
                        <div className="flex items-center justify-between p-3 rounded-md border border-transparent hover:border-border hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center">
                              {getTypeIcon(item.type)}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{item.title}</p>
                              <p className="text-xs text-muted-foreground">{item.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {item.lastAccessed && formatDate(item.lastAccessed)}
                            </span>
                            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* All Favorites */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-500" />
                  <CardTitle className="text-base">All Favorites</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                      <Skeleton key={i} className="h-24 w-full" />
                    ))}
                  </div>
                ) : favorites.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                    <Star className="h-12 w-12 mb-4 opacity-50" />
                    <p className="font-medium">No favorites yet</p>
                    <p className="text-sm mt-1">Star reports, views, or records to see them here</p>
                  </div>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {favorites.map(item => (
                      <div 
                        key={item.id} 
                        className="group relative p-4 rounded-lg border border-border hover:border-primary/50 transition-colors"
                      >
                        <Link href={item.href} className="block">
                          <div className="flex items-start gap-3">
                            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                              {getTypeIcon(item.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{item.title}</p>
                              <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                              <div className="mt-2 flex items-center gap-2">
                                <Badge variant="secondary" className={`text-[10px] ${getTypeBadgeColor(item.type)}`}>
                                  {item.type}
                                </Badge>
                                {item.category && (
                                  <Badge variant="outline" className="text-[10px]">
                                    {item.category}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </Link>
                        {item.type === "report" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.preventDefault()
                              handleRemoveFavorite(item)
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports">
            <Card>
              <CardContent className="pt-6">
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : reportFavorites.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    <p className="font-medium">No favorite reports</p>
                    <p className="text-sm mt-1">Star reports from the Reports page</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {reportFavorites.map(item => (
                      <Link key={item.id} href={item.href}>
                        <div className="flex items-center justify-between p-4 rounded-lg border hover:border-primary/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <p className="font-medium">{item.title}</p>
                              <p className="text-sm text-muted-foreground">{item.description}</p>
                            </div>
                          </div>
                          <ExternalLink className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Views Tab */}
          <TabsContent value="views">
            <Card>
              <CardContent className="pt-6">
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2].map(i => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : viewFavorites.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Filter className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    <p className="font-medium">No default views</p>
                    <p className="text-sm mt-1">Set a view as default in any list workspace</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {viewFavorites.map(item => (
                      <Link key={item.id} href={item.href}>
                        <div className="flex items-center justify-between p-4 rounded-lg border hover:border-primary/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                              <Filter className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                              <p className="font-medium">{item.title}</p>
                              <p className="text-sm text-muted-foreground">{item.description}</p>
                            </div>
                          </div>
                          <ExternalLink className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Vendors Tab */}
          <TabsContent value="vendors">
            <Card>
              <CardContent className="pt-6">
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : vendorFavorites.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Building2 className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    <p className="font-medium">No favorite vendors</p>
                    <p className="text-sm mt-1">Star vendors from the AP workspace</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {vendorFavorites.map(item => (
                      <Link key={item.id} href={item.href}>
                        <div className="flex items-center justify-between p-4 rounded-lg border hover:border-primary/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                              <Building2 className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div>
                              <p className="font-medium">{item.title}</p>
                              <p className="text-sm text-muted-foreground">{item.description}</p>
                            </div>
                          </div>
                          <ExternalLink className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Customers Tab */}
          <TabsContent value="customers">
            <Card>
              <CardContent className="pt-6">
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : customerFavorites.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    <p className="font-medium">No favorite customers</p>
                    <p className="text-sm mt-1">Star customers from the AR workspace</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {customerFavorites.map(item => (
                      <Link key={item.id} href={item.href}>
                        <div className="flex items-center justify-between p-4 rounded-lg border hover:border-primary/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                              <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                              <p className="font-medium">{item.title}</p>
                              <p className="text-sm text-muted-foreground">{item.description}</p>
                            </div>
                          </div>
                          <ExternalLink className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  )
}
