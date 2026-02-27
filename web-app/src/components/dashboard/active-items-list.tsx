"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { formatDistanceToNow } from "date-fns"
import { Clock, Coins, ChevronRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface RecentCoin {
  id: string
  title: string
  denomination: string
  year: number
  country: string
  purchase_price: number
  created_at: string
  mint_mark?: string
  grade?: string
}

interface ActiveItemsListProps {
  onSelect: (coin: RecentCoin) => void
  selectedId?: string
}

export function ActiveItemsList({ onSelect, selectedId }: ActiveItemsListProps) {
  const [recentCoins, setRecentCoins] = useState<RecentCoin[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRecentActivity()

    const channel = supabase
      .channel("recent-coins-dashboard")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "coins" },
        () => loadRecentActivity()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const loadRecentActivity = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data: collections } = await supabase
        .from("collections")
        .select("id")
        .eq("user_id", user.id)

      if (!collections || collections.length === 0) {
        setRecentCoins([])
        setLoading(false)
        return
      }

      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { data: coins } = await supabase
        .from("coins")
        .select(
          "id, title, denomination, year, country, purchase_price, created_at, mint_mark, grade"
        )
        .in(
          "collection_id",
          collections.map((c) => c.id)
        )
        .gte("created_at", thirtyDaysAgo.toISOString())
        .order("created_at", { ascending: false })
        .limit(10)

      setRecentCoins(coins || [])
    } catch (error) {
      console.error("Error loading recent activity:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          Recent Activity
        </CardTitle>
        <p className="text-xs text-muted-foreground">Last 30 days</p>
      </CardHeader>
      <CardContent className="p-0">
        {recentCoins.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <Coins className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No recent activity</p>
            <p className="text-xs text-muted-foreground/60 mt-0.5">
              Add coins to see them here
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {recentCoins.map((coin) => (
              <button
                key={coin.id}
                onClick={() => onSelect(coin)}
                className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-colors hover:bg-accent/50 ${
                  selectedId === coin.id ? "bg-accent" : ""
                }`}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Coins className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {coin.title || `${coin.year} ${coin.denomination}`}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {coin.country}
                    {coin.year && ` · ${coin.year}`}
                    {coin.grade && ` · ${coin.grade}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {coin.purchase_price > 0 && (
                    <span className="text-xs font-medium text-green-500">
                      ${Number(coin.purchase_price).toFixed(2)}
                    </span>
                  )}
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </button>
            ))}
          </div>
        )}

        {recentCoins.length > 0 && (
          <div className="px-4 py-2.5 border-t border-border">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">{recentCoins.length}</span>{" "}
              {recentCoins.length === 1 ? "coin" : "coins"} added recently
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
