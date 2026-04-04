"use client"

import { AppShell } from "@/components/layout/app-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Star } from "lucide-react"

export default function FavoritesPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Favorites</h1>
          <p className="text-muted-foreground">Quick access to your starred items</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Starred Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <Star className="h-12 w-12 mb-4 opacity-50" />
              <p className="font-medium">No favorites yet</p>
              <p className="text-sm mt-1">Star reports, transactions, or vendors to see them here</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
